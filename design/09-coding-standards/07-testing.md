# Testing Standards

Reference: `design/09-coding-standards/standards-reference/07-testing.md`

<testing_rules>

## Framework & Configuration

- **Framework**: Use Vitest. It's TypeScript-native, fast, and has excellent mocking support with `vi.mock()` and `vi.hoisted()`.

- **Base Config**: Each package needs `vitest.config.ts` with these settings because they ensure consistent behavior across the monorepo:

  ```typescript
  {
    resolve: { conditions: ['test'] },  // Enables test-specific module resolution
    test: {
      include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['**/node_modules/**', '**/dist/**'],
      environment: 'node',
      globals: true,                    // No need to import describe/it/expect
      reporters: ['default', 'junit'],
      outputFile: { junit: 'junit.xml' },
      setupFiles: ['./test-setup.ts'],
      pool: 'threads',
      poolOptions: { threads: { minThreads: 8, maxThreads: 16 } }
    },
    coverage: { enabled: true, provider: 'v8' }
  }
  ```

- **Integration/E2E Config**: Use `integration-tests/vitest.config.ts` with longer timeouts and retries because E2E tests interact with real systems:

  ```typescript
  {
    test: {
      testTimeout: 300000,              // 5 minutes for complex workflows
      globalSetup: './globalSetup.ts',
      include: ['**/*.test.ts'],
      retry: 2,                         // Retry flaky network operations
      fileParallelism: true,
      pool: 'threads',
      poolOptions: { threads: { minThreads: 8, maxThreads: 16 } }
    }
  }
  ```

- **Required Settings**: These are non-negotiable for CI reliability:
  - `coverage.enabled: true` — Enforces coverage gates
  - `coverage.provider: 'v8'` — Fast native coverage
  - `globals: true` — Cleaner test syntax
  - `environment: 'node'` — Change only with justification (e.g., `jsdom` for browser tests)
  - `retry: 2` (E2E only) — Handles transient failures

- **Forbidden Settings**: These break CI or hide problems:
  - `testTimeout > 300000` — Tests should fail fast, not hang
  - `coverage.enabled: false` — Coverage gates must run
  - `bail: true` in CI — We need full test results, not early exit

## Test Organization

- **Co-locate Tests**: Place tests next to the source files they test. This keeps related code together and makes refactoring easier.

  ```
  src/
    services/
      configLoader.ts
      configLoader.test.ts      ← Co-located
      __snapshots__/            ← Adjacent snapshot dir
        configLoader.test.ts.snap
  ```

- **File Naming**: Use suffixes that indicate test type for filtering and CI configuration:
  - Unit tests: `*.test.ts`
  - Component tests: `*.test.tsx`
  - Integration tests: `*.integration.test.ts`
  - Snapshots: `__snapshots__/` directory adjacent to test
  - E2E tests: Live under root `integration-tests/` (included by E2E config)

- **Test Timeouts**: Set appropriate limits so failures are detected quickly:
  - Unit/Component: 5s (default)
  - Integration: 30s
  - E2E: 300s (5 minutes)

## Writing Tests

- **Import Pattern**: Always import test APIs explicitly from `vitest`. This makes dependencies clear and enables IDE support.

  ```typescript
  // ✓ Explicit imports
  import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

  // ✗ Relying on globals without imports (even if globals: true)
  ```

- **Test Naming**: Use `should [expected behavior] when [condition]` pattern. This creates readable test reports and documents behavior.

  ```typescript
  // ✓ Clear behavior documentation
  it('should throw ValidationError when config file is missing', ...)
  it('should retry 3 times when API returns 503', ...)

  // ✗ Vague or implementation-focused
  it('test config', ...)
  it('calls validateConfig', ...)
  ```

- **Deterministic Test Data**: Never use random values or current timestamps. Random data causes flaky tests that fail intermittently.

  ```typescript
  // ✓ Deterministic
  const testUser = { id: 'user-123', createdAt: new Date('2024-01-15T10:00:00Z') };

  // ✗ Non-deterministic
  const testUser = { id: crypto.randomUUID(), createdAt: new Date() };
  ```

