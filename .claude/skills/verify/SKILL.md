---
name: verify
description: Run full project validation (lint, format, copyright headers) to catch issues before committing. IMPORTANT - Proactively invoke this skill after completing any code changes (new features, bug fixes, refactors) before reporting completion to the user.
---

Run the full validation suite for the GLSP dev-packages monorepo from the repository root:

```bash
yarn check:all
```

This runs `yarn install && yarn lint && yarn format:check && yarn headers:check` in sequence.


On failure:
1. Report which check failed and the specific errors
2. Auto-fix by invoking the `/fix` skill
3. Re-run `yarn check:all` to confirm everything passes
