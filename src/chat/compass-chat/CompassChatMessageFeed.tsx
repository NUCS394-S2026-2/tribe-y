import { RefObject } from 'react';

import styles from '../CompassChat.module.css';
import { AnalyzingIndicator } from './AnalyzingIndicator';
import { ChatTranscript } from './ChatTranscript';
import { ExpertReviewCard } from './ExpertReviewCard';
import type { CompassChatDisplayMessage, CompassChatStage } from './stages';

interface CompassChatMessageFeedProps {
  stage: CompassChatStage;
  showWelcome: boolean;
  displayMessages: CompassChatDisplayMessage[];
  botLoading: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
  teaserReview: string | null;
  onPayForFullReview: () => void;
}

export function CompassChatMessageFeed({
  stage,
  showWelcome,
  displayMessages,
  botLoading,
  bottomRef,
  teaserReview,
  onPayForFullReview,
}: CompassChatMessageFeedProps) {
  return (
    <div className={styles.messages} role="log" aria-live="polite">
      <ChatTranscript
        showWelcome={showWelcome}
        messages={displayMessages}
        botLoading={botLoading}
      />

      {stage === 'analyzing' && <AnalyzingIndicator />}

      {stage === 'teaser' && teaserReview && (
        <ExpertReviewCard
          teaserReview={teaserReview}
          onPayForFullReview={onPayForFullReview}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