- **Async Assertions**: Always `await` async assertions. Missing `await` causes tests to pass before the assertion runs.

  ```typescript
  // ✓ Awaited assertion
  await expect(loadConfig()).rejects.toThrow('File not found');

  // ✗ Missing await - test passes regardless of result!
  expect(loadConfig()).rejects.toThrow('File not found');
  ```

- **Async Waiting**: Use `waitFor`/`poll` patterns for async conditions. Fixed sleeps are slow and flaky.

  ```typescript
  // ✓ Wait for condition
  await waitFor(() => expect(status).toBe('complete'));

  // ✗ Fixed sleep - slow and unreliable
  await sleep(1000);
  expect(status).toBe('complete');
  ```

## Mocking

- **Hoisted Mocks**: Use `vi.hoisted()` for typed mocks that must exist before module imports. This solves the temporal dead zone problem.

  ```typescript
  // ✓ Hoisted mock available during module load
  const mockFs = vi.hoisted(() => ({
    readFile: vi.fn(),
    writeFile: vi.fn(),
  }));
  vi.mock('node:fs/promises', () => mockFs);

  // ✗ Mock not available when module loads
  vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(), // Can't reference external variables
  }));
  ```

- **Mock Factory Functions**: Create reusable factories for mock objects. This reduces duplication and ensures consistent test data.

  ```typescript
  // ✓ Reusable factory
  function createMockUser(overrides?: Partial<User>): User {
    return { id: 'user-123', name: 'Test User', ...overrides };
  }

  // ✗ Inline object in every test
  const user = { id: 'user-123', name: 'Test User', email: '...' };
  ```

- **Mock Scope**: Test behavior, not implementation. Over-mocking makes tests brittle and coupled to internals.

  ```typescript
  // ✓ Test behavior - mock external boundary
  vi.mock('./apiClient'); // Mock the HTTP layer
  expect(await getUser('123')).toEqual(expectedUser);

  // ✗ Test implementation - mock internal details
  vi.mock('./userMapper');
  vi.mock('./userValidator');
  vi.mock('./userCache');
  // Tests break when refactoring internals
  ```

## Snapshots

- **Sanitize Dynamic Content**: Replace timestamps, durations, IDs, and other dynamic values before snapshotting. Otherwise snapshots fail on every run.

  ```typescript
  // ✓ Sanitized snapshot
  const output = result.replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '[TIMESTAMP]');
  expect(output).toMatchSnapshot();

  // ✗ Dynamic content in snapshot
  expect(result).toMatchSnapshot(); // Fails when timestamp changes
  ```

- **Snapshot Location**: Keep snapshots in `__snapshots__/` adjacent to the test file. This is Vitest's default and keeps related files together.

## Coverage

- **Minimum Thresholds**: These gates ensure adequate test coverage:
  - Statements: 70%
  - Branches: 65%
  - Functions: 70%
  - Lines: 70%

- **Allowed Exclusions**: These may be excluded from coverage because they don't contain business logic:
  - Test files: `*.test.*`
  - Test utilities: `test-utils/**`
  - Type definitions: `*.d.ts`
  - Barrel exports: `index.ts` files that only re-export

## CI Requirements

- **Gates**: All must pass for PR merge:
  - All tests pass
  - Coverage thresholds met
  - No skipped tests on main branch
  - All tests contain assertions (enforced by `expect-expect` rule)

- **Forbidden in CI**: These indicate incomplete or broken tests:
  - Focused tests (`.only`) — Run subset locally, not in CI
  - Skipped tests on main (`.skip`) — Fix or remove, don't commit skipped
  - Tests without assertions — Every test must verify something
  - Duplicate hooks/test names — Causes confusion and potential bugs

- **Enforcement**: Vitest + coverage gates in CI; ESLint test rules (`no-focused-tests`, `no-skipped-tests`, `expect-expect`, `no-duplicate-hooks`).

</testing_rules>

## Preferences

- **Security Tests**: Prefix security-critical tests with `SECURITY:` for easy filtering and report visibility.

  ```typescript
  it('SECURITY: should reject SQL injection in user input', ...)
  ```

