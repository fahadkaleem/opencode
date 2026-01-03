---
title: Code Organization Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - All Packages
  - Core Package
  - CLI Package
  - Test Files
related_patterns:
  - ./07-module-boundaries.md
  - ./05-testing-patterns.md#co-location
  - ./03-type-safety-patterns.md#interfaces
---

# 6. Code Organization Patterns

> **Purpose**: Comprehensive code organization patterns covering file naming, variable naming, import ordering, directory structure, and co-location strategies for maintainable TypeScript projects.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: File Naming Conventions](#pattern-1-file-naming-conventions)
- [Pattern 2: Variable and Function Naming](#pattern-2-variable-and-function-naming)
- [Pattern 3: Import Organization](#pattern-3-import-organization)
- [Pattern 4: Single Responsibility Per File](#pattern-4-single-responsibility-per-file)
- [Pattern 5: Co-located Tests](#pattern-5-co-located-tests)
- [Pattern 6: Feature-Based Directory Structure](#pattern-6-feature-based-directory-structure)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Code organization determines how quickly developers can navigate, understand, and modify a codebase. Consistent organization patterns reduce cognitive load, making it easier to locate files, understand dependencies, and maintain code quality over time.

Effective code organization goes beyond personal preference. It establishes team-wide conventions that enable developers to predict where code lives, what files contain, and how modules interact. This predictability accelerates onboarding, reduces merge conflicts, and improves long-term maintainability.

**Why code organization matters:**

- Reduces time to find relevant files and dependencies
- Improves code navigation through predictable structure
- Prevents naming conflicts and import confusion
- Enables automated tooling (linters, bundlers, test runners)
- Facilitates team collaboration through shared conventions
- Makes refactoring safer by clarifying module boundaries

**In this document:**

- **File Naming Conventions** - kebab-case for TypeScript, PascalCase for React components
- **Variable and Function Naming** - Consistent casing conventions for all code elements
- **Import Organization** - Structured import ordering for readability
- **Single Responsibility Per File** - One class or related exports per file
- **Co-located Tests** - Tests alongside source files, not in separate directories
- **Feature-Based Directory Structure** - Organizing by feature domain instead of technical role

**Prerequisites:**

- Understanding of TypeScript and ES modules
- Familiarity with Node.js module resolution
- Basic knowledge of testing frameworks

---

## Pattern 1: File Naming Conventions

### Intent

Establish consistent file naming patterns that clearly indicate file type and purpose.

### Problem

Inconsistent file naming creates confusion about what files contain. Mixed naming conventions (camelCase, PascalCase, snake_case) make it difficult to locate files and understand their purpose. Without clear patterns, developers waste time searching for files and trying different naming variations.

### Solution

Use strict naming conventions based on file type: kebab-case for TypeScript source files, PascalCase for React components, and descriptive suffixes for specialized files (.test.ts, .config.ts). This creates predictable file names that clearly indicate content and purpose.

### Structure

```
src/
├── file-system-service.ts         # kebab-case for services
├── file-system-service.test.ts    # .test.ts suffix for tests
├── authentication-service.ts      # kebab-case for all TS files
├── authentication-service.test.ts
├── AppHeader.tsx                  # PascalCase for React components
├── AppHeader.test.tsx
└── config/
    ├── eslint.config.ts           # .config.ts for configuration
    └── vitest.config.ts
```

### Implementation

**Step 1: Apply kebab-case to TypeScript source files**

```typescript
// packages/cli/src/config/extension-manager.ts
export class ExtensionManager {
  // Implementation
}
```

**Step 2: Use PascalCase for React component files**

```typescript
// packages/cli/src/ui/components/AppHeader.tsx
export function AppHeader({ version }: AppHeaderProps) {
  return <Box>{/* ... */}</Box>;
}
```

**Step 3: Add .test suffix for test files**

```typescript
// packages/cli/src/config/extension-manager.test.ts
import { expect } from 'chai';
import { ExtensionManager } from './extension-manager.js';

describe('ExtensionManager', () => {
  it('should load extensions', () => {
    // Test implementation
  });
});
```

**Step 4: Use descriptive suffixes for specialized files**

```typescript
// vitest.config.ts - Standard tooling convention
export default defineConfig({
  test: {
    // Configuration
  },
});

// types.ts - Type definitions
export type UserId = string;
export interface User {
  /* ... */
}

// constants.ts - Constants and enumerations
export const MAX_RETRY_ATTEMPTS = 3;
```

### Complete Example

Real examples from codebase:

```
packages/cli/src/
├── config/
│   ├── config.ts                    # kebab-case source
│   ├── config.test.ts               # Co-located test
│   ├── settings.ts
│   ├── extension-manager.ts         # Multi-word kebab-case
│   └── extension-manager.test.ts
├── ui/
│   ├── components/
│   │   ├── Footer.tsx               # PascalCase React component
│   │   ├── Footer.test.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppHeader.test.tsx
│   │   └── ThemedGradient.tsx
│   └── contexts/
│       ├── UIStateContext.tsx       # PascalCase for contexts
│       ├── ConfigContext.tsx
│       └── VimModeContext.tsx
├── commands/
│   ├── extensions.tsx               # kebab-case even for commands
│   ├── extensions.test.tsx
│   ├── mcp.ts
│   └── mcp.test.ts
└── utils/
    ├── version.ts                   # kebab-case utilities
    ├── cleanup.ts
    └── session-utils.ts
```

**Example explained:**

- Lines 1-6: Config directory uses kebab-case with .test.ts suffix
- Lines 7-14: UI components use PascalCase.tsx for React components
- Lines 15-18: Contexts follow same PascalCase convention
- Lines 19-23: Commands use kebab-case regardless of content
- Lines 24-27: Utilities consistently use kebab-case

### When to Use

**Use kebab-case for:**

- All TypeScript source files (.ts)
- Service files
- Utility files
- Configuration files
- Test files (with .test.ts suffix)

**Use PascalCase for:**

- React component files (.tsx)
- React context provider files
- React hook files (although exported as `useXxx`)

**Use descriptive suffixes for:**

- Test files (.test.ts or .test.tsx)
- Type definition files (.d.ts)
- Configuration files (.config.ts)

### Benefits

- **Predictability**: Developers know what convention to expect for each file type
- **Tooling Compatibility**: Consistent naming works with all build tools and bundlers
- **Readability**: kebab-case is easier to read than camelCase in file systems
- **Convention Alignment**: Matches industry-standard practices for TypeScript projects
- **Search Efficiency**: Easy to glob for specific file types

### Trade-offs

- **Learning Curve**: New team members must learn multiple conventions
- **Migration Cost**: Renaming files in existing projects requires careful refactoring
- **Windows Sensitivity**: Case-insensitive file systems can cause confusion if not careful

### Common Mistakes

**Mistake 1: Mixing camelCase and kebab-case for source files**

Bad example:

```
src/
├── fileSystemService.ts    # camelCase
├── authentication-service.ts  # kebab-case
└── UserManager.ts          # PascalCase
```

Correct approach:

```
src/
├── file-system-service.ts  # All kebab-case
├── authentication-service.ts
└── user-manager.ts
```

**Why this matters**: Inconsistent naming makes files harder to locate. Developers must try multiple variations to find files.

**Mistake 2: Using PascalCase for non-component TypeScript files**

Bad example:

```
src/
├── AuthenticationService.ts  # PascalCase for service
├── ConfigLoader.ts           # PascalCase for utility
```

Correct approach:

```
src/
├── authentication-service.ts  # kebab-case for services
├── config-loader.ts           # kebab-case for utilities
```

**Why this matters**: PascalCase should be reserved for React components to clearly distinguish UI files from business logic files.

### Testing Strategy

**What to Test:**

- Automated linting rules enforce naming conventions
- Pre-commit hooks verify file names match patterns
- CI checks prevent files with incorrect naming from being merged

**Test Organization:**

- Use file system globbing to verify patterns
- Integrate with ESLint or custom scripts
- Run checks in CI pipeline

**Mock Strategy:**

- Not applicable - naming conventions are structural, not logic

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { glob } from 'glob';
import * as path from 'node:path';

describe('File Naming Conventions', () => {
  it('should use kebab-case for all TypeScript source files', async () => {
    // Arrange: Find all .ts files (excluding .test.ts)
    const tsFiles = await glob('src/**/*.ts', {
      ignore: ['**/*.test.ts', '**/*.d.ts', '**/*.config.ts'],
    });

    // Act: Check each file name
    const violations = tsFiles.filter((file) => {
      const fileName = path.basename(file, '.ts');
      // Check if kebab-case: lowercase letters, numbers, and hyphens only
      return !/^[a-z0-9-]+$/.test(fileName);
    });

    // Assert: No violations
    expect(violations).to.be.empty;
  });

  it('should use PascalCase for React component files', async () => {
    // Arrange: Find all .tsx files (excluding .test.tsx)
    const tsxFiles = await glob('src/**/*.tsx', {
      ignore: ['**/*.test.tsx'],
    });

    // Act: Check each file name
    const violations = tsxFiles.filter((file) => {
      const fileName = path.basename(file, '.tsx');
      // Check if PascalCase: starts with uppercase, contains no hyphens/underscores
      return !/^[A-Z][a-zA-Z0-9]*$/.test(fileName);
    });

    // Assert: No violations
    expect(violations).to.be.empty;
  });

  it('should use .test.ts suffix for all test files', async () => {
    // Arrange: Find all test-related files
    const testFiles = await glob('src/**/*.test.{ts,tsx}');

    // Assert: Test files exist and follow pattern
    expect(testFiles.length).to.be.greaterThan(0);

    testFiles.forEach((testFile) => {
      expect(testFile).to.match(/\.test\.(ts|tsx)$/);
    });
  });
});
```

**Coverage Goals:**

- 100% of source files follow naming convention
- Automated checks prevent violations

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - File naming supports clear module boundaries
- **[Co-located Tests](./06-code-organization.md#pattern-5-co-located-tests)** - Test file naming convention

---

## Pattern 2: Variable and Function Naming

### Intent

Use consistent naming conventions for all code elements to improve readability and reduce cognitive load.

### Problem

Inconsistent naming conventions create confusion about code element types. Without clear patterns, developers cannot distinguish constants from variables, classes from interfaces, or public methods from private ones. This ambiguity slows code comprehension and increases the likelihood of errors.

### Solution

Apply specific casing conventions based on code element type: camelCase for functions and variables, PascalCase for classes and interfaces, UPPER_SNAKE_CASE for constants, and underscore prefix for private members. This creates visual distinction between different code elements.

### Structure

```typescript
// Constants
const MAX_RETRY_ATTEMPTS = 3;

// Functions
function calculateTotal(items: Item[]): number {}

// Classes
class UserService {}

// Interfaces (no I prefix)
interface Config {}

// Types
type UserId = string;

// Private members
class Service {
  private _cache: Map<string, unknown>;
  private _initialized = false;

  private _resetCache(): void {}
}
```

### Implementation

**Step 1: Use camelCase for functions and variables**

```typescript
// packages/cli/src/config/config.ts
export async function parseArguments(settings: Settings): Promise<CliArgs> {
  // Implementation
}

export function isDebugMode(argv: CliArgs): boolean {
  return argv.debug === true;
}

export async function loadCliConfig(
  settings: Settings,
  sessionId: string,
  argv: CliArgs,
  cwd: string = process.cwd()
): Promise<Config> {
  // Implementation
}
```

**Step 2: Use PascalCase for classes and interfaces**

```typescript
// packages/a2a-server/src/agent/task.ts
class Task {
  id: string;
  contextId: string;
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }
}

// packages/a2a-server/src/commands/command-registry.ts
class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
  }
}

// packages/cli/src/config/config.ts
export interface CliArgs {
  query: string | undefined;
  model: string | undefined;
  sandbox: boolean | string | undefined;
}

export interface ExtensionConfig {
  name: string;
  version: string;
  mcpServers?: Record<string, MCPServerConfig>;
}
```

**Step 3: Use UPPER_SNAKE_CASE for constants**

```typescript
// packages/cli/src/config/settings.ts
export const USER_SETTINGS_PATH = Storage.getGlobalSettingsPath();
export const USER_SETTINGS_DIR = path.dirname(USER_SETTINGS_PATH);
export const DEFAULT_EXCLUDED_ENV_VARS = ['DEBUG', 'DEBUG_MODE'];

const MIGRATE_V2_OVERWRITE = true;

const MIGRATION_MAP: Record<string, string> = {
  accessibility: 'ui.accessibility',
  allowedTools: 'tools.allowed',
  excludedTools: 'tools.excluded',
};
```

**Step 4: Use underscore prefix for private members**

```typescript
// packages/a2a-server/src/agent/task.ts
class Task {
  // Public properties
  id: string;
  contextId: string;
  config: Config;

  // Private properties with underscore prefix
  private pendingToolCalls: Map<string, string> = new Map();
  private toolCompletionPromise?: Promise<void>;
  private toolCompletionNotifier?: {
    resolve: () => void;
    reject: (reason?: Error) => void;
  };

  // Private methods with underscore prefix
  private _resetToolCompletionPromise(): void {
    this.toolCompletionPromise = new Promise((resolve, reject) => {
      this.toolCompletionNotifier = { resolve, reject };
    });
  }

  private _registerToolCall(toolCallId: string, status: string): void {
    this.pendingToolCalls.set(toolCallId, status);
  }

  private _resolveToolCall(toolCallId: string): void {
    this.pendingToolCalls.delete(toolCallId);
  }
}
```

**Step 5: Use useXxx pattern for React hooks**

```typescript
// packages/cli/src/ui/components/Footer.tsx
const uiState = useUIState();
const config = useConfig();
const settings = useSettings();
const { vimEnabled, vimMode } = useVimMode();
```

**Step 6: Use isXxx/hasXxx pattern for type guards and boolean functions**

```typescript
// packages/cli/src/config/config.ts
export function isDebugMode(argv: CliArgs): boolean {
  return argv.debug === true;
}

function isWorkspaceTrusted(settings: Settings): boolean {
  return settings.trustedWorkspaces?.includes(cwd) ?? false;
}

// Type guard with 'is' predicate
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

### Complete Example

Real example from codebase showing all conventions:

```typescript
// packages/a2a-server/src/agent/task.ts
import type { Config } from '../config/config.js';
import type { Message } from '../types.js';

// Constants
const MAX_TOOL_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30000;

// Interface (PascalCase, no I prefix)
interface TaskOptions {
  id: string;
  contextId: string;
  config: Config;
}

// Type alias (PascalCase)
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// Class (PascalCase)
class Task {
  // Public properties (camelCase)
  id: string;
  contextId: string;
  config: Config;
  status: TaskStatus;

  // Private properties (_camelCase)
  private _pendingToolCalls: Map<string, string> = new Map();
  private _toolCompletionPromise?: Promise<void>;
  private _retryCount = 0;

  // Constructor
  constructor(options: TaskOptions) {
    this.id = options.id;
    this.contextId = options.contextId;
    this.config = options.config;
    this.status = 'pending';
  }

  // Public method (camelCase)
  async execute(): Promise<void> {
    this.status = 'running';
    await this._runTask();
    this.status = 'completed';
  }

  // Private method (_camelCase)
  private async _runTask(): Promise<void> {
    this._resetToolCompletionPromise();
    // Implementation
  }

  private _resetToolCompletionPromise(): void {
    this._toolCompletionPromise = new Promise((resolve, reject) => {
      // Setup promise
    });
  }

  // Type guard (isXxx pattern)
  private _isRetryableError(error: unknown): error is Error {
    return error instanceof Error && this._retryCount < MAX_TOOL_RETRIES;
  }

  // Boolean check (hasXxx pattern)
  hasCompletedToolCalls(): boolean {
    return this._pendingToolCalls.size === 0;
  }
}

// Factory function (camelCase)
export function createTask(options: TaskOptions): Task {
  return new Task(options);
}

// Type guard function (isXxx pattern)
export function isTask(value: unknown): value is Task {
  return value instanceof Task;
}
```

**Example explained:**

- Lines 5-6: Constants use UPPER_SNAKE_CASE
- Lines 9-13: Interface uses PascalCase without I prefix
- Line 16: Type alias uses PascalCase
- Line 19: Class uses PascalCase
- Lines 21-24: Public properties use camelCase
- Lines 27-29: Private properties use \_camelCase prefix
- Lines 37-40: Public methods use camelCase
- Lines 43-55: Private methods use \_camelCase prefix
- Lines 58-60: Type guard uses isXxx pattern
- Lines 63-65: Boolean check uses hasXxx pattern
- Lines 70-72: Factory function uses camelCase
- Lines 75-77: Exported type guard uses isXxx pattern

### When to Use

**Use camelCase for:**

- Functions and methods
- Variables and parameters
- Object properties

**Use PascalCase for:**

- Classes
- Interfaces (without I prefix)
- Type aliases
- React components
- Enums

**Use UPPER_SNAKE_CASE for:**

- Module-level constants
- Configuration values that never change
- Magic numbers converted to named constants

**Use \_camelCase for:**

- Private class methods
- Private class properties
- Internal implementation details

**Use useXxx for:**

- React hooks

**Use isXxx/hasXxx for:**

- Type guard functions
- Boolean check functions

### Benefits

- **Instant Recognition**: Naming convention reveals code element type at a glance
- **IDE Support**: Consistent naming improves autocomplete and IntelliSense
- **Reduced Errors**: Clear distinction between constants and variables prevents accidental reassignment
- **Team Alignment**: Shared conventions eliminate naming debates
- **Refactoring Safety**: Tools can reliably find all usages of consistently named elements

### Trade-offs

- **Verbosity**: Underscore prefix for private members adds visual noise
- **Convention Overload**: Multiple conventions require memorization
- **Legacy Code**: Renaming existing code is time-consuming and risky

### Common Mistakes

**Mistake 1: Using I prefix for interfaces**

Bad example:

```typescript
interface IUserService {
  getUser(id: string): Promise<User>;
}

class UserService implements IUserService {
  // Implementation
}
```

Correct approach:

```typescript
interface UserService {
  getUser(id: string): Promise<User>;
}

class UserServiceImpl implements UserService {
  // Implementation
}

// Or better: use the interface name directly for the class
class UserService implements UserService {
  // TypeScript allows this - interface and class in different namespaces
}
```

**Why this matters**: Modern TypeScript style guides discourage I prefix. Interfaces are first-class citizens, not auxiliary types.

**Mistake 2: Using camelCase for constants**

Bad example:

```typescript
const maxRetryAttempts = 3;
const defaultTimeoutMs = 5000;
```

Correct approach:

```typescript
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
```

**Why this matters**: UPPER_SNAKE_CASE visually distinguishes constants from variables, preventing accidental reassignment attempts.

**Mistake 3: Not using underscore prefix for private members**

Bad example:

```typescript
class Service {
  private cache: Map<string, unknown>;
  private initialized = false;

  private resetCache(): void {}
}
```

Correct approach:

```typescript
class Service {
  private _cache: Map<string, unknown>;
  private _initialized = false;

  private _resetCache(): void {}
}
```

**Why this matters**: Underscore prefix makes private members visually distinct, especially in classes with many members.

### Testing Strategy

**What to Test:**

- Linting rules enforce naming conventions
- Code review checks verify compliance
- Automated tools scan for violations

**Test Organization:**

- Use ESLint rules for automated enforcement
- Integrate checks into CI pipeline
- Run linters before commits

**Mock Strategy:**

- Not applicable - naming conventions are structural

**Test Example:**

```typescript
// ESLint configuration enforces naming conventions
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "function",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "custom": {
          "regex": "^I[A-Z]",
          "match": false
        }
      },
      {
        "selector": "memberLike",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      }
    ]
  }
}
```

**Coverage Goals:**

- 100% of code follows naming conventions
- Zero linting violations in CI

### Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Interfaces use PascalCase without I prefix
- **[Module Boundaries](./07-module-boundaries.md)** - Public API uses consistent naming

---

## Pattern 3: Import Organization

### Intent

Organize imports in a consistent, predictable order to improve code readability and reduce merge conflicts.

### Problem

Unorganized imports create visual clutter and make it difficult to understand file dependencies. Random import ordering obscures which dependencies are external versus internal, and makes it harder to spot missing or duplicate imports. Inconsistent import organization leads to frequent merge conflicts when multiple developers modify the same file.

### Solution

Group imports into distinct categories with consistent ordering: Node.js built-ins first, external dependencies second, internal modules third, and type-only imports last. Use blank lines to separate groups and maintain alphabetical order within each group.

### Structure

```typescript
// 1. Node.js built-ins (with node: protocol)
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import process from 'node:process';

// 2. External dependencies (alphabetical)
import { Command, Flags } from '@oclif/core';
import express from 'express';
import { z } from 'zod';

// 3. Internal modules (relative imports with .js extension)
import { loadConfig } from './config-loader.js';
import { ValidationError } from './errors.js';
import { UserService } from '../services/user-service.js';

// 4. Type-only imports (last, separate group)
import type { User } from './types.js';
import type { ApiResponse } from '../types/api.js';
```

### Implementation

**Step 1: Import Node.js built-ins with node: protocol**

```typescript
// packages/cli/src/config/config.ts
import process from 'node:process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
```

**Step 2: Import external dependencies**

```typescript
// packages/cli/src/ui/components/Footer.tsx
import { Box, Text } from 'ink';
import { shortenPath, tildeifyPath } from '@google/gemini-cli-core';
```

**Step 3: Import internal modules with .js extension**

```typescript
// packages/cli/src/config/config.ts
import type { Settings } from './settings.js';
import { getCliVersion } from '../utils/version.js';
import { loadSandboxConfig } from './sandboxConfig.js';
import { resolvePath } from '../utils/resolvePath.js';
import { appEvents } from '../utils/events.js';
import { RESUME_LATEST } from '../utils/sessionUtils.js';
import { isWorkspaceTrusted } from './trustedFolders.js';
import { createPolicyEngineConfig } from './policy.js';
import { ExtensionManager } from './extension-manager.js';
```

**Step 4: Use type-only imports for types**

```typescript
// packages/cli/src/ui/components/Footer.tsx
import type React from 'react';

// packages/cli/src/config/config.ts
import type { ExtensionEvents } from '@google/gemini-cli-core/src/utils/extensionLoader.js';
import type { EventEmitter } from 'node:stream';
```

### Complete Example

Real example from codebase:

```typescript
// packages/cli/src/ui/components/Footer.tsx

// 1. Type-only React imports at top (special case for React)
import type React from 'react';

// 2. Node.js built-ins (with node: protocol)
import process from 'node:process';

// 3. Third-party dependencies (external)
import { Box, Text } from 'ink';

// 4. Internal package dependencies
import { shortenPath, tildeifyPath } from '@google/gemini-cli-core';

// 5. Internal module imports (relative with .js)
import { theme } from '../semantic-colors.js';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import { ThemedGradient } from './ThemedGradient.js';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { DebugProfiler } from './DebugProfiler.js';
import { isDevelopment } from '../../utils/installationInfo.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';

export const Footer: React.FC = () => {
  const uiState = useUIState();
  const config = useConfig();
  const settings = useSettings();
  const { vimEnabled, vimMode } = useVimMode();

  // Component implementation
};
```

Another real example:

```typescript
// packages/cli/src/config/config.ts

// Node.js built-ins
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import process from 'node:process';

// Third-party dependencies
import { mcpCommand } from '../commands/mcp.js';
import type { OutputFormat } from '@google/gemini-cli-core';
import { extensionsCommand } from '../commands/extensions.js';
import {
  Config,
  setGeminiMdFilename as setServerGeminiMdFilename,
  getCurrentGeminiMdFilename,
  WorkspaceContext,
  ExternalSearchProvider,
  BuiltInSearchProviders,
} from '@google/gemini-cli-core';

// Internal modules (relative with .js)
import type { Settings } from './settings.js';
import { getCliVersion } from '../utils/version.js';
import { loadSandboxConfig } from './sandboxConfig.js';
import { resolvePath } from '../utils/resolvePath.js';
import { appEvents } from '../utils/events.js';
import { RESUME_LATEST } from '../utils/sessionUtils.js';
import { isWorkspaceTrusted } from './trustedFolders.js';
import { createPolicyEngineConfig } from './policy.js';
import { ExtensionManager } from './extension-manager.js';

// Type-only imports
import type { ExtensionEvents } from '@google/gemini-cli-core/src/utils/extensionLoader.js';
import type { EventEmitter } from 'node:stream';

export async function parseArguments(settings: Settings): Promise<CliArgs> {
  // Implementation
}
```

**Example explained:**

- Footer.tsx: Clear separation of React imports, Node.js built-ins, third-party, internal, with all internal imports using .js extension
- config.ts: Groups built-ins, external dependencies, internal modules, and type-only imports in distinct sections

### When to Use

**Always apply this pattern:**

- In every TypeScript and JavaScript file
- Regardless of file size or complexity
- From the beginning of a new file

**Use blank lines to separate:**

- Node.js built-ins from external dependencies
- External dependencies from internal modules
- Value imports from type-only imports

**Use alphabetical ordering within:**

- External dependencies group
- Internal modules group (optional but recommended)

### Benefits

- **Readability**: Clear visual separation of import groups
- **Dependency Awareness**: Easy to see external vs internal dependencies
- **Merge Conflict Reduction**: Consistent ordering reduces conflicts
- **Tooling Support**: Automated formatters can enforce ordering
- **Quick Scanning**: Developers can quickly find specific imports

### Trade-offs

- **Initial Setup**: Requires configuring ESLint or Prettier
- **Maintenance**: Must be enforced consistently across team
- **Learning Curve**: New developers must learn the convention

### Common Mistakes

**Mistake 1: Missing .js extension in ES module imports**

Bad example:

```typescript
import { loadConfig } from './config-loader'; // Missing .js
import { ValidationError } from './errors'; // Missing .js
```

Correct approach:

```typescript
import { loadConfig } from './config-loader.js';
import { ValidationError } from './errors.js';
```

**Why this matters**: ES modules require explicit file extensions. TypeScript compiles .ts to .js, so imports must reference .js even in .ts files.

**Mistake 2: Not using node: protocol for Node.js built-ins**

Bad example:

```typescript
import * as path from 'path';
import * as fs from 'fs/promises';
import process from 'process';
```

Correct approach:

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import process from 'node:process';
```

**Why this matters**: The node: protocol explicitly marks built-in modules, preventing confusion with npm packages of the same name.

**Mistake 3: Mixing value and type imports**

Bad example:

```typescript
import { User, createUser, type UserOptions } from './user.js';
```

Correct approach:

```typescript
import { User, createUser } from './user.js';
import type { UserOptions } from './user.js';
```

**Why this matters**: Separating type-only imports enables better tree-shaking and makes type-only dependencies explicit.

### Testing Strategy

**What to Test:**

- ESLint rules enforce import ordering
- Pre-commit hooks check import organization
- CI pipeline verifies no import violations

**Test Organization:**

- Configure import/order ESLint rule
- Run linter in CI
- Use Prettier to auto-format on save

**Mock Strategy:**

- Not applicable - import organization is structural

**Test Example:**

```json
// .eslintrc.json
{
  "plugins": ["import"],
  "rules": {
    "import/order": [
      "error",
      {
        "groups": [
          "builtin", // Node.js built-ins
          "external", // npm packages
          "internal", // Internal modules
          "parent", // Parent directory imports
          "sibling", // Sibling file imports
          "type" // Type-only imports
        ],
        "pathGroups": [
          {
            "pattern": "node:*",
            "group": "builtin",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "import/extensions": ["error", "always", { "ignorePackages": true }]
  }
}
```

**Coverage Goals:**

- 100% of files follow import organization
- Zero import ordering violations in CI

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Import organization supports clear module boundaries
- **[ES Modules](./07-module-boundaries.md#pattern-3-es-module-standards)** - Requires .js extension usage

---

## Pattern 4: Single Responsibility Per File

### Intent

Each file exports one primary class or a cohesive group of related functions, promoting focused, maintainable modules.

### Problem

Files that export many unrelated functions and classes become grab-bag utilities that are difficult to understand, test, and refactor. When files have multiple responsibilities, changes to one export can unintentionally break others. Large multi-purpose files obscure dependencies and make it hard to understand what imports are needed.

### Solution

Limit each file to one primary export or a small group of closely related exports. Use index.ts files to aggregate exports from a directory. This creates focused modules with clear responsibilities and explicit dependencies.

### Structure

```
src/services/
├── user-service.ts         # Exports UserService class only
├── order-service.ts        # Exports OrderService class only
├── errors.ts               # Exports related error classes
├── types.ts                # Exports related type definitions
└── index.ts                # Re-exports from above files
```

### Implementation

**Step 1: One class per file for services**

```typescript
// packages/a2a-server/src/agent/task.ts
export class Task {
  id: string;
  contextId: string;
  config: Config;

  constructor(options: TaskOptions) {
    this.id = options.id;
    this.contextId = options.contextId;
    this.config = options.config;
  }

  async execute(): Promise<void> {
    // Implementation
  }
}

// Only export the Task class from this file
```

**Step 2: Group related types in a types file**

```typescript
// packages/a2a-server/src/types.ts
export enum CoderAgentEvent {
  AGENT_START = 'agentStart',
  AGENT_FINISH = 'agentFinish',
  TASK_FAILURE = 'taskFailure',
}

export interface CoderAgentMessage {
  event: CoderAgentEvent;
  data: unknown;
}

export interface TaskOptions {
  id: string;
  contextId: string;
  config: Config;
}

// All related type definitions together
```

**Step 3: Group related errors in an errors file**

```typescript
// packages/cli/src/utils/errors.ts
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Related error classes together
```

**Step 4: Use index.ts for directory-level re-exports**

```typescript
// packages/cli/src/services/index.ts
export { UserService } from './user-service.js';
export { OrderService } from './order-service.js';
export { PaymentService } from './payment-service.js';
export * from './types.js';
export * from './errors.js';

// Aggregates exports for convenient importing
```

### Complete Example

Real example from codebase:

```typescript
// packages/a2a-server/src/commands/command-registry.ts
// Single class, single responsibility

import type { Command } from './types.js';

export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  get(commandName: string): Command | undefined {
    return this.commands.get(commandName);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}

// File exports ONLY CommandRegistry - focused, testable
```

Another example showing related exports:

```typescript
// packages/cli/src/config/extension.ts
// Related extension configuration types and functions

export interface ExtensionConfig {
  name: string;
  version: string;
  mcpServers?: Record<string, MCPServerConfig>;
  contextFiles?: string[];
  hooks?: Record<string, HookDefinition[]>;
}

export interface ExtensionUpdateInfo {
  name: string;
  originalVersion: string;
  updatedVersion: string;
}

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export function loadInstallMetadata(extensionDir: string): ExtensionConfig {
  const metadataPath = path.join(extensionDir, 'extension.json');
  const content = fs.readFileSync(metadataPath, 'utf-8');
  return JSON.parse(content);
}

// All exports are related to extension configuration
```

**Example explained:**

- CommandRegistry file: Single class with single responsibility (command registration)
- Extension file: All exports relate to extension configuration (types and loading function)
- Both files are focused, easy to test, and have clear boundaries

### When to Use

**Use single class per file for:**

- Service classes
- Manager classes
- Complex business logic classes
- Classes with significant state or methods

**Use related exports per file for:**

- Type definitions (types.ts)
- Error classes (errors.ts)
- Utility functions in same domain
- Constant definitions (constants.ts)

**Use index.ts for:**

- Directory-level re-exports
- Creating public API boundaries
- Simplifying import paths

### Benefits

- **Focused Testing**: Each file has clear test boundaries
- **Easy Navigation**: Predictable file locations for classes and functions
- **Clear Dependencies**: Imports reveal actual usage, not entire modules
- **Refactoring Safety**: Changes to one file don't affect unrelated code
- **Code Review Efficiency**: Smaller, focused files are easier to review

### Trade-offs

- **File Count**: More files can seem overwhelming initially
- **Import Verbosity**: May require more import statements
- **Index.ts Maintenance**: Must keep index files up to date

### Common Mistakes

**Mistake 1: Creating util.ts grab-bag files**

Bad example:

```typescript
// util.ts - Multiple unrelated utilities
export function formatDate(date: Date): string {}
export function validateEmail(email: string): boolean {}
export class ApiClient {}
export const CONFIG = {};
```

Correct approach:

```typescript
// date-utils.ts
export function formatDate(date: Date): string {}
export function parseDate(str: string): Date {}

// validation.ts
export function validateEmail(email: string): boolean {}
export function validateUrl(url: string): boolean {}

// api-client.ts
export class ApiClient {}

// config.ts
export const CONFIG = {};
```

**Why this matters**: Grab-bag files create unclear dependencies and make it harder to find and test code.

**Mistake 2: Mixing implementation and types in large files**

Bad example:

```typescript
// user.ts (500+ lines)
export interface User {}
export interface UserOptions {}
export class UserService {}
export class UserRepository {}
export function validateUser() {}
export const USER_CONSTANTS = {};
```

Correct approach:

```typescript
// types.ts
export interface User {}
export interface UserOptions {}

// user-service.ts
export class UserService {}

// user-repository.ts
export class UserRepository {}

// validation.ts
export function validateUser() {}

// constants.ts
export const USER_CONSTANTS = {};
```

**Why this matters**: Separating concerns makes each file focused and testable.

### Testing Strategy

**What to Test:**

- Each file has focused, testable exports
- Test files mirror source file structure
- Each test file tests one class or related functions

**Test Organization:**

- One test file per source file
- Test file name matches source file name
- Co-locate tests with source

**Mock Strategy:**

- Mock dependencies imported by the file
- Test the primary export in isolation

**Test Example:**

```typescript
// command-registry.test.ts
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { CommandRegistry } from './command-registry.js';
import type { Command } from './types.js';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('should register a command', () => {
    // Arrange
    const command: Command = {
      name: 'test',
      handler: async () => {},
    };

    // Act
    registry.register(command);

    // Assert
    expect(registry.get('test')).to.equal(command);
  });

  it('should return undefined for unregistered command', () => {
    // Act
    const result = registry.get('nonexistent');

    // Assert
    expect(result).to.be.undefined;
  });

  it('should return all registered commands', () => {
    // Arrange
    const command1: Command = { name: 'cmd1', handler: async () => {} };
    const command2: Command = { name: 'cmd2', handler: async () => {} };
    registry.register(command1);
    registry.register(command2);

    // Act
    const commands = registry.getAllCommands();

    // Assert
    expect(commands).to.have.lengthOf(2);
    expect(commands).to.include(command1);
    expect(commands).to.include(command2);
  });
});
```

**Coverage Goals:**

- 80%+ coverage for each source file
- Each class/function has dedicated tests

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Single responsibility supports clear boundaries
- **[Co-located Tests](./06-code-organization.md#pattern-5-co-located-tests)** - Each focused file has a focused test file

---

## Pattern 5: Co-located Tests

### Intent

Place test files in the same directory as the source files they test, using .test.ts or .test.tsx suffix.

### Problem

Separating tests into a parallel test/ directory creates maintenance burden. When source files move, tests don't automatically move with them. Developers must navigate between distant directories to find tests. This separation makes it harder to ensure tests exist for new code and leads to orphaned test files when source files are deleted.

### Solution

Co-locate test files with source files using consistent naming: FileName.ts gets FileName.test.ts in the same directory. This creates a direct visual relationship between source and tests, makes refactoring easier, and ensures tests are visible during code review.

### Structure

```
src/
├── config/
│   ├── config.ts
│   ├── config.test.ts
│   ├── settings.ts
│   ├── settings.test.ts
│   └── extension-manager.ts
│       └── extension-manager.test.ts
├── services/
│   ├── user-service.ts
│   ├── user-service.test.ts
│   ├── order-service.ts
│   └── order-service.test.ts
└── ui/
    ├── components/
    │   ├── Footer.tsx
    │   ├── Footer.test.tsx
    │   ├── AppHeader.tsx
    │   └── AppHeader.test.tsx
```

### Implementation

**Step 1: Create test file next to source file**

```typescript
// packages/cli/src/config/config.ts
export async function parseArguments(settings: Settings): Promise<CliArgs> {
  // Implementation
}

// packages/cli/src/config/config.test.ts (same directory)
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parseArguments } from './config.js';

describe('parseArguments', () => {
  it('should parse command line arguments', async () => {
    // Test implementation
  });
});
```

**Step 2: Use .test.ts suffix for TypeScript tests**

```typescript
// packages/a2a-server/src/commands/command-registry.ts
export class CommandRegistry {
  // Implementation
}

// packages/a2a-server/src/commands/command-registry.test.ts
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { CommandRegistry } from './command-registry.js';

describe('CommandRegistry', () => {
  // Test implementation
});
```

**Step 3: Use .test.tsx suffix for React component tests**

```typescript
// packages/cli/src/ui/components/Footer.tsx
export const Footer: React.FC = () => {
  return <Box>{/* ... */}</Box>;
};

// packages/cli/src/ui/components/Footer.test.tsx
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { render } from 'ink-testing-library';
import { Footer } from './Footer.js';

describe('Footer', () => {
  it('should render footer correctly', () => {
    const { lastFrame } = render(<Footer />);
    expect(lastFrame()).to.contain('Footer content');
  });
});
```

### Complete Example

Real directory structure from codebase showing 100% co-location:

```
packages/cli/src/config/
├── config.ts                   # Source file
├── config.test.ts              # Test file (co-located)
├── auth.ts                     # Source file
├── auth.test.ts                # Test file (co-located)
├── settings.ts                 # Source file
├── extension-manager.ts        # Source file
└── extension.ts                # Source file (no test - composite module)

packages/a2a-server/src/
├── commands/
│   ├── command-registry.ts     # Source file
│   ├── command-registry.test.ts # Test file (co-located)
│   ├── extensions.ts           # Source file
│   └── extensions.test.ts      # Test file (co-located)
├── agent/
│   ├── task.ts                 # Source file
│   ├── task.test.ts            # Test file (co-located)
│   └── executor.ts             # Source file
└── http/
    ├── app.ts                  # Source file
    ├── app.test.ts             # Test file (co-located)
    ├── endpoints.test.ts       # Endpoint tests (co-located)
    ├── server.ts               # Source file
    └── requestStorage.ts       # Source file

packages/cli/src/ui/components/
├── Footer.tsx                  # React component
├── Footer.test.tsx             # Test file (co-located)
├── AppHeader.tsx               # React component
├── AppHeader.test.tsx          # Test file (co-located)
├── AnsiOutput.tsx              # React component
├── AnsiOutput.test.tsx         # Test file (co-located)
└── (150+ more component-test pairs)
```

**Example explained:**

- Every directory shows source files paired with .test.ts/.test.tsx files
- Zero test files in separate test/ directory
- Test files immediately visible next to source during development
- When source file is deleted, test file is immediately obvious to delete too

### When to Use

**Always co-locate tests:**

- Unit tests for functions and classes
- Component tests for React components
- Integration tests for modules
- Any test that directly tests a source file

**Use separate integration-tests/ directory for:**

- End-to-end tests that span multiple modules
- Performance tests
- Tests that require special setup or infrastructure

### Benefits

- **Visibility**: Tests are immediately visible next to source code
- **Refactoring**: Moving source files automatically suggests moving test files
- **Code Review**: Tests appear in same PR as source changes
- **Deletion**: Deleting source file makes orphaned test obvious
- **Navigation**: Easy to jump between source and test in IDE

### Trade-offs

- **Directory Clutter**: More files in each directory
- **Build Configuration**: Must configure build tools to exclude .test.ts files
- **Convention Change**: Teams used to separate test/ directories must adapt

### Common Mistakes

**Mistake 1: Creating separate test/ directory that mirrors src/**

Bad example:

```
src/
├── services/
│   ├── user-service.ts
│   └── order-service.ts
test/
├── services/
│   ├── user-service.test.ts
│   └── order-service.test.ts
```

Correct approach:

```
src/
├── services/
│   ├── user-service.ts
│   ├── user-service.test.ts
│   ├── order-service.ts
│   └── order-service.test.ts
```

**Why this matters**: Separate directories create maintenance burden and make tests less visible.

**Mistake 2: Not using .test suffix consistently**

Bad example:

```
src/
├── config.ts
├── config.spec.ts          # Inconsistent suffix
├── settings.ts
└── settings-test.ts        # Inconsistent suffix
```

Correct approach:

```
src/
├── config.ts
├── config.test.ts          # Consistent .test suffix
├── settings.ts
└── settings.test.ts        # Consistent .test suffix
```

**Why this matters**: Consistent suffix makes it easy to glob for test files and configure build tools.

### Testing Strategy

**What to Test:**

- Every source file should have a corresponding test file
- Test coverage reports should reference co-located paths

**Test Organization:**

- Use .test.ts/.test.tsx suffix
- Place test file in same directory as source
- Use same base name as source file

**Mock Strategy:**

- Mock external dependencies
- Use real implementations for functions in same module

**Test Example:**

```typescript
// packages/a2a-server/src/commands/command-registry.ts
export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
  }

  get(commandName: string): Command | undefined {
    return this.commands.get(commandName);
  }
}

// packages/a2a-server/src/commands/command-registry.test.ts
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { CommandRegistry } from './command-registry.js';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('should register and retrieve a command', () => {
    // Arrange
    const command = { name: 'test', handler: async () => {} };

    // Act
    registry.register(command);
    const retrieved = registry.get('test');

    // Assert
    expect(retrieved).to.equal(command);
  });

  it('should return undefined for unregistered command', () => {
    // Act
    const result = registry.get('nonexistent');

    // Assert
    expect(result).to.be.undefined;
  });
});
```

**Coverage Goals:**

- 80%+ coverage for all source files
- Every source file has corresponding test file

### Related Patterns

- **[File Naming Conventions](./06-code-organization.md#pattern-1-file-naming-conventions)** - Test files use .test suffix
- **[Testing Patterns](./05-testing-patterns.md)** - Co-location supports AAA testing pattern

---

## Pattern 6: Feature-Based Directory Structure

### Intent

Organize code by feature domain instead of technical role, grouping related functionality together.

### Problem

Organizing code by technical role (controllers/, services/, models/) scatters feature code across multiple directories. Developers must navigate many directories to understand a single feature. This structure makes it difficult to extract features into separate packages and obscures feature boundaries.

### Solution

Organize directories by feature domain (config/, commands/, agent/, ui/), placing related services, types, utilities, and tests together. This creates clear feature boundaries and makes it easy to locate all code related to a feature.

### Structure

```
src/
├── config/               # Configuration feature
│   ├── config.ts
│   ├── config.test.ts
│   ├── settings.ts
│   ├── extension-manager.ts
│   └── types.ts
├── commands/             # Command feature
│   ├── command-registry.ts
│   ├── command-registry.test.ts
│   ├── types.ts
│   └── extensions.ts
├── agent/                # Agent feature
│   ├── task.ts
│   ├── task.test.ts
│   ├── executor.ts
│   └── types.ts
└── ui/                   # UI feature
    ├── components/
    ├── contexts/
    ├── hooks/
    └── utils/
