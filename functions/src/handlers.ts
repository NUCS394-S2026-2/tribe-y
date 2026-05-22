import type { Request, Response } from 'express';

import { FULL_SYSTEM } from './codeReviewPrompts';

const FIRESTORE_PROJECT_ID = 'tribe-y';

function bearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  return typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

async function verifyFirebaseIdToken(
  idToken: string,
  firebaseWebApiKey: string,
): Promise<boolean> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { users?: unknown[] };
  return (data.users?.length ?? 0) > 0;
}

async function callGemini(
  apiKey: string,
  model: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function extractAssistantText(data: unknown): string {
  const d = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const parts = d.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

export async function handleGeminiMessages(
  req: Request,
  res: Response,
  googleApiKey: string,
  firebaseWebApiKey: string,
): Promise<void> {
  const idToken = bearerToken(req);
  if (!idToken) {
    res.status(401).send('Authorization required');
    return;
  }
  if (!(await verifyFirebaseIdToken(idToken, firebaseWebApiKey))) {
    res.status(401).send('Invalid or expired token');
    return;
  }
  try {
    const body = req.body as Record<string, unknown>;
    const model = typeof body.model === 'string' ? body.model : 'gemini-2.5-flash';
    const { model: _omit, ...rest } = body;
    void _omit;
    res.status(200).json(await callGemini(googleApiKey, model, rest));
  } catch (e) {
    res.status(502).send(e instanceof Error ? e.message : 'Gemini request failed');
  }
}

export async function handleFullCodeReview(
  req: Request,
  res: Response,
  googleApiKey: string,
  firebaseWebApiKey: string,
): Promise<void> {
  const idToken = bearerToken(req);
  const reviewId = typeof req.body?.reviewId === 'string' ? req.body.reviewId : '';
  if (!idToken || !reviewId) {
    res.status(401).send('Authorization and reviewId required');
    return;
  }
  if (!(await verifyFirebaseIdToken(idToken, firebaseWebApiKey))) {
    res.status(401).send('Invalid or expired token');
    return;
  }

  const docRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/codeReviews/${encodeURIComponent(reviewId)}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  );
  if (!docRes.ok) {
    res.status(404).send('Review not found');
    return;
  }

  const doc = (await docRes.json()) as {
    fields?: Record<string, { stringValue?: string }>;
  };
  const fields = doc.fields;

  if (fields?.paymentStatus?.stringValue !== 'paid') {
    res.status(402).send('Payment required');
    return;
  }
  const snippet = fields?.snippet?.stringValue;
  if (!snippet) {
    res.status(400).send('Missing snippet');
    return;
  }

  try {
    const data = await callGemini(googleApiKey, 'gemini-2.5-flash', {
      systemInstruction: { parts: [{ text: FULL_SYSTEM }] },
      contents: [
        { role: 'user', parts: [{ text: `Review this C++ code:\n\n${snippet}` }] },
      ],
      generationConfig: { maxOutputTokens: 2000 },
    });
    res.status(200).json({ fullReview: extractAssistantText(data) });
  } catch (e) {
    res.status(502).send(e instanceof Error ? e.message : 'Gemini request failed');
  }
}
