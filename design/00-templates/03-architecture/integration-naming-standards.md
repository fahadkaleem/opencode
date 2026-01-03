# Integration Naming Standards

> **Version**: 1.0
> **Last Updated**: 2025-11-28
> **Scope**: Stage 3c Integration Architecture

This document defines naming conventions for interface contracts, operations, events, and shared types used in Stage 3c (Integration Architecture).

---

## 1. General Principles

### 1.1 Modern TypeScript Conventions

- **NO "I" prefix for interfaces** - Use `ContentGenerator` not `IContentGenerator`
- **NO "Interface" suffix** - Use `ProviderRegistry` not `ProviderRegistryInterface`
- **Descriptive compound nouns** - Names should describe WHAT it is and WHAT it does

### 1.2 Naming Formula

```
[Domain/Thing] + [Role/Type]
```

**Examples:**

- `ContentGenerator` = Content + Generator
- `UsageTracker` = Usage + Tracker
- `TelemetryExporter` = Telemetry + Exporter
- `HookRegistry` = Hook + Registry

---

## 2. Interface Naming by Role

### 2.1 Role Suffixes

Use these suffixes based on what the interface does:

| Suffix        | When to Use                                                      | Examples                                              |
| ------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| `*Service`    | Stateful service with lifecycle, coordinates multiple operations | `TelemetryService`, `ConfigService`                   |
| `*Manager`    | Manages lifecycle of resources (create, track, destroy)          | `SessionManager`, `ProviderManager`                   |
| `*Registry`   | Stores and retrieves registered items                            | `HookRegistry`, `ProviderRegistry`                    |
| `*Tracker`    | Tracks state or usage over time                                  | `UsageTracker`, `HighWaterMarkTracker`                |
| `*Recorder`   | Records/captures data for later use                              | `SpanRecorder`, `LogRecorder`, `MetricRecorder`       |
| `*Exporter`   | Exports data to external destinations                            | `TelemetryExporter`, `FileExporter`                   |
| `*Factory`    | Creates instances of something                                   | `HookFactory`, `ProviderFactory`                      |
| `*Detector`   | Detects conditions or patterns                                   | `ActivityDetector`, `LoopDetector`                    |
| `*Limiter`    | Limits or throttles operations                                   | `RateLimiter`, `TokenLimiter`                         |
| `*Filter`     | Filters or sanitizes data                                        | `DataSanitizer`, `PrivacyFilter`                      |
| `*Builder`    | Builds complex objects step by step                              | `ContextBuilder`, `PromptBuilder`                     |
| `*Resolver`   | Resolves references or lookups                                   | `CommandResolver`, `PathResolver`                     |
| `*Loader`     | Loads resources from storage                                     | `ConfigLoader`, `WorkflowLoader`                      |
| `*Validator`  | Validates data or state                                          | `SchemaValidator`, `OutputValidator`                  |
| `*Handler`    | Handles events or requests                                       | `ErrorHandler`, `EventHandler`                        |
| `*Executor`   | Executes commands or tasks                                       | `CommandExecutor`, `PhaseExecutor`                    |
| `*Scheduler`  | Schedules operations                                             | `TaskScheduler`, `RetryScheduler`                     |
| `*Router`     | Routes requests to destinations                                  | `ClarificationRouter`, `MessageRouter`                |
| `*Aggregator` | Aggregates multiple items                                        | `ResultAggregator`, `MetricAggregator`                |
| `*Sdk`        | SDK initialization and lifecycle                                 | `TelemetrySdk`, `ProviderSdk`                         |
| `*Storage`    | Persists and retrieves data (CRUD operations)                    | `TaskStateStorage`, `TokenStorage`, `ArtifactStorage` |

### 2.2 Choosing the Right Suffix

Ask these questions:

