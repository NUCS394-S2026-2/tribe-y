import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

export function BotTypingIndicator() {
  return (
    <AssistantMessageRow>
      <div className={styles.typing}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
      </div>
    </AssistantMessageRow>
  );
}
