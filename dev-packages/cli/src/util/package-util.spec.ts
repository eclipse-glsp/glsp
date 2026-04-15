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
import { cleanupTempDir, createTempDir } from '../../tests/helpers/test-helper';
import * as processUtil from './process-util';
import { PackageHelper, getYarnWorkspaceInfo } from './package-util';

describe('package-util', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('PackageHelper constructor', () => {
        let tempDir: string;

        beforeEach(() => {
            tempDir = createTempDir();
        });

        afterEach(() => {
            cleanupTempDir(tempDir);
        });

        it('should throw if the path does not point to a package.json file', () => {
            expect(() => new PackageHelper(path.join(tempDir, 'other.json'), 'test')).to.throw(/must point to a package.json/);
        });

        it('should throw if the package.json file does not exist', () => {
            expect(() => new PackageHelper(path.join(tempDir, 'package.json'), 'test')).to.throw(/No package.json found/);
        });

        it('should succeed when the path points to an existing package.json', () => {
            const packageJsonPath = path.join(tempDir, 'package.json');
            fs.writeFileSync(packageJsonPath, JSON.stringify({ name: 'test-pkg', version: '1.0.0' }));
            const helper = new PackageHelper(packageJsonPath, 'test-pkg');
            expect(helper.filePath).to.equal(packageJsonPath);
            expect(helper.name).to.equal('test-pkg');
        });
    });

    describe('getYarnWorkspaceInfo', () => {
        it('should extract and parse JSON from valid yarn workspaces output', () => {
            const yarnOutput = [
                'yarn workspaces info v1.22.0',
                '{',
                '  "@scope/pkg-a": {',
                '    "location": "packages/a",',
                '    "workspaceDependencies": [],',
                '    "mismatchedWorkspaceDependencies": []',
                '  }',
                '}',
                'Done in 0.01s.'
            ].join('\n');

            sandbox.stub(processUtil, 'exec').returns(yarnOutput);

            const info = getYarnWorkspaceInfo('/some/root');
            expect(info).to.not.be.undefined;
            expect(info!['@scope/pkg-a'].location).to.equal('packages/a');
            expect(info!['@scope/pkg-a'].workspaceDependencies).to.deep.equal([]);
            expect(info!['@scope/pkg-a'].mismatchedWorkspaceDependencies).to.deep.equal([]);
        });

        it('should return undefined when exec throws', () => {
            sandbox.stub(processUtil, 'exec').throws(new Error('command failed'));

            const info = getYarnWorkspaceInfo('/some/root');
            expect(info).to.be.undefined;
        });
    });
});
