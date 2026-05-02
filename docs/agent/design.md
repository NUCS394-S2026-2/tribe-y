# Design Guide

Owned by **Architecture/Design Guild**. Read before creating or modifying any component.

## Styling — decide in Iteration 0

**Styling approach:** CSS Modules (no Tailwind, no CSS-in-JS). All components use locally-scoped styles. Color palette is defined below.

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

## Team Color Spike (Iteration 0 only)

| Team   | Hex     | Notes                 |
| ------ | ------- | --------------------- |
| Red    | #D32F2F | Colorblind accessible |
| Orange | #E65100 | Colorblind accessible |
| Blue   | #1565C0 | Colorblind accessible |
| Yellow | #F9A825 | Colorblind accessible |
