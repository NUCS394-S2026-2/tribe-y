import { useCallback, useState } from 'react';

import { getFirebaseIdToken } from '../shared/firebase';

/**
 * In-memory x402-style payment stub for the sales + compass chat PR stack.
 * `confirmPayment` now calls the server-side Cloud Function to write
 * `paymentStatus: 'paid'` in Firestore via Admin SDK.
 */
interface PaymentRequest {
  txnId: string;
  amount: string;
  walletAddress: string;
  reviewId: string;
}

type PaymentStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

interface X402PaymentState {
  initiatePayment: (reviewId: string) => Promise<void>;
  confirmPayment: (txnId: string) => Promise<string | null>;
  paymentRequest: PaymentRequest | null;
  status: PaymentStatus;
}

const TESTNET_WALLET = '0x742d35Cc6634C0532925a3b8D4C9C7b1e3f2A891';
const TESTNET_AMOUNT = '0.001 ETH';

export function useX402Payment(): X402PaymentState {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');

  const initiatePayment = useCallback(async (reviewId: string) => {
    setStatus('pending');
    setPaymentRequest({
      txnId: `txn-${Date.now()}`,
      amount: TESTNET_AMOUNT,
      walletAddress: TESTNET_WALLET,
      reviewId,
    });
  }, []);

  const confirmPayment = useCallback(
    async (txnId: string): Promise<string | null> => {
      const reviewId = paymentRequest?.reviewId;
      if (!reviewId) {
        setStatus('failed');
        return null;
      }

      try {
        const idToken = await getFirebaseIdToken();
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ reviewId, txnId }),
        });

        if (!res.ok) {
          setStatus('failed');
          return null;
        }

        setStatus('confirmed');
        return txnId;
      } catch {
        setStatus('failed');
        return null;
      }
    },
    [paymentRequest],
  );

  return { initiatePayment, confirmPayment, paymentRequest, status };
}
