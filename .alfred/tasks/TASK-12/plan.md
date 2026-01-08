# TASK-12: Single JSON Execution State - Implementation Plan

## Overview

Refactor FloMaster's execution state persistence from 4 separate files (`state.json`, `context.json`, `mapping.json`, `checkpoint.json`) to a single `execution.json` file per workflow execution. This eliminates ~60% storage redundancy.

**This is a clean break - NO backward compatibility.** This code is not in production. We delete the old files and start fresh.

## Current State Analysis

### Current File Structure (DELETE THIS)
```
.flomaster/executions/{execution-id}/
├── state.json       # ~10KB - WorkflowExecution object
├── context.json     # ~10KB - SharedContext (DUPLICATE of stepResults.outputs)
├── mapping.json     # ~200B - Step→Session mapping (DUPLICATE of stepResults.sessionId)
└── checkpoint.json  # ~22KB - FULL COPY of all above (REDUNDANT)
```

### Target File Structure (NEW)
```
.flomaster/executions/{execution-id}/
├── execution.json   # ~12KB - Single source of truth
└── logs.txt         # Unchanged - execution logs
```

### Key Discoveries

- `stateManager.ts:396-426` - `recordStepResult()` writes to 4 files redundantly
- `stateManager.ts:241-252` - `mergeStepOutputsInternal()` duplicates outputs to context.json
- `stateManager.ts:254-267` - `mapStepToSessionInternal()` duplicates sessionId to mapping.json
- `types.ts:66-75` - `StepResult` already contains `outputs` and `sessionId`
- `workflow.ts` - CLI is the only caller of StateManager (executors don't touch it)

## Desired End State

After implementation:
1. Each execution uses a single `execution.json` file
2. All StateManager methods work identically from caller perspective
3. No data duplication
4. The `execution.json` IS the checkpoint - no separate checkpoint file

## What We're NOT Doing

- **Migration tool** - Delete old executions, start fresh
- **Backwards compatibility** - None. Clean break.
- **Artifacts-based context** - Future task, schema is extensible
- **Workflow engine changes** - Only StateManager layer

---

## Phase 1: Delete Old Executions

### Overview
Clean slate - delete existing executions folder before implementing new format.

### Steps

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode

# Delete old executions (they use old 4-file format)
rm -rf .flomaster/executions/

# Also delete the test-project created by calculator example
rm -rf packages/flomaster/test-project/
```

### Success Criteria
- [ ] `.flomaster/executions/` directory is empty or deleted
- [ ] No old format files remain

---

## Phase 2: Update Type Definitions

### Overview
Define the new `Execution` type and update related types in `types.ts`.

### Changes Required

#### 1. Add New Types to `types.ts`

**File:** `packages/flomaster/src/state/types.ts`

**Add after line 102 (after ExecutionCheckpoint):**

```typescript
/**
 * Unified execution state - single source of truth.
 * Replaces the 4-file structure (state.json, context.json, mapping.json, checkpoint.json).
 */
export interface ExecutionStep {
  /** Step execution status */
  status: StepExecutionStatus
  /** Session ID for this step (for agent steps) */
  sessionId?: string
  /** Epoch timestamp when step started */
  startTime?: number
  /** Epoch timestamp when step completed */
  endTime?: number
  /** Step outputs - the data passed to downstream steps via {{stepId.field}} */
  outputs?: Record<string, unknown>
  /** Error message if step failed */
  error?: string
  /** History of errors for retry tracking */
  errorHistory?: StepError[]
  /** Number of retry attempts */
  retryCount?: number
}

/**
 * Unified execution state stored in execution.json.
 * Single source of truth for all execution data.
 */
export interface Execution {
  // Header (immutable after creation)
  /** Unique execution identifier */
  id: string
  /** Name of the workflow being executed */
  workflowName: string
  /** Optional workflow definition ID */
  workflowId?: string
  /** Optional external task ID (Linear, Jira, etc.) */
  taskId?: string
  /** Parent session ID for the workflow */
  workflowSessionId?: string
  /** ISO 8601 creation timestamp */
  createdAt: string

  // Status (mutable)
  /** Overall execution status */
  status: ExecutionStatus
  /** ISO 8601 last update timestamp */
  updatedAt: string
  /** ISO 8601 start timestamp */
  startedAt?: string
  /** ISO 8601 completion timestamp */
  completedAt?: string

  // Steps - single source of truth for all step data
  /** Step states keyed by step ID */
  steps: Record<string, ExecutionStep>

  // Metadata
  /** Schema version for future migrations */
  version: string
  /** Whether this execution can be recovered/resumed */
  recoverable: boolean
}

/** Current schema version for Execution */
export const EXECUTION_SCHEMA_VERSION = "1.0"
```

#### 2. Add Zod Schema for Validation

**File:** `packages/flomaster/src/state/types.ts`

**Add after the new types:**

```typescript
/** Zod schema for ExecutionStep */
export const executionStepSchema = z.object({
  status: stepExecutionStatusSchema,
  sessionId: z.string().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  errorHistory: z.array(stepErrorSchema).optional(),
  retryCount: z.number().optional(),
})

/** Zod schema for Execution */
export const executionSchema = z.object({
  id: z.string(),
  workflowName: z.string(),
  workflowId: z.string().optional(),
  taskId: z.string().optional(),
  workflowSessionId: z.string().optional(),
  createdAt: z.string(),
  status: executionStatusSchema,
  updatedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  steps: z.record(z.string(), executionStepSchema),
  version: z.string(),
  recoverable: z.boolean(),
})
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`

---

## Phase 3: Update Defaults and Constants

### Overview
Update filename constants. Remove deprecated constants entirely (clean break).

### Changes Required

#### 1. Update `defaults.ts`

**File:** `packages/flomaster/src/state/defaults.ts`

**Replace lines 7-17 with:**

```typescript
/** Filename for unified execution state */
export const EXECUTION_FILENAME = "execution.json"

/** Execution logs filename */
export const LOGS_FILENAME = "logs.txt"
```

**DELETE these lines entirely (no backward compatibility):**
```typescript
// DELETE - no longer used
// export const STATE_FILENAME = "state.json"
// export const CONTEXT_FILENAME = "context.json"
// export const MAPPING_FILENAME = "mapping.json"
// export const CHECKPOINT_FILENAME = "checkpoint.json"
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`

---

## Phase 4: Rewrite StateManager Core

### Overview
Rewrite `DefaultStateManager` to use single `execution.json` file instead of 4 files.

### Changes Required

This is the core change. The strategy is:
1. Keep the same public interface (all method signatures unchanged)
2. Replace internal storage with single file operations
3. Update caching to work with `Execution` type
4. Remove all context/mapping/checkpoint file operations

#### 1. Update Cache Types

**File:** `packages/flomaster/src/state/stateManager.ts`

**Replace lines 150-152:**

```typescript
// OLD - DELETE:
// private readonly executionCache = new Map<string, WorkflowExecution>()
// private readonly contextCache = new Map<string, SharedContext>()
// private readonly mappingCache = new Map<string, Record<string, string>>()

// NEW - single cache:
private readonly executionCache = new Map<string, Execution>()
```

#### 2. Update File Path Helper

**Add new helper method after line 160:**

```typescript
private getExecutionPath(executionId: string): string {
  return path.join(this.executionsDir, executionId, EXECUTION_FILENAME)
}
```

#### 3. Rewrite `createExecution()`

**Replace `createExecutionInternal()` (lines 319-355):**

```typescript
private async createExecutionInternal(
  executionId: string,
  workflowName: string,
  workflowId?: string,
  taskId?: string,
): Promise<Execution> {
  const executionPath = this.getExecutionPath(executionId)

  if (await fileExists(executionPath)) {
    throw new AlreadyExistsError("Execution", executionId)
  }

  const now = new Date().toISOString()
  const execution: Execution = {
    id: executionId,
    workflowName,
    workflowId,
    taskId,
    createdAt: now,
    status: ExecutionStatus.CREATED,
    updatedAt: now,
    steps: {},
    version: EXECUTION_SCHEMA_VERSION,
    recoverable: true,
  }

  // Single file write - that's it!
  await writeJsonFile(executionPath, execution)
  this.executionCache.set(executionId, execution)

  return execution
}
```

#### 4. Rewrite `getExecution()`

**Replace `getExecutionInternal()` (lines 357-373):**

```typescript
private async getExecutionInternal(executionId: string): Promise<Execution | null> {
  // Check cache first
  const cached = this.executionCache.get(executionId)
  if (cached) return cached

  // Load from file
  const executionPath = this.getExecutionPath(executionId)
  const execution = await readJsonFile<Execution>(executionPath)

  if (execution) {
    this.executionCache.set(executionId, execution)
  }

  return execution
}
```

#### 5. Rewrite `updateStepStatus()`

**Replace lines 375-394:**

```typescript
private async updateStepStatusInternal(
  executionId: string,
  stepId: string,
  status: StepExecutionStatus,
): Promise<void> {
  const execution = await this.getExecutionInternal(executionId)
  if (!execution) {
    throw new NotFoundError("Execution", executionId)
  }

  const now = new Date().toISOString()
  const step = execution.steps[stepId] ?? { status: StepExecutionStatus.PENDING }

  const updated: Execution = {
    ...execution,
    updatedAt: now,
    // Auto-transition to RUNNING on first step
    status: execution.status === ExecutionStatus.CREATED
      ? ExecutionStatus.RUNNING
      : execution.status,
    startedAt: execution.startedAt ?? (status === StepExecutionStatus.RUNNING ? now : undefined),
    steps: {
      ...execution.steps,
      [stepId]: { ...step, status },
    },
  }

  await writeJsonFile(this.getExecutionPath(executionId), updated)
  this.executionCache.set(executionId, updated)
}
```

#### 6. Rewrite `recordStepResult()`

**Replace lines 396-426:**

```typescript
private async recordStepResultInternal(
  executionId: string,
  stepId: string,
  result: StepResult,
): Promise<void> {
  const execution = await this.getExecutionInternal(executionId)
  if (!execution) {
    throw new NotFoundError("Execution", executionId)
  }

  const now = new Date().toISOString()
  const existingStep = execution.steps[stepId] ?? { status: StepExecutionStatus.PENDING }

  // Build updated step with all data in one place
  const updatedStep: ExecutionStep = {
    ...existingStep,
    status: result.status,
    startTime: result.startTime ?? existingStep.startTime,
    endTime: result.endTime,
    outputs: result.outputs,  // ← Was in context.json, now here
    sessionId: result.sessionId,  // ← Was in mapping.json, now here
    error: result.error,
    errorHistory: result.errorHistory,
    retryCount: result.retryCount,
  }

  const updated: Execution = {
    ...execution,
    updatedAt: now,
    steps: {
      ...execution.steps,
      [stepId]: updatedStep,
    },
  }

  // Single atomic write - done!
  await writeJsonFile(this.getExecutionPath(executionId), updated)
  this.executionCache.set(executionId, updated)
}
```

#### 7. Rewrite Context Methods

**`getContext()` - Replace lines 523-534:**

```typescript
async getContext(executionId: string): Promise<SharedContext | null> {
  this.assertInitialized()
  const execution = await this.getExecutionInternal(executionId)
  if (!execution) return null

  // Build SharedContext from steps
  const context: SharedContext = {}
  for (const [stepId, step] of Object.entries(execution.steps)) {
    if (step.outputs) {
      context[stepId] = step.outputs
    }
  }
  return context
}
```

**`mergeStepOutputs()` - Replace lines 570-582:**

```typescript
async mergeStepOutputs(
  executionId: string,
  stepId: string,
  outputs: Record<string, unknown>,
): Promise<void> {
  this.assertInitialized()
  await this.withExecutionLock(executionId, async () => {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const existingStep = execution.steps[stepId] ?? { status: StepExecutionStatus.PENDING }
    const updated: Execution = {
      ...execution,
      updatedAt: new Date().toISOString(),
      steps: {
        ...execution.steps,
        [stepId]: { ...existingStep, outputs },
      },
    }

    await writeJsonFile(this.getExecutionPath(executionId), updated)
    this.executionCache.set(executionId, updated)
  })
}
```

#### 8. Rewrite Session Mapping Methods

**`mapStepToSession()` - Replace lines 584-601:**

```typescript
async mapStepToSession(
  executionId: string,
  stepId: string,
  sessionId: string,
): Promise<void> {
  this.assertInitialized()
  await this.withExecutionLock(executionId, async () => {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const existingStep = execution.steps[stepId]
    if (existingStep?.sessionId) {
      throw new AlreadyExistsError("Step-session mapping", `${stepId}:${sessionId}`)
    }

    const updated: Execution = {
      ...execution,
      updatedAt: new Date().toISOString(),
      steps: {
        ...execution.steps,
        [stepId]: { ...(existingStep ?? { status: StepExecutionStatus.PENDING }), sessionId },
      },
    }

    await writeJsonFile(this.getExecutionPath(executionId), updated)
    this.executionCache.set(executionId, updated)
  })
}
```

**`getSessionForStep()` - Replace lines 603-610:**

```typescript
async getSessionForStep(executionId: string, stepId: string): Promise<string | null> {
  this.assertInitialized()
  const execution = await this.getExecutionInternal(executionId)
  return execution?.steps[stepId]?.sessionId ?? null
}
```

#### 9. Rewrite Checkpoint Methods

**`saveCheckpoint()` - Replace lines 627-637:**

```typescript
async saveCheckpoint(executionId: string): Promise<string> {
  this.assertInitialized()
  // execution.json IS the checkpoint - just flush cache to disk
  const execution = this.executionCache.get(executionId)
  if (execution) {
    await writeJsonFile(this.getExecutionPath(executionId), execution)
  }
  return this.getExecutionPath(executionId)
}
```

**`loadCheckpoint()` - Replace lines 639-649:**

```typescript
async loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null> {
  this.assertInitialized()
  const execution = await this.getExecutionInternal(executionId)
  if (!execution) return null

  // Build legacy ExecutionCheckpoint format for compatibility with callers
  const context: SharedContext = {}
  const sessionMappings: Record<string, string> = {}

  for (const [stepId, step] of Object.entries(execution.steps)) {
    if (step.outputs) context[stepId] = step.outputs
    if (step.sessionId) sessionMappings[stepId] = step.sessionId
  }

  return {
    executionId: execution.id,
    workflowName: execution.workflowName,
    execution: this.toWorkflowExecution(execution),
    context,
    sessionMappings,
    timestamp: execution.updatedAt,
    checksum: "",
    version: "1.0",
  }
}
```

#### 10. Add Helper Method for Legacy Type Compatibility

**Add new helper method:**

```typescript
/**
 * Convert new Execution type to legacy WorkflowExecution for callers expecting old format.
 */
private toWorkflowExecution(execution: Execution): WorkflowExecution {
  const stepStatuses: Record<string, StepExecutionStatus> = {}
  const stepResults: Record<string, StepResult> = {}

  for (const [stepId, step] of Object.entries(execution.steps)) {
    stepStatuses[stepId] = step.status
    stepResults[stepId] = {
      status: step.status,
      outputs: step.outputs,
      error: step.error,
      errorHistory: step.errorHistory,
      startTime: step.startTime ?? 0,
      endTime: step.endTime ?? 0,
      retryCount: step.retryCount,
      sessionId: step.sessionId,
    }
  }

  return {
    executionId: execution.id,
    workflowName: execution.workflowName,
    workflowId: execution.workflowId,
    taskId: execution.taskId,
    status: execution.status,
    stepStatuses,
    stepResults,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
    startedAt: execution.startedAt,
    completedAt: execution.completedAt,
  }
}
```

#### 11. Update `hasCheckpoint()`

**Replace lines 700-706:**

```typescript
async hasCheckpoint(executionId: string): Promise<boolean> {
  this.assertInitialized()
  const execution = await this.getExecutionInternal(executionId)
  return execution?.recoverable ?? false
}
```

#### 12. Update `setRecoverable()`

**Replace lines 682-698:**

```typescript
async setRecoverable(executionId: string, recoverable: boolean): Promise<void> {
  this.assertInitialized()
  await this.withExecutionLock(executionId, async () => {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const updated: Execution = {
      ...execution,
      updatedAt: new Date().toISOString(),
      recoverable,
    }

    await writeJsonFile(this.getExecutionPath(executionId), updated)
    this.executionCache.set(executionId, updated)
  })
}
```

#### 13. Update `deleteExecution()`

**Replace lines 484-509:**

```typescript
async deleteExecution(executionId: string): Promise<boolean> {
  this.assertInitialized()
  validateExecutionId(executionId)

  const executionDir = path.join(this.executionsDir, executionId)
  const exists = await fileExists(executionDir)

  if (!exists) return false

  await deleteDirectory(executionDir)
  this.executionCache.delete(executionId)
  this.lockManager.removeLock(executionId)

  return true
}
```

#### 14. Update `updateExecutionStatus()`

**Replace lines 428-449:**

```typescript
async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
  this.assertInitialized()
  await this.withExecutionLock(executionId, async () => {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const now = new Date().toISOString()
    const updated: Execution = {
      ...execution,
      status,
      updatedAt: now,
      completedAt: isTerminalStatus(status) ? now : execution.completedAt,
    }

    await writeJsonFile(this.getExecutionPath(executionId), updated)
    this.executionCache.set(executionId, updated)
  })
}
```

#### 15. Update `setContextValue()`

**Replace lines 536-550:**

```typescript
async setContextValue(
  executionId: string,
  stepId: string,
  key: string,
  value: unknown,
): Promise<void> {
  this.assertInitialized()
  await this.withExecutionLock(executionId, async () => {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const existingStep = execution.steps[stepId] ?? { status: StepExecutionStatus.PENDING }
    const existingOutputs = existingStep.outputs ?? {}

    const updated: Execution = {
      ...execution,
      updatedAt: new Date().toISOString(),
      steps: {
        ...execution.steps,
        [stepId]: {
          ...existingStep,
          outputs: { ...existingOutputs, [key]: value },
        },
      },
    }

    await writeJsonFile(this.getExecutionPath(executionId), updated)
    this.executionCache.set(executionId, updated)
  })
}
```

#### 16. Update `getContextValue()`

**Replace lines 552-568:**

```typescript
async getContextValue(executionId: string, path: string): Promise<unknown> {
  this.assertInitialized()
  const execution = await this.getExecutionInternal(executionId)
  if (!execution) return undefined

  // Parse path like "research.summary" → stepId="research", key="summary"
  const parts = path.split(".")
  if (parts.length < 2) return undefined

  const [stepId, ...rest] = parts
  const step = execution.steps[stepId]
  if (!step?.outputs) return undefined

  // Navigate nested path
  let value: unknown = step.outputs
  for (const part of rest) {
    if (value === null || value === undefined) return undefined
    if (typeof value !== "object") return undefined
    value = (value as Record<string, unknown>)[part]
  }

  return value
}
```

#### 17. Update `listExecutions()`

**Replace lines 451-482:**

```typescript
async listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]> {
  this.assertInitialized()

  const executionIds = await listSubdirectories(this.executionsDir)
  const summaries: ExecutionSummary[] = []

  for (const executionId of executionIds) {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) continue

    // Apply status filter
    if (filter?.status && execution.status !== filter.status) continue

    // Count completed steps
    const completedSteps = Object.values(execution.steps).filter(
      (s) => s.status === StepExecutionStatus.COMPLETED
    ).length
    const totalSteps = Object.keys(execution.steps).length

    summaries.push({
      executionId: execution.id,
      workflowName: execution.workflowName,
      status: execution.status,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
      completedSteps,
      totalSteps,
    })
  }

  // Sort by updatedAt descending
  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  // Apply limit
  const limit = Math.min(filter?.limit ?? DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT)
  return summaries.slice(0, limit)
}
```

#### 18. Update `listIncompleteExecutions()`

**Replace lines 651-680:**

```typescript
async listIncompleteExecutions(): Promise<IncompleteExecution[]> {
  this.assertInitialized()

  const executionIds = await listSubdirectories(this.executionsDir)
  const incomplete: IncompleteExecution[] = []

  for (const executionId of executionIds) {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) continue

    // Only include active (non-terminal) executions
    if (!isActiveStatus(execution.status)) continue

    const completedSteps = Object.entries(execution.steps)
      .filter(([, step]) => step.status === StepExecutionStatus.COMPLETED)
      .map(([stepId]) => stepId)

    incomplete.push({
      executionId: execution.id,
      workflowName: execution.workflowName,
      status: execution.status,
      completedSteps,
      lastUpdated: execution.updatedAt,
      isRecoverable: execution.recoverable,
    })
  }

  return incomplete
}
```

#### 19. Update `getStepsForSession()`

**Replace lines 612-625:**

```typescript
async getStepsForSession(sessionId: string): Promise<Array<{ executionId: string; stepId: string }>> {
  this.assertInitialized()

  const results: Array<{ executionId: string; stepId: string }> = []
  const executionIds = await listSubdirectories(this.executionsDir)

  for (const executionId of executionIds) {
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) continue

    for (const [stepId, step] of Object.entries(execution.steps)) {
      if (step.sessionId === sessionId) {
        results.push({ executionId, stepId })
      }
    }
  }

  return results
}
```

#### 20. Update `initialize()`

**Replace lines 296-312:**

```typescript
async initialize(): Promise<void> {
  if (this.initialized) {
    throw new AlreadyInitializedError()
  }

  // Create executions directory if it doesn't exist
  await fs.mkdir(this.executionsDir, { recursive: true })

  // Pre-load active executions into cache
  const executionIds = await listSubdirectories(this.executionsDir)

  for (const executionId of executionIds) {
    const executionPath = this.getExecutionPath(executionId)
    const execution = await readJsonFile<Execution>(executionPath)

    if (execution && isActiveStatus(execution.status)) {
      this.executionCache.set(executionId, execution)
    }
  }

  this.initialized = true
}
```

#### 21. Update `isExecutionActive()`

**Replace lines 708-710:**

```typescript
isExecutionActive(executionId: string): boolean {
  return this.executionCache.has(executionId)
}
```

#### 22. Update StateManager Interface (Clean Break)

**NO backward compatibility.** Update the interface to use new `Execution` type directly.

**File:** `packages/flomaster/src/state/stateManager.ts`

**Update interface (around lines 89-132) - replace `WorkflowExecution` with `Execution`:**

```typescript
export interface StateManager {
  // Lifecycle
  initialize(): Promise<void>
  isInitialized(): boolean

