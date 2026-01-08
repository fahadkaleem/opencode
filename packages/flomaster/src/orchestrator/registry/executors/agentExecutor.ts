/**
 * Agent Step Executor
 *
 * Executes Agent steps using OpenCode's Session and SessionPrompt directly.
 * Follows the pattern established by task.ts for proper agent integration.
 *
 * DESIGN DECISION: Sessions Are Not Deleted
 *
 * Step sessions are intentionally preserved after workflow execution because:
 * 1. Users may want to chat with step agents to understand their work
 * 2. The session history provides audit trail of what happened
 * 3. Future UI will allow clicking a step to open chat with that agent
 * 4. Parent-child relationship enables grouped display in TUI
 *
 * Sessions can be manually cleaned up via:
 * - Session.remove(sessionId) for individual sessions
 * - Workflow cleanup utilities (to be implemented)
 */

import { Log } from "opencode/util/log"
import { Session } from "opencode/session/index"
import { SessionPrompt } from "opencode/session/prompt"
import { Identifier } from "opencode/id/id"
import { Agent } from "opencode/agent/agent"
import { Provider } from "opencode/provider/provider"
import { defer } from "opencode/util/defer"
import type { AgentConfig, ExecuteStepOutput, ParsedStep } from "../../types.js"
import { AgentExecutionError } from "../../errors.js"
import type { ExecutorContext, ExecutorDependencies, ExecutorOptions, StepExecutor } from "../types.js"
import { getExecutionLogger, type ExecutionLogger } from "../../../state/executionLogger.js"
import { mergeStepInputs, replaceTemplateVariables } from "./executorUtils.js"

// Re-export for backward compatibility
export { AgentExecutionError } from "../../errors.js"

// Global logger for module-level logging (before execution context is available)
const globalLog = Log.create({ service: "AgentExecutor" })

/** Default timeout in milliseconds (5 minutes) */
const DEFAULT_TIMEOUT_MS = 300000

/**
 * Combines multiple AbortSignals into one.
 * The combined signal aborts when ANY of the input signals abort.
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason)
      },
      { once: true },
    )
  }

  return controller.signal
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
    return replaceTemplateVariables(template, inputs)
  }

  return `Execute agent "${config.agentType}" with inputs:\n${JSON.stringify(inputs, null, 2)}`
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
 * Extracts file artifacts from completed tool calls.
 * Looks for edit, write, and patch tools that modified files.
 * @internal Exported for testing
 */
export function extractArtifactsFromToolCalls(
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>,
): string[] {
  const artifacts: string[] = []

  for (const tc of toolCalls) {
    // Extract file paths from edit/write tools
    if (tc.name === "edit" || tc.name === "write") {
      const args = tc.args as { file_path?: string; filePath?: string } | undefined
      const filePath = args?.file_path ?? args?.filePath
      if (filePath && !artifacts.includes(filePath)) {
        artifacts.push(filePath)
      }
    }

    // Extract from patch tool results (file modifications)
    if (tc.name === "patch" && tc.result) {
      const result = tc.result as { path?: string; file?: string } | undefined
      const filePath = result?.path ?? result?.file
      if (filePath && !artifacts.includes(filePath)) {
        artifacts.push(filePath)
      }
    }
  }

  return artifacts
}

/**
 * Generates a summary from the response and artifacts.
 * Truncates long responses and adds artifact count.
 * @internal Exported for testing
 */
