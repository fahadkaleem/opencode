# TASK-06: Remove AgentAdapter and Use Session/SessionPrompt Directly

## Summary

Remove the `AgentAdapter` abstraction layer and have `agentExecutor.ts` call OpenCode's `Session` and `SessionPrompt` modules directly. This aligns with how other parts of the codebase (task tool, github.ts) use sessions.

## Why This Change?

### The Problem with AgentAdapter

The AgentAdapter was created as an abstraction layer between the orchestrator and OpenCode's session system. However, after analyzing the codebase, we found that:

1. **It's unnecessary overhead** - Other parts of OpenCode (task tool, github.ts, server routes) call `Session.create()` and `SessionPrompt.prompt()` directly without any adapter layer.

2. **It duplicates patterns** - The adapter reimplements event-to-AsyncIterable conversion that we don't need. `SessionPrompt.prompt()` already waits for completion.

3. **It adds complexity** - The adapter has its own types, its own streaming implementation, and its own session management - all of which duplicate what OpenCode already provides.

### How Others Do It (The Pattern to Follow)

**task.ts (lines 51, 124-139):**
```typescript
// Create session directly
const session = await Session.create({
  parentID: ctx.sessionID,
  title: params.description + ` (@${agent.name} subagent)`,
})

// Prompt directly - no streaming, just wait for result
const result = await SessionPrompt.prompt({
  messageID,
  sessionID: session.id,
  model: { modelID, providerID },
  agent: agent.name,
  parts: promptParts,
})

// Extract text from result
const text = result.parts.findLast((x) => x.type === "text")?.text ?? ""
```

**github.ts (lines 518, 873-906):**
```typescript
// Same pattern - direct Session.create() and SessionPrompt.prompt()
session = await Session.create({})

const result = await SessionPrompt.prompt({
  sessionID: session.id,
  messageID: Identifier.ascending("message"),
  model: { providerID, modelID },
  parts: [{ id: Identifier.ascending("part"), type: "text", text: message }],
})
```

This is simple, direct, and matches how OpenCode is designed to work.

## Scope

### In Scope

- Delete `orchestrator/adapter/` directory entirely
- Rewrite `agentExecutor.ts` to use `Session` and `SessionPrompt` directly
- Update `registry/types.ts` to remove `AgentAdapter` dependency
- Update `engine/factory.ts` to not require adapter
- Update `orchestrator/index.ts` to remove adapter exports

### Out of Scope

- Changing other executors (Loop, Conditional, etc.)
- Changing the executor interface
- Adding new functionality

## Implementation

### Step 1: Update ExecutorDependencies Type

**File:** `packages/opencode/src/orchestrator/registry/types.ts`

Remove the `adapter` field and add a `directory` field instead:

```typescript
// BEFORE
export type ExecutorDependencies = {
  readonly adapter?: AgentAdapter
  readonly loadWorkflow?: (nameOrId: string) => Promise<unknown>
  readonly executeWorkflow?: (workflow: unknown, taskId: string, inputs: Record<string, unknown>) => Promise<unknown>
}

// AFTER
export type ExecutorDependencies = {
  /** Working directory for session context */
  readonly directory?: string
  readonly loadWorkflow?: (nameOrId: string) => Promise<unknown>
  readonly executeWorkflow?: (workflow: unknown, taskId: string, inputs: Record<string, unknown>) => Promise<unknown>
}
```

Also remove the import:
```typescript
// DELETE THIS LINE
import type { AgentAdapter } from "../adapter/index.js"
```

---

### Step 2: Rewrite agentExecutor.ts

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

Replace the adapter-based implementation with direct Session/SessionPrompt calls:

```typescript
/**
 * Agent Step Executor
 *
 * Executes Agent steps using OpenCode's Session and SessionPrompt directly.
 * Follows the pattern established by task.ts and github.ts.
 */

import { Log } from "../../../util/log.js"
import { Session } from "../../../session/index.js"
import { SessionPrompt } from "../../../session/prompt.js"
import { Identifier } from "../../../id/id.js"
import type { AgentConfig, ExecuteStepOutput, ParsedStep } from "../../types.js"
import type { ExecutorContext, ExecutorDependencies, ExecutorOptions, StepExecutor } from "../types.js"

const log = Log.create({ service: "AgentExecutor" })

/**
 * Error thrown when agent execution fails.
 */
export class AgentExecutionError extends Error {
  readonly stepId: string
  override readonly cause?: Error

  constructor(message: string, stepId: string, cause?: Error) {
    super(message)
    this.name = "AgentExecutionError"
    this.stepId = stepId
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}

/**
 * Result from agent execution.
 */
export type AgentExecutionResult = {
  readonly response: string
  readonly toolCalls: Array<{
    readonly name: string
    readonly args: unknown
    readonly result: unknown
  }>
}

/**
 * Build a prompt from agent config and inputs.
 */
function buildAgentPrompt(config: AgentConfig, inputs: Record<string, unknown>): string {
  const template = (inputs["prompt"] ?? inputs["template"] ?? inputs["message"]) as string | undefined

  if (template !== undefined) {
    let result = template
    for (const [key, value] of Object.entries(inputs)) {
      const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g")
      result = result.replace(pattern, String(value ?? ""))
    }
    return result
  }

  return `Execute agent "${config.agentType}" with inputs:\n${JSON.stringify(inputs, null, 2)}`
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Extract text content from message parts.
 */
function extractTextFromParts(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
}

/**
 * Extract tool calls from message parts.
 */
function extractToolCallsFromParts(
  parts: Array<{ type: string; tool?: string; state?: { status: string; input?: unknown; output?: unknown } }>,
): Array<{ name: string; args: unknown; result: unknown }> {
  return parts
    .filter((p) => p.type === "tool" && p.state?.status === "completed")
    .map((p) => ({
      name: p.tool ?? "unknown",
      args: p.state?.input ?? {},
      result: p.state?.output ?? null,
    }))
}

/**
 * Create an agent step executor that uses Session/SessionPrompt directly.
 *
 * @param directory - Working directory for session context
 * @returns StepExecutor for Agent steps
 *
 * @example
 * ```typescript
 * const agentExecutor = createAgentExecutor(process.cwd());
 * registry.register(agentExecutor, 'custom');
 * ```
 */
export function createAgentExecutor(directory: string): StepExecutor<"Agent"> {
  return {
    type: "Agent",

    validate(step: ParsedStep) {
      const errors: string[] = []
      const warnings: string[] = []

      if (step.config.type !== "Agent") {
        errors.push(`Invalid config type: expected 'Agent', got '${step.config.type}'`)
      } else {
        const config = step.config.config
        if (config.agentType === "") {
          warnings.push("agentType not specified, using default")
        }
      }

      return { valid: errors.length === 0, errors, warnings }
    },

    async execute(step: ParsedStep, context: ExecutorContext, options?: ExecutorOptions): Promise<ExecuteStepOutput> {
      log.info("Starting agent execution", { stepId: step.id, stepName: step.displayName })

      const config = step.config
      if (config.type !== "Agent") {
        throw new AgentExecutionError(`Invalid config type for agent step: ${config.type}`, step.id)
      }

      // Dry-run mode
      if (context.dryRun) {
        log.info("Dry-run mode: returning mock response", { stepId: step.id })
        return {
          stepId: step.id,
          outputs: {
            response: `[DRY-RUN] Agent ${step.displayName} would execute`,
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

      try {
        // Create session directly (following task.ts pattern)
        log.info("Creating session", { stepId: step.id, directory })
        const session = await Session.create({
          title: `Agent: ${step.displayName}`,
        })
        log.info("Session created", { stepId: step.id, sessionId: session.id })

        try {
          const prompt = buildAgentPrompt(config.config, stepInputs)
          log.info("Built prompt", { stepId: step.id, promptLength: prompt.length })

          const messageID = Identifier.ascending("message")

          // Determine model
          const model = config.config.model !== undefined
            ? { providerID: "anthropic", modelID: config.config.model }
            : undefined

          // Call SessionPrompt.prompt directly (following task.ts pattern)
          log.info("Calling SessionPrompt.prompt", { stepId: step.id, model: model?.modelID })
          const result = await SessionPrompt.prompt({
            messageID,
            sessionID: session.id,
            ...(model !== undefined && { model }),
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
            result.parts as Array<{ type: string; tool?: string; state?: { status: string; input?: unknown; output?: unknown } }>,
          )

          log.info("Execution completed", {
            stepId: step.id,
            responseLength: response.length,
            toolCallCount: toolCalls.length,
          })

          return {
            stepId: step.id,
            outputs: {
              response,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              success: true,
            },
            complete: true,
          }
        } finally {
          // Clean up session
          log.debug("Removing session", { stepId: step.id, sessionId: session.id })
          await Session.remove(session.id).catch((e) => {
            log.warn("Failed to remove session", { stepId: step.id, error: String(e) })
          })
        }
      } catch (error) {
        log.error("Execution failed", {
          stepId: step.id,
          error: error instanceof Error ? error.message : String(error),
        })
        if (error instanceof AgentExecutionError) {
          throw error
        }
        throw new AgentExecutionError(
          `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
          step.id,
          error instanceof Error ? error : undefined,
        )
      }
    },
  }
}