```

### Implementation

**Step 1: Group by feature domain, not technical role**

```
# Bad: Technical role organization
src/
├── services/
│   ├── config-service.ts
│   ├── command-service.ts
│   └── task-service.ts
├── repositories/
│   ├── config-repository.ts
│   └── command-repository.ts
├── controllers/
│   ├── config-controller.ts
│   └── command-controller.ts

# Good: Feature-based organization
src/
├── config/
│   ├── config-service.ts
│   ├── config-repository.ts
│   ├── config-controller.ts
│   └── types.ts
├── commands/
│   ├── command-service.ts
│   ├── command-repository.ts
│   ├── command-controller.ts
│   └── types.ts
```

**Step 2: Include utilities and types within feature directories**

```typescript
// packages/a2a-server/src/agent/
├── task.ts              # Core agent task class
├── task.test.ts         # Tests
├── executor.ts          # Agent executor
├── types.ts             # Agent-specific types
└── utils.ts             # Agent utilities (if needed)
```

**Step 3: Create shared utilities directory for cross-feature code**

```typescript
// packages/cli/src/
├── config/              # Config feature
├── commands/            # Commands feature
├── agent/               # Agent feature
└── utils/               # Shared utilities
    ├── version.ts       # Used across features
    ├── errors.ts        # Shared errors
    └── logger.ts        # Shared logging
