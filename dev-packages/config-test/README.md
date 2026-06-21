# Eclipse GLSP - Shared configuration for testing

Meta package that bundles the shared [Vitest](https://vitest.dev) test configuration and the test
dependencies (Vitest + the V8 coverage provider) for Eclipse GLSP components implemented with Typescript.

The package is available via npm and can be used by all GLSP components implemented with Typescript.

## Components

- [`@eclipse-glsp/vitest-config`](https://www.npmjs.com/package/@eclipse-glsp/vitest-config): Shared Vitest configuration for GLSP projects.

## Install

```bash
pnpm add --save-dev @eclipse-glsp/config-test
```

## Usage

**Create a `vite.config.ts`** that extends the shared config (provided by `@eclipse-glsp/vitest-config`,
pulled in transitively by this package):

```ts
import { glspVitestConfig } from '@eclipse-glsp/vitest-config';

export default glspVitestConfig;
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
