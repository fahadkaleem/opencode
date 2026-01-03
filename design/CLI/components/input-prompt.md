# InputPrompt Component Analysis

> Comprehensive analysis of Gemini CLI's InputPrompt component for FloMaster implementation reference.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/InputPrompt.tsx`

---

## Table of Contents

1. [Component Overview](#component-overview)
2. [Props Interface](#props-interface)
3. [State Management](#state-management)
4. [Integration with TextBuffer](#integration-with-textbuffer)
5. [Input Handling Flow](#input-handling-flow)
6. [Completion System](#completion-system)
7. [Validation & Guards](#validation--guards)
8. [Visual Rendering](#visual-rendering)
9. [Implementation Recommendations](#implementation-recommendations)

---

## Component Overview

The `InputPrompt` is a high-complexity Ink component (approximately 1200 lines) that serves as the primary user input interface. It combines:

- Multi-line text editing via TextBuffer
- Tab completion for slash commands, file paths, and prompts
- Input history navigation
- Shell mode support with reverse search
- Clipboard paste handling (including images)
- Mouse click positioning
- Vim mode integration (optional)
- Ghost text predictions

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      InputPrompt Component                       │
├─────────────────────────────────────────────────────────────────┤
│  Props: buffer, onSubmit, config, slashCommands, etc.           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────────┐   │
│  │  TextBuffer  │◄───│  useKeypress  │◄───│  stdin events   │   │
│  │  (external)  │    │               │    │                 │   │
│  └──────┬───────┘    └───────────────┘    └─────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    handleInput(key)                         │ │
│  │  - Key matching via keyMatchers                             │ │
│  │  - Command dispatch (submit, newline, navigation, etc.)     │ │
│  │  - Fallback to buffer.handleInput                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ useCommand      │  │ useReverseSearch │  │ useInputHistory│  │
│  │ Completion      │  │ Completion       │  │                │  │
│  └─────────────────┘  └──────────────────┘  └────────────────┘  │
│         │                       │                    │           │
│         └───────────────────────┼────────────────────┘           │
│                                 ▼                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Visual Rendering                          │ │
│  │  - Prompt prefix (>, !, *, (r:))                           │ │
│  │  - Multi-line input with cursor                            │ │
│  │  - SuggestionsDisplay (above or below)                     │ │
│  │  - Ghost text overlay                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Props Interface

**Lines 65-89**: Complete props interface definition.

```typescript
export interface InputPromptProps {
  // Core functionality
  buffer: TextBuffer;                          // External text buffer (required)
  onSubmit: (value: string) => void;           // Submit callback (required)
  userMessages: readonly string[];             // Input history for navigation
  onClearScreen: () => void;                   // Screen clear callback

  // Configuration
  config: Config;                              // App configuration
  slashCommands: readonly SlashCommand[];      // Available slash commands
  commandContext: CommandContext;              // Context for command execution

  // UI settings
  placeholder?: string;                        // Default: '  Type your message...'
  focus?: boolean;                             // Default: true
  inputWidth: number;                          // Available width for input
  suggestionsWidth: number;                    // Width for suggestions panel
  suggestionsPosition?: 'above' | 'below';     // Default: 'below'

  // Shell mode
  shellModeActive: boolean;                    // Whether in shell mode
  setShellModeActive: (value: boolean) => void;
  approvalMode: ApprovalMode;                  // AUTO_EDIT, YOLO, etc.

  // Event callbacks
  onEscapePromptChange?: (show: boolean) => void;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  setBannerVisible: (visible: boolean) => void;
  setQueueErrorMessage: (message: string | null) => void;

  // Optional integrations
  vimHandleInput?: (key: Key) => boolean;      // Vim mode handler
  isEmbeddedShellFocused?: boolean;            // Embedded shell focus state
  popAllMessages?: () => string | undefined;   // Queue message retrieval
  streamingState: StreamingState;              // Current streaming state
}
```

### Width Calculation Utility

**Lines 92-105**: Helper function for width calculations.

```typescript
export const calculatePromptWidths = (mainContentWidth: number) => {
  const FRAME_PADDING_AND_BORDER = 4; // Border (2) + padding (2)
  const PROMPT_PREFIX_WIDTH = 2;      // '> ' or '! '

  const FRAME_OVERHEAD = FRAME_PADDING_AND_BORDER + PROMPT_PREFIX_WIDTH;
  const suggestionsWidth = Math.max(20, mainContentWidth);

  return {
    inputWidth: Math.max(mainContentWidth - FRAME_OVERHEAD, 1),
    containerWidth: mainContentWidth,
    suggestionsWidth,
    frameOverhead: FRAME_OVERHEAD,
  } as const;
};
```

---

## State Management

### Local State Variables

**Lines 136-155**: Component state initialization.

| State Variable | Type | Purpose | Initial Value |
|----------------|------|---------|---------------|
| `justNavigatedHistory` | `boolean` | Tracks history navigation | `false` |
| `showEscapePrompt` | `boolean` | Shows ESC twice prompt | `false` |
| `recentUnsafePasteTime` | `number \| null` | Paste protection timestamp | `null` |
| `reverseSearchActive` | `boolean` | Shell reverse search mode | `false` |
| `commandSearchActive` | `boolean` | Command history search mode | `false` |
| `textBeforeReverseSearch` | `string` | Text before entering search | `''` |
| `cursorPosition` | `[number, number]` | Cursor before search | `[0, 0]` |
| `expandedSuggestionIndex` | `number` | Currently expanded suggestion | `-1` |

### Ref Variables

**Lines 137-144**: Mutable refs for timers and DOM access.

```typescript
const escPressCount = useRef(0);           // ESC press counter
const escapeTimerRef = useRef<NodeJS.Timeout | null>(null);
const pasteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const innerBoxRef = useRef<DOMElement>(null); // For mouse click handling
```

### State Transition Diagram

```
                                    ┌──────────────────────────┐
                                    │    INITIAL STATE         │
                                    │  - Buffer empty          │
                                    │  - No suggestions        │
                                    │  - Normal prompt (>)     │
                                    └────────────┬─────────────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            │                                    │                                     │
            ▼                                    ▼                                     ▼
┌───────────────────────┐          ┌───────────────────────┐          ┌───────────────────────┐
│   TYPING MODE         │          │   SHELL MODE          │          │   COMPLETION MODE     │
│  - User types text    │          │  - Prefix: !          │          │  - Suggestions shown  │
│  - @ triggers file    │◄────────►│  - Shell history      │          │  - Tab to accept      │
│    completion         │   '!'    │  - Ctrl+R for search  │          │  - Arrow navigation   │
│  - / triggers slash   │  toggle  │                       │          │                       │
│    completion         │          │                       │          │                       │
└───────────────────────┘          └───────────────────────┘          └───────────────────────┘
            │                                    │                                     │
            │                                    │                                     │
            ▼                                    ▼                                     ▼
┌───────────────────────┐          ┌───────────────────────┐          ┌───────────────────────┐
│   REVERSE SEARCH      │          │   HISTORY NAV         │          │   ESCAPE PROMPT       │
│  - Prefix: (r:)       │          │  - Up/Down arrows     │          │  - showEscapePrompt   │
│  - Filter history     │          │  - Ctrl+P/N           │          │  - ESC again clears   │
│  - Tab to select      │          │                       │          │                       │
└───────────────────────┘          └───────────────────────┘          └───────────────────────┘
```

---

## Integration with TextBuffer

The `InputPrompt` receives an external `TextBuffer` instance via props rather than creating one internally. This separation allows:

1. **State persistence**: Buffer survives component remounts
2. **Shared access**: Parent can access buffer state
3. **Testing**: Easier to mock and test

### TextBuffer Interface (from text-buffer.ts)

**Key properties used by InputPrompt**:

| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | Full text content |
| `lines` | `string[]` | Logical lines array |
| `cursor` | `[row, col]` | Logical cursor position |
| `visualCursor` | `[row, col]` | Visual (wrapped) cursor position |
| `viewportVisualLines` | `string[]` | Visible lines after wrapping |
| `visualScrollRow` | `number` | Current scroll offset |
| `visualToLogicalMap` | `Array<[number, number]>` | Visual to logical line mapping |

**Key methods used by InputPrompt**:

| Method | Usage | Line Reference |
|--------|-------|----------------|
| `buffer.setText(text)` | Clear/reset buffer | 223, 266, 439, 503 |
| `buffer.handleInput(key)` | Default key handling | 418, 796 |
| `buffer.newline()` | Insert newline | 725, 744 |
| `buffer.backspace()` | Delete before cursor | 733 |
| `buffer.replaceRangeByOffset()` | Insert text at position | 348, 355 |
| `buffer.moveToOffset(offset)` | Move cursor | 456 |
| `buffer.move(direction)` | Cursor movement | 750-756 |
| `buffer.killLineRight()` | Delete to line end | 768 |
| `buffer.killLineLeft()` | Delete to line start | 772 |
| `buffer.deleteWordLeft()` | Delete previous word | 777 |
| `buffer.moveToVisualPosition()` | Click positioning | 368 |
| `buffer.getOffset()` | Get current offset | 332-333 |
| `buffer.openInExternalEditor()` | Open in $EDITOR | 784 |

---

## Input Handling Flow

### Main Handler: handleInput

**Lines 383-837**: The core keyboard event processing function.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           handleInput(key: Key)                                 │
└────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │  Is this a paste operation?         │
                    │  (key.paste === true)               │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │ YES                                 │ NO
                    ▼                                     ▼
        ┌───────────────────────┐          ┌──────────────────────────────────┐
        │ Set paste protection  │          │ Vim mode intercept?              │
        │ timer (40ms)          │          │ vimHandleInput?.(key)            │
        │ buffer.handleInput()  │          └─────────────────┬────────────────┘
        │ RETURN                │                            │
        └───────────────────────┘          ┌─────────────────┴────────────────┐
                                           │ YES (handled)    │ NO            │
                                           ▼                  ▼
                                      RETURN          Continue processing...
```

### Key Processing Order (Lines 383-837)

1. **Focus check** (Line 389): Skip non-paste events if not focused
2. **Paste handling** (Lines 393-420): Special paste protection with 40ms delay
3. **Vim mode intercept** (Lines 422-424): Optional vim key handling
4. **ESC state reset** (Lines 426-431): Reset on any non-ESC key
5. **Shell mode toggle** (Lines 433-441): `!` toggles shell mode when buffer empty
6. **ESC handling** (Lines 443-508): Complex state machine for ESC key
7. **Reverse search toggle** (Lines 510-514): Ctrl+R in shell mode
8. **Clear screen** (Lines 517-521): Ctrl+L
9. **Search mode navigation** (Lines 523-589): Handle keys during reverse search
10. **Perfect match submit** (Lines 592-595): Enter on perfect command match
11. **Suggestion navigation** (Lines 597-643): Up/Down/Tab in suggestions
12. **Ghost text acceptance** (Lines 647-654): Tab accepts ghost text
13. **History navigation** (Lines 656-713): Shell vs command history
14. **Submit** (Lines 715-739): Enter to submit
15. **Newline** (Lines 743-746): Ctrl+Enter, Shift+Enter, etc.
16. **Cursor movement** (Lines 748-756): Home/End, Ctrl+A/E
17. **Text deletion** (Lines 758-779): Ctrl+C, Ctrl+K, Ctrl+U, etc.
18. **External editor** (Lines 782-786): Ctrl+X
19. **Clipboard paste** (Lines 789-793): Ctrl+V
20. **Default fallback** (Line 796): buffer.handleInput(key)

### Submit vs Newline Distinction

**Lines 715-746**: Critical logic for distinguishing submit from newline.

```typescript
// SUBMIT: Lines 715-739
if (keyMatchers[Command.SUBMIT](key)) {
  if (buffer.text.trim()) {
    // Check paste protection - recent paste inserts newline instead
    if (recentUnsafePasteTime !== null) {
      buffer.newline();
      return;
    }

    // Backslash continuation: \<Enter> becomes newline
    const [row, col] = buffer.cursor;
    const line = buffer.lines[row];
    const charBefore = col > 0 ? cpSlice(line, col - 1, col) : '';
    if (charBefore === '\\') {
      buffer.backspace();   // Remove backslash
      buffer.newline();     // Insert newline
    } else {
      handleSubmit(buffer.text);  // Actually submit
    }
  }
  return;
}

// NEWLINE: Lines 743-746
if (keyMatchers[Command.NEWLINE](key)) {
  buffer.newline();
  return;
}
```

**Key bindings from keyBindings.ts**:

| Command | Key Bindings |
|---------|--------------|
| `SUBMIT` | Enter (no modifiers, no paste, no shift) |
| `NEWLINE` | Ctrl+Enter, Cmd+Enter, Shift+Enter, paste+Enter, Ctrl+J |

### Paste Handling

**Lines 316-359**: Clipboard paste with image support.

```typescript
const handleClipboardPaste = useCallback(async () => {
  try {
    // Check for image in clipboard first
    if (await clipboardHasImage()) {
      const imagePath = await saveClipboardImage(config.getTargetDir());
      if (imagePath) {
        // Clean up old images
        cleanupOldClipboardImages(config.getTargetDir());

        // Get relative path and insert as @reference
        const relativePath = path.relative(config.getTargetDir(), imagePath);
        const insertText = `@${relativePath}`;

        // Add spacing as needed
        let textToInsert = insertText;
        const offset = buffer.getOffset();
        const charBefore = offset > 0 ? currentText[offset - 1] : '';
        const charAfter = offset < currentText.length ? currentText[offset] : '';

        if (charBefore && charBefore !== ' ' && charBefore !== '\n') {
          textToInsert = ' ' + textToInsert;
        }
        if (!charAfter || (charAfter !== ' ' && charAfter !== '\n')) {
          textToInsert = textToInsert + ' ';
        }

        buffer.replaceRangeByOffset(offset, offset, textToInsert);
        return;
      }
    }

    // Fallback to text paste
    const textToInsert = await clipboardy.read();
    const offset = buffer.getOffset();
    buffer.replaceRangeByOffset(offset, offset, textToInsert);
  } catch (error) {
    console.error('Error handling clipboard image:', error);
  }
}, [buffer, config]);
```

### Paste Protection Mechanism

**Lines 393-419**: Protection against unintended submission during paste.

```typescript
if (key.paste) {
  // Only apply protection in untrusted terminals
  if (!isTerminalPasteTrusted(kittyProtocol.enabled)) {
    setRecentUnsafePasteTime(Date.now());

    // Clear any existing paste timeout
    if (pasteTimeoutRef.current) {
      clearTimeout(pasteTimeoutRef.current);
    }

    // Clear protection after 40ms
    // This allows same-tick events to be protected but
    // subsequent keypresses to work normally
    pasteTimeoutRef.current = setTimeout(() => {
      setRecentUnsafePasteTime(null);
      pasteTimeoutRef.current = null;
    }, 40);
  }

  buffer.handleInput(key);
  return;
}
```

---

## Completion System

### Completion Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    useCommandCompletion                              │
│    (Master completion hook - orchestrates all completion modes)      │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────────┐
│ useAtCompletion│      │useSlashComplete│     │usePromptCompletion│
│  (@file paths) │      │ (/commands)    │     │  (ghost text)     │
└───────────────┘      └───────────────┘      └───────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  SuggestionsDisplay   │
                    │  (Visual component)   │
                    └───────────────────────┘
```

### Completion Mode Detection

**From useCommandCompletion.tsx, Lines 90-165**:

```typescript
const { completionMode, query, completionStart, completionEnd } = useMemo(() => {
  const currentLine = buffer.lines[cursorRow] || '';

  // Mode 1: Slash command (first line starting with /)
  if (cursorRow === 0 && isSlashCommand(currentLine.trim())) {
    return {
      completionMode: CompletionMode.SLASH,
      query: currentLine,
      completionStart: 0,
      completionEnd: currentLine.length,
    };
  }

  // Mode 2: @ file path completion
  for (let i = cursorCol - 1; i >= 0; i--) {
    const char = codePoints[i];

    if (char === ' ') {
      // Check for escaped spaces (odd number of backslashes)
      let backslashCount = 0;
      for (let j = i - 1; j >= 0 && codePoints[j] === '\\'; j--) {
        backslashCount++;
      }
      if (backslashCount % 2 === 0) break; // Unescaped space = stop
    } else if (char === '@') {
      // Found @ - extract path
      const pathStart = i + 1;
      const partialPath = currentLine.substring(pathStart, end);
      return {
        completionMode: CompletionMode.AT,
        query: partialPath,
        completionStart: pathStart,
        completionEnd: end,
      };
    }
  }

  // Mode 3: Prompt completion (ghost text)
  if (isPromptCompletionEnabled &&
      trimmedText.length >= PROMPT_COMPLETION_MIN_LENGTH &&
      !isSlashCommand(trimmedText) &&
      !trimmedText.includes('@')) {
    return { completionMode: CompletionMode.PROMPT, ... };
  }

  return { completionMode: CompletionMode.IDLE, ... };
}, [cursorRow, cursorCol, buffer.lines, buffer.text, config]);
```

### Suggestion Display

**Lines 991-1010**: Rendering suggestions panel.

```typescript
const suggestionsNode = shouldShowSuggestions ? (
  <Box paddingRight={2}>
    <SuggestionsDisplay
      suggestions={activeCompletion.suggestions}
      activeIndex={activeCompletion.activeSuggestionIndex}
      isLoading={activeCompletion.isLoadingSuggestions}
      width={suggestionsWidth}
      scrollOffset={activeCompletion.visibleStartIndex}
      userInput={buffer.text}
      mode={
        buffer.text.startsWith('/') && !reverseSearchActive && !commandSearchActive
          ? 'slash'
          : 'reverse'
      }
      expandedIndex={expandedSuggestionIndex}
    />
  </Box>
) : null;
```

### Tab Completion Flow

```
User presses Tab
        │
        ▼
┌───────────────────────────────────────────┐
│ Is there an active suggestion?            │
│ completion.showSuggestions &&             │
│ suggestions.length > 0                    │
└─────────────────┬─────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │ YES                   │ NO
      ▼                       ▼
┌─────────────────┐   ┌─────────────────────────────┐
│ Accept active   │   │ Is there ghost text?        │
│ suggestion      │   │ promptCompletion.text       │
│ via handleAuto- │   └─────────────┬───────────────┘
│ complete()      │                 │
└─────────────────┘       ┌─────────┴─────────┐
                          │ YES               │ NO
                          ▼                   ▼
                  ┌───────────────┐   ┌───────────────┐
                  │ Accept ghost  │   │ Do nothing    │
                  │ text via      │   │ (or insert    │
                  │ promptComplete│   │ literal tab)  │
                  │ ion.accept()  │   └───────────────┘
                  └───────────────┘
```

### Slash Command Detection

**From commandUtils.ts**: Commands must start with `/` followed by alphanumerics.

```typescript
const HIGHLIGHT_REGEX = /(^\/[a-zA-Z0-9_-]+|@(?:\\ |[a-zA-Z0-9_./-])+)/g;

export function isSlashCommand(text: string): boolean {
  return text.startsWith('/');
}
```

---

## Validation & Guards

### Empty Input Handling

**Lines 716-739**: Submission requires non-empty trimmed content.

```typescript
if (keyMatchers[Command.SUBMIT](key)) {
  if (buffer.text.trim()) {  // Only submit if non-empty after trim
    // ... submission logic
  }
  return;  // Always consume the key, even if empty
}
```

### Command Queue Restrictions

**Lines 238-261**: Slash and shell commands cannot be queued during streaming.

```typescript
const handleSubmit = useCallback((submittedValue: string) => {
  const trimmedMessage = submittedValue.trim();
  const isSlash = isSlashCommand(trimmedMessage);
  const isShell = shellModeActive;

  // Block slash/shell commands during streaming
  if ((isSlash || isShell) && streamingState === StreamingState.Responding) {
    setQueueErrorMessage(
      `${isShell ? 'Shell' : 'Slash'} commands cannot be queued`
    );
    return;
  }

  handleSubmitAndClear(trimmedMessage);
}, [handleSubmitAndClear, shellModeActive, streamingState, setQueueErrorMessage]);
```

### Double-ESC Clear Pattern

**Lines 489-506**: Two ESC presses required to clear input.

```typescript
if (escPressCount.current === 0) {
  if (buffer.text === '') {
    return;  // Don't show prompt for empty buffer
  }
  escPressCount.current = 1;
  setShowEscapePrompt(true);

  // Auto-reset after 500ms if no second ESC
  escapeTimerRef.current = setTimeout(() => {
    resetEscapeState();
  }, 500);
} else {
  // Second ESC - clear input
  buffer.setText('');
  resetCompletionState();
  resetEscapeState();
}
```

### Terminal Paste Trust

**Lines 56-63**: Only Kitty protocol terminals are trusted for atomic paste.

```typescript
export function isTerminalPasteTrusted(kittyProtocolSupported: boolean): boolean {
  // Ideally we could trust all VSCode family terminals but
  // Cursor users on Windows reported issues
  return kittyProtocolSupported;
}
```

---

## Visual Rendering

### Component Structure

**Lines 1012-1195**: Main render output.

```
┌─────────────────────────────────────────────────────────────────┐
│  {suggestionsPosition === 'above' && suggestionsNode}           │
├─────────────────────────────────────────────────────────────────┤
│  <Box borderStyle="round" ...>                                  │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │  <Text color={statusColor}>                             │  │
│    │    {prefix: '>' | '!' | '*' | '(r:)'}                   │  │
│    │  </Text>                                                │  │
│    ├─────────────────────────────────────────────────────────┤  │
│    │  <Box flexGrow={1} flexDirection="column">              │  │
│    │    {buffer.text.length === 0 ?                          │  │
│    │      <Placeholder />                                    │  │
│    │    :                                                    │  │
│    │      <MultiLineRenderedInput />                         │  │
│    │    }                                                    │  │
│    │    <GhostTextLines />                                   │  │
│    │  </Box>                                                 │  │
│    └─────────────────────────────────────────────────────────┘  │
│  </Box>                                                         │
├─────────────────────────────────────────────────────────────────┤
│  {suggestionsPosition === 'below' && suggestionsNode}           │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Prefix Logic

**Lines 1028-1050**: Dynamic prefix based on mode.

| Condition | Prefix | Color |
|-----------|--------|-------|
| Shell mode + reverse search | `(r:) ` | `theme.text.link` |
| Shell mode (normal) | `!` | `theme.ui.symbol` |
| Command search active | `(r:) ` | `theme.text.accent` |
| YOLO mode | `*` | `theme.status.error` |
| Normal mode | `>` | `theme.text.accent` |

### Border Color Logic

**Lines 1017-1020**:

```typescript
borderColor={
  isShellFocused && !isEmbeddedShellFocused
    ? (statusColor ?? theme.border.focused)
    : theme.border.default
}
```

### Multi-line Input Rendering

**Lines 1062-1172**: Complex rendering with syntax highlighting and cursor.

```typescript
linesToRender.map((lineText, visualIdxInRenderedSet) => {
  const absoluteVisualIdx = scrollVisualRow + visualIdxInRenderedSet;
  const mapEntry = buffer.visualToLogicalMap[absoluteVisualIdx];
  const [logicalLineIdx, logicalStartCol] = mapEntry;
  const logicalLine = buffer.lines[logicalLineIdx] || '';

  // Parse for syntax highlighting (/commands, @files)
  const tokens = parseInputForHighlighting(logicalLine, logicalLineIdx);

  // Build segments for visual slice
  const segments = buildSegmentsForVisualSlice(tokens, visualStart, visualEnd);

  // Render each segment with cursor overlay
  segments.forEach((seg, segIdx) => {
    // ... cursor highlighting logic
    const color = seg.type === 'command' || seg.type === 'file'
      ? theme.text.accent
      : theme.text.primary;

    renderedLine.push(<Text key={...} color={color}>{display}</Text>);
  });

  // Append ghost text if on cursor line
  if (currentLineGhost) {
    renderedLine.push(
      <Text color={theme.text.secondary}>{currentLineGhost}</Text>
    );
  }

  return <Box key={...} height={1}><Text>{renderedLine}</Text></Box>;
});
```

### Cursor Rendering

**Lines 1094-1124**: Cursor is rendered via chalk.inverse.

```typescript
if (isOnCursorLine && cursorVisualColAbsolute >= segStart && cursorVisualColAbsolute < segEnd) {
  const charToHighlight = cpSlice(seg.text, relativePos, relativePos + 1);
  const highlighted = showCursor
    ? chalk.inverse(charToHighlight)  // Inverted for visible cursor
    : charToHighlight;

  display = cpSlice(seg.text, 0, relativePos) + highlighted + cpSlice(seg.text, relativePos + 1);
}
```

### Ghost Text Rendering

**Lines 846-955**: Complex ghost text width calculation and wrapping.

```typescript
const getGhostTextLines = useCallback(() => {
  if (!completion.promptCompletion.text ||
      !buffer.text ||
      !completion.promptCompletion.text.startsWith(buffer.text)) {
    return { inlineGhost: '', additionalLines: [] };
  }

  const ghostSuffix = completion.promptCompletion.text.slice(buffer.text.length);

  // Calculate remaining width on current line
  const textBeforeCursor = cpSlice(currentLogicalLine, 0, cursorCol);
  const usedWidth = stringWidth(textBeforeCursor);
  const remainingWidth = Math.max(0, inputWidth - usedWidth);

  // Split ghost into inline portion and additional wrapped lines
  const ghostTextLinesRaw = ghostSuffix.split('\n');
  const firstLineRaw = ghostTextLinesRaw.shift() || '';

  // Word-wrap first line to fit remaining width
  if (stringWidth(firstLineRaw) <= remainingWidth) {
    inlineGhost = firstLineRaw;
  } else {
    // ... word wrapping logic
  }

  // Wrap remaining lines to full input width
  // ... additional line wrapping

  return { inlineGhost, additionalLines };
}, [completion.promptCompletion.text, buffer.text, buffer.lines, buffer.cursor, inputWidth]);
```

---

## Implementation Recommendations

### For FloMaster CLI

#### 1. Modular Architecture

Separate concerns into distinct modules:

```
packages/cli/src/ui/
├── components/
│   ├── inputPrompt/
│   │   ├── inputPrompt.tsx         # Main component
│   │   ├── inputPrompt.hooks.ts    # Custom hooks
│   │   ├── inputPrompt.types.ts    # Types/interfaces
│   │   └── index.ts                # Exports
│   └── shared/
│       └── textBuffer/
│           ├── textBuffer.ts       # Buffer logic
│           ├── textBuffer.reducer.ts
│           └── index.ts
├── hooks/
│   ├── useKeypress.ts
│   ├── useCommandCompletion.ts
│   ├── useInputHistory.ts
│   └── useCompletion.ts
└── utils/
    ├── keyMatchers.ts
    └── highlight.ts
```

#### 2. Key Design Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| TextBuffer ownership | External (prop) | Better state management, testability |
| Key matching | Data-driven config | Customizable, maintainable |
| Completion modes | Enum-based | Clear state machine |
| Paste handling | Trust detection | Security, UX balance |
| ESC behavior | Double-press pattern | Prevents accidental clear |

#### 3. Simplified State Machine

Consider using XState for mode management:

```typescript
const inputMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        TYPE: 'typing',
        SHELL_TOGGLE: 'shell',
      }
    },
    typing: {
      on: {
        AT_TRIGGER: 'fileCompletion',
        SLASH_TRIGGER: 'commandCompletion',
        SUBMIT: 'idle',
        ESCAPE: 'escapePrompt',
      }
    },
    fileCompletion: { /* ... */ },
    commandCompletion: { /* ... */ },
    shell: { /* ... */ },
    escapePrompt: { /* ... */ },
  }
});
```

#### 4. Essential Features to Implement

**Phase 1 - Core Input**:
- [ ] TextBuffer with multi-line support
- [ ] Basic key handling (submit, newline, cursor movement)
- [ ] Cursor rendering with chalk.inverse
- [ ] Visual line wrapping

**Phase 2 - Completion**:
- [ ] Slash command completion (/)
- [ ] File path completion (@)
- [ ] Suggestion navigation (up/down/tab)
- [ ] SuggestionsDisplay component

**Phase 3 - History & Shell**:
- [ ] Input history (Ctrl+P/N, Up/Down)
- [ ] Shell mode toggle (!)
- [ ] Reverse search (Ctrl+R)

**Phase 4 - Advanced**:
- [ ] Paste protection
- [ ] Ghost text predictions
- [ ] Mouse click positioning
- [ ] Vim mode integration
- [ ] External editor (Ctrl+X)

#### 5. Testing Strategy

```typescript
// Unit tests for TextBuffer
describe('TextBuffer', () => {
  test('handles multi-line insert correctly', () => {});
  test('calculates visual layout on width change', () => {});
  test('maintains cursor position during edits', () => {});
});

// Integration tests for InputPrompt
describe('InputPrompt', () => {
  test('submits on Enter with non-empty input', () => {});
  test('inserts newline on Ctrl+Enter', () => {});
  test('shows suggestions when typing /', () => {});
  test('accepts suggestion on Tab', () => {});
  test('clears input on double ESC', () => {});
});
```

#### 6. Performance Considerations

- Memoize visual layout calculation (expensive operation)
- Use refs for timers and DOM elements
- Debounce completion queries
- Limit suggestion list size (MAX_SUGGESTIONS_TO_SHOW = 8)

---

## Appendix: Key Line References

| Feature | Start Line | End Line | File |
|---------|------------|----------|------|
| Props interface | 65 | 89 | InputPrompt.tsx |
| Width calculation | 92 | 105 | InputPrompt.tsx |
| State initialization | 136 | 155 | InputPrompt.tsx |
| handleSubmit | 238 | 261 | InputPrompt.tsx |
| handleClipboardPaste | 316 | 359 | InputPrompt.tsx |
| handleInput main handler | 383 | 837 | InputPrompt.tsx |
| ESC handling | 443 | 508 | InputPrompt.tsx |
| Submit vs newline | 715 | 746 | InputPrompt.tsx |
| Ghost text calculation | 846 | 955 | InputPrompt.tsx |
| Suggestions render | 991 | 1010 | InputPrompt.tsx |
| Main render output | 1012 | 1195 | InputPrompt.tsx |
| Cursor rendering | 1094 | 1124 | InputPrompt.tsx |
| TextBuffer reducer | 998 | 1537 | text-buffer.ts |
| useTextBuffer hook | 1561 | 2224 | text-buffer.ts |
| TextBuffer interface | 2226 | 2468 | text-buffer.ts |
| Key bindings config | 109 | 217 | keyBindings.ts |
| Command enum | 10 | 78 | keyBindings.ts |
| Completion modes | 24 | 29 | useCommandCompletion.tsx |
| Completion detection | 90 | 165 | useCommandCompletion.tsx |
