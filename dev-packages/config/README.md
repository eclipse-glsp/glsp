# Eclipse GLSP - Shared configuration

Common shared configuration for Eclipse GLSP components that are implemented with Typescript.
Provides a meta package that export common configuration objects for:

-   [Typescript](https://www.typescriptlang.org/) (`tsconfig.json`)
-   [ESLint](https://eslint.org/) (`.eslintrc`)
-   [Prettier](https://prettier.io/) (`.prettierrc`).

The package is available via npm and are used by all GLSP components implemented with Typescript. ESLint and prettier are included as direct dependencies.

## Components

-   `@eclipse-glsp/ts-config`: Shared Typescript configuration for GLSP projects
-   `@eclipse-glsp/eslint-config`: Shared ESLint configuration for GLSP projects
-   `@eclipse-glsp/prettier-config`: Shared Prettier configuration for GLSP projects

## Install

```bash
yarn add --dev @eclipse-glsp/config
```

## Usage

### TSConfig

**Create a `tsconfig.json`**:

```json
{
    "extends": "@eclipse-glsp/ts-config/tsconfig.json",
    "compilerOptions": {
        "rootDir": "src",
        "outDir": "lib"
    }
}
```

### ESLint

**Create a `.eslintrc.js`**:

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: '@eclipse-glsp',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json'
    }
};
```

### Prettier

**Add to the `package.json`**:

```json
{
    // ...
    "prettier": "@eclipse-glsp/prettier-config"
}
```

**Or add a `.prettierrc.json` to the workspace root**:

```json
"@eclipse-glsp/prettier-config"
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
