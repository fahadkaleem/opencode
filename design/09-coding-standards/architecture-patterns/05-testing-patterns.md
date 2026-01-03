---
title: Testing Patterns
category: architecture-patterns
status: stable
last_updated: 2025-12-17
applies_to:
  - Core Package
  - CLI Package
  - All Services
  - All Tools
related_patterns:
  - ./03-type-safety-patterns.md#type-guards
  - ./04-error-handling-patterns.md
  - ./06-code-organization.md
---

# 5. Testing Patterns

> **Purpose**: Comprehensive testing patterns using Vitest to achieve high coverage, maintainability, and confidence in code correctness through co-located tests, mock objects, and real file system isolation.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Co-located Tests](#pattern-1-co-located-tests)
- [Pattern 2: AAA Pattern (Arrange-Act-Assert)](#pattern-2-aaa-pattern-arrange-act-assert)
- [Pattern 3: Mock Objects via Interfaces](#pattern-3-mock-objects-via-interfaces)
- [Pattern 4: Temp Directory Isolation](#pattern-4-temp-directory-isolation)
- [Pattern 5: Test Coverage Requirements](#pattern-5-test-coverage-requirements)
- [Pattern 6: Comprehensive Test Organization](#pattern-6-comprehensive-test-organization)
- [Pattern 7: Vi Mock System](#pattern-7-vi-mock-system)
- [Pattern 8: Parameterized Tests (it.each)](#pattern-8-parameterized-tests-iteach)
- [Pattern 9: Security Test Labeling](#pattern-9-security-test-labeling)
- [Pattern 10: Protocol Violation Tests](#pattern-10-protocol-violation-tests)
- [Pattern 11: Test Helper Factories](#pattern-11-test-helper-factories)
- [Pattern 12: Shared Test Utilities](#pattern-12-shared-test-utilities)
- [Pattern 13: Custom Matchers](#pattern-13-custom-matchers)
- [Pattern 14: Integration Test Configuration](#pattern-14-integration-test-configuration)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Testing provides confidence in code correctness and enables safe refactoring. A comprehensive testing strategy includes unit tests for isolated logic, integration tests for component interaction, and high test coverage to catch regressions early.

This codebase uses Vitest as the test framework, which provides native ESM support, excellent TypeScript integration, and fast test execution. Tests are co-located with source files, follow the AAA pattern for clarity, and use real file system operations with temp directory isolation rather than complex mocking.

**Why testing matters:**

- Catch bugs before they reach production
- Enable confident refactoring with safety net
- Document expected behavior through test cases
- Reduce debugging time with fast feedback loops
- Maintain code quality over time

**In this document:**

- **Co-located Tests** - Place test files next to source files
- **AAA Pattern** - Structure tests with Arrange-Act-Assert sections
- **Mock Objects via Interfaces** - Create type-safe mocks through interfaces
- **Temp Directory Isolation** - Use real file system with isolated temp directories
- **Test Coverage Requirements** - Maintain 80%+ coverage standards
- **Comprehensive Test Organization** - Organize describe blocks and test cases effectively
- **Vi Mock System** - Use Vitest's powerful mocking capabilities including vi.hoisted()
- **Parameterized Tests** - Use it.each() for input validation and multiple scenarios
- **Security Test Labeling** - Prefix security-critical tests with SECURITY:
- **Protocol Violation Tests** - Test graceful handling of contract violations
- **Test Helper Factories** - Create reusable factory functions for test data
- **Shared Test Utilities** - Organize mocks and helpers in test-utils directories
- **Custom Matchers** - Extend expect with domain-specific assertions
- **Integration Test Configuration** - Configure separate environments for integration tests

**Prerequisites:**

- Understanding of Vitest test framework
- Familiarity with TypeScript testing
- Knowledge of Node.js file system operations
- Experience with async/await patterns

---

## Pattern 1: Co-located Tests

### Intent

Place test files directly next to their source files to improve discoverability and ensure tests move with code.

### Problem

When tests are separated into a dedicated test directory (e.g., `test/` or `__tests__/`), several problems arise. Finding the test for a given source file requires navigating to a different location. When files are moved or renamed, tests are easily forgotten and become outdated. The separation creates a mental barrier that discourages writing tests. There is no clear 1:1 relationship between source and test files.

### Solution

Place each test file directly next to its corresponding source file with a `.test.ts` extension. This creates a clear relationship, ensures tests move with source during refactoring, and makes tests easy to find. Tests become a natural part of the codebase rather than a separate concern.

### Structure

```
src/
├── services/
│   ├── fileSystemService.ts       # Source file
│   ├── fileSystemService.test.ts  # Test file (co-located)
│   ├── authService.ts
│   └── authService.test.ts
├── tools/
│   ├── readFile.ts
│   ├── readFile.test.ts
│   ├── writeFile.ts
│   └── writeFile.test.ts
```

### Implementation

**Step 1: Create test file next to source**

```typescript
// src/services/fileSystemService.ts
export class FileSystemService {
  async readTextFile(filePath: string): Promise<string> {
    // Implementation
  }
}

// src/services/fileSystemService.test.ts (same directory)
import { describe, it, expect } from 'vitest';
import { FileSystemService } from './fileSystemService.js';

describe('FileSystemService', () => {
  it('should read file contents', async () => {
    // Test implementation
  });
});
```

**Step 2: Configure test discovery pattern**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'], // Find all .test.ts files in src/
    exclude: ['node_modules', 'dist'],
  },
});
```

**Step 3: Update build configuration to exclude tests**

```json
// tsconfig.json
{
  "exclude": ["**/*.test.ts", "**/*.test.tsx"]
}
```

### Complete Example

```typescript
// src/tools/ls.ts
import type { Config } from '../config/config.js';
import { ToolErrorType } from './tool-error.js';

export class LSTool {
  constructor(private config: Config) {}

  build(params: { dir_path: string }) {
    // Build invocation
    return new LSToolInvocation(this.config, params);
  }
}

class LSToolInvocation {
  constructor(
    private config: Config,
    private params: { dir_path: string }
  ) {}

  async execute(signal: AbortSignal) {
    // List directory contents
  }
}

// src/tools/ls.test.ts (co-located)
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { LSTool } from './ls.js';
import type { Config } from '../config/config.js';

describe('LSTool', () => {
  let lsTool: LSTool;
  let tempRootDir: string;
  let mockConfig: Config;
  const abortSignal = new AbortController().signal;

  beforeEach(async () => {
    const realTmp = await fs.realpath(os.tmpdir());
    tempRootDir = await fs.mkdtemp(path.join(realTmp, 'ls-tool-root-'));

    mockConfig = {
      getTargetDir: () => tempRootDir,
      // Other config methods
    } as unknown as Config;

    lsTool = new LSTool(mockConfig);
  });

  afterEach(async () => {
    await fs.rm(tempRootDir, { recursive: true, force: true });
  });

  describe('execute', () => {
    it('should list files in a directory', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.mkdir(path.join(tempRootDir, 'subdir'));

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('[DIR] subdir');
      expect(result.llmContent).toContain('file1.txt');
      expect(result.returnDisplay).toBe('Listed 2 item(s).');
    });

    it('should handle empty directories', async () => {
      // Arrange
      const emptyDir = path.join(tempRootDir, 'empty');
      await fs.mkdir(emptyDir);

      // Act
      const invocation = lsTool.build({ dir_path: emptyDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toBe(`Directory ${emptyDir} is empty.`);
      expect(result.returnDisplay).toBe('Directory is empty.');
    });
  });
});
```

**Example explained:**

- Lines 1-23: Source file defines LSTool class and invocation
- Lines 25-26: Test file imports from same directory using relative path
- Lines 28-44: Test setup creates isolated temp directory for each test
- Lines 46-74: Test cases verify behavior with real file system operations

### When to Use

**Use co-located tests when:**

- Writing unit tests for services, tools, or utilities
- Testing classes or functions in TypeScript files
- Building a new feature that requires test coverage
- Refactoring code and need to move tests with source

**Avoid co-located tests when:**

- Writing integration tests that span multiple modules (use `integration-tests/` directory)
- Creating end-to-end tests (use separate `e2e/` directory)
- Tests require extensive fixtures or test data (use `test/fixtures/`)

### Benefits

- **Discoverability**: Test file is always next to source file
- **Refactoring Safety**: Moving source file reminds you to move test
- **Reduced Cognitive Load**: No context switching between directories
- **Clear Relationship**: One-to-one mapping between source and test
- **Encourages Testing**: Lower friction to write and run tests

### Trade-offs

- **Directory Clutter**: More files in source directories
- **Build Configuration**: Must exclude test files from production builds
- **IDE Overhead**: Slightly more files for IDE to index
- **Convention Breaking**: Different from traditional separate test directories

### Common Mistakes

**Mistake 1: Forgetting to exclude tests from build**

**Bad:**

```json
// tsconfig.json
{
  "include": ["src/**/*"]
  // Tests will be compiled into dist/
}
```

**Good:**

```json
// tsconfig.json
{
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "**/*.test.tsx", "node_modules"]
}
```

**Why this matters**: Without exclusion, test files are compiled into the production build, increasing bundle size and potentially exposing test utilities.

**Mistake 2: Importing from parent test file**

**Bad:**

```typescript
// src/tools/readFile.test.ts
import { mockConfig } from '../../testUtils.test.js';
// Importing from another test file creates coupling
```

**Good:**

```typescript
// src/test-utils/mockConfig.ts (not a test file)
export function createMockConfig(): Config {
  // Shared test utility
}

// src/tools/readFile.test.ts
import { createMockConfig } from '../test-utils/mockConfig.js';
```

**Why this matters**: Tests should only import from source files or dedicated test utilities, never from other test files. This prevents coupling between tests.

### Testing Strategy

**What to Test:**

- Test file naming follows `[name].test.ts` convention
- Tests are in same directory as source
- Test files are excluded from production build
- Relative imports work correctly from test to source

**Test Organization:**

- One test file per source file
- Use same directory structure in test file
- Group related tests in describe blocks
- Use beforeEach/afterEach for setup/teardown

**Mock Strategy:**

- Import real implementations for co-located testing
- Mock external dependencies via interfaces
- Use temp directories for file system operations

**Test Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { FileDiscoveryService } from './fileDiscoveryService.js';

describe('FileDiscoveryService', () => {
  describe('co-located test structure', () => {
    it('should import correctly using relative path', () => {
      // Arrange
      const service = new FileDiscoveryService('/tmp');

      // Act & Assert
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(FileDiscoveryService);
    });

    it('should have access to all exported members', () => {
      // Verify test can access public API
      expect(FileDiscoveryService).toBeDefined();
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 70%+
- Co-located tests cover all exported functions and classes

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Structure tests clearly within co-located files
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Organize describe blocks in co-located tests

---

## Pattern 2: AAA Pattern (Arrange-Act-Assert)

### Intent

Structure test cases with three distinct sections: Arrange (setup), Act (execute), Assert (verify) to improve readability and maintainability.

### Problem

Test cases without clear structure become difficult to understand and maintain. When setup, execution, and verification are mixed together, tests are hard to debug when they fail. New developers struggle to understand what is being tested versus what is test setup. Complex tests become unmaintainable as they grow.

### Solution

Structure every test case with three clearly labeled sections: Arrange for test setup and preconditions, Act for executing the code under test, Assert for verifying expected outcomes. Use comments or blank lines to visually separate these sections. This pattern makes tests self-documenting and easy to understand at a glance.

### Structure

```typescript
it('should perform expected behavior', async () => {
  // Arrange - Set up test preconditions
  const input = 'test input';
  const expectedOutput = 'expected result';

  // Act - Execute the code under test
  const result = await functionUnderTest(input);

  // Assert - Verify the outcome
  expect(result).to.equal(expectedOutput);
});
```

### Implementation

**Step 1: Arrange - Set up test data and preconditions**

```typescript
it('should read file contents', async () => {
  // Arrange
  const service = new FileSystemService();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  const filePath = path.join(tempDir, 'test.txt');
  await fs.writeFile(filePath, 'Hello, World!', 'utf-8');
```

**Step 2: Act - Execute the code being tested**

```typescript
// Act
const content = await service.readTextFile(filePath);
```

**Step 3: Assert - Verify expected outcomes**

```typescript
  // Assert
  expect(content).to.equal('Hello, World!');

  // Cleanup
  await fs.rm(tempDir, { recursive: true, force: true });
});
```

### Complete Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { LSTool } from './ls.js';
import type { Config } from '../config/config.js';

describe('LSTool', () => {
  let lsTool: LSTool;
  let tempRootDir: string;
  let mockConfig: Config;
  const abortSignal = new AbortController().signal;

  beforeEach(async () => {
    const realTmp = await fs.realpath(os.tmpdir());
    tempRootDir = await fs.mkdtemp(path.join(realTmp, 'ls-tool-root-'));
    mockConfig = {
      getTargetDir: () => tempRootDir,
    } as unknown as Config;
    lsTool = new LSTool(mockConfig);
  });

  afterEach(async () => {
    await fs.rm(tempRootDir, { recursive: true, force: true });
  });

  describe('execute', () => {
    it('should list files in a directory', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.mkdir(path.join(tempRootDir, 'subdir'));

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('[DIR] subdir');
      expect(result.llmContent).toContain('file1.txt');
      expect(result.returnDisplay).toBe('Listed 2 item(s).');
    });

    it('should handle empty directories', async () => {
      // Arrange
      const emptyDir = path.join(tempRootDir, 'empty');
      await fs.mkdir(emptyDir);

      // Act
      const invocation = lsTool.build({ dir_path: emptyDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toBe(`Directory ${emptyDir} is empty.`);
      expect(result.returnDisplay).toBe('Directory is empty.');
    });

    it('should throw error when file does not exist', async () => {
      // Arrange
      const nonExistentPath = path.join(tempRootDir, 'does-not-exist');

      // Act
      const invocation = lsTool.build({ dir_path: nonExistentPath });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('Error listing directory');
      expect(result.error?.type).toBe(ToolErrorType.LS_EXECUTION_ERROR);
    });

    it('should respect ignore patterns', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempRootDir, 'file2.log'), 'content2');

      // Act
      const invocation = lsTool.build({
        dir_path: tempRootDir,
        ignore: ['*.log'],
      });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('file1.txt');
      expect(result.llmContent).not.toContain('file2.log');
      expect(result.returnDisplay).toBe('Listed 1 item(s).');
    });
  });
});
```

**Example explained:**

- Lines 15-22: beforeEach handles common arrange setup for all tests
- Lines 24-26: afterEach handles cleanup
- Lines 30-32: Arrange section creates test files
- Lines 34-35: Act section executes the tool
- Lines 37-39: Assert section verifies all expected outcomes
- Lines 42-51: Empty directory test follows same AAA structure
- Lines 53-63: Error case test shows Act+Assert can be combined for exceptions
- Lines 65-79: Pattern filtering test demonstrates AAA with multiple assertions

### When to Use

**Use AAA pattern when:**

- Writing any unit test or integration test
- Test has setup, execution, and verification steps
- Test needs to be understood by other developers
- Debugging a failing test requires clear section identification

**Avoid AAA pattern when:**

- Test is so simple that sections are obvious (e.g., single assertion)
- Writing parameterized tests where structure varies
- Test is exploratory and structure will change

### Benefits

- **Readability**: Clear visual separation of test phases
- **Maintainability**: Easy to modify individual sections
- **Debugging**: Quickly identify which phase is failing
- **Self-Documenting**: Test structure tells a story
- **Consistency**: All tests follow same pattern

### Trade-offs

- **Verbosity**: Comments add lines to test file
- **Rigidity**: May feel restrictive for very simple tests
- **Learning Curve**: New developers must learn the pattern

### Common Mistakes

**Mistake 1: Mixing arrange and act**

**Bad:**

```typescript
it('should process data', async () => {
  const service = new DataService();
  const result = await service.process('input');
  expect(result).toBe('processed');
  // Hard to see where setup ends and execution begins
});
```

**Good:**

```typescript
it('should process data', async () => {
  // Arrange
  const service = new DataService();
  const input = 'input';

  // Act
  const result = await service.process(input);

  // Assert
  expect(result).toBe('processed');
});
```

**Why this matters**: Clear separation makes it obvious what is being tested and what is setup. When tests fail, you know which section to examine first.

**Mistake 2: Multiple acts in one test**

**Bad:**

```typescript
it('should handle multiple operations', async () => {
  // Arrange
  const service = new UserService();

  // Act
  const user1 = await service.createUser('Alice');
  const user2 = await service.createUser('Bob');
  const users = await service.listUsers();

  // Assert
  expect(users).toHaveLength(2);
  // Testing three different operations in one test
});
```

**Good:**

```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    // Arrange
    const service = new UserService();

    // Act
    const user = await service.createUser('Alice');

    // Assert
    expect(user.name).toBe('Alice');
  });

  it('should list all users', async () => {
    // Arrange
    const service = new UserService();
    await service.createUser('Alice');
    await service.createUser('Bob');

    // Act
    const users = await service.listUsers();

    // Assert
    expect(users).toHaveLength(2);
  });
});
```

**Why this matters**: Each test should verify one behavior. Multiple acts indicate the test is doing too much and should be split into separate tests.

### Testing Strategy

**What to Test:**

- Each test has clear Arrange, Act, Assert sections
- Comments or blank lines separate sections
- Act section contains only the code being tested
- Assert section contains all verifications

**Test Organization:**

- Use AAA pattern for all tests consistently
- Label sections with comments for clarity
- Keep each section focused and minimal
- Use beforeEach for common arrange logic

**Mock Strategy:**

- Set up mocks in Arrange section
- Verify mock calls in Assert section
- Reset mocks in afterEach

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AAA Pattern Examples', () => {
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = {
      fetch: vi.fn().mockResolvedValue({ data: 'mocked' }),
    };
  });

  it('should follow AAA pattern with mock', async () => {
    // Arrange
    const service = new DataService(mockDependency);
    const input = 'test-id';

    // Act
    const result = await service.getData(input);

    // Assert
    expect(result.data).toBe('mocked');
    expect(mockDependency.fetch).toHaveBeenCalledWith(input);
    expect(mockDependency.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle errors with AAA', async () => {
    // Arrange
    mockDependency.fetch.mockRejectedValue(new Error('Network error'));
    const service = new DataService(mockDependency);

    // Act & Assert (combined for error testing)
    await expect(service.getData('test-id')).rejects.toThrow('Network error');
  });
});
```

**Coverage Goals:**

- 100% of tests follow AAA pattern
- Arrange sections set up all necessary preconditions
- Act sections execute exactly one operation
- Assert sections verify all expected outcomes

### Related Patterns

- **[Co-located Tests](#pattern-1-co-located-tests)** - Structure co-located tests with AAA
- **[Mock Objects](#pattern-3-mock-objects-via-interfaces)** - Set up mocks in Arrange section
- **[Temp Directory Isolation](#pattern-4-temp-directory-isolation)** - Arrange includes temp directory setup

---

## Pattern 3: Mock Objects via Interfaces

### Intent

Create explicit mock implementations of interfaces for testing rather than using magic mocking libraries, ensuring type safety and clear mock behavior.

### Problem

Magic mocking libraries (like sinon, jest.fn) create mocks at runtime without type safety. Mock behavior is often implicit and hard to understand. When interfaces change, magic mocks do not produce compile-time errors. Mock verification requires learning library-specific APIs. Tests become tightly coupled to mocking library syntax.

### Solution

Define clear interfaces for dependencies, then create explicit mock classes that implement those interfaces. Mock classes have the same type signature as real implementations but with controllable behavior for testing. This provides compile-time type safety, makes mock behavior explicit, and allows easy verification of interactions.

### Structure

```typescript
// Interface definition
interface ApiClient {
  fetch(url: string): Promise<Response>;
}

// Real implementation
class RealApiClient implements ApiClient {
  async fetch(url: string): Promise<Response> {
    return await fetch(url);
  }
}

// Mock implementation
class MockApiClient implements ApiClient {
  private responses = new Map<string, Response>();
  public callLog: string[] = [];

  setResponse(url: string, response: Response): void {
    this.responses.set(url, response);
  }

  async fetch(url: string): Promise<Response> {
    this.callLog.push(url);
    const response = this.responses.get(url);
    if (!response) {
      throw new Error(`No mock response for: ${url}`);
    }
    return response;
  }
}
```

### Implementation

**Step 1: Define interface contract**

```typescript
// src/services/apiClient.ts
export interface ApiClient {
  fetch(url: string): Promise<Response>;
  post(url: string, data: unknown): Promise<Response>;
}
```

**Step 2: Create real implementation**

```typescript
// src/services/realApiClient.ts
import type { ApiClient } from './apiClient.js';

export class RealApiClient implements ApiClient {
  async fetch(url: string): Promise<Response> {
    return await fetch(url);
  }

  async post(url: string, data: unknown): Promise<Response> {
    return await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}
```

**Step 3: Create mock implementation for testing**

```typescript
// src/test-utils/mockApiClient.ts
import type { ApiClient } from '../services/apiClient.js';

export class MockApiClient implements ApiClient {
  private responses = new Map<string, Response>();
  public callLog: Array<{ method: string; url: string; data?: unknown }> = [];

  setResponse(url: string, response: Response): void {
    this.responses.set(url, response);
  }

  async fetch(url: string): Promise<Response> {
    this.callLog.push({ method: 'GET', url });
    return this.getResponse(url);
  }

  async post(url: string, data: unknown): Promise<Response> {
    this.callLog.push({ method: 'POST', url, data });
    return this.getResponse(url);
  }

  private getResponse(url: string): Response {
    const response = this.responses.get(url);
    if (!response) {
      throw new Error(`No mock response configured for: ${url}`);
    }
    return response;
  }

  reset(): void {
    this.responses.clear();
    this.callLog = [];
  }

  getCallCount(url: string): number {
    return this.callLog.filter((call) => call.url === url).length;
  }
}
```

### Complete Example

```typescript
// src/services/dataService.ts
import type { ApiClient } from './apiClient.js';

export class DataService {
  constructor(private apiClient: ApiClient) {}

  async getData(id: string): Promise<{ id: string; name: string }> {
    const response = await this.apiClient.fetch(`/api/data/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return await response.json();
  }

  async saveData(data: { id: string; name: string }): Promise<void> {
    const response = await this.apiClient.post('/api/data', data);
    if (!response.ok) {
      throw new Error(`Failed to save data: ${response.statusText}`);
    }
  }
}

// src/services/dataService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DataService } from './dataService.js';
import { MockApiClient } from '../test-utils/mockApiClient.js';

describe('DataService', () => {
  let mockApi: MockApiClient;
  let dataService: DataService;

  beforeEach(() => {
    mockApi = new MockApiClient();
    dataService = new DataService(mockApi);
  });

  describe('getData', () => {
    it('should fetch data from API', async () => {
      // Arrange
      const testId = 'test-123';
      const mockResponse = {
        ok: true,
        json: async () => ({ id: testId, name: 'Test Data' }),
      } as Response;
      mockApi.setResponse(`/api/data/${testId}`, mockResponse);

      // Act
      const result = await dataService.getData(testId);

      // Assert
      expect(result).toEqual({ id: testId, name: 'Test Data' });
      expect(mockApi.callLog).toHaveLength(1);
      expect(mockApi.callLog[0]).toEqual({
        method: 'GET',
        url: `/api/data/${testId}`,
      });
    });

    it('should throw error when API returns error', async () => {
      // Arrange
      const testId = 'test-123';
      const errorResponse = {
        ok: false,
        statusText: 'Not Found',
      } as Response;
      mockApi.setResponse(`/api/data/${testId}`, errorResponse);

      // Act & Assert
      await expect(dataService.getData(testId)).rejects.toThrow('Failed to fetch data: Not Found');
    });
  });

  describe('saveData', () => {
    it('should post data to API', async () => {
      // Arrange
      const testData = { id: 'test-123', name: 'Test Data' };
      const mockResponse = { ok: true } as Response;
      mockApi.setResponse('/api/data', mockResponse);

      // Act
      await dataService.saveData(testData);

      // Assert
      expect(mockApi.callLog).toHaveLength(1);
      expect(mockApi.callLog[0]).toEqual({
        method: 'POST',
        url: '/api/data',
        data: testData,
      });
    });

    it('should throw error when save fails', async () => {
      // Arrange
      const testData = { id: 'test-123', name: 'Test Data' };
      const errorResponse = {
        ok: false,
        statusText: 'Internal Server Error',
      } as Response;
      mockApi.setResponse('/api/data', errorResponse);

      // Act & Assert
      await expect(dataService.saveData(testData)).rejects.toThrow(
        'Failed to save data: Internal Server Error'
      );
    });
  });
});
```

**Example explained:**

- Lines 1-17: DataService depends on ApiClient interface
- Lines 19-20: Test imports real service and mock client
- Lines 22-30: Setup creates mock and injects it into service
- Lines 32-48: Test configures mock response and verifies calls
- Lines 50-61: Error case test shows explicit error handling
- Lines 63-97: Additional tests demonstrate mock versatility

### When to Use

**Use mock objects via interfaces when:**

- Testing code that depends on external services (APIs, databases)
- Dependency is slow, unreliable, or has side effects
- Need to simulate error conditions or edge cases
- Want compile-time type safety for mocks
- Multiple tests need same mock behavior

**Avoid mock objects when:**

- Real implementation is fast and deterministic (use real implementation)
- Dependency is a simple data structure (use test fixtures)
- Mocking would test implementation details rather than behavior

### Benefits

- **Type Safety**: Compiler catches interface changes in mocks
- **Explicit Behavior**: Mock behavior is clear and documented
- **No Magic**: No runtime reflection or proxy objects
- **Verification**: Easy to verify interactions with callLog
- **Reusable**: Mock classes can be reused across tests
- **Self-Documenting**: Mock implementation shows expected interface usage

### Trade-offs

- **More Code**: Must write explicit mock classes
- **Maintenance**: Mocks must be updated when interfaces change
- **Boilerplate**: Each interface needs corresponding mock
- **Learning Curve**: Developers must understand the pattern

### Common Mistakes

**Mistake 1: Using any type for mocks**

**Bad:**

```typescript
it('should call API', async () => {
  const mockApi: any = {
    fetch: () => Promise.resolve({ ok: true }),
  };
  // No type safety
});
```

**Good:**

```typescript
class MockApiClient implements ApiClient {
  async fetch(url: string): Promise<Response> {
    return { ok: true } as Response;
  }
  // TypeScript enforces interface compliance
}

it('should call API', async () => {
  const mockApi = new MockApiClient();
  // Type safe
});
```

**Why this matters**: Using `any` defeats the purpose of TypeScript. When the interface changes, tests with `any` mocks will not fail at compile time, leading to runtime errors.

**Mistake 2: Not tracking mock interactions**

**Bad:**

```typescript
class MockApiClient implements ApiClient {
  async fetch(url: string): Promise<Response> {
    return { ok: true } as Response;
  }
  // No way to verify fetch was called
}
```

**Good:**

```typescript
class MockApiClient implements ApiClient {
  public callLog: string[] = [];

  async fetch(url: string): Promise<Response> {
    this.callLog.push(url);
    return { ok: true } as Response;
  }

  getCallCount(): number {
    return this.callLog.length;
  }
}

it('should call API once', async () => {
  const mockApi = new MockApiClient();
  await service.getData('123');
  expect(mockApi.getCallCount()).toBe(1);
});
```

**Why this matters**: Without interaction tracking, you cannot verify that dependencies were called correctly. The callLog pattern allows assertion on both call counts and parameters.

### Testing Strategy

**What to Test:**

- Mock implements all interface methods
- Mock tracks all interactions in callLog
- Mock throws errors for unconfigured scenarios
- Mock can be reset between tests
- Service uses mock correctly

**Test Organization:**

- Create mocks in `src/test-utils/` directory
- One mock class per interface
- Co-locate mock tests with mock implementation
- Use beforeEach to reset mocks

**Mock Strategy:**

- Implement complete interface, not partial mocks
- Track calls in public callLog property
- Provide setResponse/setError methods to configure behavior
- Include reset() method for cleanup
- Use type assertions sparingly and safely

**Test Example:**

```typescript
import { describe, it, expect } from 'vitest';
import type { ApiClient } from '../services/apiClient.js';
import { MockApiClient } from './mockApiClient.js';

describe('MockApiClient', () => {
  it('should implement ApiClient interface', () => {
    // Arrange & Act
    const mock = new MockApiClient();

    // Assert
    expect(mock).toBeDefined();
    expect(typeof mock.fetch).toBe('function');
    expect(typeof mock.post).toBe('function');
  });

  it('should track fetch calls', async () => {
    // Arrange
    const mock = new MockApiClient();
    const mockResponse = { ok: true } as Response;
    mock.setResponse('/api/test', mockResponse);

    // Act
    await mock.fetch('/api/test');

    // Assert
    expect(mock.callLog).toHaveLength(1);
    expect(mock.callLog[0].url).toBe('/api/test');
  });

  it('should throw when response not configured', async () => {
    // Arrange
    const mock = new MockApiClient();

    // Act & Assert
    await expect(mock.fetch('/unconfigured')).rejects.toThrow(
      'No mock response configured for: /unconfigured'
    );
  });

  it('should reset call log', async () => {
    // Arrange
    const mock = new MockApiClient();
    const mockResponse = { ok: true } as Response;
    mock.setResponse('/api/test', mockResponse);
    await mock.fetch('/api/test');

    // Act
    mock.reset();

    // Assert
    expect(mock.callLog).toHaveLength(0);
  });
});
```

**Coverage Goals:**

- Line coverage: 100% for mock classes
- All interface methods implemented
- All error paths tested
- All tracking methods verified

### Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Interfaces provide type safety for mocks
- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Set up mocks in Arrange section
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Organize mock setup in beforeEach

---

## Pattern 4: Temp Directory Isolation

### Intent

Use real file system operations with isolated temporary directories for each test to avoid complex mocking while ensuring test independence.

### Problem

Mocking file system operations is complex and error-prone. Mock file systems do not catch real path resolution bugs, permission issues, or platform-specific behavior. Tests that use a shared test directory can interfere with each other. Leftover files from failed tests cause subsequent test failures. Tests that modify the actual working directory can break the entire test suite.

### Solution

Create a unique temporary directory for each test using OS temp directory facilities. Use real file system operations (fs.writeFile, fs.mkdir, etc.) within the temp directory. Clean up the temp directory in afterEach to ensure no state leaks between tests. This provides true file system behavior without affecting other tests or the working directory.

### Structure

```typescript
describe('Tool that uses file system', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-prefix-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should work with files', async () => {
    const testFile = path.join(tempDir, 'test.txt');
    await fs.writeFile(testFile, 'content');
    // Test uses real file operations
  });
});
```

### Implementation

**Step 1: Set up temp directory in beforeEach**

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('FileOperations', () => {
  let tempRootDir: string;

  beforeEach(async () => {
    // Use realpath to resolve symlinks (important on macOS)
    const realTmp = await fs.realpath(os.tmpdir());

    // Create unique temp directory with prefix
    tempRootDir = await fs.mkdtemp(path.join(realTmp, 'file-ops-test-'));
  });
});
```

**Step 2: Clean up in afterEach**

```typescript
afterEach(async () => {
  // Remove temp directory and all contents
  await fs.rm(tempRootDir, { recursive: true, force: true });
});
```

**Step 3: Use temp directory in tests**

```typescript
it('should create and read file', async () => {
  // Arrange
  const filePath = path.join(tempRootDir, 'test.txt');
  const content = 'Hello, World!';

  // Act
  await fs.writeFile(filePath, content, 'utf-8');
  const readContent = await fs.readFile(filePath, 'utf-8');

  // Assert
  expect(readContent).toBe(content);
});
```

### Complete Example

```typescript
// src/services/fileDiscoveryService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { FileDiscoveryService } from './fileDiscoveryService.js';

describe('FileDiscoveryService', () => {
  let testRootDir: string;
  let projectRoot: string;

  // Helper function to create test files
  async function createTestFile(filePath: string, content = '') {
    const fullPath = path.join(projectRoot, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return fullPath;
  }

  beforeEach(async () => {
    // Create isolated temp directory
    testRootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-discovery-test-'));
    projectRoot = path.join(testRootDir, 'project');
    await fs.mkdir(projectRoot, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(testRootDir, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should initialize git ignore parser in git repo', async () => {
      // Arrange
      await fs.mkdir(path.join(projectRoot, '.git'));
      await createTestFile('.gitignore', 'node_modules/');

      // Act
      const service = new FileDiscoveryService(projectRoot);

      // Assert
      expect(service.shouldIgnoreFile('node_modules/foo.js')).toBe(true);
      expect(service.shouldIgnoreFile('src/foo.js')).toBe(false);
    });

    it('should not load gitignore in non-git repo', async () => {
      // Arrange - No .git directory
      await createTestFile('.gitignore', 'node_modules/');

      // Act
      const service = new FileDiscoveryService(projectRoot);

      // Assert
      expect(service.shouldIgnoreFile('node_modules/foo.js')).toBe(false);
    });
  });

  describe('filterFiles', () => {
    beforeEach(async () => {
      // Set up git repo with ignore files
      await fs.mkdir(path.join(projectRoot, '.git'));
      await createTestFile('.gitignore', 'node_modules/\n.git/\ndist');
      await createTestFile('.geminiignore', 'logs/');
    });

    it('should filter out ignored files', () => {
      // Arrange
      const files = [
        'src/index.ts',
        'node_modules/package/index.js',
        'README.md',
        '.git/config',
        'dist/bundle.js',
        'logs/latest.log',
      ].map((f) => path.join(projectRoot, f));

      const service = new FileDiscoveryService(projectRoot);

      // Act
      const filtered = service.filterFiles(files);

      // Assert
      expect(filtered).toEqual(['src/index.ts', 'README.md'].map((f) => path.join(projectRoot, f)));
    });

    it('should handle empty file list', () => {
      // Arrange
      const service = new FileDiscoveryService(projectRoot);

      // Act
      const filtered = service.filterFiles([]);

      // Assert
      expect(filtered).toEqual([]);
    });
  });

  describe('complex directory structures', () => {
    it('should handle nested directories', async () => {
      // Arrange
      await createTestFile('src/components/Button.tsx', 'export Button');
      await createTestFile('src/utils/helpers.ts', 'export helpers');
      await createTestFile('tests/unit/button.test.ts', 'test Button');

      const service = new FileDiscoveryService(projectRoot);

      // Act
      const allFiles = [
        path.join(projectRoot, 'src/components/Button.tsx'),
        path.join(projectRoot, 'src/utils/helpers.ts'),
        path.join(projectRoot, 'tests/unit/button.test.ts'),
      ];

      // Assert
      expect(allFiles).toHaveLength(3);
      // Real files exist
      for (const file of allFiles) {
        await expect(fs.access(file)).resolves.toBeUndefined();
      }
    });
  });
});
```

**Example explained:**

- Lines 10-18: Helper function creates test files in temp directory
- Lines 20-26: beforeEach creates unique temp directory for each test
- Lines 28-31: afterEach cleans up temp directory
- Lines 33-47: Test uses real .git directory and .gitignore file
- Lines 49-57: Test verifies behavior without .git directory
- Lines 59-98: Tests create actual files and verify filtering behavior
- Lines 100-120: Complex test creates nested directory structure

### When to Use

**Use temp directory isolation when:**

- Testing code that reads or writes files
- Testing tools that interact with file system
- Testing directory traversal or file discovery
- Need to verify actual file system behavior
- Want to test permission errors or path issues

**Avoid temp directory isolation when:**

- File system operations are not being tested
- Tests only need in-memory data structures
- Performance is critical (real IO is slower)
- Testing pure functions without side effects

### Benefits

- **Real Behavior**: Tests catch actual file system bugs
- **Test Independence**: Each test has its own isolated directory
- **No State Leakage**: Cleanup ensures no interference between tests
- **Platform Testing**: Catches platform-specific path issues
- **Simple**: No complex mocking or stubbing required
- **Debugging**: Can inspect actual files in temp directory during test failures

### Trade-offs

- **Slower**: Real file system operations are slower than mocks
- **Disk Usage**: Creates actual files on disk
- **Cleanup Required**: Must ensure cleanup in afterEach
- **Platform Differences**: May behave differently on different operating systems

### Common Mistakes

**Mistake 1: Using working directory instead of temp directory**

**Bad:**

```typescript
it('should write file', async () => {
  // Writes to actual working directory
  await fs.writeFile('test.txt', 'content');
  // File remains after test, may conflict with other tests
});
```

**Good:**

```typescript
it('should write file', async () => {
  // Writes to isolated temp directory
  const filePath = path.join(tempDir, 'test.txt');
  await fs.writeFile(filePath, 'content');
  // Cleaned up in afterEach
});
```

**Why this matters**: Writing to the working directory can interfere with other tests and leaves files behind. Always use temp directories for test files.

**Mistake 2: Forgetting to clean up temp directory**

**Bad:**

```typescript
describe('FileOperations', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  // No afterEach cleanup
  // Temp directories accumulate over time
});
```

**Good:**

```typescript
describe('FileOperations', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
```

**Why this matters**: Without cleanup, temp directories accumulate and consume disk space. Use afterEach to ensure cleanup happens even when tests fail.

**Mistake 3: Not resolving symlinks on macOS**

**Bad:**

```typescript
beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  // On macOS, os.tmpdir() may return a symlink
  // Path comparisons may fail
});
```

**Good:**

```typescript
beforeEach(async () => {
  const realTmp = await fs.realpath(os.tmpdir());
  tempDir = await fs.mkdtemp(path.join(realTmp, 'test-'));
  // Resolves symlinks for consistent path comparisons
});
```

**Why this matters**: On macOS, `/var` is a symlink to `/private/var`. Without realpath, path comparisons may fail when testing path validation.

### Testing Strategy

**What to Test:**

- File creation and reading in temp directory
- Directory creation and traversal
- Path validation and normalization
- Error handling for missing files or directories
- Ignore patterns (gitignore, custom patterns)
- Permission errors (if applicable)

**Test Organization:**

- Create temp directory in beforeEach
- Clean up in afterEach (always run, even on failure)
- Create helper functions for common file operations
- Use descriptive prefixes in temp directory names

**Mock Strategy:**

- Do NOT mock file system operations
- Use real fs module with temp directories
- Mock external dependencies (API clients, etc.)
- Use interfaces for dependencies, not file system

**Test Example:**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Temp Directory Isolation Example', () => {
  let tempDir: string;

  beforeEach(async () => {
    const realTmp = await fs.realpath(os.tmpdir());
    tempDir = await fs.mkdtemp(path.join(realTmp, 'isolation-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should isolate test files', async () => {
    // Arrange
    const file1 = path.join(tempDir, 'file1.txt');
    const file2 = path.join(tempDir, 'file2.txt');

    // Act
    await fs.writeFile(file1, 'content1');
    await fs.writeFile(file2, 'content2');

    // Assert
    const content1 = await fs.readFile(file1, 'utf-8');
    const content2 = await fs.readFile(file2, 'utf-8');
    expect(content1).toBe('content1');
    expect(content2).toBe('content2');
  });

  it('should have fresh directory for each test', async () => {
    // Arrange
    const files = await fs.readdir(tempDir);

    // Assert
    expect(files).toHaveLength(0);
    // Previous test's files are gone
  });
});
```

**Coverage Goals:**

- 100% cleanup in afterEach
- All file operations use temp directory paths
- No files written to working directory
- All tests are independent

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Arrange sets up temp directory
- **[Co-located Tests](#pattern-1-co-located-tests)** - Tests use real file system behavior
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - beforeEach/afterEach handle setup/cleanup

---

## Pattern 5: Test Coverage Requirements

### Intent

Maintain consistent high test coverage standards across the codebase to ensure code quality and catch regressions.

### Problem

Without coverage standards, developers write inconsistent amounts of tests. Low coverage areas become bug-prone and difficult to refactor. No objective measure of test completeness exists. Coverage gradually decreases as new code is added without tests. Teams have no way to enforce testing discipline.

### Solution

Establish explicit coverage targets for lines, statements, functions, and branches. Configure tools to measure coverage automatically during test runs. Fail builds when coverage falls below thresholds. Make coverage visible in code reviews. Focus on meaningful tests, not just hitting coverage numbers.

### Structure

```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70
    }
  }
});
```

### Implementation

**Step 1: Configure coverage tool in Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8', // Fast native coverage
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test-utils/**',
        '**/*.d.ts',
        'node_modules/**',
      ],
    },
  },
});
```

**Step 2: Add coverage scripts to package.json**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:check": "vitest run --coverage --reporter=json"
  }
}
```

**Step 3: Configure CI to enforce coverage**

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test:coverage
      # Vitest will fail if coverage thresholds not met
```

### Complete Example

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      // Coverage thresholds
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70,

      // Exclude from coverage
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test-utils/**',
        '**/*.d.ts',
        '**/types/**',
        'node_modules/**',
        'dist/**'
      ],

      // Report uncovered files
      all: true,

      // Output directory
      reportsDirectory: './coverage'
    },

    // Test timeout
    testTimeout: 10000
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

// package.json
{
  "name": "my-project",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:ui": "vitest run --coverage --ui",
    "test:coverage:check": "vitest run --coverage --reporter=json"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "vitest": "^1.0.0"
  }
}

// Example test demonstrating coverage
// src/services/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  isEven(n: number): boolean {
    return n % 2 === 0;
  }
}

// src/services/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { Calculator } from './calculator.js';

describe('Calculator', () => {
  const calc = new Calculator();

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calc.add(-2, -3)).toBe(-5);
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(calc.subtract(5, 3)).toBe(2);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(calc.divide(6, 3)).toBe(2);
    });

    it('should throw on division by zero', () => {
      expect(() => calc.divide(5, 0)).toThrow('Division by zero');
    });
  });

  describe('isEven', () => {
    it('should return true for even numbers', () => {
      expect(calc.isEven(4)).toBe(true);
    });

    it('should return false for odd numbers', () => {
      expect(calc.isEven(3)).toBe(false);
    });
  });
});

// Coverage Report (example output):
// ----------------------------|---------|----------|---------|---------|
// File                        | % Stmts | % Branch | % Funcs | % Lines |
// ----------------------------|---------|----------|---------|---------|
// All files                   |     100 |      100 |     100 |     100 |
//  services                   |     100 |      100 |     100 |     100 |
//   calculator.ts             |     100 |      100 |     100 |     100 |
// ----------------------------|---------|----------|---------|---------|
```

**Example explained:**

- Lines 1-44: Vitest config with comprehensive coverage settings
- Lines 46-59: Package scripts for running tests with coverage
- Lines 61-77: Calculator class with various methods to test
- Lines 79-122: Complete test suite covering all methods and branches
- Lines 124-130: Example coverage report showing 100% coverage

### When to Use

**Use test coverage requirements when:**

- Building production applications
- Working in a team with multiple contributors
- Need objective measure of test completeness
- Enforcing quality standards in CI/CD
- Refactoring legacy code and want safety net

**Avoid strict coverage requirements when:**

- Prototyping or exploring new ideas
- Writing throwaway code
- Code is trivial (getters/setters only)
- Coverage would require testing framework internals

### Benefits

- **Quality Assurance**: Consistent testing standards across team
- **Regression Prevention**: High coverage catches bugs early
- **Refactoring Confidence**: Tests provide safety net for changes
- **Visibility**: Coverage reports show weak areas
- **Enforcement**: CI fails when coverage drops below threshold
- **Documentation**: Tests serve as usage examples

### Trade-offs

- **False Security**: High coverage does not guarantee correctness
- **Test Quality**: Developers may write poor tests just to hit numbers
- **Maintenance Burden**: Tests must be maintained alongside code
- **Slower Development**: Writing tests takes time upfront
- **Coverage Pressure**: May discourage experimental code

### Common Mistakes

**Mistake 1: Chasing 100% coverage without meaningful tests**

**Bad:**

```typescript
// Just to hit coverage numbers
it('should call method', () => {
  const obj = new MyClass();
  obj.someMethod(); // No assertions
});
```

**Good:**

```typescript
it('should return expected result from someMethod', () => {
  // Arrange
  const obj = new MyClass();
  const input = 'test';

  // Act
  const result = obj.someMethod(input);

  // Assert
  expect(result).toBe('expected output');
  expect(result).toHaveLength(15);
});
```

**Why this matters**: Coverage is a measure of how much code is executed, not how well it's tested. Write meaningful assertions, not just function calls.

**Mistake 2: Not excluding test utilities from coverage**

**Bad:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      // Test utilities count toward coverage
      exclude: ['node_modules'],
    },
  },
});
```

**Good:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      exclude: ['**/*.test.ts', '**/test-utils/**', '**/*.d.ts', 'node_modules/**'],
    },
  },
});
```

**Why this matters**: Test utilities and test files themselves should not count toward coverage. Only production code should be measured.

**Mistake 3: Setting same threshold for all coverage types**

**Bad:**

```typescript
coverage: {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 80  // Too strict for branches
}
```

**Good:**

```typescript
coverage: {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 70  // Lower threshold for branches
}
```

**Why this matters**: Branch coverage is naturally lower because conditional logic creates many branches. Set achievable thresholds that balance quality with practicality.

### Testing Strategy

**What to Test:**

- Business logic functions and methods
- Error handling and edge cases
- All exported functions and classes
- Integration points between modules
- Complex conditional logic (branches)

**What NOT to Test:**

- Third-party libraries
- Generated code (e.g., Prisma client)
- Type definitions (.d.ts files)
- Test utilities themselves
- Simple getters/setters without logic

**Test Organization:**

- Focus on meaningful tests, not coverage numbers
- Test behavior, not implementation details
- Ensure all branches have explicit tests
- Use coverage reports to find untested code

**Mock Strategy:**

- Mock external dependencies to isolate code under test
- Do not mock internal modules just to increase coverage
- Use real implementations when practical

**Test Example:**

```typescript
// Example showing good coverage practices
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Test happy path (increases line coverage)
    });

    it('should throw on duplicate email', async () => {
      // Test error path (increases branch coverage)
    });

    it('should throw on invalid email format', async () => {
      // Test validation (increases branch coverage)
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Test success case
    });

    it('should return null when not found', async () => {
      // Test null case (branch coverage)
    });
  });
});
```

**Coverage Goals:**

- Lines: 80%+ (most code executed)
- Statements: 80%+ (most statements executed)
- Functions: 80%+ (most functions called)
- Branches: 70%+ (most conditional paths taken)

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Write clear tests that count toward coverage
- **[Co-located Tests](#pattern-1-co-located-tests)** - Coverage measured on co-located tests
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Organize tests to maximize coverage

---

## Pattern 6: Comprehensive Test Organization

### Intent

Organize test files with clear describe blocks, descriptive test names, and proper setup/teardown hooks to improve test maintainability and readability.

### Problem

Flat test files with many unorganized test cases become difficult to navigate. Without clear grouping, related tests are scattered. Setup code is duplicated across tests. Test names are vague and do not explain what is being tested. Failures are hard to debug because context is unclear.

### Solution

Use nested describe blocks to group related tests by feature, method, or scenario. Write descriptive test names that explain expected behavior. Extract common setup to beforeEach hooks. Use afterEach for cleanup. Follow consistent naming conventions (describe for groups, it for individual tests).

### Structure

```typescript
describe('ClassName or ModuleName', () => {
  // Shared setup
  let dependency: Dependency;

  beforeEach(() => {
    dependency = new Dependency();
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });

    it('should throw on invalid input', () => {
      // Test implementation
    });
  });

  describe('anotherMethod', () => {
    // More tests
  });
});
```

### Implementation

**Step 1: Outer describe block for class/module**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FileDiscoveryService } from './fileDiscoveryService.js';

describe('FileDiscoveryService', () => {
  let service: FileDiscoveryService;

  beforeEach(() => {
    service = new FileDiscoveryService('/tmp/test');
  });
});
```

**Step 2: Nested describe blocks for methods or features**

```typescript
describe('FileDiscoveryService', () => {
  let service: FileDiscoveryService;

  beforeEach(() => {
    service = new FileDiscoveryService('/tmp/test');
  });

  describe('initialization', () => {
    // Tests related to initialization
  });

  describe('filterFiles', () => {
    // Tests related to filterFiles method
  });

  describe('shouldIgnoreFile', () => {
    // Tests related to shouldIgnoreFile method
  });
});
```

**Step 3: Individual test cases with descriptive names**

```typescript
describe('filterFiles', () => {
  it('should filter out git-ignored files by default', () => {
    // Test implementation
  });

  it('should not filter files when respectGitIgnore is false', () => {
    // Test implementation
  });

  it('should handle empty file list', () => {
    // Test implementation
  });

  it('should filter multiple ignore patterns', () => {
    // Test implementation
  });
});
```

### Complete Example

```typescript
// src/tools/ls.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { LSTool } from './ls.js';
import type { Config } from '../config/config.js';
import { ToolErrorType } from './tool-error.js';

describe('LSTool', () => {
  // Top-level shared state
  let lsTool: LSTool;
  let tempRootDir: string;
  let mockConfig: Config;
  const abortSignal = new AbortController().signal;

  // Top-level setup
  beforeEach(async () => {
    const realTmp = await fs.realpath(os.tmpdir());
    tempRootDir = await fs.mkdtemp(path.join(realTmp, 'ls-tool-root-'));

    mockConfig = {
      getTargetDir: () => tempRootDir,
    } as unknown as Config;

    lsTool = new LSTool(mockConfig);
  });

  // Top-level cleanup
  afterEach(async () => {
    await fs.rm(tempRootDir, { recursive: true, force: true });
  });

  // Group 1: Parameter validation tests
  describe('parameter validation', () => {
    it('should accept valid absolute paths within workspace', async () => {
      // Arrange
      const testPath = path.join(tempRootDir, 'src');
      await fs.mkdir(testPath);

      // Act
      const invocation = lsTool.build({ dir_path: testPath });

      // Assert
      expect(invocation).toBeDefined();
    });

    it('should accept relative paths', async () => {
      // Arrange
      const testPath = path.join(tempRootDir, 'src');
      await fs.mkdir(testPath);
      const relativePath = path.relative(tempRootDir, testPath);

      // Act
      const invocation = lsTool.build({ dir_path: relativePath });

      // Assert
      expect(invocation).toBeDefined();
    });

    it('should reject paths outside workspace with clear error message', () => {
      // Act & Assert
      expect(() => lsTool.build({ dir_path: '/etc/passwd' })).toThrow(
        `Path must be within one of the workspace directories`
      );
    });
  });

  // Group 2: Execute method tests
  describe('execute', () => {
    it('should list files in a directory', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.mkdir(path.join(tempRootDir, 'subdir'));

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('[DIR] subdir');
      expect(result.llmContent).toContain('file1.txt');
      expect(result.returnDisplay).toBe('Listed 2 item(s).');
    });

    it('should handle empty directories', async () => {
      // Arrange
      const emptyDir = path.join(tempRootDir, 'empty');
      await fs.mkdir(emptyDir);

      // Act
      const invocation = lsTool.build({ dir_path: emptyDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toBe(`Directory ${emptyDir} is empty.`);
      expect(result.returnDisplay).toBe('Directory is empty.');
    });

    it('should respect ignore patterns', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempRootDir, 'file2.log'), 'content2');

      // Act
      const invocation = lsTool.build({
        dir_path: tempRootDir,
        ignore: ['*.log'],
      });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('file1.txt');
      expect(result.llmContent).not.toContain('file2.log');
    });

    // Nested describe for error cases
    describe('error handling', () => {
      it('should handle non-directory paths', async () => {
        // Arrange
        const testPath = path.join(tempRootDir, 'file1.txt');
        await fs.writeFile(testPath, 'content1');

        // Act
        const invocation = lsTool.build({ dir_path: testPath });
        const result = await invocation.execute(abortSignal);

        // Assert
        expect(result.error?.type).toBe(ToolErrorType.PATH_IS_NOT_A_DIRECTORY);
      });

      it('should handle non-existent paths', async () => {
        // Arrange
        const testPath = path.join(tempRootDir, 'does-not-exist');

        // Act
        const invocation = lsTool.build({ dir_path: testPath });
        const result = await invocation.execute(abortSignal);

        // Assert
        expect(result.error?.type).toBe(ToolErrorType.LS_EXECUTION_ERROR);
      });
    });
  });

  // Group 3: Ignore pattern tests
  describe('ignore patterns', () => {
    beforeEach(async () => {
      // Additional setup specific to ignore pattern tests
      await fs.writeFile(path.join(tempRootDir, '.gitignore'), '*.log');
      await fs.mkdir(path.join(tempRootDir, '.git'));
    });

    it('should respect gitignore patterns', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempRootDir, 'file2.log'), 'content2');

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).toContain('file1.txt');
      expect(result.llmContent).not.toContain('file2.log');
    });

    it('should respect geminiignore patterns', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, '.geminiignore'), '*.tmp');
      await fs.writeFile(path.join(tempRootDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(tempRootDir, 'file2.tmp'), 'content2');

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      expect(result.llmContent).not.toContain('file2.tmp');
    });
  });

  // Group 4: Sorting tests
  describe('sorting', () => {
    it('should sort directories first, then files alphabetically', async () => {
      // Arrange
      await fs.writeFile(path.join(tempRootDir, 'a-file.txt'), 'content');
      await fs.writeFile(path.join(tempRootDir, 'b-file.txt'), 'content');
      await fs.mkdir(path.join(tempRootDir, 'x-dir'));
      await fs.mkdir(path.join(tempRootDir, 'y-dir'));

      // Act
      const invocation = lsTool.build({ dir_path: tempRootDir });
      const result = await invocation.execute(abortSignal);

      // Assert
      const lines = (result.llmContent as string).split('\n');
      expect(lines[0]).toContain('[DIR] x-dir');
      expect(lines[1]).toContain('[DIR] y-dir');
      expect(lines[2]).toContain('a-file.txt');
      expect(lines[3]).toContain('b-file.txt');
    });
  });
});
```

**Example explained:**

- Lines 10-15: Top-level shared state for all tests
- Lines 17-26: Top-level beforeEach sets up common dependencies
- Lines 28-30: Top-level afterEach cleans up after all tests
- Lines 33-62: First describe group for parameter validation
- Lines 64-141: Second describe group for execute method
- Lines 114-139: Nested describe for error handling cases
- Lines 143-177: Third describe group for ignore patterns with additional beforeEach
- Lines 179-202: Fourth describe group for sorting behavior

### When to Use

**Use comprehensive test organization when:**

- Testing classes with multiple methods
- Testing modules with multiple functions
- Writing more than 3-5 test cases
- Tests share common setup or teardown
- Need to group related test cases

**Avoid deep nesting when:**

- Test file has only 1-2 simple tests
- Over-nesting creates excessive indentation
- Tests are completely independent with no shared setup

### Benefits

- **Readability**: Clear structure makes tests easy to understand
- **Navigation**: Describe blocks create logical sections
- **Setup Reuse**: beforeEach eliminates duplication
- **Debugging**: Nested structure provides context for failures
- **Selective Running**: Can run specific describe blocks
- **Documentation**: Structure documents the API

### Trade-offs

- **Verbosity**: More structure means more code
- **Over-nesting**: Too many levels can be confusing
- **Setup Complexity**: Multiple beforeEach hooks can be hard to track

### Common Mistakes

**Mistake 1: Flat test structure without grouping**

**Bad:**

```typescript
describe('FileService', () => {
  it('should read file', async () => {});
  it('should write file', async () => {});
  it('should delete file', async () => {});
  it('should read file with error', async () => {});
  it('should write file with error', async () => {});
  // No grouping, hard to find related tests
});
```

**Good:**

```typescript
describe('FileService', () => {
  describe('readFile', () => {
    it('should read file successfully', async () => {});
    it('should throw on missing file', async () => {});
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {});
    it('should throw on permission error', async () => {});
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {});
  });
});
```

**Why this matters**: Grouping related tests makes the test file scannable and helps locate specific tests quickly. It also documents the API structure.

**Mistake 2: Vague test names**

**Bad:**

```typescript
it('works', () => {});
it('test 1', () => {});
it('should work correctly', () => {});
```

**Good:**

```typescript
it('should return user when ID exists', async () => {});
it('should throw UserNotFoundError when ID does not exist', async () => {});
it('should cache user data for subsequent calls', async () => {});
```

**Why this matters**: Descriptive test names serve as documentation and make failures immediately understandable. Test names should complete the sentence "it should..."

**Mistake 3: Duplicated setup code in each test**

**Bad:**

```typescript
describe('Calculator', () => {
  it('should add', () => {
    const calc = new Calculator();
    // Duplicate setup
  });

  it('should subtract', () => {
    const calc = new Calculator();
    // Duplicate setup
  });
});
```

**Good:**

```typescript
describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  it('should add', () => {
    // Use calc
  });

  it('should subtract', () => {
    // Use calc
  });
});
```

**Why this matters**: beforeEach eliminates duplication and ensures consistent setup across tests. Changes to setup only need to be made in one place.

### Testing Strategy

**What to Test:**

- Test organization follows nested describe pattern
- Top-level describe names class or module
- Second-level describe names method or feature
- Test names are descriptive and complete "it should..." sentence
- Common setup uses beforeEach
- Cleanup uses afterEach

**Test Organization:**

- One describe per class/module
- Nested describe per method/feature
- Group error cases together
- Group happy path and edge cases together
- Use beforeEach for common setup
- Use afterEach for cleanup

**Mock Strategy:**

- Set up mocks in beforeEach
- Reset mocks in afterEach
- Use nested beforeEach for specialized setup

**Test Example:**

```typescript
describe('ExampleService', () => {
  let service: ExampleService;
  let mockDependency: MockDependency;

  beforeEach(() => {
    mockDependency = new MockDependency();
    service = new ExampleService(mockDependency);
  });

  describe('getData', () => {
    describe('success cases', () => {
      it('should return data when available', async () => {
        // Happy path test
      });

      it('should cache data for repeated calls', async () => {
        // Caching behavior test
      });
    });

    describe('error cases', () => {
      it('should throw when dependency fails', async () => {
        // Error handling test
      });

      it('should throw on invalid input', async () => {
        // Validation test
      });
    });
  });

  describe('saveData', () => {
    it('should save data successfully', async () => {
      // Save test
    });
  });
});
```

**Coverage Goals:**

- All public methods have describe blocks
- Related tests are grouped together
- Setup/teardown is handled consistently
- Test names clearly describe behavior

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Structure individual tests within describe blocks
- **[Co-located Tests](#pattern-1-co-located-tests)** - Organize co-located tests with describe blocks
- **[Temp Directory Isolation](#pattern-4-temp-directory-isolation)** - Use beforeEach/afterEach for temp directory setup/cleanup

---

## Pattern 7: Vi Mock System

### Intent

Use Vitest's `vi` mocking system to mock modules, functions, and timers for effective unit testing with TypeScript type safety.

### Problem

Real dependencies can be slow, unreliable, or have side effects that make testing difficult. Testing time-dependent code requires waiting for actual time to pass. Some dependencies require complex setup or external services. Without mocking, tests become integration tests rather than unit tests.

### Solution

Use Vitest's `vi` module to mock functions, modules, timers, and other dependencies. Mock external modules at the top of test files using `vi.mock()`. Create spy functions with `vi.fn()` to track calls. Mock timers with `vi.useFakeTimers()` to control time. This allows fast, isolated unit tests without real dependencies.

### Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock entire module
vi.mock('./external-module.js', () => ({
  externalFunction: vi.fn().mockReturnValue('mocked'),
}));

describe('TestWithMocks', () => {
  it('should use mocked function', () => {
    const result = externalFunction();
    expect(result).toBe('mocked');
  });
});
```

