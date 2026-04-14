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
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { runCli } from '../helpers/cli-helper';
import { createTempGitRepo } from '../helpers/git-helper';
import { cleanupTempDir } from '../helpers/test-helper';

describe('updateNext e2e', () => {
    let repoDir: string;

    beforeEach(() => {
        repoDir = createTempGitRepo();
    });

    afterEach(() => {
        cleanupTempDir(repoDir);
    });

    it('should warn about uncommitted changes in root package.json', () => {
        const pkgPath = path.join(repoDir, 'package.json');
        fs.writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.0', private: true, workspaces: [] }, undefined, 2));
        execSync('git add . && git commit -m "add package.json"', { cwd: repoDir });
        fs.writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.1', private: true, workspaces: [] }, undefined, 2));
        const result = runCli(['updateNext', repoDir]);
        // LOGGER.warn uses console.warn which writes to stderr
        expect(result.stderr).to.contain('Uncommitted changes');
    });

    it('should error for non-existent directory', () => {
        const result = runCli(['updateNext', '/non/existent/path']);
        expect(result.exitCode).to.not.equal(0);
    });

    it('should show debug output with --verbose', () => {
        const pkgPath = path.join(repoDir, 'package.json');
        fs.writeFileSync(pkgPath, JSON.stringify({ name: 'test', version: '1.0.0', private: true, workspaces: [] }, undefined, 2));
        execSync('git add . && git commit -m "add package.json"', { cwd: repoDir });
        const result = runCli(['updateNext', repoDir, '--verbose']);
        const output = result.stdout + result.stderr;
        expect(output).to.contain('Scanning');
    });
});
