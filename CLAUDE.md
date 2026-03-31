# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse GLSP shared development tooling monorepo. Contains reusable dev packages (ESLint config, Prettier config, TypeScript config, CLI tools) published to npm under `@eclipse-glsp/*`. This is **not** the GLSP runtime — it provides build/lint/format configurations consumed by other GLSP repositories (glsp-client, glsp-server-node, glsp-theia-integration, etc.).

## Build & Development

-   **Package manager**: Yarn 1.x (classic) — do not use Yarn 2+/Berry or npm
-   **Build**: Run `yarn` from the repository root to build the entire project
-   **CLI**: Run `yarn glsp` to start the CLI
-   Refer to the scripts in the root `package.json` for available build, lint, and format commands

## Validation

-   After completing any code changes, always run the `/verify` skill before reporting completion
-   If verification fails, run the `/fix` skill to auto-fix issues, then re-run `/verify`
