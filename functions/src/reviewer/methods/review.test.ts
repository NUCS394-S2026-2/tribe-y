import { describe, expect, it, vi } from 'vitest';

import type { GeminiCall, SampleReportData } from '../brain/types.js';
import type { UploadedPdfArtifact } from '../pdf/upload.js';
import {
  dispatchRpc,
  JSON_RPC_ERRORS,
  type JsonRpcErrorEnvelope,
  type JsonRpcSuccess,
} from '../rpc.js';
import {
  buildReviewFullHandler,
  buildReviewSampleHandler,
  type PdfUploader,
  validateReviewParams,
} from './review.js';

/** Helper: a PDF uploader that always returns a deterministic artifact. */
function stubUploader(out: UploadedPdfArtifact): PdfUploader {
  return vi.fn(async () => out);
}

/** Helper: an uploader that always fails. */
function failingUploader(message: string): PdfUploader {
  return vi.fn(async () => {
    throw new Error(message);
  });
}

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

  it('returns the validated shape on success (no fullReport param accepted)', () => {
    expect(validateReviewParams({ code: 'int main(){}', reportType: 'memory' })).toEqual({
      code: 'int main(){}',
      reportType: 'memory',
    });
  });
});

describe('buildReviewSampleHandler', () => {
  it('runs a sample review end-to-end with a mocked geminiCall', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handler = buildReviewSampleHandler(
      geminiCall,
      stubUploader({
        pdfUrl: 'https://signed.example/x',
        pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        pdfSha256: 'a'.repeat(64),
      }),
    );

    const result = (await handler({
      code: SHORT_CPP,
      reportType: 'memory',
    })) as SampleReportData;

    expect(result.reportType).toBe('memory');
    expect(result.reportTitle).toBe('Memory Safety Audit');
    expect(result.findings).toHaveLength(1);
    expect(result.scores.overall).toBe(3);
    expect(result.scores.dimensions.map((d) => d.label)).toEqual([
      'Resource management',
      'Ownership semantics',
      'Lifetime safety',
      'Exception safety',
      'Type safety',
    ]);
    expect(result.isFullReport).toBe(false);
    expect(result.artifacts?.pdfUrl).toBe('https://signed.example/x');
    expect(result.artifacts?.pdfSha256).toBe('a'.repeat(64));
  });

  it('passes fullReport=false to the PDF uploader', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const uploader = stubUploader({
      pdfUrl: 'https://signed.example/from-uploader',
      pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      pdfSha256: 'c'.repeat(64),
    });
    const handler = buildReviewSampleHandler(geminiCall, uploader);

    await handler({ code: SHORT_CPP, reportType: 'memory' });

    expect(uploader).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: 'memory' }),
      SHORT_CPP,
      'memory',
      false,
    );
  });

  it('returns JSON without artifacts when the PDF uploader fails', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handler = buildReviewSampleHandler(geminiCall, failingUploader('boom'));

    const result = (await handler({
      code: SHORT_CPP,
      reportType: 'memory',
    })) as SampleReportData;

    expect(result.findings).toHaveLength(1);
    expect(result.artifacts).toBeUndefined();
  });
});

describe('buildReviewFullHandler', () => {
  it('runs a full review (skips slice picker, asks for full review)', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handler = buildReviewFullHandler(
      geminiCall,
      stubUploader({
        pdfUrl: 'https://signed.example/full',
        pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        pdfSha256: 'b'.repeat(64),
      }),
    );

    const result = (await handler({
      code: SHORT_CPP,
      reportType: 'memory',
    })) as SampleReportData;

    expect(result.isFullReport).toBe(true);
    expect(result.slice.startLine).toBe(1);
    expect(result.slice.endLine).toBeGreaterThanOrEqual(1);
  });

  it('passes fullReport=true to the PDF uploader', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const uploader = stubUploader({
      pdfUrl: 'https://signed.example/full2',
      pdfExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      pdfSha256: 'd'.repeat(64),
    });
    const handler = buildReviewFullHandler(geminiCall, uploader);

    await handler({ code: SHORT_CPP, reportType: 'memory' });

    expect(uploader).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: 'memory' }),
      SHORT_CPP,
      'memory',
      true,
    );
  });
});

describe('dispatchRpc + reviewSample integration', () => {
  it('routes reviewSample requests through the registered handler', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = {
      reviewSample: buildReviewSampleHandler(geminiCall, failingUploader('no-bucket')),
    };

    const r = (await dispatchRpc(
      {
        jsonrpc: '2.0',
        id: 99,
        method: 'reviewSample',
        params: { code: SHORT_CPP, reportType: 'memory' },
      },
      handlers,
    )) as JsonRpcSuccess;

    expect(r.jsonrpc).toBe('2.0');
    expect(r.id).toBe(99);
    const result = r.result as SampleReportData;
    expect(result.reportType).toBe('memory');
    expect(result.findings).toHaveLength(1);
    expect(result.isFullReport).toBe(false);
  });

  it('routes reviewFull requests through the registered handler', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = {
      reviewFull: buildReviewFullHandler(geminiCall, failingUploader('no-bucket')),
    };

    const r = (await dispatchRpc(
      {
        jsonrpc: '2.0',
        id: 100,
        method: 'reviewFull',
        params: { code: SHORT_CPP, reportType: 'memory' },
      },
      handlers,
    )) as JsonRpcSuccess;

    const result = r.result as SampleReportData;
    expect(result.isFullReport).toBe(true);
  });

  it('returns INVALID_PARAMS when params are malformed', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = {
      reviewSample: buildReviewSampleHandler(geminiCall, failingUploader('no-bucket')),
    };

    const r = (await dispatchRpc(
      { jsonrpc: '2.0', id: 100, method: 'reviewSample', params: { code: '' } },
      handlers,
    )) as JsonRpcErrorEnvelope;

    expect(r.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
    expect(geminiCall).not.toHaveBeenCalled();
  });

  it('returns METHOD_NOT_FOUND for the legacy `review` method', async () => {
    const geminiCall: GeminiCall = vi.fn(async () => VALID_REPORT_JSON);
    const handlers = {
      reviewSample: buildReviewSampleHandler(geminiCall, failingUploader('no-bucket')),
      reviewFull: buildReviewFullHandler(geminiCall, failingUploader('no-bucket')),
    };

    const r = (await dispatchRpc(
      {
        jsonrpc: '2.0',
        id: 200,
        method: 'review',
        params: { code: SHORT_CPP, reportType: 'memory' },
      },
      handlers,
    )) as JsonRpcErrorEnvelope;

    expect(r.error.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
  });
});
