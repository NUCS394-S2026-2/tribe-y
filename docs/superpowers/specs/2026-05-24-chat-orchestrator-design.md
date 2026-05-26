# Chat Orchestrator Design

**Date:** 2026-05-24  
**Status:** Draft — pending user review  
**Branch:** `refactor/route-based-architecture`  
**Approach:** A — Orchestrator hook + stateless agent services  
**Session persistence:** In-memory only (this refactor)

---

## Problem

The route-based refactor split chat, payment, and vault across routes (ADR 0003), but coordination logic still lives inside `CompassChat.tsx`:

- Two stateful agent hooks (`useSalesbot`, `useCodeReview`) each own partial session state.
- `CompassChat` duplicates Salesbot messages into a separate `displayMessages` array.
- Dead exports (`intentVerified`, `fetchFullReview`, `fullReview`, `isUnlocked`) remain in hooks.
- Routing (`classifyInput` + `if (kind === 'cpp')`) is embedded in the UI component.
- No clear extension point for adding agents or session persistence later.

This refactor makes the **chat layer the central orchestrator** while **agents become stateless services**.

---

## Goals

1. **Single source of truth** for conversation state (messages, mode, active review ID).
2. **Stateless agents** — pure async functions; no React state, no conversation memory.
3. **No dead code** — remove unused hooks, exports, and sync logic.
4. **Clean foundation** — easy to add agents, modes, or Firestore session persistence later.
5. **Preserve route split** — payment and vault remain separate routes; orchestrator only owns `/chat` session.

## Non-goals (this refactor)

- Firestore-backed chat session persistence (future `SessionStore` seam only).
- Intent verification / Salesbot-gated code review (removed; see Decision Log).
- Restoring `ReportTypeSelector` (hardcode `reportType: 'security'` until a follow-up story).
- Server-side orchestration.
- Changes to payment, vault, or Cloud Function behavior.

---

## Architecture

### Responsibility split

| Layer               | Location                                     | Owns                                                                      | Does NOT own                               |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| **Orchestrator**    | `src/chat/orchestrator/`                     | Messages, mode, `activeReviewId`, routing, loading, navigation to payment | Gemini prompts, direct UI rendering        |
| **Agent services**  | `src/agents/`                                | Single-turn LLM calls; Firestore review doc creation (Code Review only)   | Conversation history, React state, routing |
| **UI**              | `src/chat/CompassChat.tsx`, `compass-chat/*` | Rendering, input, accessibility                                           | Agent selection, message merging           |
| **Classifier**      | `src/shared/routing/`                        | Heuristic input kind (`cpp` / `english` / `ambiguous`)                    | Session state                              |
| **Payment / Vault** | `src/payment/`, `src/vault/`                 | Wallet, upload, pay, full review fetch, vault display                     | Chat session state                         |

### Chat modes (orchestrator-owned)

```
qualifying  →  analyzing  →  teaser
```

| Mode         | Meaning                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `qualifying` | Default. User can chat with Sales or trigger Code Review via classifier. |
| `analyzing`  | Code Review teaser in flight. Input disabled.                            |
| `teaser`     | Teaser displayed. Pay CTA available.                                     |

### Routing rules

Inside `useChatOrchestrator.sendMessage(text)`:

1. Append user message to `session.messages`.
2. Call `routeMessage(session, text)` which uses `classifyInput(text)`.
3. **If `cpp`:** set mode → `analyzing`; call `runCodeReviewTeaser(ctx, snippet)`; append teaser assistant message; set `activeReviewId`; set mode → `teaser`.
4. **Else (english / ambiguous):** call `runSalesAgent(ctx, text)`; append assistant message; remain in `qualifying`.
5. `goToPayment()` navigates to `/payment?reviewId={activeReviewId}` when mode is `teaser`.

The classifier is routing infrastructure, not an LLM agent.

---

## Types

### `src/shared/types/ChatSession.ts`

```typescript
export type ChatMode = 'qualifying' | 'analyzing' | 'teaser';

export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageKind = 'sales' | 'teaser' | 'error';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  text: string;
  kind: ChatMessageKind;
  createdAt: number;
}

export interface ChatSession {
  messages: ChatMessage[];
  mode: ChatMode;
  activeReviewId: string | null;
  isLoading: boolean;
}
```

### `src/shared/types/AgentContext.ts`

