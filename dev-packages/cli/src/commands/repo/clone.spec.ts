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
import * as forkUtils from './common/fork-utils';
import { createTempDir, cleanupTempDir } from '../../../tests/helpers/test-helper';
import { CloneActionOptions, cloneSingleRepo } from './clone';

describe('clone-action', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execStub: sinon.SinonStub;

    function makeOptions(overrides: Partial<CloneActionOptions> = {}): CloneActionOptions {
        return {
            dir: tempDir,
            protocol: 'https',
            verbose: false,
            ...overrides
        };
    }

    beforeEach(() => {
        tempDir = createTempDir();
        execStub = sandbox.stub(processUtil, 'exec').returns('');
        sandbox.stub(forkUtils, 'ensureFork').resolves();
        sandbox.stub(forkUtils, 'getRemotes').returns({});
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    describe('cloneSingleRepo', () => {
        it('should call git clone with https URL', async () => {
            await cloneSingleRepo('glsp-client', makeOptions());
            expect(execStub.calledOnce).to.be.true;
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('git clone');
            expect(cmd).to.contain('https://github.com/eclipse-glsp/glsp-client.git');
            expect(cmd).to.contain(path.join(tempDir, 'glsp-client'));
        });

        it('should call git clone with ssh URL', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ protocol: 'ssh' }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('git@github.com:eclipse-glsp/glsp-client.git');
        });

        it('should use fork org when --fork is set', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ fork: 'myuser' }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('myuser/glsp-client');
        });

        it('should add upstream remote when --fork is set', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ fork: 'myuser' }));
            const upstreamCall = execStub.getCalls().find(c => (c.args[0] as string).includes('remote add upstream'));
            expect(upstreamCall).to.exist;
            expect(upstreamCall!.args[0]).to.contain('eclipse-glsp/glsp-client');
        });

        it('should not add upstream if already present after clone', async () => {
            (forkUtils.getRemotes as sinon.SinonStub).returns({ upstream: 'https://github.com/eclipse-glsp/glsp-client.git' });
            await cloneSingleRepo('glsp-client', makeOptions({ fork: 'myuser' }));
            const upstreamCall = execStub.getCalls().find(c => (c.args[0] as string).includes('remote add upstream'));
            expect(upstreamCall).to.be.undefined;
        });

        it('should call ensureFork when --fork is set', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ fork: 'myuser' }));
            expect((forkUtils.ensureFork as sinon.SinonStub).calledOnceWith('myuser', 'glsp-client')).to.be.true;
        });

        it('should not call ensureFork when --fork is not set', async () => {
            await cloneSingleRepo('glsp-client', makeOptions());
            expect((forkUtils.ensureFork as sinon.SinonStub).called).to.be.false;
        });

        it('should include -b flag when --branch is set', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ branch: 'release/2.0' }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('-b release/2.0');
        });

        it('should skip when target directory exists and no --override', async () => {
            fs.mkdirSync(path.join(tempDir, 'glsp-client'));
            const result = await cloneSingleRepo('glsp-client', makeOptions());
            expect(result).to.be.false;
            expect(execStub.called).to.be.false;
        });

        it('should remove existing directory with --override remove', async () => {
            const targetDir = path.join(tempDir, 'glsp-client');
            fs.mkdirSync(targetDir);
            fs.writeFileSync(path.join(targetDir, 'old.txt'), 'old');
            await cloneSingleRepo('glsp-client', makeOptions({ override: 'remove' }));
            expect(fs.existsSync(path.join(targetDir, 'old.txt'))).to.be.false;
            expect(execStub.calledOnce).to.be.true;
        });

        it('should rename existing directory with --override rename', async () => {
            const targetDir = path.join(tempDir, 'glsp-client');
            fs.mkdirSync(targetDir);
            fs.writeFileSync(path.join(targetDir, 'marker.txt'), 'original');
            await cloneSingleRepo('glsp-client', makeOptions({ override: 'rename' }));
            const entries = fs.readdirSync(tempDir).filter(e => e.startsWith('glsp-client_'));
            expect(entries).to.have.lengthOf(1);
            expect(fs.readFileSync(path.join(tempDir, entries[0], 'marker.txt'), 'utf-8')).to.equal('original');
        });

        it('should use gh repo clone for gh protocol', async () => {
            await cloneSingleRepo('glsp-client', makeOptions({ protocol: 'gh' }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('gh repo clone');
            expect(cmd).to.contain('eclipse-glsp/glsp-client');
        });
    });
});
