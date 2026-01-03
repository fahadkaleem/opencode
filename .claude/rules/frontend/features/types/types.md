---
paths: src/features/**/types/**/*.ts, src/features/**/types/index.ts
---

# Feature Types Guidelines

> Rules for creating TypeScript types in `src/features/*/types/`. Read this when defining types for a feature module.

---

## Context

Types centralize all TypeScript definitions for a feature in one place. This makes types discoverable, reusable within the feature, and exportable via the feature barrel. Prefer `type` over `interface` for consistency. Use union types instead of enums for better tree-shaking and type inference.

---

## File Structure

```
types/
└── index.ts                      # All feature types (single file)
```

For complex features with many types:
```
types/
├── message.ts                    # Domain-specific types
├── tool.ts                       # Domain-specific types
└── index.ts                      # Re-exports all types
```

---

## Code Order

1. File header comment (feature name)
2. Imports (React types, external types)
3. Type sections (grouped by domain with section headers)
4. Exports (inline with type declarations)

---

## Location Rules

| Category | Location | Example |
|----------|----------|---------|
| Feature types | `src/features/[feature]/types/` | `chat/types/index.ts` |
| Shared types | `src/types/` | `src/types/index.ts` |
| Component props | In component file | `message-bubble.tsx` |

---

## Naming

### Type Names

| Item | Convention | Example |
|------|------------|---------|
| Object types | PascalCase, descriptive noun | `Message`, `ToolCall`, `NavItem` |
| Props types | `[Component]Props` | `MessageBubbleProps` |
| State types | `[Domain]State` | `ChatState` |
| Union types | PascalCase, singular | `MessageRole`, `ToolStatus` |
| Generic params | Single uppercase letter | `T`, `K`, `V` |
| Config/options | `[Domain]Config` or `[Domain]Options` | `NavAreaConfig` |

### Type Suffixes

| Suffix | Use When | Example |
|--------|----------|---------|
| `Type` | Distinguishing from component name | `NavItemType` (vs `NavItem` component) |
| `Props` | Component props | `ButtonProps` |
| `State` | Zustand/React state | `ChatState` |
| `Config` | Configuration objects | `NavAreaConfig` |
| `Options` | Function options | `UseToggleOptions` |
| `Return` | Hook return types | `UseToggleReturn` |

### Property Names

| Property Type | Convention | Example |
|---------------|------------|---------|
| Booleans | `is`/`has`/`can` prefix or adjective | `isActive`, `hasIcon`, `disabled` |
| Handlers | `on` + Event | `onClick`, `onSubmit` |
| Render props | `render` + What | `renderIcon`, `renderLabel` |
| Collections | Plural nouns | `items`, `messages`, `children` |

---

<rules>

## Do

- Use `type` keyword (not `interface`) for consistency
- Use union types instead of enums (`'user' | 'assistant'` not `enum Role`)
- Add JSDoc comments with `/** */` for all exported types
- Group related types with section header comments
- Export all public types inline (`export type X = ...`)
- Use template literal types for constrained strings (`href: \`/\${string}\``)

## Don't

- `interface` keyword → Use `type` for consistency
- `enum` keyword → Use union types (`'a' | 'b' | 'c'`)
- Default exports → Use named exports only
- Skip JSDoc → Document all exported types
- Types in component files → Centralize in `types/` (except props)
- Duplicate types across features → Move to `src/types/` if shared

## When

- WHEN type is used by multiple files in feature → Place in `types/index.ts`
- WHEN type is component props → Keep in component file, export from barrel
- WHEN type is used by multiple features → Move to `src/types/`
- WHEN union has 4+ values → Extract to named type
- WHEN object has 5+ properties → Add JSDoc for each property
- WHEN type is generic → Document type parameters in JSDoc

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
```

---

<example>

## Complete Example: Feature Types

A chat feature with message and tool types. Demonstrates: section headers, JSDoc, union types, proper naming.

```typescript
// ============================================================================
// FILE: src/features/chat/types/index.ts
// Demonstrates: All types guidelines
// ============================================================================

// ============================================================================
// CHAT FEATURE TYPES
// ============================================================================

import type { ReactNode } from 'react';                        // Rule: Import React types

// ----------------------------------------------------------------------------
// MESSAGE TYPES
// ----------------------------------------------------------------------------

/** Message sender role */                                     // Rule: JSDoc for all types
export type MessageRole = 'user' | 'assistant' | 'system';    // Rule: Union, not enum

/** Tool execution states */
export type ToolCallStatus =
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'success'
  | 'error';

/** Tool types supported by the agent */
export type ToolType =
  | 'read'
  | 'write'
  | 'edit'
  | 'bash'
  | 'grep';

/** Tool execution record */
export type ToolCall = {                                       // Rule: PascalCase type name
  /** Unique identifier */
  id: string;
  /** Type of tool being executed */
  type: ToolType;
  /** Current execution status */
  status: ToolCallStatus;
  /** Display title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Tool output (when complete) */
  output?: string;
  /** Error message (when failed) */
  error?: string;
};

