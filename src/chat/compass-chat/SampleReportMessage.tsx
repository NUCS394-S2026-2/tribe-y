import React, { useEffect, useMemo, useState } from 'react';

import { downloadReportPdf, reportPdfBlobUrl } from '../../shared/reportPdf';
import type {
  SampleReportData,
  SampleReportFinding,
} from '../../shared/types/ChatSession';
import { AssistantMessageRow } from './AssistantMessageRow';
import { PdfPreviewModal } from './PdfPreviewModal';
import styles from './SampleReportMessage.module.css';

interface SampleReportMessageProps {
  data: SampleReportData;
  onPayForFullReview: () => void;
}

function tallyBySeverity(findings: SampleReportFinding[]) {
  const t = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) t[f.severity] = (t[f.severity] ?? 0) + 1;
  return t;
}

function gradeFor(score: number): string {
  if (score >= 9) return 'A';
  if (score >= 8) return 'A−';
  if (score >= 7) return 'B';
  if (score >= 6) return 'B−';
  if (score >= 5) return 'C';
  if (score >= 4) return 'C−';
  if (score >= 3) return 'D';
  return 'F';
}

function scoreToneClass(score: number): string {
  if (score >= 8) return styles.scoreGood;
  if (score >= 5) return styles.scoreOk;
  if (score >= 3) return styles.scoreWarn;
  return styles.scoreBad;
}

export function SampleReportMessage({
  data,
  onPayForFullReview,
}: SampleReportMessageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const tally = useMemo(() => tallyBySeverity(data.findings), [data.findings]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(reportPdfBlobUrl(data));
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const overall = data.scores.overall;

  return (
    <AssistantMessageRow>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{data.reportTitle}</div>
            <div className={styles.meta}>
              Sample scorecard · lines {data.slice.startLine}–{data.slice.endLine}
            </div>
          </div>
          <div className={`${styles.overall} ${scoreToneClass(overall)}`}>
            <div className={styles.overallScore}>{overall}</div>
            <div className={styles.overallOf}>/ 10</div>
            <div className={styles.overallGrade}>{gradeFor(overall)}</div>
          </div>
        </div>

        <ul className={styles.dimensions}>
          {data.scores.dimensions.map((d, i) => (
            <li key={i} className={styles.dimension}>
              <div className={styles.dimensionRow}>
                <span className={styles.dimensionLabel}>{d.label}</span>
                <span className={`${styles.dimensionScore} ${scoreToneClass(d.score)}`}>
                  {d.score}/10
                </span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${scoreToneClass(d.score)}`}
                  style={{ width: `${(d.score / 10) * 100}%` }}
                />
              </div>
              {d.note && <div className={styles.dimensionNote}>{d.note}</div>}
            </li>
          ))}
        </ul>

        <div className={styles.tally}>
          <span className={`${styles.tallyChip} ${styles.tallyCritical}`}>
            {tally.critical} critical
          </span>
          <span className={`${styles.tallyChip} ${styles.tallyHigh}`}>
            {tally.high} high
          </span>
          <span className={`${styles.tallyChip} ${styles.tallyMedium}`}>
            {tally.medium} medium
          </span>
          <span className={`${styles.tallyChip} ${styles.tallyLow}`}>
            {tally.low} low
          </span>
        </div>

        <p className={styles.footnote}>
          Full breakdown, line-by-line findings, and recommended fixes are in the PDF.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={openPreview}>
            Preview PDF
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => downloadReportPdf(data)}
          >
            Download PDF
          </button>
          <button type="button" className={styles.btnGold} onClick={onPayForFullReview}>
            Pay for full report
          </button>
        </div>
      </div>

      {previewUrl && (
        <PdfPreviewModal
          title={data.reportTitle}
          url={previewUrl}
          onClose={closePreview}
          onDownload={() => downloadReportPdf(data)}
        />
      )}
    </AssistantMessageRow>
  );
}