### Implementation

**Step 1: Mock external modules**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs module
vi.mock('node:fs', () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

// Mock custom module
vi.mock('../services/apiClient.js', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({ data: 'mocked' }),
  })),
}));
```

**Step 2: Create spy functions**

```typescript
describe('ServiceWithMocks', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({ ok: true, data: 'test' });
  });

  it('should call fetch with correct params', async () => {
    await service.getData('test-id');

    expect(mockFetch).toHaveBeenCalledWith('test-id');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

**Step 3: Mock timers for time-dependent code**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Timer tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute after timeout', async () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

**Step 4: Use vi.hoisted() for mock variables needed before imports**

When you need mock variables to be available before module imports (due to ES module hoisting), use `vi.hoisted()` to define them:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// CRITICAL: Use vi.hoisted() to create mock references BEFORE vi.mock()
// These variables are hoisted to the top of the file, making them available
// to vi.mock() factories even though vi.mock() is also hoisted.
const { mockSendMessageStream, mockExecuteToolCall, mockSetSystemInstruction } = vi.hoisted(() => ({
  mockSendMessageStream: vi.fn(),
  mockExecuteToolCall: vi.fn(),
  mockSetSystemInstruction: vi.fn(),
}));

// Now use the hoisted mocks in vi.mock()
vi.mock('../core/geminiChat.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../core/geminiChat.js')>();
  return {
    ...actual,
    GeminiChat: vi.fn().mockImplementation(() => ({
      sendMessageStream: mockSendMessageStream,
      setSystemInstruction: mockSetSystemInstruction,
    })),
  };
});

