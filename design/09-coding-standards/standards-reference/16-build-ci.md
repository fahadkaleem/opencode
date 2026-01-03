# Build & CI/CD Standards

> **Standard ID**: STD-016
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js CLI Projects
> **Enforcement**: Configuration Files + CI Validation
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - STD-001
> - [TypeScript Configuration](./04-typescript-configuration.md) - STD-004
> - [Testing Standards](./07-testing.md) - STD-007
> - [Git Workflow](./09-git-workflow.md) - STD-009

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory build, bundling, and CI/CD standards for TypeScript/Node.js CLI projects. These configurations ensure reproducible builds, consistent quality gates, and reliable release processes across all environments.

### 1.2 Scope

**Applies to**:

- Build scripts and configuration
- TypeScript compilation settings
- Bundling configuration (esbuild)
- GitHub Actions workflows
- Release and versioning processes
- Pre-commit hooks and local validation

**Does NOT apply to**:

- Application runtime configuration (see Configuration Management)
- Test configuration details (see Testing Standards)
- Code style rules (see Code Style Standards)

### 1.3 Enforcement Level

| Level      | Meaning                      | Mechanism                       |
| ---------- | ---------------------------- | ------------------------------- |
| **MUST**   | Exact configuration required | CI validation, pre-commit hooks |
| **SHOULD** | Recommended setting          | Code review                     |
| **MAY**    | Optional setting             | Team discretion                 |

---

## 2. Guiding Principles

| Principle              | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| Reproducibility        | Same inputs produce identical outputs across all environments   |
| Fail Fast              | Catch issues as early as possible in the pipeline               |
| Automation First       | Automate all repeatable processes; minimize manual intervention |
| Incremental Builds     | Optimize for fast feedback during development                   |
| Explicit Configuration | All settings documented; no implicit behaviors                  |

---

## 3. Build Scripts

### 3.1 Required package.json Scripts

**File Location**: `package.json`
**Purpose**: Standardized build commands
**Modification**: Extension allowed; core scripts MUST NOT be renamed

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

### 3.2 Script Definitions

| Script            | Purpose                          | When to Use              | Exit on Failure |
| ----------------- | -------------------------------- | ------------------------ | --------------- |
| `build`           | Compile TypeScript to JavaScript | Before bundling, testing | Yes             |
| `build:packages`  | Build all workspace packages     | Monorepo full build      | Yes             |
| `bundle`          | Create production ESM bundle     | Release preparation      | Yes             |
| `clean`           | Remove build artifacts           | Before fresh build       | No              |
| `generate`        | Generate build metadata          | Before bundle            | Yes             |
| `lint`            | Run ESLint checks                | Development              | Yes             |
| `lint:fix`        | Auto-fix lint issues             | Development              | Yes             |
| `lint:ci`         | Full lint suite for CI           | CI pipeline              | Yes             |
| `format`          | Format code with Prettier        | Development              | No              |
| `format:check`    | Verify formatting                | CI pipeline              | Yes             |
| `typecheck`       | TypeScript type validation       | Before commit            | Yes             |
| `test`            | Run unit tests                   | Development              | Yes             |
| `test:ci`         | Run tests with CI reporters      | CI pipeline              | Yes             |
| `preflight`       | Complete validation suite        | Before release           | Yes             |
| `pre-commit`      | Git pre-commit validation        | Automatic on commit      | Yes             |
| `release:version` | Bump version numbers             | Release process          | Yes             |

### 3.3 Script Implementation Patterns

#### 3.3.1 Build Script

**File**: `scripts/build.js`

```javascript
#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function run(command, options = {}) {
  console.log(`> ${command}`);
  execSync(command, {
    stdio: 'inherit',
    cwd: root,
    ...options,
  });
}

// Step 1: Generate build metadata
run('npm run generate');

// Step 2: Build all TypeScript packages
run('npm run build --workspaces');

// Step 3: Build optional components
if (process.env.BUILD_SANDBOX === '1') {
  run('node scripts/build_sandbox.js');
}

console.log('Build completed successfully');
```

#### 3.3.2 Clean Script

**File**: `scripts/clean.js`

