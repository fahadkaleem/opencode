# Gemini CLI Layout Patterns Analysis

> SDK-Agnostic layout patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI demonstrates sophisticated layout patterns:

1. **Flexbox-first architecture** using Ink's Box component
2. **Two rendering modes**: Normal scrolling vs. Alternate buffer (full-screen)
3. **Responsive design** via width detection at 80-column breakpoint
4. **Fixed + scrollable architecture** with fixed input and scrollable content
5. **Size constraint components** for content truncation (MaxSizedBox)
6. **Overflow tracking context** for managing truncated content

---

## 1. Box Flexbox Patterns

### Root Layout Structure

**File**: `packages/cli/src/ui/layouts/DefaultAppLayout.tsx:30-65`

```tsx
<Box
  flexDirection="column"
  width={width}
  height={isAlternateBuffer ? terminalHeight - 1 : undefined}
  flexShrink={0}
  flexGrow={0}
  overflow="hidden"
>
  <MainContent />                   // Scrollable area (flexGrow in alt buffer)
  <Box                              // Fixed bottom controls
    flexDirection="column"
    flexShrink={0}
    flexGrow={0}
  >
    <Notifications />
    <DialogManager />
    <Composer />
  </Box>
</Box>
```

**Key Pattern**: Main content grows to fill space; bottom controls stay fixed with `flexShrink={0}`.

### Horizontal Layout with Space-Between

```tsx
<Box
  justifyContent="space-between"
  width={mainAreaWidth}
  flexDirection="row"
  alignItems="center"
>
  <Box>{/* Left section */}</Box>
  <Box flexGrow={1} justifyContent="center">{/* Center */}</Box>
  <Box justifyContent="flex-end">{/* Right */}</Box>
</Box>
```

### Responsive Row/Column Switch

**File**: `packages/cli/src/ui/components/Composer.tsx:83-135`

```tsx
const isNarrow = isNarrowWidth(terminalWidth);

<Box
  flexDirection={isNarrow ? 'column' : 'row'}
  alignItems={isNarrow ? 'flex-start' : 'center'}
>
```

---

## 2. Terminal Responsive Patterns

### Terminal Size Detection Hook

**File**: `packages/cli/src/ui/hooks/useTerminalSize.ts:9-30`

```typescript
export function useTerminalSize(): { columns: number; rows: number } {
  const [size, setSize] = useState({
    columns: process.stdout.columns || 60,
    rows: process.stdout.rows || 20,
  });

  useEffect(() => {
    const updateSize = () => setSize({
      columns: process.stdout.columns || 60,
      rows: process.stdout.rows || 20,
    });
    process.stdout.on('resize', updateSize);
    return () => process.stdout.off('resize', updateSize);
  }, []);

  return size;
}
```

### Narrow Width Detection

**File**: `packages/cli/src/ui/utils/isNarrowWidth.ts:7-9`

```typescript
export function isNarrowWidth(width: number): boolean {
  return width < 80;
}
```

### Main Area Width Calculation

**File**: `packages/cli/src/ui/utils/ui-sizing.ts:11-37`

```typescript
const getMainAreaWidth = (terminalWidth: number): number => {
  if (terminalWidth <= 80) return Math.round(0.98 * terminalWidth);
  if (terminalWidth >= 132) return Math.round(0.9 * terminalWidth);

  // Linear interpolation between 80 and 132 columns
  const t = (terminalWidth - 80) / (132 - 80);
  const percentage = lerp(98, 90, t);
  return Math.round(percentage * terminalWidth * 0.01);
};
```

---

## 3. Layout Component Hierarchy

### App Entry Point

```
App
├── StreamingContext.Provider
│   ├── [isScreenReaderEnabled]
│   │   ├── ScreenReaderAppLayout
│   │   └── DefaultAppLayout
│   └── [quittingMessages]
│       └── QuittingDisplay
```

### DefaultAppLayout Structure

