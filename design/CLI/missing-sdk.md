# SDK Gap Analysis: Missing Features for Ink CLI

> Analysis of current `@flomaster/core` client implementation vs full OpenCode SDK capabilities.
> Use this document to track what needs to be implemented before/during Ink CLI development.

---

## Current Implementation Status

### What's Implemented (Ready for Ink)

| Feature | Location | Status | Notes |
|---------|----------|--------|-------|
| Client Initialization | `client/client.ts` | Done | Server connection, health check |
| Session CRUD | `client/client.ts` | Done | create, get, list, delete |
| Chat (prompt/response) | `client/session.ts` | Done | Full request/response cycle |
| Streaming (SSE) | `client/session.ts` | Done | Real-time chunks via async generator |
| Context Injection | `client/session.ts` | Done | `noReply: true` mode |
| Session State | `client/session.ts` | Done | active/streaming/closed |
| Abort/Cancel | `client/session.ts` | Done | AbortSignal support |
| Tool Calls | `client/session.ts` | Done | Start/end with state tracking |
| Extended Thinking | `client/session.ts` | Done | Reasoning parts parsed |
| Message History | `client/session.ts` | Done | `getMessages()` |
| Error Handling | `client/types.ts` | Done | Custom error classes |

### Stream Chunk Types Supported

```typescript
type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'reasoning'; content: string }
  | { type: 'tool_start'; toolCallId: string; toolName: string; args: unknown }
  | { type: 'tool_end'; toolCallId: string; toolName: string; result: unknown; state: ToolState }
  | { type: 'done'; response: ChatResponse }
  | { type: 'error'; error: Error };
```

---

## Missing Features (Need Implementation)

### Priority 1: Essential for Good UX

#### 1.1 Provider/Model Listing

**SDK Method:** `config.providers()`

**Why Needed:** Users need to see available models and select one.

**Response Shape:**
```typescript
{
  providers: Provider[];  // List of providers (anthropic, openai, etc.)
  default: {
    [providerName: string]: string;  // Default model per provider
  }
}

type Provider = {
  id: string;
  name: string;
  models: Model[];
}

type Model = {
  id: string;
  name: string;
  // ... capabilities
}
```

**Implementation Location:** Add to `client/client.ts` or create `client/config.ts`

**Suggested API:**
```typescript
// On Client class
client.getProviders(): Promise<Provider[]>
client.getDefaultModel(providerId: string): Promise<string>
```

---

#### 1.2 Project Information

**SDK Methods:** `project.list()`, `project.current()`

**Why Needed:** Show user which project context is active.

**Response Shape:**
```typescript
type Project = {
  id: string;
  path: string;
  name: string;
  // ... other metadata
}
```

**Suggested API:**
```typescript
client.project.list(): Promise<Project[]>
client.project.current(): Promise<Project>
```

---

### Priority 2: File Operations (Code Context)

#### 2.1 File Reading

**SDK Method:** `file.read({ query: { path: string } })`

**Why Needed:** Display file contents in CLI, provide context to conversations.

**Response Shape:**
```typescript
{
  type: 'raw' | 'patch';
  content: string;
}
```

**Suggested API:**
```typescript
client.file.read(path: string): Promise<{ type: string; content: string }>
```

---

#### 2.2 File Search

**SDK Method:** `find.files({ query: { query: string } })`

**Why Needed:** Find files by name/pattern.

**Response:** `string[]` (file paths)

**Suggested API:**
```typescript
client.file.find(pattern: string): Promise<string[]>
```

---

#### 2.3 Text Search (Grep)

**SDK Method:** `find.text({ query: { pattern: string } })`

**Why Needed:** Search code content.

**Response Shape:**
```typescript
type TextMatch = {
  path: string;
  lines: string;
  line_number: number;
  absolute_offset: number;
  submatches: SubMatch[];
}
```

**Suggested API:**
```typescript
client.file.searchText(pattern: string): Promise<TextMatch[]>
```

---

#### 2.4 File Status (Git)

**SDK Method:** `file.status({ query?: {} })`

**Why Needed:** Show modified/staged files.

**Response:** `File[]` with status information

**Suggested API:**
```typescript
client.file.status(): Promise<FileStatus[]>
```

---

### Priority 3: LSP/Symbol Operations

#### 3.1 Symbol Search

**SDK Method:** `find.symbols({ query: { query: string } })`

**Why Needed:** Find functions, classes, variables by name.

