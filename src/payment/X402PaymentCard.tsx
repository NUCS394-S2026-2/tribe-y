import React from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';

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
    <div className={cardStyles.paymentCard}>
      <div className={cardStyles.paymentCardTitle}>X.402 Micro-Payment</div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Amount</span>
        <span className={cardStyles.paymentValue}>{payment.amount}</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Network</span>
        <span className={cardStyles.paymentValue}>Testnet</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Wallet</span>
        <span className={cardStyles.paymentValue}>{payment.walletAddress}</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          className={cardStyles.btnGold}
          onClick={onPay}
          disabled={isPaying}
        >
          {isPaying ? 'Processing…' : 'Pay with Testnet'}
        </button>
      </div>
    </div>
  );
}