  // Execution State - NOW RETURNS Execution, NOT WorkflowExecution
  createExecution(
    executionId: string,
    workflowName: string,
    workflowId?: string,
    taskId?: string,
  ): Promise<Execution>

  getExecution(executionId: string): Promise<Execution | null>
  updateStepStatus(executionId: string, stepId: string, status: StepExecutionStatus): Promise<void>
  recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void>
  updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void>
  getStepStatus(executionId: string, stepId: string): Promise<StepExecutionStatus | null>
  listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]>
  deleteExecution(executionId: string): Promise<boolean>

  // Context (derived from steps)
  getContext(executionId: string): Promise<SharedContext | null>
  setContextValue(executionId: string, stepId: string, key: string, value: unknown): Promise<void>
  getContextValue(executionId: string, path: string): Promise<unknown>
  mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void>

  // Session Mapping (stored in steps)
  mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void>
  getSessionForStep(executionId: string, stepId: string): Promise<string | null>
  getStepsForSession(sessionId: string): Promise<Array<{ executionId: string; stepId: string }>>

  // Checkpoint (now just saves execution.json)
  saveCheckpoint(executionId: string): Promise<string>
  loadCheckpoint(executionId: string): Promise<Execution | null>  // Returns Execution, not ExecutionCheckpoint
  listIncompleteExecutions(): Promise<IncompleteExecution[]>
  setRecoverable(executionId: string, recoverable: boolean): Promise<void>
  hasCheckpoint(executionId: string): Promise<boolean>
  isExecutionActive(executionId: string): boolean
}
```

**Update `loadCheckpoint()` to return `Execution` directly (cleaner):**

```typescript
async loadCheckpoint(executionId: string): Promise<Execution | null> {
  this.assertInitialized()
  return this.getExecutionInternal(executionId)
}
```

#### 23. DELETE `checkpointOnStepComplete` Flag Entirely

**No backward compatibility.** Every write IS a checkpoint now.

**Delete from `CreateStateManagerOptions` interface:**
```typescript
// DELETE this field:
// checkpointOnStepComplete?: boolean
```

**Delete from constructor:**
```typescript
// DELETE:
// private readonly checkpointOnStepComplete: boolean
// this.checkpointOnStepComplete = options.checkpointOnStepComplete ?? true
```

**Delete from `recordStepResult()`:**
```typescript
// DELETE these lines:
// if (this.checkpointOnStepComplete) {
//   await this.saveCheckpointInternal(executionId)
// }
```

**Update `createStateManager()` factory function:**
```typescript
export async function createStateManager(options: CreateStateManagerOptions): Promise<StateManager> {
  const manager = new DefaultStateManager({
    executionsDir: options.executionsDir,
    // DELETE: checkpointOnStepComplete removed
  })
  await manager.initialize()
  return manager
}
```

#### 24. Update Imports at Top of File

**Add to imports section (after line 10):**

```typescript
import {
  Execution,
  ExecutionStep,
  EXECUTION_SCHEMA_VERSION,
  // Keep other existing imports...
} from "./types.js"

