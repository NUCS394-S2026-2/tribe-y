import { useCallback, useState } from 'react';

import { getFirebaseIdToken } from '../shared/firebase';

export interface PaymentRequest {
  reviewId: string;
  intentId: string;
  txnId: string;
  memo: string;
  amount: string;
  amountLamports: number | null;
  currency: string;
  network: string;
  walletAddress: string;
  receiverAddress: string;
  expiresAt: string | null;
}

export type PaymentStatus =
  | 'idle'
  | 'connecting'
  | 'signing'
  | 'verifying'
  | 'success'
  | 'error';

interface X402PaymentState {
  initiatePayment: (reviewId: string) => Promise<PaymentRequest | null>;
  confirmPayment: (
    txSignature: string,
    reviewId?: string,
    payerPublicKey?: string,
  ) => Promise<string | null>;
  setWalletConnecting: () => void;
  setTransactionSigning: () => void;
  resetPayment: () => void;
  paymentRequest: PaymentRequest | null;
  status: PaymentStatus;
  error: string | null;
}

interface InitiatePaymentResponse {
  reviewId?: string;
  intentId?: string;
  txnId?: string;
  memo?: string;
  amount?: string;
  amountLamports?: number;
  lamports?: number;
  currency?: string;
  network?: string;
  walletAddress?: string;
  receiverAddress?: string;
  serviceWalletAddress?: string;
  expiresAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(
  source: Record<string, unknown>,
  key: keyof InitiatePaymentResponse,
): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readNumber(
  source: Record<string, unknown>,
  key: keyof InitiatePaymentResponse,
): number | undefined {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizePaymentRequest(reviewId: string, payload: unknown): PaymentRequest {
  if (!isRecord(payload)) {
    throw new Error('Payment initiation returned an invalid response.');
  }

  const intentId = readString(payload, 'intentId') ?? readString(payload, 'txnId');
  const receiverAddress =
    readString(payload, 'receiverAddress') ??
    readString(payload, 'serviceWalletAddress') ??
    readString(payload, 'walletAddress');
  const amount = readString(payload, 'amount');

  if (!intentId || !receiverAddress || !amount) {
    throw new Error('Payment initiation response is missing required details.');
  }

  const responseReviewId = readString(payload, 'reviewId') ?? reviewId;
  const memo = readString(payload, 'memo') ?? `${responseReviewId}:${intentId}`;
  const amountLamports =
    readNumber(payload, 'amountLamports') ?? readNumber(payload, 'lamports') ?? null;

  return {
    reviewId: responseReviewId,
    intentId,
    txnId: intentId,
    memo,
    amount,
    amountLamports,
    currency: readString(payload, 'currency') ?? 'SOL',
    network: readString(payload, 'network') ?? 'solana',
    walletAddress: receiverAddress,
    receiverAddress,
    expiresAt: readString(payload, 'expiresAt') ?? null,
  };
}

export function useX402Payment(): X402PaymentState {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(async (reviewId: string) => {
    setStatus('connecting');
    setError(null);

    try {
      const idToken = await getFirebaseIdToken();
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ reviewId }),
      });

      if (!res.ok) {
        throw new Error('Payment could not be initiated. Please try again.');
      }

      const request = normalizePaymentRequest(reviewId, await res.json());
      setPaymentRequest(request);
      setStatus('idle');
      return request;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Payment could not be initiated. Please try again.';
      setPaymentRequest(null);
      setStatus('error');
      setError(message);
      return null;
    }
  }, []);

  const confirmPayment = useCallback(
    async (
      txSignature: string,
      reviewIdOverride?: string,
      payerPublicKey?: string,
    ): Promise<string | null> => {
      const reviewId = reviewIdOverride ?? paymentRequest?.reviewId;
      if (!reviewId) {
        setStatus('error');
        setError('A review ID is required to confirm payment.');
        return null;
      }

      setStatus('verifying');
      setError(null);

      try {
        const idToken = await getFirebaseIdToken();
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            reviewId,
            txSignature,
            txnId: txSignature,
            payerPublicKey,
          }),
        });

        if (!res.ok) {
          setStatus('error');
          setError('Payment could not be confirmed. Please try again.');
          return null;
        }

        setStatus('success');
        return txSignature;
      } catch (err) {
        setStatus('error');
        setError(
          err instanceof Error
            ? err.message
            : 'Payment could not be confirmed. Please try again.',
        );
        return null;
      }
    },
    [paymentRequest],
  );

  const setWalletConnecting = useCallback(() => {
    setStatus('connecting');
    setError(null);
  }, []);

  const setTransactionSigning = useCallback(() => {
    setStatus('signing');
    setError(null);
  }, []);

  const resetPayment = useCallback(() => {
    setPaymentRequest(null);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    initiatePayment,
    confirmPayment,
    setWalletConnecting,
    setTransactionSigning,
    resetPayment,
    paymentRequest,
    status,
    error,
  };
}
