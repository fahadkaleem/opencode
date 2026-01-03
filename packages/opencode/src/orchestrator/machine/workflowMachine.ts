/**
 * Workflow Machine
 *
 * XState v5 state machine for workflow execution.
 * Orchestrates the execution of workflow steps in topological order.
 */

import { assign, fromPromise, setup } from "xstate"
import { executeStep } from "../actors/stepActor.js"
import { getNextRunnableSteps } from "../parser/workflowParser.js"
import type {
  ExecuteStepInput,
  ExecuteStepOutput,
  LoopState,
  ParsedStep,
  ParsedWorkflow,
  StepResult,
  WorkflowActorInput,
  WorkflowContext,
  WorkflowMachineEvent,
} from "../types.js"
import { generateExecutionId } from "../utils/idGenerator.js"
import { hasOutputComplete } from "./guards.js"

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
  guards: {
    hasNextStep: ({ context }) => context.pendingSteps.length > 0,
    hasCurrentStep: ({ context }) => context.currentStep !== null && context.currentStepData !== null,
    hasGraph: ({ context }) => context.graph !== null,
    isConditionalStep: ({ context }) => context.currentStepData?.type === "ConditionalRouter",
    isLoopStep: ({ context }) => context.currentStepData?.type === "Loop",
    isLoopContinue: ({ context, event }) => {
      if (context.currentStep == null) return false
      if (!hasOutputComplete(event)) return false
      return event.output.complete === false
    },
    canRetry: ({ context }) => context.retryCount < context.maxRetries,
    isStepComplete: ({ event }) => {
      if (!hasOutputComplete(event)) return false
      return event.output.complete === true
    },
  },
  actions: {
    initializeWorkflow: assign(({ event }) => {
      const e = event as {
        type: "START"
        graph: ParsedWorkflow
        taskId: string
        variables?: Record<string, unknown>
        executionId?: string
      }
      return {
        graph: e.graph,
        taskId: e.taskId,
        // Use provided executionId or generate a new one
        executionId: e.executionId ?? generateExecutionId(),
        pendingSteps: [...e.graph.entryPoints],
        variables: e.variables ?? {},
        startTime: Date.now(),
        completedSteps: new Set<string>(),
        skippedSteps: new Set<string>(),
        loopStates: new Map<string, LoopState>(),
        stepResults: [],
        error: null,
        errorStack: null,
        retryCount: 0,
      }
    }),
    pickNextStep: assign(({ context }) => {
      if (context.pendingSteps.length === 0) {
        return { currentStep: null, currentStepData: null }
      }
      const nextStepId = context.pendingSteps[0]
      if (nextStepId === undefined || nextStepId === "") {
        return { currentStep: null, currentStepData: null }
      }
      const nextStep = context.graph?.nodes.get(nextStepId) ?? null
      return {
        currentStep: nextStepId,
        currentStepData: nextStep,
        pendingSteps: context.pendingSteps.slice(1),
        retryCount: 0,
      }
    }),
    saveStepOutput: assign(({ context, event }) => {
      const e = event as unknown as { output: ExecuteStepOutput }
      const { stepId, outputs, loopState } = e.output

      const newOutputs = { ...context.outputs, [stepId]: outputs }
      const newLoopStates = new Map(context.loopStates)
      if (loopState) {
        newLoopStates.set(stepId, loopState)
      }
      const newCompleted = new Set(context.completedSteps)
      newCompleted.add(stepId)

      return {
        outputs: newOutputs,
        loopStates: newLoopStates,
        completedSteps: newCompleted,
        stepResults: [
          ...context.stepResults,
          {
            stepId,
            displayName: context.currentStepData?.displayName ?? stepId,
            status: "COMPLETED" as const,
            outputs,
            startTime: context.startTime,
            endTime: Date.now(),
            duration: Date.now() - context.startTime,
            retryCount: context.retryCount,
          },
        ],
      }
    }),
    saveError: assign(({ context, event }) => {
      const e = event as unknown as { error: Error }
      const stepResult: StepResult = {
        stepId: context.currentStep ?? "unknown",
        displayName: context.currentStepData?.displayName ?? "unknown",
        status: "FAILED" as const,
        outputs: {},
        error: e.error.message,
        ...(e.error.stack !== undefined && { stackTrace: e.error.stack }),
        startTime: context.startTime,
        endTime: Date.now(),
        duration: Date.now() - context.startTime,
        retryCount: context.retryCount,
      }
      return {
        error: e.error.message,
        errorStack: e.error.stack ?? null,
        stepResults: [...context.stepResults, stepResult],
      }
    }),
    advanceToNextStep: assign(({ context }) => {
      if (context.graph == null || context.currentStep == null) {
        return { pendingSteps: [], currentStep: null, currentStepData: null }
      }
      const nextSteps = getNextRunnableSteps(context.currentStep, context.graph, context.completedSteps)
      const newPending = [...context.pendingSteps, ...nextSteps.filter((s) => !context.pendingSteps.includes(s))]
      return {
        pendingSteps: newPending,
        currentStep: null,
        currentStepData: null,
      }
    }),
    applyConditionalBranch: assign(({ context, event }) => {
      if (context.graph == null || context.currentStep == null) return {}
      const e = event as unknown as {
        output: { branch: "true" | "false"; skipSteps?: string[] }
      }
      const { skipSteps = [] } = e.output
      const successors = context.graph.adjacency.get(context.currentStep) ?? []
      const newPending = [
        ...context.pendingSteps,
        ...successors.filter((s) => !context.pendingSteps.includes(s) && !skipSteps.includes(s)),
      ]
      const newSkipped = new Set(context.skippedSteps)
      for (const stepId of skipSteps) {
        newSkipped.add(stepId)
      }
      return {
        pendingSteps: newPending,
        skippedSteps: newSkipped,
        currentStep: null,
        currentStepData: null,
      }
    }),
    incrementRetry: assign(({ context }) => ({
      retryCount: context.retryCount + 1,
    })),
    clearError: assign(() => ({ error: null, errorStack: null })),
  },
}).createMachine({
  id: "workflow",
  initial: "idle",
  context: ({ input }) => ({
    graph: input.graph,
    taskId: input.taskId,
    executionId: "",
    workflowSessionID: input.workflowSessionID,
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
              workflowSessionID: context.workflowSessionID,
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
