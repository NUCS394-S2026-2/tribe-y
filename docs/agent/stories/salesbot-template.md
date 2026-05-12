# Story: Salesbot Chat

**Slug:** `salesbot-chat` | **Status:** Ready
**Issue:** #3 | **Team:** Yellow (UI) + Orange (hook)

---

## User Story

> As a **prospective customer**, I want to describe my C++ problem to a Salesbot in a conversational chat interface, so that I can confirm my request is in scope before committing to a code review submission.

---

## Acceptance Criteria

**AC-1:** Given a visitor navigates to `/chat`, When the page loads, Then they see a chat window with an opening greeting from Salesbot explaining that it helps qualify C++ code review requests — no login or account required.

**AC-2:** Given a user sends a message mentioning a non-C++ language (e.g., Python, JavaScript, Go), When Salesbot responds, Then the user sees a clear rejection message explaining that the platform only supports C++ code review, with no further prompts to proceed.

**AC-3:** Given a user sends a message describing a valid C++ problem (e.g., "I have a memory leak in my C++ code"), When Salesbot responds, Then the user sees an approval message confirming the request is in scope, and a **"Paste Your Code →"** button appears that routes them to `/review`.

**AC-4 (error):** Given the Salesbot agent is slow or unavailable, When a user sends a message, Then a loading indicator is shown within 300ms and the input is disabled until a response arrives or a timeout error message is displayed — the user is never left with a frozen UI.

---

## Technical Approach

The chat UI lives at `/chat` and is composed of a scrollable message list and a fixed input bar. The `SalesbotChat` component manages local message state and delegates all agent logic to the `useSalesbot` hook (owned by Orange team). The UI layer has no direct knowledge of the underlying model or A2A calls — it only consumes `{ messages, sendMessage, isLoading }` from the hook.

The Salesbot has two possible terminal responses: **rejection** (non-C++ language detected) and **approval** (valid C++ request confirmed). On approval, the component renders an inline `CTAButton` pointing to `/review`. On rejection, the conversation ends gracefully with no forward route offered.

Accessibility is a first-class concern: the message list must use `aria-live="polite"` so screen readers announce new messages, and the send button must be keyboard-operable without a mouse.

| File                               | Change                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `src/app/chat/page.tsx`            | Route — renders `SalesbotChat`, no auth guard                             |
| `src/chat/SalesbotChat.tsx`        | Chat UI: message list, input bar, CTA on approval                         |
| `src/chat/SalesbotChat.module.css` | Scoped styles for chat layout and message bubbles                         |
| `src/agents/useSalesbot.ts`        | Hook: manages agent calls, returns `messages`, `sendMessage`, `isLoading` |
| `src/components/ui/CTAButton.tsx`  | Shared CTA button — reused from landing page story                        |

---

## Interfaces

```typescript
interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface UseSalesbotReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}
```

---

## Test Plan

- **Unit:** Render `SalesbotChat` — assert greeting message is visible on mount (mirrors AC-1).
- **Unit:** Simulate sending "I have a Python bug" — assert bot response contains rejection copy and no CTA button is rendered (mirrors AC-2).
- **Unit:** Simulate sending "memory leak in my C++ code" — assert bot response contains approval copy and a "Paste Your Code →" button with `href="/review"` is rendered (mirrors AC-3).
- **Unit:** Mock `useSalesbot` with `isLoading: true` — assert input is disabled and a loading indicator is visible (mirrors AC-4).
- **Integration:** Navigate to `/chat` in a test browser — assert sending a C++ message routes correctly to `/review` via the CTA, with no auth redirect (mirrors AC-3).
- **Manual:** Keyboard-only navigation — Tab to input, type a message, Enter to send, Tab to CTA button on approval.
- **Manual:** Screen reader — verify `aria-live` region announces new bot messages as they arrive.

---

## Out of Scope

- C++ expert agent or code analysis logic (covered in a separate story)
- Conversation persistence or chat history across sessions
- User authentication or account creation
- Mobile-specific layout breakpoints beyond basic responsiveness
- Analytics or tracking on chat interactions

---

## Done When

- [ ] All ACs pass (tests green)
- [ ] `npm run lint` and `npm run build` pass
- [ ] PR reviewed by Yellow and Orange team leads
- [ ] Deployed to preview and manually verified end-to-end
- [ ] Approval flow routes correctly to `/review` in the preview environment
- [ ] Screen reader and keyboard-only navigation verified manually
