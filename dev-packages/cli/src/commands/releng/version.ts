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
import * as semver from 'semver';
import {
    LOGGER,
    PackageHelper,
    baseCommand,
    cd,
    exec,
    execAsync,
    findFiles,
    getYarnWorkspacePackages,
    readFile,
    readJson,
    replaceInFile,
    validateGitDirectory,
    writeJson
} from '../../util';
import { GLSPRepo } from '../common';
import { RelengCmdOptions, RelengOptions, VersionType, asMvnVersion, configureEnv, isNextVersion } from './common';
interface SetVersionsCmdOptions extends RelengCmdOptions {}

export const VersionCommand = baseCommand()
    .name('version')
    .description('Set the version of all packages in a GLSP repository')
    .addArgument(new Argument('<versionType>', 'The version type').choices(VersionType.choices))
    .argument('[customVersion]', 'Custom version number. Will be ignored if the release type is not "custom"')
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('-r, --repoDir <repoDir>', 'Path to the component repository', validateGitDirectory, process.cwd())
    .action((versionType: VersionType, customVersion: string | undefined, cmdOptions: SetVersionsCmdOptions) => {
        configureEnv(cmdOptions);
        const repo = GLSPRepo.deriveFromDirectory(cmdOptions.repoDir);
        if (!repo) {
            throw new Error(`Could not derive GLSP repository from directory: ${cmdOptions.repoDir}`);
        }
        const version = VersionType.deriveVersion({ ...cmdOptions, repo, versionType }, customVersion);
        const options = { ...cmdOptions, repo, version, versionType };
        let workspacePackages: PackageHelper[] | undefined;
        if (GLSPRepo.isNpmRepo(repo)) {
            workspacePackages = GLSPRepo.isNpmRepo(repo) ? getYarnWorkspacePackages(path.join(cmdOptions.repoDir, ''), true) : undefined;
        }
        return setVersion({ ...options, workspacePackages });
    });

export interface SetVersionOptions extends RelengOptions {
    workspacePackages?: PackageHelper[];
}

interface NpmSetVersionOptions extends SetVersionOptions {
    workspacePackages: PackageHelper[];
}

interface JavaSetVersionOptions extends SetVersionOptions {
    mvnVersion: string;
}
/**
 * Applies the necessary changes to set the version of all packages in a GLSP repository.
 * The changes are made in the local git repository located at `options.repoDir`.
 * @param options The release options
 * @param write Whether to write the changes to the files. If false, only apply the changes in memory.
 * @returns A promise that resolves when the operation is complete
 */
export async function setVersion(options: SetVersionOptions): Promise<void> {
    cd(options.repoDir);
    LOGGER.info(`Set version to ${options.version} in repository ${options.repo} located at ${options.repoDir}`);
    LOGGER.debug('Options:', options);
    if (options.workspacePackages !== undefined) {
        setVersionNpm(options as NpmSetVersionOptions);
    } else if (options.repo === 'glsp-server') {
        return setVersionJavaServer({ ...options, mvnVersion: asMvnVersion(options.version) });
    } else if (options.repo === 'glsp-eclipse-integration') {
        return setVersionEclipseIntegration({ ...options, mvnVersion: asMvnVersion(options.version) });
    }
}

/*
 * NPM repos update functions
 */

function setVersionNpm(options: NpmSetVersionOptions): void {
    const workspacePackageNames = new Set(options.workspacePackages.map(p => p.name));
    options.workspacePackages.forEach(pkg => {
        LOGGER.info(`Bump version of package ${pkg.name} to ${options.version}`);
        pkg.content.version = options.version;
        updateGLSPDependencies(pkg, options.version, workspacePackageNames);

        pkg.write();
    });

    // Update lerna file
    const lernaJson = readJson<{ version: string }>('lerna.json');
    lernaJson.version = options.version;
    writeJson('lerna.json', lernaJson);

    // Repo specific changes
    if (options.repo === 'glsp-theia-integration') {
        checkAndUpdateTheiaReadmes(options);
    }

    LOGGER.info(`Bumped version to ${options.version} in ${options.workspacePackages.length} packages`);
}

