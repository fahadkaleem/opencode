# Gemini CLI Settings & Dialogs Analysis

> SDK-Agnostic dialog and settings patterns for Ink-based CLI applications

---

## Executive Summary

Key patterns extracted:

1. **Priority-based DialogManager**: Dialogs routed via cascading if-else
2. **Headless Selection Hook**: `useSelectionList` separates logic from rendering
3. **Composable Form Components**: `RadioButtonSelect` and `BaseSelectionList`
4. **Layered Settings Architecture**: Scopes (User, Workspace, System) with merge
5. **Data-Driven Key Bindings**: Commands mapped to key bindings via config

---

## 1. DialogManager Routing Pattern

**File**: `packages/cli/src/ui/components/DialogManager.tsx:41-236`

### Pattern Description

Priority-based if-else cascade where only ONE dialog renders at a time:

```typescript
export const DialogManager = ({ terminalWidth }: DialogManagerProps) => {
  const uiState = useUIState();
  const uiActions = useUIActions();

  // Priority cascade - first match wins
  if (uiState.showIdeRestartPrompt) {
    return <IdeTrustChangeDialog />;
  }
  if (uiState.isFolderTrustDialogOpen) {
    return <FolderTrustDialog onSelect={uiActions.handleFolderTrustSelect} />;
  }
  if (uiState.shellConfirmationRequest) {
    return <ShellConfirmationDialog request={uiState.shellConfirmationRequest} />;
  }
  if (uiState.isThemeDialogOpen) {
    return <ThemeDialog onSelect={uiActions.handleThemeSelect} />;
  }
  // ... more dialogs

  return null;
};
```

### State Management

Dialog visibility controlled by boolean flags in UIState:

```typescript
export interface UIState {
  isThemeDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  isAuthDialogOpen: boolean;
  isFolderTrustDialogOpen: boolean;
  // Dialog-specific data
  shellConfirmationRequest: ShellConfirmationRequest | null;
}
```

---

## 2. Dialog Component Patterns

### Confirmation Dialog

**File**: `packages/cli/src/ui/components/ShellConfirmationDialog.tsx`

```typescript
interface ShellConfirmationRequest {
  commands: string[];
  onConfirm: (outcome: ToolConfirmationOutcome) => void;
}

export const ShellConfirmationDialog = ({ request }) => {
  // Handle Escape for cancellation
  useKeypress(
    (key) => {
      if (key.name === 'escape') {
        request.onConfirm(ToolConfirmationOutcome.Cancel);
      }
    },
    { isActive: true },
  );

  const options = [
    { label: 'Yes, allow once', value: ToolConfirmationOutcome.ProceedOnce },
    { label: 'Yes, allow always', value: ToolConfirmationOutcome.ProceedAlways },
    { label: 'No (esc)', value: ToolConfirmationOutcome.Cancel },
  ];

  return (
    <Box borderStyle="round" borderColor={theme.status.warning}>
      <Text bold>Shell Command Execution</Text>
      <RadioButtonSelect items={options} onSelect={handleSelect} isFocused />
    </Box>
  );
};
```

### Consent Prompt

**File**: `packages/cli/src/ui/components/ConsentPrompt.tsx`

```typescript
export const ConsentPrompt = ({ prompt, onConfirm, terminalWidth }) => {
  return (
    <Box borderStyle="round" flexDirection="column">
      {typeof prompt === 'string'
        ? <MarkdownDisplay text={prompt} />
        : prompt}
      <RadioButtonSelect
        items={[
          { label: 'Yes', value: true },
          { label: 'No', value: false },
        ]}
        onSelect={onConfirm}
      />
    </Box>
  );
};
```

### Selection Dialog with Preview

Key features:
- Two-column layout: Selection list + live preview
- Tab switching between sections
- Keyboard shortcuts: Tab to switch, Enter to select, Esc to cancel
- Highlight callback for live preview updates

```typescript
const [mode, setMode] = useState<'theme' | 'scope'>('theme');

useKeypress(
  (key) => {
    if (key.name === 'tab') setMode(prev => prev === 'theme' ? 'scope' : 'theme');
    if (key.name === 'escape') onCancel();
  },
  { isActive: true },
);
```

---

## 3. Form Input Patterns

### RadioButtonSelect

**File**: `packages/cli/src/ui/components/shared/RadioButtonSelect.tsx`

```typescript
export interface RadioSelectItem<T> extends SelectionListItem<T> {
  label: string;
  key: string;
}

export function RadioButtonSelect<T>({
  items,
  initialIndex = 0,
  onSelect,
  onHighlight,
  isFocused = true,
  showNumbers = true,
}: RadioButtonSelectProps<T>) {
  return (
    <BaseSelectionList<T, RadioSelectItem<T>>
      items={items}
      onSelect={onSelect}
      onHighlight={onHighlight}
      isFocused={isFocused}
      showNumbers={showNumbers}
      renderItem={(item, { titleColor }) => (
        <Text color={titleColor}>{item.label}</Text>
      )}
    />
  );
}
```

