# SettingsDialog Component Analysis

> Comprehensive analysis of the gemini-cli SettingsDialog component for FloMaster implementation reference.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/SettingsDialog.tsx`

---

## Table of Contents

1. [Overview](#overview)
2. [Settings Schema Structure](#settings-schema-structure)
3. [Search & Filter Implementation](#search--filter-implementation)
4. [Form Control Patterns](#form-control-patterns)
5. [Keyboard Navigation](#keyboard-navigation)
6. [State Management](#state-management)
7. [Layout Structure](#layout-structure)
8. [Navigation State Machine](#navigation-state-machine)
9. [Implementation Recommendations](#implementation-recommendations)

---

## Overview

The SettingsDialog is a complex modal component that provides:
- **Fuzzy search** across all settings using the `fzf` library
- **Multi-scope support** (User, Workspace, System settings)
- **Multiple control types** (boolean toggles, enum selectors, text/number inputs)
- **Restart-required settings** tracking with deferred saves
- **Keyboard-first navigation** with Tab for section switching

### Key Dependencies

```typescript
// Lines 7-50
import { AsyncFzf } from 'fzf';                    // Fuzzy search
import { theme } from '../semantic-colors.js';     // Theming
import { useVimMode } from '../contexts/VimModeContext.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { useTextBuffer } from './shared/text-buffer.js';
import { TextInput } from './shared/TextInput.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
```

---

## Settings Schema Structure

### Schema Definition (settingsSchema.ts)

The schema defines all settings with rich metadata:

```typescript
// Lines 99-127 of settingsSchema.ts
export interface SettingDefinition {
  type: SettingsType;           // 'boolean' | 'string' | 'number' | 'array' | 'object' | 'enum'
  label: string;                // Human-readable label
  category: string;             // Category for grouping
  requiresRestart: boolean;     // If true, setting needs app restart
  default: SettingsValue;       // Default value
  description?: string;         // Help text
  showInDialog?: boolean;       // Whether to display in settings UI
  options?: readonly SettingEnumOption[];  // For enum types
  properties?: SettingsSchema;  // For nested object types
  mergeStrategy?: MergeStrategy; // How to merge across scopes
}
```

### Setting Types

```typescript
// Lines 28-34 of settingsSchema.ts
export type SettingsType =
  | 'boolean'  // Toggle controls
  | 'string'   // Text input
  | 'number'   // Number input
  | 'array'    // List of values (not editable in dialog)
  | 'object'   // Nested settings (container)
  | 'enum';    // Radio/select controls

