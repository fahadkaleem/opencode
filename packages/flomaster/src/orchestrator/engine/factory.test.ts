/**
 * Workflow Engine Factory Tests
 */

import { describe, expect, it, mock } from "bun:test"
import { StepExecutorRegistry } from "../registry/stepExecutorRegistry.js"
import type { StepType } from "../types.js"
import { createInitializedRegistry, createWorkflowEngine } from "./factory.js"
import { DefaultWorkflowEngine } from "./workflowEngine.js"

describe("createWorkflowEngine", () => {
  it("should create engine with registry when directory provided", async () => {
    const { engine, registry } = await createWorkflowEngine({
      directory: "/mock/directory",
    })

    expect(engine).toBeInstanceOf(DefaultWorkflowEngine)
    expect(registry).toBeInstanceOf(StepExecutorRegistry)
    expect(registry.isInitialized()).toBe(true)
  })

  it("should create engine without directory (placeholder executors)", async () => {
    const { engine, registry } = await createWorkflowEngine({})

    expect(engine).toBeInstanceOf(DefaultWorkflowEngine)
    expect(registry).toBeInstanceOf(StepExecutorRegistry)
    expect(registry.isInitialized()).toBe(true)
  })

  it("should pass engine config to engine", async () => {
    const { engine } = await createWorkflowEngine({
      engineConfig: {
        workflowDir: "/custom/workflows",
        defaultTimeout: 60000,
      },
    })

    expect(engine).toBeInstanceOf(DefaultWorkflowEngine)
  })

  it("should pass registry config to registry", async () => {
    const { registry } = await createWorkflowEngine({
      registryConfig: {
        debug: true,
        allowOverwrite: false,
      },
    })

    expect(registry.isInitialized()).toBe(true)
  })

  it("should register Agent executor when directory provided", async () => {
    const { registry } = await createWorkflowEngine({
      directory: "/mock/directory",
    })

    const agentExecutor = registry.get("Agent")
    expect(agentExecutor).toBeDefined()
    expect(agentExecutor?.type).toBe("Agent")
  })

  it("should register placeholder Agent executor when no directory", async () => {
    const { registry } = await createWorkflowEngine({})

    const agentExecutor = registry.get("Agent")
    expect(agentExecutor).toBeDefined()
    expect(agentExecutor?.type).toBe("Agent")
  })
})

describe("createInitializedRegistry", () => {
  it("should create initialized registry with directory", async () => {
    const registry = await createInitializedRegistry("/mock/directory")

    expect(registry).toBeInstanceOf(StepExecutorRegistry)
    expect(registry.isInitialized()).toBe(true)
  })

  it("should create initialized registry without directory", async () => {
    const registry = await createInitializedRegistry()

    expect(registry).toBeInstanceOf(StepExecutorRegistry)
    expect(registry.isInitialized()).toBe(true)
  })

  it("should accept registry config", async () => {
    const registry = await createInitializedRegistry(undefined, {
      debug: true,
    })

    expect(registry.isInitialized()).toBe(true)
  })

  it("should register all built-in executors", async () => {
    const registry = await createInitializedRegistry()

    const expectedTypes = ["Prompt", "ConditionalRouter", "Loop", "Generic", "Input", "Output", "Agent", "SubFlow"]

    for (const type of expectedTypes) {
      expect(registry.has(type as StepType)).toBe(true)
    }
  })
})

describe("Integration: Engine with Registry", () => {
  it("should allow custom executor registration after creation", async () => {
    const { registry } = await createWorkflowEngine({})

    const customExecutor = {
      type: "CustomStep" as StepType,
      execute: mock(() =>
        Promise.resolve({
          stepId: "test",
          outputs: { result: "custom" },
          complete: true,
        }),
      ),
    }

    registry.register(customExecutor, "custom")

    expect(registry.has("CustomStep" as StepType)).toBe(true)
    expect(registry.get("CustomStep" as StepType)).toBe(customExecutor)
  })

  it("should share registry state with engine", async () => {
    const { registry } = await createWorkflowEngine({
      directory: "/mock/directory",
    })

    // Registry should be initialized and have Agent executor
    expect(registry.isInitialized()).toBe(true)
    expect(registry.has("Agent")).toBe(true)
  })
})