**Response Shape:**
```typescript
type Symbol = {
  name: string;
  kind: SymbolKind;  // function, class, variable, etc.
  location: {
    path: string;
    range: Range;
  }
}
```

**Suggested API:**
```typescript
client.symbols.find(query: string): Promise<Symbol[]>
```

**Note:** This is how you access LSP functionality - the server handles LSP internally and exposes results via this API.

---

### Priority 4: Authentication

#### 4.1 Set Provider Auth

**SDK Method:** `auth.set({ path: { id: providerId }, body: { type: 'api', key: string } })`

**Why Needed:** Allow users to set API keys from CLI.

**Suggested API:**
```typescript
client.auth.setApiKey(providerId: string, apiKey: string): Promise<boolean>
```

---

### Priority 5: App/Global Operations

#### 5.1 Health Check

**SDK Method:** `global.health()`

**Why Needed:** Verify server is running, get version.

**Response:** `{ healthy: boolean; version: string }`

**Current Status:** Partially implemented in client initialization, but not exposed as public API.

**Suggested API:**
```typescript
client.health(): Promise<{ healthy: boolean; version: string }>
```

---

#### 5.2 Available Agents

**SDK Method:** `app.agents()`

**Why Needed:** List available AI agents/personas.

**Response:** `Agent[]`

**Suggested API:**
```typescript
client.getAgents(): Promise<Agent[]>
```

---

### Not Needed for CLI

These SDK features are NOT needed for your Ink CLI:

| Feature | SDK Method | Why Not Needed |
|---------|------------|----------------|
| TUI Control | `tui.*` | You're building your own TUI |
| App Logging | `app.log()` | Internal server logging |
| Session Sharing | `session.share()` | Future feature |
| Session Init | `session.init()` | Creates AGENTS.md, optional |

---

## Implementation Plan

### Phase 1: Start Building Ink (Use What Exists)

The current implementation is sufficient to build:
- Session selection/creation UI
- Chat interface with streaming
- Tool call visualization
- Message history view

```typescript
// This works TODAY
const client = await createClient({ baseUrl: 'http://localhost:4096' });
await client.initialize();

const session = await client.session.create({ title: 'CLI Session' });

for await (const chunk of session.stream('Hello!')) {
  // Handle text, tools, done, error
}
```

### Phase 2: Add Provider Selection

Wrap `config.providers()` so users can:
- See available providers and models
- Select model for session

### Phase 3: Add File Operations

Wrap file operations for:
- Viewing files mentioned in conversation
- Searching codebase
- Showing git status

### Phase 4: Add Symbol Search

Wrap `find.symbols()` for code navigation (LSP-powered).

---

## Accessing Raw SDK (Workaround)

Until features are wrapped, access them directly:

```typescript
const sdk = client.getSdkClient();

// File operations
const content = await sdk.file.read({ query: { path: 'src/index.ts' } });
const files = await sdk.find.files({ query: { query: '*.ts' } });
const symbols = await sdk.find.symbols({ query: { query: 'MyFunction' } });
const textMatches = await sdk.find.text({ query: { pattern: 'TODO' } });

// Config
const { data } = await sdk.config.providers();
const providers = data.providers;

// Project
const { data: projects } = await sdk.project.list();
const { data: current } = await sdk.project.current();
```

---

## File Locations

| File | Purpose |
|------|---------|
| `packages/core/src/client/client.ts` | Main Client class |
| `packages/core/src/client/session.ts` | Session implementation |
| `packages/core/src/client/types.ts` | Type definitions |
| `packages/core/src/client/defaults.ts` | Default constants |
| `packages/core/src/client/index.ts` | Barrel exports |

---

## LSP Notes

**Important:** The OpenCode SDK does NOT expose direct LSP client access. Instead:

1. The server spawns LSP servers internally (TypeScript, Python/pyright, etc.)
2. It communicates with them via `vscode-jsonrpc`
3. Results are exposed through `find.symbols()` API

Features available via server's internal LSP:
- Document diagnostics (errors/warnings)
- Hover information
- Go to definition
- Find references
- Workspace symbols (exposed via `find.symbols()`)
- Call hierarchy

For your CLI, use `find.symbols()` for code navigation - that's your LSP access point.

---

## Questions to Resolve

1. **Session Persistence:** Does the SDK persist sessions across server restarts?
2. **Multi-Project:** How to handle multiple project directories?
3. **Tool Permissions:** How to handle tool permission prompts in CLI?
4. **Image Support:** Does `Part` support image attachments for vision models?

---

*Last Updated: December 31, 2024*