vi.mock('../tools/tool-executor.js', () => ({
  executeToolCall: mockExecuteToolCall,
}));

// Import the module under test AFTER mocks are set up
import { AgentExecutor } from './executor.js';

describe('AgentExecutor', () => {
  beforeEach(() => {
    // Reset all hoisted mocks between tests
    vi.resetAllMocks();

    // Set up default mock implementations
    mockSendMessageStream.mockImplementation(async function* () {
      yield { type: 'chunk', value: { text: 'Hello' } };
    });
  });

  it('should call sendMessageStream', async () => {
    const executor = new AgentExecutor();
    await executor.run({ goal: 'Test' });

    // Assert on the hoisted mock
    expect(mockSendMessageStream).toHaveBeenCalled();
  });

  it('should handle tool execution', async () => {
    // Configure mock for this specific test
    mockExecuteToolCall.mockResolvedValueOnce({ status: 'success' });

    const executor = new AgentExecutor();
    await executor.run({ goal: 'Use tool' });

    expect(mockExecuteToolCall).toHaveBeenCalled();
  });
});
```

**Why vi.hoisted() is necessary:**

- ES modules have static imports - all imports are hoisted to the top
- `vi.mock()` is also hoisted, so it runs before any code in the file
- Without `vi.hoisted()`, mock variable declarations run AFTER `vi.mock()`
- This causes `vi.mock()` factories to reference undefined variables
- `vi.hoisted()` ensures the mock variables exist when `vi.mock()` factories execute

**Common pattern for complex mocking:**

```typescript
// 1. Hoisted mock variables
const { mockFetch, mockAuth, mockLogger } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockAuth: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// 2. Mock modules using hoisted variables
vi.mock('./http.js', () => ({ fetch: mockFetch }));
vi.mock('./auth.js', () => ({ authenticate: mockAuth }));
vi.mock('./logger.js', () => ({ logger: mockLogger }));

// 3. Import module under test
import { ApiClient } from './apiClient.js';

// 4. Test
describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAuth.mockResolvedValue({ token: 'test-token' });
  });

  it('should authenticate before fetch', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await new ApiClient().getData();

    expect(mockAuth).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('fetch'));
  });
});
```

### Complete Example

```typescript
// src/config/config.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock fs module
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    statSync: vi.fn().mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(true),
    }),
    realpathSync: vi.fn((path) => path),
  };
});

// Mock tool registry
vi.mock('../tools/tool-registry', () => {
  const ToolRegistryMock = vi.fn();
  ToolRegistryMock.prototype.registerTool = vi.fn();
  ToolRegistryMock.prototype.getAllTools = vi.fn(() => []);
  ToolRegistryMock.prototype.getFunctionDeclarations = vi.fn(() => []);
  return { ToolRegistry: ToolRegistryMock };
});

// Mock content generator
vi.mock('../core/contentGenerator.js', () => ({
  createContentGeneratorConfig: vi.fn().mockReturnValue({
    model: 'test-model',
    authType: 'api-key',
  }),
}));

// Mock GeminiClient
vi.mock('../core/client.js', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    stripThoughtsFromHistory: vi.fn(),
  })),
}));

// Mock telemetry
vi.mock('../telemetry/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../telemetry/index.js')>();
  return {
    ...actual,
    initializeTelemetry: vi.fn(),
    uiTelemetryService: {
      getLastPromptTokenCount: vi.fn(),
    },
  };
});

import { Config } from './config.js';
import * as fs from 'node:fs';

