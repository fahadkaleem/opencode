# TextBuffer Module Analysis

> Comprehensive deep-dive into the TextBuffer state management system.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/shared/text-buffer.ts`
**Lines**: 2469 total

---

## Table of Contents

1. [Overview](#overview)
2. [State Structure](#state-structure)
3. [Action Catalog](#action-catalog)
4. [Visual Layout System](#visual-layout-system)
5. [Undo/Redo System](#undoredo-system)
6. [Cursor Management](#cursor-management)
7. [Word Navigation Algorithms](#word-navigation-algorithms)
8. [Implementation Recommendations](#implementation-recommendations)

---

## Overview

The TextBuffer module is a sophisticated text editing state machine designed for terminal-based text input. It handles:

- Multi-line text editing with word wrapping
- Unicode-aware cursor positioning (CJK, emoji, combining marks)
- Vim keybinding support
- Undo/redo history
- Visual layout calculation for viewport rendering
- Bidirectional mapping between logical and visual coordinates

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        useTextBuffer Hook                        │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │  useReducer  │───>│ textBuffer    │───>│ calculateLayout  │  │
│  │   (state)    │    │   Reducer     │    │   (memoized)     │  │
│  └──────────────┘    └───────────────┘    └──────────────────┘  │
│         │                    │                     │             │
│         ▼                    ▼                     ▼             │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │ TextBuffer   │    │ VimAction     │    │  VisualLayout    │  │
│  │   State      │    │   Handler     │    │   Calculation    │  │
│  └──────────────┘    └───────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Structure

### TextBufferState Interface (Lines 889-901)

```typescript
interface TextBufferState {
  lines: string[];                              // Logical lines of text
  cursorRow: number;                            // Current row (0-indexed)
  cursorCol: number;                            // Current column (code-point index)
  preferredCol: number | null;                  // Sticky column for vertical movement
  undoStack: UndoHistoryEntry[];               // Undo history
  redoStack: UndoHistoryEntry[];               // Redo history
  clipboard: string | null;                     // Internal clipboard (currently unused)
  selectionAnchor: [number, number] | null;    // Selection start point
  viewportWidth: number;                        // Terminal width
  viewportHeight: number;                       // Terminal height
  visualLayout: VisualLayout;                   // Computed visual layout
}
```

### Field Details

| Field | Type | Purpose | Updates When |
|-------|------|---------|--------------|
| `lines` | `string[]` | Logical text content split by newlines | Any text modification |
| `cursorRow` | `number` | Logical row position | Cursor movement, text edits |
| `cursorCol` | `number` | Code-point offset in current line | Cursor movement, text edits |
| `preferredCol` | `number \| null` | Remembered column for up/down movement | Set on vertical move, cleared on horizontal |
| `undoStack` | `UndoHistoryEntry[]` | History for undo operations | Before each mutating action |
| `redoStack` | `UndoHistoryEntry[]` | History for redo operations | On undo (push), on new edit (clear) |
| `clipboard` | `string \| null` | Cut/copy buffer | Not currently used in reducer |
| `selectionAnchor` | `[row, col] \| null` | Selection mode anchor | Selection operations |
| `viewportWidth` | `number` | Terminal column count | Viewport resize |
| `viewportHeight` | `number` | Terminal row count | Viewport resize |
| `visualLayout` | `VisualLayout` | Computed wrapped lines + mappings | Lines or viewport width change |

### UndoHistoryEntry Interface (Lines 564-568)

```typescript
interface UndoHistoryEntry {
  lines: string[];
  cursorRow: number;
  cursorCol: number;
}
```

### VisualLayout Interface (Lines 673-679)

```typescript
interface VisualLayout {
  visualLines: string[];                           // Wrapped lines for display
  logicalToVisualMap: Array<Array<[number, number]>>;  // [visualLineIndex, startColInLogical]
  visualToLogicalMap: Array<[number, number]>;         // [logicalLineIndex, startColInLogical]
}
```

### Initial State Creation (Lines 1573-1596)

```typescript
const initialState = useMemo((): TextBufferState => {
  const lines = initialText.split('\n');
  const [initialCursorRow, initialCursorCol] = calculateInitialCursorPosition(
    lines.length === 0 ? [''] : lines,
    initialCursorOffset,
  );
  const visualLayout = calculateLayout(
    lines.length === 0 ? [''] : lines,
    viewport.width,
  );
  return {
    lines: lines.length === 0 ? [''] : lines,
    cursorRow: initialCursorRow,
    cursorCol: initialCursorCol,
    preferredCol: null,
    undoStack: [],
    redoStack: [],
    clipboard: null,
    selectionAnchor: null,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    visualLayout,
  };
}, [initialText, initialCursorOffset, viewport.width, viewport.height]);
```

---

## Action Catalog

### Complete Action Type Union (Lines 918-991)

The system defines 51 distinct action types organized into categories:

### 1. Core Text Operations (12 actions)

| Action | Payload | Purpose | Line |
|--------|---------|---------|------|
| `set_text` | `{ payload: string, pushToUndo?: boolean }` | Replace entire buffer | 919 |
| `insert` | `{ payload: string }` | Insert text at cursor | 920 |
| `backspace` | none | Delete character before cursor | 921 |
| `delete` | none | Delete character at cursor | 936 |
| `delete_word_left` | none | Delete word before cursor | 937 |
| `delete_word_right` | none | Delete word after cursor | 938 |
| `kill_line_right` | none | Delete to end of line | 939 |
| `kill_line_left` | none | Delete to start of line | 940 |
| `replace_range` | `{ startRow, startCol, endRow, endCol, text }` | Replace range with text | 943-952 |
| `create_undo_snapshot` | none | Create manual undo point | 954 |
| `undo` | none | Restore previous state | 941 |
| `redo` | none | Restore undone state | 942 |

### 2. Cursor Movement (4 actions)

| Action | Payload | Purpose | Line |
|--------|---------|---------|------|
| `move` | `{ dir: Direction }` | Move cursor in direction | 922-927 |
| `set_cursor` | `{ cursorRow, cursorCol, preferredCol }` | Set cursor position | 928-934 |
| `move_to_offset` | `{ offset: number }` | Move to absolute offset | 953 |
| `set_viewport` | `{ width, height }` | Update viewport dimensions | 955 |

### 3. Vim Movement Commands (13 actions)

| Action | Payload | Vim Key | Purpose | Line |
|--------|---------|---------|---------|------|
| `vim_move_left` | `{ count }` | `h` | Move left N chars | 971 |
| `vim_move_right` | `{ count }` | `l` | Move right N chars | 972 |
| `vim_move_up` | `{ count }` | `k` | Move up N lines | 973 |
| `vim_move_down` | `{ count }` | `j` | Move down N lines | 974 |
| `vim_move_word_forward` | `{ count }` | `w` | Move to next word start | 975 |
| `vim_move_word_backward` | `{ count }` | `b` | Move to previous word start | 976 |
| `vim_move_word_end` | `{ count }` | `e` | Move to word end | 977 |
| `vim_move_to_line_start` | none | `0` | Move to line start | 985 |
| `vim_move_to_line_end` | none | `$` | Move to line end | 986 |
| `vim_move_to_first_nonwhitespace` | none | `^` | Move to first non-space | 987 |
| `vim_move_to_first_line` | none | `gg` | Move to first line | 988 |
| `vim_move_to_last_line` | none | `G` | Move to last line | 989 |
| `vim_move_to_line` | `{ lineNumber }` | `[N]G` | Move to line N | 990 |

### 4. Vim Delete Commands (6 actions)

| Action | Payload | Vim Key | Purpose | Line |
|--------|---------|---------|---------|------|
| `vim_delete_word_forward` | `{ count }` | `dw` | Delete word forward | 956 |
| `vim_delete_word_backward` | `{ count }` | `db` | Delete word backward | 957 |
| `vim_delete_word_end` | `{ count }` | `de` | Delete to word end | 958 |
| `vim_delete_line` | `{ count }` | `dd` | Delete N lines | 962 |
| `vim_delete_to_end_of_line` | none | `D` | Delete to EOL | 964 |
| `vim_delete_char` | `{ count }` | `x` | Delete N chars | 978 |

### 5. Vim Change Commands (7 actions)

| Action | Payload | Vim Key | Purpose | Line |
|--------|---------|---------|---------|------|
| `vim_change_word_forward` | `{ count }` | `cw` | Change word forward | 959 |
| `vim_change_word_backward` | `{ count }` | `cb` | Change word backward | 960 |
| `vim_change_word_end` | `{ count }` | `ce` | Change to word end | 961 |
| `vim_change_line` | `{ count }` | `cc` | Change N lines | 963 |
| `vim_change_to_end_of_line` | none | `C` | Change to EOL | 965 |
| `vim_change_movement` | `{ movement, count }` | `ch/cj/ck/cl` | Change with movement | 966-969 |

### 6. Vim Insert Mode Entry (7 actions)

| Action | Payload | Vim Key | Purpose | Line |
|--------|---------|---------|---------|------|
| `vim_insert_at_cursor` | none | `i` | Enter insert at cursor | 979 |
| `vim_append_at_cursor` | none | `a` | Enter insert after cursor | 980 |
| `vim_open_line_below` | none | `o` | Open line below, enter insert | 981 |
| `vim_open_line_above` | none | `O` | Open line above, enter insert | 982 |
| `vim_append_at_line_end` | none | `A` | Append at line end | 983 |
| `vim_insert_at_line_start` | none | `I` | Insert at first non-space | 984 |
| `vim_escape_insert_mode` | none | `Esc` | Exit insert mode | 991 |

### Direction Type (Lines 25-33)

```typescript
type Direction =
  | 'left'     // Move one character left
  | 'right'    // Move one character right
  | 'up'       // Move one visual line up
  | 'down'     // Move one visual line down
  | 'wordLeft' // Move to previous word boundary
  | 'wordRight'// Move to next word boundary
  | 'home'     // Move to start of visual line
  | 'end';     // Move to end of visual line
