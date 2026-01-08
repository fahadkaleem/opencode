import { describe, expect, it } from "bun:test"
import { convertSimpleToReactFlow, getInputNodeId, getOutputNodeId } from "./simpleConverter"
import type { SimpleWorkflow } from "../schema/simpleWorkflowSchema"

describe("simpleConverter", () => {
  const minimalWorkflow: SimpleWorkflow = {
    name: "test",
    description: "Test workflow",
    steps: [
      { id: "input", type: "input", name: "User Input", depends_on: [] },
      { id: "agent", type: "agent", name: "Agent Step", depends_on: ["input"], prompt: "{{input.prompt}}" },
    ],
  }

  describe("convertSimpleToReactFlow", () => {
    it("converts minimal workflow", () => {
      const result = convertSimpleToReactFlow(minimalWorkflow)

      expect(result.nodes).toHaveLength(2)
      expect(result.edges).toHaveLength(1)
      expect(result.nodes[0]?.id).toBe("input")
      expect(result.nodes[1]?.id).toBe("agent")
    })

    it("sets correct baseClasses for type detection", () => {
      const result = convertSimpleToReactFlow(minimalWorkflow)

      expect(result.nodes[0]?.data.node.baseClasses).toContain("Input")
      expect(result.nodes[1]?.data.node.baseClasses).toContain("Agent")
    })

    it("applies workflow defaults to steps", () => {
      const workflowWithDefaults: SimpleWorkflow = {
        ...minimalWorkflow,
        defaults: { timeout_ms: 60000, max_retries: 5 },
      }

      const result = convertSimpleToReactFlow(workflowWithDefaults)
      const agentNode = result.nodes[1]

      expect(agentNode?.data.node.template["timeout_ms"]?.value).toBe(60000)
      expect(agentNode?.data.node.template["max_retries"]?.value).toBe(5)
    })

    it("step config overrides workflow defaults", () => {
      const workflowWithOverride: SimpleWorkflow = {
        name: "test",
        description: "Test",
        defaults: { timeout_ms: 60000 },
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "test", timeout_ms: 120000 },
        ],
      }

      const result = convertSimpleToReactFlow(workflowWithOverride)
      const agentNode = result.nodes[1]

      expect(agentNode?.data.node.template["timeout_ms"]?.value).toBe(120000)
    })

    it("builds edges from depends_on", () => {
      const result = convertSimpleToReactFlow(minimalWorkflow)

      expect(result.edges[0]?.source).toBe("input")
      expect(result.edges[0]?.target).toBe("agent")
    })

    it("sets agent_type for agent steps", () => {
      const workflowWithAgent: SimpleWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "test", agent: "research-agent" },
        ],
      }

      const result = convertSimpleToReactFlow(workflowWithAgent)
      const agentNode = result.nodes[1]

      expect(agentNode?.data.node.template["agent_type"]?.value).toBe("research-agent")
    })

    it("applies default agent from workflow defaults", () => {
      const workflowWithDefaults: SimpleWorkflow = {
        name: "test",
        description: "Test",
        defaults: { agent: "plan-agent" },
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "test" },
        ],
      }

      const result = convertSimpleToReactFlow(workflowWithDefaults)
      const agentNode = result.nodes[1]

      expect(agentNode?.data.node.template["agent_type"]?.value).toBe("plan-agent")
    })

    it("converts conditional step with correct template", () => {
      const workflowWithConditional: SimpleWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          {
            id: "cond",
            type: "conditional",
            name: "Conditional",
            depends_on: ["input"],
            condition: { operator: "equals", left: "{{input.prompt}}", right: "yes" },
          },
        ],
      }

      const result = convertSimpleToReactFlow(workflowWithConditional)
      const condNode = result.nodes[1]

      expect(condNode?.data.node.baseClasses).toContain("ConditionalRouter")
      expect(condNode?.data.node.template["operator"]?.value).toBe("equals")
      expect(condNode?.data.node.template["match_text"]?.value).toBe("yes")
      expect(condNode?.data.node.template["input_text"]?.value).toBe("{{input.prompt}}")
    })

    it("converts loop step with correct template", () => {
      const workflowWithLoop: SimpleWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          {
            id: "loop",
            type: "loop",
            name: "Loop",
            depends_on: ["input"],
            loop: { items: "{{input.items}}", max_iterations: 50 },
          },
        ],
      }

      const result = convertSimpleToReactFlow(workflowWithLoop)
      const loopNode = result.nodes[1]

      expect(loopNode?.data.node.baseClasses).toContain("Loop")
      expect(loopNode?.data.node.template["items"]?.value).toBe("{{input.items}}")
      expect(loopNode?.data.node.template["max_iterations"]?.value).toBe(50)
    })
  })

  describe("getInputNodeId", () => {
    it("returns input type step ID", () => {
      expect(getInputNodeId(minimalWorkflow)).toBe("input")
    })

    it("falls back to first step with no dependencies", () => {
      const noInputType: SimpleWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "first", type: "agent", name: "First", prompt: "test", depends_on: [] },
          { id: "second", type: "agent", name: "Second", depends_on: ["first"], prompt: "test" },
        ],
      }
      expect(getInputNodeId(noInputType)).toBe("first")
    })
  })

  describe("getOutputNodeId", () => {
    it("returns output type step ID", () => {
      const withOutput: SimpleWorkflow = {
        name: "test",
        description: "Test",
        steps: [
          { id: "input", type: "input", name: "Input", depends_on: [] },
          { id: "agent", type: "agent", name: "Agent", depends_on: ["input"], prompt: "test" },
          { id: "output", type: "output", name: "Output", depends_on: ["agent"] },
        ],
      }
      expect(getOutputNodeId(withOutput)).toBe("output")
    })

    it("falls back to last step with no dependents", () => {
      expect(getOutputNodeId(minimalWorkflow)).toBe("agent")
    })
  })
})
