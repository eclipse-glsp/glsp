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

import * as path from 'path';
import { exit } from 'process';
import { LOGGER, exec, execAsync, replaceInFile } from '../../util';
import { MvnPrepReleaseOptions, checkIfMavenVersionExists } from './common';

export async function prepareJavaServerRelease(options: MvnPrepReleaseOptions): Promise<void> {
    if (options.repo !== 'glsp-server') {
        throw new Error('The release-java command is only supported for the glsp-server repository.');
    }
    checkMvnVersions(options);
    await bumpVersion(options);
    updateP2RepositoryMetadata(options);
    await build(options);
    exit(0);
}

function checkMvnVersions(options: MvnPrepReleaseOptions): void {
    LOGGER.info(`Ensure that version ${options.mvnVersion} of ${options.repo} does not exist on Maven Central ...`);
    checkIfMavenVersionExists('org.eclipse.glsp', 'org.eclipse.glsp.parent', options.mvnVersion);
}

async function bumpVersion(options: MvnPrepReleaseOptions): Promise<void> {
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

async function build(options: MvnPrepReleaseOptions): Promise<void> {
    LOGGER.info('Build M2 & P2');
    LOGGER.debug('M2');
    await execAsync('mvn clean install -Pm2', { silent: false, cwd: options.repoDir, errorMsg: 'M2 build failed' });
    LOGGER.newLine();
    LOGGER.debug('P2');
    await execAsync('mvn clean install -Pp2', { silent: false, cwd: options.repoDir, errorMsg: 'P2 build failed' });
    LOGGER.debug('Build succeeded');
}

function updateP2RepositoryMetadata(options: MvnPrepReleaseOptions): void {
    const categoryXmlPath = path.join(options.repoDir, 'releng', 'org.eclipse.glsp.repository', 'category.xml');
    const version = options.mvnVersion.replace('.SNAPSHOT', '.qualifier');
    replaceInFile(
        categoryXmlPath,
        /<feature url="[^"]*"[^>]*\/>/, //
        // eslint-disable-next-line max-len
        `<feature url="features/org.eclipse.glsp.feature_${version}.jar" id="org.eclipse.glsp.feature" version="${version}"/>`
    );
}
