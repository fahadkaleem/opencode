/**
 * Workflow Engine Factory
 *
 * Factory functions for creating fully-wired workflow engines.
 */

import * as path from "node:path"
import { createStepExecutorRegistry, type StepExecutorRegistry } from "../registry/stepExecutorRegistry"
import type { StepExecutorRegistryConfig } from "../registry/types"
import { DefaultWorkflowEngine, type WorkflowEngineConfig } from "./workflowEngine"
import { createStateManager, type StateManager } from "../../state/stateManager"
import { FLOMASTER_DIR, EXECUTIONS_DIR } from "../../state/defaults"

/**
 * Options for creating a workflow engine.
 */
export type CreateWorkflowEngineOptions = {
  /** Working directory for session context */
  directory?: string
  /** Workflow engine configuration */
  engineConfig?: Omit<WorkflowEngineConfig, "executorRegistry">
  /** Registry configuration */
  registryConfig?: StepExecutorRegistryConfig
  /** Whether to enable state management (default: true) */
  enableStateManager?: boolean
}

/**
 * Result of creating a workflow engine.
 */
export type WorkflowEngineBundle = {
  engine: DefaultWorkflowEngine
  registry: StepExecutorRegistry
  stateManager?: StateManager
}

/**
 * Create a fully-wired workflow engine.
 *
 * @param options - Factory options
 * @returns Bundle containing the engine, registry, and optionally state manager
 *
 * @example
 * ```typescript
 * const { engine, stateManager } = await createWorkflowEngine({ directory: process.cwd() });
 * const workflow = await engine.loadWorkflow('my-workflow');
 * const result = await engine.executeWorkflow(workflow, 'task-123');
 * ```
 */
export async function createWorkflowEngine(options: CreateWorkflowEngineOptions = {}): Promise<WorkflowEngineBundle> {
  const { directory, engineConfig, registryConfig, enableStateManager = false } = options

  const registry = createStepExecutorRegistry(registryConfig)
  await registry.initialize({ directory })

  const engine = new DefaultWorkflowEngine({
    ...engineConfig,
    executorRegistry: registry,
  })

  // Create state manager if explicitly enabled and directory is provided
  let stateManager: StateManager | undefined
  if (enableStateManager && directory) {
    const executionsDir = path.join(directory, FLOMASTER_DIR, EXECUTIONS_DIR)
    stateManager = await createStateManager({
      executionsDir,
    })
  }

  return { engine, registry, stateManager }
}

/**
 * Create just the registry, initialized with a directory.
 */
export async function createInitializedRegistry(
  directory?: string,
  config?: StepExecutorRegistryConfig,
): Promise<StepExecutorRegistry> {
  const registry = createStepExecutorRegistry(config)
  await registry.initialize({ directory })
  return registry
}
