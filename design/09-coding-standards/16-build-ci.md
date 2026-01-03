# Build & CI/CD Standards

Reference: `design/09-coding-standards/standards-reference/16-build-ci.md`

<build_ci_rules>

## Guiding Principles

- **Reproducibility**: Same inputs produce identical outputs across all environments
- **Fail Fast**: Catch issues as early as possible in the pipeline
- **Automation First**: Automate all repeatable processes; minimize manual intervention
- **Incremental Builds**: Optimize for fast feedback during development
- **Explicit Configuration**: All settings documented; no implicit behaviors

## Build Scripts

### Required package.json Scripts

Standardized script names enable team-wide muscle memory and CI automation.

```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "build:packages": "npm run build --workspaces",
    "bundle": "npm run generate && node esbuild.config.js",
    "clean": "node scripts/clean.js",
    "generate": "node scripts/generate.js",

    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --fix --ext .ts,.tsx && npm run format",
    "lint:ci": "npm run lint:all",
    "format": "prettier --write .",
    "format:check": "prettier --check .",

    "typecheck": "tsc --noEmit",
    "typecheck:watch": "tsc --noEmit --watch",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:ci": "vitest run --reporter=junit --outputFile=junit.xml",
    "test:coverage": "vitest run --coverage",

    "preflight": "npm run clean && npm ci && npm run format:check && npm run lint:ci && npm run build && npm run typecheck && npm run test:ci",
    "pre-commit": "lint-staged",

    "release:version": "node scripts/version.js",
    "prepare": "husky"
  }
}
```

| Script                    | Purpose                                       | Exit on Failure |
| ------------------------- | --------------------------------------------- | --------------- |
| `build`                   | Compile TypeScript before bundling/testing    | Yes             |
| `bundle`                  | Create production ESM bundle for distribution | Yes             |
| `clean`                   | Remove build artifacts for fresh builds       | No              |
| `lint` / `lint:ci`        | Run ESLint checks (CI is stricter)            | Yes             |
| `format` / `format:check` | Format with Prettier / verify formatting      | No / Yes        |
| `typecheck`               | TypeScript type validation before commit      | Yes             |
| `test` / `test:ci`        | Run tests (CI includes junit reporter)        | Yes             |
| `preflight`               | Complete validation suite before release      | Yes             |
| `pre-commit`              | Git pre-commit validation via lint-staged     | Yes             |

### Script Naming

- Keep these exact names because they're the de-facto standard across npm packages
- Extensions allowed (e.g., `lint:fix`), but core scripts (`build`, `test`, `lint`) keep their names
- Use colons for variants: `test:ci`, `test:watch`, `test:coverage`

## Bundling Configuration (esbuild)

### Required Settings

Use these settings because they ensure correct Node.js CLI distribution.

| Setting     | Value    | Why                                              |
| ----------- | -------- | ------------------------------------------------ |
| `platform`  | `node`   | CLI runs in Node.js, not browser                 |
| `format`    | `esm`    | Modern module format, better tree-shaking        |
| `target`    | `node20` | Minimum LTS version for compatibility            |
| `bundle`    | `true`   | Single-file distribution simplifies installation |
| `sourcemap` | `true`   | Required for debugging production issues         |
| `metafile`  | `true`   | Enables bundle analysis                          |

```javascript
const baseConfig = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  metafile: true,
  logLevel: 'info',
};
```

### ESM Compatibility Banner

Inject CommonJS compatibility when bundling ESM for Node.js (some dependencies need `require`, `__dirname`, `__filename`):

```javascript
banner: {
  js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
},
```

### External Native Modules

Mark native modules as external because they can't be bundled (platform-specific binaries):

- ✓ `external: ['node-pty', '@node-pty/*']`
- ✗ `external: []` with native modules → runtime errors

### Build-Time Constants

Inject version and build time for debugging and telemetry:

```javascript
define: {
  'process.env.CLI_VERSION': JSON.stringify(pkg.version),
  'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
},
```

## CI/CD Workflows

### Main CI Workflow Structure

The CI pipeline validates code quality before merge. Jobs run in parallel where possible for speed.

```
Push/PR triggers:
├── lint          → ESLint, Prettier, YAML validation
├── test          → Build + Type check + Unit tests (matrix: OS × Node)
├── bundle        → Create bundle + Smoke test
└── ci-gate       → Final pass/fail (aggregates all jobs)
```

### Concurrency Settings

Cancel in-progress runs for the same PR to save resources (but not for main branch):

```yaml
concurrency:
  group: '${{ github.workflow }}-${{ github.head_ref || github.ref }}'
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

### Matrix Testing

Test across platforms and Node versions to catch compatibility issues early:

```yaml
strategy:
  fail-fast: false # Run all matrix combinations even if one fails
  matrix:
    os: [ubuntu-latest]
    node-version: ['20.x', '22.x']
    include:
      - os: macos-latest
        node-version: '20.x'
      - os: windows-latest
        node-version: '20.x'
