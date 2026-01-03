/**
 * Step Executor Registry
 *
 * Centralized registry for step executors following the registry pattern.
 *
 * @example
 * ```typescript
 * import { createStepExecutorRegistry, createAgentExecutor } from '@flomaster/core';
 *
 * // Create and initialize registry
 * const registry = createStepExecutorRegistry({ debug: true });
 * await registry.initialize();
 *
 * // Register agent executor with SDK client
 * const client = config.getClient();
 * registry.register(createAgentExecutor(client), 'custom');
 *
 * // Get executor for a step type
 * const executor = registry.getRequired('Agent');
 * const result = await executor.execute(step, context, options);
 * ```
 */

export type {
  AgentExecutionResult,
  SubFlowExecutorDependencies,
} from './executors/index.js';
export {
  AgentExecutionError,
  ConditionalExecutionError,
  conditionalExecutor,
  createAgentExecutor,
  createAgentExecutorFromDependencies,
  createSubFlowExecutor,
  createSubFlowExecutorFromDependencies,
  genericExecutor,
  inputExecutor,
  LoopExecutionError,
  loopExecutor,
  outputExecutor,
  PromptExecutionError,
  placeholderAgentExecutor,
  placeholderSubFlowExecutor,
  promptExecutor,
} from './executors/index.js';

export {
  createStepExecutorRegistry,
  ExecutorNotFoundError,
  InvalidExecutorError,
  RegistryNotInitializedError,
  StepExecutorRegistry,
} from './stepExecutorRegistry.js';
export type {
  ExecutorContext,
  ExecutorDependencies,
  ExecutorOptions,
  ExecutorRegistryEntry,
  ExecutorValidationResult,
  StepExecutor,
  StepExecutorFactory,
  StepExecutorRegistryConfig,
} from './types.js';
export { isExecutorValidationResult, isStepExecutor } from './types.js';
