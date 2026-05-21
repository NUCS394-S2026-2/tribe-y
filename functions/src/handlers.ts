import type { Request, Response } from 'express';

import { FULL_SYSTEM } from './codeReviewPrompts';

const ANTHROPIC_VERSION = '2023-06-01';
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

async function callAnthropic(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function extractAssistantText(data: unknown): string {
  const d = data as { content?: Array<{ type: string; text?: string }> };
  const first = d.content?.[0];
  return first?.type === 'text' ? (first.text ?? '') : '';
}

export async function handleAnthropicMessages(
  req: Request,
  res: Response,
  anthropicKey: string,
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
    res
      .status(200)
      .json(await callAnthropic(anthropicKey, req.body as Record<string, unknown>));
  } catch (e) {
    res.status(502).send(e instanceof Error ? e.message : 'Anthropic request failed');
  }
}

export async function handleFullCodeReview(
  req: Request,
  res: Response,
  anthropicKey: string,
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
    const data = await callAnthropic(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: FULL_SYSTEM,
      messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
    });
    res.status(200).json({ fullReview: extractAssistantText(data) });
  } catch (e) {
    res.status(502).send(e instanceof Error ? e.message : 'Anthropic request failed');
  }
}
