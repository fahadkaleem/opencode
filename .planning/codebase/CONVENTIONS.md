# Coding Conventions

**Analysis Date:** 2026-01-08

## Naming Patterns

**Files:**
- kebab-case for all TypeScript files (`tool-registry.ts`, `state-manager.ts`)
- PascalCase for React/Solid components (`ToolDialog.tsx`, `SessionPanel.tsx`)
- *.test.ts alongside source files
- index.ts for barrel exports

**Functions:**
- camelCase for all functions (`getUserName`, `processData`)
- Verb prefix for actions (`create`, `get`, `process`, `execute`)
- No special prefix for async functions
- Type guards: `isXxx` / `hasXxx` (`isNodeError`, `hasContent`)

**Variables:**
- camelCase for variables (`currentUser`, `isActive`)
- UPPER_SNAKE_CASE for constants (`MAX_RETRY_COUNT`, `FLOMASTER_DIR`)
- No underscore prefix for private (TypeScript `private` keyword instead)
- Single-word names when descriptive enough

**Types:**
- PascalCase for interfaces, no I prefix (`User`, not `IUser`)
- PascalCase for type aliases (`UserConfig`, `ResponseData`)
- Namespace pattern for grouping (`Session.Info`, `Log.Level`)
- Zod schemas create both runtime and type: `const Schema = z.object(...)` + `type Schema = z.infer<typeof Schema>`

## Code Style

**Formatting:**
- Prettier with `.prettierrc`
- 2 space indentation
- Double quotes for strings (Prettier default)
- Semicolons required

**Linting:**
- No ESLint (relying on TypeScript strict mode)
- Run: `bun turbo typecheck`

**Module System:**
- ESM (import/export)
- Include `.js` extension on local imports (ESM requirement)
- Use `node:` protocol for Node built-ins (`import fs from 'node:fs'`)

## Import Organization

**Order:**
1. Node built-ins (`import * as crypto from 'node:crypto'`)
2. External packages (`import z from "zod"`)
3. Internal modules (`import { Config } from "../config/config"`)
4. Type imports (`import type { WorkflowData } from "../types"`)

**Grouping:**
- Blank line between groups
- Alphabetical within groups not enforced

**Path Aliases:**
- `@/` maps to package src/ (configured in tsconfig)
- Full relative paths also common

## Error Handling

**Patterns:**
- Throw custom errors, catch at boundaries
- Use `.catch()` preferred over `try/catch` for simple cases
- Extend Error class for custom errors

**Custom Error Classes:**
```typescript
export class StepExecutionError extends Error {
  readonly stepId: string
  override readonly cause?: Error

  constructor(message: string, stepId: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.stepId = stepId
    if (cause !== undefined) {
      this.cause = cause
    }
  }
}
```

**Error Types:**
- `FatalError` - Base fatal error
- `StepExecutionError`, `AgentExecutionError` - Workflow errors
- `CanceledError` - Operation cancellation

**Detection Pattern:**
```typescript
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
```

## Logging

**Framework:**
- OpenTelemetry API
- `Log.create({ service: "..." })`

**Patterns:**
- Structured logging with attributes
- Include: session.id, installation.id
- Log at service boundaries

**Levels:**
- DEBUG, INFO, WARN, ERROR

## Comments

**When to Comment:**
- Explain why, not what
- Document business logic, algorithms, edge cases
- Avoid obvious comments

**JSDoc/TSDoc:**
- Required for exported functions
- Include `@param`, `@returns`, `@throws`
- Async returns: "A promise that resolves to..."

**TODO Comments:**
- Format: `// TODO: description` or `// TODO(owner): description`
- Link to issue if exists: `// TODO(RF-XXX): description`

## Function Design

**Size:**
- Keep functions focused (under ~50 lines)
- Extract helpers for complex logic

**Parameters:**
- Max 3 parameters preferred
- Use options object for more: `function create(options: CreateOptions)`
- Destructure in parameter list when appropriate

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Avoid `any` - use `unknown` with type guards

## Module Design

**Exports:**
- Named exports preferred
- Default exports for React/Solid components
- Export public API from index.ts barrel files

**Namespace Pattern:**
Used extensively for organizing related types and functions:
```typescript
export namespace Log {
  export const Level = z.enum(["DEBUG", "INFO", "WARN", "ERROR"])
  export type Level = z.infer<typeof Level>

  export function create(options: Options): Logger {
    // Implementation
  }
}
```

**Barrel Files:**
- index.ts re-exports public API
- Keep internal helpers private
- Avoid circular dependencies

## Async Patterns

**When to use async:**
- YES: I/O operations, external APIs, tool handlers
- NO: Pure calculations, in-memory transformations

**Patterns:**
- Long operations accept `AbortSignal`
- Use `Promise.all()` for parallel execution
- Use `Promise.allSettled()` when partial failures OK
- Use `for await...of` for async iteration

**Never:**
- `fs.readFileSync` - blocks event loop
- Unbounded loops without yield

## State Management

**Immutability:**
- Create new objects for updates - never mutate
- Functional patterns: `.map()`, `.filter()`, `.reduce()`
- remeda library for FP utilities

**No `let`:**
- Prefer `const` with immutable patterns
- Use `let` only when mutation unavoidable

---

*Convention analysis: 2026-01-08*
*Update when patterns change*
