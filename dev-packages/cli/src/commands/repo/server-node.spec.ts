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
import { BROWSER_BUNDLE_PATH, NODE_BUNDLE_PATH, resolveBundlePath } from './server-node';

describe('server-node', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    describe('resolveBundlePath', () => {
        function createBundle(relativePath: string): string {
            const bundlePath = path.join(tempDir, relativePath);
            fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
            fs.writeFileSync(bundlePath, 'fake-bundle');
            return bundlePath;
        }

        it('should return absolute path when browser bundle exists', () => {
            createBundle(BROWSER_BUNDLE_PATH);
            const result = resolveBundlePath(tempDir, BROWSER_BUNDLE_PATH, 'Browser bundle');
            expect(result).to.equal(path.resolve(tempDir, BROWSER_BUNDLE_PATH));
        });

        it('should return absolute path when node bundle exists', () => {
            createBundle(NODE_BUNDLE_PATH);
            const result = resolveBundlePath(tempDir, NODE_BUNDLE_PATH, 'Node server bundle');
            expect(result).to.equal(path.resolve(tempDir, NODE_BUNDLE_PATH));
        });

        it('should throw when bundle does not exist', () => {
            expect(() => resolveBundlePath(tempDir, BROWSER_BUNDLE_PATH, 'Browser bundle')).to.throw(/Browser bundle not found/);
        });

        it('should include the expected path in the error message', () => {
            expect(() => resolveBundlePath(tempDir, NODE_BUNDLE_PATH, 'Node server bundle')).to.throw(
                new RegExp(NODE_BUNDLE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            );
        });

        it('should include build hint in the error message', () => {
            expect(() => resolveBundlePath(tempDir, BROWSER_BUNDLE_PATH, 'Browser bundle')).to.throw(/glsp repo server-node build/);
        });
    });
});
