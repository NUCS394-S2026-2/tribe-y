import type { InputKind } from './types';

const CPP_SIGNALS: RegExp[] = [
  /#include\s*[<"]/,
  /\bstd::\w+/,
  /\b(int|void|char|bool|float|double|auto|class|struct|template|namespace)\s+\w+/,
  /->/,
  /::/,
  /\b(public|private|protected):\s*$/,
  /\b(return|if|for|while|switch)\s*\(/,
];

/**
 * Heuristic classifier for chat input. Returns `cpp` when multiple C++ signals
 * are present, `english` for plain prose, and `ambiguous` for empty input.
 */
export function classifyInput(text: string): InputKind {
  const trimmed = text.trim();
  if (!trimmed) return 'ambiguous';

  let score = 0;
  for (const pattern of CPP_SIGNALS) {
    if (pattern.test(trimmed)) score++;
  }

  if (/#include\s*[<"]/.test(trimmed)) return 'cpp';
  if (score >= 2) return 'cpp';
  if (score >= 1 && trimmed.includes('{') && trimmed.includes('}')) return 'cpp';

  return 'english';
}