```

### Complete Example

Real directory structure from codebase:

```
packages/cli/src/
├── config/                    # Configuration feature domain
│   ├── config.ts             # Main config logic
│   ├── config.test.ts        # Config tests
│   ├── settings.ts           # Settings management
│   ├── auth.ts               # Auth configuration
│   ├── auth.test.ts
│   ├── extension-manager.ts  # Extension management
│   ├── extension.ts          # Extension types
│   ├── extensions/           # Extension utilities
│   │   ├── consent.ts
│   │   ├── github.ts
│   │   ├── storage.ts
│   │   └── variables.ts
│   └── trustedFolders.ts
├── commands/                  # Commands feature domain
│   ├── extensions.tsx        # Extension commands
│   ├── extensions.test.tsx
│   ├── mcp.ts                # MCP commands
│   ├── mcp.test.ts
│   └── mcp/                  # MCP subcommands
│       ├── add.ts
│       ├── list.ts
│       └── remove.ts
├── ui/                        # UI feature domain
│   ├── App.tsx               # Main app component
│   ├── AppContainer.tsx
│   ├── components/           # UI components
│   │   ├── Footer.tsx
│   │   ├── Footer.test.tsx
│   │   ├── AppHeader.tsx
│   │   └── AppHeader.test.tsx
│   ├── contexts/             # React contexts
│   │   ├── UIStateContext.tsx
│   │   ├── ConfigContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/                # Custom hooks
│   ├── utils/                # UI utilities
│   └── constants/            # UI constants
└── utils/                     # Shared utilities
    ├── version.ts
    ├── cleanup.ts
    ├── errors.ts
    └── logger.ts

