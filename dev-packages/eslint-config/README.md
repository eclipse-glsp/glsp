# Eclipse GLSP - Shared ESLint configuration

Common shared configuration for Eclipse GLSP components that are using ESLint for linting.

## Install

```bash
yarn add --dev @eclipse-glsp/eslint-config
```

## Usage

**Create an `eslint.config.mjs`**:

```javascript
import glspConfig from '@eclipse-glsp/eslint-config';

export default [
    ...glspConfig,
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                project: 'tsconfig.json'
            }
        }
    }
];
```

Individual config layers can also be imported separately:

```javascript
import baseConfig from '@eclipse-glsp/eslint-config/base';
import warningsConfig from '@eclipse-glsp/eslint-config/warnings';
import errorsConfig from '@eclipse-glsp/eslint-config/errors';
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
