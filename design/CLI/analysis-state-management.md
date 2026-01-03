# Gemini CLI State Management Analysis

> SDK-Agnostic state management patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI implements a sophisticated state management architecture:

1. **Centralized State Container** - Single source of truth in `AppContainer` (lines 165-1725)
2. **UIState/UIActions Split** - Separate contexts for reads vs. mutations (referential stability)
3. **Discriminated Union Types** - Strongly-typed history items with 20+ message types
4. **Reducer Pattern** - For complex state like extensions and text buffer
5. **Session-Scoped Statistics** - Dedicated provider for metrics with event subscriptions
6. **TextBuffer State Machine** - Complex reducer with 50+ action types and visual layout

---

## 1. Centralized State Architecture

**File**: `packages/cli/src/ui/AppContainer.tsx` (lines 165-1725)

### State Organization (100+ useState calls)

The AppContainer manages approximately 100+ pieces of state through useState, organized by domain:

```typescript
// Dialog State (lines 178-240)
const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(false);
const [isPermissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
const [customDialog, setCustomDialog] = useState<React.ReactNode | null>(null);
const [permissionsDialogProps, setPermissionsDialogProps] = useState<{
  targetDirectory?: string;
} | null>(null);

// UI Mode State (lines 173-191)
const [corgiMode, setCorgiMode] = useState(false);
const [copyModeEnabled, setCopyModeEnabled] = useState(false);
const [shellModeActive, setShellModeActive] = useState(false);
const [embeddedShellFocused, setEmbeddedShellFocused] = useState(false);

// Input/History State (lines 167-170)
const historyManager = useHistory({
  chatRecordingService: config.getGeminiClient()?.getChatRecordingService(),
});
const buffer = useTextBuffer({ /* config */ });

// Display State (lines 999-1007)
const [showErrorDetails, setShowErrorDetails] = useState<boolean>(false);
const [showFullTodos, setShowFullTodos] = useState<boolean>(false);
const [renderMarkdown, setRenderMarkdown] = useState<boolean>(true);
const [constrainHeight, setConstrainHeight] = useState<boolean>(true);

// Model/Auth State (lines 266-270)
const [currentModel, setCurrentModel] = useState(getEffectiveModel());
const [userTier, setUserTier] = useState<UserTierId | undefined>(undefined);
const [isConfigInitialized, setConfigInitialized] = useState(false);

// Terminal State (lines 1003-1013)
const [ctrlCPressCount, setCtrlCPressCount] = useState(0);
const [ctrlDPressCount, setCtrlDPressCount] = useState(0);
const [showEscapePrompt, setShowEscapePrompt] = useState(false);
const [warningMessage, setWarningMessage] = useState<string | null>(null);
```

### useState vs useReducer Decision Matrix

**useState** used for:
- Simple boolean toggles (dialogs, modes)
- Single primitive values (counts, strings)
- State that changes independently
- Ephemeral UI state (warnings, errors)

**useReducer** used for:
- Complex state with multiple related values (TextBuffer - 50+ actions)
- State requiring action-based updates (Extensions - 7 action types)
- State needing undo/redo capability (TextBuffer)
- State with complex update logic (batch operations)

---

## 2. UIState/UIActions Pattern

### Why Separate State from Actions?

The key insight is **referential stability**:
- `UIStateContext` - Read-only state object (recreated on every state change)
- `UIActionsContext` - Stable callback references (created once with useCallback)

This prevents unnecessary re-renders when components only use actions, not state.

### UIState Interface

**File**: `packages/cli/src/ui/contexts/UIStateContext.tsx` (lines 44-139)

```typescript
export interface UIState {
  // History (lines 45-46)
  history: HistoryItem[];
  historyManager: UseHistoryManagerReturn;

  // Dialog states (lines 47-65)
  isThemeDialogOpen: boolean;
  isAuthDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isSessionBrowserOpen: boolean;
  isModelDialogOpen: boolean;
  isPermissionsDialogOpen: boolean;
  isAuthenticating: boolean;
  isAwaitingApiKeyInput: boolean;
  isEditorDialogOpen: boolean;

  // Streaming/processing (lines 74-77)
  streamingState: StreamingState;
  pendingHistoryItems: HistoryItemWithoutId[];
  pendingSlashCommandHistoryItems: HistoryItemWithoutId[];
  pendingGeminiHistoryItems: HistoryItemWithoutId[];

  // Terminal/layout (lines 115-118)
  terminalWidth: number;
  terminalHeight: number;
  availableTerminalHeight: number | undefined;
  mainAreaWidth: number;

  // Input state (lines 78-84)
  buffer: TextBuffer;
  inputWidth: number;
  suggestionsWidth: number;
  isInputActive: boolean;
  userMessages: string[];

  // Session stats (line 115)
  sessionStats: SessionStatsState;

  // ... 60+ more properties spanning lines 44-139
}
```

