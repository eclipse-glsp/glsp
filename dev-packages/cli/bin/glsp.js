#!/usr/bin/env node
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
// Stable launcher committed to the repository so the `glsp` bin symlink can
// always be created at install time. The actual CLI is the esbuild bundle in
// `dist/`, which is a build artifact and may not exist yet on a fresh checkout.
const path = require('path');
const distEntry = path.join(__dirname, '..', 'dist', 'cli.js');

try {
    require(distEntry);
} catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && error.message.includes(distEntry)) {
        console.error("The GLSP CLI has not been built yet. Run 'pnpm build' in the @eclipse-glsp/cli package first.");
        process.exit(1);
    }
    throw error;
}
