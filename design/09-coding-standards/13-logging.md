# Logging & Observability

Reference: `design/09-coding-standards/standards-reference/13-logging.md`

<logging_rules>

## Scope

**Applies to**: Debug logging during development, user feedback and notifications, structured telemetry events, OpenTelemetry tracing and metrics, stdout/stderr handling, console output management in TUI applications.

**Does NOT apply to**: Application-specific business event logging (use telemetry events), third-party library internal logging, build-time or compilation logs.

## Guiding Principles

These principles ensure logs remain useful across development, debugging, and production:

- **Separation of Concerns**: Debug logs, user feedback, and telemetry are distinct systems with different audiences and lifecycles.
- **Structured over Unstructured**: Production logs use structured formats (JSON, OpenTelemetry) because they enable querying, filtering, and automated analysis.
- **Context Propagation**: Logs include correlation IDs for request/operation tracing so you can follow a request across components.
- **Conditional Verbosity**: Debug output is controlled by configuration, not code changes, so you don't need to redeploy to troubleshoot.
- **User-Facing Clarity**: User feedback messages are human-readable, not technical, because users shouldn't see stack traces or error codes.

## Logging Systems

Use the correct logging system for each purpose. Each system has a specific audience and output channel:

| System          | Purpose                  | Output                      | When to Use                                        |
| --------------- | ------------------------ | --------------------------- | -------------------------------------------------- |
| `DebugLogger`   | Developer debugging      | stderr (when debug enabled) | Tracing execution flow, internal error details     |
| `CoreEvents`    | User feedback            | TUI/stdout                  | Operation status, warnings/errors users should see |
| `Telemetry`     | Production monitoring    | OTLP/File/Console           | Metrics, tracing, analytics                        |
| `SessionLogger` | Conversation persistence | JSON file                   | Chat history, checkpoints, crash recovery          |

### Data Flow

Understanding where logs go helps you choose the right system:

```
debugLogger.*        → stderr via ConsolePatcher    (Plain text; debugMode: true)
coreEvents.emitFeedback() → TUI component          (Structured event; Always)
telemetryService.record() → OTLP exporter          (OpenTelemetry; telemetry.enabled)
sessionLogger.append()    → JSON file              (Structured JSON; Always)
```

## Debug Logger Pattern

### When to Use

Use `debugLogger` for internal developer debugging, tracing execution flow, and error details not suitable for users. It outputs to stderr only when debug mode is enabled, keeping debug noise out of normal operation.

- ✓ `debugLogger.error('Connection failed', { host, port, error })`
- ✓ `debugLogger.debug('Cache miss', { key, ttl })`
- ✗ User communication (use `CoreEvents`)
- ✗ Production metrics (use `Telemetry`)
- ✗ Conversation persistence (use `SessionLogger`)

### Structure

```
src/utils/debugLogger.ts    # Logger implementation
src/core/ConsolePatcher.ts  # Console interception
src/index.ts                # Initialization
```

### Implementation

The `debugLogger` singleton provides methods that delegate to console equivalents:

- `log`, `warn`, `error`, `debug`, `info` → `console.log`, `console.warn`, `console.error`, `console.debug`, `console.info`

### Log Levels

| Method                | Visibility             | Use For                        |
| --------------------- | ---------------------- | ------------------------------ |
| `debugLogger.error()` | Always                 | Critical failures, exceptions  |
| `debugLogger.warn()`  | Always                 | Non-critical issues, fallbacks |
| `debugLogger.info()`  | Always                 | Significant events             |
| `debugLogger.log()`   | Always                 | General debug information      |
| `debugLogger.debug()` | `debugMode: true` only | Detailed trace information     |

### Usage Rules

- **Include context for errors**: Pass structured data objects so logs are searchable.
  - ✓ `debugLogger.error('Tool execution failed', { toolName, error, inputSize })`
  - ✗ `debugLogger.error('Tool failed')`

