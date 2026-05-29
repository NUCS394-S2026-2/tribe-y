import { describe, expect, it, vi } from 'vitest';

import type { GeminiCall, SampleReportData } from '../brain/types.js';
import {
  dispatchRpc,
  JSON_RPC_ERRORS,
  type JsonRpcErrorEnvelope,
  type JsonRpcSuccess,
} from '../rpc.js';
import { buildReviewHandler, validateReviewParams } from './review.js';

const SHORT_CPP = `#include <vector>
int main() {
  std::vector<int> v;
  v[0] = 1; // out of bounds
  return 0;
}`;

const VALID_REPORT_JSON = JSON.stringify({
  scores: {
    overall: 3,
    dimensions: [
      { label: 'Resource management', score: 4, note: 'no RAII' },
      { label: 'Ownership semantics', score: 3, note: 'raw vec[0] write' },
      { label: 'Lifetime safety', score: 2, note: 'OOB write' },
      { label: 'Exception safety', score: 6 },
      { label: 'Type safety', score: 5 },
    ],
  },
  summary: 'A small but dangerous snippet.',
  findings: [
    {
      severity: 'critical',
      line: 4,
      title: 'Out-of-bounds write on empty vector',
      detail: 'Writing to v[0] when v is empty is UB.',
      impact: 'Memory corruption.',
      evidence: '  v[0] = 1;',
      recommendation: 'Use push_back or resize first.',
      codeFix: 'std::vector<int> v(1); v[0] = 1;',
      references: ['CWE-787', 'CERT ARR30-C'],
    },
  ],
  conclusion: 'Fix the obvious UB and revisit ownership.',
});

describe('validateReviewParams', () => {
  it('throws InvalidParamsError when params is not an object', () => {
    expect(() => validateReviewParams(null)).toThrow();
    expect(() => validateReviewParams('hi')).toThrow();
  });

  it('throws when code is missing or empty', () => {
    expect(() => validateReviewParams({ reportType: 'security' })).toThrow();
    expect(() => validateReviewParams({ code: '   ', reportType: 'security' })).toThrow();
  });

  it('throws when reportType is unknown', () => {
    expect(() =>
      validateReviewParams({ code: 'int main(){}', reportType: 'made-up' }),
    ).toThrow();
  });

  it('throws when fullReport is not a boolean', () => {
    expect(() =>
      validateReviewParams({
        code: 'int main(){}',
        reportType: 'security',
        fullReport: 'yes',
      }),
    ).toThrow();
  });

  it('returns the validated shape on success', () => {
    expect(validateReviewParams({ code: 'int main(){}', reportType: 'memory' })).toEqual({
      code: 'int main(){}',
      reportType: 'memory',
      fullReport: false,
    });
  });
});

describe('buildReviewHandler', () => {
  it('runs a review end-to-end with a mocked geminiCall', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handler = buildReviewHandler(geminiCall);

    const result = (await handler({
      code: SHORT_CPP,
      reportType: 'memory',
    })) as SampleReportData;

    expect(result.reportType).toBe('memory');
    expect(result.reportTitle).toBe('Memory Safety Audit');
    expect(result.findings).toHaveLength(1);
    expect(result.scores.overall).toBe(3);
    // Canonical alignment uses our verbatim dimension labels.
    expect(result.scores.dimensions.map((d) => d.label)).toEqual([
      'Resource management',
      'Ownership semantics',
      'Lifetime safety',
      'Exception safety',
      'Type safety',
    ]);
    expect(result.isFullReport).toBe(false);
  });

  it('honors fullReport=true (skips slice picker, asks for full review)', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handler = buildReviewHandler(geminiCall);

    const result = (await handler({
      code: SHORT_CPP,
      reportType: 'memory',
      fullReport: true,
    })) as SampleReportData;

    expect(result.isFullReport).toBe(true);
    expect(result.slice.startLine).toBe(1);
    expect(result.slice.endLine).toBeGreaterThanOrEqual(1);
  });
});

describe('dispatchRpc + review integration', () => {
  it('routes review requests through the registered handler', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = { review: buildReviewHandler(geminiCall) };

    const r = (await dispatchRpc(
      {
        jsonrpc: '2.0',
        id: 99,
        method: 'review',
        params: { code: SHORT_CPP, reportType: 'memory' },
      },
      handlers,
    )) as JsonRpcSuccess;

    expect(r.jsonrpc).toBe('2.0');
    expect(r.id).toBe(99);
    const result = r.result as SampleReportData;
    expect(result.reportType).toBe('memory');
    expect(result.findings).toHaveLength(1);
  });

  it('returns INVALID_PARAMS when params are malformed', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = { review: buildReviewHandler(geminiCall) };

    const r = (await dispatchRpc(
      { jsonrpc: '2.0', id: 100, method: 'review', params: { code: '' } },
      handlers,
    )) as JsonRpcErrorEnvelope;

    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
    expect(geminiCall).not.toHaveBeenCalled();
  });
});
