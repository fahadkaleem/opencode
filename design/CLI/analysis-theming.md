# Gemini CLI Theming System Analysis

> SDK-Agnostic theming patterns for Ink-based CLI applications

---

## Executive Summary

The Gemini CLI implements a sophisticated theming system:

1. **SemanticColors Interface** - Purpose-driven color organization
2. **Theme Class** - Color palettes with syntax highlighting mappings
3. **ThemeManager Singleton** - Theme registration, switching, persistence
4. **Proxy Accessors** - Dynamic theme access without prop drilling
5. **Color Utilities** - Validation, resolution, interpolation

---

## 1. Semantic Colors Architecture

**File**: `packages/cli/src/ui/themes/semantic-tokens.ts:9-39`

```typescript
export interface SemanticColors {
  text: {
    primary: string;    // Main text color
    secondary: string;  // Muted/helper text
    link: string;       // Hyperlinks
    accent: string;     // Highlighted text
    response: string;   // AI response text
  };
  background: {
    primary: string;    // Main background
    diff: {
      added: string;    // Diff additions
      removed: string;  // Diff removals
    };
  };
  border: {
    default: string;    // Standard borders
    focused: string;    // Focused element borders
  };
  ui: {
    comment: string;    // Code comments
    symbol: string;     // UI symbols
    dark: string;       // Darker UI elements
    gradient: string[] | undefined;
  };
  status: {
    error: string;
    success: string;
    warning: string;
  };
}
```

### Key Design Patterns

- **Nested Organization**: Colors grouped by category
- **Purpose-Driven Naming**: Names describe purpose, not color
- **Semantic over Literal**: `status.error` instead of `red`
- **Gradient Support**: UI category supports optional gradient arrays

---

## 2. Theme Proxy Pattern

**File**: `packages/cli/src/ui/semantic-colors.ts:1-27`

Dynamic theme access via getter-based proxying:

```typescript
import { themeManager } from './themes/theme-manager.js';
import type { SemanticColors } from './themes/semantic-tokens.js';

export const theme: SemanticColors = {
  get text() {
    return themeManager.getSemanticColors().text;
  },
  get background() {
    return themeManager.getSemanticColors().background;
  },
  get border() {
    return themeManager.getSemanticColors().border;
  },
  get ui() {
    return themeManager.getSemanticColors().ui;
  },
  get status() {
    return themeManager.getSemanticColors().status;
  },
};
```

### Benefits

1. **No Prop Drilling**: Components import `theme` directly
2. **Dynamic Resolution**: Always gets current active theme
3. **Type Safety**: Full TypeScript support
4. **Simple API**: `theme.status.error` instead of `useTheme().semanticColors.status.error`
5. **No Re-renders**: Getters evaluate at access time

---

## 3. ThemeManager Implementation

**File**: `packages/cli/src/ui/themes/theme-manager.ts:39-331`

### Singleton Pattern

```typescript
class ThemeManager {
  private readonly availableThemes: Theme[];
  private activeTheme: Theme;
  private customThemes: Map<string, Theme> = new Map();

  constructor() {
    this.availableThemes = [
      AyuDark, AyuLight, AtomOneDark, Dracula,
      DefaultLight, DefaultDark, GitHubDark, GitHubLight,
      ANSI, ANSILight,
    ];
    this.activeTheme = DEFAULT_THEME;
  }
}

export const themeManager = new ThemeManager();
```

### Theme Switching

```typescript
setActiveTheme(themeName: string | undefined): boolean {
  const theme = this.findThemeByName(themeName);
  if (!theme) return false;
  this.activeTheme = theme;
  return true;
}
```

### NO_COLOR Support

```typescript
getActiveTheme(): Theme {
  // Respect NO_COLOR standard
  if (process.env['NO_COLOR']) {
    return NoColorTheme;
  }
  return this.activeTheme;
}
```

### Custom Theme Loading

```typescript
loadCustomThemes(customThemesSettings?: Record<string, CustomTheme>): void {
  this.customThemes.clear();

  for (const [name, config] of Object.entries(customThemesSettings ?? {})) {
    const validation = validateCustomTheme(config);
    if (validation.isValid) {
      const theme = createCustomTheme({
        ...DEFAULT_THEME.colors,
        ...config,
        type: 'custom',
      });
      this.customThemes.set(name, theme);
    }
  }
}
```

---

## 4. Theme Definition Patterns

### Base Color Palette

```typescript
export type ThemeType = 'light' | 'dark' | 'ansi' | 'custom';

export interface ColorsTheme {
  type: ThemeType;
  Background: string;
  Foreground: string;
  AccentBlue: string;
  AccentPurple: string;
  AccentGreen: string;
  AccentYellow: string;
  AccentRed: string;
  DiffAdded: string;
  DiffRemoved: string;
  Comment: string;
  Gray: string;
  GradientColors?: string[];
}
```

