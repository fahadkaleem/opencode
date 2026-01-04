# State Management Reference: OpenCode TUI

## Overview

The OpenCode TUI uses a layered context-based state management architecture built on SolidJS. State is organized into 15 context providers, each responsible for a specific domain (SDK communication, data synchronization, UI state, user preferences). Providers are nested in a specific order to establish dependency chains, with lower-level contexts (Args, Exit, KV) providing foundational services for higher-level ones (Sync, Local, Theme).

---

## Context Provider Hierarchy

### Provider Nesting Order

```
ArgsProvider
└── ExitProvider
    └── KVProvider
        └── ToastProvider
            └── RouteProvider
                └── SDKProvider
                    └── SyncProvider
                        └── ThemeProvider
                            └── LocalProvider
                                └── KeybindProvider
                                    └── PromptStashProvider
                                        └── DialogProvider
                                            └── CommandProvider
                                                └── PromptHistoryProvider
                                                    └── PromptRefProvider
                                                        └── <App />
```

---

## Context Providers Reference

### 1. ArgsProvider

**File**: `context/args.tsx`

**Purpose**: Provides command-line arguments to the TUI application.

**State Shape**:
```typescript
interface Args {
  model?: string
  agent?: string
  prompt?: string
  continue?: boolean
  sessionID?: string
}
```

**Initialization**:
- State is initialized directly from props passed to the provider
- No async loading; values are available immediately

**Exposed Hook**: `useArgs()`

**Dependencies**: None (root-level provider)

---

### 2. ExitProvider

**File**: `context/exit.tsx`

**Purpose**: Provides a function to gracefully exit the TUI application.

**Behavior**:
- Resets terminal title
- Destroys renderer
- Calls optional `onExit` callback
- Formats errors via `FormatError`/`FormatUnknownError`
- Calls `process.exit(0)`

**Exposed Hook**: `useExit()` - Returns the exit function directly

**Dependencies**:
- `@opentui/solid` (useRenderer)

---

### 3. KVProvider

**File**: `context/kv.tsx`

**Purpose**: Persistent key-value storage for user preferences (theme, settings).

**State Shape**:
```typescript
Record<string, any>
```

**Persistence**: `{Global.Path.state}/kv.json`

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `ready` | Boolean getter for load state |
| `signal<T>(name, defaultValue)` | Creates reactive signal for a key |
| `get(key, defaultValue?)` | Reads value from store |
| `set(key, value)` | Writes value and persists to disk |

---

### 4. ToastProvider

**File**: `ui/toast.tsx`

**Purpose**: Manages toast notification display.

**State Shape**:
```typescript
{
  currentToast: ToastOptions | null
}
```

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `show(options)` | Display toast with variant, message, duration |
| `error(err)` | Convenience method for error toasts |
| `currentToast` | Getter for current toast state |

---

### 5. RouteProvider

**File**: `context/route.tsx`

**Purpose**: Client-side routing within the TUI.

**State Shape**:
```typescript
type Route =
  | { type: "home"; initialPrompt?: PromptInfo }
  | { type: "session"; sessionID: string; initialPrompt?: PromptInfo }
```

**Initialization**:
- Checks `process.env["OPENCODE_ROUTE"]` for initial route (JSON parsed)
- Defaults to `{ type: "home" }` if not set

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `data` | Getter for current route |
| `navigate(route)` | Navigate to new route |

**Additional Hook**: `useRouteData<T>(type)` - Type-safe route data accessor

---

### 6. SDKProvider

**File**: `context/sdk.tsx`

**Purpose**: Initializes SDK client and manages SSE event stream.

**State**:
- `abort`: AbortController for cleanup
- `sdk`: OpenCode SDK client instance
- `emitter`: Global event emitter for SDK events

**Event Handling**:
- Subscribes to SSE event stream
- Batches events with 16ms throttle for performance
- Flushes events using SolidJS `batch()`

**Exposed Interface**:
```typescript
{ client: sdk, event: emitter, url: props.url }
```

---

### 7. SyncProvider (CRITICAL)

**File**: `context/sync.tsx`

**Purpose**: Central data store synchronized with server via SSE events.

**State Shape**:
```typescript
{
  status: "loading" | "partial" | "complete"
  provider: Provider[]
  provider_default: Record<string, string>
  provider_next: ProviderListResponse
  provider_auth: Record<string, ProviderAuthMethod[]>
  agent: Agent[]
  command: Command[]
  permission: { [sessionID: string]: PermissionRequest[] }
  config: Config
  session: Session[]
  session_status: { [sessionID: string]: SessionStatus }
  session_diff: { [sessionID: string]: Snapshot.FileDiff[] }
  todo: { [sessionID: string]: Todo[] }
  message: { [sessionID: string]: Message[] }
  part: { [messageID: string]: Part[] }
  lsp: LspStatus[]
  mcp: { [key: string]: McpStatus }
  formatter: FormatterStatus[]
  vcs: VcsInfo | undefined
  path: Path
}
```

