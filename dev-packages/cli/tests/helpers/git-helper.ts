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

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { createTempDir } from './test-helper';

function git(args: string, cwd: string): string {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

/** Creates a temporary git repository with an initial commit. */
export function createTempGitRepo(): string {
    const dir = createTempDir();
    git('init', dir);
    git('config user.email "test@test.com"', dir);
    git('config user.name "Test"', dir);
    fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');
    git('add .', dir);
    git('commit -m "initial commit"', dir);
    return dir;
}

/** Write a file, stage it, and commit. */
export function commitFile(repoDir: string, relativePath: string, content: string, message: string): void {
    const filePath = path.join(repoDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
    git('add .', repoDir);
    git(`commit -m "${message}"`, repoDir);
}
