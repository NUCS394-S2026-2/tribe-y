import type { ChatSession } from '../../shared/types/ChatSession';

export type MessageRoute = 'sales';

/**
 * Every user message now routes to the conversational consultant agent
 * (the only entry point). Code detection is handled separately via
 * `classifyInput` to populate `pendingCode` — it no longer affects routing.
 */
export function routeMessage(session: ChatSession, text: string): MessageRoute {
  void session;
  void text;
  return 'sales';
}
