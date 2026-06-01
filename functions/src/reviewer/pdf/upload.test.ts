import { createHash } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SampleReportData } from '../brain/types.js';

// Mock firebase-admin/storage BEFORE importing the module under test.
const fileMocks = {
  exists: vi.fn<() => Promise<[boolean]>>(),
  save: vi.fn<(buf: Buffer, opts: unknown) => Promise<void>>(),
  getSignedUrl: vi.fn<(opts: unknown) => Promise<[string]>>(),
};
const bucketFile = vi.fn(() => fileMocks);
const bucket = vi.fn(() => ({ file: bucketFile }));
const getStorageMock = vi.fn(() => ({ bucket }));

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => getStorageMock(),
}));

// Lazy-import so the mock is applied first.
const { buildAndUploadReportPdf } = await import('./upload.js');

/**
 * Recompute the content hash the same way `upload.ts` does — over snippet
 * + reportType + fullReport + a JSON.stringify of the relevant data
 * fields. Tests assert the production hash matches this.
 */
function expectedHashFor(
  snippet: string,
  reportType: string,
  fullReport: boolean,
  data: SampleReportData,
): string {
  const dataKey = JSON.stringify({
    scores: data.scores,
    findings: data.findings,
    summary: data.summary,
    conclusion: data.conclusion,
    slice: data.slice,
  });
  const key = `${snippet}|${reportType}|${fullReport ? '1' : '0'}|${dataKey}`;
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

const SAMPLE_DATA: SampleReportData = {
  reportType: 'memory',
  reportTitle: 'Memory Safety Audit',
  slice: { startLine: 1, endLine: 3, reason: 'sample', code: 'int main(){}\n' },
  summary: 's',
  findings: [],
  conclusion: 'c',
  scores: { overall: 5, dimensions: [{ label: 'Resource management', score: 5 }] },
  generatedAt: 0,
};

describe('buildAndUploadReportPdf', () => {
  beforeEach(() => {
    fileMocks.exists.mockReset();
    fileMocks.save.mockReset();
    fileMocks.getSignedUrl.mockReset();
    bucketFile.mockClear();
    bucket.mockClear();
    getStorageMock.mockClear();
  });

  it('renders + uploads when the object does not exist, then signs a URL', async () => {
    fileMocks.exists.mockResolvedValueOnce([false]);
    fileMocks.save.mockResolvedValueOnce(undefined);
    fileMocks.getSignedUrl.mockResolvedValueOnce(['https://signed.example/x']);

    const out = await buildAndUploadReportPdf(SAMPLE_DATA, 'snippet', 'memory', false);

    expect(out.pdfUrl).toBe('https://signed.example/x');
    expect(out.pdfSha256).toHaveLength(64);
    const expectedHash = expectedHashFor('snippet', 'memory', false, SAMPLE_DATA);
    expect(out.pdfSha256).toBe(expectedHash);
    expect(bucketFile).toHaveBeenCalledWith(`reports/${expectedHash}.pdf`);
    expect(fileMocks.save).toHaveBeenCalledOnce();
    const [buf, saveOpts] = fileMocks.save.mock.calls[0]!;
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect((buf as Buffer).length).toBeGreaterThan(100);
    expect((saveOpts as { contentType: string }).contentType).toBe('application/pdf');
    expect(fileMocks.getSignedUrl).toHaveBeenCalledOnce();
    // pdfExpiresAt is a valid ISO ~24h in the future
    const expMs = Date.parse(out.pdfExpiresAt);
    expect(expMs - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(expMs - Date.now()).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('skips render+upload when the object already exists (dedup)', async () => {
    fileMocks.exists.mockResolvedValueOnce([true]);
    fileMocks.getSignedUrl.mockResolvedValueOnce(['https://signed.example/dedup']);

    const out = await buildAndUploadReportPdf(SAMPLE_DATA, 'snippet', 'memory', true);

    expect(out.pdfUrl).toBe('https://signed.example/dedup');
    expect(fileMocks.save).not.toHaveBeenCalled();
    expect(fileMocks.getSignedUrl).toHaveBeenCalledOnce();
    // fullReport=true flips the trailing byte (and the data is mixed in too)
    const expectedHash = expectedHashFor('snippet', 'memory', true, SAMPLE_DATA);
    expect(out.pdfSha256).toBe(expectedHash);
  });

  it('uses different content hashes for identical inputs but different data', async () => {
    fileMocks.exists.mockResolvedValue([false]);
    fileMocks.save.mockResolvedValue(undefined);
    fileMocks.getSignedUrl.mockResolvedValue(['https://signed.example/a']);

    const out1 = await buildAndUploadReportPdf(SAMPLE_DATA, 'snippet', 'memory', false);
    const out2 = await buildAndUploadReportPdf(
      {
        ...SAMPLE_DATA,
        scores: { overall: 8, dimensions: SAMPLE_DATA.scores.dimensions },
      },
      'snippet',
      'memory',
      false,
    );

    // Same snippet+reportType+fullReport but different scores → different
    // hash. This guarantees scorecard and PDF stay in sync when Gemini
    // returns different values on a re-run.
    expect(out1.pdfSha256).not.toBe(out2.pdfSha256);
  });

  it('propagates errors from the underlying storage layer', async () => {
    fileMocks.exists.mockRejectedValueOnce(new Error('bucket not configured'));

    await expect(
      buildAndUploadReportPdf(SAMPLE_DATA, 'snippet', 'memory', false),
    ).rejects.toThrow(/bucket not configured/);
  });
});
