# TASK-13: OpenCode TUI Workflow Integration - Implementation Plan

## Overview

Integrate FloMaster workflow orchestration into the OpenCode TUI, enabling users to launch and monitor workflows directly from the terminal interface. This plan prioritizes **clean package separation** to allow upstream OpenCode updates without conflicts.

## Current State Analysis

### What Exists

**In FloMaster (`packages/flomaster/`):**

- WorkflowEngine with full execution logic
- StateManager with file-based persistence (`.flomaster/executions/`)
- CLI commands: run, list, inspect, resume, validate, show
- Parent-child session model (workflow → step sessions)
- Workflow definitions in `.flomaster/workflows/`

**In OpenCode (`packages/opencode/`):**

- TUI with SolidJS components
- Sidebar panels: MCP, LSP, Todo, Modified Files
- Dialog system with `DialogSelect` for lists
- Slash command system (`/compact`, `/new`, `/agent`, etc.)
- State sync via SSE events + sync.tsx store
- Session navigation (parent-child support exists)

### Key Discoveries

- `sidebar.tsx:23-28` - Expanded state store pattern for collapsible panels
- `dialog-select.tsx:49` - Reusable list selection component
- `autocomplete.tsx:328-466` - TUI slash command definitions
- `sync.tsx:102-265` - Event handling switch statement for state updates
- WorkflowEngine already emits events but not via Bus (direct callbacks)

## Desired End State

After implementation:

1. User types `/workflow` → Dialog shows available workflows
2. User selects workflow → Prompt dialog → Workflow starts
3. Sidebar shows "Workflows" panel with execution progress
4. TUI auto-navigates between step sessions as they complete
5. `/continue` resumes paused workflows
6. Works whether workflow started via TUI or CLI

**Verification:**

- Run `bun dev` in opencode, type `/workflow`, select sdlc, enter prompt
- Watch sidebar update as steps progress
- Verify auto-switch between step sessions
- Test `/continue` after interruption

## What We're NOT Doing

- Visual workflow builder/editor
- Workflow definition management (create/edit)
- Complex loop/conditional visualization in sidebar
- Desktop app integration
- Modifying core OpenCode files unnecessarily

## Implementation Approach

**Principle: Minimal OpenCode Footprint**

All business logic stays in `packages/flomaster/`. OpenCode changes are limited to:

1. Event type definitions (for SDK generation)
2. Sync store additions (workflow state)
3. New TUI components (dialog, sidebar panel)
4. Slash command registration

This ensures upstream OpenCode merges remain clean.

---

## Phase 1: Workflow Events & Bus Integration

### Overview

Define workflow events and integrate with OpenCode's Bus system so the TUI can receive real-time updates.

### Changes Required

#### 1. Define Workflow Events

**File:** `packages/flomaster/src/orchestrator/events.ts` (NEW)

```typescript
/**
 * Workflow Bus Events
 *
 * Events published during workflow execution for TUI integration.
 */

import { BusEvent } from "opencode/bus/bus-event"
import { z } from "zod"

// Step status for UI display
const stepStatusSchema = z.object({
  stepId: z.string(),
  displayName: z.string(),
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "SKIPPED"]),
  sessionId: z.string().optional(),
})

// Execution summary for sidebar
const executionSummarySchema = z.object({
  id: z.string(),
  workflowName: z.string(),
  status: z.enum(["CREATED", "RUNNING", "PAUSED", "COMPLETED", "FAILED", "CANCELLED"]),
  parentSessionId: z.string().optional(),
  steps: z.array(stepStatusSchema),
  currentStepId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ExecutionSummary = z.infer<typeof executionSummarySchema>
export type StepStatus = z.infer<typeof stepStatusSchema>

export const WorkflowEvents = {
  /** Emitted when execution is created or updated */
  ExecutionUpdated: BusEvent.define(
    "workflow.execution.updated",
    z.object({
      execution: executionSummarySchema,
    }),
  ),

  /** Emitted when a step starts */
  StepStarted: BusEvent.define(
    "workflow.step.started",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      sessionId: z.string(),
    }),
  ),

  /** Emitted when a step completes */
  StepCompleted: BusEvent.define(
    "workflow.step.completed",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      status: z.enum(["COMPLETED", "FAILED", "SKIPPED"]),
      nextStepId: z.string().optional(),
      nextSessionId: z.string().optional(),
    }),
  ),
}
```

