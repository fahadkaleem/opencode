# Gemini CLI Ink UI Architecture Reference

> Comprehensive analysis of Google's Gemini CLI codebase architecture, patterns, and best practices.
> Use this as a reference when building the FloMaster Ink CLI.

---

## Table of Contents

1. [Coding Standards](#1-coding-standards)
2. [Package Architecture](#2-package-architecture)
3. [Component Design Patterns](#3-component-design-patterns)
4. [Component Internal Organization](#4-component-internal-organization)
5. [Layout Patterns](#5-layout-patterns)
6. [App Structure](#6-app-structure)
7. [Slash Commands System](#7-slash-commands-system)
8. [Settings & Dialogs](#8-settings--dialogs)
9. [Theming System](#9-theming-system)
10. [State Management](#10-state-management)
11. [Keyboard Handling](#11-keyboard-handling)
12. [Key Takeaways](#12-key-takeaways)

---

## 1. Coding Standards

### File Organization

```typescript
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// License header at top of EVERY file
```

- **TypeScript strict mode** throughout
- **ES Modules** with `.js` extensions in imports (Node.js ESM compatibility)
- **Named exports** preferred over default exports

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files | camelCase | `useGeminiStream.ts`, `AppContainer.tsx` |
| Components | PascalCase | `InputPrompt`, `DialogManager` |
| Hooks | useXxx | `useKeypress`, `useSlashCommandProcessor` |
| Types/Interfaces | PascalCase | `SlashCommand`, `UIState` |
| Enums | PascalCase | `StreamingState`, `AuthState` |
| Constants | UPPER_SNAKE_CASE | `MAX_GEMINI_MESSAGE_LINES`, `STREAM_DEBOUNCE_MS` |

### Import Order

```typescript
// 1. Type imports (type keyword)
import type { ReactNode } from 'react';
import type { Config } from '@google/gemini-cli-core';

// 2. React/Ink core
import { useState, useCallback, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';

// 3. External packages
import chalk from 'chalk';
import stringWidth from 'string-width';

// 4. Internal - core package
import { AuthType } from '@google/gemini-cli-core';

// 5. Internal - relative imports (organized by depth)
import { useUIState } from '../contexts/UIStateContext.js';
import { theme } from '../semantic-colors.js';
import type { SlashCommand } from './types.js';
```

---

## 2. Package Architecture

### Directory Structure

```
packages/cli/src/
├── gemini.tsx              # Entry point - bootstrapping and providers
├── ui/
│   ├── App.tsx             # Root component - layout switching
│   ├── AppContainer.tsx    # Central state container (1726 lines)
│   ├── layouts/            # Layout components
│   │   ├── DefaultAppLayout.tsx
│   │   └── ScreenReaderAppLayout.tsx
│   ├── components/         # UI components
│   │   ├── shared/         # Reusable primitives
│   │   │   ├── TextInput.tsx
│   │   │   ├── ScrollableList.tsx
│   │   │   ├── RadioButtonSelect.tsx
│   │   │   └── MaxSizedBox.tsx
│   │   ├── messages/       # Message display components
│   │   │   ├── UserMessage.tsx
│   │   │   ├── GeminiMessage.tsx
│   │   │   ├── ToolMessage.tsx
│   │   │   └── ErrorMessage.tsx
│   │   └── views/          # Full-screen views
│   │       ├── ChatList.tsx
│   │       └── ToolsList.tsx
│   ├── contexts/           # React Context providers
│   │   ├── UIStateContext.tsx
│   │   ├── UIActionsContext.tsx
│   │   ├── ConfigContext.tsx
│   │   ├── SettingsContext.tsx
│   │   ├── KeypressContext.tsx
│   │   └── MouseContext.tsx
│   ├── hooks/              # Custom hooks (50+ hooks!)
│   │   ├── useKeypress.ts
│   │   ├── useGeminiStream.ts
│   │   ├── useHistoryManager.ts
│   │   └── useSlashCommandProcessor.ts
│   ├── themes/             # Theming system
│   │   ├── theme-manager.ts
│   │   ├── semantic-tokens.ts
│   │   └── default.ts
│   ├── commands/           # Slash command definitions
│   │   ├── types.ts
│   │   ├── helpCommand.ts
│   │   └── settingsCommand.ts
│   ├── constants/          # Constants and static data
│   │   ├── tips.ts
│   │   └── wittyPhrases.ts
│   └── utils/              # Utilities
├── config/                 # Configuration management
├── services/               # Business logic services
└── utils/                  # General utilities
```

### Layer Hierarchy

```
gemini.tsx (Entry Point)
    ↓
Providers (Settings, Keypress, Mouse, Scroll, Session, VimMode)
    ↓
AppContainer (Central State Management)
    ↓
App (Layout Switcher)
    ↓
Layouts (DefaultAppLayout, ScreenReaderAppLayout)
    ↓
Components (MainContent, DialogManager, Composer)
```

---

## 3. Component Design Patterns

### Shared Primitives (`ui/components/shared/`)

These are reusable, stateless (or minimally stateful) components:

| Component | Purpose |
|-----------|---------|
| `TextInput` | Text input with cursor handling |
| `ScrollableList` | Scrollable list with keyboard navigation |
| `RadioButtonSelect` | Radio button group |
| `DescriptiveRadioButtonSelect` | Radio buttons with descriptions |
| `EnumSelector` | Enum value selection |
| `MaxSizedBox` | Size-constrained container |
| `Scrollable` | Generic scrollable container |
| `VirtualizedList` | Performance-optimized long list |

### TextInput Example (Clean Primitive)

```typescript
export interface TextInputProps {
  buffer: TextBuffer;
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  focus?: boolean;
}

export function TextInput({
  buffer,
  placeholder = '',
  onSubmit,
  onCancel,
  focus = true,
}: TextInputProps): React.JSX.Element {
  const { text, handleInput, visualCursor, viewportVisualLines } = buffer;
  
  const handleKeyPress = useCallback((key: Key) => {
    if (key.name === 'escape') {
      onCancel?.();
      return;
    }
    if (key.name === 'return') {
      onSubmit?.(text);
      return;
    }
    handleInput(key);
  }, [handleInput, onCancel, onSubmit, text]);

  useKeypress(handleKeyPress, { isActive: focus });

  // Render logic...
  return (
    <Box flexDirection="column">
      {viewportVisualLines.map((lineText, idx) => (
        <Box key={idx} height={1}>
          <Text>{lineDisplay}</Text>
        </Box>
      ))}
    </Box>
  );
}
```

---

## 4. Component Internal Organization

Every component follows this structure:

```typescript
/**
 * @license + SPDX header
 */

// 1. Type imports
import type { ... } from './types.js';

// 2. React/Ink imports
import { useState, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';

// 3. Context hooks
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';

// 4. Utility/theme imports
import { theme } from '../semantic-colors.js';

// 5. Props interface (exported for reuse)
export interface ComponentProps {
  buffer: TextBuffer;
  onSubmit: (value: string) => void;
  width?: number;
}

// 6. Helper functions (pure, before component)
const calculateWidths = (width: number) => {
  return { inputWidth: width - 4, containerWidth: width };
};

// 7. Component definition
export const Component: React.FC<ComponentProps> = (props) => {
  // 7a. Destructure props
  const { buffer, onSubmit, width = 80 } = props;
  
  // 7b. Context hooks
  const config = useConfig();
  const uiState = useUIState();
  
  // 7c. Local state (useState)
  const [isActive, setIsActive] = useState(false);
  
  // 7d. Derived values (useMemo)
  const derivedValue = useMemo(() => 
    calculateWidths(width), 
    [width]
  );
  
  // 7e. Callbacks (useCallback)
  const handleSubmit = useCallback(() => {
    onSubmit(buffer.text);
  }, [buffer.text, onSubmit]);
  
  // 7f. Effects (useEffect)
  useEffect(() => {
    // Side effects
  }, [deps]);
  
  // 7g. Early returns (guards)
  if (!isActive) return null;
  
  // 7h. Render
  return (
    <Box flexDirection="column">
      <Text color={theme.text.primary}>Content</Text>
    </Box>
  );
};
```

---

## 5. Layout Patterns

### Box-Based Layout (Ink's Flexbox)

```tsx
// Vertical column layout
<Box flexDirection="column" width={width}>
  <MainContent />
  <Box flexDirection="column" flexShrink={0} flexGrow={0}>
    <Notifications />
    <Composer />
  </Box>
</Box>

// Horizontal layout with space-between
<Box justifyContent="space-between" width="100%">
  <ContextSummaryDisplay />
  <AutoAcceptIndicator />
</Box>

// Responsive layout
<Box
  flexDirection={isNarrow ? 'column' : 'row'}
  alignItems={isNarrow ? 'flex-start' : 'center'}
>
  ...
</Box>
```

### Common Box Props

```tsx
<Box
  flexDirection="column"           // "column" | "row"
  width={width}                    // number | "100%"
  height={height}                  // number | undefined (auto)
  flexGrow={0}                     // 0 = don't grow
  flexShrink={0}                   // 0 = don't shrink
  overflow="hidden"                // Clip overflow
  paddingX={1}                     // Horizontal padding
  paddingY={0}                     // Vertical padding
  marginTop={1}                    // Top margin
  alignItems="center"              // Cross-axis: "flex-start" | "center" | "flex-end"
  justifyContent="space-between"   // Main-axis distribution
  borderStyle="round"              // "single" | "double" | "round" | "bold"
  borderColor={theme.border.focused}
  minHeight={3}                    // Minimum height
/>
```

### Bordered Input Box Pattern

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

## 6. App Structure

### Entry Point (gemini.tsx)

```tsx
// Provider composition pattern
const AppWrapper = () => {
  useKittyKeyboardProtocol(); // Terminal protocol hook
  
  return (
    <SettingsContext.Provider value={settings}>
      <KeypressProvider config={config}>
        <MouseProvider mouseEventsEnabled={mouseEnabled}>
          <ScrollProvider>
            <SessionStatsProvider>
              <VimModeProvider settings={settings}>
                <AppContainer
                  config={config}
                  version={version}
                  startupWarnings={warnings}
                />
              </VimModeProvider>
            </SessionStatsProvider>
          </ScrollProvider>
        </MouseProvider>
      </KeypressProvider>
    </SettingsContext.Provider>
  );
};

// Render with Ink
const instance = render(<AppWrapper />, {
  stdout: inkStdout,
  stderr: inkStderr,
  stdin: process.stdin,
  exitOnCtrlC: false,
  patchConsole: false,
  alternateBuffer: useAlternateBuffer,
});
```

### App Component (Layout Switcher)

```tsx
export const App = () => {
  const uiState = useUIState();
  const isScreenReaderEnabled = useIsScreenReaderEnabled();

  // Show quitting display during exit
  if (uiState.quittingMessages) {
    return <QuittingDisplay />;
  }

  // Switch between layouts based on accessibility
  return (
    <StreamingContext.Provider value={uiState.streamingState}>
      {isScreenReaderEnabled ? (
        <ScreenReaderAppLayout />
      ) : (
        <DefaultAppLayout />
      )}
    </StreamingContext.Provider>
  );
};
```

### DefaultAppLayout

```tsx
export const DefaultAppLayout: React.FC = () => {
  const uiState = useUIState();
  const isAlternateBuffer = useAlternateBuffer();

  return (
    <Box
      flexDirection="column"
      width={width}
      height={isAlternateBuffer ? terminalHeight - 1 : undefined}
      overflow="hidden"
    >
      {/* Scrollable chat history - grows/shrinks */}
      <MainContent />
      
      {/* Fixed bottom controls - never shrinks */}
      <Box flexDirection="column" flexShrink={0} flexGrow={0}>
        <Notifications />
        <CopyModeWarning />
        
        {/* Either dialog or input composer */}
        {uiState.dialogsVisible ? (
          <DialogManager />
        ) : (
          <Composer />
        )}
        
        <ExitWarning />
      </Box>
    </Box>
  );
};
```

### Composer (Input Area)

```tsx
export const Composer = () => {
  const config = useConfig();
  const uiState = useUIState();
  const uiActions = useUIActions();

  return (
    <Box flexDirection="column" width={uiState.mainAreaWidth}>
      {/* Loading indicator */}
      <LoadingIndicator thought={uiState.thought} />
      
      {/* Config initialization state */}
      <ConfigInitDisplay />
      
      {/* Queued messages display */}
      <QueuedMessageDisplay messageQueue={uiState.messageQueue} />
      
      {/* Todo tray */}
      <TodoTray />
      
      {/* Status bar with context info */}
      <Box marginTop={1} justifyContent="space-between" width="100%">
        <ContextSummaryDisplay />
        <AutoAcceptIndicator />
      </Box>
      
      {/* Debug console (conditional) */}
      {uiState.showErrorDetails && (
        <DetailedMessagesDisplay messages={uiState.consoleMessages} />
      )}
      
      {/* Main input prompt */}
      {uiState.isInputActive && (
        <InputPrompt
          buffer={uiState.buffer}
          onSubmit={uiActions.handleFinalSubmit}
          slashCommands={uiState.slashCommands}
          // ... more props
        />
      )}
      
      {/* Footer with keyboard shortcuts */}
      <Footer />
    </Box>
  );
};
```

---

## 7. Slash Commands System

### Command Interface

```typescript
export interface SlashCommand {
  name: string;              // Primary name (e.g., 'settings')
  altNames?: string[];       // Aliases (e.g., ['?'] for help)
  description: string;       // Help text shown in suggestions
  hidden?: boolean;          // Hide from autocomplete suggestions
  kind: CommandKind;         // BUILT_IN | FILE | MCP_PROMPT
  
  /**
   * If true, pressing Enter on suggestion executes immediately.
   * If false/undefined, Enter autocompletes to input.
   */
  autoExecute?: boolean;
  
  // Optional metadata for extension commands
  extensionName?: string;
  extensionId?: string;
  
  /**
   * The action to run. Optional for parent commands.
   */
  action?: (
    context: CommandContext,
    args: string,
  ) => SlashCommandActionReturn | Promise<SlashCommandActionReturn>;
  
  /**
   * Provides argument completion.
   */
  completion?: (
    context: CommandContext,
    partialArg: string,
  ) => string[] | Promise<string[]>;
  
  /**
   * Nested subcommands.
   */
  subCommands?: SlashCommand[];
}

export enum CommandKind {
  BUILT_IN = 'built-in',
  FILE = 'file',
  MCP_PROMPT = 'mcp-prompt',
}
```

### Command Action Return Types

```typescript
type SlashCommandActionReturn =
  // Success with history items to add
  | { type: 'success'; messages: HistoryItemWithoutId[] }
  
  // Quit the application
  | { type: 'quit'; messages: HistoryItem[] }
  
  // Open a built-in dialog
  | { type: 'dialog'; dialog: 'settings' | 'theme' | 'auth' | 'help' | ... }
  
  // Request shell command confirmation
  | { type: 'confirm_shell_commands'; commandsToConfirm: string[] }
  
  // Request generic confirmation
  | { type: 'confirm_action'; prompt: ReactNode }
  
  // Open custom dialog component
  | { type: 'custom_dialog'; component: ReactNode };
```

### CommandContext (Dependency Injection)

```typescript
interface CommandContext {
  // Invocation info
  invocation?: {
    raw: string;    // Full input string
    name: string;   // Matched command name
    args: string;   // Arguments after command
  };
  
  // Services
  services: {
    config: Config | null;
    settings: LoadedSettings;
    git: GitService | undefined;
    logger: Logger;
  };
  
  // UI actions
  ui: {
    addItem: (item: HistoryItemWithoutId, timestamp: number) => void;
    clear: () => void;
    setDebugMessage: (msg: string) => void;
    setPendingItem: (item: HistoryItemWithoutId | null) => void;
    loadHistory: (items: HistoryItem[]) => void;
    toggleCorgiMode: () => void;
    toggleVimEnabled: () => Promise<boolean>;
    reloadCommands: () => void;
    // ... more actions
  };
  
  // Session data
  session: {
    stats: SessionStatsState;
    sessionShellAllowlist: Set<string>;
  };
}
```

### Simple Command Example

```typescript
export const settingsCommand: SlashCommand = {
  name: 'settings',
  description: 'View and edit Gemini CLI settings',
  kind: CommandKind.BUILT_IN,
  autoExecute: true,
  action: (_context, _args): OpenDialogActionReturn => ({
    type: 'dialog',
    dialog: 'settings',
  }),
};
```

### Command with History Item

```typescript
export const helpCommand: SlashCommand = {
  name: 'help',
  altNames: ['?'],
  kind: CommandKind.BUILT_IN,
  description: 'For help on gemini-cli',
  autoExecute: true,
  action: async (context) => {
    const helpItem: Omit<HistoryItemHelp, 'id'> = {
      type: MessageType.HELP,
      timestamp: new Date(),
    };
    context.ui.addItem(helpItem, Date.now());
  },
};
```

### Command with Subcommands

```typescript
export const chatCommand: SlashCommand = {
  name: 'chat',
  description: 'Chat session operations',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'list',
      description: 'List all chat sessions',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        // List chats...
      },
    },
    {
      name: 'resume',
      description: 'Resume a previous chat',
      kind: CommandKind.BUILT_IN,
      completion: async (context, partial) => {
        // Return matching session names
        return ['session-1', 'session-2'];
      },
      action: async (context, args) => {
        // Resume specific chat...
      },
    },
  ],
};
```

---

## 8. Settings & Dialogs

### DialogManager Pattern

The `DialogManager` component routes to dialogs based on state flags:

```tsx
export const DialogManager = ({ addItem, terminalWidth }: DialogManagerProps) => {
  const uiState = useUIState();
  const uiActions = useUIActions();

  // Priority-based rendering (first match wins)
  
  if (uiState.showIdeRestartPrompt) {
    return <IdeTrustChangeDialog reason={uiState.ideTrustRestartReason} />;
  }
  
  if (uiState.proQuotaRequest) {
    return (
      <ProQuotaDialog
        onChoice={uiActions.handleProQuotaChoice}
        // ... props
      />
    );
  }
  
  if (uiState.isThemeDialogOpen) {
    return (
      <Box flexDirection="column">
        {uiState.themeError && (
          <Box marginBottom={1}>
            <Text color={theme.status.error}>{uiState.themeError}</Text>
          </Box>
        )}
        <ThemeDialog
          onSelect={uiActions.handleThemeSelect}
          onCancel={uiActions.closeThemeDialog}
          settings={settings}
        />
      </Box>
    );
  }
  
  if (uiState.isSettingsDialogOpen) {
    return (
      <SettingsDialog
        settings={settings}
        onSelect={() => uiActions.closeSettingsDialog()}
        // ... props
      />
    );
  }
  
  // ... more dialogs
  
  return null;
};
```

### Dialog Component Pattern

```tsx
interface ThemeDialogProps {
  onSelect: (themeName: string) => void;
  onCancel: () => void;
  onHighlight: (themeName: string) => void;
  settings: LoadedSettings;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

export const ThemeDialog: React.FC<ThemeDialogProps> = ({
  onSelect,
  onCancel,
  onHighlight,
  settings,
  availableTerminalHeight,
  terminalWidth,
}) => {
  const themes = themeManager.getAvailableThemes();
  const currentTheme = settings.merged.ui?.theme;
  
  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Box marginBottom={1}>
        <Text bold>Select Theme</Text>
      </Box>
      
      <ScrollableList
        items={themes}
        selectedIndex={themes.findIndex(t => t.name === currentTheme)}
        onSelect={(theme) => onSelect(theme.name)}
        onHighlight={(theme) => onHighlight(theme.name)}
        onCancel={onCancel}
        maxHeight={availableTerminalHeight}
        renderItem={(theme, isSelected) => (
          <Text color={isSelected ? theme.text.accent : theme.text.primary}>
            {isSelected ? '> ' : '  '}{theme.name}
          </Text>
        )}
      />
    </Box>
  );
};
```

---

## 9. Theming System

### Semantic Colors Architecture

```typescript
// semantic-tokens.ts
export interface SemanticColors {
  text: {
    primary: string;    // Main text color
    secondary: string;  // Muted/dimmed text
    link: string;       // Links and interactive text
    accent: string;     // Highlighted/emphasized text
    response: string;   // AI response text
  };
  background: {
    primary: string;    // Main background
    diff: {
      added: string;    // Diff added lines
      removed: string;  // Diff removed lines
    };
  };
  border: {
    default: string;    // Unfocused borders
    focused: string;    // Focused element borders
  };
  ui: {
    comment: string;    // Code comments
    symbol: string;     // UI symbols/icons
    dark: string;       // Dark UI elements
    gradient: string[] | undefined;  // Gradient colors
  };
  status: {
    error: string;      // Error states
    success: string;    // Success states
    warning: string;    // Warning states
  };
}
```

### Theme Proxy Pattern

```typescript
// semantic-colors.ts - Dynamic theme access
import { themeManager } from './themes/theme-manager.js';

export const theme: SemanticColors = {
  get text() { return themeManager.getSemanticColors().text; },
  get background() { return themeManager.getSemanticColors().background; },
  get border() { return themeManager.getSemanticColors().border; },
  get ui() { return themeManager.getSemanticColors().ui; },
  get status() { return themeManager.getSemanticColors().status; },
};
```

### Usage in Components

```tsx
import { theme } from '../semantic-colors.js';

// Text colors
<Text color={theme.text.primary}>Primary text</Text>
<Text color={theme.text.secondary}>Muted text</Text>
<Text color={theme.text.accent}>Highlighted text</Text>

// Status colors
<Text color={theme.status.error}>Error message</Text>
<Text color={theme.status.success}>Success!</Text>
<Text color={theme.status.warning}>Warning</Text>

// Border colors
<Box borderColor={theme.border.default}>Unfocused</Box>
<Box borderColor={theme.border.focused}>Focused</Box>
```

### ThemeManager (Singleton)

```typescript
class ThemeManager {
  private availableThemes: Theme[];
  private activeTheme: Theme;
  private customThemes: Map<string, Theme>;
  
  setActiveTheme(name: string): boolean;
  getActiveTheme(): Theme;
  getSemanticColors(): SemanticColors;
  getAvailableThemes(): ThemeDisplay[];
  loadCustomThemes(config?: Record<string, CustomTheme>): void;
  isCustomTheme(name: string): boolean;
}

export const themeManager = new ThemeManager();
```

### Built-in Themes

| Theme | Type | Description |
|-------|------|-------------|
| `DefaultDark` | dark | Default dark theme (Catppuccin-inspired) |
| `DefaultLight` | light | Light theme |
| `AyuDark` | dark | Ayu dark |
| `AyuLight` | light | Ayu light |
| `AtomOneDark` | dark | Atom One Dark |
| `Dracula` | dark | Dracula |
| `GitHubDark` | dark | GitHub Dark |
| `GitHubLight` | light | GitHub Light |
| `ANSI` | ansi | ANSI 16-color (terminal default) |
| `ANSILight` | ansi | ANSI light variant |

---

## 10. State Management

### Centralized State in AppContainer

All UI state lives in `AppContainer.tsx` which creates two contexts:

```typescript
// UIState - All readable state (70+ properties)
interface UIState {
  // History
  history: HistoryItem[];
  historyManager: UseHistoryManagerReturn;
  
  // Dialog states
  isThemeDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isModelDialogOpen: boolean;
  isAuthDialogOpen: boolean;
  isAuthenticating: boolean;
  // ... more dialog flags
  
  // Streaming state
  streamingState: StreamingState;
  thought: ThoughtSummary | undefined;
  pendingHistoryItems: HistoryItemWithoutId[];
  
  // Terminal dimensions
  terminalWidth: number;
  terminalHeight: number;
  mainAreaWidth: number;
  availableTerminalHeight: number;
  
  // Input state
  buffer: TextBuffer;
  inputWidth: number;
  suggestionsWidth: number;
  isInputActive: boolean;
  
  // Commands
  slashCommands: SlashCommand[];
  commandContext: CommandContext;
  
  // Feature flags
  shellModeActive: boolean;
  copyModeEnabled: boolean;
  renderMarkdown: boolean;
  constrainHeight: boolean;
  showErrorDetails: boolean;
  
  // ... 40+ more properties
}

// UIActions - All action handlers
interface UIActions {
  // Dialog actions
  handleThemeSelect: (name: string) => void;
  closeThemeDialog: () => void;
  closeSettingsDialog: () => void;
  openPermissionsDialog: (props?: {...}) => void;
  
  // Input actions
  handleFinalSubmit: (value: string) => void;
  handleClearScreen: () => void;
  setShellModeActive: (active: boolean) => void;
  
  // Auth actions
  handleAuthSelect: (type: AuthType, scope: LoadableSettingScope) => Promise<void>;
  setAuthState: (state: AuthState) => void;
  onAuthError: (error: string | null) => void;
  
  // ... more actions
}
```

### Provider Composition

```tsx
<UIStateContext.Provider value={uiState}>
  <UIActionsContext.Provider value={uiActions}>
    <ConfigContext.Provider value={config}>
      <AppContext.Provider value={{ version, startupWarnings }}>
        <ShellFocusContext.Provider value={isFocused}>
          <App />
        </ShellFocusContext.Provider>
      </AppContext.Provider>
    </ConfigContext.Provider>
  </UIActionsContext.Provider>
</UIStateContext.Provider>
```

### Context Usage

```tsx
// In any component
const uiState = useUIState();
const uiActions = useUIActions();
const config = useConfig();
const settings = useSettings();

// Access state
if (uiState.isThemeDialogOpen) { ... }
const width = uiState.terminalWidth;

// Call actions
uiActions.handleFinalSubmit(input);
uiActions.closeSettingsDialog();
```

---

## 11. Keyboard Handling

### useKeypress Hook

```typescript
interface Key {
  name: string;           // 'return', 'escape', 'up', 'a', etc.
  sequence: string;       // Raw character sequence
  ctrl: boolean;          // Ctrl modifier
  shift: boolean;         // Shift modifier
  meta: boolean;          // Meta/Cmd modifier
  paste?: boolean;        // Is this a paste event
}

interface UseKeypressOptions {
  isActive: boolean;      // Enable/disable handler
}

function useKeypress(
  handler: (key: Key) => void,
  options: UseKeypressOptions
): void;
```

### Usage

```tsx
const handleInput = useCallback((key: Key) => {
  if (key.name === 'escape') {
    onCancel?.();
    return;
  }
  if (key.name === 'return') {
    onSubmit?.(buffer.text);
    return;
  }
  if (key.ctrl && key.name === 'c') {
    // Handle Ctrl+C
    return;
  }
  // Default handling
  buffer.handleInput(key);
}, [buffer, onCancel, onSubmit]);

useKeypress(handleInput, { isActive: focus });
```

### Key Matchers Pattern

```typescript
// keyMatchers.ts
export enum Command {
  QUIT = 'quit',
  ESCAPE = 'escape',
  SUBMIT = 'submit',
  NAVIGATION_UP = 'navigation_up',
  NAVIGATION_DOWN = 'navigation_down',
  CLEAR_SCREEN = 'clear_screen',
  PASTE_CLIPBOARD = 'paste_clipboard',
  // ... more commands
}

// Key binding configuration
const defaultKeyBindings: KeyBindingConfig = {
  [Command.QUIT]: [{ key: 'c', ctrl: true }],
  [Command.ESCAPE]: [{ key: 'escape' }],
  [Command.SUBMIT]: [{ key: 'return', ctrl: false }],
  [Command.NAVIGATION_UP]: [{ key: 'up' }],
  [Command.CLEAR_SCREEN]: [{ key: 'l', ctrl: true }],
  // ...
};

// Usage
if (keyMatchers[Command.QUIT](key)) {
  cancelOngoingRequest?.();
  setCtrlCPressCount((prev) => prev + 1);
  return;
}
```

---

## 12. Key Takeaways

### Architecture Patterns

1. **Centralized State Container**
   - Single `AppContainer` component manages ALL state
   - State exposed via `UIStateContext` (read) and `UIActionsContext` (write)
   - No Redux, just React Context + hooks

2. **Hook-First Architecture**
   - All business logic extracted into custom hooks
   - 50+ hooks for different concerns
   - Hooks are the primary unit of reusable logic

3. **Provider Composition**
   - Multiple nested providers for different concerns
   - Order matters: Keyboard → Mouse → Scroll → Session → UI

4. **Command Pattern**
   - Structured `SlashCommand` interface
   - Action returns dictate behavior (dialog, quit, success)
   - Dependency injection via `CommandContext`

### Component Patterns

1. **Shared Primitives**
   - Small, focused, reusable components in `shared/`
   - Props-driven, minimal internal state
   - Well-typed interfaces exported

2. **Dialog Management**
   - Single `DialogManager` routes all dialogs
   - Priority-based rendering (first match wins)
   - Clean separation between trigger and render

3. **Layout Composition**
   - Flexbox-based layouts via Ink's `Box`
   - Fixed bottom controls, scrollable main content
   - Conditional rendering for different states

### Theming

1. **Semantic Token System**
   - Colors organized by purpose, not palette
   - `theme.text.primary`, `theme.status.error`, etc.
   - Proxy pattern for dynamic theme access

2. **Multiple Theme Support**
   - Built-in themes + custom themes
   - Theme switching without restart
   - ANSI fallback for limited terminals

### Best Practices

1. **Always use semantic colors** - Never hardcode hex values
2. **Extract logic to hooks** - Components should be thin
3. **Type everything** - Discriminated unions for history/messages
4. **Separate concerns** - Keyboard handling in dedicated hook
5. **Priority-based dialogs** - Clear ordering prevents conflicts

---

## Appendix: File Quick Reference

| File | Purpose |
|------|---------|
| `gemini.tsx` | Entry point, provider setup |
| `ui/App.tsx` | Layout switcher |
| `ui/AppContainer.tsx` | Central state container |
| `ui/layouts/DefaultAppLayout.tsx` | Main layout structure |
| `ui/components/Composer.tsx` | Input area composition |
| `ui/components/DialogManager.tsx` | Dialog routing |
| `ui/components/InputPrompt.tsx` | Text input with completions |
| `ui/components/shared/TextInput.tsx` | Basic text input primitive |
| `ui/contexts/UIStateContext.tsx` | UI state context |
| `ui/contexts/UIActionsContext.tsx` | UI actions context |
| `ui/hooks/useKeypress.ts` | Keyboard handling |
| `ui/hooks/useGeminiStream.ts` | Streaming API integration |
| `ui/commands/types.ts` | Slash command types |
| `ui/themes/theme-manager.ts` | Theme management |
| `ui/semantic-colors.ts` | Theme proxy accessor |
| `ui/keyMatchers.ts` | Key binding matchers |
| `ui/types.ts` | Core type definitions |
| `ui/constants.ts` | UI constants |

---

*Last Updated: December 31, 2024*
