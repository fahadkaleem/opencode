# FloMaster UI - Component Gap Analysis

> **Document Version**: 1.0
> **Last Updated**: 2025-12-31
> **Status**: Active
> **Owner**: Fahad Kaleem
> **Related**: [High-Level Requirements](./01-high-level-requirements.md)

---

## 1. Executive Summary

This document analyzes the current UI implementation against the high-level requirements, identifying gaps and providing a prioritized build plan for rapid iteration.

**Current State:**
- 20+ shared UI primitives (complete)
- Chat feature (95% complete)
- Navigation sidebar (needs redesign to icon rail)
- Tasks, Workflows, Settings (stubs only)

**Estimated Build Effort:**
- Phase 1-5: ~8 days for core components
- Quick wins: Several components buildable in <1 hour each

---

## 2. Current Implementation Status

### 2.1 Shared UI Primitives (components/ui/)

| Component | Status | Has Story | Has Tests |
|-----------|--------|-----------|-----------|
| Button | ✅ Complete | ✅ | ✅ |
| Dialog | ✅ Complete | ✅ | ✅ |
| Popover | ✅ Complete | ✅ | ✅ |
| Tooltip | ✅ Complete | ✅ | ✅ |
| Collapsible | ✅ Complete | ✅ | ✅ |
| ScrollArea | ✅ Complete | ✅ | ✅ |
| Badge | ✅ Complete | ✅ | ✅ |
| StatusBadge | ✅ Complete | ✅ | ✅ |
| Avatar | ✅ Complete | ✅ | ✅ |
| Link | ✅ Complete | ✅ | ✅ |
| Textarea | ✅ Complete | ✅ | ✅ |
| Spinner | ✅ Complete | ✅ | ✅ |
| TextShimmer | ✅ Complete | ✅ | ✅ |
| AnimatedSizeContainer | ✅ Complete | ✅ | ✅ |
| RichTextEditor | ✅ Complete | ✅ | ✅ |
| ClientOnly | ✅ Complete | - | ✅ |
| PageContent | ✅ Complete | ✅ | ✅ |
| PageContentHeader | ✅ Complete | ✅ | ✅ |
| PageWidthWrapper | ✅ Complete | ✅ | ✅ |
| MainLayout | ✅ Complete | ✅ | ✅ |
| Icons (16+) | ✅ Complete | ✅ | - |

**Summary:** All core primitives are production-ready with stories and tests.

---

### 2.2 Chat Feature (features/chat/)

| Component | Status | Purpose |
|-----------|--------|---------|
| ChatContainer | ✅ Complete | Wrapper layout for chat UI |
| MessageList | ✅ Complete | Message rendering with auto-scroll & keyboard nav |
| MessageInput | ✅ Complete | Rich text input with file upload, mode selectors |
| UserMessage | ✅ Complete | User message bubble with edit/fork |
| AssistantMessage | ✅ Complete | AI response with markdown, streaming |
| ToolCallCard | ✅ Complete | Tool execution display (collapsible) |
| MarkdownRenderer | ✅ Complete | Converts markdown to React |
| CodeBlock | ✅ Complete | Syntax-highlighted code |
| ThinkingIndicator | ✅ Complete | "Thinking..." animation |
| ModelSelector | ✅ Complete | Model dropdown with thinking toggle |
| AgentModeSelector | ✅ Complete | Agent mode selector (4 modes) |
| ImagePreviewDialog | ✅ Complete | Image preview modal |
| VoiceRecorder | ✅ Complete | Voice input with timer |

| Hook | Status | Purpose |
|------|--------|---------|
| useAutoScroll | ✅ Complete | Auto-scroll + jump button |
| useMessageKeyboardNav | ✅ Complete | Arrow key navigation |
| useCopyToClipboard | ✅ Complete | Copy utility |
| useCodeHighlighting | ✅ Complete | Syntax highlighting |
| useRecordingTimer | ✅ Complete | Voice recording timer |

| Store | Status | Purpose |
|-------|--------|---------|
| chatSessionsStore | ✅ Complete | Multi-session management (persisted) |
| chatStore | ✅ Complete | Single-session state |
| messageNavigationStore | ✅ Complete | Selection & keyboard nav state |

**Summary:** Chat is fully functional. Can be reused for Step Chat in Task Detail View.

---

### 2.3 Navigation Feature (features/navigation/)

| Component | Status | Notes |
|-----------|--------|-------|
| Sidebar | ⚠️ Needs Redesign | Current: collapsible sidebar. Required: icon rail (40-48px) |
| IconNavigation | ✅ Exists | Can be adapted for icon rail |
| DetailSidebar | ⚠️ May Not Be Needed | Requirements show simpler icon-only rail |

