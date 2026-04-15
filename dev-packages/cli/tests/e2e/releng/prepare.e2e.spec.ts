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
import { runCli } from '../../helpers/cli-helper';
import { replaceOriginWithBare, shallowClone } from '../../helpers/clone-helper';
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

/**
 * Determines the default branch of a repo. Tries `origin/HEAD` first (available
 * from clones) then falls back to checking if `master` or `main` exists locally.
 */
function getDefaultBranch(repoDir: string): string {
    try {
        const ref = git('symbolic-ref refs/remotes/origin/HEAD', repoDir);
        return ref.replace('refs/remotes/origin/', '');
    } catch {
        // After replacing origin with a bare repo, the symbolic ref may be gone.
        const branches = git('branch', repoDir);
        if (branches.includes('master')) {
            return 'master';
        }
        if (branches.includes('main')) {
            return 'main';
        }
        return 'master';
    }
}

function resetRepo(repoDir: string): void {
    const defaultBranch = getDefaultBranch(repoDir);
    git('checkout .', repoDir);
    git('clean -fd', repoDir);
    git(`checkout ${defaultBranch}`, repoDir);
}

function isMavenAvailable(): boolean {
    try {
        execSync('mvn --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    } catch {
        return false;
    }
}

/**
 * Injects a `## v99.0.0 - active` section into the CHANGELOG.md of the given repo
 * and commits the change so the working tree is clean.
 */
function injectChangelogSection(repoDir: string): void {
    const changelogPath = path.join(repoDir, 'CHANGELOG.md');
    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const newSection = '\n## v99.0.0 - active\n\n### Changes\n\n- Test release\n';
    const updatedChangelog = changelog.replace(/^(# .+)$/m, `$1\n${newSection}`);
    fs.writeFileSync(changelogPath, updatedChangelog);
    git('add .', repoDir);
    git('commit -m "add changelog section"', repoDir);
    git('push origin HEAD', repoDir);
}

/**
 * Finds workspace package.json files (not the root) by reading the root
 * package.json workspaces globs and resolving them.
 */
function findWorkspacePackageJsons(repoDir: string): string[] {
    const rootPkg = readJson(path.join(repoDir, 'package.json'));
    const workspaces: string[] = Array.isArray(rootPkg.workspaces)
        ? rootPkg.workspaces
        : (rootPkg.workspaces as { packages?: string[] })?.packages ?? [];

    const results: string[] = [];
    for (const pattern of workspaces) {
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

// ── glsp (self-contained, no external @eclipse-glsp deps) ─────────────────

describe('releng prepare — glsp', function () {
    let repoDir: string;
    let bareParentDir: string;

    before(function () {
        repoDir = shallowClone('glsp');
        ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        resetRepo(repoDir);
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should prepare custom 99.0.0 with --no-push --no-check', function () {
        injectChangelogSection(repoDir);

        const result = runCli(['releng', 'prepare', 'custom', '99.0.0', '--no-push', '--no-check', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Release branch created
        const branches = git('branch', repoDir);
        expect(branches).to.contain('release-v99.0.0');

        // Version bumped in root package.json
        const rootPkg = readJson(path.join(repoDir, 'package.json'));
        expect(rootPkg.version).to.equal('99.0.0');

        // Version bumped in lerna.json
        const lerna = readJson(path.join(repoDir, 'lerna.json'));
        expect(lerna.version).to.equal('99.0.0');

        // At least one workspace package.json updated
        const workspacePkgs = findWorkspacePackageJsons(repoDir);
        expect(workspacePkgs.length).to.be.greaterThan(0);
        const firstPkg = readJson(workspacePkgs[0]);
        expect(firstPkg.version).to.equal('99.0.0');

        // CHANGELOG.md updated
        const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
        expect(changelog).to.not.contain('## v99.0.0 - active');
        expect(changelog).to.contain('## [v99.0.0 -');

        // Git commit created
        const logMsg = git('log -1 --pretty=%s', repoDir);
        expect(logMsg).to.equal('v99.0.0');
    });
});

// ── NPM repos with external @eclipse-glsp deps (use 'next' version type) ──
//
// These repos depend on external @eclipse-glsp packages (e.g. @eclipse-glsp/dev,
// @eclipse-glsp/protocol) that do not exist at version 99.0.0 on npm.
// Using `next` version type avoids this issue because external deps are set to
// the `next` npm tag which resolves to a real published version.

const NPM_REPOS_WITH_EXTERNAL_DEPS = ['glsp-client', 'glsp-server-node', 'glsp-vscode-integration'] as const;

for (const repo of NPM_REPOS_WITH_EXTERNAL_DEPS) {
    describe(`releng prepare — ${repo}`, function () {
        let repoDir: string;
        let bareParentDir: string;

        before(function () {
            repoDir = shallowClone(repo);
            ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
        });

        beforeEach(function () {
            resetRepo(repoDir);
        });

        after(function () {
            if (repoDir) {
                cleanupTempDir(path.dirname(repoDir));
            }
            if (bareParentDir) {
                cleanupTempDir(bareParentDir);
            }
        });

        it('should prepare next version with --no-push --no-check', function () {
            const result = runCli(['releng', 'prepare', 'next', '--no-push', '--no-check', '-r', repoDir], {
                timeout: 0
            });
            expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

            // Nightly branch created (nightly-X.Y.0-next)
            const branches = git('branch', repoDir);
            expect(branches).to.match(/nightly-\d+\.\d+\.0-next/);

            // Version bumped with -next suffix
            const rootPkg = readJson(path.join(repoDir, 'package.json'));
            expect(rootPkg.version as string).to.match(/-next$/);

            const lerna = readJson(path.join(repoDir, 'lerna.json'));
            expect(lerna.version as string).to.match(/-next$/);

            // At least one workspace package.json updated
            const workspacePkgs = findWorkspacePackageJsons(repoDir);
            expect(workspacePkgs.length).to.be.greaterThan(0);
            const firstPkg = readJson(workspacePkgs[0]);
            expect(firstPkg.version as string).to.match(/-next$/);

            // CHANGELOG.md should have a new active section
            const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
            expect(changelog).to.match(/## v\d+\.\d+\.0 - active/);

            // Git commit message
            const logMsg = git('log -1 --pretty=%s', repoDir);
            expect(logMsg).to.match(/^Switch to nightly \d+\.\d+\.0-next versions$/);
        });
    });
}

// ── glsp-playwright (requires writable browser install dir) ─────────────────

describe('releng prepare — glsp-playwright', function () {
    let repoDir: string;
    let bareParentDir: string;

    before(function () {
        repoDir = shallowClone('glsp-playwright');
        ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        resetRepo(repoDir);
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should prepare next version with --no-push --no-check', function () {
        const result = runCli(['releng', 'prepare', 'next', '--no-push', '--no-check', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Nightly branch created
        const branches = git('branch', repoDir);
        expect(branches).to.match(/nightly-\d+\.\d+\.0-next/);

        // Version bumped with -next suffix
        const rootPkg = readJson(path.join(repoDir, 'package.json'));
        expect(rootPkg.version as string).to.match(/-next$/);

        const lerna = readJson(path.join(repoDir, 'lerna.json'));
        expect(lerna.version as string).to.match(/-next$/);

        // CHANGELOG.md should have a new active section
        const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
        expect(changelog).to.match(/## v\d+\.\d+\.0 - active/);

        // Git commit message
        const logMsg = git('log -1 --pretty=%s', repoDir);
        expect(logMsg).to.match(/^Switch to nightly \d+\.\d+\.0-next versions$/);
    });
});

// ── glsp-client extended tests ──────────────────────────────────────────────

describe('releng prepare — glsp-client (extended)', function () {
    let repoDir: string;
    let bareDir: string;
    let bareParentDir: string;

    before(function () {
        repoDir = shallowClone('glsp-client');
        ({ bareDir, parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        resetRepo(repoDir);
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should accept --verbose flag', function () {
        const result = runCli(['releng', 'prepare', 'next', '--no-push', '--no-check', '--verbose', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Verbose mode produces debug output
        const combined = result.stdout + result.stderr;
        expect(combined).to.contain('Bump version');
    });

    it('should push --draft release to local bare remote', function () {
        // With push enabled (no --no-push), the branch should be pushed to the bare remote.
        // gh pr create will fail (bare repo is not GitHub), but the push should succeed.
        const result = runCli(['releng', 'prepare', 'next', '--no-check', '--draft', '-r', repoDir], {
            timeout: 0
        });

        // gh pr create will fail, so exit code is non-zero. But verify push happened.
        const remoteBranches = git('branch', bareDir);
        expect(remoteBranches).to.match(/nightly-\d+\.\d+\.0-next/);

        // Regardless of exit code, the test exercises the push + draft path
        expect(result).to.not.equal(undefined);
    });
});

// ── glsp-theia-integration (NPM + Theia README) ────────────────────────────

describe('releng prepare — glsp-theia-integration', function () {
    let repoDir: string;
    let bareParentDir: string;

    before(function () {
        repoDir = shallowClone('glsp-theia-integration');
        ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        resetRepo(repoDir);
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should prepare next version with --no-push --no-check', function () {
        const result = runCli(['releng', 'prepare', 'next', '--no-push', '--no-check', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Nightly branch created
        const branches = git('branch', repoDir);
        expect(branches).to.match(/nightly-\d+\.\d+\.0-next/);

        // NPM checks
        const rootPkg = readJson(path.join(repoDir, 'package.json'));
        expect(rootPkg.version as string).to.match(/-next$/);

        const lerna = readJson(path.join(repoDir, 'lerna.json'));
        expect(lerna.version as string).to.match(/-next$/);

        // Theia README compatibility table should contain 'next'
        const readme = readText(path.join(repoDir, 'README.md'));
        expect(readme).to.contain('next');

        // CHANGELOG.md should have a new active section
        const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
        expect(changelog).to.match(/## v\d+\.\d+\.0 - active/);

        // Git commit message
        const logMsg = git('log -1 --pretty=%s', repoDir);
        expect(logMsg).to.match(/^Switch to nightly \d+\.\d+\.0-next versions$/);
    });
});

// ── glsp-server (Java / Maven) ─────────────────────────────────────────────

describe('releng prepare — glsp-server', function () {
    let repoDir: string;
    let bareParentDir: string;

    before(function () {
        if (!isMavenAvailable()) {
            this.skip();
        }
        repoDir = shallowClone('glsp-server');
        ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        if (repoDir) {
            resetRepo(repoDir);
        }
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should prepare custom 99.0.0 with --no-push --no-check', function () {
        injectChangelogSection(repoDir);

        const result = runCli(['releng', 'prepare', 'custom', '99.0.0', '--no-push', '--no-check', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Release branch created
        const branches = git('branch', repoDir);
        expect(branches).to.contain('release-v99.0.0');

        // Version bumped in pom.xml
        const pom = readText(path.join(repoDir, 'pom.xml'));
        expect(pom).to.contain('<version>99.0.0</version>');

        // CHANGELOG.md updated
        const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
        expect(changelog).to.not.contain('## v99.0.0 - active');
        expect(changelog).to.contain('## [v99.0.0 -');

        // Git commit created
        const logMsg = git('log -1 --pretty=%s', repoDir);
        expect(logMsg).to.equal('v99.0.0');
    });
});

// ── glsp-eclipse-integration (hybrid: npm client + mvn server) ─────────────

describe('releng prepare — glsp-eclipse-integration', function () {
    let repoDir: string;
    let bareParentDir: string;

    before(function () {
        if (!isMavenAvailable()) {
            this.skip();
        }
        repoDir = shallowClone('glsp-eclipse-integration');
        ({ parentDir: bareParentDir } = replaceOriginWithBare(repoDir));
    });

    beforeEach(function () {
        if (repoDir) {
            resetRepo(repoDir);
        }
    });

    after(function () {
        if (repoDir) {
            cleanupTempDir(path.dirname(repoDir));
        }
        if (bareParentDir) {
            cleanupTempDir(bareParentDir);
        }
    });

    it('should prepare next version with --no-push --no-check', function () {
        const result = runCli(['releng', 'prepare', 'next', '--no-push', '--no-check', '-r', repoDir], {
            timeout: 0
        });
        expect(result.exitCode, `stdout: ${result.stdout}\nstderr: ${result.stderr}`).to.equal(0);

        // Nightly branch created
        const branches = git('branch', repoDir);
        expect(branches).to.match(/nightly-\d+\.\d+\.0-next/);

        // Client npm packages get the -next suffix
        const clientPkg = readJson(path.join(repoDir, 'client', 'package.json'));
        expect(clientPkg.version as string).to.match(/-next$/);

        // Server pom.xml gets a SNAPSHOT version
        const serverPom = readText(path.join(repoDir, 'server', 'pom.xml'));
        expect(serverPom).to.match(/<version>\d+\.\d+\.0-SNAPSHOT<\/version>/);

        // CHANGELOG.md has a new active section added
        const changelog = readText(path.join(repoDir, 'CHANGELOG.md'));
        expect(changelog).to.match(/## v\d+\.\d+\.0 - active/);

        // Git commit message for nightly
        const logMsg = git('log -1 --pretty=%s', repoDir);
        expect(logMsg).to.match(/^Switch to nightly \d+\.\d+\.0-next versions$/);
    });
});
