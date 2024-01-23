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

import * as fs from 'fs';
import fetch from 'node-fetch';
import { resolve } from 'path';
import * as readline from 'readline-sync';
import * as semver from 'semver';
import * as sh from 'shelljs';
import { fatalExec, getShellConfig } from '../../util/command-util';
import { getLatestGithubRelease, getLatestTag, hasGitChanges, isGitRepository } from '../../util/git-util';
import { LOGGER } from '../../util/logger';
import { validateVersion } from '../../util/validation-util';

export const VERDACCIO_REGISTRY = 'http://localhost:4873/';

export interface ReleaseOptions {
    component: Component;
    releaseType: ReleaseType;
    version: string;
    checkoutDir: string;
    branch: string;
    verbose: boolean;
    force: boolean;
    publish: boolean;
    npmDryRun: boolean;
    draft: boolean;
}

export type ReleaseRepository = 'npm' | 'm2' | 'm2&p2' | 'p2';

export interface Component {
    type: (typeof Component.CLI_CHOICES)[number];
    releaseRepo: ReleaseRepository;
    githubRepo: string;
    directory: string;
}
export namespace Component {
    export const CLIENT: Component = {
        type: 'client',
        githubRepo: 'eclipse-glsp/glsp-client',
        releaseRepo: 'npm',
        directory: 'glsp-client'
    };
    export const THEIA_INTEGRATION: Component = {
        type: 'theia-integration',
        githubRepo: 'eclipse-glsp/glsp-theia-integration',
        releaseRepo: 'npm',
        directory: 'glsp-theia-integration'
    };
    export const VSCODE_INTEGRATION: Component = {
        type: 'vscode-integration',
        githubRepo: 'eclipse-glsp/glsp-vscode-integration',
        releaseRepo: 'npm',
        directory: 'glsp-vscode-integration'
    };
    export const SERVER_NODE: Component = {
        type: 'server-node',
        githubRepo: 'eclipse-glsp/glsp-server-node',
        releaseRepo: 'npm',
        directory: 'serer-node'
    };
    export const SERVER_JAVA: Component = {
        type: 'server-java',
        githubRepo: 'eclipse-glsp/glsp-server',
        releaseRepo: 'm2&p2',
        directory: 'glsp-server'
    };
    export const ECLIPSE_INTEGRATION: Component = {
        type: 'eclipse-integration',
        githubRepo: 'eclipse-glsp/glsp-eclipse-integration',
        releaseRepo: 'm2',
        directory: 'glsp-eclipse-integration'
    };

    export const ALL: Component[] = [CLIENT, THEIA_INTEGRATION, VSCODE_INTEGRATION, ECLIPSE_INTEGRATION, SERVER_JAVA, SERVER_NODE];
    export const CLI_CHOICES = [
        'client',
        'theia-integration',
        'vscode-integration',
        'eclipse-integration',
        'server-node',
        'server-java'
    ] as const;

    export function parse(cliChoice: string): Component {
        const key = cliChoice.toUpperCase().replace('-', '_');
        const component: Component = (Component as any)[key];
        if (!component) {
            throw new Error(`Could not parse component for type: ${cliChoice}`);
        }
        return component;
    }

    export function is(object: any): object is Component {
        return typeof object === 'object' && typeof object.type === 'string';
    }
}

export namespace ReleaseType {
    export const CLI_CHOICES = ['major', 'minor', 'patch', 'rc', 'custom'] as const;
}

export type ReleaseType = (typeof ReleaseType.CLI_CHOICES)[number];

export function checkoutAndCd(options: ReleaseOptions): string {
    const ghUrl = options.component.githubRepo;
    LOGGER.info(`Clone repository '${ghUrl}' to directory: ${options.checkoutDir}`);
    sh.cd(options.checkoutDir);
    const directory = ghUrl.substring(ghUrl.lastIndexOf('/') + 1);
    const repoPath = resolve(options.checkoutDir, directory);
    if (fs.existsSync(resolve(options.checkoutDir, directory))) {
        if (options.force) {
            LOGGER.debug('A directory with the checkout name already exists.');
            LOGGER.debug('Force mode is enabled. The directory will be removed');
            fatalExec(`rm -rf ${repoPath}`, `Could not remove directory: ${repoPath}`);
        } else {
            throw new Error('Directory with the checkout name already exists.');
        }
    }
    sh.exec(`gh repo clone ${ghUrl}`, getShellConfig());
    LOGGER.debug(`Successfully cloned to ${directory}`);
    sh.cd(directory);
    if (options.branch !== 'master' && options.branch !== 'main') {
        sh.exec(`git checkout ${options.branch} `);
    }
    return sh.pwd();
}

