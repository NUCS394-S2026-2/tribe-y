import React, { useState } from 'react';

import { CODE_SNIPPET_MAX_CHARS } from '../shared/codeSnippetLimits';
import styles from './CodeReviewPage.module.css';
import { useCodeReview } from './useCodeReview';

const SNIPPET_COUNTER_NEAR_RATIO = 0.9;

export function CodeReviewPage() {
  const { reviewId, teaserReview, fullReview, isUnlocked, isLoading, submitSnippet } =
    useCodeReview();
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const [snippet, setSnippet] = useState('');
  const hasAnalyzed = !!teaserReview;
  const showFull = isUnlocked;

  const snippetLen = snippet.length;
  const snippetNearLimit =
    snippetLen >= CODE_SNIPPET_MAX_CHARS * SNIPPET_COUNTER_NEAR_RATIO;
  const snippetAtLimit = snippetLen >= CODE_SNIPPET_MAX_CHARS;

  const handleAnalyze = async () => {
    if (!snippet.trim()) return;
    await submitSnippet(snippet.slice(0, CODE_SNIPPET_MAX_CHARS));
  };

  const handleUnlock = () => {
    if (!reviewId) return;
    setUnlockMessage('Payment flow coming soon. Your review is saved.');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>C++ Expert Review</h1>
      <p className={styles.subtitle}>
        Paste your C++ code snippet below. The expert agent will analyze it.
      </p>

      <textarea
        className={styles.snippetArea}
        value={snippet}
        onChange={(e) => setSnippet(e.target.value.slice(0, CODE_SNIPPET_MAX_CHARS))}
        maxLength={CODE_SNIPPET_MAX_CHARS}
        placeholder={
          '// Paste your C++ code here...\nint main() {\n  int* p = new int(42);\n  return 0; // memory leak!\n}'
        }
        aria-label="C++ code snippet"
        aria-describedby={hasAnalyzed ? undefined : 'code-review-snippet-counter'}
        disabled={hasAnalyzed}
      />

      {!hasAnalyzed && (
        <div
          id="code-review-snippet-counter"
          className={`${styles.snippetCounter} ${snippetNearLimit ? styles.snippetCounterWarn : ''} ${snippetAtLimit ? styles.snippetCounterAtLimit : ''}`}
          aria-live="polite"
        >
          {snippetLen.toLocaleString()} / {CODE_SNIPPET_MAX_CHARS.toLocaleString()}{' '}
          characters
        </div>
      )}

      {!hasAnalyzed && (
        <button
          className={styles.analyzeBtn}
          onClick={handleAnalyze}
          disabled={isLoading || !snippet.trim()}
          aria-label="Analyze code"
        >
          {isLoading ? 'Analyzing…' : 'Analyze Code'}
        </button>
      )}

      {isLoading && <p className={styles.loading}>Running C++ Expert analysis…</p>}

      {teaserReview && (
        <div className={styles.reviewCard} role="region" aria-label="Expert review">
          <p className={styles.reviewTitle}>
            {showFull ? 'Full Expert Review' : 'Teaser Review'}
          </p>
          <pre className={styles.reviewContent}>
            {showFull ? fullReview : teaserReview}
          </pre>
        </div>
      )}

      {teaserReview && !showFull && (
        <button
          className={styles.unlockBtn}
          onClick={handleUnlock}
          aria-label="Unlock full review"
        >
          🔒 Unlock Full Review — Pay with Testnet
        </button>
      )}

      {unlockMessage && (
        <p className={styles.loading} role="status">
          {unlockMessage}
        </p>
      )}
    </div>
  );
}
