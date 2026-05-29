import { alignDimensionsToCanonical } from './dimensions.js';
import { attemptJsonRepair, clampScore, stripJsonFences } from './parse.js';
import { pickSlice } from './pickSlice.js';
import { buildSampleReportSystem } from './prompts.js';
import type {
  GeminiCall,
  ReportType,
  ReportTypeDef,
  SampleReportData,
  SampleReportFinding,
  SampleReportScoreDimension,
  SampleReportScores,
  SampleReportSlice,
} from './types.js';

export interface RunReviewArgs {
  snippet: string;
  reportType: ReportType;
  reportTypeDef: ReportTypeDef;
  fullReport?: boolean;
  geminiCall: GeminiCall;
}

/**
 * Pure, transport-neutral entry point for the code-review brain. Does not
 * touch Firebase auth, Firestore, or any other side-effecting infrastructure.
 * The caller supplies a `geminiCall` and the canonical `reportTypeDef`.
 */
export async function runReview({
  snippet,
  reportType,
  reportTypeDef: def,
  fullReport = false,
  geminiCall,
}: RunReviewArgs): Promise<SampleReportData> {
  const totalLines = snippet.split('\n').length;
  const slice: SampleReportSlice = fullReport
    ? {
        startLine: 1,
        endLine: totalLines,
        reason: 'Full submitted code reviewed end-to-end.',
        code: snippet,
      }
    : await pickSlice({ snippet, reportTypeDef: def, geminiCall });

  const userPrompt = fullReport
    ? `Produce a FULL report covering the entire submitted snippet (lines 1–${totalLines}). Cover every meaningful issue you can find — do not limit yourself to a slice.\n\nCode:\n\n${snippet}`
    : `Slice (lines ${slice.startLine}–${slice.endLine} of the original snippet):\n\n${slice.code}`;

  const raw = await geminiCall({
    model: 'gemini-2.5-pro',
    max_tokens: fullReport ? 16000 : 8000,
    system: buildSampleReportSystem(reportType, fullReport),
    messages: [{ role: 'user', content: userPrompt }],
  });

  let summary = '';
  let findings: SampleReportFinding[] = [];
  let conclusion = '';
  let scores: SampleReportScores = { overall: 0, dimensions: [] };

  const stripped = stripJsonFences(raw);
  let parsed: {
    summary?: string;
    findings?: SampleReportFinding[];
    conclusion?: string;
    scores?: {
      overall?: number;
      dimensions?: SampleReportScoreDimension[];
    };
  } | null = null;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    try {
      parsed = JSON.parse(attemptJsonRepair(stripped));
    } catch (err) {
      console.warn('Sample report parse failed:', err);
    }
  }

  if (parsed) {
    summary = parsed.summary ?? '';
    findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    conclusion = parsed.conclusion ?? '';
    const rawDims = Array.isArray(parsed.scores?.dimensions)
      ? parsed.scores!.dimensions!
      : [];
    scores = {
      overall: clampScore(parsed.scores?.overall),
      dimensions: alignDimensionsToCanonical(def.dimensions, rawDims),
    };
  } else {
    // The model returned text we couldn't parse into structured JSON even
    // after best-effort repair. Don't throw — surface a placeholder report
    // so the caller at least gets a recognizable shape back. The summary
    // explains what happened so the user can retry. (We previously threw a
    // CodeReviewParseError here, which made every parse hiccup look like a
    // crash to the consultant; with `responseMimeType: 'application/json'`
    // on the Gemini call this branch should be rare.)
    console.warn(
      '[reviewer brain] Unparseable model response; returning placeholder report.',
    );
    summary =
      "The reviewer received a response from the model that couldn't be parsed into a structured report. Please retry — this is usually transient.";
    findings = [];
    conclusion = 'No findings to report from this attempt. Please retry.';
    scores = {
      overall: 0,
      dimensions: alignDimensionsToCanonical(def.dimensions, []),
    };
  }

  return {
    reportType,
    reportTitle: def.title,
    slice,
    summary,
    findings,
    conclusion,
    scores,
    generatedAt: Date.now(),
    isFullReport: fullReport,
  };
}
