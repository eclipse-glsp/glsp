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

import {
    LOGGER,
    baseCommand,
    cd,
    commitChanges,
    configureExec,
    configureLogger,
    createBranch,
    exec,
    getYarnWorkspacePackages,
    replaceInFile,
    validateGitDirectory,
    validateVersion
} from '../../util';
import { PrepReleaseOptions, asMvnVersion, deriveGLSPRepository } from './common';
import { prepareEclipseIntegrationRelease } from './release-eclipse-integration';
import { prepareJavaServerRelease } from './release-java-server';
import { prepareNPMRelease } from './release-npm-component';

interface PrepReleaseCmdOptions {
    verbose: boolean;
    repoDir: string;
    push: boolean;
}
configureLogger(true);
export const PrepReleaseCommand = baseCommand()
    .name('prepRelease')
    .description('Prepare a new release for a GLSP component (version bump, changelog ...')
    .argument('<version>', 'The version for the new release', validateVersion)
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('-r, --repoDir <repoDir>', 'Path to the  component repository', validateGitDirectory, process.cwd())
    .option('--no-push', 'Do not push changes to remote git repository', true)
    .action(prepareRelease);

async function prepareRelease(version: string, options: PrepReleaseCmdOptions): Promise<void> {
    try {
        configureLogger(options.verbose);
        configureExec({ silent: !options.verbose, verbose: options.verbose });
        cd(options.repoDir);

        const repo = deriveGLSPRepository(options.repoDir);
        if (!repo) {
            throw new Error(`The repository in ${options.repoDir} is not part of the GLSP project.`);
        }
        const prepOptions: PrepReleaseOptions = { ...options, repo, version };
        await doPrepareRelease(prepOptions);
    } catch (error) {
        PrepReleaseCommand.error(error instanceof Error ? error.message : String(error));
    }
}

async function doPrepareRelease(options: PrepReleaseOptions): Promise<void> {
    LOGGER.info(`Prepare release ${options.version} for ${options.repo} in ${options.repoDir}`);
    if (options.repo === 'glsp-server') {
        const mvnVersion = asMvnVersion(options.version);
        await prepareJavaServerRelease({ ...options, mvnVersion });
    } else if (options.repo === 'glsp-eclipse-integration') {
        const mvnVersion = asMvnVersion(options.version);
        await prepareEclipseIntegrationRelease({ ...options, mvnVersion });
    } else {
        const workspacePackages = getYarnWorkspacePackages(options.repoDir, true);
        if (workspacePackages.length === 0) {
            throw new Error(`No yarn workspace packages found in ${options.repoDir}`);
        }
        await prepareNPMRelease({ ...options, workspacePackages });
    }

    updateChangelog(options);
    commitAndPushChanges(options);
    LOGGER.info(`Release preparation for ${options.repo} done.`);
}

function updateChangelog(options: PrepReleaseOptions): void {
    LOGGER.info('Update changelog ...');
    const date = new Date().toLocaleDateString('en-GB');
    const linkUrl = `https://github.com/eclipse-glsp/${options.repo}/releases/tag/v${options.version}`;
    replaceInFile('CHANGELOG.md', `## v${options.version} - active`, `## [v${options.version} - ${date}](${linkUrl})`);
    LOGGER.debug('Changelog updated');
}

function commitAndPushChanges(options: PrepReleaseOptions): void {
    LOGGER.info('Commit changes ...');
    createBranch(releaseBranchName(options.version));
    commitChanges(`v${options.version}`, options.repoDir);
    if (options.push) {
        LOGGER.info('Push changes ...');
        // Push new branch
        const remote = 'origin';
        exec(`git push ${remote} ${releaseBranchName(options.version)}`);
    } else {
        LOGGER.info('Skipping push of changes to remote repository.');
    }
}

function releaseBranchName(version: string): string {
    return `release-v${version}`;
}
