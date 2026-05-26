import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { attachCodebaseToReview, fetchFullReviewById } from '../agents/codeReviewApi';
import { isReportType, REPORT_TYPES } from '../agents/reportTypes';
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

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewId = searchParams.get('reviewId');
  const reportTypeParam = searchParams.get('reportType');
  const reportType = isReportType(reportTypeParam) ? reportTypeParam : null;
  const reportTitle = reportType
    ? (REPORT_TYPES.find((rt) => rt.id === reportType)?.title ?? null)
    : null;
  const locationState = location.state as LocationState | null;

  const { initiatePayment, confirmPayment, paymentRequest } = useX402Payment();
  const [walletConnected, setWalletConnected] = useState(false);
  const [codebaseFile, setCodebaseFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-populate the codebase file if it was passed from chat
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
    if (!walletConnected) {
      setError('Connect your wallet before paying.');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      if (codebaseFile) {
        await attachCodebaseToReview(reviewId, codebaseFile.name, codebaseFile.content);
      }

      const txnId = await confirmPayment(paymentRequest.txnId, reviewId);
      if (!txnId) {
        setError('Payment could not be confirmed. Please try again.');
        return;
      }

      await fetchFullReviewById(reviewId);
      navigate(`/vault/${encodeURIComponent(reviewId)}`, {
        state: { txnId, confirmedAt: new Date().toLocaleString() },
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
        {reportTitle && (
          <p className={styles.subtitle}>
            <strong>You&apos;re paying for:</strong> {reportTitle}
          </p>
        )}
      </header>

      <main className={styles.content}>
        <WalletConnect
          connected={walletConnected}
          onConnect={() => setWalletConnected(true)}
        />

        <CodebaseUpload
          onFileSelected={handleFileSelected}
          preselectedFile={codebaseFile}
        />

        {paymentRequest && (
          <X402PaymentCard
            payment={{
              amount: paymentRequest.amount,
              walletAddress: paymentRequest.walletAddress,
            }}
            isPaying={isPaying}
            onPay={handlePay}
          />
        )}

        {isPaying && <p className={styles.processing}>Confirming payment on testnet…</p>}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <Link to="/chat" className={styles.backLink}>
          ← Back to Chat
        </Link>
      </main>
    </div>
  );
}
