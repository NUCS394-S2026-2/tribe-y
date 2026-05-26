import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { auth, db } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';
import type { AgentContext, CodeReviewAgentResult } from '../shared/types/AgentContext';
import type {
  SampleReportData,
  SampleReportFinding,
  SampleReportSlice,
} from '../shared/types/ChatSession';
import { getReportTypeDef, type ReportType } from './reportTypes';

export class CodeReviewAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeReviewAuthError';
  }
}

async function requireUid(): Promise<string> {
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new CodeReviewAuthError(
      'Sign-in unavailable. Enable Anonymous Auth in Firebase and reload.',
    );
  }
  return uid;
}

export async function runCodeReviewTeaser(
  ctx: AgentContext,
  snippet: string,
): Promise<CodeReviewAgentResult> {
  void ctx;
  const uid = await requireUid();

  const teaserReview = await createGeminiMessage({
    model: 'gemini-2.5-flash',
    max_tokens: 600,
    system: TEASER_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Review this C++ code:\n\n${snippet}`,
      },
    ],
  });

  const docRef = doc(collection(db, 'codeReviews'));
  await setDoc(docRef, {
    reviewId: docRef.id,
    uid,
    snippet,
    language: 'C++',
    teaserReview,
    fullReview: null,
    paymentStatus: 'unpaid',
    uploadStatus: 'none',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { reviewId: docRef.id, teaserReview };
}

/**
 * Create the codeReviews doc up-front so we have a stable reviewId
 * before the user picks a report type.
 */
export async function createPendingReview(snippet: string): Promise<string> {
  const uid = await requireUid();
  const docRef = doc(collection(db, 'codeReviews'));
  await setDoc(docRef, {
    reviewId: docRef.id,
    uid,
    snippet,
    language: 'C++',
    fullReview: null,
    paymentStatus: 'unpaid',
    uploadStatus: 'none',
    sampleReports: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

const SLICE_PICKER_SYSTEM = `You are a C++ code triage assistant. Given a C++ snippet and a review focus, choose the single most review-worthy contiguous slice (10–40 lines) for a sample report.

Respond with ONLY a JSON object — no markdown fences, no prose — matching:
{"startLine": <1-indexed int>, "endLine": <int>, "reason": "<one short sentence>"}`;

function buildSampleReportSystem(reportType: ReportType): string {
  const def = getReportTypeDef(reportType);
  return `You are a C++ Expert Agent producing a "${def.title}" on a code slice.

Focus: ${def.focus}

Respond with ONLY a JSON object — no markdown fences, no commentary — matching:
{
  "summary": "<2-3 sentence overview of what you found in this slice>",
  "findings": [
    {
      "severity": "low" | "medium" | "high" | "critical",
      "line": <line number relative to the original snippet, optional>,
      "title": "<short title>",
      "detail": "<1-3 sentence explanation>",
      "recommendation": "<concrete fix, optional>"
    }
  ],
  "conclusion": "<1-2 sentence wrap-up; tease that the full report covers the entire codebase>"
}

Be specific. Cite line numbers when you can. If no issues exist in this slice for this focus, return findings: [] and say so in the summary.`;
}

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function pickSliceFallback(snippet: string): SampleReportSlice {
  const lines = snippet.split('\n');
  const endLine = Math.min(lines.length, 50);
  return {
    startLine: 1,
    endLine,
    reason: 'First portion of the snippet (slice picker unavailable).',
    code: lines.slice(0, endLine).join('\n'),
  };
}

async function pickSlice(
  snippet: string,
  reportType: ReportType,
): Promise<SampleReportSlice> {
  const def = getReportTypeDef(reportType);
  const lines = snippet.split('\n');
  if (lines.length <= 40) {
    return {
      startLine: 1,
      endLine: lines.length,
      reason: 'Snippet is short enough to review in full.',
      code: snippet,
    };
  }

  try {
    const raw = await createGeminiMessage({
      model: 'gemini-2.5-flash',
      max_tokens: 200,
      system: SLICE_PICKER_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Review focus: ${def.title}\nFocus detail: ${def.focus}\n\nC++ snippet (line-numbered):\n${lines
            .map((l, i) => `${i + 1}: ${l}`)
            .join('\n')}`,
        },
      ],
    });

    const parsed = JSON.parse(stripJsonFences(raw)) as {
      startLine?: number;
      endLine?: number;
      reason?: string;
    };
    const startLine = Math.max(1, Math.floor(parsed.startLine ?? 1));
    const endLine = Math.min(lines.length, Math.floor(parsed.endLine ?? startLine + 30));
    if (endLine < startLine) throw new Error('Invalid slice range');
    return {
      startLine,
      endLine,
      reason: parsed.reason ?? 'Selected by the agent.',
      code: lines.slice(startLine - 1, endLine).join('\n'),
    };
  } catch (err) {
    console.warn('Slice picker failed, falling back:', err);
    return pickSliceFallback(snippet);
  }
}

interface RunSampleReportArgs {
  reviewId: string;
  snippet: string;
  reportType: ReportType;
}

export async function runSampleReport({
  reviewId,
  snippet,
  reportType,
}: RunSampleReportArgs): Promise<SampleReportData> {
  await requireUid();
  const def = getReportTypeDef(reportType);
  const slice = await pickSlice(snippet, reportType);

  const raw = await createGeminiMessage({
    model: 'gemini-2.5-flash',
    max_tokens: 1500,
    system: buildSampleReportSystem(reportType),
    messages: [
      {
        role: 'user',
        content: `Slice (lines ${slice.startLine}–${slice.endLine} of the original snippet):\n\n${slice.code}`,
      },
    ],
  });

  let summary = '';
  let findings: SampleReportFinding[] = [];
  let conclusion = '';
  try {
    const parsed = JSON.parse(stripJsonFences(raw)) as {
      summary?: string;
      findings?: SampleReportFinding[];
      conclusion?: string;
    };
    summary = parsed.summary ?? '';
    findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    conclusion = parsed.conclusion ?? '';
  } catch (err) {
    console.warn('Sample report parse failed, returning raw text:', err);
    summary = raw.slice(0, 400);
    findings = [];
    conclusion =
      'Full report (paid) provides structured findings across the whole codebase.';
  }

  const data: SampleReportData = {
    reportType,
    reportTitle: def.title,
    slice,
    summary,
    findings,
    conclusion,
    generatedAt: Date.now(),
  };

  try {
    await updateDoc(doc(db, 'codeReviews', reviewId), {
      [`sampleReports.${reportType}`]: data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to cache sample report to Firestore:', err);
  }

  return data;
}
