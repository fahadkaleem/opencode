---
title: Dependency Management Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All Workspace Packages
related_patterns:
  - ./06-code-organization.md#service-layer
  - ./05-testing-patterns.md#mock-objects
  - ./07-module-boundaries.md
---

# 8. Dependency Management Patterns

> **Purpose**: Establish robust dependency management patterns using npm workspaces, TypeScript project references, and dependency injection to create maintainable, testable, and scalable monorepo architecture.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Workspace Dependencies](#pattern-1-workspace-dependencies)
- [Pattern 2: TypeScript Project References](#pattern-2-typescript-project-references)
- [Pattern 3: Dependency Injection via Constructor](#pattern-3-dependency-injection-via-constructor)
- [Pattern 4: Interface-Based Services](#pattern-4-interface-based-services)
- [Pattern 5: Avoid Circular Dependencies](#pattern-5-avoid-circular-dependencies)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Dependency management in a monorepo TypeScript application requires coordinating package dependencies, build processes, and runtime dependency injection. Proper dependency management ensures clean architecture, enables effective testing, and maintains clear module boundaries.

The patterns in this document address three layers of dependency management: package-level dependencies (npm workspaces), build-time dependencies (TypeScript project references), and runtime dependencies (dependency injection).

**Why dependency management matters:**

- Enables independent package development and testing
- Prevents circular dependencies that cause runtime errors
- Allows swapping implementations (real vs mock) for testing
- Enforces clean architecture with clear boundaries
- Improves build performance through incremental compilation
- Makes code more maintainable and refactorable

**In this document:**

- **Workspace Dependencies** - Using npm workspaces for monorepo package management
- **TypeScript Project References** - Enabling incremental builds and enforcing boundaries
- **Dependency Injection** - Constructor injection for testable, flexible code
- **Interface-Based Services** - Defining contracts for swappable implementations
- **Avoid Circular Dependencies** - Preventing import cycles that break module loading

**Prerequisites:**

- Understanding of npm package management
- Familiarity with TypeScript compiler options
- Knowledge of monorepo architecture concepts
- Experience with object-oriented design principles

---

## Pattern 1: Workspace Dependencies

### Intent

Use npm workspaces to manage dependencies between packages in a monorepo, enabling shared code and coordinated development.

### Problem

In a monorepo with multiple packages, managing dependencies between internal packages can become complex. Using published npm versions for internal packages creates version synchronization issues, delays development iteration, and complicates testing. Developers need a way to work on multiple packages simultaneously without publishing intermediate versions.

### Solution

Use npm workspaces to link internal packages at the file system level. Reference internal packages using explicit workspace paths, allowing npm to symlink packages during installation for immediate access to changes.

### Structure

```
project-root/
├── package.json                 # Root workspace configuration
├── packages/
│   ├── core/
│   │   ├── package.json         # Declares package as @org/core
│   │   └── src/
│   ├── cli/
│   │   ├── package.json         # Depends on @org/core
│   │   └── src/
│   └── test-utils/
│       ├── package.json         # Shared test utilities
│       └── src/
```

### Implementation

**Step 1: Configure root package.json for workspaces**

```json
{
  "name": "@myapp/monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  }
}
```

**Step 2: Define package in core/package.json**

```json
{
  "name": "@google/gemini-cli-core",
  "version": "0.18.0",
  "type": "module",
  "main": "dist/index.js",
  "dependencies": {
    "@google/genai": "1.30.0",
    "zod": "^3.25.76"
  }
}
```

**Step 3: Reference workspace package in cli/package.json**

```json
{
  "name": "@google/gemini-cli",
  "version": "0.18.0",
  "type": "module",
  "dependencies": {
    "@google/gemini-cli-core": "file:../core",
    "ink": "npm:@jrichman/ink@6.4.5",
    "react": "^19.2.0"
  },
  "devDependencies": {
    "@google/gemini-cli-test-utils": "file:../test-utils",
    "typescript": "^5.3.3",
    "vitest": "^3.1.1"
  }
}
```

**Step 4: Import from workspace packages**

```typescript
// packages/cli/src/index.ts
import { GeminiClient } from '@google/gemini-cli-core';
import { Config } from '@google/gemini-cli-core';

// npm automatically resolves to packages/core/dist/index.js
const client = new GeminiClient(config);
```

### Complete Example

```json
// Root package.json
{
  "name": "@google/gemini-cli",
  "version": "0.18.0-nightly.20251120",
  "type": "module",
  "workspaces": ["packages/*"],
  "private": "true",
  "scripts": {
    "build": "node scripts/build.js",
    "build:packages": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "test:ci": "npm run test:ci --workspaces --if-present",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "eslint": "^9.24.0",
    "vitest": "^3.2.4"
  }
}
```

```json
// packages/core/package.json
{
  "name": "@google/gemini-cli-core",
  "version": "0.18.0-nightly.20251120",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "node ../../scripts/build_package.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "1.30.0",
    "@modelcontextprotocol/sdk": "^1.11.0",
    "zod": "^3.25.76"
  },
  "engines": {
    "node": ">=20"
  }
}
```

```json
// packages/cli/package.json
{
  "name": "@google/gemini-cli",
  "version": "0.18.0-nightly.20251120",
  "type": "module",
  "main": "dist/index.js",
  "dependencies": {
    "@google/gemini-cli-core": "file:../core",
    "ink": "npm:@jrichman/ink@6.4.5",
    "react": "^19.2.0",
    "yargs": "^17.7.2"
  },
  "devDependencies": {
    "@google/gemini-cli-test-utils": "file:../test-utils",
    "typescript": "^5.3.3",
    "vitest": "^3.1.1"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Example explained:**

- Lines 1-7 (Root): Define workspace pattern and mark as private
- Lines 8-15 (Root): Scripts run across all workspace packages
- Lines 1-5 (Core): Core package declares itself with scoped name
- Lines 12-16 (Core): Core has its own external dependencies
- Lines 7-11 (CLI): CLI uses `file:../core` to reference workspace package
- Lines 12-15 (CLI): Dev dependencies also use file references for test utilities

### When to Use

**Use workspace dependencies when:**

- Building a monorepo with multiple interdependent packages
- Developing multiple packages simultaneously
- Sharing code between packages without publishing
- Testing changes across package boundaries immediately
- Coordinating version bumps across packages

**Avoid workspace dependencies when:**

- Building a single-package application
- Packages should be independently versioned and published
- No shared code exists between packages
- Overhead of monorepo tooling exceeds benefits

### Benefits

- **Immediate Reflection**: Changes in one package immediately available in dependent packages
- **Simplified Development**: No need to publish, version, or install during development
- **Coordinated Scripts**: Run build, test, lint across all packages with single command
- **Version Synchronization**: Single source of truth for internal package versions
- **Dependency Deduplication**: npm hoists shared dependencies to root node_modules

### Trade-offs

- **Build Complexity**: Requires managing build order and dependencies
- **Tooling Setup**: Initial configuration more complex than single package
- **IDE Performance**: Large monorepos can slow down TypeScript language server
- **Testing Coordination**: Changes in one package may break tests in another

### Common Mistakes

**Mistake 1: Using version ranges for workspace dependencies**

Bad example:

```json
{
  "dependencies": {
    "@myapp/core": "^1.0.0"
  }
}
```

Correct approach:

```json
{
  "dependencies": {
    "@google/gemini-cli-core": "file:../core"
  }
}
```

**Why this matters**: Version ranges cause npm to look for published packages. File references ensure workspace linking.

**Mistake 2: Not marking root package as private**

Bad example:

```json
{
  "name": "my-monorepo",
  "workspaces": ["packages/*"]
}
```

Correct approach:

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

**Why this matters**: Without `private: true`, npm might attempt to publish the root package, which shouldn't be published.

### Testing Strategy

**What to Test:**

- Packages can import from workspace dependencies
- Build scripts execute in correct order
- Changes in one package reflect in dependents
- Workspace commands (build, test) run across packages

**Test Organization:**

- Integration tests verify cross-package functionality
- Each package has its own unit test suite
- Test utilities shared via test-utils workspace package

**Mock Strategy:**

- Use test-utils package for shared mocks
- Each package can provide mock implementations
- Tests import real or mock via dependency injection

**Test Example:**

```typescript
// packages/core/src/client.test.ts
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { GeminiClient } from './client.js';
import type { Config } from '../config/config.js';

describe('GeminiClient', () => {
  it('should be importable from workspace package', () => {
    // Arrange
    const mockConfig = {
      /* mock config */
    } as Config;

    // Act
    const client = new GeminiClient(mockConfig);

    // Assert
    expect(client).to.exist;
  });
});
```

```typescript
// packages/cli/src/integration.test.ts
import { expect } from 'chai';
import { describe, it } from 'mocha';
// Import from workspace dependency
import { GeminiClient } from '@google/gemini-cli-core';

describe('CLI integration with Core', () => {
  it('should successfully import and use core package', () => {
    // Arrange
    const mockConfig = {
      /* config */
    } as any;

    // Act
    const client = new GeminiClient(mockConfig);

    // Assert
    expect(client).to.be.instanceOf(GeminiClient);
  });
});
```

**Coverage Goals:**

- Verify all workspace imports resolve correctly
- Test cross-package integration scenarios
- No coverage requirement for package.json itself

### Related Patterns

- **[TypeScript Project References](#pattern-2-typescript-project-references)** - Complements workspace dependencies with build optimization
- **[Module Boundaries](./07-module-boundaries.md)** - Defines what should be exposed across packages

---

## Pattern 2: TypeScript Project References

### Intent

Use TypeScript project references to enable incremental builds, enforce package boundaries, and improve IDE performance in monorepo projects.

### Problem

In a monorepo, building all packages on every change is slow and inefficient. TypeScript needs to understand package dependencies to provide accurate type checking and IntelliSense. Without project references, TypeScript treats each package independently, leading to type errors, slow builds, and poor IDE experience.

### Solution

Configure TypeScript project references to explicitly declare dependencies between packages. Enable composite mode to generate declaration maps, allowing TypeScript to understand the dependency graph and perform incremental builds.

### Structure

```
project-root/
├── tsconfig.json                # Root config with references
├── packages/
│   ├── core/
│   │   ├── tsconfig.json       # Composite: true, no references
│   │   └── src/
│   └── cli/
│       ├── tsconfig.json       # Composite: true, references: [core]
│       └── src/
```

### Implementation

**Step 1: Create root tsconfig.json with references**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true,
    "incremental": true,
    "declaration": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "es2022",
    "types": ["node", "vitest/globals"]
  }
}
```

**Step 2: Configure base package (core) tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Configure dependent package (cli) tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "vitest/globals"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.tsx", "src/**/*.json"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../core" }]
}
```

**Step 4: Build with project references**

```bash
# Build all projects respecting dependencies
tsc --build

# Clean all builds
tsc --build --clean

# Watch mode with incremental builds
tsc --build --watch

# Force rebuild all projects
tsc --build --force
```

### Complete Example

```json
// Root tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "declaration": true,
    "allowSyntheticDefaultImports": true,
    "verbatimModuleSyntax": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "es2022",
    "types": ["node", "vitest/globals"],
    "jsx": "react-jsx"
  }
}
```

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "composite": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

```json
// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "vitest/globals"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.tsx", "src/**/*.json", "./package.json"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../core" }]
}
```

**Example explained:**

- Lines 7-10 (Root): `composite`, `incremental`, and `declaration` enable project references
- Lines 12-15 (Root): `module: "NodeNext"` ensures proper ES module resolution
- Lines 2 (Package): Extends root config to inherit common settings
- Lines 4-7 (Core): No references since it has no internal dependencies
- Lines 17 (CLI): References core package, establishing build dependency

### When to Use

**Use project references when:**

- Working in a monorepo with multiple TypeScript packages
- Build times become slow as project grows
- Need to enforce package boundaries at compile time
- IDE performance degrades due to project size
- Multiple developers work on different packages simultaneously

**Avoid project references when:**

- Single package application with no internal dependencies
- Project is small enough that full rebuilds are fast
- Overhead of maintaining tsconfig files exceeds benefits
- Team is unfamiliar with TypeScript configuration

### Benefits

- **Faster Builds**: TypeScript only rebuilds changed packages and dependents
- **Enforced Boundaries**: Cannot import from package not in references
- **Better IDE Performance**: Language server understands project structure
- **Clear Dependencies**: References make dependency graph explicit
- **Parallel Builds**: Independent packages can build concurrently

### Trade-offs

- **Configuration Overhead**: Requires tsconfig.json per package
- **Declaration Files**: Generates .d.ts files even for internal code
- **Build Complexity**: Must understand composite and reference semantics
- **Editor Setup**: Some editors need configuration to recognize references

### Common Mistakes

**Mistake 1: Forgetting to set composite: true**

Bad example:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "references": [{ "path": "../core" }]
}
```

