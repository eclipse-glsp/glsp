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
import { CheckHeaderCommand } from './commands/check-header';
import { CoverageReportCommand } from './commands/coverage-report';
import { GenerateIndex } from './commands/generate-index';
import { RelengCommand } from './commands/releng/releng';
import { UpdateNextCommand } from './commands/update-next';
import { COMMAND_VERSION, LOGGER, baseCommand } from './util';

const app = baseCommand() //
    .version(COMMAND_VERSION)
    .name('glsp')
    .addCommand(CoverageReportCommand)
    .addCommand(CheckHeaderCommand)
    .addCommand(UpdateNextCommand)
    .addCommand(GenerateIndex)
    .addCommand(RelengCommand);

app.parseAsync(process.argv).catch(err => {
    LOGGER.error(err);
    process.exit(1);
});
