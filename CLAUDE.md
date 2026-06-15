# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse GLSP shared development tooling monorepo. Contains reusable dev packages (ESLint config, Prettier config, TypeScript config, CLI tools) published to npm under `@eclipse-glsp/*`. This is **not** the GLSP runtime — it provides build/lint/format configurations consumed by other GLSP repositories (glsp-client, glsp-server-node, glsp-theia-integration, etc.).

## Build & Development

- **Package manager**: pnpm — do not use yarn or npm
- **Build**: Run `pnpm install` then `pnpm build` from the repository root to build the entire project
- **CLI**: Run `pnpm glsp` to start the CLI
- Refer to the scripts in the root `package.json` for available build, lint, and format commands

## Validation

- **Tests**: `pnpm test` runs the CLI unit tests (`dev-packages/cli`, the only package with tests)
- After completing any code changes, always run the `/fix` skill before reporting completion. It auto-fixes lint/format/header issues and — when the CLI package changed — runs the tests; manually resolve anything it could not auto-fix (remaining lint errors, test failures) and re-run it.