/**
 * Create an agent executor from dependencies.
 */
export function createAgentExecutorFromDependencies(dependencies: ExecutorDependencies): StepExecutor<"Agent"> | null {
  if (dependencies.directory == null) {
    return null
  }
  return createAgentExecutor(dependencies.directory)
}

/**
 * Placeholder agent executor for when no directory is available.
 */
export const placeholderAgentExecutor: StepExecutor<"Agent"> = {
  type: "Agent",

  execute(step: ParsedStep, _context: ExecutorContext, _options?: ExecutorOptions): Promise<ExecuteStepOutput> {
    return Promise.resolve({
      stepId: step.id,
      outputs: {
        response: `Agent ${step.displayName} executed (no directory configured)`,
        success: true,
        _placeholder: true,
      },
      complete: true,
    })
  },
}
```

---

### Step 3: Update factory.ts

**File:** `packages/opencode/src/orchestrator/engine/factory.ts`

Change from accepting `adapter` to accepting `directory`:

```typescript
/**
 * Workflow Engine Factory
 *
 * Factory functions for creating fully-wired workflow engines.
 */

import { createStepExecutorRegistry, type StepExecutorRegistry } from "../registry/stepExecutorRegistry.js"
import type { StepExecutorRegistryConfig } from "../registry/types.js"
import { DefaultWorkflowEngine, type WorkflowEngineConfig } from "./workflowEngine.js"

/**
 * Options for creating a workflow engine.
 */
export type CreateWorkflowEngineOptions = {
  /** Working directory for session context */
  directory?: string
  /** Workflow engine configuration */
  engineConfig?: Omit<WorkflowEngineConfig, "executorRegistry">
  /** Registry configuration */
  registryConfig?: StepExecutorRegistryConfig
}

/**
 * Result of creating a workflow engine.
 */
export type WorkflowEngineBundle = {
  engine: DefaultWorkflowEngine
  registry: StepExecutorRegistry
}

/**
 * Create a fully-wired workflow engine.
 *
 * @param options - Factory options
 * @returns Bundle containing the engine and registry
 *
 * @example
 * ```typescript
 * const { engine } = await createWorkflowEngine({ directory: process.cwd() });
 * const workflow = await engine.loadWorkflow('my-workflow');
 * const result = await engine.executeWorkflow(workflow, 'task-123');
 * ```
 */
export async function createWorkflowEngine(options: CreateWorkflowEngineOptions = {}): Promise<WorkflowEngineBundle> {
  const { directory, engineConfig, registryConfig } = options

  const registry = createStepExecutorRegistry(registryConfig)
  await registry.initialize({ directory })

  const engine = new DefaultWorkflowEngine({
    ...engineConfig,
    executorRegistry: registry,
  })

  return { engine, registry }
}

