# FloMaster: Project Status Report

## Executive Summary

FloMaster is a workflow orchestration system for AI agents that solves context overflow by giving each workflow step a fresh agent session. In this session, we completed **TASK-08** (Default Step Agents + SDLC Workflow) and **TASK-09 Phases 1 & 2** (Self-Contained FloMaster Module + State Management). The system now has 4 pre-built agents, a real multi-step SDLC workflow, and full state persistence for workflow executions.

---

## Background

### What is FloMaster?

FloMaster is a **workflow orchestration system** that coordinates multi-step AI tasks using a DAG (Directed Acyclic Graph) execution model. It solves the "context rot" problem where single AI sessions degrade in quality as context windows fill up.

**Key Innovation**: Each workflow step creates a **fresh agent session** with:
- Clean context (no accumulated history)
- Only relevant inputs from upstream steps
- Step-specific system prompt and permissions
- Isolated conversation for independent review

### Context

- **Base Repository**: `flomaster-opencode` - A fork of OpenCode
- **Reference Repository**: `flomaster-prototype` - Contains battle-tested StateManager implementation
- **Target Launch**: End of 2026 (greenfield project, no backward compatibility needed)

### Goal

The goal of this session was to:

1. **Create default step agents** (TASK-08) - Pre-built agents optimized for common workflow patterns (research, plan, implement, review) that users can use out-of-the-box
2. **Create a real multi-step workflow** (SDLC workflow) - Demonstrate FloMaster's value by chaining agents together with context passing
3. **Restructure code for maintainability** (TASK-09 Phase 1) - Move all FloMaster-specific code into a self-contained `src/flomaster/` folder for clean upstream merges
4. **Add state persistence** (TASK-09 Phase 2) - Port the StateManager from the prototype to enable workflow state inspection, crash recovery, and resumption

---

## Architecture and Key Decisions

### Self-Contained FloMaster Module

All FloMaster-specific code lives in `packages/opencode/src/flomaster/`. This separation:
- Enables clean upstream merges from OpenCode main branch
- Creates clear boundaries between OpenCode core and FloMaster additions
- Makes the codebase more navigable

**Structure:**
```
packages/opencode/src/flomaster/
├── orchestrator/          # Workflow execution engine
├── state/                 # State persistence (StateManager)
├── cli/                   # Workflow CLI commands
└── index.ts               # Public exports
```

**OpenCode touchpoint**: Only one import in `src/index.ts` to register the workflow command.

### State Storage Location

Workflow execution state is stored at the **project root** in `.flomaster/executions/{executionId}/`:

```
{project_root}/.flomaster/
└── executions/
    └── exec-1767558478550-moe7ygu/
        ├── state.json        # Execution status, step statuses
        ├── context.json      # Step outputs (for context passing)
        ├── mapping.json      # Step-to-session mappings
        └── checkpoint.json   # Full checkpoint for crash recovery
```

**Why project root?** Workflow executions are project-specific. Using `Instance.worktree` (git root) ensures state is stored with the project, not inside the package directory.

**Why `.flomaster/` not `.opencode/`?** The `.opencode/` folder is for project configuration (agents, commands, themes). OpenCode stores runtime data (sessions) in XDG directories (`~/.local/share/opencode/`). `.flomaster/` is for FloMaster runtime state.

### Future: Task-Centric Storage Model

**Current model**: Executions stored in `.flomaster/executions/{id}/` (separate from tasks)

**Desired future model**: Everything tied to a task:
```
.alfred/tasks/TASK-XX/
├── task.md
├── plan.md
├── research.md
├── executions/                # All workflow runs for THIS task
│   └── {executionId}/
└── outputs/
```

**Why not now**: Current implementation works and is simpler. Ad-hoc workflow runs (without a task) need a fallback location. Documented in CONTEXT.md for future implementation.

### Agent Location

Pre-built agents are stored at the **project root** in `/.opencode/agent/`:

```
/.opencode/agent/
├── research-agent.md
├── plan-agent.md
├── implement-agent.md
└── review-agent.md
```

OpenCode searches for agents in `.opencode/` directories walking up from the working directory, so root placement ensures they're found regardless of where commands run from.

---

## Task Breakdown

### TASK-08: Default Step Agents

**Status:** ✅ COMPLETE

**What it does:**
Creates 4 pre-built agent definitions and a real multi-step SDLC workflow that chains them together with context passing between steps.

**Key changes:**

1. **Created 4 agent files** in `/.opencode/agent/`:
   - `research-agent.md` - Read-only exploration (grep, glob, read, list, webfetch, websearch)
   - `plan-agent.md` - Planning with limited write (read + write to `.opencode/plan/` and `.alfred/`)
   - `implement-agent.md` - Full access (read, edit, write, bash)
   - `review-agent.md` - Code review (read + git diff/log/show commands only)

