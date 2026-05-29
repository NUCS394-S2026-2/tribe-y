import { alignDimensionsToCanonical } from './dimensions.js';
import {
  attemptJsonRepair,
  clampScore,
  CodeReviewParseError,
  stripJsonFences,
} from './parse.js';
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
    summary = raw.slice(0, 400);
    findings = [];
    conclusion =
      'Full report (paid) provides structured findings across the whole codebase.';
    scores = { overall: 0, dimensions: [] };
  }

  if (findings.length === 0 && scores.dimensions.every((d) => d.score === 0)) {
    if (!parsed) {
      throw new CodeReviewParseError(
        'Code review brain returned no parseable findings or dimensions.',
        raw,
      );
    }
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
