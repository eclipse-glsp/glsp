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
import { Command } from 'commander';
import { GLSPRepo, LOGGER, baseCommand } from '../../util';
import { configureRepoEnv, discoverRepos, resolveWorkspaceDir } from './common/utils';

// ── Commands ────────────────────────────────────────────────────────────────

export function createScopedPwdCommand(repo: GLSPRepo): Command {
    return baseCommand()
        .name('pwd')
        .description(`Print the resolved path for ${repo}`)
        .option('-d, --dir <path>', 'Target directory where repos are cloned')
        .option('-v, --verbose', 'Verbose output', false)
        .action(async (_cmdOptions: unknown, thisCmd: Command) => {
            const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
            configureRepoEnv(cli);
            const dir = resolveWorkspaceDir(cli.dir);
            const repoPath = path.resolve(dir, repo);
            process.stdout.write(repoPath + '\n');
        });
}

export const PwdCommand = baseCommand()
    .name('pwd')
    .description('Print resolved paths for all discovered repositories')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('--raw', 'Print repo<tab>path per line, no color', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean; raw: boolean }>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const repos = discoverRepos(dir);

        if (repos.length === 0) {
            throw new Error(`No GLSP repositories found in '${dir}'. Clone repositories first with 'glsp repo clone'.`);
        }

        if (cli.raw) {
            for (const repo of repos) {
                const repoPath = path.resolve(dir, repo);
                process.stdout.write(`${repo}\t${repoPath}\n`);
            }
            return;
        }

        const maxLen = Math.max(...repos.map(r => r.length));
        for (const repo of repos) {
            const repoPath = path.resolve(dir, repo);
            const padded = repo.padEnd(maxLen + 2);
            LOGGER.info(`${padded}${repoPath}`);
        }
    });
