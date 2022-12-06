# Eclipse GLSP - Dev Packages [![build-status](https://img.shields.io/jenkins/build?jobUrl=https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp/job/master)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master) [![build-status-server](https://img.shields.io/jenkins/build?jobUrl=https://ci.eclipse.org/glsp/job/deploy-npm-glsp-config/&label=publish)](https://ci.eclipse.org/glsp/job/deploy-npm-glsp-config/)

Common shared development packages for Eclipse GLSP components that are implemented with Typescript.

## Components

-   [`@eclipse-glsp/cli`](./cli/README.md): Provides helpful scrips and commands for developing glsp components as well as release engineering.
-   [`@eclipse-glsp/config`](./config/README.md): Provides a meta package that export common configuration objects for:
    -   [Typescript](https://www.typescriptlang.org/) (`tsconfig.json`)
    -   [ESLint](https://eslint.org/) (`.eslintrc`)
    -   [Prettier](https://prettier.io/) (`.prettierrc`).
    -   [Mocha](https://mochajs.org/) (`.mocharc.json`).

The packages are available via npm and are used by all GLSP components implemented with Typescript.

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
