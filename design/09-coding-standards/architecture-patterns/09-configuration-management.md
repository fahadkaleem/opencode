---
title: Configuration Management Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
related_patterns:
  - ./08-dependency-management.md#dependency-injection
  - ./03-type-safety-patterns.md#runtime-validation
---

# 9. Configuration Management Patterns

> **Purpose**: Comprehensive configuration management patterns using hierarchical loading, settings files, dependency injection, feature flags, and CLI argument parsing to provide flexible and maintainable application configuration.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Hierarchical Configuration Loading](#pattern-1-hierarchical-configuration-loading)
- [Pattern 2: Settings Schema Definition](#pattern-2-settings-schema-definition)
- [Pattern 3: Config Object with Dependency Injection](#pattern-3-config-object-with-dependency-injection)
- [Pattern 4: Feature Flags and Experiments](#pattern-4-feature-flags-and-experiments)
- [Pattern 5: Model Configuration Service](#pattern-5-model-configuration-service)
- [Pattern 6: CLI Arguments Parsing](#pattern-6-cli-arguments-parsing)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Configuration management in a complex CLI application requires balancing flexibility with maintainability. Proper configuration architecture enables users to customize behavior at multiple levels while maintaining sensible defaults and type safety.

A robust configuration system provides clear precedence rules, strong typing, runtime validation, and dependency injection. It supports multiple configuration sources (defaults, files, environment variables, CLI arguments) with predictable override behavior.

**Why configuration management matters:**

- Enables user customization without code changes
- Provides sensible defaults for zero-configuration startup
- Supports different environments (development, production, testing)
- Allows feature flags for gradual rollouts
- Enables A/B testing and experimentation
- Provides clear audit trail of configuration sources

**In this document:**

- **Hierarchical Configuration Loading** - Multi-scope configuration cascade with precedence rules
- **Settings Schema Definition** - Type-safe settings schema with validation and merge strategies
- **Config Object with Dependency Injection** - Central configuration object for service coordination
- **Feature Flags and Experiments** - Remote feature flags for progressive rollout
- **Model Configuration Service** - Model-specific configuration with aliasing and extension
- **CLI Arguments Parsing** - Command-line argument parsing with validation and conflict detection

**Prerequisites:**

- Understanding of TypeScript interfaces and types
- Familiarity with JSON and JSON Schema
- Knowledge of environment variables and file system operations
- Understanding of dependency injection concepts

---

## Pattern 1: Hierarchical Configuration Loading

### Intent

Load configuration from multiple sources with clear precedence rules, allowing users to override defaults at different scopes.

### Problem

Applications need configuration at multiple levels: system-wide defaults, user preferences, workspace-specific settings, and runtime overrides. Without clear precedence rules, configuration becomes unpredictable. Users need to understand which configuration takes priority and how to override settings at different levels.

### Solution

Implement a four-scope configuration hierarchy with strict precedence order:

1. System Defaults (lowest priority)
2. User Settings
3. Workspace Settings
4. System Settings (highest priority)

Each scope can be overridden by higher-priority scopes. Environment variables are resolved within each scope. Configuration files are merged using customizable merge strategies.

### Structure

```
Configuration Cascade:

System Defaults          (Priority 1 - Lowest)
    ↓
User Settings           (Priority 2)
    ↓
Workspace Settings      (Priority 3)
    ↓
System Settings         (Priority 4 - Highest)
    ↓
Final Configuration
```

### Implementation

**Step 1: Define configuration scope paths**

```typescript
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

enum SettingScope {
  System = 'system',
  SystemDefaults = 'system-defaults',
  User = 'user',
  Workspace = 'workspace',
}

// Platform-specific system settings path
function getSystemSettingsPath(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    return '/Library/Application Support/MyCLI/settings.json';
  } else if (platform === 'win32') {
    return path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'MyCLI', 'settings.json');
  } else {
    return '/etc/mycli/settings.json';
  }
}

// Platform-specific system defaults path
function getSystemDefaultsPath(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    return '/Library/Application Support/MyCLI/system-defaults.json';
  } else if (platform === 'win32') {
    return path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'MyCLI', 'system-defaults.json');
  } else {
    return '/etc/mycli/system-defaults.json';
  }
}

// User settings path
const USER_SETTINGS_PATH = path.join(os.homedir(), '.mycli', 'settings.json');

// Workspace settings path (relative to current working directory)
function getWorkspaceSettingsPath(cwd: string): string {
  return path.join(cwd, '.mycli', 'settings.json');
}
```

**Step 2: Implement merge strategy**

```typescript
enum MergeStrategy {
  REPLACE = 'replace', // Default: replace old value
  CONCAT = 'concat', // Concatenate arrays
  UNION = 'union', // Unique array values
  SHALLOW_MERGE = 'shallow_merge', // Shallow object merge
}

interface SettingDefinition {
  type: string;
  default: unknown;
  mergeStrategy?: MergeStrategy;
  properties?: Record<string, SettingDefinition>;
}

type SettingsSchema = Record<string, SettingDefinition>;

// Custom deep merge with strategy support
function customDeepMerge(
  getStrategy: (path: string[]) => MergeStrategy | undefined,
  ...objects: Record<string, unknown>[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function mergePath(path: string[], values: unknown[]): unknown {
    const strategy = getStrategy(path) ?? MergeStrategy.REPLACE;

    // Filter out undefined values
    const definedValues = values.filter((v) => v !== undefined);
    if (definedValues.length === 0) return undefined;

    switch (strategy) {
      case MergeStrategy.REPLACE:
        // Last defined value wins
        return definedValues[definedValues.length - 1];

      case MergeStrategy.CONCAT:
        // Concatenate all arrays
        return definedValues.flatMap((v) => (Array.isArray(v) ? v : [v]));

      case MergeStrategy.UNION:
        // Unique values from all arrays
        const allValues = definedValues.flatMap((v) => (Array.isArray(v) ? v : [v]));
        return [...new Set(allValues)];

      case MergeStrategy.SHALLOW_MERGE:
        // Shallow merge all objects
        return Object.assign(
          {},
          ...definedValues.filter((v) => typeof v === 'object' && v !== null)
        );

      default:
        return definedValues[definedValues.length - 1];
    }
  }

  // Collect all keys from all objects
  const allKeys = new Set<string>();
  for (const obj of objects) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach((key) => allKeys.add(key));
    }
  }

  // Merge each key according to strategy
  for (const key of allKeys) {
    const values = objects.map((obj) => obj?.[key]);
    const hasObjects = values.some((v) => v !== null && typeof v === 'object' && !Array.isArray(v));

    if (hasObjects) {
      // Recursively merge nested objects
      const objectValues = values.map((v) =>
        v !== null && typeof v === 'object' && !Array.isArray(v)
          ? (v as Record<string, unknown>)
          : {}
      );
      result[key] = customDeepMerge((path) => getStrategy([key, ...path]), ...objectValues);
    } else {
      // Use merge strategy for non-object values
      result[key] = mergePath([key], values);
    }
  }

  return result;
}
```

**Step 3: Load and merge all configuration scopes**

```typescript
interface Settings {
  general?: {
    vimMode?: boolean;
    debugMode?: boolean;
  };
  model?: {
    name?: string;
    maxTokens?: number;
  };
  tools?: {
    allowed?: string[];
    sandbox?: boolean;
  };
  [key: string]: unknown;
}

interface SettingsError {
  message: string;
  path: string;
}

interface LoadedSettings {
  system: Settings;
  systemDefaults: Settings;
  user: Settings;
  workspace: Settings;
  merged: Settings;
  isTrusted: boolean;
  errors: SettingsError[];
}

function loadSettings(
  workspaceDir: string = process.cwd(),
  schema: SettingsSchema
): LoadedSettings {
  const settingsErrors: SettingsError[] = [];

  // Helper to get merge strategy for a setting path
  const getMergeStrategyForPath = (path: string[]): MergeStrategy | undefined => {
    let current: SettingDefinition | undefined = undefined;
    let currentSchema: SettingsSchema | undefined = schema;

    for (const key of path) {
      if (!currentSchema || !currentSchema[key]) {
        return undefined;
      }
      current = currentSchema[key];
      currentSchema = current.properties;
    }

    return current?.mergeStrategy;
  };

  // Load single settings file
  const loadSettingsFile = (filePath: string, scope: SettingScope): Settings => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Strip JSON comments (lines starting with //)
        const stripped = content
          .split('\n')
          .filter((line) => !line.trim().startsWith('//'))
          .join('\n');

        const parsed: unknown = JSON.parse(stripped);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          settingsErrors.push({
            message: 'Settings file is not a valid JSON object',
            path: filePath,
          });
          return {};
        }

        return parsed as Settings;
      }
    } catch (error: unknown) {
      settingsErrors.push({
        message: error instanceof Error ? error.message : String(error),
        path: filePath,
      });
    }

    return {};
  };

  // Resolve environment variables in settings object
  const resolveEnvVars = (obj: Settings): Settings => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const envVar = value.slice(2, -1);
        result[key] = process.env[envVar] ?? value;
      } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = resolveEnvVars(value as Settings);
      } else {
        result[key] = value;
      }
    }

    return result as Settings;
  };

  // Load all scopes
  const systemPath = getSystemSettingsPath();
  const systemDefaultsPath = getSystemDefaultsPath();
  const userPath = USER_SETTINGS_PATH;
  const workspacePath = getWorkspaceSettingsPath(workspaceDir);

  let systemSettings = loadSettingsFile(systemPath, SettingScope.System);
  let systemDefaultSettings = loadSettingsFile(systemDefaultsPath, SettingScope.SystemDefaults);
  let userSettings = loadSettingsFile(userPath, SettingScope.User);
  let workspaceSettings = loadSettingsFile(workspacePath, SettingScope.Workspace);

  // Resolve environment variables in each scope
  systemSettings = resolveEnvVars(systemSettings);
  systemDefaultSettings = resolveEnvVars(systemDefaultSettings);
  userSettings = resolveEnvVars(userSettings);
  workspaceSettings = resolveEnvVars(workspaceSettings);

  // Check workspace trust
  const homeDir = fs.realpathSync(os.homedir());
  const realWorkspaceDir = fs.existsSync(workspaceDir)
    ? fs.realpathSync(workspaceDir)
    : workspaceDir;
  const isTrusted = realWorkspaceDir === homeDir || isWorkspaceTrusted(userSettings, workspaceDir);

  // Don't load workspace settings if untrusted
  const safeWorkspaceSettings = isTrusted ? workspaceSettings : {};

  // Merge settings with precedence
  const merged = customDeepMerge(
    getMergeStrategyForPath,
    {},
    systemDefaultSettings,
    userSettings,
    safeWorkspaceSettings,
    systemSettings
  ) as Settings;

  return {
    system: systemSettings,
    systemDefaults: systemDefaultSettings,
    user: userSettings,
    workspace: workspaceSettings,
    merged,
    isTrusted,
    errors: settingsErrors,
  };
}

function isWorkspaceTrusted(userSettings: Settings, workspaceDir: string): boolean {
  // Check if workspace is in trusted directories list
  const trustedDirs = userSettings.security?.trustedDirectories as string[] | undefined;
  if (!trustedDirs) return false;

  const realWorkspaceDir = fs.realpathSync(workspaceDir);
  return trustedDirs.some((dir) => {
    const realTrustedDir = fs.realpathSync(path.resolve(os.homedir(), dir));
    return realWorkspaceDir.startsWith(realTrustedDir);
  });
}
```

### Complete Example

```typescript
// packages/cli/src/config/settings.ts
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

enum SettingScope {
  System = 'system',
  SystemDefaults = 'system-defaults',
  User = 'user',
  Workspace = 'workspace',
}

enum MergeStrategy {
  REPLACE = 'replace',
  CONCAT = 'concat',
  UNION = 'union',
  SHALLOW_MERGE = 'shallow_merge',
}

interface SettingDefinition {
  type: string;
  default: unknown;
  mergeStrategy?: MergeStrategy;
  properties?: Record<string, SettingDefinition>;
}

type SettingsSchema = Record<string, SettingDefinition>;

interface Settings {
  general?: {
    vimMode?: boolean;
    debugMode?: boolean;
  };
  model?: {
    name?: string;
    maxTokens?: number;
  };
  tools?: {
    allowed?: string[];
    sandbox?: boolean;
  };
  [key: string]: unknown;
}

// Define settings schema with merge strategies
const SETTINGS_SCHEMA: SettingsSchema = {
  general: {
    type: 'object',
    default: {},
    properties: {
      vimMode: { type: 'boolean', default: false },
      debugMode: { type: 'boolean', default: false },
    },
  },
  model: {
    type: 'object',
    default: {},
    properties: {
      name: { type: 'string', default: 'default-model' },
      maxTokens: { type: 'number', default: 4096 },
    },
  },
  tools: {
    type: 'object',
    default: {},
    properties: {
      allowed: {
        type: 'array',
        default: [],
        mergeStrategy: MergeStrategy.UNION, // Combine allowed tools from all scopes
      },
      sandbox: { type: 'boolean', default: false },
    },
  },
};

// Load settings with hierarchical cascade
const loadedSettings = loadSettings(process.cwd(), SETTINGS_SCHEMA);

if (loadedSettings.errors.length > 0) {
  console.error('Configuration errors:');
  loadedSettings.errors.forEach((err) => {
    console.error(`  ${err.path}: ${err.message}`);
  });
  process.exit(1);
}

console.log('Configuration loaded successfully');
console.log('Model:', loadedSettings.merged.model?.name);
console.log('Workspace trusted:', loadedSettings.isTrusted);
```

**Example explained:**

- Lines 1-22: Define enums and types for configuration scopes and merge strategies
- Lines 24-50: Define settings schema with merge strategies per field
- Lines 52-55: Load settings from all scopes with automatic merging
- Lines 57-64: Handle configuration errors gracefully
- Lines 66-68: Access merged configuration with type safety

### When to Use

**Use hierarchical configuration when:**

- Application needs multiple levels of customization (system, user, workspace)
- Different environments require different settings
- Users need to override system defaults without modifying system files
- Workspace-specific configuration is required
- Configuration needs to support environment variable substitution

**Avoid hierarchical configuration when:**

- Application has simple configuration needs (single config file sufficient)
- No need for multi-user or multi-workspace scenarios
- Configuration is purely runtime-based (no file persistence)

### Benefits

- **Clear Precedence**: Users understand which settings take priority
- **Flexible Overrides**: Settings can be overridden at appropriate scope
- **Security**: Workspace settings can be disabled for untrusted directories
- **Environment Support**: Environment variables enable deployment-specific config
- **Zero Config**: Sensible defaults allow immediate usage without configuration

### Trade-offs

- **Complexity**: Multiple configuration sources increase cognitive load
- **Debug Difficulty**: Finding which scope set a value requires inspection
- **File System Dependency**: Requires file system access for loading settings
- **Merge Conflicts**: Complex merge strategies can produce unexpected results

### Common Mistakes

**Mistake 1: Loading workspace settings without trust check**

```typescript
// ❌ BAD: Always loads workspace settings
function loadSettings(workspaceDir: string): Settings {
  const workspaceSettings = loadSettingsFile(path.join(workspaceDir, '.mycli', 'settings.json'));

  return mergeSettings(userSettings, workspaceSettings);
}
```

```typescript
// ✅ GOOD: Check workspace trust before loading
function loadSettings(workspaceDir: string): Settings {
  const isTrusted = isWorkspaceTrusted(workspaceDir);
  const workspaceSettings = isTrusted
    ? loadSettingsFile(path.join(workspaceDir, '.mycli', 'settings.json'))
    : {};

  return mergeSettings(userSettings, workspaceSettings);
}
```

**Why this matters**: Loading untrusted workspace settings can execute malicious configuration (e.g., shell commands in tool paths).

**Mistake 2: Forgetting to resolve environment variables**

```typescript
// ❌ BAD: Environment variables left as literal strings
const settings = loadSettingsFile('config.json');
// settings.apiKey is "${API_KEY}" instead of actual value
const apiKey = settings.apiKey;
```

```typescript
// ✅ GOOD: Resolve environment variables after loading
const rawSettings = loadSettingsFile('config.json');
const settings = resolveEnvVars(rawSettings);
// settings.apiKey is now the actual value from process.env.API_KEY
const apiKey = settings.apiKey;
```

**Why this matters**: Unresolved environment variables cause runtime failures when code expects actual values.

### Testing Strategy

**What to Test:**

- Settings load correctly from each scope (system, user, workspace)
- Precedence rules are enforced (higher priority overrides lower)
- Merge strategies work correctly (REPLACE, CONCAT, UNION, SHALLOW_MERGE)
- Environment variables are resolved in all scopes
- Workspace trust check prevents loading untrusted settings
- Missing files are handled gracefully
- Invalid JSON produces helpful error messages

**Test Organization:**

- Co-locate tests: `settings.ts` → `settings.test.ts`
- Use temporary directories for file system isolation
- Mock file system operations where appropriate
- Test each scope independently before testing merge

**Mock Strategy:**

- Use real file system with temporary directories
- Mock environment variables with `process.env` manipulation
- Create test fixtures for each settings scope

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadSettings, SettingsSchema, MergeStrategy } from './settings.js';

describe('loadSettings', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Create temporary directory for test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-test-'));
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  it('should load settings from all scopes with correct precedence', () => {
    // Arrange
    const userSettingsPath = path.join(tempDir, '.mycli', 'settings.json');
    const workspaceSettingsPath = path.join(tempDir, 'workspace', '.mycli', 'settings.json');

    fs.mkdirSync(path.dirname(userSettingsPath), { recursive: true });
    fs.mkdirSync(path.dirname(workspaceSettingsPath), { recursive: true });

    fs.writeFileSync(
      userSettingsPath,
      JSON.stringify({
        model: { name: 'user-model' },
        general: { vimMode: true },
      })
    );

    fs.writeFileSync(
      workspaceSettingsPath,
      JSON.stringify({
        model: { name: 'workspace-model' },
      })
    );

    const schema: SettingsSchema = {
      model: {
        type: 'object',
        default: {},
        properties: {
          name: { type: 'string', default: 'default-model' },
        },
      },
      general: {
        type: 'object',
        default: {},
        properties: {
          vimMode: { type: 'boolean', default: false },
        },
      },
    };

    // Act
    const result = loadSettings(path.join(tempDir, 'workspace'), schema);

    // Assert
    expect(result.merged.model?.name).to.equal('workspace-model'); // Workspace overrides user
    expect(result.merged.general?.vimMode).to.equal(true); // User setting preserved
    expect(result.errors).to.be.empty;
  });

  it('should resolve environment variables in settings', () => {
    // Arrange
    process.env.TEST_MODEL = 'env-model';

    const userSettingsPath = path.join(tempDir, '.mycli', 'settings.json');
    fs.mkdirSync(path.dirname(userSettingsPath), { recursive: true });
    fs.writeFileSync(
      userSettingsPath,
      JSON.stringify({
        model: { name: '${TEST_MODEL}' },
      })
    );

    const schema: SettingsSchema = {
      model: {
        type: 'object',
        default: {},
        properties: {
          name: { type: 'string', default: 'default' },
        },
      },
    };

    // Act
    const result = loadSettings(tempDir, schema);

    // Assert
    expect(result.merged.model?.name).to.equal('env-model');
  });

  it('should not load workspace settings if untrusted', () => {
    // Arrange
    const workspaceDir = path.join(tempDir, 'untrusted-workspace');
    const workspaceSettingsPath = path.join(workspaceDir, '.mycli', 'settings.json');

    fs.mkdirSync(path.dirname(workspaceSettingsPath), { recursive: true });
    fs.writeFileSync(
      workspaceSettingsPath,
      JSON.stringify({
        model: { name: 'malicious-model' },
      })
    );

    const schema: SettingsSchema = {
      model: {
        type: 'object',
        default: {},
        properties: {
          name: { type: 'string', default: 'default-model' },
        },
      },
    };

    // Act
    const result = loadSettings(workspaceDir, schema);

    // Assert
    expect(result.isTrusted).to.be.false;
    expect(result.merged.model?.name).to.not.equal('malicious-model');
  });

  it('should handle missing settings files gracefully', () => {
    // Arrange
    const nonExistentDir = path.join(tempDir, 'does-not-exist');
    const schema: SettingsSchema = {
      model: {
        type: 'object',
        default: {},
        properties: {
          name: { type: 'string', default: 'default-model' },
        },
      },
    };

    // Act
    const result = loadSettings(nonExistentDir, schema);

    // Assert
    expect(result.merged.model?.name).to.equal('default-model'); // Uses default
    expect(result.errors).to.be.empty; // Missing files not errors
  });

  it('should merge arrays using UNION strategy', () => {
    // Arrange
    const userSettingsPath = path.join(tempDir, '.mycli', 'settings.json');
    const workspaceSettingsPath = path.join(tempDir, 'workspace', '.mycli', 'settings.json');

    fs.mkdirSync(path.dirname(userSettingsPath), { recursive: true });
    fs.mkdirSync(path.dirname(workspaceSettingsPath), { recursive: true });

    fs.writeFileSync(
      userSettingsPath,
      JSON.stringify({
        tools: { allowed: ['read', 'write'] },
      })
    );

    fs.writeFileSync(
      workspaceSettingsPath,
      JSON.stringify({
        tools: { allowed: ['write', 'execute'] },
      })
    );

    const schema: SettingsSchema = {
      tools: {
        type: 'object',
        default: {},
        properties: {
          allowed: {
            type: 'array',
            default: [],
            mergeStrategy: MergeStrategy.UNION,
          },
        },
      },
    };

    // Act
    const result = loadSettings(path.join(tempDir, 'workspace'), schema);

    // Assert
    const allowed = result.merged.tools?.allowed as string[];
    expect(allowed).to.have.members(['read', 'write', 'execute']); // Unique union
    expect(allowed).to.have.lengthOf(3);
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Statement coverage: 85%+
- Function coverage: 90%+
- Branch coverage: 80%+ (all merge strategies, error paths)

### Related Patterns

- **[Settings Schema Definition](#pattern-2-settings-schema-definition)** - Defines structure and validation for settings
- **[Dependency Injection](./08-dependency-management.md#pattern-1-dependency-injection)** - Config object provides dependencies
- **[Runtime Validation](./03-type-safety-patterns.md#pattern-6-runtime-validation)** - Validates settings against schema

---

## Pattern 2: Settings Schema Definition

### Intent

Define a type-safe, self-documenting schema for all application settings with runtime validation and automatic JSON Schema generation.

### Problem

Settings files need validation to catch configuration errors early. Without a schema, invalid settings cause runtime failures with unclear error messages. Documentation becomes stale when settings change. Type inference from schemas prevents duplication between runtime validation and TypeScript types.

### Solution

Define a canonical settings schema in TypeScript with full metadata (types, defaults, descriptions, categories, merge strategies). Generate TypeScript types from the schema using conditional types. Export JSON Schema for editor autocomplete and validation. Use the schema at runtime to validate settings and provide merge strategies.

### Structure

```
Settings Schema Architecture:

TypeScript Schema Definition (settingsSchema.ts)
    ├─> TypeScript Types (InferSettings<T>)
    ├─> JSON Schema (settings.schema.json)
    └─> Runtime Validation (validateSettings)

Schema contains:
- Type information
- Default values
- Descriptions
- Merge strategies
- Nested properties
- Validation rules
```

### Implementation

**Step 1: Define schema structure types**

```typescript
// packages/core/src/config/settingsSchema.ts

export enum MergeStrategy {
  REPLACE = 'replace',
  CONCAT = 'concat',
  UNION = 'union',
  SHALLOW_MERGE = 'shallow_merge',
}

export type SettingsType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type SettingsValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SettingsValue[]
  | { [key: string]: SettingsValue };

export interface SettingEnumOption {
  value: string | number | boolean;
  label: string;
  description?: string;
}

export interface SettingCollectionDefinition {
  type: SettingsType;
  description?: string;
  ref?: string;
}

export interface SettingDefinition {
  type: SettingsType;
  label: string;
  category: string;
  requiresRestart: boolean;
  default: SettingsValue;
  description?: string;
  parentKey?: string;
  childKey?: string;
  key?: string;
  properties?: SettingsSchema;
  showInDialog?: boolean;
  mergeStrategy?: MergeStrategy;
  options?: readonly SettingEnumOption[];
  items?: SettingCollectionDefinition;
  additionalProperties?: SettingCollectionDefinition;
  ref?: string;
}

export type SettingsSchema = {
  [key: string]: SettingDefinition;
};
```

**Step 2: Define canonical settings schema**

```typescript
// Canonical settings schema with full metadata
const SETTINGS_SCHEMA = {
  general: {
    type: 'object',
    label: 'General',
    category: 'General',
    requiresRestart: false,
    default: {},
    description: 'General application settings.',
    showInDialog: false,
    properties: {
      vimMode: {
        type: 'boolean',
        label: 'Vim Mode',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Enable Vim keybindings in the CLI interface',
        showInDialog: true,
      },
      debugMode: {
        type: 'boolean',
        label: 'Debug Mode',
        category: 'General',
        requiresRestart: true,
        default: false,
        description: 'Enable debug logging and diagnostics',
        showInDialog: true,
      },
      checkpointing: {
        type: 'object',
        label: 'Checkpointing',
        category: 'General',
        requiresRestart: true,
        default: {},
        description: 'Session checkpointing for recovery',
        showInDialog: false,
        properties: {
          enabled: {
            type: 'boolean',
            label: 'Enable Checkpointing',
            category: 'General',
            requiresRestart: true,
            default: false,
            description: 'Save session state periodically for crash recovery',
            showInDialog: true,
          },
          intervalMinutes: {
            type: 'number',
            label: 'Checkpoint Interval',
            category: 'General',
            requiresRestart: true,
            default: 5,
            description: 'Minutes between automatic checkpoints',
            showInDialog: true,
          },
        },
      },
    },
  },

  model: {
    type: 'object',
    label: 'Model',
    category: 'Model',
    requiresRestart: false,
    default: {},
    description: 'AI model configuration and behavior',
    showInDialog: false,
    properties: {
      name: {
        type: 'string',
        label: 'Model Name',
        category: 'Model',
        requiresRestart: false,
        default: undefined as string | undefined,
        description: 'The AI model to use for conversations',
        showInDialog: false,
      },
      maxSessionTurns: {
        type: 'number',
        label: 'Max Session Turns',
        category: 'Model',
        requiresRestart: false,
        default: -1,
        description: 'Maximum conversation turns to keep in memory (-1 for unlimited)',
        showInDialog: true,
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        category: 'Model',
        requiresRestart: false,
        default: 1.0,
        description: 'Model temperature for response randomness (0.0-2.0)',
        showInDialog: true,
      },
    },
  },

  tools: {
    type: 'object',
    label: 'Tools',
    category: 'Tools',
    requiresRestart: true,
    default: {},
    description: 'Tool execution and security settings',
    showInDialog: false,
    properties: {
      allowed: {
        type: 'array',
        label: 'Allowed Tools',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description: 'Tool names that bypass confirmation dialogs',
        showInDialog: false,
        mergeStrategy: MergeStrategy.UNION,
        items: {
          type: 'string',
          description: 'Tool name',
        },
      },
      sandbox: {
        type: 'boolean',
        label: 'Sandbox Mode',
        category: 'Tools',
        requiresRestart: true,
        default: false,
        description: 'Execute all tools in isolated sandbox environment',
        showInDialog: true,
      },
      useRipgrep: {
        type: 'boolean',
        label: 'Use Ripgrep',
        category: 'Tools',
        requiresRestart: false,
        default: true,
        description: 'Use ripgrep for file search (faster than built-in)',
        showInDialog: true,
      },
    },
  },

  context: {
    type: 'object',
    label: 'Context',
    category: 'Context',
    requiresRestart: false,
    default: {},
    description: 'Settings for managing context provided to the model',
    showInDialog: false,
    properties: {
      fileFiltering: {
        type: 'object',
        label: 'File Filtering',
        category: 'Context',
        requiresRestart: true,
        default: {},
        description: 'Git-aware file filtering rules',
        showInDialog: false,
        properties: {
          respectGitIgnore: {
            type: 'boolean',
            label: 'Respect .gitignore',
            category: 'Context',
            requiresRestart: true,
            default: true,
            description: 'Honor .gitignore files when searching',
            showInDialog: true,
          },
          respectCustomIgnore: {
            type: 'boolean',
            label: 'Respect .mycliignore',
            category: 'Context',
            requiresRestart: true,
            default: true,
            description: 'Honor .mycliignore files when searching',
            showInDialog: true,
          },
        },
      },
    },
  },
} as const satisfies SettingsSchema;

export type SettingsSchemaType = typeof SETTINGS_SCHEMA;

export function getSettingsSchema(): SettingsSchemaType {
  return SETTINGS_SCHEMA;
}
```

**Step 3: Infer TypeScript types from schema**

```typescript
// Type inference utility
type InferSettingType<T extends SettingDefinition> = T['type'] extends 'string'
  ? string
  : T['type'] extends 'number'
    ? number
    : T['type'] extends 'boolean'
      ? boolean
      : T['type'] extends 'array'
        ? unknown[]
        : T['type'] extends 'object'
          ? T['properties'] extends SettingsSchema
            ? InferSettings<T['properties']>
            : Record<string, unknown>
          : never;

type InferSettings<T extends SettingsSchema> = {
  [K in keyof T]?: InferSettingType<T[K]>;
};

// Automatically inferred Settings type from schema
export type Settings = InferSettings<SettingsSchemaType>;

// This type is now equivalent to:
// type Settings = {
//   general?: {
//     vimMode?: boolean;
//     debugMode?: boolean;
//     checkpointing?: {
//       enabled?: boolean;
//       intervalMinutes?: number;
//     };
//   };
//   model?: {
//     name?: string;
//     maxSessionTurns?: number;
//     temperature?: number;
//   };
//   tools?: {
//     allowed?: string[];
//     sandbox?: boolean;
//     useRipgrep?: boolean;
//   };
//   context?: {
//     fileFiltering?: {
//       respectGitIgnore?: boolean;
//       respectCustomIgnore?: boolean;
//     };
//   };
// }
```

**Step 4: Generate JSON Schema for editor support**

```typescript
// packages/core/src/config/generateJsonSchema.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getSettingsSchema,
  type SettingDefinition,
  type SettingsSchema,
} from './settingsSchema.js';

interface JsonSchemaProperty {
  type: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  additionalProperties?: JsonSchemaProperty | boolean;
}

interface JsonSchema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: string;
  additionalProperties: boolean;
  properties: Record<string, JsonSchemaProperty>;
}

function convertSettingToJsonSchema(setting: SettingDefinition): JsonSchemaProperty {
  const property: JsonSchemaProperty = {
    type: setting.type,
    title: setting.label,
    description: setting.description,
    default: setting.default,
  };

  if (setting.type === 'object' && setting.properties) {
    property.properties = {};
    for (const [key, value] of Object.entries(setting.properties)) {
      property.properties[key] = convertSettingToJsonSchema(value);
    }
  }

  if (setting.type === 'array' && setting.items) {
    property.items = {
      type: setting.items.type,
      description: setting.items.description,
    };
  }

  if (setting.additionalProperties) {
    property.additionalProperties = {
      type: setting.additionalProperties.type,
      description: setting.additionalProperties.description,
    };
  }

  return property;
}

export function generateJsonSchema(): JsonSchema {
  const schema = getSettingsSchema();
  const jsonSchema: JsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://example.com/schemas/settings.schema.json',
    title: 'CLI Settings',
    description: 'Configuration file schema for CLI settings',
    type: 'object',
    additionalProperties: false,
    properties: {},
  };

  for (const [key, value] of Object.entries(schema)) {
    jsonSchema.properties[key] = convertSettingToJsonSchema(value);
  }

  return jsonSchema;
}

// Script to write JSON Schema file
if (import.meta.url === `file://${process.argv[1]}`) {
  const schema = generateJsonSchema();
  const outputPath = path.join(process.cwd(), 'schemas', 'settings.schema.json');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf-8');

  console.log(`JSON Schema written to ${outputPath}`);
}
```

### Complete Example

```typescript
// packages/core/src/config/settingsSchema.ts
import { MergeStrategy, type SettingsSchema } from './types.js';

// Complete schema definition with all metadata
export const SETTINGS_SCHEMA = {
  general: {
    type: 'object',
    label: 'General',
    category: 'General',
    requiresRestart: false,
    default: {},
    description: 'General application settings',
    properties: {
      vimMode: {
        type: 'boolean',
        label: 'Vim Mode',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Enable Vim keybindings',
        showInDialog: true,
      },
    },
  },
  tools: {
    type: 'object',
    label: 'Tools',
    category: 'Tools',
    requiresRestart: true,
    default: {},
    description: 'Tool configuration',
    properties: {
      allowed: {
        type: 'array',
        label: 'Allowed Tools',
        category: 'Tools',
        requiresRestart: true,
        default: [],
        description: 'Auto-approved tools',
        mergeStrategy: MergeStrategy.UNION,
        items: { type: 'string' },
      },
    },
  },
} as const satisfies SettingsSchema;

// Automatically inferred TypeScript type
export type Settings = InferSettings<typeof SETTINGS_SCHEMA>;

// Usage in application
import { getSettingsSchema } from './settingsSchema.js';
import type { Settings } from './settingsSchema.js';

const schema = getSettingsSchema();

// Type-safe settings access
const settings: Settings = {
  general: {
    vimMode: true,
  },
  tools: {
    allowed: ['read', 'write'],
  },
};

// Schema-driven validation
function validateSettings(settings: unknown): settings is Settings {
  // Validate against schema
  return true;
}

// Access with full type safety
if (settings.general?.vimMode) {
  console.log('Vim mode enabled');
}
```

**Example explained:**

- Lines 1-30: Define complete schema with metadata for each setting
- Lines 32-33: Infer TypeScript types automatically from schema
- Lines 35-50: Use schema for runtime validation and type-safe access
- Schema serves as single source of truth for types, defaults, and documentation

### When to Use

**Use settings schema when:**

- Settings structure is complex with nested objects
- Need editor autocomplete and validation in settings files
- Want to avoid duplicating types between runtime and compile-time
- Settings require merge strategies or special handling
- Documentation needs to stay synchronized with code

**Avoid settings schema when:**

- Settings are simple key-value pairs
- No need for editor integration or validation
- Configuration is purely programmatic (no user-editable files)
- Schema overhead outweighs benefits for small applications

### Benefits

- **Single Source of Truth**: Schema defines types, defaults, and documentation in one place
- **Type Safety**: TypeScript types inferred automatically from schema
- **Editor Support**: JSON Schema enables autocomplete and inline validation
- **Self-Documenting**: Descriptions and labels embedded in schema
- **Validation**: Runtime validation catches configuration errors early
- **Merge Control**: Per-field merge strategies for hierarchical configuration

### Trade-offs

- **Initial Complexity**: Requires upfront schema definition effort
- **Type Inference Limits**: Complex schemas may challenge TypeScript inference
- **Build Step**: Generating JSON Schema adds build complexity
- **Learning Curve**: Developers must understand schema format and merge strategies

### Common Mistakes

**Mistake 1: Not using const assertion**

```typescript
// ❌ BAD: Schema is mutable, types are widened
const SETTINGS_SCHEMA = {
  general: {
    type: 'object',
    default: {},
    properties: {
      vimMode: {
        type: 'boolean', // Type is string, not literal 'boolean'
        default: false,
      },
    },
  },
};
```

```typescript
// ✅ GOOD: Const assertion preserves literal types
const SETTINGS_SCHEMA = {
  general: {
    type: 'object',
    default: {},
    properties: {
      vimMode: {
        type: 'boolean' as const, // Type is literal 'boolean'
        default: false,
      },
    },
  },
} as const satisfies SettingsSchema;
```

**Why this matters**: Without const assertion, type inference produces overly-broad types (string instead of 'boolean'), breaking type inference.

**Mistake 2: Forgetting to update JSON Schema after schema changes**

```typescript
// ❌ BAD: Manual JSON Schema editing gets out of sync
// Developer adds new setting to TypeScript schema
const SETTINGS_SCHEMA = {
  tools: {
    properties: {
      newSetting: { type: 'boolean', default: false }, // Added here
    },
  },
} as const;

// But forgets to update settings.schema.json
// Result: No editor autocomplete for newSetting
```

```typescript
// ✅ GOOD: Automated JSON Schema generation
// package.json scripts
{
  "scripts": {
    "generate-schema": "tsx src/config/generateJsonSchema.ts",
    "prebuild": "npm run generate-schema"
  }
}

// JSON Schema automatically regenerated on every build
```

**Why this matters**: Manual schema maintenance leads to drift between TypeScript types and JSON Schema, breaking editor support.

### Testing Strategy

**What to Test:**

- Schema structure is valid and complete
- Type inference produces correct TypeScript types
- JSON Schema generation creates valid output
- Default values match declared types
- Merge strategies are correctly assigned
- Required fields are present

**Test Organization:**

- Co-locate tests: `settingsSchema.ts` → `settingsSchema.test.ts`
- Test schema structure separately from usage
- Validate generated JSON Schema against JSON Schema spec

**Mock Strategy:**

- No mocks needed for schema definition tests
- Use minimal schema fixtures for testing
- Test JSON Schema generation with known inputs

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getSettingsSchema, type Settings, generateJsonSchema } from './settingsSchema.js';

describe('SettingsSchema', () => {
  it('should export valid schema structure', () => {
    // Arrange & Act
    const schema = getSettingsSchema();

    // Assert
    expect(schema).to.be.an('object');
    expect(schema.general).to.exist;
    expect(schema.general.type).to.equal('object');
    expect(schema.general.properties).to.exist;
  });

  it('should have correct default values', () => {
    // Arrange & Act
    const schema = getSettingsSchema();

    // Assert
    expect(schema.general.properties?.vimMode?.default).to.equal(false);
    expect(schema.model.properties?.maxSessionTurns?.default).to.equal(-1);
  });

  it('should specify merge strategies for arrays', () => {
    // Arrange & Act
    const schema = getSettingsSchema();

    // Assert
    const allowedToolsSetting = schema.tools.properties?.allowed;
    expect(allowedToolsSetting?.mergeStrategy).to.equal('union');
  });

  it('should infer correct TypeScript types', () => {
    // Arrange
    const settings: Settings = {
      general: {
        vimMode: true,
        debugMode: false,
      },
      model: {
        name: 'test-model',
        maxSessionTurns: 50,
      },
    };

    // Act & Assert - Type checking happens at compile time
    expect(settings.general?.vimMode).to.be.a('boolean');
    expect(settings.model?.name).to.be.a('string');
    expect(settings.model?.maxSessionTurns).to.be.a('number');
  });

  it('should generate valid JSON Schema', () => {
    // Arrange & Act
    const jsonSchema = generateJsonSchema();

    // Assert
    expect(jsonSchema.$schema).to.equal('https://json-schema.org/draft/2020-12/schema');
    expect(jsonSchema.type).to.equal('object');
    expect(jsonSchema.properties).to.be.an('object');
    expect(jsonSchema.properties.general).to.exist;
    expect(jsonSchema.properties.general.type).to.equal('object');
  });

  it('should include descriptions in JSON Schema', () => {
    // Arrange & Act
    const jsonSchema = generateJsonSchema();

    // Assert
    const vimModeProp = jsonSchema.properties.general.properties?.vimMode;
    expect(vimModeProp?.description).to.be.a('string');
    expect(vimModeProp?.description).to.include('Vim');
  });

  it('should mark settings that require restart', () => {
    // Arrange & Act
    const schema = getSettingsSchema();

    // Assert
    expect(schema.tools.requiresRestart).to.be.true;
    expect(schema.general.properties?.vimMode?.requiresRestart).to.be.false;
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+ (schema definitions are data)
- Statement coverage: 90%+
- Function coverage: 100% (getSettingsSchema, generateJsonSchema)
- Branch coverage: 80%+ (conditional schema generation)

### Related Patterns

- **[Hierarchical Configuration Loading](#pattern-1-hierarchical-configuration-loading)** - Uses schema for merge strategies
- **[Runtime Validation](./03-type-safety-patterns.md#pattern-6-runtime-validation)** - Validates settings against schema
- **[Type Inference](./03-type-safety-patterns.md#pattern-5-generic-types)** - Infers TypeScript types from schema

---

## Pattern 3: Config Object with Dependency Injection

### Intent

Create a central configuration object that provides dependencies to all services through getter methods, enabling dependency injection and testability.

### Problem

Services need access to configuration values and other dependencies. Hardcoding dependencies makes testing difficult. Passing individual config values to every service creates maintenance overhead. Global variables create coupling and make testing impossible.

### Solution

Create a Config class that stores all configuration and provides dependencies through getter methods. Services receive the Config object via constructor injection. The Config object becomes the single dependency injection container. All services access configuration and dependencies through the Config object's getter methods.

### Structure

```
Config Object Architecture:

Config Class
  ├─> Stores configuration values (private)
  ├─> Provides getter methods (public)
  ├─> Constructs service instances (lazy)
  └─> Injected into all services

Service receives Config:
  constructor(private config: Config) {}

Service uses Config:
  const value = this.config.getSomething();
```

### Implementation

**Step 1: Define Config interface**

```typescript
// packages/core/src/config/config.ts

export interface ConfigParameters {
  sessionId: string;
  targetDir: string;
  debugMode: boolean;

  // Model configuration
  model: string;
  maxSessionTurns?: number;
  temperature?: number;

  // Tool configuration
  allowedTools?: string[];
  excludeTools?: string[];
  sandbox?: boolean;

  // Approval & security
  approvalMode?: ApprovalMode;

  // Feature flags
  experiments?: Experiments;
  useModelRouter?: boolean;

  // Telemetry
  telemetry?: TelemetrySettings;
}

export enum ApprovalMode {
  DEFAULT = 'default',
  AUTO_EDIT = 'auto_edit',
  YOLO = 'yolo',
}

export interface Experiments {
  experimentIds?: string[];
  flags?: {
    [flagId: string]: {
      boolValue?: boolean;
      floatValue?: number;
      intValue?: number;
      stringValue?: string;
    };
  };
}

export interface TelemetrySettings {
  enabled: boolean;
  endpoint?: string;
  logPrompts?: boolean;
}
```

**Step 2: Implement Config class with dependency injection**

```typescript
export class Config {
  // Private storage for all configuration
  private readonly sessionId: string;
  private readonly targetDir: string;
  private readonly debugMode: boolean;

  private model: string;
  private readonly maxSessionTurns: number;
  private readonly temperature: number;

  private readonly allowedTools: string[] | undefined;
  private readonly excludeTools: string[] | undefined;
  private readonly sandbox: boolean;

  private approvalMode: ApprovalMode;

  private experiments: Experiments | undefined;
  private readonly useModelRouter: boolean;

  private readonly telemetrySettings: TelemetrySettings;

  // Lazy-initialized services
  private toolRegistry?: ToolRegistry;
  private modelConfigService?: ModelConfigService;
  private policyEngine?: PolicyEngine;

  constructor(params: ConfigParameters) {
    // Store configuration values
    this.sessionId = params.sessionId;
    this.targetDir = path.resolve(params.targetDir);
    this.debugMode = params.debugMode;

    this.model = params.model;
    this.maxSessionTurns = params.maxSessionTurns ?? -1;
    this.temperature = params.temperature ?? 1.0;

    this.allowedTools = params.allowedTools;
    this.excludeTools = params.excludeTools;
    this.sandbox = params.sandbox ?? false;

    this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;

    this.experiments = params.experiments;
    this.useModelRouter = params.useModelRouter ?? false;

    this.telemetrySettings = {
      enabled: params.telemetry?.enabled ?? false,
      endpoint: params.telemetry?.endpoint,
      logPrompts: params.telemetry?.logPrompts ?? true,
    };
  }

  // Getter methods for configuration values
  getSessionId(): string {
    return this.sessionId;
  }

  getTargetDir(): string {
    return this.targetDir;
  }

  getDebugMode(): boolean {
    return this.debugMode;
  }

  getModel(): string {
    return this.model;
  }

  setModel(newModel: string): void {
    this.model = newModel;
  }

  getMaxSessionTurns(): number {
    return this.maxSessionTurns;
  }

  getTemperature(): number {
    return this.temperature;
  }

  getAllowedTools(): string[] | undefined {
    return this.allowedTools;
  }

  getExcludeTools(): string[] | undefined {
    return this.excludeTools;
  }

  getSandbox(): boolean {
    return this.sandbox;
  }

  getApprovalMode(): ApprovalMode {
    return this.approvalMode;
  }

  setApprovalMode(mode: ApprovalMode): void {
    this.approvalMode = mode;
  }

  getExperiments(): Experiments | undefined {
    return this.experiments;
  }

  setExperiments(experiments: Experiments): void {
    this.experiments = experiments;
  }

  getUseModelRouter(): boolean {
    return this.useModelRouter;
  }

  getTelemetryEnabled(): boolean {
    return this.telemetrySettings.enabled;
  }

  getTelemetryEndpoint(): string | undefined {
    return this.telemetrySettings.endpoint;
  }

  // Lazy-initialized service getters (dependency injection)
  getToolRegistry(): ToolRegistry {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry(this);
    }
    return this.toolRegistry;
  }

  getModelConfigService(): ModelConfigService {
    if (!this.modelConfigService) {
      this.modelConfigService = new ModelConfigService(this);
    }
    return this.modelConfigService;
  }

  getPolicyEngine(): PolicyEngine {
    if (!this.policyEngine) {
      this.policyEngine = new PolicyEngine(this);
    }
    return this.policyEngine;
  }
}
```

**Step 3: Use Config in services via constructor injection**

```typescript
// Service receives Config via constructor
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor(private config: Config) {
    this.initializeTools();
  }

  private initializeTools(): void {
    // Access configuration through config object
    const excludeTools = this.config.getExcludeTools() ?? [];
    const allowedTools = this.config.getAllowedTools() ?? [];

    // Use configuration to initialize tools
    if (!excludeTools.includes('read')) {
      this.register('read', new ReadTool(this.config));
    }

    if (!excludeTools.includes('write')) {
      this.register('write', new WriteTool(this.config));
    }
  }

  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
}

// Another service using Config
export class PolicyEngine {
  constructor(private config: Config) {}

  async shouldConfirmTool(toolName: string): Promise<boolean> {
    const approvalMode = this.config.getApprovalMode();

    if (approvalMode === ApprovalMode.YOLO) {
      return false; // No confirmation needed
    }

    const allowedTools = this.config.getAllowedTools() ?? [];
    if (allowedTools.includes(toolName)) {
      return false; // Tool is pre-approved
    }

    return true; // Needs confirmation
  }
}
```

**Step 4: Load Config from settings and CLI arguments**

```typescript
// packages/cli/src/config/loadConfig.ts
import { loadSettings } from './settings.js';
import { parseArguments } from './cli-args.js';
import { Config, type ConfigParameters, ApprovalMode } from '@myapp/core';

export async function loadCliConfig(cwd: string = process.cwd()): Promise<Config> {
  // Load settings from all scopes
  const loadedSettings = loadSettings(cwd);

  // Parse CLI arguments
  const argv = await parseArguments();

  // Build configuration with priority cascade
  const params: ConfigParameters = {
    sessionId: generateSessionId(),
    targetDir: cwd,
    debugMode: argv.debug ?? loadedSettings.merged.general?.debugMode ?? false,

    // Model configuration (CLI > Settings > Default)
    model: argv.model ?? process.env.MODEL ?? loadedSettings.merged.model?.name ?? 'default-model',
    maxSessionTurns: loadedSettings.merged.model?.maxSessionTurns,
    temperature: loadedSettings.merged.model?.temperature,

    // Tool configuration
    allowedTools: argv.allowedTools ?? loadedSettings.merged.tools?.allowed,
    sandbox: argv.sandbox ?? loadedSettings.merged.tools?.sandbox,

    // Approval mode
    approvalMode: determineApprovalMode(argv, loadedSettings),

    // Feature flags
    useModelRouter: loadedSettings.merged.experimental?.useModelRouter,

    // Telemetry
    telemetry: loadedSettings.merged.telemetry,
  };

  return new Config(params);
}

function determineApprovalMode(argv: CliArgs, settings: LoadedSettings): ApprovalMode {
  if (argv.yolo) {
    return ApprovalMode.YOLO;
  }

  if (argv.approvalMode) {
    return argv.approvalMode as ApprovalMode;
  }

  return ApprovalMode.DEFAULT;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

### Complete Example

```typescript
// Complete example showing Config pattern in action

// 1. Define Config class
export class Config {
  private readonly model: string;
  private readonly debugMode: boolean;
  private toolRegistry?: ToolRegistry;

  constructor(params: ConfigParameters) {
    this.model = params.model;
    this.debugMode = params.debugMode;
  }

  getModel(): string {
    return this.model;
  }

  getDebugMode(): boolean {
    return this.debugMode;
  }

  getToolRegistry(): ToolRegistry {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry(this);
    }
    return this.toolRegistry;
  }
}

// 2. Services use Config via constructor injection
export class WorkflowExecutor {
  constructor(private config: Config) {}

  async execute(workflow: Workflow): Promise<void> {
    const model = this.config.getModel();
    const toolRegistry = this.config.getToolRegistry();

    if (this.config.getDebugMode()) {
      console.log(`Executing with model: ${model}`);
    }

    // Use toolRegistry...
  }
}

// 3. Load and use Config
async function main() {
  // Load configuration from all sources
  const config = await loadCliConfig(process.cwd());

  // Inject config into services
  const executor = new WorkflowExecutor(config);

  // Execute workflow
  await executor.execute(myWorkflow);
}
```

**Example explained:**

- Lines 1-25: Config class stores values and provides getters
- Lines 27-42: Services receive Config via constructor, access via getters
- Lines 44-53: Config loaded from settings and CLI, injected into services
- Config becomes single dependency injection point

### When to Use

**Use Config object pattern when:**

- Application has many services that need configuration
- Services need access to other services (service registry)
- Testing requires mocking configuration or dependencies
- Configuration values may change at runtime
- Want centralized configuration management

**Avoid Config object pattern when:**

- Application has very few services
- Configuration is purely static
- Services have no dependencies on each other
- Prefer explicit dependency injection framework

### Benefits

- **Centralized Configuration**: Single source for all configuration access
- **Testability**: Easy to mock Config object for unit tests
- **Lazy Initialization**: Services created only when needed
- **Type Safety**: All configuration accessed through typed methods
- **Flexibility**: Configuration can be updated at runtime through setters

### Trade-offs

- **God Object Risk**: Config can become too large if not organized
- **Hidden Dependencies**: Services may access too many config values
- **Testing Complexity**: Mocking large Config object can be tedious
- **Coupling**: All services depend on Config class

### Common Mistakes

**Mistake 1: Exposing mutable state directly**

```typescript
// ❌ BAD: Returning mutable objects
export class Config {
  private experiments: Experiments = { flags: {} };

  getExperiments(): Experiments {
    return this.experiments; // Caller can mutate
  }
}

// Caller can break encapsulation
const experiments = config.getExperiments();
experiments.flags['newFlag'] = { boolValue: true }; // Mutates config!
```

```typescript
// ✅ GOOD: Return defensive copy or readonly
export class Config {
  private experiments: Experiments = { flags: {} };

  getExperiments(): Readonly<Experiments> {
    return Object.freeze({ ...this.experiments });
  }

  // Or provide specific accessors
  getExperimentFlag(name: string): boolean | undefined {
    return this.experiments.flags[name]?.boolValue;
  }
}
```

**Why this matters**: Returning mutable objects allows callers to bypass setters and violate invariants.

**Mistake 2: Creating services in constructor**

```typescript
// ❌ BAD: Eagerly create all services
export class Config {
  private toolRegistry: ToolRegistry;
  private modelService: ModelConfigService;
  private policyEngine: PolicyEngine;

  constructor(params: ConfigParameters) {
    // Creates all services even if not needed
    this.toolRegistry = new ToolRegistry(this);
    this.modelService = new ModelConfigService(this);
    this.policyEngine = new PolicyEngine(this);
  }
}
```

```typescript
// ✅ GOOD: Lazy initialization
export class Config {
  private toolRegistry?: ToolRegistry;
  private modelService?: ModelConfigService;
  private policyEngine?: PolicyEngine;

  constructor(params: ConfigParameters) {
    // Store parameters only
  }

  getToolRegistry(): ToolRegistry {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry(this);
    }
    return this.toolRegistry;
  }
}
```

**Why this matters**: Eager initialization wastes resources creating unused services and increases startup time.

### Testing Strategy

**What to Test:**

- Config stores values correctly from parameters
- Getter methods return correct values
- Setter methods update values correctly
- Lazy initialization creates services only once
- Services receive Config via constructor
- Configuration precedence (CLI > env > settings > defaults)

**Test Organization:**

- Co-locate tests: `config.ts` → `config.test.ts`
- Test Config class separately from loading logic
- Use minimal Config for service tests

**Mock Strategy:**

- Create minimal Config objects for testing services
- Mock only getters needed by service under test
- Use test fixtures for common Config scenarios

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Config, ApprovalMode } from './config.js';

describe('Config', () => {
  it('should store and return configuration values', () => {
    // Arrange
    const params = {
      sessionId: 'test-session',
      targetDir: '/test/dir',
      debugMode: true,
      model: 'test-model',
      approvalMode: ApprovalMode.YOLO,
    };

    // Act
    const config = new Config(params);

    // Assert
    expect(config.getSessionId()).to.equal('test-session');
    expect(config.getDebugMode()).to.be.true;
    expect(config.getModel()).to.equal('test-model');
    expect(config.getApprovalMode()).to.equal(ApprovalMode.YOLO);
  });

  it('should apply default values for optional parameters', () => {
    // Arrange
    const params = {
      sessionId: 'test-session',
      targetDir: '/test/dir',
      debugMode: false,
      model: 'test-model',
    };

    // Act
    const config = new Config(params);

    // Assert
    expect(config.getMaxSessionTurns()).to.equal(-1); // Default
    expect(config.getTemperature()).to.equal(1.0); // Default
    expect(config.getSandbox()).to.be.false; // Default
  });

  it('should allow updating mutable configuration', () => {
    // Arrange
    const config = new Config({
      sessionId: 'test',
      targetDir: '/test',
      debugMode: false,
      model: 'initial-model',
    });

    // Act
    config.setModel('updated-model');

    // Assert
    expect(config.getModel()).to.equal('updated-model');
  });

  it('should lazy-initialize services', () => {
    // Arrange
    const config = new Config({
      sessionId: 'test',
      targetDir: '/test',
      debugMode: false,
      model: 'test-model',
    });

    // Act
    const toolRegistry1 = config.getToolRegistry();
    const toolRegistry2 = config.getToolRegistry();

    // Assert
    expect(toolRegistry1).to.equal(toolRegistry2); // Same instance
  });

  it('should support service dependency injection', () => {
    // Arrange
    const config = new Config({
      sessionId: 'test',
      targetDir: '/test',
      debugMode: true,
      model: 'test-model',
    });

    // Act
    class TestService {
      constructor(private config: Config) {}

      getConfiguredModel(): string {
        return this.config.getModel();
      }
    }

    const service = new TestService(config);

    // Assert
    expect(service.getConfiguredModel()).to.equal('test-model');
  });
});

// Testing services with mock Config
describe('WorkflowExecutor with Config', () => {
  it('should use configuration from Config object', () => {
    // Arrange
    const mockConfig = {
      getModel: () => 'mock-model',
      getDebugMode: () => true,
      getToolRegistry: () => new MockToolRegistry(),
    } as unknown as Config;

    const executor = new WorkflowExecutor(mockConfig);

    // Act & Assert
    // Test that executor uses mock config values
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Statement coverage: 90%+
- Function coverage: 100% (all getters/setters)
- Branch coverage: 85%+

### Related Patterns

- **[Dependency Injection](./08-dependency-management.md#pattern-1-dependency-injection)** - Config provides dependencies
- **[Hierarchical Configuration Loading](#pattern-1-hierarchical-configuration-loading)** - Loads values stored in Config
- **[Lazy Initialization](./02-architectural-design-patterns.md#lazy-initialization)** - Services created on first access

---

## Pattern 4: Feature Flags and Experiments

### Intent

Enable runtime feature control through remote or local configuration flags, allowing gradual rollouts, A/B testing, and kill switches without code deployments.

### Problem

Features need to be rolled out gradually to subsets of users. Turning features on/off requires code changes and deployments. A/B testing requires maintaining multiple code branches. Kill switches for problematic features are needed. Feature values (numbers, strings) need remote adjustment.

### Solution

Define feature flags in configuration with typed values (boolean, number, string, lists). Load flags from remote service on startup. Provide type-safe accessors for flag values with defaults. Update flags at runtime without restart. Use flags to conditionally enable features or adjust behavior.

### Structure

```
Feature Flags Architecture:

ExperimentFlags Enum
  ├─> ENABLE_FEATURE_X
  ├─> THRESHOLD_VALUE
  └─> BANNER_TEXT

Experiments Interface
  ├─> experimentIds: string[]
  └─> flags: Map<string, FlagValue>

FlagValue (union type)
  ├─> boolValue?: boolean
  ├─> floatValue?: number
  ├─> intValue?: number
  ├─> stringValue?: string
  └─> listValues?: T[]

Config provides:
  - getExperiments()
  - setExperiments()
  - getFeatureFlag(name)
```

### Implementation

**Step 1: Define experiment flag structure**

```typescript
// packages/core/src/experiments/flagNames.ts

export enum ExperimentFlags {
  // Boolean flags
  ENABLE_PREVIEW = 'ENABLE_PREVIEW',
  USER_CACHING = 'USER_CACHING',

  // Numeric flags
  CONTEXT_COMPRESSION_THRESHOLD = 'CONTEXT_COMPRESSION_THRESHOLD',
  MAX_RETRY_ATTEMPTS = 'MAX_RETRY_ATTEMPTS',

  // String flags
  BANNER_TEXT_NO_CAPACITY = 'BANNER_TEXT_NO_CAPACITY',
  BANNER_TEXT_CAPACITY_ISSUES = 'BANNER_TEXT_CAPACITY_ISSUES',

  // List flags
  ALLOWED_MODELS = 'ALLOWED_MODELS',
}
```

**Step 2: Define experiments data structure**

```typescript
// packages/core/src/experiments/types.ts

export interface FlagValue {
  boolValue?: boolean;
  floatValue?: number;
  intValue?: number;
  stringValue?: string;
  int32ListValue?: { values: number[] };
  stringListValue?: { values: string[] };
}

export interface Experiments {
  experimentIds?: string[];
  flags: {
    [flagId: string]: FlagValue;
  };
}
```

**Step 3: Add experiments to Config**

```typescript
// packages/core/src/config/config.ts

export class Config {
  private experiments: Experiments | undefined;
  private experimentsPromise: Promise<void> | undefined;

  constructor(params: ConfigParameters) {
    this.experiments = params.experiments;
  }

  // Get experiments
  getExperiments(): Experiments | undefined {
    return this.experiments;
  }

  // Update experiments
  setExperiments(experiments: Experiments): void {
    this.experiments = experiments;

    // Log flag summary for debugging
    const flagSummaries = Object.entries(experiments.flags ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([flagId, flag]) => {
        const summary: Record<string, unknown> = { flagId };
        if (flag.boolValue !== undefined) {
          summary.boolValue = flag.boolValue;
        }
        if (flag.floatValue !== undefined) {
          summary.floatValue = flag.floatValue;
        }
        if (flag.stringValue !== undefined) {
          summary.stringValue = flag.stringValue;
        }
        return summary;
      });

    if (this.getDebugMode()) {
      console.log('Experiments loaded:', JSON.stringify(flagSummaries, null, 2));
    }
  }

  // Type-safe flag accessors
  async getBooleanFlag(flag: ExperimentFlags): Promise<boolean | undefined> {
    await this.ensureExperimentsLoaded();
    return this.experiments?.flags[flag]?.boolValue;
  }

  async getNumberFlag(flag: ExperimentFlags): Promise<number | undefined> {
    await this.ensureExperimentsLoaded();
    return this.experiments?.flags[flag]?.floatValue ?? this.experiments?.flags[flag]?.intValue;
  }

  async getStringFlag(flag: ExperimentFlags): Promise<string | undefined> {
    await this.ensureExperimentsLoaded();
    return this.experiments?.flags[flag]?.stringValue;
  }

  async getStringListFlag(flag: ExperimentFlags): Promise<string[] | undefined> {
    await this.ensureExperimentsLoaded();
    return this.experiments?.flags[flag]?.stringListValue?.values;
  }

  private async ensureExperimentsLoaded(): Promise<void> {
    if (!this.experimentsPromise) {
      return;
    }
    try {
      await this.experimentsPromise;
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }
}
```

**Step 4: Load experiments from remote service**

```typescript
// packages/core/src/experiments/loader.ts

export async function fetchExperiments(endpoint: string, authToken: string): Promise<Experiments> {
  const response = await fetch(`${endpoint}/experiments`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch experiments: ${response.statusText}`);
  }

  const data = await response.json();
  return data as Experiments;
}

// Refresh experiments on authentication
export async function refreshAuth(config: Config, authMethod: string): Promise<void> {
  const experimentEndpoint = getExperimentEndpoint(config);

  if (experimentEndpoint) {
    config.experimentsPromise = fetchExperiments(experimentEndpoint, authToken)
      .then((experiments) => {
        config.setExperiments(experiments);
      })
      .catch((error) => {
        console.error('Failed to fetch experiments:', error);
      });
  } else {
    config.experiments = undefined;
    config.experimentsPromise = undefined;
  }
}
```

**Step 5: Use feature flags in application code**

```typescript
// Use flags to enable/disable features
export class FeatureService {
  constructor(private config: Config) {}

  async shouldEnablePreview(): Promise<boolean> {
    const enablePreview = await this.config.getBooleanFlag(ExperimentFlags.ENABLE_PREVIEW);
    return enablePreview ?? false; // Default to false
  }

  async getCompressionThreshold(): Promise<number> {
    const threshold = await this.config.getNumberFlag(
      ExperimentFlags.CONTEXT_COMPRESSION_THRESHOLD
    );
    return threshold ?? 0.5; // Default threshold
  }

  async getBannerText(): Promise<string> {
    const hasCapacityIssues = await this.checkCapacity();

    const flag = hasCapacityIssues
      ? ExperimentFlags.BANNER_TEXT_CAPACITY_ISSUES
      : ExperimentFlags.BANNER_TEXT_NO_CAPACITY;

    const text = await this.config.getStringFlag(flag);
    return text ?? 'Welcome!'; // Default message
  }

  async getAllowedModels(): Promise<string[]> {
    const models = await this.config.getStringListFlag(ExperimentFlags.ALLOWED_MODELS);
    return models ?? ['default-model']; // Default models
  }
}

// Use flags in conditional logic
export class ModelSelector {
  constructor(private config: Config) {}

  async selectModel(context: Context): Promise<string> {
    const useModelRouter = await this.config.getBooleanFlag(ExperimentFlags.USE_MODEL_ROUTER);

    if (useModelRouter) {
      return this.routeModel(context);
    } else {
      return this.config.getModel();
    }
  }
}
```

### Complete Example

```typescript
// Complete feature flags implementation

// 1. Define flags enum
export enum ExperimentFlags {
  ENABLE_NEW_FEATURE = 'ENABLE_NEW_FEATURE',
  BATCH_SIZE = 'BATCH_SIZE',
  ERROR_MESSAGE = 'ERROR_MESSAGE',
}

// 2. Experiments structure
export interface Experiments {
  experimentIds?: string[];
  flags: {
    [flagId: string]: {
      boolValue?: boolean;
      floatValue?: number;
      stringValue?: string;
    };
  };
}

// 3. Config with experiments
export class Config {
  private experiments?: Experiments;

  async getBooleanFlag(flag: ExperimentFlags): Promise<boolean | undefined> {
    return this.experiments?.flags[flag]?.boolValue;
  }

  async getNumberFlag(flag: ExperimentFlags): Promise<number | undefined> {
    return this.experiments?.flags[flag]?.floatValue;
  }

  async getStringFlag(flag: ExperimentFlags): Promise<string | undefined> {
    return this.experiments?.flags[flag]?.stringValue;
  }
}

// 4. Usage in application
export class FeatureManager {
  constructor(private config: Config) {}

  async processData(data: unknown[]): Promise<void> {
    const enabled = await this.config.getBooleanFlag(ExperimentFlags.ENABLE_NEW_FEATURE);

    if (enabled) {
      const batchSize = (await this.config.getNumberFlag(ExperimentFlags.BATCH_SIZE)) ?? 10;

      // Use new batched processing
      await this.processBatched(data, batchSize);
    } else {
      // Use old processing
      await this.processSequential(data);
    }
  }
}

// 5. Remote flag loading
async function initializeApp() {
  const config = new Config(/* params */);

  // Load experiments from remote
  const experiments = await fetchExperiments(apiEndpoint);
  config.setExperiments(experiments);

  // Start application
  const featureManager = new FeatureManager(config);
  await featureManager.start();
}
```

**Example explained:**

- Lines 1-10: Define flag names and structure
- Lines 12-27: Config provides type-safe flag accessors
- Lines 29-48: Application code uses flags to control features
- Lines 50-58: Flags loaded from remote service and injected
- Flags can be updated without code changes

### When to Use

**Use feature flags when:**

- Rolling out new features gradually to users
- Need kill switches for problematic features
- Running A/B tests comparing behaviors
- Adjusting numeric parameters without deployment
- Different behavior for different user segments

**Avoid feature flags when:**

- Feature is simple and fully tested
- No need for gradual rollout
- Feature flags create excessive code complexity
- Flag logic makes code hard to understand

### When to Use (continued)

**Use feature flags when:**

- Rolling out new features gradually to users
- Need kill switches for problematic features
- Running A/B tests comparing behaviors
- Adjusting numeric parameters without deployment
- Different behavior for different user segments

**Avoid feature flags when:**

- Feature is simple and fully tested
- No need for gradual rollout
- Feature flags create excessive code complexity
- Flag logic makes code hard to understand

### Benefits

- **Zero-Downtime Rollout**: Enable features without deployment
- **Quick Rollback**: Disable features instantly if issues arise
- **A/B Testing**: Compare feature variants on live traffic
- **Gradual Rollout**: Enable for percentage of users
- **Runtime Tuning**: Adjust numeric values without code changes
- **User Segmentation**: Different features for different users

### Trade-offs

- **Code Complexity**: Conditional logic for every flagged feature
- **Technical Debt**: Old flag code must be removed after rollout
- **Testing Burden**: Must test all flag combinations
- **Performance**: Flag checks add small runtime cost

### Common Mistakes

**Mistake 1: Not providing default values**

```typescript
// ❌ BAD: No default, undefined behavior
async processData() {
  const batchSize = await this.config.getNumberFlag('BATCH_SIZE');
  // If flag not set, batchSize is undefined, code crashes
  for (let i = 0; i < data.length; i += batchSize) { // Error!
    // ...
  }
}
```

```typescript
// ✅ GOOD: Always provide sensible default
async processData() {
  const batchSize = await this.config.getNumberFlag('BATCH_SIZE') ?? 10;
  // Always has value, code works even if flag not set
  for (let i = 0; i < data.length; i += batchSize) {
    // ...
  }
}
```

**Why this matters**: Missing flags cause runtime errors. Defaults ensure graceful degradation.

**Mistake 2: Not cleaning up old flags**

```typescript
// ❌ BAD: Flag left in code after full rollout
async function process() {
  const useNewFeature = await config.getBooleanFlag('NEW_FEATURE');

  if (useNewFeature) {
    // New feature (enabled for 100% of users for 6 months)
    await processNew();
  } else {
    // Old code path (never used anymore)
    await processOld();
  }
}
```

```typescript
// ✅ GOOD: Remove flag after full rollout
async function process() {
  // Feature is now permanent, flag removed
  await processNew();
}

// Delete old code:
// - Remove processOld() function
// - Remove flag from ExperimentFlags enum
// - Remove flag from remote config
```

**Why this matters**: Accumulating dead flags creates technical debt and confuses developers.

### Testing Strategy

**What to Test:**

- Flag returns correct value for each type (bool, number, string)
- Default values work when flag not set
- Flag updates reflected in application behavior
- All flag combinations produce valid results
- Remote flag loading handles failures gracefully

**Test Organization:**

- Test flag accessors separately from usage
- Test each feature with flag enabled and disabled
- Integration tests for remote flag loading

**Mock Strategy:**

- Mock experiments object with known flag values
- Test flag accessor methods independently
- Mock remote API for experiment loading tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Config, ExperimentFlags } from './config.js';

describe('Feature Flags', () => {
  it('should return boolean flag value', async () => {
    // Arrange
    const experiments = {
      experimentIds: ['test-experiment'],
      flags: {
        [ExperimentFlags.ENABLE_PREVIEW]: {
          boolValue: true,
        },
      },
    };

    const config = new Config({
      /* ... */
    });
    config.setExperiments(experiments);

    // Act
    const enabled = await config.getBooleanFlag(ExperimentFlags.ENABLE_PREVIEW);

    // Assert
    expect(enabled).to.be.true;
  });

  it('should return undefined for missing flag', async () => {
    // Arrange
    const config = new Config({
      /* ... */
    });
    config.setExperiments({ flags: {} });

    // Act
    const value = await config.getBooleanFlag(ExperimentFlags.ENABLE_PREVIEW);

    // Assert
    expect(value).to.be.undefined;
  });

  it('should return number flag value', async () => {
    // Arrange
    const experiments = {
      flags: {
        [ExperimentFlags.BATCH_SIZE]: {
          intValue: 25,
        },
      },
    };

    const config = new Config({
      /* ... */
    });
    config.setExperiments(experiments);

    // Act
    const batchSize = await config.getNumberFlag(ExperimentFlags.BATCH_SIZE);

    // Assert
    expect(batchSize).to.equal(25);
  });

  it('should use feature flag in application logic', async () => {
    // Arrange
    const config = new Config({
      /* ... */
    });
    config.setExperiments({
      flags: {
        [ExperimentFlags.ENABLE_NEW_FEATURE]: {
          boolValue: true,
        },
      },
    });

    const featureManager = new FeatureManager(config);

    // Act
    const result = await featureManager.shouldUseNewFeature();

    // Assert
    expect(result).to.be.true;
  });

  it('should handle remote flag loading failure', async () => {
    // Arrange
    const config = new Config({
      /* ... */
    });

    // Mock failed remote load
    const failedPromise = Promise.reject(new Error('Network error'));
    config.experimentsPromise = failedPromise;

    // Act
    const enabled = await config.getBooleanFlag(ExperimentFlags.ENABLE_PREVIEW);

    // Assert
    expect(enabled).to.be.undefined; // Graceful degradation
  });
});

// Test feature with flag enabled vs disabled
describe('FeatureManager', () => {
  it('should use new processing when flag enabled', async () => {
    // Arrange
    const config = new Config({
      /* ... */
    });
    config.setExperiments({
      flags: {
        [ExperimentFlags.ENABLE_NEW_FEATURE]: { boolValue: true },
      },
    });

    const manager = new FeatureManager(config);

    // Act
    await manager.processData([1, 2, 3]);

    // Assert
    // Verify new processing was used
  });

  it('should use old processing when flag disabled', async () => {
    // Arrange
    const config = new Config({
      /* ... */
    });
    config.setExperiments({
      flags: {
        [ExperimentFlags.ENABLE_NEW_FEATURE]: { boolValue: false },
      },
    });

    const manager = new FeatureManager(config);

    // Act
    await manager.processData([1, 2, 3]);

    // Assert
    // Verify old processing was used
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Statement coverage: 85%+
- Function coverage: 90%+
- Branch coverage: 100% (both flag values tested)

### Related Patterns

- **[Config Object with Dependency Injection](#pattern-3-config-object-with-dependency-injection)** - Config stores experiments
- **[Hierarchical Configuration Loading](#pattern-1-hierarchical-configuration-loading)** - Loads experiment defaults
- **[Runtime Validation](./03-type-safety-patterns.md#pattern-6-runtime-validation)** - Validates flag values

---

## Pattern 5: Model Configuration Service

### Intent

Provide model-specific configuration with aliasing, inheritance, and per-model parameter overrides.

### Problem

Different AI models require different parameters (temperature, token limits, thinking budget). Hardcoding these parameters throughout the application creates maintenance burden and prevents easy model switching. Users need named aliases for common model configurations and the ability to extend base configurations.

### Solution

Create a ModelConfigService that manages model configurations with support for:

- Named aliases for common configurations
- Configuration inheritance via `extends` field
- Per-model parameter overrides
- Default values with type safety

The service resolves configuration by merging base configurations with specific overrides, enabling DRY configuration management.

### Structure

```
ModelConfigService
    │
    ├── Aliases Map
    │   ├── base (foundation)
    │   ├── chat-base (extends base)
    │   ├── model-2.5-pro (extends chat-base)
    │   └── classifier (extends base)
    │
    └── Resolution
        ├── Lookup alias
        ├── Resolve extends chain
        ├── Merge configurations
        └── Return ModelConfig
```

### Implementation

**Step 1: Define model configuration types**

```typescript
// packages/core/src/types/model-config.ts

export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingConfig?: {
    includeThoughts?: boolean;
    thinkingBudget?: number;
  };
  tools?: ToolConfig[];
}

export interface ModelConfig {
  model?: string;
  generateContentConfig?: GenerateContentConfig;
}

export interface ModelAlias {
  extends?: string; // Parent alias to inherit from
  modelConfig: ModelConfig;
}

export interface ModelConfigServiceConfig {
  aliases: Record<string, ModelAlias>;
}

export type ModelConfigKey = string;
```

**Step 2: Implement configuration service with inheritance**

```typescript
// packages/core/src/services/modelConfigService.ts
import type {
  ModelConfig,
  ModelAlias,
  ModelConfigServiceConfig,
  ModelConfigKey,
} from '../types/model-config.js';

export class ModelConfigService {
  private aliases: Map<string, ModelAlias>;

  constructor(private config: ModelConfigServiceConfig) {
    this.aliases = new Map(Object.entries(config.aliases));
  }

  /**
   * Get model configuration for a given alias.
   * Resolves inheritance chain and merges configurations.
   */
  getModelConfig(alias: ModelConfigKey): ModelConfig | undefined {
    const aliasConfig = this.aliases.get(alias);
    if (!aliasConfig) {
      return undefined;
    }

    // Resolve inheritance chain
    const configs: ModelConfig[] = [];
    let current: ModelAlias | undefined = aliasConfig;
    const visited = new Set<string>();

    while (current) {
      // Detect circular inheritance
      if (visited.has(alias)) {
        throw new Error(`Circular inheritance detected in model config: ${alias}`);
      }
      visited.add(alias);

      // Add current config to chain
      configs.unshift(current.modelConfig);

      // Move to parent
      if (current.extends) {
        current = this.aliases.get(current.extends);
      } else {
        current = undefined;
      }
    }

    // Merge configurations (later overrides earlier)
    return this.mergeModelConfigs(...configs);
  }

  /**
   * Deep merge model configurations.
   * Later configs override earlier ones.
   */
  private mergeModelConfigs(...configs: ModelConfig[]): ModelConfig {
    const result: ModelConfig = {};

    for (const config of configs) {
      if (config.model !== undefined) {
        result.model = config.model;
      }

      if (config.generateContentConfig) {
        result.generateContentConfig = {
          ...result.generateContentConfig,
          ...config.generateContentConfig,
        };

        // Deep merge thinkingConfig
        if (config.generateContentConfig.thinkingConfig) {
          result.generateContentConfig.thinkingConfig = {
            ...result.generateContentConfig.thinkingConfig,
            ...config.generateContentConfig.thinkingConfig,
          };
        }

        // Deep merge tools array (replace, not concat)
        if (config.generateContentConfig.tools) {
          result.generateContentConfig.tools = config.generateContentConfig.tools;
        }
      }
    }

    return result;
  }

  /**
   * Check if an alias exists
   */
  hasAlias(alias: ModelConfigKey): boolean {
    return this.aliases.has(alias);
  }

  /**
   * Get all available aliases
   */
  getAvailableAliases(): string[] {
    return Array.from(this.aliases.keys());
  }
}
```

**Step 3: Define default model configurations**

```typescript
// packages/core/src/config/defaultModelConfigs.ts
import type { ModelConfigServiceConfig } from '../types/model-config.js';

export const DEFAULT_MODEL_CONFIGS: ModelConfigServiceConfig = {
  aliases: {
    // Base configuration - foundation for all models
    base: {
      modelConfig: {
        generateContentConfig: {
          temperature: 0,
          topP: 1,
        },
      },
    },

    // Chat base - extends base with chat-specific settings
    'chat-base': {
      extends: 'base',
      modelConfig: {
        generateContentConfig: {
          thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 8192,
          },
          temperature: 1,
          topP: 0.95,
          topK: 64,
        },
      },
    },

    // Specific model configurations
    'model-2.5-pro': {
      extends: 'chat-base',
      modelConfig: {
        model: 'model-2.5-pro',
      },
    },

    'model-2.5-flash': {
      extends: 'chat-base',
      modelConfig: {
        model: 'model-2.5-flash',
      },
    },

    'model-2.5-flash-lite': {
      extends: 'chat-base',
      modelConfig: {
        model: 'model-2.5-flash-lite',
      },
    },

    // Specialized configurations
    classifier: {
      extends: 'base',
      modelConfig: {
        model: 'model-2.5-flash-lite',
        generateContentConfig: {
          maxOutputTokens: 1024,
          thinkingConfig: {
            thinkingBudget: 512,
          },
        },
      },
    },

    'prompt-completion': {
      extends: 'base',
      modelConfig: {
        model: 'model-2.5-flash-lite',
        generateContentConfig: {
          temperature: 0.3,
          maxOutputTokens: 16000,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      },
    },

    'summarizer-default': {
      extends: 'base',
      modelConfig: {
        model: 'model-2.5-flash-lite',
        generateContentConfig: {
          maxOutputTokens: 2000,
        },
      },
    },

    // Model with specific tools
    'web-search': {
      extends: 'base',
      modelConfig: {
        model: 'model-2.5-flash',
        generateContentConfig: {
          tools: [{ googleSearch: {} }],
        },
      },
    },
  },
};
```

**Step 4: Integrate with Config object**

```typescript
// packages/core/src/config/config.ts
import { ModelConfigService } from '../services/modelConfigService.js';
import { DEFAULT_MODEL_CONFIGS } from './defaultModelConfigs.js';
import type { ModelConfigServiceConfig } from '../types/model-config.js';

export interface ConfigParameters {
  model: string;
  modelConfigServiceConfig?: ModelConfigServiceConfig;
  // ... other parameters
}

export class Config {
  private model: string;
  readonly modelConfigService: ModelConfigService;

  constructor(params: ConfigParameters) {
    this.model = params.model;

    // Merge user config with defaults
    let modelConfigServiceConfig = params.modelConfigServiceConfig;
    if (modelConfigServiceConfig && !modelConfigServiceConfig.aliases) {
      // User provided partial config, merge with defaults
      modelConfigServiceConfig = {
        ...modelConfigServiceConfig,
        aliases: {
          ...DEFAULT_MODEL_CONFIGS.aliases,
          ...modelConfigServiceConfig.aliases,
        },
      };
    }

    this.modelConfigService = new ModelConfigService(
      modelConfigServiceConfig ?? DEFAULT_MODEL_CONFIGS
    );
  }

  getModel(): string {
    return this.model;
  }

  setModel(newModel: string): void {
    this.model = newModel;
  }

  /**
   * Get resolved configuration for current model
   */
  getModelConfig(): ModelConfig | undefined {
    return this.modelConfigService.getModelConfig(this.model);
  }
}
```

### Complete Example

```typescript
// packages/core/src/services/modelConfigService.ts
import type {
  ModelConfig,
  ModelAlias,
  ModelConfigServiceConfig,
  ModelConfigKey,
} from '../types/model-config.js';

export class ModelConfigService {
  private aliases: Map<string, ModelAlias>;

  constructor(config: ModelConfigServiceConfig) {
    this.aliases = new Map(Object.entries(config.aliases));
  }

  getModelConfig(alias: ModelConfigKey): ModelConfig | undefined {
    const aliasConfig = this.aliases.get(alias);
    if (!aliasConfig) return undefined;

    const configs: ModelConfig[] = [];
    let current: ModelAlias | undefined = aliasConfig;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(alias)) {
        throw new Error(`Circular inheritance in model config: ${alias}`);
      }
      visited.add(alias);

      configs.unshift(current.modelConfig);

      if (current.extends) {
        current = this.aliases.get(current.extends);
      } else {
        current = undefined;
      }
    }

    return this.mergeModelConfigs(...configs);
  }

  private mergeModelConfigs(...configs: ModelConfig[]): ModelConfig {
    const result: ModelConfig = {};

    for (const config of configs) {
      if (config.model !== undefined) {
        result.model = config.model;
      }

      if (config.generateContentConfig) {
        result.generateContentConfig = {
          ...result.generateContentConfig,
          ...config.generateContentConfig,
        };

        if (config.generateContentConfig.thinkingConfig) {
          result.generateContentConfig.thinkingConfig = {
            ...result.generateContentConfig.thinkingConfig,
            ...config.generateContentConfig.thinkingConfig,
          };
        }

        if (config.generateContentConfig.tools) {
          result.generateContentConfig.tools = config.generateContentConfig.tools;
        }
      }
    }

    return result;
  }

  hasAlias(alias: ModelConfigKey): boolean {
    return this.aliases.has(alias);
  }

  getAvailableAliases(): string[] {
    return Array.from(this.aliases.keys());
  }
}

// Usage example
const config: ModelConfigServiceConfig = {
  aliases: {
    base: {
      modelConfig: {
        generateContentConfig: {
          temperature: 0,
          topP: 1,
        },
      },
    },
    'chat-base': {
      extends: 'base',
      modelConfig: {
        generateContentConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 64,
        },
      },
    },
    'model-2.5-pro': {
      extends: 'chat-base',
      modelConfig: {
        model: 'model-2.5-pro',
      },
    },
  },
};

const service = new ModelConfigService(config);
const resolvedConfig = service.getModelConfig('model-2.5-pro');

console.log(resolvedConfig);
// Output:
// {
//   model: 'model-2.5-pro',
//   generateContentConfig: {
//     temperature: 1,      // from chat-base
//     topP: 0.95,          // from chat-base
//     topK: 64,            // from chat-base
//   }
// }
```

**Example explained:**

- Lines 1-10: ModelConfigService class stores aliases and provides resolution
- Lines 12-35: getModelConfig resolves inheritance chain and merges configs
- Lines 37-64: mergeModelConfigs performs deep merge with override semantics
- Lines 66-72: Helper methods for checking aliases
- Lines 74-105: Example configuration with inheritance chain
- Lines 107-119: Usage showing resolved configuration includes all inherited properties

### When to Use

**Use model configuration service when:**

- Application supports multiple AI models with different parameters
- Common configurations should be reusable across models
- Users need to define custom model aliases
- Model parameters need inheritance and composition
- Configuration should be validated and type-safe

**Avoid model configuration service when:**

- Application only uses a single model
- Model parameters are static and never change
- No need for configuration reuse or inheritance
- Simple key-value configuration is sufficient

### Benefits

- **DRY Configuration**: Reuse common configurations via inheritance
- **Type Safety**: TypeScript interfaces ensure valid configurations
- **Flexibility**: Users can define custom aliases and extend defaults
- **Maintainability**: Centralized model configuration management
- **Discoverability**: List available aliases for user reference

### Trade-offs

- **Complexity**: Inheritance adds indirection and cognitive load
- **Circular Dependency Risk**: Requires cycle detection in inheritance
- **Merge Semantics**: Deep merge behavior must be well-documented
- **Debugging**: Resolved configuration may not match source due to inheritance

### Common Mistakes

**Mistake 1: Circular inheritance**

```typescript
// ❌ BAD: Circular inheritance causes infinite loop
const config: ModelConfigServiceConfig = {
  aliases: {
    a: {
      extends: 'b',
      modelConfig: {
        /* ... */
      },
    },
    b: {
      extends: 'a', // Circular reference!
      modelConfig: {
        /* ... */
      },
    },
  },
};
```

```typescript
// ✅ GOOD: Detect circular inheritance
getModelConfig(alias: ModelConfigKey): ModelConfig | undefined {
  const visited = new Set<string>();
  let current: ModelAlias | undefined = this.aliases.get(alias);

  while (current) {
    if (visited.has(alias)) {
      throw new Error(`Circular inheritance detected: ${alias}`);
    }
    visited.add(alias);
    // ... continue resolution
  }
}
```

**Why this matters**: Circular inheritance causes infinite loops and stack overflow.

**Mistake 2: Shallow merge losing nested properties**

```typescript
// ❌ BAD: Shallow merge loses nested properties
private mergeModelConfigs(...configs: ModelConfig[]): ModelConfig {
  return Object.assign({}, ...configs);
  // Loses nested generateContentConfig properties
}
```

```typescript
// ✅ GOOD: Deep merge preserves nested properties
private mergeModelConfigs(...configs: ModelConfig[]): ModelConfig {
  const result: ModelConfig = {};

  for (const config of configs) {
    if (config.generateContentConfig) {
      result.generateContentConfig = {
        ...result.generateContentConfig,
        ...config.generateContentConfig,
      };
      // Handle deeply nested properties
    }
  }

  return result;
}
```

**Why this matters**: Shallow merge overwrites entire nested objects instead of merging properties.

### Testing Strategy

**What to Test:**

- Configuration resolution with inheritance chain
- Circular inheritance detection
- Deep merge behavior for nested properties
- Missing alias handling
- Multiple levels of inheritance
- Override semantics (child overrides parent)

**Test Organization:**

- Co-locate tests: `modelConfigService.ts` → `modelConfigService.test.ts`
- Test each method independently
- Use AAA pattern for clarity

**Mock Strategy:**

- No external dependencies to mock
- Use test fixture configurations
- Test with real ModelConfigService instances

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ModelConfigService } from './modelConfigService.js';
import type { ModelConfigServiceConfig } from '../types/model-config.js';

describe('ModelConfigService', () => {
  it('should resolve simple alias without inheritance', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        simple: {
          modelConfig: {
            model: 'test-model',
            generateContentConfig: {
              temperature: 0.5,
            },
          },
        },
      },
    };

    const service = new ModelConfigService(config);

    // Act
    const resolved = service.getModelConfig('simple');

    // Assert
    expect(resolved).to.deep.equal({
      model: 'test-model',
      generateContentConfig: {
        temperature: 0.5,
      },
    });
  });

  it('should resolve inheritance chain', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        base: {
          modelConfig: {
            generateContentConfig: {
              temperature: 0,
              topP: 1,
            },
          },
        },
        chat: {
          extends: 'base',
          modelConfig: {
            generateContentConfig: {
              temperature: 1, // Override base
              topK: 64, // Add new property
            },
          },
        },
        pro: {
          extends: 'chat',
          modelConfig: {
            model: 'model-pro',
          },
        },
      },
    };

    const service = new ModelConfigService(config);

    // Act
    const resolved = service.getModelConfig('pro');

    // Assert
    expect(resolved).to.deep.equal({
      model: 'model-pro',
      generateContentConfig: {
        temperature: 1, // From chat (overrides base)
        topP: 1, // From base
        topK: 64, // From chat
      },
    });
  });

  it('should detect circular inheritance', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        a: {
          extends: 'b',
          modelConfig: {},
        },
        b: {
          extends: 'a', // Circular!
          modelConfig: {},
        },
      },
    };

    const service = new ModelConfigService(config);

    // Act & Assert
    expect(() => service.getModelConfig('a')).to.throw('Circular inheritance');
  });

  it('should return undefined for missing alias', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {},
    };

    const service = new ModelConfigService(config);

    // Act
    const resolved = service.getModelConfig('nonexistent');

    // Assert
    expect(resolved).to.be.undefined;
  });

  it('should merge nested thinkingConfig correctly', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        base: {
          modelConfig: {
            generateContentConfig: {
              thinkingConfig: {
                includeThoughts: true,
                thinkingBudget: 8192,
              },
            },
          },
        },
        custom: {
          extends: 'base',
          modelConfig: {
            generateContentConfig: {
              thinkingConfig: {
                thinkingBudget: 2048, // Override budget, keep includeThoughts
              },
            },
          },
        },
      },
    };

    const service = new ModelConfigService(config);

    // Act
    const resolved = service.getModelConfig('custom');

    // Assert
    expect(resolved?.generateContentConfig?.thinkingConfig).to.deep.equal({
      includeThoughts: true, // From base
      thinkingBudget: 2048, // Overridden by custom
    });
  });

  it('should list all available aliases', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        base: { modelConfig: {} },
        chat: { extends: 'base', modelConfig: {} },
        pro: { extends: 'chat', modelConfig: {} },
      },
    };

    const service = new ModelConfigService(config);

    // Act
    const aliases = service.getAvailableAliases();

    // Assert
    expect(aliases).to.have.members(['base', 'chat', 'pro']);
  });

  it('should check if alias exists', () => {
    // Arrange
    const config: ModelConfigServiceConfig = {
      aliases: {
        existing: { modelConfig: {} },
      },
    };

    const service = new ModelConfigService(config);

    // Act & Assert
    expect(service.hasAlias('existing')).to.be.true;
    expect(service.hasAlias('nonexistent')).to.be.false;
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+
- Statement coverage: 95%+
- Function coverage: 100%
- Branch coverage: 90%+ (all inheritance paths, merge branches)

### Related Patterns

- **[Config Object with Dependency Injection](#pattern-3-config-object-with-dependency-injection)** - Config uses ModelConfigService
- **[Settings Schema Definition](#pattern-2-settings-schema-definition)** - Model configs stored in settings
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type-safe model configurations

---

## Pattern 6: CLI Arguments Parsing

### Intent

Parse command-line arguments with validation, conflict detection, and proper priority handling to override configuration defaults.

### Problem

CLI applications need to accept arguments that override settings file configuration. Without proper parsing, validation, and conflict detection, users experience cryptic errors, silent failures, or unexpected behavior. Arguments need type safety, mutual exclusivity validation, and clear error messages.

### Solution

Use a dedicated argument parsing library (yargs) with:

- Type-safe argument definitions
- Validation rules and conflict detection
- Help text generation
- Subcommand support
- Coercion functions for normalizing input

Parse arguments early in application startup and use them to override settings with clear priority: CLI args > settings > defaults.

### Structure

```
CLI Arguments Flow:

User Input (argv)
    ↓
Yargs Parser
    ├── Argument Definitions
    ├── Validation Rules
    ├── Conflict Checks
    └── Coercion Functions
    ↓
Parsed CliArgs Object
    ↓
Config Loading
    ├── Merge with Settings
    ├── Apply Priority (CLI > Settings > Defaults)
    └── Validate Final Config
    ↓
Config Object
```

### Implementation

**Step 1: Define CLI arguments interface**

```typescript
// packages/cli/src/config/cli-args.ts

export interface CliArgs {
  // Positional arguments
  query?: string;

  // Model configuration
  model?: string;

  // Execution mode
  sandbox?: boolean | string;
  debug?: boolean;

  // Prompt modes (mutually exclusive)
  prompt?: string;
  promptInteractive?: string;

  // Approval modes
  yolo?: boolean;
  approvalMode?: string;

  // Tool configuration
  allowedTools?: string[];

  // Session management
  resume?: string;
  listSessions?: boolean;
  deleteSession?: string;

  // Context
  includeDirectories?: string[];

  // Accessibility
  screenReader?: boolean;

  // Output
  outputFormat?: string;

  // Extensions
  extensions?: string[];
  listExtensions?: boolean;

  // Experimental/testing (hidden)
  fakeResponses?: string;
  recordResponses?: string;
}
```

**Step 2: Implement argument parser with yargs**

```typescript
// packages/cli/src/config/cli-args.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export async function parseArguments(): Promise<CliArgs> {
  const rawArgv = hideBin(process.argv);

  const yargsInstance = yargs(rawArgv)
    .locale('en')
    .scriptName('mycli')
    .usage('Usage: mycli [options] [command]\n\nInteractive CLI application')

    // Global options
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Run in debug mode',
      default: false,
    })

    // Main command
    .command('$0 [query..]', 'Launch interactive CLI', (yargs) =>
      yargs
        .positional('query', {
          description: 'Positional prompt (one-shot by default)',
          type: 'string',
        })

        // Model configuration
        .option('model', {
          alias: 'm',
          type: 'string',
          nargs: 1,
          description: 'Model to use for generation',
        })

        // Prompt options (mutually exclusive)
        .option('prompt', {
          alias: 'p',
          type: 'string',
          nargs: 1,
          description: 'One-shot prompt',
        })
        .option('prompt-interactive', {
          alias: 'i',
          type: 'string',
          nargs: 1,
          description: 'Interactive prompt',
        })

        // Sandbox
        .option('sandbox', {
          alias: 's',
          type: 'boolean',
          description: 'Run in sandbox environment',
        })

        // Approval modes
        .option('yolo', {
          alias: 'y',
          type: 'boolean',
          description: 'Auto-approve all actions (YOLO mode)',
          default: false,
        })
        .option('approval-mode', {
          type: 'string',
          nargs: 1,
          choices: ['default', 'auto_edit', 'yolo'],
          description: 'Set approval mode',
        })

        // Tool configuration
        .option('allowed-tools', {
          type: 'array',
          string: true,
          nargs: 1,
          description: 'Tools allowed without confirmation',
          coerce: (tools: string[]) =>
            // Handle comma-separated values
            tools.flatMap((tool) => tool.split(',').map((t) => t.trim())),
        })

        // Session management
        .option('resume', {
          alias: 'r',
          type: 'string',
          skipValidation: true,
          description: 'Resume session (use "latest" or index number)',
          coerce: (value: string): string => {
            if (value === '') {
              return 'latest';
            }
            return value;
          },
        })
        .option('list-sessions', {
          type: 'boolean',
          description: 'List available sessions and exit',
        })
        .option('delete-session', {
          type: 'string',
          description: 'Delete session by index number',
        })

        // Context
        .option('include-directories', {
          type: 'array',
          string: true,
          nargs: 1,
          description: 'Additional directories to include',
          coerce: (dirs: string[]) => dirs.flatMap((dir) => dir.split(',').map((d) => d.trim())),
        })

        // Accessibility
        .option('screen-reader', {
          type: 'boolean',
          description: 'Enable screen reader mode',
        })

        // Output format
        .option('output-format', {
          alias: 'o',
          type: 'string',
          nargs: 1,
          description: 'CLI output format',
          choices: ['text', 'json', 'stream-json'],
        })

        // Extensions
        .option('extensions', {
          alias: 'e',
          type: 'array',
          string: true,
          nargs: 1,
          description: 'Extensions to use',
          coerce: (extensions: string[]) =>
            extensions.flatMap((ext) => ext.split(',').map((e) => e.trim())),
        })
        .option('list-extensions', {
          alias: 'l',
          type: 'boolean',
          description: 'List all available extensions and exit',
        })

        // Testing/experimental (hidden)
        .option('fake-responses', {
          type: 'string',
          description: 'Path to fake responses file for testing',
          hidden: true,
        })
        .option('record-responses', {
          type: 'string',
          description: 'Path to record responses for testing',
          hidden: true,
        })

        // Deprecation warnings
        .deprecateOption('prompt', 'Use positional prompt instead. This flag will be removed.')
    )

    // Validation and conflict checking
    .check((argv) => {
      // Check for conflicting prompt options
      const query = argv['query'] as string | string[] | undefined;
      const hasPositionalQuery = Array.isArray(query) ? query.length > 0 : !!query;

      if (argv['prompt'] && hasPositionalQuery) {
        return 'Cannot use both positional prompt and --prompt (-p) flag';
      }

      if (argv['prompt'] && argv['promptInteractive']) {
        return 'Cannot use both --prompt (-p) and --prompt-interactive (-i)';
      }

      // Check for conflicting approval modes
      if (argv['yolo'] && argv['approvalMode']) {
        return 'Cannot use both --yolo (-y) and --approval-mode';
      }

      // Validate output format
      if (
        argv['outputFormat'] &&
        !['text', 'json', 'stream-json'].includes(argv['outputFormat'] as string)
      ) {
        return `Invalid output-format: "${argv['outputFormat']}"`;
      }

      return true;
    });

  // Version and help
  yargsInstance
    .version('1.0.0')
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .strict()
    .demandCommand(0, 0)
    .exitProcess(false);

  // Set terminal width for help text
  yargsInstance.wrap(yargsInstance.terminalWidth());

  // Parse arguments
  let result;
  try {
    result = await yargsInstance.parse();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    yargsInstance.showHelp();
    process.exit(1);
  }

  // Handle help and version
  if (result['help'] || result['version']) {
    process.exit(0);
  }

  // Normalize positional query argument
  const queryArg = (result as { query?: string | string[] }).query;
  const normalizedQuery: string | undefined = Array.isArray(queryArg)
    ? queryArg.join(' ')
    : queryArg;

  // Route positional args to appropriate prompt mode
  if (normalizedQuery && !result['prompt']) {
    const hasExplicitInteractive =
      result['promptInteractive'] === '' || !!result['promptInteractive'];
    if (hasExplicitInteractive) {
      result['promptInteractive'] = normalizedQuery;
    } else {
      result['prompt'] = normalizedQuery;
    }
  }

  (result as Record<string, unknown>)['query'] = normalizedQuery || undefined;

  return result as unknown as CliArgs;
}
```

**Step 3: Use CLI arguments to override configuration**

```typescript
// packages/cli/src/config/loadConfig.ts
import { loadSettings } from './settings.js';
import { parseArguments } from './cli-args.js';
import { Config, type ConfigParameters, ApprovalMode } from '@myapp/core';

export async function loadCliConfig(cwd: string = process.cwd()): Promise<Config> {
  // Load settings from all scopes
  const loadedSettings = loadSettings(cwd);

  // Parse CLI arguments
  const argv = await parseArguments();

  // Determine approval mode with cascade
  let approvalMode: ApprovalMode;
  if (argv.approvalMode) {
    // CLI argument takes precedence
    switch (argv.approvalMode) {
      case 'yolo':
        approvalMode = ApprovalMode.YOLO;
        break;
      case 'auto_edit':
        approvalMode = ApprovalMode.AUTO_EDIT;
        break;
      case 'default':
        approvalMode = ApprovalMode.DEFAULT;
        break;
      default:
        throw new Error(`Invalid approval mode: ${argv.approvalMode}`);
    }
  } else {
    // Fallback to legacy --yolo flag
    approvalMode = argv.yolo ? ApprovalMode.YOLO : ApprovalMode.DEFAULT;
  }

  // Security: Override if disabled in settings
  if (loadedSettings.merged.security?.disableYoloMode) {
    if (approvalMode === ApprovalMode.YOLO) {
      throw new Error('YOLO mode disabled by settings');
    }
    approvalMode = ApprovalMode.DEFAULT;
  }

  // Build configuration with priority cascade
  const params: ConfigParameters = {
    sessionId: generateSessionId(),
    targetDir: cwd,

    // Debug mode (CLI > Settings > Default)
    debugMode: argv.debug ?? loadedSettings.merged.general?.debugMode ?? false,

    // Model (CLI > Env > Settings > Default)
    model: argv.model ?? process.env.MODEL ?? loadedSettings.merged.model?.name ?? 'default-model',

    // Tool configuration
    allowedTools: argv.allowedTools ?? loadedSettings.merged.tools?.allowed ?? [],
    sandbox: argv.sandbox ?? loadedSettings.merged.tools?.sandbox,

    // Approval mode
    approvalMode,

    // Output format
    outputFormat: argv.outputFormat ?? loadedSettings.merged.output?.format ?? 'text',

    // Accessibility
    screenReader:
      argv.screenReader ?? loadedSettings.merged.ui?.accessibility?.screenReader ?? false,

    // Context
    includeDirectories:
      argv.includeDirectories ?? loadedSettings.merged.context?.includeDirectories,

    // Feature flags
    useModelRouter: loadedSettings.merged.experimental?.useModelRouter,

    // Telemetry
    telemetry: loadedSettings.merged.telemetry,
  };

  return new Config(params);
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

### Complete Example

```typescript
// packages/cli/src/index.ts
import { loadCliConfig } from './config/loadConfig.js';

async function main() {
  try {
    // Parse CLI arguments and load configuration
    const config = await loadCliConfig(process.cwd());

    console.log('Configuration loaded:');
    console.log('  Model:', config.getModel());
    console.log('  Approval mode:', config.getApprovalMode());
    console.log('  Debug mode:', config.getDebugMode());
    console.log('  Allowed tools:', config.getAllowedTools());

    // Use configuration for application logic
    // ...
  } catch (error) {
    console.error('Failed to load configuration:', error);
    process.exit(1);
  }
}

main();
```

**Example command-line usage:**

```bash
# Use default configuration
mycli

# Override model via CLI argument
mycli --model model-2.5-pro

# Enable debug mode
mycli --debug

# Use YOLO mode with specific model
mycli --yolo --model model-2.5-flash

# Provide positional prompt
mycli "Explain how configuration works"

# Interactive mode with prompt
mycli -i "Start with this question"

# Allow specific tools
mycli --allowed-tools read,write,execute

# List available sessions
mycli --list-sessions

# Resume latest session
mycli --resume latest

# Multiple options combined
mycli --model model-2.5-pro --debug --allowed-tools read,write
```

**Example explained:**

- Lines 1-20: Main entry point loads configuration from CLI args and settings
- Lines 22-40: Example bash commands showing various CLI argument combinations
- Priority cascade ensures CLI args always override settings and defaults

### When to Use

**Use CLI argument parsing when:**

- Application accepts runtime configuration via command line
- Different invocations require different behavior
- CI/CD pipelines need to override settings
- Users need quick configuration without editing files
- Scripting and automation require programmatic control

**Avoid CLI argument parsing when:**

- Application has no user-facing CLI (library only)
- All configuration must come from files (security requirement)
- Arguments would be too numerous or complex
- GUI-based configuration is more appropriate

### Benefits

- **User Control**: Override any setting from command line
- **Automation Friendly**: Scriptable without file modification
- **Self-Documenting**: Help text generated from argument definitions
- **Type Safety**: Argument types enforced at parse time
- **Validation**: Conflicts detected before execution
- **Flexibility**: Supports various input formats (flags, arrays, etc.)

### Trade-offs

- **API Surface**: Many arguments create large API to maintain
- **Backward Compatibility**: Changing arguments breaks user scripts
- **Discoverability**: Too many options overwhelm users
- **Complexity**: Validation logic can become intricate

### Common Mistakes

**Mistake 1: Not handling mutually exclusive options**

```typescript
// ❌ BAD: No validation for conflicting options
.option('prompt', { type: 'string' })
.option('prompt-interactive', { type: 'string' })
// User can provide both, causing confusion
```

```typescript
// ✅ GOOD: Validate mutual exclusivity
.check((argv) => {
  if (argv['prompt'] && argv['promptInteractive']) {
    return 'Cannot use both --prompt and --prompt-interactive';
  }
  return true;
});
```

**Why this matters**: Conflicting options lead to undefined behavior and user confusion.

**Mistake 2: Not coercing comma-separated values**

```typescript
// ❌ BAD: User must use flag multiple times
mycli --allowed-tools read --allowed-tools write --allowed-tools execute
```

```typescript
// ✅ GOOD: Support comma-separated values
.option('allowed-tools', {
  type: 'array',
  string: true,
  coerce: (tools: string[]) =>
    tools.flatMap((tool) => tool.split(',').map((t) => t.trim())),
})

// Now both work:
// mycli --allowed-tools read,write,execute
// mycli --allowed-tools read --allowed-tools write
```

**Why this matters**: Comma-separated values provide better UX for list arguments.

### Testing Strategy

**What to Test:**

- Argument parsing produces correct CliArgs object
- Validation catches conflicting options
- Coercion functions normalize input correctly
- Help and version flags work
- Default values applied when arguments omitted
- Priority cascade (CLI > Settings > Defaults) enforced

**Test Organization:**

- Co-locate tests: `cli-args.ts` → `cli-args.test.ts`
- Test parsing separately from config loading
- Use test fixtures for complex argument combinations

**Mock Strategy:**

- Mock `process.argv` for argument parsing tests
- Mock settings loader for config integration tests
- Use real yargs parser (no mocks needed)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { parseArguments } from './cli-args.js';

describe('parseArguments', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should parse model argument', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--model', 'model-2.5-pro'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.model).to.equal('model-2.5-pro');
  });

  it('should parse boolean flags', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--debug', '--yolo'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.debug).to.be.true;
    expect(args.yolo).to.be.true;
  });

  it('should coerce comma-separated allowed-tools', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--allowed-tools', 'read,write,execute'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.allowedTools).to.deep.equal(['read', 'write', 'execute']);
  });

  it('should reject conflicting prompt options', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--prompt', 'one-shot', '-i', 'interactive'];

    // Act & Assert
    await expect(parseArguments()).to.be.rejectedWith(
      'Cannot use both --prompt and --prompt-interactive'
    );
  });

  it('should reject conflicting approval modes', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--yolo', '--approval-mode', 'default'];

    // Act & Assert
    await expect(parseArguments()).to.be.rejectedWith('Cannot use both --yolo and --approval-mode');
  });

  it('should handle positional query argument', async () => {
    // Arrange
    process.argv = ['node', 'mycli', 'What', 'is', 'this?'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.query).to.equal('What is this?');
  });

  it('should apply default values for missing arguments', async () => {
    // Arrange
    process.argv = ['node', 'mycli'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.debug).to.be.false; // Default
    expect(args.yolo).to.be.false; // Default
    expect(args.model).to.be.undefined; // No default
  });

  it('should validate output format choices', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--output-format', 'invalid'];

    // Act & Assert
    await expect(parseArguments()).to.be.rejectedWith('Invalid output-format');
  });

  it('should normalize resume flag', async () => {
    // Arrange - empty value should become 'latest'
    process.argv = ['node', 'mycli', '--resume'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.resume).to.equal('latest');
  });

  it('should handle multiple extensions', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--extensions', 'ext1,ext2', '--extensions', 'ext3'];

    // Act
    const args = await parseArguments();

    // Assert
    expect(args.extensions).to.deep.equal(['ext1', 'ext2', 'ext3']);
  });
});

