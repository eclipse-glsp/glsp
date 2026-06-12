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
import * as sinon from 'sinon';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import { PackageData, PackageHelper } from '../../util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import { deriveCanaryVersion } from './common';
import { PublishCmdOptions, publish } from './publish';

describe('releng publish', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execStub: sinon.SinonStub;
    let execAsyncStub: sinon.SinonStub;

    beforeEach(() => {
        tempDir = createTempDir();
        execStub = sandbox.stub(processUtil, 'exec');
        execAsyncStub = sandbox.stub(processUtil, 'execAsync').resolves('');
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    function createRootPackage(version: string): void {
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'parent', version, private: true }));
    }

    function markAsPnpmRepo(): void {
        fs.writeFileSync(path.join(tempDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
    }

    function createPackage(relativePath: string, content: Partial<PackageData> & { name: string; version: string }): PackageHelper {
        const pkgDir = path.join(tempDir, relativePath);
        fs.mkdirSync(pkgDir, { recursive: true });
        const filePath = path.join(pkgDir, 'package.json');
        fs.writeFileSync(filePath, JSON.stringify(content, undefined, 4));
        return new PackageHelper(filePath, content.name);
    }

    function stubGit(lastTag: string, commitCount: string): void {
        execStub.withArgs(sinon.match(/git describe/)).returns(lastTag);
        execStub.withArgs(sinon.match(/git rev-list/)).returns(commitCount);
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
            execStub.withArgs(sinon.match(/git describe/)).throws(new Error('fatal: No names found'));
            expect(() => deriveCanaryVersion(tempDir)).to.throw(/fetch-depth: 0/);
        });
    });

    describe('publish', () => {
        it('should refuse to publish non-pnpm repositories', async () => {
            createRootPackage('2.8.0-next');
            fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '');
            try {
                await publish('next', makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('requires a pnpm-based repository');
            }
        });
    });

    describe('publish next', () => {
        it('should apply the canary version to all workspace packages and publish with --tag next', async () => {
            createRootPackage('2.8.0-next');
            markAsPnpmRepo();
            stubGit('v2.7.0', '42');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.8.0-next' });
            const pkgB = createPackage('packages/b', { name: '@eclipse-glsp/b', version: '2.8.0-next' });
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([pkgA, pkgB]);

            await publish('next', makeOptions());

            const writtenA = JSON.parse(fs.readFileSync(pkgA.filePath, 'utf8'));
            const writtenB = JSON.parse(fs.readFileSync(pkgB.filePath, 'utf8'));
            expect(writtenA.version).to.equal('2.8.0-next.42');
            expect(writtenB.version).to.equal('2.8.0-next.42');
            // the root package keeps the plain base version
            const root = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
            expect(root.version).to.equal('2.8.0-next');

            expect(execAsyncStub.calledOnce).to.be.true;
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm publish -r --tag next --no-git-checks --report-summary');
            expect(execAsyncStub.firstCall.args[1].cwd).to.equal(tempDir);
        });

        it('should not write versions and pass --dry-run in dry-run mode', async () => {
            createRootPackage('2.8.0-next');
            markAsPnpmRepo();
            stubGit('v2.7.0', '7');
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.8.0-next' });
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([pkgA]);

            await publish('next', makeOptions({ dryRun: true }));

            const writtenA = JSON.parse(fs.readFileSync(pkgA.filePath, 'utf8'));
            expect(writtenA.version).to.equal('2.8.0-next');
            expect(execAsyncStub.firstCall.args[0]).to.contain('--dry-run');
        });

        it('should pass a custom registry to pnpm publish', async () => {
            createRootPackage('2.8.0-next');
            markAsPnpmRepo();
            stubGit('v2.7.0', '7');
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([]);

            await publish('next', makeOptions({ registry: 'http://localhost:4873' }));

            expect(execAsyncStub.firstCall.args[0]).to.contain('--registry http://localhost:4873');
        });

        it('should refuse to publish a canary if the root version is not a next version', async () => {
            createRootPackage('2.8.0');
            markAsPnpmRepo();
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
            markAsPnpmRepo();
            try {
                await publish('latest', makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain("Refusing to publish under the 'latest' dist-tag");
            }
        });

        it('should publish with --tag latest when unpublished packages exist', async () => {
            createRootPackage('2.9.0');
            markAsPnpmRepo();
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([pkgA]);
            // npm view fails -> version does not exist yet
            execStub.withArgs(sinon.match(/npm view/)).throws(new Error('404'));

            await publish('latest', makeOptions());

            expect(execAsyncStub.calledOnce).to.be.true;
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm publish -r --tag latest --no-git-checks --report-summary');
        });

        it('should skip publishing when all package versions already exist', async () => {
            createRootPackage('2.9.0');
            markAsPnpmRepo();
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([pkgA]);
            // npm view returns the version -> already published
            execStub.withArgs(sinon.match(/npm view/)).returns('2.9.0');

            await publish('latest', makeOptions());

            expect(execAsyncStub.notCalled).to.be.true;
        });

        it('should ignore private packages when checking for unpublished versions', async () => {
            createRootPackage('2.9.0');
            markAsPnpmRepo();
            const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', version: '2.9.0' });
            const examplePkg = createPackage('examples/e', { name: '@eclipse-glsp-examples/e', version: '2.9.0', private: true });
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([pkgA, examplePkg]);
            execStub.withArgs(sinon.match(/npm view @eclipse-glsp\/a/)).returns('2.9.0');

            await publish('latest', makeOptions());

            // the only public package is already published -> nothing to publish
            expect(execAsyncStub.notCalled).to.be.true;
        });
    });

    describe('publish summary', () => {
        it('should report and remove the pnpm publish summary', async () => {
            createRootPackage('2.8.0-next');
            markAsPnpmRepo();
            stubGit('v2.7.0', '7');
            sandbox.stub(packageUtil, 'getWorkspacePackages').returns([]);
            const summaryPath = path.join(tempDir, 'pnpm-publish-summary.json');
            execAsyncStub.callsFake(() => {
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
