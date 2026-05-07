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
import { readJson } from '../../helpers/repo-helper';
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

describe('repo commands — core (build)', function () {
    const CORE_REPOS = ['glsp-client', 'glsp-server-node'] as const;
    let workDir: string;

    before(function () {
        workDir = createTempDir();

        const cloneResult = runCli(['repo', 'clone', '--preset', 'core', '-d', workDir]);
        expect(cloneResult.exitCode, `clone failed:\n${cliDiag(cloneResult)}`).to.equal(0);

        const buildResult = runCli(['repo', 'build', '-d', workDir]);
        expect(buildResult.exitCode, `build failed:\n${cliDiag(buildResult)}`).to.equal(0);
    });

    after(function () {
        cleanupTempDir(workDir);
    });

    // ── Build ──────────────────────────────────────────────────────────────

    describe('build', function () {
        it('should have built all core repos', function () {
            for (const repo of CORE_REPOS) {
                expect(fs.existsSync(path.join(workDir, repo, 'node_modules')), `${repo}/node_modules should exist`).to.be.true;
            }
        });

        it('should build with --repo filter', function () {
            const result = runCli(['repo', 'build', '-d', workDir, '-r', 'glsp-client']);
            expect(result.exitCode, cliDiag(result)).to.equal(0);
        });

        it('should continue on failure with --no-fail-fast', function () {
            const badDir = createTempDir();
            try {
                fs.mkdirSync(path.join(badDir, 'glsp-client'));
                fs.mkdirSync(path.join(badDir, 'glsp-server-node'));
                fs.writeFileSync(path.join(badDir, 'glsp-client', 'package.json'), '{"name":"bad","scripts":{"postinstall":"exit 1"}}');
                fs.writeFileSync(
                    path.join(badDir, 'glsp-server-node', 'package.json'),
                    '{"name":"bad","scripts":{"postinstall":"exit 1"}}'
                );

                const result = runCli(['repo', 'build', '-d', badDir, '--no-fail-fast']);
                expect(result.exitCode).to.not.equal(0);
            } finally {
                cleanupTempDir(badDir);
            }
        });
    });

    // ── Link / Unlink ──────────────────────────────────────────────────────

    describe('link', function () {
        it('should link core repos', function () {
            const result = runCli(['repo', 'link', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).to.equal(0);

            const linkDir = path.join(workDir, '.yarn-link');
            expect(fs.existsSync(linkDir), '.yarn-link directory should exist').to.be.true;

            const linkedPkgs = fs.readdirSync(path.join(linkDir, '@eclipse-glsp'));
            expect(linkedPkgs.length).to.be.greaterThan(0);
        });
    });

    describe('unlink', function () {
        it('should unlink core repos', function () {
            const result = runCli(['repo', 'unlink', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).to.equal(0);
        });
    });

    // ── Workspace ──────────────────────────────────────────────────────────

    describe('workspace', function () {
        it('should generate a .code-workspace file', function () {
            const result = runCli(['repo', 'workspace', 'init', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).to.equal(0);

            const wsFile = path.join(workDir, 'glsp.code-workspace');
            expect(fs.existsSync(wsFile)).to.be.true;

            const ws = readJson(wsFile);
            const folders = ws.folders as { name: string; path: string }[];
            expect(folders).to.have.length(2);
            expect(folders.map(f => f.name)).to.include.members(['glsp-client', 'glsp-server-node']);
        });

        it('should generate workspace with custom --output path', function () {
            const customPath = path.join(workDir, 'custom', 'my.code-workspace');
            const result = runCli(['repo', 'workspace', 'init', '-d', workDir, '-o', customPath]);
            expect(result.exitCode, cliDiag(result)).to.equal(0);
            expect(fs.existsSync(customPath)).to.be.true;

            const ws = readJson(customPath);
            const folders = ws.folders as { name: string; path: string }[];
            expect(folders).to.have.length(2);
        });
    });
});