```

---

## Visual Layout System

### Purpose

The visual layout system handles word wrapping for terminal display. It maintains a bidirectional mapping between:

- **Logical coordinates**: Row/column in the original text (newline-separated)
- **Visual coordinates**: Row/column in the wrapped display

### Core Algorithm (Lines 683-833)

```
calculateLayout(logicalLines: string[], viewportWidth: number): VisualLayout
```

#### Pseudocode

```
FUNCTION calculateLayout(logicalLines, viewportWidth):
    visualLines = []
    logicalToVisualMap = []
    visualToLogicalMap = []

    FOR EACH logicalLine AT logIndex IN logicalLines:
        logicalToVisualMap[logIndex] = []

        IF logicalLine IS EMPTY:
            # Empty line maps to single empty visual line
            logicalToVisualMap[logIndex].PUSH([visualLines.length, 0])
            visualToLogicalMap.PUSH([logIndex, 0])
            visualLines.PUSH('')
            CONTINUE

        codePoints = toCodePoints(logicalLine)
        currentPos = 0

        WHILE currentPos < codePoints.length:
            chunk = ''
            chunkWidth = 0
            numCodePoints = 0
            lastWordBreak = -1
            codePointsAtWordBreak = 0

            # Build chunk until it exceeds viewport width
            FOR i FROM currentPos TO codePoints.length:
                char = codePoints[i]
                charWidth = getCachedStringWidth(char)  # Handles CJK, emoji

                IF chunkWidth + charWidth > viewportWidth:
                    # Would exceed width - check for word break opportunity
                    IF lastWordBreak EXISTS AND reasonable:
                        # Break at last word boundary
                        chunk = codePoints[currentPos..currentPos+codePointsAtWordBreak]
                        numCodePoints = codePointsAtWordBreak
                    ELSE:
                        # Hard break at current position
                        # (or force single wide char if needed)
                    BREAK

                chunk += char
                chunkWidth += charWidth
                numCodePoints++

                IF char == ' ':
                    lastWordBreak = i
                    codePointsAtWordBreak = numCodePoints - 1  # Chars before space

            # Record mappings
            logicalToVisualMap[logIndex].PUSH([visualLines.length, currentPos])
            visualToLogicalMap.PUSH([logIndex, currentPos])
            visualLines.PUSH(chunk)

            # Advance position, skip leading space on next chunk
            currentPos += numCodePoints
            IF currentPos < codePoints.length AND codePoints[currentPos] == ' ':
                currentPos++

    RETURN { visualLines, logicalToVisualMap, visualToLogicalMap }
