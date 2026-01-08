/**
 * Step Executor Registry Types
 *
 * Type definitions for the pluggable step executor registry.
 * Follows the registry pattern from docs/patterns/registry-patterns.md
 */

import type { ExecuteStepOutput, LoopState, ParsedStep, StepType } from "../types.js"

// ============================================================================
// Execution Event Types (defined here to avoid circular dependency)
// Re-exported from orchestrator/types.ts for backward compatibility
// ============================================================================

/**
 * Events that can be emitted during step execution.
 * Used for progress tracking, tool call monitoring, and session management.
 */
export type StepExecutionEvent =
  | { type: "progress"; stepId: string; content: string }
  | { type: "tool_start"; stepId: string; toolName: string; toolArgs: unknown }
  | { type: "tool_end"; stepId: string; toolName: string; toolResult: unknown }
  | { type: "session_created"; stepId: string; sessionId: string; agentName: string }

/**
 * Callback for emitting step execution events.
 */
export type StepEventEmitter = (event: StepExecutionEvent) => void

// ============================================================================
// Registry Interface (minimal interface to avoid unknown typing)
// ============================================================================

/**
 * Interface for the step executor registry.
 * Used to avoid circular dependency when typing executorRegistry in other modules.
 */
export type StepExecutorRegistryInterface = {
  /** Check if the registry has been initialized with executors */
  isInitialized(): boolean
  /** Get an executor by step type */
  get(type: StepType): StepExecutor | undefined
  /** Get all registered step types */
  getRegisteredTypes(): StepType[]
  /** Set an event emitter for a specific execution */
  setStepEventEmitter(executionId: string, emitter: StepEventEmitter): void
  /** Get the event emitter for a specific execution */
  getStepEventEmitter(executionId: string): StepEventEmitter | undefined
  /** Remove the event emitter for a specific execution */
  removeStepEventEmitter(executionId: string): void
}

/**
 * Context available to executors during step execution.
 * Contains outputs from previous steps, variables, and execution state.
 */
export type ExecutorContext = {
  /** Unique identifier for this workflow execution */
  readonly executionId: string
  /** Absolute path to executions directory (for logs, state files) */
  readonly executionsDir?: string
  /** Outputs from all completed steps, keyed by stepId */
  readonly outputs: Readonly<Record<string, Record<string, unknown>>>
  /** Variables for template interpolation */
  readonly variables: Readonly<Record<string, unknown>>
  /** Whether in dry-run mode (mock execution) */
  readonly dryRun: boolean
  /** Loop states for Loop steps */
  readonly loopStates: ReadonlyMap<string, LoopState>
  /** Parent session ID for the workflow (agent steps create child sessions) */
  readonly workflowSessionID?: string
}

/**
 * Event types that can be emitted during step execution.
 */
export type ExecutorEvent =
  | { type: "progress"; content: string }
  | { type: "tool_start"; toolName: string; toolArgs: unknown }
  | { type: "tool_end"; toolName: string; toolResult: unknown }
  | { type: "session_created"; sessionId: string; agentName: string }

/**
 * Options for step execution.
 */
export type ExecutorOptions = {
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal
  /** Callback for streaming output */
  readonly onStream?: (chunk: string) => void
  /** Callback for emitting execution events (progress, tool calls) */
  readonly onEvent?: (event: ExecutorEvent) => void
  /** Timeout in milliseconds */
  readonly timeout?: number
}

/**
 * Interface that all step executors must implement.
 *
 * Executors are registered with the StepExecutorRegistry and invoked
 * by the WorkflowEngine when a step of the matching type needs to execute.
 *
 * @example
 * ```typescript
 * const promptExecutor: StepExecutor = {
 *   type: 'Prompt',
 *   execute: async (step, context) => {
 *     const template = step.config.config.template;
 *     // ... interpolate template
 *     return { stepId: step.id, outputs: { prompt: result }, complete: true };
 *   }
 * };
 * ```
 */
export type StepExecutor<T extends StepType = StepType> = {
  /**
   * The step type this executor handles.
   * Must match a value from the StepType union.
   */
  readonly type: T

  /**
   * Execute the step and return outputs.
   *
   * @param step - The parsed step to execute
   * @param context - Execution context with outputs, variables, etc.
   * @param options - Optional execution options (signal, streaming, timeout)
   * @returns Promise resolving to step outputs
   * @throws StepExecutionError if execution fails
   */
  execute(step: ParsedStep, context: ExecutorContext, options?: ExecutorOptions): Promise<ExecuteStepOutput>

  /**
   * Optional validation before execution.
   * Called by the engine before execute() to catch configuration errors early.
   *
   * @param step - The step to validate
   * @returns Validation result with errors/warnings
   */
  validate?(step: ParsedStep): ExecutorValidationResult
}

/**
 * Result of validating a step before execution.
 */
export type ExecutorValidationResult = {
  /** Whether the step is valid for execution */
  readonly valid: boolean
  /** Blocking errors that prevent execution */
  readonly errors: readonly string[]
  /** Non-blocking warnings */
  readonly warnings: readonly string[]
}

/**
 * Configuration for the StepExecutorRegistry.
 */
export type StepExecutorRegistryConfig = {
  /** Whether to log debug information */
  readonly debug?: boolean
  /** Whether to allow overwriting existing executors */
  readonly allowOverwrite?: boolean
}

/**
 * Entry in the registry with metadata.
 */
export type ExecutorRegistryEntry = {
  /** The executor instance */
  readonly executor: StepExecutor
  /** Source of registration (built-in, custom, plugin) */
  readonly source: "built-in" | "custom" | "plugin"
  /** When the executor was registered */
  readonly registeredAt: number
}

/**
 * Factory function for creating executors that need dependencies.
 * Used for executors like Agent that require external services.
 *
 * @example
 * ```typescript
 * const createAgentExecutor: StepExecutorFactory<'Agent'> = (deps) => ({
 *   type: 'Agent',
 *   execute: async (step, context, options) => {
 *     const session = await deps.client.session.create();
 *     // ... use session
 *   }
 * });
 * ```
 */
export type StepExecutorFactory<T extends StepType = StepType> = (dependencies: ExecutorDependencies) => StepExecutor<T>

/**
 * Dependencies that can be injected into executor factories.
 */
export type ExecutorDependencies = {
  /**
   * Working directory for session context.
   */
  readonly directory?: string

  /**
   * Function to load a workflow by name or ID.
   * Used by SubFlow executor.
   */
  readonly loadWorkflow?: (nameOrId: string) => Promise<unknown>

  /**
   * Function to execute a loaded workflow.
   * Used by SubFlow executor.
   */
  readonly executeWorkflow?: (workflow: unknown, taskId: string, inputs: Record<string, unknown>) => Promise<unknown>
}

/**
 * Type guard to check if a value is a valid StepExecutor.
 */
export function isStepExecutor(value: unknown): value is StepExecutor {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const executor = value as Record<string, unknown>
  return typeof executor["type"] === "string" && typeof executor["execute"] === "function"
}

/**
 * Type guard to check if a value is a valid ExecutorValidationResult.
 */
export function isExecutorValidationResult(value: unknown): value is ExecutorValidationResult {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const result = value as Record<string, unknown>
  return typeof result["valid"] === "boolean" && Array.isArray(result["errors"]) && Array.isArray(result["warnings"])
}
