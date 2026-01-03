---
paths:
  - src/components/**/*.tsx
  - src/components/**/*.stories.tsx
  - src/features/**/components/**/*.tsx
  - src/features/**/components/**/*.stories.tsx
  - tailwind.config.js
  - src/index.css
---

# Theming System

> **Single Source of Truth** - All design tokens for the Agent UI Prototype.
> When theme changes are needed, update ONLY this document.

---

## Overview

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Last Updated** | 2024-12-09 |
| **Color Format** | OKLCH (perceptually uniform) |
| **Design Inspiration** | Linear App |
| **Default Mode** | Dark |
| **Naming Convention** | Dub-style (`--bg-default`, `--text-muted`) |

### Design Philosophy

1. **Dark-first** - Designed for dark mode, light mode derived
2. **Muted & Professional** - Desaturated accent, minimal chrome
3. **Semantic tokens only** - Components never use primitives directly
4. **Agent-specific tokens** - Separate tokens for chat/tool UI

### Why OKLCH?

OKLCH is perceptually uniform - equal numeric steps produce visually equal changes. Benefits:
- Predictable darkening/lightening without hue shift
- Smoother gradients without muddy middle zones
- Easier dark mode - lightness values behave consistently
- Full browser support (2024+)

Format: `oklch(Lightness Chroma Hue)` where:
- **L**: 0-1 (0 = black, 1 = white)
- **C**: 0-0.4 (0 = gray, higher = more saturated)
- **H**: 0-360 (hue angle)

---

