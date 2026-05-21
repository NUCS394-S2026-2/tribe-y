import React from 'react';

import styles from '../CompassChat.module.css';
import { BotTypingIndicator } from './BotTypingIndicator';
import type { CompassChatDisplayMessage } from './stages';
import { UserMessageRow } from './UserMessageRow';

interface ChatTranscriptProps {
  showWelcome: boolean;
  messages: CompassChatDisplayMessage[];
  botLoading: boolean;
}

export function ChatTranscript({
  showWelcome,
  messages,
  botLoading,
}: ChatTranscriptProps) {
  return (
    <>
      {showWelcome && (
        <div className={styles.welcome}>
          <div className={styles.welcomeTitle}>compass.tne.ai</div>
          <div className={styles.welcomeSub}>
            Describe your C++ problem to get started
          </div>
        </div>
      )}

      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessageRow key={msg.id} message={msg} />
        ) : (
          <div key={msg.id} className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.messageInner}>
              <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
              <div className={styles.messageBubble}>{msg.text}</div>
            </div>
          </div>
        ),
      )}

      {botLoading && <BotTypingIndicator />}
    </>
  );
}
