import * as path from "node:path"
import type { Argv } from "yargs"
import { UI } from "opencode/cli/ui"
import { cmd } from "opencode/cli/cmd/cmd"
import { bootstrap } from "opencode/cli/bootstrap"
import { Instance } from "opencode/project/instance"
import { SessionPrompt } from "opencode/session/prompt"
import { Identifier } from "opencode/id/id"
import { createWorkflowEngine } from "../orchestrator/engine/factory.js"
import { testWorkflow } from "../orchestrator/workflows/test-workflow.js"
import { researchWorkflow } from "../orchestrator/workflows/research-workflow.js"
import { sdlcWorkflow } from "../orchestrator/workflows/sdlc-workflow.js"
import type { WorkflowData, WorkflowEvent } from "../orchestrator/types.js"
import { createStateManager, type StateManager } from "../state/stateManager.js"
import { ExecutionStatus, StepExecutionStatus } from "../state/types.js"
import { FLOMASTER_DIR, EXECUTIONS_DIR } from "../state/defaults.js"

/**
 * Available workflows
 */
const workflows: Record<string, { workflow: WorkflowData; inputNodeId: string; outputNodeId: string }> = {
  test: { workflow: testWorkflow, inputNodeId: "input-1", outputNodeId: "agent-1" },
  research: { workflow: researchWorkflow, inputNodeId: "input-1", outputNodeId: "research-1" },
  sdlc: { workflow: sdlcWorkflow, inputNodeId: "input", outputNodeId: "review" },
}

/**
 * Create a workflow with the input node's prompt value set.
 */
function createWorkflowWithInput(workflow: WorkflowData, inputNodeId: string, promptValue: string): WorkflowData {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => {
      if (node.id !== inputNodeId) return node
      return {
        ...node,
        data: {
          ...node.data,
          node: {
            ...node.data.node,
            template: {
              ...node.data.node.template,
              prompt: {
                ...node.data.node.template["prompt"],
                value: promptValue,
              },
            },
          },
        },
      }
    }),
  }
}

/**
 * Workflow run subcommand
 */
