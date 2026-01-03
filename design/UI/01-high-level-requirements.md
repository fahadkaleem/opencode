# FloMaster UI - High-Level Requirements

> **Document Version**: 2.0
> **Last Updated**: 2025-12-30
> **Status**: Draft
> **Owner**: Fahad Kaleem
> **Related Overview**: [Product Overview](../01-overview/01-product-overview.md)

---

## 1. Introduction

### 1.1 Purpose

This document defines the high-level requirements for the FloMaster UI. These requirements describe WHAT capabilities the interface needs at a strategic level, informed by UX research and competitive analysis of tools like Linear, VS Code, Cursor, Claude Desktop, and Zenflow.

### 1.2 Scope

This document covers:

- High-level functional capabilities (HL-xxx)
- Non-functional requirements / quality attributes (NFR-xxx)
- User personas and their goals
- Layout and interaction patterns
- View-specific requirements

Detailed functional requirements (FR-xxx) are documented separately after components are defined.

### 1.3 Requirement ID Conventions

| Type                       | Format        | Example      | Purpose              |
| -------------------------- | ------------- | ------------ | -------------------- |
| High-Level Requirement     | HL-[AREA]-XXX | HL-LAY-001   | Strategic capability |
| Non-Functional Requirement | NFR-[CAT]-XXX | NFR-USE-001  | Quality attribute    |

**NFR Category Codes**:
| Code | Category |
|------|----------|
| PERF | Performance |
| USE | Usability |
| ACC | Accessibility |
| CON | Consistency |
| RES | Responsiveness |

### 1.4 Requirement Areas

| Area Code | Area Name           | Description                                    |
| --------- | ------------------- | ---------------------------------------------- |
| LAY       | Layout              | Overall application structure and panels       |
| NAV       | Navigation          | Icon rail and view switching                   |
| CHT       | Chat View           | Main codebase chat with session history        |
| TSK       | Tasks View          | Task list (Kanban/List) and task selection     |
| TDT       | Task Detail View    | Task execution: steps, changes, commits, chat  |
| WFL       | Workflows View      | Workflow browsing, creation, and editing       |
| SET       | Settings View       | Application configuration                      |
| STP       | Step Management     | Workflow steps display and interaction         |
| MSG       | Chat Interface      | Agent conversation UI components               |
| CHG       | Changes & Commits   | Git integration display                        |
| BLD       | Build Mode          | React Flow workflow editor                     |
| THM       | Theming             | Visual design and styling                      |

### 1.5 Priority Levels

| Priority     | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| **Critical** | System cannot function without this. Must be in MVP.    |
| **High**     | Important for core value proposition. Should be in MVP. |
| **Medium**   | Valuable but not essential for launch.                  |
| **Low**      | Nice to have. Future consideration.                     |

---

## 2. User Personas

### 2.1 Primary Personas

#### Persona: Developer (Primary)

| Attribute           | Description                                              |
| ------------------- | -------------------------------------------------------- |
| **Role**            | Software developer working on features and fixes         |
| **Goals**           | Execute AI-assisted workflows efficiently                |
| **Pain Points**     | Context switching, losing track of workflow state        |
| **Technical Skill** | Expert                                                   |
| **Usage Frequency** | Daily                                                    |

**Typical Scenario**:

> Developer starts a new feature task, monitors the Requirements step as it executes, reviews changes, provides input when the agent asks questions, and eventually merges the completed work.

---

#### Persona: Tech Lead

| Attribute           | Description                                              |
| ------------------- | -------------------------------------------------------- |
| **Role**            | Technical lead overseeing team workflows                 |
| **Goals**           | Design reusable workflows, review team output            |
| **Pain Points**     | Lack of visibility into workflow execution               |
| **Technical Skill** | Expert                                                   |
| **Usage Frequency** | Weekly                                                   |

**Typical Scenario**:

> Tech lead designs a workflow template using the Workflows view (React Flow), then monitors multiple tasks running across team projects.

---

## 3. High-Level Requirements

### 3.1 Layout (HL-LAY-xxx)

#### HL-LAY-001: Icon Rail Navigation

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | Critical             |
| **Traces to** | BG-001 (Usability)   |
| **Personas**  | Developer, Tech Lead |

**Requirement**:
The system SHALL use a minimal icon rail (40-48px) on the left edge for primary navigation between views, so that maximum screen real estate is available for content.

**Rationale**:
Research on VS Code, Cursor, and Slack shows icon rails provide efficient navigation without consuming valuable horizontal space. Users spend most time in one view, so navigation should be minimal.

**Success Criteria**:

- Icon rail is always visible (not collapsible)
- Icons clearly indicate view purpose
- Active view is visually highlighted
- Hover states show tooltips with view names