describe('Config', () => {
  let mockExistsSync: Mock;
  let mockStatSync: Mock;

  beforeEach(() => {
    // Get mock references
    mockExistsSync = vi.mocked(fs.existsSync);
    mockStatSync = vi.mocked(fs.statSync);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      // Arrange
      const config = new Config({
        targetDir: '/test/dir',
        model: 'test-model',
      });

      // Act
      const targetDir = config.getTargetDir();

      // Assert
      expect(targetDir).toBe('/test/dir');
      expect(mockExistsSync).toHaveBeenCalledWith('/test/dir');
    });

    it('should verify directory exists during init', () => {
      // Arrange
      mockExistsSync.mockReturnValue(false);

      // Act & Assert
      expect(() => new Config({ targetDir: '/nonexistent' })).toThrow('Directory does not exist');

      expect(mockExistsSync).toHaveBeenCalledWith('/nonexistent');
    });
  });

  describe('getToolRegistry', () => {
    it('should return tool registry instance', () => {
      // Arrange
      const config = new Config({ targetDir: '/test/dir' });

      // Act
      const registry = config.getToolRegistry();

      // Assert
      expect(registry).toBeDefined();
      expect(registry.getAllTools).toBeDefined();
    });
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle delayed operations', async () => {
      // Arrange
      const callback = vi.fn();
      const config = new Config({ targetDir: '/test/dir' });

      // Act
      config.scheduleCleanup(callback, 1000);
      vi.advanceTimersByTime(1000);

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('spy on method calls', () => {
    it('should track method calls', () => {
      // Arrange
      const config = new Config({ targetDir: '/test/dir' });
      const spy = vi.spyOn(config, 'getTargetDir');

      // Act
      config.getTargetDir();
      config.getTargetDir();

      // Assert
      expect(spy).toHaveBeenCalledTimes(2);

      // Cleanup
      spy.mockRestore();
    });
  });
});
```

**Example explained:**

- Lines 1-47: Module mocks set up at top of file using vi.mock()
- Lines 49-56: Import actual implementation after mocks
- Lines 58-67: beforeEach gets mock references and resets them
- Lines 69-84: Tests use mocked fs functions
- Lines 86-96: Test verifies tool registry mock
- Lines 98-118: Fake timers example for testing time-dependent code
- Lines 120-137: Spy example for tracking method calls

### When to Use

**Use vi mocks when:**

- Testing code that depends on external services
- Need to simulate error conditions
- Testing time-dependent code (timeouts, intervals)
- Isolating unit under test from dependencies
- Tracking function calls and arguments

**Avoid vi mocks when:**

- Real implementation is simple and fast (use real implementation)
- Testing integration between multiple modules
- Mock would obscure actual behavior
- Using temp directory isolation for file system (prefer real fs)

### Benefits

- **Fast Tests**: No real I/O or network calls
- **Deterministic**: Same result every time
- **Error Simulation**: Easy to test error paths
- **Call Tracking**: Verify function calls and arguments
- **Time Control**: Test time-dependent code instantly
- **Type Safety**: TypeScript support for mocks

### Trade-offs

- **Mock Maintenance**: Mocks must stay in sync with real implementation
- **False Confidence**: Tests pass with mocks but fail with real dependencies
- **Complexity**: Many mocks can make tests hard to understand
- **Implementation Coupling**: Tests know implementation details

### Common Mistakes

**Mistake 1: Not resetting mocks between tests**

**Bad:**

```typescript
describe('Tests', () => {
  const mockFn = vi.fn();

  it('test 1', () => {
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('test 2', () => {
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1); // Fails! Called 2 times total
  });
});
```

**Good:**

```typescript
describe('Tests', () => {
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFn = vi.fn();
    // Or: vi.clearAllMocks();
  });

  it('test 1', () => {
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('test 2', () => {
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1); // Passes
  });
});
```

**Why this matters**: Mock state persists between tests unless explicitly reset. Use beforeEach to reset mocks or call vi.clearAllMocks().

**Mistake 2: Mocking entire module when only part is needed**

**Bad:**

```typescript
vi.mock('../services/bigModule.js', () => ({
  // Must mock every export even if only using one
  functionA: vi.fn(),
  functionB: vi.fn(),
  functionC: vi.fn(),
  // ... 20 more functions
}));
```

**Good:**

```typescript
vi.mock('../services/bigModule.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/bigModule.js')>();
  return {
    ...actual, // Keep real implementations
    functionA: vi.fn(), // Only mock what's needed
  };
});
```

**Why this matters**: Partial mocking preserves real implementations while mocking only what's necessary for the test. This reduces maintenance burden.

**Mistake 3: Not restoring timers after fake timers**

**Bad:**

```typescript
describe('Timer tests', () => {
  it('should use fake timers', () => {
    vi.useFakeTimers();
    // Test code
    // Forgot to restore
  });

  it('next test fails because timers still fake', () => {
    setTimeout(() => {}, 100); // Doesn't work
  });
});
```

**Good:**

```typescript
describe('Timer tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use fake timers', () => {
    // Test code
  });

  it('next test works correctly', () => {
    setTimeout(() => {}, 100); // Works
  });
});
```

**Why this matters**: Fake timers affect all subsequent tests. Always restore in afterEach to prevent test pollution.

### Testing Strategy

**What to Test:**

- Mock external dependencies (APIs, file system, databases)
- Mock slow operations for fast tests
- Verify function calls and arguments using spies
- Test error conditions by mocking failures
- Test time-dependent code with fake timers

**Test Organization:**

- Mock modules at top of file before imports
- Store mock references in beforeEach
- Reset mocks between tests
- Restore all mocks in afterEach

**Mock Strategy:**

- Prefer explicit mock objects over vi.mock for internal code
- Use vi.mock for external modules and built-ins
- Use vi.fn() for simple function mocks
- Use vi.spyOn() to spy on real implementations
- Use vi.useFakeTimers() for time-dependent code

**Test Example:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock external module
vi.mock('./externalService.js', () => ({
  fetchData: vi.fn(),
}));

import { fetchData } from './externalService.js';
import { MyService } from './myService.js';

describe('MyService with mocks', () => {
  let service: MyService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.mocked(fetchData);
    mockFetch.mockResolvedValue({ data: 'test' });
    service = new MyService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call external service', async () => {
    // Act
    await service.getData();

    // Assert
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle errors from external service', async () => {
    // Arrange
    mockFetch.mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(service.getData()).rejects.toThrow('Network error');
  });
});
```

**Coverage Goals:**

- All external dependencies mocked
- All mocks reset between tests
- All timers restored
- Mock behavior verified in assertions

### Related Patterns

