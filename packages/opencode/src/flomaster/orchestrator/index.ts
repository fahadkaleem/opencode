/**
 * Orchestrator
 *
 * Workflow execution engine using XState v5 state machines.
 * Compatible with React Flow JSON schema for UI integration.
 *
 * @example
 * ```typescript
 * import { DefaultWorkflowEngine } from '@flomaster/core/orchestrator';
 * import type { WorkflowEngine } from '@flomaster/core/orchestrator';
 *
 * const engine: WorkflowEngine = new DefaultWorkflowEngine();
 * const graph = await engine.loadWorkflow('my-workflow');
 * const result = await engine.executeWorkflow(graph, 'task-123');
 * ```
 */

// Actors
export * from "./actors/conditionalActor"
export * from "./actors/loopActor"
export * from "./actors/stepActor"
export * from "./actors/subflowActor"

// Engine
export * from "./engine/factory"
export * from "./engine/validationRunner"
export * from "./engine/workflowEngine"

// Loader
export * from "./loader/index"

// Machine
export * from "./machine/actions"
export * from "./machine/guards"
export * from "./machine/workflowMachine"

// Parser
export * from "./parser/connectionParser"
export * from "./parser/stepParser"
export * from "./parser/topology"
export * from "./parser/workflowParser"

// Registry
export * from "./registry/index"

// Schema
export * from "./schema/index"

// Types
export * from "./types"

// Utils
export * from "./utils/abortUtils"
export * from "./utils/contextInterpolator"
export * from "./utils/schemaValidator"

// Events (for TUI integration)
export { WorkflowBusEvents, type ExecutionSummaryForTUI, type StepStatusForTUI } from "./events"
