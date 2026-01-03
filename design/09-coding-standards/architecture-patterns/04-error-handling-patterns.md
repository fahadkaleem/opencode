---
title: Error Handling Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All Packages
related_patterns:
  - ./03-type-safety-patterns.md#type-guards
  - ./05-testing-patterns.md#error-testing
---

# 4. Error Handling Patterns

> **Purpose**: Comprehensive error handling patterns using typed error hierarchies, type guards, friendly error conversion, and retry logic to create robust, recoverable error flows.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Error Class Hierarchy](#pattern-1-error-class-hierarchy)
- [Pattern 2: Error Type Guards](#pattern-2-error-type-guards)
- [Pattern 3: Friendly Error Conversion](#pattern-3-friendly-error-conversion)
- [Pattern 4: Retry with Exponential Backoff](#pattern-4-retry-with-exponential-backoff)
- [Pattern 5: Result Objects Over Exceptions](#pattern-5-result-objects-over-exceptions)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Error handling in a CLI application requires careful distinction between fatal errors (requiring process exit), recoverable errors (allowing retry), and user-facing errors (requiring friendly messages). TypeScript's type system combined with custom error classes enables type-safe error handling that makes error categories explicit and recovery paths clear.

Proper error handling goes beyond basic try-catch blocks. It includes typed error hierarchies with exit codes, type guards for safe error inspection, conversion of technical errors to user-friendly messages, automatic retry with exponential backoff for transient failures, and result objects that make errors part of the data flow instead of exceptional control flow.

**Why error handling matters:**

- Distinguish between fatal and recoverable errors
- Provide clear feedback to users about what went wrong
- Enable automatic retry for transient failures
- Make error handling testable and predictable
- Create explicit error contracts between components
- Support graceful degradation instead of crashes

**In this document:**

- **Error Class Hierarchy** - Typed error classes with exit codes for different failure categories
- **Error Type Guards** - Type-safe functions for inspecting and narrowing error types
- **Friendly Error Conversion** - Converting technical errors to user-friendly messages
- **Retry with Exponential Backoff** - Automatic retry logic for transient failures
- **Result Objects Over Exceptions** - Errors as data instead of control flow

**Prerequisites:**

- Understanding of TypeScript classes and inheritance
- Familiarity with Promise error handling
- Knowledge of type guards from Type Safety Patterns
- Experience with async/await error handling

---

## Pattern 1: Error Class Hierarchy

### Intent

Create a typed hierarchy of error classes with specific exit codes to distinguish between different failure categories and enable type-safe error handling.

### Problem

Generic Error objects provide no semantic information about error severity, category, or appropriate handling. Code catching errors must inspect error messages (fragile string matching) or check arbitrary properties to determine if an error is fatal, recoverable, or related to authentication, configuration, or other specific concerns. This leads to brittle error handling that breaks when error messages change.

### Solution

Define a base error class with an exit code property, then create specific error subclasses for each error category. Fatal errors extend a FatalError base class with specific exit codes (41 for authentication, 52 for configuration, etc.). Non-fatal errors extend Error directly. This makes error categories explicit in the type system and enables type-safe error handling.

### Structure

```typescript
// Base class for all fatal errors (require process exit)
class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {}
}

// Specific fatal error types with unique exit codes
class FatalAuthenticationError extends FatalError {
  exitCode = 41;
}
class FatalConfigError extends FatalError {
  exitCode = 52;
}
class FatalToolExecutionError extends FatalError {
  exitCode = 54;
}

// Non-fatal errors (recoverable)
class ValidationError extends Error {}
class NotFoundError extends Error {}
```

### Implementation

**Step 1: Define base FatalError class with exit code**

```typescript
/**
 * Base class for fatal errors that require process exit.
 * All fatal errors have an associated exit code for the shell.
 */
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

**Step 2: Create specific fatal error subclasses**

```typescript
/**
 * Authentication failure - credentials invalid or expired.
 * Exit code 41.
 */
export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}

/**
 * Invalid user input that cannot be recovered from.
 * Exit code 42.
 */
export class FatalInputError extends FatalError {
  constructor(message: string) {
    super(message, 42);
  }
}

/**
 * Configuration file missing or invalid.
 * Exit code 52.
 */
export class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
  }
}

/**
 * Tool execution failed in unrecoverable way.
 * Exit code 54.
 */
export class FatalToolExecutionError extends FatalError {
  constructor(message: string) {
    super(message, 54);
  }
}

/**
 * User canceled the operation (SIGINT).
 * Exit code 130 (standard for SIGINT).
 */
export class FatalCancellationError extends FatalError {
  constructor(message: string) {
    super(message, 130);
  }
}
```

**Step 3: Create non-fatal error classes for recoverable errors**

```typescript
/**
 * Validation failed but operation can continue or be retried.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Resource not found - may be recoverable by trying different resource.
 */
export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Forbidden access - user lacks permissions.
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Unauthorized - authentication required.
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Bad request - invalid parameters sent to API.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Operation was canceled by user or timeout.
 */
export class CanceledError extends Error {
  constructor(message = 'The operation was canceled.') {
    super(message);
    this.name = 'CanceledError';
  }
}
```

### Complete Example

```typescript
// packages/core/src/utils/errors.ts
import type { NodeJS } from 'node:process';

/**
 * Base class for fatal errors requiring process exit.
 */
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Fatal error hierarchy with specific exit codes
export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}

export class FatalInputError extends FatalError {
  constructor(message: string) {
    super(message, 42);
  }
}

export class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
  }
}

export class FatalToolExecutionError extends FatalError {
  constructor(message: string) {
    super(message, 54);
  }
}

export class FatalCancellationError extends FatalError {
  constructor(message: string) {
    super(message, 130); // Standard exit code for SIGINT
  }
}

// Non-fatal errors (recoverable)
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class CanceledError extends Error {
  constructor(message = 'The operation was canceled.') {
    super(message);
    this.name = 'CanceledError';
  }
}

export class ForbiddenError extends Error {}
export class UnauthorizedError extends Error {}
export class BadRequestError extends Error {}

