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
          'Produce a structured code review on a C++ snippet. NOT YET IMPLEMENTED — coming in a future release.',
        params: '{ code: string, reportType: ReportType, fullReport?: boolean }',
        result: 'SampleReportData',
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
 */
export function deriveRpcEndpoint(
  headers: Record<string, string | string[] | undefined>,
): string {
  const proto = pickHeader(headers, 'x-forwarded-proto') ?? 'https';
  const host =
    pickHeader(headers, 'x-forwarded-host') ?? pickHeader(headers, 'host') ?? 'localhost';
  return `${proto}://${host}/rpc`;
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
  const card = buildAgentCard(deriveRpcEndpoint(req.headers));
  res.status(200).type('application/json').send(JSON.stringify(card));
});
