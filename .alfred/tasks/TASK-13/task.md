# TASK-13: OpenCode TUI Workflow Integration

## Overview

Integrate FloMaster workflow orchestration into the OpenCode TUI, enabling users to launch, monitor, and interact with multi-step workflows directly from the terminal interface instead of the separate CLI.

## Problem Statement

Currently, FloMaster workflows are executed via a separate CLI (`flomaster workflow run`), which:

- Requires switching context between TUI and CLI
- Provides no visual integration with existing session management
- Makes it difficult to see workflow progress alongside regular work
- Doesn't leverage the TUI's existing session infrastructure

## Goals

1. **Launch workflows from TUI** - User can trigger workflows without leaving the TUI
2. **Visual progress in sidebar** - Show workflow steps and status alongside MCP/LSP/Todo panels
3. **Seamless session integration** - Each workflow step is a session; auto-switch as steps complete
4. **User intervention** - Allow users to steer/contribute during step execution
5. **Continue/pause support** - Let users pause and resume workflow execution

## Non-Goals (Out of Scope for TASK-13)

- Visual workflow builder/editor
- Workflow definition management (create/edit workflows)
- Complex loop/conditional visualization
- Desktop app integration (TUI only)

---

## Requirements

### R1: Workflow Launcher

**R1.1** User can type `/workflow` in the prompt to trigger workflow selection.

**R1.2** A dialog appears listing all available workflows from `.flomaster/workflows/`.

**R1.3** Each workflow shows: name, description, step count.

**R1.4** User selects a workflow and provides a task/prompt as input.

**R1.5** Selecting a workflow creates a parent session and begins execution.

### R2: Sidebar Workflow Panel

**R2.1** A new collapsible "Workflows" panel appears in the right sidebar (alongside MCP, LSP, Todo).

**R2.2** Panel shows active workflow execution with:

- Workflow name
- Current status (running, paused, completed, failed)
- List of steps with status indicators:
  - ✓ (completed)
  - ● (running/active)
  - ○ (pending)
  - ✗ (failed)

**R2.3** Clicking a step navigates to that step's session.

**R2.4** Panel updates in real-time as steps progress.

### R3: Session Auto-Switching

**R3.1** When a workflow starts, TUI navigates to the first step's session.

**R3.2** When a step completes, TUI automatically navigates to the next step's session.

**R3.3** User can manually navigate between step sessions (existing child session navigation).

**R3.4** Each step session shows the agent working with full tool visibility.

### R4: User Intervention

**R4.1** User can type messages during a step to steer/guide the agent.

**R4.2** User can press `esc` to interrupt the current step (existing interrupt behavior).

**R4.3** Interrupting a step should pause the workflow (not cancel it).

### R5: Continue/Resume

**R5.1** User can type `/continue` to resume a paused workflow.

**R5.2** `/continue` injects a prompt: "Reflect on your original instructions and continue where you left off. Complete the current step."

**R5.3** After user intervention, workflow knows to proceed to next step when current step completes.

### R6: State Synchronization

**R6.1** Workflow execution state syncs to TUI via events (like todo, mcp, session events).

**R6.2** TUI can display workflow state even if workflow was started via CLI.

**R6.3** Multiple concurrent workflow executions should be supported (show all in sidebar).

---

## User Experience Flow

```
1. User is working in TUI session
2. User types `/workflow` and presses Enter
3. Dialog appears: "Select workflow"
   - sdlc (Research → Plan → Implement → Review)
   - research (Deep codebase research)
   - ...
4. User selects "sdlc"
5. Dialog appears: "Enter task prompt"
   - User types: "Add dark mode toggle to settings"
6. Workflow starts:
   - Parent session created: "Workflow: sdlc - Add dark mode..."
   - First step (research) session created
   - TUI navigates to research session
7. User watches research agent work
   - Can type to add context: "Also check mobile compatibility"
8. Research completes → TUI auto-switches to Plan session
9. User watches plan agent work
10. Plan completes → TUI auto-switches to Implement session
11. User can interrupt with `esc` if needed
12. User types `/continue` to resume
13. All steps complete → Workflow marked COMPLETED
14. Sidebar shows: sdlc ✓ (all steps green)
```

---

## Implementation Research Notes

### A. TUI Sidebar Architecture

**File**: `packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`

The sidebar uses SolidJS with a collapsible panel pattern:

