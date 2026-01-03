# Directory Structure & File Organization

Reference: `design/09-coding-standards/standards-reference/02-directory-structure.md`

<directory_rules>

## Repository Root

- **Configuration Files**: Place all project-wide config at repo root so tools find them automatically without custom paths.

  Required files: `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`, `.editorconfig`, `.nvmrc`, `.npmrc`, `README.md`, `LICENSE`

  Recommended: `CONTRIBUTING.md`, optional: `Makefile`

- **Hidden Directories**: Commit shared tooling config so all developers use identical settings.
  - ✓ Commit: `.github/`, `.husky/`, `.vscode/`, `.gcp/` (if applicable)
  - ✓ Commit: `.env.example` (template for required env vars)
  - ✗ Ignore: `.env*` files (contain secrets)

- **Scripts Directory**: Keep automation under `scripts/` with subdirectories by purpose. This centralizes tooling and keeps the root clean.
  ```
  scripts/
  ├── releasing/     # Release automation
  ├── tests/         # Test helpers
  └── utils/         # General utilities
  ```
  Name scripts `kebab-case.js` or `camelCase.js`

## Monorepo Structure

- **Package Dependencies**: Enforce dependency direction to prevent circular imports and maintain clear architecture.

  ```
  cli → core       ✓ allowed (cli depends on core)
  core → cli       ✗ forbidden (would create cycle)
  cli → test-utils ✓ allowed (dev only)
  core → test-utils ✓ allowed (dev only)
  test-utils → core ✓ allowed (test-utils can use core types)
  test-utils → cli  ✗ forbidden (test-utils is lower level)
  ```

- **Standard Package Layout**: Each package follows the same structure so developers know where to find things.

  ```
  packages/{package-name}/
  ├── src/
  │   └── index.ts      # Main barrel export
  ├── index.ts          # Re-exports src/index.ts
  ├── package.json
  ├── tsconfig.json
  ├── vitest.config.ts
  └── README.md         # Optional
  ```

- **Package Entry Points**: Each package has exactly two entry points. The root `index.ts` re-exports `src/index.ts`. This pattern enables both `import { x } from 'package'` and build tool resolution.
  - ✓ `packages/core/index.ts` → re-exports `./src/index.ts`
  - ✓ `packages/core/src/index.ts` → main barrel with public API

## Feature-Based Organization

- **Organize by Feature**: Group code by feature area, not by type. Feature directories keep related code together, making it easier to understand and modify a feature without jumping between distant directories.
  - ✓ `src/workflow/`, `src/agent/`, `src/config/`
  - ✗ `src/services/`, `src/models/`, `src/controllers/` (type-based dumping grounds)

- **Types Co-location**: Keep types with the feature that owns them. Co-located types are easier to maintain and prevent circular dependencies.
  - ✓ `src/workflow/types.ts` (workflow-specific types)
  - ✓ `src/agent/types.ts` (agent-specific types)
  - ✗ `src/types/workflow.ts` (global types directory)

- **Feature Directory Contents**: A well-structured feature directory includes:

  ```
  src/{feature}/
  ├── types.ts           # Feature-specific types
  ├── constants.ts       # Feature constants (when needed)
  ├── index.ts           # Barrel export (if 3+ exports)
  ├── {name}.ts          # Implementation files
  ├── {name}.test.ts     # Co-located unit tests
  └── __fixtures__/      # Test fixtures (when needed)
  ```

- **Nesting Limit**: Keep maximum 4 levels from `src/` because deeper nesting makes navigation difficult and often indicates poor organization.
  - ✓ `src/workflow/execution/handler.ts` (3 levels)
  - ✗ `src/workflow/execution/strategies/parallel/utils/helpers.ts` (6 levels - refactor!)

- **Single Concern Per Directory**: Each directory should have one clear purpose. Mixed concerns make code hard to find and indicate missing abstractions.
  - ✓ `src/workflow/` contains only workflow-related code
  - ✗ `src/workflow/` containing unrelated utilities or shared helpers

## Directory/File Placement Matrix

Place content in these canonical locations for consistency:

| Content Type         | Location                                    |
| -------------------- | ------------------------------------------- |
| Package source       | `packages/{name}/src/`                      |
| Feature code         | `src/{feature}/`                            |
| Configuration        | `src/config/`                               |
| Tool implementations | `src/tools/`                                |
| React/Ink components | `src/ui/components/`                        |
| React/Ink hooks      | `src/ui/hooks/`                             |
| Services             | `src/services/`                             |
| Utilities            | `src/utils/`                                |
| Feature types        | `src/{feature}/types.ts`                    |
| Unit tests           | Next to source (`*.test.ts`)                |
| Integration tests    | `integration-tests/`                        |
| Test utilities       | `src/test-utils/` or `packages/test-utils/` |
| Manual mocks         | `src/__mocks__/`                            |
| Snapshots            | `{feature}/__snapshots__/`                  |
| Documentation        | `docs/`                                     |
| Scripts              | `scripts/`                                  |
| Schemas              | `schemas/`                                  |

## File Naming

Use consistent naming so file type is obvious from the name:

| File Type         | Pattern                 | Example                    |
| ----------------- | ----------------------- | -------------------------- |
| TypeScript source | `camelCase.ts`          | `workflowEngine.ts`        |
| React component   | `PascalCase.tsx`        | `WorkflowPanel.tsx`        |
| React hook        | `use*.ts`               | `useWorkflow.ts`           |
| Unit test         | `*.test.ts`             | `workflowEngine.test.ts`   |
| Integration test  | `*.integration.test.ts` | `api.integration.test.ts`  |
| Golden test       | `*.golden.test.ts`      | `output.golden.test.ts`    |
| Circular dep test | `*.test.circular.ts`    | `imports.test.circular.ts` |
| Types file        | `types.ts`              | `types.ts`                 |
| Constants         | `constants.ts`          | `constants.ts`             |
| Barrel export     | `index.ts`              | `index.ts`                 |