```javascript
#!/usr/bin/env node
import { rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pathsToClean = [
  'dist',
  'bundle',
  'coverage',
  'packages/*/dist',
  'packages/*/.tsbuildinfo',
  '.tsbuildinfo',
  'junit.xml',
];

for (const pattern of pathsToClean) {
  const fullPath = join(root, pattern);
  if (existsSync(fullPath)) {
    console.log(`Removing: ${pattern}`);
    rmSync(fullPath, { recursive: true, force: true });
  }
}

console.log('Clean completed');
```

#### 3.3.3 Version Script

**File**: `scripts/version.js`

```javascript
#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const versionType = process.argv[2]; // patch, minor, major, prerelease

if (!['patch', 'minor', 'major', 'prerelease'].includes(versionType)) {
  console.error('Usage: node scripts/version.js <patch|minor|major|prerelease>');
  process.exit(1);
}

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd: root });
}

// Read workspace packages
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
const workspaces = pkg.workspaces || [];

// Bump root version
run(`npm version ${versionType} --no-git-tag-version --allow-same-version`);

// Bump all workspace versions
for (const workspace of workspaces) {
  run(
    `npm version ${versionType} --workspace ${workspace} --no-git-tag-version --allow-same-version`
  );
}

// Update lock file
run('npm install --package-lock-only');

// Read new version
const newPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
console.log(`Version bumped to ${newPkg.version}`);
```

---

## 4. Bundling Configuration

### 4.1 esbuild Configuration

**File Location**: `esbuild.config.js`
**Purpose**: ESM bundle for CLI distribution
**Modification**: Allowed with justification

```javascript
import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));

// =============================================================================
// Base Configuration (MUST)
// =============================================================================

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

// =============================================================================
// CLI Bundle Configuration (MUST)
// =============================================================================

const cliConfig = {
  ...baseConfig,
  entryPoints: ['packages/cli/index.ts'],
  outfile: 'bundle/cli.js',

  // External native modules (platform-specific)
  external: ['node-pty', '@node-pty/*'],

  // Inject CommonJS compatibility for ESM
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

  // Inject build-time constants
  define: {
    'process.env.CLI_VERSION': JSON.stringify(pkg.version),
    'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },

  // Native module loader
  loader: {
    '.node': 'file',
  },
};

// =============================================================================
// Build Execution
// =============================================================================

async function build() {
  console.log('Building CLI bundle...');

  const result = await esbuild.build(cliConfig);

  // Output bundle analysis
  if (result.metafile) {
    const analysis = await esbuild.analyzeMetafile(result.metafile);
    console.log(analysis);
  }

  console.log('Bundle created: bundle/cli.js');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
```

### 4.2 Bundle Output Structure

```
bundle/
├── cli.js              # Main ESM bundle
├── cli.js.map          # Source map
└── assets/             # Copied static assets (if any)
    └── ...
```

### 4.3 Required Bundle Settings

| Setting     | Value    | Rationale                 | Modifiable         |
| ----------- | -------- | ------------------------- | ------------------ |
| `platform`  | `node`   | CLI runs in Node.js       | No                 |
| `format`    | `esm`    | Modern module format      | No                 |
| `target`    | `node20` | Minimum supported Node.js | With justification |
| `bundle`    | `true`   | Single-file distribution  | No                 |
| `sourcemap` | `true`   | Debugging support         | No                 |
| `metafile`  | `true`   | Bundle analysis           | No                 |

### 4.4 Forbidden Bundle Settings

| Setting     | Forbidden Value                 | Reason                 |
| ----------- | ------------------------------- | ---------------------- |
| `format`    | `cjs`                           | ESM is the standard    |
| `minify`    | `true` in development           | Hinders debugging      |
| `sourcemap` | `false`                         | Required for debugging |
| `external`  | Empty array with native modules | Causes runtime errors  |

---

## 5. CI/CD Workflows

### 5.1 Main CI Workflow

**File Location**: `.github/workflows/ci.yml`
**Purpose**: Primary validation pipeline
**Modification**: Extension allowed; core jobs MUST NOT be removed

