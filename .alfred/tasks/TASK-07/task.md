# TASK-07: Proper Agent Integration for Workflow Steps

> **Project Context**: FloMaster is a greenfield project (started Jan 2025, target launch end of 2026).
> There are no existing users, workflows, or backward compatibility requirements.
> All type definitions should be clean and correct from the start.

## Overview

Update `agentExecutor.ts` to properly integrate with OpenCode's agent system, enabling workflow steps to function as true subagents with their own sessions, prompts, and tool configurations. This is the foundation for interactive workflow steps where users can chat with individual agents.

## Problem Statement

The current `agentExecutor.ts` implementation has several issues:

| Issue | Current Behavior | Expected Behavior |
|-------|-----------------|-------------------|
| Agent lookup | Ignores `agentType` config | Use `Agent.get(agentType)` |
| Agent parameter | Not passed to SessionPrompt | Pass `agent: agent.name` |
| Session lifecycle | Deleted after execution | Keep for future interaction |
| Session ID | Not returned | Return for UI access |
| System prompt | Only from step config | Agent prompt + step augmentation |
| Session title | Uses literal `@agent` | Use actual agent name `@${agent.name}` |
| Abort handling | No cancellation support | Use `defer()` pattern with `options.signal` |
| Model config | Hardcodes `providerID: "anthropic"` | Use `Provider.parseModel()` or agent model |
| Permissions | Not passed to session | Deny "task" permission via Session.create() |

### Issues Found During Review

The subagent review identified additional issues:

1. **AgentConfig.tools type**: Current type is `readonly string[]` - should be `Record<string, boolean>` (for permission overrides)
2. **Abort signal**: Use existing `options.signal` from `ExecutorOptions` (already defined in registry/types.ts)
3. **No permission rules on session**: Workflow steps should deny "task" permission (prevent recursion)
4. **sessionID not in StepResult**: The `saveStepOutput` action doesn't capture sessionID
5. **WorkflowResult missing workflowSessionID**: Top-level result should include parent session ID
6. **createResult method**: Needs to include workflowSessionID from context

### Key Design Decisions (Refined)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Signal location | Use `options.signal` (existing) | `ExecutorOptions` already has signal field - don't add to context |
| Tool permissions | Session permissions only | `tools` param to SessionPrompt.prompt() is deprecated - use Session.create() permission array |
| Model format | `string` parsed by `Provider.parseModel()` | Matches OpenCode config patterns ("provider/model" format) |

## Goals

1. **Leverage OpenCode's agent system** - Use existing `Agent.get()` to load agents
2. **Support custom agents** - Users can define agents in `.opencode/agents/*.md`
3. **Enable future UI interaction** - Keep sessions so users can chat with step agents
4. **Follow established patterns** - Mirror `task.ts` implementation exactly
5. **Maintain parent-child hierarchy** - Workflow session is parent to step sessions

## Non-Goals (Out of Scope)

- TUI modifications for child session chatting
- Electron UI implementation
- Workflow JSON schema changes (separate task)
- Creating default step agent markdown files (separate task)
- Human-in-the-loop approval flow (separate task)

---

## Current State Analysis

### Current agentExecutor.ts (Problematic)

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

```typescript
// Current: Creates session but doesn't use agent
const session = await Session.create({
  ...(context.workflowSessionID !== undefined && { parentID: context.workflowSessionID }),
  title: `${step.displayName} (@agent subagent)`,
})

// Current: Calls SessionPrompt.prompt WITHOUT agent parameter!
const result = await SessionPrompt.prompt({
  messageID,
  sessionID: session.id,
  ...(model !== undefined && { model }),
  ...(config.config.systemPrompt !== undefined && { system: config.config.systemPrompt }),
  parts: [{ type: "text", text: prompt }],
  // MISSING: agent: agent.name
  // MISSING: tools: { ... }
})

// Current: DELETES the session!
await Session.remove(session.id)
```

### Reference Implementation: task.ts (Correct Pattern)

**File:** `packages/opencode/src/tool/task.ts`