**Gap:** Current navigation uses a collapsible two-panel sidebar. Requirements specify a minimal 40-48px icon rail that's always visible.

---

### 2.4 Pages/Routes (app/routes/)

| Page | Status | Required |
|------|--------|----------|
| Dashboard | ❌ Stub | Not in requirements (remove?) |
| Chat | ✅ Complete | HL-CHT-001 through HL-CHT-003 |
| Tasks | ❌ Stub | HL-TSK-001 through HL-TSK-003 |
| Task Detail | ❌ Not Built | HL-TDT-001 through HL-TDT-003 |
| Workflows | ❌ Stub | HL-WFL-001 through HL-WFL-003 |
| Settings | ❌ Stub | HL-SET-001 |

---

## 3. Gap Analysis by Requirement Area

### 3.1 Layout (HL-LAY-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-LAY-001 Icon Rail Navigation | ❌ Missing | Need 40-48px icon rail component |
| HL-LAY-002 View-Specific Layouts | ⚠️ Partial | MainLayout exists, need view-specific variants |
| HL-LAY-003 Consistent Header Bar | ⚠️ Partial | PageContentHeader exists, needs refinement |

**Components Needed:**
- `IconRail` - Minimal vertical icon navigation
- `ViewContainer` - Generic view wrapper with header
- `SplitPane` - Reusable left/right split layout

---

### 3.2 Navigation (HL-NAV-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-NAV-001 Icon Rail Structure | ❌ Missing | 5 icons: Logo, Chat, Tasks, Workflows, Settings |
| HL-NAV-002 Project Switching | ❌ Missing | Modal for project selection |
| HL-NAV-003 View State Persistence | ❌ Missing | Remember scroll, selection per view |

**Components Needed:**
- `IconRail` - With logo, 4 nav icons, settings at bottom
- `ProjectSwitcherModal` - Project selection dialog
- View state hooks (can be added to existing stores)

---

### 3.3 Chat View (HL-CHT-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-CHT-001 Split Pane Layout | ⚠️ Partial | Sessions list exists in store, needs sidebar UI |
| HL-CHT-002 Session Management | ✅ Complete | chatSessionsStore handles this |
| HL-CHT-003 Codebase Chat | ⚠️ Partial | UI complete, needs backend integration |

**Components Needed:**
- `SessionsList` - Left panel showing chat sessions
- `SessionItem` - Individual session with title, timestamp

---

### 3.4 Tasks View (HL-TSK-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-TSK-001 Kanban Board View | ❌ Missing | Full kanban with drag-drop |
| HL-TSK-002 List View | ❌ Missing | Table/list alternative |
| HL-TSK-003 Task Creation | ❌ Missing | Creation modal/form |

**Components Needed:**
- `TaskCard` - Card showing task name, status, progress
- `KanbanColumn` - Column with header, card list, drop zone
- `KanbanBoard` - Full board with 4 columns
- `TaskListView` - Table with sortable columns
- `TaskRow` - Single row in list view
- `TaskCreationModal` - Form for new task
- `ViewToggle` - Switch between Kanban/List

---

### 3.5 Task Detail View (HL-TDT-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-TDT-001 Split Pane Layout | ❌ Missing | Task Panel left, Step Chat right |
| HL-TDT-002 Task Header | ❌ Missing | Back button, task name, branch |
| HL-TDT-003 Task Panel Content | ❌ Missing | Status, steps, changes, commits |

**Components Needed:**
- `TaskDetailView` - Full split-pane layout
- `TaskHeader` - Header with back, task dropdown, branch
- `TaskPanel` - Left panel with steps, changes, commits
- `StatusDropdown` - Task status control
- `MergeButton` - Merge action button

---

### 3.6 Step Management (HL-STP-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-STP-001 Steps List Display | ❌ Missing | Vertical list with status icons |
| HL-STP-002 Conditional Step Display | ❌ Missing | Indented branches with condition |
| HL-STP-003 Loop Step Display | ❌ Missing | Iteration progress (2/5) |
| HL-STP-004 Parallel Step Display | ❌ Missing | Grouped concurrent steps |
| HL-STP-005 Add Step Capability | ❌ Missing | "+ Add step" button |

