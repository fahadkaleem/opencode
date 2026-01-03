/**
 * Workflow Parser Tests
 */

import { afterEach, describe, expect, it } from "bun:test"
import type { ParsedWorkflow, WorkflowData } from "../types.js"
import {
  getAllPredecessors,
  getAllSuccessors,
  getNextRunnableSteps,
  getStepInputs,
  parseWorkflow,
  validateWorkflow,
  WorkflowParseError,
} from "./workflowParser.js"

/**
 * Creates a minimal valid workflow for testing.
 */
function createMinimalWorkflow(): WorkflowData {
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
            template: {},
            outputs: [
              {
                name: "output",
                displayName: "Output",
                method: "run",
                types: ["any"],
              },
            ],
          },
        },
      },
    ],
    edges: [],
  }
}

/**
 * Creates a chain workflow: A → B → C
 */
function createChainWorkflow(): WorkflowData {
  return {
    nodes: [
      {
        id: "a",
        type: "genericNode",
        position: { x: 0, y: 0 },
        data: {
          id: "a",
          node: {
            displayName: "A",
            documentation: "",
            baseClasses: [],
            template: {},
            outputs: [
              {
                name: "output",
                displayName: "Output",
                method: "run",
                types: ["any"],
              },
            ],
          },
        },
      },
      {
        id: "b",
        type: "genericNode",
        position: { x: 100, y: 0 },
        data: {
          id: "b",
          node: {
            displayName: "B",
            documentation: "",
            baseClasses: [],
            template: {},
            outputs: [
              {
                name: "output",
                displayName: "Output",
                method: "run",
                types: ["any"],
              },
            ],
          },
        },
      },
      {
        id: "c",
        type: "genericNode",
        position: { x: 200, y: 0 },
        data: {
          id: "c",
          node: {
            displayName: "C",
            documentation: "",
            baseClasses: [],
            template: {},
            outputs: [
              {
                name: "output",
                displayName: "Output",
                method: "run",
                types: ["any"],
              },
            ],
          },
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "a",
        target: "b",
        sourceHandle: '{"name":"output"}',
        targetHandle: '{"fieldName":"input"}',
        data: {
          sourceHandle: {
            dataType: "any",
            id: "output",
            name: "output",
            outputTypes: ["any"],
          },
          targetHandle: {
            fieldName: "input",
            id: "input",
            inputTypes: ["any"],
            type: "any",
          },
        },
      },
      {
        id: "e2",
        source: "b",
        target: "c",
        sourceHandle: '{"name":"output"}',
        targetHandle: '{"fieldName":"input"}',
        data: {
          sourceHandle: {
            dataType: "any",
            id: "output",
            name: "output",
            outputTypes: ["any"],
          },
          targetHandle: {
            fieldName: "input",
            id: "input",
            inputTypes: ["any"],
            type: "any",
          },
        },
      },
    ],
  }
}

describe("parseWorkflow", () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  })

  it("should parse a minimal valid workflow when given valid input", () => {
    const workflow = createMinimalWorkflow()
    const result = parseWorkflow(workflow)

    expect(result.nodes.size).toBe(1)
    expect(result.executionOrder).toContain("node-1")
    expect(result.entryPoints).toContain("node-1")
    expect(result.exitPoints).toContain("node-1")
  })

  it("should parse a chain workflow when given sequential steps", () => {
    const workflow = createChainWorkflow()
    const result = parseWorkflow(workflow)

    expect(result.nodes.size).toBe(3)
    expect(result.executionOrder).toEqual(["a", "b", "c"])
    expect(result.entryPoints).toEqual(["a"])
    expect(result.exitPoints).toEqual(["c"])
  })

  it("should throw WorkflowParseError when nodes is not an array", () => {
    const workflow = { nodes: null, edges: [] } as unknown as WorkflowData

    expect(() => parseWorkflow(workflow)).toThrow(WorkflowParseError)
    expect(() => parseWorkflow(workflow)).toThrow("nodes must be an array")
  })

  it("should throw WorkflowParseError when edges is not an array", () => {
    const workflow = { nodes: [], edges: null } as unknown as WorkflowData

    expect(() => parseWorkflow(workflow)).toThrow(WorkflowParseError)
    expect(() => parseWorkflow(workflow)).toThrow("edges must be an array")
  })

  it("should exclude note steps when parsing", () => {
    const workflow: WorkflowData = {
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
              template: {},
              outputs: [],
            },
          },
        },
        {
          id: "note-1",
          type: "noteNode",
          position: { x: 100, y: 0 },
          data: {
            id: "note-1",
            node: {
              displayName: "Note",
              documentation: "",
              baseClasses: [],
              template: {},
              outputs: [],
            },
          },
        },
      ],
      edges: [],
    }

    const result = parseWorkflow(workflow)
    expect(result.nodes.size).toBe(1)
    expect(result.nodes.has("note-1")).toBe(false)
  })
})

describe("validateWorkflow", () => {
  it("should return empty errors when workflow is valid", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)
    const errors = validateWorkflow(parsed)

    expect(errors).toEqual([])
  })

  it("should return error when workflow has no entry points", () => {
    // Create a workflow where we manually remove entry points
    const parsed: ParsedWorkflow = {
      executionOrder: ["a"],
      nodes: new Map(),
      edges: new Map(),
      adjacency: new Map(),
      reverseAdjacency: new Map([["a", ["b"]]]), // a has predecessor
      entryPoints: [],
      exitPoints: ["a"],
    }

    const errors = validateWorkflow(parsed)
    expect(errors).toContain("Workflow has no entry points (steps with no predecessors)")
  })
})

describe("getNextRunnableSteps", () => {
  it("should return successor steps when all predecessors are complete", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)
    const completed = new Set(["a"])

    const runnable = getNextRunnableSteps("a", parsed, completed)
    expect(runnable).toContain("b")
  })

  it("should return empty array when no steps are runnable", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)
    const completed = new Set<string>()

    const runnable = getNextRunnableSteps("a", parsed, completed)
    expect(runnable).toEqual([])
  })
})

describe("getStepInputs", () => {
  it("should return step inputs when predecessor outputs are available", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)
    const outputs = {
      a: { output: "value-from-a" },
    }

    const inputs = getStepInputs("b", parsed, outputs)
    expect(inputs.input).toBe("value-from-a")
  })

  it("should return empty object when step does not exist", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)

    const inputs = getStepInputs("nonexistent", parsed, {})
    expect(inputs).toEqual({})
  })
})

describe("getAllPredecessors", () => {
  it("should return all predecessor steps recursively", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)

    const predecessors = getAllPredecessors("c", parsed.reverseAdjacency)
    expect(predecessors.has("a")).toBe(true)
    expect(predecessors.has("b")).toBe(true)
  })
})

describe("getAllSuccessors", () => {
  it("should return all successor steps recursively", () => {
    const workflow = createChainWorkflow()
    const parsed = parseWorkflow(workflow)

    const successors = getAllSuccessors("a", parsed.adjacency)
    expect(successors.has("b")).toBe(true)
    expect(successors.has("c")).toBe(true)
  })
})
