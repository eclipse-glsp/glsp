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
import { GLSPRepo, resolveRepoFilter } from './index';

describe('repo-filter', () => {
    describe('resolveRepoFilter', () => {
        const configuredRepos: GLSPRepo[] = ['glsp-client', 'glsp-server-node', 'glsp-theia-integration'];

        it('should return configured repos when no filter is specified', () => {
            const result = resolveRepoFilter(configuredRepos, {});
            expect(result).to.deep.equal(configuredRepos);
        });

        it('should filter to specific repos with --repo', () => {
            const result = resolveRepoFilter(configuredRepos, { repo: ['glsp-client'] });
            expect(result).to.deep.equal(['glsp-client']);
        });

        it('should allow repos not in config with --repo', () => {
            const result = resolveRepoFilter(configuredRepos, { repo: ['glsp-playwright'] });
            expect(result).to.deep.equal(['glsp-playwright']);
        });

        it('should expand preset with --preset', () => {
            const result = resolveRepoFilter(configuredRepos, { preset: 'core' });
            expect(result).to.include('glsp-client');
            expect(result).to.include('glsp-server-node');
        });

        it('should throw for unknown preset', () => {
            expect(() => resolveRepoFilter(configuredRepos, { preset: 'nonexistent' })).to.throw(/Unknown preset/);
        });

        it('should throw for unknown repo name', () => {
            expect(() => resolveRepoFilter(configuredRepos, { repo: ['not-a-repo'] })).to.throw(/Unknown repository/);
        });
    });
});
