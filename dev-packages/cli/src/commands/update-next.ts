/********************************************************************************
 * Copyright (c) 2024-2026 EclipseSource and others.
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

import * as path from 'path';
import {
    LOGGER,
    PackageHelper,
    baseCommand,
    configureExec,
    configureLogger,
    detectPackageManager,
    exec,
    execAsync,
    getUncommittedChanges,
    getWorkspacePackages,
    readPackage,
    validateGitDirectory
} from '../util';

export const UpdateNextCommand = baseCommand()
    .name('updateNext')
    .alias('u')
    .description('Updates all `next` dependencies in GLSP project to the latest version')
    .argument('[rootDir]', 'The repository root', validateGitDirectory, process.cwd())
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .action(updateNext);

export async function updateNext(rootDir: string, options: { verbose: boolean }): Promise<void> {
    configureLogger(options.verbose);

    const rootPkgPath = path.join(rootDir, 'package.json');
    if (getUncommittedChanges(rootDir).includes(rootPkgPath)) {
        LOGGER.warn('Uncommitted changes in root `package.json`. Please commit or stash them before running this command.');
        return;
    }

    configureExec({ silent: false, fatal: true });

    LOGGER.info('Updating next dependencies ...');
    rootDir = path.resolve(rootDir);
    const pm = detectPackageManager(rootDir);
    const packages = getWorkspacePackages(rootDir, true);

    if (pm === 'pnpm') {
        LOGGER.debug(`Scanning ${packages.length} packages for 'next' dependencies`, packages);
        const nextDeps = getNextDependencies(packages);
        if (nextDeps.length === 0) {
            LOGGER.info('No next dependencies found');
            return;
        }
        LOGGER.info('Upgrade and rebuild packages ...');
        // pnpm update re-resolves dist-tag specifiers (like 'next') and rewrites the lockfile
        await execAsync(`pnpm update -r ${nextDeps.join(' ')}`, { silent: false, cwd: rootDir });
        LOGGER.info('Upgrade successfully completed');
        return;
    }

    LOGGER.debug(`Scanning ${packages.length} packages to derive resolutions`, packages);
    const resolutions = await getResolutions(packages);
    if (Object.keys(resolutions).length === 0) {
        LOGGER.info('No next dependencies found');
        return;
    }
    LOGGER.info('Upgrade and rebuild packages ...');
    LOGGER.debug('Updating package.json with resolutions', resolutions);
    const rootPkg = readPackage(rootPkgPath);
    rootPkg.content.resolutions = resolutions;
    rootPkg.write();
    LOGGER.debug('Running yarn install');
    await execAsync('yarn install --ignore-scripts', { silent: false, cwd: rootDir });
    LOGGER.debug('Reverting package.json');
    exec('git checkout HEAD -- package.json', { silent: true, cwd: rootDir });
    LOGGER.debug('Rebuild to update yarn.lock');
    await execAsync('yarn', { silent: false, cwd: rootDir });
    LOGGER.info('Upgrade successfully completed');
}

function getNextDependencies(packages: PackageHelper[]): string[] {
    const dependencies: string[] = [];
    for (const pkg of packages) {
        const allDeps = {
            ...(pkg.content.dependencies || {}),
            ...(pkg.content.devDependencies || {}),
            ...(pkg.content.peerDependencies || {})
        };
        dependencies.push(...Object.keys(allDeps).filter(dep => allDeps[dep] === 'next'));
    }
    const nextDeps = [...new Set(dependencies)];
    LOGGER.debug(`Found ${nextDeps.length} 'next' dependencies`, nextDeps);
    return nextDeps;
}

async function getResolutions(packages: PackageHelper[]): Promise<Record<string, string>> {
    const dependencies = getNextDependencies(packages);
    LOGGER.info('Retrieve next versions ... ');
    const resolutions: Record<string, string> = {};
    dependencies.forEach(dep => {
        LOGGER.info(`Retrieving next version for ${dep}`);
        const version = exec(`npm view ${dep}@next version`, { silent: true });
        resolutions[`**/${dep}`] = version;
    });
    return resolutions;
}
