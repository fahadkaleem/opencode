# Task Manager - Interface Contract

> **Component ID**: COMP-002
> **Document Version**: 1.3
> **Last Updated**: 2025-12-27
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Component Requirements](../../requirements/06-tasks.md)
> - [Error Types Schema](../schemas/00-error-types.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for the **Task Manager**, specifying the unified task operations, provider abstraction, caching, and authentication it provides to other components.

### 1.2 Component Summary

| Attribute                    | Value                                                                  |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Component ID**             | COMP-002                                                               |
| **Directory**                | `packages/core/src/tasks/`                                             |
| **Main Class**               | `TaskClient`                                                           |
| **Responsibility**           | Unified task operations, provider abstraction, caching, authentication |
| **Provides Interfaces To**   | COMP-005 (Orchestrator), COMP-006 (API), COMP-007 (User Interface)     |
| **Requires Interfaces From** | COMP-001 (Configuration Manager)                                       |

### 1.3 Contract ID Convention

Operations follow the format: **TM-OP-XXX**

### 1.4 Key Design Pattern

**Provider Abstraction with Discriminated Task Types**

The Task Manager implements a provider abstraction pattern using TypeScript discriminated unions. All tasks share a common `source` field that enables compile-time type checking and runtime type narrowing for provider-specific data.

Key characteristics:

- **Discriminated Unions**: Tasks are discriminated by `source` field, enabling type-safe access to provider-specific extensions
- **Provider Registry**: Providers register by source type; active provider determined by user authentication
- **Explicit Provider Selection**: Users authenticate with a provider (Linear, Jira, etc.); system tracks the active provider
- **Network-First with Cache Fallback**: Always attempt fresh fetch; fall back to cache on network failure
- **Tiered TTL Caching**: Static metadata (projects, teams) cached longer (1 hour); dynamic data cached shorter (15 min)
- **Capabilities System**: Each provider declares supported features via `ProviderCapabilities`

```typescript
// Pattern: Provider registration and explicit provider selection
class TaskClient {
  private providers = new Map<TaskSource, TaskProvider>();
  private activeSource: TaskSource | null = null;

  registerProvider(provider: TaskProvider): void {
    if (this.providers.has(provider.source)) {
      throw new AlreadyExistsError('Provider already registered');
    }
    this.providers.set(provider.source, provider);
  }

  // Get provider by explicit source type
  getProvider(source: TaskSource): TaskProvider | null {
    return this.providers.get(source) ?? null;
  }

  // Get the provider user is currently authenticated with
  getActiveProvider(): TaskProvider | null {
    if (!this.activeSource) return null;
    return this.providers.get(this.activeSource) ?? null;
  }

  // Set active provider after user authenticates
  setActiveProvider(source: TaskSource): void {
    if (!this.providers.has(source)) {
      throw new NotFoundError(`Provider ${source} not registered`);
    }
    this.activeSource = source;
  }

  async getTask(taskId: string, options?: GetTaskOptions): Promise<TaskResult> {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new UnauthenticatedError('No provider authenticated. Please log in first.');
    }

    // Check cache first (unless forceRefresh)
    if (!options?.forceRefresh) {
      const cached = this.cache.get(taskId);
      if (cached && !this.isStale(cached)) {
        return { task: cached.task, isCached: true, cachedAt: cached.cachedAt };
      }
    }

    // Fetch from provider
    const task = await provider.getTask(taskId);
    this.cache.set(taskId, { task, cachedAt: new Date().toISOString() });
    return { task, isCached: false };
  }
}
```

**Design Decision: No Auto-Detection**

The original design included `detectProvider(taskId)` using regex patterns to guess which provider owned a task ID. This was **removed** because:

1. Task ID formats overlap (Linear "ENG-123" vs Jira "PROJ-123")
2. Users explicitly authenticate with a provider in the app
3. The system already knows which provider is active after login

Instead, provider selection is explicit via user authentication.

```typescript
// Pattern: Discriminated union for provider-specific task data
function renderTaskDetails(task: Task): void {
  // Common fields always available
  console.log(`${task.summary} (${task.status})`);

  // Type-safe access to provider-specific data via discriminated union
  switch (task.source) {
    case TaskSource.LINEAR:
      // TypeScript knows task.linear exists here
      console.log(`Cycle: ${task.linear?.cycle?.number}`);
      console.log(`Estimate: ${task.linear?.estimate} points`);
      break;
    case TaskSource.JIRA:
      // TypeScript knows task.jira exists here
      console.log(`Sprint: ${task.jira?.sprint?.name}`);
      console.log(`Story Points: ${task.jira?.storyPoints}`);
      break;
    case TaskSource.GITHUB:
      // TypeScript knows task.github exists here
      console.log(`Labels: ${task.github?.labels.map((l) => l.name).join(', ')}`);
      break;
    case TaskSource.LOCAL:
      // TypeScript knows task.local exists here
      console.log(`Tags: ${task.local?.tags.join(', ')}`);
      break;
  }
}
```

### 1.5 Three-Layer State Model (FR-TM-015)

The Task Manager implements a three-layer state model that separates concerns for better debuggability and offline support:

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: EXTERNAL SOURCE                     │
│  (Jira, Linear, GitHub - Source of Truth)                       │
│  - Lives in external system                                     │
│  - Accessed via provider APIs                                   │
│  - Task Manager syncs FROM this layer                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ fetch / sync
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: LOCAL CACHE                         │
│  (.flowmaster/tasks/{id}/task.json)                             │
│  - JSON snapshot of external task                               │
│  - Enables offline access                                       │
│  - TTL-based staleness (configurable)                           │
│  - Managed by TaskCache interface (TM-OP-012 to TM-OP-015c)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ read by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: EXECUTION CHECKPOINT                │
│  (.flowmaster/tasks/{id}/state.json - managed by State Manager) │
│  - Workflow execution state                                     │
│  - Phase outputs and progress                                   │
│  - Separate from task cache                                     │
│  - Managed by COMP-003 State Manager, NOT Task Manager          │
└─────────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities**:

| Layer                | Owner           | Purpose                           | Persistence                         |
| -------------------- | --------------- | --------------------------------- | ----------------------------------- |
| External Source      | External System | Source of truth for task data     | External                            |
| Local Cache          | Task Manager    | Offline access, performance       | `.flowmaster/tasks/{id}/task.json`  |
| Execution Checkpoint | State Manager   | Workflow progress, crash recovery | `.flowmaster/tasks/{id}/state.json` |

**Key Invariant**: Task Manager owns Layers 1-2. State Manager owns Layer 3. They share the task folder but manage different files.

---

## 2. Provided Interfaces

### 2.1 Interface: TaskOperations

**Purpose**: Core CRUD operations on tasks. Fully abstracted from task source.

**Consumers**: COMP-005 (Orchestrator), COMP-006 (API), COMP-007 (User Interface)

---

#### TM-OP-001: getTask

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Operation ID** | TM-OP-001                       |
| **Type**         | Asynchronous                    |
| **Implements**   | FR-TM-001, FR-TM-006, FR-TM-013 |

**Signature**:

```typescript
getTask(taskId: string, options?: GetTaskOptions): Promise<TaskResult>
```

**Purpose**: Retrieve task details by ID. Returns cached data if available, otherwise fetches from source and caches.

**Request Schema**:

| Field                  | Type      | Required | Constraints    | Description                                   |
| ---------------------- | --------- | -------- | -------------- | --------------------------------------------- |
| `taskId`               | `string`  | Yes      | Non-empty      | Task identifier (e.g., "PROJ-123", "LIN-abc") |
| `options.forceRefresh` | `boolean` | No       | Default: false | Bypass cache and fetch from source            |

**Preconditions**:

- Task Manager is initialized
- Provider for task ID format is registered (or task is local)

**Postconditions**:

- Task returned with standard fields (id, summary, description, status, assignee, url)
- If fetched from source, task is cached locally at `.flowmaster/tasks/{id}/task.json`
- Cache includes fetch timestamp

**Error Conditions**:

| Error Code        | Condition                          | Caller Action                 |
| ----------------- | ---------------------------------- | ----------------------------- |
| `NOT_FOUND`       | Task does not exist in provider    | Verify task ID                |
| `UNAUTHENTICATED` | Not authenticated with provider    | Call authenticate() first     |
| `UNAVAILABLE`     | Provider API unavailable, no cache | Retry later                   |
| `NOT_FOUND`       | No provider matches task ID format | Register provider or check ID |

**Example**:

```typescript
// Fetch task with cache
const result = await taskClient.getTask('PROJ-123');
console.log(`Task: ${result.task.summary} (cached: ${result.isCached})`);

// Force refresh from source
const fresh = await taskClient.getTask('PROJ-123', { forceRefresh: true });
```

---

#### TM-OP-002: createTask

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TM-OP-002            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TM-001, FR-TM-007 |

**Signature**:

```typescript
createTask(input: CreateTaskInput): Promise<CreateTaskResult>
```

**Purpose**: Create a new task in the specified provider.

**Request Schema**:

| Field         | Type         | Required | Constraints         | Description                    |
| ------------- | ------------ | -------- | ------------------- | ------------------------------ |
| `summary`     | `string`     | Yes      | 1-255 chars         | Task title                     |
| `description` | `string`     | No       | Max 65535 chars     | Task description (markdown)    |
| `project`     | `string`     | Yes      | Valid project ID    | Project/team to create task in |
| `priority`    | `Priority`   | No       | Valid priority      | Task priority                  |
| `assignee`    | `string`     | No       | User ID or email    | User to assign                 |
| `provider`    | `TaskSource` | No       | Default: configured | Provider to create task in     |

**Preconditions**:

- Authenticated with target provider
- Project exists in provider
- User has permission to create tasks

**Postconditions**:

- Task created in external system
- Task cached locally
- `TaskEventType.TASK_CREATED` event published
- Task ID returned in provider's format

**Error Conditions**:

| Error Code          | Condition                       | Caller Action                            |
| ------------------- | ------------------------------- | ---------------------------------------- |
| `UNAUTHENTICATED`   | Not authenticated with provider | Authenticate first                       |
| `NOT_FOUND`         | Project not found               | Use getProjects() to find valid projects |
| `INVALID_ARGUMENT`  | Invalid field value             | Check field constraints                  |
| `PERMISSION_DENIED` | No permission to create         | Contact project admin                    |

---

#### TM-OP-003: updateTask

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TM-OP-003            |
| **Type**         | Asynchronous         |
| **Implements**   | FR-TM-001, FR-TM-008 |

**Signature**:

```typescript
updateTask(taskId: string, fields: Partial<TaskFields>): Promise<TaskResult>
```

**Purpose**: Update task fields in external system.

**Request Schema**:

| Field                | Type       | Required | Constraints     | Description     |
| -------------------- | ---------- | -------- | --------------- | --------------- |
| `taskId`             | `string`   | Yes      | Non-empty       | Task identifier |
| `fields.summary`     | `string`   | No       | 1-255 chars     | New title       |
| `fields.description` | `string`   | No       | Max 65535 chars | New description |
| `fields.priority`    | `Priority` | No       | Valid priority  | New priority    |

**Preconditions**:

- Task exists
- Authenticated with provider
- User has permission to update

**Postconditions**:

- Task updated in external system
- Local cache updated
- `TaskEventType.TASK_UPDATED` event published

**Error Conditions**:

| Error Code          | Condition               | Caller Action           |
| ------------------- | ----------------------- | ----------------------- |
| `NOT_FOUND`         | Task not found          | Verify task ID          |
| `UNAUTHENTICATED`   | Not authenticated       | Authenticate first      |
| `INVALID_ARGUMENT`  | Invalid field value     | Check field constraints |
| `PERMISSION_DENIED` | No permission to update | Contact task owner      |

---

#### TM-OP-004: searchTasks

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-004    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-009    |

**Signature**:

```typescript
searchTasks(criteria: SearchCriteria): Promise<SearchResult>
```

**Purpose**: Search tasks by criteria.

**Request Schema**:

| Field      | Type               | Required | Constraints             | Description                       |
| ---------- | ------------------ | -------- | ----------------------- | --------------------------------- |
| `provider` | `TaskSource`       | No       | Valid source            | Provider to search (default: all) |
| `project`  | `string`           | No       | Valid project ID        | Filter by project                 |
| `assignee` | `string`           | No       | User ID, email, or "me" | Filter by assignee                |
| `status`   | `NormalizedStatus` | No       | Valid status            | Filter by status                  |
| `query`    | `string`           | No       | Provider-specific       | Raw query (JQL for Jira)          |
| `limit`    | `number`           | No       | 1-100, default 50       | Max results                       |

**Preconditions**:

- Authenticated with provider(s)

**Postconditions**:

- Matching tasks returned
- Results not automatically cached (search results are transient)

**Error Conditions**:

| Error Code         | Condition            | Caller Action      |
| ------------------ | -------------------- | ------------------ |
| `UNAUTHENTICATED`  | Not authenticated    | Authenticate first |
| `INVALID_ARGUMENT` | Invalid query syntax | Fix query          |

---

### 2.2 Interface: TaskWorkflow

**Purpose**: Task state transitions, comments, and assignments.

**Consumers**: COMP-005 (Orchestrator), COMP-007 (User Interface)

---

#### TM-OP-005: getTransitions

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-005    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-012    |

**Signature**:

```typescript
getTransitions(taskId: string): Promise<TransitionsResult>
```

**Purpose**: Get available state transitions for a task.

**Preconditions**:

- Task exists
- Authenticated with provider

**Postconditions**:

- Available transitions returned based on current state and workflow rules

**Error Conditions**:

| Error Code        | Condition         | Caller Action      |
| ----------------- | ----------------- | ------------------ |
| `NOT_FOUND`       | Task not found    | Verify task ID     |
| `UNAUTHENTICATED` | Not authenticated | Authenticate first |

---

#### TM-OP-006: transitionTask

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-006    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-012    |

**Signature**:

```typescript
transitionTask(taskId: string, toState: string): Promise<TransitionResult>
```

**Purpose**: Transition task to a new state.

**Preconditions**:

- Task exists
- Transition is valid from current state
- User has permission to transition

**Postconditions**:

- Task state updated in external system
- Local cache updated
- `TaskEventType.TASK_TRANSITIONED` event published

**Error Conditions**:

| Error Code            | Condition                   | Caller Action         |
| --------------------- | --------------------------- | --------------------- |
| `NOT_FOUND`           | Task not found              | Verify task ID        |
| `FAILED_PRECONDITION` | Invalid workflow transition | Use getTransitions()  |
| `PERMISSION_DENIED`   | No permission to transition | Contact project admin |

---

#### TM-OP-007: addComment

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-007    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-010    |

**Signature**:

```typescript
addComment(taskId: string, body: string): Promise<Comment>
```

**Purpose**: Add a comment to a task.

**Preconditions**:

- Task exists
- Authenticated with provider
- User has permission to comment

**Postconditions**:

- Comment added to task in external system
- `TaskEventType.COMMENT_ADDED` event published

**Error Conditions**:

| Error Code          | Condition                | Caller Action         |
| ------------------- | ------------------------ | --------------------- |
| `NOT_FOUND`         | Task not found           | Verify task ID        |
| `UNAUTHENTICATED`   | Not authenticated        | Authenticate first    |
| `PERMISSION_DENIED` | No permission to comment | Contact project admin |

---

#### TM-OP-008: assignTask

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-008    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-011    |

**Signature**:

```typescript
assignTask(taskId: string, assignee: string): Promise<TaskResult>
```

**Purpose**: Assign a task to a user.

**Preconditions**:

- Task exists
- User exists in the provider
- Authenticated with provider

**Postconditions**:

- Task assignee updated in external system
- Local cache updated
- `TaskEventType.TASK_ASSIGNED` event published

**Error Conditions**:

| Error Code        | Condition         | Caller Action      |
| ----------------- | ----------------- | ------------------ |
| `NOT_FOUND`       | Task not found    | Verify task ID     |
| `NOT_FOUND`       | User not found    | Use lookupUser()   |
| `UNAUTHENTICATED` | Not authenticated | Authenticate first |

---

### 2.3 Interface: ProviderRegistry

**Purpose**: Register and manage task providers.

**Consumers**: Internal (Task Manager initialization)

---

#### TM-OP-009: registerProvider

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-009   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
registerProvider(provider: TaskProvider): void
```

**Purpose**: Register a task provider (Linear, Jira, GitHub, Local).

**Preconditions**:

- Provider source is unique (not already registered)
- Provider implements `TaskProvider` interface

**Postconditions**:

- Provider registered and available for use
- Provider available via `getProvider(source)`

**Error Conditions**:

| Error Code       | Condition                          | Caller Action        |
| ---------------- | ---------------------------------- | -------------------- |
| `ALREADY_EXISTS` | Provider source already registered | Use different source |

---

#### TM-OP-010: getProvider

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-010   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
getProvider(source: TaskSource): TaskProvider | null
```

**Purpose**: Get a registered provider by its source type.

**Postconditions**:

- Returns provider if registered for that source
- Returns null if no provider registered for that source

---

#### TM-OP-010a: getActiveProvider

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-010a  |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
getActiveProvider(): TaskProvider | null
```

**Purpose**: Get the provider the user is currently authenticated with.

**Postconditions**:

- Returns the active provider if user has authenticated with one
- Returns null if no provider is active (user not logged in)

---

#### TM-OP-010b: setActiveProvider

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-010b  |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
setActiveProvider(source: TaskSource): void
```

**Purpose**: Set the active provider after user authenticates. Called after successful OAuth flow.

**Preconditions**:

- Provider for source is registered

**Postconditions**:

- Active provider set to specified source
- Subsequent task operations use this provider

**Error Conditions**:

| Error Code  | Condition               | Caller Action           |
| ----------- | ----------------------- | ----------------------- |
| `NOT_FOUND` | Provider not registered | Register provider first |

---

#### TM-OP-011: listProviders

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-011   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
listProviders(): ProviderInfo[]
```

**Purpose**: List all registered providers with their authentication status.

---

### 2.4 Interface: TaskCache

**Purpose**: Manage local task cache.

**Consumers**: Internal (Task Manager)

---

#### TM-OP-012: getCachedTask

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Operation ID** | TM-OP-012            |
| **Type**         | Synchronous          |
| **Implements**   | FR-TM-013, FR-TM-016 |

**Signature**:

```typescript
getCachedTask(taskId: string): CachedTask | null
```

**Purpose**: Get task from local cache without fetching from source.

**Postconditions**:

- Returns cached task if exists, null otherwise
- Does not fetch from source

---

#### TM-OP-013: invalidateCache

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-013   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-014   |

**Signature**:

```typescript
invalidateCache(taskId: string): void
```

**Purpose**: Invalidate cached task, forcing next fetch to go to source.

**Postconditions**:

- Cache entry removed
- Next getTask() will fetch from source
- Idempotent: invalidating non-cached task succeeds

---

#### TM-OP-014: refreshCache

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-014    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-014    |

**Signature**:

```typescript
refreshCache(taskId: string): Promise<Task>
```

**Purpose**: Force refresh task from source and update cache.

**Preconditions**:

- Provider for task is registered
- Authenticated with provider

**Postconditions**:

- Task fetched from source
- Cache updated with fresh data

**Error Conditions**:

| Error Code        | Condition            | Caller Action      |
| ----------------- | -------------------- | ------------------ |
| `NOT_FOUND`       | Task not found       | Verify task ID     |
| `UNAUTHENTICATED` | Not authenticated    | Authenticate first |
| `UNAVAILABLE`     | Provider unavailable | Retry later        |

---

#### TM-OP-015a: listCachedTasks

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-015a  |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-013   |

**Signature**:

```typescript
listCachedTasks(options?: ListCachedOptions): CachedTaskSummary[]
```

**Purpose**: List all locally cached tasks for offline discovery.

**Request Schema**:

| Field                  | Type         | Required | Constraints    | Description                   |
| ---------------------- | ------------ | -------- | -------------- | ----------------------------- |
| `options.source`       | `TaskSource` | No       | Valid source   | Filter by provider            |
| `options.includeStale` | `boolean`    | No       | Default: false | Include expired cache entries |

**Postconditions**:

- Returns summary of all cached tasks (id, summary, source, cachedAt, isStale)
- Does not fetch from source
- Enables offline task discovery

---

#### TM-OP-015b: getCacheTTL

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-015b  |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-014   |

**Signature**:

```typescript
getCacheTTL(): CacheTTLConfig
```

**Purpose**: Get current cache TTL configuration.

**Postconditions**:

- Returns current TTL settings for task cache and metadata cache

---

#### TM-OP-015c: setCacheTTL

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-015c  |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-014   |

**Signature**:

```typescript
setCacheTTL(config: Partial<CacheTTLConfig>): void
```

**Purpose**: Configure cache TTL settings.

**Request Schema**:

| Field                | Type     | Required | Constraints | Description                                             |
| -------------------- | -------- | -------- | ----------- | ------------------------------------------------------- |
| `config.taskTTL`     | `number` | No       | > 0, in ms  | TTL for task data (default: 15 min)                     |
| `config.metadataTTL` | `number` | No       | > 0, in ms  | TTL for metadata like projects, users (default: 1 hour) |

**Postconditions**:

- Cache TTL updated
- Existing cache entries not affected (TTL applied on next access)

---

### 2.5 Interface: TaskAuth

**Purpose**: Authentication with task providers.

**Consumers**: COMP-006 (API), COMP-007 (User Interface)

---

#### TM-OP-015: isAuthenticated

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-015    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-003    |

**Signature**:

```typescript
isAuthenticated(source: TaskSource): Promise<AuthStatus>
```

**Purpose**: Check if authenticated with a provider.

---

#### TM-OP-016: authenticate

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-016    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-003    |

**Signature**:

```typescript
authenticate(source: TaskSource, options?: AuthOptions): Promise<AuthResult>
```

**Purpose**: Authenticate with a provider via OAuth 2.0 with PKCE.

**Postconditions**:

- If interactive: browser opened for OAuth flow
- Tokens stored in `.flowmaster/auth/{source}.json`
- `TaskEventType.AUTH_SUCCESS` event published

**Error Conditions**:

| Error Code        | Condition               | Caller Action                 |
| ----------------- | ----------------------- | ----------------------------- |
| `NOT_FOUND`       | Provider not registered | Register provider first       |
| `CANCELLED`       | OAuth flow cancelled    | Retry or use different method |
| `UNAUTHENTICATED` | OAuth flow failed       | Check credentials, retry      |

---

#### TM-OP-017: clearAuth

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-017   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-003   |

**Signature**:

```typescript
clearAuth(source: TaskSource): void
```

**Purpose**: Clear stored credentials for a provider.

**Postconditions**:

- Stored tokens removed
- Idempotent: clearing non-existent auth succeeds

---

### 2.6 Interface: TaskMetadata

**Purpose**: Query provider metadata (projects, teams, users, statuses).

**Consumers**: COMP-005 (Orchestrator), COMP-007 (User Interface)

---

#### TM-OP-018: getProjects

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-018    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-003    |

**Signature**:

```typescript
getProjects(source?: TaskSource): Promise<Project[]>
```

**Purpose**: List available projects/teams for task creation.

---

#### TM-OP-019: getStatuses

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-019    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-012    |

**Signature**:

```typescript
getStatuses(teamId: string, source?: TaskSource): Promise<WorkflowStatus[]>
```

**Purpose**: List available workflow states for a team/project.

---

#### TM-OP-020: getCurrentUser

| Attribute        | Value        |
| ---------------- | ------------ |
| **Operation ID** | TM-OP-020    |
| **Type**         | Asynchronous |
| **Implements**   | FR-TM-011    |

**Signature**:

```typescript
getCurrentUser(source?: TaskSource): Promise<User>
```

**Purpose**: Get the currently authenticated user (for "me" resolution).

---

### 2.7 Interface: LocalTasks

**Purpose**: Local-only task operations without external connectivity.

**Consumers**: All components (fallback when offline)

---

#### TM-OP-021: createLocalTask

| Attribute        | Value       |
| ---------------- | ----------- |
| **Operation ID** | TM-OP-021   |
| **Type**         | Synchronous |
| **Implements**   | FR-TM-002   |

**Signature**:

```typescript
createLocalTask(input: LocalTaskInput): Task
```

**Purpose**: Create a local-only task without external system connectivity.

**Postconditions**:

- Task created with unique local ID (format: `local-{uuid}`)
- Task persisted to `.flowmaster/tasks/local-{uuid}/task.json`
- No external API calls made

---

## 3. Required Interfaces

### 3.1 Dependencies on COMP-001 (Configuration Manager)

| Operation             | Purpose                           | When Called      |
| --------------------- | --------------------------------- | ---------------- |
| `get()`               | Get cache TTL, default provider   | On operation     |
| `getProviderConfig()` | Get provider API URLs, client IDs | On provider init |

**Assumptions**:

- Configuration is available synchronously
- Provider configs contain API URLs, OAuth client IDs

**Failure Handling**:

- If config unavailable: Use hardcoded defaults
- If provider config missing: Provider registration fails

---

## 4. Component Interaction Patterns

This section documents how other components interact with Task Manager.

### 4.1 Orchestrator → Task Manager (Context Building and Workflow Operations)

The Orchestrator uses Task Manager for both context building and task lifecycle management:

```typescript
// Pattern: Orchestrator builds context and manages task lifecycle
class WorkflowEngine {
  constructor(private taskClient: TaskClient) {}

  // Context building for agent steps
  async buildTaskContext(taskId: string): Promise<TaskContext> {
    // Fetch task (uses cache if available)
    const { task } = await this.taskClient.getTask(taskId);

    // Return only unified core fields for agent context
    return {
      id: task.id,
      summary: task.summary,
      description: task.description,
      status: task.status,
      assignee: task.assignee?.name,
      url: task.url,
    };
  }

  // Workflow execution with task lifecycle management
  async executeWorkflow(definition: WorkflowDefinition, taskId: string): Promise<void> {
    // 1. Refresh task at workflow start
    await this.taskClient.getTask(taskId, { forceRefresh: true });

    // 2. Transition to "In Progress"
    await this.taskClient.transitionTask(taskId, 'in_progress');

    // 3. Execute steps...
    for (const step of definition.steps) {
      await this.executeStep(step, taskId);
    }

    // 4. Transition to "Done" on success
    await this.taskClient.transitionTask(taskId, 'done');

    // 5. Add completion comment
    await this.taskClient.addComment(
      taskId,
      `Workflow "${definition.name}" completed successfully.`
    );
  }
}
```

**Key Patterns**:

- Context building uses only unified core fields, never provider-specific extensions
- Orchestrator refreshes task at workflow start to ensure fresh data
- Task state transitions are managed throughout workflow lifecycle

### 4.2 User Interface → Task Manager (Task Display and Actions)

The UI uses Task Manager for displaying tasks and handling user actions:

```typescript
// Pattern: UI uses discriminated union for provider-specific display
class TaskDetailView {
  constructor(private taskClient: TaskClient) {}

  async render(taskId: string): Promise<void> {
    const { task } = await this.taskClient.getTask(taskId);

    // Render common fields
    this.renderHeader(task.summary, task.status);
    this.renderDescription(task.description);

    // Render provider-specific fields via discriminated union
    switch (task.source) {
      case TaskSource.LINEAR:
        this.renderLinearDetails(task.linear!);
        break;
      case TaskSource.JIRA:
        this.renderJiraDetails(task.jira!);
        break;
      case TaskSource.GITHUB:
        this.renderGitHubDetails(task.github!);
        break;
      case TaskSource.LOCAL:
        this.renderLocalDetails(task.local!);
        break;
    }
  }
}
```

**Key Pattern**: UI checks `source` field and uses provider-specific extensions for rich display.

### 4.3 API → Task Manager (Unified UI Access)

The API component routes task operations from the UI:

```typescript
// Pattern: API routes UI requests to Task Manager
class Api {
  constructor(private taskClient: TaskClient) {}

  // Route: getTask
  async getTask(taskId: string, refresh?: boolean): Promise<TaskResult> {
    return this.taskClient.getTask(taskId, { forceRefresh: refresh });
  }

  // Route: transitionTask
  async transitionTask(taskId: string, toState: string): Promise<TransitionResult> {
    return this.taskClient.transitionTask(taskId, toState);
  }

  // Route: addComment
  async addComment(taskId: string, body: string): Promise<Comment> {
    return this.taskClient.addComment(taskId, body);
  }

  // Route: searchTasks
  async searchTasks(criteria: SearchCriteria): Promise<SearchResult> {
    return this.taskClient.searchTasks(criteria);
  }
}
```

**Key Pattern**: API provides unified entry point for all UI task operations.

### 4.4 Orchestrator Cache Pre-warming

Orchestrator notifies Task Manager of workflow events for cache pre-warming:

```typescript
// Pattern: Pre-fetch task on workflow start via direct callback
class WorkflowEngine {
  constructor(private taskClient: TaskClient) {}

  async start(taskId: string): Promise<void> {
    // Pre-fetch and cache task when workflow starts
    await this.taskClient.getTask(taskId, { forceRefresh: true });

    // Continue with workflow execution...
  }
}
```

**Key Pattern**: Orchestrator calls Task Manager directly at workflow lifecycle points.

### 4.5 Interaction Summary

| Component      | Interaction Pattern               | Operations Used                            |
| -------------- | --------------------------------- | ------------------------------------------ |
| Orchestrator   | Task context + lifecycle mgmt     | TM-OP-001, TM-OP-006, TM-OP-007            |
| API            | Route UI requests to Task Manager | All TaskOperations                         |
| User Interface | Display and user actions          | TM-OP-001, TM-OP-004, TM-OP-006, TM-OP-008 |
| Configuration  | Provider settings                 | Get provider configs                       |

---

## 5. Type Definitions

### 5.1 Task Source Enum

```typescript
/**
 * Identifies which external system owns a task.
 * Used as discriminator for type-safe access to provider-specific data.
 */
export enum TaskSource {
  LINEAR = 'linear',
  JIRA = 'jira',
  GITHUB = 'github',
  LOCAL = 'local',
}
```

### 5.2 Normalized Status

```typescript
/**
 * Normalized status across all providers.
 * Maps provider-specific statuses to common categories.
 */
export enum NormalizedStatus {
  BACKLOG = 'backlog', // Not yet planned
  TODO = 'todo', // Planned, not started
  IN_PROGRESS = 'in_progress', // Work in progress
  DONE = 'done', // Completed
  CANCELED = 'canceled', // Canceled/won't do
}
```

### 5.3 Priority

```typescript
/**
 * Task priority levels.
 */
export enum Priority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}
```

### 5.4 Core Types

```typescript
/**
 * User representation across providers.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

/**
 * Comment on a task.
 */
