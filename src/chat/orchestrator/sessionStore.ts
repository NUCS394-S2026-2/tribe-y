import type { ChatSession } from '../../shared/types/ChatSession';

/** Optional persistence seam for future Firestore-backed chat sessions. */
export interface SessionStore {
  load(): Promise<ChatSession | null>;
  save(session: ChatSession): Promise<void>;
}