```

### Character Width Handling

The system uses `getCachedStringWidth()` (imported from textUtils) which handles:

- **ASCII**: Width 1
- **CJK characters**: Width 2 (Han, Hiragana, Katakana)
- **Emoji**: Variable width (typically 2)
- **Combining marks**: Width 0 (attached to base character)

### Visual Cursor Calculation (Lines 837-885)

```typescript
function calculateVisualCursorFromLayout(
  layout: VisualLayout,
  logicalCursor: [number, number],
): [number, number]
```

Maps logical cursor position to visual position by:

1. Finding which visual line segment contains the logical column
2. Calculating offset within that segment
3. Clamping to visual line length

### Layout Recalculation Trigger (Lines 1546-1557)

Layout is recalculated **only** when:

```typescript
if (newState.lines !== state.lines ||
    newState.viewportWidth !== state.viewportWidth) {
  return {
    ...newState,
    visualLayout: calculateLayout(newState.lines, newState.viewportWidth),
  };
}
```

This uses reference equality for efficiency - layout is NOT recalculated for:
- Cursor movement only
- Selection changes
- History operations that don't change content

---

## Undo/Redo System

### History Entry Structure

```typescript
interface UndoHistoryEntry {
  lines: string[];      // Complete line array snapshot
  cursorRow: number;    // Cursor row at snapshot time
  cursorCol: number;    // Cursor column at snapshot time
}
```

**Note**: Does not include `preferredCol`, `clipboard`, `selectionAnchor`, or `visualLayout`.

### Snapshot Creation (Lines 905-916)

```typescript
const historyLimit = 100;

