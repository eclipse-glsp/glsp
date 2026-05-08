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

export function git(args: string, cwd: string): string {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

export function readJson(filePath: string): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function resetRepo(repoDir: string): void {
    git('checkout .', repoDir);
    git('clean -fd', repoDir);
}

export function currentBranch(repoDir: string): string {
    return git('rev-parse --abbrev-ref HEAD', repoDir);
}

export function isMavenAvailable(): boolean {
    try {
        execSync('mvn --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    } catch {
        return false;
    }
}

export function isSshAvailable(): boolean {
    try {
        // ssh -T git@github.com exits 1 on success ("Hi <user>!") and 255 on auth failure
        const result = execSync('ssh -o BatchMode=yes -o StrictHostKeyChecking=no -T git@github.com 2>&1', {
            encoding: 'utf-8',
            timeout: 10000,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return result.includes('successfully authenticated');
    } catch (err: any) {
        return typeof err.stdout === 'string' && err.stdout.includes('successfully authenticated');
    }
}
