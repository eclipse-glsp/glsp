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
import { GLSPRepo } from '../../util';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import {
    WORKSPACE_FILE_NAME,
    WorkspaceInitOptions,
    VSCodeWorkspace,
    discoverWorkspaceFile,
    generateWorkspaceContent,
    generateWorkspaceFile
} from './workspace';

describe('workspace-action', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    function makeOptions(overrides: Partial<WorkspaceInitOptions> = {}): WorkspaceInitOptions {
        return { verbose: false, ...overrides };
    }

    describe('generateWorkspaceContent', () => {
        it('should create folders with relative paths for each repo', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server-node'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            expect(result.folders).to.have.length(2);
            expect(result.folders[0]).to.deep.equal({ name: 'glsp-client', path: 'glsp-client' });
            expect(result.folders[1]).to.deep.equal({ name: 'glsp-server-node', path: 'glsp-server-node' });
        });

        it('should compute paths relative to custom output location', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const outputPath = path.join(tempDir, 'sub', 'dir', WORKSPACE_FILE_NAME);

            const result = generateWorkspaceContent(repos, tempDir, makeOptions({ outputPath }));

            expect(result.folders[0].path).to.equal(path.join('..', '..', 'glsp-client'));
        });

        it('should include build, link, and unlink tasks', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            expect(result.tasks.version).to.equal('2.0.0');
            const labels = result.tasks.tasks.map(t => t.label);
            expect(labels).to.include('GLSP: Build all');
            expect(labels).to.include('GLSP: Link');
            expect(labels).to.include('GLSP: Unlink');

            const buildAll = result.tasks.tasks.find(t => t.label === 'GLSP: Build all')!;
            expect(buildAll.type).to.equal('shell');
            expect(buildAll.command).to.equal('npx @eclipse-glsp/cli repo build --no-java');
            expect(buildAll.group).to.deep.equal({ kind: 'build', isDefault: true });
        });

        it('should include Java build task when Java repos are present', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            const labels = result.tasks.tasks.map(t => t.label);
            expect(labels).to.include('GLSP: Build all (incl. Java)');
        });

        it('should not include Java build task when no Java repos are present', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server-node'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            const labels = result.tasks.tasks.map(t => t.label);
            expect(labels).to.not.include('GLSP: Build all (incl. Java)');
        });

        it('should include preset build tasks for matching strict subsets', () => {
            const repos: GLSPRepo[] = ['glsp-client', 'glsp-server-node', 'glsp-theia-integration'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            const labels = result.tasks.tasks.map(t => t.label);
            expect(labels).to.include('GLSP: Build core');
        });

        it('should include extension recommendations', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            expect(result.extensions.recommendations).to.deep.equal([
                'dbaeumer.vscode-eslint',
                'esbenp.prettier-vscode',
                'DavidAnson.vscode-markdownlint'
            ]);
        });

        it('should have empty settings', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const result = generateWorkspaceContent(repos, tempDir, makeOptions());

            expect(result.settings).to.deep.equal({});
        });
    });

    describe('generateWorkspaceFile', () => {
        it('should write the workspace file to the dir by default', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const outputFile = generateWorkspaceFile(repos, tempDir, makeOptions());

            expect(outputFile).to.equal(path.join(tempDir, WORKSPACE_FILE_NAME));
            expect(fs.existsSync(outputFile)).to.be.true;

            const content: VSCodeWorkspace = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
            expect(content.folders).to.have.length(1);
        });

        it('should write to a custom output path', () => {
            const repos: GLSPRepo[] = ['glsp-client'];
            const outputPath = path.join(tempDir, 'custom', 'my.code-workspace');

            const outputFile = generateWorkspaceFile(repos, tempDir, makeOptions({ outputPath }));

            expect(outputFile).to.equal(outputPath);
            expect(fs.existsSync(outputFile)).to.be.true;
        });

        it('should overwrite an existing workspace file', () => {
            const repos1: GLSPRepo[] = ['glsp-client'];
            const repos2: GLSPRepo[] = ['glsp-client', 'glsp-server-node'];

            generateWorkspaceFile(repos1, tempDir, makeOptions());
            generateWorkspaceFile(repos2, tempDir, makeOptions());

            const outputFile = path.join(tempDir, WORKSPACE_FILE_NAME);
            const content: VSCodeWorkspace = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
            expect(content.folders).to.have.length(2);
        });
    });

    describe('discoverWorkspaceFile', () => {
        it('should find a single .code-workspace file', () => {
            fs.writeFileSync(path.join(tempDir, 'glsp.code-workspace'), '{}');
            const result = discoverWorkspaceFile(tempDir);
            expect(result).to.equal(path.join(tempDir, 'glsp.code-workspace'));
        });

        it('should return undefined when no .code-workspace file exists', () => {
            const result = discoverWorkspaceFile(tempDir);
            expect(result).to.be.undefined;
        });

        it('should prefer glsp.code-workspace when multiple exist', () => {
            fs.writeFileSync(path.join(tempDir, 'glsp.code-workspace'), '{}');
            fs.writeFileSync(path.join(tempDir, 'other.code-workspace'), '{}');
            const result = discoverWorkspaceFile(tempDir);
            expect(result).to.equal(path.join(tempDir, 'glsp.code-workspace'));
        });

        it('should return undefined for nonexistent directory', () => {
            const result = discoverWorkspaceFile(path.join(tempDir, 'nonexistent'));
            expect(result).to.be.undefined;
        });
    });
});
