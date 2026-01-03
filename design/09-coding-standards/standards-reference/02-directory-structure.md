# Directory Structure & File Organization - Coding Standard

> **Standard ID**: STD-002
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js CLI Projects (Monorepo)
> **Enforcement**: Manual Review + Structural Validation
> **Related Documents**:
>
> - [Naming Conventions](./01-naming-conventions.md) - File naming rules
> - [Base Standard Template](../templates/99-standards/00-base-standard-template.md)
> - [Validation Checklist](../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory directory structure and file organization patterns for TypeScript/Node.js CLI projects using a monorepo architecture. These patterns ensure consistent, navigable, and maintainable codebases across all packages.

### 1.2 Scope

**Applies to**:

- Root-level project organization
- Package structure within monorepos
- Source code organization within packages
- Test file placement and organization
- Configuration file locations
- Documentation structure

**Does NOT apply to**:

- Generated build artifacts (`dist/`, `bundle/`)
- `node_modules/` contents
- Third-party vendored code internal structure
- IDE-specific hidden folders (`.idea/`, `.vscode/` contents)

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Structural linting, architecture review |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle             | Description                                                           |
| --------------------- | --------------------------------------------------------------------- |
| Feature Cohesion      | Related code lives together; features are self-contained directories  |
| Predictable Locations | Any developer can find any file by following consistent patterns      |
| Minimal Nesting       | Maximum 4 levels deep from `src/`; avoid deeply nested imports        |
| Explicit Dependencies | Package boundaries are clear; cross-package imports use package names |
| Test Proximity        | Tests live next to the code they test, not in separate hierarchies    |

---

## 3. Architectural Overview

### 3.1 Monorepo Structure Diagram

```
project-root/
├── .github/                    # GitHub workflows and templates
├── .husky/                     # Git hooks
├── .vscode/                    # VS Code workspace settings
├── docs/                       # Project documentation
├── integration-tests/          # End-to-end integration tests
├── packages/                   # Monorepo packages
│   ├── core/                   # Core library package
│   ├── cli/                    # CLI application package
│   └── test-utils/             # Shared test utilities package
├── schemas/                    # JSON/YAML schemas
├── scripts/                    # Build and utility scripts
├── third_party/                # Vendored dependencies
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore patterns
├── .npmrc                      # npm configuration
├── .nvmrc                      # Node version specification
├── .prettierrc.json            # Prettier configuration
├── eslint.config.js            # ESLint configuration
├── package.json                # Root package.json (workspaces)
├── tsconfig.json               # Root TypeScript configuration
└── README.md                   # Project readme
```

### 3.2 Layer Responsibilities

| Directory            | Responsibility                   | Contains             | Modification Frequency |
| -------------------- | -------------------------------- | -------------------- | ---------------------- |
| `packages/`          | Application and library code     | Publishable packages | High                   |
| `scripts/`           | Build automation, utilities      | Node.js scripts      | Low                    |
| `docs/`              | User and developer documentation | Markdown files       | Medium                 |
| `integration-tests/` | Cross-package integration tests  | Test files           | Medium                 |
| `schemas/`           | Validation schemas               | JSON Schema files    | Low                    |
| Root config files    | Project-wide configuration       | Config files         | Low                    |

### 3.3 Package Dependency Rules

| From Package | To Package   | Allowed  | Rationale                   |
| ------------ | ------------ | -------- | --------------------------- |
| `cli`        | `core`       | Yes      | CLI depends on core library |
| `cli`        | `test-utils` | Dev only | Test utilities for testing  |
| `core`       | `cli`        | **No**   | Core must not depend on CLI |
| `core`       | `test-utils` | Dev only | Test utilities for testing  |
| `test-utils` | `core`       | Yes      | May use core types          |
| `test-utils` | `cli`        | **No**   | Test utils must be generic  |

---

## 4. Root Directory Patterns

### 4.1 Configuration Files at Root

**Enforcement**: MUST

All project-wide configuration files MUST be placed at the repository root.

| File               | Purpose                            | Required |
| ------------------ | ---------------------------------- | -------- |
| `package.json`     | Workspace definition, root scripts | Yes      |
| `tsconfig.json`    | Base TypeScript configuration      | Yes      |
| `eslint.config.js` | ESLint rules                       | Yes      |
| `.prettierrc.json` | Code formatting rules              | Yes      |
| `.gitignore`       | Git ignore patterns                | Yes      |
| `.editorconfig`    | Editor settings                    | Yes      |
| `.nvmrc`           | Node.js version                    | Yes      |
| `.npmrc`           | npm configuration                  | Yes      |
| `README.md`        | Project overview                   | Yes      |
| `CONTRIBUTING.md`  | Contribution guidelines            | Should   |
| `LICENSE`          | License file                       | Yes      |
| `Makefile`         | Common commands (optional)         | May      |

### 4.2 Hidden Directories

| Directory  | Purpose                                    | Git Status                          |
| ---------- | ------------------------------------------ | ----------------------------------- |
| `.github/` | GitHub Actions, issue templates            | Committed                           |
| `.husky/`  | Git hooks                                  | Committed                           |
| `.vscode/` | Workspace settings, recommended extensions | Committed                           |
| `.gcp/`    | Google Cloud configuration (if applicable) | Committed                           |
| `.env*`    | Environment files                          | **Ignored** (except `.env.example`) |

### 4.3 Scripts Directory Structure

```
scripts/
├── build.js                    # Main build script
├── clean.js                    # Clean build artifacts
├── lint.js                     # Linting orchestration
├── version.js                  # Version management
├── generate-*.ts               # Code generation scripts
├── releasing/                  # Release automation
│   ├── prepare-release.js
│   └── publish.js
├── tests/                      # Script-specific tests
│   └── vitest.config.ts
└── utils/                      # Shared script utilities
    └── paths.js
```

**File Naming**: Scripts use `kebab-case.js` or `camelCase.js` for consistency.

---

## 5. Package Structure Patterns

### 5.1 Standard Package Layout

Each package in `packages/` MUST follow this structure:

```
packages/{package-name}/
├── src/                        # Source code
│   ├── index.ts                # Main barrel export
│   └── [feature-dirs]/         # Feature directories
├── index.ts                    # Package entry point (re-exports src/index.ts)
├── package.json                # Package manifest
├── tsconfig.json               # Package TypeScript config
├── vitest.config.ts            # Test configuration
└── README.md                   # Package documentation (optional)
```

### 5.2 Package Entry Points

**Enforcement**: MUST

Every package MUST have exactly two entry points:

1. **Root `index.ts`**: Re-exports from `src/index.ts`
2. **`src/index.ts`**: Main barrel export file

```typescript
// packages/core/index.ts
export * from './src/index.js';

// Selective re-exports for specific use cases
export { SpecificClass } from './src/specific/module.js';
```

```typescript
// packages/core/src/index.ts
// Grouped exports with comments

// Export config
export * from './config/config.js';
export * from './config/models.js';

// Export services
export * from './services/fileSystemService.js';
export * from './services/gitService.js';

// Export tools
export * from './tools/tools.js';
export * from './tools/tool-registry.js';

// Export utilities
export * from './utils/paths.js';
export * from './utils/errors.js';
```

### 5.3 When to Use Barrel Exports

| Scenario                        | Use Barrel | Rationale                |
| ------------------------------- | ---------- | ------------------------ |
| Package public API              | Yes        | Clean external interface |
| Feature directory with 3+ files | Yes        | Simplify imports         |
| Single-file module              | No         | Direct import is clearer |
| Internal utilities              | Optional   | Team preference          |
| Test utilities                  | Yes        | Shared test helpers      |

---

## 6. Source Directory Organization

### 6.1 Feature-Based Structure

**Enforcement**: MUST

Source code MUST be organized by feature, not by type.

```
src/
├── agents/                     # Agent-related code
│   ├── types.ts
│   ├── agentRegistry.ts
│   └── agentRegistry.test.ts
├── config/                     # Configuration management
│   ├── types.ts
│   ├── config.ts
│   ├── config.test.ts
│   ├── models.ts
│   └── storage.ts
├── services/                   # Business logic services
│   ├── fileSystemService.ts
│   ├── fileSystemService.test.ts
│   ├── gitService.ts
│   └── gitService.test.ts
├── tools/                      # Tool implementations
│   ├── types.ts
│   ├── tool-registry.ts
│   ├── edit.ts
│   ├── edit.test.ts
│   └── __snapshots__/
├── utils/                      # Shared utilities
│   ├── paths.ts
│   ├── paths.test.ts
│   ├── errors.ts
│   └── filesearch/             # Sub-feature directory
│       ├── fileSearch.ts
│       └── fileSearch.test.ts
├── test-utils/                 # Package test utilities
│   ├── index.ts
│   ├── mockConfig.ts
│   └── mockTool.ts
├── __mocks__/                  # Manual mocks
│   └── fs/
│       └── promises.ts
└── index.ts                    # Barrel export
```

### 6.2 Feature Directory Contents

Each feature directory SHOULD contain:

| File           | Purpose                           | Required       |
| -------------- | --------------------------------- | -------------- |
| `types.ts`     | Type definitions for this feature | If types exist |
| `index.ts`     | Barrel export (if 3+ exports)     | If complex     |
| `*.ts`         | Implementation files              | Yes            |
| `*.test.ts`    | Test files (co-located)           | Yes            |
| `constants.ts` | Feature-specific constants        | If needed      |

### 6.3 Type File Placement

**Enforcement**: MUST

Types MUST be co-located with their feature, NOT in a global `types/` directory.

```typescript
// CORRECT: Types in feature directory
// src/services/types.ts
export interface ServiceConfig { ... }
export type ServiceResult = Success | Failure;

// INCORRECT: Global types directory
// src/types/services.ts  <- DO NOT DO THIS
```

**Exception**: Truly shared types used by 3+ features may live in `src/types/` or be exported from a types package.

---

## 7. UI Component Organization (React/Ink)

### 7.1 UI Directory Structure

For CLI applications using React (Ink) for UI:

```
src/ui/
├── components/                 # Reusable UI components
│   ├── shared/                 # Shared across features
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── __snapshots__/
│   ├── messages/               # Message display components
│   │   ├── ErrorMessage.tsx
│   │   └── SuccessMessage.tsx
│   └── views/                  # Full-screen views
│       ├── MainView.tsx
│       └── SettingsView.tsx
├── hooks/                      # Custom React hooks
│   ├── useKeypress.ts
│   ├── useKeypress.test.ts
│   ├── useSelectionList.ts
│   └── __snapshots__/
├── contexts/                   # React contexts
│   ├── AppContext.tsx
│   └── ThemeContext.tsx
├── layouts/                    # Layout components
│   └── MainLayout.tsx
├── themes/                     # Theme definitions
│   ├── dark.ts
│   └── light.ts
├── utils/                      # UI-specific utilities
│   ├── colors.ts
│   └── formatting.ts
├── commands/                   # CLI command handlers
│   ├── types.ts
│   └── helpCommand.ts
├── types.ts                    # UI-wide type definitions
└── index.ts                    # UI exports
```

### 7.2 Component File Naming

| Component Type  | Naming                      | Example                    |
| --------------- | --------------------------- | -------------------------- |
| React Component | PascalCase.tsx              | `UserProfile.tsx`          |
| Component Test  | PascalCase.test.tsx         | `UserProfile.test.tsx`     |
| Hook            | camelCase (use\* prefix)    | `useSelectionList.ts`      |
| Hook Test       | camelCase.test.ts           | `useSelectionList.test.ts` |
| Context         | PascalCase (Context suffix) | `AppContext.tsx`           |
| Utility         | camelCase.ts                | `formatOutput.ts`          |

---

## 8. Test Organization Patterns

### 8.1 Co-located Tests

**Enforcement**: MUST

Unit tests MUST be placed next to the code they test.

```
src/services/
├── userService.ts              # Implementation
├── userService.test.ts         # Unit tests
├── userService.integration.test.ts  # Integration tests (if needed)
└── test-data/                  # Test fixtures for this feature
    └── mockUsers.json
```

### 8.2 Test File Naming

| Test Type                | Pattern                 | Example                           |
| ------------------------ | ----------------------- | --------------------------------- |
| Unit test                | `*.test.ts`             | `userService.test.ts`             |
| Integration test         | `*.integration.test.ts` | `userService.integration.test.ts` |
| Golden test              | `*.golden.test.ts`      | `output.golden.test.ts`           |
| Circular dependency test | `*.test.circular.ts`    | `imports.test.circular.ts`        |

### 8.3 Test Support Directories

| Directory        | Purpose               | Location                                    |
| ---------------- | --------------------- | ------------------------------------------- |
| `__snapshots__/` | Jest/Vitest snapshots | Next to test files                          |
| `__mocks__/`     | Manual module mocks   | `src/__mocks__/`                            |
| `__fixtures__/`  | Test fixtures         | Within feature or `test-utils/`             |
| `test-data/`     | Test data files       | Within feature directory                    |
| `test-utils/`    | Shared test utilities | `src/test-utils/` or `packages/test-utils/` |

### 8.4 Integration Tests

**Enforcement**: MUST

Cross-package integration tests MUST be in the root `integration-tests/` directory.

```
integration-tests/
├── vitest.config.ts            # Integration test config
├── setup.ts                    # Global setup
├── cli-commands.test.ts        # CLI command tests
├── end-to-end.test.ts          # Full flow tests
└── fixtures/                   # Integration test fixtures
    └── sample-project/
```

---

## 9. Documentation Structure

### 9.1 Docs Directory Organization

```
docs/
├── index.md                    # Documentation home
├── architecture.md             # System architecture
├── get-started/                # Getting started guides
│   ├── installation.md
│   └── quick-start.md
├── cli/                        # CLI documentation
│   ├── commands.md
│   └── configuration.md
├── core/                       # Core library docs
│   └── api-reference.md
├── tools/                      # Tool documentation
│   ├── overview.md
│   └── creating-tools.md
├── examples/                   # Example code and projects
│   └── basic-usage/
├── changelogs/                 # Version changelogs
│   └── v1.0.0.md
├── assets/                     # Images, diagrams
│   └── architecture-diagram.png
└── mermaid/                    # Mermaid diagram sources
    └── flow.mmd
```

### 9.2 Documentation Placement

| Doc Type               | Location                     | Format        |
| ---------------------- | ---------------------------- | ------------- |
| Project overview       | Root `README.md`             | Markdown      |
| Package docs           | `packages/*/README.md`       | Markdown      |
| API reference          | `docs/` or generated         | Markdown/HTML |
| Architecture decisions | `docs/architecture/` or ADRs | Markdown      |
| User guides            | `docs/`                      | Markdown      |

---

## 10. Anti-Patterns

### 10.1 Forbidden Directory Patterns

| Anti-Pattern              | Problem                          | Correct Pattern               |
| ------------------------- | -------------------------------- | ----------------------------- |
| Global `types/` directory | Types disconnected from features | Co-locate types with features |
| Global `tests/` directory | Tests far from implementation    | Co-locate tests with source   |
| `helpers/` or `common/`   | Vague, becomes dumping ground    | Use specific feature names    |
| Deep nesting (5+ levels)  | Hard to navigate, long imports   | Flatten structure             |
| Mixed concerns in one dir | Hard to find related code        | Separate by feature           |
| `src/components/` at root | Unclear what's a component       | Use `ui/components/`          |

### 10.2 Forbidden File Patterns

| Pattern                  | Problem                      | Correct Approach          |
| ------------------------ | ---------------------------- | ------------------------- |
| `utils.ts` (single file) | Becomes a dumping ground     | Split by purpose          |
| `index.ts` with logic    | Barrel should only re-export | Move logic to named files |
| `misc.ts` or `other.ts`  | Unclear purpose              | Name by specific function |
| Test files in `tests/`   | Far from implementation      | Co-locate with source     |

### 10.3 Code Smell Examples

```typescript
// ANTI-PATTERN: Types in global directory
// src/types/index.ts
export interface UserService { ... }  // Should be in src/services/types.ts
export interface Tool { ... }         // Should be in src/tools/types.ts

// CORRECT: Types with their feature
// src/services/types.ts
export interface UserService { ... }

// src/tools/types.ts
export interface Tool { ... }
```

```typescript
// ANTI-PATTERN: Logic in barrel file
// src/utils/index.ts
export * from './paths.js';
export function helperFunction() { ... }  // DON'T put logic here

// CORRECT: Barrel only re-exports
// src/utils/index.ts
export * from './paths.js';
export * from './helpers.js';  // Logic in separate file
```

---

## 11. Decision Trees

### 11.1 Where Should This File Go?

```
What kind of file is it?
│
├─ Configuration file?
│   └─ Project-wide → Root directory
│   └─ Package-specific → Package root
│
├─ Source code?
│   ├─ Is it a React component?
│   │   └─ Yes → src/ui/components/{feature}/
│   ├─ Is it a React hook?
│   │   └─ Yes → src/ui/hooks/
│   ├─ Is it a service/business logic?
│   │   └─ Yes → src/services/
│   ├─ Is it a tool implementation?
│   │   └─ Yes → src/tools/
│   ├─ Is it configuration handling?
│   │   └─ Yes → src/config/
│   └─ Is it a shared utility?
│       └─ Yes → src/utils/ or src/utils/{sub-feature}/
│
├─ Test file?
│   ├─ Unit test?
│   │   └─ Next to source file: {source}.test.ts
│   ├─ Integration test (cross-package)?
│   │   └─ integration-tests/
│   └─ Test utility?
│       └─ src/test-utils/ or packages/test-utils/
│
├─ Type definitions?
│   ├─ Used by single feature?
│   │   └─ {feature}/types.ts
│   └─ Shared across 3+ features?
│       └─ src/types/ or separate types package
│
└─ Documentation?
    └─ docs/{topic}/
```

### 11.2 Should I Create a New Directory?

```
Do I need a new directory?
│
├─ Are there 3+ related files?
│   ├─ Yes → Create directory
│   └─ No → Keep files in parent directory
│
├─ Is this a new feature area?
│   ├─ Yes → Create feature directory in src/
│   └─ No → Add to existing feature directory
│
├─ Would this exceed 4 levels of nesting?
│   ├─ Yes → Reconsider structure, maybe flatten
│   └─ No → Proceed with new directory
│
└─ Is the purpose clear from the directory name?
    ├─ Yes → Create it
    └─ No → Choose a more descriptive name
```

---

## 12. Enforcement

### 12.1 Structural Validation

| Check              | Method           | Configuration                         |
| ------------------ | ---------------- | ------------------------------------- |
| Max nesting depth  | Custom lint rule | 4 levels from src/                    |
| Test co-location   | Review checklist | Tests next to source                  |
| No global types    | Grep check       | No `src/types/*.ts` (with exceptions) |
| Barrel file purity | ESLint           | No logic in index.ts                  |

### 12.2 Architecture Review Checklist

- [ ] Feature code is grouped by feature, not by type
- [ ] Types are co-located with their features
- [ ] Tests are co-located with source files
- [ ] No directory exceeds 4 levels of nesting from `src/`
- [ ] Barrel files (`index.ts`) contain only re-exports
- [ ] Package entry points follow the two-file pattern
- [ ] Cross-package integration tests are in `integration-tests/`
- [ ] Configuration files are at appropriate level (root or package)

### 12.3 Directory Validation Script

```bash
#!/bin/bash
# validate-structure.sh

# Check for forbidden patterns
echo "Checking for anti-patterns..."

# No global types directory (except explicitly shared)
if find packages/*/src -type d -name "types" -not -path "*/node_modules/*" | grep -q .; then
  echo "WARNING: Found global types directories. Types should be co-located with features."
fi

# No separate tests directory
if find packages/*/src -type d -name "tests" -not -path "*/node_modules/*" | grep -q .; then
  echo "ERROR: Found separate tests directory. Tests must be co-located with source."
  exit 1
fi

# Check nesting depth (max 4 from src/)
MAX_DEPTH=4
find packages/*/src -type f -name "*.ts" | while read file; do
  depth=$(echo "$file" | sed 's|packages/[^/]*/src/||' | tr -cd '/' | wc -c)
  if [ "$depth" -gt "$MAX_DEPTH" ]; then
    echo "ERROR: File exceeds max nesting depth: $file"
  fi
done

echo "Structure validation complete."
```

---

## 13. Exceptions

### 13.1 Valid Exception Scenarios

| Scenario                 | Justification                             | Documentation Required     |
| ------------------------ | ----------------------------------------- | -------------------------- |
| Generated code directory | Build artifacts have different structure  | Comment in .gitignore      |
| Vendored third-party     | External code maintains its own structure | README in third_party/     |
| Legacy migration         | Gradual migration in progress             | Migration ticket reference |
| Framework requirements   | Framework mandates specific structure     | Framework docs link        |

### 13.2 Exception Documentation

```typescript
/**
 * STRUCTURE EXCEPTION: STD-002 Section 6.3
 * Reason: Types exported from this file are used by 5+ feature directories
 *         and represent core domain concepts.
 * Review date: 2025-06-01
 */
// src/types/domain.ts
export interface WorkflowDefinition { ... }
export type PhaseResult = Success | Failure;
```

---

## 14. Quick Reference

### 14.1 Directory Placement Matrix

| Content Type      | Location                                    |
| ----------------- | ------------------------------------------- |
| Package source    | `packages/{name}/src/`                      |
| Feature code      | `src/{feature}/`                            |
| React components  | `src/ui/components/`                        |
| React hooks       | `src/ui/hooks/`                             |
| Services          | `src/services/`                             |
| Utilities         | `src/utils/`                                |
| Types             | `src/{feature}/types.ts`                    |
| Unit tests        | Next to source file                         |
| Integration tests | `integration-tests/`                        |
| Test utilities    | `src/test-utils/` or `packages/test-utils/` |
| Mocks             | `src/__mocks__/`                            |
| Snapshots         | `{feature}/__snapshots__/`                  |
| Documentation     | `docs/`                                     |
| Scripts           | `scripts/`                                  |
| Schemas           | `schemas/`                                  |

### 14.2 File Naming Quick Reference

| Type              | Pattern                | Example                                |
| ----------------- | ---------------------- | -------------------------------------- |
| TypeScript source | camelCase.ts           | `userService.ts`                       |
| React component   | PascalCase.tsx         | `UserProfile.tsx`                      |
| React hook        | use\*.ts               | `useKeypress.ts`                       |
| Unit test         | \*.test.ts             | `userService.test.ts`                  |
| Integration test  | \*.integration.test.ts | `flow.integration.test.ts`             |
| Types file        | types.ts               | `types.ts`                             |
| Constants         | constants.ts           | `constants.ts`                         |
| Barrel export     | index.ts               | `index.ts`                             |
| Config (root)     | Various                | `.prettierrc.json`, `eslint.config.js` |

### 14.3 Nesting Limits

```
packages/core/src/services/fileSystem/utils/helpers.ts
       └─1─┘    └──2───┘  └───3────┘ └─4──┘ └──5──┘

Maximum: 4 levels from src/
This example (5 levels) is TOO DEEP - refactor!
```

---

## 15. Traceability

### 15.1 Pattern Index

| Pattern ID | Name              | Section | When to Use            |
| ---------- | ----------------- | ------- | ---------------------- |
| PAT-001    | Monorepo Root     | 4       | Project initialization |
| PAT-002    | Package Layout    | 5       | Creating new package   |
| PAT-003    | Feature Directory | 6       | Adding new feature     |
| PAT-004    | UI Organization   | 7       | Building CLI UI        |
| PAT-005    | Test Co-location  | 8       | Writing tests          |
| PAT-006    | Documentation     | 9       | Adding docs            |

### 15.2 Related Standards

| Standard                   | Relationship                 |
| -------------------------- | ---------------------------- |
| STD-001 Naming Conventions | File naming rules referenced |
| STD-003 Code Style         | Import ordering rules        |
| STD-007 Testing Standards  | Test organization details    |

---

## 16. Open Questions

| Question ID | Question                                                   | Owner        | Status  |
| ----------- | ---------------------------------------------------------- | ------------ | ------- |
| SQ-001      | Should we enforce a maximum number of files per directory? | Architecture | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