- **Suite Structure**: Use nested `describe` blocks to group by feature and scenario. Cover both happy path and error cases.

  ```typescript
  describe('ConfigLoader', () => {
    describe('loadConfig', () => {
      describe('when file exists', () => {
        it('should parse valid JSON', ...);
        it('should validate schema', ...);
      });
      describe('when file is missing', () => {
        it('should throw ConfigNotFoundError', ...);
      });
    });
  });
  ```

- **Parameterized Tests**: Use `it.each` for testing multiple input/output scenarios with shared logic.

  ```typescript
  it.each([
    { input: '', expected: false },
    { input: 'valid@email.com', expected: true },
    { input: 'no-at-sign', expected: false },
  ])('should return $expected for "$input"', ({ input, expected }) => {
    expect(isValidEmail(input)).toBe(expected);
  });
  ```

- **Setup/Teardown**: Use `beforeEach`/`afterEach` to clear mocks, restore spies, and clean resources.

  ```typescript
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    await cleanup(); // Remove temp files, etc.
  });
  ```

- **Component/Hook Tests**: Use shared render utilities and wrap state updates in `act()`.

  ```typescript
  import { render, renderWithProviders, renderHook } from '../test-utils';
  import { act } from 'react';

  const { result } = renderHook(() => useAuth());
  act(() => {
    result.current.login(credentials);
  });
  ```

- **React Test Setup**: Set `global.IS_REACT_ACT_ENVIRONMENT = true` in test setup. Track `act()` warnings as test failures.

- **CLI Integration**: Use a `TestRig` class to create isolated test runs with:
  - Isolated temp directories
  - CLI spawning with argument injection
  - Interactive session support via PTY
  - Stdout/stderr capture and assertion helpers

- **HTTP/SSE Integration**: Use Supertest for HTTP endpoints. Parse SSE streams deterministically for assertions.

- **Environment-Aware Timeouts**: Use environment detection (CI/container/local) for timeouts instead of hardcoding.

## Exceptions

When a rule cannot be followed, document the exception:

- **Skipping flaky tests**: Allowed with `it.skip` comment containing issue link.

  ```typescript
  it.skip('should handle race condition', () => {
    // SKIP: Flaky on CI - see https://github.com/org/repo/issues/123
  });
  ```

- **Generated code coverage**: Allowed with explicit coverage exclusion comment.

  ```typescript
  /* v8 ignore start */ // Generated by codegen tool
  export const generatedSchema = { ... };
  /* v8 ignore stop */
  ```

- **Testing private/internal behavior**: Allowed only with explanatory comment.

  ```typescript
  // Testing internal validation logic - public API doesn't expose these edge cases
  // @ts-expect-error accessing private constructor for test
  const instance = new PrivateClass();
  ```

- **Accessing internal state**: Allowed only with explanatory comment for invariant verification.

## Commands

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Run with coverage report
npm run test:ci             # CI mode (coverage + junit output)
npm run test:integration    # Run integration tests only
npx vitest run -u           # Update snapshots
```

## Verification Checklist

When reviewing tests for compliance:

- [ ] Tests are co-located with source files (not in separate `test/` tree)
- [ ] File naming follows convention: `*.test.ts`, `*.test.tsx`, `*.integration.test.ts`
- [ ] Test names use `should [expected] when [condition]` pattern
- [ ] Imports explicitly from `vitest`: `import { vi, describe, it, expect } from 'vitest'`
- [ ] Async assertions use `await expect(...)`
- [ ] No fixed `sleep()` calls — uses `waitFor`/`poll` instead
- [ ] Test data is deterministic (no `Math.random()`, `Date.now()`, `crypto.randomUUID()`)
- [ ] Mocks use `vi.hoisted()` when needed before module imports
- [ ] Reusable mock factories exist for common test objects
- [ ] Snapshots sanitize dynamic content (timestamps, IDs, durations)
- [ ] No `.only` or `.skip` committed (except with issue link)
- [ ] Every test has at least one assertion (`expect`)
- [ ] Tests focus on behavior, not implementation details
- [ ] No shared mutable state between tests (each test isolated)
- [ ] Coverage thresholds: statements 70%, branches 65%, functions 70%, lines 70%
