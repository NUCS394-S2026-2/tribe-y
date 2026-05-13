# Story: Vault Receipt

**Slug:** `vault-receipt`
**Team:** Yellow
**GitHub issue:** #5
**Status:** Ready

## User Story

As a user, I want to see a secure receipt after my payment so I have a record of the transaction and can access my full review.

## Acceptance Criteria

**AC-1**

- Given: I navigate to `/receipt/:txnId`
- When: the Firestore transaction document loads
- Then: I see the transaction ID, amount, network, confirmed-at timestamp, and review ID

**AC-2**

- Given: I click "Download PDF"
- When: the browser print dialog opens
- Then: the receipt is printable/saveable (window.print() stub for MVP)

**AC-3**

- Given: I click "View Full Review"
- When: the navigation occurs
- Then: I am taken to `/review?reviewId=<id>&unlocked=true`

## Files

- `src/chat/VaultReceipt.tsx`
- `src/chat/VaultReceipt.module.css`

## Test Plan

- Unit: renders loading state, renders receipt data from mock Firestore doc
- Manual: verify all fields display, PDF button triggers print, review button navigates correctly
