# FloMaster

## What This Is

FloMaster is a workflow orchestration platform for AI-powered development tasks, built as an extension to OpenCode. It coordinates multi-step AI workflows using a DAG execution model where each step gets a fresh agent session, preventing context rot that degrades AI output quality in long sessions. Developers can execute complete features—from research to implementation to review—through declarative workflows.

## Core Value

Multi-step AI workflow execution with fresh context per step, preventing context rot while enabling coherent end-to-end task completion.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. TASK-01 through TASK-12. -->

- ✓ DAG-based workflow engine with XState v5 — TASK-01
- ✓ Parent-child session hierarchy (workflow → step sessions) — TASK-06
- ✓ Agent integration with custom agents from `.opencode/agents/` — TASK-07
- ✓ Pre-built step agents (research, plan, implement, review) — TASK-08
- ✓ Self-contained `packages/flomaster/` package structure — TASK-09
- ✓ Workflow state persistence to `.flomaster/executions/` — TASK-09
- ✓ Step configuration schema (agentType, systemPrompt) — TASK-10
- ✓ Workflow JSON file loading from `.flomaster/workflows/` — TASK-11
- ✓ Single `execution.json` state format — TASK-12
- ✓ CLI commands: `workflow run`, `list`, `inspect`, `resume` — TASK-09 Phase 3

### Active

<!-- Current scope: TASK-13 TUI Integration -->

- [ ] `/workflow` command in TUI to launch workflows without leaving TUI
- [ ] Sidebar "Workflows" panel showing active executions with step progress
- [ ] Auto-navigation between step sessions as they complete
- [ ] User intervention: type to steer agents during step execution
- [ ] Interrupt with `esc` to pause workflow (not cancel)
- [ ] `/continue` command to resume paused workflows
- [ ] Event-based state sync (TUI reflects CLI-started workflows)

### Out of Scope

<!-- Explicit boundaries for this milestone -->

- Visual workflow builder (React Flow editor) — next milestone, after functionality is solid
- Electron desktop app — end goal, but TUI is stepping stone
- Complex visualization (loop iterations, conditional branches in sidebar) — future enhancement
- Workflow definition management in TUI (create/edit) — future
- Real-time collaboration — single-user focus initially

## Context

**Brownfield project**: Built on forked OpenCode with significant infrastructure already in place.

**Architecture**:
- `packages/flomaster/` - Separate package depending on `opencode` workspace package
- `packages/opencode/` - Core CLI and TUI (upstream OpenCode fork)
- Workflow engine uses XState v5 state machines
- State persisted to `{project}/.flomaster/executions/`
- Sessions stored in `~/.opencode/storage/`

**TUI is tactical**: The TUI (SolidJS + opentui) is a stepping stone to the eventual Electron app. Building workflow interaction logic now so it can be reused later.

**CLI-first**: CLI remains the primary interface and must not break. TUI adds convenience, not replaces CLI.

**Existing TUI patterns**:
- Sidebar uses collapsible panels (MCP, LSP, Todo)
- State sync via SSE events to `/event` endpoint
- Dialog system for command interactions
- Slash commands trigger UI actions

## Constraints

- **TUI Framework**: SolidJS + opentui — can't switch frameworks
- **CLI Compatibility**: All existing CLI commands must keep working
- **Package Separation**: FloMaster stays in `packages/flomaster/`, imports from `opencode` package
- **Event Performance**: TUI batches events at 16ms (60fps) — workflow events must follow this pattern
- **No Breaking OpenCode**: Changes to `packages/opencode/` must be minimal and non-breaking

## Key Decisions

<!-- Decisions from project history + this initialization -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork OpenCode (not SDK) | Direct API access, no HTTP overhead, single process | ✓ Good |
| Self-contained `packages/flomaster/` | Clean upstream merges from OpenCode | ✓ Good |
| Parent-child session model | TUI visibility, context isolation, mirrors task.ts pattern | ✓ Good |
| Sessions never deleted | Preserve for history, future interaction, debugging | ✓ Good |
| XState v5 for orchestration | Built-in persistence, TypeScript-first, async actors | ✓ Good |
| Deny `task` permission on step agents | Prevent infinite recursion (workflow → task → workflow) | ✓ Good |
| Single execution.json | No duplication, atomic writes, simpler recovery | ✓ Good |
| TUI before Electron | Build interaction logic now, reuse for Electron later | — Pending |

---
*Last updated: 2026-01-08 after project initialization*
