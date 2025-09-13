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
import { globSync } from 'glob';
import * as os from 'os';
import * as path from 'path';
/**
 * Moves files or directories from source to destination.
 * @param source The source file or directory to move
 * @param destination  The destination path
 * @throws Error if moving fails
 */
export function moveFile(src: string, dest: string): void {
    const source = path.resolve(src);
    const destination = path.resolve(dest);

    try {
        let finalDest = destination;
        if (fs.existsSync(destination) && fs.statSync(destination).isDirectory()) {
            const fileName = path.basename(source);
            finalDest = path.join(destination, fileName);
        }

        fs.renameSync(source, finalDest);
    } catch (error) {
        throw new Error(`Failed to move ${source} to ${destination}`);
    }
}

/**
 * Configuration for restricting the lines read from a file.
 */
export interface ReadFileOptions {
    /** The starting line number */
    startLine?: number;
    /** The ending line number */
    endLine?: number;
}
/**
 * Reads the content of a file. Optionally, a range of lines can be specified.
 * @param filePath The path to the file to read
 * @param options Options to restrict the lines read from the file
 * @returns The content of the file or the specified range of lines
 * @throws Error if the file does not exist or is a directory
 */
export function readFile(filePath: string, options: ReadFileOptions = {}): string {
    const file = path.resolve(filePath);
    if (!fs.existsSync(file)) {
        throw new Error(`no such file or directory: ${file}`);
    }
    const stats = fs.statSync(file);
    if (stats.isDirectory()) {
        throw new Error(`error reading '${file}': Is a directory`);
    }

    if (!options.startLine && !options.endLine) {
        return fs.readFileSync(file, 'utf8');
    }

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const start = options.startLine && options.startLine > 0 ? options.startLine - 1 : 0;
    const end = options.endLine && options.endLine > 0 ? options.endLine : lines.length;
    return lines.slice(start, end).join(os.EOL);
}

/**
 * Deletes a file or directory.
 * @param filePath The path to the file or directory to delete
 * @throws Error if the file or directory does not exist or deletion fails
 */
export function deleteFile(filePath: string): void {
    const file = path.resolve(filePath);
    if (!fs.existsSync(file)) {
        throw new Error(`no such file or directory: ${file}`);
    }
    try {
        const stats = fs.statSync(file);
        if (stats.isDirectory()) {
            fs.rmdirSync(file, { recursive: true });
        } else {
            fs.unlinkSync(file);
        }
    } catch (error) {
        throw new Error(`Failed to delete file or directory: ${file}`);
    }
}

/**
 * Writes content to a file, creating or overwriting it.
 * @param filePath The path to the file to write
 * @param content The content to write to the file
 * @throws Error if writing to the file fails
 */
export function writeFile(filePath: string, content: string): void {
    const file = path.resolve(filePath);
    try {
        fs.writeFileSync(file, content, 'utf8');
    } catch (error) {
        throw new Error(`Failed to write to file: ${file}`);
    }
}

/**
 * Resolves the given file(s) or directory(ies) to absolute paths.
 * @param files The file(s) or directory(ies) to resolve
 * @returns The resolved absolute paths
 */
export function resolveFiles(files: string[] | string): string[] {
    const filesArray = Array.isArray(files) ? files : [files];
    return filesArray.map(f => path.resolve(f));
}

/**
 * Finds all files and directories matching the given pattern.
 * @param paths The file or directory paths to search. If a path is a directory, all
 *  files and directories within it are included recursively.
 * @param pattern A glob pattern to match files and directories (default: '**\/*')
 * @returns An array of matching file and directory paths.
 */
export function findFiles(paths: string[] | string, pattern = '**/*'): string[] {
    const results: string[] = [];
    const resolvedPaths = resolveFiles(paths);

    for (const inputPath of resolvedPaths) {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`no such file or directory: ${inputPath}`);
        }

        // If it's a directory, find all files and directories recursively
        if (fs.statSync(inputPath).isDirectory()) {
            const matches = globSync(pattern, {
                cwd: inputPath,
                absolute: true,
                dot: false
                // Note: no nodir option, so it includes both files and directories
            });

            results.push(...matches);
        }
    }

    return results;
}

/**
 * Filters the given files, returning only those whose contents match the specified pattern.
 * @param files A single file path or an array of file paths to filter
 * @param pattern A string or RegExp pattern to match against file contents
 * @returns An array of file paths whose contents match the pattern
 * @throws Error if reading a file fails
 */
export function filterFiles(files: string[] | string, pattern: RegExp | string): string[] {
    const matchingFiles: string[] = [];
    const filesArray = resolveFiles(files);
    for (const file of filesArray) {
        try {
            if (!fs.existsSync(file)) {
                continue; // Skip non-existent files
            }

            const contents = fs.readFileSync(file, 'utf8');
            if (contents.match(pattern)) {
                matchingFiles.push(file);
            }
        } catch (error) {
            // Skip files that can't be read
            continue;
        }
    }

    return matchingFiles;
}

/** Replaces occurrences of a pattern in the contents of the specified files.
 * @param pattern A string or RegExp pattern to search for
 * @param replacement The string to replace matches with
 * @param files A single file path or an array of file paths to process
 * @throws Error if reading or writing a file fails
 */
export function replaceInFile(files: string[] | string, pattern: RegExp | string, replacement: string): void {
    const filesArray = resolveFiles(files);
    for (const file of filesArray) {
        if (!fs.existsSync(file)) {
            throw new Error(`no such file or directory: ${file}`);
        }

        const stats = fs.statSync(file);
        if (stats.isDirectory()) {
            throw new Error(`error reading '${file}': Is a directory`);
        }

        const content = fs.readFileSync(file, 'utf8');

        const newContent = content.replace(pattern, replacement);
        fs.writeFileSync(file, newContent, 'utf8');
    }
}

export function readJson<T>(jsonPath: string): T {
    const filePath = path.resolve(jsonPath);
    const content = readFile(filePath);
    try {
        return JSON.parse(content) as T;
    } catch (err) {
        throw new Error(`Failed to parse JSON file: ${filePath}`);
    }
}

export function writeJson(jsonPath: string, data: unknown): void {
    const filePath = path.resolve(jsonPath);
    const content = JSON.stringify(data, undefined, 2) + '\n';
    writeFile(filePath, content);
}
