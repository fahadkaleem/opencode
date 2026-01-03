---
paths: src/features/**/components/**/*.tsx
---

# Feature Component Guidelines

> Rules for creating feature-specific components in `src/features/*/components/`. Auto-loaded when working with feature component files.

---

## Context

Feature components are **specific to a single feature** (MessageBubble, ChatInput, etc.) and are NOT shared across features. They MUST NOT use `forwardRef`, MUST NOT spread props, and use explicit props only. Semantic tokens ensure theming works automatically.

---

## File Structure

```
[component-name]/
├── [component-name].tsx
├── [component-name].stories.tsx
├── [component-name].test.tsx
└── index.ts
```

---

## Code Order

1. Imports (external → `@/` internal → relative)
2. Types (props type, always exported)
3. Constants (component-specific only, optional)
4. Variants (CVA definition, if needed)
5. Component (the implementation)
6. displayName
7. Exports (named only)

---

## Location

**This file applies to:** `src/features/*/components/*`

## Rules for Feature Components

| Requirement | Rule | Reason |
|-------------|------|--------|
| **forwardRef** | FORBIDDEN | Feature components don't need ref forwarding |
| **Spread Props** | FORBIDDEN | Explicit props only for clarity |
| **Extend HTML Attributes** | FORBIDDEN | Plain object props only |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `message-bubble/` |
| File | kebab-case | `message-bubble.tsx` |
| Component | PascalCase | `MessageBubble` |
| Props type | `[Component]Props` | `MessageBubbleProps` |
| Variants const | `[component]Variants` | `messageBubbleVariants` |
| Variant keys | camelCase | `variant`, `size` |
| Boolean props | `is`/`has` prefix or adjective | `isLoading`, `disabled` |
| Event handlers | `on` + Event | `onClick`, `onSend` |

---

<rules>

## Do

- Export the props type (consumers need it for typing)
- Include `className` prop for style customization
- Use CVA when component has 2+ visual variants
- Use semantic tokens from THEMING.md (`bg-background`, `text-foreground`)
- Set `displayName` for React DevTools debugging
- Use named exports in index.ts barrel file

## Don't

- Default exports → Use named exports
- Multiple exported components per file → One exported component per file
- Hooks in component file → Extract to `hooks/[use-hook-name].ts`
- Helper functions in component file → Extract to `utils/[function-name].ts`
- Raw colors (`#fff`, `red-500`) → Use semantic tokens (`text-foreground`)
- `export *` in barrel → Use explicit named exports

## When

- WHEN creating a feature component → **NEVER use `forwardRef`** (use plain function)
- WHEN defining props → **List each prop explicitly** (NO `...props` spreading)
- WHEN defining props type → **Use plain object** (NO HTML attributes extension)
- WHEN 2+ variants exist → Define CVA variants outside component
- WHEN component needs loading state → Add `isLoading` prop with Spinner
- WHEN variants need different JSX (not just classes) → Internal variant components OK if not exported

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
```

---

<example>

## Complete Example: Feature Component

A feature component in `src/features/chat/components/`. Demonstrates: NO forwardRef, NO props spreading, explicit props only.

```tsx
// ============================================================
// FILE: src/features/chat/components/message-bubble/message-bubble.tsx
// Location: src/features/ (feature component)
// Demonstrates: Feature component pattern (no forwardRef, no spread)
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
export type MessageBubbleProps = VariantProps<typeof messageBubbleVariants> & {
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;                                        // Rule: Boolean is- prefix
  onRetry?: () => void;                                         // Rule: Event handler on- prefix
  className?: string;
};                                                              // Rule: NO HTML attributes extension

// ------------------------------------------------------------
// 3. VARIANTS
// ------------------------------------------------------------
const messageBubbleVariants = cva(
  'rounded-lg px-4 py-2 max-w-prose',
  {
    variants: {
      role: {
        user: 'bg-primary text-primary-foreground ml-auto',     // Rule: Semantic tokens
        assistant: 'bg-muted text-foreground',
      },
    },
    defaultVariants: {
      role: 'assistant',
    },
  }
);

// ------------------------------------------------------------
// 4. COMPONENT (no forwardRef for features/)
// ------------------------------------------------------------
function MessageBubble({                                        // Rule: NO forwardRef for features/
  content,
  timestamp,
  role,
  isStreaming,
  onRetry,
  className,
}: MessageBubbleProps) {                                        // Rule: Explicit props, NO ...props spread
  return (
    <div className={cn(messageBubbleVariants({ role }), className)}>
      <p>{content}</p>
      {timestamp && (
        <time className="text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString()}
        </time>
      )}
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline">
          Retry
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 5. DISPLAY NAME
// ------------------------------------------------------------
MessageBubble.displayName = 'MessageBubble';                    // Rule: Still required

// ------------------------------------------------------------
// 6. EXPORTS
// ------------------------------------------------------------
export { MessageBubble, messageBubbleVariants };
```

</example>
