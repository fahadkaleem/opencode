# Testing Standards

> **Standard ID**: STD-007
> **Document Version**: 1.1
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: All TypeScript/Node.js test code
> **Enforcement**: Process Validation + Automated Checks
> **Related Documents**:
>
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md)
> - [Process Template](../../templates/99-standards/04-process-template.md)
> - [Naming Conventions](./naming-conventions.md) - STD-001

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory testing standards for TypeScript/Node.js CLI projects. These standards ensure consistent, reliable, and maintainable test suites that enable confident refactoring and catch regressions early.

### 1.2 Scope

**Applies to**:

- Unit tests for all TypeScript modules
- Integration tests for CLI commands
- Component tests for React/Ink UI
- Hook tests for custom React hooks
- End-to-end tests for complete workflows

**Does NOT apply to**:

- Manual testing procedures
- Performance benchmarking (separate standard)
- Security testing (separate standard)

### 1.3 Enforcement Level

| Level      | Meaning                | Mechanism                   |
| ---------- | ---------------------- | --------------------------- |
| **MUST**   | Mandatory process step | CI gate, coverage threshold |
| **SHOULD** | Recommended practice   | Code review                 |
| **MAY**    | Optional enhancement   | Team discretion             |

---

## 2. Guiding Principles

| Principle                         | Description                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| Test Behavior, Not Implementation | Tests verify outcomes, not internal mechanics               |
| Isolation                         | Each test runs independently with no shared state           |
| Determinism                       | Tests produce identical results on every run                |
| Fast Feedback                     | Unit tests complete in milliseconds; integration in seconds |
| Readable as Documentation         | Test names and structure document expected behavior         |

---

## 3. Process Overview

### 3.1 Test Development Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Write Feature  │────▶│  Write Tests    │────▶│  Run & Verify   │
│  Code           │     │  (Co-located)   │     │  Coverage       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Source File            Test File              Coverage Report
   feature.ts          feature.test.ts           coverage/
```

### 3.2 Test Types and Responsibilities

| Test Type   | Purpose                     | Location                | Timeout      | Parallelism         |
| ----------- | --------------------------- | ----------------------- | ------------ | ------------------- |
| Unit        | Test isolated modules       | Co-located with source  | 5s default   | Full parallel       |
| Component   | Test React/Ink components   | Co-located with source  | 5s default   | Full parallel       |
| Integration | Test module interactions    | `*.integration.test.ts` | 30s          | Parallel            |
| E2E         | Test complete CLI workflows | `integration-tests/`    | 300s (5 min) | Parallel with retry |

### 3.3 Roles and Responsibilities

| Role        | Responsibilities                                 |
| ----------- | ------------------------------------------------ |
| Developer   | Write tests for new code; maintain coverage      |
| Reviewer    | Verify test quality and coverage in PRs          |
| CI Pipeline | Enforce coverage thresholds; run all test suites |

---

## 4. Test Framework Configuration

### 4.1 Framework Selection

**Framework**: Vitest

**Rationale**: Native ESM support, fast execution, Jest-compatible API, built-in coverage.

### 4.2 Base Configuration

**File Location**: `vitest.config.ts` (per package)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    conditions: ['test'],
  },
  test: {
    // File patterns
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Environment
    environment: 'node',
    globals: true,

    // Reporters
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'junit.xml',
    },

    // Setup
    setupFiles: ['./test-setup.ts'],

    // Coverage
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*'],
      reporter: [
        ['text', { file: 'full-text-summary.txt' }],
        'html',
        'json',
        'lcov',
        'cobertura',
        ['json-summary', { outputFile: 'coverage-summary.json' }],
      ],
    },

    // Performance
    poolOptions: {
      threads: {
        minThreads: 8,
        maxThreads: 16,
      },
    },
  },
});
```

### 4.3 Integration Test Configuration

**File Location**: `integration-tests/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 300000, // 5 minutes for E2E
    globalSetup: './globalSetup.ts',
    reporters: ['default'],
    include: ['**/*.test.ts'],
    retry: 2, // Retry flaky tests
    fileParallelism: true,
    poolOptions: {
      threads: {
        minThreads: 8,
        maxThreads: 16,
      },
    },
  },
});
```

### 4.4 Required Settings

| Setting             | Value    | Rationale                     | Modifiable         |
| ------------------- | -------- | ----------------------------- | ------------------ |
| `coverage.enabled`  | `true`   | Enforce coverage tracking     | No                 |
| `coverage.provider` | `'v8'`   | Fast, accurate coverage       | No                 |
| `globals`           | `true`   | Consistent with test patterns | No                 |
| `environment`       | `'node'` | CLI runs in Node              | With justification |
| `retry` (E2E only)  | `2`      | Handle flaky network/timing   | Yes                |

### 4.5 Forbidden Settings

| Setting            | Forbidden Value | Reason                             |
| ------------------ | --------------- | ---------------------------------- |
| `testTimeout`      | `> 300000`      | Tests should not exceed 5 minutes  |
| `coverage.enabled` | `false`         | Coverage is mandatory              |
| `bail`             | `true` in CI    | All tests must run for full report |

---

## 5. Test File Organization

### 5.1 Co-located Tests (MUST)

Tests MUST be co-located with the source files they test.

```
src/
├── services/
│   ├── commandService.ts
│   ├── commandService.test.ts          # Unit test
│   └── commandService.integration.test.ts  # Integration test
├── ui/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Header.test.tsx             # Component test
│   │   └── __snapshots__/
│   │       └── Header.test.tsx.snap    # Snapshots
│   └── hooks/
│       ├── useSelection.ts
│       └── useSelection.test.ts        # Hook test
└── test-utils/                          # Shared test utilities
    ├── render.tsx
    ├── async.ts
    ├── customMatchers.ts
    └── mockContext.ts
```

