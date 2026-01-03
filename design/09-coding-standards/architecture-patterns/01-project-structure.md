---
title: Project Structure Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Root Workspace
  - Core Package
  - CLI Package
  - All Packages
related_patterns:
  - ./06-code-organization.md
  - ./07-module-boundaries.md
  - ./08-dependency-management.md
---

# 1. Project Structure Patterns

> **Purpose**: Establish a scalable monorepo structure with clear package boundaries, domain-driven organization, and optimal separation of concerns for maintainable CLI applications.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Monorepo with npm Workspaces](#pattern-1-monorepo-with-npm-workspaces)
- [Pattern 2: Domain-Driven Package Structure](#pattern-2-domain-driven-package-structure)
- [Pattern 3: UI-Logic Separation](#pattern-3-ui-logic-separation)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Project structure determines how easy code is to find, understand, and modify. A well-structured project makes navigation intuitive, prevents circular dependencies, and enables clear ownership boundaries. Poor structure leads to tangled dependencies, difficulty finding code, and coupling between unrelated concerns.

Modern TypeScript CLI applications benefit from monorepo organization with npm workspaces. This approach enables code sharing while maintaining clear boundaries between packages. Within packages, domain-driven organization groups related functionality together rather than scattering it across technical layers.

**Why project structure matters:**

- Enables quick code navigation and discovery
- Prevents circular dependencies through clear hierarchies
- Facilitates code reuse across packages
- Makes testing easier through isolated concerns
- Supports team scalability with clear ownership
- Enables independent versioning of packages

**In this document:**

- **Monorepo with npm Workspaces** - Multi-package organization with shared dependencies
- **Domain-Driven Package Structure** - Organizing by domain concern rather than technical layer
- **UI-Logic Separation** - Isolating presentation from business logic

**Prerequisites:**

- Understanding of Node.js package.json structure
- Familiarity with npm/yarn workspace concepts
- Basic knowledge of dependency management
- Understanding of separation of concerns principle

---

## Pattern 1: Monorepo with npm Workspaces

### Intent

Organize related packages in a single repository with shared dependencies and unified tooling while maintaining clear package boundaries.

### Problem

CLI applications often need multiple related packages: core business logic, CLI interface, test utilities, and specialized services. Managing these as separate repositories creates dependency management overhead, version synchronization issues, and difficult cross-package changes. A single monolithic package creates unclear boundaries and makes selective code reuse impossible.

### Solution

Use npm workspaces to create a monorepo structure with packages organized under a common root. Each package maintains its own package.json with explicit dependencies, but shares node_modules and tooling configuration. The root package.json defines workspace members and provides aggregate commands.

### Structure

```
project-root/
├── package.json              # Workspace root configuration
├── package-lock.json         # Locked dependencies for all packages
├── tsconfig.json             # Shared TypeScript configuration
├── eslint.config.js          # Shared linting rules
├── packages/
│   ├── cli/                  # CLI interface package
│   │   ├── package.json      # CLI dependencies
│   │   ├── src/
│   │   └── dist/
│   ├── core/                 # Core business logic package
│   │   ├── package.json      # Core dependencies
│   │   ├── src/
│   │   └── dist/
│   ├── a2a-server/          # Specialized service package
│   │   ├── package.json
│   │   ├── src/
│   │   └── dist/
│   └── test-utils/          # Shared test utilities
│       ├── package.json
│       ├── src/
│       └── dist/
├── integration-tests/        # Cross-package integration tests
├── scripts/                  # Build and automation scripts
└── docs/                     # Documentation
```

### Implementation

**Step 1: Create root package.json with workspace configuration**

```json
{
  "name": "alfred-workspace",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm test --workspaces --if-present",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "clean": "node scripts/clean.js"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "eslint": "^9.24.0",
    "prettier": "^3.5.3",
    "typescript": "^5.3.3",
    "vitest": "^3.2.4"
  }
}
```

**Step 2: Create core package with business logic**

```json
// packages/core/package.json
{
  "name": "@alfred/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "files": ["dist"],
  "dependencies": {
    "zod": "^3.25.76",
    "xstate": "^5.0.0"
  },
  "devDependencies": {
    "@alfred/test-utils": "file:../test-utils",
    "typescript": "^5.3.3",
    "vitest": "^3.1.1"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 3: Create CLI package that depends on core**

```json
// packages/cli/package.json
{
  "name": "@alfred/cli",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "alfred": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "files": ["dist"],
  "dependencies": {
    "@alfred/core": "file:../core",
    "@oclif/core": "^4.0.0",
    "ink": "^5.0.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@alfred/test-utils": "file:../test-utils",
    "typescript": "^5.3.3",
    "vitest": "^3.1.1"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 4: Create shared test utilities package**

```json
// packages/test-utils/package.json
{
  "name": "@alfred/test-utils",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "files": ["dist"],
  "dependencies": {
    "vitest": "^3.1.1",
    "chai": "^4.3.10"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### Complete Example

```json
// Root package.json - Complete workspace configuration
{
  "name": "alfred-workspace",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "npm run start --workspace @alfred/cli",
    "build": "node scripts/build.js",
    "build:packages": "npm run build --workspaces --if-present",
    "test": "npm test --workspaces --if-present",
    "test:ci": "npm run test:ci --workspaces --if-present",
    "test:integration": "vitest run --root ./integration-tests",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx && npm run format",
    "format": "prettier --write .",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "clean": "node scripts/clean.js",
    "preflight": "npm run clean && npm ci && npm run format && npm run lint && npm run build && npm run typecheck && npm run test:ci"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@vitest/coverage-v8": "^3.1.1",
    "eslint": "^9.24.0",
    "eslint-config-prettier": "^10.1.2",
    "prettier": "^3.5.3",
    "typescript": "^5.3.3",
    "typescript-eslint": "^8.30.1",
    "vitest": "^3.2.4"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Example explained:**

- Lines 1-5: Define workspace root as private package (not published)
- Lines 6-9: Configure workspaces to include all packages/\* directories
- Lines 13-27: Aggregate scripts that run across all workspaces
- Lines 28-37: Shared dev dependencies used by all packages
- Lines 38-44: Pre-commit hook configuration for code quality

### When to Use

**Use monorepo with npm workspaces when:**

- Building a CLI with multiple related packages (core, CLI, plugins)
- Need to share code between packages without publishing to npm
- Want unified tooling and dependency management
- Making changes that span multiple packages frequently
- Team needs to work across package boundaries
- Want to version packages independently but develop together

**Avoid monorepo when:**

- Building a single simple application with no reuse needs
- Packages are completely unrelated and never share code
- Team structure requires strict package ownership without collaboration
- Different packages have incompatible dependency requirements

### Benefits

- **Simplified Dependency Management**: Single node_modules shared across packages reduces disk usage and installation time
- **Atomic Changes**: Changes spanning multiple packages committed together, preventing version mismatches
- **Unified Tooling**: ESLint, TypeScript, Prettier configurations shared across all packages
- **Easy Code Sharing**: Packages reference each other with `file:` protocol, no need to publish
- **Consistent Versioning**: Automated tools can bump versions across packages simultaneously
- **Better Testing**: Integration tests can import from all packages directly

### Trade-offs

- **Build Complexity**: Need build orchestration to ensure packages build in dependency order
- **Larger Repository**: Single repository contains all package code, potentially slower clones
- **Shared Dependencies**: All packages must agree on major versions of shared dependencies
- **Workspace Tooling Required**: Developers need npm 7+ or compatible package manager with workspace support

### Common Mistakes

**Mistake 1: Missing workspace configuration**

BAD:

```json
// Root package.json - Missing workspaces field
{
  "name": "alfred",
  "version": "0.1.0",
  "dependencies": {
    "@alfred/core": "file:./packages/core"
  }
}
```

GOOD:

```json
// Root package.json - Proper workspace configuration
{
  "name": "alfred-workspace",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["packages/*"]
}
```

**Why this matters**: Without workspace configuration, npm treats each package independently, duplicating dependencies and breaking cross-package development workflows.

**Mistake 2: Publishing workspace root**

BAD:

```json
// Root package.json - Missing private field
{
  "name": "alfred-workspace",
  "version": "0.1.0",
  "workspaces": ["packages/*"]
}
```

GOOD:

```json
// Root package.json - Marked as private
{
  "name": "alfred-workspace",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["packages/*"]
}
```

**Why this matters**: Workspace roots should never be published. Without `"private": true`, npm will attempt to publish the root package, which contains no useful code.

**Mistake 3: Inconsistent package names**

BAD:

```json
// packages/core/package.json
{ "name": "alfred-core" }

// packages/cli/package.json
{ "name": "@alfred/cli" }
```

GOOD:

```json
// packages/core/package.json
{ "name": "@alfred/core" }

// packages/cli/package.json
{ "name": "@alfred/cli" }
```

**Why this matters**: Inconsistent naming makes package relationships unclear and prevents using scoped package features like namespace grouping.

### Testing Strategy

**What to Test:**

- Workspace commands execute in all packages
- Package dependencies resolve correctly
- Cross-package imports work after build
- Shared dependencies are properly hoisted
- Build order respects package dependencies

**Test Organization:**

- Unit tests in each package test only that package
- Integration tests in root /integration-tests directory
- Script tests in scripts/tests/ directory
- End-to-end tests use built packages

**Mock Strategy:**

- No mocking needed for structure tests
- Use real file system operations
- Test actual npm workspace commands
- Verify package.json files directly

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

describe('Workspace Structure', () => {
  let testRoot: string;

  beforeEach(async () => {
    // Create temporary workspace
    testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'workspace-test-'));
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it('should have valid workspace configuration', async () => {
    // Arrange
    const rootPkg = JSON.parse(await fs.readFile(path.join(testRoot, 'package.json'), 'utf-8'));

    // Act & Assert
    expect(rootPkg.workspaces).to.exist;
    expect(rootPkg.workspaces).to.include('packages/*');
    expect(rootPkg.private).to.be.true;
  });

  it('should install dependencies across all packages', () => {
    // Arrange
    process.chdir(testRoot);

    // Act
    execSync('npm install', { stdio: 'pipe' });

    // Assert
    const nodeModulesExists = fs.existsSync(path.join(testRoot, 'node_modules'));
    expect(nodeModulesExists).to.be.true;
  });

  it('should resolve cross-package dependencies', async () => {
    // Arrange
    const cliPkg = JSON.parse(
      await fs.readFile(path.join(testRoot, 'packages/cli/package.json'), 'utf-8')
    );

    // Act
    const coreDep = cliPkg.dependencies['@alfred/core'];

    // Assert
    expect(coreDep).to.equal('file:../core');
  });

  it('should execute workspace scripts', () => {
    // Arrange
    process.chdir(testRoot);

    // Act - Run build in all workspaces
    const output = execSync('npm run build --workspaces', {
      encoding: 'utf-8',
    });

    // Assert
    expect(output).to.include('@alfred/core');
    expect(output).to.include('@alfred/cli');
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+ for script logic
- Integration coverage: All workspace commands tested
- Package structure: All packages have valid package.json
- Cross-references: All file: dependencies resolve

### Related Patterns

- **[Code Organization](./06-code-organization.md)** - How to structure code within packages
- **[Module Boundaries](./07-module-boundaries.md)** - Defining public/private APIs between packages
- **[Dependency Management](./08-dependency-management.md)** - Managing shared and package-specific dependencies

---

## Pattern 2: Domain-Driven Package Structure

### Intent

Organize package directories by domain concern rather than technical layer to improve code discoverability and reduce coupling.

### Problem

Traditional layered architecture organizes code by technical role: controllers/, services/, models/, utils/. This scatters related domain logic across multiple directories. Finding all code related to a feature requires searching multiple locations. Changes to a feature touch many directories, increasing merge conflicts and cognitive load.

### Solution

Organize directories by domain concern or feature area. Group all code related to a domain (models, services, utilities) in a single directory. Use technical subdirectories only within domain directories when needed. Place truly cross-cutting concerns (logging, error handling) in a separate services/ directory.

### Structure

```
packages/core/src/
├── config/                 # Configuration domain
│   ├── config.ts          # Main config interface
│   ├── loader.ts          # Config loading logic
│   ├── schema.ts          # Validation schemas
│   └── config.test.ts     # Co-located tests
├── core/                   # Core business logic
│   ├── client.ts          # Main orchestration
│   ├── chat.ts            # Chat management
│   ├── contentGenerator.ts
│   └── client.test.ts
├── tools/                  # Tool domain
│   ├── tool-registry.ts   # Tool management
│   ├── tools.ts           # Tool definitions
│   ├── bash.ts            # Bash tool
│   ├── read.ts            # Read tool
│   └── tools.test.ts
├── services/               # Cross-cutting services
│   ├── fileSystemService.ts
│   ├── gitService.ts
│   ├── loopDetectionService.ts
│   └── chatCompressionService.ts
├── mcp/                    # MCP protocol domain
│   ├── client.ts
│   ├── server.ts
│   └── types.ts
├── policy/                 # Policy engine domain
│   ├── policyEngine.ts
│   ├── approvalService.ts
│   └── policy.test.ts
├── telemetry/             # Observability domain
│   ├── telemetry.ts
│   ├── metrics.ts
│   └── logging.ts
├── utils/                  # Generic utilities
│   ├── errors.ts
│   ├── retry.ts
│   └── paths.ts
├── test-utils/            # Test utilities
│   ├── mocks.ts
│   └── fixtures.ts
└── index.ts               # Public API exports
```

### Implementation

**Step 1: Identify domain boundaries**

List major functional areas of your application:

- Configuration management → `config/`
- Core business logic → `core/`
- Tool system → `tools/`
- External protocol integration → `mcp/`
- Policy enforcement → `policy/`
- Observability → `telemetry/`

**Step 2: Create domain directories**

```typescript
// packages/core/src/config/config.ts
import { z } from 'zod';

export interface Config {
  getTargetDir(): string;
  getModel(): string;
  getWorkspaceContext(): WorkspaceContext;
  // ... other accessors grouped by concern
}

// All config-related code stays in config/ directory
```

**Step 3: Implement cross-cutting services separately**

```typescript
// packages/core/src/services/fileSystemService.ts
export interface FileSystemService {
  readTextFile(filePath: string): Promise<string>;
  writeTextFile(filePath: string, content: string): Promise<void>;
  findFiles(fileName: string, searchPaths: readonly string[]): string[];
}

export class RealFileSystemService implements FileSystemService {
  async readTextFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeTextFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
  }

  findFiles(fileName: string, searchPaths: readonly string[]): string[] {
    // Implementation
  }
}
```

**Step 4: Co-locate tests with implementation**

```typescript
// packages/core/src/services/fileSystemService.test.ts
import { describe, it, expect } from 'vitest';
import { RealFileSystemService } from './fileSystemService.js';

describe('RealFileSystemService', () => {
  it('should read text files', async () => {
    // Test implementation
  });
});
```

### Complete Example

```typescript
// packages/core/src/tools/tools.ts
import type { Config } from '../config/config.js';
import { ReadFileTool } from './read.js';
import { WriteFileTool } from './write.js';
import { BashTool } from './bash.js';

// Tool registry - all tool-related code in tools/ directory
export class ToolRegistry {
  private tools: Map<string, AnyDeclarativeTool> = new Map();

  constructor(private config: Config) {
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    this.register('read_file', new ReadFileTool(this.config));
    this.register('write_file', new WriteFileTool(this.config));
    this.register('bash', new BashTool(this.config));
  }

  register(name: string, tool: AnyDeclarativeTool): void {
    this.tools.set(name, tool);
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => tool.getDefinition());
  }

  getTool(name: string): AnyDeclarativeTool | undefined {
    return this.tools.get(name);
  }
}
```

```typescript
// packages/core/src/tools/read.ts
import type { Config } from '../config/config.js';
import type { FileSystemService } from '../services/fileSystemService.js';

// All read tool logic in one place
export class ReadFileTool extends BaseDeclarativeTool {
  constructor(private config: Config) {
    super();
  }

  getDefinition(): FunctionDeclaration {
    return {
      name: 'read_file',
      description: 'Read a file from the filesystem',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Absolute path to file',
          },
        },
        required: ['file_path'],
      },
    };
  }

  build(params: ReadFileToolParams): ToolInvocation {
    return new ReadFileToolInvocation(this.config, params);
  }
}

class ReadFileToolInvocation extends BaseToolInvocation<ReadFileToolParams, ToolResult> {
  constructor(
    private config: Config,
    params: ReadFileToolParams
  ) {
    super(params);
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    const fs = this.config.getFileSystemService();
    const content = await fs.readTextFile(this.params.file_path);

    return {
      llmContent: content,
      returnDisplay: `Read ${this.params.file_path}`,
    };
  }
}
```

```typescript
// packages/core/src/services/loopDetectionService.ts
// Cross-cutting service lives in services/ directory
export class LoopDetectionService {
  private history: ToolCall[] = [];
  private readonly maxRepeats = 3;

  addToolCall(tool: ToolCall): void {
    this.history.push(tool);
  }

  detectLoop(): boolean {
    if (this.history.length < this.maxRepeats) {
      return false;
    }

    const recent = this.history.slice(-this.maxRepeats);
    return this.areAllIdentical(recent);
  }

  private areAllIdentical(calls: ToolCall[]): boolean {
    const first = JSON.stringify(calls[0]);
    return calls.every((call) => JSON.stringify(call) === first);
  }
}
```

**Example explained:**

- Lines 1-25 (tools.ts): Tool registry manages all tools, lives in tools/ directory with other tool code
- Lines 1-45 (read.ts): Complete read tool implementation in single file within tools/ domain
- Lines 1-20 (loopDetectionService.ts): Cross-cutting service in services/ directory, used by multiple domains

### When to Use

**Use domain-driven structure when:**

- Application has clear feature areas or business domains
- Features involve multiple technical layers (models + services + utilities)
- Want to enable feature-based team ownership
- Need to reduce merge conflicts on feature work
- Want code locality for related functionality

**Avoid domain-driven structure when:**

- Application is very small (< 10 files)
- All code is truly a single domain
- Team is organized by technical specialty (DBAs, frontend, backend)
- Technical layers have very different change frequencies

### Benefits

- **Code Locality**: All code for a feature in one place, easy to find and understand
- **Reduced Coupling**: Domains have clear boundaries, dependencies are explicit
- **Team Ownership**: Teams can own entire domains without stepping on each other
- **Easier Refactoring**: Changes to a feature isolated to one directory
- **Better Discoverability**: New developers can explore one domain at a time

### Trade-offs

- **Directory Depth**: More top-level directories than layered architecture
- **Shared Code Complexity**: Need to identify truly cross-cutting concerns vs domain-specific
- **Naming Challenges**: Domain names must be clear and consistent
- **Learning Curve**: Developers accustomed to layered architecture need adjustment

### Common Mistakes

**Mistake 1: Creating technical layer directories**

BAD:

```
src/
├── models/
│   ├── user.ts
│   ├── task.ts
│   └── workflow.ts
├── services/
│   ├── userService.ts
│   ├── taskService.ts
│   └── workflowService.ts
├── controllers/
│   ├── userController.ts
│   ├── taskController.ts
│   └── workflowController.ts
└── utils/
    └── helpers.ts
```

GOOD:

```
src/
├── user/
│   ├── user.ts           # Model
│   ├── userService.ts    # Service
│   └── userController.ts # Controller
├── task/
│   ├── task.ts
│   ├── taskService.ts
│   └── taskController.ts
├── workflow/
│   ├── workflow.ts
│   ├── workflowService.ts
│   └── workflowController.ts
└── services/              # Only cross-cutting services
    └── loggingService.ts
```

**Why this matters**: Technical layers scatter related code across directories, making features hard to understand and change.

**Mistake 2: Misidentifying cross-cutting concerns**

BAD:

```
src/
├── services/              # Everything called "service"
│   ├── userAuthService.ts       # User-specific
│   ├── taskValidationService.ts # Task-specific
│   ├── workflowService.ts       # Workflow-specific
│   └── loggingService.ts        # Actually cross-cutting
```

GOOD:

```
src/
├── auth/
│   └── authService.ts     # Auth domain
├── task/
│   └── validationService.ts # Task domain
├── workflow/
│   └── workflowService.ts  # Workflow domain
└── services/               # Only truly cross-cutting
    ├── loggingService.ts
    └── telemetryService.ts
```

**Why this matters**: services/ should only contain truly cross-cutting concerns used by multiple domains, not domain-specific logic.

### Testing Strategy

**What to Test:**

- Domain directories contain related functionality
- Cross-cutting services have no domain-specific logic
- No circular dependencies between domains
- Public API exports only intended public interfaces
- Tests are co-located with implementation

**Test Organization:**

- Co-locate tests: `feature.ts` → `feature.test.ts`
- Test files mirror source structure
- Integration tests in domain integration-tests/ subdirectory
- Shared test utilities in test-utils/

**Mock Strategy:**

- Mock cross-cutting services when testing domains
- Use interfaces for mockable services
- Avoid mocking within same domain

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('Domain-Driven Structure', () => {
  it('should co-locate tests with implementation', async () => {
    // Arrange
    const srcDir = path.join(process.cwd(), 'packages/core/src');
    const domains = await fs.readdir(srcDir);

    // Act - Check each domain directory
    for (const domain of domains) {
      const domainPath = path.join(srcDir, domain);
      const stat = await fs.stat(domainPath);

      if (!stat.isDirectory()) continue;

      const files = await fs.readdir(domainPath);
      const tsFiles = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
      const testFiles = files.filter((f) => f.endsWith('.test.ts'));

      // Assert - Each domain with implementation should have tests
      if (tsFiles.length > 0) {
        expect(testFiles.length).to.be.greaterThan(0, `Domain ${domain} has no tests`);
      }
    }
  });

  it('should not have circular dependencies between domains', () => {
    // This would use a tool like madge to detect cycles
    // For brevity, showing the concept
    const graph = buildDependencyGraph('packages/core/src');

    // Assert
    const cycles = findCycles(graph);
    expect(cycles).to.have.length(0, `Found circular dependencies: ${cycles}`);
  });

  it('should only have cross-cutting code in services/', async () => {
    // Arrange
    const servicesDir = path.join(process.cwd(), 'packages/core/src/services');
    const files = await fs.readdir(servicesDir);

    // Act & Assert - Check each service is truly cross-cutting
    for (const file of files) {
      if (!file.endsWith('.ts')) continue;

      const content = await fs.readFile(path.join(servicesDir, file), 'utf-8');

      // Services should not import from domain directories
      expect(content).to.not.match(
        /from ['"]\.\.\/(?!services|utils)/,
        `Service ${file} imports from domain directories`
      );
    }
  });
});
```

**Coverage Goals:**

- Structure validation: 100% of domains verified
- Dependency checking: All domain boundaries validated
- Co-location: All implementation files have tests

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Defining public/private APIs within domains
- **[Code Organization](./06-code-organization.md)** - File organization within domain directories
- **[Dependency Management](./08-dependency-management.md)** - Managing cross-domain dependencies

---

## Pattern 3: UI-Logic Separation

### Intent

Completely separate user interface concerns from business logic to enable independent testing and avoid framework coupling.

### Problem

CLI applications often tangle UI code (command parsing, terminal output, interactive prompts) with business logic. This makes core logic dependent on CLI frameworks, prevents reusing logic in other contexts (API, web UI), and requires spinning up full CLI to test business logic. Changes to UI framework require rewriting business logic.

### Solution

Create separate packages for CLI presentation and core business logic. CLI package depends on core, but core has zero dependencies on CLI or UI frameworks. Core exports pure functions and classes that operate on data structures. CLI package wraps core logic with command definitions, terminal UI components, and user interaction.

### Structure

```
packages/
├── core/                    # Business logic - no UI dependencies
│   ├── src/
│   │   ├── workflow/
│   │   │   ├── executor.ts         # Pure logic
│   │   │   ├── state.ts            # Data structures
│   │   │   └── executor.test.ts    # No UI needed
│   │   ├── services/
│   │   └── index.ts                # Public API
│   └── package.json                # No CLI dependencies
│
└── cli/                     # UI layer - depends on core
    ├── src/
    │   ├── commands/
    │   │   ├── workflow.ts         # oclif command
    │   │   └── status.ts           # oclif command
    │   ├── ui/
    │   │   ├── components/         # React/Ink components
    │   │   └── renderers/          # Output rendering
    │   ├── services/
    │   │   └── commandService.ts   # CLI orchestration
    │   └── index.ts                # CLI entry point
    └── package.json                # Depends on @alfred/core
```

### Implementation

**Step 1: Define core business logic with no UI dependencies**

```typescript
// packages/core/src/workflow/executor.ts
// No imports from CLI, oclif, Ink, or any UI framework
import type { Workflow, WorkflowResult } from '../types/workflow.js';
import type { TaskState } from '../types/task.js';

export interface IWorkflowExecutor {
  execute(workflow: Workflow, taskId: string): Promise<WorkflowResult>;
}

export class WorkflowExecutor implements IWorkflowExecutor {
  constructor(
    private claudeClient: ClaudeClient,
    private stateManager: TaskStateManager
  ) {}

  async execute(workflow: Workflow, taskId: string): Promise<WorkflowResult> {
    // Pure business logic - no console.log, no UI rendering
    const state = await this.stateManager.loadState(taskId);

    for (const phase of workflow.phases) {
      const result = await this.executePhase(phase, state);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          completedPhases: state.phases.length,
        };
      }

      await this.stateManager.updatePhase(taskId, result);
    }

    return {
      success: true,
      completedPhases: workflow.phases.length,
    };
  }

  private async executePhase(phase: Phase, state: TaskState): Promise<PhaseResult> {
    // More pure logic...
  }
}
```

**Step 2: Create CLI wrapper that uses core logic**

```typescript
// packages/cli/src/commands/workflow.ts
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { WorkflowExecutor } from '@alfred/core';
import { WorkflowRenderer } from '../ui/renderers/workflow-renderer.js';

// CLI command wraps core logic with UI concerns
export default class Workflow extends BaseCommand<typeof Workflow> {
  static args = {
    name: Args.string({ description: 'Workflow name', required: true }),
  };

  static flags = {
    task: Flags.string({ description: 'Task ID', required: true }),
    ui: Flags.boolean({ description: 'Interactive UI', default: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Workflow);

    // Load workflow from file system (CLI concern)
    const workflow = await this.loadWorkflow(args.name);

    // Create core executor (no UI dependencies)
    const executor = new WorkflowExecutor(this.claudeClient, this.stateManager);

    // Render UI (CLI concern)
    const renderer = new WorkflowRenderer(flags.ui);

    // Execute and render
    renderer.start(workflow);
    const result = await executor.execute(workflow, flags.task);
    renderer.complete(result);

    // Exit code (CLI concern)
    if (!result.success) {
      this.exit(1);
    }
  }

  private async loadWorkflow(name: string): Promise<Workflow> {
    // File system operations - CLI concern
  }
}
```

**Step 3: Package dependencies enforce separation**

```json
// packages/core/package.json
{
  "name": "@alfred/core",
  "dependencies": {
    "xstate": "^5.0.0",
    "zod": "^3.25.76"
    // NO oclif, NO ink, NO CLI frameworks
  }
}
```

```json
// packages/cli/package.json
{
  "name": "@alfred/cli",
  "dependencies": {
    "@alfred/core": "file:../core", // Depends on core
    "@oclif/core": "^4.0.0", // CLI framework
    "ink": "^5.0.0", // Terminal UI
    "react": "^19.0.0" // For Ink
  }
}
```

### Complete Example

```typescript
// packages/core/src/services/taskStateManager.ts
// Pure data operations - no UI
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TaskState, TaskStep } from '../types/task.js';

export interface ITaskStateManager {
  loadState(taskId: string): Promise<TaskState>;
  saveState(taskId: string, state: TaskState): Promise<void>;
  updatePhase(taskId: string, phase: TaskStep): Promise<void>;
}

export class TaskStateManager implements ITaskStateManager {
  constructor(private cwd: string) {}

  async loadState(taskId: string): Promise<TaskState> {
    const statePath = this.getStatePath(taskId);

    try {
      const content = await fs.readFile(statePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return this.createInitialState(taskId);
      }
      throw error;
    }
  }

  async saveState(taskId: string, state: TaskState): Promise<void> {
    const statePath = this.getStatePath(taskId);
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  async updatePhase(taskId: string, phase: TaskStep): Promise<void> {
    const state = await this.loadState(taskId);
    state.phases.push(phase);
    state.updatedAt = new Date().toISOString();
    await this.saveState(taskId, state);
  }

  private getStatePath(taskId: string): string {
    return path.join(this.cwd, '.ai/tasks', taskId, 'state.json');
  }

  private createInitialState(taskId: string): TaskState {
    return {
      taskId,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [],
    };
  }
}
```

```typescript
// packages/cli/src/ui/components/workflow-status.tsx
// React/Ink component - only in CLI package
import React from 'react';
import { Box, Text } from 'ink';
import type { WorkflowResult } from '@alfred/core';

interface Props {
  result: WorkflowResult;
}

export function WorkflowStatus({ result }: Props): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={result.success ? 'green' : 'red'}>
          {result.success ? '[OK]' : '[FAIL]'} Workflow{' '}
          {result.success ? 'completed' : 'failed'}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          Completed {result.completedPhases} phase(s)
        </Text>
      </Box>
      {result.error && (
        <Box marginTop={1}>
          <Text color="red">Error: {result.error}</Text>
        </Box>
      )}
    </Box>
  );
}
```

```typescript
// packages/cli/src/ui/renderers/workflow-renderer.ts
// UI orchestration - only in CLI package
import { render } from 'ink';
import React from 'react';
import { WorkflowStatus } from '../components/workflow-status.js';
import type { Workflow, WorkflowResult } from '@alfred/core';

export class WorkflowRenderer {
  constructor(private interactive: boolean) {}

  start(workflow: Workflow): void {
    if (this.interactive) {
      // Render interactive UI
    } else {
      // Simple console output
      console.log(`Starting workflow: ${workflow.name}`);
    }
  }

  complete(result: WorkflowResult): void {
    if (this.interactive) {
      // Render React component
      render(React.createElement(WorkflowStatus, { result }));
    } else {
      // Simple console output
      console.log(result.success ? 'Workflow completed' : 'Workflow failed');
    }
  }
}
```

**Example explained:**

- taskStateManager.ts (lines 1-50): Pure data operations, no UI, fully testable without CLI
- workflow-status.tsx (lines 1-25): React component only in CLI package, uses core types
- workflow-renderer.ts (lines 1-30): Orchestrates UI rendering, depends on core types but not core logic

### When to Use

**Use UI-logic separation when:**

- Building a CLI that may later need API or web interface
- Core logic is complex enough to benefit from isolated testing
- Want to reuse business logic in multiple contexts
- Team has specialized UI and backend developers
- Want flexibility to change UI framework without rewriting logic

**Avoid UI-logic separation when:**

- Application is very simple (single command, minimal logic)
- No plans to ever reuse logic outside CLI
- Overhead of separate packages outweighs benefits
- Team is very small and separation adds communication overhead

### Benefits

- **Testability**: Core logic tested without spinning up CLI or UI components
- **Reusability**: Core package can be used in API, web UI, or other CLIs
- **Framework Independence**: Can switch UI frameworks without touching core
- **Clear Boundaries**: UI concerns cannot leak into business logic
- **Parallel Development**: UI and logic teams can work independently

### Trade-offs

- **Additional Complexity**: Maintaining two packages instead of one
- **Boilerplate**: Need to create wrapper commands for each core function
- **Debugging**: Errors may span package boundaries
- **Type Coordination**: Must keep shared types in sync between packages

### Common Mistakes

**Mistake 1: Importing UI framework in core package**

BAD:

```typescript
// packages/core/src/workflow/executor.ts
import { Command } from '@oclif/core'; // UI dependency in core
import chalk from 'chalk'; // UI library in core

export class WorkflowExecutor {
  async execute(workflow: Workflow): Promise<void> {
    console.log(chalk.green('Starting workflow')); // Direct UI output
    // ...
  }
}
```

GOOD:

```typescript
// packages/core/src/workflow/executor.ts
// No UI imports at all

export class WorkflowExecutor {
  async execute(workflow: Workflow): Promise<WorkflowResult> {
    // Return data, let CLI handle presentation
    return {
      success: true,
      completedPhases: workflow.phases.length,
    };
  }
}
```

**Why this matters**: UI dependencies in core prevent reusing logic in non-CLI contexts and couple core to specific UI framework.

**Mistake 2: Business logic in CLI commands**

BAD:

```typescript
// packages/cli/src/commands/workflow.ts
export default class Workflow extends BaseCommand {
  async run(): Promise<void> {
    // Business logic directly in command
    const phases = workflow.phases;
    for (const phase of phases) {
      const result = await this.executePhase(phase);
      if (!result.success) {
        this.error('Phase failed');
      }
    }
  }
}
```

GOOD:

```typescript
// packages/cli/src/commands/workflow.ts
import { WorkflowExecutor } from '@alfred/core';

export default class Workflow extends BaseCommand {
  async run(): Promise<void> {
    // Delegate to core logic
    const executor = new WorkflowExecutor(/* deps */);
    const result = await executor.execute(workflow, taskId);

    // CLI only handles presentation
    if (!result.success) {
      this.error('Workflow failed');
    }
  }
}
```

**Why this matters**: Business logic in CLI commands cannot be tested independently or reused in other contexts.

### Testing Strategy

**What to Test:**

- Core package has no UI dependencies in package.json
- Core code imports no UI frameworks
- CLI commands successfully call core logic
- Core logic returns data, doesn't perform IO directly
- All UI rendering isolated in CLI package

**Test Organization:**

- Core tests: Unit tests with no UI, can run headless
- CLI tests: Use @oclif/test for command testing
- Integration tests: Verify CLI commands use core correctly

**Mock Strategy:**

- Core tests: Mock file system, network, but not UI (there is none)
- CLI tests: Mock core services to test UI logic
- Use interfaces for mockability

**Test Example:**

```typescript
// packages/core/src/workflow/executor.test.ts
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { WorkflowExecutor } from './executor.js';
import type { Workflow } from '../types/workflow.js';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let mockClaudeClient: MockClaudeClient;
  let mockStateManager: MockTaskStateManager;

  beforeEach(() => {
    // Arrange - No UI dependencies needed
    mockClaudeClient = new MockClaudeClient();
    mockStateManager = new MockTaskStateManager();
    executor = new WorkflowExecutor(mockClaudeClient, mockStateManager);
  });

  it('should execute workflow phases successfully', async () => {
    // Arrange
    const workflow: Workflow = {
      name: 'test',
      phases: [{ command: 'plan' }, { command: 'implement' }],
    };

    mockClaudeClient.setResponse('plan', { success: true });
    mockClaudeClient.setResponse('implement', { success: true });

    // Act - Pure function call, no CLI needed
    const result = await executor.execute(workflow, 'AL-123');

    // Assert - Check data structure returned
    expect(result.success).to.be.true;
    expect(result.completedPhases).to.equal(2);
  });

  it('should return error on phase failure', async () => {
    // Arrange
    const workflow: Workflow = {
      name: 'test',
      phases: [{ command: 'plan' }],
    };

    mockClaudeClient.setResponse('plan', {
      success: false,
      error: 'Failed to plan',
    });

    // Act
    const result = await executor.execute(workflow, 'AL-123');

    // Assert
    expect(result.success).to.be.false;
    expect(result.error).to.equal('Failed to plan');
  });
});
```

```typescript
// packages/cli/src/commands/workflow.test.ts
import { expect } from 'chai';
import { runCommand } from '@oclif/test';

describe('workflow command', () => {
  it('should execute workflow and display result', async () => {
    // Arrange - Mock core executor
    const mockExecutor = {
      execute: async () => ({
        success: true,
        completedPhases: 2,
      }),
    };

    // Act - Run CLI command
    const { stdout } = await runCommand(
      ['workflow', 'test-workflow', '--task', 'AL-123'],
      process.cwd()
    );

    // Assert - Check UI output
    expect(stdout).to.contain('Workflow completed');
    expect(stdout).to.contain('2 phase(s)');
  });
});
```

**Coverage Goals:**

- Core package: 80%+ line coverage, testable without UI
- CLI package: 70%+ line coverage (UI harder to test)
- Dependency verification: 100% (no UI deps in core)

### Related Patterns

- **[Monorepo with npm Workspaces](#pattern-1-monorepo-with-npm-workspaces)** - Enables package separation
- **[Module Boundaries](./07-module-boundaries.md)** - Defining public APIs between packages
- **[Dependency Management](./08-dependency-management.md)** - Managing package dependencies

---

## Quick Reference

### Pattern Summary Table

| Pattern                         | Use When                                    | Avoid When                       | Key Benefit                               |
| ------------------------------- | ------------------------------------------- | -------------------------------- | ----------------------------------------- |
| Monorepo with npm Workspaces    | Building multi-package CLI with shared code | Single simple application        | Unified tooling and dependency management |
| Domain-Driven Package Structure | Application has clear feature areas         | Very small codebase (< 10 files) | Code locality and reduced coupling        |
| UI-Logic Separation             | CLI may need API/web interface later        | Very simple single-command CLI   | Testability and reusability               |

### Code Snippets

**Monorepo with npm Workspaces - Minimal Example:**

```json
{
  "name": "alfred-workspace",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm test --workspaces"
  }
}
```

**Domain-Driven Package Structure - Minimal Example:**

```
src/
├── tools/              # Tool domain - all tool code
│   ├── registry.ts
│   ├── read.ts
│   └── write.ts
├── workflow/           # Workflow domain - all workflow code
│   ├── executor.ts
│   └── state.ts
└── services/           # Only cross-cutting services
    └── logging.ts
```

**UI-Logic Separation - Minimal Example:**

```typescript
// packages/core/src/executor.ts - No UI dependencies
export class Executor {
  async execute(): Promise<Result> {
    return { success: true };
  }
}

// packages/cli/src/commands/run.ts - UI only
import { Executor } from '@alfred/core';
export default class Run extends Command {
  async run() {
    const result = await new Executor().execute();
    this.log(result.success ? 'Done' : 'Failed');
  }
}
```

---

## Enforcement

**NPM Workspace Configuration:**

```json
{
  "workspaces": ["packages/*"],
  "private": true
}
```

**Dependency Validation Script:**

```typescript
// scripts/validate-dependencies.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function validateCoreDependencies() {
  const corePkg = JSON.parse(await fs.readFile('packages/core/package.json', 'utf-8'));

  // Core must not depend on UI frameworks
  const forbiddenDeps = ['@oclif/core', 'ink', 'react', 'chalk'];
  const deps = Object.keys(corePkg.dependencies || {});

  const violations = deps.filter((dep) => forbiddenDeps.includes(dep));

  if (violations.length > 0) {
    throw new Error(`Core package has forbidden UI dependencies: ${violations.join(', ')}`);
  }
}

validateCoreDependencies();
```

**Pre-commit Hook:**

```json
{
  "lint-staged": {
    "package.json": ["node scripts/validate-dependencies.ts"]
  }
}
```

**Build-Time Checks:**

```bash
# Verify workspace structure
npm run build --workspaces  # Fails if dependencies incorrect

# Validate package structure
node scripts/validate-structure.js

# Check for circular dependencies
npx madge --circular packages/
```

---

## Related Patterns

- **[Code Organization](./06-code-organization.md)** - How to structure code within packages and domains
- **[Module Boundaries](./07-module-boundaries.md)** - Defining public/private APIs between modules
- **[Dependency Management](./08-dependency-management.md)** - Managing dependencies across packages
- **[Testing Patterns](./05-testing-patterns.md)** - Testing strategies for monorepo structure

---

## References

**Source Code Examples:**

- [examplecode/gemini/package.json](../../../examplecode/gemini/package.json) - Workspace configuration example
- [examplecode/gemini/packages/core/package.json](../../../examplecode/gemini/packages/core/package.json) - Core package configuration
- [examplecode/gemini/packages/cli/package.json](../../../examplecode/gemini/packages/cli/package.json) - CLI package configuration
- [examplecode/gemini/packages/core/src/](../../../examplecode/gemini/packages/core/src/) - Domain-driven structure example

**External Resources:**

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces) - Official npm workspace guide
- [Monorepo Tools](https://monorepo.tools/) - Comparison of monorepo tooling
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html) - Conceptual foundation

**Further Reading:**

- [Why Monorepos](https://monorepo.tools/#why-monorepos) - Benefits and trade-offs of monorepos
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - Advanced TypeScript monorepo features

---

## Changelog

- **2025-01-21**: Initial project structure patterns documentation with three core patterns
- **2025-01-21**: Added complete examples from reference codebase
- **2025-01-21**: Added comprehensive testing strategies for each pattern
- **2025-01-21**: Added enforcement section with validation scripts
