/**
 * XState Actions
 *
 * Action functions for the workflow state machine.
 * Actions are side-effect functions that modify context or emit events.
 */

import { assign } from 'xstate';
import { getNextRunnableSteps } from '../parser/workflowParser.js';
import type {
  LoopState,
  ParsedWorkflow,
  StepResult,
  StepStatus,
  WorkflowContext,
} from '../types.js';
import { generateExecutionId } from '../utils/idGenerator.js';

/**
 * Helper to safely get context properties.
 */
function getContext(ctx: unknown): WorkflowContext {
  return ctx as WorkflowContext;
}

/**
 * Initializes the workflow with a graph and task ID.
 */
export const initializeWorkflow = assign(({ event }) => {
  const startEvent = event as {
    type: 'START';
    graph: ParsedWorkflow;
    taskId: string;
    variables?: Record<string, unknown>;
  };
  const graph = startEvent.graph;

  return {
    graph,
    taskId: startEvent.taskId,
    executionId: generateExecutionId(),
    pendingSteps: [...graph.entryPoints],
    variables: startEvent.variables ?? {},
    startTime: Date.now(),
    completedSteps: new Set<string>(),
    skippedSteps: new Set<string>(),
  };
});

/**
 * Picks the next step to execute from pending steps.
 */
export const pickNextStep = assign(({ context }) => {
  const ctx = getContext(context);
  if (ctx.pendingSteps.length === 0) {
    return {
      currentStep: null,
      currentStepData: null,
    };
  }

  const nextStepId = ctx.pendingSteps[0];
  if (nextStepId === undefined) {
    return {
      currentStep: null,
      currentStepData: null,
    };
  }
  const nextStep = ctx.graph?.nodes.get(nextStepId) ?? null;

  return {
    currentStep: nextStepId,
    currentStepData: nextStep,
    pendingSteps: ctx.pendingSteps.slice(1),
    retryCount: 0,
  };
});

/**
 * Saves the output from a completed step.
 */
export const saveStepOutput = assign(({ context, event }) => {
  const ctx = getContext(context);
  const doneEvent = event as {
    type: 'xstate.done.actor.*';
    output: {
      stepId: string;
      outputs: Record<string, unknown>;
      loopState?: LoopState;
    };
  };
  const { stepId, outputs, loopState } = doneEvent.output;

  const newOutputs = {
    ...ctx.outputs,
    [stepId]: outputs,
  };

  const newLoopStates = new Map(ctx.loopStates);
  if (loopState) {
    newLoopStates.set(stepId, loopState);
  }

  const newCompletedSteps = new Set(ctx.completedSteps);
  newCompletedSteps.add(stepId);

  const stepResult: StepResult = {
    stepId,
    displayName: ctx.currentStepData?.displayName ?? stepId,
    status: 'COMPLETED' as StepStatus,
    outputs,
    startTime: ctx.startTime,
    endTime: Date.now(),
    duration: Date.now() - ctx.startTime,
    retryCount: ctx.retryCount,
  };

  return {
    outputs: newOutputs,
    loopStates: newLoopStates,
    completedSteps: newCompletedSteps,
    stepResults: [...ctx.stepResults, stepResult],
  };
});

/**
 * Saves an error from a failed node.
 */
export const saveError = assign(({ context, event }) => {
  const ctx = getContext(context);
  const errorEvent = event as { type: 'xstate.error.actor.*'; error: Error };
  const error = errorEvent.error;
  const stackTrace = error.stack;

  const stepResult: StepResult = {
    stepId: ctx.currentStep ?? 'unknown',
    displayName: ctx.currentStepData?.displayName ?? 'unknown',
    status: 'FAILED' as StepStatus,
    outputs: {},
    error: error.message,
    ...(stackTrace !== undefined && { stackTrace }),
    startTime: ctx.startTime,
    endTime: Date.now(),
    duration: Date.now() - ctx.startTime,
    retryCount: ctx.retryCount,
  };

  return {
    error: error.message,
    errorStack: error.stack ?? null,
    stepResults: [...ctx.stepResults, stepResult],
  };
});

