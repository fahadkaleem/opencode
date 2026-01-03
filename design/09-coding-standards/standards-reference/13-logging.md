# Logging & Observability Standards

> **Standard ID**: STD-013
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: All TypeScript/Node.js CLI applications
> **Enforcement**: Manual Review + Structural Checks
> **Related Documents**:
>
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md)
> - [Pattern-Based Template](../../templates/99-standards/02-pattern-based-template.md)
> - [Error Handling Patterns](./06-error-handling.md)
> - [Configuration Management](./11-configuration.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory logging and observability patterns for TypeScript/Node.js CLI applications. These patterns ensure consistent, structured, and actionable logs across all components while supporting debugging, monitoring, and production telemetry.

### 1.2 Scope

**Applies to**:

- Debug logging during development
- User feedback and notifications
- Structured telemetry events
- OpenTelemetry tracing and metrics
- stdout/stderr handling
- Console output management in TUI applications

**Does NOT apply to**:

- Application-specific business event logging (use telemetry events)
- Third-party library internal logging
- Build-time or compilation logs

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Architecture review, structural linting |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle                    | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| Separation of Concerns       | Debug logs, user feedback, and telemetry are distinct systems    |
| Structured over Unstructured | All production logs use structured formats (JSON, OpenTelemetry) |
| Context Propagation          | Logs include correlation IDs for request/operation tracing       |
| Conditional Verbosity        | Debug output controlled by configuration, not code changes       |
| User-Facing Clarity          | User feedback messages are human-readable, not technical         |

---

## 3. Architectural Overview

### 3.1 Logging Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Code                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  Services   │  │  Commands   │  │   Agents    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Logging Abstraction Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │DebugLogger  │  │ CoreEvents  │  │ Telemetry   │                  │
│  │(dev logs)   │  │(user feed)  │  │(production) │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Output Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ConsolePatch │  │  Event Bus  │  │  Exporters  │                  │
│  │(TUI compat) │  │(UI binding) │  │(OTLP/File)  │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
     ┌─────────┐      ┌─────────┐      ┌─────────┐
     │ stderr  │      │   TUI   │      │External │
     │(debug)  │      │(Ink/UI) │      │(OTLP)   │
     └─────────┘      └─────────┘      └─────────┘
```

### 3.2 Logging System Responsibilities

| System            | Purpose                  | Output                      | When to Use                  |
| ----------------- | ------------------------ | --------------------------- | ---------------------------- |
| **DebugLogger**   | Developer debugging      | stderr (when debug enabled) | Development, troubleshooting |
| **CoreEvents**    | User feedback            | TUI/stdout                  | User-facing messages         |
| **Telemetry**     | Production monitoring    | OTLP/File/Console           | Metrics, tracing, analytics  |
| **SessionLogger** | Conversation persistence | JSON file                   | Chat history, checkpoints    |

### 3.3 Data Flow

| Source                      | Destination               | Format           | Condition                 |
| --------------------------- | ------------------------- | ---------------- | ------------------------- |
| `debugLogger.*`             | stderr via ConsolePatcher | Plain text       | `debugMode: true`         |
| `coreEvents.emitFeedback()` | TUI component             | Structured event | Always                    |
| `telemetryService.record()` | OTLP exporter             | OpenTelemetry    | `telemetry.enabled: true` |
| `sessionLogger.append()`    | JSON file                 | Structured JSON  | Always                    |

---

## 4. Debug Logger Pattern

### 4.1 When to Use

Use the debug logger when:

- Logging internal application state for developers
- Tracing execution flow during development
- Recording error details not suitable for users

Do NOT use the debug logger when:

- Communicating with users (use CoreEvents)
- Recording production metrics (use Telemetry)
- Persisting conversation history (use SessionLogger)

### 4.2 Structure

```
src/
├── utils/
│   └── debugLogger.ts    # Singleton debug logger
├── core/
│   └── ConsolePatcher.ts # Console interception for TUI
└── index.ts              # Logger initialization
```

### 4.3 Implementation Template

```typescript
/**
 * Debug logger for development-time logging.
 *
 * Wraps console methods to enable:
 * - Conditional debug output based on configuration
 * - TUI-compatible output via ConsolePatcher
 * - Consistent log formatting
 *
 * Usage:
 *   import { debugLogger } from './utils/debugLogger.js';
 *   debugLogger.debug('Processing started', { itemCount: 42 });
 */
class DebugLogger {
  /**
   * General information logging.
   * Use for significant events during normal operation.
   */
  log(...args: unknown[]): void {
    console.log(...args);
  }

  /**
   * Warning-level logging.
   * Use for unexpected but recoverable conditions.
   */
  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  /**
   * Error-level logging.
   * Use for operation failures and exceptions.
   */
  error(...args: unknown[]): void {
    console.error(...args);
  }

  /**
   * Debug-level logging.
   * Only output when debug mode is enabled.
   * Use for detailed trace information.
   */
  debug(...args: unknown[]): void {
    console.debug(...args);
  }

  /**
   * Info-level logging.
   * Use for informational messages.
   */
  info(...args: unknown[]): void {
    console.info(...args);
  }
}

export const debugLogger = new DebugLogger();
```

### 4.4 Log Levels

| Level   | Method                | Purpose                        | Visible When      |
| ------- | --------------------- | ------------------------------ | ----------------- |
| `error` | `debugLogger.error()` | Critical failures, exceptions  | Always            |
| `warn`  | `debugLogger.warn()`  | Non-critical issues, fallbacks | Always            |
| `info`  | `debugLogger.info()`  | Significant events             | Always            |
| `log`   | `debugLogger.log()`   | General debug information      | Always            |
| `debug` | `debugLogger.debug()` | Detailed trace information     | `debugMode: true` |

### 4.5 Usage Examples

```typescript
// CORRECT: Error with context
debugLogger.error('Failed to load configuration:', error);

// CORRECT: Warning with actionable information
debugLogger.warn(
  `Relative path ${includePath} found in includeDirectories. ` + `Please use absolute paths.`
);

// CORRECT: Debug with structured data
debugLogger.debug('Evaluating policy', {
  policyType: condition.type,
  toolName,
  result: allowed,
});

// CORRECT: Conditional level based on debug mode
config.getDebugMode() ? debugLogger.warn(error) : debugLogger.debug(error);
```

```typescript
// INCORRECT: Using console directly (bypasses patching)
console.log('Debug message'); // Wrong

// INCORRECT: Using debug logger for user messages
debugLogger.log('Operation completed successfully!'); // Wrong - use CoreEvents

// INCORRECT: Logging sensitive data
debugLogger.debug('User credentials:', { password: user.password }); // Wrong
```

---

## 5. User Feedback Pattern

### 5.1 When to Use

Use user feedback events when:

- Communicating operation status to users
- Displaying warnings or errors the user should see
- Providing progress updates

Do NOT use when:

- Logging internal debug information
- Recording telemetry data

### 5.2 Structure

```
src/
├── core/
│   ├── events.ts         # Event definitions and emitter
│   └── CoreEvents.ts     # Singleton event manager
└── ui/
    └── FeedbackDisplay.tsx # UI component for feedback
```

### 5.3 Implementation Template

```typescript
/**
 * Severity levels for user feedback.
 */
export type FeedbackSeverity = 'info' | 'warning' | 'error';

/**
 * Payload for user feedback events.
 */
export interface UserFeedbackPayload {
  /** Severity determines visual treatment in UI */
  severity: FeedbackSeverity;
  /** Human-readable message for the user */
  message: string;
  /** Optional error object for additional context */
  error?: unknown;
}

/**
 * Core event types for the application.
 */
export enum CoreEvent {
  UserFeedback = 'user-feedback',
  Output = 'output',
  ConsoleLog = 'console-log',
}

/**
 * Event emitter for user-facing notifications.
 */
class CoreEvents {
  private emitter = new EventEmitter();
  private eventBacklog: Array<{ event: CoreEvent; payload: unknown }> = [];
  private readonly MAX_BACKLOG_SIZE = 10000;

  /**
   * Emit feedback to the user interface.
   * @param severity - Visual treatment level
   * @param message - Human-readable message
   * @param error - Optional error for context
   */
  emitFeedback(severity: FeedbackSeverity, message: string, error?: unknown): void {
    const payload: UserFeedbackPayload = { severity, message, error };
    this._emitOrQueue(CoreEvent.UserFeedback, payload);
  }

  private _emitOrQueue(event: CoreEvent, payload: unknown): void {
    if (this.emitter.listenerCount(event) > 0) {
      this.emitter.emit(event, payload);
    } else if (this.eventBacklog.length < this.MAX_BACKLOG_SIZE) {
      this.eventBacklog.push({ event, payload });
    }
  }
}

export const coreEvents = new CoreEvents();
```

### 5.4 Feedback Severity Guide

| Severity  | When to Use                            | UI Treatment  | Example                       |
| --------- | -------------------------------------- | ------------- | ----------------------------- |
| `info`    | Success, progress, neutral updates     | Blue/default  | "Configuration loaded"        |
| `warning` | Recoverable issues, deprecations       | Yellow/orange | "API key expires in 7 days"   |
| `error`   | Operation failures, user action needed | Red           | "Failed to connect to server" |

### 5.5 Usage Examples

```typescript
// CORRECT: Info for successful operations
coreEvents.emitFeedback('info', 'Workflow completed successfully');

// CORRECT: Warning with actionable guidance
coreEvents.emitFeedback('warning', 'Configuration file not found. Using defaults.');

// CORRECT: Error with context
coreEvents.emitFeedback('error', 'Failed to refresh tokens. Please try logging in again.', error);
```

```typescript
// INCORRECT: Technical message for users
coreEvents.emitFeedback('error', 'ECONNREFUSED 127.0.0.1:8080'); // Wrong

// CORRECT: User-friendly error
coreEvents.emitFeedback(
  'error',
  'Unable to connect to the server. Please check your network connection.',
  error
);
```

---

## 6. Telemetry Pattern

### 6.1 When to Use

Use telemetry when:

- Recording metrics for production monitoring
- Tracing request flow across components
- Capturing usage analytics

Do NOT use when:

- Debugging during development (use DebugLogger)
- Displaying information to users (use CoreEvents)

### 6.2 Structure

```
src/
├── telemetry/
│   ├── sdk.ts              # OpenTelemetry SDK initialization
│   ├── types.ts            # Event type definitions
│   ├── metrics.ts          # Metric definitions and recording
│   ├── trace.ts            # Tracing utilities
│   └── telemetryAttributes.ts  # Common attributes
└── config/
    └── telemetrySettings.ts    # Telemetry configuration
```

### 6.3 Telemetry Event Template

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

/**
 * Tool call telemetry event.
 * Records tool execution metrics.
 */
export class ToolCallEvent implements BaseTelemetryEvent {
  'event.name' = 'tool_call' as const;
  'event.timestamp': string;

  /** Tool function name */
  functionName: string;
  /** Tool arguments (sanitized) */
  functionArgs: Record<string, unknown>;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Whether the call succeeded */
  success: boolean;
  /** User decision (if permission required) */
  decision?: 'approved' | 'denied' | 'auto_approved';
  /** Error message if failed */
  error?: string;
  /** Error type classification */
  errorType?: string;
  /** Correlation ID for the prompt */
  promptId: string;
  /** Tool type */
  toolType: 'native' | 'mcp';
  /** Response content length */
  contentLength?: number;

  constructor(data: Omit<ToolCallEvent, 'event.name' | 'event.timestamp' | 'toLogBody'>) {
    this['event.timestamp'] = new Date().toISOString();
    Object.assign(this, data);
  }

  /**
   * Human-readable log summary.
   */
  toLogBody(): string {
    return (
      `Tool call: ${this.functionName}` +
      `${this.decision ? `. Decision: ${this.decision}` : ''}` +
      `. Success: ${this.success}` +
      `. Duration: ${this.durationMs}ms.`
    );
  }
}
```

### 6.4 Common Attributes

```typescript
/**
 * Standard attributes included with all telemetry events.
 */
export interface CommonTelemetryAttributes {
  /** Unique session identifier */
  'session.id': string;
  /** Installation identifier (anonymous) */
  'installation.id': string;
  /** Whether running interactively */
  interactive: boolean;
  /** User email (if authenticated, optional) */
  'user.email'?: string;
}

/**
 * Get common attributes for telemetry events.
 */
export function getCommonAttributes(config: Config): CommonTelemetryAttributes {
  return {
    'session.id': config.getSessionId(),
    'installation.id': installationManager.getInstallationId(),
    interactive: config.isInteractive(),
  };
}
```

### 6.5 Metrics Definition

```typescript
/**
 * Metric name constants.
 */
export const METRICS = {
  TOOL_CALL_COUNT: 'app.tool.call.count',
  TOOL_CALL_LATENCY: 'app.tool.call.latency',
  API_REQUEST_COUNT: 'app.api.request.count',
  API_REQUEST_LATENCY: 'app.api.request.latency',
  TOKEN_USAGE: 'app.token.usage',
  SESSION_COUNT: 'app.session.count',
  AGENT_RUN_COUNT: 'app.agent.run.count',
  MEMORY_USAGE: 'app.memory.usage',
} as const;

/**
 * Record tool call metrics.
 */
export function recordToolCallMetrics(
  config: Config,
  durationMs: number,
  attributes: {
    functionName: string;
    success: boolean;
    toolType: 'native' | 'mcp';
  }
): void {
  if (!isMetricsInitialized) return;

  const metricAttributes = {
    ...getCommonAttributes(config),
    ...attributes,
  };

  toolCallCounter.add(1, metricAttributes);
  toolCallLatencyHistogram.record(durationMs, {
    ...getCommonAttributes(config),
    function_name: attributes.functionName,
  });
}
```

### 6.6 Telemetry Configuration

```typescript
/**
 * Telemetry configuration options.
 */
export interface TelemetrySettings {
  /** Whether telemetry is enabled */
  enabled?: boolean;
  /** Export target */
  target?: 'otlp' | 'gcp' | 'file' | 'console';
  /** OTLP endpoint URL */
  otlpEndpoint?: string;
  /** OTLP protocol */
  otlpProtocol?: 'grpc' | 'http';
  /** Whether to log prompt content */
  logPrompts?: boolean;
  /** File path for file export */
  outfile?: string;
}
```

---

## 7. Tracing Pattern

### 7.1 When to Use

Use tracing when:

- Tracking request flow across async boundaries
- Measuring operation duration
- Correlating logs across components

### 7.2 Span Management

```typescript
/**
 * Span metadata for tracing.
 */
export interface SpanMetadata {
  /** Span name */
  name: string;
  /** Input data (sanitized) */
  input?: unknown;
  /** Output data (sanitized) */
  output?: unknown;
  /** Error if failed */
  error?: unknown;
  /** Additional attributes */
  attributes: Record<string, AttributeValue>;
}

/**
 * Execute a function within a trace span.
 * Only creates spans when tracing is enabled.
 *
 * @param opts - Span options
 * @param fn - Function to execute within span
 */
export async function runInTraceSpan<R>(
  opts: { name: string; attributes?: Record<string, AttributeValue> },
  fn: (context: { metadata: SpanMetadata; endSpan: () => void }) => Promise<R>
): Promise<R> {
  // Check if tracing is enabled
  if (process.env['DEV_TRACING'] !== 'true') {
    const metadata: SpanMetadata = { name: opts.name, attributes: {} };
    return await fn({ metadata, endSpan: () => {} });
  }

  const tracer = trace.getTracer('app-cli', 'v1');

  return await tracer.startActiveSpan(opts.name, async (span) => {
    const metadata: SpanMetadata = {
      name: opts.name,
      attributes: opts.attributes ?? {},
    };

    try {
      const result = await fn({
        metadata,
        endSpan: () => span.end(),
      });

      if (metadata.output) {
        span.setAttribute('output', JSON.stringify(metadata.output));
      }
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      metadata.error = error;
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### 7.3 Usage Example

```typescript
async generateContent(
  request: GenerateContentRequest,
  promptId: string,
): Promise<GenerateContentResponse> {
  return runInTraceSpan(
    { name: 'generateContent' },
    async ({ metadata }) => {
      // Record input for tracing
      metadata.input = {
        model: request.model,
        promptId,
      };

      const response = await this.client.generate(request);

      // Record output for tracing
      metadata.output = {
        usageMetadata: response.usageMetadata,
      };

      return response;
    },
  );
}
```

---

## 8. Console Patching Pattern

### 8.1 When to Use

Use console patching when:

- Running a TUI application (Ink, blessed, etc.)
- Need to intercept third-party library console output
- Separating debug output from UI rendering

### 8.2 Implementation

```typescript
/**
 * Console patcher configuration.
 */
interface ConsolePatcherParams {
  /** Write to stderr instead of UI */
  stderr: boolean;
  /** Enable debug level output */
  debugMode: boolean;
  /** Callback for UI message display */
  onNewMessage?: (message: ConsoleLogPayload) => void;
}

/**
 * Patches console methods for TUI compatibility.
 * Intercepts console.* calls and routes them appropriately.
 */
export class ConsolePatcher {
  private params: ConsolePatcherParams;
  private originalConsoleLog = console.log;
  private originalConsoleWarn = console.warn;
  private originalConsoleError = console.error;
  private originalConsoleDebug = console.debug;
  private originalConsoleInfo = console.info;

  constructor(params: ConsolePatcherParams) {
    this.params = params;
  }

  /**
   * Create a patched console method.
   */
  private patchConsoleMethod =
    (type: 'log' | 'warn' | 'error' | 'debug' | 'info') =>
    (...args: unknown[]) => {
      // Filter debug logs unless debug mode is enabled
      if (type === 'debug' && !this.params.debugMode) {
        return;
      }

      if (this.params.stderr) {
        this.originalConsoleError(this.formatArgs(args));
      } else {
        this.params.onNewMessage?.({
          type,
          content: this.formatArgs(args),
        });
      }
    };

  /**
   * Format arguments for output.
   */
  private formatArgs(args: unknown[]): string {
    return args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' ');
  }

  /**
   * Apply patches to console methods.
   */
  patch(): void {
    console.log = this.patchConsoleMethod('log');
    console.warn = this.patchConsoleMethod('warn');
    console.error = this.patchConsoleMethod('error');
    console.debug = this.patchConsoleMethod('debug');
    console.info = this.patchConsoleMethod('info');
  }

  /**
   * Restore original console methods.
   */
  unpatch(): void {
    console.log = this.originalConsoleLog;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
    console.debug = this.originalConsoleDebug;
    console.info = this.originalConsoleInfo;
  }
}
```

---

## 9. stdout/stderr Handling

### 9.1 Stream Separation Rules

| Content Type                | Stream | Rationale                  |
| --------------------------- | ------ | -------------------------- |
| Command output (JSON, data) | stdout | Enables piping and parsing |
| User messages, progress     | stdout | User visibility            |
| Debug logs                  | stderr | Separates from data output |
| Errors                      | stderr | Standard convention        |

### 9.2 Implementation

```typescript
/**
 * Original stream references for direct writing.
 */
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

