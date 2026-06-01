import { defineSecret } from 'firebase-functions/params';

// `defineSecret` returns a SecretParam whose declared type lives under a
// non-portable path; annotate as `ReturnType<typeof defineSecret>` to keep
// the inferred type local and portable.
type ReviewerSecret = ReturnType<typeof defineSecret>;

/**
 * Public address of the reviewer's Solana devnet wallet. Payments for the
 * `reviewFull` method must be SOL transfers to this address. The matching
 * secret key lives only in the (gitignored) `reviewer-devnet.json` keypair
 * file at the repo root — never commit it. See ./README.md.
 */
export const REVIEWER_WALLET_ADDRESS: string =
  '2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp';

/**
 * The Solana network the reviewer wallet operates on.
 */
export const REVIEWER_NETWORK = 'solana-devnet' as const;

/**
 * Solana RPC URL. Defaults to public devnet endpoint; can be overridden by
 * setting the `SOLANA_RPC_URL` environment variable (e.g. for a private RPC).
 */
export const SOLANA_RPC_URL: string =
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

/**
 * Reviewer wallet secret key, configured as a Cloud Function secret.
 *
 * Declared here for future use (e.g. on-chain refunds or signing flows).
 * This PR does not consume it — verification is read-only RPC and does not
 * require the secret key.
 */
export const reviewerWalletSecret: ReviewerSecret = defineSecret(
  'REVIEWER_WALLET_SECRET_KEY',
);

/**
 * Price for the paid `reviewFull` method, in lamports (1e-9 SOL).
 * 1_000_000 lamports = 0.001 SOL on Solana devnet — matches the
 * pre-x402 stub amount used in earlier reviewer prototypes.
 *
 * Added in PR 6 (x402 gate). Consumed by `x402Middleware.ts` and
 * `agentCard.ts`.
 */
export const REVIEW_FULL_PRICE_LAMPORTS = 1_000_000;
