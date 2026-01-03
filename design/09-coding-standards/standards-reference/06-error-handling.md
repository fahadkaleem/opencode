# Error Handling Patterns - Coding Standard

> **Standard ID**: STD-006
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: Error classes, error handling, exit codes, and error result types
> **Enforcement**: Manual Review + Structural Checks
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - Error class naming
> - [Pattern-Based Template](../templates/99-standards/02-pattern-based-template.md)
> - [Validation Checklist](../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory error handling patterns for TypeScript/Node.js CLI applications. These patterns ensure consistent error classification, proper exit codes, and structured error information for both human users and programmatic consumers.

### 1.2 Scope

**Applies to**:

- Custom error class definitions
- Error throwing and catching
- CLI exit code management
- Error result types in operations
- API error transformation
- Retry and recovery logic
- Error logging and reporting

**Does NOT apply to**:

- Third-party library internal errors
- Build-time TypeScript errors
- Test assertion errors (handled by test framework)

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Architecture review, structural linting |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle               | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| Error Hierarchy         | Use class inheritance to create a semantic error hierarchy        |
| Explicit Exit Codes     | CLI errors carry explicit exit codes; never rely on defaults      |
| Recoverable vs Terminal | Clearly distinguish retryable errors from fatal errors            |
| Structured Errors       | Errors carry typed properties for programmatic handling           |
| Error Transformation    | Transform external errors to domain-specific errors at boundaries |

---

## 3. Architectural Overview

### 3.1 Error Class Hierarchy

```
Error (built-in)
├── FatalError (base for CLI-terminating errors)
│   ├── FatalAuthenticationError (exit: 41)
│   ├── FatalInputError (exit: 42)
│   ├── FatalSandboxError (exit: 44)
│   ├── FatalConfigError (exit: 52)
│   ├── FatalTurnLimitedError (exit: 53)
│   ├── FatalToolExecutionError (exit: 54)
│   └── FatalCancellationError (exit: 130)
├── Domain Errors (non-fatal, catchable)
│   ├── ValidationError
│   ├── NotFoundError
│   ├── CanceledError
│   ├── ForbiddenError
│   ├── UnauthorizedError
│   └── BadRequestError
├── Recoverable Errors (retryable)
│   └── RetryableQuotaError
└── Terminal Errors (non-retryable)
    └── TerminalQuotaError
```

### 3.2 Error Categories

| Category               | Purpose                         | Exit Behavior           | Examples                      |
| ---------------------- | ------------------------------- | ----------------------- | ----------------------------- |
| **Fatal Errors**       | Unrecoverable CLI failures      | Process exits with code | Authentication, config errors |
| **Domain Errors**      | Business logic failures         | Thrown and caught       | Validation, not found         |
| **Recoverable Errors** | Transient failures              | Retry with backoff      | Rate limits, quota per-minute |
| **Terminal Errors**    | Non-retryable external failures | No retry, may exit      | Daily quota exhausted         |

### 3.3 Error Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  External   │     │  Boundary   │     │   Domain    │     │    CLI      │
│   Source    │────▶│ Transformer │────▶│   Logic     │────▶│  Handler    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   Raw Error         Domain Error         Throw/Return         Exit/Display
```

---

## 4. Patterns

### 4.1 Fatal Error Base Class

#### 4.1.1 When to Use

Use this pattern when:

- The error requires CLI process termination
- A specific exit code must be returned to the shell
- The error is unrecoverable within the application

Do NOT use this pattern when:

- The error can be caught and handled
- The operation can be retried
- The error is part of normal business logic flow

#### 4.1.2 Structure

```
src/
├── errors/
│   ├── index.ts           # Barrel export
│   ├── fatal.ts           # FatalError base + subclasses
│   ├── domain.ts          # Domain-specific errors
│   ├── recoverable.ts     # Retryable errors
│   └── types.ts           # Error type enums
```

#### 4.1.3 Implementation Template

```typescript
/**
 * Base class for fatal errors that terminate CLI execution.
 *
 * Responsibility:
 * - Carry exit code for process termination
 * - Provide consistent base for all fatal errors
 *
 * Usage:
 * - Extend this class for specific fatal error types
 * - Never throw FatalError directly; use subclasses
 */
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = 'FatalError';
  }
}
```

#### 4.1.4 Complete Example

```typescript
// File: src/errors/fatal.ts

