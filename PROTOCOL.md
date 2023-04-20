<details open><summary>Table of Contents</summary>

-   [1. Server-Client Lifecycle](#1-server-client-lifecycle)
-   [2. Graphical Language Server Protocol](#2-graphical-language-server-protocol)
    -   [2.1. Base Protocol](#21-base-protocol)
        -   [2.1.1. ActionMessage](#211-actionmessage)
        -   [2.1.2. Action](#212-action)
            -   [2.1.2.1. RequestAction](#2121-requestaction)
            -   [2.1.2.2. ResponseAction](#2122-responseaction)
            -   [2.1.2.3. RejectAction](#2123-rejectaction)
            -   [2.1.2.4. Operation](#2124-operation)
    -   [2.2. Model Structure](#22-model-structure)
        -   [2.2.1. SModelElementSchema](#221-smodelelementschema)
            -   [2.2.1.1. SModelRootSchema](#2211-smodelrootschema)
        -   [2.2.2. SModelElement](#222-smodelelement)
            -   [2.2.2.1. SParentElement](#2221-sparentelement)
            -   [2.2.2.2. SChildElement](#2222-schildelement)
            -   [2.2.2.3. SModelRoot](#2223-smodelroot)
    -   [2.3. Types](#23-types)
        -   [2.3.1. Args](#231-args)
        -   [2.3.2. Point](#232-point)
        -   [2.3.3. Dimension](#233-dimension)
        -   [2.3.4. Bounds](#234-bounds)
        -   [2.3.5. ElementAndBounds](#235-elementandbounds)
        -   [2.3.6. ElementAndAlignment](#236-elementandalignment)
        -   [2.3.7. ElementAndRoutingPoints](#237-elementandroutingpoints)
        -   [2.3.8. EditorContext](#238-editorcontext)
        -   [2.3.9. LabeledAction](#239-labeledaction)
    -   [2.4 Model Data](#24-model-data)
        -   [2.4.1. RequestModelAction](#241-requestmodelaction)
        -   [2.4.2. SetModelAction](#242-setmodelaction)
        -   [2.4.3. UpdateModelAction](#243-updatemodelaction)
        -   [2.4.4. SourceModelChangedAction](#244-sourcemodelchangedaction)
    -   [2.5. Model Saving](#25-model-saving)
        -   [2.5.1. SaveModelAction](#251-savemodelaction)
        -   [2.5.2. SetDirtyStateAction](#252-setdirtystateaction)
        -   [2.5.3. ExportSvgAction](#253-exportsvgaction)
    -   [2.6. Model Layout](#26-model-layout)
        -   [2.6.1. RequestBoundsAction](#261-requestboundsaction)
        -   [2.6.2. ComputedBoundsAction](#262-computedboundsaction)
        -   [2.6.3. LayoutOperation](#263-layoutoperation)
    -   [2.7. Model Edit Mode](#27-model-edit-mode)
        -   [2.7.1. SetEditModeAction](#271-seteditmodeaction)
    -   [2.8. Client-Side Actions](#28-client-side-actions)
        -   [2.8.1. View Port](#281-view-port)
            -   [2.8.1.1. CenterAction](#2811-centeraction)
            -   [2.8.1.2. FitToScreenAction](#2812-fittoscreenaction)
        -   [2.8.2. Client Notification](#282-client-notification)
            -   [2.8.2.1. ServerStatusAction](#2821-serverstatusaction)
            -   [2.8.2.2. ServerMessageAction](#2822-servermessageaction)
            -   [2.8.2.3. ServerSeverity](#2823-serverseverity)
        -   [2.8.3. Element Selection](#283-element-selection)
            -   [2.8.3.1. SelectAction](#2831-selectaction)
            -   [2.8.3.2. SelectAllAction](#2832-selectallaction)
    -   [2.9. Element Hover](#29-element-hover)
        -   [2.9.1. RequestPopupModelAction](#291-requestpopupmodelaction)
        -   [2.9.2. SetPopupModelAction](#292-setpopupmodelaction)
    -   [2.10. Element Validation](#210-element-validation)
        -   [2.10.1. RequestMarkersAction](#2101-requestmarkersaction)
        -   [2.10.2. SetMarkersAction](#2102-setmarkersaction)
        -   [2.10.3. DeleteMarkersAction](#2103-deletemarkersaction)
    -   [2.11. Element Navigation](#211-element-navigation)
        -   [2.11.1. RequestNavigationTargetsAction](#2111-requestnavigationtargetsaction)
        -   [2.11.2. SetNavigationTargetsAction](#2112-setnavigationtargetsaction)
        -   [2.11.3. NavigateToTargetAction](#2113-navigatetotargetaction)
        -   [2.11.4. ResolveNavigationTargetAction](#2114-resolvenavigationtargetaction)
        -   [2.11.4. SetResolvedNavigationTargetAction](#2114-setresolvednavigationtargetaction)
        -   [2.11.5. NavigateToExternalTargetAction](#2115-navigatetoexternaltargetaction)
    -   [2.12. Element Type Hints](#212-element-type-hints)
        -   [2.12.1. RequestTypeHintsAction](#2121-requesttypehintsaction)
        -   [2.12.2. SetTypeHintsAction](#2122-settypehintsaction)
    -   [2.13. Element Creation and Deletion](#213-element-creation-and-deletion)
        -   [2.13.1. CreateNodeOperation](#2131-createnodeoperation)
        -   [2.13.2. CreateEdgeOperation](#2132-createedgeoperation)
        -   [2.13.3. DeleteElementOperation](#2133-deleteelementoperation)
    -   [2.14. Node Modification](#214-node-modification)
        -   [2.14.1. ChangeBoundsOperation](#2141-changeboundsoperation)
        -   [2.14.2. ChangeContainerOperation](#2142-changecontaineroperation)
    -   [2.15. Edge Modification](#215-edge-modification)
        -   [2.15.1. ReconnectEdgeOperation](#2151-reconnectedgeoperation)
        -   [2.15.2. ChangeRoutingPointsOperation](#2152-changeroutingpointsoperation)
    -   [2.16. Element Text Editing](#216-element-text-editing)
        -   [2.16.1. RequestEditValidationAction](#2161-requesteditvalidationaction)
        -   [2.16.2. SetEditValidationResultAction](#2162-seteditvalidationresultaction)
        -   [2.16.3. ApplyLabelEditOperation](#2163-applylabeleditoperation)
    -   [2.17. Clipboard](#217-clipboard)
        -   [2.17.1. RequestClipboardDataAction](#2171-requestclipboarddataaction)
        -   [2.17.2. SetClipboardDataAction](#2172-setclipboarddataaction)
        -   [2.17.3. CutOperation](#2173-cutoperation)
        -   [2.17.4. PasteOperation](#2174-pasteoperation)
    -   [2.18. Undo / Redo](#218-undo--redo)
        -   [2.18.1. UndoAction](#2181-undoaction)
        -   [2.18.2. RedoAction](#2182-redoaction)
    -   [2.19. Contexts](#219-contexts)
        -   [2.19.1. RequestContextActions](#2191-requestcontextactions)
        -   [2.19.2. SetContextActions](#2192-setcontextactions)
        -   [2.19.3. Context Menu](#2193-context-menu)
        -   [2.19.4. Command Palette](#2194-command-palette)
        -   [2.19.5. Tool Palette](#2195-tool-palette)
            -   [2.19.5.1. TriggerNodeCreationAction](#21951-triggernodecreationaction)
            -   [2.19.5.2. TriggerEdgeCreationAction](#21952-triggeredgecreationaction)

</details>

# 1. Server-Client Lifecycle

The base communication between the client and server is performed using [action messages](#211-actionmessage) whereas we assume that each client connection will start their own server instance.
Thus each server is only responsible for a single client.

A client implementation must consider the following interface:

<details open><summary>Code</summary>

```typescript
interface GLSPClient {
    /**
     * Unique client Id.
     */
    readonly id: string;

    /**
     * Current client state.
     */
    readonly currentState: ClientState;

    /**
     * Initializes the client and the server connection. During the start procedure the client is in the
     * `Starting` state and will transition to either `Running` or `StartFailed`.
     *
     * @returns A promise that resolves if the startup was successful.
     */
    start(): Promise<void>;

    /**
     * Send an `initialize` request to the server. The server needs to be initialized in order to accept and
     * process other requests and notifications.
     *
     * @param params Initialize parameters
     * @returns A promise of the {@link InitializeResult}.
     */
    initializeServer(params: InitializeParameters): Promise<InitializeResult>;

    /**
     * Send an `initializeClientSession` request to the server. One client application may open several session.
     * Each individual diagram on the client side counts as one session and has to provide
     * a unique clientSessionId.
     *
     * @param params InitializeClientSession parameters
     * @returns A promise that resolves if the initialization was successful
     */
    initializeClientSession(params: InitializeClientSessionParameters): Promise<void>;

    /**
     * Sends a `disposeClientSession` request to the server. This request has to be sent at the end of client session lifecycle
     * e.g. when an editor widget is closed.
     *
     * @param params DisposeClientSession parameters
     * @returns A promise that resolves if the disposal was successful
     */
    disposeClientSession(params: DisposeClientSessionParameters): Promise<void>;

    /**
     * Send a `shutdown` notification to the server.
     */
    shutdownServer(): void;

    /**
     * Stops the client and disposes any resources. During the stop procedure the client is in the `Stopping` state and will
     * transition to either `Stopped` or `ServerError`.
     *
     * @returns A promise that resolves after the server was stopped and disposed.
     */
    stop(): Promise<void>;

    /**
     * Send an action message to the server.
     *
     * @param message The message
     */
    sendActionMessage(message: ActionMessage): void;

    /**
     * Sets a handler/listener for action messages received from the server.
     *
     * @param handler The action message handler
     */
    onActionMessage(handler: ActionMessageHandler): void;
}

export enum ClientState {
    /**
     * The client has been created.
     */
    Initial,
    /**
     * `Start` has been called on the client and the start process is still on-going.
     */
    Starting,
    /**
     * The client failed to complete the start process.
     */
    StartFailed,
    /**
     * The client was successfully started and is now running.
     */
    Running,
    /**
     * `Stop` has been called on the client and the stop process is still on-going.
     */
    Stopping,
    /**
     * The client stopped and disposed the server connection. Thus, action messages can no longer be sent.
     */
    Stopped,
    /**
     * An error was encountered while connecting to the server. No action messages can be sent.
     */
    ServerError
}

/**
 * A key-value pair structure for custom arguments.
 */
interface Args {
    [key: string]: string | number | boolean;
}

type ActionMessageHandler = (message: ActionMessage) => void;
```

</details>

In GLSP we provide a default client implementation based on [JSON-RPC messages](https://www.jsonrpc.org/).

**Initialize Request**

The `initialize` request has to be the first request from the client to the server.
Until the server has responded with an `InitializeResult` no other request or notification can be handled and is expected to throw an error.
A client is uniquely identified by an `applicationId` and has to specify on which `protocolVersion` it is based on. In addition, custom arguments can be provided in the `args` map to allow for custom initialization behavior on the server.
The request returns an `InitializeResult` that encapsulates server information and capabilities.
The `InitializeResult` is used inform the client about the action kinds that the server can handle for a specific `diagramType`.

<details open><summary>Code</summary>

```typescript
interface InitializeParameters {
    /**
     * Unique identifier for the current client application.
     */
    applicationId: string;

    /**
     * GLSP protocol version that this client is implementing.
     */
    protocolVersion: string;

    /**
     * Additional custom arguments e.g. application specific parameters.
     */
    args?: Args;
}

interface InitializeResult {
    /**
     * GLSP protocol version that the server is implementing.
     */
    protocolVersion: string;

    /**
     * The actions (grouped by `diagramType`) that the server can handle.
     */
    serverActions: ServerActions;
}

/**
 * A key-value pair structure to map a `diagramType` to its server-handled action kinds.
 */
interface ServerActions {
    [key: string]: string[];
}
```

</details>

**InitializeClientSession Request**

When a new graphical representation (diagram) is created a `InitializeClientSession` request has to be sent to the server.
Each individual diagram on the client side counts as one session and has to provide a unique `clientSessionId` and its `diagramType`.
In addition, custom arguments can be provided in the `args` map to allow for custom initialization behavior on the server.

<details open><summary>Code</summary>

```typescript
interface InitializeClientSessionParameters {
    /**
     * Unique identifier for the new client session.
     */
    clientSessionId: string;

    /**
     * Unique identifier of the diagram type for which the session should be configured.
     */
    diagramType: string;

    /**
     * Additional custom arguments.
     */
    args?: Args;
}
```

</details>

**DisposeClientSession Request**

When a graphical representation (diagram) is no longer needed, e.g. the tab containing the diagram widget has been closed, a `DisposeClientSession` request has to be sent to the server.
The session is identified by its unique `clientSessionId`.
In addition, custom arguments can be provided in the `args` map to allow for custom dispose behavior on the server.

<details open><summary>Code</summary>

```typescript
interface DisposeClientSessionParameters {
    /**
     * Unique identifier of the client session that should be disposed.
     */
    clientSessionId: string;

    /**
     * Additional custom arguments.
     */
    args?: Args;
}
```

</details>

**Shutdown Notification**

If the client disconnects from the server, it may send a `shutdown` notification to give the server a chance to clean up any resources dedicated to the client.
The shutdown request does not have any parameters as the server is already aware of the client.

**Action Messages**

Any communication that is performed between initialization and shutdown is handled by sending action messages, either from the client to the server or from the server to the client.
This is the core part of the Graphical Language Server Protocol.

# 2. Graphical Language Server Protocol

The graphical language server protocol defines how the client and the server communicate and which actions are sent between them.
It heavily builds on the client-server protocol defined in [Sprotty](https://github.com/eclipse/sprotty) but adds additional actions to enable editing and other capabilities.
Actions that are re-used from Sprotty are marked as such in their code and we re-use their documentation where applicable.
Additional information regarding the lifecycle of some action messages can be found in the [Sprotty documentation](https://github.com/eclipse/sprotty/wiki/Client-Server-Protocol).

Please note that there are several actions that are used purely on the client side. Such actions are not part of this protocol.

## 2.1. Base Protocol

The base protocol describes the structure of the messages that are sent between the server and the client.

### 2.1.1. ActionMessage

A general message serves as an envelope carrying an action to be transmitted between the client and the server via a DiagramServer.

<details open><summary>Code</summary>

```typescript
interface ActionMessage<A extends Action = Action> {
    /**
     * Used to identify a specific client session.
     */
    clientId: string;

    /**
     * The action to execute.
     */
    Action: A;
}
```

</details>

### 2.1.2. Action

An action is a declarative description of a behavior that shall be invoked by the receiver upon receipt of the action.
It is a plain data structure, and as such transferable between server and client.
Actions contained in action messages are identified by their `kind` attribute.
This attribute is required for all actions.
Certain actions are meant to be sent from the client to the server or vice versa, while other actions can be sent both ways, by the client or the server.
All actions must extend the default action interface.

<details open><summary>Code</summary>

```typescript
interface Action {
    /**
     * Unique identifier specifying the kind of action to process.
     */
    kind: string;
}
```

</details>

#### 2.1.2.1. RequestAction

A request action is tied to the expectation of receiving a corresponding response action.
The `requestId` property is used to match the received response with the original request.

<details open><summary>Code</summary>

```typescript
interface RequestAction<Res extends ResponseAction> extends Action {
    /**
     * Unique id for this request. In order to match a response to this request, the response needs to have the same id.
     */
    requestId: string;
}
```

</details>

#### 2.1.2.2. ResponseAction

A response action is sent to respond to a request action.
The `responseId` must match the `requestId` of the preceding request.
In case the `responseId` is empty or undefined, the action is handled as standalone, i.e. it was fired without a preceding request.

<details open><summary>Code</summary>

```typescript
interface ResponseAction extends Action {
    /**
     * Id corresponding to the request this action responds to.
     */
    responseId: string;
}
```

</details>

#### 2.1.2.3. RejectAction

A reject action is a response fired to indicate that a request must be rejected.

<details open><summary>Code</summary>

```typescript
interface RejectAction extends ResponseAction {
    kind: 'rejectRequest';

    /**
     * A human-readable description of the reject reason. Typically this is an error message
     * that has been thrown when handling the corresponding RequestAction.
     */
    message: string;

    /**
     * Optional additional details.
     */
    detail?: JsonAny;
}
```

</details>

#### 2.1.2.4. Operation

Operations are actions that denote requests from the client to _modify_ the model.
Model modifications are always performed by the server.
After a successful modification, the server sends the updated model back to the client using the [`UpdateModelAction`](#253-updatemodelaction).

<details open><summary>Code</summary>

```typescript
/**
 * Marker interface for operations.
 */
interface Operation extends Action {
    /**
     * Discriminator property to make operations distinguishable from plain Actions.
     */
    isOperation: true;
}

/**
 * An operation that executes a list of operations.
 */
interface CompoundOperation extends Operation {
    readonly kind = 'compound';

    /**
     * List of operations that should be executed.
     */
    operationList: Operation[];
}
```

</details>

## 2.2. Model Structure

The basic structure in Sprotty is called an `SModel`.
Such a model consists of `SModelElements` conforming to an `SModelElementSchema`.

Based on those classes Sprotty already defines a graph-like model called `SGraph` conforming to the `SGraphSchema`.
This graph consists nodes, edges, compartments, labels, and ports.

### 2.2.1. SModelElementSchema

The schema of an `SModelElement` describes its serializable form.
The actual model is created from its schema with an `IModelFactory`.
Each model element must have a unique ID and a type that is used to look up its view, i.e., the graphical representation.

<details open><summary>Code</summary>

```typescript
interface SModelElementSchema {
    /**
     * Unique identifier for this element.
     */
    id: string;

    /**
     * Type to look up the graphical representation of this element.
     */
    type: string;

    /**
     * Children of this element.
     */
    children?: SModelElementSchema[];

    /**
     * CSS classes that should be applied on this element.
     */
    cssClasses?: string[];
}
```

</details>

#### 2.2.1.1. SModelRootSchema

Serializable schema for the root element of the model tree.
Usually actions refer to elements in the graphical model via an `elementId`.
However, a few actions actually need to transfer the graphical model.
In such cases, the graphical model needs to be represented as a serializable `SModelRootSchema`.

<details open><summary>Code</summary>

```typescript
interface SModelRootSchema extends SModelElementSchema {
    /**
     * Bounds of this element in the canvas.
     */
    canvasBounds?: Bounds;

    /**
     * Version of this root element.
     */
    revision?: number;
}
```

</details>

### 2.2.2. SModelElement

All elements of the diagram model inherit from base class `SModelElement`.
Each model element must have a unique ID and a type that is used to look up its view.
Additionally, each element provides access to its root element and holds an index to speed up the model element lookup.

Each model element has a set of features.
A feature is a symbol identifying some functionality that can be enabled or disabled for a model element, e.g. a `resizeFeature`.
The set of supported features is determined by the `features` property.

<details open><summary>Code</summary>

```typescript
class SModelElement {
    /**
     * Unique identifier for this element.
     */
    id: string;

    /**
     * Type to look up the graphical representation of this element.
     */
    type: string;

    /**
     * CSS classes that should be applied on this element.
     */
    cssClasses?: string[];

    /**
     * A set of features supported by this element, e.g.,
     */
    features?: FeatureSet;

    /**
     * This element's root element.
     */
    root: SModelRoot;

    /**
     * Access to the model's index for faster element lookup.
     */
    index: SModelIndex<SModelElement>;
}
```

</details>

#### 2.2.2.1. SParentElement

A parent element may contain child elements, thus the diagram model forms a tree.

<details open><summary>Code</summary>

```typescript
class SParentElement extends SModelElement {
    /**
     * Children of this element.
     */
    readonly children: ReadonlyArray<SChildElement>;

    /**
     * Adds a child element to this element.
     */
    add(child: SChildElement, index?: number);

    /**
     * Removes a child element from this element.
     */
    remove(child: SChildElement);

    /**
     * Removes all child elements from this element.
     */
    removeAll(filter?: (e: SChildElement) => boolean);

    /**
     * Moves a child element to a new index.
     */
    move(child: SChildElement, newIndex: number);
}
```

</details>

#### 2.2.2.2. SChildElement

A child element is contained in a parent element.
All elements except the model root are child elements.
In order to keep the model class hierarchy simple, every child element is also a parent element, although for many elements the array of children is empty (i.e. they are leafs in the model element tree).

<details open><summary>Code</summary>

```typescript
class SChildElement extends SParentElement {
    /**
     * Parent of this element.
     */
    readonly parent: SParentElement;
}
```

</details>

#### 2.2.2.3. SModelRoot

Base class for the root element of the diagram model tree.

<details open><summary>Code</summary>

```typescript
class SModelRoot extends SParentElement {
    /**
     * Access to the index which is built up for faster element lookup.
     */
    readonly index: SModelIndex<SModelElement>;

    /**
     * Bounds of this element in the canvas.
     */
    canvasBounds?: Bounds;

    /**
     * Version of this root element.
     */
    revision?: number;
}
```

</details>

## 2.3. Types

### 2.3.1. Args

Arguments are a key-value map with the key being a string and the value being either a string, a number, or a boolean value.

<details open><summary>Code</summary>

```typescript
type Args = { [key: string]: string | number | boolean };
```

</details>

### 2.3.2. Point

A `Point` is composed of the (x,y) coordinates of an object.

<details open><summary>Code</summary>

```typescript
interface Point {
    /**
     * The abscissa of the point.
     */
    readonly x: number;

    /**
     * The ordinate of the point.
     */
    readonly y: number;
}
```

</details>

### 2.3.3. Dimension

The `Dimension` of an object is composed of its width and height.

<details open><summary>Code</summary>

```typescript
interface Dimension {
    /**
     * The width of an element.
     */
    readonly width: number;

    /**
     * the height of an element.
     */
    readonly height: number;
}
```

</details>

### 2.3.4. Bounds

The bounds are the position (x, y) and dimension (width, height) of an object.
As such the `Bounds` type extends both `Point` and `Dimension`.

<details open><summary>Code</summary>

```typescript
interface Bounds extends Point, Dimension {}
```

</details>

### 2.3.5. ElementAndBounds

The `ElementAndBounds` type is used to associate new bounds with a model element, which is referenced via its id.

<details open><summary>Code</summary>

```typescript
interface ElementAndBounds {
    /**
     * The identifier of the element.
     */
    elementId: string;

    /**
     * The new size of the element.
     */
    newSize: Dimension;

    /**
     * The new position of the element.
     */
    newPosition?: Point;
}
```

</details>

### 2.3.6. ElementAndAlignment

The `ElementAndAlignment` type is used to associate a new alignment with a model element, which is referenced via its id.

<details open><summary>Code</summary>

```typescript
interface ElementAndAlignment {
    /**
     * The identifier of an element.
     */
    elementId: string;

    /**
     * The new alignment of the element.
     */
    newAlignment: Point;
}
```

</details>

### 2.3.7. ElementAndRoutingPoints

The `ElementAndRoutingPoints` type is used to associate an edge with specific routing points.

<details open><summary>Code</summary>

```typescript
interface ElementAndRoutingPoints {
    /**
     * The identifier of an element.
     */
    elementId: string;

    /**
     * The new list of routing points.
     */
    newRoutingPoints?: Point[];
}
```

</details>

### 2.3.8. EditorContext

The `EditorContext` may be used to represent the current state of the editor for particular actions.
It encompasses the last recorded mouse position, the list of selected elements, and may contain custom arguments to encode additional state information.

<details open><summary>Code</summary>

```typescript
interface EditorContext {
    /**
     * The list of selected element identifiers.
     */
    readonly selectedElementIds: string[];

    /**
     * The last recorded mouse position.
     */
    readonly lastMousePosition?: Point;

    /**
     * Custom arguments.
     */
    readonly args?: Args;
}
```

</details>

### 2.3.9. LabeledAction

Labeled actions are used to denote a group of actions in a user-interface context, e.g., to define an entry in the command palette or in the context menu.

<details open><summary>Code</summary>

```typescript
interface LabeledAction {
    /**
     * Group label.
     */
    label: string;

    /**
     * Actions in the group.
     */
    actions: Action[];

    /**
     * Optional group icon.
     */
    icon?: string;
}
```

</details>

## 2.4 Model Data

### 2.4.1. RequestModelAction

Sent from the client to the server in order to request a graphical model.
Usually this is the first message that is sent from the client to the server, so it is also used to initiate the communication.
The response is a `SetModelAction` or an `UpdateModelAction`.

<details open><summary>Code</summary>

```typescript
interface RequestModelAction extends RequestAction<SetModelAction> {
  /**
   * The kind of the action.
   */
  kind = "requestModel";

  /**
   * Additional options used to compute the graphical model.
   */
  options?: { [key: string]: string });
}
```

</details>

### 2.4.2. SetModelAction

Sent from the server to the client in order to set the model.
If a model is already present, it is replaced.

<details open><summary>Code</summary>

```typescript
interface SetModelAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setModel';

    /**
     * The new graphical model elements.
     */
    newRoot: SModelRootSchema;
}
```

</details>

### 2.4.3. UpdateModelAction

Sent from the server to the client in order to update the model.
If no model is present yet, this behaves the same as a `SetModelAction`.
The transition from the old model to the new one can be animated.

<details open><summary>Code</summary>

```typescript
interface UpdateModelAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'updateModel';

    /**
     * The new root element of the graphical model.
     */
    newRoot?: SModelRootSchema;

    /**
     * Boolean flag to indicate wether updated/changed elements should be animated in the diagram.
     */
    animate?: boolean;
}

interface Match {
    left?: SModelElementSchema;
    right?: SModelElementSchema;
    leftParentId?: string;
    rightParentId?: string;
}
```

</details>

### 2.4.4. SourceModelChangedAction

Sent from the server to the client in order to indicate that the source model has changed.
The source model denotes the data source from which the diagram has been originally derived (such as a file, a database, etc.).
Typically clients would react to such an action by asking the user whether she wants to reload the diagram or ignore the changes and continue editing.
If the editor has no changes (i.e. is not dirty), clients may also choose to directly refresh the editor by sending a [RequestModelAction](#251-requestmodelaction).

<details open><summary>Code</summary>

```typescript
interface SourceModelChangedAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'sourceModelChanged';

    /**
     * A human readable name of the source model (e.g. the file name).
     */
    sourceModelName: string;
}
```

</details>

## 2.5. Model Saving

### 2.5.1. SaveModelAction

Sent from the client to the server in order to persist the current model state back to the source model.
A new `fileUri` can be defined to save the model to a new destination different from its original source model.

<details open><summary>Code</summary>

```typescript
interface SaveModelAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'saveModel';

    /**
     *  The optional destination file uri.
     */
    fileUri?: string;
}
```

</details>

### 2.5.2. SetDirtyStateAction

The server sends a `SetDirtyStateAction` to indicate to the client that the current model state on the server does not correspond to the persisted model state of the source model.
A client may ignore such an action or use it to indicate to the user the dirty state.

<details open><summary>Code</summary>

```typescript
interface SetDirtyStateAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'setDirtyState';

    /**
     * True if the current model state is dirty
     */
    isDirty: boolean;

    /**
     * A string indicating the reason for the dirty state change e.g 'operation', 'undo' ...
     */
    reason?: string;
}
```

</details>

### 2.5.3. ExportSvgAction

The client (or the server) sends an `ExportSvgAction` to indicate that the diagram, which represents the current model state, should be exported in SVG format.
The action only provides the diagram SVG as plain string.
The expected result of executing an `ExportSvgAction` is a new file in SVG-format on the underlying filesystem.
However, other details like the target destination, concrete file name, file extension etc. are not specified in the protocol.
So it is the responsibility of the action handler to process this information accordingly and export the result to the underlying filesystem.

<details open><summary>Code</summary>

```typescript
/**
 * Note that sprotty also provides a `RequestExportSvgAction` which is currently not supported in GLSP.
 */
interface ExportSvgAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'exportSvg';

    /**
     * The diagram SModel as serializable SVG.
     */
    svg: string;

    /**
     * Id corresponding to the request this action responds to.
     */
    responseId: string;
}
```

</details>

## 2.6. Model Layout

In GLSP the server usually controls the model's layout by applying bounds to all elements and sending an updated model to the client ([SetModelAction](#252-setmodelaction), [UpdateModelAction](#253-updatemodelaction)).
However, calculating the correct bounds of each element may not be straight-forward as it may depend on certain client-side rendering properties, such as label size.

On the client-side Sprotty calculates the layout on two levels: The `Micro Layout` is responsible to layout a single element with all its labels, icons, compartments in a horizontal box, vertical box, or other layout containers.
The `Macro Layout` is responsible for layouting the network of nodes and edges on the canvas.
If a server needs information from the micro layout, it can send a `RequestBoundsAction` to the client who will respond with a `ComputedBoundsAction` containing all elements and their bounds.

### 2.6.1. RequestBoundsAction

Sent from the server to the client to request bounds for the given model.
The model is rendered invisibly so the bounds can derived from the DOM.
The response is a `ComputedBoundsAction`.
This hidden rendering round-trip is necessary if the client is responsible for parts of the layout.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestBoundsAction.
 */
interface RequestBoundsAction extends RequestAction {
    /**
     * The kind of the action.
     */
    kind = 'requestBounds';

    /**
     * The model elements to consider to compute the new bounds.
     */
    newRoot: SModelRootSchema;
}
```

</details>

### 2.6.2. ComputedBoundsAction

Sent from the client to the server to transmit the result of bounds computation as a response to a `RequestBoundsAction`.
If the server is responsible for parts of the layout, it can do so after applying the computed bounds received with this action.
Otherwise there is no need to send the computed bounds to the server, so they can be processed locally by the client.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ComputedBoundsAction.
 */
interface ComputedBoundsAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'computedBounds';

    /**
     * The new bounds of the model elements.
     */
    bounds: ElementAndBounds[];

    /*
     * The revision number.
     */
    revision?: number;

    /**
     * The new alignment of the model elements.
     */
    alignments?: ElementAndAlignment[];

    /**
     * The route of the model elements.
     */
    routes?: ElementAndRoutingPoints[];
}
```

</details>

### 2.6.3. LayoutOperation

Request a layout of the diagram or selected elements from the server.

<details open><summary>Code</summary>

```typescript
/**
 * Layout Operation based on Sprotty's LayoutAction.
 */
interface LayoutOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'layout';

    /**
     * The identifiers of the elements that should be layouted, will default to the root element if not defined.
     */
    elementIds?: string[];
}
```

</details>

## 2.7. Model Edit Mode

GLSP supports setting the model into different edit modes.
We pre-define two such modes: `readonly` and `editable`.
However these modes can be customized as need be.

### 2.7.1. SetEditModeAction

Sent from the client to the server to set the model into a specific editor mode, allowing the server to react to certain requests differently depending on the mode.
A client may also listen to this action to prevent certain user interactions preemptively.

<details open><summary>Code</summary>

```typescript
interface SetEditModeAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'setEditMode';

    /**
     * The new edit mode of the diagram.
     */
    editMode: string;
}
```

</details>

## 2.8. Client-Side Actions

There are several actions that are issued and processed on the client to manipulate the view port, select elements, etc.
Those actions may also be sent by the server to trigger the respective client behavior.
Please note that we only list actions here that are actually used by the current default implementation of the GLSP server.

### 2.8.1. View Port

View port actions manipulate the viewport on the client-side and may be sent from the server to highlight changes or improve general usability.

#### 2.8.1.1. CenterAction

Centers the viewport on the elements with the given identifiers.
It changes the scroll setting of the viewport accordingly and resets the zoom to its default.
This action can also be created on the client but it can also be sent by the server in order to perform such a viewport change remotely.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's CenterAction.
 */
interface CenterAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'center';

    /**
     * The identifier of the elements on which the viewport should be centered.
     */
    elementIds: string[];

    /**
     * Indicate if the modification of the viewport should be realized with or without support of animations.
     */
    animate: boolean = true;

    /**
     * Indicates whether the zoom level should be kept.
     */
    retainZoom: boolean = false;
}
```

</details>

#### 2.8.1.2. FitToScreenAction

Triggers to fit all or a list of elements into the available drawing area.
The resulting fit-to-screen command changes the zoom and scroll settings of the viewport so the model can be shown completely.
This action can also be sent from the server to the client in order to perform such a viewport change programmatically.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's FitToScreenAction.
 */
interface FitToScreenAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'fit';

    /**
     * The identifier of the elements to fit on screen.
     */
    elementIds: string[];

    /**
     * The padding that should be visible on the viewport.
     */
    padding?: number;

    /**
     * The max zoom level authorized.
     */
    maxZoom?: number;

    /**
     * Indicate if the action should be performed with animation support or not.
     */
    animate: boolean = true;
}
```

</details>

### 2.8.2. Client Notification

In GLSP we distinguish between a status and a message which may be displayed differently on the client.
For instance, in the Theia Integration status updates are shown directly on the diagram as an overlay whereas messages are shown in separate message popups.

#### 2.8.2.1. ServerStatusAction

This action is typically sent by the server to signal a state change.
This action extends the corresponding Sprotty action to include a timeout.
If a timeout is given the respective status should disappear after the timeout is reached.

<details open><summary>Code</summary>

```typescript
interface ServerStatusAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'serverStatus';

    /**
     * The severity of the status.
     */
    severity: ServerSeverity;

    /**
     * The message describing the status.
     */
    message: string;

    /**
     * Timeout after which a displayed status disappears.
     */
    timeout?: number;
}
```

</details>

#### 2.8.2.2. ServerMessageAction

This action is typically sent by the server to notify the user about something of interest.

<details open><summary>Code</summary>

```typescript
interface ServerMessageAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'serverMessage';

    /**
     * The severity of the message.
     */
    severity: ServerSeverity;

    /**
     * The message text.
     */
    message: string;

    /**
     * Further details on the message.
     */
    details: string;

    /**
     * Timeout after which a displayed message disappears.
     */
    timeout?: number;
}
```

</details>

#### 2.8.2.3. ServerSeverity

The severity of a status or message.

<details open><summary>Code</summary>

```typescript
/**
 * The possible server status severity levels.
 */
type ServerSeverity = 'NONE' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL' | 'OK';
```

</details>

### 2.8.3. Element Selection

#### 2.8.3.1. SelectAction

Triggered when the user changes the selection, e.g. by clicking on a selectable element.
The action should trigger a change in the `selected` state accordingly, so the elements can be rendered differently.
The server can send such an action to the client in order to change the selection remotely.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SelectAction.
 */
interface SelectAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'elementSelected';

    /**
     * The identifier of the elements to mark as selected.
     */
    selectedElementsIDs: string[];

    /**
     * The identifier of the elements to mark as not selected.
     */
    deselectedElementsIDs: string[];
}
```

</details>

#### 2.8.3.2. SelectAllAction

Used for selecting or deselecting all elements.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SelectAllAction.
 */
interface SelectAllAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'allSelected';

    /**
     * If `select` is true, all elements are selected, otherwise they are deselected.
     */
    select: boolean;
}
```

</details>

## 2.9. Element Hover

### 2.9.1. RequestPopupModelAction

Triggered when the user hovers the mouse pointer over an element to get a popup with details on that element.
This action is sent from the client to the server.
The response is a `SetPopupModelAction`.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestPopupModelAction.
 */
interface RequestPopupModelAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'requestPopupModel';

    /**
     * The identifier of the elements for which a popup is requested.
     */
    elementId: string;

    /**
     * The bounds.
     */
    bounds: Bounds;
}
```

</details>

### 2.9.2. SetPopupModelAction

Sent from the server to the client to display a popup in response to a `RequestPopupModelAction`.
This action can also be used to remove any existing popup by choosing `EMPTY_ROOT` as root element.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SetPopupModelAction.
 */
interface SetPopupModelAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'setPopupModel';

    /**
     * The model elements composing the popup to display.
     */
    newRoot: SModelRootSchema;
}
```

</details>

## 2.10. Element Validation

Validation in GLSP is performed by using validation markers.
A marker represents the validation result for a single model element:

<details open><summary>Code</summary>

```typescript
interface Marker {
    /**
     * Short label describing this marker message, e.g., short validation message
     */
    readonly label: string;

    /**
     * Full description of this marker, e.g., full validation message
     */
    readonly description: string;

    /**
     * Id of the model element this marker refers to
     */
    readonly elementId: string;

    /**
     * Marker kind, e.g., info, warning, error or custom kind
     */
    readonly kind: string;
}
```

</details>

### 2.10.1. RequestMarkersAction

Action to retrieve markers for the specified model elements.
Sent from the client to the server.

<details open><summary>Code</summary>

```typescript
interface RequestMarkersAction extends RequestAction {
    /**
     * The kind of the action.
     */
    kind = 'requestMarkers';

    /**
     * The elements for which markers are requested, may be just the root element.
     */
    elementsIDs: string[];

    /**
     * The reason for this request, e.g. a `batch` validation or a `live` validation.
     */
    readonly reason?: string;
}
```

</details>

### 2.10.2. SetMarkersAction

Response to the `RequestMarkersAction` containing all validation markers.
Sent from the server to the client.

<details open><summary>Code</summary>

```typescript
interface SetMarkersAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setMarkers';

    /**
     * The list of markers that has been requested by the `RequestMarkersAction`.
     */
    markers: Marker[];

    /**
     * The reason for this response, e.g. a `batch` validation or a `live` validation.
     */
    readonly reason?: string;
}
```

</details>

### 2.10.3. DeleteMarkersAction

To remove markers for elements a client or server may send a `DeleteMarkersAction` with all markers that should be removed.

<details open><summary>Code</summary>

```typescript
interface DeleteMarkersAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'deleteMarkers';

    /**
     * The list of markers that should be deleted.
     */
    markers: Marker[];
}
```

</details>

## 2.11. Element Navigation

GLSP makes no assumption about the type of navigation a user may want to perform.
Thus a generic infrastructure is provided that the client and server can use to implement specific navigation types, e.g., navigation to documentation, implementation, etc.
The type of navigation is identified by the `targetTypeId`.

A client may request the targets for a specific type of navigation by querying the server to which the server will respond with a set of navigation targets.
A `NavigationTarget` identifies the object we want to navigate to via its uri and may further provide a label to display for the client.
Additionally, generic arguments may be used to to encode any domain- or navigation type-specific information.

<details open><summary>Code</summary>

```typescript
interface NavigationTarget {
    /**
     * URI to identify the object we want to navigate to.
     */
    uri: string;

    /**
     * Optional label to display to the user.
     */
    label?: string;

    /**
     * Domain-specific arguments that may be interpreted directly or resolved further.
     */
    args?: Args;
}
```

</details>

### 2.11.1. RequestNavigationTargetsAction

Action that is usually sent from the client to the server to request navigation targets for a specific navigation type such as `documentation` or `implementation` in the given editor context.

<details open><summary>Code</summary>

```typescript
interface RequestNavigationTargetsAction extends RequestAction<SetNavigationTargetsAction> {
    /**
     * The kind of the action.
     */
    kind = 'requestNavigationTargets';

    /**
     * Identifier of the type of navigation targets we want to retrieve, e.g., 'documentation', 'implementation', etc.
     */
    targetTypeId: string;

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}
```

</details>

### 2.11.2. SetNavigationTargetsAction

Response action from the server following a `RequestNavigationTargetsAction`.
It contains all available navigation targets for the queried target type in the provided editor context.
The server may also provide additional information using the arguments, e.g., warnings, that can be interpreted by the client.

<details open><summary>Code</summary>

```typescript
interface SetNavigationTargetsAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setNavigationTargets';

    /**
     * A list of navigation targets.
     */
    targets: NavigationTarget[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    args?: Args;
}
```

</details>

### 2.11.3. NavigateToTargetAction

Action that triggers the navigation to a particular navigation target.
This may be used by the client internally or may be sent from the server.

<details open><summary>Code</summary>

```typescript
interface NavigateToTargetAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'navigateToTarget';

    /**
     * The target to which we navigate.
     */
    target: NavigationTarget;
}
```

</details>

### 2.11.4. ResolveNavigationTargetAction

If a client cannot navigate to a target directly, a `ResolveNavigationTargetAction` may be sent to the server to resolve the navigation target to one or more model elements.
This may be useful in cases where the resolution of each target is expensive or the client architecture requires an indirection.

<details open><summary>Code</summary>

```typescript
interface ResolveNavigationTargetAction extends RequestAction<SetResolvedNavigationTargetAction> {
    /**
     * The kind of the action.
     */
    kind = 'resolveNavigationTarget';

    /**
     * The navigation target to resolve.
     */
    navigationTarget: NavigationTarget;
}
```

</details>

### 2.11.4. SetResolvedNavigationTargetAction

An action sent from the server in response to a `ResolveNavigationTargetAction`.
The response contains the resolved element ids for the given target and may contain additional information in the `args` property.

<details open><summary>Code</summary>

```typescript
interface SetResolvedNavigationTargetAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setResolvedNavigationTarget';

    /**
     * The element ids of the resolved navigation target.
     */
    elementIds: string[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    args?: Args;
}
```

</details>

### 2.11.5. NavigateToExternalTargetAction

If a navigation target cannot be resolved or the resolved target is something that is not part of our source model, e.g., a separate documentation file, a `NavigateToExternalTargetAction` may be sent.
Since the target it outside of the model scope such an action would be typically handled by an integration layer (such as the surrounding IDE).

<details open><summary>Code</summary>

```typescript
interface NavigateToExternalTargetAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'navigateToExternalTarget';

    /**
     * The target to which we navigate.
     */
    target: NavigationTarget;
}
```

</details>

## 2.12. Element Type Hints

Type hints are used to define what modifications are supported on the different element types.
Conceptually type hints are similar to `features` of a model elements but define the functionality on a type level.
The rationale is to avoid a client-server round-trip for user feedback of each synchronous user interaction.

In GLSP we distinguish between `ShapeTypeHints` and `EdgeTypeHints`.
These hints specify whether an element can be resized, relocated and/or deleted.
Optionally, they specify a list of element types that can be contained/connected by this element.

<details open><summary>Code</summary>

```typescript
interface TypeHint {
    /**
     * The identifier of an element.
     */
    readonly elementTypeId: string;

    /**
     * Specifies whether the element can be relocated.
     */
    readonly repositionable: boolean;

    /**
     * Specifies whether the element can be deleted
     */
    readonly deletable: boolean;
}

interface ShapeTypeHint extends TypeHint {
    /**
     * Specifies whether the element can be resized.
     */
    readonly resizable: boolean;

    /**
     * Specifies whether the element can be moved to another parent
     */
    readonly reparentable: boolean;

    /**
     * The types of elements that can be contained by this element (if any)
     */
    readonly containableElementTypeIds?: string[];
}

interface EdgeTypeHint extends TypeHint {
    /**
     * Specifies whether the routing of this element can be changed.
     */
    readonly routable: boolean;

    /**
     * Allowed source element types for this edge type
     */
    readonly sourceElementTypeIds: string[];

    /**
     * Allowed targe element types for this edge type
     */
    readonly targetElementTypeIds: string[];
}
```

</details>

### 2.12.1. RequestTypeHintsAction

Sent from the client to the server in order to request hints on whether certain modifications are allowed for a specific element type.
The `RequestTypeHintsAction` is optional, but should usually be among the first messages sent from the client to the server after receiving the model via `RequestModelAction`.
The response is a `SetTypeHintsAction`.

<details open><summary>Code</summary>

```typescript
interface RequestTypeHintsAction extends RequestAction<SetTypeHintsAction> {
    /**
     * The kind of the action.
     */
    kind = 'requestTypeHints';
}
```

</details>

### 2.12.2. SetTypeHintsAction

Sent from the server to the client in order to provide hints certain modifications are allowed for a specific element type.

<details open><summary>Code</summary>

```typescript
interface SetTypeHintsAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setTypeHints';

    /**
     * The hints for shape types.
     */
    shapeHints: ShapeTypeHint[];

    /**
     * The hints for edge types.
     */
    edgeHints: EdgeTypeHint[];
}
```

</details>

## 2.13. Element Creation and Deletion

### 2.13.1. CreateNodeOperation

<details open><summary>Code</summary>

In order to create a node in the model the client can send a `CreateNodeOperation` with the necessary information to create that node.

```typescript
interface CreateNodeOperation extends CreateOperation {
    /**
     * The kind of the action.
     */
    kind = 'createNode';

    /*
     * The location at which the operation shall be executed.
     */
    location?: Point;

    /*
     * The container in which the operation shall be executed.
     */
    containerId?: string;
}
```

</details>

### 2.13.2. CreateEdgeOperation

In order to create an edge in the model the client can send a `CreateEdgeOperation` with the necessary information to create that edge.

<details open><summary>Code</summary>

```typescript
interface CreateEdgeOperation extends CreateOperation {
    /**
     * The kind of the action.
     */
    kind = 'createEdge';

    /*
     * The source element.
     */
    sourceElementId: string;

    /*
     * The target element.
     */
    targetElementId: string;
}
```

</details>

### 2.13.3. DeleteElementOperation

The client sends a `DeleteElementOperation` to the server to request the deletion of an element from the model.

<details open><summary>Code</summary>

```typescript
interface DeleteElementOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'deleteElement';

    /**
     * The elements to be deleted.
     */
    elementIds: string[];
}
```

</details>

## 2.14. Node Modification

### 2.14.1. ChangeBoundsOperation

Triggers the position or size change of elements.
This action concerns only the element's graphical size and position.
Whether an element can be resized or repositioned may be specified by the server with a [`TypeHint`](#213-element-type-hints) to allow for immediate user feedback before resizing or repositioning.

<details open><summary>Code</summary>

```typescript
interface ChangeBoundsOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'changeBounds';

    /**
     * The new bounds of the respective elements.
     */
    newBounds: ElementAndBounds[];
}
```

</details>

### 2.14.2. ChangeContainerOperation

The client sends a `ChangeContainerOperation` to the server to request the execution of a `changeContainer` operation.

<details open><summary>Code</summary>

```typescript
interface ChangeContainerOperation implements Operation {
    /**
     * The kind of the action.
     */
    kind = 'changeContainer';

    /**
     * The element to be changed.
     */
    elementId: string;

    /**
     * The element container of the changeContainer operation.
     */
    targetContainerId: string;

    /**
     * The graphical location.
     */
    location?: string;
}
```

</details>

## 2.15. Edge Modification

### 2.15.1. ReconnectEdgeOperation

If the source and/or target element of an edge should be adapted, the client can send a `ReconnectEdgeOperation` to the server.

<details open><summary>Code</summary>

```typescript
interface ReconnectEdgeOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'reconnectEdge';

    /**
     * The edge element that should be reconnected.
     */
    edgeElementId: string;

    /**
     * The (new) source element of the edge.
     */
    sourceElementId: string;

    /**
     * The (new) target element of the edge.
     */
    targetElementId: string;

    /*
     * Additional arguments for custom behavior.
     */
    args?: Args;
}
```

</details>

### 2.15.2. ChangeRoutingPointsOperation

An edge may have zero or more routing points that "re-direct" the edge between the source and the target element.
In order to set these routing points the client may send a `ChangeRoutingPointsOperation`.

<details open><summary>Code</summary>

```typescript
interface ChangeRoutingPointsOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'changeRoutingPoints';

    /**
     * The routing points of the edge (may be empty).
     */
    newRoutingPoints: ElementAndRoutingPoints[];
}
```

</details>

## 2.16. Element Text Editing

A common use case in diagrams is to query the user for textual input to perform a certain action, e.g., when editing the text on a label.

To support the validation of user input in the context of such an action before actually applying that user input, GLSP defines two actions: `RequestEditValidationAction` and `SetEditValidationResultAction`.

<details open><summary>Code</summary>

```typescript
interface ValidationStatus {
    /**
     * The severity of the validation returned by the server.
     */
    readonly severity: ValidationStatus.Severity;

    /**
     * The validation status message which may be rendered in the view.
     */
    readonly message?: string;

    /**
     * A potential error that encodes more details.
     */
    readonly error?: ResponseError;
}

interface ResponseError {
    /**
     * Code identifying the error kind.
     */
    readonly code: number;

    /**
     * Error message.
     */
    readonly message: string;

    /**
     * Additional custom data, e.g., a serialized stacktrace.
     */
    readonly data: Object;
}

namespace ValidationStatus {
    enum Severity {
        FATAL,
        ERROR,
        WARNING,
        INFO,
        OK,
        NONE
    }
}
```

</details>

### 2.16.1. RequestEditValidationAction

Requests the validation of the given text in the context of the provided model element.
Typically sent from the client to the server.

<details open><summary>Code</summary>

```typescript
interface RequestEditValidationAction extends RequestAction<SetEditValidationResultAction> {
    /**
     * The kind of the action.
     */
    kind = 'requestEditValidation';

    /**
     * Context in which the text is validated, e.g., 'label-edit'.
     */
    contextId: string;

    /**
     * Model element that is being edited.
     */
    modelElementId: string;

    /**
     * Text that should be considered for the model element.
     */
    text: string;
}
```

</details>

### 2.16.2. SetEditValidationResultAction

Response to a `RequestEditValidationAction` containing the validation result for applying a text on a certain model element.

<details open><summary>Code</summary>

```typescript
interface SetEditValidationResultAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setEditValidationResult';

    /**
     * Validation status.
     */
    status: ValidationStatus;

    /*
     * Additional arguments for custom behavior.
     */
    args?: Args;
}
```

</details>

### 2.16.3. ApplyLabelEditOperation

A very common use case in domain models is the support of labels that display textual information to the user.
For instance, the `SGraph` model of Sprotty has support for labels that can be attached to a node, edge, or port, and that contain some text that is rendered in the view.
To apply new text to such a label element the client may send an `ApplyLabelEditOperation` to the server.

<details open><summary>Code</summary>

```typescript
interface ApplyLabelEditOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'applyLabelEdit';

    /**
     * Identifier of the label model element.
     */
    labelId: string;

    /**
     * Text that should be applied on the label.
     */
    text: string;
}
```

</details>

## 2.17. Clipboard

In GLSP the clipboard needs to be managed by the client but the conversion from the selection to be copied into a clipboard-compatible format is handled by the server.
By default, GLSP use `application/json` as exchange format.

<details open><summary>Code</summary>

```typescript
type ClipboardData = { [format: string]: string };
```

</details>

### 2.17.1. RequestClipboardDataAction

Requests the clipboard data for the current editor context, i.e., the selected elements, in a clipboard-compatible format.

<details open><summary>Code</summary>

```typescript
interface RequestClipboardDataAction extends RequestAction<SetClipboardDataAction> {
    /**
     * The kind of the action.
     */
    kind = 'requestClipboardData';

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}
```

</details>

### 2.17.2. SetClipboardDataAction

Server response to a `RequestClipboardDataAction` containing the selected elements as clipboard-compatible format.

<details open><summary>Code</summary>

```typescript
interface SetClipboardDataAction extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setClipboardData';

    /**
     * The selected elements from the editor context as clipboard data.
     */
    clipboardData: ClipboardData;
}
```

</details>

### 2.17.3. CutOperation

Requests a cut operation from the server, i.e., deleting the selected elements from the model.
Before submitting a `CutOperation` a client should ensure that the cut elements are put into the clipboard.

<details open><summary>Code</summary>

```typescript
interface CutOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'cut';

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}
```

</details>

### 2.17.4. PasteOperation

Requests a paste operation from the server by providing the current clipboard data.
Typically this means that elements should be created based on the data in the clipboard.

<details open><summary>Code</summary>

```typescript
interface PasteOperation extends Operation {
    /**
     * The kind of the action.
     */
    kind = 'paste';

    /**
     * The current editor context.
     */
    editorContext: EditorContext;

    /**
     * The clipboard data that should be pasted to the editor's last recorded mouse position (see `editorContext`).
     */
    clipboardData: ClipboardData;
}
```

</details>

## 2.18. Undo / Redo

A server usually keeps a command stack of all commands executed on the model.
To navigate the command stack the following actions can be used.

### 2.18.1. UndoAction

Trigger an undo of the latest executed command.

<details open><summary>Code</summary>

```typescript
interface UndoAction {
    /**
     * The kind of the action.
     */
    kind = 'glspUndo';
}
```

</details>

### 2.18.2. RedoAction

Trigger a redo of the latest undone command.

<details open><summary>Code</summary>

```typescript
interface RedoAction {
    /**
     * The kind of the action.
     */
    kind = 'glspRedo';
}
```

</details>

## 2.19. Contexts

A context is a dedicated space in the client that is identified via a unique id.
Context actions are a specific set of actions that are available in that context id.
At the moment we support three such contexts:

-   The Context Menu with the context id `context-menu`
-   The Command Palette with the context id `command-palette`
-   The Tool Palette with the context id `tool-palette`

### 2.19.1. RequestContextActions

<details open><summary>Code</summary>

The RequestContextActions is sent from the client to the server to request the available actions for the context with id `contextId`.

```typescript
interface RequestContextActions extends RequestAction<SetContextActions> {
    /**
     * The kind of the action.
     */
    kind = 'requestContextActions';

    /**
     * The identifier for the context.
     */
    contextId: string;

    /**
     * The current editor context.
     */
    editorContext: EditorContext;
}
```

</details>

### 2.19.2. SetContextActions

The `SetContextActions` is the response to a `RequestContextActions` containing all actions for the queried context.

<details open><summary>Code</summary>

```typescript
interface SetContextActions extends ResponseAction {
    /**
     * The kind of the action.
     */
    kind = 'setContextActions';

    /**
     * The actions available in the queried context.
     */
    readonly actions: LabeledAction[];

    /**
     * Custom arguments.
     */
    args: ?Args;
}
```

</details>

### 2.19.3. Context Menu

The context menu is an overlay that is triggered by a right click from the user.
The menu may be filled with actions from the client but may also be filled with actions from the server.
If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `context-menu` and handle the returned actions from the `SetContextActions` response accordingly, e.g., rendering them in a context menu.

### 2.19.4. Command Palette

The command palette is an "auto-complete" widget that is triggered when the user hits `Ctrl+Space`.
The menu may be filled with actions from the client but may also be filled with actions from the server.
If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `command-palette` and handle the returned actions from the `SetContextActions` response accordingly, i.e., rendering them in a auto-complete widget.

### 2.19.5. Tool Palette

The tool palette is a widget on the graph's canvas that displays a set of tools and actions that the user can use to interact with the model.
As such the tool palette consists of two parts: tools and labeled actions.

A tool is a uniquely identified functionality that can be either enabled or disabled.
Tools can be activated and de-activated from the user by clicking their rendered representation in the platte or may be activated using dedicated actions.

 <details open><summary>Code</summary>

```typescript
interface Tool {
    /**
     * Unique tool id.
     */
    readonly id: string;

    /**
     * Notifies the tool to become active.
     */
    enable(): void;

    /**
     * Notifies the tool to become inactive.
     */
    disable(): void;
}
```

</details>

By default, the tool palette in GLSP includes the following tools in the palette:

-   Default Tool (Selection Tool)
-   Mouse Delete Tool
-   Validation Tool

The supported actions of the tool palette come from the server.
If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `tool-palette` and handle the returned actions from the `SetContextActions` response accordingly, e.g., rendering them in the tool palette.
A user may click on any of the entries in the tool palette to trigger the corresponding action.

For creating new elements we provide two dedicated trigger actions that can be sent from the server to activate and configure the `Node Creation Tool` or the `Edge Creation Tool` respectively.
This indirection is necessary as the user, after clicking on the respective action, still needs to provide additional information, i.e., the location of the new node or which elements should be connected through an edge.
After all information is available, the actual creation operation is triggered.

#### 2.19.5.1. TriggerNodeCreationAction

Triggers the enablement of the tool that is responsible for creating nodes and initializes it with the creation of nodes of the given `elementTypeId`.

<details open><summary>Code</summary>

```typescript
interface TriggerNodeCreationAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'triggerNodeCreation';

    /**
     * The type of node that should be created by the node creation tool.
     */
    elementTypeId: string;

    /**
     * Custom arguments.
     */
    args?: Args;
}
```

</details>

#### 2.19.5.2. TriggerEdgeCreationAction

Triggers the enablement of the tool that is responsible for creating edges and initializes it with the creation of edges of the given `elementTypeId`.

<details open><summary>Code</summary>

```typescript
interface TriggerEdgeCreationAction extends Action {
    /**
     * The kind of the action.
     */
    kind = 'triggerEdgeCreation';

    /**
     * The type of edge that should be created by the edge creation tool.
     */
    elementTypeId: string;

    /**
     * Custom arguments.
     */
    args?: Args;
}
```

</details>
