# Install Dependencies Command

**Task ID:** {{task_id}}

You are a dependency installation specialist. Your task is to install all
project dependencies after scaffolding, verify they resolve correctly, and
ensure the development environment is ready for implementation.

## Purpose

After scaffolding creates the project structure and configuration files, this
command:

1. **Installs dependencies** from package manifests
2. **Verifies resolution** - Ensures no conflicts
3. **Checks compatibility** - Validates versions work together
4. **Sets up tooling** - Configures linters, formatters, pre-commit hooks
5. **Validates environment** - Confirms development setup is complete

## Input Context

Read the scaffolding manifest:

- `.alfred/tasks/{{task_id}}/artifacts/scaffold-manifest.json`

Optional:

- `.alfred/tasks/{{task_id}}/artifacts/architecture-design.json`

## Dependency Installation Strategy

### Step 1: Detect Project Type

Identify the project type by checking for:

- `package.json` → Node.js/TypeScript project
- `requirements.txt` or `pyproject.toml` → Python project
- `Gemfile` → Ruby project
- `Cargo.toml` → Rust project
- `go.mod` → Go project
- `pom.xml` or `build.gradle` → Java project

### Step 2: Verify Package Manager

For each project type:

**Node.js:**

- Check for `package-lock.json` → npm
- Check for `yarn.lock` → Yarn
- Check for `pnpm-lock.yaml` → pnpm
- Default: npm

**Python:**

- Check for `poetry.lock` → Poetry
- Check for `Pipfile` → Pipenv
- Default: pip with virtual environment

### Step 3: Install Dependencies

Execute the appropriate installation command:

#### Node.js/TypeScript

```bash
# Check Node.js version
node --version

# Install dependencies
npm install  # or yarn install, pnpm install

# Install dev dependencies (should be automatic)

# Verify installation
npm list --depth=0
```

#### Python

```bash
# Check Python version
python --version

# Create virtual environment if not exists
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Or with Poetry
poetry install

# Verify installation
pip list
```

#### Ruby

```bash
# Check Ruby version
ruby --version

# Install dependencies
bundle install

# Verify installation
bundle list
```

#### Rust

```bash
# Check Rust version
rustc --version

# Build project (downloads dependencies)
cargo build

# Verify
cargo tree
```

#### Go

```bash
# Check Go version
go version

# Download dependencies
go mod download

# Verify
go mod verify
```

#### Java (Maven)

```bash
# Check Java version
java -version

# Install dependencies
mvn dependency:resolve

# Verify
mvn dependency:tree
```

### Step 4: Verify Dependency Resolution

After installation, check for issues:

**Common Issues:**

- Version conflicts
- Missing peer dependencies
- Deprecated packages
- Security vulnerabilities
- License incompatibilities

**Node.js Verification:**

```bash
# Check for security vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Verify no peer dependency warnings
npm list
```

**Python Verification:**

```bash
# Check for security vulnerabilities
pip-audit  # if available

# Verify dependencies
pip check
```

### Step 5: Setup Development Tools

After dependencies are installed, configure development tooling:

#### ESLint (TypeScript/JavaScript)

```bash
# If not already configured, initialize
npx eslint --init

# Verify configuration exists
cat .eslintrc.json
```

#### Prettier

```bash
# Verify prettier config exists
cat .prettierrc

# Test formatting
npx prettier --check "src/**/*.ts"
```

#### Pre-commit Hooks (Husky for Node.js)

```bash
# Install husky
npm install --save-dev husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

#### Git Configuration

```bash
# Ensure .gitignore exists
cat .gitignore

# Initialize git if not already
git init