export const pushUndo = (currentState: TextBufferState): TextBufferState => {
  const snapshot = {
    lines: [...currentState.lines],  // Shallow copy of array
    cursorRow: currentState.cursorRow,
    cursorCol: currentState.cursorCol,
  };
  const newStack = [...currentState.undoStack, snapshot];
  if (newStack.length > historyLimit) {
    newStack.shift();  // Remove oldest entry
  }
  return { ...currentState, undoStack: newStack, redoStack: [] };  // Clear redo!
};
```

### State Machine

```
                    ┌─────────────┐
                    │   NORMAL    │
                    │   STATE     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │  MUTATE   │    │   UNDO    │    │   REDO    │
   │  (insert, │    │           │    │           │
   │  delete)  │    │           │    │           │
   └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
         │                │                │
         ▼                ▼                ▼
   pushUndo()        Pop undo,        Pop redo,
   - Push current    push current     push current
   - Clear redo      to redo          to undo
```

### Undo Operation (Lines 1431-1445)

```typescript
case 'undo': {
  const stateToRestore = state.undoStack[state.undoStack.length - 1];
  if (!stateToRestore) return state;  // Nothing to undo

  const currentSnapshot = {
    lines: [...state.lines],
    cursorRow: state.cursorRow,
    cursorCol: state.cursorCol,
  };
  return {
    ...state,
    ...stateToRestore,                        // Restore previous state
    undoStack: state.undoStack.slice(0, -1),  // Pop from undo
    redoStack: [...state.redoStack, currentSnapshot],  // Push to redo
  };
}
```

### Redo Operation (Lines 1448-1463)

```typescript
case 'redo': {
  const stateToRestore = state.redoStack[state.redoStack.length - 1];
  if (!stateToRestore) return state;  // Nothing to redo

  const currentSnapshot = {
    lines: [...state.lines],
    cursorRow: state.cursorRow,
    cursorCol: state.cursorCol,
  };
  return {
    ...state,
    ...stateToRestore,                        // Restore redo state
    redoStack: state.redoStack.slice(0, -1),  // Pop from redo
    undoStack: [...state.undoStack, currentSnapshot],  // Push to undo
  };
}
```

### History Clearing Rules

| Trigger | Undo Stack | Redo Stack |
|---------|------------|------------|
| Any mutating action | Pushed (before change) | **Cleared** |
| Undo | Popped | Pushed |
| Redo | Pushed | Popped |
| `set_text` with `pushToUndo: false` | Unchanged | Unchanged |

---

## Cursor Management

### Cursor Position Validation

Cursor is always clamped to valid bounds after any operation:

```typescript
cursorRow: Math.min(Math.max(finalCursorRow, 0), newLines.length - 1),
cursorCol: Math.max(0, Math.min(finalCursorCol, cpLen(newLines[finalCursorRow] || ''))),
```

### Preferred Column Concept

The `preferredCol` field implements "sticky column" behavior for vertical navigation:

**Problem**: When moving up/down through lines of varying lengths, the cursor should try to maintain its horizontal position.

**Solution**:

1. On first vertical move: `preferredCol = currentVisualCol`
2. On subsequent vertical moves: use `preferredCol` to position cursor
3. On any horizontal move: `preferredCol = null` (reset)

```typescript
case 'up':
  if (newVisualRow > 0) {
    if (newPreferredCol === null) newPreferredCol = newVisualCol;  // Remember
    newVisualRow--;
    newVisualCol = clamp(newPreferredCol, 0, cpLen(visualLines[newVisualRow] ?? ''));
  }
  break;
