# Prompt Input System: OpenCode TUI

## Overview

The Prompt Input System handles user text input, autocomplete suggestions, paste handling (including images), history navigation, and prompt stashing.

---

## Core Components

### 1. Prompt (`component/prompt/index.tsx`)

**Props**:
```typescript
type PromptProps = {
  sessionID?: string
  visible?: boolean
  disabled?: boolean
  onSubmit?: () => void
  ref?: (ref: PromptRef) => void
  hint?: JSX.Element
  showPlaceholder?: boolean
}
```

**Ref API**:
```typescript
type PromptRef = {
  focused: boolean
  current: PromptInfo
  set(prompt: PromptInfo): void
  reset(): void
  blur(): void
  focus(): void
  submit(): void
}
```

**State**:
```typescript
{
  prompt: PromptInfo
  mode: "normal" | "shell"
  extmarkToPartIndex: Map<number, number>
  interrupt: number
  placeholder: number
}
```

### 2. Autocomplete (`component/prompt/autocomplete.tsx`)

**Triggers**:
- `@` → File/agent suggestions
- `/` at start → Command suggestions

**Features**:
- Fuzzy search with fuzzysort
- Line range syntax: `@file.ts#10-20`
- Agent references: `@agent-name`
- Up to 10 results

### 3. PromptHistory (`component/prompt/history.tsx`)

**Storage**: `{state}/prompt-history.jsonl`
**Max entries**: 50

**Methods**:
- `move(direction, input)` - Navigate history
- `append(item)` - Add entry

### 4. PromptStash (`component/prompt/stash.tsx`)

**Storage**: `{state}/prompt-stash.jsonl`
**Max entries**: 50

**Methods**:
- `list()` - All entries
- `push(entry)` - Add entry
- `pop()` - Remove and return last
- `remove(index)` - Remove at index

---

## Input Modes

| Mode | Trigger | SDK Call |
|------|---------|----------|
| Normal | Default | `session.prompt()` |
| Shell | `!` prefix | `session.shell()` |
| Command | `/` prefix | `session.command()` |

---

## Slash Commands

| Command | Action |
|---------|--------|
| `/undo`, `/redo` | Message control |
| `/compact`, `/summarize` | Session compression |
| `/share`, `/unshare` | Session sharing |
| `/rename` | Session rename |
| `/copy`, `/export` | Transcript export |
| `/timeline`, `/fork` | Message navigation |
| `/thinking` | Toggle reasoning display |
| `/new`, `/clear` | New session |
| `/models`, `/agents` | Selection dialogs |
| `/session`, `/resume` | Session list |
| `/status`, `/mcp` | System status |
| `/theme`, `/editor` | Preferences |
| `/connect` | Provider connection |
| `/help`, `/commands` | Help |
| `/exit`, `/quit`, `/q` | Exit |

---

## Paste Handling

### Text Paste
1. Normalize line endings
2. Detect file paths
3. For long text (3+ lines or 150+ chars): Create summarized extmark

### Image Paste
- Supported: PNG, JPEG, GIF, WebP
- SVG handled as text
- Creates `[Image N]` virtual text
- Stores base64 data URL

---

## Keyboard Shortcuts

### Navigation
| Key | Action |
|-----|--------|
| Up/Down | History navigation (at edges) |
| Ctrl+B/F | Move left/right |
| Ctrl+A/E | Line home/end |
| Alt+F/B | Word forward/backward |
| Home/End | Buffer start/end |

### Editing
| Key | Action |
|-----|--------|
| Ctrl+K | Delete to line end |
| Ctrl+U | Delete to line start |
| Ctrl+W | Delete word backward |
| Alt+D | Delete word forward |
| Ctrl+-/. | Undo/Redo |

### Submission
| Key | Action |
|-----|--------|
| Enter | Submit |
| Shift/Ctrl/Alt+Enter | New line |
| Ctrl+C | Clear (or exit if empty) |

---

## Extmark System

Tracks special content (files, agents, pasted text) with positions that update as text is edited.

**Registration**: `input.extmarks.registerType("prompt-part")`

**Style IDs**:
- `extmark.file` - File references
- `extmark.agent` - Agent references
- `extmark.paste` - Pasted content

---

## Submit Flow

1. **Validation**: Check disabled, autocomplete, input content
2. **Session creation**: Create if no sessionID
3. **Text expansion**: Expand pasted text parts inline
4. **Mode handling**: Call appropriate SDK method
5. **Cleanup**: Append to history, clear prompt, navigate

---

## External Editor

**Trigger**: `<leader>e` or `/editor`

Opens `$VISUAL` or `$EDITOR` with prompt content. On close, content is restored to prompt.

---

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `input_submit` | `return` | Submit prompt |
| `input_newline` | `shift+return,...` | Insert newline |
| `input_clear` | `ctrl+c` | Clear input |
| `history_previous` | `up` | Previous history |
| `history_next` | `down` | Next history |
