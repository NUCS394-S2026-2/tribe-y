import { describe, expect, test } from 'vitest';

import type { ChatSession } from '../../shared/types/ChatSession';
import { routeMessage } from './routeMessage';

const emptySession: ChatSession = {
  messages: [],
  mode: 'qualifying',
  activeReviewId: null,
  isLoading: false,
};

describe('routeMessage', () => {
  test('routes English text to sales', () => {
    expect(routeMessage(emptySession, 'What does your platform do?')).toBe('sales');
  });

  test('routes C++ code to codeReview', () => {
    expect(routeMessage(emptySession, '#include <iostream>\nint main() {}')).toBe(
      'codeReview',
    );
  });

  test('routes ambiguous input to sales', () => {
    expect(routeMessage(emptySession, '')).toBe('sales');
  });
});
