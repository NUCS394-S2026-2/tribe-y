# Harness Registry

<!-- Placeholder — replace ALL_CAPS tokens with your tribe's values. Delete this comment when done. -->

This is the registry of every harness control in our tribe. Every time we add a guide or a sensor, we add a row here. Every time something bites us and we add a control to prevent it, we note it in the retro. If a row is here but the control does not actually fire, that is worse than not having the row — fix or remove.

## Controls

| Control | Direction | Type | File or command | Owner |
|---|---|---|---|---|
| Agent brief | feedforward | inferential | `/AGENTS.md` | WORKING_GROUP_DEV_PRACTICES |
| Claude Code wrapper | feedforward | inferential | `/CLAUDE.md` | WORKING_GROUP_DEV_PRACTICES |
| Copilot instructions | feedforward | inferential | `/.github/copilot-instructions.md` | WORKING_GROUP_DEV_PRACTICES |
| Architecture guide | feedforward | inferential | `/docs/agent/architecture.md` | WORKING_GROUP_ARCH_DESIGN |
| Design guide | feedforward | inferential | `/docs/agent/design.md` | WORKING_GROUP_ARCH_DESIGN |
| Testing guide | feedforward | inferential | `/docs/agent/testing.md` | WORKING_GROUP_DEV_PRACTICES |
| Data model guide | feedforward | inferential | `/docs/agent/data-model.md` | WORKING_GROUP_ARCH_DESIGN |
| Story spec requirement | feedforward | inferential | `/docs/agent/stories/` | WORKING_GROUP_CUSTOMER |
| ESLint | feedback | computational | `npm run lint` (pre-commit + CI) | WORKING_GROUP_DEV_PRACTICES |
| TypeScript strict | feedback | computational | `npm run build` (CI) | WORKING_GROUP_DEV_PRACTICES |
| Vitest | feedback | computational | `npm test` (CI) | WORKING_GROUP_DEV_PRACTICES |
| CI workflow | feedback | computational | `.github/workflows/ci.yml` | WORKING_GROUP_DEV_PRACTICES |

## Terminology

- **Direction — feedforward:** shapes agent behavior before work begins (guides, specs, conventions)
- **Direction — feedback:** verifies correctness after work is done (linters, type checkers, test runners, CI gates)
- **Type — inferential:** a human- or agent-readable document; no automated execution
- **Type — computational:** a tool or command that runs and produces a pass/fail signal

## How to Add a Control

1. Add the guide or sensor (file, workflow step, script, etc.)
2. Add a row to the table above
3. Note the addition in the retro so the tribe knows what changed and why

## Retro Log

_When the tribe adds a control in response to an incident, record it here: what went wrong, what was added, what sprint._

| Sprint | Incident | Control added |
|---|---|---|
| _SPRINT_ID_ | _What went wrong_ | _What was added_ |
