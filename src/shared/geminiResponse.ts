/** Extracts the first text part from a Google Gemini generateContent response. */
export function extractAssistantText(data: unknown): string {
  const d = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = d.candidates?.[0]?.content?.parts;
  if (!parts) return '';
  return parts
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}
