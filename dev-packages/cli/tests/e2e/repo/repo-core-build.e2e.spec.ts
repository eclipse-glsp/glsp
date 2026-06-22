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
import * as YAML from 'yaml';
import { cliDiag, runCli } from '../../helpers/cli-helper';
import { readJson } from '../../helpers/repo-helper';
import { cleanupTempDir, createTempDir } from '../../helpers/test-helper';

function readOverrides(repoDir: string): Record<string, string> {
    const yamlPath = path.join(repoDir, 'pnpm-workspace.yaml');
    if (!fs.existsSync(yamlPath)) {
        return {};
    }
    const parsed = YAML.parse(fs.readFileSync(yamlPath, 'utf8')) as { overrides?: Record<string, string> };
    return parsed?.overrides ?? {};
}

describe('repo commands — core (build)', function () {
    const CORE_REPOS = ['glsp-client', 'glsp-server-node'] as const;
    let workDir: string;

    beforeAll(function () {
        workDir = createTempDir();

        const cloneResult = runCli(['repo', 'clone', '--preset', 'core', '-d', workDir]);
        expect(cloneResult.exitCode, `clone failed:\n${cliDiag(cloneResult)}`).toBe(0);

        const buildResult = runCli(['repo', 'build', '-d', workDir]);
        expect(buildResult.exitCode, `build failed:\n${cliDiag(buildResult)}`).toBe(0);
    });

    afterAll(function () {
        cleanupTempDir(workDir);
    });

    // ── Build ──────────────────────────────────────────────────────────────

    describe('build', function () {
        it('should have built all core repos', function () {
            for (const repo of CORE_REPOS) {
                expect(fs.existsSync(path.join(workDir, repo, 'node_modules')), `${repo}/node_modules should exist`).toBe(true);
            }
        });

        it('should build with --repo filter', function () {
            const result = runCli(['repo', 'build', '-d', workDir, '-r', 'glsp-client']);
            expect(result.exitCode, cliDiag(result)).toBe(0);
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
                expect(result.exitCode).not.toBe(0);
            } finally {
                cleanupTempDir(badDir);
            }
        });
    });

    // ── Run ───────────────────────────────────────────────────────────────

    describe('run', function () {
        it('should run a package script in a repo via scoped command', function () {
            const result = runCli(['repo', 'glsp-client', 'run', '--version', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
        });

        it('should fail when script does not exist', function () {
            const result = runCli(['repo', 'glsp-client', 'run', 'nonexistent-script-xyz', '-d', workDir]);
            expect(result.exitCode).not.toBe(0);
        });
    });

    // ── Browser / Node bundle ─────────────────────────────────────────────

    describe('server-node bundles', function () {
        it('should print the browser bundle path when bundle exists', function () {
            const bundleDir = path.join(workDir, 'glsp-server-node', 'examples', 'workflow-server-bundled-web');
            const bundleFile = path.join(bundleDir, 'wf-glsp-server-webworker.js');
            if (!fs.existsSync(bundleFile)) {
                fs.mkdirSync(bundleDir, { recursive: true });
                fs.writeFileSync(bundleFile, 'fake-bundle');
            }

            const result = runCli(['repo', 'glsp-server-node', 'browser-bundle', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(result.stdout).toContain('wf-glsp-server-webworker.js');
        });

        it('should print the node bundle path when bundle exists', function () {
            const bundleDir = path.join(workDir, 'glsp-server-node', 'examples', 'workflow-server-bundled');
            const bundleFile = path.join(bundleDir, 'wf-glsp-server-node.js');
            fs.mkdirSync(bundleDir, { recursive: true });
            fs.writeFileSync(bundleFile, 'fake-bundle');

            const result = runCli(['repo', 'glsp-server-node', 'node-bundle', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(result.stdout).toContain('wf-glsp-server-node.js');
        });

        it('should fail with helpful message when browser bundle is missing', function () {
            const missingDir = createTempDir();
            try {
                fs.mkdirSync(path.join(missingDir, 'glsp-server-node'), { recursive: true });
                const result = runCli(['repo', 'glsp-server-node', 'browser-bundle', '-d', missingDir]);
                expect(result.exitCode).not.toBe(0);
                const output = result.stdout + result.stderr;
                expect(output).toContain('not found');
            } finally {
                cleanupTempDir(missingDir);
            }
        });

        it('should fail with helpful message when node bundle is missing', function () {
            const missingDir = createTempDir();
            try {
                fs.mkdirSync(path.join(missingDir, 'glsp-server-node'), { recursive: true });
                const result = runCli(['repo', 'glsp-server-node', 'node-bundle', '-d', missingDir]);
                expect(result.exitCode).not.toBe(0);
                const output = result.stdout + result.stderr;
                expect(output).toContain('not found');
            } finally {
                cleanupTempDir(missingDir);
            }
        });
    });

    // ── Link / Unlink ──────────────────────────────────────────────────────

    describe('link', function () {
        it('should link core repos via pnpm-workspace.yaml overrides', function () {
            const result = runCli(['repo', 'link', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);

            // glsp-server-node should consume glsp-client's packages/singletons through link: overrides.
            const serverDir = path.join(workDir, 'glsp-server-node');
            const links = Object.entries(readOverrides(serverDir)).filter(([, value]) => value.startsWith('link:'));
            expect(links.length, 'expected link: overrides in glsp-server-node').toBeGreaterThan(0);
            expect(
                links.some(([, value]) => value.includes('glsp-client')),
                'expected at least one override pointing into glsp-client'
            ).toBe(true);

            // A consumed override should resolve to the local glsp-client checkout.
            const consumed = links.find(([name]) => fs.existsSync(path.join(serverDir, 'node_modules', name)));
            if (consumed) {
                const real = fs.realpathSync(path.join(serverDir, 'node_modules', consumed[0]));
                expect(real.startsWith(fs.realpathSync(path.join(workDir, 'glsp-client')))).toBe(true);
            }
        });
    });

    describe('unlink', function () {
        it('should unlink core repos', function () {
            const result = runCli(['repo', 'unlink', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);

            const links = Object.values(readOverrides(path.join(workDir, 'glsp-server-node'))).filter(value => value.startsWith('link:'));
            expect(links.length, 'link overrides should be removed after unlink').toBe(0);
        });
    });

    // ── Workspace ──────────────────────────────────────────────────────────

    describe('workspace', function () {
        it('should generate a .code-workspace file', function () {
            const result = runCli(['repo', 'workspace', 'init', '-d', workDir]);
            expect(result.exitCode, cliDiag(result)).toBe(0);

            const wsFile = path.join(workDir, 'glsp.code-workspace');
            expect(fs.existsSync(wsFile)).toBe(true);

            const ws = readJson(wsFile);
            const folders = ws.folders as { name: string; path: string }[];
            expect(folders).toHaveLength(2);
            expect(folders.map(f => f.name)).toEqual(expect.arrayContaining(['glsp-client', 'glsp-server-node']));
        });

        it('should generate workspace with custom --output path', function () {
            const customPath = path.join(workDir, 'custom', 'my.code-workspace');
            const result = runCli(['repo', 'workspace', 'init', '-d', workDir, '-o', customPath]);
            expect(result.exitCode, cliDiag(result)).toBe(0);
            expect(fs.existsSync(customPath)).toBe(true);

            const ws = readJson(customPath);
            const folders = ws.folders as { name: string; path: string }[];
            expect(folders).toHaveLength(2);
        });
    });
});
