# FloMaster Project Context

> **Purpose**: This is a living document capturing the context, decisions, and evolution of the FloMaster project. It contains information that cannot be easily gathered from code alone - the "why" behind decisions, historical context, and tribal knowledge. New team members should read this before diving into the codebase.
>
> **Last Updated**: 2026-01-04
> **Current Phase**: TASK-09 Complete (Phases 1 & 2), Phase 3 Pending (CLI commands)
> **Project Start Date**: 2025-01-01
> **Target Launch**: End of 2026

---

## Table of Contents

1. [What is FloMaster?](#what-is-flomaster)
2. [The Problem We're Solving](#the-problem-were-solving)
3. [Project Philosophy](#project-philosophy)
4. [Historical Context: Two Repositories](#historical-context-two-repositories)
5. [Why We Forked OpenCode](#why-we-forked-opencode)
6. [Architecture Overview](#architecture-overview)
7. [Key Design Decisions](#key-design-decisions)
8. [Task Timeline](#task-timeline)
9. [Current State](#current-state)
10. [The Agent System Connection](#the-agent-system-connection)
11. [The Permission System](#the-permission-system)
12. [Error Handling in Executors](#error-handling-in-executors)
13. [Workflow Events](#workflow-events)
14. [Session Hierarchy Model](#session-hierarchy-model)
15. [TUI Limitations](#tui-limitations)
16. [Workflow JSON Format](#workflow-json-format)
17. [Key Patterns to Understand](#key-patterns-to-understand)
18. [How systemPrompt Flows to LLM](#how-systemprompt-flows-to-llm)
19. [Model Selection Priority](#model-selection-priority)
20. [File Reference Guide](#file-reference-guide)
21. [Environment Variables](#environment-variables)
22. [Getting Started (Development)](#getting-started-development)
23. [Future Roadmap](#future-roadmap)
24. [Common Gotchas](#common-gotchas)
25. [Context Types Explained](#context-types-explained)
26. [XState v5 vs v4](#xstate-v5-vs-v4)
27. [Signal Flow (Abort/Cancellation)](#signal-flow-abortcancellation)
28. [Dry Run Implementation](#dry-run-implementation)
29. [Bus Event System Details](#bus-event-system-details)
30. [Glossary](#glossary)
31. [Appendix: Decision Log](#appendix-decision-log)

---

## What is FloMaster?

FloMaster is a **workflow orchestration system** for AI agents. It coordinates multi-step AI tasks using a DAG (Directed Acyclic Graph) execution model, where each workflow step is an independent agent with its own session.

Think of it as a "conductor" that orchestrates multiple AI agents working together on a complex task, where each agent focuses on one piece of the puzzle and passes its output to the next.

**Example Use Case**: A software development workflow might have:

1. **Research Agent** → Analyzes the codebase (read-only)
2. **Plan Agent** → Creates an implementation plan
3. **Implement Agent** → Writes the code (full access)
4. **Review Agent** → Reviews changes (read-only)

Each step is a separate agent session with appropriate permissions and context.

---

## The Problem We're Solving

### Context Overflow ("Context Rot")

When a single AI agent handles a complex, multi-step task in one continuous session:

1. The context window fills up with conversation history
2. Early instructions get pushed out or diluted
3. The AI loses track of the original goal
4. Quality degrades as the session grows
5. Token costs increase exponentially

### The FloMaster Solution

**Fresh Context Per Step**: Each workflow step creates a new agent session with:

- Clean context (no accumulated history from previous steps)
- Only the relevant inputs from upstream steps
- Step-specific system prompt and permissions
- Isolated conversation that can be reviewed independently

This prevents context overflow while maintaining coherent multi-step execution.

---

## Project Philosophy

### No Backward Compatibility

**This is a greenfield project.** We started development on January 1st, 2025.

- **No existing users** - Nobody is using this yet
- **No existing workflows** - There are no JSON files to migrate
- **No legacy code** - We can design things correctly from the start
- **Target launch: End of 2026** - We have time to do things right

**Implication**: When making design decisions, always choose the **cleanest implementation**. Never add complexity for "backward compatibility" with things that don't exist yet.

### Clean Implementation Over Expedience

- Prefer correct types over permissive ones
- Don't add conversion layers for hypothetical formats
- Don't add `// TODO: remove this legacy support` comments
- If a type should be `{ providerID, modelID }`, make it that - don't accept strings "for compatibility"

### Fail-Fast Philosophy

- Throw errors early with helpful messages
- Don't silently fall back to defaults when configuration is wrong
- Make misconfiguration obvious during development, not in production

---

## Historical Context: Two Repositories

### flomaster-prototype

- **Path**: `/Users/fahadkaleem/Documents/Workspace/flomaster-prototype`
- **Purpose**: Original proof-of-concept implementation
- **Architecture**: Standalone application using the OpenCode SDK as a dependency
- **Status**: Feature-complete prototype, used for validation

### flomaster-opencode

- **Path**: `/Users/fahadkaleem/Documents/Workspace/flomaster-opencode`
- **Purpose**: Production integration - FloMaster capabilities merged INTO OpenCode
- **Architecture**: Fork of OpenCode with orchestrator added as a core feature
- **Status**: Active development (current repository)

### Why Two Repositories?

The prototype was built first to validate the concept. It proved that:

- DAG-based workflow execution works
- XState v5 is suitable for orchestration state management
- The session-per-step model prevents context overflow

Once validated, the decision was made to integrate directly into OpenCode rather than maintain a separate application that depends on OpenCode's SDK.

---

## Why We Forked OpenCode

### What OpenCode Already Provides

OpenCode is a mature CLI tool for AI-assisted development. It includes:

| Feature                    | Why It Matters for FloMaster                                 |
| -------------------------- | ------------------------------------------------------------ |
| Multi-provider LLM support | Workflows can use Claude, OpenAI, Google, local models       |
| Session management         | Built-in persistence, message history, parent-child sessions |
| Tool system                | bash, edit, read, grep, glob - agents can take actions       |
| Agent definitions          | Built-in agents (build, plan, explore) + custom agents       |
| Permission system          | Fine-grained control over what tools agents can use          |
| TUI (Terminal UI)          | Visual interface for managing sessions                       |
| Configuration              | Provider keys, model selection, user preferences             |

### What OpenCode Was Missing

**Workflow orchestration** - the ability to:

- Define multi-step workflows as DAGs
- Execute steps in dependency order
- Pass outputs between steps
- Manage workflow lifecycle (pause, resume, abort)

### Integration vs. Standalone

We chose integration because:

1. **No SDK overhead**: Direct access to OpenCode internals (Session, Agent, Provider)
2. **Single product**: Users get workflows as a native feature, not a separate tool
3. **Shared infrastructure**: One configuration, one TUI, one CLI
4. **Maintenance**: One codebase to maintain instead of two
5. **User experience**: `flomaster workflow run` feels native, not bolted-on

### Direct Imports, Not SDK

A critical architectural decision: FloMaster uses **direct imports** from OpenCode's source code, NOT the `@opencode-ai/sdk` package.

| Approach  | What We Use                                               |
| --------- | --------------------------------------------------------- |
| ❌ SDK    | `import { createOpencodeClient } from '@opencode-ai/sdk'` |
| ✅ Direct | `import { Session } from '../session/index.js'`           |

This means:

- No HTTP overhead (SDK calls the server via REST)
- Direct access to internal APIs
- Single process execution
- Must understand OpenCode internals, not just the SDK

---

## Architecture Overview

### Monorepo Structure

FloMaster is a **separate package** within the monorepo, depending on OpenCode:

```
flomaster-opencode/
├── packages/
│   ├── flomaster/          ← FloMaster workflow orchestration (separate package)
│   │   ├── src/
│   │   │   ├── cli/            ← Standalone CLI (workflow commands)
│   │   │   ├── orchestrator/   ← DAG execution engine
│   │   │   ├── state/          ← Workflow state persistence
│   │   │   └── index.ts        ← Public exports
│   │   ├── bin/flomaster       ← CLI binary
│   │   └── package.json        ← @opencode-ai/flomaster
│   ├── opencode/           ← Core CLI (upstream OpenCode)
│   │   ├── src/
│   │   │   ├── session/        ← Session management (used by flomaster)
│   │   │   ├── agent/          ← Agent definitions (used by flomaster)
│   │   │   ├── provider/       ← LLM providers
│   │   │   ├── tool/           ← Agent tools
│   │   │   └── cli/cmd/        ← OpenCode CLI commands
│   │   └── test/
│   ├── sdk/                ← TypeScript SDK
│   ├── plugin/             ← Plugin system
│   └── desktop/            ← Tauri desktop app
├── .alfred/tasks/          ← Implementation task specifications
├── CLAUDE.md               ← AI assistant instructions
└── CONTEXT.md              ← This file
```

**Key Design**: FloMaster imports from the `opencode` package (e.g., `import { Session } from "opencode/session/index"`) rather than relative paths. This keeps the packages decoupled and enables clean upstream merges from OpenCode.

### Orchestrator Components

The orchestrator (`packages/flomaster/src/orchestrator/`) contains:

| Directory    | Purpose                                             |
| ------------ | --------------------------------------------------- |
| `engine/`    | WorkflowEngine class - main orchestrator            |
| `machine/`   | XState v5 state machine for workflow state          |
| `parser/`    | Converts workflow JSON → executable DAG             |
| `registry/`  | Step executor registry (pluggable step types)       |
| `actors/`    | XState actors for step execution                    |
| `workflows/` | Workflow definitions (currently just test-workflow) |
| `utils/`     | Helpers (context interpolation, schema validation)  |

### Step Types

The orchestrator supports multiple step types, each with its own executor:

| Type                | Purpose                       | Executor File            |
| ------------------- | ----------------------------- | ------------------------ |
| `Agent`             | AI agent execution with tools | `agentExecutor.ts`       |
| `ConditionalRouter` | Branch based on condition     | `conditionalExecutor.ts` |
| `Loop`              | Iterate over collections      | `loopExecutor.ts`        |
| `SubFlow`           | Execute nested workflow       | `subflowExecutor.ts`     |
| `Prompt`            | Template rendering            | `promptExecutor.ts`      |
| `Input`             | Workflow input step           | `genericExecutor.ts`     |
| `Output`            | Workflow output step          | `genericExecutor.ts`     |
| `Generic`           | Pass-through                  | `genericExecutor.ts`     |
| `HumanInput`        | Pause for user input          | (planned)                |
| `Approval`          | Pause for approval            | (planned)                |

**Note**: TASK-07 focuses on `Agent` steps. Other executors work but may need similar refinements.

### Step Type Details

**ConditionalRouter** (`conditionalExecutor.ts`)

- Evaluates a condition against inputs
- Returns `{ branch: "true" | "false" }` to determine next step
- Operators: equals, not equals, contains, regex, less than, greater than

**Loop** (`loopExecutor.ts`)

- Iterates over a collection from inputs
- Each iteration creates execution with current item
- Aggregates results based on config (`array`, `object`, `string`)
- Tracks iteration state in `context.loopStates`

**SubFlow** (`subflowExecutor.ts`)

- Executes a nested workflow
- Loads workflow by `flowId` or `flowName`
- Passes parent context to child workflow
- Returns child workflow outputs

### How Step Outputs Flow

```
Step 1 executes
    └─→ Returns { outputs: { response: "..." } }
          └─→ Stored in context.outputs["step-1"]
                └─→ Step 2 can reference via {{step-1.response}}
                      └─→ contextInterpolator.ts resolves at runtime
```

The `context.outputs` is the **SharedContext** - a map of stepId → outputs that grows as the workflow executes.

### Execution Flow

```
User: flomaster workflow run "prompt"
         ↓
    packages/flomaster/src/cli/workflow.ts (CLI command)
         ↓
    createWorkflowEngine()
         ↓
    engine.executeWorkflow(workflowData, taskId)
         ↓
    Session.create() → workflowSessionID (parent)
         ↓
    XState actor starts (workflowMachine)
         ↓
    For each step in topological order:
         ├─ stepActor spawned
         ├─ executor.execute(step, context)
         │      ↓
         │   [For Agent steps]
         │   Session.create(parentID: workflowSessionID)
         │   SessionPrompt.prompt(agent: agent.name, ...)
         │   Return { sessionID, outputs }
         │      ↓
         └─ Outputs stored in context.outputs[stepId]
         ↓
    All steps complete
         ↓
    Return WorkflowResult { workflowSessionID, stepResults, outputs }
```

### CLI to Engine Flow (Detailed)

```
packages/flomaster/src/cli/workflow.ts (CLI command)
    │
    ├── bootstrap(cwd, async () => {         // Sets up Instance context
    │       │
    │       ├── createWorkflowEngine({ directory })
    │       │       └── Returns { engine }
    │       │
    │       ├── engine.subscribe(callback)    // Register event handler
    │       │
    │       └── engine.executeWorkflow(       // Start execution
    │               workflowData,
    │               taskId,
    │               { dryRun, variables }
    │           )
    │               └── Returns WorkflowResult
    │
    └── Display results
```

The `bootstrap()` function is critical - it sets up the `Instance.provide()` context that all session operations require.

---

## Key Design Decisions

### Decision 1: CLI Named "flomaster" (not "opencode")

**Rationale**:

- Avoids conflict with globally installed `opencode`
- Establishes distinct product identity
- Both tools can coexist on the same system
- All original `opencode` commands still work under `flomaster`

**Reference**: Task file `.alfred/tasks/TASK-04/task.md`

### Decision 2: Subcommand Pattern for Workflows

**Choice**: `flomaster workflow run` instead of `flomaster run-workflow`

**Rationale**:

- Matches existing OpenCode patterns (`auth login`, `mcp add`)
- Allows future subcommands (`workflow list`, `workflow validate`)
- Groups related functionality under one namespace

### Decision 3: Parent-Child Session Hierarchy

**Choice**: Workflow creates a parent session; steps create child sessions linked via `parentID`

**Rationale**:

- Mirrors the `task.ts` pattern (Task tool creates child sessions)
- Enables visual grouping in TUI sidebar
- Allows `Session.children(workflowID)` queries
- Preserves audit trail of all step executions

**Reference**: See `task.ts:51-52` for the pattern

### Decision 4: Sessions Never Deleted

**Choice**: Step sessions persist after workflow completion

**Rationale**:

- Users can review step conversation history
- Future feature: "chat with this step" for human-in-the-loop
- Debugging and audit trail
- Aligns with OpenCode's session persistence model

**Implication**: Users clean up sessions manually or via future `workflow cleanup` command

### Decision 5: XState v5 for State Management

**Choice**: Use XState v5 state machine for workflow orchestration

**Rationale**:

- Battle-tested state machine library
- Built-in support for async actors (step execution)
- Persistence/snapshot support for crash recovery
- Clear state transitions (idle → preparing → executing → completed)
- Event-driven architecture for workflow events

**Reference**: `machine/workflowMachine.ts`

### Decision 6: Pluggable Step Executors

**Choice**: Registry pattern for step executors

**Rationale**:

- Different step types (Agent, Loop, Conditional, SubFlow) need different execution logic
- Easy to add new step types without modifying core engine
- Testable in isolation
- Follows OpenCode's registry patterns

**Reference**: `registry/stepExecutorRegistry.ts`, `registry/types.ts`

---

## Task Timeline

### TASK-01: Copy Orchestrator Files + Add XState

**Status**: ✅ Complete

**What**: Copied 48 files from `flomaster-prototype/src/orchestrator/` to `flomaster-opencode/packages/opencode/src/orchestrator/`. Added `xstate: ^5.19.0` to package.json.

**Why**: Bootstrap the orchestrator codebase without reimplementing from scratch.

**Reference**: `.alfred/tasks/TASK-01/task.md`

---

### TASK-02: Fix Orchestrator Imports

**Status**: ✅ Complete

**What**: Replaced flomaster-prototype's pino logging with OpenCode's `Log` utility.

**Before**: `import { createLogger } from '../logging/logger.js'`
**After**: `import { Log } from '../util/log.js'`

**Why**: The prototype used pino for logging; OpenCode uses its own `Log` utility. This unifies the logging approach.

**Reference**: `.alfred/tasks/TASK-02/task.md`

---

### TASK-03: Initial Session Integration

**Status**: ✅ Complete (refined by TASK-06)

**What**: First attempt at integrating orchestrator with OpenCode's session system.

**Why**: The prototype used the SDK for sessions; the fork needs to use internal APIs directly.

**Note**: This task established the direction but was refined by TASK-06.

**Reference**: `.alfred/tasks/TASK-03/task.md`

---

### TASK-04: Rename CLI + Add Workflow Command

**Status**: ✅ Complete

**What**:

1. Changed `package.json` bin entry from `opencode` to `flomaster`
2. Updated `src/index.ts` scriptName to `flomaster`
3. Created `src/cli/cmd/workflow.ts` with `run` subcommand
4. Created `src/orchestrator/workflows/test-workflow.ts`

**Why**: Establish FloMaster as the product name and provide end-to-end verification that the orchestrator works.

**Verification**: `bun dev workflow run "What is 2+2?"` returns a response

**Reference**: `.alfred/tasks/TASK-04/task.md`

---

### TASK-05: (Skipped)

**Status**: ⏭️ Skipped

**Note**: TASK-05 was an intermediate approach that was superseded by TASK-06. The task file may not exist. This is normal - sometimes tasks are abandoned or merged as understanding evolves.

---

### TASK-06: Refined Session Integration

**Status**: ✅ Complete

**What**: Implemented proper parent-child session hierarchy following `task.ts` pattern.

**Key Changes**:

- `workflowEngine.ts`: Creates parent session on workflow start
- `workflowMachine.ts`: Stores `workflowSessionID` in XState context
- `stepActor.ts`: Passes `workflowSessionID` to executor context
- `registry/types.ts`: Added `workflowSessionID` to `ExecutorContext`
- `agentExecutor.ts`: Uses `Session.create()` with `parentID: context.workflowSessionID`

**Why**: Establishes the session hierarchy that enables TUI visibility and future interaction features.

**Note**: This task removed an earlier "AgentAdapter" abstraction that was deemed unnecessary.

**Reference**: `.alfred/tasks/TASK-06/task.md`

---

### TASK-07: Proper Agent Integration

**Status**: ✅ Complete

**What**: Fixed `agentExecutor.ts` to properly use OpenCode's agent system.

**Key Changes Made**:

1. Use `Agent.get(agentType)` to look up agents (with helpful error if not found)
2. Pass `agent: agent.name` to `SessionPrompt.prompt()`
3. Removed `Session.remove()` call - sessions now persist
4. Return `sessionID` in executor output
5. Added `sessionID` to `ExecuteStepOutput`, `StepResult`, `WorkflowResult`
6. Signal flows via `options.signal` (ExecutorOptions already had signal)
7. Set session permissions (deny `task` to prevent infinite recursion)
8. Use `Provider.parseModel()` for model string parsing
9. Use `defer()` pattern for abort signal cleanup
10. Default `agentType` to "build" in parser when not specified

**Files Modified**:

- `orchestrator/registry/executors/agentExecutor.ts` - Major rewrite
- `orchestrator/types.ts` - Added sessionID to output types
- `orchestrator/actors/stepActor.ts` - Pass signal via options
- `orchestrator/machine/workflowMachine.ts` - Capture sessionID in saveStepOutput
- `orchestrator/engine/workflowEngine.ts` - Include workflowSessionID in result
- `orchestrator/parser/stepParser.ts` - Default agentType to "build"
- `cli/cmd/workflow.ts` - Added --workflow option, display session IDs

**Verified Working**:

- `bun dev workflow run "What is 2+2?"` → Uses default `build` agent ✅
- `bun dev workflow run --workflow research "query"` → Uses custom `research-agent` ✅
- Sessions persist and IDs are returned in result ✅
- Custom agents from `.opencode/agents/` are properly loaded ✅

**Reference**: `.alfred/tasks/TASK-07/task.md`

---

### TASK-08: Default Step Agents

**Status**: ✅ Complete

**What**: Created default step agents in `packages/opencode/.opencode/agents/`:

| Agent                | Purpose                        | Key Permissions                                  |
| -------------------- | ------------------------------ | ------------------------------------------------ |
| `research-agent.md`  | Read-only codebase exploration | read, grep, glob, list, webfetch, websearch      |
| `plan-agent.md`      | Implementation planning        | read + write to `.opencode/plan/` and `.alfred/` |
| `implement-agent.md` | Code implementation            | full access (read, edit, write, bash)            |
| `review-agent.md`    | Code review & analysis         | read + git diff/log/show commands                |

**Key Design Choices**:

- All agents use `mode: subagent` (not primary)
- All agents deny `task` permission implicitly via `"*": deny`
- Permissions follow principle of least privilege
- Prompts are concise and role-specific

**Reference**: `.alfred/tasks/TASK-08/task.md`

---

### TASK-09: Self-Contained FloMaster Module + State Management

**Status**: ✅ Phases 1 & 2 Complete, Phase 3 Pending

**What was done**:

1. **Phase 1: Restructure to `src/flomaster/`** ✅
   - Moved `src/orchestrator/` → `src/flomaster/orchestrator/`
   - Moved workflow CLI → `src/flomaster/cli/workflow.ts`
   - Created `src/flomaster/index.ts` with public exports
   - Only touchpoint: import in `src/index.ts`

2. **Phase 2: StateManager Integration** ✅
   - Ported from `flomaster-prototype/packages/core/src/state/`
   - Located at `src/flomaster/state/stateManager.ts`
   - Stores execution state in `{project}/.flomaster/executions/{id}/`
   - Auto-checkpoints after each step completion

3. **Phase 3: CLI Commands** 🔲 Pending
   - `workflow list` - List executions
   - `workflow inspect <id>` - View execution details
   - `workflow resume <id>` - Resume from checkpoint

**State Storage Location**: `{project_root}/.flomaster/executions/{execution_id}/`

- `state.json` - Execution status, step statuses
- `context.json` - Step outputs (for context passing)
- `mapping.json` - Step-to-session mappings
- `checkpoint.json` - Full checkpoint for crash recovery

**Key Design Decision**: State stored at **project root** (not in `~/.local/share/`) because workflow executions are project-specific.

**Future Improvement**: Move to task-centric storage (`.alfred/tasks/{taskId}/executions/`) when task management becomes more central. See "Future: Task-Centric Storage Model" in roadmap.

**Reference**: `.alfred/tasks/TASK-09/task.md`

---

## Current State

### What Works

| Feature                                | Status | Notes                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------------- |
| CLI renamed to `flomaster`             | ✅     | `bun dev --help` shows "flomaster"                          |
| `flomaster workflow run`               | ✅     | Executes test workflow with default `build` agent           |
| Custom agents from `.opencode/agents/` | ✅     | TASK-07 complete - agents properly loaded and used          |
| Agent prompts/permissions applied      | ✅     | `agent: agent.name` passed to SessionPrompt                 |
| Sessions persist after workflow        | ✅     | No deletion; IDs returned for UI access                     |
| Session IDs in result                  | ✅     | `workflowSessionID` + `stepResult.sessionID`                |
| Abort signal handling                  | ✅     | `options.signal` → `defer()` pattern                        |
| Parent-child sessions                  | ✅     | `workflowSessionID` flows through                           |
| XState orchestration                   | ✅     | State machine manages transitions                           |
| Multiple test workflows                | ✅     | `--workflow test` or `--workflow research`                  |
| TypeScript compilation                 | ✅     | `bun turbo typecheck` passes                                |
| Pre-built step agents                  | ✅     | TASK-08 complete - research, plan, implement, review agents |
| Self-contained flomaster module        | ✅     | All FloMaster code in `src/flomaster/`                      |
| Workflow state persistence             | ✅     | State saved to `{project}/.flomaster/executions/`           |
| Checkpoint after each step             | ✅     | Auto-checkpoints for crash recovery                         |

### What's Broken / Missing

| Issue                        | Impact                                                 | Fix In          |
| ---------------------------- | ------------------------------------------------------ | --------------- |
| No CLI to inspect executions | Must manually read JSON files                          | TASK-09 Phase 3 |
| No workflow resume command   | Can't continue failed workflows                        | TASK-09 Phase 3 |
| No step config schema        | Can't configure systemPrompt, allowInteraction in JSON | TASK-10         |
| No workflow file loading     | Workflows hardcoded in TypeScript                      | TASK-11         |

### Verification Commands

```bash
# From packages/opencode directory:
bun turbo typecheck                          # Type checking
bun dev --help                               # Should show "flomaster"
bun dev workflow --help                      # Workflow command help
bun dev workflow run                         # Run with default prompt (build agent)
bun dev workflow run "test"                  # Run with custom prompt
bun dev workflow run --workflow research "query"  # Run research workflow with custom agent
```

---

## The Agent System Connection

### What is an Agent in OpenCode?

An agent is a configured AI personality with:

- **Name**: Unique identifier (e.g., "build", "explore", "research-agent")
- **Prompt**: System prompt defining behavior
- **Permissions**: What tools the agent can use
- **Model**: Optional specific model to use
- **Mode**: "primary" (user-facing) or "subagent" (invoked by other agents)

### Built-in Agents

| Agent        | Mode     | Purpose                                              |
| ------------ | -------- | ---------------------------------------------------- |
| `build`      | primary  | Full access, default for development                 |
| `plan`       | primary  | Read-only planning, writes only to `.opencode/plan/` |
| `explore`    | subagent | Fast codebase exploration                            |
| `general`    | subagent | Multi-step task execution                            |
| `compaction` | internal | Session compaction                                   |
| `title`      | internal | Title generation                                     |
| `summary`    | internal | Summary generation                                   |

### Agent Modes Explained

| Mode       | When to Use                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `primary`  | User-facing agents selected via CLI (`flomaster run --agent plan`)                |
| `subagent` | Agents spawned by other agents or workflows - **use this for custom step agents** |
| `all`      | Available in both contexts                                                        |
| `internal` | System use only (compaction, title generation)                                    |

**For workflow steps**: Always use `mode: subagent` in custom agent definitions. Primary agents are for direct user interaction, not programmatic invocation.

### Custom Agents

Users can define custom agents in `.opencode/agents/{name}.md`:

```markdown
---
mode: subagent
description: Research agent for codebase analysis
permission:
  read: allow
  grep: allow
  glob: allow
  "*": deny
---

You are the Research Agent. Your job is to explore and analyze code.
You have READ-ONLY access. Focus on gathering information.
```

The YAML frontmatter defines configuration; the markdown body becomes the system prompt.

**Important**: The permission format in agent markdown files uses `Config.Permission` (simple key-value), NOT the `PermissionNext.Ruleset` array format used internally. The config system converts it automatically.

### Agent Loading Timing

**Important**: Agents are loaded once at application startup via `Instance.state()`.

- Built-in agents are always available
- Custom agents from `.opencode/agents/` must exist before `flomaster` starts
- If you create a new agent file while flomaster is running, **restart to pick it up**
- This is intentional - agents are cached for performance

### Complete Custom Agent Example

File: `.opencode/agents/research-agent.md`

```markdown
---
mode: subagent
description: Research agent for codebase analysis - read-only access
permission:
  read: allow
  grep: allow
  glob: allow
  "*": deny
---

You are the Research Agent for this workflow.

## Your Responsibilities

1. Analyze codebase structure and patterns
2. Find relevant files and implementations
3. Document your findings clearly

## Constraints

- You have READ-ONLY access
- You cannot edit, write, or execute code
- Focus on gathering information for the next step

## Output Format

Provide structured findings with file references.
```

The YAML frontmatter defines configuration; everything after `---` becomes the system prompt.

**Permission Format**: Use simple `tool: action` pairs. Actions are `allow`, `deny`, or `ask`. Use `"*": deny` to deny all tools not explicitly allowed.

### How Workflows Use Agents

After TASK-07 and TASK-08:

1. Workflow JSON specifies `agentType` for each step
2. `agentExecutor.ts` calls `Agent.get(agentType)`
3. `Agent.get()` returns the agent (built-in OR custom)
4. Agent's prompt, permissions, and model are used for that step
5. Each step is a true subagent with appropriate access

This is the key insight: **workflow steps become first-class agents**, not just raw LLM calls.

---

## The Permission System

### What Are Permissions?

OpenCode's permission system controls what **tools** an agent can use. Every tool call is checked against permission rules before execution.

### Permission Rule Structure

```typescript
{
  permission: "tool-name",  // Which tool (or "*" for all)
  pattern: "*",             // File pattern (for file-based tools)
  action: "allow" | "deny" | "ask"  // What to do
}
```

### How Rules Are Evaluated

Rules are evaluated **in order**; first match wins.

```typescript
permission: [
  { permission: "read", pattern: "*.secret", action: "deny" }, // Deny reading .secret files
  { permission: "read", pattern: "*", action: "allow" }, // Allow reading everything else
  { permission: "*", pattern: "*", action: "deny" }, // Deny everything else
]
```

### Why Workflow Steps Deny "task"

The `task` tool spawns subagents. If a workflow step could use `task`, you'd get:

```
Workflow → Step Agent → task tool → New Agent → task tool → New Agent → ...
                                    ↑___________________________|
                                         INFINITE RECURSION
```

By denying `task` permission on workflow step sessions, we prevent this:

```typescript
permission: [{ permission: "task", pattern: "*", action: "deny" }]
```

The agent simply won't be able to call the `task` tool. If it tries, the permission system blocks it.

### Permission Sources

Permissions come from multiple sources and are merged:

1. **Agent's permissions** - Defined in `.opencode/agents/*.md` or built-in
2. **Session's permissions** - Set when session is created
3. **Global permissions** - User configuration

The `PermissionNext.merge()` function combines these rulesets.

---

## Error Handling in Executors

**Executors should THROW, not retry.**

The orchestrator (XState machine) handles retries:

- `handleError` state catches executor throws
- `canRetry` guard checks `context.retryCount < context.maxRetries`
- `RETRY` event transitions back to `runStep`

```typescript
// ❌ WRONG - don't retry in executor
try {
  await SessionPrompt.prompt({...})
} catch (e) {
  if (retries < 3) return retry()  // NO!
}

// ✅ CORRECT - throw and let orchestrator handle
const result = await SessionPrompt.prompt({...})
// If this throws, XState machine catches it
```

This design keeps retry logic centralized in the state machine, making it configurable and consistent across all step types.

---

## Workflow Events

The orchestrator emits events during execution that can be subscribed to:

| Event                | When Fired                    | Payload                          |
| -------------------- | ----------------------------- | -------------------------------- |
| `WORKFLOW_STARTED`   | Workflow begins               | `{ executionId, taskId }`        |
| `WORKFLOW_COMPLETED` | All steps finish successfully | `{ executionId, outputs }`       |
| `WORKFLOW_FAILED`    | Workflow fails                | `{ executionId, error }`         |
| `STEP_STARTED`       | Step begins                   | `{ stepId, displayName }`        |
| `STEP_COMPLETED`     | Step finishes                 | `{ stepId, outputs, sessionID }` |
| `STEP_FAILED`        | Step fails                    | `{ stepId, error }`              |

Subscribe in CLI:

```typescript
engine.subscribe((event) => {
  if (event.type === "STEP_COMPLETED") {
    console.log(`Step ${event.stepId} done`)
  }
})
```

These events enable TUI progress updates, logging, and future web console integration.

---

## Session Hierarchy Model

### Before FloMaster (Single Session)

```
Session
├── User message 1
├── Assistant response 1
├── User message 2
├── ... (context grows unbounded)
└── Assistant response N (quality degraded)
```

### With FloMaster (Hierarchical Sessions)

```
Workflow Session (parent)
│
├── Step 1: Research (@research-agent)
│   ├── User: "Analyze the codebase for authentication patterns"
│   └── Assistant: [Analysis output]
│
├── Step 2: Plan (@plan-agent)
│   ├── User: "Create implementation plan based on: {{step1.output}}"
│   └── Assistant: [Plan output]
│
└── Step 3: Implement (@build)
    ├── User: "Implement the plan: {{step2.output}}"
    └── Assistant: [Implementation with tool calls]
```

Each step session:

- Has fresh context (only the step's inputs, not all history)
- Uses appropriate agent (permissions, prompt)
- Persists independently (can be reviewed/continued)
- Links to parent via `parentID`

### Where Sessions Are Stored

Sessions are persisted to disk by OpenCode's Storage system:

```
Location: ~/.opencode/storage/session/{projectId}/{sessionId}.json

Structure:
~/.opencode/
├── storage/
│   └── session/
│       └── {projectId}/
│           ├── {workflowSessionId}.json    # Parent
│           ├── {stepSession1Id}.json       # Child
│           └── {stepSession2Id}.json       # Child
└── logs/
    └── opencode.log
```

Sessions persist across restarts. Delete manually or via `Session.remove()`.

---

## TUI Limitations

### Child Sessions Cannot Receive Input

The current OpenCode TUI has a restriction that **hides the prompt input for child sessions**:

```typescript
// tui/routes/session/index.tsx:1028
<Prompt visible={!session().parentID && ...} />
```

This means:

- ✅ Users CAN view child session conversations in the TUI
- ❌ Users CANNOT type new messages to child sessions
- This is a **UI restriction**, not an API limitation

### Why This Matters

Workflow step sessions are child sessions (they have `parentID`). In the TUI, you can:

- See the workflow session in the sidebar
- See step sessions nested under it
- Click into step sessions to read the conversation
- **But you cannot send new messages to step sessions**

### Planned Solution

The planned **Electron UI** will NOT have this restriction, enabling the "chat with any step" feature. This is why we persist sessions - the capability exists at the API level, we just need a UI that exposes it.

### Can the TUI Be Modified?

**Yes.** The restriction is a single line:

```typescript
// tui/routes/session/index.tsx:1028
<Prompt visible={!session().parentID && ...} />
//               ^^^^^^^^^^^^^^^^^ Remove this check to allow child session input
```

Change to `visible={permissions().length === 0}` to allow child session input.

**However**: We plan to build an Electron UI instead, so this modification is optional. The TUI is based on SolidJS and the terminal rendering library `opentui` - modifying it requires understanding both.

---

## Workflow JSON Format

Workflows use a React Flow-compatible JSON format:

```json
{
  "nodes": [
    {
      "id": "input-1",
      "type": "genericNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "id": "input-1",
        "node": {
          "displayName": "User Input",
          "baseClasses": ["Input"],
          "template": {
            "prompt": { "name": "prompt", "type": "str", "value": "" }
          },
          "outputs": [{ "name": "prompt", "types": ["string"] }]
        }
      }
    },
    {
      "id": "agent-1",
      "type": "genericNode",
      "position": { "x": 200, "y": 0 },
      "data": {
        "id": "agent-1",
        "node": {
          "displayName": "AI Agent",
          "baseClasses": ["Agent"],
          "template": {
            "agentType": { "value": "research-agent" },
            "prompt": { "value": "{{input-1.prompt}}" }
          },
          "outputs": [{ "name": "response", "types": ["string"] }]
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "input-1",
      "target": "agent-1",
      "sourceHandle": "prompt",
      "targetHandle": "prompt"
    }
  ]
}
```

### Context Interpolation Syntax

The `{{stepId.outputKey}}` syntax references outputs from previous steps:

| Syntax                  | Resolves To                            |
| ----------------------- | -------------------------------------- |
| `{{input-1.prompt}}`    | Output "prompt" from step "input-1"    |
| `{{research.response}}` | Output "response" from step "research" |
| `{{plan.summary}}`      | Output "summary" from step "plan"      |

Interpolation happens at runtime in `contextInterpolator.ts` before the step executes.

### Context Interpolation Implementation

```typescript
// How {{stepId.outputKey}} resolution works (contextInterpolator.ts)

// SharedContext structure:
const outputs = {
  "input-1": { prompt: "Hello world" },
  "research": { response: "Found 5 files...", files: [...] }
}

// Resolution:
// "{{input-1.prompt}}" → outputs["input-1"]["prompt"] → "Hello world"
// "{{research.response}}" → outputs["research"]["response"] → "Found 5 files..."
```

**Important limitation**: Nested access is NOT supported:

- `{{research.files.0}}` → Won't work, only one level deep
- `{{research.files}}` → Works, returns the whole array

---

## Key Patterns to Understand

### Pattern 1: The task.ts Reference

`src/tool/task.ts` is the canonical example of how to spawn a subagent. Key elements:

1. **Agent lookup**: `Agent.get(params.subagent_type)`
2. **Session creation with parentID**: Links child to parent
3. **Permission rules**: Deny recursive task calls
4. **Abort handling**: `defer()` pattern for cleanup
5. **Pass agent to prompt**: `agent: agent.name`
6. **Return sessionId**: For UI linking

`agentExecutor.ts` should mirror this pattern exactly.

### Pattern 2: Provider.parseModel()

Model strings like `"anthropic/claude-sonnet-4-20250514"` are parsed to `{ providerID, modelID }`:

```typescript
const model = Provider.parseModel("anthropic/claude-sonnet-4-20250514")
// Returns: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" }
```

Used when config specifies model as string but API needs object.

### Pattern 3: PermissionNext Rulesets

OpenCode's permission system uses a ruleset pattern:

```typescript
permission: [
  { permission: "edit", pattern: "*", action: "deny" },
  { permission: "read", pattern: "*", action: "allow" },
]
```

Rules are evaluated in order; first match wins.

### Pattern 4: XState Actor Spawning

The workflow machine spawns step actors using XState's `spawn()`:

```typescript
// In workflowMachine.ts
spawn(executeStepActor, { input: stepInput })
```

This runs step execution in parallel with the state machine, allowing the machine to handle events while steps execute.

### Pattern 5: Instance.provide() Context

All session operations must be wrapped in `Instance.provide()`:

```typescript
await Instance.provide({
  directory: process.cwd(),
  fn: async () => {
    // Session operations work here
    const session = await Session.create({ ... })
    await SessionPrompt.prompt({ ... })
  }
})
```

The `bootstrap()` function in CLI commands does this automatically. If you call session functions outside this context, you'll get errors.

### Pattern 6: Event Subscription (Bus.subscribe)

OpenCode uses an event bus for real-time updates:

```typescript
import { Bus } from "../bus"
import { MessageV2 } from "../session/message-v2"

// Subscribe to message part updates
const unsub = Bus.subscribe(MessageV2.Event.PartUpdated, (evt) => {
  if (evt.properties.part.sessionID !== targetSessionID) return
  if (evt.properties.part.type === "tool") {
    console.log("Tool call:", evt.properties.part.tool)
  }
})

// Later: cleanup
unsub()
```

Used in `task.ts` to track tool calls in real-time.

### Pattern 7: Cleanup with defer()

The `defer()` utility ensures cleanup code runs when a scope exits, even if an exception is thrown:

```typescript
import { defer } from "../../../util/defer.js"

// Used for signal cleanup
function cancel() {
  SessionPrompt.cancel(session.id)
}
context.signal?.addEventListener("abort", cancel)
using _ = defer(() => context.signal?.removeEventListener("abort", cancel))

// The 'using' keyword + defer() ensures cleanup happens when scope exits
// This is TypeScript 5.2+ "Explicit Resource Management"
```

This pattern is used in `task.ts` and should be used in `agentExecutor.ts` for signal handling.

### Pattern 8: Identifier Generation

```typescript
import { Identifier } from "../../../id/id.js"

// Generate ascending IDs (lexicographically sortable)
const messageID = Identifier.ascending("message") // "message_01jfk2..."
const partID = Identifier.ascending("part") // "part_01jfk2..."
const sessionID = Identifier.ascending("session") // "session_01jfk2..."

// IDs are prefixed with type and use ULID-like format
// Ascending order means newer IDs sort after older ones
```

---

## How systemPrompt Flows to LLM

### The Dual Prompt System

Steps have **TWO sources** of system prompt that are ADDITIVE:

1. **Agent's base prompt** - From `Agent.Info.prompt` (defined in `.opencode/agents/*.md` or built-in)
2. **Step's systemPrompt** - From workflow step config (augments, doesn't replace)

### Flow Through the System

When a step has `systemPrompt` configured:

1. `agentExecutor.ts` passes it to `SessionPrompt.prompt({ system: config.systemPrompt })`
2. `prompt.ts` stores it on the user message info
3. `LLM.stream()` assembles the final system prompt:

```
Final System Prompt =
  1. SystemPrompt.header()        ← Provider-specific header
  2. + agent.prompt               ← Agent's base prompt (from Agent.Info)
  3. + system[]                   ← Additional system prompts (step.systemPrompt goes here)
  4. + user.system                ← User-level system prompt
  5. + environment context        ← CLAUDE.md, etc.
```

### Example: Research Step

A step using `explore` agent with custom systemPrompt:

| Source              | Content                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| Agent's base prompt | "You are a codebase exploration expert. Use grep, glob, read..."       |
| Step's systemPrompt | "Focus on authentication patterns. Look for login, logout, session..." |
| Environment         | CLAUDE.md project instructions                                         |

The AI receives ALL of these combined - the agent defines general behavior, the step adds specific context.

---

## Model Selection Priority

When determining which LLM model to use for a step:

| Priority | Source               | Description                                                  |
| -------- | -------------------- | ------------------------------------------------------------ |
| 1        | Step config model    | Explicit model in workflow step config                       |
| 2        | Agent's model        | From `Agent.Info.model` (defined in `.opencode/agents/*.md`) |
| 3        | Session's last model | Model used in previous message                               |
| 4        | Provider default     | Provider's default model                                     |

Code path in agentExecutor:

```typescript
const model = config.model
  ? Provider.parseModel(config.model) // Step config wins
  : agent.model // Agent default
// Session history handled by SessionPrompt.prompt()
```

---

## File Reference Guide

### Core FloMaster Files (in `src/flomaster/`)

| File                                                         | Purpose                               |
| ------------------------------------------------------------ | ------------------------------------- |
| `flomaster/index.ts`                                         | Public exports for FloMaster module   |
| `flomaster/cli/workflow.ts`                                  | Workflow CLI command                  |
| `flomaster/orchestrator/engine/workflowEngine.ts`            | Main engine class, executes workflows |
| `flomaster/orchestrator/engine/factory.ts`                   | Creates configured engine instances   |
| `flomaster/orchestrator/machine/workflowMachine.ts`          | XState state machine definition       |
| `flomaster/orchestrator/machine/actions.ts`                  | State machine actions                 |
| `flomaster/orchestrator/machine/guards.ts`                   | State machine transition guards       |
| `flomaster/orchestrator/actors/stepActor.ts`                 | Step execution actor                  |
| `flomaster/orchestrator/parser/workflowParser.ts`            | JSON → DAG conversion                 |
| `flomaster/orchestrator/registry/stepExecutorRegistry.ts`    | Executor dispatch                     |
| `flomaster/orchestrator/registry/executors/agentExecutor.ts` | **KEY FILE** - Agent step execution   |
| `flomaster/orchestrator/types.ts`                            | All type definitions                  |
| `flomaster/orchestrator/utils/contextInterpolator.ts`        | `{{variable}}` substitution           |
| `flomaster/state/stateManager.ts`                            | **NEW** - Workflow state persistence  |
| `flomaster/state/types.ts`                                   | State types and enums                 |
| `flomaster/state/defaults.ts`                                | Storage constants                     |

### FloMaster Configuration Files

| File                                  | Purpose                           |
| ------------------------------------- | --------------------------------- |
| `/.opencode/agent/research-agent.md`  | Read-only exploration agent       |
| `/.opencode/agent/plan-agent.md`      | Planning agent with limited write |
| `/.opencode/agent/implement-agent.md` | Full-access implementation agent  |
| `/.opencode/agent/review-agent.md`    | Code review agent                 |

**Note**: Agent files are in the **root** `/.opencode/agent/` directory (not `packages/opencode/.opencode/`). OpenCode searches for agents in `.opencode/` directories walking up from the working directory.

### FloMaster Runtime Data

| Directory                                    | Purpose                                   |
| -------------------------------------------- | ----------------------------------------- |
| `{project}/.flomaster/`                      | FloMaster runtime data (project-specific) |
| `.flomaster/executions/`                     | Workflow execution state                  |
| `.flomaster/executions/{id}/state.json`      | Execution status, step statuses           |
| `.flomaster/executions/{id}/context.json`    | Step outputs (for context passing)        |
| `.flomaster/executions/{id}/mapping.json`    | Step-to-session mappings                  |
| `.flomaster/executions/{id}/checkpoint.json` | Full checkpoint for crash recovery        |

**Note**: `.flomaster/` is stored at the **project root** (git worktree), not in `~/.local/share/`. This is intentional - workflow executions are project-specific, unlike OpenCode's global session storage.

### OpenCode Integration Points

| File                   | What Orchestrator Uses                                  |
| ---------------------- | ------------------------------------------------------- |
| `session/index.ts`     | `Session.create()`, `Session.get()`, `Session.remove()` |
| `session/prompt.ts`    | `SessionPrompt.prompt()`, `SessionPrompt.cancel()`      |
| `agent/agent.ts`       | `Agent.get()`, `Agent.list()`                           |
| `provider/provider.ts` | `Provider.parseModel()`, `Provider.getModel()`          |
| `permission/next.ts`   | Permission rule evaluation                              |
| `util/defer.ts`        | Cleanup pattern for abort handling                      |
| `bus.ts`               | Event subscription system                               |

### Task Specifications

| File                            | Task                          |
| ------------------------------- | ----------------------------- |
| `.alfred/tasks/TASK-01/task.md` | Copy orchestrator + XState    |
| `.alfred/tasks/TASK-02/task.md` | Fix imports                   |
| `.alfred/tasks/TASK-03/task.md` | Initial session integration   |
| `.alfred/tasks/TASK-04/task.md` | CLI rename + workflow command |
| `.alfred/tasks/TASK-06/task.md` | Refined session integration   |
| `.alfred/tasks/TASK-07/task.md` | Proper agent integration      |

### CLI Entry Points

| File                  | Purpose                         |
| --------------------- | ------------------------------- |
| `cli/cmd/workflow.ts` | `flomaster workflow` command    |
| `index.ts`            | CLI entry, command registration |

### Common Import Paths

From `src/orchestrator/registry/executors/agentExecutor.ts`:

```typescript
// Session management
import { Session } from "../../../session/index.js"
import { SessionPrompt } from "../../../session/prompt.js"

// Agent system
import { Agent } from "../../../agent/agent.js"

// Provider utilities (if needed for model parsing)
import { Provider } from "../../../provider/provider.js"

// Logging
import { Log } from "../../../util/log.js"

// Identifiers
import { Identifier } from "../../../id/id.js"

// Cleanup utility for abort handling
import { defer } from "../../../util/defer.js"
```

**Note**: All local imports must include the `.js` extension (ESM requirement).

---

## Environment Variables

FloMaster inherits OpenCode's environment configuration:

| Variable            | Purpose                             |
| ------------------- | ----------------------------------- |
| `ANTHROPIC_API_KEY` | Claude API key                      |
| `OPENAI_API_KEY`    | OpenAI API key                      |
| `GOOGLE_API_KEY`    | Google AI API key                   |
| `OPENCODE`          | Set to "1" when running (automatic) |
| `AGENT`             | Set to "1" when running (automatic) |

Configure API keys in `~/.opencode/config.json` or via environment variables.

---

## Getting Started (Development)

### Prerequisites

- **Bun** installed: `curl -fsSL https://bun.sh/install | bash`
- **Node.js 18+** (for some tooling)
- **Git** configured
- **API key** for at least one LLM provider (Anthropic, OpenAI, or Google)

### Initial Setup

```bash
cd flomaster-opencode
bun install                    # Install all dependencies
bun turbo typecheck           # Verify TypeScript compiles
```

### Running Locally

```bash
cd packages/opencode

bun dev                       # Start dev server (opens TUI)
bun dev workflow run          # Run workflow command
bun dev workflow run "test"   # Run with custom prompt
bun dev run "Hello"           # Standard chat (non-workflow)
```

### Dry Run Mode

Test workflows without executing AI calls:

```bash
bun dev workflow run --dry-run
```

In dry-run mode:

- Agent steps return mock responses: `"[DRY-RUN] Agent X would execute"`
- No LLM API calls are made
- Useful for testing workflow structure and context interpolation

### Debug Logging

To see detailed logs during development:

```bash
# Print logs to stderr
bun dev workflow run --print-logs

# Set log level
bun dev workflow run --log-level DEBUG
```

Log output goes to `~/.opencode/logs/` by default.

### Running Tests

```bash
cd packages/opencode

bun test                              # All tests
bun test src/orchestrator/            # Orchestrator tests only
bun test src/orchestrator/engine/     # Specific directory
bun test src/tool/task.test.ts        # Specific file
```

### Test File Locations

| Component            | Test Location                                            |
| -------------------- | -------------------------------------------------------- |
| Workflow Engine      | `src/orchestrator/engine/workflowEngine.test.ts`         |
| Step Actor           | `src/orchestrator/actors/stepActor.test.ts`              |
| Executor Registry    | `src/orchestrator/registry/stepExecutorRegistry.test.ts` |
| Parsers              | `src/orchestrator/parser/*.test.ts`                      |
| Context Interpolator | `src/orchestrator/utils/contextInterpolator.test.ts`     |

### Type Checking

```bash
bun turbo typecheck    # From repo root - checks all packages
```

### Establishing Test Baseline

Before making changes, record current test state:

```bash
cd packages/opencode

# Run orchestrator tests and save output
bun test src/orchestrator/ 2>&1 | tee /tmp/test-baseline.txt

# Key test files:
bun test src/orchestrator/engine/workflowEngine.test.ts
bun test src/orchestrator/actors/stepActor.test.ts
bun test src/orchestrator/registry/stepExecutorRegistry.test.ts
```

Any failures in baseline are pre-existing issues, not your fault. After your changes, compare to baseline to identify new failures.

### Writing Orchestrator Tests

Tests use Bun's test runner with these patterns:

```typescript
import { describe, test, expect, beforeEach, vi } from "bun:test"

// Mock Session module
vi.mock("../../../session/index.js", () => ({
  Session: {
    create: vi.fn().mockResolvedValue({ id: "mock-session-id" }),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

// Test executor in isolation
describe("agentExecutor", () => {
  test("creates child session with parentID", async () => {
    const executor = createAgentExecutor("/test/dir")
    await executor.execute(mockStep, mockContext)

    expect(Session.create).toHaveBeenCalledWith({
      parentID: "workflow-session-id",
      title: expect.stringContaining("@"),
    })
  })
})
```

Key test files to study:

- `src/orchestrator/engine/workflowEngine.test.ts` - Integration patterns
- `src/orchestrator/actors/stepActor.test.ts` - Actor testing

---

## Future Roadmap

| Phase                        | Description                               | Status                       |
| ---------------------------- | ----------------------------------------- | ---------------------------- |
| Core Orchestrator            | DAG execution, session hierarchy          | ✅ Done                      |
| Agent Integration            | Proper use of OpenCode agents             | ✅ TASK-07 Complete          |
| Default Step Agents          | research, plan, implement, review         | ✅ TASK-08 Complete          |
| **FloMaster Module + State** | Self-contained folder + StateManager      | ✅ TASK-09 (Phase 3 pending) |
| Step Configuration           | agentType, systemPrompt, permissions      | 📋 TASK-10                   |
| Workflow Files               | Load from `.flomaster/workflows/`         | 📋 TASK-11                   |
| **Unit Tests**               | Comprehensive tests for orchestrator code | 📋 TASK-12                   |
| **Task-Centric Storage**     | Move executions under `.alfred/tasks/`    | 📋 Future                    |
| Electron UI                  | Replace SolidJS TUI, enable step chatting | 📋 Planned                   |
| Human-in-the-Loop            | Approval gates, step interaction          | 📋 Planned                   |
| Workflow Cleanup             | Utilities for cleaning old sessions       | 📋 Planned                   |

> **Note**: Unit tests (TASK-12) must be completed BEFORE starting Electron UI. We need a solid, tested foundation before building the UI layer.

### Future: Task-Centric Storage Model

**Current model**: Executions stored in `.flomaster/executions/{id}/` (separate from tasks)

**Desired model**: Everything tied to a task:

```
.alfred/tasks/TASK-XX/
├── task.md                    # Specification
├── plan.md                    # Implementation plan
├── research.md                # Research notes
├── executions/                # All workflow runs for THIS task
│   └── {executionId}/
│       ├── state.json
│       ├── context.json
│       ├── mapping.json
│       └── checkpoint.json
└── outputs/                   # Final outputs/artifacts
```

**Why not now**: Current implementation works and is simpler. Ad-hoc workflow runs (without a task) need a fallback location. Will revisit when task management becomes more central to the workflow.

---

## Common Gotchas

### "Agent not found" Error

**Symptom**: `Unknown agent type: "my-agent"`

**Cause**: `agentType` in workflow doesn't match any agent

**Fix**:

- Check `.opencode/agents/` for custom agents
- Use built-in: `build`, `plan`, `explore`, `general`
- Ensure file is named correctly: `my-agent.md` for agent type `my-agent`

---

### Session Operations Fail

**Symptom**: Error about missing context or undefined values

**Cause**: Not inside `Instance.provide()` context

**Fix**: Ensure `bootstrap()` is called (CLI commands do this automatically). For scripts:

```typescript
await Instance.provide({
  directory: process.cwd(),
  fn: async () => {
    /* your code */
  },
})
```

---

### TypeScript Errors After Pulling

**Symptom**: Type errors that weren't there before

**Cause**: Dependencies or generated types out of sync

**Fix**:

```bash
bun install
bun turbo typecheck
```

---

### Custom Agent Permission Format Error

**Symptom**: `Configuration is invalid ... Invalid input permission`

**Cause**: Using wrong permission format in `.opencode/agents/*.md`

**Fix**: Use `Config.Permission` format (simple key-value), not `PermissionNext.Ruleset` array:

```yaml
# ❌ WRONG - array format
permission:
  - permission: read
    pattern: "*"
    action: allow

# ✅ CORRECT - simple format
permission:
  read: allow
  grep: allow
  "*": deny
```

---

### Child Session Not Accepting Input in TUI

**Symptom**: Can see child session but prompt is hidden

**Cause**: TUI design - child sessions don't show prompt input

**Not a bug**: This is a known TUI limitation. Future Electron UI will allow this.

---

## Context Types Explained

| Type            | What It Is                                                          | Where Used           |
| --------------- | ------------------------------------------------------------------- | -------------------- |
| SharedContext   | `Record<string, Record<string, unknown>>` - Map of stepId → outputs | Passed between steps |
| WorkflowContext | XState machine context - full execution state                       | Internal to machine  |
| ExecutorContext | What executors receive - subset of workflow state                   | Passed to executors  |

```typescript
// SharedContext (the outputs map)
type SharedContext = {
  "step-1": { response: "...", files: [...] },
  "step-2": { plan: "...", tasks: [...] }
}

// WorkflowContext (XState machine) - see orchestrator/types.ts
interface WorkflowContext {
  graph: ParsedWorkflow
  executionId: string
  taskId: string
  outputs: SharedContext        // ← SharedContext lives here
  currentStep?: ParsedStep
  stepResults: StepResult[]
  completedSteps: Set<string>
  // ...more fields
}

// ExecutorContext (what executors see)
interface ExecutorContext {
  outputs: SharedContext        // ← Same SharedContext
  dryRun: boolean
  workflowSessionID?: string
  signal?: AbortSignal
}
```

**Note**: All orchestrator types are defined in `src/orchestrator/types.ts`.

---

## XState v5 vs v4

FloMaster uses **XState v5**, which has significant API differences from v4:

| Concept          | v4                  | v5                                                |
| ---------------- | ------------------- | ------------------------------------------------- |
| Machine creation | `createMachine()`   | `setup().createMachine()`                         |
| Context typing   | Generic parameter   | `setup({ types: { context: ... } })`              |
| Actions          | String references   | Inline functions or `setup({ actions: { ... } })` |
| Actors           | `invoke` with `src` | `invoke` with actor logic                         |
| Guards           | String references   | Inline or `setup({ guards: { ... } })`            |

If you're familiar with v4, read the [v5 migration guide](https://stately.ai/docs/migration).

**Why this matters**: The `workflowMachine.ts` uses v5 patterns exclusively. Don't try to use v4 examples.

---

## Signal Flow (Abort/Cancellation)

The abort signal flows through the entire execution chain via `ExecutorOptions`, NOT `ExecutorContext`:

```
ExecutionOptions.signal
    ↓ (executeWorkflow parameter)
WorkflowActorInput.signal
    ↓ (passed to XState actor)
ExecuteStepInput.signal
    ↓ (passed to stepActor)
ExecutorOptions.signal (passed via options parameter, NOT context)
    ↓ (executor uses options?.signal)
SessionPrompt.cancel(sessionID) (on abort)
```

In executor (using `options.signal`, following task.ts pattern):

```typescript
function cancel() {
  SessionPrompt.cancel(session.id)
}
if (options?.signal) {
  options.signal.addEventListener("abort", cancel)
}
using _ = defer(() => {
  if (options?.signal) {
    options.signal.removeEventListener("abort", cancel)
  }
})
```

**Key insight**: Signal is passed via `ExecutorOptions` (the third parameter to `execute()`), not `ExecutorContext`. This matches OpenCode's existing pattern where options contain runtime settings.

---

## Dry Run Implementation

When `dryRun: true` is passed to `executeWorkflow()`:

1. It's stored in `WorkflowContext.dryRun`
2. Passed to `ExecuteStepInput.dryRun`
3. Passed to `ExecutorContext.dryRun`
4. Executors check and return mock data:

```typescript
// In agentExecutor.ts
if (context.dryRun) {
  return {
    stepId: step.id,
    outputs: {
      response: `[DRY-RUN] Agent ${step.displayName} would execute`,
      success: true,
    },
    complete: true,
  }
}
```

**Benefits**:

- Test workflow structure without API calls
- Verify context interpolation works
- Fast iteration during development
- No token costs

---

## Bus Event System Details

OpenCode uses a typed event bus for real-time updates:

```typescript
import { Bus } from "../bus"
import { BusEvent } from "../bus/event"

// Define an event type
const MyEvent = BusEvent.define(
  "my.event",
  z.object({
    sessionID: z.string(),
    data: z.string(),
  }),
)

// Publish
Bus.publish(MyEvent, { sessionID: "123", data: "hello" })

// Subscribe (returns unsubscribe function)
const unsub = Bus.subscribe(MyEvent, (event) => {
  console.log(event.properties.sessionID)
})

// Cleanup
unsub()
```

Key events used in orchestrator:

- `MessageV2.Event.PartUpdated` - Tool call progress
- `Session.Event.Created` - New sessions
- `Session.Event.Error` - Session errors

---

## Glossary

| Term                      | Definition                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Context Rot**           | Degradation of AI quality as session context grows too large                                            |
| **DAG**                   | Directed Acyclic Graph - workflow steps with dependencies, no cycles                                    |
| **Step**                  | A single unit of work in a workflow (node in the DAG)                                                   |
| **Executor**              | Code that runs a specific step type (Agent, Loop, Conditional)                                          |
| **Parent Session**        | The workflow's main session; steps create children linked via `parentID`                                |
| **Subagent**              | An agent spawned by another agent (or workflow) with its own session                                    |
| **XState**                | State machine library (v5) used for workflow orchestration - note: v5 API differs significantly from v4 |
| **Actor**                 | XState concept - independent unit of computation that can receive/send events                           |
| **Topological Sort**      | Algorithm to order DAG nodes so dependencies come before dependents                                     |
| **workflowSessionID**     | The parent session ID for an entire workflow execution                                                  |
| **Context Interpolation** | `{{stepId.output}}` syntax to reference previous step outputs                                           |
| **Permission Ruleset**    | Array of rules controlling tool access, evaluated in order                                              |
| **SharedContext**         | The `context.outputs` map containing all step outputs, keyed by stepId                                  |
| **Instance.provide()**    | OpenCode pattern that creates execution context for session operations                                  |
| **Agent Mode**            | How an agent is invoked: primary (user), subagent (programmatic), internal (system)                     |
| **Direct Imports**        | Using OpenCode's source code directly, not the `@opencode-ai/sdk` package                               |
| **defer()**               | TypeScript 5.2+ cleanup utility using Explicit Resource Management                                      |
| **Provider.parseModel()** | Converts "provider/model" string to `{ providerID, modelID }` object                                    |

---

## Appendix: Decision Log

### 2026-01-04: TASK-09 Self-Contained Module + State Persistence

**Context**: Restructured FloMaster code and added state persistence for workflow executions.

| Decision                   | Choice                                  | Rationale                                       |
| -------------------------- | --------------------------------------- | ----------------------------------------------- |
| Code location              | `src/flomaster/` self-contained         | Clean upstream merges from OpenCode main        |
| State storage location     | `{project}/.flomaster/` at project root | Workflow executions are project-specific        |
| Not using `.opencode/`     | Separate `.flomaster/` directory        | `.opencode/` is for config, not runtime data    |
| Not using global XDG paths | Project-level storage                   | Different projects have different workflows     |
| Directory detection        | `Instance.worktree` (git root)          | Consistent with how OpenCode finds project root |
| Checkpoint timing          | After each step completion              | Enables crash recovery from any point           |

**Files Created/Moved**:

- `src/flomaster/` - All FloMaster code moved here
- `src/flomaster/state/` - StateManager ported from prototype
- `.flomaster/executions/` - Runtime storage at project root

---

### 2026-01-04: TASK-08 Default Step Agents Complete

**Context**: Created 4 pre-built workflow step agents in `packages/opencode/.opencode/agents/`.

| Decision                    | Choice                                      | Rationale                                            |
| --------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| Agent mode                  | `subagent` for all                          | Workflow steps are programmatic, not user-facing     |
| Permission approach         | Explicit allow + `"*": deny`                | Principle of least privilege; task denied implicitly |
| research-agent permissions  | read, grep, glob, list, webfetch, websearch | Full exploration capability, no write access         |
| plan-agent write access     | `.opencode/plan/` and `.alfred/` only       | Can create plans but not modify source code          |
| implement-agent permissions | Full access (read, edit, write, bash)       | Needs to make actual code changes                    |
| review-agent bash access    | Only `git diff`, `git log`, `git show`      | Can see changes without executing arbitrary commands |
| Prompt style                | Concise, role-specific                      | Following OpenCode's built-in agent patterns         |

---

### 2026-01-04: TASK-07 Implementation Complete

**Context**: Completed proper agent integration in `agentExecutor.ts`.

| Decision                 | Choice                            | Rationale                                                              |
| ------------------------ | --------------------------------- | ---------------------------------------------------------------------- |
| Agent not found behavior | Throw error                       | Fail-fast is better for debugging; silent fallback hides config errors |
| Session permissions      | Deny `task` only                  | Prevent infinite recursion; agent's own permissions handle the rest    |
| systemPrompt handling    | Pass as `system` param            | Augments agent prompt rather than replacing it                         |
| Session cleanup          | Never delete                      | Preserve for history, future interaction                               |
| sessionID propagation    | All three types                   | Full visibility: ExecuteStepOutput → StepResult → WorkflowResult       |
| Signal location          | Use `options.signal` (existing)   | `ExecutorOptions` already has signal - don't duplicate in context      |
| Tool permissions         | Session.create() permissions only | `tools` param to SessionPrompt.prompt() is deprecated                  |
| Default agentType        | "build"                           | Most sensible default; full-access agent for general use               |
| Type definitions         | Clean types, no compat            | Project is greenfield; use correct types from the start                |

### 2026-01-04: TASK-07 Design Decisions

**Context**: Preparing to implement proper agent integration in `agentExecutor.ts`.

| Decision                 | Choice                              | Rationale                                                              |
| ------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| Agent not found behavior | Throw error                         | Fail-fast is better for debugging; silent fallback hides config errors |
| Session permissions      | Deny `task` only                    | Prevent infinite recursion; agent's own permissions handle the rest    |
| systemPrompt handling    | Pass as `system` param              | Augments agent prompt rather than replacing it                         |
| Session cleanup          | Never delete                        | Preserve for history, future interaction                               |
| sessionID propagation    | All three types                     | Full visibility: ExecuteStepOutput → StepResult → WorkflowResult       |
| Abort signal             | Use existing ExecutorOptions.signal | Reuse existing infrastructure instead of adding to context             |
| Type definitions         | Clean types, no compat              | Project is greenfield; use correct types from the start                |

### 2026-01-04: Project Philosophy Established

**Context**: Clarifying project principles for consistent decision-making.

| Principle                 | Rationale                                                 |
| ------------------------- | --------------------------------------------------------- |
| No backward compatibility | No users exist yet; project started Jan 1st 2025          |
| Clean implementation      | Target launch is end of 2026; we have time to do it right |
| Fail-fast errors          | Make misconfiguration obvious during development          |
| Follow patterns exactly   | task.ts is the reference; don't deviate without reason    |

---

## Document Maintenance

This document should be updated when:

- A new task is started or completed
- A significant design decision is made
- The architecture changes
- New patterns emerge that team members should know
- Common questions arise that indicate missing context

To append: Add new sections at the end or within relevant existing sections. Update "Last Updated" date and "Current Phase" at the top.
