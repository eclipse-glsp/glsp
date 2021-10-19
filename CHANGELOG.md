# Eclipse GLSP Change Log

## [v0.9.0 - Upcoming]()

<a name="client_changes_1.9.0">[Client:](#client_changes_1.9.0)</a>

-   [build] Added a download script to download the latest workflow-glsp-server JAR from maven artifactory [#171](https://github.com/eclipse-glsp/glsp-client/pull/99)
-   [diagram] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#184](https://github.com/eclipse-glsp/glsp-client/pull/102)
-   [diagram] Extended the `ModifyCssFeedbackAction` to support both `string[]` and `SModelElement[]` as input [#103](https://github.com/eclipse-glsp/glsp-client/pull/103)
-   [diagram] Improved extensibility of `AutoCompleteWidget` by enabling changing of settings without having to re-instantiate the entire widget [#104](https://github.com/eclipse-glsp/glsp-client/pull/104)
-   [model] Added `SArgumentable` interface for denoting `SModelElement`s that contain an arbitrary arguments map [#194](https://github.com/eclipse-glsp/glsp-client/pull/106)
-   [diagram] Implemented a marquee selection tool to select multiple elements at once by drawing a rectangle. [#199](https://github.com/eclipse-glsp/glsp-client/pull/108) [#213](https://github.com/eclipse-glsp/glsp-client/pull/120)
-   [protocol] Added `fileUri` property to `SaveModelAction`. This can be used to implemend save-as functionality [#208](https://github.com/eclipse-glsp/glsp-client/pull/109)
-   [protocol] Implemented missing typeguard functions for all protocol operations [#212](https://github.com/eclipse-glsp/glsp-client/pull/110)
-   [diagram] Implemented a reusable utility function (`configureDefaultModelElements`) that handles configuration of default model elements and views.
    Introduced reusable view for rounded corner nodes and and improved edge view that supports custom padding for easer mouse handling. Adpated the workflow example to make use of these new views [#180](https://github.com/eclipse-glsp/glsp-client/pull/113)
-   [example] Cleaned up and reworked the workflow example. Additional css classes are now applied directly to the `SModelElement` instead of using custom views. Removed now obsolete classes `TaskNodeView` and `WeightedEdgeView` [#220](https://github.com/eclipse-glsp/glsp-client/pull/116)
-   [diagram] Fixed a bug in the connection tool regarding the feedback edge snapping computation for nested elements. [#224](https://github.com/eclipse-glsp/glsp-client/pull/123)
-   [diagram] Fixed a bug in the copy& paste behavior. [#249](https://github.com/eclipse-glsp/glsp-client/pull/124)
-   [diagram] Fixed a bug in Firefox that required elements to be selected before they can be moved. [#376](https://github.com/eclipse-glsp/glsp-client/pull/134)
-   [build] Upgrade to Snabbdom3 and ES2017 [#137](https://github.com/eclipse-glsp/glsp-client/pull/137)
-   [protocol] Extract action message protocol and action definitions from `@eclipse-glsp/client` and move to `@eclipse-glsp/protocol` [#256](https://github.com/eclipse-glsp/glsp-client/pull/141) - Contributed on behalf of STMicroelectronics
    <br>

<a name="server_changes_1.9.0">[Server:](#server_changes_1.9.0)</a>

-   [websocket] Fixed issue that was caused by reusing a shared injector for each client connection [#149](https://github.com/eclipse-glsp/glsp-server/pull/91)
-   [server] Added a utility class for 'JsonOpenerOptions' [#153](https://github.com/eclipse-glsp/glsp-server/pull/93)
-   [websocket] Align package import of javax.servlet with the dependency range of Jetty [#156](https://github.com/eclipse-glsp/glsp-server/pull/94)
-   [server] Reworked model update flow. All aspects of the update process are now handled by the `ModelSubmissionHandler` [#122](https://github.com/eclipse-glsp/glsp-server/pull/95)
-   [server] Reworked and split `ModelFactory` API into a dedicated component responsible for loading the model source (`ModelSourceLoader`) and a component responsible for transforming the current modelstate into its GModel-representation (`GModelFactory`) [#119](https://github.com/eclipse-glsp/glsp-server/pull/96)
-   [protocol] Updated kind of `SelectAction` to be in-line with the client type. This ensures correct of handling of `SelectAction`s that were sent from the server [#191](https://github.com/eclipse-glsp/glsp-server/pull/98)
-   [protocol] Added implementation for `SetViewportAction` [#179](https://github.com/eclipse-glsp/glsp-server/pull/99)
-   [server] Introduced `GArgumentable` interface which is implemented by all `GModelElement`s. This can be used to provide additional information in form of an `args` map without having to extend the `GModel` type [#194](https://github.com/eclipse-glsp/glsp-server/pull/100)
-   [server] Extended default type mapping and added builder for `GArgumentable` elements and corresponding utility classes [#180](https://github.com/eclipse-glsp/glsp-server/pull/105)
-   [protocol] Added `fileUri` property to `SaveModelAction` and updated `SaveModelActionHandler` accordingly [#208](https://github.com/eclipse-glsp/glsp-server/pull/103/)
-   [protocol] Added optional `reason` string property to `SetDirtyStateAction`. This property indicates the reason that caused to dirty state change and enables more fine granular handling of dirty state changes [#197](https://github.com/eclipse-glsp/glsp-server/pull/101)

<a name="theia_changes_1.9.0">[Theia Integration:](#theia_changes_1.9.0)</a>

-   [theia-backend] Added ability to launch embedded GLSP servers from `GLSPBackendContribution` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55) [#381](https://github.com/eclipse-glsp/glsp/pull/382)
-   [theia-frontend] Cleanup diagram widget initialization by removing no longer needed options [#123](https://github.com/eclipse-glsp/glsp-theia-integration/pull/60)
-   [theia-frontend] Fixed a bug that prevented activation of the diagram widget on model source changes [#168](https://github.com/eclipse-glsp/glsp-theia-integration/pull/61)
-   [theia-frontend] Fixed a bug that kept the hover feedback visible after the diagram widget becomes inactive [#184](https://github.com/eclipse-glsp/glsp-theia-integration/pull/64)
-   [theia-frontend] Made rebind of `CommandPalette` to `TheiaCommandPalette` optional to ensure compatibility with DI configurations where no `CommandPalette` is bound [#188](https://github.com/eclipse-glsp/glsp-theia-integration/pull/65)
-   [theia-frontend] Adapted `SetDirtyStateAction` to provide an optional `reason` property indicating the cause for the dirty state change [#197](https://github.com/eclipse-glsp/glsp-theia-integration/pull/67)
-   [theia-fronted] Introduced `GLSPSelectionDataService` which can be used to forward additional information on top of the selection to the Theia selection service. [#228](https://github.com/eclipse-glsp/glsp/issues/228)
-   [theia-frontend] Fixed a bug that displayed the diagram widget as inative when intially openend. [#243](https://github.com/eclipse-glsp/glsp-theia-integration/pull/75)
-   [theia-frontend] Adapt frontend components to conform to the latest [protocol changes](eclipse-glsp/glsp/issues/315). [#315](https://github.com/eclipse-glsp/glsp-theia-integration/pull/86)
-   Upgrade to Theia 1.17.2 and ES2017 [#90](https://github.com/eclipse-glsp/glsp-theia-integration/pull/90)
    <br>

<a name="eclipse_integration_1.9.0">[Eclipse Integration:](#eclipse_changes_1.9.0)</a><br>
Inception of the Eclipse GLSP IDE integration. This project provides the glue code for integrating browser-based GLSP diagram into the Eclipse IDE.

<a name="vscode_integration_1.9.0">[VSCode Integration:](#vscode_changes_1.9.0)</a><br>
Inception of the Eclipse VScode integration. This project provides the glue code to integrate a GLSP diagram editor into VSCode. This is achieved by using the VSCode extension API for creating custom editors.

<a name="breaking_changes_1.9.0">[Breaking Changes:](#breaking_changes_1.9.0)</a>

-   [theia-integration] Renamed `GLSPServerContribution.start()` to `GLSPServerContribution.connect()` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
-   [glsp-client & theia-integration] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an action handler `TheiaNavigateToExternalTargetHandler` in Theia [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)
-   [glsp-server] Merged the `ServerLayoutConfiguration` API into the `DiagramConfiguration` API. The standalone `ServerLayoutConfiguration` is now deprecated and no longer supported [#123](https://github.com/eclipse-glsp/glsp-server/pull/95)
-   [glsp-server] Renamed `ModelFactory` to `ModelSourceLoader` and adapted interface method. This also affects implementing classes like the `JsonFileModelFactory` [#119](https://github.com/eclipse-glsp/glsp-server/pull/96)
-   [glsp-server] Reworked `ModelSubmissionHandler` API. This includes changes of method names and parameters [#119](https://github.com/eclipse-glsp/glsp-server/pull/96) [#197](https://github.com/eclipse-glsp/glsp-server/pull/101)
-   [theia-integration] Dropped the dependency to the deprecated `@theia/languages` package. This enables compatibility with new Theia versions (>1.4.0). As a consequence the new minium requirment for `sprotty-theia` is > 0.9.0 [#189](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [glsp-client] Introduced `glspViewportModule`. This module contains a custom `ScrollMouseListener` that gets disabled if the `MarqueeTool` is active. This module should be used instead of the `viewportModule` provided by sprotty [#199](https://github.com/eclipse-glsp/glsp-client/pull/108)
-   [glsp-server] Refactored the `CreateNodeOperationHandler.createNode` method. The method now also passes the argument map of the operation. [#223](https://github.com/eclipse-glsp/glsp-server/pull/108)
-   [glsp-server] Refactored methods in`DiagramConfiguration` to correctly reflect `ShapeTypeHint` instead of `NodeTypeHint`.
-   [glsp-client] Fixed the definition of `ChangeContainerOperation`. The type of the `location` property has been changed from `string` to `Point`. [#253 ](eclipse-glsp/glsp-server#115)
-   [theia-integration] Refactored the theia-integration code base to remove boilerplate configuration code. This effects the many components of the base API. More details can be found in the corresponding PR. [#258](https://github.com/eclipse-glsp/glsp-theia-integration/pull/84)
-   [glsp-server] Update dependencies of Googgle Guava (>= 30.1) and Google Guice (>= 5.0.0). [#260](https://github.com/eclipse-glsp/glsp-server/pull/119)
-   [glsp-client] Remove the `name` property from `GLSPClient`. [#258](https://github.com/eclipse-glsp/glsp-client/pull/130/files)
-   [glsp-server] Refactor the base communication protocol to support initializing and disposing a client session. Remove now obsolete `InitializeClientSesionAction` and `DisposeClientSessionAction`. [#315](https://github.com/eclipse-glsp/glsp-server/pull/123)

-   [theia-integration] Renamed `GLSPServerContribution.start()` to `GLSPServerContribution.connect()` [#35](https://github.com/eclipse-glsp/glsp-theia-integration/pull/55)
-   [glsp-client & theia-integration] Replaced `ExternalNavigateToTargetHandler` and its implementation in Theia `TheiaNavigateToTargetHandler` with a generic action `NavigateToExternalTargetAction` [#153](https://github.com/eclipse-glsp/glsp-client/pull/95) and an action handler `TheiaNavigateToExternalTargetHandler` in Theia [#153](https://github.com/eclipse-glsp/glsp-theia-integration/pull/57)
-   [glsp-server] Merged the `ServerLayoutConfiguration` API into the `DiagramConfiguration` API. The standalone `ServerLayoutConfiguration` is now deprecated and no longer supported [#123](https://github.com/eclipse-glsp/glsp-server/pull/95)
-   [glsp-server] Renamed `ModelFactory` to `ModelSourceLoader` and adapted interface method. This also affects implementing classes like the `JsonFileModelFactory` [#119](https://github.com/eclipse-glsp/glsp-server/pull/96)
-   [glsp-server] Reworked `ModelSubmissionHandler` API. This includes changes of method names and parameters [#119](https://github.com/eclipse-glsp/glsp-server/pull/96) [#197](https://github.com/eclipse-glsp/glsp-server/pull/101)
-   [theia-integration] Dropped the dependency to the deprecated `@theia/languages` package. This enables compatibility with new Theia versions (>1.4.0). As a consequence the new minium requirment for `sprotty-theia` is > 0.9.0 [#189](https://github.com/eclipse-glsp/glsp-theia-integration/pull/66)
-   [glsp-client] Introduced `glspViewportModule`. This module contains a custom `ScrollMouseListener` that gets disabled if the `MarqueeTool` is active. This module should be used instead of the `viewportModule` provided by sprotty [#199](https://github.com/eclipse-glsp/glsp-client/pull/108)
-   [glsp-server] Refactored the `CreateNodeOperationHandler.createNode` method. The method now also passes the argument map of the operation. [#223](https://github.com/eclipse-glsp/glsp-server/pull/108)
-   [glsp-server] Refactored methods in`DiagramConfiguration` to correctly reflect `ShapeTypeHint` instead of `NodeTypeHint`.

## [v0.8.0 - 20/10/2020](https://github.com/eclipse-glsp/glsp/releases/tag/0.8.0)

This is the first release of Eclipse GLSP since it is hosted at the Eclipse Foundation. The 0.8.0 release includes new protocol message types and respective framework support for several new features, such as copy-paste, diagram navigation, etc. It also contains several clean-ups of the protocol and refactorings to simplify and streamline the API. The Eclipse Theia integration of GLSP features many improvements, such as problem marker integration, native context menu items and keybindings. Finally, several bug fixes and minor are part of this release as well.