### BaseSelectionList

**File**: `packages/cli/src/ui/components/shared/BaseSelectionList.tsx`

```typescript
export function BaseSelectionList<T, TItem extends SelectionListItem<T>>({
  items,
  renderItem,
  isFocused,
  onSelect,
  onHighlight,
}: BaseSelectionListProps<T, TItem>) {
  const { activeIndex } = useSelectionList({ items, onSelect, onHighlight, isFocused });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isSelected = activeIndex === index;
        return (
          <Box key={item.key}>
            <Text>{isSelected ? '●' : ' '}</Text>
            {renderItem(item, { isSelected, titleColor: isSelected ? 'green' : 'white' })}
          </Box>
        );
      })}
    </Box>
  );
}
```

---

## 4. useSelectionList Hook

**File**: `packages/cli/src/ui/hooks/useSelectionList.ts`

Headless hook providing all keyboard navigation logic:

```typescript
export function useSelectionList<T>({
  items,
  onSelect,
  onHighlight,
  isFocused = true,
  showNumbers = false,
}: UseSelectionListOptions<T>) {
  const [state, dispatch] = useReducer(selectionListReducer, initialState);

  const handleKeypress = useCallback((key: Key) => {
    if (keyMatchers[Command.DIALOG_NAVIGATION_UP](key)) {
      dispatch({ type: 'MOVE_UP' });
    }
    if (keyMatchers[Command.DIALOG_NAVIGATION_DOWN](key)) {
      dispatch({ type: 'MOVE_DOWN' });
    }
    if (keyMatchers[Command.RETURN](key)) {
      dispatch({ type: 'SELECT_CURRENT' });
    }
    // Numeric quick selection (1-9)
    if (showNumbers && /^[0-9]$/.test(key.sequence)) {
      // Handle numeric selection with timeout
    }
  }, [dispatch, items.length]);

  useKeypress(handleKeypress, { isActive: isFocused && items.length > 0 });

  return { activeIndex: state.activeIndex, setActiveIndex };
}
```

---

## 5. Settings Architecture

### Settings Schema

**File**: `packages/cli/src/config/settingsSchema.ts`

```typescript
export interface SettingDefinition {
  type: 'boolean' | 'string' | 'number' | 'enum';
  label: string;
  category: string;
  requiresRestart: boolean;
  default: SettingsValue;
  description?: string;
  showInDialog?: boolean;
  options?: readonly SettingEnumOption[];
}

const SETTINGS_SCHEMA = {
  general: {
    type: 'object',
    properties: {
      vimMode: {
        type: 'boolean',
        label: 'Vim Mode',
        category: 'General',
        requiresRestart: false,
        default: false,
        showInDialog: true,
      },
    },
  },
};
```

### Settings Scopes

**File**: `packages/cli/src/config/settings.ts`

```typescript
export enum SettingScope {
  User = 'User',
  Workspace = 'Workspace',
  System = 'System',
}

export class LoadedSettings {
  readonly user: SettingsFile;
  readonly workspace: SettingsFile;
  readonly system: SettingsFile;

  get merged(): Settings {
    return this._merged;
  }

  setValue(scope: LoadableSettingScope, key: string, value: unknown): void {
    const settingsFile = this.forScope(scope);
    setNestedProperty(settingsFile.settings, key, value);
    this._merged = this.computeMergedSettings();
    saveSettings(settingsFile);
  }
}
```

---

## 6. Recommendations for FloMaster CLI

### Dialog Architecture

1. Create centralized DialogManager with priority-based routing
2. Store dialog state as boolean flags in UIState context
3. Each dialog handles its own keyboard shortcuts via `useKeypress`

### Form Components

1. Implement `useSelectionList` hook for headless navigation
2. Create `BaseSelectionList` as composable base
3. Build `RadioButtonSelect` on top
4. Support arrow keys and vim keys (j/k)

### Settings System

1. Define settings with schema (type, label, default, requiresRestart)
2. Implement scope-aware storage (User, Workspace, Project)
3. Track modified settings and show restart prompts
4. Use dot-notation keys for nested settings

### File Structure

```
packages/cli/src/
├── ui/
│   ├── components/
│   │   ├── dialogs/
│   │   │   ├── DialogManager.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   └── ConfirmationDialog.tsx
│   │   └── shared/
│   │       ├── BaseSelectionList.tsx
│   │       └── RadioButtonSelect.tsx
│   └── hooks/
│       └── useSelectionList.ts
├── config/
│   ├── settings.ts
│   └── settingsSchema.ts
```
