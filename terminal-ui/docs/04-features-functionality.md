# Features and Functionality Reference: OpenCode TUI

## Overview

The OpenCode TUI is a full-featured terminal user interface built with SolidJS and the OpenTUI framework. It provides an interactive chat interface with LLM agents, supporting session management, tool visualization, file references, and extensive keyboard-driven navigation.

---

## 1. Session Management

### 1.1 Create New Session

| Trigger | Component |
|---------|-----------|
| `ctrl+x n` (leader + n) | app.tsx |
| `/new` or `/clear` command | autocomplete.tsx |
| Submit on Home screen | prompt/index.tsx |

**Flow**: Creates session via SDK → Navigates to session route → Session added to store via event

### 1.2 Switch Session

| Trigger | Component |
|---------|-----------|
| `ctrl+x l` (leader + l) | app.tsx |
| `/session`, `/resume`, `/continue` | autocomplete.tsx |

**Dialog**: `DialogSessionList` with selection UI

### 1.3 Rename Session

| Trigger | Component |
|---------|-----------|
| `/rename` command | autocomplete.tsx |
| `ctrl+r` in session list | dialog-session-list.tsx |

### 1.4 Delete Session

| Trigger | Behavior |
|---------|----------|
| `ctrl+d` twice in session list | Two-press confirmation for safety |

### 1.5 Share/Unshare Session

| Command | Action |
|---------|--------|
| `/share` | Creates shareable URL, copies to clipboard |
| `/unshare` | Removes public access |

---

## 2. Message Display

### 2.1 User Messages

**Visual Elements**:
- Left border colored by agent
- Username and timestamp
- File attachments with MIME badges
- "QUEUED" badge for pending messages
- Compaction marker display

### 2.2 Assistant Messages

**Visual Elements**:
- Text content with syntax-highlighted markdown
- Reasoning/thinking blocks (toggleable visibility)
- Tool call visualizations
- Agent indicator with model and duration
- Error display

### 2.3 Message Parts

| Part Type | Display |
|-----------|---------|
| `text` | Markdown with syntax highlighting |
| `reasoning` | Collapsible thinking block |
| `tool-call` | Tool-specific visualization |
| `error` | Error message with details |

---

## 3. Input Handling

### 3.1 Prompt Input

**Features**:
- Multi-line with shift+enter for newlines
- Shell mode triggered by `!` at start
- Maximum height of 6 lines
- Disabled state with visual feedback

**Input Modes**:
| Mode | Trigger | Action |
|------|---------|--------|
| Normal | Default | Regular LLM prompts |
| Shell | `!` prefix | Direct shell command execution |
| Command | `/` prefix | Slash commands |

### 3.2 Autocomplete

**Triggers**:
| Prefix | Suggestion Type |
|--------|-----------------|
| `@` | Files, agents |
| `/` at start | Commands |

**Features**:
- Fuzzy search with fuzzysort
- Line range syntax: `@file.ts#10-20`
- Agent references: `@agent-name`
- Up to 10 results displayed

### 3.3 Slash Commands

| Command | Description |
|---------|-------------|
| `/undo` | Undo last message |
| `/redo` | Redo last message |
| `/compact`, `/summarize` | Compact session |
| `/share` | Share session |
| `/unshare` | Unshare session |
| `/rename` | Rename session |
| `/copy` | Copy transcript |
| `/export` | Export transcript |
| `/timeline` | Jump to message |
| `/fork` | Fork from message |
| `/thinking` | Toggle thinking visibility |
| `/new`, `/clear` | New session |
| `/models` | List models |
| `/agents` | List agents |
| `/session`, `/resume`, `/continue` | List sessions |
| `/status` | Show status |
| `/mcp` | Toggle MCPs |
| `/theme` | Switch theme |
| `/editor` | Open editor |
| `/connect` | Connect provider |
| `/help` | Show help |
| `/commands` | Show all commands |
| `/exit`, `/quit`, `/q` | Exit app |

### 3.4 File References

**Syntax**: `@path/to/file` or `@path/to/file#10-20` (with line range)

**Supported**:
- Text files with line ranges
- Images (PNG, JPEG, GIF, WebP)
- PDFs
- Virtual text display with extmarks

---

## 4. Tool Visualization

### 4.1 Bash Output

**Display**:
- Inline pending: `~ Writing command...`
- Block display when complete
- ANSI colors stripped from output

### 4.2 File Edits (Edit Tool)