- **Make warnings actionable**: Describe what happened and what to do about it.

- **Never log sensitive data**: Sanitize or mask credentials, tokens, and PII before logging.
  - ✓ `debugLogger.info('Auth attempt', { userId, tokenPrefix: token.slice(0, 8) })`
  - ✗ `debugLogger.info('Auth attempt', { userId, token })`

- **Use conditional level switching** to adjust verbosity based on debug mode:
  ```typescript
  config.getDebugMode() ? debugLogger.warn(error) : debugLogger.debug(error);
  ```

## User Feedback Pattern

### When to Use

Use `CoreEvents` for operation status to users, warnings/errors users should see, and progress updates. This keeps user messaging separate from debug output.

- ✓ `coreEvents.emitFeedback('info', 'Configuration loaded')`
- ✓ `coreEvents.emitFeedback('error', 'Failed to connect to server')`
- ✗ Internal debug info (use `debugLogger`)
- ✗ Telemetry data (use `Telemetry`)

### Structure

```
src/core/events.ts          # Event type definitions
src/core/CoreEvents.ts      # Event emitter implementation
src/ui/FeedbackDisplay.tsx  # UI component for rendering
```

### Event Types

```typescript
type FeedbackSeverity = 'info' | 'warning' | 'error';
type UserFeedbackPayload = { severity: FeedbackSeverity; message: string; error?: unknown };

// Core events
CoreEvent.UserFeedback = 'user-feedback';
CoreEvent.Output = 'output';
CoreEvent.ConsoleLog = 'console-log';
```

### Delivery Guarantees

CoreEvents provides reliable delivery:

- If listeners exist (`listenerCount(event) > 0`): emit immediately
- Otherwise: queue into `eventBacklog` up to `MAX_BACKLOG_SIZE = 10000`

### Severity Guide

Choose severity based on what the user needs to know:

| Severity  | When to Use                            | Color         | Example                       |
| --------- | -------------------------------------- | ------------- | ----------------------------- |
| `info`    | Success, progress, neutral updates     | Blue/default  | "Configuration loaded"        |
| `warning` | Recoverable issues, deprecations       | Yellow/orange | "API key expires in 7 days"   |
| `error`   | Operation failures, user action needed | Red           | "Failed to connect to server" |

### Message Quality

User-facing errors must be user-friendly. Translate technical errors to actionable messages:

- ✓ `coreEvents.emitFeedback('error', 'Failed to connect to server. Check your network connection.')`
- ✗ `coreEvents.emitFeedback('error', 'ECONNREFUSED 127.0.0.1:3000')`

Include the original error as context when useful for support:

```typescript
coreEvents.emitFeedback('error', 'Unable to save file', { error: originalError });
```

## Telemetry Pattern

### When to Use

Use `TelemetryService` for production monitoring metrics, tracing request flow, and usage analytics. Telemetry answers questions like "How long do tool calls take?" and "What's the error rate?"

- ✓ Recording API latency histograms
- ✓ Counting tool call successes/failures
- ✓ Tracing request flow across components
- ✗ Debug logging (use `DebugLogger`)
- ✗ User messaging (use `CoreEvents`)

### Structure

```
src/telemetry/
├── sdk.ts               # OpenTelemetry SDK setup
├── types.ts             # Event type definitions
├── metrics.ts           # Metrics recording
├── trace.ts             # Tracing helpers
└── telemetryAttributes.ts
src/config/telemetrySettings.ts
```

### Base Event Contract

All telemetry events include these fields for correlation and ordering:

```typescript
interface BaseTelemetryEvent {
  'event.name': string;
  'event.timestamp': string; // ISO 8601
}
```

### Tool Call Event Shape

```typescript
interface ToolCallEvent extends BaseTelemetryEvent {
  functionName: string;
  functionArgs: unknown; // Sanitized - no secrets
  durationMs: number;
  success: boolean;
  decision?: 'approved' | 'denied' | 'auto_approved';
  error?: string;
  errorType?: string;
  promptId: string;
  toolType: 'native' | 'mcp';
  contentLength?: number;
}
```

