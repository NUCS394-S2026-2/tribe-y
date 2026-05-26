import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import type { VaultReceipt } from '../shared/types/VaultReceipt';
import { VaultReceiptCard } from './VaultReceiptCard';

const baseReceipt: VaultReceipt = {
  receiptId: 'abc123',
  reviewId: 'review-42',
  paymentRef: 'txn-xyz',
  chainId: 'solana-devnet',
  contentHash: 'aabbccdd11223344aabbccdd11223344aabbccdd11223344aabbccdd11223344',
  issuedAt: '2026-05-26T12:00:00.000Z',
  expiresAt: '2026-05-27T12:00:00.000Z',
  retentionPolicy: '24h-single-download',
  reportType: 'security',
  downloadToken: 'ff'.repeat(32),
  downloadTokenUsed: false,
};

describe('VaultReceiptCard', () => {
  test('renders all receipt fields', () => {
    render(
      <VaultReceiptCard
        receipt={baseReceipt}
        isExpired={false}
        onDownloadReport={vi.fn()}
        onDownloadReceipt={vi.fn()}
      />,
    );

    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.getByText('review-42')).toBeInTheDocument();
    expect(screen.getByText('txn-xyz')).toBeInTheDocument();
    expect(screen.getByText('solana-devnet')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();
    expect(screen.getByText('24h-single-download')).toBeInTheDocument();
    // Content hash is truncated in display
    expect(screen.getByText('aabbccdd…3344')).toBeInTheDocument();
  });

  test('Download Report button is enabled when valid', () => {
    render(
      <VaultReceiptCard
        receipt={baseReceipt}
        isExpired={false}
        onDownloadReport={vi.fn()}
        onDownloadReceipt={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /download report/i });
    expect(btn).toBeEnabled();
  });

  test('Download Report button is disabled when expired', () => {
    render(
      <VaultReceiptCard
        receipt={baseReceipt}
        isExpired={true}
        onDownloadReport={vi.fn()}
        onDownloadReceipt={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /download report/i });
    expect(btn).toBeDisabled();
  });

  test('Download Report button is disabled when token used', () => {
    render(
      <VaultReceiptCard
        receipt={{ ...baseReceipt, downloadTokenUsed: true }}
        isExpired={false}
        onDownloadReport={vi.fn()}
        onDownloadReceipt={vi.fn()}
      />,
    );

    const btn = screen.getByRole('button', { name: /download report/i });
    expect(btn).toBeDisabled();
  });

  test('calls onDownloadReport when Download Report clicked', async () => {
    const onDownloadReport = vi.fn();
    render(
      <VaultReceiptCard
        receipt={baseReceipt}
        isExpired={false}
        onDownloadReport={onDownloadReport}
        onDownloadReceipt={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /download report/i }));
    expect(onDownloadReport).toHaveBeenCalledOnce();
  });

  test('calls onDownloadReceipt when Save Receipt JSON clicked', async () => {
    const onDownloadReceipt = vi.fn();
    render(
      <VaultReceiptCard
        receipt={baseReceipt}
        isExpired={false}
        onDownloadReport={vi.fn()}
        onDownloadReceipt={onDownloadReceipt}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /save receipt json/i }));
    expect(onDownloadReceipt).toHaveBeenCalledOnce();
  });
});