- **[Mock Objects via Interfaces](#pattern-3-mock-objects-via-interfaces)** - Prefer explicit mocks for internal code
- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Set up mocks in Arrange section
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Reset mocks in beforeEach

---

## Pattern 8: Parameterized Tests (it.each)

### Intent

Use parameterized tests to run the same test logic with multiple input/output combinations, reducing code duplication and ensuring comprehensive input validation coverage.

### Problem

When testing functions with multiple valid and invalid inputs, writing individual tests for each case leads to massive code duplication. Test files become bloated with nearly identical tests that differ only in input values. Adding new test cases requires copying boilerplate. Validation logic testing is incomplete because writing individual tests for every edge case is tedious.

### Solution

Use Vitest's `it.each()` to define a table of test cases with inputs and expected outputs. The test body is written once and executed for each row in the table. This pattern is especially powerful for input validation, error message testing, and boundary condition testing.

### Structure

```typescript
describe('validateInput', () => {
  it.each([
    { description: 'case 1', input: value1, expected: result1 },
    { description: 'case 2', input: value2, expected: result2 },
    { description: 'case 3', input: value3, expected: result3 },
  ])('$description', ({ input, expected }) => {
    const result = validateInput(input);
    expect(result).toEqual(expected);
  });
});
```

### Implementation

**Step 1: Identify test cases that share the same assertion logic**

```typescript
// Before: Repetitive individual tests
it('should return null for valid pattern', () => {
  expect(tool.validateToolParams({ pattern: '*.js' })).toBeNull();
});

it('should return null for valid pattern with dir_path', () => {
  expect(tool.validateToolParams({ pattern: '*.js', dir_path: 'src' })).toBeNull();
});

it('should return error for missing pattern', () => {
  expect(tool.validateToolParams({ dir_path: '.' })).toContain('required');
});
```

**Step 2: Extract into a parameterized test table**

```typescript
it.each([
  {
    name: 'valid pattern only',
    params: { pattern: '*.js' },
    expected: null,
  },
  {
    name: 'valid pattern with dir_path',
    params: { pattern: '*.js', dir_path: 'src' },
    expected: null,
  },
  {
    name: 'missing pattern',
    params: { dir_path: '.' },
    expected: `params must have required property 'pattern'`,
  },
])('$name', ({ params, expected }) => {
  const result = tool.validateToolParams(params);
  if (expected === null) {
    expect(result).toBeNull();
  } else {
    expect(result).toContain(expected);
  }
});
```

**Step 3: Use TypeScript interfaces for type safety**

```typescript
interface ValidationTestCase {
  name: string;
  params: Partial<GlobToolParams>;
  expected: string | null;
}

it.each<ValidationTestCase>([
  { name: 'valid', params: { pattern: '*.js' }, expected: null },
  { name: 'empty pattern', params: { pattern: '' }, expected: 'cannot be empty' },
])('$name', ({ params, expected }) => {
  // Type-safe test body
});
```

### Complete Example

```typescript
// src/tools/glob.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { GlobToolParams } from './glob.js';
import { GlobTool } from './glob.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

describe('GlobTool', () => {
  let tempRootDir: string;
  let globTool: GlobTool;

  beforeEach(async () => {
    tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'glob-tool-'));
    await fs.writeFile(path.join(tempRootDir, 'fileA.txt'), 'content');
    globTool = new GlobTool({ getTargetDir: () => tempRootDir } as Config);
  });

  afterEach(async () => {
    await fs.rm(tempRootDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Parameterized validation tests
  // ---------------------------------------------------------------------------

  describe('validateToolParams', () => {
    it.each([
      {
        name: 'should return null for valid parameters (pattern only)',
        params: { pattern: '*.js' },
        expected: null,
      },
      {
        name: 'should return null for valid parameters (pattern and dir_path)',
        params: { pattern: '*.js', dir_path: 'sub' },
        expected: null,
      },
      {
        name: 'should return null for valid parameters (all options)',
        params: { pattern: '*.js', dir_path: 'sub', case_sensitive: true },
        expected: null,
      },
      {
        name: 'should return error if pattern is missing (schema validation)',
        params: { dir_path: '.' },
        expected: `params must have required property 'pattern'`,
      },
      {
        name: 'should return error if pattern is an empty string',
        params: { pattern: '' },
        expected: "The 'pattern' parameter cannot be empty.",
      },
      {
        name: 'should return error if pattern is only whitespace',
        params: { pattern: '   ' },
        expected: "The 'pattern' parameter cannot be empty.",
      },
      {
        name: 'should return error if dir_path is not a string (schema validation)',
        params: { pattern: '*.ts', dir_path: 123 },
        expected: 'params/dir_path must be string',
      },
      {
        name: 'should return error if case_sensitive is not a boolean (schema validation)',
        params: { pattern: '*.ts', case_sensitive: 'true' },
        expected: 'params/case_sensitive must be boolean',
      },
      {
        name: "should return error if search path resolves outside the tool's root directory",
        params: { pattern: '*.txt', dir_path: '../../../../../../tmp' },
        expected: 'resolves outside the allowed workspace directories',
      },
      {
        name: 'should return error if specified search path does not exist',
        params: { pattern: '*.txt', dir_path: 'nonexistent_subdir' },
        expected: 'Search path does not exist',
      },
      {
        name: 'should return error if specified search path is a file, not a directory',
        params: { pattern: '*.txt', dir_path: 'fileA.txt' },
        expected: 'Search path is not a directory',
      },
    ])('$name', ({ params, expected }) => {
      // @ts-expect-error - Intentionally creating invalid params for testing
      const result = globTool.validateToolParams(params);
      if (expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).toContain(expected);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Parameterized ignore file tests
  // ---------------------------------------------------------------------------

  describe('ignore file handling', () => {
    interface IgnoreFileTestCase {
      name: string;
      ignoreFile: { name: string; content: string };
      filesToCreate: string[];
      globToolParams: GlobToolParams;
      expectedCountMessage: string;
      expectedToContain?: string[];
      notExpectedToContain?: string[];
    }

    it.each<IgnoreFileTestCase>([
      {
        name: 'should respect .gitignore files by default',
        ignoreFile: { name: '.gitignore', content: '*.ignored.txt' },
        filesToCreate: ['a.ignored.txt', 'b.notignored.txt'],
        globToolParams: { pattern: '*.txt' },
        expectedCountMessage: 'Found 2 file(s)',
        notExpectedToContain: ['a.ignored.txt'],
      },
      {
        name: 'should respect .geminiignore files by default',
        ignoreFile: { name: '.geminiignore', content: '*.geminiignored.txt' },
        filesToCreate: ['a.geminiignored.txt', 'b.notignored.txt'],
        globToolParams: { pattern: '*.txt' },
        expectedCountMessage: 'Found 2 file(s)',
        notExpectedToContain: ['a.geminiignored.txt'],
      },
      {
        name: 'should not respect .gitignore when respect_git_ignore is false',
        ignoreFile: { name: '.gitignore', content: '*.ignored.txt' },
        filesToCreate: ['a.ignored.txt'],
        globToolParams: { pattern: '*.txt', respect_git_ignore: false },
        expectedCountMessage: 'Found 2 file(s)',
        expectedToContain: ['a.ignored.txt'],
      },
    ])(
      '$name',
      async ({
        ignoreFile,
        filesToCreate,
        globToolParams,
        expectedCountMessage,
        expectedToContain,
        notExpectedToContain,
      }) => {
        // Arrange
        await fs.writeFile(path.join(tempRootDir, ignoreFile.name), ignoreFile.content);
        for (const file of filesToCreate) {
          await fs.writeFile(path.join(tempRootDir, file), 'content');
        }

        // Act
        const invocation = globTool.build(globToolParams);
        const result = await invocation.execute(new AbortController().signal);

        // Assert
        expect(result.llmContent).toContain(expectedCountMessage);

        if (expectedToContain) {
          for (const file of expectedToContain) {
            expect(result.llmContent).toContain(file);
          }
        }
        if (notExpectedToContain) {
          for (const file of notExpectedToContain) {
            expect(result.llmContent).not.toContain(file);
          }
        }
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Parameterized sorting tests
  // ---------------------------------------------------------------------------

  describe('sortFileEntries', () => {
    const nowTimestamp = new Date('2024-01-15T12:00:00.000Z').getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    const testCases = [
      {
        name: 'should sort a mix of recent and older files correctly',
        entries: [
          {
            name: 'older_zebra.txt',
            mtime: new Date(nowTimestamp - (oneDayInMs + 2 * 60 * 60 * 1000)),
          },
          { name: 'recent_alpha.txt', mtime: new Date(nowTimestamp - 1 * 60 * 60 * 1000) },
          {
            name: 'older_apple.txt',
            mtime: new Date(nowTimestamp - (oneDayInMs + 1 * 60 * 60 * 1000)),
          },
        ],
        expected: ['recent_alpha.txt', 'older_apple.txt', 'older_zebra.txt'],
      },
      {
        name: 'should sort only recent files by mtime descending',
        entries: [
          { name: 'c.txt', mtime: new Date(nowTimestamp - 2000) },
          { name: 'a.txt', mtime: new Date(nowTimestamp - 3000) },
          { name: 'b.txt', mtime: new Date(nowTimestamp - 1000) },
        ],
        expected: ['b.txt', 'c.txt', 'a.txt'],
      },
      {
        name: 'should handle an empty array',
        entries: [],
        expected: [],
      },
    ];

    it.each(testCases)('$name', ({ entries, expected }) => {
      const globPaths = entries.map((e) => ({
        fullpath: () => e.name,
        mtimeMs: e.mtime.getTime(),
      }));
      const sorted = sortFileEntries(globPaths, nowTimestamp, oneDayInMs);
      const sortedPaths = sorted.map((e) => e.fullpath());
      expect(sortedPaths).toEqual(expected);
    });
  });
});
```

**Example explained:**

- Lines 25-75: Validation tests cover 11 cases with one test body
- Lines 80-145: Complex object test cases with typed interface
- Lines 150-180: Sorting tests with computed dates
- Each test case has a descriptive `name` property used in test output

### When to Use

**Use parameterized tests when:**

- Testing input validation with many valid/invalid combinations
- Testing error messages for different error conditions
- Testing boundary conditions (min, max, empty, null)
- Testing the same logic with different data types
- Testing configuration combinations

**Avoid parameterized tests when:**

- Test cases have significantly different setup or assertions
- Tests need different mock configurations per case
- Only 2-3 simple cases exist (individual tests are clearer)
- Test descriptions would be unclear in table format

### Benefits

- **Comprehensive Coverage**: Easy to add more test cases without code duplication
- **DRY Tests**: Single test body for many inputs
- **Clear Test Output**: Each case shows separately in test runner
- **Maintainability**: Fix test logic once, applies to all cases
- **Documentation**: Test table documents all valid/invalid inputs

### Trade-offs

- **Debugging**: Harder to debug specific failing case
- **Setup Complexity**: All cases must share same setup/teardown
- **Readability**: Large tables can be overwhelming
- **Type Safety**: Requires explicit interfaces for complex cases

### Common Mistakes

**Mistake 1: Missing type annotations for test cases**

**Bad:**

```typescript
it.each([
  { params: { pattern: '*.js' }, expected: null },
  { params: { pattern: '' }, expected: 'error' },
])('test $params.pattern', ({ params, expected }) => {
  // No type safety, easy to make typos
});
```

**Good:**

```typescript
interface TestCase {
  name: string;
  params: Partial<GlobToolParams>;
  expected: string | null;
}

it.each<TestCase>([
  { name: 'valid', params: { pattern: '*.js' }, expected: null },
  { name: 'empty', params: { pattern: '' }, expected: 'error' },
])('$name', ({ params, expected }) => {
  // Type-safe
});
```

**Why this matters**: Without types, typos in test case properties are not caught, leading to confusing test failures.

**Mistake 2: Overly complex conditional assertions**

**Bad:**

```typescript
it.each(testCases)('$name', ({ input, expected, shouldThrow, errorType }) => {
  if (shouldThrow) {
    if (errorType === 'validation') {
      expect(() => fn(input)).toThrow(ValidationError);
    } else if (errorType === 'runtime') {
      expect(() => fn(input)).toThrow(RuntimeError);
    }
  } else if (expected === null) {
    expect(fn(input)).toBeNull();
  } else {
    expect(fn(input)).toEqual(expected);
  }
});
```

**Good:**

```typescript
// Split into separate parameterized tests by assertion type
describe('valid inputs', () => {
  it.each(validCases)('$name', ({ input, expected }) => {
    expect(fn(input)).toEqual(expected);
  });
});

describe('validation errors', () => {
  it.each(validationErrorCases)('$name', ({ input, errorMessage }) => {
    expect(() => fn(input)).toThrow(errorMessage);
  });
});
```

**Why this matters**: Parameterized tests should have consistent assertions. Split into multiple `it.each` blocks when assertion patterns differ.

**Mistake 3: Using array syntax instead of object syntax**

**Bad:**

```typescript
it.each([
  ['*.js', null],
  ['', 'error'],
  ['   ', 'error'],
])('pattern %s should return %s', (pattern, expected) => {
  // Unclear which value is which
});
```

**Good:**

```typescript
it.each([
  { name: 'valid pattern', pattern: '*.js', expected: null },
  { name: 'empty pattern', pattern: '', expected: 'error' },
  { name: 'whitespace pattern', pattern: '   ', expected: 'error' },
])('$name', ({ pattern, expected }) => {
  // Self-documenting
});
```

**Why this matters**: Object syntax with named properties is self-documenting and allows the `$name` interpolation for clear test names.

### Testing Strategy

**What to Test:**

- All valid input combinations
- All invalid input combinations
- Boundary conditions (empty, null, min, max)
- Type validation (wrong types passed)
- Error message content

**Test Organization:**

- Group related parameterized tests in describe blocks
- Use TypeScript interfaces for complex test cases
- Keep test tables manageable (split large tables by category)
- Use descriptive names in `$name` field

**Mock Strategy:**

- Parameterized tests work best when mocks are consistent across cases
- If different cases need different mocks, use separate `it.each` blocks
- Set up shared mocks in beforeEach

**Test Example:**

```typescript
describe('UserValidator', () => {
  describe('validateEmail', () => {
    it.each([
      { email: 'user@example.com', valid: true },
      { email: 'user.name@domain.co.uk', valid: true },
      { email: 'invalid', valid: false },
      { email: '@nodomain.com', valid: false },
      { email: 'noatsign.com', valid: false },
      { email: '', valid: false },
      { email: null, valid: false },
    ])('should return $valid for "$email"', ({ email, valid }) => {
      expect(validator.isValidEmail(email)).toBe(valid);
    });
  });

  describe('validateAge', () => {
    it.each([
      { age: 0, error: 'Age must be positive' },
      { age: -1, error: 'Age must be positive' },
      { age: 150, error: 'Age must be realistic' },
      { age: 'twenty', error: 'Age must be a number' },
    ])('should reject age=$age with "$error"', ({ age, error }) => {
      expect(() => validator.validateAge(age)).toThrow(error);
    });
  });
});
```

**Coverage Goals:**

- All validation paths covered with parameterized cases
- Error messages verified for each error type
- Boundary conditions included in test tables

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Each parameterized case follows AAA
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Group parameterized tests in describe blocks
- **[Mock Objects](#pattern-3-mock-objects-via-interfaces)** - Use consistent mocks across parameterized cases

---

## Pattern 9: Security Test Labeling

### Intent

Label security-critical tests with a `SECURITY:` prefix to make them immediately identifiable, searchable, and prioritized during code review and test maintenance.

### Problem

Security-related tests are scattered throughout test files and look like any other test. During code review, security tests are not easily identifiable. When triaging test failures, security-critical failures are not immediately visible. There is no easy way to run or audit only security-related tests. Security regressions can slip through because reviewers do not recognize which tests verify security properties.

### Solution

Prefix all security-critical test names with `SECURITY:` followed by a description of what security property is being tested. Group security tests together in dedicated describe blocks when there are multiple. This makes security tests searchable with grep, highlights them in test output, and ensures they receive appropriate attention during review.

### Structure

```typescript
describe('AuthenticationService', () => {
  describe('Security', () => {
    it('SECURITY: should reject expired tokens', async () => {
      // Security test
    });

    it('SECURITY: should block brute force attempts', async () => {
      // Security test
    });
  });

  describe('Normal Operations', () => {
    it('should authenticate valid users', async () => {
      // Regular test
    });
  });
});
```

### Implementation

**Step 1: Identify security-critical behaviors**

Security tests verify:

- Authorization and access control
- Authentication and session management
- Input sanitization and injection prevention
- Data exposure and leakage prevention
- Rate limiting and abuse prevention
- Cryptographic operations

**Step 2: Add SECURITY: prefix to test names**

```typescript
// Before: Security test not labeled
it('should reject unauthorized tool calls', async () => {
  // Test implementation
});

// After: Security test clearly labeled
it('SECURITY: should reject unauthorized tool calls', async () => {
  // Test implementation
});
```

**Step 3: Group related security tests**

```typescript
describe('AgentExecutor', () => {
  describe('Security', () => {
    it('SECURITY: should block unauthorized tools and provide explicit failure to model', async () => {
      // Verify unauthorized tool use is blocked
    });

    it('SECURITY: should throw if a tool is not on the non-interactive allowlist', async () => {
      // Verify allowlist enforcement
    });

    it('SECURITY: should not expose internal errors to model', async () => {
      // Verify error sanitization
    });
  });
});
```

### Complete Example

```typescript
// src/agents/executor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentExecutor } from './executor.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { MockTool } from '../test-utils/mock-tool.js';

describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let toolRegistry: ToolRegistry;
  let mockConfig: Config;
  const abortSignal = new AbortController().signal;

  beforeEach(async () => {
    mockConfig = makeFakeConfig();
    toolRegistry = new ToolRegistry(mockConfig);
    // Register only allowed tools
    toolRegistry.registerTool(new MockTool({ name: 'allowed_tool' }));
  });

  // ---------------------------------------------------------------------------
  // Security Tests
  // ---------------------------------------------------------------------------

  describe('Security', () => {
    it('SECURITY: should throw if a tool is not on the non-interactive allowlist', async () => {
      // Arrange
      const definition = createTestDefinition(['unauthorized_tool']);

      // Act & Assert
      await expect(AgentExecutor.create(definition, mockConfig, onActivity)).rejects.toThrow(
        'Tool not allowed'
      );
    });

    it('SECURITY: should block unauthorized tools and provide explicit failure to model', async () => {
      // Arrange
      const definition = createTestDefinition(['allowed_tool']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate model trying to use unauthorized tool
      mockModelResponse([
        {
          name: 'unauthorized_tool',
          args: { path: 'secret.txt' },
          id: 'bad_call_1',
        },
      ]);

      // Second turn: model completes
      mockModelResponse([
        {
          name: 'complete_task',
          args: { result: 'Could not read file.' },
          id: 'complete_1',
        },
      ]);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      await executor.run({ goal: 'Security test' }, abortSignal);

      // Assert
      // 1. External executor was NOT called (security held)
      expect(mockExecuteToolCall).not.toHaveBeenCalled();

      // 2. Warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Blocked call:'));

      // 3. Explicit error was sent back to model
      const turn2Params = getMockMessageParams(1);
      expect(turn2Params.message).toContainEqual(
        expect.objectContaining({
          functionResponse: expect.objectContaining({
            response: { error: expect.stringContaining('Unauthorized tool call') },
          }),
        })
      );

      // 4. Activity stream reported the error
      expect(activities).toContainEqual(
        expect.objectContaining({
          type: 'ERROR',
          data: expect.objectContaining({
            context: 'tool_call_unauthorized',
            name: 'unauthorized_tool',
          }),
        })
      );

      consoleWarnSpy.mockRestore();
    });

    it('SECURITY: should not expose internal stack traces to model', async () => {
      // Arrange
      const definition = createTestDefinition(['allowed_tool']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate internal error with stack trace
      mockExecuteToolCall.mockRejectedValueOnce(
        new Error('Internal DB connection failed\n    at Database.connect (db.js:42)')
      );

      mockModelResponse([{ name: 'allowed_tool', args: {}, id: 'call_1' }]);
      mockModelResponse([{ name: 'complete_task', args: { result: 'Done' }, id: 'call_2' }]);

      // Act
      await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - error message should be sanitized
      const turn2Params = getMockMessageParams(1);
      const errorResponse = turn2Params.message[0].functionResponse.response.error;
      expect(errorResponse).not.toContain('db.js');
      expect(errorResponse).not.toContain('Database.connect');
      expect(errorResponse).toContain('Internal error');
    });

    it('SECURITY: should validate file paths are within workspace boundaries', async () => {
      // Arrange
      const definition = createTestDefinition(['read_file']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate model trying to read file outside workspace
      mockModelResponse([
        {
          name: 'read_file',
          args: { path: '/etc/passwd' },
          id: 'call_1',
        },
      ]);
      mockModelResponse([{ name: 'complete_task', args: { result: 'Done' }, id: 'call_2' }]);

      // Act
      await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - path traversal blocked
      const turn2Params = getMockMessageParams(1);
      expect(turn2Params.message[0].functionResponse.response.error).toContain('outside workspace');
    });

    it('SECURITY: should sanitize user input in error messages', async () => {
      // Arrange
      const maliciousInput = '<script>alert("xss")</script>';
      const definition = createTestDefinition(['search']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      mockExecuteToolCall.mockResolvedValueOnce({
        status: 'error',
        error: `Invalid search query: ${maliciousInput}`,
      });

      mockModelResponse([{ name: 'search', args: { query: maliciousInput }, id: 'call_1' }]);
      mockModelResponse([{ name: 'complete_task', args: { result: 'Done' }, id: 'call_2' }]);

      // Act
      await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - input should be escaped or removed
      const turn2Params = getMockMessageParams(1);
      const errorResponse = turn2Params.message[0].functionResponse.response.error;
      expect(errorResponse).not.toContain('<script>');
    });

    it('SECURITY: should enforce rate limiting on tool calls', async () => {
      // Arrange
      const definition = createTestDefinition(['api_call'], { maxToolCallsPerTurn: 5 });
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate model trying to make too many tool calls
      mockModelResponse([
        { name: 'api_call', args: {}, id: 'call_1' },
        { name: 'api_call', args: {}, id: 'call_2' },
        { name: 'api_call', args: {}, id: 'call_3' },
        { name: 'api_call', args: {}, id: 'call_4' },
        { name: 'api_call', args: {}, id: 'call_5' },
        { name: 'api_call', args: {}, id: 'call_6' }, // Exceeds limit
      ]);

      // Act & Assert
      await expect(executor.run({ goal: 'Test' }, abortSignal)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Normal Operation Tests
  // ---------------------------------------------------------------------------

  describe('Normal Operations', () => {
    it('should execute allowed tools successfully', async () => {
      // Regular test without SECURITY prefix
    });

    it('should complete task with valid output', async () => {
      // Regular test
    });
  });
});

// src/policy/policy-engine.test.ts
describe('PolicyEngine', () => {
  describe('Security', () => {
    it('SECURITY: should NOT match spoofed server names when using wildcards', async () => {
      // Arrange
      // Vulnerability: A rule for 'prefix__*' matches 'prefix__suffix__tool'
      // effectively allowing a server named 'prefix__suffix' to spoof 'prefix'.
      const rules: PolicyRule[] = [{ toolName: 'safe_server__*', decision: PolicyDecision.ALLOW }];
      engine = new PolicyEngine({ rules });

      // A tool from a different server 'safe_server__malicious'
      const spoofedToolCall = { name: 'safe_server__malicious__tool' };

      // Act
      const result = await engine.check(spoofedToolCall, 'safe_server__malicious');

      // Assert - Should NOT allow the spoofed call
      expect(result.decision).toBe(PolicyDecision.ASK_USER);
    });

    it('SECURITY: should block dangerous shell commands by default', async () => {
      // Arrange
      const rules: PolicyRule[] = [
        {
          toolName: 'shell',
          argsPattern: /rm\s+(-rf?|--recursive)/,
          decision: PolicyDecision.DENY,
          priority: 100,
        },
        { toolName: 'shell', decision: PolicyDecision.ALLOW },
      ];
      engine = new PolicyEngine({ rules });

      // Act & Assert
      expect(
        (await engine.check({ name: 'shell', args: { command: 'rm -rf /' } }, undefined)).decision
      ).toBe(PolicyDecision.DENY);

      expect(
        (await engine.check({ name: 'shell', args: { command: 'ls -la' } }, undefined)).decision
      ).toBe(PolicyDecision.ALLOW);
    });
  });
});
```

**Example explained:**

- Lines 20-28: Security tests grouped in dedicated describe block
- Lines 30-35: Clear SECURITY prefix makes test purpose obvious
- Lines 37-85: Comprehensive security test with multiple assertions
- Lines 87-115: Stack trace sanitization test
- Lines 117-140: Path traversal prevention test
- Lines 180-210: Policy engine security tests for command injection

### When to Use

**Use SECURITY: prefix when testing:**

- Authentication and authorization logic
- Access control and permissions
- Input validation and sanitization
- Path traversal prevention
- Command injection prevention
- SQL injection prevention
- XSS prevention
- Rate limiting and DoS protection
- Cryptographic operations
- Session management
- Secret handling
- Data exposure prevention

**Do not use SECURITY: prefix for:**

- Regular functional tests
- Performance tests
- UI/UX tests
- Business logic that is not security-sensitive

### Benefits

- **Visibility**: Security tests stand out in test output
- **Searchability**: `grep "SECURITY:"` finds all security tests
- **Review Priority**: Reviewers know to scrutinize these tests carefully
- **Audit Trail**: Easy to audit security test coverage
- **CI Integration**: Can run security tests separately with `vitest -t "SECURITY:"`
- **Documentation**: Test names document security properties

### Trade-offs

- **Verbosity**: Longer test names
- **Judgment Required**: Must decide what counts as "security"
- **Maintenance**: Must ensure prefix is consistently applied

### Common Mistakes

**Mistake 1: Not being specific about what security property is tested**

**Bad:**

```typescript
it('SECURITY: should work correctly', async () => {
  // Vague, doesn't explain what security property
});
```

**Good:**

```typescript
it('SECURITY: should reject tokens signed with wrong key', async () => {
  // Specific security property
});
```

**Why this matters**: The test name should explain exactly what security property is being verified so reviewers understand its importance.

**Mistake 2: Using SECURITY prefix for non-security tests**

**Bad:**

```typescript
it('SECURITY: should return 404 for missing resource', async () => {
  // This is not a security test
});
```

**Good:**

```typescript
it('should return 404 for missing resource', async () => {
  // Regular test
});

it('SECURITY: should return 404 for resources user lacks permission to view', async () => {
  // This IS a security test - prevents information disclosure
});
```

**Why this matters**: Overusing the prefix dilutes its meaning and makes actual security tests harder to identify.

**Mistake 3: Not testing the security boundary comprehensively**

**Bad:**

```typescript
it('SECURITY: should block unauthorized access', async () => {
  const result = await service.getData('unauthorized-user');
  expect(result).toBeNull();
  // Only tests one scenario
});
```

**Good:**

```typescript
describe('Security', () => {
  it('SECURITY: should block unauthenticated users', async () => {
    // Test no auth
  });

  it('SECURITY: should block users without required role', async () => {
    // Test wrong role
  });

  it('SECURITY: should block expired sessions', async () => {
    // Test session expiry
  });

  it('SECURITY: should block revoked tokens', async () => {
    // Test token revocation
  });
});
```

**Why this matters**: Security boundaries have multiple failure modes. Test each one explicitly.

### Testing Strategy

**What to Test:**

- All authentication bypass vectors
- All authorization boundaries
- All input validation rules
- All sensitive data handling
- All external system interactions

**Test Organization:**

- Group security tests in dedicated describe blocks
- Place security tests near the top of test files
- Use consistent SECURITY: prefix format
- Include detailed comments explaining the vulnerability being tested

**Mock Strategy:**

- Test both the success and failure paths
- Mock authentication/authorization services carefully
- Verify error messages do not leak sensitive information
- Test with both valid and malicious inputs

**Test Example:**

```typescript
describe('FileService', () => {
  describe('Security', () => {
    it('SECURITY: should reject path traversal attempts', async () => {
      // Arrange
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        'C:\\Windows\\System32',
        'file:///etc/passwd',
        'data:text/plain;base64,SGVsbG8=',
      ];

      // Act & Assert
      for (const path of maliciousPaths) {
        await expect(fileService.readFile(path)).rejects.toThrow('Path must be within workspace');
      }
    });

    it('SECURITY: should not follow symlinks outside workspace', async () => {
      // Test symlink attacks
    });

    it('SECURITY: should sanitize filenames to prevent injection', async () => {
      // Test filename sanitization
    });
  });
});
```

**Coverage Goals:**

- All OWASP Top 10 relevant to application
- All authentication/authorization paths
- All input validation boundaries
- All sensitive data exposure points

### Related Patterns

- **[Parameterized Tests](#pattern-8-parameterized-tests-iteach)** - Use for testing multiple malicious inputs
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Group security tests in describe blocks
- **[Protocol Violation Tests](#pattern-10-protocol-violation-tests)** - Test security protocol violations

---

## Pattern 10: Protocol Violation Tests

### Intent

Test what happens when external systems, models, or APIs violate expected protocols or contracts to ensure graceful failure handling and system resilience.

### Problem

Most tests verify happy paths and expected error conditions. But external systems can behave unexpectedly: LLMs may stop without calling expected completion tools, APIs may return malformed responses, or clients may send requests out of order. Without protocol violation tests, these scenarios cause mysterious failures, crashes, or undefined behavior in production.

### Solution

Create dedicated tests that simulate protocol violations and verify the system responds appropriately. Label these tests with "(Protocol Violation)" suffix for clarity. Test that violations result in clear error messages, proper logging, and safe system state. Verify that violations do not cause crashes, hangs, or data corruption.

### Structure

```typescript
describe('SystemName', () => {
  describe('Protocol Violations', () => {
    it('should error when external system violates X protocol (Protocol Violation)', async () => {
      // Simulate protocol violation
      // Verify graceful handling
    });
  });
});
```

### Implementation

**Step 1: Identify protocol expectations**

Document what protocols your system expects:

- LLM must call `complete_task` tool to finish
- API responses must include required fields
- WebSocket messages must follow sequence
- State transitions must follow valid paths

**Step 2: Create tests that violate each expectation**

```typescript
// Protocol: LLM must call complete_task to finish
it('should error immediately if model stops without calling complete_task (Protocol Violation)', async () => {
  // Simulate model stopping without completion
  mockModelResponse([], 'I am done thinking'); // No tool calls, no complete_task

  await expect(executor.run({ goal: 'Test' }, signal)).rejects.toThrow(
    'Model stopped without completing task'
  );
});
```

**Step 3: Verify graceful failure with clear error messages**

```typescript
it('should provide clear error when API returns malformed response (Protocol Violation)', async () => {
  // Simulate malformed API response
  mockApiResponse({ data: null }); // Missing required 'result' field

  const result = await service.fetchData('id');

  expect(result.error).toBe('API returned malformed response: missing "result" field');
  expect(result.success).toBe(false);
});
```

### Complete Example

```typescript
// src/agents/executor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentExecutor, AgentTerminateMode } from './executor.js';

describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let mockConfig: Config;
  const abortSignal = new AbortController().signal;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockConfig = makeFakeConfig();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Protocol Violation Tests
  // ---------------------------------------------------------------------------

  describe('Protocol Violations', () => {
    it('should error immediately if the model stops tools without calling complete_task (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition();
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate model stopping without calling complete_task
      // Model returns text but no function calls
      mockModelResponse([], 'I have finished my analysis.');

      // Act
      const result = await executor.run({ goal: 'Test goal' }, abortSignal);

      // Assert
      expect(result.terminate_reason).toBe(AgentTerminateMode.ERROR);
      expect(result.error).toContain('Model stopped without calling complete_task');

      // Verify error was logged
      expect(mockedLogAgentFinish).toHaveBeenCalledWith(
        mockConfig,
        expect.objectContaining({
          terminate_reason: AgentTerminateMode.ERROR,
        })
      );

      // Verify activity stream received error
      expect(activities).toContainEqual(
        expect.objectContaining({
          type: 'ERROR',
          data: expect.objectContaining({
            context: 'protocol_violation',
            error: expect.stringContaining('complete_task'),
          }),
        })
      );
    });

    it('should handle model returning empty response (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition();
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate model returning completely empty response
      mockSendMessageStream.mockImplementationOnce(async () =>
        (async function* () {
          yield { type: StreamEventType.CHUNK, value: { candidates: [] } };
        })()
      );

      // Act
      const result = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert
      expect(result.terminate_reason).toBe(AgentTerminateMode.ERROR);
      expect(result.error).toContain('Model returned empty response');
    });

    it('should handle model calling non-existent tool (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition(['allowed_tool']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Model calls a tool that was never registered
      mockModelResponse([{ name: 'tool_that_does_not_exist', args: {}, id: 'call_1' }]);
      mockModelResponse([{ name: 'complete_task', args: { result: 'Done' }, id: 'call_2' }]);

      // Act
      await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - error should be fed back to model
      const turn2Params = getMockMessageParams(1);
      expect(turn2Params.message[0].functionResponse.response.error).toContain('Tool not found');
    });

    it('should handle model sending malformed function call (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition(['search']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Model sends function call with missing required args
      mockModelResponse([
        { name: 'search', args: {}, id: 'call_1' }, // Missing required 'query' arg
      ]);
      mockModelResponse([{ name: 'complete_task', args: { result: 'Done' }, id: 'call_2' }]);

      // Act
      await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - validation error should be fed back to model
      const turn2Params = getMockMessageParams(1);
      expect(turn2Params.message[0].functionResponse.response.error).toContain('validation');
    });

    it('should handle output schema validation failure and allow retry (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition(
        [],
        {},
        'default',
        z.string().min(10) // Output must be at least 10 chars
      );
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Turn 1: Model returns invalid output (too short)
      mockModelResponse([{ name: 'complete_task', args: { result: 'short' }, id: 'call_1' }]);

      // Turn 2: Model corrects and returns valid output
      mockModelResponse([
        { name: 'complete_task', args: { result: 'This is a valid long result' }, id: 'call_2' },
      ]);

      // Act
      const output = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert
      expect(mockSendMessageStream).toHaveBeenCalledTimes(2);
      expect(output.result).toContain('This is a valid long result');

      // Verify validation error was communicated to model
      const turn2Params = getMockMessageParams(1);
      expect(turn2Params.message[0].functionResponse.response.error).toContain(
        'Output validation failed'
      );
    });

    it('should terminate when max turns exceeded without completion (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition(['search'], { max_turns: 3 });
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Model keeps making tool calls without ever completing
      mockModelResponse([{ name: 'search', args: { query: 'a' }, id: '1' }]);
      mockExecuteToolCall.mockResolvedValue({ status: 'success', result: 'found' });

      mockModelResponse([{ name: 'search', args: { query: 'b' }, id: '2' }]);
      mockModelResponse([{ name: 'search', args: { query: 'c' }, id: '3' }]);

      // Act
      const result = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert
      expect(result.terminate_reason).toBe(AgentTerminateMode.MAX_TURNS);
      expect(result.result).toContain('max turns');
    });

    it('should terminate when max time exceeded (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition([], { max_time_minutes: 1 });
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate long-running model response
      mockSendMessageStream.mockImplementationOnce(async () => {
        // Advance time past the limit
        await vi.advanceTimersByTimeAsync(2 * 60 * 1000); // 2 minutes
        return (async function* () {
          yield { type: StreamEventType.CHUNK, value: createMockResponseChunk([]) };
        })();
      });

      // Act
      const result = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert
      expect(result.terminate_reason).toBe(AgentTerminateMode.TIMEOUT);
    });

    it('should handle stream interruption gracefully (Protocol Violation)', async () => {
      // Arrange
      const definition = createTestDefinition();
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Simulate stream that throws mid-way
      mockSendMessageStream.mockImplementationOnce(async () =>
        (async function* () {
          yield {
            type: StreamEventType.CHUNK,
            value: createMockResponseChunk([{ text: 'Starting...' }]),
          };
          throw new Error('Connection reset by peer');
        })()
      );

      // Act
      const result = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert
      expect(result.terminate_reason).toBe(AgentTerminateMode.ERROR);
      expect(result.error).toContain('Connection reset');
    });
  });

  // ---------------------------------------------------------------------------
  // API Protocol Violations
  // ---------------------------------------------------------------------------

  describe('API Protocol Violations', () => {
    it('should handle API returning non-JSON response (Protocol Violation)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('<html>Error page</html>'),
      });

      // Act
      const result = await apiClient.getData('id');

      // Assert
      expect(result.error).toContain('Expected JSON response');
    });

    it('should handle API returning 200 with error body (Protocol Violation)', async () => {
      // Arrange - API returns 200 but body indicates error
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Internal error' }),
      });

      // Act
      const result = await apiClient.getData('id');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal error');
    });

    it('should handle API timeout (Protocol Violation)', async () => {
      // Arrange
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 5000))
      );

      // Act
      const result = await apiClient.getData('id');

      // Assert
      expect(result.error).toContain('timeout');
    });
  });
});

// src/gateway/websocket.test.ts
describe('WebSocketGateway', () => {
  describe('Protocol Violations', () => {
    it('should handle client sending message before handshake (Protocol Violation)', async () => {
      // Arrange
      const gateway = new WebSocketGateway();
      const mockSocket = createMockSocket();

      // Client sends data message without completing handshake first
      mockSocket.emit('message', JSON.stringify({ type: 'data', payload: {} }));

      // Assert
      expect(mockSocket.close).toHaveBeenCalledWith(
        4001,
        'Handshake required before sending messages'
      );
    });

    it('should handle client sending invalid JSON (Protocol Violation)', async () => {
      // Arrange
      const gateway = new WebSocketGateway();
      const mockSocket = createMockSocket();
      await completeHandshake(mockSocket);

      // Client sends malformed JSON
      mockSocket.emit('message', 'not valid json {{{');

      // Assert - should send error response, not crash
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Invalid message format')
      );
      expect(mockSocket.close).not.toHaveBeenCalled(); // Don't close, let client retry
    });

    it('should handle client sending messages out of sequence (Protocol Violation)', async () => {
      // Arrange
      const gateway = new WebSocketGateway();
      const mockSocket = createMockSocket();
      await completeHandshake(mockSocket);

      // Client sends response before request
      mockSocket.emit(
        'message',
        JSON.stringify({
          type: 'response',
          requestId: 'req_123', // No request with this ID was sent
          payload: {},
        })
      );

      // Assert
      expect(mockSocket.send).toHaveBeenCalledWith(expect.stringContaining('Unknown request ID'));
    });
  });
});
```

**Example explained:**

- Lines 25-65: Model stops without calling complete_task
- Lines 67-85: Model returns empty response
- Lines 87-110: Model calls non-existent tool
- Lines 112-130: Model sends malformed function call
- Lines 132-160: Output validation failure with retry
- Lines 162-180: Max turns exceeded
- Lines 182-200: Max time exceeded
- Lines 202-220: Stream interruption handling
- Lines 230-280: API protocol violations
- Lines 285-340: WebSocket protocol violations

### When to Use

**Use protocol violation tests when:**

- Integrating with LLMs that may behave unpredictably
- Consuming external APIs that may return unexpected data
- Implementing stateful protocols (WebSocket, streaming)
- Building systems that communicate with untrusted clients
- Creating retry/recovery logic

**Avoid protocol violation tests when:**

- Internal code with fully controlled inputs
- Simple CRUD operations with well-defined schemas
- Testing pure functions with no external dependencies

### Benefits

- **Resilience**: System handles unexpected inputs gracefully
- **Debugging**: Clear error messages when violations occur
- **Documentation**: Tests document protocol expectations
- **Safety**: Prevents crashes and undefined behavior
- **Recovery**: Validates retry and recovery paths

### Trade-offs

- **Complexity**: More tests to write and maintain
- **Creativity Required**: Must imagine ways protocols can be violated
- **Mock Complexity**: May require complex mock setups

### Common Mistakes

**Mistake 1: Only testing protocol compliance, not violations**

**Bad:**

```typescript
it('should complete when model calls complete_task', async () => {
  mockModelResponse([{ name: 'complete_task', args: { result: 'Done' } }]);
  const result = await executor.run({ goal: 'Test' }, signal);
  expect(result.success).toBe(true);
});
// Missing: what if model doesn't call complete_task?
```

**Good:**

```typescript
it('should complete when model calls complete_task', async () => {
  // Happy path test
});

it('should error if model stops without complete_task (Protocol Violation)', async () => {
  // Protocol violation test
});
```

**Why this matters**: Happy path tests do not verify system resilience. Violation tests ensure the system handles edge cases.

**Mistake 2: Letting violations crash the test instead of asserting on handling**

**Bad:**

```typescript
it('should handle malformed response (Protocol Violation)', async () => {
  mockApiResponse({ broken: 'data' });
  await service.fetchData('id'); // Crashes with undefined access
});
```

**Good:**

```typescript
it('should handle malformed response (Protocol Violation)', async () => {
  mockApiResponse({ broken: 'data' });
  const result = await service.fetchData('id');
  expect(result.success).toBe(false);
  expect(result.error).toContain('malformed');
});
```

**Why this matters**: The test should verify graceful handling, not just that the violation can be triggered.

**Mistake 3: Not labeling protocol violation tests**

**Bad:**

```typescript
it('should handle empty response', async () => {
  // Is this testing an expected scenario or a protocol violation?
});
```

**Good:**

```typescript
it('should handle empty response (Protocol Violation)', async () => {
  // Clear that this tests unexpected behavior
});
```

**Why this matters**: The "(Protocol Violation)" suffix makes it clear this is testing unexpected behavior, not a supported use case.

### Testing Strategy

**What to Test:**

- All protocol requirements (must call X, must return Y)
- Timeout scenarios
- Partial response handling
- Out-of-order message handling
- Malformed input handling
- Connection interruption handling

**Test Organization:**

- Group protocol violation tests in dedicated describe blocks
- Use "(Protocol Violation)" suffix in test names
- Document what protocol is being violated in comments

**Mock Strategy:**

- Use generators for streaming violations
- Simulate timeouts with fake timers
- Mock network errors for connection violations

**Test Example:**

```typescript
describe('StateMachine', () => {
  describe('Protocol Violations', () => {
    it('should reject invalid state transition (Protocol Violation)', async () => {
      const machine = new StateMachine('idle');

      // Try to transition directly to 'completed' without going through 'running'
      const result = machine.transition('completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transition from "idle" to "completed"');
      expect(machine.currentState).toBe('idle'); // State unchanged
    });

    it('should handle duplicate completion calls (Protocol Violation)', async () => {
      const machine = new StateMachine('idle');
      machine.transition('running');
      machine.transition('completed');

      // Try to complete again
      const result = machine.transition('completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Already in terminal state');
    });
  });
});
```

**Coverage Goals:**

- All protocol requirements have violation tests
- All external integrations have violation tests
- All stateful components have invalid transition tests

### Related Patterns

- **[Security Test Labeling](#pattern-9-security-test-labeling)** - Security violations are a subset of protocol violations
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Group violation tests in describe blocks
- **[Parameterized Tests](#pattern-8-parameterized-tests-iteach)** - Test multiple violation scenarios

---

## Pattern 11: Test Helper Factories

### Intent

Create reusable factory functions within test files to generate test data, mock objects, and common test fixtures with type-safe customization.

### Problem

Test files contain duplicate object creation code. Creating test data with all required fields is verbose and error-prone. When data structures change, many tests need updating. It is hard to create variations of test data for different scenarios. Tests become cluttered with boilerplate setup code.

### Solution

Create factory functions that generate test objects with sensible defaults. Allow partial overrides for customization. Keep factories close to where they are used (within test files or shared test-utils). Use TypeScript generics for type safety. Factory functions should be pure and not depend on test state.

### Structure

```typescript
// Factory function with defaults and overrides
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Usage in tests
it('should handle user with custom name', () => {
  const user = createTestUser({ name: 'Custom Name' });
  expect(user.name).toBe('Custom Name');
  expect(user.email).toBe('test@example.com'); // Default preserved
});
```

### Implementation

**Step 1: Create basic factory with defaults**

```typescript
interface AgentDefinition<TOutput = unknown> {
  name: string;
  description: string;
  tools: string[];
  runConfig: RunConfig;
  outputSchema?: z.ZodType<TOutput>;
}

function createTestDefinition(overrides: Partial<AgentDefinition> = {}): AgentDefinition {
  return {
    name: 'test-agent',
    description: 'Test agent for unit tests',
    tools: [],
    runConfig: {
      maxTurns: 10,
      maxTimeMinutes: 5,
    },
    ...overrides,
  };
}
```

**Step 2: Add convenience parameters for common variations**

```typescript
function createTestDefinition<TOutput extends z.ZodTypeAny = z.ZodString>(
  tools: Array<string | MockTool> = [],
  runConfigOverrides: Partial<RunConfig> = {},
  modelName: string = 'default',
  outputSchema?: TOutput
): AgentDefinition<z.infer<TOutput>> {
  const toolNames = tools.map((t) => (typeof t === 'string' ? t : t.name));

  return {
    name: 'test-agent',
    description: 'Test agent',
    tools: toolNames,
    runConfig: {
      maxTurns: 10,
      maxTimeMinutes: 5,
      ...runConfigOverrides,
    },
    modelConfig: {
      modelName,
    },
    outputSchema,
  };
}
```

**Step 3: Create helpers for mock responses**

```typescript
// Helper to create a mock API response chunk
const createMockResponseChunk = (parts: Part[], functionCalls?: FunctionCall[]) => ({
  candidates: [
    {
      index: 0,
      content: {
        role: 'model' as const,
        parts,
      },
    },
  ],
  ...(functionCalls && functionCalls.length > 0 ? { functionCalls } : {}),
});

// Helper to mock a complete model response
const mockModelResponse = (functionCalls: FunctionCall[], thought?: string) => {
  const parts: Part[] = [];
  if (thought) {
    parts.push({ thought });
  }
  if (functionCalls.length > 0) {
    parts.push(
      ...functionCalls.map((fc) => ({
        functionCall: fc,
      }))
    );
  }

  mockSendMessageStream.mockImplementationOnce(async () =>
    (async function* () {
      yield {
        type: StreamEventType.CHUNK,
        value: createMockResponseChunk(parts, functionCalls),
      };
    })()
  );
};
```

### Complete Example

```typescript
// src/agents/executor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { z } from 'zod';
import { AgentExecutor } from './executor.js';
import type { AgentDefinition, RunConfig, FunctionCall, Part } from './types.js';
import { MockTool } from '../test-utils/mock-tool.js';

// =============================================================================
// Test Helper Factories
// =============================================================================

/**
 * Creates a test agent definition with sensible defaults.
 * All parameters are optional for maximum flexibility.
 */
function createTestDefinition<TOutput extends z.ZodTypeAny = z.ZodString>(
  tools: Array<string | MockTool> = [],
  runConfigOverrides: Partial<RunConfig> = {},
  modelName: string = 'gemini-2.0-flash',
  outputSchema?: TOutput
): AgentDefinition<z.infer<TOutput>> {
  const toolNames = tools.map((t) => (typeof t === 'string' ? t : t.name));

  return {
    name: 'test-agent',
    displayName: 'Test Agent',
    description: 'Agent for unit testing',
    tools: toolNames,
    inputSchema: z.object({
      goal: z.string(),
    }),
    runConfig: {
      maxTurns: 10,
      maxTimeMinutes: 5,
      maxToolCallsPerTurn: 50,
      ...runConfigOverrides,
    },
    modelConfig: {
      modelName,
      temperature: 0.7,
    },
    outputSchema: outputSchema ?? (z.string() as unknown as TOutput),
  };
}

/**
 * Creates a mock config object with all required methods stubbed.
 */
function makeFakeConfig(overrides: Partial<Config> = {}): Config {
  return {
    getTargetDir: () => '/test/workspace',
    getModel: () => 'gemini-2.0-flash',
    getApiKey: () => 'test-api-key',
    isDebugMode: () => false,
    getToolRegistry: () => mockToolRegistry,
    ...overrides,
  } as Config;
}

/**
 * Creates a mock response chunk for streaming tests.
 */
const createMockResponseChunk = (parts: Part[], functionCalls?: FunctionCall[]) => ({
  candidates: [
    {
      index: 0,
      content: {
        role: 'model' as const,
        parts,
      },
      finishReason: functionCalls?.length ? undefined : 'STOP',
    },
  ],
  ...(functionCalls && functionCalls.length > 0 ? { functionCalls } : {}),
});

/**
 * Helper to mock a model response with function calls.
 * Automatically sets up the mock stream implementation.
 */
const mockModelResponse = (functionCalls: FunctionCall[], thought?: string) => {
  const parts: Part[] = [];

  if (thought) {
    parts.push({ thought });
  }

  if (functionCalls.length > 0) {
    parts.push(
      ...functionCalls.map((fc) => ({
        functionCall: fc,
      }))
    );
  }

  mockSendMessageStream.mockImplementationOnce(async () =>
    (async function* () {
      yield {
        type: StreamEventType.CHUNK,
        value: createMockResponseChunk(parts, functionCalls),
      };
    })()
  );
};

/**
 * Helper to retrieve mock call parameters for assertions.
 */
const getMockMessageParams = (callIndex: number) => {
  return mockSendMessageStream.mock.calls[callIndex][0];
};

/**
 * Creates a mock tool call for testing.
 */
function createToolCall(
  name: string,
  args: Record<string, unknown> = {},
  id?: string
): FunctionCall {
  return {
    name,
    args,
    id: id ?? `call_${name}_${Date.now()}`,
  };
}

/**
 * Creates a complete_task call with result.
 */
function createCompleteTaskCall(result: unknown): FunctionCall {
  return createToolCall('complete_task', { result }, 'complete_task_1');
}

// =============================================================================
// Test Suite
// =============================================================================

describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let mockConfig: Config;
  let mockToolRegistry: ToolRegistry;
  let activities: Activity[] = [];
  const abortSignal = new AbortController().signal;

  const onActivity = (activity: Activity) => {
    activities.push(activity);
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    activities = [];

    mockToolRegistry = new ToolRegistry();
    mockToolRegistry.registerTool(new MockTool({ name: 'search' }));
    mockToolRegistry.registerTool(new MockTool({ name: 'read_file' }));

    mockConfig = makeFakeConfig();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Tests using factories
  // ---------------------------------------------------------------------------

  describe('basic execution', () => {
    it('should execute successfully when model calls complete_task with output', async () => {
      // Arrange - Factory makes setup concise
      const definition = createTestDefinition(['search']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Use helper to mock model response
      mockModelResponse([createToolCall('search', { query: 'test' })]);
      mockExecuteToolCall.mockResolvedValueOnce({ status: 'success', result: 'found it' });

      mockModelResponse([createCompleteTaskCall('Search complete')]);

      // Act
      const result = await executor.run({ goal: 'Find something' }, abortSignal);

      // Assert
      expect(result.result).toBe('Search complete');
      expect(mockExecuteToolCall).toHaveBeenCalledTimes(1);
    });

    it('should use custom run config from factory', async () => {
      // Arrange - Override specific config
      const definition = createTestDefinition(
        ['search'],
        { maxTurns: 3, maxTimeMinutes: 1 } // Custom config
      );
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // Verify config was applied
      expect(definition.runConfig.maxTurns).toBe(3);
      expect(definition.runConfig.maxTimeMinutes).toBe(1);
    });

    it('should support typed output schema', async () => {
      // Arrange - Use generic for output type
      const outputSchema = z.object({
        summary: z.string(),
        confidence: z.number(),
      });

      const definition = createTestDefinition([], {}, 'default', outputSchema);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      mockModelResponse([createCompleteTaskCall({ summary: 'Done', confidence: 0.95 })]);

      // Act
      const result = await executor.run({ goal: 'Test' }, abortSignal);

      // Assert - Result is typed
      expect(result.result.summary).toBe('Done');
      expect(result.result.confidence).toBe(0.95);
    });
  });

  describe('tool execution', () => {
    it('should execute multiple tools in sequence', async () => {
      // Arrange
      const definition = createTestDefinition(['search', 'read_file']);
      executor = await AgentExecutor.create(definition, mockConfig, onActivity);

      // First turn: search
      mockModelResponse([createToolCall('search', { query: 'config' })]);
      mockExecuteToolCall.mockResolvedValueOnce({
        status: 'success',
        result: 'Found: config.json',
      });

      // Second turn: read file
      mockModelResponse([createToolCall('read_file', { path: 'config.json' })]);
      mockExecuteToolCall.mockResolvedValueOnce({
        status: 'success',
        result: '{ "key": "value" }',
      });

      // Third turn: complete
      mockModelResponse([createCompleteTaskCall('Configuration loaded')]);

      // Act
      const result = await executor.run({ goal: 'Load config' }, abortSignal);

      // Assert
      expect(mockExecuteToolCall).toHaveBeenCalledTimes(2);
      expect(result.result).toBe('Configuration loaded');
    });
  });
});

// =============================================================================
// Example: Factories in test-utils for reuse
// =============================================================================

// src/test-utils/factories.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: `user_${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: `workflow_${Date.now()}`,
    name: 'Test Workflow',
    description: 'A workflow for testing',
    phases: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockPhase(overrides: Partial<Phase> = {}): Phase {
  return {
    id: `phase_${Date.now()}`,
    name: 'Test Phase',
    commands: [],
    execution: 'sequential',
    ...overrides,
  };
}
```

**Example explained:**

- Lines 15-45: Type-safe factory with generic output schema support
- Lines 50-60: Config factory with method stubs
- Lines 65-95: Response chunk factory for streaming tests
- Lines 97-115: Model response helper encapsulating mock setup
- Lines 120-135: Simple helper factories for tool calls
- Lines 145-175: Test setup using factories
- Lines 180-250: Tests demonstrating factory usage
- Lines 255-290: Reusable factories in shared test-utils

### When to Use

**Use test helper factories when:**

- Multiple tests need similar test data
- Object creation requires many fields
- Tests need variations of the same base object
- Creating mock responses is complex
- Sharing test data across multiple test files

**Avoid test helper factories when:**

- Test data is trivial (primitives, simple objects)
- Only one test needs the data
- Factory would obscure what is being tested
- Test requires unique data that cannot be parameterized

### Benefits

- **DRY**: Eliminate duplicate object creation
- **Maintainability**: Change structure in one place
- **Readability**: Tests focus on what varies, not boilerplate
- **Type Safety**: TypeScript catches incorrect overrides
- **Flexibility**: Easy to create variations with overrides
- **Documentation**: Factory defaults document typical values

### Trade-offs

- **Abstraction**: Hides object structure from test reader
- **Indirection**: Must look at factory to understand defaults
- **Over-engineering**: Simple tests may not need factories
- **Coupling**: Tests depend on factory implementation

### Common Mistakes

**Mistake 1: Factories that depend on test state**

**Bad:**

```typescript
let testCounter = 0;

function createTestUser() {
  testCounter++; // Side effect!
  return { id: `user_${testCounter}` };
}
```

**Good:**

```typescript
function createTestUser(overrides: Partial<User> = {}) {
  return {
    id: overrides.id ?? `user_${Date.now()}_${Math.random()}`,
    ...overrides,
  };
}
```

**Why this matters**: Factories should be pure functions. Side effects make tests order-dependent and harder to debug.

**Mistake 2: Factories with too many parameters**

**Bad:**

```typescript
function createTestDefinition(
  tools: string[],
  maxTurns: number,
  maxTime: number,
  model: string,
  temperature: number,
  outputSchema: z.ZodType,
  inputSchema: z.ZodType
  // ... 10 more parameters
) {
  // Hard to use, easy to mix up parameter order
}
```

**Good:**

```typescript
function createTestDefinition(tools: string[] = [], overrides: Partial<AgentDefinition> = {}) {
  return {
    tools,
    maxTurns: 10,
    // ... defaults
    ...overrides,
  };
}
```

**Why this matters**: Use an options object or overrides pattern instead of many positional parameters.

**Mistake 3: Not providing sensible defaults**

**Bad:**

```typescript
function createTestUser(overrides: Partial<User>) {
  return {
    ...overrides, // No defaults!
  } as User;
}
// Usage: createTestUser({ id: '1', name: 'Test', email: '...', role: '...', ... })
```

**Good:**

```typescript
function createTestUser(overrides: Partial<User> = {}) {
  return {
    id: 'default-id',
    name: 'Default User',
    email: 'default@test.com',
    role: 'user',
    ...overrides,
  };
}
// Usage: createTestUser({ name: 'Custom' })
```

**Why this matters**: Factories should minimize what tests need to specify. Only override what is relevant to the test.

### Testing Strategy

**What to Test:**

- Factories are tested implicitly through tests that use them
- Critical factories may have their own tests verifying defaults

**Test Organization:**

- Place factories at top of test file in a "Test Fixtures" section
- Place shared factories in `test-utils/factories.ts`
- Export factories that are needed across multiple test files

**Mock Strategy:**

- Factories create data, not mocks
- Combine factories with vi.fn() for mock behaviors
- Keep factory output deterministic

**Test Example:**

```typescript
// src/services/user.test.ts
import { createMockUser } from '../test-utils/factories.js';

describe('UserService', () => {
  describe('updateUser', () => {
    it('should update user name', async () => {
      // Arrange - Factory provides all required fields
      const user = createMockUser({ name: 'Original' });

      // Act
      const updated = await userService.updateUser(user.id, { name: 'Updated' });

      // Assert
      expect(updated.name).toBe('Updated');
      expect(updated.email).toBe('test@example.com'); // Default from factory
    });

    it('should update user with admin role', async () => {
      // Arrange - Override role for this specific test
      const adminUser = createMockUser({ role: 'admin' });

      // Act
      const result = await userService.updateUser(adminUser.id, { name: 'Admin' });

      // Assert - verify admin-specific behavior
    });
  });
});
```

**Coverage Goals:**

- All tests using factories should pass
- Factory defaults should represent typical valid values
- Overrides should be typed and validated

### Related Patterns

- **[AAA Pattern](#pattern-2-aaa-pattern-arrange-act-assert)** - Use factories in Arrange section
- **[Mock Objects](#pattern-3-mock-objects-via-interfaces)** - Factories complement mock objects
- **[Shared Test Utilities](#pattern-12-shared-test-utilities)** - Store reusable factories

---

## Pattern 12: Shared Test Utilities

### Intent

Organize reusable test utilities, mocks, and helpers in dedicated directories that can be shared across test files and packages.

### Problem

Test utilities are duplicated across test files. Mock implementations exist in multiple places with slight variations. When adding new tests, developers must discover or recreate common helpers. Cross-package tests cannot share utilities. There is no standard location for test infrastructure code.

### Solution

Create dedicated `test-utils/` directories at appropriate levels (per package and shared). Organize utilities by purpose (mocks, factories, helpers, custom matchers). Export utilities for reuse across test files. Follow consistent naming conventions and TypeScript typing.

### Structure

```
packages/
├── core/
│   └── src/
│       ├── test-utils/           # Package-specific test utilities
│       │   ├── index.ts          # Re-exports
│       │   ├── mock-tool.ts      # MockTool class
│       │   ├── mock-config.ts    # Config factories
│       │   └── mock-message-bus.ts
│       └── services/
│           └── service.test.ts   # Uses ../test-utils
├── cli/
│   └── src/
│       └── test-utils/           # CLI-specific test utilities
│           ├── mockCommandContext.ts
│           └── customMatchers.ts
└── test-utils/                   # Shared across all packages
    ├── index.ts
    └── file-system-test-helpers.ts
```

### Implementation

**Step 1: Create package-level test-utils directory**

```typescript
// packages/core/src/test-utils/index.ts
export { MockTool, type MockToolOptions } from './mock-tool.js';
export { makeFakeConfig } from './mock-config.js';
export { MockMessageBus } from './mock-message-bus.js';
export { createMockWorkspaceContext } from './mock-workspace-context.js';
```

**Step 2: Create mock classes with configurable behavior**

```typescript
// packages/core/src/test-utils/mock-tool.ts
import { vi } from 'vitest';
import type { DeclarativeTool, ToolResult, ToolInvocation } from '../tools/tool.js';
import type { Config } from '../config/config.js';

export interface MockToolOptions {
  name: string;
  displayName?: string;
  description?: string;
  executeResult?: ToolResult;
  shouldThrow?: boolean;
  throwError?: Error;
  validateResult?: string | null;
  shouldConfirm?: boolean;
  confirmPrompt?: string;
}

export class MockTool implements DeclarativeTool<unknown, ToolResult> {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;

  public buildCalls: unknown[] = [];
  public executeCalls: unknown[] = [];

  private options: MockToolOptions;

  constructor(options: MockToolOptions) {
    this.options = options;
    this.name = options.name;
    this.displayName = options.displayName ?? options.name;
    this.description = options.description ?? `Mock tool: ${options.name}`;
  }

  validateToolParams(params: unknown): string | null {
    return this.options.validateResult ?? null;
  }

  build(params: unknown): ToolInvocation<unknown, ToolResult> {
    this.buildCalls.push(params);

    return {
      params,
      getDescription: () => `Mock ${this.name}`,
      toolLocations: () => [],
      shouldConfirmExecute: async () => {
        if (this.options.shouldConfirm) {
          return {
            type: 'info',
            title: 'Confirm',
            prompt: this.options.confirmPrompt ?? 'Confirm?',
          };
        }
        return false;
      },
      execute: async () => {
        this.executeCalls.push(params);

        if (this.options.shouldThrow) {
          throw this.options.throwError ?? new Error('Mock tool error');
        }

        return (
          this.options.executeResult ?? {
            llmContent: `Mock result for ${this.name}`,
            returnDisplay: `Mock ${this.name} executed`,
          }
        );
      },
    };
  }

  reset(): void {
    this.buildCalls = [];
    this.executeCalls = [];
  }
}
```

**Step 3: Create message bus mock with assertions**

```typescript
// packages/core/src/test-utils/mock-message-bus.ts
import { vi } from 'vitest';
import type { Message, MessageBus, EventType } from '../message-bus/types.js';

export class MockMessageBus implements MessageBus {
  public publishedMessages: Message[] = [];
  public subscriptions: Map<EventType, Function[]> = new Map();

  publish = vi.fn((message: Message) => {
    this.publishedMessages.push(message);
    const handlers = this.subscriptions.get(message.type) ?? [];
    handlers.forEach((handler) => handler(message));
  });

  subscribe = vi.fn((eventType: EventType, handler: Function) => {
    const handlers = this.subscriptions.get(eventType) ?? [];
    handlers.push(handler);
    this.subscriptions.set(eventType, handlers);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    };
  });

  request = vi.fn(async (message: Message) => {
    this.publishedMessages.push(message);
    return { success: true };
  });

  // Assertion helpers
  expectPublished(eventType: EventType): Message | undefined {
    return this.publishedMessages.find((m) => m.type === eventType);
  }

  expectPublishedWithPayload(
    eventType: EventType,
    payloadMatcher: Partial<Record<string, unknown>>
  ): Message | undefined {
    return this.publishedMessages.find(
      (m) =>
        m.type === eventType &&
        Object.entries(payloadMatcher).every(([key, value]) => m.payload[key] === value)
    );
  }

  expectHookRequest(
    eventName: string,
    input?: Partial<Record<string, unknown>>
  ): Message | undefined {
    return this.publishedMessages.find(
      (m) =>
        m.type === 'HOOK_REQUEST' &&
        m.payload.eventName === eventName &&
        (!input || Object.entries(input).every(([key, value]) => m.payload.input?.[key] === value))
    );
  }

  reset(): void {
    this.publishedMessages = [];
    this.subscriptions.clear();
    vi.clearAllMocks();
  }
}
```

**Step 4: Create shared file system helpers**

```typescript
// packages/test-utils/src/file-system-test-helpers.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export type FileSystemStructure = {
  [name: string]: string | FileSystemStructure | Array<string | FileSystemStructure>;
};

/**
 * Creates a temporary directory with the specified structure.
 * Files are created with string content, directories with nested structure.
 */
export async function createTmpDir(
  structure: FileSystemStructure,
  prefix = 'test-'
): Promise<string> {
  const realTmp = await fs.realpath(os.tmpdir());
  const tmpDir = await fs.mkdtemp(path.join(realTmp, prefix));

  async function createStructure(dir: string, struct: FileSystemStructure): Promise<void> {
    for (const [name, content] of Object.entries(struct)) {
      const fullPath = path.join(dir, name);

      if (typeof content === 'string') {
        // Create file with content
        await fs.writeFile(fullPath, content, 'utf-8');
      } else if (Array.isArray(content)) {
        // Create directory with multiple items
        await fs.mkdir(fullPath, { recursive: true });
        for (const item of content) {
          if (typeof item === 'string') {
            await fs.writeFile(path.join(fullPath, item), '', 'utf-8');
          } else {
            await createStructure(fullPath, item);
          }
        }
      } else {
        // Create directory with nested structure
        await fs.mkdir(fullPath, { recursive: true });
        await createStructure(fullPath, content);
      }
    }
  }

  await createStructure(tmpDir, structure);
  return tmpDir;
}

/**
 * Cleans up a temporary directory.
 */
export async function cleanupTmpDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Reads directory contents recursively for assertions.
 */
export async function readDirRecursive(dir: string): Promise<string[]> {
  const entries: string[] = [];

  async function walk(currentDir: string, relativePath = ''): Promise<void> {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    for (const item of items) {
      const itemPath = path.join(relativePath, item.name);
      entries.push(itemPath);
      if (item.isDirectory()) {
        await walk(path.join(currentDir, item.name), itemPath);
      }
    }
  }

  await walk(dir);
  return entries.sort();
}
```

### Complete Example

```typescript
// packages/core/src/test-utils/index.ts
// Central export file for all test utilities

// Mock implementations
export { MockTool, type MockToolOptions } from './mock-tool.js';
export { MockMessageBus } from './mock-message-bus.js';
export { MockWorkspaceContext } from './mock-workspace-context.js';

// Factory functions
export { makeFakeConfig, type FakeConfigOptions } from './mock-config.js';
export { createTestDefinition } from './factories.js';

// Helper functions
export { waitFor, flushPromises } from './async-helpers.js';

// packages/core/src/test-utils/mock-config.ts
import { vi } from 'vitest';
import type { Config } from '../config/config.js';
import type { ToolRegistry } from '../tools/tool-registry.js';

export interface FakeConfigOptions {
  targetDir?: string;
  model?: string;
  apiKey?: string;
  debugMode?: boolean;
  toolRegistry?: ToolRegistry;
}

export function makeFakeConfig(options: FakeConfigOptions = {}): Config {
  const mockToolRegistry =
    options.toolRegistry ??
    ({
      getTool: vi.fn(),
      getAllTools: vi.fn().mockReturnValue([]),
      getFunctionDeclarations: vi.fn().mockReturnValue([]),
      registerTool: vi.fn(),
    } as unknown as ToolRegistry);

  return {
    getTargetDir: vi.fn().mockReturnValue(options.targetDir ?? '/test/workspace'),
    getModel: vi.fn().mockReturnValue(options.model ?? 'gemini-2.0-flash'),
    getApiKey: vi.fn().mockReturnValue(options.apiKey ?? 'test-api-key'),
    isDebugMode: vi.fn().mockReturnValue(options.debugMode ?? false),
    getToolRegistry: vi.fn().mockReturnValue(mockToolRegistry),
  } as unknown as Config;
}

// packages/core/src/test-utils/async-helpers.ts
import { vi } from 'vitest';

/**
 * Waits for a condition to be true, polling at intervals.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Flushes all pending promises and microtasks.
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

// packages/cli/src/test-utils/mockCommandContext.ts
import { vi } from 'vitest';
import type { CommandContext, Logger, Services } from '../types.js';
import { merge } from 'lodash-es';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Creates a mock command context with all services stubbed.
 * Uses deep merge to allow partial overrides at any level.
 */
export function createMockCommandContext(
  overrides: DeepPartial<CommandContext> = {}
): CommandContext {
  const defaultMocks: CommandContext = {
    services: {
      logger: {
        log: vi.fn(),
        logMessage: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      } as Logger,
      config: {
        get: vi.fn(),
        set: vi.fn(),
        getTargetDir: vi.fn().mockReturnValue('/test'),
      },
      fileSystem: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        exists: vi.fn(),
      },
    } as Services,
    flags: {},
    args: {},
  };

  return merge(defaultMocks, overrides) as CommandContext;
}

// Usage in tests
// packages/core/src/agents/executor.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MockTool,
  MockMessageBus,
  makeFakeConfig,
  createTestDefinition,
} from '../test-utils/index.js';
import { createTmpDir, cleanupTmpDir } from '@flowmaster/test-utils';

describe('AgentExecutor', () => {
  let mockBus: MockMessageBus;
  let mockConfig: Config;
  let tempDir: string;

  beforeEach(async () => {
    mockBus = new MockMessageBus();
    mockConfig = makeFakeConfig();

    // Create temp directory with test structure
    tempDir = await createTmpDir({
      src: {
        'index.ts': 'export const main = () => {};',
        'utils.ts': 'export const helper = () => {};',
      },
      'package.json': '{ "name": "test" }',
      '.gitignore': 'node_modules/',
    });
  });

  afterEach(async () => {
    mockBus.reset();
    await cleanupTmpDir(tempDir);
  });

  describe('tool execution', () => {
    it('should publish tool events to message bus', async () => {
      // Arrange
      const mockTool = new MockTool({
        name: 'test_tool',
        executeResult: { llmContent: 'Done', returnDisplay: 'Done' },
      });

      const definition = createTestDefinition(['test_tool']);
      const executor = await AgentExecutor.create(definition, mockConfig, mockBus);

      // Act
      await executor.run({ goal: 'Test' }, new AbortController().signal);

      // Assert using MockMessageBus helpers
      expect(mockBus.expectPublished('TOOL_STARTED')).toBeDefined();
      expect(mockBus.expectPublished('TOOL_COMPLETED')).toBeDefined();
      expect(
        mockBus.expectPublishedWithPayload('TOOL_COMPLETED', {
          toolName: 'test_tool',
        })
      ).toBeDefined();
    });
  });

  describe('file operations', () => {
    it('should work with temp directory structure', async () => {
      // tempDir already has src/index.ts from beforeEach
      const indexPath = `${tempDir}/src/index.ts`;

      // Test can use the pre-created structure
      expect(await fs.access(indexPath)).toBeUndefined();
    });
  });
});
```

**Example explained:**

- Lines 1-10: Central index.ts re-exports all utilities
- Lines 12-30: Config factory with typed options
- Lines 32-55: Async helper utilities
- Lines 57-100: CLI-specific mock context with deep merge
- Lines 102-180: Usage example showing imports and test setup

### When to Use

**Use shared test utilities when:**

- Multiple test files need the same mocks
- Cross-package testing requires shared infrastructure
- Mock implementations are complex enough to warrant reuse
- Team needs standardized testing patterns

**Avoid shared test utilities when:**

- Utility is only used in one test file (keep it local)
- Sharing would create tight coupling between packages
- Utility is so simple it does not need abstraction

### Benefits

- **Consistency**: All tests use same mock implementations
- **Maintainability**: Update mocks in one place
- **Discoverability**: Standard location for test infrastructure
- **Reusability**: Share utilities across packages
- **Documentation**: Utilities serve as examples

### Trade-offs

- **Coupling**: Tests depend on shared utilities
- **Complexity**: Another layer of abstraction
- **Versioning**: Changes can break many tests
- **Learning Curve**: Developers must learn utility APIs

### Common Mistakes

**Mistake 1: Putting test utilities in production code paths**

**Bad:**

```
packages/core/
├── src/
│   ├── utils/
│   │   └── test-helpers.ts  # Wrong location!
```

**Good:**

```
packages/core/
├── src/
│   ├── test-utils/          # Dedicated directory
│   │   └── mock-tool.ts
```

**Why this matters**: Test utilities should be excluded from production builds and clearly separated from production code.

**Mistake 2: Not providing reset methods on mocks**

**Bad:**

```typescript
class MockService {
  public calls: string[] = [];

  doSomething(arg: string) {
    this.calls.push(arg);
  }
  // No reset method!
}
```

**Good:**

```typescript
class MockService {
  public calls: string[] = [];

  doSomething(arg: string) {
    this.calls.push(arg);
  }

  reset(): void {
    this.calls = [];
  }
}
```

**Why this matters**: Without reset methods, mock state leaks between tests unless mocks are recreated in every beforeEach.

**Mistake 3: Overly specific utilities that are not reusable**

**Bad:**

```typescript
// Too specific - only useful for one test
function setupTestWithUserAliceAndThreeProducts() {
  // ...
}
```

**Good:**

```typescript
// General-purpose with parameters
function createMockUser(overrides: Partial<User> = {}) {
  /* ... */
}
function createMockProduct(overrides: Partial<Product> = {}) {
  /* ... */
}
```

**Why this matters**: Utilities should be parameterized and flexible, not hard-coded for specific scenarios.

### Testing Strategy

**What to Test:**

- Complex mock utilities may have their own tests
- Factories tested implicitly through usage

**Test Organization:**

- `src/test-utils/` for package-specific utilities
- `packages/test-utils/` for cross-package utilities
- Re-export from `index.ts` for clean imports

**Directory Structure:**

```
packages/
├── core/src/test-utils/
│   ├── index.ts              # Re-exports everything
│   ├── mock-tool.ts          # MockTool class
│   ├── mock-config.ts        # Config factories
│   ├── mock-message-bus.ts   # MessageBus mock
│   ├── factories.ts          # Data factories
│   └── async-helpers.ts      # waitFor, flushPromises
├── cli/src/test-utils/
│   ├── mockCommandContext.ts
│   └── customMatchers.ts
└── test-utils/src/           # Shared package
    ├── index.ts
    ├── file-system-test-helpers.ts
    └── network-test-helpers.ts
```

### Related Patterns

- **[Test Helper Factories](#pattern-11-test-helper-factories)** - Factories are a type of test utility
- **[Mock Objects](#pattern-3-mock-objects-via-interfaces)** - Mock classes live in test-utils
- **[Custom Matchers](#pattern-13-custom-matchers)** - Custom matchers are test utilities

---

## Pattern 13: Custom Matchers

### Intent

Extend Vitest's `expect` with domain-specific matchers that make test assertions more readable and provide better error messages.

### Problem

Built-in matchers are generic and may not express domain-specific assertions clearly. Complex assertions require multiple expect calls or helper functions. Error messages from generic matchers do not explain domain-specific failures. Tests become verbose when asserting complex conditions.

### Solution

Create custom matchers using `expect.extend()` that encapsulate domain-specific assertions. Provide clear, descriptive matcher names that read naturally. Include TypeScript type declarations for autocomplete support. Generate helpful error messages that explain what went wrong in domain terms.

### Structure

```typescript
// Define custom matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to be a valid email`
          : `expected "${received}" to be a valid email`,
    };
  },
});

