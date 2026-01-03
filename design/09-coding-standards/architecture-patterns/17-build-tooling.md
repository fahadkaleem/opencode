---
title: Build and Tooling Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Root Package
  - All Workspace Packages
  - Build Scripts
related_patterns:
  - ./01-project-structure.md#monorepo-organization
  - ./06-code-organization.md#package-structure
  - ./08-dependency-management.md#workspace-dependencies
---

# 17. Build and Tooling Patterns

> **Purpose**: Comprehensive build tooling patterns for monorepo management, TypeScript compilation, bundling, and development workflow automation.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Organized Build Scripts](#pattern-1-organized-build-scripts)
- [Pattern 2: Package Configuration Standards](#pattern-2-package-configuration-standards)
- [Pattern 3: TypeScript Composite Builds](#pattern-3-typescript-composite-builds)
- [Pattern 4: Bundling with Esbuild](#pattern-4-bundling-with-esbuild)
- [Pattern 5: Custom Build Orchestration](#pattern-5-custom-build-orchestration)
- [Pattern 6: Asset Management](#pattern-6-asset-management)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Build tooling establishes the foundation for development workflow, from initial development to production deployment. A well-designed build system enables fast iteration, reliable builds, and seamless team collaboration.

Modern TypeScript monorepos require coordinated builds across multiple packages, incremental compilation for performance, efficient bundling for distribution, and automated quality checks. The patterns in this document provide a comprehensive approach to build tooling that scales from small teams to large codebases.

**Why build tooling matters:**

- Enable fast development iteration with watch mode and incremental builds
- Ensure consistent builds across development and CI environments
- Automate quality checks to catch issues early
- Optimize bundle size for faster distribution and execution
- Coordinate builds across monorepo packages efficiently

**In this document:**

- **Organized Build Scripts** - Logical grouping of package.json scripts by purpose
- **Package Configuration Standards** - Consistent package.json structure across packages
- **TypeScript Composite Builds** - Incremental compilation with project references
- **Bundling with Esbuild** - High-performance bundling for production
- **Custom Build Orchestration** - Node.js scripts for complex build workflows
- **Asset Management** - Handling non-TypeScript files in builds

**Prerequisites:**

- Understanding of npm/package.json structure
- Familiarity with TypeScript configuration
- Basic knowledge of build tools (TypeScript compiler, bundlers)

---

## Pattern 1: Organized Build Scripts

### Intent

Group package.json scripts logically by purpose (development, testing, quality, build) for discoverability and maintainability.

### Problem

As projects grow, package.json scripts become disorganized and difficult to discover. Developers struggle to find the right command for their task. Scripts with similar purposes scatter throughout the file, making it hard to understand the full development workflow. New team members cannot easily determine which scripts to run for common tasks.

### Solution

Organize scripts into clear categories with consistent naming conventions. Group related scripts together using prefixes (test:_, build:_, lint:\*) and provide composite scripts (preflight, prepare) that combine multiple steps. Document the purpose of each category in comments or separate documentation.

### Structure

```json
{
  "scripts": {
    // Development
    "start": "...",
    "dev": "...",
    "debug": "...",

    // Build
    "build": "...",
    "build:dev": "...",
    "build:prod": "...",
    "clean": "...",

    // Testing
    "test": "...",
    "test:watch": "...",
    "test:coverage": "...",

    // Quality
    "lint": "...",
    "lint:fix": "...",
    "format": "...",
    "typecheck": "...",

    // Composite
    "preflight": "...",
    "prepare": "..."
  }
}
```

### Implementation

**Step 1: Define script categories**

```json
{
  "scripts": {
    // Development workflows
    "start": "cross-env NODE_ENV=development node scripts/start.js",
    "dev": "tsc --watch",
    "debug": "cross-env DEBUG=1 node --inspect-brk scripts/start.js"
  }
}
```

**Step 2: Add build scripts with variants**

```json
{
  "scripts": {
    // Build workflows
    "build": "tsc",
    "build:dev": "npm run check-types && npm run lint && node esbuild.js",
    "build:prod": "node esbuild.js --production",
    "clean": "rm -rf dist"
  }
}
```

**Step 3: Add test scripts with variants**

```json
{
  "scripts": {
    // Testing workflows
    "test": "mocha 'src/**/*.test.ts'",
    "test:watch": "mocha 'src/**/*.test.ts' --watch",
    "test:coverage": "c8 npm test",
    "test:ci": "vitest run --coverage"
  }
}
```

**Step 4: Add quality check scripts**

```json
{
  "scripts": {
    // Code quality
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx && npm run format",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  }
}
```

**Step 5: Create composite scripts**

```json
{
  "scripts": {
    // Multi-step orchestration
    "preflight": "npm run clean && npm ci && npm run format && npm run lint && npm run build && npm run typecheck && npm run test:ci",
    "prepare": "npm run build"
  }
}
```

### Complete Example

```json
{
  "name": "@myapp/core",
  "version": "1.0.0",
  "scripts": {
    // Development
    "start": "cross-env NODE_ENV=development node scripts/start.js",
    "start:server": "npm run start --workspace @myapp/server",
    "dev": "tsc --watch",
    "debug": "cross-env DEBUG=1 node --inspect-brk scripts/start.js",

    // Build
    "build": "node scripts/build.js",
    "build:all": "npm run build && npm run build:packages",
    "build:packages": "npm run build --workspaces",
    "bundle": "npm run generate && node esbuild.config.js && node scripts/copy_bundle_assets.js",
    "clean": "node scripts/clean.js",

    // Testing
    "test": "npm run test --workspaces --if-present",
    "test:ci": "npm run test:ci --workspaces --if-present && npm run test:scripts",
    "test:scripts": "vitest run --config ./scripts/tests/vitest.config.ts",
    "test:e2e": "cross-env VERBOSE=true KEEP_OUTPUT=true npm run test:integration",
    "test:integration": "cross-env vitest run --root ./integration-tests",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",

    // Quality
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx && npm run format",
    "lint:ci": "npm run lint:all",
    "lint:all": "node scripts/lint.js",
    "format": "prettier --write .",
    "typecheck": "npm run typecheck --workspaces --if-present",

    // Composite
    "preflight": "npm run clean && npm ci && npm run format && npm run lint:ci && npm run build && npm run typecheck && npm run test:ci",
    "prepare": "npm run build",

    // Infrastructure
    "generate": "node scripts/generate-git-commit-info.js",
    "check:lockfile": "node scripts/check-lockfile.js"
  }
}
```

**Example explained:**

- Lines 5-8: Development scripts for starting, watching, and debugging
- Lines 10-14: Build scripts with variants for different targets
- Lines 16-22: Test scripts covering unit, integration, E2E, and coverage
- Lines 24-28: Quality scripts for linting, formatting, and type checking
- Lines 30-32: Composite scripts orchestrating multiple steps
- Lines 34-36: Infrastructure scripts for code generation and validation

### When to Use

**Use organized script grouping when:**

- Working in a monorepo with multiple packages
- Team has more than 10 package.json scripts
- New developers frequently join the project
- Multiple build targets exist (dev, prod, test)
- Scripts need to run in CI/CD pipelines

**Avoid complex script organization when:**

- Simple single-package project with under 5 scripts
- All builds are identical (no variants needed)
- Team is very small and familiar with all commands

### Benefits

- **Discoverability**: Developers quickly find the right command using prefixes
- **Consistency**: Same pattern across all packages in monorepo
- **Documentation**: Script names self-document their purpose
- **Automation**: Composite scripts reduce manual steps

### Trade-offs

- **Verbosity**: More scripts means longer package.json files
- **Duplication**: Similar scripts across packages need synchronization
- **Learning Curve**: New developers must learn naming conventions

### Common Mistakes

**Mistake 1: Inconsistent naming across packages**

```json
// Package A
{
  "scripts": {
    "test": "mocha",
    "test:watch": "mocha --watch"
  }
}

// Package B - inconsistent names
{
  "scripts": {
    "test": "vitest run",
    "watch-tests": "vitest watch"  // Should be test:watch
  }
}
```

**Correct approach:**

```json
// Package A
{
  "scripts": {
    "test": "mocha",
    "test:watch": "mocha --watch"
  }
}

// Package B - consistent naming
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch"
  }
}
```

**Why this matters**: Inconsistent naming breaks muscle memory and makes workspace-level commands fail when they assume consistent script names.

**Mistake 2: Missing composite scripts for common workflows**

```json
// Missing preflight script - developers must remember sequence
{
  "scripts": {
    "lint": "eslint .",
    "test": "mocha",
    "build": "tsc"
  }
}
```

**Correct approach:**

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "mocha",
    "build": "tsc",
    "preflight": "npm run lint && npm run test && npm run build"
  }
}
```

**Why this matters**: Composite scripts ensure all checks run in the correct order and reduce human error in pre-commit or CI workflows.

### Testing Strategy

**What to Test:**

- All scripts execute without errors in clean environment
- Composite scripts run steps in correct order
- Script failures propagate correctly (exit codes)
- Workspace-level scripts work across all packages

**Test Organization:**

- Create integration tests in `scripts/tests/` directory
- Test each major script category separately
- Use temporary directories for filesystem operations

**Mock Strategy:**

- Mock external services (npm registry, Docker) for speed
- Use real file system operations in temp directories
- Mock long-running processes with fast alternatives

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Build Scripts', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Arrange - Create temp workspace
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-test-'));
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should execute build script successfully', () => {
    // Arrange
    const packageJson = {
      scripts: {
        build: 'tsc',
      },
    };
    const packagePath = path.join(tempDir, 'package.json');

    // Act
    execSync('npm run build', { cwd: tempDir, stdio: 'inherit' });
    const distExists = fs.access(path.join(tempDir, 'dist'));

    // Assert
    expect(distExists).to.not.throw();
  });

  it('should fail preflight if any step fails', () => {
    // Arrange
    const packageJson = {
      scripts: {
        lint: 'exit 1', // Simulate failure
        test: 'echo "test"',
        preflight: 'npm run lint && npm run test',
      },
    };

    // Act & Assert
    expect(() => {
      execSync('npm run preflight', { cwd: tempDir, stdio: 'pipe' });
    }).to.throw();
  });

  it('should run workspace scripts in parallel', () => {
    // Arrange
    const startTime = Date.now();

    // Act
    execSync('npm run test --workspaces', {
      cwd: tempDir,
      stdio: 'inherit',
    });
    const duration = Date.now() - startTime;

    // Assert - parallel execution should be faster than sequential
    expect(duration).to.be.lessThan(10000); // 10 seconds
  });
});
```

**Coverage Goals:**

- Script coverage: 100% (all scripts tested)
- Error handling: Test script failures propagate correctly
- Integration: Test workspace-level script coordination

### Related Patterns

- **[Monorepo Organization](./01-project-structure.md#monorepo-organization)** - Workspace structure that build scripts operate on
- **[Workspace Dependencies](./08-dependency-management.md#workspace-dependencies)** - Dependencies that affect build order

---

## Pattern 2: Package Configuration Standards

### Intent

Maintain consistent package.json structure across all workspace packages for predictability and automation.

### Problem

Inconsistent package.json files across a monorepo lead to confusion and errors. Some packages use different field names or ordering, making it hard to understand configuration at a glance. Automation scripts that parse package.json files break when structure varies. Publishing configuration differs between packages, causing some packages to ship incorrect files.

### Solution

Define a standardized package.json template with required fields in a specific order. All packages inherit common configuration from the root package.json. Use consistent patterns for exports, files, engines, and other metadata. Document required vs optional fields and provide validation scripts to catch deviations.

### Structure

```json
{
  "name": "@scope/package-name",
  "version": "1.0.0",
  "type": "module",
  "description": "...",
  "main": "./dist/index.js",
  "exports": { ... },
  "bin": { ... },
  "files": [ ... ],
  "scripts": { ... },
  "dependencies": { ... },
  "devDependencies": { ... },
  "engines": { ... }
}
```

### Implementation

**Step 1: Define core package fields**

```json
{
  "name": "@myapp/core",
  "version": "1.0.0",
  "type": "module",
  "description": "Core business logic for MyApp",
  "main": "./dist/index.js"
}
```

**Step 2: Configure exports for subpath imports**

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./services": "./dist/services/index.js",
    "./types": "./dist/types/index.js"
  }
}
```

**Step 3: Specify published files**

```json
{
  "files": ["dist", "README.md", "LICENSE"]
}
```

**Step 4: Define engine requirements**

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 5: Add CLI entry points (if applicable)**

```json
{
  "bin": {
    "myapp": "./dist/index.js"
  }
}
```

### Complete Example

**Core Package:**

```json
{
  "name": "@myapp/core",
  "version": "1.0.0",
  "type": "module",
  "description": "Core business logic for MyApp",
  "main": "./dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./services": "./dist/services/index.js",
    "./types": "./dist/types/index.js",
    "./utils": "./dist/utils/index.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "node ../../scripts/build_package.js",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:ci": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**CLI Package:**

```json
{
  "name": "@myapp/cli",
  "version": "1.0.0",
  "type": "module",
  "description": "MyApp command-line interface",
  "main": "./dist/index.js",
  "bin": {
    "myapp": "./dist/index.js"
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "node ../../scripts/build_package.js",
    "start": "node dist/index.js",
    "debug": "node --inspect-brk dist/index.js",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:ci": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@myapp/core": "file:../core",
    "@oclif/core": "^3.0.0"
  },
  "devDependencies": {
    "@myapp/test-utils": "file:../test-utils",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Root Package:**

```json
{
  "name": "@myapp/monorepo",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "workspaces": ["packages/*"],
  "bin": {
    "myapp": "bundle/myapp.js"
  },
  "files": ["bundle/", "README.md", "LICENSE"],
  "scripts": {
    "build": "node scripts/build.js",
    "test": "npm run test --workspaces --if-present",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "preflight": "npm run clean && npm ci && npm run format && npm run lint && npm run build && npm run typecheck && npm run test",
    "clean": "node scripts/clean.js"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Example explained:**

- All packages use `"type": "module"` for ESM
- All packages define `files` array limiting published content
- All packages specify same Node.js version requirement
- CLI package includes `bin` field for executable
- Root package uses `"private": true` to prevent accidental publishing
- Workspace dependencies use `file:` protocol for local packages

### When to Use

**Use standardized package.json when:**

- Working in a monorepo with multiple packages
- Publishing packages to npm registry
- Automating package configuration validation
- Team has varying levels of experience with npm

**Avoid rigid standards when:**

- Single-package project with unique requirements
- Experimental packages that need flexibility
- Packages have fundamentally different purposes (library vs CLI vs server)

### Benefits

- **Consistency**: Same structure across all packages
- **Automation**: Scripts can parse package.json reliably
- **Publishing**: Correct files shipped every time
- **Documentation**: Structure self-documents package purpose

### Trade-offs

- **Rigidity**: Less flexibility for special cases
- **Maintenance**: Standards must be updated across all packages
- **Validation Overhead**: Need scripts to enforce standards

### Common Mistakes

**Mistake 1: Missing files array leads to publishing everything**

```json
{
  "name": "@myapp/core",
  "main": "./dist/index.js"
  // Missing "files" array
}
```

**Correct approach:**

```json
{
  "name": "@myapp/core",
  "main": "./dist/index.js",
  "files": ["dist"]
}
```

**Why this matters**: Without `files` array, npm publishes all files including source, tests, and configuration, increasing package size unnecessarily.

**Mistake 2: Inconsistent engine specifications**

```json
// Package A
{
  "engines": {
    "node": ">=20.0.0"
  }
}

// Package B - different requirement
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Correct approach:**

```json
// All packages
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Why this matters**: Inconsistent engine requirements cause confusion and runtime errors when packages use features from different Node.js versions.

### Testing Strategy

**What to Test:**

- All packages have required fields (name, version, type)
- Files array includes only build artifacts
- Engine specifications match across packages
- Exports configuration resolves correctly

**Test Organization:**

- Create validation script in `scripts/validate-packages.js`
- Run validation in CI for every commit
- Test package.json parsing and field validation

**Mock Strategy:**

- Use real package.json files (no mocking needed)
- Validate against schema definition
- Test filesystem to verify exported paths exist

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';

describe('Package Configuration Standards', () => {
  let packagePaths: string[];

  beforeEach(async () => {
    // Arrange - Find all package.json files
    packagePaths = await glob('packages/*/package.json');
  });

  it('should have type: module in all packages', async () => {
    // Act & Assert
    for (const pkgPath of packagePaths) {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      expect(pkg.type).to.equal('module', `${pkgPath} missing type: module`);
    }
  });

  it('should have consistent engine requirements', async () => {
    // Arrange
    const requiredNodeVersion = '>=20.0.0';

    // Act & Assert
    for (const pkgPath of packagePaths) {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      expect(pkg.engines?.node).to.equal(
        requiredNodeVersion,
        `${pkgPath} has incorrect engine requirement`
      );
    }
  });

  it('should only publish dist directory', async () => {
    // Act & Assert
    for (const pkgPath of packagePaths) {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      if (pkg.private) continue; // Skip private packages

      expect(pkg.files).to.include('dist');
      expect(pkg.files).to.not.include('src');
      expect(pkg.files).to.not.include('test');
    }
  });

  it('should have valid exports paths', async () => {
    // Act & Assert
    for (const pkgPath of packagePaths) {
      const content = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      if (!pkg.exports) continue;

      const packageDir = path.dirname(pkgPath);
      for (const [key, value] of Object.entries(pkg.exports)) {
        const exportPath = path.join(packageDir, value as string);
        const exists = await fs.access(exportPath).then(
          () => true,
          () => false
        );

        expect(exists).to.be.true(`Export path ${value} does not exist in ${pkgPath}`);
      }
    }
  });
});
```

**Coverage Goals:**

- Field coverage: 100% (all required fields validated)
- Package coverage: 100% (all packages validated)
- Path validation: All export paths verified to exist

### Related Patterns

- **[Workspace Dependencies](./08-dependency-management.md#workspace-dependencies)** - How packages reference each other
- **[Module Boundaries](./07-module-boundaries.md#explicit-exports)** - Export configuration patterns

---

## Pattern 3: TypeScript Composite Builds

### Intent

Enable incremental compilation and coordinated builds across monorepo packages using TypeScript project references.

### Problem

In a monorepo, rebuilding all packages from scratch is slow and wasteful. Developers wait for full recompilation even when changing a single package. TypeScript cannot determine build order automatically, leading to build errors when packages depend on others. Without incremental builds, large codebases become impractical to develop.

### Solution

Use TypeScript's composite project feature with project references to enable incremental compilation. Each package declares `"composite": true` in its tsconfig.json and references its dependencies. TypeScript builds only changed packages and their dependents, maintaining correct build order. The root tsconfig.json serves as entry point for building the entire workspace.

### Structure

```
tsconfig.json (root)
  └── references: [packages/a, packages/b]

packages/a/tsconfig.json
  └── composite: true

packages/b/tsconfig.json
  └── composite: true
  └── references: [packages/a]
```

### Implementation

**Step 1: Configure root tsconfig.json with strict settings**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,
    "declaration": true,
    "verbatimModuleSyntax": true,
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "types": ["node"]
  }
}
```

**Step 2: Create package-level tsconfig extending root**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true,
    "types": ["node", "mocha"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Add project references for dependencies**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "composite": true
  },
  "include": ["index.ts", "src/**/*.ts"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../core" }, { "path": "../utils" }]
}
```

**Step 4: Create tsconfig for tests with noEmit**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "allowJs": true
  },
  "include": ["**/*.ts"],
  "references": [{ "path": "../packages/core" }]
}
```

### Complete Example

**Root tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
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
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "types": ["node"]
  }
}
```

**packages/core/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "composite": true,
    "types": ["node", "mocha"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.json"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/cli/tsconfig.json (with references):**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "mocha"]
  },
  "include": ["index.ts", "src/**/*.ts", "src/**/*.tsx", "src/**/*.json", "./package.json"],
  "exclude": ["node_modules", "dist"],
  "references": [{ "path": "../core" }]
}
```

**integration-tests/tsconfig.json:**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "allowJs": true
  },
  "include": ["**/*.ts"],
  "references": [{ "path": "../packages/core" }]
}
```

**Example explained:**

- Root config defines shared compiler options for all packages
- Each package extends root config with `"extends": "../../tsconfig.json"`
- Core package enables composite mode for incremental builds
- CLI package references core via `"references": [{ "path": "../core" }]`
- Integration tests use `"noEmit": true` since they don't produce artifacts
- All packages specify `"outDir": "dist"` for consistent output location

### When to Use

**Use TypeScript composite builds when:**

- Working in a monorepo with interdependent packages
- Build times exceed 30 seconds for full compilation
- Packages have clear dependency relationships
- Team frequently makes cross-package changes

**Avoid composite builds when:**

- Single package project
- No package dependencies exist
- Build time is negligible (under 5 seconds)

### Benefits

- **Incremental Compilation**: Only changed packages rebuild
- **Build Order**: TypeScript determines correct build sequence automatically
- **Type Checking**: References enable cross-package type checking
- **Performance**: Dramatically faster rebuild times for large codebases

### Trade-offs

- **Configuration Complexity**: Each package needs tsconfig with references
- **Build Tool Integration**: Some tools don't support project references well
- **Declaration Files**: Composite mode requires emitting .d.ts files

### Common Mistakes

**Mistake 1: Forgetting to add composite: true**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
    // Missing "composite": true
  },
  "references": [{ "path": "../core" }]
}
```

**Correct approach:**

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

**Why this matters**: Without `composite: true`, TypeScript cannot use incremental builds and project references won't work correctly.

**Mistake 2: Circular references between packages**

```json
// packages/a/tsconfig.json
{
  "references": [
    { "path": "../b" }
  ]
}

// packages/b/tsconfig.json
{
  "references": [
    { "path": "../a" }  // Circular dependency!
  ]
}
```

**Correct approach:**

```json
// Refactor to remove circular dependency
// Extract shared code to packages/common

// packages/a/tsconfig.json
{
  "references": [
    { "path": "../common" }
  ]
}

// packages/b/tsconfig.json
{
  "references": [
    { "path": "../common" }
  ]
}
```

**Why this matters**: Circular references prevent TypeScript from determining build order and cause compilation failures.

### Testing Strategy

**What to Test:**

- Incremental builds only recompile changed packages
- Build order respects package dependencies
- Declaration files (.d.ts) are generated correctly
- Cross-package type checking works

**Test Organization:**

- Integration tests for build system in `scripts/tests/`
- Test builds in temporary directories
- Measure build times for performance validation

**Mock Strategy:**

- Use real TypeScript compiler (no mocking)
- Create temporary workspace for testing
- Mock file timestamps to simulate changes

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('TypeScript Composite Builds', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Arrange - Create temp monorepo
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'composite-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should build packages in correct order', () => {
    // Arrange - core must build before cli
    const corePackage = path.join(tempDir, 'packages/core');
    const cliPackage = path.join(tempDir, 'packages/cli');

    // Act
    const startTime = Date.now();
    execSync('tsc --build', { cwd: tempDir, stdio: 'inherit' });
    const buildTime = Date.now() - startTime;

    // Assert - both packages built
    const coreExists = await fs.access(path.join(corePackage, 'dist')).then(
      () => true,
      () => false
    );
    const cliExists = await fs.access(path.join(cliPackage, 'dist')).then(
      () => true,
      () => false
    );

    expect(coreExists).to.be.true;
    expect(cliExists).to.be.true;
  });

  it('should only rebuild changed packages', async () => {
    // Arrange - initial build
    execSync('tsc --build', { cwd: tempDir, stdio: 'inherit' });

    // Modify only core package
    const coreFile = path.join(tempDir, 'packages/core/src/index.ts');
    await fs.appendFile(coreFile, '\nexport const newConst = 1;');

    // Act - rebuild
    const startTime = Date.now();
    execSync('tsc --build', { cwd: tempDir, stdio: 'inherit' });
    const rebuildTime = Date.now() - startTime;

    // Assert - rebuild should be faster than initial build
    expect(rebuildTime).to.be.lessThan(5000); // Under 5 seconds
  });

  it('should generate declaration files', async () => {
    // Arrange & Act
    execSync('tsc --build', { cwd: tempDir, stdio: 'inherit' });

    // Assert
    const dtsFile = path.join(tempDir, 'packages/core/dist/index.d.ts');
    const dtsExists = await fs.access(dtsFile).then(
      () => true,
      () => false
    );

    expect(dtsExists).to.be.true;
  });
});
```

**Coverage Goals:**

- Build scenarios: 100% (initial, incremental, clean)
- Package combinations: All dependency graphs tested
- Performance: Incremental builds under 5 seconds

### Related Patterns

- **[Monorepo Organization](./01-project-structure.md#monorepo-organization)** - Package structure that composite builds operate on
- **[Workspace Dependencies](./08-dependency-management.md#workspace-dependencies)** - Package references matched by TypeScript references

---

## Pattern 4: Bundling with Esbuild

### Intent

Create optimized production bundles using esbuild's high-performance bundler with support for ESM, native modules, and WASM.

### Problem

TypeScript compilation produces many small files that are slow to load and distribute. Native Node.js modules require special handling during bundling. WASM files need embedding for portable distribution. Development and production builds have different requirements (speed vs optimization). Standard bundlers are slow for large codebases.

### Solution

Use esbuild for fast bundling with configuration for different targets (CLI, server, browser). Create separate build configurations for development (fast) and production (optimized). Handle native modules as external dependencies to avoid bundling binary code. Use plugins for WASM embedding and custom asset handling. Maintain minimal bundle size by marking framework dependencies as external.

### Structure

```typescript
// Base configuration shared across builds
const baseConfig = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['native-module'],
  loader: { '.node': 'file' },
};

