/**
 * State Manager
 *
 * Interface and implementation for workflow execution state management.
 * Uses a single execution.json file per execution for all state.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Session } from "opencode/session/index"
import { DEFAULT_LIST_LIMIT, FLOMASTER_DIR, EXECUTIONS_DIR, EXECUTION_FILENAME } from "./defaults.js"
import {
  deleteDirectory,
  fileExists,
  LockManager,
  listSubdirectories,
  readJsonFile,
  validateExecutionId,
  writeJsonFile,
} from "./internal/index.js"
import type {
  Execution,
  ExecutionFilter,
  ExecutionStep,
  ExecutionSummary,
  IncompleteExecution,
  SessionDetails,
  SessionMessage,
  SharedContext,
  StepResult,
} from "./types.js"

import {
  ExecutionStatus,
  isActiveStatus,
  isTerminalStatus,
  StepExecutionStatus,
  EXECUTION_SCHEMA_VERSION,
} from "./types.js"

// ---
// Error Classes
// ---

export class NotInitializedError extends Error {
  constructor(component: string) {
    super(`${component} not initialized. Call initialize() first.`)
    this.name = "NotInitializedError"
  }
}

export class AlreadyInitializedError extends Error {
  constructor(component: string) {
    super(`${component} already initialized.`)
    this.name = "AlreadyInitializedError"
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`)
    this.name = "NotFoundError"
  }
}

export class AlreadyExistsError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} already exists: ${id}`)
    this.name = "AlreadyExistsError"
  }
}

// ---
// StateManager Interface
// ---

/**
 * StateManager interface.
 *
 * Manages workflow execution state, shared context, step-session mapping,
 * and crash recovery using a single execution.json file per execution.
 */
export type StateManager = {
  // Lifecycle
  initialize(): Promise<void>
  isInitialized(): boolean

  // Execution State - returns Execution type
  createExecution(executionId: string, workflowName: string, workflowId?: string, taskId?: string): Promise<Execution>
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

  // Checkpoint (execution.json IS the checkpoint)
  saveCheckpoint(executionId: string): Promise<string>
  loadCheckpoint(executionId: string): Promise<Execution | null>
  listIncompleteExecutions(): Promise<IncompleteExecution[]>
  setRecoverable(executionId: string, recoverable: boolean): Promise<void>
  hasCheckpoint(executionId: string): Promise<boolean>
  isExecutionActive(executionId: string): boolean

  // Session Queries (direct access)
  getSessionDetails(sessionId: string): Promise<SessionDetails | null>
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>
  getSessionChildren(sessionId: string): Promise<SessionDetails[]>
}

// ---
// DefaultStateManager Implementation
// ---

/**
 * Default implementation of StateManager.
 *
 * Manages workflow execution state with file-based persistence using
 * a single execution.json file per execution. Includes in-memory caching
 * and mutex locking for concurrent access.
 */
/** Maximum number of executions to cache in memory (LRU eviction) */
const MAX_CACHE_SIZE = 100

export class DefaultStateManager implements StateManager {
  private initialized = false
  private readonly executionsDir: string

  // Bounded LRU cache for Execution objects
  private readonly executionCache = new Map<string, Execution>()

  private readonly lockManager = new LockManager()

  constructor(config?: { executionsDir?: string }) {
    this.executionsDir = config?.executionsDir ?? path.join(FLOMASTER_DIR, EXECUTIONS_DIR)
  }

