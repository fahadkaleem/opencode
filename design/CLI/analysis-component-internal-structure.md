# Gemini CLI Component Internal Structure Analysis

This document provides an in-depth analysis of component internal structure patterns found in the Gemini CLI codebase, examining 7 representative components for consistent patterns and best practices.

---

## Table of Contents

1. [Component File Organization](#1-component-file-organization)
2. [Props Interface Patterns](#2-props-interface-patterns)
3. [Internal State Patterns](#3-internal-state-patterns)
4. [Effect Patterns](#4-effect-patterns)
5. [Render Patterns](#5-render-patterns)
6. [Recommendations for FloMaster](#6-recommendations-for-flomaster)

---

## 1. Component File Organization

### Import Order Pattern

All components follow a consistent import ordering:

```typescript
// 1. License header (always first)
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 2. React imports (type-only where possible)
import type React from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// 3. External library imports
import { Box, Text } from 'ink';
import chalk from 'chalk';

// 4. Internal imports - UI layer (hooks, contexts, components)
import { useKeypress } from '../../hooks/useKeypress.js';
import { theme } from '../../semantic-colors.js';
import { StickyHeader } from '../StickyHeader.js';

// 5. Internal imports - Core layer
import type { Config } from '@google/gemini-cli-core';

// 6. Type-only imports (grouped at end or with their sources)
import type { Key } from '../../hooks/useKeypress.js';
import type { TextBuffer } from './text-buffer.js';
```

**File References:**
- `TextInput.tsx` (lines 7-15): Clean separation of type imports
- `InputPrompt.tsx` (lines 7-49): Extensive imports following pattern
- `VirtualizedList.tsx` (lines 7-22): React hooks grouped together

### Types Definition Location

**Pattern 1: Inline Props Interface (Most Common)**

Types are defined directly after imports, before the component:

```typescript
// From TextInput.tsx (lines 17-23)
export interface TextInputProps {
  buffer: TextBuffer;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  focus?: boolean;
}
```

**Pattern 2: Separate Type File for Complex State**

For complex state management, types are colocated in a separate file:

```typescript
// From text-buffer.ts - Complex types in dedicated file
export interface TextBufferState {
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  preferredCol: number | null;
  undoStack: UndoHistoryEntry[];
  // ... many more fields
}
```

**Pattern 3: Re-exported Types from Shared Components**

```typescript
// From ToolMessage.tsx (line 30)
export type { TextEmphasis };

// From ToolShared.tsx (lines 21-23)
export const STATUS_INDICATOR_WIDTH = 3;
export type TextEmphasis = 'high' | 'medium' | 'low';
```

### Helper Functions Organization

**Pattern: Helper functions defined BEFORE component, after types**

```typescript
// From VirtualizedList.tsx (lines 57-67)
function findLastIndex<T>(
  array: T[],
  predicate: (value: T, index: number, obj: T[]) => unknown,
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i]!, i, array)) {
      return i;
    }
  }
  return -1;
}

// Then the component
function VirtualizedList<T>(props: VirtualizedListProps<T>, ref: React.Ref<...>) {
  // ...
}
```

**Pattern: Pure utility functions exported for testing**

```typescript
// From InputPrompt.tsx (lines 56-63, 92-105)
export function isTerminalPasteTrusted(kittyProtocolSupported: boolean): boolean {
  return kittyProtocolSupported;
}

export const calculatePromptWidths = (mainContentWidth: number) => {
  const FRAME_PADDING_AND_BORDER = 4;
  const PROMPT_PREFIX_WIDTH = 2;
  // ...
  return { inputWidth, containerWidth, suggestionsWidth, frameOverhead } as const;
};
```

### Hooks Placement in Components

Hooks are placed at the TOP of the component function, organized by purpose:

```typescript
// From InputPrompt.tsx - Hook organization pattern
export const InputPrompt: React.FC<InputPromptProps> = (props) => {
  // 1. Context hooks first
  const kittyProtocol = useKittyKeyboardProtocol();
  const isShellFocused = useShellFocusState();
  const { setEmbeddedShellFocused } = useUIActions();
  const { mainAreaWidth } = useUIState();

  // 2. State hooks
  const [justNavigatedHistory, setJustNavigatedHistory] = useState(false);
  const [showEscapePrompt, setShowEscapePrompt] = useState(false);
  const [reverseSearchActive, setReverseSearchActive] = useState(false);

  // 3. Ref hooks
  const escPressCount = useRef(0);
  const escapeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const innerBoxRef = useRef<DOMElement>(null);

  // 4. Custom hooks (derived state)
  const completion = useCommandCompletion(buffer, ...);
  const reverseSearchCompletion = useReverseSearchCompletion(...);

  // 5. Computed values (useMemo, useCallback come later)
  const showCursor = focus && isShellFocused && !isEmbeddedShellFocused;

  // 6. useCallback definitions
  const resetEscapeState = useCallback(() => { ... }, []);
  const handleSubmit = useCallback((value) => { ... }, [...]);

  // 7. useEffect hooks (after callbacks)
  useEffect(() => { ... }, [deps]);

  // 8. Render
  return (...);
};
```

---

## 2. Props Interface Patterns

### Optional vs Required Props

**Pattern: Required props first, optional with defaults in destructuring**

```typescript
// From TextInput.tsx (lines 17-31)
export interface TextInputProps {
  buffer: TextBuffer;           // Required - no ?
  placeholder?: string;         // Optional
  onSubmit?: (value: string) => void;  // Optional callback
  onCancel?: () => void;        // Optional callback
  focus?: boolean;              // Optional with default
}

export function TextInput({
  buffer,                       // Required - no default
  placeholder = '',             // Default value
  onSubmit,                     // No default (will be undefined)
  onCancel,
  focus = true,                 // Default value
}: TextInputProps): React.JSX.Element {
```

### Callback Prop Naming Conventions

**Pattern: `on` + Action verb (PascalCase)**

```typescript
// From BaseSelectionList.tsx (lines 21-34)
export interface BaseSelectionListProps<T, TItem> {
  onSelect: (value: T) => void;      // Required action callback
  onHighlight?: (value: T) => void;  // Optional action callback
  renderItem: (item: TItem, context: RenderItemContext) => React.ReactNode;
}

// From InputPrompt.tsx
export interface InputPromptProps {
  onSubmit: (value: string) => void;
  onClearScreen: () => void;
  onEscapePromptChange?: (showPrompt: boolean) => void;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
}
```

### Generic Type Parameter Usage

**Pattern: Generics for reusable list components**

```typescript
// From VirtualizedList.tsx (lines 25-55)
type VirtualizedListProps<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  estimatedItemHeight: (index: number) => number;
  keyExtractor: (item: T, index: number) => string;
  initialScrollIndex?: number;
  initialScrollOffsetInIndex?: number;
  scrollbarThumbColor?: string;
};

export type VirtualizedListRef<T> = {
  scrollBy: (delta: number) => void;
  scrollToItem: (params: { item: T; viewOffset?: number }) => void;
  // ...
};
```

**Pattern: Constrained generics for type safety**

```typescript
// From BaseSelectionList.tsx (lines 21-34, 50-63)
export interface BaseSelectionListProps<
  T,
  TItem extends SelectionListItem<T> = SelectionListItem<T>,
> {
  items: TItem[];
  // TItem must satisfy SelectionListItem<T>
}

export function BaseSelectionList<
  T,
  TItem extends SelectionListItem<T> = SelectionListItem<T>,
>({ items, ... }: BaseSelectionListProps<T, TItem>): React.JSX.Element {
```

### Extended Props Pattern

**Pattern: Interface extension for composition**

```typescript
// From ToolMessage.tsx (lines 32-44)
export interface ToolMessageProps extends IndividualToolCallDisplay {
  availableTerminalHeight?: number;
  terminalWidth: number;
  emphasis?: TextEmphasis;
  renderOutputAsMarkdown?: boolean;
  isFirst: boolean;
  borderColor: string;
  borderDimColor: boolean;
  activeShellPtyId?: number | null;
  embeddedShellFocused?: boolean;
  ptyId?: number;
  config?: Config;
}
```

---

## 3. Internal State Patterns

### useState vs useReducer Decision

**Pattern: useState for simple, independent values**

```typescript
// From ToolMessage.tsx (lines 69-75)
const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
const [userHasFocused, setUserHasFocused] = useState(false);

// From Scrollable.tsx (lines 42-47)
const [scrollTop, setScrollTop] = useState(0);
const [size, setSize] = useState({
  innerHeight: 0,
  scrollHeight: 0,
});
```

**Pattern: useReducer for complex state with many actions**

```typescript
// From text-buffer.ts (lines 1598-1602)
const [state, dispatch] = useReducer(
  (s: TextBufferState, a: TextBufferAction) =>
    textBufferReducer(s, a, { inputFilter, singleLine }),
  initialState,
);

// From useSelectionList.ts (lines 250-256)
const [state, dispatch] = useReducer(selectionListReducer, {
  activeIndex: computeInitialIndex(initialIndex, baseItems),
  initialIndex,
  pendingHighlight: false,
  pendingSelect: false,
  items: baseItems,
});
```

**Pattern: Lazy initialization for expensive initial state**

```typescript
// From VirtualizedList.tsx (lines 86-108)
const [scrollAnchor, setScrollAnchor] = useState(() => {
  const scrollToEnd =
    initialScrollIndex === SCROLL_TO_ITEM_END ||
    (typeof initialScrollIndex === 'number' &&
      initialScrollIndex >= data.length - 1 &&
      initialScrollOffsetInIndex === SCROLL_TO_ITEM_END);

  if (scrollToEnd) {
    return {
      index: data.length > 0 ? data.length - 1 : 0,
      offset: SCROLL_TO_ITEM_END,
    };
  }
  // ...
  return { index: 0, offset: 0 };
});
```

### Derived State with useMemo

**Pattern: Expensive computations memoized**

```typescript
// From VirtualizedList.tsx (lines 123-132)
const { totalHeight, offsets } = useMemo(() => {
  const offsets: number[] = [0];
  let totalHeight = 0;
  for (let i = 0; i < data.length; i++) {
    const height = heights[i] ?? estimatedItemHeight(i);
    totalHeight += height;
    offsets.push(totalHeight);
  }
  return { totalHeight, offsets };
}, [heights, data, estimatedItemHeight]);
```

**Pattern: UI color computation memoized**

```typescript
// From ToolShared.tsx (lines 86-98)
const nameColor = React.useMemo<string>(() => {
  switch (emphasis) {
    case 'high':
      return theme.text.primary;
    case 'medium':
      return theme.text.primary;
    case 'low':
      return theme.text.secondary;
    default: {
      const exhaustiveCheck: never = emphasis;
      return exhaustiveCheck;
    }
  }
}, [emphasis]);
```

**Pattern: Complex data transformations memoized**

```typescript
// From MainContent.tsx (lines 84-91)
const virtualizedData = useMemo(
  () => [
    { type: 'header' as const },
    ...uiState.history.map((item) => ({ type: 'history' as const, item })),
    { type: 'pending' as const },
  ],
  [uiState.history],
);
```

### Ref Usage Patterns

**Pattern: DOM element refs for measurements**

```typescript
// From VirtualizedList.tsx (lines 117-121)
const containerRef = useRef<DOMElement>(null);
const itemRefs = useRef<Array<DOMElement | null>>([]);
```

**Pattern: Refs for mutable values that don't trigger re-renders**

```typescript
// From InputPrompt.tsx (lines 137-144)
const escPressCount = useRef(0);
const escapeTimerRef = useRef<NodeJS.Timeout | null>(null);
const pasteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

**Pattern: Refs to track previous values**

```typescript
// From VirtualizedList.tsx (lines 214-217)
const prevDataLength = useRef(data.length);
const prevTotalHeight = useRef(totalHeight);
const prevScrollTop = useRef(scrollTop);
const prevContainerHeight = useRef(scrollableContainerHeight);
```

**Pattern: useRef + useEffect for syncing current value**

```typescript
// From VirtualizedList.tsx (lines 81-84)
const dataRef = useRef(data);
useEffect(() => {
  dataRef.current = data;
}, [data]);

// From Scrollable.tsx (lines 48-51)
const sizeRef = useRef(size);
useEffect(() => {
  sizeRef.current = size;
}, [size]);
```

---

## 4. Effect Patterns

### useEffect Organization

**Pattern: Single responsibility effects, clearly commented**

```typescript
// From InputPrompt.tsx (lines 197-201)
// Notify parent component about escape prompt state changes
useEffect(() => {
  if (onEscapePromptChange) {
    onEscapePromptChange(showEscapePrompt);
  }
}, [showEscapePrompt, onEscapePromptChange]);
```

**Pattern: Sync external state effects**

```typescript
// From ToolMessage.tsx (lines 77-81)
useEffect(() => {
  if (resultDisplay) {
    setLastUpdateTime(new Date());
  }
}, [resultDisplay]);

useEffect(() => {
  if (isThisShellFocused) {
    setUserHasFocused(true);
  }
}, [isThisShellFocused]);
```

### Cleanup Function Patterns

**Pattern: Timer cleanup in separate cleanup-only effect**

```typescript
// From InputPrompt.tsx (lines 204-214)
// Clear escape prompt timer on unmount
useEffect(
  () => () => {
    if (escapeTimerRef.current) {
      clearTimeout(escapeTimerRef.current);
    }
    if (pasteTimeoutRef.current) {
      clearTimeout(pasteTimeoutRef.current);
    }
  },
  [],
);
```

**Pattern: Cleanup in useSelectionList.ts (lines 310-317)**

```typescript
useEffect(
  () => () => {
    if (numberInputTimer.current) {
      clearTimeout(numberInputTimer.current);
    }
  },
  [],
);
```

### useLayoutEffect for DOM Measurements

**Pattern: Layout effects that run on every render with explicit eslint disable**

```typescript
// From VirtualizedList.tsx (lines 152-179)
// This layout effect needs to run on every render to correctly measure the
// container and ensure we recompute the layout if it has changed.
// eslint-disable-next-line react-hooks/exhaustive-deps
useLayoutEffect(() => {
  if (containerRef.current) {
    const height = Math.round(measureElement(containerRef.current).height);
    if (containerHeight !== height) {
      setContainerHeight(height);
    }
  }
  // ... item measurement
});
```

**Pattern: Same in Scrollable.tsx (lines 55-83)**

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
useLayoutEffect(() => {
  if (!ref.current) {
    return;
  }
  const innerHeight = Math.round(getInnerHeight(ref.current));
  const scrollHeight = Math.round(getScrollHeight(ref.current));
  // ...
});
```

### Dependency Array Patterns

**Pattern: Empty deps for mount-only effects**

```typescript
useEffect(() => {
  // Run once on mount
}, []);
```

**Pattern: Explicit dependencies with all used values**

```typescript
// From VirtualizedList.tsx (lines 272-281)
useLayoutEffect(() => {
  // Complex scroll logic
}, [
  data.length,
  totalHeight,
  scrollTop,
  scrollableContainerHeight,
  scrollAnchor.index,
  getAnchorForScrollTop,
  offsets,
  isStickingToBottom,
]);
```

**Pattern: Effect without deps array for every-render execution**

```typescript
// From useSelectionList.ts (lines 264-279)
useEffect(() => {
  const baseItemsChanged = !areBaseItemsEqual(prevBaseItemsRef.current, baseItems);
  const initialIndexChanged = prevInitialIndexRef.current !== initialIndex;

  if (baseItemsChanged || initialIndexChanged) {
    dispatch({ type: 'INITIALIZE', payload: { initialIndex, items: baseItems } });
    // Update refs
  }
}); // No dependency array - intentional
```

---

## 5. Render Patterns

### Early Returns

**Pattern: Guard clauses for empty/loading states**

```typescript
// From SuggestionsDisplay.tsx (lines 43-53)
export function SuggestionsDisplay({ suggestions, isLoading, ... }) {
  if (isLoading) {
    return (
      <Box paddingX={1} width={width}>
        <Text color="gray">Loading suggestions...</Text>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't render anything if there are no suggestions
  }

  // Main render logic...
}
```

**Pattern: Early return for placeholder state**

```typescript
// From TextInput.tsx (lines 62-75)
if (showPlaceholder) {
  return (
    <Box>
      {focus ? (
        <Text>
          {chalk.inverse(placeholder[0] || ' ')}
          <Text color={theme.text.secondary}>{placeholder.slice(1)}</Text>
        </Text>
      ) : (
        <Text color={theme.text.secondary}>{placeholder}</Text>
      )}
    </Box>
  );
}
```

### Conditional Rendering Approaches

**Pattern: Ternary for simple either/or**

```typescript
// From TextInput.tsx (lines 65-72)
{focus ? (
  <Text>
    {chalk.inverse(placeholder[0] || ' ')}
    <Text color={theme.text.secondary}>{placeholder.slice(1)}</Text>
  </Text>
) : (
  <Text color={theme.text.secondary}>{placeholder}</Text>
)}
```

**Pattern: && operator for show/hide**

```typescript
// From ToolMessage.tsx (lines 112-118)
{shouldShowFocusHint && (
  <Box marginLeft={1} flexShrink={0}>
    <Text color={theme.text.accent}>
      {isThisShellFocused ? '(Focused)' : '(ctrl+f to focus)'}
    </Text>
  </Box>
)}
```

**Pattern: Variable computed before render for complex conditions**

```typescript
// From DialogManager.tsx - cascade of if statements
if (uiState.showIdeRestartPrompt) {
  return <IdeTrustChangeDialog reason={uiState.ideTrustRestartReason} />;
}
if (uiState.proQuotaRequest) {
  return <ProQuotaDialog {...} />;
}
if (uiState.shouldShowIdePrompt) {
  return <IdeIntegrationNudge {...} />;
}
// ... continues for many dialog types
return null;
```

**Pattern: Pre-computed conditional node**

```typescript
// From InputPrompt.tsx (lines 991-1010)
const suggestionsNode = shouldShowSuggestions ? (
  <Box paddingRight={2}>
    <SuggestionsDisplay
      suggestions={activeCompletion.suggestions}
      activeIndex={activeCompletion.activeSuggestionIndex}
      // ...
    />
  </Box>
) : null;

// Later in render:
return (
  <>
    {suggestionsPosition === 'above' && suggestionsNode}
    {/* ... main content ... */}
    {suggestionsPosition === 'below' && suggestionsNode}
  </>
);
```

### Children Composition

**Pattern: renderItem prop for list rendering**

```typescript
// From BaseSelectionList.tsx (lines 33, 156-161)
interface BaseSelectionListProps<T, TItem> {
  renderItem: (item: TItem, context: RenderItemContext) => React.ReactNode;
}

// Usage:
<Box flexGrow={1}>
  {renderItem(item, {
    isSelected,
    titleColor,
    numberColor,
  })}
</Box>
```

**Pattern: Children with wrapper for layout**

```typescript
// From Scrollable.tsx (lines 153-163)
return (
  <Box
    ref={ref}
    overflowY="scroll"
    scrollTop={scrollTop}
    // ...
  >
    {/* Inner box prevents parent shrinking */}
    <Box flexShrink={0} paddingRight={1} flexDirection="column">
      {children}
    </Box>
  </Box>
);
```

**Pattern: Static + dynamic children composition**

```typescript
// From MainContent.tsx (lines 140-153)
return (
  <>
    <Static
      key={uiState.historyRemountKey}
      items={[
        <AppHeader key="app-header" version={version} />,
        ...historyItems,
      ]}
    >
      {(item) => item}
    </Static>
    {pendingItems}
  </>
);
```

### Memoization of Render Callbacks

**Pattern: useCallback for render functions passed as props**

```typescript
// From MainContent.tsx (lines 93-120)
const renderItem = useCallback(
  ({ item }: { item: (typeof virtualizedData)[number] }) => {
    if (item.type === 'header') {
      return <MemoizedAppHeader key="app-header" version={version} />;
    } else if (item.type === 'history') {
      return <MemoizedHistoryItemDisplay {...} />;
    } else {
      return pendingItems;
    }
  },
  [version, mainAreaWidth, staticAreaMaxItemHeight, uiState.slashCommands, pendingItems],
);
```

**Pattern: memo() for expensive child components**

```typescript
// From MainContent.tsx (lines 20-21)
const MemoizedHistoryItemDisplay = memo(HistoryItemDisplay);
const MemoizedAppHeader = memo(AppHeader);
```

---

## 6. Recommendations for FloMaster

### File Organization

1. **Maintain consistent import order:**
   - React types and hooks
   - External libraries (ink, etc.)
   - Internal UI imports (hooks, contexts, components)
   - Core package imports
   - Type-only imports

2. **Props interface placement:**
   - Simple props: inline before component
   - Complex types: separate `.types.ts` file in same folder
   - Shared types: export from feature's `types/` folder

3. **Helper function placement:**
   - Pure utilities: above component, exported if testable
   - Component-specific: inside component or as nested functions

### Props Patterns to Adopt

1. **Required props first, optional with defaults:**
   ```typescript
   export interface ComponentProps {
     data: DataType;           // Required
     onAction: () => void;     // Required callback
     variant?: 'primary' | 'secondary'; // Optional
     isLoading?: boolean;      // Optional with default
   }

   export function Component({
     data,
     onAction,
     variant = 'primary',
     isLoading = false,
   }: ComponentProps) { ... }
   ```

2. **Callback naming:** `on` + PascalCase verb
   - `onSelect`, `onSubmit`, `onChange`, `onHighlight`

3. **Use generics for reusable list components**

### State Management

1. **useState for:**
   - Simple boolean flags
   - Single values that change independently
   - UI state like `isOpen`, `isLoading`

2. **useReducer for:**
   - Complex state objects with multiple fields
   - State with many possible actions
   - State where next value depends on previous

3. **Lazy initialization:** Use callback form for expensive initial state

4. **Refs for:**
   - DOM elements
   - Timers and intervals
   - Previous value tracking
   - Mutable values that shouldn't trigger re-renders

### Effect Patterns

1. **Single responsibility:** One effect per concern
2. **Comment intent:** Add brief comment above complex effects
3. **Cleanup effects:** Use separate effect with empty deps for unmount cleanup
4. **Layout effects:** Use for DOM measurements, with explicit eslint disable if needed

### Render Patterns

1. **Early returns:** Handle loading/empty/error states first
2. **Pre-compute complex conditions:** Calculate before return statement
3. **Conditional nodes:** Assign to variable for reuse
4. **Memoize callbacks:** Use `useCallback` for render functions passed as props
5. **Memoize components:** Use `memo()` for expensive child components

### Testing Recommendations

Based on the test files analyzed:

1. **Mock external dependencies:**
   ```typescript
   vi.mock('../../hooks/useKeypress.js', () => ({
     useKeypress: vi.fn(),
   }));
   ```

2. **Create test helpers:**
   ```typescript
   const renderWithContext = (ui: React.ReactElement, state: UIState) =>
     renderWithProviders(ui, { uiActions, uiState: state });
   ```

3. **Reset mocks in beforeEach:**
   ```typescript
   beforeEach(() => {
     vi.resetAllMocks();
   });
   ```

4. **Use snapshots for visual output:**
   ```typescript
   expect(lastFrame()).toMatchSnapshot();
   ```

5. **Test keyboard handlers directly:**
   ```typescript
   const keypressHandler = mockedUseKeypress.mock.calls[0][0];
   keypressHandler({ name: 'return', ... });
   expect(onSubmit).toHaveBeenCalled();
   ```

---

## Summary

The Gemini CLI codebase demonstrates mature React patterns adapted for terminal UI development. Key takeaways:

1. **Consistent organization** makes code navigable
2. **TypeScript generics** enable reusable components
3. **useReducer** for complex state keeps logic centralized
4. **Ref patterns** handle mutable values and DOM measurements
5. **Effect discipline** prevents bugs and makes intent clear
6. **Render optimization** through memoization improves performance

These patterns should be adopted in FloMaster's UI package for consistency and maintainability.
