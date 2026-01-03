import type { Argv } from "yargs"
import { UI } from "../ui.js"
import { cmd } from "./cmd.js"
import { bootstrap } from "../bootstrap.js"
import { createWorkflowEngine } from "../../orchestrator/engine/factory.js"
import { testWorkflow } from "../../orchestrator/workflows/test-workflow.js"
import type { WorkflowData, WorkflowEvent } from "../../orchestrator/types.js"

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
      .option("dry-run", {
        describe: "Validate workflow without executing",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    const message =
      args.message.length > 0 ? args.message.join(" ") : "Hello! This is a test of the FloMaster workflow orchestrator."

    await bootstrap(process.cwd(), async () => {
      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + "Starting workflow...")
      UI.println()

      const { engine } = await createWorkflowEngine({
        directory: process.cwd(),
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

      try {
        // Set the prompt input in the workflow
        const workflowWithInput = createWorkflowWithInput(testWorkflow, "input-1", message)

        // Execute the workflow
        const result = await engine.executeWorkflow(workflowWithInput, "test-workflow-run", {
          dryRun: args.dryRun,
          variables: { prompt: message },
        })

        UI.println()

        if (result.terminateMode === "COMPLETED") {
          // Extract and display the agent's response
          const agentOutput = result.outputs["agent-1"] as Record<string, unknown> | undefined
          if (agentOutput?.["response"]) {
            UI.println(UI.Style.TEXT_INFO_BOLD + "* " + UI.Style.TEXT_NORMAL + "Agent Response:")
            UI.println()
            UI.println(UI.markdown(String(agentOutput["response"])))
          }
        } else if (result.terminateMode === "FAILED") {
          UI.error(`Workflow failed: ${result.error}`)
          process.exit(1)
        }
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
    return yargs.command(WorkflowRunCommand).demandCommand(1, "You must specify a subcommand (e.g., 'run')")
  },
  handler: () => {
    // This handler is called if no subcommand is provided
    // demandCommand above ensures we always have a subcommand
  },
})
