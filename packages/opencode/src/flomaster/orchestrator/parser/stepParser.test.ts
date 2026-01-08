/**
 * Step Parser Tests
 *
 * Tests for step parsing, including new config fields (TASK-10).
 */

import { describe, expect, it } from "bun:test"
import type { AgentConfig, StepData, TemplateField } from "../types"
import { detectStepType, extractConfig, extractInputs, extractOutputs, parseStep } from "./stepParser"

/**
 * Creates a StepData object for parser testing.
 */
function createStepData(
  template: Record<string, Partial<TemplateField>>,
  options: { baseClasses?: string[]; displayName?: string } = {},
): StepData {
  const fullTemplate: Record<string, TemplateField> = {}
  for (const [key, val] of Object.entries(template)) {
    fullTemplate[key] = {
      name: val.name ?? key,
      displayName: val.displayName ?? key,
      type: val.type ?? (typeof val.value === "number" ? "number" : "str"),
      value: val.value,
      isRequired: val.isRequired ?? false,
      isAdvanced: val.isAdvanced ?? false,
    }
  }

  return {
    id: "test-step",
    type: "genericNode",
    position: { x: 0, y: 0 },
    data: {
      id: "test-step",
      node: {
        displayName: options.displayName ?? "Test Step",
        documentation: "",
        baseClasses: options.baseClasses ?? [],
        template: fullTemplate,
        outputs: [{ name: "response", displayName: "Response", method: "output", types: ["string"] }],
      },
    },
  }
}

describe("stepParser", () => {
  describe("detectStepType", () => {
    it("should detect Agent from baseClasses", () => {
      const stepData = createStepData({ agent_type: { value: "build" } }, { baseClasses: ["Agent"] })
      expect(detectStepType(stepData)).toBe("Agent")
    })

    it("should detect Agent from displayName containing 'agent'", () => {
      const stepData = createStepData({ agent_type: { value: "build" } }, { displayName: "Research Agent" })
      expect(detectStepType(stepData)).toBe("Agent")
    })

    it("should detect ConditionalRouter from operator field", () => {
      const stepData = createStepData({
        operator: { value: "equals" },
        match_text: { value: "test" },
      })
      expect(detectStepType(stepData)).toBe("ConditionalRouter")
    })

    it("should detect Generic for unknown types", () => {
      const stepData = createStepData({
        some_field: { value: "value" },
      })
      expect(detectStepType(stepData)).toBe("Generic")
    })
  })

  describe("extractInputs", () => {
    it("should extract all template field values", () => {
      const stepData = createStepData({
        prompt: { value: "Hello" },
        max_tokens: { value: 1000 },
      })
      const inputs = extractInputs(stepData)
      expect(inputs["prompt"]).toBe("Hello")
      expect(inputs["max_tokens"]).toBe(1000)
    })
  })

  describe("extractOutputs", () => {
    it("should extract output names", () => {
      const stepData = createStepData({})
      const outputs = extractOutputs(stepData)
      expect(outputs).toContain("response")
    })
  })

  describe("extractConfig for Agent type", () => {
    it("should extract agentType with default 'build'", () => {
      const stepData = createStepData({}, { baseClasses: ["Agent"] })
      const config = extractConfig(stepData, "Agent")
      expect(config.type).toBe("Agent")
      if (config.type === "Agent") {
        expect(config.config.agentType).toBe("build")
      }
    })

    it("should extract custom agentType", () => {
      const stepData = createStepData({ agent_type: { value: "research-agent" } }, { baseClasses: ["Agent"] })
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.agentType).toBe("research-agent")
      }
    })

    it("should extract model", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "build" },
          model: { value: "anthropic/claude-sonnet-4-20250514" },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.model).toBe("anthropic/claude-sonnet-4-20250514")
      }
    })

    it("should extract systemPrompt", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "build" },
          system_prompt: { value: "Be helpful" },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.systemPrompt).toBe("Be helpful")
      }
    })

    it("should extract tools config", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "build" },
          tools: { value: { bash: true, edit: false } },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.tools).toEqual({ bash: true, edit: false })
      }
    })

    // TASK-10: New config fields
    it("should extract timeoutMs", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "build" },
          timeout_ms: { value: 120000 },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.timeoutMs).toBe(120000)
      }
    })

    it("should extract maxRetries", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "research-agent" },
          max_retries: { value: 1 },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.maxRetries).toBe(1)
      }
    })

    it("should extract both timeoutMs and maxRetries together", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "implement-agent" },
          timeout_ms: { value: 300000 },
          max_retries: { value: 3 },
          system_prompt: { value: "Be helpful" },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect(config.config.agentType).toBe("implement-agent")
        expect(config.config.timeoutMs).toBe(300000)
        expect(config.config.maxRetries).toBe(3)
        expect(config.config.systemPrompt).toBe("Be helpful")
      }
    })

    it("should omit undefined fields from config", () => {
      const stepData = createStepData({ agent_type: { value: "build" } }, { baseClasses: ["Agent"] })
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect("timeoutMs" in config.config).toBe(false)
        expect("maxRetries" in config.config).toBe(false)
        expect("model" in config.config).toBe(false)
        expect("systemPrompt" in config.config).toBe(false)
        expect("tools" in config.config).toBe(false)
      }
    })

    it("should not extract removed fields (temperature, maxTokens)", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "build" },
          temperature: { value: 0.7 },
          max_tokens: { value: 4096 },
        },
        { baseClasses: ["Agent"] },
      )
      const config = extractConfig(stepData, "Agent")
      if (config.type === "Agent") {
        expect("temperature" in config.config).toBe(false)
        expect("maxTokens" in config.config).toBe(false)
      }
    })
  })

  describe("parseStep", () => {
    it("should parse complete Agent step with new fields", () => {
      const stepData = createStepData(
        {
          agent_type: { value: "review-agent" },
          timeout_ms: { value: 60000 },
          max_retries: { value: 2 },
          model: { value: "anthropic/claude-sonnet-4-20250514" },
        },
        { baseClasses: ["Agent"], displayName: "Review Agent" },
      )
      const parsed = parseStep(stepData)

      expect(parsed.id).toBe("test-step")
      expect(parsed.type).toBe("Agent")
      expect(parsed.displayName).toBe("Review Agent")
      expect(parsed.config.type).toBe("Agent")
      if (parsed.config.type === "Agent") {
        expect(parsed.config.config.agentType).toBe("review-agent")
        expect(parsed.config.config.timeoutMs).toBe(60000)
        expect(parsed.config.config.maxRetries).toBe(2)
        expect(parsed.config.config.model).toBe("anthropic/claude-sonnet-4-20250514")
      }
    })
  })
})
