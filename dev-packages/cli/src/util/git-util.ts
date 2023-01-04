/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
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
import * as sh from 'shelljs';
import { getShellConfig } from './command-util';

export function isGitRepository(path?: string): boolean {
    cdIfPresent(path);
    const isGitRepo =
        sh
            .exec('git rev-parse --is-inside-work-tree', getShellConfig({ silent: true }))
            .stdout.trim()
            .toLocaleLowerCase() === 'true';
    return isGitRepo;
}

export function getGitRoot(path?: string): string {
    cdIfPresent(path);
    const fileString = sh.exec('git rev-parse --show-toplevel', getShellConfig()).stdout.trim();
    return resolve(fileString);
}

export function hasGitChanges(path?: string): boolean {
    return getUncommittedChanges(path).length > 0;
}

/**
 * Returns the files that have uncommitted changes (staged, not staged and untracked) of a git repository.
 * Filepaths are absolute.
 */
export function getUncommittedChanges(path?: string): string[] {
    cdIfPresent(path);
    return sh
        .exec('git status --porcelain', getShellConfig())
        .stdout.trim()
        .split('\n')
        .map(fileInfo =>
            // Extract relative file path from the info string and convert to absolute path
            resolve(path ?? process.cwd(), fileInfo.trim().split(' ').pop() ?? '')
        );
}

/**
 * Returns the files tha have been changed with the last commit (also includes currently staged but uncommitted changes)
 * Filepaths are absolute.
 */
export function getChangesOfLastCommit(path?: string): string[] {
    cdIfPresent(path);
    return sh
        .exec('git diff --name-only HEAD^', getShellConfig())
        .stdout.trim()
        .split('\n')
        .map(file => resolve(path ?? process.cwd(), file));
}

/**
 * Returns the last modification date of a file (or the last commit) in a git repo.
 * @param filePath The file. If undefined the modification date of the last commit will be returned
 * @param repoRoot The path to the repo root. If undefined the current working directory is used.
 *  @param excludeMessage Only consider commits that don`t match the excludeMessage

 * @returns The date or undefined if the file is outside of the git repo.
 */
export function getLastModificationDate(filePath?: string, repoRoot?: string, excludeMessage?: string): Date | undefined {
    cdIfPresent(repoRoot);
    const additionalArgs = excludeMessage ? `--grep="${excludeMessage}" --invert-grep` : '';
    const result = sh.exec(`git log -1 ${additionalArgs} --pretty="format:%ci" ${filePath ?? ''}`, getShellConfig());
    if (result.code !== 0) {
        return undefined;
    }
    return new Date(result.stdout.trim());
}
/**
 * Returns the last modification date of a file in a git repo.
 * @param filePath The file
 * @param repoRoot The path to the repo root. If undefined the current working directory is used.
 * @param excludeMessage Only consider commits that don`t match the excludeMessage
 * @returns The date or undefined if the file is outside of the git repo.
 */
export function getFirstModificationDate(filePath: string, repoRoot?: string, excludeMessage?: string): Date | undefined {
    cdIfPresent(repoRoot);
    const additionalArgs = excludeMessage ? `--grep="${excludeMessage}" --invert-grep` : '';
    const result = sh.exec(`git log ${additionalArgs} --pretty="format:%ci" --follow ${filePath}`, getShellConfig());
    if (result.code !== 0) {
        return undefined;
    }
    const datesString = result.stdout.trim();
    if (datesString.length === 0) {
        return new Date();
    }

    const date = datesString.split('\n').pop();
    return date ? new Date(date) : undefined;
}

export function getFilesOfCommit(commitHash: string, repoRoot?: string): string[] {
    cdIfPresent(repoRoot);
    const result = sh.exec(`git show --pretty="" --name-only ${commitHash}`, getShellConfig());
    if (result.code !== 0) {
        return [];
    }

    return result.stdout.trim().split('\n');
}

/**
 * Returns the commit hash of the initial commit of the given repository
 * @param repoRoot The path to the repo root. If undefined the current working directory is used.
 * @returns The commit hash or undefined if something went wrong.
 */
export function getInitialCommit(repoRoot?: string): string | undefined {
    cdIfPresent(repoRoot);
    const result = sh.exec('git log --pretty=oneline --reverse', getShellConfig());
    if (result.code !== 0) {
        return undefined;
    }
    const commits = result.stdout.trim();
    if (commits.length === 0) {
        return undefined;
    }
    return commits.substring(0, commits.indexOf(' '));
}

/**
 * Returns the commit hash of the first commit for a given file (across renames).
 * @param repoRoot The path to the repo root. If undefined the current working directory is used.
 * @returns The commit hash or undefined if something went wrong.
 */
export function getFirstCommit(filePath: string, repoRoot?: string): string | undefined {
    cdIfPresent(repoRoot);
    const result = sh.exec(`git log --follow  --pretty=format:"%H" ${filePath}`, getShellConfig());
    if (result.code !== 0) {
        return undefined;
    }
    return result.stdout.trim().split('\n').pop();
}

export function getLatestGithubRelease(path?: string): string {
    cdIfPresent(path);
    const release = sh.exec('gh release list --exclude-drafts -L 1', getShellConfig()).stdout.trim().split('\t');
    return release[release.length - 2];
}

export function getLatestTag(path?: string): string {
    cdIfPresent(path);
    return sh.exec('git describe --abbrev=0 --tags', getShellConfig()).stdout.trim();
}

export function hasBranch(branch: string, path?: string): boolean {
    cdIfPresent(path);
    return sh.exec(`git branch --list ${branch}`, getShellConfig()).stdout.trim().length !== 0;
}

export function getRemoteUrl(path?: string): string {
    cdIfPresent(path);
    return sh.exec('git config --get remote.origin.url', getShellConfig()).stdout.trim();
}

function cdIfPresent(path?: string): void {
    if (path) {
        sh.cd(path);
    }
}
