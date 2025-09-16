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

import path from 'path';
import semver from 'semver';
import { LOGGER, PackageHelper, configureExec, configureLogger, exec, getRemoteUrl, readFile, readPackage } from '../../util';

export type GLSPRepo = (typeof GLSPRepo.choices)[number];
export namespace GLSPRepo {
    export const choices = [
        'glsp',
        'glsp-server-node',
        'glsp-client',
        'glsp-theia-integration',
        'glsp-vscode-integration',
        'glsp-eclipse-integration',
        'glsp-server',
        'glsp-playwright'
    ] as const;

    export function is(object: unknown): object is GLSPRepo {
        return typeof object === 'string' && choices.includes(object as GLSPRepo);
    }

    export function isNpmRepo(repo: string): boolean {
        return repo !== 'glsp-server' && repo !== 'glsp-eclipse-integration';
    }

    export function deriveFromDirectory(repoDir: string): GLSPRepo | undefined {
        const remoteUrl = getRemoteUrl(repoDir);
        const repo = remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1).replace('.git', '');
        if (!repo) {
            LOGGER.warn(`No git repository found in ${repoDir}`);
            return undefined;
        }
        if (!is(repo)) {
            return undefined;
        }
        return repo;
    }
}

export interface RelengOptions {
    verbose: boolean;
    repoDir: string;
    version: string;
    versionType: VersionType;
    repo: GLSPRepo;
}

export type RelengCmdOptions = Omit<RelengOptions, 'version' | 'repo' | 'versionType'>;

export function checkGHCli(): void {
    LOGGER.debug('Verify that Github CLI is configured correctly');
    if (!isGithubCLIAuthenticated()) {
        throw new Error("Github CLI is not configured properly. No user is logged in for host 'github.com'");
    }
}

export function isGithubCLIAuthenticated(): boolean {
    LOGGER.debug('Verify that Github CLI is installed');
    exec('which gh', { silent: true, errorMsg: 'Github CLI is not installed!' });

    try {
        exec('gh auth status');
    } catch (error) {
        LOGGER.warn('Github CLI authentication status could not be determined.');
        return false;
    }
    LOGGER.debug('Github CLI is authenticated and ready to use');
    return true;
}

export function configureEnv(options: RelengCmdOptions): void {
    configureLogger(options.verbose);
    configureExec({ silent: !options.verbose, verbose: options.verbose });
}

// Versioning

export type VersionType = (typeof VersionType.choices)[number];
export namespace VersionType {
    export const choices = ['major', 'minor', 'patch', 'custom', 'next'] as const;

    export function validate(versionType: string, customVersion?: string): void {
        LOGGER.debug(`Validate version type: ${versionType} with custom version: ${customVersion}`);
        if (versionType === 'custom' && !customVersion) {
            throw new Error('Custom version must be provided if version type is "custom".');
        }

        if (versionType !== 'custom' && customVersion) {
            console.warn('Warning: Custom version will be ignored since version type is not "custom".');
        }
    }

    export function deriveVersion(options: Omit<RelengOptions, 'version'>, customVersion?: string): string {
        const { versionType } = options;
        validate(versionType, customVersion);
        LOGGER.debug(`Derive version for version type: ${versionType} with custom version: ${customVersion}`);
        if (versionType === 'custom') {
            if (GLSPRepo.isNpmRepo(options.repo) && !semver.valid(customVersion)) {
                throw new Error(`Not a valid custom version: ${customVersion}`);
            }
            return customVersion!;
        }

        const currentVersion = getLocalVersion(options.repoDir, options.repo);
        return toNewVersion(currentVersion, versionType);
    }
}

export function npmVersionExists(packageName: string, version: string): boolean {
    try {
        const result = exec(`npm view ${packageName}@${version} version`, { silent: true }).trim();
        return result.trim() === version;
    } catch {
        return false;
    }
}

export function asMvnVersion(version: string): string {
    LOGGER.debug(`Convert to maven conform version: ${version}`);
    const mavenVersion = isNextVersion(version) ? version.replace('-next', '-SNAPSHOT') : version;
    LOGGER.debug(`Maven version :${mavenVersion}`);
    return mavenVersion;
}

export function checkIfMavenVersionExists(groupId: string, artifactId: string, newVersion: string): void {
    LOGGER.debug('Check if maven version exists');
    if (isExistingMavenVersion(groupId, artifactId, newVersion)) {
        throw new Error(`Version '${newVersion} is already present on maven central!`);
    }
    LOGGER.debug(`Version '${newVersion}' does not exist on maven central. Continue with release`);
}