// Lines 49-52 - Toggle types (cycle through values)
export const TOGGLE_TYPES: ReadonlySet<SettingsType | undefined> = new Set([
  'boolean',
  'enum',
]);
```

### Nested Settings Example

```typescript
// Lines 311-334 of settingsSchema.ts - Output format enum
output: {
  type: 'object',
  label: 'Output',
  category: 'General',
  default: {},
  properties: {
    format: {
      type: 'enum',
      label: 'Output Format',
      category: 'General',
      requiresRestart: false,
      default: 'text',
      showInDialog: true,
      options: [
        { value: 'text', label: 'Text' },
        { value: 'json', label: 'JSON' },
      ],
    },
  },
}
```

### Schema Flattening (settingsUtils.ts)

Nested settings are flattened into dot-notation keys for UI access:

```typescript
// Lines 26-37 of settingsUtils.ts
function flattenSchema(schema: SettingsSchema, prefix = ''): FlattenedSchema {
  let result: FlattenedSchema = {};
  for (const key in schema) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const definition = schema[key];
    result[newKey] = { ...definition, key: newKey };
    if (definition.properties) {
      result = { ...result, ...flattenSchema(definition.properties, newKey) };
    }
  }
  return result;
}
```

### Category Structure

Settings are organized by category:

| Category | Examples |
|----------|----------|
| General | Preview Features, Vim Mode, Auto Update |
| UI | Theme, Line Numbers, Footer options |
| Model | Max Session Turns, Compression Threshold |
| Tools | Auto Accept, Shell options, Ripgrep |
| Context | File Filtering, Include Directories |
| Security | YOLO Mode, Folder Trust |
| Advanced | DNS Resolution, Bug Command |
| Experimental | Enable Agents, JIT Context |

---

## Search & Filter Implementation

### AsyncFzf Initialization

```typescript
// Lines 99-117 of SettingsDialog.tsx
const { fzfInstance, searchMap } = useMemo(() => {
  const keys = getDialogSettingKeys();  // Get all visible setting keys
  const map = new Map<string, string>();
  const searchItems: string[] = [];

  keys.forEach((key) => {
    const def = getSettingDefinition(key);
    if (def?.label) {
      searchItems.push(def.label);  // Search by label, not key
      map.set(def.label.toLowerCase(), key);  // Map label -> key
    }
  });

  const fzf = new AsyncFzf(searchItems, {
    fuzzy: 'v2',           // Use v2 fuzzy algorithm
    casing: 'case-insensitive',
  });
  return { fzfInstance: fzf, searchMap: map };
}, []);
```

### Async Search Execution

```typescript
// Lines 119-148 of SettingsDialog.tsx
useEffect(() => {
  let active = true;  // Prevent stale updates

  if (!searchQuery.trim() || !fzfInstance) {
    setFilteredKeys(getDialogSettingKeys());  // Reset to all keys
    return;
  }

  const doSearch = async () => {
    const results = await fzfInstance.find(searchQuery);

    if (!active) return;  // Abort if superseded

    const matchedKeys = new Set<string>();
    results.forEach((res: FzfResult) => {
      const key = searchMap.get(res.item.toLowerCase());
      if (key) matchedKeys.add(key);
    });

    setFilteredKeys(Array.from(matchedKeys));
    setActiveSettingIndex(0);  // Reset selection
    setScrollOffset(0);
  };

  doSearch();

  return () => { active = false; };  // Cleanup
}, [searchQuery, fzfInstance, searchMap]);
```

### Search Input with TextBuffer

```typescript
// Lines 833-843 of SettingsDialog.tsx
const buffer = useTextBuffer({
  initialText: '',
  initialCursorOffset: 0,
  viewport: {
    width: viewportWidth,
    height: 1,
  },
  isValidPath: () => false,
  singleLine: true,
  onChange: (text) => setSearchQuery(text),  // Updates trigger search
});
```

---

## Form Control Patterns

### Setting Items Generation

```typescript
// Lines 197-316 of SettingsDialog.tsx
const generateSettingsItems = () => {
  const settingKeys = searchQuery ? filteredKeys : getDialogSettingKeys();

  return settingKeys.map((key: string) => {
    const definition = getSettingDefinition(key);

    return {
      label: definition?.label || key,
      value: key,
      type: definition?.type,
      toggle: () => {
        // Handle toggle action based on type
        if (!TOGGLE_TYPES.has(definition?.type)) return;

        const currentValue = getEffectiveValue(key, pendingSettings, {});
        let newValue: SettingsValue;

        if (definition?.type === 'boolean') {
          newValue = !(currentValue as boolean);
          // Update pending settings...
        } else if (definition?.type === 'enum' && definition.options) {
          // Cycle through enum options
          const options = definition.options;
          const currentIndex = options.findIndex(opt => opt.value === currentValue);
          newValue = currentIndex < options.length - 1
            ? options[currentIndex + 1].value
            : options[0].value;  // Wrap around
        }

        // Save immediately OR track for restart...
      },
    };
  });
};
```

### Boolean Toggle Pattern

```typescript
// Lines 213-218 of SettingsDialog.tsx
if (definition?.type === 'boolean') {
  newValue = !(currentValue as boolean);
  setPendingSettings((prev) =>
    setPendingSettingValue(key, newValue as boolean, prev),
  );
}
```

### Enum Cycling Pattern

```typescript
// Lines 218-231 of SettingsDialog.tsx
if (definition?.type === 'enum' && definition.options) {
  const options = definition.options;
  const currentIndex = options?.findIndex(
    (opt) => opt.value === currentValue,
  );
  if (currentIndex !== -1 && currentIndex < options.length - 1) {
    newValue = options[currentIndex + 1].value;
  } else {
    newValue = options[0].value; // Loop back to start
  }
  setPendingSettings((prev) =>
    setPendingSettingValueAny(key, newValue, prev),
  );
}
```

### String/Number Input Pattern

```typescript
// Lines 335-432 of SettingsDialog.tsx
const startEditing = (key: string, initial?: string) => {
  setEditingKey(key);
  const initialValue = initial ?? '';
  setEditBuffer(initialValue);
  setEditCursorPos(cpLen(initialValue));  // Cursor at end
};

