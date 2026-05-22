import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

import { verifyAuth } from './middleware/verifyAuth.js';

const googleAiApiKey = defineSecret('GOOGLE_AI_API_KEY');

const ALLOWED_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
const MAX_TOKENS_CAP = 2000;

export const geminiMessages = onRequest(
  { cors: true, secrets: [googleAiApiKey] },
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

    const generationConfig = body.generationConfig as
      | { maxOutputTokens?: unknown }
      | undefined;
    const maxTokens = generationConfig?.maxOutputTokens;
    if (typeof maxTokens !== 'number' || maxTokens > MAX_TOKENS_CAP || maxTokens < 1) {
      res
        .status(400)
        .send(`generationConfig.maxOutputTokens must be between 1 and ${MAX_TOKENS_CAP}`);
      return;
    }

    const apiKey = googleAiApiKey.value();
    if (!apiKey) {
      res.status(503).send('GOOGLE_AI_API_KEY is not configured');
      return;
    }

    const { model: _omit, ...rest } = body;
    void _omit;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        res.status(502).send(errText || 'Gemini request failed');
        return;
      }

      const data = await geminiRes.json();
      res.status(200).json(data);
    } catch (e) {
      res.status(502).send(e instanceof Error ? e.message : 'Gemini request failed');
    }
  },
);
