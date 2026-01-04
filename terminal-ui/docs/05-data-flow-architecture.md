# Data Flow Architecture: OpenCode TUI

## Overview

The OpenCode TUI implements a unidirectional data flow architecture using Solid-JS reactivity primitives. Server events flow through SSE (Server-Sent Events) to the SDK layer, which batches and emits events to the Sync context. The Sync context maintains a normalized store that components reactively consume. User actions flow in reverse through SDK client calls to the Hono-based HTTP server.

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Hono @ :4096)                        │
│  /event endpoint → streamSSE() → writes JSON events             │
│  Bus.subscribeAll() → forwards all bus events                   │
│  Heartbeat every 30s                                            │
└─────────────────────────────────────────────────────────────────┘
                              │ SSE Stream
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SDKProvider (sdk.tsx)                        │
│  sdk.event.subscribe() → async iterator                         │
│  Event batching: queue events, flush every 16ms                 │
│  batch(() => emitter.emit()) for single render cycle            │
└─────────────────────────────────────────────────────────────────┘
                              │ Solid-JS batch()
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SyncProvider (sync.tsx)                      │
│  Normalized store with binary search updates                    │
│  Event handlers update store reactively                         │
│  Components read from store via useSync()                       │
└─────────────────────────────────────────────────────────────────┘
                              │ Solid-JS reactivity
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Component Tree                               │
│  <For each={messages()}> → renders message list                 │
│  Fine-grained updates via Solid-JS signals/stores               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Batching Mechanism

The SDK implements a 16ms batching strategy to optimize render performance:

```
Variables:
  queue: Event[] = []      // pending events
  timer: Timer | undefined
  last = 0                 // last flush timestamp

For each incoming event:
  1. queue.push(event)
  2. elapsed = Date.now() - last
  3. if timer exists → continue (batch pending)
  4. if elapsed < 16ms → setTimeout(flush, 16)
  5. else → flush() immediately

flush():
  1. Clear queue and timer
  2. Update last timestamp
  3. batch(() => { for event: emitter.emit(event.type, event) })
```

---

## Store Schema

```typescript
{
  status: "loading" | "partial" | "complete"
  provider: Provider[]
  provider_default: Record<string, string>
  provider_auth: Record<string, ProviderAuthMethod[]>
  agent: Agent[]
  command: Command[]
  permission: { [sessionID]: PermissionRequest[] }
  config: Config
  session: Session[]           // sorted by ID
  session_status: { [sessionID]: SessionStatus }
  session_diff: { [sessionID]: FileDiff[] }
  todo: { [sessionID]: Todo[] }
  message: { [sessionID]: Message[] }
  part: { [messageID]: Part[] }
  lsp: LspStatus[]
  mcp: { [key]: McpStatus }
  formatter: FormatterStatus[]
  vcs: VcsInfo | undefined
  path: Path
}
```

---

## Binary Search Store Updates

All sorted collections use O(log n) binary search:

```
Binary.search(array, id, compare):
  left = 0, right = array.length - 1
  while left <= right:
    mid = floor((left + right) / 2)
    midId = compare(array[mid])
    if midId === id → return { found: true, index: mid }
    if midId < id → left = mid + 1
    else → right = mid - 1
  return { found: false, index: left }  // insertion point
```

**Update Patterns**:
- Found → `setStore(path, index, reconcile(newValue))`
- Insert → `setStore(path, produce(draft => draft.splice(index, 0, newValue)))`
- Delete → `setStore(path, produce(draft => draft.splice(index, 1)))`

---

## Data Flow: Message Lifecycle

```
1. USER INPUT (prompt/index.tsx)
   └── User types and submits

2. PROMPT SUBMISSION
   ├── Validate input, model selection
   ├── Create session if needed: sdk.client.session.create({})
   ├── Generate messageID: Identifier.ascending("message")
   └── Call endpoint:
       ├── session.prompt() - normal mode
       ├── session.command() - slash command
       └── session.shell() - shell mode

3. SERVER PROCESSING (server.ts)
   ├── Validate input
   ├── Call SessionPrompt.prompt()
   └── Stream response

4. EVENT PUBLICATION
   └── Bus.publish() emits:
       ├── message.updated
       ├── message.part.updated
       ├── session.updated
       └── session.status

5. SDK EVENT BATCHING (sdk.tsx)
   └── Queue, batch (16ms), flush

6. SYNC STORE UPDATE (sync.tsx)
   ├── Binary.search for message
   └── reconcile() or splice()

7. COMPONENT RE-RENDER
   └── <For each={messages()}> updates
```

---

## Data Flow: Session Lifecycle

```
1. SESSION CREATION
   ├── Explicit: sdk.client.session.create({})
   └── Navigation: route.navigate({ type: "session", sessionID })

2. SESSION SYNC
   ├── Check fullSyncedSessions Set
   └── Parallel fetch:
       ├── session.get({ sessionID })
       ├── session.messages({ sessionID, limit: 100 })
       ├── session.todo({ sessionID })
       └── session.diff({ sessionID })

3. SESSION ACTIVE STATE
   ├── session() = sync.session.get(route.sessionID)
   ├── messages() = sync.data.message[sessionID]
   ├── permissions() = sync.data.permission[sessionID]
   └── Effect: sync.session.sync(sessionID)

4. REAL-TIME UPDATES
   ├── "session.updated" → reconcile session
   ├── "session.status" → update status
   ├── "session.diff" → update diff
   └── "todo.updated" → update todos

5. SESSION CLOSE
   ├── route.navigate({ type: "home" })
   └── Delete: "session.deleted" → navigate home + toast
```