function updateGLSPDependencies(pkg: PackageHelper, version: string, workspacePackageNames: Set<string>): void {
    LOGGER.debug(`Bump version of package ${pkg.name} to ${version}`);
    pkg.content.version = version;
    // bump  glsp dependencies and devDependencies
    ['dependencies', 'devDependencies'].forEach(depType => {
        if (pkg.content[depType]) {
            Object.keys(pkg.content[depType] || {})
                .filter(dep => workspacePackageNames.has(dep) || dep.startsWith('@eclipse-glsp'))
                .forEach(dep => {
                    if (workspacePackageNames.has(dep) || !isNextVersion(version)) {
                        LOGGER.debug(` - Bump ${depType} ${dep} to version ${version}`);
                        pkg.content[depType]![dep] = `${version}`;
                    } else {
                        LOGGER.debug(` - Set ${depType} ${dep} to version 'next'`);
                        pkg.content[depType]![dep] = 'next';
                    }
                });
        }
    });
}

function checkAndUpdateTheiaReadmes(options: NpmSetVersionOptions): void {
    // Check compatibility table in main README
    LOGGER.info('Update Theia README.md files');
    LOGGER.debug('Check compatibility table in main README.md');
    const readme = readFile('README.md');
    const sectionRegex = /(^\| @eclipse-glsp\/theia-integrati.*\|(?:\r?\n\|.*\|)+)/m;
    const match = readme.match(sectionRegex);
    if (!match) {
        throw new Error('Could not find Theia Version Compatibility section in main README.md');
    }

    const version = isNextVersion(options.version) ? 'next' : options.version;
    const tableLines = match[0].split('\n').splice(2); // Skip header lines
    if (tableLines.find(line => line.includes(version))) {
        LOGGER.debug('Theia version matrix in README.md is up-to-date');
        return;
    }

    LOGGER.debug('Theia version matrix in README.md is outdated. Update ...');
    // Update & regenerate table
    const rows = tableLines
        .map(line => {
            const m = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|/);
            return m ? { version: m[1], range: m[2] } : undefined;
        })
        .filter((row): row is { version: string; range: string } => !!row);

    const minimalTheiaVersion = options.workspacePackages.find(p => p.name === '@eclipse-glsp/theia-integration')?.content
        .peerDependencies?.['@theia/core'];

    if (!minimalTheiaVersion) {
        throw new Error('Could not find @theia/core peer dependency in @eclipse-glsp/theia-integration package');
    }
    rows.push({ version: version, range: `>= ${minimalTheiaVersion.replace(/[~^]/, '')}` });
    const combatTable = createTheiaCompatTable(rows);
    LOGGER.debug('Updated Theia compatibility table:\n' + combatTable);

    replaceInFile('README.md', sectionRegex, combatTable);
    replaceInFile('packages/theia-integration/README.md', sectionRegex, combatTable);
    LOGGER.info('Updated Theia README.md files');
}

function createTheiaCompatTable(rows: { version: string; range: string }[]): string {
    const col1Header = '@eclipse-glsp/theia-integration';
    const col2Header = 'Theia';

    // Compute max widths for each column (including header)
    const col1w = Math.max(col1Header.length, ...rows.map(r => r.version.length));
    const col2w = Math.max(col2Header.length, ...rows.map(r => r.range.length));

    // Plus 2 for the spaces at the start/end of each cell
    const cell = (text: string, w: number): string => ` ${text.padEnd(w, ' ')} `;

    // Row formatter
    const formatRow = (v: string, r: string): string => `|${cell(v, col1w)}|${cell(r, col2w)}|`;

    // Separator line
    const sep = `|${'-'.repeat(col1w + 2)}|${'-'.repeat(col2w + 2)}|`;

    // Header, separator, and data rows
    const lines = [formatRow(col1Header, col2Header), sep, ...rows.map(row => formatRow(row.version, row.range))];

    return lines.join('\n');
}

/*
 * Java Server update functions
 */
