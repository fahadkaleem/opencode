# Component Inventory: OpenCode TUI

## Overview

The OpenCode TUI is built using **SolidJS** for reactive UI and **OpenTUI** (`@opentui/core`, `@opentui/solid`) for terminal rendering. The architecture follows a provider-based pattern with context providers, reusable UI primitives, domain-specific components, and route-based pages.

**Base Path**: `packages/opencode/src/cli/cmd/tui/`

---

## Component Count Summary

| Category | Count |
|----------|-------|
| Context Providers | 12 |
| UI Primitives | 10 |
| Reusable Components | 16 |
| Prompt Components | 4 |
| Route Components | 10 |
| Utilities | 3 |
| **Total** | **55** |

---

## 1. Context Providers (`context/`)

| Component | File | Hook | Purpose |
|-----------|------|------|---------|
| ArgsProvider | args.tsx | `useArgs()` | CLI arguments (model, agent, prompt, continue, sessionID) |
| ExitProvider | exit.tsx | `useExit()` | Exit function with cleanup |
| KVProvider | kv.tsx | `useKV()` | Persistent key-value storage |
| LocalProvider | local.tsx | `useLocal()` | Agent/model selection, MCP toggles |
| PromptRefProvider | prompt.tsx | `usePromptRef()` | Reference to active Prompt |
| RouteProvider | route.tsx | `useRoute()` | Navigation ("home" / "session") |
| SDKProvider | sdk.tsx | `useSDK()` | Server connection, SSE events |
| SyncProvider | sync.tsx | `useSync()` | All server state synchronized |
| ThemeProvider | theme.tsx | `useTheme()` | Theme colors, syntax highlighting |
| KeybindProvider | keybind.tsx | `useKeybind()` | Keyboard shortcuts |
| Helper | helper.tsx | `createSimpleContext()` | Context factory function |
| useDirectory | directory.ts | `useDirectory()` | Formatted directory path |

---

## 2. UI Primitives (`ui/`)

| Component | File | Purpose | OpenTUI Primitives |
|-----------|------|---------|-------------------|
| DialogProvider | dialog.tsx | Modal dialog system | box, useKeyboard |
| DialogAlert | dialog-alert.tsx | Alert with OK button | box, text |
| DialogConfirm | dialog-confirm.tsx | Yes/No confirmation | box, text |
| DialogExportOptions | dialog-export-options.tsx | Export options form | box, text, input |
| DialogHelp | dialog-help.tsx | Keybinding help | box, text, scrollbox |
| DialogPrompt | dialog-prompt.tsx | Text input dialog | box, text, input |
| DialogSelect | dialog-select.tsx | Searchable selection | box, text, input, scrollbox |
| Link | link.tsx | Clickable hyperlink | text (OSC 8) |
| Spinner | spinner.ts | Animated spinner | None |
| ToastProvider | toast.tsx | Toast notifications | box, text |

---

## 3. Reusable Components (`component/`)

| Component | File | Purpose | Child Components |
|-----------|------|---------|-----------------|
| Border | border.tsx | Custom border definitions | None |
| DialogAgent | dialog-agent.tsx | Agent selection | DialogSelect |
| DialogCommand | dialog-command.tsx | Command palette | DialogSelect |
| DialogMcp | dialog-mcp.tsx | MCP status/toggle | DialogSelect |
| DialogModel | dialog-model.tsx | Model selection | DialogSelect |
| DialogProvider | dialog-provider.tsx | Provider connection | DialogSelect |
| DialogSessionList | dialog-session-list.tsx | Session switcher | DialogSelect |
| DialogSessionRename | dialog-session-rename.tsx | Rename session | DialogPrompt |
| DialogStash | dialog-stash.tsx | Stashed prompts | DialogSelect |
| DialogStatus | dialog-status.tsx | System status | box, text, scrollbox |
| DialogTag | dialog-tag.tsx | Tag management | DialogSelect |
| DialogThemeList | dialog-theme-list.tsx | Theme switcher | DialogSelect |
| DidYouKnow | did-you-know.tsx | Random tips | box, text |
| Logo | logo.tsx | ASCII logo | text |
| TodoItem | todo-item.tsx | Todo item display | box, text |
| Tips | tips.ts | Tip strings array | None |

---

## 4. Prompt Components (`component/prompt/`)

| Component | File | Purpose | OpenTUI Primitives |
|-----------|------|---------|-------------------|
| Prompt | index.tsx | Main prompt input | box, text, input, code, scrollbox |
| Autocomplete | autocomplete.tsx | Suggestions UI | box, text, scrollbox |
| PromptHistoryProvider | history.tsx | Prompt history | None |
| PromptStashProvider | stash.tsx | Stashed prompts | None |

