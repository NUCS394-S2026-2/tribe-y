export type CompassChatStage =
  | 'chat'
  | 'code-input'
  | 'report-type'
  | 'analyzing'
  | 'teaser'
  | 'payment'
  | 'paying'
  | 'payment-failed'
  | 'receipt'
  | 'full-review';

export interface CompassChatDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}