const WorkflowRunCommand = cmd({
  command: "run [message..]",
  describe: "Run a workflow",
  builder: (yargs: Argv) => {
    return yargs
      .positional("message", {
        describe: "Initial prompt for the workflow",
        type: "string",
        array: true,
        default: [],
      })
      .option("workflow", {
        alias: "w",
        describe: `Workflow to run (${Object.keys(workflows).join(", ")})`,
        type: "string",
        default: "test",
      })
      .option("dry-run", {
        describe: "Validate workflow without executing",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    const message =
      args.message.length > 0 ? args.message.join(" ") : "Hello! This is a test of the FloMaster workflow orchestrator."

    const workflowName = args.workflow as string
    const workflowConfig = workflows[workflowName]
    if (!workflowConfig) {
      UI.error(`Unknown workflow: ${workflowName}. Available: ${Object.keys(workflows).join(", ")}`)
      process.exit(1)
    }

    await bootstrap(process.cwd(), async () => {
      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + `Starting workflow: ${workflowName}...`)
      UI.println()

      const { engine, stateManager } = await createWorkflowEngine({
        directory: Instance.worktree,
        enableStateManager: true,
      })

      // Track step completion times for recording
      const stepStartTimes = new Map<string, number>()

      // Subscribe to workflow events
      const subscription = engine.subscribe((event: WorkflowEvent) => {
        switch (event.type) {
          case "WORKFLOW_STARTED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD +
                "| " +
                UI.Style.TEXT_NORMAL +
                "Workflow started: " +
                UI.Style.TEXT_DIM +
                event.executionId,
            )
            break

          case "STEP_STARTED":
            stepStartTimes.set(event.stepId, Date.now())
            UI.println(
              UI.Style.TEXT_INFO_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step started: " +
                UI.Style.TEXT_HIGHLIGHT_BOLD +
                event.displayName,
            )
            break

          case "STEP_COMPLETED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step completed: " +
                UI.Style.TEXT_HIGHLIGHT_BOLD +
                event.stepId,
            )
            // Record step result immediately for crash recovery
            if (stateManager && !args.dryRun) {
              const startTime = stepStartTimes.get(event.stepId) ?? Date.now()
              stateManager
                .recordStepResult(executionId, event.stepId, {
                  status: StepExecutionStatus.COMPLETED,
                  outputs: event.outputs as Record<string, unknown> | undefined,
                  startTime,
                  endTime: Date.now(),
                })
                .catch(() => {
                  // Ignore errors during step recording - workflow can continue
                })
            }
            break

          case "STEP_SESSION_CREATED":
            // Record session mapping immediately for crash recovery
            // This allows resume to find and continue the session
            if (stateManager && !args.dryRun) {
              stateManager.mapStepToSession(executionId, event.stepId, event.sessionID).catch(() => {
                // Ignore errors - non-critical for workflow execution
              })
            }
            break

          case "STEP_FAILED":
            UI.println(
              UI.Style.TEXT_DANGER_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step failed: " +
                event.stepId +
                " - " +
                (event.error ?? "Unknown error"),
            )
            break

          case "WORKFLOW_COMPLETED":
            UI.println(UI.Style.TEXT_SUCCESS_BOLD + "| " + UI.Style.TEXT_NORMAL + "Workflow completed!")
            break

          case "WORKFLOW_FAILED":
            UI.println(UI.Style.TEXT_DANGER_BOLD + "| " + UI.Style.TEXT_NORMAL + "Workflow failed: " + event.error)
            break
        }
      })

      // Generate execution ID
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      // Create execution record if state manager is available and not dry-run
      if (stateManager && !args.dryRun) {
        await stateManager.createExecution(executionId, workflowName)
        // Store input prompt for resume capability
        await stateManager.mergeStepOutputs(executionId, workflowConfig.inputNodeId, {
          prompt: message,
        })
      }

      try {
        // Set the prompt input in the workflow
        const workflowWithInput = createWorkflowWithInput(workflowConfig.workflow, workflowConfig.inputNodeId, message)

        // Execute the workflow
        const result = await engine.executeWorkflow(workflowWithInput, `${workflowName}-workflow-run`, {
          executionId,
          dryRun: args.dryRun,
          variables: { prompt: message },
        })

        UI.println()

        if (result.terminateMode === "COMPLETED") {
          // Record final state
          if (stateManager && !args.dryRun) {
            // Record step results
            for (const stepResult of result.stepResults) {
              await stateManager.recordStepResult(executionId, stepResult.stepId, {
                status: StepExecutionStatus.COMPLETED,
                outputs: result.outputs[stepResult.stepId] as Record<string, unknown> | undefined,
                startTime: result.startTime,
                endTime: result.endTime,
                sessionId: stepResult.sessionID,
              })
            }
            await stateManager.updateExecutionStatus(executionId, ExecutionStatus.COMPLETED)
          }

          // Extract and display the agent's response
          const agentOutput = result.outputs[workflowConfig.outputNodeId] as Record<string, unknown> | undefined
          if (agentOutput?.["response"]) {
            UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + "Agent Response:")
            UI.println()
            UI.println(UI.markdown(String(agentOutput["response"])))
          }

          // Show session info if available
          if (result.workflowSessionID) {
            UI.println()
            UI.println(UI.Style.TEXT_DIM + `Workflow Session: ${result.workflowSessionID}`)
          }
          const stepWithSession = result.stepResults.find((s) => s.sessionID)
          if (stepWithSession?.sessionID) {
            UI.println(UI.Style.TEXT_DIM + `Agent Session: ${stepWithSession.sessionID}`)
          }

          // Show execution ID for state inspection
          if (stateManager && !args.dryRun) {
            UI.println(UI.Style.TEXT_DIM + `Execution ID: ${executionId}`)
          }
        } else if (result.terminateMode === "FAILED") {
          // Record failed state
          if (stateManager && !args.dryRun) {
            await stateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
          }
          UI.error(`Workflow failed: ${result.error}`)
          process.exit(1)
        }
      } catch (error) {
        // Record failed state on exception
        if (stateManager && !args.dryRun) {
          await stateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
        }
        throw error
      } finally {
        subscription.unsubscribe()
      }
    })
  },
})

/**
 * Helper to get an initialized state manager.
 * Uses Instance.worktree to ensure consistent path with workflow engine.
 */
async function getStateManager() {
  const executionsDir = path.join(Instance.worktree, FLOMASTER_DIR, EXECUTIONS_DIR)
  return createStateManager({ executionsDir })
}

/**
 * Format a date string for display
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString()
}

/**
 * Get status color style
 */