export interface Comment {
  id: string;
  body: string;
  author: User;
  createdAt: string; // ISO 8601
}

/**
 * Available state transition.
 */
export interface Transition {
  id: string;
  name: string;
  toState: string;
}

/**
 * Project/team for task organization.
 */
export interface Project {
  id: string;
  name: string;
  key: string;
}

/**
 * Workflow status definition.
 */
export interface WorkflowStatus {
  id: string;
  name: string;
  category: NormalizedStatus;
  color: string;
}
```

### 5.5 Task Interface (Discriminated Union)

```typescript
/**
 * Base task fields shared by all providers.
 */
export interface TaskBase {
  id: string;
  summary: string;
  description?: string;
  status: NormalizedStatus;
  assignee?: User;
  url: string;
  updatedAt: string; // ISO 8601
}

/**
 * Linear-specific task data.
 */
export interface LinearTaskData {
  state: { id: string; name: string; color: string };
  team: { id: string; name: string; key: string };
  cycle?: { id: string; number: number; startsAt: string; endsAt: string };
  estimate?: number;
  priority: number;
  labels: Array<{ id: string; name: string; color: string }>;
}

/**
 * Jira-specific task data.
 */
export interface JiraTaskData {
  issueType: { id: string; name: string; iconUrl: string };
  project: { id: string; key: string; name: string };
  sprint?: { id: string; name: string; state: string };
  storyPoints?: number;
  epic?: { id: string; key: string; name: string };
  customFields: Record<string, unknown>;
}

