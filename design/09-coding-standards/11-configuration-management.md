# Configuration Management

Reference: `design/09-coding-standards/standards-reference/11-configuration-management.md`

<configuration_rules>

## Guiding Principles

Follow these principles to ensure configuration is predictable and maintainable:

| Principle           | Why It Matters                                                        |
| ------------------- | --------------------------------------------------------------------- |
| **Reproducibility** | Same config produces identical behavior across environments           |
| **Hierarchy**       | Clear precedence prevents "where did this value come from?" debugging |
| **Type Safety**     | Schema validation catches errors at startup, not runtime              |
| **Explicitness**    | No implicit behaviors; all settings documented with defaults          |
| **Separation**      | System, user, and project configs are isolated and mergeable          |

## File Formats

### JSON (Primary)

Use JSON with schema for application settings. Schema validation catches typos and invalid values immediately.

- **Location**: Project root or `.flowmaster/` directory
- **Required structure**: Include `$schema` reference and top-level keys `general`, `model`, `tools`

  ```json
  {
    "$schema": "./schemas/settings.schema.json",
    "general": { ... },
    "model": { ... },
    "tools": { ... }
  }
  ```

- **JSONC support**: Parse JSON with comments using `strip-json-comments` before `JSON.parse()`. Comments help users document their config choices.

- **Required settings**:
  | Setting | Purpose | User-Modifiable |
  |---------|---------|-----------------|
  | `$schema` | Schema validation reference | No |
  | `general` | Core application settings | Yes |
  | `model` | LLM provider configuration | Yes |
  | `tools` | Tool permissions and limits | Yes |

