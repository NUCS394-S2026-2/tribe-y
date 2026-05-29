import { runReview } from '../brain/runReview.js';
import type { GeminiCall, SampleReportData } from '../brain/types.js';
import { buildAndUploadReportPdf, type UploadedPdfArtifact } from '../pdf/upload.js';
import { getReportTypeDef, isReportType, type ReportType } from '../reportTypes.js';
import { InvalidParamsError } from './errors.js';

export interface ReviewParams {
  code: string;
  reportType: ReportType;
  fullReport?: boolean;
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
  if (p.fullReport !== undefined && typeof p.fullReport !== 'boolean') {
    throw new InvalidParamsError('params.fullReport must be a boolean if provided');
  }
  return {
    code: p.code,
    reportType: p.reportType,
    fullReport: p.fullReport === true,
  };
}

/**
 * Build the `review` method handler. The Gemini caller is injected so the
 * dispatcher and tests can substitute a mock without touching network. The
 * PDF uploader is also injected (defaulting to the real Firebase Storage
 * implementation) so tests don't touch real GCS.
 *
 * NOTE: This method is advertised as `paid: true` in the agent card. In this
 * PR there is NO x402 gate yet — the dispatcher runs the review for any
 * caller. The x402 middleware lands in PR 6.
 */
export function buildReviewHandler(
  geminiCall: GeminiCall,
  uploadPdf: PdfUploader = buildAndUploadReportPdf,
): (params: unknown) => Promise<SampleReportData> {
  return async (params: unknown) => {
    const { code, reportType, fullReport } = validateReviewParams(params);
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
      const artifact = await uploadPdf(data, code, reportType, fullReport === true);
      data.artifacts = artifact;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[reviewer] PDF upload failed; returning JSON only: ${msg}`);
    }

    return data;
  };
}
