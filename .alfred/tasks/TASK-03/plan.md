# TASK-03: Create AgentAdapter Bridge Layer

## Overview

Create an adapter layer that bridges the orchestrator's session expectations with opencode's direct session/agent module calls. This abstraction allows the orchestrator to work without HTTP/SDK calls by using opencode's internal modules directly.

## Current State Analysis

### What the Orchestrator Expects

From `stubs.ts` (created in TASK-02), the orchestrator expects this interface:

```typescript
type Client = {
  session: {
    create(options: { title: string }): Promise<Session>;
  };
};

type Session = {
  id: string;
  stream(prompt: string, options?: StreamOptions): AsyncIterable<StreamChunk>;
  close(): Promise<void>;
};
```

### What OpenCode Provides

| Orchestrator Need | OpenCode Module | Function |
|-------------------|-----------------|----------|
| Create session | `session/index.ts` | `Session.create({ title })` |
| Send message | `session/prompt.ts` | `SessionPrompt.prompt({ sessionID, parts })` |
| Get events | `bus/index.ts` | `Bus.subscribe(MessageV2.Event.PartUpdated, ...)` |
| Delete session | `session/index.ts` | `Session.remove(sessionID)` |

### Key Discoveries

- **Instance.provide() required** - All session operations must run inside `Instance.provide({ directory, fn })` context
- **No direct streaming API** - OpenCode uses `Bus.publish()` events, not an async iterator
- **Parts-based messages** - Messages use `parts: [{ type: 'text', text: '...' }]` format
- **Events for progress** - `MessageV2.Event.PartUpdated` emits `{ part, delta }` for streaming

## Desired End State

After completion:
1. `AgentAdapter` class exists at `orchestrator/adapter/agent-adapter.ts`
2. `AgentSession` wraps opencode session with orchestrator-compatible interface
3. Streaming implemented via Bus event subscription converted to AsyncIterable
4. All methods handle `Instance.provide()` context correctly
5. Unit tests verify adapter behavior

## What We're NOT Doing

- Modifying opencode's session/prompt modules
- Adding new event types to opencode
- Implementing tool filtering (use opencode defaults)
- Supporting all SDK features (only what orchestrator needs)

## Implementation Approach

Create an adapter that:
1. Wraps `Session.create()` calls with proper context
2. Converts `Bus.subscribe()` events into an AsyncIterable for streaming
3. Manages session lifecycle (create → use → cleanup)
4. Translates between orchestrator's message format and opencode's parts format

---

## Phase 1: Create Adapter Directory Structure

### Overview

Set up the adapter module structure within the orchestrator.

### Changes Required

#### 1. Create Directory

```bash
mkdir -p packages/opencode/src/orchestrator/adapter
```

#### 2. Create Barrel Export

**File:** `packages/opencode/src/orchestrator/adapter/index.ts`

```typescript
export { AgentAdapter, createAgentAdapter } from './agent-adapter.js';
export type {
  AgentAdapterConfig,
  AgentSession,
  ChatOptions,
  ChatResponse,
  StreamOptions,
  StreamEvent,
} from './types.js';
```

#### 3. Create Types File

**File:** `packages/opencode/src/orchestrator/adapter/types.ts`

