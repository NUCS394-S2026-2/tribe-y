import { defineSecret } from 'firebase-functions/params';

import { createServerGeminiCall } from '../serverGeminiCall.js';
import { listReportTypes } from './listReportTypes.js';
import { buildReviewHandler } from './review.js';
import type { MethodHandler } from './types.js';

/**
 * `GOOGLE_AI_API_KEY` is declared once here; the same secret name is used
 * by `geminiMessages.ts`. The reviewer RPC function declares this secret
 * in its `onRequest` options so it's available when the handler runs.
 *
 * Typed via ReturnType to avoid leaking a private declaration path from
 * the firebase-functions type tree.
 */
export const googleAiApiKey: ReturnType<typeof defineSecret> =
  defineSecret('GOOGLE_AI_API_KEY');

/**
 * Build the registry of JSON-RPC method handlers.
 *
 * Today the `review` method is registered but NOT gated by payment. x402
 * lives in `x402Middleware.ts` (PR 6) and will wrap this handler then.
 */
export function buildMethodHandlers(apiKey: string): Record<string, MethodHandler> {
  const geminiCall = createServerGeminiCall(apiKey);
  return {
    listReportTypes,
    review: buildReviewHandler(geminiCall),
  };
}

/**
 * Default registry used in unit tests and when the API key is unset. Only
 * the free, no-Gemini methods are registered; calling `review` falls
 * through to a method-not-found error envelope. Production code paths
 * always go through `buildMethodHandlers(apiKey)`.
 */
export const methodHandlers: Record<string, MethodHandler> = {
  listReportTypes,
};
