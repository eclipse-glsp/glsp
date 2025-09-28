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

import { LOGGER, baseCommand, cd, exec, execAsync, getLastCommitMessage, readFile, validateGitDirectory } from '../../util';
import { GLSPRepo } from '../common';
import { RelengCmdOptions, checkGHCli, configureEnv, getChangeLogChanges, getLocalVersion } from './common';

interface PublishCmdOptions extends RelengCmdOptions {
    npm: boolean;
    draft: boolean;
}

export const PublishCommand = baseCommand()
    .name('publish')
    .description('Publish a new release for a GLSP component (npm, maven, github ...)')
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('-r, --repoDir <repoDir>', 'Path to the component repository', validateGitDirectory, process.cwd())
    .option('--no-npm', 'Skip npm publishing', true)
    .option('-d, --draft', 'Create a draft GitHub release', false)
    .action((options: PublishCmdOptions) => {
        configureEnv(options);
        const repo = GLSPRepo.deriveFromDirectory(options.repoDir);
        if (!repo) {
            throw new Error(`Cannot derive GLSP repository from directory ${options.repoDir}`);
        }

        const version = getLocalVersion(options.repoDir, repo);
        publish({ ...options, repo, version });
    });

interface PublishOptions extends PublishCmdOptions {
    repo: GLSPRepo;
    version: string;
}

async function publish(options: PublishOptions): Promise<void> {
    cd(options.repoDir);
    LOGGER.info('Publish new release for repository', options.repo);
    LOGGER.debug('Options:', options);
    validateCurrentState(options);
    createTag(options);
    publishGHRelease(options);
    await publishNpm(options);
    LOGGER.info('Release process completed successfully.');
}

function validateCurrentState(options: PublishOptions): void {
    LOGGER.info('Validate if repository is in a release state ...');
    LOGGER.debug(`Validate local repository version: ${options.repoDir}`);
    const version = options.version;
    checkGHCli();
    if (version.includes('-')) {
        throw new Error(`Cannot publish non-release version: ${version}`);
    }

    LOGGER.debug('Validate last commit message');
    const lastCommitMessage = getLastCommitMessage(options.repoDir);
    if (!lastCommitMessage.includes(`v${version}`)) {
        throw new Error(`Last commit message is not the correct release message: ${lastCommitMessage}`);
    }

    LOGGER.debug('Validate changelog');
    const changelog = readFile('CHANGELOG.md');
    if (!changelog.includes('## [v2.5.0')) {
        throw new Error(`CHANGELOG.md does not contain an entry for version ${version}`);
    }

    LOGGER.debug('Ensure that we are logged in to npm');
    if (options.npm) {
        exec('npm whoami', { silent: true, errorMsg: 'Not logged in to npm! Please run "npm login"' });
    }

    LOGGER.info('Validation successful. Repository is in a releasable state.');
}

function createTag(options: PublishOptions): void {
    LOGGER.info('Create git tag ...');
    const version = options.version;
    exec(`git tag -a v${version} -m "Release v${version}"`, { errorMsg: 'Failed to create git tag' });
    exec('git push origin tag v${version}', { errorMsg: 'Failed to push tag to origin' });
    LOGGER.info(`Created and pushed git tag v${version}`);
}

function publishGHRelease(options: PublishOptions): void {
    LOGGER.info('Publish GitHub release ...');
    const changeLog = getChangeLogChanges(options);
    const draft = options.draft ? '--draft' : '';
    // eslint-disable-next-line max-len
    exec(
        `gh release create v${options.version} ${draft} --title "v${options.version}" --notes "${changeLog
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')}"`,
        {
            errorMsg: 'Failed to create GitHub release'
        }
    );
    LOGGER.info(`Created GitHub release v${options.version}`);
}

async function publishNpm(options: PublishOptions): Promise<void> {
    if (!options.npm) {
        LOGGER.info('Skipping npm publish');
        return;
    }
    if (!GLSPRepo.isNpmRepo(options.repo)) {
        LOGGER.info(`Skipping npm publish for repository ${options.repo}`);
        return;
    }

    LOGGER.info('Publish new npm version ...');
    await execAsync('lerna publish from-package --no-git-reset -y', { errorMsg: 'Failed to publish new npm version' });
    LOGGER.info(`Published new npm version ${options.version}`);
}
