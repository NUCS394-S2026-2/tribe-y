import styles from './PaymentPage.module.css';

export default function PaymentPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Complete Purchase</h1>
        <p className={styles.subhead}>
          Provide your wallet address and upload your code archive to begin the full
          review.
        </p>
      </div>
    </main>
  );
}
