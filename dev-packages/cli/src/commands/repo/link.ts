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
import { Command, Option } from 'commander';
import { GLSPRepo, LOGGER, PRESET_NAMES, PackageHelper, baseCommand, exec, execAsync, getYarnWorkspacePackages } from '../../util';
import { configureRepoEnv, formatError, getBuildOrder, isLeafRepo, resolveTargetRepos, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export const SINGLETON_DEPS = ['sprotty', 'sprotty-protocol', 'vscode-jsonrpc', 'inversify'] as const;

const YARN_EXEC_OPTS = { silent: false, env: { FORCE_COLOR: '1' } } as const;

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
}

export function filterLinkableRepos(repos: GLSPRepo[]): GLSPRepo[] {
    return repos.filter(r => (LINKABLE_REPOS as readonly string[]).includes(r));
}

export function getGLSPWorkspacePackages(repoDir: string): PackageHelper[] {
    const packages = getYarnWorkspacePackages(repoDir);
    return packages.filter(pkg => pkg.name.startsWith('@eclipse-glsp'));
}

export function getRegisteredPackages(linkDir: string): string[] {
    const packages: string[] = [];
    if (!fs.existsSync(linkDir)) {
        return packages;
    }
    for (const entry of fs.readdirSync(linkDir)) {
        const entryPath = path.join(linkDir, entry);
        if (entry.startsWith('@') && fs.statSync(entryPath).isDirectory()) {
            for (const sub of fs.readdirSync(entryPath)) {
                packages.push(`${entry}/${sub}`);
            }
        }
    }
    return packages;
}

export function registerPackages(repoDir: string, linkDir: string): string[] {
    const packages = getGLSPWorkspacePackages(repoDir);
    const registered: string[] = [];
    for (const pkg of packages) {
        LOGGER.debug(`Registering ${pkg.name}`);
        exec(`yarn link --link-folder ${linkDir}`, { cwd: pkg.location, ...YARN_EXEC_OPTS });
        registered.push(pkg.name);
    }
    return registered;
}

export function registerSingletons(clientDir: string, linkDir: string): void {
    for (const dep of SINGLETON_DEPS) {
        const depDir = path.join(clientDir, 'node_modules', dep);
        LOGGER.debug(`Registering singleton ${dep}`);
        exec(`yarn link --link-folder ${linkDir}`, { cwd: depDir, ...YARN_EXEC_OPTS });
    }
}

export function consumePackages(repoDir: string, linkDir: string, registeredPackages: string[]): void {
    if (registeredPackages.length === 0) {
        return;
    }
    LOGGER.debug(`Linking ${registeredPackages.join(', ')} into ${path.basename(repoDir)}`);
    exec(`yarn link --link-folder ${linkDir} ${registeredPackages.join(' ')}`, { cwd: repoDir, ...YARN_EXEC_OPTS });
}

export function consumeSingletons(repoDir: string, linkDir: string): void {
    LOGGER.debug(`Linking singletons into ${path.basename(repoDir)}`);
    exec(`yarn link --link-folder ${linkDir} ${SINGLETON_DEPS.join(' ')}`, { cwd: repoDir, ...YARN_EXEC_OPTS });
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
    const linkDir = path.resolve(options.dir, '.yarn-link');
    const ordered = getBuildOrder(linkable);
    const registeredPackages: string[] = [];
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

            const packagesFromPriorRepos = [...registeredPackages];

            if (!isLeafRepo(repo)) {
                const registered = registerPackages(repoDir, linkDir);
                registeredPackages.push(...registered);
            }

            if (repo === 'glsp-client') {
                await execAsync('yarn install', { cwd: repoDir, ...YARN_EXEC_OPTS });
                registerSingletons(repoDir, linkDir);
            }

            await execAsync('yarn install --force', { cwd: repoDir, ...YARN_EXEC_OPTS });

            consumePackages(repoDir, linkDir, packagesFromPriorRepos);

            if (repo !== 'glsp-client' && linkable.includes('glsp-client')) {
                consumeSingletons(repoDir, linkDir);
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
    const linkDir = path.resolve(options.dir, '.yarn-link');
    const ordered = getBuildOrder(linkable);
    const reversed = [...ordered].reverse();
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

            if (repo !== 'glsp-client' && linkable.includes('glsp-client')) {
                exec(`yarn unlink --link-folder ${linkDir} ${SINGLETON_DEPS.join(' ')}`, { cwd: repoDir, ...YARN_EXEC_OPTS });
            }

            const allLinkedPackages = getRegisteredPackages(linkDir);
            if (allLinkedPackages.length > 0) {
                exec(`yarn unlink --link-folder ${linkDir} ${allLinkedPackages.join(' ')}`, { cwd: repoDir, ...YARN_EXEC_OPTS });
            }

            if (repo === 'glsp-client') {
                for (const dep of SINGLETON_DEPS) {
                    const depDir = path.join(repoDir, 'node_modules', dep);
                    if (fs.existsSync(depDir)) {
                        exec(`yarn unlink --link-folder ${linkDir}`, { cwd: depDir, ...YARN_EXEC_OPTS });
                    }
                }
            }

            if (!isLeafRepo(repo)) {
                const packages = getGLSPWorkspacePackages(repoDir);
                for (const pkg of packages) {
                    exec(`yarn unlink --link-folder ${linkDir}`, { cwd: pkg.location, ...YARN_EXEC_OPTS });
                }
            }

            await execAsync('yarn install --force', { cwd: repoDir, ...YARN_EXEC_OPTS });

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
}

export const LinkCommand = baseCommand()
    .name('link')
    .description('Interlink repositories via yarn link')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Link only these repos'))
    .addOption(new Option('--preset <name>', 'Link repos from a preset').choices(PRESET_NAMES))
    .option('--no-fail-fast', 'Continue after a failure')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: LinkCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<LinkCliOptions>();
        configureRepoEnv(cli);
        const { dir, repos } = resolveTargetRepos(cli);

        try {
            await runLink(repos, { dir, verbose: cli.verbose, failFast: cli.failFast });
        } catch {
            process.exitCode = 1;
        }
    });

export const UnlinkCommand = baseCommand()
    .name('unlink')
    .description('Remove yarn links between repositories')
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
