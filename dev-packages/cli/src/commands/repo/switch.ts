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
import { GLSPRepo, LOGGER, baseCommand, checkGHCli, exec, hasChanges } from '../../util';
import { GLSP_GITHUB_ORG, configureRepoEnv, formatError, resolveWorkspaceDir, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export interface SwitchActionOptions {
    dir: string;
    branch?: string;
    pr?: string;
    force: boolean;
    verbose: boolean;
}

export function validateReposClean(repos: GLSPRepo[], dir: string): void {
    const dirty = repos.filter(repo => hasChanges(path.resolve(dir, repo)));
    if (dirty.length > 0) {
        throw new Error(
            `The following repositories have uncommitted changes: ${dirty.join(', ')}. Commit or stash your changes first, or use --force.`
        );
    }
}

export function switchSingleRepo(repo: GLSPRepo, options: SwitchActionOptions): void {
    const repoDir = path.resolve(options.dir, repo);

    if (options.pr) {
        LOGGER.info(`Checking out PR #${options.pr} in ${repo}`);
        exec(`gh pr checkout ${options.pr} -R ${GLSP_GITHUB_ORG}/${repo}`, { cwd: repoDir });
        return;
    }

    const branch = options.branch!;
    const forceArg = options.force ? ' --force' : '';
    LOGGER.info(`Switching ${repo} to ${branch}`);

    try {
        exec(`git checkout${forceArg} ${branch}`, { cwd: repoDir, silent: true });
    } catch (error) {
        const message = formatError(error);
        if (message.includes('did not match any') || message.includes('pathspec')) {
            LOGGER.warn(`${repo}: branch '${branch}' not found, skipping`);
            return;
        }
        throw error;
    }
}

// ── Command ─────────────────────────────────────────────────────────────────

interface SwitchCliOptions {
    dir?: string;
    branch?: string;
    pr?: string;
    force: boolean;
    verbose: boolean;
}

export function createScopedSwitchCommand(repo: GLSPRepo): Command {
    const cmd = baseCommand()
        .name('switch')
        .description(`Switch branch or checkout a PR in ${repo}`)
        .option('-b, --branch <name>', 'Branch or tag to switch to')
        .option('-d, --dir <path>', 'Target directory where repos are cloned')
        .addOption(new Option('--pr <number>', 'PR to checkout via gh CLI').conflicts('branch'))
        .option('--force', 'Switch even if repos have uncommitted changes', false)
        .option('-v, --verbose', 'Verbose output', false);

    cmd.action(async (_cmdOptions: SwitchCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<SwitchCliOptions>();
        configureRepoEnv(cli);

        if (!cli.branch && !cli.pr) {
            throw new Error('Either --branch or --pr must be specified.');
        }

        const dir = resolveWorkspaceDir(cli.dir);

        if (cli.pr) {
            checkGHCli();
        }

        const options: SwitchActionOptions = {
            dir,
            branch: cli.branch,
            pr: cli.pr,
            force: cli.force,
            verbose: cli.verbose
        };

        validateReposExist([repo], dir);
        if (!cli.force) {
            validateReposClean([repo], dir);
        }

        try {
            switchSingleRepo(repo, options);
        } catch (error) {
            LOGGER.error(`Switching ${repo} failed: ${formatError(error)}`);
            process.exitCode = 1;
        }
    });

    return cmd;
}
