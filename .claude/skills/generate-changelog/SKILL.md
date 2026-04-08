---
name: generate-changelog
description: Generate changelog entries from merged PRs since the last release. Fetches PR data, classifies changes as normal or breaking, presents for user review, and creates a PR with the updates.
disable-model-invocation: true
---

# GLSP Changelog Generator

Generate changelog entries by analyzing merged PRs since the last release.

Execute these phases in order:
1. **Data Gathering** — find last release, fetch PRs, classify, generate entries
2. **Changelog Update** — create worktree, write entries into CHANGELOG.md
3. **Review & Approval** — present the actual diff to the user for review
4. **PR Creation** — push and create PR (only after user approves)

---

## Phase 1: Data Gathering

### Step 1.1: Determine repository info

Use the current working directory as the repository. Derive:
- `REPO_DIR`: the repository root (find via `git rev-parse --show-toplevel`)
- `REPO_NAME`: the directory name (e.g. `glsp-client`)
- `GH_REPO`: the GitHub identifier `eclipse-glsp/REPO_NAME`

### Step 1.2: Find the latest release tag

Run:
```bash
git tag --sort=-creatordate | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1
```

Record as `LAST_TAG`. Get the tag's date:
```bash
git log -1 --format=%aI $LAST_TAG
```

Record as `TAG_DATE`.

### Step 1.3: Extract category tags from existing CHANGELOG.md

Read `CHANGELOG.md` and extract all unique `[tag]` patterns from changelog entries (pattern: `-   [tag] ...`). Build a deduplicated vocabulary list preserving original casing.

### Step 1.4: Fetch merged PRs since the last release

```bash
gh pr list --repo GH_REPO --state merged --search "merged:>TAG_DATE" --json number,title,author,body,labels,mergedAt --limit 100
```

Use the date portion only from `TAG_DATE` (e.g. `2026-02-09`).

### Step 1.5: Filter PRs

**Skip rules** (in order):
1. Author login is `dependabot` or `dependabot[bot]` → skip
2. Title matches version bump patterns → skip:
   - Starts with `Switch to` and contains `-next`
   - Title is a bare version like `vX.Y.Z`
   - Title starts with `Release v`
3. Title contains `update changelog` (case insensitive) → skip
4. Title is purely CI/metadata (readme badges, workflow config) AND body does NOT contain `[x] This PR should be mentioned in the changelog` → skip

**Override**: If the PR body contains `[x] This PR should be mentioned in the changelog`, always include it regardless of rules 2-4. Dependabot PRs are always skipped.

### Step 1.6: Classify each PR

1. If body contains `[x] This PR introduces a breaking change` → **breaking**
2. If body contains `[ ] This PR introduces a breaking change` → **normal**
3. If no checkbox info, analyze title and body:
   - Breaking keywords: "refactor", "rename", "remove", "replace", "migrate", "breaking", "deprecate"
   - Clearly non-breaking (bug fix, docs, minor enhancement) → **normal**
   - Uncertain → flag for user review

### Step 1.7: Assign category tags

Pick the most fitting tag from the vocabulary (Step 1.3) based on PR title and body. If no tag fits, mark as uncertain: `[???/best-guess]`.

### Step 1.8: Generate changelog entries

#### Entry Format

**Normal changes:**
```
-   [tag] Description [#N](https://github.com/eclipse-glsp/REPO_NAME/pull/N)
```

**Breaking changes** with migration sub-items:
```
-   [tag] Description [#N](https://github.com/eclipse-glsp/REPO_NAME/pull/N)
    -   Migration detail 1
    -   Migration detail 2
```

**Multiple PRs for the same change:**
```
-   [tag] Description [#N](url) [#M](url)
```

#### Style Guide

**Formatting:**
- Entry prefix: `-   ` (dash + exactly 3 spaces)
- Sub-item indent: 4 spaces + `-   ` (4 spaces from parent dash)
- Sub-sub-item indent: 8 spaces + `-   `
- Single space between `[tag]` and description text
- Single space before PR link at end of line
- PR links are mandatory, full URLs: `[#123](https://github.com/eclipse-glsp/REPO_NAME/pull/123)`

**Wording:**
- Always start with a **present tense imperative verb** (not past tense)
- Common verbs: Fix, Improve, Add, Update, Extend, Ensure, Introduce, Remove, Refactor, Rename, Provide, Allow, Support
- **Bug fixes**: "Fix a bug that caused/prevented...", "Fix X behavior"
- **Features**: "Introduce...", "Add support for...", "Provide..."
- **Enhancements**: "Improve...", "Extend...", "Ensure that..."
- **Refactors**: "Refactor...", "Rework...", "Rename..."
- Be specific — never "Fix various issues"

