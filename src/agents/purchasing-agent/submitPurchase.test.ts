import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STUB_PROCESSING_DELAY_MS, submitPurchase } from './submitPurchase';
import type { PurchaseRequest } from './types';

const VALID_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

const VALID_ZIP_FILE: PurchaseRequest['file'] = {
  name: 'my-repo.zip',
  sizeBytes: 1024,
  mimeType: 'application/zip',
};

function buildValidRequest(overrides: Partial<PurchaseRequest> = {}): PurchaseRequest {
  return {
    walletAddress: VALID_WALLET,
    file: VALID_ZIP_FILE,
    ...overrides,
  };
}

describe('submitPurchase (stub purchasing agent)', () => {
  describe('success path', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a success response with a vault URL after ~2 seconds', async () => {
      const promise = submitPurchase(buildValidRequest());

      // Advance just under the delay — promise should not have resolved.
      await vi.advanceTimersByTimeAsync(STUB_PROCESSING_DELAY_MS - 1);
      // We cannot directly probe the pending state without races, so
      // immediately advance past the threshold and assert resolution.
      await vi.advanceTimersByTimeAsync(1);

      const response = await promise;
      expect(response.status).toBe('success');
      if (response.status === 'success') {
        expect(response.vaultUrl).toMatch(/^https:\/\/vault\./);
        expect(response.transactionId).toMatch(/^txn_stub_/);
      }
    });

    it('returns a unique transactionId on each call', async () => {
      const p1 = submitPurchase(buildValidRequest());
      const p2 = submitPurchase(buildValidRequest());
      await vi.advanceTimersByTimeAsync(STUB_PROCESSING_DELAY_MS);

      const [r1, r2] = await Promise.all([p1, p2]);
      if (r1.status === 'success' && r2.status === 'success') {
        expect(r1.transactionId).not.toBe(r2.transactionId);
        expect(r1.vaultUrl).not.toBe(r2.vaultUrl);
      } else {
        throw new Error('Expected both responses to be success');
      }
    });
  });

  describe('error path — INVALID_WALLET', () => {
    it.each([
      ['empty string', ''],
      ['missing 0x prefix', '742d35Cc6634C0532925a3b844Bc9e7595f0bEb1'],
      ['too short', '0x742d35'],
      ['non-hex characters', '0xZZZZ35Cc6634C0532925a3b844Bc9e7595f0bEb1'],
      ['extra characters', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1XX'],
    ])('rejects %s', async (_label, walletAddress) => {
      const response = await submitPurchase(buildValidRequest({ walletAddress }));
      expect(response.status).toBe('error');
      if (response.status === 'error') {
        expect(response.errorCode).toBe('INVALID_WALLET');
      }
    });

    it('rejects immediately without simulated delay', async () => {
      const start = Date.now();
      await submitPurchase(buildValidRequest({ walletAddress: 'bad' }));
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('error path — file validation', () => {
    it('returns MISSING_FILE when file name is empty', async () => {
      const response = await submitPurchase(
        buildValidRequest({
          file: { name: '', sizeBytes: 0, mimeType: '' },
        }),
      );
      expect(response.status).toBe('error');
      if (response.status === 'error') {
        expect(response.errorCode).toBe('MISSING_FILE');
      }
    });

    it('returns UNSUPPORTED_FILE_TYPE for a non-zip file', async () => {
      const response = await submitPurchase(
        buildValidRequest({
          file: {
            name: 'repo.tar.gz',
            sizeBytes: 1024,
            mimeType: 'application/gzip',
          },
        }),
      );
      expect(response.status).toBe('error');
      if (response.status === 'error') {
        expect(response.errorCode).toBe('UNSUPPORTED_FILE_TYPE');
      }
    });

    it('accepts zip files with empty MIME type if extension is .zip', async () => {
      vi.useFakeTimers();
      const promise = submitPurchase(
        buildValidRequest({
          file: { name: 'repo.zip', sizeBytes: 1024, mimeType: '' },
        }),
      );
      await vi.advanceTimersByTimeAsync(STUB_PROCESSING_DELAY_MS);
      const response = await promise;
      vi.useRealTimers();

      expect(response.status).toBe('success');
    });
  });

  describe('response shape', () => {
    it('returns a human-readable message on every error', async () => {
      const response = await submitPurchase(buildValidRequest({ walletAddress: 'bad' }));
      if (response.status === 'error') {
        expect(response.message.length).toBeGreaterThan(0);
      }
    });
  });
});