  /**
   * Add or update an execution in the cache with LRU eviction.
   * When the cache is full, the oldest entry is evicted.
   */
  private setCached(executionId: string, execution: Execution): void {
    // Delete first to ensure this entry becomes the newest (Map maintains insertion order)
    this.executionCache.delete(executionId)

    // Evict oldest entry if at capacity
    if (this.executionCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.executionCache.keys().next().value
      if (oldestKey) {
        this.executionCache.delete(oldestKey)
      }
    }

    this.executionCache.set(executionId, execution)
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new NotInitializedError("StateManager")
    }
  }

  private async withExecutionLock<T>(executionId: string, fn: () => Promise<T>): Promise<T> {
    this.assertInitialized()
    return this.lockManager.withLock(executionId, fn)
  }

  private getExecutionDir(executionId: string): string {
    validateExecutionId(executionId)
    return path.join(this.executionsDir, executionId)
  }

  private getExecutionPath(executionId: string): string {
    return path.join(this.getExecutionDir(executionId), EXECUTION_FILENAME)
  }

  private async getExecutionInternal(executionId: string): Promise<Execution | null> {
    const cached = this.executionCache.get(executionId)
    if (cached) return cached

    const execution = await readJsonFile<Execution>(this.getExecutionPath(executionId))

    if (execution) {
      this.setCached(executionId, execution)
    }

    return execution
  }

  // Lifecycle
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new AlreadyInitializedError("StateManager")
    }

    await fs.mkdir(this.executionsDir, { recursive: true })

    // Pre-load active executions into cache
    const executionIds = await listSubdirectories(this.executionsDir)

    for (const executionId of executionIds) {
      const executionPath = this.getExecutionPath(executionId)
      const execution = await readJsonFile<Execution>(executionPath)

      if (execution && isActiveStatus(execution.status)) {
        this.setCached(executionId, execution)
      }
    }

    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Execution State
  async createExecution(
    executionId: string,
    workflowName: string,
    workflowId?: string,
    taskId?: string,
  ): Promise<Execution> {
    this.assertInitialized()

    return this.lockManager.withLock(executionId, async () => {
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

      await writeJsonFile(executionPath, execution)
      this.setCached(executionId, execution)

      return execution
    })
  }

  async getExecution(executionId: string): Promise<Execution | null> {
    this.assertInitialized()
    return this.getExecutionInternal(executionId)
  }

  async updateStepStatus(executionId: string, stepId: string, status: StepExecutionStatus): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
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
        status: execution.status === ExecutionStatus.CREATED ? ExecutionStatus.RUNNING : execution.status,
        startedAt: execution.startedAt ?? (status === StepExecutionStatus.RUNNING ? now : undefined),
        steps: {
          ...execution.steps,
          [stepId]: { ...step, status },
        },
      }

      await writeJsonFile(this.getExecutionPath(executionId), updated)
      this.setCached(executionId, updated)
    })
  }

  async recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
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
        outputs: result.outputs,
        sessionId: result.sessionId,
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

      // Single atomic write
      await writeJsonFile(this.getExecutionPath(executionId), updated)
      this.setCached(executionId, updated)
    })
  }

  async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
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
      this.setCached(executionId, updated)
    })
  }

  async getStepStatus(executionId: string, stepId: string): Promise<StepExecutionStatus | null> {
    this.assertInitialized()

    const execution = await this.getExecutionInternal(executionId)
    if (!execution) {
      return null
    }

    return execution.steps[stepId]?.status ?? null
  }

  async listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]> {
    this.assertInitialized()

    const executionIds = await listSubdirectories(this.executionsDir)
    const summaries: ExecutionSummary[] = []

    for (const executionId of executionIds) {
      const execution = await this.getExecutionInternal(executionId)
      if (!execution) continue

      // Status filter
      if (filter?.status !== undefined) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status]
        if (statuses.length > 0 && !statuses.includes(execution.status)) continue
      }

      // Since filter
      if (filter?.since !== undefined && execution.updatedAt < filter.since) {
        continue
      }

      // TaskId filter
      if (filter?.taskId !== undefined && execution.taskId !== filter.taskId) {
        continue
      }

      // WorkflowId filter
      if (filter?.workflowId !== undefined && filter.workflowId !== "" && execution.workflowId !== filter.workflowId) {
        continue
      }

      // Count steps
      const stepIds = Object.keys(execution.steps)
      const completedCount = Object.values(execution.steps).filter(
        (step) => step.status === StepExecutionStatus.COMPLETED,
      ).length

      summaries.push({
        executionId: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflowName,
        taskId: execution.taskId,
        status: execution.status,
        stepCount: stepIds.length,
        completedCount,
        createdAt: execution.createdAt,
        updatedAt: execution.updatedAt,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
      })
    }

    // Sort by updatedAt descending
    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const limit = filter?.limit ?? DEFAULT_LIST_LIMIT
    return summaries.slice(0, limit)
  }

  async deleteExecution(executionId: string): Promise<boolean> {
    this.assertInitialized()
    validateExecutionId(executionId)

    return this.lockManager.withLock(executionId, async () => {
      const executionDir = this.getExecutionDir(executionId)
      const exists = await fileExists(executionDir)

      if (!exists) return false

      await deleteDirectory(executionDir)
      this.executionCache.delete(executionId)
      this.lockManager.removeLock(executionId)

      return true
    })
  }

  // Context (derived from steps)
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

  async setContextValue(executionId: string, stepId: string, key: string, value: unknown): Promise<void> {
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
      this.setCached(executionId, updated)
    })
  }

  async getContextValue(executionId: string, dotPath: string): Promise<unknown> {
    this.assertInitialized()
    const execution = await this.getExecutionInternal(executionId)
    if (!execution) return undefined

    // Parse path like "research.summary" -> stepId="research", key="summary"
    const parts = dotPath.split(".")
    if (parts.length < 2) return undefined

    const stepId = parts[0]
    if (!stepId) return undefined
    const rest = parts.slice(1)
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

  async mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void> {
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
      this.setCached(executionId, updated)
    })
  }

  // Session Mapping (stored in steps)
  async mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void> {
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
      this.setCached(executionId, updated)
    })
  }

  async getSessionForStep(executionId: string, stepId: string): Promise<string | null> {
    this.assertInitialized()
    const execution = await this.getExecutionInternal(executionId)
    return execution?.steps[stepId]?.sessionId ?? null
  }

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

  // Checkpoint (execution.json IS the checkpoint)
  async saveCheckpoint(executionId: string): Promise<string> {
    this.assertInitialized()
    // execution.json IS the checkpoint - just flush cache to disk
    const execution = this.executionCache.get(executionId)
    if (execution) {
      await writeJsonFile(this.getExecutionPath(executionId), execution)
    }
    return this.getExecutionPath(executionId)
  }

  async loadCheckpoint(executionId: string): Promise<Execution | null> {
    this.assertInitialized()
    return this.getExecutionInternal(executionId)
  }

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

  async setRecoverable(executionId: string, recoverable: boolean): Promise<void> {
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
      this.setCached(executionId, updated)
    })
  }

  async hasCheckpoint(executionId: string): Promise<boolean> {
    this.assertInitialized()
    const execution = await this.getExecutionInternal(executionId)
    return execution?.recoverable ?? false
  }

  isExecutionActive(executionId: string): boolean {
    return this.executionCache.has(executionId)
  }

  // Session Queries (direct access)
  private mapSession(session: Session.Info): SessionDetails {
    const parentId = session.parentID
    return {
      id: session.id,
      title: session.title ?? "",
      createdAt: new Date(session.time.created).toISOString(),
      updatedAt: new Date(session.time.updated).toISOString(),
      ...(parentId !== undefined && { parentId }),
    }
  }

  async getSessionDetails(sessionId: string): Promise<SessionDetails | null> {
    this.assertInitialized()

    try {
      const session = await Session.get(sessionId)
      if (!session) {
        return null
      }
      return this.mapSession(session)
    } catch {
      return null
    }
  }

  async getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
    this.assertInitialized()

    try {
      const messages = await Session.messages({ sessionID: sessionId })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return messages.map((msg: any) => ({
        id: msg.info.id,
        role: msg.info.role as "user" | "assistant",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parts: msg.parts.map((part: any) => ({
          type: part.type as "text" | "tool_use" | "tool_result",
          content: "text" in part ? part.text : undefined,
        })),
        createdAt: new Date(msg.info.time.created).toISOString(),
      }))
    } catch {
      return []
    }
  }

  async getSessionChildren(sessionId: string): Promise<SessionDetails[]> {
    this.assertInitialized()

    try {
      const children = await Session.children(sessionId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return children.map((session: any) => this.mapSession(session))
    } catch {
      return []
    }
  }
}

/**
 * Options for creating a StateManager.
 */
export type CreateStateManagerOptions = {
  /** Directory for execution data (default: '.flomaster/executions') */
  readonly executionsDir?: string
}

/**
 * Create an initialized StateManager instance.
 *
 * @param options - StateManager configuration options
 * @returns An initialized StateManager instance
 *
 * @example
 * ```typescript
 * import { createStateManager } from './flomaster/state';
 *
 * const stateManager = await createStateManager({
 *   executionsDir: '.flomaster/executions',
 * });
 *
 * const execution = await stateManager.createExecution('exec-123', 'sdlc');
 * ```
 */
export async function createStateManager(options?: CreateStateManagerOptions): Promise<StateManager> {
  const stateManager = new DefaultStateManager({
    ...(options?.executionsDir !== undefined && { executionsDir: options.executionsDir }),
  })
  await stateManager.initialize()
  return stateManager
}
