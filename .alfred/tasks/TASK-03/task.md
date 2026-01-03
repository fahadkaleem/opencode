# TASK-03: Create AgentAdapter Bridge Layer

## Summary

Create an adapter layer that bridges the orchestrator's session expectations with opencode's direct session/agent module calls. This abstraction allows the orchestrator to work without HTTP/SDK calls.

## Context

The flomaster-prototype orchestrator was designed to work with the opencode SDK (HTTP client). In the forked opencode, we have direct access to the session and agent modules. Instead of modifying the orchestrator extensively, we create an adapter that presents the same interface the orchestrator expects but uses direct module calls internally.

### Why an Adapter?

1. **Minimal orchestrator changes** - Only the agentExecutor needs updating
2. **Clean abstraction** - Separates orchestrator logic from opencode internals
3. **Testability** - Easy to mock for unit tests
4. **Future flexibility** - Could switch back to SDK if needed

## Scope

### In Scope

- Create `src/orchestrator/adapter/agent-adapter.ts`
- Implement session creation via `Session.create()`
- Implement message sending via `SessionPrompt.prompt()`
- Implement streaming via event subscription
- Implement session cleanup
- Handle `Instance.provide()` context requirement
- Export adapter from orchestrator barrel

### Out of Scope

- Modifying existing opencode session/agent code
- Changing the orchestrator's interface expectations
- Implementing all SDK features (only what agentExecutor needs)

## Interface Design

```typescript
// src/orchestrator/adapter/agent-adapter.ts

export interface AgentAdapterConfig {
  directory: string;
  model?: { providerID: string; modelID: string };
  agent?: string;
}

export interface AgentSession {
  id: string;

  /** Send a message and get response */
  chat(message: string, options?: ChatOptions): Promise<ChatResponse>;

  /** Send a message and stream response */
  stream(message: string, options?: StreamOptions): AsyncIterable<StreamEvent>;

  /** Inject context without response */
  injectContext(context: string): Promise<void>;

  /** Close the session */
  close(): Promise<void>;
}

export interface AgentAdapter {
  /** Create a new session for workflow execution */
  createSession(config: SessionConfig): Promise<AgentSession>;
}
```

## OpenCode Integration Points

| Adapter Method | OpenCode Module | Function |
|----------------|-----------------|----------|
| `createSession()` | `session/index.ts` | `Session.create()` |
| `session.chat()` | `session/prompt.ts` | `SessionPrompt.prompt()` |
| `session.stream()` | `session/prompt.ts` | `SessionPrompt.prompt()` + Bus events |
| `session.injectContext()` | `session/prompt.ts` | `SessionPrompt.prompt({ noReply: true })` |
| `session.close()` | `session/index.ts` | `Session.delete()` |

## Success Criteria

- [ ] `agent-adapter.ts` created with full interface implementation
- [ ] Adapter handles `Instance.provide()` context correctly
- [ ] Unit tests pass for adapter methods
- [ ] `bun turbo typecheck` passes

## Dependencies

- TASK-01 and TASK-02 must be completed first

## Files to Create

```
packages/opencode/src/orchestrator/adapter/
├── agent-adapter.ts       # Main adapter implementation
├── agent-adapter.test.ts  # Unit tests
├── types.ts               # Adapter types
└── index.ts               # Barrel export
```
