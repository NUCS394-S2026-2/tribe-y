export interface CodeReview {
  reviewId: string;
  uid: string;
  snippet: string;
  language: string;
  teaserReview: string;
  fullReview: string | null;
  paymentStatus: 'unpaid' | 'pending' | 'paid';
  paymentTxnId?: string | null;
  codebaseFileName?: string | null;
  codebaseContent?: string | null;
  uploadStatus?: 'none' | 'pending' | 'ready';
  createdAt: string;
  updatedAt: string;
}

/** Max characters stored client-side for uploaded codebase text. */
export const CODEBASE_UPLOAD_MAX_CHARS = 50_000;
