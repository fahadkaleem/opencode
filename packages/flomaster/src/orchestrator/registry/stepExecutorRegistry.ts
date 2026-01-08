/**
 * Step Executor Registry
 *
 * Centralized registry for step executors following the registry pattern
 * from docs/patterns/registry-patterns.md
 *
 * Key features:
 * - Map-based storage with step type as key
 * - Explicit initialization for loading built-in executors
 * - Protected registration for built-ins, public for custom
 * - Source tracking for debugging
 * - Validation on registration
 */

import type { StepType } from "../types.js"
import { createAgentExecutorFromDependencies, placeholderAgentExecutor } from "./executors/agentExecutor.js"
import { conditionalExecutor } from "./executors/conditionalExecutor.js"
import { genericExecutor, inputExecutor, outputExecutor } from "./executors/genericExecutor.js"
import { loopExecutor } from "./executors/loopExecutor.js"
import { promptExecutor } from "./executors/promptExecutor.js"
import { createSubFlowExecutorFromDependencies, placeholderSubFlowExecutor } from "./executors/subflowExecutor.js"
import type {
  ExecutorDependencies,
  ExecutorRegistryEntry,
  StepEventEmitter,
  StepExecutor,
  StepExecutorRegistryConfig,
} from "./types.js"
import { isStepExecutor } from "./types.js"

/**
 * Error thrown when attempting to use registry before initialization.
 */
export class RegistryNotInitializedError extends Error {
  constructor(message = "Step executor registry not initialized. Call initialize() first.") {
    super(message)
    this.name = "RegistryNotInitializedError"
  }
}

/**
 * Error thrown when executor validation fails.
 */
export class InvalidExecutorError extends Error {
  readonly executorType: string

  constructor(message: string, executorType: string) {
    super(message)
    this.name = "InvalidExecutorError"
    this.executorType = executorType
  }
}

/**
 * Error thrown when no executor is found for a step type.
 */
export class ExecutorNotFoundError extends Error {
  readonly stepType: string

  constructor(stepType: string) {
    super(`No executor registered for step type: ${stepType}`)
    this.name = "ExecutorNotFoundError"
    this.stepType = stepType
  }
}

/**
 * Registry for managing step executors.
 *
 * Follows the registry pattern:
 * - Map-based storage with O(1) lookup
 * - Explicit initialization required before use
 * - Built-in executors loaded during initialization
 * - Custom executors can be registered after initialization
 * - Source tracking for debugging
 *
 * @example
 * ```typescript
 * const registry = new StepExecutorRegistry({ debug: true });
 *
 * // Initialize with dependencies for built-in executors
 * await registry.initialize({
 *   directory: process.cwd(),
 * });
 *
 * // Register custom executor
 * registry.register(myCustomExecutor, 'custom');
 *
 * // Get executor for a step type
 * const executor = registry.get('Agent');
 * ```
 */
export class StepExecutorRegistry {
  /** Registered executors by step type */
  private readonly executors: Map<string, ExecutorRegistryEntry> = new Map()

  /** Registry configuration */
  private readonly registryConfig: Required<StepExecutorRegistryConfig>

  /** Whether registry has been initialized */
  private initialized = false

  /** Dependencies for executor factories */
  private dependencies: ExecutorDependencies | null = null

  /**
   * Step event emitters by execution ID.
   * Used to pass streaming callbacks to executors without storing in XState context.
   * Callbacks are set by WorkflowEngine before execution and removed after completion.
   */
  private readonly stepEventEmitters: Map<string, StepEventEmitter> = new Map()

  constructor(config: StepExecutorRegistryConfig = {}) {
    this.registryConfig = {
      debug: config.debug ?? false,
      allowOverwrite: config.allowOverwrite ?? true,
    }
  }

  /**
   * Set a step event emitter for a specific execution.
   * Called by WorkflowEngine before starting workflow execution.
   *
   * @param executionId - The execution ID
   * @param emitter - The event emitter callback
   */
  setStepEventEmitter(executionId: string, emitter: StepEventEmitter): void {
    this.stepEventEmitters.set(executionId, emitter)
  }

