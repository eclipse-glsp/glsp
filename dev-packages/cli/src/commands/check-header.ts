/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
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
import * as sh from 'shelljs';
import { baseCommand, configureShell, getShellConfig } from '../util/command-util';
import {
    getChangesOfLastCommit,
    getFirstCommit,
    getFirstModificationDate,
    getInitialCommit,
    getLastModificationDate,
    getUncommittedChanges
} from '../util/git-util';

import { LOGGER } from '../util/logger';
import { validateGitDirectory } from '../util/validation-util';
import path = require('path');
export interface HeaderCheckOptions {
    type: CheckType;
    exclude: string[];
    fileExtensions: string[];
    json: boolean;
    excludeDefaults: boolean;
    autoFix: boolean;
    severity: Severity;
}

const checkTypes = ['full', 'changes', 'lastCommit'] as const;
type CheckType = typeof checkTypes[number];

const severityTypes = ['error', 'warn', 'ok'] as const;

type Severity = typeof severityTypes[number];

const DEFAULT_EXCLUDES = ['**/@(node_modules|lib|dist|bundle)/**'];
const YEAR_RANGE_REGEX = /\d{4}(?:-d{4})?/g;
const HEADER_PATTERN = 'Copyright \\([cC]\\) \\d{4}(-d{4})?';
const AUTO_FIX_MESSAGE = 'Fix copyright header violations';

export const CheckHeaderCommand = baseCommand() //
    .name('checkHeaders')
    .description('Validates the copyright year range of license header files')
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
    .addOption(
        new Option('-s, --severity <severity>', 'The severity of validation results that should be printed.')
            .choices(severityTypes)
            .default('error', '"error" (only)')
    )
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
    return changedFiles;
}

function validate(rootDir: string, files: string[], options: HeaderCheckOptions): ValidationResult[] {
    // Derives all files with valid headers, their copyright years and all files with no or invalid headers
    const filesWithHeader = sh.grep('-l', HEADER_PATTERN, files).stdout.trim().split('\n');
    const copyrightYears = sh
        .grep(HEADER_PATTERN, files)
        .stdout.trim()
        .split('\n')
        .map(line => line.match(YEAR_RANGE_REGEX)!.map(string => Number.parseInt(string, 10)));
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
        results.push({ file: path.resolve(rootDir, file), violation: 'noOrMissingHeader', severity: 'error' });
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

        const result: DateValidationResult = {
            currentStartYear: copyrightYears[i].shift()!,
            expectedStartYear: getFirstModificationDate(file, rootDir, AUTO_FIX_MESSAGE)!.getFullYear(),
            currentEndYear: copyrightYears[i].shift(),
            expectedEndYear: defaultEndYear ?? getLastModificationDate(file, rootDir, AUTO_FIX_MESSAGE)!.getFullYear(),
            file,
            severity: 'ok',
            violation: 'none'
        };

        if (result.expectedStartYear === result.expectedEndYear) {
            validateSingleYear(result);
        } else {
            validateTimePeriod(result);
        }
        results.push(result);
    });

    results.sort((a, b) => a.file.localeCompare(b.file));

    process.stdout.clearLine(0);
    return results;
}

function validateSingleYear(result: DateValidationResult): void {
    const { currentStartYear, expectedStartYear, currentEndYear } = result;
    result.violation = 'invalidCopyrightYear';
    result.severity = 'error';

    if (!currentEndYear) {
        if (currentStartYear === expectedStartYear) {
            result.violation = 'none';
            result.severity = 'ok';
        }
        return;
    }

    // Cornercase: For files of the initial contribution the copyright header predates the first git modification date.
    // => declare as warning if not part of the initial contribution.
    if (expectedStartYear === currentEndYear && currentStartYear < expectedStartYear) {
        if (getFirstCommit(result.file) === getInitialCommit()) {
            result.violation = 'none';
            result.severity = 'ok';
        } else {
            result.severity = 'warn';
        }
    }
}