function getStatusStyle(status: ExecutionStatus): string {
  switch (status) {
    case ExecutionStatus.COMPLETED:
      return UI.Style.TEXT_SUCCESS_BOLD
    case ExecutionStatus.FAILED:
    case ExecutionStatus.CANCELLED:
      return UI.Style.TEXT_DANGER_BOLD
    case ExecutionStatus.RUNNING:
      return UI.Style.TEXT_INFO_BOLD
    case ExecutionStatus.PAUSED:
      return UI.Style.TEXT_WARNING_BOLD
    default:
      return UI.Style.TEXT_DIM
  }
}

/**
 * Workflow list subcommand
 */
const WorkflowListCommand = cmd({
  command: "list",
  describe: "List workflow executions",
  builder: (yargs: Argv) => {
    return yargs
      .option("status", {
        alias: "s",
        describe: "Filter by status (completed, failed, running, created, paused, cancelled)",
        type: "string",
      })
      .option("limit", {
        alias: "n",
        describe: "Maximum number of executions to show",
        type: "number",
        default: 20,
      })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const stateManager = await getStateManager()

      // Build filter
      const statusFilter = args.status ? (args.status.toUpperCase() as ExecutionStatus) : undefined

      const executions = await stateManager.listExecutions({
        status: statusFilter,
        limit: args.limit,
      })

      if (executions.length === 0) {
        UI.println(UI.Style.TEXT_DIM + "No workflow executions found.")
        return
      }

      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "Workflow Executions" + UI.Style.TEXT_NORMAL)
      UI.println()

      // Table header
      UI.println(
        UI.Style.TEXT_DIM +
          "ID".padEnd(30) +
          "Workflow".padEnd(15) +
          "Status".padEnd(12) +
          "Steps".padEnd(10) +
          "Updated" +
          UI.Style.TEXT_NORMAL,
      )
      UI.println(UI.Style.TEXT_DIM + "-".repeat(90) + UI.Style.TEXT_NORMAL)

      for (const exec of executions) {
        const statusStyle = getStatusStyle(exec.status)
        const stepsInfo = `${exec.completedCount}/${exec.stepCount}`

        UI.println(
          UI.Style.TEXT_HIGHLIGHT_BOLD +
            exec.executionId.slice(0, 28).padEnd(30) +
            UI.Style.TEXT_NORMAL +
            exec.workflowName.slice(0, 13).padEnd(15) +
            statusStyle +
            exec.status.padEnd(12) +
            UI.Style.TEXT_NORMAL +
            stepsInfo.padEnd(10) +
            UI.Style.TEXT_DIM +
            formatDate(exec.updatedAt) +
            UI.Style.TEXT_NORMAL,
        )
      }

      UI.println()
      UI.println(UI.Style.TEXT_DIM + `Showing ${executions.length} execution(s)` + UI.Style.TEXT_NORMAL)
    })
  },
})

/**
 * Workflow inspect subcommand
 */