/**
 * Type guard for Node.js system errors.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Extract error message safely from unknown error type.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return String(error);
  } catch {
    return 'Failed to get error details';
  }
}

// Usage example in command handler
async function executeCommand() {
  try {
    await performOperation();
  } catch (error) {
    if (error instanceof FatalAuthenticationError) {
      console.error(`Authentication failed: ${error.message}`);
      process.exit(error.exitCode); // Exit with 41
    }

    if (error instanceof FatalConfigError) {
      console.error(`Configuration error: ${error.message}`);
      process.exit(error.exitCode); // Exit with 52
    }

    if (error instanceof ValidationError) {
      console.error(`Validation failed for ${error.field}: ${error.message}`);
      // Continue execution - non-fatal
    }

    // Unknown error
    console.error('Unexpected error:', getErrorMessage(error));
    process.exit(1);
  }
}
```

**Example explained:**

- Lines 7-15: Base FatalError class with exitCode property that all fatal errors inherit
- Lines 18-46: Specific fatal error types with unique exit codes (41, 42, 52, 54, 130)
- Lines 49-84: Non-fatal error classes for recoverable errors with contextual properties
- Lines 86-90: Type guard for Node.js system errors (ENOENT, EACCES, etc.)
- Lines 92-101: Safe error message extraction handling non-Error types
- Lines 103-127: Usage example showing type-based error handling and exit code usage

### When to Use

**Use error hierarchy when:**

- Application needs to exit with specific exit codes
- Different errors require different handling strategies
- Want type-safe error handling in catch blocks
- Need to distinguish fatal from recoverable errors
- Building CLI tools that integrate with shell scripts

**Avoid error hierarchy when:**

- Building library code (let consumers define errors)
- Errors are truly generic with no category
- Application never exits (long-running servers)
- Error categories would be too numerous to manage

### Benefits

- **Type Safety**: Catch blocks can use instanceof checks for type narrowing
- **Exit Code Consistency**: Each error type has explicit exit code for shell integration
- **Self-Documenting**: Error class names describe error category
- **Tooling Support**: IDEs can autocomplete error properties based on type
- **Clear Contracts**: Functions can specify which error types they throw

### Trade-offs

- **Verbosity**: Requires defining multiple error classes instead of using generic Error
- **Class Proliferation**: Can lead to many error classes if categories are too granular
- **Inheritance Depth**: Deep hierarchies become harder to understand and maintain
- **Migration Cost**: Existing code using generic Error requires refactoring

### Common Mistakes

**Mistake 1: Using error codes as strings instead of classes**

**Bad example:**

```typescript
throw new Error('AUTH_ERROR: Invalid credentials');

// Caller must parse error message
if (error.message.startsWith('AUTH_ERROR')) {
  // Fragile - breaks if message changes
}
```

**Correct approach:**

```typescript
throw new FatalAuthenticationError('Invalid credentials');

// Type-safe error handling
if (error instanceof FatalAuthenticationError) {
  process.exit(error.exitCode);
}
```

**Why this matters**: String-based error codes require brittle string parsing and provide no type safety. Error classes enable type checking and autocomplete.

**Mistake 2: Making all errors fatal**

**Bad example:**

```typescript
class FileNotFoundError extends FatalError {
  constructor(path: string) {
    super(`File not found: ${path}`, 51);
  }
}

// This forces process exit even for recoverable errors
throw new FileNotFoundError('./optional-config.json');
```

**Correct approach:**

```typescript
class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message);
  }
}

// Non-fatal - caller can decide whether to exit
throw new NotFoundError('File not found: ./optional-config.json', 'file', './optional-config.json');
```

**Why this matters**: File not found may be recoverable (try another path, use defaults). Only make errors fatal when recovery is truly impossible.

**Mistake 3: Not capturing context in error properties**

**Bad example:**

```typescript
throw new ValidationError('Validation failed');

// No context about what failed
catch (error) {
  console.error(error.message); // "Validation failed" - unhelpful
}
```

**Correct approach:**

```typescript
throw new ValidationError(
  'Value must be between 1 and 100',
  'maxRetries',
  150
);

catch (error) {
  if (error instanceof ValidationError) {
    console.error(`${error.field}: ${error.message}`);
    console.error(`Received value: ${error.value}`);
  }
}
```

**Why this matters**: Context properties make errors actionable by providing specific information about what went wrong.

### Testing Strategy

**What to Test:**

- Error classes are instantiated with correct properties
- FatalError subclasses have correct exit codes
- Error messages are set correctly
- Error name property matches class name
- Contextual properties (field, value, etc.) are accessible

**Test Organization:**

- Co-locate tests with error definitions: `errors.ts` → `errors.test.ts`
- Group tests by error type using describe blocks
- Test both fatal and non-fatal error categories
- Verify exit codes match specifications

**Mock Strategy:**

- No mocks needed - error classes are simple data structures
- Test error throwing and catching with real error instances
- Mock process.exit when testing exit code behavior

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  FatalError,
  FatalAuthenticationError,
  FatalConfigError,
  ValidationError,
  NotFoundError,
  isNodeError,
  getErrorMessage,
} from './errors.js';

describe('Error Hierarchy', () => {
  describe('FatalError', () => {
    it('should create error with message and exit code', () => {
      // Arrange & Act
      const error = new FatalError('Test error', 99);

      // Assert
      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(FatalError);
      expect(error.message).to.equal('Test error');
      expect(error.exitCode).to.equal(99);
      expect(error.name).to.equal('FatalError');
    });
  });

  describe('FatalAuthenticationError', () => {
    it('should have exit code 41', () => {
      // Arrange & Act
      const error = new FatalAuthenticationError('Auth failed');

      // Assert
      expect(error).to.be.instanceOf(FatalError);
      expect(error.exitCode).to.equal(41);
      expect(error.message).to.equal('Auth failed');
    });
  });

  describe('FatalConfigError', () => {
    it('should have exit code 52', () => {
      // Arrange & Act
      const error = new FatalConfigError('Config invalid');

      // Assert
      expect(error).to.be.instanceOf(FatalError);
      expect(error.exitCode).to.equal(52);
      expect(error.message).to.equal('Config invalid');
    });
  });

  describe('ValidationError', () => {
    it('should capture field and value context', () => {
      // Arrange & Act
      const error = new ValidationError('Value out of range', 'maxRetries', 150);

      // Assert
      expect(error).to.be.instanceOf(Error);
      expect(error).to.not.be.instanceOf(FatalError);
      expect(error.field).to.equal('maxRetries');
      expect(error.value).to.equal(150);
      expect(error.name).to.equal('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should capture resource type and id', () => {
      // Arrange & Act
      const error = new NotFoundError('File not found', 'file', './config.json');

      // Assert
      expect(error.resourceType).to.equal('file');
      expect(error.resourceId).to.equal('./config.json');
    });
  });
});

describe('Error Type Guards', () => {
  describe('isNodeError', () => {
    it('should return true for Node.js system errors', () => {
      // Arrange
      const nodeError = new Error('ENOENT') as NodeJS.ErrnoException;
      nodeError.code = 'ENOENT';

      // Act & Assert
      expect(isNodeError(nodeError)).to.be.true;
    });

    it('should return false for regular errors', () => {
      // Arrange
      const regularError = new Error('Regular error');

      // Act & Assert
      expect(isNodeError(regularError)).to.be.false;
    });
  });
});

describe('getErrorMessage', () => {
  it('should extract message from Error objects', () => {
    // Arrange
    const error = new Error('Test message');

    // Act
    const message = getErrorMessage(error);

    // Assert
    expect(message).to.equal('Test message');
  });

  it('should convert non-Error values to string', () => {
    // Arrange & Act & Assert
    expect(getErrorMessage('string error')).to.equal('string error');
    expect(getErrorMessage(42)).to.equal('42');
    expect(getErrorMessage(null)).to.equal('null');
  });

  it('should handle unconvertible values gracefully', () => {
    // Arrange
    const circular: { self?: unknown } = {};
    circular.self = circular;

    // Act
    const message = getErrorMessage(circular);

    // Assert
    expect(message).to.equal('Failed to get error details');
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (error classes are small)
- Branch coverage: 100% (type guards test all branches)
- Function coverage: 100% (all error constructors tested)

### Related Patterns

- **[Error Type Guards](./04-error-handling-patterns.md#pattern-2-error-type-guards)** - Essential companion for safe error inspection
- **[Type Guards](./03-type-safety-patterns.md#pattern-2-type-guards)** - General type guard pattern used for errors
- **[Testing Error Cases](./05-testing-patterns.md#error-testing)** - How to test error throwing and handling

---

## Pattern 2: Error Type Guards

### Intent

Create type-safe functions that narrow unknown error types to specific error classes, enabling safe property access and appropriate error handling.

### Problem

When catching errors, TypeScript types them as unknown. Code must check error types before accessing type-specific properties like exitCode or field. Using instanceof directly is repetitive. Type assertions (as FatalError) bypass type checking and can cause runtime errors if the assertion is wrong.

### Solution

Define type guard functions using TypeScript's type predicate syntax (error is SpecificError). These functions check instanceof and return a boolean, but TypeScript uses the return type to narrow the error type in the if block. This enables safe property access and prevents type assertion bugs.

### Structure

```typescript
// Type guard function returns type predicate
function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}

// TypeScript narrows type automatically
if (isFatalError(error)) {
  process.exit(error.exitCode); // exitCode is known to exist
}
```

### Implementation

**Step 1: Define type guards for custom error classes**

```typescript
/**
 * Type guard for FatalError and subclasses.
 */
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}

/**
 * Type guard for ValidationError.
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for NotFoundError.
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
```

**Step 2: Define type guards for Node.js system errors**

```typescript
/**
 * Type guard for Node.js system errors (ENOENT, EACCES, etc.).
 * These errors have a 'code' property with error code string.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
```

**Step 3: Define type guards for HTTP errors**

```typescript
/**
 * Interface for errors with HTTP status codes.
 */
export interface HttpError extends Error {
  status?: number;
}

