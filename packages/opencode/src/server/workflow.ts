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
import { DefaultStateManager, type StateManager } from "../flomaster/state/stateManager"
import { ExecutionStatus, StepExecutionStatus, type Execution } from "../flomaster/state/types"
import type { WorkflowData, StepData, WorkflowEvent } from "../flomaster/orchestrator/types"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Bus } from "../bus"
import {
  createWorkflowMessage,
  updateWorkflowMessage,
  type WorkflowMessageState,
  type WorkflowStep,
} from "./workflow-message"

const log = Log.create({ service: "workflow" })

// Singleton StateManager instance (lazily initialized)
let stateManagerInstance: StateManager | null = null

/**
 * Get or create StateManager singleton
 */
async function getStateManager(worktree: string): Promise<StateManager> {
  if (!stateManagerInstance) {
    stateManagerInstance = new DefaultStateManager({
      executionsDir: join(worktree, ".flomaster", "executions"),
    })
    await stateManagerInstance.initialize()
  }
  return stateManagerInstance
}

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

// TODO(TASK-13): These exported functions provide an API for external callers to update
// execution state. Currently the POST /workflow/run handler uses internal helpers instead.
// These will be used when we implement:
// - /workflow/pause and /workflow/resume endpoints
// - External step status updates from Bus events
// - Workflow intervention features (R4)

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

/**
 * Get parent session ID for an execution.
 * First tries workflowSessionId from execution, then falls back to querying
 * the first step session's parentID.
 */
async function getParentSessionId(execution: Execution): Promise<string | undefined> {
  // If workflowSessionId is stored, use it
  if (execution.workflowSessionId) {
    return execution.workflowSessionId
  }

  // Fallback: find first step with a sessionId and get its parentID
  for (const step of Object.values(execution.steps)) {
    if (step.sessionId) {
      try {
        const session = await Session.get(step.sessionId)
        if (session?.parentID) {
          return session.parentID
        }
      } catch {
        // Session may not exist, continue to next
      }
    }
  }

  return undefined
}

/**
 * Transform StateManager Execution to TUI ExecutionState format
 * Looks up displayNames from workflow definition (source of truth for UI labels)
 */
async function transformExecution(
  execution: Execution,
  workflowNodes: readonly StepData[] | null,
): Promise<ExecutionState> {
  // Build stepId → displayName map from workflow definition
  const displayNameMap = new Map<string, string>()
  if (workflowNodes) {
    for (const node of workflowNodes) {
      displayNameMap.set(node.id, node.data.node.displayName || node.id)
    }
  }

  // Get step order from workflow definition (for consistent ordering)
  // Always use workflow definition if available, fall back to execution steps
  const stepOrder = workflowNodes
    ? workflowNodes
        .filter((n) => {
          const baseClasses = n.data.node.baseClasses
          return baseClasses.includes("Agent") || baseClasses.includes("Prompt")
        })
        .map((n) => n.id)
    : Object.keys(execution.steps)

  // Transform steps Record → Array in definition order
  // Include ALL steps from workflow definition, using execution data if available
  const steps: ExecutionState["steps"] = stepOrder.map((stepId) => {
    const step = execution.steps[stepId]
    return {
      stepId,
      displayName: displayNameMap.get(stepId) ?? stepId,
      status: step ? mapStepStatus(step.status) : "PENDING",
      sessionId: step?.sessionId,
    }
  })

  // Find current step (first running, or last non-pending)
  const currentStepId =
    steps.find((s) => s.status === "RUNNING")?.stepId ?? steps.filter((s) => s.status !== "PENDING").at(-1)?.stepId

  // Get parent session ID (with fallback to derive from step sessions)
  const parentSessionId = await getParentSessionId(execution)

  return {
    id: execution.id,
    workflowName: execution.workflowName,
    status: execution.status,
    parentSessionId,
    steps,
    currentStepId,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  }
}

/**
 * Map StateManager step status to TUI step status
 */
