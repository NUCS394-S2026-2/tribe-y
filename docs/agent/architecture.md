# Architecture Guide

Owned by **Architecture/Design Guild**. Read before touching more than one file or crossing a team boundary.

---

## System Context

compass.tne.ai is an AI-powered technical due diligence assistant for M&A managers evaluating software companies. The platform helps acquirers determine whether a target company's C++ codebase is maintainable and high-quality before committing to a deal.

The system is a **React SPA** with lightweight Firebase Cloud Functions for Gemini proxy, payment confirmation, and gated full reviews. All persistence goes through Firebase Auth + Firestore. Agent logic runs client-side. **X.402 crypto micropayments** (testnet) authorize full reviews; the Purchasing Agent and Code Review Agent communicate via Firestore state and HTTP 402 gating.

See [ADR 0003](decisions/0003-route-based-ux-crypto-payment.md) for the route-based UX decision.

---

## System Overview

The application is a single-page app running in the browser. State is persisted in Firestore; identity is managed by Firebase Auth; payments use X.402 testnet stubs (real wallet integration planned).

**Routes:**

| Route                | Surface        | Responsibility                                           |
| -------------------- | -------------- | -------------------------------------------------------- |
| `/`                  | Landing page   | Marketing; CTA → `/chat`                                 |
| `/chat`              | Chat UI        | Unified input, input classifier, teaser preview, pay CTA |
| `/payment?reviewId=` | Payment portal | Wallet connect, codebase upload, X.402 payment           |
| `/vault/:reviewId`   | Vault          | Owner-scoped full report + receipt                       |

**Input routing** lives in `src/shared/routing/` — a lightweight heuristic classifier (not an LLM agent) sends English input to the Sales Agent and C++ input to the Code Review Agent.

Three agents run client-side:

1. **Sales Agent** — handles English qualification and off-topic requests in chat.
2. **Code Review Agent** — analyzes C++ snippets (teaser) and full reviews after payment.
3. **Purchasing Agent** — runs X.402 payment flow and confirms payment server-side.

Firestore is the shared state layer between agents and the UI. Cloud Functions gate full reviews on `paymentStatus === 'paid'` (HTTP 402 when unpaid).

---

## User Flow

| Step            | What happens                                                  | Agent / surface          |
| --------------- | ------------------------------------------------------------- | ------------------------ |
| 1. Landing      | User arrives at `/`; CTA enters chat                          | —                        |
| 2. Chat input   | User pastes C++ or asks in English; classifier routes input   | `shared/routing`         |
| 3. English path | Sales Agent responds in chat transcript                       | Sales Agent              |
| 4. C++ path     | Code Review Agent returns teaser in chat                      | Code Review Agent        |
| 5. Upsell       | "Pay for Full Code Review" navigates to `/payment`            | Chat UI                  |
| 6. Payment      | User connects wallet, uploads codebase, pays via X.402        | Purchasing Agent         |
| 7. A2A handoff  | Payment confirmed in Firestore; full review gated by HTTP 402 | Purchasing → Code Review |
| 8. Vault        | Full report + receipt at `/vault/:reviewId` (owner-only)      | Vault UI                 |

---

## Core Agents

### Sales Agent

Handles non-C++ chat in `/chat`. Responsibilities:

- Conversational qualification and product questions
- Politely redirects non-C++ requests
- Does not own payment or full review delivery

### Code Review Agent

The analysis engine. Responsibilities:

- Analyzes C++ snippets submitted during preview (teaser)
- Performs full review after payment authorization
- Persists results to Firestore `codeReviews`

### Purchasing Agent

Owns the payment lifecycle on `/payment`. Responsibilities:

- Initiates X.402 testnet payment request
- Confirms payment via Cloud Function (`paymentStatus: 'paid'`)
- Triggers full review fetch after confirmation

---

## Team Ownership

| Team   | Owns                                                         | Responsibilities                                                                 |
| ------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Yellow | `src/chat/`, `src/payment/`, `src/vault/`, `src/components/` | Landing, chat, payment portal, vault UI                                          |
| Orange | `src/agents/`, `functions/`                                  | Code Review Agent, Purchasing Agent, x402/A2A logic                              |
| Shared | `src/shared/`                                                | Types, routing classifier, Firestore hooks — **both teams must approve changes** |

---

## Cross-Team Boundaries

**Yellow → Orange (trigger a snippet review)**
Chat invokes `useCodeReview` / `codeReviewApi` public exports. Yellow must not reach into Orange implementation details.

**Orange → Yellow (signal payment completion)**
Purchasing Agent writes `paymentStatus: 'paid'` via Cloud Function. Vault page listens to Firestore and gates on paid status.

**Orange ↔ Orange (A2A)**
Purchasing and Code Review agents coordinate via Firestore + HTTP 402. Internal Orange concern.

---

## ADRs

| #                                                       | Title                                   | Status   |
| ------------------------------------------------------- | --------------------------------------- | -------- |
| [0001](decisions/0001-use-this-harness-structure.md)    | Use this harness structure              | Accepted |
| [0003](decisions/0003-route-based-ux-crypto-payment.md) | Route-based UX and crypto-first payment | Accepted |
