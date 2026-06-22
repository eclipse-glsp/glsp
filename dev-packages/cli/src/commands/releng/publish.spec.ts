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

import { describe, it, beforeEach, afterEach, expect, vi, type MockInstance } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import { LOGGER, PackageData, PackageHelper } from '../../util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import { deriveCanaryVersion } from './common';
import { PublishCmdOptions, publish } from './publish';

describe('releng publish', () => {
    let tempDir: string;
    let execStub: MockInstance;
    let execAsyncStub: MockInstance;

    beforeEach(() => {
        tempDir = createTempDir();
        execStub = vi.spyOn(processUtil, 'exec');
        execAsyncStub = vi.spyOn(processUtil, 'execAsync').mockResolvedValue('');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanupTempDir(tempDir);
    });

    function createRootPackage(version: string): void {
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'parent', version, private: true }));
    }

    function createPackage(relativePath: string, content: Partial<PackageData> & { name: string; version: string }): PackageHelper {
        const pkgDir = path.join(tempDir, relativePath);
        fs.mkdirSync(pkgDir, { recursive: true });
        const filePath = path.join(pkgDir, 'package.json');
        fs.writeFileSync(filePath, JSON.stringify(content, undefined, 4));
        return new PackageHelper(filePath, content.name);
    }

    function stubGit(lastTag: string, commitCount: string): void {
        execStub.mockImplementation((cmd: string) => {
            if (/git describe/.test(cmd)) {
                return lastTag;
            }
            if (/git rev-list/.test(cmd)) {
                return commitCount;
            }
            return undefined;
        });
    }

    function makeOptions(overrides: Partial<PublishCmdOptions> = {}): PublishCmdOptions {
        return { verbose: false, repoDir: tempDir, dryRun: false, ...overrides };
    }

    describe('deriveCanaryVersion', () => {
        it('should derive the canary version from the base version and commit count', () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '42');
            const canary = deriveCanaryVersion(tempDir);
            expect(canary).to.deep.equal({ base: '2.8.0-next', lastTag: 'v2.7.0', commitCount: 42, version: '2.8.0-next.42' });
        });

        it('should throw a helpful error when no git tag can be found', () => {
            createRootPackage('2.8.0-next');
            execStub.mockImplementation((cmd: string) => {
                if (/git describe/.test(cmd)) {
                    throw new Error('fatal: No names found');
                }
                return undefined;
            });
            expect(() => deriveCanaryVersion(tempDir)).to.throw(/fetch-depth: 0/);
        });
    });

    describe('publish next', () => {
        it('should apply the canary version to all workspace packages and publish with --tag next', async () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '42');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.8.0-next' });
            const pkgB = createPackage('packages/b', { name: '@eclipse-glsp/b', version: '2.8.0-next' });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA, pkgB]);

            await publish('next', makeOptions());

            const writtenA = JSON.parse(fs.readFileSync(pkgA.filePath, 'utf8'));
            const writtenB = JSON.parse(fs.readFileSync(pkgB.filePath, 'utf8'));
            expect(writtenA.version).to.equal('2.8.0-next.42');
            expect(writtenB.version).to.equal('2.8.0-next.42');
            // the root package keeps the plain base version
            const root = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
            expect(root.version).to.equal('2.8.0-next');

            expect(execAsyncStub).toHaveBeenCalledOnce();
            expect(execAsyncStub.mock.calls[0][0]).to.equal('pnpm publish -r --tag next --no-git-checks --report-summary');
            expect(execAsyncStub.mock.calls[0][1].cwd).to.equal(tempDir);
        });

        it('should not write versions and pass --dry-run in dry-run mode', async () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '7');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.8.0-next' });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);

            await publish('next', makeOptions({ dryRun: true }));

            const writtenA = JSON.parse(fs.readFileSync(pkgA.filePath, 'utf8'));
            expect(writtenA.version).to.equal('2.8.0-next');
            expect(execAsyncStub.mock.calls[0][0]).to.contain('--dry-run');
        });

        it('should pass a custom registry to pnpm publish', async () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '7');
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([]);

            await publish('next', makeOptions({ registry: 'http://localhost:4873' }));

            expect(execAsyncStub.mock.calls[0][0]).to.contain('--registry http://localhost:4873');
        });

        it('should bump versions and print the publish command without publishing in interactive mode', async () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '42');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.8.0-next' });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);
            const infoStub = vi.spyOn(LOGGER, 'info');

            await publish('next', makeOptions({ interactive: true }));

            // versions are still bumped on disk
            expect(JSON.parse(fs.readFileSync(pkgA.filePath, 'utf8')).version).to.equal('2.8.0-next.42');
            // but nothing is published
            expect(execAsyncStub).not.toHaveBeenCalled();
            expect(infoStub.mock.calls.flat()).to.contain('\n  pnpm publish -r --tag next --no-git-checks\n');
        });

        it('should refuse to publish a canary if the root version is not a next version', async () => {
            createRootPackage('2.8.0');
            stubGit('v2.7.0', '7');
            try {
                await publish('next', makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('not a next version');
            }
        });
    });

    describe('publish latest', () => {
        it('should refuse to publish next versions under the latest dist-tag', async () => {
            createRootPackage('2.8.0-next');
            try {
                await publish('latest', makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain("Refusing to publish under the 'latest' dist-tag");
            }
        });

        it('should publish with --tag latest when unpublished packages exist', async () => {
            createRootPackage('2.9.0');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);
            // npm view fails -> version does not exist yet
            execStub.mockImplementation((cmd: string) => {
                if (/npm view/.test(cmd)) {
                    throw new Error('404');
                }
                return undefined;
            });

            await publish('latest', makeOptions());

            expect(execAsyncStub).toHaveBeenCalledOnce();
            expect(execAsyncStub.mock.calls[0][0]).to.equal('pnpm publish -r --tag latest --no-git-checks --report-summary');
        });

        it('should skip publishing when all package versions already exist', async () => {
            createRootPackage('2.9.0');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);
            // npm view returns the version -> already published
            execStub.mockImplementation((cmd: string) => {
                if (/npm view/.test(cmd)) {
                    return '2.9.0';
                }
                return undefined;
            });

            await publish('latest', makeOptions());

            expect(execAsyncStub).not.toHaveBeenCalled();
        });

        it('should ignore private packages when checking for unpublished versions', async () => {
            createRootPackage('2.9.0');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            const examplePkg = createPackage('examples/e', { name: '@eclipse-glsp-examples/e', version: '2.9.0', private: true });
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA, examplePkg]);
            execStub.mockImplementation((cmd: string) => {
                if (/npm view @eclipse-glsp\/a/.test(cmd)) {
                    return '2.9.0';
                }
                return undefined;
            });

            await publish('latest', makeOptions());

            // the only public package is already published -> nothing to publish
            expect(execAsyncStub).not.toHaveBeenCalled();
        });
    });

    describe('publish summary', () => {
        it('should report and remove the pnpm publish summary', async () => {
            createRootPackage('2.8.0-next');
            stubGit('v2.7.0', '7');
            vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([]);
            const summaryPath = path.join(tempDir, 'pnpm-publish-summary.json');
            execAsyncStub.mockImplementation(() => {
                fs.writeFileSync(
                    summaryPath,
                    JSON.stringify({ publishedPackages: [{ name: '@eclipse-glsp/a', version: '2.8.0-next.7' }] })
                );
                return Promise.resolve('');
            });

            await publish('next', makeOptions());

            expect(fs.existsSync(summaryPath)).to.be.false;
        });
    });
});
