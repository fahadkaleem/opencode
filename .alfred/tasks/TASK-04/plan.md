# TASK-04: Update agentExecutor to Use AgentAdapter

## Overview

Modify the orchestrator's agentExecutor to use the AgentAdapter (from TASK-03) instead of the stub Client. This is the final integration step that connects the orchestrator to opencode's session system.

## Current State Analysis

### Current agentExecutor Implementation

From `registry/executors/agentExecutor.ts` (after TASK-02):

```typescript
import type { Client } from '../../stubs.js';  // Stub type
import { Log } from '../../../util/log.js';    // Already updated in TASK-02

const log = Log.create({ service: 'AgentExecutor' });

export function createAgentExecutor(client: Client): StepExecutor<'Agent'> {
  return {
    async execute(step, context, options) {
      const session = await client.session.create({ title: step.displayName });
      for await (const chunk of session.stream(prompt, { ... })) {
        // Handle chunks
      }
      await session.close();
    }
  };
}
```

### Target agentExecutor Implementation

```typescript
import type { AgentAdapter } from '../adapter/index.js';  // Real adapter
import { Log } from '../../../util/log.js';

const log = Log.create({ service: 'AgentExecutor' });

export function createAgentExecutor(adapter: AgentAdapter): StepExecutor<'Agent'> {
  return {
    async execute(step, context, options) {
      const session = await adapter.createSession({ title: step.displayName });
      for await (const event of session.stream(prompt, { ... })) {
        // Handle events (slightly different structure)
      }
      await session.close();
    }
  };
}
```

### Key Differences

| Aspect | Client (Stub) | AgentAdapter |
|--------|---------------|--------------|
| Session creation | `client.session.create()` | `adapter.createSession()` |
| Stream chunks | `{ type, content, toolCall }` | `StreamEvent` union type |
| Tool events | `tool_start`, `tool_end` | Same names, different structure |

## Desired End State

After completion:
1. agentExecutor imports `AgentAdapter` instead of `Client`
2. All session operations use adapter methods
3. Stream handling updated for `StreamEvent` types
4. Registry dependencies type updated
5. All tests pass

## What We're NOT Doing

- Changing executor's external interface (inputs/outputs)
- Modifying other executors
- Adding new features
- Changing workflow execution logic

## Implementation Approach

Systematic update of agentExecutor.ts:
1. Update imports
2. Update function signature
3. Update session creation
4. Update stream event handling
5. Update registry types
6. Update tests

---

## Phase 1: Update agentExecutor Imports and Signature

### Overview

Replace the stub Client import with the real AgentAdapter.

### Changes Required

#### 1. Update Imports

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

**Line 8 - Change from:**
```typescript
import type { Client } from '../../stubs.js';
```

**To:**
```typescript
import type { AgentAdapter, AgentSession, StreamEvent } from '../../adapter/index.js';
```

#### 2. Update createAgentExecutor Signature

**Line 114 - Change from:**
```typescript
export function createAgentExecutor(client: Client): StepExecutor<'Agent'> {
```

**To:**
```typescript
export function createAgentExecutor(adapter: AgentAdapter): StepExecutor<'Agent'> {
```

#### 3. Update createAgentExecutorFromDependencies

**Lines 340-348 - Change from:**
```typescript
export function createAgentExecutorFromDependencies(
  dependencies: ExecutorDependencies,
): StepExecutor<'Agent'> | null {
  if (dependencies.client == null) {
    return null;
  }

  return createAgentExecutor(dependencies.client as Client);
}
```

**To:**
```typescript
export function createAgentExecutorFromDependencies(
  dependencies: ExecutorDependencies,
): StepExecutor<'Agent'> | null {
  if (dependencies.adapter == null) {
    return null;
  }

  return createAgentExecutor(dependencies.adapter);
}
```

### Success Criteria

- [ ] No imports from `stubs.js`
- [ ] Function signature uses `AgentAdapter`
- [ ] No TypeScript errors on import lines

---

## Phase 2: Update Session Creation

### Overview

Update the session creation to use adapter's `createSession` method.

### Changes Required

#### 1. Update Session Creation

**Lines 182-189 - Change from:**
```typescript
log.info('Creating SDK session', { stepId: step.id });
const session = await client.session.create({
  title: `Agent: ${step.displayName}`,
});
log.info('Session created', { stepId: step.id, sessionId: session.id });
```

