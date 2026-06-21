# compass.tne.ai

An AI-powered technical due-diligence assistant for M&A managers and senior engineers evaluating software companies. compass.tne.ai analyzes C++ codebases, returns a free teaser review, and unlocks a full annotated report after an X.402 crypto micropayment (Solana devnet).

---

## What the app does

| Step       | Surface                    | What happens                                                                                                                                             |
| ---------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Landing | `/`                        | Marketing page describing the C++ expert agent; CTA enters chat.                                                                                         |
| 2. Chat    | `/chat`                    | Unified input. A heuristic classifier routes each message to either the **Sales Agent** (English questions) or the **Code Review Agent** (C++ snippets). |
| 3. Teaser  | `/chat`                    | Code Review Agent returns a partial review — enough to demonstrate value, with the fixes withheld.                                                       |
| 4. Payment | `/financial-standards`     | Purchasing Agent runs the X.402 flow: connect a Solana wallet (Phantom / Solflare), upload the codebase, pay on devnet.                                  |
| 5. Vault   | `/risk-metrics`, `/sample` | After payment confirmation in Firestore, the full report and Solid Vault receipt are unlocked for the owner.                                             |

### Architecture at a glance

- **React 19 SPA** with `react-router-dom` routes (`src/App.tsx`).
- **Chat orchestrator** (`src/chat/`) owns in-memory session state and dispatches to stateless agent services in `src/agents/`.
- **Routing classifier** in `src/shared/routing/` decides Sales vs. Code Review per message.
- **Firebase** (`firebase.json`, `firestore.rules`, `functions/`) provides Auth, Firestore persistence, and Cloud Functions that proxy Gemini and gate the full review on `paymentStatus === 'paid'` (HTTP 402 when unpaid).
- **Solana wallet adapter** (`src/wallet/`) is lazy-loaded so the ~660KB bundle is only pulled in when the user reaches payment.
- **X.402 micropayment** flow lives in `src/components/x402-payment-flow/`.

In-app API docs (A2A discovery, JSON-RPC, X.402 handshake, wallet setup) live at `/docs` in the running app and as markdown in `src/docs/content/`.

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
git clone <repo-url>
cd compass-tne-ai
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your own values:

```bash
cp .env.example .env.local
```

Required keys:

| Variable                                         | Where it comes from                                                                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase console → Project settings → Your apps (web app config).                                                                 |
| `GOOGLE_AI_API_KEY`                              | Google AI Studio. Server-only — used by the Vite dev proxy and by Cloud Functions to call Gemini. **Do not** prefix with `VITE_`. |
| `VITE_GOOGLE_AI_API_KEY`                         | Only set if running the client-side Gemini path directly during local dev. Treat as a dev-only secret; never commit.              |

> If you previously committed any of these keys, rotate them in the respective consoles before continuing.

### 3. (Optional) Firebase emulator + functions

The Cloud Functions in `functions/` proxy Gemini and confirm payments. To run them locally:

```bash
cd functions && npm install && cd ..
npx firebase emulators:start
```

This requires the Firebase CLI (`npm i -g firebase-tools`) and a Firebase project linked via `firebase use <project-id>`.

### 4. (Optional) Solana devnet wallet

The payment flow expects a Phantom or Solflare wallet set to **devnet**. Fund a test wallet from the [Solana devnet faucet](https://faucet.solana.com/). A reviewer-funded devnet key (`reviewer-devnet.json`) is included for evaluation scenarios — do not use it on mainnet.

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
  agents/              Stateless agent services (Sales, Code Review)
  chat/                Chat orchestrator + CompassChat surface
  components/
    landing-page/      / route
    risk-metrics/      Post-payment vault metrics
    sample-audit/      Public sample report
    x402-payment-flow/ Payment surface
    scroll-to-top/
  docs/                In-app docs viewer (markdown rendered with react-markdown)
  shared/              Types, routing classifier, Firebase hooks
  wallet/              Lazy-loaded Solana wallet shell
functions/             Firebase Cloud Functions (Gemini proxy, payment gate)
```

---

## Testing notes

Tests live alongside source files (`src/app.test.tsx` tests `src/App.tsx`). Configured in `vite.config.ts`: jsdom, globals enabled, setup at `src/test/setup.ts`, V8 coverage with 70% thresholds. Prefer queries in this priority order: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByAltText`.

`npm audit` currently reports GHSA-rf6f-7fwh-wjgh via `flatted` (a transitive dev dependency of `@vitest/ui`). It is dev-only.