// TypeScript declaration
declare module 'vitest' {
  interface Assertion<T> {
    toBeValidEmail(): T;
  }
}

// Usage
expect(user.email).toBeValidEmail();
```

### Implementation

**Step 1: Create matcher file in test-utils**

```typescript
// packages/cli/src/test-utils/customMatchers.ts
import { expect } from 'vitest';

// =============================================================================
// Custom Matcher Implementations
// =============================================================================

expect.extend({
  /**
   * Asserts that a string contains only valid characters for display.
   * Valid characters are printable ASCII, common unicode, and whitespace.
   */
  toHaveOnlyValidCharacters(received: string) {
    // Check for control characters (except newline, tab)
    const invalidChars = received.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
    const pass = invalidChars === null;

    return {
      pass,
      message: () => {
        if (pass) {
          return `expected "${received}" to contain invalid characters, but all characters are valid`;
        }
        const charCodes = invalidChars!.map((c) => `0x${c.charCodeAt(0).toString(16)}`);
        return `expected "${received}" to have only valid characters, but found invalid characters: ${charCodes.join(', ')}`;
      },
    };
  },

  /**
   * Asserts that an object has a specific shape (subset matching).
   */
  toMatchShape(received: unknown, expected: Record<string, unknown>) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () => `expected ${received} to be an object`,
      };
    }

    const missingKeys: string[] = [];
    const wrongValues: Array<{ key: string; expected: unknown; received: unknown }> = [];

    for (const [key, expectedValue] of Object.entries(expected)) {
      if (!(key in received)) {
        missingKeys.push(key);
      } else if ((received as Record<string, unknown>)[key] !== expectedValue) {
        wrongValues.push({
          key,
          expected: expectedValue,
          received: (received as Record<string, unknown>)[key],
        });
      }
    }

    const pass = missingKeys.length === 0 && wrongValues.length === 0;

    return {
      pass,
      message: () => {
        const parts: string[] = [];
        if (missingKeys.length > 0) {
          parts.push(`missing keys: ${missingKeys.join(', ')}`);
        }
        if (wrongValues.length > 0) {
          parts.push(
            `wrong values: ${wrongValues
              .map((w) => `${w.key}: expected ${w.expected}, got ${w.received}`)
              .join('; ')}`
          );
        }
        return `expected object to match shape, but ${parts.join(' and ')}`;
      },
    };
  },

  /**
   * Asserts that an error has a specific type and message pattern.
   */
  toBeToolError(received: unknown, expectedType: string, messagePattern?: RegExp) {
    if (!(received instanceof Error)) {
      return {
        pass: false,
        message: () => `expected ${received} to be an Error`,
      };
    }

    const hasCorrectType = 'type' in received && received.type === expectedType;
    const hasCorrectMessage = !messagePattern || messagePattern.test(received.message);
    const pass = hasCorrectType && hasCorrectMessage;

    return {
      pass,
      message: () => {
        const parts: string[] = [];
        if (!hasCorrectType) {
          parts.push(`expected type "${expectedType}", got "${(received as any).type}"`);
        }
        if (!hasCorrectMessage) {
          parts.push(`message "${received.message}" did not match pattern ${messagePattern}`);
        }
        return `expected tool error ${parts.join(' and ')}`;
      },
    };
  },
});

