import type { PurchaseErrorCode, PurchaseRequest, PurchaseResponse } from './types';
import { isValidWalletAddress, isZipFile } from './validation';

/**
 * Simulated network/processing delay for the success path, in
 * milliseconds. Exposed for tests that need to override or fake
 * timers; not part of the public API.
 *
 * @internal
 */
export const STUB_PROCESSING_DELAY_MS = 2000;

/**
 * Stub Purchasing Agent.
 *
 * Validates the request synchronously. If invalid, returns an error
 * response immediately (no delay). If valid, simulates a ~2s
 * processing delay and returns a hardcoded success response with a
 * fake vault URL.
 *
 * Real Stripe checkout and x402 authorization are out of scope for
 * this slice; see SLICE-06.
 */
export async function submitPurchase(req: PurchaseRequest): Promise<PurchaseResponse> {
  const validationError = validate(req);
  if (validationError !== null) {
    return validationError;
  }

  await delay(STUB_PROCESSING_DELAY_MS);

  return {
    status: 'success',
    vaultUrl: buildFakeVaultUrl(),
    transactionId: buildFakeTransactionId(),
  };
}

function validate(req: PurchaseRequest): PurchaseResponse | null {
  if (!req.file || !req.file.name) {
    return errorResponse('MISSING_FILE', 'A code archive must be uploaded.');
  }
  if (!isValidWalletAddress(req.walletAddress)) {
    return errorResponse(
      'INVALID_WALLET',
      'Wallet address must be an EVM-format address (0x followed by 40 hex characters).',
    );
  }
  if (!isZipFile(req.file)) {
    return errorResponse('UNSUPPORTED_FILE_TYPE', 'Only .zip archives are accepted.');
  }
  return null;
}

function errorResponse(errorCode: PurchaseErrorCode, message: string): PurchaseResponse {
  return { status: 'error', errorCode, message };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFakeVaultUrl(): string {
  const id = crypto.randomUUID();
  return `https://vault.compass.tne.ai/receipts/${id}`;
}

function buildFakeTransactionId(): string {
  const id = crypto.randomUUID();
  return `txn_stub_${id.slice(0, 12)}`;
}