import { EXECUTION_FILENAME } from "./defaults.js"
```

#### 25. DELETE Legacy Helper Method

**Delete `toWorkflowExecution()` - not needed without backward compatibility.**

#### 26. DELETE Obsolete Internal Methods

**Delete these methods entirely (no backward compatibility):**
- `loadContext()`
- `saveContext()`
- `loadMapping()`
- `saveMapping()`
- `mergeStepOutputsInternal()`
- `mapStepToSessionInternal()`
- `saveCheckpointInternal()`

#### 26. DELETE Obsolete Caches

**Delete these lines:**
```typescript
// DELETE:
// private readonly contextCache = new Map<string, SharedContext>()
// private readonly mappingCache = new Map<string, Record<string, string>>()
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`
- [ ] All unit tests pass: `cd packages/flomaster && bun test src/state/`

---

## Phase 4B: Update CLI Callers

### Overview
Update `workflow.ts` CLI commands to work with new `Execution` type instead of `WorkflowExecution`.

### Changes Required

#### 1. Update Imports in `workflow.ts`

**File:** `packages/flomaster/src/cli/workflow.ts`

**Add import for `Execution` type:**
```typescript
import type { Execution, ExecutionStep } from "../state/types.js"
```

#### 2. Update Type References

**Find and replace throughout the file:**
- `WorkflowExecution` → `Execution`
- `execution.executionId` → `execution.id`
- `execution.stepResults[stepId]` → `execution.steps[stepId]`
- `execution.stepStatuses[stepId]` → `execution.steps[stepId]?.status`

#### 3. Update `recordStepResult()` Calls

The `StepResult` type remains the same, but callers access data differently:

**Before (accessing from returned execution):**
```typescript
const execution = await stateManager.getExecution(executionId)
const stepResult = execution.stepResults[stepId]
const outputs = stepResult.outputs
const sessionId = stepResult.sessionId
```

**After (same pattern, different property path):**
```typescript
const execution = await stateManager.getExecution(executionId)
const step = execution.steps[stepId]
const outputs = step.outputs
const sessionId = step.sessionId
```

#### 4. Update Resume Logic

**In `WorkflowResumeCommand` - update access patterns:**

```typescript
// Before:
const completedSteps = Object.keys(execution.stepStatuses)
  .filter(id => execution.stepStatuses[id] === StepExecutionStatus.COMPLETED)

