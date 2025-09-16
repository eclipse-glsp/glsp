/********************************************************************************
 * Copyright (c) 2022-2025 EclipseSource and others.
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
import { getGitRoot, isGitRepository } from './git-util';

export function validateDirectory(rootDir: string): string {
    const path = resolve(rootDir);
    if (!fs.existsSync(path)) {
        throw new InvalidArgumentError(`Not a valid file path!: ${path}`);
    }

    if (!fs.statSync(path).isDirectory()) {
        throw new InvalidArgumentError(`Not a directory!: ${path}`);
    }
    return path;
}

export function validateFile(filePath: string, hasToExist = false): string {
    const path = resolve(filePath);

    if (hasToExist && !fs.existsSync(path)) {
        throw new InvalidArgumentError(`Not a valid file path!: ${path}`);
    }
    if (!fs.statSync(path).isFile()) {
        throw new InvalidArgumentError(`Not a file!: ${path}`);
    }
    return path;
}

export function validateGitDirectory(repository: string): string {
    const repoPath = validateDirectory(repository);
    if (!isGitRepository(repoPath)) {
        throw new InvalidArgumentError(`Not a valid git repository: ${repoPath}`);
    }

    return getGitRoot(repository);
}