**To:**
```typescript
log.info('Creating session', { stepId: step.id });
const session = await adapter.createSession({
  title: `Agent: ${step.displayName}`,
});
log.info('Session created', { stepId: step.id, sessionId: session.id });
```

### Success Criteria

- [ ] Session creation uses `adapter.createSession()`
- [ ] Title format preserved

---

## Phase 3: Update Stream Event Handling

### Overview

Update the stream iteration to handle `StreamEvent` types from the adapter.

### Changes Required

#### 1. Update Stream Iteration

**Lines 223-281 - The entire for-await loop needs updating.**

**Change from:**
```typescript
for await (const chunk of session.stream(prompt, {
  ...(tools !== undefined && { tools }),
  ...(model !== undefined && { model }),
  ...(system !== undefined && { system }),
  ...(signal !== undefined && { signal }),
})) {
  log.debug('Received chunk', { stepId: step.id, chunkType: chunk.type });
  if (chunk.type === 'text' && chunk.content !== undefined) {
    textChunks.push(chunk.content);
    options?.onStream?.(chunk.content);
    options?.onEvent?.({ type: 'progress', content: chunk.content });
  }

  if (chunk.type === 'tool_start' && chunk.toolCall != null) {
    log.info('Tool call started', { stepId: step.id, toolName: chunk.toolCall.name });
    options?.onEvent?.({
      type: 'tool_start',
      toolName: chunk.toolCall.name,
      toolArgs: chunk.toolCall.args,
    });
  }

  if (chunk.type === 'tool_end' && chunk.toolCall != null) {
    log.info('Tool call completed', { stepId: step.id, toolName: chunk.toolCall.name });
    toolCalls.push({
      name: chunk.toolCall.name,
      args: chunk.toolCall.args,
      result: chunk.toolCall.result,
    });
    options?.onEvent?.({
      type: 'tool_end',
      toolName: chunk.toolCall.name,
      toolResult: chunk.toolCall.result,
    });
  }

  if (chunk.type === 'error') {
    log.error('Stream error', { stepId: step.id, error: chunk.error });
    throw new AgentExecutionError(
      `Stream error: ${chunk.error}`,
      step.id,
    );
  }
}
```

**To:**
```typescript
for await (const event of session.stream(prompt, {
  ...(model !== undefined && { model }),
  ...(system !== undefined && { system }),
  ...(signal !== undefined && { signal }),
})) {
  log.debug('Received event', { stepId: step.id, eventType: event.type });

  switch (event.type) {
    case 'text':
      textChunks.push(event.content);
      options?.onStream?.(event.content);
      options?.onEvent?.({ type: 'progress', content: event.content });
      break;

    case 'tool_start':
      log.info('Tool call started', { stepId: step.id, toolName: event.toolName });
      options?.onEvent?.({
        type: 'tool_start',
        toolName: event.toolName,
        toolArgs: event.toolArgs,
      });
      // Track args for tool_end
      pendingToolArgs.set(event.toolName, event.toolArgs);
      break;

    case 'tool_end':
      log.info('Tool call completed', { stepId: step.id, toolName: event.toolName });
      toolCalls.push({
        name: event.toolName,
        args: pendingToolArgs.get(event.toolName) ?? {},
        result: event.toolResult,
      });
      pendingToolArgs.delete(event.toolName);
      options?.onEvent?.({
        type: 'tool_end',
        toolName: event.toolName,
        toolResult: event.toolResult,
      });
      break;

    case 'error':
      log.error('Stream error', { stepId: step.id, error: event.error });
      throw new AgentExecutionError(`Stream error: ${event.error}`, step.id);

    case 'done':
      // Stream complete, will exit loop naturally
      break;
  }
}
```

#### 2. Add pendingToolArgs Map

Add after the existing `toolCalls` declaration (around line 199):

```typescript
const toolCalls: Array<{
  name: string;
  args: unknown;
  result: unknown;
}> = [];
const pendingToolArgs = new Map<string, unknown>();  // Add this line
```

#### 3. Remove Tools Option

Note: The `tools` option was for SDK filtering. AgentAdapter uses opencode's default tools. Remove the tools-related code:

**Remove lines related to:**
```typescript
const tools = config.config.tools as string[] | undefined;
// And the spread in stream options:
...(tools !== undefined && { tools }),
```

### Success Criteria

- [ ] Stream uses `event` variable with switch statement
- [ ] All event types handled (text, tool_start, tool_end, error, done)
- [ ] Tool args tracked between start/end
- [ ] Tools filtering removed (not supported by adapter)

