# Gemini CLI App Structure Analysis

> SDK-Agnostic app structure patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI demonstrates sophisticated, production-grade architecture:

1. **Layered Provider Architecture**: 6+ nested context providers
2. **Dual Context Pattern**: State and Actions split into separate contexts
3. **Centralized State Container**: AppContainer manages all application state
4. **Layout Switching**: Conditional rendering based on app state
5. **Robust Lifecycle Management**: Cleanup functions registered early, executed on exit

---

## 1. Entry Point Architecture

**File**: `packages/cli/src/gemini.tsx`

### Ink Render Configuration

```typescript
const instance = render(
  <AppWrapper />,
  {
    stdout: inkStdout,
    stderr: inkStderr,
    stdin: process.stdin,
    exitOnCtrlC: false,           // Manual exit handling
    patchConsole: false,          // Custom console handling
    alternateBuffer: useAlternateBuffer,
    incrementalRendering: true,
  },
);
```

### Alternate Buffer Setup

```typescript
const useAlternateBuffer = shouldEnterAlternateScreen(
  isAlternateBufferEnabled(settings),
  config.getScreenReader(),
);

if (useAlternateBuffer) {
  enableMouseEvents();
  registerCleanup(() => disableMouseEvents());
}
```

---

## 2. Provider Composition Pattern

**File**: `packages/cli/src/gemini.tsx:214-244`

### Provider Nesting Order

```
SettingsContext.Provider (outermost - static config)
  └── KeypressProvider (raw input handling)
        └── MouseProvider (mouse events)
              └── ScrollProvider (scroll state)
                    └── SessionStatsProvider (metrics)
                          └── VimModeProvider (editor mode)
                                └── AppContainer (innermost)
```

### AppWrapper Component

```typescript
const AppWrapper = () => {
  useKittyKeyboardProtocol();  // Terminal protocol setup

  return (
    <SettingsContext.Provider value={settings}>
      <KeypressProvider config={config}>
        <MouseProvider mouseEventsEnabled={mouseEventsEnabled}>
          <ScrollProvider>
            <SessionStatsProvider>
              <VimModeProvider settings={settings}>
                <AppContainer
                  config={config}
                  version={version}
                  startupWarnings={startupWarnings}
                />
              </VimModeProvider>
            </SessionStatsProvider>
          </ScrollProvider>
        </MouseProvider>
      </KeypressProvider>
    </SettingsContext.Provider>
  );
};
```

### Provider Responsibilities

| Provider | Responsibility |
|----------|---------------|
| `SettingsContext` | App configuration/settings |
| `KeypressProvider` | Raw keyboard input parsing |
| `MouseProvider` | Mouse event handling |
| `ScrollProvider` | Scroll state and mouse wheel |
| `SessionStatsProvider` | Session metrics |
| `VimModeProvider` | Vim keybinding mode |

---

## 3. AppContainer Analysis

**File**: `packages/cli/src/ui/AppContainer.tsx`

### Structure Overview

AppContainer is the **central nervous system** (~1700 lines). It:
- Manages all UI state via multiple `useState` hooks
- Coordinates between various feature hooks
- Creates and provides `UIStateContext` and `UIActionsContext`
- Renders the final `<App />` component

### State Categories

```typescript
// Dialog State
const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
const [isPermissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

// UI Mode State
const [corgiMode, setCorgiMode] = useState(false);
const [copyModeEnabled, setCopyModeEnabled] = useState(false);
const [shellModeActive, setShellModeActive] = useState(false);

// Display State
const [constrainHeight, setConstrainHeight] = useState(true);
const [showErrorDetails, setShowErrorDetails] = useState(false);
```

### Dual Context Pattern

```typescript
// UIState - Read-only snapshot (~95 properties)
const uiState: UIState = useMemo(() => ({
  history: historyManager.history,
  isThemeDialogOpen,
  streamingState,
  terminalWidth,
  // ... 90+ more properties
}), [/* dependencies */]);

// UIActions - Stable callback functions
const uiActions: UIActions = useMemo(() => ({
  handleThemeSelect,
  closeThemeDialog,
  handleFinalSubmit,
  // ... action callbacks
}), [/* dependencies */]);

// Provider composition
return (
  <UIStateContext.Provider value={uiState}>
    <UIActionsContext.Provider value={uiActions}>
      <ConfigContext.Provider value={config}>
        <App />
      </ConfigContext.Provider>
    </UIActionsContext.Provider>
  </UIStateContext.Provider>
);
```