Correct approach:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true
  },
  "references": [{ "path": "../core" }]
}
```

**Why this matters**: Without `composite: true`, project references don't work. TypeScript won't generate declaration maps needed for incremental builds.

**Mistake 2: Importing without adding reference**

Bad example:

```typescript
// packages/cli/src/index.ts
import { GeminiClient } from '@google/gemini-cli-core';
// TypeScript error: Cannot find module

// packages/cli/tsconfig.json (missing reference)
{
  "compilerOptions": { "composite": true }
  // No references array!
}
```

Correct approach:

```json
// packages/cli/tsconfig.json
{
  "compilerOptions": { "composite": true },
  "references": [{ "path": "../core" }]
}
```

**Why this matters**: TypeScript requires explicit references to find types from other packages.

### Testing Strategy

**What to Test:**

- Verify tsc --build succeeds without errors
- Test incremental builds only rebuild changed packages
- Confirm IDE recognizes types from referenced packages
- Verify declaration files generate correctly

**Test Organization:**

- Build verification in CI pipeline
- Type checking as part of preflight script
- Integration tests verify cross-package types

**Mock Strategy:**

- Not directly applicable to build configuration
- Test packages can have separate tsconfig for test files

**Test Example:**

```bash
#!/bin/bash
# Script to verify TypeScript project references work correctly