---

## Phase 4: Update Registry Types

### Overview

Update the executor dependencies type to use AgentAdapter instead of Client.

### Changes Required

#### 1. Update Registry Types

**File:** `packages/opencode/src/orchestrator/registry/types.ts`

Find the `ExecutorDependencies` type and update:

**Change from:**
```typescript
export type ExecutorDependencies = {
  client?: unknown;  // Or Client
  // ... other deps
};
```

**To:**
```typescript
import type { AgentAdapter } from '../adapter/index.js';

export type ExecutorDependencies = {
  adapter?: AgentAdapter;
  // ... other deps
};
```

#### 2. Update StepExecutorRegistry

**File:** `packages/opencode/src/orchestrator/registry/stepExecutorRegistry.ts`

If there are references to `client` in the registry initialization, update them to `adapter`.

### Success Criteria

- [ ] `ExecutorDependencies` type has `adapter` property
- [ ] No references to `client` in registry types

---

## Phase 5: Update Tests

### Overview

Update agentExecutor tests to mock AgentAdapter instead of Client.

### Changes Required

#### 1. Update Test Imports and Mocks

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.test.ts` (if exists)

If there are tests, update:

```typescript
import { mock } from 'bun:test';
import type { AgentAdapter, AgentSession, StreamEvent } from '../../adapter/index.js';

// Create mock adapter
function createMockAdapter(): AgentAdapter {
  return {
    directory: '/test',
    createSession: mock(async (config) => createMockSession(config.title)),
  };
}

// Create mock session
function createMockSession(title: string): AgentSession {
  return {
    id: 'test-session-id',
    stream: async function* (message, options): AsyncIterable<StreamEvent> {
      yield { type: 'text', content: 'Test response' };
      yield { type: 'done' };
    },
    chat: mock(async (message) => ({ text: 'Test response', toolCalls: [] })),
    close: mock(async () => {}),
  };
}
```

### Success Criteria

- [ ] Tests use AgentAdapter mocks
- [ ] All tests pass: `bun test agentExecutor`

---

## Phase 6: Remove Stubs

### Overview

Now that we have real types, remove the stub types file.

### Changes Required

#### 1. Delete Stubs File

```bash
rm packages/opencode/src/orchestrator/stubs.ts
```

#### 2. Verify No Remaining References

```bash
grep -r "from.*stubs" packages/opencode/src/orchestrator/
# Should return nothing
```

### Success Criteria

- [ ] `stubs.ts` deleted
- [ ] No imports from stubs.js remain

---

## Phase 7: Verify Integration

### Overview

Run typecheck and tests to verify everything works.

### Commands

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode

# Verify typecheck
bun turbo typecheck

# Run orchestrator tests
bun test packages/opencode/src/orchestrator/

# Specifically test agentExecutor if test file exists
bun test packages/opencode/src/orchestrator/registry/executors/
```

### Success Criteria

#### Automated Verification

- [ ] Typecheck passes: `bun turbo typecheck`
- [ ] No imports from `stubs.js`
- [ ] No imports from `client/client.js`
- [ ] Tests pass

#### Manual Verification

- [ ] Review agentExecutor for correctness
- [ ] Verify event handling matches adapter's StreamEvent types

---

## Testing Strategy

### Unit Tests

- Mock AgentAdapter for isolation
- Test all event type handling
- Test error scenarios
- Test session cleanup

### Integration Tests

Deferred to TASK-05 which provides end-to-end verification.

---

## Rollback Procedure

If something goes wrong:

```bash
# Restore stubs.ts
git checkout packages/opencode/src/orchestrator/stubs.ts

# Restore agentExecutor
git checkout packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts

# Restore registry types
git checkout packages/opencode/src/orchestrator/registry/types.ts
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `registry/executors/agentExecutor.ts` | Replace Client with AgentAdapter, update stream handling |
| `registry/types.ts` | Update ExecutorDependencies type |
| `stubs.ts` | **DELETED** |
| `registry/executors/agentExecutor.test.ts` | Update mocks (if exists) |

---

## References

- AgentAdapter: `packages/opencode/src/orchestrator/adapter/`
- Current agentExecutor: `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`
- StreamEvent types: `packages/opencode/src/orchestrator/adapter/types.ts`
- Task definition: `.alfred/tasks/TASK-04/task.md`
