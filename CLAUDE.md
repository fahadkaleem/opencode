# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCode is an open-source AI coding agent with a TUI (Terminal UI), desktop app, and client-server architecture. It supports multiple LLM providers (Claude, OpenAI, Google, local models) and features LSP integration.

## Development Commands

```bash
# Install dependencies
bun install

# Run dev server (runs in packages/opencode by default)
bun dev

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

- **packages/opencode** - Core CLI and server
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

### Client-Server Architecture

OpenCode uses a client-server model where the server exposes an HTTP API (Hono) with SSE for events. The TUI is one frontend; the desktop app and mobile apps are others. Server listens on port 4096 by default.

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
