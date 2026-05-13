import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';
import type { CompassChatStage } from './stages';

interface ExpertReviewCardProps {
  stage: CompassChatStage;
  teaserReview: string;
  fullReview: string | null;
  onUnlockFullReview: () => void;
}

export function ExpertReviewCard({
  stage,
  teaserReview,
  fullReview,
  onUnlockFullReview,
}: ExpertReviewCardProps) {
  const showUnlock = stage === 'teaser';
  const isFullReviewStage = stage === 'full-review';

  const body =
    isFullReviewStage && fullReview && fullReview.trim().length > 0
      ? fullReview
      : isFullReviewStage
        ? 'Full review could not be loaded. Check the browser console or try analyzing again.'
        : teaserReview;

  return (
    <AssistantMessageRow>
      <div className={styles.reviewCard}>
        <div className={styles.reviewCardTitle}>
          {isFullReviewStage ? '✓ Full Expert Review' : '⚠ Teaser Review — Issues Found'}
        </div>
        <pre className={styles.reviewCardBody}>{body}</pre>
        {showUnlock && (
          <div className={styles.reviewCardActions}>
            <button type="button" className={styles.btnGold} onClick={onUnlockFullReview}>
              🔒 Unlock Full Review
            </button>
          </div>
        )}
      </div>
    </AssistantMessageRow>
  );
}
