/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import sh from 'shelljs';
import { baseCommand, fatalExec, getShellConfig } from '../util/command-util';
import { LOGGER } from '../util/logger';
import { validateDirectory } from '../util/validation-util';

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
export function generateCoverageReport(options: CoverageCmdOptions): void {
    sh.cd(options.projectRoot);
    const packages = validateAndRetrievePackages(options);
    LOGGER.info('Create individual package coverage reports');
    const jsonReports = collectPackageReportFiles(packages, options);
    combineReports(jsonReports, options);
    LOGGER.info('Coverage reported generation successful');
}

export function validateAndRetrievePackages(options: CoverageCmdOptions): string[] {
    const packagePath = path.join(options.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
        CoverageReportCommand.error(`Invalid root directory. '${options.projectRoot}' does not contain a package.json.`);
    }

    fatalExec('yarn nyc -h', 'Nyc is not installed!', getShellConfig({ silent: true }));

    const packageJson = JSON.parse(fs.readFileSync(packagePath).toString());

    if (!packageJson?.scripts?.[options.coverageScript]) {
        CoverageReportCommand.error(
            `Invalid coverage script! The package.json does not have a script with name '${options.coverageScript}'!`
        );
    }

    if (!Array.isArray(packageJson.workspaces)) {
        CoverageReportCommand.error('Invalid package.json! No yarn workspaces are configured!');
    }
    return (packageJson.workspaces as string[]).map(pkg => pkg.replace('/*', ''));
}

export function collectPackageReportFiles(packages: string[], options: CoverageCmdOptions): string[] {
    LOGGER.info('Create combined report');
    sh.exec(`yarn ${options.coverageScript}`);
    // collect reports
    const reports: string[] = [];
    packages.forEach(pkg => {
        sh.find(pkg)
            .filter(file => file.endsWith('coverage-final.json'))
            .forEach(json => reports.push(path.resolve(options.projectRoot, json)));
    });
    return reports;
}

function combineReports(reportFiles: string[], options: CoverageCmdOptions): void {
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
    sh.cd(options.projectRoot);
    const configFiles = ['.nycrc', '.nycrc.json', '.nyc-config.js'];
    const tempFiles: string[] = [];
    configFiles.forEach(config => {
        if (fs.existsSync(path.join(options.projectRoot, config))) {
            sh.mv(config, '_' + config);
            tempFiles.push('_' + config);
        }
    });

    // Generate report
    sh.exec('yarn nyc report --reporter html', getShellConfig());

    // Restore nyc configs (if any)
    tempFiles.forEach(config => sh.mv(config, config.substring(1)));
}