### 5.2 File Naming Conventions

| Test Type          | Pattern                 | Example                              |
| ------------------ | ----------------------- | ------------------------------------ |
| Unit Test          | `*.test.ts`             | `userService.test.ts`                |
| Component Test     | `*.test.tsx`            | `Header.test.tsx`                    |
| Integration Test   | `*.integration.test.ts` | `auth.integration.test.ts`           |
| Snapshot Directory | `__snapshots__/`        | `__snapshots__/Header.test.tsx.snap` |

### 5.3 Integration Test Directory

E2E tests live in a dedicated root directory:

```
integration-tests/
├── vitest.config.ts      # E2E-specific config
├── globalSetup.ts        # Setup/teardown for all tests
├── testHelper.ts         # TestRig and utilities
├── fileSystem.test.ts    # File operation tests
├── commandExecution.test.ts
└── interactiveMode.test.ts
```

---

## 6. Test Structure Patterns

### 6.1 Import Pattern (MUST)

Always import test utilities explicitly from `vitest`:

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
```

### 6.2 Test Suite Organization

Use nested `describe` blocks to organize by feature and scenario:

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid input', async () => {
      // Test implementation
    });

    it('should throw ValidationError when email is invalid', async () => {
      // Test implementation
    });

    describe('when user already exists', () => {
      it('should throw ConflictError', async () => {
        // Test implementation
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Test implementation
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Test implementation
    });
  });
});
```

### 6.3 Test Naming Convention (MUST)

Test names MUST follow the pattern: `should [expected behavior] when [condition]`

**Correct Examples**:

```typescript
it('should return empty array when no users exist', () => {});
it('should throw ValidationError when email format is invalid', () => {});
it('should retry request when rate limited', () => {});
it('should aggregate commands from multiple loaders', () => {});
```

**Security Test Prefix (SHOULD)**:

For security-critical tests, prefix with `SECURITY:` for visibility in test reports:

```typescript
// Security-critical tests get prefixed for visibility
it('SECURITY: should throw when tool is not on allowlist', async () => {});
it('SECURITY: should reject path traversal attempts', async () => {});
it('SECURITY: should sanitize user input before execution', async () => {});
it('SECURITY: should validate authentication token', async () => {});
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing "should"
it('returns empty array', () => {});

// INCORRECT: Missing condition
it('should work correctly', () => {});

// INCORRECT: Implementation detail, not behavior
it('should call the database query method', () => {});
```

### 6.4 Parameterized Tests

Use `it.each` for testing multiple scenarios:

```typescript
describe('parseArguments', () => {
  it.each([
    {
      description: 'long flags',
      argv: ['node', 'script.js', '--prompt', 'test'],
      expected: { prompt: 'test' },
    },
    {
      description: 'short flags',
      argv: ['node', 'script.js', '-p', 'test'],
      expected: { prompt: 'test' },
    },
    {
      description: 'positional argument',
      argv: ['node', 'script.js', 'test'],
      expected: { prompt: 'test' },
    },
  ])('should parse $description correctly', ({ argv, expected }) => {
    process.argv = argv;
    const result = parseArguments();
    expect(result).toEqual(expected);
  });
});
```

### 6.5 Setup and Teardown

```typescript
describe('ShellTool', () => {
  let tempDirectory: string;
  let mockConfig: Config;
  let shellTool: ShellTool;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create isolated temp directory
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-test-'));
    fs.mkdirSync(path.join(tempDirectory, 'subdir'));

    // Setup mocks
    mockConfig = {
      getAllowedTools: vi.fn().mockReturnValue([]),
      getApprovalMode: vi.fn().mockReturnValue('strict'),
    } as unknown as Config;

    shellTool = new ShellTool(mockConfig);
  });

  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDirectory)) {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  // Tests...
});
```

---

## 7. Mocking Patterns

### 7.1 Module Mocking with `vi.mock()`

```typescript
// Mock entire module
vi.mock('../services/userService.js');

// Mock with implementation
vi.mock('../utils/terminalSetup.js', () => ({
  getTerminalProgram: vi.fn(),
}));

// Mock default export
vi.mock('ink-gradient', () => {
  const MockGradient = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    default: vi.fn(MockGradient),
  };
});

// Partial mock (keep some real implementations)
vi.mock('ink', async () => {
  const originalInk = await vi.importActual<typeof import('ink')>('ink');
  return {
    ...originalInk,
    Text: vi.fn(originalInk.Text),
  };
});
```

### 7.2 Hoisted Mocks (MUST for typed mocks)

When mocks need to be available before imports, use `vi.hoisted()`:

```typescript
import type { Mock } from 'vitest';
import type { ExtensionManager } from './extensionManager.js';

// Hoisted mocks are available before module imports
const mockInstallExtension: Mock<typeof ExtensionManager.prototype.installExtension> = vi.hoisted(
  () => vi.fn()
);

const mockStat: Mock<typeof fs.stat> = vi.hoisted(() => vi.fn());

vi.mock('./extensionManager.js', () => ({
  ExtensionManager: vi.fn().mockImplementation(() => ({
    installExtension: mockInstallExtension,
  })),
}));

vi.mock('node:fs/promises', () => ({
  stat: mockStat,
}));
```

### 7.3 Spying on Methods

