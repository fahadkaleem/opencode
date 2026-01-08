/**
 * FloMaster Server Routes
 *
 * HTTP endpoints for workflow operations, integrated with OpenCode server.
 * These routes are mounted on the OpenCode server to provide workflow
 * functionality to the TUI.
 */

import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { describeRoute, resolver } from "hono-openapi"
import { discoverWorkflows, loadWorkflow, ensureWorkflowsInitialized } from "../orchestrator/loader/workflowLoader"
import { DefaultStateManager, type StateManager } from "../state/stateManager"
import { FLOMASTER_DIR, EXECUTIONS_DIR } from "../state/defaults"
import { ExecutionStatus } from "../state/types"
import { Instance } from "@/project/instance"
import * as path from "node:path"

// Response schemas for OpenAPI
const workflowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  stepCount: z.number(),
})

const executionSummarySchema = z.object({
  executionId: z.string(),
  workflowName: z.string(),
  status: z.enum(["CREATED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"]),
  stepCount: z.number(),
  completedCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Singleton state manager cache per worktree
const stateManagers = new Map<string, StateManager>()

function getStateManager(): StateManager {
  const worktree = Instance.worktree
  let manager = stateManagers.get(worktree)
  if (!manager) {
    const executionsDir = path.join(worktree, FLOMASTER_DIR, EXECUTIONS_DIR)
    manager = new DefaultStateManager({ executionsDir })
    stateManagers.set(worktree, manager)
  }
  return manager
}

/**
 * Create FloMaster workflow routes.
 * Returns a Hono app with all workflow-related endpoints.
 */
export function createWorkflowRoutes() {
  const app = new Hono()

  // List available workflow definitions
  app.get(
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

  // Get a specific workflow definition
  app.get(
    "/workflow/definitions/:name",
    describeRoute({
      summary: "Get workflow definition",
      description: "Get a specific workflow definition by name",
      operationId: "workflow.definitions.get",
      responses: {
        200: {
          description: "Workflow definition",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  data: z.object({
                    name: z.string(),
                    description: z.string(),
                    workflow: z.unknown(),
                  }),
                }),
              ),
            },
          },
        },
        404: {
          description: "Workflow not found",
        },
      },
    }),
    async (c) => {
      const worktree = Instance.worktree
      const name = c.req.param("name")

      try {
        const loaded = loadWorkflow(worktree, name)
        return c.json({
          data: {
            name: loaded.name,
            description: loaded.description,
            workflow: loaded.workflow,
          },
        })
      } catch {
        return c.json({ error: `Workflow not found: ${name}` }, 404)
      }
    },
  )

  // List executions
  app.get(
    "/workflow/executions",
    describeRoute({
      summary: "List workflow executions",
      description: "List workflow executions with optional filtering",
      operationId: "workflow.executions.list",
      responses: {
        200: {
          description: "List of workflow executions",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.array(executionSummarySchema) })),
            },
          },
        },
      },
    }),
    async (c) => {
      const stateManager = getStateManager()

      // Initialize if needed
      if (!stateManager.isInitialized()) {
        await stateManager.initialize()
      }

      // Get status filter from query params
      const statusParam = c.req.query("status")
      let statusFilter: ExecutionStatus[] | undefined
      if (statusParam) {
        statusFilter = statusParam.split(",").map((s) => s as ExecutionStatus)
      }

      // List executions
      const executions = await stateManager.listExecutions({
        status: statusFilter,
      })

      return c.json({ data: executions })
    },
  )

  // Get execution details
  app.get(
    "/workflow/executions/:id",
    describeRoute({
      summary: "Get workflow execution",
      description: "Get details of a specific workflow execution",
      operationId: "workflow.executions.get",
      responses: {
        200: {
          description: "Workflow execution details",
          content: {
            "application/json": {
              schema: resolver(z.object({ data: z.unknown() })),
            },
          },
        },
        404: {
          description: "Execution not found",
        },
      },
    }),
    async (c) => {
      const stateManager = getStateManager()

      // Initialize if needed
      if (!stateManager.isInitialized()) {
        await stateManager.initialize()
      }

      const executionId = c.req.param("id")
      const execution = await stateManager.getExecution(executionId)

      if (!execution) {
        return c.json({ error: "Execution not found" }, 404)
      }

      return c.json({ data: execution })
    },
  )

  // Start a workflow (this will be implemented to connect to WorkflowEngine)
  app.post(
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
                    executionId: z.string(),
                    sessionId: z.string().optional(),
                    message: z.string(),
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
    zValidator(
      "json",
      z.object({
        workflowName: z.string(),
        prompt: z.string(),
      }),
    ),
    async (c) => {
      const { workflowName, prompt } = c.req.valid("json")
      const worktree = Instance.worktree

      // Verify workflow exists
      try {
        loadWorkflow(worktree, workflowName)
      } catch {
        return c.json({ error: `Workflow not found: ${workflowName}` }, 400)
      }

      // For now, return a placeholder response
      // The actual execution will be triggered via the WorkflowEngine
      // This endpoint will be enhanced in Phase 4 when we implement the full dialog flow
      return c.json({
        data: {
          message: `Workflow '${workflowName}' execution request received`,
          prompt,
        },
      })
    },
  )

  return app
}
