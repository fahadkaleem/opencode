/**
 * XState Guards
 *
 * Guard functions for the workflow state machine.
 * Guards determine whether transitions should occur.
 */

import type { AgentConfig, WorkflowContext } from "../types.js"

/**
 * Guard parameters from XState.
 */
type GuardParams = {
  context: WorkflowContext
  event: Record<string, unknown>
}

/**
 * Type guard to check if event has output with complete property.
 *
 * @param event - Event to check
 * @returns True if event has output.complete boolean
 */
export function hasOutputComplete(event: unknown): event is { output: { complete: boolean } } {
  if (typeof event !== "object" || event === null) return false
  const e = event as Record<string, unknown>
  if (typeof e["output"] !== "object" || e["output"] === null) return false
  return typeof (e["output"] as Record<string, unknown>)["complete"] === "boolean"
}

/**
 * Checks if there are more steps in the pending queue.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if pending steps remain, false otherwise
 */
export function hasNextStep({ context }: GuardParams): boolean {
  return context.pendingSteps.length > 0
}

/**
 * Checks if a current step has been selected for execution.
 * This is used after pickNextStep to determine if we should run a step.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if currentStep and currentStepData are both set
 */
export function hasCurrentStep({ context }: GuardParams): boolean {
  return context.currentStep !== null && context.currentStepData !== null
}

/**
 * Checks if the workflow graph has been loaded.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if graph is loaded
 */
export function hasGraph({ context }: GuardParams): boolean {
  return context.graph !== null
}

/**
 * Checks if current step is a conditional router (XState guard).
 *
 * Note: Named with 'guard' prefix to distinguish from parser utility
 * `isConditionalStep` in stepParser.ts which checks ParsedStep type.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if current step type is ConditionalRouter
 */
export function guardIsConditionalStep({ context }: GuardParams): boolean {
  if (!context.currentStepData) return false
  return context.currentStepData.type === "ConditionalRouter"
}

/**
 * Checks if current step is a loop (XState guard).
 *
 * Note: Named with 'guard' prefix to distinguish from parser utility
 * `isLoopStep` in stepParser.ts which checks ParsedStep type.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if current step type is Loop
 */
export function guardIsLoopStep({ context }: GuardParams): boolean {
  if (!context.currentStepData) return false
  return context.currentStepData.type === "Loop"
}

/**
 * Checks if current step is a sub-flow (XState guard).
 *
 * Note: Named with 'guard' prefix to distinguish from parser utility
 * `isSubFlowStep` in stepParser.ts which checks ParsedStep type.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if current step type is SubFlow
 */
export function guardIsSubFlowStep({ context }: GuardParams): boolean {
  if (!context.currentStepData) return false
  return context.currentStepData.type === "SubFlow"
}

/**
 * Checks if a loop should continue iterating.
 * Uses event.output.complete from the step executor response.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @param params.event - The event containing step output
 * @returns True if output.complete is false (more iterations remain)
 */
export function isLoopContinue({ context, event }: GuardParams): boolean {
  if (context.currentStep == null) return false
  if (!hasOutputComplete(event)) return false
  return (event as { output: { complete: boolean } }).output.complete === false
}

/**
 * Checks if a loop has finished all iterations (XState guard).
 *
 * Note: Named with 'guard' prefix to distinguish from actor utility
 * `isLoopComplete` in loopActor.ts which checks LoopState directly.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if loop index has reached or exceeded data length
 */
export function guardIsLoopComplete({ context }: GuardParams): boolean {
  if (context.currentStep == null) return false
  const loopState = context.loopStates.get(context.currentStep)
  if (loopState?.initialized !== true) return false
  return loopState.index >= loopState.data.length
}

/**
 * Checks if the conditional result was true.
 *
 * @param params - Guard parameters from XState
 * @param params.event - The event containing conditional output
 * @returns True if the conditional branch is 'true'
 */
