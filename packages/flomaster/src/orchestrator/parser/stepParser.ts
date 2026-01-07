/**
 * Step Parser
 *
 * Parses workflow step data into our internal representation.
 * Detects component types and extracts configurations.
 */

import type {
  AgentConfig,
  ConditionalOperator,
  ConditionalRouterConfig,
  LoopConfig,
  ParsedStep,
  PromptConfig,
  StepConfig,
  StepData,
  StepType,
  SubFlowConfig,
  TemplateField,
} from "../types.js"

/**
 * Detects the step type from a workflow step.
 *
 * @param step - The workflow step data
 * @returns The detected step type
 */
export function detectStepType(step: StepData): StepType {
  const template = step.data.node.template
  // Handle cases where data may be incomplete in tests or malformed input
  const baseClasses = Array.isArray(step.data.node.baseClasses) ? step.data.node.baseClasses : []
  const rawDisplayName = step.data.node.displayName
  const displayName = typeof rawDisplayName === "string" ? rawDisplayName.toLowerCase() : ""

  const templateObj = template as Record<string, unknown>
  if (templateObj["operator"] !== undefined && templateObj["match_text"] !== undefined) {
    return "ConditionalRouter"
  }

  // Loop component detection
  const outputs = Array.isArray(step.data.node.outputs) ? step.data.node.outputs : []
  type OutputItem = { name?: string; allowsLoop?: boolean }
  const hasItemOutput = outputs.some((o: OutputItem) => o.name === "item" && o.allowsLoop === true)
  const hasDoneOutput = outputs.some((o: OutputItem) => o.name === "done")
  if (hasItemOutput && hasDoneOutput) {
    return "Loop"
  }

  // SubFlow detection
  if (templateObj["flow_name_selected"] !== undefined || templateObj["flow_id_selected"] !== undefined) {
    return "SubFlow"
  }

  // Agent detection by base classes
  if (baseClasses.includes("Agent") || displayName.includes("agent")) {
    return "Agent"
  }

  // Prompt detection
  const templateField = templateObj["template"] as TemplateField | undefined
  if (baseClasses.includes("Prompt") || templateField?.type === "str") {
    if (displayName.includes("prompt")) {
      return "Prompt"
    }
  }

  // Command detection (workflow step that runs scripts/commands)
  if (baseClasses.includes("Command") || displayName.includes("command")) {
    return "Command"
  }

  // Input detection
  if (displayName.includes("input") && !displayName.includes("output")) {
    return "Input"
  }

  // Output detection
  if (displayName.includes("output")) {
    return "Output"
  }

  return "Generic"
}

/**
 * Extracts input values from a step's template.
 *
 * @param step - The workflow step data
 * @returns Record of input field names to their values
 */
export function extractInputs(step: StepData): Record<string, unknown> {
  const template = step.data.node.template
  const inputs: Record<string, unknown> = {}

  for (const [name, field] of Object.entries(template)) {
    inputs[name] = field.value
  }

  return inputs
}

/**
 * Extracts output names from a step.
 *
 * @param step - The workflow step data
 * @returns Array of output names
 */
export function extractOutputs(step: StepData): string[] {
  const outputs = step.data.node.outputs
  return outputs.map((o) => o.name)
}

/**
 * Helper to get a template field.
 */
function getTemplateField(template: Record<string, TemplateField>, key: string): TemplateField | undefined {
  return template[key]
}

/**
 * Extracts configuration for a ConditionalRouter component.
 */
function extractConditionalConfig(step: StepData): ConditionalRouterConfig {
  const template = step.data.node.template

  const operatorField = getTemplateField(template, "operator")
  const caseSensitiveField = getTemplateField(template, "case_sensitive")
  const maxIterationsField = getTemplateField(template, "max_iterations")
  const trueCaseField = getTemplateField(template, "true_case_message")
  const falseCaseField = getTemplateField(template, "false_case_message")

  return {
    operator: (operatorField?.value as ConditionalOperator | undefined) ?? "equals",
    caseSensitive: (caseSensitiveField?.value as boolean | undefined) ?? true,
    maxIterations: (maxIterationsField?.value as number | undefined) ?? 10,
    trueCaseMessage: trueCaseField?.value,
    falseCaseMessage: falseCaseField?.value,
  }
}

/**
 * Extracts configuration for a Loop component.
 */
function extractLoopConfig(step: StepData): LoopConfig {
  const template = step.data.node.template

  const maxIterationsField = getTemplateField(template, "max_iterations")
  const aggregateField = getTemplateField(template, "aggregate_results")
  const aggregateTypeField = getTemplateField(template, "aggregate_type")

  return {
    maxIterations: (maxIterationsField?.value as number | undefined) ?? 100,
    aggregateResults: (aggregateField?.value as boolean | undefined) ?? true,
    aggregateType: (aggregateTypeField?.value as "array" | "object" | "string" | undefined) ?? "array",
  }
}

