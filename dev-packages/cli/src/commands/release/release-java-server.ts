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
import { ReleaseOptions, asMvnVersion, checkIfMavenVersionExists, checkoutAndCd, commitAndTag, publish } from './common';

let REPO_ROOT: string;

export async function releaseJavaServer(options: ReleaseOptions): Promise<void> {
    LOGGER.info('Prepare glsp-server release');
    LOGGER.debug('Release options: ', options);
    const mvnVersion = asMvnVersion(options.version);
    checkPreconditions(options, mvnVersion);
    REPO_ROOT = checkoutAndCd(options);
    sh.find();
    setVersion(mvnVersion);
    build();
    generateChangeLog();
    commitAndTag(mvnVersion, REPO_ROOT);
    publish(REPO_ROOT, options);
    LOGGER.info('glsp-server release successful!');
}

function checkPreconditions(options: ReleaseOptions, mvnVersion: string): void {
    checkIfMavenVersionExists('org.eclipse.glsp', 'org.eclipse.glsp.server', mvnVersion);
}

function setVersion(version: string): void {
    LOGGER.info(`Set pom version to ${version}`);
    sh.cd(REPO_ROOT);
    LOGGER.debug('Preprocessing eclipse-plugins poms');
    // Capture all poms with a `${package.type}` property

    const pluginPoms = sh
        .exec('grep -ril --include pom.xml \\${package-type}') //
        .split('\n')
        .map(file => `${REPO_ROOT}/${file}`);

    // Replace `${package.type}` property with `eclipse-plugin`
    sh.replace(/\${package-type}/, 'eclipse-plugin', pluginPoms);
    LOGGER.debug('Preprocessing complete');

    // Execute tycho-versions plugin
    sh.exec(`mvn tycho-versions:set-version -DnewVersion=${version}`, { silent: false, errorMsg: 'Mvn set-versions failed' });

    LOGGER.debug('Restore eclipse-plugin poms');
    sh.replace(/<packaging>eclipse-plugin/, '<packaging>${package-type}', pluginPoms);

    LOGGER.debug('Version update complete!');
}

function generateChangeLog(): void {
    // do nothing for now
}

function build(): void {
    LOGGER.info('Build M2 & P2');
    LOGGER.debug('M2');
    sh.exec('mvn clean install -Pm2', { silent: false, errorMsg: 'M2 build failed' });
    LOGGER.newLine();
    LOGGER.debug('P2');
    sh.exec('mvn clean install -Pp2', { silent: false, errorMsg: 'P2 build failed' });
}
