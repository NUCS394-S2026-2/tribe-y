# Wallet setup

To call `reviewFull` you need a Solana **devnet** wallet with a small amount of devnet SOL. Devnet is the free-funded test network — devnet SOL has no monetary value and cannot be exchanged for real SOL. Setup takes ~3 minutes.

## 1. Install a wallet

Either of the two majors works; the React app in this repo connects to both via `@solana/wallet-adapter`:

- **Phantom** — [phantom.app](https://phantom.app). Browser extension + mobile app. Most popular Solana wallet.
- **Solflare** — [solflare.com](https://solflare.com). Browser extension + mobile app. Lighter-weight alternative.

Install the browser extension and create a fresh wallet. **Write down the recovery phrase somewhere safe**, even though this is a throwaway test wallet — habits matter.

## 2. Switch to devnet

Both wallets default to mainnet-beta. You must explicitly switch.

**Phantom:**

1. Click the gear icon (Settings).
2. **Developer Settings** → **Testnet Mode** → toggle on.
3. In the main view, the network selector (top of the popup) now lists **Devnet**. Choose it.

**Solflare:**

1. Click the network indicator (top right of the popup).
2. Choose **Devnet**.

After switching, the wallet's address bar will show your devnet balance, which is `0 SOL` until you fund it.

## 3. Fund the wallet

You need ~`0.01` SOL to comfortably pay for several `reviewFull` calls (each costs `0.001` SOL plus a few thousand lamports of network fee).

Two ways to fund:

### a. The official faucet UI

Visit [faucet.solana.com](https://faucet.solana.com), paste your devnet address, select **Devnet**, and request `1` SOL. The site rate-limits per IP; one request is plenty.

### b. The CLI

If you have the Solana CLI installed:

```bash
solana airdrop 1 <YOUR_PUBKEY> --url https://api.devnet.solana.com
```

The CLI faucet sometimes throttles requests. Retry after 30 seconds, or fall back to the web faucet.

## 4. Verify the balance

Refresh your wallet — the balance should now show `1 SOL` (or whatever amount you airdropped). If it does not, wait ~30 seconds for the next slot to confirm, then refresh.

## 5. Use the wallet

- **From the React app:** open `/chat`, click **Connect Wallet** in the top right, approve the connection. The chat will pay for `reviewFull` automatically when you trigger a paid review.
- **From your own code:** the wallet's secret key (or its adapter) signs a `SystemProgram.transfer` for `1_000_000` lamports to the agent's published recipient. See [Payment handshake](/docs/payment-handshake) for the exact transaction shape.

## Troubleshooting

- **"Insufficient funds for fee."** Your balance is below `0.001 SOL` + ~`0.000005 SOL` network fee. Re-fund from the faucet.
- **"Invalid pubkey."** You copy-pasted with surrounding whitespace, or grabbed the mainnet address from somewhere else. Confirm you're on devnet and use the address shown in the wallet.
- **Transactions sit at "pending" forever.** Devnet occasionally has slot lag. Wait 30 seconds; if still pending, send a new transaction (the old one will eventually drop).
- **Quote says `tx is stale`.** Your transaction confirmed more than 5 minutes ago. Mint a fresh transaction and retry.
