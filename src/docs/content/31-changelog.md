# Changelog

Date-stamped entries for every release that shipped a piece of the A2A reviewer agent. Earlier dates may be approximate.

## 2026-05-29 — Integration documentation site

- Added a `/docs` route to the React app with a sidebar of pages by category.
- Pages cover: introduction, quickstart, agent card, JSON-RPC surface, report types, response shape, x402 overview, payment handshake, wallet setup, error codes, this changelog.
- Markdown rendered with `react-markdown` + `remark-gfm`; code blocks highlighted with `react-syntax-highlighter`.
- Added a **For Developers** link to the chat sidebar at `/chat`.

## 2026-05-29 — Consultant wallet + 402 handling

- Wired Solana wallet adapter into the React app (Phantom + Solflare).
- Chat UI now detects HTTP 402 on `reviewFull`, signs a SOL transfer, and resubmits with `X-Payment`.
- Receipt card with on-chain signature displayed after a successful paid call.
- Wallet connection button added to chat topbar.

## 2026-05-29 — Reviewer x402 gate + split methods

- Renamed `review` JSON-RPC method into `reviewSample` (free) and `reviewFull` (paid).
- Added `x402Middleware.ts` with `checkX402Payment` — verifies payment header against expected amount/recipient, claims signature for replay protection, returns either a receipt or a 402 quote.
- Agent card surfaces pricing metadata for `reviewFull`.
- Server returns HTTP 402 + quote body when the gate fails; otherwise dispatches normally.

## 2026-05-28 — Solana payment verification

- `verifyPayment.ts` fetches the transaction at `confirmed` commitment with a bounded retry, decodes the first `SystemProgram.transfer` instruction, and checks recipient, amount, and staleness.
- `claimPayment.ts` uses a Firestore transaction on `usedPayments/{signature}` to ensure each signature can only be redeemed once.
- Reviewer wallet address pinned in `wallet.ts`; price set to `1_000_000` lamports.

## 2026-05-28 — Review method + PDF artifact

- Implemented the `review` JSON-RPC method backed by Gemini 2.5 Pro.
- Brain produces `SampleReportData`: scores, findings, slice, conclusion.
- Best-effort PDF render + upload to Firebase Storage; signed URL attached as `artifacts.pdfUrl`.

## 2026-05-27 — A2A scaffold

- Added `agentCard.ts` serving `GET /.well-known/agent.json` with the A2A discovery document.
- Added `rpc.ts` with the JSON-RPC 2.0 dispatcher and standard error codes (`-32700`, `-32600`, `-32601`, `-32602`, `-32603`).
- Wired Firebase Hosting rewrites for `/.well-known/agent.json` and `/rpc` to the new functions.
- Method registry started with `listReportTypes` (free, no auth).

## 2026-05-26 — Report type catalog

- Canonicalized the 8 report types in `functions/src/reviewer/reportTypes.ts`: `security`, `memory`, `quality`, `standards`, `performance`, `exceptions`, `antipatterns`, `deadcode`.
- Each report type fixed to 5 canonical scoring dimensions.
- `ReportTypeDef` shape established as the wire contract for `listReportTypes`.
