# Testing Guide

Owned by **Development Practices Guild**. Read alongside the story spec's test plan before writing any test.

## What to Test

**Unit (Vitest + jsdom):** pure functions, custom hooks (`renderHook`), UI state logic. Mock Firestore/Auth at the boundary.

**Integration:** components that read/write Firestore; auth-gated routes. Use Firestore emulator.

Setup: Use the Firestore emulator for all integration tests. Start the emulator with `firebase emulators:start --only firestore` before running tests. Point the app to the emulator using the `FIRESTORE_EMULATOR_HOST` env variable.

**Manual:** visual appearance, animations, browser-specific behavior, end-to-end happy paths in preview before merging a sprint.

- Verify chat UI is accessible and responsive
- Confirm payment modal works with testnet wallet
- Check receipt is generated and downloadable

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

## Test Naming

Mirror the story spec's Given/When/Then ACs so failing tests trace back to the spec:

```
it('redirects unauthenticated users from /dashboard to /login', ...)
```

## Coverage

`vite.config.ts` enforces 70% for statements, branches, functions, and lines. Do not lower without an ADR.
