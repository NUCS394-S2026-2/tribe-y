# Architecture & Code Quality Review

**Team:** Jack Press
**Date:** 6/1/25
**Commit reviewed:** [<git sha>](https://github.com/NUCS394-S2026-2/tribe-y)

## Architecture diagram

![Architecture](.repo-deps.svg)

### Surprises & observations

- <thing that surprised you while drawing>
- <pattern that only became visible once drawn>

### Diagram vs. reality (top 3 mismatches from madge)

1. ...
2. ...
3. ...

### Bus factor overlay

Annotated diagram: `docs/architecture-bus-factor.png`

- Pink files (concentrated ownership): <count>
- Pink files that are also hotspots (large or frequently edited): <list>
- Pink files that are also architectural centers (many other files import them): <list>

Biggest single-person dependency: <one sentence — "If X is unavailable, we can't Y">

## Top 5 findings

| #   | Finding | File(s) | Severity | Bus factor         | Why it matters |
| --- | ------- | ------- | -------- | ------------------ | -------------- |
| 1   | ...     | ...     | High     | 1 (85% one author) | ...            |
| 2   | ...     | ...     | ...      | ...                | ...            |

## Tool output summary

- jscpd: <N duplicated blocks, largest X lines>
- madge: <N circular deps, biggest module X>
- Largest files: <list top 3 with line counts>
- Unused exports: <count>

## What we'd fix first, and why

<2–3 sentences>

## Lessons for the next project

Each phrased as "Next time, we will \_\_\_":

1. ...
2. ...
3. ...
