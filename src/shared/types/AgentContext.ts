import type { ReportType } from '../../agents/reportTypes';
import type { ChatMessage } from './ChatSession';

/** Read-only snapshot passed into each agent call. Agents must not mutate session. */
export interface AgentContext {
  messages: ChatMessage[];
  uid: string | null;
}

export interface InitiateReviewAction {
  type: 'initiate_review';
  reportType: ReportType;
  fullReport?: boolean;
}

export type SalesAgentAction = InitiateReviewAction;

export interface SalesAgentResult {
  text: string;
  action?: SalesAgentAction;
}

export interface CodeReviewAgentResult {
  reviewId: string;
  teaserReview: string;
}