**Components Needed:**
- `StepItem` - Single step with status icon (○ ● ✓ ✗)
- `StepsList` - Vertical scrollable list
- `ConditionalStepItem` - Diamond icon, indented children
- `LoopStepItem` - Loop icon, progress counter
- `ParallelStepGroup` - Grouped parallel steps
- `AddStepButton` - "+ Add step" action

---

### 3.7 Chat Interface (HL-MSG-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-MSG-001 Step Chat Display | ✅ Complete | MessageList handles this |
| HL-MSG-002 Tool Call Display | ✅ Complete | ToolCallCard handles this |
| HL-MSG-003 Chat Input Bar | ✅ Complete | MessageInput handles this |
| HL-MSG-004 Action Required Indicator | ❌ Missing | Prominent banner when waiting |
| HL-MSG-005 Step Navigation | ❌ Missing | ← → arrows to navigate steps |

**Components Needed:**
- `ActionRequiredBanner` - Orange warning banner
- `StepNavigation` - Prev/next arrows in chat header

---

### 3.8 Changes & Commits (HL-CHG-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-CHG-001 Changes Section | ❌ Missing | File list with diff stats |
| HL-CHG-002 Commits Section | ❌ Missing | Commit list |
| HL-CHG-003 Diff Viewer | ❌ Missing | Side-by-side or unified diff |

**Components Needed:**
- `ChangesSection` - Collapsible section with file list
- `FileChangeItem` - File icon, path, +/- counts
- `CommitsSection` - Collapsible section with commits
- `CommitItem` - Hash, message, timestamp
- `DiffViewer` - Full diff display (can use library)

---

### 3.9 Workflows View (HL-WFL-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-WFL-001 Workflows List | ❌ Missing | Split pane with list + preview |
| HL-WFL-002 Workflow Graph Editor | ❌ Missing | React Flow integration |
| HL-WFL-003 Mode Separation | ❌ Missing | Build vs Execute distinction |

**Components Needed:**
- `WorkflowsList` - Left panel with workflow items
- `WorkflowCard` - Workflow with name, description
- `WorkflowPreview` - Right panel preview
- `WorkflowEditor` - React Flow canvas (Phase 2)

---

### 3.10 Settings View (HL-SET-xxx)

| Requirement | Status | Gap |
|-------------|--------|-----|
| HL-SET-001 Settings Layout | ❌ Missing | Split pane: categories + settings |

**Components Needed:**
- `SettingsPage` - Full settings layout
- `SettingsCategory` - Category nav item
- `SettingsCategoryList` - Left nav panel
- `SettingsContent` - Right content panel
- Individual settings controls (forms, toggles)

---

## 4. Prioritized Build Plan

### 4.1 Phase 1: Layout Foundation (Day 1)

| Component | Effort | Priority | Reusability |
|-----------|--------|----------|-------------|
| `IconRail` | 2h | Critical | All views |
| `SplitPane` | 2h | Critical | 4+ views |
| `ViewContainer` | 1h | Critical | All views |

**Deliverables:**
- New icon rail navigation replaces current sidebar
- Reusable split pane for all views
- Consistent view wrapper

---

### 4.2 Phase 2: Tasks Feature (Days 2-3)

| Component | Effort | Priority | Notes |
|-----------|--------|----------|-------|
| `TaskCard` | 2h | Critical | Core building block |
| `KanbanColumn` | 2h | Critical | With drop zone |
| `KanbanBoard` | 3h | Critical | 4 columns |
| `TaskListView` | 2h | High | Table alternative |
| `TaskRow` | 1h | High | List item |
| `TaskCreationModal` | 3h | Critical | Form + validation |
| `ViewToggle` | 1h | High | Kanban/List switch |

**Deliverables:**
- Full Kanban board view
- Alternative list view
- Task creation flow

---

### 4.3 Phase 3: Task Detail Feature (Days 4-5)

| Component | Effort | Priority | Notes |
|-----------|--------|----------|-------|
| `StepItem` | 1h | Critical | Status + label |
| `StepsList` | 2h | Critical | Vertical list |
| `ConditionalStepItem` | 2h | High | Indented branches |
| `LoopStepItem` | 2h | High | Progress counter |
| `TaskPanel` | 3h | Critical | Steps + changes + commits |
| `TaskHeader` | 2h | Critical | Back + name + branch |
| `TaskDetailView` | 2h | Critical | Full layout |
| `StatusDropdown` | 1h | Critical | Status control |
| `ActionRequiredBanner` | 1h | Critical | Warning banner |
| `StepNavigation` | 1h | High | Prev/next arrows |

**Deliverables:**
- Complete Task Detail View
- Step management with all step types
- Integrated chat (reuse existing)

---

