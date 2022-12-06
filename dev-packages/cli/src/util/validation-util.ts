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
import { InvalidArgumentError } from 'commander';
import * as fs from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';
import { isGitRepository } from './git-util';
import { LOGGER } from './logger';
export const COMMAND_VERSION = '1.1.0-next';

export function validateDirectory(rootDir: string): string {
    const path = resolve(rootDir);
    if (!fs.existsSync(path)) {
        throw new InvalidArgumentError('Not a valid file path!');
    }

    if (!fs.statSync(path).isDirectory()) {
        throw new InvalidArgumentError('Not a directory!');
    }
    return path;
}

export function validateVersion(version: string): string {
    LOGGER.debug(`Validate version format of: ${version}`);
    if (!semver.valid(version)) {
        throw new Error(`Not a valid version: ${version}`);
    }
    return version;
}

export function validateGitDirectory(repository: string): string {
    const repoPath = validateDirectory(repository);
    if (!isGitRepository(repoPath)) {
        throw new Error('Not a valid git repository');
    }
    return repoPath;
}