// Target-specific configs extend base
const cliConfig = { ...baseConfig, entryPoints: ['src/cli.ts'] };
const serverConfig = { ...baseConfig, entryPoints: ['src/server.ts'] };
```

### Implementation

**Step 1: Install esbuild and plugins**

```bash
npm install --save-dev esbuild esbuild-plugin-wasm
```

**Step 2: Create base esbuild configuration**

```javascript
import esbuild from 'esbuild';
import path from 'node:path';

const baseConfig = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  loader: { '.node': 'file' },
  write: true,
};
```

**Step 3: Add external dependencies**

```javascript
const external = ['node-pty', '@lydell/node-pty-darwin-arm64', '@lydell/node-pty-linux-x64'];

const baseConfig = {
  // ... other config
  external,
};
```

**Step 4: Create CLI build configuration**

```javascript
const cliConfig = {
  ...baseConfig,
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  entryPoints: ['packages/cli/index.ts'],
  outfile: 'bundle/myapp.js',
  define: {
    'process.env.CLI_VERSION': JSON.stringify('1.0.0'),
  },
};
```

**Step 5: Build with error handling**

```javascript
Promise.allSettled([esbuild.build(cliConfig), esbuild.build(serverConfig)]).then((results) => {
  const [cliResult, serverResult] = results;

  if (cliResult.status === 'rejected') {
    console.error('CLI build failed:', cliResult.reason);
    process.exit(1);
  }

  if (serverResult.status === 'rejected') {
    console.warn('Server build failed:', serverResult.reason);
  }
});
```

### Complete Example

```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { wasmLoader } from 'esbuild-plugin-wasm';

