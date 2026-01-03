# Gemini CLI Architecture Analysis - Consolidated Summary

> Comprehensive extraction of SDK-agnostic patterns for building FloMaster Ink CLI

---

## Overview

This analysis extracted reusable patterns from the Gemini CLI codebase (~1700+ lines in AppContainer alone, 85+ components, 55+ hooks) to inform the FloMaster CLI implementation. All Gemini-specific code (Google SDK, telemetry, authentication) has been filtered out.

---

## Analysis Documents

| Document | Focus Area | Key Patterns |
|----------|------------|--------------|
| [Package Architecture](./analysis-package-architecture.md) | Monorepo structure, entry points | Core/CLI separation, provider hierarchy |
| [Component Patterns](./analysis-component-patterns.md) | Primitive components, composition | Headless hooks, render props, composition |
| [Layout Patterns](./analysis-layout-patterns.md) | Flexbox layouts, responsive design | Fixed+scrollable, virtualization |
| [App Structure](./analysis-app-structure.md) | Bootstrapping, lifecycle | Provider composition, cleanup system |
| [Slash Commands](./analysis-slash-commands.md) | Command system design | Action returns, subcommands, completion |
| [Settings & Dialogs](./analysis-settings-dialogs.md) | Dialog routing, forms | DialogManager, selection hooks |
| [Theming](./analysis-theming.md) | Color system, themes | Semantic tokens, theme proxy |
| [State Management](./analysis-state-management.md) | Context architecture, reducers | UIState/UIActions split, history |
| [Keyboard Handling](./analysis-keyboard-handling.md) | Input system, key bindings | Pub/sub, key matchers, vim mode |
| [Component Inventory](./analysis-component-inventory.md) | Complete component list | Complexity scores, priority order |

---

## Top 10 Architectural Patterns to Adopt

### 1. UIState/UIActions Context Split
Separate read-only state from action handlers to prevent re-renders.

```typescript
<UIStateContext.Provider value={uiState}>
  <UIActionsContext.Provider value={uiActions}>
    <App />
  </UIActionsContext.Provider>
</UIStateContext.Provider>
```

### 2. Provider Composition Hierarchy
Nest providers in a specific order from outermost to innermost.

```
SettingsProvider → KeypressProvider → MouseProvider → ScrollProvider → AppContainer
```

### 3. Headless Selection Hook
`useSelectionList` provides keyboard navigation logic without any UI.

```typescript
const { activeIndex, setActiveIndex } = useSelectionList({
  items, onSelect, onHighlight, isFocused
});
```

### 4. Semantic Theme System
Purpose-driven color tokens accessed via getter proxy.

```typescript
<Text color={theme.status.error}>Error</Text>
<Box borderColor={theme.border.focused} />
```

### 5. Key Matchers System
Data-driven keyboard bindings with Command enum.

```typescript
if (keyMatchers[Command.SUBMIT](key)) handleSubmit();
if (keyMatchers[Command.ESCAPE](key)) handleCancel();
```

### 6. Discriminated Union History Items
Type-safe message handling with exhaustive checking.

```typescript
type Message = UserMessage | AssistantMessage | ToolMessage | ErrorMessage;
```

### 7. DialogManager Routing
Priority-based if-else chain for modal dialogs.

```typescript
if (state.isThemeDialogOpen) return <ThemeDialog />;
if (state.isSettingsDialogOpen) return <SettingsDialog />;
return null;
```

### 8. Slash Command Interface
Commands with actions, completion, and subcommands.

```typescript
interface SlashCommand {
  name: string;
  action: (ctx, args) => ActionReturn;
  completion?: (ctx, partial) => string[];
  subCommands?: SlashCommand[];
}
```

### 9. Fixed + Scrollable Layout
Input area stays fixed, content scrolls above it.

```tsx
<Box flexDirection="column" height="100%">
  <MainContent flexGrow={1} />
  <InputArea flexShrink={0} />
</Box>
```

### 10. Cleanup Registration System
Register cleanup functions early, execute on exit.

```typescript
registerCleanup(() => instance.unmount());
registerCleanup(consolePatcher.cleanup);
// On exit: await runExitCleanup();
```

---

## Component Priority Order

### Phase 1: Foundation
1. `useKeypress` - Core input handling
2. `useTerminalSize` - Layout responsiveness
3. `BaseSelectionList` - Selection base
4. `RadioButtonSelect` - Common selection
5. `Scrollable` - Basic scrolling
6. `TextInput` - Text entry

