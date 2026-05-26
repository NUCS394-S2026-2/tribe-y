import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, test } from 'vitest';

import type { ChatSession } from '../../shared/types/ChatSession';
import { CompassChatMessageFeed } from './CompassChatMessageFeed';

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    messages: [
      {
        id: 'teaser-1',
        role: 'assistant',
        text: 'Found 2 issues.',
        kind: 'teaser',
        createdAt: 0,
      },
    ],
    mode: 'qualifying',
    activeReviewId: 'review-123',
    isLoading: false,
    uploadedFile: null,
    pendingCode: null,
    selectedReportType: null,
    ...overrides,
  };
}

describe('CompassChatMessageFeed', () => {
  test('shows pay CTA when activeReviewId is set, even in qualifying mode', () => {
    render(
      <CompassChatMessageFeed
        session={makeSession()}
        bottomRef={createRef()}
        onPayForFullReview={() => undefined}
        onSelectReportType={() => undefined}
      />,
    );

    expect(
      screen.getByRole('button', { name: /pay for full code review/i }),
    ).toBeInTheDocument();
  });

  test('shows only analyzing indicator during code review, not generic typing', () => {
    render(
      <CompassChatMessageFeed
        session={makeSession({
          messages: [],
          mode: 'analyzing',
          isLoading: true,
        })}
        bottomRef={createRef()}
        onPayForFullReview={() => undefined}
        onSelectReportType={() => undefined}
      />,
    );

    expect(screen.getByText(/running c\+\+ expert analysis/i)).toBeInTheDocument();
    expect(screen.getAllByText('AI')).toHaveLength(1);
  });

  test('hides pay CTA when no activeReviewId', () => {
    render(
      <CompassChatMessageFeed
        session={makeSession({ activeReviewId: null })}
        bottomRef={createRef()}
        onPayForFullReview={() => undefined}
        onSelectReportType={() => undefined}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /pay for full code review/i }),
    ).not.toBeInTheDocument();
  });
});
