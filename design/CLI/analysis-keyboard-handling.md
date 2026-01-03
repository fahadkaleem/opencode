# Gemini CLI Keyboard Handling Analysis

> SDK-Agnostic keyboard handling patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI implements a sophisticated keyboard handling system:

1. **KeypressProvider** - Context-based pub/sub for raw keyboard input
2. **useKeypress Hook** - Conditional subscription for components
3. **Key Matchers System** - Data-driven key binding configuration
4. **Vim Mode Support** - Modal editing via separate context
5. **Focus-Based Handling** - `isActive` flag for conditional listening
6. **Special Input Handling** - Bracketed paste, escape sequence buffering, mouse filtering
7. **Kitty Keyboard Protocol** - Enhanced keyboard support detection

---

## 1. KeypressProvider Architecture

**File**: `packages/cli/src/ui/contexts/KeypressContext.tsx` (Lines 562-624)

### Key Interface

```typescript
// Lines 531-539
export interface Key {
  name: string;       // e.g., 'escape', 'return', 'up', 'a'
  ctrl: boolean;      // Ctrl modifier
  meta: boolean;      // Alt/Meta modifier (mapped from both alt and meta)
  shift: boolean;     // Shift modifier
  paste: boolean;     // Is this a paste event
  insertable: boolean;// Is this printable/insertable text
  sequence: string;   // Raw ANSI sequence
}

export type KeypressHandler = (key: Key) => void;
```

### Context Value Interface

```typescript
// Lines 543-546
interface KeypressContextValue {
  subscribe: (handler: KeypressHandler) => void;
  unsubscribe: (handler: KeypressHandler) => void;
}
```

### Provider Implementation

```typescript
// Lines 562-624
export function KeypressProvider({
  children,
  config,
  debugKeystrokeLogging,  // Optional debug flag for logging raw stdin
}: {
  children: React.ReactNode;
  config?: Config;
  debugKeystrokeLogging?: boolean;
}) {
  const { stdin, setRawMode } = useStdin();

  // Subscriber set stored in ref to avoid re-renders
  const subscribers = useRef<Set<KeypressHandler>>(new Set()).current;

  const subscribe = useCallback(
    (handler: KeypressHandler) => subscribers.add(handler),
    [subscribers],
  );

  const unsubscribe = useCallback(
    (handler: KeypressHandler) => subscribers.delete(handler),
    [subscribers],
  );

  const broadcast = useCallback(
    (key: Key) => subscribers.forEach((handler) => handler(key)),
    [subscribers],
  );

  useEffect(() => {
    // Preserve original raw mode state
    const wasRaw = stdin.isRaw;
    if (wasRaw === false) {
      setRawMode(true);
    }

    process.stdin.setEncoding('utf8');  // Emit strings, not buffers

    // Build the processing pipeline (order matters!)
    const mouseFilterer = nonKeyboardEventFilter(broadcast);
    const backslashBufferer = bufferBackslashEnter(mouseFilterer);
    const pasteBufferer = bufferPaste(backslashBufferer);
    let dataListener = createDataListener(pasteBufferer);

    // Optional debug wrapper
    if (debugKeystrokeLogging) {
      const old = dataListener;
      dataListener = (data: string) => {
        if (data.length > 0) {
          debugLogger.log(`[DEBUG] Raw StdIn: ${JSON.stringify(data)}`);
        }
        old(data);
      };
    }

    stdin.on('data', dataListener);
    return () => {
      stdin.removeListener('data', dataListener);
      if (wasRaw === false) {
        setRawMode(false);
      }
    };
  }, [stdin, setRawMode, config, debugKeystrokeLogging, broadcast]);

  return (
    <KeypressContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </KeypressContext.Provider>
  );
}
```

### Input Processing Pipeline

The provider uses a generator-based pipeline for processing raw stdin data:

```
Raw stdin data
     |
     v
createDataListener() - Parses raw chars into key events with ESC buffering
     |
     v
bufferPaste() - Buffers paste events between paste-start/paste-end markers
     |
     v
bufferBackslashEnter() - Handles backslash+Enter for newline insertion
     |
     v
nonKeyboardEventFilter() - Filters out mouse and focus events
     |
     v
broadcast() - Notifies all subscribers
```

### Key Timeouts (Lines 23-25)

