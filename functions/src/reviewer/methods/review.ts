import { runReview } from '../brain/runReview.js';
import type { GeminiCall, SampleReportData } from '../brain/types.js';
import { getReportTypeDef, isReportType, type ReportType } from '../reportTypes.js';
import { InvalidParamsError } from './errors.js';

export interface ReviewParams {
  code: string;
  reportType: ReportType;
  fullReport?: boolean;
}

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
 * dispatcher and tests can substitute a mock without touching network.
 *
 * NOTE: This method is advertised as `paid: true` in the agent card. In this
 * PR there is NO x402 gate yet — the dispatcher runs the review for any
 * caller. The x402 middleware lands in PR 6.
 */
export function buildReviewHandler(
  geminiCall: GeminiCall,
): (params: unknown) => Promise<SampleReportData> {
  return async (params: unknown) => {
    const { code, reportType, fullReport } = validateReviewParams(params);
    const def = getReportTypeDef(reportType);
    return runReview({
      snippet: code,
      reportType,
      reportTypeDef: def,
      fullReport,
      geminiCall,
    });
  };
}