2. **Created SDLC workflow** at `packages/opencode/src/flomaster/orchestrator/workflows/sdlc-workflow.ts`:
   ```
   Input → Research → Plan → Implement → Review
            ↓           ↓         ↓          ↓
       research-agent  plan-agent  implement  review-agent
   ```

3. **Registered workflow** in CLI (`--workflow sdlc` option)

**Task file:** `.alfred/tasks/TASK-08/task.md`

---

### TASK-09: Self-Contained FloMaster Module + State Management

**Status:** ✅ PHASES 1 & 2 COMPLETE, 📋 PHASE 3 PENDING

**What it does:**
Restructures all FloMaster code into a self-contained folder and adds workflow state persistence for crash recovery and execution inspection.

#### Phase 1: Restructure to `src/flomaster/` ✅

**Key changes:**
- Moved `src/orchestrator/` → `src/flomaster/orchestrator/`
- Moved `src/cli/cmd/workflow.ts` → `src/flomaster/cli/workflow.ts`
- Created `src/flomaster/index.ts` with public exports
- Updated import in `src/index.ts` to use new location

#### Phase 2: StateManager Integration ✅

**Key changes:**
- Ported StateManager from `flomaster-prototype/packages/core/src/state/`
- Located at `src/flomaster/state/stateManager.ts` (~24KB)
- Integrated with workflow engine via `createWorkflowEngine({ enableStateManager: true })`
- Uses `Instance.worktree` for project root detection
- Auto-checkpoints after each step completion

**Files created:**
```
src/flomaster/state/
├── stateManager.ts      # Main implementation
├── types.ts             # Type definitions
├── defaults.ts          # Constants (FLOMASTER_DIR, etc.)
├── index.ts             # Public exports
└── internal/
    ├── fileUtils.ts     # File operations
    ├── lockManager.ts   # Concurrent access locking
    └── index.ts
```

#### Phase 3: CLI Commands 📋 PENDING

Remaining work:
- `workflow list` - List executions
- `workflow inspect <id>` - View execution details
- `workflow resume <id>` - Resume from checkpoint

**Task file:** `.alfred/tasks/TASK-09/task.md`

---

## Current State

### What's Working

1. **TypeScript compilation** - `bun turbo typecheck` passes
2. **All workflows execute correctly**:
   - `bun dev workflow run --workflow test --dry-run` ✅
   - `bun dev workflow run --workflow sdlc --dry-run` ✅ (all 4 agents)
   - `bun dev workflow run --workflow research --dry-run` ✅
3. **State persistence** - Execution state files created at project root
4. **Context passing** - `{{stepId.response}}` interpolation between steps
5. **Session hierarchy** - Workflow sessions with child step sessions
6. **Agent loading** - Custom agents from `/.opencode/agent/` properly loaded

### What's Not Working / Known Issues

1. **CLI commands not implemented** - Cannot list, inspect, or resume workflows from CLI yet (Phase 3)
2. **State not task-centric** - Executions stored separately from tasks (future improvement documented)

### Verification Status

| Check | Status | Command/Method |
|-------|--------|----------------|
| TypeScript compilation | ✅ | `bun turbo typecheck` |
| Test workflow (dry-run) | ✅ | `bun dev workflow run --workflow test --dry-run "Hello"` |
| SDLC workflow (dry-run) | ✅ | `bun dev workflow run --workflow sdlc --dry-run "Test"` |
| Research workflow (dry-run) | ✅ | `bun dev workflow run --workflow research --dry-run "Find"` |
| Real workflow execution | ✅ | `bun dev workflow run --workflow test "Hello"` |
| State files created | ✅ | `ls .flomaster/executions/` |
| state.json structure | ✅ | Contains status, stepStatuses |
| context.json structure | ✅ | Contains step outputs with response |
| mapping.json structure | ✅ | Maps steps to session IDs |
| checkpoint.json exists | ✅ | Full checkpoint for recovery |
| No broken imports | ✅ | `grep -r "from.*orchestrator" src --include="*.ts" \| grep -v flomaster` |
| State at project root | ✅ | `.flomaster/` at git root, not in `packages/opencode/` |

---

## File Structure

### FloMaster Module

