/**
 * SDLC Workflow Tests (TASK-10 / TASK-11)
 *
 * Tests to verify the SDLC workflow (now loaded from JSON) is correctly configured
 * with step config fields.
 */

import { describe, expect, it } from "bun:test"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { loadWorkflowFromFile } from "../loader/workflowLoader.js"
import { parseWorkflow } from "../parser/workflowParser.js"
import type { AgentConfig } from "../types.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

describe("SDLC Workflow (JSON) with Step Configuration", () => {
  it("should load and parse correctly from JSON", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))

    expect(loaded.name).toBe("sdlc")
    expect(loaded.workflow.nodes).toHaveLength(5)
    expect(loaded.inputNodeId).toBe("input")
    expect(loaded.outputNodeId).toBe("review")
  })

  it("should parse workflow successfully", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)

    expect(parsed.nodes.size).toBe(5) // input + research + plan + implement + review
    expect(parsed.entryPoints).toContain("input")
    expect(parsed.exitPoints).toContain("review")
  })

  it("should have research step with correct timeout and retries", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)
    const researchStep = parsed.nodes.get("research")

    expect(researchStep).toBeDefined()
    expect(researchStep?.type).toBe("Agent")

    if (researchStep?.config.type === "Agent") {
      const config = researchStep.config.config as AgentConfig
      expect(config.agentType).toBe("research-agent")
      expect(config.timeoutMs).toBe(180000) // 3 minutes
      expect(config.maxRetries).toBe(1)
    }
  })

  it("should have plan step with correct timeout and retries", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)
    const planStep = parsed.nodes.get("plan")

    expect(planStep).toBeDefined()
    expect(planStep?.type).toBe("Agent")

    if (planStep?.config.type === "Agent") {
      const config = planStep.config.config as AgentConfig
      expect(config.agentType).toBe("plan-agent")
      expect(config.timeoutMs).toBe(120000) // 2 minutes
      expect(config.maxRetries).toBe(2)
    }
  })

  it("should have implement step with correct timeout and retries", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)
    const implementStep = parsed.nodes.get("implement")

    expect(implementStep).toBeDefined()
    expect(implementStep?.type).toBe("Agent")

    if (implementStep?.config.type === "Agent") {
      const config = implementStep.config.config as AgentConfig
      expect(config.agentType).toBe("implement-agent")
      expect(config.timeoutMs).toBe(300000) // 5 minutes
      expect(config.maxRetries).toBe(3)
    }
  })

  it("should have review step with correct timeout and retries", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)
    const reviewStep = parsed.nodes.get("review")

    expect(reviewStep).toBeDefined()
    expect(reviewStep?.type).toBe("Agent")

    if (reviewStep?.config.type === "Agent") {
      const config = reviewStep.config.config as AgentConfig
      expect(config.agentType).toBe("review-agent")
      expect(config.timeoutMs).toBe(120000) // 2 minutes
      expect(config.maxRetries).toBe(1)
    }
  })

  it("should have correct execution order", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)
    const order = parsed.executionOrder

    // input should come first
    expect(order.indexOf("input")).toBeLessThan(order.indexOf("research"))
    // research before plan
    expect(order.indexOf("research")).toBeLessThan(order.indexOf("plan"))
    // plan before implement
    expect(order.indexOf("plan")).toBeLessThan(order.indexOf("implement"))
    // implement before review
    expect(order.indexOf("implement")).toBeLessThan(order.indexOf("review"))
  })

  it("should have all expected edges", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "sdlc.json"))
    const parsed = parseWorkflow(loaded.workflow)

    // Check that edges exist (4 connections)
    expect(parsed.edges.size).toBe(4)

    // Check adjacency
    expect(parsed.adjacency.get("input")).toContain("research")
    expect(parsed.adjacency.get("research")).toContain("plan")
    expect(parsed.adjacency.get("plan")).toContain("implement")
    expect(parsed.adjacency.get("implement")).toContain("review")
  })
})

describe("Test Workflow (JSON)", () => {
  it("should load and parse correctly from JSON", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "test.json"))

    expect(loaded.name).toBe("test")
    expect(loaded.workflow.nodes).toHaveLength(2)
    expect(loaded.inputNodeId).toBe("input-1")
    expect(loaded.outputNodeId).toBe("agent-1")
  })
})

describe("Research Workflow (JSON)", () => {
  it("should load and parse correctly from JSON", () => {
    const loaded = loadWorkflowFromFile(join(__dirname, "research.json"))

    expect(loaded.name).toBe("research")
    expect(loaded.workflow.nodes).toHaveLength(2)
    expect(loaded.inputNodeId).toBe("input-1")
    expect(loaded.outputNodeId).toBe("research-1")
  })
})
