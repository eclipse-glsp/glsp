/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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

import { LOGGER } from '../../util/logger';
import * as sh from '../../util/shell-util';
import {
    ReleaseOptions,
    ReleaseType,
    asMvnVersion,
    checkJavaServerVersion,
    checkoutAndCd,
    commitAndTag,
    lernaSetVersion,
    publish,
    updateVersion,
    yarnInstall
} from './common.js';

let REPO_ROOT: string;

export async function releaseEclipseIntegration(options: ReleaseOptions): Promise<void> {
    LOGGER.info('Prepare glsp-eclipse-integration release');
    LOGGER.debug('Release options: ', options);
    checkJavaServerVersion(options.version);

    REPO_ROOT = checkoutAndCd(options);
    prepareClient(options);
    prepareServer(options);
    generateChangeLog();
    commitAndTag(asMvnVersion(options.version), REPO_ROOT);
    publish(REPO_ROOT, options);
    LOGGER.info('glsp-eclipse-integration release successful!');
}

function prepareClient(options: ReleaseOptions): void {
    LOGGER.info('Prepare client');
    updateExternalGLSPDependencies(options.version);
    lernaSetVersion(`${REPO_ROOT}/client`, options.version);
    buildClient();
}

function updateExternalGLSPDependencies(version: string): void {
    LOGGER.info('Update external GLSP dependencies (Client and workflow example)');
    sh.cd(`${REPO_ROOT}/client`);
    updateVersion({ name: '@eclipse-glsp/client', version }, { name: '@eclipse-glsp-examples/workflow-glsp', version });
}

function buildClient(): void {
    LOGGER.info('[Client] Install & Build with yarn');
    yarnInstall(`${REPO_ROOT}/client`);
    LOGGER.debug('Build successful');
}

function generateChangeLog(): void {
    // do nothing for now
}

function prepareServer(options: ReleaseOptions): void {
    const mvnVersion = asMvnVersion(options.version);
    setServerVersion(mvnVersion);
    updateTarget(mvnVersion, options.releaseType);
    buildServer();
}

function setServerVersion(version: string): void {
    LOGGER.info(`Set pom version to ${version}`);
    sh.cd(`${REPO_ROOT}/server`);
    // Execute tycho-versions plugin
    sh.exec(`mvn tycho-versions:set-version -DnewVersion=${version}`, { silent: false, errorMsg: 'Mvn set-versions failed' });
    LOGGER.debug('Version update complete!');
}

function buildServer(): void {
    sh.cd(`${REPO_ROOT}/server`);
    LOGGER.info('Build Server(P2)');
    sh.exec('mvn clean install', { silent: false, errorMsg: 'P2 build failed' });
}
function updateTarget(mvnVersion: string, releaseType: ReleaseType): void {
    const p2SubLocation = releaseType === 'rc' ? 'staging' : 'releases';
    const p2Location = `https://download.eclipse.org/glsp/server/p2/${p2SubLocation}/${mvnVersion}/`;
    LOGGER.info(`Update glsp server p2 repository to ${p2Location}`);
    sh.cd(`${REPO_ROOT}/server/releng/org.eclipse.glsp.ide.releng.target`);
    LOGGER.debug('Update r2021-03.tpd file');
    sh.exec(`sed -i 's_location "https://download.eclipse.org/glsp/server/p2/.*"_location "${p2Location}"_' r2021-03.tpd`);
    LOGGER.debug('Update r2021-03.target file');
    sh.exec(
        // eslint-disable-next-line max-len
        `sed -i 's_      <repository location="https://download.eclipse.org/glsp/server/p2/.*"_      <repository location="${p2Location}"_g' r2021-03.target`
    );
    LOGGER.debug('Target update successful');
}
