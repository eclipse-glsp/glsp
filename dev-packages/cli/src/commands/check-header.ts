/********************************************************************************
 * Copyright (c) 2022-2024 EclipseSource and others.
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
/* eslint-disable max-len */
import { Option } from 'commander';
import * as fs from 'fs';
import { glob } from 'glob';
import * as minimatch from 'minimatch';
import * as readline from 'readline-sync';
import sh from 'shelljs';
import { baseCommand, configureShell, getShellConfig } from '../util/command-util';
import { getChangesOfLastCommit, getLastModificationDate, getUncommittedChanges } from '../util/git-util';

import * as path from 'path';
import { LOGGER } from '../util/logger';
import { validateGitDirectory } from '../util/validation-util';

export interface HeaderCheckOptions {
    type: CheckType;
    exclude: string[];
    fileExtensions: string[];
    json: boolean;
    excludeDefaults: boolean;
    autoFix: boolean;
}

const checkTypes = ['full', 'changes', 'lastCommit'] as const;
type CheckType = (typeof checkTypes)[number];

const DEFAULT_EXCLUDES = ['**/@(node_modules|lib|dist|bundle)/**'];
const YEAR_RANGE_REGEX = /\d{4}/g;
const HEADER_PATTERN = 'Copyright \\([cC]\\) \\d{4}';
const AUTO_FIX_MESSAGE = 'Fix copyright header violations';

export const CheckHeaderCommand = baseCommand() //
    .name('checkHeaders')
    .description('Validates the copyright year range (end year) of license header files')
    .argument('<rootDir>', 'The starting directory for the check', validateGitDirectory)
    .addOption(
        new Option(
            '-t, --type <type>',
            'The scope of the check. In addition to a full recursive check, is also possible to only' +
                ' consider pending changes or the last commit'
        )
            .choices(checkTypes)
            .default('full')
    )
    .option('-f, --fileExtensions <extensions...>', 'File extensions that should be checked', ['ts', 'tsx'])
    .addOption(
        new Option(
            '-e, --exclude <exclude...>',
            'File patterns that should be excluded from the check. New exclude patterns are added to the default patterns'
        ).default([], `[${DEFAULT_EXCLUDES}]`)
    )
    .option(
        '--no-exclude-defaults',
        'Disables the default excludes patterns. Only explicitly passed exclude patterns (-e, --exclude) are considered'
    )
    .option('-j, --json', 'Also persist validation results as json file', false)
    .option('-a, --autoFix', 'Auto apply & commit fixes without prompting the user', false)
    .action(checkHeaders);

export function checkHeaders(rootDir: string, options: HeaderCheckOptions): void {
    configureShell({ silent: true, fatal: true });

    if (options.excludeDefaults) {
        options.exclude.push(...DEFAULT_EXCLUDES);
    }

    sh.cd(rootDir);
    const files = getFiles(rootDir, options);
    LOGGER.info(`Check copy right headers of ${files.length} files`);
    if (files.length === 0) {
        LOGGER.info('Check completed');
        return;
    }
    const results = validate(rootDir, files, options);
    handleValidationResults(rootDir, results, options);
}

function getFiles(rootDir: string, options: HeaderCheckOptions): string[] {
    const includePattern = `**/*.@(${options.fileExtensions.join('|')})`;
    const excludePattern = options.exclude;

    if (options.type === 'full') {
        return glob.sync(includePattern, {
            cwd: rootDir,
            ignore: excludePattern
        });
    }

    let changedFiles = options.type === 'changes' ? getUncommittedChanges(rootDir) : getChangesOfLastCommit(rootDir);
    changedFiles = changedFiles.filter(minimatch.filter(includePattern));

    excludePattern.forEach(pattern => {
        changedFiles = changedFiles.filter(minimatch.filter(`!${pattern}`));
    });
    return changedFiles.filter(file => fs.existsSync(file));
}

function validate(rootDir: string, files: string[], options: HeaderCheckOptions): ValidationResult[] {
    // Derives all files with valid headers and all files with no or invalid headers
    const filesWithHeader = sh.grep('-l', HEADER_PATTERN, files).stdout.trim().split('\n');
    const noHeaders = files.filter(file => !filesWithHeader.includes(file));

    const results: ValidationResult[] = [];
    const allFilesLength = files.length;

    // Create validation results for all files with no or invalid headers
    const noHeadersLength = noHeaders.length;
    if (noHeadersLength > 0) {
        LOGGER.info(`Found ${noHeadersLength} files with no (or an invalid) copyright header`);
    }
    noHeaders.forEach((file, i) => {
        printFileProgress(i + 1, allFilesLength, `Validating ${file}`);
        results.push({ file: path.resolve(rootDir, file), violation: 'noOrMissingHeader' });
    });

    // Performance optimization: avoid retrieving the dates for each individual file by precalculating the endYear if possible.
    let defaultEndYear: number | undefined;
    if (options.type === 'changes') {
        defaultEndYear = new Date().getFullYear();
    } else if (options.type === 'lastCommit') {
        defaultEndYear = getLastModificationDate(undefined, rootDir)?.getFullYear();
    }

    // Create validation results for all files with valid headers
    filesWithHeader.forEach((file, i) => {
        printFileProgress(i + 1 + noHeadersLength, allFilesLength, `Validating ${file}`);
        const copyrightLine = sh.head({ '-n': 2 }, file).stdout.trim().split('\n')[1];
        const copyRightYears = copyrightLine.match(YEAR_RANGE_REGEX)!;
        if (!copyRightYears) {
            const result: ValidationResult = { file, violation: 'noYear', line: copyrightLine };
            results.push(result);
        } else {
            const currentStartYear = Number.parseInt(copyRightYears[0], 10);
            const currentEndYear = copyRightYears[1] ? Number.parseInt(copyRightYears[1], 10) : undefined;
            const result: DateValidationResult = {
                currentStartYear,
                currentEndYear,
                expectedEndYear: defaultEndYear ?? getLastModificationDate(file, rootDir, AUTO_FIX_MESSAGE)!.getFullYear(),
                file,
                violation: 'none'
            };
            validateEndYear(result);
            results.push(result);
        }
    });

    results.sort((a, b) => a.file.localeCompare(b.file));

    process.stdout.clearLine(0);
    return results;
}

