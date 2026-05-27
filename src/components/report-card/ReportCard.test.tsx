import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ReportCard from './ReportCard';
import styles from './ReportCard.module.css';
import type { ReportCardData } from './reportCardData';

function makeReportCardData(healthScore: number): ReportCardData {
  return {
    subject: 'uploaded.cpp',
    auditId: 'LIVE-00001',
    environmentLabel: 'Live Teaser Analysis',
    healthScore,
    alert: '> REVIEW_ALERT: Findings detected.',
    issues: [
      {
        title: 'Issue detected',
        detail: 'Review detail.',
      },
    ],
  };
}

describe('ReportCard', () => {
  test.each([
    [45, styles.scorepoor],
    [70, styles.scorefair],
    [85, styles.scoregood],
  ])('applies score tone class for health score %i', (healthScore, toneClass) => {
    render(<ReportCard data={makeReportCardData(healthScore)} />);

    expect(screen.getByText(String(healthScore))).toHaveClass(toneClass);
  });
});
