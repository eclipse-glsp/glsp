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
import * as sh from 'shelljs';
import { LOGGER } from '../util/logger';
import {
    asMvnVersion,
    checkJavaServerVersion,
    checkoutAndCd,
    commitAndTag,
    lernaSetVersion,
    publish,
    ReleaseOptions,
    updateLernaForDryRun,
    updateServerConfig,
    yarnInstall
} from './common';

let REPO_ROOT: string;

export async function releaseClient(options: ReleaseOptions): Promise<void> {
    LOGGER.info('Prepare glsp-client release');
    LOGGER.debug('Release options: ', options.version);
    REPO_ROOT = checkoutAndCd(options);
    await updateDownloadServerScript(options.version, options.force);
    generateChangeLog();
    lernaSetVersion(REPO_ROOT, options.version);
    build();
    if (options.npmDryRun) {
        updateLernaForDryRun();
    }
    commitAndTag(options.version, REPO_ROOT);
    publish(REPO_ROOT, options);
}

async function updateDownloadServerScript(version: string, force: boolean): Promise<void> {
    LOGGER.info('Update example server download config');
    const mvnVersion = asMvnVersion(version);
    checkJavaServerVersion(version, force);
    sh.cd(`${REPO_ROOT}/examples/workflow-glsp/scripts`);
    updateServerConfig('config.json', mvnVersion, false);
}

function generateChangeLog(): void {
    // do nothing for now
}

function build(): void {
    LOGGER.info('Install & Build with yarn');
    yarnInstall(REPO_ROOT);
    LOGGER.debug('Build successful');
}
