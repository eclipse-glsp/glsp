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
import { Command } from 'commander';
import { baseCommand } from '../../util';
import { configureRepoEnv, resolveRepoDir } from './common/utils';

export const BROWSER_BUNDLE_PATH = 'examples/workflow-server-bundled-web/wf-glsp-server-webworker.js';
export const NODE_BUNDLE_PATH = 'examples/workflow-server-bundled/wf-glsp-server-node.js';

export function resolveBundlePath(repoDir: string, relativePath: string, label: string): string {
    const bundlePath = path.resolve(repoDir, relativePath);
    if (!fs.existsSync(bundlePath)) {
        throw new Error(`${label} not found at ${bundlePath}. Run 'glsp repo server-node build' first.`);
    }
    return bundlePath;
}

export const BrowserBundleCommand: Command = baseCommand()
    .name('browser-bundle')
    .description('Print the absolute path to the browser (Web Worker) server bundle')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const repoDir = resolveRepoDir('glsp-server-node', cli.dir);
        const bundlePath = resolveBundlePath(repoDir, BROWSER_BUNDLE_PATH, 'Browser bundle');
        process.stdout.write(bundlePath);
    });

export const NodeBundleCommand: Command = baseCommand()
    .name('node-bundle')
    .description('Print the absolute path to the Node.js server bundle')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const repoDir = resolveRepoDir('glsp-server-node', cli.dir);
        const bundlePath = resolveBundlePath(repoDir, NODE_BUNDLE_PATH, 'Node server bundle');
        process.stdout.write(bundlePath);
    });
