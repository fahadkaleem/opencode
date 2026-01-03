# Gemini CLI Package Architecture Analysis

> SDK-Agnostic patterns for building Ink-based CLI applications

---

## Executive Summary

The Gemini CLI demonstrates mature patterns for building CLI applications with React (Ink). Key reusable patterns include:

1. **Core/CLI separation** - Pure TypeScript core with no UI dependencies
2. **Context-driven UI state management** - Multiple specialized React contexts
3. **Command system architecture** - Slash commands with completion support
4. **Hook-based feature organization** - Custom hooks for each domain concern
5. **Reducer-based state management** - For complex state like extensions
6. **Theming system** - Semantic tokens with custom theme support
7. **Dual-mode support** - Interactive and non-interactive CLI modes

---

## 1. Monorepo Structure

### Package Organization

```
packages/
├── cli/           # @google/gemini-cli - Terminal UI (Ink/React)
├── core/          # @google/gemini-cli-core - Pure TypeScript business logic
├── test-utils/    # Shared testing utilities
├── a2a-server/    # Agent-to-agent server
└── vscode-ide-companion/  # VS Code extension
```

| Package | Purpose | Depends On |
|---------|---------|------------|
| `core` | Pure TypeScript business logic, tools, SDK wrapper | None (no React) |
| `cli` | Ink/React terminal UI | core |

**Key Insight**: The core package has ZERO React dependencies. The CLI package imports from core, never the reverse.

**Reference**: `packages/core/package.json` - Note the absence of any React-related dependencies

---

## 2. CLI Package Directory Structure

```
packages/cli/src/
├── gemini.tsx                  # Main entry point (lines 1-713)
├── nonInteractiveCli.ts        # Non-interactive mode runner
├── nonInteractiveCliCommands.ts # Non-interactive command handlers
├── validateNonInterActiveAuth.ts
├── config/                     # CLI configuration
│   ├── config.ts               # CLI argument parsing (~24KB)
│   ├── settings.ts             # User settings management (~26KB)
│   ├── settingsSchema.ts       # Zod/validation schemas (~59KB)
│   ├── auth.ts                 # Authentication config
│   ├── keyBindings.ts          # Key binding configuration
│   ├── sandboxConfig.ts        # Sandbox configuration
│   ├── trustedFolders.ts       # Folder trust management
│   ├── extension-manager.ts    # Extension management (~27KB)
│   ├── extension.ts            # Extension types
│   ├── extensions/             # Extension-specific config
│   └── policy.ts               # Policy engine config
├── core/                       # CLI-specific core initialization
│   └── initializer.js          # App initialization
├── ui/                         # React/Ink UI layer
│   ├── App.tsx                 # Root app component (39 lines)
│   ├── AppContainer.tsx        # Main container with providers (~52KB)
│   ├── contexts/               # React contexts (18 files)
│   ├── hooks/                  # Custom React hooks (~100 files)
│   ├── components/             # UI components (~120 files)
│   │   ├── shared/             # Reusable primitives (12 files)
│   │   ├── messages/           # Message type renderers (16 files)
│   │   └── views/              # View components
│   ├── layouts/                # App layout variations (2 files)
│   ├── themes/                 # Theme definitions & manager (22 files)
│   ├── commands/               # Slash command implementations (32 files)
│   ├── state/                  # Reducer-based state (extensions only)
│   ├── auth/                   # Authentication UI
│   ├── privacy/                # Privacy-related UI
│   ├── utils/                  # UI utilities (~45 files)
│   ├── constants/              # UI constants
│   ├── editors/                # Editor integrations
│   └── noninteractive/         # Non-interactive UI
├── commands/                   # CLI subcommands (12 files)
├── utils/                      # CLI-level utilities (~68 files)
├── services/                   # CLI services (12 files)
├── test-utils/                 # CLI test utilities (9 files)
├── zed-integration/            # Zed editor integration
└── patches/                    # Ink patches
```

---

## 3. Entry Point Architecture

### Main Entry (`gemini.tsx`)

