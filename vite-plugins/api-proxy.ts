import type { IncomingMessage, ServerResponse } from 'node:http';

import { extractAssistantText } from '../src/shared/claudeResponse';
import { FULL_SYSTEM } from '../src/shared/codeReviewPrompts';

const ANTHROPIC_VERSION = '2023-06-01';
const FIRESTORE_PROJECT_ID = 'tribe-y';

type FirestoreFields = Record<string, { stringValue?: string }>;

/** Env injected from vite.config via loadEnv — process.env alone often misses .env in middleware. */
export type ApiProxyLoadedEnv = {
  ANTHROPIC_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
};

function envOrUndefined(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function createReadEnv(loaded: ApiProxyLoadedEnv) {
  return (): {
    anthropicKey: string | undefined;
    firebaseWebApiKey: string | undefined;
  } => ({
    anthropicKey:
      envOrUndefined(loaded.ANTHROPIC_API_KEY) ??
      envOrUndefined(process.env.ANTHROPIC_API_KEY),
    firebaseWebApiKey:
      envOrUndefined(loaded.VITE_FIREBASE_API_KEY) ??
      envOrUndefined(process.env.VITE_FIREBASE_API_KEY),
  });
}

function firestoreString(
  fields: FirestoreFields | undefined,
  key: string,
): string | null {
  const v = fields?.[key]?.stringValue;
  return v ?? null;
}

async function verifyFirebaseIdToken(
  idToken: string,
  firebaseWebApiKey: string,
): Promise<{ uid: string } | null> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseWebApiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { users?: Array<{ localId?: string }> };
  const uid = data.users?.[0]?.localId;
  return uid ? { uid } : null;
}

async function fetchCodeReviewDoc(
  idToken: string,
  reviewId: string,
): Promise<{ fields: FirestoreFields } | null> {
  const path = `projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/codeReviews/${encodeURIComponent(reviewId)}`;
  const url = `https://firestore.googleapis.com/v1/${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as { fields: FirestoreFields };
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
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function handleAnthropicMessages(
  req: IncomingMessage,
  res: ServerResponse,
  anthropicKey: string,
  firebaseWebApiKey: string,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const idToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;
  if (!idToken) {
    res.statusCode = 401;
    res.end('Authorization required');
    return;
  }
  const verified = await verifyFirebaseIdToken(idToken, firebaseWebApiKey);
  if (!verified) {
    res.statusCode = 401;
    res.end('Invalid or expired token');
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    res.statusCode = 400;
    res.end('Invalid JSON');
    return;
  }

  try {
    const data = await callAnthropic(anthropicKey, body);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 502;
    res.end(e instanceof Error ? e.message : 'Anthropic request failed');
  }
}

async function handleFullCodeReview(
  req: IncomingMessage,
  res: ServerResponse,
  anthropicKey: string,
  firebaseWebApiKey: string,
): Promise<void> {
  const authHeader = req.headers.authorization;
  const idToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  let reviewId: string;
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      reviewId?: string;
    };
    reviewId = typeof parsed.reviewId === 'string' ? parsed.reviewId : '';
  } catch {
    res.statusCode = 400;
    res.end('Invalid JSON');
    return;
  }

  if (!idToken || !reviewId) {
    res.statusCode = 401;
    res.end('Authorization and reviewId required');
    return;
  }

  const verified = await verifyFirebaseIdToken(idToken, firebaseWebApiKey);
  if (!verified) {
    res.statusCode = 401;
    res.end('Invalid or expired token');
    return;
  }

  const doc = await fetchCodeReviewDoc(idToken, reviewId);
  if (!doc?.fields) {
    res.statusCode = 404;
    res.end('Review not found');
    return;
  }

  const ownerUid = firestoreString(doc.fields, 'uid');
  if (ownerUid !== verified.uid) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const paymentStatus = firestoreString(doc.fields, 'paymentStatus');
  if (paymentStatus !== 'paid') {
    res.statusCode = 402;
    res.end('Payment required');
    return;
  }

  const snippet = firestoreString(doc.fields, 'snippet');
  if (!snippet) {
    res.statusCode = 400;
    res.end('Missing snippet');
    return;
  }

  try {
    const data = await callAnthropic(anthropicKey, {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: FULL_SYSTEM,
      messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
    });
    const fullReview = extractAssistantText(data);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ fullReview }));
  } catch (e) {
    res.statusCode = 502;
    res.end(e instanceof Error ? e.message : 'Anthropic request failed');
  }
}

function installApiProxy(
  server: { use: (...args: unknown[]) => void },
  readEnv: () => {
    anthropicKey: string | undefined;
    firebaseWebApiKey: string | undefined;
  },
): void {
  server.use(
    async (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void,
    ): Promise<void> => {
      const url = req.url ?? '';
      if (req.method === 'POST' && url.startsWith('/api/anthropic/v1/messages')) {
        const { anthropicKey, firebaseWebApiKey } = readEnv();
        if (!anthropicKey || !firebaseWebApiKey) {
          res.statusCode = 503;
          res.end('Server API keys are not configured');
          return;
        }
        await handleAnthropicMessages(req, res, anthropicKey, firebaseWebApiKey);
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/code-review/full')) {
        const { anthropicKey, firebaseWebApiKey } = readEnv();
        if (!anthropicKey || !firebaseWebApiKey) {
          res.statusCode = 503;
          res.end('Server API keys are not configured');
          return;
        }
        await handleFullCodeReview(req, res, anthropicKey, firebaseWebApiKey);
        return;
      }

      next();
    },
  );
}

export function apiProxyPlugin(loadedEnv: ApiProxyLoadedEnv = {}) {
  const readEnv = createReadEnv(loadedEnv);
  return {
    name: 'api-proxy',
    configureServer(server: { middlewares: { use: (...args: unknown[]) => void } }) {
      installApiProxy(server.middlewares, readEnv);
    },
    configurePreviewServer(server: {
      middlewares: { use: (...args: unknown[]) => void };
    }) {
      installApiProxy(server.middlewares, readEnv);
    },
  };
}
