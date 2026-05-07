# Story: Landing Page — NE.ai Hero & CTA
**Slug:** `landing-page-hero-cta` | **Status:** Draft
**Issue:** #ISSUE_NUMBER | **Team:** TEAM_COLOR

---

## User Story

> As a **technical manager or engineering lead**, I want to understand what NE.ai offers and initiate a C++ code review in one click, so that I can quickly assess whether the platform solves my team's code quality needs without a lengthy sales process.

---

## Acceptance Criteria

**AC-1:** Given a first-time visitor lands on the root URL `/`, When the page loads, Then they see a hero section with a headline, a one-sentence value proposition, and a prominent "Start a C++ Code Review" CTA button above the fold.

**AC-2:** Given a visitor reads the landing page, When they scroll past the hero, Then they see a concise explainer of how the platform works (intake → preview → pay → full report) in 3 steps or fewer, without requiring sign-up or account creation.

**AC-3:** Given a visitor clicks "Start a C++ Code Review", When the CTA is activated, Then they are routed to the intake flow (e.g., `/review/new`) where the sales agent begins qualification — no dead ends, broken routes, or auth walls before that point.

**AC-4 (error):** Given a visitor arrives on a slow or degraded connection, When the page begins to render, Then above-the-fold content (headline + CTA) is visible within 3 seconds and no layout shift obscures the primary CTA.

---

## Technical Approach

The landing page is a static or server-rendered route at `/` composed of two primary sections: a hero block and a how-it-works explainer. The hero contains a headline, subheadline, and a single CTA button that deep-links into the agent intake flow. Copy should be written for a technical-manager reader — outcome-focused, not feature-focused (e.g., "Get an expert C++ code review in minutes" rather than "Powered by A2A agents").

The how-it-works section should render the three-step flow (Submit → Preview → Pay & Receive Report) using lightweight visual components — icon + label + short description. No real agent calls or API requests are made on this page; it is purely presentational. Routing for the CTA should be handled via the app router so navigation is instant.

Performance is a first-class concern. All above-the-fold assets should be inlined or preloaded. The CTA button must render without JavaScript as a plain anchor fallback so that visitors on slow connections can still navigate into the intake flow.

| File | Change |
|---|---|
| `src/app/page.tsx` | Root route — composes `HeroSection` and `HowItWorks` |
| `src/components/landing/HeroSection.tsx` | Headline, subheadline, CTA button |
| `src/components/landing/HowItWorks.tsx` | 3-step explainer with icons |
| `src/components/ui/CTAButton.tsx` | Shared primary CTA button, accessible, anchor fallback |
| `src/app/layout.tsx` | Ensure no auth guard wraps the root route |

---

## Interfaces

```typescript
interface HeroProps {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
}

interface HowItWorksStep {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface HowItWorksProps {
  steps: HowItWorksStep[];
}
` ` `

---

## Test Plan

- **Unit:** Render `HeroSection` with mock props — assert headline text, CTA label, and `href` point to `/review/new` (mirrors AC-1 & AC-3).
- **Unit:** Render `HowItWorks` with 3 steps — assert exactly 3 step items render with correct titles (mirrors AC-2).
- **Integration:** Navigate to `/` in a test browser — assert CTA click routes to `/review/new` without a redirect through auth (mirrors AC-3).
- **Performance:** Run Lighthouse on `/` — assert LCP ≤ 3s and CLS = 0 above the fold (mirrors AC-4).
- **Manual:** Open the page with JS disabled — verify the CTA anchor is still visible and navigable.

---

## Out of Scope

- Agent intake flow, sales agent qualification logic, or any A2A communication
- Authentication, sign-up, or user accounts
- Pricing page, blog, or any secondary marketing pages
- Mobile-specific layout breakpoints beyond basic responsiveness
- Analytics or tracking integrations (covered in a separate story)

---

## Done When

- [ ] All ACs pass (tests green)
- [ ] `npm run lint` and `npm run build` pass
- [ ] PR reviewed by owning team
- [ ] Deployed to preview and manually verified
- [ ] CTA routes correctly to `/review/new` in the preview environment
- [ ] Page passes Lighthouse performance audit (LCP ≤ 3s, CLS = 0)
```

> **Note:** The triple backtick closing the `Interfaces` code block is shown as spaced-out characters (` ` ` `) above to avoid breaking the outer code block — replace those with a normal ` ``` ` when you paste.