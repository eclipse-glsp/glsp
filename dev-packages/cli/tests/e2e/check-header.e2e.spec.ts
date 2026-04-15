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
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { runCli } from '../helpers/cli-helper';
import { commitFile, createTempGitRepo } from '../helpers/git-helper';
import { cleanupTempDir } from '../helpers/test-helper';

const VALID_HEADER = `/********************************************************************************
 * Copyright (c) ${new Date().getFullYear()} EclipseSource and others.
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
`;

describe('checkHeaders e2e', () => {
    let repoDir: string;

    beforeEach(() => {
        repoDir = createTempGitRepo();
    });

    afterEach(() => {
        cleanupTempDir(repoDir);
    });

    it('should pass for files with valid headers', () => {
        commitFile(repoDir, 'src/good.ts', VALID_HEADER + '\nconst x = 1;\n', 'add valid file');
        const result = runCli(['checkHeaders', repoDir]);
        expect(result.exitCode).to.equal(0);
        expect(result.stdout).to.contain('0 copyright header violations');
    });

    it('should detect files with missing headers', () => {
        commitFile(repoDir, 'src/bad.ts', 'const x = 1;\n', 'add file without header');
        const result = runCli(['checkHeaders', repoDir]);
        expect(result.exitCode).to.not.equal(0);
    });

    it('should auto-fix invalid headers with --autoFix', () => {
        const outdatedHeader = VALID_HEADER.replace(String(new Date().getFullYear()), '2020');
        commitFile(repoDir, 'src/outdated.ts', outdatedHeader + '\nconst x = 1;\n', 'add outdated file');
        const result = runCli(['checkHeaders', repoDir, '--autoFix']);
        expect(result.exitCode).to.equal(0);
        const content = fs.readFileSync(path.join(repoDir, 'src/outdated.ts'), 'utf8');
        expect(content).to.contain(String(new Date().getFullYear()));
    });

    it('should create a git commit with --autoFix --commit', () => {
        const outdatedHeader = VALID_HEADER.replace(String(new Date().getFullYear()), '2020');
        commitFile(repoDir, 'src/outdated.ts', outdatedHeader + '\nconst x = 1;\n', 'add outdated file');
        const result = runCli(['checkHeaders', repoDir, '--autoFix', '--commit']);
        expect(result.exitCode).to.equal(0);
        const log = execSync('git log --oneline', { cwd: repoDir, encoding: 'utf-8' });
        expect(log).to.contain('Fix copyright header violations');
    });

    it('should only check changed files with --type changes', () => {
        commitFile(repoDir, 'src/good.ts', VALID_HEADER + '\nconst x = 1;\n', 'add valid file');
        fs.mkdirSync(path.join(repoDir, 'src'), { recursive: true });
        fs.writeFileSync(path.join(repoDir, 'src/new.ts'), 'const y = 2;\n');
        execSync('git add .', { cwd: repoDir });
        const result = runCli(['checkHeaders', repoDir, '--type', 'changes']);
        expect(result.stdout).to.contain('1 copyright header violations');
    });

    it('should only check last commit files with --type lastCommit', () => {
        commitFile(repoDir, 'src/old.ts', VALID_HEADER + '\nconst x = 1;\n', 'add old file');
        commitFile(repoDir, 'src/new.ts', 'const y = 2;\n', 'add new file');
        const result = runCli(['checkHeaders', repoDir, '--type', 'lastCommit']);
        expect(result.stdout).to.contain('Check copy right headers of 1 files');
    });

    it('should check custom file extensions with --fileExtensions', () => {
        commitFile(repoDir, 'src/script.js', 'const x = 1;\n', 'add js file');
        commitFile(repoDir, 'src/good.ts', VALID_HEADER + '\nconst y = 2;\n', 'add ts file');
        const result = runCli(['checkHeaders', repoDir, '--fileExtensions', 'js']);
        expect(result.stdout).to.contain('Check copy right headers of 1 files');
    });

    it('should exclude files matching --exclude pattern', () => {
        commitFile(repoDir, 'src/main.ts', 'const x = 1;\n', 'add main');
        commitFile(repoDir, 'src/generated/output.ts', 'const y = 2;\n', 'add generated');
        const result = runCli(['checkHeaders', repoDir, '--exclude', '**/generated/**']);
        expect(result.stdout).to.not.contain('generated/output.ts');
    });

    it('should accept --no-exclude-defaults flag', () => {
        commitFile(repoDir, 'src/main.ts', VALID_HEADER + '\nconst y = 2;\n', 'add main');
        const result = runCli(['checkHeaders', repoDir, '--no-exclude-defaults']);
        expect(result.exitCode).to.equal(0);
    });

    it('should write results to JSON file with --json', () => {
        commitFile(repoDir, 'src/good.ts', VALID_HEADER + '\nconst x = 1;\n', 'add valid file');
        const result = runCli(['checkHeaders', repoDir, '--json']);
        expect(result.exitCode).to.equal(0);
        const jsonPath = path.join(repoDir, 'headerCheck.json');
        expect(fs.existsSync(jsonPath)).to.equal(true);
        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        expect(jsonContent).to.be.an('array');
    });
});
