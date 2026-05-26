import { describe, expect, test } from 'vitest';

import { createReportCardDataFromTeaser } from './reportCardData';

describe('createReportCardDataFromTeaser', () => {
  test('creates live report-card data from teaser findings', () => {
    const data = createReportCardDataFromTeaser(
      [
        '## Findings',
        '- Critical undefined behavior in parseConfig when buffer ownership is unclear.',
        '- Raw pointer ownership can leak memory on early returns.',
      ].join('\n'),
      'uploaded.cpp',
    );

    expect(data.subject).toBe('uploaded.cpp');
    expect(data.auditId).toMatch(/^LIVE-\d{5}$/);
    expect(data.environmentLabel).toBe('Live Teaser Analysis');
    expect(data.healthScore).toBeLessThan(70);
    expect(data.issues[0]?.title).toContain('Critical undefined behavior');
    expect(data.issues[0]?.detail).toContain('parseConfig');
    expect(data.issues[1]?.title).toContain('Raw pointer ownership');
    expect(data.issues[1]?.detail).toContain('leak memory');
  });

  test('uses a fallback issue when the teaser has no keyword matches', () => {
    const data = createReportCardDataFromTeaser('The code is readable but needs review.');

    expect(data.issues).toEqual([
      expect.objectContaining({
        title: 'Review findings detected',
      }),
    ]);
  });
});
