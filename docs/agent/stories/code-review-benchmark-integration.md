# Story: Benchmark-Backed Confidence in Chat Reports

- **Slug:** `code-review-benchmark-integration`
- **Status:** Draft

## User Story

As a developer using compass.tne.ai,
I want each generated report to include a benchmark confidence score derived from Code Review Benchmark runs,
so that I can judge how much trust to place in the report output before paying or acting on recommendations.

## Acceptance Criteria

**AC-1 — Benchmark workspace bootstraps reproducibly.**
Given a contributor runs the benchmark bootstrap command,
When the command completes,
Then the benchmark repo is available under `resources/code-review-benchmark`,
And `offline/.env` exists if it was missing,
And the script prints next commands to continue the pipeline.

**AC-2 — Tribe review output can be converted into benchmark ingestion format.**
Given a JSON export of our generated reports,
When the converter runs,
Then it emits benchmark-compatible `benchmark_data.json` entries,
And each review is tagged with tool slug `tribe-y-code-review`,
And findings are mapped into `review_comments` consumable by benchmark step 2 extraction.

**AC-3 — A targeted benchmark run produces a confidence artifact for the app.**
Given valid `gh` authentication and MARTIAN credentials,
When the tribe benchmark pipeline runs for `tribe-y-code-review`,
Then step2/step2.5/step3 complete for that tool,
And an app-readable confidence artifact is written under `src/agents`.

**AC-4 — Chat reports always show benchmark confidence.**
Given the user receives a sample or full report in chat,
When the report card renders,
Then it includes the benchmark confidence score and source metadata,
And this confidence value is part of the report payload returned by the report agent.

## Interfaces

```ts
// scripts/benchmark/convert-tribe-reviews.mjs
export const TRIBE_TOOL_SLUG = 'tribe-y-code-review';
export function convertTribeReviewsToBenchmarkData(args: {
  records: unknown[];
  existingBenchmarkData?: Record<string, unknown>;
  toolSlug?: string;
}): Record<string, unknown>;

// src/agents/benchmarkConfidence.ts
export interface BenchmarkConfidence {
  score: number; // 0.0 - 1.0
  scorePercent: number; // 0 - 100
  source: string;
  sampleSize: number;
  updatedAt: string;
}
export function getBenchmarkConfidence(reportType: ReportType): BenchmarkConfidence;

// src/shared/types/ChatSession.ts
export interface SampleReportData {
  ...
  benchmarkConfidence: BenchmarkConfidence;
}
```

## Technical Approach

| Area                  | File                                            | Change                                                                  |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Bootstrap             | `scripts/benchmark/bootstrap.ps1`               | Clone/update benchmark repo and ensure local env scaffold.              |
| Conversion            | `scripts/benchmark/convert-tribe-reviews.mjs`   | Convert Tribe report exports into benchmark `reviews[]` entries.        |
| Targeted run          | `scripts/benchmark/run-tribe-benchmark.ps1`     | Merge Tribe data and run step2/step2.5/step3 for `tribe-y-code-review`. |
| Confidence export     | `scripts/benchmark/export-confidence.mjs`       | Aggregate evaluations into app confidence artifact.                     |
| App confidence source | `src/agents/benchmarkConfidence.generated.json` | Generated confidence data consumed by frontend agent code.              |
| Agent integration     | `src/agents/codeReviewAgent.ts`                 | Inject benchmark confidence into every `SampleReportData` payload.      |
| UI integration        | `src/chat/compass-chat/SampleReportMessage.tsx` | Render benchmark confidence line for sample/full reports.               |
| Types                 | `src/shared/types/ChatSession.ts`               | Add benchmark confidence contract to report payload.                    |

## Test Plan

- **Unit (Vitest):**
  - Converter mapping test with fixtures for review-comment structure and merge behavior.
  - Confidence provider test for fallback and generated data behavior.
- **Integration:**
  - Run targeted benchmark script for `tribe-y-code-review` and assert confidence artifact output exists.
  - Verify chat report card renders benchmark confidence metadata from payload.
- **Manual:**
  1. Run bootstrap and targeted benchmark scripts with authenticated `gh` and MARTIAN key.
  2. Generate a sample report in chat and verify confidence score appears on the report card.
  3. Generate a full report preview and verify confidence score still appears.

## Out of Scope

- Re-benchmarking all external tools in the dataset on every local run.
- Server-side storage of benchmark confidence history.
- Dynamic confidence recomputation in browser runtime.

## Done When

- [ ] Converter and benchmark scripts run end-to-end for `tribe-y-code-review`.
- [ ] Confidence artifact is generated and consumed by app code.
- [ ] Every sample/full chat report displays benchmark confidence.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
