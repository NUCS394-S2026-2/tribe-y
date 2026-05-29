import { onRequest, type Request } from 'firebase-functions/v2/https';

import { buildMethodHandlers, googleAiApiKey, methodHandlers } from './methods/index.js';

// NOTE: This endpoint is INTENTIONALLY PUBLIC — no Firebase auth.
// `/rpc` is the A2A JSON-RPC surface. Free, read-only methods like
// `listReportTypes` are open to any caller. Paid methods (`review`)
// will be gated by x402 over Solana devnet in a later PR; they are NOT
// gated by Firebase auth. Do NOT call verifyAuth here.

/** JSON-RPC 2.0 standard error codes. */
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: string | number | null;
  result: unknown;
}

export interface JsonRpcErrorEnvelope {
  jsonrpc: '2.0';
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcErrorEnvelope;

function errorEnvelope(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcErrorEnvelope {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function isValidEnvelope(value: unknown): value is JsonRpcRequest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.jsonrpc !== '2.0') return false;
  if (typeof v.method !== 'string' || v.method.length === 0) return false;
  if (
    'id' in v &&
    v.id !== null &&
    typeof v.id !== 'string' &&
    typeof v.id !== 'number'
  ) {
    return false;
  }
  return true;
}

/**
 * Pure-function JSON-RPC dispatcher. Takes an already-parsed body and
 * returns a JSON-RPC response envelope. Exported for unit tests.
 */
export async function dispatchRpc(
  parsedBody: unknown,
  handlers: Record<
    string,
    (params: unknown) => Promise<unknown> | unknown
  > = methodHandlers,
): Promise<JsonRpcResponse> {
  if (!isValidEnvelope(parsedBody)) {
    const id =
      typeof parsedBody === 'object' && parsedBody !== null && 'id' in parsedBody
        ? (((parsedBody as Record<string, unknown>).id as
            | string
            | number
            | null
            | undefined) ?? null)
        : null;
    return errorEnvelope(
      id ?? null,
      JSON_RPC_ERRORS.INVALID_REQUEST,
      'Invalid JSON-RPC request envelope',
    );
  }

  const { id = null, method, params } = parsedBody;
  const handler = handlers[method];
  if (!handler) {
    return errorEnvelope(
      id ?? null,
      JSON_RPC_ERRORS.METHOD_NOT_FOUND,
      `Method not found: ${method}`,
    );
  }

  try {
    const result = await handler(params);
    return { jsonrpc: '2.0', id: id ?? null, result };
  } catch (e) {
    if (e instanceof Error && e.name === 'InvalidParamsError') {
      return errorEnvelope(id ?? null, JSON_RPC_ERRORS.INVALID_PARAMS, e.message);
    }
    const message = e instanceof Error ? e.message : 'Internal error';
    return errorEnvelope(id ?? null, JSON_RPC_ERRORS.INTERNAL_ERROR, message);
  }
}

export function parseErrorEnvelope(): JsonRpcErrorEnvelope {
  return errorEnvelope(null, JSON_RPC_ERRORS.PARSE_ERROR, 'Parse error');
}

/**
 * Resolve the raw request body to a string regardless of how Firebase
 * Functions' upstream body-parser handled it. We prefer `req.rawBody`
 * (the original Buffer Firebase always preserves) so a) malformed JSON
 * isn't masked by Express's default HTML 400 page and b) we never
 * re-serialize an already-parsed value.
 */
export function extractRawBody(req: Request): string {
  const rb = (req as unknown as { rawBody?: Buffer }).rawBody;
  if (rb && rb.length > 0) return rb.toString('utf-8');
  if (typeof req.body === 'string') return req.body;
  if (req.body == null) return '';
  try {
    return JSON.stringify(req.body);
  } catch {
    return '';
  }
}

/**
 * Firebase Functions v2 entry point. Wired to `POST /rpc` via
 * `firebase.json` rewrites. Declares the `GOOGLE_AI_API_KEY` secret so
 * the `review` method can call Gemini at runtime.
 *
 * The handler reads `req.rawBody` and parses JSON itself so that
 * empty bodies, valid-JSON-but-bad-envelope payloads, and bodies sent
 * as `text/plain` all get proper JSON-RPC error envelopes.
 *
 * Known platform limitation: the Firebase Functions v2 runtime applies
 * its own JSON body-parser BEFORE any user handler runs. When a client
 * sends `Content-Type: application/json` with a body that fails to
 * parse, the runtime returns an HTML 400 page — we never see the
 * request. There is no public API to disable that. Real JSON-RPC
 * clients always send valid JSON, so this case is academic; clients
 * that want to probe error paths can send the same body with
 * `Content-Type: text/plain` to reach our `-32700` envelope.
 */
export const reviewerRpc = onRequest(
  { cors: true, secrets: [googleAiApiKey] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res
        .status(405)
        .json(
          errorEnvelope(
            null,
            JSON_RPC_ERRORS.INVALID_REQUEST,
            'Method Not Allowed: use POST',
          ),
        );
      return;
    }

    const raw = extractRawBody(req);
    if (raw.length === 0) {
      res.status(200).json(parseErrorEnvelope());
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.status(200).json(parseErrorEnvelope());
      return;
    }

    const apiKey = googleAiApiKey.value();
    if (!apiKey) {
      console.warn(
        'GOOGLE_AI_API_KEY is not set — only free methods will be registered.',
      );
    }
    const handlers = apiKey ? buildMethodHandlers(apiKey) : methodHandlers;

    const response = await dispatchRpc(parsed, handlers);
    res.status(200).json(response);
  },
);
