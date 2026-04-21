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

import * as readline from 'readline';
import { GLSPRepo, LOGGER, exec, isGithubCLIAuthenticated } from '../../../util';
import { GLSP_GITHUB_ORG } from './utils';

// ── Fork existence ─────────────────────────────────────────────────────────

export function forkExists(user: string, repo: GLSPRepo): boolean {
    try {
        exec(`git ls-remote https://github.com/${user}/${repo}.git HEAD`, { silent: true });
        return true;
    } catch {
        return false;
    }
}

export async function ensureFork(user: string, repo: GLSPRepo): Promise<void> {
    if (forkExists(user, repo)) {
        return;
    }
    if (!isGithubCLIAuthenticated()) {
        throw new Error(`Fork '${user}/${repo}' not found. Install and authenticate the GitHub CLI (gh) to auto-create forks.`);
    }
    const confirmed = await confirm(`Fork '${user}/${repo}' does not exist. Create it?`);
    if (!confirmed) {
        throw new Error(`Fork creation declined for '${user}/${repo}'.`);
    }
    LOGGER.info(`Creating fork ${user}/${repo}...`);
    exec(`gh repo fork ${GLSP_GITHUB_ORG}/${repo} --remote=false`);
}

// ── Remote helpers ─────────────────────────────────────────────────────────

export function getRemoteUrl(protocol: 'ssh' | 'https' | 'gh', org: string, repo: string): string {
    if (protocol === 'ssh') {
        return `git@github.com:${org}/${repo}.git`;
    }
    return `https://github.com/${org}/${repo}.git`;
}

export function addUpstreamRemote(repoDir: string, repo: GLSPRepo, protocol: 'ssh' | 'https' | 'gh'): void {
    const url = getRemoteUrl(protocol, GLSP_GITHUB_ORG, repo);
    LOGGER.info(`Adding upstream remote: ${url}`);
    exec(`git remote add upstream ${url}`, { cwd: repoDir });
}

export interface RemoteInfo {
    origin?: string;
    upstream?: string;
}

export function getRemotes(repoDir: string): RemoteInfo {
    const result: RemoteInfo = {};
    try {
        result.origin = exec('git config --get remote.origin.url', { cwd: repoDir, silent: true });
    } catch {
        /* empty */
    }
    try {
        result.upstream = exec('git config --get remote.upstream.url', { cwd: repoDir, silent: true });
    } catch {
        /* empty */
    }
    return result;
}

export function remoteMatchesOrg(url: string, org: string, repo: string): boolean {
    return url.includes(`${org}/${repo}`);
}

// ── Remote analysis ────────────────────────────────────────────────────────

export type ForkAction = 'already-configured' | 'rename-origin' | 'set-origin' | 'unexpected';

export function analyzeForkRemotes(remotes: RemoteInfo, forkUser: string, repo: GLSPRepo): ForkAction {
    const originIsFork = remotes.origin !== undefined && remoteMatchesOrg(remotes.origin, forkUser, repo);
    const originIsEclipse = remotes.origin !== undefined && remoteMatchesOrg(remotes.origin, GLSP_GITHUB_ORG, repo);
    const upstreamIsEclipse = remotes.upstream !== undefined && remoteMatchesOrg(remotes.upstream, GLSP_GITHUB_ORG, repo);

    if (originIsFork && upstreamIsEclipse) {
        return 'already-configured';
    }

    if (originIsEclipse) {
        if (!remotes.upstream || upstreamIsEclipse) {
            return remotes.upstream ? 'set-origin' : 'rename-origin';
        }
        return 'unexpected';
    }

    return 'unexpected';
}

// ── Prompting ──────────────────────────────────────────────────────────────

export async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = await new Promise<string>(resolve => rl.question(`${message} [y/N] `, resolve));
        return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    } finally {
        rl.close();
    }
}
