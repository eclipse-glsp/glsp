/********************************************************************************
 * Copyright (c) 2022-2025 EclipseSource and others.
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

import { resolve } from 'path';
import { exec } from './process-util';

/**
 * Escapes double quotes and backslashes for safe inclusion in shell-quoted strings ("...").
 * Order matters: escape backslashes first, then quotes.
 */
function escapeDoubleQuotesAndBackslashes(str: string): string {
    // Escape \ first, then ", to avoid double-escaping.
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
export function isGitRepository(path?: string): boolean {
    try {
        const isGitRepo = exec('git rev-parse --is-inside-work-tree', { silent: true, cwd: path }).toLocaleLowerCase() === 'true';
        return isGitRepo;
    } catch {
        return false;
    }
}

export function getGitRoot(path?: string): string {
    const fileString = exec('git rev-parse --show-toplevel', { cwd: path });
    return resolve(fileString);
}

export function hasChanges(path?: string): boolean {
    return getUncommittedChanges(path).length > 0;
}

/**
 * Returns the files that have uncommitted changes (staged, not staged and untracked) of a git repository.
 *
 */
export function getUncommittedChanges(path?: string): string[] {
    return exec('git status --porcelain', { cwd: path })
        .split('\n')
        .filter(value => value.trim().length !== 0)
        .map(fileInfo =>
            // Extract relative file path from the info string and convert to absolute path
            resolve(path ?? process.cwd(), fileInfo.trim().split(' ').pop() ?? '')
        );
}

export function commitChanges(message: string, path?: string): void {
    exec('git add .', { cwd: path });
    exec(`git commit  -m "${escapeDoubleQuotesAndBackslashes(message)}"`, { cwd: path });
}
/**
 * Returns the files tha have been changed with the last commit (also includes currently staged but uncommitted changes)
 *
 */
export function getChangesOfLastCommit(path?: string): string[] {
    return exec('git diff --name-only HEAD^', { cwd: path })
        .split('\n')
        .map(file => resolve(path ?? process.cwd(), file));
}

/**
 * Returns the commit message of the last commit
 *
 */
export function getLastCommitMessage(path?: string): string {
    return exec('git log -1 --pretty=%B', { cwd: path }).trim();
}
/**
 * Returns the last modification date of a file (or the last commit) in a git repo.
 * @param filePath The file. If undefined the modification date of the last commit will be returned
 * @param repoRoot The path to the repo root. If undefined the current working directory is used.
 * @param excludeMessage Only consider commits that don`t match the excludeMessage
 * @returns The date or undefined if the file is outside of the git repo.
 */
export function getLastModificationDate(filePath?: string, repoRoot?: string, excludeMessage?: string): Date | undefined {
    const additionalArgs = excludeMessage ? `--grep="${excludeMessage}" --invert-grep` : '';
    try {
        const result = exec(`git log -1 ${additionalArgs} --pretty="format:%ci" ${filePath ?? ''}`, { cwd: repoRoot });
        return result ? new Date(result) : undefined;
    } catch {
        return undefined;
    }
}

export function getFilesOfCommit(commitHash: string, repoRoot?: string): string[] {
    try {
        const result = exec(`git show --pretty="" --name-only ${commitHash}`, { cwd: repoRoot });
        return result.split('\n');
    } catch {
        return [];
    }
}

export function getLatestTag(path?: string): string {
    return exec('git describe --abbrev=0 --tags', { cwd: path });
}

export function hasBranch(branch: string, path?: string): boolean {
    return exec(`git branch --list ${branch}`, { cwd: path }).length !== 0;
}

export function getRemoteUrl(path?: string): string {
    return exec('git config --get remote.origin.url', { cwd: path });
}

export function getCurrentBranch(path?: string): string {
    return exec('git rev-parse --abbrev-ref HEAD', { cwd: path });
}

export function createBranch(branch: string, path?: string): void {
    exec(`git checkout -B ${branch}`, { cwd: path });
}

export function getDefaultBranch(path?: string): string {
    const output = exec('git remote show origin', { cwd: path });
    const match = output.match(/HEAD branch: (.+)/);
    return match ? match[1].trim() : 'master'; // fallback if not set
}
