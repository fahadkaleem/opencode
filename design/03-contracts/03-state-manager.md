# State Manager - Interface Contract

> **Component ID**: COMP-003
> **Document Version**: 1.2
> **Last Updated**: 2025-12-26
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Architecture Overview](../01-overview/03-architecture-overview.md)
> - [Requirements Overview](../01-overview/02-requirements-overview.md)
> - [Orchestrator Contract](./05-orchestrator.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **State Manager**, specifying operations for workflow execution state management, shared context handling, step-to-session correlation, and crash recovery. The State Manager acts as a **facade** that abstracts workflow-level state management while delegating session-level details to the underlying AI execution layer (opencode SDK).

### 1.2 Component Summary

| Attribute                    | Value                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Component ID**             | COMP-003                                                                       |
| **Directory**                | `packages/core/src/state/`                                                     |
| **Interface**                | `StateManager`                                                                 |
| **Implementation**           | `DefaultStateManager`                                                          |
| **Type**                     | Support Service                                                                |
| **Layer**                    | Support Layer                                                                  |
| **Responsibility**           | Workflow execution state, shared context, step-session mapping, crash recovery |
| **Provides Interfaces To**   | COMP-005 (Orchestrator), COMP-006 (API), COMP-004 (Telemetry)                  |
| **Requires Interfaces From** | AI Execution Layer (opencode SDK) for session queries                          |

### 1.3 Contract ID Convention

Operations follow the format: **SM-OP-XXX**

| Range         | Category                  |
| ------------- | ------------------------- |
| SM-OP-001-009 | Workflow Execution State  |
| SM-OP-010-019 | Shared Context            |
| SM-OP-020-029 | Step-Session Mapping      |
| SM-OP-030-039 | Checkpoint & Recovery     |
| SM-OP-040-049 | Session Queries (via SDK) |

### 1.4 Design Pattern: Facade over AI Execution Layer

The State Manager follows a **facade pattern** that provides a unified execution state API for the UI while delegating session-level details to the opencode SDK:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FLOMASTER COMPONENTS                            │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │ Orchestrator│    │     API     │    │  Telemetry  │                   │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                   │
│         │                  │                  │                          │
│         └──────────────────┼──────────────────┘                          │
│                            │                                             │
│                            ▼                                             │
│              ┌─────────────────────────────┐                             │
│              │      StateManager           │ ◄─── Unified API            │
│              │    (Facade Component)       │                             │
│              └─────────────┬───────────────┘                             │
│                            │                                             │
│         ┌──────────────────┼──────────────────┐                          │
│         │                  │                  │                          │
│         ▼                  ▼                  ▼                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │  Workflow   │    │   Shared    │    │Step-Session │                   │
│  │   State     │    │   Context   │    │   Mapping   │                   │
│  │  (files)    │    │  (memory)   │    │  (files)    │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       AI EXECUTION LAYER                                 │
│                       (opencode SDK)                                     │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │   Session   │    │   Message   │    │    Event    │                   │
│  │ Management  │    │   History   │    │  Streaming  │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Responsibility Split:**

| Managed by StateManager                   | Managed by opencode SDK       |
| ----------------------------------------- | ----------------------------- |
| Which steps are pending/running/completed | Session creation & lifecycle  |
| Shared context between steps              | Message history per session   |
| Step-to-session ID mapping                | Tool call execution & results |
| Workflow checkpoints                      | Real-time event streaming     |
| Retry counts per step                     | Session persistence           |

### 1.5 Data Storage

| Data Store                                         | Type        | Purpose                  | Owner        |
| -------------------------------------------------- | ----------- | ------------------------ | ------------ |
| `.flomaster/executions/{executionId}/state.json`   | File (JSON) | Workflow execution state | StateManager |
| `.flomaster/executions/{executionId}/context.json` | File (JSON) | Shared context snapshot  | StateManager |
| `.flomaster/executions/{executionId}/mapping.json` | File (JSON) | Step-session mapping     | StateManager |
| In-memory cache                                    | Map         | Active execution state   | StateManager |
| opencode session storage                           | SDK-managed | Session/message data     | opencode SDK |

### 1.6 TypeScript Interface

```typescript
// ============================================================
// INTERFACE: Contract for StateManager
// ============================================================
interface StateManager {
  // Workflow Execution State (SM-OP-001 to SM-OP-009)
  createExecution(executionId: string, workflowName: string): Promise<WorkflowExecution>;
  getExecution(executionId: string): Promise<WorkflowExecution | null>;
  updateStepStatus(executionId: string, stepId: string, status: StepExecutionStatus): Promise<void>;
  recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void>;
  getStepStatus(executionId: string, stepId: string): Promise<StepExecutionStatus | null>;
  listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]>;
  deleteExecution(executionId: string): Promise<boolean>;

  // Shared Context (SM-OP-010 to SM-OP-019)
  getContext(executionId: string): Promise<SharedContext | null>;
  setContextValue(executionId: string, stepId: string, key: string, value: unknown): Promise<void>;
  getContextValue(executionId: string, path: string): Promise<unknown>;
  mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void>;

  // Step-Session Mapping (SM-OP-020 to SM-OP-029)
  mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void>;
  getSessionForStep(executionId: string, stepId: string): Promise<string | null>;
  getStepsForSession(sessionId: string): Promise<Array<{ executionId: string; stepId: string }>>;

  // Checkpoint & Recovery (SM-OP-030 to SM-OP-039)
  saveCheckpoint(executionId: string): Promise<string>;
  loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null>;
  listIncompleteExecutions(): Promise<IncompleteExecution[]>;
  setRecoverable(executionId: string, recoverable: boolean): Promise<void>;
  hasCheckpoint(executionId: string): Promise<boolean>;
  isExecutionActive(executionId: string): boolean;

  // Session Queries via SDK (SM-OP-040 to SM-OP-049)
  getSessionDetails(sessionId: string): Promise<SessionDetails | null>;
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>;
  getSessionChildren(sessionId: string): Promise<SessionDetails[]>;
}

// ============================================================
// CONCRETE CLASS: Default implementation
// ============================================================
class DefaultStateManager implements StateManager {
  constructor(
    private sdkClient: OpencodeClient,
    config?: StateManagerConfig
  ) { ... }
  // All interface methods implemented
}
```

---

## 2. Provided Interfaces

### 2.1 Interface: Workflow Execution State

**Purpose**: Track workflow execution lifecycle and step statuses.

**Consumers**: COMP-005 (Orchestrator), COMP-006 (API)

---

#### SM-OP-001: createExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-001    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async createExecution(
  executionId: string,
  workflowName: string
): Promise<WorkflowExecution>
```

**Purpose**: Create a new workflow execution record.

**Request Schema**:

| Field          | Type     | Required | Constraints | Description                     |
| -------------- | -------- | -------- | ----------- | ------------------------------- |
| `executionId`  | `string` | Yes      | Non-empty   | Unique execution identifier     |
| `workflowName` | `string` | Yes      | Non-empty   | Name of workflow being executed |

**Response Schema** (`WorkflowExecution`):

| Field          | Type                                  | Description                 |
| -------------- | ------------------------------------- | --------------------------- |
| `executionId`  | `string`                              | Unique execution identifier |
| `workflowName` | `string`                              | Workflow being executed     |
| `status`       | `ExecutionStatus`                     | Overall execution status    |
| `stepStatuses` | `Record<string, StepExecutionStatus>` | Status per step             |
| `createdAt`    | `string`                              | ISO 8601 timestamp          |
| `updatedAt`    | `string`                              | ISO 8601 timestamp          |

**Postconditions**:

- Execution directory created at `.flomaster/executions/{executionId}/`
- Initial state file written atomically
- Execution cached in memory

**Error Conditions**:

| Error Code           | Condition                | Caller Action                    |
| -------------------- | ------------------------ | -------------------------------- |
| `ALREADY_EXISTS`     | Execution already exists | Use getExecution or delete first |
| `RESOURCE_EXHAUSTED` | Disk space exhausted     | Free disk space                  |

**Example**:

```typescript
const execution = await stateManager.createExecution('exec-abc-123', 'sdlc');
// execution.status === 'CREATED'
```

---

#### SM-OP-002: getExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-002    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async getExecution(executionId: string): Promise<WorkflowExecution | null>
```

