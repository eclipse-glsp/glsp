---
name: releng-next
description: Switch all GLSP repositories from their release version to the next nightly (`-next`) version after a release — fresh-clones every repo, runs `releng prepare next` to open "Switch to nightly" PRs, and optionally polls CI and squash-merges each PR once green.
disable-model-invocation: true
---

# Releng: Switch to Next

Switch every GLSP repository from its release version to the next nightly (`-next`) version by running `releng prepare next` in a fresh clone of each repo, opening one "Switch to nightly" PR per repo, and (optionally) auto-merging each PR after its CI passes.

This skill operates entirely on **fresh clones in a temp directory** — it never touches the user's existing working clones, so no git hygiene (branch/dirty/stale checks) is required.

## Inputs

All inputs are taken from the user's prompt. Use the defaults below for anything not mentioned.

- **target repos** (optional): the user may name one or more specific repos to operate on (e.g. "just `glsp-eclipse-integration`", "only the npm repos"). Only those repos are cloned and processed; everything else is left untouched. This is the mechanism for a **partial run** — most importantly, re-running `glsp-eclipse-integration` on its own once `glsp-server`'s nightly P2 is published (see *Dependency ordering* in Conventions). Default: **all 8 repos**.
- **`auto-merge`** (optional): after all PRs are created, poll each PR's checks and squash-merge it once green. With `auto-merge` the run also goes **end-to-end** — after `glsp-server` merges it waits for the server nightly P2 to publish, then retries and merges the deferred `glsp-eclipse-integration` (Phase 4b). Default: **off**.
- **no-push** (optional): if the user asks to *not push* / run locally / dry-run, pass `--no-push` to `prepare next`. The version bump and `nightly-<version>` commit are made in the temp clone but **nothing is pushed and no PR is created**. Default: **push enabled**.
- **draft** (optional): if the user asks for *draft* PRs, pass `--draft` to `prepare next` so the PRs are created as drafts. Only meaningful when pushing. Default: **non-draft**.
- **Poll interval** (default `60s`) and **overall timeout** (default `60min`): only relevant with `auto-merge`. The user may override these.

### Input interactions

- **no-push + auto-merge** is contradictory — no PRs exist to merge. If both are requested, honor no-push and **skip the auto-merge phase**, telling the user why.
- **draft + auto-merge** is contradictory — a draft PR signals "not ready to merge". If both are requested, create the draft PRs but **do not auto-merge them**; leave them as drafts for manual review and say so.
- **no-push + draft**: draft has no effect (nothing is pushed). Just proceed with no-push.

## Conventions

- Always use the **local** CLI built from this tooling repo: `pnpm glsp …` (never `npx @eclipse-glsp/cli`). The maintainer wants the behavior of the code as it currently stands.
- `releng prepare next` and `releng version` accept `-r/--repoDir <dir>` and `cd` into it internally, so stay in the tooling repo and point `-r` at each temp clone — do not run from inside each repo.
- **Continue-on-error.** Never abort the whole run because one repo failed. Collect outcomes and report them at the end in the four buckets.
- The 8 GLSP repos are: `glsp`, `glsp-client`, `glsp-server-node`, `glsp-theia-integration`, `glsp-vscode-integration`, `glsp-eclipse-integration`, `glsp-server`, `glsp-playwright`.
- Java repos (version lives in a `pom.xml`, not `package.json`): `glsp-server` and `glsp-eclipse-integration`. All others are npm repos.
- **Dependency ordering — `glsp-eclipse-integration` depends on `glsp-server` already being on next.** The Eclipse integration's server module builds (Tycho) against a P2 target platform that points at `https://download.eclipse.org/glsp/server/p2/nightly/<major>.<minor>/` (e.g. `…/nightly/2.8/`). That P2 site only exists once `glsp-server` is on the matching next version **and** its nightly CI has deployed the new P2 repository — which happens only after `glsp-server`'s "Switch to nightly" PR is merged. So running `prepare next` for `glsp-eclipse-integration` before that P2 is live fails at the build step with `No repository found at …/p2/nightly/<major>.<minor>`. Therefore: **always process `glsp-eclipse-integration` last**, and treat that specific error as **⏸️ deferred**, not ❌ failed (Phase 2). With `auto-merge`, the skill unblocks it end-to-end (Phase 4b); without it, the user re-runs the skill for `glsp-eclipse-integration` alone once the P2 is up.

---

## Phase 0: Preconditions

Run from the tooling repo root (`glsp/glsp`).

