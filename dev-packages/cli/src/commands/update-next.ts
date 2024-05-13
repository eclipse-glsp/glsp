/********************************************************************************
 * Copyright (c) 2024 EclipseSource and others.
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
import { glob } from 'glob';
import * as jq from 'node-jq';
import * as path from 'path';
import sh from 'shelljs';
import { baseCommand, configureShell } from '../util/command-util';
import { getUncommittedChanges } from '../util/git-util';
import { LOGGER, configureLogger } from '../util/logger';
import { validateGitDirectory } from '../util/validation-util';

export const UpdateNextCommand = baseCommand()
    .name('updateNext')
    .alias('u')
    .description('Updates all `next` dependencies in GLSP project to the latest version')
    .argument('[rootDir]', 'The repository root', validateGitDirectory, process.cwd())
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .action(updateNext);

export async function updateNext(rootDir: string, options: { verbose: boolean }): Promise<void> {
    configureLogger(options.verbose);
    configureShell({ silent: true, fatal: true });

    const rootPackage = path.join(rootDir, 'package.json');
    if (getUncommittedChanges(rootDir).includes(rootPackage)) {
        LOGGER.warn('Uncommitted changes in root `package.json`. Please commit or stash them before running this command.');
        return;
    }

    configureShell({ silent: false, fatal: true });

    LOGGER.info('Updating next dependencies ...');
    rootDir = path.resolve(rootDir);
    const packages = await getWorkspacePackages(rootDir);
    LOGGER.debug(`Scanning ${packages.length} packages to derive resolutions`, packages);
    const resolutions = await getResolutions(packages);
    if (Object.keys(resolutions).length === 0) {
        LOGGER.info('No next dependencies found');
        return;
    }
    LOGGER.info('Upgrade and rebuild packages ...');
    const packageJson = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
    LOGGER.debug('Updating package.json with resolutions', resolutions);
    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify({ ...JSON.parse(packageJson), resolutions }, undefined, 2));
    LOGGER.debug('Running yarn install');
    sh.exec('yarn install --ignore-scripts');
    LOGGER.debug('Reverting package.json');
    sh.exec('git checkout HEAD -- package.json');
    LOGGER.debug('Rebuild to update yarn.lock');
    sh.exec('yarn');
    LOGGER.info('Upgrade successfully completed');
}

async function getWorkspacePackages(rootDir: string): Promise<string[]> {
    const rootPackage = path.join(rootDir, 'package.json');
    const packages = [rootPackage];
    if (!fs.existsSync(rootPackage)) {
        LOGGER.error('No package.json found in root directory');
        process.exit(1);
    }
    const workspaces = await getWorkspaceConfig(rootPackage);
    if (workspaces) {
        workspaces
            .map(workspace => `${workspace}/**/package.json`)
            .forEach(pattern => {
                glob.sync(pattern, {
                    cwd: rootDir,
                    ignore: ['**/node_modules/**']
                }).forEach(packageJson => packages.push(path.join(rootDir, packageJson)));
            });
    }

    return [...new Set(packages)];
}

async function getResolutions(packages: string[]): Promise<Record<string, string>> {
    let dependencies: string[] = [];
    for (const pkg of packages) {
        const deps = await jq.run(
            '.dependencies //{} + .devDependencies + .peerDependencies | with_entries(select(.value == "next")) | keys',
            pkg,
            {
                output: 'json'
            }
        );
        if (Array.isArray(deps)) {
            dependencies.push(...deps);
        }
    }
    dependencies = [...new Set(dependencies)];
    LOGGER.debug(`Found ${dependencies.length} 'next' dependencies`, dependencies);
    LOGGER.info('Retrieve next versions ... ');
    const resolutions: Record<string, string> = {};
    [...new Set(dependencies)].forEach(dep => {
        LOGGER.info(`Retrieving next version for ${dep}`);
        const version = sh.exec(`npm view ${dep}@next version`, { silent: true }).stdout.trim();
        resolutions[`**/${dep}`] = version;
    });
    return resolutions;
}
async function getWorkspaceConfig(rootPackage: string): Promise<string[] | undefined> {
    const result = await jq.run('.workspaces', rootPackage, { output: 'json' });
    if (!result) {
        return undefined;
    }
    if (Array.isArray(result)) {
        return result;
    }
    if (typeof result === 'object' && 'packages' in result && Array.isArray(result.packages)) {
        return result.packages;
    }

    return undefined;
}
