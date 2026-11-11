---
name: release
description: Release one or more GLSP repositories, from the preconditions to the switch to the next development version.
disable-model-invocation: true
---

# Release

Drive a GLSP release. Two CLI commands own the steps that must be exact: `prepare` opens the release PR, `tag` pushes the signed tag that publishes. Everything else is reading GitHub and deciding what comes next, which is your part.

The **gate** of every release is the merge of its release PR by a committer: announce PRs and wait; merging stays with the committer. Behind the gate, the publishing workflows reject a tag that is unsigned, does not match the version, or has no green CI, and the registries refuse a version that already exists. A wrong move on your side therefore costs a retry, not a broken release.

## Inputs

From the user's prompt:

- **repos**: the repositories to release. "All" means the whole **train** (see below).
- **version type**: `major`, `minor`, `patch`, or `custom <version>`. Default `minor`.
- **owner**: a fork owner for a **rehearsal**; default `eclipse-glsp`.

## Setup

- Work in a worktree of the user's checkout of each repo, which sits next to this repository (`../<repo>`; ask if it is missing): `git -C <checkout> fetch origin && git -C <checkout> worktree add --detach <dir> origin/<default>`. `<slug>` below is `<owner>/<repo>`, `<default>` its default branch.
- In a rehearsal, clone the fork instead (`gh repo clone <owner>/<repo> <dir>`): a worktree shares the checkout's `origin`, and the CLI pushes to `origin`.
- Before each CLI command, reset `<dir>`: `git fetch origin && git checkout -f --detach origin/<default> && git clean -fd`.
- Run the CLI of the `glsp-core` directory from the setup, so it matches the release: build it once with `pnpm -C <core-dir> install && pnpm -C <core-dir>/dev-packages/cli build`, then run `node <core-dir>/dev-packages/cli/bin/glsp.js releng <command> -r <dir>`, written `glsp` below. Releasing `glsp-core` rebuilds it in place, which is fine.

## The train

Release dependencies first: each repo needs the ones above it on npm or p2 in the same version.

1. `glsp-core`
2. `glsp-theia-integration` and `glsp-vscode-integration` (need `glsp-core`)
3. `glsp-server`
4. `glsp-eclipse-integration` (needs `glsp-core` and `glsp-server`)

The release PR of `glsp-theia-integration` also updates the Theia compatibility table in `README.md`; check it in the review.

Work on independent repos in parallel. Keep a checklist of repos and their phase in your replies so the user sees the whole train.

## Per repo

Find the phase from GitHub, act, and loop until the repo is done. `<version>` is the release version, e.g. `2.9.0`.

| Phase | How you see it | Action |
| --- | --- | --- |
| **idle** | The default branch is on `<version>-next`, no open PR from `release-v*` | Resolve every precondition (below), then `glsp prepare <type>` |
| **pr-open** | `gh pr list --repo <slug> --head release-v<version>` | Red checks: Failures. Green: ask the committer to review and **squash merge** the PR |
| **merged** | The PR is merged, `gh api repos/<slug>/git/ref/tags/v<version>` is a 404 | Wait for green CI on the merge commit, tell the user, then `glsp tag <version>` |
| **publishing** | `gh run list --repo <slug> --event push --branch v<version>`: the runs the tag started | Red runs: Failures |
| **published** | All of these runs are green | `glsp prepare next`, then ask the committer to merge the `nightly-*` PR |

The repo is done when its `nightly-*` PR is merged. Report the GitHub release, the publishing runs and the switch PR.

- Run `prepare` in the background: it builds the repo. `tag` signs with the user's key and can prompt for its passphrase in the foreground; tell the user before you run it. `tag` skips what already exists, so rerun it after any failure. If `prepare` fails after pushing `release-v<version>` (or `nightly-*`), delete that remote branch before you rerun it.
- To wait, run a watcher in the background and come back when it exits: `gh pr checks <n> --repo <slug> --watch`, `gh run watch <id> --repo <slug>`, or for a merge `until [ "$(gh pr view <n> --repo <slug> --json state -q .state)" = MERGED ]; do sleep 60; done`.
- `glsp-eclipse-integration` builds against the server's nightly p2 site, so it switches to next only after the `glsp-server` switch PR is merged and `https://download.eclipse.org/glsp/server/p2/nightly/<major>.<minor>/p2.index` exists for the new version.

## Preconditions

Check each of these before `prepare` and resolve what fails:

- **Changelog up to date**: run Step 1.1 of the [generate-changelog skill](../generate-changelog/SKILL.md) in `<dir>`. If a commit is pending, follow that skill through its review with the user and its PR, wait for the merge, and check again.
- **Changelog section**: `CHANGELOG.md` has `## v<version> - active`. A missing one usually means the version type does not match the planned release; confirm the version with the user.
- **CI**: the latest push runs on the default branch are green (`gh run list --repo <slug> --branch <default> --event push`). Diagnose red ones like a failure; a release starts from a green branch.
- **Not released yet**: no tag `v<version>` and no open `release-v*` PR. If one exists, continue that release at its phase instead.
- **Dependencies**: the repos it needs (see The train) are published in `<version>`. Otherwise release that repo first.
- **Environment**: push access to `<slug>`, `git config user.signingkey` set and registered on GitHub as a signing key, and the build toolchain (Node and pnpm; Java and Maven for `glsp-server` and `glsp-eclipse-integration`). Name the fix and let the user apply it.

## Failures

For each red run, find the cause before proposing anything: `gh run view <id> --repo <slug> --log-failed`.

- **Flaky** (network, runner, timeout without a code cause): re-run the failed jobs once with `gh run rerun <id> --repo <slug> --failed` and tell the user.
- **Real** (a build, test or workflow error): report the cause and a proposed fix to the user. A fix for an open release PR goes onto its `release-v<version>` branch; anything else goes through a normal PR to the default branch.
- **Tag rejected** (unsigned, wrong commit, red CI): the workflow log names the reason. Fix it, delete the tag with `git push origin --delete v<version>` if it is wrong, and rerun `glsp tag <version>`.

## Rehearsal

With a fork owner, clone the fork: the release PR, merge, tag and GitHub release are real there. The fork needs Actions enabled so the release PR gets CI. The publishing workflows skip on forks, so the rehearsal ends after `tag`; report there. For a run without any side effect, use `glsp prepare <type> --no-push` and `glsp tag <version> --dry-run`.
