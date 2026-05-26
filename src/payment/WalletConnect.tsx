import React from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';
import styles from './PaymentPage.module.css';

const TESTNET_WALLET = '0x742d35Cc6634C0532925a3b8D4C9C7b1e3f2A891';

interface WalletConnectProps {
  connected: boolean;
  onConnect: () => void;
}

export function WalletConnect({ connected, onConnect }: WalletConnectProps) {
  return (
    <div className={cardStyles.paymentCard}>
      <div className={cardStyles.paymentCardTitle}>Crypto Wallet</div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Network</span>
        <span className={cardStyles.paymentValue}>Testnet</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Address</span>
        <span className={cardStyles.paymentValue}>{TESTNET_WALLET}</span>
      </div>
      <div className={styles.walletActions}>
        {connected ? (
          <span className={styles.connectedBadge}>Connected</span>
        ) : (
          <button type="button" className={cardStyles.btnPrimary} onClick={onConnect}>
            Connect Testnet Wallet
          </button>
        )}
      </div>
    </div>
  );
}