/**
 * Extracts configuration for a SubFlow component.
 */
function extractSubFlowConfig(step: StepData): SubFlowConfig {
  const template = step.data.node.template

  const flowNameField = getTemplateField(template, "flow_name_selected")
  const flowIdField = getTemplateField(template, "flow_id_selected")
  const tweaksField = getTemplateField(template, "tweaks")
  const syncField = getTemplateField(template, "synchronous")

  const flowName = flowNameField?.value as string | undefined
  const flowId = flowIdField?.value as string | undefined
  const tweaks = tweaksField?.value as Record<string, unknown> | undefined

  return {
    ...(flowName !== undefined && { flowName }),
    ...(flowId !== undefined && { flowId }),
    ...(tweaks !== undefined && { tweaks }),
    synchronous: (syncField?.value as boolean | undefined) ?? true,
  }
}

/**
 * Extracts configuration for an Agent component.
 */
function extractAgentConfig(step: StepData): AgentConfig {
  const template = step.data.node.template

  const agentTypeField = getTemplateField(template, "agent_type")
  const modelField = getTemplateField(template, "model")
  const systemPromptField = getTemplateField(template, "system_prompt")
  const toolsField = getTemplateField(template, "tools")
  // New fields for per-step configuration
  const timeoutField = getTemplateField(template, "timeout_ms")
  const maxRetriesField = getTemplateField(template, "max_retries")

  const model = modelField?.value as string | undefined
  const systemPrompt = systemPromptField?.value as string | undefined
  // tools is Record<string, boolean> - true to enable, false to disable
  const tools = toolsField?.value as Record<string, boolean> | undefined
  const timeoutMs = timeoutField?.value as number | undefined
  const maxRetries = maxRetriesField?.value as number | undefined

  return {
    // Default to "build" agent - the standard full-access agent in OpenCode
    agentType: (agentTypeField?.value as string | undefined) ?? "build",
    ...(model !== undefined && { model }),
    ...(systemPrompt !== undefined && { systemPrompt }),
    ...(tools !== undefined && { tools }),
    ...(timeoutMs !== undefined && { timeoutMs }),
    ...(maxRetries !== undefined && { maxRetries }),
  }
}

/**
 * Extracts configuration for a Prompt component.
 */
function extractPromptConfig(step: StepData): PromptConfig {
  const template = step.data.node.template

  const templateField = getTemplateField(template, "template")
  const variablesField = getTemplateField(template, "variables")

  const variables = variablesField?.value as Record<string, unknown> | undefined

  return {
    template: (templateField?.value as string | undefined) ?? "",
    ...(variables !== undefined && { variables }),
  }
}

/**
 * Extracts component-specific configuration from a step.
 *
 * @param step - The workflow step data
 * @param type - The detected step type
 * @returns Step-specific configuration
 */
export function extractConfig(step: StepData, type: StepType): StepConfig {
  switch (type) {
    case "ConditionalRouter":
      return {
        type: "ConditionalRouter",
        config: extractConditionalConfig(step),
      }
    case "Loop":
      return { type: "Loop", config: extractLoopConfig(step) }
    case "SubFlow":
      return { type: "SubFlow", config: extractSubFlowConfig(step) }
    case "Agent":
      return { type: "Agent", config: extractAgentConfig(step) }
    case "Prompt":
      return { type: "Prompt", config: extractPromptConfig(step) }
    default:
      return { type: "Generic", config: extractInputs(step) }
  }
}

/**
 * Parses a single workflow step into our internal representation.
 *
 * @param step - The workflow step data
 * @returns Parsed step representation
 */
export function parseStep(step: StepData): ParsedStep {
  const type = detectStepType(step)
  const description = step.data.node.description

  return {
    id: step.id,
    type,
    inputs: extractInputs(step),
    outputs: extractOutputs(step),
    position: step.position,
    config: extractConfig(step, type),
    displayName: step.data.node.displayName,
    ...(description !== undefined && { description }),
  }
}

/**
 * Type guard to check if a step is a note (non-executable).
 */
export function isNoteStep(step: StepData): boolean {
  return step.type === "noteNode"
}

/**
 * Type guard to check if a parsed step is a flow control step.
 */
export function isFlowControlStep(step: ParsedStep): boolean {
  return step.type === "ConditionalRouter" || step.type === "Loop" || step.type === "SubFlow"
}

/**
 * Type guard to check if a parsed step is a conditional router.
 */
export function isConditionalStep(step: ParsedStep): boolean {
  return step.type === "ConditionalRouter"
}

/**
 * Type guard to check if a parsed step is a loop.
 */
export function isLoopStep(step: ParsedStep): boolean {
  return step.type === "Loop"
}

/**
 * Type guard to check if a parsed step is a sub-flow.
 */
export function isSubFlowStep(step: ParsedStep): boolean {
  return step.type === "SubFlow"
}
