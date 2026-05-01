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
import * as readline from 'readline';
import { Command, Option } from 'commander';
import {
    GLSPRepo,
    LOGGER,
    PRESETS,
    PRESET_NAMES,
    baseCommand,
    checkGHCli,
    exec,
    resolveDefaultProtocol,
    resolveRepoFilter
} from '../../util';
import { addUpstreamRemote, ensureFork, getRemoteUrl, getRemotes } from './common/fork-utils';
import { GLSP_GITHUB_ORG, configureRepoEnv, formatError, resolveWorkspaceDir } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export interface CloneActionOptions {
    dir: string;
    protocol: 'ssh' | 'https' | 'gh';
    branch?: string;
    fork?: string;
    override?: 'rename' | 'remove';
    verbose: boolean;
}

export async function cloneSingleRepo(repo: GLSPRepo, options: CloneActionOptions): Promise<boolean> {
    const targetDir = path.resolve(options.dir, repo);

    if (fs.existsSync(targetDir)) {
        if (!options.override) {
            LOGGER.warn(`Skipping ${repo}: target directory already exists (use --override to replace): ${targetDir}`);
            return false;
        }
        if (options.override === 'rename') {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const renamed = `${targetDir}_${timestamp}`;
            LOGGER.info(`Renaming existing directory ${targetDir} → ${renamed}`);
            fs.renameSync(targetDir, renamed);
        } else if (options.override === 'remove') {
            LOGGER.info(`Removing existing directory ${targetDir}`);
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
    }

    if (options.fork) {
        await ensureFork(options.fork, repo);
    }

    fs.mkdirSync(path.dirname(targetDir), { recursive: true });

    const org = options.fork ?? GLSP_GITHUB_ORG;
    LOGGER.info(`Cloning ${org}/${repo} into ${targetDir}`);

    if (options.protocol === 'gh') {
        const branchArgs = options.branch ? ` -- -b ${options.branch}` : '';
        exec(`gh repo clone ${org}/${repo} ${targetDir}${branchArgs}`);
    } else {
        const branchArg = options.branch ? ` -b ${options.branch}` : '';
        const url = getRemoteUrl(options.protocol, org, repo);
        exec(`git clone${branchArg} ${url} ${targetDir}`);
    }

    if (options.fork) {
        const remotes = getRemotes(targetDir);
        if (!remotes.upstream) {
            addUpstreamRemote(targetDir, repo, options.protocol);
        }
    }

    return true;
}

// ── Commands ────────────────────────────────────────────────────────────────

interface CloneCliOptions {
    dir?: string;
    protocol?: 'ssh' | 'https' | 'gh';
    branch?: string;
    fork?: string;
    override?: 'rename' | 'remove';
    interactive: boolean;
    preset?: string;
    failFast: boolean;
    verbose: boolean;
}

export function createScopedCloneCommand(repo: GLSPRepo): Command {
    const cmd = baseCommand()
        .name('clone')
        .description(`Clone the ${repo} repository`)
        .option('-d, --dir <path>', 'Target directory for repo clones')
        .addOption(new Option('-p, --protocol <protocol>', 'Git clone protocol (default: gh|https)').choices(['ssh', 'https', 'gh']))
        .option('-b, --branch <name>', 'Branch or tag to check out after cloning')
        .option('--fork <user>', 'Clone from a fork (replaces eclipse-glsp org)')
        .addOption(new Option('--override <mode>', 'How to handle an existing target directory').choices(['rename', 'remove']))
        .option('-v, --verbose', 'Verbose output', false);

    cmd.action(async (_cmdOptions: CloneCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<CloneCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const protocol = cli.protocol ?? resolveDefaultProtocol();

        if (protocol === 'gh') {
            checkGHCli();
        }

        const options: CloneActionOptions = {
            dir,
            protocol,
            branch: cli.branch,
            fork: cli.fork,
            override: cli.override,
            verbose: cli.verbose
        };

        try {
            await cloneSingleRepo(repo, options);
        } catch (error) {
            LOGGER.error(`Cloning ${repo} failed: ${formatError(error)}`);
            process.exitCode = 1;
        }
    });

    return cmd;
}

export const CloneCommand = baseCommand()
    .name('clone')
    .description('Clone GLSP repositories')
    .argument('[repos...]', 'Repositories to clone (can combine with --preset)')
    .option('-d, --dir <path>', 'Target directory for repo clones')
    .addOption(new Option('-p, --protocol <protocol>', 'Git clone protocol (default: gh|https)').choices(['ssh', 'https', 'gh']))
    .option('-b, --branch <name>', 'Branch or tag to check out after cloning')
    .option('--fork <user>', 'Clone from a fork and set up dual-remote (origin=fork, upstream=eclipse-glsp)')
    .addOption(new Option('--override <mode>', 'How to handle an existing target directory').choices(['rename', 'remove']))
    .addOption(new Option('--preset <name>', 'Clone repos from a preset').choices(PRESET_NAMES))
    .option('-i, --interactive', 'Guided setup: choose preset, protocol, and fork interactively', false)
    .option('--no-fail-fast', 'Continue cloning after a failure')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (repos: string[], _cmdOptions: CloneCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<CloneCliOptions>();
        configureRepoEnv(cli);

        let resolvedRepos: GLSPRepo[];
        let protocol: 'ssh' | 'https' | 'gh';
        let fork: string | undefined;

        if (cli.interactive) {
            const answers = await runInteractiveClone();
            resolvedRepos = resolveRepoFilter(GLSPRepo.choices as unknown as GLSPRepo[], {
                repo: repos.length > 0 ? repos : undefined,
                preset: answers.preset
            });
            protocol = cli.protocol ?? answers.protocol ?? resolveDefaultProtocol();
            fork = cli.fork ?? answers.fork;
        } else {
            if (repos.length === 0 && !cli.preset) {
                throw new Error(
                    'Specify repositories to clone, use --preset, or use --interactive for guided setup.\n' +
                        `Available presets: ${PRESET_NAMES.join(', ')}`
                );
            }
            resolvedRepos = resolveRepoFilter(GLSPRepo.choices as unknown as GLSPRepo[], {
                repo: repos.length > 0 ? repos : undefined,
                preset: cli.preset
            });
            protocol = cli.protocol ?? resolveDefaultProtocol();
            fork = cli.fork;
        }

        const dir = resolveWorkspaceDir(cli.dir);

        if (protocol === 'gh' || fork) {
            checkGHCli();
        }

        const options: CloneActionOptions = {
            dir,
            protocol,
            branch: cli.branch,
            fork,
            override: cli.override,
            verbose: cli.verbose
        };

        let failures = 0;
        for (const repo of resolvedRepos) {
            try {
                await cloneSingleRepo(repo, options);
            } catch (error) {
                failures++;
                LOGGER.error(`Cloning ${repo} failed: ${formatError(error)}`);
                if (cli.failFast) {
                    break;
                }
            }
        }

        if (failures > 0) {
            process.exitCode = 1;
        }
    });

// ── Interactive setup ──────────────────────────────────────────────────────

interface InteractiveAnswers {
    preset: string;
    protocol?: 'ssh' | 'https' | 'gh';
    fork?: string;
}

async function runInteractiveClone(): Promise<InteractiveAnswers> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (question: string): Promise<string> => new Promise(resolve => rl.question(question, resolve));

    try {
        console.log('Available presets:');
        for (const [name, repos] of Object.entries(PRESETS)) {
            console.log(`  ${name}: ${repos.join(', ')}`);
        }

        const preset = await ask(`\nPreset (${PRESET_NAMES.join('/')}): `);
        if (!PRESET_NAMES.includes(preset)) {
            throw new Error(`Unknown preset: ${preset}. Must be one of: ${PRESET_NAMES.join(', ')}`);
        }

        const defaultProtocol = resolveDefaultProtocol();
        const protocolInput = await ask(`Clone protocol (ssh/https/gh) [${defaultProtocol}]: `);
        const protocol = protocolInput ? (protocolInput as 'ssh' | 'https' | 'gh') : undefined;

        const fork = await ask('Fork user (leave empty for eclipse-glsp): ');

        return {
            preset,
            protocol,
            fork: fork || undefined
        };
    } finally {
        rl.close();
    }
}
