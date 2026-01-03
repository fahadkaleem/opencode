# Security Practices

Reference: `design/09-coding-standards/standards-reference/14-security.md`

## Scope

**Applies to**: input handling/validation, credential/secret management, file system operations, shell command execution, external URL handling, logging/telemetry, authorization/permission systems.

**Does NOT apply to**: network protocol security (TLS), infrastructure security (containers), third-party service security policies.

## Enforcement Levels

- **Required** (blocks merge): Static analysis and CI gates enforce these rules automatically
- **Recommended** (documented exceptions): Code review catches these; exceptions require justification
- **Optional**: Team discretion for additional hardening

<security_rules>

## Guiding Principles

These principles inform all security decisions:

- **Defense in Depth**: Layer multiple security controls so no single point of failure compromises the system
- **Least Privilege**: Grant only the minimum permissions required for an operation to limit blast radius
- **Fail Secure**: When errors occur, default to denying access rather than allowing it
- **Input Distrust**: Treat all external input as untrusted until validated at the boundary
- **Explicit over Implicit**: Make security decisions visible and auditable, not hidden in defaults

## Security Stages

Every operation flows through these stages:

| Stage             | Input              | Output              | Gate                |
| ----------------- | ------------------ | ------------------- | ------------------- |
| **Validation**    | Raw input          | Validated input     | Schema pass         |
| **Authorization** | Validated request  | Allow/Deny decision | Policy pass         |
| **Execution**     | Authorized request | Operation result    | Sandbox constraints |
| **Output**        | Raw output         | Safe output         | No PII leaked       |

## Input Validation

Input validation prevents injection attacks and malformed data from reaching business logic.

### Schema Validation

Validate all structured input at system boundaries with Zod. Schema-first validation catches malformed data early and provides type safety.

```typescript
// ✓ Explicit constraints prevent oversized payloads and invalid values
const requestSchema = z.object({
  name: z.string().max(255),
  type: z.enum(['workflow', 'phase', 'command']),
  timeout: z.number().int().positive().max(300000),
});

// ✗ No constraints allows unbounded input
const requestSchema = z.object({
  name: z.string(),
  type: z.string(),
  timeout: z.number(),
});
```

**Validation checklist**:

- All external input validated at boundary (not deep in code)
- String fields have max lengths defined
- Known value sets use enums
- Validation errors do not expose internal details

### Path Traversal Protection

Validate user-provided paths stay within allowed workspace boundaries. Path traversal attacks (`../../../etc/passwd`) can access arbitrary files.

**When to validate**: file read, file write, directory listing, any user-provided file path.

**Path validation requirements**:

1. Resolve paths via `path.resolve(cwd, inputPath)` to get absolute path
2. Resolve symlinks by walking up to existing ancestor (`fs.realpathSync`)
3. Deny on resolution failure (fail secure)
4. Check allowed directories via `path.relative` - deny when result starts with `..` or is absolute

```typescript
// ✓ Validate path is within workspace before any file operation
function validatePath(userPath: string, workspace: string): string {
  const resolved = path.resolve(workspace, userPath);
  const relative = path.relative(workspace, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new PathTraversalError('Path outside workspace');
  }
  return resolved;
}

// ✗ Direct use of user input allows traversal
fs.readFileSync(userPath);
```

**Path argument detection**: Auto-detect path-like arguments by key name containing `path`, `directory`, `file`, `source`, or `destination` (case-insensitive). Collect `{ path, argName }` for validation, skipping `excludedArgs`.

### URL Validation

Only allow `http:` and `https:` protocols. Other protocols (file:, javascript:, data:) enable local file access or code injection.

```typescript
// ✓ Validate protocol and reject control characters
const CONTROL_CHAR_REGEX = /[\r\n\x00-\x1f]/;

function validateUrl(input: string): URL {
  if (CONTROL_CHAR_REGEX.test(input)) {
    throw new Error('URL contains control characters');
  }
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP(S) URLs allowed');
  }
  return url;
}

// ✗ No validation allows protocol injection
fetch(userProvidedUrl);
```

