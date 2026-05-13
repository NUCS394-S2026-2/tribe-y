import { isValidWalletAddress } from '../../agents/purchasing-agent';
import styles from './WalletInput.module.css';

interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function WalletInput({
  value,
  onChange,
  disabled = false,
}: WalletInputProps) {
  const showError = value.length > 0 && !isValidWalletAddress(value);

  return (
    <label className={styles.field}>
      <span className={styles.label}>Wallet Address</span>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0x0000000000000000000000000000000000000000"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        disabled={disabled}
        aria-invalid={showError}
        aria-describedby={showError ? 'wallet-error' : undefined}
      />
      {showError && (
        <span id="wallet-error" className={styles.error} role="alert">
          Wallet must be an EVM-format address (0x followed by 40 hex characters).
        </span>
      )}
    </label>
  );
}
