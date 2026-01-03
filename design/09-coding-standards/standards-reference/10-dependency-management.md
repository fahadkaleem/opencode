# Dependency Management - Coding Standard

> **Standard ID**: STD-010
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: npm packages, versioning, lock files, workspace configuration
> **Enforcement**: Configuration Files + CI Validation
> **Related Documents**:
>
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md) - Common structure reference
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md) - Use before marking Active
> - [TypeScript Configuration](./04-typescript-configuration.md) - Compiler settings
> - [Build & CI/CD Standards](./16-build-cicd.md) - Build pipeline integration

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory dependency management standards for TypeScript/Node.js projects. These standards ensure reproducible builds, security compliance, and maintainable dependency graphs across the codebase.

### 1.2 Scope

**Applies to**:

- `package.json` files (root and workspace packages)
- `package-lock.json` lock files
- `.npmrc` configuration
- `.nvmrc` Node version specification
- npm scripts and lifecycle hooks

**Does NOT apply to**:

- System-level dependencies (OS packages)
- Docker base images (see Build & CI/CD Standards)
- Editor/IDE extensions

### 1.3 Enforcement Level

| Level      | Meaning                      | Mechanism                       |
| ---------- | ---------------------------- | ------------------------------- |
| **MUST**   | Exact configuration required | CI validation, pre-commit hooks |
| **SHOULD** | Recommended setting          | Code review                     |
| **MAY**    | Optional setting             | Team discretion                 |

---

## 2. Guiding Principles

| Principle       | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| Reproducibility | Same dependencies produce same results on every machine and CI run     |
| Strictness      | Lock files prevent version drift; exact versions for critical packages |
| Explicitness    | All dependencies declared; no implicit or transitive reliance          |
| Security First  | Regular audits; no known vulnerabilities in production dependencies    |
| Minimal Surface | Only required dependencies; remove unused packages promptly            |

---

## 3. Required Configuration Files

### 3.1 Root package.json

**File Location**: `package.json` (repository root)
**Purpose**: Defines project metadata, workspaces, scripts, and root-level dependencies
**Modification**: Allowed with justification; structure must match template

```json
{
  // ============================================================
  // Package Identity (MUST)
  // ============================================================

  // Package name with organization scope
  // Format: @organization/package-name
  "name": "@organization/project-name",

  // Semantic version (managed by release scripts)
  "version": "1.0.0",

  // Node.js version constraint
  // MUST match .nvmrc minimum version
  "engines": {
    "node": ">=20.0.0"
  },

  // ESM module format (MUST for new projects)
  "type": "module",

  // ============================================================
  // Monorepo Configuration (MUST for multi-package projects)
  // ============================================================

  // Workspace package locations
  "workspaces": ["packages/*"],

  // Prevent accidental publish of root package
  "private": true,

  // ============================================================
  // Repository Metadata (SHOULD)
  // ============================================================

  "repository": {
    "type": "git",
    "url": "git+https://github.com/organization/project.git"
  },

  // ============================================================
  // Scripts (MUST follow naming conventions)
  // ============================================================

  "scripts": {
    "build": "node scripts/build.js",
    "test": "npm run test --workspaces --if-present",
    "test:ci": "npm run test:ci --workspaces --if-present",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx",
    "format": "prettier --write .",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "preflight": "npm run clean && npm ci && npm run format && npm run lint && npm run build && npm run typecheck && npm run test:ci",
    "clean": "node scripts/clean.js",
    "check:lockfile": "node scripts/check-lockfile.js",
    "prepare": "husky"
  },

  // ============================================================
  // Dependency Overrides (use sparingly)
  // ============================================================

  // Force specific versions for transitive dependencies
  // Document reason for each override
  "overrides": {
    // Example: "package-name": "^2.0.0"
  },

  // ============================================================
  // Binary Entry Points (if CLI package)
  // ============================================================

  "bin": {
    "cli-name": "bundle/cli.js"
  },

  // ============================================================
  // Published Files (if publishable)
  // ============================================================

  "files": ["bundle/", "README.md", "LICENSE"],

  // ============================================================
  // Lint-Staged Configuration (MUST)
  // ============================================================

  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0 --no-warn-ignored"],
    "*.{json,md}": ["prettier --write"]
  },

  // ============================================================
  // Dependencies (organized by category)
  // ============================================================

  "dependencies": {
    // Runtime production dependencies only
  },

  "devDependencies": {
    // Build, test, and development tools only
  },

  "optionalDependencies": {
    // Platform-specific native modules only
  }
}
```

