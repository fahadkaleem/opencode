# TASK-10: Step Configuration Schema - Implementation Plan

## Overview

Implement per-step configuration for timeout, retries, and consistent output schema. This enables workflow authors to customize step behavior while maintaining a predictable output structure across all steps.

## Current State Analysis

### What Works

| Field          | Location                   | Status                                  |
| -------------- | -------------------------- | --------------------------------------- |
| `agentType`    | `AgentConfig.agentType`    | ✅ Works, defaults to "build"           |
| `model`        | `AgentConfig.model`        | ✅ Works, "provider/model" format       |
| `systemPrompt` | `AgentConfig.systemPrompt` | ✅ Works, passed to SessionPrompt       |
| `tools`        | `AgentConfig.tools`        | ✅ Works, converted to permission rules |

### What's Defined But Not Used

| Field         | Location                  | Issue                                                 |
| ------------- | ------------------------- | ----------------------------------------------------- |
| `temperature` | `types.ts:387`            | Defined but SessionPrompt doesn't accept it           |
| `maxTokens`   | `types.ts:388`            | Defined but resolved from model limits                |
| `timeout`     | `ExecutorOptions.timeout` | Defined at `registry/types.ts:44` but not implemented |

### What's Missing

| Feature                  | Impact                                                 |
| ------------------------ | ------------------------------------------------------ |
| Per-step timeout         | Steps run indefinitely or use global timeout           |
| Per-step maxRetries      | All steps use workflow-level retry count               |
| Consistent output schema | Steps return ad-hoc `{ response, toolCalls, success }` |
| Artifacts tracking       | File modifications not extracted from tool calls       |
| Summary generation       | No truncated summary, only full response               |

### Key Discoveries

- **SessionPrompt limitation**: `src/session/prompt.ts:84-148` - PromptInput schema doesn't include temperature/maxTokens
- **Retry logic exists**: `src/flomaster/orchestrator/machine/workflowMachine.ts:320-329` - handleError state with canRetry guard
- **Retry is workflow-level**: `workflowMachine.ts:53` - `canRetry: ({ context }) => context.retryCount < context.maxRetries`
- **Context interpolation works**: `src/flomaster/orchestrator/utils/contextInterpolator.ts` - `{{stepId.field}}` syntax
- **Tool calls extracted**: `agentExecutor.ts:96-106` - extractToolCallsFromParts() gets completed tools

## Desired End State

After implementation:

1. **Steps can configure timeout**: `timeoutMs: 120000` aborts after 2 minutes
2. **Steps can configure retries**: `maxRetries: 5` allows 5 retry attempts
3. **All steps return consistent outputs**:
   ```typescript
   {
     success: boolean,      // Step completed without error
     summary: string,       // "Created 3 files, modified 2"
     artifacts: string[],   // ["/src/foo.ts", "/src/bar.ts"]
     response: string       // Full agent text response
   }
   ```
4. **Downstream steps can reference**: `{{research.summary}}`, `{{plan.artifacts}}`

## What We're NOT Doing

