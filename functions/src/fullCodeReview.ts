import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

import { verifyAuth } from './middleware/verifyAuth.js';

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

const ANTHROPIC_VERSION = '2023-06-01';

const FULL_SYSTEM = `You are a C++ Expert Agent for compass.tne.ai.

Produce a FULL expert code review of the provided C++ code. This is the premium paid review — be comprehensive.

Your full review must include:
1. **Executive Summary** — overall code quality rating (1-10) and top concerns
2. **Issue Breakdown** — every bug, memory leak, undefined behavior, bad practice, with line references
3. **Refactored Code** — provide a corrected version of the full code using modern C++17/20 best practices (smart pointers, RAII, std::vector, etc.)
4. **Best Practices** — what patterns to adopt going forward

Be thorough, technical, and actionable. This is a paid expert review.`;

export const fullCodeReview = onRequest(
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

    const { reviewId } = req.body as { reviewId?: string };
    if (!reviewId) {
      res.status(400).send('reviewId is required');
      return;
    }

    const db = getFirestore();
    const docRef = db.collection('codeReviews').doc(reviewId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).send('Review not found');
      return;
    }

    const data = doc.data()!;
    if (data.uid !== verified.uid) {
      res.status(403).send('Forbidden');
      return;
    }

    if (data.paymentStatus !== 'paid') {
      res.status(402).send('Payment required');
      return;
    }

    const snippet = data.snippet;
    if (typeof snippet !== 'string' || !snippet.trim()) {
      res.status(400).send('Missing snippet');
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
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: FULL_SYSTEM,
          messages: [{ role: 'user', content: `Review this C++ code:\n\n${snippet}` }],
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        res.status(502).send(errText || 'Anthropic request failed');
        return;
      }

      const anthropicData = (await anthropicRes.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const first = anthropicData.content?.[0];
      const fullReview = first?.type === 'text' ? (first.text ?? '') : '';

      // Persist the review to Firestore so it's recoverable
      await docRef.update({
        fullReview,
        updatedAt: new Date().toISOString(),
      });

      res.status(200).json({ fullReview });
    } catch (e) {
      res.status(502).send(e instanceof Error ? e.message : 'Anthropic request failed');
    }
  },
);
