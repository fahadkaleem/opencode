# VirtualizedList Component Analysis

> Comprehensive analysis of the VirtualizedList component from gemini-cli for implementation in FloMaster.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/shared/VirtualizedList.tsx`

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Virtualization Algorithm](#2-virtualization-algorithm)
3. [Performance Optimizations](#3-performance-optimizations)
4. [Edge Cases Handled](#4-edge-cases-handled)
5. [Integration Points](#5-integration-points)
6. [Implementation Recommendations](#6-implementation-recommendations)

---

## 1. Component Architecture

### 1.1 Props Interface

**Location**: Lines 25-33

```typescript
type VirtualizedListProps<T> = {
  data: T[];                                    // Array of items to render
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  estimatedItemHeight: (index: number) => number;  // Height estimation function
  keyExtractor: (item: T, index: number) => string;
  initialScrollIndex?: number;                  // Starting scroll position (item index)
  initialScrollOffsetInIndex?: number;          // Offset within the starting item
  scrollbarThumbColor?: string;                 // Scrollbar appearance
};
```

**Key Design Decisions**:
- Uses a function for `estimatedItemHeight` rather than a fixed value, allowing per-item height estimation
- Supports initial scroll positioning with both index and offset granularity
- Separates key extraction from rendering for flexibility

### 1.2 Ref Interface (Imperative Handle)

**Location**: Lines 35-55

```typescript
export type VirtualizedListRef<T> = {
  scrollBy: (delta: number) => void;            // Relative scroll
  scrollTo: (offset: number) => void;           // Absolute scroll position
  scrollToEnd: () => void;                      // Jump to bottom
  scrollToIndex: (params: {
    index: number;
    viewOffset?: number;                        // Pixel offset from viewport edge
    viewPosition?: number;                      // 0=top, 0.5=center, 1=bottom
  }) => void;
  scrollToItem: (params: {
    item: T;
    viewOffset?: number;
    viewPosition?: number;
  }) => void;
  getScrollIndex: () => number;                 // Current anchor index
  getScrollState: () => {
    scrollTop: number;
    scrollHeight: number;
    innerHeight: number;
  };
};
```

**Purpose**: Exposes a rich imperative API for external scroll control, enabling parent components to programmatically navigate the list.

### 1.3 Internal State Structure

**State Variables** (Lines 86-121):

| State | Type | Purpose |
|-------|------|---------|
| `scrollAnchor` | `{ index: number; offset: number }` | Current scroll position as item + pixel offset |
| `isStickingToBottom` | `boolean` | Auto-scroll mode for new items |
| `containerHeight` | `number` | Measured height of the container |
| `heights` | `number[]` | Actual measured heights of rendered items |

**Refs**:

| Ref | Type | Purpose |
|-----|------|---------|
| `dataRef` | `RefObject<T[]>` | Current data for stable callbacks |
| `containerRef` | `RefObject<DOMElement>` | Container element reference |
| `itemRefs` | `RefObject<(DOMElement | null)[]>` | Individual item element refs |
| `isInitialScrollSet` | `RefObject<boolean>` | One-time initial scroll flag |
| `prevDataLength` | `RefObject<number>` | Previous data length for change detection |
| `prevTotalHeight` | `RefObject<number>` | Previous content height |
| `prevScrollTop` | `RefObject<number>` | Previous scroll position |
| `prevContainerHeight` | `RefObject<number>` | Previous container height |

### 1.4 forwardRef Pattern

**Location**: Lines 495-501

```typescript
const VirtualizedListWithForwardRef = forwardRef(VirtualizedList) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<VirtualizedListRef<T>> },
) => React.ReactElement;

export { VirtualizedListWithForwardRef as VirtualizedList };
VirtualizedList.displayName = 'VirtualizedList';
```

**Pattern**: Uses type assertion to preserve generic type parameter through forwardRef, which normally loses type information.

---

## 2. Virtualization Algorithm

### 2.1 Visible Window Calculation

**Location**: Lines 333-343

```typescript
// Find first visible item (binary search via findLastIndex)
const startIndex = Math.max(
  0,
  findLastIndex(offsets, (offset) => offset <= scrollTop) - 1,
);

