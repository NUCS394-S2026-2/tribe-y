import React, { useCallback, useEffect, useRef, useState } from 'react';

import { CompassChatComposer } from './compass-chat/CompassChatComposer';
import { CompassChatMessageFeed } from './compass-chat/CompassChatMessageFeed';
import styles from './CompassChat.module.css';
import { useChatOrchestrator } from './orchestrator/useChatOrchestrator';

export function CompassChat() {
  const { session, sendMessage, goToPayment } = useChatOrchestrator();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, session.mode, session.isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || session.isLoading || session.mode === 'analyzing') return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
  }, [input, sendMessage, session.isLoading, session.mode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const composerBusy = session.isLoading || session.mode === 'analyzing';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>compass.tne.ai</div>
        <div className={styles.sidebarSub}>C++ Expert Review</div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarModel}>
            C++ Expert Agent
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        <CompassChatMessageFeed
          session={session}
          bottomRef={bottomRef}
          onPayForFullReview={goToPayment}
        />

        <CompassChatComposer
          disabled={composerBusy}
          botLoading={session.isLoading}
          input={input}
          textareaRef={textareaRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={() => void handleSend()}
        />
      </div>
    </div>
  );
}