// After:
const completedSteps = Object.keys(execution.steps)
  .filter(id => execution.steps[id]?.status === StepExecutionStatus.COMPLETED)
```

#### 5. Update Inspect Command

**In `WorkflowInspectCommand` - update display logic:**

```typescript
// Before:
for (const [stepId, status] of Object.entries(execution.stepStatuses)) {
  const result = execution.stepResults[stepId]
  // ...
}

// After:
for (const [stepId, step] of Object.entries(execution.steps)) {
  const status = step.status
  const outputs = step.outputs
  const sessionId = step.sessionId
  // ...
}
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`

---

## Phase 4C: Update Factory

### Overview
Update `factory.ts` to remove `checkpointOnStepComplete` option.

### Changes Required

**File:** `packages/flomaster/src/orchestrator/engine/factory.ts`

**Remove `checkpointOnStepComplete` from StateManager creation:**

```typescript
// Before:
stateManager = await createStateManager({
  executionsDir,
  checkpointOnStepComplete,  // DELETE this line
})

// After:
stateManager = await createStateManager({
  executionsDir,
})
```

**Remove from `WorkflowEngineOptions` if present:**
```typescript
// DELETE if exists:
// checkpointOnStepComplete?: boolean
```

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`

---

## Phase 4D: Delete Old Types

