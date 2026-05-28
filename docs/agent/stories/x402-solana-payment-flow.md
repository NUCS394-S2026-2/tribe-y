# Story: Implement X402 / Solana Payment Flow for Premium Code Reviews

## Context

Currently, the application uses a stubbed test-wallet implementation to simulate unlocking premium code reviews. The route-based UX already exists: chat -> `/payment?reviewId=` -> vault. `confirmPayment` marks reviews paid, and the full-review Cloud Function returns HTTP 402 until `paymentStatus === 'paid'`.

This story replaces the stub with a real X402-style Solana payment flow. In this product, "X402" means premium resources stay withheld behind the existing HTTP 402 gate until the server verifies settlement proof. The target real-money-like demo network is Solana Devnet, with a mock verifier path for local development and CI so tests do not require a wallet or RPC.

## Goals

- Connect a real Solana wallet, such as Phantom, via standard wallet adapters.
- Fetch a server-created payment intent containing amount, merchant recipient, and a unique binding memo or intent ID.
- Send a Solana Devnet transaction from the connected wallet to the service wallet.
- Verify the transaction server-side before granting entitlement.
- Keep a documented mock/demo path for automated tests and local development.

## Non-Goals

- Do not put merchant private keys or service secrets in the client.
- Do not allow any code path other than payment confirmation to set `paymentStatus: 'paid'`.
- Do not remove the existing HTTP 402 full-review gate.

## Acceptance Criteria

- **Route-Based Entry:** Given a user navigates to `/payment?reviewId=<activeReviewId>`, when the review exists and belongs to the signed-in user, then the checkout page loads the payment intent for that review.
- **Wallet Connection:** Given a supported Solana wallet is available, when the user connects it, then the UI shows the connected public key and enables payment.
- **Dynamic Pricing:** Given a valid `reviewId`, when `initiatePayment(reviewId)` runs, then the client fetches amount, recipient wallet, network, and unique intent/memo details from `/api/payment/initiate`.
- **Transaction Creation & Execution:** Given a connected wallet and payment intent, when the user clicks Pay, then the app builds a Solana transfer with the correct recipient, amount, and memo/binding, asks the wallet to sign/send it, and receives a real transaction signature.
- **On-Chain Verification:** Given a submitted signature, when `/api/payment/confirm` runs with Solana verification enabled, then it verifies finalized success, destination, amount, payer, and memo or intent binding via RPC.
- **Access Granted:** Given verification succeeds, when the backend updates Firestore, then `codeReviews/{reviewId}` has `paymentStatus: 'paid'`, stores proof details, and the UI redirects to `/vault/<reviewId>`.
- **Idempotency:** Given the same valid signature is confirmed more than once, when `/api/payment/confirm` receives the repeat request, then it returns success without unsafe duplicate writes.
- **Mock Path:** Given `PAYMENT_VERIFIER=mock`, when documented test signatures are submitted in local/CI, then the same HTTP contract unlocks the review without requiring wallet or RPC access.

## Payment Contract

- Default demo network: Solana Devnet.
- Merchant recipient: configured by environment/Firebase params as a public wallet address.
- Amount policy: backend-owned. The client displays and pays the amount returned by `/api/payment/initiate`.
- Binding: backend creates a unique `intentId` or purchase ID for the review. The transfer memo must contain the review binding, preferably both `reviewId` and `intentId`.
- Confirm request body: `{ reviewId, txSignature, payerPublicKey }`. Compatibility with older `txnId` fields may exist during migration, but new code should use `txSignature`.
- Confirm response body should be safe for the UI and must not include paid review content.

## Firestore Contract

Keep `paymentStatus` as the coarse entitlement gate. Add structured proof fields as needed for vault receipt parity and audits:

- `paymentStatus: 'unpaid' | 'pending' | 'paid'`
- `paymentTxnId` or `paymentTxSignature`
- `paymentIntentId`
- `paymentPayerPublicKey`
- `paymentRecipientPublicKey`
- `paymentAmountLamports`
- `paymentNetwork`
- `paymentMemo`
- `paymentSlot`
- `paidAt` or `updatedAt` as ISO 8601 strings