## Secrets Management

### Environment Variables

Secrets belong in environment variables, not source code. Hardcoded secrets get committed to version control and exposed.

**Rules**:

- Load secrets from environment variables only
- Validate required secrets exist at startup (fail fast)
- Never log secret values
- Use separate env files for different environments

```typescript
// ✓ Load and validate secrets at startup
function loadSecrets(): Secrets {
  const required = ['API_KEY', 'DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return {
    apiKey: process.env.API_KEY!,
    databaseUrl: process.env.DATABASE_URL!,
    jwtSecret: process.env.JWT_SECRET!,
  };
}

// ✗ Hardcoded secrets
const API_KEY = 'sk-abc123...';
```

**Trusted env file loading**: Only load project env files from trusted folders. Parse `KEY=value` lines, skip excluded vars (`DEBUG`, `DEBUG_MODE`), and do not overwrite existing `process.env` values.

### Encrypted Token Storage

Store sensitive tokens encrypted at rest with a machine-specific key. Plaintext token files are readable by any process.

**Encryption requirements**:

- Derive key via `crypto.scryptSync('app-oauth-tokens', salt, 32)`
- Salt: `` `${os.hostname()}-${os.userInfo().username}-app-name` ``
- Encrypt with `aes-256-gcm` using random 16-byte IV
- Storage format: `iv:authTag:ciphertext`
- On read: return `{}` for `ENOENT`, otherwise rethrow

### File Permissions

Restrictive permissions prevent other users from reading sensitive files.

| Resource         | Permission | Reason                                   |
| ---------------- | ---------- | ---------------------------------------- |
| Token storage    | `0o600`    | Prevent other users from reading secrets |
| Config directory | `0o700`    | Prevent directory listing by others      |
| Log files        | `0o600`    | Logs may contain sensitive context       |

```typescript
// ✓ Create dirs and files with restrictive permissions
await fs.mkdir(configDir, { mode: 0o700, recursive: true });
await fs.writeFile(tokenPath, encrypted, { mode: 0o600 });

// ✗ Default permissions are world-readable
await fs.writeFile(tokenPath, encrypted);
```

## Command Execution Security

### Shell Command Parsing

Parse shell commands with a real parser (tree-sitter for bash, PowerShell AST for PowerShell) to extract individual commands. Simple string splitting misses shell features like pipes, redirects, and quoting.

**Reject unparseable commands** (`hasError`) as a security measure - if we can't understand the command, we can't secure it.

### Allowlist/Blocklist Evaluation

Blocklist takes highest priority. Defense in depth means blocking known-dangerous commands even if they match an allowlist pattern.

**Evaluation order**:

1. If any extracted command is blocked → deny with `Command '<name>' is blocked by configuration`
2. If allowlist exists and doesn't contain command or `*` → deny with `Command '<name>' is not in the allowed list`
3. Otherwise → allow

### Secure Process Spawning

Use `execFile` with argument arrays instead of `exec` with shell strings. Shell interpretation enables injection attacks.

**Rules**:

- Use `execFile` instead of `exec` for external commands
- Set `shell: false` in spawn options
- Pass arguments as array, not concatenated string
- Use `quote` from `shell-quote` for argument escaping when shell is unavoidable
- Clear `SHELL` environment variable when needed

```typescript
// ✓ Arguments as array, no shell interpretation
import { execFile } from 'node:child_process';
execFile('git', ['log', '--oneline', '-n', '10'], { shell: false });

// ✗ Shell string allows injection via userInput
import { exec } from 'node:child_process';
exec(`git log --author="${userInput}"`);
```

**Escaping by shell type** (when shell is unavoidable):

- PowerShell: wrap with single quotes, double internal `'`
- cmd: wrap with double quotes, double internal `"`
- bash: use `quote([arg])` from `shell-quote`

