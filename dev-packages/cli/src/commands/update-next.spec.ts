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

import { describe, it, beforeEach, afterEach, expect, vi, type Mock } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { cleanupTempDir, createTempDir } from '../../tests/helpers/test-helper';
import { PackageData, PackageHelper } from '../util';
import * as gitUtil from '../util/git-util';
import * as packageUtil from '../util/package-util';
import * as processUtil from '../util/process-util';
import { updateNext } from './update-next';

describe('updateNext', () => {
    let tempDir: string;
    let execStub: Mock;
    let execAsyncStub: Mock;

    beforeEach(() => {
        tempDir = createTempDir();
        // no uncommitted changes -> the command does not early-return
        vi.spyOn(gitUtil, 'getUncommittedChanges').mockReturnValue([]);
        execStub = vi.spyOn(processUtil, 'exec') as unknown as Mock;
        execAsyncStub = vi.spyOn(processUtil, 'execAsync').mockResolvedValue('') as unknown as Mock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        cleanupTempDir(tempDir);
    });

    function createPackage(relativePath: string, content: Partial<PackageData> & { name: string }): PackageHelper {
        const pkgDir = path.join(tempDir, relativePath);
        fs.mkdirSync(pkgDir, { recursive: true });
        const filePath = path.join(pkgDir, 'package.json');
        fs.writeFileSync(filePath, JSON.stringify({ version: '1.0.0', ...content }, undefined, 4));
        return new PackageHelper(filePath, content.name);
    }

    /** Runs updateNext and returns the pnpm-workspace.yaml content captured during the (first) install. */
    async function runAndCaptureWorkspaceYaml(workspaceYamlPath: string): Promise<string> {
        let captured: string | undefined;
        execAsyncStub.mockImplementation(() => {
            if (captured === undefined) {
                captured = fs.readFileSync(workspaceYamlPath, 'utf8');
            }
            return Promise.resolve('');
        });
        await updateNext(tempDir, { verbose: false });
        return captured ?? '';
    }

    it('should pin next deps via pnpm-workspace.yaml overrides and install (without opportunistic updates)', async () => {
        createPackage('.', { name: 'root', private: true });
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', dependencies: { '@eclipse-glsp/protocol': 'next' } });
        vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);
        const workspaceYamlPath = path.join(tempDir, 'pnpm-workspace.yaml');
        const originalYaml = "packages:\n    - 'packages/*'\n";
        fs.writeFileSync(workspaceYamlPath, originalYaml);
        execStub.mockImplementation((...args: any[]) => {
            if (/npm view/.test(args[0])) {
                return '2.8.0-next.6';
            }
            return undefined;
        });

        const yamlDuringInstall = await runAndCaptureWorkspaceYaml(workspaceYamlPath);

        // the resolved next version is pinned via the overrides block while installing ...
        expect(YAML.parse(yamlDuringInstall).overrides).to.deep.equal({ '@eclipse-glsp/protocol': '2.8.0-next.6' });
        // ... and the file is restored verbatim afterwards
        expect(fs.readFileSync(workspaceYamlPath, 'utf8')).to.equal(originalYaml);

        const commands = execAsyncStub.mock.calls.map(call => call[0] as string);
        // uses `pnpm install` (lockfile-respecting), never `pnpm update` (opportunistic in-range bumps)
        expect(commands.some(cmd => cmd.includes('pnpm install'))).to.be.true;
        expect(commands.some(cmd => cmd.includes('pnpm update'))).to.be.false;
    });

    it('should merge into an existing overrides block (ours win) and restore it afterwards', async () => {
        createPackage('.', { name: 'root', private: true });
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', dependencies: { '@eclipse-glsp/protocol': 'next' } });
        vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);
        const workspaceYamlPath = path.join(tempDir, 'pnpm-workspace.yaml');
        const originalYaml = YAML.stringify({
            packages: ['packages/*'],
            overrides: { 'unrelated-dep': '1.2.3', '@eclipse-glsp/protocol': 'next' }
        });
        fs.writeFileSync(workspaceYamlPath, originalYaml);
        execStub.mockImplementation((...args: any[]) => {
            if (/npm view/.test(args[0])) {
                return '2.8.0-next.6';
            }
            return undefined;
        });

        const yamlDuringInstall = await runAndCaptureWorkspaceYaml(workspaceYamlPath);

        // existing override preserved, our pin merged in / overriding the stale one
        expect(YAML.parse(yamlDuringInstall).overrides).to.deep.equal({
            'unrelated-dep': '1.2.3',
            '@eclipse-glsp/protocol': '2.8.0-next.6'
        });
        // original file restored verbatim
        expect(fs.readFileSync(workspaceYamlPath, 'utf8')).to.equal(originalYaml);
    });

    it('should do nothing when a pnpm repo has no next dependencies', async () => {
        const pkgA = createPackage('packages/a', { name: '@eclipse-glsp/a', dependencies: { '@eclipse-glsp/protocol': '^2.0.0' } });
        vi.spyOn(packageUtil, 'getWorkspacePackages').mockReturnValue([pkgA]);

        await updateNext(tempDir, { verbose: false });

        expect(execAsyncStub).not.toHaveBeenCalled();
    });
});
