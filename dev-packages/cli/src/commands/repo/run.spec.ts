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

import { describe, it, expect } from 'vitest';
import { createScopedRunCommand } from './run';

describe('run-command', () => {
    describe('createScopedRunCommand', () => {
        it('should create a command named "run"', () => {
            const cmd = createScopedRunCommand('glsp-client');
            expect(cmd.name()).toBe('run');
        });

        it('should include the repo name in the description', () => {
            const cmd = createScopedRunCommand('glsp-server-node');
            expect(cmd.description()).toContain('glsp-server-node');
        });

        it('should require a script argument', () => {
            const cmd = createScopedRunCommand('glsp-client');
            const scriptArg = cmd.registeredArguments.find(a => a.name() === 'script');
            expect(scriptArg).toBeDefined();
            expect(scriptArg!.required).toBe(true);
        });

        it('should allow unknown options for passthrough', () => {
            const cmd = createScopedRunCommand('glsp-client');
            expect((cmd as any)._allowUnknownOption).toBe(true);
        });

        it('should allow excess arguments for passthrough', () => {
            const cmd = createScopedRunCommand('glsp-client');
            expect((cmd as any)._allowExcessArguments).toBe(true);
        });
    });
});
