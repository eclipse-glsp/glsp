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
import { Command, Option } from 'commander';
import { GLSPRepo, LOGGER, PRESETS, PRESET_NAMES, baseCommand, execForeground } from '../../util';
import { configureRepoEnv, resolveTargetRepos, resolveWorkspaceDir } from './common/utils';

// ── Action: workspace init ──────────────────────────────────────────────────

export const WORKSPACE_FILE_NAME = 'glsp.code-workspace';

export interface WorkspaceInitOptions {
    outputPath?: string;
    verbose: boolean;
}

export interface VSCodeWorkspace {
    folders: { name: string; path: string }[];
    settings: Record<string, unknown>;
    tasks: {
        version: string;
        tasks: {
            label: string;
            type: string;
            command: string;
            group: { kind: string; isDefault: boolean };
            problemMatcher: string[];
        }[];
    };
    extensions: {
        recommendations: string[];
    };
}

export function generateWorkspaceContent(repos: GLSPRepo[], dir: string, options: WorkspaceInitOptions): VSCodeWorkspace {
    const outputDir = options.outputPath ? path.dirname(path.resolve(options.outputPath)) : dir;

    const folders = repos.map(repo => {
        const repoDir = path.resolve(dir, repo);
        const relativePath = path.relative(outputDir, repoDir);
        return { name: repo, path: relativePath };
    });

    const hasJavaRepos = repos.some(r => !GLSPRepo.isNpmRepo(r));

    const tasks: VSCodeWorkspace['tasks']['tasks'] = [];

    tasks.push({
        label: 'GLSP: Build all',
        type: 'shell',
        command: 'npx @eclipse-glsp/cli repo build --no-java',
        group: { kind: 'build', isDefault: true },
        problemMatcher: []
    });

    if (hasJavaRepos) {
        tasks.push({
            label: 'GLSP: Build all (incl. Java)',
            type: 'shell',
            command: 'npx @eclipse-glsp/cli repo build',
            group: { kind: 'build', isDefault: false },
            problemMatcher: []
        });
    }

    for (const [presetName, presetRepos] of Object.entries(PRESETS)) {
        if (presetName === 'all') {
            continue;
        }
        const allPresent = presetRepos.every(r => repos.includes(r));
        const isStrictSubset = presetRepos.length < repos.length;
        if (allPresent && isStrictSubset) {
            tasks.push({
                label: `GLSP: Build ${presetName}`,
                type: 'shell',
                command: `npx @eclipse-glsp/cli repo build --preset ${presetName}`,
                group: { kind: 'build', isDefault: false },
                problemMatcher: []
            });
        }
    }

    tasks.push({
        label: 'GLSP: Link',
        type: 'shell',
        command: 'npx @eclipse-glsp/cli repo link',
        group: { kind: 'none', isDefault: false },
        problemMatcher: []
    });

    tasks.push({
        label: 'GLSP: Unlink',
        type: 'shell',
        command: 'npx @eclipse-glsp/cli repo unlink',
        group: { kind: 'none', isDefault: false },
        problemMatcher: []
    });

    return {
        folders,
        settings: {},
        tasks: {
            version: '2.0.0',
            tasks
        },
        extensions: {
            recommendations: ['dbaeumer.vscode-eslint', 'esbenp.prettier-vscode', 'DavidAnson.vscode-markdownlint']
        }
    };
}

export function generateWorkspaceFile(repos: GLSPRepo[], dir: string, options: WorkspaceInitOptions): string {
    const workspace = generateWorkspaceContent(repos, dir, options);
    const outputFile = options.outputPath ? path.resolve(options.outputPath) : path.join(dir, WORKSPACE_FILE_NAME);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(workspace, undefined, 4) + '\n', 'utf-8');
    LOGGER.info(`Workspace file written to ${outputFile}`);

    return outputFile;
}

// ── Action: workspace open ──────────────────────────────────────────────────

export function discoverWorkspaceFile(dir: string): string | undefined {
    if (!fs.existsSync(dir)) {
        return undefined;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.code-workspace'));
    if (files.length === 1) {
        return path.join(dir, files[0]);
    }
    if (files.length > 1) {
        const defaultFile = files.find(f => f === WORKSPACE_FILE_NAME);
        if (defaultFile) {
            return path.join(dir, defaultFile);
        }
    }
    return undefined;
}

async function openWorkspace(workspaceFilePath: string): Promise<void> {
    LOGGER.info(`Opening workspace ${workspaceFilePath}...`);
    await execForeground(`code ${workspaceFilePath}`);
}

// ── Commands ────────────────────────────────────────────────────────────────

interface WorkspaceInitCliOptions {
    dir?: string;
    verbose: boolean;
    output?: string;
    repo?: string[];
    preset?: string;
}

const WorkspaceInitCommand = baseCommand()
    .name('init')
    .description('Generate a VS Code multi-root workspace file')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-o, --output <path>', 'Output path for the workspace file')
    .addOption(new Option('-r, --repo <name...>', 'Include only these repos'))
    .addOption(new Option('--preset <name>', 'Include repos from a preset').choices(PRESET_NAMES))
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: WorkspaceInitCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<WorkspaceInitCliOptions>();
        configureRepoEnv(cli);

        const { dir, repos } = resolveTargetRepos(cli);

        generateWorkspaceFile(repos, dir, {
            outputPath: cli.output,
            verbose: cli.verbose
        });
    });

interface WorkspaceOpenCliOptions {
    dir?: string;
    verbose: boolean;
}

const WorkspaceOpenCommand = baseCommand()
    .name('open')
    .description('Open the VS Code workspace file')
    .option('-d, --dir <path>', 'Target directory where repos are cloned')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (_cmdOptions: WorkspaceOpenCliOptions, thisCmd: Command) => {
        const cli = thisCmd.opts<WorkspaceOpenCliOptions>();
        configureRepoEnv(cli);

        const dir = resolveWorkspaceDir(cli.dir);
        const workspaceFile = discoverWorkspaceFile(dir);

        if (!workspaceFile) {
            throw new Error(`No .code-workspace file found in '${dir}'.\nRun "glsp repo workspace init" first.`);
        }

        await openWorkspace(workspaceFile);
    });

export const WorkspaceCommand = baseCommand()
    .name('workspace')
    .description('Manage VS Code workspace files for GLSP projects')
    .addCommand(WorkspaceInitCommand)
    .addCommand(WorkspaceOpenCommand);
