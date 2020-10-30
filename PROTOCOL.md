<details open><summary>Table of Contents</summary>

- [1. Server-Client Lifecycle](#1-server-client-lifecycle)
- [2. Graphical Language Server Protocol](#2-graphical-language-server-protocol)
  - [2.1. Base Protocol](#21-base-protocol)
    - [2.1.1. ActionMessage](#211-actionmessage)
    - [2.1.2. Action](#212-action)
      - [2.1.2.1. RequestAction](#2121-requestaction)
      - [2.1.2.2. ResponseAction](#2122-responseaction)
      - [2.1.2.3. RejectAction](#2123-rejectaction)
      - [2.1.2.4. Operation](#2124-operation)
  - [2.2. Model Structure](#22-model-structure)
    - [2.2.1. SModelElementSchema](#221-smodelelementschema)
      - [2.2.1.1. SModelRootSchema](#2211-smodelrootschema)
    - [2.2.2. SModelElement](#222-smodelelement)
      - [2.2.2.1. SParentElement](#2221-sparentelement)
      - [2.2.2.2. SChildElement](#2222-schildelement)
      - [2.2.2.3. SModelRoot](#2223-smodelroot)
  - [2.3. Types](#23-types)
    - [2.3.1. Args](#231-args)
    - [2.3.2. Point](#232-point)
    - [2.3.3. Dimension](#233-dimension)
    - [2.3.4. Bounds](#234-bounds)
    - [2.3.5. ElementAndBounds](#235-elementandbounds)
    - [2.3.6. ElementAndAlignment](#236-elementandalignment)
    - [2.3.7. ElementAndRoutingPoints](#237-elementandroutingpoints)
    - [2.3.8. EditorContext](#238-editorcontext)
    - [2.3.9. LabeledAction](#239-labeledaction)
  - [2.4. Session Lifecycle](#24-session-lifecycle)
    - [2.4.1. InitializeClientSessionAction](#241-initializeclientsessionaction)
    - [2.4.2. ConfigureServerHandlersAction](#242-configureserverhandlersaction)
    - [2.4.3. DisposeClientSessionAction](#243-disposeclientsessionaction)
  - [2.5. Model Data](#25-model-data)
    - [2.5.1. RequestModelAction](#251-requestmodelaction)
    - [2.5.2. SetModelAction](#252-setmodelaction)
    - [2.5.3. UpdateModelAction](#253-updatemodelaction)
    - [2.5.4. ModelSourceChangedAction](#254-modelsourcechangedaction)
  - [2.6. Model Saving](#26-model-saving)
    - [2.6.1. SaveModelAction](#261-savemodelaction)
    - [2.6.2. SetDirtyStateAction](#262-setdirtystateaction)
  - [2.7. Model Layout](#27-model-layout)
    - [2.7.1. RequestBoundsAction](#271-requestboundsaction)
    - [2.7.2. ComputedBoundsAction](#272-computedboundsaction)
    - [2.7.3. LayoutOperation](#273-layoutoperation)
  - [2.8. Model Edit Mode](#28-model-edit-mode)
    - [2.8.1. SetEditModeAction](#281-seteditmodeaction)
  - [2.9. Client-Side Actions](#29-client-side-actions)
    - [2.9.1. View Port](#291-view-port)
      - [2.9.1.1. CenterAction](#2911-centeraction)
      - [2.9.1.2. FitToScreenAction](#2912-fittoscreenaction)
    - [2.9.2. Client Notification](#292-client-notification)
      - [2.9.2.1. GLSPServerStatusAction](#2921-glspserverstatusaction)
      - [2.9.2.2. ServerMessageAction](#2922-servermessageaction)
    - [2.9.3. Element Selection](#293-element-selection)
      - [2.9.3.1. SelectAction](#2931-selectaction)
      - [2.9.3.2. SelectAllAction](#2932-selectallaction)
  - [2.10. Element Hover](#210-element-hover)
    - [2.10.1. RequestPopupModelAction](#2101-requestpopupmodelaction)
    - [2.10.2. SetPopupModelAction](#2102-setpopupmodelaction)
  - [2.11. Element Validation](#211-element-validation)
    - [2.11.1. RequestMarkersAction](#2111-requestmarkersaction)
    - [2.11.2. SetMarkersAction](#2112-setmarkersaction)
    - [2.11.3. DeleteMarkersAction](#2113-deletemarkersaction)
  - [2.12. Element Navigation](#212-element-navigation)
    - [2.12.1. RequestNavigationTargetsAction](#2121-requestnavigationtargetsaction)
    - [2.12.2. SetNavigationTargetsAction](#2122-setnavigationtargetsaction)
    - [2.12.3. NavigateToTargetAction](#2123-navigatetotargetaction)
    - [2.12.4. ResolveNavigationTargetAction](#2124-resolvenavigationtargetaction)
    - [2.12.5. SetResolvedNavigationTargetAction](#2125-setresolvednavigationtargetaction)
  - [2.13. Element Type Hints](#213-element-type-hints)
    - [2.13.1. RequestTypeHintsAction](#2131-requesttypehintsaction)
    - [2.13.2. SetTypeHintsAction](#2132-settypehintsaction)
  - [2.14. Element Creation and Deletion](#214-element-creation-and-deletion)
    - [2.14.1. CreateNodeOperation](#2141-createnodeoperation)
    - [2.14.2. CreateEdgeOperation](#2142-createedgeoperation)
    - [2.14.3. DeleteElementOperation](#2143-deleteelementoperation)
  - [2.15. Node Modification](#215-node-modification)
    - [2.15.1. ChangeBoundsOperation](#2151-changeboundsoperation)
    - [2.15.2. ChangeContainerOperation](#2152-changecontaineroperation)
  - [2.16. Edge Modification](#216-edge-modification)
    - [2.16.1. ReconnectEdgeOperation](#2161-reconnectedgeoperation)
    - [2.16.2. ChangeRoutingPointsOperation](#2162-changeroutingpointsoperation)
  - [2.17. Element Text Editing](#217-element-text-editing)
    - [2.17.1. RequestEditValidationAction](#2171-requesteditvalidationaction)
    - [2.17.2. SetEditValidationResultAction](#2172-seteditvalidationresultaction)
    - [2.17.3. ApplyLabelEditOperation](#2173-applylabeleditoperation)
  - [2.18. Clipboard](#218-clipboard)
    - [2.18.1. RequestClipboardDataAction](#2181-requestclipboarddataaction)
    - [2.18.2. SetClipboardDataAction](#2182-setclipboarddataaction)
    - [2.18.3. CutOperation](#2183-cutoperation)
    - [2.18.4. PasteOperation](#2184-pasteoperation)
  - [2.19. Undo / Redo](#219-undo--redo)
    - [2.19.1. UndoOperation](#2191-undooperation)
    - [2.19.2. RedoOperation](#2192-redooperation)
  - [2.20. Contexts](#220-contexts)
    - [2.20.1. RequestContextActions](#2201-requestcontextactions)
    - [2.20.2. SetContextActions](#2202-setcontextactions)
    - [2.20.3. Context Menu](#2203-context-menu)
    - [2.20.4. Command Palette](#2204-command-palette)
    - [2.20.5. Tool Palette](#2205-tool-palette)
      - [2.20.5.1. TriggerNodeCreationAction](#22051-triggernodecreationaction)
      - [2.20.5.2. TriggerEdgeCreationAction](#22052-triggeredgecreationaction)
</details>

# 1. Server-Client Lifecycle

The base communication between the client and server is performed using [action messages](#211-actionmessage) whereas we assume that each client connection will start their own server instance. Thus each server is only responsible for a single client.

A client implementation must consider the following interface:

<details open><summary>Code</summary>

```typescript
interface GLSPClient {
    /**
     * Unique client Id.
     */
    readonly id: string;

    /**
     * Client name.
     */
    readonly name: string;

    /**
     * Current client state.
     */
    currentState(): ClientState;

    /**
     * Initializes the client and the server connection. During the start procedure the client is in the 
     * 'Starting' state and will transition to either 'Running' or 'StartFailed'.
     */
    start(): Promise<void>;

    /**
     * Send an 'initialize' request to the server. The server needs to be initialized in order to accept 
     * and process action messages.
     *
     * @param params Initialize parameter
     * @returns true if the initialization was successful
     */
    initializeServer(params: InitializeParameters): Promise<Boolean>;

    /**
     * Send a 'shutdown' notification to the server.
     */
    shutdownServer(): void

    /**
     * Stops the client and disposes any resources. During the stop procedure the client is in the 'Stopping'
     * state and will transition to either 'Stopped' or 'ServerError'.
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

export type ActionMessageHandler = (message: ActionMessage) => void;
```
</details>

In GLSP we provide a default client implementation based on [JSON-RPC messages](https://www.jsonrpc.org/).

**Initialize Request**

On startup, a client can send an `initialize` request to the server to indicate to the server that the client is ready to connect. A client is uniquely identified by an `applicationId` and can provide custom arguments in the `options` to allow for custom initialization behavior on the server.

<details open><summary>Code</summary>

```typescript
interface InitializeParameters<> {
    /**
     * Unique identifier for the current client application.
     */
    applicationId: string;

    /**
     * Options that can include application-specific parameters.
     */
    options?: any
}
```
</details>

**Shutdown Notification**

If the client disconnects from the server, it may send a `shutdown` notification to give the server a chance to clean up any resources dedicated to the client. The shutdown request does not have any parameters as the server is already aware of the client.

**Action Messages**

Any communication that is performed between initialization and shutdown is handled by sending action messages, either from the client to the server or from the server to the client. This is the core part of the Graphical Language Server Protocol.

# 2. Graphical Language Server Protocol

The graphical language server protocol defines how the client and the server communicate and which actions are sent between them. It heavily builds on the client-server protocol defined in [Sprotty](https://github.com/eclipse/sprotty) but adds additional actions to enable editing and other capabilities. Actions that are re-used from Sprotty are marked as such in their code and we re-use their documentation where applicable. Additional information regarding the lifecycle of some action messages can be found in the [Sprotty documentation](https://github.com/eclipse/sprotty/wiki/Client-Server-Protocol).

Please note that there are several actions that are used purely on the client side. Such actions are not part of this protocol.

## 2.1. Base Protocol

The base protocol describes the structure of the messages that are sent between the server and the client. 

### 2.1.1. ActionMessage

A general message serves as an envelope carrying an action to be transmitted between the client and the server via a DiagramServer.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ActionMessage.
 */
class ActionMessage {
    /**
     * Used to identify a specific client session.
     */
    public readonly clientId: string;

    /**
     * The action to execute.
     */
    public readonly action: Action;
}
```
</details>

### 2.1.2. Action

An action is a declarative description of a behavior that shall be invoked by the receiver upon receipt of the action. It is a plain data structure, and as such transferable between server and client. Actions contained in action messages are identified by their `kind` attribute. This attribute is required for all actions. Certain actions are meant to be sent from the client to the server or vice versa, while other actions can be sent both ways, by the client or the server. All actions must extend the default action interface. 

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's Action.
 */
interface Action {
    /**
     * Unique identifier specifying the kind of action to process.
     */
    readonly kind: string;
}
```
</details>

#### 2.1.2.1. RequestAction

A request action is tied to the expectation of receiving a corresponding response action. The `requestId` property is used to match the received response with the original request.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestAction.
 */
interface RequestAction<Res extends ResponseAction> extends Action {
    /**
     * Unique id for this request. In order to match a response to this request, the response needs to have the same id.
     */
    readonly requestId: string
}
```
</details>

#### 2.1.2.2. ResponseAction

A response action is sent to respond to a request action. The `responseId` must match the `requestId` of the preceding request. In case the `responseId` is empty or undefined, the action is handled as standalone, i.e. it was fired without a preceding request.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ResponseAction.
 */
interface ResponseAction extends Action {
    /**
     * Id corresponding to the request this action responds to.
     */
    readonly responseId: string
}    
```
</details>

#### 2.1.2.3. RejectAction

A reject action is a response fired to indicate that a request must be rejected.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RejectAction.
 */
class RejectAction implements ResponseAction {
    readonly kind = "rejectRequest";
}   
```
</details>

#### 2.1.2.4. Operation

Operations are actions that denote requests from the client to _modify_ the model. Model modifications are always performed by the server. After a successful modification, the server sends the updated model back to the client using the [`UpdateModelAction`](#253-updatemodelaction).

<details open><summary>Code</summary>

```typescript
/**
 * Marker interface for operations.
 */
interface Operation extends Action { }

/**
 * An operation that executes a list of operations.
 */
class CompoundOperation implements Operation {
    readonly kind = "compound";

    /**
     * List of operations that should be executed.
     */
    operationList: Operation[];
}
```
</details>

## 2.2. Model Structure

The basic structure in Sprotty is called an `SModel`. Such a model consists of `SModelElements` conforming to an `SModelElementSchema`.

Based on those classes Sprotty already defines a graph-like model called `SGraph` conforming to the `SGraphSchema`. This graph consists nodes, edges, compartments, labels, and ports.

### 2.2.1. SModelElementSchema

The schema of an `SModelElement` describes its serializable form. The actual model is created from its schema with an `IModelFactory`. Each model element must have a unique ID and a type that is used to look up its view, i.e., the graphical representation.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SModelElementSchema.
 */
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

Serializable schema for the root element of the model tree. Usually actions refer to elements in the graphical model via an `elementId`. However, a few actions actually need to transfer the graphical model. In such cases, the graphical model needs to be represented as a serializable `SModelRootSchema`.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SModelRootSchema.
 */
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

All elements of the diagram model inherit from base class `SModelElement`. Each model element must have a unique ID and a type that is used to look up its view. Additionally, each element provides access to its root element and holds an index to speed up the model element lookup.

Each model element has a set of features. A feature is a symbol identifying some functionality that can be enabled or disabled for a model element, e.g. a `resizeFeature`. The set of supported features is determined by the `features` property.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SModelElement.
 */
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
/**
 * Sprotty's SParentElement.
 */
class SParentElement extends SModelElement {
    /**
     * Children of this element.
     */
    readonly children: ReadonlyArray<SChildElement>;
}
```
</details>

#### 2.2.2.2. SChildElement

A child element is contained in a parent element. All elements except the model root are child elements. In order to keep the model class hierarchy simple, every child element is also a parent element, although for many elements the array of children is empty (i.e. they are leafs in the model element tree).

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SChildElement.
 */
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
/**
 * Sprotty's SModelRoot.
 */
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
/**
 * Sprotty's Point.
 */
class Point {
    /**
     * The abscissa of the point.
     */
    public readonly x: number;

    /**
     * The ordinate of the point.
     */
    public readonly y: number;
}
```
</details>

### 2.3.3. Dimension

The `Dimension` of an object is composed of its width and height.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's Dimension.
 */
class Dimension {
    /**
     * The width of an element.
     */
    public readonly width: number;

    /**
     * the height of an element.
     */
    public readonly height: number;
}
```
</details>

### 2.3.4. Bounds

The bounds are the position (x, y) and dimension (width, height) of an object. As such the `Bounds` type extends both `Point` and `Dimension`.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's Bounds.
 */
class Bounds extends Point, Dimension {
}
```
</details>

### 2.3.5. ElementAndBounds

The `ElementAndBounds` type is used to associate new bounds with a model element, which is referenced via its id.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ElementAndBounds.
 */
class ElementAndBounds {
    /**
     * The identifier of the element.
     */
    public readonly elementId: string;

    /**
     * The new bounds of the element.
     */
    public readonly newBounds: Bounds;
}
```
</details>

### 2.3.6. ElementAndAlignment

The `ElementAndAlignment` type is used to associate a new alignment with a model element, which is referenced via its id.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ElementAndAlignment.
 */
class ElementAndAlignment {
    /**
     * The identifier of an element.
     */
    public readonly elementId: string;

    /**
     * The new alignment of the element.
     */
    public readonly newAlignment: Point;
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
    elementId: string

    /**
     * The new list of routing points.
     */
    newRoutingPoints?: Point[];
}
```
</details>


### 2.3.8. EditorContext

The `EditorContext` may be used to represent the current state of the editor for particular actions. It encompasses the last recorded mouse position, the list of selected elements, and may contain custom arguments to encode additional state information.

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
/**
 * Sprotty's LabeledAction.
 */
class LabeledAction {
    /**
     * Group label.
     */
    readonly label: string;

    /**
     * Actions in the group.
     */
    readonly actions: Action[];

    /**
     * Optional group icon.
     */    
    readonly icon?: string;
}   
```
</details>

## 2.4. Session Lifecycle

Each individual diagram that has been opened on the client side counts as a single session that is managed by the server. Each diagram session is identified through a unique `clientId`.

### 2.4.1. InitializeClientSessionAction

Initialize a new session. One client may open several sessions. Each session is associated to a unique clientId. The session is used to track the client lifecycle: it should be the first action sent by a client to the server. The server will then be able to dispose any resources associated to this client when either:
- the client disconnects
- the client sends a `DisposeClientSessionAction`

<details open><summary>Code</summary>

```typescript
class InitializeClientSessionAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "initializeClientSession";

    /**
     * Unique client id to identify the diagram session.
     */
    readonly clientId: string;
}
```
</details>

### 2.4.2. ConfigureServerHandlersAction

Sent by the server after `InitializeClientSessionAction` to indicate all the action kinds that the server can handle.

<details open><summary>Code</summary>

```typescript
class ConfigureServerHandlersAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "configureServerHandlers";

    /**
     * A list of actions the server can handle.
     */
    readonly actionKinds: string[];
}
```
</details>

### 2.4.3. DisposeClientSessionAction

Sent to the server if the graphical representation (diagram) for a specific client session is no longer needed. e.g. the tab containing the diagram widget has been closed.

<details open><summary>Code</summary>

```typescript
class DisposeClientSessionAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "disposeClientSession";

    /**
     * Id to identify the diagram session that should be disposed.
     */
    readonly clientId: string;
}
```
</details>

## 2.5. Model Data

### 2.5.1. RequestModelAction

Sent from the client to the server in order to request a graphical model. Usually this is the first message that is sent from the client to the server, so it is also used to initiate the communication. The response is a `SetModelAction` or an `UpdateModelAction`.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestModelAction.
 */
class RequestModelAction implements Action {
  /**
   * The kind of the action.
   */
  public readonly kind = "requestModel";

  /**
   * Additional options used to compute the graphical model.
   */
  public readonly options?: { [key: string]: string });
}
```
</details>

### 2.5.2. SetModelAction

Sent from the server to the client in order to set the model. If a model is already present, it is replaced.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SetModelAction.
 */
class SetModelAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setModel";

    /**
     * The new graphical model elements.
     */
    public readonly newRoot: SModelRootSchema;
}
```
</details>


### 2.5.3. UpdateModelAction

Sent from the server to the client in order to update the model. If no model is present yet, this behaves the same as a `SetModelAction`. The transition from the old model to the new one can be animated.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's UpdateModelAction.
 */
class UpdateModelAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "updateModel";

    /**
     * The new root element of the graphical model.
     */
    public readonly newRoot?: SModelRootSchema;

    /**
     * Matches that link the elements of two root elements.
     */
    public readonly matches?: Match[];
}

/**
 * Sprotty's Match.
 */
interface Match {
    left?: SModelElementSchema
    right?: SModelElementSchema
    leftParentId?: string
    rightParentId?: string
}
```
</details>

### 2.5.4. ModelSourceChangedAction

Sent from the server to the client in order to indicate that the model source has changed. The model source denotes the data source from which the diagram has been originally derived (such as a file, a database, etc.). Typically clients would react to such an action by asking the user whether she wants to reload the diagram or ingore the changes and continue editing. If the editor has no changes (i.e. is not dirty), clients may also choose to directly refresh the editor by sending a [RequestModelAction](#251-requestmodelaction).

<details open><summary>Code</summary>

```typescript
class ModelSourceChangedAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "modelSourceChanged";

    /**
     * A human readable name of the model source (e.g. the file name).
     */
    public readonly modelSourceName: string;
}
```
</details>

## 2.6. Model Saving

### 2.6.1. SaveModelAction

Sent from the client to the server in order to persist the current model state back to the model source.

<details open><summary>Code</summary>

```typescript
class SaveModelAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "saveModel";
}
```
</details>

### 2.6.2. SetDirtyStateAction

The server sends a `SetDirtyStateAction` to indicate to the client that the current model state on the server does not correspond to the persisted model state of the model source. A client may ignore such an action or use it to indicate to the user the dirty state. 

<details open><summary>Code</summary>

```typescript
class SetDirtyStateAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setDirtyState";

    /**
     * True if the current model state is dirty
     */
    public readonly isDirty: boolean
}
```
</details>

## 2.7. Model Layout

In GLSP the server usually controls the model's layout by applying bounds to all elements and sending an updated model to the client ([SetModelAction](#252-setmodelaction), [UpdateModelAction](#253-updatemodelaction)). However, calculating the correct bounds of each element may not be straight-forward as it may depend on certain client-side rendering properties, such as label size.

On the client-side Sprotty calculates the layout on two levels: The `Micro Layout` is responsible to layout a single element with all its labels, icons, compartments in a horizontal box, vertical box, or other layout containers. The `Macro Layout` is responsible for layouting the network of nodes and edges on the canvas. If a server needs information from the micro layout, it can send a `RequestBoundsAction` to the client who will respond with a `ComputedBoundsAction` containing all elements and their bounds.

### 2.7.1. RequestBoundsAction

Sent from the server to the client to request bounds for the given model. The model is rendered invisibly so the bounds can derived from the DOM. The response is a `ComputedBoundsAction`. This hidden rendering round-trip is necessary if the client is responsible for parts of the layout.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestBoundsAction.
 */
class RequestBoundsAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestBounds";

    /**
     * The model elements to consider to compute the new bounds.
     */
    public readonly newRoot: SModelRootSchema;
}
```
</details>

### 2.7.2. ComputedBoundsAction

Sent from the client to the server to transmit the result of bounds computation as a response to a `RequestBoundsAction`. If the server is responsible for parts of the layout, it can do so after applying the computed bounds received with this action. Otherwise there is no need to send the computed bounds to the server, so they can be processed locally by the client.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's ComputedBoundsAction.
 */
class ComputedBoundsAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "computedBounds";

    /**
     * The new bounds of the model elements.
     */
    public readonly bounds: ElementAndBounds[];

    /*
     * The revision number.
     */
    public readonly revision?: number;

    /**
     * The new alignment of the model elements.
     */
    public readonly alignments?: ElementAndAlignment[];
}
```
</details>

### 2.7.3. LayoutOperation

Request a layout of the diagram or selected elements from the server.

<details open><summary>Code</summary>

```typescript
/**
 * Layout Operation based on Sprotty's LayoutAction.
 */
class LayoutOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "layout";

    /**
     * The layout type.
     */
    public readonly layoutType: string;

    /**
     * The identifiers of the elements that should be layouted, may be just the root element.
     */
    public readonly elementIds: string[];
}
```
</details>

## 2.8. Model Edit Mode

GLSP supports setting the model into different edit modes. We pre-define two such modes: `readonly` and `editable`. However these modes can be customized as need be.

### 2.8.1. SetEditModeAction

Sent from the client to the server to set the model into a specific editor mode, allowing the server to react to certain requests differently depending on the mode. A client may also listen to this action to prevent certain user interactions preemptively.

<details open><summary>Code</summary>

```typescript
class SetEditModeAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setEditMode";

    /**
     * The new edit mode of the diagram.
     */
    public readonly editMode: string;
}
```
</details>

## 2.9. Client-Side Actions

There are several actions that are issued and processed on the client to manipulate the view port, select elements, etc. Those actions may also be sent by the server to trigger the respective client behavior. Please note that we only list actions here that are actually used by the current default implementation of the GLSP server.

### 2.9.1. View Port

View port actions manipulate the viewport on the client-side and may be sent from the server to highlight changes or improve general usability.

#### 2.9.1.1. CenterAction

Centers the viewport on the elements with the given identifiers. It changes the scroll setting of the viewport accordingly and resets the zoom to its default. This action can also be created on the client but it can also be sent by the server in order to perform such a viewport change remotely.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's CenterAction.
 */
class CenterAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "center";

    /**
     * The identifier of the elements on which the viewport should be centered.
     */
    public readonly elementIds: string[];

    /**
     * Indicate if the modification of the viewport should be realized with or without support of animations.
     */
    public readonly animate: boolean = true;

    /**
     * Indicates whether the zoom level should be kept.
     */
    public readonly retainZoom: boolean = false;
}
```
</details>

#### 2.9.1.2. FitToScreenAction

Triggers to fit all or a list of elements into the available drawing area. The resulting fit-to-screen command changes the zoom and scroll settings of the viewport so the model can be shown completely. This action can also be sent from the server to the client in order to perform such a viewport change programmatically.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's FitToScreenAction.
 */
class FitToScreenAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "fit";

    /**
     * The identifier of the elements to fit on screen.
     */
    public readonly elementIds: string[];

    /**
     * The padding that should be visible on the viewport.
     */
    public readonly padding?: number;

    /**
     * The max zoom level authorized.
     */
    public readonly maxZoom?: number;

    /**
     * Indicate if the action should be performed with animation support or not.
     */
    public readonly animate: boolean = true;
}
```
</details>

### 2.9.2. Client Notification

In GLSP we distinguish between a status and a message which may be displayed differently on the client. For instance, in the Theia Integration status updates are shown directly on the diagram as an overlay whereas messages are shown in separate message popups.

#### 2.9.2.1. GLSPServerStatusAction

This action is typically sent by the server to signal a state change. This action extends the corresponding Sprotty action to include a timeout. If a timeout is given the respective status should disappear after the timeout is reached.

<details open><summary>Code</summary>

```typescript
/**
 * Based on Sprotty's ServerStatusAction but extended with a timeout.
 */
class GLSPServerStatusAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "serverStatus";

    /**
     * The severity of the status.
     */
    public readonly severity: string;

    /**
     * The message describing the status.
     */
    public readonly message: string;

    /**
     * Timeout after which a displayed status disappears.
     */
    public timeout: number = 1;
}
```
</details>

#### 2.9.2.2. ServerMessageAction

This action is typically sent by the server to notify the user about something of interest. 

<details open><summary>Code</summary>

```typescript
class ServerMessageAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "serverMessage";

    /**
     * The severity of the message.
     */
    severity: 'NONE' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';

    /**
     * The message text.
     */
    message: string;

    /**
     * Further details on the message.
     */
    details: string = '';

    /**
     * Timeout after which a displayed message disappears.
     */
    timeout: number = -1;
}
```
</details>

### 2.9.3. Element Selection

#### 2.9.3.1. SelectAction

Triggered when the user changes the selection, e.g. by clicking on a selectable element. The action should trigger a change in the `selected` state accordingly, so the elements can be rendered differently. The server can send such an action to the client in order to change the selection remotely.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SelectAction.
 */
class SelectAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "elementSelected";

    /**
     * The identifier of the elements to mark as selected.
     */
    public readonly selectedElementsIds: string[] = [];

    /**
     * The identifier of the elements to mark as not selected.
     */
    public readonly deselectedElementsIds: string[] = [];
}
```
</details>

#### 2.9.3.2. SelectAllAction

Used for selecting or deselecting all elements.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SelectAllAction.
 */
class SelectAllAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "allSelected";

    /**
     * If `select` is true, all elements are selected, otherwise they are deselected.
     */
    public readonly select: boolean = true;
}
```
</details>

## 2.10. Element Hover

### 2.10.1. RequestPopupModelAction

Triggered when the user hovers the mouse pointer over an element to get a popup with details on that element. This action is sent from the client to the server. The response is a `SetPopupModelAction`.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's RequestPopupModelAction.
 */
class RequestPopupModelAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestPopupModel";

    /**
     * The identifier of the elements for which a popup is requested.
     */
    public readonly elementId: string;

    /**
     * The bounds.
     */
    public readonly bounds: Bounds;
}
```
</details>

### 2.10.2. SetPopupModelAction

Sent from the server to the client to display a popup in response to a `RequestPopupModelAction`. This action can also be used to remove any existing popup by choosing `EMPTY_ROOT` as root element.

<details open><summary>Code</summary>

```typescript
/**
 * Sprotty's SetPopupModelAction.
 */
class SetPopupModelAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setPopupModel";

    /**
     * The model elements composing the popup to display.
     */
    public readonly newRoot: SModelRootSchema;
}
```
</details>

## 2.11. Element Validation

Validation in GLSP is performed by using validation markers. A marker represents the validation result for a single model element:

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

### 2.11.1. RequestMarkersAction

Action to retrieve markers for the specified model elements. Sent from the client to the server.

<details open><summary>Code</summary>

```typescript
class RequestMarkersAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestMarkers";

    /**
     * The elements for which markers are requested, may be just the root element.
     */
    public readonly elementsIDs: string[];
}
```
</details>

### 2.11.2. SetMarkersAction

Response to the `RequestMarkersAction` containing all validation markers. Sent from the server to the client.

<details open><summary>Code</summary>

```typescript
class SetMarkersAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setMarkers";

    /**
     * The list of markers that has been requested by the `RequestMarkersAction`.
     */
    public readonly markers: Marker[];
}
```
</details>

### 2.11.3. DeleteMarkersAction

To remove markers for elements a client or server may send a `DeleteMarkersAction` with all markers that should be removed.

<details open><summary>Code</summary>

```typescript
class DeleteMarkersAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "deleteMarkers";

    /**
     * The list of markers that should be deleted.
     */
    public readonly markers: Marker[];
}
```
</details>

## 2.12. Element Navigation

GLSP makes no assumption about the type of navigation a user may want to perform. Thus a generic infrastructure is provided that the client and server can use to implement specific navigation types, e.g., navigation to documentation, implementation, etc. The type of navigation is identified by the `targetTypeId`.

A client may request the targets for a specific type of navigation by querying the server to which the server will respond with a set of navigation targets. A `NavigationTarget` identifies the object we want to navigate to via its uri and may further provide a label to display for the client. Additionally, generic arguments may be used to to encode any domain- or navigation type-specific information.

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

### 2.12.1. RequestNavigationTargetsAction

Action that is usually sent from the client to the server to request navigation targets for a specific navigation type such as `documentation` or `implementation` in the given editor context.

<details open><summary>Code</summary>

```typescript
class RequestNavigationTargetsAction implements RequestAction<SetNavigationTargetsAction> {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestNavigationTargets";

    /**
     * Identifier of the type of navigation targets we want to retrieve, e.g., 'documentation', 'implementation', etc.
     */
    public readonly targetTypeId: string;

    /**
     * The current editor context.
     */
    public readonly editorContext: EditorContext;
}
```
</details>

### 2.12.2. SetNavigationTargetsAction

Response action from the server following a `RequestNavigationTargetsAction`. It contains all available navigation targets for the queried target type in the provided editor context. The server may also provide additional information using the arguments, e.g., warnings, that can be interpreted by the client.

<details open><summary>Code</summary>

```typescript
class SetNavigationTargetsAction implements ResponseAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "setNavigationTargets";

    /**
     * A list of navigation targets.
     */
    public readonly targets: NavigationTarget[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    public readonly args?: Args;
}
```
</details>

### 2.12.3. NavigateToTargetAction

Action that triggers the navigation to a particular navigation target. This may be used by the client internally or may be sent from the server.

<details open><summary>Code</summary>

```typescript
class NavigateToTargetAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "navigateToTarget";

    /**
     * The target to which we navigate.
     */
    public readonly target: NavigationTarget;
}
```
</details>

### 2.12.4. ResolveNavigationTargetAction

If a client cannot navigate to a target directly, a `ResolveNavigationTargetAction` may be sent to the server to resolve the navigation target to one or more model elements. This may be useful in cases where the resolution of each target is expensive or the client architecture requires an indirection.

<details open><summary>Code</summary>

```typescript
class ResolveNavigationTargetAction implements RequestAction<SetResolvedNavigationTargetAction> {
    /**
     * The kind of the action.
     */
    public readonly kind = "resolveNavigationTarget";

    /**
     * The navigation target to resolve.
     */
    public readonly navigationTarget: NavigationTarget;
}
```
</details>

### 2.12.5. SetResolvedNavigationTargetAction

An action sent from the server in response to a `ResolveNavigationTargetAction`. The response contains the resolved element ids for the given target and may contain additional information in the `args` property.

<details open><summary>Code</summary>

```typescript
class SetResolvedNavigationTargetAction implements ResponseAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "setResolvedNavigationTarget";

    /**
     * The element ids of the resolved navigation target.
     */
    public readonly elementIds: string[];

    /**
     * Custom arguments that may be interpreted by the client.
     */
    public readonly args?: Args;
}
```
</details>

## 2.13. Element Type Hints

Type hints are used to define what modifications are supported on the different element types. Conceptually type hints are similar to `features` of a model elements but define the functionality on a type level. The rationale is to avoid a client-server round-trip for user feedback of each synchronous user interaction.

In GLSP we distinguish between `NodeTypeHints` and `EdgeTypeHints`. These hints specify whether an element can be resized, relocated and/or deleted. Optionally, they specify a list of element types that can be contained/connected by this element.

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

interface NodeTypeHint extends TypeHint {
    /**
     * Specifies whether the element can be resized.
     */
    readonly resizable: boolean;

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

### 2.13.1. RequestTypeHintsAction

Sent from the client to the server in order to request hints on whether certain modifications are allowed for a specific element type. The `RequestTypeHintsAction` is optional, but should usually be among the first messages sent from the client to the server after receiving the model via `RequestModelAction`. The response is a `SetTypeHintsAction`.

<details open><summary>Code</summary>

```typescript
class RequestTypeHintsAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestTypeHints";
}
```
</details>

### 2.13.2. SetTypeHintsAction

Sent from the server to the client in order to provide hints certain modifications are allowed for a specific element type. 

<details open><summary>Code</summary>

```typescript
class SetTypeHintsAction implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "setTypeHints";

    /**
     * The hints for node types.
     */
    public readonly nodeHints: NodeTypeHint[];

    /**
     * The hints for edge types.
     */
    public readonly edgeHints: EdgeTypeHint[];
}
```
</details>

## 2.14. Element Creation and Deletion

### 2.14.1. CreateNodeOperation

<details open><summary>Code</summary>

In order to create a node in the model the client can send a `CreateNodeOperation` with the necessary information to create that node.

```typescript
class CreateNodeOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "createNode";

    /**
     * The type of the element to be created.
     */
    public readonly elementTypeId: string;

    /*
     * The location at which the operation shall be executed.
     */
    public readonly location?: Point;

    /*
     * The container in which the operation shall be executed.
     */
    public readonly containerId?: string;

    /*
     * Additional arguments for custom behavior.
     */
    public readonly args?: Args;
}
```
</details>

### 2.14.2. CreateEdgeOperation

In order to create an edge in the model the client can send a `CreateEdgeOperation` with the necessary information to create that edge.

<details open><summary>Code</summary>

```typescript
class CreateEdgeOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "createEdge";

    /**
     * The type of the element to be created.
     */
    public readonly elementTypeId: string;

    /*
     * The source element.
     */
    public readonly sourceElementId: string;

    /*
     * The target element.
     */
    public readonly targetElementId: string;

    /*
     * Additional arguments for custom behavior.
     */
    public readonly args?: Args;
}
```
</details>

### 2.14.3. DeleteElementOperation

The client sends a `DeleteElementOperation` to the server to request the deletion of an element from the model.

<details open><summary>Code</summary>

```typescript
class DeleteElementOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "deleteElement";

    /**
     * The elements to be deleted.
     */
    public readonly elementIds: string[];
}
```
</details>

## 2.15. Node Modification

### 2.15.1. ChangeBoundsOperation

Triggers the position or size change of elements. This action concerns only the element's graphical size and position. Whether an element can be resized or repositioned may be specified by the server with a [`TypeHint`](#213-element-type-hints) to allow for immediate user feedback before resizing or repositioning.

<details open><summary>Code</summary>

```typescript
class ChangeBoundsOperation implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "changeBounds";

    /**
     * The new bounds of the respective elements.
     */
    public readonly newBounds: ElementAndBounds[];
}
```
</details>

### 2.15.2. ChangeContainerOperation

The client sends a `ChangeContainerOperation` to the server to request the execution of a `changeContainer` operation.

<details open><summary>Code</summary>

```typescript
class ChangeContainerOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "changeContainer";

    /**
     * The element to be changed.
     */
    public readonly elementId: string;

    /**
     * The element container of the changeContainer operation.
     */
    public readonly targetContainerId: string;

    /**
     * The graphical location.
     */
    public readonly location?: string;
}
```
</details>

## 2.16. Edge Modification

### 2.16.1. ReconnectEdgeOperation

If the source and/or target element of an edge should be adapted, the client can send a `ReconnectEdgeOperation` to the server.

<details open><summary>Code</summary>

```typescript
class ReconnectEdgeOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "reconnectEdge";

    /**
     * The edge element that should be reconnected.
     */
    public readonly edgeElementId: string;

    /**
     * The (new) source element of the edge.
     */
    public readonly sourceElementId: string;

    /**
     * The (new) target element of the edge.
     */
    public readonly targetElementId: string;
}
```
</details>

### 2.16.2. ChangeRoutingPointsOperation

An edge may have zero or more routing points that "re-direct" the edge between the source and the target element. In order to set these routing points the client may send a `ChangeRoutingPointsOperation`.

<details open><summary>Code</summary>

```typescript
class ChangeRoutingPointsOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "changeRoutingPoints";

    /**
     * The routing points of the edge (may be empty).
     */
    public readonly newRoutingPoints: ElementAndRoutingPoints[];
}
```
</details>

## 2.17. Element Text Editing

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
    enum Severity { FATAL, ERROR, WARNING, INFO, OK, NONE }
}
```
</details>

### 2.17.1. RequestEditValidationAction

Requests the validation of the given text in the context of the provided model element. Typically sent from the client to the server.

<details open><summary>Code</summary>

```typescript
class RequestEditValidationAction implements RequestAction<SetEditValidationResultAction> {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestEditValidation";

    /**
     * Context in which the text is validated, e.g., 'label-edit'.
     */
    public readonly contextId: string;

    /**
     * Model element that is being edited.
     */
    public readonly modelElementId: string;

    /**
     * Text that should be considered for the model element.
     */
    public readonly text: string;
}
```
</details>

### 2.17.2. SetEditValidationResultAction

Response to a `RequestEditValidationAction` containing the validation result for applying a text on a certain model element.

<details open><summary>Code</summary>

```typescript
class SetEditValidationResultAction implements ResponseAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "setEditValidationResult";

    /**
     * Validation status.
     */
    public readonly status: ValidationStatus;

    /*
     * Additional arguments for custom behavior.
     */
    public readonly args?: Args;
}
```
</details>

### 2.17.3. ApplyLabelEditOperation

A very common use case in domain models is the support of labels that display textual information to the user. For instance, the `SGraph` model of Sprotty has support for labels that can be attached to a node, edge, or port, and that contain some text that is rendered in the view. To apply new text to such a label element the client may send an `ApplyLabelEditOperation` to the server.

<details open><summary>Code</summary>

```typescript
class ApplyLabelEditOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "applyLabelEdit";

    /**
     * Identifier of the label model element.
     */
    public readonly labelId: string;

    /**
     * Text that should be applied on the label.
     */
    public readonly text: string;
}
```
</details>

## 2.18. Clipboard

In GLSP the clipboard needs to be managed by the client but the conversion from the selection to be copied into a clipboard-compatible format is handled by the server. By default, GLSP use `application/json` as exchange format.

<details open><summary>Code</summary>

```typescript
type ClipboardData = { [format: string]: string };
```
</details>

### 2.18.1. RequestClipboardDataAction

Requests the clipboard data for the current editor context, i.e., the selected elements, in a clipboard-compatible format.

<details open><summary>Code</summary>

```typescript
class RequestClipboardDataAction implements RequestAction<SetClipboardDataAction> {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestClipboardData";

    /**
     * The current editor context.
     */
    public readonly editorContext: EditorContext;
}
```
</details>

### 2.18.2. SetClipboardDataAction

Server response to a `RequestClipboardDataAction` containing the selected elements as clipboard-compatible format.

<details open><summary>Code</summary>

```typescript
class SetClipboardDataAction implements RequestAction<SetClipboardDataAction> {
    /**
     * The kind of the action.
     */
    public readonly kind = "setClipboardData";

    /**
     * The selected elements from the editor context as clipboard data.
     */
    public readonly clipboardData: ClipboardData;
}
```
</details>

### 2.18.3. CutOperation

Requests a cut operation from the server, i.e., deleting the selected elements from the model. Before submitting a `CutOperation` a client should ensure that the cut elements are put into the clipboard.

<details open><summary>Code</summary>

```typescript
class CutOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "cut";

    /**
     * The current editor context.
     */
    public readonly editorContext: EditorContext;
}
```
</details>

### 2.18.4. PasteOperation

Requests a paste operation from the server by providing the current clipboard data. Typically this means that elements should be created based on the data in the clipboard.

<details open><summary>Code</summary>

```typescript
class PasteOperation implements Operation {
    /**
     * The kind of the action.
     */
    public readonly kind = "paste";

    /**
     * The current editor context.
     */
    public readonly editorContext: EditorContext;

    /**
     * The clipboard data that should be pasted to the editor's last recorded mouse position (see `editorContext`).
     */
    public readonly clipboardData: ClipboardData;
}
```
</details>


## 2.19. Undo / Redo

A server usually keeps a command stack of all commands executed on the model. To navigate the command stack the following actions can be used.

### 2.19.1. UndoOperation

Trigger an undo of the latest executed command.

<details open><summary>Code</summary>

```typescript
class UndoOperation implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "glspUndo";
}
```
</details>

### 2.19.2. RedoOperation

Trigger a redo of the latest undone command.

<details open><summary>Code</summary>

```typescript
class RedoOperation implements Action {
    /**
     * The kind of the action.
     */
    public readonly kind = "glspRedo";
}
```
</details>

## 2.20. Contexts

A context is a dedicated space in the client that is identified via a unique id. Context actions are a specific set of actions that are available in that context id. At the moment we support three such contexts:
- The Context Menu with the context id `context-menu`
- The Command Palette with the context id `command-palette`
- The Tool Palette with the context id `tool-palette`

### 2.20.1. RequestContextActions

<details open><summary>Code</summary>

The RequestContextActions is sent from the client to the server to request the available actions for the context with id `contextId`.

```typescript
class RequestContextActions implements RequestAction<SetContextActions> {
    /**
     * The kind of the action.
     */
    public readonly kind = "requestContextActions";

    /**
     * The identifier for the context.
     */
    public readonly contextId: string;

    /**
     * The current editor context.
     */
    public readonly editorContext: EditorContext;
}
```
</details>

### 2.20.2. SetContextActions

The `SetContextActions` is the response to a `RequestContextActions` containing all actions for the queried context.

<details open><summary>Code</summary>

```typescript
class SetContextActions implements ResponseAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "setContextActions";

    /**
     * The actions available in the queried context.
     */
    public readonly actions: LabeledAction[];

    /**
     * Custom arguments.
     */
    public readonly args: Args?;
}
```
</details>

### 2.20.3. Context Menu

The context menu is an overlay that is triggered by a right click from the user. The menu may be filled with actions from the client but may also be filled with actions from the server. If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `context-menu` and handle the returned actions from the `SetContextActions` response accordingly, e.g., rendering them in a context menu.

### 2.20.4. Command Palette

The command palette is an "auto-complete" widget that is triggered when the user hits `Ctrl+Space`. The menu may be filled with actions from the client but may also be filled with actions from the server. If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `command-palette` and handle the returned actions from the `SetContextActions` response accordingly, i.e., rendering them in a auto-complete widget.

### 2.20.5. Tool Palette

The tool palette is a widget on the graph's canvas that displays a set of tools and actions that the user can use to interact with the model. As such the tool palette consists of two parts: tools and labeled actions. 

A tool is a uniquely identified functionality that can be either enabled or disabled. Tools can be activated and de-activated from the user by clicking their rendered representation in the platte or may be activated using dedicated actions.
 
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
- Default Tool (Selection Tool)
- Mouse Delete Tool
- Validation Tool

The supported actions of the tool palette come from the server. If server actions are to be used, the client needs to send a `RequestContextActions` action with context id `tool-palette` and handle the returned actions from the `SetContextActions` response accordingly, e.g., rendering them in the tool palette. A user may click on any of the entries in the tool palette to trigger the corresponding action.

For creating new elements we provide two dedicated trigger actions that can be sent from the server to activate and configure the `Node Creation Tool` or the `Edge Creation Tool` respectively. This indirection is necessary as the user, after clicking on the respective action, still needs to provide additional information, i.e., the location of the new node or which elements should be connected through an edge. After all information is available, the actual creation operation is triggered.

#### 2.20.5.1. TriggerNodeCreationAction

Triggers the enablement of the tool that is responsible for creating nodes and initializes it with the creation of nodes of the given `elementTypeId`.

<details open><summary>Code</summary>

```typescript
class TriggerNodeCreationAction extends TriggerElementCreationAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "triggerNodeCreation";

    /**
     * The type of node that should be created by the node creation tool.
     */
    public readonly elementTypeId: string;

    /**
     * Custom arguments.
     */
    public readonly args?: Args;
}
```
</details>

#### 2.20.5.2. TriggerEdgeCreationAction

Triggers the enablement of the tool that is responsible for creating edges and initializes it with the creation of edges of the given `elementTypeId`.

<details open><summary>Code</summary>

```typescript
class TriggerEdgeCreationAction extends TriggerElementCreationAction {
    /**
     * The kind of the action.
     */
    public readonly kind = "triggerEdgeCreation";

    /**
     * The type of edge that should be created by the edge creation tool.
     */
    public readonly elementTypeId: string;

    /**
     * Custom arguments.
     */
    public readonly args?: Args;
}
```
</details>