let esbuild;
try {
  esbuild = (await import('esbuild')).default;
} catch (_error) {
  console.warn('esbuild not available, skipping bundle step');
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const pkg = require(path.resolve(__dirname, 'package.json'));

// Custom WASM plugin for handling binary WASM files
function createWasmPlugins() {
  const wasmBinaryPlugin = {
    name: 'wasm-binary',
    setup(build) {
      build.onResolve({ filter: /\.wasm\?binary$/ }, (args) => {
        const specifier = args.path.replace(/\?binary$/, '');
        const resolveDir = args.resolveDir || '';
        const isBareSpecifier =
          !path.isAbsolute(specifier) &&
          !specifier.startsWith('./') &&
          !specifier.startsWith('../');

        let resolvedPath;
        if (isBareSpecifier) {
          resolvedPath = require.resolve(specifier, {
            paths: resolveDir ? [resolveDir, __dirname] : [__dirname],
          });
        } else {
          resolvedPath = path.isAbsolute(specifier) ? specifier : path.join(resolveDir, specifier);
        }

        return { path: resolvedPath, namespace: 'wasm-embedded' };
      });
    },
  };

  return [wasmBinaryPlugin, wasmLoader({ mode: 'embedded' })];
}

// External dependencies that should not be bundled
const external = [
  '@lydell/node-pty',
  'node-pty',
  '@lydell/node-pty-darwin-arm64',
  '@lydell/node-pty-darwin-x64',
  '@lydell/node-pty-linux-x64',
  '@lydell/node-pty-win32-arm64',
  '@lydell/node-pty-win32-x64',
];

// Base configuration shared across builds
const baseConfig = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  external,
  loader: { '.node': 'file' },
  write: true,
};