describe('loadCliConfig', () => {
  it('should prioritize CLI args over settings', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--model', 'cli-model', '--debug'];

    // Mock settings with different values
    const mockSettings = {
      merged: {
        model: { name: 'settings-model' },
        general: { debugMode: false },
      },
    };

    // Act
    const config = await loadCliConfig(process.cwd());

    // Assert
    expect(config.getModel()).to.equal('cli-model'); // CLI wins
    expect(config.getDebugMode()).to.be.true; // CLI wins
  });

  it('should use settings when CLI args not provided', async () => {
    // Arrange
    process.argv = ['node', 'mycli'];

    const mockSettings = {
      merged: {
        model: { name: 'settings-model' },
        general: { debugMode: true },
      },
    };

    // Act
    const config = await loadCliConfig(process.cwd());

    // Assert
    expect(config.getModel()).to.equal('settings-model'); // From settings
    expect(config.getDebugMode()).to.be.true; // From settings
  });

  it('should enforce security restrictions', async () => {
    // Arrange
    process.argv = ['node', 'mycli', '--yolo'];

    const mockSettings = {
      merged: {
        security: { disableYoloMode: true },
      },
    };

    // Act & Assert
    await expect(loadCliConfig(process.cwd())).to.be.rejectedWith('YOLO mode disabled');
  });
});
```

**Coverage Goals:**

- Line coverage: 85%+
- Statement coverage: 85%+
- Function coverage: 90%+
- Branch coverage: 80%+ (all validation branches, coercion paths)

### Related Patterns

- **[Hierarchical Configuration Loading](#pattern-1-hierarchical-configuration-loading)** - CLI args override settings
- **[Config Object with Dependency Injection](#pattern-3-config-object-with-dependency-injection)** - CLI args populate Config
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type-safe argument interfaces

---

## Quick Reference

### Pattern Summary Table

| Pattern                    | Use When                        | Avoid When                        | Key Benefit                     |
| -------------------------- | ------------------------------- | --------------------------------- | ------------------------------- |
| Hierarchical Configuration | Multiple config scopes needed   | Single config file sufficient     | Clear precedence rules          |
| Settings Schema            | Type-safe settings required     | Schema overkill for simple config | Validation and merge strategies |
| Config Object DI           | Services need config access     | Config changes at runtime         | Centralized config access       |
| Feature Flags              | Gradual rollout needed          | All features always enabled       | A/B testing and experiments     |
| Model Config Service       | Multiple models with parameters | Single static model               | DRY model configuration         |
| CLI Arguments              | Runtime overrides needed        | File-only configuration           | User control and automation     |

### Code Snippets

**Hierarchical Configuration - Minimal Example:**

```typescript
import { loadSettings } from './settings.js';

