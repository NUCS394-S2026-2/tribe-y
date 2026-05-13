import React from 'react';

import styles from '../CompassChat.module.css';

interface AssistantMessageRowProps {
  children: React.ReactNode;
}

export function AssistantMessageRow({ children }: AssistantMessageRowProps) {
  return (
    <div className={`${styles.messageRow} ${styles.assistantRow}`}>
      <div className={styles.messageInner}>
        <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
        <div className={styles.messageBubble}>{children}</div>
      </div>
    </div>
  );
}
