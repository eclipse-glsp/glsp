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
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { runCli } from '../../helpers/cli-helper';
import { shallowClone } from '../../helpers/clone-helper';
import { cleanupTempDir } from '../../helpers/test-helper';

function git(args: string, cwd: string): string {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function readJson(filePath: string): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function readText(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

function resetRepo(repoDir: string): void {
    git('checkout .', repoDir);
    git('clean -fd', repoDir);
}

function isMavenAvailable(): boolean {
    try {
        execSync('mvn --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    } catch {
        return false;
    }
}

// ── NPM standard repos ─────────────────────────────────────────────────────

const NPM_REPOS = ['glsp', 'glsp-client', 'glsp-server-node', 'glsp-vscode-integration', 'glsp-playwright'] as const;

for (const repo of NPM_REPOS) {
    describe(`releng version — ${repo}`, function () {
        let repoDir: string;

        beforeAll(function () {
            repoDir = shallowClone(repo);
        });

        afterEach(function () {
            resetRepo(repoDir);
        });

        afterAll(function () {
            cleanupTempDir(path.dirname(repoDir));
        });

        it(`should set custom version 99.0.0`, function () {
            const result = runCli(['releng', 'version', 'custom', '99.0.0', '-r', repoDir], { timeout: 0 });
            expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

            // Root package.json
            const rootPkg = readJson(path.join(repoDir, 'package.json'));
            expect(rootPkg.version).to.equal('99.0.0');

            // At least one workspace package.json updated
            const workspacePkgs = findWorkspacePackageJsons(repoDir);
            expect(workspacePkgs.length).to.be.greaterThan(0);
            const firstPkg = readJson(workspacePkgs[0]);
            expect(firstPkg.version).to.equal('99.0.0');
        });

        it(`should set next version`, function () {
            const result = runCli(['releng', 'version', 'next', '-r', repoDir], { timeout: 0 });
            expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

            const rootPkg = readJson(path.join(repoDir, 'package.json'));
            expect(rootPkg.version as string).to.match(/-next$/);

            // At least one workspace package.json updated
            const workspacePkgs = findWorkspacePackageJsons(repoDir);
            expect(workspacePkgs.length).to.be.greaterThan(0);
            const firstPkg = readJson(workspacePkgs[0]);
            expect(firstPkg.version as string).to.match(/-next$/);
        });
    });
}

// ── Additional tests on glsp-client (minor, verbose) ───────────────────────

describe('releng version — glsp-client (extended)', function () {
    let repoDir: string;

    beforeAll(function () {
        repoDir = shallowClone('glsp-client');
    });

    afterEach(function () {
        resetRepo(repoDir);
    });

    afterAll(function () {
        cleanupTempDir(path.dirname(repoDir));
    });

    it('should bump minor version', function () {
        const origPkg = readJson(path.join(repoDir, 'package.json'));
        const origVersion = origPkg.version as string;

        const result = runCli(['releng', 'version', 'minor', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        const updatedPkg = readJson(path.join(repoDir, 'package.json'));
        const newVersion = updatedPkg.version as string;
        expect(newVersion).to.not.equal(origVersion);

        // New version should be a clean semver without pre-release suffix
        // and its minor component should be >= the original base minor
        const origMinor = parseInt(origVersion.replace(/-.*$/, '').split('.')[1], 10);
        const newMinor = parseInt(newVersion.split('.')[1], 10);
        expect(newMinor).to.be.greaterThanOrEqual(origMinor);
        expect(newVersion).to.not.contain('-');
    });

    it('should accept --verbose flag', function () {
        const result = runCli(['releng', 'version', 'custom', '99.0.0', '--verbose', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Verbose mode produces debug output
        const combined = result.stdout + result.stderr;
        expect(combined).to.contain('Bump version');
    });
});

// ── glsp-theia-integration (NPM + Theia README) ────────────────────────────

describe('releng version — glsp-theia-integration', function () {
    let repoDir: string;

    beforeAll(function () {
        repoDir = shallowClone('glsp-theia-integration');
    });

    afterEach(function () {
        resetRepo(repoDir);
    });

    afterAll(function () {
        cleanupTempDir(path.dirname(repoDir));
    });

    it('should set custom version 99.0.0 and update Theia README', function () {
        const result = runCli(['releng', 'version', 'custom', '99.0.0', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // NPM checks
        const rootPkg = readJson(path.join(repoDir, 'package.json'));
        expect(rootPkg.version).to.equal('99.0.0');

        const workspacePkgs = findWorkspacePackageJsons(repoDir);
        expect(workspacePkgs.length).to.be.greaterThan(0);

        // Theia README compatibility table should contain the new version
        const readme = readText(path.join(repoDir, 'README.md'));
        expect(readme).to.contain('99.0.0');
    });

    it('should set next version', function () {
        const result = runCli(['releng', 'version', 'next', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        const rootPkg = readJson(path.join(repoDir, 'package.json'));
        expect(rootPkg.version as string).to.match(/-next$/);

        const workspacePkgs = findWorkspacePackageJsons(repoDir);
        expect(workspacePkgs.length).to.be.greaterThan(0);
        const firstPkg = readJson(workspacePkgs[0]);
        expect(firstPkg.version as string).to.match(/-next$/);
    });
});

// ── glsp-server (Java / Maven) ─────────────────────────────────────────────

describe.skipIf(!isMavenAvailable())('releng version — glsp-server', function () {
    let repoDir: string;

    beforeAll(function () {
        repoDir = shallowClone('glsp-server');
    });

    afterEach(function () {
        if (repoDir) {
            resetRepo(repoDir);
        }
    });

    afterAll(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
    });

    it('should set custom version 99.0.0 in pom.xml', function () {
        const result = runCli(['releng', 'version', 'custom', '99.0.0', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        const pom = readText(path.join(repoDir, 'pom.xml'));
        expect(pom).to.contain('<version>99.0.0</version>');
    });

    it('should set next version as SNAPSHOT in pom.xml', function () {
        const result = runCli(['releng', 'version', 'next', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        const pom = readText(path.join(repoDir, 'pom.xml'));
        expect(pom).to.match(/<version>\d+\.\d+\.\d+-SNAPSHOT<\/version>/);
    });
});

// ── glsp-eclipse-integration (hybrid: npm client + mvn server) ─────────────

describe.skipIf(!isMavenAvailable())('releng version — glsp-eclipse-integration', function () {
    let repoDir: string;

    beforeAll(function () {
        repoDir = shallowClone('glsp-eclipse-integration');
    });

    afterEach(function () {
        if (repoDir) {
            resetRepo(repoDir);
        }
    });

    afterAll(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
    });

    it('should set custom version 99.0.0 in client and server', function () {
        const result = runCli(['releng', 'version', 'custom', '99.0.0', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Client npm packages
        const clientPkg = readJson(path.join(repoDir, 'client', 'package.json'));
        expect(clientPkg.version).to.equal('99.0.0');

        // Server pom.xml
        const serverPom = readText(path.join(repoDir, 'server', 'pom.xml'));
        expect(serverPom).to.contain('<version>99.0.0</version>');
    });

    it('should set next version in client and server', function () {
        const result = runCli(['releng', 'version', 'next', '-r', repoDir], { timeout: 0 });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Client should have -next suffix
        const clientPkg = readJson(path.join(repoDir, 'client', 'package.json'));
        expect(clientPkg.version as string).to.match(/-next$/);

        // Server should have -SNAPSHOT suffix
        const serverPom = readText(path.join(repoDir, 'server', 'pom.xml'));
        expect(serverPom).to.match(/<version>\d+\.\d+\.\d+-SNAPSHOT<\/version>/);
    });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Reads the workspace package globs of a repo. pnpm repos declare them in `pnpm-workspace.yaml`;
 * legacy repos use the `workspaces` field in the root `package.json`.
 */
function readWorkspaceGlobs(repoDir: string): string[] {
    const pnpmWorkspace = path.join(repoDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(pnpmWorkspace)) {
        const parsed = YAML.parse(fs.readFileSync(pnpmWorkspace, 'utf8')) as { packages?: string[] };
        return parsed?.packages ?? [];
    }
    const rootPkg = readJson(path.join(repoDir, 'package.json'));
    return Array.isArray(rootPkg.workspaces) ? rootPkg.workspaces : ((rootPkg.workspaces as { packages?: string[] })?.packages ?? []);
}

/**
 * Finds workspace package.json files (not the root) by resolving the workspace globs.
 */
function findWorkspacePackageJsons(repoDir: string): string[] {
    const results: string[] = [];
    for (const pattern of readWorkspaceGlobs(repoDir)) {
        // Expand simple glob patterns like "packages/*"
        const base = pattern.replace(/\/?\*.*$/, '');
        const fullBase = path.join(repoDir, base);
        if (!fs.existsSync(fullBase)) {
            continue;
        }
        const entries = fs.readdirSync(fullBase, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const pkgPath = path.join(fullBase, entry.name, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    results.push(pkgPath);
                }
            }
        }
    }
    return results;
}
