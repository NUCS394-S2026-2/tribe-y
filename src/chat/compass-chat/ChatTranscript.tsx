import React from 'react';

import type { ChatMessage } from '../../shared/types/ChatSession';
import styles from '../CompassChat.module.css';
import { BotTypingIndicator } from './BotTypingIndicator';
import { ExpertReviewCard } from './ExpertReviewCard';
import { UserMessageRow } from './UserMessageRow';

interface ChatTranscriptProps {
  messages: ChatMessage[];
  botLoading: boolean;
  showPayCta: boolean;
  onPayForFullReview: () => void;
}

export function ChatTranscript({
  messages,
  botLoading,
  showPayCta,
  onPayForFullReview,
}: ChatTranscriptProps) {
  return (
    <>
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return <UserMessageRow key={msg.id} message={msg} />;
        }

        if (msg.kind === 'teaser') {
          return (
            <ExpertReviewCard
              key={msg.id}
              teaserReview={msg.text}
              showPayButton={showPayCta}
              onPayForFullReview={onPayForFullReview}
            />
          );
        }

        return (
          <div key={msg.id} className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.messageInner}>
              <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
              <div className={styles.messageBubble}>{msg.text}</div>
            </div>
          </div>
        );
      })}

      {botLoading && <BotTypingIndicator />}
    </>
  );
}
