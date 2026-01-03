/**
 * Agent Step Executor
 *
 * Executes Agent steps using OpenCode's Session and SessionPrompt directly.
 * Follows the pattern established by task.ts and github.ts.
 */

import { Log } from "../../../util/log.js"
import { Session } from "../../../session/index.js"
import { SessionPrompt } from "../../../session/prompt.js"
import { Identifier } from "../../../id/id.js"
import type { AgentConfig, ExecuteStepOutput, ParsedStep } from "../../types.js"
import type { ExecutorContext, ExecutorDependencies, ExecutorOptions, StepExecutor } from "../types.js"

const log = Log.create({ service: "AgentExecutor" })

/**
 * Error thrown when agent execution fails.
 */
export class AgentExecutionError extends Error {
  readonly stepId: string
  override readonly cause?: Error

  constructor(message: string, stepId: string, cause?: Error) {
    super(message)
    this.name = "AgentExecutionError"
    this.stepId = stepId
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

/**
 * Result from agent execution.
 */
export type AgentExecutionResult = {
  readonly response: string
  readonly toolCalls: Array<{
    readonly name: string
    readonly args: unknown
    readonly result: unknown
  }>
}

/**
 * Build a prompt from agent config and inputs.
 */
function buildAgentPrompt(config: AgentConfig, inputs: Record<string, unknown>): string {
  const template = (inputs["prompt"] ?? inputs["template"] ?? inputs["message"]) as string | undefined

  if (template !== undefined) {
    let result = template
    for (const [key, value] of Object.entries(inputs)) {
      const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g")
      result = result.replace(pattern, String(value ?? ""))
    }
    return result
  }

  return `Execute agent "${config.agentType}" with inputs:\n${JSON.stringify(inputs, null, 2)}`
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Extract text content from message parts.
 */
function extractTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
}

/**
 * Extract tool calls from message parts.
 */
function extractToolCallsFromParts(
  parts: Array<{ type: string; tool?: string; state?: { status: string; input?: unknown; output?: unknown } }>,
): Array<{ name: string; args: unknown; result: unknown }> {
  return parts
    .filter((p) => p.type === "tool" && p.state?.status === "completed")
    .map((p) => ({
      name: p.tool ?? "unknown",
      args: p.state?.input ?? {},
      result: p.state?.output ?? null,
    }))
}

/**
 * Create an agent step executor that uses Session/SessionPrompt directly.
 *
 * @param directory - Working directory for session context
 * @returns StepExecutor for Agent steps
 *
 * @example
 * ```typescript
 * const agentExecutor = createAgentExecutor(process.cwd());
 * registry.register(agentExecutor, 'custom');
 * ```
 */
export function createAgentExecutor(_directory: string): StepExecutor<"Agent"> {
  return {
    type: "Agent",

    validate(step: ParsedStep) {
      const errors: string[] = []
      const warnings: string[] = []

      if (step.config.type !== "Agent") {
        errors.push(`Invalid config type: expected 'Agent', got '${step.config.type}'`)
      } else {
        const config = step.config.config
        if (config.agentType === "") {
          warnings.push("agentType not specified, using default")
        }
      }

      return { valid: errors.length === 0, errors, warnings }
    },

    async execute(step: ParsedStep, context: ExecutorContext, _options?: ExecutorOptions): Promise<ExecuteStepOutput> {
      log.info("Starting agent execution", { stepId: step.id, stepName: step.displayName })

      const config = step.config
      if (config.type !== "Agent") {
        throw new AgentExecutionError(`Invalid config type for agent step: ${config.type}`, step.id)
      }

      // Dry-run mode
      if (context.dryRun) {
        log.info("Dry-run mode: returning mock response", { stepId: step.id })
        return {
          stepId: step.id,
          outputs: {
            response: `[DRY-RUN] Agent ${step.displayName} would execute`,
            success: true,
          },
          complete: true,
        }
      }

      // Build inputs from step inputs + previous outputs
      const stepInputs: Record<string, unknown> = { ...step.inputs }
      for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
        for (const [key, value] of Object.entries(stepOutputs)) {
          stepInputs[`${stepId}.${key}`] = value
        }
      }

      try {
        // Create session as child of workflow session (following task.ts pattern)
        // This establishes parent-child hierarchy for visibility in the TUI
        log.info("Creating session", { stepId: step.id, parentID: context.workflowSessionID })
        const session = await Session.create({
          ...(context.workflowSessionID !== undefined && { parentID: context.workflowSessionID }),
          title: `${step.displayName} (@agent subagent)`,
        })
        log.info("Session created", { stepId: step.id, sessionId: session.id })

        try {
          const prompt = buildAgentPrompt(config.config, stepInputs)
          log.info("Built prompt", { stepId: step.id, promptLength: prompt.length })

          const messageID = Identifier.ascending("message")

          // Determine model
          const model =
            config.config.model !== undefined ? { providerID: "anthropic", modelID: config.config.model } : undefined

          // Call SessionPrompt.prompt directly (following task.ts pattern)
          log.info("Calling SessionPrompt.prompt", { stepId: step.id, model: model?.modelID })
          const result = await SessionPrompt.prompt({
            messageID,
            sessionID: session.id,
            ...(model !== undefined && { model }),
            ...(config.config.systemPrompt !== undefined && { system: config.config.systemPrompt }),
            parts: [
              {
                id: Identifier.ascending("part"),
                type: "text",
                text: prompt,
              },
            ],
          })

          // Extract response text and tool calls from result
          const response = extractTextFromParts(result.parts as Array<{ type: string; text?: string }>)
          const toolCalls = extractToolCallsFromParts(
            result.parts as Array<{
              type: string
              tool?: string
              state?: { status: string; input?: unknown; output?: unknown }
            }>,
          )

          log.info("Execution completed", {
            stepId: step.id,
            responseLength: response.length,
            toolCallCount: toolCalls.length,
          })

          return {
            stepId: step.id,
            outputs: {
              response,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              success: true,
            },
            complete: true,
          }
        } finally {
          // Clean up session
          log.debug("Removing session", { stepId: step.id, sessionId: session.id })
          await Session.remove(session.id).catch((e) => {
            log.warn("Failed to remove session", { stepId: step.id, error: String(e) })
          })
        }
      } catch (error) {
        log.error("Execution failed", {
          stepId: step.id,
          error: error instanceof Error ? error.message : String(error),
        })
        if (error instanceof AgentExecutionError) {
          throw error
        }
        throw new AgentExecutionError(
          `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
          step.id,
          error instanceof Error ? error : undefined,
        )
      }
    },
  }
}

/**
 * Create an agent executor from dependencies.
 */
export function createAgentExecutorFromDependencies(dependencies: ExecutorDependencies): StepExecutor<"Agent"> | null {
  if (dependencies.directory == null) {
    return null
  }
  return createAgentExecutor(dependencies.directory)
}

/**
 * Placeholder agent executor for when no directory is available.
 */
export const placeholderAgentExecutor: StepExecutor<"Agent"> = {
  type: "Agent",

  execute(step: ParsedStep, _context: ExecutorContext, _options?: ExecutorOptions): Promise<ExecuteStepOutput> {
    return Promise.resolve({
      stepId: step.id,
      outputs: {
        response: `Agent ${step.displayName} executed (no directory configured)`,
        success: true,
        _placeholder: true,
      },
      complete: true,
    })
  },
}
