#!/usr/bin/env node
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
import { Argument, Command } from 'commander';
import * as sh from 'shelljs';
import { Component, ReleaseType } from './release/common';
import { release } from './release/release';
import { baseConfiguration } from './util/command-util';
import { validateDirectory, validateVersion } from './util/validation-util';

export const ReleaseCommand = baseConfiguration(new Command())
    .name('release')
    .description('Prepare & publish a new release for a glsp component')
    .addArgument(new Argument('<component>', 'The glsp component to be released').choices(Component.CLI_CHOICES).argParser(Component.parse))
    .addArgument(new Argument('<releaseType>', 'The release type').choices(ReleaseType.CLI_CHOICES))
    .argument('[customVersion]', 'Custom version number. Will be ignored if the release type is not "custom"', validateVersion)
    .option('-f, --force', 'Enable force mode', false)
    .option('-d, --checkoutDir <checkoutDir>', 'The git checkout directory', validateDirectory, sh.pwd().stdout)
    .option('-b, --branch <branch>', 'The git branch to checkout', 'master')
    .option('-v, --verbose', 'Enable verbose (debug) log output', false)
    .option('--no-publish', 'Only prepare release but do not publish to github', true)
    .option('--draft', 'Publish github releases as drafts', false)
    .option(
        '--npm-dryRun',
        'Execute a npm dry-run for inspection. Publishes to the local npm registry and does not publish to github',
        false
    )
    .action(release);

const app = baseConfiguration(new Command())
    .showSuggestionAfterError(true)
    .showHelpAfterError(true)
    .name('glsp')
    .addCommand(ReleaseCommand);

app.parse(process.argv);