const commitEdit = (key: string) => {
  const definition = getSettingDefinition(key);
  const type = definition?.type;

  // Validate number input
  if (editBuffer.trim() === '' && type === 'number') {
    setEditingKey(null);  // Cancel empty number edit
    return;
  }

  let parsed: string | number;
  if (type === 'number') {
    const numParsed = Number(editBuffer.trim());
    if (Number.isNaN(numParsed)) {
      setEditingKey(null);  // Cancel invalid number
      return;
    }
    parsed = numParsed;
  } else {
    parsed = editBuffer;
  }

  // Update pending settings
  setPendingSettings((prev) => setPendingSettingValueAny(key, parsed, prev));

  // Handle immediate save vs restart-required...
};
```

### Cursor Rendering for Inline Edit

```typescript
// Lines 903-925 of SettingsDialog.tsx
let displayValue: string;
if (editingKey === item.value) {
  if (cursorVisible && editCursorPos < cpLen(editBuffer)) {
    // Cursor in middle of text
    const beforeCursor = cpSlice(editBuffer, 0, editCursorPos);
    const atCursor = cpSlice(editBuffer, editCursorPos, editCursorPos + 1);
    const afterCursor = cpSlice(editBuffer, editCursorPos + 1);
    displayValue = beforeCursor + chalk.inverse(atCursor) + afterCursor;
  } else if (cursorVisible && editCursorPos >= cpLen(editBuffer)) {
    // Cursor at end - show inverted space
    displayValue = editBuffer + chalk.inverse(' ');
  } else {
    displayValue = editBuffer;  // Cursor hidden (blink)
  }
}
```

### Cursor Blink Effect

```typescript
// Lines 326-333 of SettingsDialog.tsx
useEffect(() => {
  if (!editingKey) {
    setCursorVisible(true);
    return;
  }
  const id = setInterval(() => setCursorVisible((v) => !v), 500);  // 500ms blink
  return () => clearInterval(id);
}, [editingKey]);
```

---

## Keyboard Navigation

### Focus Section Management

```typescript
// Lines 81-83 of SettingsDialog.tsx
const [focusSection, setFocusSection] = useState<'settings' | 'scope'>('settings');
```

### Key Handling with useKeypress

```typescript
// Lines 561-828 of SettingsDialog.tsx
useKeypress(
  (key) => {
    const { name } = key;

    // Tab toggles between sections
    if (name === 'tab' && showScopeSelection) {
      setFocusSection((prev) => (prev === 'settings' ? 'scope' : 'settings'));
    }

    if (focusSection === 'settings') {
      // Edit mode handling
      if (editingKey) {
        // Paste handling
        if (key.paste && key.sequence) {
          let pasted = key.sequence;
          if (type === 'number') {
            pasted = key.sequence.replace(/[^0-9\-+.]/g, '');  // Number filter
          }
          // Insert at cursor...
          return;
        }

        // Backspace/Delete
        if (name === 'backspace' || name === 'delete') {
          // Handle character deletion with cursor position...
          return;
        }

        // Escape/Enter commits edit
        if (keyMatchers[Command.ESCAPE](key) || keyMatchers[Command.RETURN](key)) {
          commitEdit(editingKey);
          return;
        }

        // Character input for number/string
        let ch = key.sequence;
        let isValidChar = false;
        if (type === 'number') {
          isValidChar = /[0-9\-+.]/.test(ch);
        } else {
          ch = stripUnsafeCharacters(ch);
          isValidChar = ch.length === 1;
        }
        if (isValidChar) {
          // Insert character at cursor...
          return;
        }

        // Arrow navigation within edit
        if (name === 'left') {
          setEditCursorPos((pos) => Math.max(0, pos - 1));
          return;
        }
        if (name === 'right') {
          setEditCursorPos((pos) => Math.min(cpLen(editBuffer), pos + 1));
          return;
        }
        return;  // Block other keys while editing
      }

      // Settings list navigation (not editing)
      if (keyMatchers[Command.DIALOG_NAVIGATION_UP](key)) {
        const newIndex = activeSettingIndex > 0
          ? activeSettingIndex - 1
          : items.length - 1;  // Wrap to bottom
        setActiveSettingIndex(newIndex);
        // Adjust scroll offset for wrap-around...
      } else if (keyMatchers[Command.DIALOG_NAVIGATION_DOWN](key)) {
        const newIndex = activeSettingIndex < items.length - 1
          ? activeSettingIndex + 1
          : 0;  // Wrap to top
        setActiveSettingIndex(newIndex);
        // Adjust scroll offset...
      } else if (keyMatchers[Command.RETURN](key)) {
        const currentItem = items[activeSettingIndex];
        if (currentItem?.type === 'number' || currentItem?.type === 'string') {
          startEditing(currentItem.value);
        } else {
          currentItem?.toggle();  // Boolean/enum
        }
      } else if (/^[0-9]$/.test(key.sequence || '') && !editingKey) {
        // Quick number entry
        const currentItem = items[activeSettingIndex];
        if (currentItem?.type === 'number') {
          startEditing(currentItem.value, key.sequence);
        }
      } else if (keyMatchers[Command.CLEAR_INPUT](key)) {
        // Ctrl+C resets to default value
        const currentSetting = items[activeSettingIndex];
        const defaultValue = getDefaultValue(currentSetting.value);
        // Reset to default...
      }
    }

    // Restart prompt handling
    if (showRestartPrompt && name === 'r') {
      saveRestartRequiredSettings();
      onRestartRequest?.();
    }

    // Escape closes dialog
    if (keyMatchers[Command.ESCAPE](key)) {
      if (editingKey) {
        commitEdit(editingKey);
      } else {
        saveRestartRequiredSettings();
        onSelect(undefined, selectedScope);  // Close dialog
      }
    }
  },
  { isActive: true },
);
```

### Navigation Commands (keyBindings.ts)

```typescript
// Lines 148-155 of keyBindings.ts
[Command.DIALOG_NAVIGATION_UP]: [
  { key: 'up', shift: false },
  { key: 'k', shift: false },    // Vim-style
],
[Command.DIALOG_NAVIGATION_DOWN]: [
  { key: 'down', shift: false },
  { key: 'j', shift: false },    // Vim-style
],
```

---

## State Management

### State Variables

```typescript
// Lines 81-97 of SettingsDialog.tsx
// Focus state: 'settings' or 'scope'
const [focusSection, setFocusSection] = useState<'settings' | 'scope'>('settings');

