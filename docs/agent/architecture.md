# Architecture Guide

Owned by **Architecture/Design Guild**. Read before touching more than one file or crossing a team boundary.

---

## System Context

compass.tne.ai is an AI-powered technical due diligence assistant for M&A managers evaluating software companies. The platform helps acquirers determine whether a target company's C++ codebase is maintainable and high-quality before committing to a deal.

The system is a **React SPA with no custom backend**. All persistence goes through Firebase Auth + Firestore. Agent logic runs client-side. Stripe handles payment; x402 is the payment-authorization protocol between the Purchasing Agent and the Code Review Agent, communicated via A2A (Agent-to-Agent) protocol.

---

## System Overview

The application is a single-page app running entirely in the browser. There is no custom backend server. All state is persisted in Firestore; identity is managed by Firebase Auth; payments are processed through Stripe.

The entry point is a public landing page that routes the user into a chatbot UI. The chatbot is the primary surface for the entire product — qualification, preview analysis, payment, and post-purchase status all happen inside it. After a paid review completes, a separate report viewer renders the final output and provides a download link.

Inside the chatbot, three agents run client-side and hand off to each other in sequence:

1. The **Sales Agent** owns the conversation from start to finish. It qualifies the user, detects when they paste C++ code, delegates snippet analysis to the Code Review Agent, displays the preview report back in chat, and prompts the user to purchase a full review.
2. The **Purchasing Agent** takes over when the user agrees to buy. It runs the Stripe checkout and issues an x402 payment authorization. Once payment is confirmed, it sends an A2A (Agent-to-Agent) authorization message to the Code Review Agent.
3. The **Code Review Agent** performs all analysis — snippet preview and full repository review. It will not begin a full review until it receives a valid A2A authorization from the Purchasing Agent. After analysis, it writes the report to Firestore, which the Report Viewer reads and makes downloadable.

All three agents read and write to Firestore as their shared state layer. Firestore is the only communication channel between agents and between agents and the UI — there are no direct RPC calls between them except the A2A authorization between Purchasing and Code Review.

---

## User Flow

| Step               | What happens                                                                                            | Agent responsible                    |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 1. Landing         | User arrives at marketing page; CTA enters chatbot                                                      | —                                    |
| 2. Qualification   | Sales Agent converses, determines if C++ repo is in scope                                               | Sales Agent                          |
| 3. Preview         | User pastes a C++ snippet; Sales Agent delegates to Code Review Agent; report returned in chat          | Sales Agent → Code Review Agent      |
| 4. Upsell          | Sales Agent prompts user to purchase a full repository review                                           | Sales Agent                          |
| 5. Payment         | Purchasing Agent runs Stripe checkout + x402 authorization                                              | Purchasing Agent                     |
| 6. A2A handoff     | Purchasing Agent sends signed authorization to Code Review Agent; review blocked until payment verified | Purchasing Agent → Code Review Agent |
| 7. Full review     | User uploads repo (GitHub URL or archive); Code Review Agent performs complete analysis                 | Code Review Agent                    |
| 8. Report delivery | Report written to Firestore, rendered in Report Viewer, made downloadable                               | —                                    |

---

## Core Agents

### Sales Agent

Drives the entire chatbot experience. Responsibilities:

- Conversational qualification (is the target codebase C++? is the scope compatible?)
- Informs user if platform is not a fit
- Detects C++ code in chat and delegates snippet analysis to the Code Review Agent
- Renders the preview report back inside the chatbot UI
- Prompts the user to purchase a full review and hands off to the Purchasing Agent

### Code Review Agent

The analysis engine. Responsibilities:

- Analyzes C++ snippets submitted during preview
- Performs full-repository analysis after payment authorization
- Generates structured reports (memory safety, architectural concerns, maintainability, risk score, acquisition recommendations)
- Does **not** begin full analysis until it receives a valid A2A payment authorization from the Purchasing Agent

### Purchasing Agent

Owns the payment lifecycle. Responsibilities:

- Runs Stripe checkout flow
- Issues x402 payment authorization
- Sends an A2A authorization message to the Code Review Agent
- Coordinates repository access after payment confirmation

---

## Team Ownership

| Team   | Owns          | Responsibilities                                                                |
| ------ | ------------- | ------------------------------------------------------------------------------- |
| Yellow | `src/chat/`   | Landing page, Chatbot UI, Report Viewer, File Upload UI, Sales Agent            |
| Orange | `src/agents/` | Code Review Agent, Purchasing Agent, Stripe integration, x402/A2A logic         |
| Shared | `src/shared/` | Types, Firestore hooks, billing utilities — **both teams must approve changes** |

Do not modify another team's owned directory without their explicit approval in the PR. If you are unsure which team owns a file, check this table before editing.

---

## Cross-Team Boundaries

There are two interaction points between Yellow and Orange. These are the only legal ways to cross the team boundary.

**Yellow → Orange (trigger a snippet review)**
Yellow's Sales Agent invokes the Code Review Agent's public interface to analyze a snippet and get a report back. The contract lives in `src/agents/` and is owned by Orange. Yellow must not reach into implementation files inside `src/agents/`; it only calls the exported public surface.

**Orange → Yellow (signal payment completion)**
Orange's Purchasing Agent writes a transaction record to Firestore. Yellow listens to that record in real time and gates the file upload UI on a confirmed payment status. No direct function call crosses from Orange into Yellow's code.

**Orange ↔ Orange (A2A)**
The Purchasing Agent and Code Review Agent communicate via an x402-signed A2A message. The Code Review Agent verifies the payment record in Firestore before starting a full review. This is an internal Orange concern — Yellow is not involved.

---

## ADRs

| #                                                    | Title                      | Status   |
| ---------------------------------------------------- | -------------------------- | -------- |
| [0001](decisions/0001-use-this-harness-structure.md) | Use this harness structure | Accepted |