### Overview
Delete the old `WorkflowExecution` and `ExecutionCheckpoint` types since we're not maintaining backward compatibility.

### Changes Required

**File:** `packages/flomaster/src/state/types.ts`

**DELETE these types entirely:**
- `WorkflowExecution` (around lines 77-89)
- `workflowExecutionSchema` (Zod schema for it)
- `ExecutionCheckpoint` (around lines 93-102)
- `executionCheckpointSchema` (Zod schema for it)

**Keep:**
- `StepResult` - still used for `recordStepResult()` parameter
- `StepError` - still used in `ExecutionStep.errorHistory`
- `SharedContext` - still used for `getContext()` return type
- All enums (`ExecutionStatus`, `StepExecutionStatus`)

### Success Criteria

#### Automated Verification
- [ ] TypeScript compiles: `cd packages/flomaster && bun run tsc --noEmit`

---

## Phase 5: Update Tests

### Overview
Update existing StateManager tests to work with new single-file structure.

### Changes Required

#### 1. Update Test Fixtures

**Pattern to find and replace:**
```typescript
// OLD - DELETE:
expect(await fileExists(path.join(dir, "state.json"))).toBe(true)
expect(await fileExists(path.join(dir, "context.json"))).toBe(true)
expect(await fileExists(path.join(dir, "mapping.json"))).toBe(true)

// NEW:
expect(await fileExists(path.join(dir, "execution.json"))).toBe(true)
```

