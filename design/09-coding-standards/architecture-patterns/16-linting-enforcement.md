---
title: Linting and Enforcement Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - All Packages
  - Build System
  - CI/CD Pipeline
related_patterns:
  - ./03-type-safety-patterns.md
  - ./06-code-organization.md
  - ./17-build-tooling.md
---

# 16. Linting and Enforcement Patterns

> **Purpose**: Comprehensive linting and code quality enforcement patterns using
> ESLint, TypeScript compiler, Prettier, and automated pre-commit hooks to
> maintain code consistency and catch errors early.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: ESLint Configuration](#pattern-1-eslint-configuration)
- [Pattern 2: TypeScript Compiler Strictness](#pattern-2-typescript-compiler-strictness)
- [Pattern 3: Self-Import Prevention](#pattern-3-self-import-prevention)
- [Pattern 4: Node Protocol Usage Enforcement](#pattern-4-node-protocol-usage-enforcement)
- [Pattern 5: Pre-commit Hooks with Lint-Staged](#pattern-5-pre-commit-hooks-with-lint-staged)
- [Pattern 6: Multi-Layer Linting Infrastructure](#pattern-6-multi-layer-linting-infrastructure)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Code quality and consistency are enforced through multiple automated layers:
ESLint for code patterns, TypeScript compiler for type safety, Prettier for
formatting, and pre-commit hooks to catch issues before they enter the
repository. This multi-layered approach ensures high code quality without manual
review burden.

Modern linting goes beyond simple formatting. It enforces architectural patterns
(no self-imports in monorepos), prevents common bugs (no floating promises), and
ensures consistency (import ordering). Automation through pre-commit hooks makes
these checks invisible to developers while maintaining strict standards.

**Why linting enforcement matters:**

- Catch bugs before they reach production (no floating promises, no unsafe any)
- Maintain consistent code style across team (formatting, import order)
- Enforce architectural boundaries (package self-imports, module boundaries)
- Reduce code review time (automated checks handle mechanical issues)
- Enable confident refactoring (strict type checking catches breaking changes)

**In this document:**

- **ESLint Configuration** - Comprehensive TypeScript and import linting rules
- **TypeScript Compiler Strictness** - Maximum strictness settings for type
  safety
- **Self-Import Prevention** - Prevent packages from importing themselves in
  monorepos
- **Node Protocol Usage** - Enforce node: protocol for built-in imports
- **Pre-commit Hooks** - Automated checks before every commit using lint-staged
- **Multi-Layer Linting** - Custom linters for YAML, shell scripts, and
  configuration files

**Prerequisites:**

- Understanding of ESLint and TypeScript configuration
- Familiarity with Git hooks
- Knowledge of monorepo architecture patterns
- Experience with CI/CD pipelines

---

## Pattern 1: ESLint Configuration

### Intent

Enforce comprehensive code quality, type safety, and import organization
standards using ESLint with TypeScript support.

### Problem

Without strict linting rules, codebases drift toward inconsistency. Teams waste
time debating style in code reviews. Common mistakes like floating promises,
unsafe any types, and circular imports slip through. Import statements become
disorganized, making dependencies unclear. Manual enforcement is error-prone and
time-consuming.

### Solution

Configure ESLint with flat config format, TypeScript ESLint plugin, import
plugin, and custom rules. Enable recommended TypeScript rules, add import
ordering and organization, prevent require() usage, enforce no-explicit-any, and
configure package-specific overrides for monorepo structure.

### Structure

```
eslint.config.js (flat config)
├── Global ignores (node_modules, dist)
├── Recommended configs
│   ├── eslint.configs.recommended
│   ├── typescript-eslint.configs.recommended
│   └── prettier config (must be last)
├── File-specific configurations
│   ├── Source files (*.ts, *.tsx)
│   ├── Test files (*.test.ts)
│   └── Scripts (./scripts/**/*.js)
└── Custom rules per package
```

### Implementation

**Step 1: Install ESLint with TypeScript and Import plugins**

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-import eslint-config-prettier typescript-eslint
```

**Step 2: Create flat config file**

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/*', 'eslint.config.js', 'packages/**/dist/**', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // General rules for all TypeScript files
    files: ['packages/*/src/**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Import organization
      'import/no-internal-modules': [
        'error',
        {
          allow: ['yargs/**'], // Allow specific internal imports
        },
      ],
      'import/no-relative-packages': 'error',

      // Code quality
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi-line'],
      'default-case': 'error',

      // Syntax restrictions
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="require"]',
          message: 'Avoid using require(). Use ES6 imports instead.',
        },
        {
          selector: 'ThrowStatement > Literal:not([value=/^\\w+Error:/])',
          message: 'Do not throw string literals. Throw new Error(...) instead.',
        },
      ],
    },
  },
  // Prettier config must be last
  prettierConfig
);
```

**Step 3: Add package.json scripts**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx"
  }
}
```

### Complete Example

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import vitest from '@vitest/eslint-plugin';
import globals from 'globals';

export default tseslint.config(
  {
    // Global ignores
    ignores: ['node_modules/*', 'eslint.config.js', 'packages/**/dist/**', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // TypeScript source files
    files: ['packages/*/src/**/*.{ts,tsx}'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        node: true,
      },
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // TypeScript Best Practices
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-inferrable-types': [
        'error',
        { ignoreParameters: true, ignoreProperties: true },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false }],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Import organization
      'import/no-internal-modules': [
        'error',
        {
          allow: ['yargs/**'],
        },
      ],
      'import/no-relative-packages': 'error',

      // General code quality
      'arrow-body-style': ['error', 'as-needed'],
      curly: ['error', 'multi-line'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-cond-assign': 'error',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="require"]',
          message: 'Avoid using require(). Use ES6 imports instead.',
        },
        {
          selector: 'ThrowStatement > Literal:not([value=/^\\w+Error:/])',
          message: 'Do not throw string literals. Throw new Error("...") instead.',
        },
      ],
      'no-unsafe-finally': 'error',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      radix: 'error',
      'default-case': 'error',
    },
  },
  {
    // Test files configuration
    files: ['packages/*/src/**/*.test.{ts,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'off',
      'vitest/no-commented-out-tests': 'off',
    },
  },
  // Prettier must be last
  prettierConfig
);
```

**Example explained:**

- Lines 1-6: Imports all necessary ESLint plugins and configurations
- Lines 8-16: Defines global ignores for generated files and dependencies
- Lines 17-18: Applies recommended ESLint and TypeScript ESLint rules
- Lines 19-101: Main TypeScript source file configuration with comprehensive
  rules
- Lines 102-111: Test-specific configuration overrides
- Line 113: Prettier config must be last to disable conflicting rules

### When to Use

**Use this pattern when:**

- Building a TypeScript project of any size
- Working in a team environment requiring consistency
- Maintaining a monorepo with multiple packages
- Integrating with CI/CD pipelines for automated checks
- Enforcing architectural boundaries (imports, module structure)

**Avoid this pattern when:**

- Working on a quick prototype or throwaway code
- Contributing to a project with different linting standards (follow their
  conventions)
- Linting would cause more friction than value (extremely rare)

### Benefits

- **Automatic Code Quality**: Catches common mistakes before runtime
- **Consistent Style**: Eliminates style debates in code reviews
- **Type Safety Enforcement**: Prevents unsafe any types and type assertions
- **Import Organization**: Enforces consistent import patterns and prevents
  circular dependencies
- **Fast Feedback**: Errors shown in IDE immediately, not during code review
- **Architectural Enforcement**: Prevents violations of package boundaries and
  module structure

### Trade-offs

- **Initial Setup Time**: Requires time to configure rules and align with team
- **Learning Curve**: Developers must understand rules to fix violations
- **Build Time Impact**: Linting adds time to build process (mitigated by
  caching)
- **Rule Conflicts**: Sometimes rules conflict with project needs (can be
  overridden per-file)

### Common Mistakes

**Mistake 1: Not ordering Prettier config last**

```javascript
// Bad: Prettier in the middle causes conflicts
export default tseslint.config(
  eslint.configs.recommended,
  prettierConfig, // Too early
  {
    files: ['src/**/*.ts'],
    rules: {
      // These might conflict with Prettier
    },
  }
);
```

**Correct approach:**

```javascript
// Good: Prettier last to disable conflicting rules
export default tseslint.config(
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Custom rules
    },
  },
  prettierConfig // Always last
);
```

**Why this matters**: Prettier config disables ESLint formatting rules. If
placed earlier, subsequent configs might re-enable conflicting rules, causing
linting errors for properly formatted code.

**Mistake 2: Ignoring TypeScript unused variable warnings**

```javascript
// Bad: Completely disabling unused vars
export default tseslint.config({
  rules: {
    '@typescript-eslint/no-unused-vars': 'off', // Hides real issues
  },
});
```

**Correct approach:**

```javascript
// Good: Allow _ prefix for intentionally unused variables
export default tseslint.config({
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_', // _req, _context
        varsIgnorePattern: '^_', // _unused
        caughtErrorsIgnorePattern: '^_', // catch (_error)
      },
    ],
  },
});
```

**Why this matters**: Unused variables often indicate bugs (forgot to use the
value, copy-paste errors). The underscore pattern allows intentional unused
variables (like unused function parameters) while catching real issues.

**Mistake 3: Not using file-specific configurations**

```javascript
// Bad: Same rules for source and test files
export default tseslint.config({
  files: ['**/*.ts'],
  rules: {
    'no-console': 'error', // Breaks test output
  },
});
```

**Correct approach:**

```javascript
// Good: Different rules for source vs test vs scripts
export default tseslint.config(
  {
    // Source files: strict
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
  {
    // Test files: relaxed
    files: ['src/**/*.test.ts'],
    rules: {
      'no-console': 'off', // Allow console in tests
    },
  },
  {
    // Scripts: allow console, require
    files: ['scripts/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  }
);
```

**Why this matters**: Different file types have different requirements. Test
files need console output. Build scripts might use require(). File-specific
configs allow appropriate strictness per context.

### Testing Strategy

**What to Test:**

- ESLint configuration loads without errors
- Custom rules trigger on violations
- Ignored files are not linted
- File-specific configurations apply correctly
- All source files pass linting

**Test Organization:**

- Add linting to CI/CD pipeline
- Run lint checks before tests
- Cache lint results for performance
- Fail builds on linting errors

**Mock Strategy:**

- No mocking needed for linting
- Use real ESLint engine
- Test on actual source files

**Test Example:**

```json
// package.json CI/CD integration
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:ci": "eslint . --ext .ts,.tsx --max-warnings 0",
    "test": "npm run lint && npm run typecheck && vitest run",
    "ci": "npm run lint:ci && npm run typecheck && npm run test"
  }
}
```

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint:ci

  test:
    runs-on: ubuntu-latest
    needs: lint # Tests only run if linting passes
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
```

**Coverage Goals:**

- 100% of TypeScript source files linted
- 0 warnings in CI mode
- All custom rules tested with violations

### Related Patterns

- **[TypeScript Compiler Strictness](#pattern-2-typescript-compiler-strictness)** -
  Complements ESLint with compile-time type checking
- **[Pre-commit Hooks](#pattern-5-pre-commit-hooks-with-lint-staged)** -
  Automatically runs linting before commits
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - ESLint enforces
  patterns defined in type safety

---

## Pattern 2: TypeScript Compiler Strictness

### Intent

Enable maximum TypeScript compiler strictness to catch type errors, implicit
behaviors, and unsafe patterns at compile time.

### Problem

Default TypeScript settings allow implicit any, skip unused variable checks, and
tolerate inconsistent casing. These loose settings let type errors slip through,
causing runtime crashes. Without strict checks, refactoring becomes risky and
type annotations provide false confidence.

### Solution

Enable all strict mode options, additional checks for unused locals and
parameters, implicit returns, and fallthrough cases. Configure
verbatimModuleSyntax for proper ESM behavior. Enable composite mode for monorepo
builds with incremental compilation.

### Structure

```json
{
  "compilerOptions": {
    "strict": true, // Enables all strict checks
    "noImplicitAny": true,
    "strictNullChecks": true,
    // ... additional strict options
    "verbatimModuleSyntax": true, // ESM correctness
    "composite": true, // Monorepo support
    "incremental": true // Fast rebuilds
  }
}
```

### Implementation

**Step 1: Enable strict mode and all sub-options**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true
  }
}
```

**Step 2: Add additional checks beyond strict mode**

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 3: Configure module system for ESM**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "es2022",
    "lib": ["ES2023"],
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true
  }
}
```

**Step 4: Enable monorepo features**

```json
{
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Complete Example

```json
{
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,

    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,

    // Module system (ESM)
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "target": "es2022",
    "lib": ["ES2023"],
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // Output options
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Monorepo support
    "composite": true,
    "incremental": true,

    // Performance
    "skipLibCheck": true,

    // Node types
    "types": ["node", "vitest/globals"]
  }
}
```

**Example explained:**

- Lines 3-11: All strict mode options enabled for maximum safety
- Lines 13-17: Additional checks beyond strict mode
- Lines 19-26: ESM module configuration with NodeNext resolution
- Lines 28-31: Source maps and declarations for debugging
- Lines 33-35: Monorepo incremental build support
- Line 38: Skip lib checking for faster builds
- Line 41: Type definitions for Node.js and testing

### When to Use

**Use this pattern when:**

- Starting any new TypeScript project
- Maintaining production code that must be reliable
- Working in a monorepo requiring project references
- Using ESM modules (always enable verbatimModuleSyntax)
- Team needs compile-time safety guarantees

**Avoid this pattern when:**

- Migrating legacy JavaScript (use gradual strictness increase)
- Prototyping or spike code (consider trade-offs)
- Working with poorly-typed third-party libraries (use skipLibCheck)

### Benefits

- **Compile-Time Safety**: Catches errors before code runs
- **Null Safety**: Prevents null/undefined access errors
- **Refactoring Confidence**: Type errors show all affected code
- **IDE Support**: Full IntelliSense and autocomplete
- **Fast Builds**: Incremental compilation in monorepos

### Trade-offs

- **Initial Migration Cost**: Existing code may need type fixes
- **Verbosity**: May require more type annotations
- **Build Time**: Type checking adds compilation time (mitigated by incremental
  builds)
- **Learning Curve**: Strict mode requires understanding TypeScript's type
  system

### Common Mistakes

**Mistake 1: Using verbatimModuleSyntax without updating imports**

```typescript
// Bad: Ambiguous import (type or value?)
import { User } from './types.js';

// Runtime error if User is type-only and gets stripped
const user: User = new User();
```

**Correct approach:**

```typescript
// Good: Explicit type-only import
import type { User } from './types.js';
import { createUser } from './user-service.js';

// Clear: createUser is a value, User is a type
const user: User = createUser();
```

**Why this matters**: `verbatimModuleSyntax: true` prevents TypeScript from
eliding imports. Without explicit `type` keyword, type-only imports become
runtime imports, potentially causing circular dependencies or runtime errors.

**Mistake 2: Disabling strict checks with any**

```typescript
// Bad: Defeats the purpose of strict mode
function processData(data: any) {
  return data.value.toUpperCase(); // No type checking
}
```

**Correct approach:**

```typescript
// Good: Use unknown and narrow the type
function processData(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof data.value === 'string'
  ) {
    return data.value.toUpperCase();
  }
  throw new Error('Invalid data format');
}
```

**Why this matters**: Using `any` disables all strict checks. `unknown` requires
explicit type narrowing, maintaining type safety while handling dynamic data.

### Testing Strategy

**What to Test:**

- TypeScript compilation succeeds with no errors
- All strict checks are enabled in tsconfig
- No implicit any warnings in output
- Incremental builds work correctly

**Test Organization:**

- Add typecheck script to package.json
- Run typecheck before tests in CI
- Cache tsbuildinfo for fast incremental builds

**Mock Strategy:**

- No mocking needed for type checking
- Use real TypeScript compiler

**Test Example:**

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",
    "build": "tsc",
    "test": "npm run typecheck && vitest run"
  }
}
```

```yaml
# .github/workflows/ci.yml
- name: Type Check
  run: npm run typecheck

- name: Build
  run: npm run build
```

**Coverage Goals:**

- Zero TypeScript errors in strict mode
- 100% of source files type-checked
- All public API has explicit return types

### Related Patterns

- **[ESLint Configuration](#pattern-1-eslint-configuration)** - Complements
  compiler with runtime pattern checks
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Defines patterns
  enforced by compiler

---

## Pattern 3: Self-Import Prevention

### Intent

Prevent packages in a monorepo from importing themselves by package name,
enforcing relative imports instead.

### Problem

In monorepos, a package can accidentally import itself using its published
package name (e.g., import from '@myapp/core' inside the core package). This
creates circular dependencies at the package level, causes module resolution
issues during development, breaks before the package is published, and obscures
the actual file being imported.

### Solution

Configure ESLint no-restricted-imports rule per package to disallow importing
the package's own name. Force relative imports within packages for clarity and
performance.

### Structure

```
eslint.config.js
├── Package-specific configurations
│   ├── packages/core/src/**
│   │   └── Disallow: '@myapp/core'
│   ├── packages/cli/src/**
│   │   └── Disallow: '@myapp/cli'
│   └── packages/utils/src/**
│       └── Disallow: '@myapp/utils'
```

### Implementation

**Step 1: Add package-specific ESLint configs**

```javascript
export default tseslint.config(
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: '@myapp/core',
          message: 'Please use relative imports within the @myapp/core package.',
        },
      ],
    },
  },
  {
    files: ['packages/cli/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: '@myapp/cli',
          message: 'Please use relative imports within the @myapp/cli package.',
        },
      ],
    },
  }
);
```

**Step 2: Verify in tests**

```bash
# This should error in packages/core/src/
import { Something } from '@myapp/core';  # ERROR

# This is correct
import { Something } from './something.js';  # OK
```

### Complete Example

```javascript
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Prevent self-imports in core package
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: '@google/gemini-cli-core',
          message: 'Please use relative imports within the @google/gemini-cli-core package.',
        },
      ],
    },
  },
  // Prevent self-imports in CLI package
  {
    files: ['packages/cli/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          name: '@google/gemini-cli',
          message: 'Please use relative imports within the @google/gemini-cli package.',
        },
      ],
    },
  }
);
```

**Example explained:**

- Lines 11-21: Core package cannot import '@google/gemini-cli-core'
- Lines 23-33: CLI package cannot import '@google/gemini-cli'
- Custom error messages guide developers to use relative imports

### When to Use

**Use this pattern when:**

- Building monorepos with multiple packages
- Packages have published package names
- Circular dependency prevention is critical

**Avoid this pattern when:**

- Single package projects (not applicable)
- Package name aliases are intentional (rare)

### Benefits

- **Prevents Circular Dependencies**: No package-level cycles
- **Clearer Imports**: Relative paths show file location
- **Better Performance**: Avoids module resolution overhead
- **Catches Mistakes Early**: ESLint error before runtime

### Trade-offs

- **Configuration Per Package**: Need separate config block per package
- **Refactoring**: Moving files requires updating relative imports

### Common Mistakes

**Mistake 1: Not applying to all packages**

```javascript
// Bad: Only core package protected
{
  files: ['packages/core/src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      { name: '@myapp/core', message: 'Use relative imports' },
    ],
  },
}
// CLI package can still self-import
```

**Correct approach:**

```javascript
// Good: Every package has self-import prevention
export default [
  {
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { name: '@myapp/core', message: 'Use relative imports' }],
    },
  },
  {
    files: ['packages/cli/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { name: '@myapp/cli', message: 'Use relative imports' }],
    },
  },
  // ... all packages
];
```

**Why this matters**: Each package needs its own no-restricted-imports rule.
Missing packages can still self-import.

### Testing Strategy

**What to Test:**

- Self-imports are caught by ESLint
- Relative imports pass linting
- All packages have self-import protection

**Test Example:**

```bash
# Should fail
cd packages/core
echo "import { foo } from '@myapp/core';" > test.ts
npm run lint  # ERROR: Use relative imports

# Should pass
echo "import { foo } from './foo.js';" > test.ts
npm run lint  # OK
```

### Related Patterns

- **[ESLint Configuration](#pattern-1-eslint-configuration)** - Self-import
  prevention is an ESLint rule
- **[Module Boundaries](./07-module-boundaries.md)** - Enforcing package import
  boundaries

---

## Pattern 4: Node Protocol Usage Enforcement

### Intent

Enforce using the `node:` protocol prefix for all Node.js built-in module
imports.

### Problem

Node.js built-in modules can be imported with or without the `node:` prefix
(e.g., `import fs from 'fs'` vs `import fs from 'node:fs'`). Without the prefix,
there's ambiguity: is this a built-in module or a package? User-created packages
can shadow built-ins. Future Node.js versions might add new built-ins that
conflict with existing packages.

### Solution

Use eslint-plugin-import's enforce-node-protocol-usage rule to require `node:`
prefix on all Node.js built-in imports. This makes built-ins visually distinct,
prevents shadowing, and future-proofs code.

### Structure

```javascript
import fs from 'node:fs'; // Built-in (explicit)
import path from 'node:path'; // Built-in (explicit)
import express from 'express'; // Package (no prefix)
```

### Implementation

**Step 1: Configure ESLint rule**

```javascript
import importPlugin from 'eslint-plugin-import';

export default tseslint.config({
  files: ['./**/*.{tsx,ts,js}'],
  plugins: {
    import: importPlugin,
  },
  rules: {
    'import/enforce-node-protocol-usage': ['error', 'always'],
  },
});
```

**Step 2: Fix existing imports**

```bash
npm run lint:fix  # Auto-fixes to add node: prefix
```

### Complete Example

```javascript
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['./**/*.{tsx,ts,js}'],
  plugins: {
    import: importPlugin,
  },
  rules: {
    'import/enforce-node-protocol-usage': ['error', 'always'],
  },
});
```

**Example usage in code:**

```typescript
// All built-ins use node: prefix
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Packages do not use node: prefix
import express from 'express';
import { z } from 'zod';
```

**Example explained:**

- Lines 7-8: Import import plugin for enforcement
- Lines 16-17: Enable enforce-node-protocol-usage rule in 'always' mode
- Lines 21-28: Code examples showing correct usage pattern

### When to Use

**Use this pattern when:**

- Starting any new Node.js project
- Using Node.js 16+ (node: protocol support)
- Want clear distinction between built-ins and packages
- Preventing package name conflicts

**Avoid this pattern when:**

- Supporting Node.js < 16 (no node: protocol)
- Working in browser environment (no Node.js built-ins)

### Benefits

- **Visual Clarity**: Instantly recognize Node.js built-ins
- **No Shadowing**: Packages can't override built-ins
- **Future-Proof**: New Node.js built-ins won't conflict
- **Auto-Fixable**: ESLint --fix adds node: prefix automatically

### Trade-offs

- **Node.js 16+ Required**: Older versions don't support node: protocol
- **Migration**: Existing code needs updating

### Common Mistakes

**Mistake 1: Mixing styles**

```typescript
// Bad: Inconsistent import styles
import fs from 'fs'; // No prefix
import path from 'node:path'; // Has prefix
import { execSync } from 'child_process'; // No prefix
```

**Correct approach:**

```typescript
// Good: All built-ins use node: prefix
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
```

**Why this matters**: Consistency makes code scannable. All built-ins should use
the same import style.

### Testing Strategy

**What to Test:**

- All Node.js built-in imports use node: prefix
- Package imports do not use node: prefix
- ESLint catches violations

**Test Example:**

```bash
# Check enforcement
npm run lint