// Scope selector state (User by default)
const [selectedScope, setSelectedScope] = useState<LoadableSettingScope>(
  SettingScope.User,
);

// Active indices
const [activeSettingIndex, setActiveSettingIndex] = useState(0);

// Scroll offset for settings
const [scrollOffset, setScrollOffset] = useState(0);
const [showRestartPrompt, setShowRestartPrompt] = useState(false);

// Search state
const [searchQuery, setSearchQuery] = useState('');
const [filteredKeys, setFilteredKeys] = useState<string[]>(() =>
  getDialogSettingKeys(),
);
```

### Pending Settings (Local Changes)

```typescript
// Lines 150-165 of SettingsDialog.tsx
// Local pending settings state for the selected scope
const [pendingSettings, setPendingSettings] = useState<Settings>(() =>
  structuredClone(settings.forScope(selectedScope).settings),
);

// Track which settings have been modified by the user
const [modifiedSettings, setModifiedSettings] = useState<Set<string>>(
  new Set(),
);

// Preserve pending changes across scope switches
type PendingValue = boolean | number | string;
const [globalPendingChanges, setGlobalPendingChanges] = useState<
  Map<string, PendingValue>
>(new Map());

// Track restart-required settings across scope changes
const [_restartRequiredSettings, setRestartRequiredSettings] = useState<
  Set<string>
