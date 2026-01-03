# Error Handling Patterns

Reference: `design/09-coding-standards/standards-reference/06-error-handling.md`

<error_handling_rules>

## Error Class Hierarchy

Use the correct error base class based on recoverability and termination behavior. This enables consistent handling and clear semantics throughout the codebase.

### Fatal Errors

Use `Fatal*Error` (subclass of `FatalError`) when the error requires CLI termination with a specific exit code and is unrecoverable. Always use subclasses, never throw `FatalError` directly, because subclasses carry semantic meaning and assigned exit codes.

```typescript
// ✓ Correct: specific fatal error with exit code
throw new FatalConfigError('Missing required field: apiKey');

// ✗ Wrong: generic fatal error loses semantic meaning
throw new FatalError('Config error');
```

**When to use Fatal errors:**

- CLI must terminate immediately
- Specific exit code is required
- Error is unrecoverable

**When NOT to use Fatal errors (use Domain or Recoverable instead):**

- Error can be caught and handled by callers
- Operation can be retried
- Part of normal business logic flow

### Domain Errors

Use domain `*Error` classes for business logic failures that callers should catch and handle. These don't require specific exit codes and represent expected failure modes.

**Standard domain errors** (use these where applicable):

- `CanceledError` - operation was canceled by user/system
- `ValidationError` - input failed validation rules
- `NotFoundError` - requested resource doesn't exist
- `ForbiddenError` - action not permitted for current user
- `UnauthorizedError` - authentication required/failed
- `BadRequestError` - malformed request

```typescript
// ✓ Domain error for business logic failure
if (!user) throw new NotFoundError(`User ${id} not found`);

// ✗ Don't use domain errors for CLI termination
throw new NotFoundError('Config file missing'); // Should be FatalConfigError
```

**When NOT to use Domain errors:**

- CLI-terminating failures (use Fatal)
- Transient failures that may succeed on retry (use Recoverable)

### Recoverable Errors

Use `Retryable*Error` when the error is transient and may succeed on retry. Include `retryDelayMs` and `cause` so callers can implement retry logic.

```typescript
class RetryableApiError extends Error {
  constructor(
    message: string,
    public readonly retryDelayMs: number,
    public readonly cause: Error
  ) {
    super(message);
    this.name = 'RetryableApiError';
  }
}

// ✓ Transient failure with retry guidance
throw new RetryableApiError('Rate limited', 5000, originalError);
```

**When NOT to use Recoverable errors:**

- Permanent failures that won't succeed on retry (use Terminal or Domain)
- When no retry would help

### Terminal Errors

Use `Terminal*Error` for permanent external failures that should NOT be retried. Include `cause`; optionally include `retryDelayMs` indicating when the condition might clear (e.g., quota resets).

```typescript
class TerminalQuotaError extends Error {
  constructor(
    message: string,
    public readonly cause: Error,
    public readonly retryDelayMs?: number // when quota might reset
  ) {
    super(message);
    this.name = 'TerminalQuotaError';
  }
}

// ✓ Permanent failure, don't retry
throw new TerminalQuotaError('API quota exhausted', originalError, 3600000);
```

**Critical:** Never retry terminal errors. Gate retries using type guards like `isFatalToolError()`.

## Error Class Structure

### Name Property

All custom error classes must set `this.name = 'ClassName'` in the constructor. This ensures `error.name` matches the class for logging and serialization (otherwise it inherits `'Error'`).

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError'; // ✓ Required
  }
}
```

### New Error Class Checklist

Each new error class must:

- [ ] Extend the appropriate base (`Error`, `FatalError`, etc.)
- [ ] Have an `Error` suffix in the name
- [ ] Set `this.name = 'ClassName'` in constructor
- [ ] Include a short "when to use" JSDoc
- [ ] Be exported from `errors/index.ts`

## Error Results vs Throwing

### When to Throw

Throw errors for unrecoverable failures and validation failures where the caller cannot meaningfully continue. Exceptions propagate up until caught.

```typescript
// ✓ Throw for validation - caller can't proceed with invalid data
function parseConfig(raw: string): Config {
  const parsed = JSON.parse(raw);
  if (!parsed.apiKey) {
    throw new ValidationError('Missing required field: apiKey');
  }
  return parsed;
}
```

### When to Return Structured Results

Use structured result objects with optional `error: { message, type? }` when:

- Operations return results that may contain errors
- Errors should not interrupt control flow (no throw)
- Structured error info is needed for the caller

```typescript
// ✓ Return structured result for tool execution
interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    type?: ToolErrorType;
  };
}

