import type { GeminiCallRequest } from './brain/types.js';

/**
 * Server-side Gemini caller used by the A2A review method. Mirrors the
 * shape `geminiClient.ts` uses on the client but calls the public Google
 * Generative Language API directly (no Firebase auth in the request path —
 * the API key lives in a Cloud Function secret).
 *
 * Forces `responseMimeType: 'application/json'` on every call. Both the
 * slice picker and the review prompt instruct Gemini to return JSON, but
 * Gemini occasionally responds with prose anyway — especially on trivial
 * snippets where the model wants to say "nothing to review here". Forcing
 * JSON mode at the API level makes that failure mode impossible: Gemini
 * will return a JSON object (possibly with an empty findings array) or
 * an HTTP error, but not freeform text.
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
      generationConfig: {
        maxOutputTokens: req.max_tokens,
        responseMimeType: 'application/json',
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      req.model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Gemini's gateway occasionally returns 5xx (502/503/504) when it's
    // briefly overloaded. The errors are transient — the page literally
    // says "try again in 30 seconds" — so retry with backoff before
    // surfacing the failure to the caller. 429 rate-limits get the same
    // treatment. Anything else (400 invalid request, 401 bad key, etc.)
    // we propagate immediately because retrying won't help.
    const maxAttempts = 3;
    const baseDelayMs = 2000;

    let lastError = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (e) {
        // Network-level failure (DNS, connection reset, etc.) — also retry.
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
          continue;
        }
        throw new Error(
          `Gemini network error after ${maxAttempts} attempts: ${lastError}`,
        );
      }

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        return parts
          .map((p) => p.text ?? '')
          .join('')
          .trim();
      }

      const retriable = res.status >= 500 || res.status === 429;
      const detail = await res.text();
      lastError = detail || `Gemini API error: ${res.status}`;

      if (!retriable || attempt === maxAttempts) {
        throw new Error(lastError);
      }
      console.warn(
        `[gemini] ${res.status} on attempt ${attempt}/${maxAttempts}; retrying in ${baseDelayMs * attempt}ms`,
      );
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }

    // Unreachable, but TypeScript needs the explicit throw.
    throw new Error(lastError || 'Gemini retry loop exhausted');
  };
}
