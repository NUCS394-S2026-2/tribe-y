import { describe, expect, test } from 'vitest';

import type { ChatSession } from '../../shared/types/ChatSession';
import { routeMessage } from './routeMessage';

const emptySession: ChatSession = {
  messages: [],
  mode: 'qualifying',
  activeReviewId: null,
  isLoading: false,
  uploadedFile: null,
  pendingCode: null,
  selectedReportType: null,
};

describe('routeMessage', () => {
  test('routes English text to sales', () => {
    expect(routeMessage(emptySession, 'What does your platform do?')).toBe('sales');
  });

  test('routes C++ code to sales (consultant handles everything)', () => {
    expect(routeMessage(emptySession, '#include <iostream>\nint main() {}')).toBe(
      'sales',
    );
  });

  test('routes ambiguous input to sales', () => {
    expect(routeMessage(emptySession, '')).toBe('sales');
  });
});
