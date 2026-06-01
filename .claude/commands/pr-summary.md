Generate a pull request description for the current branch against main.

1. Run `git log --oneline origin/main..HEAD` to list commits unique to this branch.
2. Run `git diff origin/main..HEAD --name-only` to list changed files.
3. Identify the story slug from the branch name or commit messages and read `docs/agent/stories/<slug>.md` if it exists.
4. Write a PR description using this structure:

## Summary

<!-- 1-2 sentences: what changed and why -->

## Links

- **GitHub issue:** closes #ISSUE_NUMBER
- **Story spec:** `docs/agent/stories/<slug>.md`

## Checklist

### Code quality

- [ ] `npm run lint` passes locally
- [ ] `npm test` passes locally
- [ ] `npm run build` passes locally

### Security

- [ ] No secrets, API keys, or credentials in the diff
- [ ] New env vars documented in `.env.example`

## Notes for reviewers

<!-- Tricky parts, deferred work, cross-team changes -->

5. Print the description so the user can paste it into GitHub.
