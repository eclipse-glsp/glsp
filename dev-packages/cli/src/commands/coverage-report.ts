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

import * as fs from 'fs';
import * as path from 'path';
import {
    LOGGER,
    PackageHelper,
    baseCommand,
    cd,
    exec,
    execAsync,
    findFiles,
    getYarnWorkspacePackages,
    moveFile,
    validateDirectory
} from '../util';

export interface CoverageCmdOptions {
    coverageScript: string;
    projectRoot: string;
}

export const CoverageReportCommand = baseCommand() //
    .name('coverageReport')
    .description('Generate a test coverage report for a glsp component')
    .option('-p, --projectRoot <projectRoot>', 'The root directory of the GLSP component', validateDirectory, process.cwd())
    .option('-c, --coverageScript <script>', 'Script command of the package root for creating coverage reports', 'test:coverage')
    .action(generateCoverageReport);

/**
 * Generates and aggregates an 'nyc' coverage report for lerna/yarn mono repositories.
 * First, individual reports for each package are generated. Then, they are aggregated into one combined HTML report.
 * @param options configuration options
 */
export async function generateCoverageReport(options: CoverageCmdOptions): Promise<void> {
    cd(options.projectRoot);
    const packages = validateAndRetrievePackages(options);
    const jsonReports = await collectPackageReportFiles(packages, options);
    combineReports(jsonReports, options);
    LOGGER.info('Coverage reported generation successful');
    LOGGER.info(`HTML report available at: ${options.projectRoot}/coverage/index.html`);
}

export function validateAndRetrievePackages(options: CoverageCmdOptions): PackageHelper[] {
    exec('yarn nyc -h', { silent: true, errorMsg: 'Nyc is not installed!' });

    const workspacePackages = getYarnWorkspacePackages(options.projectRoot, true);

    const rootPackage = workspacePackages.pop()!;
    if (!rootPackage.hasScript(options.coverageScript)) {
        CoverageReportCommand.error(
            `Invalid coverage script! The root package.json does not have a script with name '${options.coverageScript}'!`
        );
    }
    return workspacePackages;
}

export async function collectPackageReportFiles(packages: PackageHelper[], options: CoverageCmdOptions): Promise<string[]> {
    LOGGER.info('Create individual package coverage reports');
    await execAsync(`yarn ${options.coverageScript}`, { silent: false });
    const reports: string[] = packages.flatMap(pkg => findFiles(pkg.location, '**/coverage-final.json'));
    LOGGER.info(`Collected ${reports.length} coverage reports from ${packages.length} packages`);
    return reports;
}

async function combineReports(reportFiles: string[], options: CoverageCmdOptions): Promise<void> {
    LOGGER.info('Create combined coverage report');
    //  Copy coverage into root/.nyc_output
    const reportsDir = path.join(options.projectRoot, '.nyc_output');
    if (fs.existsSync(reportsDir)) {
        fs.rmSync(reportsDir, { force: true, recursive: true });
    }
    fs.mkdirSync(reportsDir);

    for (let i = 0; i < reportFiles.length; i++) {
        fs.copyFileSync(reportFiles[i], path.resolve('.nyc_output', `coverage-final-${i}.json`));
    }

    // Temporarily remove root nyc configs otherwise the report command might fail.
    cd(options.projectRoot);
    const configFiles = ['.nycrc', '.nycrc.json', '.nyc-config.js'];
    const tempFiles: string[] = [];
    configFiles.forEach(config => {
        if (fs.existsSync(path.join(options.projectRoot, config))) {
            moveFile(config, '_' + config);
            tempFiles.push('_' + config);
        }
    });

    // Generate report
    await execAsync('yarn nyc report --reporter html', { silent: false });

    // Restore nyc configs (if any)
    tempFiles.forEach(config => moveFile(config, config.substring(1)));
}
