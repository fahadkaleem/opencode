# TypeScript Configuration - Coding Standard

> **Standard ID**: STD-002
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript compiler and project configuration
> **Enforcement**: Configuration Files + CI Validation
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - STD-001
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory TypeScript compiler configuration for Node.js CLI projects. These configurations are provided as literal files that MUST be used as the baseline. All settings have explicit rationale to enable AI code generation without ambiguity.

### 1.2 Scope

**Applies to**:

- All `tsconfig.json` files in the project
- TypeScript compiler options
- Module resolution configuration
- Build output settings
- Project references (monorepo)

**Does NOT apply to**:

- ESLint TypeScript rules (see Code Style standard)
- Runtime TypeScript configuration (ts-node, tsx)
- IDE-specific settings (unless affecting compilation)

### 1.3 Enforcement Level

| Level      | Meaning                      | Mechanism                    |
| ---------- | ---------------------------- | ---------------------------- |
| **MUST**   | Exact configuration required | CI validation, build failure |
| **SHOULD** | Recommended setting          | Code review                  |
| **MAY**    | Optional setting             | Team discretion              |

---

## 2. Guiding Principles

| Principle           | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| Maximum Type Safety | Enable all strict checks; catch errors at compile time        |
| Reproducibility     | Same configuration produces identical output everywhere       |
| Explicitness        | No implicit behaviors; all settings documented with rationale |
| Modern Standards    | Target current Node.js LTS with ES modules                    |

---

## 3. Required Configuration Files

### 3.1 Root Configuration (Base)

**File Location**: `tsconfig.json` (repository root)
**Purpose**: Base configuration extended by all packages
**Modification**: Forbidden without documented exception

```json
{
  "compilerOptions": {
    // ============================================================
    // STRICT TYPE CHECKING (MUST - All Required)
    // ============================================================

    // Master strict mode switch - enables all strict sub-options
    // This is the foundation of type safety
    "strict": true,

    // Explicit strict sub-options for documentation and defense-in-depth
    // These are technically redundant with strict:true but serve as:
    // 1. Documentation of what strict enables
    // 2. Protection if strict is ever disabled
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,

    // ============================================================
    // ADDITIONAL TYPE CHECKS (MUST)
    // ============================================================

    // Requires 'override' keyword when overriding base class methods
    // Prevents accidental method overrides
    "noImplicitOverride": true,

    // Ensures all code paths return a value in non-void functions
    // Catches missing return statements
    "noImplicitReturns": true,

    // Errors on unused local variables
    // Keeps codebase clean, catches dead code
    "noUnusedLocals": true,

    // Prevents case-sensitivity issues across operating systems
    // Critical for cross-platform development (macOS vs Linux)
    "forceConsistentCasingInFileNames": true,

    // ============================================================
    // MODULE RESOLUTION (MUST)
    // ============================================================

    // ES Module system for Node.js
    // Requires .js extensions in imports, aligns with native ESM
    "module": "NodeNext",

    // Node.js 16+ resolution algorithm for ESM/CJS interop
    // Must match 'module' setting
    "moduleResolution": "NodeNext",

    // Compile to ES2022 syntax
    // Supports: class fields, private methods, top-level await
    // Requires Node.js >= 18.0.0
    "target": "ES2022",

    // ES2023 standard library types
    // Includes: Array.findLast, Array.findLastIndex, etc.
    "lib": ["ES2023"],

    // ============================================================
    // INTEROP SETTINGS (MUST)
    // ============================================================

    // Enables default imports from CommonJS modules
    // Required for: import fs from 'fs' syntax with CJS modules
    "esModuleInterop": true,

    // Allows default imports from modules without default export
    // Companion to esModuleInterop for type checking
    "allowSyntheticDefaultImports": true,

    // Preserves import/export syntax exactly as written
    // Type-only imports MUST use 'import type' syntax
    // Replaces deprecated 'isolatedModules'
    "verbatimModuleSyntax": true,

    // Enables importing .json files with type inference
    "resolveJsonModule": true,

    // ============================================================
    // BUILD SETTINGS (MUST for monorepo)
    // ============================================================

    // Enables project references for monorepo builds
    // Required for cross-package dependencies
    "composite": true,

    // Caches compilation info for faster rebuilds
    // Creates .tsbuildinfo files
    "incremental": true,

    // Generates .d.ts declaration files
    // Required when composite is true
    "declaration": true,

    // Generates source maps for debugging
    // Maps compiled JS back to TypeScript source
    "sourceMap": true,

    // Skips type checking of .d.ts files in node_modules
    // Speeds up compilation significantly
    // Avoids conflicts from transitive dependency type mismatches
    "skipLibCheck": true,

    // ============================================================
    // TYPE DEFINITIONS (MUST)
    // ============================================================

    // Explicitly include Node.js types
    // Limits ambient types to only declared ones
    "types": ["node"]
  }
}
```

