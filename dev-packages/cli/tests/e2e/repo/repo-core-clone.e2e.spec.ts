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

import { describe, it, beforeAll, afterEach, afterAll, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cliDiag, runCli } from '../../helpers/cli-helper';
import { currentBranch, git, isSshAvailable, resetRepo } from '../../helpers/repo-helper';
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

describe('repo commands — core (clone)', function () {
    const CORE_REPOS = ['glsp-client', 'glsp-server-node'] as const;
    let workDir: string;

    beforeAll(function () {
        workDir = createTempDir();
        const result = runCli(['repo', 'clone', '--preset', 'core', '-d', workDir]);
        expect(result.exitCode, cliDiag(result)).toBe(0);
    });

    afterAll(function () {
        cleanupTempDir(workDir);
    });

    // ── Clone ──────────────────────────────────────────────────────────────

    describe('clone', function () {
        it('should clone all core repos via --preset', function () {
            for (const repo of CORE_REPOS) {
                const repoDir = path.join(workDir, repo);
                expect(fs.existsSync(repoDir), `${repo} should exist`).toBe(true);
                expect(fs.existsSync(path.join(repoDir, 'package.json')), `${repo}/package.json should exist`).toBe(true);
                expect(fs.existsSync(path.join(repoDir, '.git')), `${repo}/.git should exist`).toBe(true);
            }
        });

        it('should clone a single repo via scoped command', function () {
            const singleDir = createTempDir();
            try {
                const result = runCli(['repo', 'glsp-client', 'clone', '-d', singleDir]);
                expect(result.exitCode, cliDiag(result)).toBe(0);
                expect(fs.existsSync(path.join(singleDir, 'glsp-client', 'package.json'))).toBe(true);
            } finally {
                cleanupTempDir(singleDir);
            }
        });

        it.skipIf(!isSshAvailable())('should clone with --protocol ssh via scoped command', function () {
            const singleDir = createTempDir();
            try {
                const result = runCli(['repo', 'glsp-client', 'clone', '-d', singleDir, '-p', 'ssh']);
                expect(result.exitCode, cliDiag(result)).toBe(0);

                const repoDir = path.join(singleDir, 'glsp-client');
                expect(fs.existsSync(repoDir)).toBe(true);
                const remoteUrl = git('remote get-url origin', repoDir);
                expect(remoteUrl).toContain('git@github.com:');
            } finally {
                cleanupTempDir(singleDir);
            }
        });

        it('should clone with --branch via scoped command', function () {
            const singleDir = createTempDir();
            try {
                const result = runCli(['repo', 'glsp-client', 'clone', '-d', singleDir, '-b', 'master']);
                expect(result.exitCode, cliDiag(result)).toBe(0);

                const repoDir = path.join(singleDir, 'glsp-client');
                expect(currentBranch(repoDir)).toBe('master');
            } finally {
                cleanupTempDir(singleDir);
            }
        });

        it('should clone with positional repo filter', function () {
            const filterDir = createTempDir();
            try {
                const result = runCli(['repo', 'clone', 'glsp-client', '-d', filterDir]);
                expect(result.exitCode, cliDiag(result)).toBe(0);

                expect(fs.existsSync(path.join(filterDir, 'glsp-client'))).toBe(true);
                expect(fs.existsSync(path.join(filterDir, 'glsp-server-node'))).toBe(false);
            } finally {
                cleanupTempDir(filterDir);
            }
        });

        it('should handle --override rename', function () {
            const overrideDir = createTempDir();
            try {
                runCli(['repo', 'glsp-client', 'clone', '-d', overrideDir]);
                const marker = path.join(overrideDir, 'glsp-client', 'test-marker.txt');
                fs.writeFileSync(marker, 'original');

                const result = runCli(['repo', 'glsp-client', 'clone', '-d', overrideDir, '--override', 'rename']);
                expect(result.exitCode, cliDiag(result)).toBe(0);

                const entries = fs.readdirSync(overrideDir).filter(e => e.startsWith('glsp-client_'));
                expect(entries).toHaveLength(1);
                expect(fs.readFileSync(path.join(overrideDir, entries[0], 'test-marker.txt'), 'utf-8')).toBe('original');
                expect(fs.existsSync(path.join(overrideDir, 'glsp-client', 'package.json'))).toBe(true);
            } finally {
                cleanupTempDir(overrideDir);
            }
        });

        it('should handle --override remove', function () {
            const overrideDir = createTempDir();
            try {
                runCli(['repo', 'glsp-client', 'clone', '-d', overrideDir]);
                const marker = path.join(overrideDir, 'glsp-client', 'test-marker.txt');
                fs.writeFileSync(marker, 'original');

                const result = runCli(['repo', 'glsp-client', 'clone', '-d', overrideDir, '--override', 'remove']);
                expect(result.exitCode, cliDiag(result)).toBe(0);

                expect(fs.existsSync(path.join(overrideDir, 'glsp-client', 'test-marker.txt'))).toBe(false);
                expect(fs.existsSync(path.join(overrideDir, 'glsp-client', 'package.json'))).toBe(true);
            } finally {
                cleanupTempDir(overrideDir);
            }
        });
    });

    // ── Switch ─────────────────────────────────────────────────────────────

    describe('switch', function () {
        afterEach(function () {
            for (const repo of CORE_REPOS) {
                resetRepo(path.join(workDir, repo));
                try {
                    git('checkout master', path.join(workDir, repo));
                } catch {
                    // repo may already be on master
                }
            }
        });

        it('should switch branch via scoped command', function () {
            const repoDir = path.join(workDir, 'glsp-client');
            const origBranch = currentBranch(repoDir);

            git('checkout -b test-switch-branch', repoDir);
            git('checkout ' + origBranch, repoDir);

            const result = runCli(['repo', 'glsp-client', 'switch', '-b', 'test-switch-branch', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(currentBranch(repoDir)).toBe('test-switch-branch');

            git('checkout ' + origBranch, repoDir);
            git('branch -d test-switch-branch', repoDir);
        });

        it('should warn when branch does not exist', function () {
            const result = runCli(['repo', 'glsp-client', 'switch', '-b', 'nonexistent-branch-12345', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);

            const combined = result.stdout + result.stderr;
            expect(combined).toContain('not found');
        });

        it('should fail without --force when repo has changes', function () {
            const repoDir = path.join(workDir, 'glsp-client');
            fs.writeFileSync(path.join(repoDir, 'dirty-marker.txt'), 'dirty');
            git('add dirty-marker.txt', repoDir);

            const result = runCli(['repo', 'glsp-client', 'switch', '-b', 'master', '-d', workDir]);
            expect(result.exitCode).not.toBe(0);

            resetRepo(repoDir);
        });

        it('should switch with --force despite dirty state', function () {
            const repoDir = path.join(workDir, 'glsp-client');
            const origBranch = currentBranch(repoDir);
            git('checkout -b test-force-branch', repoDir);
            git('checkout ' + origBranch, repoDir);
            fs.writeFileSync(path.join(repoDir, 'dirty-marker.txt'), 'dirty');
            git('add dirty-marker.txt', repoDir);

            const result = runCli(['repo', 'glsp-client', 'switch', '-b', 'test-force-branch', '--force', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(currentBranch(repoDir)).toBe('test-force-branch');

            git('checkout ' + origBranch, repoDir);
            git('branch -D test-force-branch', repoDir);
        });
    });

    // ── Pwd ────────────────────────────────────────────────────────────────

    describe('pwd', function () {
        it('should print resolved paths for all repos', function () {
            const result = runCli(['repo', 'pwd', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            for (const repo of CORE_REPOS) {
                expect(result.stdout).toContain(repo);
            }
        });

        it('should print raw tab-separated output', function () {
            const result = runCli(['repo', 'pwd', '-d', workDir, '--raw']);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            const lines = result.stdout.trim().split('\n');
            expect(lines).toHaveLength(2);
            for (const line of lines) {
                expect(line).toMatch(/^glsp-\S+\t\//);
            }
        });

        it('should print path for a single repo via scoped command', function () {
            const result = runCli(['repo', 'glsp-client', 'pwd', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(result.stdout.trim()).toBe(path.resolve(workDir, 'glsp-client'));
        });
    });

    // ── Log ────────────────────────────────────────────────────────────────

    describe('log', function () {
        it('should print the last commit for all repos', function () {
            const result = runCli(['repo', 'log', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(result.stdout).toContain('commit');
            expect(result.stdout).toContain('Author:');
        });

        it('should print the last commit for a single repo via scoped command', function () {
            const result = runCli(['repo', 'glsp-client', 'log', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(result.stdout).toContain('commit');
        });
    });
});