```typescript
beforeEach(() => {
  vi.spyOn(debugLogger, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 7.4 Mock Factory Functions (MUST)

Create factory functions for reusable mock objects:

```typescript
// File: src/test-utils/mockFactories.ts

import type { SlashCommand, CommandKind } from '../types/command.js';

export const createMockCommand = (
  name: string,
  kind: CommandKind,
  overrides: Partial<SlashCommand> = {}
): SlashCommand => ({
  name,
  description: `Description for ${name}`,
  kind,
  action: vi.fn(),
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2025-01-01'),
  ...overrides,
});
```

### 7.5 Mock Class Implementation

```typescript
class MockCommandLoader implements CommandLoader {
  private commandsToLoad: SlashCommand[];

  constructor(commandsToLoad: SlashCommand[]) {
    this.commandsToLoad = commandsToLoad;
  }

  loadCommands = vi.fn(async (): Promise<SlashCommand[]> => Promise.resolve(this.commandsToLoad));
}

// Usage
const loader = new MockCommandLoader([createMockCommand('test', 'builtin')]);
```

### 7.6 Complex Mock Objects

```typescript
// File: src/test-utils/mockTool.ts

export interface MockToolOptions {
  name: string;
  displayName?: string;
  description?: string;
  params: Record<string, unknown>;
  shouldConfirmExecute?: () => Promise<ToolConfirmationDetails | false>;
  execute?: () => Promise<ToolResult>;
}

export class MockTool extends BaseDeclarativeTool<Record<string, unknown>, ToolResult> {
  shouldConfirmExecute: () => Promise<ToolConfirmationDetails | false>;
  execute: () => Promise<ToolResult>;

  constructor(options: MockToolOptions) {
    super(
      options.name,
      options.displayName ?? options.name,
      options.description ?? options.name,
      Kind.Other,
      options.params
    );

    this.shouldConfirmExecute = options.shouldConfirmExecute ?? (() => Promise.resolve(false));

    this.execute =
      options.execute ??
      (() =>
        Promise.resolve({
          llmContent: `Tool ${this.name} executed successfully.`,
          returnDisplay: `Tool ${this.name} executed successfully.`,
        }));
  }
}
```

### 7.7 Strongly-Typed Mock Definitions

For complex mock hierarchies, define explicit types to ensure type safety:

```typescript
import type { Mock } from 'vitest';

// Define typed mock interfaces for complex objects
type MockWriteStream = {
  emit: Mock<(event: string, ...args: unknown[]) => boolean>;
  on: Mock<(event: string, cb: (error?: Error | null) => void) => MockWriteStream>;
  once: Mock<(event: string, cb: (error?: Error | null) => void) => MockWriteStream>;
  write: Mock<(chunk: unknown, encoding?: unknown, cb?: unknown) => boolean>;
  end: Mock<(cb?: unknown) => void>;
  destroy: Mock<() => void>;
  destroyed: boolean;
};

type MockFile = {
  save: Mock<(data: Buffer | string) => Promise<void>>;
  download: Mock<() => Promise<[Buffer]>>;
  exists: Mock<() => Promise<[boolean]>>;
  createWriteStream: Mock<() => MockWriteStream>;
};

type MockBucket = {
  exists: Mock<() => Promise<[boolean]>>;
  file: Mock<(path: string) => MockFile>;
  name: string;
};

// Initialize in beforeEach with proper typing
let mockWriteStream: MockWriteStream;
let mockFile: MockFile;
let mockBucket: MockBucket;

beforeEach(() => {
  mockWriteStream = {
    emit: vi.fn().mockReturnValue(true),
    on: vi.fn((event, cb) => {
      if (event === 'finish') setTimeout(cb, 0);
      return mockWriteStream;
    }),
    once: vi.fn((event, cb) => {
      if (event === 'finish') setTimeout(cb, 0);
      return mockWriteStream;
    }),
    write: vi.fn().mockReturnValue(true),
    end: vi.fn(),
    destroy: vi.fn(),
    destroyed: false,
  };

  mockFile = {
    save: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue([Buffer.from('')]),
    exists: vi.fn().mockResolvedValue([true]),
    createWriteStream: vi.fn().mockReturnValue(mockWriteStream),
  };

  mockBucket = {
    exists: vi.fn().mockResolvedValue([true]),
    file: vi.fn().mockReturnValue(mockFile),
    name: 'test-bucket',
  };
});
```

---

## 8. Test Data and Fixtures

### 8.1 Deterministic Test Data (MUST)

Test data MUST be deterministic. Never use random values or current timestamps.

```typescript
// CORRECT: Fixed values
const testUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
};

// INCORRECT: Dynamic values
const testUser = {
  id: crypto.randomUUID(), // Non-deterministic
  email: 'test@example.com',
  createdAt: new Date(), // Non-deterministic
};
```

### 8.2 Mock Context Factory

```typescript
// File: src/test-utils/mockCommandContext.ts

import type { DeepPartial } from '../types/utils.js';
import type { CommandContext } from '../types/command.js';