/**
 * Create a workflow engine without directory (placeholder executors).
 */
export async function createWorkflowEngineWithoutAdapter(
  options: Omit<CreateWorkflowEngineOptions, "directory"> = {},
): Promise<WorkflowEngineBundle> {
  return createWorkflowEngine(options)
}

/**
 * Create just the registry, initialized with a directory.
 */
export async function createInitializedRegistry(
  directory?: string,
  config?: StepExecutorRegistryConfig,
): Promise<StepExecutorRegistry> {
  const registry = createStepExecutorRegistry(config)
  await registry.initialize({ directory })
  return registry
}
```

---

### Step 4: Update stepExecutorRegistry.ts

**File:** `packages/opencode/src/orchestrator/registry/stepExecutorRegistry.ts`

Update the `initialize` method to accept `directory` instead of `adapter`:

Find this section and update:
```typescript
// BEFORE
async initialize(dependencies: { adapter?: AgentAdapter }): Promise<void> {
  this.dependencies = { adapter: dependencies.adapter }
  // ...
}

// AFTER
async initialize(dependencies: { directory?: string }): Promise<void> {
  this.dependencies = { directory: dependencies.directory }
  // ...
}
```

---

### Step 5: Delete adapter directory

**Delete entire directory:**
```
packages/opencode/src/orchestrator/adapter/
├── agent-adapter.ts      # DELETE
├── agent-adapter.test.ts # DELETE
├── types.ts              # DELETE
└── index.ts              # DELETE
```

---

### Step 6: Update orchestrator/index.ts

**File:** `packages/opencode/src/orchestrator/index.ts`

Remove adapter exports:

```typescript
// DELETE THIS LINE
export * from "./adapter/index.js"
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `orchestrator/adapter/` | DELETE | Remove entire directory (4 files) |
| `registry/types.ts` | MODIFY | Remove `AgentAdapter` import, change `adapter` to `directory` |
| `registry/executors/agentExecutor.ts` | REWRITE | Use Session/SessionPrompt directly |
| `registry/stepExecutorRegistry.ts` | MODIFY | Update initialize() signature |
| `engine/factory.ts` | MODIFY | Change from `adapter` to `directory` parameter |
| `orchestrator/index.ts` | MODIFY | Remove adapter exports |

## Success Criteria

- [ ] `adapter/` directory is deleted
- [ ] `agentExecutor.ts` uses `Session.create()` and `SessionPrompt.prompt()` directly
- [ ] No imports from `adapter/` anywhere in orchestrator
- [ ] `bun turbo typecheck` passes for non-test files
- [ ] Factory accepts `directory` instead of `adapter`
- [ ] Pattern matches `task.ts` usage of Session/SessionPrompt

## What's NOT Changing

- The overall executor interface (`StepExecutor`)
- How other executors work (Loop, Conditional, etc.)
- The workflow engine itself
- The XState state machine
- The workflow parser

## Dependencies

- TASK-03 must be reverted/updated (it created the adapter)

## Order of Operations

Execute in this order to avoid broken intermediate states:

1. Update `registry/types.ts` (change type)
2. Rewrite `agentExecutor.ts` (implement new pattern)
3. Update `stepExecutorRegistry.ts` (update initialize)
4. Update `engine/factory.ts` (change parameter)
5. Update `orchestrator/index.ts` (remove export)
6. Delete `adapter/` directory
7. Run `bun turbo typecheck` to verify

## Manual Verification

After completing, you can verify by:

1. Check no adapter imports: `grep -r "adapter" packages/opencode/src/orchestrator/`
2. Run typecheck: `bun turbo typecheck --filter=opencode`
3. Verify Session import exists in agentExecutor.ts

---

## ADDENDUM: Parent-Child Session Architecture (Follow-up Work)

> **Note:** This section describes additional changes needed AFTER TASK-06 is complete.
> This was identified during review and should be implemented as TASK-07.

