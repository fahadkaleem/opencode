---
paths: **/*.test.ts, **/*.test.tsx
---

# Testing Rules

## Example

```typescript
// vi.hoisted() for mocks referenced in vi.mock() factory
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../utils/http.js', () => ({ fetch: mockFetch }));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('UserService', () => {
  let tempDir: string;

  beforeEach(async () => {
    vi.useFakeTimers();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    mockFetch.mockReset();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return user when API succeeds', async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
    // Act
    const result = await service.getUser('user-123');
    // Assert
    expect(result?.id).toBe('user-123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Async error with timers
  it('should throw after retries exhausted', async () => {
    mockFetch.mockRejectedValue(new Error('Failed'));
    await Promise.all([
      expect(service.getUser('id')).rejects.toThrow('Failed'),
      vi.runAllTimersAsync(),
    ]);
  });
});
```

## Test Structure

- Co-locate test files with source: `*.test.ts` / `*.test.tsx`
- Follow AAA pattern: Arrange → Act → Assert
- Test ONE logical concept per test (multiple assertions OK if related)
- Name tests: `should [behavior] when [condition]`
- Use `describe`/`it`/`beforeEach`/`afterEach` structure
- Always import explicitly: `import { vi, describe, it } from 'vitest'`
- Prefix security-critical tests with `SECURITY:`

## What to Test

**Must test:** Business logic, tool implementations, services, data
transformations, validation, error handling, React hooks/components, async/retry
logic

**Can skip:** Type definitions, simple getters/setters, config constants,
third-party library code, auto-generated code

## Mocking

**Must mock:** File system (`node:fs`), network/API calls, shell execution, time
(`Date.now`, `setTimeout`), env vars, random, process exit

**Don't mock:** Internal business logic, pure utilities, data transformations,
type guards

### Patterns

```typescript
// Simple mock
vi.mock('module');

// Partial mock preserving real exports
vi.mock('module', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fn: vi.fn() };
});

// Hoisted mock for vi.mock() factory
const mockFn = vi.hoisted(() => vi.fn());
vi.mock('module', () => ({ fn: mockFn }));

// Spy on existing method
vi.spyOn(obj, 'method');

// Fake timers
vi.useFakeTimers();
vi.runAllTimersAsync();
vi.advanceTimersByTimeAsync(1000);
```

## Assertions

| Matcher                            | Use For                    |
| ---------------------------------- | -------------------------- |
| `toBe(value)`                      | Primitives, exact equality |
| `toEqual(obj)`                     | Deep object equality       |
| `toMatchObject(partial)`           | Partial object match       |
| `toContain(item)`                  | Array/string contains      |
| `toHaveLength(n)`                  | Array/string length        |
| `toMatch(/pattern/)`               | Regex matching             |
| `toThrow(message)`                 | Sync error throwing        |
| `await expect().rejects.toThrow()` | Async error throwing       |
| `await expect().resolves.toBe()`   | Async success              |
| `toHaveBeenCalledWith(args)`       | Mock call verification     |
| `toHaveBeenCalledTimes(n)`         | Mock call count            |
| `toMatchSnapshot()`                | Complex output comparison  |

## Async Testing

- Mark async tests with `async` keyword
- Always `await` async operations
- Use `await expect().rejects` for async errors (not try-catch)
- Use `vi.useFakeTimers()` for time-dependent code
- Use `Promise.all([expect().rejects, vi.runAllTimersAsync()])` for timers +
  errors
- Use `waitFor`/polling for async conditions (not fixed `sleep()`)

## Test Data & Fixtures

- Create fresh data in `beforeEach`, cleanup in `afterEach`
- Use `fs.mkdtemp()` for temp directories
- Use factory functions for complex objects
- Keep test data minimal (only required fields)
- Make values obvious: `id: 'user-123'` not `id: '1'`
- No random data without seeding
- No `Date.now()` without mocking

## Snapshot Testing

- Sanitize dynamic content (timestamps, IDs) before snapshot
- Replace dynamic values: `.replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]')`
- Update snapshots intentionally: `npx vitest run -u`

## Parameterized Tests

```typescript
it.each([
  { input: 'valid@email.com', expected: true, name: 'valid email' },
  { input: '', expected: false, name: 'empty string' },
])('should return $expected for $name', ({ input, expected }) => {
  expect(validateEmail(input)).toBe(expected);
});
```

## React/Component Testing

- Use `renderHook()` for testing custom hooks
- Wrap state updates in `act()` to flush effects
- Set `global.IS_REACT_ACT_ENVIRONMENT = true` in test setup
- Use shared `renderWithProviders()` for context-dependent UIs

## Cleanup (Required)

```typescript
afterEach(async () => {
  vi.restoreAllMocks(); // Clean up mocks
  vi.useRealTimers(); // Restore real timers
  await fs.rm(tempDir, { recursive: true, force: true }); // Clean temp files
});
```

## CI Requirements

- No `.only` tests committed
- No `.skip` tests on main (except with issue link in comment)
- Every test must have at least one `expect` assertion

## Don'ts

- `vi.mock()` referencing variables defined after it → use `vi.hoisted()`
- Mock internal business logic → only mock external boundaries
- `expect(result).toBeTruthy()` → use specific assertions
- `await sleep(100)` → use `vi.useFakeTimers()`
- `expect(promise).rejects.toThrow()` without `await` → test passes before
  assertion
- Share mutable state between tests → use `beforeEach` for fresh state
- Commit `.only` or `.skip` tests
- Write tests without assertions

