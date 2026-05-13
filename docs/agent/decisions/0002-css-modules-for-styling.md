# 0002 — Adopt CSS Modules for Styling

**Status:** Accepted

**Date:** 2026-05-07

**Decider(s):** Architecture/Design Guild (Jefferson, Stanley)

---

## Context

The tribe needed to choose a styling approach before implementing any UI components. Three options were considered: CSS Modules, Tailwind CSS, and CSS-in-JS (styled-components/emotion). The AGENTS.md stack table listed "CSS Modules (no Tailwind)" as the declared approach, which was recorded during Iteration 0 but not yet formally accepted as an ADR.

## Decision

We adopt **CSS Modules** (`*.module.css` files co-located with components). No Tailwind, no CSS-in-JS.

Color tokens from `docs/agent/design.md`:

- `primary: #1565C0`
- `secondary: #F9A825`
- `danger: #D32F2F`
- `success: #388E3C`

## Consequences

**Positive:**

- Styles are locally scoped — no class name collisions across teams
- No build-time Tailwind purge setup required
- Familiar to all team members; no framework-specific knowledge needed
- Co-locating `.module.css` with `.tsx` keeps each component self-contained

**Negative / trade-offs:**

- More verbose than Tailwind utility classes for simple layout
- No design token system out of the box — teams must manually use the defined hex values

**Follow-up required:**

- Define shared CSS custom properties (`:root` vars) in `src/index.css` for color tokens so both teams use consistent values