```
DefaultAppLayout
├── Box (root container, column)
│   ├── MainContent               // Scrollable history
│   │   ├── [alternateBuffer] → ScrollableList
│   │   └── [normal] → Static + pending items
│   └── Box (controls, flexShrink=0)
│       ├── Notifications
│       ├── CopyModeWarning
│       ├── [DialogManager | Composer]
│       └── ExitWarning
```

---

## 4. Fixed + Scrollable Architecture

### Two Rendering Modes

**Normal Mode** (Default):
```tsx
// Uses Ink's Static component for history
<>
  <Static items={[<AppHeader />, ...historyItems]}>
    {(item) => item}
  </Static>
  {pendingItems}
</>
```

**Alternate Buffer Mode**:
```tsx
// Uses virtualized list for full-screen
<ScrollableList
  hasFocus={!uiState.isDialogOpen}
  data={virtualizedData}
  renderItem={renderItem}
  estimatedItemHeight={() => 100}
  initialScrollIndex={SCROLL_TO_ITEM_END}
/>
```

### Scrollable Container

**File**: `packages/cli/src/ui/components/shared/Scrollable.tsx:32-165`

```tsx
<Box
  maxHeight={maxHeight}
  width={width}
  flexDirection="column"
  overflowY="scroll"
  scrollTop={scrollTop}
  scrollbarThumbColor={scrollbarColor}
>
  <Box flexShrink={0} paddingRight={1} flexDirection="column">
    {children}
  </Box>
</Box>
```

---

## 5. Size Constraint Patterns

### MaxSizedBox Component

**File**: `packages/cli/src/ui/components/shared/MaxSizedBox.tsx:99-203`

```tsx
interface MaxSizedBoxProps {
  maxWidth?: number;
  maxHeight: number | undefined;
  overflowDirection?: 'top' | 'bottom';
  additionalHiddenLinesCount?: number;
}

// Shows truncation indicator
{totalHiddenLines > 0 && (
  <Text color={theme.text.secondary}>
    ... first {totalHiddenLines} lines hidden ...
  </Text>
)}
```

### Overflow Context

**File**: `packages/cli/src/ui/contexts/OverflowContext.tsx`

Tracks which components have hidden content:

```typescript
interface OverflowState {
  overflowingIds: ReadonlySet<string>;
}

interface OverflowActions {
  addOverflowingId: (id: string) => void;
  removeOverflowingId: (id: string) => void;
}
```

---

## 6. Bordered Container Patterns

### Input Prompt with Border

**File**: `packages/cli/src/ui/components/InputPrompt.tsx:1015-1027`

```tsx
<Box
  borderStyle="round"
  borderColor={isFocused ? theme.border.focused : theme.border.default}
  paddingX={1}
  width={mainAreaWidth}
  flexDirection="row"
  alignItems="flex-start"
  minHeight={3}
>
  <Text color={theme.text.accent}>{'>'} </Text>
  <Box flexGrow={1} flexDirection="column">
    {/* Input content */}
  </Box>
</Box>
```

---

## 7. Recommendations for FloMaster CLI

### Layout Architecture

```
FloMasterCLI
├── Box (root, column, width=calculatedWidth)
│   ├── MainContent (flexGrow=1)
│   │   ├── [alternateBuffer] → VirtualizedList
│   │   └── [normal] → Static + dynamic
│   └── Box (controls, flexShrink=0)
│       ├── Notifications
│       ├── InputPrompt (bordered)
│       └── StatusBar
```

### Core Hooks to Implement

1. **useTerminalSize** - Track terminal dimensions
2. **useAlternateBuffer** - Setting-based alternate buffer toggle
3. **useNarrowWidth** - Responsive breakpoint detection

### Key Flexbox Patterns

| Pattern | Props | Use Case |
|---------|-------|----------|
| Fixed size | `flexShrink={0} flexGrow={0}` | Headers, footers, input |
| Fill space | `flexGrow={1}` | Main content |
| Prevent overflow | `overflow="hidden"` | Root containers |
| Vertical stack | `flexDirection="column"` | Most layouts |
| Horizontal distribute | `justifyContent="space-between"` | Footer, status bars |
| Responsive direction | `flexDirection={isNarrow ? 'column' : 'row'}` | Adaptive layouts |
