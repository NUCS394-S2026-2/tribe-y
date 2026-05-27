export interface VaultReceipt {
  receiptId: string;
  reviewId: string;
  paymentRef: string;
  chainId: string;
  contentHash: string;
  issuedAt: string;
  expiresAt: string;
  retentionPolicy: string;
  reportType: string;
  downloadToken: string;
  downloadTokenUsed: boolean;
}
