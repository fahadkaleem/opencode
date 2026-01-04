# Session View Specification: OpenCode TUI

## Overview

The Session View component (`routes/session/index.tsx`) is the primary interface for chat sessions (~1800 lines). It renders a message list with user messages, assistant responses, tool executions, and handles all session interactions including scrolling, keyboard navigation, and message editing.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  <box flexDirection="row">                                       │
│  ┌──────────────────────────────────────┬──────────────────────┐│
│  │  Main Content (flexGrow=1)           │  Sidebar (width=42)  ││
│  │  ┌─────────────────────────────────┐ │  (conditional)       ││
│  │  │ Header (when !sidebarVisible)   │ │                      ││
│  │  ├─────────────────────────────────┤ │                      ││
│  │  │ ScrollBox (flexGrow=1)          │ │                      ││
│  │  │  - Message List                 │ │                      ││
│  │  │  - User Messages                │ │                      ││
│  │  │  - Assistant Messages           │ │                      ││
│  │  ├─────────────────────────────────┤ │                      ││
│  │  │ PermissionPrompt (conditional)  │ │                      ││
│  │  │ Prompt Input                    │ │                      ││
│  │  ├─────────────────────────────────┤ │                      ││
│  │  │ Footer (when !sidebarVisible)   │ │                      ││
│  │  └─────────────────────────────────┘ │                      ││
│  │  <Toast />                           │                      ││
│  └──────────────────────────────────────┴──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Sub-Components

### Header (`./header.tsx`)
- **Condition**: Shown when sidebar is hidden
- **Content**: Session title, token count, cost, share URL

### Footer (`./footer.tsx`)
- **Condition**: Shown when sidebar is hidden
- **Content**: Directory path, LSP status, MCP status, permissions count

### Sidebar (`./sidebar.tsx`)
- **Condition**: Toggle with `ctrl+x b` or auto-show when width > 120
- **Width**: 42 characters fixed
- **Sections**: Session info, MCP servers, LSP servers, todo list, modified files

### PermissionPrompt (`./permission.tsx`)
- **Condition**: Shown when `permissions().length > 0`
- **Purpose**: Tool approval UI

### Prompt (`component/prompt`)
- **Props**: visible, disabled, sessionID, onSubmit, ref

---

## Message Rendering

### Message List Structure

```tsx
<For each={messages()}>
  <Switch>
    <Match when={message.id === revert()?.messageID}>
      {/* Revert indicator */}
    </Match>
    <Match when={reverted}>
      {/* Hidden (reverted messages) */}
    </Match>
    <Match when={message.role === "user"}>
      <UserMessage />
    </Match>
    <Match when={message.role === "assistant"}>
      <AssistantMessage />
    </Match>
  </Switch>
</For>
```

### UserMessage Component

**Visual Elements**:
- Left border colored by agent
- User text
- File attachments with badges (img, pdf, txt, dir)
- Username and timestamp
- "QUEUED" badge for pending
- Compaction marker

### AssistantMessage Component

**Visual Elements**:
- Parts loop with `PART_MAPPING`
- Error display
- Footer: agent indicator, mode, model, duration

---

## Part Type Mapping

```typescript
const PART_MAPPING = {
  text: TextPart,
  tool: ToolPart,
  reasoning: ReasoningPart,
}
```

### TextPart
- Markdown with syntax highlighting
- Code concealment support

### ReasoningPart
- "Thinking" content (chain-of-thought)
- Controlled by `showThinking()` toggle
- Subtle syntax highlighting

### ToolPart
- Routes to specific tool visualizations

---

## Tool Visualizations

| Tool | Display Type | Features |
|------|--------------|----------|
| Bash | Block | Command + output |
| Write | Block | Syntax highlighted content, LSP diagnostics |
| Edit | Block | Diff viewer (split/unified), diagnostics |
| Task | Block | Subagent summary, clickable navigation |
| Glob | Inline | Pattern + match count |
| Read | Inline | File path + range |
| Grep | Inline | Pattern + match count |
| List | Inline | Directory path |
| WebFetch | Inline | URL |
| WebSearch | Inline | Query + results |
| TodoWrite | Block | Todo list display |

### Diff Configuration

- **Split view**: Terminal width > 120
- **Unified view**: Otherwise
- Config override: `config.tui.diff_style`

---

## Scroll Configuration

```tsx
<scrollbox
  stickyScroll={true}
  stickyStart="bottom"
  scrollAcceleration={scrollAcceleration()}
>
```

**Scroll Modes**:
1. MacOS Acceleration
2. Custom Speed (default: 3)

---

## Session Context

```typescript
const context = createContext<{
  width: number
  sessionID: string
  conceal: () => boolean
  showThinking: () => boolean
  showTimestamps: () => boolean
  usernameVisible: () => boolean
  showDetails: () => boolean
  diffWrapMode: () => "word" | "none"
  sync: ReturnType<typeof useSync>
}>()
```

---

## Registered Commands

| Command | Keybind | Action |
|---------|---------|--------|
| session.share | session_share | Share session URL |
| session.rename | session_rename | Open rename dialog |
| session.timeline | session_timeline | Jump to message |
| session.fork | session_fork | Fork from message |
| session.compact | session_compact | Summarize session |
| session.undo | messages_undo | Undo message |
| session.redo | messages_redo | Redo message |
| sidebar_toggle | sidebar_toggle | Toggle sidebar |
| messages_page_up | messages_page_up | Page up |
| messages_page_down | messages_page_down | Page down |
| messages_first | messages_first | Go to first |
| messages_last | messages_last | Go to last |
| messages_copy | messages_copy | Copy last assistant message |
| session_child_cycle | session_child_cycle | Next child session |
| session_parent | session_parent | Go to parent |

---

## State from Contexts

### useSync
- `sync.session.get(sessionID)` - Session info
- `sync.data.message[sessionID]` - Messages array
- `sync.data.part[messageID]` - Parts for message
- `sync.data.permission[sessionID]` - Permission requests
- `sync.session.sync(sessionID)` - Fetch session data

### useLocal
- `local.model.current()` - Current model
- `local.agent.color(agentName)` - Agent color
- `local.agent.current()` - Current agent

### useTheme
- `theme.*` - All theme colors
- `syntax()` - Syntax highlighting
- `subtleSyntax()` - Subtle syntax for thinking

### useKV
- `sidebar` - Visibility state
- `thinking_visibility` - Show reasoning
- `timestamps` - Show timestamps
- `username_visible` - Show username
- `tool_details_visibility` - Show tool details
- `scrollbar_visible` - Show scrollbar

---

## SDK Calls

| Method | Purpose |
|--------|---------|
| `session.share()` | Create share URL |
| `session.unshare()` | Remove share |
| `session.summarize()` | Compact session |
| `session.revert()` | Undo to message |
| `session.unrevert()` | Redo all |
| `session.abort()` | Stop generation |

---

## Migration Considerations

1. **Replace SolidJS**: signals → useState, memos → useMemo, effects → useEffect
2. **Replace OpenTUI**: scrollbox, code, diff need Ink equivalents
3. **Replace context**: Same shape, React context
4. **Event system**: SDK events → React state management
5. **Rendering optimization**: Solid fine-grained vs React reconciliation
