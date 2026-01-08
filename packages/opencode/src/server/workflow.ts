/**
 * Workflow Routes for OpenCode Server
 *
 * Provides HTTP endpoints for workflow discovery, management, and execution.
 * Integrates with the internal FloMaster workflow orchestration system.
 */

import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import { z } from "zod"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { Instance } from "../project/instance"
import { Log } from "../util/log"
import { createWorkflowEngine } from "../flomaster/orchestrator/engine/factory"
import {
  discoverWorkflows,
  loadWorkflow,
  ensureWorkflowsInitialized,
} from "../flomaster/orchestrator/loader/workflowLoader"
import type { WorkflowData } from "../flomaster/orchestrator/types"

const log = Log.create({ service: "workflow" })

// In-memory store for active workflow executions (persists during server lifetime)
type ExecutionState = {
  id: string
  workflowName: string
  status: "CREATED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED"
  parentSessionId?: string
  steps: Array<{
    stepId: string
    displayName: string
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED"
    sessionId?: string
  }>
  currentStepId?: string
  createdAt: string
  updatedAt: string
}
const activeExecutions = new Map<string, ExecutionState>()

/**
 * Update execution state - called from workflow engine events
 */
export function updateExecutionState(executionId: string, updates: Partial<ExecutionState>) {
  const exec = activeExecutions.get(executionId)
  if (exec) {
    Object.assign(exec, updates, { updatedAt: new Date().toISOString() })
  }
}

/**
 * Update a step's state within an execution
 */
export function updateStepState(
  executionId: string,
  stepId: string,
  updates: { status?: ExecutionState["steps"][0]["status"]; sessionId?: string },
) {
  const exec = activeExecutions.get(executionId)
  if (exec) {
    const step = exec.steps.find((s) => s.stepId === stepId)
    if (step) {
      Object.assign(step, updates)
      exec.currentStepId = stepId
      exec.updatedAt = new Date().toISOString()
    }
  }
}

/**
 * Get execution state by ID
 */
export function getExecutionState(executionId: string): ExecutionState | undefined {
  return activeExecutions.get(executionId)
}

// Response schemas for OpenAPI
const workflowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  stepCount: z.number(),
})

/**
 * Helper to set prompt input in workflow
 */
function createWorkflowWithInput(workflow: WorkflowData, inputNodeId: string, promptValue: string): WorkflowData {
  return {
    ...workflow,
    nodes: workflow.nodes.map((node) => {
      if (node.id !== inputNodeId) return node
      const existingPrompt = node.data.node.template["prompt"]
      if (!existingPrompt) return node
      return {
        ...node,
        data: {
          ...node.data,
          node: {
            ...node.data.node,
            template: {
              ...node.data.node.template,
              prompt: { ...existingPrompt, value: promptValue },
            },
          },
        },
      }
    }),
  }
}

/**
 * Workflow routes for the OpenCode server
 */
export const WorkflowRoute = new Hono()
  .get(
    "/workflow/definitions",
    describeRoute({
      summary: "List workflow definitions",
      description: "List all available workflow definitions from .flomaster/workflows/",
      operationId: "workflow.definitions.list",
      responses: {
        200: {
          description: "List of workflow definitions",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.array(workflowDefinitionSchema) })),
            },
          },
        },
      },
    }),
    async (c) => {
      const worktree = Instance.worktree

      // Ensure workflows directory is initialized with built-in workflows
      ensureWorkflowsInitialized(worktree)

      // Discover all workflows
      const workflows = discoverWorkflows(worktree)
      const definitions = workflows.map((wf) => ({
        name: wf.name,
        description: wf.description,
        stepCount: wf.stepCount,
      }))

      return c.json({ data: definitions })
    },
  )
  .get(
    "/workflow/executions",
    describeRoute({
      summary: "List workflow executions",
      description: "List workflow executions",
      operationId: "workflow.executions.list",
      responses: {
        200: {
          description: "List of workflow executions",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.array(z.unknown()) })),
            },
          },
        },
      },
    }),
    async (c) => {
      // Return active executions from in-memory store
      return c.json({ data: Array.from(activeExecutions.values()) })
    },
  )
  .post(
    "/workflow/run",
    describeRoute({
      summary: "Start workflow execution",
      description: "Start a new workflow execution with the given parameters",
      operationId: "workflow.run",
      responses: {
        200: {
          description: "Workflow execution started",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    message: z.string(),
                    executionId: z.string(),
                  }),
                }),
              ),
            },
          },
        },
        400: {
          description: "Invalid request",
        },
      },
    }),
    validator(
      "json",
      z.object({
        workflowName: z.string(),
        prompt: z.string(),
        sessionID: z.string().optional(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json")
      const { workflowName, prompt, sessionID } = body
      const worktree = Instance.worktree

      // Verify workflow exists
      const workflowPath = join(worktree, ".flomaster", "workflows", `${workflowName}.json`)
      if (!existsSync(workflowPath)) {
        return c.json({ error: `Workflow not found: ${workflowName}` }, 400)
      }

      // Generate execution ID
      const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      log.info("Starting workflow", { workflowName, executionId })

      // Load the workflow
      const workflowConfig = loadWorkflow(worktree, workflowName)

      // Create initial execution state
      const now = new Date().toISOString()
      const initialExecution: ExecutionState = {
        id: executionId,
        workflowName,
        status: "RUNNING",
        parentSessionId: sessionID,
        steps: workflowConfig.workflow.nodes
          .filter((n) => {
            // Filter by baseClasses to find Agent and Prompt nodes
            const baseClasses = n.data.node.baseClasses
            return baseClasses.includes("Agent") || baseClasses.includes("Prompt")
          })
          .map((n) => ({
            stepId: n.id,
            displayName: n.data.node.displayName || n.id,
            status: "PENDING" as const,
          })),
        createdAt: now,
        updatedAt: now,
      }
      activeExecutions.set(executionId, initialExecution)

      // Create workflow engine
      const { engine } = await createWorkflowEngine({
        directory: worktree,
        enableStateManager: true,
      })

      // Set the prompt input
      const workflowWithInput = createWorkflowWithInput(workflowConfig.workflow, workflowConfig.inputNodeId, prompt)

      // Execute workflow asynchronously (don't await - let it run in background)
      // Events will be published via Bus and picked up by TUI
      engine
        .executeWorkflow(workflowWithInput, `${workflowName}-workflow-run`, {
          executionId,
          executionsDir: join(worktree, ".flomaster", "executions"),
          dryRun: false,
          variables: { prompt },
          parentSessionID: sessionID, // Use current session as parent for workflow steps
        })
        .then((result) => {
          log.info("Workflow completed", { executionId, terminateMode: result.terminateMode })
          // Update execution state
          const exec = activeExecutions.get(executionId)
          if (exec) {
            exec.status = result.terminateMode === "COMPLETED" ? "COMPLETED" : "FAILED"
            exec.updatedAt = new Date().toISOString()
          }
        })
        .catch((error) => {
          log.error("Workflow failed", {
            executionId,
            error: error instanceof Error ? error.message : String(error),
          })
          // Update execution state
          const exec = activeExecutions.get(executionId)
          if (exec) {
            exec.status = "FAILED"
            exec.updatedAt = new Date().toISOString()
          }
        })

      log.info("Workflow execution started", { workflowName, executionId })

      return c.json({
        data: {
          message: `Workflow '${workflowName}' execution started`,
          executionId,
        },
      })
    },
  )