/**
 * Base class for fatal errors that terminate CLI execution.
 */
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = 'FatalError';
  }
}

/**
 * Authentication failed. User must re-authenticate.
 * Exit code: 41
 */
export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
    this.name = 'FatalAuthenticationError';
  }
}

/**
 * Invalid user input that cannot be processed.
 * Exit code: 42
 */
export class FatalInputError extends FatalError {
  constructor(message: string) {
    super(message, 42);
    this.name = 'FatalInputError';
  }
}

/**
 * Sandbox environment failure.
 * Exit code: 44
 */
export class FatalSandboxError extends FatalError {
  constructor(message: string) {
    super(message, 44);
    this.name = 'FatalSandboxError';
  }
}

/**
 * Configuration error preventing execution.
 * Exit code: 52
 */
export class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
    this.name = 'FatalConfigError';
  }
}

/**
 * Maximum session turns exceeded.
 * Exit code: 53
 */
export class FatalTurnLimitedError extends FatalError {
  constructor(message: string) {
    super(message, 53);
    this.name = 'FatalTurnLimitedError';
  }
}

/**
 * Fatal tool execution error.
 * Exit code: 54
 */
export class FatalToolExecutionError extends FatalError {
  constructor(message: string) {
    super(message, 54);
    this.name = 'FatalToolExecutionError';
  }
}

/**
 * User cancelled operation (SIGINT).
 * Exit code: 130 (standard for SIGINT)
 */
export class FatalCancellationError extends FatalError {
  constructor(message = 'Operation cancelled by user.') {
    super(message, 130);
    this.name = 'FatalCancellationError';
  }
}
```

---

### 4.2 Domain Error Classes

#### 4.2.1 When to Use

Use this pattern when:

- The error represents a business logic failure
- The error should be caught and handled by callers
- No specific exit code is required

Do NOT use this pattern when:

- The error should terminate the CLI
- The error is retryable (use RecoverableError)

#### 4.2.2 Implementation Template

```typescript
/**
 * Domain error for [specific domain].
 *
 * Responsibility:
 * - Represent [specific failure condition]
 * - Carry domain-specific context
 */
export class [DomainName]Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = '[DomainName]Error';
  }
}
```

#### 4.2.3 Complete Example

```typescript
// File: src/errors/domain.ts

/**
 * Operation was canceled by user or system.
 */
export class CanceledError extends Error {
  constructor(message = 'The operation was canceled.') {
    super(message);
    this.name = 'CanceledError';
  }
}

/**
 * Input validation failed.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Requested resource was not found.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Access forbidden (authenticated but not authorized).
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Authentication required or failed.
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Request was malformed or invalid.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}
```

---

### 4.3 Recoverable Error Pattern

#### 4.3.1 When to Use

Use this pattern when:

- The error is transient and may succeed on retry
- A specific retry delay is known or recommended
- The caller should decide whether to retry

Do NOT use this pattern when:

- The error is permanent (use Terminal or Domain error)
- No retry would help

#### 4.3.2 Structure

Recoverable errors MUST include:

- `retryDelayMs`: Delay before retry (in milliseconds)
- `cause`: Original error (for debugging)

#### 4.3.3 Implementation Template

```typescript
/**
 * Retryable error with recommended delay.
 *
 * Responsibility:
 * - Signal that operation may succeed on retry
 * - Provide retry delay hint
 * - Preserve original error cause
 */
export class Retryable[Domain]Error extends Error {
  readonly retryDelayMs: number;

  constructor(
    message: string,
    readonly cause: Error,
    retryDelaySeconds: number,
  ) {
    super(message);
    this.name = 'Retryable[Domain]Error';
    this.retryDelayMs = retryDelaySeconds * 1000;
  }
}
```

#### 4.3.4 Complete Example

```typescript
// File: src/errors/recoverable.ts

import type { ApiError } from '../types/api.js';

/**
 * Retryable quota error (e.g., per-minute rate limit).
 * Caller should wait retryDelayMs before retrying.
 */
