# Eclipse GLSP

The <b>G</b>raphical <b>L</b>anguage <b>S</b>erver <b>P</b>latform provides extensible components to enable the development of *diagram editors including edit functionality* in (distributed) web-applications via a client-server protocol.

It follows the architectural pattern of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol), but applies it to graphical modeling and diagram editors for browser/cloud-based deployments.
The protocol as well as the client implementation is heavily based on [Sprotty](https://github.com/eclipse/sprotty) but extends it with editing functionality and GLSP-specific communication with the server.

For more information, please visit the [Eclipse GLSP Website](https://www.eclipse.org/glsp).

![alt](https://www.eclipse.org/glsp/images/diagramanimated.gif)

## Repositories

This repository contains the documentation of GLSP. The actual GLSP code is available in the following modules:

- [`glsp-client`](https://github.com/eclipse-glsp/glsp-client): Contains the code for the default ([Sprotty](https://github.com/eclipse/sprotty)-based) client.
- [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration): Provides the glue code to integrate GLSP diagrams editors into [Theia](https://github.com/theia-ide/theia)
- [`glsp-server`](https://github.com/eclipse-glsp/glsp-server): Contains the code for a Java-based framework to create GLSP server components.
- [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples): Contains various examples to demonstrate GLSP in action.

## Build artifacts

The client packages are available via [npmjs](https://www.npmjs.com/search?q=%40eclipse-glsp), such as the [glsp-client](https://www.npmjs.com/package/@eclipse-glsp/client) and the [theia integration](https://www.npmjs.com/package/@eclipse-glsp/theia-integration). The [examples](https://www.npmjs.com/search?q=%40eclipse-glsp-examples) are available on npmjs too.

The server packages are available as maven repository or p2 update site.

### Maven Repositories
- <i>Snapshots: </i> https://oss.sonatype.org/content/repositories/snapshots/org/eclipse/glsp/

### P2 Update Sites
- <i>Snapshots: </i> https://download.eclipse.org/glsp/server/p2/nightly/

All changes on the master branch are deployed automatically to the corresponding snapshot repositories.

## Prerequisites for building

### Client packages

You’ll need node in version 8:

	curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash
	nvm install 8

and Yarn

	npm install -g yarn

and Lerna

	npm install -g lerna

### Server packages

You'll need Java 11 and maven.

## Building

To build the client packages, just invoke `yarn` in `glsp-client`, `glsp-theia-integration`. If you want to build the example too, run `yarn` in `glsp-examples/client`.

The server components are built with `mvn clean install` in `glsp-server`. If you want to build the example server, run `mvn clean install` in `glsp-examples/server`.

## Building and starting the workflow example

Clone [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples), if you haven't already and switch to the cloned repository.

    git clone git@github.com:eclipse-glsp/glsp-examples.git
    cd glsp-examples

### Building and running the GLSP backend

    cd server
    mvn clean install -Pfatjar

In the folder `server/org.eclipse.glsp.example.workflow/target`, you should have a jar file `org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar` whereas `X.X.X` is the current version. You can now start the server by executing the following commands:

	cd org.eclipse.glsp.example.workflow/target
	java -jar org.eclipse.glsp.example.workflow-X.X.X-SNAPSHOT-glsp.jar org.eclipse.glsp.example.workflow.ExampleServerLauncher

To start the example server from within your IDE, run the main method of the class [ExampleServerLauncher.java](https://github.com/eclipse-glsp/glsp-examples/blob/master/server/org.eclipse.glsp.example.workflow/src/main/java/org/eclipse/glsp/example/workflow/ExampleServerLauncher.java) in the module `server/org.eclipse.glsp.example.workflow`.

### Building and running the Workflow Theia application

Note that it is not necessary to build the other components of GLSP just for running the workflow example, as the workflow example build will pull all dependencies (including those from GLSP) from npmjs and sonar.

Switch to the folder `client` in your clone of the [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples) repository and build.

    cd client
    yarn

This will not only build the GLSP workflow example modules, but also its Theia integration and a Theia application. Once the build is finished, you can start the Theia application:

    cd workflow/browser-app
    yarn start

Now open a browser and point it to http://localhost:3000.
If you open this the first time and you don't have selected a workspace yet, point it to `glsp-examples/client/workflow/workspace` of your repository clone. This will already include an up to date workflow file `example1.wf` that you can open.

## Setting up your development environment

We recommend cloning the repositories mentioned above alongside this repository, so that you have the following folder layout:

- `eclipse-glsp` (or any name for your parent folder)
  - [`glsp`](https://github.com/eclipse-glsp/glsp)
  - [`glsp-client`](https://github.com/eclipse-glsp/glsp-client)
  - [`glsp-theia-integration`](https://github.com/eclipse-glsp/glsp-theia-integration)
  - [`glsp-server`](https://github.com/eclipse-glsp/glsp-server)
  - [`glsp-examples`](https://github.com/eclipse-glsp/glsp-examples)

For the client-side code (Typescript), we recommend using VSCode. Therefore, this repository provides a VSCode [workspace file](glsp.code-workspace), which you can open in VSCode and it will import all client-side folders for you -- given that you kept the repository structure specified below.

The [GLSP workspace file](glsp.code-workspace) provides build & watch tasks, so that you can build all packages with the task `Build all` or start watching all client packages with `Watch all`.

For the [server components](https://github.com/eclipse-glsp/glsp-server), you can use any IDE you like. We recommend an IDE that supports maven, though, to import the maven moduels from the [glsp-server](https://github.com/eclipse-glsp/glsp-server) and optionally also those from the [glsp-examples](https://github.com/eclipse-glsp/glsp-examples/tree/master/server/).

### Linking and watching

When you are planning to change more than one client package at a time, or you want to test your changes with the workflow example, we recommend to `yarn link` your local sources.
