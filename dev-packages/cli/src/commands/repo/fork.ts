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
import { GLSPRepo, LOGGER, PRESET_NAMES, baseCommand, exec, resolveDefaultProtocol } from '../../util';
import { analyzeForkRemotes, ensureFork, getRemoteUrl, getRemotes } from './common/fork-utils';
import { configureRepoEnv, formatError, resolveTargetRepos } from './common/utils';

export async function configureForkRemote(repo: GLSPRepo, repoDir: string, user: string, protocol: 'ssh' | 'https' | 'gh'): Promise<void> {
    const remotes = getRemotes(repoDir);
    const action = analyzeForkRemotes(remotes, user, repo);

    switch (action) {
        case 'already-configured':
            LOGGER.info(`${repo}: fork remotes already configured, skipping`);
            break;

        case 'rename-origin': {
            await ensureFork(user, repo);
            LOGGER.info(`${repo}: renaming origin → upstream, adding fork as origin`);
            exec('git remote rename origin upstream', { cwd: repoDir });
            const forkUrl = getRemoteUrl(protocol, user, repo);
            exec(`git remote add origin ${forkUrl}`, { cwd: repoDir });
            break;
        }

        case 'set-origin': {
            await ensureFork(user, repo);
            LOGGER.info(`${repo}: setting origin to fork`);
            const forkUrl = getRemoteUrl(protocol, user, repo);
            exec(`git remote set-url origin ${forkUrl}`, { cwd: repoDir });
            break;
        }

        case 'unexpected':
            LOGGER.warn(
                `${repo}: unexpected remote configuration ` +
                    `(origin=${remotes.origin ?? 'none'}, upstream=${remotes.upstream ?? 'none'}), skipping`
            );
            break;
    }
}

export const ForkCommand = baseCommand()
    .name('fork')
    .description('Add fork remotes to already-cloned repositories')
    .argument('<user>', 'GitHub username for the fork')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-p, --protocol <protocol>', 'Git clone protocol (default: gh|https)').choices(['ssh', 'https', 'gh']))
    .addOption(new Option('-r, --repo <name...>', 'Fork only these repos'))
    .addOption(new Option('--preset <name>', 'Fork repos from a preset').choices(PRESET_NAMES))
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (user: string, _cmdOptions: any, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; protocol?: string; verbose: boolean; repo?: string[]; preset?: string }>();
        configureRepoEnv(cli);

        const { dir, repos } = resolveTargetRepos(cli);
        const protocol = (cli.protocol as 'ssh' | 'https' | 'gh') ?? resolveDefaultProtocol();

        let failures = 0;
        for (const repo of repos) {
            const repoDir = path.resolve(dir, repo);

            if (!fs.existsSync(repoDir)) {
                LOGGER.warn(`${repo}: not cloned at ${repoDir}, skipping`);
                continue;
            }

            try {
                await configureForkRemote(repo, repoDir, user, protocol);
            } catch (error) {
                failures++;
                LOGGER.error(`${repo}: ${formatError(error)}`);
            }
        }

        if (failures > 0) {
            process.exitCode = 1;
        }
    });
