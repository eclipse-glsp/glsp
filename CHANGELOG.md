# Eclipse GLSP Dev Packages Changelog

## v2.6.0 - active

### Changes

### Potentially Breaking Changes

## [v2.5.0 - 07/09/2024](https://github.com/eclipse-glsp/glsp/releases/tag/v2.5.0)

### Changes

-   [node] Dropped support for node 18 & update minimum requirements for Node to >=20.x [#1564](https://github.com/eclipse-glsp/glsp/pull/1564)
    -   Minimum required TS version is now 5.x

## [v2.4.0 - 04/04/2024](https://github.com/eclipse-glsp/glsp/releases/tag/v2.4.0)

## [v2.3.0 - 23/12/2024](https://github.com/eclipse-glsp/glsp/releases/tag/v2.3.0)

### Changes

-   [node] Dropped support for node 16 & update minimum requirements for Node to >=18.x [#1457](https://github.com/eclipse-glsp/glsp/pull/1457)

## [v2.2.1 - 22/07/2024](https://github.com/eclipse-glsp/glsp/releases/tag/v2.2.1)

### Changes

-   [cli] Contribute the `generateIndex` command to the GLSP CLI. Allows autogeneration of index files in GLSP projects. [#1197](https://github.com/eclipse-glsp/glsp/pull/1197)
-   [cli] Fix version updating of example servers in `release` CLI command. [#1226](https://github.com/eclipse-glsp/glsp/pull/1226)
-   [cli] Refactor and simplify `checkHeader` CLI command. Focus on end year copyright header validation and remove the error-prone validation of the start year. [#1289](https://github.com/eclipse-glsp/glsp/pull/1289)
-   [cli] Contribute the `updateNext` command to the GLSP CLI tool. Allows updating of all dependencies in GLSP projects that are tagged with `next´. [1229](https://github.com/eclipse-glsp/glsp/pull/1299)
-   [ts-config] Update ts target to `ES2019` [#1372](https://github.com/eclipse-glsp/glsp/pull/1372)

## [v2.0.0 - 13/10/2023](https://github.com/eclipse-glsp/glsp/releases/tag/v2.0.0)

### Changes

-   [config] Update all dependencies & peerDependencies of the dev to the latest version [#1136](https://github.com/eclipse-glsp/glsp/pull/1136)
-   [protocol] Removed `Protocol.MD` file. [#892](https://github.com/eclipse-glsp/glsp/pull/982)
    -   The protocol documentation is now maintained on <https://eclipse.dev/glsp/documentation/protocol/>
-   [eslint-config] Tweaked `chai-friendly/no-unused expression` rule to enable `allowTenary` and `allowShortCircuit` options. [#936](https://github.com/eclipse-glsp/glsp/pull/936)
-   [config] Introduce all-in-one [`@eclipse-glsp/dev`](https://www.npmjs.com/package/@eclipse-glsp/dev) meta package. [#842](https://github.com/eclipse-glsp/glsp/pull/842)
-   [cli] Contribute the `checkHeaders` command to validate the copyright year (range) of license headers. [#834](https://github.com/eclipse-glsp/glsp/pull/834)
-   [config] Introduce [`@eclipse-glsp/nyc-config`](https://www.npmjs.com/package/@eclipse-glsp/nyc-config)
    package and the [`@eclipse-glsp/config-test`](https://www.npmjs.com/package/@eclipse-glsp/config-test) meta package. [#755](https://github.com/eclipse-glsp/glsp/pull/755)

    -   Contribute the `coverageReport` command to create a full nyc test coverage report for a lerna/yarn mono repository

-   [cli] Introduce [`@eclipse-glsp/cli`](https://www.npmjs.com/package/@eclipse-glsp/cli)
    package to offer CLI tooling & utility scripts for GLSP projects. [#755](https://github.com/eclipse-glsp/glsp/pull/755) - Contributed on behalf of STMicroelectronics
    -   Contribute the `release` command to prepare & publish a new Github release for a specific GLSP component
-   [deps] Updates dependencies of `@eclipse-glsp/config` and `@eclipse-glsp/config-test` packages to the latest version [#1023](https://github.com/eclipse-glsp/glsp/pull/1023)

### Breaking Changes

-   [node] Update minimum requirements for Node to >=16.11.0 [#829](https://github.com/eclipse-glsp/glsp/pull/829)
-   [config] Typescript is now a peerDependency, a concrete matching Typscript depdendency has to be provided by consuming projects[#1023](https://github.com/eclipse-glsp/glsp/pull/1023)

## [v1.0.0 - 30/06/2022](https://github.com/eclipse-glsp/glsp/releases/tag/v1.0.0)

Inception of the GLSP dev packages.
This project is part of the GLSP umbrella repository and provides common shared development packages for Eclipse GLSP components that are implemented with Typescript.

-   [`@eclipse-glsp/config`](https://www.npmjs.com/package/@eclipse-glsp/config): Meta package for shared build configuration
-   [`@eclipse-glsp/ts-config`](https://www.npmjs.com/package/@eclipse-glsp/ts-config): Shared Typescript configuration for GLSP projects
-   [`@eclipse-glsp/eslint-config`](https://www.npmjs.com/package/@eclipse-glsp/esling-config): Shared ESLint configuration for GLSP projects
-   [`@eclipse-glsp/prettier-config`](https://www.npmjs.com/package/@eclipse-glsp/prettier-config): Shared Prettier configuration for GLSP projects
