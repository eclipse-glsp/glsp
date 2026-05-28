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

import { expect } from 'chai';
import { Command } from 'commander';
import { baseCommand } from '../../util';

function createParentWithHook(): Command {
    const parent = baseCommand()
        .name('repo')
        .option('-d, --dir <path>', 'Target directory');

    parent.hook('preSubcommand', (_, subcommand) => {
        const parentDir = parent.opts().dir;
        if (parentDir && !subcommand.getOptionValue('dir')) {
            subcommand.setOptionValue('dir', parentDir);
        }
    });

    return parent;
}

function createLeaf(captured: { dir?: string }): Command {
    return baseCommand()
        .name('leaf')
        .option('-d, --dir <path>', 'Target directory')
        .option('-v, --verbose', 'Verbose output', false)
        .action((_opts: unknown, thisCmd: Command) => {
            captured.dir = thisCmd.opts<{ dir?: string }>().dir;
        });
}

function createMiddleWithHook(): Command {
    const mid = baseCommand()
        .name('middle')
        .description('Middle layer');

    mid.hook('preSubcommand', (_, subcommand) => {
        const parentDir = mid.getOptionValue('dir');
        if (parentDir && !subcommand.getOptionValue('dir')) {
            subcommand.setOptionValue('dir', parentDir);
        }
    });

    return mid;
}

describe('repo --dir propagation', () => {
    it('should propagate --dir from parent to direct subcommand', async () => {
        const captured: { dir?: string } = {};
        const parent = createParentWithHook();
        parent.addCommand(createLeaf(captured));

        await parent.parseAsync(['node', 'test', '-d', '/test/path', 'leaf'], { from: 'node' });
        expect(captured.dir).to.equal('/test/path');
    });

    it('should not override subcommand --dir when explicitly set', async () => {
        const captured: { dir?: string } = {};
        const parent = createParentWithHook();
        parent.addCommand(createLeaf(captured));

        await parent.parseAsync(['node', 'test', '-d', '/parent', 'leaf', '-d', '/child'], { from: 'node' });
        expect(captured.dir).to.equal('/child');
    });

    it('should propagate --dir through middle layer to leaf', async () => {
        const captured: { dir?: string } = {};
        const parent = createParentWithHook();
        const middle = createMiddleWithHook();
        middle.addCommand(createLeaf(captured));
        parent.addCommand(middle);

        await parent.parseAsync(['node', 'test', '-d', '/deep/path', 'middle', 'leaf'], { from: 'node' });
        expect(captured.dir).to.equal('/deep/path');
    });

    it('should not propagate when parent --dir is not set', async () => {
        const captured: { dir?: string } = {};
        const parent = createParentWithHook();
        parent.addCommand(createLeaf(captured));

        await parent.parseAsync(['node', 'test', 'leaf'], { from: 'node' });
        expect(captured.dir).to.be.undefined;
    });

    it('should allow leaf --dir to override through middle layer', async () => {
        const captured: { dir?: string } = {};
        const parent = createParentWithHook();
        const middle = createMiddleWithHook();
        middle.addCommand(createLeaf(captured));
        parent.addCommand(middle);

        await parent.parseAsync(['node', 'test', '-d', '/parent', 'middle', 'leaf', '-d', '/leaf'], { from: 'node' });
        expect(captured.dir).to.equal('/leaf');
    });
});
