import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSalesbot } from '../agents/useSalesbot';
import styles from './SalesbotChat.module.css';

export function SalesbotChat() {
  const navigate = useNavigate();
  const { messages, sendMessage, intentVerified, isLoading } = useSalesbot();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await sendMessage(text);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.header}>Chat with Salesbot</h1>

      <div
        className={styles.chatContainer}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.bubble} ${msg.role === 'bot' ? styles.bubbleBot : styles.bubbleUser}`}
            >
              {msg.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your C++ problem…"
            aria-label="Message input"
            disabled={isLoading || intentVerified}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isLoading || !input.trim() || intentVerified}
            aria-label="Send message"
          >
            {isLoading ? '…' : 'Send'}
          </button>
        </div>
      </div>

      {intentVerified && (
        <div className={styles.approvedBanner} role="status">
          <strong>Salesbot approved your request.</strong> Your problem is C++ —
          let&apos;s get the expert review.
          <br />
          <button className={styles.continueBtn} onClick={() => navigate('/review')}>
            Paste Your Code →
          </button>
        </div>
      )}
    </div>
  );
}