packages/a2a-server/src/
├── agent/                     # Agent feature domain
│   ├── task.ts               # Task management
│   ├── task.test.ts
│   └── executor.ts           # Task execution
├── commands/                  # Commands feature domain
│   ├── command-registry.ts
│   ├── command-registry.test.ts
│   ├── extensions.ts
│   └── types.ts
├── http/                      # HTTP server feature domain
│   ├── app.ts                # Express app setup
│   ├── app.test.ts
│   ├── endpoints.test.ts     # Endpoint tests
│   ├── server.ts             # Server startup
│   └── requestStorage.ts     # Request storage
├── config/                    # Configuration feature domain
│   ├── config.ts
│   ├── settings.ts
│   └── extension.ts
└── utils/                     # Shared utilities
    ├── logger.ts
    └── testing-utils.ts
```

**Example explained:**

- Each top-level directory represents a feature domain (config, commands, agent, ui, http)
- All related code for a feature lives in its directory (services, types, tests, utilities)
- Shared utilities in utils/ directory for cross-feature code
- UI features have subdomains (components/, contexts/, hooks/)
- Clear boundaries make it easy to understand feature scope

### When to Use

**Use feature-based structure for:**

- Applications with distinct feature domains
- Projects where features may be extracted into packages
- Teams that work on specific features
- Microservices or modular monoliths

**Use shared directories for:**

- Cross-feature utilities (utils/, shared/)
- Common types (types/)
- Shared constants (constants/)

**Avoid feature-based structure when:**

- Application is extremely small (< 10 files)
- No clear feature boundaries exist

### Benefits

- **Feature Cohesion**: All code for a feature is co-located
- **Easy Navigation**: Find all feature code in one place
- **Clear Boundaries**: Feature directories define module boundaries
- **Team Alignment**: Teams can own feature directories
- **Extraction Ready**: Easy to extract features into packages
- **Reduced Cognitive Load**: Don't need to navigate between distant directories

### Trade-offs

- **Duplicate Patterns**: Each feature may have similar files (types.ts, utils.ts)
- **Shared Code Boundaries**: Must decide what goes in shared vs feature directories
- **Convention Change**: Teams familiar with MVC may resist

### Common Mistakes

**Mistake 1: Organizing by technical role instead of feature**

Bad example:

```
src/
├── controllers/
│   ├── user-controller.ts
│   ├── order-controller.ts
│   └── payment-controller.ts
├── services/
│   ├── user-service.ts
│   ├── order-service.ts
│   └── payment-service.ts
├── repositories/
│   ├── user-repository.ts
│   ├── order-repository.ts
│   └── payment-repository.ts
└── models/
    ├── user-model.ts
    ├── order-model.ts
    └── payment-model.ts