# Auto-fix missing node: prefixes
npm run lint:fix
```

### Related Patterns

- **[ESLint Configuration](#pattern-1-eslint-configuration)** - Node protocol
  enforcement is an ESLint rule
- **[Code Organization](./06-code-organization.md)** - Import organization
  standards

---

## Pattern 5: Pre-commit Hooks with Lint-Staged

### Intent

Automatically run linting, formatting, and type checking only on staged files
before each commit using Husky and lint-staged.

### Problem

Running full linting on entire codebase before every commit is slow, especially
in large monorepos. Developers skip pre-commit checks to save time, introducing
violations. Manual enforcement fails when developers forget to run checks. CI
catches issues too late, after code is committed. Full repo linting wastes time
checking unchanged files.

### Solution

Use Husky to install Git hooks and lint-staged to run linters only on files
staged for commit. Configure different linters per file type, automatically fix
issues when possible, and fail the commit if errors remain. This provides fast
feedback with minimal overhead.

### Structure

```
.husky/
└── pre-commit           # Git hook script
package.json
├── lint-staged config   # What to run per file type
└── scripts
    └── pre-commit.js    # Runs lint-staged via API
```

### Implementation

**Step 1: Install Husky and lint-staged**

```bash
npm install --save-dev husky lint-staged
npx husky init
```

**Step 2: Create pre-commit hook**

```bash
# .husky/pre-commit
npm run pre-commit || {
  echo ''
  echo '===================================================='
  echo 'pre-commit checks failed. in case of emergency, run:'
  echo ''
  echo 'git commit --no-verify'
  echo '===================================================='
  exit 1
}
```

**Step 3: Configure lint-staged in package.json**

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0 --no-warn-ignored"],
    "eslint.config.js": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Step 4: Create pre-commit script**

```javascript
// scripts/pre-commit.js
import { execSync } from 'node:child_process';
import lintStaged from 'lint-staged';