/**
 * Write directly to stdout, bypassing any patches.
 * Use for command output that must go to stdout.
 */
export function writeToStdout(chunk: Uint8Array | string, encoding?: BufferEncoding): boolean {
  return originalStdoutWrite(chunk, encoding);
}

/**
 * Write directly to stderr, bypassing any patches.
 * Use for debug output that must go to stderr.
 */
export function writeToStderr(chunk: Uint8Array | string, encoding?: BufferEncoding): boolean {
  return originalStderrWrite(chunk, encoding);
}

/**
 * Patch stdio streams for event-based output.
 * Returns unpatch function.
 */
export function patchStdio(
  emitOutput: (isStderr: boolean, chunk: Uint8Array | string) => void
): () => void {
  const previousStdoutWrite = process.stdout.write;
  const previousStderrWrite = process.stderr.write;

  process.stdout.write = (chunk: Uint8Array | string): boolean => {
    emitOutput(false, chunk);
    return true;
  };

  process.stderr.write = (chunk: Uint8Array | string): boolean => {
    emitOutput(true, chunk);
    return true;
  };

  return () => {
    process.stdout.write = previousStdoutWrite;
    process.stderr.write = previousStderrWrite;
  };
}
```

---

## 10. Session Logging Pattern

### 10.1 When to Use

Use session logging when:

- Persisting conversation history
- Implementing crash recovery
- Creating audit trails

### 10.2 Structure

```typescript
/**
 * Session log entry structure.
 */
