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
    // sha256 over the deterministic key
    const expectedHash = createHash('sha256')
      .update('snippet|memory|0', 'utf8')
      .digest('hex');
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
    // fullReport=true flips the trailing byte
    const expectedHash = createHash('sha256')
      .update('snippet|memory|1', 'utf8')
      .digest('hex');
    expect(out.pdfSha256).toBe(expectedHash);
  });

  it('propagates errors from the underlying storage layer', async () => {
    fileMocks.exists.mockRejectedValueOnce(new Error('bucket not configured'));

    await expect(
      buildAndUploadReportPdf(SAMPLE_DATA, 'snippet', 'memory', false),
    ).rejects.toThrow(/bucket not configured/);
  });
});