/**
 * GitHub-specific task data.
 */
export interface GitHubTaskData {
  number: number;
  repository: { owner: string; name: string };
  labels: Array<{ name: string; color: string }>;
  milestone?: { number: number; title: string };
  assignees: User[];
  pullRequests: Array<{ number: number; state: string }>;
}

/**
 * Local-specific task data.
 */
export interface LocalTaskData {
  tags: string[];
  priority: Priority;
  dueDate?: string;
  createdAt: string;
}

/**
 * Discriminated union for task types.
 * Use `source` field to narrow to provider-specific type.
 */
export type Task =
  | (TaskBase & { source: TaskSource.LINEAR; linear: LinearTaskData })
  | (TaskBase & { source: TaskSource.JIRA; jira: JiraTaskData })
  | (TaskBase & { source: TaskSource.GITHUB; github: GitHubTaskData })
  | (TaskBase & { source: TaskSource.LOCAL; local: LocalTaskData });
```

### 5.6 Provider Interface

```typescript
/**
 * Capabilities that a provider may support.
 */
export interface ProviderCapabilities {
  canCreateTask: boolean;
  canDeleteTask: boolean;
  hasEstimates: boolean;
  hasSprints: boolean;
  hasLabels: boolean;
  hasSubtasks: boolean;
  hasDependencies: boolean;
  hasAttachments: boolean;
}

