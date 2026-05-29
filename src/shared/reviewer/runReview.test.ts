import { describe, expect, it, vi } from 'vitest';

import { getReportTypeDef } from '../../agents/reportTypes';
import { CodeReviewParseError } from './parse';
import { runReview } from './runReview';

const def = getReportTypeDef('security');

const shortSnippet = Array.from({ length: 20 }, (_, i) => `int x${i};`).join('\n');

const happyResponse = JSON.stringify({
  summary: 'Looks decent.',
  conclusion: 'Pay for the full report for the rest.',
  findings: [
    {
      severity: 'high',
      line: 4,
      title: 'strcpy used',
      detail: 'unsafe',
      impact: 'overflow',
      evidence: 'strcpy(a,b);',
      recommendation: 'use std::string',
      codeFix: 'std::string a = b;',
      references: ['CWE-120', 'CERT STR31-C'],
    },
  ],
  scores: {
    overall: 6,
    dimensions: [
      { label: 'Input validation', score: 4, note: 'weak' },
      { label: 'Memory safety', score: 5, note: 'ok' },
      { label: 'Integer & arithmetic', score: 7, note: 'fine' },
      { label: 'Crypto & secrets', score: 8, note: 'n/a' },
      { label: 'Error handling', score: 6, note: 'ok' },
    ],
  },
});

describe('runReview', () => {
  it('returns a structured SampleReportData on the happy path', async () => {
    const geminiCall = vi.fn().mockResolvedValue(happyResponse);
    const result = await runReview({
      snippet: shortSnippet,
      reportType: 'security',
      reportTypeDef: def,
      geminiCall,
    });
    expect(result.reportType).toBe('security');
    expect(result.reportTitle).toBe(def.title);
    expect(result.findings).toHaveLength(1);
    expect(result.scores.overall).toBe(6);
    expect(result.scores.dimensions).toHaveLength(def.dimensions.length);
    expect(result.scores.dimensions[0].label).toBe('Input validation');
    expect(result.isFullReport).toBe(false);
    expect(result.slice.endLine).toBe(20);
  });

  it('repairs truncated JSON from the model', async () => {
    // Truncate mid-string in the findings array.
    const truncated = happyResponse.slice(0, happyResponse.indexOf('"recommendation"'));
    const geminiCall = vi.fn().mockResolvedValue(truncated);
    const result = await runReview({
      snippet: shortSnippet,
      reportType: 'security',
      reportTypeDef: def,
      geminiCall,
    });
    expect(result.summary).toBe('Looks decent.');
    // The truncated finding should still appear (even if incomplete) — repair
    // closes structure rather than dropping entries.
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('throws CodeReviewParseError when the model emits unparseable garbage', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const geminiCall = vi.fn().mockResolvedValue('totally not json !!!');
    await expect(
      runReview({
        snippet: shortSnippet,
        reportType: 'security',
        reportTypeDef: def,
        geminiCall,
      }),
    ).rejects.toBeInstanceOf(CodeReviewParseError);
    warn.mockRestore();
  });
});
