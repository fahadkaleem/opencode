/**
 * Orchestrator Error Classes
 *
 * Consolidated error classes for workflow execution.
 * All step-type-specific errors extend StepExecutionError for consistent handling.
 */

/**
 * Base error class for step execution failures.
 * All step-type-specific errors extend this class.
 *
 * @example
 * ```typescript
 * // Catch any step execution error
 * try {
 *   await executor.execute(step, context);
 * } catch (error) {
 *   if (error instanceof StepExecutionError) {
 *     console.error(`Step ${error.stepId} failed: ${error.message}`);
 *   }
 * }
 * ```
 */
export class StepExecutionError extends Error {
  readonly stepId: string
  override readonly cause?: Error

  constructor(message: string, stepId: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.stepId = stepId
    if (cause !== undefined) {
      this.cause = cause
    }
  }

  /**
   * Alias for `cause` for backward compatibility.
   * @deprecated Use `cause` instead.
   */
  get originalCause(): Error | undefined {
    return this.cause
  }
}

/**
 * Error thrown when agent step execution fails.
 */
export class AgentExecutionError extends StepExecutionError {}

/**
 * Error thrown when loop step execution fails.
 */
export class LoopExecutionError extends StepExecutionError {}

/**
 * Error thrown when conditional step execution fails.
 */
export class ConditionalExecutionError extends StepExecutionError {}

/**
 * Error thrown when prompt step execution fails.
 */
export class PromptExecutionError extends StepExecutionError {}

/**
 * Error thrown when subflow step execution fails.
 * Extends StepExecutionError with additional subflow-specific context.
 */
export class SubFlowExecutionError extends StepExecutionError {
  readonly flowId?: string
  readonly flowName?: string

  constructor(
    message: string,
    flowId?: string,
    flowName?: string,
    cause?: Error,
  ) {
    // Use flowId or flowName as stepId for the base class
    super(message, flowId ?? flowName ?? 'unknown-subflow', cause)
    this.flowId = flowId
    this.flowName = flowName
  }
}