// CLI build configuration with special handling for __filename and __dirname
const cliConfig = {
  ...baseConfig,
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url); globalThis.__filename = require('url').fileURLToPath(import.meta.url); globalThis.__dirname = require('path').dirname(globalThis.__filename);`,
  },
  entryPoints: ['packages/cli/index.ts'],
  outfile: 'bundle/myapp.js',
  define: {
    'process.env.CLI_VERSION': JSON.stringify(pkg.version),
  },
  plugins: createWasmPlugins(),
  alias: {
    'is-in-ci': path.resolve(__dirname, 'packages/cli/src/patches/is-in-ci.ts'),
  },
  metafile: true,
};

// Server build configuration (separate bundle)
const serverConfig = {
  ...baseConfig,
  banner: {
    js: `const require = (await import('module')).createRequire(import.meta.url); globalThis.__filename = require('url').fileURLToPath(import.meta.url); globalThis.__dirname = require('path').dirname(globalThis.__filename);`,
  },
  entryPoints: ['packages/server/src/http/server.ts'],
  outfile: 'packages/server/dist/server.mjs',
  define: {
    'process.env.CLI_VERSION': JSON.stringify(pkg.version),
  },
  plugins: createWasmPlugins(),
};

// Build both CLI and server in parallel with error handling
Promise.allSettled([
  esbuild.build(cliConfig).then(({ metafile }) => {
    if (process.env.DEV === 'true') {
      writeFileSync('./bundle/esbuild.json', JSON.stringify(metafile, null, 2));
    }
  }),
  esbuild.build(serverConfig),
]).then((results) => {
  const [cliResult, serverResult] = results;

  if (cliResult.status === 'rejected') {
    console.error('CLI build failed:', cliResult.reason);
    process.exit(1);
  }

  if (serverResult.status === 'rejected') {
    console.warn('Server build failed:', serverResult.reason);
  }
});
```

