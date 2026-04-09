---
name: generate-changelog
description: Generate changelog entries from merged PRs since the last release. Fetches PR data, classifies changes as normal or breaking, presents for user review, and optionally creates a PR with the updates.
---

# Changelog Generator

Generate changelog entries by analyzing merged PRs since the last release.

Execute these phases in order:
1. **Data Gathering** — find last release, fetch PRs, classify, generate entries
2. **Changelog Update** — write entries into CHANGELOG.md
3. **Review & Approval** — present the actual diff to the user for review
4. **PR Creation** (optional) — push and create PR, only if the user requests it

---

## Phase 1: Data Gathering

### Step 1.1: Find the latest release tag

Run:
```bash
git tag --sort=-creatordate | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1
```

Record as `LAST_TAG`. Get the tag's date:
```bash
git log -1 --format=%aI $LAST_TAG
```

Record as `TAG_DATE`.

### Step 1.2: Extract category tags from existing CHANGELOG.md

Read `CHANGELOG.md` and extract all unique `[tag]` patterns from changelog entries (pattern: `-   [tag] ...`). Build a deduplicated vocabulary list preserving original casing.

### Step 1.3: Fetch merged PRs since the last release

```bash
gh pr list --state merged --search "merged:>TAG_DATE" --json number,title,author,body,labels,mergedAt --limit 100
```

Use the date portion only from `TAG_DATE` (e.g. `2026-02-09`).

### Step 1.4: Filter PRs

**Skip rules** (in order):
1. PR has the `changelog` label → skip (already tracked in a previous changelog update)
2. Author login is `dependabot` or `dependabot[bot]` → skip
3. Title matches version bump patterns → skip:
   - Starts with `Switch to` and contains `-next`
   - Title is a bare version like `vX.Y.Z`
   - Title starts with `Release v`
4. Title contains `update changelog` (case insensitive) → skip
5. Title is purely CI/metadata (readme badges, workflow config) AND body does NOT contain `[x] This PR should be mentioned in the changelog` → skip

**Override**: If the PR body contains `[x] This PR should be mentioned in the changelog`, always include it regardless of rules 3-5. PRs with the `changelog` label (rule 1) and dependabot PRs (rule 2) are always skipped.

### Step 1.5: Classify each PR

1. If body contains `[x] This PR introduces a breaking change` → **breaking**
2. If body contains `[ ] This PR introduces a breaking change` → **normal**
3. If no checkbox info, analyze title and body:
   - Breaking keywords: "refactor", "rename", "remove", "replace", "migrate", "breaking", "deprecate"
   - Clearly non-breaking (bug fix, docs, minor enhancement) → **normal**
   - Uncertain → flag for user review

### Step 1.6: Assign category tags

Pick the most fitting tag from the vocabulary (Step 1.2) based on PR title and body. If no tag fits, mark as uncertain: `[???/best-guess]`.

### Step 1.7: Generate changelog entries

#### Entry Format

**Normal changes:**
```
-   [tag] Description [#N](https://github.com/OWNER/REPO/pull/N)
```

**Breaking changes** with migration sub-items:
```
-   [tag] Description [#N](https://github.com/OWNER/REPO/pull/N)
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
- PR links are mandatory, full URLs: `[#123](https://github.com/OWNER/REPO/pull/123)`

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
- Remove issue tracker prefixes (e.g. `GLSP-1234:`, `GH-123:`, `ISSUE-456:`)
- Remove conventional commit prefixes: `fix:`, `feat:`, `chore:`
- Rephrase bug-report style to changelog style:
  - BAD: "Edit label UI does not resize on graph zoom"
  - GOOD: "Fix edit label UI not resizing on graph zoom"
- Keep concise — one line

**Breaking changes:**
- Describe what changed, why it's breaking, and how to migrate
- Extract migration sub-items from the PR body's "What it does" section

---

## Phase 2: Changelog Update

### Step 2.1: Determine the version section

Read `CHANGELOG.md` in the repository root.

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

### Step 2.2: Write the updated CHANGELOG.md

Use the Edit tool to update `CHANGELOG.md` directly in the current working tree. Match existing formatting conventions.

---

## Phase 3: Review & Approval

### Step 3.1: Show the diff

```bash
git diff CHANGELOG.md
```

Present the diff to the user.

### Step 3.2: Prompt for uncertain items

List any entries flagged as uncertain (category or breaking status) and ask the user to resolve them.

Even if nothing is uncertain, ask:
> "Does everything look correct, or would you like to adjust any entries?"

### Step 3.3: Collect user feedback

- **Approve as-is** → done (or proceed to Phase 4 if PR was requested)
- **Request edits** → apply changes, show updated diff, ask again
- **Resolve uncertain items** → apply, show updated diff

**Do NOT proceed to Phase 4 unless the user explicitly requests a PR.**

---

## Phase 4: PR Creation (Optional)

Only execute this phase if the user explicitly requests a PR (either in their initial prompt or after reviewing the changelog). If the user hasn't mentioned a PR, ask after approval:
> "Would you like me to create a PR for this changelog update, or are you done?"

### Step 4.1: Determine the branch name

Check if `changelog-update` exists on remote:
```bash
git ls-remote --heads origin changelog-update
```

If it exists, increment: `changelog-update-2`, `changelog-update-3`, etc.

### Step 4.2: Create branch, commit, and push

```bash
git checkout -b BRANCH_NAME
git add CHANGELOG.md
git commit -m "Update changelog"
git push -u origin BRANCH_NAME
```

### Step 4.3: Create the PR

If the repo has a `.github/PULL_REQUEST_TEMPLATE.md`, use its structure to fill in the PR body. Otherwise use a simple body describing the changelog update.

Report the PR URL.

### Step 4.4: Label referenced PRs

Add the `changelog` label to every PR mentioned in the new entries:
```bash
gh pr edit PR_NUMBER --add-label "changelog"
```

Report which PRs were labeled.
