import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { db, getUid } from '../shared/firebase';

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

    // Generate a local txnId immediately — never block on Firestore
    const localTxnId = `txn-${Date.now()}`;

    const request: PaymentRequest = {
      txnId: localTxnId,
      amount: TESTNET_AMOUNT,
      walletAddress: TESTNET_WALLET,
      reviewId,
    };

    setPaymentRequest(request);

    // Fire-and-forget Firestore write
    const now = new Date().toISOString();
    addDoc(collection(db, 'transactions'), {
      txnId: localTxnId,
      uid: getUid(),
      reviewId,
      amount: TESTNET_AMOUNT,
      walletAddress: TESTNET_WALLET,
      status: 'pending',
      network: 'testnet',
      createdAt: now,
      confirmedAt: null,
      serverTimestamp: serverTimestamp(),
    })
      .then((docRef) => {
        // Update with Firestore-generated doc ID if write succeeds
        updateDoc(docRef, { txnId: docRef.id }).catch(() => {});
      })
      .catch(() => {});
  }, []);

  const confirmPayment = useCallback(
    async (txnId: string): Promise<string | null> => {
      setStatus('pending');

      const confirmedAt = new Date().toISOString();

      // Update Firestore if available — but don't block on it
      const txnRef = doc(db, 'transactions', txnId);
      updateDoc(txnRef, { status: 'confirmed', confirmedAt })
        .then(() => {
          // Also mark the review as paid
          if (
            paymentRequest?.reviewId &&
            !paymentRequest.reviewId.startsWith('local-') &&
            !paymentRequest.reviewId.startsWith('review-')
          ) {
            const reviewRef = doc(db, 'codeReviews', paymentRequest.reviewId);
            updateDoc(reviewRef, { paymentStatus: 'paid', updatedAt: confirmedAt }).catch(
              () => {},
            );
          }
        })
        .catch(() => {});

      setStatus('confirmed');
      return txnId;
    },
    [paymentRequest],
  );

  return { initiatePayment, confirmPayment, paymentRequest, status };
}
