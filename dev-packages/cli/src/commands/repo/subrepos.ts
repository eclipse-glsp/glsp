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

import { Command } from 'commander';
import { GLSPRepo, baseCommand } from '../../util';
import { createScopedBuildCommand } from './build';
import { createScopedCloneCommand } from './clone';
import { createScopedLogCommand } from './log';
import { TheiaOpenCommand } from './open';
import { createScopedPwdCommand } from './pwd';
import { ClientStartCommand, ServerNodeStartCommand, ServerStartCommand, TheiaStartCommand } from './start';
import { createScopedSwitchCommand } from './switch';
import { VscodePackageCommand, VsixPathCommand } from './vscode';

const SHORT_ALIASES: Partial<Record<GLSPRepo, string>> = {
    'glsp-client': 'client',
    'glsp-server-node': 'server-node',
    'glsp-theia-integration': 'theia',
    'glsp-vscode-integration': 'vscode',
    'glsp-eclipse-integration': 'eclipse',
    'glsp-server': 'server-java',
    'glsp-playwright': 'playwright'
};

const START_COMMANDS: Partial<Record<GLSPRepo, Command>> = {
    'glsp-client': ClientStartCommand,
    'glsp-server-node': ServerNodeStartCommand,
    'glsp-server': ServerStartCommand,
    'glsp-theia-integration': TheiaStartCommand
};

const OPEN_COMMANDS: Partial<Record<GLSPRepo, Command>> = {
    'glsp-theia-integration': TheiaOpenCommand
};

const EXTRA_COMMANDS: Partial<Record<GLSPRepo, Command[]>> = {
    'glsp-vscode-integration': [VsixPathCommand, VscodePackageCommand]
};

export function createSubrepoCommand(repo: GLSPRepo): Command {
    const cmd = baseCommand()
        .name(repo)
        .description(`Operations on the ${repo} repository`)
        .addCommand(createScopedCloneCommand(repo))
        .addCommand(createScopedSwitchCommand(repo))
        .addCommand(createScopedBuildCommand(repo))
        .addCommand(createScopedPwdCommand(repo))
        .addCommand(createScopedLogCommand(repo));

    const startCmd = START_COMMANDS[repo];
    if (startCmd) {
        cmd.addCommand(startCmd);
    }

    const openCmd = OPEN_COMMANDS[repo];
    if (openCmd) {
        cmd.addCommand(openCmd);
    }

    const extraCmds = EXTRA_COMMANDS[repo];
    if (extraCmds) {
        for (const extraCmd of extraCmds) {
            cmd.addCommand(extraCmd);
        }
    }

    const alias = SHORT_ALIASES[repo];
    if (alias) {
        cmd.alias(alias);
    }

    return cmd;
}
