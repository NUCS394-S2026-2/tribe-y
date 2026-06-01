import { onRequest } from 'firebase-functions/v2/https';

import { REVIEW_FULL_PRICE_LAMPORTS, REVIEWER_WALLET_ADDRESS } from './wallet.js';

// NOTE: This endpoint is INTENTIONALLY PUBLIC — no Firebase auth.
// `GET /.well-known/agent.json` is the A2A discovery document. By the
// A2A protocol it MUST be reachable unauthenticated so peer agents can
// discover capabilities. Paid methods advertised here will be gated by
// x402 over Solana devnet at the `/rpc` layer in a later PR. Do NOT
// call verifyAuth here.

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

/**
 * Build the agent card document. Pure function so it is unit-testable.
 *
 * @param rpcEndpoint Absolute URL of the `/rpc` endpoint, derived from
 *   the incoming request host. (A2A peers expect an absolute URL.)
 */
export function buildAgentCard(rpcEndpoint: string): AgentCard {
  return {
    name: 'compass.tne.ai Code Reviewer (Bjarne)',
    description:
      'Principal-engineer-grade C++ code review by an agent in the voice of Bjarne Stroustrup.',
    version: '0.1.0',
    endpoint: rpcEndpoint,
    methods: [
      {
        name: 'listReportTypes',
        description: 'Returns the catalog of supported report types.',
        params: {},
        result: '{ reportTypes: ReportTypeDef[] }',
        paid: false,
      },
      {
        name: 'reviewSample',
        description: 'Free sample review on a representative slice. No payment required.',
        params: '{ code: string, reportType: ReportType }',
        result: 'SampleReportData',
        paid: false,
      },
      {
        name: 'reviewFull',
        description:
          'Full C++ review on the entire submitted snippet. Paid: x402 over Solana devnet. On HTTP 402 the response body contains the payment instructions; resubmit the same JSON-RPC body with `X-Payment: <solana tx signature>` to claim the result.',
        params: '{ code: string, reportType: ReportType }',
        result: 'SampleReportData',
        paid: true,
        pricing: {
          amount: String(REVIEW_FULL_PRICE_LAMPORTS),
          currency: 'SOL_LAMPORTS',
          network: 'solana-devnet',
          recipient: REVIEWER_WALLET_ADDRESS,
        },
      },
    ],
  };
}

/**
 * Optional override for the JSON-RPC endpoint advertised in the agent card.
 *
 * Why this exists: in production, Firebase Hosting → Cloud Run rewrites
 * have a hard 60-second edge timeout that's too tight for `reviewFull`
 * (Gemini Pro alone takes 30–60s, plus PDF render + GCS upload). The
 * function itself has its 540s budget, but Hosting's edge cuts the
 * connection at 60s and returns a 502. The fix is to advertise the
 * direct Cloud Run URL so clients call the function past Hosting.
 *
 * Discovery (`GET /.well-known/agent.json`) stays on Hosting because
 * it's instant and benefits from Hosting's caching/CDN. Only the
 * payload-heavy `POST /rpc` path needs to skip Hosting.
 *
 * Set `REVIEWER_RPC_ENDPOINT_OVERRIDE` in the function's environment
 * (e.g. `https://reviewerrpc-<hash>-uc.a.run.app`) and it'll be used
 * verbatim. If unset, fall back to deriving from the request host.
 */
const RPC_ENDPOINT_OVERRIDE = process.env.REVIEWER_RPC_ENDPOINT_OVERRIDE;

/**
 * Derive the absolute `/rpc` URL from an incoming request. Honors the
 * `x-forwarded-*` headers Firebase Hosting sets in front of Cloud
 * Functions, so the URL we advertise matches what clients used to reach us.
 *
 * Protocol resolution order:
 *   1. `REVIEWER_RPC_ENDPOINT_OVERRIDE` env var if set (production: direct
 *      Cloud Run URL to bypass Hosting's 60s rewrite timeout).
 *   2. `x-forwarded-proto` (set by Firebase Hosting / any HTTPS terminator)
 *   3. `req.protocol` (Express-derived; reflects the actual transport)
 *   4. `http` when the host looks local (127.0.0.1 / localhost), `https`
 *      otherwise. Local emulators serve plain http; production Cloud
 *      Functions are always https.
 */
export function deriveRpcEndpoint(
  headers: Record<string, string | string[] | undefined>,
  reqProtocol?: string,
): string {
  if (RPC_ENDPOINT_OVERRIDE && RPC_ENDPOINT_OVERRIDE.length > 0) {
    return RPC_ENDPOINT_OVERRIDE;
  }
  const host =
    pickHeader(headers, 'x-forwarded-host') ?? pickHeader(headers, 'host') ?? 'localhost';
  const proto =
    pickHeader(headers, 'x-forwarded-proto') ??
    (reqProtocol && reqProtocol.length > 0 ? reqProtocol : undefined) ??
    (isLocalHost(host) ? 'http' : 'https');
  return `${proto}://${host}/rpc`;
}

function isLocalHost(host: string): boolean {
  const h = host.split(':')[0]?.toLowerCase() ?? '';
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '[::1]';
}

function pickHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = headers[key];
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v.split(',')[0]?.trim();
  return undefined;
}

/**
 * Firebase Functions v2 entry point. Wired to
 * `GET /.well-known/agent.json` via `firebase.json` rewrites.
 */
export const agentCard = onRequest({ cors: true }, (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed: use GET');
    return;
  }
  const card = buildAgentCard(deriveRpcEndpoint(req.headers, req.protocol));
  res.status(200).type('application/json').send(JSON.stringify(card));
});