  /**
   * Get the step event emitter for a specific execution.
   * Called by step actors during execution.
   *
   * @param executionId - The execution ID
   * @returns The event emitter or undefined if not set
   */
  getStepEventEmitter(executionId: string): StepEventEmitter | undefined {
    return this.stepEventEmitters.get(executionId)
  }

  /**
   * Remove the step event emitter for a specific execution.
   * Called by WorkflowEngine after execution completes.
   *
   * @param executionId - The execution ID
   */
  removeStepEventEmitter(executionId: string): void {
    this.stepEventEmitters.delete(executionId)
  }

  /**
   * Initialize the registry by loading built-in executors.
   *
   * Must be called before any other operations.
   *
   * @param dependencies - Dependencies for executor factories (e.g., SDK client)
   * @throws Error if already initialized
   */
  initialize(dependencies: ExecutorDependencies = {}): Promise<void> {
    if (this.initialized) {
      return Promise.reject(new Error("Registry already initialized. Call initialize() only once."))
    }

    this.dependencies = dependencies
    this.loadBuiltInExecutors()
    this.initialized = true

    if (this.registryConfig.debug) {
      // TODO: Add debug logging here
    }

    return Promise.resolve()
  }

  /**
   * Check if registry is initialized.
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Assert that registry is initialized.
   * @throws RegistryNotInitializedError if not initialized
   */
  private assertInitialized(): void {
    if (!this.initialized) {
      throw new RegistryNotInitializedError()
    }
  }

  /**
   * Register a step executor.
   *
   * @param executor - The executor to register
   * @param source - Source of registration (default: 'custom')
   * @throws InvalidExecutorError if executor is invalid
   * @throws Error if type already registered and allowOverwrite is false
   */
  register(executor: StepExecutor, source: "built-in" | "custom" | "plugin" = "custom"): void {
    this.assertInitialized()

    if (!isStepExecutor(executor)) {
      throw new InvalidExecutorError("Invalid executor: must have type and execute properties", String(executor))
    }
    // Note: executor.type is guaranteed to be a non-empty string by isStepExecutor

    const existing = this.executors.get(executor.type)
    if (existing) {
      if (!this.registryConfig.allowOverwrite) {
        throw new Error(
          `Executor for type "${executor.type}" already registered. ` +
            "Set allowOverwrite: true to allow overwriting.",
        )
      }

      if (this.registryConfig.debug) {
        // TODO: Add debug logging here
      }
    }

    this.executors.set(executor.type, {
      executor,
      source,
      registeredAt: Date.now(),
    })

    if (this.registryConfig.debug && !existing) {
      // TODO: Add debug logging here
    }
  }

  /**
   * Unregister an executor by step type.
   *
   * @param type - The step type to unregister
   * @returns true if executor was removed, false if not found
   */
  unregister(type: StepType): boolean {
    this.assertInitialized()

    const existed = this.executors.has(type)
    this.executors.delete(type)

    if (this.registryConfig.debug && existed) {
      // TODO: Add debug logging here
    }

    return existed
  }

  /**
   * Get an executor by step type.
   *
   * @param type - The step type
   * @returns The executor or undefined if not found
   */
  get(type: StepType): StepExecutor | undefined {
    this.assertInitialized()

    const entry = this.executors.get(type)
    return entry?.executor
  }

  /**
   * Get an executor by step type, throwing if not found.
   *
   * @param type - The step type
   * @returns The executor
   * @throws ExecutorNotFoundError if no executor registered for type
   */
  getRequired(type: StepType): StepExecutor {
    const executor = this.get(type)
    if (!executor) {
      throw new ExecutorNotFoundError(type)
    }
    return executor
  }

  /**
   * Check if an executor is registered for a step type.
   *
   * @param type - The step type
   * @returns true if registered
   */
  has(type: StepType): boolean {
    this.assertInitialized()
    return this.executors.has(type)
  }