export function isExistingMavenVersion(groupId: string, artifactId: string, version: string): boolean {
    const metadata = exec(`wget -q -O - https://repo1.maven.org/maven2/${groupId.replace(/\./g, '/')}/${artifactId}/maven-metadata.xml`, {
        silent: true
    });
    return metadata.includes(`<version>${version}</version>`);
}

export function getLocalVersion(repoDir: string, repo: GLSPRepo): string {
    if (repo === 'glsp-server') {
        return getVersionFromPom(repoDir);
    } else if (repo === 'glsp-eclipse-integration') {
        return getVersionFromPom(path.resolve(repoDir, 'server'));
    } else {
        return getVersionFromPackage(repoDir);
    }
}

export function getVersionFromPom(repoDir: string): string {
    const pom = readFile(path.resolve(repoDir, 'pom.xml'));
    const match = pom.match(/<version>(.*?)<\/version>/);
    if (!match) {
        throw new Error(`Could not find version in pom.xml of ${repoDir}`);
    }
    return match[1];
}

export function getVersionFromPackage(repoDir: string): string {
    // derive version from package.json of the root package
    const rootPkg = readPackage(path.resolve(repoDir, 'package.json'));
    const existingVersion = rootPkg.content.version;
    if (!existingVersion) {
        throw new Error(`No version found in package.json of ${repoDir}`);
    }
    return existingVersion;
}

function toNewVersion(version: string, versionType: Exclude<VersionType, 'custom'>): string {
    const newVersion =
        versionType === 'next'
            ? semver.inc(version, 'minor')?.concat('-next') //
            : semver.inc(version, versionType);
    if (!newVersion) {
        throw new Error(`Could not increment version: ${version} `);
    }
    return newVersion;
}

export function isNextVersion(version: string): boolean {
    return version.endsWith('-next') || version.endsWith('.SNAPSHOT');
}

export async function checkIfNpmVersionIsNew(pckgName: string, newVersion: string): Promise<void> {
    LOGGER.debug(`Check that the release version is new i.e. does not exist on npm: ${newVersion}`);

    const response = await fetch(`https://registry.npmjs.org/${pckgName}/${newVersion}`);
    const data = await response.json();
    if (typeof data === 'string' && data.includes('version not found:')) {
        LOGGER.debug(`Version '${newVersion}' does not exist on NPM.`);
        return;
    }
    throw new Error(`Version '${newVersion} is already present on NPM!}`);
}

export function getGLSPDependencies(pkg: PackageHelper): string[] {
    const deps = pkg.content.dependencies ? Object.keys(pkg.content.dependencies) : [];
    const devDeps = pkg.content.devDependencies ? Object.keys(pkg.content.devDependencies) : [];
    return [...deps, ...devDeps].filter(dep => dep.startsWith('@eclipse-glsp'));
}

/**
 * Returns the most recent release tag (excluding pre-releases and custom qualifier tags).
 * Only tags that start with 'v' followed by a semantic version (e.g. v1.0.0) are considered.
 * @param path The path to the git repository. If not provided, the current working directory is used.
 */
export function getLastReleaseTag(repoDir?: string): string | undefined {
    const tags = exec('git tag --list --sort=-v:refname', { cwd: repoDir }).split('\n');

    const lastTag = tags.find(tag => {
        if (!tag.startsWith('v')) {
            return false;
        }
        const version = tag.substring(1);
        return semver.valid(version) !== undefined && !semver.prerelease(version);
    });

    return lastTag;
}

export function getChangeLogChanges(options: Pick<RelengOptions, 'repoDir' | 'version' | 'repo'>): string {
    const version = options.version;
    const md = readFile('CHANGELOG.md');
    const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^## \\[v${escapedVersion}[^\\n]*\\n(?:^(?!## ).*\\n?)*`, 'gm');
    const match = md.match(regex);
    const previousTag = getLastReleaseTag(options.repoDir);
    if (!match) {
        throw new Error(`No changelog section found for version ${version}`);
    }
    // Remove header section and return only the content lines
    let content = match[0].trim().split('\n').splice(2).join('\n').trim();

    content = content.replace('###', '##'); // demote headings by one level
    if (previousTag) {
        content += `

**Full Changelog**: https://github.com/eclipse-glsp/${options.repo}/compare/${previousTag}...v${version}
`;
    }
    return content;
}
