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
import { createRequire } from 'module';
import * as path from 'path';
import { Command, Option } from 'commander';
import * as YAML from 'yaml';
import {
    GLSPRepo,
    LOGGER,
    PRESET_NAMES,
    PackageHelper,
    baseCommand,
    execAsync,
    getWorkspacePackages,
    readFile,
    writeFile
} from '../../util';
import { buildSingleRepo } from './build';
import { configureRepoEnv, formatError, getBuildOrder, isLeafRepo, resolveTargetRepos, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

// Peer deps shared from glsp-client via pnpm `overrides` so they resolve to a single instance across linked
// repos (DI container/`TYPES`/`instanceof`). reflect-metadata is intentionally excluded: it dedupes via a
// global registry, and overriding it breaks `types: ['reflect-metadata']` resolution in linked builds.
export const SINGLETON_DEPS = ['sprotty', 'sprotty-protocol', 'vscode-jsonrpc', 'inversify'] as const;

const PNPM_EXEC_OPTS = { silent: false, env: { FORCE_COLOR: '1' } } as const;

// `overrides` mutate the lockfile, so it must be updatable (CI defaults to a frozen lockfile).
const PNPM_INSTALL = 'pnpm install --no-frozen-lockfile';

const WORKSPACE_YAML = 'pnpm-workspace.yaml';

const LINKABLE_REPOS: readonly GLSPRepo[] = [
    'glsp',
    'glsp-client',
    'glsp-server-node',
    'glsp-theia-integration',
    'glsp-vscode-integration',
    'glsp-eclipse-integration'
];

// Repos whose linkable pnpm workspace is not the repo root: glsp-eclipse-integration links its client/
// tree (the server/ is Maven, not linked).
const WORKSPACE_SUBDIR: Partial<Record<GLSPRepo, string>> = {
    'glsp-eclipse-integration': 'client'
};

function resolveLinkWorkspaceDir(repoDir: string, repo: GLSPRepo): string {
    const subdir = WORKSPACE_SUBDIR[repo];
    return subdir ? path.join(repoDir, subdir) : repoDir;
}

export interface LinkActionOptions {
    dir: string;
    verbose: boolean;
    failFast: boolean;
    /** Build each linked repo so overrides resolve to compiled `lib/` instead of source. Default `true`. */
    build?: boolean;
    /** Build the Theia electron variant instead of browser. */
    electron?: boolean;
}

interface WorkspaceYaml extends Record<string, unknown> {
    overrides?: Record<string, string>;
}

export function filterLinkableRepos(repos: GLSPRepo[]): GLSPRepo[] {
    return repos.filter(r => (LINKABLE_REPOS as readonly string[]).includes(r));
}

// Matches @eclipse-glsp/* and @eclipse-glsp-examples/*.
function isGlspPackageName(name: string): boolean {
    return name.startsWith('@eclipse-glsp');
}

export function getGLSPWorkspacePackages(repoDir: string): PackageHelper[] {
    return getWorkspacePackages(repoDir).filter(pkg => isGlspPackageName(pkg.name));
}

/** Maps the @eclipse-glsp workspace packages a repo provides to their absolute locations. */
export function collectProvidedPackages(repoDir: string): Record<string, string> {
    const provided: Record<string, string> = {};
    for (const pkg of getGLSPWorkspacePackages(repoDir)) {
        provided[pkg.name] = pkg.location;
    }
    return provided;
}

// Walks up from a module entry to its package root: nearest package.json whose `name` matches (skips
// nested manifests like inversify's lib/cjs/package.json), falling back to the first manifest found.
function packageRootOf(entryPath: string, name: string): string | undefined {
    let dir = path.dirname(entryPath);
    let fallback: string | undefined;
    while (dir !== path.dirname(dir)) {
        const manifest = path.join(dir, 'package.json');
        if (fs.existsSync(manifest)) {
            fallback ??= dir;
            try {
                if ((JSON.parse(fs.readFileSync(manifest, 'utf8')) as { name?: string }).name === name) {
                    return dir;
                }
            } catch {
                // ignore malformed manifest and keep walking up
            }
        }
        if (path.basename(dir) === 'node_modules') {
            break;
        }
        dir = path.dirname(dir);
    }
    return fallback;
}

/** Resolves `dep`'s package dir as seen from one of `fromDirs` (the copy glsp-client uses), or undefined. */
export function resolveSingletonDir(fromDirs: string[], dep: string): string | undefined {
    for (const from of fromDirs) {
        try {
            const requireFrom = createRequire(path.join(from, 'package.json'));
            const root = packageRootOf(fs.realpathSync(requireFrom.resolve(dep)), dep);
            if (root) {
                return root;
            }
        } catch {
            // not resolvable from this directory; try the next
        }
    }
    return undefined;
}

// Collects the singletons as resolved within glsp-client. They are peers of the GLSP packages, so resolve
// from those package dirs (which provide them), not the repo root.
export function collectSingletonLinks(clientDir: string): Record<string, string> {
    const fromDirs = [...getGLSPWorkspacePackages(clientDir).map(pkg => pkg.location), clientDir];
    const links: Record<string, string> = {};
    for (const dep of SINGLETON_DEPS) {
        const dir = resolveSingletonDir(fromDirs, dep);
        if (dir) {
            links[dep] = dir;
        } else {
            LOGGER.debug(`Singleton ${dep} not found in ${path.basename(clientDir)}, skipping`);
        }
    }
    return links;
}

function isManagedLinkOverride(key: string, value: unknown): boolean {
    return (
        typeof value === 'string' &&
        value.startsWith('link:') &&
        (isGlspPackageName(key) || (SINGLETON_DEPS as readonly string[]).includes(key))
    );
}

function currentOverrides(doc: YAML.Document): Record<string, string> {
    return ((doc.toJS() as WorkspaceYaml | null)?.overrides ?? {}) as Record<string, string>;
}

/** Detects the indentation width of a YAML source so re-serialization keeps the original layout. */
function detectIndent(source: string): number {
    const match = source.match(/^( +)\S/m);
    return match ? match[1].length : 2;
}

// Injects `link:` overrides (repo-relative paths) into pnpm-workspace.yaml, edited via the YAML document
// model so existing entries, comments and formatting are preserved.
export function applyLinkOverrides(repoDir: string, links: Record<string, string>): void {
    if (Object.keys(links).length === 0) {
        return;
    }
    const yamlPath = path.resolve(repoDir, WORKSPACE_YAML);
    const source = fs.existsSync(yamlPath) ? readFile(yamlPath) : '';
    const doc = source ? YAML.parseDocument(source) : new YAML.Document({});
    for (const [name, target] of Object.entries(links)) {
        const relative = path.relative(repoDir, target) || '.';
        doc.setIn(['overrides', name], `link:${relative}`);
        LOGGER.debug(`Link ${name} -> link:${relative}`);
    }
    writeFile(yamlPath, doc.toString({ indent: detectIndent(source) }));
}

// Removes the overrides injected by applyLinkOverrides; leaves unrelated overrides untouched. Returns
// whether anything was removed.
export function removeLinkOverrides(repoDir: string): boolean {
    const yamlPath = path.resolve(repoDir, WORKSPACE_YAML);
    if (!fs.existsSync(yamlPath)) {
        return false;
    }
    const source = readFile(yamlPath);
    const doc = YAML.parseDocument(source);
    let removed = false;
    for (const [key, value] of Object.entries(currentOverrides(doc))) {
        if (isManagedLinkOverride(key, value)) {
            doc.deleteIn(['overrides', key]);
            removed = true;
            LOGGER.debug(`Unlink ${key}`);
        }
    }
    if (Object.keys(currentOverrides(doc)).length === 0) {
        doc.delete('overrides');
    }
    if (removed) {
        writeFile(yamlPath, doc.toString({ indent: detectIndent(source) }));
    }
    return removed;
}

export async function runLink(repos: GLSPRepo[], options: LinkActionOptions): Promise<void> {
    const linkable = filterLinkableRepos(repos);
    if (linkable.length === 0) {
        LOGGER.warn('No linkable repositories found.');
        return;
    }
    if (!linkable.includes('glsp-client')) {
        LOGGER.warn('glsp-client is not in the configured repos. Linking without glsp-client may not produce useful results.');
    }

    validateReposExist(linkable, options.dir);
    const ordered = getBuildOrder(linkable);
    const providedPackages: Record<string, string> = {};
    let singletonLinks: Record<string, string> = {};
    let failures = 0;

    LOGGER.label('Linking repositories');

    for (let i = 0; i < ordered.length; i++) {
        const repo = ordered[i];
        try {
            if (i > 0) {
                LOGGER.newLine();
            }
            const repoDir = path.resolve(options.dir, repo);
            const workspaceDir = resolveLinkWorkspaceDir(repoDir, repo);
            LOGGER.info(`Linking ${repo}...`);

            // Consume the packages registered by repos earlier in the build order (plus the shared singletons).
            const links: Record<string, string> = { ...providedPackages };
            if (repo !== 'glsp-client' && linkable.includes('glsp-client')) {
                Object.assign(links, singletonLinks);
            }
            applyLinkOverrides(workspaceDir, links);

            await execAsync(PNPM_INSTALL, { cwd: workspaceDir, ...PNPM_EXEC_OPTS });

            // Build so the linked `lib/` exists for the next consumer. Install already ran above; skip
            // Java/Maven since only the npm side is linked.
            if (options.build ?? true) {
                await buildSingleRepo(repo, {
                    dir: options.dir,
                    electron: options.electron ?? false,
                    verbose: options.verbose,
                    failFast: options.failFast,
                    install: false,
                    java: false
                });
            }

            // Register what this repo provides for repos later in the build order.
            if (!isLeafRepo(repo)) {
                Object.assign(providedPackages, collectProvidedPackages(workspaceDir));
            }
            if (repo === 'glsp-client') {
                singletonLinks = collectSingletonLinks(workspaceDir);
            }

            LOGGER.info(`Successfully linked ${repo}`);
        } catch (error) {
            failures++;
            LOGGER.error(`Linking ${repo} failed: ${formatError(error)}`);
            if (options.failFast) {
                break;
            }
        }
    }

    if (failures > 0) {
        throw new Error(`${failures} repo(s) failed to link.`);
    }

    LOGGER.info('Linking complete.');
}

export async function runUnlink(repos: GLSPRepo[], options: LinkActionOptions): Promise<void> {
    const linkable = filterLinkableRepos(repos);
    if (linkable.length === 0) {
        LOGGER.warn('No linkable repositories found.');
        return;
    }

    validateReposExist(linkable, options.dir);
    const reversed = getBuildOrder(linkable).toReversed();
    let failures = 0;

    LOGGER.label('Unlinking repositories');

    for (let i = 0; i < reversed.length; i++) {
        const repo = reversed[i];
        try {
            if (i > 0) {
                LOGGER.newLine();
            }
            const repoDir = path.resolve(options.dir, repo);
            const workspaceDir = resolveLinkWorkspaceDir(repoDir, repo);
            LOGGER.info(`Unlinking ${repo}...`);

            const removed = removeLinkOverrides(workspaceDir);
            if (removed) {
                await execAsync(PNPM_INSTALL, { cwd: workspaceDir, ...PNPM_EXEC_OPTS });
            } else {
                LOGGER.debug(`No link overrides found for ${repo}, skipping reinstall`);
            }

            LOGGER.info(`Successfully unlinked ${repo}`);
        } catch (error) {
            failures++;
            LOGGER.error(`Unlinking ${repo} failed: ${formatError(error)}`);
            if (options.failFast) {
                break;
            }
        }
    }

    if (failures > 0) {
        throw new Error(`${failures} repo(s) failed to unlink.`);
    }

    LOGGER.info('Unlinking complete.');
}

// ── Commands ────────────────────────────────────────────────────────────────

interface LinkCliOptions {
    dir?: string;
    verbose: boolean;
    repo?: string[];
    preset?: string;
    failFast: boolean;
    build: boolean;
    electron: boolean;
}

export const LinkCommand = baseCommand()
    .name('link')
    .description('Interlink repositories via pnpm-workspace.yaml link overrides')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Link only these repos'))
    .addOption(new Option('--preset <name>', 'Link repos from a preset').choices(PRESET_NAMES))
    .option('--no-build', 'Skip building the linked repos (links resolve to existing compiled output)')
    .option('--electron', 'Build the Theia electron variant instead of browser', false)
    .option('--no-fail-fast', 'Continue after a failure')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: LinkCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<LinkCliOptions>();
        configureRepoEnv(cli);
        const { dir, repos } = resolveTargetRepos(cli);

        try {
            await runLink(repos, { dir, verbose: cli.verbose, failFast: cli.failFast, build: cli.build, electron: cli.electron });
        } catch {
            process.exitCode = 1;
        }
    });

export const UnlinkCommand = baseCommand()
    .name('unlink')
    .description('Remove the pnpm link overrides between repositories')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Unlink only these repos'))
    .addOption(new Option('--preset <name>', 'Unlink repos from a preset').choices(PRESET_NAMES))
    .option('--no-fail-fast', 'Continue after a failure')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: LinkCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<LinkCliOptions>();
        configureRepoEnv(cli);
        const { dir, repos } = resolveTargetRepos(cli);

        try {
            await runUnlink(repos, { dir, verbose: cli.verbose, failFast: cli.failFast });
        } catch {
            process.exitCode = 1;
        }
    });
