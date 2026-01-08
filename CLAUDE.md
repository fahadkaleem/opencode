# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FloMaster** is a workflow orchestration system built on top of OpenCode. It coordinates multi-step AI tasks using a DAG (Directed Acyclic Graph) execution model, preventing context overflow by giving each workflow step a fresh agent session.

FloMaster inherits all of OpenCode's capabilities:

- Multiple LLM providers (Claude, OpenAI, Google, local models)
- TUI (Terminal UI) and desktop app
- Tool system (bash, edit, read, grep, glob, etc.)
- LSP integration

And adds:

- **Workflow orchestration** - DAG-based multi-step task execution
- **Step types** - Agent, Conditional, Loop, SubFlow, Input/Output
- **Context isolation** - Each step gets a fresh session (prevents context rot)
- **Parent-child sessions** - Workflow steps appear as child sessions in the TUI

## CLI

The project has two CLIs:

- **opencode** - Original OpenCode CLI (with flomaster branding)
- **flomaster** - Standalone FloMaster workflow CLI

```bash
# Development - OpenCode CLI (from packages/opencode directory)
bun dev run "Hello"              # All original OpenCode commands
bun dev mcp list

# Development - FloMaster CLI (from packages/flomaster directory)
cd packages/flomaster
bun run src/cli/index.ts workflow run "Custom prompt"
bun run src/cli/index.ts workflow list
bun run src/cli/index.ts workflow inspect <execution-id>

# After installing
flomaster workflow run
flomaster workflow list
opencode run "Hello"
```

## Development Commands

```bash
# Install dependencies
bun install

# Run OpenCode dev server (from packages/opencode)
bun dev

# Run FloMaster CLI (from packages/flomaster)
cd packages/flomaster && bun run src/cli/index.ts workflow run "prompt"
cd packages/flomaster && bun run src/cli/index.ts workflow list

# Run against a specific directory
bun dev <directory>

# Type checking (uses turbo)
bun turbo typecheck

# Run tests
cd packages/opencode && bun test     # OpenCode tests
cd packages/flomaster && bun test    # FloMaster tests (372 tests)

# Run a single test file
cd packages/flomaster && bun test src/orchestrator/engine/factory.test.ts

# Build standalone executable
./packages/opencode/script/build.ts --single

# Regenerate SDK after API changes
./script/generate.ts
```

## Architecture

### Monorepo Structure (Bun workspaces with Turbo)

- **packages/flomaster** - **FloMaster workflow orchestration (separate package)**
  - `src/cli/` - Standalone FloMaster CLI
    - `index.ts` - CLI entry point
    - `workflow.ts` - Workflow commands (run, list, inspect, resume)
  - `src/orchestrator/` - DAG execution engine
    - `engine/` - WorkflowEngine, factory
    - `machine/` - XState v5 state machine
    - `parser/` - Workflow JSON parser
    - `registry/executors/` - Step type implementations (agentExecutor, loopExecutor, etc.)
    - `workflows/` - Built-in workflow definitions (test, research, sdlc)
  - `src/state/` - Workflow state persistence (StateManager)
  - `src/index.ts` - Public exports
