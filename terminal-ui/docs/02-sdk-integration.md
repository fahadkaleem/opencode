# SDK Integration Reference: OpenCode TUI

## Overview

The OpenCode TUI integrates with the server via a generated TypeScript SDK (`@opencode-ai/sdk/v2`). The SDK provides a typed HTTP client that communicates with the server's Hono-based API. The TUI establishes a Server-Sent Events (SSE) connection for real-time event streaming and uses direct API calls for operations like session management, message sending, and permission handling.

---

## SDK Client Initialization

The SDK client is created via the `SDKProvider` context:

```typescript
// context/sdk.tsx
const sdk = createOpencodeClient({
  baseUrl: props.url,  // e.g., "http://localhost:4096"
  signal: abort.signal,
})
```

The SDK instance is wrapped in a context that also creates a global event emitter:

```typescript
const emitter = createGlobalEmitter<{
  [key in Event["type"]]: Extract<Event, { type: key }>
}>()
```

---

## Event Subscription

The SDK subscribes to server events via SSE on mount:

```typescript
const events = await sdk.event.subscribe({}, { signal: abort.signal })

for await (const event of events.stream) {
  queue.push(event)
  // Events are batched with 16ms debounce for performance
}
```

---

## SDK Types Used

### Core Data Types

```typescript
import type {
  Message,
  Agent,
  Provider,
  Session,
  Part,
  Config,
  Todo,
  Command,
  PermissionRequest,
  LspStatus,
  McpStatus,
  FormatterStatus,
  SessionStatus,
  ProviderListResponse,
  ProviderAuthMethod,
  VcsInfo,
} from "@opencode-ai/sdk/v2"
```

### Message Types

```typescript
import type {
  AssistantMessage,
  Part,
  ToolPart,
  UserMessage,
  TextPart,
  ReasoningPart,
  FilePart
} from "@opencode-ai/sdk/v2"
```

---

## Event Types and Handlers

| Event Type | Store Update |
|------------|--------------|
| `server.instance.disposed` | Triggers `bootstrap()` |
| `permission.replied` | Removes permission from store |
| `permission.asked` | Adds/updates permission in store |
| `todo.updated` | Sets `store.todo[sessionID]` |
| `session.diff` | Sets `store.session_diff[sessionID]` |
| `session.deleted` | Removes session from store |
| `session.updated` | Updates/inserts session in store |
| `session.status` | Sets `store.session_status[sessionID]` |
| `message.updated` | Updates/inserts message in store |
| `message.removed` | Removes message from store |
| `message.part.updated` | Updates/inserts part in store |
| `message.part.removed` | Removes part from store |
| `lsp.updated` | Fetches and updates LSP status |
| `vcs.branch.updated` | Sets VCS branch |

---

## API Methods Reference

### Session Operations

| Method | Data Sent | Data Received | Used By |
|--------|-----------|---------------|---------|
| `session.create({})` | `{}` | `{ id: string }` | Prompt |
| `session.list()` | - | `Session[]` | SyncProvider |
| `session.get({ sessionID })` | `{ sessionID }` | `Session` | SyncProvider |
| `session.messages({ sessionID, limit })` | `{ sessionID, limit }` | `{ info: Message, parts: Part[] }[]` | SyncProvider |
| `session.todo({ sessionID })` | `{ sessionID }` | `Todo[]` | SyncProvider |
| `session.diff({ sessionID })` | `{ sessionID }` | `FileDiff[]` | SyncProvider |
| `session.delete({ sessionID })` | `{ sessionID }` | - | DialogSessionList |
| `session.update({ sessionID, title })` | `{ sessionID, title }` | - | DialogSessionRename |
| `session.abort({ sessionID })` | `{ sessionID }` | - | Session, Prompt |
| `session.share({ sessionID })` | `{ sessionID }` | `{ share: { url } }` | Session |
| `session.unshare({ sessionID })` | `{ sessionID }` | - | Session |
| `session.summarize({ sessionID, modelID, providerID })` | `{ sessionID, modelID, providerID }` | - | Session |
| `session.revert({ sessionID, messageID })` | `{ sessionID, messageID }` | - | Session |
| `session.unrevert({ sessionID })` | `{ sessionID }` | - | Session |
| `session.fork({ sessionID, messageID })` | `{ sessionID, messageID }` | `{ id }` | DialogForkFromTimeline |

### Message Operations

| Method | Data Sent | Used By |
|--------|-----------|---------|
| `session.prompt({ sessionID, providerID, modelID, messageID, agent, model, variant, parts })` | Complex prompt payload | Prompt |
| `session.command({ sessionID, command, arguments, agent, model, messageID, variant })` | Command payload | Prompt |
| `session.shell({ sessionID, agent, model, command })` | Shell command | Prompt |

