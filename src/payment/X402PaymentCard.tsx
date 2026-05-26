import React from 'react';

import type { PaymentRequest } from '../agents/useX402Payment';
import cardStyles from '../shared/styles/actionCards.module.css';

interface X402PaymentCardProps {
  payment: PaymentRequest;
  isPaying: boolean;
  canPay: boolean;
  onPay: () => void;
}

export function X402PaymentCard({
  payment,
  isPaying,
  canPay,
  onPay,
}: X402PaymentCardProps) {
  return (
    <div className={cardStyles.paymentCard}>
      <div className={cardStyles.paymentCardTitle}>X.402 Solana Payment</div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Amount</span>
        <span className={cardStyles.paymentValue}>
          {payment.amount} {payment.currency}
        </span>
      </div>
      {payment.amountLamports !== null && (
        <div className={cardStyles.paymentRow}>
          <span className={cardStyles.paymentLabel}>Lamports</span>
          <span className={cardStyles.paymentValue}>{payment.amountLamports}</span>
        </div>
      )}
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Network</span>
        <span className={cardStyles.paymentValue}>{payment.network}</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Recipient</span>
        <span className={cardStyles.paymentValue}>{payment.receiverAddress}</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Intent</span>
        <span className={cardStyles.paymentValue}>{payment.intentId}</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Memo</span>
        <span className={cardStyles.paymentValue}>{payment.memo}</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          className={cardStyles.btnGold}
          onClick={onPay}
          disabled={!canPay || isPaying}
        >
          {isPaying ? 'Processing...' : 'Pay with SOL'}
        </button>
      </div>
    </div>
  );
}
