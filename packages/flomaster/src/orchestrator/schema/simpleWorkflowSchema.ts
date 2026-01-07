/**
 * Simple Workflow JSON Schema
 *
 * User-friendly JSON format for defining workflows that converts to
 * React Flow format internally. This provides a clean, declarative
 * interface for workflow authoring.
 *
 * @example
 * ```json
 * {
 *   "name": "sdlc",
 *   "description": "Software development lifecycle workflow",
 *   "defaults": { "timeout_ms": 300000, "max_retries": 3 },
 *   "steps": [
 *     { "id": "input", "type": "input", "name": "Task Input" },
 *     { "id": "research", "type": "agent", "name": "Research", "depends_on": ["input"], "prompt": "..." }
 *   ]
 * }
 * ```
 */

import { z } from "zod"

/**
 * Step types in the simple workflow format
 */
export const StepTypeSchema = z.enum(["input", "output", "agent", "conditional", "loop"])

/**
 * Conditional operator types
 */
export const ConditionalOperatorSchema = z.enum(["equals", "contains", "regex", "greater_than", "less_than"])

/**
 * Condition configuration for conditional steps
 */
export const ConditionSchema = z.object({
  operator: ConditionalOperatorSchema,
  left: z.string(),
  right: z.string(),
})

/**
 * Loop configuration for loop steps
 */
export const LoopConfigSchema = z.object({
  /** Reference to array data via {{stepId.output}} */
  items: z.string(),
  /** Maximum iterations to prevent infinite loops (default: 100) */
  max_iterations: z.number().int().positive().optional(),
})

/**
 * Step definition in the simple workflow format
 */
export const SimpleStepSchema = z.object({
  // Required fields
  /** Unique step identifier */
  id: z.string().min(1, "Step ID is required"),
  /** Step type */
  type: StepTypeSchema,
  /** Human-readable step name */
  name: z.string().min(1, "Step name is required"),

  // Dependencies
  /** IDs of steps this step depends on (empty = entry point) */
  depends_on: z.array(z.string()).optional().default([]),

  // Agent step configuration
  /** Agent type to use (e.g., "build", "research-agent") */
  agent: z.string().optional(),
  /** Prompt template with {{stepId.output}} interpolation */
  prompt: z.string().optional(),
  /** Additional system prompt */
  system_prompt: z.string().optional(),
  /** Model to use (e.g., "anthropic/claude-sonnet-4-20250514") */
  model: z.string().optional(),
  /** Step timeout in milliseconds */
  timeout_ms: z.number().positive().optional(),
  /** Maximum retry attempts */
  max_retries: z.number().int().min(0).optional(),

  // Conditional step configuration
  /** Condition for conditional steps */
  condition: ConditionSchema.optional(),

  // Loop step configuration
  /** Loop configuration for loop steps */
  loop: LoopConfigSchema.optional(),
})

/**
 * Workflow-level defaults that steps inherit.
 * All fields are optional; system defaults are applied in the converter.
 */
export const WorkflowDefaultsSchema = z.object({
  /** Default agent type for agent steps */
  agent: z.string().optional(),
  /** Default timeout in milliseconds (system default: 300000 = 5 minutes) */
  timeout_ms: z.number().positive().optional(),
  /** Default max retries (system default: 3) */
  max_retries: z.number().int().min(0).optional(),
  /** Default model for all steps */
  model: z.string().optional(),
})

/**
 * Complete workflow file schema
 */
export const SimpleWorkflowSchema = z.object({
  // Required metadata
  /** Unique workflow name (used for CLI commands) */
  name: z.string().min(1, "Workflow name is required"),
  /** Human-readable description */
  description: z.string().min(1, "Workflow description is required"),

  // Optional defaults
  /** Workflow-level defaults that steps inherit */
  defaults: WorkflowDefaultsSchema.optional(),

  // Steps
  /** Array of step definitions */
  steps: z.array(SimpleStepSchema).min(1, "Workflow must have at least one step"),
})

// Export types (prefixed with 'Simple' to avoid conflicts with orchestrator types)
export type SimpleStepType = z.infer<typeof StepTypeSchema>
export type SimpleConditionalOperator = z.infer<typeof ConditionalOperatorSchema>
export type SimpleCondition = z.infer<typeof ConditionSchema>
export type SimpleLoopConfig = z.infer<typeof LoopConfigSchema>
export type SimpleStep = z.infer<typeof SimpleStepSchema>
export type SimpleWorkflowDefaults = z.infer<typeof WorkflowDefaultsSchema>
export type SimpleWorkflow = z.infer<typeof SimpleWorkflowSchema>
