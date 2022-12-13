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
import { ChildProcess } from 'child_process';
import { exit } from 'process';
import { createInterface } from 'readline';
import * as readline from 'readline-sync';
import * as semver from 'semver';
import * as sh from 'shelljs';
import { BaseCmdOptions, fatalExec, getShellConfig, initialConfiguration } from '../util/command-util';
import { isGithubCLIAuthenticated } from '../util/git-util';
import { LOGGER } from '../util/logger';
import { validateVersion } from '../util/validation-util';
import {
    asMvnVersion,
    checkIfMavenVersionExists,
    checkIfNpmVersionExists,
    Component,
    ReleaseOptions,
    ReleaseType,
    VERDACCIO_REGISTRY
} from './common';
import { releaseClient } from './release-client';
import { releaseEclipseIntegration } from './release-eclipse-integration';
import { releaseJavaServer } from './release-java-server';
import { releaseServerNode } from './release-server-node';
import { releaseTheiaIntegration } from './release-theia-integration';
import { releaseVscodeIntegration } from './release-vscode-integration';
interface ReleaseCmdOptions extends BaseCmdOptions {
    checkoutDir: string;
    branch: string;
    force: boolean;
    publish: boolean;
    npmDryRun: boolean;
    draft: boolean;
}

let verdaccioChildProcess: ChildProcess | undefined = undefined;

export async function release(
    component: Component,
    releaseType: ReleaseType,
    customVersion: string | undefined,
    cliOptions: ReleaseCmdOptions
): Promise<void> {
    try {
        LOGGER.debug('Cli options:', cliOptions);
        initialConfiguration(cliOptions.verbose);
        checkGHCli();
        const version = deriveVersion(releaseType, customVersion);
        const options: ReleaseOptions = { ...cliOptions, component, releaseType, version };
        if (cliOptions.npmDryRun && options.component.releaseRepo === 'npm') {
            await launchVerdaccio().catch(error => LOGGER.error('Error occurred during verdaccio launch', error));
        }
        switch (component.type) {
            case 'server-java':
                checkIfMavenVersionExists('org.eclipse.glsp', 'org.eclipse.glsp.server', asMvnVersion(version));
                return releaseJavaServer(options);
            case 'server-node':
                await checkIfNpmVersionExists('@eclipse-glsp/server-node', version);
                return releaseServerNode(options);
            case 'client':
                await checkIfNpmVersionExists('@eclipse-glsp/client', version);
                return releaseClient(options);
            case 'theia-integration':
                await checkIfNpmVersionExists('@eclipse-glsp/theia-integration', version);
                return releaseTheiaIntegration(options);
            case 'vscode-integration':
                await checkIfNpmVersionExists('@eclipse-glsp/vscode-integration', version);
                return releaseVscodeIntegration(options);
            case 'eclipse-integration':
                await checkIfNpmVersionExists('@eclipse-glsp/ide', version);
                return releaseEclipseIntegration(options);
        }
    } catch (err) {
        console.error('An error occurred during command execution:', err);
        exit(1);
    } finally {
        if (verdaccioChildProcess) {
            verdaccioChildProcess.kill();
        }
    }
}

function checkGHCli(): void {
    LOGGER.debug('Verify that Github CLI is configured correctly');
    if (!isGithubCLIAuthenticated()) {
        throw new Error("Github CLI is not configured properly. No user is logged in for host 'github.com'");
    }
}

function launchVerdaccio(): Promise<void> {
    LOGGER.debug('Verify that verdaccio is installed and start if necessary');
    fatalExec('which verdaccio', 'Verdaccio is not installed!');
    // Check if verdaccio is alreaddy running
    const result = sh.exec(`curl -i ${VERDACCIO_REGISTRY}`, getShellConfig());
    if (result.code !== 0) {
        LOGGER.info('Starting local verdaccio registry');
        verdaccioChildProcess = sh.exec('verdaccio', { async: true, silent: true });
        return new Promise(resolve => {
            createInterface(verdaccioChildProcess!.stdout!).on('line', line => {
                if (line.includes(`http address - ${VERDACCIO_REGISTRY}`)) {
                    resolve();
                }
            });
        });
    }
    return Promise.resolve();
}

function deriveVersion(releaseType: ReleaseType, customVersion?: string): string {
    LOGGER.debug(`Derive version from release type: ${release}`);
    switch (releaseType) {
        case 'custom':
            return getCustomVersion(customVersion);
        case 'rc':
            return getRCVersion();
        case 'patch':
        case 'major':
        case 'minor':
            return semverInc(releaseType);
    }
}

const REFERENCE_NPM_PACKAGE = '@eclipse-glsp/ide';

function getRCVersion(): string {
    LOGGER.debug('Retrieve and new RC version');
    const newBaseVersion = semverInc('minor');
    const currentRcVersion = sh.exec(`npm view ${REFERENCE_NPM_PACKAGE} dist-tags.rc`, getShellConfig()).stdout.trim();
    const currentRcBaseVersion = currentRcVersion.split('-')[0];
    if (currentRcBaseVersion !== newBaseVersion) {
        return `${newBaseVersion}-RC01`;
    }
    let rcNumber = Number.parseInt(currentRcVersion.replace(`${currentRcBaseVersion}-RC`, ''), 10);
    rcNumber++;

    return `${newBaseVersion}-RC` + `${rcNumber}`.padStart(2, '0');
}

function getCustomVersion(customVersion?: string): string {
    LOGGER.debug('Retrieve and validate custom version');
    LOGGER.debug(customVersion ? `Custom version has been passed as argument: ${customVersion}` : 'Prompt custom version from user');
    const version = customVersion ?? readline.question('> Please enter the new version');
    return validateVersion(version);
}

function getCurrentVersion(): string {
    LOGGER.debug('Retrieve base version by querying the latest tag of the reference npm package');
    const version = sh.exec(`npm view ${REFERENCE_NPM_PACKAGE} dist-tags.latest`, getShellConfig()).stdout.trim();
    return validateVersion(version);
}

function semverInc(releaseType: semver.ReleaseType, identifier?: string): string {
    const currentVersion = getCurrentVersion();
    LOGGER.debug(`Execute: semver.inc("${currentVersion}", ${releaseType}, ${identifier})`);
    const newVersion = semver.inc(currentVersion, releaseType, identifier);
    if (!newVersion) {
        throw new Error(`Could not increment version: ${currentVersion} `);
    }
    return newVersion;
}
