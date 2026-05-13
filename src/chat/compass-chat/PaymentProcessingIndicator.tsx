import React from 'react';

import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

interface PaymentProcessingIndicatorProps {
  message?: string;
}

export function PaymentProcessingIndicator({
  message = 'Confirming transaction…',
}: PaymentProcessingIndicatorProps) {
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
