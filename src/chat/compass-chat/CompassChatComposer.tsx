import React, { RefObject } from 'react';

import styles from '../CompassChat.module.css';

interface CompassChatComposerProps {
  disabled: boolean;
  botLoading: boolean;
  input: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CompassChatComposer({
  disabled,
  botLoading,
  input,
  textareaRef,
  fileInputRef,
  onInputChange,
  onKeyDown,
  onSend,
  onFileChange,
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
              disabled
                ? 'Review in progress…'
                : 'Paste C++ code, upload a file, or ask a question…'
            }
            rows={1}
            disabled={chatLocked}
            aria-label="Message input"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".cpp,.h,.hpp,.cc,.cxx,.zip"
            className={styles.hiddenInput}
            onChange={onFileChange}
            aria-label="Upload file"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={chatLocked}
            aria-label="Upload file"
            title="Upload C++ code file or ZIP"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
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
