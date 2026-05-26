import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { AgentContext } from '../shared/types/AgentContext';
import { runSalesAgent } from './salesAgent';

vi.mock('../shared/geminiClient', () => ({
  createGeminiMessage: vi.fn(),
}));

import { createGeminiMessage } from '../shared/geminiClient';

const mockCreateGeminiMessage = vi.mocked(createGeminiMessage);

const baseCtx: AgentContext = {
  uid: 'user-1',
  messages: [
    {
      id: 'greeting',
      role: 'assistant',
      text: 'Hello!',
      kind: 'sales',
      createdAt: 0,
    },
    {
      id: 'user-1',
      role: 'user',
      text: 'I have a memory leak in C++',
      kind: 'sales',
      createdAt: 1,
    },
  ],
};

describe('runSalesAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls Gemini with conversation history mapped to user/assistant roles', async () => {
    mockCreateGeminiMessage.mockResolvedValue('Paste your C++ code when ready.');

    const result = await runSalesAgent(baseCtx, 'I have a memory leak in C++');

    expect(result.text).toBe('Paste your C++ code when ready.');
    expect(mockCreateGeminiMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        max_tokens: 400,
        messages: [
          { role: 'assistant', content: 'Hello!' },
          { role: 'user', content: 'I have a memory leak in C++' },
        ],
      }),
    );
    expect(mockCreateGeminiMessage.mock.calls[0]?.[0].system).toContain('Salesbot');
  });
});
