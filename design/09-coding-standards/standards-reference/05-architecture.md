# Architecture Patterns - Coding Standard

> **Standard ID**: STD-005
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js CLI Applications
> **Enforcement**: Manual Review + Structural Checks
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - STD-001
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md)
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory architecture patterns for TypeScript/Node.js CLI applications. These patterns provide structural guidance for organizing code, managing dependencies, handling cross-cutting concerns, and maintaining consistency across the codebase.

### 1.2 Scope

**Applies to**:

- All TypeScript source files
- Package/module organization
- Component design and relationships
- Dependency management between modules

**Does NOT apply to**:

- Test file organization (see Testing Standards)
- Build configuration (see Build Standards)
- UI component patterns (React-specific patterns)

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Architecture review, dependency linting |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle                    | Description                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| Separation of Concerns       | Each component has a single, well-defined responsibility           |
| Dependency Direction         | Dependencies flow inward; core has no external dependencies        |
| Explicit over Implicit       | Dependencies are visible in constructors, not hidden               |
| Composition over Inheritance | Favor composing services over deep inheritance hierarchies         |
| Testability                  | All patterns enable isolated unit testing via dependency injection |
| No Singletons                | Avoid global state; instantiate and inject dependencies explicitly |

---

## 3. Architectural Overview

### 3.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Commands   │  │     UI      │  │   Layouts   │                 │
│  │ (CLI entry) │  │ Components  │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Depends on ↓
┌───────────────────────────┴─────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Handlers   │  │ Coordinators│  │  Executors  │                 │
│  │             │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Depends on ↓
┌───────────────────────────┴─────────────────────────────────────────┐
│                        DOMAIN LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Services   │  │  Managers   │  │ Validators  │                 │
│  │             │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Depends on ↓
┌───────────────────────────┴─────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Clients   │  │   Loaders   │  │ Registries  │  │  Utils    │  │
│  │             │  │             │  │             │  │           │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer          | Responsibility                                         | Contains                            | Depends On             |
| -------------- | ------------------------------------------------------ | ----------------------------------- | ---------------------- |
| Presentation   | User interaction, CLI commands, UI rendering           | Commands, Components, Layouts       | Orchestration, Domain  |
| Orchestration  | Coordinate workflows, handle events, execute pipelines | Handlers, Coordinators, Executors   | Domain, Infrastructure |
| Domain         | Business logic, state management, validation           | Services, Managers, Validators      | Infrastructure         |
| Infrastructure | External systems, data loading, utilities              | Clients, Loaders, Registries, Utils | None (external only)   |

### 3.3 Dependency Rules

| From Layer     | To Layer       | Allowed | Rationale                                   |
| -------------- | -------------- | ------- | ------------------------------------------- |
| Presentation   | Orchestration  | Yes     | Commands delegate to handlers               |
| Presentation   | Domain         | Yes     | Direct service calls for simple operations  |
| Presentation   | Infrastructure | No      | Must go through Domain/Orchestration        |
| Orchestration  | Domain         | Yes     | Handlers use services                       |
| Orchestration  | Infrastructure | Yes     | Handlers may use clients directly           |
| Orchestration  | Presentation   | No      | No upward dependencies                      |
| Domain         | Infrastructure | Yes     | Services use clients and utilities          |
| Domain         | Orchestration  | No      | No upward dependencies                      |
| Domain         | Presentation   | No      | No upward dependencies                      |
| Infrastructure | Any Layer      | No      | Infrastructure has no internal dependencies |

---

## 4. Patterns

### 4.1 Service Pattern

#### 4.1.1 When to Use

Use this pattern when:

- Encapsulating stateless business logic for a specific domain
- Providing reusable operations that multiple components need
- Isolating domain knowledge from orchestration concerns

Do NOT use this pattern when:

- Managing entity lifecycle or mutable state (use Manager)
- Handling events or coordinating workflows (use Handler)
- Loading resources from external sources (use Loader)

#### 4.1.2 Structure

```
services/
├── userService.ts          # User domain operations
├── fileSystemService.ts    # File system operations
├── compressionService.ts   # Compression logic
└── index.ts                # Barrel export
```

#### 4.1.3 Implementation Template

```typescript
/**
 * [DomainName]Service handles [domain]-related business logic.
 *
 * Responsibility:
 * - [Primary responsibility]
 * - [Secondary responsibility]
 *
 * Dependencies:
 * - [Dependency 1] for [purpose]
 * - [Dependency 2] for [purpose]
 */
export class [DomainName]Service {
  constructor(
    private readonly [dependency1]: [Type1],
    private readonly [dependency2]: [Type2],
  ) {}

  /**
   * [Method description].
   * @param [param] - [Parameter description]
   * @returns [Return description]
   * @throws [ErrorType] - [When thrown]
   */
  async [methodName]([param]: [Type]): Promise<[ReturnType]> {
    // Implementation
  }
}
```

#### 4.1.4 Complete Example

