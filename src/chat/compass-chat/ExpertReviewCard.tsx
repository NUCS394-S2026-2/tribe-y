import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

interface ExpertReviewCardProps {
  teaserReview: string;
  showPayButton?: boolean;
  onPayForFullReview: () => void;
}

export function ExpertReviewCard({
  teaserReview,
  showPayButton = true,
  onPayForFullReview,
}: ExpertReviewCardProps) {
  return (
    <AssistantMessageRow>
      <div className={styles.reviewCard}>
        <div className={styles.reviewCardTitle}>⚠ Teaser Review — Issues Found</div>
        <pre className={styles.reviewCardBody}>{teaserReview}</pre>
        {showPayButton && (
          <div className={styles.reviewCardActions}>
            <button type="button" className={styles.btnGold} onClick={onPayForFullReview}>
              Pay for Full Code Review
            </button>
          </div>
        )}
      </div>
    </AssistantMessageRow>
  );
}