---

#### HL-LAY-002: View-Specific Layouts

| Attribute     | Value                              |
| ------------- | ---------------------------------- |
| **Priority**  | Critical                           |
| **Traces to** | BG-001 (Usability)                 |
| **Personas**  | Developer, Tech Lead               |

**Requirement**:
The system SHALL support different layout structures for different views while maintaining consistent icon rail position, so that each view is optimized for its purpose.

**Rationale**:
Different views have different needs: Chat needs session history, Tasks needs full-width kanban, Task Detail needs split panels. One-size-fits-all doesn't work.

**Success Criteria**:

- Chat View: Split pane (sessions list + chat)
- Tasks View (Kanban): Full-width board
- Tasks View (List): Full-width list
- Task Detail View: Split pane (task panel + step chat)
- Workflows View: Split pane (list + preview) or full canvas (edit mode)
- Settings View: Split pane (categories + settings)

---

#### HL-LAY-003: Consistent Header Bar

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001 (Usability) |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display a consistent header bar across all views showing context (view name, current item) and global actions (settings, user), so that users always know where they are.

**Rationale**:
A consistent header provides orientation and quick access to common actions regardless of current view.

**Success Criteria**:

- Header shows current view/context
- Back navigation where applicable
- Settings icon accessible from all views
- Project name visible (clickable for project switch)

---

### 3.2 Navigation (HL-NAV-xxx)

#### HL-NAV-001: Icon Rail Structure

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer, Tech Lead |

**Requirement**:
The system SHALL provide an icon rail with the following navigation items: (1) Logo/Project, (2) Chat, (3) Tasks, (4) Workflows, (5) Settings, so that users can access all primary views.

**Rationale**:
These four views represent the core capabilities: exploring codebase (Chat), managing work (Tasks), building workflows (Workflows), and configuration (Settings).

**Icon Rail Structure**:
```
┌────┐
│ FM │  ← Logo (click → Project switcher modal)
│────│
│ 💬 │  ← Chat View
│ 📋 │  ← Tasks View (Kanban/List → Task Detail)
│ 🔀 │  ← Workflows View
│    │
│    │
│ ⚙️ │  ← Settings View
└────┘
```

**Success Criteria**:

- Four distinct icons clearly differentiated
- Logo at top for branding and project switching
- Settings at bottom (convention)
- Active state clearly visible (highlight, indicator)

---

#### HL-NAV-002: Project Switching

| Attribute     | Value                  |
| ------------- | ---------------------- |
| **Priority**  | High                   |
| **Traces to** | BG-002 (Multi-project) |
| **Personas**  | Developer, Tech Lead   |

**Requirement**:
The system SHALL provide a project selector modal when clicking the logo, so that users can switch between different codebases/projects.

**Rationale**:
Developers often work across multiple projects. A modal is appropriate because project switching is infrequent and deserves focused attention.

**Success Criteria**:

- Click logo opens project switcher modal
- Shows current project (highlighted)
- Shows recent projects for quick access
- Search functionality for many projects
- Create new project option

---

#### HL-NAV-003: View State Persistence

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Medium             |
| **Traces to** | BG-001 (Usability) |
| **Personas**  | Developer          |

**Requirement**:
The system SHOULD remember the last state of each view (selected task, scroll position, selected session) when switching between views, so that users can resume where they left off.

**Rationale**:
Context preservation reduces cognitive load when multitasking between chat, tasks, and workflows.

**Success Criteria**:

- Switching away from a view and back preserves state
- Selected items remain selected
- Scroll positions restored
- State persists across sessions (optional)

---

### 3.3 Chat View (HL-CHT-xxx)

#### HL-CHT-001: Split Pane Layout

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display the Chat View with a split pane layout: sessions list on the left, active chat on the right, so that users can manage multiple conversation sessions like Claude Desktop.

**Rationale**:
Users often have multiple ongoing conversations about different topics. Session history allows context switching without losing previous work.

**Layout**:
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│    │ Sessions             │ Chat                                    │
│ 💬 │ ──────────────────── │ ─────────────────────────────────────── │
│━━━━│ ● Current session    │                                         │
│ 📋 │ ○ Auth exploration   │ [Chat messages...]                      │
│ 🔀 │ ○ API design help    │                                         │
│    │ ○ Bug investigation  │                                         │
│    │                      │                                         │
│    │ + New session        │ [Input bar at bottom]                   │
│ ⚙️ │                      │                                         │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

**Success Criteria**:

- Sessions panel width ~250px (resizable optional)
- Sessions listed with title and timestamp
- Current session highlighted
- New session button available
- Chat panel fills remaining width

---

#### HL-CHT-002: Session Management

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL allow users to create, rename, and delete chat sessions, so that conversations can be organized by topic.