The main entry point handles:
1. Settings loading and migration
2. Sandbox initialization (if enabled)
3. Memory configuration and process relaunching
4. Authentication validation
5. Interactive vs non-interactive mode routing

**Key Functions**:
- `main()` - Primary entry function (lines 289-677)
- `startInteractiveUI()` - Launches Ink render loop (lines 175-287)
- `initializeOutputListenersAndFlush()` - Sets up output handling (lines 690-712)

### Provider Hierarchy (gemini.tsx:214-245)

```typescript
// Actual provider hierarchy from gemini.tsx
<SettingsContext.Provider value={settings}>
  <KeypressProvider config={config} debugKeystrokeLogging={...}>
    <MouseProvider mouseEventsEnabled={...} debugKeystrokeLogging={...}>
      <ScrollProvider>
        <SessionStatsProvider>
          <VimModeProvider settings={settings}>
            <AppContainer ... />
          </VimModeProvider>
        </SessionStatsProvider>
      </ScrollProvider>
    </MouseProvider>
  </KeypressProvider>
</SettingsContext.Provider>
```

**Note**: The useKittyKeyboardProtocol hook is called inside AppWrapper before the provider tree.

---

## 4. Context Architecture

### Context Files (ui/contexts/)

| Context | File | Purpose |
|---------|------|---------|
| `AppContext` | AppContext.tsx | App-level React context |
| `ConfigContext` | ConfigContext.tsx | Core config access (19 lines) |
| `SettingsContext` | SettingsContext.tsx | User settings |
| `UIStateContext` | UIStateContext.tsx | All read-only UI state (~150 lines) |
| `UIActionsContext` | UIActionsContext.tsx | All action handlers (~70 lines) |
| `SessionContext` | SessionContext.tsx | Session statistics with stats reducer |
| `KeypressContext` | KeypressContext.tsx | Keyboard input handling (~17KB) |
| `MouseContext` | MouseContext.tsx | Mouse event handling (~4KB) |
| `ScrollProvider` | ScrollProvider.tsx | Scroll position management (~10KB) |
| `VimModeContext` | VimModeContext.tsx | Vim mode state (~2KB) |
| `StreamingContext` | StreamingContext.tsx | Current streaming status |
| `OverflowContext` | OverflowContext.tsx | Overflow handling |
| `ShellFocusContext` | ShellFocusContext.tsx | Shell focus state |

### UIState Interface (UIStateContext.tsx:44-139)

The UIState interface contains ~95 properties including:
- `history`, `historyManager` - Chat history state
- `isThemeDialogOpen`, `themeError` - Theme dialog state
- `isAuthenticating`, `authError`, `isAuthDialogOpen` - Auth state
- `streamingState`, `pendingGeminiHistoryItems` - Streaming state
- `slashCommands`, `commandContext` - Command system state
- `terminalWidth`, `terminalHeight`, `mainAreaWidth` - Layout metrics
- `sessionStats`, `branchName` - Session information
- `vimMode`, `copyModeEnabled` - Input mode state
- And many more...

### UIActions Interface (UIActionsContext.tsx:17-59)

Contains ~25 action methods:
- `handleThemeSelect`, `closeThemeDialog`, `handleThemeHighlight`
- `handleAuthSelect`, `setAuthState`, `onAuthError`
- `handleEditorSelect`, `exitEditorDialog`
- `setShellModeActive`, `vimHandleInput`
- `handleFinalSubmit`, `handleClearScreen`
- `openSessionBrowser`, `handleResumeSession`
- And more...

### Context Pattern (ConfigContext.tsx:1-19)

```typescript
import React, { useContext } from 'react';
import { type Config } from '@google/gemini-cli-core';

export const ConfigContext = React.createContext<Config | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
```

---

## 5. Component Structure

### Component Hierarchy

