# Tribe Y — Project Home

Welcome to the Tribe Y repository for Northwestern CS394 2026. We are building a web application for compass.tne.ai. This repo is shared by both teams; each team owns a slice of the codebase documented in `docs/agent/architecture.md`.

## Where to Find Things

| Folder | Primary reader | What's in it |
|---|---|---|
| [`docs/tribe/Home.md`](tribe/Home.md) | Humans on the tribe | Meeting norms, practices, client info, guild membership |
| [`docs/agent/`](agent/) | Coding agents (and curious humans) | Architecture, design, testing, data model, specs, ADRs |

**Rule of thumb:** if its primary reader is a person navigating the project, it goes in `tribe/`. If its primary reader is a model doing a task, it goes in `agent/`. When in doubt, ask whoever owns development practices.

## Teams and Membership

The tribe is organized into two teams. Teams coordinate internally before surfacing work to the full tribe.

| Team | Members |
|---|---|
| Yellow | Stanley, Jefferson, Gabe, Yimin, Andy |
| Orange | Jack, Fay, Souvenir, Damini, Abby |

## Working Groups

Cross-team groups that own shared concerns. To stay lean and move quickly during Iteration 0, we have consolidated the four required concern areas into two primary Guilds:

### 1. Architecture / Design Guild
*Owns: Architecture and Design (docs/agent/architecture.md, docs/agent/design.md, docs/agent/data-model.md).*
* **Members:** Jefferson (Orange), Stanley (Yellow)

### 2. Organizational & Development Practices Guild
*Owns: Organizational Practices, Development Practices, and Client Interaction (docs/tribe/, AGENTS.md, CLAUDE.md).*
* **Members:** Stanley (Yellow), Jefferson (Orange)

## Getting Started

1. Read [`docs/harness.md`](harness.md) to understand the guides and sensors this template provides.
2. Form working groups, assign ownership, and start the Iteration 0 spike (shared `User` type + styling decision).