### Pre-defined Theme

```typescript
export const darkTheme: ColorsTheme = {
  type: 'dark',
  Background: '#1E1E2E',
  Foreground: '#CDD6F4',
  AccentBlue: '#89B4FA',
  AccentPurple: '#CBA6F7',
  AccentGreen: '#A6E3A1',
  AccentYellow: '#F9E2AF',
  AccentRed: '#F38BA8',
  DiffAdded: '#28350B',
  DiffRemoved: '#430000',
  Comment: '#6C7086',
  Gray: '#6C7086',
  GradientColors: ['#4796E4', '#847ACE', '#C3677F'],
};
```

### ANSI Fallback Theme

For terminals with limited color support:

```typescript
const ansiColors: ColorsTheme = {
  type: 'dark',
  Background: 'black',
  Foreground: 'white',
  AccentBlue: 'blue',
  AccentPurple: 'magenta',
  AccentGreen: 'green',
  AccentYellow: 'yellow',
  AccentRed: 'red',
  Comment: 'gray',
  GradientColors: ['cyan', 'green'],
};
```

---

## 5. Color Utilities

**File**: `packages/cli/src/ui/themes/color-utils.ts`

### Color Validation

```typescript
export function isValidColor(color: string): boolean {
  const lowerColor = color.toLowerCase();

  // Hex code
  if (lowerColor.startsWith('#')) {
    return /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(color);
  }

  // Ink supported name
  if (INK_SUPPORTED_NAMES.has(lowerColor)) return true;

  // CSS name
  if (CSS_NAME_TO_HEX_MAP[lowerColor]) return true;

  return false;
}
```

### Color Resolution

```typescript
export function resolveColor(colorValue: string): string | undefined {
  const lowerColor = colorValue.toLowerCase();

  // Hex codes pass through
  if (lowerColor.startsWith('#')) return lowerColor;

  // Ink names pass through
  if (INK_SUPPORTED_NAMES.has(lowerColor)) return lowerColor;

  // CSS names convert to hex
  if (CSS_NAME_TO_HEX_MAP[lowerColor]) return CSS_NAME_TO_HEX_MAP[lowerColor];

  return undefined;
}
```

### Color Interpolation

```typescript
import tinygradient from 'tinygradient';

export function interpolateColor(color1: string, color2: string, factor: number) {
  if (factor <= 0) return color1;
  if (factor >= 1) return color2;

  const gradient = tinygradient(color1, color2);
  return gradient.rgbAt(factor).toHexString();
}
```

---

## 6. Usage in Components

### Basic Usage

```typescript
import { theme } from '../semantic-colors.js';

// Text colors
<Text color={theme.text.primary}>Main content</Text>
<Text color={theme.text.secondary}>Helper text</Text>
<Text color={theme.text.accent}>Highlighted</Text>

// Status colors
<Text color={theme.status.error}>Error message</Text>
<Text color={theme.status.success}>Success!</Text>
<Text color={theme.status.warning}>Warning</Text>

// Border colors for focus
<Box borderColor={isFocused ? theme.border.focused : theme.border.default}>
```

### Gradient Support

```typescript
import Gradient from 'ink-gradient';

export const ThemedGradient = ({ children }) => {
  const gradient = theme.ui.gradient;

  if (gradient && gradient.length >= 2) {
    return (
      <Gradient colors={gradient}>
        <Text>{children}</Text>
      </Gradient>
    );
  }

  return <Text color={theme.text.accent}>{children}</Text>;
};
```

---

## 7. Recommendations for FloMaster CLI

### Suggested SemanticColors

```typescript
interface FloMasterSemanticColors {
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    link: string;
  };
  background: {
    primary: string;
    elevated: string;
    diff: { added: string; removed: string; };
  };
  border: {
    default: string;
    focused: string;
    active: string;
  };
  status: {
    error: string;
    success: string;
    warning: string;
    info: string;
  };
  workflow: {
    pending: string;
    running: string;
    completed: string;
    failed: string;
  };
  ui: {
    spinner: string;
    progress: string;
    highlight: string;
  };
}
```

### Implementation Approach

1. **Adopt SemanticColors Interface** - Customize for FloMaster needs
2. **Implement Theme Proxy Pattern** - Direct imports without context
3. **Create ThemeManager Singleton** - Manage themes centrally
4. **Support Multiple Theme Types** - Dark, Light, ANSI fallback, No-color

### Dependencies

- `tinygradient` - Color interpolation
- `ink-gradient` - Terminal gradient rendering (optional)
- `chalk` - Fallback/compatibility
