# TypeScript Configuration

Reference: `design/09-coding-standards/standards-reference/04-typescript-configuration.md`

<typescript_config_rules>

## Root Configuration

The root `tsconfig.json` is the single source of truth for TypeScript settings. All packages extend it to ensure consistency across the monorepo.

- **Base Config File**: Keep root `tsconfig.json` as the base configuration extended by all packages. Centralizing settings prevents drift and makes updates atomic.
  - ✓ Modify root config, all packages inherit
  - ✗ Copy settings into each package config

### Required `compilerOptions` (Root)

These settings enforce type safety and catch errors at compile time rather than runtime.

**Strict Mode** (catches type errors early):

```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitThis": true,
  "strictBindCallApply": true,
  "strictFunctionTypes": true,
  "strictNullChecks": true,
  "strictPropertyInitialization": true
}
```

**Additional Checks** (prevents common mistakes):

```json
{
  "noImplicitOverride": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "forceConsistentCasingInFileNames": true
}
```

- `noImplicitOverride`: Forces explicit `override` keyword, preventing accidental overrides
- `noImplicitReturns`: Catches missing return statements in branches
- `noUnusedLocals`: Removes dead code
- `forceConsistentCasingInFileNames`: Prevents cross-platform bugs (macOS is case-insensitive, Linux isn't)

**Module System** (ES modules with Node.js resolution):

```json
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "target": "ES2022",
  "lib": ["ES2023"]
}
```

- `NodeNext`: Native ESM support with `.js` extensions
- `ES2022`: Enables top-level await, private fields, `at()` method
- `ES2023`: Array `findLast()`, `toSorted()`, etc.

**Interop** (compatibility with npm ecosystem):

```json
{
  "esModuleInterop": true,
  "allowSyntheticDefaultImports": true,
  "verbatimModuleSyntax": true,
  "resolveJsonModule": true
}
```

- `verbatimModuleSyntax`: Enforces `import type` for type-only imports, enabling proper tree-shaking

**Monorepo Build** (incremental builds with project references):

```json
{
  "composite": true,
  "incremental": true,
  "declaration": true,
  "sourceMap": true,
  "skipLibCheck": true
}
```

- `composite`: Required for project references
- `incremental`: Caches build info for faster rebuilds
- `declaration`: Generates `.d.ts` for cross-package imports
- `skipLibCheck`: Skips type-checking `.d.ts` files (speeds up builds, npm packages handle their own types)

**Types** (ambient type definitions):

```json
{
  "types": ["node"]
}
```

## Package Configuration

Each package extends the root config and only overrides what's necessary.

- **Package Config Location**: Use `packages/<package>/tsconfig.json` extending root.

  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist"
    },
    "include": ["src/**/*.ts"]
  }
  ```

- **Allowed Package Overrides**: Only override these settings when needed:
  | Setting | When to Override |
  |---------|------------------|
  | `outDir` | Always set to `"dist"` |
  | `lib` | Add `["DOM", "DOM.Iterable"]` for browser/React code |
  | `types` | Add extra type packages (e.g., `["node", "react"]`) |
  | `jsx` | Set `"react-jsx"` for React/JSX code |
  | `include` | Add `src/**/*.tsx` when TSX files exist |

- **React/JSX Packages**: When using React, set `jsx` and add DOM libs because React components need DOM types.

  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "lib": ["ES2023", "DOM", "DOM.Iterable"],
      "outDir": "dist"
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"]
  }
  ```

