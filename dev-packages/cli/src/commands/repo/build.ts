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

import { Command, Option } from 'commander';
import * as path from 'path';
import { GLSPRepo, LOGGER, PRESET_NAMES, baseCommand, execAsync } from '../../util';
import { configureRepoEnv, formatError, getBuildOrder, resolveTargetRepos, resolveWorkspaceDir, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export interface BuildActionOptions {
    dir: string;
    electron: boolean;
    verbose: boolean;
    failFast: boolean;
    /** Run `pnpm install` before building. Default `true`; the link flow sets `false` (already installed). */
    install?: boolean;
    /** Build the Java/Maven parts (eclipse server, glsp-server). Default `true`; the link flow skips them. */
    java?: boolean;
}

interface NpmExecOpts {
    cwd?: string;
    verbose: boolean;
    silent: boolean;
}

async function installNpm(repoDir: string, execOpts: NpmExecOpts): Promise<void> {
    LOGGER.debug('pnpm install');
    await execAsync('pnpm install', { ...execOpts, cwd: repoDir });
}

// `pnpm install` does not run the build automatically, so build explicitly.
async function buildNpm(repoDir: string, execOpts: NpmExecOpts): Promise<void> {
    LOGGER.debug('pnpm build');
    await execAsync('pnpm run --if-present build', { ...execOpts, cwd: repoDir });
}

async function installAndBuildNpm(repoDir: string, execOpts: NpmExecOpts, install: boolean): Promise<void> {
    if (install) {
        await installNpm(repoDir, execOpts);
    }
    await buildNpm(repoDir, execOpts);
}

export async function buildSingleRepo(repo: GLSPRepo, options: BuildActionOptions): Promise<void> {
    const repoDir = path.resolve(options.dir, repo);
    const npmOpts = { cwd: repoDir, verbose: options.verbose, silent: false, env: { FORCE_COLOR: '1' } };
    const mvnOpts = { cwd: repoDir, verbose: options.verbose, silent: false };
    const install = options.install ?? true;
    const java = options.java ?? true;

    LOGGER.label(`Building ${repo}...`);

    switch (repo) {
        case 'glsp-theia-integration': {
            await installAndBuildNpm(repoDir, npmOpts, install);
            const target = options.electron ? 'electron' : 'browser';
            LOGGER.debug('Build for target: ' + target);
            await execAsync(`pnpm run ${target} build`, npmOpts);
            break;
        }
        case 'glsp-server': {
            if (java) {
                await execAsync('mvn clean verify -Pm2 -Pfatjar -Dstyle.color=always -B', mvnOpts);
            }
            break;
        }
        case 'glsp-eclipse-integration': {
            LOGGER.debug('Build client');
            await installAndBuildNpm(path.join(repoDir, 'client'), npmOpts, install);
            if (java) {
                LOGGER.debug('Maven build for server');
                await execAsync('mvn clean verify -Dstyle.color=always -B', { ...mvnOpts, cwd: path.join(repoDir, 'server') });
            }
            break;
        }
        default: {
            await installAndBuildNpm(repoDir, npmOpts, install);
            break;
        }
    }

    LOGGER.info(`Successfully built ${repo}`);
}

export async function runBuildOrdered(repos: GLSPRepo[], options: BuildActionOptions): Promise<number> {
    validateReposExist(repos, options.dir);

    const ordered = getBuildOrder(repos);
    let failures = 0;

    for (let i = 0; i < ordered.length; i++) {
        const repo = ordered[i];
        try {
            if (i > 0) {
                LOGGER.newLine();
            }
            await buildSingleRepo(repo, options);
        } catch (error) {
            failures++;
            LOGGER.error(`Building ${repo} failed: ${formatError(error)}`);
            if (options.failFast) {
                break;
            }
        }
    }

    return failures;
}

// ── Commands ────────────────────────────────────────────────────────────────

interface BuildCliOptions {
    dir?: string;
    electron: boolean;
    verbose: boolean;
}

export function createScopedBuildCommand(repo: GLSPRepo): Command {
    const cmd = baseCommand()
        .name('build')
        .description(`Build the ${repo} repository`)
        .option('-d, --dir <path>', 'Target directory where repos are cloned')
        .option('-v, --verbose', 'Verbose output', false);

    if (repo === 'glsp-theia-integration') {
        cmd.option('--electron', 'Build electron variant instead of browser', false);
    }

    cmd.action(async (_cmdOptions: BuildCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<BuildCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);

        const options: BuildActionOptions = {
            dir,
            electron: cli.electron ?? false,
            verbose: cli.verbose,
            failFast: true
        };

        validateReposExist([repo], dir);
        try {
            await buildSingleRepo(repo, options);
        } catch (error) {
            LOGGER.error(`Building ${repo} failed: ${formatError(error)}`);
            process.exitCode = 1;
        }
    });

    return cmd;
}

interface TopLevelBuildCliOptions {
    dir?: string;
    electron: boolean;
    verbose: boolean;
    repo?: string[];
    preset?: string;
    java: boolean;
    failFast: boolean;
}

export const BuildCommand = baseCommand()
    .name('build')
    .description('Build repositories (dependency-ordered)')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Build only these repos'))
    .addOption(new Option('--preset <name>', 'Build repos from a preset').choices(PRESET_NAMES))
    .option('--electron', 'Build Theia electron variant instead of browser', false)
    .option('--no-java', 'Skip repositories that require Java/Maven')
    .option('--no-fail-fast', 'Continue building after a failure')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: TopLevelBuildCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<TopLevelBuildCliOptions>();
        configureRepoEnv(cli);

        const { dir, repos: allRepos } = resolveTargetRepos(cli);

        let repos = allRepos;

        if (!cli.java) {
            repos = repos.filter(r => GLSPRepo.isNpmRepo(r));
        }

        const options: BuildActionOptions = {
            dir,
            electron: cli.electron,
            verbose: cli.verbose,
            failFast: cli.failFast
        };

        const failures = await runBuildOrdered(repos, options);
        if (failures > 0) {
            process.exitCode = 1;
        }
    });
