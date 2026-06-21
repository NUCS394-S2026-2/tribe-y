# compass.tne.ai

An AI-powered technical due-diligence assistant for M&A managers and senior engineers evaluating software companies. compass.tne.ai analyzes C++ codebases, returns a free teaser review, and unlocks a full annotated report after an X.402 crypto micropayment (Solana devnet).

---

## What the app does

The entire user journey runs through `/chat`. The other routes are explanatory pages — they describe the protocol, the methodology, and a sample report, but the user does not need to visit them to get a review.

| Step          | What happens                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Land       | User arrives at `/` and clicks through to the chat.                                                                                                                                                                            |
| 2. Chat input | At `/chat`, the user pastes C++ or asks an English question. A heuristic classifier in `src/chat/orchestrator/routeMessage.ts` routes each message to either the **Sales Agent** or the **Code Review (Reviewer) Agent**.      |
| 3. Teaser     | The Reviewer Agent (`src/agents/reviewerClient.ts`, backed by `functions/src/reviewer/`) returns a free partial review.                                                                                                        |
| 4. Pay        | Still inside `/chat`, the user connects a Solana wallet via `WalletConnectButton` (Phantom / Solflare) and pays the X.402 quote on Solana devnet. The server returns HTTP 402 with a signed payment intent until the tx lands. |
| 5. Unlock     | Cloud Functions verify the finalized transaction on-chain, flip the review to `paid` in Firestore, and return the full report (downloadable PDF + cryptographic vault receipt) back into the chat.                             |

### Other routes

| Route                  | Purpose                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Marketing landing page.                                                                                                           |
| `/sample`              | Static sample audit report — shown to convince visitors before they try the chat.                                                 |
| `/financial-standards` | Explainer page describing the X.402 / HTTP 402 micropayment protocol in five steps.                                               |
| `/risk-metrics`        | Explainer page describing the M&A valuation adjustments tied to review scores.                                                    |
| `/docs`, `/docs/:slug` | In-app API docs for peers integrating the agent (A2A discovery, JSON-RPC, wallet setup). Markdown sources in `src/docs/content/`. |

### Architecture at a glance

- **React 19 SPA** with `react-router-dom` (routes in `src/App.tsx`).
- **Chat orchestrator** (`src/chat/orchestrator/`) owns in-memory session state, runs the routing classifier, and dispatches to stateless agent services in `src/agents/`.
- **Solana wallet adapter** (`src/wallet/`) — Phantom + Solflare adapters wrapped in a `WalletShell` that is lazy-loaded so the wallet bundle is not shipped on initial page load.
- **Firebase** — Auth, Firestore (`firestore.rules`), and Cloud Functions in `functions/src/reviewer/` that proxy Gemini, gate full reviews on payment status (HTTP 402 when unpaid via `x402Middleware.ts`), verify Solana payments (`verifyPayment.ts`), and serve the agent card / JSON-RPC endpoint.

---

## Toolchain

