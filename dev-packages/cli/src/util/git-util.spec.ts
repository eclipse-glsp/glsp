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

import { describe, it, beforeEach, expect, vi, type MockInstance } from 'vitest';
import * as processUtil from './process-util';
import {
    commitChanges,
    getChangesComparedToDefaultBranch,
    getDefaultBranch,
    getDefaultBranchRef,
    getLastModificationDate,
    getUncommittedChanges,
    hasChanges
} from './git-util';

describe('git-util', () => {
    let execStub: MockInstance;

    beforeEach(() => {
        execStub = vi.spyOn(processUtil, 'exec').mockReturnValue('');
    });

    describe('getUncommittedChanges', () => {
        it('should parse porcelain output into file paths', () => {
            execStub.mockReturnValue(' M src/file.ts\n?? new-file.ts');
            const result = getUncommittedChanges('/repo');
            expect(result).toHaveLength(2);
        });

        it('should return empty array for empty output', () => {
            execStub.mockReturnValue('');
            const result = getUncommittedChanges('/repo');
            expect(result).toHaveLength(0);
        });
    });

    describe('hasChanges', () => {
        it('should return true when there are uncommitted changes', () => {
            execStub.mockReturnValue(' M src/file.ts\n?? new-file.ts');
            expect(hasChanges('/repo')).toBe(true);
        });

        it('should return false when there are no changes', () => {
            execStub.mockReturnValue('');
            expect(hasChanges('/repo')).toBe(false);
        });
    });

    describe('commitChanges', () => {
        it('should escape double quotes in commit message', () => {
            commitChanges('fix "bug"', '/repo');
            expect(execStub.mock.calls[1][0]).toContain('\\"');
        });

        it('should escape backslashes in commit message', () => {
            commitChanges('path\\to\\file', '/repo');
            expect(execStub.mock.calls[1][0]).toContain('\\\\');
        });
    });

    describe('getDefaultBranch', () => {
        it('should parse HEAD branch from remote output', () => {
            execStub.mockReturnValue('* remote origin\n  HEAD branch: main\n  Remote branches:');
            expect(getDefaultBranch('/repo')).toBe('main');
        });

        it('should fallback to master when HEAD branch is not found', () => {
            execStub.mockReturnValue('* remote origin\n  Remote branches:');
            expect(getDefaultBranch('/repo')).toBe('master');
        });
    });

    describe('getDefaultBranchRef', () => {
        it('should resolve the ref from origin/HEAD when available', () => {
            execStub.mockImplementation((cmd: string) => {
                if (/symbolic-ref/.test(cmd)) return 'origin/develop';
                return '';
            });
            expect(getDefaultBranchRef('/repo')).toBe('origin/develop');
        });

        it('should fall back to the first existing candidate ref', () => {
            execStub.mockImplementation((cmd: string) => {
                if (/symbolic-ref/.test(cmd)) return '';
                if (cmd.includes('origin/main')) throw new Error('unknown revision');
                if (cmd.includes('origin/master')) throw new Error('unknown revision');
                if (/--verify --quiet main/.test(cmd)) return '';
                return '';
            });
            expect(getDefaultBranchRef('/repo')).toBe('main');
        });

        it('should return undefined when no default branch can be determined', () => {
            execStub.mockImplementation(() => {
                throw new Error('not a git repository');
            });
            expect(getDefaultBranchRef('/repo')).toBeUndefined();
        });
    });

    describe('getChangesComparedToDefaultBranch', () => {
        it('should merge committed and uncommitted changes and deduplicate', () => {
            execStub.mockImplementation((cmd: string) => {
                if (/symbolic-ref/.test(cmd)) return 'origin/main';
                if (/diff --name-only/.test(cmd)) return 'src/a.ts\nsrc/b.ts';
                if (/status --porcelain/.test(cmd)) return ' M src/b.ts\n?? src/c.ts';
                return '';
            });
            const result = getChangesComparedToDefaultBranch('/repo');
            expect(result).toEqual(expect.arrayContaining(['/repo/src/a.ts', '/repo/src/b.ts', '/repo/src/c.ts']));
            expect(result).toHaveLength(3);
        });

        it('should only consider uncommitted changes when no default branch is found', () => {
            execStub.mockImplementation((cmd: string) => {
                if (/status --porcelain/.test(cmd)) return ' M src/only.ts';
                throw new Error('not a git repository');
            });
            const result = getChangesComparedToDefaultBranch('/repo');
            expect(result).toEqual(['/repo/src/only.ts']);
        });
    });

    describe('getLastModificationDate', () => {
        it('should return a Date for a valid date string', () => {
            execStub.mockReturnValue('2024-01-15 10:30:00 +0000');
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).toBeInstanceOf(Date);
        });

        it('should return undefined for empty result', () => {
            execStub.mockReturnValue('');
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).toBeUndefined();
        });

        it('should return undefined when exec throws', () => {
            execStub.mockImplementation(() => {
                throw new Error('git error');
            });
            const result = getLastModificationDate('file.ts', '/repo');
            expect(result).toBeUndefined();
        });
    });
});
