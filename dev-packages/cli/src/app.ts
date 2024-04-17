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
import { CheckHeaderCommand } from './commands/check-header.js';
import { CoverageReportCommand } from './commands/coverage-report.js';
import { GenerateIndex } from './commands/generate-index.js';
import { ReleaseCommand } from './commands/release/release.js';
import { UpdateNextCommand } from './commands/update-next.js';
import { baseCommand } from './util/command-util.js';

export const COMMAND_VERSION = '1.1.0-next';

const app = baseCommand() //
    .version(COMMAND_VERSION)
    .name('glsp')
    .addCommand(CoverageReportCommand)
    .addCommand(ReleaseCommand)
    .addCommand(CheckHeaderCommand)
    .addCommand(UpdateNextCommand)
    .addCommand(GenerateIndex);

app.parse(process.argv);
