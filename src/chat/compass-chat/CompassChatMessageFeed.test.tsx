import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, test } from 'vitest';

import type { ChatSession } from '../../shared/types/ChatSession';
import { CompassChatMessageFeed } from './CompassChatMessageFeed';

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    messages: [
      {
        id: 'sample-1',
        role: 'assistant',
        text: '',
        kind: 'sample-report',
        createdAt: 0,
        sampleReport: {
          reportType: 'security',
          reportTitle: 'Security Vulnerability Report',
          slice: {
            startLine: 1,
            endLine: 10,
            reason: 'Representative risky path.',
            code: 'int main() { return 0; }',
          },
          summary: 'Sample summary.',
          findings: [],
          conclusion: 'Sample conclusion.',
          scores: {
            overall: 7,
            dimensions: [{ label: 'Memory safety', score: 7 }],
          },
          generatedAt: 0,
        },
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
  test('renders pay button from the sample report card', () => {
    render(
      <CompassChatMessageFeed
        session={makeSession()}
        bottomRef={createRef()}
        onPayForFullReview={() => undefined}
        onSelectReportType={() => undefined}
        onGenerateFullReportPreview={() => undefined}
      />,
    );

    expect(
      screen.getByRole('button', { name: /pay for full report/i }),
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
        onGenerateFullReportPreview={() => undefined}
      />,
    );

    expect(screen.getByText(/running c\+\+ expert analysis/i)).toBeInTheDocument();
    expect(screen.getAllByText('AI')).toHaveLength(1);
  });

  test('keeps sample report pay button visible without activeReviewId', () => {
    render(
      <CompassChatMessageFeed
        session={makeSession({ activeReviewId: null })}
        bottomRef={createRef()}
        onPayForFullReview={() => undefined}
        onSelectReportType={() => undefined}
        onGenerateFullReportPreview={() => undefined}
      />,
    );

    expect(
      screen.getByRole('button', { name: /pay for full report/i }),
    ).toBeInTheDocument();
  });
});