```

### Visual vs Logical Cursor

The system maintains two cursor representations:

| Type | Fields | Use |
|------|--------|-----|
| Logical | `cursorRow`, `cursorCol` | Text operations, storage |
| Visual | `visualCursor: [row, col]` | Display rendering |

Conversion is performed via `calculateVisualCursorFromLayout()` (Lines 837-885).

### Selection Handling

Selection uses `selectionAnchor: [row, col] | null`:

- When `null`: No active selection
- When set: Selection spans from anchor to cursor

Currently not heavily utilized in the reducer - appears prepared for future selection operations.

---

## Word Navigation Algorithms

### Character Classification (Lines 36-63)

```typescript
// Strict word character (letters, numbers, underscore)
isWordCharStrict = (char) => /[\w\p{L}\p{N}]/u.test(char)

// Whitespace
isWhitespace = (char) => /\s/.test(char)

// Combining marks (diacritics, etc.)
isCombiningMark = (char) => /\p{M}/u.test(char)

// Word char including combining marks
isWordCharWithCombining = (char) => isWordCharStrict(char) || isCombiningMark(char)

// Script detection for multi-script word boundaries
getCharScript = (char) => {
  if (/[\p{Script=Latin}]/u.test(char)) return 'latin';
  if (/[\p{Script=Han}]/u.test(char)) return 'han';     // Chinese
  if (/[\p{Script=Arabic}]/u.test(char)) return 'arabic';
  // ... etc
}

// Different scripts create word boundaries
isDifferentScript = (char1, char2) => getCharScript(char1) !== getCharScript(char2)
```

### Word Boundary Detection

Uses `Intl.Segmenter` for standard word boundaries (Lines 244-287):

```typescript
const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

function findPrevWordBoundary(line: string, cursorCol: number): number {
  // Iterates segments, finds last word start before cursor
}

function findNextWordBoundary(line: string, cursorCol: number): number {
  // Iterates segments, finds first word end after cursor
}
```

### Vim Word Navigation (Lines 66-400)

Vim uses different word motion semantics:

- **`w`**: Move to start of next word (skips punctuation as separate "words")
- **`b`**: Move to start of previous word
- **`e`**: Move to end of current/next word

```
findNextWordStartInLine(line, col)   // For vim 'w'
findPrevWordStartInLine(line, col)   // For vim 'b'
findWordEndInLine(line, col)         // For vim 'e'
findNextWordAcrossLines(...)         // Cross-line navigation
findPrevWordAcrossLines(...)         // Cross-line navigation
```

### Cross-Line Word Search Algorithm

```
FUNCTION findNextWordAcrossLines(lines, cursorRow, cursorCol, searchForWordStart):
    # Try current line first
    result = searchForWordStart
        ? findNextWordStartInLine(currentLine, cursorCol)
        : findWordEndInLine(currentLine, cursorCol)

    IF result FOUND:
        RETURN { row: cursorRow, col: result }

    # Search subsequent lines
    FOR row FROM cursorRow+1 TO lines.length-1:
        line = lines[row]

        IF line IS EMPTY:
            # Handle empty lines specially
            CONTINUE or RETURN based on remaining content

        # Find first non-whitespace
        firstNonWhite = skipWhitespace(line, 0)

        IF searchForWordStart:
            RETURN { row, col: firstNonWhite }
        ELSE:
            wordEnd = findWordEndInLine(line, firstNonWhite)
            RETURN { row, col: wordEnd }

    RETURN null  # No more words
