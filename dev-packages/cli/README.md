# Eclipse GLSP - CLI

The `@eclipse-glsp/cli` package provides helpful scripts and commands for extension and application development.
The contributed `glsp`, is a command line tool that offers all contributed commands.

## Getting Started

Install `@eclipse-glsp/cli` as a dev dependency in your application.

```bash
yarn add @eclipse-glsp/cli --dev
```

## Usage

```console
Usage: glsp [options] [command]

Options:
  -V, --version                         output the version number
  -h, --help                            display help for command

Commands:
  coverageReport [options]              Generate a test coverage report for a glsp component
  checkHeaders [options] <rootDir>      Validates the copyright year range (end year) of license header files
  updateNext|u [options] [rootDir]      Updates all `next` dependencies in GLSP project to the latest version
  generateIndex [options] <rootDir...>  Generate index files in a given source directory.
  releng                                Commands for GLSP release engineering (Linux only, intended for CI/Maintainer use).
  repo                                  Multi-repository management for GLSP projects
  help [command]                        display help for command
```

## checkHeaders

The `checkHeaders` command can be used to validate the copyright year (range) of license headers.
It checks for each file (matching the include pattern) whether the defined copyright range is in line with the first and last modification date in the git repository.
Found violations are printed to the console and can be fixed automatically.
The validation check can be restricted to pending changes and/or the last commit e.g. to validate a commit before creating a PR.

```console
$ glsp checkHeaders -h

Usage: glsp checkHeaders [options] <rootDir>

Validates the copyright year range (end year) of license header files

Arguments:
  rootDir                               The starting directory for the check

Options:
  -t, --type <type>                     The scope of the check. In addition to a full recursive check, is also possible to only
                                        consider pending changes or the last commit (choices: "full", "changes", "lastCommit",
                                        default: "full")
  -f, --fileExtensions <extensions...>  File extensions that should be checked (default: ["ts","tsx"])
  -e, --exclude <exclude...>            File patterns that should be excluded from the check. New exclude patterns are added to
                                        the default patterns (default: [**/@(node_modules|lib|dist|bundle)/**])
  --no-exclude-defaults                 Disables the default excludes patterns. Only explicitly passed exclude patterns (-e,
                                        --exclude) are considered
  -j, --json                            Also persist validation results as json file (default: false)
  -a, --autoFix                         Auto apply & commit fixes without prompting the user (default: false)
  -h, --help                            display help for command
```

## coverageReport

The `coverageReport` command can be used to create a full nyc test coverage report for a lerna/yarn mono repository.
Individual coverage reports for each package are created and then combined to a full report.

```console
$ glsp coverageReport -h
Usage: glsp coverageReport [options]

Generate a test coverage report for a glsp component

Options:
  -p, --projectRoot <projectRoot>  The root directory of the GLSP component (default:
                                   "<cwd>")
  -c, --coverageScript <script>    Script command of the package root for creating coverage reports (default: "test:coverage")
  -h, --help                       display help for command
```

## updateNext

```console
$ glsp updateNext -h
Usage: glsp updateNext|u [options] [rootDir]

Updates all `next` dependencies in GLSP project to the latest version

Arguments:
  rootDir        The repository root (default: "<cwd>")

Options:
  -v, --verbose  Enable verbose (debug) log output (default: false)
  -h, --help     display help for command
```

## generateIndex

Use this command to create an index file of all sources for a given directory and all it's sub directories.

```console
$ glsp generateIndex -h
Usage: glsp generateIndex [options] <rootDir...>

Generate index files in a given source directory.

Arguments:
  rootDir                            The source directory for index generation.

Options:
  -s, --singleIndex                  Generate a single index file in the source directory instead of indices in each
                                     sub-directory (default: false)
  -f, --forceOverwrite               Overwrite existing index files and remove them if there are no entries (default: false)
  -m, --match [match patterns...]    File patterns to consider during indexing (default: ["**/*.ts","**/*.tsx"])
  -i, --ignore [ignore patterns...]  File patterns to ignore during indexing (default:
                                     ["**/*.spec.ts","**/*.spec.tsx","**/*.d.ts"])
  --style <importStyle>              Import Style (choices: "commonjs", "esm", default: "commonjs")
  --ignoreFile <ignoreFile>          The file that is used to specify patterns that should be ignored during indexing (default:
                                     ".indexignore")
  -v, --verbose                      Generate verbose output during generation (default: false)
  -h, --help                         display help for command
```