# Test 1: Clean build succeeds
echo "Test 1: Clean build"
tsc --build --clean
tsc --build
if [ $? -ne 0 ]; then
  echo "FAIL: Clean build failed"
  exit 1
fi
echo "PASS: Clean build succeeded"

# Test 2: Incremental build only rebuilds changed package
echo "Test 2: Incremental build"
touch packages/core/src/client.ts
time tsc --build --verbose > build.log 2>&1
if grep -q "Skipping build" build.log; then
  echo "PASS: Incremental build skipped unchanged packages"
else
  echo "WARN: Incremental build may have rebuilt more than necessary"
fi

# Test 3: Type checking passes
echo "Test 3: Type checking"
npm run typecheck --workspaces
if [ $? -ne 0 ]; then
  echo "FAIL: Type checking failed"
  exit 1
fi
echo "PASS: Type checking succeeded"
```

**Coverage Goals:**

- All packages compile successfully with project references
- Incremental builds work as expected
- No type errors from missing references

### Related Patterns

- **[Workspace Dependencies](#pattern-1-workspace-dependencies)** - Complements project references at package level
- **[Module Boundaries](./07-module-boundaries.md)** - Enforced by project references

---

## Pattern 3: Dependency Injection via Constructor

### Intent

Inject dependencies through class constructors to enable testing, flexibility, and adherence to SOLID principles.

### Problem

Classes that directly instantiate their dependencies create tight coupling, making code difficult to test, modify, and extend. Hard-coded dependencies prevent swapping implementations for different environments (production vs test) and violate the Dependency Inversion Principle by depending on concrete implementations rather than abstractions.

### Solution

Pass dependencies as constructor parameters rather than instantiating them within the class. Classes depend on interfaces or abstract types, allowing different implementations to be injected at runtime.

### Structure

```typescript
// Instead of:
class ServiceA {
  private dep = new ConcreteDependency(); // Hard-coded
}

