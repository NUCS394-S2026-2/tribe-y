import { stripJsonFences } from './parse.js';
import { SLICE_PICKER_SYSTEM } from './prompts.js';
import type { GeminiCall, ReportTypeDef, SampleReportSlice } from './types.js';

export function pickSliceFallback(snippet: string): SampleReportSlice {
  const lines = snippet.split('\n');
  const endLine = Math.min(lines.length, 50);
  return {
    startLine: 1,
    endLine,
    reason: 'First portion of the snippet (slice picker unavailable).',
    code: lines.slice(0, endLine).join('\n'),
  };
}

export async function pickSlice(args: {
  snippet: string;
  reportTypeDef: ReportTypeDef;
  geminiCall: GeminiCall;
}): Promise<SampleReportSlice> {
  const { snippet, reportTypeDef: def, geminiCall } = args;
  const lines = snippet.split('\n');
  if (lines.length <= 40) {
    return {
      startLine: 1,
      endLine: lines.length,
      reason: 'Snippet is short enough to review in full.',
      code: snippet,
    };
  }

  try {
    const raw = await geminiCall({
      model: 'gemini-2.5-flash',
      max_tokens: 200,
      system: SLICE_PICKER_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Review focus: ${def.title}\nFocus detail: ${def.focus}\n\nC++ snippet (line-numbered):\n${lines
            .map((l, i) => `${i + 1}: ${l}`)
            .join('\n')}`,
        },
      ],
    });

    const parsed = JSON.parse(stripJsonFences(raw)) as {
      startLine?: number;
      endLine?: number;
      reason?: string;
    };
    const startLine = Math.max(1, Math.floor(parsed.startLine ?? 1));
    const endLine = Math.min(lines.length, Math.floor(parsed.endLine ?? startLine + 30));
    if (endLine < startLine) throw new Error('Invalid slice range');
    return {
      startLine,
      endLine,
      reason: parsed.reason ?? 'Selected by the agent.',
      code: lines.slice(startLine - 1, endLine).join('\n'),
    };
  } catch (err) {
    console.warn('Slice picker failed, falling back:', err);
    return pickSliceFallback(snippet);
  }
}