```typescript
export const BACKSLASH_ENTER_TIMEOUT = 5;   // ms to wait for Enter after backslash
export const ESC_TIMEOUT = 50;              // ms to wait for escape sequence completion
export const PASTE_TIMEOUT = 30_000;        // ms max for paste operation (30 seconds)
```

---

## 2. Key Parsing (emitKeys Generator)

**File**: `packages/cli/src/ui/contexts/KeypressContext.tsx` (Lines 270-528)

The `emitKeys` generator function is the core ANSI sequence parser. Key features:

### ANSI Escape Sequence Parsing

```typescript
// Lines 270-528
function* emitKeys(keypressHandler: KeypressHandler): Generator<void, void, string> {
  while (true) {
    let ch = yield;
    let sequence = ch;
    let escaped = false;
    // ... parsing logic

    // Handles:
    // - CSI sequences: ESC [ ...
    // - SS3 sequences: ESC O ...
    // - Modifiers (shift, ctrl, meta/alt)
    // - Kitty keyboard protocol (CSI <keycode> u)
    // - X11 mouse mode (ESC [ M ...)
    // - SGR mouse mode (ESC [ < ...)
  }
}
```

### KEY_INFO_MAP (Lines 28-111)

Maps ANSI sequences to key names with modifier detection:

```typescript
const KEY_INFO_MAP: Record<string, { name: string; shift?: boolean; ctrl?: boolean }> = {
  '[200~': { name: 'paste-start' },
  '[201~': { name: 'paste-end' },
  '[A': { name: 'up' },
  '[B': { name: 'down' },
  '[C': { name: 'right' },
  '[D': { name: 'left' },
  '[9u': { name: 'tab' },           // Kitty protocol
  '[13u': { name: 'return' },       // Kitty protocol
  '[27u': { name: 'escape' },       // Kitty protocol
  '[127u': { name: 'backspace' },   // Kitty protocol
  '[57414u': { name: 'return' },    // Numpad Enter (Kitty)
  '[Z': { name: 'tab', shift: true },
  // ... many more
};
```

### Mac Alt Key Character Mapping (Lines 124-128)

Special handling for macOS terminals that send accented characters for Alt+key:

```typescript
const MAC_ALT_KEY_CHARACTER_MAP: Record<string, string> = {
  '\u222B': 'b', // "integral" -> Alt+B (back one word)
  '\u0192': 'f', // "florin" -> Alt+F (forward one word)
  '\u00B5': 'm', // "micro" -> Alt+M (toggle markup view)
};
```

---

## 3. useKeypress Hook

**File**: `packages/cli/src/ui/hooks/useKeypress.ts` (Lines 20-36)

```typescript
/**
 * A hook that listens for keypress events from stdin.
 *
 * @param onKeypress - The callback function to execute on each keypress.
 * @param options - Options to control the hook's behavior.
 * @param options.isActive - Whether the hook should be actively listening for input.
 */
export function useKeypress(
  onKeypress: KeypressHandler,
  { isActive }: { isActive: boolean },
) {
  const { subscribe, unsubscribe } = useKeypressContext();

  useEffect(() => {
    if (!isActive) {
      return;  // Early return - don't subscribe when inactive
    }

    subscribe(onKeypress);
    return () => {
      unsubscribe(onKeypress);
    };
  }, [isActive, onKeypress, subscribe, unsubscribe]);
}
```

### Critical Implementation Details

1. **Early return pattern**: When `isActive` is false, the effect returns early without subscribing
2. **No handler prioritization**: All active handlers receive events simultaneously (no event.stopPropagation)
3. **Handler identity matters**: Uses handler function reference for subscribe/unsubscribe
4. **Cleanup on dependency change**: Unsubscribes when handler, isActive, or context changes

### Usage Patterns from Codebase

```typescript
// InputPrompt.tsx:839 - Active when shell not focused
useKeypress(handleInput, { isActive: !isEmbeddedShellFocused });

// useSelectionList.ts:396 - Active when focused AND has items
useKeypress(handleKeypress, { isActive: !!(isFocused && itemsLength > 0) });

// useFocus.ts:48-59 - Always active (focus recovery)
useKeypress(
  (_) => {
    if (!isFocused) {
      setIsFocused(true);  // Recover focus on any keypress
    }
  },
  { isActive: true },
);

// AppContainer.tsx:1268 - Global handler always active
useKeypress(handleGlobalKeypress, { isActive: true });

// Various dialogs - Active only when dialog is shown
useKeypress(
  (key) => {
    if (key.name === 'escape') {
      onClose();
    }
  },
  { isActive: isDialogOpen },
);
```