**Purpose**: Retrieve workflow execution state.

**Postconditions**:

- Returns cached state if available
- Falls back to file if not cached
- Returns null if execution doesn't exist

**Example**:

```typescript
const execution = await stateManager.getExecution('exec-abc-123');
if (execution) {
  console.log(`Status: ${execution.status}`);
}
```

---

#### SM-OP-003: updateStepStatus

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-003    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async updateStepStatus(
  executionId: string,
  stepId: string,
  status: StepExecutionStatus
): Promise<void>
```

**Purpose**: Update the execution status of a specific step.

**Request Schema**:

| Field         | Type                  | Required | Constraints      | Description  |
| ------------- | --------------------- | -------- | ---------------- | ------------ |
| `executionId` | `string`              | Yes      | Non-empty        | Execution ID |
| `stepId`      | `string`              | Yes      | Non-empty        | Step ID      |
| `status`      | `StepExecutionStatus` | Yes      | Valid enum value | New status   |

**StepExecutionStatus Values**:

| Status             | Description                    |
| ------------------ | ------------------------------ |
| `PENDING`          | Step not yet started           |
| `RUNNING`          | Step currently executing       |
| `COMPLETED`        | Step finished successfully     |
| `FAILED`           | Step failed                    |
| `SKIPPED`          | Step skipped (conditional)     |
| `WAITING_APPROVAL` | Step paused for human approval |
| `WAITING_INPUT`    | Step paused for human input    |

**Postconditions**:

- Step status updated in memory and persisted
- `updatedAt` timestamp updated
- Execution-level status recalculated if needed

**Example**:

```typescript
await stateManager.updateStepStatus('exec-abc-123', 'step-1', 'RUNNING');
```

---

#### SM-OP-004: recordStepResult

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | SM-OP-004            |
| **Type**         | Asynchronous         |
| **Implements**   | HL-SR-001, HL-SR-003 |

**Signature**:

```typescript
async recordStepResult(
  executionId: string,
  stepId: string,
  result: StepResult
): Promise<void>
```

**Purpose**: Record the complete result of a step execution.

**Request Schema** (`StepResult`):

| Field        | Type                      | Required | Description                    |
| ------------ | ------------------------- | -------- | ------------------------------ |
| `status`     | `StepExecutionStatus`     | Yes      | Final status                   |
| `outputs`    | `Record<string, unknown>` | No       | Step output data               |
| `error`      | `string`                  | No       | Error message if failed        |
| `startTime`  | `number`                  | Yes      | When step started              |
| `endTime`    | `number`                  | Yes      | When step ended                |
| `retryCount` | `number`                  | No       | Number of retry attempts       |
| `sessionId`  | `string`                  | No       | Associated opencode session ID |

**Postconditions**:

- Step result stored in execution state
- Step outputs merged into shared context (if successful)
- Step-session mapping updated (if sessionId provided)
- State persisted atomically

**Example**:

```typescript
await stateManager.recordStepResult('exec-abc-123', 'step-1', {
  status: 'COMPLETED',
  outputs: { plan: 'Implementation plan...' },
  startTime: Date.now() - 5000,
  endTime: Date.now(),
  sessionId: 'sess-xyz-789',
});
```

---

#### SM-OP-005: getStepStatus

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-005    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async getStepStatus(
  executionId: string,
  stepId: string
): Promise<StepExecutionStatus | null>
```

