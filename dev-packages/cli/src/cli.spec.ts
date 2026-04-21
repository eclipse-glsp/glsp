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
import { CheckHeaderCommand } from './commands/check-header';
import { CoverageReportCommand } from './commands/coverage-report';
import { GenerateIndex } from './commands/generate-index';
import { RelengCommand } from './commands/releng/releng';
import { RepoCommand } from './commands/repo/repo';
import { UpdateNextCommand } from './commands/update-next';
import { GLSPRepo } from './util';
import { createSubrepoCommand } from './commands/repo/subrepos';

// ── Helpers ────────────────────────────────────────────────────────────────

const optionLongs = (cmd: Command): string[] => cmd.options.map(o => o.long!);
const subcommandNames = (cmd: Command): string[] => cmd.commands.map(c => c.name());
const findSub = (parent: Command, name: string): Command => {
    const sub = parent.commands.find(c => c.name() === name);
    expect(sub, `subcommand '${name}' not found on '${parent.name()}'`).to.exist;
    return sub!;
};
const choices = (cmd: Command, long: string): string[] | undefined => {
    const opt = cmd.options.find(o => o.long === long);
    expect(opt, `option '${long}' not found on '${cmd.name()}'`).to.exist;
    return opt!.argChoices;
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('cli', () => {
    // ── Top-level ──────────────────────────────────────────────────────

    describe('top-level commands', () => {
        describe('coverageReport', () => {
            it('should have expected options', () => {
                expect(optionLongs(CoverageReportCommand)).to.include.members(['--projectRoot', '--coverageScript']);
            });
        });

        describe('checkHeaders', () => {
            it('should accept a <rootDir> argument', () => {
                expect(CheckHeaderCommand.registeredArguments).to.have.lengthOf(1);
                expect(CheckHeaderCommand.registeredArguments[0].name()).to.equal('rootDir');
                expect(CheckHeaderCommand.registeredArguments[0].required).to.be.true;
            });

            it('should have expected options', () => {
                expect(optionLongs(CheckHeaderCommand)).to.include.members([
                    '--type',
                    '--fileExtensions',
                    '--exclude',
                    '--no-exclude-defaults',
                    '--json',
                    '--autoFix',
                    '--commit'
                ]);
            });

            it('should restrict --type choices', () => {
                expect(choices(CheckHeaderCommand, '--type')).to.deep.equal(['full', 'changes', 'lastCommit']);
            });
        });

        describe('updateNext', () => {
            it('should have alias "u"', () => {
                expect(UpdateNextCommand.alias()).to.equal('u');
            });

            it('should accept an optional [rootDir] argument', () => {
                expect(UpdateNextCommand.registeredArguments).to.have.lengthOf(1);
                expect(UpdateNextCommand.registeredArguments[0].required).to.be.false;
            });

            it('should have expected options', () => {
                expect(optionLongs(UpdateNextCommand)).to.include.members(['--verbose']);
            });
        });

        describe('generateIndex', () => {
            it('should accept a variadic <rootDir...> argument', () => {
                expect(GenerateIndex.registeredArguments).to.have.lengthOf(1);
                expect(GenerateIndex.registeredArguments[0].variadic).to.be.true;
            });

            it('should have expected options', () => {
                expect(optionLongs(GenerateIndex)).to.include.members([
                    '--singleIndex',
                    '--forceOverwrite',
                    '--match',
                    '--ignore',
                    '--style',
                    '--ignoreFile',
                    '--verbose'
                ]);
            });

            it('should restrict --style choices', () => {
                expect(choices(GenerateIndex, '--style')).to.deep.equal(['commonjs', 'esm']);
            });
        });
    });

    // ── Releng ─────────────────────────────────────────────────────────

    describe('releng', () => {
        it('should have version and prepare subcommands', () => {
            expect(subcommandNames(RelengCommand)).to.include.members(['version', 'prepare']);
        });

        describe('version', () => {
            const cmd = findSub(RelengCommand, 'version');

            it('should accept <versionType> argument with choices', () => {
                const arg = cmd.registeredArguments[0];
                expect(arg.name()).to.equal('versionType');
                expect(arg.required).to.be.true;
                expect(arg.argChoices).to.deep.equal(['major', 'minor', 'patch', 'custom', 'next']);
            });

            it('should accept optional [customVersion] argument', () => {
                expect(cmd.registeredArguments[1].name()).to.equal('customVersion');
                expect(cmd.registeredArguments[1].required).to.be.false;
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--verbose', '--repoDir']);
            });
        });

        describe('prepare', () => {
            const cmd = findSub(RelengCommand, 'prepare');

            it('should accept <versionType> argument with choices', () => {
                const arg = cmd.registeredArguments[0];
                expect(arg.argChoices).to.deep.equal(['major', 'minor', 'patch', 'custom', 'next']);
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--verbose', '--repoDir', '--no-push', '--draft', '--no-check']);
            });
        });
    });

    // ── Repo ───────────────────────────────────────────────────────────

    describe('repo', () => {
        it('should register all top-level repo subcommands', () => {
            expect(subcommandNames(RepoCommand)).to.include.members([
                'clone',
                'fork',
                'build',
                'link',
                'unlink',
                'pwd',
                'log',
                'workspace'
            ]);
        });

        it('should register a subrepo command for each GLSPRepo', () => {
            for (const repoName of GLSPRepo.choices) {
                expect(subcommandNames(RepoCommand), `subrepo '${repoName}' should be registered`).to.include(repoName);
            }
        });

        describe('clone', () => {
            const cmd = findSub(RepoCommand, 'clone');

            it('should accept optional [repos...] argument', () => {
                expect(cmd.registeredArguments[0].variadic).to.be.true;
                expect(cmd.registeredArguments[0].required).to.be.false;
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members([
                    '--dir',
                    '--protocol',
                    '--branch',
                    '--fork',
                    '--override',
                    '--preset',
                    '--interactive',
                    '--no-fail-fast',
                    '--verbose'
                ]);
            });

            it('should restrict --protocol choices', () => {
                expect(choices(cmd, '--protocol')).to.deep.equal(['ssh', 'https', 'gh']);
            });

            it('should restrict --override choices', () => {
                expect(choices(cmd, '--override')).to.deep.equal(['rename', 'remove']);
            });

            it('should restrict --preset choices', () => {
                expect(choices(cmd, '--preset')).to.include.members(['core', 'theia', 'vscode', 'eclipse', 'playwright', 'all']);
            });
        });

        describe('fork', () => {
            const cmd = findSub(RepoCommand, 'fork');

            it('should accept required <user> argument', () => {
                expect(cmd.registeredArguments[0].name()).to.equal('user');
                expect(cmd.registeredArguments[0].required).to.be.true;
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--dir', '--protocol', '--repo', '--preset', '--verbose']);
            });

            it('should restrict --protocol choices', () => {
                expect(choices(cmd, '--protocol')).to.deep.equal(['ssh', 'https', 'gh']);
            });
        });

        describe('build', () => {
            const cmd = findSub(RepoCommand, 'build');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members([
                    '--dir',
                    '--repo',
                    '--preset',
                    '--electron',
                    '--no-java',
                    '--no-fail-fast',
                    '--verbose'
                ]);
            });
        });

        describe('link', () => {
            const cmd = findSub(RepoCommand, 'link');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--dir', '--repo', '--preset', '--no-fail-fast', '--verbose']);
            });
        });

        describe('unlink', () => {
            const cmd = findSub(RepoCommand, 'unlink');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--dir', '--repo', '--preset', '--no-fail-fast', '--verbose']);
            });
        });

        describe('pwd', () => {
            const cmd = findSub(RepoCommand, 'pwd');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--dir', '--raw', '--verbose']);
            });
        });

        describe('log', () => {
            const cmd = findSub(RepoCommand, 'log');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).to.include.members(['--dir', '--repo', '--preset', '--verbose']);
            });
        });

        describe('workspace', () => {
            const workspace = findSub(RepoCommand, 'workspace');

            it('should have init and open subcommands', () => {
                expect(subcommandNames(workspace)).to.include.members(['init', 'open']);
            });

            describe('init', () => {
                const cmd = findSub(workspace, 'init');

                it('should have expected options', () => {
                    expect(optionLongs(cmd)).to.include.members(['--dir', '--output', '--repo', '--preset', '--verbose']);
                });
            });

            describe('open', () => {
                const cmd = findSub(workspace, 'open');

                it('should have expected options', () => {
                    expect(optionLongs(cmd)).to.include.members(['--dir', '--verbose']);
                });
            });
        });

        // ── Subrepo commands ───────────────────────────────────────────

        describe('subrepo commands', () => {
            const SHORT_ALIASES: Partial<Record<string, string>> = {
                'glsp-client': 'client',
                'glsp-server-node': 'server-node',
                'glsp-theia-integration': 'theia',
                'glsp-vscode-integration': 'vscode',
                'glsp-eclipse-integration': 'eclipse',
                'glsp-server': 'server-java',
                'glsp-playwright': 'playwright'
            };

            for (const repoName of GLSPRepo.choices) {
                describe(repoName, () => {
                    const cmd = createSubrepoCommand(repoName);

                    it('should have common subcommands', () => {
                        expect(subcommandNames(cmd)).to.include.members(['clone', 'switch', 'build', 'pwd', 'log']);
                    });

                    if (SHORT_ALIASES[repoName]) {
                        it(`should have alias "${SHORT_ALIASES[repoName]}"`, () => {
                            expect(cmd.alias()).to.equal(SHORT_ALIASES[repoName]);
                        });
                    }

                    describe('scoped clone', () => {
                        const clone = findSub(cmd, 'clone');

                        it('should have expected options', () => {
                            expect(optionLongs(clone)).to.include.members([
                                '--dir',
                                '--protocol',
                                '--branch',
                                '--fork',
                                '--override',
                                '--verbose'
                            ]);
                        });

                        it('should restrict --protocol choices', () => {
                            expect(choices(clone, '--protocol')).to.deep.equal(['ssh', 'https', 'gh']);
                        });

                        it('should restrict --override choices', () => {
                            expect(choices(clone, '--override')).to.deep.equal(['rename', 'remove']);
                        });
                    });

                    describe('scoped switch', () => {
                        const sw = findSub(cmd, 'switch');

                        it('should have expected options', () => {
                            expect(optionLongs(sw)).to.include.members(['--branch', '--dir', '--pr', '--force', '--verbose']);
                        });
                    });

                    describe('scoped build', () => {
                        const build = findSub(cmd, 'build');

                        it('should have expected options', () => {
                            expect(optionLongs(build)).to.include.members(['--dir', '--verbose']);
                        });

                        if (repoName === 'glsp-theia-integration') {
                            it('should have --electron option', () => {
                                expect(optionLongs(build)).to.include('--electron');
                            });
                        }
                    });

                    describe('scoped pwd', () => {
                        const pwd = findSub(cmd, 'pwd');

                        it('should have expected options', () => {
                            expect(optionLongs(pwd)).to.include.members(['--dir', '--verbose']);
                        });
                    });

                    describe('scoped log', () => {
                        const log = findSub(cmd, 'log');

                        it('should have expected options', () => {
                            expect(optionLongs(log)).to.include.members(['--dir', '--verbose']);
                        });
                    });
                });
            }

            // ── Repo-specific extra commands ───────────────────────────

            describe('glsp-client extras', () => {
                const cmd = createSubrepoCommand('glsp-client');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).to.include('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).to.include.members(['--dir', '--browser', '--verbose']);
                });
            });

            describe('glsp-server-node extras', () => {
                const cmd = createSubrepoCommand('glsp-server-node');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).to.include('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).to.include.members(['--dir', '--socket', '--verbose']);
                });
            });

            describe('glsp-server extras', () => {
                const cmd = createSubrepoCommand('glsp-server');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).to.include('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).to.include.members(['--dir', '--socket', '--verbose']);
                });
            });

            describe('glsp-theia-integration extras', () => {
                const cmd = createSubrepoCommand('glsp-theia-integration');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).to.include('start');
                });

                it('should have expected start options', () => {
                    const start = findSub(cmd, 'start');
                    expect(optionLongs(start)).to.include.members(['--dir', '--electron', '--debug', '--verbose']);
                });

                it('should have open command', () => {
                    expect(subcommandNames(cmd)).to.include('open');
                });

                it('should have expected open options', () => {
                    const open = findSub(cmd, 'open');
                    expect(optionLongs(open)).to.include.members(['--verbose']);
                });
            });

            describe('glsp-vscode-integration extras', () => {
                const cmd = createSubrepoCommand('glsp-vscode-integration');

                it('should have vsix-path command', () => {
                    expect(subcommandNames(cmd)).to.include('vsix-path');
                });

                it('should have expected vsix-path options', () => {
                    const vsixPath = findSub(cmd, 'vsix-path');
                    expect(optionLongs(vsixPath)).to.include.members(['--dir', '--verbose']);
                });

                it('should have package command', () => {
                    expect(subcommandNames(cmd)).to.include('package');
                });

                it('should have expected package options', () => {
                    const pkg = findSub(cmd, 'package');
                    expect(optionLongs(pkg)).to.include.members(['--dir', '--verbose']);
                });
            });
        });
    });
});