// Use:
class ServiceA {
  constructor(private dep: DependencyInterface) {} // Injected
}
```

### Implementation

**Step 1: Define interface for dependency**

```typescript
// services/fileSystemService.ts
export interface FileSystemService {
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
```

**Step 2: Create concrete implementation**

```typescript
// services/fileSystemService.ts
import fs from 'node:fs/promises';
import { globSync } from 'glob';
import * as path from 'node:path';

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

**Step 3: Inject dependency via constructor**

```typescript
// services/loopDetectionService.ts
import type { Config } from '../config/config.js';

export class LoopDetectionService {
  private readonly config: Config;
  private promptId = '';
  private toolCallRepetitionCount: number = 0;

  constructor(config: Config) {
    this.config = config;
  }

  addAndCheck(event: ServerGeminiStreamEvent): boolean {
    // Use injected config
    const isDisabled = this.config.isLoopDetectionDisabled();
    if (isDisabled) return false;

    // Loop detection logic...
  }
}
```

**Step 4: Wire dependencies at application startup**

```typescript
// Application initialization
const fileSystem = new StandardFileSystemService();
const config = new Config({ fileSystem });
const loopDetection = new LoopDetectionService(config);
const client = new GeminiClient(config, loopDetection);
```

### Complete Example

```typescript
// Interface definition
export interface FileSystemService {
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}

// Production implementation
import fs from 'node:fs/promises';
import { globSync } from 'glob';
import * as path from 'node:path';

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
      return globSync(pattern, { nodir: true, absolute: true });
    });
  }
}

// Service using injected dependency
export class LoopDetectionService {
  private readonly config: Config;
  private promptId = '';
  private toolCallRepetitionCount: number = 0;

  constructor(config: Config) {
    this.config = config;
  }

  addAndCheck(event: ServerGeminiStreamEvent): boolean {
    const isDisabled = this.config.isLoopDetectionDisabled();
    if (isDisabled) return false;

    // Use config methods throughout
    const threshold = this.config.getLoopThreshold();
    // Loop detection logic...
    return false;
  }
}

// Usage in production
const fileSystem = new StandardFileSystemService();
const config = new Config({
  fileSystem,
  targetDir: '/workspace',
  model: 'gemini-2.0-flash',
});
const loopDetection = new LoopDetectionService(config);

// Usage in tests
const mockFileSystem = new MockFileSystemService();
const testConfig = new Config({ fileSystem: mockFileSystem });
const testLoopDetection = new LoopDetectionService(testConfig);
```

**Example explained:**

- Lines 1-6: Interface defines contract without implementation details
- Lines 9-29: Production implementation uses real file system
- Lines 32-46: Service receives dependency via constructor
- Lines 49-53: Production wiring uses real implementations
- Lines 56-58: Test wiring uses mock implementations

### When to Use

**Use dependency injection when:**

- Class depends on external resources (file system, network, database)
- Need to swap implementations for testing
- Multiple implementations of same interface exist
- Following SOLID principles, especially Dependency Inversion
- Building modular, maintainable architecture

**Avoid dependency injection when:**

- Dependency is pure utility function with no state
- Class is simple value object or data structure
- Overhead of DI exceeds benefits for small scripts
- Dependency is truly universal constant (like Math)

### Benefits

- **Testability**: Easy to inject mocks for unit testing
- **Flexibility**: Swap implementations without changing dependent code
- **Explicit Dependencies**: Constructor signature shows what class needs
- **Loose Coupling**: Classes depend on interfaces, not concrete classes
- **SOLID Compliance**: Follows Dependency Inversion Principle

### Trade-offs

- **Boilerplate**: Requires defining interfaces and wiring code
- **Constructor Complexity**: Many dependencies can lead to large constructors
- **Runtime Configuration**: Wiring dependencies adds startup complexity
- **Learning Curve**: Developers must understand DI concepts

### Common Mistakes

**Mistake 1: Direct instantiation instead of injection**

Bad example:

```typescript
class UserService {
  private fs = new StandardFileSystemService(); // Hard-coded!

  async loadUser(id: string): Promise<User> {
    const data = await this.fs.readFile(`users/${id}.json`);
    return JSON.parse(data);
  }
}
```

Correct approach:

```typescript
class UserService {
  constructor(private fs: FileSystemService) {} // Injected

  async loadUser(id: string): Promise<User> {
    const data = await this.fs.readFile(`users/${id}.json`);
    return JSON.parse(data);
  }
}

// Usage
const service = new UserService(new StandardFileSystemService());
```

**Why this matters**: Hard-coded dependencies make testing impossible without hitting real file system.

**Mistake 2: Depending on concrete class instead of interface**

Bad example:

```typescript
class LoopDetectionService {
  constructor(private config: ConcreteConfig) {} // Concrete class
}
```

Correct approach:

```typescript
interface Config {
  isLoopDetectionDisabled(): boolean;
  getLoopThreshold(): number;
}

class LoopDetectionService {
  constructor(private config: Config) {} // Interface
}
```

**Why this matters**: Depending on interface allows multiple Config implementations without changing LoopDetectionService.

### Testing Strategy

**What to Test:**

- Service behaves correctly with mock dependencies
- Interface contracts are satisfied by implementations
- Dependency injection doesn't break functionality
- Edge cases handled by both real and mock implementations

**Test Organization:**

- Create mock implementations in test-utils package
- Co-locate service tests with service implementation
- Use AAA pattern for each test

**Mock Strategy:**

- Define mock classes implementing same interfaces
- Mock returns predictable data for assertions
- Verify service logic independent of dependency implementation

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { LoopDetectionService } from './loopDetectionService.js';
import type { Config } from '../config/config.js';

// Mock Config implementation
class MockConfig implements Partial<Config> {
  private disabled = false;
  private threshold = 5;

  isLoopDetectionDisabled(): boolean {
    return this.disabled;
  }

  getLoopThreshold(): number {
    return this.threshold;
  }

  setDisabled(value: boolean): void {
    this.disabled = value;
  }

