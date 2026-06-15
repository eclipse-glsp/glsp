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
import * as processUtil from '../../util/process-util';
import { createTempDir, cleanupTempDir } from '../../../tests/helpers/test-helper';
import { BuildActionOptions, buildSingleRepo, runBuildOrdered } from './build';

describe('build-action', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execAsyncStub: sinon.SinonStub;

    function makeOptions(overrides: Partial<BuildActionOptions> = {}): BuildActionOptions {
        return {
            dir: tempDir,
            electron: false,
            verbose: false,
            failFast: true,
            ...overrides
        };
    }

    function createRepoDirs(...names: string[]): void {
        for (const name of names) {
            fs.mkdirSync(path.join(tempDir, name), { recursive: true });
        }
    }

    function markAsYarnRepo(name: string): void {
        fs.writeFileSync(path.join(tempDir, name, 'yarn.lock'), '');
    }

    function markAsPnpmRepo(name: string): void {
        fs.writeFileSync(path.join(tempDir, name, 'pnpm-workspace.yaml'), '');
    }

    beforeEach(() => {
        tempDir = createTempDir();
        execAsyncStub = sandbox.stub(processUtil, 'execAsync').resolves('');
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    describe('buildSingleRepo', () => {
        it('should run yarn install for standard yarn repos', async () => {
            createRepoDirs('glsp-client');
            markAsYarnRepo('glsp-client');
            await buildSingleRepo('glsp-client', makeOptions());
            expect(execAsyncStub.calledOnce).to.be.true;
            expect(execAsyncStub.firstCall.args[0]).to.equal('yarn install');
        });

        it('should run pnpm install and explicit build for standard pnpm repos', async () => {
            createRepoDirs('glsp-client');
            markAsPnpmRepo('glsp-client');
            await buildSingleRepo('glsp-client', makeOptions());
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm install');
            expect(execAsyncStub.secondCall.args[0]).to.equal('pnpm run --if-present build');
        });

        it('should run yarn install then yarn browser build for theia-integration (yarn)', async () => {
            createRepoDirs('glsp-theia-integration');
            markAsYarnRepo('glsp-theia-integration');
            await buildSingleRepo('glsp-theia-integration', makeOptions());
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.firstCall.args[0]).to.equal('yarn install');
            expect(execAsyncStub.secondCall.args[0]).to.equal('yarn browser build');
        });

        it('should run pnpm install, build and browser build for theia-integration (pnpm)', async () => {
            createRepoDirs('glsp-theia-integration');
            markAsPnpmRepo('glsp-theia-integration');
            await buildSingleRepo('glsp-theia-integration', makeOptions());
            expect(execAsyncStub.callCount).to.equal(3);
            expect(execAsyncStub.firstCall.args[0]).to.equal('pnpm install');
            expect(execAsyncStub.secondCall.args[0]).to.equal('pnpm run --if-present build');
            expect(execAsyncStub.thirdCall.args[0]).to.equal('pnpm run browser build');
        });

        it('should run yarn electron build with --electron', async () => {
            createRepoDirs('glsp-theia-integration');
            markAsYarnRepo('glsp-theia-integration');
            await buildSingleRepo('glsp-theia-integration', makeOptions({ electron: true }));
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.secondCall.args[0]).to.equal('yarn electron build');
        });

        it('should run mvn for glsp-server', async () => {
            createRepoDirs('glsp-server');
            await buildSingleRepo('glsp-server', makeOptions());
            expect(execAsyncStub.calledOnce).to.be.true;
            expect(execAsyncStub.firstCall.args[0]).to.equal('mvn clean verify -Pm2 -Pfatjar -Dstyle.color=always -B');
        });

        it('should build client and server for eclipse-integration', async () => {
            createRepoDirs(path.join('glsp-eclipse-integration', 'client'));
            markAsYarnRepo(path.join('glsp-eclipse-integration', 'client'));
            await buildSingleRepo('glsp-eclipse-integration', makeOptions());
            expect(execAsyncStub.callCount).to.equal(2);
            expect(execAsyncStub.firstCall.args[0]).to.equal('yarn install');
            expect(execAsyncStub.firstCall.args[1].cwd).to.contain(path.join('glsp-eclipse-integration', 'client'));
            expect(execAsyncStub.secondCall.args[0]).to.equal('mvn clean verify -Dstyle.color=always -B');
            expect(execAsyncStub.secondCall.args[1].cwd).to.contain(path.join('glsp-eclipse-integration', 'server'));
        });
    });

    describe('runBuildOrdered', () => {
        it('should build repos sequentially in dependency order', async () => {
            createRepoDirs('glsp', 'glsp-client', 'glsp-server-node');
            ['glsp', 'glsp-client', 'glsp-server-node'].forEach(markAsYarnRepo);
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions());
            expect(failures).to.equal(0);
            expect(execAsyncStub.callCount).to.equal(3);
        });

        it('should error if a repo directory is missing', async () => {
            createRepoDirs('glsp');
            try {
                await runBuildOrdered(['glsp', 'glsp-client'], makeOptions());
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('glsp-client');
            }
        });

        it('should stop on first failure when failFast is true', async () => {
            createRepoDirs('glsp', 'glsp-client', 'glsp-server-node');
            ['glsp', 'glsp-client', 'glsp-server-node'].forEach(markAsYarnRepo);
            execAsyncStub.onFirstCall().rejects(new Error('build failed'));
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions({ failFast: true }));
            expect(failures).to.equal(1);
            expect(execAsyncStub.callCount).to.equal(1);
        });

        it('should continue on failure when failFast is false', async () => {
            createRepoDirs('glsp', 'glsp-client', 'glsp-server-node');
            ['glsp', 'glsp-client', 'glsp-server-node'].forEach(markAsYarnRepo);
            execAsyncStub.onFirstCall().rejects(new Error('build failed'));
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions({ failFast: false }));
            expect(failures).to.equal(1);
            expect(execAsyncStub.callCount).to.equal(3);
        });
    });
});