#### 2. Update Mock Data

Tests that create mock execution data need to use new `Execution` type.

### Success Criteria

#### Automated Verification
- [ ] All FloMaster tests pass: `cd packages/flomaster && bun test`

---

## Phase 6: End-to-End Verification

### Overview
Run full SDLC workflow and verify the new `execution.json` contains ALL the data that was previously split across 4 files.

### Reference: Calculator Execution (What We Expect)

The calculator execution we ran earlier produced this data across 4 files:

**OLD: state.json + context.json + mapping.json combined:**
```json
{
  "executionId": "exec-1767813606557-wqwtbyk",
  "workflowName": "sdlc",
  "status": "COMPLETED",
  "stepStatuses": {
    "input": "COMPLETED",
    "research": "COMPLETED",
    "plan": "COMPLETED",
    "implement": "COMPLETED",
    "review": "COMPLETED"
  },
  "stepResults": {
    "input": { "status": "COMPLETED", "outputs": {...}, "startTime": ..., "endTime": ... },
    "research": { "status": "COMPLETED", "outputs": {...}, "sessionId": "ses_46619135cffenAG0y21JpPw6sA", ... },
    "plan": { "status": "COMPLETED", "outputs": {...}, "sessionId": "ses_46618572effeKJMfWdNJEFS4zY", ... },
    "implement": { "status": "COMPLETED", "outputs": {...}, "sessionId": "ses_466175f70ffeqnkMnxZXlt0a15", ... },
    "review": { "status": "COMPLETED", "outputs": {...}, "sessionId": "ses_46616c0a7ffer6uk78EOYYL3q8", ... }
  }
}
```