export const createMockCommandContext = (
  overrides: DeepPartial<CommandContext> = {}
): CommandContext => {
  const defaultMocks: CommandContext = {
    invocation: {
      raw: '',
      name: '',
      args: '',
    },
    services: {
      config: null,
      settings: { merged: {} } as LoadedSettings,
      git: undefined,
      logger: {
        log: vi.fn(),
        logMessage: vi.fn(),
        saveCheckpoint: vi.fn(),
        loadCheckpoint: vi.fn().mockResolvedValue([]),
      },
    },
    ui: {
      addItem: vi.fn(),
      clear: vi.fn(),
      setStatus: vi.fn(),
    },
    session: {
      sessionShellAllowlist: new Set<string>(),
      stats: {
        sessionStartTime: new Date('2025-01-01T00:00:00.000Z'),
        lastPromptTokenCount: 0,
      },
    },
  };

  return deepMerge(defaultMocks, overrides);
};
```

### 8.3 File System Test Helpers

```typescript
// File: src/test-utils/fileSystemHelpers.ts

export type FileSystemStructure = {
  [name: string]:
    | string // File with content
    | FileSystemStructure // Directory
    | Array<string | FileSystemStructure>; // Array of files
};

export async function createTempDirectory(structure: FileSystemStructure): Promise<string> {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  await createStructure(tempDirectory, structure);
  return tempDirectory;
}

export async function cleanupTempDirectory(directory: string): Promise<void> {
  await fs.rm(directory, { recursive: true, force: true });
}

// Usage
const tempDirectory = await createTempDirectory({
  src: {
    'index.ts': 'export const main = () => {};',
    utils: {
      'helper.ts': 'export const helper = () => {};',
    },
  },
  'package.json': '{"name": "test"}',
});
```

---

## 9. Component Testing (React/Ink)

### 9.1 Custom Render Function

```typescript
// File: src/test-utils/render.tsx

import { render as inkRender } from 'ink-testing-library';
import { act } from 'react';
import type { ReactElement } from 'react';

export const render = (
  tree: ReactElement,
  terminalWidth?: number
): ReturnType<typeof inkRender> => {
  let renderResult: ReturnType<typeof inkRender>;

  act(() => {
    renderResult = inkRender(tree);
  });

  if (terminalWidth !== undefined && renderResult?.stdout) {
    Object.defineProperty(renderResult.stdout, 'columns', {
      get: () => terminalWidth,
      configurable: true,
    });

    act(() => {
      renderResult.rerender(tree);
    });
  }

  const originalUnmount = renderResult.unmount;
  const originalRerender = renderResult.rerender;

  return {
    ...renderResult,
    unmount: () => {
      act(() => {
        originalUnmount();
      });
    },
    rerender: (newTree: ReactElement) => {
      act(() => {
        originalRerender(newTree);
      });
    },
  };
};
```

### 9.2 Render with Providers

```typescript
// File: src/test-utils/render.tsx

export const renderWithProviders = (
  component: ReactElement,
  options: RenderOptions = {},
) => {
  const {
    shellFocus = true,
    settings = createMockSettings({}),
    uiState,
    width = 80,
    config = createMockConfig(),
  } = options;

  const finalUiState = uiState ?? createDefaultUiState();

  const renderResult = render(
    <ConfigContext.Provider value={config}>
      <SettingsContext.Provider value={settings}>
        <UIStateContext.Provider value={finalUiState}>
          <ShellFocusContext.Provider value={shellFocus}>
            <Box width={width}>
              {component}
            </Box>
          </ShellFocusContext.Provider>
        </UIStateContext.Provider>
      </SettingsContext.Provider>
    </ConfigContext.Provider>,
    width,
  );

  return { ...renderResult };
};
```

### 9.3 Hook Testing

```typescript
// File: src/test-utils/render.tsx

export function renderHook<Result, Props>(
  renderCallback: (props: Props) => Result,
  options?: {
    initialProps?: Props;
    wrapper?: React.ComponentType<{ children: React.ReactNode }>;
  },
): {
  result: { current: Result };
  rerender: (props?: Props) => void;
  unmount: () => void;
} {
  const result = { current: undefined as unknown as Result };
  let currentProps = options?.initialProps as Props;

  function TestComponent({
    renderCallback,
    props,
  }: {
    renderCallback: (props: Props) => Result;
    props: Props;
  }) {
    result.current = renderCallback(props);
    return null;
  }

  const Wrapper = options?.wrapper ?? React.Fragment;

  const { rerender, unmount } = render(
    <Wrapper>
      <TestComponent renderCallback={renderCallback} props={currentProps} />
    </Wrapper>,
  );

  return {
    result,
    rerender: (newProps?: Props) => {
      currentProps = newProps ?? currentProps;
      rerender(
        <Wrapper>
          <TestComponent renderCallback={renderCallback} props={currentProps} />
        </Wrapper>,
      );
    },
    unmount,
  };
}

// Usage
const { result, rerender } = renderHook(
  ({ initialValue }) => useCounter(initialValue),
  { initialProps: { initialValue: 0 } },
);

expect(result.current.count).toBe(0);
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

---

## 10. CLI Integration Testing

### 10.1 TestRig Class

