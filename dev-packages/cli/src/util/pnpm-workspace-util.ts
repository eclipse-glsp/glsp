/********************************************************************************
 * Copyright (c) 2026 EclipseSource and others.
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

import * as fs from 'fs';
import * as path from 'path';
import { Document, YAMLMap, parseDocument } from 'yaml';
import { readFile, writeFile } from './file-util';

export function getPnpmWorkspaceFilePath(repoDir: string): string {
    return path.resolve(repoDir, 'pnpm-workspace.yaml');
}

/**
 * Reads the `pnpm-workspace.yaml` of the given repository as a YAML document.
 * Using the document API preserves existing content, comments and formatting on write.
 * @param repoDir The root path of the pnpm workspace
 * @throws Error if the repository has no `pnpm-workspace.yaml`
 */
export function readPnpmWorkspaceDocument(repoDir: string): Document {
    const filePath = getPnpmWorkspaceFilePath(repoDir);
    if (!fs.existsSync(filePath)) {
        throw new Error(`No pnpm-workspace.yaml found in '${repoDir}'.`);
    }
    return parseDocument(readFile(filePath));
}

/**
 * Returns the `overrides` section of the repository's `pnpm-workspace.yaml`.
 */
export function getPnpmOverrides(repoDir: string): Record<string, string> {
    const doc = readPnpmWorkspaceDocument(repoDir);
    const overrides = doc.get('overrides');
    if (!(overrides instanceof YAMLMap)) {
        return {};
    }
    return overrides.toJSON() as Record<string, string>;
}

/**
 * Adds (or updates) the given entries in the `overrides` section of the repository's
 * `pnpm-workspace.yaml`. Existing unrelated overrides and other content are preserved.
 * The overrides are applied by the next `pnpm install`.
 */
export function setPnpmOverrides(repoDir: string, overrides: Record<string, string>): void {
    const doc = readPnpmWorkspaceDocument(repoDir);
    Object.entries(overrides).forEach(([name, value]) => doc.setIn(['overrides', name], value));
    writeFile(getPnpmWorkspaceFilePath(repoDir), doc.toString());
}

/**
 * Removes the given entries from the `overrides` section of the repository's
 * `pnpm-workspace.yaml`. The `overrides` section is removed entirely if it becomes empty.
 * Missing entries are ignored, so removal is idempotent.
 */
export function removePnpmOverrides(repoDir: string, names: string[]): void {
    const doc = readPnpmWorkspaceDocument(repoDir);
    const overrides = doc.get('overrides');
    if (!(overrides instanceof YAMLMap)) {
        return;
    }
    names.forEach(name => overrides.delete(name));
    if (overrides.items.length === 0) {
        doc.delete('overrides');
    }
    writeFile(getPnpmWorkspaceFilePath(repoDir), doc.toString());
}