### UIActions Interface

**File**: `packages/cli/src/ui/contexts/UIActionsContext.tsx` (lines 17-59)

```typescript
export interface UIActions {
  // Theme actions (lines 18-20)
  handleThemeSelect: (themeName: string, scope: LoadableSettingScope) => void;
  closeThemeDialog: () => void;
  handleThemeHighlight: (themeName: string | undefined) => void;

  // Auth actions (lines 21-26)
  handleAuthSelect: (authType: AuthType | undefined, scope: LoadableSettingScope) => void;
  setAuthState: (state: AuthState) => void;
  onAuthError: (error: string | null) => void;
  handleApiKeySubmit: (apiKey: string) => Promise<void>;
  handleApiKeyCancel: () => void;

  // Input actions (lines 44-45)
  handleFinalSubmit: (value: string) => void;
  handleClearScreen: () => void;

  // Session actions (lines 49-52)
  openSessionBrowser: () => void;
  closeSessionBrowser: () => void;
  handleResumeSession: (session: SessionInfo) => Promise<void>;
  handleDeleteSession: (session: SessionInfo) => Promise<void>;

  // UI control actions (lines 37-43)
  setShellModeActive: (value: boolean) => void;
  vimHandleInput: (key: Key) => boolean;
  setConstrainHeight: (value: boolean) => void;
  refreshStatic: () => void;
  setBannerVisible: (visible: boolean) => void;
  setEmbeddedShellFocused: (value: boolean) => void;
}
```

### Provider Composition Pattern

**File**: `packages/cli/src/ui/AppContainer.tsx` (lines 1707-1724)

```typescript
return (
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
);
```

### Context Memoization Pattern

**File**: `packages/cli/src/ui/AppContainer.tsx` (lines 1443-1627, 1634-1705)

```typescript
// Build state object - recreated when values change (lines 1443-1627)
const uiState: UIState = useMemo(
  () => ({
    history: historyManager.history,
    historyManager,
    isThemeDialogOpen,
    streamingState,
    buffer,
    // ... 100+ properties
  }),
  [/* 80+ dependencies */]
);

// Build actions object - stable references (lines 1634-1705)
const uiActions: UIActions = useMemo(
  () => ({
    handleThemeSelect,
    closeThemeDialog,
    handleFinalSubmit,
    refreshStatic,
    // ... 25+ action callbacks
  }),
  [/* callback dependencies - rarely change */]
);
```

---

## 3. All Context Providers

The application uses 8 context providers, each with a specific responsibility:

| Context | File | Purpose | Provider Location |
|---------|------|---------|-------------------|
| UIStateContext | `contexts/UIStateContext.tsx` | Read-only UI state | AppContainer |
| UIActionsContext | `contexts/UIActionsContext.tsx` | Stable action callbacks | AppContainer |
| ConfigContext | `contexts/ConfigContext.tsx` | Core configuration object | AppContainer |
| AppContext | `contexts/AppContext.tsx` | App version, warnings | AppContainer |
| SettingsContext | `contexts/SettingsContext.tsx` | User settings | Higher-level provider |
| SessionStatsContext | `contexts/SessionContext.tsx` | Telemetry/metrics | SessionStatsProvider |
| ShellFocusContext | `contexts/ShellFocusContext.tsx` | Focus state for shell | AppContainer |
| VimModeContext | `contexts/VimModeContext.tsx` | Vim mode toggle | Higher-level provider |

---

## 4. History Management

**File**: `packages/cli/src/ui/hooks/useHistoryManager.ts` (lines 1-165)

### Discriminated Union Types

**File**: `packages/cli/src/ui/types.ts` (lines 90-283)

The history system uses 20+ message types via discriminated unions:

