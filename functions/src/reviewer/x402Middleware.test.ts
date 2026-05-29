import { describe, expect, it, vi } from 'vitest';

import { checkX402Payment } from './x402Middleware.js';

const EXPECTED_RECIPIENT = '11111111111111111111111111111112';
const EXPECTED_AMOUNT = 1_000_000;

describe('checkX402Payment', () => {
  it('returns a quote when the X-Payment header is missing', async () => {
    const verifyPaymentImpl = vi.fn();
    const claimPaymentImpl = vi.fn();

    const result = await checkX402Payment({
      paymentHeader: undefined,
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.quote.amount).toBe(EXPECTED_AMOUNT);
      expect(result.quote.recipient).toBe(EXPECTED_RECIPIENT);
      expect(result.quote.currency).toBe('SOL_LAMPORTS');
      expect(result.quote.network).toBe('solana-devnet');
      expect(result.quote.nonce).toMatch(/[0-9a-f-]{36}/);
      expect(typeof result.quote.expiresAt).toBe('string');
    }
    expect(verifyPaymentImpl).not.toHaveBeenCalled();
    expect(claimPaymentImpl).not.toHaveBeenCalled();
  });

  it('treats whitespace-only header as missing', async () => {
    const verifyPaymentImpl = vi.fn();
    const claimPaymentImpl = vi.fn();

    const result = await checkX402Payment({
      paymentHeader: '   ',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(result.ok).toBe(false);
    expect(verifyPaymentImpl).not.toHaveBeenCalled();
  });

  it('returns a quote with the reason when verifyPayment fails', async () => {
    const verifyPaymentImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, reason: 'amount too low' });
    const claimPaymentImpl = vi.fn();

    const result = await checkX402Payment({
      paymentHeader: 'sig-abc',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('amount too low');
      expect(result.quote.recipient).toBe(EXPECTED_RECIPIENT);
    }
    expect(verifyPaymentImpl).toHaveBeenCalledWith({
      signature: 'sig-abc',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
    });
    expect(claimPaymentImpl).not.toHaveBeenCalled();
  });

  it('returns a quote with `payment already consumed` when claim says already_used', async () => {
    const receipt = {
      signature: 'sig-xyz',
      payer: 'PAYER',
      amount: EXPECTED_AMOUNT,
      verifiedAt: Date.now(),
    };
    const verifyPaymentImpl = vi.fn().mockResolvedValue({ ok: true, receipt });
    const claimPaymentImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, reason: 'already_used' });

    const result = await checkX402Payment({
      paymentHeader: 'sig-xyz',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('payment already consumed');
    }
    expect(claimPaymentImpl).toHaveBeenCalledOnce();
  });

  it('returns ok:true with the receipt when verify + claim both succeed', async () => {
    const receipt = {
      signature: 'sig-ok',
      payer: 'PAYER',
      amount: EXPECTED_AMOUNT,
      verifiedAt: 1234,
    };
    const verifyPaymentImpl = vi.fn().mockResolvedValue({ ok: true, receipt });
    const claimPaymentImpl = vi.fn().mockResolvedValue({ ok: true });

    const result = await checkX402Payment({
      paymentHeader: 'sig-ok',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.receipt).toEqual(receipt);
    }
    const [sig, snapshot] = claimPaymentImpl.mock.calls[0] as [string, object];
    expect(sig).toBe('sig-ok');
    expect(snapshot).toBeDefined();
  });

  it('passes the supplied reviewSnapshot through to claimPayment', async () => {
    const verifyPaymentImpl = vi.fn().mockResolvedValue({
      ok: true,
      receipt: { signature: 's', payer: 'p', amount: 1, verifiedAt: 0 },
    });
    const claimPaymentImpl = vi.fn().mockResolvedValue({ ok: true });
    const snapshot = { method: 'reviewFull', timestamp: '2026-01-01T00:00:00Z' };

    await checkX402Payment({
      paymentHeader: 's',
      expectedAmount: EXPECTED_AMOUNT,
      expectedRecipient: EXPECTED_RECIPIENT,
      reviewSnapshot: snapshot,
      verifyPaymentImpl,
      claimPaymentImpl,
    });

    expect(claimPaymentImpl).toHaveBeenCalledWith('s', snapshot);
  });
});
