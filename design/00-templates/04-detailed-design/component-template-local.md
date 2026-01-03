# [Component Name] - Detailed Design

> **Component ID**: COMP-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Approved
> **Owner**: [Name]
> **Related Documents**:
>
> - [Architecture Document](link)
> - [Requirements Document](link)
> - [Interface Contract](link)

---

## 1. Overview

### 1.1 Purpose

This document provides the detailed design for [Component Name], enabling
implementation without ambiguity.

### 1.2 Component Summary

| Attribute            | Value                                                   |
| -------------------- | ------------------------------------------------------- |
| **Component ID**     | COMP-XXX                                                |
| **Responsibility**   | [From Architecture doc]                                 |
| **Layer**            | Infrastructure / Support / Orchestration / Presentation |
| **Technology Stack** | TypeScript, [other relevant tech]                       |
| **Implements**       | FR-XXX, FR-XXX, NFR-XXX                                 |
| **Dependencies**     | COMP-XXX, COMP-XXX                                      |
| **Dependents**       | COMP-XXX, COMP-XXX                                      |

### 1.3 Scope of This Document

This document covers:

- [ ] Interface specification (TypeScript interfaces)
- [ ] Data models and storage schemas
- [ ] Internal logic and algorithms
- [ ] State machines (if applicable)
- [ ] Concurrency and locking
- [ ] Error handling and recovery
- [ ] Test specifications

---

## 2. Interface Specification

<!--
PURPOSE: Define all interfaces this component exposes to other components.
Use TypeScript interface syntax for clarity.
-->

### 2.1 Interface Overview

| Interface              | Purpose                         | Consumers          |
| ---------------------- | ------------------------------- | ------------------ |
| `IComponentName`       | Primary interface for [purpose] | COMP-XXX, COMP-XXX |
| `IComponentNameEvents` | Event emissions                 | Message Manager    |

### 2.2 Primary Interface

**Purpose**: [What this interface provides]

**Implements**: FR-XXX

```typescript
interface IComponentName {
  /**
   * [Method description]
   * @param param1 - [Description]
   * @returns [Description]
   * @throws ComponentError - [When this error occurs]
   */
  methodName(param1: ParamType): Promise<ResultType>;

  /**
   * [Method description]
   */
  anotherMethod(options: MethodOptions): Promise<void>;
}

interface MethodOptions {
  /** [Description] */
  requiredField: string;
  /** [Description] (optional) */
  optionalField?: number;
}

interface ResultType {
  /** [Description] */
  id: string;
  /** [Description] */
  data: SomeData;
}
```

### 2.3 Method Specifications

#### `methodName(param1: ParamType): Promise<ResultType>`

**Purpose**: [What this method does]

**Implements**: FR-XXX

**Preconditions**:

- [Condition that must be true before calling]
- [Condition that must be true before calling]

**Postconditions**:

- [What will be true after successful execution]
- [What will be true after successful execution]

**Parameters**:

| Parameter | Type        | Required | Description   |
| --------- | ----------- | -------- | ------------- |
| `param1`  | `ParamType` | Yes      | [Description] |

**Returns**: `Promise<ResultType>`

| Field  | Type       | Description   |
| ------ | ---------- | ------------- |
| `id`   | `string`   | [Description] |
| `data` | `SomeData` | [Description] |

**Errors**:

| Error Type         | Condition               | Recovery           |
| ------------------ | ----------------------- | ------------------ |
| `ValidationError`  | Invalid param1          | Fix input, retry   |
| `NotFoundError`    | Resource doesn't exist  | Check ID           |
| `ConcurrencyError` | Lock acquisition failed | Retry with backoff |

**Example**:

```typescript
const result = await component.methodName({ id: 'abc-123' });
console.log(result.data);
```

---

#### `anotherMethod(options: MethodOptions): Promise<void>`

[Continue pattern for all methods...]

---

### 2.4 Event Emissions

**Purpose**: Events this component emits via Message Manager

| Event Type            | Payload                              | When Emitted                    |
| --------------------- | ------------------------------------ | ------------------------------- |
| `COMPONENT_STARTED`   | `{ id: string, timestamp: Date }`    | When component starts operation |
| `COMPONENT_COMPLETED` | `{ id: string, result: ResultType }` | When operation completes        |
| `COMPONENT_ERROR`     | `{ id: string, error: ErrorInfo }`   | When operation fails            |

**Event Payload Schemas**:

