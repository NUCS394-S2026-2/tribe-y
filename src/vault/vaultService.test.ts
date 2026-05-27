import { describe, expect, test, vi } from 'vitest';

import type { VaultReceipt } from '../shared/types/VaultReceipt';
import {
  buildVaultReceipt,
  computeContentHash,
  generateDownloadToken,
  isReceiptValid,
} from './vaultService';

describe('generateDownloadToken', () => {
  test('returns a 64-character hex string', () => {
    const token = generateDownloadToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  test('generates unique tokens', () => {
    const a = generateDownloadToken();
    const b = generateDownloadToken();
    expect(a).not.toBe(b);
  });
});

describe('computeContentHash', () => {
  test('returns SHA-256 hex for known input', async () => {
    const hash = await computeContentHash('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  test('returns different hashes for different inputs', async () => {
    const a = await computeContentHash('abc');
    const b = await computeContentHash('def');
    expect(a).not.toBe(b);
  });
});

describe('buildVaultReceipt', () => {
  test('constructs receipt with 24h TTL and provided fields', () => {
    const now = new Date('2026-05-26T12:00:00Z');
    vi.setSystemTime(now);

    const receipt = buildVaultReceipt({
      reviewId: 'review-1',
      paymentRef: 'txn-abc',
      chainId: 'solana-devnet',
      contentHash: 'abc123',
      reportType: 'security',
    });

    expect(receipt.reviewId).toBe('review-1');
    expect(receipt.paymentRef).toBe('txn-abc');
    expect(receipt.chainId).toBe('solana-devnet');
    expect(receipt.contentHash).toBe('abc123');
    expect(receipt.reportType).toBe('security');
    expect(receipt.retentionPolicy).toBe('24h-single-download');
    expect(receipt.downloadTokenUsed).toBe(false);
    expect(receipt.receiptId).toMatch(/^[0-9a-f]+$/);
    expect(receipt.downloadToken).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.issuedAt).toBe('2026-05-26T12:00:00.000Z');
    expect(receipt.expiresAt).toBe('2026-05-27T12:00:00.000Z');

    vi.useRealTimers();
  });
});

describe('isReceiptValid', () => {
  const baseReceipt: VaultReceipt = {
    receiptId: 'r1',
    reviewId: 'rev1',
    paymentRef: 'txn1',
    chainId: 'solana-devnet',
    contentHash: 'hash1',
    issuedAt: '2026-05-26T12:00:00.000Z',
    expiresAt: '2026-05-27T12:00:00.000Z',
    retentionPolicy: '24h-single-download',
    reportType: 'security',
    downloadToken: 'a'.repeat(64),
    downloadTokenUsed: false,
  };

  test('returns true when not expired and token not used', () => {
    vi.setSystemTime(new Date('2026-05-26T18:00:00Z'));
    expect(isReceiptValid(baseReceipt)).toBe(true);
    vi.useRealTimers();
  });

  test('returns false when expired', () => {
    vi.setSystemTime(new Date('2026-05-28T00:00:00Z'));
    expect(isReceiptValid(baseReceipt)).toBe(false);
    vi.useRealTimers();
  });

  test('returns false when download token already used', () => {
    vi.setSystemTime(new Date('2026-05-26T18:00:00Z'));
    expect(isReceiptValid({ ...baseReceipt, downloadTokenUsed: true })).toBe(false);
    vi.useRealTimers();
  });
});