---

## Data Flow: Tool Execution

```
1. TOOL CALL INITIATED (Server-side)
   └── Events: message.part.updated (status: "pending")
               permission.asked (if required)

2. TUI RECEIVES TOOL PART
   └── Binary.search, insert/reconcile part
       Component renders tool visualization

3. PERMISSION PROMPT (if required)
   ├── Display tool-specific body (Edit, Bash, etc.)
   ├── Options: "Allow once", "Allow always", "Reject"
   └── Keyboard: ←/→/h/l select, Enter confirm

4. USER RESPONDS
   └── sdk.client.permission.reply({ reply, requestID })

5. SERVER PROCESSES
   ├── PermissionNext.reply() unblocks tool
   └── Events: permission.replied, message.part.updated

6. TUI UPDATES
   ├── Remove permission from store
   └── Tool part shows completed/error state
```

---

## Data Flow: Permission Flow

```
1. PERMISSION REQUEST ARRIVES
   └── Binary.search, insert/reconcile request

2. PERMISSION PROMPT RENDERS
   ├── permissions() memo checks sessionID
   └── <Show when={permissions().length > 0}>

3. PERMISSION DIALOG UI
   ├── Title, body content
   ├── Options row with highlight
   └── Keyboard hints

4. RESPONSE SENT
   └── sdk.client.permission.reply({ reply, requestID })

5. SERVER PROCESSES
   └── PermissionNext.reply() → tool continues/aborts

6. TUI CLEARS PERMISSION
   ├── Binary.search, splice to remove
   └── Prompt becomes enabled
```

---

## Context Provider Hierarchy

```
ErrorBoundary
└── ArgsProvider         # CLI arguments
    └── ExitProvider     # Exit handler
        └── KVProvider   # Key-value storage
            └── ToastProvider        # Notifications
                └── RouteProvider    # Navigation state
                    └── SDKProvider  # Server connection + events
                        └── SyncProvider     # Reactive store
                            └── ThemeProvider    # Styling
                                └── LocalProvider    # Agent/model
                                    └── KeybindProvider  # Shortcuts
                                        └── ... (dialog/prompt)
```

---

## Reactivity Model (Solid-JS)

**Signals** - Local component state:
```typescript
const [value, setValue] = createSignal(initial)
value()  // read (tracks dependency)
setValue(newValue)  // write (triggers updates)
```

**Stores** - Complex/nested state:
```typescript
const [store, setStore] = createStore({ ... })
setStore("path", "to", "field", newValue)  // fine-grained
setStore("array", produce(draft => draft.push(item)))  // immutable
setStore("object", reconcile(newObject))  // deep replace
```

**Memos** - Derived computations:
```typescript
const derived = createMemo(() => store.items.filter(x => x.active))
// Re-computes when dependencies change
```

**Effects** - Side effects:
```typescript
createEffect(() => {
  // Runs when tracked dependencies change
})
onMount(() => { /* runs once */ })
onCleanup(() => { /* cleanup */ })
```

---

## SDK Client Calls (UI → Server)

| Action | SDK Call |
|--------|----------|
| Create session | `sdk.client.session.create({})` |
| Send prompt | `sdk.client.session.prompt({...})` |
| Send command | `sdk.client.session.command({...})` |
| Shell command | `sdk.client.session.shell({...})` |
| Abort session | `sdk.client.session.abort({sessionID})` |
| Reply to permission | `sdk.client.permission.reply({...})` |
| Fork session | `sdk.client.session.fork({...})` |
| Revert message | `sdk.client.session.revert({...})` |
| Delete session | `sdk.client.session.delete({...})` |
| Rename session | `sdk.client.session.update({...})` |
| Share session | `sdk.client.session.share({...})` |
| Summarize session | `sdk.client.session.summarize({...})` |
| Toggle MCP | `sdk.client.mcp.connect/disconnect({...})` |

---

## Bootstrap Sequence

**Blocking (must complete before "partial"):**
- `config.providers()` - Provider configurations
- `provider.list()` - Available providers
- `app.agents()` - Agent definitions
- `config.get()` - Global config
- `session.list()` - Session list (if continuing)

**Non-blocking (after "partial"):**
- `command.list()` - Slash commands
- `lsp.status()` - LSP server status
- `mcp.status()` - MCP server status
- `formatter.status()` - Formatter status
- `session.status()` - All session statuses
- `provider.auth()` - Auth methods
- `vcs.get()` - Git info
- `path.get()` - Directory paths

---

## Error Handling

**SDK Event Loop Recovery**:
- Event subscription runs in `while (true)` loop
- If SSE breaks, flush remaining events, restart subscription

**Bootstrap Failure**:
- Log error, call `exit(e)`

**Session Sync Failure**:
- Show toast, navigate to home

---

## Migration Notes for React/Ink

1. **Event batching** - Use `unstable_batchedUpdates` or zustand's automatic batching
2. **Binary search** - Keep for performance with large lists
3. **Store pattern** - Replace `createStore` with zustand or `useReducer`
4. **Reactivity** - Replace Solid signals/memos with React hooks
5. **Effects** - Replace `createEffect` with `useEffect`