/**
 * Extracts HTTP status code from various error shapes.
 * Handles both error.status and error.response.status patterns.
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    // Check for direct status property
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }

    // Check for error.response.status (common in axios errors)
    if ('response' in error) {
      const response = (error as { response?: unknown }).response;
      if (
        typeof response === 'object' &&
        response !== null &&
        'status' in response &&
        typeof (response as { status?: unknown }).status === 'number'
      ) {
        return (response as { status: number }).status;
      }
    }
  }

  return undefined;
}
```

### Complete Example

```typescript
// packages/core/src/utils/errors.ts
import type { NodeJS } from 'node:process';

// Error classes (from Pattern 1)
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
  }
}

export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Type guards
export function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

// HTTP error helpers
export interface HttpError extends Error {
  status?: number;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error && typeof error.status === 'number') {
      return error.status;
    }

    if ('response' in error) {
      const response = (error as { response?: unknown }).response;
      if (typeof response === 'object' && response !== null && 'status' in response) {
        const status = (response as { status?: unknown }).status;
        if (typeof status === 'number') {
          return status;
        }
      }
    }
  }

  return undefined;
}

// Usage in error handler
async function executeTask() {
  try {
    await performRiskyOperation();
  } catch (error) {
    // Type-safe error handling using type guards
    if (isFatalError(error)) {
      console.error(`Fatal error (exit ${error.exitCode}): ${error.message}`);
      process.exit(error.exitCode);
    }

    if (isValidationError(error)) {
      console.error(`Validation failed for ${error.field}: ${error.message}`);
      console.error(`Received value: ${error.value}`);
      // Continue execution - non-fatal
      return;
    }

    if (isNodeError(error)) {
      switch (error.code) {
        case 'ENOENT':
          console.error(`File not found: ${error.path}`);
          break;
        case 'EACCES':
          console.error(`Permission denied: ${error.path}`);
          break;
        case 'EEXIST':
          console.error(`File already exists: ${error.path}`);
          break;
        default:
          console.error(`File system error (${error.code}): ${error.message}`);
      }
      return;
    }

    // Check for HTTP errors
    const status = getErrorStatus(error);
    if (status !== undefined) {
      if (status === 401) {
        throw new FatalAuthenticationError('Authentication required');
      }
      if (status === 403) {
        console.error('Access forbidden');
        return;
      }
      if (status >= 500) {
        console.error(`Server error (${status}), retrying...`);
        // Retry logic
        return;
      }
    }

    // Unknown error type
    console.error('Unknown error:', error);
    process.exit(1);
  }
}
```

**Example explained:**

- Lines 28-42: Type guard functions using type predicate syntax (error is Type)
- Lines 45-71: HTTP error status extraction handling multiple error shapes
- Lines 74-123: Usage example showing type-safe error handling with narrowed types
- Lines 82-86: After isFatalError check, TypeScript knows error.exitCode exists
- Lines 88-93: After isValidationError check, error.field and error.value are available
- Lines 95-110: After isNodeError check, error.code and error.path are available

### When to Use

**Use type guards when:**

- Catching errors and need to access type-specific properties
- Want type-safe error handling without type assertions
- Building reusable error handling utilities
- Need to distinguish between multiple error types

**Avoid type guards when:**

- Only handling generic Error (no specific properties needed)
- Error type is already known (no narrowing needed)
- Can use polymorphism instead (error.handle() method)

### Benefits

- **Type Safety**: Compiler enforces property existence after type guard
- **No Type Assertions**: Eliminates unsafe (as Type) casts
- **Reusability**: Type guards centralize type checking logic
- **IntelliSense**: IDE autocompletes properties after type narrowing
- **Maintainability**: Changes to error types are caught at compile time

### Trade-offs

- **Verbosity**: Requires defining explicit type guard functions
- **instanceof Limitations**: Doesn't work across different JavaScript contexts (iframes, workers)
- **Runtime Overhead**: Type checks execute at runtime (minimal cost)

### Common Mistakes

**Mistake 1: Using type assertions instead of type guards**

**Bad example:**

```typescript
catch (error) {
  const fatalError = error as FatalError;
  process.exit(fatalError.exitCode); // Crashes if error isn't FatalError
}
```

**Correct approach:**

```typescript
catch (error) {
  if (isFatalError(error)) {
    process.exit(error.exitCode); // Type-safe
  }
}
```

**Why this matters**: Type assertions bypass runtime checks. If error isn't actually FatalError, accessing exitCode returns undefined and process.exit fails silently or with wrong code.

**Mistake 2: Not handling all error types**

**Bad example:**

```typescript
catch (error) {
  if (isFatalError(error)) {
    process.exit(error.exitCode);
  }
  // What about non-fatal errors? Code continues with unhandled error
}
```

**Correct approach:**

```typescript
catch (error) {
  if (isFatalError(error)) {
    process.exit(error.exitCode);
  }

  if (isValidationError(error)) {
    console.error(`Validation error: ${error.message}`);
    return; // Handle explicitly
  }

  // Default handling for unknown errors
  console.error('Unexpected error:', error);
  process.exit(1);
}
```

**Why this matters**: Unhandled errors cause silent failures or undefined behavior. Always have a default case.

### Testing Strategy

**What to Test:**

- Type guards return true for correct type instances
- Type guards return false for incorrect types
- Type guards work with subclasses (FatalAuthenticationError is FatalError)
- Type narrowing enables access to type-specific properties
- Edge cases (null, undefined, non-Error objects)

**Test Organization:**

- Group type guard tests with error class tests
- Test each type guard in its own describe block
- Test both positive (returns true) and negative (returns false) cases

**Mock Strategy:**

- No mocks needed - test with real error instances
- Create error instances directly for testing

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  FatalError,
  FatalAuthenticationError,
  ValidationError,
  isFatalError,
  isValidationError,
  isNodeError,
  getErrorStatus,
} from './errors.js';

describe('Error Type Guards', () => {
  describe('isFatalError', () => {
    it('should return true for FatalError instances', () => {
      // Arrange
      const error = new FatalError('Test error', 99);

      // Act & Assert
      expect(isFatalError(error)).to.be.true;
    });

    it('should return true for FatalError subclasses', () => {
      // Arrange
      const error = new FatalAuthenticationError('Auth failed');

      // Act & Assert
      expect(isFatalError(error)).to.be.true;
    });

    it('should return false for non-FatalError instances', () => {
      // Arrange
      const error = new Error('Regular error');

      // Act & Assert
      expect(isFatalError(error)).to.be.false;
    });

    it('should return false for non-Error values', () => {
      // Act & Assert
      expect(isFatalError('string')).to.be.false;
      expect(isFatalError(null)).to.be.false;
      expect(isFatalError(undefined)).to.be.false;
      expect(isFatalError({})).to.be.false;
    });

    it('should enable type-safe property access after narrowing', () => {
      // Arrange
      const error: unknown = new FatalError('Test', 99);

      // Act & Assert
      if (isFatalError(error)) {
        // TypeScript knows error.exitCode exists
        expect(error.exitCode).to.equal(99);
      } else {
        throw new Error('Type guard should have returned true');
      }
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError instances', () => {
      // Arrange
      const error = new ValidationError('Invalid', 'field', 'value');

      // Act & Assert
      expect(isValidationError(error)).to.be.true;
    });

    it('should return false for non-ValidationError instances', () => {
      // Arrange
      const error = new Error('Regular error');

      // Act & Assert
      expect(isValidationError(error)).to.be.false;
    });

    it('should enable access to ValidationError properties', () => {
      // Arrange
      const error: unknown = new ValidationError('Invalid', 'testField', 123);

      // Act & Assert
      if (isValidationError(error)) {
        expect(error.field).to.equal('testField');
        expect(error.value).to.equal(123);
      } else {
        throw new Error('Type guard should have returned true');
      }
    });
  });

  describe('isNodeError', () => {
    it('should return true for Node.js system errors', () => {
      // Arrange
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      error.path = '/some/path';

      // Act & Assert
      expect(isNodeError(error)).to.be.true;
    });

    it('should return false for errors without code property', () => {
      // Arrange
      const error = new Error('Regular error');

      // Act & Assert
      expect(isNodeError(error)).to.be.false;
    });

    it('should enable access to Node error properties', () => {
      // Arrange
      const error: unknown = new Error('EACCES') as NodeJS.ErrnoException;
      (error as NodeJS.ErrnoException).code = 'EACCES';
      (error as NodeJS.ErrnoException).path = '/restricted';

      // Act & Assert
      if (isNodeError(error)) {
        expect(error.code).to.equal('EACCES');
        expect(error.path).to.equal('/restricted');
      } else {
        throw new Error('Type guard should have returned true');
      }
    });
  });

  describe('getErrorStatus', () => {
    it('should extract status from direct status property', () => {
      // Arrange
      const error = { status: 404, message: 'Not found' };

      // Act
      const status = getErrorStatus(error);

      // Assert
      expect(status).to.equal(404);
    });

    it('should extract status from error.response.status', () => {
      // Arrange
      const error = {
        response: {
          status: 500,
          data: 'Server error',
        },
      };

      // Act
      const status = getErrorStatus(error);

      // Assert
      expect(status).to.equal(500);
    });

    it('should return undefined for errors without status', () => {
      // Arrange
      const error = new Error('No status');

      // Act
      const status = getErrorStatus(error);

      // Assert
      expect(status).to.be.undefined;
    });

    it('should return undefined for non-object values', () => {
      // Act & Assert
      expect(getErrorStatus('string')).to.be.undefined;
      expect(getErrorStatus(null)).to.be.undefined;
      expect(getErrorStatus(undefined)).to.be.undefined;
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (type guards are small)
- Branch coverage: 100% (all type paths tested)
- Function coverage: 100% (all type guards tested)

### Related Patterns

- **[Error Class Hierarchy](./04-error-handling-patterns.md#pattern-1-error-class-hierarchy)** - Defines error types that type guards check
- **[Type Guards](./03-type-safety-patterns.md#pattern-2-type-guards)** - General type guard pattern
- **[Unknown Type Narrowing](./03-type-safety-patterns.md#pattern-1-no-any-types)** - Using unknown with narrowing

---

## Pattern 3: Friendly Error Conversion

### Intent

Convert technical errors with API status codes and system error codes into user-friendly error messages with appropriate error types.

### Problem

Errors from external APIs (HTTP errors) and system operations (file system errors) contain technical details like status codes (401, 403, 500) and error codes (ENOENT, EACCES). These are not helpful to end users. Code must check error properties and status codes, then construct friendly messages and map to appropriate error types. This logic gets duplicated across error handlers.

### Solution

Create a centralized error conversion function that inspects error types and status codes, then returns new error instances with user-friendly messages. The function handles HTTP errors (400, 401, 403, 404, 429, 500), Node.js system errors (ENOENT, EACCES, EEXIST), and unknown errors. It returns typed error instances (BadRequestError, FatalAuthenticationError, etc.) that callers can handle appropriately.

### Structure

```typescript
function toFriendlyError(error: unknown): Error {
  // Check for HTTP errors
  if (isApiError(error)) {
    switch (error.statusCode) {
      case 401: return new FatalAuthenticationError('Please login again');
      case 403: return new ForbiddenError('Access denied');
      case 404: return new NotFoundError(...);
      // ...
    }
  }

  // Check for Node.js system errors
  if (isNodeError(error)) {
    switch (error.code) {
      case 'ENOENT': return new NotFoundError(...);
      case 'EACCES': return new Error('Permission denied');
      // ...
    }
  }

  // Return as-is or wrap unknown errors
  return error instanceof Error ? error : new Error(String(error));
}
```

### Implementation

**Step 1: Define interface for API errors**

```typescript
interface GaxiosError {
  response?: {
    data?: unknown;
  };
}

interface ResponseData {
  error?: {
    code?: number;
    message?: string;
  };
}

/**
 * Parse API response data from Gaxios error.
 * Handles both JSON objects and JSON strings.
 */