#### 2. Publish Events from WorkflowEngine

**File:** `packages/flomaster/src/orchestrator/engine/workflowEngine.ts`

**Changes:** Add Bus.publish calls at key points:

```typescript
import { Bus } from "opencode/bus/index"
import { WorkflowEvents, ExecutionSummary } from "../events.js"

// Helper to build execution summary for events
function buildExecutionSummary(/* context */): ExecutionSummary {
  return {
    id: executionId,
    workflowName,
    status,
    parentSessionId: workflowSessionID,
    steps: Object.entries(stepStatuses).map(([id, s]) => ({
      stepId: id,
      displayName: stepDisplayNames[id] || id,
      status: s.status,
      sessionId: s.sessionId,
    })),
    currentStepId,
    createdAt: createdAt.toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Publish on workflow start
Bus.publish(WorkflowEvents.ExecutionUpdated, {
  execution: buildExecutionSummary(/* ... */),
})

// Publish on step start
Bus.publish(WorkflowEvents.StepStarted, {
  executionId,
  stepId: step.id,
  sessionId: stepSession.id,
})

// Publish on step complete
Bus.publish(WorkflowEvents.StepCompleted, {
  executionId,
  stepId: step.id,
  status: "COMPLETED",
  nextStepId: nextStep?.id,
  nextSessionId: nextStepSessionId,
})

// Publish on workflow complete/fail
Bus.publish(WorkflowEvents.ExecutionUpdated, {
  execution: buildExecutionSummary(/* ... */),
})
```

#### 3. Export Events from FloMaster Package

**File:** `packages/flomaster/src/index.ts`

**Changes:** Add export:

```typescript
export { WorkflowEvents, type ExecutionSummary, type StepStatus } from "./orchestrator/events.js"
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [x] FloMaster tests pass: `cd packages/flomaster && bun test`
- [x] Events are properly typed (no `any`)

#### Manual Verification

- [x] Add temporary console.log in workflowEngine to verify events fire
- [x] Run `flomaster workflow run --name sdlc --prompt "test"` and see event logs

---

## Phase 2: Server Endpoints for Workflow Data

### Overview

Add HTTP endpoints in FloMaster that the TUI can call to fetch workflow definitions and execution state.

### Changes Required

#### 1. Create Workflow Server Routes

**File:** `packages/flomaster/src/server/routes.ts` (NEW)

```typescript
/**
 * FloMaster Server Routes
 *
 * HTTP endpoints for workflow operations, integrated with OpenCode server.
 */

import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { StateManager } from "../state/stateManager.js"
import { loadWorkflowFromFile, listWorkflowFiles } from "../orchestrator/parser/workflowLoader.js"
import { WorkflowEngine, createWorkflowEngine } from "../orchestrator/engine/index.js"

export function createWorkflowRoutes(getStateManager: () => StateManager) {
  const app = new Hono()

  // List available workflow definitions
  app.get("/workflow/definitions", async (c) => {
    const workflows = await listWorkflowFiles()
    const definitions = await Promise.all(
      workflows.map(async (name) => {
        const wf = await loadWorkflowFromFile(name)
        return {
          name,
          description: wf.description || "",
          stepCount: wf.nodes.filter((n) => n.data.node.baseClasses?.includes("Agent")).length,
        }
      }),
    )
    return c.json({ data: definitions })
  })

  // List executions
  app.get("/workflow/executions", async (c) => {
    const stateManager = getStateManager()
    const executions = await stateManager.listExecutions()
    return c.json({ data: executions })
  })

  // Get execution details
  app.get("/workflow/executions/:id", async (c) => {
    const stateManager = getStateManager()
    const execution = await stateManager.getExecution(c.req.param("id"))
    if (!execution) {
      return c.json({ error: "Execution not found" }, 404)
    }
    return c.json({ data: execution })
  })

  // Start a workflow
  app.post(
    "/workflow/run",
    zValidator(
      "json",
      z.object({
        workflowName: z.string(),
        prompt: z.string(),
      }),
    ),
    async (c) => {
      const { workflowName, prompt } = c.req.valid("json")
      // This will be called from TUI - implementation connects to WorkflowEngine
      // For now, return the execution ID that will be created
      return c.json({
        data: {
          message: "Workflow execution started",
          // executionId will be returned after engine starts
        },
      })
    },
  )

  return app
}
```

#### 2. Register Routes with OpenCode Server

**File:** `packages/flomaster/src/server/index.ts` (NEW)

```typescript
/**
 * FloMaster Server Integration
 *
 * Registers FloMaster routes with the OpenCode server.
 */