- ❌ Per-step `temperature` (SessionPrompt doesn't support it)
- ❌ Per-step `maxTokens` (resolved from model limits)
- ❌ Retry backoff configuration (keeping simple)
- ❌ Output schema validation with Zod (future task)
- ❌ Workflow JSON file loading (TASK-11)
- ❌ Modifying OpenCode core files outside `src/flomaster/`

## Implementation Approach

**Strategy**: Make minimal, targeted changes to existing code paths:

1. Update type definitions (AgentConfig)
2. Implement timeout in agentExecutor via AbortController
3. Modify XState guard to read per-step maxRetries
4. Enhance output extraction to include summary/artifacts
5. Update workflow parser for new fields
6. Update SDLC workflow as example

---

## Phase 1: Update Type Definitions

### Overview

Clean up AgentConfig by removing unsupported fields and adding new ones. Define the consistent StepOutput type.

### Changes Required

#### 1. Update AgentConfig Type

**File:** `src/flomaster/orchestrator/types.ts`

**Current** (lines 382-395):

```typescript
export type AgentConfig = {
  readonly agentType: string
  readonly model?: string
  readonly temperature?: number // REMOVE - not supported
  readonly maxTokens?: number // REMOVE - not supported
  readonly systemPrompt?: string
  readonly tools?: Record<string, boolean>
}
```

**New:**

```typescript
export type AgentConfig = {
  readonly agentType: string
  readonly model?: string
  readonly systemPrompt?: string
  readonly tools?: Record<string, boolean>
  // New fields
  readonly timeoutMs?: number // Step timeout in milliseconds
  readonly maxRetries?: number // Max retry attempts for this step
}
```

#### 2. Add StepOutput Type

**File:** `src/flomaster/orchestrator/types.ts`

**Add after AgentConfig:**

```typescript
/**
 * Consistent output schema returned by all step executors.
 * Enables predictable downstream consumption via {{stepId.field}} interpolation.
 */
export type StepOutput = {
  /** Whether the step completed successfully */
  readonly success: boolean
  /** Human-readable summary of what was done (e.g., "Created 3 files") */
  readonly summary: string
  /** File paths created or modified by this step */
  readonly artifacts: readonly string[]
  /** Full agent text response (for downstream interpolation) */
  readonly response: string
}
```

#### 3. Add WorkflowDefaults Type

**File:** `src/flomaster/orchestrator/types.ts`

**Add after StepOutput:**

```typescript
/**
 * Default configuration values for all steps in a workflow.
 * Individual steps can override these values.
 */
export type WorkflowDefaults = {
  /** Default timeout for all steps (default: 300000ms = 5 minutes) */
  readonly timeoutMs: number
  /** Default max retries for all steps (default: 3) */
  readonly maxRetries: number
  /** Default model for all steps (optional) */
  readonly model?: string
}

export const DEFAULT_WORKFLOW_DEFAULTS: WorkflowDefaults = {
  timeoutMs: 300000, // 5 minutes
  maxRetries: 3,
}
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`
- [x] No import errors in dependent files

#### Manual Verification

- [x] Types are correctly exported from `types.ts`

---

## Phase 2: Implement Per-Step Timeout

### Overview

Add timeout handling to agentExecutor using AbortController. When timeout expires, abort the SessionPrompt call.

### Changes Required

#### 1. Update agentExecutor.ts

**File:** `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`

**Add timeout handling in execute() method (around line 140):**

```typescript
async execute(
  step: ParsedStep,
  context: ExecutorContext,
  options?: ExecutorOptions,
): Promise<ExecuteStepOutput> {
  const config = step.config
  if (config.type !== "Agent") {
    throw new AgentExecutionError(`Invalid config type for Agent executor: ${config.type}`, step.id)
  }

  // Get timeout from step config, fall back to options, then default
  const timeoutMs = config.config.timeoutMs ?? options?.timeout ?? 300000

  // Create abort controller for timeout
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error(`Step timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  // Combine with external signal if provided
  const combinedSignal = options?.signal
    ? combineAbortSignals(options.signal, timeoutController.signal)
    : timeoutController.signal

  try {
    // ... rest of execution logic with combinedSignal ...

    // Clear timeout on success
    clearTimeout(timeoutId)

    return result
  } catch (error) {
    clearTimeout(timeoutId)

    // Check if it was a timeout
    if (timeoutController.signal.aborted) {
      throw new AgentExecutionError(
        `Step "${step.displayName}" timed out after ${timeoutMs}ms`,
        step.id,
        error instanceof Error ? error : undefined,
      )
    }

    throw error
  }
}
```

**Add helper function at top of file:**

```typescript
/**
 * Combines multiple AbortSignals into one.
 * The combined signal aborts when ANY of the input signals abort.
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason)
      },
      { once: true },
    )
  }

  return controller.signal
}
```

**Update the abort signal usage (around line 222-228):**

Replace:

```typescript
if (options?.signal) {
  options.signal.addEventListener("abort", cancel)
}
```

With:

```typescript
combinedSignal.addEventListener("abort", cancel, { once: true })
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`
- [x] Existing tests pass: `cd packages/opencode && bun test`

#### Manual Verification

- [ ] Run workflow with short timeout and verify it aborts:
  ```bash
  # Modify test-workflow.ts to have timeoutMs: 1000 (1 second)
  bun dev workflow run "Count to 100 slowly"
  # Should fail with timeout error
  ```

---

## Phase 3: Implement Per-Step maxRetries

### Overview

Modify the XState machine's `canRetry` guard to read maxRetries from the current step's config instead of workflow-level context.

### Changes Required

#### 1. Update canRetry Guard

**File:** `src/flomaster/orchestrator/machine/workflowMachine.ts`

**Current** (line 53):

```typescript
canRetry: ({ context }) => context.retryCount < context.maxRetries,
```

**New:**

```typescript
canRetry: ({ context }) => {
  // Get maxRetries from current step config, fall back to workflow default
  const stepConfig = context.currentStepData?.config
  const stepMaxRetries = stepConfig?.type === "Agent"
    ? (stepConfig.config as AgentConfig).maxRetries
    : undefined
  const maxRetries = stepMaxRetries ?? context.maxRetries

  return context.retryCount < maxRetries
},
```

**Add import at top of file:**

```typescript
import type { AgentConfig } from "../types.js"
```

#### 2. Update Guards File (if separate)

**File:** `src/flomaster/orchestrator/machine/guards.ts`

**Update canRetry function** (around line 178-180):

```typescript
import type { AgentConfig } from "../types.js"

export function canRetry({ context }: GuardParams): boolean {
  // Get maxRetries from current step config, fall back to workflow default
  const stepConfig = context.currentStepData?.config
  const stepMaxRetries = stepConfig?.type === "Agent" ? (stepConfig.config as AgentConfig).maxRetries : undefined
  const maxRetries = stepMaxRetries ?? context.maxRetries

  return context.retryCount < maxRetries
}
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`

#### Manual Verification

- [ ] Test step with maxRetries: 0 fails immediately on error
- [ ] Test step with maxRetries: 5 retries up to 5 times

---

## Phase 4: Enhance Output Extraction

### Overview

Update agentExecutor to return consistent `StepOutput` structure with summary and artifacts extraction.

### Changes Required

#### 1. Add Output Extraction Helpers

**File:** `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`

**Add after existing extract functions (around line 106):**

```typescript
/**
 * Extracts file artifacts from completed tool calls.
 * Looks for edit, write, and patch tools that modified files.
 */