**Event Handlers**:
| Event Type | Action |
|------------|--------|
| `server.instance.disposed` | Re-bootstrap |
| `permission.replied` | Remove permission from store |
| `permission.asked` | Add/update permission |
| `todo.updated` | Update todos |
| `session.diff` | Update session diff |
| `session.deleted` | Remove session |
| `session.updated` | Add/update session |
| `session.status` | Update session status |
| `message.updated` | Add/update message |
| `message.removed` | Remove message |
| `message.part.updated` | Add/update message part |
| `message.part.removed` | Remove part |
| `lsp.updated` | Refresh LSP status |
| `vcs.branch.updated` | Update VCS branch |

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `data` | Raw store access |
| `set` | Direct store setter |
| `status` | Current sync status |
| `ready` | Boolean (not loading) |
| `session.get(id)` | Binary search for session |
| `session.status(id)` | Computed session status |
| `session.sync(id)` | Full session sync from server |
| `bootstrap` | Re-initialize data |

**Dependencies**: SDKProvider, ExitProvider, ArgsProvider

---

### 8. ThemeProvider

**File**: `context/theme.tsx`

**Purpose**: Theme management with 30+ built-in themes and custom theme support.

**Theme Structure**:
```typescript
type ThemeColors = {
  primary: RGBA
  secondary: RGBA
  accent: RGBA
  error: RGBA
  warning: RGBA
  success: RGBA
  info: RGBA
  text: RGBA
  textMuted: RGBA
  background: RGBA
  backgroundHover: RGBA
  backgroundMuted: RGBA
  border: RGBA
  borderMuted: RGBA
  // ... 35+ color properties total
  diffAdded: RGBA
  diffRemoved: RGBA
  diffContext: RGBA
  codeBackground: RGBA
  // etc.
}
```

**Exposed Interface**:
| Property/Method | Purpose |
|-----------------|---------|
| `theme` | Proxy to resolved theme colors |
| `selected` | Current theme name |
| `all()` | All available themes |
| `syntax` | Memo for syntax highlighting styles |
| `subtleSyntax` | Memo for dimmed syntax (thinking state) |
| `mode()` | Current color mode |
| `setMode(mode)` | Switch dark/light |
| `set(theme)` | Change active theme |

---

### 9. LocalProvider

**File**: `context/local.tsx`

**Purpose**: Local UI state for agent selection, model selection, and MCP toggles.

**Agent Methods**:
| Method | Purpose |
|--------|---------|
| `list()` | All visible agents |
| `current()` | Current agent |
| `set(name)` | Switch agent (with toast on invalid) |
| `move(direction)` | Cycle through agents |
| `color(name)` | Agent's assigned color |

**Model Methods**:
| Method | Purpose |
|--------|---------|
| `current` | Current model memo |
| `ready` | Model data loaded |
| `recent()` | Recent models list |
| `favorite()` | Favorite models list |
| `parsed` | Human-readable model info |
| `cycle(direction)` | Cycle recent models |
| `set(model, options?)` | Set model |
| `toggleFavorite(model)` | Add/remove favorite |

**MCP Methods**:
| Method | Purpose |
|--------|---------|
| `isEnabled(name)` | Check MCP connection status |
| `toggle(name)` | Connect/disconnect MCP |

---

### 10. KeybindProvider

**File**: `context/keybind.tsx`

**Purpose**: Keyboard shortcut management with leader key support.

**Leader Key Logic**:
- Activates on leader key press
- Auto-deactivates after 2000ms timeout
- Manages focus state during leader mode

**Exposed Interface**:
| Property/Method | Purpose |
|-----------------|---------|
| `all` | All parsed keybinds |
| `leader` | Leader mode active |
| `parse(evt)` | Convert key event to Keybind.Info |
| `match(key, evt)` | Check if event matches keybind |
| `print(key)` | Format keybind for display |

---

### 11. PromptStashProvider

**File**: `component/prompt/stash.tsx`

**Purpose**: Temporary storage for unsent prompts.

**Persistence**: `{state}/prompt-stash.jsonl` (max 50 entries)

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `list()` | All stash entries |
| `push(entry)` | Add new entry |
| `pop()` | Remove and return last entry |
| `remove(index)` | Remove entry at index |

---

### 12. DialogProvider

**File**: `ui/dialog.tsx`

**Purpose**: Modal dialog management with stack-based navigation.

**State Shape**:
```typescript
{
  stack: { element: JSX.Element; onClose?: () => void }[]
  size: "medium" | "large"
}
```

**Behavior**:
- ESC key pops from stack
- Saves focus before opening dialog
- Restores focus after closing

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `clear()` | Close all dialogs, call all onClose callbacks |
| `replace(element, onClose?)` | Replace stack with single dialog |
| `stack` | Current dialog stack |
| `size` | Current dialog size |
| `setSize(size)` | Set dialog size |

---

### 13. CommandProvider

**File**: `component/dialog-command.tsx`