try {
  const root = execSync('git rev-parse --show-toplevel').toString().trim();
  const passed = await lintStaged({ cwd: root });
  process.exit(passed ? 0 : 1);
} catch {
  process.exit(1);
}
```

**Step 5: Add package.json script**

```json
{
  "scripts": {
    "pre-commit": "node scripts/pre-commit.js"
  }
}
```

### Complete Example

```bash
# .husky/pre-commit
npm run pre-commit || {
  echo ''
  echo '===================================================='
  echo 'pre-commit checks failed. in case of emergency, run:'
  echo ''
  echo 'git commit --no-verify'
  echo '===================================================='
  exit 1
}
```

```javascript
// scripts/pre-commit.js
import { execSync } from 'node:child_process';
import lintStaged from 'lint-staged';

try {
  // Get repository root
  const root = execSync('git rev-parse --show-toplevel').toString().trim();

  // Run lint-staged with API directly
  const passed = await lintStaged({ cwd: root });

  // Exit with appropriate code
  process.exit(passed ? 0 : 1);
} catch {
  // Exit with error code
  process.exit(1);
}
```

```json
{
  "scripts": {
    "pre-commit": "node scripts/pre-commit.js"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0 --no-warn-ignored"],
    "eslint.config.js": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Example explained:**

- Lines 1-10: Husky hook calls pre-commit script, shows helpful message on
  failure
- Lines 14-25: Pre-commit script runs lint-staged programmatically
- Lines 27-41: Lint-staged config defines commands per file type
- Auto-fixes are applied and staged; commit proceeds if all pass

### When to Use

**Use this pattern when:**

- Working in any team environment
- Want fast pre-commit checks (only changed files)
- Need to prevent linting violations from being committed
- Monorepos where full linting is slow

**Avoid this pattern when:**

- Solo project where discipline isn't an issue (still recommended though)
- Git hooks interfere with workflow (can bypass with --no-verify)

### Benefits

- **Fast**: Only lints staged files, not entire repo
- **Automatic**: Developers don't have to remember to run checks
- **Auto-Fix**: Many issues fixed automatically before commit
- **Early Feedback**: Errors caught before CI, saving time
- **Consistent**: All developers run same checks

### Trade-offs

- **Commit Delay**: Adds 1-5 seconds to commit time
- **Can Be Bypassed**: --no-verify skips hooks (but discouraged)
- **Learning Curve**: Developers must understand why commits fail

### Common Mistakes

**Mistake 1: Running linters sequentially instead of in array**

```json
// Bad: Prettier runs only if ESLint succeeds
{
  "lint-staged": {
    "*.ts": "eslint --fix",
    "*.ts": "prettier --write" // Never runs if ESLint fails
  }
}
```

**Correct approach:**

```json
// Good: All commands in array run on same files
{
  "lint-staged": {
    "*.ts": [
      "prettier --write", // Format first
      "eslint --fix" // Then lint
    ]
  }
}
```

**Why this matters**: Lint-staged runs commands in arrays sequentially on the
same files. Separate keys would only run the last one.

**Mistake 2: Not allowing ESLint to ignore files**

```json
// Bad: ESLint tries to lint ignored files
{
  "lint-staged": {
    "*.ts": ["eslint --fix --max-warnings 0"]
  }
}
```

**Correct approach:**

```json
// Good: --no-warn-ignored prevents errors for ignored files
{
  "lint-staged": {
    "*.ts": ["eslint --fix --max-warnings 0 --no-warn-ignored"]
  }
}
```

**Why this matters**: Lint-staged might pass ignored files to ESLint (like
dist/). The --no-warn-ignored flag prevents errors for these files.

### Testing Strategy

**What to Test:**

- Pre-commit hook is installed (.husky/pre-commit exists)
- Hook runs on git commit
- Violations prevent commit
- Auto-fixes are staged automatically
- --no-verify bypasses hook

**Test Example:**

```bash
# Test hook is installed
git commit --dry-run

# Test hook catches violations
echo "const x = 'bad'" > test.ts
git add test.ts
git commit -m "test"  # Should fail on linting

# Test auto-fix works
echo "const x = 'good';" > test.ts
git add test.ts
git commit -m "test"  # Should succeed after auto-fix

# Test bypass works
git commit -m "test" --no-verify  # Skips hook
```

### Related Patterns

- **[ESLint Configuration](#pattern-1-eslint-configuration)** - Pre-commit runs
  ESLint
- **[TypeScript Compiler Strictness](#pattern-2-typescript-compiler-strictness)** -
  Can add typecheck to pre-commit
- **[Multi-Layer Linting](#pattern-7-multi-layer-linting-infrastructure)** -
  Pre-commit integrates all linters

---

## Pattern 6: Multi-Layer Linting Infrastructure

### Intent

Implement comprehensive linting for all file types including shell scripts,
YAML, GitHub Actions, and TypeScript configuration using specialized linters.

### Problem

Most projects only lint TypeScript/JavaScript, ignoring shell scripts, YAML
files, and configuration. Shell scripts have syntax errors that cause runtime
failures. YAML files have indentation issues breaking CI/CD. GitHub Actions
workflows have invalid syntax. TypeScript configuration drifts from standards.
Manual review of these files is inconsistent.

### Solution

Create a unified linting script that orchestrates multiple specialized linters:
ESLint for TypeScript/JavaScript, Prettier for formatting, actionlint for GitHub
Actions, shellcheck for shell scripts, yamllint for YAML files, and custom
linters for project-specific rules (tsconfig validation, sensitive keywords).

### Structure

```
scripts/
├── lint.js              # Orchestrates all linters
├── pre-commit.js        # Runs lint-staged
└── (linter binaries downloaded to temp dir)

Linters:
├── ESLint               # TypeScript/JavaScript
├── Prettier             # Formatting
├── actionlint           # GitHub Actions workflows
├── shellcheck           # Shell scripts
├── yamllint             # YAML files
└── Custom               # Project-specific rules
```

### Implementation

**Step 1: Create linter infrastructure**

```javascript
// scripts/lint.js
const LINTERS = {
  actionlint: {
    check: 'command -v actionlint',
    installer: `
      mkdir -p "${TEMP_DIR}/actionlint"
      curl -sSLo "${TEMP_DIR}/.actionlint.tgz" "https://..."
      tar -xzf "${TEMP_DIR}/.actionlint.tgz" -C "${TEMP_DIR}/actionlint"
    `,
    run: `actionlint -color -ignore 'SC2002:'`,
  },
  shellcheck: {
    check: 'command -v shellcheck',
    installer: `...`,
    run: `git ls-files | grep -E '\\.(sh|bash)' | xargs shellcheck`,
  },
  yamllint: {
    check: `test -x "${PYTHON_VENV_PATH}/bin/yamllint"`,
    installer: `python3 -m venv "${PYTHON_VENV_PATH}" && ...`,
    run: `git ls-files | grep -E '\\.(yaml|yml)' | xargs yamllint`,
  },
};
```

**Step 2: Implement setup and execution**

```javascript
export function setupLinters() {
  console.log('Setting up linters...');
  rmSync(TEMP_DIR, { recursive: true, force: true });
  mkdirSync(TEMP_DIR, { recursive: true });

  for (const linter in LINTERS) {
    const { check, installer } = LINTERS[linter];
    if (!runCommand(check, 'ignore')) {
      console.log(`Installing ${linter}...`);
      if (!runCommand(installer)) {
        console.error(`Failed to install ${linter}`);
        process.exit(1);
      }
    }
  }
}

export function runESLint() {
  console.log('\nRunning ESLint...');
  if (!runCommand('npm run lint')) {
    process.exit(1);
  }
}

export function runActionlint() {
  console.log('\nRunning actionlint...');
  if (!runCommand(LINTERS.actionlint.run)) {
    process.exit(1);
  }
}
```

**Step 3: Add custom linters**

```javascript
export function runTSConfigLinter() {
  console.log('\nRunning tsconfig linter...');

  const files = execSync("git ls-files 'packages/**/tsconfig.json'").toString().trim().split('\n');

  let hasError = false;

  for (const file of files) {
    const config = JSON.parse(readFileSync(file, 'utf-8'));

    if (config.exclude) {
      const allowedExclude = new Set(['node_modules', 'dist']);
      const invalidExcludes = config.exclude.filter((item) => !allowedExclude.has(item));

      if (invalidExcludes.length > 0) {
        console.error(`Error: ${file} has invalid excludes`);
        hasError = true;
      }
    }
  }

  if (hasError) process.exit(1);
}
```

**Step 4: Create main runner**

```javascript
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all linters
    setupLinters();
    runESLint();
    runActionlint();
    runShellcheck();
    runYamllint();
    runPrettier();
    runTSConfigLinter();
    console.log('\nAll linting checks passed!');
  } else {
    // Run specific linters
    if (args.includes('--eslint')) runESLint();
    if (args.includes('--actionlint')) runActionlint();
    // ... etc
  }
}

main();
```

### Complete Example

See the complete implementation in the References section below. The full script
includes:

- Automatic linter installation
- Cross-platform support (macOS, Linux)
- Git integration (only lint tracked files)
- Custom linters (tsconfig, sensitive keywords)
- Selective linting (run individual linters)
- CI/CD integration

### When to Use

**Use this pattern when:**

- Project has shell scripts, YAML files, or GitHub Actions
- Want comprehensive quality checks beyond TypeScript
- Need automated linter installation for CI
- Maintaining monorepos with complex configuration

**Avoid this pattern when:**

- Simple TypeScript-only project (ESLint + Prettier sufficient)
- No shell scripts, YAML, or GitHub Actions to lint
- Limited build time budget

### Benefits

- **Comprehensive Coverage**: All file types linted, not just TypeScript
- **Automated Setup**: Linters installed automatically
- **CI Integration**: Works in CI without manual installation
- **Custom Rules**: Easy to add project-specific linting
- **Fast Execution**: Only lints tracked Git files

### Trade-offs

- **Complexity**: More moving parts than simple ESLint
- **Initial Setup Time**: Downloading and installing linters
- **Build Time**: Additional linting adds time
- **Maintenance**: Need to update linter versions

### Common Mistakes

**Mistake 1: Not caching linter installations**

```javascript
// Bad: Downloads linters every time
function runLinters() {
  downloadActionlint();
  downloadShellcheck();
  // Slow!
}
```

**Correct approach:**

```javascript
// Good: Check if linters exist before downloading
function setupLinters() {
  for (const linter in LINTERS) {
    const { check, installer } = LINTERS[linter];
    if (!runCommand(check, 'ignore')) {
      console.log(`Installing ${linter}...`);
      runCommand(installer);
    }
  }
}
```

**Why this matters**: Checking for existing linters avoids re-downloading on
every run, saving time.

### Testing Strategy

**What to Test:**

- All linters install successfully
- Each linter catches its violations
- Selective linting works (--eslint, --shellcheck, etc.)
- CI integration works

**Test Example:**

```bash
# Install all linters
npm run lint:all -- --setup

# Run specific linter
npm run lint:all -- --shellcheck

# Run all linters
npm run lint:all

# In CI
npm run lint:ci  # Exits 1 on any failures
```

### Related Patterns

- **[ESLint Configuration](#pattern-1-eslint-configuration)** -
  TypeScript/JavaScript linting
- **[Pre-commit Hooks](#pattern-6-pre-commit-hooks-with-lint-staged)** - Runs
  linters before commit
- **[Build Tooling](./17-build-tooling.md)** - Integrates linting into build
  process

---

## Quick Reference

### Pattern Summary Table

| Pattern                        | Use When                         | Avoid When               | Key Benefit                            |
| ------------------------------ | -------------------------------- | ------------------------ | -------------------------------------- |
| ESLint Configuration           | Any TypeScript project           | Quick prototypes         | Comprehensive code quality enforcement |
| TypeScript Compiler Strictness | Production code                  | Legacy JS migration      | Compile-time type safety               |
| Self-Import Prevention         | Monorepos                        | Single package projects  | Prevents circular dependencies         |
| Node Protocol Usage            | Node.js 16+ projects             | Browser code             | Clear built-in vs package distinction  |
| Pre-commit Hooks               | Team environments                | Solo quick projects      | Fast automated checks                  |
| Multi-Layer Linting            | Projects with shell/YAML/Actions | TypeScript-only projects | Comprehensive file coverage            |

### Code Snippets

**ESLint Configuration - Minimal Example:**

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  files: ['src/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
});
```

**TypeScript Strict Config - Minimal Example:**

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "NodeNext",
    "verbatimModuleSyntax": true,
    "composite": true
  }
}
```

**Self-Import Prevention - Minimal Example:**

```javascript
{
  files: ['packages/core/src/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      { name: '@myapp/core', message: 'Use relative imports' },
    ],
  },
}
```

**Node Protocol - Minimal Example:**

```javascript
{
  plugins: { import: importPlugin },
  rules: {
    'import/enforce-node-protocol-usage': ['error', 'always'],
  },
}
```

**Pre-commit Hook - Minimal Example:**

```json
{
  "lint-staged": {
    "*.ts": ["prettier --write", "eslint --fix"]
  }
}
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "import/enforce-node-protocol-usage": ["error", "always"]
  }
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "verbatimModuleSyntax": true,
    "composite": true
  }
}
```

**Pre-commit Hooks:**

```bash
# .husky/pre-commit
npm run pre-commit
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "pre-commit": "node scripts/pre-commit.js",
    "lint:all": "node scripts/lint.js",
    "preflight": "npm run format && npm run lint && npm run typecheck && npm test"
  }
}
```

**CI/CD Integration:**

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint:all

- name: Type Check
  run: npm run typecheck

- name: Test
  run: npm test
```

---

## Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - TypeScript patterns
  enforced by ESLint and compiler
- **[Code Organization](./06-code-organization.md)** - Import organization
  enforced by ESLint
- **[Module Boundaries](./07-module-boundaries.md)** - Self-import prevention
  maintains boundaries
- **[Build Tooling](./17-build-tooling.md)** - Linting integrated into build
  process

---

## References

**Source Code Examples:**

- [examplecode/gemini/eslint.config.js](../../examplecode/gemini/eslint.config.js) -
  Complete ESLint flat config with all rules
- [examplecode/gemini/tsconfig.json](../../examplecode/gemini/tsconfig.json) -
  Root TypeScript config with strict settings
- [examplecode/gemini/.husky/pre-commit](../../examplecode/gemini/.husky/pre-commit) -
  Husky pre-commit hook
- [examplecode/gemini/scripts/pre-commit.js](../../examplecode/gemini/scripts/pre-commit.js) -
  Lint-staged runner
- [examplecode/gemini/scripts/lint.js](../../examplecode/gemini/scripts/lint.js) -
  Multi-layer linting infrastructure
- [examplecode/gemini/package.json](../../examplecode/gemini/package.json) -
  Lint-staged configuration

**External Resources:**

- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files) -
  Official ESLint configuration guide
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig) -
  Complete tsconfig reference
- [typescript-eslint](https://typescript-eslint.io/) - TypeScript ESLint plugin
  documentation
- [Husky](https://typicode.github.io/husky/) - Git hooks made easy
- [lint-staged](https://github.com/okonet/lint-staged) - Run linters on staged
  files
- [actionlint](https://github.com/rhysd/actionlint) - GitHub Actions workflow
  linter
- [shellcheck](https://www.shellcheck.net/) - Shell script linter
- [yamllint](https://yamllint.readthedocs.io/) - YAML linter

---

## Changelog

- **2025-01-21**: Complete rewrite following pattern template structure with
  detailed implementations from codebase
