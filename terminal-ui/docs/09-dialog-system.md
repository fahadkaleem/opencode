# Dialog System: OpenCode TUI

## Overview

Stack-based modal dialog system with keyboard navigation and focus management.

---

## Core Architecture

### DialogProvider (`ui/dialog.tsx`)

**State**:
```typescript
{
  stack: { element: JSX.Element; onClose?: () => void }[],
  size: "medium" | "large"
}
```

**Methods**:
| Method | Description |
|--------|-------------|
| `clear()` | Close all dialogs |
| `replace(element, onClose?)` | Replace stack with new dialog |
| `setSize(size)` | Change size ("medium": 60, "large": 80 chars) |

**Keyboard**: Escape closes topmost dialog

---

## UI Primitives

### DialogAlert
- Info message with OK button
- `DialogAlert.show(dialog, title, message): Promise<void>`

### DialogConfirm
- Yes/No confirmation
- Left/Right to toggle, Enter to confirm
- `DialogConfirm.show(dialog, title, message): Promise<boolean>`

### DialogPrompt
- Text input collection
- `DialogPrompt.show(dialog, title, options?): Promise<string | null>`

### DialogSelect
- Filterable list selection
- Up/Down/PageUp/PageDown navigation
- Fuzzy search filtering
- Category grouping
- Custom keybinds per option

### DialogHelp
- Help information display

### DialogExportOptions
- Export configuration form
- Checkboxes for options

---

## Feature Dialogs

| Dialog | Purpose | Keybind |
|--------|---------|---------|
| DialogCommand | Command palette | `ctrl+p` |
| DialogAgent | Agent selection | `<leader>a` |
| DialogModel | Model selection | `<leader>m` |
| DialogProvider | Provider connection | - |
| DialogMcp | MCP server toggle | - |
| DialogSessionList | Session browser | `<leader>l` |
| DialogSessionRename | Rename session | - |
| DialogStash | Stash management | - |
| DialogStatus | System status | `<leader>s` |
| DialogThemeList | Theme selection | `<leader>t` |

---

## Session Dialogs

| Dialog | Purpose |
|--------|---------|
| DialogTimeline | Message history browser |
| DialogForkFromTimeline | Fork from message |
| DialogMessage | Message actions (revert, copy, fork) |
| DialogSubagent | Subagent session navigation |

---

## Keyboard Shortcuts

### Global
| Key | Action |
|-----|--------|
| Escape | Close current dialog |

### DialogSelect Navigation
| Key | Action |
|-----|--------|
| Up/Ctrl+P | Previous item |
| Down/Ctrl+N | Next item |
| PageUp | Jump up 10 |
| PageDown | Jump down 10 |
| Enter | Select |
| Type | Filter |

### Dialog-Specific
| Dialog | Key | Action |
|--------|-----|--------|
| DialogModel | Ctrl+A | Connect provider |
| DialogModel | Ctrl+F | Toggle favorite |
| DialogMcp | Space | Toggle server |
| DialogSessionList | Ctrl+D | Delete (2x) |
| DialogSessionList | Ctrl+R | Rename |
| DialogStash | Ctrl+D | Delete (2x) |

---

## Usage Pattern

```typescript
// Open dialog
dialog.replace(() => <DialogSessionList />)

// With cleanup
dialog.replace(
  () => <MyDialog />,
  () => { /* cleanup on close */ }
)

// Set size
dialog.setSize("large")

// Close
dialog.clear()
```

---

## Flow Patterns

### Provider Connection
```
DialogProvider → Auth Method → AutoMethod/CodeMethod/ApiMethod → DialogModel
```

### Session Management
```
DialogSessionList → Ctrl+R → DialogSessionRename
                 → Enter → Navigate to session
                 → Ctrl+D×2 → Delete
```

### Timeline/Fork
```
DialogTimeline → Enter → DialogMessage → Revert/Copy/Fork
DialogForkFromTimeline → Enter → Create forked session
```
