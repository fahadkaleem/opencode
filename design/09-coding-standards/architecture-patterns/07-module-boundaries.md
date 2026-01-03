---
title: Module Boundary Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All Packages
related_patterns:
  - ./06-code-organization.md
  - ./08-dependency-management.md
---

# 7. Module Boundary Patterns

> **Purpose**: Establish clear module boundaries using ES modules, explicit public APIs, and consistent import conventions to prevent internal implementation leakage and enable safe refactoring.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Explicit Public API via index.ts](#pattern-1-explicit-public-api-via-indexts)
- [Pattern 2: ES Modules Only](#pattern-2-es-modules-only)
- [Pattern 3: Always Use .js Extension](#pattern-3-always-use-js-extension)
- [Pattern 4: Node.js Built-in Protocol](#pattern-4-nodejs-built-in-protocol)
- [Pattern 5: No Default Exports](#pattern-5-no-default-exports)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Module boundaries define what code is public and what is private within a package or module. Clear boundaries prevent accidental coupling, enable safe refactoring of internals, and create explicit contracts between modules. Without proper boundaries, any file can import any other file, leading to tight coupling and brittle code.

ES modules provide the foundation for modern JavaScript module systems with explicit import/export syntax, static analysis, and tree-shaking. When combined with TypeScript and Node.js conventions, ES modules enable compile-time verification and runtime safety.

This document covers five critical patterns for establishing clean module boundaries in TypeScript codebases using ES modules, following Node.js best practices.

**Why module boundaries matter:**

- Prevent accidental dependencies on internal implementation
- Enable safe refactoring without breaking consumers
- Provide clear public API documentation through exports
- Support tree-shaking for smaller bundle sizes
- Enable static analysis and compile-time verification

**In this document:**

- **Explicit Public API via index.ts** - Control what gets exported from modules
- **ES Modules Only** - Use modern ES module syntax exclusively
- **Always Use .js Extension** - Include .js in imports for ES module compatibility
- **Node.js Built-in Protocol** - Use node: protocol for built-in modules
- **No Default Exports** - Prefer named exports for better refactoring

**Prerequisites:**

- Understanding of ES module syntax (import/export)
- Familiarity with TypeScript module resolution
- Knowledge of Node.js module system
- Experience with package.json and tsconfig.json configuration

---

## Pattern 1: Explicit Public API via index.ts

### Intent

Create explicit public APIs by using index.ts files to control what is exported from each module, hiding internal implementation details.

### Problem

Without explicit export control, any file can import any other file, even internal implementation details. This creates tight coupling where consumers depend on internals. When internal files are refactored, moved, or renamed, all consumers break. Additionally, there is no clear documentation of what the module intends to expose as its public interface.

### Solution

Use index.ts files as facades that explicitly export the public API. Internal files are not exported and remain private to the module. Consumers import from the index, never from internal files. This creates a clear contract between the module and its consumers.

### Structure

```
packages/core/src/
├── services/
│   ├── user-service.ts          # Internal implementation
│   ├── order-service.ts         # Internal implementation
│   ├── internal-helper.ts       # Internal utility (not exported)
│   └── index.ts                 # Public API - exports UserService, OrderService
├── utils/
│   ├── date-utils.ts
│   ├── internal-cache.ts        # Internal (not exported)
│   └── index.ts
└── index.ts                      # Package public API
```

### Implementation

**Step 1: Create index.ts at each directory level**

Export only the public interfaces, classes, and functions that consumers should use.

```typescript
// packages/core/src/services/index.ts
export { UserService } from './user-service.js';
export { OrderService } from './order-service.js';
// internal-helper.ts is NOT exported - remains private
```

**Step 2: Create package-level index.ts**

Re-export from subdirectory indices to create a single entry point for the package.

```typescript
// packages/core/src/index.ts
export * from './services/index.js';
export * from './utils/index.js';
export * from './config/index.js';
// Only exports what subdirectories explicitly expose
```

**Step 3: Configure package.json exports**

Define the package exports to enforce the entry point.

```json
{
  "name": "@myapp/core",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./services": "./dist/services/index.js"
  }
}
```

### Complete Example

```typescript
// packages/core/src/confirmation-bus/index.ts
// Only export public API
export * from './message-bus.js';
export * from './types.js';
// Internal files like ./internal-handlers.js are NOT exported

// packages/core/src/index.ts
// Package-level public API
export * from './config/config.js';
export * from './config/defaultModelConfigs.js';
export * from './output/types.js';
export * from './output/json-formatter.js';
export * from './policy/types.js';
export * from './policy/policy-engine.js';
export * from './core/client.js';
export * from './tools/tools.js';
export * from './tools/tool-registry.js';

// Selectively export specific items from modules
export { IDE_DEFINITIONS, type IdeInfo } from './ide/detect-ide.js';
export type { OAuthToken, OAuthCredentials } from './mcp/token-storage/types.js';
export { MCPOAuthTokenStorage } from './mcp/oauth-token-storage.js';

// Consumer usage - can only access public API
import { UserService, OrderService } from '@myapp/core'; // Works
import { internalHelper } from '@myapp/core'; // Error - not exported
```

**Example explained:**

- Lines 1-4: Directory-level index exports only MessageBus and types, hiding internals
- Lines 6-17: Package-level index curates the complete public API surface
- Lines 19-21: Selective exports using named exports and type-only exports
- Lines 23-25: Consumers can only access explicitly exported items

### When to Use

**Use this pattern when:**

- Building reusable packages or libraries
- Creating multi-file modules with internal structure
- Need to hide implementation details from consumers
- Want to evolve internals without breaking consumers
- Building monorepo packages that depend on each other

**Avoid this pattern when:**

- Single-file modules with no internal complexity
- Prototype or exploratory code with frequent restructuring
- Everything in the module is legitimately public

### Benefits

- **Encapsulation**: Internal files cannot be accessed from outside
- **Refactoring Safety**: Can change internal structure without breaking consumers
- **Clear Contract**: index.ts documents the public API
- **Better Tree-shaking**: Bundlers can eliminate unused internal code
- **Self-documenting**: New developers see exactly what to import

### Trade-offs

- **Extra Files**: Requires creating index.ts at each level
- **Re-export Overhead**: Need to maintain export lists
- **Learning Curve**: Developers must understand the pattern

### Common Mistakes

**Mistake 1: Exporting everything**

```typescript
// packages/core/src/index.ts
export * from './services/user-service.js';
export * from './services/order-service.js';
export * from './services/internal-helper.js'; // Don't export internals
export * from './utils/internal-cache.js'; // Don't export internals
```

**Why this matters**: Exporting everything defeats the purpose. Consumers will depend on internals, preventing refactoring.

**Correct approach:**

```typescript
// packages/core/src/services/index.ts
export { UserService } from './user-service.js';
export { OrderService } from './order-service.js';
// internal-helper.ts is NOT exported

// packages/core/src/index.ts
export * from './services/index.js'; // Only exports what services/index.ts exports
```

**Mistake 2: Direct imports bypassing index**

```typescript
// Consumer code
import { UserService } from '@myapp/core/dist/services/user-service.js';
import { internalHelper } from '@myapp/core/dist/services/internal-helper.js';
```

**Why this matters**: Bypasses the public API contract. Will break when internals change.

**Correct approach:**

```typescript
// Consumer code
import { UserService } from '@myapp/core';
// Can only access what's in the public API
```

### Testing Strategy

**What to Test:**

- Verify index.ts exports expected public API
- Ensure internal files are not accessible from outside
- Verify package.json exports configuration
- Test that consumers cannot import internals

**Test Organization:**

- Integration tests in package root verify public API
- No need to test index.ts files directly (they're just re-exports)
- Use build-time checks to verify export correctness

**Mock Strategy:**

- Not applicable - this is a structural pattern, not runtime behavior

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Public API Contract', () => {
  it('should export expected public services', async () => {
    // Arrange & Act
    const coreExports = await import('@myapp/core');

    // Assert
    expect(coreExports).to.have.property('UserService');
    expect(coreExports).to.have.property('OrderService');
    expect(coreExports).to.have.property('Config');
  });

  it('should not export internal utilities', async () => {
    // Arrange & Act
    const coreExports = await import('@myapp/core');

    // Assert
    expect(coreExports).to.not.have.property('internalHelper');
    expect(coreExports).to.not.have.property('InternalCache');
  });

  it('should fail to import internal files directly', async () => {
    // Arrange & Act & Assert
    await expect(import('@myapp/core/dist/services/internal-helper.js')).to.be.rejected;
  });
});
```

**Coverage Goals:**

- Line coverage: Not applicable (structural pattern)
- API coverage: 100% of intended public exports verified

### Related Patterns

- **[Code Organization](./06-code-organization.md)** - Defines directory structure for modules
- **[Dependency Management](./08-dependency-management.md)** - Controls dependencies between modules

---

## Pattern 2: ES Modules Only

### Intent

Use ES module syntax exclusively (import/export) instead of CommonJS (require/module.exports) for better static analysis, tree-shaking, and future compatibility.

### Problem

CommonJS (require/module.exports) is the legacy Node.js module system. It uses dynamic imports that cannot be statically analyzed, preventing tree-shaking and compile-time verification. Mixing CommonJS and ES modules creates compatibility issues and prevents modern tooling from working correctly. TypeScript and bundlers work best with ES modules.

### Solution

Use ES module syntax exclusively throughout the codebase. Configure package.json with "type": "module" and tsconfig.json with "module": "NodeNext". Use import/export statements for all module interactions. Never use require() or module.exports.

### Structure

```typescript
// ES module import
import { UserService } from './user-service.js';
import * as fs from 'node:fs/promises';

// ES module export
export class UserService {}
export const config = {};
```

### Implementation

**Step 1: Configure package.json for ES modules**

```json
{
  "name": "@myapp/core",
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

**Step 2: Configure TypeScript for ES modules**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "esModuleInterop": true
  }
}
```

**Step 3: Use ES module import syntax**

```typescript
// Named imports
import { UserService, OrderService } from './services/index.js';

// Namespace imports
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Type-only imports (erased at runtime)
import type { Config } from './config.js';

// Mixed type and value imports
import { type ContentGenerator, AuthType } from './core/contentGenerator.js';
```

**Step 4: Use ES module export syntax**

```typescript
// Named exports
export class UserService {}
export interface ServiceConfig {}
export const DEFAULT_TIMEOUT = 5000;

// Re-exports
export * from './services/index.js';
export { UserService } from './user-service.js';

// Type-only exports
export type { Config } from './config.js';
```

### Complete Example

```typescript
// packages/core/src/config/config.ts
import type { ContentGenerator, ContentGeneratorConfig } from '../core/contentGenerator.js';
import {
  AuthType,
  createContentGenerator,
  createContentGeneratorConfig,
} from '../core/contentGenerator.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { GrepTool } from '../tools/grep.js';
import { canUseRipgrep, RipGrepTool } from '../tools/ripGrep.js';
import { ShellTool } from '../tools/shell.js';
import { WriteFileTool } from '../tools/write-file.js';

export interface Config {
  getTargetDir(): string;
  getContentGenerator(): ContentGenerator;
  getToolRegistry(): ToolRegistry;
  getPromptRegistry(): PromptRegistry;
}

export class ConfigImpl implements Config {
  private contentGenerator: ContentGenerator;
  private toolRegistry: ToolRegistry;
  private promptRegistry: PromptRegistry;

  constructor(
    private targetDir: string,
    config: ContentGeneratorConfig
  ) {
    this.contentGenerator = createContentGenerator(config);
    this.toolRegistry = new ToolRegistry();
    this.promptRegistry = new PromptRegistry();
    this.registerTools();
  }

  getTargetDir(): string {
    return this.targetDir;
  }

  getContentGenerator(): ContentGenerator {
    return this.contentGenerator;
  }

  private registerTools(): void {
    this.toolRegistry.register('ls', new LSTool(this));
    this.toolRegistry.register('read_file', new ReadFileTool(this));
    this.toolRegistry.register('grep', new GrepTool(this));
    if (canUseRipgrep()) {
      this.toolRegistry.register('rg', new RipGrepTool(this));
    }
    this.toolRegistry.register('shell', new ShellTool(this));
    this.toolRegistry.register('write_file', new WriteFileTool(this));
  }
}
```

**Example explained:**

- Lines 1-8: Type-only imports separated from value imports for clarity
- Lines 9-17: Value imports for classes and functions
- Lines 19-24: Interface exported with named export
- Lines 26-56: Class implementation with proper encapsulation
- All imports use .js extensions and ES module syntax

### When to Use

**Use this pattern when:**

- Starting any new TypeScript project
- Building Node.js applications or libraries
- Need tree-shaking and dead code elimination
- Want compile-time module verification
- Targeting modern Node.js versions (14+)

**Avoid this pattern when:**

- Maintaining legacy CommonJS-only code
- Using tools that don't support ES modules (rare)
- Need to support very old Node.js versions (pre-12)

### Benefits

- **Static Analysis**: Import/export statements can be analyzed at compile time
- **Tree Shaking**: Bundlers can eliminate unused code
- **Better IDE Support**: Autocomplete and refactoring work better
- **Standard Syntax**: Aligned with JavaScript standard and browser modules
- **Future Proof**: ES modules are the long-term standard

### Trade-offs

- **Migration Cost**: Converting CommonJS codebases requires refactoring
- **Compatibility**: Some old packages may not support ES modules
- **Configuration**: Requires proper package.json and tsconfig.json setup

### Common Mistakes

**Mistake 1: Mixing CommonJS and ES modules**

```typescript
// Don't mix require and import
const fs = require('fs');
import { UserService } from './user-service.js';

// Don't mix module.exports and export
export class UserService {}
module.exports = { UserService };
```

**Why this matters**: Mixing module systems breaks static analysis and creates runtime errors.

**Correct approach:**

```typescript
// Use ES modules exclusively
import * as fs from 'node:fs';
import { UserService } from './user-service.js';

export class UserService {}
```

**Mistake 2: Not configuring package.json**

```json
{
  "name": "@myapp/core"
  // Missing "type": "module"
}
```

**Why this matters**: Without "type": "module", Node.js treats files as CommonJS, breaking ES module syntax.

**Correct approach:**

```json
{
  "name": "@myapp/core",
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

### Testing Strategy

**What to Test:**

- Verify imports work correctly at runtime
- Test that exports are accessible
- Ensure TypeScript compilation succeeds
- Verify Node.js can load modules

**Test Organization:**

- Integration tests verify module loading
- Build-time TypeScript compilation catches import errors

**Mock Strategy:**

- Use ES module-compatible mocking libraries
- Avoid CommonJS-style module mocking

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { UserService } from './user-service.js';

describe('ES Module Imports', () => {
  it('should import named exports', () => {
    // Arrange & Act
    const service = new UserService();

    // Assert
    expect(service).to.be.instanceof(UserService);
  });

  it('should import from index', async () => {
    // Arrange & Act
    const exports = await import('./index.js');

    // Assert
    expect(exports).to.have.property('UserService');
  });
});
```

**Coverage Goals:**

- Import coverage: All public exports should be importable
- Compilation: TypeScript should compile without module errors

### Related Patterns

- **[Always Use .js Extension](#pattern-3-always-use-js-extension)** - Required for ES modules
- **[Node.js Built-in Protocol](#pattern-4-nodejs-built-in-protocol)** - Complements ES module imports

---

## Pattern 3: Always Use .js Extension

### Intent

Always include .js extension in relative imports, even when importing TypeScript files, to ensure ES module compatibility and proper Node.js resolution.

### Problem

TypeScript files (.ts) compile to JavaScript files (.js). ES modules in Node.js require explicit file extensions in import statements. If you import './user-service' without an extension, Node.js cannot resolve the file. If you use './user-service.ts', the extension is wrong because the compiled file is .js. This creates a mismatch between source and runtime.

### Solution

Always use .js extensions in import statements, even when importing from .ts files. TypeScript strips .ts extensions but preserves .js extensions during compilation. This ensures the compiled JavaScript has correct import paths that Node.js can resolve.

### Structure

```typescript
// Source file: user-service.ts
export class UserService {}

// Importing file: app.ts
import { UserService } from './user-service.js'; // Use .js, not .ts

// After compilation: app.js
import { UserService } from './user-service.js'; // Extension preserved
```

### Implementation

**Step 1: Use .js for all relative imports**

```typescript
// Correct - use .js extension
import { UserService } from './user-service.js';
import { Config } from '../config/index.js';
import { parseArguments } from './config/config.js';
```

**Step 2: Use .js for index imports**

```typescript
// Correct - use .js for index files
import { UserService } from './services/index.js';
import { Config } from '../config/index.js';
```

**Step 3: No extension for npm packages**

```typescript
// Correct - no extension for npm packages
import React from 'react';
import { render } from 'ink';
import { expect } from 'chai';
```

### Complete Example

```typescript
// packages/cli/src/gemini.tsx
import React from 'react';
import { render } from 'ink';
import { AppContainer } from './ui/AppContainer.js';
import { loadCliConfig, parseArguments } from './config/config.js';
import * as cliConfig from './config/config.js';
import { readStdin } from './utils/readStdin.js';
import type {
  Config,
  ResumedSessionData,
  OutputPayload,
  ConsoleLogPayload,
} from '@google/genai-cli-core';
import {
  sessionId,
  logUserPrompt,
  AuthType,
  getOauthClient,
  UserPromptEvent,
  debugLogger,
} from '@google/genai-cli-core';

export async function main(): Promise<void> {
  const settings = await loadCliConfig();
  const args = await parseArguments(settings);

  const config = await cliConfig.createConfig(args);

  render(<AppContainer config={config} />);
}
```

**Example explained:**

- Lines 1-2: External packages (react, ink) don't use extensions
- Lines 3-6: Internal relative imports all use .js extensions
- Lines 7-19: Package imports from monorepo packages don't use extensions
- All .js extensions will be preserved in compiled output

### When to Use

**Use this pattern when:**

- Writing ES modules in TypeScript for Node.js
- Any relative import within the same package
- Importing from nested directories
- Importing index files

**Avoid this pattern when:**

- Importing from npm packages
- Importing from monorepo packages (use package name)
- Using module bundlers that handle extensions (but still recommended)

### Benefits

- **ES Module Compliance**: Node.js can resolve imports correctly
- **No Runtime Errors**: Prevents "Cannot find module" errors
- **TypeScript Compatible**: TypeScript understands this pattern
- **Explicit**: Makes it clear these are file imports, not package imports
- **Build Tool Friendly**: Works with esbuild, tsc, and other tools

### Trade-offs

- **Counter-intuitive**: Using .js for .ts files feels wrong initially
- **Manual Updates**: Must remember to use .js consistently
- **IDE Confusion**: Some IDEs try to "fix" .js to .ts

### Common Mistakes

**Mistake 1: Omitting extension**

```typescript
// Missing extension
import { UserService } from './user-service';
import { Config } from '../config/index';
```

**Why this matters**: Node.js ES modules require explicit extensions. This will fail at runtime.

**Correct approach:**

```typescript
// Include .js extension
import { UserService } from './user-service.js';
import { Config } from '../config/index.js';
```

**Mistake 2: Using .ts extension**

```typescript
// Using .ts extension
import { UserService } from './user-service.ts';
```

**Why this matters**: Compiled output will try to import .ts file, which doesn't exist.

**Correct approach:**

```typescript
// Use .js even for .ts files
import { UserService } from './user-service.js';
```

**Mistake 3: Adding .js to npm packages**

```typescript
// Don't add .js to packages
import { expect } from 'chai.js';
import React from 'react.js';
```

**Why this matters**: npm packages manage their own exports. Adding .js breaks imports.

**Correct approach:**

```typescript
// No extension for npm packages
import { expect } from 'chai';
import React from 'react';
```

### Testing Strategy

**What to Test:**

- Verify compiled JavaScript has correct import paths
- Test that Node.js can load modules at runtime
- Ensure TypeScript compilation succeeds

**Test Organization:**

- Build-time TypeScript compilation catches missing/wrong extensions
- Runtime tests verify Node.js resolution

**Mock Strategy:**

- Not applicable - structural pattern

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Import Resolution', () => {
  it('should resolve imports with .js extension', async () => {
    // Arrange & Act
    const module = await import('./user-service.js');

    // Assert
    expect(module).to.have.property('UserService');
  });

  it('should fail without extension', async () => {
    // Arrange & Act & Assert
    await expect(import('./user-service')).to.be.rejected;
  });
});
```

**Coverage Goals:**

- Import coverage: All imports should resolve successfully
- Build success: TypeScript should compile without errors

### Related Patterns

- **[ES Modules Only](#pattern-2-es-modules-only)** - Foundation for this pattern
- **[Code Organization](./06-code-organization.md)** - Defines file structure

---

## Pattern 4: Node.js Built-in Protocol

### Intent

Use the node: protocol prefix when importing Node.js built-in modules to distinguish them from npm packages and enable better optimization.

### Problem

Node.js built-in modules (fs, path, crypto, etc.) have the same names as potential npm packages. Without a prefix, it's unclear whether an import references a built-in module or an npm package. Some npm packages intentionally override built-in names. The node: protocol was introduced to explicitly indicate built-in modules and prevent ambiguity.

### Solution

Prefix all Node.js built-in module imports with node:. Use node:fs instead of fs, node:path instead of path. This creates explicit intent and enables bundlers to optimize built-in module handling. The node: protocol is the official recommendation from Node.js.

### Structure

```typescript
// With node: protocol
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';

// Different import styles
import path from 'node:path'; // Default import
import * as os from 'node:os'; // Namespace import
import { EventEmitter } from 'node:events'; // Named import
```

### Implementation

**Step 1: Use node: for all Node.js built-ins**

```typescript
// Always prefix with node:
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
```

**Step 2: Use node: for built-in submodules**

```typescript
// Works with submodules
import * as fsPromises from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';
import { createRequire } from 'node:module';
```

**Step 3: Different import styles**

```typescript
// Default import
import path from 'node:path';
import os from 'node:os';

// Namespace import
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

// Named import
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
```

### Complete Example

```typescript
// packages/core/src/utils/paths.ts
import path from 'node:path';
import os from 'node:os';
import * as crypto from 'node:crypto';

export const APP_DIR = '.myapp';
export const CONFIG_FILENAME = 'config.json';

export function tildeifyPath(filePath: string): string {
  const homeDir = os.homedir();
  if (filePath.startsWith(homeDir)) {
    return filePath.replace(homeDir, '~');
  }
  return filePath;
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function resolveConfigPath(): string {
  return path.join(os.homedir(), APP_DIR, CONFIG_FILENAME);
}

// packages/core/src/utils/fileUtils.ts
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { createRequire as createModuleRequire } from 'node:module';
import type { PartUnion } from '@google/genai';
import mime from 'mime/lite';
import type { FileSystemService } from '../services/fileSystemService.js';
import { ToolErrorType } from '../tools/tool-error.js';
import { debugLogger } from './debugLogger.js';

const requireModule = createModuleRequire(import.meta.url);

export async function readFileContent(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await fsPromises.readFile(absolutePath, 'utf-8');
  return content;
}

// packages/core/src/confirmation-bus/message-bus.ts
import { EventEmitter } from 'node:events';
import type { PolicyEngine } from '../policy/policy-engine.js';
import { PolicyDecision } from '../policy/types.js';
import { MessageBusType, type Message } from './types.js';
import { safeJsonStringify } from '../utils/safeJsonStringify.js';

export class MessageBus extends EventEmitter {
  constructor(
    private readonly policyEngine: PolicyEngine,
    private readonly debug = false
  ) {
    super();
    this.debug = debug;
  }

  publish(message: Message): void {
    if (this.debug) {
      debugLogger.log('MessageBus publish:', safeJsonStringify(message));
    }
    this.emit(message.type, message);
  }

  subscribe<T extends Message>(type: MessageBusType, callback: (message: T) => void): void {
    this.on(type, callback);
  }
}
```

**Example explained:**

- Lines 2-4: Multiple import styles (default, namespace) with node: protocol
- Lines 26-29: Mixed Node.js built-ins with npm packages - node: makes distinction clear
- Lines 30: Use of node:module for createRequire shows advanced built-in usage
- Lines 50: EventEmitter from node:events as base class
- All built-ins consistently use node: protocol

### When to Use

**Use this pattern when:**

- Importing any Node.js built-in module
- Building for Node.js runtime
- Want to prevent conflicts with npm packages
- Need explicit distinction between built-ins and packages

**Avoid this pattern when:**

- Importing npm packages (don't use node: for those)
- Using very old Node.js versions that don't support node: (pre-14.18.0)

### Benefits

- **Explicit Intent**: Clear that this is a built-in, not npm package
- **Prevents Conflicts**: Avoids name collisions with npm packages
- **Better Optimization**: Bundlers can optimize built-in handling
- **Future Proof**: Official Node.js recommendation
- **IDE Support**: Better autocomplete and documentation

### Trade-offs

- **Migration Cost**: Existing code needs updating
- **Verbosity**: Adds 5 characters to each built-in import
- **Compatibility**: Requires Node.js 14.18.0+ (not an issue for modern projects)

### Common Mistakes

**Mistake 1: Forgetting node: prefix**

```typescript
// Missing node: prefix
import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';
```

**Why this matters**: Ambiguous whether this is built-in or npm package. Could break if npm package with same name is installed.

**Correct approach:**

```typescript
// Always use node: prefix
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { EventEmitter } from 'node:events';
```

**Mistake 2: Using node: for npm packages**

```typescript
// Don't use node: for npm packages
import { expect } from 'node:chai';
import React from 'node:react';
```

**Why this matters**: node: is only for built-in modules. This will fail.

**Correct approach:**

```typescript
// No node: for npm packages
import { expect } from 'chai';
import React from 'react';
```

### Testing Strategy

**What to Test:**

- Verify imports resolve correctly at runtime
- Test that built-in modules are available
- Ensure TypeScript compilation succeeds

**Test Organization:**

- Build-time checks verify correct protocol usage
- Runtime tests verify module availability

**Mock Strategy:**

- Not applicable - structural pattern

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

describe('Node.js Built-in Protocol', () => {
  it('should import path with node: protocol', () => {
    // Arrange & Act
    const result = path.join('foo', 'bar');

    // Assert
    expect(result).to.include('foo');
    expect(result).to.include('bar');
  });

  it('should import fs/promises with node: protocol', async () => {
    // Arrange
    const testPath = './test-file.txt';
    await fs.writeFile(testPath, 'test content');

    // Act
    const content = await fs.readFile(testPath, 'utf-8');

    // Assert
    expect(content).to.equal('test content');

    // Cleanup
    await fs.unlink(testPath);
  });
});
```

**Coverage Goals:**

- Import coverage: All Node.js built-ins should use node: protocol

### Related Patterns

- **[ES Modules Only](#pattern-2-es-modules-only)** - Foundation pattern
- **[Always Use .js Extension](#pattern-3-always-use-js-extension)** - Related import convention

---

## Pattern 5: No Default Exports

### Intent

Use named exports exclusively (except for oclif commands) to enable better refactoring, consistent naming, and clearer imports.

### Problem

Default exports allow consumers to name the import arbitrarily. This leads to inconsistent naming across the codebase where the same class is imported with different names. Default exports make automated refactoring difficult because tools cannot reliably track usage. Additionally, default exports provide no semantic information about what is being imported until you read the implementation.

### Solution

Use named exports for all classes, functions, interfaces, and constants. Consumers must use the declared name when importing. The exception is oclif commands, which by convention use default exports.

### Structure

```typescript
// Named exports (preferred)
export class UserService {}
export function createUser() {}
export const CONFIG = {};

// Import named exports
import { UserService, createUser, CONFIG } from './user-service.js';

// Exception: oclif commands
export default class WorkflowCommand extends Command {
  // oclif convention requires default export
}
```

### Implementation

**Step 1: Use named exports for classes**

```typescript
// Use named export
export class UserService {
  async getUser(id: string): Promise<User> {
    // Implementation
  }
}

// Import with consistent name
import { UserService } from './user-service.js';
```

**Step 2: Use named exports for functions**

```typescript
// Export functions with names
export function createUser(data: UserData): User {
  return new User(data);
}

export function validateUser(user: User): boolean {
  return user.email && user.name;
}

// Import functions
import { createUser, validateUser } from './user-utils.js';
```

**Step 3: Use named exports for constants**

```typescript
// Export constants
export const DEFAULT_TIMEOUT = 5000;
export const MAX_RETRIES = 3;
export const API_VERSION = 'v1';

// Import constants
import { DEFAULT_TIMEOUT, MAX_RETRIES } from './config.js';
```

**Step 4: Use named exports for types**

```typescript
// Export types and interfaces
export interface User {
  id: string;
  name: string;
  email: string;
}

export type UserId = string;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// Import types
import { type User, type UserId, UserRole } from './types.js';
```

### Complete Example

```typescript
// packages/core/src/confirmation-bus/types.ts
export enum MessageBusType {
  TOOL_CONFIRMATION_REQUEST = 'tool-confirmation-request',
  TOOL_CONFIRMATION_RESPONSE = 'tool-confirmation-response',
  TOOL_POLICY_REJECTION = 'tool-policy-rejection',
  TOOL_EXECUTION_SUCCESS = 'tool-execution-success',
  TOOL_EXECUTION_FAILURE = 'tool-execution-failure',
  UPDATE_POLICY = 'update-policy',
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
  correlationId: string;
  reason: string;
}

export interface ToolExecutionSuccess {
  type: MessageBusType.TOOL_EXECUTION_SUCCESS;
  correlationId: string;
  result: ToolResult;
}

export interface ToolExecutionFailure {
  type: MessageBusType.TOOL_EXECUTION_FAILURE;
  correlationId: string;
  error: Error;
}

export interface UpdatePolicy {
  type: MessageBusType.UPDATE_POLICY;
  toolName: string;
  decision: PolicyDecision;
}

export type Message =
  | ToolConfirmationRequest
  | ToolConfirmationResponse
  | ToolPolicyRejection
  | ToolExecutionSuccess
  | ToolExecutionFailure
  | UpdatePolicy;

// Consumer imports with explicit names
import {
  MessageBusType,
  type ToolConfirmationRequest,
  type ToolConfirmationResponse,
  type Message,
} from './confirmation-bus/types.js';

// packages/core/src/services/fileDiscoveryService.ts
export interface FilterFilesOptions {
  respectGitIgnore?: boolean;
  respectGeminiIgnore?: boolean;
}

export interface FilterReport {
  filteredPaths: string[];
  ignoredCount: number;
}

export class FileDiscoveryService {
  private gitIgnoreFilter: GitIgnoreFilter | null = null;
  private geminiIgnoreFilter: GeminiIgnoreFilter | null = null;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  filterFiles(filePaths: string[], options: FilterFilesOptions = {}): string[] {
    // Implementation
  }

  generateReport(filePaths: string[]): FilterReport {
    const filtered = this.filterFiles(filePaths);
    return {
      filteredPaths: filtered,
      ignoredCount: filePaths.length - filtered.length,
    };
  }
}

// Consumer imports
import {
  FileDiscoveryService,
  type FilterFilesOptions,
  type FilterReport,
} from './services/fileDiscoveryService.js';

// EXCEPTION: oclif commands use default export
// packages/cli/src/commands/workflow/index.ts
import { Command, Flags } from '@oclif/core';

export default class WorkflowCommand extends Command {
  static description = 'Execute a workflow';

  static flags = {
    task: Flags.string({ required: true }),
    ui: Flags.boolean({ default: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(WorkflowCommand);
    // Implementation
  }
}
```

**Example explained:**

- Lines 2-9: Enum exported as named export
- Lines 11-47: Multiple interface exports, all named
- Lines 49-56: Discriminated union type exported as named export
- Lines 58-63: Consumer imports multiple named exports
- Lines 66-95: Class and interface exports, all named
- Lines 97-101: Consumer imports with explicit names
- Lines 103-117: EXCEPTION for oclif commands using default export

### When to Use

**Use named exports when:**

- Exporting classes, functions, or constants
- Building reusable libraries
- Want consistent naming across codebase
- Need good IDE refactoring support
- Exporting multiple items from a file

**Use default export when:**

- Building oclif CLI commands (framework convention)
- Other frameworks that specifically require default exports

### Benefits

- **Consistent Naming**: Same import name everywhere
- **Better Refactoring**: IDEs can rename all usages
- **Clear Imports**: Immediately see what's being imported
- **Multiple Exports**: Can export many items from one file
- **Tree Shaking**: Bundlers can eliminate unused exports

### Trade-offs

- **Verbosity**: Must type full name in imports
- **Breaking Convention**: Some frameworks prefer default exports
- **Curly Braces**: Requires `{ }` in import statements

### Common Mistakes

**Mistake 1: Using default exports for classes**

```typescript
// Don't use default export
export default class UserService {}

// Allows arbitrary naming
import MyService from './user-service.js';
import UserSvc from './user-service.js';
import Whatever from './user-service.js';
```

**Why this matters**: Different names across codebase makes code harder to understand and refactor.

**Correct approach:**

```typescript
// Use named export
export class UserService {}

// Must use declared name
import { UserService } from './user-service.js';
```

**Mistake 2: Mixing default and named exports**

```typescript
// Mixing export styles
export default class UserService {}
export function createUser() {}
export const CONFIG = {};

// Confusing import syntax
import UserService, { createUser, CONFIG } from './user-service.js';
```

**Why this matters**: Inconsistent and confusing. Readers must remember which are default vs named.

**Correct approach:**

```typescript
// All named exports
export class UserService {}
export function createUser() {}
export const CONFIG = {};

// Consistent import syntax
import { UserService, createUser, CONFIG } from './user-service.js';
```

### Testing Strategy

**What to Test:**

- Verify imports work with named export syntax
- Test that all public API items are named exports
- Ensure no accidental default exports

**Test Organization:**

- Linting rules enforce named exports
- Build-time checks verify export style

**Mock Strategy:**

- Not applicable - structural pattern

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Named Exports', () => {
  it('should import class as named export', async () => {
    // Arrange & Act
    const { UserService } = await import('./user-service.js');

    // Assert
    expect(UserService).to.be.a('function');
    expect(new UserService()).to.be.instanceof(UserService);
  });

  it('should import multiple named exports', async () => {
    // Arrange & Act
    const exports = await import('./user-service.js');

    // Assert
    expect(exports).to.have.property('UserService');
    expect(exports).to.have.property('createUser');
    expect(exports).to.have.property('CONFIG');
  });

  it('should not have default export', async () => {
    // Arrange & Act
    const exports = await import('./user-service.js');

    // Assert
    expect(exports.default).to.be.undefined;
  });
});
```

**Coverage Goals:**

- Export style coverage: All exports should be named (except oclif commands)

### Related Patterns

- **[Explicit Public API via index.ts](#pattern-1-explicit-public-api-via-indexts)** - Uses named exports
- **[Code Organization](./06-code-organization.md)** - Defines what gets exported

---

## Quick Reference

### Pattern Summary Table

| Pattern                          | Use When                                  | Avoid When                | Key Benefit                             |
| -------------------------------- | ----------------------------------------- | ------------------------- | --------------------------------------- |
| Explicit Public API via index.ts | Building packages with internal structure | Single-file modules       | Encapsulation and refactoring safety    |
| ES Modules Only                  | All new TypeScript projects               | Legacy CommonJS-only code | Static analysis and tree-shaking        |
| Always Use .js Extension         | Any relative import in ES modules         | Importing npm packages    | ES module compliance                    |
| Node.js Built-in Protocol        | Importing Node.js built-ins               | Importing npm packages    | Explicit intent and conflict prevention |
| No Default Exports               | Exporting classes/functions               | oclif commands            | Consistent naming and refactoring       |

### Code Snippets

**Explicit Public API - Minimal Example:**

```typescript
// services/index.ts
export { UserService } from './user-service.js';
// internal-helper.ts is NOT exported

// Consumer
import { UserService } from './services/index.js';
```

**ES Modules - Minimal Example:**

```typescript
// ES module import/export
import { UserService } from './user-service.js';
export class OrderService {}
```

**Always Use .js Extension - Minimal Example:**

```typescript
// Use .js even for .ts files
import { UserService } from './user-service.js';
import { Config } from '../config/index.js';
```

**Node.js Built-in Protocol - Minimal Example:**

```typescript
// Use node: prefix
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { EventEmitter } from 'node:events';
```

**No Default Exports - Minimal Example:**

```typescript
// Named exports
export class UserService {}
export function createUser() {}

// Import
import { UserService, createUser } from './user-service.js';
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "import/no-default-export": "error",
    "import/extensions": ["error", "always", { "ignorePackages": true }],
    "import/no-unresolved": "error"
  },
  "overrides": [
    {
      "files": ["src/commands/**/*.ts"],
      "rules": {
        "import/no-default-export": "off"
      }
    }
  ]
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

**package.json Configuration:**

```json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./services": "./dist/services/index.js"
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
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

---

## Related Patterns

- **[Code Organization](./06-code-organization.md)** - Defines directory structure for modules
- **[Dependency Management](./08-dependency-management.md)** - Controls dependencies between modules
- **[Build Tooling](./17-build-tooling.md)** - TypeScript compilation for ES modules

---

## References

**Source Code Examples:**

- [packages/core/src/index.ts](../../../examplecode/gemini/packages/core/src/index.ts) - Public API facade example
- [packages/core/src/config/config.ts](../../../examplecode/gemini/packages/core/src/config/config.ts) - ES module imports with .js extensions
- [packages/core/src/utils/paths.ts](../../../examplecode/gemini/packages/core/src/utils/paths.ts) - node: protocol usage
- [packages/core/src/confirmation-bus/types.ts](../../../examplecode/gemini/packages/core/src/confirmation-bus/types.ts) - Named exports

**External Resources:**

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html) - Official Node.js ESM guide
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html) - TypeScript module system
- [Node.js Package Entry Points](https://nodejs.org/api/packages.html#package-entry-points) - package.json exports field

**Further Reading:**

- [ES Modules: A Cartoon Deep-Dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/) - Visual explanation of ES modules
- [Pure ESM Package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) - Guide to publishing ESM packages

---

## Changelog

- **2025-01-21**: Initial module boundary patterns documentation with examples from reference codebase
