import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import styles from './PdfPreviewModal.module.css';

interface PdfPreviewModalProps {
  title: string;
  url: string;
  onClose: () => void;
  onDownload: () => void;
}

export function PdfPreviewModal({
  title,
  url,
  onClose,
  onDownload,
}: PdfPreviewModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} PDF preview`}
    >
      <button
        type="button"
        className={styles.dismiss}
        onClick={onClose}
        aria-label="Close preview"
      />
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.title}>{title} — Sample PDF</div>
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={onDownload}>
              Download PDF
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={onClose}
              aria-label="Close preview"
            >
              Close
            </button>
          </div>
        </header>
        <iframe title={`${title} PDF preview`} src={url} className={styles.frame} />
      </div>
    </div>,
    document.body,
  );
}
