import styles from './PaySubmitButton.module.css';

interface PaySubmitButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export default function PaySubmitButton({
  disabled = false,
  onClick,
}: PaySubmitButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      Pay &amp; Submit
    </button>
  );
}