**Capitalization:**
- Tags are always lowercase: `[diagram]`, not `[Diagram]`
- Description starts lowercase after the tag (unless proper noun or code element)
- Section headers: Title Case (`### Potentially Breaking Changes`)

**Description cleanup from PR title:**
- Remove prefixes: `GLSP-1234:`, `GH-123:`, `fix:`, `feat:`, `chore:`
- Rephrase bug-report style to changelog style:
  - BAD: "Edit label UI does not resize on graph zoom"
  - GOOD: "Fix edit label UI not resizing on graph zoom"
- Keep concise — one line

**Breaking changes:**
- Describe what changed, why it's breaking, and how to migrate
- Extract migration sub-items from the PR body's "What it does" section

---

## Phase 2: Changelog Update

### Step 2.1: Create a git worktree

Determine the main branch:
```bash
git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'
```

Fetch latest and create worktree:
```bash
git fetch origin
git worktree add REPO_DIR-changelog-update origin/MAIN_BRANCH
```

All subsequent file operations happen in the worktree.

### Step 2.2: Determine the version section

Read `CHANGELOG.md` in the worktree.

**Active section detection:**
- An active section has the `- active` suffix (e.g. `## v2.7.0 - active`)
- If an active section exists → merge new entries into it
- If the topmost section is a released version (no `- active` suffix) → create a new active section above it

**Creating a new section:**
- Bump the minor version of `LAST_TAG` (e.g. `v2.6.0` → `v2.7.0`)
- Insert after the title line, before the first `## ` heading:

```markdown
## v2.7.0 - active

### Changes

-   [tag] Entry [#N](url)

### Potentially Breaking Changes

-   [tag] Entry [#N](url)
    -   Sub-item detail
```

Only include "Potentially Breaking Changes" if there are breaking entries.

**Merging into existing active section:**
- Check PR numbers against existing entries to avoid duplicates
- Append new entries to the appropriate subsection
- Create missing subsections as needed

### Step 2.3: Write the updated CHANGELOG.md

Use the Edit tool. Match existing formatting conventions.

---

## Phase 3: Review & Approval

### Step 3.1: Show the diff

```bash
git -C WORKTREE_DIR diff CHANGELOG.md
```

Present the diff to the user.

### Step 3.2: Prompt for uncertain items

List any entries flagged as uncertain (category or breaking status) and ask the user to resolve them.

Even if nothing is uncertain, ask:
> "Does everything look correct, or would you like to adjust any entries?"

### Step 3.3: Collect user feedback

- **Approve as-is** → proceed to Phase 4
- **Request edits** → apply changes, show updated diff, ask again
- **Resolve uncertain items** → apply, show updated diff

**Do NOT proceed to Phase 4 until the user explicitly approves.**

---

## Phase 4: PR Creation

### Step 4.1: Determine the branch name

Check if `changelog-update` exists on remote:
```bash
git -C WORKTREE_DIR ls-remote --heads origin changelog-update
```

If it exists, increment: `changelog-update-2`, `changelog-update-3`, etc.

### Step 4.2: Create branch, commit, and push

```bash
cd WORKTREE_DIR
git checkout -b BRANCH_NAME
git add CHANGELOG.md
git commit -m "Update changelog"
git push -u origin BRANCH_NAME
```

### Step 4.3: Create the PR

Use the repo's `.github/PULL_REQUEST_TEMPLATE.md` structure:

```bash
gh pr create --repo GH_REPO --title "Update changelog" --body "$(cat <<'EOF'
#### What it does
Updates the changelog with entries for PRs merged since the last release (LAST_TAG).

#### How to test
Review the changelog entries for accuracy.

#### Follow-ups
None.

#### Changelog

-   [ ] This PR should be mentioned in the changelog
-   [ ] This PR introduces a breaking change
EOF
)"
```

Report the PR URL.

### Step 4.4: Label referenced PRs

Add the `changelog` label to every PR mentioned in the new entries:
```bash
gh pr edit PR_NUMBER --repo GH_REPO --add-label "changelog"
```

Report which PRs were labeled.

### Step 4.5: Clean up the worktree

```bash
git -C REPO_DIR worktree remove REPO_DIR-changelog-update
```

Report completion with PR URL and labeled PRs.
