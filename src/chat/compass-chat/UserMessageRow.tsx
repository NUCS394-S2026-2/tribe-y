import React from 'react';

import styles from '../CompassChat.module.css';
import type { CompassChatDisplayMessage } from './stages';

interface UserMessageRowProps {
  message: CompassChatDisplayMessage;
}

export function UserMessageRow({ message }: UserMessageRowProps) {
  const isCodeLike = message.text.includes('\n') && message.text.length > 80;

  return (
    <div className={styles.messageRow}>
      <div className={styles.messageInner}>
        <div className={`${styles.avatar} ${styles.avatarUser}`}>U</div>
        <div className={styles.messageBubble}>
          {isCodeLike ? (
            <>
              <div style={{ marginBottom: 8, color: '#8e8ea0', fontSize: '0.8rem' }}>
                Submitted C++ snippet ({message.text.split('\n').length} lines)
              </div>
              <pre className={styles.codeBlock}>{message.text}</pre>
            </>
          ) : (
            message.text
          )}
        </div>
      </div>
    </div>
  );
}
