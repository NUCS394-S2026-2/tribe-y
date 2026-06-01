import { getFirebaseIdToken } from './firebase';
import { extractAssistantText } from './geminiResponse';

/** Calls Gemini through the dev/preview API proxy — never uses an API key in the browser. */
export async function createGeminiMessage(params: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  responseMimeType?: 'application/json' | 'text/plain';
}): Promise<string> {
  const idToken = await getFirebaseIdToken();

  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: params.max_tokens,
  };
  if (params.responseMimeType) {
    generationConfig.responseMimeType = params.responseMimeType;
  }

  const body = {
    model: params.model,
    systemInstruction: { parts: [{ text: params.system }] },
    contents: params.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig,
  };

  const res = await fetch('/api/gemini/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Gemini API error: ${res.status}`);
  }

  return extractAssistantText(await res.json());
}