```typescript
import type { ChatMessage } from './ChatSession';

/** Read-only snapshot passed into each agent call. Agents must not mutate session. */
export interface AgentContext {
  messages: ChatMessage[];
  uid: string | null;
}

export interface SalesAgentResult {
  text: string;
}

export interface CodeReviewAgentResult {
  reviewId: string;
  teaserReview: string;
}
```

### Orchestrator public API

```typescript
interface UseChatOrchestratorReturn {
  session: ChatSession;
  sendMessage: (text: string) => Promise<void>;
  goToPayment: () => void;
}
```

### Agent service signatures

```typescript
// src/agents/salesAgent.ts
export async function runSalesAgent(
  ctx: AgentContext,
  userMessage: string,
): Promise<SalesAgentResult>;

// src/agents/codeReviewAgent.ts
export async function runCodeReviewTeaser(
  ctx: AgentContext,
  snippet: string,
): Promise<CodeReviewAgentResult>;
```

---

## File layout

### New

| File                                                | Purpose                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| `src/chat/orchestrator/useChatOrchestrator.ts`      | Session state, `sendMessage`, `goToPayment`               |
| `src/chat/orchestrator/routeMessage.ts`             | Pure routing: `(session, text) → 'sales' \| 'codeReview'` |
| `src/chat/orchestrator/useChatOrchestrator.test.ts` | Orchestrator integration tests                            |
| `src/chat/orchestrator/routeMessage.test.ts`        | Routing unit tests                                        |
| `src/agents/salesAgent.ts`                          | Stateless Sales LLM call                                  |
| `src/agents/codeReviewAgent.ts`                     | Stateless teaser LLM call + Firestore create              |
| `src/agents/salesAgent.test.ts`                     | Sales agent unit tests                                    |
| `src/agents/codeReviewAgent.test.ts`                | Code review agent unit tests                              |
| `src/shared/types/ChatSession.ts`                   | Session types                                             |
| `src/shared/types/AgentContext.ts`                  | Agent context + result types                              |

### Modified

| File                                               | Change                                                         |
| -------------------------------------------------- | -------------------------------------------------------------- |
| `src/chat/CompassChat.tsx`                         | Thin view; consume `useChatOrchestrator` only                  |
| `src/chat/compass-chat/CompassChatMessageFeed.tsx` | Read from `session` (mode, messages, teaser)                   |
| `src/chat/compass-chat/stages.ts`                  | Align `CompassChatStage` with `ChatMode` or remove duplication |
| `docs/agent/architecture.md`                       | Document orchestrator layer and stateless agents               |

### Deleted

| File                          | Reason                           |
| ----------------------------- | -------------------------------- |
| `src/agents/useSalesbot.ts`   | Replaced by `salesAgent.ts`      |
| `src/agents/useCodeReview.ts` | Replaced by `codeReviewAgent.ts` |

### Unchanged

| File                                    | Reason                                                  |
| --------------------------------------- | ------------------------------------------------------- |
| `src/agents/codeReviewApi.ts`           | Used by `PaymentPage` for full review + codebase attach |
| `src/agents/useX402Payment.ts`          | Payment route lifecycle                                 |
| `src/shared/routing/inputClassifier.ts` | Routing infrastructure                                  |
| `src/payment/*`, `src/vault/*`          | Separate route surfaces                                 |

---

## Data flow

```
User types → CompassChat.onSend
          → useChatOrchestrator.sendMessage(text)
               1. append user ChatMessage
               2. routeMessage(session, text)
               3a. Sales: runSalesAgent({ messages, uid }, text)
                   → append assistant message (kind: 'sales')
               3b. Code Review:
                   mode → 'analyzing'
                   runCodeReviewTeaser({ messages, uid }, snippet)
                     → createGeminiMessage (teaser)
                     → Firestore setDoc codeReviews
                   → append assistant message (kind: 'teaser')
                   → activeReviewId = reviewId, mode → 'teaser'
               4. isLoading → false

Pay CTA → goToPayment() → navigate(/payment?reviewId=...)
```

### Persistence boundaries

| Data                                             | Storage                                    |
| ------------------------------------------------ | ------------------------------------------ |
| Chat messages, mode, activeReviewId              | In-memory orchestrator (lost on refresh)   |
| Review artifact (snippet, teaser, paymentStatus) | Firestore `codeReviews`                    |
| Full review text                                 | Firestore via Cloud Function after payment |