function parseResponseData(error: GaxiosError): ResponseData {
  // Sometimes response data is a string that needs parsing
  if (typeof error.response?.data === 'string') {
    return JSON.parse(error.response.data) as ResponseData;
  }
  return error.response?.data as ResponseData;
}
```

**Step 2: Convert HTTP errors to friendly errors**

```typescript
/**
 * Convert technical API errors to user-friendly error instances.
 */
export function toFriendlyError(error: unknown): Error {
  // Handle API errors with response data
  if (error && typeof error === 'object' && 'response' in error) {
    const gaxiosError = error as GaxiosError;
    const data = parseResponseData(gaxiosError);

    if (data.error && data.error.message && data.error.code) {
      const statusCode = data.error.code;
      const message = data.error.message;

      switch (statusCode) {
        case 400:
          return new BadRequestError(message);

        case 401:
          return new UnauthorizedError(message);

        case 403:
          // Pass original message - may explain specific restriction
          return new ForbiddenError(message);

        case 404:
          return new NotFoundError('Resource not found', 'api_resource', 'unknown');

        case 429:
          return new Error('Rate limit exceeded. Please try again later.');

        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error. Please try again or contact support.');
      }
    }
  }

  // Handle Node.js file system errors
  if (isNodeError(error)) {
    switch (error.code) {
      case 'ENOENT':
        return new NotFoundError(`File not found: ${error.path}`, 'file', error.path || 'unknown');

      case 'EACCES':
      case 'EPERM':
        return new Error(`Permission denied: ${error.path}`);

      case 'EEXIST':
        return new Error(`File already exists: ${error.path}`);

      case 'ENOSPC':
        return new Error('No space left on device');

      case 'EISDIR':
        return new Error(`Expected file but found directory: ${error.path}`);

      case 'ENOTDIR':
        return new Error(`Expected directory but found file: ${error.path}`);
    }
  }

  // Return as-is if already Error
  if (error instanceof Error) {
    return error;
  }

  // Wrap unknown error types
  return new Error(`Unknown error: ${String(error)}`);
}
```

**Step 3: Use in error handlers**

```typescript
async function executeWithFriendlyErrors() {
  try {
    await riskyOperation();
  } catch (error) {
    // Convert to friendly error
    const friendlyError = toFriendlyError(error);

    // Log user-friendly message
    console.error(friendlyError.message);

    // Handle based on error type
    if (isFatalError(friendlyError)) {
      process.exit(friendlyError.exitCode);
    }
  }
}
```

### Complete Example

```typescript
// packages/core/src/utils/errors.ts

// Error classes (from Pattern 1)
export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}

export class ForbiddenError extends Error {}
export class UnauthorizedError extends Error {}
export class BadRequestError extends Error {}
export class NotFoundError extends Error {
  constructor(
    message: string,
    public readonly resourceType: string,
    public readonly resourceId: string
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// API error handling
interface GaxiosError {
  response?: {
    data?: unknown;
  };
}

interface ResponseData {
  error?: {
    code?: number;
    message?: string;
  };
}

function parseResponseData(error: GaxiosError): ResponseData {
  // Gaxios sometimes doesn't JSONify the response data
  if (typeof error.response?.data === 'string') {
    return JSON.parse(error.response.data) as ResponseData;
  }
  return error.response?.data as ResponseData;
}

/**
 * Convert technical errors to user-friendly error instances.
 * Handles API errors, file system errors, and unknown error types.
 */
export function toFriendlyError(error: unknown): Error {
  // Handle API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const gaxiosError = error as GaxiosError;
    const data = parseResponseData(gaxiosError);

    if (data.error && data.error.message && data.error.code) {
      switch (data.error.code) {
        case 400:
          return new BadRequestError(data.error.message);

        case 401:
          return new UnauthorizedError(data.error.message);

        case 403:
          // Important to pass original message - may explain cause
          // like "cloud project doesn't have feature enabled"
          return new ForbiddenError(data.error.message);

        case 404:
          return new NotFoundError('Resource not found', 'api_resource', 'unknown');

        case 429:
          return new Error('Rate limit exceeded. Please try again later.');

        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error. Please try again or contact support.');
      }
    }
  }

  // Handle Node.js file system errors
  if (isNodeError(error)) {
    switch (error.code) {
      case 'ENOENT':
        return new NotFoundError(`File not found: ${error.path}`, 'file', error.path || 'unknown');

      case 'EACCES':
      case 'EPERM':
        return new Error(`Permission denied: ${error.path}`);

      case 'EEXIST':
        return new Error(`File already exists: ${error.path}`);

      case 'ENOSPC':
        return new Error('No space left on device');

      case 'EISDIR':
        return new Error(`Expected file but found directory: ${error.path}`);

      case 'ENOTDIR':
        return new Error(`Expected directory but found file: ${error.path}`);
    }
  }

  // Return as-is if already an Error
  if (error instanceof Error) {
    return error;
  }

  // Wrap unknown error types
  return new Error(`Unknown error: ${String(error)}`);
}

// Usage example
async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    const friendlyError = toFriendlyError(error);
    console.error(friendlyError.message);

    if (isFatalError(friendlyError)) {
      process.exit(friendlyError.exitCode);
    }

