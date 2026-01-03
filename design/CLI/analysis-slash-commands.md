# Gemini CLI Slash Commands System Analysis

> SDK-Agnostic command system patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI implements a sophisticated slash command system:

1. **Provider-based Command Loading** - Multiple sources with unified loader interface
2. **Hierarchical Subcommands** - Nested subcommands for namespacing
3. **Type-safe Action Returns** - Discriminated union types for outcomes
4. **Dependency Injection via Context** - Commands receive services through `CommandContext`
5. **Fuzzy Completion System** - FZF-based autocomplete with prefix fallback
6. **Confirmation Flow** - Commands can pause for user confirmation

---

## 1. Command Interface Design

**File**: `packages/cli/src/ui/commands/types.ts:160-196`

### SlashCommand Interface

```typescript
interface SlashCommand {
  name: string;                    // Primary command name
  altNames?: string[];             // Aliases (e.g., "?" for "help")
  description: string;             // Shown in completions
  hidden?: boolean;                // Exclude from suggestions
  kind: CommandKind;               // BUILT_IN | FILE | MCP_PROMPT
  autoExecute?: boolean;           // Execute on Enter vs. autocomplete

  action?: (context: CommandContext, args: string) =>
    void | SlashCommandActionReturn | Promise<void | SlashCommandActionReturn>;

  completion?: (context: CommandContext, partialArg: string) =>
    Promise<string[]> | string[];

  subCommands?: SlashCommand[];    // Nested commands
}
```

### CommandKind Enum

```typescript
enum CommandKind {
  BUILT_IN = 'built-in',   // Core commands
  FILE = 'file',           // User-defined commands
  MCP_PROMPT = 'mcp-prompt', // MCP server prompts
}
```

---

## 2. Command Context Pattern

**File**: `packages/cli/src/ui/commands/types.ts:28-89`

```typescript
interface CommandContext {
  // Invocation metadata
  invocation?: {
    raw: string;      // Raw input (e.g., "/chat resume mytag")
    name: string;     // Matched command name
    args: string;     // Arguments after command
  };

  // Core services
  services: {
    config: Config | null;
    settings: LoadedSettings;
    git: GitService | undefined;
    logger: Logger;
  };

  // UI actions and state
  ui: {
    addItem: (item, timestamp) => void;
    clear: () => void;
    setDebugMessage: (message: string) => void;
    loadHistory: (items) => void;
    reloadCommands: () => void;
  };

  // Session-specific data
  session: {
    stats: SessionStatsState;
    sessionShellAllowlist: Set<string>;
  };
}
```

---

## 3. Action Return Types

**File**: `packages/cli/src/ui/commands/types.ts:91-151`

### Discriminated Union Pattern

```typescript
type SlashCommandActionReturn =
  | MessageActionReturn      // Display a message
  | ToolActionReturn         // Schedule a tool call
  | SubmitPromptActionReturn // Submit as AI prompt
  | QuitActionReturn         // Exit application
  | OpenDialogActionReturn   // Open modal dialog
  | ConfirmActionReturn      // Request confirmation
  | OpenCustomDialogActionReturn; // Custom dialog
```

### Core Returns

```typescript
// Display a message
interface MessageActionReturn {
  type: 'message';
  messageType: 'info' | 'error';
  content: string;
}

// Schedule a tool call
interface ToolActionReturn {
  type: 'tool';
  toolName: string;
  toolArgs: Record<string, unknown>;
}

// Exit the application
interface QuitActionReturn {
  type: 'quit';
  messages: HistoryItem[];
}

// Open a modal dialog
interface OpenDialogActionReturn {
  type: 'dialog';
  dialog: 'help' | 'theme' | 'settings' | 'model';
}

// Request confirmation
interface ConfirmActionReturn {
  type: 'confirm_action';
  prompt: ReactNode;
  originalInvocation: { raw: string };
}
```

---

## 4. Subcommand Architecture

### Parent with Subcommands

**File**: `packages/cli/src/ui/commands/chatCommand.ts:382-394`

```typescript
export const chatCommand: SlashCommand = {
  name: 'chat',
  description: 'Manage conversation history',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,  // Don't execute parent directly
  subCommands: [
    listCommand,     // /chat list
    saveCommand,     // /chat save <tag>
    resumeCommand,   // /chat resume <tag>
    deleteCommand,   // /chat delete <tag>
  ],
};
```

