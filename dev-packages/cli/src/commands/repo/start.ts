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
import { LOGGER, baseCommand, execForeground } from '../../util';
import { configureRepoEnv, discoverNewestFile, resolveWorkspaceDir } from './common/utils';

// ── Action ──────────────────────────────────────────────────────────────────

export const JAR_TARGET_DIR = 'examples/org.eclipse.glsp.example.workflow/target';
const JAR_PATTERN = '*-glsp.jar';

export function discoverJar(repoDir: string): string {
    const targetDir = path.resolve(repoDir, JAR_TARGET_DIR);
    return discoverNewestFile(JAR_PATTERN, targetDir, `No *-glsp.jar found in ${targetDir}. Run \`glsp repo server build\` first.`);
}

// ── Commands ────────────────────────────────────────────────────────────────

interface TheiaStartCliOptions {
    dir?: string;
    electron: boolean;
    debug: boolean;
    verbose: boolean;
}

export const TheiaStartCommand = baseCommand()
    .name('start')
    .description('Start the Theia application for glsp-theia-integration')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('--electron', 'Start electron variant instead of browser', false)
    .option('--debug', 'Connect to external GLSP server for debugging', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: TheiaStartCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<TheiaStartCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-theia-integration');
        const target = cli.electron ? 'electron' : 'browser';
        const script = cli.debug ? 'start:debug' : 'start';
        await execForeground(`yarn ${target} ${script}`, { cwd: repoDir, verbose: cli.verbose });
    });

interface ClientStartCliOptions {
    dir?: string;
    browser: boolean;
    verbose: boolean;
}

export const ClientStartCommand = baseCommand()
    .name('start')
    .description('Start the standalone example for glsp-client')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('--browser', 'Run in browser-only mode with WebWorker server', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: ClientStartCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<ClientStartCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-client');
        const script = cli.browser ? 'dev:browser' : 'dev';
        await execForeground(`yarn ${script}`, { cwd: repoDir, verbose: cli.verbose });
    });

export const ServerStartCommand = baseCommand()
    .name('start')
    .description('Start the glsp-server Java GLSP server')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('--socket', 'Use socket connection instead of websocket', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: ServerNodeStartCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<ServerNodeStartCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-server');
        const jarPath = discoverJar(repoDir);
        LOGGER.info(`Found JAR: ${jarPath}`);

        const javaCmd = cli.socket ? `java -jar ${jarPath} --port=5007` : `java -jar ${jarPath} --websocket --port=8081`;

        await execForeground(javaCmd, { cwd: repoDir, verbose: cli.verbose });
    });

interface ServerNodeStartCliOptions {
    dir?: string;
    socket: boolean;
    verbose: boolean;
}

export const ServerNodeStartCommand = baseCommand()
    .name('start')
    .description('Start the glsp-server-node GLSP server')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('--socket', 'Use socket connection instead of websocket', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: ServerNodeStartCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<ServerNodeStartCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-server-node');
        const yarnCmd = cli.socket ? 'yarn start' : 'yarn start:websocket';
        await execForeground(yarnCmd, { cwd: repoDir, verbose: cli.verbose });
    });