async function setVersionJavaServer(options: JavaSetVersionOptions): Promise<void> {
    LOGGER.info(`Set pom/Manifest versions to ${options.mvnVersion} ...`);
    LOGGER.debug('Preprocessing eclipse-plugins poms');

    const pluginPoms = exec('grep -ril --include pom.xml \\${package-type}') //
        .split('\n')
        .map(f => path.resolve(f));
    console.log(pluginPoms);
    pluginPoms.forEach(pom => replaceInFile(pom, /\${package-type}/, 'eclipse-plugin'));
    LOGGER.debug('Preprocessing complete');

    // Execute tycho-versions plugin
    await execAsync(`mvn tycho-versions:set-version -DnewVersion=${options.mvnVersion}`, {
        errorMsg: 'Mvn set-versions failed',
        cwd: options.repoDir,
        silent: false
    });
    LOGGER.debug('Restore eclipse-plugin poms');
    pluginPoms.forEach(pom => replaceInFile(pom, /<packaging>eclipse-plugin/, '<packaging>${package-type}'));
    LOGGER.debug('Version bump complete!');
}

/*
 * Eclipse Integration update functions
 */

export async function setVersionEclipseIntegration(options: JavaSetVersionOptions): Promise<void> {
    LOGGER.info(`Set version to ${options.version} in Eclipse Integration repository ...`);
    setVersionEclipseClient(options);
    await setVersionEclipseServer(options);
}

function setVersionEclipseClient(options: JavaSetVersionOptions): void {
    LOGGER.debug('Set client package.json versions ...');
    const clientPath = path.join(options.repoDir, 'client');
    cd(clientPath);
    setVersionNpm({
        ...options,
        repoDir: clientPath,
        version: options.version,
        workspacePackages: getYarnWorkspacePackages(path.join(options.repoDir, 'client'), true)
    });
    cd(options.repoDir);
}

async function setVersionEclipseServer(options: JavaSetVersionOptions): Promise<void> {
    LOGGER.debug('Set server pom.xml versions ...');
    cd(path.join(options.repoDir, 'server'));
    await execAsync(`mvn tycho-versions:set-version -DnewVersion=${options.mvnVersion}`, {
        silent: false,
        errorMsg: 'Tycho set-versions failed'
    });
    updateEclipseServerMetadata(options);
    cd(options.repoDir);
}

function updateEclipseServerMetadata(options: JavaSetVersionOptions): void {
    LOGGER.debug('Update target platform versions ...');
    let p2Location = `releases/${options.version}`;
    if (isNextVersion(options.version)) {
        p2Location = `nightly/${semver.major(options.version)}.${semver.minor(options.version)}/`;
    }
    const p2LocationUrl = `https://download.eclipse.org/glsp/server/p2/${p2Location}`;

    const targetDir = path.join(options.repoDir, 'server/releng/org.eclipse.glsp.ide.releng.target');
    const targetFiles = findFiles(targetDir, '*.target');
    const tpdFiles = findFiles(targetDir, '*.tpd');

    targetFiles.forEach(target => {
        LOGGER.debug(`Update ${target} file`);
        replaceInFile(
            path.resolve(targetDir, `${target}`),
            /<repository location="https:\/\/download\.eclipse\.org\/glsp\/server\/p2\/.*?"/,
            `<repository location="${p2LocationUrl}"`
        );
    });

    tpdFiles.forEach(tpd => {
        LOGGER.debug(`Update ${tpd} file`);
        replaceInFile(
            path.resolve(targetDir, `${tpd}`),
            /location "https:\/\/download\.eclipse\.org\/glsp\/server\/p2\/.*?"/g,
            `location "${p2LocationUrl}"`
        );
    });

    const categoryXmlPath = path.join(options.repoDir, 'server/releng/org.eclipse.glsp.ide.repository/category.xml');
    LOGGER.debug(`Update ${categoryXmlPath} file`);
    replaceInFile(
        categoryXmlPath,
        /<repository-reference location="https:\/\/download\.eclipse\.org\/glsp\/server\/p2\/.*?"/,
        `<repository-reference location="${p2LocationUrl}"`
    );
}