export class RetryableQuotaError extends Error {
  readonly retryDelayMs: number;

  constructor(
    message: string,
    readonly cause: ApiError,
    retryDelaySeconds: number
  ) {
    super(message);
    this.name = 'RetryableQuotaError';
    this.retryDelayMs = retryDelaySeconds * 1000;
  }
}

/**
 * Terminal quota error (e.g., daily quota exhausted).
 * Do not retry; inform user to wait or upgrade.
 */
export class TerminalQuotaError extends Error {
  readonly retryDelayMs?: number;

  constructor(
    message: string,
    readonly cause: ApiError,
    retryDelaySeconds?: number
  ) {
    super(message);
    this.name = 'TerminalQuotaError';
    this.retryDelayMs = retryDelaySeconds ? retryDelaySeconds * 1000 : undefined;
  }
}
```

---

### 4.4 Error Type Enumeration

#### 4.4.1 When to Use

Use this pattern when:

- Errors need machine-readable categorization
- Error types affect control flow decisions
- Errors are returned as structured results (not thrown)

#### 4.4.2 Implementation Template

```typescript
/**
 * Error type enumeration for [domain].
 *
 * Naming: UPPER_SNAKE_CASE members with snake_case string values
 * Grouping: Organize by category with comments
 */
export enum [Domain]ErrorType {
  // General Errors
  UNKNOWN = 'unknown',
  EXECUTION_FAILED = 'execution_failed',

  // [Category] Errors
  [SPECIFIC_ERROR] = '[specific_error]',
}
```

#### 4.4.3 Complete Example

```typescript
// File: src/errors/types.ts

/**
 * Tool execution error types for structured error handling.
 */
export enum ToolErrorType {
  // ============================================================
  // General Errors
  // ============================================================
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  UNKNOWN = 'unknown',
  UNHANDLED_EXCEPTION = 'unhandled_exception',
  TOOL_NOT_REGISTERED = 'tool_not_registered',
  EXECUTION_FAILED = 'execution_failed',

  // ============================================================
  // File System Errors
  // ============================================================
  FILE_NOT_FOUND = 'file_not_found',
  FILE_WRITE_FAILURE = 'file_write_failure',
  READ_CONTENT_FAILURE = 'read_content_failure',
  ATTEMPT_TO_CREATE_EXISTING_FILE = 'attempt_to_create_existing_file',
  FILE_TOO_LARGE = 'file_too_large',
  PERMISSION_DENIED = 'permission_denied',
  NO_SPACE_LEFT = 'no_space_left',
  TARGET_IS_DIRECTORY = 'target_is_directory',
  PATH_NOT_IN_WORKSPACE = 'path_not_in_workspace',

  // ============================================================
  // Network Errors
  // ============================================================
  CONNECTION_FAILED = 'connection_failed',
  TIMEOUT = 'timeout',
  RATE_LIMITED = 'rate_limited',

  // ============================================================
  // Edit Tool Errors
  // ============================================================
  EDIT_NO_OCCURRENCE_FOUND = 'edit_no_occurrence_found',
  EDIT_MULTIPLE_OCCURRENCES = 'edit_multiple_occurrences',

  // ============================================================
  // Shell Errors
  // ============================================================
  SHELL_EXECUTE_ERROR = 'shell_execute_error',
  SHELL_TIMEOUT = 'shell_timeout',
}

/**
 * Determines if a tool error type is fatal (non-recoverable).
 * @param errorType - The error type to check
 * @returns true if the error is fatal and should stop execution
 */
export function isFatalToolError(errorType?: string): boolean {
  if (!errorType) {
    return false;
  }

  const fatalErrors = new Set<string>([
    ToolErrorType.NO_SPACE_LEFT,
    ToolErrorType.PERMISSION_DENIED,
  ]);

  return fatalErrors.has(errorType);
}
```

---

### 4.5 Error Result Pattern

#### 4.5.1 When to Use

Use this pattern when:

- Operations return results that may contain errors
- Errors should not interrupt control flow (no throw)
- Structured error information is needed

Do NOT use this pattern when:

- Errors should propagate up the call stack
- The operation is truly exceptional

#### 4.5.2 Implementation Template

```typescript
/**
 * Result type with optional structured error.
 */
