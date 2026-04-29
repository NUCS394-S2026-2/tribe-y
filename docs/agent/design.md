# Design Guide

Owned by **WORKING_GROUP_ARCH_DESIGN**. Read before creating or modifying any component.

## Styling — decide in Iteration 0

No styling approach is committed. **Do not assume Tailwind or any CSS framework.** WORKING_GROUP_ARCH_DESIGN records the decision as ADR 0002. Options to evaluate (must work with Vite 8 + React 19): CSS modules, Tailwind, CSS-in-JS.

**Current status:** STYLING_APPROACH_STATUS

## Component Conventions

- When to create new vs extend existing: COMPONENT_CREATION_GUIDELINES
- File organization (co-location, naming): COMPONENT_FILE_ORGANIZATION
- Token names (colors, spacing) once styling is decided: COLOR_AND_SPACING_TOKENS

## Accessibility Minimums

Every shipped component must have:

- Visible focus indicator on all interactive elements
- Meaningful `alt` text on images (`alt=""` for decorative)
- WCAG AA contrast (4.5:1 normal text, 3:1 large text)
- `<label>` elements associated with inputs
- ADDITIONAL_A11Y_REQUIREMENTS

## Team Color Spike (Iteration 0 only)

| Team | Hex | Notes |
|---|---|---|
| Red | #D32F2F | Colorblind accessible |
| Orange | #E65100 | Colorblind accessible |
| Blue | #1565C0 | Colorblind accessible |
| Yellow | #F9A825 | Colorblind accessible |