/**
 * Interface that all task providers must implement.
 */
export interface TaskProvider {
  /** Provider source identifier */
  readonly source: TaskSource;

  /** Display name */
  readonly name: string;

  /** Supported capabilities */
  readonly capabilities: ProviderCapabilities;
  // NOTE: taskIdPattern removed - provider determined by user authentication, not regex

  // Core operations
  getTask(taskId: string): Promise<Task>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(taskId: string, fields: Partial<TaskFields>): Promise<Task>;
  searchTasks(criteria: SearchCriteria): Promise<Task[]>;

  // Workflow operations
  getTransitions(taskId: string): Promise<Transition[]>;
  transitionTask(taskId: string, toState: string): Promise<Task>;
  addComment(taskId: string, body: string): Promise<Comment>;
  assignTask(taskId: string, assignee: string): Promise<Task>;

  // Auth operations
  isAuthenticated(): Promise<boolean>;
  authenticate(options?: AuthOptions): Promise<AuthResult>;
  clearAuth(): void;

  // Metadata operations
  getProjects(): Promise<Project[]>;
  getStatuses(teamId: string): Promise<WorkflowStatus[]>;
  getCurrentUser(): Promise<User>;
}
```

### 5.7 Operation Input/Output Types

```typescript
/**
 * Options for getTask operation.
 */