export function isConditionalTrue({ event }: GuardParams): boolean {
  if (event["output"] == null) return false
  const output = event["output"] as Record<string, unknown>
  return output["branch"] === "true"
}

/**
 * Checks if the conditional result was false.
 *
 * @param params - Guard parameters from XState
 * @param params.event - The event containing conditional output
 * @returns True if the conditional branch is 'false'
 */
export function isConditionalFalse({ event }: GuardParams): boolean {
  if (event["output"] == null) return false
  const output = event["output"] as Record<string, unknown>
  return output["branch"] === "false"
}

/**
 * Checks if retry is allowed based on current retry count.
 * Uses per-step maxRetries if configured, otherwise falls back to workflow default.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if retryCount is less than maxRetries
 */
export function canRetry({ context }: GuardParams): boolean {
  // Get maxRetries from current step config, fall back to workflow default
  const stepConfig = context.currentStepData?.config
  const stepMaxRetries = stepConfig?.type === "Agent" ? (stepConfig.config as AgentConfig).maxRetries : undefined
  const maxRetries = stepMaxRetries ?? context.maxRetries

  return context.retryCount < maxRetries
}

/**
 * Checks if all steps have been completed.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if completedSteps size equals graph nodes size
 */
export function isWorkflowComplete({ context }: GuardParams): boolean {
  if (!context.graph) return false
  return context.completedSteps.size === context.graph.nodes.size
}

/**
 * Checks if the workflow has failed with an error.
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if error is not null
 */
export function hasError({ context }: GuardParams): boolean {
  return context.error !== null
}

/**
 * Checks if in dry-run mode (mock execution without side effects).
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if dryRun flag is set
 */
export function isDryRun({ context }: GuardParams): boolean {
  return context.dryRun
}

/**
 * Checks if step execution is complete.
 *
 * @param params - Guard parameters from XState
 * @param params.event - The event containing step output
 * @returns True if output.complete is true
 */
export function isStepComplete({ event }: GuardParams): boolean {
  if (!hasOutputComplete(event)) return false
  const e = event as Record<string, unknown>
  return (e["output"] as Record<string, unknown>)["complete"] === true
}

/**
 * Checks if approval is required for current step.
 *
 * A step requires approval if:
 * 1. The step type is 'HumanInput' or 'Approval'
 * 2. The step config has a 'requiresApproval' flag set to true
 * 3. The step template has a field named 'requiresApproval' with value true
 *
 * @param params - Guard parameters from XState
 * @param params.context - Current workflow context
 * @returns True if the current step requires human approval
 */
export function requiresApproval({ context }: GuardParams): boolean {
  const step = context.currentStepData
  if (!step) return false

  const stepType = step.type
  if (stepType === "HumanInput" || stepType === "Approval") {
    return true
  }

  const config = step.config
  if (typeof config === "object") {
    const configObj = config as { config?: { requiresApproval?: boolean } }
    if (configObj.config?.requiresApproval === true) {
      return true
    }
  }

  const inputs = step.inputs
  if (typeof inputs === "object") {
    if ((inputs as Record<string, unknown>)["requiresApproval"] === true) {
      return true
    }
  }

  return false
}

/**
 * Guards object for XState machine setup.
 *
 * Note: Keys use original names for XState machine compatibility.
 * Guard functions with 'guard' prefix are mapped to their expected names.
 */
export const guards = {
  hasOutputComplete,
  hasNextStep,
  hasCurrentStep,
  hasGraph,
  isConditionalStep: guardIsConditionalStep,
  isLoopStep: guardIsLoopStep,
  isSubFlowStep: guardIsSubFlowStep,
  isLoopContinue,
  isLoopComplete: guardIsLoopComplete,
  isConditionalTrue,
  isConditionalFalse,
  canRetry,
  isWorkflowComplete,
  hasError,
  isDryRun,
  isStepComplete,
  requiresApproval,
}

export type GuardType = keyof typeof guards
