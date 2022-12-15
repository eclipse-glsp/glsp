# Eclipse GLSP - Shared configuration for testing

Common shared configuration for testing Eclipse GLSP components that are implemented with Typescript.
Provides a meta package that export common configuration objects for:

-   [Mocha](https://www.typescriptlang.org/) (`tsconfig.json`)
-   [ESLint](https://eslint.org/) (`.eslintrc`)
-   [Prettier](https://prettier.io/) (`.prettierrc`).

The package is available via npm and are used by all GLSP components implemented with Typescript.
Mocha and nyc are included as direct dependencies.

## Components

-   `@eclipse-glsp/mocha`: Shared Mocha configuration for GLSP projects
-   `@eclipse-glsp/nyc`: Shared nyc configuration for GLSP projects

## Install

```bash
yarn add --dev @eclipse-glsp/config-test
```

## Usage

### Mocha

**Create a `.mocharc.json`**:

```json
{
    "$schema": "https://json.schemastore.org/mocharc",
    "extends": "@eclipse-glsp/mocha-config"
}
```

### Nyc

**Add a `.nycrc.json` to your project root**:

```json
"@eclipse-glsp/prettier-config"
```

Configuration can also be provided by `nyc.config.js` if programmed logic is required.

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
