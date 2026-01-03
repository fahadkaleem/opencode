# TASK-04: Update agentExecutor to Use AgentAdapter

## Summary

Modify the orchestrator's agentExecutor to use the AgentAdapter (from TASK-03) instead of the SDK Client. This is the final integration step that connects the orchestrator to opencode's session system.

## Context

The agentExecutor (`registry/executors/agentExecutor.ts`) is the only place in the orchestrator that directly interacts with the AI/LLM layer. It currently uses the SDK Client to:
1. Create a session for the workflow step
2. Stream messages to the AI
3. Capture tool calls and responses
4. Close the session when done

After this task, the orchestrator will use direct opencode module calls via the AgentAdapter.

## Scope

### In Scope

- Remove `@opencode-ai/sdk` import from agentExecutor
- Import and use `AgentAdapter` from `../adapter`
- Update `createAgentExecutor()` to accept `AgentAdapter` instead of `Client`
- Update `StepExecutorRegistry.dependencies` type
- Update session creation to use adapter
- Update streaming logic to use adapter's stream interface
- Update error handling for opencode-specific errors
- Fix any type mismatches

### Out of Scope

- Changing the executor's external interface (inputs/outputs)
- Modifying other executors (prompt, loop, conditional, etc.)
- Adding new functionality

## Current vs New Implementation

### Current (SDK-based)
```typescript
// agentExecutor.ts (flomaster-prototype)
import { Client } from '../../client/client.js';

export function createAgentExecutor(client: Client): StepExecutor<'Agent'> {
  return {
    execute: async (context) => {
      const session = await client.session.create({ title: workflowId });
      const response = await session.stream(builtPrompt, { ... });
      // ... handle streaming
      await session.close();
    }
  };
}
```

### New (Adapter-based)
```typescript
// agentExecutor.ts (flomaster-opencode)
import { AgentAdapter } from '../adapter/index.js';

export function createAgentExecutor(adapter: AgentAdapter): StepExecutor<'Agent'> {
  return {
    execute: async (context) => {
      const session = await adapter.createSession({ ... });
      const stream = session.stream(builtPrompt, { ... });
      // ... handle streaming (same logic, different source)
      await session.close();
    }
  };
}
```

## Success Criteria

- [ ] No imports from `@opencode-ai/sdk` in agentExecutor
- [ ] No imports from `../../client/` in agentExecutor
- [ ] agentExecutor uses AgentAdapter for all session operations
- [ ] StepExecutorRegistry.dependencies updated to use AgentAdapter
- [ ] All agentExecutor tests pass (may need test updates)
- [ ] `bun turbo typecheck` passes

## Dependencies

- TASK-03 must be completed first (AgentAdapter exists)

## Files to Modify

```
packages/opencode/src/orchestrator/registry/
├── executors/agentExecutor.ts    # Main changes
├── stepExecutorRegistry.ts       # Update dependencies type
└── types.ts                      # Update RegistryDependencies type
```

## Test Updates

The agentExecutor tests will need to mock the AgentAdapter instead of the SDK Client. The test structure should remain similar - we're just changing the mock target.
