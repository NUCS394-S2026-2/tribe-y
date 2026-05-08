import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useX402Payment } from '../agents/useX402Payment';
import styles from './PaymentModal.module.css';

export function PaymentModal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('reviewId') ?? '';
  const { initiatePayment, confirmPayment, paymentRequest, status } = useX402Payment();
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (reviewId) initiatePayment(reviewId);
  }, [reviewId, initiatePayment]);

  const handlePay = async () => {
    if (!paymentRequest) return;
    setHasPaid(true);
    const txnId = await confirmPayment(paymentRequest.txnId);
    if (txnId) navigate(`/receipt/${txnId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label="Payment">
        <h1 className={styles.title}>Unlock Full Review</h1>
        <p className={styles.subtitle}>
          Pay a testnet micro-transaction to receive your complete annotated C++ report.
        </p>

        {paymentRequest && (
          <>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Amount</span>
              <span className={styles.detailValue}>
                {paymentRequest.amount} (testnet)
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Wallet</span>
              <span className={styles.detailValue}>{paymentRequest.walletAddress}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Review ID</span>
              <span className={styles.detailValue}>{reviewId}</span>
            </div>
          </>
        )}

        <button
          className={styles.payBtn}
          onClick={handlePay}
          disabled={!paymentRequest || hasPaid}
          aria-label="Pay with testnet"
        >
          {hasPaid ? 'Processing…' : 'Pay with Testnet'}
        </button>

        {status === 'confirmed' && (
          <p className={`${styles.status} ${styles.statusConfirmed}`}>
            Payment confirmed!
          </p>
        )}
        {status === 'failed' && (
          <p className={`${styles.status} ${styles.statusFailed}`}>
            Payment failed. Please try again.
          </p>
        )}
        {!paymentRequest && <p className={styles.status}>Loading payment details…</p>}
      </div>
    </div>
  );
}
