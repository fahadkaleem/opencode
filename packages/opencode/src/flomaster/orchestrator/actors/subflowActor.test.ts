/**
 * SubFlow Actor Tests
 */

import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type { SubFlowConfig, SubFlowOutput, WorkflowData } from "../types.js"
import {
  applyTweaks,
  createAsyncSubFlowHandle,
  createSubFlowInput,
  mergeContext,
  SubFlowExecutionError,
} from "./subflowActor.js"

/**
 * Creates a minimal test graph.
 */
function createTestGraph(): WorkflowData {
  return {
    nodes: [
      {
        id: "node-1",
        type: "genericNode",
        position: { x: 0, y: 0 },
        data: {
          id: "node-1",
          node: {
            displayName: "Node 1",
            documentation: "",
            baseClasses: [],
            template: {
              input: {
                name: "input",
                displayName: "Input",
                type: "string",
                value: "default",
                isRequired: true,
                isAdvanced: false,
              },
            },
            outputs: [],
          },
        },
      },
    ],
    edges: [],
  }
}

describe("subflow-actor", () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  })

  describe("applyTweaks", () => {
    it("should return graph unchanged when tweaks is empty", () => {
      const graph = createTestGraph()
      const result = applyTweaks(graph, {})

      expect(result).toEqual(graph)
    })

    it("should apply tweaks to node template values", () => {
      const graph = createTestGraph()
      const tweaks = {
        "node-1": {
          input: "new value",
        },
      }

      const result = applyTweaks(graph, tweaks)

      const template = result.nodes[0].data.node.template as Record<string, { value: unknown }>
      expect(template.input.value).toBe("new value")
    })

    it("should not modify original graph", () => {
      const graph = createTestGraph()
      const originalValue = (graph.nodes[0].data.node.template as Record<string, { value: unknown }>).input.value

      applyTweaks(graph, { "node-1": { input: "new value" } })

      const currentValue = (graph.nodes[0].data.node.template as Record<string, { value: unknown }>).input.value
      expect(currentValue).toBe(originalValue)
    })

    it("should ignore tweaks for non-existent nodes", () => {
      const graph = createTestGraph()
      const tweaks = {
        "non-existent": {
          input: "value",
        },
      }

      const result = applyTweaks(graph, tweaks)

      expect(result.nodes).toHaveLength(1)
    })
  })

  describe("mergeContext", () => {
    it("should merge parent context with inputs", () => {
      const inputs = { foo: "bar" }
      const parentContext = { baz: "qux" }

      const result = mergeContext(inputs, parentContext)

      expect(result).toEqual({ foo: "bar", baz: "qux" })
    })

    it("should override parent context with inputs", () => {
      const inputs = { key: "input-value" }
      const parentContext = { key: "parent-value" }

      const result = mergeContext(inputs, parentContext)

      expect(result.key).toBe("input-value")
    })
  })

  describe("createSubFlowInput", () => {
    it("should create subflow input from config", () => {
      const config: SubFlowConfig = {
        flowName: "test-flow",
        flowId: "flow-123",
        tweaks: { node: { value: 1 } },
        synchronous: true,
      }

      const loadFlow = mock(() => Promise.resolve(createTestGraph()))
      const executeWorkflow = mock(() =>
        Promise.resolve({
          executionId: "exec-123",
          terminateMode: "COMPLETED" as const,
          outputs: {},
          duration: 100,
          stepResults: [],
          startTime: Date.now(),
          endTime: Date.now(),
        }),
      )

      const result = createSubFlowInput(config, { input: "value" }, { context: "data" }, loadFlow, executeWorkflow)

      expect(result.flowName).toBe("test-flow")
      expect(result.flowId).toBe("flow-123")
      expect(result.inputs).toEqual({ input: "value" })
      expect(result.parentContext).toEqual({ context: "data" })
      expect(result.tweaks).toEqual({ node: { value: 1 } })
      expect(result.synchronous).toBe(true)
      expect(result.loadFlow).toBe(loadFlow)
      expect(result.executeWorkflow).toBe(executeWorkflow)
    })
  })

  describe("createAsyncSubFlowHandle", () => {
    it("should create handle that tracks completion", async () => {
      const promise = Promise.resolve({
        outputs: { result: "success" },
        success: true,
      })

      const cancel = mock(() => {})
      const handle = createAsyncSubFlowHandle("exec-1", promise, cancel)

      expect(handle.executionId).toBe("exec-1")

      const result = await handle.getResult()
      expect(result.success).toBe(true)

      // Wait for promise to settle
      await promise
      expect(await handle.isComplete()).toBe(true)
    })

    it("should call cancel function when cancel is invoked", async () => {
      const promise = new Promise<never>(() => {}) // Never resolves
      const cancel = mock(() => {})

      const handle = createAsyncSubFlowHandle("exec-1", promise as unknown as Promise<SubFlowOutput>, cancel)
      await handle.cancel()

      expect(cancel).toHaveBeenCalled()
    })

    it("should throw error when promise rejects", async () => {
      const error = new Error("execution failed")
      const promise = Promise.reject(error)
      const cancel = mock(() => {})

      const handle = createAsyncSubFlowHandle("exec-1", promise, cancel)

      // Wait for promise to settle
      await promise.catch(() => {})

      await expect(handle.getResult()).rejects.toBe(error)
    })
  })

  describe("SubFlowExecutionError", () => {
    it("should create error with flow details", () => {
      const error = new SubFlowExecutionError("Failed to execute", "flow-123", "test-flow", new Error("original"))

      expect(error.name).toBe("SubFlowExecutionError")
      expect(error.message).toBe("Failed to execute")
      expect(error.flowId).toBe("flow-123")
      expect(error.flowName).toBe("test-flow")
      expect(error.originalCause?.message).toBe("original")
    })
  })
})
