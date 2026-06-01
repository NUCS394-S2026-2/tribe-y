Run the three required checks before any PR or commit: lint, test, and build. Report clearly which passed and which failed. If anything fails, show the relevant error output and suggest a fix. Do not declare the work done until all three pass.

```bash
npm run lint
npm test -- --run
npm run build
```
