# Eclipse GLSP - Shared ESLint configuration

Common shared configuration for Eclipse GLSP components that are using ESLint for linting.

## Install

```bash
yarn add --dev @eclipse-glsp/eslint-config
```

## Usage

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

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