---

## 4. Key Matchers System

**File**: `packages/cli/src/config/keyBindings.ts` (Lines 1-366)

### Command Enum (Lines 10-78)

```typescript
export enum Command {
  // Basic bindings
  RETURN = 'return',
  ESCAPE = 'escape',

  // Cursor movement
  HOME = 'home',
  END = 'end',

  // Text deletion
  KILL_LINE_RIGHT = 'killLineRight',
  KILL_LINE_LEFT = 'killLineLeft',
  CLEAR_INPUT = 'clearInput',
  DELETE_WORD_BACKWARD = 'deleteWordBackward',

  // Screen control
  CLEAR_SCREEN = 'clearScreen',

  // Scrolling
  SCROLL_UP = 'scrollUp',
  SCROLL_DOWN = 'scrollDown',
  SCROLL_HOME = 'scrollHome',
  SCROLL_END = 'scrollEnd',
  PAGE_UP = 'pageUp',
  PAGE_DOWN = 'pageDown',

  // History navigation
  HISTORY_UP = 'historyUp',
  HISTORY_DOWN = 'historyDown',
  NAVIGATION_UP = 'navigationUp',
  NAVIGATION_DOWN = 'navigationDown',

  // Dialog navigation (supports vim-style j/k)
  DIALOG_NAVIGATION_UP = 'dialogNavigationUp',
  DIALOG_NAVIGATION_DOWN = 'dialogNavigationDown',

  // Auto-completion
  ACCEPT_SUGGESTION = 'acceptSuggestion',
  COMPLETION_UP = 'completionUp',
  COMPLETION_DOWN = 'completionDown',

  // Text input
  SUBMIT = 'submit',
  NEWLINE = 'newline',

  // External tools
  OPEN_EXTERNAL_EDITOR = 'openExternalEditor',
  PASTE_CLIPBOARD = 'pasteClipboard',

  // App level bindings
  SHOW_ERROR_DETAILS = 'showErrorDetails',
  SHOW_FULL_TODOS = 'showFullTodos',
  TOGGLE_IDE_CONTEXT_DETAIL = 'toggleIDEContextDetail',
  TOGGLE_MARKDOWN = 'toggleMarkdown',
  TOGGLE_COPY_MODE = 'toggleCopyMode',
  QUIT = 'quit',
  EXIT = 'exit',
  SHOW_MORE_LINES = 'showMoreLines',

  // Shell commands
  REVERSE_SEARCH = 'reverseSearch',
  SUBMIT_REVERSE_SEARCH = 'submitReverseSearch',
  ACCEPT_SUGGESTION_REVERSE_SEARCH = 'acceptSuggestionReverseSearch',
  TOGGLE_SHELL_INPUT_FOCUS = 'toggleShellInputFocus',

  // Suggestion expansion
  EXPAND_SUGGESTION = 'expandSuggestion',
  COLLAPSE_SUGGESTION = 'collapseSuggestion',
}
```

### KeyBinding Interface (Lines 83-96)

```typescript
export interface KeyBinding {
  /** The key name (e.g., 'a', 'return', 'tab', 'escape') */
  key?: string;
  /** The key sequence (e.g., '\x18' for Ctrl+X) - alternative to key name */
  sequence?: string;
  /** Control key requirement: true=must be pressed, false=must NOT be pressed, undefined=ignore */
  ctrl?: boolean;
  /** Shift key requirement: true=must be pressed, false=must NOT be pressed, undefined=ignore */
  shift?: boolean;
  /** Command/meta key requirement: true=must be pressed, false=must NOT be pressed, undefined=ignore */
  command?: boolean;
  /** Paste operation requirement: true=must be paste, false=must NOT be paste, undefined=ignore */
  paste?: boolean;
}
```

### Default Key Bindings (Lines 109-217)

Key examples showing the modifier matching semantics:

```typescript
export const defaultKeyBindings: KeyBindingConfig = {
  // Multiple bindings for same command
  [Command.HOME]: [
    { key: 'a', ctrl: true },  // Ctrl+A
    { key: 'home' }            // Home key (any modifiers)
  ],

  // Strict SUBMIT - must NOT have any modifiers or paste
  [Command.SUBMIT]: [{
    key: 'return',
    ctrl: false,      // Must NOT have ctrl
    command: false,   // Must NOT have meta
    paste: false,     // Must NOT be paste
    shift: false      // Must NOT have shift
  }],

  // NEWLINE - multiple ways to insert newline
  [Command.NEWLINE]: [
    { key: 'return', ctrl: true },    // Ctrl+Enter
    { key: 'return', command: true }, // Cmd+Enter (Mac)
    { key: 'return', paste: true },   // Paste containing Enter
    { key: 'return', shift: true },   // Shift+Enter
    { key: 'j', ctrl: true }          // Ctrl+J
  ],

  // Dialog navigation with vim-style keys
  [Command.DIALOG_NAVIGATION_UP]: [
    { key: 'up', shift: false },   // Arrow up (without shift)
    { key: 'k', shift: false },    // vim k (without shift)
  ],
  [Command.DIALOG_NAVIGATION_DOWN]: [
    { key: 'down', shift: false }, // Arrow down (without shift)
    { key: 'j', shift: false },    // vim j (without shift)
  ],

  // Sequence-based matching
  [Command.OPEN_EXTERNAL_EDITOR]: [
    { key: 'x', ctrl: true },
    { sequence: '\x18', ctrl: true },  // Raw Ctrl+X sequence
  ],
};
```

### Key Matcher Implementation

**File**: `packages/cli/src/ui/keyMatchers.ts` (Lines 15-98)

```typescript
// Lines 15-54
function matchKeyBinding(keyBinding: KeyBinding, key: Key): boolean {
  // Either key name or sequence must match (but not both should be defined)
  let keyMatches = false;

  if (keyBinding.key !== undefined) {
    keyMatches = keyBinding.key === key.name;
  } else if (keyBinding.sequence !== undefined) {
    keyMatches = keyBinding.sequence === key.sequence;
  } else {
    // Neither key nor sequence defined - invalid binding
    return false;
  }

  if (!keyMatches) {
    return false;
  }

  // Check modifiers:
  // undefined = ignore this modifier (don't care)
  // true = modifier must be pressed
  // false = modifier must NOT be pressed
  if (keyBinding.ctrl !== undefined && key.ctrl !== keyBinding.ctrl) {
    return false;
  }
  if (keyBinding.shift !== undefined && key.shift !== keyBinding.shift) {
    return false;
  }
  if (keyBinding.command !== undefined && key.meta !== keyBinding.command) {
    return false;
  }
  if (keyBinding.paste !== undefined && key.paste !== keyBinding.paste) {
    return false;
  }

  return true;
}

// Lines 59-66
function matchCommand(
  command: Command,
  key: Key,
  config: KeyBindingConfig = defaultKeyBindings,
): boolean {
  const bindings = config[command];
  return bindings.some((binding) => matchKeyBinding(binding, key));
}

// Lines 83-93 - Creates matchers for all commands
export function createKeyMatchers(
  config: KeyBindingConfig = defaultKeyBindings,
): KeyMatchers {
  const matchers = {} as { [C in Command]: KeyMatcher };

  for (const command of Object.values(Command)) {
    matchers[command] = (key: Key) => matchCommand(command, key, config);
  }

  return matchers as KeyMatchers;
}

// Line 98 - Default matchers instance
export const keyMatchers: KeyMatchers = createKeyMatchers(defaultKeyBindings);
```

### Usage Pattern

```typescript
// From ScrollableList.tsx:183-186
useKeypress(
  (key: Key) => {
    if (keyMatchers[Command.SCROLL_UP](key)) {
      stopSmoothScroll();
      scrollByWithAnimation(-1);
    }
    if (keyMatchers[Command.SCROLL_DOWN](key)) {
      stopSmoothScroll();
      scrollByWithAnimation(1);
    }
  },
  { isActive: hasFocus },
);
```

---

## 5. Vim Mode Implementation

### VimModeContext

**File**: `packages/cli/src/ui/contexts/VimModeContext.tsx` (Lines 1-81)

