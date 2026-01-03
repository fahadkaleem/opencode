# Configuration Management - Coding Standard

> **Standard ID**: STD-011
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: Configuration files, environment variables, settings loading, and runtime configuration
> **Enforcement**: Configuration Files + CI Validation
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - Variable and constant naming
> - [TypeScript Configuration](./typescript-config.md) - Compiler settings
> - [Security Practices](./security-practices.md) - Secrets handling

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory configuration management standards for TypeScript/Node.js CLI applications. These standards ensure consistent, type-safe, and maintainable configuration across all environments.

### 1.2 Scope

**Applies to**:

- Application settings files (JSON, YAML)
- Environment variable handling
- Configuration loading and merging
- Runtime configuration access
- Default value management
- Configuration validation

**Does NOT apply to**:

- Build tool configuration (see Build & CI/CD Standards)
- TypeScript compiler settings (see TypeScript Configuration)
- Package dependencies (see Dependency Management)

### 1.3 Enforcement Level

| Level      | Meaning                      | Mechanism                    |
| ---------- | ---------------------------- | ---------------------------- |
| **MUST**   | Exact configuration required | CI validation, schema checks |
| **SHOULD** | Recommended setting          | Code review                  |
| **MAY**    | Optional setting             | Team discretion              |

---

## 2. Guiding Principles

| Principle       | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| Reproducibility | Same configuration produces identical behavior across environments           |
| Hierarchy       | Configuration sources have clear precedence; higher priority overrides lower |
| Type Safety     | All configuration is validated against schemas with full TypeScript typing   |
| Explicitness    | No implicit behaviors; all settings documented with defaults                 |
| Separation      | System, user, and project configurations are isolated and mergeable          |

---

## 3. Configuration File Formats

### 3.1 Primary Format: JSON with Schema

**File Location**: Project root or `.flowmaster/` directory
**Purpose**: Primary application settings
**Modification**: User-editable with schema validation

```json
{
  "$schema": "./schemas/settings.schema.json",

  "general": {
    "vimMode": false,
    "disableAutoUpdate": false,
    "checkpointing": {
      "enabled": true,
      "intervalSeconds": 300
    }
  },

  "model": {
    "name": "claude-sonnet-4-20250514",
    "maxSessionTurns": 50,
    "temperature": 0.7
  },

  "tools": {
    "allowed": ["shell", "file_read", "file_write"],
    "excluded": [],
    "timeout": 30000
  }
}
```

#### 3.1.1 JSON with Comments Support

Configuration files MUST support JSON with comments (JSONC). Use `strip-json-comments` or equivalent for parsing:

```typescript
import stripJsonComments from 'strip-json-comments';

function parseConfigFile(content: string): unknown {
  const stripped = stripJsonComments(content);
  return JSON.parse(stripped);
}
```

#### 3.1.2 Required Settings

| Setting   | Purpose                     | Modifiable |
| --------- | --------------------------- | ---------- |
| `$schema` | Schema validation reference | No         |
| `general` | Core application settings   | Yes        |
| `model`   | LLM provider configuration  | Yes        |
| `tools`   | Tool permissions and limits | Yes        |

#### 3.1.3 Forbidden Patterns

| Pattern                                       | Reason                                   |
| --------------------------------------------- | ---------------------------------------- |
| Inline secrets                                | Security risk; use environment variables |
| Absolute paths                                | Non-portable across systems              |
| Platform-specific values without conditionals | Breaks cross-platform compatibility      |

---

### 3.2 Secondary Format: YAML

**File Location**: `.flowmaster/config.yaml`
**Purpose**: Complex nested configurations, workflow definitions
**Modification**: User-editable

```yaml
# .flowmaster/config.yaml
workflows:
  code_review:
    enabled: true
    severity_threshold: 'HIGH'
    max_comments: 10

  documentation:
    enabled: false

ignore_patterns:
  - '*.test.ts'
  - 'node_modules/**'
  - 'dist/**'
```

**When to Use YAML vs JSON**:

| Use YAML                  | Use JSON                  |
| ------------------------- | ------------------------- |
| Workflow definitions      | Application settings      |
| Multi-line strings        | Simple key-value pairs    |
| Complex nested structures | Schema-validated configs  |
| Human-edited frequently   | Programmatically modified |

---

### 3.3 Environment Files

**File Location**: `.env`, `.flowmaster/.env`
**Purpose**: Environment-specific overrides and secrets
**Modification**: Per-environment, never committed

