import { defineSecret } from 'firebase-functions/params';

// `defineSecret` returns a SecretParam whose declared type lives under a
// non-portable path; annotate as `ReturnType<typeof defineSecret>` to keep
// the inferred type local and portable.
type ReviewerSecret = ReturnType<typeof defineSecret>;

/**
 * Public address of the reviewer's Solana devnet wallet.
 *
 * TODO: replace with the real devnet keypair public key generated per the README
 * (see ./README.md). Currently this is the Solana System Program address, used as
 * a safe placeholder so the code compiles and PR 6 can swap in the real one.
 */
export const REVIEWER_WALLET_ADDRESS: string = '11111111111111111111111111111112';

/**
 * The Solana network the reviewer wallet operates on.
 */
export const REVIEWER_NETWORK: 'solana-devnet' = 'solana-devnet';

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
