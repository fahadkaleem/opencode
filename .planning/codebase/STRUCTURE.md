# Codebase Structure

**Analysis Date:** 2026-01-08

## Directory Layout

```
flomaster-opencode/
├── packages/               # Bun workspaces (monorepo)
│   ├── opencode/          # Core CLI + Server (main package)
│   ├── desktop/           # Tauri desktop app
│   ├── web/               # Marketing website
│   ├── app/               # SPA application
│   ├── ui/                # Shared UI components
│   ├── console/           # Web console
│   ├── sdk/js/            # TypeScript SDK
│   ├── plugin/            # Plugin SDK
│   └── docs/              # Documentation (Mintlify)
├── infra/                 # Infrastructure as Code (SST)
├── .claude/               # AI coding rules
├── .opencode/             # Local OpenCode config
├── .flomaster/            # Workflow state (at repo root!)
├── .alfred/tasks/         # Implementation task tracking
├── package.json           # Root workspace config
├── turbo.json             # Turbo build config
└── CLAUDE.md              # AI instructions
```

## Directory Purposes

**packages/opencode/ (MAIN PACKAGE)**
- Purpose: Core CLI, server, session management, tools
- Contains: TypeScript source, tests, CLI entry points
- Key files: `src/index.ts` (entry), `src/server/server.ts`
- Subdirectories: cli/, server/, session/, tool/, provider/, flomaster/

**packages/opencode/src/flomaster/**
- Purpose: Workflow orchestration module (FloMaster)
- Contains: Engine, state machine, step executors, CLI
- Key files: `orchestrator/engine/workflowEngine.ts`, `state/stateManager.ts`
- Subdirectories: cli/, orchestrator/, state/, server/

**packages/opencode/src/cli/cmd/**
- Purpose: CLI command implementations
- Contains: yargs command definitions
- Key files: `run.ts`, `serve.ts`, `tui/app.tsx`
- Subdirectories: tui/ (terminal UI components)

**packages/opencode/src/tool/**
- Purpose: Agent tools (capabilities)
- Contains: Tool implementations (.ts) + prompts (.txt)
- Key files: `bash.ts`, `edit.ts`, `read.ts`, `grep.ts`

**packages/opencode/src/provider/**
- Purpose: LLM provider integrations
- Contains: Provider SDK wrappers, auth, model selection
- Key files: `provider.ts`, `auth.ts`, `models.ts`

**packages/opencode/src/session/**
- Purpose: Conversation session management
- Contains: Session CRUD, messaging, LLM calling
- Key files: `index.ts`, `message-v2.ts`, `prompt.ts`

**.flomaster/ (Project Root)**
- Purpose: Workflow state persistence
- Contains: Execution state, logs
- Key files: `executions/{id}/execution.json`
- Note: MUST be at git repo root, never inside packages/

## Key File Locations

**Entry Points:**
- `packages/opencode/src/index.ts` - CLI entry (yargs)
- `packages/opencode/src/server/server.ts` - HTTP server
- `packages/opencode/src/cli/cmd/tui/app.tsx` - TUI entry
- `packages/opencode/src/flomaster/cli/workflow.ts` - FloMaster CLI

**Configuration:**
- `tsconfig.json` - TypeScript config
- `turbo.json` - Build orchestration
- `package.json` - Root workspace
- `opencode.json` - Project-level OpenCode config

**Core Logic:**
- `packages/opencode/src/session/` - Session management
- `packages/opencode/src/tool/` - Agent tools
- `packages/opencode/src/provider/` - LLM providers
- `packages/opencode/src/flomaster/orchestrator/` - Workflow engine

**Testing:**
- `packages/opencode/test/` - OpenCode tests
- `packages/opencode/src/**/*.test.ts` - Co-located FloMaster tests
- `test/fixture/fixture.ts` - Shared test utilities

**Documentation:**
- `CLAUDE.md` - AI coding instructions
- `.claude/rules/` - Additional coding rules
- `packages/docs/` - User documentation

## Naming Conventions

**Files:**
- kebab-case.ts for modules (`tool-registry.ts`, `state-manager.ts`)
- PascalCase.tsx for React/Solid components (`ToolDialog.tsx`)
- *.test.ts for test files (co-located with source)
- *.txt for tool prompts (`bash.txt`)

**Directories:**
- kebab-case for all directories
- Plural for collections (`tools/`, `providers/`, `executors/`)
- index.ts for barrel exports

**Special Patterns:**
- `{tool}.ts` + `{tool}.txt` pairs for tools
- `execution.json` for workflow state
- `.flomaster/` at project root only

## Where to Add New Code

**New CLI Command:**
- Definition: `packages/opencode/src/cli/cmd/{command}.ts`
- Registration: `packages/opencode/src/index.ts`
- Tests: `packages/opencode/test/cli/{command}.test.ts`

**New Tool:**
- Implementation: `packages/opencode/src/tool/{tool}.ts`
- Prompt: `packages/opencode/src/tool/{tool}.txt`
- Registration: `packages/opencode/src/tool/registry.ts`

**New Provider:**
- Implementation: `packages/opencode/src/provider/sdk/{provider}/`
- Registration: `packages/opencode/src/provider/provider.ts`

**New Step Executor:**
- Implementation: `packages/opencode/src/flomaster/orchestrator/registry/executors/{type}Executor.ts`
- Registration: `packages/opencode/src/flomaster/orchestrator/registry/stepExecutorRegistry.ts`

**New Workflow:**
- Definition: `.flomaster/workflows/{name}.json`
- Or built-in: `packages/opencode/src/flomaster/orchestrator/workflows/{name}-workflow.ts`

**Utilities:**
- Shared helpers: `packages/opencode/src/util/`
- FloMaster utils: `packages/opencode/src/flomaster/orchestrator/utils/`
- Type definitions: Co-located in `types.ts` files

## Special Directories

**.flomaster/**
- Purpose: Workflow execution state (per-project)
- Source: Created at runtime by StateManager
- Committed: No (gitignored)
- Location: Always at git repo root (Instance.worktree)

**.opencode/**
- Purpose: Local project configuration
- Source: User-created or auto-generated
- Committed: Optional (project-specific settings)

**packages/opencode/test/fixture/**
- Purpose: Test utilities and fixtures
- Source: Shared test helpers
- Committed: Yes

---

*Structure analysis: 2026-01-08*
*Update when directory structure changes*