```typescript
// Correct: Looks up agent
const agent = await Agent.get(params.subagent_type)
if (!agent) throw new Error(`Unknown agent type: ${params.subagent_type}`)

// Correct: Creates child session with permissions
const session = await Session.create({
  parentID: ctx.sessionID,
  title: params.description + ` (@${agent.name} subagent)`,
  permission: [
    { permission: "todowrite", pattern: "*", action: "deny" },
    { permission: "todoread", pattern: "*", action: "deny" },
    { permission: "task", pattern: "*", action: "deny" },
  ],
})

// Correct: Passes agent name and tool config
const result = await SessionPrompt.prompt({
  messageID,
  sessionID: session.id,
  model: { modelID: model.modelID, providerID: model.providerID },
  agent: agent.name,        // Uses agent's prompt + permissions
  tools: {                  // Tool overrides
    todowrite: false,
    todoread: false,
    task: false,
  },
  parts: promptParts,
})

// Correct: Does NOT delete session
```

**NOTE**: The task.ts tool denies `todowrite`, `todoread`, and `task` because subagents shouldn't manipulate the user's todo list or spawn additional subagents recursively. For workflow steps, we only need to deny `task` (to prevent infinite recursion). Workflow steps may legitimately need todo tracking.

---

## Desired End State

After this task is complete:

1. **Agent lookup works** - `Agent.get("research-agent")` returns custom agent from `.opencode/agents/research-agent.md`
2. **Agent prompt used** - The agent's markdown body becomes the system prompt
3. **Agent permissions applied** - Tool access controlled by agent's permission rules
4. **Sessions persist** - Step sessions remain after workflow completes
5. **Session IDs accessible** - Workflow result includes sessionID per step AND workflowSessionID at top level
6. **UI can chat** - Any future UI can send messages to step sessions

### Verification

```bash
# 1. Create a custom agent
cat > .opencode/agents/test-agent.md << 'EOF'
---
mode: subagent
description: Test agent for verification
permission:
  - permission: read
    pattern: "*"
    action: allow
  - permission: "*"
    pattern: "*"
    action: deny
---
You are a test agent. You can only read files.
When asked to do something, explain what you would do if you had permissions.
EOF

# 2. Run workflow with test-agent
bun dev workflow run "List the files in this directory"

# 3. Verify session persists (should see child session)
# The session should remain and be queryable
```

---

## Implementation Approach

Follow the `task.ts` pattern exactly, adapting for workflow context.

---

## Phase 1: Update Agent Executor Core Logic

### Overview

Rewrite the `execute()` method in `agentExecutor.ts` to:
1. Look up agent via `Agent.get()`
2. Create child session with parent link and permissions
3. Call `SessionPrompt.prompt()` with agent name
4. NOT delete session
5. Return sessionID in outputs

### Changes Required

#### 1. Add Required Imports

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

```typescript
// Add these imports
import { Agent } from "../../../agent/agent.js"
import { Provider } from "../../../provider/provider.js"
import { defer } from "../../../util/defer.js"
```

#### 2. Signal Already Available in ExecutorOptions

**File:** `packages/opencode/src/orchestrator/registry/types.ts`

**NO CHANGES NEEDED** - `ExecutorOptions` already has `signal`:

```typescript
export type ExecutorOptions = {
  /** Abort signal for cancellation */
  readonly signal?: AbortSignal  // Already exists!
  readonly onStream?: (chunk: string) => void
  readonly onEvent?: (event: ExecutorEvent) => void
  readonly timeout?: number
}
```

The executor signature is `execute(step, context, options)` - use `options?.signal` for cancellation.

#### 3. Update execute() Method

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

Replace the `execute()` method body with:

```typescript
async execute(step: ParsedStep, context: ExecutorContext, options?: ExecutorOptions): Promise<ExecuteStepOutput> {
  log.info("Starting agent execution", { stepId: step.id, stepName: step.displayName })

  const config = step.config
  if (config.type !== "Agent") {
    throw new AgentExecutionError(`Invalid config type for agent step: ${config.type}`, step.id)
  }

  // Dry-run mode - validate agent exists even in dry-run
  const agentType = config.config.agentType ?? "build"

  // Look up the agent (built-in or custom from .opencode/agents/)
  const agent = await Agent.get(agentType)
  if (!agent) {
    throw new AgentExecutionError(
      `Unknown agent type: "${agentType}". ` +
      `Define it in .opencode/agents/${agentType}.md or use a built-in agent (build, plan, explore, general).`,
      step.id
    )
  }
  log.info("Agent loaded", { stepId: step.id, agentType, agentName: agent.name })

  if (context.dryRun) {
    log.info("Dry-run mode: returning mock response", { stepId: step.id })
    return {
      stepId: step.id,
      outputs: {
        response: `[DRY-RUN] Agent ${step.displayName} (${agent.name}) would execute`,
        success: true,
      },
      complete: true,
    }
  }

  // Build inputs from step inputs + previous outputs
  const stepInputs: Record<string, unknown> = { ...step.inputs }
  for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
    for (const [key, value] of Object.entries(stepOutputs)) {
      stepInputs[`${stepId}.${key}`] = value
    }
  }

  // Create child session (following task.ts pattern)
  // Permissions are set on Session.create() - this is the preferred approach
  // (SessionPrompt.prompt's `tools` param is deprecated)
  log.info("Creating session", { stepId: step.id, parentID: context.workflowSessionID })

  // Build permission rules: deny "task" + any additional tool restrictions from step config
  const permissionRules: Array<{ permission: string; pattern: string; action: "allow" | "deny" }> = [
    // Prevent infinite recursion - workflow steps cannot spawn subagents via task tool
    { permission: "task", pattern: "*", action: "deny" },
  ]

  // Add tool restrictions from step config (if any)
  // AgentConfig.tools is Record<string, boolean> - false means deny
  if (config.config.tools) {
    for (const [tool, enabled] of Object.entries(config.config.tools)) {
      permissionRules.push({
        permission: tool,
        pattern: "*",
        action: enabled ? "allow" : "deny",
      })
    }
  }

  const session = await Session.create({
    ...(context.workflowSessionID !== undefined && { parentID: context.workflowSessionID }),
    title: `${step.displayName} (@${agent.name})`,
    permission: permissionRules,
  })
  log.info("Session created", { stepId: step.id, sessionId: session.id, agentName: agent.name })

  // Set up signal handling (following task.ts pattern)
  // Signal comes from options (ExecutorOptions.signal), NOT context
  function cancel() {
    SessionPrompt.cancel(session.id)
  }
  if (options?.signal) {
    options.signal.addEventListener("abort", cancel)
  }
  using _ = defer(() => {
    if (options?.signal) {
      options.signal.removeEventListener("abort", cancel)
    }
  })

  try {
    // Build the prompt
    const prompt = buildAgentPrompt(config.config, stepInputs)
    log.info("Built prompt", { stepId: step.id, promptLength: prompt.length })

    const messageID = Identifier.ascending("message")

    // Determine model (step config > agent config > undefined for default)
    // Model is string format "provider/model" - parse with Provider.parseModel()
    const model = config.config.model !== undefined
      ? Provider.parseModel(config.config.model)
      : agent.model

    // Call SessionPrompt.prompt with agent (following task.ts pattern)
    // NOTE: We do NOT pass `tools` here - it's deprecated. Use Session permissions instead.
    log.info("Calling SessionPrompt.prompt", {
      stepId: step.id,
      agentName: agent.name,
      model: model?.modelID,
    })

    const result = await SessionPrompt.prompt({
      messageID,
      sessionID: session.id,
      ...(model !== undefined && { model }),
      agent: agent.name,  // KEY: Pass the agent name!
      ...(config.config.systemPrompt !== undefined && { system: config.config.systemPrompt }),
      parts: [
        {
          id: Identifier.ascending("part"),
          type: "text",
          text: prompt,
        },
      ],
    })

    // Extract response text and tool calls from result
    const response = extractTextFromParts(result.parts as Array<{ type: string; text?: string }>)
    const toolCalls = extractToolCallsFromParts(
      result.parts as Array<{
        type: string
        tool?: string
        state?: { status: string; input?: unknown; output?: unknown }
      }>,
    )

    log.info("Execution completed", {
      stepId: step.id,
      sessionId: session.id,
      responseLength: response.length,
      toolCallCount: toolCalls.length,
    })

    // Return outputs INCLUDING sessionID (DON'T delete session!)
    return {
      stepId: step.id,
      sessionID: session.id,  // KEY: Return sessionID for UI access
      outputs: {
        response,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        success: true,
      },
      complete: true,
    }

    // NOTE: We intentionally do NOT delete the session here.
    // The session persists so users can interact with the agent later via UI.

  } catch (error) {
    log.error("Execution failed", {
      stepId: step.id,
      sessionId: session.id,
      error: error instanceof Error ? error.message : String(error),
    })

    // On error, we still keep the session for debugging purposes
    // User can see what happened and potentially retry

    if (error instanceof AgentExecutionError) {
      throw error
    }
    throw new AgentExecutionError(
      `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
      step.id,
      error instanceof Error ? error : undefined,
    )
  }
}
```

#### 4. Update AgentConfig Type

**File:** `packages/opencode/src/orchestrator/types.ts`

Update the type to use proper structures (no backward compatibility needed - greenfield project).

Find the current `AgentConfig` type and update it:

```typescript
// BEFORE (current):
export type AgentConfig = {
  readonly agentType: string
  readonly model?: string  // <-- Was string
  readonly temperature?: number
  readonly maxTokens?: number
  readonly systemPrompt?: string
  readonly tools?: readonly string[]  // <-- Was string[]
}