## releng

Commands for GLSP release engineering.
These commands are intended for CI usage and direct usage by Eclipse GLSP committers.
They are not general-purpose commands. Subcommands might rely on tools and CLI commands that are only available in
Linux environments.

```console
$ glsp releng -h
Usage: glsp releng [options] [command]

Commands for GLSP release engineering (Linux only, intended for CI/Maintainer use).

Options:
  -h, --help                                          display help for command

Commands:
  version [options] <versionType> [customVersion]  Set the version of all packages in a GLSP repository
  prepare [options] <versionType> [customVersion]     Prepare a new release for a GLSP component (version bump, changelog, PR
                                                      creation ...)
  help [command]                                      display help for command
```

### version

Command to bump the version of all packages in a GLSP repository.
Similar to "lerna version" this bumps the version of all workspace packages.
In addition, external GLSP dependencies are considered and bumped as well.
The glsp repository type ("glsp-client", "glsp-server-node" etc.) is auto detected from the given repository path.
If the command is invoked in a non-GLSP repository it will fail.

```console
$ glsp releng version -h
Usage: glsp releng version [options] <versionType> [customVersion]

Set the version of all packages in a GLSP repository

Arguments:
  versionType              The version type (choices: "major", "minor", "patch", "custom", "next")
  customVersion            Custom version number. Will be ignored if the release type is not "custom"

Options:
  -v, --verbose            Enable verbose (debug) log output (default: false)
  -r, --repoDir <repoDir>  Path to the component repository (default:
                           "<cwd>")
  -h, --help               display help for command
```

### prepare

Prepares a new release for a GLSP repository.
This includes bumping the version, updating the changelog, commit & push the changes
and opening a PR for the release.

The glsp repository type ("glsp-client", "glsp-server-node" etc.) is auto detected from the given repository path.
If the command is invoked in a non-GLSP repository it will fail.

```console
$ glsp releng prepare -h
Usage: glsp releng prepare [options] <versionType> [customVersion]

Prepare a new release for a GLSP component (version bump, changelog, PR creation ...)

Arguments:
  versionType              The version type (choices: "major", "minor", "patch", "custom", "next")
  customVersion            Custom version number. Will be ignored if the release type is not "custom"

Options:
  -v, --verbose            Enable verbose (debug) log output (default: false)
  -r, --repoDir <repoDir>  Path to the component repository (default:
                           "<cwd>")
  --no-push                Do not push changes to remote git repository
  -d, --draft              Create a draft pull request (only if push is enabled) (default: false)
  --no-check               Skip initial checks for existing dependency versions
  -h, --help               display help for command
```

## repo

Multi-repository workspace management for GLSP development.
All repositories are expected to live as siblings in a shared workspace directory (e.g. `~/glsp/glsp-client`, `~/glsp/glsp-server-node`, etc.).
Repositories are auto-discovered by scanning the workspace directory for known GLSP repo names.
The workspace directory is resolved automatically by walking up from the current directory; it can be overridden with `--dir`.
The clone protocol is auto-detected: if the GitHub CLI (`gh`) is installed and authenticated, `gh` is used; otherwise `https`.
This can be overridden per command via `--protocol`.