```typescript
// File: src/services/snapshotService.ts

import type { Storage } from '../infrastructure/storage.js';
import type { Logger } from '../infrastructure/logger.js';
import { NotFoundError, ValidationError } from '../errors/index.js';

/**
 * SnapshotService handles file snapshot operations.
 *
 * Responsibility:
 * - Creating point-in-time snapshots
 * - Restoring from snapshots
 * - Managing snapshot metadata
 *
 * Dependencies:
 * - Storage for persistence
 * - Logger for operation logging
 */
export class SnapshotService {
  constructor(
    private readonly storage: Storage,
    private readonly logger: Logger
  ) {}

  /**
   * Creates a snapshot of the current state.
   * @param message - Description of the snapshot
   * @returns Snapshot identifier
   * @throws ValidationError - If message is empty
   */
  async createSnapshot(message: string): Promise<string> {
    if (!message.trim()) {
      throw new ValidationError('Snapshot message cannot be empty');
    }

    const snapshotId = await this.storage.save({
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.info('Snapshot created', { snapshotId, message });
    return snapshotId;
  }

  /**
   * Restores state from a snapshot.
   * @param snapshotId - Identifier of snapshot to restore
   * @throws NotFoundError - If snapshot does not exist
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = await this.storage.load(snapshotId);

    if (!snapshot) {
      throw new NotFoundError(`Snapshot not found: ${snapshotId}`);
    }

    await this.storage.restore(snapshotId);
    this.logger.info('Snapshot restored', { snapshotId });
  }
}
```

---

### 4.2 Manager Pattern

#### 4.2.1 When to Use

Use this pattern when:

- Managing entity state, configuration, or lifecycle
- Coordinating between multiple concerns for a single entity type
- Caching or maintaining mutable state

Do NOT use this pattern when:

- Implementing stateless business logic (use Service)
- Handling events or requests (use Handler)
- Creating complex objects (use Factory)

#### 4.2.2 Structure

```
managers/
├── sessionManager.ts       # Session lifecycle
├── accountManager.ts       # Account state
├── settingsManager.ts      # Settings management
└── index.ts                # Barrel export
```

#### 4.2.3 Implementation Template

```typescript
/**
 * [Entity]Manager manages [entity] state and lifecycle.
 *
 * Responsibility:
 * - [State management responsibility]
 * - [Lifecycle responsibility]
 *
 * State:
 * - [What state is maintained]
 */
export class [Entity]Manager {
  private [stateField]: [StateType];

  constructor(
    private readonly [dependency]: [Type],
  ) {
    this.[stateField] = [initialValue];
  }

  /**
   * Gets the current [entity] state.
   */
  get[Entity](): [EntityType] | null {
    return this.[stateField];
  }

  /**
   * Caches/stores [entity] for later retrieval.
   * @param [entity] - The [entity] to cache
   */
  async cache[Entity]([entity]: [EntityType]): Promise<void> {
    // Implementation
  }

  /**
   * Clears the cached [entity].
   */
  async clear[Entity](): Promise<void> {
    // Implementation
  }
}
```

#### 4.2.4 Complete Example

```typescript
// File: src/managers/sessionManager.ts

import type { Storage } from '../infrastructure/storage.js';
import type { Session, SessionState } from '../types/session.js';

/**
 * SessionManager manages user session state and lifecycle.
 *
 * Responsibility:
 * - Maintaining active session state
 * - Persisting session between runs
 * - Session expiration handling
 *
 * State:
 * - Current active session (nullable)
 * - Session cache for quick access
 */
export class SessionManager {
  private currentSession: Session | null = null;
  private readonly sessionCache: Map<string, Session> = new Map();

  constructor(
    private readonly storage: Storage,
    private readonly sessionTimeoutMs: number
  ) {}

  /**
   * Gets the current active session.
   */
  getCurrentSession(): Session | null {
    if (this.currentSession && this.isSessionExpired(this.currentSession)) {
      this.currentSession = null;
    }
    return this.currentSession;
  }

  /**
   * Caches a session for later retrieval.
   * @param session - The session to cache
   */
  async cacheSession(session: Session): Promise<void> {
    this.currentSession = session;
    this.sessionCache.set(session.id, session);
    await this.storage.save(`session:${session.id}`, session);
  }

  /**
   * Retrieves a session by ID.
   * @param sessionId - The session identifier
   * @returns Session if found and not expired, null otherwise
   */
  async getSession(sessionId: string): Promise<Session | null> {
    // Check cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached && !this.isSessionExpired(cached)) {
      return cached;
    }

    // Fall back to storage
    const stored = await this.storage.load<Session>(`session:${sessionId}`);
    if (stored && !this.isSessionExpired(stored)) {
      this.sessionCache.set(sessionId, stored);
      return stored;
    }

    return null;
  }

  /**
   * Clears all session state.
   */
  async clearAllSessions(): Promise<void> {
    this.currentSession = null;
    this.sessionCache.clear();
  }

  private isSessionExpired(session: Session): boolean {
    const expirationTime = new Date(session.createdAt).getTime() + this.sessionTimeoutMs;
    return Date.now() > expirationTime;
  }
}
```

---

### 4.3 Handler Pattern

#### 4.3.1 When to Use

Use this pattern when:

- Processing events or requests
- Coordinating multiple services to complete a workflow
- Acting as an entry point for complex operations

Do NOT use this pattern when:

- Implementing domain-specific logic (use Service)
- Managing entity state (use Manager)
- Simple CRUD operations (use Service directly)

#### 4.3.2 Structure

```
handlers/
├── eventHandler.ts         # Event processing
├── requestHandler.ts       # Request handling
├── webhookHandler.ts       # Webhook processing
└── index.ts                # Barrel export
```

#### 4.3.3 Implementation Template

