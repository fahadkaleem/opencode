# Theme and Styling System: OpenCode TUI

## Overview

The theme system provides 32+ built-in themes, dark/light mode support, transparent backgrounds, and syntax highlighting integration.

---

## Color Token Types

### UI Colors (8 tokens)
| Token | Purpose |
|-------|---------|
| `primary` | Primary brand color |
| `secondary` | Secondary brand color |
| `accent` | Accent/tertiary color |
| `error` | Error states |
| `warning` | Warning states |
| `success` | Success states |
| `info` | Informational |

### Text Colors (3 tokens)
| Token | Purpose |
|-------|---------|
| `text` | Primary text |
| `textMuted` | Secondary text |
| `selectedListItemText` | Selected item text |

### Background Colors (4 tokens)
| Token | Purpose |
|-------|---------|
| `background` | Base background |
| `backgroundPanel` | Elevated surface |
| `backgroundElement` | Element background |
| `backgroundMenu` | Menu background |

### Border Colors (3 tokens)
| Token | Purpose |
|-------|---------|
| `border` | Standard border |
| `borderActive` | Focus border |
| `borderSubtle` | Subtle dividers |

### Diff Colors (12 tokens)
| Token | Purpose |
|-------|---------|
| `diffAdded` | Added line text |
| `diffRemoved` | Removed line text |
| `diffContext` | Context line text |
| `diffAddedBg` | Added line background |
| `diffRemovedBg` | Removed line background |
| `diffContextBg` | Context line background |
| `diffHighlightAdded` | Added highlight |
| `diffHighlightRemoved` | Removed highlight |
| `diffLineNumber` | Line number text |
| `diffAddedLineNumberBg` | Added line number bg |
| `diffRemovedLineNumberBg` | Removed line number bg |

### Markdown Colors (14 tokens)
| Token | Purpose |
|-------|---------|
| `markdownHeading` | Headings |
| `markdownLink` | Link URLs |
| `markdownCode` | Inline code |
| `markdownBlockQuote` | Block quotes |
| `markdownEmph` | Emphasis |
| `markdownStrong` | Bold |

### Syntax Colors (9 tokens)
| Token | Purpose |
|-------|---------|
| `syntaxComment` | Comments |
| `syntaxKeyword` | Keywords |
| `syntaxFunction` | Functions |
| `syntaxVariable` | Variables |
| `syntaxString` | Strings |
| `syntaxNumber` | Numbers |
| `syntaxType` | Types |
| `syntaxOperator` | Operators |
| `syntaxPunctuation` | Punctuation |

---

## Built-in Themes (32)

aura, ayu, catppuccin, catppuccin-frappe, catppuccin-macchiato, cobalt2, cursor, dracula, everforest, flexoki, github, gruvbox, kanagawa, lucent-orng, material, matrix, mercury, monokai, nightowl, nord, one-dark, **opencode** (default), orng, osaka-jade, palenight, rosepine, solarized, synthwave84, tokyonight, vercel, vesper, zenburn

---

## Theme JSON Schema

```json
{
  "$schema": "...",
  "defs": {
    "colorName": "#hexvalue"
  },
  "theme": {
    "primary": { "dark": "colorRef", "light": "colorRef" },
    "background": "hexOrRef",
    "thinkingOpacity": 0.6
  }
}
```

**Color Values**:
- Hex: `"#282a36"`
- Reference: `"foreground"` (from defs)
- Variant: `{ "dark": "...", "light": "..." }`
- Transparent: `"transparent"` or `"none"`
- ANSI: `0-255`

---

## Context API

```typescript
const {
  theme,        // Current resolved theme
  selected,     // Active theme name
  all(),        // All available themes
  syntax,       // Syntax highlighting styles
  subtleSyntax, // Muted syntax for thinking
  mode(),       // "dark" | "light"
  setMode(m),   // Set color mode
  set(name),    // Set active theme
  ready,        // Theme loaded
} = useTheme()
```

---

## Usage Examples

### Basic
```tsx
<text fg={theme.text}>Primary text</text>
<box backgroundColor={theme.backgroundPanel}>...</box>
```

### Syntax Highlighting
```tsx
<code
  syntaxStyle={syntax()}
  content={code}
  fg={theme.text}
/>
```

### Diff
```tsx
<diff
  addedBg={theme.diffAddedBg}
  removedBg={theme.diffRemovedBg}
  contextBg={theme.diffContextBg}
/>
```

---

## Custom Themes

**Locations**:
- Global: `~/.config/opencode/themes/*.json`
- Project: `.opencode/themes/*.json`

**Format**: Same JSON schema as built-in themes.

---

## System Theme

Auto-generated from terminal ANSI palette:
- Background/foreground from terminal
- Gray scale generated via luminance
- ANSI colors mapped to semantic tokens

---

## Terminal Detection

Initial mode determined by background luminance:
- Luminance > 0.5 → "light"
- Otherwise → "dark"
