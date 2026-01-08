/**
 * Step Actor Tests
 *
 * Tests for the step execution actor using the StepExecutorRegistry.
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test"
import { createStepExecutorRegistry, type StepExecutorRegistry } from "../registry/stepExecutorRegistry"
import type { StepExecutor } from "../registry/types"
import type { ExecuteStepInput, LoopState, ParsedStep } from "../types"
import { executeStep, StepExecutionError } from "./stepActor"

// Helper to create a minimal parsed step
function createStep(overrides: Partial<ParsedStep>): ParsedStep {
  return {
    id: "test-step",
    type: "Generic",
    inputs: {},
    outputs: [],
    position: { x: 0, y: 0 },
    config: { type: "Generic", config: {} },
    displayName: "Test Step",
    ...overrides,
  }
}

// Helper to create execute step input with registry
function createInput(
  registry: StepExecutorRegistry,
  overrides: Partial<Omit<ExecuteStepInput, "executorRegistry">> = {},
): ExecuteStepInput {
  return {
    step: createStep({}),
    executionId: "test-execution-id",
    outputs: {},
    variables: {},
    dryRun: false,
    loopStates: new Map(),
    executorRegistry: registry,
    ...overrides,
  }
}

describe("executeStep", () => {
  let registry: StepExecutorRegistry

  beforeEach(async () => {
    registry = createStepExecutorRegistry({ debug: false })
    await registry.initialize()
  })

  afterEach(() => {
    // Bun auto-restores mocks;
    registry.clear()
  })

  describe("Registry validation", () => {
    it("should throw when no registry is provided", async () => {
      const input: ExecuteStepInput = {
        step: createStep({}),
        executionId: "test-execution-id",
        outputs: {},
        variables: {},
        dryRun: false,
        loopStates: new Map(),
        // No executorRegistry
      }

      await expect(executeStep(input)).rejects.toThrow(StepExecutionError)
      await expect(executeStep(input)).rejects.toThrow("No executor registry provided")
    })

    it("should throw when registry is not initialized", async () => {
      const uninitializedRegistry = createStepExecutorRegistry()
      // Don't call initialize()

      const input: ExecuteStepInput = {
        step: createStep({}),
        executionId: "test-execution-id",
        outputs: {},
        variables: {},
        dryRun: false,
        loopStates: new Map(),
        executorRegistry: uninitializedRegistry,
      }

      await expect(executeStep(input)).rejects.toThrow(StepExecutionError)
      await expect(executeStep(input)).rejects.toThrow("not initialized")
    })

    it("should throw when no executor found for step type", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "UnknownType" as ParsedStep["type"],
        }),
      })

      await expect(executeStep(input)).rejects.toThrow(StepExecutionError)
      await expect(executeStep(input)).rejects.toThrow("No executor registered")
    })
  })

  describe("Generic step", () => {
    it("should pass through inputs as outputs", async () => {
      const input = createInput(registry, {
        step: createStep({ type: "Generic" }),
        outputs: {
          "prev-step": { value: "test-value", count: 42 },
        },
      })

      const result = await executeStep(input)

      expect(result.stepId).toBe("test-step")
      expect(result.complete).toBe(true)
      expect(result.outputs).toHaveProperty("stepId", "test-step")
      expect(result.outputs).toHaveProperty("displayName", "Test Step")
    })
  })

  describe("Prompt step", () => {
    it("should interpolate template variables", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "Prompt",
          config: {
            type: "Prompt",
            config: {
              template: "Hello, {{name}}! You have {{count}} messages.",
              variables: {},
            },
          },
        }),
        variables: { name: "World", count: 5 },
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(true)
      expect(result.outputs.prompt).toBe("Hello, World! You have 5 messages.")
      expect(result.outputs.text).toBe("Hello, World! You have 5 messages.")
    })

    it("should use inputs for interpolation", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "Prompt",
          inputs: { user: "Alice" },
          config: {
            type: "Prompt",
            config: {
              template: "Welcome, {{user}}!",
              variables: {},
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.outputs.prompt).toBe("Welcome, Alice!")
    })
  })

  describe("ConditionalRouter step", () => {
    it("should evaluate equals condition as true", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "ConditionalRouter",
          inputs: {
            input_text: "hello",
            match_text: "hello",
            true_case_message: "matched",
            false_case_message: "no match",
          },
          config: {
            type: "ConditionalRouter",
            config: {
              operator: "equals",
              caseSensitive: true,
              maxIterations: 100,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(true)
      expect(result.branch).toBe("true")
      expect(result.outputs.branch).toBe("true")
      expect(result.outputs.true_result).toBe("matched")
    })

    it("should evaluate equals condition as false", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "ConditionalRouter",
          inputs: {
            input_text: "hello",
            match_text: "world",
            true_case_message: "matched",
            false_case_message: "no match",
          },
          config: {
            type: "ConditionalRouter",
            config: {
              operator: "equals",
              caseSensitive: true,
              maxIterations: 100,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.branch).toBe("false")
      expect(result.outputs.false_result).toBe("no match")
    })

    it("should handle contains operator", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "ConditionalRouter",
          inputs: { input_text: "hello world", match_text: "world" },
          config: {
            type: "ConditionalRouter",
            config: {
              operator: "contains",
              caseSensitive: true,
              maxIterations: 100,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.branch).toBe("true")
    })
  })

  describe("Loop step", () => {
    it("should initialize loop and return first item", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "Loop",
          inputs: { data: ["a", "b", "c"] },
          config: {
            type: "Loop",
            config: {
              maxIterations: 100,
              aggregateResults: true,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(false)
      expect(result.outputs.item).toBe("a")
      expect(result.outputs.index).toBe(0)
      expect(result.outputs.total).toBe(3)
      expect(result.outputs.hasMore).toBe(true)
      expect(result.loopState).toBeDefined()
    })

    it("should complete when loop is exhausted", async () => {
      const loopState: LoopState = {
        stepId: "test-step",
        data: ["a", "b"],
        index: 2,
        aggregated: ["result-a", "result-b"],
        initialized: true,
      }

      const input = createInput(registry, {
        step: createStep({
          type: "Loop",
          config: {
            type: "Loop",
            config: {
              maxIterations: 100,
              aggregateResults: true,
            },
          },
        }),
        loopStates: new Map([["test-step", loopState]]),
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(true)
      expect(result.outputs.done).toEqual(["result-a", "result-b"])
    })
  })

  describe("Agent step", () => {
    it("should use placeholder executor when no client provided", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "Agent",
          config: {
            type: "Agent",
            config: {
              agentType: "chat",
              model: "gpt-4",
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(true)
      expect(result.outputs._placeholder).toBe(true)
      expect(result.outputs.success).toBe(true)
    })

    it("should use custom executor when registered", async () => {
      const mockExecutor: StepExecutor<"Agent"> = {
        type: "Agent",
        execute: mock(() =>
          Promise.resolve({
            stepId: "test-step",
            outputs: {
              response: "AI response",
              toolCalls: [],
              usage: { promptTokens: 10, completionTokens: 20 },
              success: true,
            },
            complete: true,
          }),
        ),
      }

      // Register the custom executor
      registry.register(mockExecutor, "custom")

      const input = createInput(registry, {
        step: createStep({
          type: "Agent",
          config: {
            type: "Agent",
            config: {
              agentType: "chat",
              model: "gpt-4",
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(mockExecutor.execute).toHaveBeenCalled()
      expect(result.outputs.response).toBe("AI response")
      expect(result.outputs.success).toBe(true)
    })

    it("should handle dry-run mode via executor", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "Agent",
          config: {
            type: "Agent",
            config: {
              agentType: "chat",
            },
          },
        }),
        dryRun: true,
      })

      const result = await executeStep(input)

      // The placeholder executor should still handle dry-run
      expect(result.complete).toBe(true)
    })
  })

  describe("SubFlow step", () => {
    it("should use placeholder executor when no deps provided", async () => {
      const input = createInput(registry, {
        step: createStep({
          type: "SubFlow",
          config: {
            type: "SubFlow",
            config: {
              flowName: "sub-workflow",
              synchronous: true,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(result.complete).toBe(true)
      expect(result.outputs._placeholder).toBe(true)
    })

    it("should use custom executor when registered", async () => {
      const mockExecutor: StepExecutor<"SubFlow"> = {
        type: "SubFlow",
        execute: mock(() =>
          Promise.resolve({
            stepId: "test-step",
            outputs: {
              result: "subflow output",
              success: true,
            },
            complete: true,
          }),
        ),
      }

      registry.register(mockExecutor, "custom")

      const input = createInput(registry, {
        step: createStep({
          type: "SubFlow",
          config: {
            type: "SubFlow",
            config: {
              flowName: "sub-workflow",
              synchronous: true,
            },
          },
        }),
      })

      const result = await executeStep(input)

      expect(mockExecutor.execute).toHaveBeenCalled()
      expect(result.outputs.result).toBe("subflow output")
      expect(result.outputs.success).toBe(true)
    })
  })

  describe("Error handling", () => {
    it("should wrap executor errors in StepExecutionError", async () => {
      const failingExecutor: StepExecutor<"Agent"> = {
        type: "Agent",
        execute: mock(() => Promise.reject(new Error("API error"))),
      }

      registry.register(failingExecutor, "custom")

      const input = createInput(registry, {
        step: createStep({
          type: "Agent",
          config: {
            type: "Agent",
            config: { agentType: "chat" },
          },
        }),
      })

      await expect(executeStep(input)).rejects.toThrow(StepExecutionError)
      await expect(executeStep(input)).rejects.toThrow("API error")
    })

    it("should preserve StepExecutionError thrown by executor", async () => {
      const failingExecutor: StepExecutor<"Agent"> = {
        type: "Agent",
        execute: mock(() => Promise.reject(new StepExecutionError("Custom error", "test-step"))),
      }

      registry.register(failingExecutor, "custom")

      const input = createInput(registry, {
        step: createStep({
          type: "Agent",
          config: {
            type: "Agent",
            config: { agentType: "chat" },
          },
        }),
      })

      await expect(executeStep(input)).rejects.toThrow(StepExecutionError)
      await expect(executeStep(input)).rejects.toThrow("Custom error")
    })
  })

  describe("Custom step types", () => {
    it("should support custom step types via registry", async () => {
      // Register a custom step type
      const customExecutor: StepExecutor<"Generic"> = {
        type: "Generic",
        execute: mock(() =>
          Promise.resolve({
            stepId: "test-step",
            outputs: { sent: true, timestamp: Date.now() },
            complete: true,
          }),
        ),
      }

      registry.register(customExecutor, "plugin")

      const input = createInput(registry, {
        step: createStep({
          type: "Generic",
          config: {
            type: "Generic",
            config: { channel: "slack" },
          },
        }),
      })

      const result = await executeStep(input)

      expect(customExecutor.execute).toHaveBeenCalled()
      expect(result.outputs.sent).toBe(true)
      expect(result.complete).toBe(true)
    })
  })
})