```

---

## Implementation Recommendations

### For FloMaster CLI

#### 1. State Structure Adoption

Adopt the core state structure with modifications:

```typescript
interface FloTextBufferState {
  // Core (keep as-is)
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  preferredCol: number | null;

  // History (keep, consider increasing limit)
  undoStack: UndoHistoryEntry[];
  redoStack: UndoHistoryEntry[];

  // Layout (keep)
  viewportWidth: number;
  viewportHeight: number;
  visualLayout: VisualLayout;

  // Consider removing (not used in reducer)
  // clipboard: string | null;  -- Use system clipboard instead
  // selectionAnchor -- Add when needed
}
```

#### 2. Vim Support Strategy

**Option A: Full Vim Support**
- Include all vim actions
- Requires vim mode state management externally
- More complex but familiar to vim users

**Option B: Minimal Vim Subset**
- Include basic motions: `h`, `j`, `k`, `l`, `w`, `b`, `e`
- Skip: delete/change operators, `g` commands, registers
- Simpler implementation

**Recommendation**: Start with Option B, add vim features incrementally based on user demand.

#### 3. Layout Calculation Optimization

The current implementation recalculates layout on every text change. For large documents:

```typescript
// Consider debouncing for non-critical rendering
const debouncedLayout = useMemo(() =>
  debounce(() => calculateLayout(lines, width), 16), // ~60fps
  [lines, width]
);

// Or virtualize for very long documents
// Only calculate visible portion + buffer
```

#### 4. Undo Granularity

Current implementation creates undo point before each character. Consider:

```typescript
// Coalesce rapid typing into single undo entry
const shouldCreateUndoPoint = (
  lastAction: TextBufferAction,
  currentAction: TextBufferAction,
  timeSinceLastAction: number
): boolean => {
  if (lastAction.type !== 'insert' || currentAction.type !== 'insert') return true;
  if (timeSinceLastAction > 1000) return true;  // 1 second gap
  if (/\s/.test(currentAction.payload)) return true;  // Whitespace
  return false;
};
```

#### 5. Unicode Handling

The text-buffer correctly uses code points for all positioning. Ensure FloMaster imports these utilities:

```typescript
// Required utilities from textUtils
toCodePoints(str: string): string[]           // Split into code points
cpLen(str: string): number                    // Length in code points
cpSlice(str: string, start, end?): string     // Slice by code points
getCachedStringWidth(str: string): number     // Display width
stripUnsafeCharacters(str: string): string    // Remove control chars
```

#### 6. Action Subset for FloMaster

Recommended minimal action set for initial implementation:

```typescript
type FloTextBufferAction =
  // Core text operations
  | { type: 'set_text'; payload: string }
  | { type: 'insert'; payload: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'delete_word_left' }
  | { type: 'delete_word_right' }

  // Cursor movement
  | { type: 'move'; payload: { dir: Direction } }
  | { type: 'set_cursor'; payload: { row: number; col: number } }

  // History
  | { type: 'undo' }
  | { type: 'redo' }

  // Viewport
  | { type: 'set_viewport'; payload: { width: number; height: number } }
```

#### 7. External Editor Integration

The external editor feature (Lines 1885-1930) is valuable for CLI:

```typescript
openInExternalEditor: async () => {
  // 1. Create undo snapshot
  // 2. Write buffer to temp file
  // 3. Disable raw mode
  // 4. Spawn editor synchronously
  // 5. Read file back
  // 6. Re-enable raw mode
  // 7. Cleanup temp file
}
```

Key consideration: Uses `spawnSync` to block until editor closes.

---

## Line Number Reference Index

| Concept | Lines |
|---------|-------|
| State interface | 889-901 |
| Action type union | 918-991 |
| Reducer main logic | 998-1537 |
| Layout calculation | 683-833 |
| Visual cursor calculation | 837-885 |
| Undo push function | 905-916 |
| Undo action | 1431-1445 |
| Redo action | 1448-1463 |
| Insert action | 1028-1080 |
| Backspace action | 1082-1115 |
| Move action | 1129-1278 |
| Word navigation helpers | 36-400 |
| useTextBuffer hook | 1561-2224 |
| TextBuffer interface (return type) | 2226-2468 |
| Vim actions handler | vim-buffer-actions.ts:76-813 |
