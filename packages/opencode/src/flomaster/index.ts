/**
 * FloMaster Module
 *
 * Self-contained module for workflow orchestration and state management.
 * All FloMaster-specific code is contained here for clean upstream merges.
 *
 * @example
 * ```typescript
 * import { createWorkflowEngine, WorkflowCommand } from './flomaster';
 *
 * const { engine } = await createWorkflowEngine({ directory: process.cwd() });
 * const result = await engine.executeWorkflow(workflow, 'task-123');
 * ```
 */

// Orchestrator exports
export * from "./orchestrator/index.js"

// State management exports (selective to avoid conflicts)
export {
  createStateManager,
  DefaultStateManager,
  type StateManager,
  type CreateStateManagerOptions,
  // Error classes
  NotInitializedError,
  AlreadyInitializedError,
  NotFoundError,
  AlreadyExistsError,
} from "./state/stateManager.js"

export {
  // Types
  ExecutionStatus,
  StepExecutionStatus,
  isExecutionStatus,
  isStepExecutionStatus,
  isTerminalStatus,
  isActiveStatus,
  type WorkflowExecution,
  type ExecutionCheckpoint,
  type ExecutionFilter,
  type ExecutionSummary,
  type IncompleteExecution,
  type SessionDetails,
  type SessionMessage,
  type StateManagerConfig,
  // Note: SharedContext and StepResult are also exported from orchestrator
  // Use state/types.js directly if you need the state module's version
} from "./state/types.js"

export {
  // Defaults
  FLOMASTER_DIR,
  EXECUTIONS_DIR,
  STATE_FILENAME,
  CONTEXT_FILENAME,
  MAPPING_FILENAME,
  CHECKPOINT_FILENAME,
  CHECKPOINT_VERSION,
} from "./state/defaults.js"

// CLI commands
export { WorkflowCommand } from "./cli/workflow.js"
