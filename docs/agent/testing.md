# Testing Guide

Owned by **WORKING_GROUP_DEV_PRACTICES**. Read alongside the story spec's test plan before writing any test.

## What to Test

**Unit (Vitest + jsdom):** pure functions, custom hooks (`renderHook`), UI state logic. Mock Firestore/Auth at the boundary.

**Integration:** components that read/write Firestore; auth-gated routes. Use Firestore emulator.
Setup: FIRESTORE_EMULATOR_SETUP_NOTES

**Manual:** visual appearance, animations, browser-specific behavior, end-to-end happy paths in preview before merging a sprint.
ADDITIONAL_MANUAL_VERIFICATION_ITEMS

## Vitest Patterns

```tsx
// Query by role — resilient to text changes
screen.getByRole('button', { name: /submit/i });

// userEvent over fireEvent
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /submit/i }));

// Async state updates
await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
```

A

## Test Naming

Mirror the story spec's Given/When/Then ACs so failing tests trace back to the spec:

```
it('redirects unauthenticated users from /dashboard to /login', ...)
```

## Coverage

`vite.config.ts` enforces 70% for statements, branches, functions, and lines. Do not lower without an ADR.
