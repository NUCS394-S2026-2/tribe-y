import React, { useMemo } from 'react';

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

function safeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'report';
}

export function SampleReportMessage({
  data,
  onPayForFullReview,
}: SampleReportMessageProps) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const tally = useMemo(() => tallyBySeverity(data.findings), [data.findings]);
  const pdfUrl = data.artifacts?.pdfUrl;
  const hasPdf = typeof pdfUrl === 'string' && pdfUrl.length > 0;
  const downloadName = `compass-${safeFilename(data.reportTitle).toLowerCase()}-sample.pdf`;

  const openPreview = () => {
    if (!hasPdf) return;
    setPreviewOpen(true);
  };

  const closePreview = () => setPreviewOpen(false);

  const downloadPdf = () => {
    if (!hasPdf || !pdfUrl) return;
    // Anchor-based download. Cross-origin signed URLs may ignore the
    // `download` attribute and open inline, which is still acceptable
    // (the user gets the file either way via the storage server's
    // `Content-Disposition: inline; filename=...` header).
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = downloadName;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const overall = data.scores.overall;
  const unavailableTip = 'PDF unavailable for this review';

  return (
    <AssistantMessageRow>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>
              {data.reportTitle}
              {data.isFullReport && <span className={styles.fullBadge}>FULL</span>}
            </div>
            <div className={styles.meta}>
              {data.isFullReport ? 'Full report' : 'Sample scorecard'} · lines{' '}
              {data.slice.startLine}–{data.slice.endLine}
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
          <button
            type="button"
            className={styles.btnGhost}
            onClick={openPreview}
            disabled={!hasPdf}
            title={hasPdf ? undefined : unavailableTip}
          >
            Preview PDF
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={downloadPdf}
            disabled={!hasPdf}
            title={hasPdf ? undefined : unavailableTip}
          >
            Download PDF
          </button>
          {!data.isFullReport && (
            <button type="button" className={styles.btnGold} onClick={onPayForFullReview}>
              Pay for full report
            </button>
          )}
        </div>
      </div>

      {previewOpen && hasPdf && pdfUrl && (
        <PdfPreviewModal
          title={data.reportTitle}
          url={pdfUrl}
          onClose={closePreview}
          onDownload={downloadPdf}
        />
      )}
    </AssistantMessageRow>
  );
}
