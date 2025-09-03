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

import { exit } from 'process';
import { LOGGER, exec } from '../../util';
import { MvnPrepReleaseOptions } from './common';

export async function prepareEclipseIntegrationRelease(options: MvnPrepReleaseOptions): Promise<void> {
    if (options.repo !== 'glsp-eclipse-integration') {
        throw new Error('The release-eclipse-integration command is only supported for the glsp-eclipse-integration repository.');
    }
    checkP2Versions(options);
    exit(0);
}

function checkP2Versions(options: MvnPrepReleaseOptions): void {
    const p2Repo = options.mvnVersion.endsWith('.SNAPSHOT')
        ? `nightly/${options.mvnVersion.substring(0, 3)}`
        : `releases/${options.mvnVersion}`;
    LOGGER.info(`Ensure that P2 repository for version ${options.mvnVersion} exists ...`);
    try {
        exec(`wget -q -O - https://download.eclipse.org/glsp/server/p2/${p2Repo}/p2.index`, { silent: true }).trim();
    } catch (error) {
        throw new Error(
            `P2 repository for version ${options.mvnVersion} does not exist!.
Expected URL: https://download.eclipse.org/glsp/server/p2/${p2Repo}/p2.index`
        );
    }
}
