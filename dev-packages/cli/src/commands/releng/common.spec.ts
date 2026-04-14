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
import * as sinon from 'sinon';
import { LOGGER } from '../../util/logger';
import { PackageHelper } from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import * as gitUtil from '../../util/git-util';
import { getGLSPDependencies, GLSPRepo, isGithubCLIAuthenticated } from './common';

describe('common', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(LOGGER, 'debug');
        sandbox.stub(LOGGER, 'warn');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('GLSPRepo.deriveFromDirectory', () => {
        it('should derive repo name from HTTPS remote URL', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('https://github.com/eclipse-glsp/glsp-client.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.equal('glsp-client');
        });

        it('should derive repo name from SSH remote URL', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('git@github.com:eclipse-glsp/glsp-server-node.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.equal('glsp-server-node');
        });

        it('should return undefined for a non-GLSP repository', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('https://github.com/other/repo.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.be.undefined;
        });
    });

    describe('isGithubCLIAuthenticated', () => {
        it('should return true when gh is installed and authenticated', () => {
            sandbox.stub(processUtil, 'exec').returns('');
            const result = isGithubCLIAuthenticated();
            expect(result).to.be.true;
        });

        it('should return false when gh auth status throws', () => {
            const execStub = sandbox.stub(processUtil, 'exec');
            execStub.withArgs('which gh', sinon.match.any).returns('');
            execStub.withArgs('gh auth status').throws(new Error('not authenticated'));
            const result = isGithubCLIAuthenticated();
            expect(result).to.be.false;
        });

        it('should propagate error when gh is not installed', () => {
            sandbox.stub(processUtil, 'exec').throws(new Error('Github CLI is not installed!'));
            expect(() => isGithubCLIAuthenticated()).to.throw(/not installed/);
        });
    });

    describe('getGLSPDependencies', () => {
        it('should return only @eclipse-glsp dependencies from both deps and devDeps', () => {
            const pkg = {
                content: {
                    name: 'test-pkg',
                    version: '1.0.0',
                    dependencies: {
                        '@eclipse-glsp/client': '1.0.0',
                        lodash: '4.0.0'
                    },
                    devDependencies: {
                        '@eclipse-glsp/config': '1.0.0',
                        typescript: '5.0.0'
                    }
                }
            } as unknown as PackageHelper;

            const result = getGLSPDependencies(pkg);
            expect(result).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/config']);
        });

        it('should return empty array when dependency sections are missing', () => {
            const pkg = {
                content: {
                    name: 'test-pkg',
                    version: '1.0.0'
                }
            } as unknown as PackageHelper;

            const result = getGLSPDependencies(pkg);
            expect(result).to.deep.equal([]);
        });
    });
});
