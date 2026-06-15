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

import { Argument } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
    LOGGER,
    PackageManager,
    baseCommand,
    detectPackageManager,
    execAsync,
    execBinCommand,
    getWorkspacePackages,
    validateGitDirectory
} from '../../util';
import { configureEnv, deriveCanaryVersion, getVersionFromPackage, isNextVersion, npmVersionExists } from './common';

export type PublishDistTag = 'next' | 'latest';

export interface PublishCmdOptions {
    verbose: boolean;
    repoDir: string;
    dryRun: boolean;
    registry?: string;
}

export const PublishCommand = baseCommand()
    .name('publish')
    .description('Publish all workspace packages of a GLSP repository (pnpm: `pnpm publish`, yarn/lerna: `lerna publish`)')
    .addArgument(new Argument('<distTag>', 'The npm dist-tag to publish under').choices(['next', 'latest']))
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('-r, --repoDir <repoDir>', 'Path to the component repository', validateGitDirectory, process.cwd())
    .option('--dry-run', 'Derive versions and run `pnpm publish` in dry-run mode without applying changes', false)
    .option('--registry <url>', 'Publish to a custom npm registry (e.g. a local verdaccio for testing)')
    .action((distTag: PublishDistTag, cmdOptions: PublishCmdOptions) => {
        configureEnv(cmdOptions);
        return publish(distTag, cmdOptions);
    });

/**
 * Publishes all (public) workspace packages of a GLSP repository, dispatching on the detected
 * package manager so that pnpm-based and not-yet-migrated yarn/lerna-based repositories are both
 * supported during the migration period.
 * - `next`: applies a canary version (`<root-version>.<commits-since-last-tag>`) and publishes it
 *    under the `next` dist-tag.
 * - `latest`: publishes the current package versions under the `latest` dist-tag. Already published
 *    versions are skipped.
 *
 * For pnpm repositories publishing is delegated to `pnpm publish -r` (so that `workspace:` ranges are
 * rewritten to exact versions); for yarn/lerna repositories it falls back to the legacy `lerna publish`.
 * In both cases npm provenance/trusted publishing (configured via environment) is preserved.
 */
export async function publish(distTag: PublishDistTag, options: PublishCmdOptions): Promise<void> {
    const packageManager = detectPackageManager(options.repoDir);
    LOGGER.info(`Publish workspace packages of '${options.repoDir}' with dist-tag '${distTag}' (package manager: ${packageManager})`);
    if (packageManager !== 'pnpm') {
        return publishWithLerna(distTag, packageManager, options);
    }
    if (distTag === 'next') {
        return publishNext(options);
    }
    return publishLatest(options);
}

/**
 * Legacy publishing path for yarn/lerna-based repositories that have not been migrated to pnpm yet.
 * Mirrors the former root `package.json` `publish:next`/`publish:latest` scripts; `lerna` itself derives
 * the canary version (for `next`) and skips already-published versions (for `latest`). The `lerna` binary
 * is resolved from the repository's `node_modules` via the detected package manager.
 */
async function publishWithLerna(distTag: PublishDistTag, packageManager: PackageManager, options: PublishCmdOptions): Promise<void> {
    if (options.dryRun) {
        throw new Error("'--dry-run' is only supported for pnpm-based repositories ('lerna publish' has no dry-run mode).");
    }
    const lernaArgs =
        distTag === 'next'
            ? 'publish preminor --exact --canary --preid next --dist-tag next --no-git-tag-version --no-push --ignore-scripts --yes'
            : 'publish from-package --no-git-reset -y';
    let cmd = `${execBinCommand(packageManager, 'lerna')} ${lernaArgs}`;
    if (options.registry) {
        cmd += ` --registry ${options.registry}`;
    }
    await execAsync(cmd, { cwd: options.repoDir, silent: false, errorMsg: 'lerna publish failed' });
}

async function publishNext(options: PublishCmdOptions): Promise<void> {
    const canary = deriveCanaryVersion(options.repoDir);
    if (!isNextVersion(canary.base)) {
        throw new Error(`The root package version '${canary.base}' is not a next version. Cannot publish a 'next' canary release.`);
    }
    LOGGER.info(`Applying canary version ${canary.version} (base: ${canary.base}, ${canary.commitCount} commits since ${canary.lastTag})`);

    // Only the workspace packages get the canary version; the root keeps the plain base version.
    // workspace:* dependency ranges are resolved to the exact canary version by pnpm on publish.
    const packages = getWorkspacePackages(options.repoDir);
    packages.forEach(pkg => {
        if (options.dryRun) {
            LOGGER.info(`[dry-run] Would set version of ${pkg.name} to ${canary.version}`);
            return;
        }
        LOGGER.debug(`Set version of ${pkg.name} to ${canary.version}`);
        pkg.content.version = canary.version;
        pkg.write();
    });

    await pnpmPublish('next', options);
}

async function publishLatest(options: PublishCmdOptions): Promise<void> {
    const version = getVersionFromPackage(options.repoDir);
    if (isNextVersion(version)) {
        throw new Error(`The root package version '${version}' is a next version. Refusing to publish under the 'latest' dist-tag.`);
    }

    const publicPackages = getWorkspacePackages(options.repoDir).filter(pkg => !pkg.content.private);
    const unpublished = publicPackages.filter(pkg => {
        if (npmVersionExists(pkg.name, pkg.content.version)) {
            LOGGER.info(`Skipping ${pkg.name}@${pkg.content.version} - already published`);
            return false;
        }
        return true;
    });
    if (unpublished.length === 0) {
        LOGGER.warn('All package versions are already published. Nothing to publish.');
        return;
    }
    LOGGER.info(`Publishing ${unpublished.length} of ${publicPackages.length} public packages`);

    await pnpmPublish('latest', options);
}

async function pnpmPublish(distTag: PublishDistTag, options: PublishCmdOptions): Promise<void> {
    let cmd = `pnpm publish -r --tag ${distTag} --no-git-checks --report-summary`;
    if (options.dryRun) {
        cmd += ' --dry-run';
    }
    if (options.registry) {
        cmd += ` --registry ${options.registry}`;
    }
    // plain env passthrough preserves NPM_CONFIG_PROVENANCE and the OIDC token for trusted publishing
    await execAsync(cmd, { cwd: options.repoDir, silent: false, errorMsg: 'pnpm publish failed' });
    reportPublishSummary(options);
}

function reportPublishSummary(options: PublishCmdOptions): void {
    const summaryPath = path.resolve(options.repoDir, 'pnpm-publish-summary.json');
    if (!fs.existsSync(summaryPath)) {
        LOGGER.warn('No pnpm publish summary found.');
        return;
    }
    try {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
            publishedPackages?: { name: string; version: string }[];
        };
        const published = summary.publishedPackages ?? [];
        if (published.length === 0) {
            LOGGER.warn('No packages were published.');
        } else {
            LOGGER.info(`Published ${published.length} packages:`);
            published.forEach(pkg => LOGGER.info(` - ${pkg.name}@${pkg.version}`));
        }
    } finally {
        fs.rmSync(summaryPath, { force: true });
    }
}