// =============================================================================
// TypeScript Declarations
// =============================================================================

declare module 'vitest' {
  interface Assertion<T> {
    /**
     * Asserts that the string contains only valid displayable characters.
     * @example expect(output).toHaveOnlyValidCharacters()
     */
    toHaveOnlyValidCharacters(): T;

    /**
     * Asserts that the object matches the expected shape (subset matching).
     * @example expect(user).toMatchShape({ name: 'Alice', role: 'admin' })
     */
    toMatchShape(expected: Record<string, unknown>): T;

    /**
     * Asserts that the error is a tool error with specific type and message.
     * @example expect(error).toBeToolError('VALIDATION_ERROR', /invalid path/)
     */
    toBeToolError(expectedType: string, messagePattern?: RegExp): T;
  }
}
```

**Step 2: Import matchers in test setup**

```typescript
// vitest.setup.ts
import './src/test-utils/customMatchers.js';

// Or import in individual test files:
// import '../test-utils/customMatchers.js';
```

**Step 3: Configure Vitest to use setup file**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // ... other config
  },
});
```

### Complete Example

```typescript
// packages/cli/src/test-utils/customMatchers.ts
import { expect } from 'vitest';

expect.extend({
  /**
   * Asserts that an async iterable yields specific values in order.
   */
  async toYieldValues(received: AsyncIterable<unknown>, expected: unknown[]) {
    const values: unknown[] = [];
    for await (const value of received) {
      values.push(value);
    }

    const pass =
      values.length === expected.length &&
      values.every((v, i) => JSON.stringify(v) === JSON.stringify(expected[i]));

    return {
      pass,
      message: () =>
        pass
          ? `expected async iterable not to yield ${JSON.stringify(expected)}`
          : `expected async iterable to yield ${JSON.stringify(expected)}, but got ${JSON.stringify(values)}`,
    };
  },

  /**
   * Asserts that a path is within the workspace directory.
   */
  toBeWithinWorkspace(received: string, workspaceRoot: string) {
    const normalized = received.startsWith('/') ? received : `${workspaceRoot}/${received}`;
    const pass = normalized.startsWith(workspaceRoot) && !normalized.includes('..');

    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" to be outside workspace "${workspaceRoot}"`
          : `expected "${received}" to be within workspace "${workspaceRoot}"`,
    };
  },

  /**
   * Asserts that a duration is within expected bounds.
   */
  toBeWithinDuration(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received}ms to be outside ${min}ms-${max}ms`
          : `expected ${received}ms to be within ${min}ms-${max}ms`,
    };
  },

  /**
   * Asserts that a tool result has specific content.
   */
  toHaveToolResult(received: unknown, expectedContent: string | RegExp) {
    if (typeof received !== 'object' || received === null || !('llmContent' in received)) {
      return {
        pass: false,
        message: () => `expected ${JSON.stringify(received)} to be a tool result`,
      };
    }

    const content = (received as { llmContent: string }).llmContent;
    const pass =
      typeof expectedContent === 'string'
        ? content.includes(expectedContent)
        : expectedContent.test(content);

    return {
      pass,
      message: () =>
        pass
          ? `expected tool result not to contain "${expectedContent}"`
          : `expected tool result to contain "${expectedContent}", got "${content}"`,
    };
  },
});

// TypeScript declarations
declare module 'vitest' {
  interface Assertion<T> {
    toYieldValues(expected: unknown[]): Promise<T>;
    toBeWithinWorkspace(workspaceRoot: string): T;
    toBeWithinDuration(min: number, max: number): T;
    toHaveToolResult(expectedContent: string | RegExp): T;
  }
}

// =============================================================================
// Usage Examples
// =============================================================================

// packages/core/src/tools/glob.test.ts
import { describe, it, expect } from 'vitest';
import '../test-utils/customMatchers.js';

describe('GlobTool', () => {
  describe('output validation', () => {
    it('should produce output with only valid characters', async () => {
      const result = await globTool.execute({ pattern: '*.ts' }, signal);

      // Custom matcher reads naturally
      expect(result.llmContent).toHaveOnlyValidCharacters();
    });

    it('should produce result with expected content', async () => {
      const result = await globTool.execute({ pattern: '*.ts' }, signal);

      // Domain-specific matcher
      expect(result).toHaveToolResult('Found');
      expect(result).toHaveToolResult(/Found \d+ file\(s\)/);
    });
  });

  describe('path validation', () => {
    it('should ensure paths are within workspace', async () => {
      const result = await globTool.execute({ pattern: '*.ts' }, signal);
      const files = result.files as string[];

      for (const file of files) {
        // Clear assertion about security requirement
        expect(file).toBeWithinWorkspace('/test/workspace');
      }
    });
  });
});

// packages/core/src/agents/executor.test.ts
describe('AgentExecutor', () => {
  describe('streaming', () => {
    it('should yield events in expected order', async () => {
      const events = executor.streamEvents({ goal: 'Test' }, signal);

      // Async matcher for streams
      await expect(events).toYieldValues([
        { type: 'START', data: expect.any(Object) },
        { type: 'TOOL_CALL', data: expect.any(Object) },
        { type: 'COMPLETE', data: expect.any(Object) },
      ]);
    });
  });

  describe('performance', () => {
    it('should complete within time bounds', async () => {
      const start = Date.now();
      await executor.run({ goal: 'Quick task' }, signal);
      const duration = Date.now() - start;

      // Duration assertion with clear bounds
      expect(duration).toBeWithinDuration(0, 5000);
    });
  });

  describe('error handling', () => {
    it('should produce typed tool errors', async () => {
      const result = await executor.run({ goal: 'Invalid' }, signal);

      // Domain-specific error matching
      expect(result.error).toBeToolError('VALIDATION_ERROR', /invalid path/);
    });
  });
});
```

