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
import { cleanupTempDir, createTempDir } from '../../tests/helpers/test-helper';
import { getPnpmOverrides, removePnpmOverrides, setPnpmOverrides } from './pnpm-workspace-util';

describe('pnpm-workspace-util', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = createTempDir();
    });

    afterEach(() => {
        cleanupTempDir(tempDir);
    });

    function writeWorkspaceYaml(content: string): string {
        const filePath = path.join(tempDir, 'pnpm-workspace.yaml');
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    function readWorkspaceYaml(): string {
        return fs.readFileSync(path.join(tempDir, 'pnpm-workspace.yaml'), 'utf8');
    }

    it('should throw if no pnpm-workspace.yaml exists', () => {
        expect(() => getPnpmOverrides(tempDir)).to.throw(/No pnpm-workspace.yaml found/);
    });

    it('should return empty overrides if no overrides section exists', () => {
        writeWorkspaceYaml("packages:\n    - 'packages/*'\n");
        expect(getPnpmOverrides(tempDir)).to.deep.equal({});
    });

    it('should add overrides and preserve existing content and comments', () => {
        writeWorkspaceYaml("packages:\n    - 'packages/*'\n\n# supply chain protection\nminimumReleaseAge: 4320\n");

        setPnpmOverrides(tempDir, { '@eclipse-glsp/client': 'link:../glsp-client/packages/client' });

        const content = readWorkspaceYaml();
        expect(content).to.contain('# supply chain protection');
        expect(content).to.contain('minimumReleaseAge: 4320');
        expect(getPnpmOverrides(tempDir)).to.deep.equal({ '@eclipse-glsp/client': 'link:../glsp-client/packages/client' });
    });

    it('should update existing overrides', () => {
        writeWorkspaceYaml("packages:\n    - 'packages/*'\noverrides:\n    '@eclipse-glsp/client': 'link:/old/path'\n");

        setPnpmOverrides(tempDir, { '@eclipse-glsp/client': 'link:../new/path' });

        expect(getPnpmOverrides(tempDir)).to.deep.equal({ '@eclipse-glsp/client': 'link:../new/path' });
    });

    it('should remove overrides and drop the empty overrides section', () => {
        writeWorkspaceYaml("packages:\n    - 'packages/*'\n");
        setPnpmOverrides(tempDir, { a: 'link:../a', b: 'link:../b' });

        removePnpmOverrides(tempDir, ['a', 'b', 'not-present']);

        expect(getPnpmOverrides(tempDir)).to.deep.equal({});
        expect(readWorkspaceYaml()).to.not.contain('overrides');
    });

    it('should keep unrelated overrides when removing', () => {
        writeWorkspaceYaml("packages:\n    - 'packages/*'\noverrides:\n    some-dep: '^2.0.0'\n");
        setPnpmOverrides(tempDir, { a: 'link:../a' });

        removePnpmOverrides(tempDir, ['a']);

        expect(getPnpmOverrides(tempDir)).to.deep.equal({ 'some-dep': '^2.0.0' });
    });
});
