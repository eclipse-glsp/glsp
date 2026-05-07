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
import { configureExec, exec, execForeground } from './process-util';

describe('process-util', () => {
    beforeEach(() => {
        configureExec({ silent: true, fatal: false, verbose: false });
    });

    describe('exec', () => {
        it('should return trimmed stdout on success', () => {
            const result = exec('echo hello');
            expect(result).to.equal('hello');
        });

        it('should throw on non-zero exit code', () => {
            expect(() => exec('sh -c "exit 1"')).to.throw(/Command failed/);
        });

        it('should use custom error message when provided', () => {
            expect(() => exec('sh -c "exit 1"', { errorMsg: 'Custom error' })).to.throw('Custom error');
        });

        it('should pass cwd option', () => {
            const result = exec('pwd', { cwd: '/tmp' });
            expect(result).to.include('tmp');
        });

        it('should return empty string for command with no output', () => {
            const result = exec('true');
            expect(result).to.equal('');
        });
    });

    describe('execForeground', () => {
        it('should resolve on successful command', async () => {
            await execForeground('true');
        });

        it('should reject on non-zero exit code', async () => {
            try {
                await execForeground('sh -c "exit 1"');
                expect.fail('should have thrown');
            } catch (error) {
                expect((error as Error).message).to.contain('exited with code 1');
            }
        });

        it('should pass cwd option', async () => {
            await execForeground('true', { cwd: '/tmp' });
        });
    });
});