    throw friendlyError;
  }
}
```

**Example explained:**

- Lines 36-49: parseResponseData handles both JSON objects and JSON strings from API
- Lines 51-118: toFriendlyError converts errors based on type and code
- Lines 57-93: HTTP error conversion with appropriate error types
- Lines 96-113: Node.js error conversion with file path context
- Lines 116-122: Fallback for unknown errors
- Lines 125-142: Usage showing error conversion and handling

### When to Use

**Use error conversion when:**

- Errors come from external APIs or system calls
- Want consistent user-facing error messages
- Need to map technical codes to error types
- Building CLI tools for end users (not developers)

**Avoid error conversion when:**

- Building library code (preserve original errors)
- Users are developers who need technical details
- Errors are already user-friendly
- Need to preserve full error context for debugging

### Benefits

- **User-Friendly**: Technical details replaced with clear messages
- **Centralized**: Error mapping logic in one place instead of scattered
- **Consistent**: Same errors produce same messages across codebase
- **Type-Safe**: Returns typed error instances for proper handling
- **Maintainable**: Easy to add new error codes and mappings

### Trade-offs

- **Information Loss**: Technical details may be hidden from users who need them
- **Maintenance Burden**: Must update conversion function when new error codes appear
- **Generic Messages**: May lose specificity of original error message
- **Extra Layer**: Adds indirection between error source and handler

### Common Mistakes

**Mistake 1: Losing important context from original error**

**Bad example:**

```typescript
function toFriendlyError(error: unknown): Error {
  if (isNodeError(error) && error.code === 'ENOENT') {
    return new Error('File not found'); // Lost which file
  }
  return error as Error;
}
```

**Correct approach:**

```typescript
function toFriendlyError(error: unknown): Error {
  if (isNodeError(error) && error.code === 'ENOENT') {
    return new NotFoundError(`File not found: ${error.path}`, 'file', error.path || 'unknown');
  }
  return error as Error;
}
```

**Why this matters**: Users need to know which file is missing to take action. Always preserve actionable context.

**Mistake 2: Not handling all common error codes**

**Bad example:**

```typescript
function toFriendlyError(error: unknown): Error {
  if (isApiError(error) && error.status === 401) {
    return new FatalAuthenticationError('Please login');
  }
  // Missing 403, 404, 429, 500, etc.
  return error as Error;
}
```

**Correct approach:**

```typescript
function toFriendlyError(error: unknown): Error {
  if (isApiError(error)) {
    switch (error.status) {
      case 400: return new BadRequestError(error.message);
      case 401: return new UnauthorizedError(error.message);
      case 403: return new ForbiddenError(error.message);
      case 404: return new NotFoundError(...);
      case 429: return new Error('Rate limit exceeded');
      case 500: return new Error('Server error');
      // ... handle all common codes
    }
  }
  return error as Error;
}
```

**Why this matters**: Unhandled error codes result in technical messages leaking to users.

### Testing Strategy

**What to Test:**

- Conversion produces correct error types for each status/error code
- User-friendly messages contain necessary context
- Original error context (paths, IDs) is preserved
- Unknown errors are handled gracefully
- Already-friendly errors pass through unchanged

**Test Organization:**

- Group tests by error source (API errors, Node errors, unknown)
- Test each status code and error code individually
- Test edge cases (null, undefined, malformed errors)

**Mock Strategy:**

- Create mock errors matching real error shapes
- No need to mock actual HTTP calls or file system

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  toFriendlyError,
  FatalAuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from './errors.js';

describe('toFriendlyError', () => {
  describe('API Errors', () => {
    it('should convert 400 to BadRequestError', () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            error: {
              code: 400,
              message: 'Invalid request parameters',
            },
          },
        },
      };

      // Act
      const result = toFriendlyError(apiError);

      // Assert
      expect(result).to.be.instanceOf(BadRequestError);
      expect(result.message).to.equal('Invalid request parameters');
    });

    it('should convert 401 to UnauthorizedError', () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            error: {
              code: 401,
              message: 'Authentication required',
            },
          },
        },
      };

      // Act
      const result = toFriendlyError(apiError);

      // Assert
      expect(result).to.be.instanceOf(UnauthorizedError);
      expect(result.message).to.equal('Authentication required');
    });

    it('should convert 403 to ForbiddenError with original message', () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            error: {
              code: 403,
              message: 'Project does not have feature enabled',
            },
          },
        },
      };

      // Act
      const result = toFriendlyError(apiError);

      // Assert
      expect(result).to.be.instanceOf(ForbiddenError);
      expect(result.message).to.equal('Project does not have feature enabled');
    });

    it('should convert 500 to generic server error', () => {
      // Arrange
      const apiError = {
        response: {
          data: {
            error: {
              code: 500,
              message: 'Internal server error details',
            },
          },
        },
      };

      // Act
      const result = toFriendlyError(apiError);

      // Assert
      expect(result).to.be.instanceOf(Error);
      expect(result.message).to.include('Server error');
    });

    it('should handle JSON string response data', () => {
      // Arrange
      const apiError = {
        response: {
          data: JSON.stringify({
            error: {
              code: 404,
              message: 'Not found',
            },
          }),
        },
      };

      // Act
      const result = toFriendlyError(apiError);

      // Assert
      expect(result).to.be.instanceOf(NotFoundError);
    });
  });

  describe('Node.js System Errors', () => {
    it('should convert ENOENT to NotFoundError with path', () => {
      // Arrange
      const nodeError = new Error('ENOENT') as NodeJS.ErrnoException;
      nodeError.code = 'ENOENT';
      nodeError.path = '/some/file.txt';

      // Act
      const result = toFriendlyError(nodeError);

      // Assert
      expect(result).to.be.instanceOf(NotFoundError);
      expect(result.message).to.include('/some/file.txt');
      if (result instanceof NotFoundError) {
        expect(result.resourceType).to.equal('file');
        expect(result.resourceId).to.equal('/some/file.txt');
      }
    });

    it('should convert EACCES to permission error with path', () => {
      // Arrange
      const nodeError = new Error('EACCES') as NodeJS.ErrnoException;
      nodeError.code = 'EACCES';
      nodeError.path = '/restricted/file';

      // Act
      const result = toFriendlyError(nodeError);

      // Assert
      expect(result.message).to.include('Permission denied');
      expect(result.message).to.include('/restricted/file');
    });

    it('should convert EEXIST to file exists error', () => {
      // Arrange
      const nodeError = new Error('EEXIST') as NodeJS.ErrnoException;
      nodeError.code = 'EEXIST';
      nodeError.path = '/existing/file';

      // Act
      const result = toFriendlyError(nodeError);

      // Assert
      expect(result.message).to.include('already exists');
      expect(result.message).to.include('/existing/file');
    });
  });

  describe('Unknown Errors', () => {
    it('should return Error as-is if already Error', () => {
      // Arrange
      const error = new Error('Existing error message');

      // Act
      const result = toFriendlyError(error);

      // Assert
      expect(result).to.equal(error);
      expect(result.message).to.equal('Existing error message');
    });

    it('should wrap non-Error values in Error', () => {
      // Arrange & Act
      const result1 = toFriendlyError('string error');
      const result2 = toFriendlyError(42);
      const result3 = toFriendlyError(null);

      // Assert
      expect(result1.message).to.include('string error');
      expect(result2.message).to.include('42');
      expect(result3.message).to.include('null');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+ (covers all error code paths)
- Branch coverage: 90%+ (all switch cases tested)
- Function coverage: 100%

### Related Patterns

- **[Error Class Hierarchy](./04-error-handling-patterns.md#pattern-1-error-class-hierarchy)** - Defines error types that conversion produces
- **[Error Type Guards](./04-error-handling-patterns.md#pattern-2-error-type-guards)** - Used to check error types before conversion
- **[Retry with Backoff](./04-error-handling-patterns.md#pattern-4-retry-with-exponential-backoff)** - Often combined with error conversion

---

## Pattern 4: Retry with Exponential Backoff

### Intent

Automatically retry failed operations with increasing delays and randomized jitter to handle transient failures gracefully while avoiding thundering herd problems.

### Problem

Network requests, API calls, and external service operations fail transiently due to rate limits, temporary service unavailability, or network issues. Manual retry logic gets duplicated across the codebase with inconsistent retry counts, delays, and error handling. Simple retry loops without delays create thundering herd problems where all clients retry simultaneously, overwhelming the recovering service. Fixed delays don't adapt to the severity of the issue.

### Solution

Create a generic retry function that wraps any async operation, catches failures, waits with exponential backoff and randomized jitter, then retries. The function takes configurable retry options (max attempts, initial delay, backoff multiplier) and a predicate function to determine if an error is retryable. Exponential backoff increases delay after each failure. Jitter randomizes delays to prevent synchronized retry storms. Non-retryable errors immediately throw without retry.

### Structure

```typescript
async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  let delay = options.initialDelayMs;

  while (attempt < options.maxAttempts) {
    try {
      return await fn(); // Success
    } catch (error) {
      if (!options.shouldRetryOnError(error)) {
        throw error; // Non-retryable
      }

      // Exponential backoff with jitter
      const jitter = delay * 0.3 * (Math.random() * 2 - 1);
      await wait(delay + jitter);
      delay = Math.min(delay * 2, options.maxDelayMs);
      attempt++;
    }
  }

  throw lastError;
}
```

### Implementation

**Step 1: Define retry options interface**

```typescript
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  shouldRetryOnError: (error: Error) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
  signal?: AbortSignal;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 5000,
  maxDelayMs: 30000,
  shouldRetryOnError: defaultShouldRetry,
};

/**
 * Default retry predicate: retry on 429 (rate limit) and 5xx (server errors).
 */