export interface GetTaskOptions {
  forceRefresh?: boolean;
}

/**
 * Result from getTask operation.
 */
export interface TaskResult {
  task: Task;
  isCached: boolean;
  cachedAt?: string;
}

/**
 * Input for createTask operation.
 */
export interface CreateTaskInput {
  summary: string;
  description?: string;
  project: string;
  priority?: Priority;
  assignee?: string;
  labels?: string[];
  provider?: TaskSource;
}

/**
 * Result from createTask operation.
 */
export interface CreateTaskResult {
  task: Task;
  taskId: string;
}

/**
 * Fields that can be updated on a task.
 */
export interface TaskFields {
  summary: string;
  description: string;
  priority: Priority;
  labels: string[];
}

/**
 * Criteria for searching tasks.
 */
export interface SearchCriteria {
  provider?: TaskSource;
  project?: string;
  assignee?: string;
  status?: NormalizedStatus;
  query?: string;
  limit?: number;
}

/**
 * Result from searchTasks operation.
 */
export interface SearchResult {
  tasks: Task[];
  total: number;
  hasMore: boolean;
}

/**
 * Result from getTransitions operation.
 */
export interface TransitionsResult {
  currentState: string;
  transitions: Transition[];
}

/**
 * Result from transitionTask operation.
 */
