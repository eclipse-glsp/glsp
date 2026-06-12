# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eclipse GLSP shared development tooling monorepo. Contains reusable dev packages (ESLint config, Prettier config, TypeScript config, CLI tools) published to npm under `@eclipse-glsp/*`. This is **not** the GLSP runtime — it provides build/lint/format configurations consumed by other GLSP repositories (glsp-client, glsp-server-node, glsp-theia-integration, etc.).

## Build & Development

-   **Package manager**: pnpm 10 — do not use yarn or npm
-   **Build**: Run `pnpm install` from the repository root to install and build the entire project
-   **CLI**: Run `pnpm glsp` to start the CLI
-   Refer to the scripts in the root `package.json` for available build, lint, and format commands

## Validation

-   After completing any code changes, always run the `/verify` skill before reporting completion
-   If verification fails, run the `/fix` skill to auto-fix issues, then re-run `/verify`
