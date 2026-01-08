# Architecture

**Analysis Date:** 2026-01-08

## Pattern Overview

**Overall:** Hybrid Monolith + Workflow Orchestration Platform

**Key Characteristics:**
- Client-server architecture with HTTP API and WebSocket
- Event-driven state management via bus pattern
- DAG-based workflow execution with isolated sessions
- Plugin-extensible tool and provider system

## Layers

**CLI Layer:**
- Purpose: Parse user input and route to appropriate handler
- Contains: Command definitions (yargs), argument parsing, help text
- Location: `packages/opencode/src/cli/cmd/`
- Depends on: Server routes, session management
- Used by: Entry point (`packages/opencode/src/index.ts`)

**Server Layer:**
- Purpose: HTTP/WebSocket API for frontends
- Contains: Route handlers, SSE streaming, validation
- Location: `packages/opencode/src/server/server.ts`
- Depends on: Session, Provider, FloMaster modules
- Used by: TUI, Desktop app, external clients

**Session Layer:**
- Purpose: Conversation management and message processing
- Contains: Session CRUD, message protocol, LLM calling
- Location: `packages/opencode/src/session/`
- Depends on: Provider, Tool, Permission modules
- Used by: Server routes, FloMaster agents

**Provider Layer:**
- Purpose: LLM provider integrations
- Contains: 18+ provider SDKs, model selection, auth
- Location: `packages/opencode/src/provider/`
- Depends on: Config, Auth modules
- Used by: Session prompt execution

**Tool Layer:**
- Purpose: Agent capabilities (bash, edit, read, grep, etc.)
- Contains: Tool definitions (.ts) + prompts (.txt)
- Location: `packages/opencode/src/tool/`
- Depends on: File system, external commands
- Used by: Session message processing

**FloMaster Layer:**
- Purpose: Workflow orchestration and DAG execution
- Contains: Engine, State machine, Step executors
- Location: `packages/opencode/src/flomaster/`
- Depends on: Session (for agent steps), Storage
- Used by: CLI commands, server routes

## Data Flow

**CLI Command Execution:**

1. User runs: `opencode run "Hello"`
2. yargs parses args and flags
3. Command handler invoked (`src/cli/cmd/run.ts`)
4. TUI spawned or direct execution
5. Session created via Server API
6. LLM called with tools available
7. Tool results streamed back via SSE
8. Response rendered in TUI

**Workflow Execution (FloMaster):**

1. User runs: `flomaster workflow run --workflow sdlc "Task"`
2. WorkflowLoader loads JSON from `.flomaster/workflows/`
3. WorkflowEngine created with StateManager
4. XState actor started (idle → preparing → executing)
5. Topological sort determines step order
6. For each step:
   - Get executor from StepExecutorRegistry
   - Create child session (isolated context)
   - Execute with interpolated context
   - Store outputs in SharedContext
   - Persist state to execution.json
7. Execution completes with final status
8. Results returned to caller

**State Management:**
- File-based: All state in `.flomaster/executions/` at repo root
- Per-execution: `execution.json` contains all step states
- Lock-protected: File mutex for concurrent access
- Recoverable: Can resume from persisted state

## Key Abstractions

**Session:**
- Purpose: Encapsulate a conversation with context
- Examples: Parent workflow session, child step sessions
- Pattern: Factory (`Session.create()`) + namespace
- Location: `packages/opencode/src/session/index.ts`

**Tool:**
- Purpose: Agent capability with schema and implementation
- Examples: bash, edit, read, grep, glob, websearch
- Pattern: Definition factory (`Tool.define()`)
- Location: `packages/opencode/src/tool/`

**Provider:**
- Purpose: LLM provider integration
- Examples: anthropic, openai, google, bedrock
- Pattern: SDK wrapper with unified interface
- Location: `packages/opencode/src/provider/provider.ts`

**StepExecutor:**
- Purpose: Execute a workflow step type
- Examples: agentExecutor, loopExecutor, conditionalExecutor
- Pattern: Registry with type-safe dispatch
- Location: `packages/opencode/src/flomaster/orchestrator/registry/`

**WorkflowEngine:**
- Purpose: Orchestrate DAG execution
- Examples: Single engine per workflow run
- Pattern: XState actor + StateManager
- Location: `packages/opencode/src/flomaster/orchestrator/engine/`

## Entry Points

**CLI Entry:**
- Location: `packages/opencode/src/index.ts`
- Triggers: User runs `opencode <command>` or `flomaster <command>`
- Responsibilities: Register commands, parse args, dispatch to handlers

**Server Entry:**
- Location: `packages/opencode/src/server/server.ts`
- Triggers: `opencode serve` or implicit start
- Responsibilities: HTTP routing, WebSocket, SSE streaming

**TUI Entry:**
- Location: `packages/opencode/src/cli/cmd/tui/app.tsx`
- Triggers: Default `opencode` command
- Responsibilities: Render terminal UI, handle input

**FloMaster CLI:**
- Location: `packages/opencode/src/flomaster/cli/workflow.ts`
- Triggers: `flomaster workflow run|list|inspect`
- Responsibilities: Workflow management commands

## Error Handling

**Strategy:** Throw custom errors, catch at boundaries, log and surface

**Patterns:**
- Services throw typed errors (StepExecutionError, AgentExecutionError)
- CLI handlers catch and format for user display
- Server routes catch and return HTTP error responses
- FloMaster persists error state for recovery

**Error Types:**
- `packages/opencode/src/flomaster/orchestrator/errors.ts` - Workflow errors
- `packages/opencode/src/error/` - Core error classes

## Cross-Cutting Concerns

**Logging:**
- OpenTelemetry API with structured LogRecord
- Attributes: session.id, installation.id, interactive
- Log service: `Log.create({ service: "..." })`

**Validation:**
- Zod schemas at API boundaries
- Tool parameter validation via zod
- Workflow input/output schema validation

**Authentication:**
- Provider API keys via environment variables
- OAuth for GitHub Copilot, Vertex AI
- MCP server OAuth support

**State Persistence:**
- File-based JSON storage
- Lock manager for concurrent access
- Atomic writes (temp file + rename pattern)

---

*Architecture analysis: 2026-01-08*
*Update when major patterns change*
