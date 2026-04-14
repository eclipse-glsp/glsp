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

import { spawnSync } from 'child_process';
import * as path from 'path';

/** Absolute path to the built CLI entry point. */
const CLI_PATH = path.resolve(__dirname, '../../dist/cli.js');

export interface CliResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export interface CliOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
}

/** Spawns the GLSP CLI as a child process and captures its output. */
export function runCli(args: string[], options: CliOptions = {}): CliResult {
    const result = spawnSync('node', [CLI_PATH, ...args], {
        cwd: options.cwd ?? process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, ...options.env },
        timeout: options.timeout ?? 60000,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    return {
        exitCode: result.status ?? 1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? ''
    };
}
