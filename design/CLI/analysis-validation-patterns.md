# Gemini CLI Validation and Input Handling Patterns Analysis

This document provides an in-depth analysis of validation and input handling patterns found in the Gemini CLI codebase, focusing on the UI layer at `packages/cli/src/ui/`.

---

## Table of Contents

1. [Input Validation](#1-input-validation)
2. [Props Validation](#2-props-validation)
3. [State Validation](#3-state-validation)
4. [Command/Slash Command Validation](#4-commandslash-command-validation)
5. [File/Path Validation](#5-filepath-validation)
6. [Error Handling Patterns](#6-error-handling-patterns)
7. [User Feedback Patterns](#7-user-feedback-patterns)
8. [Recommendations for FloMaster Implementation](#8-recommendations-for-flomaster-implementation)

---

## 1. Input Validation

### 1.1 Text Buffer Input Sanitization

**File**: `/ui/components/shared/text-buffer.ts`

The text buffer provides comprehensive input sanitization before processing user input:

#### Character Filtering (Lines 94-120)

```typescript
export function stripUnsafeCharacters(str: string): string {
  const strippedAnsi = stripAnsi(str);
  const strippedVT = stripVTControlCharacters(strippedAnsi);

  return toCodePoints(strippedVT)
    .filter((char) => {
      const code = char.codePointAt(0);
      if (code === undefined) return false;

      // Preserve CR/LF/TAB for line handling
      if (code === 0x0a || code === 0x0d || code === 0x09) return true;

      // Remove C0 control chars (except CR/LF) that can break display
      if (code >= 0x00 && code <= 0x1f) return false;

      // Remove C1 control chars (0x80-0x9f) - legacy 8-bit control codes
      if (code >= 0x80 && code <= 0x9f) return false;

      return true;
    })
    .join('');
}
```

**Validation Rules**:
- Strips ANSI escape sequences using `strip-ansi`
- Removes VT control characters via Node.js `stripVTControlCharacters`
- Filters C0 control chars (0x00-0x1F) except CR/LF/TAB
- Filters C1 control chars (0x80-0x9F)
- Preserves DEL (0x7F) for functional backspace handling
- Preserves all printable Unicode including emojis

#### Word Boundary Validation (Lines 36-47)

```typescript
export const isWordCharStrict = (char: string): boolean =>
  /[\w\p{L}\p{N}]/u.test(char);

export const isWhitespace = (char: string): boolean => /\s/.test(char);

export const isCombiningMark = (char: string): boolean => /\p{M}/u.test(char);

export const isWordCharWithCombining = (char: string): boolean =>
  isWordCharStrict(char) || isCombiningMark(char);
```

#### Range Validation (Lines 480-489)

```typescript
if (
  startRow > endRow ||
  (startRow === endRow && startCol > endCol) ||
  startRow < 0 ||
  startCol < 0 ||
  endRow >= state.lines.length ||
  (endRow < state.lines.length && endCol > currentLineLen(endRow))
) {
  return state; // Invalid range - return unchanged state
}
```

### 1.2 Input Prompt Validation on Submit

**File**: `/ui/components/InputPrompt.tsx`

#### Trimming and Basic Validation (Lines 238-261)

```typescript
const handleSubmit = useCallback(
  (submittedValue: string) => {
    const trimmedMessage = submittedValue.trim();
    const isSlash = isSlashCommand(trimmedMessage);

    const isShell = shellModeActive;
    if (
      (isSlash || isShell) &&
      streamingState === StreamingState.Responding
    ) {
      setQueueErrorMessage(
        `${isShell ? 'Shell' : 'Slash'} commands cannot be queued`,
      );
      return;
    }
    handleSubmitAndClear(trimmedMessage);
  },
  [handleSubmitAndClear, shellModeActive, streamingState, setQueueErrorMessage],
);
```

**Validation Rules**:
- Trims whitespace from submitted value
- Blocks slash/shell commands while streaming is in progress
- Shows queue error message for blocked commands

#### Empty Input Handling (Lines 715-739)

```typescript
if (keyMatchers[Command.SUBMIT](key)) {
  if (buffer.text.trim()) {
    // Check if a paste operation occurred recently
    if (recentUnsafePasteTime !== null) {
      buffer.newline();
      return;
    }

    const [row, col] = buffer.cursor;
    const line = buffer.lines[row];
    const charBefore = col > 0 ? cpSlice(line, col - 1, col) : '';
    if (charBefore === '\\') {
      buffer.backspace();
      buffer.newline();
    } else {
      handleSubmit(buffer.text);
    }
  }
  return;
}
```

**Validation Rules**:
- Only submits if text is non-empty after trimming
- Protects against accidental submission from paste operations
- Handles backslash-newline escape sequences

### 1.3 Paste Protection Validation

**File**: `/ui/components/InputPrompt.tsx` (Lines 393-419)

```typescript
if (key.paste) {
  if (!isTerminalPasteTrusted(kittyProtocol.enabled)) {
    setRecentUnsafePasteTime(Date.now());

    if (pasteTimeoutRef.current) {
      clearTimeout(pasteTimeoutRef.current);
    }

    // 40ms protection window - faster than human typing
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

## 2. Props Validation

### 2.1 Context Hooks with Required Context Validation

**File**: `/ui/contexts/SettingsContext.tsx` (Lines 14-20)

```typescript
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
```

**File**: `/ui/contexts/ConfigContext.tsx` (Lines 12-18)

```typescript
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
```

**Pattern**: All context hooks validate that they're used within proper providers and throw descriptive errors if not.

### 2.2 Component Props Interface Definitions

**File**: `/ui/components/InputPrompt.tsx` (Lines 65-89)

```typescript
export interface InputPromptProps {
  buffer: TextBuffer;
  onSubmit: (value: string) => void;
  userMessages: readonly string[];
  onClearScreen: () => void;
  config: Config;
  slashCommands: readonly SlashCommand[];
  commandContext: CommandContext;
  placeholder?: string;
  focus?: boolean;
  inputWidth: number;
  suggestionsWidth: number;
  shellModeActive: boolean;
  setShellModeActive: (value: boolean) => void;
  approvalMode: ApprovalMode;
  // ... more props
}
```

**Pattern**: TypeScript interfaces enforce prop types at compile time. Optional props use `?` notation with sensible defaults.

### 2.3 Command Context Validation

**File**: `/ui/commands/types.ts` (Lines 28-89)

```typescript
export interface CommandContext {
  invocation?: {
    raw: string;
    name: string;
    args: string;
  };
  services: {
    config: Config | null;  // Explicitly nullable
    settings: LoadedSettings;
    git: GitService | undefined;  // Explicitly optional
    logger: Logger;
  };
  ui: { /* ... */ };
  session: { /* ... */ };
  overwriteConfirmed?: boolean;
}
```

**Pattern**: Uses explicit `null` and `undefined` types to indicate nullable/optional values, forcing consumers to handle these cases.

---

## 3. State Validation

### 3.1 Guard Clauses Pattern

**File**: `/ui/hooks/slashCommandProcessor.ts` (Lines 319-330)

```typescript
const handleSlashCommand = useCallback(
  async (rawQuery: PartListUnion, /* ... */): Promise<...> => {
    if (!commands) {
      return false;
    }
    if (typeof rawQuery !== 'string') {
      return false;
    }

    const trimmed = rawQuery.trim();
    if (!trimmed.startsWith('/') && !trimmed.startsWith('?')) {
      return false;
    }
    // ... process command
  }
);
```

**Pattern**: Early return guards check preconditions before processing.

### 3.2 State Change Prevention

**File**: `/ui/components/shared/text-buffer.ts` (Lines 1117-1127)

```typescript
case 'set_viewport': {
  const { width, height } = action.payload;
  if (width === state.viewportWidth && height === state.viewportHeight) {
    return state;  // No change, return same state reference
  }
  return {
    ...state,
    viewportWidth: width,
    viewportHeight: height,
  };
}
```

**Pattern**: Validates that state changes are meaningful before creating new state objects.

### 3.3 Cursor Position Clamping

**File**: `/ui/components/shared/text-buffer.ts` (Lines 528-537)

```typescript
return {
  ...state,
  lines: newLines,
  cursorRow: Math.min(Math.max(finalCursorRow, 0), newLines.length - 1),
  cursorCol: Math.max(
    0,
    Math.min(finalCursorCol, cpLen(newLines[finalCursorRow] || '')),
  ),
  preferredCol: null,
};
```

**Pattern**: Always clamps cursor positions to valid ranges after text operations.

### 3.4 Undo Stack Bounds

**File**: `/ui/components/shared/text-buffer.ts` (Lines 903-916)

```typescript
const historyLimit = 100;

export const pushUndo = (currentState: TextBufferState): TextBufferState => {
  const snapshot = {
    lines: [...currentState.lines],
    cursorRow: currentState.cursorRow,
    cursorCol: currentState.cursorCol,
  };
  const newStack = [...currentState.undoStack, snapshot];
  if (newStack.length > historyLimit) {
    newStack.shift();  // Remove oldest entry
  }
  return { ...currentState, undoStack: newStack, redoStack: [] };
};
```

---

## 4. Command/Slash Command Validation

### 4.1 Command Type Detection

**File**: `/ui/utils/commandUtils.ts` (Lines 21-48)

```typescript
export const isAtCommand = (query: string): boolean =>
  query.startsWith('@') || /\s@/.test(query);

export const isSlashCommand = (query: string): boolean => {
  if (!query.startsWith('/')) {
    return false;
  }

  // Exclude line comments that start with '//'
  if (query.startsWith('//')) {
    return false;
  }

  // Exclude block comments that start with '/*'
  if (query.startsWith('/*')) {
    return false;
  }

  return true;
};
```

**Pattern**: Distinguishes slash commands from code comments to prevent false positives.

### 4.2 Command Parsing and Resolution

**File**: `/utils/commands.ts` (Lines 23-71)

```typescript
export const parseSlashCommand = (
  query: string,
  commands: readonly SlashCommand[],
): ParsedSlashCommand => {
  const trimmed = query.trim();
  const parts = trimmed.substring(1).trim().split(/\s+/);
  const commandPath = parts.filter((p) => p);

  let currentCommands = commands;
  let commandToExecute: SlashCommand | undefined;
  let pathIndex = 0;
  const canonicalPath: string[] = [];

  for (const part of commandPath) {
    // First pass: exact match on primary name
    let foundCommand = currentCommands.find((cmd) => cmd.name === part);

    // Second pass: check aliases
    if (!foundCommand) {
      foundCommand = currentCommands.find((cmd) =>
        cmd.altNames?.includes(part),
      );
    }

    if (foundCommand) {
      commandToExecute = foundCommand;
      canonicalPath.push(foundCommand.name);
      pathIndex++;
      if (foundCommand.subCommands) {
        currentCommands = foundCommand.subCommands;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const args = parts.slice(pathIndex).join(' ');
  return { commandToExecute, args, canonicalPath };
};
```

**Pattern**: Hierarchical command resolution with alias support, extracting remaining arguments.

### 4.3 Required Arguments Validation

**File**: `/ui/commands/memoryCommand.ts` (Lines 49-56)

```typescript
action: (context, args): SlashCommandActionReturn | void => {
  if (!args || args.trim() === '') {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Usage: /memory add <text to remember>',
    };
  }
  // ... proceed with valid args
}
```

**File**: `/ui/commands/chatCommand.ts` (Lines 92-99)

```typescript
action: async (context, args): Promise<SlashCommandActionReturn | void> => {
  const tag = args.trim();
  if (!tag) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Missing tag. Usage: /chat save <tag>',
    };
  }
  // ... proceed with valid tag
}
```

**Pattern**: Validate required arguments early, return error message with usage hint.

### 4.4 Format Validation

**File**: `/ui/commands/chatCommand.ts` (Lines 326-333)

```typescript
const extension = path.extname(filePath);
if (extension !== '.md' && extension !== '.json') {
  return {
    type: 'message',
    messageType: 'error',
    content: 'Invalid file format. Only .md and .json are supported.',
  };
}
```

### 4.5 Subcommand Help Generation

**File**: `/ui/hooks/slashCommandProcessor.ts` (Lines 541-550)

```typescript
} else if (commandToExecute.subCommands) {
  const helpText = `Command '/${commandToExecute.name}' requires a subcommand. Available:\n${commandToExecute.subCommands
    .map((sc) => `  - ${sc.name}: ${sc.description || ''}`)
    .join('\n')}`;
  addMessage({
    type: MessageType.INFO,
    content: helpText,
    timestamp: new Date(),
  });
  return { type: 'handled' };
}
```

### 4.6 Unknown Command Handling

**File**: `/ui/hooks/slashCommandProcessor.ts` (Lines 554-560)

```typescript
addMessage({
  type: MessageType.ERROR,
  content: `Unknown command: ${trimmed}`,
  timestamp: new Date(),
});
return { type: 'handled' };
```

---

## 5. File/Path Validation

### 5.1 @ Command Path Parsing

**File**: `/ui/hooks/atCommandProcessor.ts` (Lines 45-113)

```typescript
function parseAllAtCommands(query: string): AtCommandPart[] {
  const parts: AtCommandPart[] = [];
  let currentIndex = 0;

  while (currentIndex < query.length) {
    let atIndex = -1;
    let nextSearchIndex = currentIndex;

    // Find next unescaped '@'
    while (nextSearchIndex < query.length) {
      if (
        query[nextSearchIndex] === '@' &&
        (nextSearchIndex === 0 || query[nextSearchIndex - 1] !== '\\')
      ) {
        atIndex = nextSearchIndex;
        break;
      }
      nextSearchIndex++;
    }
    // ... handle escape sequences and path boundaries
  }
}
```

**Pattern**: Handles escaped characters, whitespace, and punctuation boundaries in paths.

### 5.2 Empty Path Validation

**File**: `/ui/hooks/atCommandProcessor.ts` (Lines 171-192)

```typescript
if (originalAtPath === '@') {
  onDebugMessage(
    'Lone @ detected, will be treated as text in the modified query.',
  );
  continue;
}

const pathName = originalAtPath.substring(1);
if (!pathName) {
  addItem(
    {
      type: 'error',
      text: `Error: Invalid @ command '${originalAtPath}'. No path specified.`,
    },
    userMessageTimestamp,
  );
  return { processedQuery: null, shouldProceed: false };
}
```

### 5.3 Workspace Boundary Validation

**File**: `/ui/hooks/atCommandProcessor.ts` (Lines 196-200)

```typescript
const workspaceContext = config.getWorkspaceContext();
if (!workspaceContext.isPathWithinWorkspace(pathName)) {
  onDebugMessage(
    `Path ${pathName} is not in the workspace and will be skipped.`,
  );
  continue;
}
```

### 5.4 Ignore File Filtering

**File**: `/ui/hooks/atCommandProcessor.ts` (Lines 204-229)

```typescript
const gitIgnored =
  respectFileIgnore.respectGitIgnore &&
  fileDiscovery.shouldIgnoreFile(pathName, {
    respectGitIgnore: true,
    respectGeminiIgnore: false,
  });
const geminiIgnored =
  respectFileIgnore.respectGeminiIgnore &&
  fileDiscovery.shouldIgnoreFile(pathName, {
    respectGitIgnore: false,
    respectGeminiIgnore: true,
  });

if (gitIgnored || geminiIgnored) {
  const reason =
    gitIgnored && geminiIgnored ? 'both' : gitIgnored ? 'git' : 'gemini';
  ignoredByReason[reason].push(pathName);
  const reasonText = /* ... */;
  onDebugMessage(`Path ${pathName} is ${reasonText} and will be skipped.`);
  continue;
}
```

### 5.5 File Existence Validation with Fallback

**File**: `/ui/hooks/atCommandProcessor.ts` (Lines 259-321)

```typescript
try {
  const absolutePath = path.isAbsolute(pathName)
    ? pathName
    : path.resolve(dir, pathName);
  const stats = await fs.stat(absolutePath);
  // Handle file vs directory
} catch (error) {
  if (isNodeError(error) && error.code === 'ENOENT') {
    if (config.getEnableRecursiveFileSearch() && globTool) {
      // Attempt glob search fallback
      const globResult = await globTool.buildAndExecute(
        { pattern: `**/*${pathName}*`, path: dir },
        signal,
      );
      // Process glob results
    }
  }
}
```

### 5.6 Home Directory Expansion

**File**: `/ui/utils/directoryUtils.ts` (Lines 10-21)

```typescript
export function expandHomeDir(p: string): string {
  if (!p) {
    return '';
  }
  let expandedPath = p;
  if (p.toLowerCase().startsWith('%userprofile%')) {
    expandedPath = os.homedir() + p.substring('%userprofile%'.length);
  } else if (p === '~' || p.startsWith('~/')) {
    expandedPath = os.homedir() + p.substring(1);
  }
  return path.normalize(expandedPath);
}
```

---

## 6. Error Handling Patterns

### 6.1 Try-Catch with User Feedback

**File**: `/ui/hooks/slashCommandProcessor.ts` (Lines 561-579)

```typescript
} catch (e: unknown) {
  hasError = true;
  if (config) {
    const event = makeSlashCommandEvent({
      command: resolvedCommandPath[0],
      subcommand,
      status: SlashCommandStatus.ERROR,
      extension_id: commandToExecute?.extensionId,
    });
    logSlashCommand(config, event);
  }
  addItem(
    {
      type: MessageType.ERROR,
      text: e instanceof Error ? e.message : String(e),
    },
    Date.now(),
  );
  return { type: 'handled' };
}
```

**Pattern**: Log errors for analytics, display user-friendly message, extract message from Error objects.

### 6.2 Graceful Degradation

**File**: `/ui/commands/chatCommand.ts` (Lines 364-378)

```typescript
try {
  await fsPromises.writeFile(filePath, content);
  return {
    type: 'message',
    messageType: 'info',
    content: `Conversation shared to ${filePath}`,
  };
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  return {
    type: 'message',
    messageType: 'error',
    content: `Error sharing conversation: ${errorMessage}`,
  };
}
```

### 6.3 Configuration Null Checks

**File**: `/ui/commands/initCommand.ts` (Lines 24-31)

```typescript
action: async (context: CommandContext, _args: string): Promise<SlashCommandActionReturn> => {
  if (!context.services.config) {
    return {
      type: 'message',
      messageType: 'error',
      content: 'Configuration not available.',
    };
  }
  // ... proceed with valid config
}
```

---

## 7. User Feedback Patterns

### 7.1 Error Message Component

**File**: `/ui/components/messages/ErrorMessage.tsx`

```typescript
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text }) => {
  const prefix = '✕ ';
  const prefixWidth = prefix.length;

  return (
    <Box flexDirection="row" marginBottom={1}>
      <Box width={prefixWidth}>
        <Text color={theme.status.error}>{prefix}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text wrap="wrap" color={theme.status.error}>
          {text}
        </Text>
      </Box>
    </Box>
  );
};
```

**Pattern**: Visual prefix icon, semantic color, text wrapping for long messages.

### 7.2 Message Types Enum

**File**: `/ui/types.ts` (Lines 285-303)

```typescript
export enum MessageType {
  INFO = 'info',
  ERROR = 'error',
  WARNING = 'warning',
  USER = 'user',
  ABOUT = 'about',
  HELP = 'help',
  STATS = 'stats',
  // ...
}
```

### 7.3 Command Action Return Types

**File**: `/ui/commands/types.ts` (Lines 145-151)

```typescript
export type SlashCommandActionReturn =
  | CommandActionReturn<HistoryItemWithoutId[]>
  | QuitActionReturn
  | OpenDialogActionReturn
  | ConfirmShellCommandsActionReturn
  | ConfirmActionReturn
  | OpenCustomDialogActionReturn;
```

**Pattern**: Union types for different action outcomes, enabling type-safe result handling.

### 7.4 Usage Hints in Error Messages

Pattern observed across multiple commands:

```typescript
return {
  type: 'message',
  messageType: 'error',
  content: 'Missing tag. Usage: /chat save <tag>',
};
```

```typescript
return {
  type: 'message',
  messageType: 'error',
  content: 'Usage: /memory add <text to remember>',
};
```

### 7.5 Debug Message Channel

**File**: `/ui/hooks/atCommandProcessor.ts`

```typescript
onDebugMessage(`Path ${pathName} is ${reasonText} and will be skipped.`);
```

**Pattern**: Separate debug channel for verbose logging without cluttering user interface.

---

## 8. Recommendations for FloMaster Implementation

### 8.1 Input Validation Layer

1. **Create a centralized input sanitization utility** similar to `stripUnsafeCharacters`:
   ```typescript
   // packages/core/src/utils/inputSanitizer.ts
   export function sanitizeInput(str: string): string {
     // Strip ANSI, VT control characters
     // Filter unsafe control codes
     // Preserve necessary whitespace
   }
   ```

2. **Implement paste protection** for terminal environments:
   - Track recent paste timestamps
   - Block submission within protection window (40ms recommended)
   - Detect terminal protocol support (Kitty, etc.)

### 8.2 Command Validation Architecture

1. **Define command schema with Zod**:
   ```typescript
   const CommandArgsSchema = z.object({
     tag: z.string().min(1, 'Tag is required'),
     format: z.enum(['md', 'json']).optional(),
   });
   ```

2. **Create validation decorators or middleware**:
   ```typescript
   const withValidation = <T>(schema: z.ZodSchema<T>, action: CommandAction<T>) => {
     return (context: CommandContext, args: string) => {
       const result = schema.safeParse(parseArgs(args));
       if (!result.success) {
         return { type: 'error', message: formatZodError(result.error) };
       }
       return action(context, result.data);
     };
   };
   ```

### 8.3 Error Handling Strategy

1. **Standardize error response types**:
   ```typescript
   type CommandResult =
     | { success: true; data: unknown }
     | { success: false; error: string; usage?: string };
   ```

2. **Always include usage hints** in validation error messages

3. **Separate logging from user feedback**:
   - Log full error details for debugging
   - Show concise, actionable messages to users

### 8.4 Context Validation

1. **Use TypeScript strict mode** and never types:
   ```typescript
   function exhaustiveCheck(x: never): never {
     throw new Error(`Unhandled case: ${x}`);
   }
   ```

2. **Validate context availability** at hook boundaries:
   ```typescript
   export function useRequiredContext<T>(
     context: T | undefined,
     name: string
   ): T {
     if (context === undefined) {
       throw new Error(`${name} must be used within its Provider`);
     }
     return context;
   }
   ```

### 8.5 File/Path Handling

1. **Always validate paths are within workspace boundaries**
2. **Support home directory expansion** (`~`, `%USERPROFILE%`)
3. **Respect ignore files** (`.gitignore`, `.flomasterignore`)
4. **Provide fallback search** when exact paths don't exist

### 8.6 User Feedback Best Practices

1. **Use semantic colors consistently**:
   - Error: Red
   - Warning: Yellow/Orange
   - Info: Blue/Cyan
   - Success: Green

2. **Prefix messages with icons** for quick visual identification:
   - Error: `✕`
   - Warning: `⚠`
   - Info: `ℹ`
   - Success: `✓`

3. **Support text wrapping** for long error messages

4. **Provide actionable feedback**:
   - What went wrong
   - Why it went wrong (if helpful)
   - How to fix it (usage examples)

### 8.7 State Machine Validation

For complex state transitions (streaming, authentication):

1. **Use XState** for state machine validation (already in FloMaster stack)
2. **Define valid state transitions explicitly**
3. **Guard against invalid state changes**

---

## Summary

The Gemini CLI implements a layered validation approach:

| Layer | Validation Type | Location |
|-------|----------------|----------|
| Input | Character sanitization, paste protection | `text-buffer.ts`, `InputPrompt.tsx` |
| Props | TypeScript interfaces, context guards | Component props, Context hooks |
| State | Guard clauses, bounds checking, immutable updates | Reducers, hooks |
| Commands | Argument parsing, format validation, existence checks | Command actions, processors |
| Files | Path resolution, workspace boundaries, ignore rules | `atCommandProcessor.ts` |

Key patterns to adopt:
- **Early return guards** for precondition checks
- **Centralized sanitization** utilities
- **Type-safe error handling** with union types
- **Descriptive error messages** with usage hints
- **Separation of concerns** between logging and user feedback