/**
 * Advances to the next runnable steps.
 */
export const advanceToNextStep = assign(({ context }) => {
  const ctx = getContext(context);
  if (ctx.graph == null || ctx.currentStep == null) {
    return { pendingSteps: [] as string[] };
  }

  const nextSteps = getNextRunnableSteps(
    ctx.currentStep,
    ctx.graph,
    ctx.completedSteps,
  );

  const newPending = [
    ...ctx.pendingSteps,
    ...nextSteps.filter((s: string) => !ctx.pendingSteps.includes(s)),
  ];

  return {
    pendingSteps: newPending,
    currentStep: null,
    currentStepData: null,
  };
});

/**
 * Applies conditional branching based on result.
 */
export const applyConditionalBranch = assign(({ context, event }) => {
  const ctx = getContext(context);
  if (ctx.graph == null || ctx.currentStep == null) {
    return {};
  }

  const doneEvent = event as {
    type: 'xstate.done.actor.*';
    output: { branch: 'true' | 'false'; skipSteps?: string[] };
  };
  const { skipSteps = [] } = doneEvent.output;

  const successors = ctx.graph.adjacency.get(ctx.currentStep) ?? [];

  // Determine which steps to skip based on branch
  // This requires knowing which edges lead to which branch
  // For now, we add all successors to pending
  const newPending = [
    ...ctx.pendingSteps,
    ...successors.filter(
      (s: string) => !ctx.pendingSteps.includes(s) && !skipSteps.includes(s),
    ),
  ];

  const newSkipped = new Set(ctx.skippedSteps);
  for (const stepId of skipSteps) {
    newSkipped.add(stepId);
  }

  return {
    pendingSteps: newPending,
    skippedSteps: newSkipped,
    currentStep: null,
    currentStepData: null,
  };
});

/**
 * Advances loop to next iteration (XState action).
 *
 * Note: Named with 'action' prefix to distinguish from actor utility
 * `advanceLoop` in loopActor.ts which operates on LoopState directly.
 */
export const actionAdvanceLoop = assign(({ context }) => {
  const ctx = getContext(context);
  if (ctx.currentStep === null) {
    return {};
  }

  const loopState = ctx.loopStates.get(ctx.currentStep);
  if (loopState == null) {
    return {};
  }

  const newLoopStates = new Map(ctx.loopStates);
  newLoopStates.set(ctx.currentStep, {
    ...loopState,
    index: loopState.index + 1,
  });

  return {
    loopStates: newLoopStates,
  };
});

/**
 * Increments retry count.
 */
export const incrementRetry = assign(({ context }) => {
  const ctx = getContext(context);
  return {
    retryCount: ctx.retryCount + 1,
  };
});

/**
 * Clears the error state.
 */
export const clearError = assign(() => ({
  error: null,
  errorStack: null,
}));

/**
 * Rewinds to a previous step for refinement.
 */
export const rewindToPreviousStep = assign(({ context, event }) => {
  const ctx = getContext(context);
  const refineEvent = event as { type: 'REFINE'; feedback: string };

  const lastResult = ctx.stepResults[ctx.stepResults.length - 1];
  if (!lastResult) {
    return {};
  }

  const newCompleted = new Set(ctx.completedSteps);
  newCompleted.delete(lastResult.stepId);

  return {
    pendingSteps: [lastResult.stepId, ...ctx.pendingSteps],
    completedSteps: newCompleted,
    stepResults: ctx.stepResults.slice(0, -1),
    variables: {
      ...ctx.variables,
      refinementFeedback: refineEvent.feedback,
    },
  };
});

/**
 * Actions object for XState machine setup.
 *
 * Note: Keys use original names for XState machine compatibility.
 * Action functions with 'action' prefix are mapped to their expected names.
 */
export const actions = {
  initializeWorkflow,
  pickNextStep,
  saveStepOutput,
  saveError,
  advanceToNextStep,
  applyConditionalBranch,
  advanceLoop: actionAdvanceLoop,
  incrementRetry,
  clearError,
  rewindToPreviousStep,
};

export type ActionType = keyof typeof actions;
