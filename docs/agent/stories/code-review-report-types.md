# Story: Code Review Report Type Selection + Sample PDF

- **Slug:** `code-review-report-types`
- **Status:** Superseded by `code-review-agent-revamp-plan.md` (PRs 1–8).
  The chat flow now invokes a standalone A2A reviewer service over JSON-RPC
  and pays via x402 over Solana devnet through an in-chat wallet. The
  `/payment` and `/vault/:reviewId` routes referenced below were removed in
  PR 8 along with the `goToPayment` orchestrator hook; the "Pay for full
  report" button now triggers an in-chat wallet-signed payment instead of
  navigating to a separate route.

## User Story

As a developer using compass.tne.ai,
I want to choose which kind of C++ review I get a sample of (security, memory, performance, etc.) and preview/download that sample as a PDF before I pay,
so that I can confirm the agent's quality on my own code — and pick the report most relevant to my problem — before I commit money for the full report.

## Acceptance Criteria

**AC-1 — Report-type cards appear after code intent.**
Given I paste C++ code or upload a `.cpp` / `.zip` in chat,
When the input classifier routes the message to `codeReview`,
Then the assistant posts a `report-type-selector` message with 8 cards (Security Vulnerability, Memory Safety, Code Quality Scorecard, Standards Compliance, Performance Hotspot, Exception Safety, Anti-Pattern Detection, Dead Code & Redundancy),
And a stable `reviewId` is created in Firestore before the cards appear.

**AC-2 — Selecting a card generates a sample report on a representative slice.**
Given the selector is visible,
When I click a card,
Then the orchestrator calls `runSampleReport({ reviewId, snippet, reportType })`,
And the agent first picks a 10–40 line slice via Gemini (falling back to the first 50 lines on parse failure),
And then returns a structured `SampleReportData` (`summary`, `findings[]`, `conclusion`) cached at `codeReviews/{reviewId}.sampleReports.{reportType}`.

**AC-3 — Sample renders in chat with preview, download, and pay actions.**
Given the sample report has returned,
Then a `sample-report` message renders with summary, findings list (with severity + line refs), and conclusion,
And the message exposes three buttons: **Preview PDF** (in-chat iframe), **Download PDF** (jsPDF save), **Pay for full report** (navigate to `/payment?reviewId=…&reportType=…`).

**AC-4 — User can switch report types before paying.**
Given a sample is showing,
When I click a different card,
Then the previous sample message is removed and a new one is generated with the newly selected type,
And the existing `activeReviewId` is reused (no new Firestore doc).

**AC-5 — Payment page displays the chosen report type.**
Given I click "Pay for full report",
When `/payment?reviewId=…&reportType=…` loads,
Then the payment page renders the human-readable report title in the header so I know what I'm paying for.

## Interfaces

```ts
// src/agents/reportTypes.ts
export type ReportType =
  | 'security'
  | 'memory'
  | 'quality'
  | 'standards'
  | 'performance'
  | 'exceptions'
  | 'antipatterns'
  | 'deadcode';

export interface ReportTypeDef {
  id: ReportType;
  title: string;
  blurb: string;
  focus: string; // injected into the per-type Gemini system prompt
}
export const REPORT_TYPES: readonly ReportTypeDef[];

// src/shared/types/ChatSession.ts
export type ChatMessageKind =
  | 'sales'
  | 'teaser'
  | 'error'
  | 'report-type-selector'
  | 'sample-report';

export interface SampleReportData {
  reportType: ReportType;
  reportTitle: string;
  slice: { startLine: number; endLine: number; reason: string; code: string };
  summary: string;
  findings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    line?: number;
    title: string;
    detail: string;
    recommendation?: string;
  }>;
  conclusion: string;
  generatedAt: number;
}

// src/agents/codeReviewAgent.ts
export function createPendingReview(snippet: string): Promise<string>;
export function runSampleReport(args: {
  reviewId: string;
  snippet: string;
  reportType: ReportType;
}): Promise<SampleReportData>;

// src/shared/reportPdf.ts
export function renderReportToPdf(data: SampleReportData): jsPDF;
export function downloadReportPdf(data: SampleReportData): void;
export function reportPdfBlobUrl(data: SampleReportData): string;
```

