import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';
import type { CompassChatStage } from './stages';

interface VaultReceiptCardProps {
  stage: CompassChatStage;
  txnId: string;
  amount: string | undefined;
  confirmedAt: string | null;
  onViewFullReview: () => void;
  onSavePdf: () => void;
}

export function VaultReceiptCard({
  stage,
  txnId,
  amount,
  confirmedAt,
  onViewFullReview,
  onSavePdf,
}: VaultReceiptCardProps) {
  return (
    <AssistantMessageRow>
      <div className={styles.receiptCard}>
        <div className={styles.receiptCardTitle}>🔒 Vault Receipt — Confirmed</div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Transaction</span>
          <span className={styles.receiptValue}>{txnId}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Amount</span>
          <span className={styles.receiptValue}>{amount ?? '—'}</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Network</span>
          <span className={styles.receiptValue}>Testnet</span>
        </div>
        <div className={styles.receiptRow}>
          <span className={styles.receiptLabel}>Confirmed</span>
          <span className={styles.receiptValue}>{confirmedAt ?? '—'}</span>
        </div>
        {stage === 'receipt' && (
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onViewFullReview}
            >
              View Full Review
            </button>
            <button type="button" className={styles.btnGhost} onClick={onSavePdf}>
              Save PDF
            </button>
          </div>
        )}
      </div>
    </AssistantMessageRow>
  );
}