export interface TransitionResult {
  task: Task;
  previousState: string;
  newState: string;
}

/**
 * Cached task with metadata.
 */
export interface CachedTask {
  task: Task;
  cachedAt: string;
  isStale: boolean;
}

/**
 * Summary of cached task for listing (lightweight).
 */
export interface CachedTaskSummary {
  id: string;
  summary: string;
  source: TaskSource;
  cachedAt: string;
  isStale: boolean;
}

/**
 * Options for listing cached tasks.
 */
export interface ListCachedOptions {
  source?: TaskSource;
  includeStale?: boolean;
}

/**
 * Cache TTL configuration.
 */
export interface CacheTTLConfig {
  /** TTL for task data in milliseconds (default: 15 minutes) */
  taskTTL: number;
  /** TTL for metadata (projects, users) in milliseconds (default: 1 hour) */
  metadataTTL: number;
}

/**
 * Provider information for listing.
 */
export interface ProviderInfo {
  source: TaskSource;
  name: string;
  isAuthenticated: boolean;
  capabilities: ProviderCapabilities;
}

/**
 * Authentication status.
 */
export interface AuthStatus {
  isAuthenticated: boolean;
  expiresAt?: string;
  user?: User;
}

/**
 * Authentication options.
 */
export interface AuthOptions {
  interactive?: boolean;
}

