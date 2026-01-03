# General Coding Rules

## Example

```typescript
// Import organization
import * as crypto from 'node:crypto'; // 1. Node built-ins
import { z } from 'zod'; // 2. External deps
import { retry } from '../utils/retry.js'; // 3. Internal (.js ext)
import type { Config } from '../types.js'; // 4. Type-only imports

// Type guard with is return
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

// Async with AbortSignal
async function fetchUser(id: string, signal: AbortSignal): Promise<User> {
  const response = await fetch(`/api/users/${id}`, { signal });
  const data: unknown = await response.json(); // unknown from external
  if (!isUser(data)) throw new Error('Invalid data');
  return data;
}

// Functional pattern
const activeUsers = users.filter((u) => u.active).map((u) => u.name);
```

## Type Safety

- Use `unknown` with type narrowing - never `any`
- Type guards must return `value is Type`, not `boolean`
- Use `|` for union types (TypeScript 5.x syntax)
- Required annotations: function params, return types, class attributes, public
  API
- Optional annotations: local variables with obvious type, loop variables

## Naming Conventions

- **Variables**: `camelCase`
- **Functions**: `camelCase` + verb prefix (`getUserName`, `processData`)
- **Classes**: `PascalCase` nouns (`ToolRegistry`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RETRY_COUNT`)
- **Files (.ts)**: `kebab-case` (`tool-registry.ts`)
- **Files (.tsx)**: `PascalCase` (`ToolDialog.tsx`)
- **Private members**: `_camelCase` prefix (`private _cache`)
- **Type guards**: `isXxx` / `hasXxx` (`isNodeError`, `hasContent`)
- **React hooks**: `useXxx` (`useConfig`, `useUIState`)

## Imports

- Include `.js` extension on all local imports (ESM requirement)
- Use `import type { X }` for type-only imports
- Use `node:` protocol for Node built-ins (`import fs from 'node:fs'`)

## Async

**When to use async:**

- YES: I/O operations (file, network), external APIs, database, tool handlers
- NO: Pure calculations, in-memory transformations, config loading

**Patterns:**

- Long-running operations must accept `AbortSignal`
- Use `Promise.all()` for parallel execution (all must succeed)
- Use `Promise.allSettled()` when failures are independent
- Use `for await...of` for async iteration
- Use exponential backoff with jitter for retries
- Never use `fs.readFileSync` - blocks event loop

## State

- Create new objects for updates - never mutate
- Functional patterns (`.map()`, `.filter()`, `.reduce()`) over imperative loops

## Documentation

- Exported functions require JSDoc with `@param` and `@returns`
- Async `@returns`: "A promise that resolves to..."
- Document throwing functions with `@throws {ErrorType}`
- Comments explain WHY, not WHAT
- TODO format: `TODO(owner):` or `TODO(#issue):`