function executeTool(tool: Tool): ToolResult {
  try {
    const data = tool.run();
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: { message: e.message, type: ToolErrorType.EXECUTION_FAILED },
    };
  }
}
```

**When NOT to use structured results:**

- Errors should propagate up the call stack
- Operation is truly exceptional (use throw)

### API/Transient Failures

- Use `Retryable*Error` for transient API failures (rate limits, timeouts)
- Use `Terminal*Error` for permanent API failures (invalid credentials, resource deleted)

## Error Type Enumeration

Use error type enums for machine-readable categorization when error types affect control flow or when returning structured results. Enum members use `UPPER_SNAKE_CASE` with `snake_case` string values.

```typescript
enum ToolErrorType {
  VALIDATION_FAILED = 'validation_failed',
  EXECUTION_FAILED = 'execution_failed',
  TIMEOUT = 'timeout',
  PERMISSION_DENIED = 'permission_denied',
}

// ✓ Enum enables type-safe branching
if (result.error?.type === ToolErrorType.TIMEOUT) {
  // handle timeout specifically
}

// ✗ Don't use string codes - no type safety
if (result.error?.code === 'ERR_TOOL_001') { ... }
```

## Boundary Transformation

### External Error Handling

Transform external/third-party errors into domain-specific errors at system boundaries. Raw external errors should never propagate into domain logic because they leak implementation details and make error handling inconsistent.

```typescript
// ✓ Transform at boundary
async function fetchUser(id: string): Promise<User> {
  try {
    return await externalApi.getUser(id);
  } catch (e) {
    if (e.status === 404) {
      throw new NotFoundError(`User ${id} not found`);
    }
    if (e.status === 429) {
      throw new RetryableApiError('Rate limited', e.retryAfter * 1000, e);
    }
    throw new ApiError(`Failed to fetch user: ${e.message}`, e);
  }
}

// ✗ Don't let raw errors leak
async function fetchUser(id: string): Promise<User> {
  return await externalApi.getUser(id); // AxiosError leaks into domain
}
```

### HTTP/API Errors

When handling external HTTP/API errors:

- Transform raw API errors into domain errors
- Preserve status/code information where needed for debugging

### Node.js Errors

Provide a Node.js error type guard and map Node error codes to structured error types:

```typescript
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function mapFileError(error: unknown): DomainError {
  if (!isNodeError(error)) return new UnknownError(error);

  switch (error.code) {
    case 'ENOENT':
      return new NotFoundError(error.message);
    case 'EACCES':
      return new ForbiddenError(error.message);
    case 'ENOSPC':
      return new TerminalStorageError(error.message, error);
    case 'EISDIR':
      return new ValidationError('Expected file, got directory');
    case 'EEXIST':
      return new ConflictError(error.message);
    default:
      return new FileSystemError(error.message, error);
  }
}
```

## Exit Codes

### Registry

Use assigned exit codes consistently. This enables scripts and CI to detect specific failure modes.

| Code  | Error Class                | Meaning               |
| ----- | -------------------------- | --------------------- |
| `0`   | (success)                  | Success               |
| `1`   | (generic)                  | Unknown/generic error |
| `41`  | `FatalAuthenticationError` | Authentication failed |
| `42`  | `FatalInputError`          | Invalid input         |
| `44`  | `FatalSandboxError`        | Sandbox violation     |
| `52`  | `FatalConfigError`         | Configuration error   |
| `53`  | `FatalTurnLimitedError`    | Turn limit exceeded   |
| `54`  | `FatalToolExecutionError`  | Tool execution failed |
| `130` | `FatalCancellationError`   | SIGINT (Ctrl+C)       |

### Rules

- Use assigned application exit codes in range `41–59`
- Reserve codes `1–40` (common conventions)
- Use `130` only for SIGINT cancellation
- Codes `128+` are signal-reserved; don't use arbitrarily

## Validation Pattern

Validation functions return `string | null` where `null` means valid and `string` is the validation failure message. This pattern is simple, composable, and avoids exceptions for expected validation failures.

```typescript
function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Invalid email format';
  return null; // valid
}

