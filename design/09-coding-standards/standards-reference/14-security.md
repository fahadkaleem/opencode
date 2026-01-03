# Security Practices - Coding Standard

> **Standard ID**: STD-014
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js CLI Applications
> **Enforcement**: Process Validation + Automated Checks
> **Related Documents**:
>
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md)
> - [Error Handling Patterns](./06-error-handling.md)
> - [Configuration Management](./11-configuration-management.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory security practices for TypeScript/Node.js CLI applications. These practices protect against common vulnerabilities including command injection, path traversal, credential exposure, and unauthorized access. All security measures are designed to be enforceable through code review, automated scanning, and runtime validation.

### 1.2 Scope

**Applies to**:

- All input handling and validation
- Credential and secret management
- File system operations
- Shell command execution
- External URL handling
- Logging and telemetry
- Authorization and permission systems

**Does NOT apply to**:

- Network protocol security (TLS configuration)
- Infrastructure security (container hardening)
- Third-party service security policies

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism                |
| ---------- | ---------------------------------- | ------------------------ |
| **MUST**   | Mandatory; violations block merge  | Static analysis, CI gate |
| **SHOULD** | Recommended; exceptions documented | Code review              |
| **MAY**    | Optional enhancement               | Team discretion          |

---

## 2. Guiding Principles

| Principle              | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| Defense in Depth       | Multiple layers of security; no single point of failure |
| Least Privilege        | Grant minimum permissions required for operation        |
| Fail Secure            | When errors occur, default to denying access            |
| Input Distrust         | All external input is untrusted until validated         |
| Explicit over Implicit | Security decisions are visible and auditable            |

---

## 3. Process Overview

### 3.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Input Layer                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Schema    │  │    Path     │  │   Command   │  │     URL     │    │
│  │ Validation  │  │ Validation  │  │   Parsing   │  │ Validation  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Authorization Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │   Policy    │  │   Folder    │  │  Allowlist/ │                      │
│  │   Engine    │  │    Trust    │  │  Blocklist  │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Execution Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  Sandboxed  │  │   Secure    │  │  Encrypted  │                      │
│  │  Execution  │  │   Storage   │  │   Secrets   │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Output Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │    Error    │  │     Log     │  │  Telemetry  │                      │
│  │ Sanitization│  │ Sanitization│  │ Sanitization│                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Security Stages

| Stage         | Purpose                  | Input              | Output              | Gate                |
| ------------- | ------------------------ | ------------------ | ------------------- | ------------------- |
| Validation    | Reject malformed input   | Raw input          | Validated input     | Schema pass         |
| Authorization | Check permissions        | Validated request  | Allow/Deny decision | Policy pass         |
| Execution     | Perform operation safely | Authorized request | Operation result    | Sandbox constraints |
| Output        | Sanitize responses       | Raw output         | Safe output         | No PII leaked       |

---

## 4. Input Validation

### 4.1 Schema Validation

#### 4.1.1 Purpose

Validate all structured input against explicit schemas before processing. Use Zod for TypeScript-first validation with runtime type checking.

#### 4.1.2 Implementation Pattern

```typescript
import { z } from 'zod';

// Define schema with explicit constraints
const createTaskInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().datetime().optional(),
});

type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Validate at system boundary
function createTask(rawInput: unknown): Task {
  // Throws ZodError if validation fails
  const input = createTaskInputSchema.parse(rawInput);

  // Input is now typed and validated
  return taskRepository.create(input);
}
```

#### 4.1.3 Validation Checklist

- [ ] All external input validated against schema
- [ ] Schemas define maximum lengths for strings
- [ ] Schemas use enums for known value sets
- [ ] Validation occurs at system boundary, not deep in code
- [ ] Validation errors do not expose internal details

---

### 4.2 Path Validation

#### 4.2.1 Purpose

Prevent path traversal attacks by ensuring all file paths remain within allowed workspace boundaries.

#### 4.2.2 When to Execute

- Before any file read operation
- Before any file write operation
- Before any directory listing
- When processing user-provided file paths

#### 4.2.3 Implementation Pattern

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';

class AllowedPathChecker {
  private readonly allowedDirectories: string[];

  constructor(workingDirectory: string, additionalPaths: string[] = []) {
    this.allowedDirectories = [workingDirectory, ...additionalPaths];
  }

  /**
   * Validates that a path is within allowed directories.
   * Resolves symlinks to prevent symlink-based escapes.
   */
  isPathAllowed(inputPath: string, cwd: string): boolean {
    const resolvedPath = this.safelyResolvePath(inputPath, cwd);
    if (!resolvedPath) {
      return false; // Cannot resolve = deny
    }

    return this.allowedDirectories.some((allowedDir) => {
      const resolvedDir = this.safelyResolvePath(allowedDir, cwd);
      if (!resolvedDir) return false;
      return this.isSubpath(resolvedPath, resolvedDir);
    });
  }

  private safelyResolvePath(inputPath: string, cwd: string): string | null {
    try {
      const resolved = path.resolve(cwd, inputPath);

      // Walk up to find existing ancestor and resolve symlinks
      let current = resolved;
      while (current && current !== path.dirname(current)) {
        if (fs.existsSync(current)) {
          const canonical = fs.realpathSync(current);
          const relative = path.relative(current, resolved);
          return path.join(canonical, relative);
        }
        current = path.dirname(current);
      }

      return resolved;
    } catch {
      return null; // Resolution failed = deny
    }
  }

  private isSubpath(targetPath: string, parentDir: string): boolean {
    const relative = path.relative(parentDir, targetPath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  }
}
```

#### 4.2.4 Path Argument Detection

Automatically detect path-like arguments in tool parameters:

```typescript
private collectPathsToCheck(
  args: Record<string, unknown>,
  excludedArgs: string[] = [],
): Array<{ path: string; argName: string }> {
  const paths: Array<{ path: string; argName: string }> = [];

  const pathIndicators = ['path', 'directory', 'file', 'source', 'destination'];

  for (const [key, value] of Object.entries(args)) {
    if (excludedArgs.includes(key)) continue;

    if (typeof value === 'string') {
      const isPathLike = pathIndicators.some((indicator) =>
        key.toLowerCase().includes(indicator)
      );
      if (isPathLike) {
        paths.push({ path: value, argName: key });
      }
    }
  }

  return paths;
}
```

---

### 4.3 URL Validation

#### 4.3.1 Purpose

Prevent protocol injection and command injection through URL handling.

#### 4.3.2 Implementation Pattern

```typescript
import { URL } from 'node:url';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const CONTROL_CHAR_REGEX = /[\r\n\x00-\x1f]/;

function validateUrl(url: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL format`);
  }

  // Protocol whitelist
  if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(`Unsafe protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are allowed.`);
  }

  // Reject control characters (prevent header injection)
  if (CONTROL_CHAR_REGEX.test(url)) {
    throw new Error('URL contains invalid characters');
  }
}
```

---

## 5. Secrets Management

### 5.1 Environment Variables

#### 5.1.1 Purpose

Securely load and manage sensitive configuration from environment.

#### 5.1.2 Rules

| Rule                                              | Enforcement |
| ------------------------------------------------- | ----------- |
| Never hardcode secrets in source code             | MUST        |
| Load secrets from environment variables only      | MUST        |
| Validate required secrets exist at startup        | MUST        |
| Never log secret values                           | MUST        |
| Use separate env files for different environments | SHOULD      |

#### 5.1.3 Implementation Pattern

```typescript
interface RequiredSecrets {
  apiKey: string;
  databaseUrl: string;
}

function loadSecrets(): RequiredSecrets {
  const apiKey = process.env['API_KEY'];
  const databaseUrl = process.env['DATABASE_URL'];

  const missing: string[] = [];
  if (!apiKey) missing.push('API_KEY');
  if (!databaseUrl) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return { apiKey, databaseUrl };
}
```

#### 5.1.4 Environment File Loading

```typescript
const EXCLUDED_PROJECT_ENV_VARS = new Set(['DEBUG', 'DEBUG_MODE']);

function loadProjectEnvFile(envFilePath: string, isTrustedFolder: boolean): void {
  // Only load from trusted folders
  if (!isTrustedFolder) {
    return;
  }

  const envContent = fs.readFileSync(envFilePath, 'utf-8');

  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;

    // Skip excluded variables
    if (EXCLUDED_PROJECT_ENV_VARS.has(key)) continue;

    // Don't overwrite existing environment variables
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
```

---

### 5.2 Encrypted Token Storage

#### 5.2.1 Purpose

Store sensitive tokens (OAuth, API keys) encrypted at rest with machine-specific keys.

#### 5.2.2 Implementation Pattern

```typescript
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';

class EncryptedTokenStorage {
  private readonly encryptionKey: Buffer;
  private readonly storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.encryptionKey = this.deriveEncryptionKey();
  }

  /**
   * Derive machine-specific encryption key.
   * Uses hostname + username as salt to bind tokens to this machine.
   */
  private deriveEncryptionKey(): Buffer {
    const salt = `${os.hostname()}-${os.userInfo().username}-app-name`;
    return crypto.scryptSync('app-oauth-tokens', salt, 32);
  }

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async save(data: Record<string, unknown>): Promise<void> {
    const dir = path.dirname(this.storagePath);

    // Create directory with owner-only access
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });

    const json = JSON.stringify(data, null, 2);
    const encrypted = this.encrypt(json);

    // Write file with owner-only read/write
    await fs.writeFile(this.storagePath, encrypted, { mode: 0o600 });
  }

  async load(): Promise<Record<string, unknown>> {
    try {
      const encrypted = await fs.readFile(this.storagePath, 'utf-8');
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }
}
```

### 5.3 File Permission Requirements

| File Type        | Permission       | Mode    | Rationale                                |
| ---------------- | ---------------- | ------- | ---------------------------------------- |
| Token storage    | Owner read/write | `0o600` | Prevent other users from reading secrets |
| Config directory | Owner only       | `0o700` | Prevent directory listing by others      |
| Log files        | Owner read/write | `0o600` | Logs may contain sensitive context       |

---

## 6. Command Execution Security

### 6.1 Shell Command Parsing

#### 6.1.1 Purpose

Parse shell commands to extract individual commands for permission checking. Reject unparseable commands as a security measure.

#### 6.1.2 Implementation Pattern

```typescript
interface CommandParseResult {
  commands: Array<{ name: string; text: string }>;
  hasError: boolean;
}

function parseCommand(command: string): CommandParseResult {
  // Use a proper parser (tree-sitter for bash, PowerShell AST for PowerShell)
  const parser = createShellParser();

  try {
    const ast = parser.parse(command);

    if (ast.hasError) {
      return { commands: [], hasError: true };
    }

    const commands = extractCommandsFromAst(ast);
    return { commands, hasError: false };
  } catch {
    return { commands: [], hasError: true };
  }
}

function checkCommandPermissions(
  command: string,
  allowlist: Set<string>,
  blocklist: Set<string>
): { allowed: boolean; reason?: string } {
  const parseResult = parseCommand(command);

  // SECURITY: Reject unparseable commands
  if (parseResult.hasError) {
    return {
      allowed: false,
      reason: 'Command rejected because it could not be parsed safely',
    };
  }

  // Check blocklist first (highest priority)
  for (const cmd of parseResult.commands) {
    if (blocklist.has(cmd.name)) {
      return {
        allowed: false,
        reason: `Command '${cmd.name}' is blocked by configuration`,
      };
    }
  }

  // Check allowlist
  for (const cmd of parseResult.commands) {
    if (!allowlist.has(cmd.name) && !allowlist.has('*')) {
      return {
        allowed: false,
        reason: `Command '${cmd.name}' is not in the allowed list`,
      };
    }
  }

  return { allowed: true };
}
```

### 6.2 Secure Process Spawning

#### 6.2.1 Rules

| Rule                                                   | Enforcement |
| ------------------------------------------------------ | ----------- |
| Use `execFile` instead of `exec` for external commands | MUST        |
| Set `shell: false` in spawn options                    | MUST        |
| Pass arguments as array, not concatenated string       | MUST        |
| Clear SHELL environment variable when needed           | SHOULD      |
| Use `quote` from `shell-quote` for argument escaping   | MUST        |

#### 6.2.2 Implementation Pattern

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { quote } from 'shell-quote';

const execFileAsync = promisify(execFile);

async function executeCommandSecurely(
  executable: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  const options = {
    cwd,
    // CRITICAL: Avoid shell interpretation
    shell: false,
    env: {
      ...process.env,
      // Clear SHELL to prevent shell-specific behavior
      SHELL: undefined,
    },
  };

  return execFileAsync(executable, args, options);
}

// Shell argument escaping by shell type
function escapeShellArg(arg: string, shell: 'bash' | 'powershell' | 'cmd'): string {
  switch (shell) {
    case 'powershell':
      return `'${arg.replace(/'/g, "''")}'`;
    case 'cmd':
      return `"${arg.replace(/"/g, '""')}"`;
    case 'bash':
    default:
      return quote([arg]);
  }
}
```

### 6.3 Secure Browser Launching

```typescript
import { execFile } from 'node:child_process';
import { platform } from 'node:os';

async function openBrowserSecurely(url: string): Promise<void> {
  // Validate URL first
  validateUrl(url);

  const platformName = platform();
  let command: string;
  let args: string[];

  switch (platformName) {
    case 'darwin':
      command = 'open';
      args = [url];
      break;
    case 'win32':
      // Use PowerShell to avoid cmd.exe injection vulnerabilities
      command = 'powershell.exe';
      args = [
        '-NoProfile',
        '-NonInteractive',
        '-WindowStyle',
        'Hidden',
        '-Command',
        `Start-Process '${url.replace(/'/g, "''")}'`,
      ];
      break;
    case 'linux':
      command = 'xdg-open';
      args = [url];
      break;
    default:
      throw new Error(`Unsupported platform: ${platformName}`);
  }

  const options = {
    env: { ...process.env, SHELL: undefined },
    detached: true,
    stdio: 'ignore' as const,
  };

  await promisify(execFile)(command, args, options);
}
```

---

## 7. Authorization

### 7.1 Policy Engine

#### 7.1.1 Purpose

Evaluate tool calls against configurable security policies with priority-based rules.

#### 7.1.2 Decision Types

| Decision   | Meaning                     | Behavior                     |
| ---------- | --------------------------- | ---------------------------- |
| `ALLOW`    | Permit without confirmation | Execute immediately          |
| `DENY`     | Block execution             | Return error, do not execute |
| `ASK_USER` | Require confirmation        | Prompt user before execution |

#### 7.1.3 Implementation Pattern

```typescript
enum PolicyDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  ASK_USER = 'ask_user',
}

interface PolicyRule {
  toolName?: string; // Tool name pattern (supports wildcards)
  argsPattern?: RegExp; // Regex to match against args
  decision: PolicyDecision;
  priority: number; // Higher = evaluated first
}

class PolicyEngine {
  private readonly rules: PolicyRule[];
  private readonly defaultDecision: PolicyDecision;
  private readonly isNonInteractive: boolean;

  constructor(config: {
    rules: PolicyRule[];
    defaultDecision?: PolicyDecision;
    nonInteractive?: boolean;
  }) {
    // Sort by priority descending
    this.rules = config.rules.sort((a, b) => b.priority - a.priority);
    this.defaultDecision = config.defaultDecision ?? PolicyDecision.ASK_USER;
    this.isNonInteractive = config.nonInteractive ?? false;
  }

  check(toolName: string, args: Record<string, unknown>): PolicyDecision {
    const stringifiedArgs = JSON.stringify(args);

    for (const rule of this.rules) {
      if (this.ruleMatches(rule, toolName, stringifiedArgs)) {
        return this.applyNonInteractiveMode(rule.decision);
      }
    }

    return this.applyNonInteractiveMode(this.defaultDecision);
  }

  private ruleMatches(rule: PolicyRule, toolName: string, stringifiedArgs: string): boolean {
    // Check tool name pattern
    if (rule.toolName) {
      if (rule.toolName.endsWith('*')) {
        const prefix = rule.toolName.slice(0, -1);
        if (!toolName.startsWith(prefix)) return false;
      } else if (toolName !== rule.toolName) {
        return false;
      }
    }

    // Check args pattern
    if (rule.argsPattern && !rule.argsPattern.test(stringifiedArgs)) {
      return false;
    }

    return true;
  }

  private applyNonInteractiveMode(decision: PolicyDecision): PolicyDecision {
    // In non-interactive mode, convert ASK_USER to DENY
    if (this.isNonInteractive && decision === PolicyDecision.ASK_USER) {
      return PolicyDecision.DENY;
    }
    return decision;
  }
}
```

### 7.2 Folder Trust System

#### 7.2.1 Purpose

Restrict privileged operations to explicitly trusted directories.

#### 7.2.2 Trust Levels

| Level          | Meaning                   | Capabilities                              |
| -------------- | ------------------------- | ----------------------------------------- |
| `TRUSTED`      | Explicitly trusted folder | Full tool access, auto-approve enabled    |
| `TRUST_PARENT` | Parent directory trusted  | Inherits trust from parent                |
| `UNTRUSTED`    | Not trusted               | Restricted mode, manual approval required |

#### 7.2.3 Implementation Pattern

```typescript
import * as path from 'node:path';
import * as fs from 'node:fs';

interface TrustConfig {
  trustedPaths: string[];
  trustParentPaths: string[];
}

class FolderTrustManager {
  private readonly config: TrustConfig;
  private readonly configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  isPathTrusted(targetPath: string): boolean {
    const normalizedTarget = path.normalize(targetPath);

    // Check direct trust
    for (const trustedPath of this.config.trustedPaths) {
      const normalizedTrusted = path.normalize(trustedPath);
      if (normalizedTarget === normalizedTrusted) {
        return true;
      }
    }

    // Check parent trust
    for (const parentPath of this.config.trustParentPaths) {
      const normalizedParent = path.normalize(parentPath);
      if (normalizedTarget.startsWith(normalizedParent + path.sep)) {
        return true;
      }
    }

    return false;
  }

  addTrustedPath(targetPath: string): void {
    const normalized = path.normalize(targetPath);
    if (!this.config.trustedPaths.includes(normalized)) {
      this.config.trustedPaths.push(normalized);
      this.saveConfig();
    }
  }

  private loadConfig(): TrustConfig {
    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { trustedPaths: [], trustParentPaths: [] };
    }
  }

  private saveConfig(): void {
    const dir = path.dirname(this.configPath);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), { mode: 0o600 });
  }
}
```

---

## 8. Output Sanitization

### 8.1 Log Sanitization

#### 8.1.1 Purpose

Remove sensitive information from logs and telemetry to protect user privacy.

#### 8.1.2 What to Sanitize

| Data Type             | Action                | Example                                |
| --------------------- | --------------------- | -------------------------------------- |
| Full file paths       | Extract basename only | `/home/user/secret.txt` → `secret.txt` |
| Command arguments     | Remove entirely       | `curl --header "Auth: xyz"` → `curl`   |
| Environment variables | Mask values           | `API_KEY=abc123` → `API_KEY=***`       |
| Usernames in paths    | Remove                | `/home/johndoe/` → `/home/*/`          |
| API keys/tokens       | Never log             | `Bearer xyz` → `[REDACTED]`            |

#### 8.1.3 Implementation Pattern

```typescript
/**
 * Sanitize hook/command name to remove sensitive information.
 * Extracts base command name without arguments or paths.
 */