The constructor sets `'event.timestamp' = new Date().toISOString()`. The `toLogBody()` method emits a human-readable summary including optional decision, success, and duration.

### Common Attributes

Include these attributes for correlation across events:

```typescript
{
  'session.id': config.getSessionId(),
  'installation.id': installationManager.getInstallationId(),
  interactive: config.isInteractive(),
  'user.email'?: string  // Optional
}
```

### Metrics Names

Use consistent metric names across the application:

| Constant                      | Value                     | Purpose                 |
| ----------------------------- | ------------------------- | ----------------------- |
| `METRICS.TOOL_CALL_COUNT`     | `app.tool.call.count`     | Tool invocation counter |
| `METRICS.TOOL_CALL_LATENCY`   | `app.tool.call.latency`   | Tool execution duration |
| `METRICS.API_REQUEST_COUNT`   | `app.api.request.count`   | API call counter        |
| `METRICS.API_REQUEST_LATENCY` | `app.api.request.latency` | API call duration       |
| `METRICS.TOKEN_USAGE`         | `app.token.usage`         | Token consumption       |
| `METRICS.SESSION_COUNT`       | `app.session.count`       | Session counter         |
| `METRICS.AGENT_RUN_COUNT`     | `app.agent.run.count`     | Agent execution counter |
| `METRICS.MEMORY_USAGE`        | `app.memory.usage`        | Memory consumption      |

### Recording Metrics

Tool call metrics recording pattern:

```typescript
// No-op if metrics not initialized
if (!isMetricsInitialized) return;

toolCallCounter.add(1, {
  ...getCommonAttributes(config),
  functionName,
  success,
  toolType,
});

toolCallLatencyHistogram.record(durationMs, {
  ...getCommonAttributes(config),
  function_name: functionName,
});
```

### Telemetry Settings

```typescript
interface TelemetrySettings {
  enabled?: boolean; // Default: true
  target?: 'otlp' | 'gcp' | 'file' | 'console'; // Default: 'otlp'
  otlpEndpoint?: string;
  otlpProtocol?: 'grpc' | 'http'; // Default: 'grpc'
  logPrompts?: boolean; // Default: false
  outfile?: string;
}
```

## Tracing Pattern

### When to Use

Use tracing to track request flow across async boundaries, measure operation duration, and correlate logs across components. Traces show the full picture of a request's journey.

### Span Management

Use `runInTraceSpan` to create spans consistently:

```typescript
await runInTraceSpan(
  { name: 'executeToolCall', attributes: { toolName } },
  async (metadata, endSpan) => {
    metadata.input = { model, promptId };
    const result = await executeCall();
    metadata.output = { usageMetadata };
    return result;
  }
);
```

**Important**: Spans are only created when `process.env.DEV_TRACING === 'true'`. The function still calls `fn` with metadata and a no-op `endSpan` when tracing is disabled, so your code works the same either way.

### Tracing Behavior

When tracing is enabled:

- Uses `trace.getTracer('app-cli', 'v1')` and `startActiveSpan(opts.name, ...)`
- Populates `metadata.name` and `metadata.attributes`
- If `metadata.output` exists, sets span attribute `output` to `JSON.stringify(metadata.output)`
- On success: sets status `SpanStatusCode.OK`
- On error: sets status `SpanStatusCode.ERROR` with message, calls `recordException`, rethrows
- Always calls `span.end()`

## Console Patching Pattern

### When to Use

Use `ConsolePatcher` for TUI applications (Ink/blessed), intercepting third-party console output, and separating debug output from UI rendering. This prevents console.log from corrupting your terminal UI.

### Configuration

```typescript
interface ConsolePatcherParams {
  stderr: boolean;
  debugMode: boolean;
  onNewMessage?: (message: ConsoleLogPayload) => void;
}
```