```typescript
// File: integration-tests/testHelper.ts

import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as pty from 'node-pty';

export class TestRig {
  bundlePath: string;
  testDirectory: string | null;
  testName?: string;

  constructor() {
    this.bundlePath = join(__dirname, '..', 'bundle/cli.js');
    this.testDirectory = null;
  }

  setup(testName: string, options: TestOptions = {}): void {
    this.testName = testName;
    const sanitizedName = sanitizeTestName(testName);
    this.testDirectory = join(process.env['INTEGRATION_TEST_FILE_DIR']!, sanitizedName);
    mkdirSync(this.testDirectory, { recursive: true });
    // Configure settings, environment, etc.
  }

  createFile(fileName: string, content: string): string {
    const filePath = join(this.testDirectory!, fileName);
    writeFileSync(filePath, content);
    return filePath;
  }

  async run(prompt: string, options: RunOptions = {}): Promise<string> {
    const commandArgs = this.buildArgs(prompt, options);

    return new Promise((resolve, reject) => {
      const child = spawn('node', [this.bundlePath, ...commandArgs], {
        cwd: this.testDirectory!,
        stdio: 'pipe',
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Process exited with code ${code}: ${output}`));
        }
      });
    });
  }

  async runInteractive(...args: string[]): Promise<InteractiveRun> {
    const commandArgs = this.buildArgs('', { additionalArgs: args });

    const ptyProcess = pty.spawn('node', [this.bundlePath, ...commandArgs], {
      cwd: this.testDirectory!,
      cols: 80,
      rows: 24,
    });

    const run = new InteractiveRun(ptyProcess);
    await run.expectText('Type your message', 30000);
    return run;
  }
}
```

### 10.2 Interactive Session Testing

```typescript
// File: integration-tests/testHelper.ts

import stripAnsi from 'strip-ansi';
import type * as pty from 'node-pty';

export class InteractiveRun {
  ptyProcess: pty.IPty;
  public output = '';

  constructor(ptyProcess: pty.IPty) {
    this.ptyProcess = ptyProcess;
    ptyProcess.onData((data) => {
      this.output += data;
    });
  }

  async expectText(text: string, timeout = 15000): Promise<void> {
    const found = await poll(
      () => stripAnsi(this.output).toLowerCase().includes(text.toLowerCase()),
      timeout,
      200
    );
    expect(found, `Did not find expected text: "${text}"`).toBe(true);
  }

  async sendKeys(text: string): Promise<void> {
    const delay = 5;
    for (const char of text) {
      this.ptyProcess.write(char);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  sendCtrlC(): void {
    this.ptyProcess.write('\x03');
  }

  expectExit(): Promise<number> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Test timed out: process did not exit')),
        60000
      );

      this.ptyProcess.onExit(({ exitCode }) => {
        clearTimeout(timer);
        resolve(exitCode);
      });
    });
  }
}

// Usage
describe('Interactive Mode', () => {
  it('should exit gracefully on second Ctrl+C', async () => {
    const rig = new TestRig();
    await rig.setup('ctrl-c-exit-test');

    const run = await rig.runInteractive();

    // Send first Ctrl+C
    run.sendCtrlC();
    await run.expectText('Press Ctrl+C again to exit', 5000);

    // Send second Ctrl+C
    run.sendCtrlC();

    const exitCode = await run.expectExit();
    expect(exitCode).toBe(0);
    await run.expectText('Goodbye!', 5000);
  });
});
```

### 10.3 stdout/stderr Capture

```typescript
let consoleErrorSpy: vi.SpyInstance;
let processStdoutSpy: vi.SpyInstance;
let processStderrSpy: vi.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  processStdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  processStderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code}) called`);
  });
});

const getWrittenOutput = (): string => processStdoutSpy.mock.calls.map((call) => call[0]).join('');

const getErrorOutput = (): string => processStderrSpy.mock.calls.map((call) => call[0]).join('');
```

### 10.4 HTTP/API Testing with Supertest

For testing Express or HTTP server endpoints without starting a real server:

```typescript
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';

describe('API Endpoints', () => {
  let app: Express;
  let server: Server;

  beforeAll(async () => {
    app = await createApp();
    server = app.listen(0); // Listen on random available port
  });

  afterAll(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      })
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create resource and return 201', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ name: 'test-resource', type: 'example' })
      .set('Content-Type', 'application/json')
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: 'test-resource',
    });
  });

  it('should return 400 for invalid input', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ invalid: 'data' })
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('should return 404 for non-existent resource', async () => {
    await request(app).get('/api/resources/non-existent-id').expect(404);
  });
});
```

### 10.5 Server-Sent Events (SSE) Testing

For testing streaming endpoints that use Server-Sent Events:

```typescript
// SSE response parser utility
function parseSSEStream(stream: string): Record<string, unknown>[] {
  return stream
    .split('\n\n')
    .filter(Boolean) // Remove empty strings from trailing newlines
    .map((chunk) => {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) {
        throw new Error(`Invalid SSE chunk: "${chunk}"`);
      }
      return JSON.parse(dataLine.substring(6)); // Remove 'data: ' prefix
    });
}

describe('SSE Streaming Endpoint', () => {
  it('should stream events correctly', async () => {
    // Mock the streaming response
    mockStreamGenerator.mockImplementation(async function* () {
      yield { type: 'start', id: '123' };
      yield { type: 'progress', percent: 50 };
      yield { type: 'complete', result: 'success' };
    });

    const res = await request(app).post('/api/stream').send({ action: 'process' }).expect(200);

    const events = parseSSEStream(res.text);

    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ type: 'start' });
    expect(events[1]).toMatchObject({ type: 'progress', percent: 50 });
    expect(events[2]).toMatchObject({ type: 'complete', result: 'success' });
  });

  it('should include final event marker', async () => {
    const res = await request(app).post('/api/stream').send({ action: 'process' });

    const events = parseSSEStream(res.text);
    const finalEvent = events[events.length - 1];

    expect(finalEvent.final).toBe(true);
  });
});
```

---

## 11. Async Testing Patterns

### 11.1 Custom waitFor Utility

```typescript
// File: src/test-utils/async.ts

import { act } from 'react';

export async function waitFor(
  assertion: () => void,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();

  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - startTime > timeout) {
        throw error;
      }

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, interval));
      });
    }
  }
}
```

### 11.2 Polling Utility

