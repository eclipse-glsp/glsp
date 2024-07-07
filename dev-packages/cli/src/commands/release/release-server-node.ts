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

import sh from 'shelljs';
import { LOGGER } from '../../util/logger';
import {
    checkoutAndCd,
    commitAndTag,
    lernaSetVersion,
    publish,
    ReleaseOptions,
    updateLernaForDryRun,
    updateVersion,
    yarnInstall
} from './common';

let REPO_ROOT: string;

export async function releaseServerNode(options: ReleaseOptions): Promise<void> {
    LOGGER.info('Prepare glsp-server-node release');
    LOGGER.debug('Release options: ', options);
    REPO_ROOT = checkoutAndCd(options);
    updateExternalGLSPDependencies(options.version);
    generateChangeLog();
    lernaSetVersion(REPO_ROOT, options.version);
    build();
    if (options.npmDryRun) {
        updateLernaForDryRun();
    }
    commitAndTag(options.version, REPO_ROOT);
    publish(REPO_ROOT, options);
}

function updateExternalGLSPDependencies(version: string): void {
    LOGGER.info('Update external GLSP dependencies (Protocol)');
    sh.cd(REPO_ROOT);
    updateVersion({ name: '@eclipse-glsp/protocol', version });
}

function build(): void {
    LOGGER.info('Install & Build with yarn');
    yarnInstall(REPO_ROOT);
    LOGGER.debug('Build successful');
}

function generateChangeLog(): void {
    // do nothing for now
}