- **Keep config files portable**:
  - ✓ Use `$API_KEY` environment variable references for secrets
  - ✓ Use relative paths or `~` for user paths
  - ✓ Use platform conditionals when values differ by OS
  - ✗ Inline secrets (security risk, can't rotate without code change)
  - ✗ Absolute paths like `/Users/john/...` (breaks on other machines)
  - ✗ Platform-specific values without conditionals (breaks cross-platform)

### YAML (Secondary)

Use `.flowmaster/config.yaml` for complex nested configurations and workflow definitions. YAML is more readable for deeply nested structures and supports multi-line strings naturally.

**When to use each format**:

| Use YAML                  | Use JSON                  |
| ------------------------- | ------------------------- |
| Workflow definitions      | Application settings      |
| Multi-line strings        | Simple key-value pairs    |
| Complex nested structures | Schema-validated configs  |
| Human-edited frequently   | Programmatically modified |

### Environment Files

Use `.env` and/or `.flowmaster/.env` for environment-specific secrets and overrides. Never commit these files because they contain machine-specific or secret values.

- **`.env.example` requirement**: If `.env` is used, provide `.env.example` documenting all variables so new developers know what to configure.
  ```bash
  # .env.example
  FLOWMASTER_API_KEY=           # Required: Get from console.anthropic.com
  FLOWMASTER_API_URL=           # Optional: Default https://api.anthropic.com
  FLOWMASTER_DEBUG=false        # Optional: Enable debug logging
  FLOWMASTER_EXPERIMENTAL=false # Optional: Enable experimental features
  ```

## Configuration Hierarchy

### Loading Precedence (lowest → highest)

Later sources override earlier ones. This allows system defaults to be overridden by user preferences, which can be overridden by project-specific settings, which can be overridden by CLI flags.

```
hardcoded defaults → system defaults → user settings → project settings → system override → environment variables → CLI arguments
```

### Platform File Locations

Use OS-standard paths so users know where to find config files:

| Scope            | Linux                           | macOS                                                   | Windows                                   |
| ---------------- | ------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| System Defaults  | `/etc/flowmaster/defaults.json` | `/Library/Application Support/FlowMaster/defaults.json` | `C:\ProgramData\FlowMaster\defaults.json` |
| User Settings    | `~/.flowmaster/settings.json`   | `~/.flowmaster/settings.json`                           | `%APPDATA%\FlowMaster\settings.json`      |
| Project Settings | `.flowmaster/settings.json`     | `.flowmaster/settings.json`                             | `.flowmaster\settings.json`               |
| System Override  | `/etc/flowmaster/settings.json` | `/Library/Application Support/FlowMaster/settings.json` | `C:\ProgramData\FlowMaster\settings.json` |

### `.env` Discovery Order

Search in this order (first found wins) to allow project-specific overrides while falling back to user defaults:

1. `.flowmaster/.env` (project-specific)
2. `.env` (project root)
3. Parent directories (walk up)
4. `~/.flowmaster/.env` (user fallback)
5. `~/.env` (home fallback)

## Settings Schema

### Schema Definition

Define all settings in a schema with metadata. This enables validation, documentation generation, and UI rendering from a single source of truth.

Each setting needs:

- `schema`: Zod validator for type checking
- `label`: Human-readable name for UI
- `category`: Grouping for settings UI
- `default`: Fallback value (also used for type inference)
- `description`: Documentation for users
- `requiresRestart`: Whether changing needs app restart
- `mergeStrategy`: How to combine values from multiple sources

### Merge Strategies

Different setting types need different merge behaviors when combining config from multiple sources:

| Strategy        | Value           | Use When                                   | Behavior                    |
| --------------- | --------------- | ------------------------------------------ | --------------------------- |
| `REPLACE`       | `replace`       | Simple values (strings, numbers, booleans) | Later value wins            |
| `CONCAT`        | `concat`        | Ordered lists where sequence matters       | Append arrays               |
| `UNION`         | `union`         | Permission/feature lists                   | Merge arrays uniquely       |
| `SHALLOW_MERGE` | `shallow_merge` | Plugin configs with independent keys       | Merge top-level object keys |

### Type Inference

Infer `Settings` types from schema defaults using recursive type inference. Maintain a flattened dot-path key type for type-safe access:

- ✓ `general.vimMode`, `model.name`, `tools.timeout`, `mcpServers`

### MCP Server Settings

Represent `mcpServers` as a record mapping server names to their configuration. This allows multiple MCP servers with different settings.

```typescript
mcpServers: Record<
  string,
  {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }
>;
```

## Environment Variables

### Naming Convention

Use consistent prefixes so environment variables are discoverable and don't conflict with other applications:

| Category          | Prefix                   | Example                          |
| ----------------- | ------------------------ | -------------------------------- |
| Core settings     | `FLOWMASTER_`            | `FLOWMASTER_DEBUG`               |
| API configuration | `FLOWMASTER_API_`        | `FLOWMASTER_API_KEY`             |
| Feature flags     | `FLOWMASTER_ENABLE_`     | `FLOWMASTER_ENABLE_EXPERIMENTAL` |
| Provider-specific | `FLOWMASTER_{PROVIDER}_` | `FLOWMASTER_ANTHROPIC_API_KEY`   |

### Variable Substitution

Support `$VAR_NAME` and `${VAR_NAME}` syntax in config values. This allows config files to reference secrets without containing them.

- **Pattern**: `\$\{?([A-Z_][A-Z0-9_]*)\}?`
- **Recursive resolution**: Resolve in strings, arrays, and objects
- **Circular prevention**: Use a `WeakSet` to detect cycles
- **Fallback**: Leave unresolved references unchanged (don't error)
- **Null handling**: Treat `null`/`undefined` as-is

### Subprocess Environment Filtering

Exclude these variables when spawning subprocesses to prevent debug settings from leaking:

- `DEBUG`, `DEBUG_MODE`, `NODE_OPTIONS`, `NODE_ENV`

## Settings Loading

### Loader Behavior

Load settings across scopes (`system-defaults`, `user`, `project`, `system-override`), parse JSONC, and merge in priority order.

- **Defaults source**: Derive "hardcoded defaults" from schema default values using `extractDefaults(settingsSchema)`, then overlay file/env/CLI sources
- **Parse errors**: Throw an error that includes the file path so users know which file to fix
  - ✓ `Failed to parse settings file: ~/.flowmaster/settings.json: Unexpected token...`
  - ✗ `JSON parse error` (unhelpful, doesn't say which file)

### Deep Merge Behavior

When merging config from multiple sources:

- Later sources override earlier
- Ignore incoming `undefined` values (don't overwrite with nothing)
- `CONCAT`: Append arrays `[...existing, ...incoming]`
- `UNION`: Merge arrays uniquely `[...new Set([...existing, ...incoming])]`
- `SHALLOW_MERGE`: Merge top-level keys when both are plain objects

## Configuration Access

### Dependency Injection Pattern

Use dependency injection via a `Config` class. This makes dependencies explicit and enables testing.

- **Store**: `settings`, `projectRoot`, `cliArgs`
- **CLI override**: Allow CLI args to override settings (e.g., `--model` overrides `model.name`)
- **Tool allowlist logic**: Excluded wins; empty `allowed` means "all allowed"

```typescript
// ✓ Pass config via constructor
const toolRegistry = new ToolRegistry(config);
const agentManager = new AgentManager(config, toolRegistry);

// ✗ Global singleton access
const config = Config.getInstance(); // NEVER do this
```

### Propagation

Instantiate `Config` once per session at application startup. Pass it via constructors to all components that need configuration.

### Schema Utilities

Provide memoized utilities for schema access:

- `getSettingDefinition(key)`: Get metadata for a dot-path key
- `requiresRestart(key)`: Check if changing needs restart
- `getDefaultValue(key)`: Get schema default
- `getEffectiveValue(key, settings)`: Get value with fallback to default

## Validation

Validate settings against schema at startup. Collect all errors (don't stop at first) and fail fast with a clear message listing all failures.

```typescript
// ✓ Clear error with all failures
throw new Error(
  `Invalid configuration:\n${errors
    .map((e) => `  - ${e.path}: ${e.message} (got: ${e.value})`)
    .join('\n')}`
);
```

Error structure: `{ path: string, message: string, value: unknown }`

## Migration

Migrate legacy keys using an explicit map. This allows config format to evolve while preserving user settings.

- **Unmapped keys**: Preserved as-is
- **Mapped keys**: Rewritten to new dot paths
- **Removed keys**: Map to `null`

Example legacy key mappings:

```typescript
const LEGACY_KEYS = {
  vim_mode: 'general.vimMode',
  disable_auto_update: 'general.disableAutoUpdate',
  checkpoint_enabled: 'general.checkpointing.enabled',
  checkpoint_interval: 'general.checkpointing.intervalSeconds',
  model: 'model.name',
  max_turns: 'model.maxSessionTurns',
  allowed_tools: 'tools.allowed',
  tool_timeout_ms: 'tools.timeout',
  legacy_mode: null, // Removed, no longer supported
};
```

</configuration_rules>

## Anti-Patterns to Avoid

Use the correct patterns instead of these common mistakes:

| Anti-Pattern                              | Why It's Bad                      | Use Instead                           |
| ----------------------------------------- | --------------------------------- | ------------------------------------- |
| Singleton config (`Config.getInstance()`) | Hidden dependency, hard to test   | Constructor injection                 |
| Global `process.env` access               | Scattered env reads, hard to mock | Centralized env resolution at startup |
| Hardcoded paths                           | Non-portable                      | Platform-specific path resolution     |
| Inline secrets in JSON                    | Security risk, can't rotate       | Environment variable references       |
| Mutable config objects                    | Unexpected changes mid-session    | Immutable config, reload to change    |
| Dynamic `require()` for config            | Hard to analyze, security risk    | Static imports with validation        |

## Secrets Handling

Keep secrets out of version control and config files:

- ✓ Use `$API_KEY` references in config, actual values in `.env`
- ✓ Add `.env` and `.env.local` to `.gitignore`
- ✗ Hardcode secrets in `.flowmaster/*.json`

**CI detection pattern**: `(api_key|password|secret|token)\s*[:=]\s*['"][^$]`

## Preferences

- **Document non-standard merge strategies**: Add inline comments explaining custom merge behavior so future readers understand the intent.

## Exceptions

When standard patterns don't fit:

| Exception                   | Valid Scenario               | Required Documentation        |
| --------------------------- | ---------------------------- | ----------------------------- |
| Custom merge strategy       | Non-standard data structures | Comment explaining behavior   |
| Non-standard platform paths | Non-standard installs        | Environment variable override |
| Relaxed validation rules    | Legacy compatibility         | Migration plan with deadline  |

**Exception documentation format**:

```typescript
// CONFIGURATION EXCEPTION: Custom merge for plugin configs
// Reason: Plugins define their own nested structure
// Impact: Plugin configs merge at depth 2 instead of depth 1
// Migration: Will standardize in v3.0 (Q2 2025)
// Approved: 2025-01-15
```

## Verification Checklist

When reviewing configuration code:

**File Structure**

- [ ] Primary settings use JSON with `$schema` reference
- [ ] Top-level keys are `general`, `model`, `tools` (plus `mcpServers` if needed)
- [ ] JSONC parsing uses `strip-json-comments` before `JSON.parse`
- [ ] YAML used only for workflows and complex nested structures
- [ ] `.env.example` exists if `.env` is used

**Security**

- [ ] No secrets in JSON files (only `$VAR` references)
- [ ] `.env` and `.env.local` in `.gitignore`
- [ ] No absolute paths in committed config

**Schema & Types**

- [ ] All settings defined in schema with full metadata
- [ ] Each setting has `schema`, `label`, `category`, `default`, `description`, `requiresRestart`, `mergeStrategy`
- [ ] Types inferred from schema (no manual duplication)
- [ ] Merge strategy appropriate for data type

**Loading & Access**

- [ ] Precedence order: defaults → system → user → project → override → env → CLI
- [ ] Platform-specific paths use OS-standard locations
- [ ] Config passed via constructor injection (no singletons)
- [ ] Parse errors include file path in message

**Validation**

- [ ] Schema validation runs at startup
- [ ] All errors collected before failing (not fail-fast per error)
- [ ] Error messages include path, message, and actual value

**CI/Automation**

- [ ] `scripts/validate-config.sh` checks `$schema` presence, requires `.env.example` if `.env` exists, validates JSON syntax (JSONC stripped before parsing)
- [ ] `.github/workflows/validate-config.yml` runs on push/PR, uses Node 20, runs `npm run validate:config`, scans for hardcoded secrets
- [ ] `.husky/pre-commit` blocks `.env`/`.env.local` commits, validates staged `*.json` using `strip-json-comments` + `JSON.parse`
