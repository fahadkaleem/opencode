import * as path from "node:path"
import type { Argv } from "yargs"
import { UI } from "../../cli/ui.js"
import { cmd } from "../../cli/cmd/cmd.js"
import { bootstrap } from "../../cli/bootstrap.js"
import { Instance } from "../../project/instance.js"
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
 * Helper to get an initialized state manager
 */
async function getStateManager() {
  const executionsDir = path.join(process.cwd(), FLOMASTER_DIR, EXECUTIONS_DIR)
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
 * Workflow resume subcommand (placeholder for now)
 */
const WorkflowResumeCommand = cmd({
  command: "resume <executionId>",
  describe: "Resume a failed/incomplete workflow (coming soon)",
  builder: (yargs: Argv) => {
    return yargs.positional("executionId", {
      describe: "Execution ID to resume",
      type: "string",
      demandOption: true,
    })
  },
  handler: async (args) => {
    await bootstrap(process.cwd(), async () => {
      const stateManager = await getStateManager()

      const checkpoint = await stateManager.loadCheckpoint(args.executionId as string)
      if (!checkpoint) {
        UI.error(`No checkpoint found for execution: ${args.executionId}`)
        process.exit(1)
      }

      UI.println()
      UI.println(UI.Style.TEXT_WARNING_BOLD + "Resume functionality coming soon!" + UI.Style.TEXT_NORMAL)
      UI.println()
      UI.println(UI.Style.TEXT_DIM + "Checkpoint found:" + UI.Style.TEXT_NORMAL)
      UI.println(UI.Style.TEXT_DIM + "  Execution ID: " + UI.Style.TEXT_NORMAL + checkpoint.executionId)
      UI.println(UI.Style.TEXT_DIM + "  Workflow:     " + UI.Style.TEXT_NORMAL + checkpoint.workflowName)
      UI.println(UI.Style.TEXT_DIM + "  Status:       " + UI.Style.TEXT_NORMAL + checkpoint.execution.status)
      UI.println(UI.Style.TEXT_DIM + "  Saved at:     " + UI.Style.TEXT_NORMAL + formatDate(checkpoint.timestamp))

      const completedSteps = Object.entries(checkpoint.execution.stepStatuses)
        .filter(([, status]) => status === "COMPLETED")
        .map(([stepId]) => stepId)

      if (completedSteps.length > 0) {
        UI.println(UI.Style.TEXT_DIM + "  Completed:    " + UI.Style.TEXT_NORMAL + completedSteps.join(", "))
      }

      UI.println()
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