// AFTER (updated):
export type AgentConfig = {
  /** OpenCode agent type to use (default: "build") */
  readonly agentType: string
  /** Model in "provider/model" format, e.g. "anthropic/claude-sonnet-4-20250514" */
  readonly model?: string
  /** Temperature for generation */
  readonly temperature?: number
  /** Maximum tokens to generate */
  readonly maxTokens?: number
  /** Additional system prompt (augments agent's base prompt) */
  readonly systemPrompt?: string
  /** Tool overrides - true to enable, false to disable */
  readonly tools?: Readonly<Record<string, boolean>>
}
// Note: model is parsed with Provider.parseModel() to get { providerID, modelID }
```

### Success Criteria

#### Automated Verification

- [ ] TypeScript compiles: `bun turbo typecheck`
- [ ] Agent.get() is called with agentType from step config
- [ ] SessionPrompt.prompt() receives `agent: agent.name` parameter
- [ ] Session is NOT deleted after execution
- [ ] `sessionID` is present in executor return value

#### Manual Verification

- [ ] Create `.opencode/agents/test-agent.md` with read-only permissions
- [ ] Run workflow with `agentType: "test-agent"`
- [ ] Verify agent's system prompt is used (agent behaves as defined)
- [ ] Verify session persists after workflow completes
- [ ] Verify session appears in TUI under parent workflow session

---

## Phase 2: Remove Session Deletion

### Overview

Ensure session is never deleted, and add documentation explaining why.

### Changes Required

#### 1. Remove Session.remove() calls

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

Remove or comment out any `Session.remove()` calls (the finally block):

```typescript
// REMOVE THIS ENTIRE BLOCK:
// } finally {
//   log.debug("Removing session", { stepId: step.id, sessionId: session.id })
//   await Session.remove(session.id).catch((e) => {
//     log.warn("Failed to remove session", { stepId: step.id, error: String(e) })
//   })
// }
```

#### 2. Add Design Documentation

Add a comment explaining the design decision at the top of the execute method:

```typescript
/**
 * DESIGN DECISION: Sessions Are Not Deleted
 *
 * Step sessions are intentionally preserved after workflow execution because:
 * 1. Users may want to chat with step agents to understand their work
 * 2. The session history provides audit trail of what happened
 * 3. Future UI will allow clicking a step to open chat with that agent
 * 4. Parent-child relationship enables grouped display in TUI
 *
 * Sessions can be manually cleaned up via:
 * - Session.remove(sessionId) for individual sessions
 * - Workflow cleanup utilities (to be implemented)
 */