```typescript
/**
 * [Domain]Handler coordinates [domain] event/request processing.
 *
 * Responsibility:
 * - Orchestrating [workflow type]
 * - Coordinating between [services involved]
 *
 * Dependencies:
 * - [Service 1] for [purpose]
 * - [Service 2] for [purpose]
 */
export class [Domain]Handler {
  constructor(
    private readonly [service1]: [Service1Type],
    private readonly [service2]: [Service2Type],
    private readonly logger: Logger,
  ) {}

  /**
   * Handles [event/request type].
   * @param [input] - The [input type] to process
   * @returns [Result description]
   */
  async handle[EventName]([input]: [InputType]): Promise<[ResultType]> {
    // 1. Validate input
    this.validateInput([input]);

    // 2. Orchestrate services
    const intermediate = await this.[service1].process([input]);

    // 3. Aggregate results
    return await this.[service2].finalize(intermediate);
  }

  private validateInput([input]: [InputType]): void {
    // Validation logic
  }
}
```

#### 4.3.4 Complete Example

```typescript
// File: src/handlers/commandHandler.ts

import type { CommandService } from '../services/commandService.js';
import type { ValidationService } from '../services/validationService.js';
import type { Logger } from '../infrastructure/logger.js';
import type { CommandRequest, CommandResult } from '../types/command.js';
import { ValidationError } from '../errors/index.js';

/**
 * CommandHandler coordinates command execution workflows.
 *
 * Responsibility:
 * - Validating command requests
 * - Orchestrating command execution
 * - Aggregating and formatting results
 *
 * Dependencies:
 * - CommandService for command execution
 * - ValidationService for input validation
 * - Logger for operation logging
 */
export class CommandHandler {
  constructor(
    private readonly commandService: CommandService,
    private readonly validationService: ValidationService,
    private readonly logger: Logger
  ) {}

  /**
   * Handles a command execution request.
   * @param request - The command request to process
   * @returns Command execution result
   * @throws ValidationError - If request is invalid
   */
  async handleCommandRequest(request: CommandRequest): Promise<CommandResult> {
    this.logger.debug('Processing command request', { command: request.name });

    // 1. Validate the request
    const validationResult = this.validationService.validate(request);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors.join(', '));
    }

    // 2. Execute the command
    const executionResult = await this.commandService.execute(request);

    // 3. Log and return result
    this.logger.info('Command executed', {
      command: request.name,
      success: executionResult.success,
    });

    return executionResult;
  }

  /**
   * Handles batch command execution.
   * @param requests - Array of command requests
   * @returns Array of results (settled, includes failures)
   */
  async handleBatchCommands(requests: CommandRequest[]): Promise<CommandResult[]> {
    const results = await Promise.allSettled(
      requests.map((request) => this.handleCommandRequest(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false,
        command: requests[index].name,
        error: result.reason.message,
      };
    });
  }
}
```

---

### 4.4 Registry Pattern

#### 4.4.1 When to Use

Use this pattern when:

- Maintaining a collection of registered items
- Providing lookup functionality by key or criteria
- Aggregating items from multiple sources

Do NOT use this pattern when:

- Managing entity lifecycle (use Manager)
- Simple key-value storage (use Map directly)
- Loading items from a single source (use Loader)

#### 4.4.2 Structure

```
registries/
├── toolRegistry.ts         # Tool definitions
├── commandRegistry.ts      # Command registrations
├── hookRegistry.ts         # Hook registrations
└── index.ts                # Barrel export
```

#### 4.4.3 Implementation Template

```typescript
/**
 * [Entity]Registry maintains registered [entities].
 *
 * Responsibility:
 * - Loading [entities] from multiple sources
 * - Providing lookup by [key type]
 * - Managing registration priority
 *
 * Initialization:
 * - MUST call initialize() before use
 */
export class [Entity]Registry {
  private readonly entries: Map<string, [EntryType]> = new Map();
  private isInitialized = false;

  constructor(
    private readonly config: Config,
  ) {}

  /**
   * Initializes the registry by loading from all sources.
   * MUST be called before any other method.
   */
  async initialize(): Promise<void> {
    // Load from sources
    this.isInitialized = true;
  }

  /**
   * Gets [entities] matching criteria.
   * @throws RegistryNotInitializedError - If not initialized
   */
  get[Entities]For[Criteria]([criteria]: [CriteriaType]): [EntryType][] {
    this.ensureInitialized();
    // Return matching entries
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new RegistryNotInitializedError('[Entity]Registry');
    }
  }
}
```

#### 4.4.4 Complete Example

