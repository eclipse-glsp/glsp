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
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

describe('repo commands — vscode', function () {
    let workDir: string;

    before(function () {
        workDir = createTempDir();

        const cloneResult = runCli(['repo', 'clone', '--preset', 'vscode', '-d', workDir]);
        expect(cloneResult.exitCode, `clone failed:\n${cliDiag(cloneResult)}`).to.equal(0);

        const buildResult = runCli(['repo', 'build', '-d', workDir]);
        expect(buildResult.exitCode, `build failed:\n${cliDiag(buildResult)}`).to.equal(0);
    });

    after(function () {
        cleanupTempDir(workDir);
    });

    it('should build vscode-integration with scoped build', function () {
        const result = runCli(['repo', 'glsp-vscode-integration', 'build', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).to.equal(0);
    });

    it('should package the VS Code extension as VSIX', function () {
        const result = runCli(['repo', 'glsp-vscode-integration', 'package', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).to.equal(0);

        const vsixDir = path.join(workDir, 'glsp-vscode-integration', 'example', 'workflow', 'extension');
        const vsixFiles = fs.readdirSync(vsixDir).filter(f => f.endsWith('.vsix'));
        expect(vsixFiles).to.have.lengthOf.at.least(1);
    });
});
