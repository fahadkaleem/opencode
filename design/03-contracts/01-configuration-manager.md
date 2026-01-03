# Configuration Manager - Interface Contract

> **Component ID**: COMP-001
> **Document Version**: 2.1
> **Last Updated**: 2025-12-25
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Architecture Overview](../01-overview/03-architecture-overview.md)
> - [Configuration Requirements](../02-requirements/02-config.md)
> - [opencode SDK Reference](../opencodesdk.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **Configuration Manager**, specifying what operations it provides to other components and what operations it requires from the AI execution SDK.

### 1.2 Component Summary

| Attribute                    | Value                                                   |
| ---------------------------- | ------------------------------------------------------- |
| **Component ID**             | COMP-001                                                |
| **Directory**                | `packages/core/src/config/`                             |
| **Main Class**               | `Config`                                                |
| **Responsibility**           | Workflow definitions, task source config, storage paths |
| **Provides Interfaces To**   | COMP-002 through COMP-007 (all components)              |
| **Requires Interfaces From** | AI Execution SDK (opencode)                             |

### 1.3 Contract ID Convention

Operations follow the format: **CF-OP-XXX**

### 1.4 Design Philosophy

The Configuration Manager follows four core principles:

1. **Single Source of Truth** - All configuration access goes through one Config class
2. **Unified Facade** - Components don't know where configuration comes from (local files, CLI flags, or AI SDK)
3. **Immutability** - Configuration is set at construction, read-only after initialization
4. **Separation of Concerns** - Config class holds settings; factory function loads them

### 1.5 Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENTRY POINTS                            │
│                                                                 │
│         CLI                    Desktop                Tests     │
│          │                        │                     │       │
│          └────────────────────────┴─────────────────────┘       │
│                                   │                             │
│                                   ▼                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     createConfig()                        │  │
│  │                   (Factory Function)                      │  │
│  │                                                           │  │
│  │   1. Load ~/.flomaster/settings.json (user level)         │  │
│  │   2. Load .flomaster/settings.json (project level)        │  │
│  │   3. Merge: CLI > project > user > defaults               │  │
│  │   4. Create Config instance                               │  │
│  │   5. Call config.initialize()                             │  │
│  │   6. Return ready-to-use Config                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                   │                             │
│                                   ▼                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         Config                            │  │
│  │                 (Pure Configuration Class)                │  │
│  │                                                           │  │
│  │   ┌─────────────────────┐     ┌─────────────────────┐     │  │
│  │   │  FloMaster-Owned    │     │   SDK Delegation    │     │  │
│  │   │                     │     │                     │     │  │
│  │   │  • Workflows        │     │  • Providers        │     │  │
│  │   │  • Task Sources     │     │  • Models           │     │  │
│  │   │  • Storage Paths    │     │  • Sessions         │     │  │
│  │   │  • Telemetry        │     │  • Authentication   │     │  │
│  │   └─────────────────────┘     └──────────┬──────────┘     │  │
│  │                                          │                │  │
│  └──────────────────────────────────────────┼────────────────┘  │
│                                             │                   │
│                                             ▼                   │
│                                  ┌────────────────────┐         │
│                                  │   AI Execution     │         │
│                                  │      SDK           │         │
│                                  └────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Provided Interfaces

### 2.1 Interface: Initialization

**Purpose**: Create and initialize configuration for use by all components.

**Consumers**: Application entry points (CLI, Desktop, Tests)

---

#### CF-OP-001: createConfig (Factory Function)

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | CF-OP-001                       |
| **Type**         | Asynchronous                    |
| **Implements**   | FR-CF-004, FR-CF-005, FR-CF-006 |

**Purpose**: Load settings from files, merge with overrides, create and initialize Config instance.

**Signature**:

```typescript
function createConfig(options: CreateConfigOptions): Promise<Config>;
```

**Request Schema**:

| Field        | Type                       | Required | Constraints         | Description                    |
| ------------ | -------------------------- | -------- | ------------------- | ------------------------------ |
| `targetDir`  | `string`                   | Yes      | Valid directory     | Project root directory         |
| `taskSource` | `TaskSourceConfig`         | No       | Valid config object | CLI override for task source   |
| `telemetry`  | `Partial<TelemetryConfig>` | No       | Valid config object | CLI override for telemetry     |
| `model`      | `string`                   | No       | Valid model ID      | CLI override for default model |

**Response Schema**:

| Field    | Type     | Description                       |
| -------- | -------- | --------------------------------- |
| (return) | `Config` | Fully initialized Config instance |

**Preconditions**:

- `targetDir` must be a valid directory path

**Postconditions**:

- Settings loaded from `~/.flomaster/settings.json` (if exists)
- Settings loaded from `.flomaster/settings.json` (if exists)
- Settings merged with priority: CLI > project > user > defaults
- Config instance created and `initialize()` called
- SDK client connected

**Error Conditions**:

| Error Code       | Condition                      | Caller Action           |
| ---------------- | ------------------------------ | ----------------------- |
| `INVALID_PARAMS` | targetDir is not a directory   | Provide valid directory |
| `INVALID_SCHEMA` | Settings file has invalid JSON | Fix settings file       |
| `SDK_ERROR`      | Failed to connect to SDK       | Check SDK availability  |

**Example**:

```typescript
const config = await createConfig({
  targetDir: process.cwd(),
  taskSource: { type: 'jira', jira: { baseUrl: '...', projectKey: 'FLOW' } },
});
```

---

### 2.2 Interface: FloMaster-Owned Configuration

**Purpose**: Provide access to configuration that FloMaster owns and manages directly.

**Consumers**: All components (COMP-002 through COMP-007)

---

#### CF-OP-002: getStorage

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | CF-OP-002   |
| **Type**         | Synchronous |
| **Implements**   | FR-CF-004   |

**Purpose**: Get the Storage instance for accessing standard file paths.

**Signature**:

```typescript
getStorage(): Storage
```

**Response Schema**:

| Field    | Type      | Description                        |
| -------- | --------- | ---------------------------------- |
| (return) | `Storage` | Storage instance with path methods |

**Postconditions**:

- Returns Storage instance bound to project's target directory

**Example**:

```typescript
const storage = config.getStorage();
const workflowsDir = storage.getWorkflowsDir(); // .flomaster/workflows/
```

---

#### CF-OP-003: getTargetDir

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | CF-OP-003   |
| **Type**         | Synchronous |
| **Implements**   | FR-CF-004   |

**Purpose**: Get the project root directory.

**Signature**:

```typescript
getTargetDir(): string
```

**Response Schema**:

| Field    | Type     | Description                   |
| -------- | -------- | ----------------------------- |
| (return) | `string` | Absolute path to project root |

**Postconditions**:

- Path is always absolute (resolved from relative if needed)

**Example**:

```typescript
const projectRoot = config.getTargetDir(); // /Users/dev/my-project
```

---

#### CF-OP-004: getTaskSourceConfig

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | CF-OP-004   |
| **Type**         | Synchronous |
| **Implements**   | FR-CF-004   |

**Purpose**: Get the task source configuration (local, Jira, or Linear).

**Signature**:

```typescript
getTaskSourceConfig(): TaskSourceConfig
```

**Response Schema**:

| Field    | Type               | Description          |
| -------- | ------------------ | -------------------- |
| (return) | `TaskSourceConfig` | Task source settings |

**Example**:

```typescript
const taskConfig = config.getTaskSourceConfig();
if (taskConfig.type === 'jira') {
  console.log(taskConfig.jira.projectKey);
}
```

---

#### CF-OP-005: getTelemetryConfig

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | CF-OP-005   |
| **Type**         | Synchronous |
| **Implements**   | FR-CF-004   |

**Purpose**: Get the telemetry configuration.

**Signature**:

```typescript
getTelemetryConfig(): TelemetryConfig
```

**Response Schema**:

| Field    | Type              | Description        |
| -------- | ----------------- | ------------------ |
| (return) | `TelemetryConfig` | Telemetry settings |

**Example**:

```typescript
const telemetry = config.getTelemetryConfig();
if (telemetry.enabled) {
  initializeTelemetry(telemetry.target);
}
```

---

### 2.3 Interface: SDK Delegation

**Purpose**: Provide access to AI execution SDK for provider, model, and session management.

**Consumers**: COMP-005 (WorkflowEngine), COMP-003 (StateManager)

---

#### CF-OP-008: getProviders

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | CF-OP-008    |
| **Type**         | Asynchronous |
| **Implements**   | HL-PM-001    |

**Purpose**: Get available AI providers from the SDK.

**Signature**:

```typescript
getProviders(): Promise<Provider[]>
```

**Response Schema**:

| Field    | Type         | Description            |
| -------- | ------------ | ---------------------- |
| (return) | `Provider[]` | Available AI providers |

**Preconditions**:

- Config must be initialized
- SDK client must be connected

**Example**:

```typescript
const providers = await config.getProviders();
// [{ id: 'anthropic', name: 'Anthropic', models: [...] }, ...]
```

---

#### CF-OP-009: getDefaultModel

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | CF-OP-009    |
| **Type**         | Asynchronous |
| **Implements**   | HL-PM-002    |

**Purpose**: Get the default model configuration from the SDK.

**Signature**:

```typescript
getDefaultModel(): Promise<ModelReference>
```

**Response Schema**:

| Field    | Type             | Description        |
| -------- | ---------------- | ------------------ |
| (return) | `ModelReference` | Default model info |

**Example**:

```typescript
const defaultModel = await config.getDefaultModel();
// { providerID: 'anthropic', modelID: 'claude-3-5-sonnet-20241022' }
```

---

#### CF-OP-010: getSDKClient

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | CF-OP-010            |
| **Type**         | Synchronous          |
| **Implements**   | HL-PM-001, HL-AU-001 |

**Purpose**: Get the SDK client for direct SDK access (sessions, auth, etc.).

**Signature**:

```typescript
getSDKClient(): SDKClient
```

**Response Schema**:

| Field    | Type        | Description         |
| -------- | ----------- | ------------------- |
| (return) | `SDKClient` | opencode SDK client |

**Preconditions**:

- Config must be initialized

**Error Conditions**:

| Error Code        | Condition              | Caller Action           |
| ----------------- | ---------------------- | ----------------------- |
| `NOT_INITIALIZED` | Config not initialized | Call initialize() first |

**Example**:

```typescript
const client = config.getSDKClient();
const session = await client.session.create({ title: 'My session' });
```

---

## 3. Required Interfaces

### 3.1 Dependencies on AI Execution SDK (opencode)

| Operation                | Purpose                          | When Called                |
| ------------------------ | -------------------------------- | -------------------------- |
| `createOpencodeClient()` | Create SDK client connection     | During Config.initialize() |
| `config.get()`           | Get SDK configuration            | On demand                  |
| `config.providers()`     | List providers and default model | On demand                  |
| `session.*`              | Session management               | Exposed via getSDKClient() |
| `auth.*`                 | Authentication management        | Exposed via getSDKClient() |

**Assumptions**:

- SDK is available and responsive
- SDK manages its own authentication state
- SDK handles provider credentials

**Failure Handling**:

- If SDK unavailable during init: Throw `SDK_ERROR`
- If SDK call fails: Propagate SDK error with context
- If SDK timeout: Propagate timeout error

---

## 4. Events Published

| Event  | When Published | Subscribers | Catalog Reference              |
| ------ | -------------- | ----------- | ------------------------------ |
| (none) | -              | -           | Config does not publish events |

**Note**: Configuration Manager is a pure data provider and does not publish events.

---

## 5. Events Subscribed

| Event  | Publisher | Handler Behavior                    |
| ------ | --------- | ----------------------------------- |
| (none) | -         | Config does not subscribe to events |

---

## 6. Type Definitions

### 6.1 CreateConfigOptions

```typescript
interface CreateConfigOptions {
  /** Required: Project root directory */
  targetDir: string;

  /** Optional: CLI override for task source */
  taskSource?: TaskSourceConfig;

  /** Optional: CLI override for telemetry */
  telemetry?: Partial<TelemetryConfig>;

  /** Optional: CLI override for default model */
  model?: string;
}
```

### 6.2 TaskSourceConfig

```typescript
interface TaskSourceConfig {
  type: 'local' | 'jira' | 'linear';

  jira?: {
    baseUrl: string;
    projectKey: string;
    // API token from JIRA_API_TOKEN env or credentials file
  };

  linear?: {
    teamId: string;
    // API key from LINEAR_API_KEY env or credentials file
  };
}
```

### 6.3 TelemetryConfig

```typescript
interface TelemetryConfig {
  /** Enable/disable telemetry */
  enabled: boolean;

  /** Where to send telemetry */
  target: 'console' | 'file' | 'otlp';

  /** OTLP endpoint (when target is 'otlp') */
  otlpEndpoint?: string;

  /** Include workflow inputs/outputs in telemetry */
  logWorkflowDetails?: boolean;
}
```

### 6.4 SettingsFile

Schema for `~/.flomaster/settings.json` and `.flomaster/settings.json`.

```typescript
interface SettingsFile {
  /** Task source configuration */
  taskSource?: TaskSourceConfig;

  /** Telemetry settings */
  telemetry?: TelemetryConfig;

  /** Default settings */
  defaults?: {
    model?: string;
  };
}
```

### 6.5 Storage Class

```typescript
class Storage {
  constructor(targetDir: string);

  // ─────────────────────────────────────────────────────
  // GLOBAL PATHS (static)
  // ─────────────────────────────────────────────────────

  static getGlobalFlomasterDir(): string; // ~/.flomaster/
  static getGlobalSettingsPath(): string; // ~/.flomaster/settings.json
  static getTaskCredentialsPath(): string; // ~/.flomaster/task-credentials.json

  // ─────────────────────────────────────────────────────
  // PROJECT PATHS (instance)
  // ─────────────────────────────────────────────────────

  getProjectRoot(): string; // Project root
  getFlomasterDir(): string; // .flomaster/
  getWorkflowsDir(): string; // .flomaster/workflows/
  getTasksDir(): string; // .flomaster/tasks/
  getCheckpointsDir(): string; // .flomaster/checkpoints/
  getProjectSettingsPath(): string; // .flomaster/settings.json
}
```

### 6.6 ConfigError

```typescript
class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: ConfigErrorCode
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

type ConfigErrorCode =
  | 'INVALID_PARAMS' // Invalid constructor parameters
  | 'NOT_FOUND' // Workflow/resource not found
  | 'INVALID_SCHEMA' // Schema validation failed
  | 'NOT_INITIALIZED' // initialize() not called
  | 'ALREADY_INITIALIZED' // initialize() called twice
  | 'SDK_ERROR'; // Error from AI execution SDK
```

### 6.7 SDK Types (from opencode)

```typescript
// Re-exported from @opencode-ai/sdk
type SDKClient = import('@opencode-ai/sdk').Client;
type Provider = import('@opencode-ai/sdk').Provider;
type ModelReference = {
  providerID: string;
  modelID: string;
};
```

---

## 7. Invariants

| Invariant               | Description                              | Enforcement                   |
| ----------------------- | ---------------------------------------- | ----------------------------- |
| Single initialization   | initialize() can only be called once     | Throws ALREADY_INITIALIZED    |
| Initialization required | SDK methods require initialization       | assertInitialized() guard     |
| Immutability            | Settings don't change after construction | No setters, readonly fields   |
| Valid paths             | All paths are absolute                   | path.resolve() in constructor |
| Schema validation       | Settings and workflows validated         | Zod validation on load        |

---

## 8. Performance Expectations

| Operation   | Expected Latency | Throughput | Notes                |
| ----------- | ---------------- | ---------- | -------------------- |
| CF-OP-001   | < 500ms          | Once       | Factory + init       |
| CF-OP-002/3 | < 1ms            | High       | In-memory lookup     |
| CF-OP-004/5 | < 1ms            | High       | In-memory lookup     |
| CF-OP-006   | < 10ms           | Medium     | May hit cache        |
| CF-OP-007   | < 50ms           | Low        | Directory scan       |
| CF-OP-008/9 | < 100ms          | Low        | SDK call             |
| CF-OP-010   | < 1ms            | High       | Return cached client |

---

## 9. Versioning and Compatibility

### 9.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 2.0   |
| **Backwards Compatible Since** | 2.0   |

### 9.2 Breaking Changes from v1.0

| Change                          | Migration Path                            |
| ------------------------------- | ----------------------------------------- |
| Removed command definition APIs | Prompts now inline in workflow steps      |
| Removed credential management   | Handled by SDK (auth.set())               |
| Removed tool configuration APIs | Tools now per-step in workflow definition |
| Removed validation config APIs  | Handled by SDK                            |
| Removed provider/model getters  | Use getSDKClient() for direct SDK access  |

---

## 10. Traceability

### 10.1 Requirement to Operation Mapping

| Functional Requirement | Operations                            |
| ---------------------- | ------------------------------------- |
| FR-CF-001              | Delegated to Orchestrator (OR-OP-001) |
| FR-CF-002              | Delegated to Orchestrator (OR-OP-002) |
| FR-CF-003              | Delegated to Orchestrator (OR-OP-002) |
| FR-CF-004              | CF-OP-001 through CF-OP-005           |
| FR-CF-005              | CF-OP-001 (defaults)                  |
| FR-CF-006              | CF-OP-001 (hierarchy)                 |

### 10.2 Requirements Delegated to SDK

| Requirement | Delegated To | SDK Operation      |
| ----------- | ------------ | ------------------ |
| FR-CF-024   | opencode SDK | auth.set()         |
| FR-CF-027   | opencode SDK | auth.set()         |
| HL-PM-001   | opencode SDK | config.providers() |
| HL-PM-002   | opencode SDK | config.providers() |
| HL-AU-001   | opencode SDK | auth.set()         |

### 10.3 Requirements Delegated to Orchestrator

Workflow definition loading and type definitions are owned by the Orchestrator (COMP-005).

| Old Requirement | New Location                               |
| --------------- | ------------------------------------------ |
| FR-CF-001       | Orchestrator: OR-OP-001 (loadWorkflow)     |
| FR-CF-002       | Orchestrator: OR-OP-002 (validateWorkflow) |
| FR-CF-010-016   | Orchestrator: Step.template                |
| FR-CF-029-031   | Orchestrator: Step.tools                   |
| FR-CF-012       | Orchestrator: Step.inputs                  |
| FR-CF-013       | Orchestrator: Step.outputs                 |

See [Orchestrator Contract](./05-orchestrator.md) for `Workflow`, `Step`, and `Connection` type definitions.

### 10.4 Operation Index

| Operation ID | Name                | Type  | Implements           |
| ------------ | ------------------- | ----- | -------------------- |
| CF-OP-001    | createConfig        | Async | FR-CF-004/5/6        |
| CF-OP-002    | getStorage          | Sync  | FR-CF-004            |
| CF-OP-003    | getTargetDir        | Sync  | FR-CF-004            |
| CF-OP-004    | getTaskSourceConfig | Sync  | FR-CF-004            |
| CF-OP-005    | getTelemetryConfig  | Sync  | FR-CF-004            |
| CF-OP-008    | getProviders        | Async | HL-PM-001            |
| CF-OP-009    | getDefaultModel     | Async | HL-PM-002            |
| CF-OP-010    | getSDKClient        | Sync  | HL-PM-001, HL-AU-001 |

**Note**: CF-OP-006 and CF-OP-007 (workflow loading) have been removed. Workflow loading is now handled by the Orchestrator (OR-OP-001).

---

## 11. File Structure

```
packages/core/src/config/
├── config.ts           # Config class
├── factory.ts          # createConfig() factory function
├── storage.ts          # Storage path management
├── types.ts            # ConfigParameters, TaskSourceConfig, etc.
├── errors.ts           # ConfigError
├── schemas.ts          # Zod schemas for validation
├── defaults.ts         # DEFAULT_SETTINGS
├── loader.ts           # loadSettingsFile(), mergeSettings()
└── index.ts            # Public exports
```

---

## Document History

| Version | Date       | Author            | Changes                                                  |
| ------- | ---------- | ----------------- | -------------------------------------------------------- |
| 1.0     | 2025-12-03 | Architecture Team | Initial version                                          |
| 2.0     | 2025-12-25 | Architecture Team | Major simplification: removed commands, delegated to SDK |
| 2.1     | 2025-12-25 | Architecture Team | Removed workflow types (moved to Orchestrator contract)  |
