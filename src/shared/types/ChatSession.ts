export type ChatMode = 'qualifying' | 'analyzing' | 'teaser';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageKind = 'sales' | 'teaser' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  kind: ChatMessageKind;
  createdAt: number;
}

export interface ChatSession {
  messages: ChatMessage[];
  mode: ChatMode;
  activeReviewId: string | null;
  isLoading: boolean;
}
