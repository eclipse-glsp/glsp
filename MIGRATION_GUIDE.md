# GLSP Migration Guide

## Description

The following guide highlights potential migration steps necessary when upgrading a GLSP project from
version 1.0.0 to 2.x.x.
This is a living artifact that will be continuously updated when new versions are released and/or new migration issues are encountered.
Please see the latest version (master) for the most up-to-date information.
Please contribute any issues you experienced when upgrading to a newer version of Theia to this document, even for previous releases.

<!-- TOC end -->

<!-- TOC --><a name="glsp-migration-guide"></a>

# GLSP Migration Guide

<!-- TOC --><a name="description"></a>

## Description

The following guide highlights potential migration steps necessary when upgrading a GLSP project from
version 1.0.0 to 2.x.x.
This is a living artifact that will be continuously updated when new versions are released and/or new migration issues are encountered.
Please see the latest version (master) for the most up-to-date information.
Please contribute any issues you experienced when upgrading to a newer version of Theia to this document, even for previous releases.

-   [General](#general)
    -   [Build dependencies](#build-dependencies)
    -   [Inversify 6](#inversify-6)
-   [Client](#client)
    -   [GModel API Alignment](#gmodel-api-alignment)
    -   [Diagram container configuration](#diagram-container-configuration)
    -   [Application specific configuration](#application-specific-configuration)
    -   [Generic ModelSource](#generic-modelsource)
    -   [Introduction of FeatureModules](#introduction-of-featuremodules)
    -   [Tools Module Rework](#tools-module-rework)
    -   [Diagram Startup Hooks](#diagram-startup-hooks)
    -   [Event Listener](#event-listener)
    -   [Message API](#message-api)
    -   [Other breaking changes](#other-breaking-changes)
-   [Theia Integration](#theia-integration)
    -   [Theia Version](#theia-version)
    -   [Removal of sprotty-theia](#removal-of-sprotty-theia)
    -   [Removal of GlspTheiaDiagramServer](#removal-of-glsptheiadiagramserver)
    -   [Improved `DiagramConfiguration`](#improved-diagramconfiguration)
    -   [Custom diagram widget](#custom-diagram-widget)

## General

### Build dependencies

-   Node.js: **>=16.11.0** (Recommended: **18.x** or **20.x**)
-   Typescript: **>=5.x**
-   Java: **>=17.x**

The minimum required Node version for GLSP 2.x is Node 16.11.0.
However, this version has already reached its end-of-life phase so we recommend to use one of the current LTS versions (18/20).

All projects are now based on Typescript 5.
For adopting projects this is more of a soft requirement since Typescript 5 is still type-compatible with older versions.
While we recommend to upgrade to Typescript 5 as well to take advantage of the new features it is still possible to use older versions as well.

For Java-based projects the new minimum required Java Version is 17.x.

Before starting the migration please make sure that all build time dependencies have been updated to a compatible version.

### Inversify 6

To enable compatibility with Typescript >=5 the minimum required inversify version has been bumped to
**6.x**.
There are no major API breaks between inversify 5 and 6 so for the most part existing DI configuration can be reused as is. However, with Inversify 6, the library has introduced a strict split between sync and async dependency injection contexts.
GLSP uses the sync dependency injection context, and therefore no async dependencies cannot be used as dependencies in GLSP components.

This might require a few changes in your Theia extensions, if you've been using async dependencies before. These include:

1. Injecting promises directly into services
2. Classes with `@postConstruct` methods which return a `Promise` instance.

In order to work around 1., you can just wrap the promise inside of a function:

<details>
  <summary>1.0.0</summary>

```ts
const PromiseSymbol = Symbol();
const promise = startLongRunningOperation();

bind(PromiseSymbol).toConstantValue(promise);
```

</details>
<details open>
  <summary>2.x</summary>

```ts
const PromiseSymbol = Symbol();
const promise = startLongRunningOperation();

bind(PromiseSymbol).toConstantValue(() => promise);
```

</details>

The newly bound function needs to be handled appropriately at the injection side.

For 2., `@postConstruct` methods can be refactored into a sync and an async method:

<details>
  <summary>1.0.0</summary>

```ts
@postConstruct()
protected async init(): Promise<void> {
  await longRunningOperation();
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
@postConstruct()
protected init(): void {
  this.doInit();
}

protected async doInit(): Promise<void> {
  await longRunningOperation();
}
```

</details>

## Client

This section covers the major migration steps necessary to migrate a 1.0.0 Client implementation to 2.x.
Not all changes are covered here, for a complete list of changes please refer to the official [changelog](https://github.com/eclipse-glsp/glsp-client/blob/master/CHANGELOG.md).

### GModel API Alignment

The transition to Sprotty's `1.x` Version stream inevitably includes naming changes of base model classes and views.
We took this opportunity to align the naming scheme of graphical model elements on the client and server side.
This ensures a more consistent experience for adopters.
With GLSP **2.x** the `SModel` namespace on the client side has been deprecated/removed.
All base model classes and views from sprotty that are reused in GLSP have been transferred to the `GModel` namespace.
Naturally, this introduces a lof of compilation errors and breaks. We recommend to use the `Search & Replace` functionality of the IDE of your choice to properly convert all usages of classes that are prefixed with an `S` in 1.x to the new namespace.

<details open>
  <summary>List of changes</summary>
  
-   `SModelElement` -> `GModelElement`
-   `SModelRoot` -> `GModelRoot`
-   `SChildElement` -> `GChildElement`
-   `SParentElement` -> `GParentElement`
-   `SShapeElement` -> `GShapeElement`
-   `SButton` -> `GButton`
-   `SButtonSchema` -> `GButtonSchema`
-   `SDecoration` -> `GDecoration`
-   `SIssue` -> `GIssue`
-   `SIssueSeverity` -> `GIssueSeverity`
-   `SIssueMarker`-> `GIssueMarker`
-   `SConnectableElement` -> `GConnectableElement`
-   `SDanglingAnchor` -> `GDanglingAnchor`
-   `SRoutableElement` -> `GRoutableElement`
-   `SRoutingHandle` -> `GRoutingHandle`
-   `ViewportRootElement` -> `GViewportRootElement`
-   `SCompartment` -> `GCompartment`
-   `SGraphIndex` -> `GGraphIndex`
-   `SLabel` -> `GLabel`
-   `SNode` -> `GNode`
-   `SPort` -> `GPort`
-   `SEdge` -> `GEdge`
-   `SGraph` -> `GGraph`
-   `GLSPGraph` -> `GGraph`
-   `SModelFactory` -> `GModelFactory`
-   `SBezierControlHandleView` -> `GBezierControlHandleView`
-   `SBezierCreateHandleView` -> `GBezierCreateHandleView`
-   `SCompartmentView` -> `GCompartmentView`
-   `SGraphView` -> `GGraphView`
-   `SLabelView` -> `GLabelView`
-   `SRoutingHandleView` -> `GRoutingHandleView`
-   `ForeignObjectElement` -> `GForeignObjectElement`
-   `HtmlRoot` -> `GHtmlRoot`
-   `PreRenderedElement` -> `GPreRenderedElement`
-   `ShapedPreRenderedElement` -> `GShapedPreRenderedElement`
-   `SModelElementConstructor` -> `GModelElementConstructor`
-   `SModelElementRegistration` -> `GModelElementRegistration`
-   `SArgumentable` -> `ArgsAware`
-   `hasArguments` -> `hasArgs`
-   `SModelExtension` -> Removed. This was an empty marker interface that is no longer used by GLSP/sprotty

</details>

### Diagram container configuration

The central entrypoint for configuring a diagram container with your custom diagram language has been changed.
Previously it was expected that your function to create a diagram container provides a `widgetId`.
This is no longer necessary, instead the function should take a destructured `ContainerConfiguration` array as argument.

Container configurations are a set of DI modules that should be loaded into the container and/or a description of DI modules that should be loaded/excluded from the container.

<details>
  <summary>1.0.0</summary>

```ts
export default function createContainer(widgetId: string): Container {
    const container = createClientContainer(workflowDiagramModule, directTaskEditor);
    overrideViewerOptions(container, {
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });
    return container;
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
export function createWorkflowDiagramContainer(...containerConfiguration: ContainerConfiguration): Container {
    return initializeWorkflowDiagramContainer(new Container(), ...containerConfiguration);
}

export function initializeWorkflowDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(container, workflowDiagramModule, directTaskEditor, ...containerConfiguration);
}
```

</details>

### Application specific configuration

In 1.0.0 adopters where responsible for properly configuring a `GLSPClient`, establishing a connection to the server and had to manually dispatch the set of initial actions when opening a new diagram.
With 2.x the initial configuration effort has been refactored into a common `DiagramLoader` component that takes care of configuring the underlying GLSP client and initial server communication.
The `DiagramLoader` offers certain extension points to hook into the lifecycle of the diagram loading process and execute custom behavior (see [Diagram Startup Hooks](#diagram-startup-hooks))

This also effects the initial configuration of standalone applications that are connected via Websocket.
For example let's have a look at the configuration for the standalone workflow example:

<details>
  <summary>1.0.0</summary>

```ts
const port = 8081;
const id = 'workflow';
const diagramType = 'workflow-diagram';
const websocket = new WebSocket(`ws://localhost:${port}/${id}`);

const loc = window.location.pathname;
const currentDir = loc.substring(0, loc.lastIndexOf('/'));
const examplePath = resolve(join(currentDir, '..', 'app', 'example1.wf'));
const clientId = ApplicationIdProvider.get() + '_' + examplePath;

const container = createContainer();
const diagramServer = container.get<GLSPDiagramServer>(TYPES.ModelSource);
diagramServer.clientId = clientId;

websocket.onopen = () => {
    const connectionProvider = JsonrpcGLSPClient.createWebsocketConnectionProvider(websocket);
    const glspClient = new BaseJsonrpcGLSPClient({ id, connectionProvider });
    initialize(glspClient);
};

async function initialize(client: GLSPClient): Promise<void> {
    await diagramServer.connect(client);
    const result = await client.initializeServer({
        applicationId: ApplicationIdProvider.get(),
        protocolVersion: GLSPClient.protocolVersion
    });
    await configureServerActions(result, diagramType, container);

    const actionDispatcher = container.get<IActionDispatcher>(TYPES.IActionDispatcher);

    await client.initializeClientSession({ clientSessionId: diagramServer.clientId, diagramType });
    actionDispatcher.dispatch(
        RequestModelAction.create({
            options: {
                sourceUri: `file://${examplePath}`,
                diagramType
            }
        })
    );
    actionDispatcher.dispatch(RequestTypeHintsAction.create());
    actionDispatcher.dispatch(EnableToolPaletteAction.create());
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
const port = 8081;
const id = 'workflow';
const diagramType = 'workflow-diagram';

const loc = window.location.pathname;
const currentDir = loc.substring(0, loc.lastIndexOf('/'));
const examplePath = resolve(join(currentDir, '../app/example1.wf'));
const clientId = 'sprotty';

const webSocketUrl = `ws://localhost:${port}/${id}`;

let glspClient: GLSPClient;
let container: Container;
const wsProvider = new GLSPWebSocketProvider(webSocketUrl);
wsProvider.listen({ onConnection: initialize, onReconnect: reconnect, logger: console });

async function initialize(connectionProvider: MessageConnection, isReconnecting = false): Promise<void> {
    glspClient = new BaseJsonrpcGLSPClient({ id, connectionProvider });
    container = createContainer({ clientId, diagramType, glspClientProvider: async () => glspClient, sourceUri: examplePath });
    const actionDispatcher = container.get(GLSPActionDispatcher);
    const diagramLoader = container.get(DiagramLoader);
    await diagramLoader.load({ requestModelOptions: { isReconnecting } });

    if (isReconnecting) {
        const message = `Connection to the ${id} glsp server got closed. Connection was successfully re-established.`;
        const timeout = 5000;
        const severity = 'WARNING';
        actionDispatcher.dispatchAll([StatusAction.create(message, { severity, timeout }), MessageAction.create(message, { severity })]);
        return;
    }
}

async function reconnect(connectionProvider: MessageConnection): Promise<void> {
    glspClient.stop();
    initialize(connectionProvider, true /* isReconnecting */);
}
```

GLSP 2.x no longer depends on the `vscode-ws-websocket` package and instead provides its own glue code for setting up Websocket connections.
Use the `GLSPWebSocketProvider` and its `listen` function to initialize the connection.
The `initialize` function needs to be reworked by:

-   Defining the `IDiagramOptions` for your application.
    The diagram options provide diagram specific configuration information like the `clientId`, `diagramType` and `glspClient` instance that should be used.
-   Creating your diagram container with the defined options
-   Retrieving the `DiagramLoader` from the container and triggering the diagram loading with `diagramLoader.load()`.
    If you want to use custom `requestModelOptions` you can pass them when calling the load method.

Previously the initialize function was also used to configure initial actions that should be dispatched.
This behavior is now discouraged.
Please use [Diagram Startup Hooks](#diagram-startup-hooks) to configure initial actions.

### Generic ModelSource

In GLSP 1.0 each platform integration had to provide a dedicated `ModelSource` implementation.
With 2.x a generic `GLSPModelSource` has been introduced that can be reused across all integrations.
This implementation is bound by default and platform specific `ModelSource` implementations have been removed.
Please make sure to remove any explicit bindings of `ModelSource` in your DI configuration.

For the standalone use case this means that the `GLSPDiagramServer` model source implementation is no longer available.
Explicit bindings of this service identifier can be simply removed.
In 1.0.0 the `GLSPDiagramServer` also served as explicit `ActionHandler`.
This behavior is discouraged in 2.x.
If you have been using a custom diagram server that handles additional actions please migrate the handling to an explicit action handler and configure in your diagram module (`configureActionHandler`).

### Introduction of FeatureModules

With 2.x all base diagram feature modules have been refactored and now extend a custom `FeatureModule` class instead of the default inversify `ContainerModule`.
`FeatureModule`s are special `ContainerModule`s that also bind a unique service identifier when loaded into the container.
This allows runtime checks to see if a module is configured (i.e. loaded into the container) or not.
In addition, this enables the declaration of dependency chains, i.e. application-context specific modules, that add additional functionality on top of a core feature module.
For instance let's have a look at the `theiaSelectModule`

```ts
export const theiaSelectModule = new FeatureModule(
    bind => {
        bindAsService({ bind }, TYPES.ISelectionListener, TheiaGLSPSelectionForwarder);
    },
    { requires: selectModule }
);
```

This module requires the `selectFeature` module.
This means it will only be loaded into the container if the `selectModule` has been loaded before.

Depending on your set of custom modules some migration effort might be necessary.
Custom modules that are loaded in addition to core GLSP modules should work as before in 2.x without any changes.
Custom modules that are a fullfledged replacement for a GLSP core feature module need to be migrated to a `FeatureModule`.
To keep the dependency chain intact the replacement module has to reuse the `featureId` of the base module it is replacing.
For instance if you have a custom `myViewportModule` that serves as a replacement for the base `viewportModule` than the module
declaration should look like this:

```ts
export const myViewportModule = new FeatureModule(
    (bind, _unbind, isBound) => {
        /// your custom module configuration
    },
    { featureId: viewportModule.featureId }
);
```

In addition, the naming of feature modules in 1.0.0 was an inconsistent mix of modules with no prefix, prefixed with `glsp` and prefixed with `sprotty`.
In 2.x the naming has been aligned and all feature modules provided by GLSP now have no prefix.
In addition, several modules have been renamed to better reflect the purpose of the module.
We recommend to use `Search & Replace` to migrate affected module references.

<details open>
  <summary>List of changes</summary>

-   `defaultGlspModule`-> `baseModule`
-   `glspExportModule` -> `exportModule`
-   `glspBoundsModule` -> `boundsModule`
-   `glspCommandPaletteModule` -> `commandPaletteModule`
-   `glspContextMenuModule` -> `contextMenuModule`
-   `glspDecorationModule` -> `decorationModule`
-   `glspEditLabelModule` -> `labelEditModule`
-   `glspHoverModule` -> `hoverModule`
-   `glspSelectModule` -> `selectModule`
-   `glspServerCopyPasteModule` -> `serverCopyPasteModule`
-   `glspViewportModule` -> `viewportModule`
-   `modelHintsModule` -> `typeHintsModule`
-   `glspRoutingModule` -> `routingModule`
-   `enableDefaultToolsOnFocusLossModule` -> `toolFocusLossModule`

</details>

### Tools Module Rework

In 1.0 the default tools where configured with two generic modules (`toolsModule` & `toolFeedbackModule`) that provided the configuration
for all tools at once.
This made it quite hard to customize tools individually.
In addition, the separation into a dedicated `feedbackModule` was not ideal as it split the tool configuration across two interdependent modules.
With 2.x this has been reworked. The generic `toolsModule` & `toolFeedbackModule` have been removed in favor of individual tool modules:

-   `changeBoundsToolModule`
-   `deletionToolModule`
-   `edgeCreationToolModule`
-   `edgeEditToolModule`
-   `marqueeSelectionToolModule` (previously: `configureMarqueeTool`)
-   `nodeCreationToolModule`

So if you are using customized default tools in your project some migration effort is required to adapt to new imports and the new module structure.

<details open>
  <summary>List of changes</summary>

-   `GLSPTool` -> `Tool`
-   `dispatchFeedback` -> `registerFeedback`
-   BaseEditTool: Reusable generic base class for edit tools
-   BaseCreationTool: Reusable base class for edit tools based on a trigger action
-   configureMarqueeTool: This function has been removed. Use the `marqueeSelectionToolModule` instead

</details>

### Diagram Startup Hooks

GLSP 2.0 offers the `IDiagramStartup` API which enables adopters to hook into the model loading lifecycle and execute additional custom logic.
This enables typical use cases like dispatching additional initial actions, enabling a UI extension at diagram startup etc.
The previous approach of overriding the application integration specific diagram widget to implement those use cases is now discouraged.
Startup logic should be migrated to `IDiagramStartup` implementations which can then be bound in your custom DI module(s).
For instance, a simple implementation to enable a UI extension on startup could look like this:

```ts
@injectable()
export class MyDiagramStartup implements IDiagramStartup {
    @inject(GLSPActionDispatcher)
    protected actionDispatcher: GLSPActionDispatcher;

    postModelInitialization(): MaybePromise<void> {
        this.actionDispatcher.dispatch(SetUIExtensionVisibilityAction.create({ extensionId: 'my-extension', visible: true }));
    }
}


export const myDiagramModule= new ContainerModule(bind => {
    bind(TYPES.IDiagramStartup).to(MyDiagramStartup).inSingletonScope();
}
```

### Event Listener

With 2.x a generic Event Emitter API has been introduced.
This API is similar to the event API of Theia/VS Code and allows declaring arbitrary events and corresponding Emitters.
Interesting parties can subscribe to the event to get notified when the event is fired.
The existing listener implementations for `SelectionService`, `GLSPCommandStack` & `EditorContextService` have been refactored to use the new API.
Explicit methods for de-registering listeners are no longer available.
Instead adopters have to keep track of the disposable that was received when registering the listener and dispose it when the listener is no longer needed.

<details>
  <summary>1.0.0</summary>

```ts
@injectable()
export class MyService {
    @inject(SelectionService)
    protected selectionService: SelectionService;

    protected listener: SelectionListener;

    @postConstruct()
    protected init(): void {
        this.listener = {
            selectionChanged: () => {
                console.log('selection changed');
            }
        };
        this.selectionService.register(this.listener);
    }

    dispose(): void {
        this.selectionService.deregister(this.listener);
    }
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
@injectable()
export class MyService implements Disposable {
    @inject(SelectionService)
    protected selectionService: SelectionService;

    protected selectionListenerDisposable: Disposable;

    @postConstruct()
    protected init(): void {
        this.selectionListenerDisposable = this.selectionService.onSelectionChanged(() => {
            console.log('selection changed');
        });
    }

    dispose(): void {
        this.selectionListenerDisposable.dispose();
    }
}
```

<details open>
  <summary>List of changes</summary>

-   `SelectionListener` -> `ISelectionListener`
-   `EditModeListener` -> `IEditModeListener`

</details>

### Message API

With 2.x the actions for sending information messages and/or status updates have been reworked.
First of all they have been renamed

-   `ServerStatusAction` -> `StatusAction`
-   `ServerMessageAction` -> `MessageAction`

Second, the `timeout` support for `MessageAction`'s has been removed.
By default, this feature was only well supported in the Theia integration and its main purpose was to dispatch progress information for long-running operations.
A new dedicated API for progress reporting has been introduced which can be used for this purpose.
If you have a long running information and want to report the progress you can use the following new actions:

-   `StartProgressAction`
-   `UpdateProgressAction`
-   `EndProgressAction`

</details>

### Other breaking changes

**IButtonHandler**

Injecting an `IButtonHandler` constructor is now deprecated.
Please use the `configureButtonHandler` method in your diagram DI module instead.

**UndoRedo**

`Undo` and `Redo` operations were incorrectly declared as actions in 1.0. With 2.x the have been migrated to operations.
Also the `UndoRedoKeyListener` has been renamed to `GLSPUndoRedoKeyListener`.

-   `UndoAction` -> `UndoOperation`
-   `RedoAction` -> `RedoOperation`
-   `UndoRedoKeyListener` -> `GLSPUndoRedoKeyListener`

**SelectionService**

Removed the `TYPES.SelectionService` service identifier.
Please directly use the `SelectionService` class as service identifier instead

**MouseTool**

`IMouseTool` and `TYPES.IMouseTool` are no longer available.
Directly inject and use `GlspMouseTool` instead

## Theia Integration

This section covers the major migration steps necessary to migrate a 1.0.0 Theia integration implementation to 2.x.
Not all changes are covered here, for a complete list of changes please refer to the official [changelog](https://github.com/eclipse-glsp/glsp-theia-integration/blob/master/CHANGELOG.md)

### Theia Version

GLSP 2.x is compatible with Theia 1.39.x or higher.
Older versions are no longer supported.
Please update your Theia dependencies to a compatible version before starting the migration.
If you are already on a compatible version we recommend to run `yarn upgrade` to ensure that shared dependencies between
Theia and GLSP are resolved to the same version.

GLSP now consumes Theia as `peerDependency` this means instead of trying to resolve the Theia dependencies itself GLSP consume the versions declared in your (browser or electron) app.
As a consequence it should no longer be necessary to use `yarn resolutions` (or `npm override`) to pin Theia to a specific version.

### Removal of sprotty-theia

In contrast to 1.0.0, GLSP 2.x is no longer based on the `sprotty-theia` package.
Some concepts of this library have been migrated, any services that were previously unused in GLSP are no longer exported/available.

This mostly affects internal API and for many adopters this does not impact the migration.
However, if you have customized services or concepts that are coming directly from `sprotty-theia` some migration effort might be required.
Most services should have a counterpart in the 2.0 version, often simply prefixed with `Glsp`.
If you cannot find a straight forward solution to migrate your custom code please feel free to contact us.

To avoid dependency issues please make sure that your project no longer declares any dependencies to `sprotty-theia`.

### Removal of GlspTheiaDiagramServer

Due to the `ModelSource` rework (see [Generic ModelSource](#generic-modelsource)) this implementation is no longer required.
Related bindings can simply be removed and don't need a replacement.

In 1.0.0 the `GlspTheiaDiagramServer` also served as explicit `ActionHandler`.
This behavior is discouraged in 2.x.
If you have been using a custom diagram server that handles additional actions please migrate the handling to an explicit action handler and configure it in the [diagram configuration](#improved-diagramconfiguration).

### Improved `DiagramConfiguration`

The `DiagramConfiguration` API has been reworked to be compatible with the new [DiagramLoader API](#diagram-container-configuration).
The `doCreateContainer` method has been replaced with the `configureContainer` method.
This method has to be implemented by adopting classes.
In 1.0.0 theia-specific diagram services had to be configured by overriding the `initializeContainer` method.
While this approach still works it is now discouraged.
We recommend to create explicit feature modules for theia-specific customizations and then adding them to the container configuration.
The `initializeContainer` approach has the downside that the container bindings are augmented after the container has already been created.
This can have unintended side effects e.g. services/listeners that are not properly registered.
With feature modules you can avoid these issues.

<details>
  <summary>1.0.0</summary>

```ts
@injectable()
export class MyDiagramConfiguration extends GLSPDiagramConfiguration {
    // ...
    protected override initializeContainer(container: Container): void {
        super.initializeContainer(container);
        container.bind(MyDiagramService).toSelf().inSingletonScope();
    }
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
@injectable()
export class MyDiagramConfiguration extends GLSPDiagramConfiguration {
    // ...
    protected override getContainerConfiguration(): ContainerConfiguration {
        const config = super.getContainerConfiguration();
        config.push(myDiagramFeatureModule);
        return config;
    }
}

const myDiagramFeatureModule = new FeatureModule(bind => {
    bind(MyDiagramService).toSelf().inSingletonScope();
});
```

</details>

In addition, a GLSP diagram container is now a real child container of the main Theia DI container.
This means it is no longer necessary to inject and explicitly forward Theia services in the diagram configuration.
Any service available in the main Theia container can simply be injected into a diagram specific service.

<details>
  <summary>1.0.0</summary>

```ts
@injectable()
export class MyDiagramConfiguration extends DiagramConfiguration {
    @inject(SelectionService) protected selectionService: SelectionService;

    // ...
    protected override initializeContainer(container: Container): void {
        container.bind(CommandService).toConstantValue(this.commandService);
    }
}

// A service that is bound in the diagram container
@injectable()
export class MyDiagramService {
    @injectable(CommandService)
    protected commandService: CommandService;

    foo(): void {
        // do something with the command serivce
    }
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
// A service that is bound in the diagram container
// Theia services like the command service an simply be injected without additional configuration
@injectable()
export class MyDiagramService {
    @injectable(CommandService)
    protected commandService: CommandService;

    foo(): void {
        // do something with the command serivce
    }
}
```

</details>

The availability of all Theia services in the diagram container also made the `TheiaGLSPConnector` obsolete.
It has been removed and its functionality was split into dedicated modules for each action previously handled by the connector. (`theiaExportModule`, `theiaNotificationModule`, ...)
If you have made any customizations to the connector we recommend to move that behavior into a dedicated feature module as well.

### Custom diagram widget

Defining a custom diagram widget in 1.0.0 was rather complex and required a lot of DI configuration.
However, many adopters had the need for a custom diagram widget to a) dispatch custom initial actions or
b) provide additional custom widget functionality. Diagram widgets are now constructed via a factory which makes
them fully injectable and allows customization by configuring one binding.

<details>
  <summary>1.0.0</summary>

```ts
export class MyDiagramWidget extends GLSPDiagramWidget {
    protected override onAfterDetach(msg: Message): void {
        // do something
    }
}

@injectable()
export class MyDiagramManager extends GLSPDiagramManager {
    //...

    override async createWidget(options?: any): Promise<GLSPDiagramWidget> {
        if (GLSPDiagramWidgetOptions.is(options)) {
            const clientId = this.createClientId();
            const widgetId = this.createWidgetId(options);
            const config = this.getDiagramConfiguration(options);
            const diContainer = config.createContainer(clientId);

            // do not await the result here as it blocks the Theia layout restoration for open widgets
            // instead simply check in the widget if we are already initialized
            this.diagramConnector.initializeResult.then(initializeResult =>
                configureServerActions(initializeResult, this.diagramType, diContainer)
            );

            const widget = new MyDiagramWidget(
                options,
                widgetId,
                diContainer,
                this.editorPreferences,
                this.storage,
                this.theiaSelectionService,
                this.diagramConnector
            );
            widget.listenToFocusState(this.shell);
            return widget;
        }
        throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
    }
}

export class MyDiagramTheiaFrontendModule extends GLSPTheiaFrontendModule {
    //...
    configureDiagramManager(context: ContainerContext): void {
        registerDiagramManager(context, YourCustomDiagramManager);
    }
}
```

</details>
<details open>
  <summary>2.x</summary>

```ts
@injectable()
export class MyDiagramWidget extends GLSPDiagramWidget {
    protected override onAfterDetach(msg: Message): void {
        // do something
    }
}

export class MyDiagramTheiaFrontendModule extends GLSPTheiaFrontendModule {
    // ...
    override configure(context: ContainerContext): void {
        context.bind(GLSPDiagramWidget).to(MyDiagramWidget);
    }
}
```

</details>

If the sole purpose of your custom diagram widget was to dispatch initial actions we recommend to completely remove the customization and instead use the new [Diagram Startup Hooks](#diagram-startup-hooks) API for that.
