import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useCodeReview } from '../agents/useCodeReview';
import { useSalesbot } from '../agents/useSalesbot';
import { useX402Payment } from '../agents/useX402Payment';
import { CODE_SNIPPET_MAX_CHARS } from '../shared/codeSnippetLimits';
import { CompassChatComposer } from './compass-chat/CompassChatComposer';
import { CompassChatMessageFeed } from './compass-chat/CompassChatMessageFeed';
import type { CompassChatDisplayMessage, CompassChatStage } from './compass-chat/stages';
import styles from './CompassChat.module.css';

export function CompassChat() {
  const {
    messages: botMessages,
    sendMessage,
    intentVerified,
    isLoading: botLoading,
  } = useSalesbot();
  const {
    reviewId,
    teaserReview,
    fullReview,
    isLoading: reviewLoading,
    submitSnippet,
    fetchFullReview,
  } = useCodeReview();
  const { initiatePayment, confirmPayment, paymentRequest } = useX402Payment();

  const [input, setInput] = useState('');
  const [stage, setStage] = useState<CompassChatStage>('chat');
  const [snippet, setSnippet] = useState('');
  const [displayMessages, setDisplayMessages] = useState<CompassChatDisplayMessage[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
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
    if (intentVerified && stage === 'chat') {
      setStage('code-input');
    }
  }, [intentVerified, stage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, stage, reviewLoading, isPaying]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || botLoading || stage !== 'chat') return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
  }, [input, botLoading, stage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAnalyze = async () => {
    if (!snippet.trim()) return;
    setStage('analyzing');
    setDisplayMessages((prev) => [
      ...prev,
      { id: `user-code-${Date.now()}`, role: 'user', text: snippet },
    ]);
    await submitSnippet(snippet.slice(0, CODE_SNIPPET_MAX_CHARS));
    setStage('teaser');
  };

  const handleUnlock = async () => {
    const id = reviewId ?? `local-${Date.now()}`;
    setStage('payment');
    await initiatePayment(id);
  };

  const handlePay = async () => {
    if (!paymentRequest) return;
    setIsPaying(true);
    setStage('paying');
    const id = await confirmPayment(paymentRequest.txnId);
    if (id) {
      try {
        await fetchFullReview();
        setTxnId(id);
        setConfirmedAt(new Date().toLocaleString());
        setStage('receipt');
      } catch (e) {
        console.error('Full review fetch failed:', e);
        setStage('payment-failed');
      }
    }
    setIsPaying(false);
  };

  const handleViewFull = () => {
    setStage('full-review');
  };

  const showWelcome = displayMessages.length === 0 && stage === 'chat';

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
          snippet={snippet}
          onSnippetChange={setSnippet}
          onAnalyze={handleAnalyze}
          onClearSnippet={() => setSnippet('')}
          teaserReview={teaserReview}
          fullReview={fullReview}
          onUnlockFullReview={handleUnlock}
          paymentRequest={paymentRequest}
          isPaying={isPaying}
          onPay={handlePay}
          txnId={txnId}
          paymentAmount={paymentRequest?.amount}
          confirmedAt={confirmedAt}
          onViewFullReview={handleViewFull}
        />

        <CompassChatComposer
          stage={stage}
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