```

### Success Criteria

- [ ] No `Session.remove()` calls in agentExecutor.ts
- [ ] Sessions persist after workflow completes
- [ ] Documentation comment explains the design decision

---

## Phase 3: Update Type Definitions

### Overview

Update output types to include sessionID at step level and workflowSessionID at workflow level.

**Note**: We do NOT add `signal` to `ExecutorContext` - it already exists in `ExecutorOptions` (registry/types.ts:40).

### Changes Required

#### 1. Update ExecuteStepOutput

**File:** `packages/opencode/src/orchestrator/types.ts`

Find `ExecuteStepOutput` and add `sessionID`:

```typescript
export type ExecuteStepOutput = {
  /** Step ID */
  readonly stepId: string
  /** Session ID created by this step (for Agent steps) */
  readonly sessionID?: string  // NEW
  /** Step outputs */
  readonly outputs: Readonly<Record<string, unknown>>
  /** Updated loop state (if loop step) */
  readonly loopState?: LoopState
  /** Branch taken (if conditional step) */
  readonly branch?: "true" | "false"
  /** Whether step is complete */
  readonly complete: boolean
  /** Steps to skip (for conditional routing) */
  readonly skipSteps?: readonly string[]
}
```

#### 2. Update StepResult

**File:** `packages/opencode/src/orchestrator/types.ts`

Find `StepResult` and add `sessionID`:

```typescript
export type StepResult = {
  readonly stepId: string
  readonly displayName: string
  readonly status: StepStatus
  readonly outputs: Readonly<Record<string, unknown>>
  readonly sessionID?: string  // NEW: Session ID for UI interaction
  readonly error?: string
  readonly stackTrace?: string
  readonly startTime: number
  readonly endTime?: number
  readonly duration?: number
  readonly retryCount: number
}
```

#### 3. Update WorkflowResult

**File:** `packages/opencode/src/orchestrator/types.ts`

Find `WorkflowResult` and add `workflowSessionID`:

```typescript
export type WorkflowResult = {
  readonly executionId: string
  readonly workflowSessionID?: string  // NEW: Parent session for all steps
  readonly terminateMode: WorkflowTerminateMode
  readonly outputs: Readonly<Record<string, unknown>>
  readonly duration: number
  readonly stepResults: readonly StepResult[]
  readonly error?: string
  readonly startTime: number
  readonly endTime: number
}
```

### Success Criteria

- [ ] `ExecuteStepOutput` type includes optional `sessionID`
- [ ] `StepResult` type includes optional `sessionID`
- [ ] `WorkflowResult` type includes optional `workflowSessionID`
- [ ] TypeScript compiles without errors

---

## Phase 4: Update Workflow Engine and Machine

### Overview

Ensure sessionID flows from executor through machine to final result, and signal flows from workflow to executor via options.

### Changes Required

#### 1. Update saveStepOutput Action

**File:** `packages/opencode/src/orchestrator/machine/workflowMachine.ts`

Find the `saveStepOutput` action and update it to capture `sessionID`:

```typescript
saveStepOutput: assign(({ context, event }) => {
  const e = event as unknown as { output: ExecuteStepOutput }
  const { stepId, outputs, sessionID, loopState } = e.output  // ADD: sessionID

  // ... existing outputs and loopStates logic ...

  return {
    outputs: newOutputs,
    loopStates: newLoopStates,
    completedSteps: newCompleted,
    stepResults: [
      ...context.stepResults,
      {
        stepId,
        displayName: context.currentStepData?.displayName ?? stepId,
        status: "COMPLETED" as const,
        outputs,
        sessionID,  // ADD: Include sessionID in StepResult
        startTime: context.startTime,
        endTime: Date.now(),
        duration: Date.now() - context.startTime,
        retryCount: context.retryCount,
      },
    ],
  }
})
```

#### 2. Update createResult Method

**File:** `packages/opencode/src/orchestrator/engine/workflowEngine.ts`

Find the `createResult` method and update it to include `workflowSessionID`:

```typescript
private createResult(executionId: string, startTime: number, context: WorkflowContext): WorkflowResult {
  const endTime = Date.now()
  let terminateMode: WorkflowTerminateMode = "COMPLETED"

  if (context.error != null) {
    terminateMode = "FAILED"
  }

  return {
    executionId,
    workflowSessionID: context.workflowSessionID,  // ADD: Include parent session ID
    terminateMode,
    outputs: context.outputs,
    duration: endTime - startTime,
    stepResults: context.stepResults,
    ...(context.error !== null && { error: context.error }),
    startTime,
    endTime,
  }
}
```

#### 3. Pass Signal Through stepActor via Options

**File:** `packages/opencode/src/orchestrator/actors/stepActor.ts`

Signal is passed via `ExecutorOptions`, NOT `ExecutorContext`. Ensure the stepActor passes `options` with signal to executors:

```typescript
// stepActor should pass signal in options parameter
const result = await executor.execute(step, context, {
  signal: input.signal,  // Pass signal via options (ExecutorOptions.signal)
  // ... other options
})
```

**Note**: `ExecutorOptions` already has `signal` defined in registry/types.ts:40. We just need to ensure it's passed through from the workflow engine → stepActor → executor.

Also update `ExecuteStepInput` in types.ts to include signal (if not already):

```typescript
export type ExecuteStepInput = {
  // ... existing fields ...
  readonly signal?: AbortSignal  // For cancellation propagation
}
```

### Success Criteria

- [ ] sessionID flows from executor → stepActor → workflowMachine → WorkflowResult
- [ ] WorkflowResult includes workflowSessionID at top level
- [ ] WorkflowResult.stepResults includes sessionID for each Agent step
- [ ] signal propagates from workflow → stepActor → executor via `options.signal`

---

## Testing Strategy

### Unit Tests

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.test.ts`

