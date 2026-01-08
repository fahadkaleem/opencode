# Technology Stack

**Analysis Date:** 2026-01-08

## Languages

**Primary:**
- TypeScript 5.8.2 - All application code, strict type checking

**Secondary:**
- JavaScript - Build scripts, config files

## Runtime

**Environment:**
- Bun 1.3.5 (bundler, transpiler, package manager, test runner)
- Full Node.js API compatibility (node: protocol imports)
- No browser runtime (CLI + server only)

**Package Manager:**
- Bun workspaces (monorepo structure)
- Lockfile: `bun.lock` present

## Frameworks

**Core:**
- Hono 4.10.7 - HTTP server framework with OpenAPI generation
- SolidJS 1.9.10 - Terminal UI (TUI) rendering
- XState 5.19.0 - State machine for workflow orchestration

**Testing:**
- Bun test (built-in) - Unit tests, fast parallel execution
- No E2E framework (manual CLI testing)

**Build/Dev:**
- Turbo 2.5.6 - Task orchestration and build caching
- Vite 7.1.4 - Frontend bundler (for web packages)
- TypeScript 5.8.2 - Compilation to JavaScript

## Key Dependencies

**Critical:**
- `@ai-sdk/*` ecosystem (v1-3.0) - LLM provider integrations (Vercel AI SDK)
- `zod` 4.1.8 - Schema validation and type inference
- `xstate` 5.19.0 - State machine for workflow DAG execution
- `@modelcontextprotocol/sdk` 1.15.1 - MCP client for tool extensions

**Infrastructure:**
- `hono` 4.10.7 - HTTP routing with WebSocket support
- `bun-pty` 0.4.4 - Pseudo-terminal for shell execution
- `remeda` 2.26.0 - Functional utility library (immutable patterns)
- `ulid` 3.0.1 - Sortable unique identifiers

**UI:**
- `opentui` 0.1.69 - Terminal UI components (@opentui/core, @opentui/solid)
- `shiki` 3.20.0 - Syntax highlighting (200+ languages)
- `marked` 17.0.1 - Markdown parsing

## Configuration

**Environment:**
- Environment variables for API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- `opencode.json` or `opencode.jsonc` for project config
- `.env.local` files (gitignored) for secrets

**Build:**
- `tsconfig.json` - TypeScript compiler options
- `turbo.json` - Turbo build orchestration
- `package.json` scripts for dev commands

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Bun)
- Bun 1.3.5+ required
- No external dependencies (Docker not required)

**Production:**
- Distributed as CLI tools (`opencode`, `flomaster`)
- Runs on user's Bun installation
- Server listens on port 4096 (configurable)

---

*Stack analysis: 2026-01-08*
*Update after major dependency changes*
