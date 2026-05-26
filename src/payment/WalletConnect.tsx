import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { useEffect, useMemo, useState } from 'react';

import cardStyles from '../shared/styles/actionCards.module.css';
import styles from './PaymentPage.module.css';

interface WalletConnectProps {
  onConnecting?: () => void;
}

function formatPublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export function WalletConnect({ onConnecting }: WalletConnectProps) {
  const {
    connect,
    connected,
    connecting,
    disconnect,
    publicKey,
    select,
    wallet,
    wallets,
  } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [connectAfterSelect, setConnectAfterSelect] = useState(false);

  const selectableWallets = useMemo(
    () =>
      wallets.filter(
        (walletAdapter) =>
          walletAdapter.readyState === WalletReadyState.Installed ||
          walletAdapter.readyState === WalletReadyState.Loadable,
      ),
    [wallets],
  );

  useEffect(() => {
    if (!connectAfterSelect || !wallet || connected || connecting) return;

    setConnectAfterSelect(false);
    void connect().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.');
    });
  }, [connect, connectAfterSelect, connected, connecting, wallet]);

  const handleConnect = async () => {
    setError(null);
    onConnecting?.();

    try {
      const selectedWallet = wallet ?? selectableWallets[0] ?? wallets[0];
      if (!selectedWallet) {
        setError('Install Phantom or another Solana wallet to continue.');
        return;
      }

      if (!wallet) {
        setConnectAfterSelect(true);
        select(selectedWallet.adapter.name);
        return;
      }

      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.');
    }
  };

  return (
    <div className={cardStyles.paymentCard}>
      <div className={cardStyles.paymentCardTitle}>Solana Wallet</div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Network</span>
        <span className={cardStyles.paymentValue}>Devnet</span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Wallet</span>
        <span className={cardStyles.paymentValue}>
          {wallet?.adapter.name ?? 'Not selected'}
        </span>
      </div>
      <div className={cardStyles.paymentRow}>
        <span className={cardStyles.paymentLabel}>Address</span>
        <span className={cardStyles.paymentValue}>
          {publicKey ? formatPublicKey(publicKey.toBase58()) : 'Not connected'}
        </span>
      </div>

      {!connected && selectableWallets.length > 1 && (
        <div className={styles.walletList}>
          {selectableWallets.map((walletAdapter) => (
            <button
              key={walletAdapter.adapter.name}
              type="button"
              className={
                wallet?.adapter.name === walletAdapter.adapter.name
                  ? styles.walletOptionSelected
                  : styles.walletOption
              }
              onClick={() => select(walletAdapter.adapter.name)}
            >
              {walletAdapter.adapter.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.walletActions}>
        {connected ? (
          <>
            <span className={styles.connectedBadge}>Connected</span>
            <button type="button" className={cardStyles.btnGhost} onClick={disconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            className={cardStyles.btnPrimary}
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