function validateTimePeriod(result: DateValidationResult): void {
    const { currentStartYear, expectedStartYear, expectedEndYear, currentEndYear } = result;

    result.violation = 'incorrectCopyrightPeriod';
    result.severity = 'error';
    if (!currentEndYear) {
        result.severity = 'error';
        return;
    }

    if (currentStartYear === expectedStartYear && currentEndYear === expectedEndYear) {
        result.violation = 'none';
        result.severity = 'ok';
        return;
    }

    // Cornercase: For files of the initial contribution the copyright header predates the first git modification date.
    // => declare as warning if not part of the initial contribution.
    if (currentEndYear === expectedEndYear && currentStartYear < expectedEndYear) {
        if (getFirstCommit(result.file) === getInitialCommit()) {
            result.violation = 'none';
            result.severity = 'ok';
        } else {
            result.severity = 'warn';
        }
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
    const violations = results.filter(result => result.severity === 'error');
    // Adjust results to print based on configured severity level
    let toPrint = results;
    if (options.severity === 'error') {
        toPrint = violations;
    } else if (options.severity === 'warn') {
        toPrint = results.filter(result => result.severity !== 'ok');
    }

    LOGGER.info(`Found ${toPrint.length} copyright header violations:`);
    LOGGER.newLine();

    toPrint.forEach((result, i) => LOGGER.info(`${i + 1}. `, result.file, ':', toPrintMessage(result)));

    LOGGER.newLine();

    if (options.json) {
        fs.writeFileSync(path.join(rootDir, 'headerCheck.json'), JSON.stringify(results, undefined, 2));
    }

    if (violations.length > 0 && (options.autoFix || readline.keyInYN('Do you want automatically fix copyright year range violations?'))) {
        const toFix = violations.filter(
            violation => violation.severity === 'error' && isDateValidationResult(violation)
        ) as DateValidationResult[];
        fixViolations(rootDir, toFix, options);
    }

    LOGGER.info('Check completed');
}

function toPrintMessage(result: ValidationResult): string {
    const colors: Record<Severity, string> = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        ok: '\x1b[32m'
    } as const;

    if (
        isDateValidationResult(result) &&
        (result.violation === 'incorrectCopyrightPeriod' || result.violation === 'invalidCopyrightYear')
    ) {
        const expected =
            result.expectedStartYear !== result.expectedEndYear
                ? `${result.expectedStartYear}-${result.expectedEndYear}`
                : result.expectedStartYear.toString();
        const actual = result.currentEndYear ? `${result.currentStartYear}-${result.currentEndYear}` : result.currentStartYear.toString();
        const message = result.violation === 'incorrectCopyrightPeriod' ? 'Invalid copyright period' : 'Invalid copyright year';
        return `${colors[result.severity]} ${message}! Expected '${expected}' but is '${actual}'`;
    } else if (result.violation === 'noOrMissingHeader') {
        return `${colors[result.severity]} No or invalid copyright header!`;
    }

    return `${colors[result.severity]} OK`;
}

function fixViolations(rootDir: string, violations: DateValidationResult[], options: HeaderCheckOptions): void {
    LOGGER.newLine();
    violations.forEach((violation, i) => {
        printFileProgress(i + 1, violations.length, `Fix ${violation.file}`, false);
        const fixedStartYear =
            violation.currentStartYear < violation.expectedStartYear ? violation.currentStartYear : violation.expectedStartYear;

        const currentRange = `${violation.currentStartYear}${violation.currentEndYear ? '-' + violation.currentEndYear : ''}`;

        let fixedRange = `${fixedStartYear}`;
        if (violation.expectedEndYear !== violation.expectedStartYear || fixedStartYear !== violation.expectedStartYear) {
            fixedRange = `${fixedStartYear}-${violation.expectedEndYear}`;
        }

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
    severity: Severity;
    violation: Violation;
}

interface DateValidationResult extends ValidationResult {
    currentStartYear: number;
    expectedStartYear: number;
    currentEndYear?: number;
    expectedEndYear: number;
}

function isDateValidationResult(object: ValidationResult): object is DateValidationResult {
    return 'currentStartYear' in object && 'expectedStartYear' in object && 'expectedEndYear' in object;
}

type Violation = 'none' | 'noOrMissingHeader' | 'incorrectCopyrightPeriod' | 'invalidCopyrightYear';