```
App.tsx                          # Layout switcher (39 lines)
├── StreamingContext.Provider
└── [Layout]
    ├── DefaultAppLayout         # Standard layout (67 lines)
    │   ├── MainContent          # Chat history
    │   ├── Notifications        # Banners/warnings
    │   ├── CopyModeWarning      # Copy mode indicator
    │   ├── DialogManager / Composer  # Modal dialogs or input
    │   └── ExitWarning          # Exit confirmation
    └── ScreenReaderAppLayout    # Accessibility variant
```

### Component Categories

**Shared Components** (`components/shared/` - 12 files):
- `TextInput.tsx` - Text input field (~2.5KB)
- `RadioButtonSelect.tsx` - Selection component (~2.9KB)
- `DescriptiveRadioButtonSelect.tsx` - Descriptive selection
- `VirtualizedList.tsx` - Performance-optimized list (~14KB)
- `MaxSizedBox.tsx` - Size-constrained container (~19KB)
- `Scrollable.tsx` - Scrollable container (~4.4KB)
- `ScrollableList.tsx` - Scrollable list (~7.3KB)
- `BaseSelectionList.tsx` - List selection base (~5KB)
- `EnumSelector.tsx` - Enum value selector
- `ScopeSelector.tsx` - Settings scope selector
- `text-buffer.ts` - Text buffer utilities (~75KB)
- `vim-buffer-actions.ts` - Vim buffer actions (~22KB)

**Message Components** (`components/messages/` - 16 files):
- `UserMessage.tsx` - User input display
- `GeminiMessage.tsx` - AI response display
- `GeminiMessageContent.tsx` - Message content renderer
- `ToolMessage.tsx` - Tool call display
- `ToolGroupMessage.tsx` - Grouped tool calls
- `ToolConfirmationMessage.tsx` - Tool confirmation UI
- `ToolResultDisplay.tsx` - Tool result rendering
- `ErrorMessage.tsx` - Error display
- `WarningMessage.tsx` - Warning display
- `InfoMessage.tsx` - Info display
- `ShellToolMessage.tsx` - Shell command output
- `DiffRenderer.tsx` - Diff visualization (~13KB)
- `CompressionMessage.tsx` - Context compression notice
- `Todo.tsx` - Todo item display
- `ModelMessage.tsx` - Model info display

**Major Components** (`components/` - ~50+ files):
- `InputPrompt.tsx` - Main input with completions (~39KB)
- `SettingsDialog.tsx` - Full settings UI (~37KB)
- `SessionBrowser.tsx` - Session management UI (~27KB)
- `Composer.tsx` - Input composition area (~7.3KB)
- `DialogManager.tsx` - Dialog orchestration (~7.2KB)
- `MainContent.tsx` - Main chat content area
- `Footer.tsx` - Application footer
- `Header.tsx` - Application header
- `LoadingIndicator.tsx` - Loading states
- `StatsDisplay.tsx` - Statistics display (~11KB)
- `ThemeDialog.tsx` - Theme selection (~10KB)

---

## 6. Hook Architecture

### Hook Categories (~100 files in ui/hooks/)

**Input Hooks**:
- `useKeypress.ts` - Keyboard event handling
- `useMouse.ts` - Mouse event handling
- `useMouseClick.ts` - Mouse click handling
- `useBracketedPaste.ts` - Paste handling
- `useInputHistory.ts` - Input history (up/down arrow)
- `useInputHistoryStore.ts` - Persistent input history

**UI State Hooks**:
- `useTerminalSize.ts` - Terminal dimensions
- `useAlternateBuffer.ts` - Alternate screen buffer
- `useFocus.ts` - Focus management
- `useLoadingIndicator.ts` - Loading state
- `usePhraseCycler.ts` - Rotating loading phrases
- `useFlickerDetector.ts` - Rendering flicker detection
- `useAnimatedScrollbar.ts` - Scrollbar animation
- `useBatchedScroll.ts` - Scroll batching for performance