1. **Does it create things?** → `*Factory`
2. **Does it store/retrieve registered items?** → `*Registry`
3. **Does it persist/retrieve data (CRUD)?** → `*Storage`
4. **Does it track state over time?** → `*Tracker`
5. **Does it record data for later?** → `*Recorder`
6. **Does it send data externally?** → `*Exporter`
7. **Does it manage resource lifecycle?** → `*Manager`
8. **Does it coordinate operations?** → `*Service`
9. **Does it detect conditions?** → `*Detector`
10. **Does it filter/sanitize?** → `*Filter` or `*Sanitizer`

---

## 3. Data Type Naming

### 3.1 Data Interfaces

For data-only interfaces (no methods), use descriptive nouns:

| Pattern       | When to Use                 | Examples                                  |
| ------------- | --------------------------- | ----------------------------------------- |
| `*Config`     | Configuration objects       | `TelemetryConfig`, `ProviderConfig`       |
| `*Options`    | Optional parameters         | `ExecutionOptions`, `RetryOptions`        |
| `*Settings`   | User-configurable settings  | `PrivacySettings`, `DisplaySettings`      |
| `*Metadata`   | Metadata about something    | `SpanMetadata`, `TaskMetadata`            |
| `*Info`       | Information summary         | `ProviderInfo`, `SessionInfo`             |
| `*Result`     | Operation results           | `ExecutionResult`, `ValidationResult`     |
| `*Stats`      | Statistics/metrics data     | `ToolCallStats`, `TokenStats`             |
| `*Metrics`    | Metrics data                | `SessionMetrics`, `ModelMetrics`          |
| `*Context`    | Contextual information      | `ExecutionContext`, `TraceContext`        |
| `*State`      | State snapshots             | `TaskState`, `WorkflowState`              |
| `*Details`    | Detailed information        | `ErrorDetails`, `UsageDetails`            |
| `*Definition` | Definitions/schemas         | `WorkflowDefinition`, `CommandDefinition` |
| `*Entry`      | Single item in a collection | `RegistryEntry`, `LogEntry`               |
| `*Record`     | Recorded data               | `MessageRecord`, `AuditRecord`            |

### 3.2 Event Types

Events should be named as past-tense or noun phrases:

| Pattern  | Examples                                                 |
| -------- | -------------------------------------------------------- |
| `*Event` | `StartSessionEvent`, `ToolCallEvent`, `ApiResponseEvent` |

---

## 4. Operation Naming

### 4.1 Method Names

Use verb + noun format:

| Action     | Verb                                      | Examples                                                  |
| ---------- | ----------------------------------------- | --------------------------------------------------------- |
| Create new | `create`, `spawn`, `register`             | `createSession`, `spawnAgent`, `registerProvider`         |
| Read/Get   | `get`, `list`, `find`, `check`            | `getProvider`, `listSessions`, `findCommand`, `checkAuth` |
| Update     | `update`, `set`, `enable`, `disable`      | `updateConfig`, `setDefault`, `enableAdapter`             |
| Delete     | `delete`, `remove`, `clear`, `unregister` | `deleteSession`, `clearAuth`, `unregisterProvider`        |
| Execute    | `execute`, `run`, `start`, `stop`         | `executeCommand`, `runWorkflow`, `startTrace`             |
| Record     | `record`, `log`, `capture`                | `recordMetric`, `logEvent`, `captureArtifact`             |
| Query      | `is*`, `has*`, `can*`                     | `isEnabled`, `hasSession`, `canRetry`                     |
| Transform  | `map`, `filter`, `parse`, `format`        | `mapTools`, `filterSensitive`, `parseOutput`              |

### 4.2 Boolean Queries

Use `is*`, `has*`, `can*` prefixes:

- `isEnabled()`, `isAuthenticated()`, `isDebugMode()`
- `hasSession()`, `hasCredentials()`
- `canRetry()`, `canExecute()`

---

## 5. Event Naming

### 5.1 Event Type Strings

Use lowercase with colons as separators:

```
{component}:{category}:{action}
```

**Examples:**

- `llm:execution:start`
- `llm:execution:complete`
- `workflow:phase:error`
- `telemetry:export:failure`