const loaded = loadSettings(process.cwd(), schema);
const model = loaded.merged.model?.name ?? 'default-model';
```

**Settings Schema - Minimal Example:**

```typescript
const schema: SettingsSchema = {
  model: {
    type: 'object',
    default: {},
    properties: {
      name: { type: 'string', default: 'default-model' },
    },
  },
};
```

**Config Object DI - Minimal Example:**

```typescript
export class Config {
  constructor(private params: ConfigParameters) {}
  getModel(): string {
    return this.params.model;
  }
}

const config = new Config({ model: 'model-2.5-pro' });
const service = new MyService(config);
```

**Feature Flags - Minimal Example:**

```typescript
const enabled = await config.getBooleanFlag(ExperimentFlags.NEW_FEATURE);
if (enabled) {
  // Use new feature
} else {
  // Use old behavior
}
```

**Model Config Service - Minimal Example:**

```typescript
const service = new ModelConfigService(DEFAULT_MODEL_CONFIGS);
const resolved = service.getModelConfig('model-2.5-pro');
```

**CLI Arguments - Minimal Example:**

```typescript
const argv = await parseArguments();
const model = argv.model ?? settings.model?.name ?? 'default-model';
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Validation at Load Time:**

```typescript
function loadSettings(workspaceDir: string, schema: SettingsSchema): LoadedSettings {
  const settings = loadSettingsFile(path);

  // Validate against schema
  const errors = validateSettings(settings, schema);
  if (errors.length > 0) {
    throw new Error(`Invalid settings: ${errors.join(', ')}`);
  }

  return settings;
}
```