  setThreshold(value: number): void {
    this.threshold = value;
  }
}

describe('LoopDetectionService', () => {
  let service: LoopDetectionService;
  let mockConfig: MockConfig;

  beforeEach(() => {
    // Arrange - Create mock and inject it
    mockConfig = new MockConfig();
    service = new LoopDetectionService(mockConfig as Config);
  });

  it('should not detect loop when disabled', () => {
    // Arrange
    mockConfig.setDisabled(true);
    const event = {
      /* test event */
    };

    // Act
    const detected = service.addAndCheck(event);

    // Assert
    expect(detected).to.be.false;
  });

  it('should detect loop when threshold exceeded', () => {
    // Arrange
    mockConfig.setDisabled(false);
    mockConfig.setThreshold(3);

    // Act - Add same event multiple times
    service.addAndCheck({ name: 'tool_a', args: {} });
    service.addAndCheck({ name: 'tool_a', args: {} });
    service.addAndCheck({ name: 'tool_a', args: {} });
    const detected = service.addAndCheck({ name: 'tool_a', args: {} });

    // Assert
    expect(detected).to.be.true;
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+ for service logic
- Branch coverage: 70%+ including mock interactions
- Test both real and mock implementations satisfy interface

### Related Patterns

- **[Interface-Based Services](#pattern-4-interface-based-services)** - Defines contracts for injection
- **[Mock Objects](./05-testing-patterns.md#mock-objects)** - Used for testing injected dependencies
- **[Service Pattern](./06-code-organization.md#service-layer)** - Organizes injectable services

---

## Pattern 4: Interface-Based Services

### Intent

Define service contracts as TypeScript interfaces to enable multiple implementations, facilitate testing, and enforce architectural boundaries.

### Problem

Concrete service implementations create tight coupling between consumers and providers. Without interfaces, swapping implementations requires changing all consumers. Testing becomes difficult because mocking concrete classes is complex. Architectural boundaries blur when services depend directly on other concrete services rather than abstractions.

### Solution

Define service behavior as TypeScript interfaces that specify method signatures, parameters, and return types. Implement interfaces with concrete classes, allowing dependency injection to select implementations at runtime.

### Structure

```typescript
// Interface (contract)
interface ServiceInterface {
  method(param: Type): ReturnType;
}

// Implementation
class ConcreteService implements ServiceInterface {
  method(param: Type): ReturnType {
    // Implementation
  }
}

// Usage
class Consumer {
  constructor(private service: ServiceInterface) {}
}
```

### Implementation

**Step 1: Define service interface**

```typescript
// services/fileSystemService.ts

/**
 * Interface for file system operations that may be delegated to different implementations
 */
export interface FileSystemService {
  /**
   * Read text content from a file
   *
   * @param filePath - The path to the file to read
   * @returns The file content as a string
   */
  readTextFile(filePath: string): Promise<string>;

  /**
   * Write text content to a file
   *
   * @param filePath - The path to the file to write
   * @param content - The content to write
   */
  writeTextFile(filePath: string, content: string): Promise<void>;

  /**
   * Finds files with a given name within specified search paths.
   *
   * @param fileName - The name of the file to find.
   * @param searchPaths - An array of directory paths to search within.
   * @returns An array of absolute paths to the found files.
   */
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}
```

**Step 2: Implement production version**

```typescript
// services/fileSystemService.ts
import fs from 'node:fs/promises';
import { globSync } from 'glob';
import * as path from 'node:path';

/**
 * Standard file system implementation
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
```

**Step 3: Implement mock version for testing**

```typescript
// test-utils/mockFileSystemService.ts

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
    return Array.from(this.files.keys()).filter((path) => path.endsWith(`/${fileName}`));
  }

  // Test helpers
  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  clear(): void {
    this.files.clear();
  }
}
```

**Step 4: Use interface in dependent services**

```typescript
// services/configLoader.ts
import type { FileSystemService } from './fileSystemService.js';

export class ConfigLoader {
  constructor(private fs: FileSystemService) {}

  async loadConfig(configPath: string): Promise<Config> {
    const content = await this.fs.readTextFile(configPath);
    return JSON.parse(content);
  }
}
```

### Complete Example

```typescript
// services/fileSystemService.ts

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
      return globSync(pattern, { nodir: true, absolute: true });
    });
  }
}

/**
 * Mock file system for testing
 */
export class MockFileSystemService implements FileSystemService {
  private files = new Map<string, string>();

  async readTextFile(filePath: string): Promise<string> {
    const content = this.files.get(filePath);
    if (!content) throw new Error(`File not found: ${filePath}`);
    return content;
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, content);
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    return Array.from(this.files.keys()).filter((path) => path.endsWith(`/${fileName}`));
  }

  setFile(path: string, content: string): void {
    this.files.set(path, content);
  }
}

// Service using interface
import type { FileSystemService } from './fileSystemService.js';

export class ConfigLoader {
  constructor(private fs: FileSystemService) {}

  async loadConfig(configPath: string): Promise<object> {
    const content = await this.fs.readTextFile(configPath);
    return JSON.parse(content);
  }
}

// Production usage
const fileSystem = new StandardFileSystemService();
const loader = new ConfigLoader(fileSystem);
const config = await loader.loadConfig('/app/config.json');

// Test usage
const mockFs = new MockFileSystemService();
mockFs.setFile('/app/config.json', '{"port": 3000}');
const testLoader = new ConfigLoader(mockFs);
const testConfig = await testLoader.loadConfig('/app/config.json');
```

**Example explained:**

- Lines 1-9: Interface defines contract without implementation
- Lines 11-28: Production implementation uses real file system
- Lines 30-52: Mock implementation uses in-memory Map
- Lines 54-61: Consumer depends on interface, not concrete class
- Lines 64-66: Production injects StandardFileSystemService
- Lines 69-72: Tests inject MockFileSystemService

### When to Use

**Use interface-based services when:**

- Multiple implementations of service behavior exist
- Service interacts with external resources (file system, network, database)
- Testing requires mocking external dependencies
- Building pluggable architecture with swappable components
- Enforcing architectural layering and boundaries

**Avoid interface-based services when:**

- Only one implementation will ever exist
- Service is simple utility function without state
- Overhead of interface definition exceeds benefits
- Service is internal implementation detail

### Benefits

- **Testability**: Easy to create mock implementations for testing
- **Flexibility**: Swap implementations without changing consumers
- **Clear Contracts**: Interface documents expected behavior
- **Loose Coupling**: Consumers depend on abstractions, not concretions
- **Multiple Implementations**: Support production, test, and alternative versions

### Trade-offs

- **Boilerplate**: Requires defining interface and multiple implementations
- **Indirection**: One more layer between consumer and functionality
- **Type Complexity**: Generics and complex types can complicate interfaces
- **Premature Abstraction**: Creating interfaces before needed wastes effort

### Common Mistakes

**Mistake 1: Interface with single method (unnecessary abstraction)**

Bad example:

```typescript
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// Overkill for simple logging
```

Correct approach:

```typescript
// Just use console.log directly, or:
type LogFunction = (message: string) => void;

class Service {
  constructor(private log: LogFunction = console.log) {}
}
```

**Why this matters**: Over-abstraction adds complexity without benefit. Reserve interfaces for truly swappable behavior.

**Mistake 2: Leaking implementation details in interface**

Bad example:

```typescript
interface FileSystemService {
  getUnderlyingFileDescriptor(): number; // Implementation detail!
  readTextFile(path: string): Promise<string>;
}
```

Correct approach:

```typescript
interface FileSystemService {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  // Only essential operations
}
```

**Why this matters**: Interfaces should define "what" not "how". Implementation details prevent alternative implementations.

### Testing Strategy

**What to Test:**

- Verify all implementations satisfy interface contract
- Test service behavior with mock implementation
- Ensure interface is sufficient for consumer needs
- Validate implementations handle edge cases consistently

**Test Organization:**

- Co-locate interface tests with interface definition
- Test each implementation separately
- Integration tests verify interface contracts
- Mock implementations in test-utils package

**Mock Strategy:**

- Create mock implementations that satisfy interface
- Mock implementations provide test-specific behavior
- Verify consumers work with any interface implementation

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import type { FileSystemService } from './fileSystemService.js';
import { StandardFileSystemService, MockFileSystemService } from './fileSystemService.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';

describe('FileSystemService interface', () => {
  // Test with real implementation
  describe('StandardFileSystemService', () => {
    let service: FileSystemService;
    let tempDir: string;

    beforeEach(async () => {
      service = new StandardFileSystemService();
      tempDir = await fs.mkdtemp(path.join(tmpdir(), 'test-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should read and write text files', async () => {
      // Arrange
      const filePath = path.join(tempDir, 'test.txt');
      const content = 'Hello, World!';

      // Act
      await service.writeTextFile(filePath, content);
      const result = await service.readTextFile(filePath);

      // Assert
      expect(result).to.equal(content);
    });

    it('should find files by name', async () => {
      // Arrange
      const fileName = 'config.json';
      const filePath = path.join(tempDir, 'subdir', fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, '{}');

      // Act
      const found = service.findFiles(fileName, [tempDir]);

      // Assert
      expect(found).to.have.lengthOf(1);
      expect(found[0]).to.include(fileName);
    });
  });

  // Test with mock implementation
  describe('MockFileSystemService', () => {
    let service: MockFileSystemService;

    beforeEach(() => {
      service = new MockFileSystemService();
    });

    it('should read and write text files', async () => {
      // Arrange
      const filePath = '/test/file.txt';
      const content = 'Mock content';

      // Act
      await service.writeTextFile(filePath, content);
      const result = await service.readTextFile(filePath);

      // Assert
      expect(result).to.equal(content);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const filePath = '/nonexistent.txt';

      // Act & Assert
      await expect(service.readTextFile(filePath)).to.be.rejectedWith('File not found');
    });

    it('should find files by name', async () => {
      // Arrange
      service.setFile('/dir/config.json', '{}');
      service.setFile('/dir/other.txt', 'text');

      // Act
      const found = service.findFiles('config.json', ['/dir']);

      // Assert
      expect(found).to.have.lengthOf(1);
      expect(found[0]).to.equal('/dir/config.json');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+ for each implementation
- Interface contract verified by all implementations
- Edge cases tested consistently across implementations

### Related Patterns

- **[Dependency Injection](#pattern-3-dependency-injection-via-constructor)** - Injects interface implementations
- **[Mock Objects](./05-testing-patterns.md#mock-objects)** - Implements interfaces for testing
- **[Service Pattern](./06-code-organization.md#service-layer)** - Organizes interface-based services

---

## Pattern 5: Avoid Circular Dependencies

### Intent

Eliminate circular import dependencies that cause runtime errors, initialization issues, and tightly coupled code.

### Problem

Circular dependencies occur when module A imports module B, which imports module A, creating a cycle. This causes unpredictable module initialization order, runtime errors when code executes before dependencies load, and tightly coupled modules that cannot be tested or refactored independently. TypeScript and Node.js module systems handle circular dependencies poorly, often resulting in undefined exports.

### Solution

Refactor code to eliminate circular dependencies by extracting shared code into separate modules, using dependency injection to break cycles, or restructuring module hierarchy to enforce unidirectional dependencies from higher-level to lower-level modules.

### Structure

```
Before (circular):
moduleA.ts ──imports──> moduleB.ts
    ↑                       │
    └────────imports────────┘

After (acyclic):
moduleA.ts ──imports──> shared.ts <──imports── moduleB.ts
```

### Implementation

**Step 1: Identify circular dependency**

```typescript
// file-a.ts (BAD - circular dependency)
import { functionB } from './file-b.js';

export function functionA(): string {
  return `A calls ${functionB()}`;
}

// file-b.ts (BAD - circular dependency)
import { functionA } from './file-a.js';

export function functionB(): string {
  return `B calls ${functionA()}`; // May be undefined at runtime!
}
```

**Step 2: Extract shared dependencies to separate module**

```typescript
// shared.ts (GOOD - no circular dependency)
export function sharedLogic(): string {
  return 'shared functionality';
}

// file-a.ts (GOOD)
import { sharedLogic } from './shared.js';

export function functionA(): string {
  return `A uses ${sharedLogic()}`;
}

// file-b.ts (GOOD)
import { sharedLogic } from './shared.js';

export function functionB(): string {
  return `B uses ${sharedLogic()}`;
}
```

**Step 3: Use dependency injection to break cycles**

```typescript
// Before: Circular dependency through imports
// service-a.ts
import { ServiceB } from './service-b.js';

export class ServiceA {
  private b = new ServiceB();
}

// service-b.ts
import { ServiceA } from './service-a.js'; // Circular!

export class ServiceB {
  private a = new ServiceA();
}

// After: Break cycle with dependency injection
// service-a.ts
import type { ServiceB } from './service-b.js'; // Type-only import

export class ServiceA {
  constructor(private b: ServiceB) {} // Injected, breaks cycle
}

// service-b.ts (no import of ServiceA needed)
export class ServiceB {
  doWork(): void {
    // Implementation
  }
}

// wiring.ts (orchestrates dependencies)
import { ServiceA } from './service-a.js';
import { ServiceB } from './service-b.js';

const serviceB = new ServiceB();
const serviceA = new ServiceA(serviceB);
```

**Step 4: Enforce with ESLint**

```json
{
  "plugins": ["import"],
  "rules": {
    "import/no-cycle": "error"
  }
}
```

### Complete Example

```typescript
// BAD EXAMPLE - Circular Dependency

// tools/toolA.ts
import { ToolB } from './toolB.js';

export class ToolA {
  execute(): void {
    const toolB = new ToolB();
    toolB.execute();
  }
}

// tools/toolB.ts
import { ToolA } from './toolA.js'; // Circular!

export class ToolB {
  execute(): void {
    const toolA = new ToolA();
    toolA.execute(); // May be undefined!
  }
}

// GOOD EXAMPLE 1 - Extract Shared Logic

// tools/baseToolLogic.ts
export function commonToolLogic(): void {
  console.log('Common tool functionality');
}

// tools/toolA.ts
import { commonToolLogic } from './baseToolLogic.js';

export class ToolA {
  execute(): void {
    commonToolLogic();
    console.log('ToolA specific logic');
  }
}

// tools/toolB.ts
import { commonToolLogic } from './baseToolLogic.js';

export class ToolB {
  execute(): void {
    commonToolLogic();
    console.log('ToolB specific logic');
  }
}

// GOOD EXAMPLE 2 - Dependency Injection

// tools/toolRegistry.ts
import type { Tool } from './types.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}

// tools/toolA.ts
import type { ToolRegistry } from './toolRegistry.js';
import type { Tool } from './types.js';

export class ToolA implements Tool {
  constructor(private registry: ToolRegistry) {} // Injected

  execute(): void {
    const toolB = this.registry.get('toolB');
    if (toolB) {
      toolB.execute();
    }
  }
}

// tools/toolB.ts
import type { Tool } from './types.js';

export class ToolB implements Tool {
  execute(): void {
    console.log('ToolB executing');
  }
}

// index.ts (wire dependencies)
import { ToolRegistry } from './tools/toolRegistry.js';
import { ToolA } from './tools/toolA.js';
import { ToolB } from './tools/toolB.js';

const registry = new ToolRegistry();
const toolB = new ToolB();
const toolA = new ToolA(registry);

registry.register('toolA', toolA);
registry.register('toolB', toolB);
```

**Example explained:**

- Lines 3-21: Bad example shows circular imports causing potential runtime errors
- Lines 25-47: Good example 1 extracts shared logic to eliminate cycle
- Lines 51-85: Good example 2 uses registry pattern with dependency injection
- Lines 87-96: Wiring code orchestrates dependencies at startup

### When to Use

**Use circular dependency elimination when:**

- ESLint reports `import/no-cycle` errors
- Experiencing undefined exports at runtime
- Modules are too tightly coupled to test independently
- Refactoring one module requires changing multiple others
- Module initialization order affects behavior

**Avoid this concern when:**

- Working with truly independent modules
- Building simple scripts without complex dependencies
- Using frameworks that handle cycles (rare)

### Benefits

- **Predictable Initialization**: Modules load in defined order
- **No Runtime Errors**: Eliminates undefined exports
- **Loose Coupling**: Modules become independently testable
- **Clear Architecture**: Unidirectional dependencies indicate proper layering
- **Easier Refactoring**: Changes don't ripple through circular dependencies

### Trade-offs

- **Additional Modules**: May need to create shared modules
- **Indirection**: Dependency injection adds indirection
- **Upfront Design**: Requires thinking about module structure
- **Refactoring Effort**: Breaking existing cycles takes time

### Common Mistakes

**Mistake 1: Type-only circular imports (TypeScript-specific)**

Bad example:

```typescript
// file-a.ts
import { TypeB } from './file-b.js'; // Runtime import

export type TypeA = { b: TypeB };
```

Correct approach:

```typescript
// file-a.ts
import type { TypeB } from './file-b.js'; // Type-only import

export type TypeA = { b: TypeB };
```

**Why this matters**: TypeScript `import type` doesn't create runtime dependency, breaking the cycle while preserving type safety.

**Mistake 2: Ignoring ESLint warnings**

Bad example:

```typescript
// eslint-disable-next-line import/no-cycle
import { SomeClass } from './circular.js';
```

Correct approach:

```typescript
// Refactor to eliminate cycle instead of disabling rule
import type { SomeClass } from './circular.js';
// Or extract shared code to break cycle
```

**Why this matters**: Disabling warnings hides the problem. Circular dependencies cause real runtime issues that should be fixed, not ignored.

### Testing Strategy

**What to Test:**

- Verify no circular dependencies exist (ESLint check)
- Test modules load in correct order
- Confirm refactored code maintains functionality
- Ensure extracted shared modules work correctly

**Test Organization:**

- Run `import/no-cycle` ESLint rule in CI
- Integration tests verify cross-module functionality
- Unit tests ensure modules work independently

**Mock Strategy:**

- Dependency injection naturally enables mocking
- Mock dependencies at module boundaries
- Use interfaces to allow test implementations

**Test Example:**

```typescript
// Test ESLint catches circular dependencies
describe('Circular dependency detection', () => {
  it('should have no circular dependencies', (done) => {
    const eslint = new ESLint({
      overrideConfig: {
        rules: {
          'import/no-cycle': 'error',
        },
      },
    });

    eslint.lintFiles(['src/**/*.ts']).then((results) => {
      const circularErrors = results.flatMap((result) =>
        result.messages.filter((msg) => msg.ruleId === 'import/no-cycle')
      );

      expect(circularErrors).to.have.lengthOf(0);
      done();
    });
  });
});

// Test refactored modules work independently
describe('ToolA', () => {
  it('should work without ToolB present', () => {
    // Arrange
    const mockRegistry = new ToolRegistry();
    const toolA = new ToolA(mockRegistry);

    // Act
    toolA.execute(); // Should not throw

    // Assert
    expect(toolA).to.exist;
  });
});

describe('ToolB', () => {
  it('should work independently', () => {
    // Arrange
    const toolB = new ToolB();

    // Act
    toolB.execute();

    // Assert - Should complete without errors
    expect(toolB).to.exist;
  });
});
```

**Coverage Goals:**

- Zero circular dependencies (enforced by ESLint)
- All modules testable in isolation
- Integration tests verify module interactions

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Enforces unidirectional dependencies
- **[Dependency Injection](#pattern-3-dependency-injection-via-constructor)** - Breaks circular dependencies
- **[Service Pattern](./06-code-organization.md#service-layer)** - Organizes modules to prevent cycles

---

## Quick Reference

### Pattern Summary Table

| Pattern                       | Use When                                  | Avoid When                     | Key Benefit                           |
| ----------------------------- | ----------------------------------------- | ------------------------------ | ------------------------------------- |
| Workspace Dependencies        | Building monorepo with shared packages    | Single package application     | Immediate access to changes           |
| TypeScript Project References | Large monorepo needing incremental builds | Small single-package project   | Faster builds and enforced boundaries |
| Dependency Injection          | Class needs external dependencies         | Simple utility functions       | Testability and flexibility           |
| Interface-Based Services      | Multiple implementations needed           | Only one implementation exists | Loose coupling and mockability        |
| Avoid Circular Dependencies   | Modules import each other                 | Truly independent modules      | Predictable initialization            |

### Code Snippets

**Workspace Dependencies - Minimal Example:**

```json
{
  "workspaces": ["packages/*"],
  "private": true
}
```

```json
{
  "dependencies": {
    "@myapp/core": "file:../core"
  }
}
```

**TypeScript Project References - Minimal Example:**

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true
  },
  "references": [{ "path": "../core" }]
}
```

**Dependency Injection - Minimal Example:**

```typescript
interface Service {
  execute(): void;
}

class Consumer {
  constructor(private service: Service) {}
}

// Usage
const service = new ConcreteService();
const consumer = new Consumer(service);
```

**Interface-Based Services - Minimal Example:**

```typescript
interface FileSystem {
  readFile(path: string): Promise<string>;
}

class RealFileSystem implements FileSystem {
  async readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  }
}

class MockFileSystem implements FileSystem {
  async readFile(path: string): Promise<string> {
    return 'mock content';
  }
}
```

**Avoid Circular Dependencies - Minimal Example:**

```typescript
// Extract shared code
// shared.ts
export function common() {}

// file-a.ts
import { common } from './shared.js';

// file-b.ts
import { common } from './shared.js';
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["import"],
  "rules": {
    "import/no-cycle": "error"
  }
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "composite": true,
    "incremental": true,
    "declaration": true,
    "module": "NodeNext",
    "moduleResolution": "nodenext"
  }
}
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "build": "tsc --build",
    "build:clean": "tsc --build --clean",
    "build:watch": "tsc --build --watch",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

**Build-Time Checks:**

```bash
# Verify no circular dependencies
npm run lint

# Verify TypeScript project references work
tsc --build

# Verify all workspace packages build
npm run build --workspaces
```

---

## Related Patterns

- **[Code Organization](./06-code-organization.md)** - Organizes services that use these patterns
- **[Module Boundaries](./07-module-boundaries.md)** - Defines what can be imported across packages
- **[Testing Patterns](./05-testing-patterns.md#mock-objects)** - Uses dependency injection for testing
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Ensures interfaces are type-safe

---

## References

**Source Code Examples:**

- [packages/core/package.json](../../examplecode/gemini/packages/core/package.json) - Workspace dependency configuration
- [packages/core/tsconfig.json](../../examplecode/gemini/packages/core/tsconfig.json) - TypeScript project references
- [packages/core/src/services/fileSystemService.ts](../../examplecode/gemini/packages/core/src/services/fileSystemService.ts) - Interface-based service pattern
- [packages/core/src/services/loopDetectionService.ts](../../examplecode/gemini/packages/core/src/services/loopDetectionService.ts) - Dependency injection via constructor
- [packages/core/src/config/config.ts](../../examplecode/gemini/packages/core/src/config/config.ts) - Config object for dependency injection

**External Resources:**

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces) - Official npm workspace guide
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - Official TypeScript documentation
- [Dependency Injection in TypeScript](https://www.typescriptlang.org/docs/handbook/2/classes.html) - TypeScript class patterns
- [ESLint import/no-cycle Rule](https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md) - Circular dependency detection

---

## Changelog

- **2025-01-21**: Initial dependency management patterns documentation with five core patterns