### Behavior

- Patches `console.{log, warn, error, debug, info}`
- Suppresses `debug` output unless `debugMode` is true
- Routes output to stderr via `originalConsoleError(formatArgs(args))` when `stderr: true`
- Otherwise emits `{ type, content }` via `onNewMessage`
- `formatArgs(args)` stringifies objects as `JSON.stringify(arg, null, 2)`, non-objects via `String(arg)`, joins with `' '`
- Provides `unpatch()` to restore original console method references

## stdout/stderr Handling

### Stream Separation

Use the correct stream so piping and redirection work correctly:

| Content                     | Stream | Why                        |
| --------------------------- | ------ | -------------------------- |
| Command output (JSON, data) | stdout | Enables piping and parsing |
| User messages, progress     | stdout | User visibility            |
| Debug logs                  | stderr | Separates from data output |
| Errors                      | stderr | Standard convention        |

### Bypass Helpers

Keep references to original streams for when you need to bypass patching:

```typescript
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

function writeToStdout(chunk: string, encoding?: BufferEncoding): void;
function writeToStderr(chunk: string, encoding?: BufferEncoding): void;
```

### Stream Patching

```typescript
function patchStdio(emitOutput: (isStderr: boolean, chunk: string) => void): () => void {
  // Replaces process.stdout.write to call emitOutput(false, chunk)
  // Replaces process.stderr.write to call emitOutput(true, chunk)
  // Returns unpatch function restoring prior writes
}
```

## Session Logging Pattern

### When to Use

Use `SessionLogger` to persist conversation history, enable crash recovery, and maintain audit trails. Sessions are JSON files that can be replayed or analyzed.

### Entry Schema

```typescript
interface SessionLogEntry {
  timestamp: string; // ISO 8601
  type: 'user_message' | 'assistant_message' | 'tool_call' | 'checkpoint';
  content: unknown;
  metadata?: Record<string, unknown>;
}
```

### Storage

Writes to `${sessionDir}/logs.json` as structured JSON with `JSON.stringify(entries, null, 2)` for human readability.

### Operations

```typescript
// append() adds ISO timestamp, pushes to memory, writes async
await sessionLogger.append({ type: 'user_message', content: message });

// load() reads and parses, returns [] on failure
const entries = await sessionLogger.load();
```

## Role Selection Guide

Choose the logging system based on audience:

| Scenario                  | Use This                        | Why                                     |
| ------------------------- | ------------------------------- | --------------------------------------- |
| Developer debug output    | `debugLogger.*`                 | Goes to stderr, controlled by debugMode |
| User-facing message       | `coreEvents.emitFeedback()`     | Renders in TUI, human-readable          |
| Production metrics/traces | `TelemetryService`              | Structured for analysis                 |
| Conversation history      | `SessionLogger`                 | Persistent, recoverable                 |
| Raw TUI output            | `writeToStdout`/`writeToStderr` | Bypasses patching                       |

## Choosing Log Level

| Situation                  | Level   | Action                    |
| -------------------------- | ------- | ------------------------- |
| Cannot continue            | `error` | Log + throw/exit          |
| Unexpected but recoverable | `warn`  | Log + continue            |
| Significant normal event   | `info`  | Log                       |
| General debug              | `log`   | Log (always visible)      |
| Detailed trace             | `debug` | Log (only with debugMode) |

## Message Format

Follow the pattern `[Component] Action description: contextual details` for consistent, parseable logs:

- ✓ `[ConfigLoader] Loading configuration from: /path/to/config.json`
- ✓ `[ToolExecutor] Tool call failed: permission denied for /etc/passwd`
- ✓ `[AgentManager] Agent started: agent-123, workflow: plan-implement`

</logging_rules>

## Preferences

