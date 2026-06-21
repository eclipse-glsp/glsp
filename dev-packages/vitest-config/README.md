# Eclipse GLSP - Shared Vitest configuration

Common shared configuration for Eclipse GLSP components that use [Vitest](https://vitest.dev) as their test framework.
Mirrors the test setup of sprotty (the GLSP base project).

## Install

```bash
pnpm add --save-dev @eclipse-glsp/vitest-config
```

## Usage

The package's default export is a ready-to-use flat config (globals, mock auto-restore, v8 coverage,
CI annotations, and an `include` that globs every package's specs). For the common case, the
repository-root `vite.config.ts` is a one-liner:

```ts
export { default } from '@eclipse-glsp/vitest-config';
```

### Customizing

Compose the shared config with the re-exported `mergeConfig` for additive / scalar overrides:

```ts
import glspVitestConfig, { defineConfig, mergeConfig } from '@eclipse-glsp/vitest-config';

export default mergeConfig(
    glspVitestConfig,
    defineConfig({
        test: {
            setupFiles: ['reflect-metadata'], // e.g. for inversify-based DI tests
            testTimeout: 30_000
        }
    })
);
```

> **Note:** `mergeConfig` **concatenates** array fields (e.g. `test.include`, `test.reporters`)
> rather than replacing them. To _replace_ an array — e.g. narrow `include` to a subset, or point it
> at an `e2e` folder — spread the base instead and override the field explicitly:
>
> ```ts
> import glspVitestConfig, { defineConfig } from '@eclipse-glsp/vitest-config';
>
> export default defineConfig({
>     test: {
>         ...glspVitestConfig.test,
>         include: ['tests/e2e/**/*.e2e.spec.ts']
>     }
> });
> ```

### DOM tests

The config is environment-agnostic (Node by default). Specs that render to a DOM (e.g. sprotty
rendering / layout measurement) opt in **per file** with a docblock — and the consumer adds the DOM
implementation to its own dev dependencies, so Node-only repos stay lean:

```ts
/**
 * @vitest-environment happy-dom
 */
import { expect } from 'vitest';
// ...
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
