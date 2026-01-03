# Gemini CLI Component Inventory with Complexity Scores

> Complete inventory of SDK-agnostic UI components for Ink-based CLI

---

## Executive Summary

### Total Counts
- **Shared Primitives**: 10 components
- **Message Components**: 18 components
- **Dialog Components**: 12 components
- **Layout Components**: 2 layouts
- **View Components**: 6 components
- **Top-Level Components**: 20+ components
- **Hooks**: 45+ hooks

### Complexity Distribution

| Complexity | Count | Percentage |
|------------|-------|------------|
| Low        | ~35   | ~40%       |
| Medium     | ~35   | ~40%       |
| High       | ~18   | ~20%       |

---

## 1. Shared Primitives (`components/shared/`)

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **TextInput** | 105 | Medium | Yes | Cursor rendering, key handling, placeholder |
| **VirtualizedList** | 502 | High | Yes | Virtualized scrolling, dynamic heights, imperative API |
| **Scrollable** | 166 | Medium | Yes | Keyboard scrolling, auto-scroll-to-bottom |
| **BaseSelectionList** | 180 | Medium | Yes | Base render-prop component, scroll arrows |
| **MaxSizedBox** | 624 | High | Yes | Content truncation, overflow detection |
| **EnumSelector** | 88 | Low | Partial | Left-right enum scrolling |
| **RadioButtonSelect** | 92 | Low | Yes | Generic radio selection |
| **DescriptiveRadioButtonSelect** | 71 | Low | Yes | Radio with title + description |
| **ScrollableList** | 254 | High | Yes | VirtualizedList + animated scrollbar |
| **ScopeSelector** | 56 | Low | Partial | Settings scope selection |

---

## 2. Message Components (`components/messages/`)

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **ToolMessage** | 151 | Medium | Yes | Tool status display, focus hints |
| **ToolGroupMessage** | 202 | Medium | Yes | Groups multiple tool calls |
| **ToolResultDisplay** | 128 | Medium | Yes | Renders as markdown/diff/ANSI |
| **ToolShared** | 118 | Low | Yes | ToolStatusIndicator, ToolInfo components |
| **DiffRenderer** | 435 | High | Yes | Git diff parsing, syntax highlighting |
| **GeminiMessage** | 54 | Low | Partial | AI response with markdown |
| **UserMessage** | 46 | Low | Yes | User input display with prefix |
| **ErrorMessage** | 32 | Low | Yes | Error display with icon |
| **InfoMessage** | 42 | Low | Yes | Info display with inline markdown |
| **WarningMessage** | 33 | Low | Yes | Warning display with icon |
| **ModelMessage** | 22 | Low | No | Shows which model is responding |
| **Todo** | 193 | Medium | Yes | Todo list with status icons |
| **CompressionMessage** | ~40 | Low | Yes | Context compression notification |
| **ShellToolMessage** | ~180 | Medium | Partial | Shell-specific tool display |
| **ToolConfirmationMessage** | ~200 | Medium | Yes | Tool approval UI |
| **GeminiMessageContent** | ~60 | Low | Partial | AI content without prefix |
| **UserShellMessage** | ~50 | Low | Yes | Shell command display |

---

## 3. Dialog Components

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **SettingsDialog** | 1068 | High | Partial | Fuzzy search, settings editing, scopes |
| **ModelDialog** | 143 | Medium | No | Model selection with descriptions |
| **FolderTrustDialog** | 127 | Medium | Yes | Trust level selection |
| **SessionBrowser** | 935 | High | Yes | Session list, search, sort, pagination |
| **ThemeDialog** | ~300 | Medium | Yes | Theme selection with preview |
| **EditorSettingsDialog** | ~150 | Medium | Partial | External editor configuration |
| **DialogManager** | 237 | Medium | No | Dialog routing and state |
| **LoopDetectionConfirmation** | ~80 | Low | Yes | Loop detection prompt |
| **ShellConfirmationDialog** | ~100 | Low | Yes | Shell command approval |
| **ConsentPrompt** | ~80 | Low | Yes | Generic consent dialog |
| **PermissionsModifyTrustDialog** | ~200 | Medium | Yes | Trust modification UI |
| **MultiFolderTrustDialog** | ~150 | Medium | Yes | Multi-folder trust selection |