export interface [Operation]Result {
  /** Primary result content */
  content: string;

  /** Display representation for UI */
  display: string;

  /** Structured error if operation failed */
  error?: {
    message: string;
    type?: [Domain]ErrorType;
  };
}
```

#### 4.5.3 Complete Example

```typescript
// File: src/types/result.ts

import type { ToolErrorType } from '../errors/types.js';

/**
 * Result of a tool execution.
 */
export interface ToolResult {
  /** Content for LLM consumption */
  llmContent: string;

  /** Content for user display */
  returnDisplay: string;

  /** Structured error if execution failed */
  error?: {
    message: string;
    type?: ToolErrorType;
  };
}

/**
 * JSON-serializable error for API responses.
 */
export interface JsonError {
  type: string;
  message: string;
  code?: string | number;
}

/**
 * Structured error with HTTP status.
 */
export interface StructuredError {
  message: string;
  status?: number;
}
```

---

### 4.6 HTTP/API Error Handling

#### 4.6.1 When to Use

Use this pattern when:

- Handling responses from external HTTP APIs
- Transforming API errors to domain errors
- Need to preserve HTTP status codes

#### 4.6.2 Implementation Template

```typescript
/**
 * HTTP error interface with status code.
 */
export interface HttpError extends Error {
  status?: number;
}

/**
 * Transform raw API error to domain error.
 */
export function toFriendlyError(error: unknown): Error {
  // Transform based on error shape and status
}
```

#### 4.6.3 Complete Example

```typescript
// File: src/errors/http.ts

/**
 * HTTP error with status code.
 */
export interface HttpError extends Error {
  status?: number;
}

/**
 * Model not found error (404).
 */
export class ModelNotFoundError extends Error {
  readonly code: number;

  constructor(message: string, code = 404) {
    super(message);
    this.name = 'ModelNotFoundError';
    this.code = code;
  }
}

/**
 * Network fetch error with optional error code.
 */
export class FetchError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

// File: src/errors/transform.ts

import { BadRequestError, ForbiddenError, UnauthorizedError } from './domain.js';

interface ApiResponseError {
  response?: {
    data?: {
      error?: {
        message: string;
        code: number;
      };
    };
  };
}

/**
 * Transform raw API error to domain-specific error.
 * @param error - Raw error from API call
 * @returns Transformed domain error or original error
 */