- **packages/opencode** - Core CLI and server (upstream OpenCode)
  - `src/cli/cmd/` - CLI commands (run, serve, auth, mcp, etc.)
  - `src/cli/cmd/tui/` - TUI built with SolidJS + [opentui](https://github.com/sst/opentui)
  - `src/server/server.ts` - Hono-based HTTP/WebSocket API server
  - `src/session/` - Conversation session management and message processing
  - `src/agent/agent.ts` - Agent definitions (build, plan, explore, general)
  - `src/provider/` - LLM provider integrations (anthropic, openai, google, bedrock, etc.)
  - `src/tool/` - Agent tools (bash, edit, read, grep, glob, websearch, etc.)
  - `src/mcp/` - Model Context Protocol server support
  - `src/lsp/` - Language Server Protocol integration
- **packages/plugin** - Plugin SDK (`@opencode-ai/plugin`)
- **packages/sdk/js** - TypeScript SDK (`@opencode-ai/sdk`)
- **packages/desktop** - Tauri desktop app
- **packages/web** - Marketing website
- **packages/docs** - Documentation (Mintlify)
- **packages/console** - Web console components

### FloMaster Architecture

FloMaster is a **separate package** (`packages/flomaster/`) that depends on `opencode` as a workspace dependency. This enables clean upstream merges from OpenCode without conflicts:

```
packages/flomaster/
├── bin/
│   └── flomaster            # CLI binary entry point
├── src/
│   ├── cli/
│   │   ├── index.ts         # CLI entry point (standalone)
│   │   └── workflow.ts      # Workflow commands (run, list, inspect, resume)
│   ├── orchestrator/
│   │   ├── engine/          # Workflow execution engine
│   │   │   ├── workflowEngine.ts    # Main orchestrator class
│   │   │   └── factory.ts           # Engine creation with StateManager
│   │   ├── machine/         # XState v5 state machine
│   │   │   ├── workflowMachine.ts   # State machine definition
│   │   │   ├── actions.ts           # State actions
│   │   │   └── guards.ts            # Transition guards
│   │   ├── parser/          # Workflow JSON parser
│   │   ├── registry/        # Step executor registry
│   │   │   └── executors/       # Step type implementations
│   │   │       └── agentExecutor.ts     # AI agent steps (key file)
│   │   └── workflows/       # Built-in workflow definitions
│   │       ├── test-workflow.ts
│   │       ├── research-workflow.ts
│   │       └── sdlc-workflow.ts     # Multi-step SDLC workflow
│   ├── state/               # Workflow state persistence
│   │   ├── stateManager.ts  # State persistence manager
│   │   ├── types.ts         # State types and enums
│   │   └── defaults.ts      # Storage constants
│   └── index.ts             # Public exports
├── package.json             # @opencode-ai/flomaster
└── tsconfig.json
```

**Key Design**: FloMaster imports from `opencode` package (e.g., `import { Session } from "opencode/session/index"`) rather than relative paths. This keeps the packages decoupled.

### State Storage

**CRITICAL: `.flomaster/` MUST be at the project/repo root, NEVER inside packages.**

- `Instance.worktree` returns the git repo root - use this for `.flomaster/` paths
- NEVER use `process.cwd()` or relative paths for `.flomaster/` - it may resolve to `packages/flomaster/`
- All execution state, logs, and workflows live at `{repo-root}/.flomaster/`

Workflow execution state is stored at the **project root** in `.flomaster/`:

```
{project}/.flomaster/
├── workflows/                    # Workflow definitions (JSON)
└── executions/
    └── {execution-id}/
        ├── execution.json        # Single consolidated file with all state
        └── logs.txt              # Execution logs
```

The `execution.json` format (v1.0):

```json
{
  "id": "exec-1234567890-abc123",
  "workflowName": "sdlc",
  "createdAt": "2026-01-07T22:41:39.816Z",
  "updatedAt": "2026-01-07T22:45:49.123Z",
  "status": "COMPLETED",
  "steps": {
    "input": { "status": "COMPLETED", "outputs": { "prompt": "..." } },
    "research": { "status": "COMPLETED", "sessionId": "ses_...", "outputs": { "response": "..." } },
    "plan": { "status": "COMPLETED", "sessionId": "ses_...", "outputs": { "response": "..." } }
  },
  "version": "1.0",
  "recoverable": true
}

### Session Integration Model

FloMaster follows the parent-child session pattern from `packages/opencode/src/tool/task.ts`:

```typescript
// Workflow creates a parent session
const workflowSession = await Session.create({
  title: `Workflow: ${taskId}`,
})

// Each step creates a child session
const stepSession = await Session.create({
  parentID: workflowSession.id,
  title: `Step: ${stepName}`,
})
```

This means:

- Workflow sessions appear in the TUI sidebar
- Step sessions appear nested under the workflow
- Each step has isolated context (prevents context rot)

### Client-Server Architecture

FloMaster uses a client-server model where the server exposes an HTTP API (Hono) with SSE for events. The TUI is one frontend; the desktop app and mobile apps are others. Server listens on port 4096 by default.

Key server routes:

- `/session` - Session CRUD and messaging
- `/provider` - LLM provider management
- `/mcp` - MCP server management
- `/event` - SSE event stream

### Agents

Built-in agents with different capabilities:

- **build** - Full access for development work (default)
- **plan** - Read-only for analysis and planning
- **explore** - Codebase exploration (read-only tools)
- **general** - Subagent for complex multi-step tasks

### Tools System

Tools are defined in `packages/opencode/src/tool/` with `.ts` implementation and `.txt` prompt files. Tools include: bash, edit, read, write, grep, glob, websearch, webfetch, lsp, task.

### Permission System

Permissions control tool access per agent. Defined in `src/permission/next.ts`. Agents have permission rulesets (allow/deny/ask) for tools and paths.

## Code Style

Follow STYLE_GUIDE.md:

- Keep logic in single functions unless reusable
- No unnecessary destructuring
- Avoid `else` statements
- Prefer `.catch()` over `try/catch`
- Avoid `any` type
- Avoid `let` - prefer immutable patterns
- Single-word variable names when descriptive
- Use Bun APIs (e.g., `Bun.file()`)

## Verification Philosophy

**Typechecks are the bare minimum, not the finish line.**

Passing `bun turbo typecheck` only proves the code compiles. It does NOT prove:

- The feature actually works end-to-end
- Runtime behavior is correct
- Integration points connect properly
- Config formats are valid
- Default values make sense

### Verification Hierarchy

| Level           | Command                | What It Proves               |
| --------------- | ---------------------- | ---------------------------- |
| 1. Typecheck    | `bun turbo typecheck`  | Code compiles (bare minimum) |
| 2. Unit Tests   | `bun test src/path/`   | Individual functions work    |
| 3. **E2E Test** | `bun dev workflow run` | **Actually works for real**  |

### Always Run E2E Tests

After implementing any orchestrator or agent changes:

```bash
# From packages/flomaster directory:
cd packages/flomaster

# Test default workflow (uses "build" agent)
bun run src/cli/index.ts workflow run "What is 2+2?"

# Test custom agent workflow (uses custom agent from .opencode/agents/)
bun run src/cli/index.ts workflow run --workflow research "What is 2+2?"

# Test multi-step SDLC workflow (research → plan → implement → review)
bun run src/cli/index.ts workflow run --workflow sdlc "Add a hello world function"

# Dry-run (no API calls, validates structure)
bun run src/cli/index.ts workflow run --workflow sdlc --dry-run "Test task"

# List and inspect executions
bun run src/cli/index.ts workflow list
bun run src/cli/index.ts workflow inspect <execution-id>

# Verify state files created
ls .flomaster/executions/
```

### Lesson Learned (TASK-07)

During TASK-07, typecheck passed but E2E test revealed:

- Parser defaulted `agentType` to `"default"` (non-existent agent)
- Should have been `"build"` (the actual default agent)

This bug was invisible to typechecks but immediately caught by running the actual workflow.

**Rule: If you haven't run `bun run src/cli/index.ts workflow run` (from packages/flomaster) and seen it complete successfully, you haven't verified your changes.**

## Testing

Tests use Bun's test runner:

- **OpenCode tests**: `packages/opencode/test/`
- **FloMaster tests**: `packages/flomaster/src/` (co-located with source, 372 tests)

```bash
# Run all FloMaster tests
cd packages/flomaster && bun test

# Run specific test file
cd packages/flomaster && bun test src/orchestrator/engine/factory.test.ts

# Run OpenCode tests
cd packages/opencode && bun test
```

Use `test/fixture/fixture.ts` for creating temporary test directories with git initialization and config setup.

```typescript
await using dir = await tmpdir({ git: true, config: { ... } })
```

## Task Files

Implementation tasks are tracked in `.alfred/tasks/`:

| Task    | Description                                             | Status                 |
| ------- | ------------------------------------------------------- | ---------------------- |
| TASK-01 | Copy orchestrator files + add xstate                    | ✅ Complete            |
| TASK-02 | Fix imports (logging)                                   | ✅ Complete            |
| TASK-03 | Initial session integration                             | ✅ Complete            |
| TASK-04 | Rename CLI to flomaster + workflow command              | ✅ Complete            |
| TASK-06 | Refined session integration                             | ✅ Complete            |
| TASK-07 | Proper agent integration                                | ✅ Complete            |
| TASK-08 | Default step agents (research, plan, implement, review) | ✅ Complete            |
| TASK-09 | Self-contained flomaster module + state persistence     | ✅ Phases 1-2 Complete |
| TASK-12 | Consolidate state to single execution.json              | ✅ Complete            |

Read task files before implementing: `.alfred/tasks/TASK-XX/task.md`

## Key Directories

| Directory                 | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `/.opencode/agent/`       | Custom agents (research-agent, plan-agent, etc.) |
| `/.flomaster/executions/` | Workflow state persistence (project-specific)    |
| `.alfred/tasks/`          | Task specifications and plans                    |
