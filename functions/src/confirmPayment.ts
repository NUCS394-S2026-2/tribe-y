import { randomUUID } from 'node:crypto';

import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import { verifyAuth } from './middleware/verifyAuth.js';

const DEVNET = 'devnet';
const LAMPORTS_PER_SOL = 1_000_000_000;
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const DEFAULT_MOCK_SERVICE_WALLET = '11111111111111111111111111111111';
const DEFAULT_MOCK_AMOUNT_LAMPORTS = 10_000;

type PaymentVerifierMode = 'mock' | 'solana';

interface PaymentConfig {
  verifierMode: PaymentVerifierMode;
  amountLamports: number;
  network: string;
  rpcUrl: string;
  serviceWallet: string;
}

interface CodeReviewPaymentData {
  uid?: unknown;
  paymentStatus?: unknown;
  paymentTxnId?: unknown;
  paymentTxSignature?: unknown;
  paymentIntentId?: unknown;
  paymentAmountLamports?: unknown;
  paymentRecipientPublicKey?: unknown;
  paymentMemo?: unknown;
}

interface PaymentIntent {
  reviewId: string;
  intentId: string;
  memo: string;
  amount: string;
  amountLamports: number;
  currency: 'SOL';
  network: string;
  receiverAddress: string;
  walletAddress: string;
  expiresAt: string;
}

interface PaymentProof {
  txSignature: string;
  payerPublicKey: string;
  recipientPublicKey: string;
  amountLamports: number;
  memo: string;
  network: string;
  slot: number | null;
}

interface PaymentVerifier {
  verify: (input: {
    txSignature: string;
    payerPublicKey: string;
    expected: ExpectedPayment;
  }) => Promise<PaymentProof>;
}

interface ExpectedPayment {
  reviewId: string;
  intentId: string;
  amountLamports: number;
  recipientPublicKey: string;
  memo: string;
  network: string;
}

