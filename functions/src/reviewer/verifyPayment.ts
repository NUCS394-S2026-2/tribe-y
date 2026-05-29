import {
  Connection,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransactionInstruction,
  type Message,
  type MessageCompiledInstruction,
  type VersionedTransactionResponse,
} from '@solana/web3.js';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

import { SOLANA_RPC_URL } from './wallet.js';

export interface PaymentReceipt {
  signature: string;
  payer: string;
  amount: number; // lamports
  verifiedAt: number; // ms epoch
}

export interface VerifyPaymentArgs {
  signature: string;
  expectedAmount: number; // lamports (min)
  expectedRecipient: string;
}

export type VerifyPaymentResult =
  | { ok: true; receipt: PaymentReceipt }
  | { ok: false; reason: string };

const STALE_TX_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Allow tests / PR 6 to inject a custom Connection (e.g. a mocked one).
 */
let connectionFactory: (url: string) => Connection = (url) =>
  new Connection(url, 'finalized');

export function __setConnectionFactory(factory: (url: string) => Connection): void {
  connectionFactory = factory;
}

export function __resetConnectionFactory(): void {
  connectionFactory = (url) => new Connection(url, 'finalized');
}

interface DecodedTransfer {
  fromPubkey: PublicKey;
  toPubkey: PublicKey;
  lamports: number;
}

function decodeFirstSystemTransfer(
  tx: VersionedTransactionResponse,
): DecodedTransfer | null {
  const message = tx.transaction.message;
  const accountKeys = message.staticAccountKeys ?? [];

  // For versioned messages, instructions live on `compiledInstructions`.
  // For legacy messages, on `instructions`.
  const compiled: MessageCompiledInstruction[] =
    (
      message as Message & {
        compiledInstructions?: MessageCompiledInstruction[];
      }
    ).compiledInstructions ??
    (message as Message).instructions?.map((ix) => ({
      programIdIndex: ix.programIdIndex,
      accountKeyIndexes: ix.accounts,
      data:
        typeof ix.data === 'string'
          ? new Uint8Array(Buffer.from(ix.data, 'base64'))
          : (ix.data as unknown as Uint8Array),
    })) ??
    [];

  for (const ix of compiled) {
    const programId = accountKeys[ix.programIdIndex];
    if (!programId) continue;
    if (!programId.equals(SystemProgram.programId)) continue;

    // Build a TransactionInstruction so we can use SystemInstruction decoders.
    const keys = ix.accountKeyIndexes
      .map((idx) => accountKeys[idx])
      .filter((k): k is PublicKey => k !== undefined)
      .map((pubkey) => ({ pubkey, isSigner: false, isWritable: true }));

    const data = Buffer.from(ix.data);
    const txIx = new TransactionInstruction({
      keys,
      programId,
      data,
    });

    let type: string;
    try {
      type = SystemInstruction.decodeInstructionType(txIx);
    } catch {
      continue;
    }
    if (type !== 'Transfer') continue;

    try {
      const decoded = SystemInstruction.decodeTransfer(txIx);
      return {
        fromPubkey: decoded.fromPubkey,
        toPubkey: decoded.toPubkey,
        lamports: Number(decoded.lamports),
      };
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Verify a Solana SOL transfer payment.
 *
 * Performs five checks:
 *   1. Transaction is fetched and finalized.
 *   2. Transaction contains a SystemProgram.transfer instruction.
 *   3. Transfer recipient equals `expectedRecipient`.
 *   4. Transfer amount (lamports) >= `expectedAmount`.
 *   5. Transaction blockTime is within the last 5 minutes.
 *
 * Returns `{ ok: false, reason }` on the first failing check.
 *
 * Replay protection is NOT done here — see `claimPayment`.
 */
export async function verifyPayment(
  args: VerifyPaymentArgs,
): Promise<VerifyPaymentResult> {
  const { signature, expectedAmount, expectedRecipient } = args;

  const connection = connectionFactory(SOLANA_RPC_URL);

  // 1. Fetch finalized tx.
  let tx: VersionedTransactionResponse | null;
  try {
    tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'finalized',
    });
  } catch {
    return { ok: false, reason: 'tx not finalized' };
  }
  if (!tx) {
    return { ok: false, reason: 'tx not finalized' };
  }

  // 2. Decode transfer.
  const transfer = decodeFirstSystemTransfer(tx);
  if (!transfer) {
    return { ok: false, reason: 'tx is not a SOL transfer' };
  }

  // 3. Recipient check.
  let expectedRecipientPk: PublicKey;
  try {
    expectedRecipientPk = new PublicKey(expectedRecipient);
  } catch {
    return { ok: false, reason: 'recipient mismatch' };
  }
  if (!transfer.toPubkey.equals(expectedRecipientPk)) {
    return { ok: false, reason: 'recipient mismatch' };
  }

  // 4. Amount check.
  if (transfer.lamports < expectedAmount) {
    return { ok: false, reason: 'amount too low' };
  }

  // 5. Staleness check.
  if (
    typeof tx.blockTime !== 'number' ||
    Date.now() - tx.blockTime * 1000 > STALE_TX_MS
  ) {
    return { ok: false, reason: 'tx is stale' };
  }

  return {
    ok: true,
    receipt: {
      signature,
      payer: transfer.fromPubkey.toBase58(),
      amount: transfer.lamports,
      verifiedAt: Date.now(),
    },
  };
}

/**
 * Claim a payment for one-time use (replay protection).
 *
 * Atomically reads `usedPayments/{signature}` and either:
 *   - writes a new doc with the snapshot and returns `{ ok: true }`, OR
 *   - returns `{ ok: false, reason: 'already_used' }` without overwriting.
 *
 * Two simultaneous claims race correctly thanks to `runTransaction`.
 *
 * The Firestore instance is obtained lazily so that callers / tests can
 * initialise `firebase-admin` (or mock it) before invocation.
 */
export async function claimPayment(
  signature: string,
  reviewSnapshot: object,
): Promise<{ ok: true } | { ok: false; reason: 'already_used' }> {
  const db = getFirestore();
  const ref = db.collection('usedPayments').doc(signature);

  return db.runTransaction(async (txn) => {
    const snap = await txn.get(ref);
    if (snap.exists) {
      return { ok: false, reason: 'already_used' as const };
    }
    txn.set(ref, {
      signature,
      claimedAt: FieldValue.serverTimestamp(),
      reviewSnapshot,
    });
    return { ok: true as const };
  });
}