// Find last visible item
const endIndexOffset = offsets.findIndex(
  (offset) => offset > scrollTop + scrollableContainerHeight,
);
const endIndex =
  endIndexOffset === -1
    ? data.length - 1
    : Math.min(data.length - 1, endIndexOffset);
```

**Algorithm Pseudocode**:
```
function calculateVisibleRange(scrollTop, containerHeight, offsets):
    # Find the first item whose offset is <= scrollTop
    # Subtract 1 for overscan buffer at the top
    startIndex = max(0, findLastLessOrEqual(offsets, scrollTop) - 1)

    # Find the first item whose offset exceeds viewport bottom
    endIndex = findFirstGreater(offsets, scrollTop + containerHeight)

    # Handle edge case where all items are visible
    if endIndex == -1:
        endIndex = dataLength - 1
    else:
        endIndex = min(dataLength - 1, endIndex)

    return (startIndex, endIndex)
```

**Visual Diagram**:
```
                     scrollTop
                        v
+------------------------+
|   (startIndex - 1)     |  <- Overscan item (off-screen top)
+------------------------+
|   VISIBLE WINDOW       |
|   startIndex           |
|   ...                  |
|   endIndex             |
+------------------------+
                        ^
              scrollTop + containerHeight
```

### 2.2 Item Measurement Strategy

**Location**: Lines 155-179 (useLayoutEffect)

```typescript
useLayoutEffect(() => {
  // 1. Measure container
  if (containerRef.current) {
    const height = Math.round(measureElement(containerRef.current).height);
    if (containerHeight !== height) {
      setContainerHeight(height);
    }
  }

  // 2. Measure visible items
  let newHeights: number[] | null = null;
  for (let i = startIndex; i <= endIndex; i++) {
    const itemRef = itemRefs.current[i];
    if (itemRef) {
      const height = Math.round(measureElement(itemRef).height);
      if (height !== heights[i]) {
        if (!newHeights) {
          newHeights = [...heights];  // Lazy copy
        }
        newHeights[i] = height;
      }
    }
  }
  if (newHeights) {
    setHeights(newHeights);
  }
});
```

**Key Insight**: This useLayoutEffect runs on EVERY render (no dependency array), ensuring heights are always up-to-date. Uses lazy array copy to minimize allocations.

### 2.3 Offset Calculation (Prefix Sum)

**Location**: Lines 123-132

```typescript
const { totalHeight, offsets } = useMemo(() => {
  const offsets: number[] = [0];  // First item starts at 0
  let totalHeight = 0;
  for (let i = 0; i < data.length; i++) {
    const height = heights[i] ?? estimatedItemHeight(i);
    totalHeight += height;
    offsets.push(totalHeight);  // offsets[i] = top of item i
  }
  return { totalHeight, offsets };
}, [heights, data, estimatedItemHeight]);
```

**Data Structure**:
```
offsets[i] = sum of heights[0..i-1]
offsets[0] = 0 (always)
offsets[n] = totalHeight

Example:
data = [A, B, C] with heights [10, 20, 15]
offsets = [0, 10, 30, 45]

Item A: top=0, height=10, bottom=10
Item B: top=10, height=20, bottom=30
Item C: top=30, height=15, bottom=45
```

### 2.4 Scroll Positioning Algorithm

**Location**: Lines 200-212

```typescript
const scrollTop = useMemo(() => {
  const offset = offsets[scrollAnchor.index];
  if (typeof offset !== 'number') {
    return 0;
  }

  // Special case: scroll to show bottom of item
  if (scrollAnchor.offset === SCROLL_TO_ITEM_END) {
    const itemHeight = heights[scrollAnchor.index] ?? 0;
    return offset + itemHeight - scrollableContainerHeight;
  }

  return offset + scrollAnchor.offset;
}, [scrollAnchor, offsets, heights, scrollableContainerHeight]);
```

**Anchor-Based Scrolling**:
```
scrollTop = offsets[anchorIndex] + anchorOffset

When offset === SCROLL_TO_ITEM_END:
    scrollTop = offsets[anchorIndex] + heights[anchorIndex] - containerHeight
    (Positions the bottom of the item at the bottom of the viewport)
