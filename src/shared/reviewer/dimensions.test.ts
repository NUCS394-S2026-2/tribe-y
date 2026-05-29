import { describe, expect, it } from 'vitest';

import { alignDimensionsToCanonical, normalizeLabel } from './dimensions';

describe('normalizeLabel', () => {
  it('lowercases and strips non-alphanumerics', () => {
    expect(normalizeLabel('Input Validation')).toBe('inputvalidation');
    expect(normalizeLabel('MISRA C++')).toBe('misrac');
  });
});

describe('alignDimensionsToCanonical', () => {
  const canonical = ['Input validation', 'Memory safety', 'Type safety'] as const;

  it('matches verbatim labels and preserves canonical ordering', () => {
    const raw = [
      { label: 'Type safety', score: 8 },
      { label: 'Input validation', score: 5 },
      { label: 'Memory safety', score: 6 },
    ];
    const result = alignDimensionsToCanonical(canonical, raw);
    expect(result.map((d) => d.label)).toEqual([
      'Input validation',
      'Memory safety',
      'Type safety',
    ]);
    expect(result.map((d) => d.score)).toEqual([5, 6, 8]);
  });

  it('fuzzy-matches when the model rewords slightly', () => {
    const raw = [
      { label: 'input-validation', score: 4 },
      { label: 'memory safety!', score: 7 },
    ];
    const result = alignDimensionsToCanonical(canonical, raw);
    expect(result[0]).toMatchObject({ label: 'Input validation', score: 4 });
    expect(result[1]).toMatchObject({ label: 'Memory safety', score: 7 });
  });

  it('fills missing dimensions with score 0', () => {
    const raw = [{ label: 'Type safety', score: 9 }];
    const result = alignDimensionsToCanonical(canonical, raw);
    expect(result[0]).toEqual({ label: 'Input validation', score: 0 });
    expect(result[1]).toEqual({ label: 'Memory safety', score: 0 });
    expect(result[2]).toMatchObject({ label: 'Type safety', score: 9 });
  });
});