```typescript
// Expanded state store
const [expanded, setExpanded] = createStore({
  mcp: true,
  diff: true,
  todo: true,
  lsp: true,
})

// Panel structure pattern
<Show when={items().length > 0}>
  <box>
    {/* Header with collapse toggle */}
    <box flexDirection="row" gap={1}
         onMouseDown={() => setExpanded("key", !expanded.key)}>
      <Show when={items().length > 2}>
        <text>{expanded.key ? "▼" : "▶"}</text>
      </Show>
      <text><b>Panel Title</b></text>
    </box>

    {/* Content */}
    <Show when={expanded.key || items().length <= 2}>
      <For each={items()}>
        {(item) => (
          <box flexDirection="row" gap={1}>
            <text style={{ fg: statusColor }}>•</text>
            <text>{item.name} {item.status}</text>
          </box>
        )}
      </For>
    </Show>
  </box>
</Show>
```

**Data flow**:

- `sync.data.*` → `createMemo()` derived data → render
- Events update `sync` store → reactive updates propagate

**Key files**:

- `sidebar.tsx` - Panel rendering
- `context/sync.tsx` - State store and event handlers
- `context/sdk.tsx` - Event subscription (SSE)

---

### B. TUI Dialog System

**Files**:

- `packages/opencode/src/cli/cmd/tui/ui/dialog.tsx` - Dialog framework
- `packages/opencode/src/cli/cmd/tui/ui/dialog-select.tsx` - List selection dialog
- `packages/opencode/src/cli/cmd/tui/component/dialog-session-list.tsx` - Example

**Dialog API**:

```typescript
const dialog = useDialog()

// Open a dialog (replaces any existing)
dialog.replace(() => <MyDialogComponent />)

// Close all dialogs
dialog.clear()

// Set size
dialog.setSize("large")  // 80 cols, or "medium" = 60 cols
```

**DialogSelect component**:

```typescript
<DialogSelect
  title="Select workflow"
  options={[
    { title: "sdlc", value: "sdlc", description: "Full SDLC workflow" },
    { title: "research", value: "research", description: "Deep research" },
  ]}
  onSelect={(option) => {
    handleSelection(option.value)
    dialog.clear()
  }}
  keybind={[
    { keybind: Keybind.parse("ctrl+d")[0], title: "delete", onTrigger: ... },
  ]}
/>
```

**Key patterns**:

- Factory function: `dialog.replace(() => <Component />)`
- Focus management automatic (saves/restores focus)
- Escape closes dialog (calls `onClose` callback)
- Navigation: up/down arrows, Enter to select

---

### C. Slash Command System

**Files**:

- `packages/opencode/src/cli/cmd/tui/component/prompt/autocomplete.tsx` - Command definitions
- `packages/opencode/src/cli/cmd/tui/component/dialog-command.tsx` - Command registration

**Two types of commands**:

1. **File-based** (`.opencode/command/*.md`) - Sent to AI
2. **TUI-only** (hardcoded in `autocomplete.tsx`) - Trigger UI actions

**Adding a TUI command**:

```typescript
// In autocomplete.tsx commands memo (~line 395):
{
  display: "/workflow",
  description: "run a workflow",
  onSelect: () => command.trigger("workflow.run"),
}

// Register handler in a component:
command.register(() => [{
  title: "Run workflow",
  value: "workflow.run",
  category: "Workflow",
  onSelect: (dialog) => {
    dialog.replace(() => <DialogWorkflowSelect />)
  },
}])
```

**Trigger detection**:

- Slash commands only trigger when `/` is typed at position 0
- Autocomplete shows matching commands
- On Enter, either executes TUI command or sends to server

---

### D. State Synchronization System

**File**: `packages/opencode/src/cli/cmd/tui/context/sync.tsx`

**Store structure**:

```typescript
const [store, setStore] = createStore<{
  status: "loading" | "partial" | "complete"
  session: Session[]
  message: { [sessionID: string]: Message[] }
  todo: { [sessionID: string]: Todo[] }
  mcp: { [key: string]: McpStatus }
  lsp: LspStatus[]
  // ... more fields
}>
```

**Event subscription** (`sdk.tsx`):

- SSE connection to `/event` endpoint
- Events batched at 16ms (60fps) for performance
- Distributed via `emitter.emit(event.type, event)`

**Event handling pattern**:

```typescript
// In sync.tsx switch statement:
case "todo.updated":
  setStore("todo", event.properties.sessionID, event.properties.todos)
  break
```

**Adding workflow state**:

```typescript
// Add to store:
workflow_executions: { [executionId: string]: Execution }

// Add event handler:
case "workflow.execution.updated":
  setStore("workflow_executions", event.properties.execution.id,
    reconcile(event.properties.execution))
  break

// Add bootstrap fetch:
sdk.client.workflow.list().then((x) =>
  setStore("workflow_executions", reconcile(...))
)
```

**Server-side publishing**:

```typescript
// In workflowEngine.ts:
import { Bus } from "opencode/bus/index"

Bus.publish(WorkflowEvents.ExecutionUpdated, { execution })
```

---

### E. Existing FloMaster CLI Features

**File**: `packages/flomaster/src/cli/workflow.ts`

| Command             | Lines   | Purpose                        |
| ------------------- | ------- | ------------------------------ |
| `workflow run`      | 64-305  | Execute workflow with prompt   |
| `workflow list`     | 346-465 | List executions or definitions |
| `workflow inspect`  | 470-553 | Show execution details         |
| `workflow resume`   | 662-985 | Resume interrupted workflow    |
| `workflow validate` | 558-594 | Validate workflow JSON         |
| `workflow show`     | 599-647 | Show workflow definition       |

**Key capabilities already implemented**:

- Load workflow definitions from `.flomaster/workflows/`
- Execute workflows with WorkflowEngine
- State persistence in `.flomaster/executions/{id}/execution.json`
- Step-by-step execution with session creation
- Resume from interrupted step
- Event emission during execution

**State file format** (`execution.json`):

```json
{
  "id": "exec-1234567890-abc123",
  "workflowName": "sdlc",
  "status": "COMPLETED",
  "createdAt": "2026-01-08T...",
  "updatedAt": "2026-01-08T...",
  "steps": {
    "input": { "status": "COMPLETED", "outputs": {...} },
    "research": { "status": "COMPLETED", "sessionId": "ses_...", "outputs": {...} },
    "plan": { "status": "COMPLETED", "sessionId": "ses_...", "outputs": {...} }
  },
  "version": "1.0",
  "recoverable": true
}
```

---

### F. Parent-Child Session Model

FloMaster already uses parent-child sessions:

```typescript
// Workflow creates parent session
const workflowSession = await Session.create({
  title: `Workflow: ${workflowName} - ${taskPrompt.slice(0, 30)}...`,
})

// Each step creates child session
const stepSession = await Session.create({
  parentID: workflowSession.id,
  title: `Step: ${stepName} (@${agentName})`,
  permission: [{ permission: "task", pattern: "*", action: "deny" }],
})
```

**TUI already supports**:

- Child session navigation ("Next/Prev child session" keybinds)
- Parent session shows in Sessions dialog
- Child sessions grouped under parent

**What's needed**:

- Better visibility of workflow progress
- Auto-navigation on step completion
- Workflow-specific sidebar panel

---

## Dependencies

- TASK-10: Step configuration schema ✅
- TASK-11: Workflow JSON file loading ✅
- TASK-12: State consolidation ✅

## Acceptance Criteria

1. [x] `/workflow` command opens workflow selector dialog
2. [x] User can select a workflow and provide input prompt
3. [x] Workflow executes with visible progress ~~in sidebar~~ in chat (Workflow component)
4. [ ] TUI auto-navigates between step sessions as they complete (Phase 7)
5. [ ] User can interrupt a step and resume with `/wcontinue` (Phase 8)
6. [x] Workflow state syncs correctly (works even if started via CLI)
7. [x] All existing CLI functionality remains working

---

## Open Questions

1. **Prompt input UX**: Should we have a second dialog for prompt, or use current session context?
2. **Loop visualization**: How to show loop iterations in sidebar? (e.g., `↻ refine (2/5)`)
3. **Conditional branches**: Show all branches or just taken path?
4. **Multiple workflows**: Can user run multiple workflows simultaneously? How to switch between them?
5. **Failure handling**: What happens when a step fails? Auto-pause? Show error in sidebar?

---

## Related Documents

- [Architecture Overview](../../design/01-overview/04-opencode-architecture.md)
- [TASK-12: State Consolidation](../TASK-12/task.md)