```typescript
// File: src/registries/hookRegistry.ts

import type { Config } from '../config/index.js';
import type { HookDefinition, HookRegistryEntry } from '../types/hook.js';
import { RegistryNotInitializedError } from '../errors/index.js';

type HookSource = 'system' | 'user' | 'project' | 'extension';

const SOURCE_PRIORITY: Record<HookSource, number> = {
  project: 0, // Highest priority
  user: 1,
  system: 2,
  extension: 3, // Lowest priority
};

/**
 * HookRegistry maintains registered hooks from all sources.
 *
 * Responsibility:
 * - Loading hooks from system, user, project, and extension sources
 * - Providing lookup by event name
 * - Managing hook priority (project > user > system > extension)
 *
 * Initialization:
 * - MUST call initialize() before use
 */
export class HookRegistry {
  private readonly entries: Map<string, HookRegistryEntry[]> = new Map();
  private isInitialized = false;

  constructor(private readonly config: Config) {}

  /**
   * Initializes the registry by loading hooks from all sources.
   * MUST be called before any other method.
   */
  async initialize(): Promise<void> {
    const sources: Array<{ source: HookSource; hooks: HookDefinition[] }> = [
      { source: 'system', hooks: await this.loadSystemHooks() },
      { source: 'user', hooks: await this.loadUserHooks() },
      { source: 'project', hooks: await this.loadProjectHooks() },
    ];

    for (const { source, hooks } of sources) {
      for (const hook of hooks) {
        this.registerHook(hook, source);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Gets hooks registered for a specific event.
   * @param eventName - The event to get hooks for
   * @returns Hooks sorted by priority (project first, extension last)
   * @throws RegistryNotInitializedError - If not initialized
   */
  getHooksForEvent(eventName: string): HookRegistryEntry[] {
    this.ensureInitialized();

    const hooks = this.entries.get(eventName) ?? [];
    return [...hooks].sort((a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]);
  }

  /**
   * Gets all registered hooks.
   * @throws RegistryNotInitializedError - If not initialized
   */
  getAllHooks(): HookRegistryEntry[] {
    this.ensureInitialized();

    const allHooks: HookRegistryEntry[] = [];
    for (const hooks of this.entries.values()) {
      allHooks.push(...hooks);
    }
    return allHooks;
  }

  private registerHook(hook: HookDefinition, source: HookSource): void {
    const entry: HookRegistryEntry = { ...hook, source };
    const existing = this.entries.get(hook.eventName) ?? [];
    this.entries.set(hook.eventName, [...existing, entry]);
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new RegistryNotInitializedError('HookRegistry');
    }
  }

  private async loadSystemHooks(): Promise<HookDefinition[]> {
    // Load from system config
    return [];
  }

  private async loadUserHooks(): Promise<HookDefinition[]> {
    // Load from user config
    return [];
  }

  private async loadProjectHooks(): Promise<HookDefinition[]> {
    // Load from project config
    return [];
  }
}
```

---

### 4.5 Loader Pattern

#### 4.5.1 When to Use

Use this pattern when:

- Loading resources from external sources (files, APIs, databases)
- Implementing pluggable resource providers
- Abstracting resource loading for testability

Do NOT use this pattern when:

- Managing loaded resources (use Registry or Manager)
- Simple configuration loading (use Config directly)
- In-memory data transformation (use Service)

#### 4.5.2 Structure

```
loaders/
├── configLoader.ts         # Configuration loading
├── extensionLoader.ts      # Extension loading
├── commandLoader.ts        # Command loading
└── index.ts                # Barrel export
```

#### 4.5.3 Implementation Template

```typescript
/**
 * Interface for [entity] loaders.
 * Implementations load [entities] from different sources.
 */
export interface I[Entity]Loader {
  /**
   * Loads [entities] from this loader's source.
   * @param signal - Abort signal for cancellation
   * @returns Loaded [entities]
   */
  load[Entities](signal: AbortSignal): Promise<[EntityType][]>;
}

/**
 * [Source][Entity]Loader loads [entities] from [source].
 */
export class [Source][Entity]Loader implements I[Entity]Loader {
  constructor(
    private readonly [config]: [ConfigType],
  ) {}

  async load[Entities](signal: AbortSignal): Promise<[EntityType][]> {
    // Load from source, respecting abort signal
  }
}
```

#### 4.5.4 Complete Example

```typescript
// File: src/loaders/commandLoader.ts

import type { Config } from '../config/index.js';
import type { SlashCommand } from '../types/command.js';
import { readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';

/**
 * Interface for command loaders.
 * Implementations load commands from different sources.
 */
export interface ICommandLoader {
  /**
   * Loads commands from this loader's source.
   * @param signal - Abort signal for cancellation
   * @returns Loaded commands
   */
  loadCommands(signal: AbortSignal): Promise<SlashCommand[]>;
}

/**
 * BuiltinCommandLoader loads hardcoded built-in commands.
 */
export class BuiltinCommandLoader implements ICommandLoader {
  constructor(private readonly config: Config | null) {}

  async loadCommands(_signal: AbortSignal): Promise<SlashCommand[]> {
    const commands: SlashCommand[] = [
      {
        name: 'help',
        description: 'Show available commands',
        kind: 'builtin',
        action: async () => {
          /* implementation */
        },
      },
      {
        name: 'clear',
        description: 'Clear the screen',
        kind: 'builtin',
        action: async () => {
          /* implementation */
        },
      },
    ];

    // Conditionally include commands based on config
    if (this.config?.isFeatureEnabled('advanced')) {
      commands.push({
        name: 'debug',
        description: 'Debug information',
        kind: 'builtin',
        action: async () => {
          /* implementation */
        },
      });
    }

    return commands;
  }
}

/**
 * FileCommandLoader loads commands from YAML configuration files.
 */
export class FileCommandLoader implements ICommandLoader {
  constructor(private readonly filePath: string) {}

  async loadCommands(signal: AbortSignal): Promise<SlashCommand[]> {
    if (signal.aborted) {
      return [];
    }

    try {
      const content = await readFile(this.filePath, 'utf-8');
      const parsed = parseYaml(content) as { commands?: SlashCommand[] };
      return parsed.commands ?? [];
    } catch {
      // File doesn't exist or is invalid - return empty
      return [];
    }
  }
}
```