function mapStepStatus(status: string): ExecutionState["steps"][0]["status"] {
  switch (status) {
    case "PENDING":
      return "PENDING"
    case "RUNNING":
      return "RUNNING"
    case "COMPLETED":
      return "COMPLETED"
    case "FAILED":
      return "FAILED"
    case "SKIPPED":
      return "SKIPPED"
    case "WAITING_APPROVAL":
    case "WAITING_INPUT":
      return "PENDING" // Map waiting states to pending for TUI
    default:
      return "PENDING"
  }
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
      description: "List workflow executions from persistent storage",
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
      const worktree = Instance.worktree

      try {
        // Get StateManager instance
        const stateManager = await getStateManager(worktree)

        // List all executions from persistent storage
        const summaries = await stateManager.listExecutions({ limit: 100 })

        // Transform each execution to TUI format
        const executions: ExecutionState[] = []
        for (const summary of summaries) {
          // Get full execution details
          const execution = await stateManager.getExecution(summary.executionId)
          if (!execution) continue

          // Load workflow definition for displayNames (gracefully handle missing)
          let workflowNodes: readonly StepData[] | null = null
          try {
            const workflowConfig = loadWorkflow(worktree, execution.workflowName)
            workflowNodes = workflowConfig.workflow.nodes
          } catch {
            // Workflow definition may have been deleted - use fallback
            log.warn("Workflow definition not found", { workflowName: execution.workflowName })
          }

          executions.push(await transformExecution(execution, workflowNodes))
        }

        return c.json({ data: executions })
      } catch (error) {
        log.error("Failed to list executions", {
          error: error instanceof Error ? error.message : String(error),
        })
        // Fallback to in-memory store if StateManager fails
        return c.json({ data: Array.from(activeExecutions.values()) })
      }
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

      // Create workflow engine with StateManager for persistence
      const { engine, stateManager } = await createWorkflowEngine({
        directory: worktree,
        enableStateManager: true,
      })

      // Persist execution to StateManager with workflowSessionId for sidebar association
      if (stateManager) {
        await stateManager
          .createExecution(executionId, workflowName, undefined, undefined, sessionID)
          .catch((error) => {
            log.warn("Failed to persist execution to StateManager", {
              executionId,
              error: error instanceof Error ? error.message : String(error),
            })
          })
      }

      // Set the prompt input
      const workflowWithInput = createWorkflowWithInput(workflowConfig.workflow, workflowConfig.inputNodeId, prompt)

      // Track step start times for duration calculation
      const stepStartTimes = new Map<string, number>()

      // Track workflow message state for updates
      let workflowMessageState: WorkflowMessageState | null = null

      // Create workflow message in chat if we have a session
      if (sessionID) {
        try {
          workflowMessageState = await createWorkflowMessage(
            sessionID,
            executionId,
            workflowName,
            prompt,
            initialExecution.steps,
          )
        } catch (error) {
          log.warn("Failed to create workflow message", {
            executionId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }

      // Helper to get current steps with updated statuses
      const getCurrentSteps = (): WorkflowStep[] => {
        const exec = activeExecutions.get(executionId)
        return exec?.steps ?? initialExecution.steps
      }

      // Helper to update step status in memory and message
      const updateStepInMemory = (stepId: string, status: WorkflowStep["status"], sessionId?: string) => {
        const exec = activeExecutions.get(executionId)
        if (exec) {
          const step = exec.steps.find((s) => s.stepId === stepId)
          if (step) {
            step.status = status
            if (sessionId) step.sessionId = sessionId
          }
          exec.updatedAt = new Date().toISOString()
        }
      }

      // Subscribe to engine events to persist step state and update chat message
      engine.subscribe((event: WorkflowEvent) => {
        switch (event.type) {
          case "STEP_STARTED":
            stepStartTimes.set(event.stepId, Date.now())
            updateStepInMemory(event.stepId, "RUNNING")
            if (stateManager) {
              stateManager.updateStepStatus(executionId, event.stepId, StepExecutionStatus.RUNNING).catch(() => {})
            }
            // Update workflow message
            if (workflowMessageState) {
              updateWorkflowMessage(workflowMessageState, "RUNNING", getCurrentSteps(), event.stepId).catch(() => {})
            }
            break

          case "STEP_COMPLETED":
            updateStepInMemory(event.stepId, "COMPLETED")
            if (stateManager) {
              stateManager
                .recordStepResult(executionId, event.stepId, {
                  status: StepExecutionStatus.COMPLETED,
                  outputs: event.outputs,
                  startTime: stepStartTimes.get(event.stepId) ?? Date.now(),
                  endTime: Date.now(),
                })
                .catch(() => {})
            }
            // Update workflow message
            if (workflowMessageState) {
              updateWorkflowMessage(workflowMessageState, "RUNNING", getCurrentSteps()).catch(() => {})
            }
            break

          case "STEP_FAILED":
            updateStepInMemory(event.stepId, "FAILED")
            if (stateManager) {
              stateManager
                .recordStepResult(executionId, event.stepId, {
                  status: StepExecutionStatus.FAILED,
                  error: event.error,
                  startTime: stepStartTimes.get(event.stepId) ?? Date.now(),
                  endTime: Date.now(),
                })
                .catch(() => {})
            }
            break

          case "STEP_SESSION_CREATED":
            updateStepInMemory(event.stepId, "RUNNING", event.sessionID)
            if (stateManager) {
              stateManager.mapStepToSession(executionId, event.stepId, event.sessionID).catch(() => {})
            }
            // Update workflow message with session ID
            if (workflowMessageState) {
              updateWorkflowMessage(workflowMessageState, "RUNNING", getCurrentSteps(), event.stepId).catch(() => {})
            }
            break

          case "WORKFLOW_COMPLETED":
            if (stateManager) {
              stateManager.updateExecutionStatus(executionId, ExecutionStatus.COMPLETED).catch(() => {})
            }
            // Update workflow message to completed
            if (workflowMessageState) {
              updateWorkflowMessage(workflowMessageState, "COMPLETED", getCurrentSteps()).catch(() => {})
            }
            break

          case "WORKFLOW_FAILED":
            if (stateManager) {
              stateManager.updateExecutionStatus(executionId, ExecutionStatus.FAILED).catch(() => {})
            }
            // Update workflow message to failed
            if (workflowMessageState) {
              updateWorkflowMessage(workflowMessageState, "FAILED", getCurrentSteps()).catch(() => {})
            }
            break
        }
      })

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
          // Update workflow message to failed
          if (workflowMessageState) {
            updateWorkflowMessage(workflowMessageState, "FAILED", getCurrentSteps()).catch(() => {})
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
