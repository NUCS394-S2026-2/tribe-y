# x402 overview

[x402](https://www.x402.org) is a small, open protocol for in-band machine payments over HTTP. It reuses the HTTP 402 status code — reserved since the dawn of HTTP for exactly this purpose and unused for three decades — to turn any HTTP endpoint into a paid surface, without depending on user accounts, API keys, OAuth, or webhook callbacks.

## The shape of a paid call

1. Client sends a normal request without an `X-Payment` header.
2. If the endpoint requires payment, the server replies **HTTP 402** with a JSON body — the **quote** — describing how to pay: amount, currency, network, recipient, expiry, and a nonce.
3. Client moves the funds on the chain the quote specifies (here: a SOL transfer on Solana devnet to the reviewer's wallet).
4. Client retries the **same request body** with an extra header: `X-Payment: <transaction signature>`.
5. The server verifies the on-chain transaction matches the quote (amount, recipient, recency), marks the signature as consumed for replay protection, and dispatches the method.

The protocol is intentionally minimal. It carries no SDK, no per-vendor key material, no escrow service. Any HTTP client can implement it.

## How this agent uses it

The 402 gate is only applied to **`reviewFull`**. All other methods — `listReportTypes`, `reviewSample`, and the discovery card — are free and reachable without an `X-Payment` header.

The reviewer's quote always looks the same shape (values are illustrative; the `expiresAt` and `nonce` change every quote):

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

- `amount` is in **lamports**, the smallest SOL unit. `1_000_000` lamports = `0.001` SOL.
- `currency` is the symbolic identifier `SOL_LAMPORTS`.
- `network` is fixed to `solana-devnet` for this deployment.
- `recipient` is the agent's wallet (constant; you can verify it in `functions/src/reviewer/wallet.ts`).
- `expiresAt` is informational — quotes are good for 5 minutes from issuance. The server does not actually pin a request to a specific quote; it only checks that the transaction was confirmed within the last 5 minutes (see [Payment handshake](/docs/payment-handshake)).
- `nonce` is a fresh UUID per quote. Clients may log it for observability; the server does not store quotes.
- `reason` is present on 402 responses to explain _why_ the previous attempt failed (e.g., missing header, stale tx, replay).

## Why on-chain?

A SOL transfer is the **claim**. There is no separate API to call, no key to provision, no account to register. Anyone who can sign a Solana transaction can pay. The server's job collapses to "did this signature actually move the right amount of SOL to my wallet recently, and have I not already counted it?"

Devnet is used to keep development costs at zero. The same code path can be pointed at mainnet by changing `SOLANA_RPC_URL` and the wallet address.

## Further reading

- x402 spec: [x402.org](https://www.x402.org)
- Solana docs: [solana.com/docs](https://solana.com/docs)
- Payment handshake step-by-step: [Payment handshake](/docs/payment-handshake)
- Wallet setup walkthrough: [Wallet setup](/docs/wallet-setup)