### Parent with Default Action

```typescript
export function extensionsCommand(): SlashCommand {
  return {
    name: 'extensions',
    description: 'Manage extensions',
    kind: CommandKind.BUILT_IN,
    subCommands: [listCommand, updateCommand],
    // Default to list if no subcommand
    action: (context, args) => listCommand.action!(context, args),
  };
}
```

---

## 5. Completion System

**File**: `packages/cli/src/ui/hooks/useSlashCompletion.ts`

### Architecture

```
useSlashCompletion
    ├── useCommandParser      → Parse query into command path
    ├── useCommandSuggestions → Generate suggestions (FZF + fallback)
    ├── useCompletionPositions → Calculate cursor positions
    └── usePerfectMatch       → Detect exact matches
```

### Command Parser Result

```typescript
interface CommandParserResult {
  hasTrailingSpace: boolean;
  commandPathParts: string[];     // ["chat", "resume"]
  partial: string;                // Incomplete part
  currentLevel: SlashCommand[];   // Available commands
  leafCommand: SlashCommand | null;
  isArgumentCompletion: boolean;
}
```

### Argument Completion

```typescript
// Commands provide custom completion
completion: async (context, partialArg) => {
  const chatDetails = await getSavedChatTags(context, true);
  return chatDetails
    .map(chat => chat.name)
    .filter(name => name.startsWith(partialArg));
}
```

---

## 6. Command Processing Flow

**File**: `packages/cli/src/ui/hooks/slashCommandProcessor.ts:313-606`

```
User Input (/command args)
       ↓
parseSlashCommand()
       ↓
Build CommandContext with invocation data
       ↓
Execute command.action(context, args)
       ↓
Handle SlashCommandActionReturn
       │
       ├─→ 'message'    → addItem() → return 'handled'
       ├─→ 'tool'       → return 'schedule_tool'
       ├─→ 'dialog'     → openXxxDialog() → return 'handled'
       ├─→ 'quit'       → quit() → return 'handled'
       ├─→ 'confirm'    → show prompt → re-execute on confirm
       └─→ 'submit_prompt' → return to caller for AI
```

---

## 7. Command Loader Architecture

**File**: `packages/cli/src/services/CommandService.ts`

### ICommandLoader Interface

```typescript
interface ICommandLoader {
  loadCommands(signal: AbortSignal): Promise<SlashCommand[]>;
}
```

### Provider Pattern

```typescript
const commandService = await CommandService.create(
  [
    new BuiltinCommandLoader(config),
    new FileCommandLoader(config),
    new McpPromptLoader(config),
  ],
  signal
);
```

---

## 8. Recommendations for FloMaster CLI

### Core Interface Design

```typescript
// packages/cli/src/commands/types.ts

export enum CommandKind {
  BUILT_IN = 'built-in',
  USER = 'user',
  EXTENSION = 'extension',
}

export interface SlashCommand {
  name: string;
  altNames?: string[];
  description: string;
  hidden?: boolean;
  kind: CommandKind;
  autoExecute?: boolean;

  action?: (context: CommandContext, args: string) =>
    void | CommandActionReturn | Promise<void | CommandActionReturn>;

  completion?: (context: CommandContext, partial: string) =>
    string[] | Promise<string[]>;

  subCommands?: SlashCommand[];
}
```

### Action Return Types

```typescript
export interface MessageActionReturn {
  type: 'message';
  level: 'info' | 'error' | 'warning';
  content: string;
}

export interface QuitActionReturn {
  type: 'quit';
  exitCode?: number;
}

export interface ConfirmActionReturn {
  type: 'confirm';
  prompt: string;
  onConfirm: string;  // Command to re-run
}

export type CommandActionReturn =
  | MessageActionReturn
  | QuitActionReturn
  | ConfirmActionReturn;
```

### Key Implementation Patterns

1. **Keep core returns SDK-agnostic**
2. **Use discriminated unions** for exhaustive handling
3. **Separate parsing from execution**
4. **Support sync and async completions**
5. **Cache FZF instances** with WeakMap
6. **Provide prefix fallback** when FZF fails
