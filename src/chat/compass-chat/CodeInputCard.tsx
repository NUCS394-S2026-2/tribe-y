import React from 'react';

import { CODE_SNIPPET_MAX_CHARS } from '../../shared/codeSnippetLimits';
import styles from '../CompassChat.module.css';
import { AssistantMessageRow } from './AssistantMessageRow';

const COUNTER_NEAR_LIMIT_RATIO = 0.9;
const snippetCounterId = 'compass-chat-code-snippet-counter';

interface CodeInputCardProps {
  snippet: string;
  onSnippetChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export function CodeInputCard({
  snippet,
  onSnippetChange,
  onAnalyze,
  onClear,
}: CodeInputCardProps) {
  const length = snippet.length;
  const nearLimit = length >= CODE_SNIPPET_MAX_CHARS * COUNTER_NEAR_LIMIT_RATIO;
  const atLimit = length >= CODE_SNIPPET_MAX_CHARS;

  return (
    <AssistantMessageRow>
      <div className={styles.codeInputCard}>
        <div className={styles.codeInputLabel}>Paste your C++ code</div>
        <textarea
          className={styles.codeInputArea}
          value={snippet}
          onChange={(e) =>
            onSnippetChange(e.target.value.slice(0, CODE_SNIPPET_MAX_CHARS))
          }
          maxLength={CODE_SNIPPET_MAX_CHARS}
          placeholder={
            '// Paste your C++ code here...\nint main() {\n  int* p = new int(42);\n  return 0;\n}'
          }
          aria-label="C++ code snippet"
          aria-describedby={snippetCounterId}
          spellCheck={false}
        />
        <div
          id={snippetCounterId}
          className={`${styles.codeInputCounter} ${nearLimit ? styles.codeInputCounterWarn : ''} ${atLimit ? styles.codeInputCounterAtLimit : ''}`}
          aria-live="polite"
        >
          {length.toLocaleString()} / {CODE_SNIPPET_MAX_CHARS.toLocaleString()} characters
        </div>
        <div className={styles.codeInputActions}>
          <button
            className={styles.btnPrimary}
            onClick={onAnalyze}
            disabled={!snippet.trim()}
          >
            Analyze Code
          </button>
          <button type="button" className={styles.btnGhost} onClick={onClear}>
            Clear
          </button>
        </div>
      </div>
    </AssistantMessageRow>
  );
}