---

### 4.6 Client Pattern

#### 4.6.1 When to Use

Use this pattern when:

- Communicating with external systems or APIs
- Wrapping complex subsystem interfaces
- Providing a simplified facade for external services

Do NOT use this pattern when:

- Implementing business logic (use Service)
- Managing internal state (use Manager)
- Loading static resources (use Loader)

#### 4.6.2 Structure

```
clients/
├── httpClient.ts           # HTTP operations
├── llmClient.ts            # LLM provider integration
├── ideClient.ts            # IDE communication
└── index.ts                # Barrel export
```

#### 4.6.3 Implementation Template

```typescript
/**
 * [System]Client provides interface to [external system].
 *
 * Responsibility:
 * - [API operation 1]
 * - [API operation 2]
 *
 * Configuration:
 * - [Required config options]
 */
export class [System]Client {
  constructor(
    private readonly config: [ConfigType],
  ) {}

  /**
   * [Operation description].
   * @param [params] - [Parameter description]
   * @param options - Request options including abort signal
   * @returns [Return description]
   * @throws [ErrorType] - [When thrown]
   */
  async [operationName](
    [params]: [ParamType],
    options?: { signal?: AbortSignal; maxRetries?: number },
  ): Promise<[ReturnType]> {
    // Implementation with retry and abort support
  }
}
```

#### 4.6.4 Complete Example

```typescript
// File: src/clients/llmClient.ts

import type { Config } from '../config/index.js';
import type { ContentGenerator } from './contentGenerator.js';
import type { GenerateContentRequest, GenerateContentResponse } from '../types/llm.js';
import { RetryableError, TerminalError } from '../errors/index.js';

interface GenerateOptions {
  signal?: AbortSignal;
  maxRetries?: number;
}

/**
 * LlmClient provides interface to LLM providers.
 *
 * Responsibility:
 * - Generating content from prompts
 * - Handling retries and rate limiting
 * - Managing abort signals
 *
 * Configuration:
 * - Provider selection
 * - Retry settings
 * - Timeout configuration
 */
export class LlmClient {
  private readonly defaultMaxRetries = 3;

  constructor(
    private readonly contentGenerator: ContentGenerator,
    private readonly config: Config
  ) {}

  /**
   * Generates content from a prompt.
   * @param request - The generation request
   * @param options - Request options including abort signal
   * @returns Generated content response
   * @throws TerminalError - If generation fails after all retries
   */
  async generateContent(
    request: GenerateContentRequest,
    options?: GenerateOptions
  ): Promise<GenerateContentResponse> {
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (options?.signal?.aborted) {
        throw new Error('Request aborted');
      }

      try {
        return await this.contentGenerator.generate(request, options?.signal);
      } catch (error) {
        lastError = error as Error;

        if (this.isRetryable(error)) {
          await this.delay(this.calculateBackoff(attempt), options?.signal);
          continue;
        }

        throw error;
      }
    }

    throw new TerminalError(
      `Generation failed after ${maxRetries} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Generates structured JSON from a prompt.
   * @param request - The generation request with JSON schema
   * @param options - Request options
   * @returns Parsed JSON object
   */
  async generateJson(
    request: GenerateContentRequest & { schema: object },
    options?: GenerateOptions
  ): Promise<Record<string, unknown>> {
    const response = await this.generateContent(request, options);
    return JSON.parse(response.text);
  }

  private isRetryable(error: unknown): boolean {
    return error instanceof RetryableError;
  }

  private calculateBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }

  private async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Request aborted'));
      });
    });
  }
}
```

---

### 4.7 Factory Pattern

#### 4.7.1 When to Use

Use this pattern when:

- Creating objects with complex initialization
- Async initialization is required before use
- Multiple construction strategies exist
- Encapsulating creation logic

Do NOT use this pattern when:

- Simple construction with no complex logic
- No async initialization needed
- Single construction path

#### 4.7.2 Structure

Two approaches:

**Approach A: Separate Factory Class**

```
factories/
├── connectionFactory.ts    # Creates connections
├── serviceFactory.ts       # Creates service instances
└── index.ts                # Barrel export
```

**Approach B: Static Factory Method (Preferred)**

```typescript
class Service {
  private constructor(...) {}
  static async create(...): Promise<Service> {}
}
```

#### 4.7.3 Implementation Template (Static Factory Method)

```typescript
/**
 * [Entity] with async initialization.
 * Use [Entity].create() to instantiate.
 */
export class [Entity] {
  /**
   * Private constructor - use create() instead.
   */
  private constructor(
    private readonly [field]: [Type],
  ) {}

  /**
   * Creates a new [Entity] instance.
   * @param [params] - Creation parameters
   * @param signal - Abort signal for cancellation
   * @returns Fully initialized [Entity]
   */
  static async create(
    [params]: [ParamType],
    signal: AbortSignal,
  ): Promise<[Entity]> {
    // 1. Load/prepare resources
    // 2. Validate
    // 3. Construct
    return new [Entity]([field]);
  }
}
```

#### 4.7.4 Complete Example

```typescript
// File: src/services/commandService.ts

import type { ICommandLoader } from '../loaders/commandLoader.js';
import type { SlashCommand } from '../types/command.js';

/**
 * CommandService provides command lookup and execution.
 * Use CommandService.create() to instantiate.
 */