```bash
# .env.example
# Copy to .env and fill in values

# ============================================================
# API Configuration
# ============================================================

# Primary API key (Required)
# Get from: https://console.example.com/api-keys
FLOWMASTER_API_KEY=

# API base URL (Optional)
# Default: https://api.example.com
FLOWMASTER_API_URL=

# ============================================================
# Feature Flags
# ============================================================

# Enable debug logging (Optional)
# Default: false
FLOWMASTER_DEBUG=false

# Enable experimental features (Optional)
# Default: false
FLOWMASTER_EXPERIMENTAL=false
```

---

## 4. Configuration Hierarchy

### 4.1 Loading Order (Lowest to Highest Priority)

```
┌─────────────────────────────────────────────────────────────────┐
│  Priority 7: Command-line Arguments        (highest priority)  │
├─────────────────────────────────────────────────────────────────┤
│  Priority 6: Environment Variables                              │
├─────────────────────────────────────────────────────────────────┤
│  Priority 5: System Override File                               │
├─────────────────────────────────────────────────────────────────┤
│  Priority 4: Project Settings (.flowmaster/settings.json)      │
├─────────────────────────────────────────────────────────────────┤
│  Priority 3: User Settings (~/.flowmaster/settings.json)       │
├─────────────────────────────────────────────────────────────────┤
│  Priority 2: System Defaults File                               │
├─────────────────────────────────────────────────────────────────┤
│  Priority 1: Hardcoded Application Defaults  (lowest priority) │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 File Locations by Platform

| Scope            | Linux                           | macOS                                                   | Windows                                   |
| ---------------- | ------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| System Defaults  | `/etc/flowmaster/defaults.json` | `/Library/Application Support/FlowMaster/defaults.json` | `C:\ProgramData\FlowMaster\defaults.json` |
| User Settings    | `~/.flowmaster/settings.json`   | `~/.flowmaster/settings.json`                           | `%APPDATA%\FlowMaster\settings.json`      |
| Project Settings | `.flowmaster/settings.json`     | `.flowmaster/settings.json`                             | `.flowmaster\settings.json`               |
| System Override  | `/etc/flowmaster/settings.json` | `/Library/Application Support/FlowMaster/settings.json` | `C:\ProgramData\FlowMaster\settings.json` |

### 4.3 Environment File Search Order

```typescript
// Search order for .env files (first found wins)
const ENV_FILE_SEARCH_ORDER = [
  '.flowmaster/.env', // Project-specific
  '.env', // Project root
  // Then search parent directories...
  '~/.flowmaster/.env', // User fallback
  '~/.env', // Home fallback
];
```

---

## 5. Settings Schema

### 5.1 Schema Definition Pattern

All settings MUST be defined in a schema with metadata:

```typescript
// src/config/settingsSchema.ts

import { z } from 'zod';

/**
 * Merge strategies for combining configuration from multiple sources.
 */
export enum MergeStrategy {
  /** Replace old value with new value (default) */
  REPLACE = 'replace',
  /** Concatenate arrays */
  CONCAT = 'concat',
  /** Merge arrays with unique values only */
  UNION = 'union',
  /** Shallow merge objects */
  SHALLOW_MERGE = 'shallow_merge',
}

/**
 * Metadata for a single setting definition.
 */
interface SettingDefinition<T> {
  /** Zod schema for validation */
  schema: z.ZodType<T>;
  /** Human-readable label */
  label: string;
  /** Category for grouping in UI */
  category: string;
  /** Default value */
  default: T;
  /** Description for documentation */
  description: string;
  /** Whether changing requires restart */
  requiresRestart: boolean;
  /** How to merge with parent configs */
  mergeStrategy: MergeStrategy;
}
```

### 5.2 Complete Settings Schema Example

```typescript
// src/config/settingsSchema.ts

