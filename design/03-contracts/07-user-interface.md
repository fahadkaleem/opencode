# User Interface - Interface Contract

> **Component ID**: COMP-009
> **Document Version**: 1.2
> **Last Updated**: 2025-12-17
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Component Requirements](../../requirements/09-user-interface.md)
> - [Error Types Schema](../schemas/00-error-types.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **User Interface** component, specifying the operations it provides for rendering execution status, handling user input, displaying agent outputs, presenting clarifications, and controlling workflow execution across Desktop (primary) and CLI (future) modes.

### 1.2 Component Summary

| Attribute                    | Value                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Component ID**             | COMP-009                                                                                                                                                                                                           |
| **Directory**                | `packages/desktop/src/renderer/` (Desktop, primary), `packages/cli/src/` (CLI, future)                                                                                                                             |
| **Main Classes**             | `DesktopApplication`, `CLIApplication`, `OutputRenderer`, `InputHandler`, `EventStreamConsumer`                                                                                                                    |
| **Responsibility**           | Rendering execution status, handling user input, displaying agent outputs, presenting clarifications, supporting multiple interface modes (Desktop/CLI/Headless), providing execution controls, permission dialogs |
| **Provides Interfaces To**   | COMP-010 (Gateway) - User input and display services                                                                                                                                                               |
| **Requires Interfaces From** | COMP-010 (Gateway) - All backend operations flow through Gateway                                                                                                                                                   |

### 1.3 Contract ID Convention

Operations follow the format: **UI-OP-XXX**

### 1.4 Key Design Patterns

#### 1.4.1 Event-Driven Rendering Pattern

UI subscribes to events from Gateway and renders updates reactively:

```typescript
// Pattern: Event subscription with backlog draining
class EventStreamConsumer {
  private eventBacklog: UIEvent[] = [];
  private static readonly MAX_BACKLOG_SIZE = 10000;

  constructor(private gateway: GatewayClient) {
    // Subscribe to event stream
    this.gateway.subscribeToEvents((event) => {
      this.handleEvent(event);
    });
  }

  // Drain backlog when UI becomes ready
  drainBacklog(): void {
    const backlog = [...this.eventBacklog];
    this.eventBacklog = [];
    for (const event of backlog) {
      this.processEvent(event);
    }
  }

  private handleEvent(event: UIEvent): void {
    if (!this.isReady) {
      if (this.eventBacklog.length >= EventStreamConsumer.MAX_BACKLOG_SIZE) {
        this.eventBacklog.shift();
      }
      this.eventBacklog.push(event);
    } else {
      this.processEvent(event);
    }
  }
}
```

#### 1.4.2 Dual-Mode Operation Pattern

Same codebase supports interactive and headless modes:

```typescript
// Pattern: Mode detection and output routing
enum OutputMode {
  INTERACTIVE = 'interactive',
  HEADLESS = 'headless',
}

class OutputRouter {
  private mode: OutputMode;

  constructor() {
    this.mode = this.detectMode();
  }

  private detectMode(): OutputMode {
    // Check CI environment variables
    if (process.env['CI'] || process.env['GITHUB_ACTIONS']) {
      return OutputMode.HEADLESS;
    }
    // Check TTY
    if (!process.stdout.isTTY) {
      return OutputMode.HEADLESS;
    }
    // Check TERM
    if (process.env['TERM'] === 'dumb') {
      return OutputMode.HEADLESS;
    }
    // Check explicit flag
    if (process.argv.includes('--headless')) {
      return OutputMode.HEADLESS;
    }
    return OutputMode.INTERACTIVE;
  }

  write(content: string): void {
    if (this.mode === OutputMode.HEADLESS) {
      // Plain text, no colors
      process.stdout.write(stripAnsi(content));
    } else {
      // Full formatting
      this.interactiveRenderer.render(content);
    }
  }
}
```

#### 1.4.3 Stateless UI Architecture Pattern

All workflow state resides in backend; UI is purely presentational:

```typescript
// Pattern: Stateless UI with backend hydration
class StatelessUI {
  // No workflow state stored locally
  private uiPreferences: UIPreferences; // Only user preferences stored

  async onConnect(taskId: string): Promise<void> {
    // 1. Fetch current state from Gateway
    const state = await this.gateway.getExecutionState(taskId);

    // 2. Fetch message history
    const history = await this.gateway.getMessageHistory(taskId);

    // 3. Hydrate UI with backend state
    this.renderState(state);
    this.renderHistory(history);

    // 4. Subscribe to live updates
    this.gateway.subscribeToEvents(taskId, (event) => {
      this.handleEvent(event);
    });
  }

  // Page refresh just reconnects and rehydrates
  async onReconnect(taskId: string): Promise<void> {
    await this.onConnect(taskId); // Same flow
  }
}
```

#### 1.4.4 History Item Discriminated Union Pattern

Typed message history with discriminated unions:

```typescript
// Pattern: Discriminated union for history items
type HistoryItem =
  | { type: 'user'; text: string; id: number }
  | { type: 'assistant'; text: string; id: number }
  | { type: 'tool_group'; tools: ToolCallDisplay[]; id: number }
  | { type: 'info'; text: string; icon?: string; id: number }
  | { type: 'error'; text: string; id: number }
  | { type: 'warning'; text: string; id: number }
  | { type: 'phase_start'; phaseName: string; id: number }
  | { type: 'phase_complete'; phaseName: string; duration: number; id: number }
  | { type: 'approval_request'; request: ApprovalRequest; id: number };

// Type-safe rendering
function renderHistoryItem(item: HistoryItem): ReactNode {
  switch (item.type) {
    case 'user':
      return <UserMessage text={item.text} />;
    case 'assistant':
      return <AssistantMessage text={item.text} />;
    case 'tool_group':
      return <ToolGroupDisplay tools={item.tools} />;
    // ...
  }
}
```

#### 1.4.5 Confirmation Request Pattern

Tool confirmations flow through UI via Gateway:

```typescript
// Pattern: Tool confirmation flow
interface ToolConfirmationRequest {
  correlationId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  description: string;
  requiresUserConfirmation: boolean;
}

interface ToolConfirmationResponse {
  correlationId: string;
  approved: boolean;
  remember?: boolean; // Cache decision for future requests
}

// UI handles permission dialog (tool confirmation)
class PermissionHandler {
  private taskId: string;

  async handlePermissionRequest(request: ToolConfirmationRequest): Promise<void> {
    // 1. Check cached decisions
    const cached = this.getCachedDecision(request.toolName, request.toolArgs);
    if (cached !== undefined) {
      await this.gateway.submitPermissionResponse({
        correlationId: request.correlationId,
        approved: cached,
        taskId: this.taskId,
      });
      return;
    }

    // 2. Show dialog to user
    const response = await this.showPermissionDialog(request);

    // 3. Cache if requested
    if (response.remember) {
      this.cacheDecision(request.toolName, request.toolArgs, response.approved);
    }

    // 4. Send response via Gateway
    await this.gateway.submitPermissionResponse({
      correlationId: request.correlationId,
      approved: response.approved,
      taskId: this.taskId,
    });
  }
}
```

#### 1.4.6 Output Format Selection Pattern

Support multiple output formats for different consumers:

```typescript
// Pattern: Output format selection
enum OutputFormat {
  TEXT = 'text', // Human-readable
  JSON = 'json', // Structured JSON
  STREAM_JSON = 'stream-json', // NDJSON streaming
}

interface OutputFormatter {
  format(content: string, metadata?: OutputMetadata): string;
}

class TextFormatter implements OutputFormatter {
  format(content: string): string {
    return content;
  }
}

class JsonFormatter implements OutputFormatter {
  format(content: string, metadata?: OutputMetadata): string {
    return JSON.stringify({
      content,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }
}

class StreamJsonFormatter implements OutputFormatter {
  emitEvent(event: StreamEvent): void {
    // NDJSON format
    process.stdout.write(JSON.stringify(event) + '\n');
  }
}
```

---

## 2. Provided Interfaces

### 2.1 Interface: CLI Application Lifecycle

**Purpose**: Initialize, run, and shutdown the CLI application.

**Consumers**: Entry point, process management

---

#### UI-OP-001: initialize

| Attribute        | Value                                      |
| ---------------- | ------------------------------------------ |
| **Operation ID** | UI-OP-001                                  |
| **Type**         | Asynchronous                               |
| **Implements**   | FR-UI-001, FR-UI-002, FR-UI-006, FR-UI-009 |

**Signature**:

```typescript
async initialize(options?: InitOptions): Promise<void>
```

**Purpose**: Initialize the UI application with mode detection and configuration.

**Request Schema**:

| Field              | Type      | Required | Constraints      | Description                            |
| ------------------ | --------- | -------- | ---------------- | -------------------------------------- |
| `options.headless` | `boolean` | No       | -                | Force headless mode                    |
| `options.port`     | `number`  | No       | 1024-65535       | Port for browser-based Web UI (future) |
| `options.theme`    | `string`  | No       | Valid theme name | Initial theme                          |

**Preconditions**:

- Gateway must be available
- Configuration must be loaded

**Postconditions**:

- Output mode detected (interactive/headless)
- Theme loaded and validated
- Event stream subscription established
- Gateway connection verified
- `UI_INITIALIZED` event emitted

**Error Conditions**:

| Error Code                | Condition                                 | Caller Action            |
| ------------------------- | ----------------------------------------- | ------------------------ |
| `ERR_GATEWAY_UNAVAILABLE` | Cannot connect to Gateway                 | Check Gateway is running |
| `ERR_THEME_NOT_FOUND`     | Specified theme doesn't exist             | Use default theme        |
| `ERR_PORT_IN_USE`         | Port already bound (browser-based Web UI) | Specify different port   |

---

#### UI-OP-002: run

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-002            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-001, FR-UI-006 |

**Signature**:

```typescript
async run(): Promise<number>
```

**Purpose**: Run the UI application main loop until exit.

**Preconditions**:

- UI must be initialized (UI-OP-001)

**Postconditions**:

- Interactive mode: Renders UI, handles input until exit
- Headless mode: Processes input, outputs result, exits
- Returns exit code (0 = success, non-zero = error)

---

#### UI-OP-003: shutdown

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-003    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-001    |

**Signature**:

```typescript
async shutdown(): Promise<void>
```

**Purpose**: Gracefully shutdown the UI application.

**Postconditions**:

- Event subscriptions cancelled
- Buffered output flushed
- Terminal state restored (raw mode, alternate buffer)
- Resources cleaned up

---

### 2.2 Interface: Command Execution

**Purpose**: Execute workflows and commands via CLI.

**Consumers**: CLI command handlers

---

#### UI-OP-010: executeWorkflowCommand

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-010            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-013, FR-UI-014 |

**Signature**:

```typescript
async executeWorkflowCommand(
  workflowName: string,
  taskId: string,
  options?: ExecuteOptions
): Promise<ExecutionResult>
```

**Purpose**: Execute a workflow by name with task context.

**Request Schema**:

| Field           | Type                     | Required | Constraints      | Description            |
| --------------- | ------------------------ | -------- | ---------------- | ---------------------- |
| `workflowName`  | `string`                 | Yes      | Valid identifier | Workflow to execute    |
| `taskId`        | `string`                 | Yes      | Non-empty        | Task identifier        |
| `options.model` | `string`                 | No       | Valid model name | Override default model |
| `options.args`  | `Record<string, string>` | No       | -                | Custom arguments       |
| `options.json`  | `boolean`                | No       | -                | JSON output format     |

**Preconditions**:

- Workflow must exist
- Task ID must be provided

**Postconditions**:

- Request sent to Gateway
- Progress displayed during execution
- Final result rendered
- Exit code reflects success/failure

**Error Conditions**:

| Error Code               | Condition              | Caller Action            |
| ------------------------ | ---------------------- | ------------------------ |
| `ERR_WORKFLOW_NOT_FOUND` | Workflow doesn't exist | List available workflows |
| `ERR_MISSING_TASK_ID`    | Task ID not provided   | Provide --task flag      |

---

#### UI-OP-011: executeCommandCommand

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-011            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-013, FR-UI-015 |

**Signature**:

```typescript
async executeCommandCommand(
  commandName: string,
  taskId: string,
  options?: ExecuteOptions
): Promise<ExecutionResult>
```

**Purpose**: Execute a single command by name with task context.

**Preconditions**:

- Command must exist
- Task ID must be provided

**Postconditions**:

- Request sent to Gateway
- Progress displayed during execution
- Final result rendered

**Error Conditions**:

| Error Code              | Condition             | Caller Action           |
| ----------------------- | --------------------- | ----------------------- |
| `ERR_COMMAND_NOT_FOUND` | Command doesn't exist | List available commands |

---

#### UI-OP-012: listWorkflows

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-012    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-018    |

**Signature**:

```typescript
async listWorkflows(): Promise<WorkflowSummary[]>
```

**Purpose**: List all available workflows with metadata.

**Postconditions**:

- Fetches workflow list from Gateway
- Displays formatted list
- Returns quickly without full validation

---

#### UI-OP-013: showWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-013    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-019    |

**Signature**:

```typescript
async showWorkflow(name: string): Promise<WorkflowDetails>
```

**Purpose**: Display detailed workflow information.

**Postconditions**:

- Loads workflow definition
- Displays phases, dependencies, description
- Formatted for readability

---

#### UI-OP-014: validateWorkflow

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-014    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-020    |

**Signature**:

```typescript
async validateWorkflow(name: string): Promise<ValidationResult>
```

**Purpose**: Validate a workflow definition and report errors.

**Postconditions**:

- Validates syntax, command references, dependencies
- Reports specific errors with locations
- Suggests fixes where possible

---

#### UI-OP-015: listCommands

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-015    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-021    |

**Signature**:

```typescript
async listCommands(namespace?: string): Promise<CommandSummary[]>
```

**Purpose**: List available commands with optional namespace filter.

**Postconditions**:

- Fetches command list from Gateway
- Filters by namespace if provided
- Displays with descriptions

---

#### UI-OP-016: showCommand

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-016    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-022    |

**Signature**:

```typescript
async showCommand(name: string): Promise<CommandDetails>
```

**Purpose**: Display command definition and metadata.

**Postconditions**:

- Loads command definition
- Displays content and requirements

---

#### UI-OP-017: initProject

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-017    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-017    |

**Signature**:

```typescript
async initProject(options?: InitProjectOptions): Promise<void>
```

**Purpose**: Initialize FlowMaster configuration in project directory.

**Postconditions**:

- Creates `.flowmaster/` directory structure
- Generates default configuration files
- Prompts for initial settings
- Displays success message with next steps

---

### 2.3 Interface: Output Rendering

**Purpose**: Render output in various formats and modes.

**Consumers**: All UI operations

---

#### UI-OP-020: renderProgress

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | UI-OP-020                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-UI-003, FR-UI-030, FR-UI-031 |

**Signature**:

```typescript
renderProgress(progress: ProgressInfo): void
```

**Purpose**: Render execution progress information.

**Request Schema**:

| Field                 | Type          | Required | Constraints  | Description           |
| --------------------- | ------------- | -------- | ------------ | --------------------- |
| `progress.phase`      | `string`      | No       | -            | Current phase name    |
| `progress.status`     | `PhaseStatus` | Yes      | Valid status | Current status        |
| `progress.percentage` | `number`      | No       | 0-100        | Completion percentage |
| `progress.message`    | `string`      | No       | -            | Status message        |

**Postconditions**:

- Interactive: Updates progress indicator
- Headless: Writes progress to stderr
- Progress clearly indicates current phase

---

#### UI-OP-021: renderMessage

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-021            |
| **Type**         | Synchronous          |
| **Implements**   | FR-UI-039, FR-UI-003 |

**Signature**:

```typescript
renderMessage(message: HistoryItem): void
```

**Purpose**: Render a message to the appropriate output.

**Postconditions**:

- Type-specific formatting applied
- Colors applied (if enabled)
- Added to history (interactive)
- Chronological order maintained

---

#### UI-OP-022: renderToolExecution

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-022   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-040   |

**Signature**:

```typescript
renderToolExecution(toolCall: ToolCallDisplay): void
```

**Purpose**: Render tool execution with status.

**Postconditions**:

- Tool name and parameters displayed
- Status (pending/executing/success/error) shown
- Result displayed on completion
- Error details accessible on failure

---

#### UI-OP-023: renderError

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-023            |
| **Type**         | Synchronous          |
| **Implements**   | FR-UI-003, FR-UI-045 |

**Signature**:

```typescript
renderError(error: UIError): void
```

**Purpose**: Render error message with appropriate formatting.

**Postconditions**:

- Error clearly identified
- Actionable remediation suggested when possible
- Stack trace available in debug mode

---

#### UI-OP-024: renderJson

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-024            |
| **Type**         | Synchronous          |
| **Implements**   | FR-UI-025, FR-UI-004 |

**Signature**:

```typescript
renderJson(data: unknown, metadata?: OutputMetadata): void
```

**Purpose**: Render output in JSON format.

**Postconditions**:

- Valid JSON output
- Consistent field naming
- Errors also in JSON format
- Parseable with standard tools

---

### 2.4 Interface: User Input

**Purpose**: Handle user input from various sources.

**Consumers**: CLI command handlers, event handlers

---

#### UI-OP-030: promptUser

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-030    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-056    |

**Signature**:

```typescript
async promptUser(prompt: UserPrompt): Promise<string>
```

**Purpose**: Prompt user for input and return response.

**Request Schema**:

| Field             | Type                         | Required | Constraints | Description         |
| ----------------- | ---------------------------- | -------- | ----------- | ------------------- |
| `prompt.message`  | `string`                     | Yes      | -           | Prompt message      |
| `prompt.default`  | `string`                     | No       | -           | Default value       |
| `prompt.validate` | `(input: string) => boolean` | No       | -           | Validation function |

**Preconditions**:

- Must be in interactive mode
- stdin must be available

**Postconditions**:

- Displays prompt
- Waits for user input
- Validates if validator provided
- Returns trimmed input

**Error Conditions**:

| Error Code            | Condition                | Caller Action        |
| --------------------- | ------------------------ | -------------------- |
| `ERR_NOT_INTERACTIVE` | Running in headless mode | Use defaults or fail |

---

#### UI-OP-031: promptConfirmation

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | UI-OP-031                       |
| **Type**         | Asynchronous                    |
| **Implements**   | FR-UI-051, FR-UI-052, FR-UI-053 |

**Signature**:

```typescript
async promptConfirmation(request: ConfirmationRequest): Promise<ConfirmationResponse>
```

**Purpose**: Prompt user for yes/no confirmation.

**Request Schema**:

| Field                   | Type      | Required | Constraints | Description              |
| ----------------------- | --------- | -------- | ----------- | ------------------------ |
| `request.message`       | `string`  | Yes      | -           | What to confirm          |
| `request.details`       | `string`  | No       | -           | Additional context       |
| `request.default`       | `boolean` | No       | -           | Default if enter pressed |
| `request.allowRemember` | `boolean` | No       | -           | Allow caching decision   |

**Postconditions**:

- Displays confirmation prompt
- Waits for y/n response
- Returns decision and remember flag

---

#### UI-OP-032: promptApproval

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-032            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-055, FR-UI-057 |

**Signature**:

```typescript
async promptApproval(request: ApprovalGateRequest): Promise<ApprovalGateResponse>
```

**Purpose**: Present approval gate with artifacts for review.

**Request Schema**:

| Field                 | Type              | Required | Constraints | Description                 |
| --------------------- | ----------------- | -------- | ----------- | --------------------------- |
| `request.executionId` | `string`          | Yes      | Valid ID    | Execution awaiting approval |
| `request.phaseName`   | `string`          | Yes      | -           | Phase that completed        |
| `request.artifacts`   | `string[]`        | No       | File paths  | Files to review             |
| `request.summary`     | `string`          | No       | -           | Summary for reviewer        |
| `request.checklist`   | `ChecklistItem[]` | No       | -           | Review checklist            |

**Postconditions**:

- Displays artifacts for review
- Shows checklist if provided
- Returns approve/reject/refine decision
- Includes feedback if refine selected

---

### 2.5 Interface: Execution Control

**Purpose**: Control running workflow executions.

**Consumers**: Desktop (primary), CLI (future), browser-based Web UI (future)

---

#### UI-OP-040: pauseExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-040    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-047    |

**Signature**:

```typescript
async pauseExecution(executionId: string): Promise<void>
```

**Purpose**: Pause a running workflow execution.

**Preconditions**:

- Execution must be in `executing` state

**Postconditions**:

- Pause request sent to Gateway
- Execution stops at next phase boundary
- Status displays "paused"

---

#### UI-OP-041: resumeExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-041    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-047    |

**Signature**:

```typescript
async resumeExecution(executionId: string): Promise<void>
```

**Purpose**: Resume a paused workflow execution.

**Preconditions**:

- Execution must be in `paused` state

**Postconditions**:

- Resume request sent to Gateway
- Execution continues from pause point

---

#### UI-OP-042: cancelExecution

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-042    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-047    |

**Signature**:

```typescript
async cancelExecution(executionId: string): Promise<void>
```

**Purpose**: Cancel a running or paused workflow execution.

**Postconditions**:

- Cancel request sent to Gateway
- Execution terminates
- Child processes cleaned up
- Partial results preserved

---

### 2.6 Interface: Event Stream Consumption

**Purpose**: Subscribe to and process execution events.

**Consumers**: Internal (rendering pipeline)

---

#### UI-OP-050: subscribeToEvents

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-050            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-049, FR-UI-048 |

**Signature**:

```typescript
async subscribeToEvents(
  taskId: string,
  handler: EventHandler
): Promise<Subscription>
```

**Purpose**: Subscribe to real-time execution events.

**Postconditions**:

- WebSocket/IPC connection established
- Events delivered in order
- Sub-second latency
- Returns subscription handle for cleanup

---

#### UI-OP-051: handleEvent

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-051   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-049   |

**Signature**:

```typescript
handleEvent(event: UIEvent): void
```

**Purpose**: Process an incoming event and update UI.

**Postconditions**:

- Event type routed to appropriate handler
- UI updated immediately
- State synchronized with backend

---

#### UI-OP-052: hydrateFromState

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-052            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-010, FR-UI-011 |

**Signature**:

```typescript
async hydrateFromState(taskId: string): Promise<void>
```

**Purpose**: Hydrate UI from backend state on connect/reconnect.

**Postconditions**:

- Fetches current execution state
- Fetches message history
- Renders complete state
- Initial state loads within 1 second (p95)

---

### 2.7 Interface: Permission Management

**Purpose**: Manage permission dialogs and decision caching.

**Consumers**: Confirmation handler, event handler

---

#### UI-OP-060: showPermissionDialog

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | UI-OP-060                       |
| **Type**         | Asynchronous                    |
| **Implements**   | FR-UI-051, FR-UI-052, FR-UI-053 |

**Signature**:

```typescript
async showPermissionDialog(request: PermissionRequest): Promise<PermissionResponse>
```

**Purpose**: Show permission dialog for sensitive operations.

**Request Schema**:

| Field             | Type                                              | Required | Constraints | Description          |
| ----------------- | ------------------------------------------------- | -------- | ----------- | -------------------- |
| `request.type`    | `'file_write' \| 'file_delete' \| 'command_exec'` | Yes      | -           | Operation type       |
| `request.target`  | `string`                                          | Yes      | -           | File path or command |
| `request.details` | `string`                                          | No       | -           | Additional context   |

**Postconditions**:

- Dialog displays operation details
- User can approve or deny
- Response includes remember flag
- Denied operations do not execute

---

#### UI-OP-061: getCachedDecision

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-061   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-054   |

**Signature**:

```typescript
getCachedDecision(operationType: string, target: string): boolean | undefined
```

**Purpose**: Check for cached permission decision.

**Postconditions**:

- Returns cached decision if exists
- Returns undefined if not cached
- Identical operations use cached value

---

#### UI-OP-062: cacheDecision

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-062   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-054   |

**Signature**:

```typescript
cacheDecision(operationType: string, target: string, decision: boolean): void
```

**Purpose**: Cache a permission decision for future use.

**Postconditions**:

- Decision stored in cache
- Applies to identical future operations

---

#### UI-OP-063: clearCachedDecisions

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-063   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-054   |

**Signature**:

```typescript
clearCachedDecisions(): void
```

**Purpose**: Clear all cached permission decisions.

**Postconditions**:

- All cached decisions removed
- Future operations will prompt

---

### 2.8 Interface: Theme and Display

**Purpose**: Manage themes and display preferences.

**Consumers**: Desktop (primary), CLI (future), browser-based Web UI (future)

---

#### UI-OP-070: setTheme

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-070   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-043   |

**Signature**:

```typescript
setTheme(themeName: string): boolean
```

**Purpose**: Set the active theme.

**Postconditions**:

- Theme applied if exists
- Returns false if theme not found
- UI re-renders with new theme

---

#### UI-OP-071: getAvailableThemes

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-071   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-043   |

**Signature**:

```typescript
getAvailableThemes(): ThemeInfo[]
```

**Purpose**: List available themes.

**Postconditions**:

- Returns built-in and custom themes
- Includes theme metadata

---

#### UI-OP-072: setColorEnabled

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-072            |
| **Type**         | Synchronous          |
| **Implements**   | FR-UI-026, FR-UI-005 |

**Signature**:

```typescript
setColorEnabled(enabled: boolean): void
```

**Purpose**: Enable or disable color output.

**Postconditions**:

- Color state updated
- Respects NO_COLOR environment variable
- Graceful degradation in non-TTY

---

#### UI-OP-073: savePreferences

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | UI-OP-073    |
| **Type**         | Asynchronous |
| **Implements**   | FR-UI-046    |

**Signature**:

```typescript
async savePreferences(preferences: UIPreferences): Promise<void>
```

**Purpose**: Persist UI preferences.

**Postconditions**:

- Preferences saved to local storage (Desktop/browser Web UI)
- Preferences restored on next session

---

### 2.9 Interface: Desktop UI Specific

**Purpose**: Operations specific to Desktop UI (Electron).

**Consumers**: Desktop application

---

#### UI-OP-080: launchWebUI

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | UI-OP-080            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-UI-029, FR-UI-006 |

**Signature**:

```typescript
async launchWebUI(options?: WebUIOptions): Promise<WebUIServer>
```

**Purpose**: Launch web-based UI server.

**Request Schema**:

| Field                 | Type      | Required | Constraints              | Description     |
| --------------------- | --------- | -------- | ------------------------ | --------------- |
| `options.port`        | `number`  | No       | 1024-65535, default 3000 | HTTP port       |
| `options.wsPort`      | `number`  | No       | 1024-65535               | WebSocket port  |
| `options.openBrowser` | `boolean` | No       | default true             | Open in browser |

**Postconditions**:

- HTTP server starts serving static files
- WebSocket server starts for events
- Opens browser if requested
- Returns server handle

**Error Conditions**:

| Error Code        | Condition          | Caller Action          |
| ----------------- | ------------------ | ---------------------- |
| `ERR_PORT_IN_USE` | Port already bound | Specify different port |

---

#### UI-OP-081: renderWorkflowGraph

| Attribute        | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| **Operation ID** | UI-OP-081                                             |
| **Type**         | Synchronous                                           |
| **Implements**   | FR-UI-030, FR-UI-032, FR-UI-033, FR-UI-035, FR-UI-036 |

**Signature**:

```typescript
renderWorkflowGraph(definition: WorkflowDefinition, state: ExecutionState): GraphData
```

**Purpose**: Generate workflow graph visualization data.

**Postconditions**:

- Generates nodes for all phases
- Generates edges for dependencies
- Sequential phases shown as chain
- Parallel phases shown as branches
- Conditional branches labeled

---

#### UI-OP-082: updateGraphState

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-082   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-031   |

**Signature**:

```typescript
updateGraphState(phaseId: string, status: PhaseStatus): void
```

**Purpose**: Update graph node status.

**Postconditions**:

- Node status indicator updated
- Status change reflected within 1 second
- Visual distinction for pending/running/complete/failed

---

#### UI-OP-083: handleGraphInteraction

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | UI-OP-083                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-UI-034, FR-UI-037, FR-UI-038 |

**Signature**:

```typescript
handleGraphInteraction(interaction: GraphInteraction): void
```

**Purpose**: Handle user interaction with workflow graph.

**Postconditions**:

- Pan: Graph viewport moves
- Zoom: Graph scales
- Click node: Chat scrolls to phase messages
- Hover: Tooltip shows phase details

---

### 2.10 Interface: Help and Documentation

**Purpose**: Provide help and documentation.

**Consumers**: CLI command handlers

---

#### UI-OP-090: showHelp

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | UI-OP-090   |
| **Type**         | Synchronous |
| **Implements**   | FR-UI-016   |

**Signature**:

```typescript
showHelp(command?: string): void
```

**Purpose**: Display help information.

**Postconditions**:

- Without command: Shows all command groups
- With command: Shows command-specific help
- Includes usage syntax, parameters, examples

---

---

## 3. Required Interfaces

### 3.1 Dependencies on COMP-010 (Gateway)

| Operation                    | Purpose                       | When Called |
| ---------------------------- | ----------------------------- | ----------- |
| `executeWorkflow()`          | Trigger workflow execution    | UI-OP-010   |
| `executeCommand()`           | Trigger command execution     | UI-OP-011   |
| `listWorkflows()`            | Fetch workflow list           | UI-OP-012   |
| `getWorkflow()`              | Fetch workflow details        | UI-OP-013   |
| `validateWorkflow()`         | Validate workflow             | UI-OP-014   |
| `listCommands()`             | Fetch command list            | UI-OP-015   |
| `getCommand()`               | Fetch command details         | UI-OP-016   |
| `getExecutionState()`        | Fetch current state           | UI-OP-052   |
| `getMessageHistory()`        | Fetch message history         | UI-OP-052   |
| `subscribeToEvents()`        | Subscribe to event stream     | UI-OP-050   |
| `pauseExecution()`           | Pause workflow                | UI-OP-040   |
| `resumeExecution()`          | Resume workflow               | UI-OP-041   |
| `cancelExecution()`          | Cancel workflow               | UI-OP-042   |
| `submitPermissionResponse()` | Send tool permission response | UI-OP-060   |
| `submitApprovalResponse()`   | Send approval decision        | UI-OP-032   |

**Assumptions**:

- Gateway is available after initialization
- Gateway provides unified API for all backend operations
- Event stream delivers events in order with sub-second latency
- Gateway handles authentication for cloud deployment

**Failure Handling**:

- If Gateway unavailable: Display error, retry with exponential backoff (max 5 attempts)
- If event stream interrupted: Buffer events, auto-reconnect with fixed 1s interval
- If request timeout: Retry 3 times with linear backoff (2s)

---

## 4. Component Interaction Patterns

This section documents how other components interact with the User Interface.

### 4.1 Gateway → User Interface (Event Streaming)

Gateway streams execution events to UI for real-time display:

```typescript
// Pattern: Event streaming from Gateway to UI
class GatewayEventStream {
  private ws: WebSocket;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  connect(taskId: string): void {
    this.ws = new WebSocket(`${this.gatewayUrl}/events/${taskId}`);

    this.ws.onmessage = (event) => {
      const parsed: UIEvent = JSON.parse(event.data);
      this.dispatchEvent(parsed);
    };

    this.ws.onclose = () => {
      // Auto-reconnect
      setTimeout(() => this.connect(taskId), 1000);
    };
  }

  private dispatchEvent(event: UIEvent): void {
    // Route event to appropriate UI handler
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      handler(event);
    }
  }
}

// UI subscribes to specific event types
class ChatPanel {
  constructor(private eventStream: GatewayEventStream) {
    eventStream.on('text_delta', this.handleTextDelta.bind(this));
    eventStream.on('tool_call', this.handleToolCall.bind(this));
    eventStream.on('tool_result', this.handleToolResult.bind(this));
    eventStream.on('phase_complete', this.handlePhaseComplete.bind(this));
  }

  private handleTextDelta(event: TextDeltaEvent): void {
    this.appendToCurrentMessage(event.text);
  }
}
```

### 4.2 User Interface → Gateway (Command Execution Request)

UI initiates execution requests through Gateway:

```typescript
// Pattern: UI requests execution via Gateway
class ExecutionController {
  async executeWorkflow(name: string, taskId: string, options: ExecuteOptions) {
    // 1. Validate inputs
    if (!name || !taskId) {
      throw new UIError('ERR_MISSING_ARGS', 'Workflow name and task ID required');
    }

    // 2. Send request to Gateway
    const response = await this.gateway.executeWorkflow({
      workflowName: name,
      taskId,
      model: options.model,
      args: options.args,
    });

    // 3. Subscribe to execution events
    const subscription = await this.gateway.subscribeToEvents(response.executionId, (event) =>
      this.handleExecutionEvent(event)
    );

    // 4. Wait for completion
    return new Promise((resolve, reject) => {
      subscription.onComplete((result) => {
        resolve(result);
      });
      subscription.onError((error) => {
        reject(error);
      });
    });
  }
}
```

### 4.3 Gateway → User Interface (Confirmation Request Flow)

Gateway routes tool confirmation requests to UI:

```typescript
// Pattern: Tool confirmation request flow
class ConfirmationFlowHandler {
  constructor(
    private gateway: GatewayClient,
    private ui: UIRenderer
  ) {
    // Subscribe to confirmation requests
    gateway.onConfirmationRequest(this.handleRequest.bind(this));
  }

  private async handleRequest(request: ToolConfirmationRequest): Promise<void> {
    // 1. Check cached decisions first
    const cached = this.getCachedDecision(request.toolName, request.toolArgs);
    if (cached !== undefined) {
      await this.gateway.submitConfirmationResponse({
        correlationId: request.correlationId,
        confirmed: cached,
      });
      return;
    }

    // 2. Show confirmation dialog to user
    const response = await this.ui.showConfirmationDialog({
      title: `Allow ${request.toolName}?`,
      description: request.description,
      details: JSON.stringify(request.toolArgs, null, 2),
      showRememberOption: true,
    });

    // 3. Cache decision if requested
    if (response.remember) {
      this.cacheDecision(request.toolName, request.toolArgs, response.confirmed);
    }

    // 4. Send response back via Gateway
    await this.gateway.submitConfirmationResponse({
      correlationId: request.correlationId,
      confirmed: response.confirmed,
    });
  }
}
```

### 4.4 Gateway → User Interface (Approval Gate Flow)

Gateway signals approval gates to UI:

```typescript
// Pattern: Approval gate flow
class ApprovalGateHandler {
  constructor(
    private gateway: GatewayClient,
    private ui: UIRenderer
  ) {
    gateway.onApprovalRequest(this.handleApprovalRequest.bind(this));
  }

  private async handleApprovalRequest(request: ApprovalGateRequest): Promise<void> {
    // 1. Render approval UI with artifacts
    const approvalUI = this.ui.renderApprovalGate({
      phaseName: request.phaseName,
      summary: request.summary,
      artifacts: request.artifacts,
      checklist: request.checklist,
      timeout: request.timeout,
      maxRefinements: request.maxRefinements,
      refinementCount: request.refinementCount,
    });

    // 2. Show countdown if timeout configured
    if (request.timeout) {
      approvalUI.startCountdown(request.timeout, request.defaultAction);
    }

    // 3. Wait for user decision
    const decision = await approvalUI.waitForDecision();

    // 4. Send response via Gateway
    await this.gateway.submitApprovalResponse({
      executionId: request.executionId,
      decision: decision.action, // 'approve' | 'reject' | 'refine'
      feedback: decision.feedback,
      checklistState: decision.checklistState,
    });
  }
}
```

### 4.5 User Interface → Gateway (State Hydration)

UI hydrates state from Gateway on connect/reconnect:

```typescript
// Pattern: State hydration on connect
class StateHydrationService {
  async hydrateUI(taskId: string): Promise<void> {
    // 1. Fetch current execution state
    const state = await this.gateway.getExecutionState(taskId);

    // 2. Render workflow graph with current status
    this.workflowGraph.render(state.definition, state.phaseStates);

    // 3. Fetch and render message history
    const history = await this.gateway.getMessageHistory(taskId, {
      limit: 1000, // Max messages to load
    });

    for (const message of history) {
      this.chatPanel.addMessage(message);
    }

    // 4. Restore UI state (scroll position, selected phase, etc.)
    if (state.status === 'paused') {
      this.controlPanel.showPausedState();
    } else if (state.status === 'awaiting_approval') {
      this.approvalPanel.showApprovalRequest(state.pendingApproval);
    }

    // 5. Subscribe to live updates
    this.subscription = await this.gateway.subscribeToEvents(taskId, (event) => {
      this.handleLiveEvent(event);
    });
  }
}
```

### 4.6 Headless Mode Output Flow

In headless mode, UI writes structured output:

```typescript
// Pattern: Headless mode output
class HeadlessOutputHandler {
  private outputFormat: OutputFormat;
  private streamFormatter: StreamJsonFormatter | null;

  constructor(config: CliConfig) {
    this.outputFormat = config.outputFormat;
    this.streamFormatter =
      this.outputFormat === OutputFormat.STREAM_JSON ? new StreamJsonFormatter() : null;
  }

  onEvent(event: UIEvent): void {
    switch (this.outputFormat) {
      case OutputFormat.TEXT:
        // Plain text to stdout, progress to stderr
        if (event.type === 'progress') {
          process.stderr.write(`${event.message}\n`);
        } else if (event.type === 'text_delta') {
          process.stdout.write(event.text);
        }
        break;

      case OutputFormat.JSON:
        // Collect all output, emit single JSON at end
        this.buffer.push(event);
        break;

      case OutputFormat.STREAM_JSON:
        // NDJSON streaming
        this.streamFormatter!.emitEvent({
          type: this.mapEventType(event.type),
          timestamp: new Date().toISOString(),
          ...this.mapEventData(event),
        });
        break;
    }
  }

  onComplete(result: ExecutionResult): void {
    if (this.outputFormat === OutputFormat.JSON) {
      const output = {
        status: result.status,
        content: this.extractContent(this.buffer),
        stats: result.stats,
      };
      process.stdout.write(JSON.stringify(output, null, 2));
    }
  }
}
```

### 4.7 Interactive Mode Rendering Pipeline

In interactive mode, events flow through rendering pipeline:

```typescript
// Pattern: Interactive rendering pipeline
class InteractiveRenderer {
  private historyManager: HistoryManager;
  private autoScroll: boolean = true;

  onEvent(event: UIEvent): void {
    // 1. Convert event to history item
    const historyItem = this.eventToHistoryItem(event);

    // 2. Add to history
    const id = this.historyManager.addItem(historyItem);

    // 3. Render incrementally
    this.renderItem(historyItem, id);

    // 4. Handle auto-scroll
    if (this.autoScroll) {
      this.scrollToBottom();
    } else if (event.type === 'text_delta') {
      this.showNewMessageIndicator();
    }
  }

  onUserScroll(direction: 'up' | 'down'): void {
    if (direction === 'up') {
      this.autoScroll = false;
    } else if (this.isAtBottom()) {
      this.autoScroll = true;
      this.hideNewMessageIndicator();
    }
  }

  private renderItem(item: HistoryItem, id: number): void {
    switch (item.type) {
      case 'user':
        this.ink.render(<UserMessage text={item.text} />);
        break;
      case 'assistant':
        this.ink.render(<AssistantMessage text={item.text} streaming={item.streaming} />);
        break;
      case 'tool_group':
        this.ink.render(<ToolGroup tools={item.tools} />);
        break;
      // ... other types
    }
  }
}
```

### 4.8 Interaction Summary

| Component | Interaction Pattern               | Operations Used                                    |
| --------- | --------------------------------- | -------------------------------------------------- |
| Gateway   | Event streaming, request/response | UI-OP-050, UI-OP-051, UI-OP-010-016, UI-OP-040-042 |
| Gateway   | Confirmation requests             | UI-OP-060-063                                      |
| Gateway   | Approval gates                    | UI-OP-032                                          |
| Gateway   | State hydration                   | UI-OP-052                                          |

---

## 5. Events Subscribed

UI subscribes to events from Gateway for real-time updates.

| Event                   | Publisher | Handler Behavior                          |
| ----------------------- | --------- | ----------------------------------------- |
| `WORKFLOW_STARTED`      | Gateway   | Initialize progress display               |
| `WORKFLOW_COMPLETE`     | Gateway   | Show completion, final stats              |
| `WORKFLOW_FAILED`       | Gateway   | Show error, cleanup                       |
| `PHASE_STARTED`         | Gateway   | Update progress, highlight phase in graph |
| `PHASE_COMPLETE`        | Gateway   | Update graph status, show duration        |
| `PHASE_FAILED`          | Gateway   | Show error, highlight failed phase        |
| `TOOL_CALL`             | Gateway   | Add tool to history, show executing       |
| `TOOL_RESULT`           | Gateway   | Update tool status, show result           |
| `TEXT_DELTA`            | Gateway   | Append to streaming message               |
| `STEP_FINISH`           | Gateway   | Finalize message, end streaming indicator |
| `CONFIRMATION_REQUEST`  | Gateway   | Show confirmation dialog                  |
| `APPROVAL_REQUEST`      | Gateway   | Show approval gate                        |
| `CLARIFICATION_REQUEST` | Gateway   | Show clarification prompt                 |
| `USER_FEEDBACK`         | Gateway   | Display info/warning/error message        |

---

## 6. Invariants

| Invariant            | Description                        | Enforcement                    |
| -------------------- | ---------------------------------- | ------------------------------ |
| Stateless UI         | No workflow state stored in UI     | All state fetched from Gateway |
| Event ordering       | Events displayed in order received | Sequence numbers, buffering    |
| Color safety         | No raw ANSI in headless mode       | Strip ANSI in headless output  |
| Single output format | One format per session             | Set at initialization          |
| Theme consistency    | Theme applies to all components    | Theme context provider         |

---

## 7. Performance Expectations

| Operation                     | Expected Latency | Throughput      | Notes             |
| ----------------------------- | ---------------- | --------------- | ----------------- |
| UI-OP-001 initialize          | < 500ms p95      | 1/session       | Cold start        |
| UI-OP-051 handleEvent         | < 10ms p95       | 1000 events/sec | Event processing  |
| UI-OP-052 hydrateFromState    | < 1000ms p95     | -               | Initial hydration |
| UI-OP-020 renderProgress      | < 16ms p95       | 60 fps          | Interactive mode  |
| UI-OP-081 renderWorkflowGraph | < 100ms p95      | -               | Initial render    |
| UI-OP-082 updateGraphState    | < 16ms p95       | 60 fps          | Node updates      |

---

## 8. Type Definitions

### 8.1 Output and Rendering Types

```typescript
/**
 * Output mode for CLI
 */
enum OutputMode {
  INTERACTIVE = 'interactive',
  HEADLESS = 'headless',
}

/**
 * Output format for structured output
 */
enum OutputFormat {
  TEXT = 'text',
  JSON = 'json',
  STREAM_JSON = 'stream-json',
}

/**
 * Phase status for visualization
 */
enum PhaseStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Streaming state for message display
 */
enum StreamingState {
  IDLE = 'idle',
  RESPONDING = 'responding',
  WAITING_FOR_CONFIRMATION = 'waiting_for_confirmation',
}
```

### 8.2 History Item Types

```typescript
/**
 * Base history item
 */
interface HistoryItemBase {
  text?: string;
}

/**
 * User message
 */
interface HistoryItemUser extends HistoryItemBase {
  type: 'user';
  text: string;
}

/**
 * Assistant message
 */
interface HistoryItemAssistant extends HistoryItemBase {
  type: 'assistant';
  text: string;
  streaming?: boolean;
}

/**
 * Tool execution group
 */
interface HistoryItemToolGroup extends HistoryItemBase {
  type: 'tool_group';
  tools: ToolCallDisplay[];
}

/**
 * Info message
 */
interface HistoryItemInfo extends HistoryItemBase {
  type: 'info';
  text: string;
  icon?: string;
  color?: string;
}

/**
 * Error message
 */
interface HistoryItemError extends HistoryItemBase {
  type: 'error';
  text: string;
}

/**
 * Warning message
 */
interface HistoryItemWarning extends HistoryItemBase {
  type: 'warning';
  text: string;
}

/**
 * Discriminated union of all history items
 */
type HistoryItemWithoutId =
  | HistoryItemUser
  | HistoryItemAssistant
  | HistoryItemToolGroup
  | HistoryItemInfo
  | HistoryItemError
  | HistoryItemWarning;

type HistoryItem = HistoryItemWithoutId & { id: number };
```

### 8.3 Tool Display Types

```typescript
/**
 * Tool call status
 */
enum ToolCallStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  EXECUTING = 'executing',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELED = 'canceled',
}

/**
 * Tool call display info
 */
interface ToolCallDisplay {
  callId: string;
  name: string;
  description: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: ToolResultDisplay;
  error?: { message: string; type: string };
  confirmationDetails?: ToolConfirmationDetails;
}

/**
 * Union type for tool result display.
 * Different tools return different display formats.
 * @see Agent Executor contract (COMP-007) Section 5.5.2 for full type definitions.
 */
type ToolResultDisplay = string | FileDiff | AnsiOutput | TodoList;

interface FileDiff {
  type: 'file_diff';
  filePath: string;
  diff: string;
  language?: string;
}

interface AnsiOutput {
  type: 'ansi';
  content: string;
}

interface TodoList {
  type: 'todo_list';
  items: Array<{ content: string; status: 'pending' | 'in_progress' | 'completed' }>;
}
```

### 8.4 Confirmation and Approval Types

```typescript
/**
 * Permission request types
 */
type PermissionType = 'file_write' | 'file_delete' | 'command_exec';

/**
 * Permission request
 */
interface PermissionRequest {
  correlationId: string;
  type: PermissionType;
  target: string;
  details?: string;
}

/**
 * Permission response
 */
interface PermissionResponse {
  correlationId: string;
  confirmed: boolean;
  remember?: boolean;
}

/**
 * Approval gate request
 */
interface ApprovalGateRequest {
  executionId: string;
  phaseName: string;
  artifacts?: string[];
  summary?: string;
  checklist?: ChecklistItem[];
  timeout?: number;
  defaultAction?: 'approve' | 'reject';
  maxRefinements?: number;
  refinementCount?: number;
}

/**
 * Approval gate response
 */
interface ApprovalGateResponse {
  decision: 'approve' | 'reject' | 'refine';
  feedback?: string;
  checklistState?: Record<string, boolean>;
}

/**
 * Checklist item
 */
interface ChecklistItem {
  id: string;
  label: string;
  required?: boolean;
}
```

### 8.5 UI Event Types

```typescript
/**
 * UI event types
 */
enum UIEventType {
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETE = 'workflow_complete',
  WORKFLOW_FAILED = 'workflow_failed',
  PHASE_STARTED = 'phase_started',
  PHASE_COMPLETE = 'phase_complete',
  PHASE_FAILED = 'phase_failed',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  TEXT_DELTA = 'text_delta',
  STEP_FINISH = 'step_finish',
  CONFIRMATION_REQUEST = 'confirmation_request',
  APPROVAL_REQUEST = 'approval_request',
  CLARIFICATION_REQUEST = 'clarification_request',
  USER_FEEDBACK = 'user_feedback',
  PROGRESS_UPDATE = 'progress_update',
}

/**
 * Base UI event
 */
interface UIEventBase {
  type: UIEventType;
  timestamp: string;
  executionId: string;
}

/**
 * User feedback event
 */
interface UserFeedbackEvent extends UIEventBase {
  type: UIEventType.USER_FEEDBACK;
  severity: 'info' | 'warning' | 'error';
  message: string;
  error?: unknown;
}

/**
 * Discriminated union of UI events
 */
type UIEvent =
  | WorkflowStartedEvent
  | WorkflowCompleteEvent
  | WorkflowFailedEvent
  | PhaseStartedEvent
  | PhaseCompleteEvent
  | PhaseFailedEvent
  | ToolCallEvent
  | ToolResultEvent
  | TextDeltaEvent
  | StepFinishEvent
  | ConfirmationRequestEvent
  | ApprovalRequestEvent
  | ClarificationRequestEvent
  | UserFeedbackEvent
  | ProgressUpdateEvent;
```

### 8.6 Graph Visualization Types

```typescript
/**
 * Graph node
 */
interface GraphNode {
  id: string;
  label: string;
  type: 'sequential' | 'parallel' | 'conditional';
  status: PhaseStatus;
  metadata: {
    duration?: number;
    command?: string;
    outputFile?: string;
  };
}

/**
 * Graph edge
 */
interface GraphEdge {
  source: string;
  target: string;
  type: 'dependency' | 'conditional';
  label?: string;
}

/**
 * Graph data for visualization
 */
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Graph interaction
 */
interface GraphInteraction {
  type: 'pan' | 'zoom' | 'click' | 'hover' | 'fit';
  target?: string; // Node ID
  delta?: { x: number; y: number }; // Pan
  scale?: number; // Zoom
}
```

---

## 9. Traceability

### 9.1 FR to Operation Mapping

| Functional Requirement | Operations                                      |
| ---------------------- | ----------------------------------------------- |
| FR-UI-001              | UI-OP-001, UI-OP-002, UI-OP-003                 |
| FR-UI-002              | UI-OP-001                                       |
| FR-UI-003              | UI-OP-020, UI-OP-023                            |
| FR-UI-004              | UI-OP-024                                       |
| FR-UI-005              | UI-OP-072                                       |
| FR-UI-006              | UI-OP-001, UI-OP-080                            |
| FR-UI-007              | (Configuration - handled by Gateway)            |
| FR-UI-008              | (Architecture constraint - Gateway abstraction) |
| FR-UI-009              | UI-OP-001                                       |
| FR-UI-010              | UI-OP-052                                       |
| FR-UI-011              | UI-OP-052                                       |
| FR-UI-012              | (Command structure - implicit in all commands)  |
| FR-UI-013              | UI-OP-010, UI-OP-011                            |
| FR-UI-014              | UI-OP-010                                       |
| FR-UI-015              | UI-OP-011                                       |
| FR-UI-016              | UI-OP-090                                       |
| FR-UI-017              | UI-OP-017                                       |
| FR-UI-018              | UI-OP-012                                       |
| FR-UI-019              | UI-OP-013                                       |
| FR-UI-020              | UI-OP-014                                       |
| FR-UI-021              | UI-OP-015                                       |
| FR-UI-022              | UI-OP-016                                       |
| FR-UI-023              | UI-OP-010, UI-OP-011 (options.args)             |
| FR-UI-024              | UI-OP-010, UI-OP-011 (options.model)            |
| FR-UI-025              | UI-OP-024                                       |
| FR-UI-026              | UI-OP-072                                       |
| FR-UI-027              | UI-OP-080 (Desktop UI layout)                   |
| FR-UI-028              | UI-OP-080 (Desktop UI header)                   |
| FR-UI-029              | UI-OP-080                                       |
| FR-UI-030              | UI-OP-081, UI-OP-020                            |
| FR-UI-031              | UI-OP-082                                       |
| FR-UI-032              | UI-OP-081                                       |
| FR-UI-033              | UI-OP-081                                       |
| FR-UI-034              | UI-OP-083                                       |
| FR-UI-035              | UI-OP-081                                       |
| FR-UI-036              | UI-OP-081                                       |
| FR-UI-037              | UI-OP-083                                       |
| FR-UI-038              | UI-OP-083                                       |
| FR-UI-039              | UI-OP-021                                       |
| FR-UI-040              | UI-OP-022                                       |
| FR-UI-041              | (Auto-scroll - rendering behavior)              |
| FR-UI-042              | (Message filtering - rendering behavior)        |
| FR-UI-043              | UI-OP-070, UI-OP-071                            |
| FR-UI-044              | UI-OP-080 (Responsive design)                   |
| FR-UI-045              | UI-OP-023                                       |
| FR-UI-046              | UI-OP-073                                       |
| FR-UI-047              | UI-OP-040, UI-OP-041, UI-OP-042                 |
| FR-UI-048              | UI-OP-050                                       |
| FR-UI-049              | UI-OP-050, UI-OP-051                            |
| FR-UI-050              | (History display - UI-OP-052)                   |
| FR-UI-051              | UI-OP-060                                       |
| FR-UI-052              | UI-OP-060                                       |
| FR-UI-053              | UI-OP-060                                       |
| FR-UI-054              | UI-OP-061, UI-OP-062, UI-OP-063                 |
| FR-UI-055              | UI-OP-032                                       |
| FR-UI-056              | UI-OP-030                                       |
| FR-UI-057              | UI-OP-032                                       |
| FR-UI-058              | UI-OP-032 (checklist parameter)                 |
| FR-UI-059              | UI-OP-032 (maxRefinements parameter)            |
| FR-UI-060              | UI-OP-032 (timeout parameter)                   |
| FR-UI-061              | (Gateway handles auto-approval logic)           |
| FR-UI-062              | (Future - not covered in MVP)                   |
| FR-UI-063              | UI-OP-001 (direct library integration)          |
| FR-UI-064              | UI-OP-080 (multiple windows)                    |
| FR-UI-065              | UI-OP-080 (cross-platform)                      |

### 9.2 Operation Index

| Operation ID | Name                   | Type  | Implements                                            |
| ------------ | ---------------------- | ----- | ----------------------------------------------------- |
| UI-OP-001    | initialize             | Async | FR-UI-001, FR-UI-002, FR-UI-006, FR-UI-009            |
| UI-OP-002    | run                    | Async | FR-UI-001, FR-UI-006                                  |
| UI-OP-003    | shutdown               | Async | FR-UI-001                                             |
| UI-OP-010    | executeWorkflowCommand | Async | FR-UI-013, FR-UI-014                                  |
| UI-OP-011    | executeCommandCommand  | Async | FR-UI-013, FR-UI-015                                  |
| UI-OP-012    | listWorkflows          | Async | FR-UI-018                                             |
| UI-OP-013    | showWorkflow           | Async | FR-UI-019                                             |
| UI-OP-014    | validateWorkflow       | Async | FR-UI-020                                             |
| UI-OP-015    | listCommands           | Async | FR-UI-021                                             |
| UI-OP-016    | showCommand            | Async | FR-UI-022                                             |
| UI-OP-017    | initProject            | Async | FR-UI-017                                             |
| UI-OP-020    | renderProgress         | Sync  | FR-UI-003, FR-UI-030, FR-UI-031                       |
| UI-OP-021    | renderMessage          | Sync  | FR-UI-039, FR-UI-003                                  |
| UI-OP-022    | renderToolExecution    | Sync  | FR-UI-040                                             |
| UI-OP-023    | renderError            | Sync  | FR-UI-003, FR-UI-045                                  |
| UI-OP-024    | renderJson             | Sync  | FR-UI-025, FR-UI-004                                  |
| UI-OP-030    | promptUser             | Async | FR-UI-056                                             |
| UI-OP-031    | promptConfirmation     | Async | FR-UI-051, FR-UI-052, FR-UI-053                       |
| UI-OP-032    | promptApproval         | Async | FR-UI-055, FR-UI-057                                  |
| UI-OP-040    | pauseExecution         | Async | FR-UI-047                                             |
| UI-OP-041    | resumeExecution        | Async | FR-UI-047                                             |
| UI-OP-042    | cancelExecution        | Async | FR-UI-047                                             |
| UI-OP-050    | subscribeToEvents      | Async | FR-UI-049, FR-UI-048                                  |
| UI-OP-051    | handleEvent            | Sync  | FR-UI-049                                             |
| UI-OP-052    | hydrateFromState       | Async | FR-UI-010, FR-UI-011                                  |
| UI-OP-060    | showPermissionDialog   | Async | FR-UI-051, FR-UI-052, FR-UI-053                       |
| UI-OP-061    | getCachedDecision      | Sync  | FR-UI-054                                             |
| UI-OP-062    | cacheDecision          | Sync  | FR-UI-054                                             |
| UI-OP-063    | clearCachedDecisions   | Sync  | FR-UI-054                                             |
| UI-OP-070    | setTheme               | Sync  | FR-UI-043                                             |
| UI-OP-071    | getAvailableThemes     | Sync  | FR-UI-043                                             |
| UI-OP-072    | setColorEnabled        | Sync  | FR-UI-026, FR-UI-005                                  |
| UI-OP-073    | savePreferences        | Async | FR-UI-046                                             |
| UI-OP-080    | launchWebUI            | Async | FR-UI-029, FR-UI-006                                  |
| UI-OP-081    | renderWorkflowGraph    | Sync  | FR-UI-030, FR-UI-032, FR-UI-033, FR-UI-035, FR-UI-036 |
| UI-OP-082    | updateGraphState       | Sync  | FR-UI-031                                             |
| UI-OP-083    | handleGraphInteraction | Sync  | FR-UI-034, FR-UI-037, FR-UI-038                       |
| UI-OP-090    | showHelp               | Sync  | FR-UI-016                                             |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-12-04 | Architecture Team | Initial extraction and design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.1     | 2025-12-15 | Architecture Team | Desktop-first approach: Updated directories, class names, and terminology                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.2     | 2025-12-17 | Architecture Team | **Event naming alignment with Vercel AI SDK**: Updated event names to match SDK naming: `TOOL_CALL_START` → `TOOL_CALL`, `TOOL_CALL_COMPLETE` → `TOOL_RESULT`, `MESSAGE_CHUNK` → `TEXT_DELTA`, `MESSAGE_COMPLETE` → `STEP_FINISH`. Updated UIEventType enum, UIEvent union types, code examples, and event subscription tables. **Type alignment**: Updated `ToolResultDisplay` from simple object to union type matching Agent Executor (supports string, FileDiff, AnsiOutput, TodoList). Aligns with Agent Executor v3.1 and Gateway v1.2. |