## Tests Organization

- **Unit Tests Co-located**: Place unit tests next to the code they test. Co-location makes it obvious which code is tested and keeps related files together.
  - ✓ `src/workflow/engine.ts` + `src/workflow/engine.test.ts`
  - ✗ `tests/workflow/engine.test.ts` (separated from source)

- **Integration Tests Separate**: Place cross-package integration tests in the root `integration-tests/` directory because they don't belong to any single package.
  - ✓ `integration-tests/cli-core.test.ts`

- **Test Support Files**: Organize test support consistently:
  - Snapshots: `__snapshots__/` next to test files
  - Manual mocks: `src/__mocks__/`
  - Fixtures: `__fixtures__/` or `test-data/` within feature
  - Shared utilities: `src/test-utils/` or `packages/test-utils/`

## Barrel Files

- **Re-export Only**: Keep `index.ts` files as pure re-exports with no logic. Logic in barrels causes unexpected side effects and makes code harder to trace.
  - ✓ `export { WorkflowEngine } from './engine.js';`
  - ✓ `export type { WorkflowConfig } from './types.js';`
  - ✗ `const config = loadConfig(); export { config };` (has logic)

- **When to Use Barrels**:
  - ✓ Package public API (required)
  - ✓ Feature directories with 3+ exports
  - ✓ Shared test utilities
  - ✗ Single-file modules (unnecessary indirection)
  - Optional: Internal utilities

## UI Organization (React/Ink)

When using React or Ink, organize UI under `src/ui/`:

```
src/ui/
├── components/    # Reusable components (PascalCase.tsx)
├── hooks/         # Custom hooks (use*.ts)
├── contexts/      # React contexts (*Context.tsx)
├── layouts/       # Layout components
├── themes/        # Theme definitions
├── utils/         # UI utilities (camelCase.ts)
├── commands/      # CLI commands (if Ink)
├── types.ts       # UI-specific types
└── index.ts       # UI barrel export
```

Component test files use `PascalCase.test.tsx` to match their component.

## Documentation

- **Root README**: Overview, quick start, and links to detailed docs
- **Package READMEs**: Package-specific documentation in `packages/*/README.md`
- **Docs Directory**: Detailed documentation under `docs/`:
  ```
  docs/
  ├── get-started/   # Getting started guides
  ├── cli/           # CLI documentation
  ├── core/          # Core library docs
  ├── tools/         # Tool documentation
  ├── examples/      # Usage examples
  ├── changelogs/    # Version history
  ├── assets/        # Images, diagrams
  └── mermaid/       # Mermaid diagram sources
  ```

</directory_rules>

## Avoid These Patterns

Use specific, descriptive names instead of these anti-patterns:

| Anti-Pattern              | Problem                            | Use Instead                           |
| ------------------------- | ---------------------------------- | ------------------------------------- |
| Global `types/` dir       | Disconnects types from features    | `{feature}/types.ts`                  |
| Global `tests/` dir       | Disconnects tests from source      | Co-located `*.test.ts`                |
| `helpers/` or `common/`   | Vague catch-all, grows unbounded   | Specific feature or `utils/`          |
| `src/components/` at root | Unclear ownership                  | `src/ui/components/`                  |
| Single `utils.ts` file    | Grows into unmaintainable mess     | `utils/` directory with focused files |
| `misc.ts` or `other.ts`   | Vague, signals poor organization   | Specific, descriptive names           |
| `index.ts` with logic     | Hidden side effects, hard to trace | Pure re-exports only                  |
| 5+ nesting levels         | Navigation nightmare               | Refactor to flatten                   |

## Preferences

- **Barrel Exports**: Use for package APIs and features with 3+ files; skip for single-file modules.
- **Fixture Location**: Place per-feature in `__fixtures__/` or `test-data/`; shared fixtures in `test-utils/`.
- **API Reference**: Generate from source or maintain in `docs/`.

## Exceptions

When external constraints prevent following a rule:

- **Valid scenarios**: Generated code directories, vendored third-party code, legacy migrations, framework-mandated structure
- **Documentation**: Add block comment with justification and review date
- **Shared Types Exception**: Types genuinely shared by 3+ features may live in `src/types/` or a dedicated types package (document the exception)

## Verification Checklist

When reviewing directory structure:

- [ ] Config files at repo root (package.json, tsconfig.json, etc.)
- [ ] Hidden directories committed: `.github/`, `.husky/`, `.vscode/`
- [ ] `.env*` files ignored, `.env.example` committed
- [ ] Scripts under `scripts/` with appropriate subdirectories
- [ ] Package dependencies flow correctly (no forbidden imports)
- [ ] Each package has two entry points: root `index.ts` and `src/index.ts`
- [ ] Code organized by feature, not by type
- [ ] Types co-located with owning feature (`{feature}/types.ts`)
- [ ] Unit tests co-located with source (`*.test.ts`)
- [ ] Integration tests in `integration-tests/`
- [ ] Maximum 4 levels of nesting from `src/`
- [ ] Barrel files (`index.ts`) contain only re-exports
- [ ] No global `types/` or `tests/` directories
- [ ] No `helpers/`, `common/`, `misc.ts`, or `other.ts`
- [ ] UI components under `src/ui/components/`, not `src/components/`
- [ ] Files named per convention (camelCase.ts, PascalCase.tsx, use\*.ts)
