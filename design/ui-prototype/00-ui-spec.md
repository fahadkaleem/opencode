# FloMaster UI Specification

> Recreating the Zenflow UI pattern for FloMaster
> Reference: `/ui-ideas/zenflow/extracted/`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Layout Structure](#2-layout-structure)
3. [Sidebar](#3-sidebar)
4. [Task Panel](#4-task-panel)
5. [Content Area](#5-content-area)
6. [Modals & Dialogs](#6-modals--dialogs)
7. [Concept Mapping](#7-concept-mapping)
8. [Implementation Priority](#8-implementation-priority)

---

## 1. Overview

### Design Philosophy
- **Task-centric**: Tasks are the primary entity, workflows execute against tasks
- **Step-based execution**: Each workflow step has its own chat/activity context
- **Chat as activity feed**: Shows agent work (tool calls, outputs), not just conversation
- **Minimal navigation**: 3-column layout, no page switching for core flows

### Reference Implementation
Zenflow (Zencoder.ai) - Screenshots in `/ui-ideas/zenflow/`

---

## 2. Layout Structure

### 2.1 Three-Column Layout

```
┌─────────────┬──────────────────────┬─────────────────────────────────┐
│   SIDEBAR   │     TASK PANEL       │         CONTENT AREA            │
│   (240px)   │      (320px)         │         (flexible)              │
│             │                      │                                 │
│  Project    │  Task Header         │  Tab Bar                        │
│  selector   │  ────────────        │  ────────────────────────────   │
│             │  Task Info           │                                 │
│  Task List  │  ────────────        │  Chat/Activity View             │
│             │  Steps List          │  (for selected step)            │
│             │  ────────────        │                                 │
│  ─────────  │  Execution Controls  │                                 │
│  + New Task │                      │                                 │
│             │                      │  ────────────────────────────   │
│  Settings   │                      │  Message Input                  │
│  Feedback   │                      │                                 │
└─────────────┴──────────────────────┴─────────────────────────────────┘
```

### 2.2 Responsive Behavior
- **Desktop (>1200px)**: Full 3-column layout
- **Tablet (768-1200px)**: Sidebar collapses, 2-column layout
- **Mobile (<768px)**: Single column with navigation drawer

---

## 3. Sidebar

### 3.1 Structure

```
┌─────────────────────┐
│  ▼ All projects     │  ← Project dropdown
├─────────────────────┤
│                     │
│  TASKS              │
│  ─────────────────  │
│  🟡 FLO-123         │  ← Status indicator + ID
│     Chadcode        │  ← Project name
│     In Progress     │  ← Status label
│                     │
│  🟠 FLO-456         │
│     FloMaster       │
│     Action req. (2) │  ← Badge with count
│                     │
│  🟢 FLO-789         │
│     Chadcode        │
│     Done            │
│                     │
├─────────────────────┤
│  + New Task         │  ← Opens New Task modal
├─────────────────────┤
│  Settings           │
│  Feedback           │
│  Sign Out           │
└─────────────────────┘
```

### 3.2 Task List Item

```typescript
interface TaskListItem {
  taskId: string;           // "FLO-123" or "LOCAL-001"
  name: string;             // Task summary (truncated)
  project: string;          // Project/team name
  status: TaskStatus;       // in_progress | action_required | in_review | done
  actionCount?: number;     // Steps needing user input
  source: TaskSource;       // linear | jira | github | local
}
```

### 3.3 Status Indicators

| Status | Icon | Color | Label |
|--------|------|-------|-------|
| `in_progress` | Filled dot | Blue (#3B82F6) | "In Progress" |
| `action_required` | Circle + badge | Orange (#F97316) | "Action req. (n)" |
| `in_review` | Clock icon | Orange (#F97316) | "In Review" |
| `done` | Checkmark | Green (#22C55E) | "Done" |

### 3.4 Project Dropdown
- Lists all available projects/teams
- Search/filter capability
- "All projects" shows tasks from all sources

---

## 4. Task Panel

### 4.1 Structure

```
┌────────────────────────────────┐
│  FLO-123                   ↗   │  ← Task ID + external link
│  ─────────────────────────────│
│  Build a CLI tool like Claude  │  ← Task name/summary
│  Code                          │
│                                │
│  [In Progress ▾]    [Merge]    │  ← Status dropdown + Merge btn
├────────────────────────────────┤
│  Steps │ Changes │ Commits     │  ← Tab navigation
├────────────────────────────────┤
│                                │
│  ▶ Run [Full SDD ▾]            │  ← Workflow selector + Run btn
│                                │
│  ─────────────────────────────│
│  ✓ Requirements      2m ago    │  ← Completed step
│  ✓ Tech Spec         1m ago    │
│  ● Planning          running   │  ← Active step (highlighted)
│  ○ Implementation    pending   │
│                                │
│  + Add step                    │  ← Add custom step
│                                │
├────────────────────────────────┤
│  ☐ Auto-start steps            │  ← Toggle for autonomous mode
├────────────────────────────────┤
│  [⏸ Pause]  [⏹ Cancel]         │  ← Execution controls
└────────────────────────────────┘
```

### 4.2 Task Header

```typescript
interface TaskHeader {
  taskId: string;
  name: string;
  externalUrl?: string;     // Link to Linear/Jira/GitHub
  status: TaskStatus;
  canMerge: boolean;        // Show merge button when in_review
}
```

### 4.3 Steps Tab

#### Step List Item

```
┌────────────────────────────────┐
│  ✓ Requirements      2m ago    │  ← Icon + Name + Time
│     └─ requirements.md created │  ← Optional artifact info
└────────────────────────────────┘
```

```typescript
interface StepListItem {
  stepId: string;
  name: string;
  status: StepStatus;       // pending | in_progress | action_required | completed
  startedAt?: string;
  completedAt?: string;
  artifact?: string;        // Generated file path
  isSelected: boolean;      // Highlighted when selected
}
```

#### Step Status Icons

| Status | Icon | Description |
|--------|------|-------------|
| `pending` | Empty circle (○) | Not started |
| `in_progress` | Filled dot (●) | Running, pulsing animation |
| `action_required` | Orange dot | Waiting for user input |
| `completed` | Checkmark (✓) | Done |

#### Workflow Selector
- Dropdown with available workflows:
  - Quick Change
  - Fix Bug
  - Spec and Build
  - Full SDD Workflow
  - Custom workflows from `.flomaster/workflows/`

### 4.4 Changes Tab

```
┌────────────────────────────────┐
│  All changes                   │
│                                │
│  1 uncommitted file changed    │
│  ┌─────────────────────────┐   │
│  │ ^ plan.md        +56 -0 │   │
│  └─────────────────────────┘   │
│                                │
│  3 committed files changed     │
│  ┌─────────────────────────┐   │
│  │ {} .gitignore    +33 -0 │   │
│  │ [] requirements.md +431 │   │
│  │ [] spec.md      +384 -0 │   │
│  └─────────────────────────┘   │
└────────────────────────────────┘
```

### 4.5 Commits Tab

```
┌────────────────────────────────┐
│  Recent commits                │
│                                │
│  → Requirements     2m   abc123│
│  → Init task        5m   def456│
│                                │
│  [Rollback]                    │
└────────────────────────────────┘
```

### 4.6 Execution Controls

| Control | Icon | Action | When Visible |
|---------|------|--------|--------------|
| Pause | ⏸ | Pause execution | When running |
| Resume | ▶ | Resume paused | When paused |
| Cancel | ⏹ | Cancel execution | When running/paused |

---

## 5. Content Area

### 5.1 Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [🕐] [Planning ×] [+ New chat] [+ New terminal]            │  ← Tab bar
├─────────────────────────────────────────────────────────────┤
│  Context: Planning step                                     │  ← Context indicator
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🤖 I'll create an implementation plan based on      │    │
│  │    the technical specification...                   │    │
│  │                                                     │    │
│  │ [3 tools] ▼                                         │    │  ← Collapsible tool calls
│  │   > Read spec.md ✓                                  │    │
│  │   > Read requirements.md ✓                          │    │
│  │   > Write plan.md ✓                                 │    │
│  │                                                     │    │
│  │ Here's the implementation plan I've created:        │    │
│  │ ...                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ You: Can you add more detail to phase 2?            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🤖 Sure, I'll expand the file read tools section... │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Action required - Agent needs your input               │  ← Banner (when needed)
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Type a message...                              [↵]  │    │  ← Input
│  └─────────────────────────────────────────────────────┘    │
│  Continue working: [Claude ▾] [Opus ▾]                      │  ← Agent/Model selector
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Tab Bar

```typescript
interface ContentTab {
  id: string;
  type: 'step_chat' | 'file' | 'terminal' | 'new_chat';
  title: string;
  icon: 'chat' | 'file' | 'terminal';
  stepId?: string;          // For step_chat tabs
  filePath?: string;        // For file tabs
  isClosable: boolean;
  hasUnsavedChanges?: boolean;
}
```

#### Tab Types
- **Step chat** (💬): Chat session for a workflow step
- **File** (📄): Artifact file viewer (requirements.md, spec.md, plan.md)
- **Terminal** (⬛): Terminal session
- **New chat** (+): Create new general chat

#### Tab Bar Actions
- 🕐 History icon: Opens tab search/history panel
- × Close tab
- + New chat
- + New terminal

### 5.3 Chat Message Types

#### Assistant Message with Tool Calls

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 I'll analyze the codebase and create a specification... │
│                                                             │
│ [4 tools] ▼                                                 │
│   > Read src/config.ts ✓                                    │
│     └─ 245 lines, TypeScript configuration module           │
│   > Read src/index.ts ✓                                     │
│     └─ 180 lines, main entry point                          │
│   > List src/tools/ ✓                                       │
│     └─ 5 files: read-file.ts, write-file.ts, ...           │
│   > Write spec.md ✓                                         │
│     └─ Created technical specification (384 lines)          │
│                                                             │
│ Based on my analysis, here's the technical specification... │
└─────────────────────────────────────────────────────────────┘
```

#### User Message

```
┌─────────────────────────────────────────────────────────────┐
│ You: Can you explain the authentication flow in more detail?│
└─────────────────────────────────────────────────────────────┘
```

#### Action Required Banner

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Action required                                          │
│ The agent needs your input to continue.                     │
│                                                             │
│ Question: Should I use JWT or session-based authentication? │
│                                                             │
│ [Respond below]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Tool Call Display

#### Collapsed View
```
[4 tools] ▶
```

#### Expanded View
```
[4 tools] ▼
  > Read src/config.ts ✓
    ARGS: { path: "src/config.ts" }
    OUTPUT: [file contents preview...]

  > Write spec.md ✓
    ARGS: { path: ".flomaster/tasks/123/spec.md", content: "..." }
    OUTPUT: File created successfully
```

### 5.5 Message Input

```typescript
interface MessageInput {
  value: string;
  placeholder: string;      // "Type a message..."
  isDisabled: boolean;      // During execution
  onSubmit: (message: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;  // Enter to send, Shift+Enter for newline
}
```

### 5.6 Agent/Model Selector

```
Continue working: [Claude Code ▾] [Opus ▾]
                       │              │
                       │              └─ Model selector (Opus, Sonnet, Haiku)
                       └─ Agent selector (for multi-agent scenarios)
```

---

## 6. Modals & Dialogs

### 6.1 New Task Modal

```
┌─────────────────────────────────────────────────────────────┐
│  New task                                               ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Task type                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⚡ Quick change        Simple, fast modifications   │ ○  │
│  │ 🐛 Fix bug             Debug and fix issues         │ ○  │
│  │ 📦 Spec and build      Specification + implement    │ ○  │
│  │ 📄 Full SDD workflow   Complete SDLC process        │ ●  │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Project                                                    │
│  [FloMaster                                           ▾]    │
│                                                             │
│  Branch name                                                │
│  [feature/new-task-abc123                              ]    │
│                                                             │
│  What would you like to build?                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Build a CLI tool similar to Claude Code with        │    │
│  │ file reading, writing, and command execution...     │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Agent                                                      │
│  [Claude Code                                         ▾]    │
│  Configuration: [Default                              ▾]    │
│                                                             │
│  ☐ Auto-start next steps on success                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Create]  [Create & Run]│
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Add Step Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Add step                                               ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step name                                                  │
│  [Code Review                                          ]    │
│                                                             │
│  Instructions                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Review the implementation for:                      │    │
│  │ - Code quality and best practices                   │    │
│  │ - Security vulnerabilities                          │    │
│  │ - Performance issues                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Agent                                                      │
│  [Claude Code                                         ▾]    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                        [Cancel]  [Add Step] │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Merge Dialog

```
┌─────────────────────────────────────────────────────────────┐
│  Merge changes                                          ✕   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Source branch                                              │
│  feature/new-task-be7d                                      │
│                                                             │
│  Target branch                                              │
│  [main                                                ▾]    │
│                                                             │
│  Summary                                                    │
│  • 12 commits                                               │
│  • 8 files changed                                          │
│  • +1,234 / -56 lines                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                        [Cancel]  [Merge]    │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Settings Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                               ✕   │
├─────────────────────────────────────────────────────────────┤
│  [Preferences] [Integrations] [Agents]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INTEGRATIONS                                               │
│                                                             │
│  GitHub                           [Connected ✓] [Test]      │
│  Linear                           [Connected ✓] [Test]      │
│  Jira                             [Not connected] [Connect] │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  AGENTS                                                     │
│                                                             │
│  Claude Code                      [Default]                 │
│  └─ Model: claude-opus-4-5-20251101                         │
│                                                             │
│  Gemini                           [Configure]               │
│  └─ Not configured                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Concept Mapping

### 7.1 Zenflow → FloMaster

| Zenflow Concept | FloMaster Equivalent | Notes |
|-----------------|---------------------|-------|
| Task | Task (from TaskManager) | Supports Linear/Jira/GitHub/Local |
| Task Type | Workflow Template | JSON files in `.flomaster/workflows/` |
| Step | Workflow Node | StepData in orchestrator |
| Step checkboxes | Agent work within step | Not tracked separately |
| chat-id | Session (opencode SDK) | Managed by StateManager |
| plan.md | Workflow JSON + artifacts | Keep separate |
| {@artifacts_path} | `.flomaster/tasks/{taskId}/` | Artifact storage |
| Auto-start steps | Autonomous execution mode | Via ExecutionOptions |
| Action required | WAITING_INPUT status | StepExecutionStatus |

### 7.2 State Mapping

| Zenflow State | FloMaster State |
|---------------|-----------------|
| Task.status | Derived from WorkflowExecution.status |
| Step.status | StepExecutionStatus |
| Chat session | opencode SDK session |
| File changes | Git integration (future) |
| Commits | Git integration (future) |

### 7.3 API Mapping

| UI Action | API Endpoint | Notes |
|-----------|--------------|-------|
| Load tasks | `GET /api/tasks` | From TaskManager |
| Get task | `GET /api/tasks/:id` | Single task |
| Create task | `POST /api/tasks` | Via TaskProvider |
| Start workflow | `POST /api/workflow/start` | Start execution |
| Get execution | `GET /api/executions/:id` | Execution state |
| Send message | `POST /api/chat/message` | To step session |
| Get step activity | `GET /api/executions/:id/steps/:stepId` | Step details |
| Pause/Resume | `POST /api/executions/:id/pause|resume` | Control execution |

---

## 8. Implementation Priority

### Phase 1: Core Layout (Week 1)
1. ✅ Three-column layout component
2. ✅ Sidebar with task list
3. ✅ Task panel with step list
4. ✅ Content area with chat view
5. ✅ Basic message display

### Phase 2: Task Flow (Week 2)
1. New Task modal
2. Workflow selection
3. Step status indicators
4. Step selection → chat context switch
5. Message input with streaming

### Phase 3: Execution (Week 3)
1. Tool call display (collapsible)
2. Action required banner
3. Pause/Resume/Cancel controls
4. Real-time status updates via SSE
5. Auto-scroll on new messages

### Phase 4: Polish (Week 4)
1. Add Step modal
2. Tab bar with history
3. Changes/Commits tabs (stub)
4. Settings modal
5. Merge dialog (stub)

---

## Appendix: Component Inventory

### Layout Components
- `AppLayout` - Root 3-column layout
- `Sidebar` - Left sidebar
- `TaskPanel` - Middle panel
- `ContentArea` - Right content area

### Sidebar Components
- `ProjectSelector` - Dropdown for project selection
- `TaskList` - List of tasks
- `TaskListItem` - Individual task row
- `StatusBadge` - Status indicator with label

### Task Panel Components
- `TaskHeader` - Task ID, name, status
- `TabNav` - Steps/Changes/Commits tabs
- `StepList` - List of workflow steps
- `StepListItem` - Individual step row
- `WorkflowSelector` - Dropdown for workflow selection
- `ExecutionControls` - Pause/Resume/Cancel buttons
- `AutoStartToggle` - Auto-start steps toggle

### Content Area Components
- `TabBar` - Content tabs
- `ContentTab` - Individual tab
- `ChatView` - Chat messages container
- `MessageList` - List of messages
- `AssistantMessage` - AI message with tool calls
- `UserMessage` - User message
- `ToolCallList` - Collapsible tool calls
- `ToolCallItem` - Individual tool call
- `ActionRequiredBanner` - User input needed banner
- `MessageInput` - Text input with send button
- `AgentSelector` - Agent/model dropdowns

### Modal Components
- `NewTaskModal` - Create new task
- `AddStepModal` - Add custom step
- `MergeDialog` - Merge changes
- `SettingsModal` - App settings

### Shared Components
- `Button` - Standard button
- `Dropdown` - Select dropdown
- `Toggle` - Switch toggle
- `Badge` - Status/count badge
- `Icon` - Icon component
- `Avatar` - User avatar
- `Tooltip` - Hover tooltip

---

## Next Steps

1. Review this spec with stakeholder
2. Create component stubs in ui-prototype
3. Wire up to existing API layer
4. Implement Phase 1 components
5. Test with mock data
6. Connect to real backend
