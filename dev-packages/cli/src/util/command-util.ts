/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import * as sh from 'shelljs';
import { configureLogger } from './logger';
export const COMMAND_VERSION = '1.1.0-next';

export function baseConfiguration(cmd: Command): Command {
    return cmd
        .version(COMMAND_VERSION) //
        .showSuggestionAfterError(true)
        .showHelpAfterError(true)
        .allowUnknownOption(false);
}

export interface BaseCmdOptions {
    verbose: boolean;
}

export const SH_CONFIG: sh.ExecOptions & { async: false } = {
    async: false,
    fatal: true,
    silent: false
};

export function getShellConfig(options: Partial<Omit<sh.ExecOptions, 'async'>> = {}): sh.ExecOptions & { async: false } {
    return {
        ...SH_CONFIG,
        ...options
    };
}

export function initialConfiguration(verbose: boolean): void {
    sh.config.reset();

    SH_CONFIG.silent = !verbose;
    configureLogger(verbose);
}

export function fatalExec(
    command: string,
    fatalErrorMessage: string,
    options: Partial<Omit<sh.ExecOptions, 'async'>> = {}
): sh.ShellString {
    const result = sh.exec(command, getShellConfig(options));
    if (result.code !== 0) {
        throw new Error(fatalErrorMessage);
    }
    return result;
}
