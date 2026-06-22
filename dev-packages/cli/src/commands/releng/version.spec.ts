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

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import { PackageData, PackageHelper } from '../../util';
import { VersionType } from './common';
import { SetVersionOptions, setVersion } from './version';

describe('releng version', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
        originalCwd = process.cwd();
        tempDir = createTempDir();
    });

    afterEach(() => {
        process.chdir(originalCwd);
        cleanupTempDir(tempDir);
    });

    function createPackage(relativePath: string, content: Partial<PackageData> & { name: string }): PackageHelper {
        const pkgDir = path.join(tempDir, relativePath);
        fs.mkdirSync(pkgDir, { recursive: true });
        const filePath = path.join(pkgDir, 'package.json');
        fs.writeFileSync(filePath, JSON.stringify({ version: '2.8.0-next', ...content }, undefined, 4));
        return new PackageHelper(filePath, content.name);
    }

    function readPackageJson(relativePath: string): PackageData {
        return JSON.parse(fs.readFileSync(path.join(tempDir, relativePath, 'package.json'), 'utf8'));
    }

    function makeOptions(version: string, workspacePackages: PackageHelper[]): SetVersionOptions {
        return {
            verbose: false,
            repoDir: tempDir,
            repo: 'glsp-client',
            version,
            versionType: (version.endsWith('-next') ? 'next' : 'custom') as VersionType,
            workspacePackages
        };
    }

    it('should bump the version of all workspace packages including the root', async () => {
        const root = createPackage('.', { name: 'parent', private: true });
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a' });

        await setVersion(makeOptions('2.9.0', [pkgA, root]));

        expect(readPackageJson('.').version).to.equal('2.9.0');
        expect(readPackageJson('packages/a').version).to.equal('2.9.0');
    });

    it('should preserve workspace: dependency ranges', async () => {
        const root = createPackage('.', { name: 'parent', private: true });
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a' });
        const pkgB = createPackage('packages/b', {
            name: '@eclipse-glsp/b',
            dependencies: { '@eclipse-glsp/a': 'workspace:*' }
        });

        await setVersion(makeOptions('2.9.0', [pkgA, pkgB, root]));

        expect(readPackageJson('packages/b').dependencies!['@eclipse-glsp/a']).to.equal('workspace:*');
        expect(readPackageJson('packages/b').version).to.equal('2.9.0');
    });

    it('should bump exact-pinned workspace dependencies to the new version', async () => {
        const root = createPackage('.', { name: 'parent', private: true });
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a' });
        const pkgB = createPackage('packages/b', {
            name: '@eclipse-glsp/b',
            dependencies: { '@eclipse-glsp/a': '2.8.0-next' }
        });

        await setVersion(makeOptions('2.9.0-next', [pkgA, pkgB, root]));

        expect(readPackageJson('packages/b').dependencies!['@eclipse-glsp/a']).to.equal('2.9.0-next');
    });

    it("should set external @eclipse-glsp dependencies to 'next' for next versions", async () => {
        const root = createPackage('.', { name: 'parent', private: true });
        const pkgA = createPackage('packages/a', {
            name: '@eclipse-glsp/a',
            dependencies: { '@eclipse-glsp/protocol': '2.8.0' }
        });

        await setVersion(makeOptions('2.9.0-next', [pkgA, root]));

        expect(readPackageJson('packages/a').dependencies!['@eclipse-glsp/protocol']).to.equal('next');
    });

    it('should bump external @eclipse-glsp dependencies to the release version for release versions', async () => {
        const root = createPackage('.', { name: 'parent', private: true });
        const pkgA = createPackage('packages/a', {
            name: '@eclipse-glsp/a',
            dependencies: { '@eclipse-glsp/protocol': 'next' }
        });

        await setVersion(makeOptions('2.9.0', [pkgA, root]));

        expect(readPackageJson('packages/a').dependencies!['@eclipse-glsp/protocol']).to.equal('2.9.0');
    });
});
