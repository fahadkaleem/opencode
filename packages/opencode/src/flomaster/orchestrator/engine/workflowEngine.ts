/**
 * Workflow Engine
 *
 * Main orchestrator class implementing the contract interface.
 * Manages workflow execution, lifecycle, and state persistence.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import type { AnyActorRef, Snapshot } from "xstate"
import { createActor, waitFor } from "xstate"
import { Session } from "@/session/index"
import { Bus } from "@/bus/index"
import { workflowMachine } from "../machine/workflowMachine"
import { WorkflowBusEvents, type ExecutionSummaryForTUI, type StepStatusForTUI } from "../events"
import { CycleDetectedError } from "../parser/topology"
import { parseWorkflow, validateWorkflow, WorkflowParseError } from "../parser/workflowParser"
import type { StepExecutorRegistry } from "../registry/stepExecutorRegistry"
import {
  getErrorMessage,
  type ExecutionOptions,
  type ExecutionSnapshot,
  type ParsedWorkflow,
  type StepExecutionEvent,
  type Subscription,
  type ValidationResult,
  type WorkflowActorInput,
  type WorkflowContext,
  type WorkflowData,
  type WorkflowEvent,
  type WorkflowEventListener,
  type WorkflowResult,
  type WorkflowTerminateMode,
} from "../types"
import { validateWorkflowSchema } from "../utils/schemaValidator"

/**
 * Type for the snapshot returned by XState actor.getSnapshot().
 * AnyActorRef.getSnapshot() returns 'any', so we define the expected shape.
 */
type WorkflowSnapshot = {
  context: WorkflowContext
  value: unknown
}

/**
 * Configuration for the WorkflowEngine.
 */
