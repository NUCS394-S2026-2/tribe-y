# Payment handshake

Step-by-step protocol for calling `reviewFull`.

## 0. Prerequisites

- A funded Solana devnet wallet. See [Wallet setup](/docs/wallet-setup).
- The agent's wallet address and required amount. These are published on the [Agent card](/docs/agent-card); the canonical values today are:
  - Recipient: `2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp`
  - Amount: `1_000_000` lamports (`0.001` SOL)
  - Network: `solana-devnet`

## 1. Initial call (no `X-Payment`)

```http
POST /rpc HTTP/1.1
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "reviewFull",
  "params": { "code": "...", "reportType": "memory" }
}
```

## 2. 402 response

The server returns **HTTP 402** with the quote in the body:

```json
{
  "amount": 1000000,
  "currency": "SOL_LAMPORTS",
  "network": "solana-devnet",
  "recipient": "2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp",
  "expiresAt": "2026-05-29T18:05:00.000Z",
  "nonce": "d4f9e5b0-1bb7-4d5d-9af1-b3ad8b5cb1ad",
  "reason": "X-Payment header missing"
}
```

Note this is **not** a JSON-RPC envelope. The 402 body is an x402 quote document at the HTTP layer.

## 3. Sign and broadcast a SOL transfer

Construct a single `SystemProgram.transfer` instruction:

```ts
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
const tx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: new PublicKey('2vCfh5Cia6iwb7uBfrWeXaG6UtvTzV6kzzH5XCfAVmZp'),
    lamports: 1_000_000,
  }),
);
const signature = await sendAndConfirmTransaction(conn, tx, [payer], {
  commitment: 'confirmed',
});
```

Use `commitment: 'confirmed'` — the server verifies at the same level, so requiring `'finalized'` on the client side just makes the retry slower.

## 4. Retry with `X-Payment`

```http
POST /rpc HTTP/1.1
Content-Type: application/json
X-Payment: 5tQwc...Solana...Signature...Base58...

{ /* same JSON-RPC body as step 1 */ }
```

The server runs the same verification, claims the signature, and returns the JSON-RPC success envelope with the full review.

## What the server checks

`verifyPayment` runs five checks against the on-chain transaction. The first failing check determines the 402 `reason`:

1. **Confirmed.** The transaction is fetched at `'confirmed'` commitment with a bounded retry (6 attempts × 1.5s) to absorb RPC propagation lag. Failure → `tx not confirmed`.
2. **Is a SOL transfer.** The transaction contains a `SystemProgram.transfer` instruction. Failure → `tx is not a SOL transfer`.
3. **Recipient matches.** Transfer `toPubkey` equals the agent's wallet. Failure → `recipient mismatch`.
4. **Amount sufficient.** Transfer `lamports >= 1_000_000`. Overpaying is fine. Failure → `amount too low`.
5. **Not stale.** Transaction `blockTime` is within the last 5 minutes. Failure → `tx is stale`.

If verification passes, `claimPayment` runs a Firestore transaction against `usedPayments/{signature}`:

6. **Replay protection.** If the signature has already been used for a successful call, the new request gets back a fresh 402 with `reason: 'payment already consumed'`. Otherwise the signature is recorded and the call proceeds.

## Retry semantics

- A 402 response is **safe to retry** — no chain state has changed.
- A signature that has been _verified but not yet claimed_ (because the request was interrupted between steps 5 and 6) can be retried; the claim is idempotent on the signature.
- A signature that has been _successfully claimed_ is permanently spent. Send a new transaction to make a new call.

## Reference implementation

See `functions/scripts/a2a-client.ts` for a minimal end-to-end client and `src/payment/PaymentPage.tsx` / `src/wallet/` for the React wallet-adapter flow used by the chat UI.
