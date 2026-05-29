import { listReportTypes } from './listReportTypes.js';
import type { MethodHandler } from './types.js';

/**
 * Registered JSON-RPC method handlers.
 *
 * NOTE: `review` is intentionally NOT registered yet. The agent card
 * advertises it as a future paid method; the dispatcher will return
 * method-not-found (-32601) if a client calls it today. PR 3 will
 * implement it, and PR 5 / PR 6 will gate it with x402.
 */
export const methodHandlers: Record<string, MethodHandler> = {
  listReportTypes,
};