**Purpose**: Get the current status of a specific step.

---

#### SM-OP-006: listExecutions

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-006    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]>
```

**Purpose**: List executions, optionally filtered.

**Request Schema** (`ExecutionFilter`):

| Field    | Type                                   | Required | Description                |
| -------- | -------------------------------------- | -------- | -------------------------- |
| `status` | `ExecutionStatus \| ExecutionStatus[]` | No       | Filter by status           |
| `since`  | `string`                               | No       | Only after this timestamp  |
| `limit`  | `number`                               | No       | Max results (default: 100) |

**Response Schema** (`ExecutionSummary`):

| Field            | Type              | Description                 |
| ---------------- | ----------------- | --------------------------- |
| `executionId`    | `string`          | Unique execution identifier |
| `workflowName`   | `string`          | Workflow being executed     |
| `status`         | `ExecutionStatus` | Overall status              |
| `stepCount`      | `number`          | Total steps in workflow     |
| `completedCount` | `number`          | Completed steps             |
| `createdAt`      | `string`          | ISO 8601 timestamp          |
| `updatedAt`      | `string`          | ISO 8601 timestamp          |

**Example**:

```typescript
// List all running executions
const running = await stateManager.listExecutions({
  status: 'RUNNING',
});

// List recent executions
const recent = await stateManager.listExecutions({
  since: new Date(Date.now() - 86400000).toISOString(),
  limit: 10,
});
```

---

#### SM-OP-007: deleteExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-007    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async deleteExecution(executionId: string): Promise<boolean>
```