>(new Set());
```

### Scope Change Effect

```typescript
// Lines 172-195 of SettingsDialog.tsx
useEffect(() => {
  // Base settings for selected scope
  let updated = structuredClone(settings.forScope(selectedScope).settings);

  // Overlay globally pending (unsaved) changes
  const newModified = new Set<string>();
  const newRestartRequired = new Set<string>();

  for (const [key, value] of globalPendingChanges.entries()) {
    const def = getSettingDefinition(key);
    if (def?.type === 'boolean' && typeof value === 'boolean') {
      updated = setPendingSettingValue(key, value, updated);
    } else if (/* number or string */) {
      updated = setPendingSettingValueAny(key, value, updated);
    }
    newModified.add(key);
    if (requiresRestart(key)) newRestartRequired.add(key);
  }

  setPendingSettings(updated);
  setModifiedSettings(newModified);
  setRestartRequiredSettings(newRestartRequired);
  setShowRestartPrompt(newRestartRequired.size > 0);
}, [selectedScope, settings, globalPendingChanges]);
```

### Immediate vs Deferred Saving

```typescript
// Lines 233-312 of SettingsDialog.tsx (inside toggle function)
if (!requiresRestart(key)) {
  // IMMEDIATE SAVE - Non-restart settings
  const immediateSettings = new Set([key]);
  const currentScopeSettings = settings.forScope(selectedScope).settings;
  const immediateSettingsObject = setPendingSettingValueAny(
    key,
    newValue,
    currentScopeSettings,
  );

  saveModifiedSettings(
    immediateSettings,
    immediateSettingsObject,
    settings,
    selectedScope,
  );

  // Remove from tracking sets
  setModifiedSettings((prev) => {
    const updated = new Set(prev);
    updated.delete(key);
    return updated;
  });

  // Remove from global pending changes
  setGlobalPendingChanges((prev) => {
    if (!prev.has(key)) return prev;
    const next = new Map(prev);
    next.delete(key);
    return next;
  });
} else {
  // DEFERRED SAVE - Restart-required settings
  setModifiedSettings((prev) => {
    const updated = new Set(prev).add(key);
    const needsRestart = hasRestartRequiredSettings(updated);
    if (needsRestart) {
      setShowRestartPrompt(true);
      setRestartRequiredSettings((prevRestart) =>
        new Set(prevRestart).add(key),
      );
    }
    return updated;
  });

  // Track in global pending for scope persistence
  setGlobalPendingChanges((prev) => {
    const next = new Map(prev);
    next.set(key, newValue as PendingValue);
    return next;
  });
}
```

### Save on Close/Restart

```typescript
// Lines 536-559 of SettingsDialog.tsx
const saveRestartRequiredSettings = () => {
  const restartRequiredSettings =
    getRestartRequiredFromModified(modifiedSettings);
  const restartRequiredSet = new Set(restartRequiredSettings);

  if (restartRequiredSet.size > 0) {
    saveModifiedSettings(
      restartRequiredSet,
      pendingSettings,
      settings,
      selectedScope,
    );

    // Clear from global pending
    setGlobalPendingChanges((prev) => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      for (const key of restartRequiredSet) {
        next.delete(key);
      }
      return next;
    });
  }
};
```

---

## Layout Structure

### Overall Component Structure

```
+------------------------------------------------------------------+
| > Settings                                                        |
+------------------------------------------------------------------+
| +--------------------------------------------------------------+ |
| | Search to filter                                  [TextInput] | |
| +--------------------------------------------------------------+ |
|                                                                  |
| [Scroll Up Arrow: triangle]                                      |
|                                                                  |
| [dot] Setting Label 1                              value*        |
|                                                                  |
| [dot] Setting Label 2                              value         |
|                                                                  |
| [dot] Setting Label 3 (Modified in Workspace)      true*         |
|                                                                  |
| [dot] Setting Label 4                              [editing...]  |
|                                                                  |
| [Scroll Down Arrow: triangle]                                    |
|                                                                  |
+------------------------------------------------------------------+
| > Apply To                                                       |
|   (o) User Settings                                              |
|   ( ) Workspace Settings                                         |
|   ( ) System Settings                                            |
+------------------------------------------------------------------+
| (Use Enter to select, Tab to change focus, Esc to close)         |
| [Warning: Restart required - Press r to apply]                   |
+------------------------------------------------------------------+
```

### Height Calculation Logic

```typescript
// Lines 449-518 of SettingsDialog.tsx
const DIALOG_PADDING = 4;
const SETTINGS_TITLE_HEIGHT = 2;
const SCROLL_ARROWS_HEIGHT = 2;
const SPACING_HEIGHT = 1;
const SCOPE_SELECTION_HEIGHT = 4;
const BOTTOM_HELP_TEXT_HEIGHT = 1;
const RESTART_PROMPT_HEIGHT = showRestartPrompt ? 1 : 0;

let currentAvailableTerminalHeight =
  availableTerminalHeight ?? Number.MAX_SAFE_INTEGER;
currentAvailableTerminalHeight -= 2; // Borders

