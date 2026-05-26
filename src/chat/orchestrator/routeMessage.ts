import { classifyInput } from '../../shared/routing/inputClassifier';
import type { ChatSession } from '../../shared/types/ChatSession';

export type MessageRoute = 'sales' | 'codeReview';

export function routeMessage(_session: ChatSession, text: string): MessageRoute {
  const kind = classifyInput(text);
  if (kind === 'cpp') return 'codeReview';
  return 'sales';
}
