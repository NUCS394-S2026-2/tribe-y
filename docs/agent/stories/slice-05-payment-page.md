# Story: Payment Page with Stub Purchasing Agent

**Slug:** `slice-05-payment-page` | **Status:** Draft
**Issue:** #27 | **Team:** Orange (agent) + Yellow (UI) — see scope note

---

## User Story

> As a user who has agreed to purchase a full code review, I want a
> dedicated payment page where I can enter my wallet address, upload
> my code archive, and submit the purchase, so that I can complete
> the transaction and receive a vault URL for my finished review.

## Scope Note

This story spans both Yellow (Payment Page UI) and Orange (stub
Purchasing Agent) ownership. The UI and the stub agent are built
together as a vertical slice so the end-to-end payment UX is
independently demoable, ahead of real Stripe / x402 / A2A work in
SLICE-06.

## Acceptance Criteria

**AC-1 (page reachable):** Given the user navigates directly to
`/payment`, When the page loads, Then the payment form renders with
wallet input, file upload, and a "Pay & Submit" button.

**AC-2 (wallet validation):** Given the user enters a string in the
wallet field, When it does not match the EVM format (`0x` followed by
40 hex characters), Then the submit button is disabled and an inline
error message explains the expected format.

**AC-3 (file upload):** Given the user opens the file picker, When
they select a file, Then only `.zip` files are accepted; non-zip files
display an inline error.

**AC-4 (loading state):** Given a valid wallet and a valid zip file,
When the user clicks "Pay & Submit", Then the page shows a loading
state while the stub purchasing agent processes (approximately 2
seconds).

**AC-5 (success state):** Given the stub purchasing agent returns
success, When the response is received, Then the page shows a success
state displaying the returned vault URL.

**AC-6 (error state):** Given the stub purchasing agent returns an
error response, When the response is received, Then the page shows an
error state with the error message and a retry option.

**AC-7 (contract):** Given any caller imports the Purchasing Agent's
public surface, Then the exported types (`PurchaseRequest`,
`PurchaseResponse`) are the single source of truth and consumable from
`src/agents/purchasing-agent`.

## Technical Approach

The Payment Page lives at `/payment`, behind a `react-router-dom`
`BrowserRouter` that is added in this PR (the project currently has no
router). The page composes three subcomponents — `WalletInput`,
`FileUpload`, `PaySubmitButton` — and renders one of three states
(form / loading / success / error) based on local component state.

The stub Purchasing Agent lives in `src/agents/purchasing-agent/` and
exports `submitPurchase(req: PurchaseRequest): Promise<PurchaseResponse>`.
It validates inputs, waits ~2 seconds, and returns a hardcoded success
response with a fake vault URL. Error cases short-circuit without
delay.

Contract types live in `src/agents/purchasing-agent/types.ts` for now;
they will move to `src/shared/contracts/` once SETUP-01 kickoff
finalizes the canonical contract location.

Styling follows existing CSS Modules conventions and reuses the design
tokens (`--primary`, `--accent`, `--contrast`, `--text-muted`,
`--surface-border`, JetBrains Mono) established in HeroSection.

| File                                                  | Change                                        |
| ----------------------------------------------------- | --------------------------------------------- |
| `package.json`                                        | Add `react-router-dom`                        |
| `src/main.tsx`                                        | Wrap App in `<BrowserRouter>`                 |
| `src/App.tsx`                                         | Replace direct render with `<Routes>`         |
| `src/agents/purchasing-agent/types.ts`                | New: PurchaseRequest / PurchaseResponse types |
| `src/agents/purchasing-agent/validation.ts`           | New: wallet + file validation utilities       |
| `src/agents/purchasing-agent/submitPurchase.ts`       | New: stub implementation with ~2s delay       |
| `src/agents/purchasing-agent/index.ts`                | New: public barrel export                     |
| `src/agents/purchasing-agent/submitPurchase.test.ts`  | New: unit tests for agent                     |
| `src/components/payment-page/PaymentPage.tsx`         | New: page component, owns top-level state     |
| `src/components/payment-page/PaymentPage.module.css`  | New: page styles                              |
| `src/components/payment-page/WalletInput.tsx`         | New: validated wallet input                   |
| `src/components/payment-page/FileUpload.tsx`          | New: zip-only file upload                     |
| `src/components/payment-page/PaySubmitButton.tsx`     | New: submit button with disabled state        |
| `src/components/payment-page/states/LoadingState.tsx` | New: loading view                             |
| `src/components/payment-page/states/SuccessState.tsx` | New: success view with vault URL              |
| `src/components/payment-page/states/ErrorState.tsx`   | New: error view with retry                    |

## Interfaces

```typescript
export interface PurchaseRequest {
  walletAddress: string;
  file: {
    name: string;
    sizeBytes: number;
    mimeType: string;
  };
}

export type PurchaseResponse =
  | {
      status: 'success';
      vaultUrl: string;
      transactionId: string;
    }
  | {
      status: 'error';
      errorCode: PurchaseErrorCode;
      message: string;
    };

export type PurchaseErrorCode =
  | 'INVALID_WALLET'
  | 'MISSING_FILE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INTERNAL_ERROR';
```

## Test Plan

- **Unit:** `submitPurchase` returns success with a vault URL after ~2s for valid input (AC-4, AC-5)
- **Unit:** `submitPurchase` returns `INVALID_WALLET` immediately for malformed wallets (AC-2)
- **Unit:** `submitPurchase` returns `UNSUPPORTED_FILE_TYPE` for non-zip files (AC-3)
- **Unit:** `submitPurchase` returns `MISSING_FILE` when file payload is absent
- **Unit:** `WalletInput` displays an error message when input fails validation (AC-2)
- **Unit:** `FileUpload` rejects non-zip files with an inline error (AC-3)
- **Integration:** Full flow — fill wallet → upload zip → click submit → loading → success state with vault URL (AC-1, AC-4, AC-5)
- **Integration:** Error flow — agent returns error → error state renders → retry resets back to form (AC-6)

## Out of Scope

- Real Stripe checkout (SLICE-06)
- Real x402 payment authorization (SLICE-06)
- A2A handoff to Code Review Agent (SLICE-06)
- Persisting transaction record to Firestore (SLICE-06)
- Reachable-from-chat entry point (SLICE-01 will wire the in-chat pay button to `/payment`)
- Auth-gating the payment route (not in this iteration)

## Done When

- [ ] All ACs pass (tests green)
- [ ] `npm run lint`, `npm test`, `npm run build` all pass
- [ ] Stories README index updated with new slug
- [ ] PR reviewed by Orange team owner (agent code) and Yellow team owner (UI code)
- [ ] Manually verified at `/payment` in dev: form → loading → success path reachable; error path reachable by passing an invalid wallet
