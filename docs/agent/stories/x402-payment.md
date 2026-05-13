# Story: X.402 Payment Integration

**Slug:** `x402-payment`
**Team:** Orange
**GitHub issue:** #8
**Status:** Ready

## User Story

As the platform, I need an X.402-style payment hook that creates a testnet transaction, monitors its status in Firestore, and unlocks the full review on confirmation.

## Acceptance Criteria

**AC-1**

- Given: `initiatePayment(reviewId)` is called
- When: the Firestore write completes
- Then: `paymentRequest` is populated with `txnId`, `amount`, and `walletAddress`

**AC-2**

- Given: `confirmPayment(txnId)` is called
- When: the Firestore document is updated to `status: 'confirmed'`
- Then: `status` becomes `'confirmed'` and the review's `paymentStatus` is set to `'paid'`

**AC-3**

- Given: the payment update fails
- When: `confirmPayment` rejects
- Then: `status` becomes `'failed'`

## Files

- `src/agents/useX402Payment.ts`

## TypeScript

See `src/shared/types/Transaction.ts` for the document shape.

## Test Plan

- Unit: `initiatePayment` creates Firestore doc; `confirmPayment` updates status and review doc
- Manual: end-to-end flow from PaymentModal → Firestore confirmed → VaultReceipt rendered
