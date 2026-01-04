/**
 * State Manager
 *
 * Interface and implementation for workflow execution state management.
 * Uses direct Session/Message access instead of SDK client.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { Session } from "../../session/index.js"
import {
  CHECKPOINT_FILENAME,
  CHECKPOINT_VERSION,
  CONTEXT_FILENAME,
  DEFAULT_CHECKPOINT_ON_STEP_COMPLETE,
  DEFAULT_LIST_LIMIT,
  FLOMASTER_DIR,
  EXECUTIONS_DIR,
  MAPPING_FILENAME,
  STATE_FILENAME,
} from "./defaults.js"
import {
  deleteDirectory,
  fileExists,
  isNodeError,
  LockManager,
  listSubdirectories,
  readJsonFile,
  validateExecutionId,
  writeJsonFile,
} from "./internal/index.js"
import type {
  ExecutionCheckpoint,
  ExecutionFilter,
  ExecutionSummary,
  IncompleteExecution,
  SessionDetails,
  SessionMessage,
  SharedContext,
  StateManagerConfig,
  StepResult,
  WorkflowExecution,
} from "./types.js"

import { ExecutionStatus, isActiveStatus, StepExecutionStatus } from "./types.js"

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
 * and crash recovery.
 */
export type StateManager = {
  // Lifecycle
  initialize(): Promise<void>
  isInitialized(): boolean

  // Workflow Execution State
  createExecution(
    executionId: string,
    workflowName: string,
    workflowId?: string,
    taskId?: string,
  ): Promise<WorkflowExecution>
  getExecution(executionId: string): Promise<WorkflowExecution | null>
  updateStepStatus(executionId: string, stepId: string, status: StepExecutionStatus): Promise<void>
  recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void>
  updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void>
  getStepStatus(executionId: string, stepId: string): Promise<StepExecutionStatus | null>
  listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]>
  deleteExecution(executionId: string): Promise<boolean>

  // Shared Context
  getContext(executionId: string): Promise<SharedContext | null>
  setContextValue(executionId: string, stepId: string, key: string, value: unknown): Promise<void>
  getContextValue(executionId: string, path: string): Promise<unknown>
  mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void>

  // Step-Session Mapping
  mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void>
  getSessionForStep(executionId: string, stepId: string): Promise<string | null>
  getStepsForSession(sessionId: string): Promise<Array<{ executionId: string; stepId: string }>>

  // Checkpoint & Recovery
  saveCheckpoint(executionId: string): Promise<string>
  loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null>
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
 * Manages workflow execution state with file-based persistence,
 * in-memory caching, and mutex locking for concurrent access.
 */
export class DefaultStateManager implements StateManager {
  private initialized = false
  private readonly executionsDir: string
  private readonly checkpointOnStepComplete: boolean

  // In-memory cache
  private readonly executionCache = new Map<string, WorkflowExecution>()
  private readonly contextCache = new Map<string, SharedContext>()
  private readonly mappingCache = new Map<string, Record<string, string>>()

  private readonly lockManager = new LockManager()

