# Dependency Management

Reference: `design/09-coding-standards/standards-reference/10-dependency-management.md`

<dependency_rules>

## Root package.json

The root `package.json` orchestrates the monorepo. A consistent structure ensures tooling works correctly across all packages.

- **Required Fields**: Include these fields for npm workspaces to function properly:

  ```json
  {
    "name": "@flowmaster/root",
    "version": "0.0.0",
    "type": "module",
    "private": true,
    "workspaces": ["packages/*"],
    "engines": { "node": ">=20.0.0" }
  }
  ```

  - `name`: Scoped name (`@org/name`) for namespace isolation
  - `type`: `"module"` enables ES modules (not `"commonjs"` which breaks modern tooling)
  - `private`: `true` prevents accidental publishing of the root
  - `workspaces`: Points to package locations for npm to link them
  - `engines.node`: `>=20.0.0` enforces minimum Node version (must match `.nvmrc`)

- **Required Scripts**: Include these scripts so CI and developers use consistent commands:

  ```json
  {
    "scripts": {
      "build": "npm run build --workspaces --if-present",
      "test": "npm run test --workspaces --if-present",
      "test:ci": "npm run test:ci --workspaces --if-present",
      "lint": "npm run lint --workspaces --if-present",
      "lint:fix": "npm run lint:fix --workspaces --if-present",
      "format": "prettier --write .",
      "typecheck": "npm run typecheck --workspaces --if-present",
      "preflight": "npm run lint && npm run typecheck && npm run test",
      "clean": "npm run clean --workspaces --if-present",
      "check:lockfile": "node scripts/check-lockfile.js",
      "prepare": "husky"
    }
  }
  ```

- **lint-staged Configuration**: Format and lint staged files to catch issues before commit:

  ```json
  {
    "lint-staged": {
      "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
      "*.{json,md}": ["prettier --write"]
    }
  }
  ```

- **Repository Metadata**: Include `repository` field for tooling that links to source:
  ```json
  { "repository": { "type": "git", "url": "https://github.com/org/repo" } }
  ```

## Workspace Packages

Each package in `packages/*/` needs its own `package.json` with consistent structure.

- **Package Structure**: Follow this template so all packages work uniformly:

  ```json
  {
    "name": "@flowmaster/core",
    "version": "1.0.0",
    "description": "Core business logic for FlowMaster",
    "type": "module",
    "main": "dist/index.js",
    "scripts": {
      "build": "tsup",
      "test": "vitest run",
      "test:ci": "vitest run --coverage",
      "typecheck": "tsc --noEmit",
      "lint": "eslint src/",
      "format": "prettier --write src/"
    },
    "engines": { "node": ">=20.0.0" }
  }
  ```

- **CLI Packages**: Include `bin` field mapping command names to entry points so npm creates executable links:

  ```json
  { "bin": { "flowmaster": "dist/cli.js" } }
  ```

- **Inter-Package Dependencies**: Use `file:` protocol for workspace dependencies. This ensures npm links packages locally rather than fetching from registry:

  ```json
  {
    "dependencies": { "@flowmaster/core": "file:../core" },
    "devDependencies": { "@flowmaster/test-utils": "file:../test-utils" }
  }
  ```

- **Private vs Publishable**: Set `private: true` for internal utilities that shouldn't be published. Omit or set `false` for packages intended for npm registry.

- **Published Files**: Keep `files` array minimal to reduce package size. Only include built artifacts:

  ```json
  { "files": ["dist/"] }
  ```

- **Repository Reference**: Include repository metadata pointing to monorepo with directory:
  ```json
  {
    "repository": {
      "type": "git",
      "url": "https://github.com/org/repo",
      "directory": "packages/core"
    }
  }
  ```

## Version Strategy

Version constraints balance stability (fewer breaking changes) with security (getting patches).

- **Production Dependencies**: Use caret `^x.y.z` to allow minor/patch updates automatically. This gets security fixes while maintaining compatibility.
  - ✓ `"zod": "^3.22.0"`
  - ✗ `"zod": "*"` (too loose, unpredictable)
  - ✗ `"zod": "latest"` (non-deterministic builds)

- **Critical/API Packages**: Use exact `x.y.z` for packages where any change could break your app (ORMs, API clients with generated types):
  - ✓ `"prisma": "5.10.2"`

