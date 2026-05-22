import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { auth, db, getFirebaseIdToken } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';

interface CodeReviewState {
  reviewId: string | null;
  teaserReview: string | null;
  fullReview: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
  submitSnippet: (snippet: string, reportType?: string) => Promise<void>;
  /** Loads the paid full review from the server after `paymentStatus` is `paid`. */
  fetchFullReview: () => Promise<void>;
}

export function useCodeReview(): CodeReviewState {
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [teaserReview, setTeaserReview] = useState<string | null>(null);
  const [fullReview, setFullReview] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFullReview = useCallback(async () => {
    const id = reviewId;
    if (!id) {
      throw new Error('No review is loaded yet.');
    }
    const idToken = await getFirebaseIdToken();
    const res = await fetch('/api/code-review/full', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ reviewId: id }),
    });
    if (res.status === 402) {
      throw new Error('Payment is required before the full review can be loaded.');
    }
    if (!res.ok) {
      throw new Error((await res.text()) || `Full review request failed (${res.status})`);
    }
    const data = (await res.json()) as { fullReview?: string };
    const text = typeof data.fullReview === 'string' ? data.fullReview : '';
    setFullReview(text);
    setIsUnlocked(true);
  }, [reviewId]);

  const submitSnippet = useCallback(async (snippet: string, reportType = 'security') => {
    setIsLoading(true);
    setIsUnlocked(false);
    setFullReview(null);

    await auth.authStateReady();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      setTeaserReview(
        'Sign-in unavailable. Enable Anonymous Auth in Firebase and reload.',
      );
      return;
    }

    let teaser: string;
    try {
      teaser = await createGeminiMessage({
        model: 'gemini-2.5-flash',
        max_tokens: 600,
        system: TEASER_SYSTEM,
        messages: [
          {
            role: 'user',
            content: `Review type: ${reportType}\n\nReview this C++ code:\n\n${snippet}`,
          },
        ],
      });
      setTeaserReview(teaser);
    } catch (err) {
      console.error('Code review error:', err);
      setTeaserReview('Error running analysis. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const docRef = doc(collection(db, 'codeReviews'));
      await setDoc(docRef, {
        reviewId: docRef.id,
        uid,
        snippet,
        language: 'C++',
        reportType,
        teaserReview: teaser,
        fullReview: null,
        paymentStatus: 'unpaid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReviewId(docRef.id);
    } catch (err) {
      console.error('Code review persist error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reviewId,
    teaserReview,
    fullReview,
    isUnlocked,
    isLoading,
    submitSnippet,
    fetchFullReview,
  };
}
