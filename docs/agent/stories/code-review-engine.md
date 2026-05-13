# Story: Code Review Engine

**Slug:** `code-review-engine`
**Team:** Orange
**GitHub issue:** #7
**Status:** Ready

## User Story

As a user, I want to paste C++ code and receive a teaser expert review so I can decide whether to pay for the full analysis.

## Acceptance Criteria

**AC-1**

- Given: I navigate to `/review` and paste C++ code
- When: I click "Analyze Code"
- Then: a teaser review card appears with identified issues

**AC-2**

- Given: the teaser is shown
- When: I click "Unlock Full Review"
- Then: I am navigated to `/payment?reviewId=<id>`

**AC-3**

- Given: I return to `/review?reviewId=<id>&unlocked=true`
- When: the page loads
- Then: the full annotated review is displayed

## Files

- `src/agents/CodeReviewPage.tsx`
- `src/agents/CodeReviewPage.module.css`
- `src/agents/useCodeReview.ts`

## TypeScript

See `src/shared/types/CodeReview.ts` for the document shape.

## Test Plan

- Unit: `useCodeReview.submitSnippet` writes to Firestore, teaser is non-null, full review is non-null
- Manual: paste C++ snippet with `new` → see memory leak warning in teaser; unlock → see full review
