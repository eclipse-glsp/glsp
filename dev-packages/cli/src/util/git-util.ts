/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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

import * as sh from 'shelljs';
import { fatalExec, getShellConfig } from './command-util';
import { LOGGER } from './logger';
import { validateGitDirectory } from './validation-util';

export function isGithubCLIAuthenticated(): boolean {
    LOGGER.debug('Verify that Github CLI is installed');
    fatalExec('which gh', 'Github CLI is not installed!');

    const status = sh.exec('gh auth status', getShellConfig());
    if (status.code !== 0) {
        if (status.stderr.includes('You are not logged into any GitHub hosts')) {
            return false;
        }
        throw new Error(status.stderr);
    }
    if (!status.stderr.trim().includes('Logged in to github.com')) {
        LOGGER.debug("No user is logged in for host 'github.com'");
        return false;
    }
    LOGGER.debug('Github CLI is authenticated and ready to use');
    return true;
}

export function isGitRepository(path: string): boolean {
    LOGGER.debug(`Check if the given directory is a git repo: ${path}`);
    sh.cd(path);
    return sh.exec('git rev-parse --is-inside-work-tree', getShellConfig()).stdout.trim().toLocaleLowerCase() === 'true';
}

export function hasGitChanges(path?: string): boolean {
    LOGGER.debug(`Check if the directory has git changes:  ${asDebugArg(path)}`);
    cdIfPresent(path);
    return sh.exec('git status --porcelain').stdout.trim().length !== 0;
}

export function getLatestRelease(path?: string): string {
    LOGGER.debug(`Retrieve latest release from repo:  ${asDebugArg(path)}`);
    cdIfPresent(path);
    const release = sh.exec('gh release list --exclude-drafts -L 1', getShellConfig()).stdout.trim().split('\t');
    return release[release.length - 2];
}

export function getLatestTag(path?: string): string {
    LOGGER.debug(`Retrieve latest tag from local repo :  ${asDebugArg(path)}`);
    cdIfPresent(path);
    return sh.exec('git describe --abbrev=0 --tags', getShellConfig()).stdout.trim();
}

export function hasBranch(branch: string, path?: string): boolean {
    LOGGER.debug(`Check if branch exists:  ${asDebugArg(path)}`);
    cdIfPresent(path);
    return sh.exec(`git branch --list ${branch}`, getShellConfig()).stdout.trim().length !== 0;
}

export function getRemoteUrl(path?: string): string {
    LOGGER.debug(`Retrieve remote git url for:  ${asDebugArg(path)}`);
    cdIfPresent(path);
    return sh.exec('git config --get remote.origin.url', getShellConfig()).stdout.trim();
}

function cdIfPresent(path?: string): void {
    if (path) {
        validateGitDirectory(path);
        sh.cd(path);
    }
}

function asDebugArg(path?: string): string {
    return path ?? sh.pwd().stdout;
}
