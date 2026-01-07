import * as path from "node:path"
import type { Argv } from "yargs"
import { UI } from "opencode/cli/ui"
import { cmd } from "opencode/cli/cmd/cmd"
import { bootstrap } from "opencode/cli/bootstrap"
import { Instance } from "opencode/project/instance"
import { SessionPrompt } from "opencode/session/prompt"
import { Identifier } from "opencode/id/id"
import { createWorkflowEngine } from "../orchestrator/engine/factory.js"
import type { WorkflowData, WorkflowEvent } from "../orchestrator/types.js"
import { createStateManager } from "../state/stateManager.js"
import { ExecutionStatus, StepExecutionStatus } from "../state/types.js"
import { FLOMASTER_DIR, EXECUTIONS_DIR } from "../state/defaults.js"
import {
  loadWorkflow,
  discoverWorkflows,
  ensureWorkflowsInitialized,
  WorkflowLoadError,
  type LoadedWorkflow,
} from "../orchestrator/loader/index.js"

/**
 * Create a workflow with the input node's prompt value set.
 */
function createWorkflowWithInput(workflow: WorkflowData, inputNodeId: string, promptValue: string): WorkflowData {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => {
      if (node.id !== inputNodeId) return node

      const existingPrompt = node.data.node.template["prompt"]
      return {
        ...node,
        data: {
          ...node.data,
          node: {
            ...node.data.node,
            template: {
              ...node.data.node.template,
              prompt: existingPrompt
                ? {
                    ...existingPrompt,
                    value: promptValue,
                  }
                : {
                    name: "prompt",
                    displayName: "Prompt",
                    type: "str",
                    value: promptValue,
                    isRequired: true,
                    isAdvanced: false,
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
  command: "run",
  describe: "Run a workflow",
  builder: (yargs: Argv) => {
    return yargs
      .option("name", {
        alias: "n",
        describe: "Workflow name to run (see 'flomaster workflow list -W' for available)",
        type: "string",
        demandOption: true,
      })
      .option("prompt", {
        alias: "p",
        describe: "Task prompt/description for the workflow",
        type: "string",
        demandOption: true,
      })
      .option("dry-run", {
        describe: "Validate workflow without executing",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    const workflowName = args.name as string
    const message = args.prompt as string

    await bootstrap(process.cwd(), async () => {
      const projectDir = Instance.worktree

      // Auto-install built-in workflows on first run
      ensureWorkflowsInitialized(projectDir)

      // Load workflow from file
      let workflowConfig: LoadedWorkflow
      try {
        workflowConfig = loadWorkflow(projectDir, workflowName)
      } catch (error) {
        if (error instanceof WorkflowLoadError) {
          UI.error(error.message)
          // List available workflows
          const available = discoverWorkflows(projectDir)
          if (available.length > 0) {
            UI.println(UI.Style.TEXT_DIM + `Available workflows: ${available.map((w) => w.name).join(", ")}`)
          } else {
            UI.println(UI.Style.TEXT_DIM + `No workflows found in ${projectDir}/.flomaster/workflows/`)
          }
          process.exit(1)
        }
        throw error
      }

      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + `Running workflow: ${workflowConfig.name}`)
      UI.println(UI.Style.TEXT_DIM + `Description: ${workflowConfig.description}`)

      if (args.dryRun) {
        UI.println()
        UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Dry run complete - workflow is valid" + UI.Style.TEXT_NORMAL)
        UI.println(`  Steps: ${workflowConfig.workflow.nodes.length}`)
        UI.println(`  Entry: ${workflowConfig.inputNodeId}`)
        UI.println(`  Exit:  ${workflowConfig.outputNodeId}`)
        UI.println()
        return
      }

      UI.println()

      const { engine, stateManager } = await createWorkflowEngine({
        directory: projectDir,
        enableStateManager: true,
      })

      // Track step completion times for recording
      const stepStartTimes = new Map<string, number>()

      // Generate execution ID
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

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
            if (stateManager) {
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
            if (stateManager) {
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

      // Create execution record if state manager is available
      if (stateManager) {
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
          dryRun: false,
          variables: { prompt: message },
        })

        UI.println()

        if (result.terminateMode === "COMPLETED") {
          // Record final state
          if (stateManager) {
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
          if (stateManager) {
            UI.println(UI.Style.TEXT_DIM + `Execution ID: ${executionId}`)
          }
        } else if (result.terminateMode === "FAILED") {
          // Record failed state
          if (stateManager) {
            await stateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED)
          }
          UI.error(`Workflow failed: ${result.error}`)
          process.exit(1)
        }
      } catch (error) {
        // Record failed state on exception
        if (stateManager) {
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
  describe: "List workflow executions or available workflow definitions",
  builder: (yargs: Argv) => {
    return yargs
      .option("workflows", {
        alias: "W",
        describe: "Show available workflow definitions instead of executions",
        type: "boolean",
        default: false,
      })
      .option("status", {
        alias: "s",
        describe: "Filter executions by status (completed, failed, running, created, paused, cancelled)",
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
      const projectDir = Instance.worktree

      // Auto-install built-in workflows on first run
      ensureWorkflowsInitialized(projectDir)

      if (args.workflows) {
        // Show available workflow definitions
        const workflows = discoverWorkflows(projectDir)
        if (workflows.length === 0) {
          UI.println(UI.Style.TEXT_DIM + "No workflows found in .flomaster/workflows/")
          UI.println(UI.Style.TEXT_DIM + "Create a workflow JSON file to get started.")
          return
        }

        UI.println()
        UI.println(UI.Style.TEXT_INFO_BOLD + "Available Workflows" + UI.Style.TEXT_NORMAL)
        UI.println()

        // Table header
        UI.println(UI.Style.TEXT_DIM + "NAME".padEnd(20) + "STEPS".padEnd(8) + "DESCRIPTION" + UI.Style.TEXT_NORMAL)
        UI.println(UI.Style.TEXT_DIM + "-".repeat(70) + UI.Style.TEXT_NORMAL)

        for (const w of workflows) {
          UI.println(
            UI.Style.TEXT_HIGHLIGHT_BOLD +
              w.name.padEnd(20) +
              UI.Style.TEXT_NORMAL +
              String(w.stepCount).padEnd(8) +
              UI.Style.TEXT_DIM +
              w.description.substring(0, 40) +
              UI.Style.TEXT_NORMAL,
          )
        }

        UI.println()
        UI.println(UI.Style.TEXT_DIM + `Showing ${workflows.length} workflow(s)` + UI.Style.TEXT_NORMAL)
        return
      }

      // Show workflow executions
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
 * Workflow validate subcommand
 */
const WorkflowValidateCommand = cmd({
  command: "validate <name>",
  describe: "Validate a workflow file",
  builder: (yargs: Argv) => {
    return yargs.positional("name", {
      describe: "Workflow name to validate",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    const workflowName = args.name as string

    await bootstrap(process.cwd(), async () => {
      const projectDir = Instance.worktree

      // Auto-install built-in workflows on first run
      ensureWorkflowsInitialized(projectDir)

      try {
        const workflow = loadWorkflow(projectDir, workflowName)
        UI.println()
        UI.println(UI.Style.TEXT_SUCCESS_BOLD + `Workflow '${workflow.name}' is valid` + UI.Style.TEXT_NORMAL)
        UI.println(`  Steps: ${workflow.workflow.nodes.length}`)
        UI.println(`  Entry: ${workflow.inputNodeId}`)
        UI.println(`  Exit:  ${workflow.outputNodeId}`)
        UI.println()
      } catch (error) {
        if (error instanceof WorkflowLoadError) {
          UI.error(`Validation failed: ${error.message}`)
          process.exit(1)
        }
        throw error
      }
    })
  },
})

/**
 * Workflow show subcommand
 */
const WorkflowShowCommand = cmd({
  command: "show <name>",
  describe: "Show workflow definition details",
  builder: (yargs: Argv) => {
    return yargs.positional("name", {
      describe: "Workflow name to show",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    const workflowName = args.name as string

    await bootstrap(process.cwd(), async () => {
      const projectDir = Instance.worktree

      // Auto-install built-in workflows on first run
      ensureWorkflowsInitialized(projectDir)

      try {
        const workflow = loadWorkflow(projectDir, workflowName)

        UI.println()
        UI.println(UI.Style.TEXT_INFO_BOLD + `Workflow: ${workflow.name}` + UI.Style.TEXT_NORMAL)
        UI.println(UI.Style.TEXT_DIM + `Description: ${workflow.description}`)
        UI.println(UI.Style.TEXT_DIM + `File: ${workflow.filePath}`)
        UI.println()
        UI.println(UI.Style.TEXT_INFO_BOLD + `Steps (${workflow.workflow.nodes.length}):` + UI.Style.TEXT_NORMAL)

        for (const node of workflow.workflow.nodes) {
          const name = node.data.node.displayName
          const type = node.data.node.baseClasses[0] || "Unknown"
          UI.println(`  - ${UI.Style.TEXT_HIGHLIGHT_BOLD}${node.id}${UI.Style.TEXT_NORMAL}: ${name} (${type})`)
        }

        UI.println()
        UI.println(`Entry point: ${UI.Style.TEXT_HIGHLIGHT_BOLD}${workflow.inputNodeId}${UI.Style.TEXT_NORMAL}`)
        UI.println(`Exit point:  ${UI.Style.TEXT_HIGHLIGHT_BOLD}${workflow.outputNodeId}${UI.Style.TEXT_NORMAL}`)
        UI.println()
      } catch (error) {
        if (error instanceof WorkflowLoadError) {
          UI.error(error.message)
          process.exit(1)
        }
        throw error
      }
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
      const projectDir = Instance.worktree
      const stateManager = await getStateManager()
      const executionId = args.executionId as string

      // Auto-install built-in workflows on first run
      ensureWorkflowsInitialized(projectDir)

      // 1. Load execution state
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

      // 3. Resolve workflow definition from file
      let workflowConfig: LoadedWorkflow
      try {
        workflowConfig = loadWorkflow(projectDir, execution.workflowName)
      } catch (error) {
        if (error instanceof WorkflowLoadError) {
          UI.error(`Failed to load workflow: ${error.message}`)
          const available = discoverWorkflows(projectDir)
          if (available.length > 0) {
            UI.println(UI.Style.TEXT_DIM + `Available workflows: ${available.map((w) => w.name).join(", ")}`)
          }
          process.exit(1)
        }
        throw error
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
          UI.Style.TEXT_SUCCESS_BOLD + "Completed steps: " + UI.Style.TEXT_NORMAL + completedStepIds.join(", "),
        )
      }

      if (interruptedStepId && interruptedSessionId) {
        UI.println(
          UI.Style.TEXT_WARNING_BOLD +
            "Interrupted step: " +
            UI.Style.TEXT_NORMAL +
            interruptedStepId +
            UI.Style.TEXT_DIM +
            ` (session: ${interruptedSessionId.slice(0, 20)}...)`,
        )
      }

      const remainingSteps = pendingStepIds.filter((id) => id !== interruptedStepId)
      if (remainingSteps.length > 0) {
        UI.println(UI.Style.TEXT_INFO_BOLD + "Remaining steps: " + UI.Style.TEXT_NORMAL + remainingSteps.join(", "))
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
        directory: projectDir,
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
      .command(WorkflowValidateCommand)
      .command(WorkflowShowCommand)
      .demandCommand(1, "You must specify a subcommand (e.g., 'run', 'list', 'inspect')")
  },
  handler: () => {
    // This handler is called if no subcommand is provided
    // demandCommand above ensures we always have a subcommand
  },
})
