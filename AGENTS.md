# AGENTS.md — Agent Brief for TRIBE_NAME

<!-- Placeholder — replace ALL_CAPS tokens with your tribe's values. Delete this comment when done. -->

## Project Summary

TRIBE_NAME is a Northwestern CS394 2026 multi-team client project building a web application for CLIENT_NAME. The tribe consists of approximately 15 students split across four color-coded teams (Red, Orange, Blue, Yellow). All teams contribute to a single shared codebase. This file is the canonical entry point for any coding agent working in this repository; read it before doing anything else, then follow the pointers into `docs/agent/` for detail.

## Stack

| Layer              | Technology                                        |
| ------------------ | ------------------------------------------------- |
| UI framework       | React 19 (strict mode)                            |
| Language           | TypeScript 5.9 (strict)                           |
| Build tool         | Vite 8                                            |
| Test runner        | Vitest 4 + React Testing Library                  |
| Linter / formatter | ESLint 9 (flat config) + Prettier                 |
| Pre-commit         | Husky + lint-staged                               |
| Backend            | Firebase / Firestore (configuration TBD by tribe) |
| Styling            | TBD by tribe — do not assume Tailwind             |

## Repo Layout

```
src/                      App source code
docs/tribe/               Human-facing docs (meeting norms, practices, client info)
docs/agent/               Agent-facing guides (architecture, design, testing, data model)
docs/agent/stories/       Story specs — read before writing code
docs/agent/decisions/     Architectural Decision Records (ADRs)
docs/harness.md           Registry of all harness controls (guides + sensors)
```

## Commands — Run These Before Declaring Work Done

```bash
npm run lint    # Prettier + ESLint — must pass
npm test        # Vitest suite — must pass
npm run build   # TypeScript compile + Vite production build — must pass
```

The CI workflow (`.github/workflows/ci.yml`) runs all three. Your PR will not be merged if any of them fail.

## Hard Rules (Load-Bearing Conventions)

1. **TypeScript strict stays on.** Do not add `// @ts-ignore`, `any`, or loosen `tsconfig.json` without an ADR. See `docs/agent/decisions/`.
2. **Do not disable ESLint rules** in source files or `eslint.config.cjs` without an ADR. A single `// eslint-disable-next-line` with an explanation comment is acceptable for a genuine false positive; silencing a rule file-wide is not.
3. **Do not commit secrets.** No API keys, service-account JSON, `.env` files with real values, or Firebase private keys. Use environment variables and `.env.example`.
4. **Respect team ownership boundaries.** Each team owns a slice of the codebase documented in `docs/tribe/guilds.md` and `docs/agent/architecture.md`. Do not modify another team's owned directories without their explicit approval in the PR.
5. **Prefer small, focused PRs.** One story per PR when possible. If a PR touches more than one story, note both story slugs in the PR description.

## Spec-Driven Development Rule

For any non-trivial work, read the story spec at `docs/agent/stories/<slug>.md` before writing code. If no spec exists for the work you are about to do, **stop and ask the human to produce one.** Trivial single-file changes (typo fix, renaming a variable, adjusting a CSS value) can skip the spec folder.

The story spec contains:

- Acceptance criteria as testable Given/When/Then conditions (these become test names)
- Interfaces and TypeScript types for any new or changed data
- Technical approach: which files to change, which to create, which patterns to apply

## Pointers into `docs/agent/`

| Guide                                                      | What it covers                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`docs/agent/architecture.md`](docs/agent/architecture.md) | System context, container overview, team ownership map                    |
| [`docs/agent/design.md`](docs/agent/design.md)             | UI conventions, component organization, styling approach                  |
| [`docs/agent/testing.md`](docs/agent/testing.md)           | What to unit-test, integration-test, and manually verify; Vitest patterns |
| [`docs/agent/data-model.md`](docs/agent/data-model.md)     | Firestore shapes, shared types (User), state management rules             |
| [`docs/agent/decisions/`](docs/agent/decisions/)           | ADR index and full ADR texts                                              |
| [`docs/agent/stories/`](docs/agent/stories/)               | Story specs (agent-ready implementation guides)                           |

## Staying Short

This file is the entry point and must stay under 200 lines. All detail belongs in `docs/agent/`. If you find yourself writing more than a paragraph on any topic here, move it to the appropriate guide and add a pointer above.
