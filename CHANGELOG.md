# Eclipse GLSP Change Log

## [v0.9.0 - Upcoming]()
<a name="client_changes_1.9.0">[Client:](#client_changes_1.9.0)</a>
<br>


<a name="theia_changes_1.9.0">[Theia Integration:](#theia_changes_1.9.0)</a>
- [theia-backend] Added ability to launch embbeded GLSP servers from `GLSPBackendContribution` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
<br>

<a name="server_changes_1.9.0">[Server:](#server_changes_1.9.0)</a>

- [websocket] Fixed issue that was caused by reusing a shared injector for each client connection [#149](https://github.com/eclipse-glsp/glsp-server/pull/91)
- [server] Added a utility class for 'JsonOpenerOptions' [#153](https://github.com/eclipse-glsp/glsp-server/pull/93)
- [websocket] Align package import of javax.servlet with the dependency range of Jetty [#156](https://github.com/eclipse-glsp/glsp-server/pull/94)

<a name="breaking_changes_1.9.0">[Breaking Changes:](#breaking_changes_1.8.0)</a>

- [theia-integration] Renamed `GLSPServerContribution.start()` to `GLSPServerContribution.connect()` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
- [glsp-client & theia-integration] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an action handler `TheiaNavigateToExternalTargetHandler` in Theia [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation. The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API. The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
