/**
 * SDLC Workflow Tests (TASK-10)
 *
 * Tests to verify the SDLC workflow is correctly configured with new step config fields.
 */

import { describe, expect, it } from "bun:test"
import { sdlcWorkflow } from "./sdlc-workflow.js"
import { parseWorkflow } from "../parser/workflowParser.js"
import type { AgentConfig } from "../types.js"

describe("SDLC Workflow with Step Configuration (TASK-10)", () => {
  it("should parse SDLC workflow successfully", () => {
    const parsed = parseWorkflow(sdlcWorkflow)
    expect(parsed.nodes.size).toBe(5) // input + research + plan + implement + review
    expect(parsed.entryPoints).toContain("input")
    expect(parsed.exitPoints).toContain("review")
  })

  it("should have research step with correct timeout and retries", () => {
    const parsed = parseWorkflow(sdlcWorkflow)
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
    const parsed = parseWorkflow(sdlcWorkflow)
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
    const parsed = parseWorkflow(sdlcWorkflow)
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
    const parsed = parseWorkflow(sdlcWorkflow)
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
    const parsed = parseWorkflow(sdlcWorkflow)
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
    const parsed = parseWorkflow(sdlcWorkflow)

    // Check that edges exist (4 connections)
    expect(parsed.edges.size).toBe(4)

    // Check adjacency
    expect(parsed.adjacency.get("input")).toContain("research")
    expect(parsed.adjacency.get("research")).toContain("plan")
    expect(parsed.adjacency.get("plan")).toContain("implement")
    expect(parsed.adjacency.get("implement")).toContain("review")
  })
})
