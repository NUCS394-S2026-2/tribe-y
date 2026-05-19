/** Extracts the first text block from an Anthropic Messages API response. */
export function extractAssistantText(data: unknown): string {
  const d = data as { content?: Array<{ type: string; text?: string }> };
  const first = d.content?.[0];
  return first?.type === 'text' ? (first.text ?? '') : '';
}
