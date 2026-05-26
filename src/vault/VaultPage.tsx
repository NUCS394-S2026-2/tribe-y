import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useAuth } from '../shared/hooks/useAuth';
import { useFirestoreDoc } from '../shared/hooks/useFirestoreDoc';
import cardStyles from '../shared/styles/actionCards.module.css';
import type { CodeReview } from '../shared/types/CodeReview';
import styles from './VaultPage.module.css';
import { VaultReceiptCard } from './VaultReceiptCard';

interface VaultLocationState {
  txnId?: string;
  confirmedAt?: string;
}

export function VaultPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const location = useLocation();
  const navState = (location.state as VaultLocationState | null) ?? {};
  const { user, loading: authLoading } = useAuth();
  const {
    data: review,
    loading: reviewLoading,
    error,
  } = useFirestoreDoc<CodeReview>('codeReviews', reviewId ?? null);

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

  if (review.paymentStatus !== 'paid') {
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

  const txnId = navState.txnId ?? review.paymentTxSignature ?? review.paymentTxnId ?? '-';
  const amount =
    review.paymentAmount && review.paymentCurrency
      ? `${review.paymentAmount} ${review.paymentCurrency}`
      : undefined;
  const confirmedAt = navState.confirmedAt ?? review.paidAt ?? review.updatedAt ?? null;

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
        <VaultReceiptCard
          txnId={txnId}
          amount={amount}
          network={review.paymentNetwork ?? undefined}
          confirmedAt={confirmedAt}
          onSavePdf={() => window.print()}
        />

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
