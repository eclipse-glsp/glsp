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

import { LOGGER, PackageHelper, exec, getRemoteUrl } from '../../util';

export type GLSPRepo = (typeof GLSPRepo)[number];
export const GLSPRepo = [
    'glsp',
    'glsp-server-node',
    'glsp-client',
    'glsp-theia-integration',
    'glsp-vscode-integration',
    'glsp-eclipse-integration',
    'glsp-server',
    'glsp-playwright'
] as const;

export function isGLSPRepo(repo: string): repo is GLSPRepo {
    return GLSPRepo.includes(repo as GLSPRepo);
}

export function isNpmRepo(repo: string): boolean {
    return repo !== 'glsp-server' && repo !== 'glsp-eclipse-integration';
}

export function deriveGLSPRepository(repoDir: string): GLSPRepo | undefined {
    const remoteUrl = getRemoteUrl(repoDir);
    const repo = remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1).replace('.git', '');
    if (!repo) {
        throw new Error(`No git repository found in ${repoDir}`);
    }
    if (!isGLSPRepo(repo)) {
        return undefined;
    }
    return repo;
}

interface PrepReleaseCmdOptions {
    verbose: boolean;
    repoDir: string;
    push: boolean;
}

export interface PrepReleaseOptions extends PrepReleaseCmdOptions {
    version: string;
    repo: GLSPRepo;
}

export interface NpmPrepReleaseOptions extends PrepReleaseOptions {
    workspacePackages: PackageHelper[];
}

export interface MvnPrepReleaseOptions extends PrepReleaseOptions {
    mvnVersion: string;
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
    const mavenVersion = version.replace('-', '.');
    LOGGER.debug(`Maven version :${mavenVersion}`);
    return mavenVersion;
}

export function asNpmVersion(version: string): string {
    LOGGER.debug(`Convert potential maven version to npm conform version: ${version}`);
    const split = version.split('.');
    let npmVersion = version;
    if (split.length > 3) {
        npmVersion = `${split[0]}.${split[1]}.${split[2]}-${split.slice(3).join('.')}`;
        return npmVersion;
    }
    LOGGER.debug(`NPM version :${npmVersion}`);
    return npmVersion;
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
