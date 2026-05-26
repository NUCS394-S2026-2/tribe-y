# X.402 / Solana payment flow — implementation plan

**Branch context:** `feature/x402_solana_paymentflow`

**Baseline (current):** Route-based UX is in place: chat → `/payment?reviewId=` → vault. `confirmPayment` (Cloud Function) marks reviews paid; `/api/code-review/full` returns **HTTP 402** until `paymentStatus === 'paid'`. Client-side `useX402Payment` and `confirmPayment` still use **stub** payment details—no Solana RPC verification yet.

**Goal:** Solana **Devnet** settlement as **proof of payment**, server-verified before writing entitlement, with a **mock/demo** path so development and CI do not require real transfers.

---

## Phase 1 — Contract & documentation

- Add an **ADR** (or extend `architecture.md`): what **X.402** means _in this product_ (premium resources withheld until verified settlement + **402** gate), **Devnet** as default demo network, **merchant recipient** pubkey, amount policy (**fixed lamports** vs quoted per review), and **binding** (`reviewId` and/or opaque `purchaseId` in memo or equivalent).
- Define **Firestore entitlement + proof** fields (extend `CodeReview` / shared types and Cloud Function writes): keep `paymentStatus` as the coarse gate; add structured proof (e.g. signature, slot, amount, recipient, memo/binding id) as needed for Vault/receipt parity.
- Align copy and receipt shape with **Vault** stakeholders so one persistence model powers vault handoff.

**Exit criteria:** Written contract and type sketch the team agrees to implement against.

---

## Phase 2 — Verifier abstraction & single write path (backend)

- Introduce a **`PaymentVerifier`** interface with at least two implementations: **mock** and **Solana**.
- Route **all** transitions to `paymentStatus: 'paid'` through **`confirmPayment`** → verifier success only (no other writers of `paid`).
- Preserve existing **Firebase Auth** and **`uid` owns `codeReviews` doc** checks unless Phase 1 explicitly changes the identity model.

**Exit criteria:** Swappable verifier; stub behavior can live behind `MockVerifier` with the same HTTP contract as today.

---

## Phase 3 — Demo / CI path (no chain)

- Configure **`PAYMENT_VERIFIER=mock`** (or equivalent) for local and automated runs: accept **documented test-only** signatures, gated by environment (never default in production).
- Add tests that: reject bad confirm payloads; accept mock proof; assert Firestore update; assert **`/api/code-review/full`** returns **200** vs **402** consistently (Vite proxy + deployed function behavior documented if they diverge during dev).
- Keep **402 semantics** centralized in the full-review handler (`fullCodeReview` / shared `handlers` logic).

**Exit criteria:** Full purchase → unlock journey testable **without wallet or RPC**.

---

## Phase 4 — Client: initiate, wallet pay, confirm

- Replace stub **`useX402Payment`** (or extend behind a feature flag): **initiate** surfaces real **recipient, lamports, memo/purchase id** from server config or a small **`initiatePayment`** (or reuse `confirm`-precursor) callable.
- Integrate **Solana wallet adapter** targeting **Devnet**: build transfer (+ memo strategy per ADR); user signs; obtain **real transaction signature**.
- **Confirm** request body: `{ reviewId, signature, ... }` per API contract—not a synthetic `txn-${Date.now()}` string.

**Exit criteria:** Manual Devnet demo: connect wallet, pay, confirm, vault and full review unlock.

---

## Phase 5 — SolanaVerifier (server)

- Implement verification via **Solana RPC** (`getTransaction` or agreed API): enforce transaction **success**, **correct recipient**, **minimum lamports**, **binding** matches stored expectation for that `reviewId`/`purchaseId`, and reasonable **freshness** if specified.
- Configure **RPC URL** and merchant **public** address via environment / Firebase params; no private keys on the client for “merchant” beyond what’s already public.
- **Idempotency:** repeated confirm with the same signature must be safe; document race behavior.
- Return **safe, user-visible** errors (no paid content in error bodies).

**Exit criteria:** `paid` is only set after **on-chain** proof passes; mock verifier remains for Phase 3.

---

## Phase 6 — Hardening & rollout

- Logging / metrics: verify attempts, failure categories (wrong recipient, underpaid, bad memo, RPC errors).
- Light **rate limiting** or abuse controls on `confirmPayment` if needed.
- Update UI copy (Testnet vs **Devnet SOL**, troubleshooting, faucet links for demos).
- Before merge: **`npm run lint`**, **`npm test`**, **`npm run build`** all pass (per `AGENTS.md`).

**Exit criteria:** Demo = mock; real = Devnet; documentation and team ownership (UI vs `functions` / `src/agents`) stay clear.

---

## Team ownership reminder

See `docs/agent/architecture.md`: **Yellow** tends to own `src/payment/`, `src/vault/`, chat shell; **Orange** tends to own `src/agents/`, `functions/`, and purchasing verification. Coordinate entitlement field names with Vault and Code Review consumers before Phase 5 lands.
