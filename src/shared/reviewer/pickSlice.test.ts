import { describe, expect, it, vi } from 'vitest';

import { getReportTypeDef } from '../../agents/reportTypes';
import { pickSlice } from './pickSlice';

const def = getReportTypeDef('security');

describe('pickSlice', () => {
  it('bypasses the model for short snippets (≤40 lines)', async () => {
    const snippet = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
    const geminiCall = vi.fn();
    const slice = await pickSlice({ snippet, reportTypeDef: def, geminiCall });
    expect(geminiCall).not.toHaveBeenCalled();
    expect(slice.startLine).toBe(1);
    expect(slice.endLine).toBe(20);
    expect(slice.code).toBe(snippet);
  });

  it('uses the model output when JSON parses', async () => {
    const snippet = Array.from({ length: 80 }, (_, i) => `line ${i + 1}`).join('\n');
    const geminiCall = vi
      .fn()
      .mockResolvedValue('{"startLine": 10, "endLine": 25, "reason": "hot spot"}');
    const slice = await pickSlice({ snippet, reportTypeDef: def, geminiCall });
    expect(geminiCall).toHaveBeenCalledOnce();
    expect(slice.startLine).toBe(10);
    expect(slice.endLine).toBe(25);
    expect(slice.reason).toBe('hot spot');
    expect(slice.code.split('\n')).toHaveLength(16);
    expect(slice.code.split('\n')[0]).toBe('line 10');
  });

  it('falls back when the model returns unparseable text', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const snippet = Array.from({ length: 80 }, (_, i) => `line ${i + 1}`).join('\n');
    const geminiCall = vi.fn().mockResolvedValue('not json at all');
    const slice = await pickSlice({ snippet, reportTypeDef: def, geminiCall });
    expect(slice.startLine).toBe(1);
    expect(slice.endLine).toBe(50);
    expect(slice.reason).toMatch(/slice picker unavailable/i);
    warn.mockRestore();
  });
});