### 5.2 Event ID Prefixes

| Component             | Prefix   | Example     |
| --------------------- | -------- | ----------- |
| Message Manager       | `MM-EV-` | `MM-EV-001` |
| Configuration Manager | `CF-EV-` | `CF-EV-001` |
| State Manager         | `SM-EV-` | `SM-EV-001` |
| Telemetry             | `TL-EV-` | `TL-EV-001` |
| LLM Manager           | `LM-EV-` | `LM-EV-001` |
| Agent Manager         | `AM-EV-` | `AM-EV-001` |
| Orchestrator          | `OR-EV-` | `OR-EV-001` |

---

## 6. Error Code Naming

### 6.1 Format

```
ERR_{COMPONENT}_{CATEGORY}_{NUMBER}
```

**Examples:**

- `ERR_LM_AUTH_001` - LLM Manager auth error
- `ERR_TL_EXPORT_002` - Telemetry export error
- `ERR_OR_PHASE_003` - Orchestrator phase error

### 6.2 Categories

| Category   | Meaning                |
| ---------- | ---------------------- |
| `INIT`     | Initialization errors  |
| `AUTH`     | Authentication errors  |
| `EXEC`     | Execution errors       |
| `TIMEOUT`  | Timeout errors         |
| `NOTFOUND` | Resource not found     |
| `INVALID`  | Invalid input/state    |
| `EXPORT`   | Export/external errors |

---

## 7. Contract Document Naming

### 7.1 File Names

```
{NN}-{component-name}.md
```

Where `NN` is the component order number (01-12).

**Examples:**

- `01-message-manager.md`
- `05-llm-manager.md`
- `10-orchestrator.md`

### 7.2 Contract ID Convention

Each component uses a two-letter prefix:

| Component             | Prefix |
| --------------------- | ------ |
| Message Manager       | `MM`   |
| Configuration Manager | `CF`   |
| State Manager         | `SM`   |
| Telemetry             | `TL`   |
| LLM Manager           | `LM`   |
| Context Manager       | `CM`   |
| Task Manager          | `TM`   |
| Validation Manager    | `VL`   |
| Agent Manager         | `AM`   |
| Orchestrator          | `OR`   |
| User Interface        | `UI`   |
| Gateway               | `GW`   |

---

## 8. Common Anti-Patterns

### 8.1 Avoid These

| Anti-Pattern         | Problem                       | Better                                           |
| -------------------- | ----------------------------- | ------------------------------------------------ |
| `IProviderRegistry`  | Hungarian notation (outdated) | `ProviderRegistry`                               |
| `TracingInterface`   | Redundant "Interface" suffix  | `SpanRecorder`                                   |
| `Logging`            | Too vague, gerund             | `LogRecorder`                                    |
| `Utils`              | Non-descriptive               | `StringFormatter`, `PathResolver`                |
| `Helper`             | Non-descriptive               | Use specific role suffix                         |
| `Data`               | Too generic                   | Use `*Info`, `*Details`, `*Record`               |
| `Manager` (overused) | Everything becomes a manager  | Use specific role: `*Registry`, `*Tracker`, etc. |

### 8.2 Examples of Fixes

| Bad                | Good                              | Why                         |
| ------------------ | --------------------------------- | --------------------------- |
| `IAuthService`     | `AuthService`                     | No "I" prefix               |
| `LoggingInterface` | `LogRecorder`                     | Descriptive, no "Interface" |
| `TraceUtils`       | `SpanRecorder`                    | Specific role               |
| `DataManager`      | `StateManager` or `RecordTracker` | More specific               |
| `Metrics`          | `MetricRecorder`                  | Noun + Role                 |

---

## 9. Additional Patterns

### 9.1 Boolean Query Methods

Use these prefixes for methods that return boolean:

| Prefix      | When to Use                  | Examples                                              |
| ----------- | ---------------------------- | ----------------------------------------------------- |
| `is*()`     | Check state or condition     | `isEnabled()`, `isAuthenticated()`, `isInitialized()` |
| `has*()`    | Check for existence/presence | `hasSession()`, `hasCycle()`, `hasCredentials()`      |
| `can*()`    | Check capability             | `canRetry()`, `canExecute()`, `canUseFeature()`       |
| `should*()` | Conditional logic decisions  | `shouldRetry()`, `shouldRecord()`, `shouldIgnore()`   |

### 9.2 Collection Methods

Use plural forms when returning arrays:

| Pattern      | Examples                                    |
| ------------ | ------------------------------------------- |
| `getAll*()`  | `getAllTools()`, `getAllProviders()`        |
| `get*s()`    | `getDeclarations()`, `getSessions()`        |
| `get*sBy*()` | `getToolsByServer()`, `getSessionsByTask()` |
| `list*()`    | `listProviders()`, `listSessions()`         |

### 9.3 Discovery Methods

For finding/discovering resources:

| Pattern       | Examples                                 |
| ------------- | ---------------------------------------- |
| `discover*()` | `discoverProviders()`, `discoverTools()` |
| `find*()`     | `findCommand()`, `findSplitPoint()`      |
| `search*()`   | `searchTasks()`, `searchLogs()`          |
| `resolve*()`  | `resolveCommand()`, `resolvePath()`      |

### 9.4 Lifecycle Methods

| Pattern         | Examples                                        |
| --------------- | ----------------------------------------------- |
| `initialize*()` | `initializeTelemetry()`, `initializeProvider()` |
| `shutdown*()`   | `shutdownTelemetry()`, `shutdownProvider()`     |
| `start*()`      | `startTrace()`, `startSession()`                |
| `end*()`        | `endTrace()`, `endSession()`                    |
| `configure*()`  | `configureProvider()`, `configureExporter()`    |

### 9.5 Registration Methods

| Pattern          | Examples                                  |
| ---------------- | ----------------------------------------- |
| `register*()`    | `registerProvider()`, `registerAdapter()` |
| `unregister*()`  | `unregisterProvider()`                    |
| `subscribe*()`   | `subscribe()`, `subscribeToEvents()`      |
| `unsubscribe*()` | `unsubscribe()`                           |

### 9.6 Validation Methods

| Pattern       | Examples                                   |
| ------------- | ------------------------------------------ |
| `validate*()` | `validateParams()`, `validateSchema()`     |
| `check*()`    | `checkAuth()`, `checkReadiness()`          |
| `verify*()`   | `verifyCredentials()`, `verifySignature()` |

---

## 10. Quick Reference

### 10.1 Interface Naming Checklist

- [ ] No "I" prefix
- [ ] No "Interface" suffix
- [ ] Uses compound noun: `[Thing] + [Role]`
- [ ] Role suffix matches the responsibility
- [ ] Descriptive and specific

### 10.2 Common Mappings

| Responsibility               | Interface Name      |
| ---------------------------- | ------------------- |
| Initialize/shutdown SDK      | `*Sdk`              |
| Record traces/spans          | `SpanRecorder`      |
| Record logs                  | `LogRecorder`       |
| Record metrics               | `MetricRecorder`    |
| Track usage                  | `UsageTracker`      |
| Export telemetry             | `TelemetryExporter` |
| Sanitize data                | `DataSanitizer`     |
| Record artifacts             | `ArtifactRecorder`  |
| Create hooks                 | `HookFactory`       |
| Register items               | `*Registry`         |
| Persist/retrieve data (CRUD) | `*Storage`          |
| Manage lifecycle             | `*Manager`          |
| Execute operations           | `*Executor`         |
| Build objects                | `*Builder`          |
| Load resources               | `*Loader`           |
| Validate data                | `*Validator`        |

---

## Document History

| Version | Date       | Changes         |
| ------- | ---------- | --------------- |
| 1.0     | 2025-11-28 | Initial version |
