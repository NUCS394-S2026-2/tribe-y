import React from 'react';
import { useParams } from 'react-router-dom';

import { useFirestoreDoc } from '../shared/hooks/useFirestoreDoc';
import { Transaction } from '../shared/types/Transaction';
import styles from './A2ACard.module.css';

export function A2ACard() {
  const { txnId } = useParams<{ txnId: string }>();
  const { data: txn } = useFirestoreDoc<Transaction>('transactions', txnId ?? null);

  return (
    <div className={styles.card} role="region" aria-label="A2A engagement card">
      <p className={styles.label}>A2A Engagement Card</p>
      <h2 className={styles.agentName}>C++ Expert Agent</h2>

      <div className={styles.row}>
        <span className={styles.rowLabel}>Agent</span>
        <span className={styles.rowValue}>compass-cpp-expert-v1</span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Review ID</span>
        <span className={styles.rowValue}>{txn?.reviewId ?? '—'}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Transaction</span>
        <span className={styles.rowValue}>{txnId ?? '—'}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Network</span>
        <span className={styles.rowValue}>{txn?.network ?? 'testnet'}</span>
      </div>

      <span className={styles.confirmedBadge}>✓ Engagement Confirmed</span>
    </div>
  );
}
