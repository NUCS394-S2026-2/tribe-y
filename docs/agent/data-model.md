# Data Model Guide

Owned by **WORKING_GROUP_ARCH_DESIGN**. Read before writing any code that touches Firestore.

## Shared `User` Type — define in Iteration 0

```typescript
// Move to src/shared/types/User.ts once finalized
export interface User {
  uid: string;        // Firebase Auth UID — primary key
  email: string;
  displayName: string;
  // TODO: add fields as guild decides
}
```

## Firestore Collections

Document each collection: path, document ID strategy, TypeScript type, subcollections.

```
/users/{uid}               → UserDocument  (mirrors User above)
/COLLECTION_PATH/{docId}   → COLLECTION_DOCUMENT_TYPE
```

Add a `###` section per collection; delete placeholders once real collections are defined.

## State Management Rules

1. **Firestore is source of truth.** Don't duplicate Firestore data in local state without caching intent.
2. **React Context** for session-scoped state (auth user, theme). Use Firestore listeners for domain data.
3. **Props** for component-local data. Avoid drilling beyond two levels — lift to context or Firestore.

STATE_MANAGEMENT_ADDITIONS

## Serialization Rules

- Convert Firestore `Timestamp` to `Date`/ISO string before entering React state.
- Use `null` (not `undefined`) for absent optional fields in Firestore.
- Use a fixed `Date` in tests — never `serverTimestamp()`.

SERIALIZATION_ADDITIONS
