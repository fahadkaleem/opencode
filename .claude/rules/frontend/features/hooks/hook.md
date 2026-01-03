---
paths: src/features/**/hooks/use-*.ts
---

# Feature Hook Guidelines

> Rules for creating custom React hooks. Read this when implementing a `use-[name].ts` file.

---

## Context

Hooks encapsulate reusable stateful logic. Each hook does ONE thing well. Data fetching hooks (TanStack Query) go in `api/` folder, not `hooks/`. All hooks must be copy-paste ready for production Electron app.

---

## File Structure

```
hooks/
├── use-[hook-name].ts          # Hook implementation
└── use-[hook-name].test.ts     # Hook tests
```

---

## Code Order

1. Imports (React hooks, utilities, types)
2. Types (options type, return type)
3. Constants (default values, if any)
4. Hook (the function)
5. Exports (named only)

---

## Location Rules

| Category | Location | Example |
|----------|----------|---------|
| Shared hooks | `src/hooks/` | `useToggle`, `useLocalStorage` |
| Feature hooks | `src/features/[feature]/hooks/` | `useChatInput`, `useMessageScroll` |
| Data fetching | `src/features/[feature]/api/` | `useMessages`, `useCreateMessage` |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | `use-` + kebab-case + `.ts` | `use-toggle.ts` |
| Hook function | `use` + PascalCase | `useToggle` |
| Options type | `Use[Name]Options` | `UseToggleOptions` |
| Return type | `Use[Name]Return` | `UseToggleReturn` |
| State variable | camelCase | `isOpen`, `value` |
| Setter function | `set[State]` | `setIsOpen`, `setValue` |
| Action function | verb | `toggle`, `reset`, `increment` |
| Ref | `[name]Ref` | `elementRef`, `timerRef` |

---

## Return Pattern

| Values Returned | Pattern | Example |
|-----------------|---------|---------|
| 1 value | Direct return | `return count;` |
| 2 values | Tuple with `as const` | `return [value, setValue] as const;` |
| 3+ values | Object | `return { value, setValue, reset };` |

---

<rules>

## Do

- One hook per file
- Always type options and return explicitly
- Memoize callbacks with `useCallback`
- Memoize expensive computations with `useMemo`
- Use function declarations (not arrow functions) for hooks
- Export the hook and its types

## Don't

- Multiple hooks in one file → Split into separate files
- Data fetching in `hooks/` → Use `api/` folder with TanStack Query
- Default exports → Use named exports only
- Inline types → Define and export `Options` and `Return` types
- Skip memoization on callbacks → Always use `useCallback`

## When

- WHEN 1-2 required params → Use direct parameters
- WHEN 3+ params or optional params → Use options object
- WHEN hook reads from browser/globals → Parameterless hook is valid
- WHEN returning 2 values (state + setter) → Use tuple with `as const`
- WHEN returning 3+ values → Use object return
- WHEN using timers/intervals → Return cleanup function from `useEffect`
- WHEN fetching data → Use `AbortController` and abort in cleanup
- WHEN adding event listeners → Remove in cleanup function
- WHEN callback shouldn't trigger effect re-runs → Store in `useRef`

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
npm run test -- use-[hook-name]    # Run hook tests
```

---

<example>

## Complete Example: Shared Hook

A toggle hook in `src/hooks/`. Demonstrates: types, memoization, object return, named exports.

```typescript
// ============================================================
// FILE: src/hooks/use-toggle.ts
// Demonstrates: All hook guidelines
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { useState, useCallback } from 'react';                  // Rule: React hooks first

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
export type UseToggleOptions = {                                // Rule: Export options type
  /** Initial toggle state */
  initialValue?: boolean;
};

export type UseToggleReturn = {                                 // Rule: Export return type
  /** Current toggle state */
  isOn: boolean;
  /** Turn on */
  on: () => void;
  /** Turn off */
  off: () => void;
  /** Toggle between on/off */
  toggle: () => void;
  /** Set to specific value */
  set: (value: boolean) => void;
};

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
const DEFAULT_INITIAL_VALUE = false;

// ------------------------------------------------------------
// 4. HOOK
// ------------------------------------------------------------
function useToggle(options: UseToggleOptions = {}): UseToggleReturn {  // Rule: Function declaration
  const { initialValue = DEFAULT_INITIAL_VALUE } = options;

  const [isOn, setIsOn] = useState(initialValue);

  // Rule: Memoize all callbacks
  const on = useCallback(() => setIsOn(true), []);
  const off = useCallback(() => setIsOn(false), []);
  const toggle = useCallback(() => setIsOn((prev) => !prev), []);
  const set = useCallback((value: boolean) => setIsOn(value), []);

  // Rule: Object return for 3+ values
  return { isOn, on, off, toggle, set };
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { useToggle };                                           // Rule: Named export only
```

</example>

---

<example>

## Contrast: Feature Hook

A hook in `src/features/chat/hooks/`. Same structure, just different location.

```typescript
// ============================================================
// FILE: src/features/chat/hooks/use-auto-scroll.ts
// Demonstrates: Feature hook (same rules, feature location)
// ============================================================

import { useEffect, useRef, useCallback } from 'react';

export type UseAutoScrollOptions = {
  /** Whether auto-scroll is enabled */
  enabled?: boolean;
  /** Scroll behavior */
  behavior?: ScrollBehavior;
};

export type UseAutoScrollReturn = {
  /** Ref to attach to scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Manually scroll to bottom */
  scrollToBottom: () => void;
};

function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const { enabled = true, behavior = 'smooth' } = options;

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior,
    });
  }, [behavior]);

  useEffect(() => {
    if (enabled) {
      scrollToBottom();
    }
  }, [enabled, scrollToBottom]);

  return { containerRef, scrollToBottom };
}

export { useAutoScroll };
```

</example>