**Purpose**: Delete all data for an execution.

**Postconditions**:

- Execution directory deleted
- Cached state removed
- Returns true if deleted, false if not found

---

### 2.2 Interface: Shared Context

**Purpose**: Manage shared key-value context for data passing between steps.

**Consumers**: COMP-005 (Orchestrator)

---

#### SM-OP-010: getContext

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-010    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-002    |

**Signature**:

```typescript
async getContext(executionId: string): Promise<SharedContext | null>
```

**Purpose**: Get the complete shared context for an execution.

**Response Schema** (`SharedContext`):

```typescript
// Structure: { [stepId]: { [outputKey]: value } }
type SharedContext = Record<string, Record<string, unknown>>;
```

**Example**:

```typescript
const context = await stateManager.getContext('exec-abc-123');
// context = {
//   'planning': { plan: '...', subtasks: [...] },
//   'setup-git': { branch: 'feature/auth', commit: 'abc123' },
// }
```

---

#### SM-OP-011: setContextValue

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-011    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-002    |

**Signature**:

```typescript
async setContextValue(
  executionId: string,
  stepId: string,
  key: string,
  value: unknown
): Promise<void>
```

**Purpose**: Set a single value in the shared context.

**Postconditions**:

- Value stored at `context[stepId][key]`
- Context persisted atomically

**Example**:

```typescript
await stateManager.setContextValue('exec-abc-123', 'setup-git', 'branch', 'feature/auth');
```

---

#### SM-OP-012: getContextValue

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-012    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-002    |

**Signature**:

```typescript
async getContextValue(executionId: string, path: string): Promise<unknown>
```

**Purpose**: Get a specific value from shared context using dot notation.

**Request Schema**:

| Field  | Type     | Required | Constraints          | Description              |
| ------ | -------- | -------- | -------------------- | ------------------------ |
| `path` | `string` | Yes      | Format: `stepId.key` | Path to value in context |

**Example**:

```typescript
const branch = await stateManager.getContextValue('exec-abc-123', 'setup-git.branch');
// branch = 'feature/auth'
```

---

#### SM-OP-013: mergeStepOutputs

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | SM-OP-013            |
| **Type**         | Asynchronous         |
| **Implements**   | HL-CM-002, HL-WF-004 |

**Signature**:

```typescript
async mergeStepOutputs(
  executionId: string,
  stepId: string,
  outputs: Record<string, unknown>
): Promise<void>
```

**Purpose**: Merge all outputs from a completed step into shared context.

**Postconditions**:

- All output keys stored under `context[stepId]`
- Existing values for stepId are overwritten
- Context persisted atomically

**Example**:

```typescript
await stateManager.mergeStepOutputs('exec-abc-123', 'planning', {
  plan: 'Implementation plan...',
  subtasks: ['step-1', 'step-2', 'step-3'],
  estimated_effort: 'medium',
});
// Context now has: { planning: { plan: '...', subtasks: [...], estimated_effort: 'medium' } }
```

---

### 2.3 Interface: Step-Session Mapping

**Purpose**: Correlate FloMaster steps to opencode session IDs.

**Consumers**: COMP-005 (Orchestrator), COMP-006 (API)

---

#### SM-OP-020: mapStepToSession

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-020    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
async mapStepToSession(
  executionId: string,
  stepId: string,
  sessionId: string
): Promise<void>
```

**Purpose**: Record which opencode session was used for a step.

**Postconditions**:

- Mapping stored in execution state
- Mapping persisted to disk

**Example**:

```typescript
await stateManager.mapStepToSession('exec-abc-123', 'implement-auth', 'sess-xyz-789');
```

---

#### SM-OP-021: getSessionForStep

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-021    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
async getSessionForStep(
  executionId: string,
  stepId: string
): Promise<string | null>
```

**Purpose**: Get the opencode session ID used for a step.

**Example**:

```typescript
const sessionId = await stateManager.getSessionForStep('exec-abc-123', 'implement-auth');
// sessionId = 'sess-xyz-789'
```

---

