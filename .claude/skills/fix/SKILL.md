---
name: fix
description: Auto-fix all lint, formatting, and copyright header issues across the workspace. Use when validation (`/verify`) fails or when explicitly requested.
---

Run the full auto-fix suite for the GLSP dev-packages monorepo from the repository root:

```bash
yarn fix:all
```

This runs `yarn lint:fix && yarn format && yarn headers:fix` in sequence.

After fixing, report what changed. If any issues remain that couldn't be auto-fixed, list them and suggest manual fixes.
