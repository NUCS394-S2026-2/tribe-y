import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { AgentContext } from '../shared/types/AgentContext';
import { CodeReviewAuthError, runCodeReviewTeaser } from './codeReviewAgent';

vi.mock('../shared/geminiClient', () => ({
  createGeminiMessage: vi.fn(),
}));

vi.mock('../shared/firebase', () => ({
  auth: {
    authStateReady: vi.fn().mockResolvedValue(undefined),
    currentUser: { uid: 'user-1' },
  },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'codeReviews-col'),
  doc: vi.fn(() => ({ id: 'review-abc' })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

import { setDoc } from 'firebase/firestore';

import { auth } from '../shared/firebase';
import { createGeminiMessage } from '../shared/geminiClient';

const mockCreateGeminiMessage = vi.mocked(createGeminiMessage);
const mockSetDoc = vi.mocked(setDoc);

const baseCtx: AgentContext = {
  uid: 'user-1',
  messages: [],
};

describe('runCodeReviewTeaser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.authStateReady).mockResolvedValue(undefined);
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: { uid: 'user-1' },
    });
  });

  test('generates teaser and persists codeReviews document', async () => {
    mockCreateGeminiMessage.mockResolvedValue('Found 2 issues in teaser scan.');

    const result = await runCodeReviewTeaser(baseCtx, '#include <vector>\nint main() {}');

    expect(result).toEqual({
      reviewId: 'review-abc',
      teaserReview: 'Found 2 issues in teaser scan.',
    });
    expect(mockCreateGeminiMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            content: expect.stringContaining('Review this C++ code'),
          }),
        ],
      }),
    );
    expect(mockSetDoc).toHaveBeenCalledWith(
      { id: 'review-abc' },
      expect.objectContaining({
        reviewId: 'review-abc',
        uid: 'user-1',
        language: 'C++',
        paymentStatus: 'unpaid',
        teaserReview: 'Found 2 issues in teaser scan.',
      }),
    );
  });

  test('throws CodeReviewAuthError when user is not signed in', async () => {
    Object.defineProperty(auth, 'currentUser', {
      configurable: true,
      value: null,
    });

    await expect(runCodeReviewTeaser(baseCtx, 'int main() {}')).rejects.toBeInstanceOf(
      CodeReviewAuthError,
    );
  });
});
