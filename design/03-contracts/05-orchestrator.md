# Orchestrator - Interface Contract

> **Component ID**: COMP-005
> **Document Version**: 1.5
> **Last Updated**: 2025-12-25
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Architecture Overview](../01-overview/03-architecture-overview.md)
> - [Requirements Overview](../01-overview/02-requirements-overview.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **Orchestrator**, specifying the workflow execution, step coordination, validation utilities, and control operations it provides to other components. The Orchestrator uses a **flat DAG (Directed Acyclic Graph)** execution model where steps execute based on dependencies.

### 1.2 Component Summary

| Attribute                    | Value                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Component ID**             | COMP-005                                                                                                              |
| **Directory**                | `packages/core/src/orchestrator/`                                                                                     |
| **Interface**                | `WorkflowEngine`                                                                                                      |
| **Implementation**           | `DefaultWorkflowEngine`                                                                                               |
| **Type**                     | Core Engine                                                                                                           |
| **Layer**                    | Orchestration Layer                                                                                                   |
| **Responsibility**           | Workflow orchestration, dependency-based step execution, context building, validation, approval gates, crash recovery |
| **Provides Interfaces To**   | COMP-006 (API), COMP-007 (User Interface)                                                                             |
| **Requires Interfaces From** | COMP-001 (Config) for workflow definitions, pluggable executors for AI/Tool execution                                 |

### 1.3 Contract ID Convention

Operations follow the format: **OR-OP-XXX**

| Range         | Category           |
| ------------- | ------------------ |
| OR-OP-001-009 | Workflow Lifecycle |
| OR-OP-010-019 | Workflow Execution |
| OR-OP-020-029 | Execution Control  |
| OR-OP-030-039 | Crash Recovery     |
| OR-OP-040-049 | Event Subscription |
| OR-OP-050-059 | Query Operations   |

### 1.4 Execution Model

The Orchestrator uses a **flat DAG execution model**:

```
Workflow
  ├── Step A (no dependencies) ──────┐
  ├── Step B (no dependencies) ──────┼──► Step D (depends on A, B)
  └── Step C (depends on A) ─────────┘         │
                                               ▼
                                          Step E (depends on D)
```

**Key Characteristics:**

- Steps execute when all upstream dependencies are satisfied
- Independent steps execute in parallel automatically
- Each step gets a fresh AI session (prevents context rot)
- Shared context enables data passing between steps
- State is checkpointed after each step for crash recovery

### 1.5 Step Types

| Type                | Description                                    |
| ------------------- | ---------------------------------------------- |
| `Agent`             | AI agent execution with tools                  |
| `ConditionalRouter` | Branch based on condition evaluation           |
| `Loop`              | Iterate over collections                       |
| `SubFlow`           | Execute nested workflow                        |
| `Prompt`            | Template rendering with variable interpolation |
| `Tool`              | External tool execution                        |
| `Input`             | Workflow input step                            |
| `Output`            | Workflow output step                           |
| `HumanInput`        | Pause for user input                           |
| `Approval`          | Pause for user approval                        |
| `Generic`           | Pass-through step                              |

### 1.6 Context Model (Hybrid Approach)

> **Applies to**: Agent steps only. Other step types (Tool, Loop, etc.) receive inputs as function arguments.

The Orchestrator uses a **hybrid context model** that combines variable interpolation with context block appending:

#### Two Mechanisms

| Mechanism             | Use Case                      | Syntax                     |
| --------------------- | ----------------------------- | -------------------------- |
| **Interpolation**     | Small, specific values inline | `{{variable}}` in template |
| **Context Appending** | Large reference blocks at end | `<context>` XML block      |

#### How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Task Template (with interpolation)                                      │
│                                                                          │
│  "Implement the feature: {{task.title}}                                  │
│   Work on branch: {{setup-git.branch}}                                   │
│                                                                          │
│   Follow the coding standards and spec provided in context below."       │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Context Block (appended at runtime)                                     │
│                                                                          │
│  <context>                                                               │
│  <spec>                                                                  │
│  Build a user authentication system with OAuth support...                │
│  </spec>                                                                 │
│  <coding_standards>                                                      │
│  ... 500 lines of coding standards ...                                   │
│  </coding_standards>                                                     │
│  </context>                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step Configuration

```typescript
interface AgentStep {
  type: 'Agent';
  id: string;
  name: string;

  // Template with {{variable}} placeholders
  template: string;

  // Inputs for interpolation (small values)
  inputs: StepInput[];

  // Context blocks for appending (large reference material)
  context?: StepContext[];

  outputs: string[];
  tools?: string[];
  model?: string;
}

interface StepInput {
  name: string; // Variable name: {{name}}
  source: string; // "stepId.outputKey" or "external.key"
  required: boolean;
}

interface StepContext {
  name: string; // XML tag name: <name>...</name>
  source: string; // "stepId.outputKey" or file path/glob
  type: 'output' | 'file' | 'static';

  // For file type only:
  mode?: 'path' | 'contents'; // 'path' = just reference, 'contents' = embed file
  // Default: 'path' (agent uses tools to read)
}
```

#### Runtime Prompt Building

```typescript
// SharedContext structure: { [stepId]: { [outputKey]: value } }
type SharedContext = Record<string, Record<string, unknown>>;

function buildPrompt(step: AgentStep, sharedContext: SharedContext): string {
  // 1. Interpolate {{variables}} in template
  // Resolves "stepId.outputKey" from sharedContext
  let prompt = interpolate(step.template, sharedContext);

  // 2. Append context blocks
  if (step.context?.length) {
    prompt += '\n\n<context>\n';
    for (const ctx of step.context) {
      const value = resolveContextSource(ctx, sharedContext);
      if (value) {
        prompt += `<${ctx.name}>\n${value}\n</${ctx.name}>\n`;
      }
    }
    prompt += '</context>';
  }

  return prompt;
}
```

#### When to Use Each

| Use Interpolation `{{var}}` | Use Context Appending   |
| --------------------------- | ----------------------- |
| Step IDs, branch names      | Full spec documents     |
| Short strings               | Coding standards        |
| Values referenced inline    | File contents           |
| Configuration values        | Reference documentation |

#### File Context: Path vs Contents

```typescript
// Mode: 'path' (default) - Agent uses tools to read files
// Good for: Multiple/large files, dynamic access
context: [
  {
    name: 'coding_standards',
    source: '.claude/rules/**/*.md',
    type: 'file',
    mode: 'path', // Results in: <coding_standards>.claude/rules/**/*.md</coding_standards>
  },
];

// Mode: 'contents' - File contents embedded in prompt
// Good for: Small, critical files that must be in context
context: [
  {
    name: 'spec',
    source: '.flomaster/specs/current-task.md',
    type: 'file',
    mode: 'contents', // Results in: <spec>[actual file contents]</spec>
  },
];
```

| Mode       | When to Use                        | Prompt Size | Agent Access          |
| ---------- | ---------------------------------- | ----------- | --------------------- |
| `path`     | Multiple files, large files, globs | Small       | Agent reads via tools |
| `contents` | Critical context, must be visible  | Large       | Directly in prompt    |

#### Static Context

For inline constant values that don't come from step outputs or files:

```typescript
// Type: 'static' - Inline constant value
context: [
  {
    name: 'instructions',
    source: 'Always validate your changes by running tests before completing.',
    type: 'static',
  },
];
// Results in: <instructions>Always validate your changes by running tests before completing.</instructions>
```

| Type     | Source Value         | Use Case                       |
| -------- | -------------------- | ------------------------------ |
| `output` | `"taskId.outputKey"` | Previous step's output         |
| `file`   | File path or glob    | Files from filesystem          |
| `static` | Literal string       | Inline constants, instructions |

---

### 1.7 Constructor Configuration

The `WorkflowEngine` accepts optional configuration:

```typescript
interface WorkflowEngineConfig {
  workflowDir?: string; // Default: '.flomaster/workflows'
  snapshotDir?: string; // Default: '.flomaster/snapshots'
  defaultTimeout?: number; // Default: 300000 (5 minutes)
  defaultMaxRetries?: number; // Default: 3
}
```

| Field               | Type     | Default                | Description                              |
| ------------------- | -------- | ---------------------- | ---------------------------------------- |
| `workflowDir`       | `string` | `.flomaster/workflows` | Directory containing workflow JSON files |
| `snapshotDir`       | `string` | `.flomaster/snapshots` | Directory for crash recovery snapshots   |
| `defaultTimeout`    | `number` | `300000`               | Default execution timeout in ms          |
| `defaultMaxRetries` | `number` | `3`                    | Default retry attempts per step          |

### 1.8 TypeScript Interface

The Orchestrator follows the **Interface → Concrete Class** pattern for testability and flexibility:

```typescript
// ============================================================
// INTERFACE: Contract for WorkflowEngine
// ============================================================
interface WorkflowEngine {
  // Lifecycle (OR-OP-001, OR-OP-002)
  loadWorkflow(name: string): Promise<Workflow>;
  validateWorkflow(workflow: Workflow): Promise<ValidationResult>;

  // Execution (OR-OP-010)
  executeWorkflow(
    workflow: Workflow,
    taskId: string,
    options?: ExecutionOptions
  ): Promise<WorkflowResult>;

  // Control (OR-OP-020, OR-OP-021, OR-OP-022)
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string, decision: 'APPROVE' | 'REJECT' | 'REFINE', feedback?: string): Promise<void>;
  abortWorkflow(executionId: string): Promise<void>;

  // Recovery (OR-OP-030, OR-OP-031, OR-OP-032)
  getSnapshot(executionId: string): ExecutionSnapshot | null;
  saveSnapshot(executionId: string): Promise<string>;
  resumeFromSnapshot(snapshotPath: string): Promise<string>;

  // Events (OR-OP-040)
  subscribe(listener: WorkflowEventListener): Subscription;

  // Query (OR-OP-050, OR-OP-051, OR-OP-052, OR-OP-053, OR-OP-054)
  getActiveExecutions(): string[];
  isExecutionActive(executionId: string): boolean;
  getState(executionId: string): string | null;
  getProgress(executionId: string): ExecutionProgress | null;
  getContext(executionId: string): Record<string, Record<string, unknown>> | null;
}

// ============================================================
// CONCRETE CLASS: Default implementation
// ============================================================
class DefaultWorkflowEngine implements WorkflowEngine {
  constructor(config?: WorkflowEngineConfig) { ... }
  // All interface methods implemented
}
```

**Pattern Benefits**:

| Benefit       | How                                                 |
| ------------- | --------------------------------------------------- |
| Testability   | Mock `WorkflowEngine` interface in unit tests       |
| Flexibility   | Swap implementations (e.g., `RemoteWorkflowEngine`) |
| Documentation | Interface serves as executable contract             |
| Type Safety   | TypeScript enforces interface compliance            |

**Exports**:

```typescript
// Export interface for consumers to type against
export type { WorkflowEngine };

// Export concrete implementation
export { DefaultWorkflowEngine };

// Export config type
export type { WorkflowEngineConfig };
```

---

## 2. Provided Interfaces

### 2.1 Interface: Workflow Lifecycle

**Purpose**: Load and validate workflow definitions.

**Consumers**: COMP-006 (API)

---

#### OR-OP-001: loadWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-001    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-002    |

**Signature**:

```typescript
async loadWorkflow(name: string): Promise<Workflow>
```

**Purpose**: Load a workflow definition from a JSON file.

**Request Schema**:

| Field  | Type     | Required | Constraints                  | Description                        |
| ------ | -------- | -------- | ---------------------------- | ---------------------------------- |
| `name` | `string` | Yes      | Valid identifier or filepath | Workflow name or path to JSON file |

**Response Schema**:

| Field         | Type           | Description                    |
| ------------- | -------------- | ------------------------------ |
| `tasks`       | `Step[]`       | Array of step definitions      |
| `connections` | `Connection[]` | Array of step connections      |
| `viewport`    | `ViewPort`     | Optional canvas viewport state |

**Preconditions**:

- Workflow file must exist at `.flomaster/workflows/{name}.json` or at specified path
- File must contain valid JSON

**Postconditions**:

- Returns parsed `Workflow` object
- File is read but not cached (stateless)

**Error Conditions**:

| Error Code               | Condition          | Caller Action            |
| ------------------------ | ------------------ | ------------------------ |
| `ERR_WORKFLOW_NOT_FOUND` | File doesn't exist | Check workflow name/path |
| `ERR_INVALID_JSON`       | JSON syntax error  | Fix JSON syntax          |

**Example**:

```typescript
// Load by name
const workflow = await engine.loadWorkflow('sdlc');

// Load by path
const workflow = await engine.loadWorkflow('/path/to/workflow.json');
```

---

#### OR-OP-002: validateWorkflow

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | OR-OP-002            |
| **Type**         | Asynchronous         |
| **Implements**   | HL-WF-002, HL-VL-001 |

**Signature**:

```typescript
async validateWorkflow(workflow: Workflow): Promise<ValidationResult>
```

**Purpose**: Validate a workflow for structural correctness before execution.

**Request Schema**:

| Field      | Type       | Required | Description              |
| ---------- | ---------- | -------- | ------------------------ |
| `workflow` | `Workflow` | Yes      | The workflow to validate |

**Response Schema**:

| Field      | Type                  | Description                |
| ---------- | --------------------- | -------------------------- |
| `valid`    | `boolean`             | Whether workflow is valid  |
| `errors`   | `ValidationError[]`   | Blocking validation errors |
| `warnings` | `ValidationWarning[]` | Non-blocking warnings      |

**Postconditions**:

- Schema validation performed
- Cycle detection performed (invalid cycles reported)
- Entry/exit points identified
- Returns validation result with errors and warnings

**Error Conditions**:

| Error Code       | Condition                       | Caller Action                   |
| ---------------- | ------------------------------- | ------------------------------- |
| `CYCLE_DETECTED` | Workflow contains invalid cycle | Remove circular dependencies    |
| `PARSE_ERROR`    | Workflow structure invalid      | Fix workflow structure          |
| `SCHEMA_INVALID` | Schema validation failed        | Fix step/connection definitions |

**Example**:

```typescript
const result = await engine.validateWorkflow(workflow);
if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

---

### 2.2 Interface: Workflow Execution

**Purpose**: Execute workflows and manage the execution lifecycle.

**Consumers**: COMP-006 (API)

---

#### OR-OP-010: executeWorkflow

| Attribute        | Value                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Operation ID** | OR-OP-010                                                                              |
| **Type**         | Asynchronous                                                                           |
| **Implements**   | HL-WF-001, HL-WF-003, HL-WF-004, HL-WF-005, HL-WF-006, HL-WF-009, HL-CM-001, HL-CM-002 |

**Signature**:

```typescript
async executeWorkflow(
  workflow: Workflow,
  taskId: string,
  options?: ExecutionOptions
): Promise<WorkflowResult>
```

**Purpose**: Execute a complete workflow for a given task.

**Request Schema**:

| Field                     | Type                      | Required | Constraints    | Description                          |
| ------------------------- | ------------------------- | -------- | -------------- | ------------------------------------ |
| `workflow`                | `Workflow`                | Yes      | Valid workflow | The workflow to execute              |
| `taskId`                  | `string`                  | Yes      | Non-empty      | Task identifier for tracking         |
| `options.signal`          | `AbortSignal`             | No       | -              | Abort signal for cancellation        |
| `options.timeout`         | `number`                  | No       | > 0            | Max execution time in ms             |
| `options.dryRun`          | `boolean`                 | No       | -              | If true, mock AI responses           |
| `options.variables`       | `Record<string, unknown>` | No       | -              | Variables to inject into context     |
| `options.previousOutputs` | `Record<string, unknown>` | No       | -              | Outputs from previous execution      |
| `options.resumeFrom`      | `string`                  | No       | Valid step ID  | Step to resume from                  |
| `options.autoApprove`     | `boolean`                 | No       | -              | If true, auto-approve approval steps |

**Response Schema**:

| Field           | Type                      | Description                       |
| --------------- | ------------------------- | --------------------------------- |
| `executionId`   | `string`                  | Unique execution identifier       |
| `terminateMode` | `WorkflowTerminateMode`   | How workflow terminated           |
| `outputs`       | `Record<string, unknown>` | All step outputs (shared context) |
| `duration`      | `number`                  | Total duration in milliseconds    |
| `taskResults`   | `StepResult[]`            | Results of each step execution    |
| `error`         | `string`                  | Error message if failed           |
| `startTime`     | `number`                  | Timestamp when execution started  |
| `endTime`       | `number`                  | Timestamp when execution ended    |

**StepResult Schema**:

| Field         | Type                      | Description                                                    |
| ------------- | ------------------------- | -------------------------------------------------------------- |
| `taskId`      | `string`                  | Unique step identifier                                         |
| `displayName` | `string`                  | Human-readable step name                                       |
| `status`      | `StepStatus`              | PENDING, RUNNING, COMPLETED, FAILED, SKIPPED, WAITING_APPROVAL |
| `outputs`     | `Record<string, unknown>` | Step output data                                               |
| `error`       | `string`                  | Error message if failed (optional)                             |
| `stackTrace`  | `string`                  | Stack trace if failed (optional)                               |
| `startTime`   | `number`                  | Timestamp when step started                                    |
| `endTime`     | `number`                  | Timestamp when step ended (optional)                           |
| `duration`    | `number`                  | Duration in ms (optional)                                      |
| `retryCount`  | `number`                  | Number of retry attempts                                       |

**Terminate Modes**:

| Mode        | Description                      |
| ----------- | -------------------------------- |
| `COMPLETED` | All steps executed successfully  |
| `FAILED`    | Unrecoverable error occurred     |
| `CANCELLED` | Execution was aborted by user    |
| `TIMEOUT`   | Execution exceeded timeout limit |

**Preconditions**:

- Workflow should be validated (OR-OP-002)
- `taskId` must be non-empty string

**Postconditions**:

- XState machine is created and executed
- Steps execute in dependency order (topologically sorted)
- Independent steps execute in parallel
- Each step gets fresh context
- `WORKFLOW_STARTED` event emitted at start
- `WORKFLOW_COMPLETED` or `WORKFLOW_FAILED` event emitted at end
- All step outputs stored in shared context
- Returns `WorkflowResult` with complete execution data

**Error Conditions**:

| Error Code         | Condition                  | Caller Action             |
| ------------------ | -------------------------- | ------------------------- |
| `ERR_PARSE_FAILED` | Workflow parsing failed    | Fix workflow structure    |
| `ERR_STEP_FAILED`  | Step execution failed      | Check step configuration  |
| `ERR_TIMEOUT`      | Execution exceeded timeout | Increase timeout or abort |

**Example**:

```typescript
const result = await engine.executeWorkflow(workflow, 'TASK-123', {
  timeout: 300000,
  variables: { projectPath: '/path/to/project' },
});

if (result.terminateMode === 'COMPLETED') {
  console.log('Outputs:', result.outputs);
}
```

---

### 2.3 Interface: Execution Control

**Purpose**: Control active workflow executions (pause, resume, abort).

**Consumers**: COMP-006 (API)

---

#### OR-OP-020: pauseWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-020    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-007    |

**Signature**:

```typescript
async pauseWorkflow(executionId: string): Promise<void>
```

**Purpose**: Pause a running workflow for human approval.

**Preconditions**:

- Execution must be active (in `activeExecutions` map)
- Execution must be in a pausable state

**Postconditions**:

- State machine transitions to `awaitingApproval` state
- Execution is paused until resume or abort

**Error Conditions**:

| Error Code                | Condition               | Caller Action      |
| ------------------------- | ----------------------- | ------------------ |
| `ERR_EXECUTION_NOT_FOUND` | Execution doesn't exist | Check execution ID |

---

#### OR-OP-021: resumeWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-021    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-007    |

**Signature**:

```typescript
async resumeWorkflow(
  executionId: string,
  decision: 'APPROVE' | 'REJECT' | 'REFINE',
  feedback?: string
): Promise<void>
```

**Purpose**: Resume a paused workflow with an approval decision.

**Request Schema**:

| Field         | Type                                | Required | Description                               |
| ------------- | ----------------------------------- | -------- | ----------------------------------------- |
| `executionId` | `string`                            | Yes      | The execution to resume                   |
| `decision`    | `'APPROVE' \| 'REJECT' \| 'REFINE'` | Yes      | User's decision                           |
| `feedback`    | `string`                            | No       | Feedback for REFINE (injected as context) |

**Preconditions**:

- Execution must be in `awaitingApproval` state

**Postconditions**:

- If `APPROVE`: Execution continues from paused step
- If `REJECT`: Execution transitions to `failed` state
- If `REFINE`: Step re-executes with feedback injected into context
- `APPROVAL_RECEIVED` event emitted

**Error Conditions**:

| Error Code                | Condition               | Caller Action      |
| ------------------------- | ----------------------- | ------------------ |
| `ERR_EXECUTION_NOT_FOUND` | Execution doesn't exist | Check execution ID |

---

#### OR-OP-022: abortWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-022    |
| **Type**         | Asynchronous |
| **Implements**   | HL-WF-001    |

**Signature**:

```typescript
async abortWorkflow(executionId: string): Promise<void>
```

**Purpose**: Abort a running or paused workflow.

**Postconditions**:

- State machine transitions to `cancelled` state
- `WORKFLOW_CANCELLED` event emitted
- Execution removed from active executions

**Error Conditions**:

| Error Code                | Condition               | Caller Action      |
| ------------------------- | ----------------------- | ------------------ |
| `ERR_EXECUTION_NOT_FOUND` | Execution doesn't exist | Check execution ID |

---

### 2.4 Interface: Crash Recovery

**Purpose**: Persist and restore execution state for crash recovery.

**Consumers**: COMP-006 (API), COMP-003 (StateManager)

---

#### OR-OP-030: getSnapshot

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | OR-OP-030            |
| **Type**         | Synchronous          |
| **Implements**   | HL-SR-001, HL-SR-002 |

**Signature**:

```typescript
getSnapshot(executionId: string): ExecutionSnapshot | null
```

**Purpose**: Get the current execution snapshot for crash recovery.

**Response Schema** (`ExecutionSnapshot`):

| Field          | Type                      | Description                      |
| -------------- | ------------------------- | -------------------------------- |
| `executionId`  | `string`                  | Unique execution identifier      |
| `taskId`       | `string`                  | Associated task ID               |
| `machineState` | `unknown`                 | XState persisted snapshot        |
| `outputs`      | `Record<string, unknown>` | All step outputs so far          |
| `taskResults`  | `StepResult[]`            | Results of completed steps       |
| `timestamp`    | `number`                  | When snapshot was taken          |
| `version`      | `string`                  | Schema version for compatibility |

**Postconditions**:

- Returns null if execution not found
- Returns complete snapshot if execution is active

---

#### OR-OP-031: saveSnapshot

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-031    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-001    |

**Signature**:

```typescript
async saveSnapshot(executionId: string): Promise<string>
```

**Purpose**: Persist execution snapshot to disk.

**Postconditions**:

- Snapshot saved to `.flomaster/snapshots/{executionId}.json`
- Returns path to saved file

**Error Conditions**:

| Error Code                | Condition               | Caller Action      |
| ------------------------- | ----------------------- | ------------------ |
| `ERR_EXECUTION_NOT_FOUND` | Execution doesn't exist | Check execution ID |

---

#### OR-OP-032: resumeFromSnapshot

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | OR-OP-032    |
| **Type**         | Asynchronous |
| **Implements**   | HL-SR-002    |

**Signature**:

```typescript
async resumeFromSnapshot(snapshotPath: string): Promise<string>
```

**Purpose**: Resume execution from a persisted snapshot.

**Postconditions**:

- XState actor created from persisted state
- Execution continues from last checkpoint
- Returns the execution ID

**Error Conditions**:

| Error Code               | Condition               | Caller Action       |
| ------------------------ | ----------------------- | ------------------- |
| `ERR_SNAPSHOT_NOT_FOUND` | File doesn't exist      | Check snapshot path |
| `ERR_INVALID_SNAPSHOT`   | Invalid snapshot format | Check snapshot file |

---

### 2.5 Interface: Event Subscription

**Purpose**: Subscribe to workflow execution events.

**Consumers**: COMP-006 (API)

---

#### OR-OP-040: subscribe

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-040   |
| **Type**         | Synchronous |
| **Implements**   | HL-EV-001   |

**Signature**:

```typescript
subscribe(listener: WorkflowEventListener): Subscription
```

**Purpose**: Subscribe to workflow execution events.

**Request Schema**:

| Field      | Type                    | Required | Description         |
| ---------- | ----------------------- | -------- | ------------------- |
| `listener` | `WorkflowEventListener` | Yes      | Callback for events |

**Response Schema** (`Subscription`):

| Field         | Type         | Description             |
| ------------- | ------------ | ----------------------- |
| `unsubscribe` | `() => void` | Function to unsubscribe |

**Postconditions**:

- Listener receives all workflow events
- Listener can unsubscribe at any time

---

### 2.6 Interface: Query Operations

**Purpose**: Query execution state and progress.

**Consumers**: COMP-006 (API)

---

#### OR-OP-050: getActiveExecutions

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-050   |
| **Type**         | Synchronous |
| **Implements**   | HL-WF-001   |

**Signature**:

```typescript
getActiveExecutions(): string[]
```

**Purpose**: Get IDs of all currently active executions.

---

#### OR-OP-051: isExecutionActive

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-051   |
| **Type**         | Synchronous |
| **Implements**   | HL-WF-001   |

**Signature**:

```typescript
isExecutionActive(executionId: string): boolean
```

**Purpose**: Check if a specific execution is currently active.

---

#### OR-OP-052: getState

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-052   |
| **Type**         | Synchronous |
| **Implements**   | HL-WF-001   |

**Signature**:

```typescript
getState(executionId: string): string | null
```

**Purpose**: Get current state of an execution.

**Response**:

Returns the current XState state value. Possible values:

| State                     | Description                     |
| ------------------------- | ------------------------------- |
| `idle`                    | Not started                     |
| `preparing`               | Parsing workflow                |
| `executing.pickNext`      | Selecting next step             |
| `executing.runStep`       | Executing current step          |
| `executing.processResult` | Processing step output          |
| `executing.handleError`   | Handling step error             |
| `awaitingApproval`        | Paused for human approval       |
| `completed`               | All steps finished successfully |
| `failed`                  | Unrecoverable error             |
| `cancelled`               | Aborted by user                 |

---

#### OR-OP-053: getProgress

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-053   |
| **Type**         | Synchronous |
| **Implements**   | HL-WF-001   |

**Signature**:

```typescript
getProgress(executionId: string): {
  completed: string[];
  running: string[];
  pending: string[];
} | null
```

**Purpose**: Get execution progress showing completed, running, and pending steps.

---

#### OR-OP-054: getContext

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | OR-OP-054   |
| **Type**         | Synchronous |
| **Implements**   | HL-CM-002   |

**Signature**:

```typescript
getContext(executionId: string): Record<string, Record<string, unknown>> | null
```

**Purpose**: Get the shared context (all step outputs) for an execution.

---

## 3. Required Interfaces

### 3.1 Dependencies on Config (COMP-001)

| Operation                 | Purpose                  | When Called               |
| ------------------------- | ------------------------ | ------------------------- |
| Load workflow definitions | Get workflow JSON files  | OR-OP-001 (loadWorkflow)  |
| Get workflow directory    | Determine file paths     | Engine initialization     |
| Get snapshot directory    | Determine snapshot paths | Crash recovery operations |

**Assumptions**:

- Config provides `workflowDir` path
- Config provides `snapshotDir` path

**Failure Handling**:

- If config unavailable: Use default paths (`.flomaster/workflows`, `.flomaster/snapshots`)

### 3.2 Pluggable Executors

The Orchestrator accepts pluggable executors for AI and tool execution:

#### ExecuteAgent

```typescript
type ExecuteAgent = (
  config: AgentConfig,
  inputs: Record<string, unknown>,
  options?: {
    signal?: AbortSignal;
    onStream?: (chunk: string) => void;
  }
) => Promise<{
  response: string;
  toolCalls?: Array<{ name: string; args: unknown; result: unknown }>;
  usage?: { promptTokens: number; completionTokens: number };
}>;
```

**Purpose**: Execute AI agent steps.

**Provided via**: `ExecutionOptions` or dependency injection.

#### ExecuteTool

```typescript
type ExecuteTool = (
  config: ToolConfig,
  inputs: Record<string, unknown>
) => Promise<{
  result: unknown;
  success: boolean;
  error?: string;
}>;
```

**Purpose**: Execute tool steps.

#### SubFlowDependencies

```typescript
interface SubFlowDependencies {
  loadFlow: (nameOrId: string) => Promise<Workflow>;
  executeWorkflow: (
    workflow: Workflow,
    taskId: string,
    inputs: Record<string, unknown>
  ) => Promise<WorkflowResult>;
}
```

**Purpose**: Enable nested workflow execution.

---

## 4. Events Published

| Event                | When Published                    | Payload                                |
| -------------------- | --------------------------------- | -------------------------------------- |
| `WORKFLOW_STARTED`   | Execution begins                  | `{ executionId, taskId }`              |
| `WORKFLOW_COMPLETED` | All steps complete successfully   | `{ executionId, outputs }`             |
| `WORKFLOW_FAILED`    | Unrecoverable error occurs        | `{ executionId, error }`               |
| `WORKFLOW_CANCELLED` | Execution aborted by user         | `{ executionId }`                      |
| `STEP_STARTED`       | Step begins execution             | `{ executionId, taskId, displayName }` |
| `STEP_COMPLETED`     | Step completes successfully       | `{ executionId, taskId, outputs }`     |
| `STEP_FAILED`        | Step fails                        | `{ executionId, taskId, error }`       |
| `STEP_SKIPPED`       | Step skipped (conditional branch) | `{ executionId, taskId, reason }`      |
| `CONTEXT_UPDATED`    | Shared context updated            | `{ executionId, taskId, context }`     |
| `APPROVAL_REQUIRED`  | Human input step reached          | `{ executionId, taskId, data }`        |
| `APPROVAL_RECEIVED`  | User provided approval decision   | `{ executionId, taskId, decision }`    |

**Event Type Definition**:

```typescript
type WorkflowEvent =
  | { type: 'WORKFLOW_STARTED'; executionId: string; taskId: string }
  | { type: 'WORKFLOW_COMPLETED'; executionId: string; outputs: Record<string, unknown> }
  | { type: 'WORKFLOW_FAILED'; executionId: string; error: string }
  | { type: 'WORKFLOW_CANCELLED'; executionId: string }
  | { type: 'STEP_STARTED'; executionId: string; taskId: string; displayName: string }
  | {
      type: 'STEP_COMPLETED';
      executionId: string;
      taskId: string;
      outputs: Record<string, unknown>;
    }
  | { type: 'STEP_FAILED'; executionId: string; taskId: string; error: string }
  | { type: 'STEP_SKIPPED'; executionId: string; taskId: string; reason: string }
  | {
      type: 'CONTEXT_UPDATED';
      executionId: string;
      taskId: string;
      context: Record<string, unknown>;
    }
  | { type: 'APPROVAL_REQUIRED'; executionId: string; taskId: string; data: unknown }
  | { type: 'APPROVAL_RECEIVED'; executionId: string; taskId: string; decision: string };
```

---

## 5. Events Subscribed

The Orchestrator does not subscribe to external events. It is the primary event producer for workflow execution.

---

## 6. Invariants

| Invariant                     | Description                                               | Enforcement                                 |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| **Single execution per ID**   | Each executionId maps to exactly one active execution     | Map-based storage with unique ID generation |
| **Dependency order**          | Steps only execute after all dependencies complete        | Topological sort + pending step tracking    |
| **No invalid cycles**         | Workflow cannot contain cycles (except valid loop cycles) | Cycle detection during parsing              |
| **Fresh context per step**    | Each step gets isolated context (prevents context rot)    | Context built per step, not shared mutably  |
| **Atomic state transitions**  | State persisted after each step completes                 | XState snapshot + file persistence          |
| **Isolated handler failures** | Event handler errors don't affect other handlers          | Try-catch around each listener invocation   |

---

## 7. Performance Expectations

| Operation     | Expected Latency | Throughput     | Notes                                      |
| ------------- | ---------------- | -------------- | ------------------------------------------ |
| OR-OP-001     | < 100ms          | N/A            | File I/O dependent                         |
| OR-OP-002     | < 200ms          | N/A            | Workflow complexity dependent              |
| OR-OP-010     | N/A              | Parallel steps | Duration depends on steps and AI responses |
| OR-OP-020-022 | < 10ms           | N/A            | State machine transitions                  |
| OR-OP-030     | < 10ms           | N/A            | In-memory snapshot                         |
| OR-OP-031     | < 500ms          | N/A            | File I/O dependent                         |
| OR-OP-040     | < 1ms            | N/A            | Set insertion                              |
| OR-OP-050-054 | < 5ms            | N/A            | In-memory lookups                          |

**Parallel Execution**:

- Independent steps (no shared dependencies) execute in parallel automatically
- Parallel execution overhead < 10% vs longest single step (NFR-PERF-004)

---

## 8. Versioning and Compatibility

### 8.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 8.2 Deprecation Policy

Deprecated operations are marked and supported for 2 major versions before removal.

---

## 9. Traceability

### 9.1 HL Requirement to Operation Mapping

| Requirement | Description                            | Operations                                                 |
| ----------- | -------------------------------------- | ---------------------------------------------------------- |
| HL-WF-001   | Autonomous Multi-Step Execution        | OR-OP-010, OR-OP-050-054                                   |
| HL-WF-002   | Declarative Workflow Definitions       | OR-OP-001, OR-OP-002                                       |
| HL-WF-003   | Dependency-Based Execution             | OR-OP-010                                                  |
| HL-WF-004   | Step Dependencies and Context Passing  | OR-OP-010, OR-OP-054                                       |
| HL-WF-005   | Conditional Execution                  | OR-OP-010 (ConditionalRouter steps)                        |
| HL-WF-006   | Iterative Execution                    | OR-OP-010 (Loop steps)                                     |
| HL-WF-007   | Human Approval Gates                   | OR-OP-020, OR-OP-021                                       |
| HL-WF-008   | Dynamic Workflow Adaptation            | OR-OP-010 (Loop steps, variable-length outputs)            |
| HL-WF-009   | Loop Execution                         | OR-OP-010 (Loop steps)                                     |
| HL-CM-001   | Context Building from Multiple Sources | OR-OP-010, Section 1.6 (AgentStep, StepInput, StepContext) |
| HL-CM-002   | Context Persistence and Loading        | OR-OP-010, OR-OP-054 (SharedContext)                       |
| HL-CM-003   | Session Management                     | OR-OP-010 (fresh session per step)                         |
| HL-CM-004   | Optional and Required Context Items    | OR-OP-010, StepInput.required, StepContext                 |
| HL-VL-001   | Schema-Based Output Validation         | OR-OP-002, OR-OP-010                                       |
| HL-VL-002   | Structured Output for Workflow Control | OR-OP-010                                                  |
| HL-VL-003   | Validation Retry with Error Feedback   | OR-OP-010 (retry logic)                                    |
| HL-VL-004   | AI-Powered Output Investigation        | OR-OP-010 (validation actors)                              |
| HL-VL-005   | Deterministic Validation Checks        | OR-OP-010 (validation utilities)                           |
| HL-SR-001   | Persistent Step Execution State        | OR-OP-030, OR-OP-031                                       |
| HL-SR-002   | Crash Recovery and Workflow Resumption | OR-OP-030, OR-OP-031, OR-OP-032                            |
| HL-EV-001   | Publish-Subscribe Event Architecture   | OR-OP-040, Section 4 Events                                |
| HL-EV-002   | Real-time Progress Streaming           | OR-OP-040, STEP\_\* events                                 |
| HL-EV-003   | Handler Isolation and Reliability      | Section 6 Invariants (isolated handler failures)           |
| HL-EV-004   | Two-Phase Stream Processing            | OR-OP-040 (transient + final events)                       |
| HL-OB-001   | Hierarchical Execution Tracing         | OR-OP-010 (executionId), OR-OP-040 (events with IDs)       |

### 9.2 Operation Index

| Operation ID | Name                | Type  | Implements                                                     |
| ------------ | ------------------- | ----- | -------------------------------------------------------------- |
| OR-OP-001    | loadWorkflow        | Async | HL-WF-002                                                      |
| OR-OP-002    | validateWorkflow    | Async | HL-WF-002, HL-VL-001                                           |
| OR-OP-010    | executeWorkflow     | Async | HL-WF-001,003,004,005,006,008,009, HL-CM-_, HL-VL-_, HL-OB-001 |
| OR-OP-020    | pauseWorkflow       | Async | HL-WF-007                                                      |
| OR-OP-021    | resumeWorkflow      | Async | HL-WF-007                                                      |
| OR-OP-022    | abortWorkflow       | Async | HL-WF-001                                                      |
| OR-OP-030    | getSnapshot         | Sync  | HL-SR-001, HL-SR-002                                           |
| OR-OP-031    | saveSnapshot        | Async | HL-SR-001                                                      |
| OR-OP-032    | resumeFromSnapshot  | Async | HL-SR-002                                                      |
| OR-OP-040    | subscribe           | Sync  | HL-EV-001, HL-EV-004                                           |
| OR-OP-050    | getActiveExecutions | Sync  | HL-WF-001                                                      |
| OR-OP-051    | isExecutionActive   | Sync  | HL-WF-001                                                      |
| OR-OP-052    | getState            | Sync  | HL-WF-001                                                      |
| OR-OP-053    | getProgress         | Sync  | HL-WF-001                                                      |
| OR-OP-054    | getContext          | Sync  | HL-CM-002                                                      |

---

## 10. Exported Utilities

The Orchestrator package also exports utility functions for parsing and validation:

### 10.1 Workflow Parsing

| Export             | Purpose                            |
| ------------------ | ---------------------------------- |
| `parseWorkflow`    | Parse Workflow into ParsedWorkflow |
| `parseStep`        | Parse individual step              |
| `parseConnection`  | Parse individual connection        |
| `validateWorkflow` | Validate parsed workflow structure |
| `topologicalSort`  | Compute execution order            |
| `detectCycle`      | Find cycles in workflow            |
| `findEntryPoints`  | Find steps with no predecessors    |
| `findExitPoints`   | Find steps with no successors      |

### 10.2 Step Detection

| Export              | Purpose                              |
| ------------------- | ------------------------------------ |
| `detectStepType`    | Detect step type from configuration  |
| `isConditionalStep` | Type guard for conditional steps     |
| `isLoopStep`        | Type guard for loop steps            |
| `isSubFlowStep`     | Type guard for subflow steps         |
| `isFlowControlStep` | Type guard for any flow control step |

### 10.3 Context Utilities

#### Interpolation (for `{{variable}}` in templates)

| Export             | Purpose                                |
| ------------------ | -------------------------------------- |
| `interpolate`      | Interpolate {{variable}} in strings    |
| `deepInterpolate`  | Recursively interpolate objects        |
| `findVariables`    | Extract variable names from template   |
| `hasInterpolation` | Check if template contains variables   |
| `validateInputs`   | Check required inputs before execution |

#### Context Appending (for `<context>` blocks)

| Export                  | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `buildContextBlock`     | Build XML context block from StepContext[]   |
| `resolveContextSource`  | Resolve context from output, file, or static |
| `appendContextToPrompt` | Append context block to prompt string        |

#### Shared Utilities

| Export                     | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `createContextFromOutputs` | Flatten step outputs to context             |
| `mergeContexts`            | Combine multiple context objects            |
| `buildPrompt`              | Full prompt building (interpolate + append) |

### 10.4 Validation Utilities

| Export                  | Purpose                              |
| ----------------------- | ------------------------------------ |
| `runValidation`         | Run validation checks on step output |
| `createFileExistsCheck` | Create file existence check          |
| `createCommandCheck`    | Create shell command check           |
| `createTestRunnerCheck` | Create test execution check          |
| `createBuildCheck`      | Create build command check           |
| `createLintCheck`       | Create lint command check            |

### 10.5 Abort Utilities

| Export                  | Purpose                        |
| ----------------------- | ------------------------------ |
| `createChildController` | Create child AbortController   |
| `combineAbortSignals`   | Combine multiple abort signals |
| `withAbort`             | Execute with timeout/abort     |
| `isAbortError`          | Check if error is AbortError   |

### 10.6 Error Classes

| Export                  | Purpose                             |
| ----------------------- | ----------------------------------- |
| `WorkflowParseError`    | Workflow parsing/validation failure |
| `CycleDetectedError`    | Invalid cycle detected in workflow  |
| `StepExecutionError`    | Step execution failure with context |
| `SubFlowExecutionError` | Nested workflow execution failure   |

### 10.7 Type Guards

| Export                    | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `isWorkflowEvent`         | Check if value is a WorkflowEvent         |
| `isWorkflowParseError`    | Check if error is WorkflowParseError      |
| `isCycleDetectedError`    | Check if error is CycleDetectedError      |
| `isStepExecutionError`    | Check if error is StepExecutionError      |
| `isSubFlowExecutionError` | Check if error is SubFlowExecutionError   |
| `isOrchestratorError`     | Check if error is any orchestrator error  |
| `getErrorMessage`         | Safely extract error message from unknown |

---

## Document History

| Version | Date       | Author            | Changes                                                                     |
| ------- | ---------- | ----------------- | --------------------------------------------------------------------------- |
| 1.0     | 2025-12-25 | Architecture Team | Initial version                                                             |
| 1.1     | 2025-12-25 | Architecture Team | Added TypeScript interface pattern (Section 1.7)                            |
| 1.2     | 2025-12-25 | Architecture Team | Terminology update: Graph→Workflow, Node→Step, Edge→Connection              |
| 1.3     | 2025-12-25 | Architecture Team | Added hybrid context model (Section 1.6): interpolation + context appending |
| 1.4     | 2025-12-25 | Architecture Team | Added file context modes (path vs contents), clarified Agent-only scope     |
| 1.5     | 2025-12-25 | Architecture Team | Fixed SharedContext type, added static context, updated traceability        |