```

Correct approach:

```
src/
├── user/
│   ├── user-controller.ts
│   ├── user-service.ts
│   ├── user-repository.ts
│   └── user-model.ts
├── order/
│   ├── order-controller.ts
│   ├── order-service.ts
│   ├── order-repository.ts
│   └── order-model.ts
└── payment/
    ├── payment-controller.ts
    ├── payment-service.ts
    ├── payment-repository.ts
    └── payment-model.ts
```

**Why this matters**: Feature-based organization keeps related code together, making features easier to understand and maintain.

**Mistake 2: Not extracting shared utilities**

Bad example:

```
src/
├── user/
│   ├── user-service.ts
│   ├── logger.ts         # Duplicated across features
│   └── errors.ts         # Duplicated across features
├── order/
│   ├── order-service.ts
│   ├── logger.ts         # Duplicate
│   └── errors.ts         # Duplicate
```

Correct approach:

```
src/
├── user/
│   └── user-service.ts
├── order/
│   └── order-service.ts
└── shared/
    ├── logger.ts         # Shared across features
    └── errors.ts         # Shared across features
```

**Why this matters**: Shared utilities should be extracted to avoid duplication and establish single source of truth.

### Testing Strategy

**What to Test:**

- Directory structure follows feature-based organization
- Feature boundaries are clear and enforced
- Shared code is properly extracted

**Test Organization:**

- Tests co-located within feature directories
- Integration tests can span features
- Shared utilities have their own tests

**Mock Strategy:**

- Mock cross-feature dependencies
- Use real implementations within feature

**Test Example:**

```typescript
// Verify feature boundaries with architecture tests
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { glob } from 'glob';
import * as path from 'node:path';