function sanitizeCommandForLogging(command: string): string {
  if (!command?.trim()) {
    return 'unknown-command';
  }

  // Get first part (command name)
  const parts = command.trim().split(/\s+/);
  const commandPart = parts[0];

  if (!commandPart) {
    return 'unknown-command';
  }

  // If it's a path, extract just the basename
  if (commandPart.includes('/') || commandPart.includes('\\')) {
    const pathParts = commandPart.split(/[/\\]/);
    return pathParts[pathParts.length - 1] || 'unknown-command';
  }

  return commandPart;
}

/**
 * Sanitize file paths to remove username components.
 */
function sanitizePathForLogging(filePath: string): string {
  const homeDir = os.homedir();
  if (filePath.startsWith(homeDir)) {
    return filePath.replace(homeDir, '~');
  }
  return filePath;
}
```

### 8.2 Error Message Security

#### 8.2.1 Rules

| Rule                                                 | Enforcement |
| ---------------------------------------------------- | ----------- |
| Never expose stack traces to end users               | MUST        |
| Never include file paths in user-facing errors       | MUST        |
| Never include credentials in error messages          | MUST        |
| Log full details internally, show summary externally | SHOULD      |

#### 8.2.2 Implementation Pattern

```typescript
class SecureError extends Error {
  public readonly userMessage: string;
  public readonly internalDetails: string;

