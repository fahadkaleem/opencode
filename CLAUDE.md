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

The CLI is named `flomaster` (not `opencode`):

```bash
# Development (from packages/opencode directory)
bun dev workflow run
bun dev workflow run "Custom prompt"
bun dev run "Hello"              # All original commands still work

# After installing
flomaster workflow run
flomaster run "Hello"
flomaster mcp list
```

## Development Commands

```bash
# Install dependencies
bun install

# Run dev server (runs in packages/opencode by default)
bun dev

# Run workflow command
bun dev workflow run

# Run against a specific directory
bun dev <directory>

# Run against repo root
bun dev .

# Type checking (uses turbo)
bun turbo typecheck

# Run tests (in packages/opencode)
cd packages/opencode && bun test

# Run a single test file
cd packages/opencode && bun test test/tool/bash.test.ts

# Build standalone executable
./packages/opencode/script/build.ts --single

# Regenerate SDK after API changes
./script/generate.ts
```

## Architecture

### Monorepo Structure (Bun workspaces with Turbo)

- **packages/opencode** - Core CLI, server, and orchestrator
  - `src/cli/cmd/` - CLI commands (run, serve, auth, mcp, workflow, etc.)
  - `src/cli/cmd/tui/` - TUI built with SolidJS + [opentui](https://github.com/sst/opentui)
  - `src/cli/cmd/workflow.ts` - Workflow orchestration command
  - `src/server/server.ts` - Hono-based HTTP/WebSocket API server
  - `src/session/` - Conversation session management and message processing
  - `src/agent/agent.ts` - Agent definitions (build, plan, explore, general)
  - `src/provider/` - LLM provider integrations (anthropic, openai, google, bedrock, etc.)
  - `src/tool/` - Agent tools (bash, edit, read, grep, glob, websearch, etc.)
  - `src/orchestrator/` - **FloMaster workflow orchestration engine**
  - `src/mcp/` - Model Context Protocol server support
  - `src/lsp/` - Language Server Protocol integration
- **packages/plugin** - Plugin SDK (`@opencode-ai/plugin`)
- **packages/sdk/js** - TypeScript SDK (`@opencode-ai/sdk`)
- **packages/desktop** - Tauri desktop app
- **packages/web** - Marketing website
- **packages/docs** - Documentation (Mintlify)
- **packages/console** - Web console components

### Orchestrator Architecture

The orchestrator (`src/orchestrator/`) is the core of FloMaster:

```
orchestrator/
├── engine/              # Workflow execution engine
│   ├── workflowEngine.ts    # Main orchestrator class
│   └── factory.ts           # Engine creation
├── machine/             # XState v5 state machine
│   ├── workflowMachine.ts   # State machine definition
│   ├── actions.ts           # State actions
│   └── guards.ts            # Transition guards
├── parser/              # Workflow JSON parser
│   ├── workflowParser.ts    # React Flow JSON → DAG
│   └── topology.ts          # Topological sort, cycle detection
├── registry/            # Step executor registry
│   ├── stepExecutorRegistry.ts
│   └── executors/           # Step type implementations
│       ├── agentExecutor.ts     # AI agent steps
│       ├── conditionalExecutor.ts
│       ├── loopExecutor.ts
│       └── subflowExecutor.ts
├── workflows/           # Workflow definitions
│   └── test-workflow.ts     # Test workflow
└── utils/               # Utilities
    └── contextInterpolator.ts   # {{variable}} substitution
```

### Session Integration Model

FloMaster follows the parent-child session pattern from `src/tool/task.ts`:

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

## Testing

Tests use Bun's test runner in `packages/opencode/test/`. Use `test/fixture/fixture.ts` for creating temporary test directories with git initialization and config setup.

```typescript
await using dir = await tmpdir({ git: true, config: { ... } })
```

## Task Files

Implementation tasks are tracked in `.alfred/tasks/`:

| Task | Description | Status |
|------|-------------|--------|
| TASK-01 | Copy orchestrator files + add xstate | ✅ Complete |
| TASK-02 | Fix imports (logging) | ✅ Complete |
| TASK-03 | Initial session integration | ✅ Complete |
| TASK-04 | Rename CLI to flomaster + workflow command | ⏳ Ready |
| TASK-06 | Refined session integration | ✅ Complete |

Read task files before implementing: `.alfred/tasks/TASK-XX/task.md`