```

### 2.5 Stick-to-Bottom Algorithm

**Location**: Lines 219-281

```typescript
useLayoutEffect(() => {
  // Detect if user was at bottom
  const contentPreviouslyFit = prevTotalHeight <= prevContainerHeight;
  const wasScrolledToBottomPixels =
    prevScrollTop >= prevTotalHeight - prevContainerHeight - 1;
  const wasAtBottom = contentPreviouslyFit || wasScrolledToBottomPixels;

  // Re-enable sticking when manually scrolling back to bottom
  if (wasAtBottom && scrollTop >= prevScrollTop) {
    setIsStickingToBottom(true);
  }

  const listGrew = data.length > prevDataLength;
  const containerChanged = prevContainerHeight !== scrollableContainerHeight;

  // Trigger conditions for auto-scroll to bottom:
  // 1. List grew AND (was sticking OR was at bottom)
  // 2. Was sticking AND container size changed
  if (
    (listGrew && (isStickingToBottom || wasAtBottom)) ||
    (isStickingToBottom && containerChanged)
  ) {
    setScrollAnchor({
      index: data.length > 0 ? data.length - 1 : 0,
      offset: SCROLL_TO_ITEM_END,
    });
    if (!isStickingToBottom) {
      setIsStickingToBottom(true);
    }
  }
  // Handle list shrinking
  else if (
    (scrollAnchor.index >= data.length ||
      scrollTop > totalHeight - scrollableContainerHeight) &&
    data.length > 0
  ) {
    const newScrollTop = Math.max(0, totalHeight - scrollableContainerHeight);
    setScrollAnchor(getAnchorForScrollTop(newScrollTop, offsets));
  }
  // Handle empty list
  else if (data.length === 0) {
    setScrollAnchor({ index: 0, offset: 0 });
  }
}, [...dependencies]);
```

**State Machine Diagram**:
```
                     +-------------------+
                     |    NOT STICKING   |
                     +-------------------+
                            |   ^
        Manual scroll to    |   |  Manual scroll up
             bottom         |   |  (delta < 0)
                            v   |
                     +-------------------+
                     |    STICKING       |
                     +-------------------+
                            |
        When data grows:    |
        auto-scroll to      |
        new bottom          v
                     +-------------------+
                     |  SCROLL TO END    |
                     +-------------------+
```

---

## 3. Performance Optimizations

### 3.1 Memoization Strategy

| Memoized Value | Dependencies | Location |
|----------------|--------------|----------|
| `{ totalHeight, offsets }` | `[heights, data, estimatedItemHeight]` | Line 123-132 |
| `scrollTop` | `[scrollAnchor, offsets, heights, scrollableContainerHeight]` | Line 200-212 |
| `getAnchorForScrollTop` | `[]` (stable callback) | Line 185-198 |

### 3.2 Batched Scroll Updates

**Location**: `useBatchedScroll` hook (separate file)

```typescript
export function useBatchedScroll(currentScrollTop: number) {
  const pendingScrollTopRef = useRef<number | null>(null);
  const currentScrollTopRef = useRef(currentScrollTop);

  useEffect(() => {
    currentScrollTopRef.current = currentScrollTop;
    pendingScrollTopRef.current = null;  // Clear pending after render
  });

  const getScrollTop = useCallback(
    () => pendingScrollTopRef.current ?? currentScrollTopRef.current,
    [],
  );

  const setPendingScrollTop = useCallback((newScrollTop: number) => {
    pendingScrollTopRef.current = newScrollTop;
  }, []);

  return { getScrollTop, setPendingScrollTop };
}
```

**Purpose**: Allows multiple `scrollBy` calls within the same tick to accumulate correctly before the next render.

**Example**:
```typescript
// Without batching:
scrollBy(1);  // scrollTop: 0 -> 1
scrollBy(1);  // scrollTop: 0 -> 1 (WRONG! Still reads stale state)

