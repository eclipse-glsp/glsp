# Repository Guidelines

## Project Structure & Module Organization

This repository is a Yarn workspaces monorepo for shared GLSP development tooling.

-   `dev-packages/*`: publishable workspace packages (`cli`, `config`, `config-test`, `eslint-config`, `mocha-config`, `nyc-config`, `prettier-config`, `ts-config`, `dev`).
-   `dev-packages/cli/src`: TypeScript sources for the `glsp` CLI (`commands/` and `util/`).
-   `.github/workflows`: CI, release, and publishing workflows.
-   `docker/` and `releng/`: container and release-engineering assets.
-   Root configs: `eslint.config.mjs`, `tsconfig*.json`, `.prettierrc`, `lerna.json`.

## Build, Test, and Development Commands

Use Node `>=20` and Yarn classic (`>=1.7.0 <2`).

-   `yarn install`: install dependencies and build via `prepare`.
-   `yarn build`: run `lerna run build` across workspaces.
-   `yarn watch`: watch CLI bundle changes.
-   `yarn lint` / `yarn lint:fix`: run ESLint (or auto-fix).
-   `yarn format` / `yarn format:check`: apply/check Prettier formatting.
-   `yarn check:headers`: verify copyright headers against git history.
-   `yarn check:pr`: CI-style local gate (`install`, lint, format check, headers).

## Coding Style & Naming Conventions

-   Language: TypeScript for source code.
-   Formatting: Prettier (`.prettierrc`) with 4-space indentation, single quotes, no trailing commas, LF line endings.
-   JSON/YAML formatting uses 2-space indentation.
-   Linting: ESLint flat config (`eslint.config.mjs`) with GLSP shared rules.
-   Naming: keep command implementations in `dev-packages/cli/src/commands/*.ts`; shared helpers in `dev-packages/cli/src/util/*.ts`.

## Testing Guidelines

There is currently no root `test` script in this repository. Validate contributions with:

-   `yarn build`
-   `yarn lint`
-   `yarn format:check`
-   `yarn check:headers`

For new testable packages, use GLSP shared test config (`@eclipse-glsp/config-test`) and Mocha/nyc conventions (`*.spec.ts`, coverage via `test:coverage`).

## Commit & Pull Request Guidelines

-   Open an issue in `https://github.com/eclipse-glsp/glsp` before coding.
-   Branch naming: `issues/<issue_number>` (example: `issues/123`).
-   Commit messages: imperative subject; issue references are expected (examples in history include `GLSP-1594: ... (#1596)`).
-   Include closing reference with absolute URL, e.g. `closes https://github.com/eclipse-glsp/glsp/issues/241`.
-   PRs should include scope, linked issue, and pass CI; ensure `yarn.lock` has no unintended diff.
-   Ensure Eclipse Contributor Agreement (ECA) requirements are satisfied.
