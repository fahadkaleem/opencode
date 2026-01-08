/**
 * XState Actions
 *
 * Action functions for the workflow state machine.
 * Actions are side-effect functions that modify context or emit events.
 */

import { assign } from 'xstate';
import { getNextRunnableSteps } from '../parser/workflowParser';
import { StepExecutionStatus } from '../../state/types';
import type { LoopState, ParsedWorkflow, StepResult, WorkflowContext } from '../types';
import { generateExecutionId } from '../utils/idGenerator';

/**
 * Helper to safely get context properties.
 */
function getContext(ctx: unknown): WorkflowContext {
  return ctx as WorkflowContext;
}

/**
 * Initializes the workflow with a graph and task ID.
 * Handles both fresh start and resume from previousOutputs.
 */
export const initializeWorkflow = assign(({ context, event }) => {
  const ctx = getContext(context);
  const startEvent = event as {
    type: 'START';
    graph: ParsedWorkflow;
    taskId: string;
    variables?: Record<string, unknown>;
    executionId?: string;
  };
  const graph = startEvent.graph;

  // Check if we have previousOutputs (from resume operation)
  // Steps with existing outputs are considered already completed
  const previousOutputs = ctx.outputs ?? {};
  const alreadyCompletedSteps = new Set<string>(Object.keys(previousOutputs));

  // Determine entry points, accounting for already-completed steps
  let initialPendingSteps: string[];
  if (alreadyCompletedSteps.size > 0) {
    // Resume mode: find the next runnable steps after completed ones
    const pendingSet = new Set<string>();

    // Start with entry points that aren't completed
    for (const entryPoint of graph.entryPoints) {
      if (!alreadyCompletedSteps.has(entryPoint)) {
        pendingSet.add(entryPoint);
      }
    }

    // For each completed step, find successors that can now run
    for (const completedId of alreadyCompletedSteps) {
      const successors = graph.adjacency.get(completedId) ?? [];
      for (const successor of successors) {
        // Check if all predecessors of this successor are completed
        const predecessors = graph.reverseAdjacency.get(successor) ?? [];
        const allPredecessorsComplete = predecessors.every((pred) => alreadyCompletedSteps.has(pred));
        if (allPredecessorsComplete && !alreadyCompletedSteps.has(successor)) {
          pendingSet.add(successor);
        }
      }
    }

    initialPendingSteps = [...pendingSet];
  } else {
    // Normal mode: start from entry points
    initialPendingSteps = [...graph.entryPoints];
  }

  return {
    graph,
    taskId: startEvent.taskId,
    // Use provided executionId or generate a new one
    executionId: startEvent.executionId ?? generateExecutionId(),
    pendingSteps: initialPendingSteps,
    variables: startEvent.variables ?? {},
    startTime: Date.now(),
    completedSteps: alreadyCompletedSteps,
    skippedSteps: new Set<string>(),
    loopStates: new Map<string, LoopState>(),
    stepResults: [],
    error: null,
    errorStack: null,
    retryCount: 0,
  };
});

/**
 * Picks the next step to execute from pending steps.
 */
export const pickNextStep = assign(({ context }) => {
  const ctx = getContext(context);
  if (ctx.pendingSteps.length === 0) {
    return { currentStep: null, currentStepData: null };
  }

  const nextStepId = ctx.pendingSteps[0];
  if (nextStepId === undefined || nextStepId === '') {
    return { currentStep: null, currentStepData: null };
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
      sessionID?: string;
      loopState?: LoopState;
    };
  };
  const { stepId, outputs, sessionID, loopState } = doneEvent.output;

  const newOutputs = { ...ctx.outputs, [stepId]: outputs };
  const newLoopStates = new Map(ctx.loopStates);
  if (loopState) {
    newLoopStates.set(stepId, loopState);
  }
  const newCompleted = new Set(ctx.completedSteps);
  newCompleted.add(stepId);

  return {
    outputs: newOutputs,
    loopStates: newLoopStates,
    completedSteps: newCompleted,
    stepResults: [
      ...ctx.stepResults,
      {
        stepId,
        displayName: ctx.currentStepData?.displayName ?? stepId,
        status: StepExecutionStatus.COMPLETED,
        outputs,
        ...(sessionID !== undefined && { sessionID }), // Conditional spread for UI access
        startTime: ctx.startTime,
        endTime: Date.now(),
        duration: Date.now() - ctx.startTime,
        retryCount: ctx.retryCount,
      },
    ],
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
    status: StepExecutionStatus.FAILED,
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