```typescript
// File: integration-tests/testHelper.ts

export async function poll(
  predicate: () => boolean,
  timeout: number,
  interval: number
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}
```

### 11.3 Async Generator Testing

```typescript
async function* createStreamFromEvents(events: StreamEvent[]): AsyncGenerator<StreamEvent> {
  for (const event of events) {
    yield event;
  }
}

it('should process stream events correctly', async () => {
  const events: StreamEvent[] = [
    { type: 'content', value: 'Hello' },
    { type: 'content', value: ' World' },
    { type: 'finished' },
  ];

  const stream = createStreamFromEvents(events);
  const result = await processStream(stream);

  expect(result).toBe('Hello World');
});
```

### 11.4 Timeout Configuration

```typescript
function getDefaultTimeout(): number {
  if (process.env['CI']) return 60000; // 1 minute in CI
  if (process.env['CONTAINER']) return 30000; // 30s in containers
  return 15000; // 15s locally
}
```

---

## 12. Snapshot Testing

### 12.1 Basic Snapshot Usage

```typescript
it('should render header correctly', () => {
  const { lastFrame } = render(<Header title="Test" />);
  expect(lastFrame()).toMatchSnapshot();
});
```

### 12.2 Sanitized Snapshots (MUST for dynamic content)

When output contains dynamic values, sanitize before snapshot:

```typescript
it('should format output with timestamps', async () => {
  const output = getWrittenOutput();

  // Sanitize dynamic values
  const sanitizedOutput = output
    .replace(/"timestamp":"[^"]+"/g, '"timestamp":"<TIMESTAMP>"')
    .replace(/"duration_ms":\d+/g, '"duration_ms":<DURATION>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '<ISO_DATE>');

  expect(sanitizedOutput).toMatchSnapshot();
});
```

### 12.3 Snapshot Location

Snapshots are stored in `__snapshots__` directories adjacent to test files:

```
src/
├── components/
│   ├── Header.tsx
│   ├── Header.test.tsx
│   └── __snapshots__/
│       └── Header.test.tsx.snap
```

---

## 13. Custom Matchers

### 13.1 Defining Custom Matchers

```typescript
// File: src/test-utils/customMatchers.ts

import type { Assertion } from 'vitest';

const invalidCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

function toHaveOnlyValidCharacters(
  this: Assertion,
  buffer: TextBuffer
): { pass: boolean; message: () => string } {
  const { isNot } = this as { isNot: boolean };
  let pass = true;
  const invalidLines: Array<{ line: number; content: string }> = [];

  for (let i = 0; i < buffer.lines.length; i++) {
    const line = buffer.lines[i];
    if (line.includes('\n') || invalidCharsRegex.test(line)) {
      pass = false;
      invalidLines.push({ line: i, content: line });
    }
  }

  return {
    pass,
    message: () =>
      `Expected buffer ${isNot ? 'not ' : ''}to have only valid characters.\n` +
      `Found invalid lines: ${JSON.stringify(invalidLines, null, 2)}`,
  };
}

expect.extend({
  toHaveOnlyValidCharacters,
});

// Extend Vitest's expect interface
declare module 'vitest' {
  interface Assertion<T> {
    toHaveOnlyValidCharacters(): T;
  }
}
```

### 13.2 Using Custom Matchers

```typescript
import './test-utils/customMatchers.js';

it('should produce valid terminal output', () => {
  const buffer = renderToBuffer(<App />);
  expect(buffer).toHaveOnlyValidCharacters();
});
```

---

## 14. Test Setup Files

### 14.1 Unit Test Setup

```typescript
// File: test-setup.ts

import { vi, beforeEach, afterEach } from 'vitest';

// Enable React act() environment
global.IS_REACT_ACT_ENVIRONMENT = true;

// Ensure consistent theme behavior
if (process.env.NO_COLOR !== undefined) {
  delete process.env.NO_COLOR;
}

// Import custom matchers
import './src/test-utils/customMatchers.js';

// Track act() warnings as test failures
let actWarnings: Array<{ message: string; stack: string }> = [];
let consoleErrorSpy: vi.SpyInstance;

beforeEach(() => {
  actWarnings = [];

  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('was not wrapped in act(...)')) {
      actWarnings.push({
        message: args.join(' '),
        stack: new Error().stack ?? '',
      });
    }
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();

  if (actWarnings.length > 0) {
    const messages = actWarnings.map((w) => `${w.message}\n${w.stack}`).join('\n\n');
    throw new Error(`Test failed due to act() warnings:\n${messages}`);
  }
});
```

### 14.2 Integration Test Global Setup

```typescript
// File: integration-tests/globalSetup.ts

import { mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

let runDirectory: string;

export async function setup(): Promise<void> {
  const integrationTestsDirectory = join(__dirname, 'runs');
  runDirectory = join(integrationTestsDirectory, `${Date.now()}`);

  await mkdir(runDirectory, { recursive: true });

  // Set isolated environment
  process.env['HOME'] = runDirectory;
  process.env['CONFIG_DIR'] = join(runDirectory, '.config');
  process.env['INTEGRATION_TEST_FILE_DIR'] = runDirectory;
  process.env['INTEGRATION_TEST'] = 'true';

  // Clean up old test runs (keep last 5)
  try {
    const testRuns = await readdir(integrationTestsDirectory);
    if (testRuns.length > 5) {
      const oldRuns = testRuns.sort().slice(0, testRuns.length - 5);
      await Promise.all(
        oldRuns.map((oldRun) =>
          rm(join(integrationTestsDirectory, oldRun), {
            recursive: true,
            force: true,
          })
        )
      );
    }
  } catch (error) {
    console.error('Error cleaning up old test runs:', error);
  }
}

export async function teardown(): Promise<void> {
  if (process.env['KEEP_OUTPUT'] !== 'true' && runDirectory) {
    await rm(runDirectory, { recursive: true, force: true });
  }
}
```

