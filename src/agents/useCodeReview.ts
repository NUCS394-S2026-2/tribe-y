import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { createClaudeMessage } from '../shared/claudeClient';
import { TEASER_SYSTEM } from '../shared/codeReviewPrompts';
import { db, getFirebaseIdToken, getUid } from '../shared/firebase';

interface CodeReviewState {
  reviewId: string | null;
  teaserReview: string | null;
  fullReview: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
  submitSnippet: (snippet: string) => Promise<void>;
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

  const submitSnippet = useCallback(async (snippet: string) => {
    const uid = getUid();
    setIsLoading(true);
    setIsUnlocked(false);
    setFullReview(null);

    try {
      const teaser = await createClaudeMessage({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: TEASER_SYSTEM,
        messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
      });

      setTeaserReview(teaser);

      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'codeReviews'), {
        uid,
        snippet,
        language: 'C++',
        teaserReview: teaser,
        fullReview: null,
        paymentStatus: 'unpaid',
        createdAt: now,
        updatedAt: now,
      });
      await updateDoc(docRef, { reviewId: docRef.id });
      setReviewId(docRef.id);
    } catch (err) {
      console.error('Code review error:', err);
      setTeaserReview('Error running analysis. Please try again.');
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
