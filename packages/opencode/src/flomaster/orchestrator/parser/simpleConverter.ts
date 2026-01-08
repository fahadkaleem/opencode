/**
 * Simple Workflow → React Flow Converter
 *
 * Converts the user-friendly simple JSON workflow format to the
 * React Flow WorkflowData format used by the orchestrator.
 */

import type { SimpleWorkflow, SimpleStep, SimpleWorkflowDefaults } from "../schema/simpleWorkflowSchema"
import type { WorkflowData, StepData, ConnectionData, TemplateField, OutputField } from "../types"

/**
 * Default workflow-level values
 */
const SYSTEM_DEFAULTS = {
  timeoutMs: 300000,
  maxRetries: 3,
  agent: "build",
}

/**
 * Convert simple workflow format to React Flow WorkflowData format
 */
export function convertSimpleToReactFlow(simple: SimpleWorkflow): WorkflowData {
  const nodes = simple.steps.map((step, index) => convertStep(step, simple.defaults, index))
  const edges = buildEdges(simple.steps)

  return {
    nodes,
    edges,
  }
}

/**
 * Convert a simple step to React Flow StepData
 */
function convertStep(step: SimpleStep, defaults: SimpleWorkflow["defaults"], index: number): StepData {
  const template = buildTemplate(step, defaults)
  const outputs = getOutputsForType(step.type)
  const baseClasses = getBaseClassesForType(step.type)

  return {
    id: step.id,
    type: "genericNode",
    position: { x: index * 200, y: 0 }, // Auto-layout placeholder
    data: {
      id: step.id,
      node: {
        displayName: step.name,
        documentation: "",
        baseClasses,
        template,
        outputs,
      },
    },
  }
}

/**
 * Build template fields from simple step config
 */
function buildTemplate(step: SimpleStep, defaults: SimpleWorkflow["defaults"]): Record<string, TemplateField> {
  const template: Record<string, TemplateField> = {}

  // Prompt field (required for agent, input, prompt types)
  if (step.prompt !== undefined || step.type === "input") {
    template["prompt"] = {
      name: "prompt",
      displayName: "Prompt",
      type: "str",
      value: step.prompt ?? "",
      isRequired: true,
      isAdvanced: false,
    }
  }

  // Agent type field
  if (step.type === "agent") {
    const agentType = step.agent ?? defaults?.agent ?? SYSTEM_DEFAULTS.agent
    template["agent_type"] = {
      name: "agent_type",
      displayName: "Agent Type",
      type: "str",
      value: agentType,
      isRequired: true,
      isAdvanced: false,
    }
  }

  // System prompt field
  if (step.system_prompt !== undefined) {
    template["system_prompt"] = {
      name: "system_prompt",
      displayName: "System Prompt",
      type: "str",
      value: step.system_prompt,
      isRequired: false,
      isAdvanced: true,
    }
  }

  // Model field
  if (step.model !== undefined || defaults?.model !== undefined) {
    template["model"] = {
      name: "model",
      displayName: "Model",
      type: "str",
      value: step.model ?? defaults?.model ?? "",
      isRequired: false,
      isAdvanced: true,
    }
  }

  // Timeout field
  const timeoutMs = step.timeout_ms ?? defaults?.timeout_ms ?? SYSTEM_DEFAULTS.timeoutMs
  template["timeout_ms"] = {
    name: "timeout_ms",
    displayName: "Timeout (ms)",
    type: "number",
    value: timeoutMs,
    isRequired: false,
    isAdvanced: true,
  }

  // Max retries field
  const maxRetries = step.max_retries ?? defaults?.max_retries ?? SYSTEM_DEFAULTS.maxRetries
  template["max_retries"] = {
    name: "max_retries",
    displayName: "Max Retries",
    type: "number",
    value: maxRetries,
    isRequired: false,
    isAdvanced: true,
  }

  // Conditional config
  if (step.condition !== undefined) {
    template["operator"] = {
      name: "operator",
      displayName: "Operator",
      type: "str",
      value: step.condition.operator,
      isRequired: true,
      isAdvanced: false,
    }
    template["match_text"] = {
      name: "match_text",
      displayName: "Match Text",
      type: "str",
      value: step.condition.right,
      isRequired: true,
      isAdvanced: false,
    }
    // Input text - the value to compare (executor expects "input_text")
    template["input_text"] = {
      name: "input_text",
      displayName: "Input Text",
      type: "str",
      value: step.condition.left,
      isRequired: true,
      isAdvanced: false,
    }
  }

  // Loop config (executor expects "items", "data", or "list" - we use "items")
  if (step.loop !== undefined) {
    template["items"] = {
      name: "items",
      displayName: "Items",
      type: "str",
      value: step.loop.items,
      isRequired: true,
      isAdvanced: false,
    }
    template["max_iterations"] = {
      name: "max_iterations",
      displayName: "Max Iterations",
      type: "number",
      value: step.loop.max_iterations ?? 100,
      isRequired: false,
      isAdvanced: true,
    }
  }

  return template
}

