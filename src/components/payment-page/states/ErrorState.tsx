import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className={styles.panel} role="alert">
      <div className={styles.statusBadge}>
        <span className={styles.statusText}>Payment Failed</span>
      </div>
      <h2 className={styles.heading}>Something went wrong.</h2>
      <p className={styles.body}>{message}</p>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        Try Again
      </button>
    </section>
  );
}
