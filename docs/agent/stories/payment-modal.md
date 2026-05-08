# Story: Payment Modal

**Slug:** `payment-modal`
**Team:** Yellow (UI) + Orange (hook)
**GitHub issue:** #4
**Status:** Ready

## User Story

As a user, I want to pay a testnet micro-transaction to unlock the full code review.

## Acceptance Criteria

**AC-1**

- Given: I navigate to `/payment?reviewId=<id>`
- When: the page loads
- Then: I see the payment amount, wallet address, and a "Pay with Testnet" button

**AC-2**

- Given: I click "Pay with Testnet"
- When: the transaction is confirmed
- Then: I am navigated to `/receipt/:txnId`

**AC-3**

- Given: the transaction fails
- When: confirmation returns an error
- Then: I see a "Payment failed" message and can retry

## Files

- `src/chat/PaymentModal.tsx`
- `src/chat/PaymentModal.module.css`
- `src/agents/useX402Payment.ts`

## TypeScript

```ts
interface PaymentRequest {
  txnId: string;
  amount: string;
  walletAddress: string;
}
type PaymentStatus = 'idle' | 'pending' | 'confirmed' | 'failed';
```

## Test Plan

- Unit: renders payment details when request is loaded, disables button while processing
- Manual: end-to-end Firestore write/read, navigation to receipt on success