**NEW: execution.json should look like:**
```json
{
  "id": "exec-XXXXXXXXX-XXXXXXX",
  "workflowName": "sdlc",
  "createdAt": "2026-01-07T...",
  "status": "COMPLETED",
  "updatedAt": "2026-01-07T...",
  "steps": {
    "input": {
      "status": "COMPLETED",
      "startTime": 1767...,
      "endTime": 1767...,
      "outputs": {
        "prompt": "Build a CLI calculator...",
        "timeout_ms": 300000,
        "max_retries": 3
      }
    },
    "research": {
      "status": "COMPLETED",
      "sessionId": "ses_...",
      "startTime": 1767...,
      "endTime": 1767...,
      "outputs": {
        "success": true,
        "summary": "## Research Summary...",
        "artifacts": [],
        "response": "..."
      }
    },
    "plan": {
      "status": "COMPLETED",
      "sessionId": "ses_...",
      "startTime": 1767...,
      "endTime": 1767...,
      "outputs": {
        "success": true,
        "summary": "Based on the research...",
        "artifacts": [],
        "response": "..."
      }
    },
    "implement": {
      "status": "COMPLETED",
      "sessionId": "ses_...",
      "startTime": 1767...,
      "endTime": 1767...,
      "outputs": {
        "success": true,
        "summary": "## Implementation Complete...",
        "artifacts": [],
        "response": "..."
      }
    },
    "review": {
      "status": "COMPLETED",
      "sessionId": "ses_...",
      "startTime": 1767...,
      "endTime": 1767...,
      "outputs": {
        "success": true,
        "summary": "Review results...",
        "artifacts": [],
        "response": "..."
      }
    }
  },
  "version": "1.0",
  "recoverable": true
}
```

