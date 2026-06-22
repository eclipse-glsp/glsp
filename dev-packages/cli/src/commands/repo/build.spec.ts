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
import * as processUtil from '../../util/process-util';
import { createTempDir, cleanupTempDir } from '../../../tests/helpers/test-helper';
import { BuildActionOptions, buildSingleRepo, runBuildOrdered } from './build';

describe('build-action', () => {
    let tempDir: string;
    let execAsyncStub: MockInstance;

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

    beforeEach(() => {
        tempDir = createTempDir();
        execAsyncStub = vi.spyOn(processUtil, 'execAsync').mockResolvedValue('');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanupTempDir(tempDir);
    });

    describe('buildSingleRepo', () => {
        it('should run pnpm install and explicit build for standard repos', async () => {
            createRepoDirs('glsp-client');
            await buildSingleRepo('glsp-client', makeOptions());
            expect(execAsyncStub).toHaveBeenCalledTimes(2);
            expect(execAsyncStub.mock.calls[0][0]).to.equal('pnpm install');
            expect(execAsyncStub.mock.calls[1][0]).to.equal('pnpm run --if-present build');
        });

        it('should run pnpm install, build and browser build for theia-integration', async () => {
            createRepoDirs('glsp-theia-integration');
            await buildSingleRepo('glsp-theia-integration', makeOptions());
            expect(execAsyncStub).toHaveBeenCalledTimes(3);
            expect(execAsyncStub.mock.calls[0][0]).to.equal('pnpm install');
            expect(execAsyncStub.mock.calls[1][0]).to.equal('pnpm run --if-present build');
            expect(execAsyncStub.mock.calls[2][0]).to.equal('pnpm run browser build');
        });

        it('should run electron build with --electron', async () => {
            createRepoDirs('glsp-theia-integration');
            await buildSingleRepo('glsp-theia-integration', makeOptions({ electron: true }));
            expect(execAsyncStub).toHaveBeenCalledTimes(3);
            expect(execAsyncStub.mock.calls[2][0]).to.equal('pnpm run electron build');
        });

        it('should run mvn for glsp-server', async () => {
            createRepoDirs('glsp-server');
            await buildSingleRepo('glsp-server', makeOptions());
            expect(execAsyncStub).toHaveBeenCalledOnce();
            expect(execAsyncStub.mock.calls[0][0]).to.equal('mvn clean verify -Pm2 -Pfatjar -Dstyle.color=always -B');
        });

        it('should build client and server for eclipse-integration', async () => {
            createRepoDirs(path.join('glsp-eclipse-integration', 'client'));
            await buildSingleRepo('glsp-eclipse-integration', makeOptions());
            expect(execAsyncStub).toHaveBeenCalledTimes(3);
            expect(execAsyncStub.mock.calls[0][0]).to.equal('pnpm install');
            expect(execAsyncStub.mock.calls[0][1].cwd).to.contain(path.join('glsp-eclipse-integration', 'client'));
            expect(execAsyncStub.mock.calls[1][0]).to.equal('pnpm run --if-present build');
            expect(execAsyncStub.mock.calls[1][1].cwd).to.contain(path.join('glsp-eclipse-integration', 'client'));
            expect(execAsyncStub.mock.calls[2][0]).to.equal('mvn clean verify -Dstyle.color=always -B');
            expect(execAsyncStub.mock.calls[2][1].cwd).to.contain(path.join('glsp-eclipse-integration', 'server'));
        });
    });

    describe('runBuildOrdered', () => {
        it('should build repos sequentially in dependency order', async () => {
            createRepoDirs('glsp', 'glsp-client', 'glsp-server-node');
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions());
            expect(failures).to.equal(0);
            // pnpm install + build per repo
            expect(execAsyncStub).toHaveBeenCalledTimes(6);
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
            execAsyncStub.mockRejectedValueOnce(new Error('build failed'));
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions({ failFast: true }));
            expect(failures).to.equal(1);
            expect(execAsyncStub).toHaveBeenCalledTimes(1);
        });

        it('should continue on failure when failFast is false', async () => {
            createRepoDirs('glsp', 'glsp-client', 'glsp-server-node');
            execAsyncStub.mockRejectedValueOnce(new Error('build failed'));
            const failures = await runBuildOrdered(['glsp', 'glsp-client', 'glsp-server-node'], makeOptions({ failFast: false }));
            expect(failures).to.equal(1);
            // first repo fails on install (1 call); the other two each run install + build (2+2)
            expect(execAsyncStub).toHaveBeenCalledTimes(5);
        });
    });
});