#### SM-OP-022: getStepsForSession

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-022    |
| **Type**         | Asynchronous |
| **Implements**   | HL-CM-003    |

**Signature**:

```typescript
async getStepsForSession(
  sessionId: string
): Promise<Array<{ executionId: string; stepId: string }>>
```

**Purpose**: Find all steps that used a specific session (reverse lookup).

**Example**:

```typescript
const steps = await stateManager.getStepsForSession('sess-xyz-789');
// steps = [{ executionId: 'exec-abc-123', stepId: 'implement-auth' }]
```

---

### 2.4 Interface: Checkpoint & Recovery

**Purpose**: Enable crash recovery through workflow state checkpoints.

**Consumers**: COMP-005 (Orchestrator), COMP-006 (API)

---

#### SM-OP-030: saveCheckpoint

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | SM-OP-030            |
| **Type**         | Asynchronous         |
| **Implements**   | HL-SR-001, HL-SR-002 |

**Signature**:

```typescript
async saveCheckpoint(executionId: string): Promise<string>
```

**Purpose**: Persist complete execution state as a checkpoint.

**Response Schema**:

| Field      | Type     | Description             |
| ---------- | -------- | ----------------------- |
| (resolved) | `string` | Path to checkpoint file |

**Postconditions**:

- Checkpoint includes: execution state, shared context, step-session mappings
- Written atomically (temp file + rename)
- Checksum calculated for integrity
- Returns path to saved file

**Example**:

```typescript
const checkpointPath = await stateManager.saveCheckpoint('exec-abc-123');
// checkpointPath = '.flomaster/executions/exec-abc-123/checkpoint.json'
```

---

#### SM-OP-031: loadCheckpoint

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-031    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-002    |

**Signature**:

```typescript
async loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null>
```

**Purpose**: Load a checkpoint for crash recovery.

**Response Schema** (`ExecutionCheckpoint`):

| Field             | Type                     | Description                 |
| ----------------- | ------------------------ | --------------------------- |
| `executionId`     | `string`                 | Execution identifier        |
| `workflowName`    | `string`                 | Workflow being executed     |
| `execution`       | `WorkflowExecution`      | Full execution state        |
| `context`         | `SharedContext`          | Shared context snapshot     |
| `sessionMappings` | `Record<string, string>` | Step-to-session mappings    |
| `timestamp`       | `string`                 | When checkpoint was created |
| `checksum`        | `string`                 | SHA-256 for integrity       |
| `version`         | `string`                 | Schema version              |

**Postconditions**:

- Checksum verified on load
- Returns null if checkpoint doesn't exist or is corrupted

**Example**:

```typescript
const checkpoint = await stateManager.loadCheckpoint('exec-abc-123');
if (checkpoint) {
  console.log(`Resume from: ${checkpoint.execution.status}`);
}
```

---

#### SM-OP-032: listIncompleteExecutions

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-032    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-002    |

**Signature**:

```typescript
async listIncompleteExecutions(): Promise<IncompleteExecution[]>
```

**Purpose**: Scan for executions that did not complete (for crash recovery on startup).

**Response Schema** (`IncompleteExecution`):

| Field            | Type              | Description                 |
| ---------------- | ----------------- | --------------------------- |
| `executionId`    | `string`          | Execution identifier        |
| `workflowName`   | `string`          | Workflow being executed     |
| `status`         | `ExecutionStatus` | Last known status           |
| `completedSteps` | `string[]`        | IDs of completed steps      |
| `lastUpdated`    | `string`          | Last update timestamp       |
| `isRecoverable`  | `boolean`         | Whether checkpoint is valid |

**Postconditions**:

- Returns executions with status CREATED, RUNNING, or PAUSED
- Each entry includes whether it has a valid checkpoint

**Example**:

```typescript
const incomplete = await stateManager.listIncompleteExecutions();
for (const exec of incomplete) {
  if (exec.isRecoverable) {
    console.log(`Can resume: ${exec.executionId}`);
  }
}
```

---

#### SM-OP-033: setRecoverable

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-033    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-002    |

**Signature**:

```typescript
async setRecoverable(executionId: string, recoverable: boolean): Promise<void>
```

**Purpose**: Set whether an execution can be recovered from checkpoint.

**Postconditions**:

- Execution's recoverable flag updated
- State persisted atomically

---