1. Verify the GitHub CLI is authenticated:
   ```bash
   gh auth status
   ```
   If this fails, stop and tell the user to authenticate `gh` first (they need push rights to the `eclipse-glsp` org).

2. Build the local CLI so `dist/cli.js` is current:
   ```bash
   pnpm install
   ```
   Confirm `pnpm glsp --help` works before continuing.

---

## Phase 1: Fresh checkout

3. Create a dedicated, timestamped temp directory and record its path as `WORKDIR`:
   ```bash
   WORKDIR="${TMPDIR:-/tmp}/glsp-release-next-$(date +%Y%m%d-%H%M%S)"
   mkdir -p "$WORKDIR"
   echo "$WORKDIR"
   ```
   Remember `WORKDIR` — it is printed again at cleanup time and referenced throughout.

4. Clone the target repos fresh into `WORKDIR`, from the real upstream (no fork, so `origin = eclipse-glsp` and pushes/PRs target upstream):
   ```bash
   # full run (default): all 8 repos
   pnpm glsp repo clone --preset all -d "$WORKDIR"

   # partial run: only the repos the user named (repo clone takes positional names)
   pnpm glsp repo clone <repo> [<repo> …] -d "$WORKDIR"
   ```
   Each repo lands at `$WORKDIR/<repo>` on its default branch. If any clone fails, record it as a failure for that repo but continue.

---

## Phase 2: Per-repo prepare-next

Process each cloned repo independently. Track each repo's outcome in one of four buckets:
**✅ PR created** · **⏭️ skipped (already on next)** · **⏸️ deferred (blocked on glsp-server nightly P2)** · **❌ failed (reason)**.

**Processing order:** always process `glsp-eclipse-integration` **last** (after all other targeted repos), because its build depends on `glsp-server`'s next P2 being published — see *Dependency ordering* in Conventions.

For each repo at `$WORKDIR/<repo>`:

### Step 2.1: Precondition — must be on a release version, not already on next

Read the current version directly from the appropriate file:
- npm repos → root `package.json` → `version`
- `glsp-server` → `pom.xml` → first `<version>`
- `glsp-eclipse-integration` → `server/pom.xml` → first `<version>`

If the version ends with `-next` or `.SNAPSHOT`, the repo is **already on next** → **⏭️ skip** it (do not run prepare, do not push anything) and record the reason. Otherwise continue.

### Step 2.2: Run prepare next

Build the command from the resolved inputs:

```bash
pnpm glsp releng prepare next -r "$WORKDIR/<repo>" [--no-push] [--draft]
```

Add `--no-push` if no-push was requested, and `--draft` if draft was requested (draft is ignored by `prepare` when `--no-push` is also set).

This is atomic: version-bump → build → commit a `nightly-<version>` branch → (unless `--no-push`) push → open the "Switch to nightly" PR. The build step is the verification — there is **no separate verify step**.

- If the command **throws** (e.g. build failure, push rejected) → nothing was pushed:
  - **Special case — `glsp-eclipse-integration` whose error contains `No repository found at …/p2/nightly/<major>.<minor>`** → this is the expected upstream-ordering block (the `glsp-server` next P2 is not published yet), **not** a real failure → record **⏸️ deferred**, capture the missing P2 URL and the `<major>.<minor>`. Then:
    - **with `auto-merge`** → it will be unblocked end-to-end in Phase 4b.
    - **without `auto-merge`** → remediation: merge the `glsp-server` "Switch to nightly" PR, wait for its nightly CI to deploy `…/p2/nightly/<major>.<minor>/`, then re-run this skill targeting **only** `glsp-eclipse-integration`.
  - **Any other throw** → record **❌ failed** with the error reason.
  - Continue to the next repo either way.
- If it **succeeds**:
  - **push enabled** → record **✅ PR created** and capture the PR URL (from the command output, or `gh pr list --repo eclipse-glsp/<repo> --head nightly-<version> --json url`). Note whether it is a draft.
  - **no-push** → record **✅ branch prepared (local, not pushed)** with the `nightly-<version>` branch name and the temp-clone path.

---

## Phase 3: Listing checkpoint

After **all** repos have been processed, print a clear summary with the four buckets:

