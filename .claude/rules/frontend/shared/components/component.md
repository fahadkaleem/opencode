---
paths: src/components/ui/**/*.tsx
---

# Shared UI Component Guidelines

> Rules for creating reusable UI primitives in `src/components/ui/`. Auto-loaded when working with shared component files.

---

## Context

Shared UI components are **reusable primitives** (Button, Input, Dialog, etc.) used across the entire application. They MUST use `forwardRef` for composition, spread props for flexibility, and extend HTML attributes. Semantic tokens ensure theming works automatically.

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

**This file applies to:** `src/components/ui/*`

## Rules for Shared UI Components

| Requirement | Rule | Reason |
|-------------|------|--------|
| **forwardRef** | REQUIRED | Enables composition and ref forwarding |
| **Spread Props** | REQUIRED `{...props}` | Maximum flexibility for consumers |
| **Extend HTML Attributes** | REQUIRED | Type safety for native element props |

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

- WHEN creating a UI primitive → **ALWAYS use `forwardRef`**
- WHEN 2+ variants exist → Define CVA variants outside component
- WHEN component needs loading state → Add `isLoading` prop with Spinner
- WHEN extending HTML element → **ALWAYS extend `React.*HTMLAttributes`**
- WHEN variants need different JSX (not just classes) → Internal variant components OK if not exported
- WHEN using internal variant components → **Forward ref through each variant to root element**
- WHEN in doubt → **Spread `{...props}` onto the root element**

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
```

---

<example>

## Complete Example: UI Primitive

A primitive button component in `src/components/ui/button/`. Demonstrates: forwardRef, CVA variants, props spreading, semantic tokens, event handlers, displayName, named exports.

```tsx
// ============================================================
// FILE: src/components/ui/button/button.tsx
// Location: src/components/ui/ (primitive)
// Demonstrates: All component guidelines for ui/ primitives
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS (external → @/ → relative)
// ------------------------------------------------------------
import { Slot } from '@radix-ui/react-slot';                    // Rule: External first
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';                               // Rule: @/ imports second

import { Spinner } from '../spinner';                           // Rule: Relative imports last

// ------------------------------------------------------------
// 2. TYPES (exported props type)
// ------------------------------------------------------------
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &  // Rule: Extend HTML attributes for ui/
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;                                        // Rule: Boolean with is- prefix
    asChild?: boolean;
    onLoadingComplete?: () => void;                             // Rule: Event handler on- prefix
  };

// ------------------------------------------------------------
// 3. VARIANTS (CVA outside component)
// ------------------------------------------------------------
const buttonVariants = cva(                                     // Rule: camelCase + Variants
  // Base styles using semantic tokens
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {                                                // Rule: camelCase variant keys
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',      // Rule: Semantic tokens
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-transparent hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// ------------------------------------------------------------
// 4. COMPONENT (forwardRef for ui/ primitives)
// ------------------------------------------------------------
const Button = forwardRef<HTMLButtonElement, ButtonProps>(      // Rule: forwardRef for ui/
  ({ className, variant, size, isLoading, disabled, asChild, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}                                               // Rule: Forward ref to root
        className={cn(
          buttonVariants({ variant, size }),
          isLoading && 'cursor-wait',
          className                                             // Rule: className prop for customization
        )}
        disabled={disabled || isLoading}
        onClick={onClick}                                       // Rule: Pass through event handlers
        {...props}                                              // Rule: Spread props for ui/
      >
        {isLoading ? <Spinner className="h-4 w-4" /> : children}
      </Comp>
    );
  }
);

// ------------------------------------------------------------
// 5. DISPLAY NAME
// ------------------------------------------------------------
Button.displayName = 'Button';                                  // Rule: Required for DevTools

// ------------------------------------------------------------
// 6. EXPORTS (named only)
// ------------------------------------------------------------
export { Button, buttonVariants };                              // Rule: Named exports, no default
```

```tsx
// ============================================================
// FILE: src/components/ui/button/index.ts
// Barrel file with explicit named exports
// ============================================================
export { Button, buttonVariants } from './button';              // Rule: Explicit named exports
export type { ButtonProps } from './button';                    // Rule: Export types
```

</example>

---

