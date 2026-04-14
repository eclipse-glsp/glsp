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
import { createTempDir, cleanupTempDir } from '../../tests/helpers/test-helper';
import * as gitUtil from './git-util';
import { validateDirectory, validateFile, validateGitDirectory } from './validation-util';

describe('validation-util', () => {
    let sandbox: sinon.SinonSandbox;
    let tempDir: string;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        tempDir = createTempDir();
    });

    afterEach(() => {
        sandbox.restore();
        cleanupTempDir(tempDir);
    });

    describe('validateDirectory', () => {
        it('should return the resolved path for a valid directory', () => {
            const result = validateDirectory(tempDir);
            expect(result).to.equal(path.resolve(tempDir));
        });

        it('should throw for a non-existent path', () => {
            const nonExistent = path.join(tempDir, 'does-not-exist');
            expect(() => validateDirectory(nonExistent)).to.throw(/Not a valid file path/);
        });

        it('should throw for a file path (not a directory)', () => {
            const filePath = path.join(tempDir, 'test-file.txt');
            fs.writeFileSync(filePath, 'content');
            expect(() => validateDirectory(filePath)).to.throw(/Not a directory/);
        });
    });

    describe('validateFile', () => {
        it('should throw for a non-existent file when hasToExist is true', () => {
            const nonExistent = path.join(tempDir, 'missing-file.txt');
            expect(() => validateFile(nonExistent, true)).to.throw(/Not a valid file path/);
        });
    });

    describe('validateGitDirectory', () => {
        it('should return the git root for a valid git directory', () => {
            sandbox.stub(gitUtil, 'isGitRepository').returns(true);
            sandbox.stub(gitUtil, 'getGitRoot').returns('/resolved/root');
            const result = validateGitDirectory(tempDir);
            expect(result).to.equal('/resolved/root');
        });

        it('should throw for a directory that is not a git repository', () => {
            sandbox.stub(gitUtil, 'isGitRepository').returns(false);
            expect(() => validateGitDirectory(tempDir)).to.throw(/Not a valid git repository/);
        });
    });
});
