# 0001 — Use This Harness Structure

**Status:** Accepted

**Date:** 2026-04-23

**Decider(s):** Architecture/Design guild, Development Practices guild (bootstrapped from CS394 2026 template)

---

## Context

The tribe is building a React/TypeScript application with 15 students across four teams. Three categories of tooling are in active use: Claude Code, GitHub Copilot (education plan), and optionally Cursor. Each tool can read files in the repo at task time, but none of them inherits context from a previous session automatically.

Without a deliberate structure, agents will:
- Re-derive conventions from source code on every task, producing inconsistency
- Generate code that violates team ownership boundaries
- Skip writing tests or write tests that don't match acceptance criteria
- Make architectural decisions without referencing existing ADRs

Böckeler and Fowler (April 2026) distinguish between **feedforward controls** (guides that shape behavior before work begins) and **feedback controls** (sensors that verify correctness after work is done). A well-engineered harness uses both. The tribe needs a shared vocabulary for which controls exist and who owns them.

## Decision

We adopt the `docs/agent/` + `docs/tribe/` folder structure introduced in this bootstrap, with `AGENTS.md` as the canonical agent entry point, `docs/harness.md` as the control registry, and `docs/agent/stories/` as the home for agent-ready story specs.

The structure separates:
- Agent-facing guides (`docs/agent/`) from human-facing docs (`docs/tribe/`)
- Feedforward controls (guides, specs) from feedback controls (ESLint, Vitest, CI)
- Template-provided scaffolding (this bootstrap) from tribe-specific content (everything with `ALL_CAPS` placeholders)

## Consequences

**Positive:**
- Agents have a single entry point (`AGENTS.md`) and a clear map to deeper guides
- The harness registry (`docs/harness.md`) makes every control visible and auditable
- Spec-driven development is enforced by convention: agents must read a story spec before coding
- New guild members can orient by reading `docs/Home.md`

**Negative / trade-offs:**
- Requires the tribe to fill in `ALL_CAPS` placeholder content during Iteration 0 before agents can be fully useful
- Adds maintenance burden: guides must be kept current or agents will follow stale instructions
- Students unfamiliar with ADR practice may find the format overhead at first

**Follow-up required:**
- Assign guild owners and complete all `ALL_CAPS` placeholders in Iteration 0
- Define the shared `User` type (see `docs/agent/data-model.md`)
- Decide on styling approach and record as ADR 0002
- Add Mermaid container diagram to `docs/agent/architecture.md` once system shape is confirmed