```yaml
name: CI

on:
  push:
    branches: [main, 'release/*']
  pull_request:
    branches: [main, 'release/*']
  merge_group:
  workflow_dispatch:

concurrency:
  group: '${{ github.workflow }}-${{ github.head_ref || github.ref }}'
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

env:
  NODE_OPTIONS: '--max-old-space-size=8192'

jobs:
  # ===========================================================================
  # Lint Job (MUST)
  # ===========================================================================
  lint:
    name: Lint
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint:ci

      - name: Check formatting
        run: npm run format:check

      - name: Validate YAML files
        uses: ibiqlik/action-yamllint@v3
        with:
          file_or_dir: '.github/workflows/*.yml'
          config_file: '.yamllint.yml'

  # ===========================================================================
  # Build & Test Job (MUST)
  # ===========================================================================
  test:
    name: Test (Node ${{ matrix.node-version }}, ${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    timeout-minutes: 30
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest]
        node-version: ['20.x', '22.x']
        include:
          - os: macos-latest
            node-version: '20.x'
          - os: windows-latest
            node-version: '20.x'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test:ci

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.os }}-node${{ matrix.node-version }}
          path: junit.xml
          retention-days: 7

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.node-version == '20.x'
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
          retention-days: 7

  # ===========================================================================
  # Bundle Job (MUST)
  # ===========================================================================
  bundle:
    name: Bundle
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build

      - name: Create bundle
        run: npm run bundle

      - name: Smoke test bundle
        run: node ./bundle/cli.js --version

      - name: Upload bundle
        uses: actions/upload-artifact@v4
        with:
          name: bundle
          path: bundle/
          retention-days: 7

  # ===========================================================================
  # Bundle Size Check (SHOULD - PR only)
  # ===========================================================================
  bundle-size:
    name: Bundle Size
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: [bundle]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download bundle
        uses: actions/download-artifact@v4
        with:
          name: bundle
          path: bundle/

      - name: Check bundle size
        uses: preactjs/compressed-size-action@v2
        with:
          pattern: 'bundle/**/*.js'
          minimum-change-threshold: 1000

  # ===========================================================================
  # Final Gate (MUST)
  # ===========================================================================
  ci-gate:
    name: CI Gate
    runs-on: ubuntu-latest
    needs: [lint, test, bundle]
    if: always()
    steps:
      - name: Check job results
        run: |
          if [[ "${{ needs.lint.result }}" != "success" ]] || \
             [[ "${{ needs.test.result }}" != "success" ]] || \
             [[ "${{ needs.bundle.result }}" != "success" ]]; then
            echo "One or more required jobs failed"
            exit 1
          fi
          echo "All required jobs passed"
```

### 5.2 E2E Testing Workflow

**File Location**: `.github/workflows/e2e.yml`
**Purpose**: Integration and end-to-end tests
**Modification**: Allowed

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      sandbox:
        description: 'Sandbox type'
        required: true
        default: 'none'
        type: choice
        options:
          - none
          - docker

env:
  SANDBOX_TYPE: ${{ github.event.inputs.sandbox || 'none' }}

jobs:
  e2e:
    name: E2E (${{ matrix.sandbox }})
    runs-on: ubuntu-latest
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        sandbox: [none, docker]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Docker (if needed)
        if: matrix.sandbox == 'docker'
        run: npm run build:sandbox

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          SANDBOX_TYPE: ${{ matrix.sandbox }}

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-results-${{ matrix.sandbox }}
          path: |
            integration-tests/junit.xml
            integration-tests/.output/
          retention-days: 7