import type { Hono } from "hono"
import { createWorkflowRoutes } from "./routes.js"
import { StateManager } from "../state/stateManager.js"
import { Instance } from "opencode/project/instance"
import { FLOMASTER_DIR } from "../state/defaults.js"
import * as path from "node:path"

let stateManager: StateManager | null = null

function getStateManager(): StateManager {
  if (!stateManager) {
    const executionsDir = path.join(Instance.worktree, FLOMASTER_DIR)
    stateManager = new StateManager(executionsDir)
  }
  return stateManager
}

export function registerWorkflowRoutes(app: Hono) {
  const workflowRoutes = createWorkflowRoutes(getStateManager)
  app.route("/", workflowRoutes)
}

export { createWorkflowRoutes }
```

#### 3. Hook into OpenCode Server (Integration Point)

**File:** `packages/opencode/src/server/server.ts`

**Changes:** Add flomaster route registration (minimal change):

```typescript
// Near other route registrations, add:
import { registerWorkflowRoutes } from "@opencode-ai/flomaster/server"

// In server setup:
try {
  registerWorkflowRoutes(app)
} catch (e) {
  // FloMaster not available, skip workflow routes
}
```

**Note:** This is the ONE integration point in opencode/server. If flomaster is not installed, it gracefully skips.

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [ ] Server starts without errors: `bun dev`
- [ ] Endpoint returns data: `curl http://localhost:4096/workflow/definitions`

#### Manual Verification

- [ ] `/workflow/definitions` returns list of available workflows
- [ ] `/workflow/executions` returns empty array or existing executions

**Note:** Server integration deferred - routes created in packages/flomaster/src/server/. Integration with opencode server.ts will be done when testing the full TUI flow.

---

## Phase 3: TUI State Synchronization

### Overview

Add workflow execution state to the TUI's sync store so components can reactively display workflow progress.

### Changes Required

#### 1. Add Workflow Types to SDK

**File:** `packages/sdk/js/src/v2/gen/types.gen.ts`

After SDK regeneration, these types will be available. For now, add manually:

```typescript
export type WorkflowDefinition = {
  name: string
  description: string
  stepCount: number
}

export type WorkflowStepStatus = {
  stepId: string
  displayName: string
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED"
  sessionId?: string
}

export type WorkflowExecution = {
  id: string
  workflowName: string
  status: "CREATED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED"
  parentSessionId?: string
  steps: WorkflowStepStatus[]
  currentStepId?: string
  createdAt: string
  updatedAt: string
}
```

#### 2. Add Workflow State to Sync Store

**File:** `packages/opencode/src/cli/cmd/tui/context/sync.tsx`

**Changes:**

Add to store type (~line 34):

```typescript
// Add to store interface:
workflow_definitions: WorkflowDefinition[]
workflow_executions: { [executionId: string]: WorkflowExecution }
```

Add initial values (~line 72):

```typescript
// Add to initial store:
workflow_definitions: [],
workflow_executions: {},
```

Add event handlers in switch statement (~line 102):

```typescript
case "workflow.execution.updated": {
  const execution = event.properties.execution
  setStore("workflow_executions", execution.id, reconcile(execution))
  break
}
```

Add bootstrap fetch (~line 299):

```typescript
// Add to non-blocking requests:
sdk.client.get("/workflow/definitions").then((x: any) =>
  setStore("workflow_definitions", reconcile(x.data ?? []))
).catch(() => {
  // FloMaster not available
}),
sdk.client.get("/workflow/executions").then((x: any) => {
  const executions = (x.data ?? []).reduce((acc: any, exec: any) => {
    acc[exec.id] = exec
    return acc
  }, {})
  setStore("workflow_executions", reconcile(executions))
}).catch(() => {
  // FloMaster not available
}),
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [ ] TUI starts without errors: `bun dev`

#### Manual Verification

- [ ] Open TUI, check browser devtools/logs for workflow state loading
- [ ] Start workflow via CLI, verify TUI sync store updates

---

## Phase 4: Workflow Selector Dialog

### Overview

Create a dialog for selecting workflows and entering the task prompt.

### Changes Required

#### 1. Create Workflow Selector Dialog

**File:** `packages/opencode/src/cli/cmd/tui/component/dialog-workflow.tsx` (NEW)

```typescript
/**
 * Workflow Selector Dialog
 *
 * Two-step dialog: select workflow, then enter prompt.
 */