### 4.4 Phase 4: Git Integration (Day 6)

| Component | Effort | Priority | Notes |
|-----------|--------|----------|-------|
| `FileChangeItem` | 1h | High | File with diff stats |
| `ChangesSection` | 2h | High | Collapsible list |
| `CommitItem` | 1h | High | Hash + message |
| `CommitsSection` | 2h | High | Collapsible list |
| `DiffViewer` | 4h | High | Use react-diff-viewer |

**Deliverables:**
- Changes display in Task Panel
- Commits display in Task Panel
- Full diff viewing capability

---

### 4.5 Phase 5: Workflows & Settings (Days 7-8)

| Component | Effort | Priority | Notes |
|-----------|--------|----------|-------|
| `WorkflowCard` | 1h | High | Preview card |
| `WorkflowsList` | 2h | High | Browse workflows |
| `WorkflowPreview` | 2h | High | Right panel |
| `SettingsCategory` | 1h | High | Nav item |
| `SettingsCategoryList` | 2h | High | Left nav |
| `SettingsContent` | 2h | High | Right content |
| `SettingsPage` | 2h | High | Full layout |

**Deliverables:**
- Workflows browse view
- Settings page structure

---

## 5. Quick Wins (< 1 hour each)

These components can be built quickly in isolation:

| Component | Effort | Why Quick |
|-----------|--------|-----------|
| `IconRail` | 30 min | Just 5 icons + tooltips |
| `TaskCard` | 45 min | Badge + text + progress |
| `StepItem` | 30 min | Icon + label |
| `CommitItem` | 20 min | Hash + message + time |
| `FileChangeItem` | 20 min | Icon + path + stats |
| `ActionRequiredBanner` | 15 min | Alert with icon |
| `StatusDropdown` | 30 min | Popover + options |
| `ViewToggle` | 20 min | 2 buttons |
| `StepNavigation` | 20 min | 2 arrow buttons |
| `AddStepButton` | 10 min | "+ Add step" |

---

## 6. Component Reuse Matrix

Existing components that can be reused:

| Existing Component | Use In |
|-------------------|--------|
| `Badge` | TaskCard status, StepItem status |
| `StatusBadge` | TaskCard, step indicators |
| `Collapsible` | ChangesSection, CommitsSection |
| `Dialog` | TaskCreationModal, ProjectSwitcher |
| `Button` | All actions |
| `ScrollArea` | TaskPanel, StepsList, lists |
| `Tooltip` | IconRail hover states |
| `MessageList` | Step Chat (existing!) |
| `MessageInput` | Step Chat input (existing!) |
| `ToolCallCard` | Step Chat tool display |
| `Popover` | StatusDropdown, selectors |
| `Avatar` | Commit author |

---

## 7. New Stores Needed

| Store | Purpose | Priority |
|-------|---------|----------|
| `tasksStore` | Task list, filters, selected task | Critical |
| `taskDetailStore` | Current task, selected step | Critical |
| `workflowsStore` | Workflow list, selected workflow | High |
| `settingsStore` | User preferences | High |

---

## 8. Types to Define

### Task Types
```typescript
interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  workflowId: string;
  branchName: string;
  steps: Step[];
  changes: FileChange[];
  commits: Commit[];
  createdAt: Date;
  updatedAt: Date;
}

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
```

### Step Types
```typescript
interface Step {
  id: string;
  name: string;
  status: StepStatus;
  type: StepType;
  children?: Step[]; // For conditional/loop/parallel
  progress?: { current: number; total: number }; // For loops
  condition?: string; // For conditionals
}

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'action_required';
type StepType = 'standard' | 'conditional' | 'loop' | 'parallel';
```

### Git Types
```typescript
interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted';
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
}
```

---

## 9. Recommended Starting Point

**Start with:** `IconRail` → `TaskCard` → `KanbanBoard` → `TaskDetailView`

**Rationale:**
1. IconRail changes the app's visual identity immediately
2. TaskCard is the most reused component
3. KanbanBoard is the primary entry point for users
4. TaskDetailView is where users spend most time

---

## 10. Open Questions

| Question | Impact | Decision Needed By |
|----------|--------|-------------------|
| Should Dashboard be removed from nav? | Navigation design | Phase 1 |
| Drag-drop library for Kanban? | KanbanBoard implementation | Phase 2 |
| Diff viewer library choice? | DiffViewer implementation | Phase 4 |
| Should parallel steps be Phase 1? | StepsList scope | Phase 3 |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-31 | Fahad Kaleem | Initial gap analysis |