- **Project References**: When package A imports from package B, add a reference so TypeScript builds them in order.

  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": { "outDir": "dist" },
    "include": ["src/**/*.ts"],
    "references": [{ "path": "../core" }, { "path": "../shared" }]
  }
  ```

  Referenced projects must have `composite: true` and emit declarations.

- **Project References Rules**: References must be acyclic (no circular dependencies). If A references B, B cannot reference A. This enforces clean architecture.

## Test Configuration

Tests need different settings (no emit, test framework types).

- **Test Config File**: Use `packages/<package>/tsconfig.test.json` or `tests/tsconfig.json`.
  ```json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "noEmit": true,
      "types": ["node", "vitest/globals"]
    },
    "include": ["src/**/*.ts", "src/**/*.test.ts", "test/**/*.ts"]
  }
  ```

  - `noEmit`: Tests don't need compiled output
  - `vitest/globals`: Provides `describe`, `it`, `expect` types

## Build Configuration

- **Root Build Config**: Maintain `tsconfig.build.json` at repo root for monorepo-wide builds.
  ```json
  {
    "files": [],
    "references": [
      { "path": "packages/core" },
      { "path": "packages/cli" },
      { "path": "packages/ui" }
    ]
  }
  ```
  The `files: []` prevents compiling root files; only references are built.

## Version Requirements

Pin versions to ensure consistent behavior across environments.

- **Minimum Versions**: Node.js `>=18.0.0`, TypeScript `>=5.0.0`, npm `>=9.0.0`
  - Node 18+ required for native ESM, fetch API, test runner
  - TypeScript 5+ required for `verbatimModuleSyntax`, decorators

- **Recommended Versions**: Node.js `20.x` LTS, TypeScript `5.3+`, npm `10.x` for best compatibility and features.

- **Node Engine in package.json**: Set `engines.node` to enforce minimum version.

  ```json
  {
    "engines": {
      "node": ">=18.0.0"
    }
  }
  ```

- **TypeScript Version Lock**: Pin with tilde (`~`) to allow only patch updates. Major/minor updates can introduce breaking changes.
  ```json
  {
    "devDependencies": {
      "typescript": "~5.3.0"
    }
  }
  ```

  - ✓ `~5.3.0` (allows 5.3.1, 5.3.2, etc.)
  - ✗ `^5.3.0` (would allow 5.4.0 which may break)

## Import Syntax

ESM requires explicit extensions and proper type imports.

- **Relative Imports**: Include `.js` extension even for `.ts` files. TypeScript compiles `.ts` to `.js`, so imports must reference the output.

  ```typescript
  // ✓ Correct
  import { Config } from './config.js';
  import type { User } from './types.js';

  // ✗ Wrong
  import { Config } from './config';
  import { Config } from './config.ts';
  ```

- **Type-Only Imports**: Use `import type` for types. This enables tree-shaking and makes intent clear.

  ```typescript
  // ✓ Correct
  import type { User, Config } from './types.js';
  import { createUser } from './users.js';

  // ✗ Wrong (imports type as value)
  import { User } from './types.js';
  ```

- **JSON Imports**: Use import assertion for type safety.

  ```typescript
  import packageJson from './package.json' with { type: 'json' };
  ```

- **Workspace Imports**: Use npm workspaces/package imports for cross-package dependencies. Path aliases break when packages are published.

  ```typescript
  // ✓ Correct (package.json defines workspace)
  import { MessageBus } from '@flowmaster/core';

  // ✗ Wrong (path alias)
  import { MessageBus } from '@/core';
  ```

## Type Safety in Code

TypeScript's type system only helps if you use it properly.

- **Use `unknown` Instead of `any`**: `any` disables type checking entirely. `unknown` forces you to narrow the type before use.

  ```typescript
  // ✓ Correct
  function parse(input: unknown): User {
    if (isUser(input)) return input;
    throw new Error('Invalid user');
  }

  // ✗ Wrong (no type checking)
  function parse(input: any): User {
    return input; // Could be anything!
  }
  ```

- **Avoid Error Suppression**: `@ts-ignore` and `@ts-nocheck` hide real bugs. Fix the type error or use proper type narrowing.

  ```typescript
  // ✓ Correct (fix the actual issue)
  const value = obj?.prop ?? defaultValue;

  // ✗ Wrong (hides the problem)
  // @ts-ignore
  const value = obj.prop;
  ```

- **Path Aliases Are Forbidden**: Do not use `compilerOptions.paths` or `compilerOptions.baseUrl`. They break when packages are published and create runtime vs compile-time mismatches. Use workspace imports instead.

</typescript_config_rules>

## Forbidden Settings

These settings break the monorepo setup or disable safety features:

| Setting                    | Why Forbidden                     |
| -------------------------- | --------------------------------- |
| `strict: false`            | Disables all type safety          |
| `noImplicitAny: false`     | Allows untyped code               |
| `skipLibCheck: false`      | Massively slows builds            |
| `module: "CommonJS"`       | Breaks ESM compatibility          |
| `moduleResolution: "node"` | Legacy resolution, use `NodeNext` |
| `target < "ES2020"`        | Missing modern features           |
| `isolatedModules`          | Conflicts with project references |
| `paths` / `baseUrl`        | Breaks published packages         |

## Exceptions

When standard settings cannot be used:

- **Allowed Modifications**: `target`, `lib`, `jsx`, `types`, `noEmit` (test configs only)

- **Exception Documentation**: Add a block comment in tsconfig explaining:

  ```json
  {
    "compilerOptions": {
      /*
       * EXCEPTION: target set to ES2020
       * Standard: ES2022
       * Reason: Legacy browser support required for IE11
       * Impact: Cannot use top-level await
       * Approved: 2024-01-15
       * Review: 2024-07-01
       */
      "target": "ES2020"
    }
  }
  ```

- **Standalone Package Config**: If a package cannot extend root config, it must:
  1. Include ALL strict settings from root
  2. Document rationale for each deviation
  3. Be reviewed before merge

## Verification Checklist

When reviewing TypeScript configuration:

- [ ] Package tsconfig extends `../../tsconfig.json`
- [ ] Only allowed settings are overridden (`outDir`, `lib`, `types`, `jsx`, `include`)
- [ ] React packages have `jsx: "react-jsx"` and DOM libs
- [ ] Cross-package dependencies have project references
- [ ] Project references are acyclic
- [ ] Test config has `noEmit: true` and `vitest/globals` in types
- [ ] `package.json` has `engines.node >= 18.0.0`
- [ ] TypeScript pinned with tilde (`~5.x.0`)
- [ ] Relative imports use `.js` extension
- [ ] Type-only imports use `import type`
- [ ] No `any` types in code (use `unknown`)
- [ ] No `@ts-ignore` or `@ts-nocheck` comments
- [ ] No `paths` or `baseUrl` in compilerOptions
- [ ] Run `npx tsc --build --noEmit` passes
