# AGENTS.md

## Project Overview

Eclipse GLSP umbrella repository. It contains no source code and no packages; it is the project's documentation hub and central issue tracker:

- `README.md`: entry point and overview of all GLSP repositories
- `PROTOCOL.md`: the GLSP protocol specification
- `MIGRATION_GUIDE.md`: migration guide for adopters
- `WORKFLOW_STATUS.md`: auto-generated CI overview of all GLSP repositories
- `.github/`: org-wide issue templates and the shared release workflows (`prepare-release.yml`, `publish-release.yml`)

The former `dev-packages` (ESLint/Prettier/TypeScript configs, GLSP CLI) have moved to [`glsp-core`](https://github.com/eclipse-glsp/glsp-core).

## Working in this repository

- There is no build, no dependency installation and no test suite; changes are markdown, YAML and JSON only
- Keep markdown/YAML/JSON well-formed; markdownlint settings live in `.vscode/settings.json`
- Changes to dev tooling or the GLSP CLI belong in `glsp-core`, not here
