import { RefObject } from 'react';

import type { ChatSession } from '../../shared/types/ChatSession';
import styles from '../CompassChat.module.css';
import { AnalyzingIndicator } from './AnalyzingIndicator';
import { ChatTranscript } from './ChatTranscript';

interface CompassChatMessageFeedProps {
  session: ChatSession;
  bottomRef: RefObject<HTMLDivElement | null>;
  onPayForFullReview: () => void;
}

export function CompassChatMessageFeed({
  session,
  bottomRef,
  onPayForFullReview,
}: CompassChatMessageFeedProps) {
  const showPayCta = session.activeReviewId !== null;
  const showGenericTyping = session.isLoading && session.mode !== 'analyzing';

  return (
    <div className={styles.messages} role="log" aria-live="polite">
      <ChatTranscript
        messages={session.messages}
        botLoading={showGenericTyping}
        showPayCta={showPayCta}
        onPayForFullReview={onPayForFullReview}
      />

      {session.mode === 'analyzing' && <AnalyzingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