#### 3.1.1 Required Fields

| Field          | Value              | Rationale                        | Modifiable         |
| -------------- | ------------------ | -------------------------------- | ------------------ |
| `name`         | `@org/package`     | Scoped naming prevents conflicts | Yes                |
| `engines.node` | `>=20.0.0`         | LTS version minimum              | With justification |
| `type`         | `"module"`         | ESM is the standard              | No                 |
| `private`      | `true` (root only) | Prevents accidental publish      | No                 |
| `workspaces`   | `["packages/*"]`   | Standard workspace location      | With justification |

#### 3.1.2 Forbidden Fields

| Field          | Forbidden Value | Reason                                  |
| -------------- | --------------- | --------------------------------------- |
| `engines.node` | `<20.0.0`       | Below LTS support                       |
| `type`         | `"commonjs"`    | Legacy module system                    |
| `license`      | Unlicensed      | All packages must have explicit license |

---

### 3.2 Workspace Package package.json

**File Location**: `packages/*/package.json`
**Purpose**: Defines individual workspace package configuration
**Modification**: Allowed; must follow structure

```json
{
  // ============================================================
  // Package Identity (MUST)
  // ============================================================

  // Scoped package name matching directory
  "name": "@organization/package-name",

  // Version synced with root (managed by scripts)
  "version": "1.0.0",

  // Package description
  "description": "Brief description of package purpose",

  // ESM module format
  "type": "module",

  // Main entry point (compiled output)
  "main": "dist/index.js",

  // ============================================================
  // Repository Reference (SHOULD)
  // ============================================================

  "repository": {
    "type": "git",
    "url": "git+https://github.com/organization/project.git"
  },

  // ============================================================
  // Package Scripts (MUST)
  // ============================================================

  "scripts": {
    "build": "node ../../scripts/build_package.js",
    "test": "vitest run",
    "test:ci": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write ."
  },

  // ============================================================
  // Published Files (SHOULD)
  // ============================================================

  "files": ["dist"],

  // ============================================================
  // Dependencies
  // ============================================================

  "dependencies": {
    // External runtime dependencies
    // Local workspace dependencies use file: protocol
    "@organization/core-package": "file:../core"
  },

  "devDependencies": {
    // Package-specific dev dependencies
    // Shared test utilities use file: protocol
    "@organization/test-utils": "file:../test-utils"
  },

  // ============================================================
  // Engine Requirements (MUST match root)
  // ============================================================

  "engines": {
    "node": ">=20"
  }
}
```

---

### 3.3 Lock File (package-lock.json)

**File Location**: `package-lock.json` (repository root only)
**Purpose**: Ensures reproducible dependency installation
**Modification**: Auto-generated by npm; never edit manually

#### 3.3.1 Lock File Requirements

| Requirement      | Details                       |
| ---------------- | ----------------------------- |
| File type        | `package-lock.json` (npm v7+) |
| Commit to VCS    | **MUST** be committed         |
| Manual editing   | **FORBIDDEN**                 |
| Lockfile version | `3` (npm v7+ format)          |

#### 3.3.2 Lock File Validation Script

All projects MUST include this validation script:

```javascript
// scripts/check-lockfile.js

import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const lockfilePath = join(root, 'package-lock.json');

function readJsonFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error);
    return null;
  }
}

console.log('Checking lockfile...');

const lockfile = readJsonFile(lockfilePath);
if (lockfile === null) {
  process.exit(1);
}

const packages = lockfile.packages || {};
const invalidPackages = [];

for (const [location, details] of Object.entries(packages)) {
  // Skip root package
  if (location === '') {
    continue;
  }

  // Skip local workspace packages
  if (details.link === true || !location.includes('node_modules')) {
    continue;
  }

  // Registry packages need resolved + integrity
  if (details.resolved && details.integrity) {
    continue;
  }

  // Git and file dependencies only need resolved
  const isGitOrFileDep =
    details.resolved?.startsWith('git') || details.resolved?.startsWith('file:');
  if (isGitOrFileDep) {
    continue;
  }

  invalidPackages.push(location);
}

if (invalidPackages.length > 0) {
  console.error('\nError: Dependencies missing "resolved" or "integrity" field:');
  invalidPackages.forEach((pkg) => console.error(`- ${pkg}`));
  process.exitCode = 1;
} else {
  console.log('Lockfile check passed.');
  process.exitCode = 0;
}
```

---

### 3.4 npm Configuration (.npmrc)

**File Location**: `.npmrc` (repository root)
**Purpose**: npm registry and behavior configuration
**Modification**: Allowed with justification

```bash
# .npmrc

# ============================================================
# Registry Configuration
# ============================================================

# Default registry (standard npm)
registry=https://registry.npmjs.org/

# Scoped package registries (if using private packages)
# @organization:registry=https://npm.pkg.github.com/

# ============================================================
# Installation Behavior
# ============================================================

# Save exact versions by default (SHOULD)
# save-exact=true

# Generate lockfile (MUST be true)
package-lock=true

# ============================================================
# Security
# ============================================================

# Audit on install (SHOULD be true)
audit=true
```

---

### 3.5 Node Version (.nvmrc)

**File Location**: `.nvmrc` (repository root)
**Purpose**: Specifies Node.js version for development and CI
**Modification**: Allowed; must match engines field

```
20
```

#### 3.5.1 Version Requirements

| Constraint | Value                  | Rationale                    |
| ---------- | ---------------------- | ---------------------------- |
| Minimum    | `20`                   | LTS version with ESM support |
| Format     | Major version only     | Allows patch updates         |
| CI Matrix  | `20.x`, `22.x`, `24.x` | Test across LTS versions     |

---

## 4. Version Strategies

### 4.1 Dependency Version Ranges

| Category                 | Strategy | Pattern       | Example                       |
| ------------------------ | -------- | ------------- | ----------------------------- |
| Production dependencies  | Caret    | `^x.y.z`      | `"zod": "^3.23.8"`            |
| Critical/API packages    | Exact    | `x.y.z`       | `"@vendor/sdk": "1.30.0"`     |
| Development dependencies | Caret    | `^x.y.z`      | `"vitest": "^3.1.1"`          |
| Peer dependencies        | Range    | `>=x.y.z`     | `"react": ">=18.0.0"`         |
| Local workspace          | File     | `file:../pkg` | `"@org/core": "file:../core"` |

### 4.2 When to Use Exact Versions

Use exact versions (`1.2.3` without `^` or `~`) when:

| Scenario                   | Rationale                                        |
| -------------------------- | ------------------------------------------------ |
| Vendor SDK/API packages    | API changes require explicit upgrade review      |
| Known compatibility issues | Specific version tested; newer versions untested |
| Security-patched versions  | Ensure specific patched version is used          |
| Native binary dependencies | Platform-specific binaries may differ by version |

### 4.3 Version Update Policy

| Dependency Type  | Update Frequency | Process                                  |
| ---------------- | ---------------- | ---------------------------------------- |
| Security patches | Immediate        | Automated PR, expedited review           |
| Patch versions   | Weekly           | Batch update PR                          |
| Minor versions   | Monthly          | Review changelog, test thoroughly        |
| Major versions   | Quarterly        | Breaking change analysis, migration plan |

---

## 5. Dependency Categories