### Secure Browser Launching

Launching URLs must validate the URL first and avoid shell injection.

```typescript
// ✓ Platform-specific secure launch
function openBrowser(url: string): void {
  validateUrl(url); // Validate first

  const options = {
    env: { ...process.env, SHELL: undefined },
    detached: true,
    stdio: 'ignore' as const,
  };

  switch (process.platform) {
    case 'darwin':
      spawn('open', [url], options);
      break;
    case 'linux':
      spawn('xdg-open', [url], options);
      break;
    case 'win32':
      // Use PowerShell to avoid cmd.exe injection
      const escaped = url.replace(/'/g, "''");
      spawn(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-WindowStyle',
          'Hidden',
          '-Command',
          `Start-Process '${escaped}'`,
        ],
        options
      );
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}
```

## Authorization

### Policy Engine

The policy engine evaluates tool execution requests against configured rules.

**Decisions**:
| Decision | Behavior |
|----------|----------|
| `ALLOW` | Execute immediately without confirmation |
| `DENY` | Return error, do not execute |
| `ASK_USER` | Prompt user before execution |

**Evaluation logic**:

1. Sort rules by `priority` descending
2. Match tool name patterns (exact or wildcard `prefix*`)
3. Match args via `argsPattern` against `JSON.stringify(args)`
4. Default decision is `ASK_USER` unless configured
5. In non-interactive mode, convert `ASK_USER` → `DENY` (fail secure)

### Folder Trust Levels

Trust levels determine what operations are permitted in a directory.

| Level          | Behavior                                  |
| -------------- | ----------------------------------------- |
| `TRUSTED`      | Full tool access, auto-approve enabled    |
| `TRUST_PARENT` | Inherits trust from parent directory      |
| `UNTRUSTED`    | Restricted mode, manual approval required |

**Trust evaluation**:

- Normalize paths before comparison
- Direct trust: exact path match
- Parent trust: prefix + `path.sep` match
- Persist trust config to disk with directory `0o700` and config file `0o600`

## Output Sanitization

### Log Sanitization

Logs must not leak sensitive information. Attackers with log access shouldn't gain credentials or reconnaissance data.

| Data Type             | Sanitization          | Example                                |
| --------------------- | --------------------- | -------------------------------------- |
| File paths            | Extract basename only | `/home/user/secret.txt` → `secret.txt` |
| Command arguments     | Remove entirely       | `curl --header "Auth: xyz"` → `curl`   |
| Environment variables | Mask values           | `API_KEY=abc123` → `API_KEY=***`       |
| Usernames in paths    | Remove                | `/home/johndoe/` → `/home/*/`          |
| API keys/tokens       | Redact                | `Bearer xyz` → `[REDACTED]`            |

**Command sanitization**: `sanitizeCommandForLogging` returns first token only; if token contains `/` or `\`, return basename; return `'unknown-command'` when empty.

**Path sanitization**: Replace `os.homedir()` prefix with `~` to remove username components.

### Error Message Security

Error messages must not reveal internal details that help attackers.

**Rules**:

- Never expose stack traces to end users
- Never include file paths in user-facing errors
- Never include credentials in error messages
- Log full details internally, show summary externally

```typescript
// ✓ Separate internal logging from user-facing message
class SecureError extends Error {
  constructor(
    public userMessage: string,
    public internalDetails: string
  ) {
    super(userMessage);
  }
}

try {
  await operation();
} catch (error) {
  if (error instanceof SecureError) {
    logger.error(error.internalDetails, { stack: error.stack });
    showUser(error.userMessage);
  } else {
    logger.error('Unknown error', { error });
    showUser('An unexpected error occurred');
  }
}

