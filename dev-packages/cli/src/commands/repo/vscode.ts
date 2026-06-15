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
import * as path from 'path';
import { baseCommand, detectPackageManager, execAsync, runScriptCommand } from '../../util';
import { VSIX_TARGET_DIR, WEB_VSIX_TARGET_DIR, configureRepoEnv, discoverNewestFile, resolveWorkspaceDir } from './common/utils';

export const VSIX_ID = 'eclipse-glsp.workflow-vscode-example';
export const WEB_VSIX_ID = 'eclipse-glsp.workflow-vscode-example-web';

// ── Package commands ──────────────────────────────────────────────────────

export const VscodePackageCommand: Command = baseCommand()
    .name('package')
    .description('Package the workflow VS Code extension as a VSIX')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-vscode-integration');
        await execAsync(runScriptCommand(detectPackageManager(repoDir), 'workflow package'), {
            cwd: repoDir,
            silent: false,
            env: { FORCE_COLOR: '1' }
        });
    });

export const VscodeWebPackageCommand: Command = baseCommand()
    .name('web-package')
    .description('Package the workflow VS Code web extension as a VSIX')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-vscode-integration');
        await execAsync(runScriptCommand(detectPackageManager(repoDir), 'workflow:web package'), {
            cwd: repoDir,
            silent: false,
            env: { FORCE_COLOR: '1' }
        });
    });

// ── VSIX path commands ────────────────────────────────────────────────────

export const VsixPathCommand: Command = baseCommand()
    .name('vsix-path')
    .description('Print the path to the workflow VSIX file')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-vscode-integration');
        const vsixPath = discoverVsix(repoDir);
        process.stdout.write(vsixPath);
    });

export const WebVsixPathCommand: Command = baseCommand()
    .name('web-vsix-path')
    .description('Print the path to the workflow web extension VSIX file')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: unknown, thisCmd: Command) => {
        const cli = thisCmd.opts<{ dir?: string; verbose: boolean }>();
        configureRepoEnv(cli);
        const dir = resolveWorkspaceDir(cli.dir);
        const repoDir = path.resolve(dir, 'glsp-vscode-integration');
        const vsixPath = discoverWebVsix(repoDir);
        process.stdout.write(vsixPath);
    });

// ── VSIX ID commands ──────────────────────────────────────────────────────

export const VsixIdCommand: Command = baseCommand()
    .name('vsix-id')
    .description('Print the VSIX ID of the workflow VS Code extension')
    .action(() => {
        process.stdout.write(VSIX_ID);
    });

export const WebVsixIdCommand: Command = baseCommand()
    .name('web-vsix-id')
    .description('Print the VSIX ID of the workflow VS Code web extension')
    .action(() => {
        process.stdout.write(WEB_VSIX_ID);
    });

// ── Discovery helpers ─────────────────────────────────────────────────────

export function discoverVsix(repoDir: string): string {
    const vsixDir = path.resolve(repoDir, VSIX_TARGET_DIR);
    return discoverNewestFile('*.vsix', vsixDir, `No .vsix file found in ${vsixDir}. Run 'glsp repo vscode package' first.`);
}

export function discoverWebVsix(repoDir: string): string {
    const vsixDir = path.resolve(repoDir, WEB_VSIX_TARGET_DIR);
    return discoverNewestFile('*.vsix', vsixDir, `No .vsix file found in ${vsixDir}. Run 'glsp repo vscode web-package' first.`);
}
