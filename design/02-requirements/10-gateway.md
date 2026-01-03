# Gateway - Functional Requirements

> **Component ID**: COMP-010
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Draft
> **Owner**: FlowMaster Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)
> - [Gateway Interface Contract](../integration/contracts/12-gateway.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **Gateway** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

### 1.2 Component Summary

| Attribute                      | Value                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Component ID**               | COMP-010                                                                                                           |
| **Responsibility**             | Unified API surface for UI components, request routing, event streaming, request validation, transport abstraction |
| **Implements HL Requirements** | HL-GW-001, HL-GW-002, HL-GW-003, HL-GW-004, HL-GW-005, HL-GW-006                                                   |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-GW-XXX**

| Component | Prefix | Example   |
| --------- | ------ | --------- |
| Gateway   | FR-GW  | FR-GW-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.5 Document Organization

> **Note**: FlowMaster follows a **desktop-first** development approach. The Electron desktop application is the primary interface, using IPC for communication between the renderer (React UI) and main process (Gateway + Core). HTTP/WebSocket transport supports browser-based access for local server mode. CLI support will be added in a later phase for CI/CD automation.

This document follows progressive disclosure principles, organized from foundational concepts to advanced features:

1. **Request Routing** - Core routing functionality
2. **Event Streaming** - Real-time event delivery to UI
3. **Validation** - Request validation before routing
4. **Transport** - Transport abstraction (IPC for desktop, HTTP/WebSocket for browser, in-process for CLI)
5. **Error Handling** - Error propagation and timeout handling
6. **Logging** - Configurable logging

---

## 2. Functional Requirements

### 2.1 Request Routing

These requirements define how Gateway routes requests to backend components.

---

#### FR-GW-001: Route Execution Requests to Orchestrator

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL route execution requests (start, pause, resume, cancel) to the Orchestrator component so that UI can control workflow execution.

**Acceptance Criteria**:

```gherkin
Scenario: Route start workflow request
  Given a valid start workflow request
  When Gateway receives the request
  Then it should forward the request to Orchestrator.startWorkflow
  And return the Orchestrator response unchanged

Scenario: Route pause execution request
  Given a valid pause execution request
  When Gateway receives the request
  Then it should forward the request to Orchestrator.pauseWorkflow
  And return the Orchestrator response unchanged

Scenario: Route resume execution request
  Given a valid resume execution request
  When Gateway receives the request
  Then it should forward the request to Orchestrator.resumeWorkflow
  And return the Orchestrator response unchanged

Scenario: Route cancel execution request
  Given a valid cancel execution request
  When Gateway receives the request
  Then it should forward the request to Orchestrator.cancelWorkflow
  And return the Orchestrator response unchanged
```

**Rationale**:
Gateway acts as a routing layer between UI and Orchestrator for all execution control operations.

---

#### FR-GW-002: Route Task Requests to Task Manager

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL route task requests (get, search) to the Task Manager component so that UI can access task information.

**Acceptance Criteria**:

```gherkin
Scenario: Route get task request
  Given a valid get task request with task ID
  When Gateway receives the request
  Then it should forward the request to TaskManager.getTask
  And return the Task Manager response unchanged

Scenario: Route search tasks request
  Given a valid search tasks request
  When Gateway receives the request
  Then it should forward the request to TaskManager.searchTasks
  And return the Task Manager response unchanged
```

**Rationale**:
Gateway provides unified access to task information through Task Manager.

---

#### FR-GW-003: Route Configuration Queries to Configuration Manager

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL route configuration queries (list workflows, get workflow, list commands, get command) to the Configuration Manager component so that UI can access workflow and command definitions.

**Acceptance Criteria**:

```gherkin
Scenario: Route list workflows request
  Given a request to list workflows
  When Gateway receives the request
  Then it should forward the request to ConfigurationManager.listWorkflows
  And return the Configuration Manager response unchanged

Scenario: Route get workflow details request
  Given a request to get workflow details
  When Gateway receives the request
  Then it should forward the request to ConfigurationManager.getWorkflow
  And return the Configuration Manager response unchanged

Scenario: Route list commands request
  Given a request to list commands
  When Gateway receives the request
  Then it should forward the request to ConfigurationManager.listCommands
  And return the Configuration Manager response unchanged

Scenario: Route get command template request
  Given a request to get command template
  When Gateway receives the request
  Then it should forward the request to ConfigurationManager.getCommandTemplate
  And return the Configuration Manager response unchanged
```

**Rationale**:
Gateway provides unified access to workflow and command definitions through Configuration Manager.

---

#### FR-GW-004: Route Clarification Responses to Message Bus

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL route clarification responses to the Message Bus component so that user responses reach waiting agents.

**Acceptance Criteria**:

```gherkin
Scenario: Route clarification response
  Given a user provides a clarification response
  And the response includes a valid clarification ID
  When Gateway receives the response
  Then it should publish CLARIFICATION_RESPONSE event to Message Bus
  And include the correct correlation ID

Scenario: Route permission response
  Given a user provides a permission decision
  And the response includes a valid permission ID
  When Gateway receives the response
  Then it should publish PERMISSION_RESPONSE event to Message Bus
  And include the correct correlation ID
```

**Rationale**:
User responses to clarification and permission requests must be routed back to waiting agents through Message Bus.

---

#### FR-GW-005: Route Execution State Queries

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-002 |
| **Dependencies** | FR-GW-001 |

**Requirement**:
The system SHALL route execution state queries to compose data from Orchestrator (workflow state) and State Manager (execution events) so that UI can hydrate current state on connection or reconnection.

**Acceptance Criteria**:

```gherkin
Scenario: Route get execution state request
  Given a request for execution state with execution ID
  When Gateway receives the request
  Then it should query Orchestrator.getWorkflowState for workflow state
  And return the complete current state for UI hydration

Scenario: Route get execution state with history
  Given a request for execution state with shouldIncludeHistory=true
  When Gateway receives the request
  Then it should query Orchestrator.getWorkflowState for workflow state
  And it should query State Manager.getExecutionEvents for execution events
  And return both workflow state and execution events for UI hydration

Scenario: Route execution history request
  Given a request for execution history
  When Gateway receives the request
  Then it should forward the request to Orchestrator.listExecutions
  And return the execution history unchanged
```

**Rationale**:
UI needs to query current state for initial hydration and after reconnection. Execution events (tool calls, outputs) are stored by State Manager, while workflow state (phase progress, status) is managed by Orchestrator. Gateway composes both for complete hydration.

---

### 2.2 Event Streaming

These requirements define how Gateway streams events to UI clients.

---

#### FR-GW-006: Subscribe to Message Bus Events

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-003 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL subscribe to relevant events from Message Bus so that Gateway can relay events to UI clients.

**Acceptance Criteria**:

```gherkin
Scenario: Subscribe to workflow events on startup
  Given Gateway is initializing
  When initialization completes
  Then Gateway should be subscribed to workflow lifecycle events
  And subscribed to phase lifecycle events
  And subscribed to agent activity events
  And subscribed to clarification request events
  And subscribed to permission request events

Scenario: Receive events from Message Bus
  Given Gateway is subscribed to events
  When an event is published to Message Bus
  Then Gateway should receive the event
```

**Rationale**:
Gateway must receive all relevant events to relay them to UI clients.

---

#### FR-GW-007: Forward Events to Subscribed UI Clients

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-003 |
| **Dependencies** | FR-GW-006 |

**Requirement**:
The system SHALL forward received events to all subscribed UI clients so that UI displays real-time updates.

**Acceptance Criteria**:

```gherkin
Scenario: Forward event to subscribed client
  Given a UI client is subscribed to events
  When Gateway receives an event from Message Bus
  Then the event should be forwarded to the subscribed client

Scenario: Forward event to multiple clients
  Given multiple UI clients are subscribed to events
  When Gateway receives an event from Message Bus
  Then the event should be forwarded to all subscribed clients
```

**Rationale**:
UI clients need real-time event updates for live monitoring.

---

#### FR-GW-008: Filter Events by Execution ID

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-003 |
| **Dependencies** | FR-GW-007 |

**Requirement**:
The system SHALL support filtering events by execution ID so that UI can receive only events for a specific execution.

**Acceptance Criteria**:

```gherkin
Scenario: Filter events by execution ID
  Given a UI client subscribes with executionId filter "exec-123"
  When Gateway receives events for "exec-123" and "exec-456"
  Then only events for "exec-123" should be forwarded to the client
  And events for "exec-456" should not be forwarded

Scenario: No filter receives all events
  Given a UI client subscribes without executionId filter
  When Gateway receives events for multiple executions
  Then all events should be forwarded to the client
```

**Rationale**:
UI typically monitors a specific execution and should not receive unrelated events.

---

#### FR-GW-009: Filter Events by Event Type

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-003 |
| **Dependencies** | FR-GW-007 |

**Requirement**:
The system SHALL support filtering events by event type so that UI can receive only specific event types.

**Acceptance Criteria**:

```gherkin
Scenario: Filter events by type
  Given a UI client subscribes with eventTypes filter ["workflow-started", "workflow-completed"]
  When Gateway receives events of various types
  Then only "workflow-started" and "workflow-completed" events should be forwarded
  And other event types should not be forwarded

Scenario: Combine execution ID and event type filters
  Given a UI client subscribes with executionId "exec-123" and eventTypes ["phase-started"]
  When Gateway receives events
  Then only "phase-started" events for "exec-123" should be forwarded
```

**Rationale**:
UI may only need specific event types for certain views.

---

#### FR-GW-010: No Event Buffering for Late Connections

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-GW-003            |
| **Dependencies** | FR-GW-005, FR-GW-007 |

**Requirement**:
The system SHALL NOT buffer historical events for UI clients that connect after events have occurred. Instead, UI clients SHALL query current execution state via FR-GW-005 for initial hydration, then receive only new events going forward.

**Acceptance Criteria**:

```gherkin
Scenario: Late-connecting UI client does not receive past events
  Given a workflow execution started and completed phases 1-3
  And no UI client was connected during those phases
  When a UI client connects and subscribes to events
  Then the UI client should NOT automatically receive historical events for phases 1-3

Scenario: Late-connecting UI client queries current state
  Given a workflow execution is in progress at phase 4
  When a UI client connects
  Then the UI client should call getExecutionState to hydrate current state
  And completed phases should be shown as complete in the state response
  And only events from phase 4 onwards should be streamed

Scenario: Reconnecting UI client queries current state
  Given a UI client was connected during phases 1-2
  And the UI client disconnected
  And phases 3-4 completed while disconnected
  When the UI client reconnects
  Then the UI client should call getExecutionState for current state
  And phases 1-4 should be shown as complete in the state response
  And only new events should be streamed going forward
```

**Rationale**:
Buffering historical events in Gateway adds complexity and memory overhead. Instead, late-connecting clients use the catch-up mechanism: call `getExecutionState` with `shouldIncludeHistory=true` to receive execution events that occurred before connection (FR-GW-005). Gateway queries State Manager for these persisted events (FR-SM-006), then streams only new events going forward. This keeps Gateway stateless while ensuring no events are lost.

---

### 2.3 Validation

These requirements define how Gateway validates requests before routing.

---

#### FR-GW-011: Validate Request Schema

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL validate request schema before routing so that malformed requests do not reach backend components.

**Acceptance Criteria**:

```gherkin
Scenario: Validate well-formed request
  Given a request with valid schema
  When Gateway receives the request
  Then validation should pass
  And the request should be routed to the backend

Scenario: Reject malformed request
  Given a request with invalid JSON
  When Gateway receives the request
  Then validation should fail
  And an error should be returned immediately
  And the backend should not receive the request
```

**Rationale**:
Schema validation protects backend components and provides immediate feedback.

---

#### FR-GW-012: Validate Required Fields

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-004 |
| **Dependencies** | FR-GW-011 |

**Requirement**:
The system SHALL validate that required fields are present before routing so that missing fields are caught early.

**Acceptance Criteria**:

```gherkin
Scenario: Validate required fields present
  Given a start workflow request with workflowName and taskId
  When Gateway receives the request
  Then validation should pass
  And the request should be routed

Scenario: Reject request with missing required field
  Given a start workflow request without taskId
  When Gateway receives the request
  Then validation should fail
  And error should list "taskId" as missing required field
  And the backend should not receive the request
```

**Rationale**:
Early validation of required fields prevents errors deeper in the system.

---

### 2.4 Transport

These requirements define how Gateway supports different transports. The primary transport is Electron IPC for the desktop application. HTTP/WebSocket supports browser-based access (local server mode), and in-process transport supports future CLI integration.

---

#### FR-GW-013: Support In-Process Transport for CLI (Future)

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-006 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support in-process transport for CLI so that CLI can call Gateway directly without network overhead. This transport will be implemented when CLI support is added for CI/CD automation.

**Acceptance Criteria**:

```gherkin
Scenario: CLI calls Gateway directly
  Given CLI is running in the same process as Gateway
  When CLI makes a request through Gateway
  Then the request should be handled as a direct function call
  And no network transport should be used

Scenario: CLI receives events via callback
  Given CLI has registered an event callback with Gateway
  When an event occurs
  Then the callback should be invoked directly
  And no network transport should be used
```

**Rationale**:
In-process transport eliminates network overhead for CLI, improving performance. CLI will be added after the desktop application for CI/CD automation scenarios.

---

#### FR-GW-014: Support HTTP Transport for Browser-Based Web UI (Future)

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-006 |
| **Dependencies** | None      |

> **Note**: This requirement is for the future browser-based Web UI (Phase 2), not the primary Electron desktop application which uses IPC transport (FR-GW-012).

**Requirement**:
The system SHALL support HTTP transport for browser-based Web UI requests so that users can access FlowMaster via browser when running `flowmaster ui`.

**Acceptance Criteria**:

```gherkin
Scenario: Browser Web UI sends HTTP request
  Given browser-based Web UI is running
  When Web UI makes a request to Gateway
  Then the request should be sent via HTTP
  And Gateway should process and respond via HTTP

Scenario: HTTP request uses standard methods
  Given a browser Web UI request
  When sending the request
  Then GET should be used for queries
  And POST should be used for commands
```

**Rationale**:
Future browser-based Web UI (Phase 2) requires HTTP for communication with Gateway. This enables team visualization and remote access scenarios.

---

#### FR-GW-015: Support WebSocket Transport for Browser-Based Web UI Events (Future)

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-006 |
| **Dependencies** | FR-GW-007 |

> **Note**: This requirement is for the future browser-based Web UI (Phase 2), not the primary Electron desktop application which uses IPC transport (FR-GW-012).

**Requirement**:
The system SHALL support WebSocket transport for browser-based Web UI event streaming so that browser clients receive real-time events.

**Acceptance Criteria**:

```gherkin
Scenario: Browser Web UI subscribes via WebSocket
  Given browser Web UI connects to Gateway via WebSocket
  When Web UI sends subscription message
  Then Gateway should register the subscription
  And events should stream over the WebSocket connection

Scenario: WebSocket reconnection
  Given browser Web UI WebSocket connection is lost
  When Web UI reconnects
  Then subscription should be re-established
  And event streaming should resume
```

**Rationale**:
WebSocket enables real-time bidirectional communication for event streaming.

---

#### FR-GW-022: WebSocket Client Registration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-006 |
| **Dependencies** | FR-GW-015 |

**Requirement**:
The system SHALL manage WebSocket client connections including registration and cleanup so that multiple UI clients can receive events reliably.

**Acceptance Criteria**:

```gherkin
Scenario: Accept WebSocket client connections
  Given the WebSocket server is running
  When a UI client initiates a connection
  Then the connection SHALL be accepted
  And the client SHALL be registered

Scenario: Assign unique client IDs
  Given multiple clients connect
  When each connection is established
  Then each client SHALL receive a unique ID
  And IDs SHALL be used for routing and tracking

Scenario: Track active clients
  Given clients connect and disconnect over time
  When querying active clients
  Then an accurate list of connected clients SHALL be available

Scenario: Handle client disconnections
  Given a client is connected
  When the client disconnects (cleanly or abruptly)
  Then the client SHALL be unregistered
  And no events SHALL be sent to the disconnected client

Scenario: Clean up resources on disconnect
  Given a client has disconnected
  When cleanup runs
  Then all resources associated with the client SHALL be released
  And no memory leaks SHALL occur
```

**Rationale**:
Proper client management enables multiple UI windows to receive events, handles disconnections gracefully, and prevents resource leaks from abandoned connections.

---

#### FR-GW-023: Per-Client Event Filtering

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-003 |
| **Dependencies** | FR-GW-022 |

**Requirement**:
The system SHALL filter events per WebSocket client based on subscriptions so that clients only receive events they have requested.

**Acceptance Criteria**:

```gherkin
Scenario: Clients can specify which event types to receive
  Given a WebSocket client is connected
  When the client sends subscription preferences
  Then the preferences SHALL be stored for that client

Scenario: Only subscribed events are sent to each client
  Given client A subscribes to "phase-*" events
  And client B subscribes to all events
  When a "workflow-completed" event occurs
  Then client A SHALL NOT receive it
  And client B SHALL receive it

Scenario: Client subscriptions are independent
  Given multiple clients with different subscriptions
  When events are emitted
  Then each client SHALL receive only their subscribed events
  And one client's subscription SHALL NOT affect another

Scenario: Clients can update subscriptions dynamically
  Given a client is receiving all events
  When the client updates to receive only error events
  Then subsequent events SHALL respect the new subscription
  And the change SHALL take effect immediately

Scenario: Filtering happens before network transmission
  Given a client has limited subscriptions
  When events are being sent
  Then filtering SHALL occur server-side
  And bandwidth SHALL NOT be wasted on filtered events
```

**Rationale**:
Per-client filtering reduces network bandwidth and processing overhead by only transmitting events clients actually want, improving scalability.

---

#### FR-GW-024: WebSocket Heartbeat Monitoring

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-006 |
| **Dependencies** | FR-GW-022 |

**Requirement**:
The system SHALL send heartbeat messages to detect dead connections so that stale clients are cleaned up and resources recovered.

**Acceptance Criteria**:

```gherkin
Scenario: Send periodic ping messages to clients
  Given a WebSocket client is connected
  When the heartbeat interval elapses
  Then a ping message SHALL be sent to the client

Scenario: Expect pong responses from clients
  Given a ping has been sent
  When the client receives the ping
  Then the client SHALL respond with a pong
  And the server SHALL track the response

Scenario: Detect clients that don't respond
  Given a ping has been sent
  When no pong is received within timeout
  Then the client SHALL be marked as unresponsive

Scenario: Close connections after timeout
  Given a client is marked as unresponsive
  When the connection timeout is reached
  Then the connection SHALL be closed
  And resources SHALL be cleaned up

Scenario: Heartbeat interval is configurable
  Given different deployment environments
  When configuring the heartbeat
  Then the interval SHALL be configurable
  And the timeout SHALL be configurable
```

**Rationale**:
Heartbeat monitoring detects dead connections that fail to close properly (e.g., network issues), enabling timely cleanup of resources and accurate connection tracking.

---

#### FR-GW-025: SSE Fallback for WebSocket

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Low       |
| **Implements**   | HL-GW-006 |
| **Dependencies** | FR-GW-015 |

**Requirement**:
The system SHALL provide Server-Sent Events fallback when WebSocket is unavailable so that streaming works in restrictive network environments.

**Acceptance Criteria**:

```gherkin
Scenario: Provide SSE endpoint as alternative
  Given the streaming server is running
  When a client cannot use WebSocket
  Then an SSE endpoint SHALL be available at /events/stream

Scenario: SSE provides same event stream as WebSocket
  Given events are being emitted
  When comparing SSE and WebSocket streams
  Then both SHALL receive the same events
  And event format SHALL be consistent

Scenario: Clients can use SSE when WebSocket fails
  Given a client in a restrictive network
  When WebSocket connection fails
  Then the client SHALL be able to fall back to SSE

Scenario: Fallback is automatic from client side
  Given a client library is connecting
  When WebSocket is blocked
  Then the library SHALL automatically try SSE
  And no manual intervention SHALL be required

Scenario: SSE includes heartbeat for connection monitoring
  Given a client is connected via SSE
  When monitoring connection health
  Then periodic heartbeat comments SHALL be sent
  And connection drops SHALL be detectable
```

**Rationale**:
Some network environments (corporate proxies, firewalls) block WebSocket connections. SSE fallback ensures streaming capability remains available even in restrictive environments.

---

### 2.5 Error Handling

These requirements define how Gateway handles errors.

---

#### FR-GW-016: Pass Through Backend Errors

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL pass through backend errors unchanged so that Gateway does not obscure error details.

**Acceptance Criteria**:

```gherkin
Scenario: Pass through backend error
  Given backend component returns an error
  When Gateway receives the error
  Then Gateway should return the same error to UI
  And error details should not be modified

Scenario: Preserve error code and message
  Given backend returns error with code "ERR_WORKFLOW_NOT_FOUND"
  When Gateway passes through the error
  Then the error code should be "ERR_WORKFLOW_NOT_FOUND"
  And the error message should be unchanged
```

**Rationale**:
Gateway should not contain business logic, including error transformation.

---

#### FR-GW-017: Return Timeout Error on Operation Timeout

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL return a timeout error when backend does not respond within the configured timeout so that UI is not blocked indefinitely.

**Acceptance Criteria**:

```gherkin
Scenario: Return timeout error
  Given operation timeout is configured as 30 seconds
  And backend does not respond within 30 seconds
  When timeout expires
  Then Gateway should return a timeout error
  And error should indicate the operation timed out

Scenario: Successful response within timeout
  Given operation timeout is configured as 30 seconds
  And backend responds within 10 seconds
  When response is received
  Then Gateway should return the response normally
  And no timeout error should occur
```

**Rationale**:
Timeouts prevent UI from waiting indefinitely for unresponsive backends.

---

#### FR-GW-018: Support Configurable Timeouts Per Operation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-004 |
| **Dependencies** | FR-GW-017 |

**Requirement**:
The system SHALL support configurable timeouts per operation type so that different operations can have appropriate timeouts.

**Acceptance Criteria**:

```gherkin
Scenario: Different timeouts for different operations
  Given start workflow timeout is 60 seconds
  And get execution state timeout is 10 seconds
  When operations are executed
  Then each operation should use its configured timeout

Scenario: Default timeout for unconfigured operations
  Given an operation type has no specific timeout configured
  When the operation is executed
  Then the default timeout should be used
```

**Rationale**:
Different operations have different expected durations; configurable timeouts allow appropriate values.

---

### 2.6 Logging

These requirements define Gateway logging behavior.

---

#### FR-GW-019: Log Requests at Configurable Level

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-GW-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL log requests at a configurable log level so that developers can control logging verbosity.

**Acceptance Criteria**:

```gherkin
Scenario: Log requests at DEBUG level
  Given log level is set to DEBUG
  When Gateway receives a request
  Then the request should be logged
  And log should include request type and parameters

Scenario: Skip request logging at INFO level
  Given log level is set to INFO
  When Gateway receives a request
  Then the request should not be logged
```

**Rationale**:
Configurable logging allows developers to enable verbose logging when debugging.

---

#### FR-GW-020: Log Errors at ERROR Level

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-GW-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL log errors at ERROR level so that errors are always visible regardless of log level configuration.

**Acceptance Criteria**:

```gherkin
Scenario: Log backend error
  Given backend returns an error
  When Gateway processes the error
  Then the error should be logged at ERROR level
  And log should include error details

Scenario: Log validation error
  Given request validation fails
  When Gateway processes the validation failure
  Then the error should be logged at ERROR level
```

**Rationale**:
Errors should always be logged for debugging and monitoring.

---

### 2.7 Stateless Operation

These requirements define Gateway stateless behavior.

---

#### FR-GW-021: Hold No Workflow State

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-GW-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL hold no workflow or execution state so that Gateway can be restarted without affecting running workflows.

**Acceptance Criteria**:

```gherkin
Scenario: No state stored in Gateway
  Given a workflow is executing
  When Gateway is restarted
  Then the workflow should continue executing
  And no state should be lost

Scenario: State queries delegate to backend
  Given a request for execution state
  When Gateway receives the request
  Then Gateway should query State Manager via Orchestrator
  And Gateway should not cache the state
```

**Rationale**:
Stateless design ensures Gateway failures do not affect workflow execution.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario            | Expected Behavior                    | Error Code |
| ------------------------- | ------------------------------------ | ---------- |
| Invalid request schema    | Return validation error with details | ERR_GW_001 |
| Missing required field    | Return error listing missing fields  | ERR_GW_002 |
| Backend timeout           | Return timeout error                 | ERR_GW_003 |
| Backend connection failed | Return connection error              | ERR_GW_004 |
| Invalid correlation ID    | Return error indicating invalid ID   | ERR_GW_005 |

### 3.2 Retry Behavior

| Condition                 | Retry? | Max Attempts | Backoff Strategy         |
| ------------------------- | ------ | ------------ | ------------------------ |
| Backend timeout           | Yes    | 3            | Exponential (1s, 2s, 4s) |
| Backend connection failed | Yes    | 3            | Exponential (1s, 2s, 4s) |
| Validation error          | No     | -            | None                     |
| Invalid request           | No     | -            | None                     |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface             | Provider Component               | Purpose                           |
| --------------------- | -------------------------------- | --------------------------------- |
| Execution Operations  | Orchestrator (COMP-008)          | Route execution commands          |
| Task Operations       | Task Manager (COMP-006)          | Route task queries                |
| Configuration Queries | Configuration Manager (COMP-002) | Route configuration queries       |
| Event Subscription    | Message Bus (COMP-001)           | Subscribe to events for streaming |
| Event Publishing      | Message Bus (COMP-001)           | Publish user responses            |

### 4.2 Provided Interfaces (Dependents)

| Interface   | Consumer Component(s)     | Purpose                           |
| ----------- | ------------------------- | --------------------------------- |
| Gateway API | User Interface (COMP-009) | Unified API for all UI operations |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity               | Description                                | Persistence                               |
| -------------------- | ------------------------------------------ | ----------------------------------------- |
| Active Subscriptions | List of UI clients and their event filters | In-memory                                 |
| Operation Timeouts   | Configured timeouts per operation type     | Configuration (via Configuration Manager) |

### 5.2 Data Constraints

| Constraint         | Description                                            |
| ------------------ | ------------------------------------------------------ |
| No workflow state  | Gateway must not store any workflow or execution state |
| Subscription limit | Maximum 100 concurrent event subscriptions             |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                          |
| -------------- | ---------------------------------------------------------------- |
| HL-GW-001      | FR-GW-001, FR-GW-002, FR-GW-003, FR-GW-004, FR-GW-005            |
| HL-GW-002      | FR-GW-001, FR-GW-002, FR-GW-003, FR-GW-004, FR-GW-005, FR-GW-016 |
| HL-GW-003      | FR-GW-006, FR-GW-007, FR-GW-008, FR-GW-009, FR-GW-023            |
| HL-GW-004      | FR-GW-011, FR-GW-012, FR-GW-017, FR-GW-018, FR-GW-019, FR-GW-020 |
| HL-GW-005      | FR-GW-021                                                        |
| HL-GW-006      | FR-GW-013, FR-GW-014, FR-GW-015, FR-GW-022, FR-GW-024, FR-GW-025 |

### 6.2 Requirements Summary

| Category            | Count  | Critical | High  | Medium | Low   |
| ------------------- | ------ | -------- | ----- | ------ | ----- |
| Request Routing     | 5      | 4        | 1     | 0      | 0     |
| Event Streaming     | 4      | 2        | 1     | 1      | 0     |
| Validation          | 2      | 0        | 2     | 0      | 0     |
| Transport           | 7      | 2        | 1     | 3      | 1     |
| Error Handling      | 3      | 1        | 1     | 1      | 0     |
| Logging             | 2      | 0        | 1     | 1      | 0     |
| Stateless Operation | 1      | 1        | 0     | 0      | 0     |
| **Total**           | **24** | **10**   | **7** | **6**  | **1** |

---

## 7. Open Questions

| Question ID | Question                                                                   | Owner | Target Date | Resolution |
| ----------- | -------------------------------------------------------------------------- | ----- | ----------- | ---------- |
| Q-GW-001    | Should Gateway support request batching for performance?                   | TBD   | Stage 4     | Pending    |
| Q-GW-002    | What is the maximum number of concurrent WebSocket connections to support? | TBD   | Stage 4     | Pending    |

---

## 8. Requirements Index

| ID        | Title                                                                | Priority | Implements | Status |
| --------- | -------------------------------------------------------------------- | -------- | ---------- | ------ |
| FR-GW-001 | Route Execution Requests to Orchestrator                             | Critical | HL-GW-002  | Draft  |
| FR-GW-002 | Route Task Requests to Task Manager                                  | Critical | HL-GW-002  | Draft  |
| FR-GW-003 | Route Configuration Queries to Configuration Manager                 | Critical | HL-GW-002  | Draft  |
| FR-GW-004 | Route Clarification Responses to Message Bus                         | Critical | HL-GW-002  | Draft  |
| FR-GW-005 | Route Execution State Queries                                        | High     | HL-GW-002  | Draft  |
| FR-GW-006 | Subscribe to Message Bus Events                                      | Critical | HL-GW-003  | Draft  |
| FR-GW-007 | Forward Events to Subscribed UI Clients                              | Critical | HL-GW-003  | Draft  |
| FR-GW-008 | Filter Events by Execution ID                                        | High     | HL-GW-003  | Draft  |
| FR-GW-009 | Filter Events by Event Type                                          | Medium   | HL-GW-003  | Draft  |
| FR-GW-010 | No Event Buffering for Late Connections                              | High     | HL-GW-003  | Draft  |
| FR-GW-011 | Validate Request Schema                                              | High     | HL-GW-004  | Draft  |
| FR-GW-012 | Validate Required Fields                                             | High     | HL-GW-004  | Draft  |
| FR-GW-013 | Support In-Process Transport for CLI (Future)                        | Medium   | HL-GW-006  | Draft  |
| FR-GW-014 | Support HTTP Transport for Browser-Based Web UI (Future)             | Medium   | HL-GW-006  | Draft  |
| FR-GW-015 | Support WebSocket Transport for Browser-Based Web UI Events (Future) | Medium   | HL-GW-006  | Draft  |
| FR-GW-016 | Pass Through Backend Errors                                          | Critical | HL-GW-002  | Draft  |
| FR-GW-017 | Return Timeout Error on Operation Timeout                            | High     | HL-GW-004  | Draft  |
| FR-GW-018 | Support Configurable Timeouts Per Operation                          | Medium   | HL-GW-004  | Draft  |
| FR-GW-019 | Log Requests at Configurable Level                                   | Medium   | HL-GW-004  | Draft  |
| FR-GW-020 | Log Errors at ERROR Level                                            | High     | HL-GW-004  | Draft  |
| FR-GW-021 | Hold No Workflow State                                               | Critical | HL-GW-005  | Draft  |
| FR-GW-022 | WebSocket Client Registration                                        | High     | HL-GW-006  | Draft  |
| FR-GW-023 | Per-Client Event Filtering                                           | Medium   | HL-GW-003  | Draft  |
| FR-GW-024 | WebSocket Heartbeat Monitoring                                       | Medium   | HL-GW-006  | Draft  |
| FR-GW-025 | SSE Fallback for WebSocket                                           | Low      | HL-GW-006  | Draft  |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                                   |
| ------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-29 | FlowMaster Team   | Initial version                                                                                                                                                           |
| 1.1     | 2025-11-30 | Architecture Team | Added FR-GW-022 to FR-GW-025 (WebSocket details moved from Message Bus)                                                                                                   |
| 1.2     | 2025-12-15 | Architecture Team | Desktop-first approach: Added note clarifying Electron IPC as primary transport. Changed FR-GW-013 (CLI transport) priority from Critical to Medium and marked as future. |