**Display**:
- Split view when terminal width > 120
- Unified diff otherwise
- Syntax highlighting per filetype
- Line numbers
- LSP diagnostics (errors)
- Configurable wrap mode

### 4.3 File Writes

**Display**:
- Line numbers with syntax highlighting
- LSP diagnostics for errors
- Pending state: `~ Preparing write...`

### 4.4 File Reads

**Display**: `→ Read path/to/file [offset=10, limit=50]`

### 4.5 Search Tools

| Tool | Display |
|------|---------|
| Glob | Pattern and path with match count |
| Grep | Pattern, path, and match count |

### 4.6 Task/Subagent Tool

**Display**:
- Summary of tool calls
- Link to child session
- Current step progress

### 4.7 Code Blocks

**Features**:
- Syntax highlighting with filetype detection
- Concealment toggle for inline code
- Language header

---

## 5. Navigation

### 5.1 Routes

| Route | Type | Description |
|-------|------|-------------|
| Home | `HomeRoute` | Initial landing with logo and prompt |
| Session | `SessionRoute` | Active conversation view |

### 5.2 Dialogs

**Features**:
- Stack-based dialog management
- Escape key closes dialog
- Focus restoration on close
- Dimmed background overlay
- Medium (60 chars) and Large (80 chars) sizes

### 5.3 Sidebar

**Sections**:
- Session title and share URL
- Context usage (tokens, cost)
- MCP servers status (collapsible)
- LSP servers status (collapsible)
- Todo list (collapsible)
- Modified files diff summary (collapsible)
- Getting started prompt for new users
- Working directory and version

**Toggle**: `ctrl+x b` or auto-show when width > 120

---

## 6. Keyboard Shortcuts

### 6.1 Global Keybindings

| Keybind | Default | Action |
|---------|---------|--------|
| leader | `ctrl+x` | Leader key prefix |
| app_exit | `ctrl+c,ctrl+d,<leader>q` | Exit application |
| command_list | `ctrl+p` | Show command palette |
| editor_open | `<leader>e` | Open external editor |
| session_new | `<leader>n` | New session |
| session_list | `<leader>l` | List sessions |
| session_interrupt | `escape` | Interrupt running agent |
| model_list | `<leader>m` | Select model |
| agent_list | `<leader>a` | Select agent |
| agent_cycle | `tab` | Next agent |
| agent_cycle_reverse | `shift+tab` | Previous agent |
| sidebar_toggle | `<leader>b` | Toggle sidebar |
| status_view | `<leader>s` | View status |

### 6.2 Session Keybindings

| Keybind | Default | Action |
|---------|---------|--------|
| session_timeline | `<leader>g` | Jump to message |
| session_compact | `<leader>c` | Compact session |
| session_export | `<leader>x` | Export transcript |
| messages_copy | `<leader>y` | Copy last assistant message |
| messages_undo | `<leader>u` | Undo message |
| messages_redo | `<leader>r` | Redo message |
| messages_page_up | `pageup` | Scroll up one page |
| messages_page_down | `pagedown` | Scroll down one page |
| messages_first | `ctrl+g,home` | Go to first message |
| messages_last | `ctrl+alt+g,end` | Go to last message |
| session_child_cycle | `<leader>right` | Next child session |
| session_child_cycle_reverse | `<leader>left` | Previous child session |
| session_parent | `<leader>up` | Go to parent session |

### 6.3 Input Keybindings

| Keybind | Default | Action |
|---------|---------|--------|
| input_submit | `return` | Submit prompt |
| input_newline | `shift+return,ctrl+return,alt+return,ctrl+j` | Insert newline |
| input_clear | `ctrl+c` | Clear input |
| input_paste | `ctrl+v` | Paste from clipboard |
| history_previous | `up` | Previous history item |
| history_next | `down` | Next history item |
| input_undo | `ctrl+-,super+z` | Undo edit |
| input_redo | `ctrl+.,super+shift+z` | Redo edit |
| variant_cycle | `ctrl+t` | Cycle model variants |

### 6.4 Leader Key

**Behavior**:
- Activates on leader key press (`ctrl+x` by default)
- Auto-deactivates after 2-second timeout
- Manages focus state during leader mode

---

## 7. Dialogs

### 7.1 Model Selection

**Features**:
- Favorites section
- Recent models section
- Provider-grouped models
- Fuzzy search with filtering
- `ctrl+f` to toggle favorite
- `ctrl+a` to connect new provider