export function commitAndTag(version: string, repositoryPath: string): string {
    LOGGER.info('Commit changes and create new tag');
    sh.cd(repositoryPath);

    LOGGER.debug('Check wether the given url is a git repository');
    if (!isGitRepository(sh.pwd())) {
        throw new Error(`The given path is not a git repository: ${repositoryPath}`);
    }
    const tag = `v${version}`;
    LOGGER.debug(`Create tag with label: ${tag}}`);
    sh.exec(`git checkout -b ${tag}`, getShellConfig());
    sh.exec('git add .', getShellConfig());
    sh.exec(`git commit -m "${tag}"`, getShellConfig());
    sh.exec(`git tag ${tag}`, getShellConfig());
    return tag;
}

export function publish(repositoryPath: string, options: ReleaseOptions): void {
    if (!options.publish || options.npmDryRun) {
        LOGGER.info('Skip publishing to Github');
        if (options.npmDryRun && options.component.releaseRepo === 'npm') {
            fatalExec(
                'lerna publish from-git --no-git-reset --no-git-tag-version --no-verify-access --no-push --dist-tag rc --yes',
                'Dry-run publish failed',
                { silent: false }
            );
        }
        return;
    }
    LOGGER.info(`Publish new GH release ${options.draft ? '[DRAFT]' : ''}`);
    sh.cd(repositoryPath);
    if (!options.force && hasGitChanges()) {
        throw new Error('Publish failed. The repository has pending changes');
    }

    const latestReleaseTag = getLatestGithubRelease();
    const localTag = getLatestTag();
    validateTag(latestReleaseTag, localTag);
    const preRelease = options.releaseType === 'rc' || localTag.includes('-');
    doPublish(localTag, preRelease, latestReleaseTag, options.draft);
}

function doPublish(tag: string, preRelease: boolean, latestRelease: string, draft: boolean): void {
    fatalExec(`git push origin HEAD:${tag}`, 'Could not push release branch to Github', getShellConfig({ silent: false }));
    fatalExec(`git push origin tag ${tag}`, 'Could not push tag to Github', getShellConfig({ silent: false }));
    const version = tagToVersion(tag);
    const titleSuffix = preRelease ? ` Candidate ${version.substring(version.lastIndexOf('-RC') + 3)}` : '';
    const title = `${version.replace(/-.*/, '')} Release${titleSuffix} `;
    sh.exec(
        `gh release create ${tag} -t "${title}" --notes-start-tag ${latestRelease} --generate-notes ${draft ? '-d' : ''} ${
            preRelease ? '-p' : ''
        }`,
        getShellConfig()
    );
}

function validateTag(currentReleaseTag: string, newTag: string): void {
    const releaseVersion = tagToVersion(currentReleaseTag);
    const newVersion = tagToVersion(newTag);
    if (!semver.satisfies(newVersion, `>${releaseVersion}`, { includePrerelease: true })) {
        throw new Error(`Tag version is lower than the current release: ${newTag} `);
    }
}

function tagToVersion(tag: string): string {
    if (!tag.startsWith('v')) {
        throw new Error(`Invalid format. The release tag should start with 'v':  ${tag}`);
    }
    const version = tag.substring(1).replace('.RC', '-RC');
    return validateVersion(version);
}

