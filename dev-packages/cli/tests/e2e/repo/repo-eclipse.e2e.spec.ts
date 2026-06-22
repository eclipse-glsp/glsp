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

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cliDiag, runCli } from '../../helpers/cli-helper';
import { isMavenAvailable } from '../../helpers/repo-helper';
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

describe.skipIf(!isMavenAvailable())('repo commands — eclipse', function () {
    let workDir: string;

    beforeAll(function () {
        workDir = createTempDir();

        const cloneResult = runCli(['repo', 'clone', '--preset', 'eclipse', '-d', workDir]);
        expect(cloneResult.exitCode, `clone failed:\n${cliDiag(cloneResult)}`).toBe(0);

        // Build with --no-fail-fast so all repos are attempted even if one fails.
        // The Tycho build for glsp-eclipse-integration/server depends on Eclipse p2
        // mirrors and may not work reliably outside Eclipse CI infrastructure.
        runCli(['repo', 'build', '-d', workDir, '--no-fail-fast']);
    });

    afterAll(function () {
        if (workDir) {
            cleanupTempDir(workDir);
        }
    });

    it('should have built glsp-server with Maven', function () {
        const targetDir = path.join(workDir, 'glsp-server', 'examples', 'org.eclipse.glsp.example.workflow', 'target');
        expect(fs.existsSync(targetDir), 'Maven target directory should exist').toBe(true);
    });

    it('should build glsp-server via scoped command', function () {
        const result = runCli(['repo', 'glsp-server', 'build', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).toBe(0);
    });

    it('should build glsp-eclipse-integration via scoped command', function () {
        const result = runCli(['repo', 'glsp-eclipse-integration', 'build', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).toBe(0);
    });
});
