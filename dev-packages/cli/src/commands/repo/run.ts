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
import { GLSPRepo, baseCommand, execForeground } from '../../util';
import { configureRepoEnv, resolveWorkspaceDir } from './common/utils';

export function createScopedRunCommand(repo: GLSPRepo): Command {
    return baseCommand()
        .name('run')
        .allowUnknownOption(true)
        .description(`Run an arbitrary yarn script in ${repo}`)
        .argument('<script>', 'The yarn script to run')
        .option('-d, --dir <path>', 'Target directory where repos are cloned')
        .option('-v, --verbose', 'Verbose output', false)
        .action(async (script: string, _cmdOptions: unknown, thisCmd: Command) => {
            const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
            configureRepoEnv(cli);
            const dir = resolveWorkspaceDir(cli.dir);
            const repoDir = path.resolve(dir, repo);
            const passthrough = thisCmd.args.slice(1).join(' ');
            const cmd = passthrough ? `yarn ${script} ${passthrough}` : `yarn ${script}`;
            await execForeground(cmd, { cwd: repoDir, verbose: cli.verbose });
        });
}