/**
 * Authentication result.
 */
export interface AuthResult {
  success: boolean;
  user: User;
  expiresAt: string;
}

/**
 * Input for local task creation.
 */
export interface LocalTaskInput {
  summary: string;
  description?: string;
  priority?: Priority;
  tags?: string[];
  dueDate?: string;
}
```

### 5.8 Task Event Types

```typescript
/**
 * Event types published by Task Manager.
 */
export enum TaskEventType {
  TASK_FETCHED = 'task-fetched',
  TASK_CREATED = 'task-created',
  TASK_UPDATED = 'task-updated',
  TASK_TRANSITIONED = 'task-transitioned',
  TASK_ASSIGNED = 'task-assigned',
  COMMENT_ADDED = 'comment-added',
  CACHE_HIT = 'cache-hit',
  CACHE_MISS = 'cache-miss',
  AUTH_SUCCESS = 'auth-success',
  AUTH_EXPIRED = 'auth-expired',
}

/**
 * Task fetched event payload.
 */
export interface TaskFetchedEvent {
  type: TaskEventType.TASK_FETCHED;
  taskId: string;
  source: TaskSource;
  isCached: boolean;
}

/**
 * Task created event payload.
 */
export interface TaskCreatedEvent {
  type: TaskEventType.TASK_CREATED;
  taskId: string;
  source: TaskSource;
  summary: string;
}

/**
 * Task transitioned event payload.
 */
export interface TaskTransitionedEvent {
  type: TaskEventType.TASK_TRANSITIONED;
  taskId: string;
  fromState: string;
  toState: string;
}

/**
 * Discriminated union of all task events.
 */
export type TaskEvent = TaskFetchedEvent | TaskCreatedEvent | TaskTransitionedEvent;
```

---

## 6. Events Emitted (via Direct Callbacks)

Task Manager emits events via direct callback registration (`taskClient.on(event, callback)`). Consumers register callbacks to receive notifications:

| Event Type          | When Emitted           | Payload                 | Typical Consumers           |
| ------------------- | ---------------------- | ----------------------- | --------------------------- |
| `TASK_FETCHED`      | After successful fetch | `TaskFetchedEvent`      | Telemetry                   |
| `TASK_CREATED`      | After task creation    | `TaskCreatedEvent`      | Telemetry, UI               |
| `TASK_UPDATED`      | After task update      | `{ taskId, fields[] }`  | Telemetry, UI               |
| `TASK_TRANSITIONED` | After state change     | `TaskTransitionedEvent` | Telemetry, UI, Orchestrator |
| `TASK_ASSIGNED`     | After assignment       | `{ taskId, assignee }`  | Telemetry, UI               |
| `COMMENT_ADDED`     | After comment added    | `{ taskId, commentId }` | Telemetry                   |
| `CACHE_HIT`         | When cache used        | `{ taskId, age }`       | Telemetry                   |
| `CACHE_MISS`        | When cache missed      | `{ taskId }`            | Telemetry                   |
| `AUTH_SUCCESS`      | After authentication   | `{ source, user }`      | UI                          |
| `AUTH_EXPIRED`      | When token expires     | `{ source }`            | UI                          |

**Event Registration Pattern**:

```typescript
const taskClient = new TaskClient(config);

// Register for task lifecycle events
taskClient.on('task:created', (event: TaskCreatedEvent) => {
  console.log(`Task ${event.taskId} created: ${event.summary}`);
});