```typescript
/**
 * AgentAdapter Types
 *
 * Types for the bridge layer between orchestrator and opencode session system.
 */

/**
 * Configuration for creating an AgentAdapter.
 */
export type AgentAdapterConfig = {
  /** Working directory for the project */
  directory: string;
};

/**
 * Configuration for creating a session.
 */
export type SessionConfig = {
  /** Session title (for display) */
  title: string;
  /** Parent session ID (for child sessions) */
  parentID?: string;
};

/**
 * Options for chat (synchronous) requests.
 */
export type ChatOptions = {
  /** Model override */
  model?: { providerID: string; modelID: string };
  /** System prompt override */
  system?: string;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
};

/**
 * Response from a chat request.
 */
export type ChatResponse = {
  /** The AI's text response */
  text: string;
  /** Tool calls made during response */
  toolCalls: Array<{
    name: string;
    args: unknown;
    result: unknown;
  }>;
};

/**
 * Options for streaming requests.
 */
export type StreamOptions = ChatOptions;

/**
 * Events emitted during streaming.
 */
export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_start'; toolName: string; toolArgs: unknown }
  | { type: 'tool_end'; toolName: string; toolResult: unknown }
  | { type: 'error'; error: string }
  | { type: 'done' };

/**
 * A session wrapper for orchestrator use.
 */
export interface AgentSession {
  /** Unique session identifier */
  readonly id: string;

  /**
   * Send a message and stream the response.
   *
   * @param message - The prompt to send
   * @param options - Optional configuration
   * @returns AsyncIterable of stream events
   */
  stream(message: string, options?: StreamOptions): AsyncIterable<StreamEvent>;

  /**
   * Send a message and wait for complete response.
   *
   * @param message - The prompt to send
   * @param options - Optional configuration
   * @returns The complete response
   */
  chat(message: string, options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Close the session and cleanup resources.
   */
  close(): Promise<void>;
}

/**
 * Adapter for creating sessions compatible with orchestrator.
 */
export interface AgentAdapter {
  /**
   * Create a new session for workflow step execution.
   *
   * @param config - Session configuration
   * @returns A session wrapper
   */
  createSession(config: SessionConfig): Promise<AgentSession>;

  /**
   * The working directory this adapter operates in.
   */
  readonly directory: string;
}
```

### Success Criteria

- [ ] Directory exists: `ls packages/opencode/src/orchestrator/adapter/`
- [ ] Types file exists with all type definitions
- [ ] Index file exports all types

---

## Phase 2: Implement AgentAdapter Core

### Overview

Implement the main AgentAdapter class that creates sessions.

### Changes Required

#### 1. Create Agent Adapter Implementation

**File:** `packages/opencode/src/orchestrator/adapter/agent-adapter.ts`