function envString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function envNumber(name: string): number | undefined {
  const raw = envString(name);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function readConfig(): PaymentConfig {
  const verifierMode =
    envString('PAYMENT_VERIFIER') === 'mock' ? 'mock' : ('solana' as PaymentVerifierMode);
  const amountLamports =
    envNumber('PAYMENT_AMOUNT_LAMPORTS') ??
    (verifierMode === 'mock' ? DEFAULT_MOCK_AMOUNT_LAMPORTS : undefined);
  const serviceWallet =
    envString('SOLANA_SERVICE_WALLET') ??
    (verifierMode === 'mock' ? DEFAULT_MOCK_SERVICE_WALLET : undefined);

  if (!amountLamports) {
    throw new Error('PAYMENT_AMOUNT_LAMPORTS is not configured');
  }
  if (!serviceWallet) {
    throw new Error('SOLANA_SERVICE_WALLET is not configured');
  }

  new PublicKey(serviceWallet);

  return {
    verifierMode,
    amountLamports,
    network: envString('SOLANA_NETWORK') ?? DEVNET,
    rpcUrl: envString('SOLANA_RPC_URL') ?? clusterApiUrl('devnet'),
    serviceWallet,
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null;
}

function amountSol(amountLamports: number): string {
  return (amountLamports / LAMPORTS_PER_SOL)
    .toFixed(9)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
}

function createPaymentIntent(reviewId: string, config: PaymentConfig): PaymentIntent {
  const intentId = `x402_${randomUUID()}`;
  const memo = `x402:compass:${reviewId}:${intentId}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    reviewId,
    intentId,
    memo,
    amount: amountSol(config.amountLamports),
    amountLamports: config.amountLamports,
    currency: 'SOL',
    network: config.network,
    receiverAddress: config.serviceWallet,
    walletAddress: config.serviceWallet,
    expiresAt,
  };
}

function paymentPath(reqUrl: string | undefined): 'initiate' | 'confirm' {
  const url = reqUrl ?? '';
  return url.includes('/initiate') ? 'initiate' : 'confirm';
}

function buildExpectedPayment(
  reviewId: string,
  data: CodeReviewPaymentData,
  config: PaymentConfig,
): ExpectedPayment | null {
  const intentId = asString(data.paymentIntentId);
  const memo = asString(data.paymentMemo);
  const amountLamports = asNumber(data.paymentAmountLamports);
  const recipientPublicKey = asString(data.paymentRecipientPublicKey);

  if (!intentId || !memo || !amountLamports || !recipientPublicKey) {
    return null;
  }

  return {
    reviewId,
    intentId,
    amountLamports,
    recipientPublicKey,
    memo,
    network: config.network,
  };
}

class MockPaymentVerifier implements PaymentVerifier {
  async verify(input: {
    txSignature: string;
    payerPublicKey: string;
    expected: ExpectedPayment;
  }): Promise<PaymentProof> {
    if (
      !input.txSignature.startsWith('mock-') &&
      !input.txSignature.startsWith('mock_')
    ) {
      throw new Error('Mock verifier only accepts mock signatures');
    }

    new PublicKey(input.payerPublicKey);

    return {
      txSignature: input.txSignature,
      payerPublicKey: input.payerPublicKey,
      recipientPublicKey: input.expected.recipientPublicKey,
      amountLamports: input.expected.amountLamports,
      memo: input.expected.memo,
      network: input.expected.network,
      slot: null,
    };
  }
}

class SolanaPaymentVerifier implements PaymentVerifier {
  private readonly connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'finalized');
  }

  async verify(input: {
    txSignature: string;
    payerPublicKey: string;
    expected: ExpectedPayment;
  }): Promise<PaymentProof> {
    const transaction = await this.connection.getParsedTransaction(input.txSignature, {
      commitment: 'finalized',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      throw new Error('Transaction was not found or is not finalized');
    }
    if (transaction.meta?.err) {
      throw new Error('Transaction did not finalize successfully');
    }

    const transfer = transaction.transaction.message.instructions.find((instruction) => {
      if (!('parsed' in instruction)) return false;
      const parsed = instruction.parsed as {
        type?: string;
        info?: {
          source?: string;
          destination?: string;
          lamports?: number;
        };
      };
      return (
        parsed.type === 'transfer' &&
        parsed.info?.source === input.payerPublicKey &&
        parsed.info.destination === input.expected.recipientPublicKey &&
        parsed.info.lamports === input.expected.amountLamports
      );
    });

    if (!transfer || !('parsed' in transfer)) {
      throw new Error('Transaction does not contain the expected SOL transfer');
    }

    const memo = transaction.transaction.message.instructions.find((instruction) => {
      if (instruction.programId.toBase58() !== MEMO_PROGRAM_ID) return false;
      if (!('parsed' in instruction)) return false;
      const parsed = instruction.parsed as unknown;
      if (typeof parsed === 'string') {
        return parsed.includes(input.expected.memo);
      }
      if (typeof parsed === 'object' && parsed !== null && 'memo' in parsed) {
        return String(parsed.memo).includes(input.expected.memo);
      }
      return false;
    });

    if (!memo) {
      throw new Error('Transaction memo does not match the payment intent');
    }

    return {
      txSignature: input.txSignature,
      payerPublicKey: input.payerPublicKey,
      recipientPublicKey: input.expected.recipientPublicKey,
      amountLamports: input.expected.amountLamports,
      memo: input.expected.memo,
      network: input.expected.network,
      slot: transaction.slot,
    };
  }
}

function createVerifier(config: PaymentConfig): PaymentVerifier {
  return config.verifierMode === 'mock'
    ? new MockPaymentVerifier()
    : new SolanaPaymentVerifier(config.rpcUrl);
}

export const confirmPayment = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const verified = await verifyAuth(req.headers.authorization);
  if (!verified) {
    res.status(401).send('Invalid or missing authentication token');
    return;
  }

  let config: PaymentConfig;
  try {
    config = readConfig();
  } catch (err) {
    res
      .status(503)
      .send(err instanceof Error ? err.message : 'Payment is not configured');
    return;
  }

  const { reviewId } = req.body as { reviewId?: string };
  if (!reviewId) {
    res.status(400).send('reviewId is required');
    return;
  }

  const db = getFirestore();
  const docRef = db.collection('codeReviews').doc(reviewId);
  const doc = await docRef.get();

  if (!doc.exists) {
    res.status(404).send('Review not found');
    return;
  }

  const data = doc.data() as CodeReviewPaymentData;
  if (data.uid !== verified.uid) {
    res.status(403).send('Forbidden');
    return;
  }

  if (paymentPath(req.url) === 'initiate') {
    const intent = createPaymentIntent(reviewId, config);
    await docRef.update({
      paymentStatus: 'pending',
      paymentIntentId: intent.intentId,
      paymentAmountLamports: intent.amountLamports,
      paymentAmount: intent.amount,
      paymentCurrency: intent.currency,
      paymentNetwork: intent.network,
      paymentRecipientPublicKey: intent.receiverAddress,
      paymentMemo: intent.memo,
      paymentIntentExpiresAt: intent.expiresAt,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json(intent);
    return;
  }

  const { txSignature, txnId, payerPublicKey } = req.body as {
    txSignature?: string;
    txnId?: string;
    payerPublicKey?: string;
  };
  const signature = txSignature ?? txnId;
  if (!signature || !payerPublicKey) {
    res.status(400).send('txSignature and payerPublicKey are required');
    return;
  }

  if (data.paymentStatus === 'paid') {
    const storedSignature =
      asString(data.paymentTxSignature) ?? asString(data.paymentTxnId) ?? signature;
    res.status(200).json({
      success: true,
      alreadyPaid: true,
      txSignature: storedSignature,
    });
    return;
  }

  const expected = buildExpectedPayment(reviewId, data, config);
  if (!expected) {
    res.status(409).send('Payment intent has not been initiated');
    return;
  }

  try {
    const proof = await createVerifier(config).verify({
      txSignature: signature,
      payerPublicKey,
      expected,
    });

    await docRef.update({
      paymentStatus: 'paid',
      paymentTxnId: proof.txSignature,
      paymentTxSignature: proof.txSignature,
      paymentPayerPublicKey: proof.payerPublicKey,
      paymentRecipientPublicKey: proof.recipientPublicKey,
      paymentAmountLamports: proof.amountLamports,
      paymentNetwork: proof.network,
      paymentMemo: proof.memo,
      paymentSlot: proof.slot,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      txSignature: proof.txSignature,
    });
  } catch (err) {
    res
      .status(402)
      .send(err instanceof Error ? err.message : 'Payment verification failed');
  }
});
