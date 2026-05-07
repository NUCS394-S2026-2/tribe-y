# Harness Registry

This is the registry of every harness control in Tribe Y. Every time we add a guide or a sensor, we add a row here. Every time something bites us and we add a control to prevent it, we note it in the retro. If a row is here but the control does not actually fire, that is worse than not having the row — fix or remove.

## Controls

| Control                | Direction   | Type          | File or command                    | Owner                       |
| ---------------------- | ----------- | ------------- | ---------------------------------- | --------------------------- |
| Agent brief            | feedforward | inferential   | `/AGENTS.md`                       | Development Practices Guild |
| Claude Code wrapper    | feedforward | inferential   | `/CLAUDE.md`                       | Development Practices Guild |
| Copilot instructions   | feedforward | inferential   | `/.github/copilot-instructions.md` | Development Practices Guild |
| Architecture guide     | feedforward | inferential   | `/docs/agent/architecture.md`      | Architecture/Design Guild   |
| Design guide           | feedforward | inferential   | `/docs/agent/design.md`            | Architecture/Design Guild   |
| Testing guide          | feedforward | inferential   | `/docs/agent/testing.md`           | Development Practices Guild |
| Data model guide       | feedforward | inferential   | `/docs/agent/data-model.md`        | Architecture/Design Guild   |
| Story spec requirement | feedforward | inferential   | `/docs/agent/stories/`             | Product Owner               |
| ESLint                 | feedback    | computational | `npm run lint` (pre-commit + CI)   | Development Practices Guild |
| TypeScript strict      | feedback    | computational | `npm run build` (CI)               | Development Practices Guild |
| Vitest                 | feedback    | computational | `npm test` (CI)                    | Development Practices Guild |
| CI workflow            | feedback    | computational | `.github/workflows/ci.yml`         | Development Practices Guild |

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

| Sprint | Incident                        | Control added                              |
| ------ | ------------------------------- | ------------------------------------------ |
| 0      | Missed test coverage on chat UI | Added manual verification to testing guide |
