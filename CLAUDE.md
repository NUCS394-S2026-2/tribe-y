# CLAUDE.md — Claude Code Wrapper for TRIBE_NAME

<!-- Placeholder — replace ALL_CAPS tokens with your tribe's values. Delete this comment when done. -->

The canonical agent brief for this project is **[AGENTS.md](AGENTS.md)**. Read that file first. Everything here is Claude-Code-specific behavior layered on top of it.

## Claude-Specific Guidance

- **Prefer small PRs.** One story per PR. If the change spans stories, say so.
- **When in doubt, ask a clarifying question** rather than assume and generate speculative code. One good question beats 200 lines that miss the intent.
- **Check the story spec first.** Before writing any implementation, look for `docs/agent/stories/<slug>.md`. If it is missing, stop and ask the human to provide it.
- **Run the three commands** (`npm run lint`, `npm test`, `npm run build`) before declaring any task done. Do not report success until all three pass.
- **Do not modify existing source files or configs** unless the task explicitly requires it. This repo follows additive-first discipline.
- **Respect team ownership.** If you are unsure which team owns a file, check `docs/agent/architecture.md` before editing.

## Memory

If you maintain a project memory file across sessions, record the current `TRIBE_NAME`, active sprint, and which story slugs are in progress. This reduces re-orientation time at the start of each session.
