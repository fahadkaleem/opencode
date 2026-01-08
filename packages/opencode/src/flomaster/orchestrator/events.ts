/**
 * Workflow Bus Events
 *
 * Events published during workflow execution for TUI integration.
 * These events are published via OpenCode's Bus system and received
 * by the TUI to update the sidebar workflow panel in real-time.
 */

import { BusEvent } from "@/bus/bus-event"
import { z } from "zod"

// Step status for UI display
const stepStatusSchema = z.object({
  stepId: z.string(),
  displayName: z.string(),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED"]),
  sessionId: z.string().optional(),
})

// Execution summary for sidebar
const executionSummarySchema = z.object({
  id: z.string(),
  workflowName: z.string(),
  status: z.enum(["CREATED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"]),
  parentSessionId: z.string().optional(),
  steps: z.array(stepStatusSchema),
  currentStepId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ExecutionSummaryForTUI = z.infer<typeof executionSummarySchema>
export type StepStatusForTUI = z.infer<typeof stepStatusSchema>

export const WorkflowBusEvents = {
  /** Emitted when execution is created or updated */
  ExecutionUpdated: BusEvent.define(
    "workflow.execution.updated",
    z.object({
      execution: executionSummarySchema,
    }),
  ),

  /** Emitted when a step starts */
  StepStarted: BusEvent.define(
    "workflow.step.started",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      sessionId: z.string(),
    }),
  ),

  /** Emitted when a step completes */
  StepCompleted: BusEvent.define(
    "workflow.step.completed",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      status: z.enum(["COMPLETED", "FAILED", "SKIPPED"]),
      nextStepId: z.string().optional(),
      nextSessionId: z.string().optional(),
    }),
  ),

  /** Emitted when a step creates a session (for immediate sessionId availability) */
  StepSessionCreated: BusEvent.define(
    "workflow.step.session_created",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      sessionId: z.string(),
      agentName: z.string(),
    }),
  ),
}