**Rationale**:
Different conversations serve different purposes. Organization improves findability and reduces clutter.

**Success Criteria**:

- Create new session (+ button or keyboard shortcut)
- Sessions auto-named based on first message (editable)
- Delete session with confirmation
- Sessions persist across app restarts

---

#### HL-CHT-003: Codebase Chat Capability

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL provide AI chat capability with full codebase context (like Cursor), so that users can ask questions, explore code, and get assistance without being in a task context.

**Rationale**:
Not all AI interactions require a formal workflow. Quick questions, code exploration, and ad-hoc assistance are common use cases.

**Success Criteria**:

- Chat has access to project files
- @ mentions to reference specific files
- Tool calls displayed (file reads, searches)
- Markdown rendering for responses

---

### 3.4 Tasks View (HL-TSK-xxx)

#### HL-TSK-001: Kanban Board View

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer, Tech Lead |

**Requirement**:
The system SHALL display tasks in a full-width Kanban board view with columns for status (Backlog, To Do, In Progress, Done), so that users can visualize work state at a glance.

**Rationale**:
Kanban is a familiar, effective pattern for task management used by Linear, Jira, and other tools.

**Layout**:
```
┌────┬────────────────────────────────────────────────────────────────────┐
│    │ Tasks    [+ New Task]    [Kanban ▼]                           [⚙️] │
│ 💬 ├────────────────────────────────────────────────────────────────────┤
│    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ 📋 │  │ Backlog  │  │ To Do    │  │ Progress │  │ Done     │           │
│━━━━│  │──────────│  │──────────│  │──────────│  │──────────│           │
│ 🔀 │  │ [Card]   │  │ [Card]   │  │ [Card]   │  │ [Card]   │           │
│    │  │ [Card]   │  │ [Card]   │  │ [Card]   │  │          │           │
│    │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│ ⚙️ │                                                                    │
└────┴────────────────────────────────────────────────────────────────────┘
```

**Success Criteria**:

- Full-width board (no side panels)
- Drag and drop between columns
- Task cards show: name, status indicator, progress
- Click card opens Task Detail View
- Column counts visible

---

#### HL-TSK-002: List View

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL provide an alternative list view for tasks with sortable columns, so that users can view tasks in a dense, scannable format.

**Rationale**:
Some users prefer list views for quick scanning and sorting. Both views should be available.

**Success Criteria**:

- Toggle between Kanban and List views
- List shows: status, task name, branch, last updated
- Sortable columns
- Click row opens Task Detail View

---

#### HL-TSK-003: Task Creation

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL provide a task creation flow that captures: task name, description, workflow template selection, and project context, so that new work can be initiated.

**Rationale**:
Task creation is the starting point for all workflow executions. It must be quick but capture necessary context.

**Success Criteria**:

- "+ New Task" button visible in header
- Modal or slide-over for creation form
- Workflow template selection
- Auto-create git branch option
- Create and Create & Run options

---

### 3.5 Task Detail View (HL-TDT-xxx)

#### HL-TDT-001: Split Pane Layout

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display the Task Detail View with a split pane layout: Task Panel on the left, Step Chat on the right, so that task context is visible alongside the active conversation.

**Rationale**:
Users need to see task progress (steps, changes, commits) while chatting with the agent. Split pane keeps both visible.

**Layout**:
```
┌────┬──────────────────────────────────────────────────────────────────────┐
│    │ ← Tasks    Auth Feature ▼    ⎇ feature/auth-be7d               [⚙️] │
│ 💬 ├────────────────────────────────┬─────────────────────────────────────┤
│    │  [In Progress ▼] [Merge]       │  Technical Specification            │
│ 📋 │  ────────────────────────      │  Status: ● In Progress              │
│━━━━│  STEPS                         │  ─────────────────────────────────  │
│ 🔀 │  ✓ Requirements                │                                     │
│    │  ● Tech Spec    ← selected     │  [Chat messages...]                 │
│    │  ○ Planning                    │                                     │
│    │  ○ Implementation              │                                     │
│    │  + Add step                    │                                     │
│    │  ────────────────────────      │  ─────────────────────────────────  │
│ ⚙️ │  CHANGES (3)                ▼  │  [Input bar]                        │
│    │  COMMITS (2)                ▼  │                                     │
└────┴────────────────────────────────┴─────────────────────────────────────┘
```

**Success Criteria**:

- Task Panel width ~320px (fixed or resizable)
- Step Chat fills remaining width
- Chat position consistent (always right side)
- Back button returns to Tasks View

---

#### HL-TDT-002: Task Header Information

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display task context in the header bar: back button, task name (with quick-switch dropdown), git branch, and settings, so that users know which task they're working on.

