# Roadmap: FloMaster TUI Integration

## Overview

Integrate FloMaster workflow orchestration into the OpenCode TUI, enabling developers to launch, monitor, and control multi-step AI workflows without leaving the terminal interface. This bridges the existing CLI-based workflow engine with the interactive TUI, establishing patterns for the eventual Electron desktop app.

## Domain Expertise

None - this is internal FloMaster/OpenCode development using established TUI patterns (SolidJS + opentui) and workflow engine architecture (XState v5).

## Implementation Reference

**Primary specification:** `.alfred/tasks/TASK-13/task.md`
**Detailed plan:** `.alfred/tasks/TASK-13/plan.md`

This roadmap tracks progress against the TASK-13 8-phase implementation plan.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Workflow Events & Bus Integration** - Define events, publish from WorkflowEngine
- [x] **Phase 2: Server Endpoints for Workflow Data** - HTTP routes for definitions and executions
- [x] **Phase 3: TUI State Synchronization** - Add workflow state to sync store
- [x] **Phase 4: Workflow Selector Dialog** - Two-step dialog: select workflow, enter prompt
- [x] **Phase 5: Slash Command Integration** - `/workflow` and `/wcontinue` commands
- [x] **Phase 6: Sidebar Workflow Panel** - Collapsible panel showing execution progress
- [x] **Phase 7: Auto-Switch on Step Completion** - Navigate to next step session automatically
- [x] **Phase 8: Continue Command** - `/wcontinue` to resume paused steps
- [ ] **Phase 9: Integration Testing** - E2E verification of all features

## Phase Details

### Phase 1: Workflow Events & Bus Integration
**Goal**: Define workflow events and integrate with OpenCode's Bus system
**Status**: Complete
**Depends on**: Nothing (first phase)

**Implemented:**
- `packages/opencode/src/flomaster/orchestrator/events.ts` - Event definitions
- `WorkflowBusEvents.ExecutionUpdated`, `StepStarted`, `StepCompleted`, `StepSessionCreated`
- Events published during workflow execution

### Phase 2: Server Endpoints for Workflow Data
**Goal**: Add HTTP endpoints for workflow definitions and execution management
**Status**: Complete
**Depends on**: Phase 1

**Implemented:**
- `packages/opencode/src/server/workflow.ts` - Server routes
- `GET /workflow/definitions` - List available workflows
- `GET /workflow/executions` - List executions
- `POST /workflow/run` - Start workflow from TUI

### Phase 3: TUI State Synchronization
**Goal**: Add workflow state to TUI sync store for reactive updates
**Status**: Complete
**Depends on**: Phase 1, Phase 2

**Implemented:**
- `workflow_definitions` and `workflow_executions` in sync store
- Event handlers for `workflow.execution.updated`
- Bootstrap fetch for initial state

### Phase 4: Workflow Selector Dialog
**Goal**: Create dialog for selecting workflows and entering prompts
**Status**: Complete
**Depends on**: Phase 3

**Implemented:**
- `packages/opencode/src/cli/cmd/tui/component/dialog-workflow.tsx`
- `DialogWorkflowSelect` - Workflow selection
- `DialogWorkflowPrompt` - Prompt input

### Phase 5: Slash Command Integration
**Goal**: Add `/workflow` and `/wcontinue` slash commands
**Status**: Complete
**Depends on**: Phase 4

**Implemented:**
- `/workflow` command triggers `workflow.run`
- `/wcontinue` command triggers `workflow.continue`
- Command handlers registered in `app.tsx`

### Phase 6: Sidebar Workflow Panel
**Goal**: Show active workflow executions with step progress
**Status**: Complete
**Depends on**: Phase 3

**Implemented:**
- Collapsible "Workflows" panel in `sidebar.tsx`
- Step status indicators (✓ completed, ● running, ○ pending, ✗ failed)
- Click step to navigate to its session
- Workflow step info for subagent sessions

### Phase 7: Auto-Switch on Step Completion
**Goal**: Automatically navigate to next step session when current completes
**Status**: Complete
**Depends on**: Phase 6

**Implemented:**
- Event listener for `workflow.step.completed` in `app.tsx`
- Auto-navigation to `nextSessionId` when provided

### Phase 8: Continue Command
**Goal**: Resume paused workflow steps with `/wcontinue`
**Status**: Complete
**Depends on**: Phase 5

**Implemented:**
- Command handler injects continue prompt to current session
- Detects workflow context from parent session

### Phase 9: Integration Testing
**Goal**: E2E verification of complete TUI workflow integration
**Status**: Not started
**Depends on**: Phases 1-8

**Verification checklist:**
- [ ] `/workflow` command opens workflow selector
- [ ] User can select workflow and provide prompt
- [ ] Workflow executes with sidebar progress updates
- [ ] TUI auto-navigates between step sessions
- [ ] `/wcontinue` resumes interrupted steps
- [ ] Works with CLI-started workflows (event sync)
- [ ] Multiple concurrent workflows display correctly

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Status | Completed |
|-------|--------|-----------|
| 1. Workflow Events & Bus Integration | Complete | 2026-01-08 |
| 2. Server Endpoints for Workflow Data | Complete | 2026-01-08 |
| 3. TUI State Synchronization | Complete | 2026-01-08 |
| 4. Workflow Selector Dialog | Complete | 2026-01-08 |
| 5. Slash Command Integration | Complete | 2026-01-08 |
| 6. Sidebar Workflow Panel | Complete | 2026-01-08 |
| 7. Auto-Switch on Step Completion | Complete | 2026-01-08 |
| 8. Continue Command | Complete | 2026-01-08 |
| 9. Integration Testing | Not started | - |

## File Summary

### New Files (TASK-13)

| File | Purpose |
|------|---------|
| `src/flomaster/orchestrator/events.ts` | Workflow event definitions |
| `src/server/workflow.ts` | HTTP routes for workflows |
| `src/cli/cmd/tui/component/dialog-workflow.tsx` | Workflow selector dialog |

### Modified Files (TASK-13)

| File | Changes |
|------|---------|
| `src/cli/cmd/tui/context/sync.tsx` | Added workflow state |
| `src/cli/cmd/tui/routes/session/sidebar.tsx` | Added Workflows panel |
| `src/cli/cmd/tui/component/prompt/autocomplete.tsx` | Added slash commands |
| `src/cli/cmd/tui/app.tsx` | Command handlers, auto-navigation |
