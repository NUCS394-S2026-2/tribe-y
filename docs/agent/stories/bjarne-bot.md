# Story: Bjarne-bot (Salesbot Agent)

**Slug:** `bjarne-bot`
**Team:** Orange
**GitHub issue:** #6
**Status:** Ready

## User Story

As the platform, I need a Salesbot hook that vets user intent so only C++ requests proceed to the code review engine.

## Acceptance Criteria

**AC-1**

- Given: user sends a message with C++ keywords (c++, memory leak, pointer, etc.)
- When: `sendMessage` is called
- Then: `intentVerified` becomes `true` and bot reply confirms approval

**AC-2**

- Given: user sends a message mentioning a non-C++ language (Python, JavaScript, etc.)
- When: `sendMessage` is called
- Then: `intentVerified` stays `false` and bot reply explains C++-only support

**AC-3**

- Given: user sends an ambiguous message
- When: `sendMessage` is called
- Then: bot asks a clarifying question; `intentVerified` stays `false`

## Files

- `src/agents/useSalesbot.ts`

## TypeScript

```ts
interface SalesbotState {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  intentVerified: boolean;
  isLoading: boolean;
}
```

## Test Plan

- Unit: C++ message → intentVerified true; Python message → intentVerified false; ambiguous → clarifying question
