# Harness Tokens and Harness Instructions

All `ALL_CAPS` placeholders that should be replaced before agents can be fully useful. Replace global tokens first (they appear in multiple files), then per-file tokens.

## Global Setup Tokens

| Token                         | Description                      |
| ----------------------------- | -------------------------------- |
| `TRIBE_NAME`                  | Your tribe/team name             |
| `CLIENT_NAME`                 | Client the app is built for      |
| `WORKING_GROUP_ARCH_DESIGN`   | Architecture & design guild name |
| `WORKING_GROUP_DEV_PRACTICES` | Dev practices guild name         |

## Architecture Tokens

Recommend describing the architecture and ownership in `docs/agent/architecture.md`

## Data Model Tokens

modify `docs/agent/data-model.md` to define the shared `User` type and any other common data structures and how firebase collections are handled and organized.

## Design Tokens

/docs/design.md describes the UI design system and conventions. Fill in the `ALL_CAPS` tokens with your tribe's choices for styling approach, color palette, typography, and any custom components or patterns you want agents to follow.

Additionally, if you tribe is using something like tailwind, you can provide the appropriate snippets. There are also other tools tha can produce this for you. I've had great luck with [google stitch](https://stich.withgoogle.com) for generating the design system and initial design.md; as well as html that can be used for components. Be careful that the components are often using Tailwind 3 and not Tailwind 4. Currently it's free. Alternately, tools like [claude design](https://claude.ai/design/) if you have a claude pro account.

## Testing T

Design your testing strategy and fill in doc/testing.md.

## Per-Story Tokens (fill in for each story spec)

| Token                                                                                 | Description                             |
| ------------------------------------------------------------------------------------- | --------------------------------------- |
| `STORY_TITLE` / `STORY_SLUG`                                                          | Display title and kebab-case identifier |
| `ISSUE_NUMBER`                                                                        | GitHub issue number                     |
| `TEAM_COLOR`                                                                          | Owning team                             |
| `USER_ROLE` / `DESIRED_ACTION` / `BENEFIT`                                            | User story parts                        |
| `GIVEN_CONDITION` / `WHEN_ACTION` / `THEN_OUTCOME`                                    | AC-1 parts (repeat for AC-2, AC-3)      |
| `CHANGE_DESCRIPTION` / `PURPOSE_DESCRIPTION`                                          | File change and new-file purpose        |
| `UNIT_TEST_DESCRIPTION` / `INTEGRATION_TEST_DESCRIPTION` / `MANUAL_VERIFICATION_STEP` | Test plan entries                       |
| `OUT_OF_SCOPE_ITEM`                                                                   | Explicitly excluded item                |
| `ADDITIONAL_DONE_CRITERION`                                                           | Extra done criteria                     |

## Per-ADR Tokens (fill in for each ADR)

| Token                                           | Description                    |
| ----------------------------------------------- | ------------------------------ |
| `GUILD_OR_TEAM_NAME`                            | ADR decider(s)                 |
| `CONTEXT_DESCRIPTION`                           | Situation forcing the decision |
| `DECISION_DESCRIPTION`                          | What was decided and why       |
| `POSITIVE_CONSEQUENCE` / `NEGATIVE_CONSEQUENCE` | Trade-off summary              |
| `FOLLOWUP_ITEM`                                 | Required follow-up action      |

---

## How to Find and Replace Tokens

### VS Code (recommended for initial setup)

**See all remaining tokens at once:**

1. Open Search: `⌘⇧F` (Mac) / `Ctrl+Shift+F` (Windows/Linux)
2. Enter `[A-Z_]{5,}` in the search box
3. Click the `.*` button to enable **Use Regular Expression**
4. Set **files to include** to `docs/**` to limit scope

**Replace a single token across all files:**

1. Open Find & Replace: `⌘⇧H` (Mac) / `Ctrl+Shift+H` (Windows/Linux)
2. Enable `.*` (regex) if needed; enter the token in **Find**, your value in **Replace**
3. Set **files to include** to `docs/**`
4. Click the **Replace All** button (or `⌥↵` / `Alt+Enter`) — VS Code will show a confirmation dialog with the match count before replacing

### macOS / Linux Command Line

Find all occurrences of a token:

```bash
grep -r "TRIBE_NAME" docs/
```

Replace in all markdown files (macOS):

```bash
find docs -name "*.md" -exec sed -i '' 's/TRIBE_NAME/YourTribeName/g' {} +
```

Replace in all markdown files (Linux):

```bash
find docs -name "*.md" | xargs sed -i 's/TRIBE_NAME/YourTribeName/g'
```

List all remaining unreplaced tokens:

```bash
grep -roh '[A-Z_]\{5,\}' docs/agent/ | sort -u
```

### Windows (PowerShell)

Find all occurrences of a token:

```powershell
Get-ChildItem -Path docs -Recurse -Filter "*.md" | Select-String "TRIBE_NAME"
```

Replace a token in all markdown files:

```powershell
Get-ChildItem -Path docs -Recurse -Filter "*.md" | ForEach-Object {
  (Get-Content $_.FullName) -replace 'TRIBE_NAME', 'YourTribeName' | Set-Content $_.FullName
}
```

List all remaining unreplaced tokens:

```powershell
Get-ChildItem -Path docs\agent -Recurse -Filter "*.md" |
  Select-String -Pattern '[A-Z_]{5,}' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
```
