# CompassAI

CompassAI is an AI-powered technical due diligence assistant for M&A managers evaluating C++ codebases. It provides free teaser reviews of code snippets and full paid audits gated by x402 micropayments on Solana devnet. Third-party agents can discover and invoke it via a standard A2A JSON-RPC 2.0 interface.

![Running app screenshot](./resources/2026-screenshot.png)

## Application link

- Production: https://tribe-y.web.app/
- Access: public — no credentials required for the demo.

## Repository structure

```
tribe-y-final/
├── src/                     # React 19 SPA
│   ├── agents/              # Sales agent, code review client, report types
│   ├── chat/                # Chat UI, orchestrator, message components
│   ├── components/          # Landing, payment portal, vault, page shells
│   ├── wallet/              # Solana wallet adapter + x402 payment signing
│   ├── shared/              # Firebase init, types, hooks, Gemini client
│   └── docs/                # In-app documentation viewer
├── functions/               # Firebase Cloud Functions (Node 22, separate package)
│   └── src/
│       ├── geminiMessages.ts        # Authenticated Gemini API proxy
│       └── reviewer/                # A2A JSON-RPC service + x402 gate
│           ├── agentCard.ts         # GET /.well-known/agent.json
│           ├── rpc.ts               # POST /rpc dispatcher
│           ├── x402Middleware.ts    # Payment verification (HTTP 402 flow)
│           ├── wallet.ts            # Solana config and pricing
│           ├── methods/             # listReportTypes, reviewSample, reviewFull
│           ├── brain/               # Gemini prompts, slicing, parsing
│           └── pdf/                 # PDF generation and GCS upload
├── docs/
│   ├── agent/               # Technical guides for coding agents (architecture, data model, stories)
│   └── tribe/               # Team process docs (practices, backlog, conventions)
├── .env.example             # Template for .env.local — copy and fill in before running
├── firebase.json            # Hosting rewrites, Functions source, Firestore/Storage config
├── .firebaserc              # Default Firebase project: tribe-y
├── firestore.rules          # Security rules for users, codeReviews, transactions collections
├── firestore.indexes.json   # Composite indexes (uid + createdAt)
├── storage.rules            # Default-deny GCS rules (PDFs served via signed URLs)
├── vite.config.ts           # Build config + dev proxy to Functions emulator
├── vite-plugins/api-proxy.ts# Dev middleware for /api/gemini/* and /rpc
├── AGENTS.md                # Canonical agent brief — read this before editing code
└── CLAUDE.md                # Claude Code–specific guidance
```

## Projects in this repo

### 1. React SPA (`src/`)

The browser application built with React 19, TypeScript 5.9, Vite 8, and Tailwind CSS 4.

**Key flows:**
- `/` — Landing page with CTA to start a review
- `/chat` — Compass Chat: orchestrator routes messages to the Sales Agent or Code Review Agent
- `/rpc` is proxied to the `reviewerRpc` Cloud Function; the browser never holds API keys

**Routing (inside chat):** A lightweight heuristic classifier (`src/shared/routing/`) decides whether a message is a sales question or a code review request. No LLM inference at classification time.

### 2. Firebase Cloud Functions (`functions/`)

Three HTTPS functions, all in Node 22 TypeScript. This is a **separate npm package** — it has its own `package.json` and `tsconfig.json` under `functions/`.

| Function | Endpoint | Auth | Purpose |
|---|---|---|---|
| `geminiMessages` | `POST /api/gemini/v1/messages` | Firebase ID token required | Browser → Gemini proxy; keeps API key server-side |
| `agentCard` | `GET /.well-known/agent.json` | None | A2A discovery — publishes method catalog and pricing |
| `reviewerRpc` | `POST /rpc` | None (x402 gates paid methods) | JSON-RPC 2.0: `listReportTypes`, `reviewSample` (free), `reviewFull` (paid) |

**x402 payment flow:**
1. Client calls `reviewFull` with no payment → server returns HTTP 402 + quote (amount, recipient, nonce, expiry)
2. Client signs a Solana devnet transaction via the connected wallet
3. Client retries with `X-Payment: <signature>` header
4. Server verifies the signature via Solana RPC, then runs the review and optionally generates a PDF stored in GCS

**8 report types** (synchronized between client and server):
`security`, `memory`, `quality`, `standards`, `performance`, `exceptions`, `antipatterns`, `deadcode`

### 3. Firebase Hosting

Serves the Vite `dist/` build and rewrites API paths to their Cloud Functions. The rewrites in `firebase.json` mean the SPA and functions share the same origin — no CORS issues.

---

## Local development

### Prerequisites

- Node.js 22+
- npm 10+
- Firebase CLI (for emulator): `npm install -g firebase-tools`
- A Google account with access to the `tribe-y` Firebase project (or your own project for local testing)

### 1. Install dependencies

Both the root SPA and the `functions/` package must be installed:

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
# Firebase web app config (get from Firebase Console → Project Settings → Your apps)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tribe-y.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tribe-y
VITE_FIREBASE_STORAGE_BUCKET=tribe-y.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Server-only (no VITE_ prefix) — used by the local Gemini dev proxy
# Do NOT commit this key.
GOOGLE_AI_API_KEY=...
```

### 3. Run the dev server (SPA only)

```bash
npm run dev
```

Opens on `http://localhost:5173`. By default the Vite dev proxy forwards:
- `/api/gemini/*` → Firebase Hosting emulator at `localhost:5002` (or live prod if emulator is not running)
- `/rpc` → production `tribe-y.web.app` (so you get real review results without a local Functions setup)

