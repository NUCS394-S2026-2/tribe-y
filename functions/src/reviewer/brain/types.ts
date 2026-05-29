// Type definitions for the reviewer brain on the server side.
//
// These are duplicated from the React tree (src/shared/types/ChatSession.ts
// and src/shared/reviewer/types.ts). The duplication is intentional for now:
// functions and the React app live under different tsconfig roots and cannot
// import across the boundary. A future PR may unify both via a shared package
// — see `code-review-agent-revamp-plan.md`.

export type { ReportType, ReportTypeDef } from '../reportTypes.js';

export interface SampleReportFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  title: string;
  detail: string;
  impact?: string;
  evidence?: string;
  recommendation?: string;
  codeFix?: string;
  references?: string[];
}

export interface SampleReportSlice {
  startLine: number;
  endLine: number;
  reason: string;
  code: string;
}

export interface SampleReportScoreDimension {
  label: string;
  score: number;
  note?: string;
}

export interface SampleReportScores {
  overall: number;
  dimensions: SampleReportScoreDimension[];
}

export interface SampleReportData {
  reportType: import('../reportTypes.js').ReportType;
  reportTitle: string;
  slice: SampleReportSlice;
  summary: string;
  findings: SampleReportFinding[];
  conclusion: string;
  scores: SampleReportScores;
  generatedAt: number;
  isFullReport?: boolean;
}

export interface GeminiCallRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type GeminiCall = (req: GeminiCallRequest) => Promise<string>;