**Feature Hooks**:
- `useHistoryManager.ts` - Chat history management
- `slashCommandProcessor.ts` - Slash command processing
- `atCommandProcessor.ts` - @ mention processing
- `shellCommandProcessor.ts` - Shell command processing
- `useThemeCommand.ts` - Theme switching
- `useSessionBrowser.ts` - Session management
- `useSessionResume.ts` - Session resume functionality
- `useModelCommand.ts` - Model switching
- `useSettingsCommand.ts` - Settings access
- `useEditorSettings.ts` - Editor configuration

**Streaming Hooks**:
- `useGeminiStream.ts` - AI response streaming
- `useMessageQueue.ts` - Message queue management
- `useConsoleMessages.ts` - Console message handling

**Completion Hooks**:
- `useCompletion.ts` - Base completion logic
- `useCommandCompletion.tsx` - Command completion
- `useSlashCompletion.ts` - Slash command completion
- `useAtCompletion.ts` - @ mention completion
- `usePromptCompletion.ts` - Prompt completion
- `useReverseSearchCompletion.tsx` - History search

**System Hooks**:
- `useVim.ts` - Vim mode management
- `vim.ts` - Vim implementation
- `useMemoryMonitor.ts` - Memory usage tracking
- `useLogger.ts` - Logging utilities
- `useTimer.ts` - Timer utilities
- `useQuotaAndFallback.ts` - Quota management
- `useAutoAcceptIndicator.ts` - Auto-accept mode indicator
- `useGitBranchName.ts` - Git branch detection
- `useFolderTrust.ts` - Folder trust checking
- `useIdeTrustListener.ts` - IDE trust events
- `useIncludeDirsTrust.tsx` - Include directories trust
- `useExtensionUpdates.ts` - Extension update handling
- `useInactivityTimer.ts` - Inactivity detection
- `useKittyKeyboardProtocol.ts` - Kitty terminal protocol
- `useBanner.ts` - Banner display management
- `useStateAndRef.ts` - Combined state and ref pattern
- `usePrivacySettings.ts` - Privacy configuration
- `useReactToolScheduler.ts` - Tool scheduling
- `useShellHistory.ts` - Shell command history

---

## 7. Command System Architecture

### Slash Command Types (ui/commands/types.ts)

```typescript
export enum CommandKind {
  BUILT_IN = 'built-in',
  FILE = 'file',
  MCP_PROMPT = 'mcp-prompt',
}

export interface SlashCommand {
  name: string;
  altNames?: string[];
  description: string;
  hidden?: boolean;
  kind: CommandKind;
  autoExecute?: boolean;  // Execute immediately on Enter
  extensionName?: string;
  extensionId?: string;

  action?: (context: CommandContext, args: string) =>
    void | SlashCommandActionReturn | Promise<void | SlashCommandActionReturn>;

  completion?: (context: CommandContext, partialArg: string) =>
    Promise<string[]> | string[];

  subCommands?: SlashCommand[];
}
```

### Command Return Types

```typescript
export type SlashCommandActionReturn =
  | CommandActionReturn<HistoryItemWithoutId[]>  // From core
  | QuitActionReturn          // { type: 'quit', messages: HistoryItem[] }
  | OpenDialogActionReturn    // { type: 'dialog', dialog: '...' }
  | ConfirmShellCommandsActionReturn
  | ConfirmActionReturn
  | OpenCustomDialogActionReturn;
```

### Available Dialogs

```typescript
dialog: 'help' | 'auth' | 'theme' | 'editor' | 'privacy' |
        'settings' | 'sessionBrowser' | 'model' | 'permissions';
```

### CommandContext Structure (ui/commands/types.ts:28-89)

