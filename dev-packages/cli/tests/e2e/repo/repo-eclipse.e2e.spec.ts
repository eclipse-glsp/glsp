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
import * as fs from 'fs';
import * as path from 'path';
import { cliDiag, runCli } from '../../helpers/cli-helper';
import { isMavenAvailable } from '../../helpers/repo-helper';
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

describe('repo commands — eclipse', function () {
    let workDir: string;

    before(function () {
        if (!isMavenAvailable()) {
            this.skip();
        }
        workDir = createTempDir();

        const cloneResult = runCli([
            'repo',
            'clone',
            'glsp-client',
            'glsp-server-node',
            'glsp-server',
            'glsp-eclipse-integration',
            '-d',
            workDir
        ]);
        expect(cloneResult.exitCode, `clone failed:\n${cliDiag(cloneResult)}`).to.equal(0);

        const buildResult = runCli(['repo', 'build', '-d', workDir]);
        expect(buildResult.exitCode, `build failed:\n${cliDiag(buildResult)}`).to.equal(0);
    });

    after(function () {
        if (workDir) {
            cleanupTempDir(workDir);
        }
    });

    it('should have built glsp-server with Maven', function () {
        const targetDir = path.join(workDir, 'glsp-server', 'examples', 'org.eclipse.glsp.example.workflow', 'target');
        expect(fs.existsSync(targetDir), 'Maven target directory should exist').to.be.true;
    });

    it('should build glsp-server via scoped command', function () {
        const result = runCli(['repo', 'glsp-server', 'build', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).to.equal(0);
    });

    it('should build glsp-eclipse-integration via scoped command', function () {
        const result = runCli(['repo', 'glsp-eclipse-integration', 'build', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).to.equal(0);
    });
});
