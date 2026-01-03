# Gemini CLI Custom Hook Algorithms Analysis

> In-depth analysis of hook patterns, algorithms, and state management from the Gemini CLI codebase.

**Source Directory**: `examplecode/gemini-cli/packages/cli/src/ui/hooks/`

---

## Table of Contents

1. [useSelectionList](#1-useselectionlist---selection-state-management)
2. [useHistoryManager](#2-usehistorymanager---chat-history-management)
3. [useInputHistory](#3-useinputhistory---input-history-navigation)
4. [useCompletion](#4-usecompletion---autocomplete-state)
5. [useAnimatedScrollbar](#5-useanimatedscrollbar---scrollbar-animation)
6. [useBatchedScroll](#6-usebatchedscroll---scroll-optimization)
7. [Implementation Recommendations](#7-implementation-recommendations)

---

## 1. useSelectionList - Selection State Management

**File**: `useSelectionList.ts` (Lines 1-409)

### Public API

```typescript
interface UseSelectionListOptions<T> {
  items: Array<SelectionListItem<T>>;  // List items with key, value, disabled flag
  initialIndex?: number;                // Starting selection (default: 0)
  onSelect: (value: T) => void;        // Called when item is selected (Enter)
  onHighlight?: (value: T) => void;    // Called when selection changes
  isFocused?: boolean;                 // Enable/disable keyboard handling
  showNumbers?: boolean;               // Enable numeric quick-select
}

interface UseSelectionListResult {
  activeIndex: number;                  // Current selection index
  setActiveIndex: (index: number) => void;  // Programmatic index change
}
```

### Internal State Structure

```typescript
interface SelectionListState {
  activeIndex: number;        // Current highlighted item
  initialIndex: number;       // Initial index for reset detection
  pendingHighlight: boolean;  // Flag to trigger onHighlight callback
  pendingSelect: boolean;     // Flag to trigger onSelect callback
  items: BaseSelectionItem[]; // Cached item metadata (key + disabled)
}
```

### Key Algorithm: Circular Navigation with Disabled Items

The `findNextValidIndex` function (Lines 73-96) implements **circular navigation** that skips disabled items:

```typescript
// ALGORITHM: Find next valid (non-disabled) index with wrapping
function findNextValidIndex(
  currentIndex: number,
  direction: 'up' | 'down',
  items: BaseSelectionItem[],
): number {
  const len = items.length;
  if (len === 0) return currentIndex;

  let nextIndex = currentIndex;
  const step = direction === 'down' ? 1 : -1;

  // Loop through ALL items once (worst case)
  for (let i = 0; i < len; i++) {
    // Modular arithmetic with positive offset for JS negative modulo handling
    // Example: (2 - 1 + 5) % 5 = 1 (going up from index 2)
    // Example: (0 - 1 + 5) % 5 = 4 (wraps from 0 to last)
    nextIndex = (nextIndex + step + len) % len;

    if (!items[nextIndex]?.disabled) {
      return nextIndex;  // Found valid item
    }
  }

  // All items disabled - stay at current
  return currentIndex;
}
```

**Pseudocode**:
```
FUNCTION findNextValidIndex(current, direction, items):
    IF items.length == 0: RETURN current

    step = 1 IF direction == 'down' ELSE -1
    next = current

    FOR i = 0 TO items.length:
        next = (next + step + items.length) MOD items.length
        IF NOT items[next].disabled:
            RETURN next

    RETURN current  // All disabled
```

### Key Algorithm: Initial Index Computation

The `computeInitialIndex` function (Lines 98-127) handles:
1. Finding item by key (for preserving selection across item changes)
2. Bounds checking
3. Auto-advancing from disabled initial items

```typescript
function computeInitialIndex(
  initialIndex: number,
  items: BaseSelectionItem[],
  initialKey?: string,  // Optional: preserve selection by key
): number {
  if (items.length === 0) return 0;

  // Priority 1: Match by key if provided (for stable selection)
  if (initialKey !== undefined) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].key === initialKey && !items[i].disabled) {
        return i;
      }
    }
  }

  // Priority 2: Use initialIndex with bounds check
  let targetIndex = initialIndex;
  if (targetIndex < 0 || targetIndex >= items.length) {
    targetIndex = 0;
  }

  // Priority 3: If target is disabled, find next valid
  if (items[targetIndex]?.disabled) {
    targetIndex = findNextValidIndex(targetIndex, 'down', items);
  }

  return targetIndex;
}
```

### Key Algorithm: Numeric Quick Selection

Lines 346-391 implement multi-digit number input with timeout:

```typescript
// ALGORITHM: Buffered numeric input with auto-select
const NUMBER_INPUT_TIMEOUT_MS = 1000;

// When user types a digit:
if (isNumeric) {
  clearTimeout(numberInputTimer);

  // Accumulate digits: "1" -> "12" -> "123"
  const newNumberInput = numberInputRef.current + sequence;
  numberInputRef.current = newNumberInput;

  const targetIndex = parseInt(newNumberInput, 10) - 1;  // 1-indexed

  // Skip invalid "0" input
  if (newNumberInput === '0') {
    scheduleReset();
    return;
  }

  // Valid index check
  if (targetIndex >= 0 && targetIndex < itemsLength) {
    dispatch({ type: 'SET_ACTIVE_INDEX', payload: { index: targetIndex } });

    // AUTO-SELECT OPTIMIZATION:
    // If appending "0" would exceed bounds, select immediately
    const potentialNextNumber = parseInt(newNumberInput + '0', 10);
    if (potentialNextNumber > itemsLength) {
      dispatch({ type: 'SELECT_CURRENT' });
      numberInputRef.current = '';
    } else {
      // Wait for more digits or timeout
      scheduleSelectAfterTimeout();
    }
  }
}
```

**Example Flow**:
- 15 items in list
- User types "1" -> highlights item 1, waits (10 could be valid)
- User types "2" -> highlights item 12, auto-selects (120 > 15)
- OR: User types "1" -> 1000ms passes -> selects item 1

### State Machine Pattern

The hook uses a **reducer with pending flags** (Lines 129-205) to separate:
- State updates (synchronous reducer)
- Side effects (async useEffect callbacks)

```typescript
// Reducer updates state synchronously
case 'MOVE_UP': {
  const newIndex = findNextValidIndex(state.activeIndex, 'up', items);
  if (newIndex !== state.activeIndex) {
    return { ...state, activeIndex: newIndex, pendingHighlight: true };
  }
  return state;
}

// Effect observes pending flags and runs callbacks
useEffect(() => {
  if (state.pendingHighlight && items[state.activeIndex]) {
    onHighlight?.(items[state.activeIndex].value);
  }
  if (state.pendingSelect && items[state.activeIndex]) {
    onSelect(items[state.activeIndex].value);
  }
  dispatch({ type: 'CLEAR_PENDING_FLAGS' });
}, [state.pendingHighlight, state.pendingSelect, ...]);
```

### Edge Cases Handled

1. **Empty list**: Returns early, no keyboard handling
2. **All items disabled**: Returns original index
3. **Index out of bounds**: Clamps to valid range
4. **Item changes during selection**: Uses key matching to preserve selection
5. **Non-numeric key clears buffer**: Prevents "1a2" scenarios

### Performance Considerations

- **BaseItem extraction** (Lines 207-227): Only extracts `key` and `disabled` to minimize comparison cost
- **Shallow equality check** for items: `areBaseItemsEqual` avoids unnecessary re-initialization
- **Stable callbacks via useCallback**: `handleKeypress` only recreates when `itemsLength` or `showNumbers` change

---

## 2. useHistoryManager - Chat History Management

**File**: `useHistoryManager.ts` (Lines 1-166)

### Public API

```typescript
interface UseHistoryManagerReturn {
  history: HistoryItem[];                    // Current history array
  addItem: (itemData, baseTimestamp, isResuming?) => number;  // Returns generated ID
  updateItem: (id, updates) => void;         // Update existing item (deprecated)
  clearItems: () => void;                    // Clear all history
  loadHistory: (newHistory) => void;         // Bulk load (for session resume)
}
```

### Internal State Structure

```typescript
// Simple: array + counter ref
const [history, setHistory] = useState<HistoryItem[]>([]);
const messageIdCounterRef = useRef(0);
```

### Key Algorithm: Unique ID Generation

Lines 46-49 use **timestamp + counter** for guaranteed uniqueness:

```typescript
const getNextMessageId = useCallback((baseTimestamp: number): number => {
  messageIdCounterRef.current += 1;
  return baseTimestamp + messageIdCounterRef.current;
}, []);
```

**Why this pattern**:
- Timestamp provides rough chronological ordering
- Counter ensures uniqueness even for items added in same millisecond
- IDs are always increasing (important for React key stability)

**Example**:
```
baseTimestamp = 1704067200000 (Jan 1, 2024 00:00:00)
First item:  ID = 1704067200000 + 1 = 1704067200001
Second item: ID = 1704067200000 + 2 = 1704067200002
```

### Key Algorithm: Duplicate Prevention

Lines 65-76 prevent consecutive duplicate user messages:

```typescript
setHistory((prevHistory) => {
  if (prevHistory.length > 0) {
    const lastItem = prevHistory[prevHistory.length - 1];
    // Only check consecutive USER messages with same text
    if (
      lastItem.type === 'user' &&
      newItem.type === 'user' &&
      lastItem.text === newItem.text
    ) {
      return prevHistory;  // Skip duplicate
    }
  }
  return [...prevHistory, newItem];
});
```

**Pseudocode**:
```
FUNCTION addItem(newItem):
    IF history.length > 0:
        last = history[history.length - 1]
        IF last.type == 'user' AND newItem.type == 'user':
            IF last.text == newItem.text:
                RETURN  // Skip duplicate

    history.push(newItem)
```

### Key Algorithm: Functional Update with Type Guards

Lines 129-147 support both object updates and updater functions:

```typescript
const updateItem = useCallback(
  (id: number, updates: Partial<HistoryItem> | HistoryItemUpdater) => {
    setHistory((prevHistory) =>
      prevHistory.map((item) => {
        if (item.id === id) {
          // Polymorphic update: function or object
          const newUpdates =
            typeof updates === 'function' ? updates(item) : updates;
          return { ...item, ...newUpdates };
        }
        return item;
      }),
    );
  },
  [],
);
```

**Usage patterns**:
```typescript
// Object update
updateItem(id, { text: 'new text' });

// Functional update (access previous state)
updateItem(id, (prevItem) => ({
  text: prevItem.text + ' (updated)',
  status: computeStatus(prevItem)
}));
```

### Edge Cases Handled

1. **Empty history on add**: No duplicate check needed
2. **Non-consecutive duplicates**: Allowed (only checks last item)
3. **Non-existent ID on update**: No-op (map returns unchanged array)
4. **Session resume**: `isResuming` flag skips recording service calls

### Performance Considerations

- **useMemo for return object** (Lines 155-164): Prevents unnecessary re-renders
- **Immutable updates**: Always creates new arrays
- **No virtualization**: Relies on Ink's `<Static>` component (noted as deprecated pattern)

---

## 3. useInputHistory - Input History Navigation

**File**: `useInputHistory.ts` (Lines 1-112)

### Public API

```typescript
interface UseInputHistoryProps {
  userMessages: readonly string[];  // External history (oldest first)
  onSubmit: (value: string) => void;
  isActive: boolean;                // Enable keyboard navigation
  currentQuery: string;             // Current input field value
  onChange: (value: string) => void;
}

interface UseInputHistoryReturn {
  handleSubmit: (value: string) => void;
  navigateUp: () => boolean;    // Returns true if navigation occurred
  navigateDown: () => boolean;  // Returns true if navigation occurred
}
```

### Internal State Structure

```typescript
const [historyIndex, setHistoryIndex] = useState<number>(-1);
// -1 = not navigating, 0 = most recent, N = N-th from recent

const [originalQueryBeforeNav, setOriginalQueryBeforeNav] = useState<string>('');
// Preserved input before entering history mode
```

### Key Algorithm: Stack-Like Navigation with Original Preservation

The history is accessed as a **reverse stack** (Lines 50-80):

```typescript
const navigateUp = useCallback(() => {
  if (!isActive || userMessages.length === 0) return false;

  let nextIndex = historyIndex;

  if (historyIndex === -1) {
    // FIRST NAVIGATION: Save current input, start at index 0
    setOriginalQueryBeforeNav(currentQuery);
    nextIndex = 0;
  } else if (historyIndex < userMessages.length - 1) {
    // CONTINUE NAVIGATION: Move deeper into history
    nextIndex = historyIndex + 1;
  } else {
    // AT OLDEST: Can't go further
    return false;
  }

  if (nextIndex !== historyIndex) {
    setHistoryIndex(nextIndex);
    // Access from END of array (most recent first)
    const newValue = userMessages[userMessages.length - 1 - nextIndex];
    onChange(newValue);
    return true;
  }
  return false;
}, [historyIndex, userMessages, isActive, currentQuery, onChange]);
```

**Visual Model**:
```
userMessages = ['msg1', 'msg2', 'msg3']  // oldest to newest
                  ^       ^       ^
                  |       |       |
            index=2  index=1  index=0   (in reverse access)

User types "current", presses Up:
  - originalQueryBeforeNav = "current"
  - historyIndex = 0, displays "msg3"
User presses Up again:
  - historyIndex = 1, displays "msg2"
User presses Down:
  - historyIndex = 0, displays "msg3"
User presses Down again:
  - historyIndex = -1, displays "current" (restored)
```

### Key Algorithm: Navigate Down with Original Restoration

Lines 82-104:

```typescript
const navigateDown = useCallback(() => {
  if (!isActive || historyIndex === -1) return false;

  const nextIndex = historyIndex - 1;
  setHistoryIndex(nextIndex);

  if (nextIndex === -1) {
    // EXITING HISTORY: Restore original input
    onChange(originalQueryBeforeNav);
  } else {
    // MOVING TOWARD RECENT
    const newValue = userMessages[userMessages.length - 1 - nextIndex];
    onChange(newValue);
  }
  return true;
}, [historyIndex, originalQueryBeforeNav, userMessages, isActive, onChange]);
```

**Pseudocode**:
```
STATE:
  historyIndex = -1  // -1 means "at current input"
  originalQuery = "" // saved when entering history

FUNCTION navigateUp():
    IF historyIndex == -1:
        originalQuery = currentInput
        historyIndex = 0
    ELSE IF historyIndex < messages.length - 1:
        historyIndex += 1
    ELSE:
        RETURN false  // at oldest

    display(messages[messages.length - 1 - historyIndex])
    RETURN true

FUNCTION navigateDown():
    IF historyIndex == -1:
        RETURN false  // not in history

    historyIndex -= 1

    IF historyIndex == -1:
        display(originalQuery)  // restore
    ELSE:
        display(messages[messages.length - 1 - historyIndex])

    RETURN true
```

### Edge Cases Handled

1. **Empty history**: Early return from `navigateUp`
2. **At oldest message**: Prevents over-navigation
3. **Not in history mode**: `navigateDown` returns false when `historyIndex === -1`
4. **Submit resets**: `handleSubmit` calls `resetHistoryNav()` to clear state
5. **Inactive state**: All navigation disabled when `isActive` is false

### Performance Considerations

- **No array copying**: Directly indexes into external array
- **Minimal state**: Only two state variables
- **useCallback dependencies**: Properly memoized to prevent re-creation

---

## 4. useCompletion - Autocomplete State

**File**: `useCompletion.ts` (Lines 1-127)

### Public API

```typescript
interface UseCompletionReturn {
  // State
  suggestions: Suggestion[];
  activeSuggestionIndex: number;      // -1 = none selected
  visibleStartIndex: number;          // For virtual scrolling
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  isPerfectMatch: boolean;

  // Setters (raw state access)
  setSuggestions, setActiveSuggestionIndex, setVisibleStartIndex, etc.

  // Navigation
  navigateUp: () => void;
  navigateDown: () => void;
  resetCompletionState: () => void;
}
```

### Internal State Structure

```typescript
const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
const [visibleStartIndex, setVisibleStartIndex] = useState<number>(0);
const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
const [isPerfectMatch, setIsPerfectMatch] = useState<boolean>(false);
```

### Key Algorithm: Virtual Window Navigation

The hook manages a **sliding window** over suggestions (Lines 49-106):

```typescript
const MAX_SUGGESTIONS_TO_SHOW = 8;  // From SuggestionsDisplay.tsx

const navigateUp = useCallback(() => {
  if (suggestions.length === 0) return;

  setActiveSuggestionIndex((prevActiveIndex) => {
    // WRAP TO END when at start
    const newActiveIndex =
      prevActiveIndex <= 0 ? suggestions.length - 1 : prevActiveIndex - 1;

    // Adjust visible window
    setVisibleStartIndex((prevVisibleStart) => {
      // CASE 1: Wrapped to last item - scroll window to end
      if (
        newActiveIndex === suggestions.length - 1 &&
        suggestions.length > MAX_SUGGESTIONS_TO_SHOW
      ) {
        return Math.max(0, suggestions.length - MAX_SUGGESTIONS_TO_SHOW);
      }

      // CASE 2: Scrolled above visible window
      if (newActiveIndex < prevVisibleStart) {
        return newActiveIndex;
      }

      // CASE 3: Still visible - no scroll
      return prevVisibleStart;
    });

    return newActiveIndex;
  });
}, [suggestions.length]);
```

**Visual Model** (MAX_SUGGESTIONS_TO_SHOW = 8):
```
Suggestions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]  (12 items)

Initial state:
  visibleStartIndex = 0
  activeSuggestionIndex = 0
  Visible: [0*, 1, 2, 3, 4, 5, 6, 7]  (* = active)

Navigate Up (wrap):
  activeSuggestionIndex = 11
  visibleStartIndex = 4  // 12 - 8 = 4
  Visible: [4, 5, 6, 7, 8, 9, 10, 11*]

Navigate Up again:
  activeSuggestionIndex = 10
  visibleStartIndex = 4  // Still visible
  Visible: [4, 5, 6, 7, 8, 9, 10*, 11]

Navigate Up to index 3:
  visibleStartIndex = 3  // Scrolled above window
  Visible: [3*, 4, 5, 6, 7, 8, 9, 10]
```

### Navigate Down Algorithm

```typescript
const navigateDown = useCallback(() => {
  if (suggestions.length === 0) return;

  setActiveSuggestionIndex((prevActiveIndex) => {
    // WRAP TO START when at end
    const newActiveIndex =
      prevActiveIndex >= suggestions.length - 1 ? 0 : prevActiveIndex + 1;

    setVisibleStartIndex((prevVisibleStart) => {
      // CASE 1: Wrapped to first item
      if (newActiveIndex === 0 && suggestions.length > MAX_SUGGESTIONS_TO_SHOW) {
        return 0;
      }

      // CASE 2: Scrolled below visible window
      const visibleEndIndex = prevVisibleStart + MAX_SUGGESTIONS_TO_SHOW;
      if (newActiveIndex >= visibleEndIndex) {
        return newActiveIndex - MAX_SUGGESTIONS_TO_SHOW + 1;
      }

      return prevVisibleStart;
    });

    return newActiveIndex;
  });
}, [suggestions.length]);
```

**Pseudocode**:
```
CONSTANT MAX_VISIBLE = 8

FUNCTION navigateDown():
    IF suggestions.length == 0: RETURN

    newIndex = (activeIndex + 1) MOD suggestions.length

    IF newIndex == 0:
        visibleStart = 0  // Wrapped to top
    ELSE IF newIndex >= visibleStart + MAX_VISIBLE:
        visibleStart = newIndex - MAX_VISIBLE + 1  // Scroll down

    activeIndex = newIndex
```

### Edge Cases Handled

1. **Empty suggestions**: Early return from navigation
2. **Fewer items than window**: No scroll adjustment needed
3. **Wrap-around**: Handles both up (to end) and down (to start)
4. **Window edge alignment**: Keeps active item visible

### Performance Considerations

- **Nested state updates**: Uses functional updates for consistent batching
- **No suggestions array mutation**: External consumer manages filtering
- **Simple state**: Minimal overhead for frequently-updated UI

---

## 5. useAnimatedScrollbar - Scrollbar Animation

**File**: `useAnimatedScrollbar.ts` (Lines 1-119)

### Public API

```typescript
function useAnimatedScrollbar(
  isFocused: boolean,
  scrollBy: (delta: number) => void,
): {
  scrollbarColor: string;                         // Current animated color
  flashScrollbar: () => void;                     // Trigger animation
  scrollByWithAnimation: (delta: number) => void; // Scroll + animate
}
```

### Animation State Machine

The hook implements a **3-phase animation** using `setInterval`:

```
┌─────────────────────────────────────────────────────────────┐
│                    ANIMATION PHASES                          │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Fade In       (200ms)  currentColor → focusedColor │
│  Phase 2: Hold Visible  (1000ms) focusedColor (no change)    │
│  Phase 3: Fade Out      (300ms)  focusedColor → unfocusedColor│
└─────────────────────────────────────────────────────────────┘
```

### Key Algorithm: Color Interpolation Animation

Lines 39-95 implement the phased animation:

```typescript
const flashScrollbar = useCallback(() => {
  cleanup();  // Cancel any existing animation

  // Track active animation for debug counter
  debugState.debugNumAnimatedComponents++;
  isAnimatingRef.current = true;

  const fadeInDuration = 200;
  const visibleDuration = 1000;
  const fadeOutDuration = 300;

  const focusedColor = theme.text.secondary;
  const unfocusedColor = theme.ui.dark;
  const startColor = colorRef.current;  // Current color for smooth transition

  // PHASE 1: Fade In
  let start = Date.now();
  const animateFadeIn = () => {
    const elapsed = Date.now() - start;
    const progress = Math.max(0, Math.min(elapsed / fadeInDuration, 1));

    // Linear interpolation between colors
    setScrollbarColor(interpolateColor(startColor, focusedColor, progress));

    if (progress === 1) {
      clearInterval(animationFrame.current);

      // PHASE 2: Wait (visible)
      timeout.current = setTimeout(() => {
        // PHASE 3: Fade Out
        start = Date.now();
        const animateFadeOut = () => {
          const elapsed = Date.now() - start;
          const progress = Math.max(0, Math.min(elapsed / fadeOutDuration, 1));
          setScrollbarColor(
            interpolateColor(focusedColor, unfocusedColor, progress)
          );

          if (progress === 1) {
            cleanup();  // Animation complete
          }
        };
        animationFrame.current = setInterval(animateFadeOut, 33);  // ~30fps
      }, visibleDuration);
    }
  };

  animationFrame.current = setInterval(animateFadeIn, 33);  // ~30fps
}, [cleanup]);
```

### Color Interpolation Implementation

From `color-utils.ts` (Lines 236-253):

```typescript
export function interpolateColor(
  color1: string,
  color2: string,
  factor: number,  // 0.0 to 1.0
) {
  // Edge cases
  if (factor <= 0) return color1;
  if (factor >= 1) return color2;
  if (!color1 || !color2) return '';

  // Use tinygradient library for RGB interpolation
  const gradient = tinygradient(color1, color2);
  const color = gradient.rgbAt(factor);
  return color.toHexString();
}
```

**Visual Timeline**:
```
Time:  0ms      200ms     1200ms    1500ms
       |--------|---------|---------|
Color: dark   focused   focused    dark
       ↑         ↑         ↑         ↑
       Fade In   Hold      Fade Out  Done
```

### Focus Change Handling

Lines 97-107 handle focus state transitions:

```typescript
const wasFocused = useRef(isFocused);

useEffect(() => {
  if (isFocused && !wasFocused.current) {
    // GAINED FOCUS: Trigger flash animation
    flashScrollbar();
  } else if (!isFocused && wasFocused.current) {
    // LOST FOCUS: Immediately reset to dark
    cleanup();
    setScrollbarColor(theme.ui.dark);
  }
  wasFocused.current = isFocused;

  return cleanup;  // Cleanup on unmount
}, [isFocused, flashScrollbar, cleanup]);
```

### Edge Cases Handled

1. **Animation interruption**: New flash cancels previous animation
2. **Focus lost during animation**: Immediately resets to unfocused color
3. **Unmount during animation**: Cleanup prevents memory leaks
4. **Invalid colors**: `interpolateColor` returns empty string

### Performance Considerations

- **Frame rate**: 33ms interval = ~30fps (smooth but not excessive)
- **Debug tracking**: `debugNumAnimatedComponents` for performance monitoring
- **Ref for current color**: Avoids stale closure issues in animation callbacks
- **Single timer**: Only one interval runs at a time

---

## 6. useBatchedScroll - Scroll Optimization

**File**: `useBatchedScroll.ts` (Lines 1-36)

### Public API

```typescript
function useBatchedScroll(currentScrollTop: number): {
  getScrollTop: () => number;                    // Get effective scroll position
  setPendingScrollTop: (newScrollTop: number) => void;  // Set pending value
}
```

### Problem Solved

This hook solves the **stale state problem** in event handlers during a single render cycle:

```typescript
// WITHOUT batching:
handleEvent1() {
  setScrollTop(scrollTop + 10);  // scrollTop = 0, sets to 10
}
handleEvent2() {
  setScrollTop(scrollTop + 10);  // scrollTop STILL = 0, sets to 10!
}
// Result: scrollTop = 10 (should be 20)

// WITH batching:
handleEvent1() {
  const current = getScrollTop();  // Returns pending or actual
  setPendingScrollTop(current + 10);
}
handleEvent2() {
  const current = getScrollTop();  // Returns pending (10)
  setPendingScrollTop(current + 10);  // Sets to 20
}
// Result: pending = 20, applied on next render
```

### Internal State Structure

```typescript
const pendingScrollTopRef = useRef<number | null>(null);
const currentScrollTopRef = useRef(currentScrollTop);
```

### Key Algorithm: Pending Value Pattern

```typescript
// After each render, sync refs and clear pending
useEffect(() => {
  currentScrollTopRef.current = currentScrollTop;
  pendingScrollTopRef.current = null;  // Reset pending after React applies
});

// Get: Prefer pending, fallback to current
const getScrollTop = useCallback(
  () => pendingScrollTopRef.current ?? currentScrollTopRef.current,
  [],
);

// Set: Only updates pending (React will sync on next render)
const setPendingScrollTop = useCallback((newScrollTop: number) => {
  pendingScrollTopRef.current = newScrollTop;
}, []);
```

**Pseudocode**:
```
STATE:
  currentRef = props.scrollTop
  pendingRef = null

ON_RENDER:
  currentRef = props.scrollTop
  pendingRef = null  // Clear pending after React reconciliation

FUNCTION getScrollTop():
    RETURN pendingRef ?? currentRef

FUNCTION setPendingScrollTop(value):
    pendingRef = value
```

### Lifecycle Visualization

```
Render 1: scrollTop = 0
  ├── currentRef = 0
  ├── pendingRef = null
  │
  ├── Event A: setPending(50)  → pendingRef = 50
  ├── Event B: get() = 50, setPending(100)  → pendingRef = 100
  │
  └── End of render: props updated with 100

Render 2: scrollTop = 100
  ├── useEffect runs:
  │   ├── currentRef = 100
  │   └── pendingRef = null  // Reset
```

### Edge Cases Handled

1. **Multiple updates in same tick**: Last pending wins
2. **No pending when queried**: Falls back to current prop
3. **Re-render without prop change**: Still clears pending (effect runs every render)

### Performance Considerations

- **Stable callbacks**: `useCallback` with empty deps for identity stability
- **Ref-based state**: No re-renders from internal updates
- **Zero dependencies in effect**: Runs every render (intentional for clearing pending)

---

## 7. Implementation Recommendations

### For FloMaster CLI/UI

#### Pattern: Reducer + Pending Flags
Use `useSelectionList`'s pattern for complex state with side effects:

```typescript
// Separate state updates from callbacks
type Action = { type: 'MOVE'; pendingCallback: true } | { type: 'CLEAR_PENDING' };

function reducer(state, action) {
  switch (action.type) {
    case 'MOVE': return { ...state, index: newIndex, pendingCallback: true };
    case 'CLEAR_PENDING': return { ...state, pendingCallback: false };
  }
}

useEffect(() => {
  if (state.pendingCallback) {
    onCallback();
    dispatch({ type: 'CLEAR_PENDING' });
  }
}, [state.pendingCallback, onCallback]);
```

#### Pattern: Original Value Preservation
Use `useInputHistory`'s pattern for recoverable navigation:

```typescript
const [originalBeforeNav, setOriginalBeforeNav] = useState<T | null>(null);

const enterMode = () => {
  setOriginalBeforeNav(currentValue);
  // Begin navigation
};

const exitMode = () => {
  if (originalBeforeNav !== null) {
    restore(originalBeforeNav);
    setOriginalBeforeNav(null);
  }
};
```

#### Pattern: Virtual Window
Use `useCompletion`'s sliding window for large lists:

```typescript
const WINDOW_SIZE = 10;

function getVisibleItems(items, activeIndex, windowStart) {
  const visibleEnd = windowStart + WINDOW_SIZE;

  // Adjust window if active is outside
  if (activeIndex < windowStart) {
    windowStart = activeIndex;
  } else if (activeIndex >= visibleEnd) {
    windowStart = activeIndex - WINDOW_SIZE + 1;
  }

  return {
    visible: items.slice(windowStart, windowStart + WINDOW_SIZE),
    windowStart
  };
}
```

#### Pattern: Pending Value Accumulation
Use `useBatchedScroll`'s pattern for rapid updates:

```typescript
const pendingRef = useRef<T | null>(null);
const actualRef = useRef(initialValue);

useEffect(() => {
  actualRef.current = currentPropValue;
  pendingRef.current = null;
});

const getCurrent = () => pendingRef.current ?? actualRef.current;
const setPending = (value: T) => { pendingRef.current = value; };
```

### Animation Recommendations

For `useAnimatedScrollbar`-style animations in FloMaster:

1. **Use CSS transitions when possible** (web context)
2. **For Ink/terminal**: Use `setInterval` at ~30fps (33ms)
3. **Always track animation state** for cleanup
4. **Use refs for current values** in callbacks to avoid stale closures

### Testing Patterns Observed

From the test files:

1. **Use `renderHook`** for isolated hook testing
2. **Use `act`** for state updates
3. **Test navigation edge cases**: empty lists, boundaries, wrapping
4. **Test callback invocations**: verify `onChange`, `onSelect` calls
5. **Test rerender behavior**: props changes, function stability

---

## Summary

| Hook | Primary Pattern | Key Algorithm |
|------|-----------------|---------------|
| useSelectionList | Reducer + Pending Flags | Circular navigation with disabled skip |
| useHistoryManager | Array + Counter ID | Duplicate prevention, timestamp-based IDs |
| useInputHistory | Reverse Stack Navigation | Original value preservation |
| useCompletion | Virtual Sliding Window | Window adjustment on wrap-around |
| useAnimatedScrollbar | Phased Animation | 3-phase fade with interpolation |
| useBatchedScroll | Pending Value Pattern | Ref-based accumulation between renders |
