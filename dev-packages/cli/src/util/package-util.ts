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

import * as fs from 'fs';
import * as path from 'path';
import { readFile, readJson, writeJson } from './file-util';
import { exec } from './process-util';

export interface PackageData extends Record<string, any> {
    name: string;
    version: string;
    private?: boolean;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
}

/**
 * Helper class to read and write `package.json` files.
 */
export class PackageHelper {
    private _content?: PackageData;
    private _stringContent?: string;

    constructor(readonly filePath: string, readonly name: string) {
        if (!filePath.endsWith('package.json')) {
            throw new Error(`The package path must point to a package.json file: ${filePath}`);
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`No package.json found in ${filePath}`);
        }
    }

    get location(): string {
        return path.dirname(this.filePath);
    }

    get content(): PackageData {
        if (!this._content) {
            return this.read();
        }
        return this._content;
    }

    get stringContent(): string {
        if (!this._stringContent) {
            this.read();
        }
        if (!this._stringContent) {
            throw new Error('Failed to read package.json content.');
        }
        return this._stringContent;
    }

    read(): PackageData {
        this._stringContent = readFile(this.filePath);
        this._content = JSON.parse(this._stringContent) as PackageData;
        return this._content;
    }

    write(): void {
        if (!this._content) {
            throw new Error('No package data to write. Read the data first.');
        }
        writeJson(this.filePath, this._content);
    }

    hasDependency(depName: string): boolean {
        return this.content.dependencies?.[depName] !== undefined;
    }

    hasDevDependency(depName: string): boolean {
        return this.content.devDependencies?.[depName] !== undefined;
    }

    hasScript(scriptName: string): boolean {
        return this.content.scripts?.[scriptName] !== undefined;
    }

    getScript(scriptName: string): string | undefined {
        return this.content.scripts?.[scriptName];
    }
}

export function readPackage(packagePath: string): PackageHelper {
    if (!packagePath.endsWith('package.json')) {
        throw new Error(`The package path must point to a package.json file: ${packagePath}`);
    }
    const packageData = readJson<PackageData>(packagePath);
    return new PackageHelper(packagePath, packageData.name);
}

export interface YarnWorkspaceInfo {
    location: string;
    workspaceDependencies: string[];
    mismatchedWorkspaceDependencies: string[];
}

export function isYarnMonorepo(rootPath: string): boolean {
    return getYarnWorkspaceInfo(rootPath) !== undefined;
}

/**
 * Get the yarn (v1) workspace info by executing `yarn workspaces info` and parsing the result.
 * @param rootPath The root path of the yarn mono repo
 * @returns The parsed workspace info or `undefined` if the command failed (e.g. not a yarn mono repo)
 */
export function getYarnWorkspaceInfo(rootPath: string): Record<string, YarnWorkspaceInfo> | undefined {
    try {
        const result = exec('yarn workspaces info', { cwd: rootPath, silent: true });
        // Trim the first and last line to extract the JSON object
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        const json = result.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(json) as Record<string, YarnWorkspaceInfo>;
    } catch (error) {
        return undefined;
    }
}

/**
 *  Get all {@link PackageHelper}s of a yarn (v1) mono repo by executing `yarn workspaces info` and parsing the result.
 * @param rootPath The root path of the yarn mono repo
 * @param includeRoot Whether to include the root package.json as well
 * @returns The package helpers of all workspace packages
 */
export function getYarnWorkspacePackages(rootPath: string, includeRoot = false): PackageHelper[] {
    const workspaces = getYarnWorkspaceInfo(rootPath);
    if (!workspaces) {
        return [];
    }
    const packages = Object.entries(workspaces).map(
        ([name, info]) => new PackageHelper(path.resolve(rootPath, info.location, 'package.json'), name)
    );
    if (includeRoot) {
        packages.push(new PackageHelper(path.resolve(rootPath, 'package.json'), 'root'));
    }
    return packages;
}