export class CommandService {
  /**
   * Private constructor - use create() instead.
   */
  private constructor(private readonly commands: readonly SlashCommand[]) {}

  /**
   * Creates a CommandService by loading from all loaders.
   * @param loaders - Command loaders to aggregate
   * @param signal - Abort signal for cancellation
   * @returns Fully initialized CommandService
   */
  static async create(loaders: ICommandLoader[], signal: AbortSignal): Promise<CommandService> {
    // 1. Load from all loaders in parallel
    const results = await Promise.allSettled(loaders.map((loader) => loader.loadCommands(signal)));

    // 2. Aggregate successful results
    const allCommands: SlashCommand[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allCommands.push(...result.value);
      }
    }

    // 3. Deduplicate with conflict resolution
    const commandMap = new Map<string, SlashCommand>();
    for (const command of allCommands) {
      let finalName = command.name;

      // Resolve name conflicts for extension commands
      if (command.extensionName && commandMap.has(command.name)) {
        finalName = `${command.extensionName}:${command.name}`;
      }

      commandMap.set(finalName, { ...command, name: finalName });
    }

    // 4. Freeze and return
    const finalCommands = Object.freeze(Array.from(commandMap.values()));
    return new CommandService(finalCommands);
  }

  /**
   * Gets a command by name.
   * @param name - Command name to find
   * @returns Command if found, undefined otherwise
   */
  getCommand(name: string): SlashCommand | undefined {
    return this.commands.find((cmd) => cmd.name === name);
  }

  /**
   * Gets all registered commands.
   * @returns Readonly array of commands
   */
  getAllCommands(): readonly SlashCommand[] {
    return this.commands;
  }
}
```

---

## 5. Role Definitions

### 5.1 Component Roles

| Role Suffix  | Responsibility                      | State                | Layer          | Dependencies            |
| ------------ | ----------------------------------- | -------------------- | -------------- | ----------------------- |
| `*Service`   | Stateless business logic            | None or minimal      | Domain         | Clients, other Services |
| `*Manager`   | State/lifecycle management          | Mutable state        | Domain         | Services, Storage       |
| `*Handler`   | Event/request orchestration         | None                 | Orchestration  | Services, Managers      |
| `*Registry`  | Store and retrieve registered items | Immutable after init | Infrastructure | Config, Loaders         |
| `*Loader`    | Load resources from sources         | None                 | Infrastructure | External sources        |
| `*Client`    | External system communication       | None                 | Infrastructure | External APIs           |
| `*Factory`   | Complex object creation             | None                 | Any            | Varies                  |
| `*Validator` | Data validation                     | None                 | Domain         | Schemas                 |
| `*Executor`  | Execute commands/tasks              | None                 | Orchestration  | Services                |
| `*Builder`   | Step-by-step construction           | Temporary            | Any            | None                    |
| `*Resolver`  | Resolve references/lookups          | None                 | Domain         | Registries              |

### 5.2 Role Selection Flowchart

```
What does this component do?
│
├─ Encapsulates stateless business logic?
│   └─ YES → Service
│
├─ Manages entity state or lifecycle?
│   └─ YES → Manager
│
├─ Processes events or coordinates workflows?
│   └─ YES → Handler
│
├─ Maintains a collection for lookup?
│   └─ YES → Registry
│
├─ Loads resources from external sources?
│   └─ YES → Loader
│
├─ Communicates with external systems?
│   └─ YES → Client
│
├─ Creates objects with complex logic?
│   └─ YES → Factory (or static create method)
│
├─ Validates data against rules?
│   └─ YES → Validator
│
├─ Executes commands or tasks?
│   └─ YES → Executor
│
└─ None of the above?
    └─ Reconsider design or use utility function
```

### 5.3 Role Examples

| Scenario                        | Correct Role       | Incorrect Role     | Why                                |
| ------------------------------- | ------------------ | ------------------ | ---------------------------------- |
| Compress chat history           | CompressionService | CompressionManager | Stateless transformation = Service |
| Track active sessions           | SessionManager     | SessionService     | Maintains mutable state = Manager  |
| Process tool execution requests | ToolHandler        | ToolService        | Orchestrates workflow = Handler    |
| Store registered hooks          | HookRegistry       | HookManager        | Lookup collection = Registry       |
| Read commands from files        | FileCommandLoader  | CommandService     | Loads from external = Loader       |
| Call external LLM API           | LlmClient          | LlmService         | External communication = Client    |

---

## 6. Interaction Patterns

### 6.1 Request Processing Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Command │     │   Handler   │     │   Service   │     │   Client    │
│ (Entry) │     │(Orchestrate)│     │  (Logic)    │     │ (External)  │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │                   │
     │  1. Request     │                   │                   │
     │────────────────▶│                   │                   │
     │                 │  2. Validate      │                   │
     │                 │──────────────────▶│                   │
     │                 │                   │                   │
     │                 │  3. Validated     │                   │
     │                 │◀──────────────────│                   │
     │                 │                   │                   │
     │                 │  4. Execute       │                   │
     │                 │──────────────────▶│                   │
     │                 │                   │  5. API Call      │
     │                 │                   │──────────────────▶│
     │                 │                   │                   │
     │                 │                   │  6. Response      │
     │                 │                   │◀──────────────────│
     │                 │                   │                   │
     │                 │  7. Result        │                   │
     │                 │◀──────────────────│                   │
     │                 │                   │                   │
     │  8. Response    │                   │                   │
     │◀────────────────│                   │                   │
```

