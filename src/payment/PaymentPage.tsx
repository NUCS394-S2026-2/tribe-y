import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { attachCodebaseToReview, fetchFullReviewById } from '../agents/codeReviewApi';
import { useX402Payment } from '../agents/useX402Payment';
import { CodebaseUpload } from './CodebaseUpload';
import styles from './PaymentPage.module.css';
import { WalletConnect } from './WalletConnect';
import { X402PaymentCard } from './X402PaymentCard';

interface LocationState {
  uploadedFile?: {
    name: string;
    content: string;
  };
}

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewId = searchParams.get('reviewId');
  const locationState = location.state as LocationState | null;

  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const {
    initiatePayment,
    confirmPayment,
    paymentRequest,
    status,
    error: paymentError,
    setWalletConnecting,
    setTransactionSigning,
  } = useX402Payment();
  const [codebaseFile, setCodebaseFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (locationState?.uploadedFile) {
      setCodebaseFile(locationState.uploadedFile);
    }
  }, [locationState]);

  useEffect(() => {
    if (reviewId) {
      void initiatePayment(reviewId);
    }
  }, [reviewId, initiatePayment]);

  const handleFileSelected = useCallback((fileName: string, content: string) => {
    setCodebaseFile({ name: fileName, content });
  }, []);

  const handlePay = async () => {
    if (!reviewId || !paymentRequest) return;
    if (!connected || !publicKey) {
      setError('Connect your wallet before paying.');
      return;
    }
    if (paymentRequest.amountLamports === null) {
      setError('Payment amount is missing. Refresh the page and try again.');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      setTransactionSigning();

      if (codebaseFile) {
        await attachCodebaseToReview(reviewId, codebaseFile.name, codebaseFile.content);
      }

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        blockhash,
        feePayer: publicKey,
        lastValidBlockHeight,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(paymentRequest.receiverAddress),
          lamports: paymentRequest.amountLamports,
        }),
        new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(paymentRequest.memo, 'utf8'),
        }),
      );

      const txSignature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(
        { signature: txSignature, blockhash, lastValidBlockHeight },
        'confirmed',
      );

      const confirmedSignature = await confirmPayment(
        txSignature,
        reviewId,
        publicKey.toBase58(),
      );
      if (!confirmedSignature) {
        setError('Payment could not be confirmed. Please try again.');
        return;
      }

      await fetchFullReviewById(reviewId);
      navigate(`/vault/${encodeURIComponent(reviewId)}`, {
        state: {
          txnId: confirmedSignature,
          confirmedAt: new Date().toLocaleString(),
        },
      });
    } catch (e) {
      console.error('Payment flow error:', e);
      setError(
        e instanceof Error
          ? e.message
          : 'Payment succeeded but review could not be loaded.',
      );
    } finally {
      setIsPaying(false);
    }
  };

  if (!reviewId) {
    return (
      <div className={styles.missingReview}>
        <p>No review selected. Start a preview in chat first.</p>
        <Link to="/chat" className={styles.backLink}>
          Go to Chat
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>compass.tne.ai</div>
        <h1 className={styles.title}>Payment Portal</h1>
        <p className={styles.subtitle}>
          Connect your wallet, upload your full codebase, and pay via X.402 to unlock your
          comprehensive C++ review in the Vault.
        </p>
      </header>

      <main className={styles.content}>
        <WalletConnect onConnecting={setWalletConnecting} />

        <CodebaseUpload
          onFileSelected={handleFileSelected}
          preselectedFile={codebaseFile}
        />

        {paymentRequest && (
          <X402PaymentCard
            payment={paymentRequest}
            isPaying={isPaying}
            canPay={connected && paymentRequest.amountLamports !== null}
            onPay={handlePay}
          />
        )}

        {(status === 'connecting' || !paymentRequest) && (
          <p className={styles.processing}>Preparing payment intent...</p>
        )}

        {(isPaying || status === 'signing' || status === 'verifying') && (
          <p className={styles.processing}>Confirming payment on Solana Devnet...</p>
        )}

        {(error || paymentError) && (
          <p className={styles.error} role="alert">
            {error ?? paymentError}
          </p>
        )}

        <Link to="/chat" className={styles.backLink}>
          Back to Chat
        </Link>
      </main>
    </div>
  );
}