---

## 4. Layout Switching Pattern

**File**: `packages/cli/src/ui/App.tsx`

### Conditional Layout Rendering

```typescript
export const App = () => {
  const uiState = useUIState();
  const isAlternateBuffer = useAlternateBuffer();
  const isScreenReaderEnabled = useIsScreenReaderEnabled();

  // Priority 1: Quitting state
  if (uiState.quittingMessages) {
    return isAlternateBuffer
      ? <AlternateBufferQuittingDisplay />
      : <QuittingDisplay />;
  }

  // Priority 2: Normal operation
  return (
    <StreamingContext.Provider value={uiState.streamingState}>
      {isScreenReaderEnabled
        ? <ScreenReaderAppLayout />
        : <DefaultAppLayout />}
    </StreamingContext.Provider>
  );
};
```

---

## 5. Lifecycle Management

### Cleanup Registration Pattern

**File**: `packages/cli/src/utils/cleanup.ts`

```typescript
const cleanupFunctions: Array<() => void | Promise<void>> = [];

export function registerCleanup(fn: () => void | Promise<void>) {
  cleanupFunctions.push(fn);
}

export async function runExitCleanup() {
  for (const fn of cleanupFunctions) {
    try {
      await fn();
    } catch (_) {
      // Ignore errors during cleanup
    }
  }
  cleanupFunctions.length = 0;
}
```

### Cleanup Registration Points

```typescript
// In gemini.tsx
registerCleanup(() => instance.unmount());
registerCleanup(consolePatcher.cleanup);

// In AppContainer
registerCleanup(async () => {
  await generateAndSaveSummary(config);
  disableMouseEvents();
});
```

### Graceful Quit Flow

```typescript
quit: (messages: HistoryItem[]) => {
  setQuittingMessages(messages);
  setTimeout(async () => {
    await runExitCleanup();
    process.exit(0);
  }, 100);
},
```

---

## 6. Input Handling Patterns

### KeypressProvider Architecture

**File**: `packages/cli/src/ui/contexts/KeypressContext.tsx:562-624`

```typescript
export function KeypressProvider({ children, config }) {
  const { stdin, setRawMode } = useStdin();
  const subscribers = useRef<Set<KeypressHandler>>(new Set()).current;

  const subscribe = useCallback((handler) => subscribers.add(handler), []);
  const unsubscribe = useCallback((handler) => subscribers.delete(handler), []);
  const broadcast = useCallback((key) => subscribers.forEach(h => h(key)), []);

  useEffect(() => {
    setRawMode(true);

    const dataListener = createDataListener(broadcast);
    stdin.on('data', dataListener);

    return () => stdin.removeListener('data', dataListener);
  }, [stdin, setRawMode, broadcast]);

  return (
    <KeypressContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </KeypressContext.Provider>
  );
}
```

---

## 7. Recommendations for FloMaster CLI

### Provider Hierarchy

```typescript
const AppWrapper = () => {
  return (
    <ConfigProvider config={config}>
      <KeypressProvider>
        <MouseProvider>
          <ScrollProvider>
            <SessionProvider>
              <AppContainer />
            </SessionProvider>
          </ScrollProvider>
        </MouseProvider>
      </KeypressProvider>
    </ConfigProvider>
  );
};
```

### Dual Context Pattern

```typescript
// Separate contexts for optimal re-render performance
export const UIStateContext = createContext<UIState | null>(null);
export const UIActionsContext = createContext<UIActions | null>(null);
```

### Centralized Cleanup System

```typescript
// utils/cleanup.ts
const cleanupFunctions: Array<() => Promise<void> | void> = [];

export function registerCleanup(fn: () => Promise<void> | void) {
  cleanupFunctions.push(fn);
}

export async function runExitCleanup() {
  for (const fn of cleanupFunctions.reverse()) {
    try { await fn(); } catch { /* ignore */ }
  }
}
```

### Key Files to Create

| File | Purpose |
|------|---------|
| `cli/src/app.tsx` | Entry point with Ink render |
| `cli/src/ui/AppContainer.tsx` | Central state container |
| `cli/src/ui/App.tsx` | Layout switcher component |
| `cli/src/ui/contexts/` | Provider implementations |
| `cli/src/ui/layouts/` | Layout components |
| `cli/src/utils/cleanup.ts` | Cleanup registration system |
