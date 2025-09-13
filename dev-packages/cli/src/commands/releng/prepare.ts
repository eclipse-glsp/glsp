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

import { Argument } from 'commander';
import * as path from 'path';
import {
    LOGGER,
    PackageHelper,
    baseCommand,
    cd,
    commitChanges,
    createBranch,
    deleteFile,
    exec,
    execAsync,
    getDefaultBranch,
    getYarnWorkspacePackages,
    replaceInFile,
    validateGitDirectory,
    writeFile
} from '../../util';
import {
    GLSPRepo,
    RelengCmdOptions,
    RelengOptions,
    VersionType,
    checkGHCli,
    checkIfMavenVersionExists,
    configureEnv,
    getChangeLogChanges,
    getGLSPDependencies,
    isNextVersion,
    npmVersionExists
} from './common';
import { setVersion } from './version';

interface PrepareReleaseCmdOptions extends RelengCmdOptions {
    push: boolean;
    draft: boolean;
    check: boolean;
}
export const PrepareReleaseCommand = baseCommand()
    .name('prepare')
    .description('Prepare a new release for a GLSP component (version bump, changelog, PR creation ...)')
    .addArgument(new Argument('<versionType>', 'The version type').choices(VersionType.choices))
    .argument('[customVersion]', 'Custom version number. Will be ignored if the release type is not "custom"')
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('-r, --repoDir <repoDir>', 'Path to the  component repository', validateGitDirectory, process.cwd())
    .option('--no-push', 'Do not push changes to remote git repository', true)
    .option('-d, --draft', 'Create a draft pull request (only if push is enabled)', false)
    .option('--no-check', 'Skip initial checks for existing dependency versions', true)
    .action((versionType: VersionType, customVersion: string | undefined, cmdOptions: PrepareReleaseCmdOptions) => {
        configureEnv(cmdOptions);
        const repo = GLSPRepo.deriveFromDirectory(cmdOptions.repoDir);
        if (!repo) {
            throw new Error(`Could not derive GLSP repository from directory: ${cmdOptions.repoDir}`);
        }
        const version = VersionType.deriveVersion({ ...cmdOptions, repo, versionType }, customVersion);
        const options: PrepareReleaseOptions = { ...cmdOptions, repo, version, versionType };
        return prepareRelease(options);
    });

export interface PrepareReleaseOptions extends RelengOptions {
    push?: boolean;
    draft?: boolean;
    check?: boolean;
    workspacePackages?: PackageHelper[];
}

/**
 * Prepares a new release for a GLSP component (version bump, changelog ...).
 * @param options The options for preparing the release.
 */
export async function prepareRelease(options: PrepareReleaseOptions): Promise<void> {
    LOGGER.info(`Prepare release ${options.version} for ${options.repo} in ${options.repoDir}`);
    LOGGER.debug('Options:', options);
    if (options.push) {
        checkGHCli();
    }
    cd(options.repoDir);
    if (GLSPRepo.isNpmRepo(options.repo)) {
        options.workspacePackages = getYarnWorkspacePackages(options.repoDir, true);
    }
    if (options.check) {
        checkPreconditions(options);
    }
    await setVersion(options);
    updateChangelog(options);
    await build(options);
    commitAndPushChanges(options);
    createReleasePR(options);
}

function checkPreconditions(options: PrepareReleaseOptions): void {
    LOGGER.info('Check preconditions ...');
    if (options.versionType === 'next') {
        LOGGER.debug("Skipping version existence check for 'next' version");
        return;
    }
    if (options.workspacePackages) {
        const workspacePackageNames = new Set(options.workspacePackages.map(pkg => pkg.name));
        for (const pkg of options.workspacePackages) {
            if (!pkg.content.private) {
                LOGGER.info(`Ensure that version ${options.version} does not exist on npm for package ${pkg.name}`);
                if (npmVersionExists(pkg.name, options.version)) {
                    throw new Error(`Version '${options.version}' already exists for package '${pkg.name}'!`);
                }
            }
            const glspDeps = getGLSPDependencies(pkg).filter(dep => !workspacePackageNames.has(dep));
            for (const dep of glspDeps) {
                LOGGER.info(`Ensure that dependency ${dep}@${options.version} does exist on npm`);
                if (!npmVersionExists(dep, options.version)) {
                    throw new Error(`Dependency '${dep}@${options.version}' does not exist on npm!`);
                }
            }
        }
    } else if (options.repo === 'glsp-server') {
        LOGGER.info(`Ensure that version ${options.version} does not exist for glsp-server`);
        checkIfMavenVersionExists('org.eclipse.glsp', 'org.eclipse.glsp.parent', options.version);
    } else if (options.repo === 'glsp-eclipse-integration') {
        LOGGER.info(`Ensure that version ${options.version} does not exist for glsp-eclipse-integration`);
        try {
            exec(`wget -q -O - https://download.eclipse.org/glsp/ide/p2/releases/${options.version}/p2.index`);
        } catch (err) {
            // Expected to fail if the version does not exist
            return;
        }
        throw new Error(`Version '${options.version}' already exists in the p2 repository!`);
    }
}