**Rationale**:
Task context must be visible at all times. Header placement keeps it accessible without consuming panel space.

**Success Criteria**:

- "← Tasks" back button to return to Tasks View
- Task name with dropdown for quick switching to recent tasks
- Git branch name (clickable for git actions optional)
- Consistent header across Task Detail View

---

#### HL-TDT-003: Task Panel Content

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display in the Task Panel: (1) status controls, (2) steps list, (3) recent changes, (4) commits, all in a single scrollable area without tabs, so that related information is visible together.

**Rationale**:
Research shows tabs hide information users need to cross-reference. Steps, changes, and commits are related data that should be visible simultaneously.

**Success Criteria**:

- Status dropdown and Merge button at top
- Steps list always visible
- Changes section (collapsible)
- Commits section (collapsible)
- No tabs - single scrollable panel

---

### 3.6 Step Management (HL-STP-xxx)

#### HL-STP-001: Steps List Display

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display all workflow steps as a vertical list in the Task Panel with status indicators, so that users can see the complete workflow structure and progress.

**Rationale**:
A list view provides a clear, scannable overview of workflow progress that's always visible alongside the active chat.

**Success Criteria**:

- All steps visible in scrollable list
- Step status indicated (○ pending, ● in progress, ✓ completed, ✗ failed)
- Current/active step visually highlighted
- Clickable to select and view step chat

---

#### HL-STP-002: Conditional Step Display

| Attribute     | Value                       |
| ------------- | --------------------------- |
| **Priority**  | High                        |
| **Traces to** | BG-004 (Advanced Workflows) |
| **Personas**  | Developer, Tech Lead        |

**Requirement**:
The system SHALL display conditional branches (if/else) in the steps list with visual indentation and condition indicators, so that users understand the workflow logic.

**Rationale**:
Workflows may have conditional branches. Users need to see which branch is active and why.

**Visual Example**:
```
○ Requirements
● Tech Spec
◇ Auth Setup ─────────────
  │ Condition: hasComplexAuth
  ├─ ○ Setup OAuth (if true)
  └─ ○ Setup basic auth (if false)
○ Implementation
```

**Success Criteria**:

- Conditional steps show branch indicator icon (◇ diamond)
- Child steps indented under condition
- Condition text/label visible
- Active branch highlighted, inactive dimmed

---

#### HL-STP-003: Loop Step Display

| Attribute     | Value                       |
| ------------- | --------------------------- |
| **Priority**  | High                        |
| **Traces to** | BG-004 (Advanced Workflows) |
| **Personas**  | Developer, Tech Lead        |

**Requirement**:
The system SHALL display loop steps with iteration progress indicators, so that users can track progress through repeated executions.

**Rationale**:
Workflows may iterate over collections. Users need to see current iteration and total count.

**Visual Example**:
```
● Implement Features ⟳ 2/5
  │ Iterating over: subtasks
  ├─ ✓ Feature: Login
  ├─ ✓ Feature: Logout
  ├─ ● Feature: Profile ← current
  ├─ ○ Feature: Settings
  └─ ○ Feature: Dashboard
```

**Success Criteria**:

- Loop steps show loop indicator (⟳)
- Progress shown as "2/5"
- Individual iterations listed as child steps
- Current iteration highlighted

---

#### HL-STP-004: Parallel Step Display

| Attribute     | Value                       |
| ------------- | --------------------------- |
| **Priority**  | Medium                      |
| **Traces to** | BG-004 (Advanced Workflows) |
| **Personas**  | Developer, Tech Lead        |

**Requirement**:
The system SHOULD display parallel steps with a visual indicator showing concurrent execution.

**Visual Example**:
```
● Running in parallel ═══════
  ├─ ● Frontend implementation
  └─ ● Backend implementation
○ Integration Testing
```

**Success Criteria**:

- Parallel steps grouped with visual indicator (═)
- Each parallel step shows individual status
- Clear visual that these run concurrently

---

#### HL-STP-005: Add Step Capability

| Attribute     | Value                 |
| ------------- | --------------------- |
| **Priority**  | High                  |
| **Traces to** | BG-005 (Flexibility)  |
| **Personas**  | Developer             |

**Requirement**:
The system SHALL provide an "Add step" action at the bottom of the steps list.

**Success Criteria**:

- "+ Add step" button visible at end of list
- Opens step creation modal/form
- New step added to workflow

---

### 3.7 Chat Interface (HL-MSG-xxx)

#### HL-MSG-001: Step Chat Display

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display the conversation history for the selected step in the Main Content panel, so that users can see agent messages, tool calls, and their own inputs.

**Success Criteria**:

- Chat messages in chronological order
- User messages visually distinct (right-aligned, dark background)
- Agent messages left-aligned with markdown rendering
- Scrollable history with auto-scroll to newest

---

#### HL-MSG-002: Tool Call Display

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display tool calls as collapsible blocks showing the tool name, arguments, and output.

**Success Criteria**:

- Tool calls shown as collapsible summary row
- Collapsed: shows tool name and brief description
- Expanded: shows full arguments and output
- Tool output formatted appropriately (code blocks, etc.)

---

#### HL-MSG-003: Chat Input Bar

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL provide a text input area fixed at the bottom of the chat interface with agent/model selectors.

**Success Criteria**:

- Multi-line text input with placeholder
- Send button (enabled when input has content)
- Agent selector dropdown (Claude Code, etc.)
- Model selector dropdown (Opus, Sonnet, etc.)
- File attachment button
- @ mention for file search

---

#### HL-MSG-004: Action Required Indicator

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL display a prominent "Action Required" indicator when the agent is waiting for user input.

**Success Criteria**:

- Prominent banner/badge visible in chat
- Also visible in steps list and task card
- Clear visual distinction (orange color, warning icon)
- Dismisses when user provides input

---

#### HL-MSG-005: Step Navigation

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL provide previous/next navigation in the chat header, so that users can quickly move between steps.

**Success Criteria**:

- ← and → arrows in chat header
- Navigate to previous/next step in sequence
- Disabled at first/last step

---

### 3.8 Changes & Commits (HL-CHG-xxx)

#### HL-CHG-001: Changes Section

| Attribute     | Value                      |
| ------------- | -------------------------- |
| **Priority**  | High                       |
| **Traces to** | BG-003 (Git Integration)   |
| **Personas**  | Developer                  |

**Requirement**:
The system SHALL display a list of changed files in the Task Panel with diff stats.

**Success Criteria**:

- List of changed files with +/- line counts
- File icon indicating type
- Clickable to view full diff in Main Content
- Collapsible section

---

#### HL-CHG-002: Commits Section

| Attribute     | Value                      |
| ------------- | -------------------------- |
| **Priority**  | High                       |
| **Traces to** | BG-003 (Git Integration)   |
| **Personas**  | Developer                  |

**Requirement**:
The system SHALL display a list of commits in the Task Panel.

**Success Criteria**:

- Commits with message (truncated), hash, timestamp
- Clickable to view commit details
- Collapsible section

---

#### HL-CHG-003: Diff Viewer

| Attribute     | Value                      |
| ------------- | -------------------------- |
| **Priority**  | High                       |
| **Traces to** | BG-003 (Git Integration)   |
| **Personas**  | Developer                  |

**Requirement**:
The system SHALL provide a diff viewer in the Main Content panel.

**Success Criteria**:

- Side-by-side or unified diff view
- Syntax highlighting
- Line numbers
- Expand/collapse unchanged sections

---

### 3.9 Workflows View (HL-WFL-xxx)

#### HL-WFL-001: Workflows List

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-004             |
| **Personas**  | Tech Lead          |

**Requirement**:
The system SHALL display a split-pane Workflows View with: workflow list on left, workflow preview on right.

**Layout**:
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│    │ MY WORKFLOWS         │ Full SDD Workflow                       │
│ 💬 │ ──────────────────── │ ─────────────────────────────────────── │
│    │ ● Full SDD Workflow  │ Description and preview...              │
│ 📋 │ ○ Quick Change       │                                         │
│    │ ○ Bug Triage         │ [Steps Preview Graph]                   │
│ 🔀 │ ──────────────────── │                                         │
│━━━━│ TEMPLATES            │                                         │
│    │ ○ SDLC Standard      │ [Edit Workflow] [Use in Task]           │
│ ⚙️ │                      │                                         │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

**Success Criteria**:

- User workflows listed separately from templates
- Selected workflow shows preview and actions
- "Edit Workflow" opens Build Mode
- "Use in Task" allows using in new task

---

#### HL-WFL-002: Workflow Graph Editor (Build Mode)

| Attribute     | Value                       |
| ------------- | --------------------------- |
| **Priority**  | Medium                      |
| **Traces to** | BG-004 (Advanced Workflows) |
| **Personas**  | Tech Lead                   |

**Requirement**:
The system SHALL provide a visual workflow editor using React Flow in a full-canvas Build Mode.

