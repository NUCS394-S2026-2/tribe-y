import { describe, expect, it } from 'vitest';

import { attemptJsonRepair, clampScore, stripJsonFences } from './parse';

describe('stripJsonFences', () => {
  it('removes ```json fences', () => {
    expect(stripJsonFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('leaves clean JSON alone', () => {
    expect(stripJsonFences('  {"a":1}  ')).toBe('{"a":1}');
  });
});

describe('clampScore', () => {
  it('rounds and clamps to [0,10]', () => {
    expect(clampScore(7.4)).toBe(7);
    expect(clampScore(7.6)).toBe(8);
    expect(clampScore(-3)).toBe(0);
    expect(clampScore(99)).toBe(10);
    expect(clampScore('bad')).toBe(0);
    expect(clampScore(undefined)).toBe(0);
  });
});

describe('attemptJsonRepair', () => {
  it('leaves valid JSON alone', () => {
    const input = '{"summary":"ok","findings":[]}';
    expect(attemptJsonRepair(input)).toBe(input);
  });

  it('closes truncated objects and arrays', () => {
    const truncated = '{"summary":"abc","findings":[{"title":"x"';
    const repaired = attemptJsonRepair(truncated);
    expect(() => JSON.parse(repaired)).not.toThrow();
    const parsed = JSON.parse(repaired);
    expect(parsed.summary).toBe('abc');
    expect(Array.isArray(parsed.findings)).toBe(true);
  });

  it('closes a dangling string mid-value', () => {
    const truncated = '{"summary":"abc def';
    const repaired = attemptJsonRepair(truncated);
    expect(() => JSON.parse(repaired)).not.toThrow();
    expect(JSON.parse(repaired).summary).toBe('abc def');
  });

  it('returns original raw when nothing salvageable', () => {
    // Empty string is a valid "no input" path and returns trimmed empty.
    expect(attemptJsonRepair('')).toBe('');
  });
});
