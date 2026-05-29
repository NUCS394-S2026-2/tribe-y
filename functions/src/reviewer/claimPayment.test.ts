import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock firebase-admin/firestore BEFORE importing the module under test.
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDoc = vi.fn(() => ({ id: 'sig' }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockRunTransaction = vi.fn();

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
  FieldValue: {
    serverTimestamp: () => '__SERVER_TS__',
  },
}));

import { claimPayment } from './verifyPayment.js';

const SIGNATURE = 'sig-abc';
const SNAPSHOT = { hello: 'world' };

describe('claimPayment', () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockGet.mockReset();
    mockRunTransaction.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('writes a fresh claim and returns ok when no doc exists', async () => {
    mockGet.mockResolvedValue({ exists: false });
    mockRunTransaction.mockImplementation(
      async (
        fn: (txn: { get: typeof mockGet; set: typeof mockSet }) => Promise<unknown>,
      ) => fn({ get: mockGet, set: mockSet }),
    );

    const result = await claimPayment(SIGNATURE, SNAPSHOT);

    expect(result).toEqual({ ok: true });
    expect(mockSet).toHaveBeenCalledTimes(1);
    const [, payload] = mockSet.mock.calls[0];
    expect(payload).toMatchObject({
      signature: SIGNATURE,
      reviewSnapshot: SNAPSHOT,
      claimedAt: '__SERVER_TS__',
    });
  });

  it('returns already_used and does NOT write when doc exists', async () => {
    mockGet.mockResolvedValue({ exists: true });
    mockRunTransaction.mockImplementation(
      async (
        fn: (txn: { get: typeof mockGet; set: typeof mockSet }) => Promise<unknown>,
      ) => fn({ get: mockGet, set: mockSet }),
    );

    const result = await claimPayment(SIGNATURE, SNAPSHOT);

    expect(result).toEqual({ ok: false, reason: 'already_used' });
    expect(mockSet).not.toHaveBeenCalled();
  });
});