**Layout (Edit Mode)**:
```
┌────┬────────────────────────────────────────────────────────────────────┐
│    │ ← Workflows    Full SDD Workflow    [Save] [Test Run ▶]       [⚙️] │
│ 💬 ├────────────────────────────────────────────────────────────────────┤
│    │                                                                    │
│ 📋 │                    REACT FLOW CANVAS                               │
│    │                                                                    │
│ 🔀 │        [Requirements] ──────→ [Tech Spec]                          │
│━━━━│               │                     │                              │
│    │               ▼                     ▼                              │
│    │        [Planning] ──────────→ [Implementation]                     │
│    │                                                                    │
│ ⚙️ │  [+ Add Step]  [+ Add Condition]  [+ Add Loop]                     │
└────┴────────────────────────────────────────────────────────────────────┘
```

**Success Criteria**:

- Full-screen React Flow canvas
- Nodes represent workflow steps
- Edges represent dependencies
- Drag-and-drop node creation
- Properties panel when node selected (slide-in)

---

#### HL-WFL-003: Mode Separation (Build vs Execute)

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001 (Usability) |
| **Personas**  | Developer, Tech Lead |

**Requirement**:
The system SHALL separate Build Mode (workflow editing) from Execute Mode (workflow running), so that each mode is optimized for its purpose.

**Rationale**:
Trying to show React Flow and chat simultaneously creates layout conflicts. Users don't need to see the workflow graph during execution - the steps list suffices.

**Success Criteria**:

- Workflows View for designing/editing workflows
- Task Detail View for executing workflows
- Clear separation - no React Flow in Task Detail View
- Steps list in Task Panel provides execution progress

---

### 3.10 Settings View (HL-SET-xxx)

#### HL-SET-001: Settings Layout

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-007             |
| **Personas**  | Developer, Tech Lead |

**Requirement**:
The system SHALL display Settings as a full page with split-pane layout: categories on left, settings on right.

**Layout**:
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│    │ ACCOUNT              │ General                                 │
│ 💬 │ ──────────────────── │ ─────────────────────────────────────── │
│    │ ● General            │                                         │
│ 📋 │ ○ API Keys           │ Theme: [Dark ▼]                         │
│    │ ○ Usage & Billing    │ Default Model: [Opus ▼]                 │
│ 🔀 │ ──────────────────── │ Auto-start Steps: [✓]                   │
│    │ WORKSPACE            │                                         │
│ ⚙️ │ ○ Projects           │ Notifications: [✓] Desktop              │
│━━━━│ ○ Agents             │                                         │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

**Success Criteria**:

- Full page (not a modal or slide-over)
- Categories grouped logically (Account, Workspace, Advanced)
- Selected category shows its settings
- Settings persist immediately or with explicit save

---

### 3.11 Theming (HL-THM-xxx)

#### HL-THM-001: Dark Theme Default

| Attribute     | Value                         |
| ------------- | ----------------------------- |
| **Priority**  | High                          |
| **Traces to** | BG-007 (Developer Experience) |
| **Personas**  | Developer                     |

**Requirement**:
The system SHALL use a dark theme as the default appearance.

**Success Criteria**:

- Dark backgrounds (#0D0D0D, #141414, #1A1A1A)
- Light text for readability
- Appropriate contrast ratios (WCAG AA)
- Orange accent color (#F97316)

---

#### HL-THM-002: Typography Hierarchy

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-007             |
| **Personas**  | Developer          |

**Requirement**:
The system SHALL use a clear typography hierarchy with consistent sizing, weights, and colors.

**Success Criteria**:

- Headings clearly distinguished from body text
- Primary text (white) vs secondary text (gray) distinction
- Monospace font for code, hashes, technical content
- Inter or SF Pro font family

---

## 4. Non-Functional Requirements

### 4.1 Usability (NFR-USE-xxx)

#### NFR-USE-001: Learnability

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |

**Requirement**:
New users SHALL be able to understand the basic layout and start a workflow within 5 minutes of first use.

| Metric                  | Target        | Condition               |
| ----------------------- | ------------- | ----------------------- |
| Time to first workflow  | < 5 minutes   | New user, no training   |
| Error rate on first use | < 10%         | Basic workflow creation |

---

#### NFR-USE-002: Keyboard Navigation

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |

**Requirement**:
Expert users SHALL be able to navigate between steps and tasks using keyboard shortcuts.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Keyboard navigability   | 100% of primary actions |

---

### 4.2 Consistency (NFR-CON-xxx)

#### NFR-CON-001: Layout Consistency

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-001             |

**Requirement**:
Panel positions and primary UI elements SHALL remain consistent across all states and modes.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Layout shifts           | 0 unexpected  |
| Chat position           | Always right side in split views |

---

#### NFR-CON-002: Interaction Consistency

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-001             |

**Requirement**:
Similar actions SHALL have similar interactions across the application.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Click behavior          | Consistent for all selectable items |
| Hover states            | Consistent visual feedback |

---

### 4.3 Performance (NFR-PERF-xxx)

#### NFR-PERF-001: Initial Load Time

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-007             |

**Requirement**:
The application SHALL load and become interactive within acceptable time.

| Metric                  | Target        | Condition               |
| ----------------------- | ------------- | ----------------------- |
| First Contentful Paint  | < 1.5s        | Fast 3G connection      |
| Time to Interactive     | < 3s          | Fast 3G connection      |

---

#### NFR-PERF-002: Interaction Responsiveness

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | Critical           |
| **Traces to** | BG-007             |

**Requirement**:
UI interactions SHALL respond immediately without perceptible lag.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Click response          | < 100ms visual feedback |
| Panel transitions       | < 300ms smooth animation |

---

### 4.4 Accessibility (NFR-ACC-xxx)

#### NFR-ACC-001: Color Contrast

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-007             |

**Requirement**:
All text SHALL meet WCAG AA contrast requirements.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Normal text contrast    | 4.5:1 minimum |
| Large text contrast     | 3:1 minimum   |

---

#### NFR-ACC-002: Focus Indicators

| Attribute     | Value              |
| ------------- | ------------------ |
| **Priority**  | High               |
| **Traces to** | BG-007             |

**Requirement**:
All interactive elements SHALL have visible focus indicators.

| Metric                  | Target        |
| ----------------------- | ------------- |
| Focus visibility        | 100% of interactive elements |

---

## 5. Requirements Traceability

### 5.1 Business Goal Coverage

| Business Goal | Description | High-Level Requirements |
| ------------- | ----------- | ----------------------- |
| BG-001        | Intuitive workflow execution | HL-LAY-*, HL-NAV-*, HL-TDT-*, HL-STP-*, HL-MSG-*, NFR-USE-*, NFR-CON-* |
| BG-002        | Multi-project support | HL-NAV-002 |
| BG-003        | Git integration | HL-CHG-*, HL-TDT-002 |
| BG-004        | Advanced workflow support | HL-STP-002/003/004, HL-WFL-* |
| BG-005        | Flexible execution | HL-STP-005 |
| BG-006        | Multi-provider AI | HL-MSG-003 |
| BG-007        | Developer experience | HL-THM-*, NFR-PERF-*, NFR-ACC-* |

### 5.2 Requirements Summary

| Area                      | Count | Critical | High | Medium | Low |
| ------------------------- | ----- | -------- | ---- | ------ | --- |
| Layout (HL-LAY)           | 3     | 2        | 1    | 0      | 0   |
| Navigation (HL-NAV)       | 3     | 1        | 1    | 1      | 0   |
| Chat View (HL-CHT)        | 3     | 2        | 1    | 0      | 0   |
| Tasks View (HL-TSK)       | 3     | 2        | 1    | 0      | 0   |
| Task Detail (HL-TDT)      | 3     | 3        | 0    | 0      | 0   |
| Steps (HL-STP)            | 5     | 1        | 3    | 1      | 0   |
| Chat Interface (HL-MSG)   | 5     | 3        | 2    | 0      | 0   |
| Changes (HL-CHG)          | 3     | 0        | 3    | 0      | 0   |
| Workflows (HL-WFL)        | 3     | 1        | 1    | 1      | 0   |
| Settings (HL-SET)         | 1     | 0        | 1    | 0      | 0   |
| Theming (HL-THM)          | 2     | 0        | 2    | 0      | 0   |
| **NFRs**                  | 6     | 2        | 4    | 0      | 0   |
| **Total**                 | 40    | 17       | 20   | 3      | 0   |

---

## 6. Open Questions

| Question ID | Question | Owner | Target Date | Resolution |
| ----------- | -------- | ----- | ----------- | ---------- |
| Q-001 | Should session list in Chat View show timestamps or message previews? | TBD | TBD | Pending |
| Q-002 | How should we handle very long step lists (20+ steps)? | TBD | TBD | Pending |
| Q-003 | Should there be a light theme option? | TBD | TBD | Pending |
| Q-004 | Should Settings be a full page or slide-over panel? | TBD | TBD | Resolved: Full page |

---

## 7. Glossary

| Term | Definition |
| ---- | ---------- |
| Task | A workflow execution instance, tied to a git branch |
| Step | A single phase in a workflow (e.g., Requirements, Planning) |
| Agent | AI assistant that executes steps (e.g., Claude Code) |
| Build Mode | Visual workflow editor using React Flow |
| Execute Mode | Workflow execution view with chat interface |
| Session | A chat conversation context (in Chat View) |
| Main Content | The rightmost panel showing chat or other primary content |
| Task Panel | Panel showing task info, steps, changes, commits |
| Icon Rail | Minimal left-edge navigation bar with icons |

---

## Appendix A: Visual References

### A.1 Icon Rail Navigation

```
┌────┐
│ FM │  ← Logo (click → Project switcher modal)
│────│
│ 💬 │  ← Chat View (codebase chat with sessions)
│ 📋 │  ← Tasks View (Kanban/List → Task Detail)
│ 🔀 │  ← Workflows View (browse/edit workflows)
│    │
│    │
│ ⚙️ │  ← Settings View
└────┘
```

### A.2 Chat View Layout

```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│ FM │ FloMaster    Chat                                          [⚙️] │
├────┼──────────────────────┼─────────────────────────────────────────┤
│ 💬 │ Sessions             │                                         │
│━━━━│ ──────────────────── │  How does authentication work?          │
│ 📋 │ ● Current session    │                                    [user]│
│ 🔀 │ ○ Auth exploration   │                                         │
│    │ ○ API design help    │  Based on my analysis...           [agent]│
│    │                      │                                         │
│    │ + New session        │  ▼ 3 tools                              │
│ ⚙️ │                      │  [Input bar]                            │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

### A.3 Tasks View - Kanban

```
┌────┬────────────────────────────────────────────────────────────────────┐
│ FM │ Tasks    [+ New Task]    [Kanban ▼]                           [⚙️] │
├────┼────────────────────────────────────────────────────────────────────┤
│ 💬 │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ 📋 │  │ Backlog  │  │ To Do    │  │ Progress │  │ Done     │           │
│━━━━│  │──────────│  │──────────│  │──────────│  │──────────│           │
│ 🔀 │  │ [Card]   │  │ [Card]   │  │ [Card]   │  │ [Card]   │           │
│    │  │ [Card]   │  │ [Card]   │  │ [Card]   │  │          │           │
│ ⚙️ │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────┴────────────────────────────────────────────────────────────────────┘
```

### A.4 Task Detail View

```
┌────┬──────────────────────────────────────────────────────────────────────┐
│ FM │ ← Tasks    Auth Feature ▼    ⎇ feature/auth-be7d               [⚙️] │
├────┼────────────────────────────────┬─────────────────────────────────────┤
│ 💬 │  [In Progress ▼] [Merge]       │  Technical Specification            │
│ 📋 │  ────────────────────────      │  Status: ● In Progress              │
│━━━━│  STEPS                         │  ─────────────────────────────────  │
│ 🔀 │  ✓ Requirements                │                                     │
│    │  ● Tech Spec    ← selected     │  Agent: I'll analyze...             │
│    │  ○ Planning                    │                                     │
│    │  ○ Implementation              │  ▼ 2 tools                          │
│    │  + Add step                    │                                     │
│    │  ────────────────────────      │  Based on my analysis...            │
│ ⚙️ │  CHANGES (3)                ▼  │  ─────────────────────────────────  │
│    │  COMMITS (2)                ▼  │  [Input bar]                        │
└────┴────────────────────────────────┴─────────────────────────────────────┘
```

### A.5 Workflows View - Edit Mode

```
┌────┬────────────────────────────────────────────────────────────────────┐
│ FM │ ← Workflows    Full SDD Workflow    [Save] [Test Run ▶]       [⚙️] │
├────┼────────────────────────────────────────────────────────────────────┤
│ 💬 │                                                                    │
│ 📋 │                    REACT FLOW CANVAS                               │
│ 🔀 │        [Requirements] ──────→ [Tech Spec]                          │
│━━━━│               │                     │                              │
│    │               ▼                     ▼                              │
│    │        [Planning] ──────────→ [Implementation]                     │
│ ⚙️ │  [+ Add Step]  [+ Add Condition]  [+ Add Loop]                     │
└────┴────────────────────────────────────────────────────────────────────┘
```

### A.6 Settings View

```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│ FM │ Settings                                                        │
├────┼──────────────────────┼─────────────────────────────────────────┤
│ 💬 │ ACCOUNT              │ General                                 │
│ 📋 │ ──────────────────── │ ─────────────────────────────────────── │
│ 🔀 │ ● General            │ Theme: [Dark ▼]                         │
│    │ ○ API Keys           │ Default Model: [Opus ▼]                 │
│ ⚙️ │ ○ Usage & Billing    │ Auto-start Steps: [✓]                   │
│━━━━│ ──────────────────── │ Notifications: [✓] Desktop              │
│    │ WORKSPACE            │                                         │
│    │ ○ Projects           │                                         │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

---

## Document History

| Version | Date       | Author        | Changes                                   |
| ------- | ---------- | ------------- | ----------------------------------------- |
| 1.0     | 2025-12-30 | Fahad Kaleem  | Initial version                           |
| 2.0     | 2025-12-30 | Fahad Kaleem  | Major revision: Added Chat View with sessions, restructured navigation with icon rail, separated views clearly, updated all visual references |