---

## 4. Layout Components (`layouts/`)

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **DefaultAppLayout** | 67 | Medium | Yes | Main app layout, dialog/composer routing |
| **ScreenReaderAppLayout** | ~60 | Low | Yes | Accessibility-focused layout |

---

## 5. View Components (`components/views/`)

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **ExtensionsList** | ~100 | Low | Yes | List of extensions |
| **ToolsList** | ~120 | Low | Yes | Available tools display |
| **McpStatus** | ~150 | Low | Yes | MCP server status |
| **ChatList** | ~80 | Low | Yes | Chat session list |
| **HooksList** | ~80 | Low | Yes | Active hooks display |

---

## 6. Top-Level Components

| Component | Lines | Complexity | SDK-Agnostic | Key Features |
|-----------|-------|------------|--------------|--------------|
| **InputPrompt** | 1197 | High | Yes | Multi-line input, completions, vim support |
| **MainContent** | 155 | Medium | Yes | History rendering, static vs virtualized |
| **Composer** | 189 | Medium | Partial | Input area orchestration |
| **Footer** | 187 | Medium | Partial | Status bar with path, model info |
| **Banner** | 71 | Low | Yes | Notification banner |
| **Help** | 196 | Low | Partial | Command and shortcut help |
| **LoadingIndicator** | 94 | Low | Yes | Spinner with cancel hint |
| **SuggestionsDisplay** | 131 | Medium | Yes | Autocomplete dropdown |
| **StickyHeader** | 74 | Low | Yes | Scrollable sticky header |
| **HistoryItemDisplay** | 168 | Medium | Yes | Message type router |
| **GeminiRespondingSpinner** | ~50 | Low | Yes | Animated spinner |
| **ShowMoreLines** | ~40 | Low | Yes | Truncation indicator |
| **Notifications** | ~100 | Low | Yes | Notification area |
| **ExitWarning** | ~50 | Low | Yes | Exit confirmation |
| **CopyModeWarning** | ~40 | Low | Yes | Copy mode indicator |
| **ThemedGradient** | ~60 | Low | Yes | Gradient text effect |
| **ContextSummaryDisplay** | ~100 | Low | Yes | Context files summary |
| **AutoAcceptIndicator** | ~40 | Low | Yes | Auto-accept mode indicator |

---

## 7. Hooks Inventory

### Input & Navigation Hooks

| Hook | Lines | Complexity | SDK-Agnostic |
|------|-------|------------|--------------|
| **useKeypress** | 37 | Low | Yes |
| **useInputHistory** | 112 | Medium | Yes |
| **useSelectionList** | 410 | High | Yes |
| **useMouse** | 37 | Low | Yes |
| **useMouseClick** | 43 | Low | Yes |

### Scroll & Display Hooks

| Hook | Lines | Complexity | SDK-Agnostic |
|------|-------|------------|--------------|
| **useBatchedScroll** | 36 | Low | Yes |
| **useAnimatedScrollbar** | 119 | Medium | Yes |
| **useTerminalSize** | 31 | Low | Yes |
| **useAlternateBuffer** | ~30 | Low | Yes |
| **useFlickerDetector** | ~50 | Low | Yes |

### Completion & Suggestion Hooks

| Hook | Lines | Complexity | SDK-Agnostic |
|------|-------|------------|--------------|
| **useCompletion** | 127 | Medium | Yes |
| **useSlashCompletion** | ~300 | High | Partial |
| **useAtCompletion** | ~250 | High | Yes |
| **usePromptCompletion** | ~100 | Medium | Yes |

### State Management Hooks

