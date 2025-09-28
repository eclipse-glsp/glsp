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
import path from 'path';
import { cd, getYarnWorkspacePackages, isGitRepository, listDirectories, LOGGER, PackageHelper } from '../../util';
import { GLSPRepo } from '../common';

export interface RepoData {
    repo: GLSPRepo;
    path: string;
    workspacePackages: PackageHelper[];
    linkablePackages?: string[];
}

export type RepoRecord = Record<GLSPRepo, RepoData | undefined>;

export namespace RepoData {
    /**
     * Get data about all GLSP repositories in the given parent directory.
     * @param parentDir The parent directory to scan for GLSP repositories.
     * @returns  A record of GLSP repositories to their data (or undefined if the repository does not exist in the parent directory).
     */
    export function deriveFromDirectory(parentDir: string): RepoRecord {
        const repos: Record<GLSPRepo, RepoData | undefined> = {} as RepoRecord;
        cd(parentDir);
        listDirectories(parentDir).filter(dir => {
            if (!isGitRepository(dir)) {
                return;
            }
            const repo = GLSPRepo.deriveFromDirectory(dir);
            if (repo) {
                const repoPath = repo === 'glsp-eclipse-integration' ? path.resolve(dir, 'client') : path.resolve(dir);

                const workspacePackages = getYarnWorkspacePackages(repoPath);
                LOGGER.debug(`Found GLSP repo '${repo}' in directory: ${repoPath}`);
                repos[repo] = { repo, path: repoPath, workspacePackages };
            }
        });

        return repos;
    }

    export function getPackagesToLink(repoType: string, record: RepoRecord): string[] {
        switch (repoType) {
            case 'glsp-client':
                return record['glsp']?.linkablePackages ?? [];
            case 'glsp-server-node':
                return [
                    ...(record['glsp']?.linkablePackages ?? []),
                    ...(record['glsp-client']?.linkablePackages ?? []).filter(
                        p => p !== '@eclipse-glsp/client' && p !== '@eclipse-glsp/sprotty'
                    )
                ];
            case 'glsp-theia-integration':
            case 'glsp-vscode-integration':
                return [
                    ...(record['glsp']?.linkablePackages ?? []),
                    ...(record['glsp-client']?.linkablePackages ?? []),
                    ...(record['glsp-server-node']?.linkablePackages ?? [])
                ];
            case 'glsp-eclipse-integration':
                return [...(record['glsp']?.linkablePackages ?? []), ...(record['glsp-client']?.linkablePackages ?? [])];
            default:
                return [];
        }
    }
}