```

### 5.3 Release Workflow

**File Location**: `.github/workflows/release.yml`
**Purpose**: Automated release process
**Modification**: With approval

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., v1.2.3)'
        required: true
        type: string
      channel:
        description: 'npm channel'
        required: true
        default: 'latest'
        type: choice
        options:
          - latest
          - preview
          - nightly
      dry-run:
        description: 'Dry run (no actual release)'
        required: false
        default: false
        type: boolean

env:
  VERSION: ${{ github.event.inputs.version }}
  CHANNEL: ${{ github.event.inputs.channel }}
  DRY_RUN: ${{ github.event.inputs.dry-run }}

jobs:
  validate:
    name: Validate Release
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.validate.outputs.version }}
    steps:
      - name: Validate version format
        id: validate
        run: |
          VERSION="${{ env.VERSION }}"
          if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+\.[0-9]+)?$ ]]; then
            echo "Invalid version format: $VERSION"
            echo "Expected format: v1.2.3 or v1.2.3-beta.1"
            exit 1
          fi
          echo "version=${VERSION#v}" >> $GITHUB_OUTPUT

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: [validate]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run preflight
        run: npm run preflight

  release:
    name: Publish Release
    runs-on: ubuntu-latest
    needs: [validate, test]
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.RELEASE_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Configure Git
        run: |
          git config user.name "Release Bot"
          git config user.email "release-bot@example.com"

      - name: Install dependencies
        run: npm ci

      - name: Update version
        run: |
          VERSION="${{ needs.validate.outputs.version }}"
          npm run release:version -- $VERSION

      - name: Build
        run: npm run build

      - name: Bundle
        run: npm run bundle

      - name: Smoke test
        run: node ./bundle/cli.js --version

      - name: Commit version changes
        if: env.DRY_RUN != 'true'
        run: |
          git add -A
          git commit -m "chore(release): v${{ needs.validate.outputs.version }}"
          git tag "v${{ needs.validate.outputs.version }}"
          git push origin HEAD --tags

      - name: Publish to npm
        if: env.DRY_RUN != 'true'
        run: |
          npm publish --tag ${{ env.CHANNEL }} --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        if: env.DRY_RUN != 'true'
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ needs.validate.outputs.version }}
          name: v${{ needs.validate.outputs.version }}
          generate_release_notes: true
          files: |
            bundle/cli.js
            bundle/cli.js.map

      - name: Dry run summary
        if: env.DRY_RUN == 'true'
        run: |
          echo "## Dry Run Summary" >> $GITHUB_STEP_SUMMARY
          echo "Version: v${{ needs.validate.outputs.version }}" >> $GITHUB_STEP_SUMMARY
          echo "Channel: ${{ env.CHANNEL }}" >> $GITHUB_STEP_SUMMARY
          echo "No changes were published." >> $GITHUB_STEP_SUMMARY
```

### 5.4 Nightly Release Workflow

**File Location**: `.github/workflows/release-nightly.yml`
**Purpose**: Automated nightly builds
**Modification**: Allowed

```yaml
name: Nightly Release

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch:
    inputs:
      force:
        description: 'Force release even if no changes'
        required: false
        default: false
        type: boolean

jobs:
  check-changes:
    name: Check for Changes
    runs-on: ubuntu-latest
    outputs:
      has-changes: ${{ steps.check.outputs.has-changes }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for changes since last nightly
        id: check
        run: |
          LAST_NIGHTLY=$(git tag -l 'v*-nightly.*' --sort=-version:refname | head -n1)
          if [[ -z "$LAST_NIGHTLY" ]]; then
            echo "has-changes=true" >> $GITHUB_OUTPUT
            exit 0
          fi

          CHANGES=$(git log "$LAST_NIGHTLY"..HEAD --oneline | wc -l)
          if [[ "$CHANGES" -gt 0 ]] || [[ "${{ github.event.inputs.force }}" == "true" ]]; then
            echo "has-changes=true" >> $GITHUB_OUTPUT
          else
            echo "has-changes=false" >> $GITHUB_OUTPUT
          fi

  nightly:
    name: Publish Nightly
    runs-on: ubuntu-latest
    needs: [check-changes]
    if: needs.check-changes.outputs.has-changes == 'true'
    steps:
      - name: Calculate nightly version
        id: version
        run: |
          DATE=$(date +%Y%m%d)
          echo "version=0.0.0-nightly.${DATE}" >> $GITHUB_OUTPUT

      - name: Trigger release workflow
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'release.yml',
              ref: 'main',
              inputs: {
                version: 'v${{ steps.version.outputs.version }}',
                channel: 'nightly',
                'dry-run': 'false'
              }
            });
```

---

## 6. Quality Gates

### 6.1 Gate Definitions

| Gate        | Stage       | Criteria                    | Blocking     |
| ----------- | ----------- | --------------------------- | ------------ |
| Lint        | Pre-merge   | Zero ESLint errors          | Yes          |
| Format      | Pre-merge   | Prettier check passes       | Yes          |
| Type Check  | Pre-merge   | Zero TypeScript errors      | Yes          |
| Unit Tests  | Pre-merge   | All tests pass              | Yes          |
| Bundle      | Pre-merge   | Bundle builds successfully  | Yes          |
| Smoke Test  | Pre-merge   | Bundle executes `--version` | Yes          |
| E2E Tests   | Main branch | All E2E tests pass          | Yes          |
| Bundle Size | PR          | Size change < threshold     | No (warning) |

### 6.2 Gate Thresholds