export const settingsSchema = {
  general: {
    vimMode: {
      schema: z.boolean(),
      label: 'Vim Mode',
      category: 'General',
      default: false,
      description: 'Enable vim-style keybindings',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.REPLACE,
    },
    disableAutoUpdate: {
      schema: z.boolean(),
      label: 'Disable Auto-Update',
      category: 'General',
      default: false,
      description: 'Prevent automatic version updates',
      requiresRestart: true,
      mergeStrategy: MergeStrategy.REPLACE,
    },
    checkpointing: {
      enabled: {
        schema: z.boolean(),
        label: 'Enable Checkpointing',
        category: 'General',
        default: true,
        description: 'Save state periodically for crash recovery',
        requiresRestart: false,
        mergeStrategy: MergeStrategy.REPLACE,
      },
      intervalSeconds: {
        schema: z.number().min(60).max(3600),
        label: 'Checkpoint Interval',
        category: 'General',
        default: 300,
        description: 'Seconds between automatic checkpoints',
        requiresRestart: false,
        mergeStrategy: MergeStrategy.REPLACE,
      },
    },
  },

  model: {
    name: {
      schema: z.string(),
      label: 'Model Name',
      category: 'Model',
      default: 'claude-sonnet-4-20250514',
      description: 'LLM model identifier',
      requiresRestart: true,
      mergeStrategy: MergeStrategy.REPLACE,
    },
    maxSessionTurns: {
      schema: z.number().min(-1),
      label: 'Max Session Turns',
      category: 'Model',
      default: -1,
      description: 'Maximum conversation turns (-1 for unlimited)',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.REPLACE,
    },
    temperature: {
      schema: z.number().min(0).max(2),
      label: 'Temperature',
      category: 'Model',
      default: 0.7,
      description: 'Model creativity (0=deterministic, 2=creative)',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.REPLACE,
    },
  },

  tools: {
    allowed: {
      schema: z.array(z.string()),
      label: 'Allowed Tools',
      category: 'Tools',
      default: ['shell', 'file_read', 'file_write'],
      description: 'List of tools the agent can use',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.UNION,
    },
    excluded: {
      schema: z.array(z.string()),
      label: 'Excluded Tools',
      category: 'Tools',
      default: [],
      description: 'Tools explicitly disabled',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.UNION,
    },
    timeout: {
      schema: z.number().min(1000),
      label: 'Tool Timeout',
      category: 'Tools',
      default: 30000,
      description: 'Maximum execution time in milliseconds',
      requiresRestart: false,
      mergeStrategy: MergeStrategy.REPLACE,
    },
  },

  mcpServers: {
    schema: z.record(
      z.string(),
      z.object({
        command: z.string(),
        args: z.array(z.string()).optional(),
        env: z.record(z.string(), z.string()).optional(),
      })
    ),
    label: 'MCP Servers',
    category: 'MCP',
    default: {},
    description: 'Model Context Protocol server configurations',
    requiresRestart: true,
    mergeStrategy: MergeStrategy.SHALLOW_MERGE,
  },
} as const;

/** Inferred TypeScript type from schema */
export type Settings = InferSettingsType<typeof settingsSchema>;
```

### 5.3 Type Inference from Schema

```typescript
// src/config/settingsTypes.ts

/**
 * Infer TypeScript type from settings schema.
 * Extracts the default value types recursively.
 */
type InferSettingsType<T> = {
  [K in keyof T]: T[K] extends { default: infer D }
    ? D
    : T[K] extends object
      ? InferSettingsType<T[K]>
      : never;
};

/**
 * Flattened setting key type (e.g., 'general.vimMode').
 */
type FlatSettingKey =
  | 'general.vimMode'
  | 'general.disableAutoUpdate'
  | 'general.checkpointing.enabled'
  | 'general.checkpointing.intervalSeconds'
  | 'model.name'
  | 'model.maxSessionTurns'
  | 'model.temperature'
  | 'tools.allowed'
  | 'tools.excluded'
  | 'tools.timeout'
  | 'mcpServers';
```

---

## 6. Environment Variable Handling

### 6.1 Naming Convention

| Category          | Prefix                   | Example                          |
| ----------------- | ------------------------ | -------------------------------- |
| Core settings     | `FLOWMASTER_`            | `FLOWMASTER_DEBUG`               |
| API configuration | `FLOWMASTER_API_`        | `FLOWMASTER_API_KEY`             |
| Feature flags     | `FLOWMASTER_ENABLE_`     | `FLOWMASTER_ENABLE_EXPERIMENTAL` |
| Provider-specific | `FLOWMASTER_{PROVIDER}_` | `FLOWMASTER_ANTHROPIC_API_KEY`   |

### 6.2 Environment Variable Resolution

Settings values MUST support environment variable substitution:

```typescript
// src/utils/envVarResolver.ts

const ENV_VAR_PATTERN = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;

/**
 * Resolves environment variables in a string.
 * Supports both $VAR_NAME and ${VAR_NAME} syntax.
 *
 * @param value - String potentially containing env var references
 * @returns String with env vars replaced by their values
 *
 * @example
 * resolveEnvVarsInString('Token: $API_KEY')
 * // Returns: 'Token: sk-abc123' (if API_KEY=sk-abc123)
 *
 * @example
 * resolveEnvVarsInString('URL: ${BASE_URL}/api')
 * // Returns: 'URL: https://example.com/api'
 */
