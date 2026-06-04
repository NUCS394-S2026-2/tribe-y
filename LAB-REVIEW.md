# Architecture & Code Quality Review

**Team:** Jack Press, Damini Iyer, Abby Miggiani, Gabriel Hsieh, Yimin Huang, Jefferson Wu, Stanley Hir, Andy Wu, Souvenir Turinumugisha, Fay Ma
**Date:** 6/1/25
**Commit reviewed:** ![Commit](https://github.com/NUCS394-S2026-2/tribe-y)

## Architecture diagram

![Architecture](.repo-deps.svg)

### Surprises & observations

- The entire `functions/src/reviewer/` backend (A2A reviewer agent, x402 payment verification, server-side PDF generation) is invisible to the frontend `madge` graph because `madge` only scanned `./src`. It is a large, separate subsystem that nobody is forced to look at when reasoning about the React app — which is exactly how it became a bus-factor-1 blind spot.
- Two full pages — `RiskMetricsPage` and `X402PaymentFlowPage` — share near-identical CSS (63 identical lines at the top). They were clearly built by copy-paste rather than from a shared layout/style base.
- A shared card style (`src/shared/styles/actionCards.module.css`) exists, but several components copy chunks of it into their own `.module.css` instead of importing it.

### Diagram vs. reality (top 3 mismatches from madge)

1. The `functions/src/reviewer/` subsystem almost certainly does not appear on the hand-drawn diagram, because it lives outside `./src` and never shows up in the frontend dependency graph. (Forgot it existed, or underestimated it.)
2. `useChatOrchestrator.ts` (395 lines) is the real center of gravity of the chat flow — confirm the drawn diagram gives it the weight the code does.
3. <add the third after comparing — look for any UI component importing directly from a service/data layer.>

### Bus factor overlay

Annotated diagram: `docs/architecture-bus-factor.png`

- Pink files (concentrated ownership): many — but most are **`Edits: 1`**, i.e. just-created files from the 5/28–5/30 reviewer/docs push. These are "new," not "fragile," and we are ignoring them.
- Pink files that are **also hotspots** (large AND ≥3 edits, one author): `functions/src/reviewer/pdf/render.ts` (615 lines), `functions/src/reviewer/rpc.ts` (261 lines, 4 edits), `functions/src/reviewer/verifyPayment.ts` (266 lines).
- Pink files that are **also architectural centers**: `functions/src/reviewer/rpc.ts` — the JSON-RPC entry point that every reviewer method routes through; `src/agents/reviewerClient.ts` (244 lines) — the only frontend bridge into that backend.

**Biggest single-person dependency:** The entire `functions/src/reviewer/` subsystem — including the largest file in the repo (`pdf/render.ts`, 615 lines) and the JSON-RPC entry point (`rpc.ts`, 261 lines) — is ~100% written by a single author. If that person is unavailable for a week, no one else can change payment verification (`verifyPayment.ts`) or server-side PDF generation — which is the product's core paid feature.

## Top 5 findings

| # | Finding | File(s) | Severity | Bus factor | Why it matters |
|---|---------|---------|----------|------------|----------------|
| 1 | Entire reviewer backend written by one person; large + central + paid-feature-critical | `functions/src/reviewer/*` (`pdf/render.ts` 615L, `rpc.ts` 261L, `verifyPayment.ts` 266L) | High | 1 (~100% one author) | Core paid feature (review + payment + PDF). If author is out, no one can fix or extend it. |
| 2 | Two pages duplicate ~63+ lines of CSS wholesale | `RiskMetricsPage.module.css` ↔ `X402PaymentFlowPage.module.css` | Medium | — | CSS is 11.2% duplicated overall. Any shared style change must be made in two places; they will drift. |
| 3 | Shared card styles copy-pasted instead of imported | `actionCards.module.css` copied into `CompassChat.module.css` (6 blocks, largest 44L), `SampleReportMessage`, `PdfPreviewModal` | Medium | — | A shared stylesheet already exists; copies defeat its purpose and guarantee visual drift. |
| 4 | God component: chat orchestrator is large and central | `src/chat/orchestrator/useChatOrchestrator.ts` (395L) | Medium | low (multi-author) | Second-largest frontend file and the hub of chat logic; high blast radius for any change. |
| 5 | Dead / unwired code | `shared/hooks/useUser.ts` (`useUser` exported, unused), plus unused types in `stages.ts`, `sessionStore.ts`, `CodeReview.ts`, `VaultReceipt.ts` | Low | — | An unused hook and orphan types suggest a half-wired feature or forgotten experiment; confusing to maintainers. |

## Tool output summary

- **jscpd:** 23 clones total, 4.9% of lines duplicated. Logic code is fine (TS 1.4%, TSX 1.0%); duplication is concentrated in **CSS at 11.2%**. Largest single clone: 63 identical lines between `RiskMetricsPage.module.css` and `X402PaymentFlowPage.module.css`.
- **madge:** 83 files scanned, 23 warnings, **no circular dependencies reported**. Highest fan-out (entry points): `App.tsx` (8), `useChatOrchestrator.ts` (8). Note: `functions/` was not scanned, so the reviewer backend is absent from the graph.
- **Largest files:** `functions/src/reviewer/pdf/render.ts` (615), `src/components/sample-audit/SampleAuditPage.tsx` (487), `src/chat/orchestrator/useChatOrchestrator.ts` (395).
- **Unused exports (ts-prune):** ~6 genuinely unused after filtering `(used in module)` false positives — notably `useUser` hook, and orphan types in `stages.ts`, `sessionStore.ts`, `CodeReview.ts`, `VaultReceipt.ts`.

## What we'd fix first, and why
Finding #1 first: the reviewer backend is simultaneously the most concentrated (one author), the largest (615-line file), and the most business-critical (it *is* the paid product). The cheapest immediate mitigation is not a rewrite but knowledge transfer — a walkthrough + a short `functions/src/reviewer/README.md` (one already exists; expand it) so a second person can at least navigate it. The CSS duplication (#2, #3) is a fast, low-risk win: extract one shared stylesheet/layout and import it.


## Lessons for the next project

1. **(structure)** Next time, we will keep one shared stylesheet/layout primitive from day one and *import* it — never copy CSS between pages — so a style change happens in exactly one place.
2. **(structure)** Next time, we will not let any single subsystem (like the reviewer backend) be touched by only one person — we will require at least one commit or review from a second teammate before a subsystem grows past a few files.
3. **(process)** Next time, we will run `ts-prune` and `jscpd` in CI from the first week, so dead exports and duplicated blocks get flagged on the PR that introduces them instead of being discovered at the end.