#### 3.1.1 Required Settings Summary

| Setting                            | Value        | Rationale                    | Modifiable         |
| ---------------------------------- | ------------ | ---------------------------- | ------------------ |
| `strict`                           | `true`       | Foundation of type safety    | No                 |
| `noImplicitOverride`               | `true`       | Prevent accidental overrides | No                 |
| `noImplicitReturns`                | `true`       | Catch missing returns        | No                 |
| `noUnusedLocals`                   | `true`       | Remove dead code             | No                 |
| `forceConsistentCasingInFileNames` | `true`       | Cross-platform safety        | No                 |
| `module`                           | `"NodeNext"` | ESM compliance               | No                 |
| `moduleResolution`                 | `"NodeNext"` | Must match module            | No                 |
| `target`                           | `"ES2022"`   | Modern syntax support        | With justification |
| `lib`                              | `["ES2023"]` | Standard library types       | With justification |
| `esModuleInterop`                  | `true`       | CJS interop                  | No                 |
| `allowSyntheticDefaultImports`     | `true`       | Type checking for interop    | No                 |
| `verbatimModuleSyntax`             | `true`       | ESM syntax enforcement       | No                 |
| `composite`                        | `true`       | Project references           | No (monorepo)      |
| `incremental`                      | `true`       | Build performance            | No                 |
| `declaration`                      | `true`       | Required by composite        | No                 |
| `sourceMap`                        | `true`       | Debugging support            | No                 |
| `skipLibCheck`                     | `true`       | Build performance            | No                 |

#### 3.1.2 Forbidden Settings

| Setting            | Forbidden Value | Reason                                     |
| ------------------ | --------------- | ------------------------------------------ |
| `strict`           | `false`         | Disables all type safety                   |
| `noImplicitAny`    | `false`         | Allows implicit any types                  |
| `skipLibCheck`     | `false`         | Causes build failures from transitive deps |
| `module`           | `"CommonJS"`    | Project uses ES modules                    |
| `moduleResolution` | `"node"`        | Legacy resolution, incompatible with ESM   |
| `target`           | `< "ES2020"`    | Missing required syntax features           |
| `isolatedModules`  | any             | Deprecated, use verbatimModuleSyntax       |
| `paths`            | any             | Use package references instead             |
| `baseUrl`          | any             | Use package references instead             |

---

### 3.2 Package Configuration (Extends Base)