---

# Testing Patterns by Code Type

> For a given piece of code, what kinds of tests should you write? This section
> answers that question for each code type in the codebase.

## Quick Reference

| Code Type        | Test Focus                                          | Mock Strategy                          |
| ---------------- | --------------------------------------------------- | -------------------------------------- |
| Type Guards      | All valid/invalid inputs, null, undefined           | None - test pure logic directly        |
| Error Handling   | Detection, transformation, retryable classification | Mock external I/O only                 |
| Services         | State changes, configuration behavior, side effects | Mock dependencies, preserve logic      |
| Tools            | Build → execute lifecycle, parameter validation     | Custom test doubles, mock invocations  |
| Orchestration    | Stream events, cancellation, finish reasons         | Mock streaming with async generators   |
| Agents           | Happy path, termination, security, recovery         | Mock model responses, track events     |
| React Components | Rendering based on props/state, child output        | Mock all children and contexts         |
| React Hooks      | State changes, effect behavior, callbacks           | `renderHook()` with stateful mocks     |
| CLI Commands     | Handler execution, argument parsing, side effects   | Mock context factory, verify calls     |
| Configuration    | Loading priority, validation, environment vars      | `vi.stubEnv()`, mock file system       |
| File Operations  | CRUD, path handling, error recovery                 | Real temp directories, not fs mocks    |
| Network/API      | Success, retry, timeout, stream consumption         | Mock async generators, simulate errors |

## Type Guards & Validators

**Test:** Valid inputs, invalid inputs, null, undefined, primitives, edge cases.

**Mock:** None - pure functions, test directly with `it.each()`.

## Error Handling

| Category       | Tests For                                    |
| -------------- | -------------------------------------------- |
| Detection      | `isNodeError()`, `isAuthenticationError()`   |
| Transformation | `toFriendlyError()`, error constructors      |
| Retryable      | 429, 5xx → retry; 400, 401, 403 → no retry   |
| Safe access    | `getErrorMessage()` on unknown types         |

## Services

**Test:** Configuration-driven behavior, state transitions, side effects, error
recovery, resource limits.

**Mock:** Dependencies (AI SDK, file system). Don't mock internal logic.

## Tools

| Category          | Test Cases                                 |
| ----------------- | ------------------------------------------ |
| Valid params      | Execute succeeds, returns expected result  |
| Invalid params    | Build fails with `INVALID_TOOL_PARAMS`     |
| Execution failure | Execute throws → `EXECUTION_FAILED`        |
| Schema validation | Cycles, required fields, type constraints  |

## Orchestration (Turn/Stream)

**Test:** Event emission, tool calls → `ToolCallRequest`, cancellation →
`UserCancelled`, finish reasons mapping, error handling.

**Mock:** `sendMessageStream` with async generators.

## Agents (Executors)

| Category    | What to Verify                                     |
| ----------- | -------------------------------------------------- |
| Happy path  | Tool calls → `complete_task` → success             |
| Termination | `max_turns`, `timeout`, `abort_signal` honored     |
| Recovery    | Graceful degradation when limits hit               |
| Security    | Unauthorized tools blocked (`SECURITY:` prefix)    |
| Validation  | Output schema enforced                             |
| Telemetry   | Activity events logged                             |

**Mock:** Model responses, tool executions. Use fake timers for timeouts.

## React Components

**Test:** Rendering based on props/state, conditional show/hide, child output.

**Mock:** All child components, all context providers. Use factory functions for
mock state.

## React Hooks

**Test:** Initial state, state changes after actions, effect cleanup, callback
parameters, rerender behavior.

**Pattern:** `renderHook()` + `act()` + callback capture for event simulation.

## CLI Commands

**Test:** Handler execution, side effects (UI updates, file writes), argument
parsing, error handling.

**Mock:** Use `createMockCommandContext()` factory. Verify side effect calls.

## Configuration

**Test:** Loading priority (env > CLI > file), validation, defaults, rejection.

**Mock:** `vi.stubEnv()` for env vars, mock file system for settings.

## File Operations

**Test:** CRUD success, ENOENT/EACCES/EEXIST handling, path traversal
prevention, cleanup.

**Mock:** Real temp directories with `createTmpDir()`, not fs mocks. Always
clean up in `afterEach`.

## Network/API

**Test:** Success handling, retry on 429/5xx, no retry on 4xx, timeout, stream
consumption.

**Mock:** Async generators for streams, `mockRejectedValueOnce` chains for
retry.

## Test Categories Checklist

| Category          | Description                                |
| ----------------- | ------------------------------------------ |
| Happy path        | Normal inputs → expected outputs           |
| Error cases       | Invalid inputs → proper error handling     |
| Edge cases        | Empty, null, undefined, boundary values    |
| Security          | Unauthorized access, injection, traversal  |
| State transitions | All states reachable, transitions valid    |
| Side effects      | Correct functions called with correct args |
| Cleanup           | Resources released, state reset            |

## Decision Tree

```
Is it a pure function (type guard, validator, transformer)?
├─ YES → Test directly, no mocks, use parameterized tests
└─ NO → Does it have external dependencies?
    ├─ YES → Mock the dependencies, test the logic
    │   └─ Is it file system?
    │       ├─ YES → Use real temp directories (createTmpDir)
    │       └─ NO → Use vi.mock() or vi.spyOn()
    └─ NO → Does it have internal state?
        ├─ YES → Test state transitions and side effects
        └─ NO → Test input → output transformations
```
