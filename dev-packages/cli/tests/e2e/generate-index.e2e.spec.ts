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
import { runCli } from '../helpers/cli-helper';
import { cleanupTempDir, createTempDir } from '../helpers/test-helper';

describe('generateIndex e2e', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    it('should generate index.ts with exports for ts files', () => {
        fs.writeFileSync(path.join(tempDir, 'foo.ts'), 'export const foo = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'bar.ts'), 'export const bar = 2;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite']);
        expect(result.exitCode).to.equal(0);
        const indexContent = fs.readFileSync(path.join(tempDir, 'index.ts'), 'utf8');
        expect(indexContent).to.contain("export * from './bar';");
        expect(indexContent).to.contain("export * from './foo';");
    });

    it('should use ESM style exports with --style esm', () => {
        fs.writeFileSync(path.join(tempDir, 'module.ts'), 'export const m = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite', '--style', 'esm']);
        expect(result.exitCode).to.equal(0);
        const indexContent = fs.readFileSync(path.join(tempDir, 'index.ts'), 'utf8');
        expect(indexContent).to.contain("export * from './module.js';");
    });

    it('should generate nested indices without --singleIndex', () => {
        const subDir = path.join(tempDir, 'sub');
        fs.mkdirSync(subDir);
        fs.writeFileSync(path.join(subDir, 'nested.ts'), 'export const n = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'root.ts'), 'export const r = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite']);
        expect(result.exitCode).to.equal(0);
        expect(fs.existsSync(path.join(tempDir, 'index.ts'))).to.equal(true);
        expect(fs.existsSync(path.join(subDir, 'index.ts'))).to.equal(true);
    });

    it('should generate a single root index with --singleIndex', () => {
        const subDir = path.join(tempDir, 'sub');
        fs.mkdirSync(subDir);
        fs.writeFileSync(path.join(subDir, 'nested.ts'), 'export const n = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'root.ts'), 'export const r = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite', '--singleIndex']);
        expect(result.exitCode).to.equal(0);
        expect(fs.existsSync(path.join(tempDir, 'index.ts'))).to.equal(true);
        expect(fs.existsSync(path.join(subDir, 'index.ts'))).to.equal(false);
    });

    it('should only index files matching custom --match pattern', () => {
        fs.writeFileSync(path.join(tempDir, 'code.ts'), 'export const c = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'script.js'), 'export const s = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite', '--match', '**/*.js']);
        expect(result.exitCode).to.equal(0);
        const indexContent = fs.readFileSync(path.join(tempDir, 'index.ts'), 'utf8');
        expect(indexContent).to.contain("'./script'");
        expect(indexContent).to.not.contain("'./code'");
    });

    it('should exclude files matching custom --ignore pattern', () => {
        fs.writeFileSync(path.join(tempDir, 'keep.ts'), 'export const k = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'skip.test.ts'), 'export const s = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite', '--ignore', '**/*.test.ts']);
        expect(result.exitCode).to.equal(0);
        const indexContent = fs.readFileSync(path.join(tempDir, 'index.ts'), 'utf8');
        expect(indexContent).to.contain("'./keep'");
        expect(indexContent).to.not.contain("'./skip.test'");
    });

    it('should respect .indexignore file', () => {
        fs.writeFileSync(path.join(tempDir, 'included.ts'), 'export const i = 1;\n');
        fs.writeFileSync(path.join(tempDir, 'excluded.ts'), 'export const e = 1;\n');
        fs.writeFileSync(path.join(tempDir, '.indexignore'), 'excluded.ts\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite']);
        expect(result.exitCode).to.equal(0);
        const indexContent = fs.readFileSync(path.join(tempDir, 'index.ts'), 'utf8');
        expect(indexContent).to.contain("'./included'");
        expect(indexContent).to.not.contain("'./excluded'");
    });

    it('should produce extra output with --verbose', () => {
        fs.writeFileSync(path.join(tempDir, 'mod.ts'), 'export const m = 1;\n');
        const result = runCli(['generateIndex', tempDir, '--forceOverwrite', '--verbose']);
        expect(result.exitCode).to.equal(0);
        const output = result.stdout + result.stderr;
        expect(output).to.contain('generateIndex');
    });
});
