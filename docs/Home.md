# TRIBE_NAME — Project Home

<!-- Placeholder — replace ALL_CAPS tokens with your tribe's values. Delete this comment when done. -->

Welcome to the TRIBE_NAME tribe repository for Northwestern CS394 2026. We are building a web application for CLIENT_NAME. This repo is shared by both teams; each team owns a slice of the codebase documented in `docs/agent/architecture.md`.

## Where to Find Things

| Folder | Primary reader | What's in it |
|---|---|---|
| [`docs/tribe/Home.md`](tribe/Home.md) | Humans on the tribe | Meeting norms, practices, client info, guild membership |
| [`docs/agent/`](agent/) | Coding agents (and curious humans) | Architecture, design, testing, data model, specs, ADRs |

**Rule of thumb:** if its primary reader is a person navigating the project, it goes in `tribe/`. If its primary reader is a model doing a task, it goes in `agent/`. When in doubt, ask whoever owns development practices.

## Teams and Membership

The tribe is organized into two sub-tribes. Sub-tribes coordinate internally before surfacing work to the full tribe.

 Team | Members |
|---|---|
| Red |  TEAM_RED_MEMBERS |
| Blue | TEAM_BLUE_MEMBERS |
| Orange | TEAM_ORANGE_MEMBERS |
|Yellow | TEAM_YELLOW_MEMBERS |

## Working Groups

Cross-team groups that own shared concerns. The tribe decides how many groups it needs and what they are called. 

Four concern areas must be owned by someone: **Organizational Practices**, **Development Practices**, **Client Interaction**, **Architecture and Design**. The tribe may combine or split these as it sees fit.

## Getting Started

1. Fill in the `ALL_CAPS` placeholders in `docs/tribe/` and `docs/agent/`. Run `grep -r '[A-Z_]\{4,\}' docs/` to find them all.
2. Read [`docs/harness.md`](harness.md) to understand the guides and sensors this template provides.
3. Form working groups, assign ownership, and start the Iteration 0 spike (shared `User` type + styling decision).