```typescript
// Base type (line 90-92)
export interface HistoryItemBase {
  text?: string;
}

// User messages (lines 94-97)
export type HistoryItemUser = HistoryItemBase & {
  type: 'user';
  text: string;
};

// AI responses (lines 99-102)
export type HistoryItemGemini = HistoryItemBase & {
  type: 'gemini';
  text: string;
};

// Tool group with nested tool calls (lines 167-170)
export type HistoryItemToolGroup = HistoryItemBase & {
  type: 'tool_group';
  tools: IndividualToolCallDisplay[];
};

// System messages (lines 109-125)
export type HistoryItemInfo = HistoryItemBase & {
  type: 'info';
  text: string;
  icon?: string;
  color?: string;
};

export type HistoryItemError = HistoryItemBase & {
  type: 'error';
  text: string;
};

export type HistoryItemWarning = HistoryItemBase & {
  type: 'warning';
  text: string;
};

// Specialized displays (lines 127-280)
export type HistoryItemAbout = HistoryItemBase & { type: 'about'; /* ... */ };
export type HistoryItemHelp = HistoryItemBase & { type: 'help'; /* ... */ };
export type HistoryItemStats = HistoryItemBase & { type: 'stats'; /* ... */ };
export type HistoryItemCompression = HistoryItemBase & { type: 'compression'; /* ... */ };
export type HistoryItemExtensionsList = HistoryItemBase & { type: 'extensions_list'; /* ... */ };
export type HistoryItemMcpStatus = HistoryItemBase & { type: 'mcp_status'; /* ... */ };
export type HistoryItemHooksList = HistoryItemBase & { type: 'hooks_list'; /* ... */ };

// Union enables exhaustive type checking (lines 259-280)
export type HistoryItemWithoutId =
  | HistoryItemUser
  | HistoryItemUserShell
  | HistoryItemGemini
  | HistoryItemGeminiContent
  | HistoryItemInfo
  | HistoryItemError
  | HistoryItemWarning
  | HistoryItemAbout
  | HistoryItemHelp
  | HistoryItemToolGroup
  | HistoryItemStats
  | HistoryItemModelStats
  | HistoryItemToolStats
  | HistoryItemModel
  | HistoryItemQuit
  | HistoryItemCompression
  | HistoryItemExtensionsList
  | HistoryItemToolsList
  | HistoryItemMcpStatus
  | HistoryItemChatList
  | HistoryItemHooksList;

export type HistoryItem = HistoryItemWithoutId & { id: number };
```

### useHistory Hook Implementation

**File**: `packages/cli/src/ui/hooks/useHistoryManager.ts` (lines 37-165)

```typescript
export interface UseHistoryManagerReturn {
  history: HistoryItem[];
  addItem: (itemData: Omit<HistoryItem, 'id'>, baseTimestamp: number, isResuming?: boolean) => number;
  updateItem: (id: number, updates: Partial<Omit<HistoryItem, 'id'>> | HistoryItemUpdater) => void;
  clearItems: () => void;
  loadHistory: (newHistory: HistoryItem[]) => void;
}

export function useHistory({
  chatRecordingService,
}: { chatRecordingService?: ChatRecordingService | null } = {}): UseHistoryManagerReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const messageIdCounterRef = useRef(0);

  // ID generation with timestamp-based uniqueness (lines 46-49)
  const getNextMessageId = useCallback((baseTimestamp: number): number => {
    messageIdCounterRef.current += 1;
    return baseTimestamp + messageIdCounterRef.current;
  }, []);

  // Add with duplicate detection (lines 56-120)
  const addItem = useCallback(
    (itemData: Omit<HistoryItem, 'id'>, baseTimestamp: number, isResuming: boolean = false): number => {
      const id = getNextMessageId(baseTimestamp);
      const newItem: HistoryItem = { ...itemData, id } as HistoryItem;

      setHistory((prevHistory) => {
        if (prevHistory.length > 0) {
          const lastItem = prevHistory[prevHistory.length - 1];
          // Prevent duplicate consecutive user messages
          if (lastItem.type === 'user' && newItem.type === 'user' &&
              lastItem.text === newItem.text) {
            return prevHistory;
          }
        }
        return [...prevHistory, newItem];
      });

      // Recording logic for different message types...
      return id;
    },
    [getNextMessageId, chatRecordingService],
  );

  // Deprecated update method with warning (lines 127-147)
  /**
   * @deprecated Prefer not to update history item directly as we are currently
   * rendering all history items in <Static /> for performance reasons.
   */
  const updateItem = useCallback(
    (id: number, updates: Partial<Omit<HistoryItem, 'id'>> | HistoryItemUpdater) => {
      setHistory((prevHistory) =>
        prevHistory.map((item) => {
          if (item.id === id) {
            const newUpdates = typeof updates === 'function' ? updates(item) : updates;
            return { ...item, ...newUpdates } as HistoryItem;
          }
          return item;
        }),
      );
    },
    [],
  );

  return useMemo(() => ({ history, addItem, updateItem, clearItems, loadHistory }),
    [history, addItem, updateItem, clearItems, loadHistory]);
}
```

