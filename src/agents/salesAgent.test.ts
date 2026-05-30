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

  test('requests Gemini JSON mode and parses {say, action: null} as plain text', async () => {
    mockCreateGeminiMessage.mockResolvedValue(
      JSON.stringify({
        say: 'Tell me a bit about what you are building — embedded firmware, web service, something else?',
        action: null,
      }),
    );

    const result = await runSalesAgent(baseCtx, 'I have a memory leak in C++');

    expect(result.text).toBe(
      'Tell me a bit about what you are building — embedded firmware, web service, something else?',
    );
    expect(result.action).toBeUndefined();
    expect(mockCreateGeminiMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        responseMimeType: 'application/json',
        messages: [
          { role: 'assistant', content: 'Hello!' },
          { role: 'user', content: 'I have a memory leak in C++' },
        ],
      }),
    );
    expect(mockCreateGeminiMessage.mock.calls[0]?.[0].system).toContain('consultant');
  });

  test('surfaces initiate_review action with valid reportType', async () => {
    mockCreateGeminiMessage.mockResolvedValue(
      JSON.stringify({
        say: 'Kicking off the Memory Safety Audit on what you pasted.',
        action: {
          type: 'initiate_review',
          reportType: 'memory',
          fullReport: false,
        },
      }),
    );

    const result = await runSalesAgent(baseCtx, 'go for it');

    expect(result.text).toBe('Kicking off the Memory Safety Audit on what you pasted.');
    expect(result.action).toEqual({
      type: 'initiate_review',
      reportType: 'memory',
      fullReport: false,
    });
  });

  test('strips ```json fences before parsing', async () => {
    mockCreateGeminiMessage.mockResolvedValue(
      '```json\n{"say":"Hi there","action":null}\n```',
    );

    const result = await runSalesAgent(baseCtx, 'hi');

    expect(result.text).toBe('Hi there');
    expect(result.action).toBeUndefined();
  });

  test('drops action when reportType is not in the canonical set', async () => {
    mockCreateGeminiMessage.mockResolvedValue(
      JSON.stringify({
        say: 'Let me run a check.',
        action: {
          type: 'initiate_review',
          reportType: 'imaginary-report',
          fullReport: false,
        },
      }),
    );

    const result = await runSalesAgent(baseCtx, 'sure');

    expect(result.text).toBe('Let me run a check.');
    expect(result.action).toBeUndefined();
  });

  test('falls back to plain text when the model returns unparseable prose', async () => {
    mockCreateGeminiMessage.mockResolvedValue('Sorry, I cannot answer that as JSON.');

    const result = await runSalesAgent(baseCtx, 'hi');

    expect(result.text).toBe('Sorry, I cannot answer that as JSON.');
    expect(result.action).toBeUndefined();
  });
});
