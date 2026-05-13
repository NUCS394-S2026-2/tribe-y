import { getFirebaseIdToken } from './firebase';

export async function createClaudeMessage(params: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  const idToken = await getFirebaseIdToken();

  const res = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.max_tokens,
      system: params.system,
      messages: params.messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Claude API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const first = data.content?.[0];
  return first?.type === 'text' ? (first.text ?? '') : '';
}