---

## 5. Reducer Patterns

### Extension Updates Reducer

**File**: `packages/cli/src/ui/state/extensions.ts` (lines 1-146)

```typescript
// State enum (lines 10-20)
export enum ExtensionUpdateState {
  CHECKING_FOR_UPDATES = 'checking for updates',
  UPDATED_NEEDS_RESTART = 'updated, needs restart',
  UPDATED = 'updated',
  UPDATING = 'updating',
  UPDATE_AVAILABLE = 'update available',
  UP_TO_DATE = 'up to date',
  ERROR = 'error',
  NOT_UPDATABLE = 'not updatable',
  UNKNOWN = 'unknown',
}

// State shape (lines 27-32)
export interface ExtensionUpdatesState {
  extensionStatuses: Map<string, ExtensionUpdateStatus>;
  batchChecksInProgress: number;
  scheduledUpdate: ScheduledUpdate | null;
}

// Action types with discriminated unions (lines 54-67)
export type ExtensionUpdateAction =
  | { type: 'SET_STATE'; payload: { name: string; state: ExtensionUpdateState } }
  | { type: 'SET_NOTIFIED'; payload: { name: string; notified: boolean } }
  | { type: 'BATCH_CHECK_START' }
  | { type: 'BATCH_CHECK_END' }
  | { type: 'SCHEDULE_UPDATE'; payload: ScheduleUpdateArgs }
  | { type: 'CLEAR_SCHEDULED_UPDATE' }
  | { type: 'RESTARTED'; payload: { name: string } };
```

### Reducer with Exhaustive Checking

**File**: `packages/cli/src/ui/state/extensions.ts` (lines 69-146)

```typescript
import { checkExhaustive } from '../../utils/checks.js';

export function extensionUpdatesReducer(
  state: ExtensionUpdatesState,
  action: ExtensionUpdateAction,
): ExtensionUpdatesState {
  switch (action.type) {
    case 'SET_STATE': {
      // Optimization: skip update if state unchanged
      const existing = state.extensionStatuses.get(action.payload.name);
      if (existing?.status === action.payload.state) return state;

      // Immutable Map update
      const newStatuses = new Map(state.extensionStatuses);
      newStatuses.set(action.payload.name, {
        status: action.payload.state,
        notified: false,
      });
      return { ...state, extensionStatuses: newStatuses };
    }

    case 'BATCH_CHECK_START':
      return { ...state, batchChecksInProgress: state.batchChecksInProgress + 1 };

    case 'BATCH_CHECK_END':
      return { ...state, batchChecksInProgress: state.batchChecksInProgress - 1 };

    case 'SCHEDULE_UPDATE':
      // Merge with existing scheduled update
      return {
        ...state,
        scheduledUpdate: {
          all: state.scheduledUpdate?.all || action.payload.all,
          names: [...(state.scheduledUpdate?.names ?? []), ...(action.payload.names ?? [])],
          onCompleteCallbacks: [
            ...(state.scheduledUpdate?.onCompleteCallbacks ?? []),
            action.payload.onComplete,
          ],
        },
      };

    // ... other cases

    default:
      checkExhaustive(action);  // TypeScript exhaustive check
  }
}
```

### checkExhaustive Helper

**File**: `packages/cli/src/utils/checks.ts` (lines 1-28)

```typescript
/* Fail to compile on unexpected values (silent version). */
export function assumeExhaustive(_value: never): void {}

/**
 * Throws an exception on unexpected values.
 * Used in switch statement default cases for runtime safety.
 */
export function checkExhaustive(
  value: never,
  msg = `unexpected value ${value}!`,
): never {
  assumeExhaustive(value);
  throw new Error(msg);
}
```

---

## 6. TextBuffer State Machine

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 1-2469)

