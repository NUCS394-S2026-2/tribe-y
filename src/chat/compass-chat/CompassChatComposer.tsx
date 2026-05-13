import React, { RefObject } from 'react';

import styles from '../CompassChat.module.css';
import type { CompassChatStage } from './stages';

interface CompassChatComposerProps {
  stage: CompassChatStage;
  botLoading: boolean;
  input: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
}

export function CompassChatComposer({
  stage,
  botLoading,
  input,
  textareaRef,
  onInputChange,
  onKeyDown,
  onSend,
}: CompassChatComposerProps) {
  const chatLocked = stage !== 'chat' || botLoading;

  return (
    <div>
      <div className={styles.inputBar}>
        <div className={styles.inputWrap}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder={
              stage !== 'chat' ? 'Review in progress…' : 'Message compass.tne.ai'
            }
            rows={1}
            disabled={chatLocked}
            aria-label="Message input"
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={onSend}
            disabled={!input.trim() || botLoading || stage !== 'chat'}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.inputDisclaimer}>
        compass.tne.ai · C++ Expert reviews · Testnet payments only
      </div>
    </div>
  );
}
