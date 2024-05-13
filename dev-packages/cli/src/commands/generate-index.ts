/********************************************************************************
 * Copyright (c) 2023-2024 EclipseSource and others.
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

import { createOption } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sh from 'shelljs';
import { baseCommand } from '../util/command-util';
import { LOGGER, configureLogger } from '../util/logger';
import { validateDirectory } from '../util/validation-util';

export interface GenerateIndexCmdOptions {
    singleIndex: boolean;
    forceOverwrite: boolean;
    match: string[] | boolean;
    ignore: string[] | boolean;
    ignoreFile: string;
    style: 'commonjs' | 'esm';
    verbose: boolean;
}

// Partial type of the globby imports since we can not use the esm type directly
interface GlobbyOptions {
    ignore: string[];
    cwd: string;
    onlyFiles: boolean;
    markDirectories: true;
    ignoreFiles: string;
}

export const GenerateIndex = baseCommand() //
    .name('generateIndex')
    .description('Generate index files in a given source directory.')
    .argument('<rootDir...>', 'The source directory for index generation.')
    .option('-s, --singleIndex', 'Generate a single index file in the source directory instead of indices in each sub-directory', false)
    .option('-f, --forceOverwrite', 'Overwrite existing index files and remove them if there are no entries', false)
    .option('-m, --match [match patterns...]', 'File patterns to consider during indexing', ['**/*.ts', '**/*.tsx'])
    .option('-i, --ignore [ignore patterns...]', 'File patterns to ignore during indexing', ['**/*.spec.ts', '**/*.spec.tsx', '**/*.d.ts'])
    .addOption(createOption('-s, --style <importStyle>', 'Import Style').choices(['commonjs', 'esm']).default('commonjs'))
    .option('--ignoreFile <ignoreFile>', 'The file that is used to specify patterns that should be ignored during indexing', '.indexignore')
    .option('-v, --verbose', 'Generate verbose output during generation', false)
    .action(generateIndices);

export async function generateIndices(rootDirs: string[], options: GenerateIndexCmdOptions): Promise<void> {
    const dirs = rootDirs.map(rootDir => validateDirectory(path.resolve(rootDir)));
    const globby = await import('globby');
    const ignoreFilter = (pattern: string[], options: GlobbyOptions) => globby.globbySync(pattern, options);
    dirs.forEach(dir => generateIndex(dir, ignoreFilter, options));
}

export async function generateIndex(
    rootDir: string,
    ignoreFilter: (pattern: string[], options: GlobbyOptions) => string[],
    options: GenerateIndexCmdOptions
): Promise<void> {
    configureLogger(options.verbose);
    LOGGER.debug('Run generateIndex for', rootDir, 'with the following options:', options);
    sh.cd(rootDir);
    const cwd = process.cwd();

    // we want to match all given patterns and subdirectories and ignore all given patterns and (generated) index files
    const pattern = typeof options.match === 'boolean' ? ['**/'] : [...options.match, '**/'];
    const ignore = typeof options.ignore === 'boolean' ? ['**/index.ts'] : [...options.ignore, '**/index.ts'];
    const globbyOptions: GlobbyOptions = {
        ignore,
        cwd,
        onlyFiles: options.singleIndex,
        markDirectories: true, // directories have '/' at the end
        ignoreFiles: '**/' + options.ignoreFile // users can add this file in their directories to ignore files for indexing
    };
    LOGGER.debug('Search for children using the following globby options', globbyOptions);
    const files = ignoreFilter(pattern, globbyOptions);
    LOGGER.debug('All children considered in the input directory', files);

    const relativeRootDirectory = '';
    if (options.singleIndex) {
        writeIndex(relativeRootDirectory, files.filter(isFile), options);
    } else {
        // sort by length so we deal with sub-directories before we deal with their parents to determine whether they are empty
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
            LOGGER.info('Remove index file', indexFile);
            fs.rmSync(indexFile);
        }
        return;
    }
    const exists = fs.existsSync(indexFile);
    if (exists && !options.forceOverwrite) {
        LOGGER.info("Do not overwrite existing index file. Use '-f' to force an overwrite.", indexFile);
        return;
    }

    const headerContent = exists ? extractReusableContent(fs.readFileSync(indexFile, { encoding: 'utf-8' })) : '';
    const exportContent = exports.map(exported => createExport(directory, exported, options)).sort();
    const content = headerContent + exportContent.join(os.EOL) + os.EOL; // end with an empty line
    LOGGER.info((exists ? 'Overwrite' : 'Write') + ' index file', indexFile);
    LOGGER.debug('  ' + content.split(os.EOL).join(os.EOL + '  '));
    fs.writeFileSync(indexFile, content, { flag: 'w' });
}

export function createExport(directory: string, relativePath: string, options: GenerateIndexCmdOptions): string {
    // remove directory prefix, file extension and directory ending '/'
    const parentPrefix = directory.length;
    const suffix = isFile(relativePath) ? path.extname(relativePath).length : 1;
    const relativeName = relativePath.substring(parentPrefix, relativePath.length - suffix);
    const exportName = options.style === 'esm' && isFile(relativePath) ? relativeName + '.js' : relativeName;
    const exportLine = `export * from './${exportName}';`;
    return exportLine;
}

export function extractReusableContent(fileContent: string): string {
    // all code before any actual export lines are considered re-usable
    return fileContent.match(/^(.*?)(?=^export)/ms)?.[0] ?? '';
}
