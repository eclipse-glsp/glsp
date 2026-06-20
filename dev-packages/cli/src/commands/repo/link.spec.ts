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
import * as YAML from 'yaml';
import { GLSPRepo, PackageHelper } from '../../util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import {
    SINGLETON_DEPS,
    LinkActionOptions,
    applyLinkOverrides,
    collectProvidedPackages,
    collectSingletonLinks,
    filterLinkableRepos,
    getGLSPWorkspacePackages,
    removeLinkOverrides,
    resolveSingletonDir,
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
        execAsyncStub = sandbox.stub(processUtil, 'execAsync').resolves('');
        workspaceStub = sandbox.stub(packageUtil, 'getWorkspacePackages');
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

    /** Creates resolvable node_modules packages (real package.json + entry) so `require.resolve` finds them. */
    function createNodeModules(repo: string, ...deps: string[]): void {
        for (const dep of deps) {
            const depDir = path.join(tempDir, repo, 'node_modules', dep);
            fs.mkdirSync(depDir, { recursive: true });
            fs.writeFileSync(path.join(depDir, 'package.json'), JSON.stringify({ name: dep, version: '1.0.0', main: 'index.js' }));
            fs.writeFileSync(path.join(depDir, 'index.js'), 'module.exports = {};');
        }
        // createRequire needs an anchor manifest in the repo dir
        const repoManifest = path.join(tempDir, repo, 'package.json');
        if (!fs.existsSync(repoManifest)) {
            fs.writeFileSync(repoManifest, JSON.stringify({ name: repo, version: '1.0.0' }));
        }
    }

    function writeWorkspaceYaml(repo: string, content: Record<string, unknown>): void {
        fs.writeFileSync(path.join(tempDir, repo, 'pnpm-workspace.yaml'), YAML.stringify(content));
    }

    function readWorkspaceYaml(repo: string): { packages?: string[]; overrides?: Record<string, string> } {
        const yamlPath = path.join(tempDir, repo, 'pnpm-workspace.yaml');
        return fs.existsSync(yamlPath) ? YAML.parse(fs.readFileSync(yamlPath, 'utf8')) : {};
    }

    function makeOptions(overrides: Partial<LinkActionOptions> = {}): LinkActionOptions {
        return { dir: tempDir, verbose: false, failFast: true, ...overrides };
    }

    function setupWorkspaceStub(): void {
        const clientPkg = mockPkg('@eclipse-glsp/client', path.join(tempDir, 'glsp-client/packages/client'));
        const protocolPkg = mockPkg('@eclipse-glsp/protocol', path.join(tempDir, 'glsp-client/packages/protocol'));
        const serverPkg = mockPkg('@eclipse-glsp/server', path.join(tempDir, 'glsp-server-node/packages/server'));
        workspaceStub.callsFake((rootPath: string) => {
            const repoName = path.basename(rootPath);
            if (repoName === 'glsp-client') {
                return [clientPkg, protocolPkg];
            }
            if (repoName === 'glsp-server-node') {
                return [serverPkg];
            }
            return [];
        });
    }

    describe('filterLinkableRepos', () => {
        it('should keep linkable npm repos', () => {
            const result = filterLinkableRepos(['glsp-client', 'glsp-server-node', 'glsp-theia-integration'] as GLSPRepo[]);
            expect(result).to.deep.equal(['glsp-client', 'glsp-server-node', 'glsp-theia-integration']);
        });

        it('should keep glsp-eclipse-integration', () => {
            const result = filterLinkableRepos(['glsp-client', 'glsp-eclipse-integration'] as GLSPRepo[]);
            expect(result).to.deep.equal(['glsp-client', 'glsp-eclipse-integration']);
        });

        it('should exclude non-linkable repos', () => {
            const result = filterLinkableRepos(['glsp-client', 'glsp-server', 'glsp-playwright'] as GLSPRepo[]);
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
            expect(result).to.have.length(2);
            expect(result.map(p => p.name)).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/protocol']);
        });
    });

    describe('collectProvidedPackages', () => {
        it('should map @eclipse-glsp workspace packages to their location', () => {
            const repoDir = path.join(tempDir, 'glsp-client');
            workspaceStub
                .withArgs(repoDir)
                .returns([
                    mockPkg('@eclipse-glsp/client', path.join(repoDir, 'packages/client')),
                    mockPkg('@eclipse-glsp/protocol', path.join(repoDir, 'packages/protocol'))
                ]);
            expect(collectProvidedPackages(repoDir)).to.deep.equal({
                '@eclipse-glsp/client': path.join(repoDir, 'packages/client'),
                '@eclipse-glsp/protocol': path.join(repoDir, 'packages/protocol')
            });
        });
    });

    describe('resolveSingletonDir', () => {
        it('should resolve the package directory as seen from a provider dir', () => {
            createNodeModules('glsp-client', 'sprotty');
            const clientDir = path.join(tempDir, 'glsp-client');
            const dir = resolveSingletonDir([clientDir], 'sprotty');
            expect(dir).to.equal(fs.realpathSync(path.join(clientDir, 'node_modules', 'sprotty')));
        });

        it('should walk up to the package root when the entry has a nested manifest', () => {
            const clientDir = path.join(tempDir, 'glsp-client');
            fs.mkdirSync(clientDir, { recursive: true });
            fs.writeFileSync(path.join(clientDir, 'package.json'), JSON.stringify({ name: 'glsp-client' }));
            // inversify-style layout: package root + a nested lib/cjs/package.json without a name
            const invDir = path.join(clientDir, 'node_modules', 'inversify');
            fs.mkdirSync(path.join(invDir, 'lib', 'cjs'), { recursive: true });
            fs.writeFileSync(path.join(invDir, 'package.json'), JSON.stringify({ name: 'inversify', main: 'lib/cjs/index.js' }));
            fs.writeFileSync(path.join(invDir, 'lib', 'cjs', 'package.json'), JSON.stringify({ type: 'commonjs' }));
            fs.writeFileSync(path.join(invDir, 'lib', 'cjs', 'index.js'), 'module.exports = {};');

            expect(resolveSingletonDir([clientDir], 'inversify')).to.equal(fs.realpathSync(invDir));
        });

        it('should return undefined when the dependency is not resolvable from any dir', () => {
            createRepoDirs('glsp-client');
            fs.writeFileSync(path.join(tempDir, 'glsp-client', 'package.json'), JSON.stringify({ name: 'glsp-client' }));
            expect(resolveSingletonDir([path.join(tempDir, 'glsp-client')], 'sprotty')).to.be.undefined;
        });
    });

    describe('collectSingletonLinks', () => {
        it('should collect resolvable singletons from the glsp-client install', () => {
            workspaceStub.returns([]); // no @eclipse-glsp packages → resolve from clientDir fallback
            createNodeModules('glsp-client', 'sprotty', 'inversify');
            const clientDir = path.join(tempDir, 'glsp-client');
            const links = collectSingletonLinks(clientDir);
            expect(links.sprotty).to.equal(fs.realpathSync(path.join(clientDir, 'node_modules', 'sprotty')));
            expect(links.inversify).to.equal(fs.realpathSync(path.join(clientDir, 'node_modules', 'inversify')));
            // unresolvable singletons (sprotty-protocol, etc.) are simply skipped
            expect(links['sprotty-protocol']).to.be.undefined;
        });
    });

    describe('applyLinkOverrides', () => {
        it('should write relative link: overrides and preserve existing content', () => {
            createRepoDirs('glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', { packages: ['packages/*'], overrides: { foo: '1.0.0' } });
            const repoDir = path.join(tempDir, 'glsp-server-node');
            applyLinkOverrides(repoDir, { '@eclipse-glsp/protocol': path.join(tempDir, 'glsp-client/packages/protocol') });

            const workspace = readWorkspaceYaml('glsp-server-node');
            expect(workspace.packages).to.deep.equal(['packages/*']);
            expect(workspace.overrides).to.deep.equal({
                foo: '1.0.0',
                '@eclipse-glsp/protocol': 'link:../glsp-client/packages/protocol'
            });
        });

        it('should create the workspace file when missing', () => {
            createRepoDirs('glsp-server-node');
            const repoDir = path.join(tempDir, 'glsp-server-node');
            applyLinkOverrides(repoDir, { sprotty: path.join(tempDir, 'glsp-client/node_modules/sprotty') });
            expect(readWorkspaceYaml('glsp-server-node').overrides).to.deep.equal({ sprotty: 'link:../glsp-client/node_modules/sprotty' });
        });

        it('should be a no-op for empty links', () => {
            createRepoDirs('glsp-server-node');
            const repoDir = path.join(tempDir, 'glsp-server-node');
            applyLinkOverrides(repoDir, {});
            expect(fs.existsSync(path.join(repoDir, 'pnpm-workspace.yaml'))).to.be.false;
        });
    });

    describe('removeLinkOverrides', () => {
        it('should remove only managed link overrides and keep others', () => {
            createRepoDirs('glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', {
                packages: ['packages/*'],
                overrides: {
                    '@eclipse-glsp/protocol': 'link:../glsp-client/packages/protocol',
                    '@eclipse-glsp-examples/workflow-glsp': 'link:../glsp-client/examples/workflow-glsp',
                    sprotty: 'link:../glsp-client/node_modules/sprotty',
                    'some-dep': '1.2.3'
                }
            });
            const removed = removeLinkOverrides(path.join(tempDir, 'glsp-server-node'));
            expect(removed).to.be.true;
            const workspace = readWorkspaceYaml('glsp-server-node');
            expect(workspace.packages).to.deep.equal(['packages/*']);
            expect(workspace.overrides).to.deep.equal({ 'some-dep': '1.2.3' });
        });

        it('should drop the overrides key when it becomes empty', () => {
            createRepoDirs('glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', {
                packages: ['packages/*'],
                overrides: { '@eclipse-glsp/protocol': 'link:../glsp-client/packages/protocol' }
            });
            removeLinkOverrides(path.join(tempDir, 'glsp-server-node'));
            expect(readWorkspaceYaml('glsp-server-node')).to.not.have.property('overrides');
        });

        it('should not touch non-link overrides for the same package', () => {
            createRepoDirs('glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', { overrides: { sprotty: '1.4.0' } });
            const removed = removeLinkOverrides(path.join(tempDir, 'glsp-server-node'));
            expect(removed).to.be.false;
            expect(readWorkspaceYaml('glsp-server-node').overrides).to.deep.equal({ sprotty: '1.4.0' });
        });

        it('should return false when no workspace file exists', () => {
            createRepoDirs('glsp-server-node');
            expect(removeLinkOverrides(path.join(tempDir, 'glsp-server-node'))).to.be.false;
        });
    });

    describe('runLink', () => {
        it('should link provider packages and singletons into downstream repos in build order', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            // glsp-client is the source of truth and gets no overrides.
            expect(readWorkspaceYaml('glsp-client')).to.not.have.property('overrides');

            // glsp-server-node consumes glsp-client's packages and the shared singletons.
            const serverOverrides = readWorkspaceYaml('glsp-server-node').overrides ?? {};
            expect(serverOverrides['@eclipse-glsp/client']).to.equal('link:../glsp-client/packages/client');
            expect(serverOverrides['@eclipse-glsp/protocol']).to.equal('link:../glsp-client/packages/protocol');
            for (const dep of SINGLETON_DEPS) {
                expect(serverOverrides[dep]).to.equal(`link:../glsp-client/node_modules/${dep}`);
            }

            // Each repo is installed (to apply the overrides) and then built, in build order:
            // install client, build client, install server-node, build server-node.
            expect(execAsyncStub.callCount).to.equal(4);
            const calls = execAsyncStub.getCalls().map(c => [c.args[0], c.args[1].cwd] as const);
            expect(calls).to.deep.equal([
                ['pnpm install --no-frozen-lockfile', path.join(tempDir, 'glsp-client')],
                ['pnpm run --if-present build', path.join(tempDir, 'glsp-client')],
                ['pnpm install --no-frozen-lockfile', path.join(tempDir, 'glsp-server-node')],
                ['pnpm run --if-present build', path.join(tempDir, 'glsp-server-node')]
            ]);
        });

        it('should not build when build is disabled', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ build: false }));

            // Only the override-applying install runs per repo; no build.
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.getCalls().every(c => c.args[0] === 'pnpm install --no-frozen-lockfile')).to.be.true;
        });

        it('should link into the client/ subdir for glsp-eclipse-integration', async () => {
            createRepoDirs('glsp-client', 'glsp-eclipse-integration');
            createNodeModules('glsp-client', ...SINGLETON_DEPS);
            // The linkable pnpm workspace of glsp-eclipse-integration lives in client/, not the repo root.
            const clientDir = path.join(tempDir, 'glsp-eclipse-integration', 'client');
            fs.mkdirSync(clientDir, { recursive: true });
            setupWorkspaceStub();

            await runLink(['glsp-client', 'glsp-eclipse-integration'] as GLSPRepo[], makeOptions({ build: false }));

            // Overrides go into client/pnpm-workspace.yaml, not the repo root.
            expect(fs.existsSync(path.join(tempDir, 'glsp-eclipse-integration', 'pnpm-workspace.yaml'))).to.be.false;
            const overrides = (YAML.parse(fs.readFileSync(path.join(clientDir, 'pnpm-workspace.yaml'), 'utf8')).overrides ?? {}) as Record<
                string,
                string
            >;
            // Relative link paths gain an extra ../ because the workspace is one level deeper than the repo root.
            expect(overrides['@eclipse-glsp/client']).to.equal('link:../../glsp-client/packages/client');
            for (const dep of SINGLETON_DEPS) {
                expect(overrides[dep]).to.equal(`link:../../glsp-client/node_modules/${dep}`);
            }

            // The install runs in the client/ workspace, not the repo root.
            const eclipseInstall = execAsyncStub.getCalls().find(c => c.args[1].cwd === clientDir);
            expect(eclipseInstall, 'install should run in client/').to.not.be.undefined;
        });

        it('should stop on first failure when failFast is true', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            setupWorkspaceStub();
            execAsyncStub.rejects(new Error('install failed'));
            try {
                await runLink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: true }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to link');
            }
            expect(execAsyncStub.callCount).to.equal(1);
        });

        it('should skip non-linkable repos', async () => {
            createRepoDirs('glsp-server');
            await runLink(['glsp-server'] as GLSPRepo[], makeOptions());
            expect(execAsyncStub.called).to.be.false;
        });
    });

    describe('runUnlink', () => {
        it('should remove link overrides and reinstall in reverse build order', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', {
                overrides: {
                    '@eclipse-glsp/protocol': 'link:../glsp-client/packages/protocol',
                    sprotty: 'link:../glsp-client/node_modules/sprotty'
                }
            });

            await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions());

            expect(readWorkspaceYaml('glsp-server-node')).to.not.have.property('overrides');
            // Only glsp-server-node had overrides, so only it is reinstalled.
            expect(execAsyncStub.callCount).to.equal(1);
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm install --no-frozen-lockfile');
            expect(execAsyncStub.firstCall.args[1].cwd).to.equal(path.join(tempDir, 'glsp-server-node'));
        });

        it('should stop on first failure when failFast is true', async () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            writeWorkspaceYaml('glsp-server-node', {
                overrides: { '@eclipse-glsp/protocol': 'link:../glsp-client/packages/protocol' }
            });
            execAsyncStub.rejects(new Error('install failed'));
            try {
                await runUnlink(['glsp-client', 'glsp-server-node'] as GLSPRepo[], makeOptions({ failFast: true }));
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('failed to unlink');
            }
        });
    });
});
