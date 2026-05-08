# Story: Salesbot Chat

**Slug:** `salesbot-chat`
**Team:** Yellow (UI) + Orange (hook)
**GitHub issue:** #3
**Status:** Ready

## User Story

As a user, I want to describe my C++ problem to a Salesbot so it can confirm my request is in scope before I submit code for review.

## Acceptance Criteria

**AC-1**

- Given: I navigate to `/chat`
- When: the page loads
- Then: I see a greeting message from Salesbot

**AC-2**

- Given: I send a message mentioning Python/JavaScript/another language
- When: Salesbot responds
- Then: I see a rejection message explaining only C++ is supported

**AC-3**

- Given: I send a message describing a C++ problem (e.g., "memory leak in my C++ code")
- When: Salesbot responds
- Then: I see an approval message and a "Paste Your Code →" button that navigates to `/review`

## Files

- `src/chat/SalesbotChat.tsx` — UI component
- `src/chat/SalesbotChat.module.css` — styles
- `src/agents/useSalesbot.ts` — hook (Orange team)

## TypeScript

```ts
interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}
```

## Test Plan

- Unit: renders greeting, sends message, shows rejection for Python, shows approval + button for C++
- Manual: keyboard-only navigation, screen reader aria-live announcements