#### SM-OP-034: hasCheckpoint

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-034    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-002    |

**Signature**:

```typescript
async hasCheckpoint(executionId: string): Promise<boolean>
```

**Purpose**: Check if a valid checkpoint exists for an execution.

**Postconditions**:

- Returns true if checkpoint file exists and passes integrity check
- Returns false if no checkpoint or corrupted

**Example**:

```typescript
if (await stateManager.hasCheckpoint('exec-abc-123')) {
  const checkpoint = await stateManager.loadCheckpoint('exec-abc-123');
}
```

---

#### SM-OP-035: isExecutionActive

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | SM-OP-035   |
| **Type**         | Synchronous |
| **Implements**   | HL-SR-001   |

**Signature**:

```typescript
isExecutionActive(executionId: string): boolean
```

**Purpose**: Check if an execution is currently active (in memory, being processed).

**Postconditions**:

- Returns true if execution is cached and has status CREATED, RUNNING, or PAUSED
- Returns false if execution not cached or has terminal status

**Example**:

```typescript
if (stateManager.isExecutionActive('exec-abc-123')) {
  console.log('Execution is in progress');
}
```

---

### 2.5 Interface: Session Queries via SDK

**Purpose**: Expose session details from opencode SDK for UI display.

**Consumers**: COMP-006 (API), COMP-007 (User Interface)

---

#### SM-OP-040: getSessionDetails

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-040    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-003    |

**Signature**:

```typescript
async getSessionDetails(sessionId: string): Promise<SessionDetails | null>
```

**Purpose**: Get session details from opencode SDK.

**Response Schema** (`SessionDetails`):

| Field       | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| `id`        | `string` | Session identifier           |
| `title`     | `string` | Session title                |
| `createdAt` | `string` | Creation timestamp           |
| `updatedAt` | `string` | Last update timestamp        |
| `parentId`  | `string` | Parent session ID (if child) |

**Implementation Note**: Delegates to `sdkClient.session.get()`.

**Example**:

```typescript
const session = await stateManager.getSessionDetails('sess-xyz-789');
if (session) {
  console.log(`Session: ${session.title}`);
}
```

---

#### SM-OP-041: getSessionMessages

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-041    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-003    |

**Signature**:

```typescript
async getSessionMessages(sessionId: string): Promise<SessionMessage[]>
```

**Purpose**: Get message history from opencode SDK.

**Response Schema** (`SessionMessage`):

| Field       | Type                    | Description           |
| ----------- | ----------------------- | --------------------- |
| `id`        | `string`                | Message identifier    |
| `role`      | `'user' \| 'assistant'` | Message role          |
| `parts`     | `MessagePart[]`         | Message content parts |
| `createdAt` | `string`                | Creation timestamp    |

**Implementation Note**: Delegates to `sdkClient.session.messages()`.

**Example**:

```typescript
const messages = await stateManager.getSessionMessages('sess-xyz-789');
for (const msg of messages) {
  console.log(`${msg.role}: ${msg.parts.length} parts`);
}
```

---

#### SM-OP-042: getSessionChildren

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | SM-OP-042    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-003    |

**Signature**:

```typescript
async getSessionChildren(sessionId: string): Promise<SessionDetails[]>
```

**Purpose**: Get child sessions (e.g., for subagent executions).

**Implementation Note**: Delegates to `sdkClient.session.children()`.

---

## 3. Required Interfaces

### 3.1 From AI Execution Layer (opencode SDK)

| Operation            | Purpose             | When Called |
| -------------------- | ------------------- | ----------- |
| `session.get()`      | Get session details | SM-OP-040   |
| `session.messages()` | Get message history | SM-OP-041   |
| `session.children()` | Get child sessions  | SM-OP-042   |

**Assumptions**:

- opencode SDK is available and authenticated
- Session IDs are valid opencode session identifiers

**Failure Handling**:

- If SDK call fails: Return null or empty array, log error
- If session not found: Return null (don't throw)

---

## 4. Events Published

The State Manager does not directly publish events. State changes are communicated through return values and the Orchestrator emits events based on state transitions.

---

## 5. Invariants

| Invariant                 | Description                                          | Enforcement                          |
| ------------------------- | ---------------------------------------------------- | ------------------------------------ |
| Atomic Writes             | State files never partially written                  | Temp file + atomic rename            |
| Concurrent Write Safety   | No lost updates from concurrent writes               | Mutex lock per executionId           |
| Context Isolation         | Steps cannot modify other steps' outputs             | Write-once per step ID               |
| Checkpoint Integrity      | Checkpoints validated on load                        | SHA-256 checksum verification        |
| Single Source of Truth    | Files are authoritative, cache is derived            | All reads load from disk if uncached |
| Session Mapping Immutable | Once mapped, step-session association doesn't change | No update operation                  |

---

## 6. Performance Expectations

| Operation     | Expected Latency | Throughput | Notes                        |
| ------------- | ---------------- | ---------- | ---------------------------- |
| SM-OP-001     | < 50ms           | N/A        | Directory + file creation    |
| SM-OP-002     | < 10ms           | N/A        | Memory lookup or file read   |
| SM-OP-003-004 | < 50ms           | N/A        | Memory update + atomic write |
| SM-OP-010-013 | < 20ms           | N/A        | Memory operations            |
| SM-OP-020-022 | < 50ms           | N/A        | Memory + atomic write        |
| SM-OP-030     | < 100ms          | N/A        | Full state serialization     |
| SM-OP-031     | < 50ms           | N/A        | File read + validation       |
| SM-OP-032     | < 200ms          | N/A        | Directory scan               |
| SM-OP-033     | < 50ms           | N/A        | Memory update + atomic write |
| SM-OP-034     | < 20ms           | N/A        | File existence + checksum    |
| SM-OP-035     | < 1ms            | N/A        | In-memory lookup             |
| SM-OP-040-042 | < 200ms          | N/A        | SDK call (network dependent) |

---

## 7. Type Definitions

### 7.1 Execution Status Enum

```typescript
export enum ExecutionStatus {
  /** Execution created but not started */
  CREATED = 'CREATED',
  /** Execution is running */
  RUNNING = 'RUNNING',
  /** Execution is paused (human approval) */
  PAUSED = 'PAUSED',
  /** Execution completed successfully */
  COMPLETED = 'COMPLETED',
  /** Execution failed */
  FAILED = 'FAILED',
  /** Execution was cancelled */
  CANCELLED = 'CANCELLED',
}
```

### 7.2 Step Execution Status Enum

```typescript
export enum StepExecutionStatus {
  /** Step not yet started */
  PENDING = 'PENDING',
  /** Step currently executing */
  RUNNING = 'RUNNING',
  /** Step completed successfully */
  COMPLETED = 'COMPLETED',
  /** Step failed */
  FAILED = 'FAILED',
  /** Step skipped (conditional) */
  SKIPPED = 'SKIPPED',
  /** Step waiting for human approval */
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  /** Step waiting for human input */
  WAITING_INPUT = 'WAITING_INPUT',
}
```

### 7.3 Supporting Types

```typescript
export interface WorkflowExecution {
  executionId: string;
  workflowName: string;
  status: ExecutionStatus;
  stepStatuses: Record<string, StepExecutionStatus>;
  stepResults: Record<string, StepResult>;
  createdAt: string;
  updatedAt: string;
}

export interface StepResult {
  status: StepExecutionStatus;
  outputs?: Record<string, unknown>;
  error?: string;
  errorHistory?: StepError[];
  startTime: number;
  endTime: number;
  retryCount?: number;
  sessionId?: string;
}

export interface StepError {
  /** Error message */
  message: string;
  /** Error code for classification */
  code?: string;
  /** When the error occurred (ISO 8601) */
  timestamp: string;
  /** Which attempt this error occurred on (1-indexed) */
  attemptNumber: number;
  /** Whether this error is retryable */
  retryable?: boolean;
}

export type SharedContext = Record<string, Record<string, unknown>>;

export interface ExecutionCheckpoint {
  executionId: string;
  workflowName: string;
  execution: WorkflowExecution;
  context: SharedContext;
  sessionMappings: Record<string, string>;
  timestamp: string;
  checksum: string;
  version: string;
}

export interface ExecutionFilter {
  status?: ExecutionStatus | ExecutionStatus[];
  since?: string;
  limit?: number;
}

export interface ExecutionSummary {
  executionId: string;
  workflowName: string;
  status: ExecutionStatus;
  stepCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncompleteExecution {
  executionId: string;
  workflowName: string;
  status: ExecutionStatus;
  completedSteps: string[];
  lastUpdated: string;
  isRecoverable: boolean;
}

export interface SessionDetails {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: MessagePart[];
  createdAt: string;
}

export interface MessagePart {
  type: 'text' | 'tool_use' | 'tool_result';
  content: unknown;
}

export interface StateManagerConfig {
  executionsDir?: string; // Default: '.flomaster/executions'
  checkpointOnStepComplete?: boolean; // Default: true
}
```

---

## 8. Versioning and Compatibility

### 8.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Checkpoint Schema Version**  | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 8.2 Migration Strategy

Checkpoint files include a `version` field. If schema changes, migration functions convert older checkpoints to the current format on load.

---

## 9. Traceability

### 9.1 HL Requirement to Operation Mapping

| Requirement | Description                            | Operations                                         |
| ----------- | -------------------------------------- | -------------------------------------------------- |
| HL-SR-001   | Persistent Step Execution State        | SM-OP-001 to SM-OP-007                             |
| HL-SR-002   | Crash Recovery and Workflow Resumption | SM-OP-030 to SM-OP-034                             |
| HL-SR-003   | Execution Artifact Storage             | SM-OP-040 to SM-OP-042                             |
| HL-CM-002   | Context Persistence and Loading        | SM-OP-010 to SM-OP-013                             |
| HL-CM-003   | Session Management                     | SM-OP-020 to SM-OP-022                             |
| HL-WF-004   | Step Dependencies and Context Passing  | SM-OP-013                                          |
| NFR-REL-002 | State Integrity (no corruption)        | Invariants: Atomic Writes, Concurrent Write Safety |
| NFR-REL-005 | State Persistence After Step           | SM-OP-003, SM-OP-004                               |
| NFR-USE-001 | Inspectable State (JSON format)        | All file operations                                |

### 9.2 Operation Index

| Operation ID | Name                     | Type  | Implements           |
| ------------ | ------------------------ | ----- | -------------------- |
| SM-OP-001    | createExecution          | Async | HL-SR-001            |
| SM-OP-002    | getExecution             | Async | HL-SR-001            |
| SM-OP-003    | updateStepStatus         | Async | HL-SR-001            |
| SM-OP-004    | recordStepResult         | Async | HL-SR-001, HL-SR-003 |
| SM-OP-005    | getStepStatus            | Async | HL-SR-001            |
| SM-OP-006    | listExecutions           | Async | HL-SR-001            |
| SM-OP-007    | deleteExecution          | Async | HL-SR-001            |
| SM-OP-010    | getContext               | Async | HL-CM-002            |
| SM-OP-011    | setContextValue          | Async | HL-CM-002            |
| SM-OP-012    | getContextValue          | Async | HL-CM-002            |
| SM-OP-013    | mergeStepOutputs         | Async | HL-CM-002, HL-WF-004 |
| SM-OP-020    | mapStepToSession         | Async | HL-CM-003            |
| SM-OP-021    | getSessionForStep        | Async | HL-CM-003            |
| SM-OP-022    | getStepsForSession       | Async | HL-CM-003            |
| SM-OP-030    | saveCheckpoint           | Async | HL-SR-001, HL-SR-002 |
| SM-OP-031    | loadCheckpoint           | Async | HL-SR-002            |
| SM-OP-032    | listIncompleteExecutions | Async | HL-SR-002            |
| SM-OP-033    | setRecoverable           | Async | HL-SR-002            |
| SM-OP-034    | hasCheckpoint            | Async | HL-SR-002            |
| SM-OP-035    | isExecutionActive        | Sync  | HL-SR-001            |
| SM-OP-040    | getSessionDetails        | Async | HL-SR-003            |
| SM-OP-041    | getSessionMessages       | Async | HL-SR-003            |
| SM-OP-042    | getSessionChildren       | Async | HL-SR-003            |

---

## Document History

| Version | Date       | Author            | Changes                                                                |
| ------- | ---------- | ----------------- | ---------------------------------------------------------------------- |
| 1.0     | 2025-12-25 | Architecture Team | Initial version (facade over opencode SDK)                             |
| 1.1     | 2025-12-26 | Architecture Team | Added error history (HL-SR-001), concurrent write safety (NFR-REL-002) |
| 1.2     | 2025-12-26 | Architecture Team | Renamed Task → Step to avoid collision with Task Manager terminology   |
