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
import { GLSPRepo, LOGGER, PRESET_NAMES, baseCommand, exec } from '../../util';
import { configureRepoEnv, resolveTargetRepos, resolveWorkspaceDir, validateReposExist } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export function logSingleRepo(repoDir: string): void {
    exec('git --no-pager log -1', { cwd: repoDir, silent: false });
}

// ── Commands ────────────────────────────────────────────────────────────────

export function createScopedLogCommand(repo: GLSPRepo): Command {
    return baseCommand()
        .name('log')
        .description(`Print the last commit for ${repo}`)
        .option('-d, --dir <path>', 'Target directory where repos are cloned')
        .option('-v, --verbose', 'Verbose output', false)
        .action(async (_cmdOptions: unknown, thisCmd: Command) => {
            const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
            configureRepoEnv(cli);
            const dir = resolveWorkspaceDir(cli.dir);
            const repoDir = path.resolve(dir, repo);
            logSingleRepo(repoDir);
        });
}

export const LogCommand = baseCommand()
    .name('log')
    .description('Print the last commit for all discovered repositories')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .addOption(new Option('-r, --repo <name...>', 'Log only these repos'))
    .addOption(new Option('--preset <name>', 'Log repos from a preset').choices(PRESET_NAMES))
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean; repo?: string[]; preset?: string }>();
        configureRepoEnv(cli);

        const { dir, repos } = resolveTargetRepos(cli);
        validateReposExist(repos, dir);

        for (let i = 0; i < repos.length; i++) {
            const repo = repos[i];
            if (i > 0) {
                LOGGER.newLine();
            }
            const repoDir = path.resolve(dir, repo);
            LOGGER.label(repo);
            logSingleRepo(repoDir);
        }
    });