  constructor(userMessage: string, internalDetails: string) {
    super(userMessage);
    this.name = 'SecureError';
    this.userMessage = userMessage;
    this.internalDetails = internalDetails;
  }
}

function handleError(error: unknown): void {
  if (error instanceof SecureError) {
    // Log full details internally
    logger.error('Operation failed', {
      message: error.internalDetails,
      stack: error.stack,
    });

    // Show sanitized message to user
    console.error(error.userMessage);
  } else {
    // Unknown error - be extra careful
    logger.error('Unexpected error', { error });
    console.error('An unexpected error occurred');
  }
}
```

---

## 9. Anti-Patterns

### 9.1 Forbidden Patterns

| Pattern                                        | Why Forbidden          | Correct Approach               |
| ---------------------------------------------- | ---------------------- | ------------------------------ |
| `exec(userInput)`                              | Command injection      | Use `execFile` with args array |
| `shell: true` in spawn                         | Shell interpretation   | Use `shell: false`             |
| `eval(userInput)`                              | Code injection         | Never use eval with user input |
| Hardcoded secrets                              | Credential exposure    | Use environment variables      |
| `fs.readFileSync(userPath)` without validation | Path traversal         | Validate path is in workspace  |
| `console.log(error.stack)`                     | Information disclosure | Sanitize before logging        |
| `JSON.parse(untrustedInput)` without try/catch | DoS via malformed JSON | Wrap in try/catch              |
| String concatenation for SQL                   | SQL injection          | Use parameterized queries      |

### 9.2 Code Examples

```typescript
// ANTI-PATTERN: Shell command with user input
const command = `ls ${userProvidedPath}`;
exec(command); // Command injection possible!

