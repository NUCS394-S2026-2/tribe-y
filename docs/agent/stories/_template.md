# Story: STORY_TITLE

**Slug:** `STORY_SLUG` | **Status:** Draft | Ready | In Progress | Done
**Issue:** #ISSUE_NUMBER | **Team:** TEAM_COLOR

<!-- See Agile Samurai for more on user stories, chapter 6.  We will also discuss in more detail in class.  LLM's are familiar with the format from their training set and it helps frame the work in terms of user value and testable acceptance criteria.  A good approach is often to have the LLM generate the fist draft from your prompt. For example "Write a user story for a feature that allows users to reset their password, use (reference this file) as a template including acceptance criteria and a test plan." Then you can edit the output to fit your specific needs. -->

-->

---

## User Story

> As a USER_ROLE, I want DESIRED_ACTION so that BENEFIT.

## Acceptance Criteria

**AC-1:** Given GIVEN_CONDITION, When WHEN_ACTION, Then THEN_OUTCOME.
**AC-2:** Given GIVEN_CONDITION_2, When WHEN_ACTION_2, Then THEN_OUTCOME_2.
**AC-3 (error):** Given GIVEN_ERROR_CONDITION, When WHEN_ERROR_ACTION, Then THEN_ERROR_OUTCOME.

## Technical Approach

_2–3 paragraphs. Reference `docs/agent/` guides. Don't over-specify._

| File                | Change             |
| ------------------- | ------------------ |
| `src/PATH/FILE.tsx` | CHANGE_DESCRIPTION |

## Interfaces

```typescript
interface NEW_TYPE {
  field: TYPE;
}
```

## Test Plan

- **Unit:** UNIT_TEST_DESCRIPTION (mirrors AC-1)
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