---

## 15. Coverage Requirements

### 15.1 Coverage Thresholds

| Metric     | Minimum | Target |
| ---------- | ------- | ------ |
| Statements | 70%     | 85%    |
| Branches   | 65%     | 80%    |
| Functions  | 70%     | 85%    |
| Lines      | 70%     | 85%    |

### 15.2 Coverage Configuration

```typescript
// vitest.config.ts
coverage: {
  enabled: true,
  provider: 'v8',
  reportsDirectory: './coverage',
  include: ['src/**/*'],
  exclude: [
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/test-utils/**',
    'src/**/*.d.ts',
  ],
  thresholds: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70,
  },
  reporter: ['text', 'html', 'json', 'lcov'],
},
```

### 15.3 Coverage Exclusions

Files that MAY be excluded from coverage:

| Pattern                     | Reason                |
| --------------------------- | --------------------- |
| `*.test.ts`                 | Test files themselves |
| `test-utils/**`             | Test utilities        |
| `*.d.ts`                    | Type definitions      |
| `index.ts` (barrel exports) | Re-export only files  |

---

## 16. Anti-Patterns

### 16.1 Forbidden Patterns

| Anti-Pattern                   | Problem                         | Correct Practice                |
| ------------------------------ | ------------------------------- | ------------------------------- |
| Testing implementation details | Brittle tests                   | Test behavior and outcomes      |
| Shared mutable state           | Tests affect each other         | Reset state in beforeEach       |
| Random test data               | Non-deterministic failures      | Use fixed test data             |
| Sleeping with fixed delays     | Slow, flaky tests               | Use waitFor/poll utilities      |
| Mocking too much               | Tests don't verify integration  | Mock only external dependencies |
| No assertions                  | Tests pass without verification | Every test needs expect()       |

### 16.2 Common Mistakes

| Mistake                   | Consequence                  | Prevention                |
| ------------------------- | ---------------------------- | ------------------------- |
| Missing `await` on async  | Test passes before assertion | Use `await expect()`      |
| Not cleaning up resources | Test pollution               | Use afterEach cleanup     |
| Hardcoded timeouts        | Flaky in CI                  | Use configurable timeouts |
| Testing private methods   | Couples to implementation    | Test through public API   |

### 16.3 Code Examples

```typescript
// INCORRECT: Testing implementation details
it('should call internal _processData method', async () => {
  const spy = vi.spyOn(service, '_processData');
  await service.handleRequest(input);
  expect(spy).toHaveBeenCalled(); // Brittle!
});

// CORRECT: Testing behavior
it('should return processed result for valid input', async () => {
  const result = await service.handleRequest(input);
  expect(result).toEqual(expectedOutput);
});
```

```typescript
// INCORRECT: Fixed sleep
it('should complete after delay', async () => {
  service.startAsync();
  await new Promise((r) => setTimeout(r, 1000)); // Slow, flaky
  expect(service.isComplete()).toBe(true);
});

// CORRECT: Polling with timeout
it('should complete after delay', async () => {
  service.startAsync();
  await waitFor(
    () => {
      expect(service.isComplete()).toBe(true);
    },
    { timeout: 5000 }
  );
});
```

---

## 17. Test Scripts

### 17.1 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=junit",
    "test:integration": "vitest run --config ./integration-tests/vitest.config.ts",
    "test:integration:watch": "vitest --config ./integration-tests/vitest.config.ts"
  }
}
```

### 17.2 CI Pipeline Integration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run test:integration
```

---

## 18. Decision Flowcharts

### 18.1 Test Type Selection

```
What are you testing?
│
├─ Single function/class in isolation?
│   └─ Unit Test (*.test.ts)
│
├─ React/Ink component rendering?
│   └─ Component Test (*.test.tsx)
│
├─ Multiple modules working together?
│   └─ Integration Test (*.integration.test.ts)
│
├─ Complete CLI workflow with real I/O?
│   └─ E2E Test (integration-tests/*.test.ts)
│
└─ Custom React hook?
    └─ Hook Test with renderHook()
```

### 18.2 Mocking Decision

```
Should I mock this dependency?
│
├─ External service (HTTP, database)?
│   └─ YES - Mock with vi.mock()
│
├─ File system operations?
│   ├─ Unit test → YES - Mock fs module
│   └─ Integration test → NO - Use temp directory
│
├─ Internal module in same package?
│   └─ Usually NO - Test integration
│
├─ Time/Date?
│   └─ YES - Use vi.useFakeTimers()
│
└─ Random/crypto?
    └─ YES - Mock for determinism
```

---

## 19. Quick Reference

### 19.1 Command Cheat Sheet

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run src/services/userService.test.ts

# Run tests matching pattern
npx vitest run -t "should create user"

# Run integration tests
npm run test:integration

# Update snapshots
npx vitest run -u
```

### 19.2 Essential Imports

```typescript
// All test files
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Component tests
import { render, renderWithProviders } from '../test-utils/render.js';
import { act } from 'react';

// Hook tests
import { renderHook } from '../test-utils/render.js';

// Async tests
import { waitFor } from '../test-utils/async.js';

