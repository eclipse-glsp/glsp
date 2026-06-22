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
import { Command } from 'commander';
import { CheckHeaderCommand } from './commands/check-header';
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
    expect(sub, `subcommand '${name}' not found on '${parent.name()}'`).toBeDefined();
    return sub!;
};
const choices = (cmd: Command, long: string): string[] | undefined => {
    const opt = cmd.options.find(o => o.long === long);
    expect(opt, `option '${long}' not found on '${cmd.name()}'`).toBeDefined();
    return opt!.argChoices;
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('cli', () => {
    // ── Top-level ──────────────────────────────────────────────────────

    describe('top-level commands', () => {
        describe('checkHeaders', () => {
            it('should accept a <rootDir> argument', () => {
                expect(CheckHeaderCommand.registeredArguments).toHaveLength(1);
                expect(CheckHeaderCommand.registeredArguments[0].name()).toBe('rootDir');
                expect(CheckHeaderCommand.registeredArguments[0].required).toBe(true);
            });

            it('should have expected options', () => {
                expect(optionLongs(CheckHeaderCommand)).toEqual(
                    expect.arrayContaining([
                        '--type',
                        '--fileExtensions',
                        '--exclude',
                        '--no-exclude-defaults',
                        '--json',
                        '--autoFix',
                        '--commit'
                    ])
                );
            });

            it('should restrict --type choices', () => {
                expect(choices(CheckHeaderCommand, '--type')).toEqual(['full', 'changes', 'lastCommit']);
            });
        });

        describe('updateNext', () => {
            it('should have alias "u"', () => {
                expect(UpdateNextCommand.alias()).toBe('u');
            });

            it('should accept an optional [rootDir] argument', () => {
                expect(UpdateNextCommand.registeredArguments).toHaveLength(1);
                expect(UpdateNextCommand.registeredArguments[0].required).toBe(false);
            });

            it('should have expected options', () => {
                expect(optionLongs(UpdateNextCommand)).toEqual(expect.arrayContaining(['--verbose']));
            });
        });

        describe('generateIndex', () => {
            it('should accept a variadic <rootDir...> argument', () => {
                expect(GenerateIndex.registeredArguments).toHaveLength(1);
                expect(GenerateIndex.registeredArguments[0].variadic).toBe(true);
            });

            it('should have expected options', () => {
                expect(optionLongs(GenerateIndex)).toEqual(
                    expect.arrayContaining([
                        '--singleIndex',
                        '--forceOverwrite',
                        '--match',
                        '--ignore',
                        '--style',
                        '--ignoreFile',
                        '--verbose'
                    ])
                );
            });

            it('should restrict --style choices', () => {
                expect(choices(GenerateIndex, '--style')).toEqual(['commonjs', 'esm']);
            });
        });
    });

    // ── Releng ─────────────────────────────────────────────────────────

    describe('releng', () => {
        it('should have version and prepare subcommands', () => {
            expect(subcommandNames(RelengCommand)).toEqual(expect.arrayContaining(['version', 'prepare']));
        });

        describe('version', () => {
            const cmd = findSub(RelengCommand, 'version');

            it('should accept <versionType> argument with choices', () => {
                const arg = cmd.registeredArguments[0];
                expect(arg.name()).toBe('versionType');
                expect(arg.required).toBe(true);
                expect(arg.argChoices).toEqual(['major', 'minor', 'patch', 'custom', 'next']);
            });

            it('should accept optional [customVersion] argument', () => {
                expect(cmd.registeredArguments[1].name()).toBe('customVersion');
                expect(cmd.registeredArguments[1].required).toBe(false);
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--verbose', '--repoDir']));
            });
        });

        describe('prepare', () => {
            const cmd = findSub(RelengCommand, 'prepare');

            it('should accept <versionType> argument with choices', () => {
                const arg = cmd.registeredArguments[0];
                expect(arg.argChoices).toEqual(['major', 'minor', 'patch', 'custom', 'next']);
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--verbose', '--repoDir', '--no-push', '--draft', '--no-check']));
            });
        });
    });

    // ── Repo ───────────────────────────────────────────────────────────

    describe('repo', () => {
        it('should register all top-level repo subcommands', () => {
            expect(subcommandNames(RepoCommand)).toEqual(
                expect.arrayContaining(['clone', 'fork', 'build', 'link', 'unlink', 'pwd', 'log', 'workspace'])
            );
        });

        it('should register a subrepo command for each GLSPRepo', () => {
            for (const repoName of GLSPRepo.choices) {
                expect(subcommandNames(RepoCommand), `subrepo '${repoName}' should be registered`).toContain(repoName);
            }
        });

        it('should have a global --dir option', () => {
            expect(optionLongs(RepoCommand)).toContain('--dir');
        });

        describe('clone', () => {
            const cmd = findSub(RepoCommand, 'clone');

            it('should accept optional [repos...] argument', () => {
                expect(cmd.registeredArguments[0].variadic).toBe(true);
                expect(cmd.registeredArguments[0].required).toBe(false);
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(
                    expect.arrayContaining([
                        '--dir',
                        '--protocol',
                        '--branch',
                        '--fork',
                        '--override',
                        '--preset',
                        '--interactive',
                        '--no-fail-fast',
                        '--verbose'
                    ])
                );
            });

            it('should restrict --protocol choices', () => {
                expect(choices(cmd, '--protocol')).toEqual(['ssh', 'https', 'gh']);
            });

            it('should restrict --override choices', () => {
                expect(choices(cmd, '--override')).toEqual(['rename', 'remove']);
            });

            it('should restrict --preset choices', () => {
                expect(choices(cmd, '--preset')).toEqual(
                    expect.arrayContaining(['core', 'theia', 'vscode', 'eclipse', 'playwright', 'all'])
                );
            });
        });

        describe('fork', () => {
            const cmd = findSub(RepoCommand, 'fork');

            it('should accept required <user> argument', () => {
                expect(cmd.registeredArguments[0].name()).toBe('user');
                expect(cmd.registeredArguments[0].required).toBe(true);
            });

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--protocol', '--repo', '--preset', '--verbose']));
            });

            it('should restrict --protocol choices', () => {
                expect(choices(cmd, '--protocol')).toEqual(['ssh', 'https', 'gh']);
            });
        });

        describe('build', () => {
            const cmd = findSub(RepoCommand, 'build');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(
                    expect.arrayContaining(['--dir', '--repo', '--preset', '--electron', '--no-java', '--no-fail-fast', '--verbose'])
                );
            });
        });

        describe('link', () => {
            const cmd = findSub(RepoCommand, 'link');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--repo', '--preset', '--no-fail-fast', '--verbose']));
            });
        });

        describe('unlink', () => {
            const cmd = findSub(RepoCommand, 'unlink');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--repo', '--preset', '--no-fail-fast', '--verbose']));
            });
        });

        describe('pwd', () => {
            const cmd = findSub(RepoCommand, 'pwd');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--raw', '--verbose']));
            });
        });

        describe('log', () => {
            const cmd = findSub(RepoCommand, 'log');

            it('should have expected options', () => {
                expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--repo', '--preset', '--verbose']));
            });
        });

        describe('workspace', () => {
            const workspace = findSub(RepoCommand, 'workspace');

            it('should have init and open subcommands', () => {
                expect(subcommandNames(workspace)).toEqual(expect.arrayContaining(['init', 'open']));
            });

            describe('init', () => {
                const cmd = findSub(workspace, 'init');

                it('should have expected options', () => {
                    expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--output', '--repo', '--preset', '--verbose']));
                });
            });

            describe('open', () => {
                const cmd = findSub(workspace, 'open');

                it('should have expected options', () => {
                    expect(optionLongs(cmd)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
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
                        expect(subcommandNames(cmd)).toEqual(expect.arrayContaining(['clone', 'switch', 'build', 'pwd', 'log', 'run']));
                    });

                    if (SHORT_ALIASES[repoName]) {
                        it(`should have alias "${SHORT_ALIASES[repoName]}"`, () => {
                            expect(cmd.alias()).toBe(SHORT_ALIASES[repoName]);
                        });
                    }

                    describe('scoped clone', () => {
                        const clone = findSub(cmd, 'clone');

                        it('should have expected options', () => {
                            expect(optionLongs(clone)).toEqual(
                                expect.arrayContaining(['--dir', '--protocol', '--branch', '--fork', '--override', '--verbose'])
                            );
                        });

                        it('should restrict --protocol choices', () => {
                            expect(choices(clone, '--protocol')).toEqual(['ssh', 'https', 'gh']);
                        });

                        it('should restrict --override choices', () => {
                            expect(choices(clone, '--override')).toEqual(['rename', 'remove']);
                        });
                    });

                    describe('scoped switch', () => {
                        const sw = findSub(cmd, 'switch');

                        it('should have expected options', () => {
                            expect(optionLongs(sw)).toEqual(expect.arrayContaining(['--branch', '--dir', '--pr', '--force', '--verbose']));
                        });
                    });

                    describe('scoped build', () => {
                        const build = findSub(cmd, 'build');

                        it('should have expected options', () => {
                            expect(optionLongs(build)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                        });

                        if (repoName === 'glsp-theia-integration') {
                            it('should have --electron option', () => {
                                expect(optionLongs(build)).toContain('--electron');
                            });
                        }
                    });

                    describe('scoped pwd', () => {
                        const pwd = findSub(cmd, 'pwd');

                        it('should have expected options', () => {
                            expect(optionLongs(pwd)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                        });
                    });

                    describe('scoped log', () => {
                        const log = findSub(cmd, 'log');

                        it('should have expected options', () => {
                            expect(optionLongs(log)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                        });
                    });

                    describe('scoped run', () => {
                        const run = findSub(cmd, 'run');

                        it('should accept a required <script> argument', () => {
                            expect(run.registeredArguments).toHaveLength(1);
                            expect(run.registeredArguments[0].name()).toBe('script');
                            expect(run.registeredArguments[0].required).toBe(true);
                        });

                        it('should have expected options', () => {
                            expect(optionLongs(run)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                        });
                    });
                });
            }

            // ── Repo-specific extra commands ───────────────────────────

            describe('glsp-client extras', () => {
                const cmd = createSubrepoCommand('glsp-client');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).toContain('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).toEqual(expect.arrayContaining(['--dir', '--browser', '--dry-run', '--verbose']));
                });
            });

            describe('glsp-server-node extras', () => {
                const cmd = createSubrepoCommand('glsp-server-node');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).toContain('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).toEqual(expect.arrayContaining(['--dir', '--socket', '--dry-run', '--verbose']));
                });

                it('should have browser-bundle command', () => {
                    expect(subcommandNames(cmd)).toContain('browser-bundle');
                });

                it('should have expected browser-bundle options', () => {
                    const browserBundle = findSub(cmd, 'browser-bundle');
                    expect(optionLongs(browserBundle)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });

                it('should have node-bundle command', () => {
                    expect(subcommandNames(cmd)).toContain('node-bundle');
                });

                it('should have expected node-bundle options', () => {
                    const nodeBundle = findSub(cmd, 'node-bundle');
                    expect(optionLongs(nodeBundle)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });
            });

            describe('glsp-server extras', () => {
                const cmd = createSubrepoCommand('glsp-server');
                const start = findSub(cmd, 'start');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).toContain('start');
                });

                it('should have expected start options', () => {
                    expect(optionLongs(start)).toEqual(expect.arrayContaining(['--dir', '--socket', '--dry-run', '--verbose']));
                });
            });

            describe('glsp-theia-integration extras', () => {
                const cmd = createSubrepoCommand('glsp-theia-integration');

                it('should have start command', () => {
                    expect(subcommandNames(cmd)).toContain('start');
                });

                it('should have expected start options', () => {
                    const start = findSub(cmd, 'start');
                    expect(optionLongs(start)).toEqual(
                        expect.arrayContaining(['--dir', '--electron', '--debug', '--dry-run', '--verbose'])
                    );
                });

                it('should have open command', () => {
                    expect(subcommandNames(cmd)).toContain('open');
                });

                it('should have expected open options', () => {
                    const open = findSub(cmd, 'open');
                    expect(optionLongs(open)).toEqual(expect.arrayContaining(['--verbose']));
                });
            });

            describe('glsp-vscode-integration extras', () => {
                const cmd = createSubrepoCommand('glsp-vscode-integration');

                it('should have vsix-id command', () => {
                    expect(subcommandNames(cmd)).toContain('vsix-id');
                });

                it('should have vsix-path command', () => {
                    expect(subcommandNames(cmd)).toContain('vsix-path');
                });

                it('should have expected vsix-path options', () => {
                    const vsixPath = findSub(cmd, 'vsix-path');
                    expect(optionLongs(vsixPath)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });

                it('should have package command', () => {
                    expect(subcommandNames(cmd)).toContain('package');
                });

                it('should have expected package options', () => {
                    const pkg = findSub(cmd, 'package');
                    expect(optionLongs(pkg)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });

                it('should have web-vsix-id command', () => {
                    expect(subcommandNames(cmd)).toContain('web-vsix-id');
                });

                it('should have web-vsix-path command', () => {
                    expect(subcommandNames(cmd)).toContain('web-vsix-path');
                });

                it('should have expected web-vsix-path options', () => {
                    const webVsixPath = findSub(cmd, 'web-vsix-path');
                    expect(optionLongs(webVsixPath)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });

                it('should have web-package command', () => {
                    expect(subcommandNames(cmd)).toContain('web-package');
                });

                it('should have expected web-package options', () => {
                    const webPkg = findSub(cmd, 'web-package');
                    expect(optionLongs(webPkg)).toEqual(expect.arrayContaining(['--dir', '--verbose']));
                });
            });
        });
    });
});
