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
  publish [options]                                   Publish a new release for a GLSP component (npm, maven, github ...)
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

### publish

Helper command for publishing a new GLSP release.
This command should be used on the main branch of GLSP repo after a (previously prepared) Release PR has been merged.
Creates & publishes an new tag and Github release.
In addition, for all non-Java repositories the release version will be published to npm.

The glsp repository type ("glsp-client", "glsp-server-node" etc.) is auto detected from the given repository path.
If the command is invoked in a non-GLSP repository it will fail.

```console
$ glsp releng publish -h\
Usage: glsp releng publish [options]

Publish a new release for a GLSP component (npm, maven, github ...)

Options:
  -v, --verbose            Enable verbose (debug) log output (default: false)
  -r, --repoDir <repoDir>  Path to the component repository (default:
                           "<cwd>")
  --no-npm                 Skip npm publishing
  -d, --draft              Create a draft GitHub release (default: false)
  -h, --help               display help for command
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

```

```
