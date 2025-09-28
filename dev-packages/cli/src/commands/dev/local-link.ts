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

import { Option } from 'commander';
import * as path from 'path';
import {
    baseCommand,
    cd,
    configureExec,
    configureLogger,
    execAsync,
    LOGGER,
    PackageHelper,
    readPackage,
    validateDirectory
} from '../../util';
import { GLSPRepo } from '../common';
import { RepoData } from './common';

interface LocalLinkCmdOptions {
    verbose: boolean;
    ignore: RepoIgnore[];
    scripts: boolean;
    linkDir?: string;
    linkDev: boolean;
    clean: boolean;
}

type RepoIgnore = (typeof ignoreChoices)[number];
const ignoreChoices = ['theia', 'vscode', 'server', 'eclipse'] as const;

interface LocalLinkOptions extends LocalLinkCmdOptions {
    parentDir: string;
    linkDir: string;
    repos: Record<GLSPRepo, RepoData | undefined>;
}

export const LocalLinkCommand = baseCommand()
    .name('localLink')
    .description('Interlink local GLSP repositories for local development (Using`yarn link`)\n')
    .argument('<parentDir>', 'The parent directory', validateDirectory)
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .addOption(
        new Option('-i, --ignore <repo...>', 'Ignore linking the given repository (even if it exists)').choices(ignoreChoices).default([])
    )
    .option('--link-dev', 'Also link the dev-packages (glsp)', false)
    .option('--no-scripts', 'Do not setup build scripts in the parent directory', true)
    .option('-l, --link-dir [linkDir}', 'The directory to create the links in (default: <parentDir>/links)')
    .option('-c, --clean', 'Clean linking directory before setting up the local links (fresh start)', false)
    .action(linkAction);

/**
 * The main action function for the 'localLink' command.
 */
function linkAction(parentDir: string, cmdOptions: LocalLinkCmdOptions): Promise<void> {
    configureExec({ silent: !cmdOptions.verbose, verbose: cmdOptions.verbose });
    configureLogger(cmdOptions.verbose);
    LOGGER.debug('Command options: ', cmdOptions);
    const repos = RepoData.deriveFromDirectory(parentDir);
    if (!repos['glsp-client']) {
        throw new Error(`No 'glsp-client' repository found in ${parentDir}.
 This is the minimum requirement for local linking.`);
    }

    const linkDir = cmdOptions.linkDir ? path.resolve(cmdOptions.linkDir) : path.resolve(parentDir, 'links');
    const options: LocalLinkOptions = {
        parentDir,
        linkDir,
        repos,
        ...cmdOptions
    };
    configureExec({ silent: !options.verbose, fatal: true });
    return setupLinking(options);
}

async function setupLinking(options: LocalLinkOptions): Promise<void> {
    LOGGER.info('Setup up local linking in directory: ', options.parentDir);
    LOGGER.info('Using link directory: ', options.linkDir);

    cd(options.parentDir);
    if (options.clean) {
        LOGGER.info('Cleaning link directory: ', options.linkDir);
        await execAsync(`rm -rf ${options.linkDir}`, { silent: !options.verbose });
    }
    await linkDevPackages(options);
    await linkClientPackage(options);
    await linkServerPackage(options);
    await linkTheiaPackage(options);
    await linkVscodePackage(options);
    await linkEclipsePackage(options);
}

async function linkDevPackages(options: LocalLinkOptions): Promise<void> {
    if (!options.linkDev) {
        LOGGER.debug("Skipping linking dev-packages as 'glsp-dev.");
        return;
    }

    const repo = options.repos['glsp'];
    if (!repo) {
        throw new Error(`Cannot link dev-packages, 'glsp' repository not found in ${options.parentDir}.`);
    }

    LOGGER.separator();
    LOGGER.info('Linking dev-packages ...');
    LOGGER.separator();

    LOGGER.newLine();
    const linkablePackages = await setupWorkspacePackageLinks('glsp', options);
    repo.linkablePackages = linkablePackages;
    await build(repo);
    LOGGER.newLine();
}

async function linkClientPackage(options: LocalLinkOptions): Promise<void> {
    const repo = options.repos['glsp-client'];
    if (!repo) {
        throw new Error(`No 'glsp-client' repository found in ${options.parentDir}.
 This is the minimum requirement for local linking.`);
    }

    LOGGER.separator();
    LOGGER.info('Linking client packages ...');
    LOGGER.separator();
    LOGGER.newLine();

    linkPackages('glsp-client', options);
    const linkablePackages = await setupWorkspacePackageLinks('glsp-client', options);

    await build(repo);
    const nodeModulesPath = path.resolve(repo.path, 'node_modules');

    const additionalPackages = [
        readPackage(path.resolve(nodeModulesPath, 'sprotty', 'package.json')),
        readPackage(path.resolve(nodeModulesPath, 'sprotty-protocol', 'package.json')),
        readPackage(path.resolve(nodeModulesPath, 'vscode-jsonrpc', 'package.json')),
        readPackage(path.resolve(nodeModulesPath, 'inversify', 'package.json'))
    ];

    for (const pkg of additionalPackages) {
        await setupLink(pkg, options);
        linkablePackages.push(pkg.name);
    }
    repo.linkablePackages = linkablePackages;
    LOGGER.newLine();
}