- **Error handling alignment**: Include correlation IDs in telemetry events, mask sensitive data before logging, keep log messages human-readable, include recovery guidance in error messages.
- **Telemetry validation**: Validate telemetry events include required fields (`event.name`, `event.timestamp`) before export.

## Exceptions

When these rules cannot be followed, document the exception:

| Scenario                   | Reason                              | Mitigation                  |
| -------------------------- | ----------------------------------- | --------------------------- |
| Third-party library logs   | Cannot control external code        | Document in code review     |
| Performance-critical paths | Async logging overhead unacceptable | Benchmark evidence required |
| Startup/shutdown logging   | CoreEvents not yet initialized      | Use stderr directly         |
| Test fixtures              | Need direct console for test output | Limit to test files only    |

### Exception Documentation

Add a comment: `// LOGGING EXCEPTION: STD-013 Section <n> - <reason> - <mitigation>`

Example:

```typescript
// LOGGING EXCEPTION: STD-013 Section 4 - CoreEvents not initialized at startup - Using stderr directly, captured by ConsolePatcher
console.error('Fatal: Configuration file not found');
```

### Exception Process

1. **Identify**: Recognize the rule that cannot be followed
2. **Justify**: Document why the exception is necessary
3. **Mitigate**: Describe how you're minimizing the impact
4. **Document**: Add the exception comment
5. **Review**: Get approval in code review

## Configuration

### Debug Mode

| Setting     | Default | Purpose                   |
| ----------- | ------- | ------------------------- |
| `debugMode` | `false` | Enable debug-level output |

### Telemetry Settings

| Setting                  | Default  | Purpose                                 |
| ------------------------ | -------- | --------------------------------------- |
| `telemetry.enabled`      | `true`   | Enable telemetry collection             |
| `telemetry.target`       | `'otlp'` | Export target: otlp, gcp, file, console |
| `telemetry.otlpEndpoint` | -        | OTLP collector endpoint                 |
| `telemetry.otlpProtocol` | `'grpc'` | Protocol: grpc or http                  |
| `telemetry.logPrompts`   | `false`  | Include prompt content in telemetry     |
| `telemetry.outfile`      | -        | File path for file export               |

### Environment Variables

| Variable                      | Purpose                          |
| ----------------------------- | -------------------------------- |
| `DEV_TRACING='true'`          | Enable span tracing              |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint |
| `OTEL_SERVICE_NAME`           | Service name for telemetry       |

## Verification Checklist

When reviewing code for logging compliance:

### General

- [ ] No direct `console.*` calls outside `debugLogger.ts` and `ConsolePatcher.ts`
- [ ] User messages use `coreEvents.emitFeedback()`, not debug logger
- [ ] Debug output uses `debugLogger.*`, not console
- [ ] Log messages follow `[Component] Action: details` format
- [ ] Messages are human-readable (no raw error codes for users)
- [ ] Errors include recovery guidance where applicable

### Security

- [ ] No sensitive data logged (credentials, tokens, PII)
- [ ] Function arguments sanitized before telemetry
- [ ] User data masked or omitted from debug logs

### Telemetry

- [ ] Events include correlation IDs (`promptId`, `session.id`)
- [ ] Events include required fields (`event.name`, `event.timestamp`)
- [ ] Metrics use standard names from `METRICS.*` constants
- [ ] Common attributes included (`session.id`, `installation.id`, `interactive`)

### Architecture

- [ ] DebugLogger does not depend on CoreEvents
- [ ] CoreEvents does not depend on TelemetryService
- [ ] Correct logging system used for each purpose (see Role Selection Guide)
- [ ] Async file operations (no synchronous logging to files)
- [ ] Bounded buffers (backlog has max size)

### ESLint

Enforce with ESLint rules:

```json
{
  "no-console": ["error", { "allow": [] }],
  "overrides": [
    { "files": ["**/debugLogger.ts", "**/ConsolePatcher.ts"], "rules": { "no-console": "off" } }
  ]
}
```
