# TASK-03: Update agentExecutor to Use Direct Session Imports

## Summary

Modify the orchestrator's agentExecutor to use opencode's Session and SessionPrompt modules directly, replacing the SDK Client calls.

## Context

The agentExecutor is the only place in the orchestrator that interacts with the AI/LLM layer. Instead of going through an SDK or adapter, we'll call opencode's session modules directly. This is the core integration that makes the orchestrator work with opencode.

## Scope

### In Scope

- Import `Session` from `../../session/index.js`
- Import `SessionPrompt` from `../../session/prompt.js`
- Import `Instance` from `../../project/instance.js`
- Wrap session operations in `Instance.provide()`
- Replace `client.session.create()` with `Session.create()`
- Replace `session.stream()` with `SessionPrompt.prompt()`
- Handle response/streaming appropriately
- Update `StepExecutorRegistry` dependencies type
- Update `engine/factory.ts` to not require Client

### Out of Scope

- Changing the executor's input/output interface
- Modifying other executors
- Adding new functionality

## Implementation Approach

### Before (SDK-based)
```typescript
import { Client } from '../../../client/client.js';

export function createAgentExecutor(client: Client): StepExecutor<'Agent'> {
  return {
    execute: async (context) => {
      const session = await client.session.create({ title: workflowId });
      const response = await session.stream(builtPrompt, { tools, model });
      // ... handle streaming
      await session.close();
    }
  };
}
```

### After (Direct imports)
```typescript
import { Session } from '../../../session/index.js';
import { SessionPrompt } from '../../../session/prompt.js';
import { Instance } from '../../../project/instance.js';
import { Log } from '../../../util/log.js';

const log = Log.create({ service: 'AgentExecutor' });

export function createAgentExecutor(directory: string): StepExecutor<'Agent'> {
  return {
    execute: async (context) => {
      return Instance.provide({
        directory,
        fn: async () => {
          const session = await Session.create({ title: workflowId });

          const result = await SessionPrompt.prompt({
            sessionID: session.id,
            parts: [{ type: 'text', text: builtPrompt }],
            model: { providerID, modelID },
            agent: 'build', // or configurable
          });

          // Extract response from result
          return {
            response: extractTextFromResult(result),
            toolCalls: extractToolCalls(result),
          };
        }
      });
    }
  };
}
```

## Key OpenCode APIs to Use

| Operation | OpenCode Function | Location |
|-----------|-------------------|----------|
| Create session | `Session.create({ title, parentID? })` | `session/index.ts:126` |
| Send message | `SessionPrompt.prompt({ sessionID, parts, model, agent })` | `session/prompt.ts:150` |
| Context wrapper | `Instance.provide({ directory, fn })` | `project/instance.ts:17` |
| Delete session | `Session.delete(sessionID)` | `session/index.ts` |

## Response Handling

OpenCode's `SessionPrompt.prompt()` returns a `MessageV2.WithParts` which contains:
- `info`: Message metadata (id, role, sessionID, timestamps)
- `parts`: Array of parts (text, tool calls, reasoning, etc.)

We need to extract:
1. Text response from text parts
2. Tool call results from tool parts

## Success Criteria

- [ ] agentExecutor uses direct Session/SessionPrompt imports
- [ ] No imports from `client/` or SDK
- [ ] `Instance.provide()` wraps all session operations
- [ ] Agent steps execute and return responses
- [ ] Tool calls are captured correctly
- [ ] `bun turbo typecheck` passes
- [ ] agentExecutor tests pass (may need updates)

## Dependencies

- TASK-02 must be completed first

## Files to Modify

```
packages/opencode/src/orchestrator/
├── registry/
│   ├── executors/agentExecutor.ts    # Main integration
│   ├── stepExecutorRegistry.ts       # Update dependencies type
│   └── types.ts                      # Update RegistryDependencies
├── engine/
│   ├── factory.ts                    # Update to not require Client
│   └── workflowEngine.ts             # May need directory param
```

## Implementation Note: Directory Flow

The `directory` parameter needs to flow through the system:

```
CLI (process.cwd())
  → createWorkflowEngine({ directory })
    → StepExecutorRegistry.initialize({ directory, ... })
      → createAgentExecutor(directory)
        → Instance.provide({ directory, fn })
```

When implementing, trace how `dependencies` are passed in the current code and ensure `directory` is available where `Instance.provide()` is called.