export interface SessionLogEntry {
  /** Entry timestamp */
  timestamp: string;
  /** Entry type */
  type: 'user_message' | 'assistant_message' | 'tool_call' | 'checkpoint';
  /** Entry content */
  content: unknown;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session logger for conversation persistence.
 */
export class SessionLogger {
  private readonly logFilePath: string;
  private entries: SessionLogEntry[] = [];

  constructor(sessionDir: string) {
    this.logFilePath = path.join(sessionDir, 'logs.json');
  }

  /**
   * Append an entry to the session log.
   */
  async append(entry: Omit<SessionLogEntry, 'timestamp'>): Promise<void> {
    const fullEntry: SessionLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(fullEntry);
    await this.flush();
  }

  /**
   * Write entries to disk.
   */
  private async flush(): Promise<void> {
    await fs.writeFile(this.logFilePath, JSON.stringify(this.entries, null, 2), 'utf-8');
  }

  /**
   * Load entries from disk (for recovery).
   */
  async load(): Promise<SessionLogEntry[]> {
    try {
      const content = await fs.readFile(this.logFilePath, 'utf-8');
      this.entries = JSON.parse(content);
      return this.entries;
    } catch {
      return [];
    }
  }
}
```

---

## 11. Role Definitions

### 11.1 Logging Component Roles

| Role               | Responsibility            | State         | Dependencies      |
| ------------------ | ------------------------- | ------------- | ----------------- |
| `DebugLogger`      | Developer debug output    | Stateless     | ConsolePatcher    |
| `CoreEvents`       | User feedback events      | Event backlog | EventEmitter      |
| `TelemetryService` | Production metrics/traces | SDK state     | OpenTelemetry SDK |
| `SessionLogger`    | Conversation persistence  | Log entries   | File system       |
| `ConsolePatcher`   | Console interception      | Original refs | None              |

### 11.2 Role Selection Flowchart

```
What are you logging?
│
├─ Developer debug information?
│   └─ Use DebugLogger
│
├─ User-facing message or notification?
│   └─ Use CoreEvents.emitFeedback()
│
├─ Production metrics or traces?
│   └─ Use TelemetryService
│
├─ Conversation history?
│   └─ Use SessionLogger
│
└─ Raw output for TUI?
    └─ Use writeToStdout/writeToStderr
```

---

## 12. Anti-Patterns

### 12.1 Forbidden Patterns

| Anti-Pattern                | Problem                       | Correct Pattern                 |
| --------------------------- | ----------------------------- | ------------------------------- |
| Direct `console.*` calls    | Bypasses patching, breaks TUI | Use `debugLogger.*`             |
| Logging sensitive data      | Security risk                 | Sanitize before logging         |
| User messages in debug logs | Users won't see them          | Use `coreEvents.emitFeedback()` |
| Technical errors for users  | Confusing messages            | Translate to user-friendly text |
| Synchronous file logging    | Blocks event loop             | Use async file operations       |
| Unbounded log buffers       | Memory leaks                  | Set max backlog size            |

### 12.2 Forbidden Dependencies

| From          | To                   | Why Forbidden                    |
| ------------- | -------------------- | -------------------------------- |
| DebugLogger   | CoreEvents           | Debug logs are not user feedback |
| CoreEvents    | TelemetryService     | User feedback is not telemetry   |
| Any component | `console.*` directly | Breaks TUI compatibility         |

### 12.3 Code Smell Examples

```typescript
// ANTI-PATTERN: Direct console usage
console.log('Debug info'); // Wrong - bypasses patching

// CORRECT: Use debug logger
debugLogger.log('Debug info');
```

```typescript
// ANTI-PATTERN: Technical error for users
coreEvents.emitFeedback('error', `ECONNREFUSED ${host}:${port}`);

// CORRECT: User-friendly message
coreEvents.emitFeedback(
  'error',
  'Unable to connect to the server. Please check your network.',
  error // Include original for debugging
);
```

```typescript
// ANTI-PATTERN: Logging sensitive data
debugLogger.debug('Auth token:', token);

// CORRECT: Mask sensitive data
debugLogger.debug('Auth token:', maskToken(token));
```

```typescript
// ANTI-PATTERN: No correlation ID
telemetry.record(new ToolCallEvent({ functionName: 'bash' }));

// CORRECT: Include prompt/session ID
telemetry.record(
  new ToolCallEvent({
    functionName: 'bash',
    promptId: context.promptId,
    sessionId: config.getSessionId(),
  })
);
```

---

## 13. Decision Trees

### 13.1 Choosing Log Level

```
What is the severity?
│
├─ Application cannot continue?
│   └─ Use error + throw/exit
│
├─ Unexpected but recoverable?
│   └─ Use warn
│
├─ Significant event in normal operation?
│   └─ Use info
│
├─ General debug information?
│   └─ Use log
│
└─ Detailed trace for troubleshooting?
    └─ Use debug (only visible with debugMode)
```

### 13.2 Choosing Logging System

```
What is the purpose?
│
├─ Help developers debug?
│   │
│   ├─ Runtime debugging → debugLogger
│   └─ Post-mortem analysis → Telemetry with file export
│
├─ Inform users?
│   │
│   ├─ Success/progress → coreEvents.emitFeedback('info', ...)
│   ├─ Warning → coreEvents.emitFeedback('warning', ...)
│   └─ Error → coreEvents.emitFeedback('error', ...)
│
├─ Monitor production?
│   │
│   ├─ Count occurrences → Metrics counter
│   ├─ Measure duration → Metrics histogram
│   └─ Trace flow → Span tracing
│
└─ Persist for recovery?
    └─ SessionLogger
```

---

## 14. Enforcement

### 14.1 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Forbid direct console usage
    'no-console': [
      'error',
      {
        allow: [], // Force use of debugLogger
      },
    ],
  },
  overrides: [
    {
      // Allow console in logger implementation files
      files: ['**/debugLogger.ts', '**/ConsolePatcher.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
```

### 14.2 Architecture Review Checklist

- [ ] No direct `console.*` calls outside logger files
- [ ] All user-facing messages use `coreEvents.emitFeedback()`
- [ ] Debug logs use `debugLogger.*` not `console.*`
- [ ] Telemetry events include correlation IDs
- [ ] Sensitive data is masked before logging
- [ ] Log messages are human-readable
- [ ] Error messages include recovery guidance

### 14.3 Telemetry Validation

```typescript
// Validate telemetry event has required fields
function validateTelemetryEvent(event: BaseTelemetryEvent): void {
  if (!event['event.name']) {
    throw new Error('Telemetry event missing event.name');
  }
  if (!event['event.timestamp']) {
    throw new Error('Telemetry event missing event.timestamp');
  }
}
```

---

## 15. Exceptions

### 15.1 Valid Exception Scenarios

| Scenario                   | Justification                       | Documentation Required   |
| -------------------------- | ----------------------------------- | ------------------------ |
| Third-party library logs   | Cannot control external code        | Document in code review  |
| Performance-critical paths | Async logging overhead unacceptable | Benchmark evidence       |
| Startup/shutdown logging   | CoreEvents not yet initialized      | Use stderr directly      |
| Test fixtures              | Need direct console for test output | Limit to test files only |

### 15.2 Exception Documentation Format

```typescript
/**
 * LOGGING EXCEPTION: STD-013 Section 4
 * Reason: Third-party library uses console.log directly.
 * Mitigation: Output captured by ConsolePatcher when active.
 */
import { externalLibrary } from 'external-package';
```

### 15.3 Exception Process

1. **Identify**: Determine which logging rule cannot be followed
2. **Justify**: Document why the exception is necessary
3. **Mitigate**: Implement alternative controls where possible
4. **Document**: Add exception comment in code
5. **Review**: Exception must be approved in code review

---

## 16. Configuration

### 16.1 Debug Mode

| Setting     | Type    | Default | Description               |
| ----------- | ------- | ------- | ------------------------- |
| `debugMode` | boolean | `false` | Enable debug-level output |

### 16.2 Telemetry Settings

| Setting                  | Type    | Default  | Description                             |
| ------------------------ | ------- | -------- | --------------------------------------- |
| `telemetry.enabled`      | boolean | `true`   | Enable telemetry collection             |
| `telemetry.target`       | string  | `'otlp'` | Export target: otlp, gcp, file, console |
| `telemetry.otlpEndpoint` | string  | -        | OTLP collector endpoint                 |
| `telemetry.otlpProtocol` | string  | `'grpc'` | Protocol: grpc or http                  |
| `telemetry.logPrompts`   | boolean | `false`  | Include prompt content in telemetry     |
| `telemetry.outfile`      | string  | -        | File path for file export               |

### 16.3 Environment Variables

| Variable                      | Purpose                                |
| ----------------------------- | -------------------------------------- |
| `DEV_TRACING`                 | Set to `'true'` to enable span tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint       |
| `OTEL_SERVICE_NAME`           | Service name for telemetry             |

---

## 17. Quick Reference

### 17.1 Logger Selection Matrix

| Need            | System        | Method                                    |
| --------------- | ------------- | ----------------------------------------- |
| Debug output    | DebugLogger   | `debugLogger.debug()`                     |
| User info       | CoreEvents    | `coreEvents.emitFeedback('info', ...)`    |
| User warning    | CoreEvents    | `coreEvents.emitFeedback('warning', ...)` |
| User error      | CoreEvents    | `coreEvents.emitFeedback('error', ...)`   |
| Metric count    | Telemetry     | `counter.add(1, attributes)`              |
| Metric duration | Telemetry     | `histogram.record(ms, attributes)`        |
| Trace span      | Telemetry     | `runInTraceSpan(opts, fn)`                |
| Persist history | SessionLogger | `logger.append(entry)`                    |

### 17.2 Log Level Summary

| Level | DebugLogger | Visibility     | Use Case             |
| ----- | ----------- | -------------- | -------------------- |
| error | `.error()`  | Always         | Failures, exceptions |
| warn  | `.warn()`   | Always         | Recoverable issues   |
| info  | `.info()`   | Always         | Significant events   |
| log   | `.log()`    | Always         | General debug        |
| debug | `.debug()`  | debugMode only | Detailed traces      |

### 17.3 Message Format

```
[Component] Action description: contextual details

Examples:
[ConfigLoader] Loading configuration from: /path/to/config.json
[ToolExecutor] Tool call failed: permission denied for /etc/passwd
[AgentManager] Agent started: agent-123, workflow: plan-implement
```

---

## 18. Traceability

### 18.1 Pattern Index

| Pattern ID | Name             | Section | When to Use              |
| ---------- | ---------------- | ------- | ------------------------ |
| LOG-001    | Debug Logger     | 4       | Developer debugging      |
| LOG-002    | User Feedback    | 5       | User notifications       |
| LOG-003    | Telemetry Events | 6       | Production monitoring    |
| LOG-004    | Tracing          | 7       | Request flow tracking    |
| LOG-005    | Console Patching | 8       | TUI applications         |
| LOG-006    | Stream Handling  | 9       | stdout/stderr separation |
| LOG-007    | Session Logging  | 10      | Conversation persistence |

### 18.2 Related Standards

| Standard               | Relationship            |
| ---------------------- | ----------------------- |
| STD-006 Error Handling | Error logging patterns  |
| STD-011 Configuration  | Telemetry settings      |
| STD-005 Architecture   | Logging layer placement |

---

## 19. Open Questions

| Question ID | Question | Owner | Status |
| ----------- | -------- | ----- | ------ |
| -           | -        | -     | -      |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
