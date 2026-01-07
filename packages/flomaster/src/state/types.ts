/**
 * State Manager Types
 *
 * All type definitions for the State Manager.
 */

import { z } from "zod"

// ============================================================================
// TypeScript Enums (runtime values)
// ============================================================================

/**
 * Overall workflow execution status.
 */
export enum ExecutionStatus {
  /** Execution created but not started */
  CREATED = "CREATED",
  /** Execution is running */
  RUNNING = "RUNNING",
  /** Execution is paused (human approval) */
  PAUSED = "PAUSED",
  /** Execution completed successfully */
  COMPLETED = "COMPLETED",
  /** Execution failed */
  FAILED = "FAILED",
  /** Execution was cancelled */
  CANCELLED = "CANCELLED",
}

/**
 * Individual step execution status.
 */
export enum StepExecutionStatus {
  /** Step not yet started */
  PENDING = "PENDING",
  /** Step currently executing */
  RUNNING = "RUNNING",
  /** Step completed successfully */
  COMPLETED = "COMPLETED",
  /** Step failed */
  FAILED = "FAILED",
  /** Step skipped (conditional) */
  SKIPPED = "SKIPPED",
  /** Step waiting for human approval */
  WAITING_APPROVAL = "WAITING_APPROVAL",
  /** Step waiting for human input */
  WAITING_INPUT = "WAITING_INPUT",
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const executionStatusSchema = z.nativeEnum(ExecutionStatus)
export const stepExecutionStatusSchema = z.nativeEnum(StepExecutionStatus)

export const stepErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  timestamp: z.string(),
  attemptNumber: z.number().int().positive(),
  retryable: z.boolean().optional(),
})

export const stepResultSchema = z.object({
  status: stepExecutionStatusSchema,
  outputs: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  errorHistory: z.array(stepErrorSchema).optional(),
  startTime: z.number(),
  endTime: z.number(),
  retryCount: z.number().int().nonnegative().optional(),
  sessionId: z.string().optional(),
})

export const workflowExecutionSchema = z.object({
  executionId: z.string().min(1).max(256),
  workflowId: z.string().min(1).max(256).optional(),
  workflowName: z.string().min(1).max(256),
  taskId: z.string().max(256).optional(),
  status: executionStatusSchema,
  stepStatuses: z.record(z.string(), stepExecutionStatusSchema),
  stepResults: z.record(z.string(), stepResultSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})

export const sharedContextSchema = z.record(z.string(), z.record(z.string(), z.unknown()))

export const executionCheckpointSchema = z.object({
  executionId: z.string().min(1).max(256),
  workflowName: z.string().min(1).max(256),
  execution: workflowExecutionSchema,
  context: sharedContextSchema,
  sessionMappings: z.record(z.string(), z.string()),
  timestamp: z.string(),
  checksum: z.string(),
  version: z.string().min(1),
})

export const executionFilterSchema = z.object({
  status: z.union([executionStatusSchema, z.array(executionStatusSchema)]).optional(),
  since: z.string().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  taskId: z.string().optional(),
  workflowId: z.string().optional(),
})

export const executionSummarySchema = z.object({
  executionId: z.string().min(1),
  workflowId: z.string().min(1).optional(),
  workflowName: z.string().min(1),
  taskId: z.string().optional(),
  status: executionStatusSchema,
  stepCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
})

export const messagePartSchema = z.object({
  type: z.enum(["text", "tool_use", "tool_result"]),
  content: z.unknown(),
})

export const sessionDetailsSchema = z.object({
  id: z.string().min(1).max(256),
  title: z.string().max(1024),
  createdAt: z.string(),
  updatedAt: z.string(),
  parentId: z.string().optional(),
})

export const sessionMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  parts: z.array(messagePartSchema),
  createdAt: z.string(),
})

export const stateManagerConfigSchema = z.object({
  executionsDir: z.string().optional(),
  checkpointOnStepComplete: z.boolean().optional(),
})

// ============================================================================
// Types derived from Zod schemas
// ============================================================================

/**
 * Error that occurred during step execution.
 */
export type StepError = z.infer<typeof stepErrorSchema>

/**
 * Result of a step execution.
 */
export type StepResult = z.infer<typeof stepResultSchema>

/**
 * Complete workflow execution state.
 */
export type WorkflowExecution = z.infer<typeof workflowExecutionSchema>

/**
 * Shared context for data passing between steps.
 * Structure: { [stepId]: { [outputKey]: value } }
 */
export type SharedContext = z.infer<typeof sharedContextSchema>

/**
 * Checkpoint for crash recovery.
 */
export type ExecutionCheckpoint = z.infer<typeof executionCheckpointSchema>

/**
 * Filter for listing executions.
 */
export type ExecutionFilter = z.infer<typeof executionFilterSchema>

/**
 * Summary of an execution (for listing).
 */
export type ExecutionSummary = z.infer<typeof executionSummarySchema>

/**
 * Message part types.
 */
export type MessagePart = z.infer<typeof messagePartSchema>

/**
 * Session details from opencode.
 */
export type SessionDetails = z.infer<typeof sessionDetailsSchema>

/**
 * Session message from opencode.
 */
export type SessionMessage = z.infer<typeof sessionMessageSchema>

/**
 * StateManager configuration options.
 */
export type StateManagerConfig = z.infer<typeof stateManagerConfigSchema>

// ============================================================================
// Interfaces without schemas (keep as interfaces)
// ============================================================================

/**
 * Incomplete execution (for crash recovery).
 */
export type IncompleteExecution = {
  /** Execution identifier */
  readonly executionId: string
  /** Workflow being executed */
  readonly workflowName: string
  /** Last known status */
  readonly status: ExecutionStatus
  /** IDs of completed steps */
  readonly completedSteps: string[]
  /** Last update timestamp (ISO 8601) */
  readonly lastUpdated: string
  /** Whether checkpoint is valid */
  readonly isRecoverable: boolean
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid ExecutionStatus.
 */
export function isExecutionStatus(value: unknown): value is ExecutionStatus {
  return typeof value === "string" && Object.values(ExecutionStatus).includes(value as ExecutionStatus)
}

/**
 * Check if value is a valid StepExecutionStatus.
 */
export function isStepExecutionStatus(value: unknown): value is StepExecutionStatus {
  return typeof value === "string" && Object.values(StepExecutionStatus).includes(value as StepExecutionStatus)
}

/**
 * Check if status is a terminal status (no further transitions).
 */
export function isTerminalStatus(status: ExecutionStatus): boolean {
  return (
    status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED || status === ExecutionStatus.CANCELLED
  )
}

/**
 * Check if status is an active status (execution in progress).
 */
export function isActiveStatus(status: ExecutionStatus): boolean {
  return status === ExecutionStatus.CREATED || status === ExecutionStatus.RUNNING || status === ExecutionStatus.PAUSED
}