| Metric               | Threshold | Action on Failure |
| -------------------- | --------- | ----------------- |
| ESLint errors        | 0         | Block merge       |
| ESLint warnings      | 0 in CI   | Block merge       |
| TypeScript errors    | 0         | Block merge       |
| Test failures        | 0         | Block merge       |
| Test coverage        | 80% lines | Warning (SHOULD)  |
| Bundle size increase | 10KB      | Warning           |
| Build time           | 5 minutes | Warning           |

### 6.3 Pre-commit Gate

**File Location**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run pre-commit || {
  echo ""
  echo "Pre-commit checks failed."
  echo "To bypass (not recommended): git commit --no-verify"
  exit 1
}
```

**Lint-staged Configuration** in `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

---

## 7. Version Requirements

### 7.1 Runtime Versions

| Tool       | Minimum Version | Recommended Version | Rationale         |
| ---------- | --------------- | ------------------- | ----------------- |
| Node.js    | 20.0.0          | 20.x LTS            | LTS stability     |
| npm        | 10.0.0          | Latest 10.x         | Workspace support |
| TypeScript | 5.3.0           | Latest 5.x          | Modern features   |

### 7.2 Node Version File

**File Location**: `.nvmrc`

```
20
```

### 7.3 Engine Constraints

**In `package.json`**:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

---

## 8. CI Performance Optimization

### 8.1 Caching Strategy

```yaml
# Node modules caching
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: 'npm' # Automatic npm cache

# Custom cache for build artifacts (optional)
- name: Cache TypeScript build
  uses: actions/cache@v4
  with:
    path: |
      packages/*/.tsbuildinfo
      packages/*/dist
    key: tsc-${{ runner.os }}-${{ hashFiles('**/tsconfig.json', 'packages/*/src/**/*.ts') }}
    restore-keys: |
      tsc-${{ runner.os }}-
```

### 8.2 Parallelization

| Strategy              | Use Case               | Configuration            |
| --------------------- | ---------------------- | ------------------------ |
| Matrix builds         | Multi-platform testing | `strategy.matrix`        |
| Parallel jobs         | Independent stages     | Separate job definitions |
| Workspace parallelism | Monorepo builds        | `--workspaces` flag      |
| Test sharding         | Large test suites      | Vitest `--shard`         |

### 8.3 Platform-Specific Optimizations

**Windows**:

```yaml
- name: Windows optimizations
  if: runner.os == 'Windows'
  shell: pwsh
  run: |
    # Disable Windows Defender for workspace
    Add-MpPreference -ExclusionPath $env:GITHUB_WORKSPACE

    # npm performance settings
    npm config set progress false
    npm config set audit false
```

**macOS**:

```yaml
- name: macOS optimizations
  if: runner.os == 'macOS'
  run: |
    # Increase file descriptor limit
    ulimit -n 65536
```

---

## 9. Release Channels

### 9.1 Channel Definitions

| Channel   | npm Tag   | Purpose                  | Frequency         |
| --------- | --------- | ------------------------ | ----------------- |
| `latest`  | `latest`  | Production releases      | Manual            |
| `preview` | `preview` | Pre-release testing      | Manual            |
| `nightly` | `nightly` | Daily development builds | Automated (daily) |

### 9.2 Version Format

| Channel    | Format                   | Example                  |
| ---------- | ------------------------ | ------------------------ |
| Production | `X.Y.Z`                  | `1.2.3`                  |
| Preview    | `X.Y.Z-preview.N`        | `1.2.3-preview.1`        |
| Nightly    | `0.0.0-nightly.YYYYMMDD` | `0.0.0-nightly.20251129` |

### 9.3 Installation Commands

```bash
# Production (default)
npm install -g @org/cli

# Preview
npm install -g @org/cli@preview

# Nightly
npm install -g @org/cli@nightly

# Specific version
npm install -g @org/cli@1.2.3
```

---

## 10. Anti-Patterns

### 10.1 Forbidden Build Patterns

| Pattern              | Why Forbidden             | Correct Approach             |
| -------------------- | ------------------------- | ---------------------------- |
| `npm install` in CI  | Non-reproducible          | Use `npm ci`                 |
| Missing lock file    | Non-reproducible builds   | Commit `package-lock.json`   |
| `--force` flags      | Hides real issues         | Fix underlying problems      |
| Skipping type check  | Type errors in production | Always run `typecheck`       |
| Manual version bumps | Inconsistent versions     | Use `release:version` script |
| Direct main commits  | Bypasses CI               | Use pull requests            |

### 10.2 Forbidden CI Patterns