```
packages/opencode/src/flomaster/
├── cli/
│   └── workflow.ts              # CLI command implementation
├── orchestrator/
│   ├── actors/                  # XState actors for step types
│   ├── engine/
│   │   ├── factory.ts           # Creates configured engine + StateManager
│   │   └── workflowEngine.ts    # Main execution engine
│   ├── machine/
│   │   ├── workflowMachine.ts   # XState v5 state machine
│   │   ├── actions.ts           # State actions
│   │   └── guards.ts            # Transition guards
│   ├── parser/                  # Workflow JSON → DAG conversion
│   ├── registry/
│   │   └── executors/
│   │       └── agentExecutor.ts # KEY FILE: Agent step execution
│   ├── utils/
│   │   └── contextInterpolator.ts  # {{variable}} substitution
│   └── workflows/
│       ├── test-workflow.ts     # Simple test workflow
│       ├── research-workflow.ts # Research-only workflow
│       └── sdlc-workflow.ts     # Full 4-step SDLC workflow
├── state/
│   ├── stateManager.ts          # Workflow state persistence
│   ├── types.ts                 # State types
│   ├── defaults.ts              # Constants
│   └── internal/                # Utilities
└── index.ts                     # Public exports
```

### Agent Files

```
/.opencode/agent/
├── research-agent.md    # Read-only exploration
├── plan-agent.md        # Planning with limited write
├── implement-agent.md   # Full-access implementation
└── review-agent.md      # Code review
```

### Task Files

```
.alfred/tasks/
├── TASK-08/
│   └── task.md          # Default Step Agents spec
└── TASK-09/
    └── task.md          # FloMaster Module + State spec (with E2E tests)
```

### State Storage

```
/.flomaster/
└── executions/
    └── {executionId}/
        ├── state.json       # Execution status
        ├── context.json     # Step outputs
        ├── mapping.json     # Step → Session mapping
        └── checkpoint.json  # Recovery checkpoint
```

---

## What's Next

### Pending Tasks

| Task | Description | Blocker |
|------|-------------|---------|
| TASK-09 Phase 3 | CLI commands (list, inspect, resume) | Ready |
| TASK-10 | Step Configuration Schema | Depends on Phase 3 |
| TASK-11 | Workflow Files (Load from disk) | Ready |
| TASK-12 | Unit Tests | Ready |
| Future | Task-Centric Storage | Requires design discussion |

### Decisions Needed

None currently blocking. All architectural decisions have been made and documented.

---

## How to Continue

### For Developers

1. **Read the task files in order:**
   - `.alfred/tasks/TASK-08/task.md` - Understand agent design
   - `.alfred/tasks/TASK-09/task.md` - Understand state management (includes E2E tests)

2. **Current work is on:** TASK-09 Phase 3 (CLI commands)

3. **To implement Phase 3:**
   - Add `workflow list` subcommand in `src/flomaster/cli/workflow.ts`
   - Add `workflow inspect <id>` subcommand
   - Add `workflow resume <id>` subcommand
   - Use existing StateManager methods: `listExecutions()`, `getExecution()`, `loadCheckpoint()`

### Commands Reference

```bash
# Development
cd packages/opencode

# Type checking
bun turbo typecheck

# Run workflow (dry-run, no API calls)
bun dev workflow run --workflow test --dry-run "Hello"
bun dev workflow run --workflow sdlc --dry-run "Test task"
bun dev workflow run --workflow research --dry-run "Find files"

# Run real workflow (makes API calls)
bun dev workflow run --workflow test "Hello, world"
bun dev workflow run --workflow sdlc "Create a hello world function"

# Check state files
ls .flomaster/executions/
cat .flomaster/executions/{id}/state.json | jq .
cat .flomaster/executions/{id}/context.json | jq .
```

---

## Summary Table

| Task | Status | Description |
|------|--------|-------------|
| TASK-07 | ✅ | Agent Integration (proper Agent.get() usage) |
| TASK-08 | ✅ | Default Step Agents (research, plan, implement, review) + SDLC workflow |
| TASK-09 Phase 1 | ✅ | Restructure to `src/flomaster/` |
| TASK-09 Phase 2 | ✅ | StateManager integration + state persistence |
| TASK-09 Phase 3 | 📋 | CLI commands (list, inspect, resume) |
| TASK-10 | 📋 | Step Configuration Schema |
| TASK-11 | 📋 | Workflow Files (Load from disk) |
| TASK-12 | 📋 | Unit Tests |

**Current blocker:** None - ready to proceed with TASK-09 Phase 3

---

## Key Insights for Future Sessions

1. **Agent files location**: `/.opencode/agent/` at project root (not in `packages/opencode/.opencode/`)

2. **State storage**: `/.flomaster/executions/` at project root (uses `Instance.worktree`)

3. **Context passing**: Already implemented via `{{stepId.response}}` interpolation in prompts

4. **StateManager enabled**: Set `enableStateManager: true` in `createWorkflowEngine()` options

5. **Future task-centric storage**: Documented in CONTEXT.md for later implementation

---

*This report reflects the project state as of 2026-01-04. See CONTEXT.md for the canonical project documentation and individual task files for implementation details.*
