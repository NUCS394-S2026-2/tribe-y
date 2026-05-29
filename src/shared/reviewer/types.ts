// Re-exports of the canonical reviewer types. This module exists so consumers
// of `src/shared/reviewer/*` can pull types from one place without forking
// the definitions. The source of truth remains in their original locations.

export type { ReportType, ReportTypeDef } from '../../agents/reportTypes';
export type {
  SampleReportData,
  SampleReportFinding,
  SampleReportScoreDimension,
  SampleReportScores,
  SampleReportSlice,
} from '../types/ChatSession';

export interface GeminiCallRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type GeminiCall = (req: GeminiCallRequest) => Promise<string>;
