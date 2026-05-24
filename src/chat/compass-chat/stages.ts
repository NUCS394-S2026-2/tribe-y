export type CompassChatStage = 'chat' | 'analyzing' | 'teaser';

export interface CompassChatDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