// With batching:
scrollBy(1);  // pending: null -> 1, returns 1
scrollBy(1);  // pending: 1 -> 2, returns 2 (CORRECT!)
```

### 3.3 Height Re-render Minimization

**Location**: Lines 134-150

```typescript
useEffect(() => {
  setHeights((prevHeights) => {
    // No-op if length unchanged
    if (data.length === prevHeights.length) {
      return prevHeights;  // Same reference, no re-render
    }

    const newHeights = [...prevHeights];
    if (data.length < prevHeights.length) {
      newHeights.length = data.length;  // Truncate
    } else {
      // Fill new items with estimates
      for (let i = prevHeights.length; i < data.length; i++) {
        newHeights[i] = estimatedItemHeight(i);
      }
    }
    return newHeights;
  });
}, [data, estimatedItemHeight]);
```

**Optimization**: Returns same array reference when length unchanged, preventing unnecessary re-renders.

### 3.4 Lazy Array Copying

**Location**: Lines 163-178

```typescript
let newHeights: number[] | null = null;
for (let i = startIndex; i <= endIndex; i++) {
  const itemRef = itemRefs.current[i];
  if (itemRef) {
    const height = Math.round(measureElement(itemRef).height);
    if (height !== heights[i]) {
      if (!newHeights) {
        newHeights = [...heights];  // Only copy when needed
      }
      newHeights[i] = height;
    }
  }
}
if (newHeights) {
  setHeights(newHeights);
}
```

**Pattern**: Only allocates a new array if at least one height has changed.

### 3.5 Spacer-Based Virtualization

**Location**: Lines 345-347, 474-491

```typescript
const topSpacerHeight = offsets[startIndex] ?? 0;
const bottomSpacerHeight = totalHeight - (offsets[endIndex + 1] ?? totalHeight);

// Render structure:
<Box ref={containerRef} overflowY="scroll" scrollTop={scrollTop}>
  <Box flexDirection="column">
    <Box height={topSpacerHeight} />   {/* Top spacer */}
    {renderedItems}                     {/* Only visible items */}
    <Box height={bottomSpacerHeight} /> {/* Bottom spacer */}
  </Box>
</Box>
```

**Diagram**:
```
+----------------------------------+
|     TOP SPACER (topSpacerHeight) |  <- Represents items 0 to startIndex-1
+----------------------------------+
|     RENDERED ITEMS               |
|     [startIndex ... endIndex]    |  <- Actual DOM elements
+----------------------------------+
|  BOTTOM SPACER (bottomSpacerHeight)|  <- Represents items endIndex+1 to N-1
+----------------------------------+
```

---

## 4. Edge Cases Handled

### 4.1 Empty List

**Location**: Lines 262-265

```typescript
else if (data.length === 0) {
  setScrollAnchor({ index: 0, offset: 0 });
}
```

**Initial State** (Lines 94-98, 107):
```typescript
if (scrollToEnd) {
  return {
    index: data.length > 0 ? data.length - 1 : 0,  // Falls back to 0
    offset: SCROLL_TO_ITEM_END,
  };
}
// ...
return { index: 0, offset: 0 };  // Default for empty list
```

### 4.2 Single Item

The algorithm handles single items naturally:
- `startIndex = 0`, `endIndex = 0`
- `topSpacerHeight = 0`, `bottomSpacerHeight = 0`
- Only the single item is rendered

### 4.3 Dynamic Height Changes

**Handling**: The useLayoutEffect on every render (Lines 155-179) re-measures all visible items. When heights change:

1. New heights are detected by comparing measured vs stored values
2. Heights array is updated, triggering offset recalculation
3. Scroll position adjusts automatically via the anchor system

**Context-Driven Height Changes** (Test case Lines 204-282):
The test demonstrates items that change height via React context. The virtualized list correctly:
- Re-measures after context update
- Renders additional items to fill viewport
- Maintains scroll position stability

### 4.4 Rapid Scrolling (Multiple scrollBy Calls)

**Test Case**: Lines 284-326

```typescript
it('updates scroll position correctly when scrollBy is called multiple times in the same tick', async () => {
  await act(async () => {
    ref.current?.scrollBy(1);
    ref.current?.scrollBy(1);  // Both in same tick
    await delay(0);
  });
  expect(ref.current?.getScrollState().scrollTop).toBe(2);  // Correctly accumulated
});
```

**Solution**: The `useBatchedScroll` hook tracks pending scroll deltas in a ref, allowing multiple calls to accumulate before the next render.

### 4.5 List Shrinking (Anchor Invalidation)

**Location**: Lines 254-265

```typescript
else if (
  (scrollAnchor.index >= data.length ||     // Anchor item deleted
   scrollTop > totalHeight - scrollableContainerHeight) &&  // Past end
  data.length > 0
) {
  const newScrollTop = Math.max(0, totalHeight - scrollableContainerHeight);
  setScrollAnchor(getAnchorForScrollTop(newScrollTop, offsets));
}
```

**Behavior**: When items are removed and the current scroll position becomes invalid, the list clamps to the new maximum scroll position.

### 4.6 Container Resize

**Location**: Lines 234-252

```typescript
const containerChanged = prevContainerHeight !== scrollableContainerHeight;

