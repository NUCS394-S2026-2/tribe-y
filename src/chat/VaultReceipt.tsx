import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useFirestoreDoc } from '../shared/hooks/useFirestoreDoc';
import { Transaction } from '../shared/types/Transaction';
import styles from './VaultReceipt.module.css';

export function VaultReceipt() {
  const { txnId } = useParams<{ txnId: string }>();
  const navigate = useNavigate();
  const { data: txn, loading } = useFirestoreDoc<Transaction>(
    'transactions',
    txnId ?? null,
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading receipt…</p>
      </div>
    );
  }

  const displayId = txnId ?? '—';
  const amount = txn?.amount ?? '—';
  const confirmedAt = txn?.confirmedAt ?? '—';
  const network = txn?.network ?? 'testnet';
  const reviewId = txn?.reviewId ?? '—';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.vaultLogo} aria-hidden="true">
          🔒
        </div>
        <h1 className={styles.title}>Vault Receipt</h1>
        <span className={styles.confirmedBadge}>✓ Payment Confirmed</span>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Transaction ID</span>
          <span className={styles.rowValue}>{displayId}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Amount</span>
          <span className={styles.rowValue}>{amount}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Network</span>
          <span className={styles.rowValue}>{network}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Confirmed At</span>
          <span className={styles.rowValue}>{confirmedAt}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.rowLabel}>Review ID</span>
          <span className={styles.rowValue}>{reviewId}</span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.printBtn}
            onClick={() => window.print()}
            aria-label="Download receipt as PDF"
          >
            Download PDF
          </button>
          <button
            className={styles.reviewBtn}
            onClick={() => navigate('/chat')}
            aria-label="View full review"
          >
            View Full Review
          </button>
        </div>
      </div>
    </div>
  );
}
