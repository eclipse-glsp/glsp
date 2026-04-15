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
import { cleanupTempDir, createTempDir } from '../../tests/helpers/test-helper';
import { deleteFile, filterFiles, moveFile, readFile, readJson, replaceInFile } from './file-util';

describe('file-util', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    describe('readFile', () => {
        it('should read a specific line range from a file', () => {
            const filePath = path.join(tempDir, 'lines.txt');
            fs.writeFileSync(filePath, 'line1\nline2\nline3\nline4', 'utf8');

            const result = readFile(filePath, { startLine: 2, endLine: 3 });

            expect(result).to.contain('line2');
            expect(result).to.contain('line3');
            expect(result).to.not.contain('line1');
            expect(result).to.not.contain('line4');
        });

        it('should throw for a non-existent file', () => {
            const filePath = path.join(tempDir, 'missing.txt');
            expect(() => readFile(filePath)).to.throw(/no such file/);
        });

        it('should throw for a directory path', () => {
            expect(() => readFile(tempDir)).to.throw(/Is a directory/);
        });
    });

    describe('deleteFile', () => {
        it('should delete a file', () => {
            const filePath = path.join(tempDir, 'to-delete.txt');
            fs.writeFileSync(filePath, 'content', 'utf8');

            deleteFile(filePath);

            expect(fs.existsSync(filePath)).to.be.false;
        });

        it('should delete a directory recursively', () => {
            const dirPath = path.join(tempDir, 'subdir');
            fs.mkdirSync(dirPath);
            fs.writeFileSync(path.join(dirPath, 'child.txt'), 'content', 'utf8');

            deleteFile(dirPath);

            expect(fs.existsSync(dirPath)).to.be.false;
        });

        it('should throw for a non-existent path', () => {
            const filePath = path.join(tempDir, 'no-such-file.txt');
            expect(() => deleteFile(filePath)).to.throw(/no such file/);
        });
    });

    describe('moveFile', () => {
        it('should move a file into a directory', () => {
            const filePath = path.join(tempDir, 'source.txt');
            fs.writeFileSync(filePath, 'content', 'utf8');
            const destDir = path.join(tempDir, 'dest');
            fs.mkdirSync(destDir);

            moveFile(filePath, destDir);

            expect(fs.existsSync(path.join(destDir, 'source.txt'))).to.be.true;
            expect(fs.existsSync(filePath)).to.be.false;
        });
    });

    describe('readJson', () => {
        it('should throw for invalid JSON content', () => {
            const filePath = path.join(tempDir, 'bad.json');
            fs.writeFileSync(filePath, '{ not valid json }', 'utf8');

            expect(() => readJson(filePath)).to.throw(/Failed to parse JSON/);
        });
    });

    describe('replaceInFile', () => {
        it('should replace a string pattern in a file', () => {
            const filePath = path.join(tempDir, 'replace.txt');
            fs.writeFileSync(filePath, 'hello world', 'utf8');

            replaceInFile(filePath, 'world', 'universe');

            const result = fs.readFileSync(filePath, 'utf8');
            expect(result).to.equal('hello universe');
        });

        it('should replace a regex pattern in a file', () => {
            const filePath = path.join(tempDir, 'regex.txt');
            fs.writeFileSync(filePath, 'foo123bar', 'utf8');

            replaceInFile(filePath, /\d+/, 'NUM');

            const result = fs.readFileSync(filePath, 'utf8');
            expect(result).to.equal('fooNUMbar');
        });
    });

    describe('filterFiles', () => {
        it('should return only files whose content matches the pattern', () => {
            const matchFile = path.join(tempDir, 'match.txt');
            const noMatchFile = path.join(tempDir, 'nomatch.txt');
            fs.writeFileSync(matchFile, 'hello world', 'utf8');
            fs.writeFileSync(noMatchFile, 'goodbye', 'utf8');

            const result = filterFiles([matchFile, noMatchFile], 'hello');

            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.equal(path.resolve(matchFile));
        });
    });
});