```

### Job Timeouts

Set timeouts to prevent runaway jobs from consuming resources:

- ✓ `timeout-minutes: 30` for test jobs
- ✓ `timeout-minutes: 15` for lint/bundle jobs
- ✗ No timeout → jobs can run indefinitely

### CI Gate Job

Use a final gate job that checks all required jobs passed. This simplifies branch protection rules (one check instead of many):

```yaml
ci-gate:
  name: CI Gate
  needs: [lint, test, bundle]
  if: always()
  steps:
    - name: Check job results
      run: |
        if [[ "${{ needs.lint.result }}" != "success" ]] || \
           [[ "${{ needs.test.result }}" != "success" ]] || \
           [[ "${{ needs.bundle.result }}" != "success" ]]; then
          exit 1
        fi
```

### Artifact Uploads

Upload test results and coverage for debugging failed runs:

```yaml
- name: Upload test results
  if: always() # Upload even on failure
  uses: actions/upload-artifact@v4
  with:
    name: test-results-${{ matrix.os }}-node${{ matrix.node-version }}
    path: junit.xml
    retention-days: 7
```

## Quality Gates

### Gate Thresholds

| Gate                 | Threshold | Blocking | Why                                           |
| -------------------- | --------- | -------- | --------------------------------------------- |
| ESLint errors        | 0         | Yes      | Lint errors indicate bugs or style violations |
| ESLint warnings      | 0 in CI   | Yes      | Warnings accumulate if not enforced           |
| TypeScript errors    | 0         | Yes      | Type errors cause runtime failures            |
| Test failures        | 0         | Yes      | Failing tests indicate regressions            |
| Test coverage        | 80% lines | Warning  | Ensures new code is tested                    |
| Bundle size increase | 10KB      | Warning  | Catches accidental dependency bloat           |
| Build time           | 5 minutes | Warning  | Maintains developer productivity              |

### Pre-commit Hook

Run lint-staged on commit to catch issues before CI. This provides faster feedback than waiting for CI.

**`.husky/pre-commit`**:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run pre-commit || {
  echo "Pre-commit checks failed."
  echo "To bypass (not recommended): git commit --no-verify"
  exit 1
}
```

**lint-staged config in `package.json`**:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

## Version Requirements

### Runtime Versions

| Tool       | Minimum | Recommended | Why                               |
| ---------- | ------- | ----------- | --------------------------------- |
| Node.js    | 20.0.0  | 20.x LTS    | LTS versions get security updates |
| npm        | 10.0.0  | Latest 10.x | Required for workspace support    |
| TypeScript | 5.3.0   | Latest 5.x  | Modern features, better inference |

### Version Files

**`.nvmrc`**: Single source of truth for Node version

```
20
```

**`package.json` engines**: Enforces version at install time

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### CI Node Setup

Use version file instead of hardcoded version to avoid drift:

- ✓ `node-version-file: '.nvmrc'`
- ✗ `node-version: '20.10.0'` → becomes outdated

## CI Performance

### Caching

Enable npm caching for faster installs:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: 'npm' # Automatic npm cache
```

Cache TypeScript incremental build info for faster rebuilds:

```yaml
- name: Cache TypeScript build
  uses: actions/cache@v4
  with:
    path: |
      packages/*/.tsbuildinfo
      packages/*/dist
    key: tsc-${{ runner.os }}-${{ hashFiles('**/tsconfig.json', 'packages/*/src/**/*.ts') }}
```

### Parallelization Strategies

| Strategy              | Use Case                                |
| --------------------- | --------------------------------------- |
| Matrix builds         | Multi-platform/version testing          |
| Parallel jobs         | Independent stages (lint ∥ test)        |
| Workspace parallelism | `npm run build --workspaces`            |
| Test sharding         | Large test suites with `vitest --shard` |

## Release Process

### Release Channels

| Channel    | npm Tag   | Purpose             | Version Format           |
| ---------- | --------- | ------------------- | ------------------------ |
| Production | `latest`  | Stable releases     | `1.2.3`                  |
| Preview    | `preview` | Pre-release testing | `1.2.3-preview.1`        |
| Nightly    | `nightly` | Daily dev builds    | `0.0.0-nightly.20251216` |

### Version Bumping

Use the `release:version` script for consistent version bumping across monorepo packages:

```bash
npm run release:version patch   # 1.2.3 → 1.2.4
npm run release:version minor   # 1.2.3 → 1.3.0
npm run release:version major   # 1.2.3 → 2.0.0
npm run release:version prerelease  # 1.2.3 → 1.2.4-0
```

### Release Workflow

1. **Validate** version format (v1.2.3 or v1.2.3-preview.1)
2. **Run preflight** (full validation suite)
3. **Update versions** across all packages
4. **Build and bundle**
5. **Smoke test** (`./bundle/cli.js --version`)
6. **Commit, tag, push**
7. **Publish to npm**
8. **Create GitHub release**

### Dry Run

Always test release workflow with dry-run first:

- ✓ `dry-run: true` → validates everything without publishing
- ✗ Skipping dry-run → potential broken releases

## Monorepo Configuration

### Workspace Setup

**Root `package.json`**:

```json
{
  "workspaces": ["packages/*"]
}
```

### Inter-Package Dependencies

Use `file:` protocol for local dependencies:

```json
{
  "dependencies": {
    "@org/core": "file:../core"
  }
}
```

### Build Order

TypeScript project references ensure correct build order:

**`packages/cli/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.json",
  "references": [{ "path": "../core" }]
}
```

## Build Artifacts

### Git Ignore Rules

Ignore build outputs to keep repo clean and prevent accidental commits of generated files:

```gitignore
# Build outputs
dist/
bundle/
*.tsbuildinfo