| Pattern                                    | Why Forbidden         | Correct Approach        |
| ------------------------------------------ | --------------------- | ----------------------- |
| `continue-on-error: true` on required jobs | Hides failures        | Remove or make optional |
| Missing timeout                            | Jobs run indefinitely | Set `timeout-minutes`   |
| Hardcoded versions                         | Breaks on updates     | Use version files       |
| Secrets in logs                            | Security risk         | Use `::add-mask::`      |
| `--no-verify` commits                      | Bypasses hooks        | Fix hook issues         |

### 10.3 Common Mistakes

```yaml
# INCORRECT: Using npm install in CI
- name: Install
  run: npm install # Non-reproducible!

# CORRECT: Using npm ci
- name: Install
  run: npm ci
```

```yaml
# INCORRECT: Missing timeout
jobs:
  build:
    runs-on: ubuntu-latest
    # No timeout - could run forever!

# CORRECT: With timeout
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30
```

```yaml
# INCORRECT: Hardcoded Node version
- uses: actions/setup-node@v4
  with:
    node-version: '20.10.0' # Will become outdated

# CORRECT: Using version file
- uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
```

---

## 11. Build Artifacts

### 11.1 Artifact Definitions

| Artifact          | Location           | Purpose            | Git Status | Retention   |
| ----------------- | ------------------ | ------------------ | ---------- | ----------- |
| TypeScript output | `packages/*/dist/` | Compiled JS        | Ignored    | N/A         |
| Bundle            | `bundle/`          | Distribution       | Ignored    | 7 days (CI) |
| Source maps       | `*.js.map`         | Debugging          | Ignored    | With bundle |
| Coverage          | `coverage/`        | Test coverage      | Ignored    | 7 days (CI) |
| Test results      | `junit.xml`        | CI reporting       | Ignored    | 7 days (CI) |
| Build info        | `.tsbuildinfo`     | Incremental builds | Ignored    | N/A         |

### 11.2 .gitignore Requirements

```gitignore
# Build outputs (MUST ignore)
dist/
bundle/
*.tsbuildinfo

# Test artifacts (MUST ignore)
coverage/
junit.xml
.nyc_output/

# Dependencies (MUST ignore)
node_modules/

# Environment (MUST ignore)
.env
.env.local
.env.*.local

# IDE (SHOULD ignore)
.idea/
.vscode/
*.swp
*.swo

# OS (SHOULD ignore)
.DS_Store
Thumbs.db
```

---

## 12. Monorepo Structure

### 12.1 Workspace Configuration

**In `package.json`**:

```json
{
  "workspaces": ["packages/*"]
}
```

### 12.2 Package Structure

```
project-root/
├── packages/
│   ├── cli/                 # Main CLI package
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core/                # Shared core library
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── test-utils/          # Test utilities
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── scripts/                 # Build scripts
├── integration-tests/       # E2E tests
├── bundle/                  # Output (git ignored)
├── package.json             # Root package
├── tsconfig.json            # Root TS config
└── esbuild.config.js        # Bundle config
```

### 12.3 Inter-Package Dependencies

**In `packages/cli/package.json`**:

```json
{
  "dependencies": {
    "@org/core": "file:../core"
  }
}
```

### 12.4 Build Order

TypeScript project references ensure correct build order:

**In `packages/cli/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.json",
  "references": [{ "path": "../core" }]
}
```

---

## 13. Enforcement

### 13.1 CI Validation

| Check             | Workflow  | Job      | Required    |
| ----------------- | --------- | -------- | ----------- |
| Lint              | `ci.yml`  | `lint`   | Yes         |
| Type check        | `ci.yml`  | `test`   | Yes         |
| Unit tests        | `ci.yml`  | `test`   | Yes         |
| Bundle build      | `ci.yml`  | `bundle` | Yes         |
| Bundle smoke test | `ci.yml`  | `bundle` | Yes         |
| E2E tests         | `e2e.yml` | `e2e`    | Main branch |

### 13.2 Branch Protection Rules

| Rule                  | Setting       | Rationale               |
| --------------------- | ------------- | ----------------------- |
| Require PR            | Enabled       | No direct commits       |
| Require CI pass       | `ci-gate` job | All checks must pass    |
| Require up-to-date    | Enabled       | No stale merges         |
| Dismiss stale reviews | Enabled       | Re-review after changes |
| Restrict force push   | Enabled       | Preserve history        |

