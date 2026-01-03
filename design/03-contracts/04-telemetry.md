# Telemetry - Interface Contract

> **Component ID**: COMP-004
> **Document Version**: 1.1
> **Last Updated**: 2025-12-03
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Component Requirements](../../requirements/04-telemetry.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **Telemetry** component, specifying the logging, metrics, tracing, and export capabilities it provides to all other components.

### 1.2 Component Summary

| Attribute                    | Value                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| **Component ID**             | COMP-004                                                                                   |
| **Directory**                | `packages/core/src/telemetry/`                                                             |
| **Main Exports**             | Logger functions, Metrics functions, SDK lifecycle                                         |
| **Responsibility**           | Tracing, logging, metrics collection, telemetry export, cost attribution, privacy controls |
| **Provides Interfaces To**   | All components (COMP-001 through COMP-007)                                                 |
| **Requires Interfaces From** | COMP-001 (Configuration Manager)                                                           |

### 1.3 Contract ID Convention

Operations follow the format: **TL-OP-XXX**

### 1.4 Key Design Pattern

**Direct Function Calls**: Unlike event-driven patterns, Telemetry uses **direct function calls** for logging and metrics. Components import and call telemetry functions directly, passing a `Config` instance for context.

```typescript
// Pattern: Direct call, not event-driven
import { logToolCall, recordToolCallMetrics } from '@flomaster/core/telemetry';

// Components call directly
logToolCall(config, new ToolCallEvent(toolCall));
recordToolCallMetrics(config, durationMs, { function_name: 'read-file', success: true });
```

---

## 2. Provided Interfaces

### 2.1 Interface: SDK Lifecycle

**Purpose**: Initialize and shut down the OpenTelemetry SDK

**Consumers**: COMP-001 (Configuration Manager) at startup

---

#### TL-OP-001: initializeTelemetry

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-001                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-006, FR-TL-016, FR-TL-017 |

**Signature**:

```typescript
function initializeTelemetry(config: Config): void;
```

**Purpose**: Initialize the OpenTelemetry SDK with configured exporters.

**Preconditions**:

- Config must be initialized
- Should only be called once per session

**Postconditions**:

- OpenTelemetry SDK is started
- Span, log, and metric exporters are configured
- Metrics counters are initialized
- Signal handlers registered for graceful shutdown

**Behavior by Configuration**:

| Telemetry Target   | Export Destination                          |
| ------------------ | ------------------------------------------- |
| `gcp` + Project ID | Direct GCP export (Trace, Logging, Metrics) |
| OTLP endpoint      | OTLP gRPC or HTTP export                    |
| `outfile` path     | File-based export                           |
| None               | Console export (debug)                      |

**Example**:

```typescript
// Called by Config during initialization
const config = await Config.create();
initializeTelemetry(config);
```

---

#### TL-OP-002: shutdownTelemetry

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-002            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TL-016, FR-TL-019 |

**Signature**:

```typescript
function shutdownTelemetry(config: Config): Promise<void>;
```

**Purpose**: Gracefully shut down the OpenTelemetry SDK, flushing pending telemetry.

**Preconditions**:

- SDK should be initialized (gracefully handles if not)

**Postconditions**:

- All pending spans, logs, and metrics are flushed
- Exporters are closed
- SDK is marked as uninitialized
- Safe to call `initializeTelemetry()` again if needed

**Error Conditions**:

| Error Code              | Condition                 | Caller Action                            |
| ----------------------- | ------------------------- | ---------------------------------------- |
| `ERR_TL_FLUSH_TIMEOUT`  | Flush exceeds 30s timeout | Log warning, continue shutdown           |
| `ERR_TL_EXPORTER_CLOSE` | Exporter fails to close   | Log error, continue with other exporters |

---

#### TL-OP-003: isTelemetrySdkInitialized

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-003   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-030   |

**Signature**:

```typescript
function isTelemetrySdkInitialized(): boolean;
```

**Purpose**: Check if telemetry SDK is initialized (for conditional logging).

**Preconditions**:

- None (always safe to call)

**Postconditions**:

- Returns `true` if SDK is initialized and ready
- Returns `false` if SDK not initialized or was shut down
- No side effects

---

### 2.2 Interface: Event Logging

**Purpose**: Log structured events for tracing and debugging

**Consumers**: COMP-005 (Orchestrator), AI Execution Layer, Tools

---

#### TL-OP-004: logUserPrompt

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-004            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-011, FR-TL-031 |

**Signature**:

```typescript
function logUserPrompt(config: Config, event: UserPromptEvent): void;
```

**Purpose**: Log user prompt submission events.

**Preconditions**:

- Config must be initialized
- Event must have valid `prompt_id` (non-empty string)

**Postconditions**:

- User prompt event is recorded to OpenTelemetry logs
- Event is correlated with current session ID
- If `logPrompts` disabled, prompt content is omitted

**Error Conditions**:

| Error Code             | Condition               | Caller Action           |
| ---------------------- | ----------------------- | ----------------------- |
| `ERR_TL_SDK_NOT_INIT`  | SDK not initialized     | Skip logging (no-op)    |
| `ERR_TL_INVALID_EVENT` | Missing required fields | Log warning, skip event |

**Event Schema**:

| Field           | Type      | Description                                |
| --------------- | --------- | ------------------------------------------ |
| `prompt_length` | `number`  | Character count of prompt                  |
| `prompt_id`     | `string`  | Unique identifier for this prompt          |
| `auth_type`     | `string?` | Authentication method used                 |
| `prompt`        | `string?` | Full prompt (only if `logPrompts` enabled) |

**Privacy**: Full prompt content only logged if `config.getTelemetryLogPromptsEnabled()` is true.

---

#### TL-OP-005: logToolCall

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-005                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-011, FR-TL-021, FR-TL-022 |

**Signature**:

```typescript
function logToolCall(config: Config, event: ToolCallEvent): void;
```

**Purpose**: Log tool invocation with timing, success status, and decision.

**Preconditions**:

- Config must be initialized
- Telemetry SDK must be initialized (`isTelemetrySdkInitialized() === true`)
- Event must have valid `function_name` (non-empty string)

**Postconditions**:

- Tool call event is recorded to OpenTelemetry logs
- Tool call metrics are recorded via `recordToolCallMetrics()`
- Event is correlated with current session ID and prompt ID

**Error Conditions**:

| Error Code             | Condition               | Caller Action           |
| ---------------------- | ----------------------- | ----------------------- |
| `ERR_TL_SDK_NOT_INIT`  | SDK not initialized     | Skip logging (no-op)    |
| `ERR_TL_INVALID_EVENT` | Missing required fields | Log warning, skip event |

**Event Schema**:

| Field             | Type                      | Description                                               |
| ----------------- | ------------------------- | --------------------------------------------------------- |
| `function_name`   | `string`                  | Tool name                                                 |
| `function_args`   | `Record<string, unknown>` | Tool arguments                                            |
| `duration_ms`     | `number`                  | Execution time                                            |
| `success`         | `boolean`                 | Whether tool succeeded                                    |
| `decision`        | `ToolCallDecision?`       | `'accept'` \| `'reject'` \| `'modify'` \| `'auto_accept'` |
| `error`           | `string?`                 | Error message if failed                                   |
| `error_type`      | `string?`                 | Error classification                                      |
| `prompt_id`       | `string`                  | Associated prompt ID                                      |
| `tool_type`       | `'native'` \| `'mcp'`     | Tool source                                               |
| `content_length`  | `number?`                 | Result size                                               |
| `mcp_server_name` | `string?`                 | MCP server (if MCP tool)                                  |
| `metadata`        | `object?`                 | Additional data (e.g., diff stats)                        |

**Side Effects**: Also records metrics via `recordToolCallMetrics()`.

---

#### TL-OP-006: logApiRequest

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-006            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-011, FR-TL-024 |

**Signature**:

```typescript
function logApiRequest(config: Config, event: ApiRequestEvent): void;
```

**Purpose**: Log outbound LLM API request.

**Preconditions**:

- Config must be initialized
- Event must have valid `model` and `prompt_id`

**Postconditions**:

- API request event is recorded to OpenTelemetry logs
- Request text only included if `logPrompts` enabled
- Event is correlated with prompt ID

**Event Schema**:

| Field          | Type      | Description                                  |
| -------------- | --------- | -------------------------------------------- |
| `model`        | `string`  | Model name                                   |
| `prompt_id`    | `string`  | Associated prompt ID                         |
| `request_text` | `string?` | Request content (if prompts logging enabled) |

---

#### TL-OP-007: logApiResponse

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-007                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-011, FR-TL-024, FR-TL-026 |

**Signature**:

```typescript
function logApiResponse(config: Config, event: ApiResponseEvent): void;
```

**Purpose**: Log LLM API response with token usage.

**Preconditions**:

- Config must be initialized
- Event must have valid `model` and usage data

**Postconditions**:

- API response event is recorded to OpenTelemetry logs
- API latency metrics recorded via `recordApiResponseMetrics()`
- Token usage metrics recorded via `recordTokenUsageMetrics()`
- Cost calculated and attributed to current execution context

**Event Schema**:

| Field                              | Type      | Description     |
| ---------------------------------- | --------- | --------------- |
| `model`                            | `string`  | Model name      |
| `duration_ms`                      | `number`  | Request latency |
| `status_code`                      | `number?` | HTTP status     |
| `usage.input_token_count`          | `number`  | Input tokens    |
| `usage.output_token_count`         | `number`  | Output tokens   |
| `usage.cached_content_token_count` | `number`  | Cached tokens   |
| `usage.thoughts_token_count`       | `number`  | Thinking tokens |
| `usage.tool_token_count`           | `number`  | Tool-use tokens |
| `usage.total_token_count`          | `number`  | Total tokens    |

**Side Effects**: Records metrics via `recordApiResponseMetrics()` and `recordTokenUsageMetrics()`.

---

#### TL-OP-008: logApiError

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-008                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-011, FR-TL-022, FR-TL-024 |

**Signature**:

```typescript
function logApiError(config: Config, event: ApiErrorEvent): void;
```

**Purpose**: Log LLM API errors with error classification.

**Preconditions**:

- Config must be initialized
- Event must have valid `model` and `error` fields

**Postconditions**:

- API error event is recorded to OpenTelemetry logs
- Error is classified by type for metrics aggregation
- Failure metrics are incremented

**Event Schema**:

| Field         | Type                | Description               |
| ------------- | ------------------- | ------------------------- |
| `model`       | `string`            | Model name                |
| `error`       | `string`            | Error message             |
| `error_type`  | `string?`           | Error classification      |
| `status_code` | `number \| string?` | HTTP status or error code |
| `duration_ms` | `number`            | Time until error          |

---

#### TL-OP-009: logAgentStart

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-009            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-007, FR-TL-010 |

**Signature**:

```typescript
function logAgentStart(config: Config, event: AgentStartEvent): void;
```

**Purpose**: Log agent execution start for hierarchical tracing.

**Preconditions**:

- Config must be initialized
- Event must have valid `agent_id` (unique) and `agent_name`

**Postconditions**:

- Agent start event is recorded to OpenTelemetry logs
- New trace span is created for this agent
- Trace context is available for child operations via `getTraceContext()`

**Event Schema**:

| Field        | Type     | Description              |
| ------------ | -------- | ------------------------ |
| `agent_id`   | `string` | Unique agent instance ID |
| `agent_name` | `string` | Agent definition name    |

---

#### TL-OP-010: logAgentFinish

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-010                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-007, FR-TL-010, FR-TL-021 |

**Signature**:

```typescript
function logAgentFinish(config: Config, event: AgentFinishEvent): void;
```

**Purpose**: Log agent execution completion with duration and termination reason.

**Preconditions**:

- Config must be initialized
- Corresponding `logAgentStart` must have been called with same `agent_id`
- Event must have valid duration and termination reason

**Postconditions**:

- Agent finish event is recorded to OpenTelemetry logs
- Agent duration metrics recorded via `recordAgentRunMetrics()`
- Trace span for this agent is closed
- Success/failure metrics updated based on termination reason

**Event Schema**:

| Field              | Type                 | Description              |
| ------------------ | -------------------- | ------------------------ |
| `agent_id`         | `string`             | Unique agent instance ID |
| `agent_name`       | `string`             | Agent definition name    |
| `duration_ms`      | `number`             | Total execution time     |
| `turn_count`       | `number`             | Number of LLM turns      |
| `terminate_reason` | `AgentTerminateMode` | Why agent stopped        |

**AgentTerminateMode Values**:

```typescript
enum AgentTerminateMode {
  GOAL = 'GOAL', // Completed objective
  TIMEOUT = 'TIMEOUT', // Time limit reached
  MAX_TURNS = 'MAX_TURNS', // Turn limit reached
  ABORTED = 'ABORTED', // User/system abort
  ERROR = 'ERROR', // Unrecoverable error
}
```

**Side Effects**: Records metrics via `recordAgentRunMetrics()`.

---

#### TL-OP-011: logFileOperation

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-011   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-011   |

**Signature**:

```typescript
function logFileOperation(config: Config, event: FileOperationEvent): void;
```

**Purpose**: Log file operations (read, write, create) for usage tracking.

**Preconditions**:

- Config must be initialized
- Event must have valid `tool_name` and `operation`

**Postconditions**:

- File operation event is recorded to OpenTelemetry logs
- File operation metrics recorded via `recordFileOperationMetric()`
- Programming language detected and attributed if applicable

**Event Schema**:

| Field                  | Type            | Description                          |
| ---------------------- | --------------- | ------------------------------------ |
| `tool_name`            | `string`        | Tool that performed operation        |
| `operation`            | `FileOperation` | `'create'` \| `'read'` \| `'update'` |
| `lines`                | `number?`       | Lines affected                       |
| `mimetype`             | `string?`       | File MIME type                       |
| `extension`            | `string?`       | File extension                       |
| `programming_language` | `string?`       | Detected language                    |

---

### 2.3 Interface: Metrics Recording

**Purpose**: Record quantitative metrics for monitoring and analysis

**Consumers**: COMP-005 (Orchestrator), AI Execution Layer, Tools

---

#### TL-OP-012: recordToolCallMetrics

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-012            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-021, FR-TL-022 |

**Signature**:

```typescript
function recordToolCallMetrics(
  config: Config,
  durationMs: number,
  attributes: {
    function_name: string;
    success: boolean;
    decision?: ToolCallDecision;
    tool_type?: 'native' | 'mcp';
  }
): void;
```

**Purpose**: Record tool call count and latency metrics.

**Preconditions**:

- Config must be initialized
- `function_name` must be non-empty string
- `durationMs` must be >= 0

**Postconditions**:

- Tool call counter incremented with attributes
- Latency histogram updated with duration
- Metrics available for export via configured exporters

**Metrics Emitted**:

- `flomaster.tool.call.count` (Counter)
- `flomaster.tool.call.latency` (Histogram, ms)

---

#### TL-OP-013: recordTokenUsageMetrics

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-013   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-026   |

**Signature**:

```typescript
function recordTokenUsageMetrics(
  config: Config,
  tokenCount: number,
  attributes: {
    model: string;
    type: 'input' | 'output' | 'thought' | 'cache' | 'tool';
    genAiAttributes?: GenAiAttributes;
  }
): void;
```

**Purpose**: Record token usage by type and model.

**Preconditions**:

- Config must be initialized
- `tokenCount` must be >= 0
- `model` must be non-empty string

**Postconditions**:

- Token usage counter incremented with model and type attributes
- GenAI semantic convention metrics updated
- Token counts contribute to session totals

**Metrics Emitted**:

- `flomaster.token.usage` (Counter)
- `gen_ai.client.token.usage` (Histogram, OpenTelemetry GenAI convention)

---

#### TL-OP-014: recordApiResponseMetrics

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-014            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-024, FR-TL-025 |

**Signature**:

```typescript
function recordApiResponseMetrics(
  config: Config,
  durationMs: number,
  attributes: {
    model: string;
    status_code?: number | string;
    genAiAttributes?: GenAiAttributes;
  }
): void;
```

**Purpose**: Record API request count and latency.

**Preconditions**:

- Config must be initialized
- `durationMs` must be >= 0
- `model` must be non-empty string

**Postconditions**:

- API request counter incremented
- Latency histogram updated with duration
- GenAI operation duration metric recorded

**Metrics Emitted**:

- `flomaster.api.request.count` (Counter)
- `flomaster.api.request.latency` (Histogram, ms)
- `gen_ai.client.operation.duration` (Histogram, s, OpenTelemetry GenAI convention)

---

#### TL-OP-015: recordFileOperationMetric

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-015   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-025   |

**Signature**:

```typescript
function recordFileOperationMetric(
  config: Config,
  attributes: {
    operation: FileOperation;
    lines?: number;
    mimetype?: string;
    extension?: string;
    programming_language?: string;
  }
): void;
```

**Purpose**: Record file operation counts.

**Preconditions**:

- Config must be initialized
- `operation` must be valid FileOperation enum value

**Postconditions**:

- File operation counter incremented with operation type
- Language/extension attributes recorded if provided

**Metrics Emitted**:

- `flomaster.file.operation.count` (Counter)

---

### 2.4 Interface: Development Tracing

**Purpose**: Wrap operations in trace spans for debugging

**Consumers**: All components during development

---

#### TL-OP-016: runInDevTraceSpan

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-016            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TL-007, FR-TL-033 |

**Signature**:

```typescript
function runInDevTraceSpan<R>(
  opts: SpanOptions & { name: string; noAutoEnd?: boolean },
  fn: (context: { metadata: SpanMetadata; endSpan: () => void }) => Promise<R>
): Promise<R>;
```

**Purpose**: Execute a function within a trace span, capturing input/output.

**Preconditions**:

- `name` must be non-empty string
- `fn` must be an async function

**Postconditions**:

- If `FLOWMASTER_DEV_TRACING=true`: Span is created, function executed, span closed
- If `FLOWMASTER_DEV_TRACING` not set: Function executed directly (no span overhead)
- Input/output captured in span metadata
- Errors captured and span marked as failed

**Environment Guard**: Only creates spans if `FLOWMASTER_DEV_TRACING=true`.

**SpanMetadata**:

```typescript
interface SpanMetadata {
  name: string;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  attributes: Record<string, AttributeValue>;
}
```

**Example**:

```typescript
const result = await runInDevTraceSpan({ name: 'execute-phase' }, async ({ metadata }) => {
  metadata.input = { phaseName: 'implement' };
  const output = await executePhase(phase);
  metadata.output = output;
  return output;
});
```

---

### 2.5 Interface: Configuration Resolution

**Purpose**: Resolve telemetry settings from multiple sources

**Consumers**: COMP-001 (Configuration Manager)

---

#### TL-OP-017: resolveTelemetrySettings

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-017            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TL-002, FR-TL-006 |

**Signature**:

```typescript
function resolveTelemetrySettings(options: {
  argv?: TelemetryArgOverrides;
  env?: Record<string, string | undefined>;
  settings?: TelemetrySettings;
}): Promise<TelemetrySettings>;
```

**Purpose**: Resolve telemetry configuration from CLI args, environment, and settings file.

**Preconditions**:

- None (all parameters are optional)

**Postconditions**:

- Returns resolved TelemetrySettings with all sources merged
- Higher precedence sources override lower precedence
- Missing values remain undefined (caller applies defaults)

**Resolution Precedence** (highest to lowest):

1. CLI arguments (`--telemetry`, `--telemetry-target`, etc.)
2. Environment variables (`FLOWMASTER_TELEMETRY_ENABLED`, etc.)
3. Settings file (`telemetry.enabled`, etc.)

**Response Schema**:

```typescript
interface TelemetrySettings {
  enabled?: boolean;
  target?: TelemetryTarget;
  otlpEndpoint?: string;
  otlpProtocol?: 'grpc' | 'http';
  logPrompts?: boolean;
  outfile?: string;
  useCollector?: boolean;
}
```

---

### 2.6 Interface: Observability Platform Integration (Langfuse)

**Purpose**: Integrate with Langfuse for LLM observability, trace visualization, and cost tracking

**Consumers**: COMP-005 (Orchestrator), AI Execution Layer

**Pattern Source**: Adapted from Clearcut batch logging pattern

---

#### TL-OP-018: initializeLangfuse

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-018   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-018   |

**Signature**:

```typescript
function initializeLangfuse(config: Config): void;
```

**Purpose**: Initialize Langfuse client for LLM observability (singleton, opt-in).

**Preconditions**:

- Config must be initialized
- Langfuse credentials must be configured if enabled

**Postconditions**:

- If `config.getLangfuseEnabled()` is true: Singleton LangfuseLogger instance created
- If `config.getLangfuseEnabled()` is false: No-op (no instance created)
- Batch flush interval configured (default 60s)
- Shutdown handler registered for graceful flush

**Error Conditions**:

| Error Code                    | Condition                           | Caller Action                          |
| ----------------------------- | ----------------------------------- | -------------------------------------- |
| `ERR_TL_LANGFUSE_CREDENTIALS` | Missing publicKey or secretKey      | Log warning, continue without Langfuse |
| `ERR_TL_LANGFUSE_CONNECTION`  | Cannot connect to Langfuse endpoint | Log warning, buffer events locally     |

**Behavior**:

- Only initializes if `config.getLangfuseEnabled()` returns true
- Creates singleton instance of `LangfuseLogger`
- Configures batch flush interval (default 60s, like Clearcut)
- Registers shutdown handler for graceful flush

**Configuration**:

```typescript
interface LangfuseConfig {
  enabled?: boolean;
  publicKey: string;
  secretKey: string;
  baseUrl?: string; // For self-hosted instances
  flushInterval?: number; // Default 60000ms
  maxBatchSize?: number; // Default 100 events
}
```

---

#### TL-OP-019: getTraceContext

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-019            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TL-008, FR-TL-009 |

**Signature**:

```typescript
function getTraceContext(): TraceContext | undefined;
```

**Purpose**: Get current trace context for propagation to child agents/components.

**Preconditions**:

- None (always safe to call)

**Postconditions**:

- Returns current TraceContext if within an active trace
- Returns undefined if no active trace
- Does not modify trace state

**Response Schema**:

```typescript
interface TraceContext {
  /** Unique trace ID (UUID) */
  traceId: string;
  /** Current span ID */
  spanId: string;
  /** Parent span ID (if nested) */
  parentSpanId?: string;
  /** Session ID for correlation */
  sessionId: string;
  /** Task ID for workflow correlation */
  taskId?: string;
}
```

**Use Case**: When AI Execution Layer spawns a child agent, it passes trace context:

```typescript
const parentContext = getTraceContext();
const childAgent = await agentManager.spawn(definition, {
  traceContext: parentContext, // Propagate for correlation
});
```

---

#### TL-OP-020: startTrace

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TL-OP-020                       |
| **Type**         | Synchronous                     |
| **Implements**   | FR-TL-007, FR-TL-008, FR-TL-010 |

**Signature**:

```typescript
function startTrace(name: string, metadata?: TraceMetadata): TraceHandle;
```

**Purpose**: Start a new trace or continue from parent context. Returns handle for adding spans/generations.

**Preconditions**:

- `name` must be non-empty string
- If `parentContext` provided, it must be a valid TraceContext

**Postconditions**:

- New trace created in Langfuse (if enabled)
- TraceHandle returned for adding spans, generations, scores
- If parentContext provided, trace is correlated with parent
- Trace context is now active (retrievable via `getTraceContext()`)

**Request Schema**:

| Field                    | Type           | Required | Description                                |
| ------------------------ | -------------- | -------- | ------------------------------------------ |
| `name`                   | `string`       | Yes      | Trace name (typically agent/workflow name) |
| `metadata.parentContext` | `TraceContext` | No       | Parent context for correlation             |
| `metadata.taskId`        | `string`       | No       | Associated task ID                         |
| `metadata.userId`        | `string`       | No       | User identifier                            |
| `metadata.tags`          | `string[]`     | No       | Classification tags                        |

**Response Schema**:

```typescript
interface TraceHandle {
  /** Unique trace ID */
  traceId: string;

  /** Update trace metadata */
  update(data: Partial<TraceData>): void;

  /** End the trace with optional output */
  end(output?: unknown): void;

  /** Create a child span (for operations within trace) */
  span(name: string, metadata?: SpanMetadata): SpanHandle;

  /** Record an LLM generation (API call) */
  generation(data: GenerationData): void;

  /** Record a score/evaluation */
  score(data: ScoreData): void;
}

interface SpanHandle {
  spanId: string;
  update(data: Partial<SpanData>): void;
  end(output?: unknown): void;
  span(name: string): SpanHandle; // Nested spans
}
```

**Example**:

```typescript
// In AI Execution Layer
const trace = startTrace('implement-feature', {
  taskId: 'TASK-123',
  parentContext: inheritedContext,
});

try {
  // Record LLM call
  trace.generation({
    name: 'planning',
    model: 'claude-3-opus',
    input: messages,
    output: response,
    usage: { input: 1000, output: 500 },
  });

  // Record tool execution as span
  const toolSpan = trace.span('read-file');
  const result = await executeTool();
  toolSpan.end(result);

  trace.end({ success: true, output: finalResult });
} catch (error) {
  trace.update({ error: error.message });
  trace.end({ success: false });
}
```

---

#### TL-OP-021: recordRetryMetrics

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-021   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-023   |

**Signature**:

```typescript
function recordRetryMetrics(config: Config, attributes: RetryMetricAttributes): void;
```

**Purpose**: Record retry attempt metrics for monitoring retry patterns.

**Preconditions**:

- Config must be initialized
- `attemptNumber` must be >= 1
- `delayMs` must be >= 0

**Postconditions**:

- Retry attempt counter incremented with reason and success attributes
- Cumulative delay counter updated
- If `attemptNumber == maxRetries && !success`, exhausted counter incremented

**Request Schema**:

```typescript
interface RetryMetricAttributes {
  /** Which attempt (1-indexed) */
  attemptNumber: number;
  /** Maximum retries configured */
  maxRetries: number;
  /** Delay before this attempt (ms) */
  delayMs: number;
  /** Why retry was needed */
  reason: 'rate_limit' | 'timeout' | 'server_error' | 'content_filter' | 'network';
  /** Whether this attempt succeeded */
  success: boolean;
  /** Operation being retried */
  operation: string;
  /** Model (for API retries) */
  model?: string;
}
```

**Metrics Emitted**:

- `flomaster.retry.attempt.count` (Counter) - by reason, success
- `flomaster.retry.delay.total` (Counter) - cumulative delay time
- `flomaster.retry.success.count` (Counter) - successful retries
- `flomaster.retry.exhausted.count` (Counter) - retries exhausted

---

#### TL-OP-022: calculateCost

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-022   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-027   |

**Signature**:

```typescript
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens?: number
): CostBreakdown;
```

**Purpose**: Calculate cost breakdown for an LLM API call.

**Preconditions**:

- `model` must be non-empty string
- `inputTokens` and `outputTokens` must be >= 0
- `cachedTokens` (if provided) must be >= 0

**Postconditions**:

- Returns CostBreakdown with calculated costs
- If model not in pricing table, uses default pricing and logs warning
- Cost is in USD

**Error Conditions**:

| Error Code             | Condition                  | Caller Action                    |
| ---------------------- | -------------------------- | -------------------------------- |
| `ERR_TL_UNKNOWN_MODEL` | Model not in pricing table | Use default pricing, log warning |

**Response Schema**:

```typescript
interface CostBreakdown {
  /** Cost for input tokens */
  inputCost: number;
  /** Cost for output tokens */
  outputCost: number;
  /** Savings from cached tokens */
  cachedSavings: number;
  /** Total cost (input + output - savings) */
  totalCost: number;
  /** Currency (always USD) */
  currency: 'USD';
  /** Model used for pricing */
  model: string;
  /** Pricing tier applied */
  pricingTier: 'standard' | 'batch' | 'cached';
}
```

**Pricing Data**:

```typescript
// Internal pricing table (updated periodically)
const MODEL_PRICING: Record<string, { input: number; output: number; cached: number }> = {
  'claude-3-opus': { input: 0.015, output: 0.075, cached: 0.00375 },
  'claude-3-sonnet': { input: 0.003, output: 0.015, cached: 0.00075 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125, cached: 0.0000625 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005, cached: 0.0003125 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003, cached: 0.00001875 },
  'gpt-4o': { input: 0.005, output: 0.015, cached: 0.00125 },
  // ... other models
};
```

**Example**:

```typescript
const cost = calculateCost('claude-3-opus', 5000, 1500, 2000);
// Returns:
// {
//   inputCost: 0.075,    // 5000 * 0.015 / 1000
//   outputCost: 0.1125,  // 1500 * 0.075 / 1000
//   cachedSavings: 0.0075, // 2000 * 0.00375 / 1000
//   totalCost: 0.18,
//   currency: 'USD',
//   model: 'claude-3-opus',
//   pricingTier: 'standard'
// }
```

---

#### TL-OP-023: aggregateCost

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TL-OP-023            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TL-028, FR-TL-029 |

**Signature**:

```typescript
function aggregateCost(taskId: string): Promise<AggregatedCost>;
```

**Purpose**: Aggregate costs across an entire task execution hierarchy.

**Preconditions**:

- `taskId` must be non-empty string
- Task must have execution history (telemetry data available)

**Postconditions**:

- Returns AggregatedCost with breakdowns by agent, phase, and model
- Cost data can be persisted to State Manager via `saveArtifact()`
- All API response events for task are aggregated

**Error Conditions**:

| Error Code              | Condition                    | Caller Action               |
| ----------------------- | ---------------------------- | --------------------------- |
| `ERR_TL_TASK_NOT_FOUND` | No telemetry data for taskId | Return empty AggregatedCost |

**Response Schema**:

```typescript
interface AggregatedCost {
  /** Task ID */
  taskId: string;

  /** Breakdown by agent */
  byAgent: Record<string, AgentCost>;

  /** Breakdown by phase */
  byPhase: Record<string, PhaseCost>;

  /** Breakdown by model */
  byModel: Record<string, CostBreakdown>;

  /** Total across all execution */
  total: CostBreakdown;

  /** Token totals */
  tokens: {
    input: number;
    output: number;
    cached: number;
    total: number;
  };
}

interface AgentCost {
  agentId: string;
  agentName: string;
  cost: CostBreakdown;
  apiCalls: number;
  tokens: { input: number; output: number };
}

interface PhaseCost {
  phaseName: string;
  phaseIndex: number;
  cost: CostBreakdown;
  agents: string[]; // Agent IDs that contributed
}
```

**Integration with State Manager (FR-TL-029)**:

```typescript
// After task completion, cost is persisted to artifacts
const cost = await aggregateCost(taskId);
await stateManager.saveArtifact(taskId, 'cost-report.json', cost);
```

---

#### TL-OP-024: logFullResponse

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-024   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-032   |

**Signature**:

```typescript
function logFullResponse(config: Config, event: FullResponseEvent): void;
```

**Purpose**: Capture full LLM response content in debug mode.

**Preconditions**:

- Config must be initialized
- Event must have valid `model`, `promptId`, and `responseText`

**Postconditions**:

- If `debugMode` AND `logPrompts` enabled: Full response captured to artifacts
- If either disabled: Silent no-op (no response captured)
- Response is NOT sent to external telemetry (local only)

**Request Schema**:

```typescript
interface FullResponseEvent {
  /** Model that generated response */
  model: string;
  /** Associated prompt ID */
  promptId: string;
  /** Full response text */
  responseText: string;
  /** Structured output (if applicable) */
  structuredOutput?: unknown;
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'tool_use' | 'content_filter';
  /** Duration in ms */
  durationMs: number;
}
```

**Privacy Guard**:

```typescript
function logFullResponse(config: Config, event: FullResponseEvent): void {
  // Only log if BOTH debug mode AND log prompts are enabled
  if (!config.getDebugMode() || !config.getTelemetryLogPromptsEnabled()) {
    return; // Silent no-op
  }

  // Log to dev trace and/or file
  // ...
}
```

---

### 2.7 Interface: Langfuse Logger (Batch Pattern)

**Purpose**: Singleton batch logger for Langfuse events (adapted from Clearcut pattern)

---

#### TL-OP-025: LangfuseLogger.getInstance

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TL-OP-025   |
| **Type**         | Synchronous |
| **Implements**   | FR-TL-018   |

**Signature**:

```typescript
class LangfuseLogger {
  static getInstance(config?: Config): LangfuseLogger | undefined;
}
```

**Purpose**: Get singleton Langfuse logger instance (returns undefined if disabled).

**Preconditions**:

- None (safe to call without config to check if instance exists)

**Postconditions**:

- If config provided and Langfuse enabled: Returns singleton instance (creating if needed)
- If config provided and Langfuse disabled: Returns undefined
- If no config provided: Returns existing instance or undefined
- Instance is reused across calls (singleton pattern)

**Pattern** (from Clearcut):

```typescript
class LangfuseLogger {
  private static instance: LangfuseLogger;
  private langfuse: Langfuse;
  private traceStack: TraceHandle[] = [];
  private lastFlushTime: number = Date.now();
  private readonly FLUSH_INTERVAL_MS = 60000; // Same as Clearcut
  private readonly MAX_BATCH_SIZE = 100; // Same as MAX_RETRY_EVENTS

  private constructor(config: Config) {
    const langfuseConfig = config.getLangfuseConfig();
    this.langfuse = new Langfuse({
      publicKey: langfuseConfig.publicKey,
      secretKey: langfuseConfig.secretKey,
      baseUrl: langfuseConfig.baseUrl,
      flushAt: this.MAX_BATCH_SIZE,
      flushInterval: this.FLUSH_INTERVAL_MS,
    });
  }

  static getInstance(config?: Config): LangfuseLogger | undefined {
    if (!config?.getLangfuseEnabled()) return undefined;
    if (!LangfuseLogger.instance) {
      LangfuseLogger.instance = new LangfuseLogger(config);
    }
    return LangfuseLogger.instance;
  }

  /** Start trace for agent execution */
  startAgentTrace(event: AgentStartEvent, parentContext?: TraceContext): TraceHandle {
    const trace = this.langfuse.trace({
      id: event.agent_id,
      name: event.agent_name,
      sessionId: parentContext?.sessionId,
      metadata: { parentAgentId: parentContext?.spanId },
    });

    this.traceStack.push(trace);
    return trace;
  }

  /** Record LLM generation with cost */
  logGeneration(event: ApiResponseEvent): void {
    const currentTrace = this.traceStack[this.traceStack.length - 1];
    if (!currentTrace) return;

    const cost = calculateCost(
      event.model,
      event.usage.input_token_count,
      event.usage.output_token_count,
      event.usage.cached_content_token_count
    );

    currentTrace.generation({
      name: 'llm-call',
      model: event.model,
      modelParameters: { temperature: event.temperature },
      usage: {
        input: event.usage.input_token_count,
        output: event.usage.output_token_count,
        total: event.usage.total_token_count,
      },
      metadata: {
        cost: cost.totalCost,
        durationMs: event.duration_ms,
        cachedTokens: event.usage.cached_content_token_count,
      },
    });

    this.flushIfNeeded();
  }

  /** End agent trace */
  endAgentTrace(event: AgentFinishEvent): void {
    const trace = this.traceStack.pop();
    if (!trace) return;

    trace.update({
      output: { terminateReason: event.terminate_reason },
      metadata: {
        durationMs: event.duration_ms,
        turnCount: event.turn_count,
      },
    });
  }

  /** Flush if interval elapsed (like Clearcut) */
  private flushIfNeeded(): void {
    if (Date.now() - this.lastFlushTime < this.FLUSH_INTERVAL_MS) {
      return;
    }
    this.flush();
  }

  /** Explicit flush */
  async flush(): Promise<void> {
    await this.langfuse.flushAsync();
    this.lastFlushTime = Date.now();
  }

  /** Graceful shutdown */
  async shutdown(): Promise<void> {
    await this.flush();
    await this.langfuse.shutdownAsync();
  }
}
```

---

## 3. Required Interfaces

### 3.1 Configuration Manager (COMP-001)

| Operation                                | Purpose                                    | When Called             |
| ---------------------------------------- | ------------------------------------------ | ----------------------- |
| `config.getTelemetryEnabled()`           | Check if telemetry is enabled              | SDK initialization      |
| `config.getTelemetryTarget()`            | Get export target (local, gcp)             | SDK initialization      |
| `config.getTelemetryOtlpEndpoint()`      | Get OTLP collector endpoint                | SDK initialization      |
| `config.getTelemetryOtlpProtocol()`      | Get OTLP protocol (grpc, http)             | SDK initialization      |
| `config.getTelemetryLogPromptsEnabled()` | Check if prompt logging is allowed         | Every log call          |
| `config.getTelemetryOutfile()`           | Get file export path                       | SDK initialization      |
| `config.getSessionId()`                  | Get session ID for correlation             | Every log call          |
| `config.getDebugMode()`                  | Check if debug mode is active              | Debug-related logging   |
| `config.getLangfuseEnabled()`            | Check if Langfuse integration is enabled   | Langfuse initialization |
| `config.getLangfuseConfig()`             | Get Langfuse configuration (keys, baseUrl) | Langfuse initialization |

**Assumptions**:

- Config is initialized before any telemetry operation is called
- Config values do not change during a session (immutable after initialization)
- `getSessionId()` always returns a valid, unique session ID
- All getter methods return immediately (no async operations)

**Failure Handling**:

- If config unavailable: Skip telemetry operation (no-op), log warning to stderr
- If getter throws: Catch exception, use safe default, continue operation
- If getter returns undefined for optional value: Use component default

### 3.2 State Manager (COMP-003)

| Operation                     | Purpose                                            | When Called     |
| ----------------------------- | -------------------------------------------------- | --------------- |
| `stateManager.saveArtifact()` | Persist cost reports as task artifacts (FR-TL-029) | Task completion |

**Assumptions**:

- State Manager is available when `aggregateCost()` completes
- Artifact storage has sufficient space for cost report JSON
- Task ID exists in State Manager

**Failure Handling**:

- If State Manager unavailable: Log warning, cost report not persisted (telemetry continues)
- If save fails: Log error, retry once, then continue without persistence
- If disk full: Log error, cost available in memory but not persisted

---

## 4. Component Interaction Patterns

This section documents how other components interact with Telemetry, extracted from production patterns.

### 4.1 Config → Telemetry (SDK Initialization)

Configuration Manager initializes Telemetry during startup:

```typescript
class Config {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load configuration...

    // Initialize telemetry if enabled
    if (this.getTelemetryEnabled()) {
      initializeTelemetry(this);
    }

    this.initialized = true;
  }
}
```

### 4.2 AI Execution Layer → Telemetry (Execution Logging)

AI Execution Layer (via WorkflowEngine coordination) logs lifecycle events and API interactions:

```typescript
class AgentSession<TOutput> {
  private config: Config;
  private agentId: string;
  private agentName: string;
  private startTime: number;
  private turnCount: number = 0;

  async run(inputs: AgentInputs, signal: AbortSignal): Promise<OutputObject<TOutput>> {
    // Log agent start
    logAgentStart(this.config, new AgentStartEvent(this.agentId, this.agentName));
    this.startTime = Date.now();

    try {
      // Execute turns...
      for await (const turn of this.executeTurns(inputs, signal)) {
        this.turnCount++;

        // Log API request
        logApiRequest(this.config, new ApiRequestEvent(this.model, this.promptId));

        // ... make LLM call ...

        // Log API response with token usage
        logApiResponse(this.config, new ApiResponseEvent(
          this.model,
          turn.durationMs,
          promptDetails,
          responseDetails,
          authType,
          turn.usageMetadata
        ));

        // Log tool calls
        for (const toolCall of turn.toolCalls) {
          logToolCall(this.config, new ToolCallEvent(toolCall));
        }
      }

      // Log agent finish
      logAgentFinish(this.config, new AgentFinishEvent(
        this.agentId,
        this.agentName,
        Date.now() - this.startTime,
        this.turnCount,
        AgentTerminateMode.GOAL
      ));

      return result;
    } catch (error) {
      // Log error
      logApiError(this.config, new ApiErrorEvent(...));

      // Log agent finish with error
      logAgentFinish(this.config, new AgentFinishEvent(
        this.agentId,
        this.agentName,
        Date.now() - this.startTime,
        this.turnCount,
        AgentTerminateMode.ERROR
      ));

      throw error;
    }
  }
}
```

### 4.3 Tools → Telemetry (File Operation Logging)

File operation tools log their activity:

```typescript
// read-file tool
class ReadFileToolInvocation extends BaseToolInvocation {
  async execute(): Promise<ToolResult> {
    const startTime = Date.now();
    const content = await fs.readFile(this.params.path, 'utf-8');

    // Log file operation
    logFileOperation(
      this.config,
      new FileOperationEvent(
        'ReadFile',
        FileOperation.READ,
        content.split('\n').length,
        getMimeType(this.params.path),
        path.extname(this.params.path),
        getProgrammingLanguage(this.params.path)
      )
    );

    return { llmContent: content };
  }
}

// write-file tool
class WriteFileToolInvocation extends BaseToolInvocation {
  async execute(): Promise<ToolResult> {
    const operation = (await fs.stat(this.params.path).catch(() => null))
      ? FileOperation.UPDATE
      : FileOperation.CREATE;

    await fs.writeFile(this.params.path, this.params.content);

    // Log file operation
    logFileOperation(
      this.config,
      new FileOperationEvent(
        'WriteFile',
        operation,
        this.params.content.split('\n').length,
        getMimeType(this.params.path),
        path.extname(this.params.path),
        getProgrammingLanguage(this.params.path)
      )
    );

    return { llmContent: 'File written successfully' };
  }
}
```

### 4.4 Orchestrator → Telemetry (Phase Metrics)

Orchestrator can use dev tracing for debugging:

```typescript
class WorkflowEngine {
  async executePhase(phase: PhaseDefinition): Promise<PhaseResult> {
    return runInDevTraceSpan({ name: `phase:${phase.name}` }, async ({ metadata }) => {
      metadata.input = { phaseName: phase.name, commands: phase.commands.length };

      const result = await this.runPhase(phase);

      metadata.output = { success: result.success, duration: result.durationMs };
      return result;
    });
  }
}
```

### 4.5 Api → Telemetry (Session Metrics)

Api can expose session metrics to UI:

```typescript
import { uiTelemetryService } from '@flomaster/core/telemetry';

class Api {
  getSessionMetrics(): SessionMetrics {
    return uiTelemetryService.getSessionMetrics();
  }

  getRecentEvents(): UiEvent[] {
    return uiTelemetryService.getEvents();
  }
}
```

### 4.6 Interaction Summary

| Component          | Import                                                                                             | Functions Used            |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------- |
| Config             | `initializeTelemetry`, `shutdownTelemetry`, `resolveTelemetrySettings`                             | SDK lifecycle             |
| AI Execution Layer | `logAgentStart`, `logAgentFinish`, `logApiRequest`, `logApiResponse`, `logApiError`, `logToolCall` | Execution logging         |
| Tools              | `logFileOperation`, `logToolCall`                                                                  | Operation logging         |
| Orchestrator       | `runInDevTraceSpan`                                                                                | Debug tracing             |
| Api                | `uiTelemetryService`                                                                               | Session metrics           |
| All                | Event classes                                                                                      | Structured event creation |

### 4.7 Dependency Injection Pattern

All telemetry functions receive `Config` as the first parameter, enabling:

- Access to session ID for correlation
- Access to telemetry settings (enabled, log prompts, etc.)
- Common attributes (session ID, installation ID)

```typescript
// Common attributes added to all telemetry
function getCommonAttributes(config: Config): Attributes {
  return {
    'session.id': config.getSessionId(),
    'installation.id': installationManager.getInstallationId(),
    interactive: config.isInteractive(),
  };
}
```

---

## 5. Type Definitions

### 5.1 Telemetry Target Enum

```typescript
/**
 * Export destination for telemetry data.
 */
export enum TelemetryTarget {
  /** Export to Google Cloud (Trace, Logging, Metrics) */
  GCP = 'gcp',
  /** Local-only (file or console) */
  LOCAL = 'local',
}
```

### 5.2 Base Event Interface

```typescript
/**
 * Base interface for all telemetry events.
 */
export interface BaseTelemetryEvent {
  /** Event type identifier */
  'event.name': string;
  /** ISO 8601 timestamp */
  'event.timestamp': string;
}
```

### 5.3 Tool Call Decision

```typescript
/**
 * Tool confirmation decision from policy engine or user.
 */
export enum ToolCallDecision {
  /** Tool was auto-accepted by policy */
  AUTO_ACCEPT = 'auto_accept',
  /** Tool was accepted by user */
  ACCEPT = 'accept',
  /** Tool was rejected by policy or user */
  REJECT = 'reject',
  /** Tool arguments were modified by user */
  MODIFY = 'modify',
}
```

### 5.4 Agent Terminate Mode

```typescript
/**
 * Reason an agent terminated execution.
 */
export enum AgentTerminateMode {
  /** Completed its objective */
  GOAL = 'GOAL',
  /** Time limit exceeded */
  TIMEOUT = 'TIMEOUT',
  /** Maximum turns reached */
  MAX_TURNS = 'MAX_TURNS',
  /** Aborted by user or system */
  ABORTED = 'ABORTED',
  /** Unrecoverable error */
  ERROR = 'ERROR',
}
```

### 5.5 File Operation

```typescript
/**
 * Type of file operation.
 */
export enum FileOperation {
  /** New file created */
  CREATE = 'create',
  /** Existing file read */
  READ = 'read',
  /** Existing file modified */
  UPDATE = 'update',
}
```

### 5.6 GenAI Convention Types

```typescript
/**
 * OpenTelemetry GenAI semantic convention operation names.
 */
export enum GenAiOperationName {
  GENERATE_CONTENT = 'generate_content',
}

/**
 * OpenTelemetry GenAI semantic convention provider names.
 */
export enum GenAiProviderName {
  ANTHROPIC = 'anthropic',
  GOOGLE_GEN_AI = 'gcp.gen_ai',
  GOOGLE_VERTEX_AI = 'gcp.vertex_ai',
  OPENAI = 'openai',
}

/**
 * Token types for usage tracking.
 */
export enum GenAiTokenType {
  INPUT = 'input',
  OUTPUT = 'output',
}
```

### 5.7 Telemetry Settings

```typescript
/**
 * Configuration for telemetry behavior.
 */
export interface TelemetrySettings {
  /** Whether telemetry is enabled (opt-in required) */
  enabled?: boolean;
  /** Export target */
  target?: TelemetryTarget;
  /** OTLP collector endpoint */
  otlpEndpoint?: string;
  /** OTLP protocol */
  otlpProtocol?: 'grpc' | 'http';
  /** Whether to log full prompt content */
  logPrompts?: boolean;
  /** File path for local export */
  outfile?: string;
  /** Whether to use OTLP collector (vs direct export) */
  useCollector?: boolean;
}
```

### 5.8 Session Metrics

```typescript
/**
 * Aggregated metrics for a session (for UI display).
 */
export interface SessionMetrics {
  totalTokens: {
    input: number;
    output: number;
    cached: number;
  };
  toolCalls: {
    total: number;
    successful: number;
    failed: number;
  };
  apiCalls: {
    total: number;
    errors: number;
    totalDurationMs: number;
  };
}
```

### 5.9 Span Metadata

```typescript
/**
 * Metadata for development trace spans.
 */
export interface SpanMetadata {
  /** Span name */
  name: string;
  /** Input data (serialized to JSON) */
  input?: unknown;
  /** Output data (serialized to JSON) */
  output?: unknown;
  /** Error if span failed */
  error?: unknown;
  /** Additional span attributes */
  attributes: Record<string, AttributeValue>;
}
```

### 5.10 Trace Context

```typescript
/**
 * Context for trace correlation across components.
 */
export interface TraceContext {
  /** Unique trace ID (UUID) */
  traceId: string;
  /** Current span ID */
  spanId: string;
  /** Parent span ID (if nested) */
  parentSpanId?: string;
  /** Session ID for correlation */
  sessionId: string;
  /** Task ID for workflow correlation */
  taskId?: string;
}
```

### 5.11 Cost Breakdown

```typescript
/**
 * Cost breakdown for a single LLM API call.
 */
export interface CostBreakdown {
  /** Cost for input tokens (USD) */
  inputCost: number;
  /** Cost for output tokens (USD) */
  outputCost: number;
  /** Savings from cached tokens (USD) */
  cachedSavings: number;
  /** Total cost: input + output - savings (USD) */
  totalCost: number;
  /** Currency (always USD) */
  currency: 'USD';
  /** Model used for pricing */
  model: string;
  /** Pricing tier applied */
  pricingTier: 'standard' | 'batch' | 'cached';
}

/**
 * Aggregated cost across a task execution.
 */
export interface AggregatedCost {
  /** Task ID */
  taskId: string;
  /** Breakdown by agent */
  byAgent: Record<string, AgentCost>;
  /** Breakdown by phase */
  byPhase: Record<string, PhaseCost>;
  /** Breakdown by model */
  byModel: Record<string, CostBreakdown>;
  /** Total across all execution */
  total: CostBreakdown;
  /** Token totals */
  tokens: {
    input: number;
    output: number;
    cached: number;
    total: number;
  };
}

export interface AgentCost {
  agentId: string;
  agentName: string;
  cost: CostBreakdown;
  apiCalls: number;
  tokens: { input: number; output: number };
}

export interface PhaseCost {
  phaseName: string;
  phaseIndex: number;
  cost: CostBreakdown;
  agents: string[];
}
```

### 5.12 Retry Metric Attributes

```typescript
/**
 * Attributes for retry metrics.
 */
export interface RetryMetricAttributes {
  /** Which attempt (1-indexed) */
  attemptNumber: number;
  /** Maximum retries configured */
  maxRetries: number;
  /** Delay before this attempt (ms) */
  delayMs: number;
  /** Why retry was needed */
  reason: 'rate_limit' | 'timeout' | 'server_error' | 'content_filter' | 'network';
  /** Whether this attempt succeeded */
  success: boolean;
  /** Operation being retried */
  operation: string;
  /** Model (for API retries) */
  model?: string;
}
```

### 5.13 Langfuse Configuration

```typescript
/**
 * Configuration for Langfuse integration.
 */
export interface LangfuseConfig {
  /** Whether Langfuse is enabled */
  enabled?: boolean;
  /** Langfuse public key */
  publicKey: string;
  /** Langfuse secret key */
  secretKey: string;
  /** Custom Langfuse URL (for self-hosted) */
  baseUrl?: string;
  /** Flush interval in ms (default 60000) */
  flushInterval?: number;
  /** Max events before auto-flush (default 100) */
  maxBatchSize?: number;
}
```

### 5.14 Trace Handle

```typescript
/**
 * Handle for managing an active trace.
 */
export interface TraceHandle {
  /** Unique trace ID */
  traceId: string;
  /** Update trace metadata */
  update(data: Partial<TraceData>): void;
  /** End the trace with optional output */
  end(output?: unknown): void;
  /** Create a child span */
  span(name: string, metadata?: SpanMetadata): SpanHandle;
  /** Record an LLM generation */
  generation(data: GenerationData): void;
  /** Record a score/evaluation */
  score(data: ScoreData): void;
}

export interface SpanHandle {
  spanId: string;
  update(data: Partial<SpanData>): void;
  end(output?: unknown): void;
  span(name: string): SpanHandle;
}

export interface GenerationData {
  name: string;
  model: string;
  input?: unknown;
  output?: unknown;
  usage?: {
    input: number;
    output: number;
    total?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ScoreData {
  name: string;
  value: number;
  comment?: string;
}
```

---

## 6. Events Published

Telemetry does not publish events. It receives calls directly and exports to OpenTelemetry.

---

## 7. Events Subscribed

Telemetry may optionally subscribe to WorkflowEngine events for automatic collection:

| Event               | Publisher          | Handler Behavior        |
| ------------------- | ------------------ | ----------------------- |
| `TOOL_RESULT`       | AI Execution Layer | Record tool metrics     |
| `STEP_COMPLETE`     | Orchestrator       | Record step duration    |
| `WORKFLOW_COMPLETE` | Orchestrator       | Record workflow metrics |

**Note**: This subscription is optional. Primary pattern is direct function calls.

---

## 8. Invariants

| Invariant           | Description                                  | Enforcement                   |
| ------------------- | -------------------------------------------- | ----------------------------- |
| Opt-In Required     | External telemetry disabled by default       | `enabled: false` default      |
| Privacy First       | Prompts not logged unless explicitly enabled | `logPrompts` flag check       |
| Non-Blocking        | Telemetry failures don't block execution     | Try-catch with silent logging |
| Session Correlation | All events include session ID                | `getCommonAttributes()`       |
| SDK Single Init     | SDK initialized once per session             | `telemetryInitialized` flag   |

---

## 9. Performance Expectations

| Operation                       | Expected Latency | Throughput | Notes               |
| ------------------------------- | ---------------- | ---------- | ------------------- |
| TL-OP-001 (initializeTelemetry) | < 100ms          | 1/session  | Startup cost        |
| TL-OP-004-011 (log\*)           | < 1ms            | 1000/sec   | Async export        |
| TL-OP-012-015 (record\*)        | < 1ms            | 1000/sec   | Async export        |
| TL-OP-016 (runInDevTraceSpan)   | < 1ms overhead   | N/A        | Only if env var set |
| Export batching                 | 10-30s intervals | N/A        | Configurable        |

---

## 10. Versioning and Compatibility

### 10.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 10.2 OpenTelemetry Compliance

Telemetry follows OpenTelemetry semantic conventions:

- `gen_ai.*` attributes for LLM operations
- Standard resource attributes (`service.name`, `service.version`)
- OTLP export protocol

---

## 11. Traceability

### 11.1 FR to Operation Mapping

| Functional Requirement                           | Operations                                 | Notes                              |
| ------------------------------------------------ | ------------------------------------------ | ---------------------------------- |
| FR-TL-001 (Sensitive Data Filtering)             | Privacy checks in all log functions        | Invariant: Privacy First           |
| FR-TL-002 (Telemetry Opt-Out)                    | TL-OP-017                                  | Settings resolution                |
| FR-TL-003 (Local-Only Mode)                      | TL-OP-001, TL-OP-017                       | Configurable via `target: 'local'` |
| FR-TL-004 (Telemetry Documentation)              | N/A                                        | Policy/documentation requirement   |
| FR-TL-005 (Privacy-First Data Collection Policy) | N/A                                        | Invariant: Opt-In Required         |
| FR-TL-006 (Telemetry Opt-In)                     | TL-OP-001, TL-OP-017                       |                                    |
| FR-TL-007 (Trace ID Generation)                  | TL-OP-009, TL-OP-016, TL-OP-020            |                                    |
| FR-TL-008 (Parent-Child Trace Correlation)       | TL-OP-019, TL-OP-020                       |                                    |
| FR-TL-009 (Trace Context Propagation)            | TL-OP-019, TL-OP-020                       |                                    |
| FR-TL-010 (Trace Data Capture)                   | TL-OP-009, TL-OP-010, TL-OP-016, TL-OP-020 |                                    |
| FR-TL-011 (JSON Log Format)                      | TL-OP-004 through TL-OP-011                |                                    |
| FR-TL-012 (Log Severity Levels)                  | TL-OP-004 through TL-OP-011                | Severity in event classes          |
| FR-TL-013 (Log Output Destinations)              | TL-OP-001, TL-OP-017                       | Configured via settings            |
| FR-TL-014 (Real-Time Log Streaming)              | TL-OP-004 through TL-OP-011                | Immediate logging, async export    |
| FR-TL-015 (Log Verbosity Configuration)          | TL-OP-017                                  | Verbosity in settings              |
| FR-TL-016 (Pluggable Export Adapters)            | TL-OP-001                                  |                                    |
| FR-TL-017 (OpenTelemetry Support)                | TL-OP-001                                  |                                    |
| FR-TL-018 (Langfuse Integration)                 | TL-OP-018, TL-OP-025                       |                                    |
| FR-TL-019 (Export Failure Handling)              | TL-OP-002                                  | Graceful shutdown                  |
| FR-TL-020 (Adapter Enable/Disable)               | TL-OP-001, TL-OP-017, TL-OP-018            | Per-adapter config                 |
| FR-TL-021 (Execution Duration)                   | TL-OP-010, TL-OP-012                       |                                    |
| FR-TL-022 (Success/Failure Rate)                 | TL-OP-005, TL-OP-008, TL-OP-012            |                                    |
| FR-TL-023 (Retry Metrics)                        | TL-OP-021                                  |                                    |
| FR-TL-024 (Provider Latency)                     | TL-OP-006, TL-OP-007, TL-OP-008, TL-OP-014 |                                    |
| FR-TL-025 (Metrics Export)                       | TL-OP-012 through TL-OP-015                |                                    |
| FR-TL-026 (Token Usage)                          | TL-OP-007, TL-OP-013                       |                                    |
| FR-TL-027 (Cost Calculation)                     | TL-OP-022                                  |                                    |
| FR-TL-028 (Cost Aggregation)                     | TL-OP-023                                  |                                    |
| FR-TL-029 (Cost Data in Artifacts)               | TL-OP-023                                  | Integration with State Manager     |
| FR-TL-030 (Debug Mode)                           | TL-OP-003                                  |                                    |
| FR-TL-031 (Full Prompt Capture)                  | TL-OP-004 (with logPrompts enabled)        |                                    |
| FR-TL-032 (Full Response Capture)                | TL-OP-024                                  |                                    |
| FR-TL-033 (Intermediate State)                   | TL-OP-016                                  |                                    |

**Coverage Summary**: 33 FRs total

- **31 FRs** mapped to operations
- **2 FRs** are policy/documentation requirements (FR-TL-004, FR-TL-005) - covered by Invariants section

### 11.2 Operation Index

| Operation ID | Name                       | Type  | Implements                      |
| ------------ | -------------------------- | ----- | ------------------------------- |
| TL-OP-001    | initializeTelemetry        | Sync  | FR-TL-006, FR-TL-016, FR-TL-017 |
| TL-OP-002    | shutdownTelemetry          | Async | FR-TL-016, FR-TL-019            |
| TL-OP-003    | isTelemetrySdkInitialized  | Sync  | FR-TL-030                       |
| TL-OP-004    | logUserPrompt              | Sync  | FR-TL-011, FR-TL-031            |
| TL-OP-005    | logToolCall                | Sync  | FR-TL-011, FR-TL-021, FR-TL-022 |
| TL-OP-006    | logApiRequest              | Sync  | FR-TL-011, FR-TL-024            |
| TL-OP-007    | logApiResponse             | Sync  | FR-TL-011, FR-TL-024, FR-TL-026 |
| TL-OP-008    | logApiError                | Sync  | FR-TL-011, FR-TL-022, FR-TL-024 |
| TL-OP-009    | logAgentStart              | Sync  | FR-TL-007, FR-TL-010            |
| TL-OP-010    | logAgentFinish             | Sync  | FR-TL-007, FR-TL-010, FR-TL-021 |
| TL-OP-011    | logFileOperation           | Sync  | FR-TL-011                       |
| TL-OP-012    | recordToolCallMetrics      | Sync  | FR-TL-021, FR-TL-022            |
| TL-OP-013    | recordTokenUsageMetrics    | Sync  | FR-TL-026                       |
| TL-OP-014    | recordApiResponseMetrics   | Sync  | FR-TL-024, FR-TL-025            |
| TL-OP-015    | recordFileOperationMetric  | Sync  | FR-TL-025                       |
| TL-OP-016    | runInDevTraceSpan          | Async | FR-TL-007, FR-TL-033            |
| TL-OP-017    | resolveTelemetrySettings   | Async | FR-TL-002, FR-TL-006            |
| TL-OP-018    | initializeLangfuse         | Sync  | FR-TL-018                       |
| TL-OP-019    | getTraceContext            | Sync  | FR-TL-008, FR-TL-009            |
| TL-OP-020    | startTrace                 | Sync  | FR-TL-007, FR-TL-008, FR-TL-010 |
| TL-OP-021    | recordRetryMetrics         | Sync  | FR-TL-023                       |
| TL-OP-022    | calculateCost              | Sync  | FR-TL-027                       |
| TL-OP-023    | aggregateCost              | Async | FR-TL-028, FR-TL-029            |
| TL-OP-024    | logFullResponse            | Sync  | FR-TL-032                       |
| TL-OP-025    | LangfuseLogger.getInstance | Sync  | FR-TL-018                       |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                                                                            |
| ------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2025-12-03 | Architecture Team | Initial extraction and adaptation                                                                                                                                                                                  |
| 1.1     | 2025-12-03 | Architecture Team | Enhanced with template compliance: added Preconditions/Postconditions/Error Conditions to all operations, updated Required Interfaces with Assumptions and Failure Handling, complete FR coverage mapping (33 FRs) |