async function linkServerPackage(options: LocalLinkOptions): Promise<void> {
    if (options.ignore.includes('server')) {
        LOGGER.debug("Skipping linking 'glsp-server-node' as it is ignored.");
        return;
    }
    const repo = options.repos['glsp-server-node'];
    if (!repo) {
        LOGGER.debug("Skipping linking 'glsp-server-node' as it does not exist.");
        return;
    }

    LOGGER.separator();
    LOGGER.info('Linking server packages ...');
    LOGGER.separator();
    LOGGER.newLine();
    linkPackages('glsp-server-node', options);
    const linkablePackages = await setupWorkspacePackageLinks('glsp-server-node', options);
    repo.linkablePackages = linkablePackages;
    await build(repo);
    LOGGER.newLine();
}

async function linkTheiaPackage(options: LocalLinkOptions): Promise<void> {
    if (options.ignore.includes('theia')) {
        LOGGER.debug("Skipping linking 'glsp-theia-integration' as it is ignored.");
        return;
    }
    const repo = options.repos['glsp-theia-integration'];
    if (!repo) {
        LOGGER.debug("Skipping linking 'glsp-theia-integration' as it does not exist.");
        return;
    }

    LOGGER.separator();
    LOGGER.info('Linking Theia integration package ...');
    LOGGER.separator();
    LOGGER.newLine();
    linkPackages('glsp-theia-integration', options);
    await build(repo);
    LOGGER.newLine();
}

async function linkVscodePackage(options: LocalLinkOptions): Promise<void> {
    if (options.ignore.includes('vscode')) {
        LOGGER.debug("Skipping linking 'glsp-vscode-integration' as it is ignored.");
        return;
    }
    const repo = options.repos['glsp-vscode-integration'];
    if (!repo) {
        LOGGER.debug("Skipping linking 'glsp-vscode-integration' as it does not exist.");
        return;
    }

    LOGGER.separator();
    LOGGER.info('Linking VSCode integration package ...');
    LOGGER.separator();
    LOGGER.newLine();
    linkPackages('glsp-vscode-integration', options);
    await build(repo);
    LOGGER.newLine();
}

async function linkEclipsePackage(options: LocalLinkOptions): Promise<void> {
    if (options.ignore.includes('eclipse')) {
        LOGGER.debug("Skipping linking 'glsp-eclipse-integration' as it is ignored.");
        return;
    }
    const repo = options.repos['glsp-eclipse-integration'];
    if (!repo) {
        LOGGER.debug("Skipping linking 'glsp-eclipse-integration' as it does not exist.");
        return;
    }

    LOGGER.separator();
    LOGGER.info('Linking Eclipse integration package ...');
    LOGGER.separator();
    LOGGER.newLine();
    linkPackages('glsp-eclipse-integration', options);
    await build(repo);
    LOGGER.newLine();
}

async function setupWorkspacePackageLinks(repoType: GLSPRepo, options: LocalLinkOptions): Promise<string[]> {
    const repo = options.repos[repoType];
    if (!repo) {
        throw new Error(`Cannot link workspace packages, '${repoType}' repository not found.`);
    }

    const linkablePackages: string[] = [];
    for (const pkg of repo.workspacePackages) {
        if (pkg.content.private) {
            continue;
        }
        setupLink(pkg, options);
        linkablePackages.push(pkg.name);
    }
    return linkablePackages;
}

async function setupLink(pkg: PackageHelper, options: LocalLinkOptions): Promise<void> {
    LOGGER.info(`Setup link for package: ${pkg.name}`);
    await execAsync(`yarn link --link-folder ${options.linkDir}`, { cwd: pkg.location, verbose: options.verbose });
}

async function linkPackages(repoType: GLSPRepo, options: LocalLinkOptions): Promise<void> {
    const repoPath = options.repos[repoType]?.path;
    if (!repoPath) {
        throw new Error(`Cannot link packages, '${repoType}' repository not found.`);
    }
    const packagesToLink = RepoData.getPackagesToLink(repoType, options.repos);
    if (packagesToLink.length === 0) {
        LOGGER.debug(`No packages to link for repository type '${repoType}'. Skipping linking.`);
    }
    LOGGER.info(`Linking external glsp packages for repository '${repoType}'`);
    LOGGER.debug('Packages to link:', packagesToLink);
    await execAsync(`yarn link --link-folder ${options.linkDir} ${packagesToLink.join(' ')}`, { cwd: repoPath, verbose: options.verbose });
}

async function build(repo: RepoData, force = false): Promise<void> {
    LOGGER.info('Install & Build with yarn');
    await execAsync(`yarn ${force ? '--force' : ''}`, { silent: false, cwd: repo.path, errorMsg: 'Yarn build failed' });
    LOGGER.debug('Yarn build succeeded');
}
