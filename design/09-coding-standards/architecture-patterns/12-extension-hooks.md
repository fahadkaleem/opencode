---
title: Extension & Hook Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - Extension System
related_patterns:
  - ./08-dependency-management.md#lifecycle-management
  - ./02-architectural-design-patterns.md#registry-pattern
  - ./06-code-organization.md#event-driven-architecture
---

# 12. Extension & Hook Patterns

> **Purpose**: Comprehensive patterns for building extensible systems with hook-based event handling, dynamic extension loading, and lifecycle management.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Hook Registry System](#pattern-1-hook-registry-system)
- [Pattern 2: Hook Execution Engine](#pattern-2-hook-execution-engine)
- [Pattern 3: Hook Planner with Matcher-Based Filtering](#pattern-3-hook-planner-with-matcher-based-filtering)
- [Pattern 4: Hook Aggregator with Event-Specific Strategies](#pattern-4-hook-aggregator-with-event-specific-strategies)
- [Pattern 5: Extension Loader with Lifecycle Management](#pattern-5-extension-loader-with-lifecycle-management)
- [Pattern 6: Extension Manager with Dynamic Loading](#pattern-6-extension-manager-with-dynamic-loading)
- [Pattern 7: Extension Enablement with Path-Based Activation](#pattern-7-extension-enablement-with-path-based-activation)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Extension and hook systems enable building highly extensible applications where functionality can be added, modified, or removed without changing core code. A well-designed extension system separates core functionality from customization points, allowing third-party developers to extend behavior through well-defined interfaces.

Modern CLI applications benefit from extension systems by allowing users to add custom commands, integrate with external services, and customize behavior through hooks that intercept key lifecycle events. This pattern is essential for building platforms rather than monolithic tools.

**Why extension and hook systems matter:**

- Enable third-party extensibility without modifying core code
- Provide customization points at critical lifecycle events
- Support dynamic loading and unloading of functionality
- Allow behavior modification through declarative configuration
- Enable community-driven feature development
- Maintain stability through controlled extension APIs

**In this document:**

- **Hook Registry System** - Multi-source hook registration with priority management
- **Hook Execution Engine** - Parallel and sequential hook execution with timeout handling
- **Hook Planner** - Matcher-based hook selection and execution planning
- **Hook Aggregator** - Event-specific result aggregation strategies
- **Extension Loader** - Abstract lifecycle management for extensions
- **Extension Manager** - Concrete implementation with install/uninstall
- **Extension Enablement** - Path-based activation rules with scope management

**Prerequisites:**

- Understanding of event-driven architecture
- Familiarity with lifecycle management patterns
- Knowledge of process spawning and IPC
- Experience with registry and factory patterns

---

## Pattern 1: Hook Registry System

### Intent

Provide centralized hook registration and retrieval with multi-source configuration support and priority management.

### Problem

Applications need to support hooks from multiple sources (project configuration, user settings, system defaults, extensions) with clear precedence rules. Hook configurations must be validated, deduplicated, and efficiently retrieved by event name. The system must support dynamic enabling/disabling of individual hooks without modifying configuration files.

### Solution

Implement a hook registry that loads hooks from multiple sources, assigns priorities based on source, validates configurations, and provides efficient lookup by event name. Support dynamic enable/disable through runtime state management separate from configuration.

### Structure

```typescript
// Multi-source hook loading with priority
HookRegistry
  ├── entries: HookRegistryEntry[]
  ├── initialize()
  ├── getHooksForEvent(eventName): HookRegistryEntry[]
  └── setHookEnabled(hookName, enabled)

HookRegistryEntry
  ├── config: HookConfig
  ├── source: ConfigSource
  ├── eventName: HookEventName
  ├── matcher?: string
  ├── sequential?: boolean
  └── enabled: boolean

ConfigSource (priority order)
  1. Project (highest priority)
  2. User
  3. System
  4. Extensions (lowest priority)
```

### Implementation

**Step 1: Define Configuration Source Levels**

```typescript
/**
 * Configuration source levels in precedence order (highest to lowest)
 */
export enum ConfigSource {
  Project = 'project',
  User = 'user',
  System = 'system',
  Extensions = 'extensions',
}
```

**Step 2: Define Hook Registry Entry Structure**

```typescript
/**
 * Hook registry entry with source information
 */
export interface HookRegistryEntry {
  config: HookConfig;
  source: ConfigSource;
  eventName: HookEventName;
  matcher?: string;
  sequential?: boolean;
  enabled: boolean;
}

/**
 * Hook configuration entry
 */
export interface CommandHookConfig {
  type: HookType.Command;
  command: string;
  timeout?: number;
}

export type HookConfig = CommandHookConfig;

/**
 * Hook definition with matcher
 */
export interface HookDefinition {
  matcher?: string; // Regex pattern to match tool names
  sequential?: boolean; // Run hooks sequentially vs parallel
  hooks: HookConfig[];
}
```

**Step 3: Implement Hook Registry with Multi-Source Loading**

```typescript
import { Config } from '../config/config.js';
import type { HookEventName, HookDefinition, HookConfig } from './types.js';

export class HookRegistry {
  private readonly config: Config;
  private entries: HookRegistryEntry[] = [];
  private initialized = false;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Initialize the registry by processing hooks from config
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.entries = [];
    this.processHooksFromConfig();
    this.initialized = true;

    console.log(`Hook registry initialized with ${this.entries.length} hook entries`);
  }

  /**
   * Get all hook entries for a specific event
   */
  getHooksForEvent(eventName: HookEventName): HookRegistryEntry[] {
    if (!this.initialized) {
      throw new Error('Hook registry not initialized');
    }

    return this.entries
      .filter((entry) => entry.eventName === eventName && entry.enabled)
      .sort((a, b) => this.getSourcePriority(a.source) - this.getSourcePriority(b.source));
  }

  /**
   * Enable or disable a specific hook
   */
  setHookEnabled(hookName: string, enabled: boolean): void {
    const updated = this.entries.filter((entry) => {
      const name = this.getHookName(entry);
      if (name === hookName) {
        entry.enabled = enabled;
        return true;
      }
      return false;
    });

    if (updated.length > 0) {
      console.log(
        `${enabled ? 'Enabled' : 'Disabled'} ${updated.length} hook(s) matching "${hookName}"`
      );
    }
  }

  /**
   * Process hooks from the config that was already loaded by the CLI
   */
  private processHooksFromConfig(): void {
    // Get hooks from the main config
    const configHooks = this.config.getHooks();
    if (configHooks) {
      this.processHooksConfiguration(configHooks, ConfigSource.Project);
    }

    // Get hooks from extensions
    const extensions = this.config.getExtensions() || [];
    for (const extension of extensions) {
      if (extension.isActive && extension.hooks) {
        this.processHooksConfiguration(extension.hooks, ConfigSource.Extensions);
      }
    }
  }

  /**
   * Process hooks configuration and add entries
   */
  private processHooksConfiguration(
    hooksConfig: { [K in HookEventName]?: HookDefinition[] },
    source: ConfigSource
  ): void {
    for (const [eventName, definitions] of Object.entries(hooksConfig)) {
      if (!this.isValidEventName(eventName)) {
        console.warn(`Invalid hook event name: ${eventName}`);
        continue;
      }

      const typedEventName = eventName as HookEventName;

      if (!Array.isArray(definitions)) {
        console.warn(
          `Hook definitions for event "${eventName}" from source "${source}" is not an array. Skipping.`
        );
        continue;
      }

      for (const definition of definitions) {
        this.processHookDefinition(definition, typedEventName, source);
      }
    }
  }

  /**
   * Process a single hook definition
   */
  private processHookDefinition(
    definition: HookDefinition,
    eventName: HookEventName,
    source: ConfigSource
  ): void {
    if (!definition || typeof definition !== 'object' || !Array.isArray(definition.hooks)) {
      console.warn(
        `Discarding invalid hook definition for ${eventName} from ${source}:`,
        definition
      );
      return;
    }

    for (const hookConfig of definition.hooks) {
      if (
        hookConfig &&
        typeof hookConfig === 'object' &&
        this.validateHookConfig(hookConfig, eventName, source)
      ) {
        this.entries.push({
          config: hookConfig,
          source,
          eventName,
          matcher: definition.matcher,
          sequential: definition.sequential,
          enabled: true,
        });
      }
    }
  }

  /**
   * Get source priority (lower number = higher priority)
   */
  private getSourcePriority(source: ConfigSource): number {
    switch (source) {
      case ConfigSource.Project:
        return 1;
      case ConfigSource.User:
        return 2;
      case ConfigSource.System:
        return 3;
      case ConfigSource.Extensions:
        return 4;
      default:
        return 999;
    }
  }

  /**
   * Validate hook event name
   */
  private isValidEventName(eventName: string): boolean {
    return Object.values(HookEventName).includes(eventName as HookEventName);
  }

  /**
   * Validate hook configuration
   */
  private validateHookConfig(
    config: HookConfig,
    eventName: HookEventName,
    source: ConfigSource
  ): boolean {
    if (!config.type || !config.command) {
      console.warn(`Invalid hook config for ${eventName} from ${source}: missing type or command`);
      return false;
    }
    return true;
  }

  /**
   * Get hook name for identification
   */
  private getHookName(entry: HookRegistryEntry): string {
    return `${entry.eventName}-${entry.config.command}`;
  }
}
```

### Complete Example

```typescript
import { HookRegistry, ConfigSource } from './hookRegistry.js';
import type { Config } from '../config/config.js';

// Define hook event names
export enum HookEventName {
  BeforeTool = 'BeforeTool',
  AfterTool = 'AfterTool',
  BeforeAgent = 'BeforeAgent',
  AfterAgent = 'AfterAgent',
  SessionStart = 'SessionStart',
  SessionEnd = 'SessionEnd',
}

export enum HookType {
  Command = 'command',
}

// Example usage
async function initializeHookSystem(config: Config) {
  const hookRegistry = new HookRegistry(config);

  // Initialize registry (loads from all sources)
  await hookRegistry.initialize();

  // Get hooks for a specific event
  const beforeToolHooks = hookRegistry.getHooksForEvent(HookEventName.BeforeTool);
  console.log(`Found ${beforeToolHooks.length} hooks for BeforeTool event`);

  // Hooks are sorted by source priority (Project > User > System > Extensions)
  beforeToolHooks.forEach((entry) => {
    console.log(`Hook: ${entry.config.command} from ${entry.source}`);
  });

  // Dynamically disable a specific hook
  hookRegistry.setHookEnabled('BeforeTool-my-hook.sh', false);

  // Re-fetch hooks (disabled hook will be filtered out)
  const activeHooks = hookRegistry.getHooksForEvent(HookEventName.BeforeTool);
  console.log(`Active hooks: ${activeHooks.length}`);
}
```

**Example explained:**

- Lines 1-14: Define hook event types and configuration structures
- Lines 16-26: Initialize registry and load hooks from multiple sources
- Lines 28-33: Retrieve hooks for specific event, automatically sorted by priority
- Lines 35-36: Dynamically disable hook at runtime
- Lines 38-40: Verify that disabled hooks are filtered from results

### When to Use

**Use this pattern when:**

- Application needs to support hooks from multiple configuration sources
- Priority rules are required for conflicting hooks
- Runtime enable/disable of hooks is needed
- Hook configurations must be validated before use
- Efficient lookup by event name is critical
- Extensions need to contribute hooks

**Avoid this pattern when:**

- Only a single hook source is needed (use simpler registry)
- No priority resolution is required
- Static configuration is sufficient
- Overhead of multi-source loading is unnecessary

### Benefits

- **Source Priority**: Clear precedence rules for conflicting hooks
- **Validation**: All hooks validated at load time
- **Efficient Lookup**: Fast retrieval by event name
- **Dynamic Control**: Enable/disable without config changes
- **Extensibility**: Extensions can contribute hooks seamlessly
- **Deduplication**: Automatic removal of duplicate hooks

### Trade-offs

- **Initialization Cost**: All hooks loaded upfront
- **Memory Usage**: All hooks kept in memory
- **Complexity**: Multi-source loading adds complexity
- **Re-initialization**: Changes to config require re-initialization

### Common Mistakes

**Mistake 1: Not validating hook configurations**

Bad example:

```typescript
private processHookDefinition(definition: HookDefinition, eventName: HookEventName) {
  // Directly add without validation
  for (const hookConfig of definition.hooks) {
    this.entries.push({ config: hookConfig, eventName });
  }
}
```

Correct approach:

```typescript
private processHookDefinition(definition: HookDefinition, eventName: HookEventName) {
  if (!definition || !Array.isArray(definition.hooks)) {
    console.warn(`Invalid hook definition for ${eventName}`);
    return;
  }

  for (const hookConfig of definition.hooks) {
    if (this.validateHookConfig(hookConfig, eventName)) {
      this.entries.push({ config: hookConfig, eventName });
    }
  }
}
```

**Why this matters**: Invalid configurations can cause runtime errors during execution. Validation at registration time provides early feedback.

**Mistake 2: Ignoring source priority when retrieving hooks**

Bad example:

```typescript
getHooksForEvent(eventName: HookEventName): HookRegistryEntry[] {
  return this.entries.filter((entry) => entry.eventName === eventName);
  // Returns unsorted hooks
}
```

Correct approach:

```typescript
getHooksForEvent(eventName: HookEventName): HookRegistryEntry[] {
  return this.entries
    .filter((entry) => entry.eventName === eventName && entry.enabled)
    .sort((a, b) =>
      this.getSourcePriority(a.source) - this.getSourcePriority(b.source)
    );
}
```

**Why this matters**: Without sorting by priority, hooks may execute in unpredictable order, violating precedence rules.

### Testing Strategy

**What to Test:**

- Registry initialization loads hooks from all sources
- Hooks are sorted by source priority correctly
- Invalid configurations are rejected
- Dynamic enable/disable works correctly
- Deduplication removes identical hooks
- Multiple hooks for same event are all retrieved

**Test Organization:**

- Co-locate test: `hookRegistry.ts` → `hookRegistry.test.ts`
- Use AAA pattern for each test
- Mock Config object for different scenarios

**Mock Strategy:**

- Mock Config with different hook configurations
- Use real HookRegistry implementation
- Mock console for validation warnings

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { HookRegistry, ConfigSource } from './hookRegistry.js';
import type { Config } from '../config/config.js';

describe('HookRegistry', () => {
  let hookRegistry: HookRegistry;
  let mockConfig: Config;

  beforeEach(() => {
    // Arrange - Create mock config with hooks
    mockConfig = {
      getHooks: () => ({
        BeforeTool: [
          {
            hooks: [{ type: 'command', command: 'project-hook.sh' }],
          },
        ],
      }),
      getExtensions: () => [
        {
          isActive: true,
          hooks: {
            BeforeTool: [
              {
                hooks: [{ type: 'command', command: 'extension-hook.sh' }],
              },
            ],
          },
        },
      ],
    } as unknown as Config;

    hookRegistry = new HookRegistry(mockConfig);
  });

  it('should initialize with hooks from multiple sources', async () => {
    // Act
    await hookRegistry.initialize();

    // Assert
    const hooks = hookRegistry.getHooksForEvent('BeforeTool');
    expect(hooks).to.have.lengthOf(2);
  });

  it('should sort hooks by source priority', async () => {
    // Act
    await hookRegistry.initialize();
    const hooks = hookRegistry.getHooksForEvent('BeforeTool');

    // Assert - Project hooks should come before extension hooks
    expect(hooks[0].source).to.equal(ConfigSource.Project);
    expect(hooks[1].source).to.equal(ConfigSource.Extensions);
  });

  it('should filter disabled hooks', async () => {
    // Arrange
    await hookRegistry.initialize();

    // Act
    hookRegistry.setHookEnabled('BeforeTool-project-hook.sh', false);
    const hooks = hookRegistry.getHooksForEvent('BeforeTool');

    // Assert
    expect(hooks).to.have.lengthOf(1);
    expect(hooks[0].config.command).to.equal('extension-hook.sh');
  });

  it('should throw error when not initialized', () => {
    // Act & Assert
    expect(() => hookRegistry.getHooksForEvent('BeforeTool')).to.throw(
      'Hook registry not initialized'
    );
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 75%+ (handle all source types and validation paths)
- Function coverage: 90%+

### Related Patterns

- **[Registry Pattern](./02-architectural-design-patterns.md#registry-pattern)** - Base pattern for registration and lookup
- **[Event-Driven Architecture](./06-code-organization.md#event-driven-architecture)** - Hook events are system events
- **[Priority Queue Pattern](./02-architectural-design-patterns.md#priority-queue)** - Source priority management

---

## Pattern 2: Hook Execution Engine

### Intent

Execute hooks with support for parallel and sequential execution modes, timeout handling, and error recovery.

### Problem

Hooks must execute external commands with JSON input/output, handle timeouts gracefully, support both parallel (fast) and sequential (ordered) execution, and recover from individual hook failures without affecting other hooks. Process lifecycle management (spawn, timeout, graceful/forceful shutdown) must be robust.

### Solution

Implement a hook runner that spawns child processes for command hooks, sends JSON input via stdin, collects stdout/stderr, handles timeouts with graceful shutdown followed by force kill, and returns structured execution results with success/failure status and parsed output.

### Structure

```typescript
// Hook execution flow
HookRunner
  ├── executeHook(config, event, input): Promise<HookExecutionResult>
  ├── executeHooksParallel(configs[]): Promise<HookExecutionResult[]>
  └── executeHooksSequential(configs[]): Promise<HookExecutionResult[]>

executeCommandHook()
  1. Spawn child process with shell
  2. Set environment variables
  3. Send JSON input to stdin
  4. Collect stdout/stderr
  5. Handle timeout with graceful/forceful shutdown
  6. Parse JSON output or convert plain text
  7. Return structured result
```

### Implementation

**Step 1: Define Hook Execution Result Structure**

```typescript
import type { HookConfig, HookEventName, HookInput, HookOutput } from './types.js';

/**
 * Hook execution result
 */
export interface HookExecutionResult {
  hookConfig: HookConfig;
  eventName: HookEventName;
  success: boolean;
  output?: HookOutput;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  duration: number;
  error?: Error;
}

/**
 * Base hook output - common fields for all events
 */
export interface HookOutput {
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  systemMessage?: string;
  decision?: 'allow' | 'block' | 'ask';
  reason?: string;
  hookSpecificOutput?: Record<string, unknown>;
}
```

**Step 2: Implement Single Hook Execution with Timeout**

```typescript
import { spawn } from 'node:child_process';

const DEFAULT_HOOK_TIMEOUT = 30000; // 30 seconds
const EXIT_CODE_SUCCESS = 0;

export class HookRunner {
  /**
   * Execute a single hook
   */
  async executeHook(
    hookConfig: HookConfig,
    eventName: HookEventName,
    input: HookInput
  ): Promise<HookExecutionResult> {
    const startTime = Date.now();

    try {
      return await this.executeCommandHook(hookConfig, eventName, input, startTime);
    } catch (error) {
      const duration = Date.now() - startTime;
      const hookSource = hookConfig.command || 'unknown';
      const errorMessage = `Hook execution failed for event '${eventName}' (source: ${hookSource}): ${error}`;
      console.warn(`Hook execution error (non-fatal): ${errorMessage}`);

      return {
        hookConfig,
        eventName,
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        duration,
      };
    }
  }

  /**
   * Execute a command hook
   */
  private async executeCommandHook(
    hookConfig: HookConfig,
    eventName: HookEventName,
    input: HookInput,
    startTime: number
  ): Promise<HookExecutionResult> {
    const timeout = hookConfig.timeout ?? DEFAULT_HOOK_TIMEOUT;

    return new Promise((resolve) => {
      if (!hookConfig.command) {
        const errorMessage = 'Command hook missing command';
        resolve({
          hookConfig,
          eventName,
          success: false,
          error: new Error(errorMessage),
          duration: Date.now() - startTime,
        });
        return;
      }

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const command = this.expandCommand(hookConfig.command, input);

      // Set up environment variables
      const env = {
        ...process.env,
        PROJECT_DIR: input.cwd,
      };

      const child = spawn(command, {
        env,
        cwd: input.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Set up timeout with graceful shutdown
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');

        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Send input to stdin
      if (child.stdin) {
        child.stdin.write(JSON.stringify(input));
        child.stdin.end();
      }

      // Collect stdout
      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      child.on('close', (exitCode) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;

        if (timedOut) {
          resolve({
            hookConfig,
            eventName,
            success: false,
            error: new Error(`Hook timed out after ${timeout}ms`),
            stdout,
            stderr,
            duration,
          });
          return;
        }

        // Parse output
        let output: HookOutput | undefined;
        if (exitCode === EXIT_CODE_SUCCESS && stdout.trim()) {
          try {
            // Try parsing as JSON
            let parsed = JSON.parse(stdout.trim());
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            if (parsed) {
              output = parsed as HookOutput;
            }
          } catch {
            // Not JSON, convert plain text to structured output
            output = this.convertPlainTextToHookOutput(stdout.trim(), exitCode);
          }
        }

        resolve({
          hookConfig,
          eventName,
          success: exitCode === EXIT_CODE_SUCCESS,
          output,
          stdout,
          stderr,
          exitCode: exitCode || EXIT_CODE_SUCCESS,
          duration,
        });
      });
    });
  }

  /**
   * Expand command with environment variables
   */
  private expandCommand(command: string, input: HookInput): string {
    return command.replace(/\$\{(\w+)\}/g, (_, varName) => {
      return input[varName] || process.env[varName] || '';
    });
  }

  /**
   * Convert plain text output to structured hook output
   */
  private convertPlainTextToHookOutput(text: string, exitCode: number): HookOutput {
    return {
      continue: exitCode === EXIT_CODE_SUCCESS,
      systemMessage: text,
    };
  }
}
```

**Step 3: Implement Parallel and Sequential Execution**

```typescript
export class HookRunner {
  // ... previous methods ...

  /**
   * Execute multiple hooks in parallel
   */
  async executeHooksParallel(
    hookConfigs: HookConfig[],
    eventName: HookEventName,
    input: HookInput
  ): Promise<HookExecutionResult[]> {
    const promises = hookConfigs.map((config) => this.executeHook(config, eventName, input));

    return await Promise.all(promises);
  }

  /**
   * Execute multiple hooks sequentially
   */
  async executeHooksSequential(
    hookConfigs: HookConfig[],
    eventName: HookEventName,
    input: HookInput
  ): Promise<HookExecutionResult[]> {
    const results: HookExecutionResult[] = [];
    let currentInput = input;

    for (const config of hookConfigs) {
      const result = await this.executeHook(config, eventName, currentInput);
      results.push(result);

      // If the hook succeeded and has output, use it to modify input for next hook
      if (result.success && result.output) {
        currentInput = this.applyHookOutputToInput(currentInput, result.output, eventName);
      }
    }

    return results;
  }

  /**
   * Apply hook output to modify input for the next hook in sequential execution
   */
  private applyHookOutputToInput(
    originalInput: HookInput,
    hookOutput: HookOutput,
    eventName: HookEventName
  ): HookInput {
    const modifiedInput = { ...originalInput };

    // Apply event-specific modifications
    if (hookOutput.hookSpecificOutput) {
      // Example: Add additional context for BeforeAgent event
      if (eventName === 'BeforeAgent' && 'additionalContext' in hookOutput.hookSpecificOutput) {
        const additionalContext = hookOutput.hookSpecificOutput['additionalContext'];
        if (typeof additionalContext === 'string' && 'prompt' in modifiedInput) {
          (modifiedInput as any).prompt += '\n\n' + additionalContext;
        }
      }
    }

    return modifiedInput;
  }
}
```

### Complete Example

```typescript
import { HookRunner } from './hookRunner.js';
import type { HookConfig, HookInput } from './types.js';

// Example hook configurations
const hooks: HookConfig[] = [
  {
    type: 'command',
    command: './hooks/validate-input.sh',
    timeout: 5000,
  },
  {
    type: 'command',
    command: 'python ./hooks/analyze.py',
    timeout: 10000,
  },
];

// Example input
const input: HookInput = {
  cwd: '/path/to/project',
  toolName: 'readFile',
  args: { path: 'README.md' },
};

async function executeHooksExample() {
  const runner = new HookRunner();

  // Execute hooks in parallel (faster, but no ordering guarantees)
  console.log('Executing hooks in parallel...');
  const parallelResults = await runner.executeHooksParallel(hooks, 'BeforeTool', input);

  parallelResults.forEach((result, index) => {
    console.log(`Hook ${index + 1}:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Duration: ${result.duration}ms`);
    if (result.output) {
      console.log(`  Output:`, result.output);
    }
    if (result.error) {
      console.log(`  Error: ${result.error.message}`);
    }
  });

  // Execute hooks sequentially (slower, but output of hook N feeds into hook N+1)
  console.log('\nExecuting hooks sequentially...');
  const sequentialResults = await runner.executeHooksSequential(hooks, 'BeforeTool', input);

  console.log(
    `All hooks completed in ${sequentialResults.reduce((sum, r) => sum + r.duration, 0)}ms`
  );
}

executeHooksExample();
```

**Example explained:**

- Lines 4-15: Define hook configurations with different commands and timeouts
- Lines 17-22: Define input data that will be passed to hooks as JSON via stdin
- Lines 27-32: Execute hooks in parallel for maximum speed
- Lines 34-43: Process parallel results
- Lines 46-49: Execute hooks sequentially for ordered execution with input chaining
- Lines 51: Calculate total duration

### When to Use

**Use parallel execution when:**

- Hooks are independent and don't depend on each other's output
- Speed is critical
- Order of execution doesn't matter
- Hooks perform read-only operations

**Use sequential execution when:**

- Hook N needs output from hook N-1
- Order of execution matters
- Hooks modify shared state
- Debugging requires predictable execution order

**Use timeout handling when:**

- External commands may hang indefinitely
- Resource limits must be enforced
- Graceful shutdown is important

### Benefits

- **Robust Timeout**: Graceful SIGTERM followed by forceful SIGKILL
- **Error Isolation**: Individual hook failures don't affect others
- **Flexible Execution**: Support both parallel and sequential modes
- **Structured Output**: Consistent result format for all hooks
- **Input Chaining**: Sequential hooks can build on previous outputs
- **JSON I/O**: Structured data exchange with hooks

### Trade-offs

- **Process Overhead**: Spawning processes is expensive
- **Timeout Delay**: Graceful shutdown adds 5-second delay
- **Memory Usage**: Collecting full stdout/stderr in memory
- **Sequential Slowness**: Sequential execution is slower than parallel

### Common Mistakes

**Mistake 1: Not handling process timeout**

Bad example:

```typescript
const child = spawn(command);
// Process may run forever if command hangs
```

Correct approach:

```typescript
const child = spawn(command);
const timeoutHandle = setTimeout(() => {
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 5000);
}, timeout);

child.on('close', () => clearTimeout(timeoutHandle));
```

**Why this matters**: Without timeouts, hung processes can block execution indefinitely and leak resources.

**Mistake 2: Not catching hook execution errors**

Bad example:

```typescript
async executeHook(config, event, input) {
  return await this.executeCommandHook(config, event, input, Date.now());
  // Unhandled errors crash the application
}
```

Correct approach:

```typescript
async executeHook(config, event, input) {
  try {
    return await this.executeCommandHook(config, event, input, Date.now());
  } catch (error) {
    return {
      hookConfig: config,
      eventName: event,
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      duration: Date.now() - startTime,
    };
  }
}
```

**Why this matters**: Hook errors should be contained and reported, not crash the entire application.

### Testing Strategy

**What to Test:**

- Successful hook execution returns correct output
- Failed hooks return error result
- Timeout handling kills process correctly
- Parallel execution completes all hooks
- Sequential execution chains input correctly
- JSON parsing works for valid output
- Plain text fallback works for non-JSON output

**Test Organization:**

- Co-locate test: `hookRunner.ts` → `hookRunner.test.ts`
- Use temporary scripts for test hooks
- Test both success and failure paths

**Mock Strategy:**

- Create actual script files for integration testing
- Use short timeouts for faster tests
- Mock spawn for unit tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { HookRunner } from './hookRunner.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('HookRunner', () => {
  let hookRunner: HookRunner;
  let tempDir: string;
  let successScript: string;
  let failureScript: string;
  let timeoutScript: string;

  beforeEach(async () => {
    // Arrange - Create temp directory and test scripts
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hook-test-'));
    hookRunner = new HookRunner();

    // Success script that outputs JSON
    successScript = path.join(tempDir, 'success.sh');
    await fs.promises.writeFile(
      successScript,
      '#!/bin/bash\necho \'{"continue": true, "systemMessage": "Success"}\'',
      { mode: 0o755 }
    );

    // Failure script with non-zero exit
    failureScript = path.join(tempDir, 'failure.sh');
    await fs.promises.writeFile(failureScript, '#!/bin/bash\nexit 1', { mode: 0o755 });

    // Timeout script that sleeps forever
    timeoutScript = path.join(tempDir, 'timeout.sh');
    await fs.promises.writeFile(timeoutScript, '#!/bin/bash\nsleep 1000', { mode: 0o755 });
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  it('should execute successful hook and parse JSON output', async () => {
    // Arrange
    const hookConfig = {
      type: 'command' as const,
      command: successScript,
    };
    const input = { cwd: tempDir };

    // Act
    const result = await hookRunner.executeHook(hookConfig, 'BeforeTool', input);

    // Assert
    expect(result.success).to.be.true;
    expect(result.output).to.exist;
    expect(result.output?.continue).to.be.true;
    expect(result.output?.systemMessage).to.equal('Success');
  });

  it('should handle hook failure', async () => {
    // Arrange
    const hookConfig = {
      type: 'command' as const,
      command: failureScript,
    };
    const input = { cwd: tempDir };

    // Act
    const result = await hookRunner.executeHook(hookConfig, 'BeforeTool', input);

    // Assert
    expect(result.success).to.be.false;
    expect(result.exitCode).to.equal(1);
  });

  it('should timeout and kill hung process', async () => {
    // Arrange
    const hookConfig = {
      type: 'command' as const,
      command: timeoutScript,
      timeout: 1000, // 1 second timeout
    };
    const input = { cwd: tempDir };

    // Act
    const result = await hookRunner.executeHook(hookConfig, 'BeforeTool', input);

    // Assert
    expect(result.success).to.be.false;
    expect(result.error?.message).to.include('timed out');
    expect(result.duration).to.be.greaterThan(1000);
    expect(result.duration).to.be.lessThan(7000); // Timeout + grace period
  });

  it('should execute hooks in parallel', async () => {
    // Arrange
    const hooks = [
      { type: 'command' as const, command: successScript },
      { type: 'command' as const, command: successScript },
    ];
    const input = { cwd: tempDir };

    // Act
    const startTime = Date.now();
    const results = await hookRunner.executeHooksParallel(hooks, 'BeforeTool', input);
    const duration = Date.now() - startTime;

    // Assert
    expect(results).to.have.lengthOf(2);
    expect(results[0].success).to.be.true;
    expect(results[1].success).to.be.true;
    // Parallel execution should be faster than 2x sequential
    expect(duration).to.be.lessThan(results[0].duration + results[1].duration);
  });

  it('should execute hooks sequentially', async () => {
    // Arrange
    const hooks = [
      { type: 'command' as const, command: successScript },
      { type: 'command' as const, command: successScript },
    ];
    const input = { cwd: tempDir };

    // Act
    const results = await hookRunner.executeHooksSequential(hooks, 'BeforeTool', input);

    // Assert
    expect(results).to.have.lengthOf(2);
    expect(results[0].success).to.be.true;
    expect(results[1].success).to.be.true;
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 80%+ (cover timeout, success, failure paths)
- Function coverage: 90%+

### Related Patterns

- **[Process Management](./10-process-management.md#child-process-lifecycle)** - Child process spawning and lifecycle
- **[Timeout Pattern](./02-architectural-design-patterns.md#timeout-pattern)** - Graceful timeout handling
- **[Error Handling](./04-error-handling-patterns.md#error-recovery)** - Error isolation and recovery

---

## Pattern 3: Hook Planner with Matcher-Based Filtering

### Intent

Select matching hooks based on event context and create optimized execution plans with parallel or sequential execution strategy.

### Problem

Not all registered hooks should execute for every event. Hooks need context-aware filtering (e.g., only run for specific tools), deduplication to avoid running identical hooks multiple times, and intelligent execution strategy selection (parallel vs sequential) based on hook configuration.

### Solution

Implement a hook planner that retrieves hooks from the registry, filters by matcher patterns (regex or literal), deduplicates identical hooks, and determines execution strategy based on hook definitions.

### Structure

```typescript
// Hook selection and planning flow
HookPlanner
  ├── createExecutionPlan(event, context): HookExecutionPlan | null
  ├── matchesContext(entry, context): boolean
  ├── matchesToolName(matcher, toolName): boolean
  └── deduplicateHooks(entries): HookRegistryEntry[]

HookExecutionPlan
  ├── eventName: HookEventName
  ├── hookConfigs: HookConfig[]
  └── sequential: boolean
```

### Implementation

**Step 1: Define Hook Execution Plan Structure**

```typescript
/**
 * Hook execution plan
 */
export interface HookExecutionPlan {
  eventName: HookEventName;
  hookConfigs: HookConfig[];
  sequential: boolean;
}

/**
 * Context information for hook event matching
 */
export interface HookEventContext {
  toolName?: string;
  trigger?: string;
}
```

**Step 2: Implement Hook Planner with Matcher Logic**

```typescript
import type { HookRegistry, HookRegistryEntry } from './hookRegistry.js';
import type { HookEventName, HookConfig } from './types.js';

export class HookPlanner {
  private readonly hookRegistry: HookRegistry;

  constructor(hookRegistry: HookRegistry) {
    this.hookRegistry = hookRegistry;
  }

  /**
   * Create execution plan for a hook event
   */
  createExecutionPlan(
    eventName: HookEventName,
    context?: HookEventContext
  ): HookExecutionPlan | null {
    const hookEntries = this.hookRegistry.getHooksForEvent(eventName);

    if (hookEntries.length === 0) {
      return null;
    }

    // Filter hooks by matcher
    const matchingEntries = hookEntries.filter((entry) => this.matchesContext(entry, context));

    if (matchingEntries.length === 0) {
      return null;
    }

    // Deduplicate identical hooks
    const deduplicatedEntries = this.deduplicateHooks(matchingEntries);

    // Extract hook configs
    const hookConfigs = deduplicatedEntries.map((entry) => entry.config);

    // Determine execution strategy - if ANY hook definition has sequential=true, run all sequentially
    const sequential = deduplicatedEntries.some((entry) => entry.sequential === true);

    const plan: HookExecutionPlan = {
      eventName,
      hookConfigs,
      sequential,
    };

    console.log(
      `Created execution plan for ${eventName}: ${hookConfigs.length} hook(s) to execute ${sequential ? 'sequentially' : 'in parallel'}`
    );

    return plan;
  }

  /**
   * Check if a hook entry matches the given context
   */
  private matchesContext(entry: HookRegistryEntry, context?: HookEventContext): boolean {
    if (!entry.matcher || !context) {
      return true; // No matcher means match all
    }

    const matcher = entry.matcher.trim();

    if (matcher === '' || matcher === '*') {
      return true; // Empty string or wildcard matches all
    }

    // For tool events, match against tool name
    if (context.toolName) {
      return this.matchesToolName(matcher, context.toolName);
    }

    return true;
  }

  /**
   * Match tool name against matcher pattern
   */
  private matchesToolName(matcher: string, toolName: string): boolean {
    try {
      // Attempt to treat the matcher as a regular expression
      const regex = new RegExp(matcher);
      return regex.test(toolName);
    } catch {
      // If it's not a valid regex, treat it as a literal string for exact match
      return matcher === toolName;
    }
  }

  /**
   * Deduplicate identical hook configurations
   */
  private deduplicateHooks(entries: HookRegistryEntry[]): HookRegistryEntry[] {
    const seen = new Set<string>();
    const deduplicated: HookRegistryEntry[] = [];

    for (const entry of entries) {
      const key = this.getHookKey(entry);

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(entry);
      }
    }

    return deduplicated;
  }

  /**
   * Get unique key for hook entry
   */
  private getHookKey(entry: HookRegistryEntry): string {
    return `${entry.eventName}-${entry.config.type}-${entry.config.command}`;
  }
}
```

### Complete Example

```typescript
import { HookPlanner } from './hookPlanner.js';
import { HookRegistry } from './hookRegistry.js';
import type { Config } from '../config/config.js';

async function planHookExecution(config: Config) {
  // Initialize registry and planner
  const hookRegistry = new HookRegistry(config);
  await hookRegistry.initialize();

  const hookPlanner = new HookPlanner(hookRegistry);

  // Example 1: Plan for BeforeTool event with specific tool
  const plan1 = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'readFile' });

  if (plan1) {
    console.log(`Execution plan for BeforeTool on readFile:`);
    console.log(`  Hooks to execute: ${plan1.hookConfigs.length}`);
    console.log(`  Execution mode: ${plan1.sequential ? 'sequential' : 'parallel'}`);
  } else {
    console.log('No hooks matched for BeforeTool on readFile');
  }

  // Example 2: Plan for BeforeTool event with different tool
  const plan2 = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'writeFile' });

  if (plan2) {
    console.log(`\nExecution plan for BeforeTool on writeFile:`);
    console.log(`  Hooks to execute: ${plan2.hookConfigs.length}`);
  }

  // Example 3: Plan for SessionStart event (no context needed)
  const plan3 = hookPlanner.createExecutionPlan('SessionStart');

  if (plan3) {
    console.log(`\nExecution plan for SessionStart:`);
    console.log(`  Hooks to execute: ${plan3.hookConfigs.length}`);
  }

  // Example 4: Demonstrate matcher patterns
  console.log('\nMatcher examples:');
  console.log(
    'Matcher "read.*" matches "readFile":',
    hookPlanner['matchesToolName']('read.*', 'readFile')
  );
  console.log(
    'Matcher "write.*" matches "readFile":',
    hookPlanner['matchesToolName']('write.*', 'readFile')
  );
  console.log(
    'Matcher "readFile" matches "readFile":',
    hookPlanner['matchesToolName']('readFile', 'readFile')
  );
}
```

**Example explained:**

- Lines 4-10: Initialize hook registry and planner
- Lines 12-24: Create execution plan for specific tool, check if hooks matched
- Lines 26-32: Create plan for different tool, may have different hooks
- Lines 34-39: Create plan for event without context (all hooks match)
- Lines 41-47: Demonstrate regex and literal matching

### When to Use

**Use matcher-based filtering when:**

- Hooks should only run for specific tools or contexts
- Regex patterns provide flexible matching
- Same hook registry serves multiple event types
- Context-aware execution is required

**Use deduplication when:**

- Multiple sources may register identical hooks
- Extensions can duplicate project hooks
- Execution order doesn't matter for duplicates

**Use sequential flag when:**

- Some hooks must run in order
- Hook output affects subsequent hooks
- Debugging requires predictable order

### Benefits

- **Flexible Matching**: Regex patterns for powerful filtering
- **Context-Aware**: Hooks run only when context matches
- **Deduplication**: Automatic removal of duplicate hooks
- **Execution Strategy**: Automatic parallel vs sequential selection
- **Performance**: Skip hooks that don't match context

### Trade-offs

- **Regex Complexity**: Complex patterns can be hard to understand
- **Fallback Logic**: Literal string fallback adds complexity
- **Deduplication Cost**: Requires key generation and set operations
- **Sequential Override**: Single sequential flag affects all hooks

### Common Mistakes

**Mistake 1: Not handling invalid regex patterns**

Bad example:

```typescript
private matchesToolName(matcher: string, toolName: string): boolean {
  const regex = new RegExp(matcher);
  return regex.test(toolName);
  // Throws error if matcher is invalid regex
}
```

Correct approach:

```typescript
private matchesToolName(matcher: string, toolName: string): boolean {
  try {
    const regex = new RegExp(matcher);
    return regex.test(toolName);
  } catch {
    // Fallback to literal string matching
    return matcher === toolName;
  }
}
```

**Why this matters**: Users may provide invalid regex patterns. Fallback to literal matching provides better UX.

**Mistake 2: Not deduplicating hooks**

Bad example:

```typescript
createExecutionPlan(eventName, context) {
  const matchingEntries = hookEntries.filter((entry) =>
    this.matchesContext(entry, context),
  );
  // May contain duplicates from different sources
  const hookConfigs = matchingEntries.map((entry) => entry.config);
  return { eventName, hookConfigs, sequential: false };
}
```

Correct approach:

```typescript
createExecutionPlan(eventName, context) {
  const matchingEntries = hookEntries.filter((entry) =>
    this.matchesContext(entry, context),
  );
  const deduplicatedEntries = this.deduplicateHooks(matchingEntries);
  const hookConfigs = deduplicatedEntries.map((entry) => entry.config);
  return { eventName, hookConfigs, sequential: false };
}
```

**Why this matters**: Without deduplication, the same hook may execute multiple times, wasting resources.

### Testing Strategy

**What to Test:**

- Hooks with matching matchers are included in plan
- Hooks with non-matching matchers are excluded
- Wildcard matcher matches all contexts
- Empty context matches all hooks
- Deduplication removes identical hooks
- Sequential flag is correctly determined
- Invalid regex patterns fall back to literal matching

**Test Organization:**

- Co-locate test: `hookPlanner.ts` → `hookPlanner.test.ts`
- Mock HookRegistry with test hooks
- Test various matcher patterns

**Mock Strategy:**

- Create mock HookRegistry with controlled entries
- Use real HookPlanner implementation
- Test all matcher types (regex, literal, wildcard)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { HookPlanner } from './hookPlanner.js';
import type { HookRegistry, HookRegistryEntry } from './hookRegistry.js';
import { ConfigSource } from './hookRegistry.js';

describe('HookPlanner', () => {
  let hookPlanner: HookPlanner;
  let mockRegistry: HookRegistry;

  beforeEach(() => {
    // Arrange - Create mock registry with test hooks
    const testEntries: HookRegistryEntry[] = [
      {
        config: { type: 'command', command: 'hook1.sh' },
        source: ConfigSource.Project,
        eventName: 'BeforeTool',
        matcher: 'read.*',
        sequential: false,
        enabled: true,
      },
      {
        config: { type: 'command', command: 'hook2.sh' },
        source: ConfigSource.Project,
        eventName: 'BeforeTool',
        matcher: 'writeFile',
        sequential: false,
        enabled: true,
      },
      {
        config: { type: 'command', command: 'hook3.sh' },
        source: ConfigSource.Project,
        eventName: 'BeforeTool',
        matcher: '*',
        sequential: true,
        enabled: true,
      },
    ];

    mockRegistry = {
      getHooksForEvent: (eventName) => {
        return testEntries.filter((e) => e.eventName === eventName);
      },
    } as unknown as HookRegistry;

    hookPlanner = new HookPlanner(mockRegistry);
  });

  it('should match hooks with regex pattern', () => {
    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'readFile' });

    // Assert
    expect(plan).to.exist;
    expect(plan!.hookConfigs).to.have.lengthOf(2); // read.* and * matchers
    expect(plan!.hookConfigs.some((c) => c.command === 'hook1.sh')).to.be.true;
    expect(plan!.hookConfigs.some((c) => c.command === 'hook3.sh')).to.be.true;
  });

  it('should match hooks with literal string', () => {
    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'writeFile' });

    // Assert
    expect(plan).to.exist;
    expect(plan!.hookConfigs).to.have.lengthOf(2); // writeFile and * matchers
    expect(plan!.hookConfigs.some((c) => c.command === 'hook2.sh')).to.be.true;
    expect(plan!.hookConfigs.some((c) => c.command === 'hook3.sh')).to.be.true;
  });

  it('should match all hooks with wildcard', () => {
    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'anyTool' });

    // Assert
    expect(plan).to.exist;
    expect(plan!.hookConfigs).to.have.lengthOf(1); // Only * matcher
    expect(plan!.hookConfigs[0].command).to.equal('hook3.sh');
  });

  it('should set sequential flag if any hook requires it', () => {
    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'readFile' });

    // Assert - hook3 has sequential=true, so plan should be sequential
    expect(plan).to.exist;
    expect(plan!.sequential).to.be.true;
  });

  it('should return null when no hooks match', () => {
    // Arrange - Empty registry
    mockRegistry = {
      getHooksForEvent: () => [],
    } as unknown as HookRegistry;
    hookPlanner = new HookPlanner(mockRegistry);

    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool', { toolName: 'readFile' });

    // Assert
    expect(plan).to.be.null;
  });

  it('should deduplicate identical hooks', () => {
    // Arrange - Add duplicate hook
    const duplicateEntries: HookRegistryEntry[] = [
      {
        config: { type: 'command', command: 'hook1.sh' },
        source: ConfigSource.Project,
        eventName: 'BeforeTool',
        matcher: '*',
        sequential: false,
        enabled: true,
      },
      {
        config: { type: 'command', command: 'hook1.sh' },
        source: ConfigSource.Extensions,
        eventName: 'BeforeTool',
        matcher: '*',
        sequential: false,
        enabled: true,
      },
    ];

    mockRegistry = {
      getHooksForEvent: () => duplicateEntries,
    } as unknown as HookRegistry;
    hookPlanner = new HookPlanner(mockRegistry);

    // Act
    const plan = hookPlanner.createExecutionPlan('BeforeTool');

    // Assert - Should only have one hook despite two entries
    expect(plan).to.exist;
    expect(plan!.hookConfigs).to.have.lengthOf(1);
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 80%+ (cover all matcher types)
- Function coverage: 90%+

### Related Patterns

- **[Strategy Pattern](./02-architectural-design-patterns.md#strategy-pattern)** - Execution strategy selection
- **[Matcher Pattern](./02-architectural-design-patterns.md#matcher-pattern)** - Regex-based filtering
- **[Registry Pattern](./02-architectural-design-patterns.md#registry-pattern)** - Hook registry integration

---

## Pattern 4: Hook Aggregator with Event-Specific Strategies

### Intent

Aggregate results from multiple hook executions using event-specific merging strategies to produce a single actionable outcome.

### Problem

When multiple hooks execute for the same event, their outputs must be combined intelligently. Different events require different aggregation strategies: some use OR logic for blocking decisions, others use field replacement, and some need custom merging. The aggregator must handle conflicting outputs, preserve all individual results for debugging, and produce a single clear outcome.

### Solution

Implement a hook aggregator that collects all execution results, applies event-specific merging strategies, handles errors gracefully, and returns both aggregated output and individual results.

### Structure

```typescript
// Hook result aggregation flow
HookAggregator
  └── aggregateResults(results, event): AggregatedHookResult
        ├── mergeOutputs(outputs, event): HookOutput
        │     ├── mergeWithOrDecision() // For Before/After events
        │     ├── mergeWithFieldReplacement() // For Model events
        │     └── mergeToolSelectionOutputs() // For ToolSelection
        └── createSpecificHookOutput() // Type-safe output

AggregatedHookResult
  ├── success: boolean
  ├── finalOutput?: HookOutput
  ├── allOutputs: HookOutput[]
  ├── errors: Error[]
  └── totalDuration: number
```

### Implementation

**Step 1: Define Aggregated Result Structure**

```typescript
/**
 * Aggregated result from multiple hook executions
 */
export interface AggregatedHookResult {
  success: boolean;
  finalOutput?: HookOutput;
  allOutputs: HookOutput[];
  errors: Error[];
  totalDuration: number;
}
```

**Step 2: Implement Hook Aggregator with Event-Specific Strategies**

```typescript
import type { HookExecutionResult, HookOutput, HookEventName } from './types.js';

export class HookAggregator {
  /**
   * Aggregate results from multiple hook executions
   */
  aggregateResults(results: HookExecutionResult[], eventName: HookEventName): AggregatedHookResult {
    const allOutputs: HookOutput[] = [];
    const errors: Error[] = [];
    let totalDuration = 0;

    // Collect all outputs and errors
    for (const result of results) {
      totalDuration += result.duration;

      if (result.error) {
        errors.push(result.error);
      }

      if (result.output) {
        allOutputs.push(result.output);
      }
    }

    // Merge outputs using event-specific strategy
    const mergedOutput = this.mergeOutputs(allOutputs, eventName);
    const finalOutput = mergedOutput
      ? this.createSpecificHookOutput(mergedOutput, eventName)
      : undefined;

    return {
      success: errors.length === 0,
      finalOutput,
      allOutputs,
      errors,
      totalDuration,
    };
  }

  /**
   * Merge hook outputs using event-specific strategies
   */
  private mergeOutputs(outputs: HookOutput[], eventName: HookEventName): HookOutput | undefined {
    if (outputs.length === 0) {
      return undefined;
    }

    switch (eventName) {
      case 'BeforeTool':
      case 'AfterTool':
      case 'BeforeAgent':
      case 'AfterAgent':
      case 'SessionStart':
        return this.mergeWithOrDecision(outputs);

      case 'BeforeModel':
      case 'AfterModel':
        return this.mergeWithFieldReplacement(outputs);

      case 'BeforeToolSelection':
        return this.mergeToolSelectionOutputs(outputs);

      default:
        return this.mergeSimple(outputs);
    }
  }

  /**
   * Merge outputs with OR decision logic and message concatenation
   * Used for events where any hook can block execution
   */
  private mergeWithOrDecision(outputs: HookOutput[]): HookOutput {
    const merged: HookOutput = {
      continue: true,
      suppressOutput: false,
    };

    const messages: string[] = [];
    const reasons: string[] = [];
    const systemMessages: string[] = [];

    let hasBlockDecision = false;
    let hasContinueFalse = false;

    for (const output of outputs) {
      // Handle continue flag - any false means don't continue
      if (output.continue === false) {
        hasContinueFalse = true;
        merged.continue = false;
        if (output.stopReason) {
          messages.push(output.stopReason);
        }
      }

      // Handle decision (OR logic for blocking)
      if (output.decision === 'block') {
        hasBlockDecision = true;
        merged.decision = 'block';
      } else if (output.decision === 'ask' && !hasBlockDecision) {
        merged.decision = 'ask';
      }

      // Collect messages
      if (output.reason) {
        reasons.push(output.reason);
      }

      if (output.systemMessage) {
        systemMessages.push(output.systemMessage);
      }

      if (output.suppressOutput) {
        merged.suppressOutput = true;
      }
    }

    // Set final decision if no blocking decision was found
    if (!hasBlockDecision && !hasContinueFalse) {
      merged.decision = 'allow';
    }

    // Merge messages with newline separation
    if (reasons.length > 0) {
      merged.reason = reasons.join('\n');
    }

    if (systemMessages.length > 0) {
      merged.systemMessage = systemMessages.join('\n');
    }

    return merged;
  }

  /**
   * Merge outputs with later fields replacing earlier fields
   * Used for events where hook order matters
   */
  private mergeWithFieldReplacement(outputs: HookOutput[]): HookOutput {
    let merged: HookOutput = {};

    for (const output of outputs) {
      // Later outputs override earlier ones
      merged = {
        ...merged,
        ...output,
        hookSpecificOutput: {
          ...merged.hookSpecificOutput,
          ...output.hookSpecificOutput,
        },
      };
    }

    return merged;
  }

  /**
   * Merge tool selection outputs
   * Combines tool lists and preferences
   */
  private mergeToolSelectionOutputs(outputs: HookOutput[]): HookOutput {
    const merged: HookOutput = {
      hookSpecificOutput: {
        preferredTools: [] as string[],
        excludedTools: [] as string[],
      },
    };

    for (const output of outputs) {
      if (output.hookSpecificOutput) {
        if (output.hookSpecificOutput.preferredTools) {
          const preferred = merged.hookSpecificOutput!.preferredTools as string[];
          preferred.push(...(output.hookSpecificOutput.preferredTools as string[]));
        }
        if (output.hookSpecificOutput.excludedTools) {
          const excluded = merged.hookSpecificOutput!.excludedTools as string[];
          excluded.push(...(output.hookSpecificOutput.excludedTools as string[]));
        }
      }
    }

    return merged;
  }

  /**
   * Simple merge - just use the last output
   */
  private mergeSimple(outputs: HookOutput[]): HookOutput {
    return outputs[outputs.length - 1];
  }

  /**
   * Create event-specific typed output
   */
  private createSpecificHookOutput(merged: HookOutput, eventName: HookEventName): HookOutput {
    // Return merged output with event-specific typing
    return merged;
  }
}
```

### Complete Example

```typescript
import { HookAggregator } from './hookAggregator.js';
import type { HookExecutionResult } from './types.js';

// Example: Aggregate results from BeforeTool hooks
async function aggregateBeforeToolHooks() {
  const aggregator = new HookAggregator();

  // Simulate multiple hook execution results
  const results: HookExecutionResult[] = [
    {
      hookConfig: { type: 'command', command: 'validate.sh' },
      eventName: 'BeforeTool',
      success: true,
      output: {
        continue: true,
        systemMessage: 'Validation passed',
      },
      duration: 150,
    },
    {
      hookConfig: { type: 'command', command: 'security-check.sh' },
      eventName: 'BeforeTool',
      success: true,
      output: {
        continue: false,
        stopReason: 'Security policy violation',
        decision: 'block',
      },
      duration: 200,
    },
    {
      hookConfig: { type: 'command', command: 'log.sh' },
      eventName: 'BeforeTool',
      success: true,
      output: {
        continue: true,
        systemMessage: 'Tool usage logged',
      },
      duration: 50,
    },
  ];

  // Aggregate results
  const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

  console.log('Aggregation Results:');
  console.log(`Success: ${aggregated.success}`);
  console.log(`Total Duration: ${aggregated.totalDuration}ms`);
  console.log(`Errors: ${aggregated.errors.length}`);

  if (aggregated.finalOutput) {
    console.log('\nFinal Output:');
    console.log(`  Continue: ${aggregated.finalOutput.continue}`);
    console.log(`  Decision: ${aggregated.finalOutput.decision}`);
    console.log(`  Stop Reason: ${aggregated.finalOutput.stopReason}`);
    console.log(`  System Message: ${aggregated.finalOutput.systemMessage}`);
  }

  console.log(`\nIndividual Outputs: ${aggregated.allOutputs.length}`);
  aggregated.allOutputs.forEach((output, index) => {
    console.log(`  ${index + 1}. continue=${output.continue}, message="${output.systemMessage}"`);
  });

  // Decision: Since one hook blocked, execution should not continue
  if (aggregated.finalOutput?.continue === false) {
    console.log('\nExecution blocked by hook');
    console.log(`Reason: ${aggregated.finalOutput.stopReason}`);
  }
}

aggregateBeforeToolHooks();
```

**Example explained:**

- Lines 4-40: Simulate three hook execution results with different outputs
- Lines 42-43: Aggregate results using event-specific strategy (OR decision for BeforeTool)
- Lines 45-63: Display aggregation results including final decision and individual outputs
- Lines 65-69: Check final decision - execution blocked because one hook returned `continue: false` with `decision: 'block'`

### When to Use

**Use OR decision merging when:**

- Any hook should be able to block execution
- Multiple hooks can contribute messages
- Hooks are validation or security checks

**Use field replacement merging when:**

- Hook order matters
- Later hooks should override earlier hooks
- Hooks modify request/response structures

**Use custom merging when:**

- Event has unique aggregation requirements
- Hooks contribute to collections (lists, sets)
- Complex combining logic is needed

### Benefits

- **Event-Specific**: Each event type uses appropriate merging strategy
- **Debugging Support**: Preserves all individual outputs
- **Clear Outcomes**: Single finalOutput for easy consumption
- **Error Tracking**: Collects all errors for comprehensive reporting
- **Performance Metrics**: Total duration across all hooks

### Trade-offs

- **Complexity**: Multiple merging strategies add complexity
- **Memory**: Stores all outputs in memory
- **Strategy Selection**: Must maintain event-to-strategy mapping
- **Type Safety**: Merged output loses some type specificity

### Common Mistakes

**Mistake 1: Not handling OR logic correctly**

Bad example:

```typescript
private mergeWithOrDecision(outputs: HookOutput[]): HookOutput {
  let continue = true;
  for (const output of outputs) {
    continue = output.continue ?? true;
    // Last hook wins, not OR logic
  }
  return { continue };
}
```

Correct approach:

```typescript
private mergeWithOrDecision(outputs: HookOutput[]): HookOutput {
  const merged = { continue: true };
  for (const output of outputs) {
    if (output.continue === false) {
      merged.continue = false; // Any false means false
    }
  }
  return merged;
}
```

**Why this matters**: For blocking decisions, any hook should be able to block execution, not just the last one.

**Mistake 2: Losing individual outputs**

Bad example:

```typescript
aggregateResults(results, eventName) {
  const merged = this.mergeOutputs(results.map((r) => r.output!), eventName);
  return { success: true, finalOutput: merged };
  // Individual outputs lost
}
```

Correct approach:

```typescript
aggregateResults(results, eventName) {
  const allOutputs = results.map((r) => r.output!).filter(Boolean);
  const merged = this.mergeOutputs(allOutputs, eventName);
  return {
    success: true,
    finalOutput: merged,
    allOutputs, // Preserve for debugging
  };
}
```

**Why this matters**: Individual outputs are valuable for debugging and understanding why aggregation produced a specific result.

### Testing Strategy

**What to Test:**

- OR decision merging blocks when any hook blocks
- Field replacement uses last hook's values
- Custom merging combines lists correctly
- Messages are concatenated with newlines
- Total duration sums all individual durations
- Errors are collected from failed hooks
- Empty outputs array returns undefined

**Test Organization:**

- Co-locate test: `hookAggregator.ts` → `hookAggregator.test.ts`
- Test each merging strategy separately
- Test edge cases (empty, single output)

**Mock Strategy:**

- Create mock HookExecutionResult objects
- Use real HookAggregator implementation
- Test all event types

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { HookAggregator } from './hookAggregator.js';
import type { HookExecutionResult } from './types.js';

describe('HookAggregator', () => {
  let aggregator: HookAggregator;

  beforeEach(() => {
    aggregator = new HookAggregator();
  });

  describe('mergeWithOrDecision', () => {
    it('should block when any hook blocks', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: { continue: true },
          duration: 100,
        },
        {
          hookConfig: { type: 'command', command: 'hook2.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: { continue: false, decision: 'block', stopReason: 'Blocked' },
          duration: 100,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

      // Assert
      expect(aggregated.finalOutput?.continue).to.be.false;
      expect(aggregated.finalOutput?.decision).to.equal('block');
      expect(aggregated.finalOutput?.stopReason).to.equal('Blocked');
    });

    it('should concatenate system messages', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: { systemMessage: 'Message 1' },
          duration: 100,
        },
        {
          hookConfig: { type: 'command', command: 'hook2.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: { systemMessage: 'Message 2' },
          duration: 100,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

      // Assert
      expect(aggregated.finalOutput?.systemMessage).to.equal('Message 1\nMessage 2');
    });
  });

  describe('mergeWithFieldReplacement', () => {
    it('should use last hook values', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeModel',
          success: true,
          output: {
            hookSpecificOutput: { model: 'gpt-3.5-turbo' },
          },
          duration: 100,
        },
        {
          hookConfig: { type: 'command', command: 'hook2.sh' },
          eventName: 'BeforeModel',
          success: true,
          output: {
            hookSpecificOutput: { model: 'gpt-4' },
          },
          duration: 100,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeModel');

      // Assert - Second hook's value should win
      expect(aggregated.finalOutput?.hookSpecificOutput?.model).to.equal('gpt-4');
    });
  });

  describe('error handling', () => {
    it('should collect all errors', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeTool',
          success: false,
          error: new Error('Error 1'),
          duration: 100,
        },
        {
          hookConfig: { type: 'command', command: 'hook2.sh' },
          eventName: 'BeforeTool',
          success: false,
          error: new Error('Error 2'),
          duration: 100,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

      // Assert
      expect(aggregated.success).to.be.false;
      expect(aggregated.errors).to.have.lengthOf(2);
      expect(aggregated.errors[0].message).to.equal('Error 1');
      expect(aggregated.errors[1].message).to.equal('Error 2');
    });

    it('should calculate total duration', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: {},
          duration: 150,
        },
        {
          hookConfig: { type: 'command', command: 'hook2.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: {},
          duration: 250,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

      // Assert
      expect(aggregated.totalDuration).to.equal(400);
    });
  });

  describe('edge cases', () => {
    it('should handle empty results', () => {
      // Act
      const aggregated = aggregator.aggregateResults([], 'BeforeTool');

      // Assert
      expect(aggregated.success).to.be.true;
      expect(aggregated.finalOutput).to.be.undefined;
      expect(aggregated.allOutputs).to.have.lengthOf(0);
      expect(aggregated.totalDuration).to.equal(0);
    });

    it('should handle single result', () => {
      // Arrange
      const results: HookExecutionResult[] = [
        {
          hookConfig: { type: 'command', command: 'hook1.sh' },
          eventName: 'BeforeTool',
          success: true,
          output: { continue: true, systemMessage: 'Single' },
          duration: 100,
        },
      ];

      // Act
      const aggregated = aggregator.aggregateResults(results, 'BeforeTool');

      // Assert
      expect(aggregated.finalOutput?.systemMessage).to.equal('Single');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 80%+ (cover all merging strategies)
- Function coverage: 90%+

### Related Patterns

- **[Strategy Pattern](./02-architectural-design-patterns.md#strategy-pattern)** - Event-specific merging strategies
- **[Reduce Pattern](./02-architectural-design-patterns.md#reduce-pattern)** - Combining multiple values into one
- **[Error Aggregation](./04-error-handling-patterns.md#error-aggregation)** - Collecting multiple errors

---

## Pattern 5: Extension Loader with Lifecycle Management

### Intent

Provide abstract base class for extension lifecycle management with well-defined start/stop hooks and event emission for UI updates.

### Problem

Extensions need consistent lifecycle management (load, start, stop, restart) across different extension sources. Extension loading can be expensive, so progress tracking via events is important for UI responsiveness. Extensions may depend on other system components (MCP clients, tool registries), requiring coordinated initialization. The loader must support both full initialization (on app start) and dynamic loading (during runtime).

### Solution

Implement an abstract ExtensionLoader base class with template methods for lifecycle hooks, event emission for progress tracking, and coordination with dependent systems. Concrete subclasses implement extension discovery and storage while inheriting lifecycle management.

### Structure

```typescript
// Extension lifecycle flow
ExtensionLoader (abstract)
  ├── start(config): Promise<void>
  │     └── startExtension(extension) for each active
  ├── startExtension(extension)
  │     ├── Start MCP servers
  │     ├── Refresh tools
  │     └── Refresh context
  ├── stopExtension(extension)
  │     ├── Stop MCP servers
  │     └── Refresh tools
  ├── restartExtension(extension)
  │     ├── stopExtension()
  │     └── startExtension()
  └── maybeStart/StopExtension() // Only if reloading enabled

  // Subclasses implement
  ├── getExtensions(): Extension[]
```

### Implementation

**Step 1: Define Extension Structure**

```typescript
/**
 * All information required to handle an extension
 */
export interface Extension {
  name: string;
  version: string;
  isActive: boolean;
  path: string;
  contextFiles: string[];
  mcpServers?: Record<string, MCPServerConfig>;
  hooks?: { [K in HookEventName]?: HookDefinition[] };
  id: string;
}

/**
 * Extension events for UI progress tracking
 */
export interface ExtensionEvents {
  extensionsStarting: ExtensionsStartingEvent[];
  extensionsStopping: ExtensionsStoppingEvent[];
}

export interface ExtensionsStartingEvent {
  total: number;
  completed: number;
}

export interface ExtensionsStoppingEvent {
  total: number;
  completed: number;
}
```

**Step 2: Implement Abstract Extension Loader**

```typescript
import type { Config } from '../config/config.js';
import type { EventEmitter } from 'node:events';

export abstract class ExtensionLoader {
  // Assigned in `start`
  protected config: Config | undefined;

  // Track starting and stopping counts
  protected startingCount: number = 0;
  protected startCompletedCount: number = 0;
  protected stoppingCount: number = 0;
  protected stopCompletedCount: number = 0;

  private isStarting: boolean = false;

  constructor(private readonly eventEmitter?: EventEmitter<ExtensionEvents>) {}

  /**
   * All currently known extensions, both active and inactive
   * Subclasses must implement
   */
  abstract getExtensions(): Extension[];

  /**
   * Fully initializes all active extensions
   * Called within Config.initialize
   */
  async start(config: Config): Promise<void> {
    this.isStarting = true;
    try {
      if (!this.config) {
        this.config = config;
      } else {
        throw new Error('Already started, you may only call `start` once.');
      }

      // Start all active extensions in parallel
      await Promise.all(
        this.getExtensions()
          .filter((e) => e.isActive)
          .map(this.startExtension.bind(this))
      );
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Unconditionally starts an extension and loads all its resources
   */
  protected async startExtension(extension: Extension): Promise<void> {
    if (!this.config) {
      throw new Error('Cannot call `startExtension` prior to calling `start`.');
    }

    this.startingCount++;
    this.eventEmitter?.emit('extensionsStarting', {
      total: this.startingCount,
      completed: this.startCompletedCount,
    });

    try {
      // Start MCP servers for this extension
      await this.config.getMcpClientManager()!.startExtension(extension);

      // Refresh tool registry with new tools
      await this.maybeRefreshTools(extension);
    } finally {
      this.startCompletedCount++;
      this.eventEmitter?.emit('extensionsStarting', {
        total: this.startingCount,
        completed: this.startCompletedCount,
      });

      // Reset counters when all done
      if (this.startingCount === this.startCompletedCount) {
        this.startingCount = 0;
        this.startCompletedCount = 0;
      }

      // Refresh context after all extensions loaded
      await this.maybeRefreshContext();
    }
  }

  /**
   * Unconditionally stops an extension and unloads all its resources
   */
  protected async stopExtension(extension: Extension): Promise<void> {
    if (!this.config) {
      throw new Error('Cannot call `stopExtension` prior to calling `start`.');
    }

    this.stoppingCount++;
    this.eventEmitter?.emit('extensionsStopping', {
      total: this.stoppingCount,
      completed: this.stopCompletedCount,
    });

    try {
      // Stop MCP servers for this extension
      await this.config.getMcpClientManager()!.stopExtension(extension);

      // Refresh tool registry (remove tools from this extension)
      await this.maybeRefreshTools(extension);
    } finally {
      this.stopCompletedCount++;
      this.eventEmitter?.emit('extensionsStopping', {
        total: this.stoppingCount,
        completed: this.stopCompletedCount,
      });

      // Reset counters when all done
      if (this.stoppingCount === this.stopCompletedCount) {
        this.stoppingCount = 0;
        this.stopCompletedCount = 0;
      }

      // Refresh context after all extensions unloaded
      await this.maybeRefreshContext();
    }
  }

  /**
   * If extension reloading is enabled, starts the extension
   */
  protected maybeStartExtension(extension: Extension): Promise<void> | undefined {
    if (this.config && this.config.getEnableExtensionReloading()) {
      return this.startExtension(extension);
    }
    return;
  }

  /**
   * If extension reloading is enabled, stops the extension
   */
  protected maybeStopExtension(extension: Extension): Promise<void> | undefined {
    if (this.config && this.config.getEnableExtensionReloading()) {
      return this.stopExtension(extension);
    }
    return;
  }

  /**
   * Restart an extension (stop then start)
   */
  async restartExtension(extension: Extension): Promise<void> {
    await this.stopExtension(extension);
    await this.startExtension(extension);
  }

  /**
   * Refresh tool registry if needed
   */
  private async maybeRefreshTools(extension: Extension): Promise<void> {
    const client = this.config?.getClient();
    if (client?.isInitialized()) {
      await client.setTools();
    }
  }

  /**
   * Refresh context/memory if needed
   */
  private async maybeRefreshContext(): Promise<void> {
    // Refresh context after all extensions are done loading/unloading
    const client = this.config?.getClient();
    if (client?.isInitialized()) {
      await client.refreshContext();
    }
  }
}
```

### Complete Example

```typescript
import { ExtensionLoader, Extension, ExtensionEvents } from './extensionLoader.js';
import { EventEmitter } from 'node:events';
import type { Config } from '../config/config.js';

// Concrete implementation of ExtensionLoader
class SimpleExtensionLoader extends ExtensionLoader {
  private extensions: Extension[] = [];

  constructor(eventEmitter?: EventEmitter<ExtensionEvents>) {
    super(eventEmitter);
  }

  // Load extensions from directory
  async loadExtensions(extensionsDir: string): Promise<void> {
    // Implementation would scan directory and load extension configs
    this.extensions = [
      {
        name: 'example-extension',
        version: '1.0.0',
        isActive: true,
        path: '/path/to/extension',
        contextFiles: ['context.md'],
        id: 'example-extension',
      },
    ];
  }

  // Implement abstract method
  getExtensions(): Extension[] {
    return this.extensions;
  }
}

// Usage example
async function initializeExtensions(config: Config) {
  // Create event emitter for progress tracking
  const eventEmitter = new EventEmitter<ExtensionEvents>();

  // Listen to extension loading events
  eventEmitter.on('extensionsStarting', (event) => {
    console.log(`Loading extensions: ${event.completed}/${event.total}`);
  });

  eventEmitter.on('extensionsStopping', (event) => {
    console.log(`Stopping extensions: ${event.completed}/${event.total}`);
  });

  // Create loader
  const loader = new SimpleExtensionLoader(eventEmitter);

  // Load extension definitions
  await loader.loadExtensions('/path/to/extensions');

  // Start all active extensions
  await loader.start(config);
  console.log('All extensions loaded');

  // Later: restart an extension
  const extension = loader.getExtensions()[0];
  await loader.restartExtension(extension);
  console.log(`Extension ${extension.name} restarted`);
}
```

**Example explained:**

- Lines 4-27: Concrete subclass implements getExtensions() and loadExtensions()
- Lines 30-42: Create event emitter and listen to progress events
- Lines 44-48: Create loader and load extension definitions
- Lines 50-52: Start all active extensions (loads MCP servers, refreshes tools)
- Lines 54-56: Demonstrate restarting an extension dynamically

### When to Use

**Use this pattern when:**

- Multiple extension sources need consistent lifecycle management
- Progress tracking is important for UI responsiveness
- Extensions integrate with multiple system components
- Dynamic loading/unloading is required
- Coordinated initialization is needed

**Avoid this pattern when:**

- Static configuration is sufficient
- Only a single extension source exists
- No dynamic loading is needed
- Extension lifecycle is simple

### Benefits

- **Consistency**: All extensions follow same lifecycle
- **Progress Tracking**: Events for UI updates
- **Coordinated Initialization**: Manages dependencies
- **Flexible Loading**: Supports dynamic and static loading
- **Error Isolation**: Individual extension failures don't affect others
- **Reusability**: Template methods handle common logic

### Trade-offs

- **Complexity**: Abstract base class adds indirection
- **Coupling**: Extensions depend on Config and MCP systems
- **Event Overhead**: Event emission adds slight performance cost
- **Initialization Order**: Parallel start may cause issues with dependencies

### Common Mistakes

**Mistake 1: Not resetting counters after completion**

Bad example:

```typescript
protected async startExtension(extension: Extension) {
  this.startingCount++;
  this.eventEmitter?.emit('extensionsStarting', {
    total: this.startingCount,
    completed: this.startCompletedCount,
  });

  await this.config.getMcpClientManager().startExtension(extension);

  this.startCompletedCount++;
  // Counters never reset - will accumulate over multiple loads
}
```

Correct approach:

```typescript
protected async startExtension(extension: Extension) {
  this.startingCount++;
  this.eventEmitter?.emit('extensionsStarting', {
    total: this.startingCount,
    completed: this.startCompletedCount,
  });

  try {
    await this.config.getMcpClientManager().startExtension(extension);
  } finally {
    this.startCompletedCount++;

    // Reset counters when all done
    if (this.startingCount === this.startCompletedCount) {
      this.startingCount = 0;
      this.startCompletedCount = 0;
    }
  }
}
```

**Why this matters**: Without resetting counters, subsequent loads will have incorrect progress numbers.

**Mistake 2: Not checking if config is initialized**

Bad example:

```typescript
protected async startExtension(extension: Extension) {
  // Assumes config exists
  await this.config.getMcpClientManager().startExtension(extension);
}
```

Correct approach:

```typescript
protected async startExtension(extension: Extension) {
  if (!this.config) {
    throw new Error('Cannot start extension before loader is started');
  }
  await this.config.getMcpClientManager()!.startExtension(extension);
}
```

**Why this matters**: If start() hasn't been called, config will be undefined and crash.

### Testing Strategy

**What to Test:**

- start() calls startExtension() for all active extensions
- startExtension() emits progress events
- stopExtension() stops MCP servers and refreshes tools
- restartExtension() calls stop then start
- maybeStartExtension() respects reload flag
- Counters reset after all extensions loaded
- Errors in one extension don't affect others

**Test Organization:**

- Co-locate test: `extensionLoader.ts` → `extensionLoader.test.ts`
- Create concrete test subclass
- Mock Config and EventEmitter

**Mock Strategy:**

- Mock Config with spy methods
- Mock EventEmitter to verify events
- Create simple test extension objects

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { ExtensionLoader, Extension } from './extensionLoader.js';
import { EventEmitter } from 'node:events';
import type { Config } from '../config/config.js';

// Test subclass
class TestExtensionLoader extends ExtensionLoader {
  private extensions: Extension[] = [];

  setExtensions(extensions: Extension[]) {
    this.extensions = extensions;
  }

  getExtensions(): Extension[] {
    return this.extensions;
  }
}

describe('ExtensionLoader', () => {
  let loader: TestExtensionLoader;
  let mockConfig: Config;
  let eventEmitter: EventEmitter;
  let events: any[];

  beforeEach(() => {
    // Arrange - Create mocks
    events = [];
    eventEmitter = new EventEmitter();
    eventEmitter.on('extensionsStarting', (e) => events.push({ type: 'starting', ...e }));
    eventEmitter.on('extensionsStopping', (e) => events.push({ type: 'stopping', ...e }));

    mockConfig = {
      getMcpClientManager: () => ({
        startExtension: async () => {},
        stopExtension: async () => {},
      }),
      getClient: () => ({
        isInitialized: () => true,
        setTools: async () => {},
        refreshContext: async () => {},
      }),
      getEnableExtensionReloading: () => true,
    } as unknown as Config;

    loader = new TestExtensionLoader(eventEmitter);
  });

  it('should start all active extensions', async () => {
    // Arrange
    const extensions: Extension[] = [
      {
        name: 'ext1',
        version: '1.0.0',
        isActive: true,
        path: '/ext1',
        contextFiles: [],
        id: 'ext1',
      },
      {
        name: 'ext2',
        version: '1.0.0',
        isActive: false,
        path: '/ext2',
        contextFiles: [],
        id: 'ext2',
      },
    ];
    loader.setExtensions(extensions);

    // Act
    await loader.start(mockConfig);

    // Assert - Only ext1 should start (ext2 is inactive)
    expect(events.filter((e) => e.type === 'starting')).to.have.lengthOf.greaterThan(0);
  });

  it('should emit progress events', async () => {
    // Arrange
    const extensions: Extension[] = [
      {
        name: 'ext1',
        version: '1.0.0',
        isActive: true,
        path: '/ext1',
        contextFiles: [],
        id: 'ext1',
      },
    ];
    loader.setExtensions(extensions);

    // Act
    await loader.start(mockConfig);

    // Assert
    const startingEvents = events.filter((e) => e.type === 'starting');
    expect(startingEvents).to.have.lengthOf(2); // Start and completion events
    expect(startingEvents[0].total).to.equal(1);
    expect(startingEvents[0].completed).to.equal(0);
    expect(startingEvents[1].completed).to.equal(1);
  });

  it('should throw if start called twice', async () => {
    // Arrange
    loader.setExtensions([]);
    await loader.start(mockConfig);

    // Act & Assert
    await expect(loader.start(mockConfig)).to.be.rejectedWith('Already started');
  });

  it('should restart extension', async () => {
    // Arrange
    const extension: Extension = {
      name: 'ext1',
      version: '1.0.0',
      isActive: true,
      path: '/ext1',
      contextFiles: [],
      id: 'ext1',
    };
    loader.setExtensions([extension]);
    await loader.start(mockConfig);
    events = []; // Clear events

    // Act
    await loader.restartExtension(extension);

    // Assert - Should have both stopping and starting events
    expect(events.some((e) => e.type === 'stopping')).to.be.true;
    expect(events.some((e) => e.type === 'starting')).to.be.true;
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 75%+ (cover reload flag paths)
- Function coverage: 90%+

### Related Patterns

- **[Template Method Pattern](./02-architectural-design-patterns.md#template-method)** - Abstract base with template methods
- **[Lifecycle Management](./08-dependency-management.md#lifecycle-management)** - Component lifecycle pattern
- **[Event Emitter Pattern](./06-code-organization.md#event-driven-architecture)** - Progress tracking via events

---

## Pattern 6: Extension Manager with Dynamic Loading

### Intent

Provide concrete implementation of extension loader with full install/uninstall capabilities, workspace trust checking, and dynamic reloading.

### Problem

Extensions need to be installed from multiple sources (local directories, git repositories, GitHub releases) with security validation. The system must enforce workspace trust before allowing extension installation, handle installation failures with proper rollback, manage extension storage on the file system, and support updates without leaving orphaned files. Dynamic reloading should allow extensions to be enabled/disabled without restarting the application.

### Solution

Implement a concrete ExtensionManager that extends ExtensionLoader, adds install/uninstall methods with security checks, validates workspace trust before installation, manages extension storage directories, and coordinates with ExtensionEnablementManager for activation state.

### Structure

```typescript
// Extension manager architecture
ExtensionManager extends ExtensionLoader
  ├── installOrUpdateExtension(metadata): Extension
  │     ├── Check security settings
  │     ├── Validate workspace trust
  │     ├── Download/copy extension files
  │     ├── Load extension config
  │     └── Enable extension by default
  ├── uninstallExtension(identifier): void
  │     ├── Find extension by name or source
  │     ├── Unload extension (stop MCP servers)
  │     ├── Delete extension directory
  │     └── Remove from enablement config
  ├── updateExtension(identifier): Extension
  │     ├── Uninstall old version
  │     └── Install new version
  └── getExtensions(): Extension[]
        ├── Load from user extensions
        ├── Load from workspace extensions
        └── Merge and deduplicate

ExtensionStorage
  ├── getExtensionDir(): string
  ├── copyExtension(source, dest): void
  └── validateExtensionConfig(config): void
```

### Implementation

**Step 1: Define Extension Installation Metadata**

```typescript
/**
 * Installation source types
 */
export type ExtensionInstallMetadata =
  | { type: 'local'; source: string }
  | { type: 'git'; source: string }
  | { type: 'github-release'; source: string; version?: string }
  | { type: 'link'; source: string };

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  name: string;
  version: string;
  contextFiles?: string[];
  mcpServers?: Record<string, MCPServerConfig>;
  hooks?: { [K in HookEventName]?: HookDefinition[] };
}

/**
 * Extension with runtime state
 */
export interface Extension extends ExtensionConfig {
  id: string;
  path: string;
  isActive: boolean;
  installMetadata?: ExtensionInstallMetadata;
}
```

**Step 2: Implement Extension Manager with Security Checks**

```typescript
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ExtensionLoader } from './extensionLoader.js';
import { ExtensionEnablementManager, SettingScope } from './extensionEnablement.js';

export class ExtensionManager extends ExtensionLoader {
  private userExtensions: Extension[] = [];
  private workspaceExtensions: Extension[] = [];

  constructor(
    private readonly workspaceDir: string,
    private readonly userExtensionsDir: string,
    private readonly extensionEnablementManager: ExtensionEnablementManager,
    private readonly settings: Settings,
    eventEmitter?: EventEmitter
  ) {
    super(eventEmitter);
  }

  /**
   * Get all extensions (user + workspace)
   */
  getExtensions(): Extension[] {
    const allExtensions = [...this.userExtensions, ...this.workspaceExtensions];

    // Deduplicate by name (workspace extensions override user extensions)
    const extensionMap = new Map<string, Extension>();
    for (const ext of allExtensions) {
      extensionMap.set(ext.name, ext);
    }

    return Array.from(extensionMap.values());
  }

  /**
   * Install or update an extension
   */
  async installOrUpdateExtension(
    installMetadata: ExtensionInstallMetadata,
    previousExtensionConfig?: ExtensionConfig
  ): Promise<Extension> {
    // Security check: Block git extensions if configured
    if (
      (installMetadata.type === 'git' || installMetadata.type === 'github-release') &&
      this.settings.security?.blockGitExtensions
    ) {
      throw new Error(
        'Installing extensions from remote sources is disallowed by your current settings.'
      );
    }

    // Trust check: Validate workspace is trusted
    if (!this.isWorkspaceTrusted()) {
      const trusted = await this.requestWorkspaceTrust();
      if (!trusted) {
        throw new Error(
          `Cannot install extension: workspace at ${this.workspaceDir} is not trusted.`
        );
      }
    }

    // Download or locate extension files
    const sourcePath = await this.resolveExtensionSource(installMetadata);

    // Load and validate extension config
    const configPath = path.join(sourcePath, 'extension.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const extensionConfig: ExtensionConfig = JSON.parse(configContent);

    this.validateExtensionConfig(extensionConfig);

    // Determine installation directory
    const storage = new ExtensionStorage(
      installMetadata.type === 'link' ? extensionConfig.name : path.basename(sourcePath),
      this.userExtensionsDir
    );

    // Copy extension files
    await storage.copyExtension(sourcePath, storage.getExtensionDir());

    // Create extension object
    const extension: Extension = {
      ...extensionConfig,
      id: this.generateExtensionId(extensionConfig.name),
      path: storage.getExtensionDir(),
      isActive: true,
      installMetadata,
    };

    // Enable extension by default for new installations
    if (!previousExtensionConfig) {
      this.enableExtension(extension.name, SettingScope.User);
    }

    // Add to user extensions
    this.userExtensions = this.userExtensions.filter((e) => e.name !== extension.name);
    this.userExtensions.push(extension);

    // Start extension if reloading enabled
    await this.maybeStartExtension(extension);

    return extension;
  }

  /**
   * Uninstall an extension
   */
  async uninstallExtension(extensionIdentifier: string, isUpdate: boolean = false): Promise<void> {
    const installedExtensions = this.getExtensions();
    const extension = installedExtensions.find(
      (ext) =>
        ext.name.toLowerCase() === extensionIdentifier.toLowerCase() ||
        ext.installMetadata?.source.toLowerCase() === extensionIdentifier.toLowerCase()
    );

    if (!extension) {
      throw new Error(`Extension "${extensionIdentifier}" not found.`);
    }

    // Stop extension resources
    await this.unloadExtension(extension);

    // Delete extension directory
    const storage = new ExtensionStorage(
      extension.installMetadata?.type === 'link' ? extension.name : path.basename(extension.path),
      this.userExtensionsDir
    );

    await fs.rm(storage.getExtensionDir(), {
      recursive: true,
      force: true,
    });

    // Remove from internal list
    this.userExtensions = this.userExtensions.filter((e) => e.name !== extension.name);

    // Remove enablement config (unless this is part of update)
    if (!isUpdate) {
      this.extensionEnablementManager.remove(extension.name);
    }
  }

  /**
   * Update an extension to a new version
   */
  async updateExtension(
    extensionIdentifier: string,
    newMetadata: ExtensionInstallMetadata
  ): Promise<Extension> {
    const extension = this.getExtensions().find(
      (e) => e.name.toLowerCase() === extensionIdentifier.toLowerCase()
    );

    if (!extension) {
      throw new Error(`Extension "${extensionIdentifier}" not found.`);
    }

    // Uninstall old version (but keep enablement config)
    await this.uninstallExtension(extensionIdentifier, true);

    // Install new version
    return await this.installOrUpdateExtension(newMetadata, extension);
  }

  /**
   * Enable extension in specific scope
   */
  async enableExtension(name: string, scope: SettingScope): Promise<void> {
    const extension = this.getExtensions().find((e) => e.name === name);
    if (!extension) {
      throw new Error(`Extension "${name}" not found.`);
    }

    // Apply to enablement manager
    if (scope !== SettingScope.Session) {
      const scopePath =
        scope === SettingScope.Workspace ? this.workspaceDir : this.userExtensionsDir;
      this.extensionEnablementManager.enable(name, true, scopePath);
    }

    // Update runtime state if reloading enabled
    if (!this.config || this.config.getEnableExtensionReloading()) {
      extension.isActive = true;
      await this.maybeStartExtension(extension);
    }
  }

  /**
   * Disable extension in specific scope
   */
  async disableExtension(name: string, scope: SettingScope): Promise<void> {
    const extension = this.getExtensions().find((e) => e.name === name);
    if (!extension) {
      throw new Error(`Extension "${name}" not found.`);
    }

    // Apply to enablement manager
    if (scope !== SettingScope.Session) {
      const scopePath =
        scope === SettingScope.Workspace ? this.workspaceDir : this.userExtensionsDir;
      this.extensionEnablementManager.disable(name, true, scopePath);
    }

    // Update runtime state if reloading enabled
    if (!this.config || this.config.getEnableExtensionReloading()) {
      extension.isActive = false;
      await this.maybeStopExtension(extension);
    }
  }

  /**
   * Unload extension (stop MCP servers, etc.)
   */
  private async unloadExtension(extension: Extension): Promise<void> {
    await this.stopExtension(extension);
  }

  /**
   * Resolve extension source to local path
   */
  private async resolveExtensionSource(metadata: ExtensionInstallMetadata): Promise<string> {
    switch (metadata.type) {
      case 'local':
      case 'link':
        return metadata.source;
      case 'git':
        return await this.cloneGitRepository(metadata.source);
      case 'github-release':
        return await this.downloadGitHubRelease(metadata.source, metadata.version);
    }
  }

  /**
   * Clone git repository to temp directory
   */
  private async cloneGitRepository(url: string): Promise<string> {
    const tempDir = path.join(this.userExtensionsDir, '.temp', this.generateId());
    await fs.mkdir(tempDir, { recursive: true });

    // Execute git clone
    await this.executeCommand(`git clone ${url} ${tempDir}`);

    return tempDir;
  }

  /**
   * Download GitHub release
   */
  private async downloadGitHubRelease(repo: string, version?: string): Promise<string> {
    // Implementation would fetch from GitHub API
    throw new Error('GitHub release download not implemented');
  }

  /**
   * Check if workspace is trusted
   */
  private isWorkspaceTrusted(): boolean {
    const trustedFolders = this.loadTrustedFolders();
    return trustedFolders.isPathTrusted(this.workspaceDir) === true;
  }

  /**
   * Request workspace trust from user
   */
  private async requestWorkspaceTrust(): Promise<boolean> {
    // Prompt user for trust decision
    const response = await this.promptUser(
      `Do you trust the workspace at "${this.workspaceDir}"? This allows extensions to run code.`
    );

    if (response) {
      const trustedFolders = this.loadTrustedFolders();
      trustedFolders.setValue(this.workspaceDir, TrustLevel.TRUST_FOLDER);
    }

    return response;
  }

  /**
   * Validate extension configuration
   */
  private validateExtensionConfig(config: ExtensionConfig): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Extension config must have a "name" field');
    }

    if (!config.version || typeof config.version !== 'string') {
      throw new Error('Extension config must have a "version" field');
    }

    // Validate version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(config.version)) {
      throw new Error(
        `Invalid version format: "${config.version}". Expected semver (e.g., "1.0.0")`
      );
    }
  }

  /**
   * Generate unique extension ID
   */
  private generateExtensionId(name: string): string {
    return `${name}-${Date.now()}`;
  }

  /**
   * Generate random ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(7);
  }

  /**
   * Execute shell command
   */
  private async executeCommand(command: string): Promise<void> {
    const { spawn } = await import('node:child_process');

    return new Promise((resolve, reject) => {
      const child = spawn(command, { shell: true });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Prompt user for input
   */
  private async promptUser(message: string): Promise<boolean> {
    // Implementation would use readline or similar
    // For now, return false (deny by default)
    return false;
  }

  /**
   * Load trusted folders configuration
   */
  private loadTrustedFolders(): TrustedFolders {
    // Implementation would load from config file
    throw new Error('Not implemented');
  }
}

/**
 * Extension storage helper
 */
export class ExtensionStorage {
  constructor(
    private readonly extensionName: string,
    private readonly baseDir: string
  ) {}

  getExtensionDir(): string {
    return path.join(this.baseDir, this.extensionName);
  }

  async copyExtension(source: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    await this.copyDirectory(source, dest);
  }

  private async copyDirectory(source: string, dest: string): Promise<void> {
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

/**
 * Trust levels for workspace security
 */
export enum TrustLevel {
  TRUST_FOLDER = 'TRUST_FOLDER',
  TRUST_PARENT = 'TRUST_PARENT',
  DO_NOT_TRUST = 'DO_NOT_TRUST',
}

/**
 * Trusted folders configuration
 */
export interface TrustedFolders {
  isPathTrusted(path: string): boolean | undefined;
  setValue(path: string, level: TrustLevel): void;
}

/**
 * Setting scopes
 */
export enum SettingScope {
  User = 'user',
  Workspace = 'workspace',
  Session = 'session',
  System = 'system',
  SystemDefaults = 'systemDefaults',
}
```

### Complete Example

```typescript
import { ExtensionManager } from './extensionManager.js';
import { ExtensionEnablementManager } from './extensionEnablement.js';
import { EventEmitter } from 'node:events';

async function manageExtensions() {
  const workspaceDir = '/path/to/workspace';
  const userExtensionsDir = '/path/to/user/extensions';

  const eventEmitter = new EventEmitter();
  const enablementManager = new ExtensionEnablementManager(workspaceDir);
  const settings = { security: { blockGitExtensions: false } };

  const extensionManager = new ExtensionManager(
    workspaceDir,
    userExtensionsDir,
    enablementManager,
    settings,
    eventEmitter
  );

  // Listen to installation progress
  eventEmitter.on('extensionsStarting', (event) => {
    console.log(`Loading: ${event.completed}/${event.total}`);
  });

  // Install extension from local directory
  console.log('Installing local extension...');
  const extension = await extensionManager.installOrUpdateExtension({
    type: 'local',
    source: '/path/to/my-extension',
  });
  console.log(`Installed: ${extension.name} v${extension.version}`);

  // Install extension from git
  console.log('Installing extension from git...');
  const gitExtension = await extensionManager.installOrUpdateExtension({
    type: 'git',
    source: 'https://github.com/user/extension.git',
  });
  console.log(`Installed: ${gitExtension.name} v${gitExtension.version}`);

  // List all extensions
  const allExtensions = extensionManager.getExtensions();
  console.log(`\nInstalled extensions: ${allExtensions.length}`);
  allExtensions.forEach((ext) => {
    console.log(`  - ${ext.name} v${ext.version} (${ext.isActive ? 'active' : 'inactive'})`);
  });

  // Update extension
  console.log('\nUpdating extension...');
  const updated = await extensionManager.updateExtension(extension.name, {
    type: 'local',
    source: '/path/to/my-extension-v2',
  });
  console.log(`Updated: ${updated.name} ${extension.version} → ${updated.version}`);

  // Disable extension
  console.log('\nDisabling extension...');
  await extensionManager.disableExtension(extension.name, SettingScope.User);
  console.log(`Extension "${extension.name}" disabled`);

  // Enable extension
  console.log('Enabling extension...');
  await extensionManager.enableExtension(extension.name, SettingScope.User);
  console.log(`Extension "${extension.name}" enabled`);

  // Uninstall extension
  console.log('\nUninstalling extension...');
  await extensionManager.uninstallExtension(extension.name);
  console.log(`Extension "${extension.name}" uninstalled`);
}

manageExtensions();
```

**Example explained:**

- Lines 4-14: Initialize extension manager with workspace and user directories
- Lines 16-19: Listen to loading progress events
- Lines 21-26: Install extension from local directory with security checks
- Lines 28-33: Install extension from git repository
- Lines 35-40: List all installed extensions
- Lines 42-47: Update extension to new version
- Lines 49-51: Disable extension (stops resources)
- Lines 53-55: Re-enable extension (restarts resources)
- Lines 57-59: Uninstall extension (deletes files and config)

### When to Use

**Use install/uninstall when:**

- Users need to add custom extensions
- Extensions come from multiple sources (local, git, releases)
- Security validation is required before installation
- Extension lifecycle must be managed independently

**Use workspace trust when:**

- Extensions can execute arbitrary code
- Security is a concern (enterprise environments)
- Users work with multiple untrusted workspaces
- Explicit consent is required before loading extensions

**Use dynamic reloading when:**

- Frequent extension development/testing
- Live extension enable/disable needed
- No app restart is acceptable
- Resource management (MCP servers) must be coordinated

### Benefits

- **Security First**: Trust validation before any installation
- **Multiple Sources**: Supports local, git, and GitHub releases
- **Rollback Safety**: Failed installations don't corrupt state
- **Dynamic Control**: Enable/disable without restart
- **Clean Uninstall**: Complete removal of extension files and config
- **Update Support**: Seamless version updates

### Trade-offs

- **Security Overhead**: Trust prompts may interrupt workflow
- **Complexity**: Multi-source installation adds code complexity
- **Storage Management**: Must handle file system operations correctly
- **Dependency Coordination**: Must sync with MCP, tools, and context systems

### Common Mistakes

**Mistake 1: Not validating workspace trust**

Bad example:

```typescript
async installOrUpdateExtension(metadata: ExtensionInstallMetadata) {
  // Directly install without checking trust
  const sourcePath = await this.resolveExtensionSource(metadata);
  await this.copyExtension(sourcePath);
}
```

Correct approach:

```typescript
async installOrUpdateExtension(metadata: ExtensionInstallMetadata) {
  if (!this.isWorkspaceTrusted()) {
    const trusted = await this.requestWorkspaceTrust();
    if (!trusted) {
      throw new Error('Workspace not trusted');
    }
  }
  const sourcePath = await this.resolveExtensionSource(metadata);
  await this.copyExtension(sourcePath);
}
```

**Why this matters**: Untrusted workspaces should not be allowed to load extensions that execute code.

**Mistake 2: Not cleaning up on uninstall**

Bad example:

```typescript
async uninstallExtension(name: string) {
  const extension = this.getExtensions().find((e) => e.name === name);
  await fs.rm(extension.path, { recursive: true });
  // Extension still enabled, MCP servers still running
}
```

Correct approach:

```typescript
async uninstallExtension(name: string) {
  const extension = this.getExtensions().find((e) => e.name === name);

  // Stop all extension resources
  await this.unloadExtension(extension);

  // Delete files
  await fs.rm(extension.path, { recursive: true });

  // Remove enablement config
  this.extensionEnablementManager.remove(extension.name);
}
```

**Why this matters**: Incomplete cleanup leaves orphaned resources and configuration.

### Testing Strategy

**What to Test:**

- Installation from all source types (local, git, GitHub)
- Workspace trust validation blocks untrusted installs
- Extension config validation rejects invalid configs
- Uninstall removes all files and configuration
- Update preserves enablement configuration
- Enable/disable coordinates with ExtensionLoader
- Failed installations roll back cleanly
- Extension deduplication works correctly

**Test Organization:**

- Co-locate test: `extensionManager.ts` → `extensionManager.test.ts`
- Use temporary directories for test extensions
- Mock trust prompts and file system operations

**Mock Strategy:**

- Mock file system for faster tests
- Mock trust validation for controlled scenarios
- Use real ExtensionLoader base class
- Create test extension configs

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { ExtensionManager } from './extensionManager.js';
import { ExtensionEnablementManager, SettingScope } from './extensionEnablement.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('ExtensionManager', () => {
  let extensionManager: ExtensionManager;
  let tempDir: string;
  let userExtensionsDir: string;
  let workspaceDir: string;
  let enablementManager: ExtensionEnablementManager;

  beforeEach(async () => {
    // Arrange - Create temp directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ext-manager-test-'));
    userExtensionsDir = path.join(tempDir, 'user-extensions');
    workspaceDir = path.join(tempDir, 'workspace');

    await fs.mkdir(userExtensionsDir, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });

    enablementManager = new ExtensionEnablementManager(workspaceDir);

    const settings = {
      security: { blockGitExtensions: false },
    };

    extensionManager = new ExtensionManager(
      workspaceDir,
      userExtensionsDir,
      enablementManager,
      settings
    );

    // Mock workspace as trusted
    (extensionManager as any).isWorkspaceTrusted = () => true;
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should install extension from local directory', async () => {
    // Arrange - Create test extension
    const extensionSource = path.join(tempDir, 'test-extension');
    await fs.mkdir(extensionSource);
    await fs.writeFile(
      path.join(extensionSource, 'extension.json'),
      JSON.stringify({
        name: 'test-extension',
        version: '1.0.0',
        contextFiles: ['README.md'],
      })
    );
    await fs.writeFile(path.join(extensionSource, 'README.md'), 'Test extension');

    // Act
    const extension = await extensionManager.installOrUpdateExtension({
      type: 'local',
      source: extensionSource,
    });

    // Assert
    expect(extension.name).to.equal('test-extension');
    expect(extension.version).to.equal('1.0.0');
    expect(extension.isActive).to.be.true;

    // Verify files copied
    const installedPath = path.join(userExtensionsDir, path.basename(extensionSource));
    const readmeExists = await fs
      .access(path.join(installedPath, 'README.md'))
      .then(() => true)
      .catch(() => false);
    expect(readmeExists).to.be.true;
  });

  it('should reject installation when workspace not trusted', async () => {
    // Arrange
    (extensionManager as any).isWorkspaceTrusted = () => false;
    (extensionManager as any).requestWorkspaceTrust = async () => false;

    const extensionSource = path.join(tempDir, 'untrusted-extension');
    await fs.mkdir(extensionSource);
    await fs.writeFile(
      path.join(extensionSource, 'extension.json'),
      JSON.stringify({ name: 'untrusted', version: '1.0.0' })
    );

    // Act & Assert
    await expect(
      extensionManager.installOrUpdateExtension({
        type: 'local',
        source: extensionSource,
      })
    ).to.be.rejectedWith('not trusted');
  });

  it('should uninstall extension and remove files', async () => {
    // Arrange - Install extension first
    const extensionSource = path.join(tempDir, 'test-extension');
    await fs.mkdir(extensionSource);
    await fs.writeFile(
      path.join(extensionSource, 'extension.json'),
      JSON.stringify({ name: 'test-extension', version: '1.0.0' })
    );

    const extension = await extensionManager.installOrUpdateExtension({
      type: 'local',
      source: extensionSource,
    });

    // Act
    await extensionManager.uninstallExtension('test-extension');

    // Assert - Extension should be gone
    const extensions = extensionManager.getExtensions();
    expect(extensions.find((e) => e.name === 'test-extension')).to.be.undefined;

    // Files should be deleted
    const installedPath = extension.path;
    const pathExists = await fs
      .access(installedPath)
      .then(() => true)
      .catch(() => false);
    expect(pathExists).to.be.false;
  });

  it('should update extension to new version', async () => {
    // Arrange - Install v1.0.0
    const extensionV1 = path.join(tempDir, 'test-extension-v1');
    await fs.mkdir(extensionV1);
    await fs.writeFile(
      path.join(extensionV1, 'extension.json'),
      JSON.stringify({ name: 'test-extension', version: '1.0.0' })
    );

    await extensionManager.installOrUpdateExtension({
      type: 'local',
      source: extensionV1,
    });

    // Create v2.0.0
    const extensionV2 = path.join(tempDir, 'test-extension-v2');
    await fs.mkdir(extensionV2);
    await fs.writeFile(
      path.join(extensionV2, 'extension.json'),
      JSON.stringify({ name: 'test-extension', version: '2.0.0' })
    );

    // Act
    const updated = await extensionManager.updateExtension('test-extension', {
      type: 'local',
      source: extensionV2,
    });

    // Assert
    expect(updated.version).to.equal('2.0.0');

    // Should only have one version
    const extensions = extensionManager.getExtensions();
    const testExtensions = extensions.filter((e) => e.name === 'test-extension');
    expect(testExtensions).to.have.lengthOf(1);
  });

  it('should validate extension config on install', async () => {
    // Arrange - Create extension with invalid config
    const extensionSource = path.join(tempDir, 'invalid-extension');
    await fs.mkdir(extensionSource);
    await fs.writeFile(
      path.join(extensionSource, 'extension.json'),
      JSON.stringify({ name: 'invalid' }) // Missing version
    );

    // Act & Assert
    await expect(
      extensionManager.installOrUpdateExtension({
        type: 'local',
        source: extensionSource,
      })
    ).to.be.rejectedWith('must have a "version" field');
  });

  it('should enable and disable extensions', async () => {
    // Arrange - Install extension
    const extensionSource = path.join(tempDir, 'test-extension');
    await fs.mkdir(extensionSource);
    await fs.writeFile(
      path.join(extensionSource, 'extension.json'),
      JSON.stringify({ name: 'test-extension', version: '1.0.0' })
    );

    const extension = await extensionManager.installOrUpdateExtension({
      type: 'local',
      source: extensionSource,
    });

    // Mock reloading enabled
    (extensionManager as any).config = {
      getEnableExtensionReloading: () => true,
    };

    // Act - Disable
    await extensionManager.disableExtension('test-extension', SettingScope.User);

    // Assert
    expect(extension.isActive).to.be.false;

    // Act - Enable
    await extensionManager.enableExtension('test-extension', SettingScope.User);

    // Assert
    expect(extension.isActive).to.be.true;
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 75%+ (cover all source types and trust paths)
- Function coverage: 85%+

### Related Patterns

- **[Extension Loader Pattern](#pattern-5-extension-loader-with-lifecycle-management)** - Base class for lifecycle management
- **[Security Validation Pattern](./04-error-handling-patterns.md#security-validation)** - Trust checking
- **[File System Operations](./06-code-organization.md#file-system-abstraction)** - Extension storage

---

## Pattern 7: Extension Enablement with Path-Based Activation

### Intent

Control extension activation per directory using glob pattern matching with override rules and scope hierarchy.

### Problem

Extensions should not be active in all directories. Developers need fine-grained control over which extensions are enabled for specific project paths, with different rules for different scopes (user-level vs workspace-level). The system must support wildcard patterns for flexible matching, allow negative rules to disable extensions, and resolve conflicts when multiple rules apply to the same path.

### Solution

Implement ExtensionEnablementManager with glob-based override rules, scope-aware configuration (user/workspace), and last-match-wins conflict resolution. Store enablement rules in JSON configuration files per scope.

### Structure

```typescript
// Extension enablement architecture
ExtensionEnablementManager
  ├── isEnabled(name, currentPath): boolean
  │     ├── Check explicit override list
  │     ├── Load scope configuration
  │     ├── Find matching rules for path
  │     └── Return last matching rule result
  ├── enable(name, includeSubdirs, scopePath): void
  │     ├── Create positive override rule
  │     ├── Remove conflicting rules
  │     └── Save configuration
  ├── disable(name, includeSubdirs, scopePath): void
  │     ├── Create negative override rule (!path)
  │     ├── Remove conflicting rules
  │     └── Save configuration
  └── remove(name): void
        └── Delete all rules for extension

Override
  ├── baseRule: string (path pattern)
  ├── isDisable: boolean (negative rule)
  ├── includeSubdirs: boolean
  ├── asRegex(): RegExp
  └── matchesPath(path): boolean

Configuration hierarchy:
  Workspace scope (highest priority)
    ↓
  User scope
    ↓
  Default (all extensions enabled)
```

### Implementation

**Step 1: Define Override Rule Structure**

```typescript
import * as path from 'node:path';

/**
 * Converts glob pattern to regex
 */
function globToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${escaped}$`);
}

/**
 * Ensure path has leading and trailing slash
 */
function ensureLeadingAndTrailingSlash(p: string): string {
  let result = path.normalize(p);
  if (!result.startsWith('/')) {
    result = '/' + result;
  }
  if (!result.endsWith('/')) {
    result = result + '/';
  }
  return result;
}

/**
 * Extension enablement override rule
 */
export class Override {
  constructor(
    public baseRule: string,
    public isDisable: boolean,
    public includeSubdirs: boolean
  ) {}

  /**
   * Create override from user input
   */
  static fromInput(inputRule: string, includeSubdirs: boolean): Override {
    const isDisable = inputRule.startsWith('!');
    let baseRule = isDisable ? inputRule.substring(1) : inputRule;
    baseRule = ensureLeadingAndTrailingSlash(baseRule);
    return new Override(baseRule, isDisable, includeSubdirs);
  }

  /**
   * Create override from file rule
   */
  static fromFileRule(fileRule: string): Override {
    const isDisable = fileRule.startsWith('!');
    const includeSubdirs = fileRule.endsWith('*');

    let baseRule = fileRule;
    if (isDisable) {
      baseRule = baseRule.substring(1);
    }
    if (includeSubdirs) {
      baseRule = baseRule.substring(0, baseRule.length - 1);
    }

    return new Override(baseRule, isDisable, includeSubdirs);
  }

  /**
   * Convert to regex for path matching
   */
  asRegex(): RegExp {
    return globToRegex(`${this.baseRule}${this.includeSubdirs ? '*' : ''}`);
  }

  /**
   * Check if path matches this override
   */
  matchesPath(testPath: string): boolean {
    return this.asRegex().test(ensureLeadingAndTrailingSlash(testPath));
  }

  /**
   * Convert to file format
   */
  output(): string {
    const prefix = this.isDisable ? '!' : '';
    const suffix = this.includeSubdirs ? '*' : '';
    return `${prefix}${this.baseRule}${suffix}`;
  }

  /**
   * Check if this override conflicts with another
   */
  conflictsWith(other: Override): boolean {
    // Same path but different enable/disable is a conflict
    return (
      this.baseRule === other.baseRule &&
      this.includeSubdirs === other.includeSubdirs &&
      this.isDisable !== other.isDisable
    );
  }

  /**
   * Check if this override is equal to another
   */
  isEqualTo(other: Override): boolean {
    return (
      this.baseRule === other.baseRule &&
      this.includeSubdirs === other.includeSubdirs &&
      this.isDisable === other.isDisable
    );
  }

  /**
   * Check if this override is a child of another
   */
  isChildOf(other: Override): boolean {
    if (!other.includeSubdirs) {
      return false;
    }

    // This override's path starts with parent's path
    return this.baseRule.startsWith(other.baseRule);
  }
}
```

**Step 2: Implement Extension Enablement Manager**

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Extension enablement configuration
 */
export interface ExtensionEnablementConfig {
  [extensionName: string]: {
    overrides: string[];
  };
}

/**
 * Extension enablement manager
 */
export class ExtensionEnablementManager {
  private readonly configFilePath: string;
  private readonly configDir: string;
  private readonly enabledExtensionNamesOverride: string[];

  constructor(workspaceOrUserDir: string, enabledExtensionNamesOverride: string[] = []) {
    this.configDir = path.join(workspaceOrUserDir, '.cli');
    this.configFilePath = path.join(this.configDir, 'extension-enablement.json');
    this.enabledExtensionNamesOverride = enabledExtensionNamesOverride;
  }

  /**
   * Check if extension is enabled for current path
   */
  isEnabled(extensionName: string, currentPath: string): boolean {
    // Override takes absolute priority
    if (
      this.enabledExtensionNamesOverride.length === 1 &&
      this.enabledExtensionNamesOverride[0] === 'none'
    ) {
      return false; // Disable all extensions
    }

    // If explicit overrides exist, only enable those
    if (this.enabledExtensionNamesOverride.length > 0) {
      return this.enabledExtensionNamesOverride.includes(extensionName.toLowerCase());
    }

    // Otherwise check configuration rules
    const config = this.readConfig();
    const extensionConfig = config[extensionName];

    // Extensions enabled by default
    let enabled = true;

    // Apply override rules (last matching rule wins)
    const allOverrides = extensionConfig?.overrides ?? [];
    for (const rule of allOverrides) {
      const override = Override.fromFileRule(rule);
      if (override.matchesPath(currentPath)) {
        enabled = !override.isDisable;
      }
    }

    return enabled;
  }

  /**
   * Enable extension for specific path
   */
  enable(extensionName: string, includeSubdirs: boolean, scopePath: string): void {
    const config = this.readConfig();

    // Initialize extension config if needed
    if (!config[extensionName]) {
      config[extensionName] = { overrides: [] };
    }

    // Create new override
    const newOverride = Override.fromInput(scopePath, includeSubdirs);

    // Remove conflicting or redundant rules
    const overrides = config[extensionName].overrides.filter((rule) => {
      const existing = Override.fromFileRule(rule);

      // Remove if conflicts with new rule
      if (existing.conflictsWith(newOverride)) {
        return false;
      }

      // Remove if equal to new rule
      if (existing.isEqualTo(newOverride)) {
        return false;
      }

      // Remove if child of new rule
      if (existing.isChildOf(newOverride)) {
        return false;
      }

      return true;
    });

    // Add new override
    overrides.push(newOverride.output());
    config[extensionName].overrides = overrides;

    this.writeConfig(config);
  }

  /**
   * Disable extension for specific path
   */
  disable(extensionName: string, includeSubdirs: boolean, scopePath: string): void {
    // Delegate to enable with negation
    this.enable(extensionName, includeSubdirs, `!${scopePath}`);
  }

  /**
   * Remove all rules for extension
   */
  remove(extensionName: string): void {
    const config = this.readConfig();
    delete config[extensionName];
    this.writeConfig(config);
  }

  /**
   * Get all override rules for extension
   */
  getOverrides(extensionName: string): string[] {
    const config = this.readConfig();
    return config[extensionName]?.overrides ?? [];
  }

  /**
   * Read configuration from file
   */
  private readConfig(): ExtensionEnablementConfig {
    if (!fs.existsSync(this.configFilePath)) {
      return {};
    }

    try {
      const content = fs.readFileSync(this.configFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to read extension enablement config: ${error}`);
      return {};
    }
  }

  /**
   * Write configuration to file
   */
  private writeConfig(config: ExtensionEnablementConfig): void {
    // Ensure directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
```

### Complete Example

```typescript
import { ExtensionEnablementManager } from './extensionEnablement.js';

// Example: Managing extension enablement for different projects
function manageExtensionEnablement() {
  const userDir = '/Users/username';
  const workspaceDir = '/Users/username/projects/my-project';

  // Create user-level manager
  const userManager = new ExtensionEnablementManager(userDir);

  // Create workspace-level manager
  const workspaceManager = new ExtensionEnablementManager(workspaceDir);

  // Enable extension globally for user
  userManager.enable('eslint-extension', true, userDir);
  console.log('ESLint extension enabled globally');

  // Disable extension for specific project
  workspaceManager.disable('eslint-extension', true, workspaceDir);
  console.log('ESLint extension disabled for this workspace');

  // Check enablement for different paths
  const paths = [
    '/Users/username/projects/other-project',
    '/Users/username/projects/my-project',
    '/Users/username/projects/my-project/src',
  ];

  console.log('\nEnablement check:');
  paths.forEach((testPath) => {
    // User-level check
    const userEnabled = userManager.isEnabled('eslint-extension', testPath);

    // Workspace-level check (would override user in real implementation)
    const workspaceEnabled = workspaceManager.isEnabled('eslint-extension', testPath);

    console.log(`  ${testPath}:`);
    console.log(`    User scope: ${userEnabled ? 'enabled' : 'disabled'}`);
    console.log(`    Workspace scope: ${workspaceEnabled ? 'enabled' : 'disabled'}`);
  });

  // Enable extension only for subdirectory
  workspaceManager.enable('prettier-extension', true, '/Users/username/projects/my-project/src');
  console.log('\nPrettier extension enabled only for src/ directory');

  // Check specific path
  const srcEnabled = workspaceManager.isEnabled(
    'prettier-extension',
    '/Users/username/projects/my-project/src/index.ts'
  );
  const rootEnabled = workspaceManager.isEnabled(
    'prettier-extension',
    '/Users/username/projects/my-project/README.md'
  );

  console.log(`Prettier in src/index.ts: ${srcEnabled ? 'enabled' : 'disabled'}`);
  console.log(`Prettier in README.md: ${rootEnabled ? 'enabled' : 'disabled'}`);

  // View override rules
  const overrides = workspaceManager.getOverrides('prettier-extension');
  console.log('\nPrettier override rules:');
  overrides.forEach((rule) => {
    console.log(`  ${rule}`);
  });

  // Remove extension rules
  workspaceManager.remove('eslint-extension');
  console.log('\nRemoved all ESLint extension rules from workspace');
}

manageExtensionEnablement();
```

**Example explained:**

- Lines 4-10: Create managers for user and workspace scopes
- Lines 12-13: Enable extension globally at user level
- Lines 15-16: Disable same extension for specific workspace
- Lines 18-32: Check enablement for various paths in both scopes
- Lines 34-38: Enable extension only for subdirectory
- Lines 40-48: Verify subdirectory-specific enablement works
- Lines 50-54: View all override rules for extension
- Lines 56-57: Remove all rules for extension

### When to Use

**Use path-based enablement when:**

- Extensions should only be active in certain directories
- Different projects need different extension sets
- Monorepo with multiple sub-projects
- Security requires limiting extension scope

**Use override rules when:**

- Need to disable extension in subdirectory
- Want fine-grained control per path
- Different team members have different preferences
- Workspace settings should override user settings

**Use scope hierarchy when:**

- User-level defaults with workspace overrides
- Temporary session-level overrides
- System-level restrictions

### Benefits

- **Fine-Grained Control**: Per-directory extension activation
- **Flexible Patterns**: Glob-based matching
- **Conflict Resolution**: Last-match-wins is predictable
- **Scope Hierarchy**: User/workspace/session levels
- **Negative Rules**: Explicitly disable extensions
- **Subdirectory Support**: Include/exclude subdirectories

### Trade-offs

- **Configuration Complexity**: Multiple override rules can be confusing
- **Performance**: Regex matching for every path check
- **Rule Conflicts**: Last-match-wins may surprise users
- **Storage**: Configuration files per scope

### Common Mistakes

**Mistake 1: Not handling subdirectory flag correctly**

Bad example:

```typescript
enable(name: string, scopePath: string) {
  const override = Override.fromInput(scopePath, false);
  // Always false - won't match subdirectories
}
```

Correct approach:

```typescript
enable(name: string, includeSubdirs: boolean, scopePath: string) {
  const override = Override.fromInput(scopePath, includeSubdirs);
  // includeSubdirs determines if children match
}
```

**Why this matters**: Without subdirectory support, users must create rules for every subdirectory.

**Mistake 2: Not removing conflicting rules**

Bad example:

```typescript
enable(name: string, scopePath: string) {
  const config = this.readConfig();
  config[name].overrides.push(newRule);
  // May have both enable and disable for same path
}
```

Correct approach:

```typescript
enable(name: string, scopePath: string) {
  const config = this.readConfig();
  const overrides = config[name].overrides.filter((rule) => {
    const existing = Override.fromFileRule(rule);
    return !existing.conflictsWith(newOverride);
  });
  overrides.push(newRule);
}
```

**Why this matters**: Conflicting rules create unpredictable behavior.

### Testing Strategy

**What to Test:**

- isEnabled returns true by default
- Override list disables all extensions
- Positive rules enable extensions
- Negative rules disable extensions
- Last matching rule wins
- Subdirectory flag includes children
- Conflicting rules are removed
- Configuration persists correctly

**Test Organization:**

- Co-locate test: `extensionEnablement.ts` → `extensionEnablement.test.ts`
- Use temporary directories for config files
- Test various path patterns

**Mock Strategy:**

- Use real file system with temp directories
- Test all override combinations
- Verify conflict resolution

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { ExtensionEnablementManager, Override } from './extensionEnablement.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('ExtensionEnablementManager', () => {
  let manager: ExtensionEnablementManager;
  let tempDir: string;

  beforeEach(async () => {
    // Arrange - Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'enablement-test-'));
    manager = new ExtensionEnablementManager(tempDir);
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should enable extensions by default', () => {
    // Act
    const enabled = manager.isEnabled('test-extension', tempDir);

    // Assert
    expect(enabled).to.be.true;
  });

  it('should enable extension for specific path', () => {
    // Arrange
    const testPath = path.join(tempDir, 'project');

    // Act
    manager.enable('test-extension', true, testPath);
    const enabled = manager.isEnabled('test-extension', testPath);

    // Assert
    expect(enabled).to.be.true;
  });

  it('should disable extension for specific path', () => {
    // Act
    manager.disable('test-extension', true, tempDir);
    const enabled = manager.isEnabled('test-extension', tempDir);

    // Assert
    expect(enabled).to.be.false;
  });

  it('should match subdirectories when includeSubdirs is true', () => {
    // Arrange
    const projectPath = path.join(tempDir, 'project');
    const subPath = path.join(projectPath, 'src', 'index.ts');

    // Act
    manager.enable('test-extension', true, projectPath);
    const enabled = manager.isEnabled('test-extension', subPath);

    // Assert
    expect(enabled).to.be.true;
  });

  it('should not match subdirectories when includeSubdirs is false', () => {
    // Arrange
    const projectPath = path.join(tempDir, 'project');
    const subPath = path.join(projectPath, 'src');

    // Act
    manager.enable('test-extension', false, projectPath);
    const projectEnabled = manager.isEnabled('test-extension', projectPath);
    const subEnabled = manager.isEnabled('test-extension', subPath);

    // Assert
    expect(projectEnabled).to.be.true;
    expect(subEnabled).to.be.true; // Still true because extensions enabled by default
  });

  it('should apply last matching rule', () => {
    // Arrange
    const projectPath = path.join(tempDir, 'project');
    const srcPath = path.join(projectPath, 'src');

    // Act - Enable for project, then disable for src
    manager.enable('test-extension', true, projectPath);
    manager.disable('test-extension', true, srcPath);

    const projectEnabled = manager.isEnabled('test-extension', projectPath);
    const srcEnabled = manager.isEnabled('test-extension', srcPath);

    // Assert
    expect(projectEnabled).to.be.true;
    expect(srcEnabled).to.be.false; // Last rule wins
  });

  it('should remove conflicting rules', () => {
    // Arrange
    const testPath = path.join(tempDir, 'project');

    // Act
    manager.enable('test-extension', true, testPath);
    manager.disable('test-extension', true, testPath);

    const overrides = manager.getOverrides('test-extension');

    // Assert - Should only have disable rule
    expect(overrides).to.have.lengthOf(1);
    expect(overrides[0]).to.include('!');
  });

  it('should remove extension completely', () => {
    // Arrange
    manager.enable('test-extension', true, tempDir);

    // Act
    manager.remove('test-extension');
    const overrides = manager.getOverrides('test-extension');

    // Assert
    expect(overrides).to.have.lengthOf(0);
  });

  it('should persist configuration to file', () => {
    // Act
    manager.enable('test-extension', true, tempDir);

    // Assert - Configuration file should exist
    const configPath = path.join(tempDir, '.cli', 'extension-enablement.json');
    expect(fs.existsSync(configPath)).to.be.true;

    // Read and verify content
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(config['test-extension']).to.exist;
    expect(config['test-extension'].overrides).to.have.lengthOf(1);
  });

  describe('Override class', () => {
    it('should create override from input', () => {
      // Act
      const override = Override.fromInput('/path/to/project', true);

      // Assert
      expect(override.baseRule).to.equal('/path/to/project/');
      expect(override.isDisable).to.be.false;
      expect(override.includeSubdirs).to.be.true;
    });

    it('should create disable override from input', () => {
      // Act
      const override = Override.fromInput('!/path/to/project', true);

      // Assert
      expect(override.isDisable).to.be.true;
    });

    it('should match path with regex', () => {
      // Arrange
      const override = Override.fromInput('/path/to/project', true);

      // Act & Assert
      expect(override.matchesPath('/path/to/project')).to.be.true;
      expect(override.matchesPath('/path/to/project/src')).to.be.true;
      expect(override.matchesPath('/other/path')).to.be.false;
    });

    it('should detect conflicts', () => {
      // Arrange
      const enable = Override.fromInput('/path', true);
      const disable = Override.fromInput('!/path', true);

      // Act & Assert
      expect(enable.conflictsWith(disable)).to.be.true;
      expect(disable.conflictsWith(enable)).to.be.true;
    });

    it('should detect child relationship', () => {
      // Arrange
      const parent = Override.fromInput('/path', true);
      const child = Override.fromInput('/path/subdir', false);

      // Act & Assert
      expect(child.isChildOf(parent)).to.be.true;
      expect(parent.isChildOf(child)).to.be.false;
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Branch coverage: 80%+ (cover all rule combinations)
- Function coverage: 90%+

### Related Patterns

- **[Extension Manager Pattern](#pattern-6-extension-manager-with-dynamic-loading)** - Uses enablement manager for activation
- **[Glob Pattern Matching](./02-architectural-design-patterns.md#glob-matching)** - Path pattern matching
- **[Configuration Management](./09-configuration-management.md#hierarchical-config)** - Scope hierarchy

---

## Quick Reference

### Pattern Summary Table

| Pattern               | Use When                              | Avoid When             | Key Benefit                |
| --------------------- | ------------------------------------- | ---------------------- | -------------------------- |
| Hook Registry System  | Multiple hook sources with priorities | Single hook source     | Multi-source aggregation   |
| Hook Execution Engine | External command hooks needed         | All logic in-process   | Process isolation          |
| Hook Planner          | Context-aware filtering required      | All hooks always run   | Performance optimization   |
| Hook Aggregator       | Multiple hook results must combine    | Single hook per event  | Intelligent result merging |
| Extension Loader      | Lifecycle management needed           | Static extensions      | Coordinated initialization |
| Extension Manager     | Install/uninstall capabilities        | No dynamic extensions  | Full lifecycle control     |
| Extension Enablement  | Path-based activation                 | Global activation only | Fine-grained control       |

### Code Snippets

**Hook Registry - Minimal Example:**

```typescript
const registry = new HookRegistry(config);
await registry.initialize();
const hooks = registry.getHooksForEvent('BeforeTool');
```

**Hook Execution - Minimal Example:**

```typescript
const runner = new HookRunner();
const result = await runner.executeHook(hookConfig, 'BeforeTool', input);
if (result.success) {
  console.log(result.output);
}
```

**Hook Planner - Minimal Example:**

```typescript
const planner = new HookPlanner(registry);
const plan = planner.createExecutionPlan('BeforeTool', { toolName: 'readFile' });
if (plan) {
  const results = await runner.executeHooksParallel(plan.hookConfigs, plan.eventName, input);
}
```

**Hook Aggregator - Minimal Example:**

```typescript
const aggregator = new HookAggregator();
const aggregated = aggregator.aggregateResults(results, 'BeforeTool');
if (!aggregated.finalOutput?.continue) {
  console.log('Execution blocked:', aggregated.finalOutput.stopReason);
}
```

**Extension Loader - Minimal Example:**

```typescript
class MyExtensionLoader extends ExtensionLoader {
  getExtensions() {
    return this.extensions;
  }
}

const loader = new MyExtensionLoader(eventEmitter);
await loader.start(config);
```

**Extension Manager - Minimal Example:**

```typescript
const manager = new ExtensionManager(workspaceDir, userExtDir, enablementMgr, settings);
const ext = await manager.installOrUpdateExtension({ type: 'local', source: '/path' });
await manager.enableExtension(ext.name, SettingScope.User);
```

**Extension Enablement - Minimal Example:**

```typescript
const enablement = new ExtensionEnablementManager(workspaceDir);
enablement.enable('my-extension', true, '/project');
const enabled = enablement.isEnabled('my-extension', '/project/src/file.ts');
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": "off"
  }
}
```

**Testing Requirements:**

```json
{
  "scripts": {
    "test": "mocha 'test/**/*.test.ts'",
    "test:coverage": "c8 mocha 'test/**/*.test.ts'"
  },
  "c8": {
    "lines": 80,
    "statements": 80,
    "functions": 80,
    "branches": 70
  }
}
```

---

## Related Patterns

- **[Registry Pattern](./02-architectural-design-patterns.md#registry-pattern)** - Hook registry builds on registry pattern
- **[Process Management](./10-process-management.md#child-process-lifecycle)** - Hook execution uses process spawning
- **[Event-Driven Architecture](./06-code-organization.md#event-driven-architecture)** - Extension lifecycle emits events
- **[Template Method Pattern](./02-architectural-design-patterns.md#template-method)** - ExtensionLoader uses template methods
- **[Strategy Pattern](./02-architectural-design-patterns.md#strategy-pattern)** - Hook aggregation uses strategies
- **[Configuration Management](./09-configuration-management.md#hierarchical-config)** - Extension enablement uses hierarchy

---

## References

**Source Code Examples:**

- [Extension Loader](../../examplecode/gemini/packages/core/src/utils/extensionLoader.ts) - Base class implementation
- [Extension Manager](../../examplecode/gemini/packages/cli/src/config/extension-manager.ts) - Concrete manager with install/uninstall
- [Extension Enablement](../../examplecode/gemini/packages/cli/src/config/extensions/extensionEnablement.ts) - Path-based activation
- [Trusted Folders](../../examplecode/gemini/packages/cli/src/config/trustedFolders.ts) - Workspace trust system
- [Extension Reload Test](../../examplecode/gemini/integration-tests/extensions-reload.test.ts) - Dynamic reloading example

**External Resources:**

- [Extension API Design](https://code.visualstudio.com/api/references/extension-manifest) - VS Code extension system reference
- [Event-Driven Programming](https://en.wikipedia.org/wiki/Event-driven_programming) - Event system fundamentals
- [Glob Pattern Syntax](<https://en.wikipedia.org/wiki/Glob_(programming)>) - Pattern matching reference

---

## Changelog

- **2025-01-21**: Initial extension and hook patterns documentation
- **2025-01-21**: Added Pattern 1-5 (Hook system)
- **2025-01-21**: Added Pattern 6-7 (Extension management)
- **2025-01-21**: Added complete testing examples for all patterns
- **2025-01-21**: Added Quick Reference, Enforcement, Related Patterns, and References sections
