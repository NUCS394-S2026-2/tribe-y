import { onRequest } from 'firebase-functions/v2/https';

import { methodHandlers } from './methods/index.js';

// NOTE: This endpoint is INTENTIONALLY PUBLIC — no Firebase auth.
// `/rpc` is the A2A JSON-RPC surface. The only method registered today
// is `listReportTypes`, which is free and read-only. Future paid methods
// (e.g. `review`) will be gated by x402 over Solana devnet in a later PR;
// they are NOT gated by Firebase auth. Do NOT call verifyAuth here.

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
 *
 * Input may be:
 *   - a string (which we tried to parse but failed) → caller should call
 *     `parseErrorEnvelope()` instead; this fn assumes input is parsed.
 *   - a parsed JSON value, which we then validate as an envelope.
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
    // Distinguish param errors from generic internals by error name convention.
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
 * Firebase Functions v2 entry point. Wired to `POST /rpc` via
 * `firebase.json` rewrites.
 */
export const reviewerRpc = onRequest({ cors: true }, async (req, res) => {
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

  // Firebase Functions auto-parses JSON bodies based on Content-Type, but
  // if the client sent a raw string or malformed JSON we may receive a
  // string in req.body. Treat that as a parse error.
  let parsed: unknown = req.body;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      res.status(200).json(parseErrorEnvelope());
      return;
    }
  } else if (parsed === undefined || parsed === null) {
    res.status(200).json(parseErrorEnvelope());
    return;
  }

  const response = await dispatchRpc(parsed);
  res.status(200).json(response);
});
