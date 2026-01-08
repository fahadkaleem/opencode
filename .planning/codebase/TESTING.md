# Testing Patterns

**Analysis Date:** 2026-01-08

## Test Framework

**Runner:**
- Bun test runner (built-in)
- Zero-config, native TypeScript support
- Fast parallel execution

**Assertion Library:**
- Bun built-in expect
- Matchers: toBe, toEqual, toThrow, toMatchObject, rejects

**Run Commands:**
```bash
cd packages/opencode && bun test              # Run all tests
cd packages/opencode && bun test --watch      # Watch mode
bun test src/path/to/file.test.ts             # Single file
```

## Test File Organization

**Location:**
- Co-located: `*.test.ts` alongside source files (FloMaster)
- Separate tree: `packages/opencode/test/` for OpenCode core

**Naming:**
- unit-name.test.ts for all tests
- No filename distinction between unit/integration

**Structure:**
```
packages/opencode/
├── src/
│   └── flomaster/
│       └── orchestrator/
│           └── engine/
│               ├── factory.ts
│               └── factory.test.ts    # Co-located
└── test/
    ├── config/
    │   └── config.test.ts              # Separate tree
    ├── util/
    │   ├── timeout.test.ts
    │   └── wildcard.test.ts
    └── fixture/
        └── fixture.ts                   # Shared utilities
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect, describe } from "bun:test"

describe("util.timeout", () => {
  test("should resolve when promise completes before timeout", async () => {
    // Arrange
    const fastPromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve("fast"), 10)
    })

    // Act
    const result = await withTimeout(fastPromise, 100)

    // Assert
    expect(result).toBe("fast")
  })
})
```

**Patterns:**
- Use `describe()` for grouping related tests
- Use `test()` for individual cases (not `it()`)
- AAA pattern: Arrange/Act/Assert with comments for complex tests
- One assertion focus per test (multiple expects OK)

## Fixture Pattern

**Temporary Directory Utility** (`test/fixture/fixture.ts`):
```typescript
export async function tmpdir<T>(options?: TmpDirOptions<T>) {
  const dirpath = path.join(os.tmpdir(), "opencode-test-" + Math.random().toString(36).slice(2))
  await fs.mkdir(dirpath, { recursive: true })

  if (options?.git) {
    await $`git init`.cwd(dirpath).quiet()
    await $`git commit --allow-empty -m "root commit"`.cwd(dirpath).quiet()
  }

  if (options?.config) {
    await Bun.write(
      path.join(dirpath, "opencode.json"),
      JSON.stringify({ $schema: "https://opencode.ai/config.json", ...options.config })
    )
  }

  return {
    [Symbol.asyncDispose]: async () => { /* cleanup */ },
    path: dirpath,
  }
}
```

**Usage:**
```typescript
test("loads config with defaults", async () => {
  await using tmp = await tmpdir({ git: true })

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      const config = await Config.get()
      expect(config.username).toBeDefined()
    },
  })
})
```

## Mocking

**Strategy:**
- Prefer real temp directories over mocking file system
- Avoid excessive mocking - test actual behavior
- Mock external services only

**What to Mock:**
- External API calls (not in tests)
- Environment variables (save/restore pattern)
- Time-sensitive operations

**What NOT to Mock:**
- Internal pure functions
- File system (use tmpdir() instead)
- Business logic

**Environment Variable Pattern:**
```typescript
test("handles env variable", async () => {
  const original = process.env["TEST_VAR"]
  process.env["TEST_VAR"] = "test_value"

  try {
    // Test code
    expect(getEnvConfig()).toBe("test_value")
  } finally {
    if (original !== undefined) {
      process.env["TEST_VAR"] = original
    } else {
      delete process.env["TEST_VAR"]
    }
  }
})
```

## Coverage

**Requirements:**
- No enforced coverage target
- Focus on critical paths (orchestrator, session, tools)
- FloMaster: 372+ tests

**View Coverage:**
```bash
bun test --coverage
```

## Test Types

**Unit Tests:**
- Test single function in isolation
- Use tmpdir() for file operations
- Fast: each test <100ms

**Integration Tests:**
- Test multiple modules together
- Use real dependencies where possible
- Example: factory.test.ts (tests engine + registry)

**E2E Tests:**
- Manual CLI testing recommended
- Command: `bun dev workflow run "Test"`
- Verify actual execution, not just types

## Verification Hierarchy

| Level | Command | What It Proves |
|-------|---------|----------------|
| 1. Typecheck | `bun turbo typecheck` | Code compiles (bare minimum) |
| 2. Unit Tests | `bun test` | Individual functions work |
| 3. **E2E Test** | `bun dev workflow run` | **Actually works** |

**Critical Rule:** If you haven't run `bun dev workflow run` and seen it complete, you haven't verified your changes.

## Common Patterns

**Async Testing:**
```typescript
test("should handle async operation", async () => {
  const result = await asyncFunction()
  expect(result).toBe("expected")
})
```

**Error Testing:**
```typescript
test("should throw on invalid input", () => {
  expect(() => parse(null)).toThrow("Cannot parse null")
})

// Async error
test("should reject on failure", async () => {
  await expect(asyncCall()).rejects.toThrow("error message")
})
```

**Instance.provide Pattern:**
```typescript
test("test with instance context", async () => {
  await using tmp = await tmpdir({ git: true })

  await Instance.provide({
    directory: tmp.path,
    fn: async () => {
      // Code runs in context of tmp directory
    },
  })
})
```

## Test Data & Isolation

**Best Practices:**
- Create fresh data in each test (no shared state)
- Use tmpdir() for temporary directories
- Factory functions for complex objects
- Minimal test data (only required fields)
- Use obvious values: `id: 'user-123'` not `id: '1'`
- Clean up after tests (async dispose)

---

*Testing analysis: 2026-01-08*
*Update when test patterns change*