```
✅ PR created                       (or, with no-push: "Branch prepared (local)")
   - <repo>: <pr-url>               (draft PRs marked "(draft)")
   ...                              (no-push: "<repo>: nightly-<version> @ <temp-path>")
⏭️ Skipped (already on next)
   - <repo>: version <x.y.z-next>
   ...
⏸️ Deferred (blocked on glsp-server nightly P2)
   - glsp-eclipse-integration: needs .../p2/nightly/<major>.<minor>/
   ...
❌ Failed
   - <repo>: <reason>
   ...
```

This listing always happens, regardless of `auto-merge` / no-push / draft.

If `glsp-eclipse-integration` landed in **⏸️ deferred** and `auto-merge` is **off**, spell out the remediation in the report: merge the `glsp-server` "Switch to nightly" PR, wait for its nightly CI to publish `…/p2/nightly/<major>.<minor>/`, then re-run this skill targeting only `glsp-eclipse-integration`. (With `auto-merge` on, Phase 4b handles this automatically.)

---

## Phase 4: Auto-merge (only if `auto-merge`)

Skip this phase entirely (and tell the user why) if **no-push** was used (no PRs exist) or if **draft** was used (drafts are left for manual review) — see *Input interactions*.

Operate **per-PR and independently** — merge each PR as soon as its own checks are green; do not wait for the others. Only ever act on the **✅ PR created** bucket here; the **⏸️ deferred** `glsp-eclipse-integration` is handled afterward in Phase 4b (which depends on the `glsp-server` PR merging first).

Loop every **60s** (or the user-specified interval) until every ✅-PR has reached a terminal state or the **60min** (or user-specified) overall timeout elapses. For each not-yet-resolved PR:

```bash
gh pr checks <pr-url>
```

- **All checks green** → squash-merge and delete the branch:
  ```bash
  gh pr merge <pr-url> --squash --delete-branch
  ```
  (No approval step — GLSP repos have no required-review rule.) Mark **merged**.
- **No checks registered yet** (just pushed) → treat as still pending; keep waiting. Never merge a PR before CI has attached.
- **A check failed** → stop watching it; mark **CI failed (not merged)**.
- **Timeout reached** → leave any still-pending PRs open; mark them **timed out (not merged)**.

Never force-merge and never bypass checks.

After the loop, print a final report listing every PR with its terminal state: **merged** / **CI failed** / **timed out** / **pending**.

### Phase 4b: Unblock deferred glsp-eclipse-integration (auto-merge only)

Run this **only** when `auto-merge` is on **and** `glsp-eclipse-integration` is in the **⏸️ deferred** bucket. It is what lets a full auto-merge run finish the entire switch end-to-end.

Preconditions inside this phase:
- The `glsp-server` PR must have **merged** in Phase 4. If it ended `CI failed` / `timed out` / `pending`, eclipse-integration stays **deferred** (its P2 will never appear) — report that and stop here.

Steps (share the same overall timeout as Phase 4):
1. **Wait for the server nightly P2 to publish.** After `glsp-server` merges, its nightly CI deploys `…/p2/nightly/<major>.<minor>/`. Poll that URL every poll-interval until it resolves to a real repository (not a 404):
   ```bash
   curl -sfI "https://download.eclipse.org/glsp/server/p2/nightly/<major>.<minor>/p2.index" >/dev/null && echo up
   ```
   The nightly deploy is not instant — it may take many minutes after merge. If the overall timeout elapses first, leave eclipse-integration **deferred** and report it.
2. **Retry prepare next** for eclipse-integration (same flags as the original run, push enabled):
   ```bash
   pnpm glsp releng prepare next -r "$WORKDIR/glsp-eclipse-integration"
   ```
   - Throws again with the same P2 error → P2 not actually ready; keep polling (step 1) until timeout.
   - Other throw → record **❌ failed**.
   - Succeeds → record **✅ PR created**, capture the PR URL.
3. **Auto-merge the new PR** using the same green-checks → `gh pr merge --squash --delete-branch` logic as Phase 4, within the remaining timeout.

Fold the eclipse-integration outcome into the final Phase 4 report.

---

## Phase 5: Cleanup (always — final step)

Ask the user whether to delete `WORKDIR`. Timing:
- **No `auto-merge`** → ask right after the Phase 3 listing.
- **`auto-merge`** → ask after the Phase 4 merge loop (and Phase 4b, if it ran) finishes.

Always print the `WORKDIR` path so the user can inspect it. If the user declines, leave it in place.

If **no-push** was used, warn before deleting: the prepared `nightly-<version>` branches exist **only** in `WORKDIR` and have not been pushed anywhere — deleting it discards them.

```bash
rm -rf "$WORKDIR"   # only if the user confirms
```
