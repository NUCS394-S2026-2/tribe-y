import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import styles from './CodeReviewPage.module.css';
import { useCodeReview } from './useCodeReview';

export function CodeReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUnlockedParam = searchParams.get('unlocked') === 'true';

  const { reviewId, teaserReview, fullReview, isUnlocked, isLoading, submitSnippet } =
    useCodeReview();

  const [snippet, setSnippet] = useState('');
  const hasAnalyzed = !!teaserReview;
  const showFull = isUnlocked || isUnlockedParam;

  const handleAnalyze = async () => {
    if (!snippet.trim()) return;
    await submitSnippet(snippet);
  };

  const handleUnlock = () => {
    if (reviewId) {
      navigate(`/payment?reviewId=${reviewId}`);
    }
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
        onChange={(e) => setSnippet(e.target.value)}
        placeholder={
          '// Paste your C++ code here...\nint main() {\n  int* p = new int(42);\n  return 0; // memory leak!\n}'
        }
        aria-label="C++ code snippet"
        disabled={hasAnalyzed}
      />

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
    </div>
  );
}