// ✗ Exposing stack trace to user
showUser(error.stack);
```

## Secure Alternatives to Dangerous Patterns

Instead of dangerous patterns, use these secure alternatives:

| Dangerous Pattern                              | Risk                   | Secure Alternative                  |
| ---------------------------------------------- | ---------------------- | ----------------------------------- |
| `exec(userInput)`                              | Command injection      | Use `execFile` with args array      |
| `shell: true` in spawn                         | Shell interpretation   | Use `shell: false`                  |
| `eval(userInput)`                              | Code injection         | Never use eval with user input      |
| Hardcoded secrets                              | Credential exposure    | Use environment variables           |
| `fs.readFileSync(userPath)` without validation | Path traversal         | Validate path is in workspace first |
| `console.log(error.stack)`                     | Information disclosure | Sanitize before logging             |
| `JSON.parse(untrustedInput)` without try/catch | DoS via malformed JSON | Wrap in try/catch                   |
| String concatenation for SQL                   | SQL injection          | Use parameterized queries           |

## Automated Enforcement

### ESLint Security Rules

Configure ESLint to catch common security issues:

```javascript
// eslint.config.js security rules
{
  'security/detect-child-process': 'error',
  'security/detect-eval-with-expression': 'error',
  'security/detect-non-literal-fs-filename': 'warn',
  'security/detect-non-literal-require': 'warn',
  'security/detect-object-injection': 'warn',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
}
```

### CI Pipeline

Run security checks in CI to catch issues before merge:

```yaml
# Security checks
- npm ci
- npm audit --audit-level=high
- npm run lint:security
- uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
```

</security_rules>

## Preferences

- **Environment separation**: Use separate env files per environment (dev, staging, prod)
- **SHELL clearing**: Clear `SHELL` env var when spawning to prevent shell injection via environment
- **Error boundaries**: Log full internal details for debugging while keeping user messages generic

## Exceptions

When security rules cannot be followed:

**Process**: Request → Justification → Mitigation → Approval (security-aware reviewer) → Documentation

**Valid exception scenarios**:
| Scenario | Required Evidence | Approver |
|----------|-------------------|----------|
| Third-party library requires `eval` | Library docs, no alternative exists | Tech Lead |
| Performance-critical path needs `shell: true` | Benchmark data, mitigations documented | Security Lead |
| Legacy integration uses non-standard auth | Migration plan with timeline | Tech Lead |

**Exception documentation** (add as code comment):

```typescript
/**
 * SECURITY EXCEPTION: STD-014 Section 6.2
 * Reason: Legacy shell script requires shell interpretation
 * Mitigation: Input validated via allowlist, no user input passed
 * Approved: 2024-01-15 by @security-lead
 * Review Date: 2024-07-15
 */
```

## Verification Checklist

### Code Review Checklist

**Input Handling**:

- [ ] All external input validated with Zod schema at boundary
- [ ] String fields have max length constraints
- [ ] User-provided paths validated against workspace boundary
- [ ] URLs validated for HTTP(S) protocol only
- [ ] Shell commands parsed and validated against allowlist/blocklist

**Secrets**:

- [ ] No hardcoded secrets in source code
- [ ] Secrets loaded from environment variables
- [ ] Required secrets validated at startup
- [ ] Token storage uses `0o600` permissions
- [ ] Config directories use `0o700` permissions
- [ ] Tokens encrypted at rest

**Command Execution**:

- [ ] Uses `execFile` not `exec`
- [ ] Uses `shell: false` in spawn options
- [ ] Arguments passed as array, not string
- [ ] No string interpolation into shell commands

**Output**:

- [ ] No internal file paths in user-facing errors
- [ ] No secrets/credentials in logs
- [ ] No stack traces shown to users
- [ ] Telemetry data sanitized

### Pre-Deployment Checklist

- [ ] Dependencies audited (`npm audit`)
- [ ] No high/critical vulnerabilities
- [ ] Environment variables documented
- [ ] Secrets verified in deployment environment
- [ ] Config file permissions verified
- [ ] Error handling tested for information disclosure