/** A single message in the conversation */
export type Message = {
  /** Unique identifier */
  id: string;
  /** Who sent the message */
  role: MessageRole;
  /** Message text content */
  content: string;
  /** When the message was created */
  timestamp: Date;
  /** Tool calls within this message */
  toolCalls?: ToolCall[];
  /** Whether content is still streaming */
  isStreaming?: boolean;                                       // Rule: is- prefix for boolean
  /** Whether generation was interrupted */
  isInterrupted?: boolean;
};

// ----------------------------------------------------------------------------
// CHAT BLOCK TYPES (for rendering)
// ----------------------------------------------------------------------------

/** User message block */
export type UserBlock = {
  type: 'user';                                                // Rule: Discriminated union
  id: string;
  content: string;
};

/** Assistant text block */
export type AssistantTextBlock = {
  type: 'assistant-text';
  id: string;
  content: string;
  isStreaming?: boolean;
};

/** Tool call block */
export type ToolCallBlock = {
  type: 'tool-call';
  id: string;
  toolName: string;
  status: 'running' | 'success' | 'error';
  title: string;
  output?: string;
};

/** Union of all chat block types */
export type ChatBlock =                                        // Rule: Union of related types
  | UserBlock
  | AssistantTextBlock
  | ToolCallBlock;

// ----------------------------------------------------------------------------
// STATE TYPES
// ----------------------------------------------------------------------------

/** Chat feature state */
export type ChatState = {                                      // Rule: State suffix
  /** All messages in conversation */
  messages: Message[];
  /** Whether AI is generating */
  isGenerating: boolean;
  /** Current error (if any) */
  error: string | null;
};

/** Chat feature actions */
export type ChatActions = {
  /** Add a new message */
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  /** Update existing message */
  updateMessage: (id: string, content: string) => void;
  /** Remove a message */
  removeMessage: (id: string) => void;
  /** Set generating state */
  setGenerating: (isGenerating: boolean) => void;
  /** Clear all messages */
  clearMessages: () => void;
  /** Reset to initial state */
  reset: () => void;
};
```

</example>

---

<example>

## Contrast: Navigation Types with Generics

Complex types with generics and template literals. Demonstrates: generic parameters, template literal types, factory function types.

```typescript
// ============================================================================
// FILE: src/features/navigation/types/index.ts
// Demonstrates: Generics, template literals, factory types
// ============================================================================

// ============================================================================
// NAVIGATION FEATURE TYPES
// ============================================================================

import type { ComponentType, ReactNode, SVGProps } from 'react';

// ----------------------------------------------------------------------------
// ICON TYPES
// ----------------------------------------------------------------------------

/** Icon component type - accepts standard SVG props */
export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    'data-hovered'?: boolean;
  }
>;

// ----------------------------------------------------------------------------
// NAVIGATION ITEM TYPES
// ----------------------------------------------------------------------------

/** Common properties for all navigation items */
export type NavItemCommon = {
  /** Display name */
  name: string;
  /** Route path (must start with /) */
  href: `/${string}`;                                          // Rule: Template literal type
  /** Only match exact path */
  exact?: boolean;
  /** Badge content */
  badge?: ReactNode;
  /** Item is disabled */
  locked?: boolean;
};

/** Navigation item with icon */
export type NavItemType = NavItemCommon & {
  /** Icon component */
  icon: IconComponent;
  /** Nested sub-items */
  items?: NavItemCommon[];
};

// ----------------------------------------------------------------------------
// FACTORY FUNCTION TYPES
// ----------------------------------------------------------------------------

/**
 * Factory function that returns navigation groups
 * @template T - Data type passed to factory                   // Rule: Document generics
 */
export type SidebarNavGroups<T extends Record<string, unknown>> = (
  args: T
) => NavGroupType[];

/**
 * Record of area factory functions
 * @template T - Data type passed to factories
 */
export type SidebarNavAreas<T extends Record<string, unknown>> = Record<
  string,
  (args: T) => NavAreaConfig
>;
```

</example>

---

<example>

## Contrast: Shared Types

Types in `src/types/` used across multiple features.

```typescript
// ============================================================================
// FILE: src/types/index.ts
// Demonstrates: Shared types location
// ============================================================================

/**
 * Shared types used across the application.
 * Feature-specific types belong in features/[feature]/types/
 */

// Re-export common React types for convenience
export type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ReactNode,
} from 'react';

// ----------------------------------------------------------------------------
// COMMON UTILITY TYPES
// ----------------------------------------------------------------------------

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Extract non-nullable type */
export type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

// ----------------------------------------------------------------------------
// API TYPES
// ----------------------------------------------------------------------------

/** Standard API error response */
export type ApiError = {
  message: string;
  code: string;
  status: number;
};

/** Paginated response wrapper */
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};
```

</example>