```bash
$ glsp repo -h
Usage: glsp repo [options] [command]

Multi-repository management for GLSP projects

Options:
  -h, --help                        display help for command

Commands:
  clone [options] [repos...]        Clone GLSP repositories
  fork [options] <user>             Add fork remotes to already-cloned repositories
  build [options]                   Build repositories (dependency-ordered)
  link [options]                    Interlink repositories via yarn link
  unlink [options]                  Remove yarn links between repositories
  pwd [options]                     Print resolved paths for all discovered repositories
  log [options]                     Print the last commit for all discovered repositories
  workspace                         Manage VS Code workspace files for GLSP projects
  glsp                              Operations on the glsp repository
  glsp-server-node|server-node      Operations on the glsp-server-node repository
  glsp-client|client                Operations on the glsp-client repository
  glsp-theia-integration|theia      Operations on the glsp-theia-integration repository
  glsp-vscode-integration|vscode    Operations on the glsp-vscode-integration repository
  glsp-eclipse-integration|eclipse  Operations on the glsp-eclipse-integration repository
  glsp-server|server-java           Operations on the glsp-server repository
  glsp-playwright|playwright        Operations on the glsp-playwright repository
  help [command]                    display help for command
```

### clone

Clones GLSP repositories into the workspace directory.
Repositories can be specified as positional arguments, via `--preset`, or interactively with `--interactive`.

```console
$ glsp repo clone -h
Usage: glsp repo clone [options] [repos...]

Clone GLSP repositories

Arguments:
  repos                      Repositories to clone (can combine with --preset)

Options:
  -d, --dir <path>           Target directory for repo clones
  -p, --protocol <protocol>  Git clone protocol (default: gh|https) (choices: "ssh", "https", "gh")
  -b, --branch <name>        Branch or tag to check out after cloning
  --fork <user>              Clone from a fork and set up dual-remote (origin=fork, upstream=eclipse-glsp)
  --override <mode>          How to handle an existing target directory (choices: "rename", "remove")
  --preset <name>            Clone repos from a preset (choices: "core", "theia", "vscode",
                             "eclipse", "playwright", "all")
  -i, --interactive          Guided setup: choose preset, protocol, and fork interactively (default: false)
  --no-fail-fast             Continue cloning after a failure
  -v, --verbose              Verbose output (default: false)
  -h, --help                 display help for command
```

### fork

Adds fork remotes to already-cloned repositories. For each repo, restructures the git remotes so that
`origin` points to your fork and `upstream` points to `eclipse-glsp`. If the fork doesn't exist on GitHub
and the `gh` CLI is available, it will create one.

```console
$ glsp repo fork -h
Usage: glsp repo fork [options] <user>

Add fork remotes to already-cloned repositories

Arguments:
  user                       GitHub username for the fork

Options:
  -d, --dir <path>           Target directory where repos are cloned
  -p, --protocol <protocol>  Git clone protocol (default: gh|https) (choices: "ssh", "https", "gh")
  -r, --repo <name...>       Fork only these repos
  --preset <name>            Fork repos from a preset (choices: "core", "theia", "vscode",
                             "eclipse", "playwright", "all")
  -v, --verbose              Verbose output (default: false)
  -h, --help                 display help for command
```

### build

Builds repositories in dependency order. Understands the GLSP dependency graph and builds prerequisites first.

```console
$ glsp repo build -h
Usage: glsp repo build [options]

Build repositories (dependency-ordered)

Options:
  -d, --dir <path>      Target directory where repos are cloned
  -r, --repo <name...>  Build only these repos
  --preset <name>       Build repos from a preset (choices: "core", "theia", "vscode",
                        "eclipse", "playwright", "all")
  --electron            Build Theia electron variant instead of browser (default: false)
  --no-java             Skip repositories that require Java/Maven
  --no-fail-fast        Continue building after a failure
  -v, --verbose         Verbose output (default: false)
  -h, --help            display help for command
```

### link / unlink

Links (or unlinks) repositories via `yarn link` for cross-repo development.
Repositories are processed in dependency order, and singleton dependencies (sprotty, inversify, etc.)
are shared from `glsp-client` to avoid duplicate instances.

```console
$ glsp repo link -h
Usage: glsp repo link [options]

Interlink repositories via yarn link

Options:
  -d, --dir <path>      Target directory where repos are cloned
  -r, --repo <name...>  Link only these repos
  --preset <name>       Link repos from a preset (choices: "core", "theia", "vscode",
                        "eclipse", "playwright", "all")
  --no-fail-fast        Continue after a failure
  -v, --verbose         Verbose output (default: false)
  -h, --help            display help for command
```