- **Dev Dependencies**: Use caret `^x.y.z` for tooling. Dev tools are isolated from production:
  - ✓ `"vitest": "^1.3.0"`

- **Peer Dependencies**: Use ranges to give consumers flexibility:
  - ✓ `"react": "^18.0.0 || ^19.0.0"`

- **Update Cadence**: Follow this schedule to balance freshness with stability:
  - Security patches: Immediate (same day)
  - Patch versions: Weekly
  - Minor versions: Monthly
  - Major versions: Quarterly (with testing)

- **Avoid These Patterns**: They cause unpredictable builds or bloat:
  - ✗ `*` ranges (anything goes)
  - ✗ `latest` tag (non-deterministic)
  - ✗ Duplicate dependencies across packages (use workspace hoisting)
  - ✗ Unused dependencies (bloat and security surface)

## Dependency Categories

Classifying dependencies correctly affects bundle size and install behavior.

- **dependencies**: Runtime requirements. Included in production bundle.
  - ✓ `zod`, `xstate`, `@ai-sdk/anthropic`

- **devDependencies**: Build/test/lint tools. Not included in production.
  - ✓ `vitest`, `typescript`, `eslint`, `prettier`

- **peerDependencies**: Expected to be provided by consumer. Use for plugins/extensions.
  - ✓ `react` in a React component library

- **optionalDependencies**: Platform-specific or nice-to-have. Install continues if these fail.
  - ✓ Native modules with platform variants (`@rollup/rollup-linux-x64-gnu`)

## Lock File

The lock file ensures deterministic installs across machines and CI.

- **Single Root Lock**: Use one `package-lock.json` at repo root (npm v7+ workspaces). Never create per-package lock files.

- **Commit It**: The lock file must be committed. Without it, `npm ci` fails and builds are non-deterministic.

- **Lockfile Version**: Must be version `3` (npm v7+). Older versions lack workspace support.

- **Never Edit Manually**: Let npm manage it. Manual edits cause corruption and merge conflicts. If you need to fix issues, delete and regenerate with `npm install`.

- **Validation Script**: Include `scripts/check-lockfile.js` to verify integrity:
  ```javascript
  // scripts/check-lockfile.js
  import { readFileSync } from 'node:fs';
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  if (lock.lockfileVersion !== 3) {
    console.error('Lockfile version must be 3');
    process.exit(1);
  }
  ```

## Configuration Files

- **.npmrc**: Configure npm behavior consistently for all developers:

  ```ini
  package-lock=true
  audit=true
  # registry=https://registry.npmjs.org/
  # save-exact=true  # Optional: pin all versions
  ```

- **.nvmrc**: Set Node version for the project. Use major version only so patch updates are automatic:
  ```
  20
  ```
  Keep `engines.node` in `package.json` consistent with this value.

## Overrides

Overrides force specific versions when transitive dependencies have issues.

- **Use Only For**: Security vulnerabilities, compatibility fixes, or using forks. Never for convenience.

- **Document Every Override**: Every override must have an inline comment explaining why:

  ```json
  {
    "overrides": {
      "// lodash CVE-2021-23337": "See https://nvd.nist.gov/vuln/detail/CVE-2021-23337",
      "lodash": "4.17.21",

      "// Nested override - only affects this parent": "",
      "some-parent-pkg": {
        "vulnerable-child": "2.0.0"
      }
    }
  }
  ```

  Include: reason, reference (CVE/issue/PR), and review date.

- **Nested Overrides**: Pin a transitive dependency only within a specific parent to avoid affecting other packages:
  ```json
  { "overrides": { "parent-pkg": { "child-pkg": "1.0.0" } } }
  ```

## Native/Platform Dependencies

Platform-specific native modules need special handling.

- **Use optionalDependencies**: Native variants should be optional so install succeeds on all platforms:

  ```json
  {
    "optionalDependencies": {
      "@rollup/rollup-linux-x64-gnu": "^4.0.0",
      "@rollup/rollup-darwin-arm64": "^4.0.0"
    }
  }
  ```

- **Externalize in Bundler**: Mark native modules as external in your bundler config so they're not bundled.

## CI/CD Integration