export function toFriendlyError(error: unknown): Error {
  if (!isApiResponseError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const apiError = error.response?.data?.error;
  if (!apiError?.message || !apiError?.code) {
    return error instanceof Error ? error : new Error(String(error));
  }

  switch (apiError.code) {
    case 400:
      return new BadRequestError(apiError.message);
    case 401:
      return new UnauthorizedError(apiError.message);
    case 403:
      return new ForbiddenError(apiError.message);
    default:
      return new Error(apiError.message);
  }
}

function isApiResponseError(error: unknown): error is ApiResponseError {
  return typeof error === 'object' && error !== null && 'response' in error;
}
```

---

### 4.7 Node.js Error Type Guard

#### 4.7.1 When to Use

Use this pattern when:

- Handling file system or other Node.js errors
- Need to check error codes (ENOENT, EACCES, etc.)
- Converting Node.js errors to domain errors

#### 4.7.2 Complete Example

```typescript
// File: src/errors/guards.ts

/**
 * Type guard for Node.js system errors.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  );
}

/**
 * Map Node.js error codes to tool error types.
 */
export function mapNodeErrorToToolError(error: NodeJS.ErrnoException): ToolErrorType {
  switch (error.code) {
    case 'ENOENT':
      return ToolErrorType.FILE_NOT_FOUND;
    case 'EACCES':
      return ToolErrorType.PERMISSION_DENIED;
    case 'ENOSPC':
      return ToolErrorType.NO_SPACE_LEFT;
    case 'EISDIR':
      return ToolErrorType.TARGET_IS_DIRECTORY;
    case 'EEXIST':
      return ToolErrorType.ATTEMPT_TO_CREATE_EXISTING_FILE;
    default:
      return ToolErrorType.EXECUTION_FAILED;
  }
}
```

---

## 5. Role Definitions

### 5.1 Error Class Roles

| Role              | Responsibility                            | Exit Code       | Retry |
| ----------------- | ----------------------------------------- | --------------- | ----- |
| `FatalError`      | Base for CLI-terminating errors           | Yes (specified) | No    |
| `Fatal*Error`     | Specific fatal error with fixed exit code | Yes (fixed)     | No    |
| `*Error` (domain) | Business logic errors                     | No              | No    |
| `Retryable*Error` | Transient failures with retry hint        | No              | Yes   |
| `Terminal*Error`  | Non-retryable external failures           | No              | No    |

### 5.2 Error Selection Flowchart

```
What kind of error is this?
│
├─ Should terminate CLI process?
│   ├─ Yes → Use Fatal*Error with exit code
│   └─ No ─┐
│          │
├─ Is it transient/retryable?
│   ├─ Yes → Use Retryable*Error with delay
│   └─ No ─┐
│          │
├─ Is it from external API?
│   ├─ Yes, permanent → Use Terminal*Error
│   ├─ Yes, transient → Use Retryable*Error
│   └─ No ─┐
│          │
├─ Is it business logic failure?
│   ├─ Yes → Use domain Error (Validation, NotFound, etc.)
│   └─ No ─┐
│          │
└─ Return structured error result
```

### 5.3 When to Throw vs Return

| Scenario               | Pattern                               | Example               |
| ---------------------- | ------------------------------------- | --------------------- |
| Unrecoverable failure  | `throw new Fatal*Error()`             | Authentication failed |
| Validation failure     | `throw new ValidationError()`         | Invalid input         |
| Tool execution failure | Return `{ error: { message, type } }` | File not found        |
| API rate limit         | `throw new RetryableQuotaError()`     | 429 response          |
| API permanent failure  | `throw new TerminalQuotaError()`      | Daily quota exhausted |

---

## 6. Exit Code Registry

### 6.1 Exit Code Assignments

| Code | Error Class                | Meaning                     |
| ---- | -------------------------- | --------------------------- |
| 0    | (none)                     | Success                     |
| 1    | (generic)                  | Unspecified error           |
| 41   | `FatalAuthenticationError` | Authentication failure      |
| 42   | `FatalInputError`          | Invalid user input          |
| 44   | `FatalSandboxError`        | Sandbox environment failure |
| 52   | `FatalConfigError`         | Configuration error         |
| 53   | `FatalTurnLimitedError`    | Max turns exceeded          |
| 54   | `FatalToolExecutionError`  | Fatal tool execution error  |
| 130  | `FatalCancellationError`   | SIGINT (Ctrl+C)             |

### 6.2 Exit Code Rules

| Rule                                    | Enforcement                     |
| --------------------------------------- | ------------------------------- |
| Exit codes 1-40 reserved for future use | MUST NOT use                    |
| Exit codes 41-59 for application errors | MUST use assigned codes         |
| Exit code 130 for SIGINT only           | MUST NOT use for other purposes |
| Exit codes 128+ reserved for signals    | SHOULD NOT use arbitrarily      |

---

## 7. Anti-Patterns

### 7.1 Forbidden Patterns

| Anti-Pattern               | Problem                         | Correct Pattern                 |
| -------------------------- | ------------------------------- | ------------------------------- |
| String error codes         | Not type-safe, hard to refactor | Use enum `ToolErrorType`        |
| Bare `throw new Error()`   | No semantic meaning             | Use specific error class        |
| Exit without error class   | Inconsistent exit codes         | Use `FatalError` subclass       |
| Swallowing errors silently | Hides failures                  | Log and rethrow or return error |
| Retrying terminal errors   | Wastes resources                | Check `isFatalToolError()`      |

### 7.2 Forbidden Dependencies

| From          | To             | Why Forbidden                      |
| ------------- | -------------- | ---------------------------------- |
| Error classes | Business logic | Errors should be pure data         |
| Domain errors | CLI framework  | Domain layer is framework-agnostic |

### 7.3 Code Smell Examples

```typescript
// ANTI-PATTERN: String error codes
const ERR_AUTH_001 = 'ERR_AUTH_001';
throw new Error(ERR_AUTH_001);

// CORRECT PATTERN: Error class hierarchy
throw new FatalAuthenticationError('Token expired');
```

```typescript
// ANTI-PATTERN: Bare Error with exit
console.error('Config not found');
process.exit(1);

// CORRECT PATTERN: Fatal error with specific exit code
throw new FatalConfigError('Configuration file not found: ~/.config/app.json');
```

```typescript
// ANTI-PATTERN: Swallowing errors
try {
  await riskyOperation();
} catch {
  // Silent failure
}

// CORRECT PATTERN: Log and handle
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error });
  return { error: { message: String(error), type: ToolErrorType.EXECUTION_FAILED } };
}
```

```typescript
// ANTI-PATTERN: No retry delay on retryable error
class RetryableError extends Error {}

