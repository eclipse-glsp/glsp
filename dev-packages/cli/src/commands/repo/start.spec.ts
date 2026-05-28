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
import * as fs from 'fs';
import * as path from 'path';
import { cleanupTempDir, createTempDir } from '../../../tests/helpers/test-helper';
import {
    JAR_TARGET_DIR,
    ClientStartCommand,
    ServerNodeStartCommand,
    ServerStartCommand,
    TheiaStartCommand,
    discoverJar,
    resolveCommand
} from './start';

describe('start-action', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    describe('discoverJar', () => {
        function createTargetDir(): string {
            const targetDir = path.join(tempDir, JAR_TARGET_DIR);
            fs.mkdirSync(targetDir, { recursive: true });
            return targetDir;
        }

        function createJar(targetDir: string, name: string, mtimeMs?: number): string {
            const jarPath = path.join(targetDir, name);
            fs.writeFileSync(jarPath, 'fake-jar');
            if (mtimeMs !== undefined) {
                const atime = new Date(mtimeMs);
                const mtime = new Date(mtimeMs);
                fs.utimesSync(jarPath, atime, mtime);
            }
            return jarPath;
        }

        it('should find a single *-glsp.jar', () => {
            const targetDir = createTargetDir();
            createJar(targetDir, 'org.eclipse.glsp.example.workflow-2.0.0-glsp.jar');
            const result = discoverJar(tempDir);
            expect(result).to.contain('org.eclipse.glsp.example.workflow-2.0.0-glsp.jar');
        });

        it('should pick the newest JAR by mtime when multiple exist', () => {
            const targetDir = createTargetDir();
            createJar(targetDir, 'old-glsp.jar', 1000000);
            createJar(targetDir, 'new-glsp.jar', 2000000);
            const result = discoverJar(tempDir);
            expect(result).to.contain('new-glsp.jar');
        });

        it('should throw when no JAR is found', () => {
            createTargetDir();
            expect(() => discoverJar(tempDir)).to.throw(/No \*-glsp\.jar found/);
        });

        it('should throw with helpful message when target directory does not exist', () => {
            expect(() => discoverJar(tempDir)).to.throw(/glsp repo server build/);
        });
    });

    describe('resolveCommand', () => {
        it('should rewrite yarn command with --cwd when not dry-run', () => {
            const result = resolveCommand('yarn start:websocket', '/abs/path/to/repo', false);
            expect(result).to.equal('yarn --cwd /abs/path/to/repo start:websocket');
        });

        it('should return undefined on dry-run', () => {
            const result = resolveCommand('yarn start:websocket', '/abs/path/to/repo', true);
            expect(result).to.be.undefined;
        });

        it('should handle yarn commands with arguments', () => {
            const result = resolveCommand('yarn start:websocket --port 8081', '/abs/path', false);
            expect(result).to.equal('yarn --cwd /abs/path start:websocket --port 8081');
        });

        it('should not rewrite non-yarn commands', () => {
            const result = resolveCommand('java -jar server.jar --websocket', '/abs/path', false);
            expect(result).to.equal('java -jar server.jar --websocket');
        });
    });

    describe('start commands allow passthrough args', () => {
        const commands = [
            { name: 'ClientStartCommand', cmd: ClientStartCommand },
            { name: 'TheiaStartCommand', cmd: TheiaStartCommand },
            { name: 'ServerStartCommand', cmd: ServerStartCommand },
            { name: 'ServerNodeStartCommand', cmd: ServerNodeStartCommand }
        ];

        for (const { name, cmd } of commands) {
            it(`${name} should allow unknown options`, () => {
                expect((cmd as any)._allowUnknownOption).to.be.true;
            });

            it(`${name} should allow excess arguments`, () => {
                expect((cmd as any)._allowExcessArguments).to.be.true;
            });
        }
    });
});
