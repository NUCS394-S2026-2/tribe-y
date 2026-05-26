import type { ReportType } from '../../agents/reportTypes';

export type ChatMode = 'qualifying' | 'analyzing' | 'teaser' | 'selecting' | 'sample';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageKind =
  | 'sales'
  | 'teaser'
  | 'error'
  | 'report-type-selector'
  | 'sample-report';

export interface SampleReportFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  title: string;
  detail: string;
  recommendation?: string;
}

export interface SampleReportSlice {
  startLine: number;
  endLine: number;
  reason: string;
  code: string;
}

export interface SampleReportData {
  reportType: ReportType;
  reportTitle: string;
  slice: SampleReportSlice;
  summary: string;
  findings: SampleReportFinding[];
  conclusion: string;
  generatedAt: number;
}

export interface ReportTypeSelectorData {
  reviewId: string;
  selectedReportType: ReportType | null;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  kind: ChatMessageKind;
  createdAt: number;
  reportTypeSelector?: ReportTypeSelectorData;
  sampleReport?: SampleReportData;
}

export interface UploadedFile {
  name: string;
  content: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  mode: ChatMode;
  activeReviewId: string | null;
  isLoading: boolean;
  uploadedFile: UploadedFile | null;
  pendingCode: string | null;
  selectedReportType: ReportType | null;
}