  constructor(config?: StateManagerConfig) {
    this.executionsDir = config?.executionsDir ?? path.join(FLOMASTER_DIR, EXECUTIONS_DIR)
    this.checkpointOnStepComplete = config?.checkpointOnStepComplete ?? DEFAULT_CHECKPOINT_ON_STEP_COMPLETE
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new NotInitializedError("StateManager")
    }
  }

  private async withExecutionLock<T>(
    executionId: string,
    fn: (execution: WorkflowExecution) => Promise<T>,
  ): Promise<T> {
    this.assertInitialized()
    return this.lockManager.withLock(executionId, async () => {
      const execution = await this.getExecution(executionId)
      if (!execution) {
        throw new NotFoundError("Execution", executionId)
      }
      return fn(execution)
    })
  }

  private getExecutionDir(executionId: string): string {
    validateExecutionId(executionId)
    return path.join(this.executionsDir, executionId)
  }

  private getStatePath(executionId: string): string {
    return path.join(this.getExecutionDir(executionId), STATE_FILENAME)
  }

  private getContextPath(executionId: string): string {
    return path.join(this.getExecutionDir(executionId), CONTEXT_FILENAME)
  }

  private getMappingPath(executionId: string): string {
    return path.join(this.getExecutionDir(executionId), MAPPING_FILENAME)
  }

  private getCheckpointPath(executionId: string): string {
    return path.join(this.getExecutionDir(executionId), CHECKPOINT_FILENAME)
  }

  private async loadCached<T>(
    executionId: string,
    cache: Map<string, T>,
    getPath: (id: string) => string,
    defaultValue: T,
  ): Promise<T> {
    const cached = cache.get(executionId)
    if (cached != null) {
      return cached
    }

    const data = await readJsonFile<T>(getPath(executionId))
    if (data != null) {
      cache.set(executionId, data)
      return data
    }

    return defaultValue
  }

  private async loadContext(executionId: string): Promise<SharedContext> {
    return this.loadCached(executionId, this.contextCache, (id) => this.getContextPath(id), {})
  }

  private async saveContext(executionId: string, context: SharedContext): Promise<void> {
    await writeJsonFile(this.getContextPath(executionId), context)
    this.contextCache.set(executionId, context)
  }

  private async loadMapping(executionId: string): Promise<Record<string, string>> {
    return this.loadCached(executionId, this.mappingCache, (id) => this.getMappingPath(id), {})
  }

  private async saveMapping(executionId: string, mapping: Record<string, string>): Promise<void> {
    await writeJsonFile(this.getMappingPath(executionId), mapping)
    this.mappingCache.set(executionId, mapping)
  }

  // Internal methods (no lock - for use inside locked blocks)
  private async mergeStepOutputsInternal(
    executionId: string,
    stepId: string,
    outputs: Record<string, unknown>,
  ): Promise<void> {
    const context = await this.loadContext(executionId)
    const updated: SharedContext = {
      ...context,
      [stepId]: outputs,
    }
    await this.saveContext(executionId, updated)
  }

  private async mapStepToSessionInternal(executionId: string, stepId: string, sessionId: string): Promise<void> {
    const mapping = await this.loadMapping(executionId)

    // Skip if already mapped (idempotent)
    if (mapping[stepId] !== undefined) {
      return
    }

    const updated = {
      ...mapping,
      [stepId]: sessionId,
    }
    await this.saveMapping(executionId, updated)
  }

  private async saveCheckpointInternal(executionId: string): Promise<string> {
    const execution = await this.getExecution(executionId)
    if (!execution) {
      throw new NotFoundError("Execution", executionId)
    }

    const context = await this.loadContext(executionId)
    const sessionMappings = await this.loadMapping(executionId)

    const checkpoint: ExecutionCheckpoint = {
      executionId,
      workflowName: execution.workflowName,
      execution,
      context,
      sessionMappings,
      timestamp: new Date().toISOString(),
      checksum: "", // TODO: Implement SHA-256 checksum
      version: CHECKPOINT_VERSION,
    }

    const checkpointPath = this.getCheckpointPath(executionId)
    await writeJsonFile(checkpointPath, checkpoint)

    return checkpointPath
  }

  // Lifecycle
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new AlreadyInitializedError("StateManager")
    }

    await fs.mkdir(this.executionsDir, { recursive: true })

    const executionIds = await listSubdirectories(this.executionsDir)
    for (const executionId of executionIds) {
      const execution = await readJsonFile<WorkflowExecution>(this.getStatePath(executionId))
      if (execution && isActiveStatus(execution.status)) {
        this.executionCache.set(executionId, execution)
      }
    }

    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized
  }

  // Workflow Execution State
  async createExecution(
    executionId: string,
    workflowName: string,
    workflowId?: string,
    taskId?: string,
  ): Promise<WorkflowExecution> {
    this.assertInitialized()

    return this.lockManager.withLock(executionId, async () => {
      if (await fileExists(this.getStatePath(executionId))) {
        throw new AlreadyExistsError("Execution", executionId)
      }

      const now = new Date().toISOString()
      const execution: WorkflowExecution = {
        executionId,
        workflowName,
        ...(workflowId !== undefined && { workflowId }),
        ...(taskId !== undefined && { taskId }),
        status: ExecutionStatus.CREATED,
        stepStatuses: {},
        stepResults: {},
        createdAt: now,
        updatedAt: now,
      }

      await writeJsonFile(this.getStatePath(executionId), execution)
      await writeJsonFile(this.getContextPath(executionId), {})
      await writeJsonFile(this.getMappingPath(executionId), {})

      this.executionCache.set(executionId, execution)
      this.contextCache.set(executionId, {})
      this.mappingCache.set(executionId, {})

      return execution
    })
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    this.assertInitialized()

    const cached = this.executionCache.get(executionId)
    if (cached) {
      return cached
    }

    const execution = await readJsonFile<WorkflowExecution>(this.getStatePath(executionId))
    if (execution) {
      if (isActiveStatus(execution.status)) {
        this.executionCache.set(executionId, execution)
      }
    }

    return execution
  }

  async updateStepStatus(executionId: string, stepId: string, status: StepExecutionStatus): Promise<void> {
    await this.withExecutionLock(executionId, async (execution) => {
      const updated: WorkflowExecution = {
        ...execution,
        stepStatuses: {
          ...execution.stepStatuses,
          [stepId]: status,
        },
        updatedAt: new Date().toISOString(),
      }

      // Auto-transition CREATED -> RUNNING when first step starts
      if (status === StepExecutionStatus.RUNNING && execution.status === ExecutionStatus.CREATED) {
        ;(updated as { status: ExecutionStatus }).status = ExecutionStatus.RUNNING
      }

      await writeJsonFile(this.getStatePath(executionId), updated)
      this.executionCache.set(executionId, updated)
    })
  }

  async recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void> {
    await this.withExecutionLock(executionId, async (execution) => {
      const updated: WorkflowExecution = {
        ...execution,
        stepStatuses: {
          ...execution.stepStatuses,
          [stepId]: result.status,
        },
        stepResults: {
          ...execution.stepResults,
          [stepId]: result,
        },
        updatedAt: new Date().toISOString(),
      }

      await writeJsonFile(this.getStatePath(executionId), updated)
      this.executionCache.set(executionId, updated)

      if (result.status === StepExecutionStatus.COMPLETED && result.outputs) {
        await this.mergeStepOutputsInternal(executionId, stepId, result.outputs)
      }

      if (result.sessionId != null) {
        await this.mapStepToSessionInternal(executionId, stepId, result.sessionId)
      }

      if (this.checkpointOnStepComplete) {
        await this.saveCheckpointInternal(executionId)
      }
    })
  }

  async updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void> {
    await this.withExecutionLock(executionId, async (execution) => {
      const updated: WorkflowExecution = {
        ...execution,
        status,
        updatedAt: new Date().toISOString(),
      }

      await writeJsonFile(this.getStatePath(executionId), updated)
      this.executionCache.set(executionId, updated)
    })
  }

  async getStepStatus(executionId: string, stepId: string): Promise<StepExecutionStatus | null> {
    this.assertInitialized()

    const execution = await this.getExecution(executionId)
    if (!execution) {
      return null
    }

    return execution.stepStatuses[stepId] ?? null
  }

  async listExecutions(filter?: ExecutionFilter): Promise<ExecutionSummary[]> {
    this.assertInitialized()

    const executionIds = await listSubdirectories(this.executionsDir)
    const summaries: ExecutionSummary[] = []

    for (const executionId of executionIds) {
      const execution = await this.getExecution(executionId)
      if (execution == null) continue

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

      const stepIds = Object.keys(execution.stepStatuses)
      const completedCount = stepIds.filter((id) => execution.stepStatuses[id] === StepExecutionStatus.COMPLETED).length

      summaries.push({
        executionId: execution.executionId,
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

    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const limit = filter?.limit ?? DEFAULT_LIST_LIMIT
    return summaries.slice(0, limit)
  }

  async deleteExecution(executionId: string): Promise<boolean> {
    this.assertInitialized()

    return this.lockManager.withLock(executionId, async () => {
      const deleted = await deleteDirectory(this.getExecutionDir(executionId))

      if (deleted) {
        this.executionCache.delete(executionId)
        this.contextCache.delete(executionId)
        this.mappingCache.delete(executionId)
        this.lockManager.removeLock(executionId)
      }

      return deleted
    })
  }

  // Shared Context
  async getContext(executionId: string): Promise<SharedContext | null> {
    this.assertInitialized()

    const execution = await this.getExecution(executionId)
    if (!execution) {
      return null
    }

    return this.loadContext(executionId)
  }

  async setContextValue(executionId: string, stepId: string, key: string, value: unknown): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
      const context = await this.loadContext(executionId)
      const updated: SharedContext = {
        ...context,
        [stepId]: {
          ...context[stepId],
          [key]: value,
        },
      }

      await this.saveContext(executionId, updated)
      return undefined
    })
  }

  async getContextValue(executionId: string, dotPath: string): Promise<unknown> {
    this.assertInitialized()

    const context = await this.getContext(executionId)
    if (context === null) {
      return undefined
    }

    const parts = dotPath.split(".")
    const stepId = parts[0]
    const key = parts[1]
    if (stepId === undefined || key === undefined) {
      return undefined
    }

    return context[stepId]?.[key]
  }

  async mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
      const context = await this.loadContext(executionId)
      const updated: SharedContext = {
        ...context,
        [stepId]: outputs,
      }

      await this.saveContext(executionId, updated)
      return undefined
    })
  }

  // Step-Session Mapping
  async mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
      const mapping = await this.loadMapping(executionId)

      // Contract invariant: Session mapping is immutable once set
      if (mapping[stepId] !== undefined) {
        throw new AlreadyExistsError("Step-session mapping", `${executionId}/${stepId}`)
      }

      const updated = {
        ...mapping,
        [stepId]: sessionId,
      }

      await this.saveMapping(executionId, updated)
      return undefined
    })
  }

  async getSessionForStep(executionId: string, stepId: string): Promise<string | null> {
    this.assertInitialized()

    const execution = await this.getExecution(executionId)
    if (!execution) {
      return null
    }

    const mapping = await this.loadMapping(executionId)
    return mapping[stepId] ?? null
  }

  async getStepsForSession(sessionId: string): Promise<Array<{ executionId: string; stepId: string }>> {
    this.assertInitialized()

    const results: Array<{ executionId: string; stepId: string }> = []
    const executionIds = await listSubdirectories(this.executionsDir)

    for (const executionId of executionIds) {
      const mapping = await this.loadMapping(executionId)
      for (const [stepId, mappedSessionId] of Object.entries(mapping)) {
        if (mappedSessionId === sessionId) {
          results.push({ executionId, stepId })
        }
      }
    }

    return results
  }

  // Checkpoint & Recovery
  async saveCheckpoint(executionId: string): Promise<string> {
    this.assertInitialized()
    return this.lockManager.withLock(executionId, () => this.saveCheckpointInternal(executionId))
  }

  async loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null> {
    this.assertInitialized()

    const checkpoint = await readJsonFile<ExecutionCheckpoint>(this.getCheckpointPath(executionId))

    if (!checkpoint) {
      return null
    }

    return checkpoint
  }

  async listIncompleteExecutions(): Promise<IncompleteExecution[]> {
    this.assertInitialized()

    const executionIds = await listSubdirectories(this.executionsDir)
    const incomplete: IncompleteExecution[] = []

    for (const executionId of executionIds) {
      const execution = await this.getExecution(executionId)
      if (!execution) continue

      if (!isActiveStatus(execution.status)) continue

      const completedSteps = Object.entries(execution.stepStatuses)
        .filter(([, status]) => status === StepExecutionStatus.COMPLETED)
        .map(([stepId]) => stepId)

      const hasCheckpointFile = await this.hasCheckpoint(executionId)

      incomplete.push({
        executionId,
        workflowName: execution.workflowName,
        status: execution.status,
        completedSteps,
        lastUpdated: execution.updatedAt,
        isRecoverable: hasCheckpointFile,
      })
    }

    return incomplete
  }

  async setRecoverable(executionId: string, recoverable: boolean): Promise<void> {
    await this.withExecutionLock(executionId, async () => {
      if (recoverable) {
        await this.saveCheckpointInternal(executionId)
      } else {
        const checkpointPath = this.getCheckpointPath(executionId)
        try {
          await fs.unlink(checkpointPath)
        } catch (error: unknown) {
          if (isNodeError(error) && error.code !== "ENOENT") {
            throw error
          }
        }
      }
      return undefined
    })
  }

  async hasCheckpoint(executionId: string): Promise<boolean> {
    this.assertInitialized()
    return fileExists(this.getCheckpointPath(executionId))
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

      return messages.map((msg) => ({
        id: msg.info.id,
        role: msg.info.role as "user" | "assistant",
        parts: msg.parts.map((part) => ({
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
      return children.map((session) => this.mapSession(session))
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
  /** Whether to checkpoint after each step completion */
  readonly checkpointOnStepComplete?: boolean
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
    ...(options?.checkpointOnStepComplete !== undefined && {
      checkpointOnStepComplete: options.checkpointOnStepComplete,
    }),
  })
  await stateManager.initialize()
  return stateManager
}
