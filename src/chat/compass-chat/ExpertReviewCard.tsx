import React from 'react';

import ReportCard from '../../components/report-card/ReportCard';
import { createReportCardDataFromTeaser } from '../../components/report-card/reportCardData';
import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

interface ExpertReviewCardProps {
  teaserReview: string;
  showPayButton?: boolean;
  onPayForFullReview: () => void;
}

export function ExpertReviewCard({
  teaserReview,
  showPayButton = true, // set to true
  onPayForFullReview,
}: ExpertReviewCardProps) {
  const reportCardData = createReportCardDataFromTeaser(teaserReview);

  return (
    <AssistantMessageRow>
      <div className={styles.reviewCard}>
        <div className={styles.reviewCardTitle}>⚠ Teaser Review — Issues Found</div>
        <pre className={styles.reviewCardBody}>{teaserReview}</pre>
        <ReportCard data={reportCardData} />
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
