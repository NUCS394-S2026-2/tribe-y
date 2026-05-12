# Design Guide

Owned by **Architecture/Design Guild**. Read before creating or modifying any component.

## Brand Identity

Compass is a high-precision, technical tool designed for M&A code audits and deep technical analysis. The brand should feel like a "Bloomberg Terminal for Code"—data-dense, authoritative, and secure.

## Visual Language

- **Theme:** Dark mode by default to appeal to technical managers and developers.
- **Palette:** \* **Primary:** Deep Slate (`#0F172A`)
  - **Accent:** Electric Cyan (`#22D3EE`) for "intelligence" and "action"
  - **Contrast:** Crisp White (`#F8FAFC`) for readability
  - **Status:** Amber (`#F59E0B`) for smells, Emerald (`#10B981`) for robust code
- **Typography:** * Sans-serif for UI: *Inter* or *JetBrains Mono\* for a technical edge.
  - Monospace for code snippets and reports.
- **Layout:** High information density, clear modular sections, and grid-based structures.

## Core Components

- **Hero Section:** Immediate CTA to the Sales Agent chatbot.
- **Value Pillars:** Three-column layout explaining "Audit-Ready Reviews," "M&A Intelligence," and "Micro-payment Protocol (X.402)."
- **The Report Card:** A stylized UI component showing code health scores and identified "smells."
- **Chatbot Interface:** A docked or floating terminal-style window.

## Example Code Smell Report (Mock Data)

- **Repo:** `nexus-core-api`
- **Health Rating:** 62/100 (Caution)
- **Top Issues:** \* Circular dependency in auth middleware.
  - Insecure credential handling in `/v1/sync`.
  - 42% test coverage in critical payment path.

---

## Component Conventions

- Create a new component for each major UI element (chat, payment modal, receipt, agent card). Extend only if the UI logic is shared.
- Co-locate styles with components. Use PascalCase for React components, kebab-case for folders.
- Color tokens: `primary: #1565C0`, `secondary: #F9A825`, `danger: #D32F2F`, `success: #388E3C`.

## Accessibility Minimums

Every shipped component must have:

- Visible focus indicator on all interactive elements
- Meaningful `alt` text on images (`alt=""` for decorative)
- WCAG AA contrast (4.5:1 normal text, 3:1 large text)
- `<label>` elements associated with inputs
- All interactive elements must be keyboard accessible. Use ARIA roles for custom widgets. All modals must trap focus.
