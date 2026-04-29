# Architecture Guide

Owned by **WORKING_GROUP_ARCH_DESIGN**. Read before touching more than one file or crossing a team boundary.

## System Context

TRIBE_NAME builds a React SPA for CLIENT_NAME. Firebase Auth handles identity; Cloud Firestore handles persistence. No backend services in scope for 2026 — all logic runs client-side except Firestore security rules.

## ADRs

| #                                                    | Title                      | Status   |
| ---------------------------------------------------- | -------------------------- | -------- |
| [0001](decisions/0001-use-this-harness-structure.md) | Use this harness structure | Accepted |
| NNNN                                                 | DECISION_TITLE             | STATUS   |

## File

Link back to the [Project Structure](/docs//tribe/Project-Structure.md) doc. If there are variations or autonomy per team/guild describe and/or link here.

## Team Ownership

Describe team ownership of the codebase here, or link to a separate doc if more appropriate. Describe anything about the structure of the files in the codebase. Include any cross-team dependencies and how to navigate them.

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

Describe any shared utilities, components, or contracts here, along with who owns them and how to get approval for changes. e.g. a firebase hook.
