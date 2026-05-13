import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

interface AnalyzingIndicatorProps {
  /** Visible status text next to the typing dots */
  message?: string;
}

export function AnalyzingIndicator({
  message = 'Running C++ Expert analysis…',
}: AnalyzingIndicatorProps) {
  return (
    <AssistantMessageRow>
      <div className={styles.typing}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
      </div>
      <span style={{ marginLeft: 8, color: '#8e8ea0', fontSize: '0.8rem' }}>
        {message}
      </span>
    </AssistantMessageRow>
  );
}