function extractArtifactsFromToolCalls(toolCalls: Array<{ name: string; args: unknown; result: unknown }>): string[] {
  const artifacts: string[] = []

  for (const tc of toolCalls) {
    // Extract file paths from edit/write tools
    if (tc.name === "edit" || tc.name === "write") {
      const args = tc.args as { file_path?: string; filePath?: string } | undefined
      const filePath = args?.file_path ?? args?.filePath
      if (filePath && !artifacts.includes(filePath)) {
        artifacts.push(filePath)
      }
    }

    // Extract from patch results (file modifications)
    if (tc.name === "patch" || tc.result) {
      const result = tc.result as { path?: string; file?: string } | undefined
      const filePath = result?.path ?? result?.file
      if (filePath && !artifacts.includes(filePath)) {
        artifacts.push(filePath)
      }
    }
  }

  return artifacts
}

/**
 * Generates a summary from the response and artifacts.
 * Truncates long responses and adds artifact count.
 */
function generateSummary(response: string, artifacts: string[]): string {
  const MAX_SUMMARY_LENGTH = 200

  // Truncate response for summary
  let summary = response.trim()
  if (summary.length > MAX_SUMMARY_LENGTH) {
    summary = summary.substring(0, MAX_SUMMARY_LENGTH).trim() + "..."
  }

  // Add artifact info if present
  if (artifacts.length > 0) {
    const artifactInfo =
      artifacts.length === 1 ? `Modified 1 file: ${artifacts[0]}` : `Modified ${artifacts.length} files`
    summary = artifactInfo + (summary ? `. ${summary}` : "")
  }

  return summary || "Step completed"
}
```

#### 2. Update Return Statement

**File:** `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`

**Replace current return block (around lines 293-302):**

```typescript
// Current:
return {
  stepId: step.id,
  sessionID: session.id,
  outputs: {
    response,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    success: true,
  },
  complete: true,
}
```

**New:**

```typescript
// Extract artifacts from tool calls
const artifacts = extractArtifactsFromToolCalls(toolCalls)

// Generate summary
const summary = generateSummary(response, artifacts)

return {
  stepId: step.id,
  sessionID: session.id,
  outputs: {
    success: true,
    summary,
    artifacts,
    response,
    // Keep toolCalls for debugging/advanced use
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  },
  complete: true,
}
```

#### 3. Update Dry-Run Return

**File:** `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`

**Update dry-run return (around lines 165-173):**

```typescript
return {
  stepId: step.id,
  outputs: {
    success: true,
    summary: `[DRY-RUN] Would execute ${step.displayName} with agent "${agent.name}"`,
    artifacts: [],
    response: `[DRY-RUN] Agent ${step.displayName} (${agent.name}) would execute with prompt: ${prompt.substring(0, 100)}...`,
  },
  complete: true,
}
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`

#### Manual Verification

- [ ] Run SDLC workflow and verify outputs have summary/artifacts:
  ```bash
  bun dev workflow run --workflow sdlc "Add a hello function"
  # Check .flomaster/executions/*/context.json for proper output structure
  ```

---

## Phase 5: Update Workflow Parser

### Overview

Update stepParser to parse the new config fields (timeoutMs, maxRetries) and ignore removed fields.

### Changes Required

#### 1. Update extractAgentConfig Function

**File:** `src/flomaster/orchestrator/parser/stepParser.ts`

**Update extractAgentConfig (around lines 184-210):**

```typescript
function extractAgentConfig(step: StepData): AgentConfig {
  const template = step.data.node.template

  const agentTypeField = getTemplateField(template, "agent_type")
  const modelField = getTemplateField(template, "model")
  const systemPromptField = getTemplateField(template, "system_prompt")
  const toolsField = getTemplateField(template, "tools")
  // New fields
  const timeoutField = getTemplateField(template, "timeout_ms")
  const maxRetriesField = getTemplateField(template, "max_retries")

  const model = modelField?.value as string | undefined
  const systemPrompt = systemPromptField?.value as string | undefined
  const tools = toolsField?.value as Record<string, boolean> | undefined
  const timeoutMs = timeoutField?.value as number | undefined
  const maxRetries = maxRetriesField?.value as number | undefined

  return {
    agentType: (agentTypeField?.value as string | undefined) ?? "build",
    ...(model !== undefined && { model }),
    ...(systemPrompt !== undefined && { systemPrompt }),
    ...(tools !== undefined && { tools }),
    ...(timeoutMs !== undefined && { timeoutMs }),
    ...(maxRetries !== undefined && { maxRetries }),
  }
}
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`

#### Manual Verification

- [x] Parser correctly extracts new fields from workflow JSON

---

## Phase 6: Update SDLC Workflow Example

### Overview

Update the SDLC workflow to demonstrate the new configuration options.

### Changes Required

#### 1. Update sdlc-workflow.ts

**File:** `src/flomaster/orchestrator/workflows/sdlc-workflow.ts`

**Add timeout and retry config to steps:**

```typescript
// Research step - long timeout, few retries (read-only, expensive)
{
  id: "research",
  template: {
    agent_type: { value: "research-agent" },
    timeout_ms: { value: 180000 },  // 3 minutes
    max_retries: { value: 1 },       // Only 1 retry
    // ... rest of config
  }
}

