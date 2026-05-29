import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { auth, db } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';
import { runReview } from '../shared/reviewer';
import type { AgentContext, CodeReviewAgentResult } from '../shared/types/AgentContext';
import type { SampleReportData } from '../shared/types/ChatSession';
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

interface RunSampleReportArgs {
  reviewId: string;
  snippet: string;
  reportType: ReportType;
  fullReport?: boolean;
}

/**
 * Firebase-aware wrapper around the transport-neutral reviewer brain.
 * The brain itself lives in `src/shared/reviewer/`. This function only adds:
 *   1. Anonymous-auth gating via `requireUid()`.
 *   2. Firestore cache write of the resulting report.
 */
export async function runSampleReport({
  reviewId,
  snippet,
  reportType,
  fullReport = false,
}: RunSampleReportArgs): Promise<SampleReportData> {
  await requireUid();
  const def = getReportTypeDef(reportType);

  const data = await runReview({
    snippet,
    reportType,
    reportTypeDef: def,
    fullReport,
    geminiCall: (req) => createGeminiMessage(req),
  });

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
