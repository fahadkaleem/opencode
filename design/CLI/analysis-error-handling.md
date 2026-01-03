# Error Handling Analysis - Gemini CLI UI

> In-depth analysis of error handling patterns in the Gemini CLI codebase.

---

## Table of Contents

1. [Overview](#overview)
2. [Error Type System](#error-type-system)
3. [Error Display Components](#error-display-components)
4. [Error State Management](#error-state-management)
5. [Async Error Handling](#async-error-handling)
6. [Error Recovery Patterns](#error-recovery-patterns)
7. [Graceful Degradation](#graceful-degradation)
8. [Error Boundaries](#error-boundaries)
9. [Recommendations](#recommendations)

---

## Overview

The Gemini CLI employs a **state-driven error handling architecture** where errors are tracked as part of the application state and rendered through dedicated message components. The approach favors **user-recoverable errors** with clear feedback and action options.

### Key Characteristics

- **No React Error Boundaries**: The codebase does NOT use React Error Boundaries
- **State-based Error Tracking**: Errors stored in context state (`UIStateContext`)
- **Dedicated Message Components**: `ErrorMessage`, `WarningMessage`, `InfoMessage`
- **Semantic Color System**: Consistent error/warning/success colors via theme
- **Recovery Dialogs**: ProQuotaDialog, AuthDialog provide recovery options

---

## Error Type System

### Message Types (from `/ui/types.ts`, lines 285-303)

```typescript
export enum MessageType {
  INFO = 'info',
  ERROR = 'error',
  WARNING = 'warning',
  USER = 'user',
  // ... other types
}
```

### Tool Call Status (from `/ui/types.ts`, lines 47-54)

```typescript
export enum ToolCallStatus {
  Pending = 'Pending',
  Canceled = 'Canceled',
  Confirming = 'Confirming',
  Executing = 'Executing',
  Success = 'Success',
  Error = 'Error',  // Tool-specific error state
}
```

### History Item Types for Errors

```typescript
export type HistoryItemError = HistoryItemBase & {
  type: 'error';
  text: string;
};

export type HistoryItemWarning = HistoryItemBase & {
  type: 'warning';
  text: string;
};
```

### Console Message Types (from `/ui/types.ts`, lines 358-362)

```typescript
export interface ConsoleMessageItem {
  type: 'log' | 'warn' | 'error' | 'debug' | 'info';
  content: string;
  count: number;  // For deduplication/aggregation
}
```

---

## Error Display Components

### 1. ErrorMessage Component

**File**: `/ui/components/messages/ErrorMessage.tsx`

```typescript
interface ErrorMessageProps {
  text: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ text }) => {
  const prefix = '✕ ';  // Error icon
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

**Key Features**:
- Fixed-width icon prefix (`✕`)
- Full text wrapping for long messages
- Uses semantic `theme.status.error` color
- Margin at bottom for separation

### 2. WarningMessage Component

**File**: `/ui/components/messages/WarningMessage.tsx`

```typescript
export const WarningMessage: React.FC<WarningMessageProps> = ({ text }) => {
  const prefix = '⚠ ';
  const prefixWidth = 3;

  return (
    <Box flexDirection="row" marginTop={1}>
      <Box width={prefixWidth}>
        <Text color={theme.status.warning}>{prefix}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text wrap="wrap">
          <RenderInline text={text} defaultColor={theme.status.warning} />
        </Text>
      </Box>
    </Box>
  );
};
```

**Differences from ErrorMessage**:
- Uses warning icon (`⚠`)
- Supports inline markdown rendering via `RenderInline`
- Margin at top instead of bottom

### 3. InfoMessage Component

**File**: `/ui/components/messages/InfoMessage.tsx`

```typescript
interface InfoMessageProps {
  text: string;
  icon?: string;      // Customizable icon
  color?: string;     // Customizable color
}

export const InfoMessage: React.FC<InfoMessageProps> = ({
  text,
  icon,
  color,
}) => {
  color ??= theme.status.warning;  // Default to warning color
  const prefix = icon ?? 'ℹ ';

  return (
    <Box flexDirection="row" marginTop={1}>
      <Box width={prefixWidth}>
        <Text color={color}>{prefix}</Text>
      </Box>
      <Box flexGrow={1} flexDirection="column">
        {text.split('\n').map((line, index) => (
          <Text wrap="wrap" key={index}>
            <RenderInline text={line} defaultColor={color} />
          </Text>
        ))}
      </Box>
    </Box>
  );
};
```

**Key Features**:
- Customizable icon and color props
- Multi-line text support (splits on newlines)
- Supports markdown inline rendering

### 4. Tool Status Indicator

**File**: `/ui/components/messages/ToolShared.tsx` (lines 28-71)

```typescript
export const ToolStatusIndicator: React.FC<ToolStatusIndicatorProps> = ({
  status,
  name,
}) => {
  return (
    <Box minWidth={STATUS_INDICATOR_WIDTH}>
      {status === ToolCallStatus.Error && (
        <Text color={theme.status.error} aria-label={'Error:'} bold>
          {TOOL_STATUS.ERROR}  // 'x'
        </Text>
      )}
      // ... other statuses
    </Box>
  );
};
```

### 5. Status Symbols

**File**: `/ui/constants.ts` (lines 29-37)

```typescript
export const TOOL_STATUS = {
  SUCCESS: '✓',
  PENDING: 'o',
  EXECUTING: '⊷',
  CONFIRMING: '?',
  CANCELED: '-',
  ERROR: 'x',
} as const;
```

---

## Error State Management

### UIStateContext Error Fields

**File**: `/ui/contexts/UIStateContext.tsx` (lines 44-139)

The UI state tracks multiple error-related fields:

```typescript
export interface UIState {
  // Dialog-specific errors
  themeError: string | null;           // Theme loading/switching errors
  authError: string | null;            // Authentication errors
  editorError: string | null;          // Editor settings errors

  // System-level errors
  initError: string | null;            // SDK/API initialization errors
  queueErrorMessage: string | null;    // Message queue errors

  // Error visibility
  showErrorDetails: boolean;           // Toggle debug console
  errorCount: number;                  // Console error count
  filteredConsoleMessages: ConsoleMessageItem[];  // All console messages

  // Warning state
  warningMessage: string | null;       // Transient warnings
}
```

### Error Handler Pattern

**File**: `/ui/auth/useAuth.ts` (lines 47-55)

```typescript
const onAuthError = useCallback(
  (error: string | null) => {
    setAuthError(error);
    if (error) {
      setAuthState(AuthState.Updating);  // Transition to error state
    }
  },
  [setAuthError, setAuthState],
);
```

**Pattern**: Errors trigger state transitions that show appropriate UI.

### AppContainer Error Handling

**File**: `/ui/AppContainer.tsx` (lines 500-510)

```typescript
const handleAuthSelect = useCallback(
  async (authType: AuthType | undefined, scope: LoadableSettingScope) => {
    try {
      await config.refreshAuth(authType);
      setAuthState(AuthState.Authenticated);
    } catch (e) {
      onAuthError(
        `Failed to authenticate: ${e instanceof Error ? e.message : String(e)}`,
      );
      return;
    }
    // ...
  },
  [settings, config, setAuthState, onAuthError],
);
```

---

## Async Error Handling

### Pattern 1: Try-Catch with State Update

**File**: `/ui/AppContainer.tsx` (lines 675-717)

```typescript
const performMemoryRefresh = useCallback(async () => {
  historyManager.addItem(
    { type: MessageType.INFO, text: 'Refreshing hierarchical memory...' },
    Date.now(),
  );

  try {
    const { memoryContent, fileCount } =
      await refreshServerHierarchicalMemory(config);

    historyManager.addItem(
      { type: MessageType.INFO, text: `Memory refreshed successfully.` },
      Date.now(),
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    historyManager.addItem(
      { type: MessageType.ERROR, text: `Error refreshing memory: ${errorMessage}` },
      Date.now(),
    );
    debugLogger.warn('Error refreshing memory:', error);
  }
}, [config, historyManager]);
```

### Pattern 2: Silent Error Handling in Effects

**File**: `/ui/components/Notifications.tsx` (lines 41-48)

```typescript
useEffect(() => {
  const checkScreenReader = async () => {
    try {
      await fs.access(screenReaderNudgeFilePath);
      setHasSeenScreenReaderNudge(true);
    } catch {
      setHasSeenScreenReaderNudge(false);  // Silent failure - expected
    }
  };
  // ...
}, [isScreenReaderEnabled]);
```

### Pattern 3: Error Propagation via Callback

**File**: `/ui/auth/useAuth.ts` (lines 117-125)

```typescript
try {
  await config.refreshAuth(authType);
  debugLogger.log(`Authenticated via "${authType}".`);
  setAuthError(null);
  setAuthState(AuthState.Authenticated);
} catch (e) {
  onAuthError(`Failed to login. Message: ${getErrorMessage(e)}`);
}
```

### Pattern 4: Race Condition Handling

**File**: `/ui/AppContainer.tsx` (lines 927-950)

```typescript
useEffect(() => {
  if (activePtyId) {
    try {
      ShellExecutionService.resizePty(activePtyId, width, height);
    } catch (e) {
      // Race condition: pty may exit right before resize
      if (!(e instanceof Error &&
            e.message.includes('Cannot resize a pty that has already exited'))) {
        throw e;  // Re-throw unexpected errors
      }
    }
  }
}, [terminalWidth, availableTerminalHeight, activePtyId]);
```

---

## Error Recovery Patterns

### 1. ProQuotaDialog - Model Fallback Recovery

**File**: `/ui/components/ProQuotaDialog.tsx`

Provides user choices for quota/capacity errors:

```typescript
interface ProQuotaDialogProps {
  failedModel: string;
  fallbackModel: string;
  message: string;
  isTerminalQuotaError: boolean;
  isModelNotFoundError?: boolean;
  onChoice: (choice: 'retry_later' | 'retry_once' | 'retry_always' | 'upgrade') => void;
  userTier: UserTierId | undefined;
}
```

**Recovery Options**:
- `retry_once`: Keep trying current model
- `retry_always`: Switch to fallback model
- `retry_later`: Stop and wait
- `upgrade`: Upgrade tier (for free users)

### 2. AuthDialog - Re-authentication Recovery

**File**: `/ui/auth/AuthDialog.tsx` (lines 230-234)

Displays errors inline with recovery options:

```typescript
{authError && (
  <Box marginTop={1}>
    <Text color={theme.status.error}>{authError}</Text>
  </Box>
)}
```

Users can:
- Select a different authentication method
- Retry the current method
- Cancel and return to previous state

### 3. ApiAuthDialog - API Key Entry Recovery

**File**: `/ui/auth/ApiAuthDialog.tsx` (lines 85-89)

```typescript
{error && (
  <Box marginTop={1}>
    <Text color={theme.status.error}>{error}</Text>
  </Box>
)}
```

Recovery via:
- Correct the API key
- Press Escape to go back to auth method selection

### 4. Ctrl+C Double-Press Exit Recovery

**File**: `/ui/AppContainer.tsx` (lines 1107-1123)

```typescript
useEffect(() => {
  if (ctrlCPressCount > 2) {
    recordExitFail(config);  // Record failure telemetry
  }
  if (ctrlCPressCount > 1) {
    handleSlashCommand('/quit', undefined, undefined, false);
  } else {
    // Reset counter after timeout
    ctrlCTimerRef.current = setTimeout(() => {
      setCtrlCPressCount(0);
    }, WARNING_PROMPT_DURATION_MS);  // 1000ms
  }
}, [ctrlCPressCount, config, handleSlashCommand]);
```

---

## Graceful Degradation

### 1. Notifications Component - Multi-Level Errors

**File**: `/ui/components/Notifications.tsx` (lines 86-127)

```typescript
return (
  <>
    {showScreenReaderNudge && (
      <Text>Screen reader mode instructions...</Text>
    )}
    {updateInfo && <UpdateNotification message={updateInfo.message} />}
    {showStartupWarnings && (
      <Box borderStyle="round" borderColor={theme.status.warning}>
        {startupWarnings.map((warning, index) => (
          <Text key={index} color={theme.status.warning}>{warning}</Text>
        ))}
      </Box>
    )}
    {showInitError && (
      <Box borderStyle="round" borderColor={theme.status.error}>
        <Text color={theme.status.error}>
          Initialization Error: {initError}
        </Text>
        <Text color={theme.status.error}>
          Please check API key and configuration.
        </Text>
      </Box>
    )}
  </>
);
```

**Degradation Hierarchy**:
1. Screen reader nudge (informational)
2. Update notifications (informational)
3. Startup warnings (caution)
4. Init errors (critical - but still shows UI)

### 2. Input Disabling on Errors

**File**: `/ui/AppContainer.tsx` (lines 871-878)

```typescript
const isInputActive =
  !initError &&           // Disabled if init failed
  !isProcessing &&        // Disabled during processing
  !!slashCommands &&      // Disabled if commands not loaded
  (streamingState === StreamingState.Idle ||
   streamingState === StreamingState.Responding) &&
  !proQuotaRequest;       // Disabled if quota dialog showing
```

### 3. Console Error Summary

**File**: `/ui/components/ConsoleSummaryDisplay.tsx`

```typescript
export const ConsoleSummaryDisplay: React.FC<ConsoleSummaryDisplayProps> = ({
  errorCount,
}) => {
  if (errorCount === 0) {
    return null;  // Hide when no errors
  }

  return (
    <Box>
      <Text color={theme.status.error}>
        ✖ {errorCount} error{errorCount > 1 ? 's' : ''}{' '}
        <Text color={theme.text.secondary}>(F12 for details)</Text>
      </Text>
    </Box>
  );
};
```

**Features**:
- Hides entirely when no errors
- Shows error count badge
- Provides keyboard shortcut to view details

### 4. Detailed Console Panel

**File**: `/ui/components/DetailedMessagesDisplay.tsx`

Shows full error details with icons:

```typescript
switch (msg.type) {
  case 'warn':
    textColor = theme.status.warning;
    icon = '⚠';
    break;
  case 'error':
    textColor = theme.status.error;
    icon = '✖';
    break;
  case 'debug':
    textColor = theme.text.secondary;
    icon = '🔍';
    break;
  // ...
}
```

Toggle visibility with F12 key.

---

## Error Boundaries

### Finding: No React Error Boundaries Used

A grep search for `ErrorBoundary`, `componentDidCatch`, and `getDerivedStateFromError` found **no error boundaries** in the UI codebase.

**Only match**: `SessionContext.test.tsx` - a test file

### Why This Approach?

The Gemini CLI uses **Ink** (terminal-based React) where:
1. Crashes would exit the terminal process anyway
2. State-based error handling provides more control
3. Terminal UIs don't need component-level isolation like web apps

### Implications

- Unhandled React errors will crash the entire CLI
- All errors must be explicitly caught in try-catch blocks
- Event handlers need defensive error handling

---

## Semantic Color System

### Theme Status Colors

**File**: `/ui/themes/semantic-tokens.ts` (lines 34-38, 66-70, 98-102)

```typescript
status: {
  error: lightTheme.AccentRed,
  success: lightTheme.AccentGreen,
  warning: lightTheme.AccentYellow,
}
```

**Usage**: All error messages use `theme.status.error`, warnings use `theme.status.warning`.

### Dynamic Theme Access

**File**: `/ui/semantic-colors.ts`

```typescript
export const theme: SemanticColors = {
  get status() {
    return themeManager.getSemanticColors().status;
  },
  // ...
};
```

Theme colors update dynamically when user changes themes.

---

## Recommendations

### For FloMaster Implementation

1. **Create Similar Message Components**
   ```typescript
   // packages/ui/src/components/ui/message/
   - ErrorMessage.tsx    // Red with ✕ icon
   - WarningMessage.tsx  // Yellow with ⚠ icon
   - InfoMessage.tsx     // Configurable
   - index.ts
   ```

2. **Implement Error State in Zustand Store**
   ```typescript
   interface UIState {
     errors: {
       auth: string | null;
       api: string | null;
       init: string | null;
     };
     setError: (type: string, error: string | null) => void;
     clearErrors: () => void;
   }
   ```

3. **Create Recovery Dialog Pattern**
   - Modal with error message
   - Radio button options for recovery
   - Clear call-to-action buttons

4. **Add Console Error Summary**
   - Badge showing error count
   - Expandable detail panel
   - Clear errors button

5. **Implement Async Error Wrapper**
   ```typescript
   const useAsyncError = () => {
     const setError = useUIStore((s) => s.setError);

     return async <T>(
       fn: () => Promise<T>,
       errorType: string
     ): Promise<T | null> => {
       try {
         return await fn();
       } catch (e) {
         setError(errorType, getErrorMessage(e));
         return null;
       }
     };
   };
   ```

6. **Consider Adding Error Boundary for Web**
   - Unlike Ink/terminal, web React benefits from error boundaries
   - Wrap feature modules in boundaries
   - Show fallback UI for component crashes

7. **Semantic Color Tokens**
   ```typescript
   // Already have in theming.md:
   status: {
     error: 'red',
     warning: 'yellow',
     success: 'green',
   }
   ```

8. **Graceful Degradation Strategy**
   - Disable inputs during errors
   - Show skeleton/loading states
   - Provide "Retry" options
   - Log errors to console for debugging

---

## File References Summary

| File | Lines | Purpose |
|------|-------|---------|
| `/ui/components/messages/ErrorMessage.tsx` | 1-32 | Error message component |
| `/ui/components/messages/WarningMessage.tsx` | 1-33 | Warning message component |
| `/ui/components/messages/InfoMessage.tsx` | 1-42 | Info message component |
| `/ui/components/messages/ToolShared.tsx` | 28-71 | Tool status indicator |
| `/ui/types.ts` | 47-54, 285-303 | Error type definitions |
| `/ui/contexts/UIStateContext.tsx` | 44-139 | Error state interface |
| `/ui/auth/useAuth.ts` | 37-145 | Auth error handling |
| `/ui/auth/AuthDialog.tsx` | 1-254 | Auth error recovery UI |
| `/ui/auth/ApiAuthDialog.tsx` | 1-98 | API key error handling |
| `/ui/AppContainer.tsx` | 500-550, 675-717, 927-950 | Async error patterns |
| `/ui/components/Notifications.tsx` | 1-130 | Error notifications |
| `/ui/components/ProQuotaDialog.tsx` | 1-137 | Quota error recovery |
| `/ui/components/ConsoleSummaryDisplay.tsx` | 1-36 | Error count badge |
| `/ui/components/DetailedMessagesDisplay.tsx` | 1-121 | Debug console panel |
| `/ui/hooks/useConsoleMessages.ts` | 1-146 | Console message aggregation |
| `/ui/themes/semantic-tokens.ts` | 34-38 | Error color tokens |
| `/ui/constants.ts` | 29-37 | Tool status symbols |

---

*Analysis completed: 2025-12-31*
