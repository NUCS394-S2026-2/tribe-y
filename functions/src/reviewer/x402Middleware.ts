import { randomUUID } from 'node:crypto';

import {
  claimPayment as defaultClaimPayment,
  type PaymentReceipt,
  verifyPayment as defaultVerifyPayment,
  type VerifyPaymentResult,
} from './verifyPayment.js';

/**
 * Quote returned to clients when a paid request arrives without (or with an
 * invalid) `X-Payment` header. Mirrors the x402 spec's "payment instructions"
 * document. Serialized as the HTTP 402 response body.
 */
export interface X402Quote {
  amount: number;
  currency: 'SOL_LAMPORTS';
  network: 'solana-devnet';
  recipient: string;
  expiresAt: string;
  nonce: string;
}

export type X402Result =
  | { ok: true; receipt: PaymentReceipt }
  | { ok: false; quote: X402Quote; reason?: string };

export interface CheckX402PaymentArgs {
  paymentHeader: string | undefined;
  expectedAmount: number;
  expectedRecipient: string;
  /** Snapshot stored alongside the claim record for audit. */
  reviewSnapshot?: object;
  /** Test-injection seam for verifyPayment. */
  verifyPaymentImpl?: typeof defaultVerifyPayment;
  /** Test-injection seam for claimPayment. */
  claimPaymentImpl?: typeof defaultClaimPayment;
}

const QUOTE_TTL_MS = 5 * 60 * 1000;

function buildQuote(expectedAmount: number, expectedRecipient: string): X402Quote {
  return {
    amount: expectedAmount,
    currency: 'SOL_LAMPORTS',
    network: 'solana-devnet',
    recipient: expectedRecipient,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    nonce: randomUUID(),
  };
}

/**
 * Verify the x402 contract for a single request.
 *
 * Behaviour:
 *   - No `X-Payment` header → `{ ok: false, quote }`.
 *   - Header present but `verifyPayment` fails → `{ ok: false, quote, reason }`.
 *   - Header present, verified, but `claimPayment` returns `already_used`
 *     → `{ ok: false, quote, reason: 'payment already consumed' }`.
 *   - Header present, verified, and claim succeeds → `{ ok: true, receipt }`.
 *
 * Callers are expected to serialize the quote as the body of an HTTP 402
 * response when `ok: false`, and dispatch the underlying method when `ok: true`.
 */
export async function checkX402Payment(args: CheckX402PaymentArgs): Promise<X402Result> {
  const {
    paymentHeader,
    expectedAmount,
    expectedRecipient,
    reviewSnapshot,
    verifyPaymentImpl = defaultVerifyPayment,
    claimPaymentImpl = defaultClaimPayment,
  } = args;

  const signature = paymentHeader?.trim();
  if (!signature) {
    return {
      ok: false,
      quote: buildQuote(expectedAmount, expectedRecipient),
      reason: 'X-Payment header missing',
    };
  }

  const verifyResult: VerifyPaymentResult = await verifyPaymentImpl({
    signature,
    expectedAmount,
    expectedRecipient,
  });

  if (!verifyResult.ok) {
    return {
      ok: false,
      quote: buildQuote(expectedAmount, expectedRecipient),
      reason: verifyResult.reason,
    };
  }

  const snapshot = reviewSnapshot ?? {
    method: 'reviewFull',
    timestamp: new Date().toISOString(),
  };

  const claim = await claimPaymentImpl(signature, snapshot);
  if (!claim.ok) {
    return {
      ok: false,
      quote: buildQuote(expectedAmount, expectedRecipient),
      reason: 'payment already consumed',
    };
  }

  return { ok: true, receipt: verifyResult.receipt };
}
