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

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { globSync } from 'glob';
import * as path from 'path';

export class ExecError extends Error {
    constructor(message: string, readonly nestedError?: Error) {
        super(message);
        this.name = 'ExecError';
    }
}

export interface ExecConfig {
    /**
     * Suppresses all command output if true. Default is false.
     */
    silent: boolean;

    /**
     * If true the script will die on errors. Default is false.
     */
    fatal: boolean;

    /**
     * Will print each executed command to the screen.
     *
     * @default false
     */
    verbose: boolean;
}

const defaultExecConfig: ExecConfig = {
    silent: false,
    fatal: false,
    verbose: false
} as const;

const globalExecConfig: ExecConfig = { ...defaultExecConfig };

export function setExecConfig(options: Partial<ExecConfig>): void {
    if (options.silent !== undefined) {
        globalExecConfig.silent = options.silent;
    }
    if (options.fatal !== undefined) {
        globalExecConfig.fatal = options.fatal;
    }
    if (options.verbose !== undefined) {
        globalExecConfig.verbose = options.verbose;
    }
}
export function resetExecConfig(): void {
    globalExecConfig.silent = defaultExecConfig.silent;
    globalExecConfig.fatal = defaultExecConfig.fatal;
    globalExecConfig.verbose = defaultExecConfig.verbose;
}

/**
 * Options for the {@link ShellHelper.exec} method.
 */
export interface ExecOptions {
    /** If true, do not print command output*/
    silent?: boolean;
    /** If true, program terminates on errors*/
    fatal?: boolean;
    /** Current working directory of the command */
    cwd?: string;
    /** Custom error message that should be thrown if the command fails */
    errorMsg?: string;
}

/**
 * Executes the given command synchronously.
 * If `silent` is true, command output is suppressed.
 * If `fatal` is true, the process exits on error.
 * @param cmd  The command to execute
 * @param options
 * @returns The command output as string
 * @throws Error if the command fails and `fatal` is false
 */

export function exec(cmd: string, options: ExecOptions = {}): string {
    // Merge global config with local options (local options take precedence)
    const silent = options.silent !== undefined ? options.silent : globalExecConfig.silent;
    const fatal = options.fatal !== undefined ? options.fatal : globalExecConfig.fatal;
    const { cwd } = options;

    // Log command if verbose mode is enabled
    if (globalExecConfig.verbose) {
        console.log(`+ ${cmd}`);
    }

    const [command, ...args] = cmd.split(' ');

    const result = spawnSync(command, args, {
        encoding: 'utf8',
        shell: true,
        cwd,
        stdio: silent ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });

    if (result.error || result.status !== 0) {
        const errorMsg = `Command failed: ${cmd}\n${result.stderr || ''}`.trim();
        if (fatal) {
            // Print error and exit the process
            console.error(errorMsg);
            process.exit(result.status ?? 1);
        } else {
            throw new ExecError(options.errorMsg ?? errorMsg, result.error);
        }
    }
    return result.stdout ? result.stdout.toString().trim() : '';
}

/**
 * Moves files or directories from source to destination.
 * @param source The source file(s) or directory(ies) to move
 * @param dest  The destination path
 * @throws Error if moving fails
 */
export function mv(source: string | string[], dest: string): void {
    const sources = resolveFiles(source);

    // If multiple sources, destination must be a directory
    if (sources.length > 1) {
        if (!fs.existsSync(dest) || !fs.statSync(dest).isDirectory()) {
            throw new Error(`When moving multiple files, destination must be an existing directory: ${dest}`);
        }
    }

    for (const src of sources) {
        try {
            let finalDest = dest;

            // If destination is a directory, move source into it (like shell mv behavior)
            if (fs.existsSync(dest) && fs.statSync(dest).isDirectory()) {
                const fileName = path.basename(src);
                finalDest = path.join(dest, fileName);
            }

            fs.renameSync(src, finalDest);
        } catch (error) {
            throw new Error(`Failed to move ${src} to ${dest}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Finds all files and directories matching the given paths.
 * @param paths The file or directory paths to search. If a path is a directory, all
 *  files and directories within it are included recursively.
 * @returns An array of matching file and directory paths.
 */
export function find(...paths: string[]): string[] {
    const results: string[] = [];
    const resolvedPaths = resolveFiles(paths);

    for (const inputPath of resolvedPaths) {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`no such file or directory: ${inputPath}`);
        }

        // Add the path itself first (like ShellJS does)
        results.push(inputPath);

        // If it's a directory, find all files and directories recursively
        if (fs.statSync(inputPath).isDirectory()) {
            const matches = globSync('**/*', {
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
 * Changes the current working directory to the specified path.
 * @param dir The directory to change to
 * @returns The new current working directory
 * @throws Error if changing directory fails
 */
export function cd(dir: string): string {
    try {
        process.chdir(dir);
        return process.cwd();
    } catch (error) {
        throw new Error(`Failed to change directory to ${dir}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Returns the current working directory.
 * @returns The current working directory
 */
export function pwd(): string {
    return process.cwd();
}

/**
 * Read the first n lines of a file.
 * @param file The file to read from
 * @param n The number of lines to read (default: 10)
 * @returns An array of the first n lines
 * @throws Error if reading fails
 */
export function head(file: string, n = 10): string[] {
    const resolvedFile = path.resolve(file);

    if (!fs.existsSync(resolvedFile)) {
        throw new Error(`no such file or directory: ${resolvedFile}`);
    }

    const stats = fs.statSync(resolvedFile);
    if (stats.isDirectory()) {
        throw new Error(`error reading '${resolvedFile}': Is a directory`);
    }

    const contents = fs.readFileSync(resolvedFile, 'utf8');
    const lines = contents.split('\n');

    return lines.slice(0, n);
}

/**
 * Read the last n lines of a file.
 * @param file The file to read from
 * @param n The number of lines to read (default: 10)
 * @returns An array of the last n lines
 * @throws Error if reading fails
 */
export function tail(file: string, n = 10): string[] {
    const resolvedFile = path.resolve(file);
    if (!fs.existsSync(resolvedFile)) {
        throw new Error(`no such file or directory: ${resolvedFile}`);
    }

    const stats = fs.statSync(resolvedFile);
    if (stats.isDirectory()) {
        throw new Error(`error reading '${resolvedFile}': Is a directory`);
    }

    const contents = fs.readFileSync(resolvedFile, 'utf8');
    const lines = contents.split('\n');

    return lines.slice(-Math.abs(n));
}

/**
 * Filters the given files, returning only those whose contents match the specified pattern.
 * @param pattern A string or RegExp pattern to match against file contents
 * @param files A single file path or an array of file paths to filter
 * @returns An array of file paths whose contents match the pattern
 * @throws Error if reading a file fails
 */
export function filter(pattern: RegExp | string, files: string[] | string): string[] {
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
export function replace(pattern: RegExp | string, replacement: string, files: string[] | string): void {
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

export function resolveFiles(files: string[] | string): string[] {
    const filesArray = Array.isArray(files) ? files : [files];
    return filesArray.map(f => path.resolve(f));
}