```typescript
export type VimMode = 'NORMAL' | 'INSERT';

interface VimModeContextType {
  vimEnabled: boolean;
  vimMode: VimMode;
  toggleVimEnabled: () => Promise<boolean>;
  setVimMode: (mode: VimMode) => void;
}

export const VimModeProvider = ({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: LoadedSettings;
}) => {
  const initialVimEnabled = settings.merged.general?.vimMode ?? false;
  const [vimEnabled, setVimEnabled] = useState(initialVimEnabled);
  const [vimMode, setVimMode] = useState<VimMode>(
    initialVimEnabled ? 'NORMAL' : 'INSERT',
  );

  // Sync with settings changes
  useEffect(() => {
    const enabled = settings.merged.general?.vimMode ?? false;
    setVimEnabled(enabled);
    if (enabled) {
      setVimMode('NORMAL');  // Always start in NORMAL when enabling
    }
  }, [settings.merged.general?.vimMode]);

  const toggleVimEnabled = useCallback(async () => {
    const newValue = !vimEnabled;
    setVimEnabled(newValue);
    if (newValue) {
      setVimMode('NORMAL');
    }
    await settings.setValue(SettingScope.User, 'general.vimMode', newValue);
    return newValue;
  }, [vimEnabled, settings]);
};
```

### useVim Hook

**File**: `packages/cli/src/ui/hooks/vim.ts` (Lines 1-786)

This is a comprehensive vim emulation hook with:

```typescript
// State machine for vim mode
type VimState = {
  mode: VimMode;
  count: number;                          // Numeric prefix (e.g., 5j)
  pendingOperator: 'g' | 'd' | 'c' | null; // Operator waiting for motion
  lastCommand: { type: string; count: number } | null;  // For . repeat
};

type VimAction =
  | { type: 'SET_MODE'; mode: VimMode }
  | { type: 'SET_COUNT'; count: number }
  | { type: 'INCREMENT_COUNT'; digit: number }
  | { type: 'CLEAR_COUNT' }
  | { type: 'SET_PENDING_OPERATOR'; operator: 'g' | 'd' | 'c' | null }
  | { type: 'SET_LAST_COMMAND'; command: { type: string; count: number } | null }
  | { type: 'CLEAR_PENDING_STATES' }
  | { type: 'ESCAPE_TO_NORMAL' };
```

### Supported Vim Commands (Lines 115-127 comments)

- **Navigation**: h, j, k, l, w, b, e, 0, $, ^, gg, G with count prefixes
- **Mode switching**: i, a, o, O, A, I, Escape
- **Editing**: x, d, c, D, C with count prefixes
- **Complex operations**: dd, cc, dw, cw, db, cb, de, ce
- **Command repetition**: . (dot command)

---

## 6. Special Input Handling

### Bracketed Paste

**File**: `packages/cli/src/ui/utils/bracketedPaste.ts` (Lines 1-19)

```typescript
const ENABLE_BRACKETED_PASTE = '\x1b[?2004h';
const DISABLE_BRACKETED_PASTE = '\x1b[?2004l';

export const enableBracketedPaste = () => {
  writeToStdout(ENABLE_BRACKETED_PASTE);
};

export const disableBracketedPaste = () => {
  writeToStdout(DISABLE_BRACKETED_PASTE);
};
```

**File**: `packages/cli/src/ui/hooks/useBracketedPaste.ts` (Lines 1-38)

```typescript
export const useBracketedPaste = () => {
  const cleanup = () => {
    disableBracketedPaste();
  };

  useEffect(() => {
    enableBracketedPaste();

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    return () => {
      cleanup();
      process.removeListener('exit', cleanup);
      process.removeListener('SIGINT', cleanup);
      process.removeListener('SIGTERM', cleanup);
    };
  }, []);
};
```

### Paste Buffering (KeypressContext.tsx Lines 195-242)

The `bufferPaste` generator buffers content between paste-start and paste-end sequences:

```typescript
function bufferPaste(keypressHandler: KeypressHandler): (key: Key | null) => void {
  const bufferer = (function* (): Generator<void, void, Key | null> {
    while (true) {
      let key = yield;

      if (key === null) continue;
      if (key.name !== 'paste-start') {
        keypressHandler(key);
        continue;
      }

      // Buffer paste content
      let buffer = '';
      while (true) {
        const timeoutId = setTimeout(() => bufferer.next(null), PASTE_TIMEOUT);
        key = yield;
        clearTimeout(timeoutId);

        if (key === null) {
          appEvents.emit(AppEvent.PasteTimeout);
          break;
        }
        if (key.name === 'paste-end') break;
        buffer += key.sequence;
      }

      if (buffer.length > 0) {
        keypressHandler({
          name: '',
          ctrl: false,
          meta: false,
          shift: false,
          paste: true,
          insertable: true,
          sequence: buffer,
        });
      }
    }
  })();
  bufferer.next(); // Prime the generator
  return (key: Key | null) => bufferer.next(key);
}
```

### Backslash+Enter Handling (Lines 149-188)

Converts `\` followed by Enter into Shift+Enter (newline without submit):

```typescript
function bufferBackslashEnter(keypressHandler: KeypressHandler): (key: Key | null) => void {
  const bufferer = (function* (): Generator<void, void, Key | null> {
    while (true) {
      const key = yield;
      if (key == null) continue;
      if (key.sequence !== '\\') {
        keypressHandler(key);
        continue;
      }

      // Wait for next key with timeout
      const timeoutId = setTimeout(() => bufferer.next(null), BACKSLASH_ENTER_TIMEOUT);
      const nextKey = yield;
      clearTimeout(timeoutId);

      if (nextKey === null) {
        keypressHandler(key);  // Just a backslash
      } else if (nextKey.name === 'return') {
        keypressHandler({
          ...nextKey,
          shift: true,         // Mark as shift+enter
          sequence: '\r',
        });
      } else {
        keypressHandler(key);
        keypressHandler(nextKey);
      }
    }
  })();
  bufferer.next();
  return (key: Key | null) => bufferer.next(key);
}
```

### Key to ANSI Conversion

**File**: `packages/cli/src/ui/hooks/keyToAnsi.ts` (Lines 1-77)

For sending keys to pseudo-terminals:

```typescript
export function keyToAnsi(key: Key): string | null {
  if (key.ctrl) {
    if (key.name >= 'a' && key.name <= 'z') {
      return String.fromCharCode(key.name.charCodeAt(0) - 'a'.charCodeAt(0) + 1);
    }
    switch (key.name) {
      case 'c': return '\x03'; // ETX (interrupt)
    }
  }

  switch (key.name) {
    case 'up': return '\x1b[A';
    case 'down': return '\x1b[B';
    case 'right': return '\x1b[C';
    case 'left': return '\x1b[D';
    case 'escape': return '\x1b';
    case 'tab': return '\t';
    case 'backspace': return '\x7f';
    case 'delete': return '\x1b[3~';
    case 'home': return '\x1b[H';
    case 'end': return '\x1b[F';
    case 'pageup': return '\x1b[5~';
    case 'pagedown': return '\x1b[6~';
    case 'return': return '\r';
  }

  if (!key.ctrl && !key.meta && key.sequence) {
    return key.sequence;
  }

  return null;
}
```

---

## 7. Focus Management

**File**: `packages/cli/src/ui/hooks/useFocus.ts` (Lines 1-62)

Tracks terminal window focus state:

```typescript
// Focus event ANSI sequences
export const ENABLE_FOCUS_REPORTING = '\x1b[?1004h';
export const DISABLE_FOCUS_REPORTING = '\x1b[?1004l';
export const FOCUS_IN = '\x1b[I';
export const FOCUS_OUT = '\x1b[O';

export const useFocus = () => {
  const { stdin } = useStdin();
  const { stdout } = useStdout();
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const handleData = (data: Buffer) => {
      const sequence = data.toString();
      const lastFocusIn = sequence.lastIndexOf(FOCUS_IN);
      const lastFocusOut = sequence.lastIndexOf(FOCUS_OUT);

      if (lastFocusIn > lastFocusOut) {
        setIsFocused(true);
      } else if (lastFocusOut > lastFocusIn) {
        setIsFocused(false);
      }
    };

    stdout?.write(ENABLE_FOCUS_REPORTING);
    stdin?.on('data', handleData);

    return () => {
      stdout?.write(DISABLE_FOCUS_REPORTING);
      stdin?.removeListener('data', handleData);
    };
  }, [stdin, stdout]);

  // Fallback: any keypress recovers focus (for tmux compatibility)
  useKeypress(
    (_) => {
      if (!isFocused) {
        setIsFocused(true);
      }
    },
    { isActive: true },
  );

  return isFocused;
};
```

---

## 8. Kitty Keyboard Protocol

**File**: `packages/cli/src/ui/utils/kittyProtocolDetector.ts` (Lines 1-133)

Detects and enables enhanced keyboard protocol:

```typescript
export async function detectAndEnableKittyProtocol(): Promise<void> {
  // Query: CSI ? u (query progressive enhancement)
  // Query: CSI c (request device attributes)
  fs.writeSync(process.stdout.fd, '\x1b[?u\x1b[c');

  // Wait for response with timeout
  // If both CSI ? <flags> u and CSI ? <attrs> c received, protocol supported
}

