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

import * as fs from 'fs';
import * as path from 'path';
import { GLSPRepo, configureEnv, globby, resolveRepoFilter } from '../../../util';

export const GLSP_GITHUB_ORG = 'eclipse-glsp';
export const THEIA_URL = 'http://localhost:3000';
export const VSIX_TARGET_DIR = 'example/workflow/extension';

export function configureRepoEnv(options: { verbose: boolean }): void {
    configureEnv(options);
}

export function validateReposExist(repos: GLSPRepo[], dir: string): void {
    const missing = repos.filter(repo => !fs.existsSync(path.resolve(dir, repo)));
    if (missing.length > 0) {
        throw new Error(`The following repositories are not cloned in '${dir}': ${missing.join(', ')}. Run 'glsp repo clone' first.`);
    }
}

export function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// ── Workspace resolution ──────────────────────────────────────────────────

export function resolveWorkspaceDir(cliDir?: string): string {
    if (cliDir) {
        return path.resolve(cliDir);
    }

    let current = path.resolve(process.cwd());
    const root = path.parse(current).root;

    while (current !== root) {
        if (discoverRepos(current).length > 0) {
            return current;
        }
        if (GLSPRepo.is(path.basename(current))) {
            return path.dirname(current);
        }
        current = path.dirname(current);
    }

    return process.cwd();
}

// ── Repo discovery ────────────────────────────────────────────────────────

export function discoverRepos(dir: string): GLSPRepo[] {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && GLSPRepo.is(entry.name))
        .map(entry => entry.name as GLSPRepo)
        .sort((a, b) => GLSPRepo.choices.indexOf(a) - GLSPRepo.choices.indexOf(b));
}

export interface ResolveTargetReposOptions {
    dir?: string;
    repo?: string[];
    preset?: string;
}

export function resolveTargetRepos(options: ResolveTargetReposOptions): { dir: string; repos: GLSPRepo[] } {
    const dir = resolveWorkspaceDir(options.dir);
    const discovered = discoverRepos(dir);
    if (discovered.length === 0) {
        throw new Error(`No GLSP repositories found in '${dir}'. Clone repositories first with 'glsp repo clone'.`);
    }
    const repos = resolveRepoFilter(discovered, { repo: options.repo, preset: options.preset });
    return { dir, repos };
}

// ── Dependency graph ────────────────────────────────────────────────────────

const DEPENDENCY_MAP: Partial<Record<GLSPRepo, GLSPRepo[]>> = {
    'glsp-client': ['glsp'],
    'glsp-server-node': ['glsp-client'],
    'glsp-theia-integration': ['glsp-server-node'],
    'glsp-vscode-integration': ['glsp-server-node'],
    'glsp-eclipse-integration': ['glsp-client', 'glsp-server']
};

export function getBuildOrder(repos: GLSPRepo[]): GLSPRepo[] {
    const repoSet = new Set(repos);
    const visited = new Set<GLSPRepo>();
    const result: GLSPRepo[] = [];

    function visit(repo: GLSPRepo): void {
        if (visited.has(repo) || !repoSet.has(repo)) {
            return;
        }
        visited.add(repo);
        const deps = DEPENDENCY_MAP[repo] ?? [];
        for (const dep of deps) {
            visit(dep);
        }
        result.push(repo);
    }

    for (const repo of repos) {
        visit(repo);
    }
    return result;
}

export function getBuildLevels(repos: GLSPRepo[]): GLSPRepo[][] {
    const repoSet = new Set(repos);
    const levels: GLSPRepo[][] = [];
    const placed = new Set<GLSPRepo>();

    while (placed.size < repoSet.size) {
        const level: GLSPRepo[] = [];
        for (const repo of repoSet) {
            if (placed.has(repo)) {
                continue;
            }
            const deps = (DEPENDENCY_MAP[repo] ?? []).filter(d => repoSet.has(d));
            if (deps.every(d => placed.has(d))) {
                level.push(repo);
            }
        }
        for (const repo of level) {
            placed.add(repo);
        }
        levels.push(level);
    }

    return levels;
}

export function isLeafRepo(repo: GLSPRepo): boolean {
    for (const deps of Object.values(DEPENDENCY_MAP)) {
        if (deps.includes(repo)) {
            return false;
        }
    }
    return true;
}

export function discoverNewestFile(pattern: string, dir: string, errorMsg: string): string {
    const files = globby(pattern, { cwd: dir, absolute: true });
    if (files.length === 0) {
        throw new Error(errorMsg);
    }
    return files.reduce((newest, file) => (fs.statSync(file).mtimeMs > fs.statSync(newest).mtimeMs ? file : newest));
}
