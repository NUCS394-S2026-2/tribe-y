export type CompassChatStage =
  | 'chat'
  | 'code-input'
  | 'analyzing'
  | 'teaser'
  | 'payment'
  | 'paying'
  | 'receipt'
  | 'full-review';

export interface CompassChatDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