Coordinate exact field names with Vault and Code Review consumers before Phase 3 lands.

## Technical Implementation Plan

### Phase 1: Client State & Hooks (`src/agents/useX402Payment.ts`)

- Remove the stubbed wallet and fixed `TESTNET_AMOUNT`.
- Implement `initiatePayment(reviewId)` to call `/api/payment/initiate` for dynamic payment details.
- Return intent data needed by the UI: amount, lamports, recipient, network, memo, `intentId`, and expiration if present.
- Update state management to handle Solana flow states: `idle`, `connecting`, `signing`, `verifying`, `success`, `error`.
- Keep Firebase bearer auth on initiate and confirm calls.

### Phase 2: Frontend UI (`src/payment/`)

- **`PaymentPage.tsx`:** Read `reviewId` from URL parameters and orchestrate initiate, wallet connection, pay, confirm, and vault redirect.
- **`WalletConnect.tsx`:** Integrate `@solana/wallet-adapter-react` and support Phantom or other installed adapters.
- **`X402PaymentCard.tsx`:** Display dynamic amount, network, recipient, and memo/intent details.
- Build a Solana transfer transaction, attach the memo/binding, request wallet signing/sending, then call `/api/payment/confirm` with `{ reviewId, txSignature, payerPublicKey }`.
- Update UI copy from generic Testnet language to Devnet SOL, including demo troubleshooting where useful.

### Phase 3: Backend Verification (`functions/src/confirmPayment.ts` and related backend files)

- Add or update `/api/payment/initiate` to create the quoted payment intent from server config.
- Introduce a `PaymentVerifier` interface with at least two implementations: `MockPaymentVerifier` and `SolanaPaymentVerifier`.
- Route all transitions to `paymentStatus: 'paid'` through `confirmPayment` after verifier success only.
- Preserve Firebase Auth and `uid` ownership checks for `codeReviews/{reviewId}`.
- For Solana verification, use `@solana/web3.js` RPC to validate:
  - Transaction finalized successfully.
  - Transfer amount meets or equals the expected X402 price.
  - Destination equals the configured service wallet.
  - Payer public key matches the authenticated request expectation.
  - Memo contains the correct `reviewId` and/or `intentId`.
  - Optional freshness checks if defined by the payment intent contract.
- Ensure idempotency for repeated confirms with the same signature and document race behavior.
- Return safe, user-visible errors and avoid leaking entitlement data.

### Phase 4: Testing & Mocks

- Configure `PAYMENT_VERIFIER=mock` or equivalent for local and automated runs.
- Add backend tests for bad confirm payloads, mock proof acceptance, Firestore paid update, and repeat confirm idempotency.
- Add full-review gate tests proving `/api/code-review/full` returns 402 before payment and 200 after valid confirmation.
- Add PaymentPage component tests with mocked wallet/hook states: wallet connect, missing wallet error, successful payment navigation.
- Add `useX402Payment` unit tests stubbing fetch and Firebase ID token for initiate, confirm, and error state transitions.

### Phase 5: Hardening & Rollout

- Add logging or metrics for verify attempts and failure categories: wrong recipient, underpaid, bad memo, RPC errors.
- Add light rate limiting or abuse controls on `confirmPayment` if needed.
- Document required environment variables: verifier mode, Solana RPC URL, merchant recipient public key, amount policy.
- Before merge, run `npm run lint`, `npm test`, and `npm run build`.

## Team Ownership Reminder

See `docs/agent/architecture.md`:

- Yellow owns `src/payment/`, `src/vault/`, chat shell, and user-facing payment copy.
- Orange owns `src/agents/`, `functions/`, and purchasing verification.
- Shared payment fields touching `src/shared/` require coordination with Vault and Code Review consumers.
