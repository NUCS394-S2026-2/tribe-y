import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { claude } from '../shared/claude';
import { db, getUid } from '../shared/firebase';

interface CodeReviewState {
  reviewId: string | null;
  teaserReview: string | null;
  fullReview: string | null;
  isUnlocked: boolean;
  isLoading: boolean;
  submitSnippet: (snippet: string) => Promise<void>;
}

const TEASER_SYSTEM = `You are a C++ Expert Agent for compass.tne.ai.

Analyze the provided C++ code and produce a TEASER review — enough to demonstrate your expertise without giving away the full fix.

Your teaser must:
- Identify and name the specific issues (memory leaks, undefined behavior, missing RAII, raw pointers, etc.)
- Reference the exact functions or lines where issues occur
- State the risk/severity of each issue
- NOT provide the actual fix or refactored code — that's in the full review

Format your response in clear sections. Be direct and technical. Max 300 words.`;

const FULL_SYSTEM = `You are a C++ Expert Agent for compass.tne.ai.

Produce a FULL expert code review of the provided C++ code. This is the premium paid review — be comprehensive.

Your full review must include:
1. **Executive Summary** — overall code quality rating (1-10) and top concerns
2. **Issue Breakdown** — every bug, memory leak, undefined behavior, bad practice, with line references
3. **Refactored Code** — provide a corrected version of the full code using modern C++17/20 best practices (smart pointers, RAII, std::vector, etc.)
4. **Best Practices** — what patterns to adopt going forward

Be thorough, technical, and actionable. This is a paid expert review.`;

export function useCodeReview(): CodeReviewState {
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [teaserReview, setTeaserReview] = useState<string | null>(null);
  const [fullReview, setFullReview] = useState<string | null>(null);
  const [isUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitSnippet = useCallback(async (snippet: string) => {
    const uid = getUid();
    setIsLoading(true);

    try {
      // Run teaser and full review in parallel
      const [teaserRes, fullRes] = await Promise.all([
        claude.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: TEASER_SYSTEM,
          messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
        }),
        claude.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: FULL_SYSTEM,
          messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
        }),
      ]);

      const teaser =
        teaserRes.content[0].type === 'text' ? teaserRes.content[0].text : '';
      const full = fullRes.content[0].type === 'text' ? fullRes.content[0].text : '';

      setTeaserReview(teaser);
      setFullReview(full);

      // Set a local ID immediately so the Unlock button works right away
      const localId = `review-${Date.now()}`;
      setReviewId(localId);

      // Fire-and-forget Firestore write — never blocks the UI
      const now = new Date().toISOString();
      addDoc(collection(db, 'codeReviews'), {
        uid,
        snippet,
        language: 'C++',
        teaserReview: teaser,
        fullReview: full,
        paymentStatus: 'unpaid',
        createdAt: now,
        updatedAt: now,
      })
        .then((docRef) => {
          setReviewId(docRef.id);
          updateDoc(docRef, { reviewId: docRef.id }).catch(() => {});
        })
        .catch(() => {});
    } catch (err) {
      console.error('Code review error:', err);
      setTeaserReview('Error running analysis. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { reviewId, teaserReview, fullReview, isUnlocked, isLoading, submitSnippet };
}