| Hook | Lines | Complexity | SDK-Agnostic |
|------|-------|------------|--------------|
| **useHistoryManager** | 166 | Medium | Yes |
| **useSessionBrowser** | ~200 | Medium | Yes |
| **useMessageQueue** | ~100 | Medium | Yes |
| **useConsoleMessages** | ~80 | Low | Yes |
| **useInputHistoryStore** | ~100 | Medium | Yes |

### Feature-Specific Hooks

| Hook | Lines | Complexity | SDK-Agnostic |
|------|-------|------------|--------------|
| **useShellHistory** | ~150 | Medium | Yes |
| **useFolderTrust** | ~100 | Medium | Yes |
| **useInactivityTimer** | ~50 | Low | Yes |
| **useTimer** | ~40 | Low | Yes |
| **usePhraseCycler** | ~80 | Low | Yes |
| **useLoadingIndicator** | ~60 | Low | Yes |
| **useBanner** | ~60 | Low | Yes |
| **useGitBranchName** | ~50 | Low | Yes |
| **useFocus** | ~40 | Low | Yes |
| **useBracketedPaste** | ~50 | Low | Yes |
| **useKittyKeyboardProtocol** | ~80 | Low | Yes |

---

## 8. Priority Implementation Order

### Phase 1: Foundation (Build First)

| Priority | Component | Reason |
|----------|-----------|--------|
| 1 | **useKeypress** | Core input handling |
| 2 | **useTerminalSize** | Layout responsiveness |
| 3 | **BaseSelectionList** | Base for all selection UIs |
| 4 | **RadioButtonSelect** | Common selection pattern |
| 5 | **Scrollable** | Basic scrolling |
| 6 | **TextInput** | Text entry foundation |

### Phase 2: Message Display

| Priority | Component | Reason |
|----------|-----------|--------|
| 7 | **UserMessage** | User input display |
| 8 | **ErrorMessage** | Error handling |
| 9 | **InfoMessage** | Status messages |
| 10 | **WarningMessage** | Warnings |
| 11 | **ToolShared** | Tool status indicators |
| 12 | **ToolResultDisplay** | Tool output rendering |

### Phase 3: Input & Completion

| Priority | Component | Reason |
|----------|-----------|--------|
| 13 | **useInputHistory** | History navigation |
| 14 | **useCompletion** | Suggestion state |
| 15 | **SuggestionsDisplay** | Autocomplete UI |
| 16 | **InputPrompt** | Full input experience |

### Phase 4: Scrolling & Virtualization

| Priority | Component | Reason |
|----------|-----------|--------|
| 17 | **useBatchedScroll** | Scroll performance |
| 18 | **useAnimatedScrollbar** | Visual polish |
| 19 | **VirtualizedList** | Large list performance |
| 20 | **ScrollableList** | Combined scroll + virtualization |

### Phase 5: Dialogs & Views

| Priority | Component | Reason |
|----------|-----------|--------|
| 21 | **DescriptiveRadioButtonSelect** | Dialog selections |
| 22 | **FolderTrustDialog** | Trust pattern (reusable) |
| 23 | **SessionBrowser** | Session management |

### Phase 6: Advanced Features

| Priority | Component | Reason |
|----------|-----------|--------|
| 24 | **MaxSizedBox** | Content truncation |
| 25 | **DiffRenderer** | Code diff display |
| 26 | **Todo** | Task tracking display |
| 27 | **useSelectionList** | Advanced selection logic |

---

## Components to Skip (Gemini-Specific)

- **AuthDialog / AuthInProgress** - Gemini auth flow
- **ProQuotaDialog** - Gemini quota handling
- **IdeIntegrationNudge** - Gemini IDE integration
- **ModelDialog** - Gemini model selection (pattern reusable)

---

## Key Patterns Identified

1. **Composition Pattern**: BaseSelectionList -> RadioButtonSelect
2. **Headless Hooks**: useSelectionList provides logic without UI
3. **Context Providers**: KeypressContext, MouseContext, UIStateContext
4. **Render Props**: MaxSizedBox uses children inspection
5. **Ref Forwarding**: VirtualizedList uses forwardRef
6. **Batched Updates**: useBatchedScroll prevents render storms
