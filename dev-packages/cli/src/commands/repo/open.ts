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
import { LOGGER, baseCommand } from '../../util';
import { THEIA_URL, configureRepoEnv } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export async function openTarget(target: string): Promise<void> {
    LOGGER.info(`Opening ${target}...`);
    const { default: open } = await import('open');
    await open(target);
}

// ── Commands ────────────────────────────────────────────────────────────────

interface TheiaOpenCliOptions {
    verbose: boolean;
}

export const TheiaOpenCommand = baseCommand()
    .name('open')
    .description('Open the Theia application in the browser for glsp-theia-integration')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: TheiaOpenCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<TheiaOpenCliOptions>();
        configureRepoEnv(cli);

        await openTarget(THEIA_URL);
    });