**Example explained:**

- Lines 1-12: Import dependencies and handle missing esbuild gracefully
- Lines 15-38: Custom WASM plugin for embedding WASM files in bundle
- Lines 40-49: External dependencies list prevents bundling native modules
- Lines 52-58: Base configuration shared by all build targets
- Lines 61-76: CLI build with ESM compatibility shims for **filename/**dirname
- Lines 79-89: Server build configuration (separate bundle)
- Lines 92-107: Parallel builds with independent error handling

### When to Use

**Use esbuild bundling when:**

- Creating CLI applications for distribution
- Building production deployments
- Bundle size matters for performance
- Fast build times are critical
- Using WASM or native modules

**Avoid esbuild when:**

- Simple library packages (just use tsc)
- No external distribution needed
- Development-only code
- Complex build transformations required (use webpack)

### Benefits

- **Speed**: 10-100x faster than webpack/rollup
- **ESM Native**: First-class ESM support
- **Bundle Size**: Tree-shaking and minification included
- **Native Modules**: Handles .node files correctly

### Trade-offs

- **Plugin Ecosystem**: Fewer plugins than webpack
- **Configuration**: Less flexible than webpack for complex builds
- **Debugging**: Bundled code harder to debug than source

### Common Mistakes

**Mistake 1: Bundling native modules**

```javascript
const config = {
  bundle: true,
  // Missing external configuration
  entryPoints: ['src/index.ts'],
  outfile: 'dist/bundle.js',
};
```

**Correct approach:**

```javascript
const config = {
  bundle: true,
  external: ['node-pty', 'fsevents'], // Don't bundle native modules
  entryPoints: ['src/index.ts'],
  outfile: 'dist/bundle.js',
};
```

**Why this matters**: Bundling native modules breaks them because they contain platform-specific binary code that cannot be bundled with JavaScript.

**Mistake 2: Not providing ESM compatibility shims**

```javascript
const config = {
  format: 'esm',
  // Missing banner for __filename/__dirname
  entryPoints: ['src/index.ts'],
};
```

**Correct approach:**

```javascript
const config = {
  format: 'esm',
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url); globalThis.__filename = require('url').fileURLToPath(import.meta.url); globalThis.__dirname = require('path').dirname(globalThis.__filename);`,
  },
  entryPoints: ['src/index.ts'],
};
```

**Why this matters**: ESM doesn't provide **filename and **dirname globals, breaking code that relies on them.

### Testing Strategy

**What to Test:**

- Bundle builds successfully without errors
- Bundle size is within acceptable limits
- External modules are not bundled
- Bundle executes correctly in target environment
- Environment variables are injected correctly

**Test Organization:**

- Integration tests in `scripts/tests/bundle.test.ts`
- Test bundle execution in isolated environment
- Measure bundle size and compare to baseline

**Mock Strategy:**

- Use real esbuild (no mocking)
- Test in temporary directories
- Mock external services bundle might call

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('Esbuild Bundling', () => {
  it('should create bundle successfully', () => {
    // Arrange & Act
    execSync('node esbuild.config.js', { stdio: 'inherit' });

    // Assert
    const bundleExists = fs.access('./bundle/myapp.js').then(
      () => true,
      () => false
    );
    expect(bundleExists).to.eventually.be.true;
  });

  it('should not bundle external dependencies', async () => {
    // Arrange
    execSync('node esbuild.config.js', { stdio: 'inherit' });

    // Act
    const bundleContent = await fs.readFile('./bundle/myapp.js', 'utf-8');

    // Assert - external modules should be imported, not bundled
    expect(bundleContent).to.include('node-pty');
    expect(bundleContent).to.not.include('node-pty source code');
  });

  it('should inject environment variables', async () => {
    // Arrange & Act
    execSync('node esbuild.config.js', { stdio: 'inherit' });
    const bundleContent = await fs.readFile('./bundle/myapp.js', 'utf-8');

    // Assert
    expect(bundleContent).to.include('process.env.CLI_VERSION');
  });

  it('should keep bundle size under limit', async () => {
    // Arrange
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Act
    execSync('node esbuild.config.js', { stdio: 'inherit' });
    const stats = await fs.stat('./bundle/myapp.js');

    // Assert
    expect(stats.size).to.be.lessThan(maxSize);
  });
});
```

**Coverage Goals:**

- Build configurations: 100% (all targets tested)
- Bundle execution: Verify bundle runs correctly
- Size limits: Monitor bundle size regression

### Related Patterns

- **[Package Configuration](./17-build-tooling.md#pattern-2-package-configuration-standards)** - Package.json bin field points to bundle
- **[Custom Build Orchestration](./17-build-tooling.md#pattern-5-custom-build-orchestration)** - Scripts that invoke esbuild

---

## Pattern 5: Custom Build Orchestration

### Intent

Coordinate complex multi-step build processes using custom Node.js scripts that handle dependencies, parallelism, and error recovery.

### Problem

Package.json scripts have limited orchestration capabilities. Complex build workflows require conditional logic, error handling, and status checking that npm scripts cannot provide. Some builds need to run in specific order while others can parallelize. Build scripts need to detect environment state (installed dependencies, previous build artifacts) and adapt accordingly.

### Solution

Create custom Node.js build scripts that orchestrate the build process. Use child_process to spawn build commands with proper error handling. Implement status checking to skip unnecessary steps. Coordinate workspace builds with correct dependency order. Provide clear feedback about build progress and failures.

### Structure

```javascript
// Main build orchestrator
import { execSync } from 'node:child_process';

// 1. Check prerequisites
checkNodeModules();

// 2. Generate metadata
execSync('node scripts/generate.js');

// 3. Build packages in order
execSync('npm run build --workspaces');

// 4. Bundle for distribution
execSync('node esbuild.config.js');
```

### Implementation

**Step 1: Create build orchestration script**

```javascript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
```

**Step 2: Add prerequisite checking**

```javascript
// npm install if node_modules was removed
if (!existsSync(join(root, 'node_modules'))) {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: root });
}
```

**Step 3: Run build steps in sequence**

```javascript
// Generate metadata
console.log('Generating metadata...');
execSync('npm run generate', { stdio: 'inherit', cwd: root });

// Build all workspace packages
console.log('Building packages...');
execSync('npm run build --workspaces', { stdio: 'inherit', cwd: root });
```

**Step 4: Handle optional steps with try-catch**

```javascript
// Optionally build container image
try {
  execSync('node scripts/sandbox_command.js -q', {
    stdio: 'inherit',
    cwd: root,
  });

  if (process.env.BUILD_SANDBOX === '1') {
    execSync('node scripts/build_sandbox.js -s', {
      stdio: 'inherit',
      cwd: root,
    });
  }
} catch {
  // Ignore if sandbox not available
}
```

**Step 5: Create package-specific build script**

```javascript
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (!process.cwd().includes('packages')) {
  console.error('must be invoked from a package directory');
  process.exit(1);
}

// Build TypeScript files using composite build
execSync('tsc --build', { stdio: 'inherit' });

// Copy asset files
execSync('node ../../scripts/copy_files.js', { stdio: 'inherit' });

// Track build completion
writeFileSync(join(process.cwd(), 'dist', '.last_build'), '');
```

### Complete Example

**Main Build Script (scripts/build.js):**

```javascript
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// npm install if node_modules was removed
if (!existsSync(join(root, 'node_modules'))) {
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: root });
}

// Generate build metadata
console.log('Generating metadata...');
execSync('npm run generate', { stdio: 'inherit', cwd: root });

// Build all workspace packages
console.log('Building packages...');
execSync('npm run build --workspaces', { stdio: 'inherit', cwd: root });

// Optionally build container image if sandboxing enabled
try {
  execSync('node scripts/sandbox_command.js -q', {
    stdio: 'inherit',
    cwd: root,
  });

  if (process.env.BUILD_SANDBOX === '1' || process.env.BUILD_SANDBOX === 'true') {
    console.log('Building sandbox container...');
    execSync('node scripts/build_sandbox.js -s', {
      stdio: 'inherit',
      cwd: root,
    });
  }
} catch {
  // Sandbox not available, continue without it
}

console.log('Build complete!');
```

**Package Build Script (scripts/build_package.js):**

```javascript
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (!process.cwd().includes('packages')) {
  console.error('ERROR: must be invoked from a package directory');
  process.exit(1);
}

console.log(`Building ${process.cwd().split('/').pop()}...`);

// Build TypeScript files using composite build
console.log('  Compiling TypeScript...');
execSync('tsc --build', { stdio: 'inherit' });

// Copy asset files (.md, .json, etc)
console.log('  Copying assets...');
execSync('node ../../scripts/copy_files.js', { stdio: 'inherit' });

// Touch dist/.last_build to track build time
writeFileSync(join(process.cwd(), 'dist', '.last_build'), '');

console.log('  Done!');
process.exit(0);
```

**Clean Script (scripts/clean.js):**

```javascript
import { rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const RMRF_OPTIONS = { recursive: true, force: true };

console.log('Cleaning build artifacts...');

// Remove npm install/build artifacts
rmSync(join(root, 'node_modules'), RMRF_OPTIONS);
rmSync(join(root, 'bundle'), RMRF_OPTIONS);

// Dynamically clean dist directories in all workspaces
const rootPackageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

for (const workspace of rootPackageJson.workspaces) {
  const workspaceDir = join(root, dirname(workspace));
  const packageDirs = readdirSync(workspaceDir);

  for (const pkg of packageDirs) {
    const pkgDir = join(workspaceDir, pkg);
    try {
      if (statSync(pkgDir).isDirectory()) {
        console.log(`  Cleaning ${pkg}...`);
        rmSync(join(pkgDir, 'dist'), RMRF_OPTIONS);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }
}

console.log('Clean complete!');
```

**Development Start Script (scripts/start.js):**

```javascript
import { spawn, execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

// Check build status before starting
console.log('Checking build status...');
execSync('node ./scripts/check-build-status.js', {
  stdio: 'inherit',
  cwd: root,
});

// Prepare Node.js arguments
const nodeArgs = [];

// Enable debugging if requested
if (process.env.DEBUG) {
  nodeArgs.push('--inspect-brk');
}

nodeArgs.push(join(root, 'packages', 'cli'));
nodeArgs.push(...process.argv.slice(2));

// Set environment variables
const env = {
  ...process.env,
  CLI_VERSION: pkg.version,
  DEV: 'true',
};

console.log('Starting application...');
const child = spawn('node', nodeArgs, { stdio: 'inherit', env });

child.on('close', (code) => {
  process.exit(code);
});
```

**Example explained:**

- build.js checks prerequisites, runs steps in sequence, handles optional features
- build_package.js validates context, compiles TypeScript, copies assets
- clean.js removes all build artifacts across workspace
- start.js validates build, configures debugging, spawns application

### When to Use

**Use custom build scripts when:**

- Build workflow has conditional logic
- Need to check prerequisites before building
- Coordinating builds across multiple packages
- Complex error handling required
- Status checking optimizes build time

**Avoid custom scripts when:**

- Simple linear build process
- No conditional logic needed
- npm scripts provide sufficient orchestration

### Benefits

- **Flexibility**: Full JavaScript control over build process
- **Error Handling**: Try-catch for optional steps
- **Status Checking**: Skip unnecessary work
- **Feedback**: Clear progress messages

### Trade-offs

- **Complexity**: More code to maintain than npm scripts
- **Debugging**: Harder to debug than declarative configuration
- **Portability**: Node.js-specific (not shell-agnostic)

### Common Mistakes

**Mistake 1: Not checking prerequisites**

```javascript
// Assumes node_modules exists
execSync('npm run build --workspaces', { stdio: 'inherit' });
```

**Correct approach:**

```javascript
if (!existsSync('node_modules')) {
  execSync('npm install', { stdio: 'inherit' });
}
execSync('npm run build --workspaces', { stdio: 'inherit' });
```

**Why this matters**: Build fails with cryptic errors if dependencies aren't installed.

**Mistake 2: Silent failures with optional steps**

```javascript
// Build continues even if critical step fails
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch {
  // Silently ignore errors
}
```

**Correct approach:**

```javascript
// Only catch errors for truly optional steps
execSync('npm run build', { stdio: 'inherit' }); // Required - don't catch

// Optional step
try {
  execSync('npm run build:sandbox', { stdio: 'inherit' });
} catch (error) {
  console.warn('Sandbox build skipped:', error.message);
}
```

**Why this matters**: Silent failures hide critical build problems that should fail fast.

### Testing Strategy

**What to Test:**

- Build script succeeds with clean workspace
- Build script detects missing prerequisites
- Optional steps fail gracefully
- Error messages are clear and actionable
- Build artifacts are created correctly

**Test Organization:**

- Integration tests in `scripts/tests/`
- Test in temporary workspaces
- Verify exit codes for failures

**Mock Strategy:**

- Use real file system in temp directories
- Mock external services (Docker, npm registry)
- Test actual command execution

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Build Orchestration Scripts', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-script-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should install dependencies if missing', () => {
    // Arrange - no node_modules
    expect(fs.access(path.join(tempDir, 'node_modules'))).to.eventually.be.rejected;

    // Act
    execSync('node scripts/build.js', { cwd: tempDir, stdio: 'inherit' });

    // Assert
    const nodeModulesExists = fs.access(path.join(tempDir, 'node_modules')).then(
      () => true,
      () => false
    );
    expect(nodeModulesExists).to.eventually.be.true;
  });

  it('should build all packages in workspace', () => {
    // Arrange
    const packages = ['core', 'cli', 'utils'];

    // Act
    execSync('node scripts/build.js', { cwd: tempDir, stdio: 'inherit' });

    // Assert
    for (const pkg of packages) {
      const distPath = path.join(tempDir, 'packages', pkg, 'dist');
      const distExists = fs.access(distPath).then(
        () => true,
        () => false
      );
      expect(distExists).to.eventually.be.true;
    }
  });

  it('should fail fast on critical errors', () => {
    // Arrange - introduce TypeScript error
    const sourceFile = path.join(tempDir, 'packages/core/src/index.ts');
    await fs.writeFile(sourceFile, 'const x: number = "string";');

    // Act & Assert
    expect(() => {
      execSync('node scripts/build.js', { cwd: tempDir, stdio: 'pipe' });
    }).to.throw();
  });

  it('should continue on optional step failure', () => {
    // Arrange - sandbox not available
    process.env.BUILD_SANDBOX = '1';

    // Act - should not throw
    execSync('node scripts/build.js', { cwd: tempDir, stdio: 'inherit' });

    // Assert - main build succeeded
    const bundleExists = fs.access(path.join(tempDir, 'bundle')).then(
      () => true,
      () => false
    );
    expect(bundleExists).to.eventually.be.true;
  });
});
```

**Coverage Goals:**

- Script paths: 100% (all code paths tested)
- Error scenarios: All failure modes covered
- Integration: End-to-end build workflow verified

### Related Patterns

- **[Organized Build Scripts](./17-build-tooling.md#pattern-1-organized-build-scripts)** - npm scripts that invoke orchestration scripts
- **[TypeScript Composite Builds](./17-build-tooling.md#pattern-3-typescript-composite-builds)** - TypeScript compilation coordinated by scripts

---

## Pattern 6: Asset Management

### Intent

Copy non-TypeScript assets (JSON, Markdown, TOML files) to output directory during build process.

### Problem

TypeScript compiler only copies .ts files, leaving assets behind. Build output is incomplete without configuration files, documentation, and data files. Manual asset copying is error-prone and easy to forget. Some packages need package-specific asset handling that differs from the standard build.

### Solution

Create a custom asset copy script that recursively copies specified file types from source to output directory. Run asset copy as part of each package build. Support package-specific customization for special asset requirements. Maintain directory structure during copy to preserve relative paths.

### Structure

```javascript
// Recursively copy assets from src/ to dist/src/
copyFilesRecursive('src', 'dist/src', ['.md', '.json', '.toml']);

// Package-specific handling
if (packageName === 'cli') {
  copyExamples('src/examples', 'dist/examples');
}
```

### Implementation

**Step 1: Define file extensions to copy**

```javascript
import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.join('src');
const targetDir = path.join('dist', 'src');
const extensionsToCopy = ['.md', '.json', '.toml'];
```

**Step 2: Create recursive copy function**

```javascript
function copyFilesRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const targetPath = path.join(target, item.name);

    if (item.isDirectory()) {
      copyFilesRecursive(sourcePath, targetPath);
    } else if (extensionsToCopy.includes(path.extname(item.name))) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}
```

**Step 3: Add source directory validation**

```javascript
if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory ${sourceDir} not found.`);
  process.exit(1);
}

copyFilesRecursive(sourceDir, targetDir);
```

**Step 4: Handle package-specific assets**

```javascript
// Copy example extensions for CLI package specifically
const packageName = path.basename(process.cwd());

if (packageName === 'cli') {
  const examplesSource = path.join(sourceDir, 'commands', 'extensions', 'examples');
  const examplesTarget = path.join(targetDir, 'commands', 'extensions', 'examples');

  if (fs.existsSync(examplesSource)) {
    fs.cpSync(examplesSource, examplesTarget, { recursive: true });
  }
}
```

### Complete Example

```javascript
import fs from 'node:fs';
import path from 'node:path';

const sourceDir = path.join('src');
const targetDir = path.join('dist', 'src');

// File extensions to copy
const extensionsToCopy = ['.md', '.json', '.toml', '.sb'];

/**
 * Recursively copy files with specified extensions
 */
