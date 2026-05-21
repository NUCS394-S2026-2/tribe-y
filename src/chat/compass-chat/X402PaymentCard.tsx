import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

export interface PaymentRequestSummary {
  amount: string;
  walletAddress: string;
}

interface X402PaymentCardProps {
  payment: PaymentRequestSummary;
  isPaying: boolean;
  onPay: () => void;
}

export function X402PaymentCard({ payment, isPaying, onPay }: X402PaymentCardProps) {
  return (
    <AssistantMessageRow>
      <div className={styles.paymentCard}>
        <div className={styles.paymentCardTitle}>X.402 Micro-Payment</div>
        <div className={styles.paymentRow}>
          <span className={styles.paymentLabel}>Amount</span>
          <span className={styles.paymentValue}>{payment.amount}</span>
        </div>
        <div className={styles.paymentRow}>
          <span className={styles.paymentLabel}>Network</span>
          <span className={styles.paymentValue}>Testnet</span>
        </div>
        <div className={styles.paymentRow}>
          <span className={styles.paymentLabel}>Wallet</span>
          <span className={styles.paymentValue}>{payment.walletAddress}</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            className={styles.btnGold}
            onClick={onPay}
            disabled={isPaying}
          >
            {isPaying ? 'Processing…' : 'Pay with Testnet'}
          </button>
        </div>
      </div>
    </AssistantMessageRow>
  );
}