export type WorkflowEngineConfig = {
  /** Directory for workflow definitions */
  workflowDir?: string
  /** Directory for execution snapshots */
  snapshotDir?: string
  /** Default timeout in milliseconds */
  defaultTimeout?: number
  /** Default max retries per node */
  defaultMaxRetries?: number
  /** Step executor registry for pluggable execution */
  executorRegistry?: StepExecutorRegistry
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Execution progress for a running workflow.
 */
export type ExecutionProgress = {
  /** Task IDs that have completed */
  completed: string[]
  /** Task IDs currently running */
  running: string[]
  /** Task IDs waiting to run */
  pending: string[]
}

/**
 * Shared context type - outputs from all completed tasks.
 * Structure: { [taskId]: { [outputKey]: value } }
 */
export type SharedContext = Record<string, Record<string, unknown>>

/**
 * WorkflowEngine Interface
 *
 * Defines the contract for workflow orchestration (OR-OP-001 to OR-OP-050).
 * Implementations manage workflow loading, validation, execution, and lifecycle.
 *
 * @see design/03-contracts/05-orchestrator.md
 */
export type WorkflowEngine = {
  /**
   * OR-OP-001: Load workflow from JSON file.
   * @param name - Workflow name or path
   * @returns The loaded graph data
   */
  loadWorkflow(name: string): Promise<WorkflowData>

  /**
   * OR-OP-002: Validate workflow definition.
   * @param graph - The graph data to validate
   * @returns Validation result with errors and warnings
   */
  validateWorkflow(graph: WorkflowData): Promise<ValidationResult>

  /**
   * OR-OP-010: Execute workflow.
   * @param graph - The graph data to execute
   * @param taskId - Task identifier for tracking
   * @param options - Execution options
   * @returns Workflow execution result
   */
  executeWorkflow(graph: WorkflowData, taskId: string, options?: ExecutionOptions): Promise<WorkflowResult>

  /**
   * OR-OP-020: Pause workflow for approval.
   * @param executionId - The execution to pause
   */
  pauseWorkflow(executionId: string): Promise<void>

  /**
   * OR-OP-021: Resume workflow with decision.
   * @param executionId - The execution to resume
   * @param decision - APPROVE to continue, REJECT to fail, REFINE to request changes
   * @param feedback - Required feedback when decision is REFINE
   */
  resumeWorkflow(executionId: string, decision: "APPROVE" | "REJECT" | "REFINE", feedback?: string): Promise<void>

  /**
   * OR-OP-022: Abort workflow execution.
   * @param executionId - The execution to abort
   */
  abortWorkflow(executionId: string): Promise<void>

  /**
   * Get persisted snapshot for crash recovery.
   * @param executionId - The execution to snapshot
   * @returns Snapshot or null if not found
   */
  getSnapshot(executionId: string): ExecutionSnapshot | null

  /**
   * Save snapshot to disk.
   * @param executionId - The execution to save
   * @returns Path to saved snapshot file
   */
  saveSnapshot(executionId: string): Promise<string>

  /**
   * Load and resume from persisted snapshot.
   * @param snapshotPath - Path to snapshot file
   * @returns The resumed execution ID
   */
  resumeFromSnapshot(snapshotPath: string): Promise<string>

  /**
   * Subscribe to workflow events.
   * @param listener - Event listener callback
   * @returns Subscription with unsubscribe method
   */
  subscribe(listener: WorkflowEventListener): Subscription

  /**
   * Get active execution IDs.
   * @returns Array of active execution IDs
   */
  getActiveExecutions(): string[]

  /**
   * Check if an execution is active.
   * @param executionId - The execution to check
   * @returns True if active
   */
  isExecutionActive(executionId: string): boolean

  /**
   * Get current execution state.
   * @param executionId - The execution to query
   * @returns Current state name or null if not found
   */
  getState(executionId: string): string | null

  /**
   * Get execution progress.
   * @param executionId - The execution to query
   * @returns Progress object or null if not found
   */
  getProgress(executionId: string): ExecutionProgress | null

  /**
   * Get shared context (all task outputs).
   * @param executionId - The execution to query
   * @returns Shared context object or null if not found
   */
  getContext(executionId: string): SharedContext | null
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Omit<Required<WorkflowEngineConfig>, "executorRegistry"> & {
  executorRegistry: StepExecutorRegistry | undefined
} = {
  workflowDir: ".flowmaster/workflows",
  snapshotDir: ".flowmaster/snapshots",
  defaultTimeout: 300000, // 5 minutes
  defaultMaxRetries: 3,
  executorRegistry: undefined,
  debug: false,
}

/**
 * Default Workflow Engine Implementation
 *
 * Implements the WorkflowEngine interface (OR-OP-001 to OR-OP-050).
 * Uses XState v5 for state machine orchestration.
 */
export class DefaultWorkflowEngine implements WorkflowEngine {
  private readonly config: Omit<Required<WorkflowEngineConfig>, "executorRegistry">
  private readonly activeExecutions = new Map<string, AnyActorRef>()
  private readonly eventListeners = new Set<WorkflowEventListener>()
  private readonly executorRegistry?: StepExecutorRegistry
  /** Track completed steps per execution for event emission */
  private readonly executionCompletedSteps = new Map<string, Set<string>>()
  /** Track started steps per execution to avoid duplicate STEP_STARTED events */
  private readonly executionStartedSteps = new Map<string, Set<string>>()

  constructor(config?: WorkflowEngineConfig) {
    const { executorRegistry, ...restConfig } = config ?? {}
    this.config = { ...DEFAULT_CONFIG, ...restConfig }
    if (executorRegistry !== undefined) {
      this.executorRegistry = executorRegistry
    }
  }

  /**
   * OR-OP-001: Load workflow from JSON file.
   *
   * @param name - Workflow name or path
   * @returns The loaded graph data
   */
  async loadWorkflow(name: string): Promise<WorkflowData> {
    const filePath = name.endsWith(".json") ? name : path.join(this.config.workflowDir, `${name}.json`)

    try {
      const content = await fs.readFile(filePath, "utf-8")
      return JSON.parse(content) as WorkflowData
    } catch (error) {
      throw new Error(`Failed to load workflow '${name}': ${getErrorMessage(error)}`)
    }
  }

  /**
   * OR-OP-002: Validate workflow definition.
   *
   * @param graph - The graph data to validate
   * @returns Validation result with errors and warnings
   */
  validateWorkflow(graph: WorkflowData): Promise<ValidationResult> {
    const errors: Array<{
      code: string
      message: string
      path?: readonly string[]
    }> = []
    const warnings: Array<{
      code: string
      message: string
      path?: readonly string[]
    }> = []

    const schemaResult = validateWorkflowSchema(graph)
    if (!schemaResult.valid) {
      errors.push(...schemaResult.errors)
    }

    try {
      const parsed = parseWorkflow(graph)
      const graphErrors = validateWorkflow(parsed)

      for (const errorMsg of graphErrors) {
        errors.push({ code: "GRAPH_ERROR", message: errorMsg })
      }

      if (parsed.nodes.size === 0) {
        warnings.push({
          code: "EMPTY_WORKFLOW",
          message: "Workflow has no executable nodes",
        })
      }

      if (parsed.entryPoints.length > 1) {
        warnings.push({
          code: "MULTIPLE_ENTRY_POINTS",
          message: `Workflow has ${parsed.entryPoints.length} entry points`,
        })
      }
    } catch (error) {
      if (error instanceof CycleDetectedError) {
        errors.push({
          code: "CYCLE_DETECTED",
          message: error.message,
          path: error.cycle,
        })
      } else if (error instanceof WorkflowParseError) {
        errors.push({
          code: "PARSE_ERROR",
          message: error.message,
        })
      } else {
        errors.push({
          code: "UNKNOWN_ERROR",
          message: getErrorMessage(error),
        })
      }
    }

    return Promise.resolve({
      valid: errors.length === 0,
      errors,
      warnings,
    })
  }

  /**
   * OR-OP-010: Execute workflow.
   *
   * @param graph - The graph data to execute
   * @param taskId - Task identifier for tracking
   * @param options - Execution options
   * @returns Workflow execution result
   */
  async executeWorkflow(graph: WorkflowData, taskId: string, options?: ExecutionOptions): Promise<WorkflowResult> {
    const startTime = Date.now()

    let parsed: ParsedWorkflow
    try {
      parsed = parseWorkflow(graph)
    } catch (error) {
      return this.createFailedResult(taskId, startTime, getErrorMessage(error))
    }

    // Determine parent session for workflow steps
    // If parentSessionID is provided (e.g., from TUI), use it - step sessions become children of that session
    // Otherwise, create a new container session (for CLI usage)
    let workflowSessionID: string | undefined = options?.parentSessionID
    if (!workflowSessionID && !options?.dryRun) {
      try {
        const workflowSession = await Session.create({
          title: `Workflow: ${taskId}`,
        })
        workflowSessionID = workflowSession.id
      } catch (error) {
        // Session creation is optional - workflows can still run without it
        if (this.config.debug) {
          // biome-ignore lint/suspicious/noConsole: Debug logging is intentional when debug mode is enabled
          console.warn(`[WorkflowEngine] Failed to create workflow session: ${error}`)
        }
      }
    }

    const input: WorkflowActorInput = {
      graph: parsed,
      taskId,
      executionsDir: options?.executionsDir,
      workflowSessionID,
      signal: options?.signal,
      outputs: (options?.previousOutputs ?? {}) as Record<string, Record<string, unknown>>,
      variables: options?.variables ?? {},
      dryRun: options?.dryRun ?? false,
      maxRetries: this.config.defaultMaxRetries,
      executorRegistry: this.executorRegistry,
    }

    const actor = createActor(workflowMachine, { input })
    const executionId = options?.executionId ?? `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    this.activeExecutions.set(executionId, actor)

    // Register step event emitter with the registry for this execution
    // This allows step actors to emit streaming events back to the engine
    if (this.executorRegistry) {
      this.executorRegistry.setStepEventEmitter(executionId, (event: StepExecutionEvent) => {
        this.handleStepExecutionEvent(executionId, event)
      })
    }

    actor.subscribe({
      next: (snapshot) => {
        this.handleSnapshot(executionId, snapshot)
      },
      complete: () => {
        // Process final snapshot to capture any remaining step completions
        const finalSnapshot = actor.getSnapshot()
        this.handleSnapshot(executionId, finalSnapshot)

        const context = finalSnapshot.context as WorkflowContext
        this.emitEvent({
          type: "WORKFLOW_COMPLETED",
          executionId,
          outputs: context.outputs,
        })

        // Publish workflow completed to Bus for TUI
        this.publishExecutionUpdate(executionId, context, context.error ? "FAILED" : "COMPLETED")

        this.cleanupExecution(executionId)
      },
      error: (error) => {
        this.emitEvent({
          type: "WORKFLOW_FAILED",
          executionId,
          error: getErrorMessage(error),
        })

        // Publish workflow failed to Bus for TUI
        const snapshot = actor.getSnapshot() as WorkflowSnapshot
        this.publishExecutionUpdate(executionId, snapshot.context, "FAILED")

        this.cleanupExecution(executionId)
      },
    })

    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        actor.send({ type: "ABORT" })
      })
    }

    const timeoutMs = options?.timeout ?? this.config.defaultTimeout
    const timeoutId = setTimeout(() => {
      actor.send({ type: "ABORT" })
    }, timeoutMs)

    actor.start()
    const variables = options?.variables
    actor.send({
      type: "START",
      graph: parsed,
      taskId,
      executionId, // Pass executionId to machine so it uses the same one
      ...(variables !== undefined && { variables }),
    })
    this.emitEvent({ type: "WORKFLOW_STARTED", executionId, taskId })

    // Publish initial workflow state to Bus for TUI
    const initialSnapshot = actor.getSnapshot() as WorkflowSnapshot
    this.publishExecutionUpdate(executionId, initialSnapshot.context, "RUNNING")

    try {
      const finalSnapshot = await waitFor(
        actor,
        (state) => state.matches("completed") || state.matches("failed") || state.matches("cancelled"),
        { timeout: timeoutMs + 1000 },
      )

      clearTimeout(timeoutId)

      return this.createResult(executionId, startTime, finalSnapshot.context)
    } catch (error) {
      clearTimeout(timeoutId)
      return this.createFailedResult(executionId, startTime, getErrorMessage(error))
    }
  }

  /**
   * OR-OP-020: Pause workflow for approval.
   */
  pauseWorkflow(executionId: string): Promise<void> {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) {
      return Promise.reject(new Error(`Execution ${executionId} not found`))
    }
    actor.send({ type: "PAUSE" })
    return Promise.resolve()
  }

  /**
   * OR-OP-021: Resume workflow with decision.
   * @param executionId - The execution to resume
   * @param decision - APPROVE to continue, REJECT to fail, REFINE to request changes
   * @param feedback - Required feedback when decision is REFINE
   */
  resumeWorkflow(executionId: string, decision: "APPROVE" | "REJECT" | "REFINE", feedback?: string): Promise<void> {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) {
      return Promise.reject(new Error(`Execution ${executionId} not found`))
    }

    if (decision === "REFINE") {
      if (feedback === undefined || feedback === "") {
        return Promise.reject(new Error("Feedback is required for REFINE decision"))
      }
      actor.send({ type: "REFINE", feedback })
    } else {
      actor.send({ type: decision })
    }
    return Promise.resolve()
  }

  /**
   * OR-OP-022: Abort workflow execution.
   */
  abortWorkflow(executionId: string): Promise<void> {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) {
      return Promise.reject(new Error(`Execution ${executionId} not found`))
    }
    actor.send({ type: "ABORT" })
    this.emitEvent({ type: "WORKFLOW_CANCELLED", executionId })

    // Publish workflow cancelled to Bus for TUI
    const snapshot = actor.getSnapshot() as WorkflowSnapshot
    this.publishExecutionUpdate(executionId, snapshot.context, "CANCELLED")

    return Promise.resolve()
  }

  /**
   * Get persisted snapshot for crash recovery.
   */
  getSnapshot(executionId: string): ExecutionSnapshot | null {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) return null

    const snapshot = actor.getPersistedSnapshot()
    const actorSnapshot = actor.getSnapshot() as WorkflowSnapshot
    const context = actorSnapshot.context

    return {
      executionId,
      taskId: context.taskId,
      machineState: snapshot,
      outputs: context.outputs,
      stepResults: context.stepResults,
      timestamp: Date.now(),
      version: "1.0.0",
    }
  }

  /**
   * Save snapshot to disk.
   */
  async saveSnapshot(executionId: string): Promise<string> {
    const snapshot = this.getSnapshot(executionId)
    if (!snapshot) {
      throw new Error(`Execution ${executionId} not found`)
    }

    await fs.mkdir(this.config.snapshotDir, { recursive: true })
    const filePath = path.join(this.config.snapshotDir, `${executionId}.json`)
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2))

    return filePath
  }

  /**
   * Load and resume from persisted snapshot.
   */
  async resumeFromSnapshot(snapshotPath: string): Promise<string> {
    const content = await fs.readFile(snapshotPath, "utf-8")
    const snapshot = JSON.parse(content) as ExecutionSnapshot

    const input: WorkflowActorInput = {
      graph: null as unknown as ParsedWorkflow, // Will be overridden by snapshot
      taskId: snapshot.taskId,
      outputs: snapshot.outputs as Record<string, Record<string, unknown>>,
    }

    const actor = createActor(workflowMachine, {
      input,
      snapshot: snapshot.machineState as Snapshot<unknown>,
    })

    const executionId = snapshot.executionId
    this.activeExecutions.set(executionId, actor)
    actor.start()

    return executionId
  }

  /**
   * Subscribe to workflow events.
   */
  subscribe(listener: WorkflowEventListener): Subscription {
    this.eventListeners.add(listener)
    return {
      unsubscribe: () => {
        this.eventListeners.delete(listener)
      },
    }
  }

  /**
   * Get active execution IDs.
   */
  getActiveExecutions(): string[] {
    return [...this.activeExecutions.keys()]
  }

  /**
   * Check if an execution is active.
   */
  isExecutionActive(executionId: string): boolean {
    return this.activeExecutions.has(executionId)
  }

  /**
   * Emit an event to all listeners.
   */
  private emitEvent(event: WorkflowEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (_error) {
        // Log listener errors but don't propagate to prevent breaking execution
        if (this.config.debug) {
          // TODO: Add debug logging here
        }
      }
    }
  }

  /**
   * Handle snapshot updates.
   * Emits STEP_STARTED and STEP_COMPLETED events by tracking state changes.
   */
  private handleSnapshot(executionId: string, snapshot: Snapshot<unknown>): void {
    const snapshotWithContext = snapshot as unknown as {
      context?: WorkflowContext
    }
    const context = snapshotWithContext.context
    if (!context) return

    // Initialize tracking sets if needed
    if (!this.executionStartedSteps.has(executionId)) {
      this.executionStartedSteps.set(executionId, new Set())
    }
    if (!this.executionCompletedSteps.has(executionId)) {
      this.executionCompletedSteps.set(executionId, new Set())
    }

    // Safe to assert: we just set these above if they didn't exist
    const startedSteps = this.executionStartedSteps.get(executionId) as Set<string>
    const completedSteps = this.executionCompletedSteps.get(executionId) as Set<string>

    // Emit STEP_STARTED for current step if not already emitted
    if (context.currentStep != null && !startedSteps.has(context.currentStep)) {
      startedSteps.add(context.currentStep)
      this.emitEvent({
        type: "STEP_STARTED",
        executionId,
        stepId: context.currentStep,
        displayName: context.currentStepData?.displayName ?? context.currentStep,
      })

      // Publish step started to Bus for TUI auto-navigation
      // Get session ID from step results if available
      const stepResult = context.stepResults.find((r) => r.stepId === context.currentStep)
      if (stepResult?.sessionID) {
        Bus.publish(WorkflowBusEvents.StepStarted, {
          executionId,
          stepId: context.currentStep,
          sessionId: stepResult.sessionID,
        }).catch(() => {
          // Ignore publish errors
        })
      }

      // Publish execution update to Bus for TUI sidebar
      this.publishExecutionUpdate(executionId, context, "RUNNING")
    }

    // Check for newly completed steps and emit STEP_COMPLETED
    // context.completedSteps is a Set<string>
    if (context.completedSteps.size > 0) {
      for (const stepId of context.completedSteps) {
        if (!completedSteps.has(stepId)) {
          completedSteps.add(stepId)
          const stepOutputs = context.outputs[stepId] ?? {}
          if (this.config.debug) {
            // biome-ignore lint/suspicious/noConsole: Debug logging is intentional when debug mode is enabled
            console.log(`[WorkflowEngine] Emitting STEP_COMPLETED: stepId=${stepId}`)
          }
          this.emitEvent({
            type: "STEP_COMPLETED",
            executionId,
            stepId,
            outputs: stepOutputs,
          })

          // Find the next step session ID for auto-navigation
          let nextStepId: string | undefined
          let nextSessionId: string | undefined
          if (context.currentStep && context.currentStep !== stepId) {
            nextStepId = context.currentStep
            const nextStepResult = context.stepResults.find((r) => r.stepId === context.currentStep)
            nextSessionId = nextStepResult?.sessionID
          }

          // Publish step completed to Bus for TUI auto-navigation
          Bus.publish(WorkflowBusEvents.StepCompleted, {
            executionId,
            stepId,
            status: "COMPLETED",
            nextStepId,
            nextSessionId,
          }).catch(() => {
            // Ignore publish errors
          })

          // Publish execution update to Bus for TUI sidebar
          this.publishExecutionUpdate(executionId, context, "RUNNING")
        }
      }
    }
  }

  /**
   * Create a workflow result from context.
   */
  private createResult(executionId: string, startTime: number, context: WorkflowContext): WorkflowResult {
    const endTime = Date.now()
    let terminateMode: WorkflowTerminateMode = "COMPLETED"

    if (context.error != null) {
      terminateMode = "FAILED"
    }

    return {
      executionId,
      workflowSessionID: context.workflowSessionID, // Include parent session ID
      terminateMode,
      outputs: context.outputs,
      duration: endTime - startTime,
      stepResults: context.stepResults,
      ...(context.error !== null && { error: context.error }),
      startTime,
      endTime,
    }
  }

  /**
   * Create a failed workflow result.
   */
  private createFailedResult(executionId: string, startTime: number, error: string): WorkflowResult {
    const endTime = Date.now()
    return {
      executionId,
      terminateMode: "FAILED",
      outputs: {},
      duration: endTime - startTime,
      stepResults: [],
      error,
      startTime,
      endTime,
    }
  }

  /**
   * Get current execution state.
   *
   * @param executionId - The execution to query
   * @returns Current state name or null if not found
   */
  getState(executionId: string): string | null {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) return null

    const snapshot = actor.getSnapshot() as WorkflowSnapshot
    const value = snapshot.value

    if (typeof value === "string") {
      return value
    }
    if (typeof value === "object" && value !== null) {
      const keys = Object.keys(value)
      const firstKey = keys[0]
      if (firstKey !== undefined && firstKey !== "") {
        const nestedValue = (value as Record<string, string>)[firstKey]
        return `${firstKey}.${nestedValue ?? ""}`
      }
    }
    return null
  }

  /**
   * Get execution progress.
   *
   * @param executionId - The execution to query
   * @returns Progress object with completed, running, and pending steps
   */
  getProgress(executionId: string): ExecutionProgress | null {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) return null

    const snapshot = actor.getSnapshot() as WorkflowSnapshot
    const context = snapshot.context

    return {
      completed: [...context.completedSteps],
      running: context.currentStep != null ? [context.currentStep] : [],
      pending: [...context.pendingSteps],
    }
  }

  /**
   * Get shared context (all step outputs).
   *
   * @param executionId - The execution to query
   * @returns Shared context object or null if not found
   */
  getContext(executionId: string): SharedContext | null {
    const actor = this.activeExecutions.get(executionId)
    if (!actor) return null

    const snapshot = actor.getSnapshot() as WorkflowSnapshot
    return snapshot.context.outputs
  }

  /**
   * Handle step execution events from executors.
   * Transforms step-level events into workflow events and emits them.
   */
  private handleStepExecutionEvent(executionId: string, event: StepExecutionEvent): void {
    if (this.config.debug) {
      // biome-ignore lint/suspicious/noConsole: Debug logging is intentional when debug mode is enabled
      console.log(
        `[WorkflowEngine] Received step event: type=${event.type}, stepId=${event.stepId}, executionId=${executionId}`,
      )
    }
    switch (event.type) {
      case "progress":
        this.emitEvent({
          type: "STEP_PROGRESS",
          executionId,
          stepId: event.stepId,
          content: event.content,
        })
        break
      case "tool_start":
        this.emitEvent({
          type: "TOOL_CALL_STARTED",
          executionId,
          stepId: event.stepId,
          toolCall: {
            id: `${event.stepId}-${event.toolName}-${Date.now()}`,
            name: event.toolName,
            args: event.toolArgs as Record<string, unknown>,
          },
        })
        break
      case "tool_end":
        this.emitEvent({
          type: "TOOL_CALL_COMPLETED",
          executionId,
          stepId: event.stepId,
          toolCall: {
            id: `${event.stepId}-${event.toolName}-${Date.now()}`,
            name: event.toolName,
            args: {},
            result: event.toolResult,
            success: true,
          },
        })
        break
      case "session_created":
        this.emitEvent({
          type: "STEP_SESSION_CREATED",
          executionId,
          stepId: event.stepId,
          sessionID: event.sessionId,
          agentName: event.agentName,
        })
        // Publish to Bus for TUI to update step sessionId immediately
        Bus.publish(WorkflowBusEvents.StepSessionCreated, {
          executionId,
          stepId: event.stepId,
          sessionId: event.sessionId,
          agentName: event.agentName,
        }).catch(() => {
          // Ignore publish errors
        })
        break
    }
  }

  /**
   * Clean up resources for a completed execution.
   */
  private cleanupExecution(executionId: string): void {
    this.activeExecutions.delete(executionId)
    this.executionStartedSteps.delete(executionId)
    this.executionCompletedSteps.delete(executionId)
    // Remove step event emitter from registry
    if (this.executorRegistry) {
      this.executorRegistry.removeStepEventEmitter(executionId)
    }
  }

  /**
   * Build execution summary for TUI display.
   * Creates a summary object suitable for the sidebar workflow panel.
   */
  private buildExecutionSummary(
    executionId: string,
    context: WorkflowContext,
    status: ExecutionSummaryForTUI["status"],
  ): ExecutionSummaryForTUI {
    const steps: StepStatusForTUI[] = []

    // Build step statuses from the graph
    if (context.graph) {
      for (const [stepId, step] of context.graph.nodes) {
        let stepStatus: StepStatusForTUI["status"] = "PENDING"

        if (context.completedSteps.has(stepId)) {
          stepStatus = "COMPLETED"
        } else if (context.skippedSteps.has(stepId)) {
          stepStatus = "SKIPPED"
        } else if (context.currentStep === stepId) {
          stepStatus = "RUNNING"
        } else if (context.error && context.currentStep === stepId) {
          stepStatus = "FAILED"
        }

        // Get session ID from step results if available
        const stepResult = context.stepResults.find((r) => r.stepId === stepId)

        steps.push({
          stepId,
          displayName: step.displayName ?? stepId,
          status: stepStatus,
          sessionId: stepResult?.sessionID,
        })
      }
    }

    return {
      id: executionId,
      workflowName: context.taskId,
      status,
      parentSessionId: context.workflowSessionID,
      steps,
      currentStepId: context.currentStep ?? undefined,
      createdAt: new Date(context.startTime).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Publish execution update to Bus for TUI integration.
   */
  private publishExecutionUpdate(
    executionId: string,
    context: WorkflowContext,
    status: ExecutionSummaryForTUI["status"],
  ): void {
    const summary = this.buildExecutionSummary(executionId, context, status)
    Bus.publish(WorkflowBusEvents.ExecutionUpdated, { execution: summary }).catch((error) => {
      if (this.config.debug) {
        // biome-ignore lint/suspicious/noConsole: Debug logging is intentional when debug mode is enabled
        console.warn(`[WorkflowEngine] Failed to publish execution update: ${error}`)
      }
    })
  }
}
