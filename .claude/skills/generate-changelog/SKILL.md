---
name: generate-changelog
description: Generate the changelog entries of a GLSP repository for the PRs merged since its changelog was last generated.
disable-model-invocation: true
---

# Generate changelog

Write the `CHANGELOG.md` entries of one GLSP repository for the PRs merged since the changelog was last generated, review them with the user, and open a PR if they ask for one.

## Setup

- **repo**: the repository from the user's prompt, e.g. `glsp-server`. `<slug>` below is `eclipse-glsp/<repo>`; pass `--repo <slug>` to every `gh` command, since a checkout can have several remotes.
- Work in a worktree of the user's checkout, which sits next to this repository (`../<repo>`; ask if it is missing): `git -C <checkout> fetch origin && git -C <checkout> worktree add --detach <dir> origin/<default>`, `<default>` being the default branch. All paths below are relative to `<dir>`.
- If `CHANGELOG.md` groups each release by component (`### Client`, `### Server`, ...), as in `glsp-core`, read [glsp-core.md](glsp-core.md) before Phase 1: it adds the component rules to the steps below.

## Phase 1: Gather

### Step 1.1: List the pending commits

List the commits since the changelog marker (`<!-- changelog-generated-up-to: <sha> -->` below the title of `CHANGELOG.md`), or since the last release tag if there is no marker yet:

```bash
BASE=$(grep -oP 'changelog-generated-up-to: \K[0-9a-f]+' CHANGELOG.md || git tag --list 'v*' --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1)
HEAD_SHA=$(git rev-parse HEAD)
git log --first-parent --format='%H%x09%an%x09%s' $BASE..$HEAD_SHA
```

Record `HEAD_SHA`: Phase 2 moves the marker to it. Sort every commit into one of three groups; a squash-merged PR ends its subject with `(#<n>)`:

- **covered**: `CHANGELOG.md` already links `<repo>/pull/<n>)`
- **skipped**: author `dependabot[bot]`, a version switch (`Switch to ... -next` or nightly versions), a release commit (`vX.Y.Z`, `Release v...`), or a changelog update (subject contains `update changelog`, or the commit only touches `CHANGELOG.md`)
- **pending**: everything else; these are the PRs to work on

### Step 1.2: Decide each pending PR

Fetch each PR with `gh pr view <n> --repo <slug> --json title,body,labels`; judge a commit without a PR number from `git show <sha>`. Then decide:

- **Entry**: a checked `[x] This PR should be mentioned in the changelog` includes it; a purely CI or metadata change (badges, workflow config) without that box gets none; otherwise include it when users of the repository notice the change. A PR without an entry needs nothing else: moving the marker past it records the decision.
- **Breaking**: the `This PR introduces a breaking change` checkbox decides. Without one, judge from title and body: renames, removals, replacements, migrations and deprecations usually break adopters.
- **Tag**: the closest `[tag]` already used in `CHANGELOG.md`; `[???/best-guess]` if none fits.

**Flag** every decision you are unsure of; Phase 3 puts the flags to the user.

### Step 1.3: Write the entries

```markdown
- [tag] Description [#N](https://github.com/eclipse-glsp/<repo>/pull/N)
- [tag] Description of a change spread over two PRs [#N](https://github.com/eclipse-glsp/<repo>/pull/N) [#M](https://github.com/eclipse-glsp/<repo>/pull/M)
- [tag] Description of a breaking change [#N](https://github.com/eclipse-glsp/<repo>/pull/N)
    - How to migrate
```

- Start with an imperative verb, lowercase after the tag unless it is a proper noun or code element: "Fix a bug that caused...", "Add support for...", "Improve...", "Rename...". Tags are lowercase.
- Rewrite the PR title into one specific line: drop prefixes like `GLSP-1234:` or `fix:`, and turn a bug report into its fix ("Edit label UI does not resize on graph zoom" becomes "Fix edit label UI not resizing on graph zoom").
- A breaking entry says what changed; its sub-items say how to migrate, taken from the PR body.

## Phase 2: Update CHANGELOG.md

1. Add the entries to the `## v<x.y.z> - active` section, under `### Changes` or `### Potentially Breaking Changes`, creating a missing subsection. If the topmost section is a released version, first insert a new section for the next minor version (`v2.6.0` becomes `v2.7.0`) between the title and the first `## ` heading:

    ```markdown
    ## v2.7.0 - active

    ### Changes

    ### Potentially Breaking Changes
    ```

    Drop `### Potentially Breaking Changes` from a new section without breaking entries.

2. Set the marker directly below the `# ` title line to `HEAD_SHA`, replacing an existing one: `<!-- changelog-generated-up-to: HEAD_SHA -->`. Move it even if no PR got an entry: it records that every commit up to `HEAD_SHA` was decided on, and a release starts only once no commit after the marker is pending.
3. If the root `package.json` has a `format` script, run `pnpm install && pnpm format`.

## Phase 3: Review

Show `git diff CHANGELOG.md` and the flagged decisions, and ask the user to resolve the flags and approve. Apply their edits and show the new diff until they approve.

## Phase 4: PR

Open a PR only when the user asks for one, in the prompt or when you ask after approval.

```bash
git ls-remote --heads origin 'changelog-update*'
git checkout -b <branch>
git commit -m "Update changelog" CHANGELOG.md
git push -u origin <branch>
```

`<branch>` is `changelog-update`, or `changelog-update-<n>` with the first `<n>` not on the remote. Fill the repository's `.github/PULL_REQUEST_TEMPLATE.md` if it has one, open the PR with `gh pr create --repo <slug> --title "Update changelog" --body-file <file>`, and report its URL.