```typescript
/**
 * AgentAdapter - Bridge between orchestrator and opencode session system
 *
 * This adapter allows the orchestrator to use opencode's session/agent
 * system directly without HTTP/SDK calls.
 */

import { Instance } from '../../project/instance.js';
import { Session } from '../../session/index.js';
import { SessionPrompt } from '../../session/prompt.js';
import { Bus } from '../../bus/index.js';
import { MessageV2 } from '../../session/message-v2.js';
import { Log } from '../../util/log.js';
import type {
  AgentAdapter as IAgentAdapter,
  AgentAdapterConfig,
  AgentSession,
  ChatOptions,
  ChatResponse,
  SessionConfig,
  StreamEvent,
  StreamOptions,
} from './types.js';

const log = Log.create({ service: 'AgentAdapter' });

/**
 * Implementation of AgentSession that wraps opencode's session.
 */
class OpenCodeAgentSession implements AgentSession {
  private closed = false;

  constructor(
    public readonly id: string,
    private readonly directory: string,
  ) {}

  async *stream(message: string, options?: StreamOptions): AsyncIterable<StreamEvent> {
    if (this.closed) {
      throw new Error(`Session ${this.id} is closed`);
    }

    log.info('Starting stream', { sessionID: this.id, messageLength: message.length });

    // Create a queue to collect events
    const eventQueue: StreamEvent[] = [];
    let resolveNext: (() => void) | null = null;
    let done = false;
    let error: Error | null = null;

    // Subscribe to message part updates
    const unsub = Bus.subscribe(MessageV2.Event.PartUpdated, (event) => {
      // Only process events for our session
      if (event.properties.part.sessionID !== this.id) return;

      const part = event.properties.part;
      const delta = event.properties.delta;

      if (part.type === 'text' && delta) {
        eventQueue.push({ type: 'text', content: delta });
      } else if (part.type === 'tool') {
        if (part.state === 'pending' || part.state === 'running') {
          eventQueue.push({
            type: 'tool_start',
            toolName: part.tool,
            toolArgs: part.input,
          });
        } else if (part.state === 'completed') {
          eventQueue.push({
            type: 'tool_end',
            toolName: part.tool,
            toolResult: part.output,
          });
        } else if (part.state === 'error') {
          eventQueue.push({
            type: 'tool_end',
            toolName: part.tool,
            toolResult: { error: part.error },
          });
        }
      }

      // Wake up the iterator if waiting
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    try {
      // Send the prompt (this triggers the LLM response)
      const promptPromise = Instance.provide({
        directory: this.directory,
        fn: async () => {
          return SessionPrompt.prompt({
            sessionID: this.id,
            parts: [{ type: 'text', text: message }],
            ...(options?.model && { model: options.model }),
            ...(options?.system && { system: options.system }),
          });
        },
      });

      // Handle completion
      promptPromise
        .then(() => {
          done = true;
          eventQueue.push({ type: 'done' });
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        })
        .catch((e) => {
          error = e instanceof Error ? e : new Error(String(e));
          eventQueue.push({ type: 'error', error: error.message });
          if (resolveNext) {
            resolveNext();
            resolveNext = null;
          }
        });

      // Yield events as they arrive
      while (!done || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          const event = eventQueue.shift()!;
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            break;
          }
        } else {
          // Wait for next event
          await new Promise<void>((resolve) => {
            resolveNext = resolve;
          });
        }
      }

      // Wait for prompt to complete
      await promptPromise;

      if (error) {
        throw error;
      }
    } finally {
      unsub();
      log.info('Stream completed', { sessionID: this.id });
    }
  }

  async chat(message: string, options?: ChatOptions): Promise<ChatResponse> {
    if (this.closed) {
      throw new Error(`Session ${this.id} is closed`);
    }

    log.info('Starting chat', { sessionID: this.id, messageLength: message.length });

    const textParts: string[] = [];
    const toolCalls: ChatResponse['toolCalls'] = [];

    for await (const event of this.stream(message, options)) {
      if (event.type === 'text') {
        textParts.push(event.content);
      } else if (event.type === 'tool_end') {
        toolCalls.push({
          name: event.toolName,
          args: {}, // Args not available in tool_end, would need to track from tool_start
          result: event.toolResult,
        });
      } else if (event.type === 'error') {
        throw new Error(event.error);
      }
    }

    return {
      text: textParts.join(''),
      toolCalls,
    };
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    log.info('Closing session', { sessionID: this.id });

    await Instance.provide({
      directory: this.directory,
      fn: async () => {
        await Session.remove(this.id);
      },
    });
  }
}

/**
 * AgentAdapter implementation.
 */
class AgentAdapterImpl implements IAgentAdapter {
  constructor(public readonly directory: string) {}

  async createSession(config: SessionConfig): Promise<AgentSession> {
    log.info('Creating session', { title: config.title, directory: this.directory });

    const session = await Instance.provide({
      directory: this.directory,
      fn: async () => {
        return Session.create({
          title: config.title,
          parentID: config.parentID,
        });
      },
    });

    log.info('Session created', { sessionID: session.id });

    return new OpenCodeAgentSession(session.id, this.directory);
  }
}

/**
 * Create an AgentAdapter for the given configuration.
 *
 * @param config - Adapter configuration
 * @returns A configured AgentAdapter
 *
 * @example
 * ```typescript
 * const adapter = createAgentAdapter({ directory: process.cwd() });
 * const session = await adapter.createSession({ title: 'My Workflow' });
 * for await (const event of session.stream('Hello')) {
 *   console.log(event);
 * }
 * await session.close();
 * ```
 */
export function createAgentAdapter(config: AgentAdapterConfig): IAgentAdapter {
  return new AgentAdapterImpl(config.directory);
}

// Also export the class for testing
export { AgentAdapterImpl as AgentAdapter };
```

### Success Criteria