export function generateSummary(response: string, artifacts: string[]): string {
  const MAX_SUMMARY_LENGTH = 200

  // Truncate response for summary
  let summary = response.trim()
  if (summary.length > MAX_SUMMARY_LENGTH) {
    summary = summary.substring(0, MAX_SUMMARY_LENGTH).trim() + "..."
  }

  // Add artifact info if present
  if (artifacts.length > 0) {
    const artifactInfo =
      artifacts.length === 1 ? `Modified 1 file: ${artifacts[0]}` : `Modified ${artifacts.length} files`
    summary = artifactInfo + (summary ? `. ${summary}` : "")
  }

  return summary || "Step completed"
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
          warnings.push("agentType not specified, using default 'build' agent")
        }
      }

      return { valid: errors.length === 0, errors, warnings }
    },

    async execute(step: ParsedStep, context: ExecutorContext, options?: ExecutorOptions): Promise<ExecuteStepOutput> {
      // Create execution-specific logger (use executionsDir for correct repo root path)
      const log = getExecutionLogger(context.executionId, `AgentExecutor:${step.id}`, context.executionsDir)
      log.info("Starting agent execution", { stepId: step.id, stepName: step.displayName })

      const config = step.config
      if (config.type !== "Agent") {
        throw new AgentExecutionError(`Invalid config type for agent step: ${config.type}`, step.id)
      }

      // Get timeout from step config, fall back to options, then default
      const timeoutMs = config.config.timeoutMs ?? options?.timeout ?? DEFAULT_TIMEOUT_MS
      log.info("Timeout configured", { stepId: step.id, timeoutMs })

      // Create abort controller for timeout
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => {
        timeoutController.abort(new Error(`Step timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      // Combine with external signal if provided
      const combinedSignal = options?.signal
        ? combineAbortSignals(options.signal, timeoutController.signal)
        : timeoutController.signal

      // Get agent type from config, default to "build"
      const agentType = config.config.agentType ?? "build"

      // Look up the agent (built-in or custom from .opencode/agents/)
      const agent = await Agent.get(agentType)
      if (!agent) {
        clearTimeout(timeoutId)
        throw new AgentExecutionError(
          `Unknown agent type: "${agentType}". ` +
            `Define it in .opencode/agents/${agentType}.md or use a built-in agent (build, plan, explore, general).`,
          step.id,
        )
      }
      log.info("Agent loaded", { stepId: step.id, agentType, agentName: agent.name })

      // Dry-run mode - validate agent exists even in dry-run
      if (context.dryRun) {
        clearTimeout(timeoutId)
        log.info("Dry-run mode: returning mock response", { stepId: step.id })
        return {
          stepId: step.id,
          outputs: {
            success: true,
            summary: `[DRY-RUN] Would execute ${step.displayName} with agent "${agent.name}"`,
            artifacts: [],
            response: `[DRY-RUN] Agent ${step.displayName} (${agent.name}) would execute`,
          },
          complete: true,
        }
      }

      // Build inputs from step inputs + previous outputs
      const stepInputs = mergeStepInputs(step, context)

      // Build permission rules: deny "task" + any additional tool restrictions from step config
      // This prevents infinite recursion - workflow steps cannot spawn subagents via task tool
      const permissionRules: Array<{ permission: string; pattern: string; action: "allow" | "deny" }> = [
        { permission: "task", pattern: "*", action: "deny" },
      ]

      // Add tool restrictions from step config (if any)
      // AgentConfig.tools is Record<string, boolean> - false means deny
      if (config.config.tools) {
        for (const [tool, enabled] of Object.entries(config.config.tools)) {
          permissionRules.push({
            permission: tool,
            pattern: "*",
            action: enabled ? "allow" : "deny",
          })
        }
      }

      // Create child session (following task.ts pattern)
      // Permissions are set on Session.create() - this is the preferred approach
      // (SessionPrompt.prompt's `tools` param is deprecated)
      log.info("Creating session", { stepId: step.id, parentID: context.workflowSessionID })

      const session = await Session.create({
        ...(context.workflowSessionID !== undefined && { parentID: context.workflowSessionID }),
        title: `${step.displayName} (@${agent.name})`,
        permission: permissionRules,
      })
      log.info("Session created", { stepId: step.id, sessionId: session.id, agentName: agent.name })

      // Emit session_created event immediately for crash recovery
      // This allows the state manager to record the mapping before execution starts
      options?.onEvent?.({ type: "session_created", sessionId: session.id, agentName: agent.name })

      // Set up signal handling with combined signal (timeout + external)
      function cancel() {
        SessionPrompt.cancel(session.id)
      }
      combinedSignal.addEventListener("abort", cancel, { once: true })
      using _ = defer(() => {
        combinedSignal.removeEventListener("abort", cancel)
        clearTimeout(timeoutId)
      })

      try {
        // Build the prompt
        const prompt = buildAgentPrompt(config.config, stepInputs)
        log.info("Built prompt", { stepId: step.id, promptLength: prompt.length })

        const messageID = Identifier.ascending("message")

        // Determine model (step config > agent config > undefined for default)
        // Model is string format "provider/model" - parse with Provider.parseModel()
        let model: { modelID: string; providerID: string } | undefined = agent.model
        if (config.config.model !== undefined) {
          const parsed = Provider.parseModel(config.config.model)
          if (!parsed.providerID || !parsed.modelID) {
            throw new AgentExecutionError(
              `Invalid model format: "${config.config.model}". Expected "provider/model" format (e.g., "anthropic/claude-sonnet-4-20250514").`,
              step.id,
            )
          }
          model = { modelID: parsed.modelID, providerID: parsed.providerID }
        }

        // Call SessionPrompt.prompt with agent (following task.ts pattern)
        // NOTE: We do NOT pass `tools` here - it's deprecated. Use Session permissions instead.
        log.info("Calling SessionPrompt.prompt", {
          stepId: step.id,
          agentName: agent.name,
          model: model?.modelID,
        })

        const result = await SessionPrompt.prompt({
          messageID,
          sessionID: session.id,
          ...(model !== undefined && { model }),
          agent: agent.name, // KEY: Pass the agent name!
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

        // Extract artifacts from tool calls
        const artifacts = extractArtifactsFromToolCalls(toolCalls)

        // Generate summary
        const summary = generateSummary(response, artifacts)

        log.info("Execution completed", {
          stepId: step.id,
          sessionId: session.id,
          responseLength: response.length,
          toolCallCount: toolCalls.length,
          artifactCount: artifacts.length,
        })

        // Return consistent StepOutput structure INCLUDING sessionID (DON'T delete session!)
        return {
          stepId: step.id,
          sessionID: session.id, // KEY: Return sessionID for UI access
          outputs: {
            success: true,
            summary,
            artifacts,
            response,
            // Keep toolCalls for debugging/advanced use
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          },
          complete: true,
        }

        // NOTE: We intentionally do NOT delete the session here.
        // The session persists so users can interact with the agent later via UI.
      } catch (error) {
        log.error("Execution failed", {
          stepId: step.id,
          sessionId: session.id,
          error: error instanceof Error ? error.message : String(error),
        })

        // Check if it was a timeout
        if (timeoutController.signal.aborted) {
          throw new AgentExecutionError(
            `Step "${step.displayName}" timed out after ${timeoutMs}ms`,
            step.id,
            error instanceof Error ? error : undefined,
          )
        }

        // On error, we still keep the session for debugging purposes
        // User can see what happened and potentially retry

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
        success: true,
        summary: `Agent ${step.displayName} executed (no directory configured)`,
        artifacts: [],
        response: `Agent ${step.displayName} executed (no directory configured)`,
        _placeholder: true,
      },
      complete: true,
    })
  },
}