describe('Feature-Based Structure', () => {
  it('should organize code by feature domain', async () => {
    // Arrange: Get all feature directories
    const featureDirs = await glob('src/*/', { ignore: ['src/shared/', 'src/utils/'] });

    // Assert: Each feature has its own directory
    expect(featureDirs.length).to.be.greaterThan(0);

    featureDirs.forEach((dir) => {
      const dirName = path.basename(dir);
      expect(dirName).to.match(/^[a-z-]+$/); // kebab-case feature names
    });
  });

  it('should co-locate tests within feature directories', async () => {
    // Arrange: Find all test files
    const testFiles = await glob('src/**/*.test.ts');

    // Assert: No test files in separate test/ directory
    const separateTestDir = testFiles.filter((file) => file.includes('/test/'));
    expect(separateTestDir).to.be.empty;
  });

  it('should not have technical role directories', async () => {
    // Arrange: Check for common technical role directories
    const technicalDirs = ['src/controllers', 'src/services', 'src/repositories', 'src/models'];

    // Assert: None of these directories exist
    for (const dir of technicalDirs) {
      const exists = await glob(dir);
      expect(exists).to.be.empty;
    }
  });
});
```

**Coverage Goals:**

- 100% of features organized by domain
- Zero technical role directories

### Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Feature directories define module boundaries
- **[Single Responsibility Per File](./06-code-organization.md#pattern-4-single-responsibility-per-file)** - Features contain focused files

---

## Quick Reference

### Pattern Summary Table

| Pattern                        | Use When             | Avoid When              | Key Benefit                 |
| ------------------------------ | -------------------- | ----------------------- | --------------------------- |
| File Naming Conventions        | All TypeScript files | Never                   | Predictable file locations  |
| Variable and Function Naming   | All code elements    | Never                   | Clear code element types    |
| Import Organization            | Every file           | Never                   | Dependency clarity          |
| Single Responsibility Per File | Most files           | Tightly related exports | Focused, testable modules   |
| Co-located Tests               | All unit tests       | E2E tests               | Visible, maintainable tests |
| Feature-Based Structure        | Multi-feature apps   | Tiny apps               | Feature cohesion            |

### Code Snippets

**File Naming - TypeScript:**

```typescript
// file-system-service.ts
export class FileSystemService {}

