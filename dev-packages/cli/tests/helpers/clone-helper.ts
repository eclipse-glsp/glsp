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
import * as path from 'path';
import { createTempDir } from './test-helper';

function git(args: string, cwd: string): string {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

const GLSP_GITHUB_BASE = 'https://github.com/eclipse-glsp';

/**
 * Shallow-clones a GLSP repository into a temp directory.
 * Configures git user for test commits. Unshallows the fetch depth
 * so that commits can be pushed to a local bare remote.
 */
export function shallowClone(repo: string): string {
    const dir = createTempDir();
    const targetDir = path.join(dir, repo);
    execSync(`git clone --depth 1 ${GLSP_GITHUB_BASE}/${repo}.git ${targetDir}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
    });
    git('config user.email "test@test.com"', targetDir);
    git('config user.name "Test"', targetDir);
    // Unshallow so we can push to a local bare remote
    git('fetch --unshallow', targetDir);
    return targetDir;
}

/**
 * Replaces the origin remote with a local bare repo.
 * Pushes the current HEAD so the bare repo has content.
 * The bare repo is created inside a temp directory, named after the
 * repository basename so that `GLSPRepo.deriveFromDirectory` can
 * still resolve the repo name from the remote URL.
 * Returns `{ bareDir, parentDir }` — use `parentDir` for cleanup.
 */
export function replaceOriginWithBare(repoDir: string): { bareDir: string; parentDir: string } {
    const parentDir = createTempDir();
    const repoName = path.basename(repoDir);
    const bareDir = path.join(parentDir, repoName);
    git('init --bare ' + bareDir, parentDir);
    git('remote set-url origin ' + bareDir, repoDir);
    git('push -u origin HEAD', repoDir);
    return { bareDir, parentDir };
}
