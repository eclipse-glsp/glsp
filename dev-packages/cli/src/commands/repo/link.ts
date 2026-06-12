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

import * as path from 'path';
import { Command, Option } from 'commander';
import {
    GLSPRepo,
    LOGGER,
    PRESET_NAMES,
    PackageHelper,
    baseCommand,
    detectPackageManager,
    execAsync,
    getWorkspacePackages,
    removePnpmOverrides,
    setPnpmOverrides
} from '../../util';
import { configureRepoEnv, formatError, getBuildOrder, isLeafRepo, resolveTargetRepos, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

/**
 * Dependencies that must resolve to exactly one physical copy across all linked repositories
 * (e.g. inversify relies on singleton decorators). They are overridden to the copy installed
 * in glsp-client so that all linked repositories share the same instance.
 */
export const SINGLETON_DEPS = ['sprotty', 'sprotty-protocol', 'vscode-jsonrpc', 'inversify'] as const;

const EXEC_OPTS = { silent: false, env: { FORCE_COLOR: '1' } } as const;

const LINKABLE_REPOS: readonly GLSPRepo[] = [
    'glsp',
    'glsp-client',
    'glsp-server-node',
    'glsp-theia-integration',
    'glsp-vscode-integration'
];

export interface LinkActionOptions {
    dir: string;
    verbose: boolean;
    failFast: boolean;
    install: boolean;
}

export function filterLinkableRepos(repos: GLSPRepo[]): GLSPRepo[] {
    return repos.filter(r => (LINKABLE_REPOS as readonly string[]).includes(r));
}

export function getGLSPWorkspacePackages(repoDir: string): PackageHelper[] {
    const packages = getWorkspacePackages(repoDir);
    return packages.filter(pkg => pkg.name.startsWith('@eclipse-glsp'));
}

function requirePnpmRepos(repos: GLSPRepo[], dir: string): void {
    for (const repo of repos) {
        const repoDir = path.resolve(dir, repo);
        if (detectPackageManager(repoDir) !== 'pnpm') {
            throw new Error(
                `Repository '${repo}' does not use pnpm. Linking is only supported between pnpm-based repositories.` +
                    ' Migrate the repository first or pin @eclipse-glsp/cli to the last yarn-link-capable version.'
            );
        }
    }
}

/** Converts an absolute target path to a `link:` override value relative to the consuming repository. */
export function asLinkOverride(repoDir: string, targetPath: string): string {
    return `link:${path.relative(repoDir, targetPath).split(path.sep).join('/')}`;
}

/**
 * Computes the `pnpm-workspace.yaml` overrides that link the given packages into the repository at `repoDir`.
 * @param packageLocations Map of package name to the absolute directory of the linked package source
 * @param repoDir The consuming repository
 */
export function computeLinkOverrides(packageLocations: Map<string, string>, repoDir: string): Record<string, string> {
    return Object.fromEntries([...packageLocations].map(([name, location]) => [name, asLinkOverride(repoDir, location)]));
}

/**
 * Computes overrides that pin the {@link SINGLETON_DEPS} to the copies installed in glsp-client.
 * Overrides apply to every dependent in the tree, which guarantees a single physical copy.
 */
export function computeSingletonOverrides(clientDir: string, repoDir: string): Record<string, string> {
    return Object.fromEntries(SINGLETON_DEPS.map(dep => [dep, asLinkOverride(repoDir, path.join(clientDir, 'node_modules', dep))]));
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
    requirePnpmRepos(linkable, options.dir);

    const ordered = getBuildOrder(linkable);
    const clientDir = path.resolve(options.dir, 'glsp-client');
    // package name -> absolute location, collected from repos earlier in the build order
    const packageLocations = new Map<string, string>();
    let failures = 0;

    LOGGER.label('Linking repositories');

    for (let i = 0; i < ordered.length; i++) {
        const repo = ordered[i];
        try {
            if (i > 0) {
                LOGGER.newLine();
            }
            const repoDir = path.resolve(options.dir, repo);
            LOGGER.info(`Linking ${repo}...`);

            const overrides = computeLinkOverrides(packageLocations, repoDir);
            if (repo !== 'glsp-client' && linkable.includes('glsp-client')) {
                Object.assign(overrides, computeSingletonOverrides(clientDir, repoDir));
            }

            if (Object.keys(overrides).length > 0) {
                LOGGER.debug(`Adding ${Object.keys(overrides).length} link overrides to pnpm-workspace.yaml`, overrides);
                setPnpmOverrides(repoDir, overrides);
            }

            if (options.install) {
                await execAsync('pnpm install', { cwd: repoDir, ...EXEC_OPTS });
            }

            if (!isLeafRepo(repo)) {
                getGLSPWorkspacePackages(repoDir).forEach(pkg => packageLocations.set(pkg.name, pkg.location));
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
    requirePnpmRepos(linkable, options.dir);

    const ordered = getBuildOrder(linkable);
    const reversed = [...ordered].reverse();

    // All override names that linking may have written: the @eclipse-glsp packages
    // of every non-leaf linkable repo plus the singleton dependencies.
    const overrideNames = new Set<string>(SINGLETON_DEPS);
    for (const repo of linkable.filter(r => !isLeafRepo(r))) {
        getGLSPWorkspacePackages(path.resolve(options.dir, repo)).forEach(pkg => overrideNames.add(pkg.name));
    }

    let failures = 0;

    LOGGER.label('Unlinking repositories');

    for (let i = 0; i < reversed.length; i++) {
        const repo = reversed[i];
        try {
            if (i > 0) {
                LOGGER.newLine();
            }
            const repoDir = path.resolve(options.dir, repo);
            LOGGER.info(`Unlinking ${repo}...`);

            removePnpmOverrides(repoDir, [...overrideNames]);

            if (options.install) {
                await execAsync('pnpm install', { cwd: repoDir, ...EXEC_OPTS });
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
    install: boolean;
}

export const LinkCommand = baseCommand()
    .name('link')
    .description('Interlink pnpm-based repositories via link: overrides in pnpm-workspace.yaml')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Link only these repos'))
    .addOption(new Option('--preset <name>', 'Link repos from a preset').choices(PRESET_NAMES))
    .option('--no-fail-fast', 'Continue after a failure')
    .option('--no-install', 'Only write the overrides, skip running pnpm install')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: LinkCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<LinkCliOptions>();
        configureRepoEnv(cli);
        const { dir, repos } = resolveTargetRepos(cli);

        try {
            await runLink(repos, { dir, verbose: cli.verbose, failFast: cli.failFast, install: cli.install });
        } catch {
            process.exitCode = 1;
        }
    });

export const UnlinkCommand = baseCommand()
    .name('unlink')
    .description('Remove the link: overrides between repositories')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Unlink only these repos'))
    .addOption(new Option('--preset <name>', 'Unlink repos from a preset').choices(PRESET_NAMES))
    .option('--no-fail-fast', 'Continue after a failure')
    .option('--no-install', 'Only remove the overrides, skip running pnpm install')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: LinkCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<LinkCliOptions>();
        configureRepoEnv(cli);
        const { dir, repos } = resolveTargetRepos(cli);

        try {
            await runUnlink(repos, { dir, verbose: cli.verbose, failFast: cli.failFast, install: cli.install });
        } catch {
            process.exitCode = 1;
        }
    });
