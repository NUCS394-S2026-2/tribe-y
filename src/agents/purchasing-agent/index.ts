/**
 * Purchasing Agent — public surface.
 *
 * Consumers (e.g. Payment Page UI, Sales Agent) should import only
 * from this module, never from internal files like `./submitPurchase`
 * or `./validation` directly. This keeps the Yellow → Orange boundary
 * (per `docs/agent/architecture.md`) clean and refactor-safe.
 */

export { submitPurchase } from './submitPurchase';
export type { PurchaseErrorCode, PurchaseRequest, PurchaseResponse } from './types';
export { isValidWalletAddress, isZipFile } from './validation';
