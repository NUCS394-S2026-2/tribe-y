# 0003 — Route-Based UX and Crypto-First Payment

**Status:** Accepted

**Date:** 2026-05-24

**Decider(s):** Architecture/Design guild

---

## Context

The original [architecture guide](../architecture.md) described a single chatbot surface where Stripe checkout, payment, and post-purchase status all happen inline. [Product-Vision.md](../../tribe/Product-Vision.md) and the client brief specify crypto micro-payments via the X.402 protocol and a separate vault for delivered reports.

The monolithic `CompassChat` stage machine mixed preview, payment, and vault UI in one component, making routes unclear and blocking independent testing of each user journey step.

## Decision

1. **Route-based UX:** Split the product into four routes:
   - `/` — marketing landing
   - `/chat` — unified input, preview teaser, pay CTA
   - `/payment?reviewId=` — wallet connect, codebase upload, X.402 payment
   - `/vault/:reviewId` — owner-scoped full report and receipt

2. **Crypto-first payment:** X.402 testnet micropayments are the primary payment path. Stripe is out of scope for the current sprint.

3. **Lightweight input routing:** A heuristic classifier in `src/shared/routing/` routes chat input to the Sales Agent (English) or Code Review Agent (C++). This is not a fourth LLM agent.

4. **Agent boundaries unchanged:** Sales, Code Review, and Purchasing remain React hooks under `src/agents/`. Firestore + HTTP 402 gate full reviews.

## Consequences

**Positive:**

- Each route has a single responsibility and can be tested in isolation.
- Payment and vault concerns decouple from chat preview logic.
- Aligns implementation with Product Vision and the team's architectural diagram.

**Negative:**

- Requires migrating existing in-chat payment stages and removing legacy components.
- Full codebase upload needs Firestore metadata fields until Firebase Storage is integrated.

**Supersedes:** Informal "everything in chatbot" and Stripe references in architecture.md (updated in the same refactor PR).
