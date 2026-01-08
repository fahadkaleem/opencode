/**
 * XState Guards Tests
 */

import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type { LoopState, ParsedStep, WorkflowContext } from "../types.js"
import {
  canRetry,
  guardIsConditionalStep,
  guardIsLoopComplete,
  guardIsLoopStep,
  guardIsSubFlowStep,
  hasError,
  hasGraph,
  hasNextStep,
  isConditionalFalse,
  isConditionalTrue,
  isDryRun,
  isLoopContinue,
  isStepComplete,
  isWorkflowComplete,
  requiresApproval,
} from "./guards.js"

/**
 * Creates a minimal workflow context for testing.
 */
function createContext(overrides: Partial<WorkflowContext> = {}): WorkflowContext {
  return {
    graph: null,
    taskId: "task-1",
    executionId: "exec-1",
    outputs: {},
    pendingSteps: [],
    currentStep: null,
    currentStepData: null,
    stepResults: [],
    loopStates: new Map(),
    startTime: Date.now(),
    error: null,
    errorStack: null,
    variables: {},
    retryCount: 0,
    maxRetries: 3,
    dryRun: false,
    completedSteps: new Set(),
    skippedSteps: new Set(),
    ...overrides,
  }
}

/**
 * Creates a minimal parsed node for testing.
 */
function createNode(type: ParsedStep["type"], id: string = "test-node"): ParsedStep {
  return {
    id,
    type,
    inputs: {},
    outputs: ["output"],
    position: { x: 0, y: 0 },
    config: { type: "Generic", config: {} },
    displayName: "Test Node",
  }
}

