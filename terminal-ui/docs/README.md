# OpenCode TUI Documentation

> Complete technical documentation of the OpenCode terminal user interface for migration to Ink (React).

---

## Overview

This documentation captures the complete architecture, components, and behavior of the OpenCode TUI built with **SolidJS + OpenTUI**. It serves as the reference specification for building an equivalent interface using **Ink (React)** with components from the **Gemini CLI** codebase.

### Technology Stack

| Current | Target |
|---------|--------|
| SolidJS | React |
| OpenTUI | Ink |
| OpenTUI primitives | Ink + Gemini CLI components |

---

## Documentation Index

| # | Document | Description | Lines |
|---|----------|-------------|-------|
| 01 | [Component Inventory](./01-component-inventory.md) | All 55 components organized by category, OpenTUI primitives, Ink mapping | 212 |
| 02 | [SDK Integration](./02-sdk-integration.md) | SDK types, event handlers, API methods, data flow patterns | 295 |
| 03 | [State Management](./03-state-management.md) | All 15 context providers with state shapes, methods, dependencies | 569 |
| 04 | [Features & Functionality](./04-features-functionality.md) | All features, dialogs, permissions, keyboard shortcuts | 513 |
| 05 | [Data Flow Architecture](./05-data-flow-architecture.md) | SSE event flow, batching, store schema, lifecycles | 368 |
| 06 | [Session View Specification](./06-session-view-specification.md) | Layout structure, message rendering, tool visualizations | 255 |
| 07 | [Prompt Input System](./07-prompt-input-system.md) | Prompt component, autocomplete, history, input modes | 200 |
| 08 | [Theme & Styling](./08-theme-styling-system.md) | Color tokens, 32 themes, context API | 185 |
| 09 | [Dialog System](./09-dialog-system.md) | Stack-based dialogs, UI primitives, feature dialogs | 160 |
| 10 | [Keyboard Shortcuts](./10-keyboard-shortcuts.md) | Leader key pattern, all keybindings | 148 |

---

## Quick Reference

### Component Count

| Category | Count |
|----------|-------|
| Context Providers | 12 |
| UI Primitives | 10 |
| Reusable Components | 16 |
| Prompt Components | 4 |
| Route Components | 10 |
| Utilities | 3 |
| **Total** | **55** |

### OpenTUI → Ink Mapping

| OpenTUI | Ink Equivalent | Source |
|---------|----------------|--------|
| `<box>` | `<Box>` | ink |
| `<text>` | `<Text>` | ink |
| `<scrollbox>` | `VirtualizedList` | gemini-cli |
| `<input>` | `TextInput` | @inkjs/ui |
| `<code>` | `CodeColorizer` | gemini-cli |
| `<diff>` | `DiffRenderer` | gemini-cli |
| `useKeyboard` | `useInput` | ink |

### Provider Nesting Order

```
ArgsProvider → ExitProvider → KVProvider → ToastProvider → RouteProvider
  → SDKProvider → SyncProvider → ThemeProvider → LocalProvider
  → KeybindProvider → PromptStashProvider → DialogProvider
  → CommandProvider → PromptHistoryProvider → PromptRefProvider → <App />
```

### Key Patterns

1. **SSE Event Batching**: 16ms debounce for render optimization
2. **Binary Search**: O(log n) for sorted collection updates
3. **Leader Key**: Vim-style two-key sequences (e.g., `ctrl+x` then `l`)
4. **SDK Client-Server**: All business logic on server, UI is display layer

---

## Migration Strategy

### Phase 1: Core Infrastructure
- SDK client (stays the same)
- Context providers (convert to React contexts)
- State management (zustand or useReducer)

### Phase 2: UI Primitives
- Replace OpenTUI primitives with Ink equivalents
- Port VirtualizedList, CodeColorizer, DiffRenderer from Gemini CLI

### Phase 3: Feature Components
- Dialogs (port DialogSelect, DialogPrompt patterns)
- Prompt input with autocomplete
- Session view with message rendering

### Phase 4: Polish
- Theme system
- Keyboard shortcuts
- Accessibility

---

## Source Files

Base path: `packages/opencode/src/cli/cmd/tui/`

```
tui/
├── app.tsx              # Main application entry
├── context/             # All context providers
├── ui/                  # UI primitives (dialog, toast, etc.)
├── component/           # Reusable components
│   └── prompt/          # Prompt input system
├── routes/              # Route components
│   └── session/         # Session view (~1800 lines)
└── util/                # Utilities (clipboard, editor, etc.)
```

---

## Gemini CLI Components to Port

From `/Users/fahadkaleem/Documents/Workspace/gitrepos/gemini-cli/`:

| Component | Path | Purpose |
|-----------|------|---------|
| VirtualizedList | `src/components/VirtualizedList.tsx` | Scrolling for large lists |
| DiffRenderer | `src/components/DiffRenderer.tsx` | Unified/split diff display |
| CodeColorizer | `src/components/CodeColorizer.tsx` | Syntax highlighting |
| TextInput | `src/components/TextInput.tsx` | Multi-line input with history |
| DialogManager | `src/components/DialogManager.tsx` | Modal dialog system |

---

## Coverage Assessment

| Feature | OpenTUI | Ink + Gemini CLI |
|---------|---------|------------------|
| Layout (box) | ✓ | ✓ Ink Box |
| Text rendering | ✓ | ✓ Ink Text |
| Scrollable lists | ✓ | ✓ VirtualizedList |
| Text input | ✓ | ✓ TextInput |
| Syntax highlighting | ✓ | ✓ CodeColorizer |
| Diff viewer | ✓ | ✓ DiffRenderer |
| Keyboard handling | ✓ | ✓ useInput |
| Terminal dimensions | ✓ | ✓ useStdout |

**Coverage: ~100%** - All required components are available between Ink core and Gemini CLI.
