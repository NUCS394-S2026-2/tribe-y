import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useChatOrchestrator } from './useChatOrchestrator';

vi.mock('../../agents/salesAgent', () => ({
  runSalesAgent: vi.fn(),
}));

vi.mock('../../agents/codeReviewAgent', () => ({
  CodeReviewAuthError: class CodeReviewAuthError extends Error {},
  runCodeReviewTeaser: vi.fn(),
}));

vi.mock('../../shared/firebase', () => ({
  auth: {
    authStateReady: vi.fn().mockResolvedValue(undefined),
    currentUser: { uid: 'user-1' },
  },
}));

import { runCodeReviewTeaser } from '../../agents/codeReviewAgent';
import { runSalesAgent } from '../../agents/salesAgent';

const mockRunSalesAgent = vi.mocked(runSalesAgent);
const mockRunCodeReviewTeaser = vi.mocked(runCodeReviewTeaser);

function renderOrchestrator() {
  return renderHook(() => useChatOrchestrator(), {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
  });
}

describe('useChatOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('seeds session with sales greeting', () => {
    const { result } = renderOrchestrator();

    expect(result.current.session.messages).toHaveLength(1);
    expect(result.current.session.messages[0]?.role).toBe('assistant');
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('routes English messages to sales agent', async () => {
    mockRunSalesAgent.mockResolvedValue({ text: 'Tell me more about your C++ issue.' });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('What does compass do?');
    });

    await waitFor(() => {
      expect(result.current.session.isLoading).toBe(false);
    });

    expect(mockRunSalesAgent).toHaveBeenCalled();
    expect(result.current.session.messages.at(-1)?.text).toBe(
      'Tell me more about your C++ issue.',
    );
    expect(result.current.session.mode).toBe('qualifying');
  });

  test('routes C++ input through teaser flow and sets activeReviewId', async () => {
    mockRunCodeReviewTeaser.mockResolvedValue({
      reviewId: 'review-123',
      teaserReview: 'Teaser: 2 potential bugs found.',
    });
    const { result } = renderOrchestrator();

    await act(async () => {
      await result.current.sendMessage('#include <iostream>\nint main() {}');
    });

    await waitFor(() => {
      expect(result.current.session.mode).toBe('teaser');
    });

    expect(mockRunCodeReviewTeaser).toHaveBeenCalled();
    expect(result.current.session.activeReviewId).toBe('review-123');
    expect(result.current.session.messages.at(-1)?.kind).toBe('teaser');
  });
});