### Initial state

Orchestrator seeds one assistant greeting message on init (moved from former `useSalesbot` `GREETING` constant). Sales system prompt updated to remove `[INTENT_VERIFIED]` token instructions.

---

## Sales agent prompt (updated)

Remove intent verification. Sales responsibilities:

1. Greet and understand the user's problem.
2. Confirm scope is C++ (informational, not a gate).
3. Politely redirect non-C++ languages.
4. Encourage user to paste C++ code when appropriate (no magic token).

---

## Error handling

| Failure                            | Orchestrator behavior                                                 |
| ---------------------------------- | --------------------------------------------------------------------- |
| Gemini error (Sales)               | Append assistant message (`kind: 'error'`); stay in `qualifying`      |
| Gemini error (Code Review)         | Append error message; reset mode to `qualifying`                      |
| Auth unavailable (Code Review)     | Append sign-in error; reset mode to `qualifying`                      |
| Firestore write fails after teaser | Append error; reset mode to `qualifying`; do not set `activeReviewId` |

Loading: set `isLoading = true` before agent call; clear in `finally`. Disable input when `isLoading` or `mode === 'analyzing'`.

---

## Future seam: SessionStore

Not implemented in this refactor. Define interface only:

```typescript
// src/chat/orchestrator/sessionStore.ts
interface SessionStore {
  load(): Promise<ChatSession | null>;
  save(session: ChatSession): Promise<void>;
}
```

`useChatOrchestrator` accepts optional `SessionStore`; default is in-memory. Enables Firestore chat sessions without reshaping agents.

---

## Testing plan

| Test file                     | Coverage                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `routeMessage.test.ts`        | C++ → codeReview; English → sales                                               |
| `useChatOrchestrator.test.ts` | Message append, mode transitions, `activeReviewId`, error paths (mocked agents) |
| `salesAgent.test.ts`          | Prompt shape, Gemini call params (mocked)                                       |
| `codeReviewAgent.test.ts`     | Firestore doc shape, snippet truncation (mocked)                                |
| `inputClassifier.test.ts`     | Unchanged                                                                       |
| `app.test.tsx`                | Unchanged presentational tests                                                  |

Run `npm run lint`, `npm test`, `npm run build` before merge.

---

## Decision log

### D1: In-memory session persistence

Chat session is browser-only for this refactor. Review artifacts persist in Firestore. Rationale: fastest path to clean decoupling; `SessionStore` interface reserved for later.

### D2: Remove intent verification

Drop `intentVerified` from session, agent results, and Sales prompt. Routing is classifier-driven per message; LLM token gating was unused dead code and brittle. If qualification gating is needed later, implement explicit orchestrator rules (e.g. CTA sets `mode: 'ready_for_code'`) rather than magic tokens.

### D3: Keep classifier, not LLM router

Heuristic `classifyInput` remains in `shared/routing/`. No LLM-based orchestration agent. Deterministic, testable, aligned with ADR 0003.

### D4: Report type hardcoded

`reportType: 'security'` until `ReportTypeSelector` is restored in a separate story.

---

## Documentation updates

- `docs/agent/architecture.md`: Add Chat Orchestrator section; note agents are stateless services invoked by orchestrator.
- `docs/agent/stories/salesbot-template.md`: Note AC-3 superseded by classifier-first routing (follow-up story to update formally).

---

## Acceptance criteria

**AC-1:** Given a user on `/chat`, when they send English text, then the orchestrator routes to `runSalesAgent` and appends a sales-kind assistant message.

**AC-2:** Given a user on `/chat`, when they send C++-classified text, then the orchestrator transitions `qualifying → analyzing → teaser`, persists a `codeReviews` doc, and sets `activeReviewId`.

**AC-3:** Given mode is `teaser`, when the user clicks Pay, then they navigate to `/payment?reviewId={activeReviewId}`.

**AC-4:** Given the refactor is complete, then `useSalesbot.ts` and `useCodeReview.ts` are deleted and no unused agent hook exports remain.

**AC-5:** Given a Gemini or Firestore failure, when an agent call fails, then the orchestrator shows an error message and returns to a usable `qualifying` state.

**AC-6:** Given the test suite runs, then `npm run lint`, `npm test`, and `npm run build` all pass.