### Phase 2: Messages
7. `UserMessage` - User input display
8. `ErrorMessage` - Error handling
9. `InfoMessage` - Status messages
10. `ToolShared` - Tool indicators
11. `ToolResultDisplay` - Output rendering

### Phase 3: Input
12. `useInputHistory` - History navigation
13. `useCompletion` - Suggestion state
14. `SuggestionsDisplay` - Autocomplete UI
15. `InputPrompt` - Full input

### Phase 4: Performance
16. `VirtualizedList` - Large list performance
17. `ScrollableList` - Scroll + virtualization

---

## Recommended Directory Structure

```
packages/cli/src/
├── flo.tsx                     # Entry point
├── nonInteractive.ts           # Non-interactive mode
├── config/
│   ├── config.ts               # CLI config
│   ├── settings.ts             # User settings
│   ├── settingsSchema.ts       # Settings schema
│   └── keyBindings.ts          # Key bindings
├── ui/
│   ├── App.tsx                 # Root component
│   ├── AppContainer.tsx        # State container
│   ├── contexts/
│   │   ├── UIStateContext.tsx
│   │   ├── UIActionsContext.tsx
│   │   ├── KeypressContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/
│   │   ├── useKeypress.ts
│   │   ├── useSelectionList.ts
│   │   ├── useHistoryManager.ts
│   │   ├── useTerminalSize.ts
│   │   └── useSlashCommand.ts
│   ├── components/
│   │   ├── shared/
│   │   │   ├── TextInput.tsx
│   │   │   ├── BaseSelectionList.tsx
│   │   │   ├── RadioButtonSelect.tsx
│   │   │   └── VirtualizedList.tsx
│   │   ├── messages/
│   │   │   ├── UserMessage.tsx
│   │   │   ├── AssistantMessage.tsx
│   │   │   ├── ToolMessage.tsx
│   │   │   └── ErrorMessage.tsx
│   │   └── dialogs/
│   │       ├── DialogManager.tsx
│   │       └── ConfirmDialog.tsx
│   ├── layouts/
│   │   └── DefaultLayout.tsx
│   ├── commands/
│   │   └── types.ts
│   ├── themes/
│   │   ├── theme-manager.ts
│   │   ├── semantic-tokens.ts
│   │   └── default.ts
│   └── utils/
│       ├── keyMatchers.ts
│       └── cleanup.ts
├── commands/                   # CLI subcommands
└── utils/
```

---

## Key File References

| Pattern | Primary File | Lines |
|---------|-------------|-------|
| Entry Point | `packages/cli/src/gemini.tsx` | 214-245 |
| AppContainer | `packages/cli/src/ui/AppContainer.tsx` | 1726 total |
| UIStateContext | `packages/cli/src/ui/contexts/UIStateContext.tsx` | 44-139 |
| UIActionsContext | `packages/cli/src/ui/contexts/UIActionsContext.tsx` | 17-59 |
| KeypressProvider | `packages/cli/src/ui/contexts/KeypressContext.tsx` | 562-624 |
| DialogManager | `packages/cli/src/ui/components/DialogManager.tsx` | 41-236 |
| useSelectionList | `packages/cli/src/ui/hooks/useSelectionList.ts` | 240-409 |
| TextBuffer | `packages/cli/src/ui/components/shared/text-buffer.ts` | 888-1557 |
| VirtualizedList | `packages/cli/src/ui/components/shared/VirtualizedList.tsx` | 69-502 |
| ThemeManager | `packages/cli/src/ui/themes/theme-manager.ts` | 39-331 |
| SlashCommand types | `packages/cli/src/ui/commands/types.ts` | 160-196 |

---

## Complexity Summary

| Category | Low | Medium | High | Total |
|----------|-----|--------|------|-------|
| Shared Primitives | 4 | 3 | 3 | 10 |
| Message Components | 10 | 6 | 2 | 18 |
| Dialog Components | 4 | 5 | 3 | 12 |
| Layout Components | 1 | 1 | 0 | 2 |
| View Components | 5 | 1 | 0 | 6 |
| Top-Level | 12 | 7 | 1 | 20 |
| Hooks | 20 | 18 | 7 | 45 |
| **Total** | **56** | **41** | **16** | **113** |

---

## Next Steps

1. **Create tech specs** for each component based on these patterns
2. **Build foundation** (Phase 1 components) first
3. **Iterate on messages** (Phase 2) for core chat functionality
4. **Add input features** (Phase 3) for completions
5. **Optimize** (Phase 4) with virtualization

---

*Generated: December 31, 2024*
*Source: Gemini CLI at `examplecode/gemini-cli/`*
