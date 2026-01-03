---
paths: packages/core/**/*.ts
---

# Core Package Rules

## Example

```typescript
// Service with constructor injection and async factory
export class UserService {
  private _cache: Map<string, User> = new Map();
  private _logger: Logger;

  constructor(logger: Logger) {
    this._logger = logger; // Injected, not singleton
  }

  static async create(config: Config): Promise<UserService> {
    const logger = await Logger.create(config);
    return new UserService(logger);
  }

  async getUser(id: string, signal: AbortSignal): Promise<User | null> {
    // Implementation
  }
}
```

## Architecture Constraint

- **ZERO UI dependencies** - never import React, Ink, or UI libraries
- CLI depends on core, never the reverse

## Folder Structure

Core folders: `agents/`, `tools/`, `services/`, `mcp/`, `policy/`, `telemetry/`,
`config/`, `types/`, `hooks/`, `utils/`

## Layer Dependencies

Dependencies flow downward only:

1. Presentation (CLI only)
2. Orchestration
3. Domain
4. Infrastructure

Never import from upper layers.

## Class Suffixes

- `*Service` - stateless operations
- `*Manager` - stateful coordination
- `*Handler` - orchestration/events
- `*Registry` - lookups (must guard against use before `initialize()`)
- `*Loader` - I/O operations
- `*Client` - external API communication

## Patterns

- Constructor injection via Config object - no singletons or `getInstance()`
- Async init via `static async create(): Promise<T>`
- Registry classes must guard against use before `initialize()`
- Event-based communication for cross-cutting concerns