**Key differences:**
- `executionId` → `id`
- `stepStatuses` + `stepResults` merged → `steps`
- Each step contains: `status`, `sessionId`, `startTime`, `endTime`, `outputs` in ONE place
- `version` and `recoverable` added as metadata
- NO separate context.json, mapping.json, checkpoint.json

### Verification Steps

```bash
cd packages/flomaster

# 1. Run SDLC workflow with a simple task
bun run src/cli/index.ts workflow run --workflow sdlc "Create a hello world function in test-project/hello.py"

# 2. Check that ONLY execution.json was created (no old files)
ls .flomaster/executions/*/
# EXPECTED: execution.json (and maybe logs.txt)
# MUST NOT EXIST: state.json, context.json, mapping.json, checkpoint.json

# 3. Read the execution.json and verify structure
cat .flomaster/executions/*/execution.json | jq .

# 4. Verify all steps have outputs and sessionIds inside them
cat .flomaster/executions/*/execution.json | jq '.steps | keys'
# EXPECTED: ["input", "research", "plan", "implement", "review"]

cat .flomaster/executions/*/execution.json | jq '.steps.research.sessionId'
# EXPECTED: "ses_..." (not null)

cat .flomaster/executions/*/execution.json | jq '.steps.research.outputs.success'
# EXPECTED: true

# 5. List executions
bun run src/cli/index.ts workflow list
# EXPECTED: Shows the execution with correct status

# 6. Inspect the execution
bun run src/cli/index.ts workflow inspect <execution-id>
# EXPECTED: Shows all step details
```

### Success Criteria

#### Automated Verification
- [ ] SDLC workflow completes successfully
- [ ] `workflow list` shows the execution
- [ ] `workflow inspect` shows step details

#### Manual Verification (CRITICAL)
- [ ] **ONLY execution.json exists** - no state.json, context.json, mapping.json, checkpoint.json
- [ ] **execution.json has `steps` object** with all 5 steps (input, research, plan, implement, review)
- [ ] **Each step has `outputs`** - the data that was in context.json
- [ ] **Each agent step has `sessionId`** - the data that was in mapping.json
- [ ] **Structure matches reference above** - id, workflowName, status, steps, version, recoverable

---

## Testing Strategy

### Unit Tests
- StateManager CRUD operations with new `Execution` type
- Context extraction from steps (getContext returns correct format)
- Session mapping from steps (getSessionForStep works)

### Integration Tests
- CLI workflow run → StateManager → single file
- Resume functionality works

### E2E Test (MANDATORY)
Run the SDLC workflow and manually verify:
1. Only `execution.json` exists
2. All data is present in correct structure
3. CLI commands work correctly

---

## Summary

| Phase | What | Verification |
|-------|------|--------------|
| 1 | Delete old executions | `ls .flomaster/executions/` is empty |
| 2 | Add `Execution` type to types.ts | `tsc --noEmit` passes |
| 3 | Update constants in defaults.ts | `tsc --noEmit` passes |
| 4 | Rewrite StateManager (26 steps) | `bun test src/state/` passes |
| 4B | Update CLI callers (workflow.ts) | `tsc --noEmit` passes |
| 4C | Update factory.ts | `tsc --noEmit` passes |
| 4D | Delete old types (WorkflowExecution, etc.) | `tsc --noEmit` passes |
| 5 | Update tests | `bun test` passes |
| 6 | E2E verification | SDLC workflow produces correct `execution.json` |

**Rule: If you haven't run the SDLC workflow and verified `execution.json` structure, you haven't finished.**

---

## References

- Task definition: `.alfred/tasks/TASK-12/task.md`
- Current implementation: `packages/flomaster/src/state/stateManager.ts`
- Types: `packages/flomaster/src/state/types.ts`
- CLI: `packages/flomaster/src/cli/workflow.ts`
- Reference execution: `.flomaster/executions/exec-1767813606557-wqwtbyk/` (calculator example)