**File Location**: `packages/[package-name]/tsconfig.json`
**Purpose**: Package-specific configuration extending root
**Modification**: Only allowed settings may be overridden

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    // Output directory for compiled files
    // Each package has isolated output
    "outDir": "dist",

    // Add DOM types if package uses browser APIs
    // Only include if actually needed
    "lib": ["ES2023"],

    // Explicit composite for project references
    "composite": true,

    // Package-specific type definitions
    "types": ["node"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.2.1 Package-Level Overrides

| Setting   | When to Override               | Example                             |
| --------- | ------------------------------ | ----------------------------------- |
| `outDir`  | Always                         | `"dist"`                            |
| `lib`     | Package needs DOM APIs         | `["DOM", "DOM.Iterable", "ES2023"]` |
| `types`   | Package needs additional types | `["node", "vitest/globals"]`        |
| `jsx`     | Package uses React/JSX         | `"react-jsx"`                       |
| `include` | Package has .tsx files         | Add `"src/**/*.tsx"`                |

#### 3.2.2 Package with React/JSX

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",

    // React 17+ automatic JSX transform
    // No need to import React in JSX files
    "jsx": "react-jsx",

    // DOM types required for React components
    "lib": ["DOM", "DOM.Iterable", "ES2023"],

    "composite": true,
    "types": ["node"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.tsx", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.2.3 Package with Project References

When a package depends on another package in the monorepo:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true,
    "types": ["node"]
  },
  "include": ["index.ts", "src/**/*.ts"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../core" }, { "path": "../shared" }]
}
```

---

### 3.3 Test Configuration

**File Location**: `packages/[package-name]/tsconfig.test.json` OR `tests/tsconfig.json`
**Purpose**: Type-checking for test files without emitting
**Modification**: Allowed for test-specific needs

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    // Type-check only, no output files
    // Test runner (vitest) handles execution
    "noEmit": true,

    // Include test framework globals
    "types": ["node", "vitest/globals"]
  },
  "include": ["**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../core" }]
}
```

---

### 3.4 Standalone Package Configuration

For packages that cannot extend the root config (e.g., VSCode extensions with unique requirements):

**File Location**: `packages/[special-package]/tsconfig.json`
**Purpose**: Self-contained configuration for isolated packages
**Modification**: Must document why standalone is required

```json
{
  /**
   * CONFIGURATION EXCEPTION: STD-002 Section 3.2
   * Reason: VSCode extension has unique requirements:
   * - Different target environment (VSCode runtime)
   * - Dependency conflicts requiring different skipLibCheck rationale
   * Approved: 2025-11-29
   */
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "sourceMap": true,
    "strict": true,

    /**
     * skipLibCheck is necessary because of type conflicts:
     * Package A depends on library@4.x types while
     * Package B requires library@5.x types.
     */
    "skipLibCheck": true,

    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 4. Settings Reference

### 4.1 Strict Mode Settings

| Setting                        | Required Value | Purpose                    | Impact if Changed           |
| ------------------------------ | -------------- | -------------------------- | --------------------------- |
| `strict`                       | `true`         | Enable all strict checks   | Type safety disabled        |
| `noImplicitAny`                | `true`         | Ban implicit any           | Variables default to any    |
| `noImplicitThis`               | `true`         | Require typed this         | Runtime errors possible     |
| `strictBindCallApply`          | `true`         | Type-check bind/call/apply | Incorrect arguments allowed |
| `strictFunctionTypes`          | `true`         | Contravariant parameters   | Unsafe function assignments |
| `strictNullChecks`             | `true`         | Distinct null/undefined    | Null reference errors       |
| `strictPropertyInitialization` | `true`         | Require property init      | Undefined property access   |

### 4.2 Additional Type Check Settings

| Setting                            | Required Value | Purpose                  | Impact if Changed       |
| ---------------------------------- | -------------- | ------------------------ | ----------------------- |
| `noImplicitOverride`               | `true`         | Require override keyword | Accidental overrides    |
| `noImplicitReturns`                | `true`         | All paths must return    | Missing return values   |
| `noUnusedLocals`                   | `true`         | Error on unused vars     | Dead code accumulates   |
| `forceConsistentCasingInFileNames` | `true`         | Case-sensitive imports   | Cross-platform failures |

### 4.3 Module Settings

| Setting            | Required Value | Purpose                | Impact if Changed        |
| ------------------ | -------------- | ---------------------- | ------------------------ |
| `module`           | `"NodeNext"`   | ES module output       | CJS/ESM interop breaks   |
| `moduleResolution` | `"NodeNext"`   | Node.js ESM resolution | Import resolution fails  |
| `target`           | `"ES2022"`     | Output syntax level    | Missing syntax features  |
| `lib`              | `["ES2023"]`   | Available APIs         | Missing standard methods |

### 4.4 Interop Settings

| Setting                        | Required Value | Purpose                | Impact if Changed      |
| ------------------------------ | -------------- | ---------------------- | ---------------------- |
| `esModuleInterop`              | `true`         | CJS default imports    | Import syntax breaks   |
| `allowSyntheticDefaultImports` | `true`         | Type checking interop  | Type errors on imports |
| `verbatimModuleSyntax`         | `true`         | Preserve import syntax | Type imports in output |
| `resolveJsonModule`            | `true`         | Import JSON files      | JSON imports fail      |

### 4.5 Build Settings

| Setting        | Required Value | Purpose             | Impact if Changed        |
| -------------- | -------------- | ------------------- | ------------------------ |
| `composite`    | `true`         | Project references  | Monorepo builds fail     |
| `incremental`  | `true`         | Cached compilation  | Slow rebuilds            |
| `declaration`  | `true`         | Generate .d.ts      | Cross-package types fail |
| `sourceMap`    | `true`         | Debug mapping       | No source debugging      |
| `skipLibCheck` | `true`         | Skip .d.ts checking | Type conflicts in deps   |

---

## 5. Version Requirements

### 5.1 Runtime Versions

| Tool       | Minimum Version | Recommended Version | Rationale                      |
| ---------- | --------------- | ------------------- | ------------------------------ |
| Node.js    | 18.0.0          | 20.x LTS            | ES2022 target, native ESM      |
| TypeScript | 5.0.0           | 5.3+                | verbatimModuleSyntax, NodeNext |
| npm        | 9.0.0           | 10.x                | Workspace support              |

### 5.2 Node.js Engine Specification

In `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 5.3 TypeScript Version Lock

In `package.json`:

```json
{
  "devDependencies": {
    "typescript": "~5.3.0"
  }
}
```

**Version Strategy**: Use tilde (`~`) for TypeScript to allow patch updates only. Minor version changes may introduce breaking changes.

---

## 6. Project References (Monorepo)

### 6.1 Reference Structure

```
project-root/
├── tsconfig.json              # Base config (no files, only options)
├── packages/
│   ├── core/
│   │   └── tsconfig.json      # extends root, composite: true
│   ├── cli/
│   │   └── tsconfig.json      # extends root, references: [core]
│   └── shared/
│       └── tsconfig.json      # extends root, composite: true
└── tsconfig.build.json        # References all packages for full build
```

### 6.2 Root Build Configuration

**File Location**: `tsconfig.build.json`
**Purpose**: Orchestrate full monorepo build

```json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/shared" },
    { "path": "packages/cli" }
  ]
}
```

### 6.3 Build Commands

```bash
# Build all packages in dependency order
npx tsc --build tsconfig.build.json

# Build with verbose output
npx tsc --build tsconfig.build.json --verbose

# Clean build artifacts
npx tsc --build tsconfig.build.json --clean

# Force rebuild (ignore incremental cache)
npx tsc --build tsconfig.build.json --force
```

### 6.4 Reference Rules

| Rule        | Description                                         |
| ----------- | --------------------------------------------------- |
| Acyclic     | References must not form cycles                     |
| Order       | Build processes packages in dependency order        |
| Composite   | All referenced projects must have `composite: true` |
| Declaration | All referenced projects must emit declarations      |

---

## 7. Path Aliases

### 7.1 Policy: No Path Aliases

**MUST NOT** use `paths` or `baseUrl` for import aliases.

**Rationale**:

- Path aliases require additional tooling configuration (bundlers, test runners)
- They obscure the actual module location
- Package references provide the same benefit without complexity

### 7.2 Alternative: Package References

Instead of:

```typescript
// BAD: Path alias
import { Logger } from '@/utils/logger';
```

Use:

```typescript
// GOOD: Package import (via npm workspaces)
import { Logger } from '@project/shared';

// GOOD: Relative import within package
import { Logger } from '../utils/logger.js';
```

### 7.3 Workspace Configuration

In root `package.json`:

```json
{
  "workspaces": ["packages/*"]
}
```

In package `package.json`:

```json
{
  "name": "@project/core",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

---

## 8. Import Syntax Requirements

### 8.1 File Extensions

Due to `module: "NodeNext"`, imports MUST include `.js` extension:

```typescript
// CORRECT: .js extension (even for .ts source files)
import { UserService } from './services/userService.js';
import type { User } from './types/user.js';

// INCORRECT: No extension
import { UserService } from './services/userService';
```

### 8.2 Type-Only Imports

Due to `verbatimModuleSyntax`, type-only imports MUST use `import type`:

```typescript
// CORRECT: Explicit type import
import type { User, UserConfig } from './types/user.js';
import { UserService } from './services/userService.js';

// CORRECT: Inline type modifier
import { UserService, type UserConfig } from './services/userService.js';

// INCORRECT: Type imported as value
import { User } from './types/user.js'; // Error if User is type-only
```

### 8.3 JSON Imports

Due to `resolveJsonModule`:

```typescript
// CORRECT: JSON import with assertion
import packageJson from './package.json' with { type: 'json' };

// CORRECT: Type-safe access
const version: string = packageJson.version;
```

---

## 9. Anti-Patterns

### 9.1 Forbidden Configuration Patterns

| Pattern                 | Why Forbidden            | Correct Approach                 |
| ----------------------- | ------------------------ | -------------------------------- |
| `"strict": false`       | Disables all type safety | Keep `"strict": true`            |
| `"any"` in code         | Bypasses type system     | Use `unknown` and narrow         |
| `"skipLibCheck": false` | Causes dep conflicts     | Keep `true`, document exceptions |
| `"paths"` aliases       | Requires extra tooling   | Use package references           |
| `"target": "ES5"`       | Outdated, large output   | Use `"ES2022"` minimum           |
| `// @ts-ignore`         | Silences errors          | Fix the type error               |
| `// @ts-nocheck`        | Disables file checking   | Never use                        |

### 9.2 Common Mistakes

```json
// INCORRECT: Mixing module systems
{
  "module": "CommonJS",        // Wrong: Project is ESM
  "moduleResolution": "node"   // Wrong: Legacy resolution
}

// CORRECT: Consistent ESM configuration
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
}
```

```json
// INCORRECT: Missing composite for monorepo package
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
    // Missing: composite, declaration
  }
}

// CORRECT: Full monorepo package config
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true
    // declaration is implied by composite
  }
}
```

```typescript
// INCORRECT: Missing .js extension
import { helper } from './utils/helper';

// CORRECT: Include .js extension for NodeNext
import { helper } from './utils/helper.js';
```

---

## 10. Enforcement

### 10.1 Configuration Validation Script

```bash
#!/bin/bash
# scripts/validate-tsconfig.sh
# Validates TypeScript configuration against standards

set -euo pipefail

echo "Validating TypeScript configuration..."

# Check root tsconfig exists
if [ ! -f "tsconfig.json" ]; then
  echo "ERROR: Root tsconfig.json not found"
  exit 1
fi

# Validate strict mode is enabled
if ! grep -q '"strict": true' tsconfig.json; then
  echo "ERROR: strict mode must be enabled in tsconfig.json"
  exit 1
fi

# Validate module is NodeNext
if ! grep -q '"module": "NodeNext"' tsconfig.json; then
  echo "ERROR: module must be NodeNext in tsconfig.json"
  exit 1
fi

# Validate moduleResolution matches
if ! grep -q '"moduleResolution": "nodenext"' tsconfig.json && \
   ! grep -q '"moduleResolution": "NodeNext"' tsconfig.json; then
  echo "ERROR: moduleResolution must be nodenext/NodeNext"
  exit 1
fi

# Check all package tsconfigs extend root
for config in packages/*/tsconfig.json; do
  if [ -f "$config" ]; then
    if ! grep -q '"extends"' "$config"; then
      echo "WARNING: $config does not extend root config"
    fi
  fi
done

echo "TypeScript configuration validation passed"
```

### 10.2 CI/CD Validation

```yaml
# .github/workflows/validate.yml
name: Validate TypeScript
on: [push, pull_request]

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate tsconfig
        run: ./scripts/validate-tsconfig.sh

      - name: Type check
        run: npx tsc --build --noEmit

      - name: Check for strict violations
        run: |
          # Ensure no @ts-ignore or @ts-nocheck comments
          if grep -r "@ts-ignore\|@ts-nocheck" --include="*.ts" --include="*.tsx" src/; then
            echo "ERROR: Found @ts-ignore or @ts-nocheck comments"
            exit 1
          fi
```

### 10.3 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Type check staged TypeScript files
npx tsc --noEmit

# Ensure no ts-ignore/ts-nocheck in staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)
if [ -n "$staged_files" ]; then
  if echo "$staged_files" | xargs grep -l "@ts-ignore\|@ts-nocheck" 2>/dev/null; then
    echo "ERROR: Staged files contain @ts-ignore or @ts-nocheck"
    exit 1
  fi
fi
```

### 10.4 Code Review Checklist

- [ ] No `@ts-ignore` or `@ts-nocheck` comments added
- [ ] No `any` types introduced (use `unknown` with type guards)
- [ ] All imports use `.js` extension
- [ ] Type-only imports use `import type`
- [ ] Package tsconfig extends root config (or documents exception)
- [ ] New packages have `composite: true`

---

## 11. Exceptions

### 11.1 Allowed Modifications

| Setting  | When Modifiable                           | Documentation Required               |
| -------- | ----------------------------------------- | ------------------------------------ |
| `target` | Different Node.js version required        | Minimum Node version in package.json |
| `lib`    | Package needs DOM APIs                    | Comment in tsconfig                  |
| `jsx`    | Package uses React                        | None (expected for React)            |
| `types`  | Package needs additional type definitions | Comment listing why                  |
| `noEmit` | Test configuration                        | None (expected for tests)            |

### 11.2 Exception Documentation

When modifying a required configuration, use this format:

```json
{
  "compilerOptions": {
    /**
     * CONFIGURATION EXCEPTION: STD-002 Section 3.1
     * Setting: target
     * Standard Value: "ES2022"
     * Modified Value: "ES2020"
     * Reason: Package must support Node.js 14.x for legacy system integration
     * Impact: Cannot use class private fields, top-level await
     * Approved: 2025-11-29
     * Expiry: When legacy system is upgraded (tracked in JIRA-1234)
     */
    "target": "ES2020"
  }
}
```

### 11.3 Standalone Config Exception

When a package cannot extend the root config:

```json
{
  /**
   * STANDALONE CONFIG EXCEPTION: STD-002 Section 3.2
   * Reason: [Specific reason why extends cannot be used]
   * Requirements:
   * - MUST include all strict settings from root config
   * - MUST document rationale for each deviation
   * Approved: YYYY-MM-DD
   */
}
```

---

## 12. Quick Reference

### 12.1 File Checklist

| File                  | Location      | Required       | Template Section |
| --------------------- | ------------- | -------------- | ---------------- |
| `tsconfig.json`       | Root          | Yes            | 3.1              |
| `tsconfig.build.json` | Root          | Yes (monorepo) | 6.2              |
| `tsconfig.json`       | `packages/*/` | Yes            | 3.2              |
| `tsconfig.test.json`  | Test dirs     | Optional       | 3.3              |

### 12.2 Critical Settings Summary

| Setting                | Value        | File         |
| ---------------------- | ------------ | ------------ |
| `strict`               | `true`       | Root         |
| `module`               | `"NodeNext"` | Root         |
| `moduleResolution`     | `"NodeNext"` | Root         |
| `target`               | `"ES2022"`   | Root         |
| `composite`            | `true`       | All packages |
| `verbatimModuleSyntax` | `true`       | Root         |

### 12.3 Version Matrix

| Component  | Version   |
| ---------- | --------- |
| Node.js    | >= 18.0.0 |
| TypeScript | ~5.3.0    |
| Target     | ES2022    |
| Lib        | ES2023    |

### 12.4 Import Syntax Quick Reference

```typescript
// Relative imports: MUST include .js
import { foo } from './utils/foo.js';

// Type imports: MUST use 'import type'
import type { FooType } from './types/foo.js';

// Package imports: Use package name
import { bar } from '@project/core';

// JSON imports: Use assertion
import pkg from './package.json' with { type: 'json' };
```

---

## 13. Traceability

### 13.1 Configuration Index

| Config ID | File                       | Section | Purpose               |
| --------- | -------------------------- | ------- | --------------------- |
| CFG-001   | `tsconfig.json`            | 3.1     | Base configuration    |
| CFG-002   | `packages/*/tsconfig.json` | 3.2     | Package configuration |
| CFG-003   | `tsconfig.build.json`      | 6.2     | Build orchestration   |
| CFG-004   | `tsconfig.test.json`       | 3.3     | Test type-checking    |

### 13.2 Related Standards

| Standard                   | Relationship                      |
| -------------------------- | --------------------------------- |
| STD-001 Naming Conventions | Defines file naming for .ts files |
| STD-003 Code Style         | Defines ESLint TypeScript rules   |
| STD-004 Build & CI/CD      | Defines build commands using tsc  |

---

## 14. Open Questions

| Question ID | Question                                          | Status              |
| ----------- | ------------------------------------------------- | ------------------- |
| SQ-001      | Should we enforce `noUncheckedIndexedAccess`?     | Pending evaluation  |
| SQ-002      | Should test configs be co-located or centralized? | Decided: Co-located |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