```typescript
export interface CommandContext {
  invocation?: {
    raw: string;      // Raw untrimmed input
    name: string;     // Matched command name
    args: string;     // Arguments after command
  };
  services: {
    config: Config | null;
    settings: LoadedSettings;
    git: GitService | undefined;
    logger: Logger;
  };
  ui: {
    addItem: UseHistoryManagerReturn['addItem'];
    clear: () => void;
    setDebugMessage: (message: string) => void;
    pendingItem: HistoryItemWithoutId | null;
    setPendingItem: (item: HistoryItemWithoutId | null) => void;
    loadHistory: UseHistoryManagerReturn['loadHistory'];
    toggleCorgiMode: () => void;
    toggleDebugProfiler: () => void;
    toggleVimEnabled: () => Promise<boolean>;
    reloadCommands: () => void;
    extensionsUpdateState: Map<string, ExtensionUpdateStatus>;
    dispatchExtensionStateUpdate: (action: ExtensionUpdateAction) => void;
    addConfirmUpdateExtensionRequest: (value: ConfirmationRequest) => void;
    removeComponent: () => void;
  };
  session: {
    stats: SessionStatsState;
    sessionShellAllowlist: Set<string>;
  };
  overwriteConfirmed?: boolean;
}
```

### Built-in Commands (ui/commands/ - 32 files)

- `/about` - Application info
- `/auth` - Authentication management
- `/bug` - Bug reporting
- `/chat` - Chat session management
- `/clear` - Clear screen
- `/compress` - Context compression
- `/copy` - Copy to clipboard
- `/corgi` - Easter egg mode
- `/directory` - Directory management
- `/docs` - Documentation
- `/editor` - Editor settings
- `/extensions` - Extension management
- `/help` - Help display
- `/hooks` - Hook management
- `/ide` - IDE integration
- `/init` - Project initialization
- `/mcp` - MCP server management
- `/memory` - Memory/context management
- `/model` - Model selection
- `/permissions` - Permission management
- `/policies` - Policy display
- `/privacy` - Privacy settings
- `/profile` - User profile
- `/quit` - Exit application
- `/restore` - Restore session
- `/resume` - Resume session
- `/settings` - Settings dialog
- `/setup-github` - GitHub integration
- `/stats` - Session statistics
- `/terminal-setup` - Terminal configuration
- `/theme` - Theme selection
- `/tools` - Tool management
- `/vim` - Vim mode toggle

---

## 8. State Management Patterns

### Reducer Pattern (ui/state/extensions.ts)

```typescript
export type ExtensionUpdateAction =
  | { type: 'SET_STATE'; payload: { name: string; state: ExtensionUpdateState } }
  | { type: 'SET_NOTIFIED'; payload: { name: string; notified: boolean } }
  | { type: 'BATCH_CHECK_START' }
  | { type: 'BATCH_CHECK_END' }
  | { type: 'SCHEDULE_UPDATE'; payload: ScheduleUpdateArgs }
  | { type: 'CLEAR_SCHEDULED_UPDATE' }
  | { type: 'RESTARTED'; payload: { name: string } };

export function extensionUpdatesReducer(
  state: ExtensionUpdatesState,
  action: ExtensionUpdateAction,
): ExtensionUpdatesState {
  switch (action.type) {
    case 'SET_STATE': { /* ... */ }
    case 'SET_NOTIFIED': { /* ... */ }
    // ... exhaustive handling
    default:
      checkExhaustive(action);  // Type-safe exhaustive check
  }
}
```

**Note**: The state directory only contains extension-related reducers. Most state is managed through the consolidated UIState/UIActions contexts.

---

## 9. Theming System

### Theme Structure (ui/themes/)

**Theme Files** (22 files):
- `theme.ts` - Base theme types and defaults (~14KB)
- `theme-manager.ts` - Theme management singleton (~9KB)
- `semantic-tokens.ts` - Semantic color mappings (~136 lines)
- `color-utils.ts` - Color manipulation utilities (~6KB)
- Built-in themes:
  - `default.ts`, `default-light.ts`
  - `ansi.ts`, `ansi-light.ts`
  - `atom-one-dark.ts`
  - `ayu.ts`, `ayu-light.ts`
  - `dracula.ts`
  - `github-dark.ts`, `github-light.ts`
  - `googlecode.ts`
  - `holiday.ts`
  - `no-color.ts`
  - `shades-of-purple.ts`
  - `xcode.ts`

### Semantic Color Tokens (semantic-tokens.ts:9-39)

