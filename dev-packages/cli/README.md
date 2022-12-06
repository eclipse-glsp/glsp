# Eclipse GLSP - CLI

The `@eclipse-glsp/cli` package provides helpful scripts and commands for extension and application development.
The contributed `glsp`, is a command line tool that offers all contributed commands.

## Getting Started

Install `@eclipse-glsp/cli` as a dev dependency in your application.

```bash
yarn add @eclipse-glsp/cli --dev
```

## Commands

Eclipse GLSP committers can use the `release` following command to prepare & publish a new Github release
for a specific GLSP component.

```bash
$ glsp release -h
Usage: glsp release [options] <component> <releaseType> [customVersion]

Prepare & publish a new release for a glsp component

Arguments:
  component                        The glsp component to be released (choices: "client", "theia-integration", "vscode-integration", "eclipse-integration", "server-node", "server-java")
  releaseType                      The release type (choices: "major", "minor", "patch", "rc", "custom")
  customVersion                    Custom version number. Will be ignored if the release type is not "custom"

Options:
  -V, --version                    output the version number
  -f, --force                      Enable force mode (default: false)
  -d, --checkoutDir <checkoutDir>  The git checkout directory (default: "/home/tobias/Git/OpenSource/glsp/glsp/dev-packages/cli")
  -b, --branch <branch>            The git branch to checkout (default: "master")
  -v, --verbose                    Enable verbose (debug) log output (default: false)
  --no-publish                     Only prepare release but do not publish to github
  --draft                          Publish github releases as drafts (default: false)
  --npm-dryRun                     Execute a npm dry-run for inspection. Publishes to the local npm registry and does not publish to github (default: false)
  -h, --help                       display help for command
```

## More information

For more information, please visit the [Eclipse GLSP Umbrella repository](https://github.com/eclipse-glsp/glsp) and the [Eclipse GLSP Website](https://www.eclipse.org/glsp/).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).