### State Definition

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 889-901)

```typescript
export interface TextBufferState {
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  preferredCol: number | null;  // For vertical navigation
  undoStack: UndoHistoryEntry[];
  redoStack: UndoHistoryEntry[];
  clipboard: string | null;
  selectionAnchor: [number, number] | null;
  viewportWidth: number;
  viewportHeight: number;
  visualLayout: VisualLayout;
}
```

### Action Types (50+ actions)

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 918-991)

```typescript
export type TextBufferAction =
  // Basic text operations
  | { type: 'set_text'; payload: string; pushToUndo?: boolean }
  | { type: 'insert'; payload: string }
  | { type: 'backspace' }
  | { type: 'delete' }

  // Navigation
  | { type: 'move'; payload: { dir: Direction } }
  | { type: 'set_cursor'; payload: { cursorRow: number; cursorCol: number; preferredCol: number | null } }
  | { type: 'move_to_offset'; payload: { offset: number } }

  // Word operations
  | { type: 'delete_word_left' }
  | { type: 'delete_word_right' }
  | { type: 'kill_line_right' }
  | { type: 'kill_line_left' }

  // Undo/Redo
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'create_undo_snapshot' }

  // Range operations
  | { type: 'replace_range'; payload: { startRow, startCol, endRow, endCol, text } }
  | { type: 'set_viewport'; payload: { width: number; height: number } }

  // Vim operations (30+ action types)
  | { type: 'vim_delete_word_forward'; payload: { count: number } }
  | { type: 'vim_delete_word_backward'; payload: { count: number } }
  | { type: 'vim_change_word_forward'; payload: { count: number } }
  | { type: 'vim_delete_line'; payload: { count: number } }
  | { type: 'vim_change_line'; payload: { count: number } }
  | { type: 'vim_delete_to_end_of_line' }
  | { type: 'vim_change_to_end_of_line' }
  | { type: 'vim_move_left'; payload: { count: number } }
  | { type: 'vim_move_right'; payload: { count: number } }
  | { type: 'vim_move_up'; payload: { count: number } }
  | { type: 'vim_move_down'; payload: { count: number } }
  | { type: 'vim_insert_at_cursor' }
  | { type: 'vim_append_at_cursor' }
  | { type: 'vim_open_line_below' }
  | { type: 'vim_open_line_above' }
  | { type: 'vim_move_to_line_start' }
  | { type: 'vim_move_to_line_end' }
  | { type: 'vim_move_to_first_line' }
  | { type: 'vim_move_to_last_line' }
  | { type: 'vim_escape_insert_mode' };
  // ... and more
```

### Undo/Redo Pattern

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 903-916)

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
    newStack.shift();  // Sliding window for memory efficiency
  }
  return { ...currentState, undoStack: newStack, redoStack: [] };  // Clear redo on new action
};
```

### Visual Layout Calculation

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 673-833)

The TextBuffer includes sophisticated word-wrapping with bidirectional mapping:

```typescript
export interface VisualLayout {
  visualLines: string[];
  // For each logical line, an array of [visualLineIndex, startColInLogical]
  logicalToVisualMap: Array<Array<[number, number]>>;
  // For each visual line, its [logicalLineIndex, startColInLogical]
  visualToLogicalMap: Array<[number, number]>;
}

