import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

import { verifyAuth } from './middleware/verifyAuth.js';

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

const ANTHROPIC_VERSION = '2023-06-01';
const ALLOWED_MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
const MAX_TOKENS_CAP = 2000;

export const anthropicMessages = onRequest(
  { cors: true, secrets: [anthropicApiKey] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const verified = await verifyAuth(req.headers.authorization);
    if (!verified) {
      res.status(401).send('Invalid or missing authentication token');
      return;
    }

    const body = req.body as Record<string, unknown>;
    const model = body.model;
    if (typeof model !== 'string' || !ALLOWED_MODELS.includes(model)) {
      res.status(400).send(`Model must be one of: ${ALLOWED_MODELS.join(', ')}`);
      return;
    }

    const maxTokens = body.max_tokens;
    if (typeof maxTokens !== 'number' || maxTokens > MAX_TOKENS_CAP || maxTokens < 1) {
      res.status(400).send(`max_tokens must be between 1 and ${MAX_TOKENS_CAP}`);
      return;
    }

    const apiKey = anthropicApiKey.value();
    if (!apiKey) {
      res.status(503).send('ANTHROPIC_API_KEY is not configured');
      return;
    }

    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        res.status(502).send(errText || 'Anthropic request failed');
        return;
      }

      const data = await anthropicRes.json();
      res.status(200).json(data);
    } catch (e) {
      res.status(502).send(e instanceof Error ? e.message : 'Anthropic request failed');
    }
  },
);