## Technical Approach

| Area                | File                                                                 | Change                                                                                                                    |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Report type catalog | `src/agents/reportTypes.ts`                                          | New — `REPORT_TYPES` + per-type focus text.                                                                               |
| Session shape       | `src/shared/types/ChatSession.ts`                                    | Add `report-type-selector` / `sample-report` kinds, `pendingCode`, `selectedReportType`, payload fields on `ChatMessage`. |
| Agent               | `src/agents/codeReviewAgent.ts`                                      | Add `createPendingReview`, `runSampleReport` (slice picker + structured JSON report + Firestore cache).                   |
| PDF                 | `src/shared/reportPdf.ts`                                            | New — jsPDF renderer producing letter-size PDF; exposes download + blob-url helpers.                                      |
| Chat UI             | `src/chat/compass-chat/ReportTypeSelectorMessage.tsx` (+ CSS module) | New — card grid using `var(--surface)` / `var(--accent)`.                                                                 |
| Chat UI             | `src/chat/compass-chat/SampleReportMessage.tsx` (+ CSS module)       | New — renders findings, in-chat PDF iframe preview, download/pay buttons.                                                 |
| Transcript dispatch | `src/chat/compass-chat/ChatTranscript.tsx`                           | Render new kinds; thread selector callbacks.                                                                              |
| Feed                | `src/chat/compass-chat/CompassChatMessageFeed.tsx`                   | New `onSelectReportType` + `selectedReportType` props.                                                                    |
| Orchestrator        | `src/chat/orchestrator/useChatOrchestrator.ts`                       | Replace auto-teaser with selector flow; expose `selectReportType`; thread `reportType` into `goToPayment`.                |
| Payment page        | `src/payment/PaymentPage.tsx`                                        | Read `reportType` from `useSearchParams`; show its title.                                                                 |
| Deps                | `package.json`                                                       | Add `jspdf`.                                                                                                              |

## Test Plan

- **Unit (Vitest):**
  - `reportTypes.ts` — `isReportType` + `getReportTypeDef` happy/error paths.
  - `CompassChatMessageFeed.test.tsx` — extend with: selector renders 8 cards; clicking a card calls `onSelectReportType`; `sample-report` message renders findings + buttons.
- **Integration (Vitest + jsdom):**
  - Mock `createGeminiMessage` to return canned slice + report JSON; verify `runSampleReport` returns the expected `SampleReportData`.
  - Mock Firestore `updateDoc`; verify the cache write hits `sampleReports.{reportType}`.
- **Manual:**
  1. `npm run dev`, paste a ~150-line `.cpp` snippet → selector cards appear with all 8 options.
  2. Click **Security Vulnerability Report** → loading indicator → sample renders with findings.
  3. Click **Preview PDF** → iframe shows rendered PDF; click again to hide.
  4. Click **Download PDF** → file saves and opens cleanly.
  5. Click **Performance Hotspot Report** → previous sample disappears, new one appears.
  6. Click **Pay for full report** → `/payment?reviewId=…&reportType=performance` loads and shows "You're paying for: Performance Hotspot Report".
  7. Upload a `.cpp` file from disk → same selector flow runs (no auto-navigate to payment).

## Out of Scope

- Server-side PDF generation (sample PDFs are rendered client-side; full report PDF is a follow-up).
- Real X.402 / blockchain payment changes.
- Generating sample reports across multiple slices.

## Done When

- [ ] `npm run lint && npm test && npm run build` all pass.
- [ ] Manual flow above verified in a browser.
- [ ] Story spec linked in `docs/agent/stories/README.md` index.
- [ ] PR opened against `main` with screenshots of cards, sample, and PDF preview.
