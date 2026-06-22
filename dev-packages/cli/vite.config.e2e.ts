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
import glspVitestConfig, { defineConfig } from '@eclipse-glsp/vitest-config';

// End-to-end tests (`tests/e2e/**/*.e2e.spec.ts`). These spawn child processes (git, clone, build),
// so timeouts are effectively unbounded. Mirrors the former `.mocharc.e2e.json`.
// Spreads the base (not `mergeConfig`) to *replace* `include` — merging would concat and re-add the
// unit globs.
export default defineConfig({
    test: {
        ...glspVitestConfig.test,
        include: ['tests/e2e/**/*.e2e.spec.ts'],
        testTimeout: 600_000,
        hookTimeout: 600_000
    }
});