const WorkflowInspectCommand = cmd({
  command: "inspect <executionId>",
  describe: "Inspect a workflow execution",
  builder: (yargs: Argv) => {
    return yargs.positional("executionId", {
      describe: "Execution ID to inspect",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const stateManager = await getStateManager()

      const execution = await stateManager.getExecution(args.executionId as string)
      if (!execution) {
        UI.error(`Execution not found: ${args.executionId}`)
        process.exit(1)
      }

      const context = await stateManager.getContext(args.executionId as string)

      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "Execution Details" + UI.Style.TEXT_NORMAL)
      UI.println()

      // Basic info
      UI.println(UI.Style.TEXT_DIM + "Execution ID: " + UI.Style.TEXT_HIGHLIGHT_BOLD + execution.executionId)
      UI.println(UI.Style.TEXT_DIM + "Workflow:     " + UI.Style.TEXT_NORMAL + execution.workflowName)
      UI.println(
        UI.Style.TEXT_DIM +
          "Status:       " +
          getStatusStyle(execution.status) +
          execution.status +
          UI.Style.TEXT_NORMAL,
      )
      UI.println(UI.Style.TEXT_DIM + "Created:      " + UI.Style.TEXT_NORMAL + formatDate(execution.createdAt))
      UI.println(UI.Style.TEXT_DIM + "Updated:      " + UI.Style.TEXT_NORMAL + formatDate(execution.updatedAt))

      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "Step Statuses" + UI.Style.TEXT_NORMAL)
      UI.println()

      const stepIds = Object.keys(execution.stepStatuses)
      if (stepIds.length === 0) {
        UI.println(UI.Style.TEXT_DIM + "  No steps recorded yet.")
      } else {
        for (const stepId of stepIds) {
          const status = execution.stepStatuses[stepId]
          const statusColor =
            status === "COMPLETED"
              ? UI.Style.TEXT_SUCCESS_BOLD
              : status === "FAILED"
                ? UI.Style.TEXT_DANGER_BOLD
                : UI.Style.TEXT_INFO_BOLD
          UI.println(
            `  ${UI.Style.TEXT_HIGHLIGHT_BOLD}${stepId.padEnd(20)}${UI.Style.TEXT_NORMAL} ${statusColor}${status}${UI.Style.TEXT_NORMAL}`,
          )
        }
      }

      // Show step outputs if available
      if (context && Object.keys(context).length > 0) {
        UI.println()
        UI.println(UI.Style.TEXT_INFO_BOLD + "Step Outputs" + UI.Style.TEXT_NORMAL)
        UI.println()

        for (const [stepId, outputs] of Object.entries(context)) {
          UI.println(UI.Style.TEXT_HIGHLIGHT_BOLD + `  ${stepId}:` + UI.Style.TEXT_NORMAL)

          // Show response if available (truncated)
          const response = (outputs as Record<string, unknown>)["response"]
          if (response) {
            const responseStr = String(response)
            const truncated = responseStr.length > 200 ? responseStr.slice(0, 200) + "..." : responseStr
            UI.println(UI.Style.TEXT_DIM + "    response: " + UI.Style.TEXT_NORMAL + truncated.replace(/\n/g, " "))
          }
        }
      }

      UI.println()
    })
  },
})

/**
 * Helper to extract text response from message parts
 */
function extractTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
}

/**
 * Workflow resume subcommand
 *
 * Resume strategy:
 * 1. Find step that has a session but isn't completed (the interrupted step)
 * 2. Send "Continue" to that session to finish it (preserves context)
 * 3. Record the result and continue with remaining steps
 */
