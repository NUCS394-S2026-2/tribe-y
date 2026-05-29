import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { confirmPayment } from './confirmPayment.js';
export { fullCodeReview } from './fullCodeReview.js';
export { geminiMessages } from './geminiMessages.js';

// A2A reviewer scaffold (PR 2). Public, unauthenticated endpoints.
export { agentCard } from './reviewer/agentCard.js';
export { reviewerRpc } from './reviewer/rpc.js';
