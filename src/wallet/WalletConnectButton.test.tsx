import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const useWalletMock = vi.fn();

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => useWalletMock(),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <button type="button">Select Wallet</button>,
}));

import { WalletConnectButton } from './WalletConnectButton';

describe('WalletConnectButton', () => {
  beforeEach(() => {
    useWalletMock.mockReset();
  });

  test('renders the wallet-adapter modal trigger when disconnected', () => {
    useWalletMock.mockReturnValue({
      connected: false,
      publicKey: null,
      disconnect: vi.fn(),
    });

    render(<WalletConnectButton />);

    expect(screen.getByRole('button', { name: /select wallet/i })).toBeInTheDocument();
  });

  test('renders a truncated pubkey chip when connected', () => {
    const pubkey = '7xKXAbCDEFghijKLmnOPqrStuvwXyz12345678AbC';
    useWalletMock.mockReturnValue({
      connected: true,
      publicKey: { toBase58: () => pubkey },
      disconnect: vi.fn(),
    });

    render(<WalletConnectButton />);

    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('title', expect.stringContaining(pubkey));
    expect(chip.textContent).toContain('7xKX');
    expect(chip.textContent).toContain('AbC');
    expect(chip.textContent).toContain('…');
  });
});