export function resolveEnvVarsInString(value: string): string {
  return value.replace(ENV_VAR_PATTERN, (match, varName) => {
    const envValue = process.env[varName];
    return envValue !== undefined ? envValue : match;
  });
}

/**
 * Recursively resolves environment variables in an object.
 * Handles nested objects and arrays.
 *
 * @param obj - Object with potential env var references
 * @param seen - WeakSet to prevent circular references
 * @returns Object with all env vars resolved
 */
export function resolveEnvVarsInObject<T>(obj: T, seen: WeakSet<object> = new WeakSet()): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return resolveEnvVarsInString(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveEnvVarsInObject(item, seen)) as T;
  }

  if (typeof obj === 'object') {
    // Prevent circular reference infinite loops
    if (seen.has(obj)) {
      return obj;
    }
    seen.add(obj);

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveEnvVarsInObject(value, seen);
    }
    return result as T;
  }

  return obj;
}
```

### 6.3 Excluded Environment Variables

Some environment variables MUST NOT be passed to subprocesses:

```typescript
const EXCLUDED_ENV_VARS = new Set(['DEBUG', 'DEBUG_MODE', 'NODE_OPTIONS', 'NODE_ENV']);

function filterEnvForSubprocess(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const filtered: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (!EXCLUDED_ENV_VARS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}
```

---

## 7. Configuration Loading

### 7.1 Settings Loader

```typescript
// src/config/settingsLoader.ts

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import stripJsonComments from 'strip-json-comments';
import { settingsSchema, type Settings } from './settingsSchema.js';
import { resolveEnvVarsInObject } from '../utils/envVarResolver.js';
import { customDeepMerge } from '../utils/deepMerge.js';

/**
 * Configuration scope identifiers.
 */
export enum ConfigScope {
  SYSTEM_DEFAULTS = 'system-defaults',
  USER = 'user',
  PROJECT = 'project',
  SYSTEM_OVERRIDE = 'system-override',
}

/**
 * Represents a loaded settings file with its source.
 */
export interface SettingsFile {
  scope: ConfigScope;
  path: string;
  settings: Partial<Settings>;
  exists: boolean;
}

/**
 * Container for all loaded settings across scopes.
 */
export class LoadedSettings {
  constructor(
    private readonly files: Map<ConfigScope, SettingsFile>,
    private readonly mergedSettings: Settings
  ) {}

  /**
   * Get settings file for a specific scope.
   */
  forScope(scope: ConfigScope): SettingsFile | undefined {
    return this.files.get(scope);
  }

  /**
   * Get fully merged settings (all scopes combined).
   */
  get merged(): Settings {
    return this.mergedSettings;
  }

  /**
   * Update a setting value in a specific scope.
   */
  async setValue(scope: ConfigScope, key: string, value: unknown): Promise<void> {
    const file = this.files.get(scope);
    if (!file) {
      throw new Error(`Cannot write to scope: ${scope}`);
    }
    // Implementation saves to file...
  }
}

/**
 * Load all configuration files and merge them.
 *
 * @param projectRoot - Root directory of the project
 * @returns LoadedSettings with all scopes merged
 */
export async function loadSettings(projectRoot: string): Promise<LoadedSettings> {
  const files = new Map<ConfigScope, SettingsFile>();

  // 1. Load hardcoded defaults from schema
  const defaults = extractDefaults(settingsSchema);

  // 2. Load system defaults
  const systemDefaultsPath = getSystemDefaultsPath();
  const systemDefaults = await loadSettingsFile(systemDefaultsPath, ConfigScope.SYSTEM_DEFAULTS);
  files.set(ConfigScope.SYSTEM_DEFAULTS, systemDefaults);

  // 3. Load user settings
  const userPath = join(homedir(), '.flowmaster', 'settings.json');
  const userSettings = await loadSettingsFile(userPath, ConfigScope.USER);
  files.set(ConfigScope.USER, userSettings);

  // 4. Load project settings
  const projectPath = join(projectRoot, '.flowmaster', 'settings.json');
  const projectSettings = await loadSettingsFile(projectPath, ConfigScope.PROJECT);
  files.set(ConfigScope.PROJECT, projectSettings);

  // 5. Load system override
  const systemOverridePath = getSystemOverridePath();
  const systemOverride = await loadSettingsFile(systemOverridePath, ConfigScope.SYSTEM_OVERRIDE);
  files.set(ConfigScope.SYSTEM_OVERRIDE, systemOverride);

  // 6. Merge all settings in priority order
  const merged = customDeepMerge(
    defaults,
    systemDefaults.settings,
    userSettings.settings,
    projectSettings.settings,
    systemOverride.settings
  );

  // 7. Resolve environment variables
  const resolved = resolveEnvVarsInObject(merged);

  return new LoadedSettings(files, resolved as Settings);
}

/**
 * Load and parse a single settings file.
 */
async function loadSettingsFile(filePath: string, scope: ConfigScope): Promise<SettingsFile> {
  if (!existsSync(filePath)) {
    return { scope, path: filePath, settings: {}, exists: false };
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const stripped = stripJsonComments(content);
    const parsed = JSON.parse(stripped);

    return { scope, path: filePath, settings: parsed, exists: true };
  } catch (error) {
    throw new Error(`Failed to parse settings file: ${filePath}: ${error}`);
  }
}
```

### 7.2 Deep Merge with Strategies

```typescript
// src/utils/deepMerge.ts

import { MergeStrategy } from '../config/settingsSchema.js';

/**
 * Merge multiple objects with configurable strategies per key.
 * Later objects override earlier ones according to merge strategy.
 */
export function customDeepMerge<T extends object>(...objects: Array<Partial<T>>): T {
  const result = {} as T;

  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      const existing = result[key as keyof T];
      const strategy = getMergeStrategy(key);

      result[key as keyof T] = mergeValue(existing, value, strategy) as T[keyof T];
    }
  }

  return result;
}