### The Problem

TASK-06 creates sessions for each agent step, but they are **orphan sessions** with no parent:

```typescript
// Current (TASK-06) - Creates isolated sessions
const session = await Session.create({
  title: `Agent: ${step.displayName}`,
  // No parentID - this is wrong!
})
```

### How OpenCode Subagents Actually Work

Looking at `task.ts` (the Task tool that spawns subagents):

```typescript
// task.ts:51-52 - The correct pattern
return await Session.create({
  parentID: ctx.sessionID,  // ← KEY: Links child to parent
  title: params.description + ` (@${agent.name} subagent)`,
})
```

This creates a **parent-child hierarchy**:
- Parent session = The main conversation
- Child sessions = Each subagent task

### What Workflows Should Look Like

```
Workflow Session (parent - the "main chat")
│
├── Step 1: "Plan Feature" (child session, parentID = workflow)
│   └── Messages: [user prompt, assistant response, tool calls...]
│
├── Step 2: "Implement Code" (child session, parentID = workflow)
│   └── Messages: [user prompt, assistant response, tool calls...]
│
└── Step 3: "Run Tests" (child session, parentID = workflow)
    └── Messages: [user prompt, assistant response, tool calls...]
```

This matches how the TUI displays sessions - parent sessions show their children in the sidebar.

### What Needs to Change

#### 1. WorkflowEngine creates parent session on executeWorkflow()

```typescript
// In workflowEngine.ts executeWorkflow()
async executeWorkflow(workflow, taskId, options) {
  // Create parent session for the entire workflow
  const workflowSession = await Session.create({
    title: `Workflow: ${workflow.name}`,
  })

  // Pass session ID through execution context
  // ... rest of execution with workflowSessionID available
}
```

#### 2. ExecutorContext includes workflowSessionID

```typescript
// In registry/types.ts
export type ExecutorContext = {
  readonly outputs: Readonly<Record<string, Record<string, unknown>>>
  readonly variables: Readonly<Record<string, unknown>>
  readonly dryRun: boolean
  readonly loopStates: ReadonlyMap<string, LoopState>
  readonly workflowSessionID?: string  // ← ADD THIS
}
```

#### 3. agentExecutor uses parentID

```typescript
// In agentExecutor.ts execute()
const session = await Session.create({
  parentID: context.workflowSessionID,  // ← Links to workflow parent
  title: `${step.displayName} (@agent subagent)`,
})
```

### Files to Modify (TASK-07)

| File | Change |
|------|--------|
| `registry/types.ts` | Add `workflowSessionID` to `ExecutorContext` |
| `engine/workflowEngine.ts` | Create parent session in `executeWorkflow()`, pass ID to context |
| `machine/workflowMachine.ts` | Include `workflowSessionID` in machine context |
| `registry/executors/agentExecutor.ts` | Use `context.workflowSessionID` as `parentID` |

### Why This Matters

1. **Visibility** - Users see all workflow steps as children in the TUI sidebar
2. **Isolation** - Each step has fresh context (no context rot)
3. **Traceability** - Can trace which steps belong to which workflow run
4. **Consistency** - Same pattern as Task tool subagents
5. **History** - Workflow parent session preserves the execution record

### Not Deleting Child Sessions

With parent-child hierarchy, we may want to **keep** child sessions after workflow completes (instead of `Session.remove()`). This preserves the execution history for debugging and auditing.

```typescript
// Maybe change this in agentExecutor.ts:
// await Session.remove(session.id)  // Don't delete if we want history

// Or make it configurable:
if (!options?.preserveHistory) {
  await Session.remove(session.id)
}
```

### Summary

| Aspect | TASK-06 (Current) | TASK-07 (Needed) |
|--------|-------------------|------------------|
| Session creation | Orphan sessions | Parent-child hierarchy |
| Workflow session | None | Created at workflow start |
| Step sessions | Independent | Children of workflow session |
| TUI visibility | Steps hidden | Steps visible as children |
| Pattern | Custom | Matches task.ts subagents |