// Plan step - medium timeout, some retries
{
  id: "plan",
  template: {
    agent_type: { value: "plan-agent" },
    timeout_ms: { value: 120000 },  // 2 minutes
    max_retries: { value: 2 },       // 2 retries
    // ... rest of config
  }
}

// Implement step - long timeout, more retries (most likely to need retry)
{
  id: "implement",
  template: {
    agent_type: { value: "implement-agent" },
    timeout_ms: { value: 300000 },  // 5 minutes
    max_retries: { value: 3 },       // 3 retries
    // ... rest of config
  }
}

// Review step - short timeout, few retries (read-only)
{
  id: "review",
  template: {
    agent_type: { value: "review-agent" },
    timeout_ms: { value: 120000 },  // 2 minutes
    max_retries: { value: 1 },       // 1 retry
    // ... rest of config
  }
}
```

### Success Criteria

#### Automated Verification

- [x] Type checking passes: `bun turbo typecheck`
- [ ] SDLC workflow executes: `bun dev workflow run --workflow sdlc --dry-run "Test"`

#### Manual Verification

- [ ] Full SDLC workflow completes with real execution
- [ ] Step outputs contain proper summary/artifacts structure

---

## Testing Strategy

### Unit Tests

**To be added in TASK-12:**

- `agentExecutor.test.ts`: Test timeout handling, output extraction
- `workflowMachine.test.ts`: Test per-step retry logic
- `stepParser.test.ts`: Test parsing new config fields

### Integration Tests

**Manual testing for now:**

1. Run test workflow with various timeout values
2. Force errors to test retry behavior
3. Verify output structure in state files

### Manual Testing Steps

1. **Test timeout**:

   ```bash
   # Create a step that takes too long
   bun dev workflow run "Count to 1000 one by one, very slowly"
   # With timeoutMs: 5000, should fail after 5 seconds
   ```

2. **Test retries**:

   ```bash
   # Force an error (e.g., invalid agent type temporarily)
   # Verify retry attempts in logs
   ```

3. **Test output structure**:
   ```bash
   bun dev workflow run --workflow sdlc "Add a hello function"
   cat .flomaster/executions/*/context.json | jq '.research'
   # Should show: { success, summary, artifacts, response }
   ```

## Performance Considerations

- Timeout adds minimal overhead (just setTimeout/clearTimeout)
- Retry logic already exists, modification is lightweight
- Output extraction iterates tool calls once (O(n) where n = tool calls)
- Summary truncation is O(1) substring operation

## Migration Notes

- **Backward compatible**: Existing workflows without new fields use defaults
- **No data migration**: State files don't need changes
- **Type changes**: Remove temperature/maxTokens from AgentConfig (cleanup only)

## References

- Task file: `.alfred/tasks/TASK-10/task.md`
- Requirements: `design/01-overview/02-requirements-overview.md` (HL-CF-001)
- Architecture: `design/01-overview/04-opencode-architecture.md`
- Current types: `src/flomaster/orchestrator/types.ts:382-395`
- Agent executor: `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`
- XState machine: `src/flomaster/orchestrator/machine/workflowMachine.ts:53`
- Step parser: `src/flomaster/orchestrator/parser/stepParser.ts:184-210`