// CORRECT PATTERN: Include retry delay
class RetryableQuotaError extends Error {
  constructor(
    message: string,
    readonly cause: Error,
    readonly retryDelayMs: number
  ) {
    super(message);
  }
}
```

---

## 8. Error Handling in CLI

### 8.1 Top-Level Error Handler

```typescript
// File: src/cli/errorHandler.ts

import { FatalError } from '../errors/fatal.js';
import type { Config } from '../config/types.js';
import type { JsonError } from '../types/result.js';

/**
 * Handle errors at CLI top level.
 * @param error - Error to handle
 * @param config - Application configuration
 * @returns never (always exits)
 */
export function handleError(error: unknown, config: Config): never {
  const errorMessage = formatError(error);
  const exitCode = getExitCode(error);

  if (config.outputFormat === 'json') {
    const jsonError: JsonError = {
      type: error instanceof Error ? error.constructor.name : 'Error',
      message: errorMessage,
      code: exitCode,
    };
    console.error(JSON.stringify(jsonError));
  } else {
    console.error(errorMessage);
  }

  process.exit(exitCode);
}

function getExitCode(error: unknown): number {
  if (error instanceof FatalError) {
    return error.exitCode;
  }
  return 1;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
```

### 8.2 Signal Handling

```typescript
// File: src/cli/signals.ts

import { FatalCancellationError } from '../errors/fatal.js';

/**
 * Setup signal handlers for graceful shutdown.
 */
export function setupSignalHandlers(): void {
  process.on('SIGINT', () => {
    throw new FatalCancellationError('Received SIGINT');
  });

  process.on('SIGTERM', () => {
    throw new FatalCancellationError('Received SIGTERM');
  });
}
```

---

## 9. Validation Error Pattern

### 9.1 Validation Function Signature

Validation functions MUST return `string | null`:

- `null` = validation passed
- `string` = error message describing the failure

```typescript
/**
 * Validate tool parameters.
 * @param params - Parameters to validate
 * @returns null if valid, error message if invalid
 */
function validateParams(params: ToolParams): string | null {
  if (!params.filePath) {
    return 'Missing required parameter: filePath';
  }

  if (!isAbsolutePath(params.filePath)) {
    return `Path must be absolute: ${params.filePath}`;
  }

  return null; // Valid
}
```

### 9.2 Validation with Schema

```typescript
import { z } from 'zod';

const toolParamsSchema = z.object({
  filePath: z.string().min(1),
  content: z.string(),
});

function validateToolParams(params: unknown): string | null {
  const result = toolParamsSchema.safeParse(params);
  if (!result.success) {
    return result.error.errors.map((e) => e.message).join('; ');
  }
  return null;
}
```

---

## 10. Enforcement

### 10.1 Structural Validation

| Check                 | Tool               | Configuration             |
| --------------------- | ------------------ | ------------------------- |
| Error class hierarchy | TypeScript         | `extends FatalError`      |
| Exit code assignment  | Code review        | Check exit code table     |
| Error name property   | ESLint custom rule | `this.name = 'ClassName'` |

### 10.2 Architecture Review Checklist

- [ ] All custom errors extend appropriate base class
- [ ] All fatal errors have explicit exit codes from registry
- [ ] All error classes set `this.name` property
- [ ] Retryable errors include `retryDelayMs` property
- [ ] Error transformation happens at boundaries
- [ ] No bare `process.exit()` calls (use FatalError)
- [ ] Tool errors use structured result with `error` field

### 10.3 Error Class Checklist

For each new error class:

- [ ] Extends appropriate base class
- [ ] Has descriptive name with `Error` suffix
- [ ] Sets `this.name` in constructor
- [ ] Has JSDoc comment explaining when to use
- [ ] If fatal, has exit code from registry
- [ ] If retryable, has `retryDelayMs` property
- [ ] Is exported from `errors/index.ts`

---

## 11. Exceptions

### 11.1 Valid Exception Scenarios

| Scenario                   | Justification               | Documentation Required |
| -------------------------- | --------------------------- | ---------------------- |
| Third-party library errors | Cannot modify external code | Wrap at boundary       |
| Legacy code migration      | Gradual adoption            | Migration ticket       |
| Performance-critical paths | Error class overhead        | Benchmark evidence     |

### 11.2 Exception Documentation

```typescript
/**
 * ERROR HANDLING EXCEPTION: STD-006 Section 4.1
 * Reason: Third-party library throws plain Error objects
 * Trade-off: Lose type safety at boundary
 * Mitigation: Wrapped immediately in catch block
 */
try {
  await thirdPartyCall();
} catch (error) {
  throw new ServiceError(error instanceof Error ? error.message : String(error));
}
```

---

## 12. Quick Reference

### 12.1 Error Selection Matrix

| Need                   | Error Type            | Example                                   |
| ---------------------- | --------------------- | ----------------------------------------- |
| Terminate CLI          | `Fatal*Error`         | `FatalAuthenticationError`                |
| Validation failure     | `ValidationError`     | `new ValidationError('Invalid email')`    |
| Resource not found     | `NotFoundError`       | `new NotFoundError('User not found')`     |
| Transient API failure  | `RetryableQuotaError` | `new RetryableQuotaError(msg, cause, 30)` |
| Permanent API failure  | `TerminalQuotaError`  | `new TerminalQuotaError(msg, cause)`      |
| Tool execution failure | Structured result     | `{ error: { message, type } }`            |

### 12.2 Exit Code Quick Reference

| Range | Purpose                     |
| ----- | --------------------------- |
| 0     | Success                     |
| 1     | Generic error               |
| 41-59 | Application-specific errors |
| 130   | SIGINT (Ctrl+C)             |

### 12.3 Error Property Summary

| Error Type            | Properties                         |
| --------------------- | ---------------------------------- |
| `FatalError`          | `message`, `exitCode`              |
| Domain errors         | `message`, `name`                  |
| `RetryableQuotaError` | `message`, `cause`, `retryDelayMs` |
| `ToolResult.error`    | `message`, `type?` (enum)          |
| `JsonError`           | `type`, `message`, `code?`         |

---

## 13. Traceability

### 13.1 Pattern Index

| Pattern ID | Name                 | Section | When to Use                     |
| ---------- | -------------------- | ------- | ------------------------------- |
| ERR-001    | Fatal Error Base     | 4.1     | CLI-terminating errors          |
| ERR-002    | Domain Errors        | 4.2     | Business logic failures         |
| ERR-003    | Recoverable Errors   | 4.3     | Transient/retryable failures    |
| ERR-004    | Error Type Enum      | 4.4     | Machine-readable categorization |
| ERR-005    | Error Result         | 4.5     | Structured operation results    |
| ERR-006    | HTTP Error Transform | 4.6     | API error handling              |
| ERR-007    | Node.js Type Guard   | 4.7     | File system errors              |

### 13.2 Related Standards

| Standard                        | Relationship              |
| ------------------------------- | ------------------------- |
| STD-001 Naming Conventions      | Error class naming rules  |
| STD-005 Architecture Patterns   | Error placement in layers |
| STD-007 Testing Standards       | Error testing patterns    |
| STD-013 Logging & Observability | Error logging patterns    |

---

## 14. Open Questions

| Question ID | Question                                                     | Owner        | Status  |
| ----------- | ------------------------------------------------------------ | ------------ | ------- |
| EQ-001      | Should we add error correlation IDs for distributed tracing? | Architecture | Pending |
| EQ-002      | What is the policy for error message localization?           | Product      | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