### pwd

```console
$ glsp repo pwd -h
Usage: glsp repo pwd [options]

Print resolved paths for all discovered repositories

Options:
  -d, --dir <path>  Target directory where repos are cloned
  --raw             Print repo<tab>path per line, no color (default: false)
  -v, --verbose     Verbose output (default: false)
  -h, --help        display help for command
```

### log

```console
$ glsp repo log -h
Usage: glsp repo log [options]

Print the last commit for all discovered repositories

Options:
  -d, --dir <path>      Target directory where repos are cloned
  -r, --repo <name...>  Log only these repos
  --preset <name>       Log repos from a preset (choices: "core", "theia", "vscode",
                        "eclipse", "playwright", "all")
  -v, --verbose         Verbose output (default: false)
  -h, --help            display help for command
```

### workspace

Manage VS Code multi-root workspace files.

```console
$ glsp repo workspace init -h
Usage: glsp repo workspace init [options]

Generate a VS Code multi-root workspace file

Options:
  -d, --dir <path>      Target directory where repos are cloned
  -o, --output <path>   Output path for the workspace file
  -r, --repo <name...>  Include only these repos
  --preset <name>       Include repos from a preset (choices: "core", "theia", "vscode",
                        "eclipse", "playwright", "all")
  -v, --verbose         Verbose output (default: false)
  -h, --help            display help for command
```

```console
$ glsp repo workspace open -h
Usage: glsp repo workspace open [options]

Open the VS Code workspace file

Options:
  -d, --dir <path>  Target directory where repos are cloned
  -v, --verbose     Verbose output (default: false)
  -h, --help        display help for command
```

### Scoped repository commands

Each repository has a set of scoped subcommands accessible via `glsp repo <name>` or its short alias.
Short aliases: `client`, `server-node`, `theia`, `vscode`, `eclipse`, `server-java`, `playwright`.

All repos support `clone`, `switch`, `build`, `pwd`, and `log` subcommands.
Some repos have additional repo-specific commands:

| Repo                      | Extra commands         |
| ------------------------- | ---------------------- |
| `glsp-client`             | `start`                |
| `glsp-server-node`        | `start`                |
| `glsp-server`             | `start`                |
| `glsp-theia-integration`  | `start`, `open`        |
| `glsp-vscode-integration` | `vsix-path`, `package` |

```console
$ glsp repo client -h
Usage: glsp repo glsp-client|client [options] [command]

Operations on the glsp-client repository

Commands:
  clone [options]   Clone the glsp-client repository
  switch [options]  Switch branch or checkout a PR in glsp-client
  build [options]   Build the glsp-client repository
  pwd [options]     Print the resolved path for glsp-client
  log [options]     Print the last commit for glsp-client
  start [options]   Start the standalone example for glsp-client
  help [command]    display help for command
```

```console
$ glsp repo vscode -h
Usage: glsp repo glsp-vscode-integration|vscode [options] [command]

Operations on the glsp-vscode-integration repository

Commands:
  clone [options]      Clone the glsp-vscode-integration repository
  switch [options]     Switch branch or checkout a PR in glsp-vscode-integration
  build [options]      Build the glsp-vscode-integration repository
  pwd [options]        Print the resolved path for glsp-vscode-integration
  log [options]        Print the last commit for glsp-vscode-integration
  vsix-path [options]  Print the path to the workflow VSIX file
  package [options]    Package the workflow VS Code extension as a VSIX
  help [command]       display help for command
```

```console
$ glsp repo theia -h
Usage: glsp repo glsp-theia-integration|theia [options] [command]

Operations on the glsp-theia-integration repository

Commands:
  clone [options]   Clone the glsp-theia-integration repository
  switch [options]  Switch branch or checkout a PR in glsp-theia-integration
  build [options]   Build the glsp-theia-integration repository
  pwd [options]     Print the resolved path for glsp-theia-integration
  log [options]     Print the last commit for glsp-theia-integration
  start [options]   Start the Theia application for glsp-theia-integration
  open [options]    Open the Theia application in the browser for glsp-theia-integration
  help [command]    display help for command
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
