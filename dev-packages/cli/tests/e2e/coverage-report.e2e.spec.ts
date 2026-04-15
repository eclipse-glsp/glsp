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

import { expect } from 'chai';
import * as path from 'path';
import { runCli } from '../helpers/cli-helper';
import { shallowClone } from '../helpers/clone-helper';
import { cleanupTempDir } from '../helpers/test-helper';

describe('coverageReport e2e', () => {
    it('should error for non-existent project root', () => {
        const result = runCli(['coverageReport', '--projectRoot', '/non/existent/path']);
        expect(result.exitCode).to.not.equal(0);
    });

    it('should error for non-existent coverage script', () => {
        const repoDir = shallowClone('glsp-client');
        try {
            const result = runCli(['coverageReport', '--projectRoot', repoDir, '--coverageScript', 'nonexistent:script']);
            expect(result.exitCode).to.not.equal(0);
        } finally {
            cleanupTempDir(path.dirname(repoDir));
        }
    });
});