```typescript
interface ComponentStartedEvent {
  type: 'COMPONENT_STARTED';
  payload: {
    id: string;
    timestamp: Date;
  };
}

interface ComponentCompletedEvent {
  type: 'COMPONENT_COMPLETED';
  payload: {
    id: string;
    result: ResultType;
    duration: number;
  };
}
```

---

## 3. Data Model & Storage

<!--
PURPOSE: Define data structures and how they're persisted to the file system.
-->

### 3.1 Domain Entities

#### Entity: [EntityName]

**Purpose**: [What this entity represents]

```typescript
interface EntityName {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Human-readable name */
  name: string;

  /** Current status */
  status: EntityStatus;

  /** ISO 8601 timestamp */
  createdAt: string;

  /** ISO 8601 timestamp */
  updatedAt: string;

  /** Nested data */
  metadata: Record<string, unknown>;
}

type EntityStatus = 'pending' | 'active' | 'completed' | 'failed';
```

**Validation Rules**:

| Field       | Validation                                         |
| ----------- | -------------------------------------------------- |
| `id`        | Required, valid UUID v4                            |
| `name`      | Required, 1-100 characters, alphanumeric + hyphens |
| `status`    | Required, must be valid EntityStatus value         |
| `createdAt` | Required, valid ISO 8601 timestamp                 |

---

### 3.2 File Storage Schema

**Storage Location**: `.flowmaster/[subdirectory]/`

**Directory Structure**:

```
.flowmaster/
├── [component-data]/
│   ├── index.json              # Index/manifest file
│   ├── [entity-id]/
│   │   ├── state.json          # Entity state
│   │   ├── metadata.json       # Additional metadata
│   │   └── artifacts/          # Related artifacts
│   │       └── [artifact-files]
│   └── ...
└── locks/
    └── [component].lock        # Lock file for concurrent access
```

**File Schemas**:

#### `state.json`

```json
{
  "$schema": "State file for [EntityName]",
  "version": "1.0",
  "entity": {
    "id": "uuid-string",
    "name": "string",
    "status": "pending | active | completed | failed",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601",
    "metadata": {}
  }
}
```

#### `index.json`

```json
{
  "$schema": "Index of all [entities] managed by this component",
  "version": "1.0",
  "entries": [
    {
      "id": "uuid-string",
      "name": "string",
      "status": "string",
      "path": "relative/path/to/entity"
    }
  ],
  "lastUpdated": "ISO8601"
}
```

---

### 3.3 Data Transformations

| From            | To           | Function         | Notes                |
| --------------- | ------------ | ---------------- | -------------------- |
| `EntityName`    | JSON string  | `serialize()`    | For file persistence |
| JSON string     | `EntityName` | `deserialize()`  | With validation      |
| External format | `EntityName` | `fromExternal()` | When importing       |

---

## 4. Internal Logic

<!--
PURPOSE: Document algorithms, business rules, and decision logic.
Use TypeScript-like pseudocode for clarity.
-->

### 4.1 [Algorithm/Process Name]

**Purpose**: [What this logic accomplishes]

**Implements**: FR-XXX

**Preconditions**:

- [Condition that must be true before execution]

**Postconditions**:

- [What will be true after successful execution]

**Algorithm**:

```typescript
async function processOperation(input: InputType): Promise<ResultType> {
  // Step 1: Validate input
  const validated = validateInput(input);
  if (!validated.success) {
    throw new ValidationError(validated.errors);
  }

  // Step 2: Acquire lock for concurrent access
  const lock = await acquireLock(input.entityId, { timeout: 5000 });

  try {
    // Step 3: Load current state
    const currentState = await loadState(input.entityId);

    // Step 4: Apply business logic
    const newState = applyTransformation(currentState, input);

    // Step 5: Validate state transition
    if (!isValidTransition(currentState.status, newState.status)) {
      throw new InvalidStateTransitionError(currentState.status, newState.status);
    }

    // Step 6: Persist atomically
    await saveStateAtomically(input.entityId, newState);

    // Step 7: Emit event
    await messageManager.publish({
      type: 'OPERATION_COMPLETED',
      payload: { entityId: input.entityId, newState },
    });

    return { success: true, state: newState };
  } finally {
    // Always release lock
    await releaseLock(lock);
  }
}
```

**Edge Cases**:

| Scenario                      | Behavior                                      |
| ----------------------------- | --------------------------------------------- |
| Input is null/undefined       | Throw `ValidationError`                       |
| Entity doesn't exist          | Throw `NotFoundError`                         |
| Lock acquisition timeout      | Throw `ConcurrencyError`, caller should retry |
| State transition invalid      | Throw `InvalidStateTransitionError`           |
| File system error during save | Throw `PersistenceError`, state unchanged     |

---

### 4.2 State Machine: [Entity State]

**Purpose**: [What states this entity can be in and transitions between them]

**Implements**: FR-XXX

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │ start()
                           ▼
                    ┌─────────────┐
          cancel() │   ACTIVE    │ complete()
         ┌─────────┤             ├─────────┐
         │         └──────┬──────┘         │
         │                │ fail()         │
         ▼                ▼                ▼
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  CANCELLED  │  │   FAILED    │  │  COMPLETED  │
  └─────────────┘  └─────────────┘  └─────────────┘
```

**State Definitions**:

| State       | Description                   | Allowed Operations           |
| ----------- | ----------------------------- | ---------------------------- |
| `PENDING`   | Initial state, awaiting start | start(), cancel()            |
| `ACTIVE`    | Currently executing           | complete(), fail(), cancel() |
| `COMPLETED` | Successfully finished         | (terminal)                   |
| `FAILED`    | Execution failed              | retry() → PENDING            |
| `CANCELLED` | User cancelled                | (terminal)                   |

**Transitions**:

| From    | To        | Trigger      | Guard Conditions       | Actions                                |
| ------- | --------- | ------------ | ---------------------- | -------------------------------------- |
| PENDING | ACTIVE    | `start()`    | All dependencies ready | Initialize resources, emit START event |
| ACTIVE  | COMPLETED | `complete()` | Output valid           | Save results, emit COMPLETE event      |
| ACTIVE  | FAILED    | `fail()`     | -                      | Save error info, emit FAIL event       |
| ACTIVE  | CANCELLED | `cancel()`   | -                      | Cleanup resources, emit CANCEL event   |
| FAILED  | PENDING   | `retry()`    | Retry count < max      | Reset state, increment retry count     |

---

## 5. Concurrency & Locking

<!--
PURPOSE: Document how the component handles concurrent access.
-->

### 5.1 Locking Strategy

| Resource     | Lock Type           | Granularity    | Timeout    |
| ------------ | ------------------- | -------------- | ---------- |
| Entity state | Exclusive file lock | Per-entity     | 5 seconds  |
| Index file   | Exclusive file lock | Component-wide | 10 seconds |

### 5.2 Lock Implementation

**Lock File Location**: `.flowmaster/locks/[component]-[resource-id].lock`

**Lock File Contents**:

```json
{
  "pid": 12345,
  "acquiredAt": "ISO8601",
  "hostname": "machine-name"
}
```

**Lock Acquisition**:

```typescript
async function acquireLock(resourceId: string, options: LockOptions): Promise<Lock> {
  const lockPath = getLockPath(resourceId);
  const startTime = Date.now();

  while (Date.now() - startTime < options.timeout) {
    try {
      // Attempt to create lock file exclusively
      await fs.writeFile(
        lockPath,
        JSON.stringify({
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
          hostname: os.hostname(),
        }),
        { flag: 'wx' }
      ); // 'wx' = exclusive create, fail if exists

      return { path: lockPath, acquired: true };
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Lock exists, check if stale
        if (await isLockStale(lockPath)) {
          await fs.unlink(lockPath);
          continue;
        }
        // Wait and retry
        await sleep(100);
        continue;
      }
      throw err;
    }
  }

  throw new LockTimeoutError(resourceId, options.timeout);
}
```

### 5.3 Stale Lock Detection

A lock is considered stale if:

- Lock file is older than `STALE_LOCK_THRESHOLD` (default: 5 minutes)
- Process ID in lock file no longer exists
- Hostname doesn't match and file is older than threshold

### 5.4 Deadlock Prevention

- Always acquire locks in consistent order (by resource ID alphabetically)
- Use timeouts on all lock acquisitions
- Release locks in finally blocks to ensure cleanup

---

## 6. Error Handling & Recovery

<!--
PURPOSE: Document error types, handling strategies, and recovery procedures.
-->

### 6.1 Error Types

```typescript
// Base error for this component
class ComponentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ComponentError';
  }
}

