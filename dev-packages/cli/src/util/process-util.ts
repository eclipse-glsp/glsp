/********************************************************************************
 * Copyright (c) 2025 EclipseSource and others.
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

import * as child from 'child_process';
import { Command } from 'commander';
import * as path from 'path';
import * as pkg from '../../package.json';

export const COMMAND_VERSION = pkg.version;

export function baseCommand(cmd = new Command()): Command {
    return cmd //
        .showSuggestionAfterError(true)
        .allowUnknownOption(false);
}

/**
 * Changes the current working directory to the given directory.
 * @param dir The directory to change to
 * @returns The new current working directory
 */
export function cd(dir: string): string {
    const newDir = path.resolve(dir);
    process.chdir(newDir);
    return newDir;
}

/**
 * Returns the current working directory.
 * @returns The current working directory
 */
export function pwd(): string {
    return process.cwd();
}

/**
 * Global configuration for exec calls.
 */
export interface ExecConfig {
    /**
     * Suppresses all command output if true. Default is true.
     */
    silent: boolean;

    /**
     * If true the script will die on errors. Default is false.
     */
    fatal: boolean;

    /**
     * Will print each executed command to the screen.
     * Default is false.
     *
     */
    verbose: boolean;
}

const defaultExecConfig: ExecConfig = {
    silent: false,
    fatal: false,
    verbose: false
} as const;

const globalExecConfig: ExecConfig = { ...defaultExecConfig };

export function configureExec(config: Partial<ExecConfig>): void {
    Object.assign(globalExecConfig, config);
}

export interface ExecOptions {
    /** If true, do not print command output*/
    silent?: boolean;
    /** If true, program terminates on errors*/
    fatal?: boolean;
    /** If true, print the command before executing it */
    verbose?: boolean;
    /** Current working directory of the command */
    cwd?: string;
    /** Custom error message that should be thrown if the command fails */
    errorMsg?: string;
}

/**
 * Executes the given command synchronously.
 * If `silent` is true, command output is suppressed, else its printed after execution
 * If `verbose` mode is enabled, the command itself is printed before execution.
 * If `fatal` is true, the process exits on error.
 * Note: Due to snychonous execution, the common output is only printed after the command has finished
 *       (if silent is false). If you need continuous output use {@link execAsync} instead.
 * @param cmd  The command to execute
 * @param options
 * @returns The command output as string
 * @throws Error if the command fails and `fatal` is false
 */
export function exec(cmd: string, options: ExecOptions = {}): string {
    // Merge global config with local options (local options take precedence)
    const silent = options.silent !== undefined ? options.silent : globalExecConfig.silent;
    const fatal = options.fatal !== undefined ? options.fatal : globalExecConfig.fatal;
    const verbose = options.verbose !== undefined ? options.verbose : globalExecConfig.verbose;
    const { cwd } = options;

    if (verbose) {
        console.log(`+ ${cmd}`);
    }

    const [command, ...args] = cmd.split(' ');

    const result = child.spawnSync(command, args, {
        encoding: 'utf8',
        shell: true,
        cwd,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    if (result.error || result.status !== 0) {
        const errorMsg = `Command failed: ${cmd}\n${result.stderr || ''}`.trim();
        if (fatal) {
            // Print error and exit the process
            console.error(errorMsg);
            process.exit(result.status ?? 1);
        } else {
            throw new Error(options.errorMsg ?? errorMsg);
        }
    }

    if (!silent && result.stdout) {
        process.stdout.write(result.stdout);
    }

    return result.stdout ? result.stdout.toString().trim() : '';
}

/**
 * Executes the given command asynchronously.
 * If `silent` is true, command output is suppressed, else its printed while executing
 * If `verbose` mode is enabled, the command itself is printed before execution.
 * If `fatal` is true, the process exits on error.
 * @param cmd The command to execute
 * @param options
 * @returns A promise that resolves with the command output as string
 * @throws Error if the command fails and `fatal` is false
 */
export function execAsync(cmd: string, options: ExecOptions = {}): Promise<string> {
    // Merge global config with local options (local options take precedence)
    const silent = options.silent !== undefined ? options.silent : globalExecConfig.silent;
    const fatal = options.fatal !== undefined ? options.fatal : globalExecConfig.fatal;
    const verbose = options.verbose !== undefined ? options.verbose : globalExecConfig.verbose;
    const { cwd } = options;

    if (verbose) {
        console.log(`+ ${cmd}`);
    }

    return new Promise((resolve, reject) => {
        const [command, ...args] = cmd.split(' ');

        const childProcess = child.spawn(command, args, {
            shell: true,
            cwd,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', data => {
            stdout += data.toString();
            if (!silent) {
                process.stdout.write(data);
            }
        });

        childProcess.stderr.on('data', data => {
            stderr += data.toString();
            if (!silent) {
                process.stderr.write(data);
            }
        });

        childProcess.on('close', code => {
            if (code !== 0) {
                const errorMsg = `Command failed: ${cmd}\n${stderr}`.trim();
                if (fatal) {
                    // Print error and exit the process
                    console.error(errorMsg);
                    process.exit(code ?? 1);
                } else {
                    reject(new Error(options.errorMsg ?? errorMsg));
                    return;
                }
            }
            resolve(stdout.trim());
        });

        childProcess.on('error', error => {
            const errorMsg = `Command failed: ${cmd}\n${error.message}`.trim();
            if (fatal) {
                // Print error and exit the process
                console.error(errorMsg);
                process.exit(1);
            } else {
                reject(new Error(options.errorMsg ?? errorMsg));
            }
        });
    });
}
