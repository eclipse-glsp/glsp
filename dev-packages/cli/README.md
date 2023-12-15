# Eclipse GLSP - CLI

The `@eclipse-glsp/cli` package provides helpful scripts and commands for extension and application development.
The contributed `glsp`, is a command line tool that offers all contributed commands.

## Getting Started

Install `@eclipse-glsp/cli` as a dev dependency in your application.

```bash
yarn add @eclipse-glsp/cli --dev
```

## checkHeaders

The `checkHeaders` command can be used to validate the copyright year (range) of license headers.
It checks for each file (matching the include pattern) whether the defined copyright range is in line with the first and last modification date in the git repository.
Found violations are printed to the console and can be fixed automatically.
The validation check can be restricted to pending changes and/or the last commit e.g. to validate a commit before creating a PR.

```console
$ glsp checkHeaders -h

Usage: glsp checkHeaders [options] <rootDir>

Validates the copyright year range of license header files

Arguments:
  rootDir                               The starting directory for the check

Options:
  -t, --type <type>                     The scope of the check. In addition to a full recursive check, is also possible to only consider pending changes or the last commit (choices: "full", "changes", "lastCommit", default:
                                        "full")
  -f, --fileExtensions <extensions...>  File extensions that should be checked (default: ["ts","tsx"])
  -e, --exclude <exclude...>            File patterns that should be excluded from the check. New exclude patterns are added to the default patterns (default: [**/@(node_modules|lib|dist|bundle)/**])
  --no-exclude-defaults                 Disables the default excludes patterns. Only explicitly passed exclude patterns (-e, --exclude) are considered
  -j, --json                            Also persist validation results as json file (default: false)
  -s, --severity <severity>             The severity of validation results that should be printed. (choices: "error", "warn", "ok", default: "error" (only))
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
  -p, --projectRoot <projectRoot>  The root directory of the GLSP component (default: "<cwd>")
  -c, --coverageScript <script>    Script command of the package root for creating coverage reports (default: "test:coverage")
  -h, --help                       display help for command
```

## release

Eclipse GLSP committers can use the `release` command to prepare & publish a new Github release for a specific GLSP component.

```console
$ glsp release -h
Usage: glsp release [options] <component> <releaseType> [customVersion]

Prepare & publish a new release for a glsp component

Arguments:
  component                        The glsp component to be released (choices: "client", "theia-integration", "vscode-integration", "eclipse-integration", "server-node", "server-java")
  releaseType                      The release type (choices: "major", "minor", "patch", "rc", "custom")
  customVersion                    Custom version number. Will be ignored if the release type is not "custom"

Options:
  -f, --force                      Enable force mode (default: false)
  -d, --checkoutDir <checkoutDir>  The git checkout directory (default: "<cwd>")
  -b, --branch <branch>            The git branch to checkout (default: "master")
  -v, --verbose                    Enable verbose (debug) log output (default: false)
  --no-publish                     Only prepare release but do not publish to github
  --draft                          Publish github releases as drafts (default: false)
  --npm-dryRun                     Execute a npm dry-run for inspection. Publishes to the local npm registry and does not publish to github (default: false)
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
Usage: glsp generateIndex [options] <rootDir>

Generate index files in a given source directory.

Arguments:
  rootDir                            The source directory for index generation.

Options:
  -s, --singleIndex                  Generate a single index file in the source directory instead of indices in each sub-directory (default: false)
  -f, --forceOverwrite               Overwrite existing index files and remove them if there are no entries (default: false)
  -m, --match [match patterns...]    File patterns to consider during indexing (default: ["**/*.ts","**/*.tsx"])
  -i, --ignore [ignore patterns...]  File patterns to ignore during indexing (default: ["**/*.spec.ts","**/*.spec.tsx","**/*.d.ts"])
  -s, --style <importStyle>          Import Style (choices: "commonjs", "esm", default: "commonjs")
  --ignoreFile <ignoreFile>          The file that is used to specify patterns that should be ignored during indexing (default: ".indexignore")
  -v, --verbose                      Generate verbose output during generation (default: false)
  -h, --help                         display help for command
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
