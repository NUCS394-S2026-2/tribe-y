import { runReview } from '../brain/runReview.js';
import type { GeminiCall, SampleReportData } from '../brain/types.js';
import { buildAndUploadReportPdf, type UploadedPdfArtifact } from '../pdf/upload.js';
import { getReportTypeDef, isReportType, type ReportType } from '../reportTypes.js';
import { InvalidParamsError } from './errors.js';

export interface ReviewParams {
  code: string;
  reportType: ReportType;
}

/**
 * Best-effort PDF uploader signature. Injected to keep tests hermetic and to
 * allow the same handler to run in environments where the Storage bucket
 * isn't configured (e.g. local emulator without the storage emulator).
 */
export type PdfUploader = (
  data: SampleReportData,
  snippet: string,
  reportType: string,
  fullReport: boolean,
) => Promise<UploadedPdfArtifact>;

/**
 * Validate JSON-RPC params for the review methods. Both `reviewSample` and
 * `reviewFull` accept the same shape — `fullReport` is no longer a client-
 * controllable param; it's implied by which method was called.
 */
export function validateReviewParams(params: unknown): ReviewParams {
  if (typeof params !== 'object' || params === null) {
    throw new InvalidParamsError('params must be an object');
  }
  const p = params as Record<string, unknown>;
  if (typeof p.code !== 'string' || p.code.trim().length === 0) {
    throw new InvalidParamsError('params.code must be a non-empty string');
  }
  if (!isReportType(p.reportType)) {
    throw new InvalidParamsError(
      'params.reportType must be one of the supported report types — call listReportTypes to discover them',
    );
  }
  return {
    code: p.code,
    reportType: p.reportType,
  };
}

/**
 * Build a review handler for either sample or full mode. The Gemini caller is
 * injected so the dispatcher and tests can substitute a mock without touching
 * network. The PDF uploader is also injected (defaulting to the real Firebase
 * Storage implementation) so tests don't touch real GCS.
 *
 * The `fullReport` boolean is fixed per-handler at construction time: pass
 * `false` to build the `reviewSample` (free) handler, `true` to build the
 * `reviewFull` (paid via x402) handler. Both share the same param schema and
 * return shape; the only behavioural difference lives in the brain (slice
 * picker vs whole-snippet pass).
 */
export function buildReviewHandler(
  geminiCall: GeminiCall,
  uploadPdf: PdfUploader = buildAndUploadReportPdf,
  fullReport = false,
): (params: unknown) => Promise<SampleReportData> {
  return async (params: unknown) => {
    const { code, reportType } = validateReviewParams(params);
    const def = getReportTypeDef(reportType);
    const data = await runReview({
      snippet: code,
      reportType,
      reportTypeDef: def,
      fullReport,
      geminiCall,
    });

    // Best-effort: render+upload the PDF and attach the signed-URL artifact.
    // Failures here MUST NOT fail the review — the JSON response is the
    // canonical result. The PDF is a convenience artifact.
    try {
      const artifact = await uploadPdf(data, code, reportType, fullReport);
      data.artifacts = artifact;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[reviewer] PDF upload failed; returning JSON only: ${msg}`);
    }

    return data;
  };
}

/** Free, sample-slice handler (`reviewSample` JSON-RPC method). */
export function buildReviewSampleHandler(
  geminiCall: GeminiCall,
  uploadPdf: PdfUploader = buildAndUploadReportPdf,
): (params: unknown) => Promise<SampleReportData> {
  return buildReviewHandler(geminiCall, uploadPdf, false);
}

/**
 * Paid, full-snippet handler (`reviewFull` JSON-RPC method). The x402 gate
 * is enforced one level up in `rpc.ts` — this handler assumes payment has
 * already been verified and claimed.
 */
export function buildReviewFullHandler(
  geminiCall: GeminiCall,
  uploadPdf: PdfUploader = buildAndUploadReportPdf,
): (params: unknown) => Promise<SampleReportData> {
  return buildReviewHandler(geminiCall, uploadPdf, true);
}
