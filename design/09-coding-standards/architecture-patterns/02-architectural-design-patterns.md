---
title: Architectural Design Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All Services
related_patterns:
  - ./03-type-safety-patterns.md
  - ./05-testing-patterns.md
  - ./08-dependency-management.md
---

# 2. Architectural Design Patterns

> **Purpose**: Comprehensive architectural design patterns that establish clean separation of concerns, extensibility, and maintainability across the entire application.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Layered Architecture](#pattern-1-layered-architecture)
- [Pattern 2: Service Pattern with Interfaces](#pattern-2-service-pattern-with-interfaces)
- [Pattern 3: Builder Pattern](#pattern-3-builder-pattern)
- [Pattern 4: Registry Pattern](#pattern-4-registry-pattern)
- [Pattern 5: Dependency Injection via Config](#pattern-5-dependency-injection-via-config)
- [Pattern 6: Factory Pattern](#pattern-6-factory-pattern)
- [Pattern 7: Strategy Pattern](#pattern-7-strategy-pattern)
- [Pattern 8: Message Bus Pattern](#pattern-8-message-bus-pattern)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Architectural design patterns define the large-scale organization of code, establishing how components interact, how responsibilities are divided, and how the system can be extended. These patterns form the foundation for a maintainable, testable, and scalable codebase.

Well-chosen architectural patterns prevent common problems such as tight coupling, unclear dependencies, difficult testing, and rigid designs that resist change. By following these patterns consistently, the codebase becomes more predictable and easier to understand for new contributors.

**Why architectural patterns matter:**

- Establish clear boundaries between components
- Enable independent testing of each layer
- Support parallel development across teams
- Facilitate code reuse and extension
- Reduce coupling and increase cohesion
- Make the system easier to reason about

**In this document:**

- **Layered Architecture** - Three-layer separation (Presentation, Business Logic, Infrastructure)
- **Service Pattern** - Interface-based services with clear contracts
- **Builder Pattern** - Separation of definition from execution
- **Registry Pattern** - Centralized component management
- **Dependency Injection via Config** - Configuration-driven dependencies
- **Factory Pattern** - Encapsulate complex object creation logic
- **Strategy Pattern** - Encapsulate algorithms for runtime selection
- **Message Bus Pattern** - Decouple components via event-based communication

**Prerequisites:**

- Understanding of TypeScript interfaces and classes
- Familiarity with dependency injection concepts
- Experience with service-oriented architecture

---

## Pattern 1: Layered Architecture

### Intent

Organize code into distinct horizontal layers with clear dependencies flowing in one direction.

### Problem

Monolithic codebases without clear structure lead to tangled dependencies where UI code directly calls database code, business logic is scattered across multiple layers, and testing becomes impossible without spinning up the entire system. Changes in one area ripple unpredictably through the codebase.

### Solution

Structure the application into three distinct layers: Presentation (CLI/UI), Business Logic (Services), and Infrastructure (External Systems). Each layer depends only on the layer below it, never above. This creates clear boundaries and enables independent development and testing of each layer.

### Structure

```
┌─────────────────────────────────────┐
│   Presentation Layer (CLI/UI)       │  - User interaction
│   packages/*/src/commands/          │  - Input validation
│   packages/*/src/ui/                │  - Output formatting
└─────────────────────────────────────┘
              ↓ (depends on)
┌─────────────────────────────────────┐
│   Business Logic Layer (Services)   │  - Core workflows
│   packages/*/src/services/          │  - Business rules
│   packages/*/src/core/              │  - State management
└─────────────────────────────────────┘
              ↓ (depends on)
┌─────────────────────────────────────┐
│   Infrastructure Layer              │  - External APIs
│   packages/*/src/integrations/      │  - File system
│   packages/*/src/tools/             │  - Network
└─────────────────────────────────────┘
```

### Implementation

**Step 1: Define layer boundaries**

Create clear directory structure separating concerns:

```typescript
// packages/core/src/
// ├── commands/         # Presentation layer
// ├── services/         # Business logic layer
// ├── tools/            # Infrastructure layer
// └── integrations/     # Infrastructure layer
```

**Step 2: Establish dependency rules**

```typescript
// ✅ GOOD: Presentation depends on Business Logic
// packages/cli/src/commands/workflow.ts
import { WorkflowExecutor } from '../../services/workflow/workflowExecutor.js';

export class WorkflowCommand extends Command {
  async run() {
    const executor = new WorkflowExecutor(this.config);
    await executor.execute(workflow, taskId);
  }
}
```

**Step 3: Keep business logic framework-agnostic**

```typescript
// ✅ GOOD: Business logic has no CLI dependencies
// packages/core/src/services/workflow/workflowExecutor.ts
export class WorkflowExecutor {
  constructor(
    private config: Config,
    private eventEmitter: EventEmitter
  ) {}

  async execute(workflow: Workflow, taskId: string): Promise<WorkflowResult> {
    // Pure business logic - no CLI concerns
    this.eventEmitter.emit('workflow-started', { workflow, taskId });

    for (const phase of workflow.phases) {
      await this.executePhase(phase);
    }

    return { success: true };
  }
}
```

### Complete Example

```typescript
// packages/core/src/commands/workflow/index.ts (Presentation Layer)
import { Command, Flags } from '@oclif/core';
import { WorkflowExecutor } from '../../services/workflow/workflowExecutor.js';
import { loadConfig } from '../../config/index.js';
import type { Workflow } from '../../types/workflow.js';

export default class WorkflowCommand extends Command {
  static description = 'Execute a workflow';

  static flags = {
    task: Flags.string({ required: true, description: 'Task ID' }),
    ui: Flags.boolean({ description: 'Show interactive UI' }),
  };

  async run(): Promise<void> {
    const { flags, args } = await this.parse(WorkflowCommand);

    // Presentation layer: Handle CLI concerns
    const config = await loadConfig();
    const workflow = await this.loadWorkflow(args.name);

    // Delegate to business logic layer
    const executor = new WorkflowExecutor(config, this.createEventEmitter());
    const result = await executor.execute(workflow, flags.task);

    // Presentation layer: Format output
    if (result.success) {
      this.log('Workflow completed successfully');
    } else {
      this.error(result.error.message);
    }
  }

  private createEventEmitter(): EventEmitter {
    const emitter = new EventEmitter();
    emitter.on('workflow-started', () => this.log('Starting workflow...'));
    emitter.on('phase-completed', ({ phase }) => this.log(`Phase ${phase} complete`));
    return emitter;
  }

  private async loadWorkflow(name: string): Promise<Workflow> {
    // Load workflow YAML
    return {
      /* ... */
    };
  }
}

// packages/core/src/services/workflow/workflowExecutor.ts (Business Logic Layer)
import type { Workflow, WorkflowResult, Phase } from '../../types/workflow.js';
import type { Config } from '../../types/config.js';
import type { EventEmitter } from 'node:events';
import { CommandExecutor } from '../command/commandExecutor.js';

export class WorkflowExecutor {
  private commandExecutor: CommandExecutor;

  constructor(
    private config: Config,
    private eventEmitter: EventEmitter
  ) {
    this.commandExecutor = new CommandExecutor(config);
  }

  async execute(workflow: Workflow, taskId: string): Promise<WorkflowResult> {
    this.eventEmitter.emit('workflow-started', { workflow, taskId });

    try {
      const results = [];
      for (const phase of workflow.phases) {
        const result = await this.executePhase(phase, taskId);
        results.push(result);
        this.eventEmitter.emit('phase-completed', { phase, result });
      }

      return { success: true, results };
    } catch (error) {
      this.eventEmitter.emit('workflow-failed', { error });
      return { success: false, error };
    }
  }

  private async executePhase(phase: Phase, taskId: string): Promise<PhaseResult> {
    // Delegate to command executor (infrastructure layer)
    return this.commandExecutor.execute(phase.command, { taskId });
  }
}

// packages/core/src/services/command/commandExecutor.ts (Infrastructure Layer)
import type { Config } from '../../types/config.js';
import { ClaudeClient } from '../../integrations/claude/client.js';

export class CommandExecutor {
  private claudeClient: ClaudeClient;

  constructor(private config: Config) {
    this.claudeClient = new ClaudeClient(config.claude);
  }

  async execute(command: string, context: ExecutionContext): Promise<CommandResult> {
    // Infrastructure layer: Interact with external system
    const response = await this.claudeClient.execute(command, context);
    return { output: response.text, success: true };
  }
}
```

**Example explained:**

- Lines 1-35: Presentation layer handles CLI input/output, no business logic
- Lines 37-65: Business logic layer coordinates workflow execution, framework-agnostic
- Lines 67-80: Infrastructure layer interacts with external systems (Claude API)

### When to Use

**Use layered architecture when:**

- Building applications with multiple concerns (UI, business logic, persistence)
- Team needs to work on different parts independently
- System will have multiple interfaces (CLI, Web UI, API)
- Testing each layer independently is important

**Avoid this pattern when:**

- Building very small, single-purpose utilities
- All code is tightly coupled by nature (rare)
- Overhead of layers outweighs benefits (< 100 lines of code)

### Benefits

- **Independent Testing**: Each layer can be tested in isolation with mocks
- **Parallel Development**: Teams can work on different layers simultaneously
- **Clear Dependencies**: One-way dependency flow is easy to understand
- **Reusability**: Business logic can support multiple interfaces
- **Maintainability**: Changes in one layer rarely affect others

### Trade-offs

- **Initial Overhead**: Requires upfront design and structure
- **More Files**: Separation means more files to navigate
- **Boilerplate**: May need adapter code between layers

### Common Mistakes

**Mistake 1: Business logic in presentation layer**

❌ **Bad example:**

```typescript
// Command directly executes workflow logic
export default class WorkflowCommand extends Command {
  async run(): Promise<void> {
    const workflow = await loadWorkflow();

    // ❌ Business logic in presentation layer
    for (const phase of workflow.phases) {
      const response = await claudeClient.execute(phase.command);
      console.log(`Phase complete: ${response}`);
    }
  }
}
```

✅ **Correct approach:**

```typescript
// Command delegates to service
export default class WorkflowCommand extends Command {
  async run(): Promise<void> {
    const workflow = await loadWorkflow();
    const executor = new WorkflowExecutor(this.config);

    // ✅ Delegate to business logic layer
    const result = await executor.execute(workflow, taskId);
    this.log(result.message);
  }
}
```

**Why this matters**: Mixing business logic in the presentation layer makes testing impossible without mocking CLI framework, prevents reuse across different interfaces, and violates single responsibility.

**Mistake 2: Upper layers depending on lower layer details**

❌ **Bad example:**

```typescript
// Business logic depends on infrastructure details
export class WorkflowExecutor {
  async execute(workflow: Workflow): Promise<void> {
    // ❌ Direct dependency on HTTP client
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.CLAUDE_API_KEY },
    });
  }
}
```

✅ **Correct approach:**

```typescript
// Business logic depends on abstraction
export class WorkflowExecutor {
  constructor(private claudeClient: ClaudeClient) {}

  async execute(workflow: Workflow): Promise<void> {
    // ✅ Depends on interface, not implementation
    const response = await this.claudeClient.execute(workflow.prompt);
  }
}
```

**Why this matters**: Depending on implementation details creates tight coupling, makes testing difficult, and prevents swapping implementations.

### Testing Strategy

**What to Test:**

- Each layer independently with mocked dependencies
- Integration between layers with real implementations
- Data flow from presentation through business logic to infrastructure

**Test Organization:**

- `commands/workflow.test.ts` - Test CLI layer with mocked services
- `services/workflowExecutor.test.ts` - Test business logic with mocked infrastructure
- `integration/workflow-e2e.test.ts` - Test full stack with real dependencies

**Mock Strategy:**

- Mock lower layers when testing upper layers
- Use real implementations for integration tests
- Create interface-based mocks for easy substitution

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { WorkflowExecutor } from './workflowExecutor.js';
import type { Config } from '../../types/config.js';
import { EventEmitter } from 'node:events';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let mockConfig: Config;
  let eventEmitter: EventEmitter;
  let emittedEvents: any[];

  beforeEach(() => {
    // Arrange - Create mocks
    mockConfig = {
      claude: { apiKey: 'test-key' },
      targetDir: '/test/dir',
    } as Config;

    eventEmitter = new EventEmitter();
    emittedEvents = [];
    eventEmitter.on('workflow-started', (event) => emittedEvents.push(event));
    eventEmitter.on('phase-completed', (event) => emittedEvents.push(event));

    executor = new WorkflowExecutor(mockConfig, eventEmitter);
  });

  it('should execute workflow phases sequentially', async () => {
    // Arrange
    const workflow = {
      name: 'test-workflow',
      phases: [{ command: 'plan' }, { command: 'implement' }],
    };

    // Act
    const result = await executor.execute(workflow, 'AL-123');

    // Assert
    expect(result.success).to.be.true;
    expect(result.results).to.have.length(2);
    expect(emittedEvents).to.have.length(3); // start + 2 phase completes
  });

  it('should emit error event on failure', async () => {
    // Arrange
    const workflow = {
      name: 'failing-workflow',
      phases: [{ command: 'invalid-command' }],
    };

    let errorEvent: any;
    eventEmitter.on('workflow-failed', (event) => (errorEvent = event));

    // Act
    const result = await executor.execute(workflow, 'AL-123');

    // Assert
    expect(result.success).to.be.false;
    expect(errorEvent).to.exist;
    expect(errorEvent.error).to.be.instanceof(Error);
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+ for each layer
- Branch coverage: 70%+ for business logic
- Integration test coverage: All critical paths

### Related Patterns

- **[Service Pattern](#pattern-2-service-pattern-with-interfaces)** - Services implement business logic layer
- **[Dependency Injection](#pattern-5-dependency-injection-via-config)** - How layers receive dependencies

---

## Pattern 2: Service Pattern with Interfaces

### Intent

Encapsulate business logic in services with explicit interface contracts that enable testing and substitution.

### Problem

Business logic scattered across the codebase leads to duplication, inconsistency, and difficulty testing. Direct instantiation of concrete classes creates tight coupling and prevents mocking. Without clear contracts, it's unclear what methods a service should provide.

### Solution

Define explicit interfaces for services that declare the contract. Implement services as classes that conform to these interfaces. Inject services via constructor or factory, depending only on the interface, never the implementation. This enables easy mocking for tests and swapping implementations.

### Structure

```typescript
// Interface defines contract
interface FileSystemService {
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
}

// Implementation fulfills contract
class StandardFileSystemService implements FileSystemService {
  async readTextFile(filePath: string): Promise<string> {
    /* ... */
  }
  async writeTextFile(filePath: string, content: string): Promise<void> {
    /* ... */
  }
}

// Consumer depends on interface
class FileProcessor {
  constructor(private fs: FileSystemService) {}
}
```

### Implementation

**Step 1: Define service interface**

```typescript
// packages/core/src/services/fileSystemService.ts
export interface FileSystemService {
  /**
   * Read text content from a file
   * @param filePath - The path to the file to read
   * @returns The file content as a string
   */
  readTextFile(filePath: string): Promise<string>;

  /**
   * Write text content to a file
   * @param filePath - The path to the file to write
   * @param content - The content to write
   */
  writeTextFile(filePath: string, content: string): Promise<void>;

  /**
   * Find files matching a name within search paths
   * @param fileName - The name of the file to find
   * @param searchPaths - Directories to search within
   * @returns Array of absolute paths to found files
   */
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
```

**Step 2: Implement the interface**

```typescript
// packages/core/src/services/fileSystemService.ts
import fs from 'node:fs/promises';
import * as path from 'node:path';
import { globSync } from 'glob';

export class StandardFileSystemService implements FileSystemService {
  async readTextFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    return searchPaths.flatMap((searchPath) => {
      const pattern = path.posix.join(searchPath, '**', fileName);
      return globSync(pattern, {
        nodir: true,
        absolute: true,
      });
    });
  }
}
```

**Step 3: Create mock implementation for testing**

```typescript
// packages/test-utils/src/mocks/mockFileSystemService.ts
export class MockFileSystemService implements FileSystemService {
  private files = new Map<string, string>();

  async readTextFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (!content) {
      throw new Error(`File not found: ${filePath}`);
    }
    return content;
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    return Array.from(this.files.keys()).filter(
      (filePath) =>
        filePath.endsWith(fileName) &&
        searchPaths.some((searchPath) => filePath.startsWith(searchPath))
    );
  }

  // Test helper methods
  setFile(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  hasFile(filePath: string): boolean {
    return this.files.has(filePath);
  }

  clear(): void {
    this.files.clear();
  }
}
```

### Complete Example

```typescript
// packages/core/src/services/fileSystemService.ts
import fs from 'node:fs/promises';
import * as path from 'node:path';
import { globSync } from 'glob';

/**
 * Interface for file system operations
 */
export interface FileSystemService {
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}

/**
 * Standard file system implementation using Node.js fs module
 */
export class StandardFileSystemService implements FileSystemService {
  async readTextFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    return searchPaths.flatMap((searchPath) => {
      const pattern = path.posix.join(searchPath, '**', fileName);
      return globSync(pattern, {
        nodir: true,
        absolute: true,
      });
    });
  }
}

// Usage in another service
export class ConfigLoader {
  constructor(private fs: FileSystemService) {}

  async load(configPath: string): Promise<Config> {
    const content = await this.fs.readTextFile(configPath);
    return JSON.parse(content);
  }

  async save(configPath: string, config: Config): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await this.fs.writeTextFile(configPath, content);
  }
}

// Production usage
const fs = new StandardFileSystemService();
const loader = new ConfigLoader(fs);

// Test usage
const mockFs = new MockFileSystemService();
mockFs.setFile('/config.json', '{"version": "1.0"}');
const testLoader = new ConfigLoader(mockFs);
```

**Example explained:**

- Lines 1-14: Interface defines the contract with full documentation
- Lines 16-33: Standard implementation using real Node.js file system
- Lines 36-50: Consumer depends only on interface, enabling mock injection

### When to Use

**Use service pattern when:**

- Business logic needs to be reused across multiple components
- Testing requires mocking external dependencies
- Multiple implementations of the same behavior are needed
- Clear contracts between components are important

**Avoid this pattern when:**

- Writing one-off utility functions with no dependencies
- The service would have only a single method (use a function instead)
- The logic is so simple that an interface adds no value

### Benefits

- **Testability**: Easy to create mocks that implement the interface
- **Flexibility**: Can swap implementations without changing consumers
- **Clarity**: Interface documents the contract explicitly
- **Type Safety**: Compiler enforces interface compliance
- **Decoupling**: Consumers don't depend on implementation details

### Trade-offs

- **Verbosity**: Requires both interface and implementation
- **Indirection**: Extra layer between caller and implementation
- **Learning Curve**: Developers must understand interface-based design

### Common Mistakes

**Mistake 1: Exposing implementation details in interface**

❌ **Bad example:**

```typescript
interface FileSystemService {
  // ❌ Exposes implementation detail (globSync)
  getGlobInstance(): typeof globSync;

  // ❌ Returns internal state
  getFileCache(): Map<string, string>;
}
```

✅ **Correct approach:**

```typescript
interface FileSystemService {
  // ✅ Exposes only behavior, not implementation
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
```

**Why this matters**: Exposing implementation details defeats the purpose of the interface, creates tight coupling, and prevents substituting implementations.

**Mistake 2: Creating interface that matches only one implementation**

❌ **Bad example:**

```typescript
interface FileSystemService {
  // ❌ Node.js-specific types
  readFileSync(path: string): Buffer;
  createReadStream(path: string): NodeJS.ReadableStream;
}
```

✅ **Correct approach:**

```typescript
interface FileSystemService {
  // ✅ Platform-agnostic interface
  readTextFile(path: string): Promise<string>;
  readBinaryFile(path: string): Promise<Uint8Array>;
}
```

**Why this matters**: Interface should represent the contract, not implementation details. Good interfaces can have multiple implementations (real, mock, in-memory, cloud-based, etc.).

### Testing Strategy

**What to Test:**

- Service implementation logic with real dependencies where possible
- Consumer logic with mocked service dependencies
- Interface compliance for all implementations

**Test Organization:**

- `services/fileSystemService.test.ts` - Test real implementation
- `commands/config.test.ts` - Test consumers with mock service
- `test-utils/mocks/mockFileSystemService.test.ts` - Verify mock behaves correctly

**Mock Strategy:**

- Create mock implementations of interfaces for testing consumers
- Use real implementations for integration tests
- Add test helpers to mocks (setFile, clear, etc.)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { StandardFileSystemService } from './fileSystemService.js';
import { MockFileSystemService } from '../../test-utils/mocks/mockFileSystemService.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('StandardFileSystemService', () => {
  let service: StandardFileSystemService;
  let tempDir: string;

  beforeEach(async () => {
    // Arrange - Create temp directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-service-test-'));
    service = new StandardFileSystemService();
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readTextFile', () => {
    it('should read file contents', async () => {
      // Arrange
      const filePath = path.join(tempDir, 'test.txt');
      const expectedContent = 'Hello, World!';
      await fs.writeFile(filePath, expectedContent, 'utf-8');

      // Act
      const content = await service.readTextFile(filePath);

      // Assert
      expect(content).to.equal(expectedContent);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const filePath = path.join(tempDir, 'missing.txt');

      // Act & Assert
      await expect(service.readTextFile(filePath)).to.be.rejected;
    });
  });

  describe('writeTextFile', () => {
    it('should write content to file', async () => {
      // Arrange
      const filePath = path.join(tempDir, 'output.txt');
      const content = 'Test content';

      // Act
      await service.writeTextFile(filePath, content);

      // Assert
      const actual = await fs.readFile(filePath, 'utf-8');
      expect(actual).to.equal(content);
    });
  });
});

describe('MockFileSystemService', () => {
  let mockService: MockFileSystemService;

  beforeEach(() => {
    mockService = new MockFileSystemService();
  });

  it('should read previously set files', async () => {
    // Arrange
    mockService.setFile('/test.txt', 'mock content');

    // Act
    const content = await mockService.readTextFile('/test.txt');

    // Assert
    expect(content).to.equal('mock content');
  });

  it('should track written files', async () => {
    // Arrange & Act
    await mockService.writeTextFile('/new.txt', 'written content');

    // Assert
    expect(mockService.hasFile('/new.txt')).to.be.true;
    const content = await mockService.readTextFile('/new.txt');
    expect(content).to.equal('written content');
  });
});
```

**Coverage Goals:**

- Interface implementations: 90%+ line coverage
- Mock implementations: 80%+ line coverage
- Consumer tests using mocks: 80%+ branch coverage

### Related Patterns

- **[Layered Architecture](#pattern-1-layered-architecture)** - Services implement business logic layer
- **[Dependency Injection](#pattern-5-dependency-injection-via-config)** - How services receive their dependencies
- **[Testing Patterns](./05-testing-patterns.md)** - How to test with mocked services

---

## Pattern 3: Builder Pattern

### Intent

Separate the construction of complex objects from their execution logic.

### Problem

Complex objects like tools often have both definition (schema, parameters) and execution (runtime behavior). Mixing these concerns makes objects difficult to test, reuse, and compose. Validation logic becomes entangled with execution logic, and creating variations of the same tool requires duplicating code.

### Solution

Split object creation into two phases: a Builder that defines the object and validates parameters, and an Invocation that executes the actual logic. The builder creates immutable invocation objects that contain validated parameters and execute independently.

### Structure

```typescript
// Builder defines and validates
class ToolBuilder {
  getDefinition(): FunctionDeclaration {
    /* schema */
  }
  build(params: Params): ToolInvocation {
    /* create invocation */
  }
}

// Invocation executes
class ToolInvocation {
  constructor(private params: Params) {}
  async execute(): Promise<Result> {
    /* execution logic */
  }
}
```

### Implementation

**Step 1: Define the builder class**

```typescript
// packages/core/src/tools/ls.ts
import type { FunctionDeclaration } from '@google/genai';
import { BaseDeclarativeTool } from './tools.js';

export class LSTool extends BaseDeclarativeTool<LSToolParams, ToolResult> {
  constructor(private readonly config: Config) {
    super(
      'ls',
      'ls',
      'List files and directories',
      Kind.FileSystem,
      {
        /* parameter schema */
      },
      false, // isOutputMarkdown
      false // canUpdateOutput
    );
  }

  // Builder method: Create invocation from parameters
  protected createInvocation(
    params: LSToolParams,
    messageBus?: MessageBus
  ): ToolInvocation<LSToolParams, ToolResult> {
    // Validation happens here
    this.validateParams(params);

    // Return invocation object
    return new LSToolInvocation(this.config, params, messageBus);
  }

  // Schema definition (separate from execution)
  getDefinition(): FunctionDeclaration {
    return {
      name: 'ls',
      description: 'List contents of a directory',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          dir_path: {
            type: 'string',
            description: 'Absolute path to directory',
          },
        },
        required: ['dir_path'],
      },
    };
  }
}
```

**Step 2: Define the invocation class**

```typescript
// packages/core/src/tools/ls.ts (continued)
import fs from 'node:fs/promises';
import path from 'node:path';

class LSToolInvocation extends BaseToolInvocation<LSToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    params: LSToolParams,
    messageBus?: MessageBus
  ) {
    super(params, messageBus, 'ls', 'ls');
  }

  // Invocation method: Execute with validated parameters
  async execute(signal: AbortSignal): Promise<ToolResult> {
    try {
      const entries = await fs.readdir(this.params.dir_path, {
        withFileTypes: true,
      });

      const formatted = entries
        .map((entry) => `[${entry.isDirectory() ? 'DIR' : 'FILE'}] ${entry.name}`)
        .join('\n');

      return {
        llmContent: formatted,
        returnDisplay: `Listed ${entries.length} entries`,
      };
    } catch (error) {
      return {
        llmContent: 'Error reading directory',
        returnDisplay: `Failed: ${error.message}`,
        error: {
          message: error.message,
          type: ToolErrorType.FILE_READ_ERROR,
        },
      };
    }
  }

  getDescription(): string {
    return `Listing ${this.params.dir_path}`;
  }
}
```

**Step 3: Use the builder**

```typescript
// Create builder
const lsTool = new LSTool(config);

// Build invocation from parameters
const invocation = lsTool.build({ dir_path: '/home/user/project' });

// Execute invocation
const result = await invocation.execute(abortSignal);
console.log(result.llmContent);
```

### Complete Example

```typescript
// Complete builder pattern implementation
// packages/core/src/tools/readFile.ts
import type { Config } from '../config/config.js';
import type { MessageBus } from '../confirmation-bus/message-bus.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import type { ToolResult } from './tools.js';
import { ToolErrorType } from './tool-error.js';
import fs from 'node:fs/promises';

export interface ReadFileToolParams {
  file_path: string;
}

// Builder class
export class ReadFileTool extends BaseDeclarativeTool<ReadFileToolParams, ToolResult> {
  constructor(private readonly config: Config) {
    super(
      'read_file',
      'read_file',
      'Read contents of a text file',
      Kind.FileSystem,
      {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to the file',
          },
        },
        required: ['file_path'],
      },
      false,
      false
    );
  }

  protected createInvocation(
    params: ReadFileToolParams,
    messageBus?: MessageBus
  ): ToolInvocation<ReadFileToolParams, ToolResult> {
    return new ReadFileToolInvocation(this.config, params, messageBus);
  }
}

// Invocation class
class ReadFileToolInvocation extends BaseToolInvocation<ReadFileToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    params: ReadFileToolParams,
    messageBus?: MessageBus
  ) {
    super(params, messageBus, 'read_file', 'read_file');
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    try {
      const content = await fs.readFile(this.params.file_path, 'utf-8');

      return {
        llmContent: content,
        returnDisplay: `Read file: ${this.params.file_path}`,
      };
    } catch (error) {
      return {
        llmContent: 'Error reading file',
        returnDisplay: `Failed to read: ${this.params.file_path}`,
        error: {
          message: error.message,
          type: ToolErrorType.FILE_READ_ERROR,
        },
      };
    }
  }

  getDescription(): string {
    return `Reading ${this.params.file_path}`;
  }
}

// Usage example
async function main() {
  const config = await loadConfig();

  // Create builder
  const readFileTool = new ReadFileTool(config);

  // Build invocation
  const invocation = readFileTool.createInvocation({
    file_path: '/path/to/file.txt',
  });

  // Execute
  const result = await invocation.execute(new AbortController().signal);

  if (result.error) {
    console.error('Error:', result.error.message);
  } else {
    console.log('Content:', result.llmContent);
  }
}
```

**Example explained:**

- Lines 1-39: Builder class defines schema and creates invocations
- Lines 41-78: Invocation class contains execution logic
- Lines 80-97: Usage shows separation of concerns

### When to Use

**Use builder pattern when:**

- Objects require both definition (schema) and execution logic
- Parameter validation should happen before execution
- Multiple variations of the same execution logic exist
- Need to separate what an object does (schema) from how it does it (execution)

**Avoid this pattern when:**

- Objects are simple with no validation requirements
- Definition and execution are trivial (< 10 lines combined)
- No need for parameter validation or multiple invocations

### Benefits

- **Separation of Concerns**: Definition separate from execution
- **Reusability**: Same builder can create multiple invocations
- **Testability**: Can test validation and execution independently
- **Immutability**: Invocations are immutable once created
- **Type Safety**: Parameters validated at build time

### Trade-offs

- **Complexity**: Requires two classes instead of one
- **Indirection**: Extra step to create invocation before execution
- **Boilerplate**: More code for simple cases

### Common Mistakes

**Mistake 1: Mixing validation and execution**

❌ **Bad example:**

```typescript
class ReadFileTool {
  async execute(params: ReadFileParams): Promise<ToolResult> {
    // ❌ Validation mixed with execution
    if (!params.file_path) {
      throw new Error('file_path is required');
    }
    if (!path.isAbsolute(params.file_path)) {
      throw new Error('file_path must be absolute');
    }

    // Execution logic
    const content = await fs.readFile(params.file_path, 'utf-8');
    return { content };
  }
}
```

✅ **Correct approach:**

```typescript
class ReadFileTool {
  build(params: ReadFileParams): ReadFileInvocation {
    // ✅ Validation at build time
    if (!params.file_path) {
      throw new Error('file_path is required');
    }
    if (!path.isAbsolute(params.file_path)) {
      throw new Error('file_path must be absolute');
    }

    return new ReadFileInvocation(params);
  }
}

class ReadFileInvocation {
  async execute(): Promise<ToolResult> {
    // ✅ Execution with validated parameters
    const content = await fs.readFile(this.params.file_path, 'utf-8');
    return { content };
  }
}
```

**Why this matters**: Separating validation from execution makes both easier to test, prevents re-validation on every execution, and makes the execution code cleaner.

**Mistake 2: Mutable invocations**

❌ **Bad example:**

```typescript
class ToolInvocation {
  public params: ToolParams; // ❌ Mutable

  async execute(): Promise<ToolResult> {
    // Parameters could be modified during execution
    this.params.file_path = '/different/path';
  }
}
```

✅ **Correct approach:**

```typescript
class ToolInvocation {
  constructor(private readonly params: ToolParams) {} // ✅ Immutable

  async execute(): Promise<ToolResult> {
    // Parameters cannot be modified
    const content = await fs.readFile(this.params.file_path, 'utf-8');
  }
}
```

**Why this matters**: Immutable invocations prevent accidental modification, make behavior predictable, and enable safe concurrent execution of the same invocation.

### Testing Strategy

**What to Test:**

- Builder parameter validation
- Invocation execution logic
- Error handling in both builder and invocation
- Schema definition correctness

**Test Organization:**

- `tools/readFile.test.ts` - Tests for both builder and invocation
- Separate describe blocks for builder vs invocation tests
- Integration tests that use both together

**Mock Strategy:**

- Mock Config object for builder tests
- Mock file system for invocation tests
- Use real builder with mocked invocation for consumer tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { ReadFileTool, ReadFileToolParams } from './readFile.js';
import type { Config } from '../config/config.js';
import { MockFileSystemService } from '../../test-utils/mocks/mockFileSystemService.js';

describe('ReadFileTool', () => {
  let readFileTool: ReadFileTool;
  let mockConfig: Config;

  beforeEach(() => {
    // Arrange - Create mock config
    mockConfig = {
      getFileSystemService: () => new MockFileSystemService(),
      getTargetDir: () => '/test/dir',
    } as Config;

    readFileTool = new ReadFileTool(mockConfig);
  });

  describe('Builder', () => {
    it('should create invocation with valid parameters', () => {
      // Arrange
      const params: ReadFileToolParams = {
        file_path: '/absolute/path/file.txt',
      };

      // Act
      const invocation = readFileTool.createInvocation(params);

      // Assert
      expect(invocation).to.exist;
      expect(invocation.getDescription()).to.include('file.txt');
    });

    it('should reject relative paths', () => {
      // Arrange
      const params: ReadFileToolParams = {
        file_path: 'relative/path.txt',
      };

      // Act & Assert
      expect(() => readFileTool.createInvocation(params)).to.throw('file_path must be absolute');
    });

    it('should reject empty path', () => {
      // Arrange
      const params: ReadFileToolParams = {
        file_path: '',
      };

      // Act & Assert
      expect(() => readFileTool.createInvocation(params)).to.throw('file_path is required');
    });
  });

  describe('Invocation', () => {
    it('should read file contents successfully', async () => {
      // Arrange
      const mockFs = new MockFileSystemService();
      mockFs.setFile('/test/file.txt', 'Hello, World!');

      const params: ReadFileToolParams = {
        file_path: '/test/file.txt',
      };

      const invocation = readFileTool.createInvocation(params);

      // Act
      const result = await invocation.execute(new AbortController().signal);

      // Assert
      expect(result.error).to.be.undefined;
      expect(result.llmContent).to.equal('Hello, World!');
      expect(result.returnDisplay).to.include('file.txt');
    });

    it('should handle file not found error', async () => {
      // Arrange
      const params: ReadFileToolParams = {
        file_path: '/nonexistent/file.txt',
      };

      const invocation = readFileTool.createInvocation(params);

      // Act
      const result = await invocation.execute(new AbortController().signal);

      // Assert
      expect(result.error).to.exist;
      expect(result.error.type).to.equal(ToolErrorType.FILE_READ_ERROR);
      expect(result.error.message).to.include('not found');
    });
  });
});
```

**Coverage Goals:**

- Builder logic: 90%+ line coverage (including validation paths)
- Invocation logic: 85%+ line coverage (including error paths)
- Integration tests: All common usage patterns

### Related Patterns

- **[Registry Pattern](#pattern-4-registry-pattern)** - Builders are registered in registry
- **[Service Pattern](#pattern-2-service-pattern-with-interfaces)** - Builders may use services
- **[Testing Patterns](./05-testing-patterns.md#mocking-builders)** - How to test builders and invocations

---

## Pattern 4: Registry Pattern

### Intent

Centralize management of pluggable components (tools, providers, commands) in a type-safe, extensible registry.

### Problem

When building extensible systems, components need to be discovered, registered, and retrieved dynamically. Hard-coding component lists leads to tight coupling and makes extension difficult. Without a central registry, duplicate registrations go undetected and component lookup becomes inconsistent across the codebase.

### Solution

Create a registry class that manages a collection of components using a Map. Provide methods to register, retrieve, check existence, and list components. Implement type-safe accessors and optional sorting/filtering. The registry becomes the single source of truth for available components.

### Structure

```typescript
export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(name: string, tool: Tool): void {
    /* add to map */
  }
  get(name: string): Tool | undefined {
    /* retrieve from map */
  }
  has(name: string): boolean {
    /* check existence */
  }
  getAll(): Tool[] {
    /* return all values */
  }
  unregister(name: string): boolean {
    /* remove from map */
  }
}
```

### Implementation

**Step 1: Define the registry class**

```typescript
// packages/core/src/tools/tool-registry.ts
import type { AnyDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';
import type { FunctionDeclaration } from '@google/genai';

export class ToolRegistry {
  // Map keyed by tool name as seen by the LLM
  private allKnownTools: Map<string, AnyDeclarativeTool> = new Map();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Register a tool definition
   * @param tool - The tool object containing schema and execution logic
   */
  registerTool(tool: AnyDeclarativeTool): void {
    if (this.allKnownTools.has(tool.name)) {
      console.warn(`Tool with name "${tool.name}" is already registered. Overwriting.`);
    }
    this.allKnownTools.set(tool.name, tool);
  }

  /**
   * Get a specific tool by name
   * @param name - The tool name
   * @returns The tool or undefined if not found
   */
  getTool(name: string): AnyDeclarativeTool | undefined {
    return this.allKnownTools.get(name);
  }

  /**
   * Check if a tool is registered
   * @param name - The tool name
   * @returns true if tool exists
   */
  has(name: string): boolean {
    return this.allKnownTools.has(name);
  }

  /**
   * Remove a tool from the registry
   * @param name - The tool name
   * @returns true if tool was removed
   */
  unregister(name: string): boolean {
    return this.allKnownTools.delete(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all tools
   */
  getAllTools(): AnyDeclarativeTool[] {
    return Array.from(this.allKnownTools.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  /**
   * Get tool names
   * @returns Array of tool names
   */
  getAllToolNames(): string[] {
    return Array.from(this.allKnownTools.keys());
  }

  /**
   * Get function declarations for all tools (for API)
   * @returns Array of function declarations
   */
  getFunctionDeclarations(): FunctionDeclaration[] {
    const declarations: FunctionDeclaration[] = [];
    for (const tool of this.allKnownTools.values()) {
      declarations.push(tool.schema);
    }
    return declarations;
  }
}
```

**Step 2: Register components**

```typescript
// packages/core/src/config/registerTools.ts
import { ToolRegistry } from '../tools/tool-registry.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { WriteFileTool } from '../tools/write-file.js';
import { GrepTool } from '../tools/grep.js';
import { BashTool } from '../tools/bash.js';
import type { Config } from './config.js';

export function registerBuiltInTools(registry: ToolRegistry, config: Config): void {
  // Register all built-in tools
  registry.registerTool(new LSTool(config));
  registry.registerTool(new ReadFileTool(config));
  registry.registerTool(new WriteFileTool(config));
  registry.registerTool(new GrepTool(config));
  registry.registerTool(new BashTool(config));
}
```

**Step 3: Use the registry**

```typescript
// Initialization
const config = await loadConfig();
const registry = new ToolRegistry(config);
registerBuiltInTools(registry, config);

// Retrieve tools
const lsTool = registry.getTool('ls');
if (lsTool) {
  const invocation = lsTool.build({ dir_path: '/home/user' });
  const result = await invocation.execute(signal);
}

// List all tools
const allTools = registry.getAllTools();
console.log('Available tools:', allTools.map((t) => t.name).join(', '));

// Get function declarations for API
const declarations = registry.getFunctionDeclarations();
await apiClient.send({ tools: declarations });
```

### Complete Example

```typescript
// packages/core/src/tools/tool-registry.ts
import type { AnyDeclarativeTool, ToolResult } from './tools.js';
import type { Config } from '../config/config.js';
import type { FunctionDeclaration } from '@google/genai';

/**
 * Central registry for managing tool definitions
 */
export class ToolRegistry {
  private allKnownTools: Map<string, AnyDeclarativeTool> = new Map();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Register a tool. Warns if overwriting existing tool.
   */
  registerTool(tool: AnyDeclarativeTool): void {
    if (this.allKnownTools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered. Overwriting.`);
    }
    this.allKnownTools.set(tool.name, tool);
  }

  /**
   * Retrieve a specific tool by name
   */
  getTool(name: string): AnyDeclarativeTool | undefined {
    return this.allKnownTools.get(name);
  }

  /**
   * Check if tool exists
   */
  has(name: string): boolean {
    return this.allKnownTools.has(name);
  }

  /**
   * Remove tool from registry
   */
  unregister(name: string): boolean {
    return this.allKnownTools.delete(name);
  }

  /**
   * Get all registered tools sorted by display name
   */
  getAllTools(): AnyDeclarativeTool[] {
    return Array.from(this.allKnownTools.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
  }

  /**
   * Get all tool names
   */
  getAllToolNames(): string[] {
    return Array.from(this.allKnownTools.keys());
  }

  /**
   * Get function declarations for API calls
   */
  getFunctionDeclarations(): FunctionDeclaration[] {
    return Array.from(this.allKnownTools.values()).map((tool) => tool.schema);
  }

  /**
   * Get filtered function declarations by tool names
   */
  getFunctionDeclarationsFiltered(toolNames: string[]): FunctionDeclaration[] {
    const declarations: FunctionDeclaration[] = [];
    for (const name of toolNames) {
      const tool = this.allKnownTools.get(name);
      if (tool) {
        declarations.push(tool.schema);
      }
    }
    return declarations;
  }

  /**
   * Sort tools by priority (built-in, discovered, MCP)
   */
  sortTools(): void {
    const entries = Array.from(this.allKnownTools.entries());
    entries.sort((a, b) => {
      const priorityA = this.getPriority(a[1]);
      const priorityB = this.getPriority(b[1]);
      return priorityA - priorityB;
    });
    this.allKnownTools = new Map(entries);
  }

  private getPriority(tool: AnyDeclarativeTool): number {
    // Built-in tools: priority 0
    // Discovered tools: priority 1
    // MCP tools: priority 2
    return 0; // Simplified
  }
}

// Usage example
async function initializeTools(config: Config): Promise<ToolRegistry> {
  const registry = new ToolRegistry(config);

  // Register built-in tools
  registry.registerTool(new LSTool(config));
  registry.registerTool(new ReadFileTool(config));
  registry.registerTool(new WriteFileTool(config));
  registry.registerTool(new GrepTool(config));

  // Optionally discover tools from config
  const discoveredTools = await discoverProjectTools(config);
  for (const tool of discoveredTools) {
    registry.registerTool(tool);
  }

  // Sort by priority
  registry.sortTools();

  return registry;
}

// Consumer example
async function executeToolByName(
  registry: ToolRegistry,
  toolName: string,
  params: unknown
): Promise<ToolResult> {
  const tool = registry.getTool(toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  const invocation = tool.build(params);
  return invocation.execute(new AbortController().signal);
}
```

**Example explained:**

- Lines 1-85: Complete registry implementation with all core methods
- Lines 87-106: Initialization showing registration of multiple tools
- Lines 108-121: Consumer example showing safe tool retrieval and execution

### When to Use

**Use registry pattern when:**

- System has pluggable components that can be added/removed
- Components need to be discovered at runtime
- Multiple parts of the system need to access the same components
- Want to prevent duplicate registrations
- Need centralized component lifecycle management

**Avoid this pattern when:**

- Component set is fixed and known at compile time
- Only one or two components need management
- No need for dynamic registration or discovery

### Benefits

- **Single Source of Truth**: One place to find all registered components
- **Type Safety**: Map ensures type-safe storage and retrieval
- **Extensibility**: Easy to add new components without changing consumers
- **Discoverability**: Can list all available components programmatically
- **Lifecycle Management**: Central place to add/remove components

### Trade-offs

- **Global State**: Registry is typically a singleton or passed around
- **Runtime Discovery**: Components must be registered before use
- **Indirection**: Extra layer between consumer and component

### Common Mistakes

**Mistake 1: Not handling registration conflicts**

❌ **Bad example:**

```typescript
class ToolRegistry {
  registerTool(tool: Tool): void {
    // ❌ Silently overwrites existing tool
    this.tools.set(tool.name, tool);
  }
}
```

✅ **Correct approach:**

```typescript
class ToolRegistry {
  registerTool(tool: Tool): void {
    // ✅ Warn about conflicts
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }
}
```

**Why this matters**: Silent overwrites hide bugs. Explicit warnings help developers catch naming conflicts and understand what's happening.

**Mistake 2: Exposing internal map directly**

❌ **Bad example:**

```typescript
class ToolRegistry {
  getTools(): Map<string, Tool> {
    // ❌ Exposes internal state for mutation
    return this.tools;
  }
}
```

✅ **Correct approach:**

```typescript
class ToolRegistry {
  getAllTools(): Tool[] {
    // ✅ Returns copy, prevents external mutation
    return Array.from(this.tools.values());
  }

  getTool(name: string): Tool | undefined {
    // ✅ Controlled access
    return this.tools.get(name);
  }
}
```

**Why this matters**: Exposing the internal map allows external code to modify registry state, bypassing validation and breaking encapsulation.

### Testing Strategy

**What to Test:**

- Registration of tools (first time and duplicates)
- Retrieval of existing and non-existent tools
- Listing all tools
- Unregistration
- Filtering and sorting if implemented

**Test Organization:**

- `tools/tool-registry.test.ts` - All registry tests
- Separate describe blocks for each major operation
- Use mock tools for testing

**Mock Strategy:**

- Create simple mock tools with name and schema
- Don't need full tool implementation for registry tests
- Test with various tool types (built-in, discovered, MCP)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { ToolRegistry } from './tool-registry.js';
import type { AnyDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';

// Simple mock tool for testing
class MockTool implements AnyDeclarativeTool {
  constructor(
    public name: string,
    public displayName: string = name
  ) {}

  get schema() {
    return {
      name: this.name,
      description: 'Mock tool',
      parametersJsonSchema: {},
    };
  }

  build(params: unknown): any {
    return { execute: async () => ({ llmContent: 'mock' }) };
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockConfig: Config;

  beforeEach(() => {
    mockConfig = {} as Config;
    registry = new ToolRegistry(mockConfig);
  });

  describe('registerTool', () => {
    it('should register a new tool', () => {
      // Arrange
      const tool = new MockTool('test_tool');

      // Act
      registry.registerTool(tool);

      // Assert
      expect(registry.has('test_tool')).to.be.true;
      expect(registry.getTool('test_tool')).to.equal(tool);
    });

    it('should overwrite duplicate registration with warning', () => {
      // Arrange
      const tool1 = new MockTool('duplicate');
      const tool2 = new MockTool('duplicate');
      registry.registerTool(tool1);

      // Act
      registry.registerTool(tool2);

      // Assert
      expect(registry.getTool('duplicate')).to.equal(tool2);
    });
  });

  describe('getTool', () => {
    it('should return registered tool', () => {
      // Arrange
      const tool = new MockTool('existing_tool');
      registry.registerTool(tool);

      // Act
      const retrieved = registry.getTool('existing_tool');

      // Assert
      expect(retrieved).to.equal(tool);
    });

    it('should return undefined for non-existent tool', () => {
      // Act
      const retrieved = registry.getTool('non_existent');

      // Assert
      expect(retrieved).to.be.undefined;
    });
  });

  describe('unregister', () => {
    it('should remove registered tool', () => {
      // Arrange
      const tool = new MockTool('removable');
      registry.registerTool(tool);
      expect(registry.has('removable')).to.be.true;

      // Act
      const removed = registry.unregister('removable');

      // Assert
      expect(removed).to.be.true;
      expect(registry.has('removable')).to.be.false;
    });

    it('should return false for non-existent tool', () => {
      // Act
      const removed = registry.unregister('non_existent');

      // Assert
      expect(removed).to.be.false;
    });
  });

  describe('getAllTools', () => {
    it('should return all registered tools sorted', () => {
      // Arrange
      const toolC = new MockTool('c_tool', 'C Tool');
      const toolA = new MockTool('a_tool', 'A Tool');
      const toolB = new MockTool('b_tool', 'B Tool');

      registry.registerTool(toolC);
      registry.registerTool(toolA);
      registry.registerTool(toolB);

      // Act
      const allTools = registry.getAllTools();

      // Assert
      expect(allTools).to.have.length(3);
      expect(allTools[0]).to.equal(toolA);
      expect(allTools[1]).to.equal(toolB);
      expect(allTools[2]).to.equal(toolC);
    });

    it('should return empty array when no tools registered', () => {
      // Act
      const allTools = registry.getAllTools();

      // Assert
      expect(allTools).to.be.an('array').that.is.empty;
    });
  });

  describe('getFunctionDeclarations', () => {
    it('should return schemas for all tools', () => {
      // Arrange
      registry.registerTool(new MockTool('tool1'));
      registry.registerTool(new MockTool('tool2'));

      // Act
      const declarations = registry.getFunctionDeclarations();

      // Assert
      expect(declarations).to.have.length(2);
      expect(declarations[0].name).to.equal('tool1');
      expect(declarations[1].name).to.equal('tool2');
    });
  });
});
```

**Coverage Goals:**

- Registry methods: 95%+ line coverage
- Edge cases (duplicates, non-existent items): 100%
- All public methods tested

### Related Patterns

- **[Builder Pattern](#pattern-3-builder-pattern)** - Builders are registered in registry
- **[Dependency Injection](#pattern-5-dependency-injection-via-config)** - Registry accessed via config
- **[Service Pattern](#pattern-2-service-pattern-with-interfaces)** - Similar component management

---

## Pattern 5: Dependency Injection via Config

### Intent

Manage all dependencies through a central Config object that provides lazy, on-demand access to services and configuration values.

### Problem

Hard-coded dependencies make code inflexible, difficult to test, and resistant to configuration changes. Constructor injection with many parameters becomes unwieldy. Different environments (production, test, dev) require different service implementations, but swapping them is difficult when dependencies are instantiated directly.

### Solution

Create a Config interface with getter methods for all dependencies. Implement the config once for production with real services, and create test configs with mocks. Services receive the config and pull dependencies as needed. This enables late binding, optional dependencies, and environment-specific configurations.

### Structure

```typescript
// Config interface defines all dependencies
export interface Config {
  getTargetDir(): string;
  getFileSystemService(): FileSystemService;
  getToolRegistry(): ToolRegistry;
  isExperimentEnabled(name: string): boolean;
}

// Services receive config and pull dependencies
class MyService {
  constructor(private config: Config) {}

  async doWork(): Promise<void> {
    const fs = this.config.getFileSystemService();
    await fs.readTextFile('/path/to/file');
  }
}
```

### Implementation

**Step 1: Define config interface**

```typescript
// packages/core/src/config/config.ts
import type { FileSystemService } from '../services/fileSystemService.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { ContentGenerator } from '../core/contentGenerator.js';

/**
 * Central configuration interface providing access to all services
 * and configuration values.
 */
export interface Config {
  // Directory paths
  getTargetDir(): string;
  getConfigDir(): string;

  // Services
  getFileSystemService(): FileSystemService;
  getWorkspaceContext(): WorkspaceContext;
  getContentGenerator(): ContentGenerator;
  getToolRegistry(): ToolRegistry;

  // Configuration values
  getModel(): string;
  getTokenLimit(): number;
  getApprovalMode(): ApprovalMode;

  // Feature flags
  isExperimentEnabled(name: string): boolean;
}
```

**Step 2: Implement production config**

```typescript
// packages/core/src/config/configImpl.ts
import type { Config } from './config.js';
import { StandardFileSystemService } from '../services/fileSystemService.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import type { Settings } from './settings.js';

export class ConfigImpl implements Config {
  private fileSystemService?: FileSystemService;
  private toolRegistry?: ToolRegistry;

  constructor(
    private settings: Settings,
    private targetDir: string
  ) {}

  getTargetDir(): string {
    return this.targetDir;
  }

  getConfigDir(): string {
    return path.join(this.targetDir, '.gemini');
  }

  // Lazy initialization
  getFileSystemService(): FileSystemService {
    if (!this.fileSystemService) {
      this.fileSystemService = new StandardFileSystemService();
    }
    return this.fileSystemService;
  }

  // Lazy initialization with dependencies
  getToolRegistry(): ToolRegistry {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry(this);
      registerBuiltInTools(this.toolRegistry, this);
    }
    return this.toolRegistry;
  }

  getModel(): string {
    return this.settings.model || 'gemini-2.0-flash-exp';
  }

  getTokenLimit(): number {
    return this.settings.tokenLimit || 1000000;
  }

  getApprovalMode(): ApprovalMode {
    return this.settings.approvalMode || 'default';
  }

  isExperimentEnabled(name: string): boolean {
    return this.settings.experiments?.[name] ?? false;
  }
}
```

**Step 3: Create test config**

```typescript
// packages/test-utils/src/mocks/mockConfig.ts
import type { Config } from '@packages/core/config/config.js';
import { MockFileSystemService } from './mockFileSystemService.js';
import { ToolRegistry } from '@packages/core/tools/tool-registry.js';

export class MockConfig implements Config {
  private mockFs = new MockFileSystemService();
  private mockRegistry = new ToolRegistry(this);

  constructor(private overrides: Partial<Config> = {}) {}

  getTargetDir(): string {
    return this.overrides.getTargetDir?.() ?? '/mock/target';
  }

  getConfigDir(): string {
    return this.overrides.getConfigDir?.() ?? '/mock/config';
  }

  getFileSystemService(): FileSystemService {
    return this.overrides.getFileSystemService?.() ?? this.mockFs;
  }

  getToolRegistry(): ToolRegistry {
    return this.overrides.getToolRegistry?.() ?? this.mockRegistry;
  }

  getModel(): string {
    return this.overrides.getModel?.() ?? 'mock-model';
  }

  getTokenLimit(): number {
    return this.overrides.getTokenLimit?.() ?? 100000;
  }

  getApprovalMode(): ApprovalMode {
    return this.overrides.getApprovalMode?.() ?? 'yolo';
  }

  isExperimentEnabled(name: string): boolean {
    return this.overrides.isExperimentEnabled?.(name) ?? true;
  }

  // Test helpers
  getMockFileSystem(): MockFileSystemService {
    return this.mockFs;
  }
}
```

**Step 4: Use config in services**

```typescript
// packages/core/src/tools/readFile.ts
import type { Config } from '../config/config.js';

export class ReadFileTool {
  constructor(private config: Config) {}

  async execute(params: ReadFileParams): Promise<ToolResult> {
    // Pull dependency from config as needed
    const fs = this.config.getFileSystemService();
    const content = await fs.readTextFile(params.file_path);

    return {
      llmContent: content,
      returnDisplay: `Read ${params.file_path}`,
    };
  }
}
```

### Complete Example

```typescript
// Complete dependency injection example

// 1. Define config interface
// packages/core/src/config/config.ts
export interface Config {
  getTargetDir(): string;
  getFileSystemService(): FileSystemService;
  getToolRegistry(): ToolRegistry;
  getModel(): string;
  isExperimentEnabled(name: string): boolean;
}

// 2. Production implementation
// packages/core/src/config/configImpl.ts
export class ConfigImpl implements Config {
  private fileSystemService?: FileSystemService;
  private toolRegistry?: ToolRegistry;

  constructor(private settings: Settings) {}

  getTargetDir(): string {
    return this.settings.targetDir || process.cwd();
  }

  getFileSystemService(): FileSystemService {
    if (!this.fileSystemService) {
      this.fileSystemService = new StandardFileSystemService();
    }
    return this.fileSystemService;
  }

  getToolRegistry(): ToolRegistry {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry(this);
    }
    return this.toolRegistry;
  }

  getModel(): string {
    return this.settings.model || 'gemini-2.0-flash-exp';
  }

  isExperimentEnabled(name: string): boolean {
    return this.settings.experiments?.[name] ?? false;
  }
}

// 3. Services use config
// packages/core/src/services/configLoader.ts
export class ConfigLoader {
  constructor(private config: Config) {}

  async loadWorkflowConfig(): Promise<WorkflowConfig> {
    const fs = this.config.getFileSystemService();
    const targetDir = this.config.getTargetDir();
    const configPath = path.join(targetDir, '.ai', 'config.json');

    const content = await fs.readTextFile(configPath);
    return JSON.parse(content);
  }
}

// 4. Tool implementation
// packages/core/src/tools/readFile.ts
export class ReadFileTool {
  constructor(private config: Config) {}

  build(params: ReadFileParams): ReadFileInvocation {
    return new ReadFileInvocation(this.config, params);
  }
}

class ReadFileInvocation {
  constructor(
    private config: Config,
    private params: ReadFileParams
  ) {}

  async execute(): Promise<ToolResult> {
    const fs = this.config.getFileSystemService();
    const content = await fs.readTextFile(this.params.file_path);

    return {
      llmContent: content,
      returnDisplay: `Read ${this.params.file_path}`,
    };
  }
}

// 5. Production usage
async function main() {
  const settings = await loadSettings();
  const config = new ConfigImpl(settings);

  const tool = new ReadFileTool(config);
  const invocation = tool.build({ file_path: '/path/to/file.txt' });
  const result = await invocation.execute();
}

// 6. Test usage
describe('ReadFileTool', () => {
  it('should read file', async () => {
    // Create test config with mocks
    const mockConfig = new MockConfig();
    mockConfig.getMockFileSystem().setFile('/test.txt', 'test content');

    // Use same code as production
    const tool = new ReadFileTool(mockConfig);
    const invocation = tool.build({ file_path: '/test.txt' });
    const result = await invocation.execute();

    expect(result.llmContent).to.equal('test content');
  });
});
```

**Example explained:**

- Lines 1-13: Config interface defines all dependencies
- Lines 15-46: Production config with lazy initialization
- Lines 48-66: Services pull dependencies from config as needed
- Lines 68-81: Production and test usage with different configs

### When to Use

**Use config-based DI when:**

- Services have many dependencies (> 3 parameters)
- Need different configurations for different environments
- Dependencies are optional or lazily initialized
- Want centralized configuration management
- Testing requires mock implementations

**Avoid this pattern when:**

- Service has only 1-2 dependencies (use constructor injection)
- All dependencies are required and eager
- No need for environment-specific configurations
- Simple utility functions with no dependencies

### Benefits

- **Centralized Dependencies**: One place to manage all services
- **Lazy Loading**: Services created only when needed
- **Easy Testing**: Swap entire config for test environment
- **Optional Dependencies**: Can check if feature is available
- **Late Binding**: Services decide when to pull dependencies

### Trade-offs

- **Indirection**: Extra layer between service and dependency
- **Hidden Dependencies**: Not obvious from constructor what service needs
- **Runtime Errors**: Typos in getter names only caught at runtime
- **Global-ish State**: Config often passed through many layers

### Common Mistakes

**Mistake 1: Storing state in config**

❌ **Bad example:**

```typescript
class ConfigImpl implements Config {
  private executionCount = 0; // ❌ State in config

  incrementExecutionCount(): void {
    this.executionCount++;
  }

  getExecutionCount(): number {
    return this.executionCount;
  }
}
```

✅ **Correct approach:**

```typescript
class ConfigImpl implements Config {
  // ✅ Config provides access to services, not state
  getExecutionTracker(): ExecutionTracker {
    return this.executionTracker;
  }
}

// State belongs in dedicated service
class ExecutionTracker {
  private count = 0;

  increment(): void {
    this.count++;
  }
}
```

**Why this matters**: Config should be configuration and service locator, not a data store. Storing state in config makes it mutable, hard to reason about, and breaks testing.

**Mistake 2: Not providing test config**

❌ **Bad example:**

```typescript
// Tests must create full production config
describe('MyService', () => {
  it('should work', async () => {
    // ❌ Requires full settings, file system, etc.
    const settings = await loadSettings();
    const config = new ConfigImpl(settings);
    const service = new MyService(config);
  });
});
```

✅ **Correct approach:**

```typescript
// Test config with sensible defaults
describe('MyService', () => {
  it('should work', async () => {
    // ✅ Test config with minimal setup
    const config = new MockConfig();
    config.getMockFileSystem().setFile('/test.txt', 'content');

    const service = new MyService(config);
    // Test service in isolation
  });
});
```

**Why this matters**: Test config should be lightweight and easy to set up. Requiring full production config in tests makes tests slow, brittle, and dependent on file system state.

### Testing Strategy

**What to Test:**

- Config returns correct values from settings
- Lazy initialization works (services created once)
- Services can access all needed dependencies via config
- Test config provides valid mocks

**Test Organization:**

- `config/configImpl.test.ts` - Test production config
- `test-utils/mockConfig.test.ts` - Test mock config
- Each service test uses mock config

**Mock Strategy:**

- Create dedicated MockConfig class
- Provide helpers to set up mocks (getMockFileSystem, etc.)
- Allow partial overrides via constructor

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ConfigImpl } from './configImpl.js';
import { MockConfig } from '../../test-utils/mocks/mockConfig.js';
import type { Settings } from './settings.js';

describe('ConfigImpl', () => {
  it('should return target directory from settings', () => {
    // Arrange
    const settings: Settings = {
      targetDir: '/custom/target',
    };
    const config = new ConfigImpl(settings);

    // Act
    const targetDir = config.getTargetDir();

    // Assert
    expect(targetDir).to.equal('/custom/target');
  });

  it('should use default model when not in settings', () => {
    // Arrange
    const settings: Settings = {};
    const config = new ConfigImpl(settings);

    // Act
    const model = config.getModel();

    // Assert
    expect(model).to.equal('gemini-2.0-flash-exp');
  });

  it('should lazily initialize file system service', () => {
    // Arrange
    const settings: Settings = {};
    const config = new ConfigImpl(settings);

    // Act
    const fs1 = config.getFileSystemService();
    const fs2 = config.getFileSystemService();

    // Assert
    expect(fs1).to.equal(fs2); // Same instance
  });

  it('should check experiment flags', () => {
    // Arrange
    const settings: Settings = {
      experiments: {
        'new-feature': true,
        'old-feature': false,
      },
    };
    const config = new ConfigImpl(settings);

    // Act & Assert
    expect(config.isExperimentEnabled('new-feature')).to.be.true;
    expect(config.isExperimentEnabled('old-feature')).to.be.false;
    expect(config.isExperimentEnabled('unknown')).to.be.false;
  });
});

describe('MockConfig', () => {
  it('should provide mock file system', () => {
    // Arrange
    const config = new MockConfig();
    const mockFs = config.getMockFileSystem();
    mockFs.setFile('/test.txt', 'content');

    // Act
    const fs = config.getFileSystemService();

    // Assert
    expect(fs).to.equal(mockFs);
  });

  it('should allow overriding getters', () => {
    // Arrange
    const config = new MockConfig({
      getModel: () => 'custom-model',
    });

    // Act
    const model = config.getModel();

    // Assert
    expect(model).to.equal('custom-model');
  });
});
```

**Coverage Goals:**

- Config implementation: 80%+ line coverage
- All getters tested with various settings
- Lazy initialization verified
- Test config helpers verified

### Related Patterns

- **[Service Pattern](#pattern-2-service-pattern-with-interfaces)** - Services injected via config
- **[Registry Pattern](#pattern-4-registry-pattern)** - Registry accessed via config
- **[Layered Architecture](#pattern-1-layered-architecture)** - Config passed between layers

---

## Pattern 6: Factory Pattern

### Intent

Encapsulate complex object creation logic and decision-making in dedicated factory functions or classes.

### Problem

Creating complex objects often involves conditional logic to select between different implementations, multiple initialization steps, and dependency resolution. Scattering this creation logic throughout the codebase leads to duplication, inconsistency, and makes it difficult to change how objects are created.

### Solution

Create factory functions or classes that encapsulate the creation logic. The factory examines configuration or parameters and returns the appropriate implementation. Consumers ask the factory for objects without knowing the concrete class being instantiated, enabling easy changes to construction logic.

### Structure

```typescript
// Factory function
export function createFileSearch(options: Options): FileSearch {
  if (options.enableRecursive) {
    return new RecursiveFileSearch(options);
  }
  return new DirectoryFileSearch(options);
}

// Or factory class
export class FileSearchFactory {
  static create(options: Options): FileSearch {
    // Decision logic
    return implementation;
  }
}
```

### Implementation

**Step 1: Define common interface**

```typescript
// packages/core/src/utils/fileSearch.ts
export interface FileSearch {
  initialize(): Promise<void>;
  search(pattern: string, options?: SearchOptions): Promise<string[]>;
}

export interface FileSearchOptions {
  projectRoot: string;
  ignoreDirs?: string[];
  useGitignore?: boolean;
  cache?: boolean;
  cacheTtl?: number;
  enableRecursiveFileSearch: boolean;
  disableFuzzySearch?: boolean;
  maxDepth?: number;
}
```

**Step 2: Implement concrete classes**

```typescript
// Recursive implementation
class RecursiveFileSearch implements FileSearch {
  private ignore: Ignore | undefined;
  private allFiles: string[] = [];
  private fzf: AsyncFzf<string[]> | undefined;

  constructor(private readonly options: FileSearchOptions) {}

  async initialize(): Promise<void> {
    this.ignore = loadIgnoreRules(this.options);
    this.allFiles = await crawl({
      crawlDirectory: this.options.projectRoot,
      cwd: this.options.projectRoot,
      ignore: this.ignore,
      cache: this.options.cache,
      cacheTtl: this.options.cacheTtl,
      maxDepth: this.options.maxDepth,
    });

    if (!this.options.disableFuzzySearch) {
      this.fzf = new AsyncFzf(this.allFiles);
    }
  }

  async search(pattern: string, options: SearchOptions = {}): Promise<string[]> {
    if (!this.ignore) {
      throw new Error('Not initialized. Call initialize() first.');
    }

    if (this.fzf) {
      const results = await this.fzf.find(pattern);
      return results.map((r) => r.item);
    }

    // Fallback to simple filtering
    return this.allFiles.filter((file) => file.includes(pattern));
  }
}

// Directory-based implementation
class DirectoryFileSearch implements FileSearch {
  private ignore: Ignore | undefined;

  constructor(private readonly options: FileSearchOptions) {}

  async initialize(): Promise<void> {
    this.ignore = loadIgnoreRules(this.options);
  }

  async search(pattern: string, options: SearchOptions = {}): Promise<string[]> {
    if (!this.ignore) {
      throw new Error('Not initialized. Call initialize() first.');
    }

    const searchDir = options.directory || this.options.projectRoot;
    return await findFiles(searchDir, pattern, this.ignore);
  }
}
```

**Step 3: Create factory function**

```typescript
// Factory encapsulates creation decision
export function createFileSearch(options: FileSearchOptions): FileSearch {
  if (options.enableRecursiveFileSearch) {
    return new RecursiveFileSearch(options);
  }
  return new DirectoryFileSearch(options);
}
```

### Complete Example

```typescript
// packages/core/src/utils/fileSearch.ts

/**
 * Common interface for file search implementations
 */
export interface FileSearch {
  initialize(): Promise<void>;
  search(pattern: string, options?: SearchOptions): Promise<string[]>;
}

export interface FileSearchOptions {
  projectRoot: string;
  ignoreDirs?: string[];
  useGitignore?: boolean;
  cache?: boolean;
  cacheTtl?: number;
  enableRecursiveFileSearch: boolean;
  disableFuzzySearch?: boolean;
  maxDepth?: number;
}

export interface SearchOptions {
  directory?: string;
  maxResults?: number;
}

/**
 * Recursive file search with caching and fuzzy matching
 */
class RecursiveFileSearch implements FileSearch {
  private ignore: Ignore | undefined;
  private allFiles: string[] = [];
  private fzf: AsyncFzf<string[]> | undefined;

  constructor(private readonly options: FileSearchOptions) {}

  async initialize(): Promise<void> {
    this.ignore = loadIgnoreRules(this.options);

    // Crawl entire directory structure
    this.allFiles = await crawl({
      crawlDirectory: this.options.projectRoot,
      cwd: this.options.projectRoot,
      ignore: this.ignore,
      cache: this.options.cache,
      cacheTtl: this.options.cacheTtl,
      maxDepth: this.options.maxDepth,
    });

    // Initialize fuzzy finder
    if (!this.options.disableFuzzySearch) {
      this.fzf = new AsyncFzf(this.allFiles);
    }
  }

  async search(pattern: string, options: SearchOptions = {}): Promise<string[]> {
    if (!this.ignore) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    // Use fuzzy search if available
    if (this.fzf) {
      const results = await this.fzf.find(pattern);
      const matches = results.map((r) => r.item);
      return options.maxResults ? matches.slice(0, options.maxResults) : matches;
    }

    // Fallback to simple filtering
    const matches = this.allFiles.filter((file) => file.includes(pattern));
    return options.maxResults ? matches.slice(0, options.maxResults) : matches;
  }
}

/**
 * Directory-based file search (lighter weight)
 */
class DirectoryFileSearch implements FileSearch {
  private ignore: Ignore | undefined;

  constructor(private readonly options: FileSearchOptions) {}

  async initialize(): Promise<void> {
    this.ignore = loadIgnoreRules(this.options);
  }

  async search(pattern: string, options: SearchOptions = {}): Promise<string[]> {
    if (!this.ignore) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const searchDir = options.directory || this.options.projectRoot;
    const files = await findFiles(searchDir, pattern, this.ignore);
    return options.maxResults ? files.slice(0, options.maxResults) : files;
  }
}

/**
 * Factory function to create appropriate file search implementation
 */
export function createFileSearch(options: FileSearchOptions): FileSearch {
  // Decision based on configuration
  if (options.enableRecursiveFileSearch) {
    return new RecursiveFileSearch(options);
  }
  return new DirectoryFileSearch(options);
}

// Usage example
async function searchFiles(): Promise<void> {
  const options: FileSearchOptions = {
    projectRoot: '/path/to/project',
    ignoreDirs: ['node_modules', '.git'],
    useGitignore: true,
    cache: true,
    cacheTtl: 60000,
    enableRecursiveFileSearch: true,
    disableFuzzySearch: false,
  };

  // Create appropriate implementation via factory
  const fileSearch = createFileSearch(options);
  await fileSearch.initialize();

  // Use without knowing concrete implementation
  const results = await fileSearch.search('**/*.ts');
  console.log(`Found ${results.length} TypeScript files`);
}
```

**Example explained:**

- Lines 1-15: Common interface for all search implementations
- Lines 17-58: Recursive implementation with fuzzy search and caching
- Lines 60-85: Simpler directory-based implementation
- Lines 87-95: Factory function encapsulates creation decision
- Lines 97-114: Usage shows consumer doesn't know concrete class

### When to Use

**Use factory pattern when:**

- Object creation involves complex conditional logic
- Multiple implementations of an interface exist
- Creation logic should be centralized and reusable
- Need to hide concrete classes from consumers
- Configuration determines which implementation to use

**Avoid this pattern when:**

- Only one implementation exists (no need for factory)
- Creation logic is trivial (just `new MyClass()`)
- No conditional logic in object creation
- Overhead of factory outweighs benefits

### Benefits

- **Encapsulation**: Creation logic in one place, easy to change
- **Flexibility**: Can switch implementations without changing consumers
- **Decoupling**: Consumers depend on interface, not concrete classes
- **Testability**: Can inject different implementations for testing
- **Single Responsibility**: Creation logic separate from business logic

### Trade-offs

- **Indirection**: Extra layer between consumer and object
- **Complexity**: More classes/functions for simple cases
- **Discovery**: May be unclear what concrete type is returned

### Common Mistakes

**Mistake 1: Factory returns different incompatible types**

❌ **Bad example:**

```typescript
function createProcessor(type: string): any {
  // ❌ Returns any
  if (type === 'text') return new TextProcessor();
  if (type === 'binary') return new BinaryProcessor();
  return null;
}
```

✅ **Correct approach:**

```typescript
function createProcessor(type: string): Processor {
  // ✅ Returns interface
  if (type === 'text') return new TextProcessor();
  if (type === 'binary') return new BinaryProcessor();
  throw new Error(`Unknown processor type: ${type}`);
}
```

**Why this matters**: Factory should return a consistent interface. Using `any` or returning incompatible types defeats type safety and makes usage unpredictable.

**Mistake 2: Exposing concrete classes outside factory**

❌ **Bad example:**

```typescript
// Exporting concrete classes
export class RecursiveFileSearch {
  /* ... */
}
export class DirectoryFileSearch {
  /* ... */
}
export function createFileSearch(options): FileSearch {
  /* ... */
}

// Consumers can bypass factory
const search = new RecursiveFileSearch(options); // ❌ Direct instantiation
```

✅ **Correct approach:**

```typescript
// Only export interface and factory
export interface FileSearch {
  /* ... */
}
export function createFileSearch(options): FileSearch {
  /* ... */
}

// Concrete classes are not exported (private to module)
class RecursiveFileSearch implements FileSearch {
  /* ... */
}
class DirectoryFileSearch implements FileSearch {
  /* ... */
}
```

**Why this matters**: Exporting concrete classes allows bypassing the factory, defeating its purpose and creating multiple creation paths.

### Testing Strategy

**What to Test:**

- Factory returns correct implementation based on options
- Returned objects conform to interface
- All creation paths (different configurations)
- Error handling for invalid options

**Test Organization:**

- `utils/fileSearch.test.ts` - Test factory and implementations
- Separate describe blocks for factory vs implementations
- Test each implementation with its factory

**Mock Strategy:**

- Test factory with real implementations (lightweight)
- Test consumers with mocked interface implementations
- Use factory in integration tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { createFileSearch, type FileSearch } from './fileSearch.js';

describe('File Search Factory', () => {
  describe('createFileSearch', () => {
    it('should create RecursiveFileSearch when enabled', async () => {
      // Arrange
      const options = {
        projectRoot: '/test',
        enableRecursiveFileSearch: true,
      };

      // Act
      const fileSearch = createFileSearch(options);
      await fileSearch.initialize();

      // Assert
      expect(fileSearch).to.exist;
      // Verify behavior (not type, since classes are private)
      const results = await fileSearch.search('test');
      expect(results).to.be.an('array');
    });

    it('should create DirectoryFileSearch when disabled', async () => {
      // Arrange
      const options = {
        projectRoot: '/test',
        enableRecursiveFileSearch: false,
      };

      // Act
      const fileSearch = createFileSearch(options);
      await fileSearch.initialize();

      // Assert
      expect(fileSearch).to.exist;
      expect(fileSearch).to.have.property('search');
    });

    it('should return objects conforming to FileSearch interface', () => {
      // Arrange
      const options = {
        projectRoot: '/test',
        enableRecursiveFileSearch: true,
      };

      // Act
      const fileSearch = createFileSearch(options);

      // Assert
      expect(fileSearch).to.have.property('initialize').that.is.a('function');
      expect(fileSearch).to.have.property('search').that.is.a('function');
    });
  });

  describe('RecursiveFileSearch (via factory)', () => {
    it('should initialize and search files', async () => {
      // Arrange
      const options = {
        projectRoot: process.cwd(),
        enableRecursiveFileSearch: true,
        disableFuzzySearch: true,
      };

      const fileSearch = createFileSearch(options);

      // Act
      await fileSearch.initialize();
      const results = await fileSearch.search('*.ts');

      // Assert
      expect(results).to.be.an('array');
    });

    it('should throw error if not initialized', async () => {
      // Arrange
      const options = {
        projectRoot: process.cwd(),
        enableRecursiveFileSearch: true,
      };

      const fileSearch = createFileSearch(options);

      // Act & Assert
      await expect(fileSearch.search('*.ts')).to.be.rejectedWith('Not initialized');
    });
  });
});
```

**Coverage Goals:**

- Factory logic: 100% (all code paths)
- Implementation logic: 80%+ line coverage
- Error paths tested

### Related Patterns

- **[Strategy Pattern](#pattern-7-strategy-pattern)** - Often combined with factory to select strategies
- **[Builder Pattern](#pattern-3-builder-pattern)** - Alternative for complex object construction
- **[Dependency Injection](#pattern-5-dependency-injection-via-config)** - Factories accessed via config

---

## Pattern 7: Strategy Pattern

### Intent

Encapsulate interchangeable algorithms or behaviors in separate strategy classes that can be selected and switched at runtime.

### Problem

Hardcoding algorithms or business logic makes code inflexible and difficult to extend. Using large conditional statements (`if/else` or `switch`) to select behavior violates the Open/Closed Principle and makes code difficult to test. Adding new behaviors requires modifying existing code rather than extending it.

### Solution

Define a strategy interface that declares the contract for an algorithm or behavior. Implement multiple concrete strategies that fulfill this interface. Create a context class that holds a reference to a strategy and delegates work to it. Strategies can be swapped at runtime based on configuration or conditions.

### Structure

```typescript
// Strategy interface
interface RoutingStrategy {
  route(context: Context): Decision;
}

// Concrete strategies
class DefaultStrategy implements RoutingStrategy {
  route(context: Context): Decision {
    /* ... */
  }
}

class OptimizedStrategy implements RoutingStrategy {
  route(context: Context): Decision {
    /* ... */
  }
}

// Context uses strategy
class Router {
  constructor(private strategy: RoutingStrategy) {}

  execute(context: Context): Decision {
    return this.strategy.route(context);
  }
}
```

### Implementation

**Step 1: Define strategy interface**

```typescript
// packages/core/src/routing/routingStrategy.ts
export interface RoutingContext {
  history: Content[];
  request: PartListUnion;
  signal: AbortSignal;
}

export interface RoutingDecision {
  model: string;
  metadata: {
    source: string;
    latencyMs: number;
    reasoning: string;
    error?: string;
  };
}

export interface RoutingStrategy {
  readonly name: string;

  route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision | null>;
}

// Terminal strategy MUST return a decision (cannot return null)
export interface TerminalStrategy extends RoutingStrategy {
  route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision>;
}
```

**Step 2: Implement concrete strategies**

```typescript
// packages/core/src/routing/strategies/defaultStrategy.ts
export class DefaultStrategy implements TerminalStrategy {
  readonly name = 'default';

  async route(
    _context: RoutingContext,
    _config: Config,
    _baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision> {
    return {
      model: DEFAULT_MODEL,
      metadata: {
        source: this.name,
        latencyMs: 0,
        reasoning: `Routing to default model: ${DEFAULT_MODEL}`,
      },
    };
  }
}

// packages/core/src/routing/strategies/overrideStrategy.ts
export class OverrideStrategy implements RoutingStrategy {
  readonly name = 'override';

  async route(
    _context: RoutingContext,
    config: Config,
    _baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision | null> {
    const overrideModel = config.getModel();

    // If model is 'auto', pass to next strategy
    if (overrideModel === 'auto') return null;

    return {
      model: resolveModel(overrideModel, config.getPreviewFeatures()),
      metadata: {
        source: this.name,
        latencyMs: 0,
        reasoning: `Routing bypassed by forced model directive. Using: ${overrideModel}`,
      },
    };
  }
}

// packages/core/src/routing/strategies/classifierStrategy.ts
export class ClassifierStrategy implements RoutingStrategy {
  readonly name = 'classifier';

  async route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision | null> {
    try {
      const startTime = performance.now();

      // Use LLM to classify request complexity
      const classification = await baseLlmClient.classify(context.request);

      const latencyMs = Math.round(performance.now() - startTime);

      return {
        model: classification.recommendedModel,
        metadata: {
          source: this.name,
          latencyMs,
          reasoning: `Classified as ${classification.complexity}: ${classification.reasoning}`,
        },
      };
    } catch (error) {
      // Strategy failed, return null to try next strategy
      return null;
    }
  }
}
```

**Step 3: Create composite strategy (Chain of Responsibility)**

```typescript
// packages/core/src/routing/strategies/compositeStrategy.ts
export class CompositeStrategy implements TerminalStrategy {
  readonly name: string;
  private strategies: [...RoutingStrategy[], TerminalStrategy];

  constructor(strategies: [...RoutingStrategy[], TerminalStrategy], name: string = 'composite') {
    this.strategies = strategies;
    this.name = name;
  }

  async route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision> {
    const startTime = performance.now();

    // Separate non-terminal from terminal strategy
    const nonTerminalStrategies = this.strategies.slice(0, -1) as RoutingStrategy[];
    const terminalStrategy = this.strategies[this.strategies.length - 1] as TerminalStrategy;

    // Try non-terminal strategies (allow graceful failure)
    for (const strategy of nonTerminalStrategies) {
      try {
        const decision = await strategy.route(context, config, baseLlmClient);
        if (decision) {
          return this.finalizeDecision(decision, startTime);
        }
      } catch (error) {
        console.error(
          `[Routing] Strategy '${strategy.name}' failed. Continuing to next strategy.`,
          error
        );
      }
    }

    // Terminal strategy must return decision
    const decision = await terminalStrategy.route(context, config, baseLlmClient);
    return this.finalizeDecision(decision, startTime);
  }

  private finalizeDecision(decision: RoutingDecision, startTime: number): RoutingDecision {
    const endTime = performance.now();
    return {
      ...decision,
      metadata: {
        ...decision.metadata,
        source: `${this.name}/${decision.metadata.source}`,
        latencyMs: Math.round(decision.metadata.latencyMs || endTime - startTime),
      },
    };
  }
}
```

**Step 4: Create context/service that uses strategies**

```typescript
// packages/core/src/routing/modelRouterService.ts
export class ModelRouterService {
  private config: Config;
  private strategy: TerminalStrategy;

  constructor(config: Config) {
    this.config = config;
    this.strategy = this.initializeDefaultStrategy();
  }

  private initializeDefaultStrategy(): TerminalStrategy {
    // Initialize composite strategy with priority order
    return new CompositeStrategy(
      [
        new FallbackStrategy(),
        new OverrideStrategy(),
        new ClassifierStrategy(),
        new DefaultStrategy(), // Terminal strategy (always returns)
      ],
      'model-router'
    );
  }

  async route(context: RoutingContext): Promise<RoutingDecision> {
    const decision = await this.strategy.route(
      context,
      this.config,
      this.config.getBaseLlmClient()
    );

    // Apply preview model upgrade if needed
    if (
      decision.model === DEFAULT_MODEL &&
      this.config.getPreviewFeatures() &&
      !decision.metadata.source.includes('override')
    ) {
      decision.model = PREVIEW_MODEL;
      decision.metadata.source += ' (Preview)';
    }

    return decision;
  }

  // Allow runtime strategy swapping
  setStrategy(strategy: TerminalStrategy): void {
    this.strategy = strategy;
  }
}
```

### Complete Example

```typescript
// Complete strategy pattern implementation for model routing

// 1. Strategy interfaces
export interface RoutingContext {
  history: Content[];
  request: PartListUnion;
  signal: AbortSignal;
}

export interface RoutingDecision {
  model: string;
  metadata: {
    source: string;
    latencyMs: number;
    reasoning: string;
  };
}

export interface RoutingStrategy {
  readonly name: string;
  route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision | null>;
}

export interface TerminalStrategy extends RoutingStrategy {
  route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision>; // Never null
}

// 2. Concrete strategies
class OverrideStrategy implements RoutingStrategy {
  readonly name = 'override';

  async route(_context: RoutingContext, config: Config): Promise<RoutingDecision | null> {
    const model = config.getModel();
    if (model === 'auto') return null;

    return {
      model,
      metadata: {
        source: this.name,
        latencyMs: 0,
        reasoning: `Using override model: ${model}`,
      },
    };
  }
}

class DefaultStrategy implements TerminalStrategy {
  readonly name = 'default';

  async route(): Promise<RoutingDecision> {
    return {
      model: 'default-model',
      metadata: {
        source: this.name,
        latencyMs: 0,
        reasoning: 'Using default model',
      },
    };
  }
}

// 3. Composite strategy (Chain of Responsibility)
class CompositeStrategy implements TerminalStrategy {
  readonly name: string;

  constructor(
    private strategies: [...RoutingStrategy[], TerminalStrategy],
    name: string = 'composite'
  ) {
    this.name = name;
  }

  async route(
    context: RoutingContext,
    config: Config,
    baseLlmClient: BaseLlmClient
  ): Promise<RoutingDecision> {
    const nonTerminal = this.strategies.slice(0, -1) as RoutingStrategy[];
    const terminal = this.strategies[this.strategies.length - 1] as TerminalStrategy;

    // Try each non-terminal strategy
    for (const strategy of nonTerminal) {
      try {
        const decision = await strategy.route(context, config, baseLlmClient);
        if (decision) return decision;
      } catch (error) {
        console.error(`Strategy '${strategy.name}' failed`, error);
      }
    }

    // Terminal strategy guarantees a decision
    return await terminal.route(context, config, baseLlmClient);
  }
}

// 4. Context/Service
class ModelRouter {
  constructor(
    private config: Config,
    private strategy: TerminalStrategy
  ) {}

  async route(context: RoutingContext): Promise<RoutingDecision> {
    return await this.strategy.route(context, this.config, this.config.getBaseLlmClient());
  }

  // Allow runtime strategy changes
  setStrategy(strategy: TerminalStrategy): void {
    this.strategy = strategy;
  }
}

// 5. Usage
async function main() {
  const config = await loadConfig();

  // Create router with composite strategy
  const router = new ModelRouter(
    config,
    new CompositeStrategy([new OverrideStrategy(), new ClassifierStrategy(), new DefaultStrategy()])
  );

  // Route request
  const decision = await router.route({
    history: [],
    request: userRequest,
    signal: new AbortController().signal,
  });

  console.log(`Using model: ${decision.model}`);
  console.log(`Reason: ${decision.metadata.reasoning}`);
  console.log(`Source: ${decision.metadata.source}`);
}
```

**Example explained:**

- Lines 1-30: Interface definitions for strategy pattern
- Lines 32-70: Concrete strategy implementations
- Lines 72-105: Composite strategy combining multiple strategies
- Lines 107-126: Router service using strategies
- Lines 128-149: Usage showing runtime selection

### When to Use

**Use strategy pattern when:**

- Multiple algorithms or behaviors solve the same problem
- Need to select algorithm at runtime based on context
- Want to avoid large conditional statements
- Different variants of an algorithm exist
- Behavior should be swappable without changing consumers

**Avoid this pattern when:**

- Only one algorithm exists (no variations)
- Algorithm never changes
- Conditional logic is trivial (simple `if` statement)
- Overhead of pattern outweighs benefits

### Benefits

- **Open/Closed Principle**: Add new strategies without modifying context
- **Runtime Selection**: Choose strategy based on runtime conditions
- **Testability**: Each strategy tested independently
- **Cleaner Code**: Eliminates complex conditional logic
- **Reusability**: Strategies reusable across different contexts

### Trade-offs

- **More Classes**: Each strategy requires a separate class
- **Client Awareness**: Consumers must understand different strategies
- **Communication Overhead**: Context and strategy must share data

### Common Mistakes

**Mistake 1: Strategies with side effects or state**

❌ **Bad example:**

```typescript
class StatefulStrategy implements Strategy {
  private callCount = 0; // ❌ Mutable state

  route(context: Context): Decision {
    this.callCount++; // ❌ Side effects
    return { model: `model-${this.callCount}` };
  }
}
```

✅ **Correct approach:**

```typescript
class StatelessStrategy implements Strategy {
  readonly name = 'stateless';

  route(context: Context): Decision {
    // ✅ Pure function, no state
    return { model: determineModel(context) };
  }
}
```

**Why this matters**: Strategies should be stateless and side-effect-free to enable safe reuse, testing, and concurrent execution.

**Mistake 2: Strategies directly accessing context internals**

❌ **Bad example:**

```typescript
class TightlyCoupledStrategy implements Strategy {
  route(router: ModelRouter): Decision {
    // ❌ Depends on concrete context
    const config = router.config; // ❌ Direct access
    const history = router.conversationHistory; // ❌ Implementation detail
    return { model: 'some-model' };
  }
}
```

✅ **Correct approach:**

```typescript
class DecoupledStrategy implements Strategy {
  route(context: RoutingContext, config: Config): Decision {
    // ✅ Depends only on interface
    const history = context.history;
    return { model: this.selectModel(history) };
  }
}
```

**Why this matters**: Strategies should depend on interfaces, not concrete implementations. Direct access creates tight coupling and prevents reuse.

### Testing Strategy

**What to Test:**

- Each strategy implementation independently
- Context correctly delegates to strategy
- Strategy switching works at runtime
- Composite strategy tries strategies in order
- Error handling and fallback behavior

**Test Organization:**

- `routing/strategies/defaultStrategy.test.ts` - Test each strategy
- `routing/modelRouter.test.ts` - Test context with mocked strategies
- `routing/integration.test.ts` - Test full strategy chain

**Mock Strategy:**

- Create mock strategies that return predictable decisions
- Test context with various strategy combinations
- Use real strategies for integration tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  DefaultStrategy,
  OverrideStrategy,
  CompositeStrategy,
  type RoutingContext,
} from './strategies.js';

describe('Routing Strategies', () => {
  describe('DefaultStrategy', () => {
    it('should always return default model', async () => {
      // Arrange
      const strategy = new DefaultStrategy();
      const context: RoutingContext = {
        history: [],
        request: {},
        signal: new AbortController().signal,
      };

      // Act
      const decision = await strategy.route(context, mockConfig, mockClient);

      // Assert
      expect(decision).to.exist;
      expect(decision.model).to.equal('default-model');
      expect(decision.metadata.source).to.equal('default');
    });
  });

  describe('OverrideStrategy', () => {
    it('should return override model when set', async () => {
      // Arrange
      const strategy = new OverrideStrategy();
      const mockConfig = {
        getModel: () => 'custom-model',
      };

      // Act
      const decision = await strategy.route(context, mockConfig, mockClient);

      // Assert
      expect(decision).to.exist;
      expect(decision.model).to.equal('custom-model');
    });

    it('should return null when model is auto', async () => {
      // Arrange
      const strategy = new OverrideStrategy();
      const mockConfig = {
        getModel: () => 'auto',
      };

      // Act
      const decision = await strategy.route(context, mockConfig, mockClient);

      // Assert
      expect(decision).to.be.null;
    });
  });

  describe('CompositeStrategy', () => {
    it('should try strategies in order until one succeeds', async () => {
      // Arrange
      const mockStrategy1 = {
        name: 'mock1',
        route: async () => null, // Fails
      };
      const mockStrategy2 = {
        name: 'mock2',
        route: async () => ({
          model: 'success',
          metadata: { source: 'mock2', latencyMs: 0, reasoning: 'test' },
        }),
      };
      const terminalStrategy = new DefaultStrategy();

      const composite = new CompositeStrategy(
        [mockStrategy1, mockStrategy2, terminalStrategy],
        'test-composite'
      );

      // Act
      const decision = await composite.route(context, mockConfig, mockClient);

      // Assert
      expect(decision.model).to.equal('success');
      expect(decision.metadata.source).to.include('mock2');
    });

    it('should use terminal strategy if all others fail', async () => {
      // Arrange
      const failingStrategy = {
        name: 'failing',
        route: async () => null,
      };
      const terminalStrategy = new DefaultStrategy();

      const composite = new CompositeStrategy([failingStrategy, terminalStrategy]);

      // Act
      const decision = await composite.route(context, mockConfig, mockClient);

      // Assert
      expect(decision.model).to.equal('default-model');
      expect(decision.metadata.source).to.include('default');
    });
  });
});
```

**Coverage Goals:**

- Each strategy: 90%+ line coverage
- Composite strategy: 100% (all paths including error handling)
- Context integration: 80%+ coverage

### Related Patterns

- **[Factory Pattern](#pattern-6-factory-pattern)** - Often used together to create strategies
- **[Dependency Injection](#pattern-5-dependency-injection-via-config)** - Strategies injected via config
- **[Registry Pattern](#pattern-4-registry-pattern)** - Can register strategies dynamically

---

## Pattern 8: Message Bus Pattern

### Intent

Decouple components through event-based publish/subscribe communication with type-safe message passing.

### Problem

Direct component coupling creates brittle dependencies where changes in one component cascade to others. Synchronous communication blocks execution, and components become tightly coupled to specific implementations. Without a central communication channel, it's difficult to track message flow and handle cross-cutting concerns like logging or validation.

### Solution

Create a central message bus that routes messages between publishers and subscribers. Components publish messages to the bus without knowing who will handle them. Subscribers register interest in specific message types and receive messages asynchronously. The bus can validate messages, enforce policies, and provide observability into system communication.

### Structure

```typescript
// Message types (discriminated union)
type Message =
  | { type: 'REQUEST'; payload: RequestData }
  | { type: 'RESPONSE'; payload: ResponseData };

// Message bus
class MessageBus extends EventEmitter {
  publish(message: Message): Promise<void> {
    this.emit(message.type, message);
  }

  subscribe<T extends Message>(type: T['type'], handler: (message: T) => void): void {
    this.on(type, handler);
  }
}
```

### Implementation

**Step 1: Define message types**

```typescript
// packages/core/src/confirmation-bus/types.ts
export enum MessageBusType {
  TOOL_CONFIRMATION_REQUEST = 'tool-confirmation-request',
  TOOL_CONFIRMATION_RESPONSE = 'tool-confirmation-response',
  TOOL_POLICY_REJECTION = 'tool-policy-rejection',
  TOOL_EXECUTION_SUCCESS = 'tool-execution-success',
  TOOL_EXECUTION_FAILURE = 'tool-execution-failure',
}

export interface ToolConfirmationRequest {
  type: MessageBusType.TOOL_CONFIRMATION_REQUEST;
  toolCall: FunctionCall;
  correlationId: string;
  serverName?: string;
}

export interface ToolConfirmationResponse {
  type: MessageBusType.TOOL_CONFIRMATION_RESPONSE;
  correlationId: string;
  confirmed: boolean;
  requiresUserConfirmation?: boolean;
}

export interface ToolPolicyRejection {
  type: MessageBusType.TOOL_POLICY_REJECTION;
  toolCall: FunctionCall;
}

export interface ToolExecutionSuccess<T = unknown> {
  type: MessageBusType.TOOL_EXECUTION_SUCCESS;
  toolCall: FunctionCall;
  result: T;
}

export interface ToolExecutionFailure<E = Error> {
  type: MessageBusType.TOOL_EXECUTION_FAILURE;
  toolCall: FunctionCall;
  error: E;
}

// Discriminated union of all message types
export type Message =
  | ToolConfirmationRequest
  | ToolConfirmationResponse
  | ToolPolicyRejection
  | ToolExecutionSuccess
  | ToolExecutionFailure;
```

**Step 2: Implement message bus**

```typescript
// packages/core/src/confirmation-bus/message-bus.ts
import { EventEmitter } from 'node:events';
import type { Message, MessageBusType } from './types.js';
import type { PolicyEngine, PolicyDecision } from './policy-engine.js';

export class MessageBus extends EventEmitter {
  constructor(
    private readonly policyEngine: PolicyEngine,
    private readonly debug = false
  ) {
    super();
  }

  private isValidMessage(message: Message): boolean {
    if (!message || !message.type) {
      return false;
    }

    if (
      message.type === MessageBusType.TOOL_CONFIRMATION_REQUEST &&
      !('correlationId' in message)
    ) {
      return false;
    }

    return true;
  }

  private emitMessage(message: Message): void {
    this.emit(message.type, message);
  }

  async publish(message: Message): Promise<void> {
    if (this.debug) {
      console.debug(`[MESSAGE_BUS] publish: ${JSON.stringify(message)}`);
    }

    if (!this.isValidMessage(message)) {
      throw new Error(`Invalid message structure: ${JSON.stringify(message)}`);
    }

    if (message.type === MessageBusType.TOOL_CONFIRMATION_REQUEST) {
      // Check policy before forwarding
      const { decision } = await this.policyEngine.check(message.toolCall, message.serverName);

      switch (decision) {
        case PolicyDecision.ALLOW:
          // Auto-approve
          this.emitMessage({
            type: MessageBusType.TOOL_CONFIRMATION_RESPONSE,
            correlationId: message.correlationId,
            confirmed: true,
          });
          break;

        case PolicyDecision.DENY:
          // Auto-reject
          this.emitMessage({
            type: MessageBusType.TOOL_POLICY_REJECTION,
            toolCall: message.toolCall,
          });
          this.emitMessage({
            type: MessageBusType.TOOL_CONFIRMATION_RESPONSE,
            correlationId: message.correlationId,
            confirmed: false,
          });
          break;

        case PolicyDecision.ASK_USER:
          // Forward to UI for user decision
          this.emitMessage(message);
          break;

        default:
          throw new Error(`Unknown policy decision: ${decision}`);
      }
    } else {
      // For other message types, just emit
      this.emitMessage(message);
    }
  }

  subscribe<T extends Message>(type: T['type'], listener: (message: T) => void): void {
    this.on(type, listener);
  }

  unsubscribe<T extends Message>(type: T['type'], listener: (message: T) => void): void {
    this.off(type, listener);
  }
}
```

**Step 3: Implement publisher (tool execution)**

```typescript
// packages/core/src/tools/toolInvocation.ts
import { randomUUID } from 'node:crypto';
import type { MessageBus } from '../confirmation-bus/message-bus.js';
import { MessageBusType } from '../confirmation-bus/types.js';

export class ToolInvocation {
  constructor(
    private toolCall: FunctionCall,
    private messageBus?: MessageBus
  ) {}

  async execute(): Promise<ToolResult> {
    if (!this.messageBus) {
      return await this.doWork();
    }

    const correlationId = randomUUID();

    // Publish confirmation request
    await this.messageBus.publish({
      type: MessageBusType.TOOL_CONFIRMATION_REQUEST,
      toolCall: this.toolCall,
      correlationId,
    });

    // Wait for confirmation response
    const confirmed = await this.waitForConfirmation(correlationId);

    if (!confirmed) {
      throw new Error('Tool execution denied by policy or user');
    }

    try {
      // Execute tool
      const result = await this.doWork();

      // Publish success
      await this.messageBus.publish({
        type: MessageBusType.TOOL_EXECUTION_SUCCESS,
        toolCall: this.toolCall,
        result,
      });

      return result;
    } catch (error) {
      // Publish failure
      await this.messageBus.publish({
        type: MessageBusType.TOOL_EXECUTION_FAILURE,
        toolCall: this.toolCall,
        error,
      });

      throw error;
    }
  }

  private waitForConfirmation(correlationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const handler = (message: ToolConfirmationResponse) => {
        if (message.correlationId === correlationId) {
          this.messageBus!.unsubscribe(MessageBusType.TOOL_CONFIRMATION_RESPONSE, handler);
          resolve(message.confirmed);
        }
      };

      this.messageBus!.subscribe(MessageBusType.TOOL_CONFIRMATION_RESPONSE, handler);
    });
  }

  private async doWork(): Promise<ToolResult> {
    // Actual tool implementation
    return { success: true };
  }
}
```

**Step 4: Implement subscriber (UI handler)**

```typescript
// packages/cli/src/ui/confirmationHandler.ts
import type { MessageBus } from '@packages/core/confirmation-bus/message-bus.js';
import {
  MessageBusType,
  type ToolConfirmationRequest,
} from '@packages/core/confirmation-bus/types.js';

export class ConfirmationHandler {
  constructor(private messageBus: MessageBus) {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Subscribe to confirmation requests
    this.messageBus.subscribe(
      MessageBusType.TOOL_CONFIRMATION_REQUEST,
      this.handleConfirmationRequest.bind(this)
    );

    // Subscribe to policy rejections
    this.messageBus.subscribe(
      MessageBusType.TOOL_POLICY_REJECTION,
      this.handlePolicyRejection.bind(this)
    );

    // Subscribe to execution results
    this.messageBus.subscribe(MessageBusType.TOOL_EXECUTION_SUCCESS, this.handleSuccess.bind(this));

    this.messageBus.subscribe(MessageBusType.TOOL_EXECUTION_FAILURE, this.handleFailure.bind(this));
  }

  private async handleConfirmationRequest(message: ToolConfirmationRequest): Promise<void> {
    // Show UI prompt to user
    const userChoice = await this.promptUser(message.toolCall);

    // Publish response
    await this.messageBus.publish({
      type: MessageBusType.TOOL_CONFIRMATION_RESPONSE,
      correlationId: message.correlationId,
      confirmed: userChoice,
    });
  }

  private handlePolicyRejection(message: ToolPolicyRejection): void {
    console.error(`Tool rejected by policy: ${message.toolCall.name}`);
  }

  private handleSuccess(message: ToolExecutionSuccess): void {
    console.log(`Tool completed: ${message.toolCall.name}`);
  }

  private handleFailure(message: ToolExecutionFailure): void {
    console.error(`Tool failed: ${message.toolCall.name}`, message.error);
  }

  private async promptUser(toolCall: FunctionCall): Promise<boolean> {
    // Show interactive confirmation UI
    return true; // Simplified
  }
}
```

### Complete Example

```typescript
// Complete message bus pattern implementation

// 1. Message type definitions
export enum MessageType {
  CONFIRMATION_REQUEST = 'confirmation-request',
  CONFIRMATION_RESPONSE = 'confirmation-response',
  EXECUTION_SUCCESS = 'execution-success',
  EXECUTION_FAILURE = 'execution-failure',
}

export interface ConfirmationRequest {
  type: MessageType.CONFIRMATION_REQUEST;
  toolName: string;
  correlationId: string;
}

export interface ConfirmationResponse {
  type: MessageType.CONFIRMATION_RESPONSE;
  correlationId: string;
  confirmed: boolean;
}

export interface ExecutionSuccess {
  type: MessageType.EXECUTION_SUCCESS;
  toolName: string;
  result: unknown;
}

export interface ExecutionFailure {
  type: MessageType.EXECUTION_FAILURE;
  toolName: string;
  error: Error;
}

export type Message =
  | ConfirmationRequest
  | ConfirmationResponse
  | ExecutionSuccess
  | ExecutionFailure;

// 2. Message bus implementation
import { EventEmitter } from 'node:events';

export class MessageBus extends EventEmitter {
  async publish(message: Message): Promise<void> {
    if (!this.isValid(message)) {
      throw new Error('Invalid message');
    }

    this.emit(message.type, message);
  }

  subscribe<T extends Message>(type: T['type'], handler: (message: T) => void): void {
    this.on(type, handler);
  }

  unsubscribe<T extends Message>(type: T['type'], handler: (message: T) => void): void {
    this.off(type, handler);
  }

  private isValid(message: Message): boolean {
    return message && typeof message.type === 'string';
  }
}

// 3. Publisher (tool)
import { randomUUID } from 'node:crypto';

export class Tool {
  constructor(
    private name: string,
    private messageBus: MessageBus
  ) {}

  async execute(): Promise<unknown> {
    const correlationId = randomUUID();

    // Request confirmation
    await this.messageBus.publish({
      type: MessageType.CONFIRMATION_REQUEST,
      toolName: this.name,
      correlationId,
    });

    // Wait for response
    const confirmed = await this.waitForResponse(correlationId);

    if (!confirmed) {
      throw new Error('Execution denied');
    }

    try {
      const result = await this.doWork();

      // Publish success
      await this.messageBus.publish({
        type: MessageType.EXECUTION_SUCCESS,
        toolName: this.name,
        result,
      });

      return result;
    } catch (error) {
      // Publish failure
      await this.messageBus.publish({
        type: MessageType.EXECUTION_FAILURE,
        toolName: this.name,
        error: error as Error,
      });

      throw error;
    }
  }

  private waitForResponse(correlationId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const handler = (message: ConfirmationResponse) => {
        if (message.correlationId === correlationId) {
          this.messageBus.unsubscribe(MessageType.CONFIRMATION_RESPONSE, handler);
          resolve(message.confirmed);
        }
      };

      this.messageBus.subscribe(MessageType.CONFIRMATION_RESPONSE, handler);
    });
  }

  private async doWork(): Promise<unknown> {
    return { success: true };
  }
}

// 4. Subscriber (UI handler)
export class UIHandler {
  constructor(private messageBus: MessageBus) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.messageBus.subscribe(MessageType.CONFIRMATION_REQUEST, this.handleRequest.bind(this));

    this.messageBus.subscribe(MessageType.EXECUTION_SUCCESS, this.handleSuccess.bind(this));
  }

  private async handleRequest(message: ConfirmationRequest): Promise<void> {
    const confirmed = await this.promptUser(message.toolName);

    await this.messageBus.publish({
      type: MessageType.CONFIRMATION_RESPONSE,
      correlationId: message.correlationId,
      confirmed,
    });
  }

  private handleSuccess(message: ExecutionSuccess): void {
    console.log(`Tool ${message.toolName} completed successfully`);
  }

  private async promptUser(toolName: string): Promise<boolean> {
    // Show UI prompt
    return true;
  }
}

// 5. Usage
async function main() {
  const messageBus = new MessageBus();

  // Set up subscribers
  const uiHandler = new UIHandler(messageBus);

  // Create and execute tool
  const tool = new Tool('read_file', messageBus);
  const result = await tool.execute();

  console.log('Tool executed:', result);
}
```

**Example explained:**

- Lines 1-41: Type-safe message definitions using discriminated unions
- Lines 43-68: Message bus implementation with validation
- Lines 70-128: Publisher (tool) using request/response pattern
- Lines 130-162: Subscriber (UI) handling messages
- Lines 164-178: Usage showing complete communication flow

### When to Use

**Use message bus pattern when:**

- Components should be decoupled
- Need asynchronous communication
- Multiple subscribers for same message type
- Cross-cutting concerns (logging, validation, policy enforcement)
- Event-driven architecture
- Want observability into system communication

**Avoid this pattern when:**

- Simple synchronous communication sufficient
- Only two components communicating
- Message flow needs to be obvious and traceable
- Overhead outweighs decoupling benefits

### Benefits

- **Loose Coupling**: Publishers don't know subscribers
- **Extensibility**: Add new subscribers without changing publishers
- **Asynchronous**: Non-blocking communication
- **Observability**: Central point to monitor all messages
- **Cross-Cutting Concerns**: Policy, validation, logging in one place

### Trade-offs

- **Indirection**: Message flow less obvious than direct calls
- **Debugging**: Harder to trace execution path
- **Testing**: Need to verify message passing, not just direct calls
- **Complexity**: More infrastructure for simple cases

### Common Mistakes

**Mistake 1: Using message bus for synchronous operations**

❌ **Bad example:**

```typescript
class Service {
  async processData(data: Data): Promise<Result> {
    // ❌ Blocking on message bus for synchronous operation
    await this.messageBus.publish({ type: 'PROCESS', data });
    const result = await this.waitForResult(); // Blocks
    return result;
  }
}
```

✅ **Correct approach:**

```typescript
class Service {
  async processData(data: Data): Promise<Result> {
    // ✅ Direct call for synchronous operation
    return await this.processor.process(data);
  }

  async notifyProcessed(result: Result): Promise<void> {
    // ✅ Message bus for notification
    await this.messageBus.publish({ type: 'PROCESSED', result });
  }
}
```

**Why this matters**: Message buses are for asynchronous, fire-and-forget communication. Using them for request/response creates complexity and blocks execution.

**Mistake 2: Not handling message validation**

❌ **Bad example:**

```typescript
class MessageBus {
  publish(message: any): void {
    // ❌ Accepts any
    this.emit(message.type, message); // ❌ No validation
  }
}
```

✅ **Correct approach:**

```typescript
class MessageBus {
  publish(message: Message): void {
    // ✅ Type-safe
    if (!this.isValid(message)) {
      // ✅ Validate
      throw new Error('Invalid message');
    }
    this.emit(message.type, message);
  }

  private isValid(message: Message): boolean {
    return message && typeof message.type === 'string';
  }
}
```

**Why this matters**: Invalid messages can cause runtime errors deep in the system. Validation at the bus level catches errors early.

### Testing Strategy

**What to Test:**

- Message validation and rejection
- Publisher can publish messages
- Subscribers receive correct messages
- Correlation IDs match request/response
- Error handling in publish/subscribe
- Multiple subscribers receive same message

**Test Organization:**

- `confirmation-bus/message-bus.test.ts` - Test bus implementation
- `tools/toolInvocation.test.ts` - Test publisher with mocked bus
- `ui/confirmationHandler.test.ts` - Test subscriber with mocked bus

**Mock Strategy:**

- Mock message bus for testing publishers/subscribers
- Use real bus for integration tests
- Capture emitted messages for verification

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { MessageBus, MessageType } from './message-bus.js';

describe('MessageBus', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus();
  });

  describe('publish', () => {
    it('should publish valid message', async () => {
      // Arrange
      const message = {
        type: MessageType.CONFIRMATION_REQUEST,
        toolName: 'test',
        correlationId: '123',
      };

      let received: any;
      messageBus.subscribe(MessageType.CONFIRMATION_REQUEST, (msg) => {
        received = msg;
      });

      // Act
      await messageBus.publish(message);

      // Assert
      expect(received).to.deep.equal(message);
    });

    it('should throw error for invalid message', async () => {
      // Arrange
      const invalidMessage = { type: '' } as any;

      // Act & Assert
      await expect(messageBus.publish(invalidMessage)).to.be.rejected;
    });
  });

  describe('subscribe', () => {
    it('should receive messages of subscribed type', async () => {
      // Arrange
      const messages: any[] = [];
      messageBus.subscribe(MessageType.EXECUTION_SUCCESS, (msg) => {
        messages.push(msg);
      });

      // Act
      await messageBus.publish({
        type: MessageType.EXECUTION_SUCCESS,
        toolName: 'test1',
        result: 'success',
      });

      await messageBus.publish({
        type: MessageType.EXECUTION_SUCCESS,
        toolName: 'test2',
        result: 'success',
      });

      // Assert
      expect(messages).to.have.length(2);
      expect(messages[0].toolName).to.equal('test1');
      expect(messages[1].toolName).to.equal('test2');
    });

    it('should not receive messages of different type', async () => {
      // Arrange
      let received: any;
      messageBus.subscribe(MessageType.EXECUTION_SUCCESS, (msg) => {
        received = msg;
      });

      // Act
      await messageBus.publish({
        type: MessageType.CONFIRMATION_REQUEST,
        toolName: 'test',
        correlationId: '123',
      });

      // Assert
      expect(received).to.be.undefined;
    });
  });

  describe('unsubscribe', () => {
    it('should stop receiving messages after unsubscribe', async () => {
      // Arrange
      let count = 0;
      const handler = () => {
        count++;
      };

      messageBus.subscribe(MessageType.EXECUTION_SUCCESS, handler);

      // Act - First message received
      await messageBus.publish({
        type: MessageType.EXECUTION_SUCCESS,
        toolName: 'test',
        result: {},
      });

      expect(count).to.equal(1);

      // Unsubscribe
      messageBus.unsubscribe(MessageType.EXECUTION_SUCCESS, handler);

      // Second message not received
      await messageBus.publish({
        type: MessageType.EXECUTION_SUCCESS,
        toolName: 'test2',
        result: {},
      });

      // Assert
      expect(count).to.equal(1); // Still 1, not 2
    });
  });
});
```

**Coverage Goals:**

- Message bus: 90%+ line coverage
- Publishers with message bus: 85%+ coverage
- Subscribers: 80%+ coverage
- Integration tests for request/response patterns

### Related Patterns

- **[Strategy Pattern](#pattern-7-strategy-pattern)** - Strategies can communicate via message bus
- **[Service Pattern](#pattern-2-service-pattern-with-interfaces)** - Services can use message bus for communication
- **[Layered Architecture](#pattern-1-layered-architecture)** - Message bus for cross-layer communication

---

## Quick Reference

### Pattern Summary Table

| Pattern              | Use When                            | Avoid When                  | Key Benefit                             |
| -------------------- | ----------------------------------- | --------------------------- | --------------------------------------- |
| Layered Architecture | Multiple concerns (UI, logic, data) | Single-purpose utilities    | Independent testing of each layer       |
| Service Pattern      | Business logic needs reuse/testing  | Simple one-off functions    | Easy mocking for tests                  |
| Builder Pattern      | Complex objects need validation     | Simple objects (< 10 lines) | Separation of definition from execution |
| Registry Pattern     | Pluggable components                | Fixed, known component set  | Centralized component management        |
| Config DI            | Many dependencies (> 3)             | 1-2 simple dependencies     | Environment-specific configurations     |
| Factory Pattern      | Multiple implementations exist      | Only one implementation     | Encapsulates creation logic             |
| Strategy Pattern     | Behavior changes at runtime         | Only one algorithm          | Open/Closed Principle compliance        |
| Message Bus Pattern  | Components should be decoupled      | Simple direct communication | Asynchronous pub/sub                    |

### Code Snippets

**Layered Architecture - Minimal Example:**

```typescript
// Presentation layer
class Command {
  async run() {
    const executor = new WorkflowExecutor(config);
    await executor.execute(workflow);
  }
}

// Business logic layer
class WorkflowExecutor {
  async execute(workflow: Workflow) {
    // Framework-agnostic logic
  }
}
```

**Service Pattern - Minimal Example:**

```typescript
interface FileSystemService {
  readTextFile(path: string): Promise<string>;
}

class StandardFileSystemService implements FileSystemService {
  async readTextFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }
}
```

**Builder Pattern - Minimal Example:**

```typescript
class ToolBuilder {
  build(params: Params): ToolInvocation {
    return new ToolInvocation(params);
  }
}

class ToolInvocation {
  async execute(): Promise<Result> {
    // Execute with validated params
  }
}
```

**Registry Pattern - Minimal Example:**

```typescript
class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}
```

**Config DI - Minimal Example:**

```typescript
interface Config {
  getFileSystemService(): FileSystemService;
  getTargetDir(): string;
}

class MyService {
  constructor(private config: Config) {}

  async doWork() {
    const fs = this.config.getFileSystemService();
    await fs.readTextFile('/path');
  }
}
```

**Factory Pattern - Minimal Example:**

```typescript
// Factory function encapsulates creation
export function createFileSearch(options: Options): FileSearch {
  if (options.enableRecursive) {
    return new RecursiveFileSearch(options);
  }
  return new DirectoryFileSearch(options);
}
```

**Strategy Pattern - Minimal Example:**

```typescript
// Define strategy interface
interface RoutingStrategy {
  route(context: Context): Decision;
}

// Context uses strategy
class Router {
  constructor(private strategy: RoutingStrategy) {}

  execute(context: Context): Decision {
    return this.strategy.route(context);
  }
}
```

**Message Bus Pattern - Minimal Example:**

```typescript
// Type-safe message bus
class MessageBus extends EventEmitter {
  async publish(message: Message): Promise<void> {
    this.emit(message.type, message);
  }

  subscribe<T extends Message>(type: T['type'], handler: (message: T) => void): void {
    this.on(type, handler);
  }
}
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error"
  }
}
```

**Project Structure Enforcement:**

```bash
# Validate layer dependencies
npm run validate-architecture

# Check for circular dependencies
npm run check-circular
```

---

## Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Ensures interfaces are type-safe
- **[Testing Patterns](./05-testing-patterns.md)** - How to test services and builders
- **[Dependency Management](./08-dependency-management.md)** - Managing external dependencies

---

## References

**Source Code Examples:**

- [Tool Registry](../../examplecode/gemini/packages/core/src/tools/tool-registry.ts) - Complete registry implementation
- [File System Service](../../examplecode/gemini/packages/core/src/services/fileSystemService.ts) - Service pattern with interface
- [LS Tool](../../examplecode/gemini/packages/core/src/tools/ls.ts) - Builder pattern example
- [Config](../../examplecode/gemini/packages/core/src/config/config.ts) - Dependency injection via config

**External Resources:**

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) - Layered architecture principles
- [Dependency Injection Principles](https://martinfowler.com/articles/injection.html) - Martin Fowler on DI
- [Gang of Four Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns) - Original patterns reference

---

## Changelog

- **2025-01-21**: Added three missing patterns (Factory, Strategy, Message Bus) with production examples
- **2025-01-21**: Comprehensive architectural patterns extracted from codebase with complete examples and tests
- **2025-01-21**: Applied standardized template structure with all required sections
- **2025-01-21**: Added testing strategy for each pattern with complete test examples
