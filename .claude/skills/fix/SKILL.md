---
name: fix
description: Auto-fix lint, formatting, and copyright-header issues across the workspace, then run the tests to validate. IMPORTANT - Proactively invoke this skill after completing any code changes (new features, bug fixes, refactors) before reporting completion. Re-run it after manually addressing anything it could not auto-fix.
---

Run the auto-fix and validation suite for the GLSP dev-packages monorepo from the repository root.

1. Auto-fix lint, formatting, and copyright headers. Run all three even if an earlier one reports remaining problems (they are independent):

```bash
yarn lint:fix
yarn format
yarn headers:fix -t changes
```

2. Run the test suite to validate behavior (tests are not auto-fixable) — **only if the change touched the CLI package** (`dev-packages/cli`), the only package with tests. Skip this step otherwise:

```bash
yarn test
```

Then:

-   If `yarn lint:fix` reported lint errors it could not fix, or `yarn test` failed, fix them manually and re-run this skill.
-   Otherwise everything is clean (formatting and headers are corrected in place, lint has no remaining errors, tests pass) — report completion.
