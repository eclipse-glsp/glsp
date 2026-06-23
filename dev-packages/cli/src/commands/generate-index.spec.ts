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

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initGlobby } from '../util';
import { GenerateIndexCmdOptions, generateIndex } from './generate-index';
import { cleanupTempDir, createTempDir } from '../../tests/helpers/test-helper';

const DEFAULT_OPTIONS: GenerateIndexCmdOptions = {
    singleIndex: true,
    forceOverwrite: true,
    match: ['**/*.ts', '**/*.tsx'],
    ignore: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.d.ts'],
    ignoreFile: '.indexignore',
    style: 'commonjs',
    verbose: false
};

describe('generateIndex', () => {
    let tempDir: string;
    let srcDir: string;
    const originalCwd = process.cwd();

    beforeAll(async () => {
        await initGlobby();
    });

    beforeEach(() => {
        tempDir = createTempDir();
        // the ancestor-traversal is bounded by the enclosing git repository, so make the temp dir a repo root
        execFileSync('git', ['init', '-q'], { cwd: tempDir });
        srcDir = path.join(tempDir, 'src');
        fs.mkdirSync(path.join(srcDir, 'base'), { recursive: true });
        fs.mkdirSync(path.join(srcDir, 'test'), { recursive: true });
        fs.writeFileSync(path.join(srcDir, 'base', 'util.ts'), '');
        fs.writeFileSync(path.join(srcDir, 'test', 'test-util.ts'), '');
    });

    afterEach(() => {
        process.chdir(originalCwd);
        cleanupTempDir(tempDir);
    });

    afterAll(() => {
        process.chdir(originalCwd);
    });

    function readIndex(): string {
        return fs.readFileSync(path.join(srcDir, 'index.ts'), 'utf-8');
    }

    it('should include all matching files when no ignore file is present', () => {
        generateIndex(srcDir, DEFAULT_OPTIONS);
        const index = readIndex();
        expect(index).toContain("export * from './base/util';");
        expect(index).toContain("export * from './test/test-util';");
    });

    it('should honor an ignore file located in the source directory itself', () => {
        fs.writeFileSync(path.join(srcDir, '.indexignore'), 'test/\n');
        generateIndex(srcDir, DEFAULT_OPTIONS);
        const index = readIndex();
        expect(index).toContain("export * from './base/util';");
        expect(index).not.toContain('test/test-util');
    });

    it('should honor an ignore file located in a parent directory (up to the git root)', () => {
        // ignore file one level above the indexed source directory
        fs.writeFileSync(path.join(tempDir, '.indexignore'), 'test/\n');
        generateIndex(srcDir, DEFAULT_OPTIONS);
        const index = readIndex();
        expect(index).toContain("export * from './base/util';");
        expect(index).not.toContain('test/test-util');
    });
});