**Example explained:**

- Lines 5-30: `toYieldValues` for async iterable assertions
- Lines 32-45: `toBeWithinWorkspace` for security path checks
- Lines 47-58: `toBeWithinDuration` for performance assertions
- Lines 60-80: `toHaveToolResult` for tool output matching
- Lines 85-95: TypeScript declarations for autocomplete
- Lines 100-180: Usage examples showing readability improvement

### When to Use

**Use custom matchers when:**

- Same complex assertion appears in multiple tests
- Built-in matchers require verbose workarounds
- Error messages from built-in matchers are unclear
- Domain-specific concepts need direct expression
- Improving test readability significantly

**Avoid custom matchers when:**

- Assertion is used only once or twice
- Built-in matchers express the intent clearly
- Matcher logic is trivial (just wrapping a built-in)
- Team is not familiar with custom matchers

### Benefits

- **Readability**: `expect(email).toBeValidEmail()` vs `expect(regex.test(email)).toBe(true)`
- **Error Messages**: Domain-specific failure explanations
- **Reusability**: Define once, use everywhere
- **Documentation**: Matcher names document domain concepts
- **Type Safety**: TypeScript declarations provide autocomplete

### Trade-offs

- **Learning Curve**: Team must learn custom matchers
- **Maintenance**: Custom code to maintain
- **Discoverability**: Developers may not know matchers exist
- **Complexity**: Another abstraction layer

### Common Mistakes

**Mistake 1: Missing TypeScript declarations**

**Bad:**

```typescript
expect.extend({
  toBeValidEmail(received) {
    // ...
  },
});

// No declaration - no autocomplete, no type checking
```

**Good:**

```typescript
expect.extend({
  toBeValidEmail(received: string) {
    // ...
  },
});

declare module 'vitest' {
  interface Assertion<T> {
    toBeValidEmail(): T;
  }
}
```

**Why this matters**: Without declarations, TypeScript cannot verify matcher usage and IDE cannot provide autocomplete.

**Mistake 2: Poor error messages**

**Bad:**

```typescript
toBeValidEmail(received) {
  const pass = emailRegex.test(received);
  return {
    pass,
    message: () => 'assertion failed', // Unhelpful!
  };
}
```

**Good:**

```typescript
toBeValidEmail(received) {
  const pass = emailRegex.test(received);
  return {
    pass,
    message: () =>
      pass
        ? `expected "${received}" not to be a valid email`
        : `expected "${received}" to be a valid email (got "${received}")`,
  };
}
```

**Why this matters**: The error message is what developers see when tests fail. Make it helpful!

**Mistake 3: Not handling edge cases**

**Bad:**

```typescript
toMatchShape(received, expected) {
  // Crashes if received is null or undefined
  for (const key of Object.keys(received)) {
    // ...
  }
}
```

**Good:**

```typescript
toMatchShape(received, expected) {
  if (typeof received !== 'object' || received === null) {
    return {
      pass: false,
      message: () => `expected ${received} to be an object`,
    };
  }
  // ...
}
```

**Why this matters**: Matchers should handle any input gracefully and provide helpful messages.

### Testing Strategy

**What to Test:**

- Custom matchers should have their own tests
- Test both pass and fail cases
- Test error message content
- Test edge cases (null, undefined, wrong types)

**Test Organization:**

- Place matchers in `test-utils/customMatchers.ts`
- Import in `vitest.setup.ts` for global availability
- Or import per-file when only some tests need them

**Test Example:**

```typescript
// packages/cli/src/test-utils/customMatchers.test.ts
import { describe, it, expect } from 'vitest';
import './customMatchers.js';

describe('Custom Matchers', () => {
  describe('toBeValidEmail', () => {
    it('should pass for valid emails', () => {
      expect('user@example.com').toBeValidEmail();
      expect('user.name@domain.co.uk').toBeValidEmail();
    });

    it('should fail for invalid emails', () => {
      expect(() => expect('invalid').toBeValidEmail()).toThrow();
      expect(() => expect('@nodomain.com').toBeValidEmail()).toThrow();
    });

    it('should provide helpful error message', () => {
      expect(() => expect('invalid').toBeValidEmail()).toThrow(
        'expected "invalid" to be a valid email'
      );
    });
  });

  describe('toHaveOnlyValidCharacters', () => {
    it('should pass for normal strings', () => {
      expect('Hello World').toHaveOnlyValidCharacters();
      expect('Line 1\nLine 2').toHaveOnlyValidCharacters();
    });

    it('should fail for strings with control characters', () => {
      expect(() => expect('Hello\x00World').toHaveOnlyValidCharacters()).toThrow();
    });
  });
});
```

**Coverage Goals:**

- All custom matchers have tests
- Both pass and fail paths tested
- Error messages verified
- Edge cases covered

### Related Patterns

- **[Shared Test Utilities](#pattern-12-shared-test-utilities)** - Custom matchers are test utilities
- **[Test Organization](#pattern-6-comprehensive-test-organization)** - Use matchers in organized tests
- **[Security Test Labeling](#pattern-9-security-test-labeling)** - Security matchers for security tests

---

## Pattern 14: Integration Test Configuration

### Intent

Configure separate test environments for integration tests with longer timeouts, retry logic, and appropriate isolation from unit tests.

### Problem

Unit test configuration is not appropriate for integration tests. Integration tests need longer timeouts due to real I/O operations. Flaky integration tests should retry before failing. Integration tests may require global setup (databases, servers). Running all tests together makes it hard to isolate integration test failures.

### Solution

Create a separate Vitest configuration for integration tests. Place integration tests in a dedicated directory. Configure appropriate timeouts (5-10 minutes), retry counts, and parallelism settings. Use global setup files for environment preparation. Disable coverage for integration tests to focus on functionality.

### Structure

```
project/
├── packages/
│   └── core/src/            # Unit tests co-located
├── integration-tests/
│   ├── vitest.config.ts     # Integration test config
│   ├── globalSetup.ts       # Environment setup
│   ├── file-system.test.ts
│   └── api.test.ts
└── vitest.config.ts         # Default (unit) config
```

### Implementation

**Step 1: Create integration test directory**

```
integration-tests/
├── vitest.config.ts
├── globalSetup.ts
├── file-system.test.ts
├── shell.test.ts
└── mcp-server.test.ts
```

**Step 2: Configure integration test Vitest**

```typescript
// integration-tests/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Long timeout for real I/O operations
    testTimeout: 300000, // 5 minutes

    // Retry flaky tests
    retry: 2,

    // Global setup for environment preparation
    globalSetup: './globalSetup.ts',

    // Include all test files in this directory
    include: ['**/*.test.ts'],

    // Run tests in parallel for speed
    fileParallelism: true,

    // Pool configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 8,
        minThreads: 1,
      },
    },

    // No coverage for integration tests
    coverage: {
      enabled: false,
    },

    // Environment
    environment: 'node',

    // Resolve paths
    alias: {
      '@core': path.resolve(__dirname, '../packages/core/src'),
    },
  },
});
```

**Step 3: Create global setup file**

```typescript
// integration-tests/globalSetup.ts
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function setup() {
  console.log('[SETUP] Setting up integration test environment...');

  // Ensure required environment variables
  if (!process.env.TEST_API_KEY) {
    console.warn('[WARN] TEST_API_KEY not set, some tests may be skipped');
  }

  // Create temp directory for test artifacts
  const testTmpDir = path.join(process.cwd(), '.test-tmp');
  await fs.mkdir(testTmpDir, { recursive: true });
  process.env.TEST_TMP_DIR = testTmpDir;

  // Build dependencies if needed
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to build dependencies:', error);
    throw error;
  }

  console.log('[DONE] Integration test environment ready');
}

export async function teardown() {
  console.log('[CLEANUP] Cleaning up integration test environment...');

  // Clean up temp directory
  const testTmpDir = process.env.TEST_TMP_DIR;
  if (testTmpDir) {
    await fs.rm(testTmpDir, { recursive: true, force: true });
  }

  console.log('[DONE] Cleanup complete');
}
```

**Step 4: Add package.json scripts**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config integration-tests/vitest.config.ts",
    "test:all": "npm run test:unit && npm run test:integration",
    "test:integration:watch": "vitest --config integration-tests/vitest.config.ts"
  }
}
```

### Complete Example

```typescript
// integration-tests/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    testTimeout: 300000,
    hookTimeout: 60000,
    retry: 2,
    globalSetup: './globalSetup.ts',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    fileParallelism: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 8,
        minThreads: 1,
        isolate: true,
      },
    },
    coverage: {
      enabled: false,
    },
    reporters: ['verbose'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../packages/core/src'),
      '@cli': path.resolve(__dirname, '../packages/cli/src'),
    },
  },
});

// integration-tests/file-system.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GlobTool } from '@core/tools/glob.js';
import { ReadFileTool } from '@core/tools/read-file.js';
import { WriteFileTool } from '@core/tools/write-file.js';

describe('File System Integration', () => {
  let testDir: string;
  let config: Config;

  beforeAll(async () => {
    // Use test temp directory from global setup
    testDir = path.join(process.env.TEST_TMP_DIR!, 'file-system-test');
    await fs.mkdir(testDir, { recursive: true });

    // Create real config
    config = new Config({ targetDir: testDir });

    // Create test files
    await fs.writeFile(path.join(testDir, 'file1.ts'), 'export const a = 1;');
    await fs.writeFile(path.join(testDir, 'file2.ts'), 'export const b = 2;');
    await fs.mkdir(path.join(testDir, 'src'));
    await fs.writeFile(path.join(testDir, 'src/index.ts'), 'export * from "./utils";');
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('GlobTool', () => {
    it('should find files matching pattern in real file system', async () => {
      // Arrange
      const tool = new GlobTool(config);
      const signal = new AbortController().signal;

      // Act
      const invocation = tool.build({ pattern: '**/*.ts' });
      const result = await invocation.execute(signal);

      // Assert
      expect(result.llmContent).toContain('file1.ts');
      expect(result.llmContent).toContain('file2.ts');
      expect(result.llmContent).toContain('src/index.ts');
    });

    it('should handle large directories without timeout', async () => {
      // Arrange - create many files
      const manyFilesDir = path.join(testDir, 'many-files');
      await fs.mkdir(manyFilesDir);
      for (let i = 0; i < 1000; i++) {
        await fs.writeFile(path.join(manyFilesDir, `file${i}.txt`), `content ${i}`);
      }

      const tool = new GlobTool(config);
      const signal = new AbortController().signal;

      // Act
      const start = Date.now();
      const invocation = tool.build({ pattern: 'many-files/**/*.txt' });
      const result = await invocation.execute(signal);
      const duration = Date.now() - start;

      // Assert
      expect(result.llmContent).toContain('Found 1000 file(s)');
      expect(duration).toBeLessThan(30000); // Should complete within 30s
    });
  });

  describe('ReadFileTool', () => {
    it('should read real files with correct encoding', async () => {
      // Arrange
      const tool = new ReadFileTool(config);
      const signal = new AbortController().signal;

      // Act
      const invocation = tool.build({ file_path: path.join(testDir, 'file1.ts') });
      const result = await invocation.execute(signal);

      // Assert
      expect(result.llmContent).toContain('export const a = 1;');
    });

    it('should handle large files', async () => {
      // Arrange - create large file
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const largePath = path.join(testDir, 'large.txt');
      await fs.writeFile(largePath, largeContent);

      const tool = new ReadFileTool(config);
      const signal = new AbortController().signal;

      // Act
      const invocation = tool.build({ file_path: largePath });
      const result = await invocation.execute(signal);

      // Assert - should truncate or handle large files appropriately
      expect(result.returnDisplay).toBeDefined();
    });
  });

  describe('WriteFileTool', () => {
    it('should write files atomically', async () => {
      // Arrange
      const tool = new WriteFileTool(config);
      const signal = new AbortController().signal;
      const targetPath = path.join(testDir, 'new-file.ts');

      // Act
      const invocation = tool.build({
        file_path: targetPath,
        content: 'export const newValue = 42;',
      });
      const result = await invocation.execute(signal);

      // Assert
      expect(result.returnDisplay).toContain('Created');
      const written = await fs.readFile(targetPath, 'utf-8');
      expect(written).toBe('export const newValue = 42;');
    });
  });
});

// integration-tests/shell.test.ts
describe('Shell Integration', () => {
  it('should execute real shell commands', async () => {
    // Test with actual shell
    const tool = new ShellTool(config);
    const invocation = tool.build({ command: 'echo "hello"' });
    const result = await invocation.execute(new AbortController().signal);

    expect(result.llmContent).toContain('hello');
  });

  it('should handle long-running commands with timeout', async () => {
    const tool = new ShellTool(config);

    // Command that takes 2 seconds
    const invocation = tool.build({ command: 'sleep 2 && echo done' });

    const start = Date.now();
    const result = await invocation.execute(new AbortController().signal);
    const duration = Date.now() - start;

    expect(result.llmContent).toContain('done');
    expect(duration).toBeGreaterThanOrEqual(2000);
  });

  it('should handle command abort', async () => {
    const tool = new ShellTool(config);
    const controller = new AbortController();

    // Start long command
    const invocation = tool.build({ command: 'sleep 60' });
    const promise = invocation.execute(controller.signal);

    // Abort after 100ms
    setTimeout(() => controller.abort(), 100);

    // Should reject with abort error
    await expect(promise).rejects.toThrow(/abort/i);
  });
});
```

**Example explained:**

- Lines 1-35: Integration test Vitest config with long timeouts
- Lines 40-80: Global setup for environment preparation
- Lines 85-150: File system integration tests with real I/O
- Lines 155-200: Shell integration tests with actual command execution

### When to Use

**Use separate integration config when:**

- Tests require real external resources (files, network, databases)
- Tests take longer than unit test timeout (>5 seconds)
- Tests are flaky due to external dependencies
- Tests need different parallelism settings
- Tests require global environment setup

**Avoid separate integration config when:**

- All tests are fast unit tests
- Mocking provides sufficient test coverage
- Team prefers single test configuration

### Benefits

- **Appropriate Timeouts**: Integration tests get the time they need
- **Retry Logic**: Flaky tests get multiple chances before failing
- **Isolation**: Integration test failures do not block unit tests
- **Setup**: Global setup prepares the environment once
- **Performance**: Different parallelism for different test types

### Trade-offs

- **Complexity**: Multiple configurations to maintain
- **CI Time**: Integration tests add to total test time
- **Flakiness**: Real I/O can still cause intermittent failures
- **Environment**: Tests may behave differently across machines

### Common Mistakes

**Mistake 1: Timeout too short for real operations**

**Bad:**

```typescript
export default defineConfig({
  test: {
    testTimeout: 5000, // Too short for integration tests!
  },
});
```

**Good:**

```typescript
export default defineConfig({
  test: {
    testTimeout: 300000, // 5 minutes for real I/O
    hookTimeout: 60000, // 1 minute for setup/teardown
  },
});
```

**Why this matters**: Integration tests involve real I/O which can be slow. Give them enough time.

**Mistake 2: Not cleaning up test artifacts**

**Bad:**

```typescript
describe('File operations', () => {
  it('creates a file', async () => {
    await fs.writeFile('/tmp/test-file.txt', 'content');
    // No cleanup - file remains after test
  });
});
```

**Good:**

```typescript
describe('File operations', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('creates a file', async () => {
    await fs.writeFile(path.join(testDir, 'test-file.txt'), 'content');
    // Cleaned up in afterAll
  });
});
```

**Why this matters**: Test artifacts accumulate over time and can cause conflicts.

**Mistake 3: Running integration tests with coverage**

**Bad:**

```typescript
export default defineConfig({
  test: {
    coverage: {
      enabled: true, // Slows down integration tests unnecessarily
    },
  },
});
```

**Good:**

```typescript
export default defineConfig({
  test: {
    coverage: {
      enabled: false, // Focus on functionality, not coverage
    },
  },
});
```

**Why this matters**: Coverage instrumentation slows tests. Measure coverage with unit tests.

### Testing Strategy

**What to Test:**

- Real file system operations
- Real network requests
- Real database operations
- Real external service integrations
- Performance under realistic conditions

**Test Organization:**

- Dedicated `integration-tests/` directory
- Separate Vitest configuration
- Global setup/teardown for environment
- Clear separation from unit tests

### Related Patterns

- **[Temp Directory Isolation](#pattern-4-temp-directory-isolation)** - Use in integration tests
- **[Test Coverage](#pattern-5-test-coverage-requirements)** - Unit tests handle coverage
- **[Shared Test Utilities](#pattern-12-shared-test-utilities)** - Share utilities across test types

---

## Quick Reference

### Pattern Summary Table

| Pattern               | Use When                     | Avoid When                         | Key Benefit                |
| --------------------- | ---------------------------- | ---------------------------------- | -------------------------- |
| Co-located Tests      | Testing any source file      | Integration tests spanning modules | Easy discoverability       |
| AAA Pattern           | Every test case              | Extremely simple one-line tests    | Clear test structure       |
| Mock Objects          | External dependencies        | Fast deterministic code            | Type-safe explicit mocks   |
| Temp Directory        | File system operations       | Pure functions                     | Real file system behavior  |
| Coverage Requirements | Production code              | Prototypes/experiments             | Quality assurance          |
| Test Organization     | Multiple related tests       | Single simple test                 | Maintainability            |
| Vi Mock System        | External modules/timers      | Internal modules                   | Fast isolated tests        |
| Parameterized Tests   | Input validation, many cases | Different assertions per case      | Comprehensive coverage     |
| Security Labeling     | Security-critical tests      | Regular functional tests           | Visibility and audit trail |
| Protocol Violations   | External integrations, LLMs  | Internal code, pure functions      | System resilience          |
| Helper Factories      | Repeated test data creation  | Trivial primitives                 | DRY test setup             |
| Shared Utilities      | Cross-file/package mocks     | Single-file utilities              | Consistency and reuse      |
| Custom Matchers       | Domain-specific assertions   | One-off assertions                 | Readable tests             |
| Integration Config    | Real I/O, long tests         | Fast unit tests                    | Appropriate timeouts       |

### Code Snippets

**Co-located Tests - Minimal Example:**

```typescript
// src/service.ts
export class Service {}

// src/service.test.ts (same directory)
import { describe, it, expect } from 'vitest';
import { Service } from './service.js';

describe('Service', () => {
  it('should work', () => {
    expect(new Service()).toBeDefined();
  });
});
```

**AAA Pattern - Minimal Example:**

```typescript
it('should add numbers', () => {
  // Arrange
  const a = 2,
    b = 3;

  // Act
  const result = add(a, b);

  // Assert
  expect(result).toBe(5);
});
```

**Mock Objects - Minimal Example:**

```typescript
class MockApiClient implements ApiClient {
  async fetch(url: string): Promise<Response> {
    return { ok: true, data: 'mocked' } as Response;
  }
}

const mock = new MockApiClient();
const service = new Service(mock);
```

**Temp Directory - Minimal Example:**

```typescript
describe('FileTests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should work', async () => {
    const file = path.join(tempDir, 'test.txt');
    await fs.writeFile(file, 'content');
    expect(await fs.readFile(file, 'utf-8')).toBe('content');
  });
});
```

**Coverage Requirements - Minimal Example:**

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70,
    },
  },
});
```

**Test Organization - Minimal Example:**

```typescript
describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  describe('add', () => {
    it('should add positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });
  });

  describe('subtract', () => {
    it('should subtract numbers', () => {
      expect(calc.subtract(5, 3)).toBe(2);
    });
  });
});
```

**Vi Mock System - Minimal Example:**

```typescript
vi.mock('./externalService.js', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' }),
}));

const mockFetch = vi.mocked(fetchData);
await service.getData();
expect(mockFetch).toHaveBeenCalled();
```

---

## Enforcement

**Vitest Configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70,
      exclude: ['**/*.test.ts', '**/test-utils/**', '**/*.d.ts'],
    },
  },
});
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Pre-commit Hook:**

```json
{
  "scripts": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.ts": ["vitest related --run"]
  }
}
```

**CI Configuration:**

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
```

---

## Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type guards used in test assertions
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Test error paths and exceptions
- **[Code Organization](./06-code-organization.md)** - Test organization mirrors source organization
- **[Module Boundaries](./07-module-boundaries.md)** - Tests respect module boundaries

---

## References

**Source Code Examples:**

- [examplecode/gemini/packages/core/src/tools/ls.test.ts](../../examplecode/gemini/packages/core/src/tools/ls.test.ts) - Comprehensive tool testing with temp directories
- [examplecode/gemini/packages/core/src/services/fileDiscoveryService.test.ts](../../examplecode/gemini/packages/core/src/services/fileDiscoveryService.test.ts) - Service testing with real file system
- [examplecode/gemini/packages/core/src/config/config.test.ts](../../examplecode/gemini/packages/core/src/config/config.test.ts) - Complex mocking with vi system

**External Resources:**

- [Vitest Documentation](https://vitest.dev/) - Official Vitest testing framework guide
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html) - Comprehensive mocking documentation
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) - Martin Fowler on TDD

**Further Reading:**

- [AAA Testing Pattern](https://java-design-patterns.com/patterns/arrange-act-assert/) - Detailed AAA pattern explanation
- [Test Isolation](https://kentcdodds.com/blog/test-isolation-with-react) - Importance of test isolation

---

## Changelog

- **2025-12-17**: Added Patterns 8-14 based on Gemini codebase analysis: Parameterized Tests (it.each), Security Test Labeling, Protocol Violation Tests, Test Helper Factories, Shared Test Utilities, Custom Matchers, Integration Test Configuration
- **2025-12-17**: Added vi.hoisted() documentation to Pattern 7 (Vi Mock System)
- **2025-12-17**: Updated Quick Reference table with all new patterns
- **2025-01-21**: Rewrote testing patterns following template structure with detailed examples from codebase
- **2025-01-21**: Added Pattern 6 (Comprehensive Test Organization) and Pattern 7 (Vi Mock System)
- **2025-01-21**: Expanded all patterns with complete examples, implementation steps, and testing strategies
- **2025-01-21**: Added enforcement section with Vitest configuration and CI setup
