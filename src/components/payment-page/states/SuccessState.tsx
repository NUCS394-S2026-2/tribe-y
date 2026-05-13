import styles from './SuccessState.module.css';

interface SuccessStateProps {
  vaultUrl: string;
  transactionId: string;
}

export default function SuccessState({ vaultUrl, transactionId }: SuccessStateProps) {
  return (
    <section className={styles.panel} role="status" aria-live="polite">
      <div className={styles.statusBadge}>
        <span className={styles.statusText}>Payment Confirmed</span>
      </div>
      <h2 className={styles.heading}>Your review is queued.</h2>
      <p className={styles.body}>
        We&apos;ve received your purchase. The completed review will be delivered to your
        vault below.
      </p>
      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Vault URL</dt>
          <dd className={styles.detailValue}>
            <a href={vaultUrl} className={styles.link}>
              {vaultUrl}
            </a>
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt className={styles.detailLabel}>Transaction</dt>
          <dd className={styles.detailValue}>{transactionId}</dd>
        </div>
      </dl>
    </section>
  );
}
