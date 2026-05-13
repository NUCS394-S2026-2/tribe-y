export interface User {
  uid: string;
  email: string;
  displayName: string;
  company?: string;
  githubUrl?: string;
  intent?: string;
  credibilityScore?: number;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  preferredLanguage?: string;
  phoneNumber?: string;
  linkedInUrl?: string;
  executiveSummary?: string;
  acquisitionTarget?: string;
}
