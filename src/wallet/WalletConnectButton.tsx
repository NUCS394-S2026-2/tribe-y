import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React, { useCallback } from 'react';

import styles from './WalletConnectButton.module.css';

/**
 * Topbar-mounted wallet connector. Renders the styled wallet-adapter
 * modal trigger when disconnected, and a compact pubkey chip with a
 * click-to-disconnect affordance when connected.
 */
export function WalletConnectButton() {
  const { connected, publicKey, disconnect } = useWallet();

  const handleDisconnect = useCallback(() => {
    void disconnect().catch((err) => {
      // Disconnect failures are non-fatal — log and move on.
      console.warn('Wallet disconnect failed:', err);
    });
  }, [disconnect]);

  if (connected && publicKey) {
    const pubkey = publicKey.toBase58();
    const truncated = `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
    return (
      <div className={styles.wrap}>
        <button
          type="button"
          className={styles.chip}
          onClick={handleDisconnect}
          title={`${pubkey} — click to disconnect`}
        >
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.pubkey}>{truncated}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <WalletMultiButton />
    </div>
  );
}