```typescript
describe("AgentExecutor", () => {
  it("should look up agent by agentType config", async () => {
    // Mock Agent.get
    // Execute step with agentType: "explore"
    // Verify Agent.get("explore") was called
  })

  it("should default to 'build' agent when agentType not specified", async () => {
    // Execute step without agentType
    // Verify Agent.get("build") was called
  })

  it("should throw error for unknown agent type", async () => {
    // Execute step with agentType: "nonexistent"
    // Verify AgentExecutionError is thrown with helpful message
  })

  it("should pass agent name to SessionPrompt.prompt", async () => {
    // Mock SessionPrompt.prompt
    // Execute step
    // Verify agent parameter was passed
  })

  it("should NOT delete session after execution", async () => {
    // Execute step
    // Verify Session.remove was NOT called
  })

  it("should return sessionID in output", async () => {
    // Execute step
    // Verify result.sessionID is present
  })

  it("should convert tool config to Session permissions (not deprecated tools param)", async () => {
    // Execute step with tools: { bash: false, edit: true }
    // Verify Session.create received permission array with those tools
    // Verify SessionPrompt.prompt does NOT receive tools param (deprecated)
  })

  it("should pass permission rules to Session.create denying task", async () => {
    // Execute step
    // Verify Session.create received permission array with task: deny
    // NOTE: Only "task" is denied (not todowrite/todoread) - workflow steps may need todos
  })

  it("should handle signal for cancellation via options.signal", async () => {
    // Execute step with options: { signal: abortController.signal }
    // Trigger abort on signal
    // Verify SessionPrompt.cancel was called
  })
})
```

### Integration Tests

```typescript
describe("Workflow with Custom Agents", () => {
  it("should execute workflow using custom agent from .opencode/agents/", async () => {
    // Create temp directory with .opencode/agents/test-agent.md
    // Create workflow referencing test-agent
    // Execute workflow
    // Verify agent's system prompt was used
  })

  it("should preserve sessions after workflow completes", async () => {
    // Execute workflow
    // Verify all step sessions still exist
    // Verify sessions are children of workflow session
  })

  it("should include sessionID in workflow result", async () => {
    // Execute workflow
    // Verify result.workflowSessionID exists
    // Verify result.stepResults[].sessionID exists for Agent steps
  })
})
```

### Manual Testing Steps

1. Create `.opencode/agents/test-agent.md`:
   ```markdown
   ---
   mode: subagent
   description: Test agent with read-only access
   permission:
     - permission: read
       pattern: "*"
       action: allow
     - permission: "*"
       pattern: "*"
       action: deny
   ---
   You are a test agent. You can only read files.
   ```

2. Update test workflow to use `agentType: "test-agent"`

3. Run: `bun dev workflow run "What files are in this directory?"`

4. Verify:
   - Agent only uses read tools (not edit/write)
   - Session persists after workflow completes
   - Session appears as child of workflow session in TUI

---

## Performance Considerations

- **Session Storage**: Keeping sessions increases storage use
- **Mitigation**: Future task to add workflow cleanup utilities
- **Memory**: Minimal impact - sessions are persisted to disk

