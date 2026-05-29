import { onRequest } from 'firebase-functions/v2/https';

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
        name: 'review',
        description:
          'Produce a structured C++ code review on the submitted snippet. Returns a SampleReportData JSON document (scorecard, findings, slice, summary, conclusion).',
        params: '{ code: string, reportType: ReportType, fullReport?: boolean }',
        result: 'SampleReportData',
        // The method is fully implemented in this release. Payment via x402
        // is NOT yet enforced — that lands in a follow-up. Treat `paid: true`
        // as a forward-looking declaration so peer agents already know to
        // expect an x402 challenge once it ships.
        paid: true,
        pricing: {
          amount: '0',
          currency: 'SOL_LAMPORTS',
          network: 'solana-devnet',
          recipient: null,
        },
      },
    ],
  };
}

/**
 * Derive the absolute `/rpc` URL from an incoming request. Honors the
 * `x-forwarded-*` headers Firebase Hosting sets in front of Cloud
 * Functions, so the URL we advertise matches what clients used to reach us.
 *
 * Protocol resolution order:
 *   1. `x-forwarded-proto` (set by Firebase Hosting / any HTTPS terminator)
 *   2. `req.protocol` (Express-derived; reflects the actual transport)
 *   3. `http` when the host looks local (127.0.0.1 / localhost), `https`
 *      otherwise. Local emulators serve plain http; production Cloud
 *      Functions are always https.
 */
export function deriveRpcEndpoint(
  headers: Record<string, string | string[] | undefined>,
  reqProtocol?: string,
): string {
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