This is the fastest path for frontend work. You do **not** need the Functions emulator unless you are changing function code.

### 4. Run the full local stack (SPA + Functions emulator)

```bash
# Terminal 1 — build functions and start emulator
cd functions
npm run build
cd ..
firebase emulators:start --only auth,firestore,functions,hosting
```

The emulator starts:
- Auth → `localhost:9099`
- Firestore → `localhost:8080`
- Functions → `localhost:5001`
- Hosting (serves `dist/`) → `localhost:5002`

Add these to `.env.local` to point the Vite dev proxy at the local emulator:

```
FIREBASE_HOSTING_EMULATOR_PORT=5002
FIREBASE_FUNCTIONS_EMULATOR_PORT=5001
DEV_REVIEWER_TARGET=http://127.0.0.1:5001/tribe-y/us-central1
```

Then restart `npm run dev`.

### 5. Run tests

```bash
npm test                # run Vitest suite
npm run test:coverage   # with coverage report (70% threshold enforced)
```

Functions tests:

```bash
cd functions && npm test
```

---

## Before opening a PR

All three of the following must pass:

```bash
npm run lint    # Prettier + ESLint (auto-fixes safe issues)
npm test        # Vitest suite
npm run build   # TypeScript compile + Vite production build
```

A Husky pre-commit hook enforces `npm run lint` on staged files automatically.

---

## Production deployment

### Required secrets (Cloud Functions)

Set these once via the Firebase CLI before deploying functions for the first time:

```bash
firebase functions:secrets:set GOOGLE_AI_API_KEY
# Paste your Google AI (Gemini) API key when prompted.

# Future use — Solana wallet keypair for the reviewer service:
firebase functions:secrets:set REVIEWER_WALLET_SECRET_KEY
```

Secrets are stored in Google Cloud Secret Manager. They are **never** stored in `.env` files or checked into the repo.

### Optional environment variables (non-secret)

These live in `functions/.env.tribe-y` (project-specific, committed):

| Variable | Default | Purpose |
|---|---|---|
| `REVIEWER_RPC_ENDPOINT_OVERRIDE` | (none) | Direct Cloud Run URL for `reviewerRpc` — bypasses Firebase Hosting's 60 s timeout for long reviews |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Solana devnet RPC endpoint |

### Deploy the SPA

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Cloud Functions

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### Deploy everything

```bash
npm run build
cd functions && npm run build && cd ..
firebase deploy
```

Firebase also deploys Firestore rules, Firestore indexes, and Storage rules as part of `firebase deploy`.

### First-time Firebase project setup

If you are targeting a new Firebase project (not `tribe-y`):

1. Create the project in Firebase Console.
2. Enable **Authentication** → Anonymous sign-in.
3. Enable **Firestore** → Start in production mode (rules are in `firestore.rules`).
4. Enable **Storage** (rules are in `storage.rules`).
5. Update `.firebaserc` with your project ID.
6. Set the secrets above.
7. Register a web app in the project and copy the config into `.env.local`.

---

## Architecture summary

```
Browser (React SPA)
  │
  ├─ /api/gemini/*  →  geminiMessages (Cloud Function)
  │                        └─ Google Gemini API (GOOGLE_AI_API_KEY secret)
  │
  ├─ /rpc           →  reviewerRpc (Cloud Function)
  │                        ├─ listReportTypes (free)
  │                        ├─ reviewSample (free)
  │                        └─ reviewFull (gated by x402)
  │                              ├─ verifies Solana devnet tx
  │                              ├─ calls Gemini for analysis
  │                              └─ uploads PDF to GCS → signed URL
  │
  └─ /.well-known/agent.json  →  agentCard (Cloud Function)
                                     └─ A2A discovery (JSON catalog + pricing)

Firestore collections: users, codeReviews, transactions
Storage: reports/{sha256}.pdf  (default-deny; signed URLs only)
```

**Team ownership:**
- Yellow team: `src/chat/`, `src/components/`, `src/wallet/WalletShell.tsx`
- Orange team: `src/agents/`, `src/wallet/` (except WalletShell), `functions/`
- Shared (both teams must approve): `src/shared/`

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 19 (strict mode) |
| Language | TypeScript 5.9 (strict) |
| Build | Vite 8 |
| Styling | Tailwind CSS 4.3 + CSS Modules |
| Backend | Firebase Cloud Functions (Node 22) |
| Database | Firestore |
| Storage | Google Cloud Storage (via Firebase Storage) |
| Auth | Firebase Auth (anonymous) |
| AI | Google Gemini 2.5 Pro / Flash |
| Payments | x402 protocol over Solana devnet |
| Testing | Vitest 4 + React Testing Library |
| Linting | ESLint 9 + Prettier |
| CI hooks | Husky 9 + lint-staged |

---

## Project management

- Backlog: https://github.com/orgs/NUCS394-S2026-2/projects/6
- Repository: https://github.com/NUCS394-S2026-2/tribe-y

## Documentation

- Agent brief (canonical, read first): [`AGENTS.md`](AGENTS.md)
- Claude Code guidance: [`CLAUDE.md`](CLAUDE.md)
- Architecture and team ownership: [`docs/agent/architecture.md`](docs/agent/architecture.md)
- Data model (Firestore): [`docs/agent/data-model.md`](docs/agent/data-model.md)
- Story specs: [`docs/agent/stories/`](docs/agent/stories/)
- Team process: [`docs/tribe/`](docs/tribe/)