// Mock factories
import { createMockContext, createMockUser } from '../test-utils/mockFactories.js';
```

### 19.3 Common Assertions

```typescript
// Equality
expect(result).toBe(expected); // Strict equality
expect(result).toEqual(expected); // Deep equality
expect(result).toMatchObject(partial); // Partial match

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(count).toBeGreaterThan(0);
expect(count).toBeLessThanOrEqual(10);

// Strings
expect(message).toContain('error');
expect(message).toMatch(/pattern/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Errors
expect(() => fn()).toThrow(ErrorType);
await expect(asyncFn()).rejects.toThrow('message');

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);

// Snapshots
expect(output).toMatchSnapshot();
```

---

## 20. Enforcement

### 20.1 Automated Checks

| Check                    | Tool            | Trigger    | Blocking |
| ------------------------ | --------------- | ---------- | -------- |
| Tests pass               | Vitest          | PR, Push   | Yes      |
| Coverage thresholds      | Vitest Coverage | PR         | Yes      |
| No skipped tests in main | ESLint          | PR to main | Yes      |

### 20.2 Code Review Checklist

- [ ] Tests cover happy path and error cases
- [ ] Test names follow `should...when` pattern
- [ ] No implementation details tested
- [ ] Mocks are appropriate (not over-mocking)
- [ ] Async tests use proper patterns (no fixed delays)
- [ ] Test data is deterministic
- [ ] Cleanup happens in afterEach
- [ ] Coverage maintained or improved

### 20.3 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        // Forbid focused tests
        'vitest/no-focused-tests': 'error',
        // Forbid skipped tests (warn in dev, error in CI)
        'vitest/no-skipped-tests': process.env.CI ? 'error' : 'warn',
        // Require assertions
        'vitest/expect-expect': 'error',
        // No duplicate test names
        'vitest/no-duplicate-hooks': 'error',
      },
    },
  ],
};
```

---

## 21. Exceptions

### 21.1 Valid Exception Scenarios

| Scenario                         | Justification Required                        | Documentation                   |
| -------------------------------- | --------------------------------------------- | ------------------------------- |
| Skipping flaky test              | Issue link for investigation                  | `it.skip` with comment          |
| Lower coverage in generated code | Code is auto-generated                        | Coverage exclusion comment      |
| Testing private method           | No public API available                       | Comment explaining necessity    |
| Testing private constructor      | Unit testing requires direct instantiation    | `@ts-expect-error` with comment |
| Accessing internal state         | Verifying immutability or internal invariants | Comment explaining necessity    |

### 21.2 Exception Documentation

```typescript
/**
 * TEST EXCEPTION: STD-007 Section 6.3
 * Reason: Testing internal retry logic that cannot be
 *         verified through public API timing.
 * Approved: 2025-01-15
 */
it('should retry with exponential backoff', async () => {
  // @ts-expect-error - Accessing private method for test
  const delays = service._calculateRetryDelays(3);
  expect(delays).toEqual([100, 200, 400]);
});
```

### 21.3 Private Constructor Testing

When a class has a private constructor (e.g., factory pattern), use `@ts-expect-error` to bypass for unit testing:

```typescript
/**
 * TEST EXCEPTION: STD-007 Section 21.1
 * Reason: Task class uses private constructor with factory method.
 *         Unit testing requires direct instantiation to isolate behavior.
 */
describe('Task', () => {
  it('should initialize with correct state', () => {
    // @ts-expect-error - Calling private constructor for test purposes
    const task = new Task('task-id', 'context-id', mockConfig, mockEventBus);

    expect(task.id).toBe('task-id');
    expect(task.contextId).toBe('context-id');
  });

  it('should not mutate input arrays', async () => {
    // @ts-expect-error - Calling private constructor for test purposes
    const task = new Task('id', 'ctx', mockConfig, mockEventBus);

    const originalRequests = [{ callId: '1', name: 'tool' }];
    const requestsCopy = JSON.parse(JSON.stringify(originalRequests));

    await task.processRequests(originalRequests);

    // Verify original array was not mutated
    expect(originalRequests).toEqual(requestsCopy);
  });
});
```

### 21.4 Internal Method Testing via Bracket Notation

When testing internal/private methods is necessary, use bracket notation:

```typescript
/**
 * TEST EXCEPTION: STD-007 Section 21.1
 * Reason: Testing internal state machine logic not exposed via public API.
 */
it('should transition state correctly', async () => {
  const store = new TaskStore(config);

  // Access private method via bracket notation
  await store['ensureInitialized']();

  expect(store['initialized']).toBe(true);
});
```

---

## 22. Traceability

### 22.1 Related Standards

| Standard                      | Relationship                         |
| ----------------------------- | ------------------------------------ |
| STD-001 Naming Conventions    | Test naming patterns                 |
| STD-005 Architecture Patterns | What to mock, integration boundaries |
| STD-006 Error Handling        | Testing error scenarios              |

### 22.2 Requirement Coverage

| Requirement                   | Sections                         |
| ----------------------------- | -------------------------------- |
| NFR-QUAL-001 Code Quality     | Coverage thresholds (Section 15) |
| NFR-REL-001 Reliability       | Integration testing (Section 10) |
| NFR-MAINT-001 Maintainability | Test structure (Section 6)       |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                     |
| ------- | ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version                                                                                                                                             |
| 1.1     | 2025-11-29 | Architecture Team | Added: SECURITY: test prefix (6.3), strongly-typed mocks (7.7), HTTP/Supertest testing (10.4), SSE testing (10.5), private constructor patterns (21.3-21.4) |
