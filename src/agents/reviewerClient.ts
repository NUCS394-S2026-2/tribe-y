import type { SampleReportData } from '../shared/types/ChatSession';
import type { ReportType } from './reportTypes';

/**
 * Mirrors the shape of `AgentCard` served at `/.well-known/agent.json`.
 * Kept in sync with `functions/src/reviewer/agentCard.ts`. The consultant
 * only needs `endpoint` today; the rest is parsed for future use (pricing,
 * method discovery, etc.) and to give callers a typed handle on the card.
 */
export interface AgentCardMethod {
  name: string;
  description: string;
  params: Record<string, unknown> | string;
  result: string;
  paid: boolean;
  pricing?: {
    amount: string;
    currency: string;
    network: string;
    recipient: string | null;
  };
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  endpoint: string;
  methods: AgentCardMethod[];
}

const AGENT_CARD_URL = '/.well-known/agent.json';

let cachedCard: AgentCard | null = null;
let inflightCard: Promise<AgentCard> | null = null;

/**
 * Fetch the A2A agent card. Cached in-module after the first successful
 * call; concurrent callers share a single in-flight request.
 */
export async function fetchAgentCard(): Promise<AgentCard> {
  if (cachedCard) return cachedCard;
  if (inflightCard) return inflightCard;

  inflightCard = (async () => {
    const res = await fetch(AGENT_CARD_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch agent card: HTTP ${res.status} ${res.statusText}`);
    }
    const card = (await res.json()) as AgentCard;
    if (!card || typeof card.endpoint !== 'string' || card.endpoint.length === 0) {
      throw new Error('Agent card missing endpoint');
    }
    cachedCard = card;
    return card;
  })();

  try {
    return await inflightCard;
  } finally {
    inflightCard = null;
  }
}

/** Test-only: clear the cached agent card. */
export function __resetAgentCardCache(): void {
  cachedCard = null;
  inflightCard = null;
}

/**
 * Shape of the JSON body the reviewer service returns on HTTP 402
 * (payment required). The consultant passes this through to a `pay`
 * callback supplied by the React wallet layer; the resulting signature
 * is then sent back as the `X-Payment` header on the retry.
 */
export interface X402Quote {
  amount: number;
  currency: 'SOL_LAMPORTS';
  network: 'solana-devnet';
  recipient: string;
  expiresAt: string;
  nonce: string;
  reason?: string;
}

export interface InvokeReviewerArgs {
  code: string;
  reportType: ReportType;
  fullReport?: boolean;
  /**
   * Supplied by the React orchestrator from `useWallet()` / `useConnection()`.
   * Required when `fullReport: true` and the server returns 402; ignored
   * otherwise. Kept out of this module deliberately so the HTTP client
   * stays free of wallet-adapter imports.
   */
  pay?: (quote: X402Quote) => Promise<string>;
}

interface JsonRpcEnvelope<T> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Resolve the RPC endpoint to use against the agent.
 *
 * Three cases:
 *
 *   1. Same origin as the page → use the card endpoint as-is.
 *   2. Card advertises a localhost-style URL (the dev emulator does this
 *      because it has no way to know the dev server's port) → fall back
 *      to the same-origin relative `/rpc`, which the Vite proxy forwards
 *      to the emulator. Without this dev would break.
 *   3. Otherwise → trust the card. Production deliberately advertises
 *      the direct Cloud Run URL for the reviewer so paid calls bypass
 *      Firebase Hosting's 60s rewrite timeout. Going through `/rpc`
 *      here would 502 us back to Hosting on every reviewFull call.
 */
function resolveRpcEndpoint(card: AgentCard): string {
  if (typeof window === 'undefined') return card.endpoint;
  let advertised: URL;
  try {
    advertised = new URL(card.endpoint);
  } catch {
    return '/rpc';
  }
  if (advertised.host === window.location.host) {
    return card.endpoint;
  }
  const hostname = advertised.hostname.toLowerCase();
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]';
  if (isLocal) {
    return '/rpc';
  }
  return card.endpoint;
}

interface PostRpcArgs {
  endpoint: string;
  requestId: string;
  method: string;
  code: string;
  reportType: ReportType;
  paymentHeader?: string;
}

function buildBody({ requestId, method, code, reportType }: PostRpcArgs): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    method,
    params: { code, reportType },
  });
}

async function postRpc(args: PostRpcArgs): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (args.paymentHeader) headers['X-Payment'] = args.paymentHeader;

  return fetch(args.endpoint, {
    method: 'POST',
    headers,
    body: buildBody(args),
  });
}

/**
 * Invoke the reviewer agent over JSON-RPC.
 *
 * As of PR 6 the server splits the surface into two methods:
 *   - `reviewSample` — free, sample slice of the snippet.
 *   - `reviewFull`   — paid via x402 over Solana devnet (full snippet).
 *
 * PR 7 adds 402 handling: when the server returns HTTP 402, the body is
 * an `X402Quote`. We hand the quote to the caller-supplied `pay` callback
 * (which lives in the wallet layer, not here), receive a Solana tx
 * signature, and retry the same POST with `X-Payment: <signature>`.
 */
export async function invokeReviewer(
  args: InvokeReviewerArgs,
): Promise<SampleReportData> {
  const card = await fetchAgentCard();
  const endpoint = resolveRpcEndpoint(card);

  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const method = args.fullReport ? 'reviewFull' : 'reviewSample';
  const postArgs: PostRpcArgs = {
    endpoint,
    requestId,
    method,
    code: args.code,
    reportType: args.reportType,
  };

  let res = await postRpc(postArgs);

  if (res.status === 402) {
    if (!args.pay) {
      throw new Error('Payment required — connect a wallet first.');
    }
    const quote = (await res.json()) as X402Quote;
    const signature = await args.pay(quote);
    res = await postRpc({ ...postArgs, paymentHeader: signature });
  }

  if (!res.ok) {
    const text = await safeReadText(res);
    throw new Error(
      `Reviewer RPC failed: HTTP ${res.status} ${res.statusText}${
        text ? `: ${text}` : ''
      }`,
    );
  }

  const envelope = (await res.json()) as JsonRpcEnvelope<SampleReportData>;
  if (envelope.error) {
    throw new Error(
      `Reviewer RPC error ${envelope.error.code}: ${envelope.error.message}`,
    );
  }
  if (!envelope.result) {
    throw new Error('Reviewer RPC returned an empty result');
  }
  return envelope.result;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