# Test artifacts
coverage/
junit.xml

# Dependencies
node_modules/

# Environment (secrets!)
.env
.env.local
.env.*.local
```

### CI Artifact Retention

| Artifact     | Retention | Why                   |
| ------------ | --------- | --------------------- |
| Test results | 7 days    | Debug recent failures |
| Coverage     | 7 days    | Track coverage trends |
| Bundle       | 7 days    | Download for testing  |

## Branch Protection

### Required Rules

| Rule                  | Why                                 |
| --------------------- | ----------------------------------- |
| Require PR            | Ensures code review before merge    |
| Require CI pass       | Prevents broken code from merging   |
| Require up-to-date    | Prevents stale branch merges        |
| Dismiss stale reviews | Re-review after significant changes |
| Restrict force push   | Preserves commit history            |

### Required Status Checks

```
Required before merge:
├── lint
├── test (ubuntu-latest, 20.x)
├── test (ubuntu-latest, 22.x)
├── bundle
└── ci-gate
```

</build_ci_rules>

## Anti-Patterns to Avoid

Convert these common mistakes to correct patterns:

| Instead of...               | Use...                        | Why                                               |
| --------------------------- | ----------------------------- | ------------------------------------------------- |
| `npm install` in CI         | `npm ci`                      | `npm ci` is reproducible (uses lock file exactly) |
| Missing `package-lock.json` | Commit lock file              | Ensures reproducible installs                     |
| `--force` flags             | Fix underlying issues         | Force hides real problems                         |
| Skipping typecheck          | Run `npm run typecheck`       | Type errors cause runtime failures                |
| Manual version edits        | `npm run release:version`     | Script updates all packages consistently          |
| Direct commits to main      | Use pull requests             | PRs ensure CI runs and review happens             |
| `continue-on-error: true`   | Remove or make job optional   | Hides failures                                    |
| Missing `timeout-minutes`   | Add timeout (15-30 min)       | Prevents runaway jobs                             |
| Hardcoded Node version      | `node-version-file: '.nvmrc'` | Single source of truth                            |
| Secrets in logs             | Use `::add-mask::`            | Security risk                                     |
| `git commit --no-verify`    | Fix hook issues               | Bypasses quality gates                            |
| `[skip ci]` on code changes | Only for docs/config          | Skipping CI on code is dangerous                  |

## Exceptions

When standards can't be followed:

**Valid scenarios**:

- `[skip ci]` for docs-only changes
- Extended timeout for known slow operations (with ticket)
- Platform skip for known CI runner issues (with issue link)
- Version constraint change (requires architecture review)

**Documentation format**:

```yaml
# CI EXCEPTION: Section X.Y
# Reason: [brief explanation]
# Issue: #123
# Approved: 2025-12-16
continue-on-error: true # Exception: flaky macOS runner
```

## Verification Checklist

When reviewing build/CI configuration:

### package.json Scripts

- [ ] Required scripts present: `build`, `lint`, `test`, `typecheck`, `preflight`
- [ ] Script names follow standard (not renamed)
- [ ] Variants use colon notation (`lint:ci`, `test:coverage`)

### Bundling

- [ ] esbuild uses `platform: 'node'`, `format: 'esm'`, `target: 'node20'`
- [ ] `sourcemap: true` enabled
- [ ] Native modules marked as external
- [ ] ESM compatibility banner included
- [ ] Build-time constants injected (version, build time)

### CI Workflow

- [ ] All jobs have `timeout-minutes` set
- [ ] Concurrency configured to cancel stale runs
- [ ] Matrix covers required platforms (ubuntu, macos, windows) and Node versions (20.x, 22.x)
- [ ] ci-gate job aggregates all required checks
- [ ] Artifacts uploaded with appropriate retention

### Quality Gates

- [ ] Lint job blocks on errors AND warnings
- [ ] Typecheck runs before tests
- [ ] Bundle smoke test included (`--version` works)
- [ ] Test results uploaded even on failure (`if: always()`)

### Versions

- [ ] `.nvmrc` file exists with Node version
- [ ] `engines` field in package.json matches .nvmrc
- [ ] CI uses `node-version-file` not hardcoded version

### Pre-commit

- [ ] Husky configured (`prepare: "husky"`)
- [ ] lint-staged configured for staged files
- [ ] Pre-commit hook runs lint-staged

### Release

- [ ] Version script updates all workspace packages
- [ ] Release workflow has dry-run option
- [ ] Release validates version format
- [ ] Smoke test runs before publish

### Branch Protection

- [ ] Requires PR for main branch
- [ ] Requires ci-gate to pass
- [ ] Force push disabled on main
