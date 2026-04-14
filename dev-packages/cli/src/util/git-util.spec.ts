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
import { createSandbox } from 'sinon';
import * as processUtil from './process-util';
import { commitChanges, getDefaultBranch, getLastModificationDate, getUncommittedChanges, hasChanges } from './git-util';

const sandbox = createSandbox();

describe('git-util', () => {
    let execStub: sinon.SinonStub;

    beforeEach(() => {
        execStub = sandbox.stub(processUtil, 'exec');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getUncommittedChanges', () => {
        it('should parse porcelain output into file paths', () => {
            execStub.returns(' M src/file.ts\n?? new-file.ts');
            const result = getUncommittedChanges('/repo');
            expect(result).to.have.length(2);
        });

        it('should return empty array for empty output', () => {
            execStub.returns('');
            const result = getUncommittedChanges('/repo');
            expect(result).to.have.length(0);
        });
    });

    describe('hasChanges', () => {
        it('should return true when there are uncommitted changes', () => {
            execStub.returns(' M src/file.ts\n?? new-file.ts');
            expect(hasChanges('/repo')).to.be.true;
        });

        it('should return false when there are no changes', () => {
            execStub.returns('');
            expect(hasChanges('/repo')).to.be.false;
        });
    });

    describe('commitChanges', () => {
        it('should escape double quotes in commit message', () => {
            execStub.returns('');
            commitChanges('fix "bug"', '/repo');
            expect(execStub.secondCall.args[0]).to.contain('\\"');
        });

        it('should escape backslashes in commit message', () => {
            execStub.returns('');
            commitChanges('path\\to\\file', '/repo');
            expect(execStub.secondCall.args[0]).to.contain('\\\\');
        });
    });

    describe('getDefaultBranch', () => {
        it('should parse HEAD branch from remote output', () => {
            execStub.returns('* remote origin\n  HEAD branch: main\n  Remote branches:');
            expect(getDefaultBranch('/repo')).to.equal('main');
        });

        it('should fallback to master when HEAD branch is not found', () => {
            execStub.returns('* remote origin\n  Remote branches:');
            expect(getDefaultBranch('/repo')).to.equal('master');
        });
    });

    describe('getLastModificationDate', () => {
        it('should return a Date for a valid date string', () => {
            execStub.returns('2024-01-15 10:30:00 +0000');
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).to.be.an.instanceOf(Date);
        });

        it('should return undefined for empty result', () => {
            execStub.returns('');
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).to.be.undefined;
        });

        it('should return undefined when exec throws', () => {
            execStub.throws(new Error('git error'));
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).to.be.undefined;
        });
    });
});