**Runtime Type Checking:**

```typescript
import { z } from 'zod';

const SettingsSchema = z.object({
  model: z
    .object({
      name: z.string().optional(),
      maxTokens: z.number().optional(),
    })
    .optional(),
  general: z
    .object({
      vimMode: z.boolean().optional(),
    })
    .optional(),
});

const validated = SettingsSchema.parse(rawSettings);
```

---

## Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type-safe configuration interfaces
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Configuration error handling
- **[Testing Patterns](./05-testing-patterns.md)** - Testing configuration loading
- **[Dependency Management](./08-dependency-management.md#pattern-1-dependency-injection)** - Config as injected dependency

---

## References

**Source Code Examples:**

- `examplecode/gemini/packages/cli/src/config/settings.ts` - Hierarchical configuration loading
- `examplecode/gemini/packages/cli/src/config/settingsSchema.ts` - Settings schema definition
- `examplecode/gemini/packages/core/src/config/config.ts` - Config class with dependency injection
- `examplecode/gemini/packages/core/src/code_assist/experiments/flagNames.ts` - Feature flag definitions
- `examplecode/gemini/packages/core/src/services/modelConfigService.ts` - Model configuration service
- `examplecode/gemini/packages/cli/src/config/cli-args.ts` - CLI argument parsing

**External Resources:**

- [Yargs Documentation](https://yargs.js.org/) - Command-line argument parsing library
- [JSON Schema](https://json-schema.org/) - Schema validation standard
- [The Twelve-Factor App: Config](https://12factor.net/config) - Configuration best practices
- [Zod Documentation](https://zod.dev/) - TypeScript-first schema validation

**Further Reading:**

- [Configuration Management Patterns](https://martinfowler.com/articles/config-management.html) - Martin Fowler on configuration patterns
- [Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) - Feature flag patterns and practices

---

## Changelog

- **2025-01-21**: Initial configuration management patterns documentation
- **2025-01-21**: Added Pattern 1 (Hierarchical Configuration Loading)
- **2025-01-21**: Added Pattern 2 (Settings Schema Definition)
- **2025-01-21**: Added Pattern 3 (Config Object with Dependency Injection)
- **2025-01-21**: Added Pattern 4 (Feature Flags and Experiments)
- **2025-01-21**: Added Pattern 5 (Model Configuration Service)
- **2025-01-21**: Added Pattern 6 (CLI Arguments Parsing)
- **2025-01-21**: Added Quick Reference, Enforcement, Related Patterns, References sections