### 5.1 Category Definitions

| Category    | package.json Field     | Purpose                                | Installed When                     |
| ----------- | ---------------------- | -------------------------------------- | ---------------------------------- |
| Production  | `dependencies`         | Required at runtime                    | Always                             |
| Development | `devDependencies`      | Build/test/dev tools                   | `npm install` (not `--production`) |
| Optional    | `optionalDependencies` | Platform-specific, fallback available  | When platform matches              |
| Peer        | `peerDependencies`     | Expected in consumer's dependency tree | Consumer must install              |

### 5.2 Category Assignment Rules

```
Deciding dependency category:
│
├─ Is it needed at runtime in production?
│   ├─ Yes → dependencies
│   └─ No ─┐
│          │
├─ Is it a build tool, test framework, or dev utility?
│   ├─ Yes → devDependencies
│   └─ No ─┐
│          │
├─ Is it platform-specific with a fallback available?
│   ├─ Yes → optionalDependencies
│   └─ No ─┐
│          │
├─ Should the consumer provide it?
│   ├─ Yes → peerDependencies
│   └─ No → Reconsider if needed
```

### 5.3 Common Package Categorization

| Package Type       | Category               | Examples                       |
| ------------------ | ---------------------- | ------------------------------ |
| Runtime libraries  | `dependencies`         | `zod`, `dotenv`, `ws`          |
| CLI frameworks     | `dependencies`         | `ink`, `yargs`, `commander`    |
| Test frameworks    | `devDependencies`      | `vitest`, `jest`               |
| Build tools        | `devDependencies`      | `esbuild`, `typescript`, `tsx` |
| Linters/Formatters | `devDependencies`      | `eslint`, `prettier`           |
| Type definitions   | `devDependencies`      | `@types/*`                     |
| Native modules     | `optionalDependencies` | `node-pty`, platform variants  |
| Framework plugins  | `peerDependencies`     | (when creating plugins)        |

---

## 6. Workspace Configuration

### 6.1 Workspace Structure

```
project-root/
├── package.json           # Root with workspaces config
├── package-lock.json      # Single lock file for all packages
├── .npmrc                 # npm configuration
├── .nvmrc                 # Node version
└── packages/
    ├── cli/               # Main CLI package
    │   └── package.json
    ├── core/              # Core library
    │   └── package.json
    ├── test-utils/        # Shared test utilities
    │   └── package.json
    └── [other-packages]/
        └── package.json
```

### 6.2 Inter-Package Dependencies

| Dependency Type      | Declaration                | Example                                   |
| -------------------- | -------------------------- | ----------------------------------------- |
| Workspace dependency | `file:` protocol           | `"@org/core": "file:../core"`             |
| Shared test utils    | `file:` in devDependencies | `"@org/test-utils": "file:../test-utils"` |

### 6.3 Private Packages

| Package Type       | `private` Field | Rationale                |
| ------------------ | --------------- | ------------------------ |
| Root package       | `true`          | Never published          |
| Internal utilities | `true`          | Not published separately |
| Published packages | `false` or omit | Allow npm publish        |

---

## 7. Dependency Overrides

### 7.1 When to Use Overrides

| Scenario                                  | Action                      | Documentation Required |
| ----------------------------------------- | --------------------------- | ---------------------- |
| Security vulnerability in transitive dep  | Override to patched version | CVE reference          |
| Compatibility issue with specific version | Pin working version         | Issue link             |
| Replace package with fork                 | Override with fork          | Justification          |

### 7.2 Override Format

```json
{
  "overrides": {
    // Direct override: force version for all uses
    // Reason: CVE-2024-XXXXX - security vulnerability
    "vulnerable-package": "^2.0.1",

    // Nested override: only in specific parent
    // Reason: Incompatibility between parent-package and child v2
    "parent-package": {
      "child-package": "1.5.0"
    },

    // Package replacement with fork
    // Reason: Need unreleased fix from PR #123
    "original-package": "npm:@fork/original-package@1.0.0"
  }
}
```