function defaultShouldRetry(error: Error | unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined) {
    // Explicitly do not retry 400 (Bad Request)
    if (status === 400) return false;
    // Retry on rate limit and server errors
    return status === 429 || (status >= 500 && status < 600);
  }
  return false;
}
```

**Step 2: Implement exponential backoff with jitter**

```typescript
/**
 * Delay helper that supports abort signals.
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (signal.aborted) {
    return Promise.reject(new Error('Aborted'));
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(new Error('Aborted'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}
```

**Step 3: Implement retry loop**

```typescript
/**
 * Retry an async function with exponential backoff and jitter.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to function result if successful
 * @throws Last error if all retries exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // Check for abort before starting
  if (options?.signal?.aborted) {
    throw new Error('Aborted');
  }

  // Validate options
  if (options?.maxAttempts !== undefined && options.maxAttempts <= 0) {
    throw new Error('maxAttempts must be a positive number');
  }

  // Merge with defaults
  const { maxAttempts, initialDelayMs, maxDelayMs, shouldRetryOnError, onRetry, signal } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let attempt = 0;
  let currentDelay = initialDelayMs;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    // Check for abort
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    attempt++;

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this was the last attempt
      if (attempt >= maxAttempts) {
        break;
      }

      // Check if error is retryable
      if (!shouldRetryOnError(error as Error)) {
        throw error;
      }

      // Notify about retry
      onRetry?.(attempt, error);

      // Calculate delay with exponential backoff and jitter
      // Jitter is ±30% of current delay
      const jitter = currentDelay * 0.3 * (Math.random() * 2 - 1);
      const delayWithJitter = Math.max(0, currentDelay + jitter);

      // Wait before retrying
      await delay(delayWithJitter, signal);

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(maxDelayMs, currentDelay * 2);
    }
  }

  throw lastError;
}
```

### Complete Example

```typescript
// packages/core/src/utils/retry.ts
import { getErrorStatus } from './httpErrors.js';

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  shouldRetryOnError: (error: Error) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
  signal?: AbortSignal;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 5000,
  maxDelayMs: 30000,
  shouldRetryOnError: defaultShouldRetry,
};

function defaultShouldRetry(error: Error | unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined) {
    if (status === 400) return false;
    return status === 429 || (status >= 500 && status < 600);
  }
  return false;
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (signal.aborted) {
    return Promise.reject(new Error('Aborted'));
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(new Error('Aborted'));
    };

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  if (options?.signal?.aborted) {
    throw new Error('Aborted');
  }

  if (options?.maxAttempts !== undefined && options.maxAttempts <= 0) {
    throw new Error('maxAttempts must be a positive number');
  }

  const { maxAttempts, initialDelayMs, maxDelayMs, shouldRetryOnError, onRetry, signal } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let attempt = 0;
  let currentDelay = initialDelayMs;

  while (attempt < maxAttempts) {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    attempt++;

    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !shouldRetryOnError(error as Error)) {
        throw error;
      }

      onRetry?.(attempt, error);

      // Exponential backoff with ±30% jitter
      const jitter = currentDelay * 0.3 * (Math.random() * 2 - 1);
      const delayWithJitter = Math.max(0, currentDelay + jitter);

      await delay(delayWithJitter, signal);

      currentDelay = Math.min(maxDelayMs, currentDelay * 2);
    }
  }

  throw new Error('Retry attempts exhausted');
}

// Usage example
async function fetchWithRetry(url: string) {
  return retryWithBackoff(
    () =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt} after error:`, error);
      },
    }
  );
}
```

**Example explained:**

- Lines 3-11: RetryOptions interface defining all configuration parameters
- Lines 13-19: Default options with 3 attempts, 5s initial delay, 30s max delay
- Lines 21-28: Default predicate retries rate limits (429) and server errors (5xx)
- Lines 30-56: Delay helper with abort signal support for cancellation
- Lines 58-109: Main retry loop with exponential backoff and jitter calculation
- Lines 92-94: Jitter is ±30% of current delay to randomize retry timing
- Lines 99: Exponential backoff doubles delay each attempt up to maxDelayMs
- Lines 112-125: Usage example showing retry configuration

### When to Use

**Use retry with backoff when:**

- Making network requests or API calls
- Interacting with external services that may have transient failures
- Rate limits are expected (429 errors)
- Server errors (5xx) may be temporary
- Operation is idempotent (safe to retry)

**Avoid retry with backoff when:**

- Operation is not idempotent (creates duplicate resources)
- Errors are permanent (400 Bad Request, 401 Unauthorized)
- User action is required to fix the error
- Immediate failure is better than delayed failure
- Operation has strict time constraints

### Benefits

- **Automatic Recovery**: Transient failures resolve without manual intervention
- **Thundering Herd Prevention**: Jitter prevents synchronized retry storms
- **Adaptive Backoff**: Exponential delays adapt to issue severity
- **Configurable**: Retry behavior customizable per operation
- **Abort Support**: Can be canceled via AbortSignal

### Trade-offs

- **Increased Latency**: Retries add delays to failed operations
- **Resource Usage**: Multiple attempts consume more resources
- **Complexity**: More complex than simple try-catch
- **Potential Amplification**: Retries can amplify load if service is down

### Common Mistakes

**Mistake 1: Retrying non-idempotent operations**

**Bad example:**

```typescript
// Creates duplicate payments on retry
await retryWithBackoff(() => createPayment(amount));
```

**Correct approach:**

```typescript
// Make operation idempotent with request ID
const requestId = generateUniqueId();
await retryWithBackoff(() => createPayment(amount, { requestId }));
```

**Why this matters**: Retrying non-idempotent operations causes duplicate side effects. Always use idempotency keys or check for existing resources before creating.

**Mistake 2: Retrying permanent errors**

**Bad example:**

```typescript
await retryWithBackoff(() => fetch(url), {
  shouldRetryOnError: () => true, // Retries everything
});
```

**Correct approach:**

```typescript
await retryWithBackoff(() => fetch(url), {
  shouldRetryOnError: (error) => {
    const status = getErrorStatus(error);
    // Only retry transient errors
    return status === 429 || (status !== undefined && status >= 500);
  },
});
```

**Why this matters**: Retrying permanent errors (400, 401, 404) wastes time and resources. Check error type before retrying.

**Mistake 3: No maximum delay cap**

**Bad example:**

```typescript
await retryWithBackoff(() => fetch(url), {
  maxDelayMs: Infinity, // Delays can grow infinitely
});
```

**Correct approach:**

```typescript
await retryWithBackoff(() => fetch(url), {
  maxDelayMs: 30000, // Cap at 30 seconds
});
```

**Why this matters**: Without maxDelayMs cap, delays can grow to minutes or hours, making the operation appear hung.

### Testing Strategy

**What to Test:**

- Successful operation on first attempt
- Retry after transient failures
- Error thrown after max attempts exhausted
- Non-retryable errors throw immediately
- Exponential backoff increases delays correctly
- Jitter randomizes delays
- Abort signal cancels retry loop
- onRetry callback invoked correctly

**Test Organization:**

- Group tests by success/failure scenarios
- Use fake timers to control delay timing
- Test both retryable and non-retryable errors

**Mock Strategy:**

- Create mock functions that fail N times then succeed
- Use fake timers (vitest useFakeTimers) to control delays
- Mock onRetry callback to verify invocations

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { stub, useFakeTimers, SinonFakeTimers } from 'sinon';
import { retryWithBackoff } from './retry.js';

describe('retryWithBackoff', () => {
  let clock: SinonFakeTimers;

  beforeEach(() => {
    clock = useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should return result on first attempt if successful', async () => {
    // Arrange
    const mockFn = stub().resolves('success');

    // Act
    const result = await retryWithBackoff(mockFn);

    // Assert
    expect(result).to.equal('success');
    expect(mockFn.callCount).to.equal(1);
  });

  it('should retry and succeed if failures are within maxAttempts', async () => {
    // Arrange
    const mockFn = stub();
    mockFn.onCall(0).rejects(new Error('Fail 1'));
    mockFn.onCall(1).rejects(new Error('Fail 2'));
    mockFn.onCall(2).resolves('success');

    // Act
    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetryOnError: () => true,
    });

    // Advance timers through delays
    await clock.tickAsync(100); // First retry delay
    await clock.tickAsync(200); // Second retry delay

    const result = await promise;

    // Assert
    expect(result).to.equal('success');
    expect(mockFn.callCount).to.equal(3);
  });

  it('should throw error if all attempts fail', async () => {
    // Arrange
    const error = new Error('Persistent failure');
    const mockFn = stub().rejects(error);

    // Act
    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetryOnError: () => true,
    });

    // Advance timers
    await clock.tickAsync(100);
    await clock.tickAsync(200);

    // Assert
    await expect(promise).to.be.rejectedWith('Persistent failure');
    expect(mockFn.callCount).to.equal(3);
  });

  it('should not retry non-retryable errors', async () => {
    // Arrange
    const error = new Error('Non-retryable');
    const mockFn = stub().rejects(error);

    // Act & Assert
    await expect(
      retryWithBackoff(mockFn, {
        maxAttempts: 3,
        shouldRetryOnError: () => false,
      })
    ).to.be.rejectedWith('Non-retryable');

    expect(mockFn.callCount).to.equal(1); // No retries
  });

  it('should call onRetry callback for each retry attempt', async () => {
    // Arrange
    const mockFn = stub();
    mockFn.onCall(0).rejects(new Error('Fail 1'));
    mockFn.onCall(1).rejects(new Error('Fail 2'));
    mockFn.onCall(2).resolves('success');

    const onRetry = stub();

    // Act
    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetryOnError: () => true,
      onRetry,
    });

    await clock.tickAsync(100);
    await clock.tickAsync(200);

    await promise;

    // Assert
    expect(onRetry.callCount).to.equal(2);
    expect(onRetry.firstCall.args[0]).to.equal(1); // First retry
    expect(onRetry.secondCall.args[0]).to.equal(2); // Second retry
  });

  it('should respect abort signal', async () => {
    // Arrange
    const controller = new AbortController();
    const mockFn = stub().rejects(new Error('Fail'));

    // Act
    const promise = retryWithBackoff(mockFn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      shouldRetryOnError: () => true,
      signal: controller.signal,
    });

    // Abort after first failure
    setTimeout(() => controller.abort(), 50);
    await clock.tickAsync(50);

    // Assert
    await expect(promise).to.be.rejectedWith('Aborted');
  });

  it('should throw error if maxAttempts is zero or negative', async () => {
    // Arrange
    const mockFn = stub().resolves('success');

    // Act & Assert
    await expect(retryWithBackoff(mockFn, { maxAttempts: 0 })).to.be.rejectedWith(
      'maxAttempts must be a positive number'
    );

    await expect(retryWithBackoff(mockFn, { maxAttempts: -1 })).to.be.rejectedWith(
      'maxAttempts must be a positive number'
    );
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+ (covers all retry paths)
- Branch coverage: 90%+ (all conditions tested)
- Function coverage: 100%

### Related Patterns

- **[Error Type Guards](./04-error-handling-patterns.md#pattern-2-error-type-guards)** - Used to check if error is retryable
- **[Friendly Error Conversion](./04-error-handling-patterns.md#pattern-3-friendly-error-conversion)** - Often combined after retries exhausted

---

## Pattern 5: Result Objects Over Exceptions

### Intent

Return error information as part of the result object instead of throwing exceptions, making errors explicit in the return type and part of normal data flow.

### Problem

Tool execution in CLI applications can fail in many ways (file not found, permission denied, invalid input, execution timeout). Using exceptions for all failures forces callers to wrap every tool call in try-catch blocks. Exception handling disrupts normal control flow and makes it harder to test error cases. Different tools throw different error types, leading to inconsistent error handling. Callers may forget to catch exceptions, causing uncaught errors to crash the application.

### Solution

Define a ToolResult interface with an optional error field. Tools always return ToolResult objects (never throw exceptions except for truly exceptional conditions like programming errors). Success results have content and no error. Failure results have error details with error type, message, and optional code. Callers check the error field to determine success/failure. This makes errors explicit in the type system and forces callers to handle errors.

### Structure

```typescript
interface ToolResult {
  llmContent: string;
  returnDisplay: string;
  error?: {
    message: string;
    type: ToolErrorType;
    code?: string;
  };
}

// Tool execution always returns ToolResult
async function executeTool(): Promise<ToolResult> {
  try {
    const content = await performWork();
    return { llmContent: content, returnDisplay: 'Success' };
  } catch (error) {
    return {
      llmContent: 'Error occurred',
      returnDisplay: 'Error',
      error: {
        message: getErrorMessage(error),
        type: ToolErrorType.EXECUTION_FAILED,
      },
    };
  }
}

// Caller checks error field
const result = await executeTool();
if (result.error) {
  console.error(result.error.message);
  // Handle error
}
```

### Implementation

**Step 1: Define ToolErrorType enum**

```typescript
/**
 * Categorizes tool errors as recoverable or fatal.
 *
 * Recoverable errors: LLM can self-correct (e.g., file not found, invalid params)
 * Fatal errors: System-level issues preventing continued execution
 */