/**
 * Get output definitions for step type
 */
function getOutputsForType(type: SimpleStep["type"]): OutputField[] {
  switch (type) {
    case "input":
      return [{ name: "prompt", displayName: "Prompt", method: "output", types: ["string"] }]
    case "output":
      return []
    case "agent":
      return [{ name: "response", displayName: "Response", method: "output", types: ["string"] }]
    case "conditional":
      return [
        { name: "true", displayName: "True", method: "output", types: ["string"] },
        { name: "false", displayName: "False", method: "output", types: ["string"] },
      ]
    case "loop":
      return [
        { name: "item", displayName: "Current Item", method: "output", types: ["string"], allowsLoop: true },
        { name: "done", displayName: "Done", method: "output", types: ["string"] },
      ]
    default:
      return [{ name: "output", displayName: "Output", method: "output", types: ["string"] }]
  }
}

/**
 * Get base classes for step type (for parser type detection)
 */
function getBaseClassesForType(type: SimpleStep["type"]): string[] {
  switch (type) {
    case "input":
      return ["Input"]
    case "output":
      return ["Output"]
    case "agent":
      return ["Agent"]
    case "conditional":
      return ["ConditionalRouter"]
    case "loop":
      return ["Loop"]
    default:
      return ["Generic"]
  }
}

/**
 * Build edges from step dependencies
 */
function buildEdges(steps: SimpleStep[]): ConnectionData[] {
  const edges: ConnectionData[] = []
  let edgeIndex = 0

  for (const step of steps) {
    const dependsOn = step.depends_on ?? []
    for (const sourceId of dependsOn) {
      const sourceStep = steps.find((s) => s.id === sourceId)
      if (!sourceStep) continue

      // Determine output name from source step type
      const sourceName = getDefaultOutputName(sourceStep.type)
      // Determine input name (usually "prompt" for agent steps)
      const targetName = step.type === "agent" ? "prompt" : "input"

      const edge: ConnectionData = {
        id: `e-${sourceId}-${step.id}-${edgeIndex++}`,
        source: sourceId,
        target: step.id,
        sourceHandle: JSON.stringify({
          dataType: "string",
          id: `${sourceId}-output-${sourceName}`,
          name: sourceName,
          outputTypes: ["string"],
        }),
        targetHandle: JSON.stringify({
          fieldName: targetName,
          id: `${step.id}-input-${targetName}`,
          inputTypes: ["string"],
          type: "str",
        }),
        data: {
          sourceHandle: {
            dataType: "string",
            id: `${sourceId}-output-${sourceName}`,
            name: sourceName,
            outputTypes: ["string"],
          },
          targetHandle: {
            fieldName: targetName,
            id: `${step.id}-input-${targetName}`,
            inputTypes: ["string"],
            type: "str",
          },
        },
      }
      edges.push(edge)
    }
  }

  return edges
}

/**
 * Get default output name for step type
 */
function getDefaultOutputName(type: SimpleStep["type"]): string {
  switch (type) {
    case "input":
      return "prompt"
    case "agent":
      return "response"
    case "conditional":
      return "true" // Default branch
    case "loop":
      return "item"
    default:
      return "output"
  }
}

/**
 * Get input node ID from workflow (first "input" type step)
 */
export function getInputNodeId(simple: SimpleWorkflow): string {
  const inputStep = simple.steps.find((s) => s.type === "input")
  if (inputStep) return inputStep.id

  // Fallback: first step with no dependencies
  const entryStep = simple.steps.find((s) => !s.depends_on || s.depends_on.length === 0)
  if (entryStep) return entryStep.id

  // Final fallback: first step (schema guarantees at least one step)
  const firstStep = simple.steps[0]
  if (!firstStep) throw new Error("Workflow must have at least one step")
  return firstStep.id
}

/**
 * Get output node ID from workflow (last step or explicit "output" type)
 */
export function getOutputNodeId(simple: SimpleWorkflow): string {
  const outputStep = simple.steps.find((s) => s.type === "output")
  if (outputStep) return outputStep.id

  // Fallback: step with no dependents (nothing depends on it)
  for (const step of [...simple.steps].reverse()) {
    const hasDependents = simple.steps.some((s) => s.depends_on?.includes(step.id))
    if (!hasDependents) return step.id
  }

  // Final fallback: last step (schema guarantees at least one step)
  const lastStep = simple.steps[simple.steps.length - 1]
  if (!lastStep) throw new Error("Workflow must have at least one step")
  return lastStep.id
}