describe("guards", () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  })

  describe("hasNextStep", () => {
    it("should return true when pendingSteps is not empty", () => {
      const context = createContext({ pendingSteps: ["step-1"] })
      expect(hasNextStep({ context, event: {} })).toBe(true)
    })

    it("should return false when pendingSteps is empty", () => {
      const context = createContext({ pendingSteps: [] })
      expect(hasNextStep({ context, event: {} })).toBe(false)
    })
  })

  describe("hasGraph", () => {
    it("should return true when graph is loaded", () => {
      const context = createContext({
        graph: {
          executionOrder: [],
          nodes: new Map(),
          edges: new Map(),
          adjacency: new Map(),
          reverseAdjacency: new Map(),
          entryPoints: [],
          exitPoints: [],
        },
      })
      expect(hasGraph({ context, event: {} })).toBe(true)
    })

    it("should return false when graph is null", () => {
      const context = createContext({ graph: null })
      expect(hasGraph({ context, event: {} })).toBe(false)
    })
  })

  describe("guardIsConditionalStep", () => {
    it("should return true when current step is ConditionalRouter", () => {
      const context = createContext({
        currentStepData: createNode("ConditionalRouter"),
      })
      expect(guardIsConditionalStep({ context, event: {} })).toBe(true)
    })

    it("should return false when current step is not ConditionalRouter", () => {
      const context = createContext({
        currentStepData: createNode("Generic"),
      })
      expect(guardIsConditionalStep({ context, event: {} })).toBe(false)
    })

    it("should return false when currentStepData is null", () => {
      const context = createContext({ currentStepData: null })
      expect(guardIsConditionalStep({ context, event: {} })).toBe(false)
    })
  })

  describe("guardIsLoopStep", () => {
    it("should return true when current step is Loop", () => {
      const context = createContext({
        currentStepData: createNode("Loop"),
      })
      expect(guardIsLoopStep({ context, event: {} })).toBe(true)
    })

    it("should return false when current step is not Loop", () => {
      const context = createContext({
        currentStepData: createNode("Generic"),
      })
      expect(guardIsLoopStep({ context, event: {} })).toBe(false)
    })
  })

  describe("guardIsSubFlowStep", () => {
    it("should return true when current step is SubFlow", () => {
      const context = createContext({
        currentStepData: createNode("SubFlow"),
      })
      expect(guardIsSubFlowStep({ context, event: {} })).toBe(true)
    })

    it("should return false when current step is not SubFlow", () => {
      const context = createContext({
        currentStepData: createNode("Generic"),
      })
      expect(guardIsSubFlowStep({ context, event: {} })).toBe(false)
    })
  })

  describe("isLoopContinue", () => {
    it("should return true when event.output.complete is false", () => {
      const context = createContext({ currentStep: "loop-1" })
      const event = { output: { complete: false } }
      expect(isLoopContinue({ context, event })).toBe(true)
    })

    it("should return false when event.output.complete is true", () => {
      const context = createContext({ currentStep: "loop-1" })
      const event = { output: { complete: true } }
      expect(isLoopContinue({ context, event })).toBe(false)
    })

    it("should return false when event has no output", () => {
      const context = createContext({ currentStep: "loop-1" })
      expect(isLoopContinue({ context, event: {} })).toBe(false)
    })

    it("should return false when currentStep is null", () => {
      const context = createContext({ currentStep: null })
      const event = { output: { complete: false } }
      expect(isLoopContinue({ context, event })).toBe(false)
    })

    // Legacy test kept for documentation - loopState is no longer used by this guard
    it.skip("should return false when loop is not initialized (legacy behavior)", () => {
      const loopState: LoopState = {
        stepId: "loop-1",
        data: [1, 2, 3],
        index: 0,
        aggregated: [],
        initialized: false,
      }
      const context = createContext({
        currentStep: "loop-1",
        loopStates: new Map([["loop-1", loopState]]),
      })
      expect(isLoopContinue({ context, event: {} })).toBe(false)
    })
  })

  describe("guardIsLoopComplete", () => {
    it("should return true when loop index equals data length", () => {
      const loopState: LoopState = {
        stepId: "loop-1",
        data: [1, 2, 3],
        index: 3,
        aggregated: [],
        initialized: true,
      }
      const context = createContext({
        currentStep: "loop-1",
        loopStates: new Map([["loop-1", loopState]]),
      })
      expect(guardIsLoopComplete({ context, event: {} })).toBe(true)
    })

    it("should return false when loop has more items", () => {
      const loopState: LoopState = {
        stepId: "loop-1",
        data: [1, 2, 3],
        index: 1,
        aggregated: [],
        initialized: true,
      }
      const context = createContext({
        currentStep: "loop-1",
        loopStates: new Map([["loop-1", loopState]]),
      })
      expect(guardIsLoopComplete({ context, event: {} })).toBe(false)
    })
  })

  describe("isConditionalTrue", () => {
    it("should return true when branch is true", () => {
      const event = { output: { branch: "true" } }
      const context = createContext()
      expect(isConditionalTrue({ context, event })).toBe(true)
    })

    it("should return false when branch is false", () => {
      const event = { output: { branch: "false" } }
      const context = createContext()
      expect(isConditionalTrue({ context, event })).toBe(false)
    })

    it("should return false when output is missing", () => {
      const event = {}
      const context = createContext()
      expect(isConditionalTrue({ context, event })).toBe(false)
    })
  })

  describe("isConditionalFalse", () => {
    it("should return true when branch is false", () => {
      const event = { output: { branch: "false" } }
      const context = createContext()
      expect(isConditionalFalse({ context, event })).toBe(true)
    })

    it("should return false when branch is true", () => {
      const event = { output: { branch: "true" } }
      const context = createContext()
      expect(isConditionalFalse({ context, event })).toBe(false)
    })
  })

  describe("canRetry", () => {
    it("should return true when retryCount is less than maxRetries", () => {
      const context = createContext({ retryCount: 1, maxRetries: 3 })
      expect(canRetry({ context, event: {} })).toBe(true)
    })

    it("should return false when retryCount equals maxRetries", () => {
      const context = createContext({ retryCount: 3, maxRetries: 3 })
      expect(canRetry({ context, event: {} })).toBe(false)
    })

    // TASK-10: Per-step maxRetries tests
    it("should use step maxRetries when configured on Agent step", () => {
      const stepWithMaxRetries: ParsedStep = {
        id: "agent-step",
        type: "Agent",
        inputs: {},
        outputs: ["response"],
        position: { x: 0, y: 0 },
        config: {
          type: "Agent",
          config: { agentType: "build", maxRetries: 2 },
        },
        displayName: "Test Agent",
      }
      const context = createContext({
        retryCount: 1,
        maxRetries: 3, // workflow default - should be ignored
        currentStepData: stepWithMaxRetries,
      })
      expect(canRetry({ context, event: {} })).toBe(true)

      const context2 = createContext({
        retryCount: 2,
        maxRetries: 3, // workflow default
        currentStepData: stepWithMaxRetries, // step max is 2
      })
      expect(canRetry({ context: context2, event: {} })).toBe(false)
    })

    it("should fall back to workflow maxRetries when step has no config", () => {
      const stepWithoutMaxRetries: ParsedStep = {
        id: "agent-step",
        type: "Agent",
        inputs: {},
        outputs: ["response"],
        position: { x: 0, y: 0 },
        config: {
          type: "Agent",
          config: { agentType: "build" }, // no maxRetries
        },
        displayName: "Test Agent",
      }
      const context = createContext({
        retryCount: 2,
        maxRetries: 3,
        currentStepData: stepWithoutMaxRetries,
      })
      expect(canRetry({ context, event: {} })).toBe(true)

      const context2 = createContext({
        retryCount: 3,
        maxRetries: 3,
        currentStepData: stepWithoutMaxRetries,
      })
      expect(canRetry({ context: context2, event: {} })).toBe(false)
    })

    it("should allow zero retries (maxRetries: 0)", () => {
      const stepWithZeroRetries: ParsedStep = {
        id: "agent-step",
        type: "Agent",
        inputs: {},
        outputs: ["response"],
        position: { x: 0, y: 0 },
        config: {
          type: "Agent",
          config: { agentType: "build", maxRetries: 0 },
        },
        displayName: "Test Agent",
      }
      const context = createContext({
        retryCount: 0,
        maxRetries: 3,
        currentStepData: stepWithZeroRetries,
      })
      // retryCount 0 is NOT less than maxRetries 0
      expect(canRetry({ context, event: {} })).toBe(false)
    })

    it("should allow more retries than workflow default", () => {
      const stepWithMoreRetries: ParsedStep = {
        id: "agent-step",
        type: "Agent",
        inputs: {},
        outputs: ["response"],
        position: { x: 0, y: 0 },
        config: {
          type: "Agent",
          config: { agentType: "build", maxRetries: 5 },
        },
        displayName: "Test Agent",
      }
      const context = createContext({
        retryCount: 4,
        maxRetries: 3, // workflow default is 3
        currentStepData: stepWithMoreRetries, // step allows 5
      })
      expect(canRetry({ context, event: {} })).toBe(true)

      const context2 = createContext({
        retryCount: 5,
        maxRetries: 3,
        currentStepData: stepWithMoreRetries,
      })
      expect(canRetry({ context: context2, event: {} })).toBe(false)
    })
  })

  describe("isWorkflowComplete", () => {
    it("should return true when all nodes are completed", () => {
      const nodes = new Map([
        ["node-1", createNode("Generic", "node-1")],
        ["node-2", createNode("Generic", "node-2")],
      ])
      const context = createContext({
        graph: {
          executionOrder: ["node-1", "node-2"],
          nodes,
          edges: new Map(),
          adjacency: new Map(),
          reverseAdjacency: new Map(),
          entryPoints: ["node-1"],
          exitPoints: ["node-2"],
        },
        completedSteps: new Set(["node-1", "node-2"]),
      })
      expect(isWorkflowComplete({ context, event: {} })).toBe(true)
    })

    it("should return false when not all nodes are completed", () => {
      const nodes = new Map([
        ["node-1", createNode("Generic", "node-1")],
        ["node-2", createNode("Generic", "node-2")],
      ])
      const context = createContext({
        graph: {
          executionOrder: ["node-1", "node-2"],
          nodes,
          edges: new Map(),
          adjacency: new Map(),
          reverseAdjacency: new Map(),
          entryPoints: ["node-1"],
          exitPoints: ["node-2"],
        },
        completedSteps: new Set(["node-1"]),
      })
      expect(isWorkflowComplete({ context, event: {} })).toBe(false)
    })
  })

  describe("hasError", () => {
    it("should return true when error is set", () => {
      const context = createContext({ error: "Something went wrong" })
      expect(hasError({ context, event: {} })).toBe(true)
    })

    it("should return false when error is null", () => {
      const context = createContext({ error: null })
      expect(hasError({ context, event: {} })).toBe(false)
    })
  })

  describe("isDryRun", () => {
    it("should return true when dryRun is true", () => {
      const context = createContext({ dryRun: true })
      expect(isDryRun({ context, event: {} })).toBe(true)
    })

    it("should return false when dryRun is false", () => {
      const context = createContext({ dryRun: false })
      expect(isDryRun({ context, event: {} })).toBe(false)
    })
  })

  describe("isStepComplete", () => {
    it("should return true when output.complete is true", () => {
      const event = { output: { complete: true } }
      const context = createContext()
      expect(isStepComplete({ context, event })).toBe(true)
    })

    it("should return false when output.complete is false", () => {
      const event = { output: { complete: false } }
      const context = createContext()
      expect(isStepComplete({ context, event })).toBe(false)
    })
  })

  describe("requiresApproval", () => {
    it("should return false by default", () => {
      const context = createContext()
      expect(requiresApproval({ context, event: {} })).toBe(false)
    })
  })
})
