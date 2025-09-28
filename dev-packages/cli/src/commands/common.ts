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
import { getRemoteUrl, LOGGER } from '../util';

export type GLSPRepo = (typeof GLSPRepo.choices)[number];
export namespace GLSPRepo {
    export const choices = [
        'glsp',
        'glsp-server-node',
        'glsp-client',
        'glsp-theia-integration',
        'glsp-vscode-integration',
        'glsp-eclipse-integration',
        'glsp-server',
        'glsp-playwright'
    ] as const;

    export function is(object: unknown): object is GLSPRepo {
        return typeof object === 'string' && choices.includes(object as GLSPRepo);
    }

    export function isNpmRepo(repo: string): boolean {
        return repo !== 'glsp-server' && repo !== 'glsp-eclipse-integration';
    }

    export function deriveFromDirectory(repoDir: string): GLSPRepo | undefined {
        try {
            const remoteUrl = getRemoteUrl(repoDir);
            const repo = remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1).replace('.git', '');
            if (!repo) {
                LOGGER.warn(`No git repository found in ${repoDir}`);
                return undefined;
            }
            if (!is(repo)) {
                return undefined;
            }
            return repo;
        } catch (error) {
            LOGGER.warn(`No git repository found in ${repoDir}`);
            return undefined;
        }
    }
}