taskClient.on('task:transitioned', (event: TaskTransitionedEvent) => {
  console.log(`Task ${event.taskId} moved from ${event.fromState} to ${event.toState}`);
});
```

---

## 7. Direct Callbacks Received

Task Manager does not use event subscription. Instead, other components call Task Manager methods directly:

| Caller       | Method Called                     | Purpose                                    |
| ------------ | --------------------------------- | ------------------------------------------ |
| Orchestrator | `getTask(taskId, {forceRefresh})` | Pre-fetch and cache task at workflow start |
| Orchestrator | `transitionTask(taskId, status)`  | Update task status during workflow         |
| API          | Various TaskOperations            | Route UI requests                          |

---

## 8. Invariants

| Invariant              | Description                                                 | Enforcement                          |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Cache Consistency      | Cache always reflects last known state from source          | Update cache on every fetch/mutation |
| Provider Isolation     | Provider failures don't affect other providers              | Try-catch per provider operation     |
| Auth Token Security    | Tokens never logged or exposed in errors                    | Sanitize all logs and error messages |
| Task Folder Structure  | Each task has dedicated folder at `.flowmaster/tasks/{id}/` | Create folder on first cache write   |
| Offline Capability     | Cached tasks available without network                      | Cache persists to disk               |
| Local Always Available | Local provider works without configuration                  | Register local provider by default   |

---

## 9. Performance Expectations

| Operation                  | Expected Latency | Notes                  |
| -------------------------- | ---------------- | ---------------------- |
| TM-OP-001 (getTask cached) | < 10ms           | Local file read        |
| TM-OP-001 (getTask fetch)  | < 2s             | Network dependent      |
| TM-OP-002 (createTask)     | < 2s             | Network dependent      |
| TM-OP-004 (searchTasks)    | < 3s             | Depends on result size |
| TM-OP-009-011 (Registry)   | < 1ms            | In-memory              |
| TM-OP-012-014 (Cache)      | < 10ms           | Local file operations  |
| TM-OP-016 (authenticate)   | 30-60s           | User interaction       |

---

## 10. Versioning and Compatibility

### 10.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 10.2 Provider Compatibility

| Provider      | Status  | Notes            |
| ------------- | ------- | ---------------- |
| Local         | MVP     | Always available |
| Linear        | Planned | V1 MVP           |
| Jira          | Future  | Post-MVP         |
| GitHub Issues | Future  | Post-MVP         |

---

## 11. Traceability

### 11.1 FR to Operation Mapping

| Functional Requirement                        | Operations                                                        |
| --------------------------------------------- | ----------------------------------------------------------------- |
| FR-TM-001 Unified Task Operations             | TM-OP-001, TM-OP-002, TM-OP-003, TM-OP-004                        |
| FR-TM-002 Local Task Support                  | TM-OP-021                                                         |
| FR-TM-003 Multiple Task Source Registration   | TM-OP-009, TM-OP-011, TM-OP-015, TM-OP-016, TM-OP-017, TM-OP-018  |
| FR-TM-004 Task Source Detection               | ~~TM-OP-010~~ **(DEPRECATED)** - See TM-OP-010a/b for replacement |
| FR-TM-005 GitHub Issues Integration           | TM-OP-009 (GitHub provider registration)                          |
| FR-TM-006 Task Retrieval from External System | TM-OP-001                                                         |
| FR-TM-007 Task Creation in External System    | TM-OP-002                                                         |
| FR-TM-008 Task Updates in External System     | TM-OP-003                                                         |
| FR-TM-009 Task Search in External System      | TM-OP-004                                                         |
| FR-TM-010 Task Comments                       | TM-OP-007                                                         |
| FR-TM-011 Task Assignment                     | TM-OP-008, TM-OP-020                                              |
| FR-TM-012 Task State Transitions              | TM-OP-005, TM-OP-006, TM-OP-019                                   |
| FR-TM-013 External Task Information Caching   | TM-OP-012, TM-OP-015a                                             |
| FR-TM-014 Cache Refresh                       | TM-OP-013, TM-OP-014, TM-OP-015b, TM-OP-015c                      |
| FR-TM-015 Three-Layer State Model             | Section 1.5 (Architecture diagram)                                |
| FR-TM-016 JSON Cache Format                   | TM-OP-012 (cache storage format)                                  |

### 11.2 Operation Index

| Operation ID | Name              | Interface        | Type  |
| ------------ | ----------------- | ---------------- | ----- |
| TM-OP-001    | getTask           | TaskOperations   | Async |
| TM-OP-002    | createTask        | TaskOperations   | Async |
| TM-OP-003    | updateTask        | TaskOperations   | Async |
| TM-OP-004    | searchTasks       | TaskOperations   | Async |
| TM-OP-005    | getTransitions    | TaskWorkflow     | Async |
| TM-OP-006    | transitionTask    | TaskWorkflow     | Async |
| TM-OP-007    | addComment        | TaskWorkflow     | Async |
| TM-OP-008    | assignTask        | TaskWorkflow     | Async |
| TM-OP-009    | registerProvider  | ProviderRegistry | Sync  |
| TM-OP-010    | getProvider       | ProviderRegistry | Sync  |
| TM-OP-010a   | getActiveProvider | ProviderRegistry | Sync  |
| TM-OP-010b   | setActiveProvider | ProviderRegistry | Sync  |
| TM-OP-011    | listProviders     | ProviderRegistry | Sync  |
| TM-OP-012    | getCachedTask     | TaskCache        | Sync  |
| TM-OP-013    | invalidateCache   | TaskCache        | Sync  |
| TM-OP-014    | refreshCache      | TaskCache        | Async |
| TM-OP-015a   | listCachedTasks   | TaskCache        | Sync  |
| TM-OP-015b   | getCacheTTL       | TaskCache        | Sync  |
| TM-OP-015c   | setCacheTTL       | TaskCache        | Sync  |
| TM-OP-015    | isAuthenticated   | TaskAuth         | Async |
| TM-OP-016    | authenticate      | TaskAuth         | Async |
| TM-OP-017    | clearAuth         | TaskAuth         | Sync  |
| TM-OP-018    | getProjects       | TaskMetadata     | Async |
| TM-OP-019    | getStatuses       | TaskMetadata     | Async |
| TM-OP-020    | getCurrentUser    | TaskMetadata     | Async |
| TM-OP-021    | createLocalTask   | LocalTasks       | Sync  |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                                                                     |
| ------- | ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-12-04 | Architecture Team | Initial version with 21 operations covering all 16 FRs                                                                                                                                                      |
| 1.1     | 2025-12-04 | Architecture Team | Added TM-OP-015a (listCachedTasks), TM-OP-015b (getCacheTTL), TM-OP-015c (setCacheTTL); Added Section 1.5 Three-Layer State Model diagram; Added CachedTaskSummary, ListCachedOptions, CacheTTLConfig types |
| 1.2     | 2025-12-26 | Architecture Team | Aligned with architecture: Changed COMP-006 to COMP-002; Updated component references (removed Message Bus, Context Manager, Gateway); Changed to direct callbacks pattern; Merged Orchestrator sections    |
| 1.3     | 2025-12-27 | Claude            | Replaced detectProvider with getProvider/getActiveProvider/setActiveProvider; Removed taskIdPattern from TaskProvider; Provider determined by user auth, not regex; Deprecated FR-TM-004                    |
