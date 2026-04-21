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
import { GLSPRepo } from '../../../util';
import { createTempDir, cleanupTempDir } from '../../../../tests/helpers/test-helper';
import { discoverRepos, getBuildLevels, getBuildOrder, isLeafRepo, resolveWorkspaceDir } from './utils';

// ── workspace-resolution ──────────────────────────────────────────────────

describe('workspace-resolution', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
        tempDir = createTempDir();
        originalCwd = process.cwd();
    });

    afterEach(() => {
        process.chdir(originalCwd);
        cleanupTempDir(tempDir);
    });

    describe('resolveWorkspaceDir', () => {
        it('should return the given directory when cliDir is provided', () => {
            const dir = path.join(tempDir, 'my-workspace');
            fs.mkdirSync(dir, { recursive: true });
            const result = resolveWorkspaceDir(dir);
            expect(result).to.equal(dir);
        });

        it('should resolve a relative cliDir against cwd', () => {
            process.chdir(tempDir);
            fs.mkdirSync(path.join(tempDir, 'sub'), { recursive: true });
            const result = resolveWorkspaceDir('sub');
            expect(result).to.equal(path.resolve(tempDir, 'sub'));
        });

        it('should return cwd when no cliDir and not inside a known repo', () => {
            process.chdir(tempDir);
            const result = resolveWorkspaceDir();
            expect(result).to.equal(tempDir);
        });

        it('should return the parent of a known repo root when inside one', () => {
            const repoDir = path.join(tempDir, 'glsp-client');
            fs.mkdirSync(repoDir, { recursive: true });
            process.chdir(repoDir);
            const result = resolveWorkspaceDir();
            expect(result).to.equal(tempDir);
        });

        it('should walk up from a nested directory inside a known repo', () => {
            const repoDir = path.join(tempDir, 'glsp-client');
            const nestedDir = path.join(repoDir, 'packages', 'client', 'src');
            fs.mkdirSync(nestedDir, { recursive: true });
            process.chdir(nestedDir);
            const result = resolveWorkspaceDir();
            expect(result).to.equal(tempDir);
        });
    });
});

// ── repo-discovery ────────────────────────────────────────────────────────

describe('repo-discovery', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    describe('discoverRepos', () => {
        it('should find known GLSP repo directories', () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-client'));
            fs.mkdirSync(path.join(tempDir, 'glsp-server-node'));
            const repos = discoverRepos(tempDir);
            expect(repos).to.deep.equal(['glsp-server-node', 'glsp-client']);
        });

        it('should ignore non-GLSP directories', () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-client'));
            fs.mkdirSync(path.join(tempDir, 'my-project'));
            fs.mkdirSync(path.join(tempDir, 'node_modules'));
            const repos = discoverRepos(tempDir);
            expect(repos).to.deep.equal(['glsp-client']);
        });

        it('should ignore files matching GLSP repo names', () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-client'));
            fs.writeFileSync(path.join(tempDir, 'glsp-server-node'), 'not a dir');
            const repos = discoverRepos(tempDir);
            expect(repos).to.deep.equal(['glsp-client']);
        });

        it('should return empty array for nonexistent directory', () => {
            const repos = discoverRepos(path.join(tempDir, 'nonexistent'));
            expect(repos).to.deep.equal([]);
        });

        it('should return repos sorted by GLSPRepo.choices order', () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-theia-integration'));
            fs.mkdirSync(path.join(tempDir, 'glsp'));
            fs.mkdirSync(path.join(tempDir, 'glsp-client'));
            const repos = discoverRepos(tempDir);
            expect(repos).to.deep.equal(['glsp', 'glsp-client', 'glsp-theia-integration']);
        });

        it('should return empty array when no GLSP repos exist', () => {
            fs.mkdirSync(path.join(tempDir, 'some-project'));
            const repos = discoverRepos(tempDir);
            expect(repos).to.deep.equal([]);
        });
    });
});

// ── repo-graph ──────────────────────────────────────────────────────────────

describe('repo-graph', () => {
    describe('getBuildOrder', () => {
        it('should return repos in dependency order', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server-node', 'glsp'];
            const order = getBuildOrder(repos);
            const glspIdx = order.indexOf('glsp');
            const clientIdx = order.indexOf('glsp-client');
            const serverNodeIdx = order.indexOf('glsp-server-node');
            expect(glspIdx).to.be.lessThan(clientIdx);
            expect(clientIdx).to.be.lessThan(serverNodeIdx);
        });

        it('should include only requested repos', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server-node'];
            const order = getBuildOrder(repos);
            expect(order).to.have.lengthOf(2);
            expect(order).to.include('glsp-client');
            expect(order).to.include('glsp-server-node');
        });

        it('should handle independent repos', () => {
            const repos: GLSPRepo[] = ['glsp-playwright'];
            const order = getBuildOrder(repos);
            expect(order).to.deep.equal(['glsp-playwright']);
        });

        it('should place glsp-server before glsp-eclipse-integration', () => {
            const repos: GLSPRepo[] = ['glsp-eclipse-integration', 'glsp-server', 'glsp-client', 'glsp'];
            const order = getBuildOrder(repos);
            const serverIdx = order.indexOf('glsp-server');
            const eclipseIdx = order.indexOf('glsp-eclipse-integration');
            expect(serverIdx).to.be.lessThan(eclipseIdx);
        });
    });

    describe('getBuildLevels', () => {
        it('should group independent repos into the same level', () => {
            const repos: GLSPRepo[] = ['glsp-server', 'glsp-playwright'];
            const levels = getBuildLevels(repos);
            expect(levels).to.have.lengthOf(1);
            expect(levels[0]).to.include.members(['glsp-server', 'glsp-playwright']);
        });

        it('should separate dependent repos into sequential levels', () => {
            const repos: GLSPRepo[] = ['glsp', 'glsp-client', 'glsp-server-node'];
            const levels = getBuildLevels(repos);
            expect(levels.length).to.be.greaterThanOrEqual(3);
            expect(levels[0]).to.deep.equal(['glsp']);
            expect(levels[1]).to.deep.equal(['glsp-client']);
            expect(levels[2]).to.deep.equal(['glsp-server-node']);
        });

        it('should parallelize theia and vscode after server-node', () => {
            const repos: GLSPRepo[] = ['glsp', 'glsp-client', 'glsp-server-node', 'glsp-theia-integration', 'glsp-vscode-integration'];
            const levels = getBuildLevels(repos);
            const lastLevel = levels[levels.length - 1];
            expect(lastLevel).to.include.members(['glsp-theia-integration', 'glsp-vscode-integration']);
        });

        it('should handle single repo', () => {
            const levels = getBuildLevels(['glsp-client']);
            expect(levels).to.deep.equal([['glsp-client']]);
        });
    });

    describe('isLeafRepo', () => {
        it('should return true for repos that no other repo depends on', () => {
            expect(isLeafRepo('glsp-theia-integration')).to.be.true;
            expect(isLeafRepo('glsp-vscode-integration')).to.be.true;
            expect(isLeafRepo('glsp-playwright')).to.be.true;
        });

        it('should return false for repos that are dependencies of other repos', () => {
            expect(isLeafRepo('glsp')).to.be.false;
            expect(isLeafRepo('glsp-client')).to.be.false;
            expect(isLeafRepo('glsp-server-node')).to.be.false;
            expect(isLeafRepo('glsp-server')).to.be.false;
        });
    });
});