export enum ToolErrorType {
  // General errors
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  UNKNOWN = 'unknown',
  UNHANDLED_EXCEPTION = 'unhandled_exception',
  TOOL_NOT_REGISTERED = 'tool_not_registered',
  EXECUTION_FAILED = 'execution_failed',

  // File system errors
  FILE_NOT_FOUND = 'file_not_found',
  FILE_WRITE_FAILURE = 'file_write_failure',
  READ_CONTENT_FAILURE = 'read_content_failure',
  FILE_TOO_LARGE = 'file_too_large',
  PERMISSION_DENIED = 'permission_denied',
  NO_SPACE_LEFT = 'no_space_left',
  PATH_NOT_IN_WORKSPACE = 'path_not_in_workspace',

  // Tool-specific errors
  SHELL_EXECUTE_ERROR = 'shell_execute_error',
  GLOB_EXECUTION_ERROR = 'glob_execution_error',
  GREP_EXECUTION_ERROR = 'grep_execution_error',
}

/**
 * Determines if error type should cause CLI to exit.
 * Only system-level errors like disk full are fatal.
 */
export function isFatalToolError(errorType?: string): boolean {
  if (!errorType) {
    return false;
  }

  const fatalErrors = new Set<string>([ToolErrorType.NO_SPACE_LEFT]);
  return fatalErrors.has(errorType);
}
```

**Step 2: Define ToolResult interface**

```typescript
/**
 * Result returned by all tool executions.
 * Errors are in the error field, not thrown.
 */
interface ToolResult {
  llmContent: string; // Content sent to LLM
  returnDisplay: string; // Human-readable summary
  error?: {
    message: string; // Error description
    type: ToolErrorType; // Error category
    code?: string; // Optional error code
  };
}
```

**Step 3: Implement tool execution returning ToolResult**

```typescript
/**
 * Execute tool by name with parameters.
 * Always returns ToolResult (never throws).
 */
async function executeTool(
  toolName: string,
  params: unknown,
  abortSignal: AbortSignal
): Promise<ToolResult> {
  try {
    // Get tool from registry
    const tool = toolRegistry.get(toolName);
    if (!tool) {
      return {
        llmContent: `Tool not found: ${toolName}`,
        returnDisplay: 'Error',
        error: {
          message: `Tool "${toolName}" is not registered`,
          type: ToolErrorType.TOOL_NOT_REGISTERED,
          code: 'TOOL_NOT_FOUND',
        },
      };
    }

    // Build tool invocation
    const invocation = tool.build(params);

    // Execute tool
    const result = await invocation.execute(abortSignal);

    return result;
  } catch (error) {
    // Catch any unexpected exceptions and convert to ToolResult
    return {
      llmContent: 'Tool execution failed',
      returnDisplay: 'Error',
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: ToolErrorType.UNHANDLED_EXCEPTION,
      },
    };
  }
}
```

**Step 4: Handle ToolResult in callers**

```typescript
async function runWorkflow() {
  const result = await executeTool('read_file', { path: './config.json' }, signal);

  if (result.error) {
    console.error(`Tool error: ${result.error.message}`);

    // Check if error is fatal
    if (isFatalToolError(result.error.type)) {
      console.error('Fatal error - exiting');
      process.exit(1);
    }

    // Handle recoverable errors
    switch (result.error.type) {
      case ToolErrorType.FILE_NOT_FOUND:
        console.log('Using default configuration');
        break;

      case ToolErrorType.PERMISSION_DENIED:
        console.error('Access denied - check file permissions');
        break;

      default:
        console.error('Unexpected error');
    }

    return;
  }

  // Success - process result
  console.log('Tool output:', result.returnDisplay);
  processContent(result.llmContent);
}
```

### Complete Example

```typescript
// packages/core/src/tools/tool-error.ts

/**
 * Typed enum for tool error categories.
 */
export enum ToolErrorType {
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  UNKNOWN = 'unknown',
  UNHANDLED_EXCEPTION = 'unhandled_exception',
  TOOL_NOT_REGISTERED = 'tool_not_registered',
  EXECUTION_FAILED = 'execution_failed',
  FILE_NOT_FOUND = 'file_not_found',
  FILE_WRITE_FAILURE = 'file_write_failure',
  READ_CONTENT_FAILURE = 'read_content_failure',
  FILE_TOO_LARGE = 'file_too_large',
  PERMISSION_DENIED = 'permission_denied',
  NO_SPACE_LEFT = 'no_space_left',
  PATH_NOT_IN_WORKSPACE = 'path_not_in_workspace',
  SHELL_EXECUTE_ERROR = 'shell_execute_error',
}

/**
 * Check if error type requires process exit.
 */
export function isFatalToolError(errorType?: string): boolean {
  if (!errorType) {
    return false;
  }
  const fatalErrors = new Set<string>([ToolErrorType.NO_SPACE_LEFT]);
  return fatalErrors.has(errorType);
}

// packages/core/src/tools/types.ts

interface ToolResult {
  llmContent: string;
  returnDisplay: string;
  error?: {
    message: string;
    type: ToolErrorType;
    code?: string;
  };
}

// packages/core/src/tools/executor.ts

import { ToolRegistry } from './tool-registry.js';
import { ToolErrorType, isFatalToolError } from './tool-error.js';
import type { ToolResult } from './types.js';

/**
 * Execute tool and return result (never throws).
 */
export async function executeTool(
  toolRegistry: ToolRegistry,
  toolName: string,
  params: unknown,
  abortSignal: AbortSignal
): Promise<ToolResult> {
  try {
    const tool = toolRegistry.get(toolName);

    if (!tool) {
      return {
        llmContent: `Tool not found: ${toolName}`,
        returnDisplay: 'Error',
        error: {
          message: `Tool "${toolName}" is not registered`,
          type: ToolErrorType.TOOL_NOT_REGISTERED,
          code: 'TOOL_NOT_FOUND',
        },
      };
    }

    const invocation = tool.build(params);
    const result = await invocation.execute(abortSignal);

    return result;
  } catch (error) {
    return {
      llmContent: 'Tool execution failed',
      returnDisplay: 'Error',
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: ToolErrorType.UNHANDLED_EXCEPTION,
      },
    };
  }
}