**Steps**:

1. Command receives user input and creates request
2. Handler validates request through validation service
3. Validation result returned
4. Handler delegates to domain service
5. Service calls external client if needed
6. Client returns external response
7. Service returns processed result
8. Handler formats and returns response to command

### 6.2 Registry Initialization Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    App      │     │  Registry   │     │   Loader    │
│  Startup    │     │             │     │  (multiple) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  1. initialize()  │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │  2. load() each   │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │  3. items[]       │
       │                   │◀──────────────────│
       │                   │                   │
       │                   │  4. aggregate     │
       │                   │  & sort by        │
       │                   │  priority         │
       │                   │                   │
       │  5. ready         │                   │
       │◀──────────────────│                   │
```

---

## 7. Anti-Patterns

### 7.1 Forbidden Patterns

| Anti-Pattern                              | Problem                                     | Correct Pattern                   |
| ----------------------------------------- | ------------------------------------------- | --------------------------------- |
| Singleton Services                        | Hidden dependencies, hard to test           | Constructor injection             |
| Service Locator                           | Runtime coupling, hidden dependencies       | Explicit dependency injection     |
| God Classes                               | Too many responsibilities, hard to maintain | Split into focused components     |
| Circular Dependencies                     | Tight coupling, initialization order issues | Introduce mediator or restructure |
| Anemic Domain Model                       | Logic scattered outside entities            | Encapsulate logic in Services     |
| Smart Constructors (async in constructor) | Constructor cannot be async                 | Use static factory method         |

### 7.2 Forbidden Dependencies

| From           | To            | Why Forbidden                                     |
| -------------- | ------------- | ------------------------------------------------- |
| Infrastructure | Domain        | Infrastructure must be dependency-free internally |
| Infrastructure | Orchestration | Same as above                                     |
| Domain         | Presentation  | Domain should not know about UI                   |
| Any Layer      | Circular      | Circular deps break initialization and testing    |

### 7.3 Code Smell Examples

```typescript
// ANTI-PATTERN: Singleton
// Problem: Hidden dependency, hard to test
class ConfigService {
  private static instance: ConfigService;
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

// CORRECT PATTERN: Constructor Injection
// Solution: Explicit dependency, easy to mock
class ConfigService {
  constructor(private readonly storage: Storage) {}
}

// Usage: const service = new ConfigService(storage);
```

```typescript
// ANTI-PATTERN: Async Constructor
// Problem: Constructors cannot be async, leads to uninitialized state
class Registry {
  constructor() {
    this.load(); // Cannot await this!
  }
  private async load() {
    /* ... */
  }
}

// CORRECT PATTERN: Static Factory Method
// Solution: Async factory ensures full initialization
class Registry {
  private constructor(private readonly items: Item[]) {}

  static async create(): Promise<Registry> {
    const items = await loadItems();
    return new Registry(items);
  }
}
```

```typescript
// ANTI-PATTERN: Service Locator
// Problem: Hidden dependencies, runtime failures
class Handler {
  handle() {
    const service = ServiceLocator.get('userService'); // Hidden!
    service.doSomething();
  }
}

// CORRECT PATTERN: Constructor Injection
// Solution: Dependencies visible and mockable
class Handler {
  constructor(private readonly userService: UserService) {}

