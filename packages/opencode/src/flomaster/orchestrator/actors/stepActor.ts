/**
 * Step Actor
 *
 * XState actor for executing a single step in the workflow graph.
 * Uses the StepExecutorRegistry for pluggable step execution.
 */

import { fromPromise } from "xstate"
import { StepExecutionError } from "../errors"
import type { StepExecutorRegistry } from "../registry/stepExecutorRegistry"
import type { ExecutorContext, ExecutorOptions } from "../registry/types"
import type { ExecuteStepInput, ExecuteStepOutput, LoopState, StepExecutionEvent } from "../types"
import { advanceLoop } from "./loopActor"

// Re-export for backward compatibility
export { StepExecutionError } from "../errors"

/**
 * Advances a loop to the next iteration.
 */
export function advanceLoopState(
  loopStates: Map<string, LoopState>,
  nodeId: string,
  aggregateValue?: unknown,
): Map<string, LoopState> {
  const newStates = new Map(loopStates)
  const currentState = newStates.get(nodeId)

  if (currentState) {
    newStates.set(nodeId, advanceLoop(currentState, aggregateValue))
  }

  return newStates
}

/**
 * Build executor context from step input.
 */
function buildExecutorContext(input: ExecuteStepInput): ExecutorContext {
  return {
    executionId: input.executionId,
    executionsDir: input.executionsDir,
    outputs: input.outputs,
    variables: input.variables,
    dryRun: input.dryRun,
    loopStates: input.loopStates,
    workflowSessionID: input.workflowSessionID,
  }
}

/**
 * Main execute step function.
 * Uses the registry to dispatch to the appropriate executor.
 */
export async function executeStep(input: ExecuteStepInput): Promise<ExecuteStepOutput> {
  const { step, executorRegistry } = input

  if (executorRegistry == null) {
    throw new StepExecutionError(
      `No executor registry provided for step ${step.id}. ` +
        "Ensure the WorkflowEngine is configured with a StepExecutorRegistry.",
      step.id,
    )
  }

  // Cast to typed registry (typed as unknown in types.ts to avoid circular deps)
  const registry = executorRegistry as StepExecutorRegistry

  if (!registry.isInitialized()) {
    throw new StepExecutionError(
      `Executor registry not initialized for step ${step.id}. ` +
        "Call registry.initialize() before executing workflows.",
      step.id,
    )
  }

  const executor = registry.get(step.type)
  if (!executor) {
    throw new StepExecutionError(
      `No executor registered for step type: ${step.type}. ` +
        `Available types: ${registry.getRegisteredTypes().join(", ")}`,
      step.id,
    )
  }

  const context = buildExecutorContext(input)

  // Get step event emitter from registry (set by WorkflowEngine)
  const stepEventEmitter = registry.getStepEventEmitter(input.executionId)

  // Build executor options with signal and event callback
  // Signal comes from input (ExecuteStepInput.signal), passed via options (ExecutorOptions.signal)
  const options: ExecutorOptions = {
    ...(input.signal !== undefined && { signal: input.signal }),
    ...(stepEventEmitter !== undefined && {
      onEvent: (event) => {
        // Transform ExecutorEvent to StepExecutionEvent by adding stepId
        const stepEvent: StepExecutionEvent = {
          ...event,
          stepId: step.id,
        }
        stepEventEmitter(stepEvent)
      },
    }),
  }

  try {
    return await executor.execute(step, context, options)
  } catch (error) {
    if (error instanceof StepExecutionError) {
      throw error
    }
    throw new StepExecutionError(
      `Failed to execute step ${step.id} (${step.type}): ${error instanceof Error ? error.message : String(error)}`,
      step.id,
      error instanceof Error ? error : undefined,
    )
  }
}

/**
 * XState actor for executing a step.
 */
export const executeStepActor = fromPromise<ExecuteStepOutput, ExecuteStepInput>(async ({ input }) =>
  executeStep(input),
)