if (isStickingToBottom && containerChanged) {
  setScrollAnchor({
    index: data.length > 0 ? data.length - 1 : 0,
    offset: SCROLL_TO_ITEM_END,
  });
}
```

**Behavior**: When the container resizes while sticking to bottom, the list re-anchors to maintain the bottom position.

### 4.7 Initial Scroll Edge Cases

**Location**: Lines 86-108, 283-331

```typescript
// SCROLL_TO_ITEM_END constant
export const SCROLL_TO_ITEM_END = Number.MAX_SAFE_INTEGER;

// Initial scroll handling
const scrollToEnd =
  initialScrollIndex === SCROLL_TO_ITEM_END ||
  (typeof initialScrollIndex === 'number' &&
    initialScrollIndex >= data.length - 1 &&
    initialScrollOffsetInIndex === SCROLL_TO_ITEM_END);
```

**Cases Handled**:
- `initialScrollIndex = SCROLL_TO_ITEM_END` -> Scroll to absolute end
- `initialScrollIndex = lastIndex, initialScrollOffsetInIndex = SCROLL_TO_ITEM_END` -> Same effect
- Invalid initial index (negative or out of bounds) -> Clamped to valid range

---

## 5. Integration Points

### 5.1 useKeypress Integration

**Location**: ScrollableList.tsx Lines 183-209

```typescript
useKeypress(
  (key: Key) => {
    if (keyMatchers[Command.SCROLL_UP](key)) {
      stopSmoothScroll();
      scrollByWithAnimation(-1);
    } else if (keyMatchers[Command.SCROLL_DOWN](key)) {
      stopSmoothScroll();
      scrollByWithAnimation(1);
    } else if (
      keyMatchers[Command.PAGE_UP](key) ||
      keyMatchers[Command.PAGE_DOWN](key)
    ) {
      const direction = keyMatchers[Command.PAGE_UP](key) ? -1 : 1;
      const scrollState = getScrollState();
      const current = smoothScrollState.current.active
        ? smoothScrollState.current.to
        : scrollState.scrollTop;
      const innerHeight = scrollState.innerHeight;
      smoothScrollTo(current + direction * innerHeight);
    } else if (keyMatchers[Command.SCROLL_HOME](key)) {
      smoothScrollTo(0);
    } else if (keyMatchers[Command.SCROLL_END](key)) {
      smoothScrollTo(SCROLL_TO_ITEM_END);
    }
  },
  { isActive: hasFocus },
);
```

**Key Bindings**:
| Action | Effect |
|--------|--------|
| SCROLL_UP | `scrollBy(-1)` with animation |
| SCROLL_DOWN | `scrollBy(+1)` with animation |
| PAGE_UP | Smooth scroll by `-containerHeight` |
| PAGE_DOWN | Smooth scroll by `+containerHeight` |
| SCROLL_HOME | Smooth scroll to top |
| SCROLL_END | Smooth scroll to bottom |

**Pattern**: The ScrollableList wrapper adds keyboard handling; VirtualizedList itself is keyboard-agnostic.

### 5.2 ScrollProvider Integration

**Location**: ScrollableList.tsx Lines 213-231

```typescript
const scrollableEntry = useMemo(
  () => ({
    ref: containerRef as React.RefObject<DOMElement>,
    getScrollState,
    scrollBy: scrollByWithAnimation,
    scrollTo: smoothScrollTo,
    hasFocus: hasFocusCallback,
    flashScrollbar,
  }),
  [...dependencies],
);

