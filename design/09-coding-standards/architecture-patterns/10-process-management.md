---
title: Process Management Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - Tool Implementations
related_patterns:
  - ./04-error-handling-patterns.md#graceful-degradation
  - ./05-testing-patterns.md#mock-objects
  - ./09-configuration-management.md#dependency-injection
---

# 10. Process Management Patterns

> **Purpose**: Patterns for spawning, managing, and cleaning up child processes with proper error handling, abort signal support, and resource cleanup to prevent leaks and ensure graceful termination.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Safe Process Spawning with AbortSignal](#pattern-1-safe-process-spawning-with-abortsignal)
- [Pattern 2: Cleanup Registry Pattern](#pattern-2-cleanup-registry-pattern)
- [Pattern 3: Process Execution Service](#pattern-3-process-execution-service)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Process management in Node.js applications involves spawning child processes, handling their lifecycle, capturing output, and ensuring proper cleanup. Poor process management leads to zombie processes, resource leaks, and orphaned child processes that continue running after the parent exits.

This codebase uses a centralized service pattern for process execution with consistent error handling, abort signal support, and cleanup registration. The patterns ensure that all spawned processes are properly tracked and terminated when the application exits.

**Why process management matters:**

- Prevents zombie and orphaned processes
- Ensures proper resource cleanup (file handles, network connections, temp files)
- Provides consistent cancellation mechanism across all async operations
- Enables graceful shutdown on SIGINT, SIGTERM, and process exit
- Tracks background processes spawned by shell commands

**In this document:**

- **Safe Process Spawning** - Spawning child processes with AbortSignal support and proper error handling
- **Cleanup Registry** - Centralized cleanup registration for sync and async operations
- **Process Execution Service** - Service-oriented process execution with streaming output and lifecycle management

**Prerequisites:**

- Understanding of Node.js child_process module
- Familiarity with AbortController and AbortSignal
- Knowledge of process signals (SIGTERM, SIGINT, SIGKILL)
- Understanding of Node.js event emitters

---

## Pattern 1: Safe Process Spawning with AbortSignal

### Intent

Execute child processes with proper abort signal integration, timeout handling, and graceful termination (SIGTERM then SIGKILL).

### Problem

Direct use of `spawn()` or `exec()` from Node.js `child_process` module requires manual handling of timeouts, abort signals, stdout/stderr collection, error cases, and process cleanup. Without proper cleanup, child processes can become zombies or orphans. Timeout handling often involves manual tracking and cleanup logic scattered across the codebase.

### Solution

Create a service that wraps `spawn()` with built-in AbortSignal support, timeout handling, output collection, and graceful termination. Use AbortSignal as the standard cancellation mechanism across all async operations, including process execution.

### Structure

```typescript
interface ShellExecutionHandle {
  pid: number | undefined;
  result: Promise<ShellExecutionResult>;
}

interface ShellExecutionResult {
  rawOutput: Buffer;
  output: string;
  exitCode: number | null;
  signal: number | null;
  error: Error | null;
  aborted: boolean;
  pid: number | undefined;
}

class ShellExecutionService {
  static async execute(
    command: string,
    cwd: string,
    onOutputEvent: (event: ShellOutputEvent) => void,
    abortSignal: AbortSignal,
    config: ShellExecutionConfig
  ): Promise<ShellExecutionHandle>;
}
```

### Implementation

**Step 1: Define execution result structure**

```typescript
import type { IPty } from '@lydell/node-pty';
import pkg from '@xterm/headless';
const { Terminal } = pkg;

/** Structured result from shell command execution */
export interface ShellExecutionResult {
  /** Raw, unprocessed output buffer */
  rawOutput: Buffer;
  /** Combined, decoded output as a string */
  output: string;
  /** Process exit code, or null if terminated by signal */
  exitCode: number | null;
  /** Signal that terminated the process, if any */
  signal: number | null;
  /** Error object if process failed to spawn */
  error: Error | null;
  /** Boolean indicating if command was aborted by user */
  aborted: boolean;
  /** Process ID of spawned shell */
  pid: number | undefined;
  /** Method used to execute shell command */
  executionMethod: 'lydell-node-pty' | 'node-pty' | 'child_process' | 'none';
}

/** Handle for ongoing shell execution */
export interface ShellExecutionHandle {
  /** Process ID of spawned shell */
  pid: number | undefined;
  /** Promise that resolves with complete execution result */
  result: Promise<ShellExecutionResult>;
}

export interface ShellExecutionConfig {
  terminalWidth?: number;
  terminalHeight?: number;
  pager?: string;
  showColor?: boolean;
  defaultFg?: string;
  defaultBg?: string;
  disableDynamicLineTrimming?: boolean;
}

/** Structured event emitted during shell command execution */
export type ShellOutputEvent =
  | {
      type: 'data';
      chunk: string | AnsiOutput;
    }
  | {
      type: 'binary_detected';
    }
  | {
      type: 'binary_progress';
      bytesReceived: number;
    };
```

**Step 2: Implement execution service with AbortSignal support**

```typescript
import { spawn as cpSpawn } from 'node:child_process';
import { TextDecoder } from 'node:util';
import os from 'node:os';

const SIGKILL_TIMEOUT_MS = 200;
const MAX_CHILD_PROCESS_BUFFER_SIZE = 16 * 1024 * 1024; // 16MB

export class ShellExecutionService {
  private static activePtys = new Map<number, ActivePty>();

  /**
   * Executes shell command with robust process management and streaming output.
   *
   * @param commandToExecute - Exact command string to run
   * @param cwd - Working directory to execute command in
   * @param onOutputEvent - Callback for streaming structured events
   * @param abortSignal - AbortSignal to terminate process and children
   * @param shouldUseNodePty - Whether to use node-pty for interactive shell
   * @param shellExecutionConfig - Terminal configuration options
   * @returns Object containing pid and promise that resolves with result
   */
  static async execute(
    commandToExecute: string,
    cwd: string,
    onOutputEvent: (event: ShellOutputEvent) => void,
    abortSignal: AbortSignal,
    shouldUseNodePty: boolean,
    shellExecutionConfig: ShellExecutionConfig
  ): Promise<ShellExecutionHandle> {
    if (shouldUseNodePty) {
      const ptyInfo = await getPty();
      if (ptyInfo) {
        try {
          return this.executeWithPty(
            commandToExecute,
            cwd,
            onOutputEvent,
            abortSignal,
            shellExecutionConfig,
            ptyInfo
          );
        } catch (_e) {
          // Fallback to child_process
        }
      }
    }

    return this.childProcessFallback(commandToExecute, cwd, onOutputEvent, abortSignal);
  }

  private static childProcessFallback(
    command: string,
    cwd: string,
    onOutputEvent: (event: ShellOutputEvent) => void,
    abortSignal: AbortSignal
  ): ShellExecutionHandle {
    const shellConfig = getShellConfiguration();
    const child = cpSpawn(shellConfig.shell, shellConfig.spawnArgs(command), {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // Use detached: true to create process group for clean termination
      detached: os.platform() !== 'win32',
    });

    let rawOutput = Buffer.alloc(0);
    let aborted = false;
    let exitCode: number | null = null;
    let signal: number | null = null;
    let error: Error | null = null;

    // Handle AbortSignal
    const abortHandler = (): void => {
      aborted = true;
      if (child.pid) {
        try {
          // Send SIGTERM to entire process group
          if (os.platform() !== 'win32') {
            process.kill(-child.pid, 'SIGTERM');
          } else {
            child.kill('SIGTERM');
          }

          // Force kill after timeout
          setTimeout(() => {
            if (!child.killed) {
              if (os.platform() !== 'win32') {
                process.kill(-child.pid!, 'SIGKILL');
              } else {
                child.kill('SIGKILL');
              }
            }
          }, SIGKILL_TIMEOUT_MS);
        } catch (_) {
          // Process may already be dead
        }
      }
    };

    if (abortSignal.aborted) {
      abortHandler();
    } else {
      abortSignal.addEventListener('abort', abortHandler);
    }

    // Collect stdout
    child.stdout?.on('data', (chunk: Buffer) => {
      rawOutput = Buffer.concat([rawOutput, chunk]);

      // Check if output is binary
      if (isBinary(chunk)) {
        onOutputEvent({ type: 'binary_detected' });
        onOutputEvent({
          type: 'binary_progress',
          bytesReceived: rawOutput.length,
        });
      } else {
        const decoded = new TextDecoder().decode(chunk);
        onOutputEvent({ type: 'data', chunk: decoded });
      }
    });

    // Collect stderr
    child.stderr?.on('data', (chunk: Buffer) => {
      rawOutput = Buffer.concat([rawOutput, chunk]);
    });

    const resultPromise = new Promise<ShellExecutionResult>((resolve) => {
      child.on('close', (code, sig) => {
        abortSignal.removeEventListener('abort', abortHandler);
        exitCode = code;
        signal = sig;

        const output = new TextDecoder().decode(rawOutput);

        resolve({
          rawOutput,
          output,
          exitCode,
          signal,
          error,
          aborted,
          pid: child.pid,
          executionMethod: 'child_process',
        });
      });

      child.on('error', (err) => {
        error = err;
      });
    });

    return {
      pid: child.pid,
      result: resultPromise,
    };
  }
}
```

**Step 3: Use in tool implementation with streaming output**

```typescript
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

const OUTPUT_UPDATE_INTERVAL_MS = 1000;

async execute(
  signal: AbortSignal,
  updateOutput?: (output: string | AnsiOutput) => void,
  shellExecutionConfig?: ShellExecutionConfig,
  setPidCallback?: (pid: number) => void,
): Promise<ToolResult> {
  const strippedCommand = stripShellWrapper(this.params.command);

  if (signal.aborted) {
    return {
      llmContent: 'Command was cancelled by user before it could start.',
      returnDisplay: 'Command cancelled by user.',
    };
  }

  const cwd = this.params.dir_path
    ? path.resolve(this.config.getTargetDir(), this.params.dir_path)
    : this.config.getTargetDir();

  let cumulativeOutput: string | AnsiOutput = '';
  let lastUpdateTime = Date.now();
  let isBinaryStream = false;

  const { result: resultPromise, pid } = await ShellExecutionService.execute(
    strippedCommand,
    cwd,
    (event: ShellOutputEvent) => {
      if (!updateOutput) {
        return;
      }

      let shouldUpdate = false;

      switch (event.type) {
        case 'data':
          if (isBinaryStream) break;
          cumulativeOutput = event.chunk;
          shouldUpdate = true;
          break;
        case 'binary_detected':
          isBinaryStream = true;
          cumulativeOutput = '[Binary output detected. Halting stream...]';
          shouldUpdate = true;
          break;
        case 'binary_progress':
          isBinaryStream = true;
          cumulativeOutput = `[Receiving binary output... ${formatMemoryUsage(
            event.bytesReceived,
          )} received]`;
          if (Date.now() - lastUpdateTime > OUTPUT_UPDATE_INTERVAL_MS) {
            shouldUpdate = true;
          }
          break;
        default: {
          throw new Error('An unhandled ShellOutputEvent was found.');
        }
      }

      if (shouldUpdate) {
        updateOutput(cumulativeOutput);
        lastUpdateTime = Date.now();
      }
    },
    signal,
    this.config.getEnableInteractiveShell(),
    shellExecutionConfig ?? {},
  );

  if (pid && setPidCallback) {
    setPidCallback(pid);
  }

  const result = await resultPromise;

  let llmContent = '';
  if (result.aborted) {
    llmContent = 'Command was cancelled by user before it could complete.';
    if (result.output.trim()) {
      llmContent += ` Below is the output before it was cancelled:\n${result.output}`;
    } else {
      llmContent += ' There was no output before it was cancelled.';
    }
  } else {
    llmContent = [
      `Command: ${this.params.command}`,
      `Directory: ${this.params.dir_path || '(root)'}`,
      `Output: ${result.output || '(empty)'}`,
      `Error: ${result.error?.message || '(none)'}`,
      `Exit Code: ${result.exitCode ?? '(none)'}`,
      `Signal: ${result.signal ?? '(none)'}`,
    ].join('\n');
  }

  return {
    llmContent,
    returnDisplay: result.output || 'Command completed',
  };
}
```

### Complete Example

```typescript
// packages/core/src/services/shellExecutionService.ts
import { spawn as cpSpawn } from 'node:child_process';
import { TextDecoder } from 'node:util';
import os from 'node:os';
import { getShellConfiguration } from '../utils/shell-utils.js';

const SIGKILL_TIMEOUT_MS = 200;

export interface ShellExecutionResult {
  rawOutput: Buffer;
  output: string;
  exitCode: number | null;
  signal: number | null;
  error: Error | null;
  aborted: boolean;
  pid: number | undefined;
  executionMethod: 'child_process';
}

export interface ShellExecutionHandle {
  pid: number | undefined;
  result: Promise<ShellExecutionResult>;
}

export class ShellExecutionService {
  static async execute(
    command: string,
    cwd: string,
    abortSignal: AbortSignal
  ): Promise<ShellExecutionHandle> {
    const shellConfig = getShellConfiguration();
    const child = cpSpawn(shellConfig.shell, shellConfig.spawnArgs(command), {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: os.platform() !== 'win32',
    });

    let rawOutput = Buffer.alloc(0);
    let aborted = false;

    const abortHandler = (): void => {
      aborted = true;
      if (child.pid) {
        try {
          if (os.platform() !== 'win32') {
            process.kill(-child.pid, 'SIGTERM');
          } else {
            child.kill('SIGTERM');
          }

          setTimeout(() => {
            if (!child.killed) {
              if (os.platform() !== 'win32') {
                process.kill(-child.pid!, 'SIGKILL');
              } else {
                child.kill('SIGKILL');
              }
            }
          }, SIGKILL_TIMEOUT_MS);
        } catch (_) {}
      }
    };

    if (abortSignal.aborted) {
      abortHandler();
    } else {
      abortSignal.addEventListener('abort', abortHandler);
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      rawOutput = Buffer.concat([rawOutput, chunk]);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      rawOutput = Buffer.concat([rawOutput, chunk]);
    });

    const resultPromise = new Promise<ShellExecutionResult>((resolve) => {
      let exitCode: number | null = null;
      let signal: number | null = null;
      let error: Error | null = null;

      child.on('close', (code, sig) => {
        abortSignal.removeEventListener('abort', abortHandler);
        exitCode = code;
        signal = sig;

        resolve({
          rawOutput,
          output: new TextDecoder().decode(rawOutput),
          exitCode,
          signal,
          error,
          aborted,
          pid: child.pid,
          executionMethod: 'child_process',
        });
      });

      child.on('error', (err) => {
        error = err;
      });
    });

    return {
      pid: child.pid,
      result: resultPromise,
    };
  }
}

// Usage
const controller = new AbortController();

const { pid, result } = await ShellExecutionService.execute(
  'npm test',
  process.cwd(),
  controller.signal
);

console.log(`Process started: ${pid}`);

const output = await result;
console.log(`Exit code: ${output.exitCode}`);
console.log(`Output: ${output.output}`);
```

**Example explained:**

- Lines 1-5: Import required Node.js modules for process spawning and text decoding
- Lines 7-17: Define result and handle interfaces for type safety
- Lines 19-21: Create service class with static execute method
- Lines 22-28: Spawn child process with detached mode for clean process group termination
- Lines 30-52: Set up abort signal handler with graceful termination (SIGTERM then SIGKILL)
- Lines 54-60: Collect stdout and stderr into buffer
- Lines 62-83: Create promise that resolves when process closes, cleaning up abort listener
- Lines 85-89: Return handle with pid and result promise
- Lines 94-103: Usage example showing AbortController integration

### When to Use

**Use this pattern when:**

- Spawning any child process that needs to be cancellable
- Executing shell commands with timeout requirements
- Need to track and kill child processes on application exit
- Streaming output from long-running processes
- Need consistent error handling across process executions
- Working with process groups to kill entire subprocess trees

**Avoid this pattern when:**

- Simple synchronous operations that don't involve processes
- Very short-lived processes where overhead isn't worth it
- When using higher-level abstractions (like oclif) that handle process management

### Benefits

- **Cancellation Support**: Standard AbortSignal mechanism for all async operations
- **Graceful Termination**: SIGTERM followed by SIGKILL prevents hung processes
- **Process Group Killing**: Detached mode ensures child processes are also terminated
- **Streaming Output**: Incremental output updates for long-running commands
- **Type Safety**: Strongly typed result structures
- **Cross-Platform**: Works on Windows, Linux, and macOS with platform-specific handling

### Trade-offs

- **Complexity**: More code than direct spawn() usage
- **Overhead**: Promise wrapping and event listener management add small overhead
- **Platform Differences**: Process group handling differs between Windows and Unix-like systems
- **Timeout Handling**: Requires AbortController setup for timeout behavior

### Common Mistakes

**Mistake 1: Not cleaning up AbortSignal listener**

Bad example:

```typescript
const abortHandler = () => child.kill();
signal.addEventListener('abort', abortHandler);

child.on('close', () => {
  // Forgot to remove listener - memory leak
  resolve(result);
});
```

Correct approach:

```typescript
const abortHandler = () => child.kill();
signal.addEventListener('abort', abortHandler);

child.on('close', () => {
  signal.removeEventListener('abort', abortHandler); // Clean up
  resolve(result);
});
```

**Why this matters**: Failing to remove event listeners causes memory leaks, especially with long-lived AbortControllers.

**Mistake 2: Using SIGKILL immediately instead of graceful shutdown**

Bad example:

```typescript
const abortHandler = () => {
  child.kill('SIGKILL'); // Immediate force kill
};
```

Correct approach:

```typescript
const abortHandler = () => {
  child.kill('SIGTERM'); // Graceful termination first

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL'); // Force kill only if needed
    }
  }, SIGKILL_TIMEOUT_MS);
};
```

**Why this matters**: Graceful termination allows processes to clean up resources. SIGKILL should be last resort.

**Mistake 3: Not handling process group on Unix systems**

Bad example:

```typescript
spawn(command, args, {
  detached: false, // Single process, not a group
});

// Later
child.kill(); // Only kills parent, not children
```

Correct approach:

```typescript
spawn(command, args, {
  detached: os.platform() !== 'win32', // Process group on Unix
});

// Later - kill entire process group
if (os.platform() !== 'win32') {
  process.kill(-child.pid, 'SIGTERM'); // Negative PID = process group
} else {
  child.kill('SIGTERM'); // Windows doesn't support process groups
}
```

**Why this matters**: Without process groups, child processes of the spawned command become orphans.

### Testing Strategy

**What to Test:**

- Process spawning succeeds with valid commands
- AbortSignal cancels process execution
- Timeout triggers graceful termination
- Output collection captures stdout and stderr
- Error handling for spawn failures
- Process cleanup on exit
- Platform-specific behavior (Windows vs Unix)

**Test Organization:**

- Co-locate tests: `shellExecutionService.ts` → `shellExecutionService.test.ts`
- Use AAA pattern for each test
- Group tests by scenario (happy path, error cases, cancellation)

**Mock Strategy:**

- Mock `spawn()` for unit tests to avoid real process spawning
- Use temporary directories for integration tests
- Mock platform detection for cross-platform tests
- Mock AbortSignal for cancellation tests

**Test Example:**

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShellExecutionService } from './shellExecutionService.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('ShellExecutionService', () => {
  let tempDir: string;
  let abortController: AbortController;

  beforeEach(() => {
    // Arrange - create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-test-'));
    abortController = new AbortController();
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should execute command and capture output', async () => {
    // Arrange
    const command = 'echo "test output"';

    // Act
    const { pid, result } = await ShellExecutionService.execute(
      command,
      tempDir,
      abortController.signal
    );

    const output = await result;

    // Assert
    expect(pid).toBeDefined();
    expect(output.exitCode).toBe(0);
    expect(output.output).toContain('test output');
    expect(output.aborted).toBe(false);
    expect(output.error).toBeNull();
  });

  it('should abort command when signal is triggered', async () => {
    // Arrange
    const command = 'sleep 10'; // Long-running command

    // Act
    const { result } = await ShellExecutionService.execute(
      command,
      tempDir,
      abortController.signal
    );

    // Abort after 100ms
    setTimeout(() => abortController.abort(), 100);

    const output = await result;

    // Assert
    expect(output.aborted).toBe(true);
    expect(output.exitCode).not.toBe(0);
  });

  it('should handle spawn errors gracefully', async () => {
    // Arrange
    const command = 'nonexistent-command-xyz';

    // Act
    const { result } = await ShellExecutionService.execute(
      command,
      tempDir,
      abortController.signal
    );

    const output = await result;

    // Assert
    expect(output.error).toBeDefined();
    expect(output.exitCode).not.toBe(0);
  });

  it('should collect both stdout and stderr', async () => {
    // Arrange
    const command = 'echo "stdout" && echo "stderr" >&2';

    // Act
    const { result } = await ShellExecutionService.execute(
      command,
      tempDir,
      abortController.signal
    );

    const output = await result;

    // Assert
    expect(output.output).toContain('stdout');
    expect(output.output).toContain('stderr');
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 70%+ (platform-specific code may be lower)
- Function coverage: 80%+

### Related Patterns

- **[Cleanup Registry Pattern](#pattern-2-cleanup-registry-pattern)** - Register process cleanup handlers
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Handle spawn errors consistently
- **[Configuration Management](./09-configuration-management.md#dependency-injection)** - Inject execution configuration

---

## Pattern 2: Cleanup Registry Pattern

### Intent

Centralize cleanup operations for resources, processes, and file handles to ensure proper cleanup on process exit.

### Problem

Applications create resources (temp files, child processes, database connections, file handles) that must be cleaned up when the application exits. Without centralized cleanup, resources leak when the process exits unexpectedly via SIGINT, SIGTERM, or crashes. Scattered cleanup logic across the codebase makes it easy to miss cleanup handlers and difficult to ensure correct execution order.

### Solution

Create a cleanup registry that collects cleanup functions (both sync and async) and executes them on process exit signals. Register cleanup handlers when resources are created, and the registry ensures they run on exit.

### Structure

```typescript
// Cleanup function registry
const cleanupFunctions: Array<(() => void) | (() => Promise<void>)> = [];
const syncCleanupFunctions: Array<() => void> = [];

// Registration functions
export function registerCleanup(fn: (() => void) | (() => Promise<void>)): void;
export function registerSyncCleanup(fn: () => void): void;

// Execution functions
export function runSyncCleanup(): void;
export async function runExitCleanup(): Promise<void>;
```

### Implementation

**Step 1: Create cleanup registry**

```typescript
// packages/cli/src/utils/cleanup.ts
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const cleanupFunctions: Array<(() => void) | (() => Promise<void>)> = [];
const syncCleanupFunctions: Array<() => void> = [];

export function registerCleanup(fn: (() => void) | (() => Promise<void>)): void {
  cleanupFunctions.push(fn);
}

export function registerSyncCleanup(fn: () => void): void {
  syncCleanupFunctions.push(fn);
}

export function runSyncCleanup(): void {
  for (const fn of syncCleanupFunctions) {
    try {
      fn();
    } catch (_) {
      // Tolerate errors during cleanup
    }
  }
  syncCleanupFunctions.length = 0;
}

export async function runExitCleanup(): Promise<void> {
  // Run sync cleanup first
  runSyncCleanup();

  // Then run async cleanup
  for (const fn of cleanupFunctions) {
    try {
      await fn();
    } catch (_) {
      // Tolerate errors during cleanup
    }
  }
  cleanupFunctions.length = 0;
}
```

**Step 2: Register process exit handlers**

```typescript
// packages/cli/src/main.ts
import { registerCleanup, runExitCleanup, runSyncCleanup } from './utils/cleanup.js';

// Sync cleanup on process exit (cannot be async)
process.on('exit', () => {
  runSyncCleanup();
});

// Async cleanup on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await runExitCleanup();
  process.exit(0);
});

// Async cleanup on SIGTERM (kill command)
process.on('SIGTERM', async () => {
  await runExitCleanup();
  process.exit(0);
});

// Optional: cleanup on uncaught exception
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await runExitCleanup();
  process.exit(1);
});
```

**Step 3: Register cleanup handlers when creating resources**

```typescript
import { registerCleanup, registerSyncCleanup } from './utils/cleanup.js';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as os from 'node:os';

// Example 1: Cleanup temp directories
async function createTempWorkspace(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'myapp-'));

  registerCleanup(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  return tempDir;
}

// Example 2: Kill spawned processes
function spawnLongRunningProcess(): ChildProcess {
  const child = spawn('long-running-service', ['--port', '3000']);

  registerCleanup(() => {
    if (!child.killed) {
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }
  });

  return child;
}

// Example 3: Close file handles
async function openLogFile(filePath: string): Promise<fs.FileHandle> {
  const fileHandle = await fs.open(filePath, 'a');

  registerCleanup(async () => {
    await fileHandle.close();
  });

  return fileHandle;
}

// Example 4: Flush logs (synchronous)
function createLogger(): Logger {
  const logger = new Logger();

  registerSyncCleanup(() => {
    logger.flush();
  });

  return logger;
}

// Example 5: Close database connections
async function connectToDatabase(): Promise<Database> {
  const db = await Database.connect('postgresql://...');

  registerCleanup(async () => {
    await db.close();
  });

  return db;
}
```

### Complete Example

```typescript
// packages/cli/src/utils/cleanup.ts
import { promises as fs } from 'node:fs';

const cleanupFunctions: Array<(() => void) | (() => Promise<void>)> = [];
const syncCleanupFunctions: Array<() => void> = [];

export function registerCleanup(fn: (() => void) | (() => Promise<void>)): void {
  cleanupFunctions.push(fn);
}

export function registerSyncCleanup(fn: () => void): void {
  syncCleanupFunctions.push(fn);
}

export function runSyncCleanup(): void {
  for (const fn of syncCleanupFunctions) {
    try {
      fn();
    } catch (_) {
      // Tolerate errors during cleanup
    }
  }
  syncCleanupFunctions.length = 0;
}

export async function runExitCleanup(): Promise<void> {
  runSyncCleanup();
  for (const fn of cleanupFunctions) {
    try {
      await fn();
    } catch (_) {
      // Tolerate errors during cleanup
    }
  }
  cleanupFunctions.length = 0;
}

// packages/cli/src/main.ts
import { runExitCleanup, runSyncCleanup, registerCleanup } from './utils/cleanup.js';
import { spawn } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';

// Register exit handlers
process.on('exit', () => {
  runSyncCleanup();
});

process.on('SIGINT', async () => {
  await runExitCleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await runExitCleanup();
  process.exit(0);
});

// Usage example
async function main() {
  // Create temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'app-'));
  registerCleanup(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // Spawn process
  const child = spawn('server', ['--port', '3000']);
  registerCleanup(() => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });

  // Do work...
  await doWork();

  // Cleanup runs automatically on exit
}

main();
```

**Example explained:**

- Lines 1-4: Define cleanup function registries (sync and async)
- Lines 6-11: Registration functions add cleanup handlers to arrays
- Lines 13-20: Sync cleanup executes all sync handlers, tolerating errors
- Lines 22-31: Async cleanup runs sync then async handlers
- Lines 34-50: Process exit handlers ensure cleanup runs on all exit scenarios
- Lines 54-71: Usage example showing temp directory and process cleanup registration

### When to Use

**Use this pattern when:**

- Creating any temporary files or directories
- Spawning child processes that must be killed on exit
- Opening file handles or database connections
- Allocating resources that need explicit cleanup
- Establishing network connections
- Creating timers or intervals that need clearing

**Avoid this pattern when:**

- Resources are self-cleaning (garbage collected)
- Very short-lived scripts where process exit is immediate
- Resources managed by frameworks with their own cleanup

### Benefits

- **Guaranteed Cleanup**: All registered handlers run on exit
- **Centralized Logic**: Single place to manage cleanup
- **Error Tolerance**: Individual cleanup failures don't prevent others from running
- **Signal Handling**: Works with SIGINT, SIGTERM, and normal exit
- **Sync/Async Support**: Handles both synchronous and asynchronous cleanup

### Trade-offs

- **No Cleanup Order Guarantee**: Handlers run in registration order, but dependencies must be managed manually
- **Silent Failures**: Errors during cleanup are swallowed
- **Memory Overhead**: All cleanup functions held in memory until exit
- **Cannot Clean Up on Crash**: Crashes bypass cleanup handlers

### Common Mistakes

**Mistake 1: Not separating sync and async cleanup**

Bad example:

```typescript
// Mixing async cleanup in process 'exit' handler
process.on('exit', async () => {
  await runCleanup(); // Won't work - exit handler must be sync
});
```

Correct approach:

```typescript
// Use sync cleanup for 'exit' event
process.on('exit', () => {
  runSyncCleanup(); // Synchronous only
});

// Use async cleanup for SIGINT/SIGTERM
process.on('SIGINT', async () => {
  await runExitCleanup(); // Can be async
  process.exit(0);
});
```

**Why this matters**: The `exit` event handler must be synchronous. Async operations won't complete.

**Mistake 2: Not tolerating cleanup errors**

Bad example:

```typescript
for (const fn of cleanupFunctions) {
  await fn(); // Throws - prevents remaining cleanup
}
```

Correct approach:

```typescript
for (const fn of cleanupFunctions) {
  try {
    await fn();
  } catch (_) {
    // Tolerate errors - continue with remaining cleanup
  }
}
```

**Why this matters**: One failed cleanup shouldn't prevent other cleanups from running.

### Testing Strategy

**What to Test:**

- Cleanup functions are registered correctly
- Sync cleanup executes all sync handlers
- Async cleanup executes all async handlers
- Cleanup tolerates individual handler errors
- Cleanup clears registry after execution
- Process exit handlers are registered

**Test Organization:**

- Co-locate tests: `cleanup.ts` → `cleanup.test.ts`
- Use AAA pattern
- Test both sync and async scenarios

**Mock Strategy:**

- No mocks needed for registration
- Mock fs operations for integration tests
- Use spy functions to verify cleanup execution

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerCleanup, registerSyncCleanup, runSyncCleanup, runExitCleanup } from './cleanup.js';

describe('Cleanup Registry', () => {
  beforeEach(() => {
    // Clear registries before each test
    runSyncCleanup();
    runExitCleanup();
  });

  it('should execute sync cleanup functions', () => {
    // Arrange
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    registerSyncCleanup(cleanup1);
    registerSyncCleanup(cleanup2);

    // Act
    runSyncCleanup();

    // Assert
    expect(cleanup1).toHaveBeenCalledOnce();
    expect(cleanup2).toHaveBeenCalledOnce();
  });

  it('should execute async cleanup functions', async () => {
    // Arrange
    const cleanup1 = vi.fn().mockResolvedValue(undefined);
    const cleanup2 = vi.fn().mockResolvedValue(undefined);

    registerCleanup(cleanup1);
    registerCleanup(cleanup2);

    // Act
    await runExitCleanup();

    // Assert
    expect(cleanup1).toHaveBeenCalledOnce();
    expect(cleanup2).toHaveBeenCalledOnce();
  });

  it('should tolerate errors in cleanup functions', async () => {
    // Arrange
    const failingCleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'));
    const successCleanup = vi.fn().mockResolvedValue(undefined);

    registerCleanup(failingCleanup);
    registerCleanup(successCleanup);

    // Act
    await runExitCleanup();

    // Assert - both should have been called despite error
    expect(failingCleanup).toHaveBeenCalledOnce();
    expect(successCleanup).toHaveBeenCalledOnce();
  });

  it('should clear cleanup registry after execution', async () => {
    // Arrange
    const cleanup = vi.fn().mockResolvedValue(undefined);
    registerCleanup(cleanup);

    // Act
    await runExitCleanup();
    await runExitCleanup(); // Second call

    // Assert - should only be called once
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (small, critical utility)
- Branch coverage: 100%
- Function coverage: 100%

### Related Patterns

- **[Safe Process Spawning](#pattern-1-safe-process-spawning-with-abortsignal)** - Register process cleanup handlers
- **[Resource Management](./06-code-organization.md#resource-management)** - General resource cleanup patterns
- **[Error Handling](./04-error-handling-patterns.md#graceful-degradation)** - Tolerate cleanup errors

---

## Pattern 3: Process Execution Service

### Intent

Encapsulate all process execution logic in a service with consistent error handling, abort support, and streaming output.

### Problem

Direct use of `child_process.spawn()` leads to duplicated logic for output collection, error handling, abort signals, and process cleanup across multiple tool implementations. Each tool reimplements the same patterns with slight variations, leading to inconsistencies and bugs.

### Solution

Create a centralized `ShellExecutionService` that handles all process execution concerns. Tools invoke this service rather than spawning processes directly.

### Structure

```typescript
// Centralized service
class ShellExecutionService {
  static async execute(
    command: string,
    cwd: string,
    onOutputEvent: (event: ShellOutputEvent) => void,
    abortSignal: AbortSignal,
    config: ShellExecutionConfig
  ): Promise<ShellExecutionHandle>;
}

// Tool uses service
class ShellToolInvocation {
  async execute(signal: AbortSignal): Promise<ToolResult> {
    const { pid, result } = await ShellExecutionService.execute(
      this.params.command,
      this.config.getTargetDir(),
      (event) => this.handleOutputEvent(event),
      signal,
      {}
    );

    return this.formatResult(await result);
  }
}
```

### Implementation

See [Pattern 1: Safe Process Spawning](#pattern-1-safe-process-spawning-with-abortsignal) for complete implementation details.

### Complete Example

```typescript
// packages/core/src/services/shellExecutionService.ts
export class ShellExecutionService {
  static async execute(
    command: string,
    cwd: string,
    onOutputEvent: (event: ShellOutputEvent) => void,
    abortSignal: AbortSignal,
    config: ShellExecutionConfig
  ): Promise<ShellExecutionHandle> {
    // Implementation from Pattern 1
  }
}

// packages/core/src/tools/shell.ts
export class ShellToolInvocation extends BaseToolInvocation<ShellToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    params: ShellToolParams,
    messageBus?: MessageBus
  ) {
    super(params, messageBus);
  }

  async execute(signal: AbortSignal, updateOutput?: (output: string) => void): Promise<ToolResult> {
    const cwd = this.params.dir_path
      ? path.resolve(this.config.getTargetDir(), this.params.dir_path)
      : this.config.getTargetDir();

    let cumulativeOutput = '';

    const { result } = await ShellExecutionService.execute(
      this.params.command,
      cwd,
      (event: ShellOutputEvent) => {
        if (event.type === 'data' && updateOutput) {
          cumulativeOutput = event.chunk;
          updateOutput(cumulativeOutput);
        }
      },
      signal,
      {}
    );

    const output = await result;

    return {
      llmContent: `Exit code: ${output.exitCode}\nOutput: ${output.output}`,
      returnDisplay: output.output,
    };
  }
}
```

**Example explained:**

- Lines 1-11: Service provides centralized execution method
- Lines 13-46: Tool invocation uses service instead of direct spawn
- Lines 35-42: Output event handler streams updates to caller
- Lines 44-48: Result formatting is tool-specific, execution is service-provided

### When to Use

**Use this pattern when:**

- Multiple tools or components need to spawn processes
- Need consistent error handling across all process executions
- Want to standardize abort signal and timeout behavior
- Need to test process execution logic in isolation
- Want to swap implementations (e.g., node-pty vs child_process)

**Avoid this pattern when:**

- Only one place in codebase spawns processes
- Process execution requirements are highly specialized
- Overhead of service abstraction isn't justified

### Benefits

- **Consistency**: All process executions use same logic
- **Testability**: Service can be mocked in tool tests
- **Maintainability**: Single place to fix bugs or add features
- **Flexibility**: Can swap implementations (e.g., PTY vs child_process)

### Trade-offs

- **Indirection**: Extra layer between tool and process
- **Complexity**: Service is more complex than inline spawn
- **Coupling**: Tools depend on service interface

### Common Mistakes

**Mistake 1: Tool implementing its own process spawning**

Bad example:

```typescript
class MyToolInvocation {
  async execute() {
    const child = spawn('command', args); // Direct spawn
    // Duplicate error handling, abort logic, etc.
  }
}
```

Correct approach:

```typescript
class MyToolInvocation {
  async execute(signal: AbortSignal) {
    const { result } = await ShellExecutionService.execute(
      'command',
      cwd,
      onOutputEvent,
      signal,
      {}
    );
    return result;
  }
}
```

**Why this matters**: Centralized service ensures consistency and reduces duplication.

### Testing Strategy

**What to Test:**

- Service tests: Process spawning, abort handling, output collection
- Tool tests: Mock service, test tool-specific logic only

**Test Organization:**

- Service tests in `shellExecutionService.test.ts`
- Tool tests in `tool.test.ts` with mocked service

**Mock Strategy:**

- Mock service in tool tests:
  ```typescript
  vi.mock('../services/shellExecutionService.js', () => ({
    ShellExecutionService: {
      execute: vi.fn().mockResolvedValue({
        pid: 123,
        result: Promise.resolve({
          exitCode: 0,
          output: 'mock output',
          // ...
        }),
      }),
    },
  }));
  ```

**Test Example:**

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the service
const mockExecute = vi.fn();
vi.mock('../services/shellExecutionService.js', () => ({
  ShellExecutionService: { execute: mockExecute },
}));

import { ShellToolInvocation } from './shell.js';

describe('ShellToolInvocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockExecute.mockResolvedValue({
      pid: 123,
      result: Promise.resolve({
        exitCode: 0,
        output: 'command output',
        error: null,
        aborted: false,
      }),
    });
  });

  it('should execute command via service', async () => {
    // Arrange
    const tool = new ShellToolInvocation(mockConfig, {
      command: 'echo test',
    });
    const abortController = new AbortController();

    // Act
    const result = await tool.execute(abortController.signal);

    // Assert
    expect(mockExecute).toHaveBeenCalledWith(
      'echo test',
      expect.any(String), // cwd
      expect.any(Function), // output callback
      abortController.signal,
      expect.any(Object) // config
    );
    expect(result.llmContent).toContain('command output');
  });
});
```

**Coverage Goals:**

- Service: 80%+ coverage
- Tool: 80%+ coverage (with mocked service)

### Related Patterns

- **[Safe Process Spawning](#pattern-1-safe-process-spawning-with-abortsignal)** - Service implementation pattern
- **[Dependency Injection](./09-configuration-management.md#dependency-injection)** - Inject service into tools
- **[Service Pattern](./02-architectural-design-patterns.md#service-pattern)** - General service design

---

## Quick Reference

### Pattern Summary Table

| Pattern                   | Use When                            | Avoid When                        | Key Benefit                                   |
| ------------------------- | ----------------------------------- | --------------------------------- | --------------------------------------------- |
| Safe Process Spawning     | Executing any child process         | Simple non-cancellable operations | AbortSignal integration, graceful termination |
| Cleanup Registry          | Creating resources needing cleanup  | Self-cleaning resources           | Guaranteed cleanup on exit                    |
| Process Execution Service | Multiple components spawn processes | Single isolated process spawn     | Consistency and testability                   |

### Code Snippets

**Safe Process Spawning - Minimal Example:**

```typescript
const { pid, result } = await ShellExecutionService.execute(
  'npm test',
  process.cwd(),
  (event) => console.log(event.chunk),
  abortController.signal,
  {}
);

const output = await result;
console.log(`Exit: ${output.exitCode}`);
```

**Cleanup Registry - Minimal Example:**

```typescript
import { registerCleanup } from './utils/cleanup.js';

const tempDir = await fs.mkdtemp('/tmp/app-');
registerCleanup(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});
```

**Process Execution Service - Minimal Example:**

```typescript
class ShellExecutionService {
  static async execute(
    command: string,
    cwd: string,
    abortSignal: AbortSignal
  ): Promise<ShellExecutionHandle> {
    // Centralized spawning logic
  }
}

// Tool uses service
const { result } = await ShellExecutionService.execute('command', cwd, signal);
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "rules": {
    "no-process-exit": "error",
    "node/no-unsupported-features/node-builtins": [
      "error",
      {
        "version": ">=18.0.0"
      }
    ]
  }
}
```

**Code Review Checklist:**

- [ ] All spawned processes have AbortSignal support
- [ ] Cleanup handlers registered for all resources
- [ ] Graceful termination (SIGTERM then SIGKILL) for process killing
- [ ] Output collection doesn't cause memory leaks
- [ ] Process exit handlers registered in main entry point
- [ ] Tests mock ShellExecutionService, not spawn directly

---

## Related Patterns

- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Handle spawn errors and cleanup failures
- **[Testing Patterns](./05-testing-patterns.md#mock-objects)** - Mock process execution service
- **[Configuration Management](./09-configuration-management.md#dependency-injection)** - Inject execution service
- **[Service Pattern](./02-architectural-design-patterns.md#service-pattern)** - General service design principles

---

## References

**Source Code Examples:**

- [ShellExecutionService](../../examplecode/gemini/packages/core/src/services/shellExecutionService.ts) - Service implementation with PTY and child_process fallback
- [ShellTool](../../examplecode/gemini/packages/core/src/tools/shell.ts) - Tool using execution service
- [Cleanup Registry](../../examplecode/gemini/packages/cli/src/utils/cleanup.ts) - Cleanup registration and execution
- [ShellTool Tests](../../examplecode/gemini/packages/core/src/tools/shell.test.ts) - Testing with mocked service

**External Resources:**

- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html) - Official spawn() and exec() docs
- [AbortController MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) - Standard cancellation mechanism
- [Process Signals Guide](https://www.gnu.org/software/libc/manual/html_node/Termination-Signals.html) - SIGTERM, SIGINT, SIGKILL

**Further Reading:**

- [Node.js Process Management](https://nodejs.org/api/process.html#process_signal_events) - Process event handling
- [Graceful Shutdown in Node.js](https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/) - Best practices

---

## Changelog

- **2025-01-21**: Initial process management patterns documentation extracted from reference codebase
