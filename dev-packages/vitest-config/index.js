/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for GLSP projects (mirrors the sprotty test setup). Covers the common
 * case as-is — use it directly as a flat repository-root config:
 *
 *     export { default } from '@eclipse-glsp/vitest-config';
 *
 * To customize, compose it with the re-exported `mergeConfig` (additive/scalar overrides) or, when
 * you need to *replace* an array field such as `include`, spread `glspVitestConfig.test` yourself
 * (Vitest's `mergeConfig` concatenates arrays rather than replacing them).
 *
 * - Specs import the test API explicitly (`import { describe, it, expect, vi } from 'vitest'`,
 *   like sprotty), so no ambient globals or extra `vitest/globals` tsconfig variant are needed.
 * - `restoreMocks: true` auto-restores `vi` mocks between tests (replaces Sinon sandboxes).
 * - `include` globs every package's specs (`**​/src/**`), so it works flat from the repo root and
 *   from within a single package, while ignoring non-`src` trees like `tests/e2e`.
 * - Coverage is provided by `@vitest/coverage-v8`.
 * - Specs that need a DOM opt in per-file with a `@vitest-environment happy-dom` docblock (the
 *   consumer adds `happy-dom` to its own dev dependencies).
 * - On GitHub Actions, Vitest's built-in `github-actions` reporter annotates failures inline on the PR.
 */
export default defineConfig({
    test: {
        restoreMocks: true,
        include: ['**/src/**/*.spec.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            include: ['**/src/**/*.{ts,tsx}'],
            exclude: ['**/*.spec.*', '**/test/**', '**/*.d.ts'],
            reporter: ['text-summary', 'html']
        },
        reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : ['default']
    }
});

export { defineConfig, mergeConfig } from 'vitest/config';
