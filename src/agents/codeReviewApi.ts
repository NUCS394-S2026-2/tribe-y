import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { auth, db, getFirebaseIdToken } from '../shared/firebase';

/**
 * Fetches the paid full review for a review document by ID.
 * Throws if payment has not been confirmed (HTTP 402).
 */
export async function fetchFullReviewById(reviewId: string): Promise<string> {
  const idToken = await getFirebaseIdToken();
  const res = await fetch('/api/code-review/full', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ reviewId }),
  });
  if (res.status === 402) {
    throw new Error('Payment is required before the full review can be loaded.');
  }
  if (!res.ok) {
    throw new Error((await res.text()) || `Full review request failed (${res.status})`);
  }
  const data = (await res.json()) as { fullReview?: string };
  return typeof data.fullReview === 'string' ? data.fullReview : '';
}

/**
 * Attaches uploaded codebase metadata to an existing review document.
 */
export async function attachCodebaseToReview(
  reviewId: string,
  fileName: string,
  content: string,
): Promise<void> {
  await auth.authStateReady();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Authentication required to upload codebase.');

  await updateDoc(doc(db, 'codeReviews', reviewId), {
    codebaseFileName: fileName,
    codebaseContent: content,
    uploadStatus: 'ready',
    updatedAt: serverTimestamp(),
  });
}