// Usage
const error = validateEmail(input);
if (error) {
  throw new ValidationError(error);
}
```

## Type Guards

### Fatal Error Type Guard

Provide a type guard function to check if an error type is non-recoverable and should stop execution:

```typescript
function isFatalToolError(errorType: ToolErrorType): boolean {
  return [ToolErrorType.PERMISSION_DENIED, ToolErrorType.INVALID_CREDENTIALS].includes(errorType);
}

// Usage: gate retries
if (result.error && isFatalToolError(result.error.type)) {
  throw new FatalToolExecutionError(result.error.message);
}
```

## CLI Error Handling

### Centralized Handler

Centralize CLI error handling in a top-level handler that:

- Formats output appropriately (text vs JSON)
- Exits with `FatalError.exitCode` or `1` for unknown errors

```typescript
async function main() {
  try {
    await runCli();
  } catch (error) {
    if (error instanceof FatalError) {
      console.error(error.message);
      process.exit(error.exitCode);
    }
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}
```

### JSON Output Format

For JSON output mode, use this structure:

```typescript
interface JsonError {
  type: string;
  message: string;
  code?: string | number;
}
```

### Signal Handling

Register handlers for both `SIGINT` and `SIGTERM` that throw `FatalCancellationError`. This ensures shutdown is consistent and user-facing messaging is clear.

```typescript
process.on('SIGINT', () => {
  throw new FatalCancellationError('Operation canceled by user');
});

process.on('SIGTERM', () => {
  throw new FatalCancellationError('Process terminated');
});
```

</error_handling_rules>

## Preferences

- **Throw vs Return**: Prefer throwing for unrecoverable/validation failures; prefer structured results for tool execution failures
- **Type Guards**: Provide `is*Error` guards for error categorization
- **Error Chaining**: Always preserve `cause` when wrapping errors

## Forbidden Patterns

Avoid these patterns because they make error handling inconsistent and debugging difficult:

| Pattern                             | Problem             | Use Instead                                 |
| ----------------------------------- | ------------------- | ------------------------------------------- |
| String error codes (`'ERR_XX_001'`) | No type safety      | Error type enum                             |
| Bare `throw new Error()`            | No semantic meaning | Specific error class                        |
| Direct `process.exit()`             | Bypasses handlers   | Throw `FatalError` subclass                 |
| Swallowing errors silently          | Hides failures      | Log and rethrow, or return structured error |
| Retrying terminal errors            | Wastes resources    | Gate with `isFatalToolError()`              |

## Dependency Rules

Keep error classes independent so they can be imported anywhere without cycles:

- Error classes must NOT depend on business logic
- Domain errors must NOT depend on CLI framework

```typescript
// ✓ Error class is self-contained
class ValidationError extends Error { ... }

// ✗ Error class depends on business logic
class ValidationError extends Error {
  constructor(result: ValidationResult) { ... } // imports domain types
}
```

## Exceptions

When external constraints prevent following a pattern:

- **Valid scenarios**: third-party requirements, legacy migration, measured performance requirements
- **Documentation**: record with block comment including reason, trade-offs, mitigation, reference, and approval

## Verification Checklist

When reviewing code for error handling compliance:

- [ ] Fatal errors extend `FatalError` and use assigned exit code
- [ ] Domain errors extend `Error` and use standard names where applicable
- [ ] Recoverable errors include `retryDelayMs` and `cause`
- [ ] Terminal errors include `cause` and are never retried
- [ ] All custom error classes set `this.name = 'ClassName'`
- [ ] Error type enums use `UPPER_SNAKE_CASE` members with `snake_case` values
- [ ] External errors are transformed at boundaries (no raw errors in domain)
- [ ] Node.js error codes are mapped to domain errors
- [ ] Exit codes are in assigned range `41–59` (except `130` for SIGINT)
- [ ] Validation functions return `string | null`
- [ ] No string error codes (use enums)
- [ ] No bare `throw new Error()` (use specific class)
- [ ] No direct `process.exit()` (use `FatalError` subclass)
- [ ] No swallowed errors (log+rethrow or return structured)
- [ ] No retrying terminal errors
- [ ] Error classes don't depend on business logic or CLI framework
- [ ] New error classes exported from `errors/index.ts`