useScrollable(scrollableEntry, hasFocus);
```

**ScrollProvider Features**:
1. **Mouse Wheel Scrolling**: Routes scroll events to the correct scrollable based on mouse position
2. **Scrollbar Dragging**: Supports click-and-drag on the scrollbar thumb
3. **Track Clicking**: Supports clicking the scrollbar track to jump
4. **Nested Scrollables**: Finds the innermost scrollable at cursor position

**Registration Flow**:
```
ScrollableList mounts
        |
        v
useScrollable(entry, hasFocus)
        |
        v
ScrollProvider.register(entry)
        |
        v
Added to scrollables Map
        |
        v
useMouse receives scroll events
        |
        v
findScrollableCandidates() -> finds smallest matching area
        |
        v
entry.scrollBy(delta)
```

### 5.3 Animated Scrollbar Integration

**Location**: ScrollableList.tsx Lines 87-88

```typescript
const { scrollbarColor, flashScrollbar, scrollByWithAnimation } =
  useAnimatedScrollbar(hasFocus, scrollBy);
```

**Animation Phases**:
1. **Fade In**: 200ms, dark -> secondary color
2. **Visible**: 1000ms, stays visible
3. **Fade Out**: 300ms, secondary -> dark color

**Triggers**:
- Focus gained
- Any scroll action
- Manual `flashScrollbar()` call

---

## 6. Implementation Recommendations

### 6.1 Core Data Structures

For FloMaster, implement these core structures:

```typescript
// Scroll anchor for position stability
interface ScrollAnchor {
  index: number;      // Anchor item index
  offset: number;     // Pixel offset within item
}

// Cumulative offsets array
type Offsets = number[];  // offsets[i] = sum of heights[0..i-1]

// Heights cache
type Heights = number[];  // Measured or estimated heights
```

### 6.2 Essential Algorithms to Port

1. **Prefix Sum Offset Calculation** (Lines 123-132)
2. **Visible Range Calculation** (Lines 333-343)
3. **Anchor-to-ScrollTop Conversion** (Lines 200-212)
4. **ScrollTop-to-Anchor Conversion** (Lines 185-198)
5. **Stick-to-Bottom Logic** (Lines 219-281)
6. **Batched Scroll Updates** (useBatchedScroll.ts)

### 6.3 Suggested Simplifications

For initial FloMaster implementation:

1. **Skip Mouse Scrollbar Interaction**: Complex and terminal-specific
2. **Skip Smooth Scrolling Animations**: Add later for polish
3. **Skip Animated Scrollbar Colors**: Add later for polish
4. **Use Fixed Item Heights Initially**: Simplifies offset calculation
5. **Skip Nested Scrollables**: Single scrollable per view initially

### 6.4 Testing Strategy

Based on the test file (VirtualizedList.test.tsx):

1. **Visible Item Verification**: Ensure only visible items render
2. **Stick-to-Bottom**: Test auto-scroll when items added at bottom
3. **Imperative Scroll Methods**: Test all ref methods
4. **Mounted Item Count**: Verify virtualization is working
5. **Dynamic Height Changes**: Test items that change size
6. **Rapid Scroll Accumulation**: Test multiple scrollBy in same tick

### 6.5 File Structure Recommendation

```
packages/cli/src/components/
  shared/
    virtualizedList/
      virtualizedList.tsx         # Main component
      virtualizedList.test.tsx    # Unit tests
      useBatchedScroll.ts         # Scroll batching hook
      types.ts                    # Interfaces
      index.ts                    # Barrel export
```

### 6.6 Key Constants

```typescript
// Sentinel value for "scroll to end of item"
export const SCROLL_TO_ITEM_END = Number.MAX_SAFE_INTEGER;

// Animation frame duration (if implementing smooth scroll)
const ANIMATION_FRAME_DURATION_MS = 33;  // ~30fps
```

---

## Summary

The VirtualizedList component implements a sophisticated virtualization system with these key characteristics:

1. **Anchor-Based Scrolling**: Uses item index + offset pairs for stable positioning
2. **Dynamic Height Support**: Measures items on every render, updates heights incrementally
3. **Stick-to-Bottom Mode**: Automatically scrolls to show new items when user is at bottom
4. **Batched Updates**: Handles multiple scroll calls per tick correctly
5. **Spacer-Based Rendering**: Uses empty boxes to maintain scroll height without rendering hidden items

The component is designed for terminal environments (Ink) but the core algorithms are portable to any virtualized list implementation.