### 7.2 Agent Selection

**Features**:
- Lists non-hidden, non-subagent agents
- Shows native vs custom description
- Current agent highlighted

### 7.3 MCP Toggle

**Features**:
- Toggle with spacebar
- Status indicators (enabled/disabled/loading)
- Alphabetically sorted servers

### 7.4 Status Dialog

**Sections**:
- MCP servers with status
- LSP servers
- Formatters
- Plugins

### 7.5 Timeline Dialog

**Features**:
- Lists user messages in reverse chronological order
- Shows message preview and timestamp
- Scrolls to selected message

### 7.6 Message Actions

**Actions**:
- Revert: Undo to this message
- Copy: Copy message text
- Fork: Create new session from this point

### 7.7 Stash Dialog

**Features**:
- Lists stashed prompts with preview
- Delete with `ctrl+d` twice confirmation
- Restore selected stash to prompt

---

## 8. Permission Handling

### 8.1 Permission Types

| Type | Description |
|------|-------------|
| `edit` | File modification (shows diff) |
| `read` | File read access |
| `glob` | File pattern search |
| `grep` | Content search |
| `list` | Directory listing |
| `bash` | Shell command execution |
| `task` | Subagent delegation |
| `webfetch` | Web requests |
| `websearch` | Web search |
| `codesearch` | Code search |
| `external_directory` | Access outside project |
| `doom_loop` | Continue after repeated failures |

### 8.2 Permission Options

| Option | Behavior |
|--------|----------|
| Allow once | One-time permission |
| Allow always | Persist until restart |
| Reject | Deny the operation |

### 8.3 Navigation

- Arrow keys (left/right or h/l) to select option
- Enter to confirm

---

## 9. Status Indicators

### 9.1 Loading/Streaming Spinner

**Display**:
- Animated spinner when agent is active
- Agent color-matched spinner
- Animations can be disabled via settings

### 9.2 Retry Status

**Display**:
- Error message with truncation
- Retry countdown in seconds
- Attempt number
- Click to expand full error

### 9.3 Interrupt Indicator

**Display**:
- "esc interrupt" when idle
- "esc again to interrupt" after first press
- Double-escape required for interrupt

### 9.4 Todo List

**Status Indicators**:
| Symbol | Status |
|--------|--------|
| `[ ]` | pending |
| `[•]` | in_progress |
| `[✓]` | completed |

### 9.5 Footer Status Bar

**Indicators**:
- Permission count with warning icon
- LSP server count
- MCP server count with error state
- `/status` hint

---

## 10. Additional Features

### 10.1 Prompt History

**Features**:
- Persisted to `prompt-history.jsonl`
- Maximum 50 entries
- Up/down arrows navigate
- Current input preserved at position 0

### 10.2 Prompt Stash

**Features**:
- Save prompts for later
- Pop last stash
- View stash list

### 10.3 Clipboard Integration

**Features**:
- OSC52 escape sequence for TMUX support
- Copy text selection on mouse release
- Image paste from clipboard

### 10.4 External Editor

**Trigger**: `ctrl+x e` or `/editor`

Opens prompt content in system editor (EDITOR env var)

### 10.5 Session Export

**Options**:
- Include thinking blocks
- Include tool details
- Include assistant metadata
- Custom filename
- Open in editor without saving

### 10.6 Revert/Redo System

**Features**:
- Revert to any user message
- Shows diff of reverted file changes
- Redo restores reverted messages

### 10.7 Context Token Display

**Display**:
- Token count
- Percentage of context used
- Cost in USD

### 10.8 Toast Notifications

**Variants**: info, success, warning, error

**Features**:
- Auto-dismiss with configurable duration
- Title and message

---

## User Preferences (via KV)

| Key | Values | Description |
|-----|--------|-------------|
| `sidebar` | "show" / "hide" / "auto" | Sidebar visibility |
| `thinking_visibility` | boolean | Show reasoning blocks |
| `timestamps` | "show" / "hide" | Message timestamps |
| `username_visible` | boolean | Show username |
| `tool_details_visibility` | boolean | Show tool details |
| `assistant_metadata_visibility` | boolean | Show model info |
| `scrollbar_visible` | boolean | Show scrollbar |
| `animations_enabled` | boolean | Enable animations |
| `tips_hidden` | boolean | Hide tips |
| `terminal_title_enabled` | boolean | Update terminal title |