let totalFixedHeight =
  DIALOG_PADDING +
  SETTINGS_TITLE_HEIGHT +
  SCROLL_ARROWS_HEIGHT +
  SPACING_HEIGHT +
  BOTTOM_HELP_TEXT_HEIGHT +
  RESTART_PROMPT_HEIGHT;

// Calculate available height for settings list
let availableHeightForSettings = Math.max(
  1,
  currentAvailableTerminalHeight - totalFixedHeight,
);

// Each setting takes 2 lines (item + spacing)
let maxVisibleItems = Math.max(1, Math.floor(availableHeightForSettings / 2));

// Conditionally hide scope selection for very small terminals
let showScopeSelection = true;
if (availableTerminalHeight && availableTerminalHeight < 25) {
  // Compare with/without scope selection to maximize visible settings
  const maxItemsWithScope = /* calculate */;
  if (maxVisibleItems > maxItemsWithScope + 1) {
    showScopeSelection = false;
  } else {
    totalFixedHeight += SCOPE_SELECTION_HEIGHT;
    // Recalculate...
  }
}
```

### Setting Item Rendering

```typescript
// Lines 894-1018 of SettingsDialog.tsx
{visibleItems.map((item, idx) => {
  const isActive =
    focusSection === 'settings' &&
    activeSettingIndex === idx + scrollOffset;

  // Calculate display value with modification indicator (*)
  let displayValue: string;
  // ... (complex value resolution logic)

  const shouldBeGreyedOut = isDefaultValue(item.value, scopeSettings);

  const scopeMessage = getScopeMessageForSetting(
    item.value,
    selectedScope,
    settings,
  );

  return (
    <React.Fragment key={item.value}>
      <Box marginX={1} flexDirection="row" alignItems="center">
        <Box minWidth={2} flexShrink={0}>
          <Text color={isActive ? theme.status.success : theme.text.secondary}>
            {isActive ? 'bullet' : ''}
          </Text>
        </Box>
        <Box minWidth={50}>
          <Text color={isActive ? theme.status.success : theme.text.primary}>
            {item.label}
            {scopeMessage && (
              <Text color={theme.text.secondary}> {scopeMessage}</Text>
            )}
          </Text>
        </Box>
        <Box minWidth={3} />
        <Text color={
          isActive
            ? theme.status.success
            : shouldBeGreyedOut
              ? theme.text.secondary
              : theme.text.primary
        }>
          {displayValue}
        </Text>
      </Box>
      <Box height={1} />
    </React.Fragment>
  );
})}
```

---

## Navigation State Machine

```
                                 +------------------+
                                 |   Initial Load   |
                                 +--------+---------+
                                          |
                                          v
               +---------------------------------------------------+
               |               SETTINGS SECTION                     |
               |  (focusSection === 'settings')                    |
               |                                                    |
               |  +-------------------------------------------+     |
               |  |            BROWSE MODE                    |     |
               |  |  (editingKey === null)                   |     |
               |  |                                           |     |
               |  |  Up/Down/j/k -> navigate settings        |     |
               |  |  Enter -> toggle OR start edit           |     |
               |  |  0-9 -> quick number edit start          |     |
               |  |  Ctrl+C -> reset to default              |     |
               |  |  Tab -> switch to Scope section          |     |
               |  |  Esc -> save + close dialog              |     |
               |  +-------------------------------------------+     |
               |            |                    ^                  |
               |            | Enter/digit        | Esc/Enter        |
               |            v                    |                  |
               |  +-------------------------------------------+     |
               |  |            EDIT MODE                      |     |
               |  |  (editingKey !== null)                   |     |
               |  |                                           |     |
               |  |  Characters -> insert at cursor          |     |
               |  |  Backspace/Delete -> remove char         |     |
               |  |  Left/Right -> move cursor               |     |
               |  |  Home/End -> cursor boundaries           |     |
               |  |  Esc/Enter -> commit edit                |     |
               |  |  (All other keys blocked)                |     |
               |  +-------------------------------------------+     |
               +---------------------------------------------------+
                              |          ^
                             Tab        Tab
                              v          |
               +---------------------------------------------------+
               |                 SCOPE SECTION                     |
               |  (focusSection === 'scope')                      |
               |                                                    |
               |  Up/Down/j/k -> navigate scope options           |
               |  Enter -> select scope + return to settings      |
               |  Tab -> switch to Settings section               |
               |  Esc -> save + close dialog                      |
               +---------------------------------------------------+

          +------------------------------------------------------------+
          |                    RESTART PROMPT                          |
          |  (showRestartPrompt === true)                             |
          |                                                            |
          |  'r' key -> save restart-required settings + trigger      |
          |             restart + close dialog                        |
          +------------------------------------------------------------+
