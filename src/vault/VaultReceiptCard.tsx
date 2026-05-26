import React from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';
import type { VaultReceipt } from '../shared/types/VaultReceipt';

interface VaultReceiptCardProps {
  receipt: VaultReceipt;
  isExpired: boolean;
  onDownloadReport: () => void;
  onDownloadReceipt: () => void;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

export function VaultReceiptCard({
  receipt,
  isExpired,
  onDownloadReport,
  onDownloadReceipt,
}: VaultReceiptCardProps) {
  const isDownloadDisabled = isExpired || receipt.downloadTokenUsed;

  return (
    <div className={cardStyles.receiptCard}>
      <div className={cardStyles.receiptCardTitle}>Vault Receipt — Confirmed</div>

      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Receipt ID</span>
        <span className={cardStyles.receiptValue}>{receipt.receiptId}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Review ID</span>
        <span className={cardStyles.receiptValue}>{receipt.reviewId}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Payment Ref</span>
        <span className={cardStyles.receiptValue}>{receipt.paymentRef}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Chain</span>
        <span className={cardStyles.receiptValue}>{receipt.chainId}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Report Type</span>
        <span className={cardStyles.receiptValue}>{receipt.reportType}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Content Hash</span>
        <span className={cardStyles.receiptValue} title={receipt.contentHash}>
          {truncateHash(receipt.contentHash)}
        </span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Issued At</span>
        <span className={cardStyles.receiptValue}>{receipt.issuedAt}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Expires At</span>
        <span className={cardStyles.receiptValue}>{receipt.expiresAt}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Retention</span>
        <span className={cardStyles.receiptValue}>{receipt.retentionPolicy}</span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        <button
          type="button"
          className={cardStyles.btnPrimary}
          onClick={onDownloadReport}
          disabled={isDownloadDisabled}
        >
          Download Report
        </button>
        <button type="button" className={cardStyles.btnGhost} onClick={onDownloadReceipt}>
          Save Receipt JSON
        </button>
      </div>
    </div>
  );
}
