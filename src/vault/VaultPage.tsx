import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useAuth } from '../shared/hooks/useAuth';
import { useFirestoreDoc } from '../shared/hooks/useFirestoreDoc';
import cardStyles from '../shared/styles/actionCards.module.css';
import type { CodeReview } from '../shared/types/CodeReview';
import type { VaultReceipt } from '../shared/types/VaultReceipt';
import styles from './VaultPage.module.css';
import { VaultReceiptCard } from './VaultReceiptCard';
import {
  buildVaultReceipt,
  computeContentHash,
  downloadReceiptAsJson,
  downloadReportAsText,
  isReceiptValid,
} from './vaultService';

interface VaultLocationState {
  txnId?: string;
  confirmedAt?: string;
  mockPaid?: boolean;
}

function isMockPaymentMode(): boolean {
  const mode = import.meta.env.VITE_PAYMENT_MODE ?? import.meta.env.VITE_PAYMENT_VERIFIER;
  return typeof mode === 'string' && mode.toLowerCase() === 'mock';
}

const CHAIN_ID = 'solana-devnet';
const DEFAULT_REPORT_TYPE = 'security';

export function VaultPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const location = useLocation();
  const navState = (location.state as VaultLocationState | null) ?? {};
  const mockPaymentMode = isMockPaymentMode();
  const { user, loading: authLoading } = useAuth();
  const {
    data: review,
    loading: reviewLoading,
    error,
  } = useFirestoreDoc<CodeReview>('codeReviews', reviewId ?? null);

  const [receipt, setReceipt] = useState<VaultReceipt | null>(null);

  useEffect(() => {
    setReceipt(null);
  }, [reviewId]);

  useEffect(() => {
    if (!review || review.paymentStatus !== 'paid' || !review.fullReview) return;
    if (receipt && receipt.reviewId === review.reviewId) return;

    let cancelled = false;
    computeContentHash(review.fullReview).then((contentHash) => {
      if (cancelled) return;
      setReceipt(
        buildVaultReceipt({
          reviewId: review.reviewId,
          paymentRef: review.paymentTxnId ?? '—',
          chainId: CHAIN_ID,
          contentHash,
          reportType: DEFAULT_REPORT_TYPE,
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [review, receipt]);

  if (!reviewId) {
    return (
      <div className={styles.denied}>
        <p>Invalid vault link.</p>
        <Link to="/chat" className={styles.backLink}>
          Go to Chat
        </Link>
      </div>
    );
  }

  if (authLoading || reviewLoading) {
    return <p className={styles.loading}>Loading your vault...</p>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Could not load vault: {error}</p>
        <Link to="/chat" className={styles.backLink}>
          Go to Chat
        </Link>
      </div>
    );
  }

  if (!review || review.uid !== user?.uid) {
    return (
      <div className={styles.denied}>
        <p>This report is not available in your vault.</p>
        <Link to="/chat" className={styles.backLink}>
          Go to Chat
        </Link>
      </div>
    );
  }

  if (review.paymentStatus !== 'paid' && !(mockPaymentMode && navState.mockPaid)) {
    return (
      <div className={styles.denied}>
        <p>Payment is required to access this vault report.</p>
        <Link
          to={`/payment?reviewId=${encodeURIComponent(reviewId)}`}
          className={styles.backLink}
        >
          Complete Payment
        </Link>
      </div>
    );
  }

  const handleDownloadReport = () => {
    if (!receipt || !review.fullReview) return;
    downloadReportAsText(review.reviewId, review.fullReview);
    setReceipt({ ...receipt, downloadTokenUsed: true });
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    downloadReceiptAsJson(receipt);
  };

  const expired = receipt ? !isReceiptValid(receipt) || receipt.downloadTokenUsed : false;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>compass.tne.ai</div>
        <h1 className={styles.title}>Your Vault</h1>
        <p className={styles.subtitle}>
          This report is private to your account. Only you can view the full expert review
          below.
        </p>
      </header>

      <main className={styles.content}>
        {receipt ? (
          <VaultReceiptCard
            receipt={receipt}
            isExpired={expired}
            onDownloadReport={handleDownloadReport}
            onDownloadReceipt={handleDownloadReceipt}
          />
        ) : (
          <p className={styles.loading}>Building vault receipt…</p>
        )}

        <section className={styles.reviewSection}>
          <h2 className={styles.reviewTitle}>Full Expert Review</h2>
          <pre className={cardStyles.reviewCardBody}>
            {review.fullReview?.trim()
              ? review.fullReview
              : 'Full review is being generated. Refresh in a moment.'}
          </pre>
        </section>

        <Link to="/chat" className={styles.backLink}>
          Back to Chat
        </Link>
      </main>
    </div>
  );
}