const WorkflowResumeCommand = cmd({
  command: "resume <executionId>",
  describe: "Resume a failed/incomplete workflow",
  builder: (yargs: Argv) => {
    return yargs
      .positional("executionId", {
        describe: "Execution ID to resume",
        type: "string",
        demandOption: true,
      })
      .option("dry-run", {
        describe: "Validate without executing",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const stateManager = await getStateManager()
      const executionId = args.executionId as string

      // 1. Load execution state (don't require checkpoint)
      const execution = await stateManager.getExecution(executionId)
      if (!execution) {
        UI.error(`Execution not found: ${executionId}`)
        process.exit(1)
      }

      // 2. Check if already completed
      if (execution.status === ExecutionStatus.COMPLETED) {
        UI.println()
        UI.println(UI.Style.TEXT_WARNING_BOLD + "Execution already completed." + UI.Style.TEXT_NORMAL)
        UI.println(UI.Style.TEXT_DIM + `Status: ${execution.status}`)
        UI.println()
        process.exit(0)
      }

      // 3. Resolve workflow definition
      const workflowConfig = workflows[execution.workflowName]
      if (!workflowConfig) {
        UI.error(`Workflow not found: ${execution.workflowName}. Available: ${Object.keys(workflows).join(", ")}`)
        process.exit(1)
      }

      // 4. Load context (step outputs)
      const context = (await stateManager.getContext(executionId)) ?? {}

      // 5. Identify completed steps and find interrupted step
      const completedStepIds = Object.entries(execution.stepStatuses)
        .filter(([, status]) => status === StepExecutionStatus.COMPLETED)
        .map(([stepId]) => stepId)

      const allStepIds = workflowConfig.workflow.nodes.map((n) => n.id)
      const pendingStepIds = allStepIds.filter((id) => !completedStepIds.includes(id))

      // Find step that has a session mapping but isn't completed (interrupted step)
      let interruptedStepId: string | null = null
      let interruptedSessionId: string | null = null

      for (const stepId of pendingStepIds) {
        const sessionId = await stateManager.getSessionForStep(executionId, stepId)
        if (sessionId) {
          interruptedStepId = stepId
          interruptedSessionId = sessionId
          break
        }
      }

      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "Resuming Workflow" + UI.Style.TEXT_NORMAL)
      UI.println()
      UI.println(UI.Style.TEXT_DIM + "Execution ID: " + UI.Style.TEXT_NORMAL + executionId)
      UI.println(UI.Style.TEXT_DIM + "Workflow:     " + UI.Style.TEXT_NORMAL + execution.workflowName)
      UI.println(UI.Style.TEXT_DIM + "Updated:      " + UI.Style.TEXT_NORMAL + formatDate(execution.updatedAt))
      UI.println()

      if (completedStepIds.length > 0) {
        UI.println(
          UI.Style.TEXT_SUCCESS_BOLD + "✓ Completed steps: " + UI.Style.TEXT_NORMAL + completedStepIds.join(", "),
        )
      }

      if (interruptedStepId && interruptedSessionId) {
        UI.println(
          UI.Style.TEXT_WARNING_BOLD +
            "⟳ Interrupted step: " +
            UI.Style.TEXT_NORMAL +
            interruptedStepId +
            UI.Style.TEXT_DIM +
            ` (session: ${interruptedSessionId.slice(0, 20)}...)`,
        )
      }

      const remainingSteps = pendingStepIds.filter((id) => id !== interruptedStepId)
      if (remainingSteps.length > 0) {
        UI.println(UI.Style.TEXT_INFO_BOLD + "→ Remaining steps: " + UI.Style.TEXT_NORMAL + remainingSteps.join(", "))
      }
      UI.println()

      // 6. Extract original prompt from context (input step)
      const inputStepId = workflowConfig.inputNodeId
      const originalPrompt = (context[inputStepId]?.["prompt"] as string) ?? ""

      if (!originalPrompt) {
        UI.error("Could not recover original prompt from context")
        process.exit(1)
      }

      // 7. If there's an interrupted step, continue it first
      if (interruptedStepId && interruptedSessionId && !args.dryRun) {
        UI.println(UI.Style.TEXT_INFO_BOLD + "| " + UI.Style.TEXT_NORMAL + "Continuing interrupted session...")
        UI.println()

        try {
          // Send "Continue" message to the existing session
          const result = await SessionPrompt.prompt({
            sessionID: interruptedSessionId,
            messageID: Identifier.ascending("message"),
            parts: [
              {
                id: Identifier.ascending("part"),
                type: "text",
                text: "Continue where you left off. Complete your task.",
              },
            ],
          })

          // Extract response
          const response = extractTextFromParts(result.parts as Array<{ type: string; text?: string }>)

          // Record the step result
          const now = Date.now()
          await stateManager.recordStepResult(executionId, interruptedStepId, {
            status: StepExecutionStatus.COMPLETED,
            outputs: { response, success: true },
            startTime: now,
            endTime: now,
            sessionId: interruptedSessionId,
          })

          // Update context with the step output
          context[interruptedStepId] = { response, success: true }

          UI.println(
            UI.Style.TEXT_SUCCESS_BOLD +
              "|   " +
              UI.Style.TEXT_NORMAL +
              "Step completed: " +
              UI.Style.TEXT_HIGHLIGHT_BOLD +
              interruptedStepId,
          )

          // Add to completed steps for the next phase
          completedStepIds.push(interruptedStepId)
        } catch (error) {
          UI.error(
            `Failed to continue step '${interruptedStepId}' (session: ${interruptedSessionId}): ${error instanceof Error ? error.message : String(error)}`,
          )
          await stateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
          process.exit(1)
        }
      } else if (interruptedStepId && args.dryRun) {
        UI.println(
          UI.Style.TEXT_DIM + `[DRY-RUN] Would continue session ${interruptedSessionId} for step ${interruptedStepId}`,
        )
      }

      // 8. Check if there are remaining steps to run
      const stepsToRun = allStepIds.filter((id) => !completedStepIds.includes(id))

      if (stepsToRun.length === 0) {
        // All steps complete
        if (!args.dryRun) {
          await stateManager.updateExecutionStatus(executionId, ExecutionStatus.COMPLETED)
        }
        UI.println()
        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "| " + UI.Style.TEXT_NORMAL + "Workflow completed!")

        // Display final output
        const agentOutput = context[workflowConfig.outputNodeId] as Record<string, unknown> | undefined
        if (agentOutput?.["response"]) {
          UI.println()
          UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + "Agent Response:")
          UI.println()
          UI.println(UI.markdown(String(agentOutput["response"])))
        }
        UI.println()
        UI.println(UI.Style.TEXT_DIM + `Execution ID: ${executionId}`)
        return
      }

      // 9. Create workflow engine for remaining steps
      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "| " + UI.Style.TEXT_NORMAL + "Running remaining steps...")

      const { engine, stateManager: engineStateManager } = await createWorkflowEngine({
        directory: Instance.worktree,
        enableStateManager: true,
      })

      // 10. Subscribe to events
      const subscription = engine.subscribe((event: WorkflowEvent) => {
        switch (event.type) {
          case "STEP_STARTED":
            UI.println(
              UI.Style.TEXT_INFO_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step started: " +
                UI.Style.TEXT_HIGHLIGHT_BOLD +
                event.displayName,
            )
            break
          case "STEP_COMPLETED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step completed: " +
                UI.Style.TEXT_HIGHLIGHT_BOLD +
                event.stepId,
            )
            break
          case "STEP_SESSION_CREATED":
            // Record session mapping for crash recovery
            if (engineStateManager && !args.dryRun) {
              engineStateManager.mapStepToSession(executionId, event.stepId, event.sessionID).catch(() => {})
            }
            break
          case "STEP_FAILED":
            UI.println(
              UI.Style.TEXT_DANGER_BOLD +
                "|   " +
                UI.Style.TEXT_NORMAL +
                "Step failed: " +
                event.stepId +
                " - " +
                (event.error ?? "Unknown error"),
            )
            break
          case "WORKFLOW_COMPLETED":
            UI.println(UI.Style.TEXT_SUCCESS_BOLD + "| " + UI.Style.TEXT_NORMAL + "Workflow completed!")
            break
          case "WORKFLOW_FAILED":
            UI.println(UI.Style.TEXT_DANGER_BOLD + "| " + UI.Style.TEXT_NORMAL + "Workflow failed: " + event.error)
            break
        }
      })

      try {
        // 11. Create workflow with original prompt
        const workflowWithInput = createWorkflowWithInput(workflowConfig.workflow, inputStepId, originalPrompt)

        // 12. Execute with previous outputs (completed steps will be skipped)
        const result = await engine.executeWorkflow(workflowWithInput, `${execution.workflowName}-resume`, {
          executionId,
          dryRun: args.dryRun,
          previousOutputs: context,
          variables: { prompt: originalPrompt },
        })

        UI.println()

        if (result.terminateMode === "COMPLETED") {
          // Update state
          if (engineStateManager && !args.dryRun) {
            for (const stepResult of result.stepResults) {
              await engineStateManager.recordStepResult(executionId, stepResult.stepId, {
                status: StepExecutionStatus.COMPLETED,
                outputs: result.outputs[stepResult.stepId] as Record<string, unknown> | undefined,
                startTime: result.startTime,
                endTime: result.endTime,
                sessionId: stepResult.sessionID,
              })
            }
            await engineStateManager.updateExecutionStatus(executionId, ExecutionStatus.COMPLETED)
          }

          // Display final output
          const agentOutput = result.outputs[workflowConfig.outputNodeId] as Record<string, unknown> | undefined
          if (agentOutput?.["response"]) {
            UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + "Agent Response:")
            UI.println()
            UI.println(UI.markdown(String(agentOutput["response"])))
          }

          if (result.workflowSessionID) {
            UI.println()
            UI.println(UI.Style.TEXT_DIM + `Workflow Session: ${result.workflowSessionID}`)
          }
          UI.println(UI.Style.TEXT_DIM + `Execution ID: ${executionId}`)
        } else if (result.terminateMode === "FAILED") {
          if (engineStateManager && !args.dryRun) {
            await engineStateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
          }
          UI.error(`Workflow failed: ${result.error}`)
          process.exit(1)
        }
      } catch (error) {
        if (engineStateManager && !args.dryRun) {
          await engineStateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
        }
        throw error
      } finally {
        subscription.unsubscribe()
      }
    })
  },
})

/**
 * Main workflow command with subcommands
 */
export const WorkflowCommand = cmd({
  command: "workflow",
  describe: "Workflow orchestration commands",
  builder: (yargs: Argv) => {
    return yargs
      .command(WorkflowRunCommand)
      .command(WorkflowListCommand)
      .command(WorkflowInspectCommand)
      .command(WorkflowResumeCommand)
      .demandCommand(1, "You must specify a subcommand (e.g., 'run', 'list', 'inspect')")
  },
  handler: () => {
    // This handler is called if no subcommand is provided
    // demandCommand above ensures we always have a subcommand
  },
})