// CORRECT: Use execFile with arguments array
execFile('ls', [userProvidedPath], { shell: false });

// ---

// ANTI-PATTERN: Hardcoded secret
const apiKey = 'sk-abc123def456';

// CORRECT: Environment variable
const apiKey = process.env['API_KEY'];
if (!apiKey) throw new Error('API_KEY required');

// ---

// ANTI-PATTERN: Unvalidated path
const content = fs.readFileSync(userProvidedPath);

// CORRECT: Validate path first
if (!pathChecker.isPathAllowed(userProvidedPath, cwd)) {
  throw new Error('Path outside workspace');
}
const content = fs.readFileSync(userProvidedPath);

// ---

// ANTI-PATTERN: Exposing error details
catch (error) {
  res.send(`Error: ${error.message}\n${error.stack}`);
}

// CORRECT: Sanitize error output
catch (error) {
  logger.error('Operation failed', { error });
  res.send('An error occurred processing your request');
}
```

---

## 10. Checklists

### 10.1 Security Code Review Checklist

#### Input Handling

- [ ] All external input validated against schema
- [ ] File paths validated against workspace boundaries
- [ ] URLs validated for protocol (HTTP/HTTPS only)
- [ ] Command inputs parsed and validated before execution

#### Secrets

- [ ] No hardcoded secrets in code
- [ ] Secrets loaded from environment variables
- [ ] Sensitive files use restrictive permissions (0o600/0o700)
- [ ] Token storage is encrypted

#### Command Execution

- [ ] Using `execFile` instead of `exec`
- [ ] `shell: false` set in spawn options
- [ ] Arguments passed as array, not concatenated string
- [ ] User input is not directly interpolated into commands

#### Output

- [ ] Error messages do not expose internal paths
- [ ] Logs do not contain secrets or credentials
- [ ] Stack traces not shown to end users
- [ ] Telemetry data is sanitized

### 10.2 Pre-Deployment Security Checklist

- [ ] All dependencies audited (`npm audit`)
- [ ] No high/critical vulnerabilities in dependencies
- [ ] Environment variables documented
- [ ] Secrets management verified
- [ ] File permissions verified for config files
- [ ] Error handling tested for information disclosure

---

## 11. Enforcement

### 11.1 Automated Checks

| Check                      | Tool                  | Configuration                   |
| -------------------------- | --------------------- | ------------------------------- |
| Dependency vulnerabilities | `npm audit`           | `--audit-level=high`            |
| Hardcoded secrets          | ESLint + custom rules | `no-hardcoded-credentials`      |
| Unsafe exec usage          | ESLint                | `security/detect-child-process` |
| eval usage                 | ESLint                | `no-eval`                       |

### 11.2 ESLint Configuration

```javascript
module.exports = {
  plugins: ['security'],
  rules: {
    // Detect potential security issues
    'security/detect-child-process': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',

    // Prevent eval
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
  },
};
```

### 11.3 CI/CD Integration

```yaml
name: Security Checks
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Run security linting
        run: npm run lint:security

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
```

---

## 12. Exceptions

### 12.1 Exception Process

1. **Request**: Document exception in code review
2. **Justification**: Explain why standard cannot be followed
3. **Mitigation**: Describe alternative security controls
4. **Approval**: Security-aware team member must approve
5. **Documentation**: Add exception comment in code

### 12.2 Valid Exception Scenarios

| Scenario                                      | Justification Required                | Approver      |
| --------------------------------------------- | ------------------------------------- | ------------- |
| Third-party library requires `eval`           | Library documentation, no alternative | Tech Lead     |
| Performance-critical path needs `shell: true` | Benchmark data, mitigations           | Security Lead |
| Legacy integration uses non-standard auth     | Migration plan with timeline          | Tech Lead     |

### 12.3 Exception Documentation

```typescript
/**
 * SECURITY EXCEPTION: STD-014 Section 6.2
 * Reason: Legacy API requires shell glob expansion
 * Mitigation: Input is validated against allowlist before execution
 * Approved: 2025-01-15, Security Lead
 * Review Date: 2025-07-15
 */