CI must enforce dependency hygiene to catch issues before merge.

- **Install with npm ci**: Use `npm ci` (clean install) not `npm install`. It's faster, fails on lock mismatch, and ensures reproducibility.
  - ✓ `npm ci`
  - ✗ `npm install` (modifies lock file, slower)

- **Validate Lock File**: Run `npm run check:lockfile` to catch version/format issues.

- **Security Audit**: Run `npm audit --audit-level=high` to block merges with known vulnerabilities.

- **Check Unused Dependencies**: Run `npx depcheck --ignores="@types/*"` to find dead dependencies.

- **Node Version Matrix**: Test across Node versions to ensure compatibility:
  ```yaml
  strategy:
    matrix:
      node-version: [20.x, 22.x, 24.x]
  ```

## Pre-commit Hooks

Enforce standards before code reaches the repo.

- **Husky Setup**: The `prepare` script wires up husky on `npm install`:

  ```json
  { "scripts": { "prepare": "husky" } }
  ```

- **Pre-commit Hook**: Configure `.husky/pre-commit` to run validation:
  ```bash
  #!/bin/sh
  npm run pre-commit
  ```

## Maintenance

Regular maintenance keeps dependencies healthy.

- **Weekly**: Run `npm outdated` to review available updates.
- **On PR Review**: Check licenses - block non-permissive licenses (GPL in MIT projects).
- **When Duplicates Appear**: Run `npm dedupe` to flatten the dependency tree.
- **Promptly Remove Unused**: Dead dependencies are security surface and bloat.

</dependency_rules>

## Preferences

- **save-exact**: Consider `save-exact=true` in `.npmrc` for maximum reproducibility (optional).
- **Repository Metadata**: Include in all packages for tooling integration.
- **Minimal Published Files**: Only include `dist/` in `files` array for publishable packages.

## Exceptions

When external constraints require deviation from these rules:

- **Allowed Modifications**:
  - `engines.node` for new LTS adoption
  - Version strategy pinning for specific packages
  - Overrides for security/compatibility (with documentation)

- **Documentation Format**: Add a comment in `package.json`:
  ```json
  {
    "// DEPENDENCY EXCEPTION: STD-010": "Pinned lodash to exact version due to CVE-2021-23337. Review: 2024-06-01. Link: https://nvd.nist.gov/..."
  }
  ```

## Verification Checklist

When reviewing dependency changes:

**Root package.json:**

- [ ] Has scoped `name` field
- [ ] `type` is `"module"` (not `"commonjs"`)
- [ ] `private` is `true`
- [ ] `workspaces` is `["packages/*"]`
- [ ] `engines.node` is `>=20.0.0` and matches `.nvmrc`
- [ ] All required scripts present (`build`, `test`, `lint`, `typecheck`, `preflight`, `check:lockfile`, `prepare`)
- [ ] `lint-staged` configured for `.{js,jsx,ts,tsx}` and `.{json,md}`

**Workspace packages:**

- [ ] Has `name`, `version`, `description`, `type`, `main`
- [ ] Scripts include `build`, `test`, `typecheck`, `lint`
- [ ] `engines.node` matches root
- [ ] Inter-package deps use `file:` protocol
- [ ] CLI packages have `bin` field

**Lock file:**

- [ ] Single `package-lock.json` at root (not per-package)
- [ ] Lockfile version is `3`
- [ ] Lock file is committed
- [ ] `scripts/check-lockfile.js` exists

**Versions:**

- [ ] Production deps use `^x.y.z` (or exact for critical packages)
- [ ] No `*` ranges or `latest` tags
- [ ] No duplicate dependencies across packages
- [ ] No unused dependencies

**Overrides:**

- [ ] Each override has documented reason, reference link, and review date
- [ ] Nested overrides used when only specific parent needs pinning

**CI:**

- [ ] Uses `npm ci` (not `npm install`)
- [ ] Runs `check:lockfile`
- [ ] Runs `npm audit --audit-level=high`
- [ ] Tests across Node 20.x, 22.x, 24.x

**Configuration:**

- [ ] `.npmrc` has `package-lock=true` and `audit=true`
- [ ] `.nvmrc` has Node major version (e.g., `20`)
- [ ] Husky configured via `prepare` script
