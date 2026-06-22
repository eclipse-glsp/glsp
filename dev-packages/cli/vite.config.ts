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
// Unit tests (`src/**/*.spec.ts`) use the shared GLSP Vitest config as-is (Vitest's default 5s
// timeout is ample — the slowest unit test is well under 1s). The e2e tests, which clone and build
// real repos, need the extended timeouts in `vite.config.e2e.ts`.
export { default } from '@eclipse-glsp/vitest-config';