### 13.3 Required Status Checks

```
Required checks before merge:
├── lint
├── test (ubuntu-latest, 20.x)
├── test (ubuntu-latest, 22.x)
├── bundle
└── ci-gate
```

---

## 14. Exceptions

### 14.1 Valid Exception Scenarios

| Scenario                  | Justification Required   | Approval            |
| ------------------------- | ------------------------ | ------------------- |
| Skip CI for docs-only     | `[skip ci]` in commit    | Automatic           |
| Extended timeout          | Performance issue ticket | Team lead           |
| Platform skip             | Known platform bug       | Issue link          |
| Version constraint change | Security/compatibility   | Architecture review |

### 14.2 Exception Documentation

```yaml
# CI EXCEPTION: STD-016 Section 5.1
# Reason: macOS builds are flaky due to runner issues
# Issue: #123
# Approved: 2025-11-29
- os: macos-latest
  node-version: '20.x'
  continue-on-error: true # Exception: flaky platform
```

### 14.3 Skip CI Patterns

```bash
# Documentation only changes
git commit -m "docs: update README [skip ci]"

# CI configuration changes (self-testing)
git commit -m "ci: update workflow [skip ci]"
```

**Note**: `[skip ci]` MUST NOT be used for code changes.

---

## 15. Quick Reference

### 15.1 Essential Commands

```bash
# Development
npm run build          # Compile TypeScript
npm run test           # Run tests
npm run lint           # Check linting
npm run typecheck      # Type validation

# Pre-commit
npm run pre-commit     # Lint-staged checks
npm run preflight      # Full validation

# Release
npm run bundle         # Create distribution
npm run release:version patch  # Bump version
```

### 15.2 CI Workflow Summary

```
Push/PR
├── lint          → ESLint, Prettier, YAML
├── test          → Build, Type check, Unit tests
├── bundle        → Create bundle, Smoke test
└── ci-gate       → Final pass/fail

Main branch
└── e2e           → Integration tests

Release (manual)
├── validate      → Version format
├── test          → Full preflight
└── release       → Publish npm + GitHub
```

### 15.3 File Checklist

| File                            | Location   | Required | Purpose               |
| ------------------------------- | ---------- | -------- | --------------------- |
| `package.json`                  | Root       | Yes      | Scripts, dependencies |
| `package-lock.json`             | Root       | Yes      | Lock file             |
| `.nvmrc`                        | Root       | Yes      | Node version          |
| `tsconfig.json`                 | Root       | Yes      | TypeScript config     |
| `esbuild.config.js`             | Root       | Yes      | Bundle config         |
| `.github/workflows/ci.yml`      | `.github/` | Yes      | Main CI               |
| `.github/workflows/release.yml` | `.github/` | Yes      | Release process       |
| `.husky/pre-commit`             | `.husky/`  | Yes      | Pre-commit hook       |
| `.gitignore`                    | Root       | Yes      | Ignored files         |
| `.prettierrc.json`              | Root       | Yes      | Formatting            |
| `eslint.config.js`              | Root       | Yes      | Linting               |

---

## 16. Traceability

### 16.1 Configuration Index

| Config ID | File                            | Section | Purpose              |
| --------- | ------------------------------- | ------- | -------------------- |
| CFG-001   | `package.json`                  | 3.1     | Build scripts        |
| CFG-002   | `esbuild.config.js`             | 4.1     | Bundle configuration |
| CFG-003   | `.github/workflows/ci.yml`      | 5.1     | Main CI workflow     |
| CFG-004   | `.github/workflows/release.yml` | 5.3     | Release workflow     |
| CFG-005   | `.husky/pre-commit`             | 6.3     | Pre-commit hook      |
| CFG-006   | `.nvmrc`                        | 7.2     | Node version         |

### 16.2 Related Standards

| Standard                  | Relationship            |
| ------------------------- | ----------------------- |
| STD-001 Naming            | Script and file naming  |
| STD-004 TypeScript Config | Extends build settings  |
| STD-007 Testing           | Test scripts and CI     |
| STD-009 Git Workflow      | Commit and branch rules |

---

## 17. Open Questions

| Question ID | Question                                    | Owner        | Status  |
| ----------- | ------------------------------------------- | ------------ | ------- |
| SQ-001      | Should we add CodeQL security scanning?     | Security     | Pending |
| SQ-002      | What bundle size threshold triggers review? | Architecture | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
