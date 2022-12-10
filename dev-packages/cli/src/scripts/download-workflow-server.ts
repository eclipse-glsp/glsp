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

import download, { Artifact } from 'mvn-artifact-download';
import { baseConfiguration } from '../util/command-util';
import { LOGGER } from '../util/logger';
import { validateBaseVersion, validateDirectory } from '../util/validation-util';

interface CmdOptions {
    isSnapshot: boolean;
}

export const DownloadWorkflowServerCommand = baseConfiguration()
    .name('download:workflowServer')
    .description('Download the Workflow Example Server jar')
    .argument('<downloadDir>', 'The target download directory', validateDirectory)
    .argument('<version>', 'The base version of the server jar', validateBaseVersion)
    .option('--isSnapshot', 'Flag to consume the snapshot version')
    .action(downloadWorkflowServer);

const RELEASE_REPO = 'https://repo1.maven.org/maven2/';
const SNAPSHOT_REPO = 'https://oss.sonatype.org/content/repositories/snapshots/';
const ARTIFACT_TEMPLATE: Artifact = {
    groupId: 'org.eclipse.glsp.example',
    artifactId: 'org.eclipse.glsp.example.workflow',
    version: 'TO_REPLACE',
    isSnapShot: false,
    classifier: 'glsp'
};

export function downloadWorkflowServer(downloadDir: string, version: string, options: CmdOptions = { isSnapshot: false }): void {
    const artifact = { ...ARTIFACT_TEMPLATE, version };
    const repo = options.isSnapshot ? SNAPSHOT_REPO : RELEASE_REPO;
    const jarFile = `${artifact.artifactId}-${artifact.version}${options.isSnapshot ? '-SNAPSHOT' : ''}-${artifact.classifier}.jar`;
    LOGGER.info(`Download ${jarFile} from maven`);
    download(artifact, downloadDir, repo)
        .then(file => LOGGER.info(`Download of ${file} completed`))
        .catch(err => {
            LOGGER.error(err);
            DownloadWorkflowServerCommand.error('Error occurred. Download was not successful!');
        });
}