  /**
   * Get all registered step types.
   *
   * @returns Array of registered step types, sorted alphabetically
   */
  getRegisteredTypes(): StepType[] {
    this.assertInitialized()

    return Array.from(this.executors.keys()).sort() as StepType[]
  }

  /**
   * Get all registered executors.
   *
   * @returns Array of executor entries
   */
  getAllEntries(): ExecutorRegistryEntry[] {
    this.assertInitialized()

    return Array.from(this.executors.values())
  }

  /**
   * Get executors by source.
   *
   * @param source - Filter by registration source
   * @returns Array of matching executors
   */
  getBySource(source: "built-in" | "custom" | "plugin"): StepExecutor[] {
    this.assertInitialized()

    return Array.from(this.executors.values())
      .filter((entry) => entry.source === source)
      .map((entry) => entry.executor)
  }

  /**
   * Get the number of registered executors.
   */
  get size(): number {
    return this.executors.size
  }

  /**
   * Get the dependencies used for initialization.
   */
  getDependencies(): ExecutorDependencies | null {
    return this.dependencies
  }

  /**
   * Load built-in executors.
   *
   * Executors are loaded in two categories:
   * 1. Pure executors (no external dependencies): Prompt, Conditional, Loop, Generic, Input, Output
   * 2. Dependency-based executors (need SDK client, etc.): Agent, SubFlow
   *
   * For dependency-based executors, if dependencies are provided during initialize(),
   * the real executor is used. Otherwise, a placeholder is registered.
   */
  protected loadBuiltInExecutors(): void {
    // Pure executors - no external dependencies
    this.registerBuiltIn(promptExecutor)
    this.registerBuiltIn(conditionalExecutor)
    this.registerBuiltIn(loopExecutor)
    this.registerBuiltIn(genericExecutor)
    this.registerBuiltIn(inputExecutor)
    this.registerBuiltIn(outputExecutor)

    // Agent executor - try to create from dependencies, fallback to placeholder
    const agentExecutor = createAgentExecutorFromDependencies(this.dependencies ?? {})
    this.registerBuiltIn(agentExecutor ?? placeholderAgentExecutor)

    // SubFlow executor - try to create from dependencies, fallback to placeholder
    const subflowExecutor = createSubFlowExecutorFromDependencies(this.dependencies ?? {})
    this.registerBuiltIn(subflowExecutor ?? placeholderSubFlowExecutor)

    // Note: Command executor and other custom types should be registered
    // by the consumer after initialization.
  }

  /**
   * Register a built-in executor.
   */
  private registerBuiltIn(executor: StepExecutor): void {
    this.executors.set(executor.type, {
      executor,
      source: "built-in",
      registeredAt: Date.now(),
    })
  }

  /**
   * Clear all registered executors.
   * Primarily for testing.
   */
  clear(): void {
    this.executors.clear()
    this.initialized = false
    this.dependencies = null

    if (this.registryConfig.debug) {
      // TODO: Add debug logging here
    }
  }

  /**
   * Get a summary of registered executors for debugging.
   */
  toDebugString(): string {
    const lines = ["StepExecutorRegistry:"]
    lines.push(`  Initialized: ${this.initialized}`)
    lines.push(`  Total executors: ${this.executors.size}`)
    lines.push("  Registered types:")

    for (const [type, entry] of this.executors.entries()) {
      lines.push(`    - ${type} (${entry.source})`)
    }

    return lines.join("\n")
  }
}

/**
 * Create a new StepExecutorRegistry instance.
 *
 * @param config - Optional configuration
 * @returns New registry instance (not initialized)
 *
 * @example
 * ```typescript
 * const registry = createStepExecutorRegistry({ debug: true });
 * await registry.initialize({ client: config.getClient() });
 * ```
 */
export function createStepExecutorRegistry(config?: StepExecutorRegistryConfig): StepExecutorRegistry {
  return new StepExecutorRegistry(config)
}
