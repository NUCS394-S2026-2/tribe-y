import type { ChatMessage } from './ChatSession';

/** Read-only snapshot passed into each agent call. Agents must not mutate session. */
export interface AgentContext {
  messages: ChatMessage[];
  uid: string | null;
}

export interface SalesAgentResult {
  text: string;
}

export interface CodeReviewAgentResult {
  reviewId: string;
  teaserReview: string;
}
