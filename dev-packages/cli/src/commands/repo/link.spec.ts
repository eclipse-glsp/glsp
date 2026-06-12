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
import { GLSPRepo, PackageHelper, getPnpmOverrides } from '../../util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import {
    SINGLETON_DEPS,
    LinkActionOptions,
    asLinkOverride,
    computeLinkOverrides,
    computeSingletonOverrides,
    filterLinkableRepos,
    getGLSPWorkspacePackages,
    runLink,
    runUnlink
} from './link';

function mockPkg(name: string, location: string): PackageHelper {
    return {
        name,
        location,
        filePath: path.join(location, 'package.json'),
        content: { name, version: '1.0.0' }
    } as unknown as PackageHelper;
}

describe('link-action', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execAsyncStub: sinon.SinonStub;
    let workspaceStub: sinon.SinonStub;

    beforeEach(() => {
        tempDir = createTempDir();
        sandbox.stub(processUtil, 'exec').returns('');
        execAsyncStub = sandbox.stub(processUtil, 'execAsync').resolves('');
        workspaceStub = sandbox.stub(packageUtil, 'getWorkspacePackages');
        workspaceStub.returns([]);
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    function createPnpmRepo(name: string, workspaceContent = "packages:\n    - 'packages/*'\n"): string {
        const repoDir = path.join(tempDir, name);
        fs.mkdirSync(repoDir, { recursive: true });
        fs.writeFileSync(path.join(repoDir, 'pnpm-workspace.yaml'), workspaceContent);
        return repoDir;
    }

    function createYarnRepo(name: string): string {
        const repoDir = path.join(tempDir, name);
        fs.mkdirSync(repoDir, { recursive: true });
        fs.writeFileSync(path.join(repoDir, 'yarn.lock'), '');
        return repoDir;
    }

    function makeOptions(overrides: Partial<LinkActionOptions> = {}): LinkActionOptions {
        return { dir: tempDir, verbose: false, failFast: true, install: true, ...overrides };
    }

    function setupWorkspaceStub(): void {
        workspaceStub.callsFake((rootPath: string) => {
            const repoName = path.basename(rootPath);
            if (repoName === 'glsp-client') {
                return [
                    mockPkg('@eclipse-glsp/client', path.join(rootPath, 'packages/client')),
                    mockPkg('@eclipse-glsp/protocol', path.join(rootPath, 'packages/protocol'))
                ];
            }
            if (repoName === 'glsp-server-node') {
                return [mockPkg('@eclipse-glsp/server', path.join(rootPath, 'packages/server'))];
            }
            return [];
        });
    }

    describe('filterLinkableRepos', () => {
        it('should keep linkable npm repos', () => {
            const result = filterLinkableRepos(['glsp-client', 'glsp-server-node', 'glsp-theia-integration'] as GLSPRepo[]);
            expect(result).to.deep.equal(['glsp-client', 'glsp-server-node', 'glsp-theia-integration']);
        });

        it('should exclude non-linkable repos', () => {
            const result = filterLinkableRepos(['glsp-client', 'glsp-server', 'glsp-eclipse-integration', 'glsp-playwright'] as GLSPRepo[]);
            expect(result).to.deep.equal(['glsp-client']);
        });
    });

    describe('getGLSPWorkspacePackages', () => {
        it('should filter to @eclipse-glsp scoped packages', () => {
            const repoDir = path.join(tempDir, 'glsp-client');
            workspaceStub
                .withArgs(repoDir)
                .returns([
                    mockPkg('@eclipse-glsp/client', path.join(repoDir, 'packages/client')),
                    mockPkg('@eclipse-glsp/protocol', path.join(repoDir, 'packages/protocol')),
                    mockPkg('some-other-pkg', path.join(repoDir, 'packages/other'))
                ]);
            const result = getGLSPWorkspacePackages(repoDir);
            expect(result.map(p => p.name)).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/protocol']);
        });
    });

    describe('override computation', () => {
        it('should compute relative link: overrides', () => {
            const repoDir = path.join(tempDir, 'glsp-server-node');
            const clientPkgDir = path.join(tempDir, 'glsp-client', 'packages', 'client');
            expect(asLinkOverride(repoDir, clientPkgDir)).to.equal('link:../glsp-client/packages/client');

            const overrides = computeLinkOverrides(new Map([['@eclipse-glsp/client', clientPkgDir]]), repoDir);
            expect(overrides).to.deep.equal({ '@eclipse-glsp/client': 'link:../glsp-client/packages/client' });
        });

        it('should compute singleton overrides pointing into glsp-client node_modules', () => {
            const repoDir = path.join(tempDir, 'glsp-server-node');
            const clientDir = path.join(tempDir, 'glsp-client');
            const overrides = computeSingletonOverrides(clientDir, repoDir);
            expect(Object.keys(overrides)).to.deep.equal([...SINGLETON_DEPS]);
            expect(overrides.inversify).to.equal('link:../glsp-client/node_modules/inversify');
        });
    });

    describe('runLink', () => {
        it('should write link overrides and install in build order', async () => {
            const clientDir = createPnpmRepo('glsp-client');
            const serverDir = createPnpmRepo('glsp-server-node');
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            // glsp-client is first in the build order and gets no overrides (no prior repos)
            expect(getPnpmOverrides(clientDir)).to.deep.equal({});

            // glsp-server-node gets the glsp-client packages and the singletons
            const serverOverrides = getPnpmOverrides(serverDir);
            expect(serverOverrides['@eclipse-glsp/client']).to.equal('link:../glsp-client/packages/client');
            expect(serverOverrides['@eclipse-glsp/protocol']).to.equal('link:../glsp-client/packages/protocol');
            for (const dep of SINGLETON_DEPS) {
                expect(serverOverrides[dep]).to.equal(`link:../glsp-client/node_modules/${dep}`);
            }

            // pnpm install runs once per repo, client first
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm install');
            expect(execAsyncStub.firstCall.args[1].cwd).to.equal(clientDir);
            expect(execAsyncStub.secondCall.args[1].cwd).to.equal(serverDir);
        });

        it('should preserve unrelated pnpm-workspace.yaml content and comments', async () => {
            createPnpmRepo('glsp-client');
            const serverDir = createPnpmRepo(
                'glsp-server-node',
                "packages:\n    - 'packages/*'\n\n# keep this comment\nminimumReleaseAge: 4320\n"
            );
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            const content = fs.readFileSync(path.join(serverDir, 'pnpm-workspace.yaml'), 'utf8');
            expect(content).to.contain('# keep this comment');
            expect(content).to.contain('minimumReleaseAge: 4320');
            expect(content).to.contain('overrides:');
        });

        it('should skip pnpm install with --no-install', async () => {
            createPnpmRepo('glsp-client');
            createPnpmRepo('glsp-server-node');
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ install: false }));

            expect(execAsyncStub.notCalled).to.be.true;
        });

        it('should fail with a clear error for repos that are not pnpm-based', async () => {
            createPnpmRepo('glsp-client');
            createYarnRepo('glsp-server-node');

            try {
                await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain("'glsp-server-node' does not use pnpm");
            }
            expect(execAsyncStub.notCalled).to.be.true;
        });

        it('should skip non-linkable repos', async () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-server'), { recursive: true });
            await runLink(['glsp-server'] as GLSPRepo[], makeOptions());
            expect(execAsyncStub.called).to.be.false;
        });

        it('should continue on failure when failFast is false', async () => {
            createPnpmRepo('glsp-client');
            createPnpmRepo('glsp-server-node');
            setupWorkspaceStub();
            execAsyncStub.onFirstCall().rejects(new Error('install failed'));

            try {
                await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: false }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to link');
            }
            expect(execAsyncStub.callCount).to.equal(2);
        });
    });

    describe('runUnlink', () => {
        it('should remove the link overrides in reverse build order and reinstall', async () => {
            const clientDir = createPnpmRepo('glsp-client');
            const serverDir = createPnpmRepo('glsp-server-node');
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());
            execAsyncStub.resetHistory();

            await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            expect(getPnpmOverrides(clientDir)).to.deep.equal({});
            expect(getPnpmOverrides(serverDir)).to.deep.equal({});
            // the empty overrides section is removed entirely
            expect(fs.readFileSync(path.join(serverDir, 'pnpm-workspace.yaml'), 'utf8')).to.not.contain('overrides');

            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.firstCall.args[1].cwd).to.equal(serverDir);
            expect(execAsyncStub.secondCall.args[1].cwd).to.equal(clientDir);
        });

        it('should preserve unrelated overrides', async () => {
            createPnpmRepo('glsp-client');
            const serverDir = createPnpmRepo(
                'glsp-server-node',
                "packages:\n    - 'packages/*'\noverrides:\n    some-vuln-dep: '^2.0.0'\n"
            );
            setupWorkspaceStub();

            await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            expect(getPnpmOverrides(serverDir)).to.deep.equal({ 'some-vuln-dep': '^2.0.0' });
        });

        it('should be idempotent when no links exist', async () => {
            createPnpmRepo('glsp-client');
            setupWorkspaceStub();

            await runUnlink(['glsp-client'] as GLSPRepo[], makeOptions());
            await runUnlink(['glsp-client'] as GLSPRepo[], makeOptions());

            expect(execAsyncStub.callCount).to.equal(2);
        });
    });
});
