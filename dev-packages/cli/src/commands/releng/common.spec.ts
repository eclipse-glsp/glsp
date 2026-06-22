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

import { describe, it, beforeEach, expect, vi } from 'vitest';
import * as fileUtil from '../../util/file-util';
import { LOGGER } from '../../util/logger';
import { PackageHelper } from '../../util/package-util';
import * as packageUtil from '../../util/package-util';
import * as processUtil from '../../util/process-util';
import * as gitUtil from '../../util/git-util';
import {
    VersionType,
    asMvnVersion,
    getChangeLogChanges,
    getGLSPDependencies,
    getLastReleaseTag,
    getLocalVersion,
    getVersionFromPackage,
    getVersionFromPom,
    GLSPRepo,
    isGithubCLIAuthenticated,
    isNextVersion
} from './common';

describe('common', () => {
    beforeEach(() => {
        vi.spyOn(LOGGER, 'debug').mockReturnValue(undefined);
        vi.spyOn(LOGGER, 'warn').mockReturnValue(undefined);
    });

    describe('GLSPRepo.deriveFromDirectory', () => {
        it('should derive repo name from HTTPS remote URL', () => {
            vi.spyOn(gitUtil, 'getRemoteUrl').mockReturnValue('https://github.com/eclipse-glsp/glsp-client.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).toBe('glsp-client');
        });

        it('should derive repo name from SSH remote URL', () => {
            vi.spyOn(gitUtil, 'getRemoteUrl').mockReturnValue('git@github.com:eclipse-glsp/glsp-server-node.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).toBe('glsp-server-node');
        });

        it('should return undefined for a non-GLSP repository', () => {
            vi.spyOn(gitUtil, 'getRemoteUrl').mockReturnValue('https://github.com/other/repo.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).toBeUndefined();
        });
    });

    describe('isGithubCLIAuthenticated', () => {
        it('should return true when gh is installed and authenticated', () => {
            vi.spyOn(processUtil, 'exec').mockReturnValue('');
            const result = isGithubCLIAuthenticated();
            expect(result).toBe(true);
        });

        it('should return false when gh auth status throws', () => {
            vi.spyOn(processUtil, 'exec').mockImplementation((...args) => {
                if (args[0] === 'gh auth status') {
                    throw new Error('not authenticated');
                }
                return '';
            });
            const result = isGithubCLIAuthenticated();
            expect(result).toBe(false);
        });

        it('should return false when gh is not installed', () => {
            vi.spyOn(processUtil, 'exec').mockImplementation(() => {
                throw new Error('gh not found');
            });
            const result = isGithubCLIAuthenticated();
            expect(result).toBe(false);
        });
    });

    describe('getGLSPDependencies', () => {
        it('should return only @eclipse-glsp dependencies from both deps and devDeps', () => {
            const pkg = {
                content: {
                    name: 'test-pkg',
                    version: '1.0.0',
                    dependencies: {
                        '@eclipse-glsp/client': '1.0.0',
                        lodash: '4.0.0'
                    },
                    devDependencies: {
                        '@eclipse-glsp/config': '1.0.0',
                        typescript: '5.0.0'
                    }
                }
            } as unknown as PackageHelper;

            const result = getGLSPDependencies(pkg);
            expect(result).toEqual(['@eclipse-glsp/client', '@eclipse-glsp/config']);
        });

        it('should return empty array when dependency sections are missing', () => {
            const pkg = {
                content: {
                    name: 'test-pkg',
                    version: '1.0.0'
                }
            } as unknown as PackageHelper;

            const result = getGLSPDependencies(pkg);
            expect(result).toEqual([]);
        });
    });

    describe('isNextVersion', () => {
        it('should return true for -next suffix', () => {
            expect(isNextVersion('1.0.0-next')).toBe(true);
        });

        it('should return true for .SNAPSHOT suffix', () => {
            expect(isNextVersion('1.0.0.SNAPSHOT')).toBe(true);
        });

        it('should return false for a release version', () => {
            expect(isNextVersion('1.0.0')).toBe(false);
        });
    });

    describe('asMvnVersion', () => {
        it('should convert -next to -SNAPSHOT', () => {
            expect(asMvnVersion('1.0.0-next')).toBe('1.0.0-SNAPSHOT');
        });

        it('should return release versions unchanged', () => {
            expect(asMvnVersion('2.3.1')).toBe('2.3.1');
        });
    });

    describe('VersionType.validate', () => {
        it('should throw when type is custom but no version is provided', () => {
            expect(() => VersionType.validate('custom')).toThrow(/Custom version must be provided/);
        });

        it('should accept custom type with a version', () => {
            expect(() => VersionType.validate('custom', '1.0.0')).not.toThrow();
        });

        it('should warn when a custom version is provided for non-custom type', () => {
            const warnStub = vi.spyOn(console, 'warn').mockReturnValue(undefined);
            VersionType.validate('minor', '1.0.0');
            expect(warnStub).toHaveBeenCalledOnce();
        });

        it('should accept non-custom type without a version', () => {
            expect(() => VersionType.validate('minor')).not.toThrow();
        });
    });

    describe('VersionType.deriveVersion', () => {
        it('should return the custom version for npm repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options, '99.0.0');
            expect(result).toBe('99.0.0');
        });

        it('should throw for invalid custom version on npm repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            expect(() => VersionType.deriveVersion(options, 'not-semver')).toThrow(/Not a valid custom version/);
        });

        it('should accept any custom version for java repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-server' as const, verbose: false };
            const result = VersionType.deriveVersion(options, '2.0.0.qualifier');
            expect(result).toBe('2.0.0.qualifier');
        });

        it('should derive minor version from local package', () => {
            vi.spyOn(packageUtil, 'readPackage').mockReturnValue({ content: { version: '1.2.0' } } as unknown as PackageHelper);
            const options = { versionType: 'minor' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options);
            expect(result).toBe('1.3.0');
        });

        it('should derive next version with -next suffix', () => {
            vi.spyOn(packageUtil, 'readPackage').mockReturnValue({ content: { version: '1.2.0' } } as unknown as PackageHelper);
            const options = { versionType: 'next' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options);
            expect(result).toBe('1.3.0-next');
        });
    });

    describe('getLocalVersion', () => {
        it('should read from pom.xml for glsp-server', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue('<version>2.0.0</version>');
            expect(getLocalVersion('/repo', 'glsp-server')).toBe('2.0.0');
        });

        it('should read from server/pom.xml for glsp-eclipse-integration', () => {
            const readStub = vi.spyOn(fileUtil, 'readFile').mockReturnValue('<version>2.1.0</version>');
            expect(getLocalVersion('/repo', 'glsp-eclipse-integration')).toBe('2.1.0');
            expect(readStub.mock.calls[0][0]).toContain('server');
        });

        it('should read from package.json for npm repos', () => {
            vi.spyOn(packageUtil, 'readPackage').mockReturnValue({ content: { version: '1.5.0' } } as unknown as PackageHelper);
            expect(getLocalVersion('/repo', 'glsp-client')).toBe('1.5.0');
        });
    });

    describe('getVersionFromPom', () => {
        it('should extract version from pom.xml', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue(
                `<?xml version="1.0"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <version>2.7.0-SNAPSHOT</version>
</project>`
            );
            expect(getVersionFromPom('/repo')).toBe('2.7.0-SNAPSHOT');
        });

        it('should throw when no version is found', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue('<project></project>');
            expect(() => getVersionFromPom('/repo')).toThrow(/Could not find version/);
        });
    });

    describe('getVersionFromPackage', () => {
        it('should return the version from package.json', () => {
            vi.spyOn(packageUtil, 'readPackage').mockReturnValue({ content: { version: '1.0.0' } } as unknown as PackageHelper);
            expect(getVersionFromPackage('/repo')).toBe('1.0.0');
        });

        it('should throw when no version is found', () => {
            vi.spyOn(packageUtil, 'readPackage').mockReturnValue({ content: {} } as unknown as PackageHelper);
            expect(() => getVersionFromPackage('/repo')).toThrow(/No version found/);
        });
    });

    describe('getLastReleaseTag', () => {
        it('should return the first valid semver tag starting with v', () => {
            vi.spyOn(processUtil, 'exec').mockReturnValue('v2.0.0\nv1.0.0\nsome-tag');
            expect(getLastReleaseTag('/repo')).toBe('v2.0.0');
        });

        it('should skip pre-release tags', () => {
            vi.spyOn(processUtil, 'exec').mockReturnValue('v2.0.0-rc.1\nv1.0.0');
            expect(getLastReleaseTag('/repo')).toBe('v1.0.0');
        });

        it('should skip tags without v prefix', () => {
            vi.spyOn(processUtil, 'exec').mockReturnValue('release-1.0\nv0.9.0');
            expect(getLastReleaseTag('/repo')).toBe('v0.9.0');
        });

        it('should return undefined when no valid tag exists', () => {
            vi.spyOn(processUtil, 'exec').mockReturnValue('nightly\nsome-tag');
            expect(getLastReleaseTag('/repo')).toBeUndefined();
        });
    });

    describe('getChangeLogChanges', () => {
        const changelogContent = [
            '# Changelog',
            '',
            '## [v2.0.0 - 2026-01-15]',
            '',
            '### Features',
            '',
            '- Added feature A',
            '- Added feature B',
            '',
            '## [v1.0.0 - 2025-06-01]',
            '',
            '- Initial release'
        ].join('\n');

        it('should extract the changelog section for the given version', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue(changelogContent);
            vi.spyOn(processUtil, 'exec').mockReturnValue('v1.0.0');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).toContain('Added feature A');
            expect(result).toContain('Added feature B');
            expect(result).not.toContain('Initial release');
        });

        it('should append a full changelog link when a previous tag exists', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue(changelogContent);
            vi.spyOn(processUtil, 'exec').mockReturnValue('v1.0.0');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).toContain('Full Changelog');
            expect(result).toContain('v1.0.0...v2.0.0');
        });

        it('should throw when no section matches the version', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue(changelogContent);
            vi.spyOn(processUtil, 'exec').mockReturnValue('');
            expect(() => getChangeLogChanges({ repoDir: '/repo', version: '9.9.9', repo: 'glsp-client' })).toThrow(
                /No changelog section found/
            );
        });

        it('should demote headings by one level', () => {
            vi.spyOn(fileUtil, 'readFile').mockReturnValue(changelogContent);
            vi.spyOn(processUtil, 'exec').mockReturnValue('');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).toContain('## Features');
            expect(result).not.toContain('### Features');
        });
    });
});