---

## Type Changes

> **No Migration Needed**: This is a greenfield project with no existing users or workflows.
> We design types correctly from the start rather than adding backward compatibility layers.

- `AgentConfig.model` remains `string` format (`"provider/model"`) - parsed with `Provider.parseModel()`
- `AgentConfig.tools` is now `Record<string, boolean>` (converted to Session permissions, NOT passed to deprecated SessionPrompt.prompt tools param)
- Workflows without `agentType` will use default "build" agent
- Signal is passed via existing `ExecutorOptions.signal` (no changes to `ExecutorContext` needed)

---

## Dependencies

- TASK-01 through TASK-06 completed ✅
- OpenCode's Agent system functional ✅
- SessionPrompt.prompt() accepts agent parameter ✅

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/orchestrator/registry/executors/agentExecutor.ts` | Major rewrite of execute(), remove Session.remove(), add Agent.get(), Provider.parseModel(), defer(), use options.signal |
| `src/orchestrator/registry/types.ts` | NO CHANGES NEEDED - `ExecutorOptions` already has `signal` |
| `src/orchestrator/types.ts` | Update AgentConfig (tools as Record), ExecuteStepOutput (+sessionID), StepResult (+sessionID), WorkflowResult (+workflowSessionID), ExecuteStepInput (+signal) |
| `src/orchestrator/actors/stepActor.ts` | Pass signal via options, ensure sessionID flows through |
| `src/orchestrator/machine/workflowMachine.ts` | Update saveStepOutput to include sessionID |
| `src/orchestrator/engine/workflowEngine.ts` | Update createResult to include workflowSessionID |

---

## Implementation Order

1. Phase 1: Update agentExecutor.ts core logic (Agent.get, Provider.parseModel, Session permissions, options.signal)
2. Phase 2: Remove Session.remove() and add documentation
3. Phase 3: Update type definitions in orchestrator/types.ts (ExecuteStepOutput, StepResult, WorkflowResult, ExecuteStepInput, AgentConfig)
4. Phase 4: Update stepActor (pass signal via options), workflowMachine (capture sessionID), workflowEngine (include workflowSessionID)
5. Run typecheck: `bun turbo typecheck`
6. Manual verification with test-agent

---

## References

- Task tool pattern: `packages/opencode/src/tool/task.ts:43-165`
- Agent loading: `packages/opencode/src/agent/agent.ts:192-194`
- SessionPrompt: `packages/opencode/src/session/prompt.ts:150-179`
- defer utility: `packages/opencode/src/util/defer.ts`
- Previous tasks: `.alfred/tasks/TASK-01` through `.alfred/tasks/TASK-06`

---

## Appendix: Plan Refinements (2026-01-04)

After subagent verification against OpenCode's actual implementation, the following refinements were made:

### Refinement 1: Use Existing `options.signal` (Not New Context Field)

**Original plan**: Add `signal?: AbortSignal` to `ExecutorContext`

**Refined**: Use existing `ExecutorOptions.signal` (already defined at registry/types.ts:40)

**Rationale**: The executor signature is `execute(step, context, options)`. Signal is a runtime option, not state. `ExecutorOptions` already has signal - no need to duplicate in context.

### Refinement 2: Session Permissions Instead of Deprecated `tools` Param

**Original plan**: Pass `tools: Record<string, boolean>` to `SessionPrompt.prompt()`

**Refined**: Convert `AgentConfig.tools` to permission rules on `Session.create()`, do NOT pass `tools` to `SessionPrompt.prompt()`

**Rationale**: The `tools` parameter to `SessionPrompt.prompt()` is marked `@deprecated` in prompt.ts:98-100. The deprecation message says "tools and permissions have been merged, you can set permissions on the session itself now". Using Session permissions is the preferred, non-deprecated approach.

### Summary of Changes

| Aspect | Original | Refined |
|--------|----------|---------|
| Signal location | Add to `ExecutorContext` | Use existing `options.signal` |
| Tool restrictions | `SessionPrompt.prompt({ tools: {...} })` | `Session.create({ permission: [...] })` |
| registry/types.ts | Modify (add signal) | No changes needed |