function copyFilesRecursive(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    const sourcePath = path.join(source, item.name);
    const targetPath = path.join(target, item.name);

    if (item.isDirectory()) {
      // Recursively copy subdirectories
      copyFilesRecursive(sourcePath, targetPath);
    } else if (extensionsToCopy.includes(path.extname(item.name))) {
      // Copy file if extension matches
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  Copied ${item.name}`);
    }
  }
}

// Validate source directory exists
if (!fs.existsSync(sourceDir)) {
  console.error(`Source directory ${sourceDir} not found.`);
  process.exit(1);
}

console.log('Copying asset files...');
copyFilesRecursive(sourceDir, targetDir);

// Package-specific asset handling
const packageName = path.basename(process.cwd());

if (packageName === 'cli') {
  console.log('Copying CLI-specific examples...');

  const examplesSource = path.join(sourceDir, 'commands', 'extensions', 'examples');
  const examplesTarget = path.join(targetDir, 'commands', 'extensions', 'examples');

  if (fs.existsSync(examplesSource)) {
    fs.cpSync(examplesSource, examplesTarget, { recursive: true });
    console.log('  Copied examples');
  }
}

console.log('Successfully copied files.');
```

**Example explained:**

- Lines 1-7: Import dependencies and define source/target directories
- Lines 12-32: Recursive copy function maintains directory structure
- Lines 35-39: Validate source directory exists before copying
- Lines 41-42: Execute main copy operation
- Lines 45-64: Package-specific customization for CLI package

### When to Use

**Use asset copy scripts when:**

- TypeScript packages include non-.ts files
- Configuration files needed at runtime
- Documentation or examples ship with package
- Directory structure must be preserved

**Avoid asset copy when:**

- Only TypeScript source files exist
- Assets bundled by esbuild instead
- No runtime asset access needed

### Benefits

- **Completeness**: All necessary files in output directory
- **Automation**: Runs as part of standard build
- **Flexibility**: Package-specific customization supported
- **Structure Preservation**: Relative paths maintained

### Trade-offs

- **Build Time**: Additional step adds to build duration
- **Disk Space**: Duplicates assets in dist directory
- **Maintenance**: List of extensions must be maintained

### Common Mistakes

**Mistake 1: Forgetting to create target directory**

```javascript
function copyFilesRecursive(source, target) {
  // Missing directory creation
  const items = fs.readdirSync(source);

  for (const item of items) {
    fs.copyFileSync(path.join(source, item), path.join(target, item));
  }
}
```

**Correct approach:**

```javascript
function copyFilesRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);

  for (const item of items) {
    fs.copyFileSync(path.join(source, item), path.join(target, item));
  }
}
```

**Why this matters**: Copy fails if target directory doesn't exist.

**Mistake 2: Not handling nested directories**

```javascript
// Only copies files in top-level directory
const files = fs.readdirSync('src');
for (const file of files) {
  fs.copyFileSync(`src/${file}`, `dist/src/${file}`);
}
```

**Correct approach:**

```javascript
function copyFilesRecursive(source, target) {
  const items = fs.readdirSync(source, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      copyFilesRecursive(path.join(source, item.name), path.join(target, item.name));
    } else {
      fs.copyFileSync(path.join(source, item.name), path.join(target, item.name));
    }
  }
}
```

**Why this matters**: Nested assets don't get copied without recursion.

### Testing Strategy

**What to Test:**

- All specified extensions are copied
- Directory structure is preserved
- Package-specific customization works
- Missing source directory is handled gracefully
- Nested directories are copied recursively

**Test Organization:**

- Integration tests in `scripts/tests/copy_files.test.ts`
- Test in temporary directories
- Verify file presence and content

**Mock Strategy:**

- Use real file system in temp directories
- Create test fixtures with known structure
- Verify copied files match source

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Asset Management', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Arrange - Create temp directory with test assets
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asset-test-'));

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(path.join(srcDir, 'config.json'), '{}');
    await fs.writeFile(path.join(srcDir, 'README.md'), '# Test');

    // Create nested structure
    const nestedDir = path.join(srcDir, 'nested');
    await fs.mkdir(nestedDir);
    await fs.writeFile(path.join(nestedDir, 'data.json'), '{}');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should copy JSON files', async () => {
    // Act
    execSync('node ../../scripts/copy_files.js', {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // Assert
    const jsonExists = await fs.access(path.join(tempDir, 'dist/src/config.json')).then(
      () => true,
      () => false
    );

    expect(jsonExists).to.be.true;
  });

  it('should copy Markdown files', async () => {
    // Act
    execSync('node ../../scripts/copy_files.js', {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // Assert
    const mdExists = await fs.access(path.join(tempDir, 'dist/src/README.md')).then(
      () => true,
      () => false
    );

    expect(mdExists).to.be.true;
  });

  it('should preserve directory structure', async () => {
    // Act
    execSync('node ../../scripts/copy_files.js', {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // Assert
    const nestedJsonExists = await fs.access(path.join(tempDir, 'dist/src/nested/data.json')).then(
      () => true,
      () => false
    );

    expect(nestedJsonExists).to.be.true;
  });

  it('should not copy TypeScript files', async () => {
    // Arrange
    await fs.writeFile(path.join(tempDir, 'src/index.ts'), 'export const x = 1;');

    // Act
    execSync('node ../../scripts/copy_files.js', {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // Assert
    const tsExists = await fs.access(path.join(tempDir, 'dist/src/index.ts')).then(
      () => true,
      () => false
    );

    expect(tsExists).to.be.false;
  });
});
```

**Coverage Goals:**

- Extension coverage: 100% (all configured extensions tested)
- Directory depth: Test nested structures
- Edge cases: Missing directories, empty directories

### Related Patterns

- **[Custom Build Orchestration](./17-build-tooling.md#pattern-5-custom-build-orchestration)** - Build scripts that invoke asset copy
- **[Package Configuration](./17-build-tooling.md#pattern-2-package-configuration-standards)** - Files array specifies what assets to publish

---

## Quick Reference

### Pattern Summary Table

| Pattern                 | Use When                                | Avoid When                       | Key Benefit                          |
| ----------------------- | --------------------------------------- | -------------------------------- | ------------------------------------ |
| Organized Build Scripts | 10+ scripts, monorepo, team project     | Simple projects, under 5 scripts | Discoverability via logical grouping |
| Package Configuration   | Publishing to npm, monorepo consistency | Single experimental package      | Automation via consistent structure  |
| TypeScript Composite    | Monorepo with dependencies, slow builds | Single package, no dependencies  | Incremental compilation speed        |
| Esbuild Bundling        | CLI distribution, production deployment | Library packages, dev-only code  | Fast builds, optimized bundles       |
| Custom Orchestration    | Complex workflows, conditional logic    | Simple linear builds             | Flexibility with error handling      |
| Asset Management        | Non-TS files at runtime, examples ship  | Only TypeScript source           | Complete output directory            |

### Code Snippets

**Organized Build Scripts - Minimal Example:**

```json
{
  "scripts": {
    "build": "tsc",
    "test": "mocha",
    "lint": "eslint .",
    "preflight": "npm run lint && npm run test && npm run build"
  }
}
```

**Package Configuration - Minimal Example:**

```json
{
  "name": "@scope/package",
  "type": "module",
  "main": "./dist/index.js",
  "files": ["dist"],
  "engines": { "node": ">=20.0.0" }
}
```

**TypeScript Composite - Minimal Example:**

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

**Esbuild Bundling - Minimal Example:**

```javascript
import esbuild from 'esbuild';

await esbuild.build({
  bundle: true,
  platform: 'node',
  format: 'esm',
  entryPoints: ['src/index.ts'],
  outfile: 'bundle/app.js',
});
```

**Custom Orchestration - Minimal Example:**

```javascript
import { execSync } from 'node:child_process';

execSync('npm run generate', { stdio: 'inherit' });
execSync('npm run build --workspaces', { stdio: 'inherit' });
```

**Asset Management - Minimal Example:**

```javascript
import fs from 'node:fs';

const extensions = ['.md', '.json'];
fs.readdirSync('src').forEach((file) => {
  if (extensions.includes(path.extname(file))) {
    fs.copyFileSync(`src/${file}`, `dist/${file}`);
  }
});
```

---

## Enforcement

**Package.json Validation:**

```javascript
// scripts/validate-packages.js
const requiredFields = ['name', 'version', 'type', 'engines'];
const packages = glob.sync('packages/*/package.json');

for (const pkgPath of packages) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath));

  for (const field of requiredFields) {
    if (!pkg[field]) {
      throw new Error(`${pkgPath} missing required field: ${field}`);
    }
  }

  if (pkg.type !== 'module') {
    throw new Error(`${pkgPath} must use type: module`);
  }
}
```

**Build Script Standards:**

```json
{
  "scripts": {
    "preflight": "node scripts/validate-packages.js && npm run build && npm run test"
  }
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "incremental": true,
    "moduleResolution": "NodeNext"
  }
}
```

**CI Build Checks:**

```yaml
# .github/workflows/build.yml
- name: Validate package.json files
  run: node scripts/validate-packages.js

- name: Build all packages
  run: npm run build

- name: Verify bundle size
  run: node scripts/check-bundle-size.js
```

---

## Related Patterns

- **[Monorepo Organization](./01-project-structure.md#monorepo-organization)** - Workspace structure that build tooling operates on
- **[Code Organization](./06-code-organization.md#package-structure)** - Package structure that influences build configuration
- **[Dependency Management](./08-dependency-management.md#workspace-dependencies)** - Dependencies affect build order and bundling
- **[Module Boundaries](./07-module-boundaries.md#explicit-exports)** - Export configuration impacts bundling

---

## References

**Source Code Examples:**

- [esbuild.config.js](../../examplecode/gemini/esbuild.config.js) - Complete esbuild configuration with WASM support
- [scripts/build.js](../../examplecode/gemini/scripts/build.js) - Main build orchestration script
- [scripts/build_package.js](../../examplecode/gemini/scripts/build_package.js) - Package-level build script
- [scripts/copy_files.js](../../examplecode/gemini/scripts/copy_files.js) - Asset management implementation
- [scripts/clean.js](../../examplecode/gemini/scripts/clean.js) - Build artifact cleanup
- [packages/core/tsconfig.json](../../examplecode/gemini/packages/core/tsconfig.json) - TypeScript composite configuration

**External Resources:**

- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) - Official documentation for composite builds
- [Esbuild Documentation](https://esbuild.github.io/) - Complete esbuild API reference
- [npm Workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) - Monorepo workspace management

---

## Changelog

- **2025-01-21**: Initial build tooling patterns documentation with six core patterns
