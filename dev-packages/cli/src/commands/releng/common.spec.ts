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
import * as sinon from 'sinon';
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
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(LOGGER, 'debug');
        sandbox.stub(LOGGER, 'warn');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('GLSPRepo.deriveFromDirectory', () => {
        it('should derive repo name from HTTPS remote URL', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('https://github.com/eclipse-glsp/glsp-client.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.equal('glsp-client');
        });

        it('should derive repo name from SSH remote URL', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('git@github.com:eclipse-glsp/glsp-server-node.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.equal('glsp-server-node');
        });

        it('should return undefined for a non-GLSP repository', () => {
            sandbox.stub(gitUtil, 'getRemoteUrl').returns('https://github.com/other/repo.git');
            const result = GLSPRepo.deriveFromDirectory('/some/path');
            expect(result).to.be.undefined;
        });
    });

    describe('isGithubCLIAuthenticated', () => {
        it('should return true when gh is installed and authenticated', () => {
            sandbox.stub(processUtil, 'exec').returns('');
            const result = isGithubCLIAuthenticated();
            expect(result).to.be.true;
        });

        it('should return false when gh auth status throws', () => {
            const execStub = sandbox.stub(processUtil, 'exec');
            execStub.withArgs('which gh', sinon.match.any).returns('');
            execStub.withArgs('gh auth status').throws(new Error('not authenticated'));
            const result = isGithubCLIAuthenticated();
            expect(result).to.be.false;
        });

        it('should return false when gh is not installed', () => {
            sandbox.stub(processUtil, 'exec').throws(new Error('gh not found'));
            const result = isGithubCLIAuthenticated();
            expect(result).to.be.false;
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
            expect(result).to.deep.equal(['@eclipse-glsp/client', '@eclipse-glsp/config']);
        });

        it('should return empty array when dependency sections are missing', () => {
            const pkg = {
                content: {
                    name: 'test-pkg',
                    version: '1.0.0'
                }
            } as unknown as PackageHelper;

            const result = getGLSPDependencies(pkg);
            expect(result).to.deep.equal([]);
        });
    });

    describe('isNextVersion', () => {
        it('should return true for -next suffix', () => {
            expect(isNextVersion('1.0.0-next')).to.be.true;
        });

        it('should return true for .SNAPSHOT suffix', () => {
            expect(isNextVersion('1.0.0.SNAPSHOT')).to.be.true;
        });

        it('should return false for a release version', () => {
            expect(isNextVersion('1.0.0')).to.be.false;
        });
    });

    describe('asMvnVersion', () => {
        it('should convert -next to -SNAPSHOT', () => {
            expect(asMvnVersion('1.0.0-next')).to.equal('1.0.0-SNAPSHOT');
        });

        it('should return release versions unchanged', () => {
            expect(asMvnVersion('2.3.1')).to.equal('2.3.1');
        });
    });

    describe('VersionType.validate', () => {
        it('should throw when type is custom but no version is provided', () => {
            expect(() => VersionType.validate('custom')).to.throw(/Custom version must be provided/);
        });

        it('should accept custom type with a version', () => {
            expect(() => VersionType.validate('custom', '1.0.0')).to.not.throw();
        });

        it('should warn when a custom version is provided for non-custom type', () => {
            const warnStub = sandbox.stub(console, 'warn');
            VersionType.validate('minor', '1.0.0');
            expect(warnStub.calledOnce).to.be.true;
        });

        it('should accept non-custom type without a version', () => {
            expect(() => VersionType.validate('minor')).to.not.throw();
        });
    });

    describe('VersionType.deriveVersion', () => {
        it('should return the custom version for npm repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options, '99.0.0');
            expect(result).to.equal('99.0.0');
        });

        it('should throw for invalid custom version on npm repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            expect(() => VersionType.deriveVersion(options, 'not-semver')).to.throw(/Not a valid custom version/);
        });

        it('should accept any custom version for java repos', () => {
            const options = { versionType: 'custom' as VersionType, repoDir: '/repo', repo: 'glsp-server' as const, verbose: false };
            const result = VersionType.deriveVersion(options, '2.0.0.qualifier');
            expect(result).to.equal('2.0.0.qualifier');
        });

        it('should derive minor version from local package', () => {
            sandbox.stub(packageUtil, 'readPackage').returns({ content: { version: '1.2.0' } } as unknown as PackageHelper);
            const options = { versionType: 'minor' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options);
            expect(result).to.equal('1.3.0');
        });

        it('should derive next version with -next suffix', () => {
            sandbox.stub(packageUtil, 'readPackage').returns({ content: { version: '1.2.0' } } as unknown as PackageHelper);
            const options = { versionType: 'next' as VersionType, repoDir: '/repo', repo: 'glsp-client' as const, verbose: false };
            const result = VersionType.deriveVersion(options);
            expect(result).to.equal('1.3.0-next');
        });
    });

    describe('getLocalVersion', () => {
        it('should read from pom.xml for glsp-server', () => {
            sandbox.stub(fileUtil, 'readFile').returns('<version>2.0.0</version>');
            expect(getLocalVersion('/repo', 'glsp-server')).to.equal('2.0.0');
        });

        it('should read from server/pom.xml for glsp-eclipse-integration', () => {
            const readStub = sandbox.stub(fileUtil, 'readFile').returns('<version>2.1.0</version>');
            expect(getLocalVersion('/repo', 'glsp-eclipse-integration')).to.equal('2.1.0');
            expect(readStub.firstCall.args[0]).to.contain('server');
        });

        it('should read from package.json for npm repos', () => {
            sandbox.stub(packageUtil, 'readPackage').returns({ content: { version: '1.5.0' } } as unknown as PackageHelper);
            expect(getLocalVersion('/repo', 'glsp-client')).to.equal('1.5.0');
        });
    });

    describe('getVersionFromPom', () => {
        it('should extract version from pom.xml', () => {
            sandbox.stub(fileUtil, 'readFile').returns(
                `<?xml version="1.0"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <version>2.7.0-SNAPSHOT</version>
</project>`
            );
            expect(getVersionFromPom('/repo')).to.equal('2.7.0-SNAPSHOT');
        });

        it('should throw when no version is found', () => {
            sandbox.stub(fileUtil, 'readFile').returns('<project></project>');
            expect(() => getVersionFromPom('/repo')).to.throw(/Could not find version/);
        });
    });

    describe('getVersionFromPackage', () => {
        it('should return the version from package.json', () => {
            sandbox.stub(packageUtil, 'readPackage').returns({ content: { version: '1.0.0' } } as unknown as PackageHelper);
            expect(getVersionFromPackage('/repo')).to.equal('1.0.0');
        });

        it('should throw when no version is found', () => {
            sandbox.stub(packageUtil, 'readPackage').returns({ content: {} } as unknown as PackageHelper);
            expect(() => getVersionFromPackage('/repo')).to.throw(/No version found/);
        });
    });

    describe('getLastReleaseTag', () => {
        it('should return the first valid semver tag starting with v', () => {
            sandbox.stub(processUtil, 'exec').returns('v2.0.0\nv1.0.0\nsome-tag');
            expect(getLastReleaseTag('/repo')).to.equal('v2.0.0');
        });

        it('should skip pre-release tags', () => {
            sandbox.stub(processUtil, 'exec').returns('v2.0.0-rc.1\nv1.0.0');
            expect(getLastReleaseTag('/repo')).to.equal('v1.0.0');
        });

        it('should skip tags without v prefix', () => {
            sandbox.stub(processUtil, 'exec').returns('release-1.0\nv0.9.0');
            expect(getLastReleaseTag('/repo')).to.equal('v0.9.0');
        });

        it('should return undefined when no valid tag exists', () => {
            sandbox.stub(processUtil, 'exec').returns('nightly\nsome-tag');
            expect(getLastReleaseTag('/repo')).to.be.undefined;
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
            sandbox.stub(fileUtil, 'readFile').returns(changelogContent);
            sandbox.stub(processUtil, 'exec').returns('v1.0.0');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).to.contain('Added feature A');
            expect(result).to.contain('Added feature B');
            expect(result).to.not.contain('Initial release');
        });

        it('should append a full changelog link when a previous tag exists', () => {
            sandbox.stub(fileUtil, 'readFile').returns(changelogContent);
            sandbox.stub(processUtil, 'exec').returns('v1.0.0');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).to.contain('Full Changelog');
            expect(result).to.contain('v1.0.0...v2.0.0');
        });

        it('should throw when no section matches the version', () => {
            sandbox.stub(fileUtil, 'readFile').returns(changelogContent);
            sandbox.stub(processUtil, 'exec').returns('');
            expect(() => getChangeLogChanges({ repoDir: '/repo', version: '9.9.9', repo: 'glsp-client' })).to.throw(
                /No changelog section found/
            );
        });

        it('should demote headings by one level', () => {
            sandbox.stub(fileUtil, 'readFile').returns(changelogContent);
            sandbox.stub(processUtil, 'exec').returns('');
            const result = getChangeLogChanges({ repoDir: '/repo', version: '2.0.0', repo: 'glsp-client' });
            expect(result).to.contain('## Features');
            expect(result).to.not.contain('### Features');
        });
    });
});