export function lernaSetVersion(repositoryPath: string, version: string): void {
    LOGGER.info(`Bump version in ${repositoryPath} to: ${version}`);
    sh.cd(repositoryPath);
    fatalExec(`lerna version --exact  ${version} --ignore-scripts --yes --no-push --no-git-tag-version`, 'Lerna version bump failed!', {
        silent: false
    });
    LOGGER.debug('Update root package.json version');
    sh.exec(`jq '.version="${version}"' package.json > temp.json`, getShellConfig());
    sh.exec('mv temp.json package.json ', getShellConfig());
}

export function yarnInstall(repositoryPath: string): void {
    LOGGER.debug(`Build ${repositoryPath}`);
    sh.cd(repositoryPath);
    fatalExec('yarn', 'Yarn build failed', getShellConfig({ silent: false }));
}

export function upgradeCommand(pckName: string, version: string): string {
    LOGGER.debug(`Upgrade '${pckName}' to version ${version}`);
    return `lernaupdate --non-interactive  --dependency ${pckName}@${version}`;
}

export function updateVersion(...packages: { name: string; version: string }[]): void {
    packages.forEach(pckg => {
        const result = sh.exec(upgradeCommand(pckg.name, pckg.version), getShellConfig({ silent: false })).stdout.trim();
        if (result.includes('An error occurred:')) {
            const errorMsg = result.substring(result.lastIndexOf('An error occurred:')).trim();
            throw new Error(errorMsg);
        }
    });
}

export function asMvnVersion(version: string): string {
    LOGGER.debug(`Convert to maven conform version: ${version}`);
    const mavenVersion = version.replace('-', '.');
    LOGGER.debug(`Maven version :${mavenVersion}`);
    return mavenVersion;
}

export async function checkIfNpmVersionIsNew(pckgName: string, newVersion: string): Promise<void> {
    LOGGER.debug(`Check that the release version is new i.e. does not exist on npm: ${newVersion}`);

    const response = await fetch(`https://registry.npmjs.org/${pckgName}/${newVersion}`);
    const data = await response.json();
    if (typeof data === 'string' && data.includes('version not found:')) {
        LOGGER.debug(`Version '${newVersion}' does not exist on NPM. Continue with release`);
        return;
    }
    throw new Error(`Version '${newVersion} is already present on NPM!}`);
}

export function checkIfMavenVersionExists(groupId: string, artifactId: string, newVersion: string): void {
    LOGGER.debug('Check if maven version exists');
    if (isExistingMavenVersion(groupId, artifactId, newVersion)) {
        throw new Error(`Version '${newVersion} is already present on maven central!}`);
    }
    LOGGER.debug(`Version '${newVersion}' does not exist on maven central. Continue with release`);
}

export function isExistingMavenVersion(groupId: string, artifactId: string, version: string): boolean {
    const versions = sh
        .exec(
            `wget -q -O - https://repo1.maven.org/maven2/${groupId.replace(/\./g, '/')}/${artifactId}/maven-metadata.xml`,
            getShellConfig()
        )
        .exec("grep -P '<version>\\K[^<]*'", getShellConfig())
        .stdout.replace(/<\/?version>/g, '')
        .split('\n')
        .map(versionString => versionString.trim());
    LOGGER.debug(`${versions.length} released versions found:`, versions);
    return versions.includes(version);
}

export function checkJavaServerVersion(version: string, force = false): void {
    const mvnVersion = asMvnVersion(version);
    if (!isExistingMavenVersion('org.eclipse.glsp', 'org.eclipse.glsp.server', mvnVersion)) {
        // eslint-disable-next-line max-len
        const errorMsg = `No Java GLSP server with version ${mvnVersion} found on maven central!. Please release a new Java GLSP Server version before publishing this release!`;
        LOGGER.warn(errorMsg);
        if (force || readline.keyInYN('No Java GLSP server with corresponding version found. Do you want to continue anyways?')) {
            return;
        }
        throw new Error(errorMsg);
    }
}

export function updateLernaForDryRun(): void {
    LOGGER.debug('Update lerna.json to use local publish registry');
    sh.exec(`jq '.command.publish.registry="${VERDACCIO_REGISTRY}"' lerna.json > temp.json`, getShellConfig());
    sh.exec('mv temp.json lerna.json', getShellConfig());
    sh.exec(`npm set registry ${VERDACCIO_REGISTRY}`);
}
