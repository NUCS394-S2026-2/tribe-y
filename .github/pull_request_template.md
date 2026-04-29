## Summary

<!-- One or two sentences describing what this PR does and why. -->

## Links

- **GitHub issue:** closes #ISSUE_NUMBER
- **Story spec:** `docs/agent/stories/STORY_SLUG.md`

## Checklist

### Spec alignment

- [ ] I read the story spec before writing code
- [ ] The story spec reflects what was actually built (update it in-flight if it drifted)
- [ ] All acceptance criteria in the spec are addressed

### Code quality

- [ ] `npm run lint` passes locally
- [ ] `npm test` passes locally
- [ ] `npm run build` passes locally (TypeScript strict + Vite build)

### Tests

- [ ] New behavior has unit or integration tests
- [ ] Test names mirror the Given/When/Then acceptance criteria in the story spec
- [ ] No tests were deleted or skipped to make the suite pass

### Ownership and review

- [ ] The owning team for all modified files has reviewed this PR, **or** this PR _is_ the owning team making changes to their own slice
- [ ] Cross-team boundary changes (touching another team's directories) are explicitly called out below

### Security

- [ ] No secrets, API keys, or credentials are included in the diff
- [ ] Any new environment variables are documented in `.env.example`

## Cross-team boundary changes (if any)

<!-- If you touched files owned by another team, explain why and confirm they approved. -->

## Notes for reviewers

<!-- Anything else reviewers should know: tricky parts, deferred work, follow-up issues. -->
