# Contributing to Eclipse GLSP

Thank you for your interest in the GLSP project!
The following is a set of guidelines for contributing to GLSP.

## Code of Conduct

This project is governed by the [Eclipse Community Code of Conduct](https://github.com/eclipse/.github/blob/master/CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.

## Communication

The following communication channels are available:

-   [GitHub issues](https://github.com/eclipse-glsp/glsp/issues) - for bug reports, feature requests, etc.
-   [GitHub Discussions](https://github.com/eclipse-glsp/glsp/discussions) - for questions
-   [Developer mailing list](https://accounts.eclipse.org/mailing-list/glsp-dev) - for organizational issues (e.g. elections of new committers)

In case you have a question, please look into the [GitHub Discussions](https://github.com/eclipse-glsp/glsp/discussions) first.
If you don't find any answer there, feel free to start a new discussion or create a new [issue](https://github.com/eclipse-glsp/glsp/issues) to get help.

Please create new issues only in the [GLSP umbrella project](https://github.com/eclipse-glsp/glsp), as we are tracking the issues for all components of GLSP there.

## How to Contribute

In order to contribute, please first open an issue in this project, irrespectively whether this bug or feature concerns the glsp-client, glsp-server, or one of the platform integrations.
This issue should describe the bug you intend to fix or the feature you would like to add.
Once you have your code ready for review, please open a pull request in the respective repository.
A [committer of the GLSP project](https://projects.eclipse.org/projects/ecd.glsp/who) will then review your contribution and help to get it merged.

Please note that before your pull request can be accepted, you must electronically sign the [Eclipse Contributor Agreement](https://www.eclipse.org/legal/ECA.php).
For more information, see the [Eclipse Foundation Project Handbook](https://www.eclipse.org/projects/handbook/#resources-commit).

### Branch names and commit messages

If you are an [elected committer of the GLSP project](https://projects.eclipse.org/projects/ecd.glsp/who) please create a branch in the respective repository.
Otherwise please fork and create a branch in your fork for the pull request.

The branch name should be in the form `issues/{issue_number}`, e.g. `issues/123`. So please create an issue before creating a pull request.
All branches with this naming schema will be deleted after they are merged.

In the commit message you should also reference the corresponding issue, e.g. using `closes https://github.com/eclipse-glsp/glsp/issues/241`, thus allowing [auto close of issues](https://help.github.com/en/github/managing-your-work-on-github/closing-issues-using-keywords).
Please use the absolute URL of the issue instead of just `#241`, as all issues are kept in <https://github.com/eclipse-glsp/glsp>, whereas the pull requests are opened against the respective repositories, such as <https://github.com/eclipse-glsp/glsp-client>.
Using the absolute URL will still allow to correctly reference issues irrespectively where you open the pull request.

Please make sure you read the [guide for a good commit message](https://chris.beams.io/posts/git-commit/).
