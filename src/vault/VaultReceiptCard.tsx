import React from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';

interface VaultReceiptCardProps {
  txnId: string;
  amount: string | undefined;
  network: string | undefined;
  confirmedAt: string | null;
  onSavePdf: () => void;
}

export function VaultReceiptCard({
  txnId,
  amount,
  network,
  confirmedAt,
  onSavePdf,
}: VaultReceiptCardProps) {
  return (
    <div className={cardStyles.receiptCard}>
      <div className={cardStyles.receiptCardTitle}>Vault Receipt - Confirmed</div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Transaction</span>
        <span className={cardStyles.receiptValue}>{txnId}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Amount</span>
        <span className={cardStyles.receiptValue}>{amount ?? '-'}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Network</span>
        <span className={cardStyles.receiptValue}>{network ?? '-'}</span>
      </div>
      <div className={cardStyles.receiptRow}>
        <span className={cardStyles.receiptLabel}>Confirmed</span>
        <span className={cardStyles.receiptValue}>{confirmedAt ?? '-'}</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <button type="button" className={cardStyles.btnGhost} onClick={onSavePdf}>
          Save PDF
        </button>
      </div>
    </div>
  );
}