### 7.3 Override Documentation

Every override MUST be documented with:

```json
{
  "overrides": {
    // OVERRIDE: package-name
    // Reason: [Why this override is necessary]
    // Reference: [CVE/Issue/PR link]
    // Review Date: [When to check if still needed]
    "package-name": "^1.2.3"
  }
}
```

---

## 8. Native/Platform Dependencies

### 8.1 Optional Dependencies Pattern

For native modules with platform-specific variants:

```json
{
  "optionalDependencies": {
    "@package/native": "1.0.0",
    "@package/native-darwin-arm64": "1.0.0",
    "@package/native-darwin-x64": "1.0.0",
    "@package/native-linux-x64": "1.0.0",
    "@package/native-win32-arm64": "1.0.0",
    "@package/native-win32-x64": "1.0.0"
  }
}
```

### 8.2 External Dependencies for Bundling

For esbuild/bundler configuration, externalize native modules:

```javascript
// esbuild.config.js
const external = [
  '@package/native',
  'native-module',
  '@package/native-darwin-arm64',
  '@package/native-darwin-x64',
  '@package/native-linux-x64',
  '@package/native-win32-arm64',
  '@package/native-win32-x64',
];
```

---

## 9. Scripts Naming Convention

### 9.1 Required Scripts

| Script      | Command            | Purpose                                               |
| ----------- | ------------------ | ----------------------------------------------------- |
| `build`     | Build all packages | Production build                                      |
| `test`      | Run tests          | Execute test suite                                    |
| `test:ci`   | Run tests for CI   | Tests with coverage/reports                           |
| `lint`      | Run linter         | Check code style                                      |
| `lint:fix`  | Fix lint errors    | Auto-fix where possible                               |
| `format`    | Format code        | Run Prettier                                          |
| `typecheck` | Type check         | Run tsc --noEmit                                      |
| `clean`     | Clean artifacts    | Remove dist/, node_modules/                           |
| `preflight` | Full validation    | clean + ci + format + lint + build + typecheck + test |

### 9.2 Workspace Script Patterns

```json
{
  "scripts": {
    // Run script in all workspaces
    "test": "npm run test --workspaces --if-present",

    // Run script only if it exists
    "typecheck": "npm run typecheck --workspaces --if-present",

    // Run in specific workspace
    "build:cli": "npm run build --workspace @org/cli"
  }
}
```

---

## 10. Anti-Patterns

### 10.1 Forbidden Patterns

| Pattern                    | Why Forbidden                     | Correct Approach           |
| -------------------------- | --------------------------------- | -------------------------- |
| `npm install` in CI        | Non-reproducible builds           | Use `npm ci`               |
| Missing lock file          | Version drift across environments | Commit `package-lock.json` |
| `*` version range          | Unpredictable updates             | Use `^x.y.z` minimum       |
| `latest` tag               | Breaks on new major versions      | Use explicit version       |
| Editing lock file manually | Corrupts integrity                | Run `npm install`          |
| Duplicate dependencies     | Bloated `node_modules`            | Check with `npm dedupe`    |
| Unused dependencies        | Security risk, bloat              | Remove unused packages     |

### 10.2 Common Mistakes

```json
// INCORRECT: Using npm install in CI
// package.json scripts
{
  "scripts": {
    "ci": "npm install && npm test"  // Wrong: non-deterministic
  }
}

// CORRECT: Using npm ci for reproducible installs
{
  "scripts": {
    "ci": "npm ci && npm test"  // Correct: uses lock file
  }
}
```

```json
// INCORRECT: Wildcard versions
{
  "dependencies": {
    "risky-package": "*"  // Wrong: any version
  }
}

// CORRECT: Explicit version range
{
  "dependencies": {
    "stable-package": "^2.0.0"  // Correct: semver range
  }
}
```

---

## 11. Enforcement

### 11.1 CI Validation

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate lockfile
        run: npm run check:lockfile

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Check for unused dependencies
        run: npx depcheck --ignores="@types/*"
