# Eclipse GLSP - Shared ESLint configuration

Common shared configuration for Eclipse GLSP components that are using ESLint for linting.

## Install

```bash
$ yarn add --dev @eclipse-glsp/eslint-config
```

## Usage

**Create a `.eslintrc.js`**:

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: "@eclipse-glsp",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "tsconfig.json",
    },
};
```

## Usage without prettier

The default shared ESLint configuration is expected to be used in combination with [Prettier](https://prettier.io/).
As a consequence all stylistic rules that might conflict with Prettier haven been disabled.
We provide an additional `no-prettier` configuration that can be used for projects that don't use Prettier.

**Create a `.eslintrc.js`**:

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
    extends: "@eclipse-glsp/eslint-config/no-prettier",
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: "tsconfig.json",
    },
};
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/). If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
