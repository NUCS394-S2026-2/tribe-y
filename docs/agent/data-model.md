# Data Model Guide

Owned by **Architecture/Design Guild**. Read before writing any code that touches Firestore.

## Firestore Collections

| Collection | Path | Document ID |
|---|---|---|
| Users | `/users/{uid}` | Firebase Auth UID |
| Code Reviews | `/codeReviews/{reviewId}` | Firestore auto-ID |
| Transactions | `/transactions/{txnId}` | Firestore auto-ID |

TypeScript types for each collection live in `src/shared/types/`. Read those before writing any Firestore read or write.

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