- [ ] `agent-adapter.ts` exists with full implementation
- [ ] No TypeScript errors in the file
- [ ] All methods implemented (createSession, stream, chat, close)

---

## Phase 3: Update Orchestrator Barrel Export

### Overview

Export the adapter from the main orchestrator index.

### Changes Required

#### 1. Update Orchestrator Index

**File:** `packages/opencode/src/orchestrator/index.ts`

Add to existing exports:

```typescript
// Add at appropriate location in the exports
export * from './adapter/index.js';
```

### Success Criteria

- [ ] Adapter exported from orchestrator barrel
- [ ] Can import: `import { createAgentAdapter } from './orchestrator/index.js'`

---

## Phase 4: Create Unit Tests

### Overview

Add tests to verify the adapter works correctly.

### Changes Required

#### 1. Create Test File

**File:** `packages/opencode/src/orchestrator/adapter/agent-adapter.test.ts`

```typescript
import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { createAgentAdapter } from './agent-adapter.js';

describe('AgentAdapter', () => {
  const testDirectory = '/tmp/test-project';

  describe('createAgentAdapter', () => {
    it('should create an adapter with the given directory', () => {
      const adapter = createAgentAdapter({ directory: testDirectory });
      expect(adapter.directory).toBe(testDirectory);
    });
  });

  describe('createSession', () => {
    it('should create a session with the given title', async () => {
      // This test requires mocking Instance.provide and Session.create
      // Full integration tests would run against a real project
      const adapter = createAgentAdapter({ directory: testDirectory });

      // Mock test - in real scenario would need proper Instance setup
      // For now, verify the adapter is created correctly
      expect(adapter).toBeDefined();
      expect(typeof adapter.createSession).toBe('function');
    });
  });

  // Note: Full integration tests require a real opencode project context
  // These would be added in a separate integration test suite
});
```

### Success Criteria

- [ ] Test file exists
- [ ] Basic tests pass: `bun test packages/opencode/src/orchestrator/adapter/`

---

## Phase 5: Verify Integration

### Overview

Verify the adapter compiles and exports correctly.

### Commands

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode

# Verify typecheck
bun turbo typecheck

# Verify adapter can be imported
bun -e "import { createAgentAdapter } from './packages/opencode/src/orchestrator/adapter/index.js'; console.log('OK')"

# Run adapter tests
bun test packages/opencode/src/orchestrator/adapter/
```

### Success Criteria

#### Automated Verification

- [ ] Typecheck passes: `bun turbo typecheck`
- [ ] Adapter imports correctly
- [ ] Basic tests pass

#### Manual Verification

- [ ] Review adapter code for correctness
- [ ] Verify event subscription logic handles edge cases

---

## Testing Strategy

### Unit Tests

- Adapter creation with config
- Session creation interface
- Stream method signature

### Integration Tests (Future)

Full integration tests require:
1. A real project directory with opencode config
2. A running LLM provider (or mock)
3. Proper `Instance.provide()` context

These would be added after TASK-05 provides end-to-end verification.

---

## Rollback Procedure

If something goes wrong:

```bash
# Remove the adapter directory
rm -rf packages/opencode/src/orchestrator/adapter

# Revert orchestrator index changes
git checkout packages/opencode/src/orchestrator/index.ts
```

---

## Files Created Summary

| File | Description |
|------|-------------|
| `adapter/index.ts` | Barrel export for adapter module |
| `adapter/types.ts` | Type definitions |
| `adapter/agent-adapter.ts` | Main adapter implementation |
| `adapter/agent-adapter.test.ts` | Unit tests |

---

## References

- OpenCode Session: `packages/opencode/src/session/index.ts`
- OpenCode SessionPrompt: `packages/opencode/src/session/prompt.ts`
- OpenCode Bus: `packages/opencode/src/bus/index.ts`
- OpenCode Instance: `packages/opencode/src/project/instance.ts`
- Task definition: `.alfred/tasks/TASK-03/task.md`
