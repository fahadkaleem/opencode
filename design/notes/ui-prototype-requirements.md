# FlowMaster UI Prototype Requirements

> **Purpose**: Comprehensive reference document for building the FlowMaster UI prototype.
> **Generated**: 2025-11-30
> **Source**: Consolidated from 03-architecture requirements, integration contracts, schemas, and archived designs.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [UI Modes and Deployment](#2-ui-modes-and-deployment)
3. [Layout and Structure](#3-layout-and-structure)
4. [Workflow Visualization](#4-workflow-visualization)
5. [Chat Interface](#5-chat-interface)
6. [Workflow Features to Display](#6-workflow-features-to-display)
7. [Real-Time Updates](#7-real-time-updates)
8. [Execution Controls](#8-execution-controls)
9. [Permissions and Approvals](#9-permissions-and-approvals)
10. [Clarification Handling](#10-clarification-handling)
11. [CLI Interface](#11-cli-interface)
12. [State Management](#12-state-management)
13. [Events Reference](#13-events-reference)
14. [Gateway API Reference](#14-gateway-api-reference)
15. [Error Handling](#15-error-handling)
16. [Tech Stack Recommendations](#16-tech-stack-recommendations)

---

## 1. Architecture Overview

### Core Principle: Stateless UI

The UI is a **pure presentation layer** that:

- Holds no workflow state (all state resides in backend)
- Fetches initial state on connection
- Receives real-time updates via events
- Sends commands through Gateway
- Page refresh restores complete state

### Communication Pattern

```
┌─────────────────┐                    ┌─────────────────┐
│   CLI / Web UI  │◄──── Events ───────│                 │
│   (COMP-011)    │                    │    Gateway      │
│                 │───── Commands ────►│   (COMP-012)    │
└─────────────────┘                    └────────┬────────┘
                                                │
                              Routes to backend components:
                              - Orchestrator (execution)
                              - Configuration Manager (definitions)
                              - Task Manager (external tasks)
                              - Message Manager (events)
```

### Key Invariants

| Invariant  | Description                                    |
| ---------- | ---------------------------------------------- |
| INV-UI-001 | UI state reflects backend state                |
| INV-UI-002 | Page refresh restores complete execution state |
| INV-UI-003 | Events displayed in chronological order        |
| INV-UI-004 | CLI commands produce consistent exit codes     |
| INV-UI-005 | JSON output is valid JSON                      |
| INV-UI-006 | Errors go to stderr, results to stdout         |

---

## 2. UI Modes and Deployment

### Dual-Mode Operation

| Mode       | Transport                          | Events         | Authentication             |
| ---------- | ---------------------------------- | -------------- | -------------------------- |
| **CLI**    | In-process (direct function calls) | Callbacks      | None (localhost)           |
| **Web UI** | HTTP + WebSocket                   | WebSocket push | None (local) / JWT (cloud) |

### Deployment Modes

| Mode      | Configuration           | Auth Required | Features                    |
| --------- | ----------------------- | ------------- | --------------------------- |
| **Local** | `FLOWMASTER_MODE=local` | No            | Single-user, localhost only |
| **Cloud** | `FLOWMASTER_MODE=cloud` | JWT required  | Multi-tenant, TLS (wss://)  |

### Headless Detection (CI/CD)

Auto-detect headless mode when:

- `CI` environment variable is set
- `stdout` is not a TTY
- `TERM=dumb`
- `--headless` flag provided

In headless mode:

- No interactive prompts
- Progress to stderr, results to stdout
- Machine-parseable output
- Same workflows work without modification

---

## 3. Layout and Structure

### Main Two-Panel Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                      CONTEXTUAL HEADER (64px)                     │
│  [Logo] [Task ID: AL-123] [Workflow: plan-implement] [●Running] [⚙]│
├─────────────────────────────┬────────────────────────────────────┤
│                             │                                    │
│    CHAT INTERFACE           │    WORKFLOW VISUALIZATION          │
│    (~40% width)             │    (~60% width)                    │
│                             │                                    │
│  ┌─────────────────────┐    │    ┌──────────────────────────┐   │
│  │ Phase: analyze      │    │    │   [analyze] ──► [plan]   │   │
│  │ ✓ Agent spawned     │    │    │        │                 │   │
│  │ ✓ Tool: Read        │    │    │        ▼                 │   │
│  │   src/auth.ts       │    │    │   [implement]            │   │
│  │ 💭 Thinking...      │    │    │      /    \              │   │
│  │ 🤖 "I'll analyze..."│    │    │   [test]  [docs]         │   │
│  │ ✓ Phase complete    │    │    │      \    /              │   │
│  └─────────────────────┘    │    │   [validate]             │   │
│                             │    └──────────────────────────┘   │
│  [Filter: All Phases ▼]     │    [Fit] [+] [-] [Pan: ←↑↓→]     │
│                             │                                    │
│  [↓ New messages]           │                                    │
├─────────────────────────────┴────────────────────────────────────┤
│  [⏸ Pause] [▶ Resume] [⏹ Cancel]                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Header Elements

| Element       | Description                                           |
| ------------- | ----------------------------------------------------- |
| Logo          | FlowMaster branding                                   |
| Task ID       | Current task identifier (e.g., "TASK-123")            |
| Workflow Name | Active workflow name                                  |
| Status Badge  | Real-time status (Running, Paused, Completed, Failed) |
| Settings      | Access to preferences                                 |

### Responsive Breakpoints

| Screen Size         | Layout                        |
| ------------------- | ----------------------------- | ------------------------ |
| Desktop (≥1024px)   | Full two-panel (40%/60%)      |
| Tablet (768-1023px) | Condensed two-panel (50%/50%) |
| Mobile (<768px)     | Tabbed interface (Chat        | Graph), swipe navigation |

### Panel Resizing

- Draggable divider between panels
- Width persisted to localStorage
- Minimum widths enforced

---

## 4. Workflow Visualization

### Node Types

| Type                 | Visual          | Use Case                     |
| -------------------- | --------------- | ---------------------------- |
| **Phase Node**       | Rectangle       | Single command execution     |
| **Parallel Node**    | Branching lanes | Multiple concurrent commands |
| **Conditional Node** | Diamond         | Decision branching           |
| **Iteration Node**   | Loop arrow      | Repeating phases             |

### Node Status Indicators

| Status      | Visual                | Color     |
| ----------- | --------------------- | --------- |
| `pending`   | ○ Gray circle         | `#9CA3AF` |
| `running`   | ● Blue animated pulse | `#3B82F6` |
| `completed` | ✓ Green checkmark     | `#10B981` |
| `failed`    | ✗ Red cross           | `#EF4444` |
| `skipped`   | ◌ Gray dashed         | `#D1D5DB` |

### Edge Types

| Type        | Visual              | Description               |
| ----------- | ------------------- | ------------------------- |
| Sequential  | Solid arrow         | Normal flow A → B         |
| Dependency  | Labeled solid arrow | Explicit dependency       |
| Conditional | Dashed arrow        | "if true" / "else" labels |
| Loop        | Curved back-arrow   | Iteration back-edge       |

### Graph Interactions

| Action      | Input                                               |
| ----------- | --------------------------------------------------- |
| Pan         | Mouse drag / Arrow keys                             |
| Zoom        | Mouse wheel / Pinch / +/- keys                      |
| Fit to view | Button click                                        |
| Select node | Click (scrolls chat to phase)                       |
| Hover       | Shows tooltip (name, command, duration, session ID) |

### Conditional Execution Display

When a phase has a `skipIf` or `when` condition:

- Show condition badge on node
- Display evaluated expression
- Indicate "Skipped" with reason when condition matches

### Loop/Iteration Display

For phases with `iterate` configuration:

- Show current iteration count: "Iteration 2/5"
- Display `until` condition
- Show delay countdown between iterations
- Warning indicator when max iterations reached

### Parallel Execution Display

For phases with `commands` array:

- Show branching lanes (fork/join pattern)
- Per-command status indicators
- Aggregate success/failure badge
- Individual and total duration

---

## 5. Chat Interface

### Message Types

| Type               | Icon | Content                       |
| ------------------ | ---- | ----------------------------- |
| **Phase Start**    | 🔄   | Phase name, timestamp         |
| **Phase Complete** | ✅   | Phase name, duration          |
| **Tool Use**       | 🔧   | Tool name, parameters, status |
| **Tool Result**    | 📄   | Output (truncated if large)   |
| **Thinking**       | 💭   | Reasoning content             |
| **Assistant**      | 🤖   | Markdown message              |
| **Error**          | ❌   | Error details                 |
| **Clarification**  | ❓   | Question from agent           |
| **Approval**       | ⏸    | Approval request              |

### Tool Use Card

```
┌─────────────────────────────────────┐
│ 🔧 Read                      [⏳]   │
│ src/services/auth.ts               │
│ Lines: 45-120                      │
└─────────────────────────────────────┘
         ↓ (when complete)
┌─────────────────────────────────────┐
│ 🔧 Read                      [✓]   │
│ src/services/auth.ts               │
│ Lines: 45-120 (76 lines read)      │
└─────────────────────────────────────┘
```

### Thinking Block

```
┌─────────────────────────────────────┐
│ 💭 Thinking...                      │
│ I need to analyze the auth module   │
│ to understand the token flow...     │
└─────────────────────────────────────┘
```

### Auto-Scroll Behavior

1. **Default**: Auto-scroll to bottom on new messages
2. **User scrolls up**: Auto-scroll disabled
3. **New messages badge**: Appears when auto-scroll disabled
4. **Click badge**: Jump to bottom, re-enable auto-scroll

### Phase Filtering

- Dropdown to filter messages by phase
- "Show all phases" option
- Filter persists during session

---

## 6. Workflow Features to Display

### Execution Hierarchy

```
Workflow (top-level)
  └── Phase (execution block)
       └── Command (single agent)

Composed Workflows (via uses:):
Parent Workflow
  └── Child Workflow (via uses:)
       └── Phase
            └── Command
```

The UI must show:

- Current level indicator
- Tree/hierarchy view
- Parent-child relationships

### Execution Statuses

| Level         | Statuses                                                           |
| ------------- | ------------------------------------------------------------------ |
| **Execution** | `pending`, `running`, `paused`, `completed`, `failed`, `cancelled` |
| **Phase**     | `pending`, `running`, `completed`, `failed`, `skipped`             |

### Pause Reasons

| Reason          | UI Display              |
| --------------- | ----------------------- |
| `user_request`  | "Paused by user"        |
| `approval_gate` | "Waiting for approval"  |
| `checkpoint`    | "Checkpoint reached"    |
| `external`      | "External system pause" |

### Conditional Features

| Feature  | Configuration                   | UI Display                             |
| -------- | ------------------------------- | -------------------------------------- |
| `skipIf` | `skipIf: tests_passing == true` | "Skipped: tests_passing == true" badge |
| `when`   | `when: analyze.needs_refactor`  | Condition expression on node           |

**Operators supported**: `==`, `!=`, `>`, `<`, `>=`, `<=`, `AND`, `OR`, `NOT`

### Loop Features

| Field                   | Description              | UI Display               |
| ----------------------- | ------------------------ | ------------------------ |
| `iterate.until`         | Termination condition    | Condition badge          |
| `iterate.maxIterations` | Safety limit             | "X/Y iterations" counter |
| `iterate.delay`         | Delay between iterations | Countdown timer          |
| `iterate.checkpoint`    | Checkpoint mode          | Checkpoint indicator     |

**Backoff configuration**:

- `initial`: Starting delay (ms)
- `factor`: Multiplier per iteration
- `maxDelay`: Cap on delay

### Parallel Features

| Feature             | UI Display                     |
| ------------------- | ------------------------------ |
| Multiple `commands` | Branching lanes in graph       |
| Per-command status  | Individual status indicators   |
| Aggregate result    | Combined success/failure badge |
| `failedPhases` list | Highlight failed branches      |

### Dependency Features

| Feature            | Configuration               | UI Display                 |
| ------------------ | --------------------------- | -------------------------- |
| Phase dependencies | `needs: [phase-a, phase-b]` | Dependency arrows in graph |
| Circular detection | Validation error            | Error highlight with cycle |

### Validation Features

| Type               | Configuration                   | UI Display                      |
| ------------------ | ------------------------------- | ------------------------------- |
| Command validation | `commandSucceeds: ["npm test"]` | Command status badge            |
| File validation    | `fileExists: ["dist/**/*.js"]`  | File check status               |
| AI validation      | `ai.enabled: true`              | AI validation progress          |
| Blocking           | `required: true`                | Blocking vs. advisory indicator |

### Sub-Workflow Features

When a phase triggers a sub-workflow:

- Nested tree visualization
- Parent-child relationship lines
- Context inheritance indicator
- Depth level counter

---

## 7. Real-Time Updates

### Latency Requirements

| Update Type                   | Target Latency            |
| ----------------------------- | ------------------------- |
| Event streaming to UI         | < 100ms (95th percentile) |
| Phase completion graph update | < 1 second                |
| Status badge update           | Real-time                 |
| Tooltip appearance            | < 200ms                   |
| Initial state hydration       | < 1 second                |

### WebSocket Protocol

```
1. Connect: ws://localhost:3001/events (local)
           wss://api.flowmaster.app/events?token=<jwt> (cloud)
2. Subscribe: { type: 'subscribe', executionId: '...' }
3. Receive events: { eventId, eventType, timestamp, payload }
4. Heartbeat: Server sends ping every 30s
5. Reconnect: { type: 'subscribe', fromEventId: '...' }
```

### Event Filtering

| Filter        | Purpose                                   |
| ------------- | ----------------------------------------- |
| `executionId` | Only events for specific execution        |
| `eventTypes`  | Only specific event types                 |
| `fromEventId` | Resume from specific event (reconnection) |

### Reconnection Strategy

- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
- Max 5 attempts before longer delays
- Resume from last event ID
- Manual reconnect button available

---

## 8. Execution Controls

### Control Buttons

| Control    | Action                      | Enabled When                         |
| ---------- | --------------------------- | ------------------------------------ |
| **Pause**  | Stop at next phase boundary | `status === 'running'`               |
| **Resume** | Continue from paused state  | `status === 'paused'`                |
| **Cancel** | Terminate workflow          | `status === 'running' \|\| 'paused'` |

### Pause Behavior

- Pauses at phase boundary (not mid-phase)
- Shows "Pausing after current phase..."
- Status changes to `paused`
- All state preserved

### Cancel Behavior

- Terminates current agent
- Kills all child processes
- Cleans up temporary resources
- Should complete within 5 seconds
- Partial results remain available

---

## 9. Permissions and Approvals

### Permission Dialog Types

| Type             | Description            | Fields Shown              |
| ---------------- | ---------------------- | ------------------------- |
| **File Write**   | Before writing to file | File path, operation type |
| **File Delete**  | Before deleting file   | File path (with warning)  |
| **Command Exec** | Before shell command   | Command, arguments        |

### Permission Dialog UI

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Permission Required                          │
├─────────────────────────────────────────────────┤
│ The agent wants to write to:                    │
│                                                 │
│ 📄 src/services/auth.ts                         │
│                                                 │
│ ☐ Remember this decision for this file          │
│                                                 │
│              [Deny]  [Allow]                    │
└─────────────────────────────────────────────────┘
```

### Permission Decision Caching

- "Remember this decision" checkbox
- Cached per file path or command
- Clear cached permissions option in settings

### Human Approval Gates

Triggered when phase has `approval_required: true`:

```
┌─────────────────────────────────────────────────────┐
│ ⏸ Approval Required: implement                      │
├─────────────────────────────────────────────────────┤
│ ARTIFACTS FOR REVIEW:                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Artifact content / diff view]                  │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ CHECKLIST:                                          │
│ ☐ Code follows style guide                          │
│ ☑ Tests pass                                        │
│ ☐ No security vulnerabilities                       │
│ Progress: 1/3 completed                             │
│                                                     │
│ TIMEOUT: ⏱ 4:32 remaining                          │
│                                                     │
│ [Request Refinement (2/3 remaining)]                │
│ [Approve]  [Reject]                                 │
└─────────────────────────────────────────────────────┘
```

### Approval Actions

| Action                 | Result                                       |
| ---------------------- | -------------------------------------------- |
| **Approve**            | Continue to next phase                       |
| **Reject**             | Workflow fails                               |
| **Request Refinement** | Re-execute previous phase (limited attempts) |

### Approval Timeout

- Configurable timeout with visual countdown
- Warning at 30 seconds (audio/visual option)
- `defaultAction` on timeout: "approve" or "deny"
- User action cancels timeout

### Auto-Approval Conditions

- `autoApprove: "whenValidationPasses"` - Auto-approve if validations pass
- Confidence-based: `confidence > 0.9` triggers auto-approval
- All auto-approvals logged

---

## 10. Clarification Handling

### Question Types

| Type           | Description                 | Typical UI            |
| -------------- | --------------------------- | --------------------- |
| `TECHNICAL`    | Code approach, architecture | Text input or options |
| `REQUIREMENT`  | What to build, acceptance   | Text input            |
| `PERMISSION`   | Destructive action approval | Allow/Deny buttons    |
| `CHOICE`       | Select from options         | Radio buttons         |
| `CONFIRMATION` | Yes/no question             | Yes/No buttons        |

### Hierarchical Routing

```
Command Agent asks question
        │
        ▼
Phase Agent (can answer?) ──Yes──► Response flows back
        │ No
        ▼
Workflow Agent (can answer?) ──Yes──► Response flows back
        │ No
        ▼
    User (UI)
```

Only questions that reach the user are shown in UI.

### Clarification Dialog UI

```
┌─────────────────────────────────────────────────────┐
│ ❓ Clarification Needed                              │
├─────────────────────────────────────────────────────┤
│ Working on: implement authentication                │
│                                                     │
│ Which authentication approach should I use?         │
│                                                     │
│ ○ JWT Tokens                                        │
│   Stateless authentication with signed tokens       │
│                                                     │
│ ○ Session-based                                     │
│   Traditional server-side session storage           │
│                                                     │
│ ○ OAuth 2.0                                         │
│   Delegated authentication via providers            │
│                                                     │
│ Or type a custom response:                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ TIMEOUT: ⏱ 4:32 remaining                          │
│                                                     │
│                              [Submit Response]      │
└─────────────────────────────────────────────────────┘
```

### Clarification Response

| Field               | Type    | Description              |
| ------------------- | ------- | ------------------------ |
| `requestId`         | string  | Matches request          |
| `answer`            | string  | Text or option ID        |
| `isOptionSelection` | boolean | True if selecting option |

### Timeout Handling

- Default timeout: 5 minutes (300,000 ms)
- Extended timeout for complex decisions: up to 1 hour
- Status changes to `TIMED_OUT` if no response
- Agent receives error and must handle it

---

## 11. CLI Interface

### Command Structure

```
flowmaster <noun> <verb> [arguments] [flags]
```

### Core Commands

| Command                                      | Description                      |
| -------------------------------------------- | -------------------------------- |
| `flowmaster init`                            | Initialize FlowMaster in project |
| `flowmaster ui [--port]`                     | Launch web UI                    |
| `flowmaster workflow run <name> --task <id>` | Execute workflow                 |
| `flowmaster workflow list`                   | List workflows                   |
| `flowmaster workflow show <name>`            | Show workflow details            |
| `flowmaster workflow validate <name>`        | Validate workflow                |
| `flowmaster command run <name> --task <id>`  | Execute single command           |
| `flowmaster command list [--namespace]`      | List commands                    |
| `flowmaster command show <name>`             | Show command definition          |
| `flowmaster execution pause <id>`            | Pause execution                  |
| `flowmaster execution resume <id>`           | Resume execution                 |
| `flowmaster execution cancel <id>`           | Cancel execution                 |
| `flowmaster execution status <id>`           | Get status                       |

### Global Flags

| Flag             | Description                              |
| ---------------- | ---------------------------------------- |
| `--task <id>`    | Task identifier (required for execution) |
| `--model <name>` | AI model selection                       |
| `--json`         | Output as JSON                           |
| `--no-color`     | Disable colors                           |
| `--color`        | Force colors                             |
| `--headless`     | Force headless mode                      |
| `--help`         | Show help                                |

### CLI Output Format (Human)

```
Starting workflow: plan-implement
Task: TASK-123
Phase 1/3: plan [running]
  ✓ Agent spawned
  ✓ Context loaded
  🔧 Tool: Read src/auth.ts
  💭 Analyzing authentication flow...
Phase 1/3: plan [completed] (45s)
Phase 2/3: implement [running]
...
Workflow completed successfully (2m 30s)
```

### CLI Output Format (JSON)

```json
{
  "success": true,
  "executionId": "exec-abc123",
  "workflowName": "plan-implement",
  "taskId": "TASK-123",
  "duration": 150000,
  "phases": [
    { "name": "plan", "status": "completed", "duration": 45000 },
    { "name": "implement", "status": "completed", "duration": 105000 }
  ]
}
```

---

## 12. State Management

### Recommended: Zustand

Three primary stores:

#### Workflow Store

```typescript
interface WorkflowState {
  workflowName: string | null;
  taskId: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  phases: Phase[];
  currentPhaseIndex: number;
  totalPhases: number;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
}
```

#### Chat Store

```typescript
interface ChatState {
  messages: ChatMessage[];
  autoScroll: boolean;
  hasNewMessages: boolean;
  selectedPhase: number | null;
}
```

#### UI Store

```typescript
interface UIState {
  theme: 'light' | 'dark' | 'system';
  chatPanelWidth: number;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  zoomLevel: number;
  modals: { settings: boolean; approval: boolean; clarification: boolean };
  toasts: Toast[];
}
```

### Persistence

| Data             | Storage      | Persistence  |
| ---------------- | ------------ | ------------ |
| Theme preference | localStorage | Permanent    |
| Panel width      | localStorage | Permanent    |
| Workflow state   | Backend      | Permanent    |
| Graph zoom/pan   | Memory       | Session only |
| Modal states     | Memory       | Session only |

### Initial State Hydration

On connect/reconnect, fetch:

- Execution state (current workflow, phases)
- Message history (for chat)
- Pending clarification (if any)
- Pending approval (if any)

---

## 13. Events Reference

### Agent Events (subscribe to all)

| Event              | Payload                                 | UI Action             |
| ------------------ | --------------------------------------- | --------------------- |
| `agent-created`    | `agentId`, `level`, `name`, `parentId`  | Add to hierarchy      |
| `agent-started`    | `agentId`, `sessionId`                  | Show active indicator |
| `agent-paused`     | `agentId`, `reason`, `clarificationId?` | Show paused state     |
| `agent-resumed`    | `agentId`, `sessionId`                  | Clear paused state    |
| `agent-completed`  | `agentId`, `output`, `telemetry?`       | Show completion       |
| `agent-terminated` | `agentId`, `reason`, `error?`           | Show failure          |

### Streaming Events

| Event                | Payload                                         | UI Action           |
| -------------------- | ----------------------------------------------- | ------------------- |
| `stream-chunk`       | `sessionId`, `content`                          | Append to chat      |
| `stream-tool-use`    | `sessionId`, `toolName`, `action?`, `filePath?` | Show tool card      |
| `stream-tool-result` | `sessionId`, `toolName`, `success`, `output?`   | Update tool card    |
| `stream-thinking`    | `sessionId`, `content`                          | Show thinking block |

### Workflow Events

| Event                | Payload                                                | UI Action       |
| -------------------- | ------------------------------------------------------ | --------------- |
| `workflow-started`   | `executionId`, `workflowName`, `taskId`, `totalPhases` | Initialize view |
| `workflow-completed` | `executionId`, `duration`, `phaseCount`                | Show success    |
| `workflow-failed`    | `executionId`, `failedPhase`, `error`                  | Show failure    |
| `workflow-paused`    | `executionId`, `pauseReason`, `afterPhase`             | Show paused     |
| `workflow-resumed`   | `executionId`, `fromPhase`                             | Clear paused    |
| `workflow-cancelled` | `executionId`, `reason`, `currentPhase`                | Show cancelled  |

### Phase Events

| Event                | Payload                                             | UI Action       |
| -------------------- | --------------------------------------------------- | --------------- |
| `phase-started`      | `executionId`, `phaseIndex`, `phaseName`            | Update graph    |
| `phase-completed`    | `executionId`, `phaseName`, `duration`, `hasOutput` | Mark complete   |
| `phase-failed`       | `executionId`, `phaseName`, `error`, `retryable`    | Mark failed     |
| `parallel-completed` | `executionId`, `phaseIndex`, `results[]`            | Update parallel |

### Interaction Events

| Event                     | Payload                                              | UI Action        |
| ------------------------- | ---------------------------------------------------- | ---------------- |
| `clarification-requested` | `clarificationId`, `agentId`, `question`, `options?` | Show dialog      |
| `clarification-escalated` | `clarificationId`, `from`, `to`                      | Update status    |
| `approval-requested`      | `approvalId`, `executionId`, `gateName`              | Show approval UI |

### Validation Events

| Event                  | Payload                                          | UI Action     |
| ---------------------- | ------------------------------------------------ | ------------- |
| `validation-started`   | `taskId`, `phaseIndex`, `validators[]`           | Show progress |
| `validation-completed` | `taskId`, `phaseIndex`, `decision`, `confidence` | Show result   |
| `validation-failed`    | `taskId`, `phaseIndex`, `error`                  | Show error    |

---

## 14. Gateway API Reference

### Execution Operations

| Operation         | Method | Request                              | Response                       |
| ----------------- | ------ | ------------------------------------ | ------------------------------ |
| `startWorkflow`   | POST   | `{ workflowName, taskId, options? }` | `{ success, executionId }`     |
| `startCommand`    | POST   | `{ commandName, taskId, options? }`  | `{ success, executionId }`     |
| `pauseExecution`  | POST   | `{ executionId, reason? }`           | `{ success, pauseAfterPhase }` |
| `resumeExecution` | POST   | `{ executionId, skipToPhase? }`      | `{ success, resumeFromPhase }` |
| `cancelExecution` | POST   | `{ executionId, reason?, force? }`   | `{ success, finalStatus }`     |

### Query Operations

| Operation            | Method | Request            | Response                    |
| -------------------- | ------ | ------------------ | --------------------------- |
| `getWorkflows`       | GET    | -                  | `{ workflows[] }`           |
| `getWorkflowDetails` | GET    | `{ workflowName }` | `{ workflow }`              |
| `validateWorkflow`   | POST   | `{ workflowName }` | `{ valid, errors[] }`       |
| `getCommands`        | GET    | `{ namespace? }`   | `{ commands[] }`            |
| `getExecutionState`  | GET    | `{ executionId }`  | `{ state, messageHistory }` |

### Response Operations

| Operation                | Method | Request                                            | Response                  |
| ------------------------ | ------ | -------------------------------------------------- | ------------------------- |
| `respondToClarification` | POST   | `{ clarificationId, response }`                    | `{ success }`             |
| `respondToApproval`      | POST   | `{ approvalId, approved, comments?, refinement? }` | `{ success, nextAction }` |
| `respondToPermission`    | POST   | `{ permissionId, allowed, remember? }`             | `{ success }`             |

### Event Subscription

```typescript
// CLI mode
gateway.subscribeToEvents({ executionId: 'exec-123' }, (event) => handleEvent(event));

// Web mode - WebSocket
ws.send(
  JSON.stringify({
    type: 'subscribe',
    executionId: 'exec-123',
    eventTypes: ['workflow-*', 'phase-*'],
  })
);
```

---

## 15. Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Workflow not found: unknown-workflow",
    "httpStatus": 404,
    "isRetryable": false,
    "timestamp": "2025-11-29T10:30:00Z",
    "requestId": "req-abc123"
  }
}
```

### UI Error Codes

| Code         | Scenario                  | UI Action                 |
| ------------ | ------------------------- | ------------------------- |
| `ERR_UI_001` | Invalid command syntax    | Show usage help           |
| `ERR_UI_002` | Workflow not found        | List available workflows  |
| `ERR_UI_003` | Command not found         | List available commands   |
| `ERR_UI_004` | Missing required argument | Highlight missing field   |
| `ERR_UI_005` | Backend connection lost   | Show reconnection status  |
| `ERR_UI_006` | Event stream interrupted  | Buffer events, auto-retry |

### Retry Behavior

| Condition                | Retry | Max Attempts | Backoff                           |
| ------------------------ | ----- | ------------ | --------------------------------- |
| Backend connection lost  | Yes   | 5            | Exponential (1s, 2s, 4s, 8s, 16s) |
| Event stream interrupted | Yes   | Infinite     | Fixed (1s)                        |
| IPC command timeout      | Yes   | 3            | Linear (2s)                       |
| Validation error         | No    | -            | -                                 |

### Toast Notifications

| Type      | Duration       | Use Case            |
| --------- | -------------- | ------------------- |
| `info`    | 3s             | General information |
| `success` | 3s             | Operation completed |
| `warning` | 5s             | Non-critical issue  |
| `error`   | Manual dismiss | Critical error      |

---

## 16. Tech Stack Recommendations

### Frontend

| Technology           | Purpose            |
| -------------------- | ------------------ |
| **Vite 5.x**         | Build tool         |
| **React 18.x**       | UI framework       |
| **TypeScript 5.x**   | Type safety        |
| **Tailwind CSS 3.x** | Styling            |
| **React Flow**       | Workflow graph     |
| **Zustand**          | State management   |
| **Framer Motion**    | Animations         |
| **React Markdown**   | Render AI messages |
| **Lucide React**     | Icons              |
| **dagre**            | Graph layout       |

### Themes

- Light and dark themes
- System preference detection (`prefers-color-scheme`)
- Tailwind dark mode classes
- Persisted in localStorage

### Performance

- Code splitting (lazy routes)
- Virtualized lists for long chat logs
- Memoization (`React.memo`, `useMemo`)
- Event batching (batch 10 events or flush after 50ms)
- Debounced WebSocket updates

### Data Constraints

| Constraint                     | Limit               |
| ------------------------------ | ------------------- |
| Event buffer during disconnect | 10,000 events       |
| History view                   | Last 100 executions |
| Chat messages                  | Last 1,000 messages |

---

## Appendix A: Full Requirements Traceability

### High-Level UI Requirements

| ID        | Title                                 | Priority |
| --------- | ------------------------------------- | -------- |
| HL-UI-001 | CLI Interface for Automation          | Critical |
| HL-UI-002 | Real-Time Workflow Visualization      | High     |
| HL-UI-003 | Interactive Chat Interface            | High     |
| HL-UI-004 | Dual-Mode Operation (UI and Headless) | Critical |
| HL-UI-005 | Workflow Execution Controls           | High     |
| HL-UI-006 | Visual Workflow Builder               | Medium   |

### Functional Requirements Summary

| Category                | Count  | Critical | High   | Medium |
| ----------------------- | ------ | -------- | ------ | ------ |
| Foundation              | 11     | 4        | 6      | 1      |
| CLI Interface           | 15     | 6        | 5      | 4      |
| Web UI Core             | 20     | 5        | 9      | 6      |
| Execution & Control     | 4      | 2        | 1      | 1      |
| Permissions & Approvals | 11     | 0        | 4      | 7      |
| Advanced Features       | 4      | 1        | 0      | 3      |
| **Total**               | **65** | **18**   | **25** | **22** |

---

## Appendix B: Prototype Priority

For an MVP prototype, prioritize in this order:

### Phase 1: Core Visualization

1. Two-panel layout (chat + graph)
2. Basic workflow graph with phase nodes
3. Phase status indicators (pending, running, completed, failed)
4. Sequential flow visualization

### Phase 2: Real-Time Updates

5. WebSocket connection
6. Event handling for workflow/phase events
7. Chat message display (phase start/complete, tool use)
8. Auto-scroll behavior

### Phase 3: Interactions

9. Execution controls (pause, resume, cancel)
10. Node click to scroll chat
11. Clarification dialog
12. Permission dialogs

### Phase 4: Advanced Features

13. Parallel execution visualization
14. Conditional execution visualization
15. Loop/iteration visualization
16. Approval gates
17. Theme support

### Phase 5: Polish

18. Responsive design
19. Error handling and retry
20. CLI integration
21. Visual workflow builder
