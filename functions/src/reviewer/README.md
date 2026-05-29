# Reviewer payment verification

This directory holds the Solana plumbing used by the code-review agent's
x402 payment gate.

- `wallet.ts` — constants (network, RPC URL, wallet address) and the secret
  binding for the reviewer's Solana keypair.
- `verifyPayment.ts` — `verifyPayment()` checks an on-chain SOL transfer
  meets the expected recipient/amount/recency; `claimPayment()` provides
  one-time replay protection via Firestore.
- `*.test.ts` — Vitest tests. Run with `npm test` from `functions/`.

## Generating the devnet reviewer keypair

This is the one-time operator step that produces the wallet referenced by
`REVIEWER_WALLET_ADDRESS` in `wallet.ts`.

```sh
# 1. Generate a new keypair (writes both the secret key and prints the
#    public key). The secret key MUST NOT be committed to the repo.
solana-keygen new --outfile reviewer-devnet.json --no-bip39-passphrase

# 2. Read back the public key (also printed by the command above):
solana-keygen pubkey reviewer-devnet.json

# 3. Airdrop some devnet SOL to it so it shows up on-chain:
solana airdrop 2 <REVIEWER_WALLET_ADDRESS> --url devnet
```

## Wiring the keypair into the codebase

1. Copy the printed public key string into `wallet.ts` as
   `REVIEWER_WALLET_ADDRESS`, replacing the placeholder
   `'11111111111111111111111111111112'` (the Solana System Program address)
   currently stubbed in.
2. Configure the secret key with Cloud Functions:

   ```sh
   # From the repo root:
   firebase functions:secrets:set REVIEWER_WALLET_SECRET_KEY
   # Paste the contents of reviewer-devnet.json (the JSON array of bytes)
   # when prompted.
   ```

   `wallet.ts` already declares `reviewerWalletSecret =
defineSecret('REVIEWER_WALLET_SECRET_KEY')`, ready to be bound to a
   function in a later PR. Verification itself is read-only RPC and does
   not need the secret key — it is declared for future signing flows.

## Overriding the RPC URL

`SOLANA_RPC_URL` defaults to `https://api.devnet.solana.com`. Set the
`SOLANA_RPC_URL` environment variable (e.g. in `functions/.env`, or via
`firebase functions:config:set`) to point at a private RPC if rate limits
become a problem.