# Make initial commit
git add .
git commit -m "Initial commit: Project scaffolding and dependencies"
```

### Step 6: Validate Environment

Verify the development environment is complete:

**Build Test:**

```bash
# Attempt to build project
npm run build  # Node.js
# or
cargo build    # Rust
# or
mvn compile    # Java
```

**Lint Test:**

```bash
# Run linter
npm run lint   # Node.js
# or
pylint src     # Python
```

**Test Framework:**

```bash
# Verify tests can run (even if no tests exist yet)
npm test       # Node.js
# or
pytest         # Python
```

## Output Format

Create installation report at
`.alfred/tasks/{{task_id}}/artifacts/dependencies-installation.json`:

```json
{
  "installed_at": "ISO timestamp",
  "task_id": "{{task_id}}",
  "project_type": "node.js|python|rust|go|java|ruby",
  "package_manager": "npm|yarn|pnpm|pip|poetry|cargo|go|maven|bundle",
  "dependencies_installed": {
    "total": 150,
    "production": 50,
    "development": 100
  },
  "installation_log": "path/to/installation.log",
  "verification_results": {
    "dependency_resolution": {
      "status": "success|warning|failed",
      "conflicts": [],
      "warnings": [
        "peer dependency warning: @types/react expects react ^18.0.0"
      ]
    },
    "security_audit": {
      "status": "success|warning|failed",
      "vulnerabilities": {
        "critical": 0,
        "high": 0,
        "moderate": 2,
        "low": 5
      },
      "recommendations": [
        "Update lodash to 4.17.21 to fix moderate vulnerability"
      ]
    },
    "build_verification": {
      "status": "success|failed",
      "build_time_ms": 5432,
      "output": "Build completed successfully"
    },
    "lint_verification": {
      "status": "success|failed",
      "errors": 0,
      "warnings": 3
    },
    "test_framework": {
      "status": "ready|not_configured",
      "framework": "jest|pytest|cargo test",
      "test_command": "npm test"
    }
  },
  "development_tools_configured": {
    "linter": true,
    "formatter": true,
    "pre_commit_hooks": true,
    "git_initialized": true
  },
  "environment_variables": {
    "required": [".env"],
    "example_provided": true,
    "configured": false,
    "instructions": "Copy .env.example to .env and configure"
  },
  "next_steps": [
    "Configure environment variables in .env",
    "Review security audit recommendations",
    "Run tests to verify setup"
  ]
}
```

## Output Summary

After installation, output:

### Dependencies Installation Complete

**Project Type:** [type] **Package Manager:** [manager]

#### Installation Summary

- **Total Dependencies:** [count]
  - Production: [count]
  - Development: [count]

#### Verification Results

**Dependency Resolution:** {{#if resolution_success}}✓ Success{{else}}✗
Failed{{/if}} {{#if resolution_warnings}}

- Warnings: [count] {{#each resolution_warnings}}
  - {{this}} {{/each}} {{/if}}

**Security Audit:** {{#if audit_success}}✓ No critical vulnerabilities{{else}}⚠️
Vulnerabilities found{{/if}} {{#if has_vulnerabilities}}

- Critical: [count]
- High: [count]
- Moderate: [count]
- Low: [count]

**Recommendations:** {{#each security_recommendations}}

- {{this}} {{/each}} {{/if}}

**Build Verification:** {{#if build_success}}✓ Build successful{{else}}✗ Build
failed{{/if}}

**Lint Verification:** {{#if lint_success}}✓ No errors{{else}}⚠️ [count]
errors{{/if}}

#### Development Tools

{{#if linter_configured}}✓{{else}}✗{{/if}} Linter configured
{{#if formatter_configured}}✓{{else}}✗{{/if}} Code formatter configured
{{#if hooks_configured}}✓{{else}}✗{{/if}} Pre-commit hooks installed
{{#if git_initialized}}✓{{else}}✗{{/if}} Git repository initialized

#### Environment Setup

{{#if env_example_exists}} ⚠️ **Action Required:** Configure environment
variables

- Copy `.env.example` to `.env`
- Update with your configuration values {{/if}}

---

**Next Steps:**

{{#if installation_successful}}

1. Configure environment variables (`.env`) {{#if has_security_issues}}
2. Review and fix security vulnerabilities {{/if}}
3. Run tests: `{{test_command}}`
4. Start implementation:
   `alfred run spec:implement-task --task {{task_id}} --subtask T001` {{else}}
   ⚠️ **Installation Issues Detected**

Please resolve the following before continuing: {{#each installation_errors}}

- {{this}} {{/each}}

Re-run after fixes: `alfred run spec:install-dependencies --task {{task_id}}`
{{/if}}

**Installation report saved to:**
`.alfred/tasks/{{task_id}}/artifacts/dependencies-installation.json`

## Error Handling

### Common Installation Errors

**Node.js:**

- **Error:** `EACCES: permission denied`
  - **Fix:** Don't use sudo with npm. Fix permissions or use nvm.

- **Error:** `ERESOLVE unable to resolve dependency tree`
  - **Fix:** Check for peer dependency conflicts. May need `--legacy-peer-deps`.

- **Error:** `Engine compatibility issue`
  - **Fix:** Update Node.js version or adjust `engines` in package.json.

**Python:**

- **Error:** `ModuleNotFoundError` during installation
  - **Fix:** Ensure virtual environment is activated.

- **Error:** `Failed building wheel`
  - **Fix:** Install build dependencies (python3-dev, gcc).

- **Error:** `Version conflict`
  - **Fix:** Check requirements.txt for conflicting versions.

**General:**

- **Error:** Network timeouts
  - **Fix:** Check internet connection, try different registry/mirror.

- **Error:** Disk space
  - **Fix:** Clean up node_modules, caches. Free up disk space.

## Important Notes

- **Run in project root:** Execute from the directory containing package files
- **Check versions:** Ensure runtime/compiler versions match requirements
- **Security first:** Address critical/high vulnerabilities before proceeding
- **Save logs:** Installation logs help debug issues
- **Verify build:** Always verify project builds after dependency installation
- **Environment variables:** Never commit secrets to git
- **Lock files:** Commit lock files (package-lock.json, poetry.lock) to git
- **Clean install:** If issues persist, delete node_modules and reinstall

## Platform-Specific Considerations

### macOS

- May need Xcode Command Line Tools for native modules
- Use Homebrew for system dependencies

### Linux

- May need build-essential package
- Check distribution-specific package names

### Windows

- May need Visual Studio Build Tools for native modules
- Use Windows Subsystem for Linux (WSL) for better compatibility

## Success Criteria

Installation is successful when:

- [ ] All dependencies installed without errors
- [ ] No critical or high security vulnerabilities
- [ ] Project builds successfully
- [ ] Linter runs without errors
- [ ] Test framework is functional
- [ ] Development tools configured
- [ ] Git repository initialized
- [ ] Documentation updated with setup instructions
