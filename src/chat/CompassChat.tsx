import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCodeReview } from '../agents/useCodeReview';
import { useSalesbot } from '../agents/useSalesbot';
import { CODE_SNIPPET_MAX_CHARS } from '../shared/codeSnippetLimits';
import { classifyInput } from '../shared/routing/inputClassifier';
import { CompassChatComposer } from './compass-chat/CompassChatComposer';
import { CompassChatMessageFeed } from './compass-chat/CompassChatMessageFeed';
import type { CompassChatDisplayMessage, CompassChatStage } from './compass-chat/stages';
import styles from './CompassChat.module.css';

export function CompassChat() {
  const navigate = useNavigate();
  const { messages: botMessages, sendMessage, isLoading: botLoading } = useSalesbot();
  const {
    reviewId,
    teaserReview,
    isLoading: reviewLoading,
    submitSnippet,
  } = useCodeReview();

  const [input, setInput] = useState('');
  const [stage, setStage] = useState<CompassChatStage>('chat');
  const [displayMessages, setDisplayMessages] = useState<CompassChatDisplayMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevBotLenRef = useRef(0);

  useEffect(() => {
    if (botMessages.length <= prevBotLenRef.current) return;
    const newMsgs = botMessages.slice(prevBotLenRef.current);
    prevBotLenRef.current = botMessages.length;

    const mapped: CompassChatDisplayMessage[] = newMsgs.map((m, i) => ({
      id: `bot-${botMessages.length - newMsgs.length + i}`,
      role: m.role === 'user' ? 'user' : 'assistant',
      text: m.content,
    }));
    setDisplayMessages((prev) => [...prev, ...mapped]);
  }, [botMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, stage, reviewLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || botLoading || stage === 'analyzing') return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const now = Date.now();
    setDisplayMessages((prev) => [...prev, { id: `user-${now}`, role: 'user', text }]);

    const kind = classifyInput(text);
    if (kind === 'cpp') {
      setStage('analyzing');
      await submitSnippet(text.slice(0, CODE_SNIPPET_MAX_CHARS));
      setStage('teaser');
      return;
    }

    await sendMessage(text);
  }, [input, botLoading, stage, sendMessage, submitSnippet]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePayForFullReview = () => {
    if (!reviewId) return;
    navigate(`/payment?reviewId=${encodeURIComponent(reviewId)}`);
  };

  const showWelcome = displayMessages.length === 0 && stage === 'chat';
  const composerBusy = botLoading || stage === 'analyzing';

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
          stage={stage}
          showWelcome={showWelcome}
          displayMessages={displayMessages}
          botLoading={botLoading}
          bottomRef={bottomRef}
          teaserReview={teaserReview}
          onPayForFullReview={handlePayForFullReview}
        />

        <CompassChatComposer
          disabled={composerBusy}
          botLoading={botLoading}
          input={input}
          textareaRef={textareaRef}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
