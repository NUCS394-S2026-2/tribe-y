import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

import { verifyAuth } from './middleware/verifyAuth.js';

export const confirmPayment = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const verified = await verifyAuth(req.headers.authorization);
  if (!verified) {
    res.status(401).send('Invalid or missing authentication token');
    return;
  }

  const { reviewId, txnId } = req.body as {
    reviewId?: string;
    txnId?: string;
  };
  if (!reviewId || !txnId) {
    res.status(400).send('reviewId and txnId are required');
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

  // Idempotency: if already paid, return success without re-writing
  if (data.paymentStatus === 'paid') {
    res.status(200).json({ success: true, alreadyPaid: true });
    return;
  }

  // Stub validation: accept any non-empty txnId.
  // When real Solana/X402 is integrated, on-chain verification goes here.

  await docRef.update({
    paymentStatus: 'paid',
    paymentTxnId: txnId,
    updatedAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true });
});
