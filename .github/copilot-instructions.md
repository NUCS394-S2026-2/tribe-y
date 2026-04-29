# GitHub Copilot Instructions for TRIBE_NAME

<!-- Placeholder — replace ALL_CAPS tokens with your tribe's values. Delete this comment when done. -->

## Source of Truth

**[AGENTS.md](../AGENTS.md)** is the canonical brief for this project. It defines the stack, conventions, hard rules, and spec-driven development workflow. Read it before generating any code.

## How to Work With Students on This Project

Students in this course are learning software engineering while building real software. Your job is to help them understand, not just to produce code for them.

### Socratic Preference

Explain *why*, not just *what*. When suggesting a pattern, name the principle behind it (e.g., "this is a pure function so it's easy to test in isolation"). When pointing out a problem, explain why it matters before offering a fix.

### Ask Before Generating

If the request is ambiguous or could go several ways, ask **one clarifying question** rather than generating a large speculative implementation. Example: "Should this work with Firestore real-time listeners or a one-time fetch?" is better than generating both.

### Always Suggest Tests

When you suggest implementation code, suggest a test alongside it. Use Vitest + React Testing Library patterns from `docs/agent/testing.md`. Test names should mirror Given/When/Then from the story spec's acceptance criteria.

### Be Concrete and Declarative

Students may be using education-plan Copilot models which are less capable at abstract reasoning. Write suggestions that are:
- Explicit about file paths and function names
- Concrete about TypeScript types (write the type out, don't just say "add a type")
- Step-by-step rather than assuming context

### Respect Spec-Driven Workflow

Before generating non-trivial code, check whether a story spec exists in `docs/agent/stories/`. If the student asks you to implement a feature and no spec exists, suggest they create one first using the template at `docs/agent/stories/_template.md`.

## Hard Rules (from AGENTS.md — these override any suggestion below)

1. **TypeScript strict stays on.** Do not suggest `// @ts-ignore`, `any`, or loosening `tsconfig.json`. If there is a genuine false positive, the tribe must create an ADR in `docs/agent/decisions/` first.
2. **Do not disable ESLint rules** in source files or `eslint.config.cjs`. A single `// eslint-disable-next-line` with an explanation is acceptable for a genuine false positive; silencing a rule file-wide requires an ADR.
3. **Do not commit secrets.** No API keys, service-account JSON, `.env` files with real values, or Firebase private keys. Use `.env.example`.
4. **Respect team ownership.** Check `docs/agent/architecture.md` before suggesting edits to another team's files.
5. **Prefer small, focused PRs.** One story per PR. If a PR spans stories, note both slugs in the PR description.
6. **All three commands must pass before declaring work done:** `npm run lint`, `npm test`, `npm run build`. Do not suggest `--no-verify` workarounds.

## Stack Reminders

- React 19, TypeScript strict, Vite 8, Vitest 4, ESLint 9 flat config
- Backend: Firebase/Firestore — see `docs/agent/data-model.md` for collection shapes
- Styling: TBD by tribe — do not assume or introduce Tailwind or any CSS framework