```

### State Transitions Summary

| Current State | Input | Next State | Action |
|--------------|-------|------------|--------|
| Browse | Up/k | Browse | Move selection up (wrap) |
| Browse | Down/j | Browse | Move selection down (wrap) |
| Browse | Enter | Edit/Browse | Start edit OR toggle value |
| Browse | 0-9 | Edit | Start number edit with digit |
| Browse | Ctrl+C | Browse | Reset setting to default |
| Browse | Tab | Scope | Switch focus to scope section |
| Browse | Esc | Close | Save + close dialog |
| Edit | Characters | Edit | Insert at cursor |
| Edit | Backspace | Edit | Delete char before cursor |
| Edit | Delete | Edit | Delete char at cursor |
| Edit | Left/Right | Edit | Move cursor |
| Edit | Esc/Enter | Browse | Commit edit |
| Scope | Up/Down/j/k | Scope | Navigate scope options |
| Scope | Enter | Browse | Select scope + switch focus |
| Scope | Tab | Browse | Switch focus to settings |
| Any | 'r' (w/ prompt) | Close | Save restart settings + restart |

---

## Implementation Recommendations

### For FloMaster CLI (Ink)

1. **Settings Schema Pattern**
   - Create a centralized `settingsSchema.ts` with hierarchical structure
   - Include metadata: `type`, `label`, `category`, `requiresRestart`, `showInDialog`
   - Use `properties` for nested settings
   - Provide `options` array for enum types

2. **Schema Utilities**
   - Implement `flattenSchema()` for dot-notation key access
   - Provide `getSettingDefinition(key)` lookup function
   - Create `getDialogSettingKeys()` to filter visible settings
   - Add `requiresRestart(key)` check function

3. **Search Implementation**
   - Use `fzf` package for async fuzzy search
   - Search by label, not key (more user-friendly)
   - Maintain `searchMap` for label-to-key resolution
   - Reset selection on search results change

4. **Form Controls**
   - Boolean: Simple toggle on Enter
   - Enum: Cycle through options on Enter
   - String/Number: Inline edit mode with cursor
   - Use `chalk.inverse()` for cursor rendering

5. **Keyboard Handling**
   - Separate browse mode vs edit mode
   - Block all non-edit keys during edit mode
   - Support vim-style navigation (j/k)
   - Implement Tab for section switching

6. **State Management**
   - Track `pendingSettings` locally
   - Track `modifiedSettings` as `Set<string>`
   - Use `globalPendingChanges` Map for scope persistence
   - Separate immediate save vs restart-required save

7. **Height Management**
   - Calculate fixed heights for UI chrome
   - Compute available height for scrollable content
   - Conditionally hide optional sections (scope selector)
   - Show scroll indicators when list exceeds viewport

### For FloMaster UI (React/Web)

1. **Schema Approach**
   - Same schema structure works for web
   - Use Zod for runtime validation
   - Generate TypeScript types from schema

2. **Search**
   - Consider `fuse.js` or native fuzzy search
   - Debounce search input (300ms)

3. **Form Controls**
   - Use Radix UI primitives (Switch, Select, Input)
   - Apply CVA variants for consistent styling

4. **State Management**
   - Use Zustand store for settings state
   - React Query for settings persistence

5. **Layout**
   - Use dialog/modal pattern from Radix
   - Two-column layout: sidebar + content
   - Sticky header with search

---

## File References

| File | Purpose |
|------|---------|
| `SettingsDialog.tsx` | Main component (1068 lines) |
| `settingsSchema.ts` | Schema definition (1932 lines) |
| `settingsUtils.ts` | Schema utilities (499 lines) |
| `settings.ts` | Settings loading/saving (845 lines) |
| `dialogScopeUtils.ts` | Scope helpers (72 lines) |
| `RadioButtonSelect.tsx` | Scope selector component |
| `TextInput.tsx` | Search input component |
| `text-buffer.ts` | Text editing state machine |
| `keyBindings.ts` | Keyboard command definitions |
| `keyMatchers.ts` | Key matching utilities |

---

*Analysis completed for FloMaster implementation reference.*
