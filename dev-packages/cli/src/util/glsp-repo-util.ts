/********************************************************************************
 * Copyright (c) 2025-2026 EclipseSource and others.
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

import { LOGGER } from './logger';
import { PackageHelper } from './package-util';
import { exec } from './process-util';
import { getRemoteUrl } from './git-util';

export type GLSPRepo = (typeof GLSPRepo.choices)[number];
export namespace GLSPRepo {
    export const choices = [
        'glsp',
        'glsp-server-node',
        'glsp-client',
        'glsp-theia-integration',
        'glsp-vscode-integration',
        'glsp-eclipse-integration',
        'glsp-server',
        'glsp-playwright'
    ] as const;

    export function is(object: unknown): object is GLSPRepo {
        return typeof object === 'string' && choices.includes(object as GLSPRepo);
    }

    export function isNpmRepo(repo: string): boolean {
        return repo !== 'glsp-server' && repo !== 'glsp-eclipse-integration';
    }

    export function deriveFromDirectory(repoDir: string): GLSPRepo | undefined {
        const remoteUrl = getRemoteUrl(repoDir);
        const repo = remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1).replace('.git', '');
        if (!repo) {
            LOGGER.warn(`No git repository found in ${repoDir}`);
            return undefined;
        }
        if (!is(repo)) {
            return undefined;
        }
        return repo;
    }
}

export function checkGHCli(): void {
    LOGGER.debug('Verify that Github CLI is configured correctly');
    if (!isGithubCLIAuthenticated()) {
        throw new Error("Github CLI is not configured properly. No user is logged in for host 'github.com'");
    }
}

export function isGithubCLIAuthenticated(): boolean {
    LOGGER.debug('Verify that Github CLI is installed');
    try {
        exec('which gh', { silent: true });
    } catch {
        LOGGER.debug('Github CLI is not installed.');
        return false;
    }

    try {
        exec('gh auth status');
    } catch (error) {
        LOGGER.debug('Github CLI authentication status could not be determined.');
        return false;
    }
    LOGGER.debug('Github CLI is authenticated and ready to use');
    return true;
}

let cachedDefaultProtocol: 'gh' | 'https' | undefined;

export function resolveDefaultProtocol(): 'gh' | 'https' {
    if (cachedDefaultProtocol === undefined) {
        cachedDefaultProtocol = isGithubCLIAuthenticated() ? 'gh' : 'https';
        if (cachedDefaultProtocol === 'https') {
            LOGGER.warn('GitHub CLI not available. Defaulting to HTTPS protocol.');
        }
    }
    return cachedDefaultProtocol;
}

export function getGLSPDependencies(pkg: PackageHelper): string[] {
    const deps = pkg.content.dependencies ? Object.keys(pkg.content.dependencies) : [];
    const devDeps = pkg.content.devDependencies ? Object.keys(pkg.content.devDependencies) : [];
    return [...deps, ...devDeps].filter(dep => dep.startsWith('@eclipse-glsp'));
}

// ── Repo presets & filtering ────────────────────────────────────────────────

export const PRESETS: Record<string, GLSPRepo[]> = {
    core: ['glsp-client', 'glsp-server-node'],
    theia: ['glsp-client', 'glsp-server-node', 'glsp-theia-integration'],
    vscode: ['glsp-client', 'glsp-server-node', 'glsp-vscode-integration'],
    eclipse: ['glsp-client', 'glsp-server-node', 'glsp-server', 'glsp-eclipse-integration'],
    playwright: ['glsp-client', 'glsp-server-node', 'glsp-theia-integration', 'glsp-vscode-integration', 'glsp-playwright'],
    all: [...GLSPRepo.choices]
};

export const PRESET_NAMES = Object.keys(PRESETS);

export interface RepoFilterOptions {
    repo?: string[];
    preset?: string;
}

export function resolveRepoFilter(configuredRepos: GLSPRepo[], filter: RepoFilterOptions): GLSPRepo[] {
    const extraRepos: GLSPRepo[] = [];
    if (filter.repo && filter.repo.length > 0) {
        for (const r of filter.repo) {
            if (!GLSPRepo.is(r)) {
                throw new Error(`Unknown repository: "${r}". Must be one of: ${GLSPRepo.choices.join(', ')}`);
            }
        }
        extraRepos.push(...(filter.repo as GLSPRepo[]));
    }

    if (filter.preset) {
        if (!(filter.preset in PRESETS)) {
            throw new Error(`Unknown preset: "${filter.preset}". Must be one of: ${Object.keys(PRESETS).join(', ')}`);
        }
        const presetRepos = PRESETS[filter.preset];
        const merged = [...presetRepos];
        for (const r of extraRepos) {
            if (!merged.includes(r)) {
                merged.push(r);
            }
        }
        return merged;
    }

    if (extraRepos.length > 0) {
        return extraRepos;
    }

    return configuredRepos;
}
