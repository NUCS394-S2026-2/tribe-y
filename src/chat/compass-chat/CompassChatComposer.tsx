import React, { RefObject } from 'react';

import styles from '../CompassChat.module.css';

interface CompassChatComposerProps {
  disabled: boolean;
  botLoading: boolean;
  input: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
}

export function CompassChatComposer({
  disabled,
  botLoading,
  input,
  textareaRef,
  onInputChange,
  onKeyDown,
  onSend,
}: CompassChatComposerProps) {
  const chatLocked = disabled || botLoading;

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
              disabled ? 'Review in progress…' : 'Paste C++ code or ask a question…'
            }
            rows={1}
            disabled={chatLocked}
            aria-label="Message input"
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={onSend}
            disabled={!input.trim() || chatLocked}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