function validateEndYear(result: DateValidationResult): void {
    const { currentStartYear, expectedEndYear, currentEndYear } = result;
    result.violation = 'invalidEndYear';

    const valid = currentEndYear ? currentEndYear === expectedEndYear : currentStartYear === expectedEndYear;

    if (valid) {
        result.violation = 'none';
        return;
    }
}

function printFileProgress(currentFileCount: number, maxFileCount: number, message: string, clear = true): void {
    if (clear) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }
    process.stdout.write(`[${currentFileCount} of ${maxFileCount}] ${message}`);
    if (!clear) {
        process.stdout.write('\n');
    }
}

export function handleValidationResults(rootDir: string, results: ValidationResult[], options: HeaderCheckOptions): void {
    LOGGER.newLine();
    LOGGER.info(`Header validation for ${results.length} files completed`);
    const violations = results.filter(result => result.violation !== 'none');
    // Adjust results to print based on configured severity level
    const toPrint = violations;

    LOGGER.info(`Found ${toPrint.length} copyright header violations:`);
    LOGGER.newLine();

    toPrint.forEach((result, i) => LOGGER.info(`${i + 1}. `, result.file, ':', toPrintMessage(result)));

    LOGGER.newLine();

    if (options.json) {
        fs.writeFileSync(path.join(rootDir, 'headerCheck.json'), JSON.stringify(results, undefined, 2));
    }

    if (
        violations.length > 0 &&
        (options.autoFix || readline.keyInYN('Do you want to automatically fix copyright year range violations?'))
    ) {
        const toFix = violations.filter(violation => isDateValidationResult(violation)) as DateValidationResult[];
        fixViolations(rootDir, toFix, options);
    }

    LOGGER.info('Check completed');
}

function toPrintMessage(result: ValidationResult): string {
    const error = '\x1b[31m';
    const info = '\x1b[32m';

    if (isDateValidationResult(result) && result.violation === 'invalidEndYear') {
        const expected = result.expectedEndYear.toString();
        const actual = result.currentEndYear
            ? `${result.currentEndYear} (${result.currentStartYear}-${result.currentEndYear})`
            : result.currentStartYear.toString();
        const message = 'Invalid copyright end year';
        return `${error} ${message}! Expected end year '${expected}' but is '${actual}'`;
    } else if (result.violation === 'noOrMissingHeader') {
        return `${error} No or invalid copyright header!`;
    } else if (result.violation === 'noYear') {
        return `${error} No year found!${result.line ? ' (line: ' + result.line + ')' : ''}`;
    }

    return `${info} OK`;
}

function fixViolations(rootDir: string, violations: DateValidationResult[], options: HeaderCheckOptions): void {
    LOGGER.newLine();
    violations.forEach((violation, i) => {
        printFileProgress(i + 1, violations.length, `Fix ${violation.file}`, false);

        const currentRange = `${violation.currentStartYear}${violation.currentEndYear ? '-' + violation.currentEndYear : ''}`;
        const fixedRange =
            violation.currentEndYear || violation.currentStartYear < violation.expectedEndYear
                ? `${violation.currentStartYear}-${violation.expectedEndYear}`
                : `${violation.expectedEndYear}`;

        sh.sed('-i', RegExp('Copyright \\([cC]\\) ' + currentRange), `Copyright (c) ${fixedRange}`, violation.file);
    });
    LOGGER.newLine();
    if (options.autoFix || readline.keyInYN('Do you want to create a commit for the fixed files?')) {
        LOGGER.newLine();
        const files = violations.map(violation => violation.file).join(' ');
        sh.exec(`git add ${files}`, getShellConfig());
        sh.exec(`git commit -m "${AUTO_FIX_MESSAGE}"`);
        LOGGER.newLine();
    }
}

// Helper types
interface ValidationResult {
    file: string;
    violation: Violation;
    line?: string;
}

interface DateValidationResult extends ValidationResult {
    currentStartYear: number;
    currentEndYear?: number;
    expectedEndYear: number;
}

function isDateValidationResult(object: ValidationResult): object is DateValidationResult {
    return 'currentStartYear' in object && 'expectedEndYear' in object;
}

type Violation = 'none' | 'noOrMissingHeader' | 'invalidEndYear' | 'noYear';
