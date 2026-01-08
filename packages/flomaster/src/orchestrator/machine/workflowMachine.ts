/**
 * Workflow Machine
 *
 * XState v5 state machine for workflow execution.
 * Orchestrates the execution of workflow steps in topological order.
 */

import { fromPromise, setup } from "xstate"
import { executeStep } from "../actors/stepActor.js"
import type {
  ExecuteStepInput,
  ExecuteStepOutput,
  ParsedStep,
  ParsedWorkflow,
  WorkflowActorInput,
  WorkflowContext,
  WorkflowMachineEvent,
} from "../types.js"
import { actions } from "./actions.js"
import { guards } from "./guards.js"

/**
 * XState actor for step execution.
 */
const executeStepActor = fromPromise<ExecuteStepOutput, ExecuteStepInput>(async ({ input }) => executeStep(input))

/**
 * Creates the workflow state machine.
 */
export const workflowMachine = setup({
  types: {
    context: {} as WorkflowContext,
    events: {} as WorkflowMachineEvent,
    input: {} as WorkflowActorInput,
  },
  actors: {
    executeStep: executeStepActor,
  },
  guards,
  actions,
}).createMachine({
  id: "workflow",
  initial: "idle",
  context: ({ input }) => ({
    graph: input.graph,
    taskId: input.taskId,
    executionId: "",
    executionsDir: input.executionsDir,
    workflowSessionID: input.workflowSessionID,
    signal: input.signal,
    outputs: input.outputs ?? {},
    pendingSteps: [],
    currentStep: null,
    currentStepData: null,
    stepResults: [],
    loopStates: new Map(),
    startTime: Date.now(),
    error: null,
    errorStack: null,
    variables: input.variables ?? {},
    retryCount: 0,
    maxRetries: input.maxRetries ?? 3,
    dryRun: input.dryRun ?? false,
    completedSteps: new Set(),
    skippedSteps: new Set(),
    executorRegistry: input.executorRegistry,
  }),
  states: {
    idle: {
      on: {
        START: {
          target: "preparing",
          actions: "initializeWorkflow",
        },
      },
    },
    preparing: {
      always: [{ target: "executing", guard: "hasGraph" }, { target: "failed" }],
    },
    executing: {
      initial: "pickNext",
      states: {
        pickNext: {
          entry: "pickNextStep",
          always: [{ target: "runStep", guard: "hasCurrentStep" }, { target: "#workflow.completed" }],
        },
        runStep: {
          invoke: {
            src: "executeStep",
            input: ({ context }): ExecuteStepInput => ({
              step: context.currentStepData as ParsedStep,
              executionId: context.executionId,
              executionsDir: context.executionsDir,
              workflowSessionID: context.workflowSessionID,
              signal: context.signal,
              outputs: context.outputs,
              variables: context.variables,
              dryRun: context.dryRun,
              loopStates: context.loopStates,
              executorRegistry: context.executorRegistry,
            }),
            onDone: {
              target: "processResult",
              actions: "saveStepOutput",
            },
            onError: {
              target: "handleError",
              actions: "saveError",
            },
          },
        },
        processResult: {
          always: [
            // Loop continuation
            {
              target: "runStep",
              guard: "isLoopContinue",
            },
            // Conditional branching
            {
              target: "pickNext",
              guard: "isConditionalStep",
              actions: "applyConditionalBranch",
            },
            // Normal flow
            {
              target: "pickNext",
              actions: "advanceToNextStep",
            },
          ],
        },
        handleError: {
          always: [
            {
              target: "runStep",
              guard: "canRetry",
              actions: ["clearError", "incrementRetry"],
            },
            { target: "#workflow.failed" },
          ],
        },
      },
    },
    awaitingApproval: {
      on: {
        APPROVE: "executing",
        REJECT: "failed",
        REFINE: {
          target: "executing",
          // TODO(RF-XXX): Implement refinement logic with feedback injection
        },
      },
    },
    completed: {
      type: "final",
    },
    failed: {
      type: "final",
    },
    cancelled: {
      type: "final",
    },
  },
  on: {
    PAUSE: ".awaitingApproval",
    ABORT: ".cancelled",
  },
})

/**
 * Creates a workflow machine with custom configuration.
 */
export function createWorkflowMachine(_graph: ParsedWorkflow) {
  return workflowMachine.provide({
    // Custom actor implementations can be added here
  })
}

export type WorkflowMachine = typeof workflowMachine
