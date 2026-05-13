/**
 * Validation utilities for Purchasing Agent inputs.
 *
 * These are pure functions exported separately so the Payment Page UI
 * can run the same validation client-side (for immediate feedback)
 * that the agent uses (as a safety net).
 */

/**
 * EVM wallet address: `0x` followed by exactly 40 hexadecimal characters.
 *
 * Examples:
 *   - Valid:   0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
 *   - Invalid: 742d35Cc6634C0532925a3b844Bc9e7595f0bEb1  (no 0x prefix)
 *   - Invalid: 0x742d35  (too short)
 *   - Invalid: 0xZZZZ... (non-hex chars)
 */
const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

/**
 * MIME types accepted for the uploaded archive.
 *
 * `application/zip` is the standard; `application/x-zip-compressed`
 * is what some Windows browsers report; empty string is what some
 * browsers report when the OS has no MIME mapping but the file
 * extension is `.zip`. We allow all three and additionally check the
 * filename extension as a fallback.
 */
const ALLOWED_ZIP_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  '',
]);

export function isValidWalletAddress(value: string): boolean {
  return EVM_ADDRESS_PATTERN.test(value);
}

export function isZipFile(file: { name: string; mimeType: string }): boolean {
  if (ALLOWED_ZIP_MIME_TYPES.has(file.mimeType)) {
    return file.name.toLowerCase().endsWith('.zip');
  }
  return false;
}
