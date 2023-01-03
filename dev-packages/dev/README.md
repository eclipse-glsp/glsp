# Eclipse GLSP - All-in-one dev package

A meta package that includes all shared configuration packages Eclipse GLSP components.
In addition, it also provides the GLSP CLI application

The package is available via npm and can be used by all GLSP components implemented with Typescript.

## Components

-   [`@eclipse-glsp/config`](https://www.npmjs.com/package/@eclipse-glsp/config): Meta package for shared build configuration
    -   [`@eclipse-glsp/ts-config`](https://www.npmjs.com/package/@eclipse-glsp/ts-config): Shared Typescript configuration for GLSP projects
    -   [`@eclipse-glsp/eslint-config`](https://www.npmjs.com/package/@eclipse-glsp/esling-config): Shared ESLint configuration for GLSP projects
    -   [`@eclipse-glsp/prettier-config`](https://www.npmjs.com/package/@eclipse-glsp/prettier-config): Shared Prettier configuration for GLSP projects
-   [`@eclipse-glsp/config-test`](https://www.npmjs.com/package/@eclipse-glsp/config-test): Meta package for shared test configuration
    -   [`@eclipse-glsp/mocha-config`](https://www.npmjs.com/package/@eclipse-glsp/mocha-config): Shared Mocha configuration for GLSP projects
    -   [`@eclipse-glsp/nyc-config`](https://www.npmjs.com/package/@eclipse-glsp/nyc-config): Shared nyc configuration for GLSP projects
-   [`@eclipse-glsp/cli`](https://www.npmjs.com/package/@eclipse-glsp/cli): CLI Tooling & scripts for GLSP projects

## Install

```bash
yarn add --dev @eclipse-glsp/dev
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
