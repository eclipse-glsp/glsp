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

import { LOGGER, PackageHelper, execAsync, readFile, readJson, writeFile, writeJson } from '../../util';
import { NpmPrepReleaseOptions, isNpmRepo, npmVersionExists } from './common';

export async function prepareNPMRelease(options: NpmPrepReleaseOptions): Promise<void> {
    if (!isNpmRepo(options.repo)) {
        throw new Error(`The prepare-npm-release command is not supported for the ${options.repo} repository.`);
    }
    checkNPMVersions(options);
    bumpVersion(options);
    applyRepoSpecificChanges(options);
    await build(options);
}

function checkNPMVersions(options: NpmPrepReleaseOptions): void {
    LOGGER.info(`Ensure that version ${options.version} of ${options.repo} does not exist on npm ...`);
    options.workspacePackages
        .filter(pkg => !pkg.content.private)
        .forEach(pkg => {
            LOGGER.info(`Check npm for package ${pkg.name} ...`);
            if (npmVersionExists(pkg.name, options.version)) {
                throw new Error(`Version ${options.version} of package ${pkg.name} already exists on npm!`);
            }
        });
}

function bumpVersion(options: NpmPrepReleaseOptions): void {
    options.workspacePackages.forEach(pkg => {
        LOGGER.info(`Bump version of package ${pkg.name} to ${options.version}`);
        pkg.content.version = options.version;
        updateGLSPDependencies(pkg, options.version);
        pkg.write();
    });

    // Update lerna file
    const lernaJson = readJson<{ version: string }>('lerna.json');
    lernaJson.version = options.version;
    writeJson('lerna.json', lernaJson);

    LOGGER.info(`Bumped version to ${options.version} in ${options.workspacePackages.length} packages`);
}

function updateGLSPDependencies(pkg: PackageHelper, version: string): void {
    LOGGER.debug(`Bump version of package ${pkg.name} to ${version}`);
    pkg.content.version = version;
    // bump  glsp dependencies and devDependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
        if (pkg.content[depType]) {
            Object.keys(pkg.content[depType] || {})
                .filter(dep => dep.startsWith('@eclipse-glsp'))
                .forEach(dep => {
                    LOGGER.debug(` - Bump ${depType} ${dep} to version ${version}`);
                    pkg.content[depType]![dep] = `${version}`;
                });
        }
    });
    pkg.write();
}

export function applyRepoSpecificChanges(options: NpmPrepReleaseOptions): void {
    LOGGER.info(`Apply repository specific changes for ${options.repo} ...`);
    switch (options.repo) {
        case 'glsp-theia-integration':
            checkAndUpdateTheiaReadmes(options);
            break;
        default: {
            LOGGER.debug(`No specific changes for ${options.repo}`);
            break;
        }
    }
}

async function build(options: NpmPrepReleaseOptions): Promise<void> {
    LOGGER.info('Install & Build with yarn');
    await execAsync('yarn', { silent: false, cwd: options.repoDir, errorMsg: 'Yarn build failed' });
    LOGGER.debug('Yarn build succeeded');
}

export function checkAndUpdateTheiaReadmes(options: NpmPrepReleaseOptions): void {
    checkAndUpdateTheiaReadme('README.md', options);
    checkAndUpdateTheiaReadme('packages/theia-integration/README.md', options);
}

export function checkAndUpdateTheiaReadme(readmePath: string, options: NpmPrepReleaseOptions): void {
    const readme = readFile(readmePath);

    const sectionRegex = /## Theia Version Compatibility([\s\S]*?)### Potential Compatibility Issues/;
    const match = readme.match(sectionRegex);
    if (!match) {
        throw new Error('Could not find Theia Version Compatibility section in main README.md');
    }

    const sectionLines = match[0].trim().split('\n');
    const nextLine = sectionLines.find(line => line.includes('| next'));

    if (nextLine === undefined) {
        throw new Error('Could not find "next" entry in Theia Version Compatibility section of main README.md');
    }

    if (!sectionLines.find(l => l.startsWith(`| ${options.version} `))) {
        LOGGER.info(`Add entry for version ${options.version} to Theia Version Compatibility section in ${readmePath}`);
        const nextLineIndex = sectionLines.indexOf(nextLine);
        // Add new line after the "next" line
        sectionLines.splice(nextLineIndex + 1, 0, nextLine.replace('next ', options.version));
        const newSection = sectionLines.join('\n');
        const newReadme = readme.replace(sectionRegex, newSection);
        writeFile(readmePath, newReadme);
    }
}