// file-system-service.test.ts
describe('FileSystemService', () => {});
```

**File Naming - React Component:**

```typescript
// AppHeader.tsx
export function AppHeader() {}

// AppHeader.test.tsx
describe('AppHeader', () => {});
```

**Variable Naming:**

```typescript
// Constants
const MAX_RETRY_ATTEMPTS = 3;

// Functions
function calculateTotal(): number {}

// Classes
class UserService {}

// Interfaces (no I prefix)
interface Config {}

// Private members
class Service {
  private _cache: Map<string, unknown>;
  private _resetCache(): void {}
}
```

**Import Organization:**

```typescript
// 1. Node.js built-ins (node: protocol)
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

// 2. External dependencies
import { Command, Flags } from '@oclif/core';

// 3. Internal modules (.js extension)
import { loadConfig } from './config-loader.js';

// 4. Type-only imports
import type { User } from './types.js';
```

**Feature-Based Structure:**

```
src/
├── config/         # Feature domain
│   ├── config.ts
│   ├── config.test.ts
│   └── types.ts
└── commands/       # Feature domain
    ├── registry.ts
    ├── registry.test.ts
    └── types.ts
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "function",
        "format": ["camelCase"]
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      },
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "custom": {
          "regex": "^I[A-Z]",
          "match": false
        }
      },
      {
        "selector": "memberLike",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      }
    ],
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "type"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc"
        }
      }
    ],
    "import/extensions": ["error", "always", { "ignorePackages": true }]
  }
}
```

**Pre-commit Hooks:**

```json
{
  "scripts": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.tsx": ["eslint --fix", "prettier --write"]
  }
}
```

**Build-Time Checks:**

```bash
# Enforce naming and import conventions
npm run lint