import { createMemo, createSignal, onMount, Show } from "solid-js"
import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { useSync } from "../context/sync"
import { useSDK } from "../context/sdk"
import { useRoute } from "../context/route"

export function DialogWorkflowSelect() {
  const dialog = useDialog()
  const sync = useSync()
  const sdk = useSDK()
  const route = useRoute()

  onMount(() => {
    dialog.setSize("medium")
  })

  const options = createMemo((): DialogSelectOption<string>[] =>
    sync.data.workflow_definitions.map((wf) => ({
      title: wf.name,
      value: wf.name,
      description: wf.description || `${wf.stepCount} steps`,
    }))
  )

  return (
    <DialogSelect
      title="Select workflow"
      placeholder="Search workflows..."
      options={options()}
      onSelect={(option) => {
        // Open prompt dialog
        dialog.replace(() => (
          <DialogWorkflowPrompt workflowName={option.value} />
        ))
      }}
    />
  )
}

function DialogWorkflowPrompt(props: { workflowName: string }) {
  const dialog = useDialog()
  const sdk = useSDK()
  const route = useRoute()
  const [prompt, setPrompt] = createSignal("")
  const [submitting, setSubmitting] = createSignal(false)

  async function handleSubmit() {
    if (!prompt().trim() || submitting()) return
    setSubmitting(true)

    try {
      // Call server to start workflow
      const response = await sdk.client.post("/workflow/run", {
        json: {
          workflowName: props.workflowName,
          prompt: prompt(),
        },
      })

      dialog.clear()
      // Navigation to workflow session will happen via event
    } catch (error) {
      console.error("Failed to start workflow:", error)
      setSubmitting(false)
    }
  }

  return (
    <box flexDirection="column" gap={1}>
      <text>
        <b>Workflow:</b> {props.workflowName}
      </text>
      <text>Enter task prompt:</text>
      <input
        value={prompt()}
        onChange={(e) => setPrompt(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="Describe what you want to accomplish..."
        autofocus
      />
      <Show when={submitting()}>
        <text fg="yellow">Starting workflow...</text>
      </Show>
    </box>
  )
}
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [ ] Component renders without errors

#### Manual Verification

- [ ] Dialog opens with workflow list
- [ ] Selecting workflow shows prompt input
- [ ] Submitting triggers workflow start

---

## Phase 5: Slash Command Integration

### Overview

Add `/workflow` slash command to trigger the workflow selector dialog.

### Changes Required

#### 1. Add Slash Command Definition

**File:** `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx`

**Changes:** Add to commands memo (~line 395):

```typescript
{
  display: "/workflow",
  description: "run a workflow",
  onSelect: () => command.trigger("workflow.run"),
},
```

#### 2. Register Command Handler

**File:** `packages/opencode/src/cli/cmd/tui/app.tsx`

**Changes:** Add to command registration (~line 283):

```typescript
// In command.register callback:
{
  title: "Run workflow",
  value: "workflow.run",
  category: "Workflow",
  keybind: "workflow_run",
  onSelect: (dialog) => {
    // Check if flomaster is available
    if (sync.data.workflow_definitions.length === 0) {
      // Show toast that no workflows available
      return
    }
    dialog.replace(() => <DialogWorkflowSelect />)
  },
},
```

Add import at top:

```typescript
import { DialogWorkflowSelect } from "./component/dialog-workflow"
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [x] Autocomplete shows `/workflow` option

#### Manual Verification

- [ ] Type `/workflow` in prompt, see autocomplete
- [ ] Press Enter, dialog opens
- [ ] Select workflow, enter prompt, workflow starts

---

## Phase 6: Sidebar Workflow Panel

### Overview

Add a collapsible "Workflows" panel to the sidebar showing active execution progress.

### Changes Required

#### 1. Add Workflows Panel to Sidebar

**File:** `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`

**Changes:**

Add to expanded store (~line 23):

```typescript
const [expanded, setExpanded] = createStore({
  mcp: true,
  diff: true,
  todo: true,
  lsp: true,
  workflows: true, // ADD
})
```

Add derived data (~line 18):

```typescript
const workflowExecutions = createMemo(() =>
  Object.values(sync.data.workflow_executions)
    .filter((e) => e.status === "RUNNING" || e.status === "PAUSED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
)
```

Add panel JSX (after Todo panel, ~line 221):

```typescript
{/* Workflows Panel */}
<Show when={workflowExecutions().length > 0}>
  <box>
    <box
      flexDirection="row"
      gap={1}
      onMouseDown={() => workflowExecutions().length > 2 && setExpanded("workflows", !expanded.workflows)}
    >
      <Show when={workflowExecutions().length > 2}>
        <text fg={theme.text}>{expanded.workflows ? "▼" : "▶"}</text>
      </Show>
      <text fg={theme.text}>
        <b>Workflows</b>
        <Show when={!expanded.workflows && workflowExecutions().length > 2}>
          <span style={{ fg: theme.textMuted }}>
            {" "}({workflowExecutions().length} active)
          </span>
        </Show>
      </text>
    </box>
    <Show when={workflowExecutions().length <= 2 || expanded.workflows}>
      <For each={workflowExecutions()}>
        {(execution) => (
          <box flexDirection="column" paddingLeft={1}>
            <text fg={theme.text}>
              {execution.workflowName}
              <span style={{ fg: theme.textMuted }}> ({execution.status.toLowerCase()})</span>
            </text>
            <For each={execution.steps}>
              {(step) => (
                <box
                  flexDirection="row"
                  gap={1}
                  paddingLeft={1}
                  onMouseUp={() => {
                    if (step.sessionId) {
                      route.navigate({ type: "session", sessionID: step.sessionId })
                    }
                  }}
                >
                  <text
                    flexShrink={0}
                    style={{
                      fg: {
                        COMPLETED: theme.success,
                        RUNNING: theme.warning,
                        FAILED: theme.error,
                        PENDING: theme.textMuted,
                        SKIPPED: theme.textMuted,
                      }[step.status],
                    }}
                  >
                    {step.status === "COMPLETED" ? "✓" :
                     step.status === "RUNNING" ? "●" :
                     step.status === "FAILED" ? "✗" : "○"}
                  </text>
                  <text
                    fg={step.status === "RUNNING" ? theme.text : theme.textMuted}
                    style={{ cursor: step.sessionId ? "pointer" : "default" }}
                  >
                    {step.displayName}
                  </text>
                </box>
              )}
            </For>
          </box>
        )}
      </For>
    </Show>
  </box>
</Show>
```

Add route import at top:

```typescript
import { useRoute } from "../../context/route"
```

Add in component:

```typescript
const route = useRoute()
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`
- [ ] TUI renders without errors

#### Manual Verification

- [ ] Start workflow, see panel appear in sidebar
- [ ] Steps show correct status indicators
- [ ] Click step navigates to its session
- [ ] Panel updates as steps complete

---

## Phase 7: Auto-Switch on Step Completion

### Overview

Automatically navigate to the next step's session when a step completes.

### Changes Required

#### 1. Handle Step Completion Events

**File:** `packages/opencode/src/cli/cmd/tui/app.tsx`

**Changes:** Add event listener for step completion:

```typescript
// In component setup, after SDK context is available:
onMount(() => {
  sdk.event.on("workflow.step.completed", (event) => {
    const { nextSessionId } = event.properties
    if (nextSessionId) {
      // Auto-navigate to next step session
      route.navigate({ type: "session", sessionID: nextSessionId })
    }
  })
})
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`

#### Manual Verification

- [ ] Start workflow, watch first step
- [ ] When step completes, TUI auto-navigates to next step
- [ ] Process continues through all steps

---

## Phase 8: Continue Command

### Overview

Add `/wcontinue` command to resume paused workflow steps.

### Changes Required

#### 1. Add Continue Slash Command

**File:** `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx`

**Changes:** Add to commands memo:

```typescript
{
  display: "/wcontinue",
  description: "continue paused workflow step",
  onSelect: () => command.trigger("workflow.continue"),
},
```

#### 2. Register Continue Handler

**File:** `packages/opencode/src/cli/cmd/tui/app.tsx`

**Changes:** Add to command registration:

```typescript
{
  title: "Continue workflow step",
  value: "workflow.continue",
  category: "Workflow",
  onSelect: () => {
    // Find current session and check if it's part of a workflow
    if (route.data.type !== "session") {
      toast.show({ message: "No active session", variant: "warning" })
      return
    }
    const sessionID = route.data.sessionID
    const currentSession = sync.data.session.find((s) => s.id === sessionID)
    if (!currentSession?.parentID) {
      toast.show({ message: "Current session is not part of a workflow", variant: "warning" })
      return
    }

    // Inject continue prompt into current session
    const continuePrompt =
      "Reflect on your original instructions and continue where you left off. Complete the current step."

    const model = local.model.current()
    sdk.client.session
      .prompt({
        sessionID,
        agent: local.agent.current().name,
        model: model ? { providerID: model.providerID, modelID: model.modelID } : undefined,
        parts: [{ type: "text", text: continuePrompt }],
      })
      .catch((err: Error) => {
        toast.show({ message: `Failed to continue: ${err.message}`, variant: "error" })
      })
    dialog.clear()
  },
},
```

### Success Criteria

#### Automated Verification

- [x] TypeScript compiles: `bun turbo typecheck`

#### Manual Verification

- [ ] During workflow step, press `esc` to interrupt
- [ ] Type `/wcontinue`, agent resumes work
- [ ] Workflow continues to completion

---

## Testing Strategy

### Unit Tests

**FloMaster package:**

- Event definitions are correctly typed
- Server routes return expected data
- WorkflowEngine publishes events at correct times

**OpenCode package:**

- Sync store handles workflow events correctly
- Dialog components render with mock data

### Integration Tests

1. Start workflow via `/workflow` command
2. Verify parent-child session creation
3. Verify sidebar updates in real-time
4. Verify auto-navigation between steps
5. Verify `/continue` resumes execution

### Manual Testing Steps

1. Open TUI: `bun dev`
2. Type `/workflow`, verify dialog opens
3. Select "sdlc" workflow
4. Enter prompt: "Create a hello world function"
5. Watch sidebar show workflow progress
6. Verify auto-switch between steps
7. Press `esc` during a step to interrupt
8. Type `/continue` to resume
9. Verify workflow completes
10. Check `.flomaster/executions/` has state file

## Performance Considerations

- Events batched at 16ms in TUI (existing behavior)
- Workflow state in memory is small (just execution summaries)
- No polling - all updates via SSE events
- Sidebar only shows active workflows (not history)

## Migration Notes

- No database migrations needed
- Existing CLI workflows continue to work
- TUI can display workflows started via CLI (via events)

## File Change Summary

### FloMaster Package (New/Modified)

| File                                        | Type   | Description                  |
| ------------------------------------------- | ------ | ---------------------------- |
| `src/orchestrator/events.ts`                | NEW    | Workflow event definitions   |
| `src/orchestrator/engine/workflowEngine.ts` | MODIFY | Add Bus.publish calls        |
| `src/server/routes.ts`                      | NEW    | HTTP endpoints for workflows |
| `src/server/index.ts`                       | NEW    | Server integration module    |
| `src/index.ts`                              | MODIFY | Export events                |

### OpenCode Package (New/Modified)

| File                                                | Type   | Description                           |
| --------------------------------------------------- | ------ | ------------------------------------- |
| `src/server/server.ts`                              | MODIFY | One line to register flomaster routes |
| `src/cli/cmd/tui/context/sync.tsx`                  | MODIFY | Add workflow state (~20 lines)        |
| `src/cli/cmd/tui/component/dialog-workflow.tsx`     | NEW    | Workflow selector dialog              |
| `src/cli/cmd/tui/component/prompt/autocomplete.tsx` | MODIFY | Add 2 slash commands                  |
| `src/cli/cmd/tui/routes/session/sidebar.tsx`        | MODIFY | Add Workflows panel (~50 lines)       |
| `src/cli/cmd/tui/app.tsx`                           | MODIFY | Command registration + auto-switch    |

**Total OpenCode changes: ~150 lines across 5 files**

## References

- Task file: `.alfred/tasks/TASK-13/task.md`
- Architecture: `design/01-overview/04-opencode-architecture.md`
- Sidebar pattern: `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
- Dialog pattern: `packages/opencode/src/cli/cmd/tui/component/dialog-session-list.tsx`
- Sync pattern: `packages/opencode/src/cli/cmd/tui/context/sync.tsx`

---

## Implementation Progress

### Completed Phases

#### Phase 0: Architecture Change - FloMaster Move (COMPLETED)

**Commit:** `011ee8558` - refactor(flomaster): move flomaster package into opencode

**Rationale:** The original plan kept FloMaster as a separate package (`packages/flomaster/`), but this caused circular dependency issues when trying to import OpenCode's Bus system. Moving FloMaster into OpenCode (`packages/opencode/src/flomaster/`) resolved these issues and simplified the integration.

**Changes Made:**

| Action          | Details                                                        |
| --------------- | -------------------------------------------------------------- |
| Moved           | `packages/flomaster/src/` → `packages/opencode/src/flomaster/` |
| Updated imports | Changed `opencode/...` → `@/...` (internal imports)            |
| Removed         | `packages/flomaster/` directory, package.json, tsconfig.json   |
| Created         | `src/flomaster/orchestrator/events.ts` - Bus event definitions |
| Created         | `src/flomaster/server/routes.ts` - HTTP endpoints              |
| Created         | `src/flomaster/server/integration.ts` - Server integration     |

**Key Files After Move:**

```
packages/opencode/src/flomaster/
├── cli/                    # Standalone CLI (still works)
├── index.ts                # Public exports
├── orchestrator/
│   ├── events.ts           # NEW: Bus event definitions
│   ├── engine/
│   │   ├── factory.ts      # Engine creation
│   │   └── workflowEngine.ts  # Core engine (enhanced)
│   ├── machine/            # XState v5 workflow machine
│   ├── registry/           # Step executors
│   └── ...
├── server/
│   ├── index.ts            # Server integration
│   ├── integration.ts      # Helpers
│   └── routes.ts           # HTTP endpoints
└── state/
    └── stateManager.ts     # Execution persistence
```

---

#### Phase 1 & 2: Server Routes & Events (COMPLETED)

**Commit:** `8bdab1e06` - feat(workflow): enhance workflow messaging and session management

**Changes Made:**

1. **Server routes integrated directly into OpenCode** (`src/server/workflow.ts`):
   - `GET /workflow/definitions` - List available workflows
   - `GET /workflow/executions` - List workflow executions
   - `POST /workflow/run` - Start workflow execution

2. **Workflow message system** (`src/server/workflow-message.ts`):
   - Creates user message showing workflow execution request
   - Creates assistant message with `tool: "workflow"` part
   - Updates message in real-time as steps progress
   - Shows workflow status similar to Task tool

3. **In-memory execution tracking** with persistence via StateManager

---

#### Phase 3 & 4: TUI State Sync & Workflow Dialog (COMPLETED)

**Commit:** `8bdab1e06` - feat(workflow): enhance workflow messaging and session management

**Changes Made:**

1. **Sync store** (`src/cli/cmd/tui/context/sync.tsx`):
   - Added `workflow_definitions: WorkflowDefinition[]`
   - Added `workflow_executions` state
   - Bootstrap fetch from `/workflow/definitions` and `/workflow/executions`

2. **Workflow dialog** (`src/cli/cmd/tui/component/dialog-workflow.tsx`):
   - `DialogWorkflowSelect` - List available workflows
   - `DialogWorkflowPrompt` - Enter task prompt
   - Creates session if invoked from home screen
   - Calls `POST /workflow/run` to start execution

---

#### Phase 5: Slash Command (COMPLETED)

**Commit:** `8bdab1e06`

**Changes Made:**

- Added `/workflow` command in `autocomplete.tsx`
- Command opens `DialogWorkflowSelect` dialog
- Works from both home screen and within sessions

---

#### Phase 6: Workflow Component in Chat (COMPLETED - Alternative to Sidebar)

**Commit:** `8bdab1e06` - feat(workflow): enhance workflow messaging and session management

Instead of a sidebar panel, we implemented workflow visualization **in the chat itself**, similar to how the Task tool works:

**Changes Made** (`src/cli/cmd/tui/routes/session/index.tsx`):

```typescript
function Workflow(props: ToolProps<any>) {
  // Renders workflow status block in chat
  // Shows:
  // - Workflow name as title
  // - Step list with status icons (✓ green, ● yellow spinner, ✗ red, ○ muted)
  // - Spinner animation for running steps
  // - Click to navigate to step sessions
  // - Keybind hint for viewing steps
}
```

**Advantages over sidebar panel:**

- Workflow appears in context where it was started
- Visual consistency with Task tool
- No sidebar clutter for inactive workflows
- Naturally scrolls with chat history

---

#### Code Review Fixes (COMPLETED)

**Commit:** `abe7b6743` - refactor(workflow): improve type safety and add TODO comments

**Changes Made:**

1. **Fixed type safety in Workflow component**:
   - Added `ToolStateCompleted` import from SDK
   - Replaced `as any` cast with proper type

2. **Documented currentActivity limitation**:
   - Added TODO comment explaining it won't work until Bus subscription is implemented
   - Step session data isn't loaded into sync unless user navigates to it

3. **Documented unused exported functions** in `workflow.ts`:
   - `updateExecutionState()`, `updateStepState()`, `getExecutionState()`
   - Added TODO explaining these are for future pause/resume/intervention features

4. **Fixed type casts in workflow-message.ts**:
   - Replaced `as any` with proper type narrowing using `"input" in existingState`

---

### Remaining Phases

#### Phase 7: Auto-Switch on Step Completion (COMPLETED)

**Commit:** `ef8e10acb` - feat(workflow): implement auto-navigation to next step session (R3)

**Implementation:** Added event handlers in `src/cli/cmd/tui/app.tsx`:

1. **`workflow.step.completed`** - Navigates if `nextSessionId` is already known
2. **`workflow.step.session_created`** - Navigates when new step session is created (handles timing where session isn't created until after completion)

The handler checks that the user is currently viewing a session from the same workflow execution before auto-navigating, preventing disruption if the user has manually navigated elsewhere.

---

#### Phase 8: Continue Command (NOT STARTED)

**Status:** Pending

**What's needed:**

- Add `/wcontinue` slash command
- Inject continue prompt into current step session
- Handle case when not in a workflow step session

**Implementation location:**

- `src/cli/cmd/tui/component/prompt/autocomplete.tsx` - Add command
- `src/cli/cmd/tui/app.tsx` - Register handler

---

### Known Issues & Technical Debt

| Issue                        | Priority | Description                                                          |
| ---------------------------- | -------- | -------------------------------------------------------------------- |
| currentActivity doesn't work | Medium   | Needs Bus subscription to load step session data                     |
| Duplicate state management   | Low      | Both `activeExecutions` Map and StateManager track state             |
| Large POST handler           | Low      | `/workflow/run` handler is ~230 lines, could be extracted            |
| Type duplication             | Low      | `ExecutionState` and `WorkflowStep` types defined in multiple places |

---

### Verification Checklist

#### Completed

- [x] TypeScript compiles: `bun turbo typecheck`
- [x] OpenCode tests pass: `bun test` (1019 tests)
- [x] FloMaster tests pass: `bun test src/flomaster` (463 tests)
- [x] `/workflow` command shows in autocomplete
- [x] Workflow dialog opens and lists workflows
- [x] Workflow execution creates messages in chat
- [x] Workflow steps show with status indicators

#### Pending Manual Testing

- [ ] Full workflow execution from TUI (run sdlc workflow)
- [ ] Step navigation via clicking in Workflow component
- [ ] Auto-switch between step sessions (Phase 7)
- [ ] `/wcontinue` command (Phase 8)
- [ ] Interrupt with `esc` and resume

---

### Commits Summary

| Commit      | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| `011ee8558` | refactor(flomaster): move flomaster package into opencode         |
| `3ca47fb0d` | docs: add TUI Integration roadmap aligned with TASK-13            |
| `a65f0620b` | docs: initialize FloMaster TUI Integration milestone              |
| `8bdab1e06` | feat(workflow): enhance workflow messaging and session management |
| `abe7b6743` | refactor(workflow): improve type safety and add TODO comments     |
