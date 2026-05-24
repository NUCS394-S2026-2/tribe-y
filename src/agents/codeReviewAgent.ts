import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { auth, db } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';
import type { AgentContext, CodeReviewAgentResult } from '../shared/types/AgentContext';

const DEFAULT_REPORT_TYPE = 'security';

export class CodeReviewAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeReviewAuthError';
  }
}

export async function runCodeReviewTeaser(
  ctx: AgentContext,
  snippet: string,
): Promise<CodeReviewAgentResult> {
  void ctx;

  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new CodeReviewAuthError(
      'Sign-in unavailable. Enable Anonymous Auth in Firebase and reload.',
    );
  }

  const teaserReview = await createGeminiMessage({
    model: 'gemini-2.5-flash',
    max_tokens: 600,
    system: TEASER_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Review type: ${DEFAULT_REPORT_TYPE}\n\nReview this C++ code:\n\n${snippet}`,
      },
    ],
  });

  const docRef = doc(collection(db, 'codeReviews'));
  await setDoc(docRef, {
    reviewId: docRef.id,
    uid,
    snippet,
    language: 'C++',
    reportType: DEFAULT_REPORT_TYPE,
    teaserReview,
    fullReview: null,
    paymentStatus: 'unpaid',
    uploadStatus: 'none',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { reviewId: docRef.id, teaserReview };
}
