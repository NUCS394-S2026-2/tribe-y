export interface CodeReview {
  reviewId: string;
  uid: string;
  snippet: string;
  language: string;
  teaserReview: string;
  fullReview: string | null;
  paymentStatus: 'unpaid' | 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
}
