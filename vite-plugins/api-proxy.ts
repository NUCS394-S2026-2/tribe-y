import type { IncomingMessage, ServerResponse } from 'node:http';

/** Env injected from vite.config via loadEnv — process.env alone often misses .env in middleware. */
export type ApiProxyLoadedEnv = {
  GOOGLE_AI_API_KEY?: string;
  VITE_FIREBASE_API_KEY?: string;
};

function envOrUndefined(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function createReadEnv(loaded: ApiProxyLoadedEnv) {
  return (): {
    googleApiKey: string | undefined;
    firebaseWebApiKey: string | undefined;
  } => ({
    googleApiKey:
      envOrUndefined(loaded.GOOGLE_AI_API_KEY) ??
      envOrUndefined(process.env.GOOGLE_AI_API_KEY) ??
      envOrUndefined(process.env.VITE_GOOGLE_AI_API_KEY),
    firebaseWebApiKey:
      envOrUndefined(loaded.VITE_FIREBASE_API_KEY) ??
      envOrUndefined(process.env.VITE_FIREBASE_API_KEY),
  });
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

async function callGemini(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const model = typeof body.model === 'string' ? body.model : 'gemini-2.5-flash';
  const { model: _omit, ...rest } = body;
  void _omit;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function handleGeminiMessages(
  req: IncomingMessage,
  res: ServerResponse,
  googleApiKey: string,
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
    const data = await callGemini(googleApiKey, body);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 502;
    res.end(e instanceof Error ? e.message : 'Gemini request failed');
  }
}

function installApiProxy(
  server: { use: (...args: unknown[]) => void },
  readEnv: () => {
    googleApiKey: string | undefined;
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
      if (req.method === 'POST' && url.startsWith('/api/gemini/v1/messages')) {
        const { googleApiKey, firebaseWebApiKey } = readEnv();
        if (!googleApiKey || !firebaseWebApiKey) {
          res.statusCode = 503;
          res.end('Server API keys are not configured');
          return;
        }
        await handleGeminiMessages(req, res, googleApiKey, firebaseWebApiKey);
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