```

### 11.2 Pre-commit Validation

```bash
#!/bin/bash
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

### 11.3 Dependency Audit Configuration

| Check          | Frequency    | Blocking Severity       |
| -------------- | ------------ | ----------------------- |
| `npm audit`    | Every CI run | `high` and above        |
| `npm outdated` | Weekly       | Advisory only           |
| License check  | PR review    | Non-permissive licenses |

---

## 12. Exceptions

### 12.1 Allowed Modifications

| Setting           | When Modifiable              | Documentation Required      |
| ----------------- | ---------------------------- | --------------------------- |
| `engines.node`    | New LTS version available    | Update .nvmrc and CI matrix |
| Version strategy  | Package requires pinning     | Comment in package.json     |
| Override addition | Security/compatibility issue | Reference in comment        |

### 12.2 Exception Documentation

When adding overrides or non-standard configurations:

```json
{
  // DEPENDENCY EXCEPTION: STD-010 Section 4.1
  // Reason: Package X has breaking change in 3.x; waiting for upstream fix
  // Reference: https://github.com/org/package/issues/123
  // Review Date: 2025-03-01
  "dependencies": {
    "package-name": "2.5.0"
  }
}
```

---

## 13. Quick Reference

### 13.1 File Checklist

| File                | Location   | Required | Template       |
| ------------------- | ---------- | -------- | -------------- |
| `package.json`      | Root       | Yes      | Section 3.1    |
| `package-lock.json` | Root       | Yes      | Auto-generated |
| `.npmrc`            | Root       | Yes      | Section 3.4    |
| `.nvmrc`            | Root       | Yes      | Section 3.5    |
| `check-lockfile.js` | `scripts/` | Yes      | Section 3.3.2  |

### 13.2 Version Strategy Summary

| Dependency Type | Pattern  | Example                 |
| --------------- | -------- | ----------------------- |
| Standard        | `^x.y.z` | `"^3.23.8"`             |
| Critical/API    | `x.y.z`  | `"1.30.0"`              |
| Local workspace | `file:`  | `"file:../core"`        |
| Replacement     | `npm:`   | `"npm:@fork/pkg@1.0.0"` |

### 13.3 npm Commands Reference

```bash
# Install dependencies (development)
npm install

# Install dependencies (CI - reproducible)
npm ci

# Add production dependency
npm install package-name

# Add dev dependency
npm install --save-dev package-name

# Add optional dependency
npm install --save-optional package-name

# Update lock file after manual package.json edit
npm install

# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated

# Deduplicate dependencies
npm dedupe
```

---

## 14. Traceability

### 14.1 Configuration Index

| Config ID  | File                      | Section | Purpose                         |
| ---------- | ------------------------- | ------- | ------------------------------- |
| CFG-010-01 | `package.json`            | 3.1     | Root package configuration      |
| CFG-010-02 | `packages/*/package.json` | 3.2     | Workspace package configuration |
| CFG-010-03 | `package-lock.json`       | 3.3     | Dependency lock file            |
| CFG-010-04 | `.npmrc`                  | 3.4     | npm behavior configuration      |
| CFG-010-05 | `.nvmrc`                  | 3.5     | Node version specification      |

### 14.2 Related Standards

| Standard                         | Relationship                          |
| -------------------------------- | ------------------------------------- |
| STD-004 TypeScript Configuration | TypeScript version in devDependencies |
| STD-016 Build & CI/CD            | CI uses npm ci, runs audit            |
| STD-009 Git Workflow             | Lock file commit requirements         |

---

## 15. Open Questions

| Question ID | Question                                                  | Owner | Status  |
| ----------- | --------------------------------------------------------- | ----- | ------- |
| SQ-010-01   | Should we enforce `save-exact=true` in .npmrc globally?   | Team  | Pending |
| SQ-010-02   | What is the policy for pre-release versions (alpha/beta)? | Team  | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
