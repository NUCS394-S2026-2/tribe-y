export interface CodeReview {
  reviewId: string;
  uid: string;
  snippet: string;
  language: string;
  teaserReview: string;
  fullReview: string | null;
  paymentStatus: 'unpaid' | 'pending' | 'paid';
  paymentTxnId?: string | null;
  paymentTxSignature?: string | null;
  paymentIntentId?: string | null;
  paymentPayerPublicKey?: string | null;
  paymentRecipientPublicKey?: string | null;
  paymentAmount?: string | null;
  paymentAmountLamports?: number | null;
  paymentCurrency?: string | null;
  paymentNetwork?: string | null;
  paymentMemo?: string | null;
  paymentSlot?: number | null;
  paymentIntentExpiresAt?: string | null;
  paidAt?: string | null;
  codebaseFileName?: string | null;
  codebaseContent?: string | null;
  uploadStatus?: 'none' | 'pending' | 'ready';
  createdAt: string;
  updatedAt: string;
}

/** Max characters stored client-side for uploaded codebase text. */
export const CODEBASE_UPLOAD_MAX_CHARS = 50_000;
