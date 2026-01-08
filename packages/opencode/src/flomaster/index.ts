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
export * from "./orchestrator/index"

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
} from "./state/stateManager"

export {
  // Types
  ExecutionStatus,
  StepExecutionStatus,
  isExecutionStatus,
  isStepExecutionStatus,
  isTerminalStatus,
  isActiveStatus,
  EXECUTION_SCHEMA_VERSION,
  type Execution,
  type ExecutionStep,
  type ExecutionFilter,
  type ExecutionSummary,
  type IncompleteExecution,
  type SessionDetails,
  type SessionMessage,
  // Note: SharedContext and StepResult are also exported from orchestrator
  // Use state/types.js directly if you need the state module's version
} from "./state/types"

export {
  // Defaults
  FLOMASTER_DIR,
  EXECUTIONS_DIR,
  EXECUTION_FILENAME,
  LOGS_FILENAME,
} from "./state/defaults"

// CLI commands
export { WorkflowCommand } from "./cli/workflow"

// Server routes
export { createWorkflowRoutes } from "./server/index"
