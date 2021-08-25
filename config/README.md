# Eclipse GLSP - Shared configuration [![build-status](https://img.shields.io/jenkins/build?jobUrl=https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp/job/master)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master) [![build-status-server](https://img.shields.io/jenkins/build?jobUrl=https://ci.eclipse.org/glsp/job/deploy-npm-glsp-config/&label=publish)](https://ci.eclipse.org/glsp/job/deploy-npm-glsp-config/)

Common shared configuration for Eclipse GLSP components that are implemented with Typescript. Provides packages that export common configuration objects for:

-   [Typescript](https://www.typescriptlang.org/) (`tsconfig.json`)
-   [ESLint](https://eslint.org/) (`.eslintrc`)
-   [Prettier](https://prettier.io/) (`.prettierc`).

The packages are available via npm and are used by all GLSP components implemented with Typescript.

## Structure

-   `@eclipse-glsp/ts-config`: Shared Typescript configuration for GLSP projects
-   `@eclipse-glsp/eslint-config`: Shared ESLint configuration for GLSP projects
-   `@eclipse-glsp/prettier-config`: Shared Prettier configuration for GLSP projects

## Building

This project is uses `yarn` as package manager and is available from [npm](https://www.npmjs.com/search?q=%40eclipse-glsp).

To build all packages simple execute

```bash
$ yarn
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/). If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