## Token Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMITIVE TOKENS (internal only - never use in components)     │
│  --neutral-950, --neutral-900, --accent-500, etc.              │
├─────────────────────────────────────────────────────────────────┤
│  SEMANTIC TOKENS (use these in components)                      │
│  --bg-default, --text-muted, --border-emphasis, etc.           │
├─────────────────────────────────────────────────────────────────┤
│  AGENT TOKENS (chat/tool specific)                              │
│  --chat-user-bg, --tool-success-text, etc.                     │
└─────────────────────────────────────────────────────────────────┘
```

**Rule**: Components ONLY use semantic or agent tokens. Never reference primitives.

---

## Primitive Tokens

> These define raw values. Do not use directly in components.

### Neutrals

Cool-tinted dark grays (not pure black) for comfortable dark UI.

```css
:root {
  /* Darkest to lightest */
  --neutral-950: oklch(0.13 0.004 265);  /* #0f0f12 - Darkest background */
  --neutral-900: oklch(0.17 0.004 265);  /* #17171c - Elevated surfaces */
  --neutral-850: oklch(0.21 0.004 265);  /* #1f1f26 - Cards, panels */
  --neutral-800: oklch(0.25 0.005 265);  /* #27272f - Hover states */
  --neutral-700: oklch(0.35 0.005 265);  /* #3d3d47 - Borders */
  --neutral-600: oklch(0.45 0.005 265);  /* #53535f - Subtle text */
  --neutral-500: oklch(0.55 0.005 265);  /* #6b6b78 - Muted text */
  --neutral-400: oklch(0.65 0.005 265);  /* #858592 - Secondary text */
  --neutral-300: oklch(0.75 0.005 265);  /* #a0a0ac - Primary text */
  --neutral-200: oklch(0.85 0.005 265);  /* #bcbcc6 - Emphasized text */
  --neutral-100: oklch(0.93 0.004 265);  /* #d8d8df - High contrast */
  --neutral-50:  oklch(0.98 0.002 265);  /* #f4f4f6 - Near white */
}
```

### Accent Colors

Desaturated blue-purple (Linear-inspired). Professional, not vibrant.

```css
:root {
  --accent-400: oklch(0.70 0.10 265);  /* #9A94D1 - Light accent */
  --accent-500: oklch(0.58 0.12 265);  /* #7B73C0 - Primary accent */
  --accent-600: oklch(0.48 0.14 265);  /* #6359A3 - Dark/pressed */
}
```

### Status Colors

```css
:root {
  --green-500: oklch(0.65 0.17 145);   /* #4ade80 - Success */
  --amber-500: oklch(0.75 0.15 85);    /* #fbbf24 - Warning */
  --red-500:   oklch(0.60 0.20 25);    /* #ef4444 - Error */
  --blue-500:  oklch(0.65 0.15 250);   /* #3b82f6 - Info */
}
```

---

## Semantic Tokens

> Use ONLY these tokens in components.

### Backgrounds

```css
:root {
  --bg-default:   var(--neutral-950);  /* Main app background */
  --bg-muted:     var(--neutral-900);  /* Slightly elevated (sidebars) */
  --bg-subtle:    var(--neutral-850);  /* Cards, panels, inputs */
  --bg-emphasis:  var(--neutral-800);  /* Hover states, active */
  --bg-inverted:  var(--neutral-50);   /* Inverted surfaces */
}
```

| Token | Use Case |
|-------|----------|
| `--bg-default` | Main page background |
| `--bg-muted` | Sidebar, secondary areas |
| `--bg-subtle` | Cards, panels, input fields |
| `--bg-emphasis` | Hover states, highlighted rows |
| `--bg-inverted` | Light surfaces on dark (rare) |

### Text / Foreground

```css
:root {
  --text-default:   var(--neutral-300);  /* Primary readable text */
  --text-muted:     var(--neutral-400);  /* Secondary, less important */
  --text-subtle:    var(--neutral-500);  /* Placeholders, hints */
  --text-emphasis:  var(--neutral-100);  /* Headings, important */
  --text-inverted:  var(--neutral-950);  /* Text on light backgrounds */
}
```

| Token | Use Case |
|-------|----------|
| `--text-default` | Body text, paragraphs |
| `--text-muted` | Secondary labels, metadata |
| `--text-subtle` | Placeholders, disabled, hints |
| `--text-emphasis` | Headings, bold statements |
| `--text-inverted` | Text on inverted/light bg |

### Borders

```css
:root {
  --border-default:   var(--neutral-700);  /* Standard borders */
  --border-muted:     var(--neutral-800);  /* Subtle separators */
  --border-subtle:    var(--neutral-850);  /* Very faint borders */
  --border-emphasis:  var(--neutral-600);  /* Strong borders, focus */
}
```

### Primary / Accent

```css
:root {
  --primary:            var(--accent-500);     /* Primary buttons, links */
  --primary-hover:      var(--accent-400);     /* Hover state */
  --primary-active:     var(--accent-600);     /* Pressed/active state */
  --primary-foreground: var(--neutral-50);     /* Text on primary bg */
}
```

### Status

```css
:root {
  --status-success:  var(--green-500);
  --status-warning:  var(--amber-500);
  --status-error:    var(--red-500);
  --status-info:     var(--blue-500);
}
```

### Focus Ring

```css
:root {
  --ring:        var(--accent-500);
  --ring-offset: var(--bg-default);
}
```

---

## Agent-Specific Tokens

> Tokens specific to chat UI, tool calls, and agent states.

### Agent State

```css
:root {
  --agent-thinking:  var(--accent-400);   /* Thinking indicator */
  --agent-streaming: var(--accent-500);   /* Streaming text */
  --agent-idle:      var(--neutral-500);  /* Idle/waiting */
}
```

### Chat Messages

```css
:root {
  /* User messages */
  --chat-user-bg:   var(--accent-600);
  --chat-user-text: var(--neutral-50);

  /* Assistant messages */
  --chat-assistant-bg:   var(--bg-subtle);
  --chat-assistant-text: var(--text-default);

  /* System messages */
  --chat-system-bg:   var(--bg-muted);
  --chat-system-text: var(--text-muted);
}
```

### Code Blocks

```css
:root {
  --code-bg:        var(--neutral-900);
  --code-text:      var(--neutral-200);
  --code-border:    var(--border-muted);
  --code-header-bg: var(--neutral-850);
}
```

### Tool Calls

```css
:root {
  /* Pending */
  --tool-pending-bg:   var(--bg-muted);
  --tool-pending-text: var(--text-muted);

  /* Running */
  --tool-running-bg:   var(--bg-subtle);
  --tool-running-text: var(--accent-400);

  /* Success */
  --tool-success-bg:   oklch(0.20 0.04 145);  /* Tinted green */
  --tool-success-text: var(--green-500);

  /* Error */
  --tool-error-bg:   oklch(0.20 0.04 25);     /* Tinted red */
  --tool-error-text: var(--red-500);
}
```

### Shimmer Effect

```css
:root {
  --shimmer-from: var(--neutral-500);  /* Muted gray text */
  --shimmer-via:  var(--neutral-50);   /* Near white highlight */
  --shimmer-to:   var(--neutral-500);  /* Back to muted gray */
}
```

| Token | Use Case |
|-------|----------|
| `--shimmer-from` | Start/end color (muted gray) |
| `--shimmer-via` | Highlight color (near white/black) |
| `--shimmer-to` | End color (muted gray) |

Use the `.shimmer-text` utility class combined with `.animate-shimmer` for animated text effects.

---

## Typography

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', ui-monospace, monospace;

  /* Font Sizes */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */

  /* Font Weights */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Line Heights */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

| Size | Use Case |
|------|----------|
| `--text-xs` | Badges, timestamps, labels |
| `--text-sm` | Secondary text, UI labels |
| `--text-base` | Body text, default |
| `--text-lg` | Subheadings |
| `--text-xl` | Section headings |
| `--text-2xl` | Page titles |
| `--text-3xl` | Hero text (rare) |

---

## Spacing

Based on 4px base unit.

```css
:root {
  --space-0:  0;
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

---

## Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm:   0.25rem;   /* 4px - Subtle rounding */
  --radius-md:   0.5rem;    /* 8px - Default for buttons, inputs */
  --radius-lg:   0.75rem;   /* 12px - Cards, panels */
  --radius-xl:   1rem;      /* 16px - Modals, large cards */
  --radius-2xl:  1.5rem;    /* 24px - Hero elements */
  --radius-full: 9999px;    /* Circles, pills */
}
```

---

## Shadows

Subtle shadows for dark theme (shadows are less visible on dark).

```css
:root {
  --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.4);
  --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.5), 0 1px 2px oklch(0 0 0 / 0.4);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.5), 0 2px 4px oklch(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.5), 0 4px 6px oklch(0 0 0 / 0.4);
  --shadow-xl: 0 20px 25px oklch(0 0 0 / 0.5), 0 8px 10px oklch(0 0 0 / 0.4);
}
```

---

## Transitions

```css
:root {
  --duration-fast:   75ms;
  --duration-normal: 150ms;
  --duration-slow:   300ms;

  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Light Theme

> Applied when `.light` class is on `<html>` or `<body>`.

```css
.light {
  /* Backgrounds - inverted scale */
  --bg-default:   var(--neutral-50);
  --bg-muted:     var(--neutral-100);
  --bg-subtle:    var(--neutral-200);
  --bg-emphasis:  var(--neutral-300);
  --bg-inverted:  var(--neutral-950);

  /* Text - inverted scale */
  --text-default:   var(--neutral-800);
  --text-muted:     var(--neutral-600);
  --text-subtle:    var(--neutral-500);
  --text-emphasis:  var(--neutral-950);
  --text-inverted:  var(--neutral-50);

  /* Borders - adjusted for light */
  --border-default:   var(--neutral-300);
  --border-muted:     var(--neutral-200);
  --border-subtle:    var(--neutral-100);
  --border-emphasis:  var(--neutral-400);

  /* Focus ring offset */
  --ring-offset: var(--bg-default);

  /* Chat - adjusted for light */
  --chat-assistant-bg: var(--neutral-100);
  --chat-system-bg:    var(--neutral-200);

  /* Code - adjusted for light */
  --code-bg:        var(--neutral-100);
  --code-text:      var(--neutral-800);
  --code-header-bg: var(--neutral-200);

  /* Tool calls - adjusted for light */
  --tool-pending-bg:   var(--neutral-100);
  --tool-running-bg:   var(--neutral-200);
  --tool-success-bg:   oklch(0.95 0.04 145);
  --tool-error-bg:     oklch(0.95 0.04 25);
}
```

---

## Usage Examples

### In CSS (direct)

```css
.card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.card-title {
  color: var(--text-emphasis);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}
```

### In Tailwind Config

Map tokens to Tailwind utilities:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--bg-default)',
          muted: 'var(--bg-muted)',
          subtle: 'var(--bg-subtle)',
          emphasis: 'var(--bg-emphasis)',
        },
        foreground: {
          DEFAULT: 'var(--text-default)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          emphasis: 'var(--text-emphasis)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          muted: 'var(--border-muted)',
          emphasis: 'var(--border-emphasis)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
};
```

### In Components (React + Tailwind)

```tsx
// Using Tailwind classes mapped to tokens
<div className="bg-background-subtle border border-border rounded-lg p-4">
  <h2 className="text-foreground-emphasis text-lg font-semibold">
    Card Title
  </h2>
  <p className="text-foreground-muted text-sm">
    Card description
  </p>
</div>
```

### In CVA Variants

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        secondary: 'bg-background-subtle text-foreground hover:bg-background-emphasis',
        ghost: 'hover:bg-background-subtle text-foreground-muted',
      },
    },
  }
);
```

---

## Token Quick Reference

### Backgrounds
| Token | Description |
|-------|-------------|
| `--bg-default` | Main background |
| `--bg-muted` | Secondary areas |
| `--bg-subtle` | Cards, inputs |
| `--bg-emphasis` | Hover, active |

### Text
| Token | Description |
|-------|-------------|
| `--text-default` | Primary text |
| `--text-muted` | Secondary text |
| `--text-subtle` | Hints, placeholders |
| `--text-emphasis` | Headings |

### Borders
| Token | Description |
|-------|-------------|
| `--border-default` | Standard |
| `--border-muted` | Subtle |
| `--border-emphasis` | Strong, focus |

### Agent
| Token | Description |
|-------|-------------|
| `--chat-user-bg` | User message bg |
| `--chat-assistant-bg` | Assistant message bg |
| `--tool-running-text` | Running tool indicator |
| `--tool-success-text` | Completed tool |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-09 | Initial theming system |