// Usage example
async function runCommand() {
  const result = await executeTool(registry, 'read_file', { path: './config.json' }, abortSignal);

  if (result.error) {
    console.error(`Tool error: ${result.error.message}`);

    if (isFatalToolError(result.error.type)) {
      process.exit(1);
    }

    if (result.error.type === ToolErrorType.FILE_NOT_FOUND) {
      console.log('Using defaults');
      return;
    }

    console.error('Unexpected error');
    return;
  }

  console.log('Success:', result.returnDisplay);
  processContent(result.llmContent);
}
```

**Example explained:**

- Lines 5-22: ToolErrorType enum categorizes all error types
- Lines 27-33: isFatalToolError identifies errors requiring process exit
- Lines 38-45: ToolResult interface with optional error field
- Lines 51-80: executeTool returns ToolResult, never throws
- Lines 55-68: Tool not found returns error result instead of throwing
- Lines 73-80: Unexpected exceptions caught and wrapped in ToolResult
- Lines 84-112: Caller checks error field and handles appropriately

### When to Use

**Use result objects when:**

- Building tool execution systems where errors are common
- Want errors explicit in type system
- Need to test error cases easily
- Errors are part of normal operation (not exceptional)
- Want to force callers to handle errors

**Avoid result objects when:**

- Errors are truly exceptional (programming errors)
- Using existing APIs that throw exceptions
- Added verbosity hurts readability significantly
- Team convention strongly prefers exceptions

### Benefits

- **Explicit Errors**: Type system forces error handling
- **No Uncaught Exceptions**: Can't forget to catch errors
- **Easier Testing**: No need to test exception throwing
- **Consistent Handling**: All tools return same result type
- **Error Categories**: ToolErrorType makes error types explicit

### Trade-offs

- **Verbosity**: Every caller must check error field
- **Convention Breaking**: Differs from typical TypeScript exception handling
- **Mixed Patterns**: If some code throws and some returns errors, consistency suffers
- **No Stack Traces**: Errors returned as data don't have automatic stack traces

### Common Mistakes

**Mistake 1: Not checking error field in callers**

**Bad example:**

```typescript
const result = await executeTool('read_file', { path: './file.txt' });
processContent(result.llmContent); // May process error message
```

**Correct approach:**

```typescript
const result = await executeTool('read_file', { path: './file.txt' });
if (result.error) {
  console.error('Error:', result.error.message);
  return;
}
processContent(result.llmContent); // Only processes success content
```

**Why this matters**: Forgetting to check error field causes code to treat error messages as successful content.

**Mistake 2: Throwing exceptions instead of returning error results**

**Bad example:**

```typescript
async function executeTool(): Promise<ToolResult> {
  const tool = registry.get(toolName);
  if (!tool) {
    throw new Error('Tool not found'); // Breaks contract
  }
  // ...
}
```

**Correct approach:**

```typescript
async function executeTool(): Promise<ToolResult> {
  const tool = registry.get(toolName);
  if (!tool) {
    return {
      llmContent: `Tool not found: ${toolName}`,
      returnDisplay: 'Error',
      error: {
        message: `Tool "${toolName}" is not registered`,
        type: ToolErrorType.TOOL_NOT_REGISTERED,
      },
    };
  }
  // ...
}
```

**Why this matters**: Throwing exceptions breaks the result object contract and forces callers to use try-catch.

**Mistake 3: Not categorizing errors properly**

**Bad example:**

```typescript
return {
  llmContent: 'Error',
  returnDisplay: 'Error',
  error: {
    message: error.message,
    type: ToolErrorType.UNKNOWN, // Not helpful
  },
};
```

**Correct approach:**

```typescript
// Check error type and use appropriate ToolErrorType
if (isNodeError(error) && error.code === 'ENOENT') {
  return {
    llmContent: `File not found: ${error.path}`,
    returnDisplay: 'Error',
    error: {
      message: `File not found: ${error.path}`,
      type: ToolErrorType.FILE_NOT_FOUND, // Specific category
    },
  };
}
```

**Why this matters**: Generic error types prevent callers from handling errors appropriately.

### Testing Strategy

**What to Test:**

- Successful tool execution returns result without error field
- Tool not found returns error result with correct type
- File errors return appropriate error types
- Fatal errors identified correctly by isFatalToolError
- Unexpected exceptions caught and wrapped in error result
- Error messages contain useful context

**Test Organization:**

- Group tests by success/error scenarios
- Test each error type separately
- Test fatal error detection

**Mock Strategy:**

- Mock tool registry for tool not found scenarios
- Mock tool invocation for execution errors
- No need to mock file system (use temp directories)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { executeTool, ToolErrorType, isFatalToolError } from './executor.js';
import { ToolRegistry } from './tool-registry.js';

describe('executeTool with Result Objects', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('successful execution', () => {
    it('should return result without error field', async () => {
      // Arrange
      const mockTool = {
        build: () => ({
          execute: async () => ({
            llmContent: 'File contents',
            returnDisplay: 'Success',
          }),
        }),
      };
      registry.register('read_file', mockTool);

      // Act
      const result = await executeTool(
        registry,
        'read_file',
        { path: './test.txt' },
        new AbortController().signal
      );

      // Assert
      expect(result.error).to.be.undefined;
      expect(result.llmContent).to.equal('File contents');
      expect(result.returnDisplay).to.equal('Success');
    });
  });

  describe('tool not found', () => {
    it('should return error result with TOOL_NOT_REGISTERED type', async () => {
      // Arrange - no tools registered

      // Act
      const result = await executeTool(
        registry,
        'nonexistent_tool',
        {},
        new AbortController().signal
      );

      // Assert
      expect(result.error).to.exist;
      expect(result.error?.type).to.equal(ToolErrorType.TOOL_NOT_REGISTERED);
      expect(result.error?.message).to.include('nonexistent_tool');
      expect(result.error?.code).to.equal('TOOL_NOT_FOUND');
    });
  });

  describe('tool execution errors', () => {
    it('should return error result for file not found', async () => {
      // Arrange
      const mockTool = {
        build: () => ({
          execute: async () => ({
            llmContent: 'File not found',
            returnDisplay: 'Error',
            error: {
              message: 'File not found: ./missing.txt',
              type: ToolErrorType.FILE_NOT_FOUND,
            },
          }),
        }),
      };
      registry.register('read_file', mockTool);

      // Act
      const result = await executeTool(
        registry,
        'read_file',
        { path: './missing.txt' },
        new AbortController().signal
      );

      // Assert
      expect(result.error).to.exist;
      expect(result.error?.type).to.equal(ToolErrorType.FILE_NOT_FOUND);
      expect(result.error?.message).to.include('./missing.txt');
    });

    it('should return error result for permission denied', async () => {
      // Arrange
      const mockTool = {
        build: () => ({
          execute: async () => ({
            llmContent: 'Permission denied',
            returnDisplay: 'Error',
            error: {
              message: 'Permission denied: /restricted/file',
              type: ToolErrorType.PERMISSION_DENIED,
            },
          }),
        }),
      };
      registry.register('read_file', mockTool);

      // Act
      const result = await executeTool(
        registry,
        'read_file',
        { path: '/restricted/file' },
        new AbortController().signal
      );

      // Assert
      expect(result.error).to.exist;
      expect(result.error?.type).to.equal(ToolErrorType.PERMISSION_DENIED);
    });
  });

  describe('unexpected exceptions', () => {
    it('should catch exceptions and return error result', async () => {
      // Arrange
      const mockTool = {
        build: () => ({
          execute: async () => {
            throw new Error('Unexpected error');
          },
        }),
      };
      registry.register('buggy_tool', mockTool);

      // Act
      const result = await executeTool(registry, 'buggy_tool', {}, new AbortController().signal);

      // Assert
      expect(result.error).to.exist;
      expect(result.error?.type).to.equal(ToolErrorType.UNHANDLED_EXCEPTION);
      expect(result.error?.message).to.equal('Unexpected error');
    });
  });
});

describe('isFatalToolError', () => {
  it('should return true for NO_SPACE_LEFT error', () => {
    // Act & Assert
    expect(isFatalToolError(ToolErrorType.NO_SPACE_LEFT)).to.be.true;
  });

  it('should return false for recoverable errors', () => {
    // Act & Assert
    expect(isFatalToolError(ToolErrorType.FILE_NOT_FOUND)).to.be.false;
    expect(isFatalToolError(ToolErrorType.PERMISSION_DENIED)).to.be.false;
    expect(isFatalToolError(ToolErrorType.INVALID_TOOL_PARAMS)).to.be.false;
  });

  it('should return false for undefined error type', () => {
    // Act & Assert
    expect(isFatalToolError(undefined)).to.be.false;
  });
});
```

**Coverage Goals:**

- Line coverage: 95%+ (covers all error paths)
- Branch coverage: 90%+ (all error types tested)
- Function coverage: 100%

### Related Patterns

- **[Error Class Hierarchy](./04-error-handling-patterns.md#pattern-1-error-class-hierarchy)** - Can be used together for internal errors
- **[Error Type Guards](./04-error-handling-patterns.md#pattern-2-error-type-guards)** - Still useful for checking ToolErrorType

---

## Quick Reference

### Pattern Summary Table

| Pattern                   | Use When                                      | Avoid When                 | Key Benefit                              |
| ------------------------- | --------------------------------------------- | -------------------------- | ---------------------------------------- |
| Error Class Hierarchy     | Need specific exit codes and error categories | Building library code      | Type-safe error handling with exit codes |
| Error Type Guards         | Inspecting caught errors                      | Error type already known   | Safe property access after narrowing     |
| Friendly Error Conversion | Errors from APIs or system                    | Building libraries         | User-friendly error messages             |
| Retry with Backoff        | Transient network failures                    | Non-idempotent operations  | Automatic recovery from transient issues |
| Result Objects            | Tool execution systems                        | Using exception-heavy APIs | Explicit errors in type system           |

### Code Snippets

**Error Class Hierarchy - Minimal Example:**

```typescript
export class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
  }
}

export class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}
```

**Error Type Guard - Minimal Example:**

```typescript
function isFatalError(error: unknown): error is FatalError {
  return error instanceof FatalError;
}

// Usage
if (isFatalError(error)) {
  process.exit(error.exitCode);
}
```

**Friendly Error Conversion - Minimal Example:**

```typescript
function toFriendlyError(error: unknown): Error {
  if (isNodeError(error) && error.code === 'ENOENT') {
    return new NotFoundError(`File not found: ${error.path}`, 'file', error.path);
  }
  return error instanceof Error ? error : new Error(String(error));
}
```

**Retry with Backoff - Minimal Example:**

```typescript
await retryWithBackoff(() => fetch(url), {
  maxAttempts: 3,
  initialDelayMs: 1000,
  shouldRetryOnError: (error) => {
    const status = getErrorStatus(error);
    return status === 429 || (status !== undefined && status >= 500);
  },
});
```

**Result Objects - Minimal Example:**

```typescript
interface ToolResult {
  content: string;
  error?: {
    message: string;
    type: string;
  };
}

async function executeTool(): Promise<ToolResult> {
  try {
    return { content: await work() };
  } catch (error) {
    return {
      content: '',
      error: {
        message: getErrorMessage(error),
        type: 'EXECUTION_FAILED',
      },
    };
  }
}

// Usage
const result = await executeTool();
if (result.error) {
  console.error(result.error.message);
}
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-throw-literal": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type guards used extensively for error checking
- **[Testing Patterns](./05-testing-patterns.md)** - Testing error handling and edge cases
- **[Code Organization](./06-code-organization.md)** - Where to place error classes and utilities

---

## References

**Source Code Examples:**

- [packages/core/src/utils/errors.ts](../../examplecode/gemini/packages/core/src/utils/errors.ts) - Error class hierarchy
- [packages/core/src/utils/httpErrors.ts](../../examplecode/gemini/packages/core/src/utils/httpErrors.ts) - HTTP error utilities
- [packages/core/src/utils/retry.ts](../../examplecode/gemini/packages/core/src/utils/retry.ts) - Retry with backoff
- [packages/core/src/tools/tool-error.ts](../../examplecode/gemini/packages/core/src/tools/tool-error.ts) - Tool error types

**External Resources:**

- [TypeScript Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Type narrowing and guards
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff) - Mathematical basis
- [Exit Codes Convention](https://tldp.org/LDP/abs/html/exitcodes.html) - Standard exit codes

---

## Changelog

- **2025-01-21**: Initial error handling patterns documentation extracted from reference codebase
- **2025-01-21**: Added comprehensive testing strategies and examples for all patterns
- **2025-01-21**: Documented exit code conventions and fatal vs non-fatal error distinction