async function build(options: PrepareReleaseOptions): Promise<void> {
    if (GLSPRepo.isNpmRepo(options.repo)) {
        return buildNpm(options);
    } else if (options.repo === 'glsp-server') {
        return buildJavaServer(options);
    } else if (options.repo === 'glsp-eclipse-integration') {
        return buildEclipseIntegration(options);
    }
}

async function buildNpm(options: PrepareReleaseOptions): Promise<void> {
    LOGGER.info('Install & Build with yarn');
    await execAsync('yarn', { silent: false, cwd: options.repoDir, errorMsg: 'Yarn build failed' });
    LOGGER.debug('Yarn build succeeded');
}

async function buildJavaServer(options: PrepareReleaseOptions): Promise<void> {
    LOGGER.info('Build M2 & P2');
    LOGGER.debug('M2');
    await execAsync('mvn clean install -Pm2', { silent: false, cwd: options.repoDir, errorMsg: 'M2 build failed' });
    LOGGER.newLine();
    LOGGER.debug('P2');
    await execAsync('mvn clean install -Pp2', { silent: false, cwd: options.repoDir, errorMsg: 'P2 build failed' });
    LOGGER.debug('Build succeeded');
}

async function buildEclipseIntegration(options: PrepareReleaseOptions): Promise<void> {
    LOGGER.info('[Client] Install & Build with yarn');
    // await execAsync('yarn', { silent: false, cwd: path.resolve(options.repoDir, 'client'), errorMsg: 'Client build failed' });
    LOGGER.newLine();
    LOGGER.info('Build Server(P2)');
    await execAsync('mvn clean install', { silent: false, cwd: path.resolve(options.repoDir, 'server'), errorMsg: 'Server build failed' });
    LOGGER.debug('Build successful');
}

function updateChangelog(options: PrepareReleaseOptions): void {
    LOGGER.info('Update changelog ...');
    if (!isNextVersion(options.version)) {
        // Replace the "active" next version entry with the actual release version and date
        const date = new Date().toLocaleDateString('en-GB');
        const linkUrl = `https://github.com/eclipse-glsp/${options.repo}/releases/tag/v${options.version}`;
        replaceInFile('CHANGELOG.md', `## v${options.version} - active`, `## [v${options.version} - ${date}](${linkUrl})`);
    } else {
        LOGGER.debug("Add a new 'next' version after the header");
        const nextSection = `
## v${options.version.replace('-next', '')} - active

### Changes

### Potentially Breaking Changes`;
        replaceInFile('CHANGELOG.md', /^# .+$/m, `$&\n${nextSection}`);
    }
    LOGGER.debug('Changelog updated');
}

function commitAndPushChanges(options: PrepareReleaseOptions): void {
    LOGGER.info('Commit changes ...');
    const branchName = isNextVersion(options.version) ? `nightly-${options.version}` : `release-v${options.version}`;
    const commitMsg = isNextVersion(options.version) ? `Switch to nightly ${options.version} versions` : `v${options.version}`;
    createBranch(branchName);
    commitChanges(commitMsg, options.repoDir);
    if (options.push) {
        LOGGER.info('Push changes ...');
        // Push new branch
        const remote = 'origin';
        exec(`git push ${remote} ${branchName}`);
    } else {
        LOGGER.info('Skipping push of changes to remote repository.');
    }
}

function createReleasePR(options: PrepareReleaseOptions): void {
    if (options.push) {
        LOGGER.info('Create release pull request ...');
        const base = getDefaultBranch(options.repoDir);

        const changes = isNextVersion(options.version) ? '' : getChangeLogChanges(options);
        const header = isNextVersion(options.version)
            ? `Switch to nightly ${options.version} versions`
            : `Prepare release v${options.version}`;
        const body = `${header}

${changes}

Note: This pull request was created automatically. After merging, the automated publishing process will be started.
`;
        const bodyFile = 'pr_body.txt';
        const prTitle = isNextVersion(options.version) ? `Switch to nightly ${options.version} versions` : `Release v${options.version}`;
        writeFile(bodyFile, body);
        // Create pull request

        let ghCommand = `gh pr create --title "${prTitle}" --body-file ${bodyFile} --base ${base}`;
        if (options.draft) {
            ghCommand = ghCommand.concat(' --draft');
            LOGGER.debug('Create draft pull request');
        }
        exec(ghCommand);
        deleteFile(bodyFile);
        LOGGER.info('Pull request created');
    } else {
        LOGGER.info('Skipping creation of pull request.');
    }
}
