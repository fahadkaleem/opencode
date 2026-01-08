import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  discoverWorkflows,
  loadWorkflow,
  loadWorkflowFromFile,
  WorkflowLoadError,
  getWorkflowsDir,
} from "./workflowLoader"

describe("workflowLoader", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `flomaster-test-${Date.now()}`)
    mkdirSync(join(testDir, ".flomaster", "workflows"), { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  const validWorkflow = {
    name: "test",
    description: "Test workflow",
    steps: [
      { id: "input", type: "input", name: "Input" },
      { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "{{input.prompt}}" },
    ],
  }

  describe("getWorkflowsDir", () => {
    it("returns correct path", () => {
      expect(getWorkflowsDir("/project")).toBe("/project/.flomaster/workflows")
    })
  })

  describe("discoverWorkflows", () => {
    it("discovers workflow files", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/test.json"), JSON.stringify(validWorkflow))

      const workflows = discoverWorkflows(testDir)
      expect(workflows).toHaveLength(1)
      expect(workflows[0]?.name).toBe("test")
      expect(workflows[0]?.stepCount).toBe(2)
    })

    it("returns empty array if directory doesn't exist", () => {
      const emptyDir = join(tmpdir(), `empty-${Date.now()}`)
      const workflows = discoverWorkflows(emptyDir)
      expect(workflows).toHaveLength(0)
    })

    it("ignores non-JSON files", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/readme.md"), "# Readme")
      writeFileSync(join(testDir, ".flomaster/workflows/test.json"), JSON.stringify(validWorkflow))

      const workflows = discoverWorkflows(testDir)
      expect(workflows).toHaveLength(1)
    })

    it("sorts workflows by name", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/zeta.json"), JSON.stringify({ ...validWorkflow, name: "zeta" }))
      writeFileSync(
        join(testDir, ".flomaster/workflows/alpha.json"),
        JSON.stringify({ ...validWorkflow, name: "alpha" }),
      )

      const workflows = discoverWorkflows(testDir)
      expect(workflows).toHaveLength(2)
      expect(workflows[0]?.name).toBe("alpha")
      expect(workflows[1]?.name).toBe("zeta")
    })
  })

  describe("loadWorkflow", () => {
    it("loads valid workflow by name", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/test.json"), JSON.stringify(validWorkflow))

      const loaded = loadWorkflow(testDir, "test")
      expect(loaded.name).toBe("test")
      expect(loaded.workflow.nodes).toHaveLength(2)
      expect(loaded.inputNodeId).toBe("input")
      expect(loaded.outputNodeId).toBe("agent")
    })

    it("throws WorkflowLoadError for missing workflow", () => {
      expect(() => loadWorkflow(testDir, "nonexistent")).toThrow(WorkflowLoadError)
    })

    it("throws WorkflowLoadError for invalid JSON", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/bad.json"), "not json")
      expect(() => loadWorkflow(testDir, "bad")).toThrow(WorkflowLoadError)
    })

    it("throws WorkflowLoadError for invalid schema", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/invalid.json"), JSON.stringify({ name: "test" })) // Missing required fields
      expect(() => loadWorkflow(testDir, "invalid")).toThrow(WorkflowLoadError)
    })
  })

  describe("loadWorkflowFromFile", () => {
    it("loads workflow from file path", () => {
      const filePath = join(testDir, ".flomaster/workflows/test.json")
      writeFileSync(filePath, JSON.stringify(validWorkflow))

      const loaded = loadWorkflowFromFile(filePath)
      expect(loaded.name).toBe("test")
      expect(loaded.filePath).toBe(filePath)
    })

    it("throws for missing file", () => {
      expect(() => loadWorkflowFromFile("/nonexistent/path.json")).toThrow(WorkflowLoadError)
    })
  })

  describe("interpolation validation", () => {
    it("rejects reference to unknown step", () => {
      const badWorkflow = {
        ...validWorkflow,
        steps: [
          { id: "input", type: "input", name: "Input" },
          { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "{{unknown.output}}" },
        ],
      }
      writeFileSync(join(testDir, ".flomaster/workflows/bad-ref.json"), JSON.stringify(badWorkflow))

      expect(() => loadWorkflow(testDir, "bad-ref")).toThrow(/references unknown step/)
    })

    it("rejects reference to step not in dependency chain", () => {
      const badWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input" },
          { id: "research", type: "agent", name: "Research", depends_on: ["input"], prompt: "{{input.prompt}}" },
          { id: "plan", type: "agent", name: "Plan", depends_on: ["input"], prompt: "{{research.response}}" }, // research not in depends_on!
        ],
      }
      writeFileSync(join(testDir, ".flomaster/workflows/bad-dep.json"), JSON.stringify(badWorkflow))

      expect(() => loadWorkflow(testDir, "bad-dep")).toThrow(/does not depend on it/)
    })

    it("allows reference to transitive dependency", () => {
      const goodWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input" },
          { id: "research", type: "agent", name: "Research", depends_on: ["input"], prompt: "{{input.prompt}}" },
          {
            id: "plan",
            type: "agent",
            name: "Plan",
            depends_on: ["research"],
            prompt: "{{input.prompt}} {{research.response}}",
          }, // input is transitive
        ],
      }
      writeFileSync(join(testDir, ".flomaster/workflows/good.json"), JSON.stringify(goodWorkflow))

      expect(() => loadWorkflow(testDir, "good")).not.toThrow()
    })

    it("validates system_prompt references too", () => {
      const badWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input" },
          {
            id: "agent",
            type: "agent",
            name: "Agent",
            depends_on: ["input"],
            prompt: "test",
            system_prompt: "{{nonexistent.output}}",
          },
        ],
      }
      writeFileSync(join(testDir, ".flomaster/workflows/bad-system.json"), JSON.stringify(badWorkflow))

      expect(() => loadWorkflow(testDir, "bad-system")).toThrow(/references unknown step/)
    })
  })

  describe("workflow conversion", () => {
    it("sets correct baseClasses for type detection", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/test.json"), JSON.stringify(validWorkflow))

      const loaded = loadWorkflow(testDir, "test")
      expect(loaded.workflow.nodes[0]?.data.node.baseClasses).toContain("Input")
      expect(loaded.workflow.nodes[1]?.data.node.baseClasses).toContain("Agent")
    })

    it("applies workflow defaults", () => {
      const workflowWithDefaults = {
        ...validWorkflow,
        defaults: { timeout_ms: 60000, max_retries: 5 },
      }
      writeFileSync(join(testDir, ".flomaster/workflows/defaults.json"), JSON.stringify(workflowWithDefaults))

      const loaded = loadWorkflow(testDir, "defaults")
      const agentNode = loaded.workflow.nodes[1]
      expect(agentNode?.data.node.template["timeout_ms"]?.value).toBe(60000)
      expect(agentNode?.data.node.template["max_retries"]?.value).toBe(5)
    })

    it("creates edges from depends_on", () => {
      writeFileSync(join(testDir, ".flomaster/workflows/test.json"), JSON.stringify(validWorkflow))

      const loaded = loadWorkflow(testDir, "test")
      expect(loaded.workflow.edges).toHaveLength(1)
      expect(loaded.workflow.edges[0]?.source).toBe("input")
      expect(loaded.workflow.edges[0]?.target).toBe("agent")
    })
  })
})