export function isKittyProtocolEnabled(): boolean {
  return kittyEnabled;
}

export function enableSupportedProtocol(): void {
  if (kittySupported) {
    enableKittyKeyboardProtocol();
    kittyEnabled = true;
  }
}
```

---

## 9. Handler Priority and Event Flow

### No Built-in Priority System

The keyboard system does NOT have a priority system. All active handlers receive all events:

```typescript
// KeypressContext.tsx:582-584
const broadcast = useCallback(
  (key: Key) => subscribers.forEach((handler) => handler(key)),
  [subscribers],
);
```

### Implicit Priority via isActive

Priority is achieved through the `isActive` flag:

```typescript
// More specific component is active when its condition is met
useKeypress(handleDialogKey, { isActive: isDialogOpen });
useKeypress(handleInputKey, { isActive: !isDialogOpen && inputFocused });
useKeypress(handleGlobalKey, { isActive: true });
```

### Event Handling Responsibility

Each handler is responsible for checking if it should handle the event:

```typescript
useKeypress(
  (key) => {
    // Check focus/state first
    if (!isFocused) return;

    // Handle specific keys
    if (keyMatchers[Command.ESCAPE](key)) {
      handleEscape();
    }
  },
  { isActive: true },
);
```

---

## 10. Recommendations for FloMaster CLI

### Core Architecture

1. **Create KeypressProvider** with pub/sub pattern
2. **Implement useKeypress hook** with `isActive` flag
3. **Build Command enum and KeyBindingConfig**
4. **Consider opt-in Kitty protocol** for enhanced key detection

### Key Binding Pattern

```typescript
// config/keyBindings.ts
export enum Command {
  SUBMIT = 'submit',
  NEWLINE = 'newline',
  CANCEL = 'cancel',
  SCROLL_UP = 'scrollUp',
  // ...
}

export interface KeyBinding {
  key?: string;
  sequence?: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  paste?: boolean;
}

export type KeyBindingConfig = Record<Command, readonly KeyBinding[]>;
```

### Component Pattern

```typescript
function MyComponent({ hasFocus }: { hasFocus: boolean }) {
  const handleKeypress = useCallback((key: Key) => {
    if (keyMatchers[Command.SUBMIT](key)) {
      handleSubmit();
      return;
    }
    if (keyMatchers[Command.CANCEL](key)) {
      handleCancel();
      return;
    }
  }, [handleSubmit, handleCancel]);

  useKeypress(handleKeypress, { isActive: hasFocus });

  return <Box>...</Box>;
}
```

### Files to Create

```
packages/cli/src/
  ui/
    contexts/
      KeypressContext.tsx      # Pub/sub provider
      VimModeContext.tsx       # Optional vim mode
    hooks/
      useKeypress.ts           # Conditional subscription
      useBracketedPaste.ts     # Paste mode handling
      useVim.ts                # Optional vim bindings
      useFocus.ts              # Window focus tracking
    utils/
      keyMatchers.ts           # Key matching logic
      keyToAnsi.ts             # Key to ANSI conversion
      bracketedPaste.ts        # Paste control sequences
  config/
    keyBindings.ts             # Command enum + bindings
```

### Key Differences from Original Analysis

1. **Generator-based pipeline**: Uses generators for stateful parsing, not simple functions
2. **No handler priority**: All active handlers receive all events
3. **Modifier matching semantics**: `undefined` means ignore, `false` means must NOT be pressed
4. **Kitty protocol support**: Enhanced keyboard detection for modern terminals
5. **Focus recovery**: Fallback focus detection via keypress for tmux compatibility