---

## 5. Route Components (`routes/`)

| Component | File | Purpose | Child Components |
|-----------|------|---------|-----------------|
| Home | home.tsx | Home screen | Logo, Prompt, DidYouKnow |
| Session | session/index.tsx | Main session view | Header, Footer, Sidebar, Prompt, Messages |
| Header | session/header.tsx | Session header | None |
| Footer | session/footer.tsx | Session footer | None |
| Sidebar | session/sidebar.tsx | Context info panel | TodoItem |
| PermissionPrompt | session/permission.tsx | Permission UI | box, text, diff |
| DialogTimeline | session/dialog-timeline.tsx | Message navigator | DialogSelect |
| DialogForkFromTimeline | session/dialog-fork-from-timeline.tsx | Fork from message | DialogSelect |
| DialogMessage | session/dialog-message.tsx | Message actions | DialogSelect |
| DialogSubagent | session/dialog-subagent.tsx | Subagent actions | DialogSelect |

---

## 6. Utilities (`util/`)

| Function | File | Purpose |
|----------|------|---------|
| Clipboard | clipboard.ts | Cross-platform clipboard |
| Editor | editor.ts | Open external editor |
| Transcript | transcript.ts | Format session as markdown |

---

## 7. OpenTUI Primitives Used

| Primitive | Source | Usage |
|-----------|--------|-------|
| `box` | @opentui/solid | Layout container (flexbox) |
| `text` | @opentui/solid | Text with fg/bg/bold/italic |
| `span` | @opentui/solid | Inline text styling |
| `scrollbox` | @opentui/solid | Scrollable container |
| `input` | @opentui/solid | Text input field |
| `code` | @opentui/solid | Syntax-highlighted code |
| `diff` | @opentui/solid | Unified/split diff display |
| `line_number` | @opentui/solid | Line number gutter |
| `render()` | @opentui/solid | Entry point |
| `useKeyboard()` | @opentui/solid | Keyboard events |
| `useRenderer()` | @opentui/solid | Renderer access |
| `useTerminalDimensions()` | @opentui/solid | Terminal size |
| `RGBA` | @opentui/core | Color representation |
| `SyntaxStyle` | @opentui/core | Syntax highlighting config |
| `TextAttributes` | @opentui/core | Text styling flags |

---

## 8. Session View Components (session/index.tsx)

The session view is the most complex component (~1800 lines). It includes:

### Internal Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| UserMessage | 1064-1158 | User message display |
| AssistantMessage | 1160-1225 | Assistant message display |
| MessageParts | - | Routes parts to renderers |
| ThinkingPart | 1233-1264 | Reasoning block |
| TextPart | 1266-1284 | Markdown text |
| ToolPart | 1288-1359 | Tool call visualization |

### Tool Visualizations

| Tool | Lines | Display |
|------|-------|---------|
| Bash | 1484-1504 | Command + output |
| Write | 1506-1549 | New file with syntax |
| Glob | 1551-1558 | Pattern + matches |
| Read | 1560-1566 | File path + range |
| Grep | 1568-1575 | Pattern + matches |
| Lsp | 1577-1600 | Definitions/references |
| Task | 1619-1667 | Subagent summary |
| Edit | 1669-1736 | Diff view |
| WebSearch | 1738-1756 | Search query |
| TodoWrite | 1758-1776 | Todo list |

---

## 9. Ink Component Mapping

| OpenTUI | Ink Equivalent | Package |
|---------|----------------|---------|
| `box` | `<Box>` | ink |
| `text` | `<Text>` | ink |
| `scrollbox` | `ScrollableList` | gemini-cli or custom |
| `input` | `<TextInput>` | @inkjs/ui |
| `code` | `CodeColorizer` | gemini-cli |
| `diff` | `DiffRenderer` | gemini-cli |
| `useKeyboard` | `useInput` | ink |
| `useTerminalDimensions` | `useStdout` | ink |

---

## 10. Files to Migrate

### High Priority (Core)
1. `context/sdk.tsx` - SDK connection
2. `context/sync.tsx` - State synchronization
3. `context/theme.tsx` - Theming
4. `context/route.tsx` - Navigation
5. `component/prompt/index.tsx` - Main input

### Medium Priority (UI)
6. `ui/dialog.tsx` - Dialog system
7. `ui/dialog-select.tsx` - Selection dialogs
8. `ui/toast.tsx` - Notifications
9. `routes/session/index.tsx` - Main session view
10. `routes/session/permission.tsx` - Permission prompts

### Lower Priority (Dialogs)
11-20. Various dialog components

### Lower Priority (Utils)
21-23. Utility functions
