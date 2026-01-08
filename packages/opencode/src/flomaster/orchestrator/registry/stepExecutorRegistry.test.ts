/**
 * Step Executor Registry Tests
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test"
import type { ExecuteStepOutput, ParsedStep } from "../types"
import {
  createStepExecutorRegistry,
  ExecutorNotFoundError,
  InvalidExecutorError,
  RegistryNotInitializedError,
  StepExecutorRegistry,
} from "./stepExecutorRegistry"
import type { ExecutorContext, StepExecutor } from "./types"

// Helper to create a mock step
function createMockStep(id: string, type: string): ParsedStep {
  return {
    id,
    type: type as ParsedStep["type"],
    inputs: {},
    outputs: [],
    position: { x: 0, y: 0 },
    config: { type, config: {} } as ParsedStep["config"],
    displayName: `Test ${type}`,
  }
}

// Helper to create a mock context
function createMockContext(): ExecutorContext {
  return {
    executionId: "test-exec-123",
    outputs: {},
    variables: {},
    dryRun: false,
    loopStates: new Map(),
  }
}

// Helper to create a custom executor
function createCustomExecutor(type: string): StepExecutor {
  return {
    type: type as StepExecutor["type"],
    execute(step: ParsedStep): Promise<ExecuteStepOutput> {
      return Promise.resolve({
        stepId: step.id,
        outputs: { custom: true, type },
        complete: true,
      })
    },
  }
}

describe("StepExecutorRegistry", () => {
  let registry: StepExecutorRegistry

  beforeEach(() => {
    registry = new StepExecutorRegistry()
  })

  afterEach(() => {
    // Bun auto-restores mocks;
  })

  describe("initialization", () => {
    it("should not be initialized on construction", () => {
      expect(registry.isInitialized()).toBe(false)
    })

    it("should be initialized after calling initialize()", async () => {
      await registry.initialize()
      expect(registry.isInitialized()).toBe(true)
    })

    it("should throw if initialized twice", async () => {
      await registry.initialize()
      await expect(registry.initialize()).rejects.toThrow("already initialized")
    })

    it("should load built-in executors on initialize", async () => {
      await registry.initialize()

      expect(registry.has("Prompt")).toBe(true)
      expect(registry.has("Generic")).toBe(true)
      expect(registry.has("Input")).toBe(true)
      expect(registry.has("Output")).toBe(true)
      expect(registry.has("ConditionalRouter")).toBe(true)
      expect(registry.has("Loop")).toBe(true)
      expect(registry.has("Agent")).toBe(true)
      expect(registry.has("SubFlow")).toBe(true)
    })
  })

  describe("registration", () => {
    beforeEach(async () => {
      await registry.initialize()
    })

    it("should register a custom executor", () => {
      const executor = createCustomExecutor("Custom" as string)
      registry.register(executor, "custom")

      expect(registry.has("Custom" as "Generic")).toBe(true)
    })

    it("should overwrite existing executor by default", () => {
      const original = registry.get("Prompt")
      const custom = createCustomExecutor("Prompt")

      registry.register(custom, "custom")

      const updated = registry.get("Prompt")
      expect(updated).not.toBe(original)
      expect(updated).toBe(custom)
    })

    it("should throw on overwrite if allowOverwrite is false", async () => {
      const strictRegistry = new StepExecutorRegistry({
        allowOverwrite: false,
      })
      await strictRegistry.initialize()

      const custom = createCustomExecutor("Prompt")

      expect(() => strictRegistry.register(custom, "custom")).toThrow("already registered")
    })

    it("should throw for invalid executor", () => {
      expect(() => registry.register({} as StepExecutor, "custom")).toThrow(InvalidExecutorError)
    })

    it("should throw for executor without type", () => {
      const invalidExecutor = {
        execute: () => Promise.resolve({ stepId: "test", outputs: {}, complete: true }),
      } as unknown as StepExecutor

      expect(() => registry.register(invalidExecutor, "custom")).toThrow(InvalidExecutorError)
    })
  })

  describe("lookup", () => {
    beforeEach(async () => {
      await registry.initialize()
    })

    it("should get executor by type", () => {
      const executor = registry.get("Prompt")
      expect(executor).toBeDefined()
      expect(executor?.type).toBe("Prompt")
    })

    it("should return undefined for unknown type", () => {
      const executor = registry.get("Unknown" as "Generic")
      expect(executor).toBeUndefined()
    })

    it("should throw from getRequired for unknown type", () => {
      expect(() => registry.getRequired("Unknown" as "Generic")).toThrow(ExecutorNotFoundError)
    })

    it("should return all registered types", () => {
      const types = registry.getRegisteredTypes()
      expect(types).toContain("Prompt")
      expect(types).toContain("Generic")
      expect(types).toContain("Agent")
    })

    it("should return types sorted alphabetically", () => {
      const types = registry.getRegisteredTypes()
      const sorted = [...types].sort()
      expect(types).toEqual(sorted)
    })
  })

  describe("uninitialized access", () => {
    it("should throw on get() before initialize", () => {
      expect(() => registry.get("Prompt")).toThrow(RegistryNotInitializedError)
    })

    it("should throw on has() before initialize", () => {
      expect(() => registry.has("Prompt")).toThrow(RegistryNotInitializedError)
    })

    it("should throw on register() before initialize", () => {
      const executor = createCustomExecutor("Custom" as string)
      expect(() => registry.register(executor, "custom")).toThrow(RegistryNotInitializedError)
    })

    it("should throw on getRegisteredTypes() before initialize", () => {
      expect(() => registry.getRegisteredTypes()).toThrow(RegistryNotInitializedError)
    })
  })

  describe("source tracking", () => {
    beforeEach(async () => {
      await registry.initialize()
    })

    it("should track source for built-in executors", () => {
      const builtIns = registry.getBySource("built-in")
      expect(builtIns.length).toBeGreaterThan(0)
      expect(builtIns.some((e) => e.type === "Prompt")).toBe(true)
    })

    it("should track source for custom executors", () => {
      const executor = createCustomExecutor("Custom" as string)
      registry.register(executor, "custom")

      const customs = registry.getBySource("custom")
      expect(customs).toContain(executor)
    })
  })

  describe("executor execution", () => {
    beforeEach(async () => {
      await registry.initialize()
    })

    it("should execute Prompt step", async () => {
      const executor = registry.getRequired("Prompt")
      const step = createMockStep("prompt-1", "Prompt")
      ;(step.config as { type: string; config: { template: string } }).config = {
        template: "Hello {{name}}!",
      }

      const context: ExecutorContext = {
        executionId: "test-exec-123",
        outputs: {},
        variables: { name: "World" },
        dryRun: false,
        loopStates: new Map(),
      }

      const result = await executor.execute(step, context)

      expect(result.stepId).toBe("prompt-1")
      expect(result.complete).toBe(true)
      expect(result.outputs.prompt).toBe("Hello World!")
    })

    it("should execute Generic step", async () => {
      const executor = registry.getRequired("Generic")
      const step = createMockStep("generic-1", "Generic")

      const context: ExecutorContext = {
        executionId: "test-exec-456",
        outputs: { "prev-step": { value: 42 } },
        variables: {},
        dryRun: false,
        loopStates: new Map(),
      }

      const result = await executor.execute(step, context)

      expect(result.stepId).toBe("generic-1")
      expect(result.complete).toBe(true)
      expect(result.outputs["prev-step.value"]).toBe(42)
    })
  })

  describe("clear", () => {
    it("should clear all executors and reset state", async () => {
      await registry.initialize()
      expect(registry.isInitialized()).toBe(true)
      expect(registry.size).toBeGreaterThan(0)

      registry.clear()

      expect(registry.isInitialized()).toBe(false)
      expect(registry.size).toBe(0)
    })
  })

  describe("createStepExecutorRegistry factory", () => {
    it("should create a new registry instance", () => {
      const reg = createStepExecutorRegistry()
      expect(reg).toBeInstanceOf(StepExecutorRegistry)
      expect(reg.isInitialized()).toBe(false)
    })

    it("should pass config to the registry", async () => {
      const reg = createStepExecutorRegistry({ debug: true })
      await reg.initialize()
      expect(reg.isInitialized()).toBe(true)
    })
  })
})
