import React, { useEffect, useState } from 'react';

import { downloadReportPdf, reportPdfBlobUrl } from '../../shared/reportPdf';
import type { SampleReportData } from '../../shared/types/ChatSession';
import { AssistantMessageRow } from './AssistantMessageRow';
import styles from './SampleReportMessage.module.css';

interface SampleReportMessageProps {
  data: SampleReportData;
  onPayForFullReview: () => void;
}

export function SampleReportMessage({
  data,
  onPayForFullReview,
}: SampleReportMessageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(reportPdfBlobUrl(data));
  };

  return (
    <AssistantMessageRow>
      <div className={styles.card}>
        <div className={styles.title}>📄 {data.reportTitle} — Sample</div>
        <div className={styles.meta}>
          Slice: lines {data.slice.startLine}–{data.slice.endLine} · {data.slice.reason}
        </div>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Summary</div>
          <p className={styles.body}>{data.summary || '(no summary)'}</p>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Findings ({data.findings.length})</div>
          {data.findings.length === 0 ? (
            <p className={styles.body}>
              No issues detected in this slice. The full report scans the entire codebase.
            </p>
          ) : (
            <ul className={styles.findings}>
              {data.findings.map((f, i) => (
                <li key={i} className={styles.finding}>
                  <div className={styles.findingHeader}>
                    <span
                      className={`${styles.sev} ${styles[`sev_${f.severity}`] ?? ''}`}
                    >
                      {f.severity}
                    </span>
                    {f.line !== undefined && (
                      <span className={styles.line}>line {f.line}</span>
                    )}
                    <span className={styles.findingTitle}>{f.title}</span>
                  </div>
                  <p className={styles.body}>{f.detail}</p>
                  {f.recommendation && (
                    <p className={styles.fix}>
                      <strong>Fix:</strong> {f.recommendation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Conclusion</div>
          <p className={styles.body}>{data.conclusion}</p>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={handlePreview}>
            {previewUrl ? 'Hide preview' : 'Preview PDF'}
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

        {previewUrl && (
          <iframe
            title="Sample report PDF preview"
            src={previewUrl}
            className={styles.previewFrame}
          />
        )}
      </div>
    </AssistantMessageRow>
  );
}
