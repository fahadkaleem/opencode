# API - Interface Contract

> **Component ID**: COMP-006
> **Document Version**: 1.0
> **Last Updated**: 2025-12-26
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Architecture Overview](../01-overview/03-architecture-overview.md)
> - [Requirements Overview](../01-overview/02-requirements-overview.md)
> - [Orchestrator Contract](./05-orchestrator.md)
> - [State Manager Contract](./03-state-manager.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **API**, specifying a unified, transport-agnostic interface for all UI clients (Desktop and CLI). The API routes requests to appropriate backend components and streams events back to subscribers.

### 1.2 Component Summary

| Attribute                    | Value                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Component ID**             | COMP-006                                                                |
| **Directory**                | `packages/core/src/api/`                                                |
| **Interface**                | `Api`                                                                   |
| **Implementation**           | `DefaultApi`                                                            |
| **Type**                     | Presentation Service                                                    |
| **Layer**                    | Presentation Layer                                                      |
| **Responsibility**           | Unified API surface for UI, request routing, event streaming            |
| **Provides Interfaces To**   | COMP-007 (User Interface)                                               |
| **Requires Interfaces From** | COMP-005 (Orchestrator), COMP-003 (StateManager), COMP-002 (TaskClient) |

### 1.3 Contract ID Convention

Operations follow the format: **AP-OP-XXX**

| Range         | Category           |
| ------------- | ------------------ |
| AP-OP-001-009 | Workflow Control   |
| AP-OP-010-019 | Task Operations    |
| AP-OP-020-029 | Workflow Queries   |
| AP-OP-030-039 | State Queries      |
| AP-OP-040-049 | User Responses     |
| AP-OP-050-059 | Event Subscription |
| AP-OP-060-069 | Prompt Management  |
| AP-OP-070-079 | Session Queries    |

### 1.4 Design Decision: Transport-Agnostic Interface

> **Decision**: The API contract defines **what** operations are available, not **how** they are delivered.

**Context**: FloMaster supports multiple UI clients:

- Desktop (Electron) - primary interface
- CLI (future) - for automation and CI/CD

**Decision**: Transport mechanisms are implementation details, NOT part of the contract:

| NOT in Contract                   | Why                                |
| --------------------------------- | ---------------------------------- |
| IPC channel setup                 | Electron-specific implementation   |
| HTTP routes/endpoints             | Web transport implementation       |
| WebSocket/SSE connection handling | Real-time transport implementation |
| Serialization format              | Transport encoding detail          |

**Rationale**:

1. **Single Source of Truth**: One interface definition, multiple transport implementations
2. **Testability**: Core API logic can be tested without transport layer
3. **Flexibility**: Transport can change without contract changes
4. **Simplicity**: Contract focuses on business operations, not plumbing

**Implementation Pattern**:

```typescript
// Contract defines the interface (this document)
interface Api {
  startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse>;
  subscribe(callback: (event: ApiEvent) => void): Unsubscribe;
}

// Transport adapters implement delivery (NOT in contract)
// packages/desktop/src/main/ipc-adapter.ts - IPC for Electron
// packages/cli/src/direct-adapter.ts - Direct calls for CLI
// packages/web/src/http-adapter.ts - HTTP for future web UI
```

### 1.5 Design Pattern: Facade over Internal Components

The API follows a **facade pattern** that provides a unified interface while delegating to specialized components:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              UI Clients                                 │
│                                                                         │
│    ┌──────────────┐          ┌──────────────┐          ┌──────────────┐│
│    │   Desktop    │          │     CLI      │          │  Web (future)││
│    │  (Electron)  │          │    (oclif)   │          │   (Browser)  ││
│    └──────┬───────┘          └──────┬───────┘          └──────┬───────┘│
│           │                         │                         │        │
│           │    IPC                  │   Direct                │  HTTP  │
│           │                         │                         │        │
└───────────┼─────────────────────────┼─────────────────────────┼────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
            ┌─────────────────────────────────────────────────────────────┐
            │                         Api                                 │
            │                  (Transport-Agnostic)                       │
            │                                                             │
            │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
            │   │  Workflow   │  │    State    │  │    Task     │        │
            │   │  Control    │  │   Queries   │  │ Operations  │        │
            │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
            └──────────┼────────────────┼────────────────┼───────────────┘
                       │                │                │
            ┌──────────┼────────────────┼────────────────┼───────────────┐
            │          ▼                ▼                ▼               │
            │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
            │   │WorkflowEngine│  │ StateManager│  │ TaskClient  │        │
            │   └─────────────┘  └─────────────┘  └─────────────┘        │
            │                                                             │
            │                    Core Components                          │
            └─────────────────────────────────────────────────────────────┘
```

**Key Characteristics**:

- **Stateless**: API holds no workflow or execution state
- **Routing Only**: Validates requests and routes to appropriate component
- **No Business Logic**: Business decisions are made by backend components
- **Event Forwarding**: Subscribes to WorkflowEngine events and forwards to clients

### 1.6 TypeScript Interface

```typescript
// ============================================================
// INTERFACE: Contract for Api
// ============================================================
interface Api {
  // Workflow Control (AP-OP-001 to AP-OP-004)
  startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;

  // Task Operations (AP-OP-010 to AP-OP-011)
  getTask(taskId: string): Promise<Task>;
  searchTasks(query: TaskQuery): Promise<TaskSearchResult>;

  // Workflow Queries (AP-OP-020 to AP-OP-021)
  listWorkflows(): Promise<WorkflowSummary[]>;
  getWorkflow(workflowId: string): Promise<WorkflowDefinition>;

  // State Queries (AP-OP-030 to AP-OP-031)
  getExecution(executionId: string): Promise<ExecutionState>;
  listExecutions(options?: ListExecutionsOptions): Promise<ExecutionSummary[]>;

  // User Responses (AP-OP-040 to AP-OP-042)
  submitClarification(response: ClarificationResponse): Promise<void>;
  submitApproval(response: ApprovalResponse): Promise<void>;
  submitPermission(response: PermissionResponse): Promise<void>;

  // Event Subscription (AP-OP-050)
  subscribe(
    callback: (event: ApiEvent) => void,
    options?: SubscribeOptions
  ): Unsubscribe;

  // Prompt Management (AP-OP-060 to AP-OP-063)
  listPrompts(): Promise<PromptSummary[]>;
  getPrompt(promptId: string): Promise<PromptDefinition>;
  createPrompt(prompt: CreatePromptRequest): Promise<PromptDefinition>;
  updatePrompt(promptId: string, updates: UpdatePromptRequest): Promise<PromptDefinition>;
  deletePrompt(promptId: string): Promise<void>;

  // Session Queries (AP-OP-070 to AP-OP-072)
  getSessionDetails(sessionId: string): Promise<SessionDetails>;
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>;
  getSessionChildren(sessionId: string): Promise<SessionDetails[]>;
}

// ============================================================
// CONCRETE CLASS: Default implementation
// ============================================================
class DefaultApi implements Api {
  constructor(
    private workflowEngine: WorkflowEngine,
    private stateManager: StateManager,
    private taskClient: TaskClient,
    config?: ApiConfig
  ) { ... }
  // All interface methods implemented
}
```

### 1.7 Transport Implementation (Future Document)

> **Note**: This section documents transport-level operations that will be extracted to a separate implementation document (`06-api-transports.md`).

The following operations are transport-specific and NOT part of the core API contract. They will be implemented by transport adapters:

#### IPC Transport (Electron Desktop)

| Operation                         | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `registerIPCHandlers()`           | Register IPC handlers for all API operations |
| `handleIPCRequest(channel, args)` | Route IPC request to API method              |
| `streamEventsToRenderer(event)`   | Forward events to renderer process           |

#### HTTP/WebSocket Transport (Future Web UI)

| Operation                                     | Purpose                           |
| --------------------------------------------- | --------------------------------- |
| `handleHttpRequest(req, res)`                 | Route HTTP request to API method  |
| `handleWebSocketUpgrade(req, socket)`         | Upgrade connection to WebSocket   |
| `handleSSERequest(req, res)`                  | Establish SSE stream for events   |
| `registerWebSocketClient(clientId)`           | Track connected WebSocket clients |
| `updateClientSubscription(clientId, filters)` | Update client event filters       |
| `getActiveClients()`                          | List connected clients            |

#### Direct Transport (CLI)

| Operation                    | Purpose                                   |
| ---------------------------- | ----------------------------------------- |
| (None - direct method calls) | CLI calls API methods directly in-process |

**Implementation Status**: These will be documented in detail when the transport layer is implemented.

---

## 2. Provided Interfaces

### 2.1 Interface: Workflow Control

**Purpose**: Allow UI to control workflow execution (start, pause, resume, cancel).

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-001: startWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-001    |
| **Type**         | Asynchronous |
| **Implements**   | HL-API-002   |

**Signature**:

```typescript
startWorkflow(request: StartWorkflowRequest): Promise<StartWorkflowResponse>
```

**Purpose**: Start a workflow execution for a given task.

**Request Schema**:

| Field        | Type                      | Required | Constraints | Description                     |
| ------------ | ------------------------- | -------- | ----------- | ------------------------------- |
| `workflowId` | `string`                  | Yes      | Non-empty   | ID of workflow to execute       |
| `taskId`     | `string`                  | Yes      | Non-empty   | Task ID to execute workflow for |
| `inputs`     | `Record<string, unknown>` | No       | -           | Optional workflow inputs        |

**Response Schema**:

| Field         | Type        | Description                  |
| ------------- | ----------- | ---------------------------- |
| `executionId` | `string`    | Unique ID for this execution |
| `workflowId`  | `string`    | ID of started workflow       |
| `taskId`      | `string`    | Associated task ID           |
| `status`      | `'CREATED'` | Initial execution status     |

**Preconditions**:

- `workflowId` must reference a valid workflow definition
- `taskId` must reference an existing task

**Postconditions**:

- Execution created in StateManager
- WorkflowEngine begins execution
- `WORKFLOW_STARTED` event emitted

**Error Conditions**:

| Error Code         | Condition                  | Caller Action           |
| ------------------ | -------------------------- | ----------------------- |
| `INVALID_ARGUMENT` | Missing required field     | Provide required fields |
| `NOT_FOUND`        | Workflow or task not found | Check IDs               |
| `ALREADY_EXISTS`   | Active execution for task  | Cancel existing first   |

**Example**:

```typescript
const response = await api.startWorkflow({
  workflowId: 'sdlc',
  taskId: 'TASK-123',
  inputs: { targetBranch: 'main' },
});
// response = { executionId: 'exec-abc-123', workflowId: 'sdlc', taskId: 'TASK-123', status: 'CREATED' }
```

---

#### AP-OP-002: pauseWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-002    |
| **Type**         | Asynchronous |
| **Implements**   | HL-UI-005    |

**Signature**:

```typescript
pauseWorkflow(executionId: string): Promise<void>
```

**Purpose**: Pause a running workflow execution.

**Request Schema**:

| Field         | Type     | Required | Constraints | Description              |
| ------------- | -------- | -------- | ----------- | ------------------------ |
| `executionId` | `string` | Yes      | Non-empty   | ID of execution to pause |

**Preconditions**:

- Execution must exist
- Execution must be in `RUNNING` status

**Postconditions**:

- Execution transitions to `PAUSED` status
- Current step completes before pause takes effect
- `WORKFLOW_PAUSED` event emitted

**Error Conditions**:

| Error Code            | Condition                      | Caller Action        |
| --------------------- | ------------------------------ | -------------------- |
| `INVALID_ARGUMENT`    | Missing executionId            | Provide execution ID |
| `NOT_FOUND`           | Execution not found            | Check execution ID   |
| `FAILED_PRECONDITION` | Execution not in RUNNING state | Check current state  |

---

#### AP-OP-003: resumeWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-003    |
| **Type**         | Asynchronous |
| **Implements**   | HL-UI-005    |

**Signature**:

```typescript
resumeWorkflow(executionId: string): Promise<void>
```

**Purpose**: Resume a paused workflow execution.

**Request Schema**:

| Field         | Type     | Required | Constraints | Description               |
| ------------- | -------- | -------- | ----------- | ------------------------- |
| `executionId` | `string` | Yes      | Non-empty   | ID of execution to resume |

**Preconditions**:

- Execution must exist
- Execution must be in `PAUSED` status

**Postconditions**:

- Execution transitions to `RUNNING` status
- Next pending step begins execution
- `WORKFLOW_RESUMED` event emitted

**Error Conditions**:

| Error Code            | Condition                     | Caller Action        |
| --------------------- | ----------------------------- | -------------------- |
| `INVALID_ARGUMENT`    | Missing executionId           | Provide execution ID |
| `NOT_FOUND`           | Execution not found           | Check execution ID   |
| `FAILED_PRECONDITION` | Execution not in PAUSED state | Check current state  |

---

#### AP-OP-004: cancelWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-004    |
| **Type**         | Asynchronous |
| **Implements**   | HL-UI-005    |

**Signature**:

```typescript
cancelWorkflow(executionId: string): Promise<void>
```

**Purpose**: Cancel a running or paused workflow execution.

**Request Schema**:

| Field         | Type     | Required | Constraints | Description               |
| ------------- | -------- | -------- | ----------- | ------------------------- |
| `executionId` | `string` | Yes      | Non-empty   | ID of execution to cancel |

**Preconditions**:

- Execution must exist
- Execution must be in `RUNNING` or `PAUSED` status

**Postconditions**:

- Execution transitions to `CANCELLED` status
- Any running step is aborted
- `WORKFLOW_CANCELLED` event emitted

**Error Conditions**:

| Error Code            | Condition                             | Caller Action        |
| --------------------- | ------------------------------------- | -------------------- |
| `INVALID_ARGUMENT`    | Missing executionId                   | Provide execution ID |
| `NOT_FOUND`           | Execution not found                   | Check execution ID   |
| `FAILED_PRECONDITION` | Execution already completed/cancelled | No action needed     |

---

### 2.2 Interface: Task Operations

**Purpose**: Allow UI to access task information.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-010: getTask

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-010    |
| **Type**         | Asynchronous |
| **Implements**   | HL-TM-001    |

**Signature**:

```typescript
getTask(taskId: string): Promise<Task>
```

**Purpose**: Retrieve task details by ID.

**Request Schema**:

| Field    | Type     | Required | Constraints | Description            |
| -------- | -------- | -------- | ----------- | ---------------------- |
| `taskId` | `string` | Yes      | Non-empty   | ID of task to retrieve |

**Response Schema**:

| Field         | Type                            | Description              |
| ------------- | ------------------------------- | ------------------------ |
| `id`          | `string`                        | Task ID                  |
| `title`       | `string`                        | Task title               |
| `description` | `string`                        | Task description         |
| `status`      | `TaskStatus`                    | Current status           |
| `source`      | `'local' \| 'jira' \| 'linear'` | Task source              |
| `metadata`    | `Record<string, unknown>`       | Source-specific metadata |

**Preconditions**:

- Task must exist

**Postconditions**:

- Task data returned unchanged from TaskClient

**Error Conditions**:

| Error Code         | Condition      | Caller Action   |
| ------------------ | -------------- | --------------- |
| `INVALID_ARGUMENT` | Missing taskId | Provide task ID |
| `NOT_FOUND`        | Task not found | Check task ID   |

---

#### AP-OP-011: searchTasks

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-011    |
| **Type**         | Asynchronous |
| **Implements**   | HL-TM-001    |

**Signature**:

```typescript
searchTasks(query: TaskQuery): Promise<TaskSearchResult>
```

**Purpose**: Search for tasks matching query criteria.

**Request Schema**:

| Field    | Type           | Required | Constraints       | Description       |
| -------- | -------------- | -------- | ----------------- | ----------------- |
| `status` | `TaskStatus[]` | No       | Valid statuses    | Filter by status  |
| `source` | `string`       | No       | -                 | Filter by source  |
| `text`   | `string`       | No       | -                 | Full-text search  |
| `limit`  | `number`       | No       | 1-100, default 20 | Max results       |
| `offset` | `number`       | No       | >= 0, default 0   | Pagination offset |

**Response Schema**:

| Field     | Type      | Description        |
| --------- | --------- | ------------------ |
| `tasks`   | `Task[]`  | Matching tasks     |
| `total`   | `number`  | Total match count  |
| `hasMore` | `boolean` | More results exist |

**Preconditions**:

- None

**Postconditions**:

- Results returned from TaskClient

---

### 2.3 Interface: Workflow Queries

**Purpose**: Allow UI to access workflow definitions.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-020: listWorkflows

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-020    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-002    |

**Signature**:

```typescript
listWorkflows(): Promise<WorkflowSummary[]>
```

**Purpose**: List all available workflow definitions.

**Response Schema**:

Each `WorkflowSummary`:

| Field         | Type     | Description          |
| ------------- | -------- | -------------------- |
| `id`          | `string` | Workflow ID          |
| `name`        | `string` | Display name         |
| `description` | `string` | Workflow description |
| `stepCount`   | `number` | Number of steps      |

**Preconditions**:

- None

**Postconditions**:

- Returns all workflow definitions from Orchestrator

---

#### AP-OP-021: getWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-021    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-002    |

**Signature**:

```typescript
getWorkflow(workflowId: string): Promise<WorkflowDefinition>
```

**Purpose**: Get detailed workflow definition.

**Request Schema**:

| Field        | Type     | Required | Constraints | Description    |
| ------------ | -------- | -------- | ----------- | -------------- |
| `workflowId` | `string` | Yes      | Non-empty   | ID of workflow |

**Preconditions**:

- Workflow must exist

**Postconditions**:

- Full workflow definition returned

**Error Conditions**:

| Error Code         | Condition          | Caller Action       |
| ------------------ | ------------------ | ------------------- |
| `INVALID_ARGUMENT` | Missing workflowId | Provide workflow ID |
| `NOT_FOUND`        | Workflow not found | Check workflow ID   |

---

### 2.4 Interface: State Queries

**Purpose**: Allow UI to query execution state for hydration.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-030: getExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-030    |
| **Type**         | Asynchronous |
| **Implements**   | HL-API-003   |

**Signature**:

```typescript
getExecution(executionId: string): Promise<ExecutionState>
```

**Purpose**: Get current execution state for UI hydration. Used for late-connecting clients.

**Request Schema**:

| Field         | Type     | Required | Constraints | Description     |
| ------------- | -------- | -------- | ----------- | --------------- |
| `executionId` | `string` | Yes      | Non-empty   | ID of execution |

**Response Schema**:

| Field         | Type              | Description             |
| ------------- | ----------------- | ----------------------- |
| `executionId` | `string`          | Execution ID            |
| `workflowId`  | `string`          | Workflow ID             |
| `taskId`      | `string`          | Task ID                 |
| `status`      | `ExecutionStatus` | Current status          |
| `steps`       | `StepState[]`     | Step states             |
| `context`     | `SharedContext`   | Shared context snapshot |
| `startedAt`   | `string`          | ISO 8601 timestamp      |
| `updatedAt`   | `string`          | ISO 8601 timestamp      |

**Preconditions**:

- Execution must exist

**Postconditions**:

- Current state returned from StateManager

**Error Conditions**:

| Error Code         | Condition           | Caller Action        |
| ------------------ | ------------------- | -------------------- |
| `INVALID_ARGUMENT` | Missing executionId | Provide execution ID |
| `NOT_FOUND`        | Execution not found | Check execution ID   |

**Example**:

```typescript
// Late-connecting client hydration
const state = await api.getExecution('exec-123');
// state = {
//   executionId: 'exec-123',
//   workflowId: 'sdlc',
//   taskId: 'TASK-123',
//   status: 'RUNNING',
//   steps: [
//     { id: 'planning', status: 'COMPLETED' },
//     { id: 'implement', status: 'RUNNING' },
//     { id: 'review', status: 'PENDING' }
//   ],
//   context: { planning: { plan: '...' } },
//   startedAt: '2025-12-26T10:00:00Z',
//   updatedAt: '2025-12-26T10:05:00Z'
// }
```

---

#### AP-OP-031: listExecutions

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-031    |
| **Type**         | Asynchronous |
| **Implements**   | HL-API-003   |

**Signature**:

```typescript
listExecutions(options?: ListExecutionsOptions): Promise<ExecutionSummary[]>
```

**Purpose**: List execution history.

**Request Schema**:

| Field    | Type                | Required | Constraints       | Description      |
| -------- | ------------------- | -------- | ----------------- | ---------------- |
| `taskId` | `string`            | No       | -                 | Filter by task   |
| `status` | `ExecutionStatus[]` | No       | -                 | Filter by status |
| `limit`  | `number`            | No       | 1-100, default 20 | Max results      |

**Response Schema**:

Each `ExecutionSummary`:

| Field         | Type              | Description        |
| ------------- | ----------------- | ------------------ |
| `executionId` | `string`          | Execution ID       |
| `workflowId`  | `string`          | Workflow ID        |
| `taskId`      | `string`          | Task ID            |
| `status`      | `ExecutionStatus` | Current status     |
| `startedAt`   | `string`          | ISO 8601 timestamp |
| `completedAt` | `string \| null`  | ISO 8601 timestamp |

**Preconditions**:

- None

**Postconditions**:

- Results returned from StateManager

---

### 2.5 Interface: User Responses

**Purpose**: Allow UI to send user responses back to waiting workflows.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-040: submitClarification

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-040    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-007    |

**Signature**:

```typescript
submitClarification(response: ClarificationResponse): Promise<void>
```

**Purpose**: Submit user's response to a clarification request from an AI agent.

**Request Schema**:

| Field           | Type     | Required | Constraints | Description                 |
| --------------- | -------- | -------- | ----------- | --------------------------- |
| `executionId`   | `string` | Yes      | Non-empty   | Execution awaiting response |
| `correlationId` | `string` | Yes      | Valid UUID  | Correlation ID from request |
| `answer`        | `string` | Yes      | Non-empty   | User's response             |

**Preconditions**:

- Correlation ID must match a pending clarification request

**Postconditions**:

- Response forwarded to WorkflowEngine
- Waiting step resumes with user's answer

**Error Conditions**:

| Error Code         | Condition              | Caller Action           |
| ------------------ | ---------------------- | ----------------------- |
| `INVALID_ARGUMENT` | Missing required field | Provide required fields |
| `NOT_FOUND`        | Invalid correlation ID | Check correlation ID    |

---

#### AP-OP-041: submitApproval

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-041    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-007    |

**Signature**:

```typescript
submitApproval(response: ApprovalResponse): Promise<void>
```

**Purpose**: Submit user's approval decision for a workflow approval gate.

**Request Schema**:

| Field         | Type                                | Required | Constraints      | Description                 |
| ------------- | ----------------------------------- | -------- | ---------------- | --------------------------- |
| `executionId` | `string`                            | Yes      | Non-empty        | Execution awaiting approval |
| `stepId`      | `string`                            | Yes      | Non-empty        | Step awaiting approval      |
| `decision`    | `'approve' \| 'reject' \| 'refine'` | Yes      | Valid enum value | User's decision             |
| `feedback`    | `string`                            | No       | Max 4000 chars   | Feedback for refinement     |

**Preconditions**:

- Execution must be paused at an approval gate
- If decision is `'refine'`, feedback should be provided

**Postconditions**:

- WorkflowEngine resumes, fails, or re-executes based on decision
- `APPROVAL_SUBMITTED` event emitted

**Error Conditions**:

| Error Code            | Condition                       | Caller Action           |
| --------------------- | ------------------------------- | ----------------------- |
| `INVALID_ARGUMENT`    | Missing required field          | Provide required fields |
| `NOT_FOUND`           | Execution not found             | Verify execution ID     |
| `FAILED_PRECONDITION` | Execution not awaiting approval | Check execution state   |

**Example**:

```typescript
// User approves
await api.submitApproval({
  executionId: 'exec-456',
  stepId: 'review',
  decision: 'approve',
});

// User requests refinement
await api.submitApproval({
  executionId: 'exec-456',
  stepId: 'review',
  decision: 'refine',
  feedback: 'Please add error handling for the edge case when user is not authenticated',
});
```

---

#### AP-OP-042: submitPermission

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-042    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-007    |

**Signature**:

```typescript
submitPermission(response: PermissionResponse): Promise<void>
```

**Purpose**: Submit user's permission decision for a tool execution request.

**Request Schema**:

| Field           | Type      | Required | Constraints | Description                 |
| --------------- | --------- | -------- | ----------- | --------------------------- |
| `executionId`   | `string`  | Yes      | Non-empty   | Execution awaiting response |
| `correlationId` | `string`  | Yes      | Valid UUID  | Correlation ID from request |
| `approved`      | `boolean` | Yes      | -           | User's decision             |

**Preconditions**:

- Correlation ID must match a pending permission request

**Postconditions**:

- Tool execution proceeds or is cancelled based on decision

**Error Conditions**:

| Error Code         | Condition              | Caller Action           |
| ------------------ | ---------------------- | ----------------------- |
| `INVALID_ARGUMENT` | Missing required field | Provide required fields |
| `NOT_FOUND`        | Invalid correlation ID | Check correlation ID    |

---

### 2.6 Interface: Event Subscription

**Purpose**: Allow UI to subscribe to real-time events.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-050: subscribe

| Attribute        | Value                             |
| ---------------- | --------------------------------- |
| **Operation ID** | AP-OP-050                         |
| **Type**         | Synchronous (returns Unsubscribe) |
| **Implements**   | HL-API-003, HL-EV-002             |

**Signature**:

```typescript
subscribe(
  callback: (event: ApiEvent) => void,
  options?: SubscribeOptions
): Unsubscribe
```

**Purpose**: Subscribe to execution events. Transport-agnostic - works via callback.

**Request Schema**:

| Field         | Type                        | Required | Constraints | Description           |
| ------------- | --------------------------- | -------- | ----------- | --------------------- |
| `callback`    | `(event: ApiEvent) => void` | Yes      | -           | Handler for events    |
| `executionId` | `string`                    | No       | -           | Filter by execution   |
| `eventTypes`  | `string[]`                  | No       | -           | Filter by event types |

**Response Schema**:

| Field    | Type         | Description             |
| -------- | ------------ | ----------------------- |
| (return) | `() => void` | Function to unsubscribe |

**Preconditions**:

- None

**Postconditions**:

- Callback registered for event delivery
- Events matching filters are forwarded to callback
- Calling returned function removes subscription

**Example**:

```typescript
// Subscribe to all events for an execution
const unsubscribe = api.subscribe(
  (event) => {
    switch (event.type) {
      case 'STEP_STARTED':
        console.log(`Starting step: ${event.payload.stepId}`);
        break;
      case 'STEP_COMPLETED':
        console.log(`Completed step: ${event.payload.stepId}`);
        break;
    }
  },
  { executionId: 'exec-123' }
);

// Later: Unsubscribe
unsubscribe();
```

---

### 2.7 Interface: Prompt Management

**Purpose**: Allow UI to manage reusable prompt templates that can be referenced in workflow steps.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-060: listPrompts

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-060    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CF-002    |

**Signature**:

```typescript
listPrompts(): Promise<PromptSummary[]>
```

**Purpose**: List all available prompt templates.

**Response Schema**:

Each `PromptSummary`:

| Field         | Type       | Description         |
| ------------- | ---------- | ------------------- |
| `id`          | `string`   | Prompt ID           |
| `name`        | `string`   | Display name        |
| `description` | `string`   | Prompt description  |
| `tags`        | `string[]` | Categorization tags |
| `createdAt`   | `string`   | ISO 8601 timestamp  |
| `updatedAt`   | `string`   | ISO 8601 timestamp  |

**Preconditions**:

- None

**Postconditions**:

- Returns all prompt definitions from Config

---

#### AP-OP-061: getPrompt

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-061    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CF-002    |

**Signature**:

```typescript
getPrompt(promptId: string): Promise<PromptDefinition>
```

**Purpose**: Get detailed prompt definition.

**Request Schema**:

| Field      | Type     | Required | Constraints | Description |
| ---------- | -------- | -------- | ----------- | ----------- |
| `promptId` | `string` | Yes      | Non-empty   | Prompt ID   |

**Response Schema**:

| Field         | Type                  | Description                       |
| ------------- | --------------------- | --------------------------------- |
| `id`          | `string`              | Prompt ID                         |
| `name`        | `string`              | Display name                      |
| `description` | `string`              | Prompt description                |
| `template`    | `string`              | Prompt template with placeholders |
| `inputs`      | `PromptInput[]`       | Required input variables          |
| `tags`        | `string[]`            | Categorization tags               |
| `model`       | `string \| undefined` | Suggested model (optional)        |
| `createdAt`   | `string`              | ISO 8601 timestamp                |
| `updatedAt`   | `string`              | ISO 8601 timestamp                |

**Preconditions**:

- Prompt must exist

**Postconditions**:

- Full prompt definition returned

**Error Conditions**:

| Error Code         | Condition        | Caller Action     |
| ------------------ | ---------------- | ----------------- |
| `INVALID_ARGUMENT` | Missing promptId | Provide prompt ID |
| `NOT_FOUND`        | Prompt not found | Check prompt ID   |

---

#### AP-OP-062: createPrompt

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-062    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CF-002    |

**Signature**:

```typescript
createPrompt(prompt: CreatePromptRequest): Promise<PromptDefinition>
```

**Purpose**: Create a new prompt template.

**Request Schema**:

| Field         | Type            | Required | Constraints   | Description                |
| ------------- | --------------- | -------- | ------------- | -------------------------- |
| `name`        | `string`        | Yes      | 1-100 chars   | Display name               |
| `description` | `string`        | No       | Max 500 chars | Prompt description         |
| `template`    | `string`        | Yes      | Non-empty     | Prompt template            |
| `inputs`      | `PromptInput[]` | No       | -             | Input variable definitions |
| `tags`        | `string[]`      | No       | -             | Categorization tags        |
| `model`       | `string`        | No       | -             | Suggested model            |

**Preconditions**:

- Name must be unique

**Postconditions**:

- Prompt created and persisted
- Returns created prompt with generated ID

**Error Conditions**:

| Error Code         | Condition              | Caller Action           |
| ------------------ | ---------------------- | ----------------------- |
| `INVALID_ARGUMENT` | Missing required field | Provide required fields |
| `ALREADY_EXISTS`   | Name already exists    | Use unique name         |

---

#### AP-OP-063: updatePrompt

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-063    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CF-002    |

**Signature**:

```typescript
updatePrompt(promptId: string, updates: UpdatePromptRequest): Promise<PromptDefinition>
```

**Purpose**: Update an existing prompt template.

**Request Schema**:

| Field         | Type            | Required | Description           |
| ------------- | --------------- | -------- | --------------------- |
| `promptId`    | `string`        | Yes      | Prompt ID to update   |
| `name`        | `string`        | No       | New display name      |
| `description` | `string`        | No       | New description       |
| `template`    | `string`        | No       | New template          |
| `inputs`      | `PromptInput[]` | No       | New input definitions |
| `tags`        | `string[]`      | No       | New tags              |
| `model`       | `string`        | No       | New suggested model   |

**Preconditions**:

- Prompt must exist

**Postconditions**:

- Prompt updated and persisted
- `updatedAt` timestamp updated

**Error Conditions**:

| Error Code         | Condition        | Caller Action     |
| ------------------ | ---------------- | ----------------- |
| `INVALID_ARGUMENT` | Missing promptId | Provide prompt ID |
| `NOT_FOUND`        | Prompt not found | Check prompt ID   |

---

#### AP-OP-064: deletePrompt

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-064    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CF-002    |

**Signature**:

```typescript
deletePrompt(promptId: string): Promise<void>
```

**Purpose**: Delete a prompt template.

**Request Schema**:

| Field      | Type     | Required | Description         |
| ---------- | -------- | -------- | ------------------- |
| `promptId` | `string` | Yes      | Prompt ID to delete |

**Preconditions**:

- Prompt must exist
- Prompt must not be referenced by active workflows (optional enforcement)

**Postconditions**:

- Prompt removed from storage

**Error Conditions**:

| Error Code            | Condition                  | Caller Action           |
| --------------------- | -------------------------- | ----------------------- |
| `INVALID_ARGUMENT`    | Missing promptId           | Provide prompt ID       |
| `NOT_FOUND`           | Prompt not found           | Check prompt ID         |
| `FAILED_PRECONDITION` | Prompt in use by workflows | Remove references first |

---

### 2.8 Interface: Session Queries

**Purpose**: Allow UI to query AI session details and message history.

**Consumers**: COMP-007 (User Interface)

---

#### AP-OP-070: getSessionDetails

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-070    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
getSessionDetails(sessionId: string): Promise<SessionDetails>
```

**Purpose**: Get details about an AI session.

**Request Schema**:

| Field       | Type     | Required | Constraints | Description |
| ----------- | -------- | -------- | ----------- | ----------- |
| `sessionId` | `string` | Yes      | Non-empty   | Session ID  |

**Response Schema**:

| Field          | Type             | Description                  |
| -------------- | ---------------- | ---------------------------- |
| `id`           | `string`         | Session ID                   |
| `title`        | `string`         | Session title                |
| `model`        | `string`         | Model used                   |
| `provider`     | `string`         | Provider name                |
| `status`       | `string`         | Session status               |
| `messageCount` | `number`         | Number of messages           |
| `createdAt`    | `string`         | ISO 8601 timestamp           |
| `updatedAt`    | `string`         | ISO 8601 timestamp           |
| `parentId`     | `string \| null` | Parent session ID (if child) |

**Preconditions**:

- Session must exist

**Postconditions**:

- Session details returned from StateManager (via SDK)

**Error Conditions**:

| Error Code         | Condition         | Caller Action      |
| ------------------ | ----------------- | ------------------ |
| `INVALID_ARGUMENT` | Missing sessionId | Provide session ID |
| `NOT_FOUND`        | Session not found | Check session ID   |

---

#### AP-OP-071: getSessionMessages

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-071    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
getSessionMessages(sessionId: string): Promise<SessionMessage[]>
```

**Purpose**: Get message history for an AI session.

**Request Schema**:

| Field       | Type     | Required | Constraints | Description |
| ----------- | -------- | -------- | ----------- | ----------- |
| `sessionId` | `string` | Yes      | Non-empty   | Session ID  |

**Response Schema**:

Each `SessionMessage`:

| Field       | Type                                | Description           |
| ----------- | ----------------------------------- | --------------------- |
| `id`        | `string`                            | Message ID            |
| `role`      | `'user' \| 'assistant' \| 'system'` | Message role          |
| `parts`     | `MessagePart[]`                     | Message content parts |
| `createdAt` | `string`                            | ISO 8601 timestamp    |

**Preconditions**:

- Session must exist

**Postconditions**:

- Messages returned from StateManager (via SDK)

**Error Conditions**:

| Error Code         | Condition         | Caller Action      |
| ------------------ | ----------------- | ------------------ |
| `INVALID_ARGUMENT` | Missing sessionId | Provide session ID |
| `NOT_FOUND`        | Session not found | Check session ID   |

**Example**:

```typescript
const messages = await api.getSessionMessages('sess-xyz-789');
for (const msg of messages) {
  console.log(`${msg.role}: ${msg.parts.length} parts`);
}
```

---

#### AP-OP-072: getSessionChildren

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | AP-OP-072    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
getSessionChildren(sessionId: string): Promise<SessionDetails[]>
```

**Purpose**: Get child sessions of a parent session (for hierarchical agent execution).

**Request Schema**:

| Field       | Type     | Required | Constraints | Description       |
| ----------- | -------- | -------- | ----------- | ----------------- |
| `sessionId` | `string` | Yes      | Non-empty   | Parent session ID |

**Response Schema**:

Array of `SessionDetails` (same schema as AP-OP-070 response)

**Preconditions**:

- Parent session must exist

**Postconditions**:

- Child sessions returned from StateManager (via SDK)

**Error Conditions**:

| Error Code         | Condition         | Caller Action      |
| ------------------ | ----------------- | ------------------ |
| `INVALID_ARGUMENT` | Missing sessionId | Provide session ID |
| `NOT_FOUND`        | Session not found | Check session ID   |

---

## 3. Required Interfaces

### 3.1 Dependencies on COMP-005 (WorkflowEngine)

| Operation           | Purpose                   | When Called   |
| ------------------- | ------------------------- | ------------- |
| `executeWorkflow()` | Start workflow execution  | AP-OP-001     |
| `pauseWorkflow()`   | Pause execution           | AP-OP-002     |
| `resumeWorkflow()`  | Resume execution          | AP-OP-003     |
| `cancelWorkflow()`  | Cancel execution          | AP-OP-004     |
| `listWorkflows()`   | List workflow definitions | AP-OP-020     |
| `getWorkflow()`     | Get workflow definition   | AP-OP-021     |
| `submitResponse()`  | Forward user responses    | AP-OP-040-042 |
| `subscribe()`       | Subscribe to events       | AP-OP-050     |

**Assumptions**:

- Operations respond within configured timeout
- Errors include meaningful error codes and messages

**Failure Handling**:

- If timeout: Return `DEADLINE_EXCEEDED` to caller
- If error response: Pass through unchanged

### 3.2 Dependencies on COMP-003 (StateManager)

| Operation              | Purpose              | When Called |
| ---------------------- | -------------------- | ----------- |
| `getExecution()`       | Get execution state  | AP-OP-030   |
| `listExecutions()`     | List executions      | AP-OP-031   |
| `getSessionDetails()`  | Get session details  | AP-OP-070   |
| `getSessionMessages()` | Get session messages | AP-OP-071   |
| `getSessionChildren()` | Get child sessions   | AP-OP-072   |

**Assumptions**:

- Operations respond within 500ms
- State is consistent with WorkflowEngine
- Session queries delegate to SDK

**Failure Handling**:

- If timeout: Return `DEADLINE_EXCEEDED` to caller
- If error response: Pass through unchanged

### 3.3 Dependencies on COMP-002 (TaskClient)

| Operation       | Purpose               | When Called |
| --------------- | --------------------- | ----------- |
| `getTask()`     | Retrieve task details | AP-OP-010   |
| `searchTasks()` | Search tasks          | AP-OP-011   |

**Assumptions**:

- Operations respond within 1000ms (may involve external API)
- Task data is consistent with external sources

**Failure Handling**:

- If timeout: Return `DEADLINE_EXCEEDED` to caller
- If error response: Pass through unchanged

### 3.4 Dependencies on COMP-001 (Config)

| Operation        | Purpose               | When Called |
| ---------------- | --------------------- | ----------- |
| `listPrompts()`  | List prompt templates | AP-OP-060   |
| `getPrompt()`    | Get prompt definition | AP-OP-061   |
| `createPrompt()` | Create prompt         | AP-OP-062   |
| `updatePrompt()` | Update prompt         | AP-OP-063   |
| `deletePrompt()` | Delete prompt         | AP-OP-064   |

**Assumptions**:

- Operations respond within 100ms (local file operations)
- Prompts are persisted to `.flomaster/prompts/`

**Failure Handling**:

- If timeout: Return `DEADLINE_EXCEEDED` to caller
- If error response: Pass through unchanged

---

## 4. Events Published

The API does not publish events directly. It forwards events from WorkflowEngine to subscribers.

---

## 5. Events Subscribed

| Event                   | Publisher      | Handler Behavior                |
| ----------------------- | -------------- | ------------------------------- |
| `WORKFLOW_STARTED`      | WorkflowEngine | Forward to subscribed callbacks |
| `WORKFLOW_PAUSED`       | WorkflowEngine | Forward to subscribed callbacks |
| `WORKFLOW_RESUMED`      | WorkflowEngine | Forward to subscribed callbacks |
| `WORKFLOW_COMPLETED`    | WorkflowEngine | Forward to subscribed callbacks |
| `WORKFLOW_FAILED`       | WorkflowEngine | Forward to subscribed callbacks |
| `WORKFLOW_CANCELLED`    | WorkflowEngine | Forward to subscribed callbacks |
| `STEP_STARTED`          | WorkflowEngine | Forward to subscribed callbacks |
| `STEP_COMPLETED`        | WorkflowEngine | Forward to subscribed callbacks |
| `STEP_FAILED`           | WorkflowEngine | Forward to subscribed callbacks |
| `STEP_SKIPPED`          | WorkflowEngine | Forward to subscribed callbacks |
| `CLARIFICATION_REQUEST` | WorkflowEngine | Forward to subscribed callbacks |
| `APPROVAL_REQUEST`      | WorkflowEngine | Forward to subscribed callbacks |
| `PERMISSION_REQUEST`    | WorkflowEngine | Forward to subscribed callbacks |
| `TEXT_DELTA`            | WorkflowEngine | Forward to subscribed callbacks |
| `TOOL_CALL`             | WorkflowEngine | Forward to subscribed callbacks |
| `TOOL_RESULT`           | WorkflowEngine | Forward to subscribed callbacks |

---

## 6. Invariants

| Invariant           | Description                                          | Enforcement                                       |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Stateless Operation | API stores no workflow or execution state            | All state queries delegate to backend; no caching |
| No Business Logic   | API only routes and validates; no business decisions | Request handlers only validate + forward          |
| Unchanged Responses | Backend responses are returned unchanged             | No transformation in handlers                     |
| Callback Isolation  | One callback failure doesn't affect others           | Try-catch around each callback invocation         |

---

## 7. Performance Expectations

| Operation     | Expected Latency | Throughput  | Notes                         |
| ------------- | ---------------- | ----------- | ----------------------------- |
| AP-OP-001-004 | < 100ms          | 100 req/sec | Routing only; execution async |
| AP-OP-010-011 | < 1000ms         | 50 req/sec  | May involve external API      |
| AP-OP-020-021 | < 100ms          | 200 req/sec | Local file reads              |
| AP-OP-030-031 | < 200ms          | 200 req/sec | State queries                 |
| AP-OP-040-042 | < 50ms           | 500 req/sec | Response forwarding           |
| AP-OP-050     | < 10ms           | N/A         | Local subscription            |

---

## 8. Type Definitions

```typescript
// ============================================================
// Request/Response Types
// ============================================================

export interface StartWorkflowRequest {
  workflowId: string;
  taskId: string;
  inputs?: Record<string, unknown>;
}

export interface StartWorkflowResponse {
  executionId: string;
  workflowId: string;
  taskId: string;
  status: 'CREATED';
}

export interface TaskQuery {
  status?: TaskStatus[];
  source?: string;
  text?: string;
  limit?: number;
  offset?: number;
}

export interface TaskSearchResult {
  tasks: Task[];
  total: number;
  hasMore: boolean;
}

export interface ListExecutionsOptions {
  taskId?: string;
  status?: ExecutionStatus[];
  limit?: number;
}

// ============================================================
// State Types
// ============================================================

export type ExecutionStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ExecutionState {
  executionId: string;
  workflowId: string;
  taskId: string;
  status: ExecutionStatus;
  steps: StepState[];
  context: SharedContext;
  startedAt: string;
  updatedAt: string;
}

export interface StepState {
  id: string;
  name: string;
  type: StepType;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  outputs?: Record<string, unknown>;
  error?: string;
}

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface ExecutionSummary {
  executionId: string;
  workflowId: string;
  taskId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
}

// ============================================================
// User Response Types
// ============================================================

export interface ClarificationResponse {
  executionId: string;
  correlationId: string;
  answer: string;
}

export interface ApprovalResponse {
  executionId: string;
  stepId: string;
  decision: 'approve' | 'reject' | 'refine';
  feedback?: string;
}

export interface PermissionResponse {
  executionId: string;
  correlationId: string;
  approved: boolean;
}

// ============================================================
// Event Types
// ============================================================

export interface SubscribeOptions {
  executionId?: string;
  eventTypes?: string[];
}

export type Unsubscribe = () => void;

export type ApiEvent =
  | WorkflowStartedEvent
  | WorkflowPausedEvent
  | WorkflowResumedEvent
  | WorkflowCompletedEvent
  | WorkflowFailedEvent
  | WorkflowCancelledEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepFailedEvent
  | StepSkippedEvent
  | ClarificationRequestEvent
  | ApprovalRequestEvent
  | PermissionRequestEvent
  | TextDeltaEvent
  | ToolCallEvent
  | ToolResultEvent;

export interface BaseEvent {
  type: string;
  executionId: string;
  timestamp: string;
}

export interface WorkflowStartedEvent extends BaseEvent {
  type: 'WORKFLOW_STARTED';
  payload: { workflowId: string; taskId: string };
}

export interface StepStartedEvent extends BaseEvent {
  type: 'STEP_STARTED';
  payload: { stepId: string; stepName: string };
}

export interface StepCompletedEvent extends BaseEvent {
  type: 'STEP_COMPLETED';
  payload: { stepId: string; outputs: Record<string, unknown> };
}

export interface TextDeltaEvent extends BaseEvent {
  type: 'TEXT_DELTA';
  payload: { stepId: string; delta: string };
}

export interface ClarificationRequestEvent extends BaseEvent {
  type: 'CLARIFICATION_REQUEST';
  payload: {
    correlationId: string;
    stepId: string;
    question: string;
  };
}

export interface ApprovalRequestEvent extends BaseEvent {
  type: 'APPROVAL_REQUEST';
  payload: {
    stepId: string;
    stepName: string;
    artifacts: string[];
    checklistItems?: string[];
  };
}

// ... (other event types follow same pattern)

// ============================================================
// Workflow Types
// ============================================================

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  stepCount: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: StepDefinition[];
  connections: Connection[];
}

// ============================================================
// Prompt Types
// ============================================================

export interface PromptSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptDefinition {
  id: string;
  name: string;
  description: string;
  template: string;
  inputs: PromptInput[];
  tags: string[];
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptInput {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
}

export interface CreatePromptRequest {
  name: string;
  description?: string;
  template: string;
  inputs?: PromptInput[];
  tags?: string[];
  model?: string;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  template?: string;
  inputs?: PromptInput[];
  tags?: string[];
  model?: string;
}

// ============================================================
// Session Types
// ============================================================

export interface SessionDetails {
  id: string;
  title: string;
  model: string;
  provider: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
  createdAt: string;
}

export interface MessagePart {
  type: 'text' | 'tool_use' | 'tool_result';
  content: unknown;
}

// ============================================================
// Configuration
// ============================================================

export interface ApiConfig {
  requestTimeout?: number; // Default: 30000ms
}
```

---

## 9. Versioning and Compatibility

### 9.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 9.2 Deprecation Policy

Deprecated operations are:

1. Marked with `@deprecated` in JSDoc
2. Supported for 2 minor versions
3. Removed in next major version

### 9.3 Breaking Changes

| Version | Change          | Migration Path |
| ------- | --------------- | -------------- |
| 1.0     | Initial release | -              |

---

## 10. Traceability

### 10.1 FR to Operation Mapping

| Functional Requirement | Operations                                            |
| ---------------------- | ----------------------------------------------------- |
| HL-API-002             | AP-OP-001                                             |
| HL-API-003             | AP-OP-030, AP-OP-031, AP-OP-050                       |
| HL-UI-005              | AP-OP-002, AP-OP-003, AP-OP-004                       |
| HL-TM-001              | AP-OP-010, AP-OP-011                                  |
| HL-WF-002              | AP-OP-020, AP-OP-021                                  |
| HL-WF-007              | AP-OP-040, AP-OP-041, AP-OP-042                       |
| HL-EV-002              | AP-OP-050                                             |
| HL-CF-002              | AP-OP-060, AP-OP-061, AP-OP-062, AP-OP-063, AP-OP-064 |
| HL-CM-003              | AP-OP-070, AP-OP-071, AP-OP-072                       |

### 10.2 Operation Index

| Operation ID | Name                | Type  | Implements            |
| ------------ | ------------------- | ----- | --------------------- |
| AP-OP-001    | startWorkflow       | Async | HL-API-002            |
| AP-OP-002    | pauseWorkflow       | Async | HL-UI-005             |
| AP-OP-003    | resumeWorkflow      | Async | HL-UI-005             |
| AP-OP-004    | cancelWorkflow      | Async | HL-UI-005             |
| AP-OP-010    | getTask             | Async | HL-TM-001             |
| AP-OP-011    | searchTasks         | Async | HL-TM-001             |
| AP-OP-020    | listWorkflows       | Async | HL-WF-002             |
| AP-OP-021    | getWorkflow         | Async | HL-WF-002             |
| AP-OP-030    | getExecution        | Async | HL-API-003            |
| AP-OP-031    | listExecutions      | Async | HL-API-003            |
| AP-OP-040    | submitClarification | Async | HL-WF-007             |
| AP-OP-041    | submitApproval      | Async | HL-WF-007             |
| AP-OP-042    | submitPermission    | Async | HL-WF-007             |
| AP-OP-050    | subscribe           | Sync  | HL-API-003, HL-EV-002 |
| AP-OP-060    | listPrompts         | Async | HL-CF-002             |
| AP-OP-061    | getPrompt           | Async | HL-CF-002             |
| AP-OP-062    | createPrompt        | Async | HL-CF-002             |
| AP-OP-063    | updatePrompt        | Async | HL-CF-002             |
| AP-OP-064    | deletePrompt        | Async | HL-CF-002             |
| AP-OP-070    | getSessionDetails   | Async | HL-CM-003             |
| AP-OP-071    | getSessionMessages  | Async | HL-CM-003             |
| AP-OP-072    | getSessionChildren  | Async | HL-CM-003             |

---

## Document History

| Version | Date       | Author            | Changes                                            |
| ------- | ---------- | ----------------- | -------------------------------------------------- |
| 1.0     | 2025-12-26 | Architecture Team | Initial version - simplified from Gateway contract |
