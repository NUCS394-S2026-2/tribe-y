# Naming Conventions and Approach

## Our Philosophy
As a lean team relying heavily on AI coding agents (Claude, Copilot), strict adherence to naming conventions is critical. Consistency prevents hallucinated imports, reduces cognitive load, and ensures that our AI tools can predict file and component names accurately. 

Names should be **intention-revealing** and **searchable**. We optimize for readability over brevity.

## Global Casing Rules

| Element | Case Style | Example |
| :--- | :--- | :--- |
| **Files & Directories** | `kebab-case` | `sales-bot.ts`, `components/ui/` |
| **React Components** | `PascalCase` | `PaymentModal.tsx`, `CodeReviewSnippet.tsx` |
| **TS Interfaces & Types** | `PascalCase` | `UserAccount`, `TransactionReceipt` |
| **Functions & Methods** | `camelCase` | `fetchExpertReview()`, `calculateTokens()` |
| **Variables & Instances** | `camelCase` | `currentUser`, `isPaymentVerified` |
| **Constants & Env Vars** | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE`, `FIREBASE_API_KEY` |

## Specific Guidelines

### 1. Files and Directories
* All file names and directory names must be entirely lowercase and use dashes to separate words (`kebab-case`). 
* **Exception:** React component files should match the component name exactly (`PascalCase.tsx`).
* *Why?* This prevents case-sensitivity issues between Windows (local development) and Linux (Firebase/GitHub Actions CI environments).

### 2. React Components
* Components are nouns or noun phrases (`SalesAgentChat`, not `ChattingWithSalesAgent`).
* Use `.tsx` extensions for all files containing JSX.

### 3. TypeScript Interfaces and Types
* Use `PascalCase`.
* **Do not** prefix interfaces with an "I" (e.g., use `User`, not `IUser`). 
* Append the word `Type` or `State` only if it resolves an naming conflict, but prefer domain-specific nouns (e.g., `A2ATransactionResponse`).

### 4. Variables and Functions
* **Booleans:** Must be prefixed with `is`, `has`, `should`, or `can` (e.g., `isLoggedIn`, `hasPaid`).
* **Functions:** Must begin with an action verb (e.g., `get...`, `set...`, `handle...`, `fetch...`). Event handlers should be prefixed with `handle` (e.g., `handlePaymentSubmit`).

### 5. Domain-Specific Language (compass.tne.ai)
To ensure we maintain the client's vocabulary, we standardize the following terms in our codebase:
* **Expert:** Refers to the technical agent performing the review (e.g., the C++ Agent).
* **Salesbot:** Refers to the initial conversational agent.
* **A2A:** Used as a prefix/acronym for Agent-to-Agent interactions.
* **VaultReceipt:** The artifact returned to the user after an X.402 payment.

*(Written and agreed upon by the Architecture / Design Guild)*
