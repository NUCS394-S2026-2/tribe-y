# Story: Landing Page

**Slug:** `landing-page`
**Team:** Yellow
**GitHub issue:** #2
**Status:** Ready

## User Story

As a Technical Manager, I want to see a clear marketing page for compass.tne.ai so I know what the service offers and how to start a review.

## Acceptance Criteria

**AC-1**

- Given: I navigate to `/`
- When: the page loads
- Then: I see a headline, subheadline, and a "Start with Salesbot" CTA button

**AC-2**

- Given: I am on the landing page
- When: I click "Start with Salesbot"
- Then: I am navigated to `/chat`

**AC-3**

- Given: I am on the landing page
- When: I inspect with a screen reader
- Then: All text has sufficient contrast (WCAG AA), interactive elements have visible focus, and feature cards have meaningful content

## Files

- `src/chat/LandingPage.tsx` — component
- `src/chat/LandingPage.module.css` — styles

## Test Plan

- Unit: renders headline, renders CTA button, CTA navigates to `/chat`
- Manual: verify contrast, focus ring on CTA, feature cards readable