- Node.js `22+`
- npm `10+`
- React `19.2`, TypeScript `5.9`, Vite `8.0`, Vitest `4.1`, ESLint `9.39`
- Firebase (Auth, Firestore, Functions, Hosting)
- Solana web3.js + wallet-adapter (devnet)

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/NUCS394-S2026-2/tribe-y.git
cd tribe-y
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` (Vite loads `.env.local` automatically):

```bash
cp .env.example .env.local
```

| Variable                                         | Scope            | Where it comes from                                                                                                                                                                       |
| ------------------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Client (browser) | Firebase console → Project settings → Your apps (web app config).                                                                                                                         |
| `GOOGLE_AI_API_KEY`                              | Vite dev proxy   | Google AI Studio. Read by the Vite dev plugin in `vite-plugins/api-proxy.ts` to proxy Gemini calls during `npm run dev`. **Do not** prefix with `VITE_` — keeps it off the client bundle. |

For deployed Cloud Functions, **do not** use `.env.local`. The secrets `GOOGLE_AI_API_KEY` and `REVIEWER_WALLET_SECRET_KEY` are declared via `defineSecret(...)` in `functions/src/`, so set them with the Firebase CLI:

```bash
firebase functions:secrets:set GOOGLE_AI_API_KEY
firebase functions:secrets:set REVIEWER_WALLET_SECRET_KEY
```

> If a key was ever committed or pasted into a public surface, rotate it before continuing.

### 3. (Optional) Firebase Functions and emulator

The Cloud Functions in `functions/` serve the agent's JSON-RPC endpoint, Gemini proxy, agent card, and payment verification. To run them locally:

```bash
cd functions && npm install && cd ..
npx firebase emulators:start
```

Requires the Firebase CLI (`npm i -g firebase-tools`) and a project linked via `firebase use <project-id>` (`.firebaserc` currently points at `tribe-y`).

### 4. (Optional) Solana devnet wallet

End users connect their own Phantom or Solflare wallet (set to **devnet**) inside `/chat` when they reach the paywall. Fund a test wallet from the [Solana devnet faucet](https://faucet.solana.com/).

If you are operating the reviewer side, the reviewer's payout wallet address is hard-coded in `functions/src/reviewer/wallet.ts`; the matching secret key (`reviewer-devnet.json`) is **gitignored** and must be generated separately. See `functions/src/reviewer/README.md` for details.

---

## Running the app

| Command                 | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Vite dev server with the local Gemini proxy plugin. |
| `npm run build`         | TypeScript check + production build into `dist/`.   |
| `npm run serve`         | Preview the production build.                       |
| `npm run type-check`    | `tsc` without emit.                                 |
| `npm run lint`          | Prettier + ESLint across the repo.                  |
| `npm test`              | Vitest in watch mode.                               |
| `npm test -- --run`     | Vitest one-shot.                                    |
| `npm run test:ui`       | Vitest visual UI on `127.0.0.1:51204`.              |
| `npm run test:coverage` | Vitest + V8 coverage (70% thresholds).              |

---

## Deploying

Hosting is configured for Firebase in `firebase.json`. A typical deploy:

```bash
npm run build
npx firebase deploy --only hosting,functions,firestore:rules
```

The `.firebase/` cache directory tracks the last deployed artifact; do not edit it by hand.

---

## Repository layout

```
src/
  agents/              Stateless agent services (sales agent, reviewer client)
  chat/                CompassChat surface + orchestrator (routing, session)
  components/
    landing-page/         / route
    hero-section/         Landing-page sections
    value-pillars/
    cta-section/
    report-card/
    top-nav-bar/
    footer/
    sample-audit/         /sample — static sample report
    risk-metrics/         /risk-metrics — valuation methodology explainer
    x402-payment-flow/    /financial-standards — X.402 protocol explainer
    scroll-to-top/
  docs/                In-app API docs viewer (markdown in docs/content/)
  shared/              Firebase init, routing classifier, hooks, types, styles
  wallet/              Solana wallet shell (lazy-loaded), connect button, pay quote
functions/src/
  geminiMessages.ts    HTTP Gemini proxy
  middleware/          Auth verification
  reviewer/            JSON-RPC endpoint, agent card, x402 middleware, payment verification, PDF generation
vite-plugins/api-proxy.ts  Dev-only Gemini proxy plugin (mirrors the deployed function)
```

---

## Testing notes

Tests live alongside source files (`src/app.test.tsx` tests `src/App.tsx`). Configured in `vite.config.ts`: jsdom, globals enabled, setup at `src/test/setup.ts`, V8 coverage with 70% thresholds. Prefer queries in this priority order: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByAltText`.

`npm audit` currently reports GHSA-rf6f-7fwh-wjgh via `flatted` (a transitive dev dependency of `@vitest/ui`). It is dev-only.
