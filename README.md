# Eclipse GLSP

[![Client Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-client/ci.yml?branch=master&label=Client)](https://github.com/eclipse-glsp/glsp-client/actions/workflows/ci.yml)
[![ServerJava Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server/job/master/badge/icon?subject=server-java)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server/job/master/)
[![ServerNode Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-server-node/ci.yml?branch=main&label=server-node)](https://github.com/eclipse-glsp/glsp-server-node/actions/workflows/ci.yml)
[![Dev Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp/ci.yml?branch=master&label=dev-packages)](https://github.com/eclipse-glsp/glsp/actions/workflows/ci.yml)
[![Theia Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-theia-integration/ci.yml?branch=master&label=theia%20integration)](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/ci.yml)
[![Vscode Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-vscode-integration/ci.yml?branch=master&label=vscode%20integration)](https://github.com/eclipse-glsp/glsp-vscode-integration/actions/workflows/ci.yml)
[![Eclipse Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-eclipse-integration/job/master/badge/icon?subject=eclipse-integration)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-eclipse-integration/job/master/)
[![Playwright Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-playwright/ci.yml?branch=main&label=playwright)](https://github.com/eclipse-glsp/glsp-playwright/actions/workflows/ci.yml)
[![Examples Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-examples/ci.yml?branch=master&label=examples)](https://github.com/eclipse-glsp/glsp-examples/actions/workflows/ci.yml)

For a full overview of all CI workflows across the organization, see [Workflow Status](WORKFLOW_STATUS.md).

The **G**raphical **L**anguage **S**erver **P**latform provides extensible components for the development of _diagram editors including edit functionality_ in (distributed) web-applications via a client-server protocol.

It follows the architectural pattern of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol), but applies it to graphical modeling and diagram editors for browser/cloud-based deployments.
Parts of the protocol and the web-based client implementation is based on [Sprotty](https://github.com/eclipse/sprotty) but extends it with editing functionality and GLSP-specific communication with the server.

For more information, please have a look at the [GLSP documentation](https://www.eclipse.org/glsp/documentation/), visit the [GLSP website](https://www.eclipse.org/glsp/) and the [protocol spec](https://www.eclipse.org/glsp/documentation/protocol).
If you have questions, please raise them in the [discussions](https://github.com/eclipse-glsp/glsp/discussions) and have a look at our [communication and support options](https://www.eclipse.org/glsp/contact/).

https://user-images.githubusercontent.com/588090/154459938-849ca684-11b3-472c-8a59-98ea6cb0b4c1.mp4

## Getting started

The best way to getting started is to read the [overview in the documentation](https://www.eclipse.org/glsp/documentation/overview) and follow the [getting started guide](https://www.eclipse.org/glsp/documentation/gettingstarted).

## Features

Below is a list of features that are supported by the different base technologies that can be used with GLSP.

<details>
  <summary>Expand feature list</summary>
  
| Feature                                                                              |      Standalone      | Theia Integration | Eclipse Integration | VS Code Integration |
| ------------------------------------------------------------------------------------ | :------------------: | :---------------: | :-----------------: | :-----------------: |
| Model Saving                                                                         |          ✓           |         ✓         |          ✓          |          ✓          |
| Model Dirty State                                                                    |                      |         ✓         |          ✓          |          ✓          |
| Model SVG Export                                                                     |          ✓           |         ✓         |          ✓          |          ✓          |
| Model Layout                                                                         |          ✓           |         ✓         |          ✓          |          ✓          |
| Restoring viewport on re-open                                                        |                      |         ✓         |                     |                     |
| Model Edit Modes<br>- Edit<br>- Read-only                                            |   <br>✓<br>✓&nbsp;   |    <br>✓<br>✓     |   <br>✓<br>&nbsp;   |  <br>✓<br>✓&nbsp;   |
| Client View Port<br>- Center<br>- Fit to Screen                                      |      <br>✓<br>✓      |    <br>✓<br>✓     |     <br>✓<br>✓      |     <br>✓<br>✓      |
| Client Status Notification                                                           |          ✓           |         ✓         |          ✓          |          ✓          |
| Client Message Notification                                                          |          ✓           |         ✓         |                     |          ✓          |
| Client Progress Reporting                                                            |                      |         ✓         |                     |          ✓          |
| Element Selection                                                                    |          ✓           |         ✓         |          ✓          |          ✓          |
| Element Hover                                                                        |          ✓           |         ✓         |          ✓          |          ✓          |
| Element Validation                                                                   |          ✓           |         ✓         |          ✓          |          ✓          |
| Element Navigation                                                                   |                      |         ✓         |          ✓          |          ✓          |
| Element Type Hints                                                                   |          ✓           |         ✓         |          ✓          |          ✓          |
| Element Creation and Deletion                                                        |          ✓           |         ✓         |          ✓          |          ✓          |
| Node Change Bounds<br>- Move<br>- Resize                                             |      <br>✓<br>✓      |    <br>✓<br>✓     |     <br>✓<br>✓      |     <br>✓<br>✓      |
| Node Change Container                                                                |          ✓           |         ✓         |          ✓          |          ✓          |
| Edge Reconnect                                                                       |          ✓           |         ✓         |          ✓          |          ✓          |
| Edge Routing Points                                                                  |          ✓           |         ✓         |          ✓          |          ✓          |
| Ghost Elements                                                                       |          ✓           |         ✓         |          ✓          |          ✓          |
| Element Text Editing                                                                 |          ✓           |         ✓         |          ✓          |          ✓          |
| Clipboard (Cut, Copy, Paste)                                                         |          ✓           |         ✓         |          ✓          |          ✓          |
| Undo / Redo                                                                          |          ✓           |         ✓         |          ✓          |          ✓          |
| Contexts<br>- Context Menu<br>- Command Palette<br>- Tool Palette                    |    <br><br>✓<br>✓    |  <br>✓<br>✓<br>✓  |   <br><br>✓<br>✓    |   <br>✓<br>✓<br>✓   |
| Accessibility Features (experimental) <br>- Search<br>- Move <br>- Zoom <br>- Resize | <br>✓<br>✓<br>✓<br>✓ |                   |                     |                     |
| Helper Lines (experimental)                                                          |          ✓           |         ✓         |          ✓          |          ✓          |
</details>

## Repositories

The GLSP source code consists of the following repositories:

- [`glsp-client`](https://github.com/eclipse-glsp/glsp-client): Contains the code for the ([Sprotty](https://github.com/eclipse/sprotty)-based) client.
- [`glsp-server`](https://github.com/eclipse-glsp/glsp-server): Contains the code for a Java-based framework to create GLSP server components.
- [`glsp-server-node`](https://github.com/eclipse-glsp/glsp-server-node): Contains the code for a typescript-based framework to create GLSP server components running in node or pure browser applications.
- [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration): Provides the glue code to integrate GLSP diagrams editors into [Theia](https://github.com/theia-ide/theia).
- [`glsp-eclipse-integration`](https://github.com/eclipse-glsp/glsp-eclipse-integration): Provides the integration of GLSP diagram editors with the Eclipse IDE.
- [`glsp-vscode-integration`](https://github.com/eclipse-glsp/glsp-vscode-integration): Provides the integration of GLSP diagrams editors into [VS Code](https://github.com/microsoft/vscode).
- [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples): Contains various examples and project templates to demonstrate GLSP in action.
- [`glsp-playwright`](https://github.com/eclipse-glsp/glsp-playwright): Playwright-based framework for testing GLSP diagram editors.

## Release plan

We release a minor version of Eclipse GLSP every three months, aligned with the [Eclipse Theia Community Releases](https://theia-ide.org/releases/), focusing on bug fixes and adding functionality while ensuring backward compatibility.
Currently, there are no major releases with API breaks planned.
For a detailed history of past releases, visit our [releases page on GitHub](https://github.com/eclipse-glsp/glsp/releases).

## Shared artifacts

This repository provides the following packages and artifacts that are shared across all GLSP repositories and/or projects:

- [Eclipse GLSP docker images](docker/ci/README.md)
- [Eclipse GLSP Dev Packages](dev-packages/README.md)

## Build artifacts

Packages are available via [npmjs](https://www.npmjs.com/search?q=%40eclipse-glsp), such as the [glsp-client](https://www.npmjs.com/package/@eclipse-glsp/client) and the [theia integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).
The [examples](https://www.npmjs.com/search?q=%40eclipse-glsp-examples) are available on npmjs too.

The Java server packages are available as maven as well as p2 dependency from the following maven repository or p2 update site.

### Maven Repositories

- _Snapshots_: <https://oss.sonatype.org/content/repositories/snapshots/org/eclipse/glsp/>
- _Releases/Release Candidates_: <https://central.sonatype.com/search?q=org.eclipse.glsp&namespace=org.eclipse.glsp>

### P2 Update Sites

- _Server Snapshots_: <https://download.eclipse.org/glsp/server/p2/nightly/>
- _Server Release Candidates_: <https://download.eclipse.org/glsp/server/p2/staging/>
- _Server Releases_: <https://download.eclipse.org/glsp/server/p2/releases/>
  <br><br>
- _Eclipse Integration Snapshots_: </i> <https://download.eclipse.org/glsp/ide/p2/nightly/>
- _Eclipse Integration Release Candidates_: </i> <https://download.eclipse.org/glsp/ide/p2/staging/>
- _Eclipse Integration Releases_: </i> <https://download.eclipse.org/glsp/ide/p2/releases/>

All changes on the master branch are deployed automatically to the corresponding snapshot repositories.

## Developer Documentation (dev-packages)

### First time setup

- Install [node.js](https://nodejs.org/) (requires Node v22+)
- Install pnpm: <https://pnpm.io/installation> (use pnpm 10+); a recent pnpm automatically switches to the version pinned in the `packageManager` field
- Clone this repository
- Install dependencies: `pnpm i` or `pnpm i --frozen-lockfile`

### Build & Testing

- Build (all packages): `pnpm build`
- Test (all packages): `pnpm test`
- Clean (all packages): `pnpm clean`

## Workflow Diagram Example

The Workflow Diagram is a consistent example provided by all GLSP components.
The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below).
The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VS Code, Eclipse, Standalone).
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
The workflow example consists of the following components: the Workflow Diagram Server, the client, and optionally an IDE integration of the Workflow Diagram Editor.

For detailed instructions on how to build and run the Workflow Diagram example, please refer to the [corresponding section in the `glsp-client` README](https://github.com/eclipse-glsp/glsp-client#workflow-diagram-example).
