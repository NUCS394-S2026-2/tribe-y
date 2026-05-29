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

export interface InvokeReviewerArgs {
  code: string;
  reportType: ReportType;
  fullReport?: boolean;
}

interface JsonRpcEnvelope<T> {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Resolve the RPC endpoint to use against the agent. The agent card
 * advertises an absolute URL derived server-side; that's correct in
 * production where the consultant and reviewer share an origin. In dev
 * the emulator advertises something like `http://127.0.0.1:5002/rpc`
 * which the browser may not be able to reach directly. To keep dev
 * working through the Vite proxy we prefer the same-origin relative
 * `/rpc` whenever the cached endpoint's host doesn't match
 * `window.location.host`.
 */
function resolveRpcEndpoint(card: AgentCard): string {
  if (typeof window === 'undefined') return card.endpoint;
  try {
    const advertised = new URL(card.endpoint);
    if (advertised.host === window.location.host) {
      return card.endpoint;
    }
  } catch {
    // Card endpoint isn't a parseable absolute URL — fall through.
  }
  return '/rpc';
}

/**
 * Invoke the `review` JSON-RPC method on the A2A reviewer agent.
 *
 * Today this call is unauthenticated and free. PR 6 will add an x402
 * payment handshake here (HTTP 402 → Solana transfer → retry with
 * `X-Payment` header). The client signature for this function will not
 * change.
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

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'review',
      params: {
        code: args.code,
        reportType: args.reportType,
        fullReport: args.fullReport ?? false,
      },
    }),
  });

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
