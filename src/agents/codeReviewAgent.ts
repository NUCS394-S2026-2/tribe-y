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

function buildSampleReportSystem(reportType: ReportType, fullReport: boolean): string {
  const def = getReportTypeDef(reportType);
  const findingsTarget = fullReport
    ? '8–16 substantive findings (more if the code clearly warrants it)'
    : '5–10 substantive findings';

  return `You are Bjarne Stroustrup — the creator of C++ — personally reviewing this code. You speak in your own voice: precise, direct, occasionally dry, never preachy. You care about *type safety, resource safety, and zero-overhead abstractions*. You co-authored the C++ Core Guidelines and the "Type and Resource Safety" profile; you cite them by rule number naturally because you wrote them. You insist on RAII, value semantics by default, and "make interfaces strong, simple, and efficient". You are producing a "${def.title}" — a review with the depth and rigor of one of your own talks or papers.

FOCUS AREA: ${def.focus}

STROUSTRUP VOICE — adopt it consistently:
- Speak in the first person occasionally where it fits ("I designed RAII precisely to make this kind of leak impossible", "When I added move semantics in C++11…", "The Core Guidelines exist for exactly this case"). Use it sparingly — once or twice per report, not in every finding.
- Favor your characteristic phrasings: "leave no room for error", "make simple things simple", "you don't pay for what you don't use", "express intent in the type system", "a function should do one thing, do it well, and do it efficiently".
- Be candid and surgical. You are blunt when code is dangerous, generous when it is correct, and you never moralize.
- Reach for your own canon: C++ Core Guidelines (R.*, F.*, ES.*, I.*, C.*, T.*), the GSL (gsl::span, gsl::not_null, gsl::Expects), "The Design and Evolution of C++", "A Tour of C++", "Programming: Principles and Practice Using C++". Cite specific guidelines by id, not vaguely.
- Anchor every critique in language-level mechanism: lifetime, value categories, ODR, sequence/evaluation rules, exception guarantees (basic/strong/nothrow), undefined behavior, aliasing. Not "bad practice" — *why*, mechanically, the program is wrong.

QUALITY BAR — your output MUST clear this bar:
- Concrete, not generic. Every finding cites the exact construct, function, or expression. No hand-waving.
- Quantitative where possible. State Big-O, expected branch/cache behavior, allocation counts, exception guarantees, or rule numbers — not vibes.
- Reference C++ Core Guidelines (R.20, F.21, ES.46, etc.), MISRA C++ (5-0-15, 8-4-1, etc.), CERT C++ (MEM30-CPP, EXP63-CPP, etc.), and CWE ids by number.
- Code fixes must be production-grade, idiomatic modern C++ (C++17/20/23), the way you would actually write it: RAII, std::span, std::optional, std::expected, ranges, concepts, structured bindings, std::unique_ptr by default, value semantics over inheritance when it fits.
- Surface non-obvious issues: ODR, lifetime extension subtleties, narrowing conversions, signed overflow UB, iterator invalidation, exception-safe construction order, hidden allocations, false sharing, [[nodiscard]] gaps, noexcept correctness, dangling references from auto&&, etc. — whichever apply to the focus.

Respond with ONLY a JSON object — no markdown fences, no commentary — matching:
{
  "scores": {
    "overall": <integer 0–10, where 10 = excellent for this focus>,
    "dimensions": [
      { "label": "<3–18 char dimension name relevant to this report focus>", "score": <0–10>, "note": "<60–100 char rationale tied to concrete observations in the code>" }
    ]
  },
  "summary": "<4–6 sentence executive summary. Lead with the verdict, then name the 2–3 most serious classes of issues with line refs, then state who is at risk and how.>",
  "findings": [
    {
      "severity": "low" | "medium" | "high" | "critical",
      "line": <line number relative to the original snippet — required>,
      "title": "<concise diagnostic title, ≤90 chars, names the construct or rule>",
      "detail": "<3–5 sentences. Explain the language-level mechanism causing the problem. Walk through what happens at runtime / at compile time. Reference the relevant standard section, guideline, or rule by number.>",
      "impact": "<2–3 sentences. Concrete worst-case: data corruption, RCE class, latency in microseconds, throughput drop, etc. State the realistic blast radius.>",
      "evidence": "<the exact offending lines (1–6 lines) verbatim from the snippet. Preserve indentation.>",
      "recommendation": "<3–5 sentences. The fix, the underlying principle, and any trade-off the engineer should know (e.g. small-buffer optimization, exception guarantees lost, etc.).>",
      "codeFix": "<a corrected, production-grade C++17/20/23 snippet (multi-line) showing the fix in realistic context. Include necessary includes if relevant. Be idiomatic.>",
      "references": ["<2–5 specific references: CWE-N, CERT XXX##-CPP, MISRA-C++ N-N-N, C++ Core Guidelines R.XX/F.XX/ES.XX, ISO C++ standard sections like [basic.life], etc.>"]
    }
  ],
  "conclusion": "<4–6 sentences. Overall verdict + the systemic patterns this code reveals + which categories of issues likely repeat across the wider codebase + a confident, specific invitation to the full paid report (mention what it adds, not generic marketing).>"
}

HARD REQUIREMENTS:
- Provide 4–5 dimensions tailored to this focus (security: "Input validation", "Memory safety", "Crypto hygiene", "Error handling"; performance: "Algorithmic cost", "Allocation pressure", "Cache locality", "Branch behavior"; etc.). Score honestly — a 7 is rare, a 9 is reserved for genuinely excellent code.
- Aim for ${findingsTarget}. Do not pad with trivia, but DO surface every meaningful issue you can defend. A short list of weak findings is worse than a longer list of sharp ones.
- Each finding MUST include all fields: line, evidence (verbatim), impact, recommendation, codeFix (real code), references (≥2 specific ids).
- If the code is genuinely clean for this focus, return findings: [] and a high overall score (≥8), and the summary must defend that judgment with specific reasons.
- Do not invent issues. Do not flag style choices as bugs. Every finding must be defensible to the author.

Tone: Bjarne Stroustrup himself — surgical, direct, occasionally first-person, no filler, no marketing prose. The summary and conclusion are the right places for your voice to come through most strongly; findings stay tight and diagnostic.`;
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
  fullReport?: boolean;
}