  handle() {
    this.userService.doSomething();
  }
}
```

---

## 8. Decision Trees

### 8.1 Choosing a Component Role

```
Need to create a new component?
│
├─ Does it hold mutable state that persists?
│   ├─ YES → Is it a collection for lookup?
│   │         ├─ YES → Registry
│   │         └─ NO  → Manager
│   │
│   └─ NO ─┐
│          │
├─ Does it coordinate multiple services?
│   ├─ YES → Handler
│   └─ NO ─┐
│          │
├─ Does it load from external sources?
│   ├─ YES → Loader (if pluggable) or Client (if API)
│   └─ NO ─┐
│          │
├─ Does it encapsulate domain logic?
│   ├─ YES → Service
│   └─ NO ─┐
│          │
├─ Does it validate data?
│   ├─ YES → Validator
│   └─ NO ─┐
│          │
├─ Does it create complex objects?
│   ├─ YES → Factory or static create()
│   └─ NO ─┐
│          │
└─ Is it a simple utility function?
    ├─ YES → Export as function in utils/
    └─ NO  → Reconsider the design
```

### 8.2 Choosing Initialization Pattern

```
How should this component be initialized?
│
├─ Requires async operations (loading, fetching)?
│   ├─ YES → Static factory method: static async create()
│   └─ NO ─┐
│          │
├─ Has complex construction logic?
│   ├─ YES → Factory class or static factory method
│   └─ NO ─┐
│          │
├─ Needs validation before use?
│   ├─ YES → Static factory method with validation
│   └─ NO ─┐
│          │
└─ Simple construction?
    └─ YES → Regular constructor
```

### 8.3 Choosing Dependency Injection Approach

```
How should dependencies be provided?
│
├─ Is this a long-lived service?
│   └─ YES → Constructor injection (always)
│
├─ Is this a single operation?
│   └─ YES → Method parameter injection
│
├─ Is this a configuration value?
│   ├─ Constant → Constructor injection
│   └─ May change → Method parameter or Config object
│
└─ Is this optional functionality?
    └─ YES → Optional constructor parameter with default
```

---

## 9. Enforcement

### 9.1 Structural Validation

| Check                | Tool                 | Configuration                        |
| -------------------- | -------------------- | ------------------------------------ |
| Dependency direction | eslint-plugin-import | no-restricted-imports                |
| Layer boundaries     | Custom ESLint rule   | Define layer paths                   |
| No singletons        | ESLint               | no-restricted-syntax for getInstance |
| Async constructors   | TypeScript           | Compile-time check                   |

### 9.2 Architecture Review Checklist

- [ ] Component follows single responsibility principle
- [ ] Dependencies flow in correct direction (downward only)
- [ ] No circular dependencies between modules
- [ ] Correct role suffix used for component type
- [ ] All dependencies injected via constructor
- [ ] No singleton pattern used
- [ ] Async initialization uses static factory method
- [ ] No service locator pattern

### 9.3 Directory Structure Validation

```
Expected structure:
src/
├── commands/           # CLI command entry points (Presentation)
├── handlers/           # Request/event handlers (Orchestration)
├── services/           # Business logic services (Domain)
├── managers/           # State management (Domain)
├── validators/         # Data validation (Domain)
├── registries/         # Item registries (Infrastructure)
├── loaders/            # Resource loaders (Infrastructure)
├── clients/            # External system clients (Infrastructure)
├── utils/              # Utility functions (Infrastructure)
├── types/              # Type definitions
├── errors/             # Error classes
└── config/             # Configuration
```

---

## 10. Exceptions

### 10.1 Valid Exception Scenarios

| Scenario                    | Justification                     | Documentation Required |
| --------------------------- | --------------------------------- | ---------------------- |
| Third-party library pattern | Library mandates specific pattern | Link to library docs   |
| Performance-critical path   | Measured performance requirement  | Benchmark data         |
| Legacy migration            | Gradual migration in progress     | Migration ticket       |

### 10.2 Exception Documentation

```typescript
/**
 * ARCHITECTURE EXCEPTION: STD-005 Section 4.1
 * Reason: Third-party library requires singleton access pattern.
 * Trade-off: Reduced testability for this component.
 * Mitigation: Wrapper class provides injectable interface.
 * Reference: https://example.com/library-docs#singleton
 * Approved: 2025-01-15
 */
```

---

## 11. Quick Reference

### 11.1 Pattern Selection Matrix

| Need             | Pattern   | Suffix                   | Example                   |
| ---------------- | --------- | ------------------------ | ------------------------- |
| Business logic   | Service   | `*Service`               | `CompressionService`      |
| State management | Manager   | `*Manager`               | `SessionManager`          |
| Event handling   | Handler   | `*Handler`               | `CommandHandler`          |
| Item collection  | Registry  | `*Registry`              | `HookRegistry`            |
| Resource loading | Loader    | `*Loader`                | `ConfigLoader`            |
| External API     | Client    | `*Client`                | `LlmClient`               |
| Object creation  | Factory   | `*Factory` / `.create()` | `CommandService.create()` |
| Data validation  | Validator | `*Validator`             | `SchemaValidator`         |

### 11.2 Layer Quick Reference

| Layer          | Purpose               | Allowed Dependencies   |
| -------------- | --------------------- | ---------------------- |
| Presentation   | User interaction      | Orchestration, Domain  |
| Orchestration  | Workflow coordination | Domain, Infrastructure |
| Domain         | Business logic        | Infrastructure         |
| Infrastructure | External systems      | None (internal)        |

### 11.3 Dependency Injection Rules

```
ALWAYS: Constructor injection for dependencies
NEVER:  Singleton pattern, service locator
ASYNC:  Use static factory method
OPTIONAL: Constructor param with default or undefined
```

### 11.4 File Organization

```
[role]/                    # Directory per role type
├── [name][Role].ts        # Implementation file
├── [name][Role].test.ts   # Test file (co-located)
└── index.ts               # Barrel export
```

---

## 12. Traceability

### 12.1 Pattern Index

| Pattern ID | Name     | Section | Layer          |
| ---------- | -------- | ------- | -------------- |
| PAT-001    | Service  | 4.1     | Domain         |
| PAT-002    | Manager  | 4.2     | Domain         |
| PAT-003    | Handler  | 4.3     | Orchestration  |
| PAT-004    | Registry | 4.4     | Infrastructure |
| PAT-005    | Loader   | 4.5     | Infrastructure |
| PAT-006    | Client   | 4.6     | Infrastructure |
| PAT-007    | Factory  | 4.7     | Any            |

### 12.2 Related Standards

| Standard                    | Relationship                              |
| --------------------------- | ----------------------------------------- |
| STD-001 Naming Conventions  | Defines naming for roles and suffixes     |
| STD-002 Directory Structure | Defines file organization by layer        |
| STD-006 Error Handling      | Defines error patterns used in all layers |
| STD-007 Testing Standards   | Defines how to test each pattern          |

---

## 13. Open Questions

| Question ID | Question                                                               | Status           |
| ----------- | ---------------------------------------------------------------------- | ---------------- |
| AQ-001      | Should we enforce layer boundaries with ESLint or rely on code review? | Resolved: Both   |
| AQ-002      | Should Validators be in Domain or Infrastructure layer?                | Resolved: Domain |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
