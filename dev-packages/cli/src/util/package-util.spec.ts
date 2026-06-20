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
import { PackageHelper, getWorkspacePackages } from './package-util';
import * as processUtil from './process-util';

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

    describe('getWorkspacePackages', () => {
        let tempDir: string;

        beforeEach(() => {
            tempDir = createTempDir();
        });

        afterEach(() => {
            cleanupTempDir(tempDir);
        });

        function createPackage(relativePath: string, name: string): string {
            const pkgDir = path.join(tempDir, relativePath);
            fs.mkdirSync(pkgDir, { recursive: true });
            fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
            return pkgDir;
        }

        it('should map the pnpm list output to package helpers, excluding the root', () => {
            createPackage('.', 'root-pkg');
            const pkgADir = createPackage('packages/a', '@scope/pkg-a');
            const pkgBDir = createPackage('packages/b', '@scope/pkg-b');
            const listOutput = JSON.stringify([
                { name: 'root-pkg', version: '1.0.0', path: tempDir, private: true },
                { name: '@scope/pkg-a', version: '1.0.0', path: pkgADir },
                { name: '@scope/pkg-b', version: '1.0.0', path: pkgBDir }
            ]);
            sandbox.stub(processUtil, 'exec').returns(listOutput);

            const packages = getWorkspacePackages(tempDir);
            expect(packages.map(pkg => pkg.name)).to.deep.equal(['@scope/pkg-a', '@scope/pkg-b']);
            expect(packages.map(pkg => pkg.location)).to.deep.equal([pkgADir, pkgBDir]);
        });

        it('should append the root package if includeRoot is set', () => {
            createPackage('.', 'root-pkg');
            const pkgADir = createPackage('packages/a', '@scope/pkg-a');
            const listOutput = JSON.stringify([
                { name: 'root-pkg', version: '1.0.0', path: tempDir, private: true },
                { name: '@scope/pkg-a', version: '1.0.0', path: pkgADir }
            ]);
            sandbox.stub(processUtil, 'exec').returns(listOutput);

            const packages = getWorkspacePackages(tempDir, true);
            expect(packages.map(pkg => pkg.name)).to.deep.equal(['@scope/pkg-a', 'root']);
            expect(packages[packages.length - 1].location).to.equal(tempDir);
        });
    });
});