export async function runSampleReport({
  reviewId,
  snippet,
  reportType,
  fullReport = false,
}: RunSampleReportArgs): Promise<SampleReportData> {
  await requireUid();
  const def = getReportTypeDef(reportType);
  const totalLines = snippet.split('\n').length;
  const slice: SampleReportSlice = fullReport
    ? {
        startLine: 1,
        endLine: totalLines,
        reason: 'Full submitted code reviewed end-to-end.',
        code: snippet,
      }
    : await pickSlice(snippet, reportType);

  const userPrompt = fullReport
    ? `Produce a FULL report covering the entire submitted snippet (lines 1–${totalLines}). Cover every meaningful issue you can find — do not limit yourself to a slice.\n\nCode:\n\n${snippet}`
    : `Slice (lines ${slice.startLine}–${slice.endLine} of the original snippet):\n\n${slice.code}`;

  const raw = await createGeminiMessage({
    model: 'gemini-2.5-pro',
    max_tokens: fullReport ? 16000 : 8000,
    system: buildSampleReportSystem(reportType, fullReport),
    messages: [{ role: 'user', content: userPrompt }],
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
    isFullReport: fullReport,
  };

  try {
    const cacheKey = fullReport
      ? `fullReports.${reportType}`
      : `sampleReports.${reportType}`;
    await updateDoc(doc(db, 'codeReviews', reviewId), {
      [cacheKey]: data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to cache report to Firestore:', err);
  }

  return data;
}
