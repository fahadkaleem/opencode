# Gemini CLI Component Design Patterns Analysis

> SDK-Agnostic component patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI demonstrates mature, production-grade Ink component patterns:

- **Headless UI hook patterns** - Logic separated from presentation
- **Composition-based primitives** - Base components extended via render props
- **Centralized keyboard handling** - Context-based keypress management
- **Semantic theming** - Dynamic theme system with getter-based access
- **Complex state management** - Reducer-based text buffer, context-driven UI state
- **Virtualized rendering** - Performance-optimized list rendering

---

## 1. Shared Primitive Patterns

### TextInput Component

**File**: `packages/cli/src/ui/components/shared/TextInput.tsx:17-104`

**Pattern**: Controlled component consuming an external `TextBuffer` state object.

```typescript
export interface TextInputProps {
  buffer: TextBuffer;           // Controlled state from parent
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  focus?: boolean;              // Enables/disables keyboard handling
}
```

**Key Insights**:
- Uses `useCallback` for memoized event handlers
- Keyboard handling is conditional via `{ isActive: focus }`
- Visual cursor rendering with `chalk.inverse()` for terminal cursor simulation

### BaseSelectionList (Render Props Pattern)

**File**: `packages/cli/src/ui/components/shared/BaseSelectionList.tsx:21-179`

**Pattern**: Generic base component with render prop for custom item rendering.

```typescript
export interface BaseSelectionListProps<T, TItem extends SelectionListItem<T>> {
  items: TItem[];
  onSelect: (value: T) => void;
  onHighlight?: (value: T) => void;
  isFocused?: boolean;
  renderItem: (item: TItem, context: RenderItemContext) => React.ReactNode;
}
```

**Key Insights**:
- Generic type parameters allow type-safe value extraction
- Uses `useSelectionList` headless hook for all keyboard logic
- Scroll handling via local state + `useEffect`

### VirtualizedList

**File**: `packages/cli/src/ui/components/shared/VirtualizedList.tsx:69-502`

**Pattern**: High-performance virtualized rendering with imperative scroll API.

```typescript
export type VirtualizedListRef<T> = {
  scrollBy: (delta: number) => void;
  scrollTo: (offset: number) => void;
  scrollToEnd: () => void;
  scrollToIndex: (params: { index: number; viewOffset?: number }) => void;
  getScrollState: () => { scrollTop: number; scrollHeight: number };
};
```

**Key Insights**:
- Uses `forwardRef` with `useImperativeHandle` for imperative API
- Scroll anchor-based positioning for stable scrolling
- Height estimation for items not yet measured
- Automatic stick-to-bottom behavior detection

---

## 2. Props Interface Patterns

### Standard Props Structure

```typescript
interface ComponentProps {
  // Required behavior props first
  onSelect: (value: T) => void;

  // Optional behavior props with callbacks
  onHighlight?: (value: T) => void;
  onCancel?: () => void;

  // State/data props
  items: TItem[];

  // Focus/interaction control
  isFocused?: boolean;          // Default: true

  // Appearance customization
  placeholder?: string;
  showNumbers?: boolean;        // Default: true
  maxItemsToShow?: number;      // Default: 10

  // Dimensions
  width?: number;
  terminalWidth: number;
}
```

### Callback Patterns

**Submission callbacks**: Always receive the final value
```typescript
onSubmit?: (value: string) => void;
onSelect: (value: T) => void;
```

**Cancellation callbacks**: No arguments
```typescript
onCancel?: () => void;
```

**Change/highlight callbacks**: Receive new value for preview
```typescript
onHighlight?: (value: T) => void;
```

---

## 3. Component Composition Patterns

### Dialog Routing Pattern (DialogManager)

**File**: `packages/cli/src/ui/components/DialogManager.tsx:41-236`

**Pattern**: Sequential if-else chain for modal dialog rendering.

```typescript
export const DialogManager = ({ terminalWidth }: DialogManagerProps) => {
  const uiState = useUIState();

  // Dialogs are mutually exclusive - only one shown at a time
  if (uiState.showIdeRestartPrompt) {
    return <IdeTrustChangeDialog />;
  }
  if (uiState.isThemeDialogOpen) {
    return <ThemeDialog />;
  }
  // ...more dialogs

  return null; // No dialog active
};
```

### Message Type Components Pattern

**Pattern**: Consistent structure for message types with prefix icons.

```typescript
// All message components follow this pattern:
// 1. Fixed-width prefix area
// 2. Flex-grow content area
// 3. Theme-based colors

<Box flexDirection="row">
  <Box width={prefixWidth}>
    <Text color={theme.status.error}>{prefix}</Text>
  </Box>
  <Box flexGrow={1}>
    <Text wrap="wrap">{content}</Text>
  </Box>
</Box>
```

---

## 4. State Management in Components

### TextBuffer Reducer Pattern

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts:888-1557`

**Pattern**: Complex reducer with comprehensive action types.

```typescript
export type TextBufferAction =
  | { type: 'set_text'; payload: string }
  | { type: 'insert'; payload: string }
  | { type: 'backspace' }
  | { type: 'move'; payload: { dir: Direction } }
  | { type: 'undo' }
  | { type: 'redo' }
  // ... 30+ action types including vim operations
```

**Key Insights**:
- Separate state for logical lines and visual (wrapped) lines
- Undo/redo stack with snapshot approach
- Vim mode support via delegated handler

### Selection List Headless Hook

**File**: `packages/cli/src/ui/hooks/useSelectionList.ts:240-409`

**Pattern**: Headless hook encapsulating all keyboard and selection logic.

```typescript
export function useSelectionList<T>({
  items,
  onSelect,
  onHighlight,
  isFocused,
}: UseSelectionListOptions<T>): UseSelectionListResult {
  const [state, dispatch] = useReducer(selectionListReducer, initialState);

  useKeypress(handleKeypress, { isActive: !!(isFocused && items.length > 0) });

  return { activeIndex: state.activeIndex, setActiveIndex };
}
```

---

## 5. Recommendations for FloMaster CLI

### Core Primitives to Build

1. **TextInput** - Copy the buffer-based controlled pattern
2. **SelectionList** - Create headless hook + base component
3. **ScrollableContent** - For long outputs with keyboard shortcuts

### Component File Structure

```
components/
├── shared/                    # Primitives
│   ├── textInput.tsx
│   ├── textBuffer.ts
│   ├── baseSelectionList.tsx
│   ├── radioButtonSelect.tsx
│   └── virtualizedList.tsx
├── messages/                   # Message types
│   ├── userMessage.tsx
│   ├── assistantMessage.tsx
│   ├── toolMessage.tsx
│   └── errorMessage.tsx
├── dialogs/                    # Modal dialogs
│   ├── dialogManager.tsx
│   └── confirmDialog.tsx
└── layout/                     # Layout components
    ├── header.tsx
    └── footer.tsx
```

### Key Patterns to Adopt

| Pattern | Why |
|---------|-----|
| Headless hooks | Separate logic from presentation, enable testing |
| Render props for primitives | Maximum flexibility with type safety |
| Conditional `isActive` | Clean focus management |
| Semantic theme object | Dynamic theming support |
| Reducer for complex state | Predictable state updates, undo/redo |
