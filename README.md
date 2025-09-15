# Eclipse GLSP

[![Client Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master/badge/icon?subject=client)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-client/job/master/)
[![ServerJava Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server/job/master/badge/icon?subject=server-java)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server/job/master/)
[![ServerNode Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server-node/job/main/badge/icon?subject=server-node)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-server-node/job/main/)
[![Dev Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp/job/master/badge/icon?subject=dev-packages)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp/job/master/)
[![Theia Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-theia-integration/ci.yml?branch=master&label=theia%20integration)](https://github.com/eclipse-glsp/glsp-theia-integration/actions/workflows/ci.yml)
[![Vscode Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-vscode-integration/job/master/badge/icon?subject=vscode-integration)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-vscode-integration/job/master/)
[![Eclipse Status](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-eclipse-integration/job/master/badge/icon?subject=eclipse-integration)](https://ci.eclipse.org/glsp/job/eclipse-glsp/job/glsp-eclipse-integration/job/master/)
[![Playwright Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-playwright/ci.yml?branch=main&label=playwright)](https://github.com/eclipse-glsp/glsp-playwright/actions/workflows/ci.yml)
[![Examples Status](https://img.shields.io/github/actions/workflow/status/eclipse-glsp/glsp-examples/ci.yml?branch=master&label=examples)](https://github.com/eclipse-glsp/glsp-examples/actions/workflows/ci.yml)

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

-   [`glsp-client`](https://github.com/eclipse-glsp/glsp-client): Contains the code for the ([Sprotty](https://github.com/eclipse/sprotty)-based) client.
-   [`glsp-server`](https://github.com/eclipse-glsp/glsp-server): Contains the code for a Java-based framework to create GLSP server components.
-   [`glsp-server-node`](https://github.com/eclipse-glsp/glsp-server-node): Contains the code for a typescript-based framework to create GLSP server components running in node or pure browser applications.
-   [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration): Provides the glue code to integrate GLSP diagrams editors into [Theia](https://github.com/theia-ide/theia).
-   [`glsp-eclipse-integration`](https://github.com/eclipse-glsp/glsp-eclipse-integration): Provides the integration of GLSP diagram editors with the Eclipse IDE.
-   [`glsp-vscode-integration`](https://github.com/eclipse-glsp/glsp-vscode-integration): Provides the integration of GLSP diagrams editors into [VS Code](https://github.com/microsoft/vscode).
-   [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples): Contains various examples and project templates to demonstrate GLSP in action.
-   [`glsp-playwright`](https://github.com/eclipse-glsp/glsp-playwright): Playwright-based framework for testing GLSP diagram editors.

## Release plan

We release a minor version of Eclipse GLSP every three months, aligned with the [Eclipse Theia Community Releases](https://theia-ide.org/releases/), focusing on bug fixes and adding functionality while ensuring backward compatibility.
Currently, there are no major releases with API breaks planned.
For a detailed history of past releases, visit our [releases page on GitHub](https://github.com/eclipse-glsp/glsp/releases).

## Shared artifacts

This repository provides the following packages and artifacts that are shared across all GLSP repositories and/or projects:

-   [Eclipse GLSP docker images](docker/ci/README.md)
-   [Eclipse GLSP Dev Packages](dev-packages/README.md)

## Build artifacts

Packages are available via [npmjs](https://www.npmjs.com/search?q=%40eclipse-glsp), such as the [glsp-client](https://www.npmjs.com/package/@eclipse-glsp/client) and the [theia integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration).
The [examples](https://www.npmjs.com/search?q=%40eclipse-glsp-examples) are available on npmjs too.

The Java server packages are available as maven as well as p2 dependency from the following maven repository or p2 update site.

### Maven Repositories

-   _Snapshots_: <https://oss.sonatype.org/content/repositories/snapshots/org/eclipse/glsp/>
-   _Releases/Release Candidates_: <https://central.sonatype.com/search?q=org.eclipse.glsp&namespace=org.eclipse.glsp>

### P2 Update Sites

-   _Server Snapshots_: <https://download.eclipse.org/glsp/server/p2/nightly/>
-   _Server Release Candidates_: <https://download.eclipse.org/glsp/server/p2/staging/>
-   _Server Releases_: <https://download.eclipse.org/glsp/server/p2/releases/>
    <br><br>
-   _Eclipse Integration Snapshots_: </i> <https://download.eclipse.org/glsp/ide/p2/nightly/>
-   _Eclipse Integration Release Candidates_: </i> <https://download.eclipse.org/glsp/ide/p2/staging/>
-   _Eclipse Integration Releases_: </i> <https://download.eclipse.org/glsp/ide/p2/releases/>

All changes on the master branch are deployed automatically to the corresponding snapshot repositories.

## Prerequisites for building

### Client packages

We recommend node in version 18 or higher:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18
```

and Yarn

```bash
npm install -g yarn
```

and Lerna

```bash
npm install -g lerna
```

### Server/Ide packages

You'll need Java 17 and maven.

## Building

> **_NOTE:_** This section describes how to build the core components of glsp.
> To build an optional integration component like the integration for VS Code or
> Eclipse IDE please follow the build instructions in the corresponding repository.

To build the client packages, just invoke

```bash
yarn install
```

in `glsp-client` and `glsp-theia-integration`.  
To start an example server, you can either

-   run
    ```bash
    yarn start:exampleServer
    ```
    in `glsp-client` and open the `glsp-client/examples/workflow-standalone/app/diagram.html` file in your browser of choice
-   run
    ```bash
    yarn start
    ```
    in `glsp-theia-integration` and head your favorite browser to http://localhost:3000.

The server components are built with

```bash
mvn clean verify
```

in `glsp-server`, and

```bash
yarn
```

in `glsp-server-node`.

## Building and starting the Workflow Diagram example

The Workflow Diagram is a consistent example provided by all GLSP components.
The example implements a simple flow chart diagram editor with different types of nodes and edges (see screenshot below).
The example can be used to try out different GLSP features, as well as several available integrations with IDE platforms (Theia, VS Code, Eclipse, Standalone).
As the example is fully open source, you can also use it as a blueprint for a custom implementation of a GLSP diagram editor.
The workflow example consists of the following components: the Workflow Diagram Server, the client, and optionally an IDE integration of the Workflow Diagram Editor.
Please follow the steps below to build and run each of those components.

### Building and running the Workflow Diagram Server

```bash
cd glsp-server
mvn clean verify -Pfatjar
```

In the folder `glsp-server/examples/org.eclipse.glsp.example.workflow/target`, you should have a jar file `org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar` whereas `X.X.X` is the current version.
You can now start the server by executing the following commands:

```bash
cd examples/org.eclipse.glsp.example.workflow/target
java -jar org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar org.eclipse.glsp.example.workflow.launch.ExampleServerLauncher
```

To start the example server from within your IDE, run the main method of the class [ExampleServerLauncher.java](https://github.com/eclipse-glsp/glsp-server/blob/master/examples/org.eclipse.glsp.example.workflow/src/org/eclipse/glsp/example/workflow/launch/WorkflowServerLauncher.java) in the module `glsp-server/examples/org.eclipse.glsp.example.workflow`.

### Building and running the Workflow Diagram Editor in a Theia application

Note that it is not necessary to build the other components of GLSP just for running the workflow example, as the workflow example build will pull all dependencies (including those from GLSP) from npmjs and sonar.

Switch to the folder `glsp-theia-integration` in your clone of the [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration) repository and build.

```bash
cd glsp-theia-integration
yarn
```

This will not only build the GLSP Theia integration modules, but also the workflow diagram editor example.
Once the build is finished, you can start the Theia application:

```bash
cd glsp-theia-integration/examples/browser-app
yarn start
```

Now open a browser and point it to <http://localhost:3000>.
If you open this the first time and you don't have selected a workspace yet, point it to [`glsp-theia-integration/examples/workspace`](https://github.com/eclipse-glsp/glsp-theia-integration/tree/master/examples/workspace) of your repository clone.
This will already include an up to date workflow file `example1.wf` that you can open by double-clicking it in the navigator.

In order to start the workflow diagram editor example with VS Code, Eclipse, or standalone, please see the documentation of the respective integration modules:

-   [VS Code Integration](https://github.com/eclipsesource/glsp-vscode-integration#workflow-diagram-example)
-   [Eclipse Integration](https://github.com/eclipse-glsp/glsp-eclipse-integration#workflow-diagram-example)
-   [Standalone](https://github.com/eclipse-glsp/glsp-client#workflow-diagram-example)
-   [Theia Integration](https://github.com/eclipse-glsp/glsp-theia-integration#workflow-diagram-example)

## Setting up your development environment

If you want to explore or extend the GLSP source code in any of the available components, we recommend cloning the repositories alongside this repository, so that you have the following folder layout:

-   `eclipse-glsp` (or any name for your parent folder)
-   [`glsp`](https://github.com/eclipse-glsp/glsp)
-   [`glsp-client`](https://github.com/eclipse-glsp/glsp-client)
-   [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration)
-   [`glsp-server`](https://github.com/eclipse-glsp/glsp-server)
-   [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples)

For the client-side code (Typescript), we recommend using VS Code.
Therefore, this repository provides a VS Code [workspace file](glsp.code-workspace), which you can open in VS Code and it will import all client-side folders for you -- given that you kept the repository structure specified above.

The [GLSP workspace file](glsp.theia.code-workspace) provides build & watch tasks, so that you can build all packages with the task `Build all` or start watching all client packages with `Watch all`.

For the [server components](https://github.com/eclipse-glsp/glsp-server), you can use any IDE you like.
We recommend an IDE that supports maven, though, to import the maven modules from the [glsp-server](https://github.com/eclipse-glsp/glsp-server) and optionally also those from the [glsp-examples](https://github.com/eclipse-glsp/glsp-examples/tree/master/server/).

### Linking and watching

When you are planning to change more than one client package at a time, or if you want to test your changes with the workflow example, we recommend to `yarn link` your local sources.
Therefore, we provide the [yarn-link script](https://github.com/eclipse-glsp/glsp-theia-integration/blob/master/configs/local-linking.sh) that automatically links all the relevant packages.
Currently, this script is only available for Linux and Mac (shell script).
The [GLSP VS Code workspace](glsp.theia.code-workspace) also includes a dedicated VS Code task called `Yarn link all packages` and `Yarn unlink all packages`.
