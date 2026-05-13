/**
 * Purchasing Agent contract types.
 *
 * These types define the public I/O surface for the Purchasing Agent.
 * The Payment Page UI (Yellow team) consumes these types when calling
 * `submitPurchase`. The implementation (Orange team) must conform to
 * this contract.
 *
 * NOTE: These types will move to `src/shared/contracts/` once SETUP-01
 * kickoff finalizes the canonical contract location. Until then, this
 * file is the source of truth.
 */

/**
 * Input to the Purchasing Agent.
 *
 * - `walletAddress` must be an EVM-format address (`0x` + 40 hex chars).
 * - `file` is a lightweight descriptor of the uploaded archive. The
 *   full File/Blob is not passed across this boundary; only metadata
 *   needed for validation is included.
 */
export interface PurchaseRequest {
  walletAddress: string;
  file: {
    name: string;
    sizeBytes: number;
    mimeType: string;
  };
}

/**
 * Output from the Purchasing Agent. Discriminated by `status`.
 *
 * On success, returns the vault URL where the completed code review
 * will be retrievable, and a transaction ID for receipt tracking.
 *
 * On error, returns a machine-readable error code and a
 * human-readable message suitable for direct display in the UI.
 */
export type PurchaseResponse =
  | {
      status: 'success';
      vaultUrl: string;
      transactionId: string;
    }
  | {
      status: 'error';
      errorCode: PurchaseErrorCode;
      message: string;
    };

/**
 * Machine-readable error codes from the Purchasing Agent.
 *
 * Callers should branch on `errorCode`, not on `message`, since
 * messages may be localized or reworded in the future.
 */
export type PurchaseErrorCode =
  | 'INVALID_WALLET'
  | 'MISSING_FILE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'INTERNAL_ERROR';
