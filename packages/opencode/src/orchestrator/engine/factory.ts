/**
 * Workflow Engine Factory
 *
 * Factory functions for creating fully-wired workflow engines.
 */

import { createStepExecutorRegistry, type StepExecutorRegistry } from "../registry/stepExecutorRegistry.js"
import type { StepExecutorRegistryConfig } from "../registry/types.js"
import { DefaultWorkflowEngine, type WorkflowEngineConfig } from "./workflowEngine.js"

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
}

/**
 * Result of creating a workflow engine.
 */
export type WorkflowEngineBundle = {
  engine: DefaultWorkflowEngine
  registry: StepExecutorRegistry
}

/**
 * Create a fully-wired workflow engine.
 *
 * @param options - Factory options
 * @returns Bundle containing the engine and registry
 *
 * @example
 * ```typescript
 * const { engine } = await createWorkflowEngine({ directory: process.cwd() });
 * const workflow = await engine.loadWorkflow('my-workflow');
 * const result = await engine.executeWorkflow(workflow, 'task-123');
 * ```
 */
export async function createWorkflowEngine(options: CreateWorkflowEngineOptions = {}): Promise<WorkflowEngineBundle> {
  const { directory, engineConfig, registryConfig } = options

  const registry = createStepExecutorRegistry(registryConfig)
  await registry.initialize({ directory })

  const engine = new DefaultWorkflowEngine({
    ...engineConfig,
    executorRegistry: registry,
  })

  return { engine, registry }
}

/**
 * Create a workflow engine without directory (placeholder executors).
 */
export async function createWorkflowEngineWithoutAdapter(
  options: Omit<CreateWorkflowEngineOptions, "directory"> = {},
): Promise<WorkflowEngineBundle> {
  return createWorkflowEngine(options)
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
