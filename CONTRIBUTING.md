# Contributing to Eclipse GLSP

Thank you for your interest in the GLSP project! The following is a set of guidelines for contributing to GLSP.

## Code of Conduct

This project is governed by the [Eclipse Community Code of Conduct](https://github.com/eclipse/.github/blob/master/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Communication

The following communication channels are available:

 * [GitHub issues](https://github.com/eclipse-glsp/glsp/issues) - for bug reports, feature requests, etc.
 * [Eclipse community forum](https://www.eclipse.org/forums/index.php/f/443/) - for questions
 * [Developer mailing list](https://accounts.eclipse.org/mailing-list/glsp-dev) - for organizational issues (e.g. elections of new committers)

In case you have a question, please look into the [documentation in the Wiki](https://github.com/eclipse-glsp/glsp/wiki) first. If you don't find any answer there, feel free to use the chat, forum or issues to get help.

## How to Contribute

Before your pull request can be accepted, you must electronically sign the [Eclipse Contributor Agreement](https://www.eclipse.org/legal/ECA.php).

Unless you are an [elected committer of the GLSP project](https://projects.eclipse.org/projects/ecd.glsp/who), you must include a `Signed-off-by` line in the commit message. This line can be generated with the [-s flag of git commit](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt--s). By doing this you confirm that your contribution conforms to the Eclipse Contributor Agreement.

For more information, see the [Eclipse Foundation Project Handbook](https://www.eclipse.org/projects/handbook/#resources-commit).

### Branch names and commit messages
If you are an [elected committer of the GLSP project](https://projects.eclipse.org/projects/ecd.glsp/who) please create a branch. Otherwise please fork and create a branch in your fork for the Pull Request.

The branch name should be in the form `issues/{issue_number}`, e.g. `issues/123` So please create an issue before creating a pull request.
All branches with this naming schema will be deleted after they are merged.

In the commit message you should also reference the corresponding issue, e.g. using `closes #123`, thus allowing [auto close of issues](https://help.github.com/en/github/managing-your-work-on-github/closing-issues-using-keywords).

Please make sure you read the [guide for a good commit message](https://chris.beams.io/posts/git-commit/).