function calculateLayout(logicalLines: string[], viewportWidth: number): VisualLayout {
  // Word-wrap with character width awareness (CJK, emoji support)
  // Returns bidirectional mapping for cursor conversion
}
```

### Reducer with Layout Recalculation

**File**: `packages/cli/src/ui/components/shared/text-buffer.ts` (lines 1539-1557)

```typescript
export function textBufferReducer(
  state: TextBufferState,
  action: TextBufferAction,
  options: TextBufferOptions = {},
): TextBufferState {
  const newState = textBufferReducerLogic(state, action, options);

  // Recalculate visual layout only when needed
  if (newState.lines !== state.lines || newState.viewportWidth !== state.viewportWidth) {
    return {
      ...newState,
      visualLayout: calculateLayout(newState.lines, newState.viewportWidth),
    };
  }

  return newState;
}
```

---

## 7. Session Statistics with Event Subscription

**File**: `packages/cli/src/ui/contexts/SessionContext.tsx` (lines 1-268)

### State Shape

```typescript
export interface SessionStatsState {
  sessionId: string;
  sessionStartTime: Date;
  metrics: SessionMetrics;
  lastPromptTokenCount: number;
  promptCount: number;
}
```

### Event-Based Updates Pattern

```typescript
export const SessionStatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<SessionStatsState>({
    sessionId,
    sessionStartTime: new Date(),
    metrics: uiTelemetryService.getMetrics(),
    lastPromptTokenCount: 0,
    promptCount: 0,
  });

  useEffect(() => {
    const handleUpdate = ({ metrics, lastPromptTokenCount }) => {
      setStats((prevState) => {
        // Deep equality check to prevent unnecessary updates
        if (prevState.lastPromptTokenCount === lastPromptTokenCount &&
            areMetricsEqual(prevState.metrics, metrics)) {
          return prevState;
        }
        return { ...prevState, metrics, lastPromptTokenCount };
      });
    };

    uiTelemetryService.on('update', handleUpdate);
    return () => uiTelemetryService.off('update', handleUpdate);
  }, []);
};
```

---

## 8. SDK-Agnostic Patterns Summary

### Patterns to Adopt

| Pattern | Priority | Reason | File Reference |
|---------|----------|--------|----------------|
| UIState/UIActions Split | **Critical** | Prevents unnecessary re-renders, referential stability | `UIStateContext.tsx`, `UIActionsContext.tsx` |
| Discriminated Unions | **Critical** | Type safety for message handling, exhaustive checks | `types.ts:259-282` |
| Exhaustive Reducer Checking | **High** | Catches missing cases at compile time | `extensions.ts:143-144`, `checks.ts` |
| Functional State Updates | **High** | Avoids stale closure issues | `useHistoryManager.ts:65-77` |
| History with ID Generation | **High** | Enables efficient list rendering | `useHistoryManager.ts:46-49` |
| Context Composition | **Medium** | Clear provider hierarchy | `AppContainer.tsx:1707-1724` |
| Memoized Context Values | **Medium** | Prevents context consumer re-renders | `AppContainer.tsx:1443-1627` |
| Event Subscription Pattern | **Medium** | External state synchronization | `SessionContext.tsx:194-227` |
| Undo/Redo with History Limit | **Low** | Memory efficiency for text editing | `text-buffer.ts:903-916` |
| Visual Layout Mapping | **Low** | Complex text rendering with wrapping | `text-buffer.ts:673-833` |

### Anti-Patterns to Avoid

1. **Prop Drilling** - Use context for deeply nested state access
2. **Monolithic State** - Split by domain (dialogs, input, display)
3. **Mutable Updates** - Always use immutable patterns with spread/Map
4. **Missing Exhaustive Checks** - Use `checkExhaustive` in reducers
5. **Stale Closures** - Use functional updates in `setState`

---

## 9. Recommendations for FloMaster CLI

### Recommended State Architecture

```typescript
// packages/cli/src/ui/contexts/cliStateContext.ts
export interface CLIState {
  // Input
  buffer: TextBuffer;
  inputActive: boolean;

  // History
  messages: ChatMessage[];
  pendingMessages: PendingMessage[];

  // UI modes
  streamingState: StreamingState;
  dialogState: DialogState | null;

  // Terminal
  terminalWidth: number;
  terminalHeight: number;
}

// packages/cli/src/ui/contexts/cliActionsContext.ts
export interface CLIActions {
  submitMessage: (content: string) => void;
  cancelRequest: () => void;
  clearHistory: () => void;
  openDialog: (dialog: DialogState) => void;
  closeDialog: () => void;
}
```

### History with Discriminated Unions

```typescript
export type MessageType = 'user' | 'assistant' | 'system' | 'tool_call' | 'error';

export interface BaseMessage {
  id: string;
  timestamp: number;
  type: MessageType;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  thinking?: string;
}

export interface ToolCallMessage extends BaseMessage {
  type: 'tool_call';
  toolName: string;
  status: 'pending' | 'executing' | 'success' | 'error';
  result?: ToolResult;
}

export type Message = UserMessage | AssistantMessage | ToolCallMessage | SystemMessage | ErrorMessage;
```

### Implementation Priority

1. **Phase 1**: UIState/UIActions split with basic history
2. **Phase 2**: Discriminated union messages with exhaustive checks
3. **Phase 3**: TextBuffer reducer with undo/redo
4. **Phase 4**: Session statistics and event subscriptions
