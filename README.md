# Eclipe GLSP

GLSP (<b>G</b>raphical <b>L</b>anguage <b>S</b>erver <b>P</b>latform) provides extensible components to enable the development of *diagram editors including edit functionality* in (distributed) web-applications via a client-server protocol.

It follows the same architectural pattern as the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol) for textual languages, but applies it to graphical modeling for browser/cloud-based deployments.
The protocol as well as the client implementation is heavily based on [Sprotty](https://github.com/eclipse/sprotty) but extends it with editing functionality and GLSP-specific communication with the server.

## Repositories

This repository contains the [website](https://www.eclipse.org/glsp/) and documentation of GLSP. The actual GLSP code is available in the following modules:

- [glsp-client](https://github.com/eclipse-glsp/glsp-client): Contains the code for the default (sprotty-based) client.
- [glsp-theia-integration](https://github.com/eclipse-glsp/glsp-theia-integration): Provides the glue code to integrate GLSP diagrams into [Theia](https://github.com/eclipse/sprotty)
- [glsp-server](https://github.com/eclipse-glsp/glsp-server): Contains the code for a Java-based framework to create GLSP server components.
- [glsp-examples](https://github.com/eclipse-glsp/glsp-examples): Contains various examples to demonstrate GLSP in action.

Please check the individual repositories for instructions for building and contributing.
