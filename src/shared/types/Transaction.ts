export interface Transaction {
  txnId: string;
  uid: string;
  reviewId: string;
  amount: string;
  walletAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
  network: 'testnet';
  createdAt: string;
  confirmedAt: string | null;
}