// Specific error types
class ValidationError extends ComponentError {
  constructor(errors: ValidationIssue[]) {
    super('VALIDATION_ERROR', 'Input validation failed', { errors });
  }
}

class NotFoundError extends ComponentError {
  constructor(resourceType: string, resourceId: string) {
    super('NOT_FOUND', `${resourceType} not found: ${resourceId}`, { resourceType, resourceId });
  }
}

class ConcurrencyError extends ComponentError {
  constructor(resourceId: string, timeout: number) {
    super('LOCK_TIMEOUT', `Failed to acquire lock for ${resourceId} within ${timeout}ms`, {
      resourceId,
      timeout,
    });
  }
}

class PersistenceError extends ComponentError {
  constructor(operation: string, path: string, cause: Error) {
    super('PERSISTENCE_ERROR', `Failed to ${operation} at ${path}: ${cause.message}`, {
      operation,
      path,
      cause: cause.message,
    });
  }
}
```

### 6.2 Error Categories

| Category    | Examples                               | Retryable | User Action         |
| ----------- | -------------------------------------- | --------- | ------------------- |
| Validation  | Invalid input, missing required fields | No        | Fix input           |
| Not Found   | Entity doesn't exist                   | No        | Check ID            |
| Concurrency | Lock timeout, stale lock               | Yes       | Automatic retry     |
| Persistence | Disk full, permission denied           | Maybe     | Check system        |
| State       | Invalid transition                     | No        | Check current state |

### 6.3 Retry Strategy

| Error Type                     | Retry | Strategy                                  | Max Retries |
| ------------------------------ | ----- | ----------------------------------------- | ----------- |
| `ConcurrencyError`             | Yes   | Exponential backoff (100ms, 200ms, 400ms) | 3           |
| `PersistenceError` (transient) | Yes   | Fixed delay (500ms)                       | 2           |
| `ValidationError`              | No    | -                                         | -           |
| `NotFoundError`                | No    | -                                         | -           |

### 6.4 Recovery Procedures

#### On Startup

```typescript
async function initializeComponent(): Promise<void> {
  // 1. Clean up stale locks
  await cleanupStaleLocks();

  // 2. Remove incomplete temporary files
  await cleanupTempFiles();

  // 3. Validate data integrity
  const issues = await validateDataIntegrity();
  if (issues.length > 0) {
    logger.warn('Data integrity issues found', { issues });
    // Log but don't fail - allow manual investigation
  }

  // 4. Rebuild index if corrupted
  if (await isIndexCorrupted()) {
    await rebuildIndex();
  }
}
```

#### After Crash

| Scenario           | Detection                       | Recovery Action                   |
| ------------------ | ------------------------------- | --------------------------------- |
| Incomplete write   | Temp file exists                | Delete temp file, state unchanged |
| Stale lock         | Lock file older than threshold  | Remove lock file                  |
| Corrupted index    | Index validation fails          | Rebuild from entity files         |
| Orphaned artifacts | Artifacts without parent entity | Move to quarantine directory      |

---

## 7. Atomic Operations

<!--
PURPOSE: Document how operations are made atomic for consistency.
-->

### 7.1 Atomic Write Pattern

```typescript
async function saveStateAtomically(entityId: string, state: EntityState): Promise<void> {
  const targetPath = getStatePath(entityId);
  const tempPath = `${targetPath}.tmp.${Date.now()}`;

  try {
    // 1. Write to temporary file
    const content = JSON.stringify(state, null, 2);
    await fs.writeFile(tempPath, content, 'utf-8');

    // 2. Verify written content
    const verification = await fs.readFile(tempPath, 'utf-8');
    if (verification !== content) {
      throw new Error('Write verification failed');
    }

    // 3. Atomic rename (overwrites target)
    await fs.rename(tempPath, targetPath);
  } catch (err) {
    // Cleanup temp file on failure
    await fs.unlink(tempPath).catch(() => {});
    throw new PersistenceError('save', targetPath, err);
  }
}
```

### 7.2 Multi-File Transactions

When multiple files must be updated together:

```typescript
async function saveMultipleAtomically(updates: FileUpdate[]): Promise<void> {
  const tempFiles: string[] = [];

  try {
    // Phase 1: Write all temp files
    for (const update of updates) {
      const tempPath = `${update.path}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, update.content);
      tempFiles.push(tempPath);
    }

    // Phase 2: Atomic rename all (commit)
    for (let i = 0; i < updates.length; i++) {
      await fs.rename(tempFiles[i], updates[i].path);
    }
  } catch (err) {
    // Rollback: delete any temp files
    for (const tempPath of tempFiles) {
      await fs.unlink(tempPath).catch(() => {});
    }
    throw err;
  }
}
```

---

## 8. Test Specification

<!--
PURPOSE: Define test scenarios. These become acceptance tests.
-->

### 8.1 Unit Tests

#### Feature: [Feature Name]

**Implements**: FR-XXX

```gherkin
Feature: [Feature Name]
  As a [component consumer]
  I want to [action]
  So that [benefit]

  Background:
    Given the component is initialized
    And the file system is accessible

  Scenario: Successfully perform operation
    Given a valid input
    When I call the operation
    Then the operation should succeed
    And the state should be persisted
    And a completion event should be emitted

  Scenario: Fail with invalid input
    Given an input missing required fields
    When I call the operation
    Then a ValidationError should be thrown
    And no state changes should occur

  Scenario: Handle concurrent access
    Given another process holds the lock
    When I call the operation
    Then it should retry with backoff
    And eventually acquire the lock
    And complete successfully
```

### 8.2 Integration Tests

```gherkin
Feature: Component Integration

  Scenario: Full lifecycle
    Given no existing entities
    When I create a new entity
    And I start the entity
    And I complete the entity
    Then the entity status should be "completed"
    And all state transitions should be persisted
    And appropriate events should be emitted

  Scenario: Crash recovery
    Given an entity in "active" state
    And a stale lock file exists
    When the component initializes
    Then the stale lock should be cleaned up
    And the entity should be accessible
```

### 8.3 Failure Mode Tests

| Scenario                    | Setup                             | Expected Behavior                          |
| --------------------------- | --------------------------------- | ------------------------------------------ |
| Disk full during write      | Mock fs.writeFile to throw ENOSPC | PersistenceError thrown, no partial writes |
| Lock file permission denied | Make locks directory read-only    | ConcurrencyError with clear message        |
| Corrupted state file        | Write invalid JSON to state.json  | Validation error on load, file quarantined |
| Process killed mid-write    | Temp file exists without target   | Temp file cleaned on next startup          |

---

## 9. Performance Considerations

### 9.1 Performance Targets

| Operation           | Target  | Condition           |
| ------------------- | ------- | ------------------- |
| Read single entity  | < 10ms  | SSD storage         |
| Write single entity | < 50ms  | Including fsync     |
| List all entities   | < 100ms | Up to 1000 entities |
| Lock acquisition    | < 100ms | No contention       |

### 9.2 Optimization Strategies

| Strategy        | Applied To                   | Benefit                  |
| --------------- | ---------------------------- | ------------------------ |
| Index file      | Entity listing               | Avoid directory scanning |
| In-memory cache | Frequently accessed entities | Reduce file I/O          |
| Batch writes    | Multiple updates             | Reduce fsync overhead    |
| Lazy loading    | Large entity data            | Reduce memory usage      |

### 9.3 Resource Limits

| Resource                 | Limit  | Rationale                     |
| ------------------------ | ------ | ----------------------------- |
| Max entities             | 10,000 | Index file size               |
| Max entity size          | 1 MB   | Memory during load            |
| Max artifacts per entity | 100    | Directory listing performance |

---

## 10. Dependencies

### 10.1 Internal Dependencies

| Component                | Purpose           | Interface Used             |
| ------------------------ | ----------------- | -------------------------- |
| COMP-XXX                 | [Purpose]         | `IInterfaceName.method()`  |
| COMP-001 Message Manager | Event publication | `publish()`, `subscribe()` |

### 10.2 External Dependencies

| Library             | Purpose           | Version  |
| ------------------- | ----------------- | -------- |
| Node.js fs/promises | File operations   | Node 18+ |
| zod                 | Schema validation | ^3.x     |

---

## 11. Open Questions

| ID    | Question   | Owner  | Status | Resolution |
| ----- | ---------- | ------ | ------ | ---------- |
| Q-001 | [Question] | [Name] | Open   | -          |

---

## 12. Traceability

### 12.1 Requirements Coverage

| Requirement | Section         | Status  |
| ----------- | --------------- | ------- |
| FR-XXX-001  | 4.1 Algorithm   | Covered |
| FR-XXX-002  | 2.2 Interface   | Covered |
| FR-XXX-003  | 6.1 Error Types | Covered |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