```typescript
export interface SemanticColors {
  text: {
    primary: string;
    secondary: string;
    link: string;
    accent: string;
    response: string;
  };
  background: {
    primary: string;
    diff: {
      added: string;
      removed: string;
    };
  };
  border: {
    default: string;
    focused: string;
  };
  ui: {
    comment: string;
    symbol: string;
    dark: string;
    gradient: string[] | undefined;
  };
  status: {
    error: string;
    success: string;
    warning: string;
  };
}
```

---

## 10. Non-Interactive Mode

### Dual-Mode Support

The CLI supports two modes:
1. **Interactive** - Full Ink/React UI with keyboard input
2. **Non-Interactive** - Streaming output for piped/scripted usage

**Mode Detection** (gemini.tsx:591):
```typescript
if (config.isInteractive()) {
  await startInteractiveUI(config, settings, startupWarnings, ...);
} else {
  await runNonInteractive({ config, settings, input, ... });
}
```

**Non-Interactive Features** (nonInteractiveCli.ts):
- Stdin input handling
- JSON/stream output formatting
- Tool call execution without UI
- Cancellation via Ctrl+C
- Session resume support

---

## 11. Key Patterns Summary

### 1. Context Consolidation
Large consolidated contexts (UIState with ~95 properties, UIActions with ~25 methods) rather than many small focused contexts.

### 2. Hook-Per-Feature
One hook per feature concern enables testing and reuse.

### 3. Exhaustive Type Checking
```typescript
default:
  checkExhaustive(action);
```

### 4. Provider Composition
Deep provider nesting in gemini.tsx with clear hierarchy.

### 5. Colocated Testing
Test files (`*.test.ts`, `*.test.tsx`) alongside source files.

### 6. Type-Safe Commands
Full TypeScript interfaces for command context, actions, and returns.

---

## 12. Recommendations for FloMaster CLI

### Directory Structure

```
packages/cli/src/
├── flo.tsx                     # Entry point
├── nonInteractive.ts           # Non-interactive mode
├── config/
│   ├── config.ts               # CLI config
│   ├── settings.ts             # User settings
│   ├── settingsSchema.ts       # Validation schemas
│   └── args.ts                 # Argument parsing
├── ui/
│   ├── App.tsx                 # Root component
│   ├── AppContainer.tsx        # State container
│   ├── contexts/
│   │   ├── UIStateContext.tsx  # Consolidated read state
│   │   ├── UIActionsContext.tsx # Consolidated actions
│   │   ├── ConfigContext.tsx
│   │   ├── SettingsContext.tsx
│   │   ├── KeypressContext.tsx
│   │   ├── ScrollProvider.tsx
│   │   └── SessionContext.tsx
│   ├── hooks/
│   │   ├── useKeypress.ts
│   │   ├── useHistoryManager.ts
│   │   ├── useSlashCommand.ts
│   │   ├── useCompletion.ts
│   │   └── useTerminal.ts
│   ├── components/
│   │   ├── shared/
│   │   ├── messages/
│   │   └── dialogs/
│   ├── layouts/
│   ├── commands/
│   │   ├── types.ts            # SlashCommand interface
│   │   └── [command].ts        # Individual commands
│   └── themes/
│       ├── theme.ts
│       ├── theme-manager.ts
│       └── semantic-tokens.ts
├── commands/                   # CLI subcommands
├── utils/
└── test-utils/
```

---

## Key Takeaways

1. **Strong Core/UI Separation** - Core logic is completely SDK-agnostic
2. **Consolidated State Management** - UIState/UIActions pattern over many contexts
3. **Feature-Based Hook Organization** - One hook per feature concern (~100 hooks)
4. **Extensible Command System** - SlashCommand interface with completion support
5. **Semantic Theming** - Token-based color system with 15+ built-in themes
6. **Dual-Mode Support** - Interactive (Ink) and non-interactive modes
7. **Colocated Testing** - Test files alongside source with comprehensive coverage
8. **Type-Safe Architecture** - Full TypeScript with exhaustive type checking
