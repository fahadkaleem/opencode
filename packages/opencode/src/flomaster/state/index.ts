/**
 * State Manager
 *
 * Workflow execution state management, shared context, step-session mapping,
 * and crash recovery.
 *
 * @example
 * ```typescript
 * import { createStateManager } from './flomaster/state';
 *
 * const stateManager = await createStateManager({
 *   executionsDir: '.flomaster/executions',
 * });
 *
 * // Create a new execution
 * const execution = await stateManager.createExecution('exec-123', 'sdlc');
 *
 * // Update step status
 * await stateManager.updateStepStatus('exec-123', 'step-1', StepExecutionStatus.RUNNING);
 * ```
 */

export * from "./defaults.js"
export * from "./stateManager.js"
export * from "./types.js"
