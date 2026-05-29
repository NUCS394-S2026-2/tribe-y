import type { GeminiCallRequest } from './brain/types.js';

/**
 * Server-side Gemini caller used by the A2A review method. Mirrors the
 * shape `geminiClient.ts` uses on the client but calls the public Google
 * Generative Language API directly (no Firebase auth in the request path —
 * the API key lives in a Cloud Function secret).
 */
export function createServerGeminiCall(
  apiKey: string,
): (req: GeminiCallRequest) => Promise<string> {
  return async (req: GeminiCallRequest) => {
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: req.max_tokens },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      req.model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || `Gemini API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return parts
      .map((p) => p.text ?? '')
      .join('')
      .trim();
  };
}
