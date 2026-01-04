# Keyboard Shortcuts: OpenCode TUI

## Overview

Configurable keybindings with leader key support (Vim-style).

---

## Leader Key

Default: `ctrl+x`

**Pattern**:
1. Press leader key
2. 2-second timeout starts
3. Press second key (e.g., `l` for session list)

---

## Global Shortcuts

| Keybind | Default | Action |
|---------|---------|--------|
| `leader` | `ctrl+x` | Leader key |
| `app_exit` | `ctrl+c,ctrl+d,<leader>q` | Exit app |
| `command_list` | `ctrl+p` | Command palette |
| `editor_open` | `<leader>e` | External editor |
| `status_view` | `<leader>s` | Status dialog |

---

## Session Shortcuts

| Keybind | Default | Action |
|---------|---------|--------|
| `session_new` | `<leader>n` | New session |
| `session_list` | `<leader>l` | Session list |
| `session_timeline` | `<leader>g` | Message timeline |
| `session_compact` | `<leader>c` | Compact session |
| `session_export` | `<leader>x` | Export session |
| `session_interrupt` | `escape` | Interrupt |
| `sidebar_toggle` | `<leader>b` | Toggle sidebar |

---

## Message Navigation

| Keybind | Default | Action |
|---------|---------|--------|
| `messages_page_up` | `pageup` | Page up |
| `messages_page_down` | `pagedown` | Page down |
| `messages_half_page_up` | `ctrl+alt+u` | Half page up |
| `messages_half_page_down` | `ctrl+alt+d` | Half page down |
| `messages_first` | `ctrl+g,home` | First message |
| `messages_last` | `ctrl+alt+g,end` | Last message |
| `messages_copy` | `<leader>y` | Copy message |
| `messages_undo` | `<leader>u` | Undo |
| `messages_redo` | `<leader>r` | Redo |

---

## Model/Agent Shortcuts

| Keybind | Default | Action |
|---------|---------|--------|
| `model_list` | `<leader>m` | Model selection |
| `model_cycle_recent` | `f2` | Next recent model |
| `agent_list` | `<leader>a` | Agent selection |
| `agent_cycle` | `tab` | Next agent |
| `agent_cycle_reverse` | `shift+tab` | Previous agent |
| `variant_cycle` | `ctrl+t` | Cycle variants |

---

## Input Shortcuts

| Keybind | Default | Action |
|---------|---------|--------|
| `input_submit` | `return` | Submit |
| `input_newline` | `shift+return,ctrl+j` | New line |
| `input_clear` | `ctrl+c` | Clear |
| `input_paste` | `ctrl+v` | Paste |
| `history_previous` | `up` | Previous history |
| `history_next` | `down` | Next history |

---

## Input Movement

| Keybind | Default | Action |
|---------|---------|--------|
| `input_move_left` | `left,ctrl+b` | Left |
| `input_move_right` | `right,ctrl+f` | Right |
| `input_line_home` | `ctrl+a` | Line start |
| `input_line_end` | `ctrl+e` | Line end |
| `input_word_forward` | `alt+f` | Word forward |
| `input_word_backward` | `alt+b` | Word backward |
| `input_buffer_home` | `home` | Buffer start |
| `input_buffer_end` | `end` | Buffer end |

---

## Input Editing

| Keybind | Default | Action |
|---------|---------|--------|
| `input_backspace` | `backspace` | Backspace |
| `input_delete` | `ctrl+d,delete` | Delete |
| `input_delete_line` | `ctrl+shift+d` | Delete line |
| `input_delete_to_line_end` | `ctrl+k` | Delete to EOL |
| `input_delete_to_line_start` | `ctrl+u` | Delete to SOL |
| `input_delete_word_forward` | `alt+d` | Delete word forward |
| `input_delete_word_backward` | `ctrl+w` | Delete word backward |
| `input_undo` | `ctrl+-,super+z` | Undo |
| `input_redo` | `ctrl+.,super+shift+z` | Redo |

---

## Dialog Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close dialog |
| `Up` / `Ctrl+P` | Previous item |
| `Down` / `Ctrl+N` | Next item |
| `PageUp` | Jump up 10 |
| `PageDown` | Jump down 10 |
| `Enter` | Select |

---

## Configuration

In `opencode.json`:

```json
{
  "keybinds": {
    "leader": "ctrl+space",
    "session_list": "<leader>s",
    "model_list": "ctrl+m"
  }
}
```

**Disable**: Set to `"none"`
**Multiple**: Use comma: `"ctrl+c,ctrl+d"`
