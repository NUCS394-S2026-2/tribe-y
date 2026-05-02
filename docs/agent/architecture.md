# Architecture Guide

Owned by **Architecture/Design Guild**. Read before touching more than one file or crossing a team boundary.

## System Context

Tribe Y builds a React SPA for compass.tne.ai. Firebase Auth handles identity; Cloud Firestore handles persistence. No backend services in scope for 2026 — all logic runs client-side except Firestore security rules.

## ADRs

| #                                                    | Title                      | Status   |
| ---------------------------------------------------- | -------------------------- | -------- |
| [0001](decisions/0001-use-this-harness-structure.md) | Use this harness structure | Accepted |

## File

See [Project Structure](../tribe/Project-Structure.md) for details. Team Yellow owns the chat and payment UI; Team Orange owns the agent logic and backend integration. Shared utilities are in `src/shared/` and require approval from both teams for changes.

## Team Ownership

| Team   | Owned path    | Notes                                 |
| ------ | ------------- | ------------------------------------- |
| Yellow | `src/chat/`   | Chat UI, payment, receipt, onboarding |
| Orange | `src/agents/` | Bjarne-bot, code review, A2A, X.402   |
| Shared | `src/shared/` | Types, utilities, billing logic       |

<!-- | Team | Owned path | Notes |
|---|---|---|
| Red | `src/TEAM_RED_SLICE/` | TEAM_RED_OWNERSHIP_NOTES |
| Orange | `src/TEAM_ORANGE_SLICE/` | TEAM_ORANGE_OWNERSHIP_NOTES |
| Blue | `src/TEAM_BLUE_SLICE/` | TEAM_BLUE_OWNERSHIP_NOTES |
| Yellow | `src/TEAM_YELLOW_SLICE/` | TEAM_YELLOW_OWNERSHIP_NOTES |
| Shared | `src/shared/` | WORKING_GROUP_ARCH_DESIGN reviews changes |
 -->

Until the ownership map is filled in, treat all of `src/` as shared; any structural change needs guild approval.

## Cross-Team Dependencies

Shared: `src/shared/` (types, billing, Firestore hooks). Changes require approval from both teams. Example: Firestore hooks for payment status, billing, and code review results.