### Permission Operations

| Method | Data Sent | Used By |
|--------|-----------|---------|
| `permission.reply({ reply, requestID })` | `{ reply: "once" \| "always" \| "reject", requestID }` | PermissionPrompt |

### Provider/Config Operations

| Method | Data Received | Used By |
|--------|---------------|---------|
| `config.providers()` | `{ providers, default }` | SyncProvider |
| `provider.list()` | `ProviderListResponse` | SyncProvider |
| `provider.auth()` | `Record<string, ProviderAuthMethod[]>` | SyncProvider |
| `config.get()` | `Config` | SyncProvider |

### Agent/App Operations

| Method | Data Received | Used By |
|--------|---------------|---------|
| `app.agents()` | `Agent[]` | SyncProvider |
| `command.list()` | `Command[]` | SyncProvider |

### System Status Operations

| Method | Data Received | Used By |
|--------|---------------|---------|
| `lsp.status()` | `LspStatus[]` | SyncProvider |
| `mcp.status()` | `Record<string, McpStatus>` | SyncProvider |
| `formatter.status()` | `FormatterStatus[]` | SyncProvider |
| `session.status()` | `Record<string, SessionStatus>` | SyncProvider |
| `vcs.get()` | `VcsInfo` | SyncProvider |
| `path.get()` | `Path` | SyncProvider |

### MCP Operations

| Method | Data Sent | Used By |
|--------|-----------|---------|
| `mcp.connect({ name })` | `{ name }` | LocalProvider |
| `mcp.disconnect({ name })` | `{ name }` | LocalProvider |

---

## Data Flow Patterns

### Bootstrap Sequence

```
1. SyncProvider mounts
2. bootstrap() is called
3. Blocking requests (in parallel):
   ├── config.providers() -> store.provider, store.provider_default
   ├── provider.list() -> store.provider_next
   ├── app.agents() -> store.agent
   ├── config.get() -> store.config
   └── session.list() (if args.continue) -> store.session
4. store.status = "partial"
5. Non-blocking requests (in parallel):
   ├── command.list() -> store.command
   ├── lsp.status() -> store.lsp
   ├── mcp.status() -> store.mcp
   ├── formatter.status() -> store.formatter
   ├── session.status() -> store.session_status
   ├── provider.auth() -> store.provider_auth
   ├── vcs.get() -> store.vcs
   └── path.get() -> store.path
6. store.status = "complete"
```

### Session Sync Flow

```
1. sync.session.sync(sessionID) called
2. If already synced (in fullSyncedSessions), return
3. Parallel API calls:
   ├── session.get({ sessionID })
   ├── session.messages({ sessionID, limit: 100 })
   ├── session.todo({ sessionID })
   └── session.diff({ sessionID })
4. Store updated with fetched data
5. sessionID added to fullSyncedSessions
```

### Message Submit Flow

```
1. User types in textarea
2. On submit, Prompt.submit() called
3. If no sessionID:
   └── session.create({}) -> get sessionID
4. Expand pasted text inline
5. Based on mode:
   ├── Shell mode: session.shell()
   ├── Command mode: session.command()
   └── Normal mode: session.prompt()
6. History updated, prompt cleared
7. Navigate to session if new
```

---

## TUI-Specific Events

```typescript
export const TuiEvent = {
  PromptAppend: { type: "tui.prompt.append", props: { text: string } },
  CommandExecute: { type: "tui.command.execute", props: { command: string } },
  ToastShow: { type: "tui.toast.show", props: { message, variant, duration } },
  SessionSelect: { type: "tui.session.select", props: { sessionID: string } },
}
```

---

## Key Patterns

### Context Pattern
```typescript
// SDKProvider provides client and emitter to entire tree
const sdk = useSDK()
await sdk.client.session.create({})
```

### Observer Pattern
```typescript
// Server pushes events, TUI reacts
sdk.event.on("session.updated", (evt) => {
  setStore("session", ...)
})
```

### Batched Updates
```typescript
// Events queued and flushed every 16ms max
batch(() => {
  for (const event of events) {
    emitter.emit(event.type, event)
  }
})
```

---

## Migration Notes for React/Ink

1. **SDK client stays the same** - Just import and use `createOpencodeClient()`

2. **Event handling** - Replace SolidJS `sdk.event.on()` with:
   ```typescript
   useEffect(() => {
     const unsub = sdk.event.on("session.updated", handler)
     return () => unsub()
   }, [])
   ```

3. **Batching** - Use React's `unstable_batchedUpdates` or zustand's automatic batching

4. **Store updates** - Replace SolidJS `produce()` with immer or zustand mutations