function mergeValue(existing: unknown, incoming: unknown, strategy: MergeStrategy): unknown {
  if (incoming === undefined) {
    return existing;
  }

  switch (strategy) {
    case MergeStrategy.REPLACE:
      return incoming;

    case MergeStrategy.CONCAT:
      if (Array.isArray(existing) && Array.isArray(incoming)) {
        return [...existing, ...incoming];
      }
      return incoming;

    case MergeStrategy.UNION:
      if (Array.isArray(existing) && Array.isArray(incoming)) {
        return [...new Set([...existing, ...incoming])];
      }
      return incoming;

    case MergeStrategy.SHALLOW_MERGE:
      if (isPlainObject(existing) && isPlainObject(incoming)) {
        return { ...existing, ...incoming };
      }
      return incoming;

    default:
      return incoming;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

---

## 8. Configuration Access Pattern

### 8.1 Config Class (Dependency Injection)

**MUST use dependency injection. NEVER use singletons or global access.**

```typescript
// src/config/config.ts

import type { Settings } from './settingsSchema.js';

/**
 * Parameters for Config construction.
 * All configuration is passed explicitly.
 */
export interface ConfigParameters {
  settings: Settings;
  projectRoot: string;
  cliArgs: CliArguments;
}

/**
 * Central configuration object.
 * Instantiated once per session and passed via dependency injection.
 *
 * NEVER access this as a singleton or global.
 */
export class Config {
  private readonly settings: Settings;
  private readonly projectRoot: string;
  private readonly cliArgs: CliArguments;

  constructor(params: ConfigParameters) {
    this.settings = params.settings;
    this.projectRoot = params.projectRoot;
    this.cliArgs = params.cliArgs;
  }

  // ============================================================
  // General Settings
  // ============================================================

  getVimMode(): boolean {
    return this.settings.general.vimMode;
  }

  getCheckpointingEnabled(): boolean {
    return this.settings.general.checkpointing.enabled;
  }

  getCheckpointIntervalSeconds(): number {
    return this.settings.general.checkpointing.intervalSeconds;
  }

  // ============================================================
  // Model Settings
  // ============================================================

  getModelName(): string {
    // CLI args override settings
    return this.cliArgs.model ?? this.settings.model.name;
  }

  getMaxSessionTurns(): number {
    return this.settings.model.maxSessionTurns;
  }

  getTemperature(): number {
    return this.settings.model.temperature;
  }

  // ============================================================
  // Tool Settings
  // ============================================================

  getAllowedTools(): string[] {
    return this.settings.tools.allowed;
  }

  getExcludedTools(): string[] {
    return this.settings.tools.excluded;
  }

  isToolAllowed(toolName: string): boolean {
    const allowed = this.getAllowedTools();
    const excluded = this.getExcludedTools();

    if (excluded.includes(toolName)) {
      return false;
    }

    // Empty allowed list means all tools allowed
    if (allowed.length === 0) {
      return true;
    }

    return allowed.includes(toolName);
  }

  getToolTimeout(): number {
    return this.settings.tools.timeout;
  }

  // ============================================================
  // MCP Settings
  // ============================================================

  getMcpServers(): Settings['mcpServers'] {
    return this.settings.mcpServers;
  }

  // ============================================================
  // Paths
  // ============================================================

  getProjectRoot(): string {
    return this.projectRoot;
  }
}
```

### 8.2 Passing Config via Dependency Injection

```typescript
// src/app.ts

import { Config } from './config/config.js';
import { loadSettings } from './config/settingsLoader.js';
import { AgentManager } from './agents/agentManager.js';
import { ToolRegistry } from './tools/toolRegistry.js';

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const cliArgs = parseCliArguments();

  // Load and merge all settings
  const loadedSettings = await loadSettings(projectRoot);

  // Create config instance
  const config = new Config({
    settings: loadedSettings.merged,
    projectRoot,
    cliArgs,
  });

  // Pass config to all components via constructor
  const toolRegistry = new ToolRegistry(config);
  const agentManager = new AgentManager(config, toolRegistry);

  // Start application
  await agentManager.start();
}
```

---

## 9. Settings Utilities

### 9.1 Flattened Schema Access

```typescript
// src/utils/settingsUtils.ts

import { settingsSchema, type Settings } from '../config/settingsSchema.js';

interface FlattenedSetting {
  key: string;
  label: string;
  category: string;
  default: unknown;
  description: string;
  requiresRestart: boolean;
}

let cachedFlatSchema: Map<string, FlattenedSetting> | null = null;

/**
 * Get flattened schema for all settings.
 * Memoized for performance.
 */
export function getFlattenedSchema(): Map<string, FlattenedSetting> {
  if (cachedFlatSchema) {
    return cachedFlatSchema;
  }

  cachedFlatSchema = new Map();
  flattenSchema(settingsSchema, '', cachedFlatSchema);
  return cachedFlatSchema;
}

/**
 * Get definition for a specific setting by dot-path key.
 */
export function getSettingDefinition(key: string): FlattenedSetting | undefined {
  return getFlattenedSchema().get(key);
}

/**
 * Check if changing a setting requires restart.
 */
export function requiresRestart(key: string): boolean {
  const definition = getSettingDefinition(key);
  return definition?.requiresRestart ?? false;
}

/**
 * Get default value for a setting.
 */
export function getDefaultValue(key: string): unknown {
  const definition = getSettingDefinition(key);
  return definition?.default;
}

/**
 * Get effective value for a setting, considering overrides.
 */
export function getEffectiveValue(key: string, settings: Settings): unknown {
  const parts = key.split('.');
  let current: unknown = settings;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return getDefaultValue(key);
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current ?? getDefaultValue(key);
}
```

---

## 10. Configuration Validation

### 10.1 Schema Validation

```typescript
// src/config/settingsValidator.ts

import { z } from 'zod';
import { settingsSchema } from './settingsSchema.js';

/**
 * Validation result with detailed errors.
 */
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string;
  message: string;
  value: unknown;
}

/**
 * Validate settings against schema.
 */
export function validateSettings(settings: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  validateRecursive(settings, settingsSchema, '', errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateRecursive(
  value: unknown,
  schema: unknown,
  path: string,
  errors: ValidationError[]
): void {
  if (schema && typeof schema === 'object' && 'schema' in schema) {
    // Leaf node with Zod schema
    const zodSchema = (schema as { schema: z.ZodType }).schema;
    const result = zodSchema.safeParse(value);

    if (!result.success) {
      errors.push({
        path,
        message: result.error.issues[0]?.message ?? 'Invalid value',
        value,
      });
    }
    return;
  }

  // Recurse into nested objects
  if (typeof schema === 'object' && schema !== null) {
    for (const [key, subSchema] of Object.entries(schema)) {
      const subValue =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
      const subPath = path ? `${path}.${key}` : key;

      validateRecursive(subValue, subSchema, subPath, errors);
    }
  }
}
```

### 10.2 Startup Validation

```typescript
// src/config/validateOnStartup.ts

import { validateSettings } from './settingsValidator.js';
import type { Settings } from './settingsSchema.js';

/**
 * Validate settings on application startup.
 * Throws if critical errors found.
 */
export function validateOnStartup(settings: Settings): void {
  const result = validateSettings(settings);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `  - ${e.path}: ${e.message}`).join('\n');

    throw new Error(
      `Invalid configuration:\n${errorMessages}\n\n` +
        'Fix the errors in your settings file and try again.'
    );
  }
}
```

---

## 11. Configuration Migration

### 11.1 Version Migration Pattern

```typescript
// src/config/migration.ts

interface MigrationMap {
  [oldKey: string]: string | null; // null means removed
}

const V1_TO_V2_MIGRATION: MigrationMap = {
  vim_mode: 'general.vimMode',
  disable_auto_update: 'general.disableAutoUpdate',
  checkpoint_enabled: 'general.checkpointing.enabled',
  checkpoint_interval: 'general.checkpointing.intervalSeconds',
  model: 'model.name',
  max_turns: 'model.maxSessionTurns',
  allowed_tools: 'tools.allowed',
  tool_timeout_ms: 'tools.timeout',
  // Removed settings
  legacy_mode: null,
};

/**
 * Migrate settings from V1 to V2 format.
 */
export function migrateV1ToV2(v1Settings: Record<string, unknown>): Record<string, unknown> {
  const v2Settings: Record<string, unknown> = {};

  for (const [oldKey, value] of Object.entries(v1Settings)) {
    const newKey = V1_TO_V2_MIGRATION[oldKey];

    if (newKey === null) {
      // Setting was removed, skip
      continue;
    }

    if (newKey === undefined) {
      // Not in migration map, keep as-is (might be v2 already)
      setNestedValue(v2Settings, oldKey, value);
    } else {
      // Migrate to new key
      setNestedValue(v2Settings, newKey, value);
    }
  }

  return v2Settings;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}
```

---

## 12. Anti-Patterns

### 12.1 Forbidden Configuration Patterns

| Pattern                        | Why Forbidden                     | Correct Approach              |
| ------------------------------ | --------------------------------- | ----------------------------- |
| Singleton config               | Hidden dependencies, hard to test | Dependency injection          |
| Global `process.env` access    | Scattered, untraceable            | Centralized env resolution    |
| Hardcoded paths                | Non-portable                      | Platform-aware path functions |
| Inline secrets in JSON         | Security risk                     | Environment variables         |
| Mutable config objects         | Race conditions                   | Immutable config instances    |
| Dynamic `require()` for config | Hard to type, tree-shake          | Static imports with loaders   |

### 12.2 Common Mistakes

```typescript
// INCORRECT: Singleton pattern
export const config = new Config(); // Global instance
export function getConfig() {
  return config;
}

// CORRECT: Dependency injection
export class Service {
  constructor(private readonly config: Config) {}
}
```

```typescript
// INCORRECT: Direct process.env access scattered throughout
function getApiUrl(): string {
  return process.env.API_URL ?? 'https://default.com';
}

// CORRECT: Centralized in config loader, accessed via Config class
const config = new Config({ settings: loadedSettings.merged, ... });
const apiUrl = config.getApiUrl();
```

```typescript
// INCORRECT: Hardcoded absolute path
const CONFIG_PATH = '/Users/dev/.flowmaster/settings.json';

// CORRECT: Platform-aware path construction
import { homedir } from 'node:os';
import { join } from 'node:path';
const CONFIG_PATH = join(homedir(), '.flowmaster', 'settings.json');
```

---

## 13. Enforcement

### 13.1 Configuration Validation Script

```bash
#!/bin/bash
# scripts/validate-config.sh
# Validates project configuration against standards

set -euo pipefail

echo "Validating configuration files..."

# Check settings.json has $schema
if [ -f ".flowmaster/settings.json" ]; then
  if ! grep -q '"\$schema"' .flowmaster/settings.json; then
    echo "ERROR: .flowmaster/settings.json missing \$schema reference"
    exit 1
  fi
fi

# Check .env.example exists if .env is used
if [ -f ".env" ] && [ ! -f ".env.example" ]; then
  echo "ERROR: .env exists but .env.example is missing"
  exit 1
fi

# Validate JSON syntax
for file in .flowmaster/*.json; do
  if [ -f "$file" ]; then
    if ! node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''))" 2>/dev/null; then
      echo "ERROR: Invalid JSON in $file"
      exit 1
    fi
  fi
done

echo "Configuration validation passed"
```

### 13.2 CI/CD Validation

```yaml
# .github/workflows/validate-config.yml
name: Validate Configuration
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate settings schema
        run: npm run validate:config

      - name: Check for secrets in config
        run: |
          if grep -rE "(api_key|password|secret|token)\s*[:=]\s*['\"][^$]" \
            .flowmaster/*.json 2>/dev/null; then
            echo "ERROR: Possible hardcoded secrets in config files"
            exit 1
          fi
```

### 13.3 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Prevent committing .env files
if git diff --cached --name-only | grep -E '^\.env$|\.env\.local$'; then
  echo "ERROR: Cannot commit .env files"
  echo "Add sensitive files to .gitignore"
  exit 1
fi

# Validate JSON config files
for file in $(git diff --cached --name-only | grep '\.json$'); do
  if [ -f "$file" ]; then
    if ! node -e "JSON.parse(require('strip-json-comments')(require('fs').readFileSync('$file', 'utf8')))" 2>/dev/null; then
      echo "ERROR: Invalid JSON in $file"
      exit 1
    fi
  fi
done
```

---

## 14. Exceptions

### 14.1 Allowed Modifications

| Setting          | When Modifiable            | Documentation Required        |
| ---------------- | -------------------------- | ----------------------------- |
| Merge strategy   | Custom data structures     | Comment explaining behavior   |
| Platform paths   | Non-standard installations | Environment variable override |
| Validation rules | Legacy compatibility       | Migration plan with deadline  |

### 14.2 Exception Documentation

When modifying a required configuration pattern:

```typescript
/**
 * CONFIGURATION EXCEPTION: STD-011 Section 8.1
 * Reason: Legacy system requires global config access during migration.
 * Impact: Reduced testability for legacy modules.
 * Migration Plan: Convert to DI by Q2 2025.
 * Approved: 2025-01-15
 */
export const legacyConfig = new Config(loadSettingsSync());
```

---

## 15. Quick Reference

### 15.1 File Checklist

| File                   | Location       | Required      | Section |
| ---------------------- | -------------- | ------------- | ------- |
| `settings.json`        | `.flowmaster/` | Yes           | 3.1     |
| `settings.schema.json` | `schemas/`     | Yes           | 5.2     |
| `.env.example`         | Project root   | If using .env | 3.3     |
| `settingsSchema.ts`    | `src/config/`  | Yes           | 5.1     |
| `settingsLoader.ts`    | `src/config/`  | Yes           | 7.1     |
| `config.ts`            | `src/config/`  | Yes           | 8.1     |

### 15.2 Configuration Hierarchy

```
CLI Arguments          ← Highest priority
    ↓
Environment Variables
    ↓
System Override
    ↓
Project Settings
    ↓
User Settings
    ↓
System Defaults
    ↓
Hardcoded Defaults     ← Lowest priority
```

### 15.3 Merge Strategy Summary

| Strategy        | Behavior             | Use For          |
| --------------- | -------------------- | ---------------- |
| `REPLACE`       | Overwrite completely | Simple values    |
| `CONCAT`        | Append arrays        | Ordered lists    |
| `UNION`         | Unique array merge   | Permission lists |
| `SHALLOW_MERGE` | Merge top-level keys | Plugin configs   |

### 15.4 Environment Variable Naming

```
FLOWMASTER_              ← Core settings
FLOWMASTER_API_          ← API configuration
FLOWMASTER_ENABLE_       ← Feature flags
FLOWMASTER_{PROVIDER}_   ← Provider-specific
```

---

## 16. Traceability

### 16.1 Configuration Index

| Config ID | File/Setting        | Section | Purpose                       |
| --------- | ------------------- | ------- | ----------------------------- |
| CFG-001   | `settings.json`     | 3.1     | Primary application settings  |
| CFG-002   | `config.yaml`       | 3.2     | Workflow definitions          |
| CFG-003   | `.env`              | 3.3     | Environment-specific secrets  |
| CFG-004   | `settingsSchema.ts` | 5.1     | Type definitions and defaults |
| CFG-005   | `Config` class      | 8.1     | Runtime configuration access  |

### 16.2 Related Standards

| Standard                         | Relationship                      |
| -------------------------------- | --------------------------------- |
| STD-001 Naming Conventions       | Environment variable naming       |
| STD-004 TypeScript Configuration | Compiler settings for config code |
| STD-014 Security Practices       | Secrets handling patterns         |

---

## 17. Open Questions

| Question ID | Question                                     | Status       |
| ----------- | -------------------------------------------- | ------------ |
| CQ-001      | Should we support TOML as additional format? | Deferred     |
| CQ-002      | Remote config server support for enterprise? | Under review |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
