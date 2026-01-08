/**
 * Types Tests
 *
 * Tests for type definitions and constants.
 */

import { describe, expect, it } from "bun:test"
import type { AgentConfig, StepOutput, WorkflowDefaults } from "./types"
import { DEFAULT_WORKFLOW_DEFAULTS } from "./types"

describe("types", () => {
  describe("DEFAULT_WORKFLOW_DEFAULTS", () => {
    it("should have correct default timeout (5 minutes = 300000ms)", () => {
      expect(DEFAULT_WORKFLOW_DEFAULTS.timeoutMs).toBe(300000)
    })

    it("should have correct default maxRetries (3)", () => {
      expect(DEFAULT_WORKFLOW_DEFAULTS.maxRetries).toBe(3)
    })

    it("should not have a default model", () => {
      expect(DEFAULT_WORKFLOW_DEFAULTS.model).toBeUndefined()
    })
  })

  describe("AgentConfig type structure", () => {
    it("should support all expected fields", () => {
      const config: AgentConfig = {
        agentType: "build",
        model: "anthropic/claude-sonnet-4-20250514",
        systemPrompt: "Be helpful",
        tools: { bash: true, edit: false },
        timeoutMs: 60000,
        maxRetries: 5,
      }

      expect(config.agentType).toBe("build")
      expect(config.model).toBe("anthropic/claude-sonnet-4-20250514")
      expect(config.systemPrompt).toBe("Be helpful")
      expect(config.tools).toEqual({ bash: true, edit: false })
      expect(config.timeoutMs).toBe(60000)
      expect(config.maxRetries).toBe(5)
    })

    it("should allow minimal config with only agentType", () => {
      const config: AgentConfig = {
        agentType: "build",
      }

      expect(config.agentType).toBe("build")
      expect(config.model).toBeUndefined()
      expect(config.systemPrompt).toBeUndefined()
      expect(config.tools).toBeUndefined()
      expect(config.timeoutMs).toBeUndefined()
      expect(config.maxRetries).toBeUndefined()
    })
  })

  describe("StepOutput type structure", () => {
    it("should have all required fields", () => {
      const output: StepOutput = {
        success: true,
        summary: "Modified 2 files",
        artifacts: ["/src/foo.ts", "/src/bar.ts"],
        response: "Full response text",
      }

      expect(output.success).toBe(true)
      expect(output.summary).toBe("Modified 2 files")
      expect(output.artifacts).toHaveLength(2)
      expect(output.response).toBe("Full response text")
    })

    it("should support empty artifacts array", () => {
      const output: StepOutput = {
        success: true,
        summary: "No files modified",
        artifacts: [],
        response: "Response",
      }

      expect(output.artifacts).toHaveLength(0)
    })

    it("should support failure state", () => {
      const output: StepOutput = {
        success: false,
        summary: "Step failed",
        artifacts: [],
        response: "Error occurred",
      }

      expect(output.success).toBe(false)
    })
  })

  describe("WorkflowDefaults type structure", () => {
    it("should require timeoutMs and maxRetries", () => {
      const defaults: WorkflowDefaults = {
        timeoutMs: 120000,
        maxRetries: 2,
      }

      expect(defaults.timeoutMs).toBe(120000)
      expect(defaults.maxRetries).toBe(2)
    })

    it("should allow optional model", () => {
      const defaults: WorkflowDefaults = {
        timeoutMs: 120000,
        maxRetries: 2,
        model: "anthropic/claude-sonnet-4-20250514",
      }

      expect(defaults.model).toBe("anthropic/claude-sonnet-4-20250514")
    })
  })
})
