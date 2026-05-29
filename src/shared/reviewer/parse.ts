export class CodeReviewParseError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = 'CodeReviewParseError';
    this.raw = raw;
  }
}

export function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

/**
 * Attempt to repair a truncated JSON document produced by an LLM by closing
 * the dangling string, array, and object structures in a best-effort manner.
 * If `raw` already parses, return it unchanged. If repair still fails, return
 * the original input.
 */
export function attemptJsonRepair(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  // Fast path: already valid JSON
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // fall through
  }

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}') {
      if (stack[stack.length - 1] === '{') stack.pop();
    } else if (ch === ']') {
      if (stack[stack.length - 1] === '[') stack.pop();
    }
  }

  // Drop trailing junk that often appears in truncations: comma, colon, opener.
  let repaired = trimmed;
  if (inString) repaired += '"';

  // Trim trailing comma / colon / dangling key
  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/:\s*$/, ': null');

  while (stack.length > 0) {
    const opener = stack.pop();
    repaired += opener === '{' ? '}' : ']';
  }

  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    return raw;
  }
}
