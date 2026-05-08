import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCodeReview } from '../agents/useCodeReview';
import { useSalesbot } from '../agents/useSalesbot';
import { useX402Payment } from '../agents/useX402Payment';
import styles from './CompassChat.module.css';

type Stage =
  | 'chat'
  | 'code-input'
  | 'analyzing'
  | 'teaser'
  | 'payment'
  | 'paying'
  | 'receipt'
  | 'full-review';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  stage?: Stage;
}

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
  } = useCodeReview();
  const { initiatePayment, confirmPayment, paymentRequest } = useX402Payment();

  const [input, setInput] = useState('');
  const [stage, setStage] = useState<Stage>('chat');
  const [snippet, setSnippet] = useState('');
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevBotLenRef = useRef(0);

  // Sync salesbot messages into display messages
  useEffect(() => {
    if (botMessages.length <= prevBotLenRef.current) return;
    const newMsgs = botMessages.slice(prevBotLenRef.current);
    prevBotLenRef.current = botMessages.length;

    const mapped: DisplayMessage[] = newMsgs.map((m, i) => ({
      id: `bot-${botMessages.length - newMsgs.length + i}`,
      role: m.role === 'user' ? 'user' : 'assistant',
      text: m.content,
    }));
    setDisplayMessages((prev) => [...prev, ...mapped]);
  }, [botMessages]);

  // When intent is verified, push code-input card
  useEffect(() => {
    if (intentVerified && stage === 'chat') {
      setStage('code-input');
    }
  }, [intentVerified, stage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, stage, reviewLoading, isPaying]);

  // Auto-resize textarea
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
    await submitSnippet(snippet);
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
      setTxnId(id);
      setConfirmedAt(new Date().toLocaleString());
      setStage('receipt');
    }
    setIsPaying(false);
  };

  const handleViewFull = () => {
    setStage('full-review');
  };

  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate('/');
  };

  const showWelcome = displayMessages.length === 0 && stage === 'chat';

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>compass.tne.ai</div>
        <div className={styles.sidebarSub}>C++ Expert Review</div>
        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <span>＋</span> New review
        </button>
        <div className={styles.sidebarSection}>Recent</div>
        <div className={styles.sidebarItem}>Inventory memory leaks</div>
        <div className={styles.sidebarItem}>Smart pointer refactor</div>
        <div className={styles.sidebarItem}>Template metaprogramming</div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <span className={styles.topbarModel}>
            C++ Expert Agent
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Messages */}
        <div className={styles.messages} role="log" aria-live="polite">
          {showWelcome && (
            <div className={styles.welcome}>
              <div className={styles.welcomeTitle}>compass.tne.ai</div>
              <div className={styles.welcomeSub}>
                Describe your C++ problem to get started
              </div>
            </div>
          )}

          {displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${msg.role === 'assistant' ? styles.assistantRow : ''}`}
            >
              <div className={styles.messageInner}>
                <div
                  className={`${styles.avatar} ${msg.role === 'user' ? styles.avatarUser : styles.avatarBot}`}
                >
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={styles.messageBubble}>
                  {/* If user message looks like code, render as code block */}
                  {msg.role === 'user' &&
                  msg.text.includes('\n') &&
                  msg.text.length > 80 ? (
                    <>
                      <div
                        style={{ marginBottom: 8, color: '#8e8ea0', fontSize: '0.8rem' }}
                      >
                        Submitted C++ snippet ({msg.text.split('\n').length} lines)
                      </div>
                      <pre className={styles.codeBlock}>{msg.text}</pre>
                    </>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator while salesbot is loading */}
          {botLoading && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.typing}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Code input card (appears as assistant message) */}
          {stage === 'code-input' && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.codeInputCard}>
                    <div className={styles.codeInputLabel}>Paste your C++ code</div>
                    <textarea
                      className={styles.codeInputArea}
                      value={snippet}
                      onChange={(e) => setSnippet(e.target.value)}
                      placeholder={
                        '// Paste your C++ code here...\nint main() {\n  int* p = new int(42);\n  return 0;\n}'
                      }
                      aria-label="C++ code snippet"
                      spellCheck={false}
                    />
                    <div className={styles.codeInputActions}>
                      <button
                        className={styles.btnPrimary}
                        onClick={handleAnalyze}
                        disabled={!snippet.trim()}
                      >
                        Analyze Code
                      </button>
                      <button className={styles.btnGhost} onClick={() => setSnippet('')}>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analyzing indicator */}
          {stage === 'analyzing' && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.typing}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                  <span style={{ marginLeft: 8, color: '#8e8ea0', fontSize: '0.8rem' }}>
                    Running C++ Expert analysis…
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Teaser review */}
          {(stage === 'teaser' ||
            stage === 'payment' ||
            stage === 'paying' ||
            stage === 'receipt' ||
            stage === 'full-review') &&
            teaserReview && (
              <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                <div className={styles.messageInner}>
                  <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                  <div className={styles.messageBubble}>
                    <div className={styles.reviewCard}>
                      <div className={styles.reviewCardTitle}>
                        {stage === 'full-review'
                          ? '✓ Full Expert Review'
                          : '⚠ Teaser Review — Issues Found'}
                      </div>
                      <pre className={styles.reviewCardBody}>
                        {stage === 'full-review' ? fullReview : teaserReview}
                      </pre>
                      {stage === 'teaser' && (
                        <div className={styles.reviewCardActions}>
                          <button className={styles.btnGold} onClick={handleUnlock}>
                            🔒 Unlock Full Review
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Payment card */}
          {(stage === 'payment' || stage === 'paying') && paymentRequest && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.paymentCard}>
                    <div className={styles.paymentCardTitle}>X.402 Micro-Payment</div>
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentLabel}>Amount</span>
                      <span className={styles.paymentValue}>{paymentRequest.amount}</span>
                    </div>
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentLabel}>Network</span>
                      <span className={styles.paymentValue}>Testnet</span>
                    </div>
                    <div className={styles.paymentRow}>
                      <span className={styles.paymentLabel}>Wallet</span>
                      <span className={styles.paymentValue}>
                        {paymentRequest.walletAddress}
                      </span>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <button
                        className={styles.btnGold}
                        onClick={handlePay}
                        disabled={isPaying}
                      >
                        {isPaying ? 'Processing…' : 'Pay with Testnet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment processing indicator */}
          {stage === 'paying' && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.typing}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                  <span style={{ marginLeft: 8, color: '#8e8ea0', fontSize: '0.8rem' }}>
                    Confirming transaction…
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Receipt card */}
          {(stage === 'receipt' || stage === 'full-review') && txnId && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={styles.messageInner}>
                <div className={`${styles.avatar} ${styles.avatarBot}`}>AI</div>
                <div className={styles.messageBubble}>
                  <div className={styles.receiptCard}>
                    <div className={styles.receiptCardTitle}>
                      🔒 Vault Receipt — Confirmed
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Transaction</span>
                      <span className={styles.receiptValue}>{txnId}</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Amount</span>
                      <span className={styles.receiptValue}>
                        {paymentRequest?.amount}
                      </span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Network</span>
                      <span className={styles.receiptValue}>Testnet</span>
                    </div>
                    <div className={styles.receiptRow}>
                      <span className={styles.receiptLabel}>Confirmed</span>
                      <span className={styles.receiptValue}>{confirmedAt}</span>
                    </div>
                    {stage === 'receipt' && (
                      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                        <button className={styles.btnPrimary} onClick={handleViewFull}>
                          View Full Review
                        </button>
                        <button
                          className={styles.btnGhost}
                          onClick={() => window.print()}
                        >
                          Save PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar — only active during chat stage */}
        <div>
          <div className={styles.inputBar}>
            <div className={styles.inputWrap}>
              <textarea
                ref={textareaRef}
                className={styles.textInput}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  stage !== 'chat' ? 'Review in progress…' : 'Message compass.tne.ai'
                }
                rows={1}
                disabled={stage !== 'chat' || botLoading}
                aria-label="Message input"
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
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
      </div>
    </div>
  );
}
