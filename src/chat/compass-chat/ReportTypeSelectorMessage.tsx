import React from 'react';

import { REPORT_TYPES, type ReportType } from '../../agents/reportTypes';
import { AssistantMessageRow } from './AssistantMessageRow';
import styles from './ReportTypeSelectorMessage.module.css';

interface ReportTypeSelectorMessageProps {
  selectedReportType: ReportType | null;
  disabled: boolean;
  onSelect: (reportType: ReportType) => void;
}

export function ReportTypeSelectorMessage({
  selectedReportType,
  disabled,
  onSelect,
}: ReportTypeSelectorMessageProps) {
  return (
    <AssistantMessageRow>
      <div className={styles.wrap}>
        <div className={styles.heading}>Pick a report to preview</div>
        <p className={styles.sub}>
          I&apos;ll generate a sample report on the most review-worthy slice of your code.
          Like what you see? Pay to unlock the full report on your entire codebase.
        </p>
        <div className={styles.grid}>
          {REPORT_TYPES.map((rt) => {
            const isActive = selectedReportType === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
                disabled={disabled}
                onClick={() => onSelect(rt.id)}
              >
                <div className={styles.cardTitle}>{rt.title}</div>
                <div className={styles.cardBlurb}>{rt.blurb}</div>
                {isActive && <div className={styles.cardBadge}>Selected</div>}
              </button>
            );
          })}
        </div>
      </div>
    </AssistantMessageRow>
  );
}