# Format code automatically
npm run format

# CI pipeline enforcement
npm run preflight  # Runs lint + typecheck + test
```

---

## Related Patterns

- **[Module Boundaries](./07-module-boundaries.md)** - Code organization supports clear module boundaries
- **[Testing Patterns](./05-testing-patterns.md)** - Co-located tests enable focused testing
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Interface naming follows PascalCase without I prefix
- **[ES Modules](./07-module-boundaries.md#pattern-3-es-module-standards)** - Import organization requires .js extensions

---

## References

**Source Code Examples:**

- [packages/cli/src/config/](../../examplecode/gemini/packages/cli/src/config/) - File naming and import organization examples
- [packages/cli/src/ui/components/](../../examplecode/gemini/packages/cli/src/ui/components/) - React component naming and co-located tests
- [packages/a2a-server/src/](../../examplecode/gemini/packages/a2a-server/src/) - Feature-based directory structure

**External Resources:**

- [TypeScript Handbook - Naming Conventions](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html) - Official TypeScript naming guidance
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) - Industry-standard naming conventions
- [ESLint import plugin](https://github.com/import-js/eslint-plugin-import) - Import ordering rules

---

## Changelog

- **2025-01-21**: Initial code organization patterns documentation extracted from reference codebase
- **2025-01-21**: Added comprehensive testing strategy for each pattern
- **2025-01-21**: Added real code examples from codebase for all patterns
