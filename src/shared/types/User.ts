import { FieldValue, Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt?: Timestamp | FieldValue;
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
