# Story: Chat with Bjarne-bot and Secure Code Review

**Slug:** `chat-bjarne-bot` | **Status:** Draft
**Issue:** #1 | **Team:** Yellow

---

## User Story

> As a Technical Manager (ICP), I want to interact with a Bjarne-bot via a web chat interface, submit C++ code for review, and receive actionable feedback, so that I can quickly assess code quality and make informed decisions about my codebase or acquisition target.

## Acceptance Criteria

**AC-1:** Given a new user lands on the homepage, When they open the chat, Then the Bjarne-bot greets them and asks about their goals and pain points (PAS: Problem, Anxiety, Solution).

**AC-2:** Given the user pastes a C++ code snippet, When they submit it, Then the Bjarne-bot analyzes the code and returns a partial review (teaser) with actionable comments.

**AC-3:** Given the user requests the full review, When prompted for payment, Then the system issues an X.402 payment request and displays wallet/testnet instructions.

**AC-4:** Given the user completes the payment on the testnet, When the transaction is confirmed, Then the full review is unlocked and a Solid Vault Receipt is issued.

**AC-5 (error):** Given the payment fails or is not confirmed, When the user requests the full review, Then the system displays an error and instructions to retry or contact support.

## Technical Approach

The chat interface is implemented as a React component using TypeScript, styled with CSS modules. The Bjarne-bot agent is powered by a backend LLM (Claude or Copilot) and integrates with a C++ code analysis engine. The A2A (agent-to-agent) model card and advertising system are surfaced in the chat sidebar, showing available expert agents and their specialties.

Payment is handled via the X.402 draft standard, using a testnet wallet for crypto transactions. The system tracks token usage and billing via a Firestore collection. Upon payment, the backend verifies the transaction and unlocks the full review, issuing a Solid Vault Receipt.

All user interactions, code submissions, and payment events are logged for auditability. The architecture follows the guides in `docs/agent/architecture.md`, `docs/agent/data-model.md`, and `docs/agent/design.md`.

| File                         | Change                                     |
| ---------------------------- | ------------------------------------------ |
| `src/components/Chat.tsx`    | New chat interface with Bjarne-bot         |
| `src/agents/bjarneBot.ts`    | LLM-powered agent logic                    |
| `src/components/Payment.tsx` | X.402 payment modal and wallet integration |
| `src/utils/billing.ts`       | Token counting and billing logic           |
| `src/pages/Receipt.tsx`      | Solid Vault Receipt display                |

## Interfaces

```typescript
interface ChatMessage {
  sender: 'user' | 'bjarne-bot';
  content: string;
  timestamp: string; // ISO 8601
}

interface PaymentRequest {
  amount: number;
  currency: 'TESTNET';
  walletAddress: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface CodeReview {
  code: string;
  partialFeedback: string;
  fullFeedback?: string;
  paid: boolean;
  receiptId?: string;
}
```

## Test Plan

- **Unit:** Bjarne-bot greets user and asks PAS questions (AC-1)
- **Unit:** Code analysis returns partial review for C++ snippet (AC-2)
- **Integration:** Payment modal issues X.402 request and updates on testnet confirmation (AC-3, AC-4)
- **Integration:** Full review unlocks and receipt is generated after payment (AC-4)
- **Error:** Payment failure displays error and retry instructions (AC-5)
- **Integration:** INTEGRATION_TEST_DESCRIPTION
- **Manual:** MANUAL_VERIFICATION_STEP

## Out of Scope

- OUT_OF_SCOPE_ITEM

## Done When

- [ ] All ACs pass (tests green)
- [ ] `npm run lint` and `npm run build` pass
- [ ] PR reviewed by owning team
- [ ] Deployed to preview and manually verified
- [ ] ADDITIONAL_DONE_CRITERION
