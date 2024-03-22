/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
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
import { Options as GlobbyOptions, globbySync } from 'globby';
import * as os from 'os';
import * as path from 'path';
import sh from 'shelljs';
import { baseCommand } from '../util/command-util.js';

export interface GenerateIndexCmdOptions {
    dedicatedIndex: boolean;
    forceOverwrite: boolean;
    match: string[] | boolean;
    ignore: string[] | boolean;
    verbose: boolean;
}

export const GenerateIndex = baseCommand() //
    .name('generateIndex')
    .description('Generate index files in a given source directory.')
    .argument('<rootDir>', 'The starting directory for index generation.')
    .option('-d, --dedicatedIndex', 'Generate a dedicated index file for each directory instead of one global index', false)
    .option('-f, --forceOverwrite', 'Overwrite existing existing index files', false)
    .option('-m, --match [match patterns...]', 'File patterns to consider during indexing', ['**/*.ts', '**/*.tsx'])
    .option('-i, --ignore [ignore patterns...]', 'File patterns to ignore during indexing', ['**/*.spec.ts', '**/*.spec.tsx', '**/*.d.ts'])
    .option('-v, --verbose', 'Generate verbose output during generation', false)
    .action(generateIndex);

export async function generateIndex(rootDir: string, options: GenerateIndexCmdOptions): Promise<void> {
    log(options, 'Run generateIndex with the following options:', options);
    sh.cd(rootDir);
    const cwd = process.cwd();

    // we want to match all given patterns and subdirectories and ignore all given patterns and (generated) index files
    const pattern = typeof options.match === 'boolean' ? ['**/'] : [...options.match, '**/'];
    const ignore = typeof options.ignore === 'boolean' ? ['**/index.ts'] : [...options.ignore, '**/index.ts'];
    const globbyOptions: GlobbyOptions = {
        ignore,
        cwd,
        onlyFiles: !options.dedicatedIndex,
        markDirectories: true, // directories have '/' at the end
        ignoreFiles: '**/.indexignore' // users can add this file in their directories to ignore files for indexing
    };
    log(options, 'Search for children using the following globby options', globbyOptions);
    const files = globbySync(pattern, globbyOptions);
    log(options, 'All children considered in the input directory', files);

    const relativeRootDirectory = '';
    if (!options.dedicatedIndex) {
        writeIndex(relativeRootDirectory, files.filter(isFile), options);
    } else {
        // sort by length so we deal with sub-directories before we deal with their parents so we already know whether they are empty
        const directories = [...files.filter(isDirectory), relativeRootDirectory].sort((left, right) => right.length - left.length);
        const directoryChildren = new Map<string, string[]>();
        for (const directory of directories) {
            const children = files.filter(file => isDirectChild(directory, file, () => !!directoryChildren.get(file)?.length));
            directoryChildren.set(directory, children);
            writeIndex(directory, children, options);
        }
    }
}

export function isDirectChild(parent: string, child: string, childHasChildren: () => boolean): boolean {
    return isChildFile(parent, child) || (isChildDirectory(parent, child) && childHasChildren());
}

export function isDirectory(file: string): boolean {
    return file.endsWith('/');
}

export function isFile(file: string): boolean {
    return !isDirectory(file);
}

export function getLevel(file: string): number {
    return file.split('/').length;
}

export function isChild(parent: string, child: string): boolean {
    return child.startsWith(parent);
}

export function isChildDirectory(parent: string, child: string): boolean {
    return isDirectory(child) && isChild(parent, child) && getLevel(child) === getLevel(parent) + 1;
}

export function isChildFile(parent: string, child: string): boolean {
    return isFile(child) && isChild(parent, child) && getLevel(child) === getLevel(parent);
}

export function writeIndex(directory: string, exports: string[], options: GenerateIndexCmdOptions): void {
    const indexFile = path.join(process.cwd(), directory, 'index.ts');
    if (exports.length === 0) {
        if (options.forceOverwrite && fs.existsSync(indexFile)) {
            log(options, 'Remove index file', indexFile);
            fs.rmSync(indexFile);
        }
        return;
    }
    if (!fs.existsSync(indexFile) || options.forceOverwrite) {
        const content = exports
            .map(exported => createExport(directory, exported))
            .sort()
            .filter(exportLine => !!exportLine)
            .join(os.EOL);
        log(options, 'Write index file', indexFile);
        log(options, () => '  ' + content.split(os.EOL).join(os.EOL + '  '));
        fs.writeFileSync(indexFile, content, { flag: 'w' });
    } else {
        log(options, 'Do not overwrite existing index file', indexFile);
    }
}

export function createExport(directory: string, relativePath: string): string | undefined {
    // remove directory prefix, file extension and directory ending '/'
    const directoryPrefix = directory.length;
    const suffix = isFile(relativePath) ? path.extname(relativePath).length : 1;
    const relativeName = relativePath.substring(directoryPrefix, relativePath.length - suffix);
    const exportLine = `export * from './${relativeName}';`;
    return exportLine;
}

export function log(options: GenerateIndexCmdOptions, message?: any, ...optionalParams: any[]): void {
    if (options.verbose) {
        console.log(typeof message === 'function' ? message() : message, ...optionalParams);
    }
}
