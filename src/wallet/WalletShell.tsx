import '@solana/wallet-adapter-react-ui/styles.css';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import React, { useMemo } from 'react';

/**
 * Solana devnet RPC endpoint. The reviewer service expects payments on
 * `solana-devnet`; mainnet/testnet are intentionally not supported.
 */
const SOLANA_DEVNET_ENDPOINT = 'https://api.devnet.solana.com';

interface WalletShellProps {
  children: React.ReactNode;
}

/**
 * Wraps the React tree with the Solana wallet-adapter providers so the
 * rest of the app (topbar connect button, payment helpers in the chat
 * orchestrator, etc.) can read wallet state via `useWallet()` /
 * `useConnection()`. Mounts the modal provider so any descendant can pop
 * the styled connect modal via `WalletMultiButton` or `useWalletModal()`.
 */
export default function WalletShell({ children }: WalletShellProps) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={SOLANA_DEVNET_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
