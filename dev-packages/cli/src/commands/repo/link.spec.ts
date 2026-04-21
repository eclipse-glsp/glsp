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
import { GLSPRepo, PackageHelper } from '../../util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import {
    SINGLETON_DEPS,
    LinkActionOptions,
    filterLinkableRepos,
    getGLSPWorkspacePackages,
    getRegisteredPackages,
    registerPackages,
    registerSingletons,
    consumePackages,
    consumeSingletons,
    runLink,
    runUnlink
} from './link';

function mockPkg(name: string, location: string, deps: Record<string, string> = {}, devDeps: Record<string, string> = {}): PackageHelper {
    return {
        name,
        location,
        filePath: path.join(location, 'package.json'),
        content: { name, version: '1.0.0', dependencies: deps, devDependencies: devDeps }
    } as unknown as PackageHelper;
}

describe('link-action', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execStub: sinon.SinonStub;
    let execAsyncStub: sinon.SinonStub;
    let workspaceStub: sinon.SinonStub;

    beforeEach(() => {
        tempDir = createTempDir();
        execStub = sandbox.stub(processUtil, 'exec').returns('');
        execAsyncStub = sandbox.stub(processUtil, 'execAsync').resolves('');
        workspaceStub = sandbox.stub(packageUtil, 'getYarnWorkspacePackages');
        workspaceStub.returns([]);
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    function createRepoDirs(...names: string[]): void {
        for (const name of names) {
            fs.mkdirSync(path.join(tempDir, name), { recursive: true });
        }
    }

    function createNodeModules(repo: string, ...deps: string[]): void {
        for (const dep of deps) {
            fs.mkdirSync(path.join(tempDir, repo, 'node_modules', dep), { recursive: true });
        }
    }

    function makeOptions(overrides: Partial<LinkActionOptions> = {}): LinkActionOptions {
        return { dir: tempDir, verbose: false, failFast: true, ...overrides };
    }

    function setupWorkspaceStub(): void {
        const clientPkg = mockPkg('@eclipse-glsp/client', path.join(tempDir, 'glsp-client/packages/client'));
        const protocolPkg = mockPkg('@eclipse-glsp/protocol', path.join(tempDir, 'glsp-client/packages/protocol'));
        const serverPkg = mockPkg('@eclipse-glsp/server', path.join(tempDir, 'glsp-server-node/packages/server'), {
            '@eclipse-glsp/protocol': '^1.0.0'
        });
        workspaceStub.callsFake((rootPath: string, includeRoot?: boolean) => {
            const repoName = path.basename(rootPath);
            let packages: PackageHelper[];
            if (repoName === 'glsp-client') {
                packages = [clientPkg, protocolPkg];
            } else if (repoName === 'glsp-server-node') {
                packages = [serverPkg];
            } else {
                packages = [];
            }
            return includeRoot ? [mockPkg(repoName, rootPath), ...packages] : packages;
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

    describe('getRegisteredPackages', () => {
        it('should return scoped packages from the link directory', () => {
            const linkDir = path.join(tempDir, '.yarn-link');
            fs.mkdirSync(path.join(linkDir, '@eclipse-glsp', 'client'), { recursive: true });
            fs.mkdirSync(path.join(linkDir, '@eclipse-glsp', 'protocol'), { recursive: true });
            const result = getRegisteredPackages(linkDir);
            expect(result).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/protocol']);
        });

        it('should return empty array when link directory does not exist', () => {
            const result = getRegisteredPackages(path.join(tempDir, 'nonexistent'));
            expect(result).to.deep.equal([]);
        });

        it('should ignore non-scoped entries', () => {
            const linkDir = path.join(tempDir, '.yarn-link');
            fs.mkdirSync(path.join(linkDir, '@eclipse-glsp', 'client'), { recursive: true });
            fs.writeFileSync(path.join(linkDir, 'sprotty'), '');
            const result = getRegisteredPackages(linkDir);
            expect(result).to.deep.equal(['@eclipse-glsp/client']);
        });
    });

    describe('registerPackages', () => {
        it('should run yarn link for each @eclipse-glsp workspace package and return names', () => {
            const repoDir = path.join(tempDir, 'glsp-client');
            const linkDir = path.join(tempDir, '.yarn-link');
            workspaceStub
                .withArgs(repoDir)
                .returns([
                    mockPkg('@eclipse-glsp/client', path.join(repoDir, 'packages/client')),
                    mockPkg('@eclipse-glsp/protocol', path.join(repoDir, 'packages/protocol'))
                ]);
            const registered = registerPackages(repoDir, linkDir);
            expect(registered).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/protocol']);
            expect(execStub.callCount).to.equal(2);
            expect(execStub.firstCall.args[0]).to.equal(`yarn link --link-folder ${linkDir}`);
            expect(execStub.firstCall.args[1].cwd).to.equal(path.join(repoDir, 'packages/client'));
            expect(execStub.secondCall.args[1].cwd).to.equal(path.join(repoDir, 'packages/protocol'));
        });
    });

    describe('registerSingletons', () => {
        it('should run yarn link for each singleton in node_modules', () => {
            const clientDir = path.join(tempDir, 'glsp-client');
            const linkDir = path.join(tempDir, '.yarn-link');
            registerSingletons(clientDir, linkDir);
            expect(execStub.callCount).to.equal(SINGLETON_DEPS.length);
            for (let i = 0; i < SINGLETON_DEPS.length; i++) {
                expect(execStub.getCall(i).args[0]).to.equal(`yarn link --link-folder ${linkDir}`);
                expect(execStub.getCall(i).args[1].cwd).to.equal(path.join(clientDir, 'node_modules', SINGLETON_DEPS[i]));
            }
        });
    });

    describe('consumePackages', () => {
        it('should link all registered packages into the repo', () => {
            const repoDir = path.join(tempDir, 'glsp-server-node');
            const linkDir = path.join(tempDir, '.yarn-link');
            consumePackages(repoDir, linkDir, ['@eclipse-glsp/protocol', '@eclipse-glsp/client']);
            expect(execStub.calledOnce).to.be.true;
            expect(execStub.firstCall.args[0]).to.equal(`yarn link --link-folder ${linkDir} @eclipse-glsp/protocol @eclipse-glsp/client`);
            expect(execStub.firstCall.args[1].cwd).to.equal(repoDir);
        });

        it('should not call exec when registeredPackages is empty', () => {
            const repoDir = path.join(tempDir, 'glsp-server-node');
            const linkDir = path.join(tempDir, '.yarn-link');
            consumePackages(repoDir, linkDir, []);
            expect(execStub.called).to.be.false;
        });
    });

    describe('consumeSingletons', () => {
        it('should link all singleton deps', () => {
            const repoDir = path.join(tempDir, 'glsp-server-node');
            const linkDir = path.join(tempDir, '.yarn-link');
            consumeSingletons(repoDir, linkDir);
            expect(execStub.calledOnce).to.be.true;
            expect(execStub.firstCall.args[0]).to.equal(`yarn link --link-folder ${linkDir} ${SINGLETON_DEPS.join(' ')}`);
            expect(execStub.firstCall.args[1].cwd).to.equal(repoDir);
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
            expect(result).to.have.length(2);
            expect(result.map(p => p.name)).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/protocol']);
        });
    });

    describe('runLink', () => {
        it('should register, consume, and reinstall in build order', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            const linkDir = path.join(tempDir, '.yarn-link');

            const clientRegCalls = execStub
                .getCalls()
                .filter(
                    (c: sinon.SinonSpyCall) =>
                        c.args[0] === `yarn link --link-folder ${linkDir}` && (c.args[1]?.cwd as string)?.includes('glsp-client/packages')
                );
            expect(clientRegCalls).to.have.length(2);

            const singletonRegCalls = execStub
                .getCalls()
                .filter(
                    (c: sinon.SinonSpyCall) =>
                        c.args[0] === `yarn link --link-folder ${linkDir}` &&
                        (c.args[1]?.cwd as string)?.includes('glsp-client/node_modules')
                );
            expect(singletonRegCalls).to.have.length(SINGLETON_DEPS.length);

            const clientConsumeCall = execStub
                .getCalls()
                .find(
                    (c: sinon.SinonSpyCall) =>
                        (c.args[0] as string).includes('@eclipse-glsp/client') && c.args[1]?.cwd === path.join(tempDir, 'glsp-client')
                );
            expect(clientConsumeCall).to.be.undefined;

            const consumeCall = execStub
                .getCalls()
                .find(
                    (c: sinon.SinonSpyCall) =>
                        (c.args[0] as string).includes('@eclipse-glsp/client') &&
                        (c.args[0] as string).includes('@eclipse-glsp/protocol') &&
                        (c.args[1]?.cwd as string)?.endsWith('glsp-server-node')
                );
            expect(consumeCall).to.not.be.undefined;

            const singletonConsumeCall = execStub
                .getCalls()
                .find(
                    (c: sinon.SinonSpyCall) =>
                        (c.args[0] as string).includes(SINGLETON_DEPS.join(' ')) && (c.args[1]?.cwd as string)?.endsWith('glsp-server-node')
                );
            expect(singletonConsumeCall).to.not.be.undefined;

            expect(execAsyncStub.callCount).to.equal(3);
            expect(execAsyncStub.firstCall.args[0]).to.equal('yarn install');
            expect(execAsyncStub.secondCall.args[0]).to.equal('yarn install --force');
            expect(execAsyncStub.thirdCall.args[0]).to.equal('yarn install --force');
        });

        it('should run yarn install before registering singletons for glsp-client', async () => {
            createRepoDirs('glsp-client');
            setupWorkspaceStub();

            await runLink(['glsp-client'] as GLSPRepo[], makeOptions());

            expect(execAsyncStub.firstCall.args[0]).to.equal('yarn install');
            expect(execAsyncStub.firstCall.args[1].cwd).to.equal(path.join(tempDir, 'glsp-client'));
        });

        it('should stop on first failure when failFast is true', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            workspaceStub.returns([]);
            execStub.throws(new Error('link failed'));
            try {
                await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: true }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to link');
            }
        });

        it('should continue on failure when failFast is false', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            setupWorkspaceStub();
            execStub.onFirstCall().throws(new Error('link failed'));
            execStub.returns('');

            try {
                await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: false }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to link');
            }
            expect(execAsyncStub.called).to.be.true;
        });

        it('should skip non-linkable repos', async () => {
            createRepoDirs('glsp-server');
            await runLink(['glsp-server'] as GLSPRepo[], makeOptions());
            expect(execStub.called).to.be.false;
            expect(execAsyncStub.called).to.be.false;
        });
    });

    describe('runUnlink', () => {
        function createLinkDir(...packages: string[]): void {
            for (const pkg of packages) {
                fs.mkdirSync(path.join(tempDir, '.yarn-link', pkg), { recursive: true });
            }
        }

        it('should unlink repos in reverse build order', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            createLinkDir('@eclipse-glsp/client', '@eclipse-glsp/protocol');
            setupWorkspaceStub();

            await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            const linkDir = path.join(tempDir, '.yarn-link');

            const serverUnlinks = execStub
                .getCalls()
                .filter(
                    (c: sinon.SinonSpyCall) =>
                        (c.args[0] as string).startsWith('yarn unlink') && (c.args[1]?.cwd as string)?.endsWith('glsp-server-node')
                );
            expect(serverUnlinks.length).to.be.greaterThan(0);

            const clientUnregCalls = execStub
                .getCalls()
                .filter(
                    (c: sinon.SinonSpyCall) =>
                        c.args[0] === `yarn unlink --link-folder ${linkDir}` && (c.args[1]?.cwd as string)?.includes('glsp-client/packages')
                );
            expect(clientUnregCalls).to.have.length(2);

            expect(execAsyncStub.callCount).to.equal(2);
        });

        it('should stop on first failure when failFast is true', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            setupWorkspaceStub();
            execStub.throws(new Error('unlink failed'));
            try {
                await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: true }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to unlink');
            }
        });
    });
});
