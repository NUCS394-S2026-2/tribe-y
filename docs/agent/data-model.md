# Data Model Guide

Owned by **WORKING_GROUP_ARCH_DESIGN**. Read before writing any code that touches Firestore.

## Shared `User` Type — define in Iteration 0

```typescript
// Move to src/shared/types/User.ts once finalized
export interface User {
  uid: string; // Firebase Auth UID — primary key
  email: string;
  displayName: string;
  company?: string; // Company the user represents
  githubUrl?: string; // Link to their GitHub or code repo
  intent?: string; // What they want to achieve (e.g., "acquire company", "code review", "demo")
  credibilityScore?: number; // System-generated score for credibility/trust
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  preferredLanguage?: string; // e.g., 'C++', 'Python'
  phoneNumber?: string; // For business contact
  linkedInUrl?: string; // Professional profile
  executiveSummary?: string; // CEO's summary or notes
  acquisitionTarget?: string; // Name of company being evaluated
  // Add more as needed for A2A, X402, etc.
}
```

## Firestore Collections

Document each collection: path, document ID strategy, TypeScript type, subcollections.

```
/users/{uid}               → UserDocument  (mirrors User above)
/COLLECTION_PATH/{docId}   → COLLECTION_DOCUMENT_TYPE
```

### /users/{uid}

UserDocument — mirrors User type above.

### /codeReviews/{reviewId}

CodeReviewDocument — stores code snippet, review result, payment status, reviewer info, timestamps.

### /transactions/{txnId}

TransactionDocument — for X402/testnet payments, includes user, amount, status, and timestamp.

## State Management Rules

1. **Firestore is source of truth.** Don't duplicate Firestore data in local state without caching intent.
2. **React Context** for current user, current review session, and payment state.
3. **Firestore listeners** for real-time updates to review status and payment confirmation.
4. **Props** for component-local data. Avoid drilling beyond two levels — lift to context or Firestore.

## Serialization Rules

- Store code snippets as plain text, not as objects.
- Store review results as markdown or plain text.
- Store payment transaction IDs as strings.
- Always use ISO 8601 for date fields.
- Convert Firestore `Timestamp` to `Date`/ISO string before entering React state.
- Use `null` (not `undefined`) for absent optional fields in Firestore.
- Use a fixed `Date` in tests — never `serverTimestamp()`.

SERIALIZATION_ADDITIONS
