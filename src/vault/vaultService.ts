import type { VaultReceipt } from '../shared/types/VaultReceipt';

const TTL_MS = 24 * 60 * 60 * 1000;

export function generateDownloadToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeContentHash(content: string): Promise<string> {
  const encoded = new TextEncoder().encode(content);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface BuildReceiptInput {
  reviewId: string;
  paymentRef: string;
  chainId: string;
  contentHash: string;
  reportType: string;
}

export function buildVaultReceipt(input: BuildReceiptInput): VaultReceipt {
  const now = new Date();
  return {
    receiptId: generateDownloadToken().slice(0, 16),
    reviewId: input.reviewId,
    paymentRef: input.paymentRef,
    chainId: input.chainId,
    contentHash: input.contentHash,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
    retentionPolicy: '24h-single-download',
    reportType: input.reportType,
    downloadToken: generateDownloadToken(),
    downloadTokenUsed: false,
  };
}

export function isReceiptValid(receipt: VaultReceipt): boolean {
  if (receipt.downloadTokenUsed) return false;
  return new Date() < new Date(receipt.expiresAt);
}

export function downloadReportAsText(reviewId: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reviewId}-report.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadReceiptAsJson(receipt: VaultReceipt): void {
  const blob = new Blob([JSON.stringify(receipt, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${receipt.receiptId}-receipt.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