**Purpose**: Command palette registration and execution.

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `trigger(name, source?)` | Execute command by value |
| `keybinds(enabled)` | Suspend/resume keybind handling |
| `suspended` | Check if keybinds suspended |
| `show()` | Open command palette dialog |
| `register(cb)` | Register command provider |
| `options` | All registered commands |

---

### 14. PromptHistoryProvider

**File**: `component/prompt/history.tsx`

**Purpose**: Prompt input history for up/down navigation.

**Persistence**: `{state}/prompt-history.jsonl` (max 50 entries)

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `move(direction, input)` | Navigate history, returns entry |
| `append(item)` | Add entry, trim if needed |

---

### 15. PromptRefProvider

**File**: `context/prompt.tsx`

**Purpose**: Reference holder for the active prompt component.

**Exposed Methods**:
| Method | Purpose |
|--------|---------|
| `current` | Get current prompt ref |
| `set(ref)` | Set prompt ref |

---

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION INIT                                 │
│  CLI Args ──► ArgsProvider ──► TUI Boot                                      │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE LAYER                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ ExitProvider │    │  KVProvider  │    │ToastProvider │                   │
│  │ • exit()     │    │ • get/set    │    │ • show()     │                   │
│  │ • cleanup    │    │ • persist    │    │ • error()    │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  ┌─────────────────┐         ┌────────────────────────────────────────┐     │
│  │   SDKProvider   │◄───────►│              SyncProvider               │     │
│  │ • client        │   SSE   │  • sessions, messages, parts           │     │
│  │ • event emitter │ Events  │  • permissions, todos, diffs           │     │
│  │ • url           │────────►│  • providers, agents, config           │     │
│  └─────────────────┘         └────────────────────────────────────────┘     │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           UI STATE LAYER                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  ThemeProvider   │    │  LocalProvider   │    │ KeybindProvider  │       │
│  │ • theme colors   │    │ • agent state    │    │ • keybind map    │       │
│  │ • syntax styles  │◄──►│ • model state    │    │ • leader mode    │       │
│  │ • dark/light     │    │ • mcp state      │    │ • match/parse    │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DIALOG & COMMAND LAYER                             │
│  ┌──────────────────┐         ┌──────────────────┐                          │
│  │  DialogProvider  │◄───────►│ CommandProvider  │                          │
│  │ • stack[]        │ show()  │ • registrations  │                          │
│  │ • size           │◄────────│ • trigger()      │                          │
│  │ • clear/replace  │         │ • keybinds       │                          │
│  └──────────────────┘         └──────────────────┘                          │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PROMPT LAYER                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │PromptStashProvider│  │PromptHistoryProv.│  │PromptRefProvider │           │
│  │ • entries[]     │  │ • history[]      │  │ • current ref    │           │
│  │ • push/pop      │  │ • move/append    │  │ • set()          │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Context Dependencies Matrix

| Context | Depends On |
|---------|------------|
| **ArgsProvider** | None |
| **ExitProvider** | `@opentui/solid` (useRenderer) |
| **KVProvider** | None |
| **ToastProvider** | None |
| **RouteProvider** | None |
| **SDKProvider** | None |
| **SyncProvider** | SDKProvider, ExitProvider, ArgsProvider |
| **ThemeProvider** | SyncProvider, KVProvider |
| **LocalProvider** | SyncProvider, SDKProvider, ToastProvider, ThemeProvider, ArgsProvider |
| **KeybindProvider** | SyncProvider |
| **PromptStashProvider** | None |
| **DialogProvider** | None |
| **CommandProvider** | DialogProvider, KeybindProvider |
| **PromptHistoryProvider** | None |
| **PromptRefProvider** | None |

---

## File Persistence Summary

| Context | File Path | Format |
|---------|-----------|--------|
| KVProvider | `{state}/kv.json` | JSON object |
| LocalProvider (model) | `{state}/model.json` | JSON object |
| PromptStashProvider | `{state}/prompt-stash.jsonl` | JSONL |
| PromptHistoryProvider | `{state}/prompt-history.jsonl` | JSONL |
| ThemeProvider (custom) | `{config}/themes/*.json` | JSON per theme |

---

## Event-Driven Updates

The SyncProvider acts as the central hub for server-to-client updates:

1. **Server** emits SSE event
2. **SDKProvider** receives and batches events (16ms throttle)
3. **SyncProvider** listener processes by event type
4. **Store updates** trigger reactive UI updates
5. **Dependent contexts** (LocalProvider, ThemeProvider) react to sync changes

---

## Migration Notes for React/Ink

When porting to React:

1. **Replace SolidJS primitives**:
   - `createStore` → `zustand` or `useReducer`
   - `createSignal` → `useState`
   - `createMemo` → `useMemo`
   - `onMount` → `useEffect`
   - `onCleanup` → cleanup function in `useEffect`

2. **Keep the provider structure** - The nesting order and dependencies remain valid

3. **Event batching** - Implement similar 16ms batching in React using `unstable_batchedUpdates` or custom debounce

4. **Binary search lookups** - Keep for performance with large lists
