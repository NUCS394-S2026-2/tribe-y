import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { auth, db } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';
import type { AgentContext, CodeReviewAgentResult } from '../shared/types/AgentContext';
import type {
  SampleReportData,
  SampleReportFinding,
  SampleReportScoreDimension,
  SampleReportScores,
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

You are producing a professional, publication-quality code review. Be thorough, specific, and concrete — every finding must reference exact lines and include actionable remediation. Avoid filler.

Respond with ONLY a JSON object — no markdown fences, no commentary — matching:
{
  "scores": {
    "overall": <integer 0–10, where 10 = excellent for this focus>,
    "dimensions": [
      { "label": "<3–18 char dimension name relevant to this report focus>", "score": <0–10>, "note": "<≤80 char rationale>" }
    ]
  },
  "summary": "<3–5 sentence executive summary that names the most serious issues and overall verdict>",
  "findings": [
    {
      "severity": "low" | "medium" | "high" | "critical",
      "line": <line number relative to the original snippet>,
      "title": "<concise finding title, ≤80 chars>",
      "detail": "<2–4 sentence explanation of the issue and why it matters>",
      "impact": "<1–2 sentences on the concrete worst-case consequence if shipped>",
      "evidence": "<the exact offending line or 1–3 line excerpt, verbatim from the slice>",
      "recommendation": "<2–3 sentences describing the fix and the principle behind it>",
      "codeFix": "<a corrected C++ snippet (multi-line allowed) demonstrating the fix>",
      "references": ["<rule id, CWE id, or canonical reference, e.g. 'CWE-120' or 'MISRA-C++ 5-0-15'>"]
    }
  ],
  "conclusion": "<3–4 sentences: overall verdict on the slice, what patterns are likely to recur in the rest of the codebase, and an invitation to the full paid report>"
}

Requirements:
- Provide 3–5 dimensions tailored to this report focus (e.g. security: "Input validation", "Memory safety", "Crypto hygiene"; performance: "Algorithmic complexity", "Allocation pressure", "Cache locality"). Lower scores indicate more problems.
- Aim for 4–8 findings if the code warrants it; do not pad. Each finding must include line, evidence, impact, recommendation, and codeFix.
- Cite line numbers exactly as labeled in the slice. Evidence must be verbatim.
- codeFix must compile-conceptually and demonstrate the fix in context (not pseudocode).
- references should cite CWE / CERT / MISRA / C++ Core Guidelines rule ids when applicable.
- If no real issues exist for this focus, return findings: [] and reflect that with high scores; the summary should explain why the code is clean for this focus.`;
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

function clampScore(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}

function deriveScoresFromFindings(
  findings: SampleReportFinding[],
  overallHint: number,
): SampleReportScores {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  const penalty = counts.critical * 4 + counts.high * 2 + counts.medium * 1;
  const overall = overallHint || Math.max(0, 10 - penalty);
  return {
    overall,
    dimensions: [
      { label: 'Critical issues', score: clampScore(10 - counts.critical * 4) },
      { label: 'High severity', score: clampScore(10 - counts.high * 2) },
      { label: 'Medium severity', score: clampScore(10 - counts.medium) },
    ],
  };
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
    max_tokens: 4000,
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
  let scores: SampleReportScores = { overall: 0, dimensions: [] };
  try {
    const parsed = JSON.parse(stripJsonFences(raw)) as {
      summary?: string;
      findings?: SampleReportFinding[];
      conclusion?: string;
      scores?: {
        overall?: number;
        dimensions?: SampleReportScoreDimension[];
      };
    };
    summary = parsed.summary ?? '';
    findings = Array.isArray(parsed.findings) ? parsed.findings : [];
    conclusion = parsed.conclusion ?? '';
    const rawDims = Array.isArray(parsed.scores?.dimensions)
      ? parsed.scores.dimensions
      : [];
    scores = {
      overall: clampScore(parsed.scores?.overall),
      dimensions: rawDims
        .filter((d): d is SampleReportScoreDimension => Boolean(d?.label))
        .map((d) => ({
          label: String(d.label).slice(0, 40),
          score: clampScore(d.score),
          note: d.note ? String(d.note).slice(0, 80) : undefined,
        })),
    };
  } catch (err) {
    console.warn('Sample report parse failed, returning raw text:', err);
    summary = raw.slice(0, 400);
    findings = [];
    conclusion =
      'Full report (paid) provides structured findings across the whole codebase.';
    scores = { overall: 0, dimensions: [] };
  }

  if (scores.dimensions.length === 0) {
    scores = deriveScoresFromFindings(findings, scores.overall);
  }

  const data: SampleReportData = {
    reportType,
    reportTitle: def.title,
    slice,
    summary,
    findings,
    conclusion,
    scores,
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