```

---

## 13. Quick Reference

### 13.1 Security Summary

| Category          | Key Rule                                          |
| ----------------- | ------------------------------------------------- |
| Input Validation  | Validate all input with Zod schemas at boundaries |
| Path Security     | Always validate paths are within workspace        |
| Command Execution | Use `execFile` with `shell: false`                |
| Secrets           | Never hardcode; use env vars + encrypted storage  |
| Authorization     | Default deny; explicit allow via policy engine    |
| Output            | Sanitize logs and errors; never expose internals  |

### 13.2 Command Quick Reference

```bash
# Audit dependencies
npm audit --audit-level=high

# Run security linting
npm run lint -- --plugin security

# Check for hardcoded secrets
npx secretlint "**/*"
```

### 13.3 File Permission Summary

```
Config directory:  0o700 (drwx------)
Token files:       0o600 (-rw-------)
Log files:         0o600 (-rw-------)
```

---

## 14. Traceability

### 14.1 Procedure Index

| Procedure ID | Name                | Section | Trigger             |
| ------------ | ------------------- | ------- | ------------------- |
| SEC-001      | Input Validation    | 4       | All external input  |
| SEC-002      | Path Validation     | 4.2     | File operations     |
| SEC-003      | Secret Management   | 5       | Credential handling |
| SEC-004      | Command Security    | 6       | Shell execution     |
| SEC-005      | Authorization       | 7       | Tool invocation     |
| SEC-006      | Output Sanitization | 8       | Logging/errors      |

### 14.2 Related Standards

| Standard               | Relationship          |
| ---------------------- | --------------------- |
| STD-006 Error Handling | Secure error patterns |
| STD-011 Configuration  | Secure config loading |
| STD-013 Logging        | Log sanitization      |

---

## 15. Open Questions

| Question ID | Question                                       | Owner | Status  |
| ----------- | ---------------------------------------------- | ----- | ------- |
| SQ-001      | Should we implement CSP for web UI components? | TBD   | Pending |
| SQ-002      | Rate limiting strategy for API endpoints?      | TBD   | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
