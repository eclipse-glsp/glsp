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
import * as gitUtil from '../../util/git-util';
import { createTempDir, cleanupTempDir } from '../../../tests/helpers/test-helper';
import { validateReposExist } from './common/utils';
import { SwitchActionOptions, switchSingleRepo, validateReposClean } from './switch';

describe('switch-action', () => {
    const sandbox = sinon.createSandbox();
    let tempDir: string;
    let execStub: sinon.SinonStub;

    function makeOptions(overrides: Partial<SwitchActionOptions> = {}): SwitchActionOptions {
        return {
            dir: tempDir,
            branch: 'main',
            force: false,
            verbose: false,
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
        execStub = sandbox.stub(processUtil, 'exec').returns('');
        sandbox.stub(gitUtil, 'hasChanges').returns(false);
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    describe('validateReposExist', () => {
        it('should pass when all repos exist', () => {
            createRepoDirs('glsp-client', 'glsp-server-node');
            expect(() => validateReposExist(['glsp-client', 'glsp-server-node'], tempDir)).to.not.throw();
        });

        it('should throw listing missing repos', () => {
            createRepoDirs('glsp-client');
            expect(() => validateReposExist(['glsp-client', 'glsp-server-node'], tempDir)).to.throw(/not cloned.*glsp-server-node/);
        });
    });

    describe('validateReposClean', () => {
        it('should pass when all repos are clean', () => {
            createRepoDirs('glsp-client');
            expect(() => validateReposClean(['glsp-client'], tempDir)).to.not.throw();
        });

        it('should throw listing dirty repos', () => {
            createRepoDirs('glsp-client');
            (gitUtil.hasChanges as sinon.SinonStub).returns(true);
            expect(() => validateReposClean(['glsp-client'], tempDir)).to.throw(/uncommitted changes.*glsp-client/);
        });
    });

    describe('switchSingleRepo', () => {
        it('should run git checkout with the branch name', () => {
            createRepoDirs('glsp-client');
            switchSingleRepo('glsp-client', makeOptions({ branch: 'release/2.0' }));
            expect(execStub.calledOnce).to.be.true;
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('git checkout');
            expect(cmd).to.contain('release/2.0');
        });

        it('should add --force when force is true', () => {
            createRepoDirs('glsp-client');
            switchSingleRepo('glsp-client', makeOptions({ branch: 'main', force: true }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('--force');
        });

        it('should warn and return when branch does not exist', () => {
            createRepoDirs('glsp-client');
            execStub.throws(new Error("error: pathspec 'nonexistent' did not match any"));
            expect(() => switchSingleRepo('glsp-client', makeOptions({ branch: 'nonexistent' }))).to.not.throw();
        });

        it('should rethrow on other git errors', () => {
            createRepoDirs('glsp-client');
            execStub.throws(new Error('fatal: some other error'));
            expect(() => switchSingleRepo('glsp-client', makeOptions())).to.throw('fatal: some other error');
        });

        it('should use gh pr checkout for --pr', () => {
            createRepoDirs('glsp-client');
            switchSingleRepo('glsp-client', makeOptions({ branch: undefined, pr: '42' }));
            const cmd = execStub.firstCall.args[0] as string;
            expect(cmd).to.contain('gh pr checkout 42');
            expect(cmd).to.contain('-R eclipse-glsp/glsp-client');
        });
    });
});
