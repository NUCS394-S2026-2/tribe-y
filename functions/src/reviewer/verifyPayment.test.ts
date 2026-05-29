import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  type VersionedTransactionResponse,
} from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetConnectionFactory,
  __setConnectionFactory,
  verifyPayment,
} from './verifyPayment.js';

interface MockConnection {
  getTransaction: ReturnType<typeof vi.fn>;
}

function makeMockConnection(
  response: VersionedTransactionResponse | null | (() => never),
): MockConnection {
  return {
    getTransaction:
      typeof response === 'function'
        ? vi.fn().mockImplementation(response)
        : vi.fn().mockResolvedValue(response),
  };
}

function buildTransferTxResponse(opts: {
  fromPubkey: PublicKey;
  toPubkey: PublicKey;
  lamports: number;
  blockTimeSec: number;
}): VersionedTransactionResponse {
  const { fromPubkey, toPubkey, lamports, blockTimeSec } = opts;
  const message = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: '11111111111111111111111111111111',
    instructions: [SystemProgram.transfer({ fromPubkey, toPubkey, lamports })],
  }).compileToV0Message();
  const versionedTx = new VersionedTransaction(message);

  return {
    slot: 1,
    blockTime: blockTimeSec,
    transaction: versionedTx,
    meta: null,
    version: 0,
  } as unknown as VersionedTransactionResponse;
}

function buildNonTransferTxResponse(opts: {
  fromPubkey: PublicKey;
  blockTimeSec: number;
}): VersionedTransactionResponse {
  const { fromPubkey, blockTimeSec } = opts;
  const newAccount = Keypair.generate();
  const message = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: '11111111111111111111111111111111',
    instructions: [
      SystemProgram.allocate({
        accountPubkey: newAccount.publicKey,
        space: 100,
      }),
    ],
  }).compileToV0Message();
  return {
    slot: 1,
    blockTime: blockTimeSec,
    transaction: new VersionedTransaction(message),
    meta: null,
    version: 0,
  } as unknown as VersionedTransactionResponse;
}

const payer = Keypair.generate().publicKey;
const recipient = Keypair.generate().publicKey;
const SIGNATURE = 'sig-under-test';

describe('verifyPayment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetConnectionFactory();
  });

  it('returns tx not finalized when getTransaction resolves null', async () => {
    __setConnectionFactory(() => makeMockConnection(null) as never);
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'tx not finalized' });
  });

  it('returns tx not finalized when getTransaction throws', async () => {
    __setConnectionFactory(
      () =>
        ({
          getTransaction: vi.fn().mockRejectedValue(new Error('rpc down')),
        }) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'tx not finalized' });
  });

  it('returns tx is not a SOL transfer when no transfer instruction found', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    __setConnectionFactory(
      () =>
        makeMockConnection(
          buildNonTransferTxResponse({
            fromPubkey: payer,
            blockTimeSec: nowSec,
          }),
        ) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'tx is not a SOL transfer' });
  });

  it('returns recipient mismatch when transfer recipient differs', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const otherRecipient = Keypair.generate().publicKey;
    __setConnectionFactory(
      () =>
        makeMockConnection(
          buildTransferTxResponse({
            fromPubkey: payer,
            toPubkey: otherRecipient,
            lamports: 1000,
            blockTimeSec: nowSec,
          }),
        ) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'recipient mismatch' });
  });

  it('returns amount too low when transfer lamports < expected', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    __setConnectionFactory(
      () =>
        makeMockConnection(
          buildTransferTxResponse({
            fromPubkey: payer,
            toPubkey: recipient,
            lamports: 500,
            blockTimeSec: nowSec,
          }),
        ) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'amount too low' });
  });

  it('returns tx is stale when blockTime is older than 5 minutes', async () => {
    const staleSec = Math.floor(Date.now() / 1000) - 6 * 60;
    __setConnectionFactory(
      () =>
        makeMockConnection(
          buildTransferTxResponse({
            fromPubkey: payer,
            toPubkey: recipient,
            lamports: 1000,
            blockTimeSec: staleSec,
          }),
        ) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result).toEqual({ ok: false, reason: 'tx is stale' });
  });

  it('returns ok with receipt for a valid recent transfer', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    __setConnectionFactory(
      () =>
        makeMockConnection(
          buildTransferTxResponse({
            fromPubkey: payer,
            toPubkey: recipient,
            lamports: 2000,
            blockTimeSec: nowSec,
          }),
        ) as never,
    );
    const result = await verifyPayment({
      signature: SIGNATURE,
      expectedAmount: 1000,
      expectedRecipient: recipient.toBase58(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.receipt.signature).toBe(SIGNATURE);
      expect(result.receipt.payer).toBe(payer.toBase58());
      expect(result.receipt.amount).toBe(2000);
      expect(typeof result.receipt.verifiedAt).toBe('number');
    }
  });
});
