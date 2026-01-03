---
title: Type Safety Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All TypeScript Modules
related_patterns:
  - ./04-error-handling-patterns.md#type-guards
  - ./05-testing-patterns.md#mock-objects
  - ./06-code-organization.md#interface-definitions
---

# 3. Type Safety Patterns

> **Purpose**: Comprehensive type safety patterns using TypeScript features to eliminate runtime type errors and improve code reliability through strict type checking and runtime validation.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: No Any Types](#pattern-1-no-any-types)
- [Pattern 2: Type Guards](#pattern-2-type-guards)
- [Pattern 3: Discriminated Unions](#pattern-3-discriminated-unions)
- [Pattern 4: Explicit Return Types](#pattern-4-explicit-return-types)
- [Pattern 5: Generic Types](#pattern-5-generic-types)
- [Pattern 6: Runtime Validation](#pattern-6-runtime-validation)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Type safety in TypeScript provides compile-time guarantees about data types, preventing entire categories of runtime errors. By leveraging TypeScript's type system correctly, we eliminate bugs, improve IDE support, and make refactoring safer.

Proper type safety goes beyond basic type annotations. It includes strategic use of `unknown` over `any`, type guards for runtime checking, discriminated unions for state management, explicit return types for all functions, generic types for flexible abstractions, and runtime validation for external data using Zod.

These patterns work together to create a robust type system that catches errors at compile time while also validating data at runtime when needed. The compiler becomes a powerful ally, preventing invalid operations before code ever runs.

**Why type safety matters:**

- Catch errors at compile time, not runtime
- Enable confident refactoring with compiler verification
- Provide excellent IDE autocomplete and IntelliSense
- Document code structure through types
- Reduce need for defensive programming
- Eliminate entire classes of runtime errors

**In this document:**

- **No Any Types** - Using `unknown` with type narrowing instead of `any`
- **Type Guards** - Functions that narrow types at runtime with `value is Type` predicates
- **Discriminated Unions** - Type-safe variant handling with discriminator fields
- **Explicit Return Types** - Required return type annotations for all functions
- **Generic Types** - Flexible, reusable type-safe abstractions with type parameters
- **Runtime Validation** - Validating external data with Zod schemas and type inference

**Prerequisites:**

- Solid understanding of TypeScript basics
- Familiarity with union and intersection types
- Experience with TypeScript compiler options
- Understanding of type narrowing concepts

---

## Pattern 1: No Any Types

### Intent

Eliminate unsafe `any` types by using `unknown` with explicit type narrowing to maintain type safety while handling dynamic data.

### Problem

The `any` type disables TypeScript's type checking, allowing any operation without compiler verification. This defeats the purpose of using TypeScript and reintroduces the runtime errors TypeScript aims to prevent. Code using `any` provides no IntelliSense support and silently accepts invalid operations. When `any` appears in a codebase, it creates a hole in the type system where bugs can hide.

### Solution

Use `unknown` for values of truly unknown type, then narrow to specific types using type guards before performing operations. This maintains type safety while handling dynamic data. The `unknown` type forces explicit type checking before any operations can be performed, making the code safer by default.

### Structure

```typescript
function handleValue(value: unknown) {
  // Type narrowing required before use
  if (typeof value === 'string') {
    // value is string here
    return value.toUpperCase();
  } else if (typeof value === 'number') {
    // value is number here
    return value.toFixed(2);
  }
  throw new Error('Unsupported type');
}
```

### Implementation

**Step 1: Replace `any` with `unknown`**

```typescript
// Change from:
function processValue(value: any) {
  return value.toUpperCase(); // Unsafe - crashes if not string
}

// To:
function processValue(value: unknown) {
  // TypeScript error: Property 'toUpperCase' does not exist on type 'unknown'
  // return value.toUpperCase();
}
```

**Step 2: Add type narrowing checks**

```typescript
function processValue(value: unknown): string {
  // Narrow the type before using
  if (typeof value === 'string') {
    return value.toUpperCase();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  throw new Error(`Unsupported type: ${typeof value}`);
}
```

**Step 3: Extract type guards for reuse**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function processValue(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }

  if (isNumber(value)) {
    return String(value);
  }

  throw new Error(`Expected string or number, got ${typeof value}`);
}
```

### Complete Example

```typescript
// File: packages/core/src/utils/safeJsonStringify.ts
/**
 * Safely stringify an object to JSON, handling circular references.
 * Uses unknown type with runtime narrowing to handle any input safely.
 */
export function safeJsonStringify(obj: unknown, space?: string | number): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      // Type narrowing with typeof checks
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    space
  );
}

// File: packages/core/src/utils/shell-utils.ts
/**
 * Check if a shell invocation matches allowlist patterns.
 * Complex type narrowing for nested object properties.
 */
export function isShellInvocationAllowlisted(
  invocation: AnyToolInvocation,
  allowedPatterns: string[]
): boolean {
  // Check if invocation has params property
  if (
    !('params' in invocation) ||
    typeof invocation.params !== 'object' ||
    invocation.params === null ||
    !('command' in invocation.params)
  ) {
    return false;
  }

  // Extract command with proper narrowing
  const commandValue = (invocation.params as { command?: unknown }).command;
  if (typeof commandValue !== 'string' || !commandValue.trim()) {
    return false;
  }

  // Now safe to use commandValue as string
  return allowedPatterns.some((pattern) => commandValue.startsWith(pattern));
}
```

**Example explained:**

- Lines 1-22: `safeJsonStringify` accepts `unknown` and narrows to object with structural checks
- Lines 24-48: `isShellInvocationAllowlisted` demonstrates progressive narrowing through nested properties
- Both functions validate structure before accessing properties, preventing runtime errors

### When to Use

**Use `unknown` when:**

- Handling data from external sources (API responses, file reads)
- Working with third-party libraries with poor type definitions
- Deserializing JSON or parsing user input
- Writing generic utilities that work with any type
- Processing error objects of unknown type
- Implementing serialization or validation functions

**Avoid `unknown` when:**

- Type is actually known at compile time
- Working with internal, well-typed code
- Generic types (`T`) would be more appropriate
- Using within already type-safe internal functions

### Benefits

- **Type Safety**: Compiler enforces narrowing before operations, preventing invalid access
- **IntelliSense**: Full IDE support after type narrowing provides accurate autocomplete
- **Refactoring**: Changes to data structures are caught at compile time
- **Documentation**: Types document expected data shapes and validation requirements
- **No Silent Failures**: Operations on `unknown` fail at compile time, not runtime

### Trade-offs

- **Verbosity**: Requires explicit type checking code at usage sites
- **Runtime Overhead**: Type guards execute at runtime, adding small performance cost
- **Learning Curve**: Developers must understand type narrowing techniques
- **More Code**: Type checks add lines compared to unsafe `any` usage

### Common Mistakes

**Mistake 1: Using type assertions instead of narrowing**

❌ **Bad example:**

```typescript
function processValue(value: unknown): string {
  return (value as string).toUpperCase();
  // No runtime check - crashes if value isn't a string
}
```

✅ **Correct approach:**

```typescript
function processValue(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  return value.toUpperCase();
}
```

**Why this matters**: Type assertions bypass type checking entirely. If value isn't actually a string, the code crashes at runtime with no protection.

**Mistake 2: Not handling all cases**

❌ **Bad example:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  // Implicit return of undefined - TypeScript error
}
```

✅ **Correct approach:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  throw new Error(`Expected string, got ${typeof value}`);
}
```

**Why this matters**: Implicit returns of undefined cause bugs and type errors. Always handle the fallthrough case explicitly.

**Mistake 3: Checking `!= null` without `!== null`**

❌ **Bad example:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'object' && value != null) {
    // != checks both null and undefined
    return String(value);
  }
  throw new Error('Expected object');
}
```

✅ **Correct approach:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    // !== null only checks for null, not undefined
    return String(value);
  }
  throw new Error('Expected object');
}
```

**Why this matters**: `!= null` is loose equality and checks for both null and undefined. Use `!== null` for precise type narrowing.

### Testing Strategy

**What to Test:**

- Type narrowing correctly identifies types
- Operations only execute after narrowing
- Error thrown for unsupported types
- All type branches are covered
- Edge cases like null, undefined, empty strings

**Test Organization:**

- Co-locate test: `safeJsonStringify.ts` → `safeJsonStringify.test.ts`
- Use AAA pattern (Arrange-Act-Assert) for each test
- Group related tests in describe blocks by function
- One `it` block per test case

**Mock Strategy:**

- No mocks needed for pure type guard functions
- Use real type values for testing
- Test with actual data structures, not mocks
- Mock only external dependencies (file system, network)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { safeJsonStringify } from './safeJsonStringify.js';

describe('safeJsonStringify', () => {
  // Happy path - simple types
  it('should stringify strings correctly', () => {
    // Arrange
    const input = 'hello';

    // Act
    const result = safeJsonStringify(input);

    // Assert
    expect(result).to.equal('"hello"');
  });

  // Happy path - objects
  it('should stringify objects correctly', () => {
    // Arrange
    const input = { name: 'test', value: 123 };

    // Act
    const result = safeJsonStringify(input);

    // Assert
    expect(result).to.equal('{"name":"test","value":123}');
  });

  // Edge case - circular references
  it('should handle circular references', () => {
    // Arrange
    const obj: any = { name: 'test' };
    obj.self = obj; // Create circular reference

    // Act
    const result = safeJsonStringify(obj);

    // Assert
    expect(result).to.contain('[Circular]');
  });

  // Edge case - null
  it('should handle null values', () => {
    // Arrange
    const input = null;

    // Act
    const result = safeJsonStringify(input);

    // Assert
    expect(result).to.equal('null');
  });

  // Edge case - undefined
  it('should handle undefined values', () => {
    // Arrange
    const input = undefined;

    // Act
    const result = safeJsonStringify(input);

    // Assert
    expect(result).to.be.undefined;
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (small focused functions)
- Statement coverage: 100%
- Function coverage: 100%
- Branch coverage: 100% (all type paths tested)

### Related Patterns

- **[Type Guards](#pattern-2-type-guards)** - Essential companion pattern for narrowing unknown types
- **[Runtime Validation](#pattern-6-runtime-validation)** - For validating external data with schemas
- **[Error Handling Patterns](./04-error-handling-patterns.md#type-guards)** - Using type guards for error checking

---

## Pattern 2: Type Guards

### Intent

Create reusable functions that narrow types at runtime with TypeScript's `value is Type` predicate syntax.

### Problem

When working with union types or `unknown` values, TypeScript cannot automatically determine which specific type a value has at runtime. Type narrowing with inline checks (like `typeof` or `instanceof`) works but becomes repetitive and error-prone when the same checks are needed in multiple places. Without type guards, code either duplicates narrowing logic or uses unsafe type assertions.

### Solution

Define type guard functions that return `value is Type` predicates. These functions perform runtime checks and inform the TypeScript compiler about the narrowed type. Once a type guard passes, TypeScript automatically narrows the type in all subsequent code paths, providing type safety and IntelliSense support.

### Structure

```typescript
// Type guard function signature
function isTypeName(value: unknown): value is TypeName {
  // Runtime checks
  return /* boolean expression */;
}

// Usage
function handleValue(value: unknown) {
  if (isTypeName(value)) {
    // TypeScript knows value is TypeName here
    value.specificMethod();
  }
}
```

### Implementation

**Step 1: Define simple type guards for primitives**

```typescript
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
```

**Step 2: Create guards for complex types**

```typescript
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
```

**Step 3: Build composite type guards**

```typescript
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'object' &&
    'message' in (error as ApiError).error
  );
}
```

### Complete Example

```typescript
// File: packages/core/src/utils/errors.ts
/**
 * Type guard for Node.js system errors with error codes.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

/**
 * Extract error message safely from unknown error types.
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

// File: packages/core/src/utils/quotaErrorDetection.ts
/**
 * API error structure with nested error object.
 */
interface ApiError {
  error: {
    message: string;
    code?: number;
    status?: string;
  };
}

/**
 * Type guard for API error responses.
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'object' &&
    'message' in (error as ApiError).error
  );
}

/**
 * Structured error with direct message property.
 */
interface StructuredError {
  message: string;
  code?: string;
}

/**
 * Type guard for structured error objects.
 */
export function isStructuredError(error: unknown): error is StructuredError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as StructuredError).message === 'string'
  );
}

// File: packages/core/src/utils/editor.ts
/**
 * Supported editor types as literal union.
 */
type EditorType =
  | 'vscode'
  | 'vscodium'
  | 'windsurf'
  | 'cursor'
  | 'vim'
  | 'neovim'
  | 'zed'
  | 'emacs'
  | 'antigravity';

/**
 * Type guard that narrows string to specific EditorType.
 */
function isValidEditorType(editor: string): editor is EditorType {
  return [
    'vscode',
    'vscodium',
    'windsurf',
    'cursor',
    'vim',
    'neovim',
    'zed',
    'emacs',
    'antigravity',
  ].includes(editor);
}

/**
 * Usage example: Safe editor validation
 */
export function validateEditor(input: string): EditorType {
  if (isValidEditorType(input)) {
    return input; // TypeScript knows this is EditorType
  }
  throw new Error(`Invalid editor: ${input}`);
}

// File: packages/cli/src/utils/deepMerge.ts
type MergeableObject = Record<string, unknown>;

/**
 * Type guard distinguishing plain objects from arrays and null.
 */
function isPlainObject(item: unknown): item is MergeableObject {
  return !!item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Usage in deep merge implementation
 */
function mergeRecursively(target: MergeableObject, source: MergeableObject): MergeableObject {
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      // Both are plain objects - merge recursively
      target[key] = mergeRecursively(targetValue, sourceValue);
    } else {
      // Otherwise, overwrite with source value
      target[key] = sourceValue;
    }
  }

  return target;
}
```

**Example explained:**

- Lines 1-20: Basic type guards for error handling with runtime checks
- Lines 22-62: Composite type guards checking nested structure progressively
- Lines 64-98: Type guards narrowing strings to literal unions
- Lines 100-126: Type guards distinguishing between similar types (object vs array)

### When to Use

**Use type guards when:**

- Checking types repeatedly in multiple places
- Narrowing union types to specific variants
- Validating structure of external data
- Implementing error handling with different error types
- Distinguishing between similar types (arrays vs objects)
- Creating reusable type checking logic

**Avoid type guards when:**

- Check is only used once (inline narrowing sufficient)
- Type is already narrow enough
- Using Zod for validation (schema validation preferred)
- Generic type parameter would be more appropriate

### Benefits

- **Reusability**: Write once, use everywhere for consistent type checks
- **Type Narrowing**: TypeScript automatically narrows after guard passes
- **Compile-Time Safety**: Compiler enforces correct usage after narrowing
- **IntelliSense Support**: Full IDE autocomplete after type narrowing
- **Centralized Logic**: Single source of truth for type checking rules
- **Testability**: Guards can be tested independently

### Trade-offs

- **Runtime Cost**: Type guards execute at runtime for every check
- **Maintenance**: Guards must be updated when types change
- **Complexity**: Complex guards can be difficult to understand
- **False Security**: Guards only check what they explicitly validate

### Common Mistakes

**Mistake 1: Incomplete structural checks**

❌ **Bad example:**

```typescript
function isApiError(error: unknown): error is ApiError {
  return 'error' in error;
  // Doesn't check if error is an object or if error.error exists
}
```

✅ **Correct approach:**

```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as ApiError).error === 'object' &&
    'message' in (error as ApiError).error
  );
}
```

**Why this matters**: Incomplete checks can pass for invalid structures, causing runtime errors when accessing nested properties.

**Mistake 2: Using type assertions in guards**

❌ **Bad example:**

```typescript
function isUser(value: unknown): value is User {
  const user = value as User;
  return user.name !== undefined && user.email !== undefined;
  // Type assertion bypasses safety
}
```

✅ **Correct approach:**

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}
```

**Why this matters**: Type assertions in guards defeat the purpose of runtime validation. Guards should check actual runtime structure.

**Mistake 3: Not checking for null**

❌ **Bad example:**

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object';
  // typeof null === 'object' in JavaScript
}
```

✅ **Correct approach:**

```typescript
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

**Why this matters**: In JavaScript, `typeof null === 'object'`. Always check `value !== null` when checking for objects.

### Testing Strategy

**What to Test:**

- Guard correctly identifies valid values (true positives)
- Guard correctly rejects invalid values (true negatives)
- Guard handles edge cases (null, undefined, empty values)
- Guard checks nested structure completely
- Guard works with actual data structures from the codebase

**Test Organization:**

- Co-locate tests: `errors.ts` → `errors.test.ts`
- One describe block per type guard function
- Test valid cases, invalid cases, and edge cases
- Use AAA pattern for clarity

**Mock Strategy:**

- No mocks needed - test with real values
- Create test fixtures for complex types
- Test with actual data structures that guard will encounter

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { isNodeError, isApiError, isValidEditorType } from './typeGuards.js';

describe('Type Guards', () => {
  describe('isNodeError', () => {
    it('should return true for NodeJS error with code', () => {
      // Arrange
      const error: NodeJS.ErrnoException = new Error('File not found');
      error.code = 'ENOENT';

      // Act
      const result = isNodeError(error);

      // Assert
      expect(result).to.be.true;
    });

    it('should return false for standard Error without code', () => {
      // Arrange
      const error = new Error('Standard error');

      // Act
      const result = isNodeError(error);

      // Assert
      expect(result).to.be.false;
    });

    it('should return false for non-Error values', () => {
      // Arrange
      const values = [null, undefined, 'error', 123, { code: 'ENOENT' }];

      // Act & Assert
      values.forEach((value) => {
        expect(isNodeError(value)).to.be.false;
      });
    });
  });

  describe('isApiError', () => {
    it('should return true for valid API error structure', () => {
      // Arrange
      const error = {
        error: {
          message: 'Bad request',
          code: 400,
        },
      };

      // Act
      const result = isApiError(error);

      // Assert
      expect(result).to.be.true;
    });

    it('should return false for incomplete structure', () => {
      // Arrange
      const incomplete = [
        { error: 'string' }, // error is not object
        { error: {} }, // error object missing message
        { message: 'test' }, // missing error wrapper
        null,
        undefined,
      ];

      // Act & Assert
      incomplete.forEach((value) => {
        expect(isApiError(value)).to.be.false;
      });
    });
  });

  describe('isValidEditorType', () => {
    it('should return true for valid editor types', () => {
      // Arrange
      const validEditors = ['vscode', 'vim', 'cursor', 'zed'];

      // Act & Assert
      validEditors.forEach((editor) => {
        expect(isValidEditorType(editor)).to.be.true;
      });
    });

    it('should return false for invalid editor types', () => {
      // Arrange
      const invalidEditors = ['notepad', 'sublime', 'atom', ''];

      // Act & Assert
      invalidEditors.forEach((editor) => {
        expect(isValidEditorType(editor)).to.be.false;
      });
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (type guards are small functions)
- Branch coverage: 100% (all conditions tested)
- Statement coverage: 100%
- Test all code paths through guards

### Related Patterns

- **[No Any Types](#pattern-1-no-any-types)** - Type guards enable safe narrowing from unknown
- **[Discriminated Unions](#pattern-3-discriminated-unions)** - Use type guards to narrow union types
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Type guards essential for error handling

---

## Pattern 3: Discriminated Unions

### Intent

Create type-safe variant types using a common discriminator field that enables exhaustive type narrowing and impossible state prevention.

### Problem

Union types in TypeScript can represent multiple possible types, but narrowing between variants often requires complex type guards or unsafe casting. Without a discriminator field, TypeScript cannot automatically determine which variant is active, leading to repetitive type checking code and potential runtime errors when accessing variant-specific properties.

### Solution

Define union types where each variant includes a literal-typed discriminator field (commonly named `type`, `kind`, or similar). TypeScript uses this field to automatically narrow the union to specific variants. Combined with `switch` statements and exhaustiveness checking, this prevents unhandled cases and makes invalid states impossible to represent.

### Structure

```typescript
// Define union with discriminator field
type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'scroll'; delta: number };

// Type-safe handling
function handleEvent(event: Event) {
  switch (event.type) {
    case 'click':
      // event.x and event.y are available
      break;
    case 'keypress':
      // event.key is available
      break;
    case 'scroll':
      // event.delta is available
      break;
    default:
      // Exhaustiveness check
      const _exhaustive: never = event;
  }
}
```

### Implementation

**Step 1: Define union with literal discriminators**

```typescript
type Result = { status: 'success'; value: string } | { status: 'error'; error: Error };
```

**Step 2: Use discriminator for narrowing**

```typescript
function handleResult(result: Result): string {
  if (result.status === 'success') {
    return result.value; // TypeScript knows result.value exists
  } else {
    return result.error.message; // TypeScript knows result.error exists
  }
}
```

**Step 3: Add exhaustiveness checking**

```typescript
function handleResult(result: Result): string {
  switch (result.status) {
    case 'success':
      return result.value;
    case 'error':
      return result.error.message;
    default:
      // Exhaustiveness check - ensures all cases handled
      const _exhaustive: never = result;
      throw new Error('Unhandled result type');
  }
}
```

### Complete Example

```typescript
// File: packages/core/src/core/streamEvents.ts
/**
 * Stream events with type discriminator for safe handling.
 */
type StreamEvent =
  | { type: 'chunk'; value: string; timestamp: number }
  | { type: 'retry'; attempt: number; delay: number }
  | { type: 'error'; error: Error }
  | { type: 'complete'; duration: number };

/**
 * Type-safe stream event handler using discriminated union.
 */
function handleStreamEvent(event: StreamEvent): void {
  switch (event.type) {
    case 'chunk':
      // TypeScript knows event.value and event.timestamp exist
      console.log(`Received chunk: ${event.value}`);
      console.log(`At timestamp: ${event.timestamp}`);
      break;

    case 'retry':
      // TypeScript knows event.attempt and event.delay exist
      console.log(`Retry attempt ${event.attempt} after ${event.delay}ms`);
      break;

    case 'error':
      // TypeScript knows event.error exists
      console.error(`Stream error: ${event.error.message}`);
      break;

    case 'complete':
      // TypeScript knows event.duration exists
      console.log(`Stream completed in ${event.duration}ms`);
      break;

    default:
      // Exhaustiveness check - TypeScript ensures all cases handled
      const _exhaustive: never = event;
      throw new Error(`Unhandled event type: ${(_exhaustive as any).type}`);
  }
}

// File: packages/cli/src/zed-integration/schema.ts
/**
 * Content block types with discriminated union for different media.
 */
type ContentBlock =
  | {
      type: 'text';
      text: string;
      annotations?: Record<string, unknown>;
    }
  | {
      type: 'image';
      data: string; // Base64 encoded
      mimeType: string;
      annotations?: Record<string, unknown>;
    }
  | {
      type: 'audio';
      data: string;
      mimeType: string;
      annotations?: Record<string, unknown>;
    }
  | {
      type: 'resource';
      resource: EmbeddedResource;
      annotations?: Record<string, unknown>;
    };

/**
 * Process content blocks based on their type.
 */
function processContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return block.text;

    case 'image':
      return `[Image: ${block.mimeType}]`;

    case 'audio':
      return `[Audio: ${block.mimeType}]`;

    case 'resource':
      return `[Resource: ${block.resource.uri}]`;

    default:
      const _exhaustive: never = block;
      throw new Error(`Unknown content block type`);
  }
}

// File: packages/cli/src/zed-integration/schema.ts
/**
 * Request permission outcome with discriminated union.
 */
type RequestPermissionOutcome =
  | {
      outcome: 'cancelled';
    }
  | {
      outcome: 'selected';
      optionId: string;
    };

/**
 * Handle permission outcome based on discriminator.
 */
function handlePermissionOutcome(outcome: RequestPermissionOutcome): void {
  if (outcome.outcome === 'cancelled') {
    console.log('Permission request cancelled');
    return;
  }

  // TypeScript knows outcome.optionId exists here
  console.log(`Selected option: ${outcome.optionId}`);
}

// File: packages/core/src/policy/toml-loader.ts
/**
 * Policy checker configuration with type discriminator.
 */
type CheckerConfig =
  | {
      type: 'in-process';
      name: InProcessCheckerType;
      requiredContext?: string[];
      config?: Record<string, unknown>;
    }
  | {
      type: 'external';
      name: string;
      requiredContext?: string[];
      config?: Record<string, unknown>;
    };

/**
 * Initialize checker based on type discriminator.
 */
function initializeChecker(config: CheckerConfig): Checker {
  switch (config.type) {
    case 'in-process':
      // config.name is InProcessCheckerType enum
      return createInProcessChecker(config.name, config.config);

    case 'external':
      // config.name is string (external command)
      return createExternalChecker(config.name, config.config);

    default:
      const _exhaustive: never = config;
      throw new Error('Invalid checker type');
  }
}
```

**Example explained:**

- Lines 1-42: StreamEvent union with type discriminator for different stream states
- Lines 44-85: ContentBlock union for different media types with type-specific properties
- Lines 87-110: Simple permission outcome union showing minimal discriminated union
- Lines 112-144: Checker config union where discriminator affects other field types

### When to Use

**Use discriminated unions when:**

- Representing state machines or workflow states
- Handling different message or event types
- Modeling variant data structures (success/error, different content types)
- Implementing polymorphic behavior with type safety
- Needing exhaustive case handling verification
- Different variants have different properties

**Avoid discriminated unions when:**

- All variants have the same structure (use single type)
- Only one variant will ever exist (use simple type)
- Variants don't have a natural discriminator field
- Class hierarchies with behavior would be more appropriate

### Benefits

- **Automatic Narrowing**: TypeScript narrows based on discriminator automatically
- **Exhaustiveness Checking**: Compiler ensures all cases are handled
- **Type-Safe Access**: Access to variant-specific properties without casting
- **Clear Intent**: Union type documents all possible states explicitly
- **Impossible States**: Cannot represent invalid combinations of fields
- **Refactoring Safety**: Adding variants causes compiler errors at all handling sites

### Trade-offs

- **Verbosity**: Defining all variants explicitly can be lengthy
- **Discriminator Overhead**: Every value carries discriminator field
- **Structural Typing**: Discriminators must be truly unique across variants
- **Migration Complexity**: Adding/removing variants requires updating all handlers

### Common Mistakes

**Mistake 1: Non-literal discriminators**

❌ **Bad example:**

```typescript
type Result =
  | { status: string; value: string } // string, not literal
  | { status: string; error: Error };

// TypeScript cannot narrow because status is generic string
```

✅ **Correct approach:**

```typescript
type Result =
  | { status: 'success'; value: string } // Literal type
  | { status: 'error'; error: Error };

// TypeScript can narrow based on status literal
```

**Why this matters**: Only literal types enable automatic narrowing. Generic string types don't provide narrowing capability.

**Mistake 2: Missing exhaustiveness check**

❌ **Bad example:**

```typescript
function handleEvent(event: StreamEvent): void {
  switch (event.type) {
    case 'chunk':
      console.log(event.value);
      break;
    case 'error':
      console.error(event.error);
      break;
    // Missing 'retry' and 'complete' cases
  }
}
```

✅ **Correct approach:**

```typescript
function handleEvent(event: StreamEvent): void {
  switch (event.type) {
    case 'chunk':
      console.log(event.value);
      break;
    case 'retry':
      console.log(`Retry ${event.attempt}`);
      break;
    case 'error':
      console.error(event.error);
      break;
    case 'complete':
      console.log('Complete');
      break;
    default:
      const _exhaustive: never = event;
      throw new Error('Unhandled case');
  }
}
```

**Why this matters**: Without exhaustiveness checking, adding new variants doesn't cause compiler errors at handling sites, leading to runtime bugs.

**Mistake 3: Overlapping discriminators**

❌ **Bad example:**

```typescript
type Message = { type: 'error'; text: string } | { type: 'error'; code: number }; // Same discriminator value

// TypeScript cannot distinguish between variants
```

✅ **Correct approach:**

```typescript
type Message = { type: 'text-error'; text: string } | { type: 'code-error'; code: number };

// Each variant has unique discriminator
```

**Why this matters**: Discriminator values must be unique across all variants for narrowing to work correctly.

### Testing Strategy

**What to Test:**

- Each variant can be created and handled correctly
- Discriminator-based narrowing works as expected
- All cases are handled (exhaustiveness)
- Type-specific properties are accessible after narrowing
- Invalid discriminator values are rejected

**Test Organization:**

- One describe block per discriminated union type
- Test each variant separately
- Test narrowing logic in handlers
- Test exhaustiveness enforcement

**Mock Strategy:**

- Create test fixtures for each variant
- No mocks needed for discriminated unions themselves
- Mock variant-specific dependencies (error handlers, etc.)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('StreamEvent Discriminated Union', () => {
  describe('chunk event', () => {
    it('should handle chunk events correctly', () => {
      // Arrange
      const event: StreamEvent = {
        type: 'chunk',
        value: 'test data',
        timestamp: Date.now(),
      };

      // Act
      const result = handleStreamEvent(event);

      // Assert
      expect(result).to.contain('test data');
    });
  });

  describe('retry event', () => {
    it('should handle retry events correctly', () => {
      // Arrange
      const event: StreamEvent = {
        type: 'retry',
        attempt: 2,
        delay: 1000,
      };

      // Act
      const result = handleStreamEvent(event);

      // Assert
      expect(result).to.contain('attempt 2');
      expect(result).to.contain('1000ms');
    });
  });

  describe('error event', () => {
    it('should handle error events correctly', () => {
      // Arrange
      const event: StreamEvent = {
        type: 'error',
        error: new Error('Test error'),
      };

      // Act
      const result = handleStreamEvent(event);

      // Assert
      expect(result).to.contain('Test error');
    });
  });

  describe('complete event', () => {
    it('should handle complete events correctly', () => {
      // Arrange
      const event: StreamEvent = {
        type: 'complete',
        duration: 5000,
      };

      // Act
      const result = handleStreamEvent(event);

      // Assert
      expect(result).to.contain('5000ms');
    });
  });

  describe('exhaustiveness', () => {
    it('should throw for unhandled event types', () => {
      // Arrange
      const invalidEvent = {
        type: 'unknown',
      } as any;

      // Act & Assert
      expect(() => handleStreamEvent(invalidEvent)).to.throw('Unhandled event type');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (ensure all switch branches tested)
- Branch coverage: 100% (test each discriminator value)
- Statement coverage: 100%
- Test exhaustiveness handling explicitly

### Related Patterns

- **[Type Guards](#pattern-2-type-guards)** - Can be used to narrow discriminated unions
- **[No Any Types](#pattern-1-no-any-types)** - Discriminated unions avoid need for any
- **[Explicit Return Types](#pattern-4-explicit-return-types)** - Return discriminated unions explicitly

---

## Pattern 4: Explicit Return Types

### Intent

Require explicit return type annotations for all functions to improve code clarity, catch errors early, and enable better refactoring.

### Problem

TypeScript can infer return types automatically, but relying on inference has drawbacks. Inferred types can be too wide or narrow, changes to function bodies can unintentionally change return types breaking callers, and complex inferred types make code harder to understand. Without explicit return types, refactoring becomes risky because unintended type changes aren't caught at the declaration site.

### Solution

Always annotate function return types explicitly, even when TypeScript can infer them. This documents the function's contract, catches unintended type changes at the declaration site instead of at call sites, and makes the codebase more maintainable by clearly showing what each function returns.

### Structure

```typescript
// Function with explicit return type
function functionName(param: Type): ReturnType {
  // Implementation
  return value;
}

// Async function with explicit Promise return
async function asyncFunction(param: Type): Promise<ReturnType> {
  // Implementation
  return value;
}

// Void function
function voidFunction(param: Type): void {
  // No return value
}
```

### Implementation

**Step 1: Add return types to simple functions**

```typescript
// Before (implicit)
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// After (explicit)
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Step 2: Annotate async functions with Promise**

```typescript
// Async function - always wrap in Promise<>
async function fetchData(url: string): Promise<ApiResponse> {
  const response = await fetch(url);
  return response.json();
}
```

**Step 3: Use void for functions with no return**

```typescript
// Void for functions that don't return values
function logMessage(message: string): void {
  console.log(message);
}
```

### Complete Example

```typescript
// File: packages/core/src/utils/shell-utils.ts
/**
 * Shell configuration with platform-specific settings.
 */
export interface ShellConfiguration {
  executable: string;
  argsPrefix: string[];
  shell: ShellType;
}

/**
 * Get shell configuration based on current platform.
 * Explicit return type documents the contract clearly.
 */
export function getShellConfiguration(): ShellConfiguration {
  if (isWindows()) {
    const comSpec = process.env['ComSpec'];
    if (comSpec) {
      const executable = comSpec.toLowerCase();
      if (executable.endsWith('powershell.exe') || executable.endsWith('pwsh.exe')) {
        return {
          executable: comSpec,
          argsPrefix: ['-NoProfile', '-Command'],
          shell: 'powershell',
        };
      }
    }

    // Default to PowerShell for Windows
    return {
      executable: 'powershell.exe',
      argsPrefix: ['-NoProfile', '-Command'],
      shell: 'powershell',
    };
  }

  // Unix-like systems (Linux, macOS)
  return { executable: 'bash', argsPrefix: ['-c'], shell: 'bash' };
}

/**
 * Check command permissions with complex return type.
 * Inline object type shows exact return structure.
 */
export function checkCommandPermissions(
  command: string,
  config: Config,
  sessionAllowlist?: Set<string>
): {
  allAllowed: boolean;
  disallowedCommands: string[];
  blockReason?: string;
  isHardDenial?: boolean;
} {
  const commands = parseCommands(command);
  const disallowed: string[] = [];
  let blockReason: string | undefined;
  let isHardDenial = false;

  for (const cmd of commands) {
    const result = checkSingleCommand(cmd, config);
    if (!result.allowed) {
      disallowed.push(cmd);
      blockReason = result.reason;
      isHardDenial = result.isHardDenial;
    }
  }

  return {
    allAllowed: disallowed.length === 0,
    disallowedCommands: disallowed,
    blockReason,
    isHardDenial,
  };
}

// File: packages/cli/src/utils/deepMerge.ts
type MergeableObject = Record<string, unknown>;

/**
 * Deep merge multiple objects with custom merge strategies.
 * Type alias used for clarity in return type.
 */
export function customDeepMerge(
  getMergeStrategyForPath: (path: string[]) => MergeStrategy | undefined,
  ...sources: MergeableObject[]
): MergeableObject {
  const result: MergeableObject = {};

  for (const source of sources) {
    if (source) {
      mergeRecursively(result, source, getMergeStrategyForPath);
    }
  }

  return result;
}

// File: packages/cli/src/config/sandboxConfig.ts
/**
 * Load sandbox configuration from settings and arguments.
 * Returns undefined if sandbox not configured.
 */
export async function loadSandboxConfig(
  settings: Settings,
  argv: SandboxCliArgs
): Promise<SandboxConfig | undefined> {
  const sandboxOption = argv.sandbox ?? settings.tools?.sandbox;
  const command = getSandboxCommand(sandboxOption);

  const packageJson = await getPackageJson(__dirname);
  const image = process.env['GEMINI_SANDBOX_IMAGE'] ?? packageJson?.config?.sandboxImageUri;

  return command && image ? { command, image } : undefined;
}

// File: packages/core/src/policy/toml-loader.ts
/**
 * Policy loading result with rules, checkers, and errors.
 */
export interface PolicyLoadResult {
  rules: PolicyRule[];
  checkers: SafetyCheckerRule[];
  errors: PolicyFileError[];
}

/**
 * Load policy rules from TOML files in specified directories.
 * Complex return type extracted to interface for readability.
 */
export async function loadPoliciesFromToml(
  approvalMode: ApprovalMode,
  policyDirs: string[],
  getPolicyTier: (dir: string) => number
): Promise<PolicyLoadResult> {
  const rules: PolicyRule[] = [];
  const checkers: SafetyCheckerRule[] = [];
  const errors: PolicyFileError[] = [];

  for (const dir of policyDirs) {
    const result = await loadPolicyDirectory(dir, approvalMode);
    rules.push(...result.rules);
    checkers.push(...result.checkers);
    errors.push(...result.errors);
  }

  return { rules, checkers, errors };
}

// File: packages/core/src/utils/formatters.ts
/**
 * Format error for display with optional context.
 * Void return type for side-effect functions.
 */
export function logFormattedError(error: Error, context?: Record<string, unknown>): void {
  console.error('Error:', error.message);
  if (context) {
    console.error('Context:', JSON.stringify(context, null, 2));
  }
}
```

**Example explained:**

- Lines 1-41: Simple return type with interface for clear documentation
- Lines 43-75: Complex inline object return type showing exact structure
- Lines 77-94: Type alias return for common return types
- Lines 96-113: Async function with Promise wrapping optional return
- Lines 115-145: Complex return type extracted to interface for readability
- Lines 147-157: Void return type for side-effect only functions

### When to Use

**Use explicit return types:**

- Always - this should be the default for all functions
- Especially for public API functions
- For functions with complex return types
- For async functions (always Promise<T>)
- For functions called from multiple places
- For generator functions (return Generator<T>)

**Explicit return types are required:**

- In all exported functions
- In class methods
- In callback functions with complex return types
- In functions that appear in multiple files

### Benefits

- **Contract Documentation**: Return type is part of function signature
- **Early Error Detection**: Mismatches caught at declaration, not call site
- **Better Refactoring**: Changes to return values caught immediately
- **Clearer Intent**: Explicit type shows what function is meant to return
- **IntelliSense Improvement**: IDEs show return types without hovering over body
- **Prevents Type Widening**: Stops TypeScript from inferring too-wide types

### Trade-offs

- **Verbosity**: Adds extra typing for obvious return types
- **Maintenance**: Return types must be updated when implementation changes
- **Duplication**: Type information appears in both signature and body
- **Learning Curve**: Requires understanding TypeScript types thoroughly

### Common Mistakes

**Mistake 1: Omitting return types**

❌ **Bad example:**

```typescript
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
  // Return type inferred as number - not explicit
}
```

✅ **Correct approach:**

```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Why this matters**: Explicit return types document intent and catch errors when implementation changes accidentally return wrong type.

**Mistake 2: Forgetting Promise wrapper for async**

❌ **Bad example:**

```typescript
async function fetchData(url: string): ApiResponse {
  // Wrong - async functions always return Promise
  const response = await fetch(url);
  return response.json();
}
```

✅ **Correct approach:**

```typescript
async function fetchData(url: string): Promise<ApiResponse> {
  const response = await fetch(url);
  return response.json();
}
```

**Why this matters**: Async functions always return promises. Omitting Promise<> in return type is incorrect and confusing.

**Mistake 3: Not using void for side-effect functions**

❌ **Bad example:**

```typescript
function logMessage(message: string) {
  console.log(message);
  // Implicitly returns undefined
}
```

✅ **Correct approach:**

```typescript
function logMessage(message: string): void {
  console.log(message);
}
```

**Why this matters**: `void` clearly indicates function is called for side effects, not return value. Distinguishes from functions that return undefined.

### Testing Strategy

**What to Test:**

- Function returns correct type (TypeScript checks this)
- Function returns correct values at runtime
- Return type matches documented behavior
- Edge cases return expected type
- Error cases return or throw appropriately

**Test Organization:**

- Co-locate tests with implementation
- Test return values, not return types (TypeScript checks types)
- One describe block per function
- Test happy path, error path, edge cases

**Mock Strategy:**

- Mock dependencies, test actual return values
- Verify returned objects match expected structure
- Test async functions resolve to correct types

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { getShellConfiguration, checkCommandPermissions } from './shell-utils.js';

describe('getShellConfiguration', () => {
  it('should return PowerShell config on Windows', () => {
    // Arrange
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    // Act
    const config = getShellConfiguration();

    // Assert
    expect(config).to.be.an('object');
    expect(config.executable).to.include('powershell');
    expect(config.shell).to.equal('powershell');
    expect(config.argsPrefix).to.be.an('array');

    // Cleanup
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should return bash config on Unix', () => {
    // Arrange
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    // Act
    const config = getShellConfiguration();

    // Assert
    expect(config.executable).to.equal('bash');
    expect(config.shell).to.equal('bash');
    expect(config.argsPrefix).to.deep.equal(['-c']);

    // Cleanup
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});

describe('checkCommandPermissions', () => {
  it('should return allAllowed true for safe commands', () => {
    // Arrange
    const command = 'ls -la';
    const config = createMockConfig();

    // Act
    const result = checkCommandPermissions(command, config);

    // Assert
    expect(result).to.have.property('allAllowed', true);
    expect(result.disallowedCommands).to.be.an('array').that.is.empty;
    expect(result.blockReason).to.be.undefined;
  });

  it('should return disallowed commands for blocked commands', () => {
    // Arrange
    const command = 'rm -rf /';
    const config = createMockConfig();

    // Act
    const result = checkCommandPermissions(command, config);

    // Assert
    expect(result.allAllowed).to.be.false;
    expect(result.disallowedCommands).to.include('rm');
    expect(result.blockReason).to.be.a('string');
    expect(result.isHardDenial).to.be.true;
  });
});

describe('loadSandboxConfig', () => {
  it('should return config when sandbox is enabled', async () => {
    // Arrange
    const settings = { tools: { sandbox: true } };
    const argv = { sandbox: 'docker' };

    // Act
    const config = await loadSandboxConfig(settings, argv);

    // Assert
    expect(config).to.be.an('object');
    expect(config?.command).to.be.a('string');
    expect(config?.image).to.be.a('string');
  });

  it('should return undefined when sandbox not configured', async () => {
    // Arrange
    const settings = {};
    const argv = {};

    // Act
    const config = await loadSandboxConfig(settings, argv);

    // Assert
    expect(config).to.be.undefined;
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+ (focus on logic, not type checking)
- Branch coverage: 80%+ (all return paths tested)
- Statement coverage: 80%+
- Test return value structure matches type signature

### Related Patterns

- **[Generic Types](#pattern-5-generic-types)** - Generic return types need explicit annotation
- **[No Any Types](#pattern-1-no-any-types)** - Explicit return types prevent any inference
- **[Runtime Validation](#pattern-6-runtime-validation)** - Return types should match validation schemas

---

## Pattern 5: Generic Types

### Intent

Create flexible, reusable type-safe abstractions using type parameters that work with multiple types while maintaining compile-time type safety.

### Problem

Without generics, code that works with multiple types must either duplicate logic for each type (violating DRY) or use unsafe `any` types (losing type safety). Functions and classes that operate on different types in the same way have no way to preserve type information through operations, leading to loss of type safety or code duplication.

### Solution

Use generic type parameters (typically named `T`, `TParams`, `TResult`, etc.) to create functions, classes, and interfaces that work with any type while preserving type information. Generic types are specified when the function or class is used, allowing TypeScript to check types throughout the entire call chain.

### Structure

```typescript
// Generic function
function identity<T>(value: T): T {
  return value;
}

// Generic interface
interface Container<T> {
  value: T;
  getValue(): T;
}

// Generic class
class Box<T> {
  constructor(private value: T) {}

  getValue(): T {
    return this.value;
  }
}
```

### Implementation

**Step 1: Define generic interfaces**

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Step 2: Create generic classes**

```typescript
class Cache<T> {
  private items: Map<string, T> = new Map();

  set(key: string, value: T): void {
    this.items.set(key, value);
  }

  get(key: string): T | undefined {
    return this.items.get(key);
  }
}
```

**Step 3: Use constraints for generic bounds**

```typescript
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}
```

### Complete Example

```typescript
// File: packages/core/src/tools/tools.ts
/**
 * Base result type for all tool executions.
 */
export interface ToolResult {
  llmContent: string | PartUnion;
  returnDisplay: string;
  error?: {
    message: string;
    type: ToolErrorType;
  };
}

/**
 * Generic tool invocation interface with parameter and result types.
 * TParams: Type of parameters passed to the tool
 * TResult: Type of result returned by the tool
 */
export interface ToolInvocation<TParams extends object, TResult extends ToolResult> {
  /**
   * The validated parameters for this specific invocation.
   */
  params: TParams;

  /**
   * Gets a pre-execution description of the tool operation.
   */
  getDescription(): string;

  /**
   * Determines what file system paths the tool will affect.
   */
  toolLocations(): ToolLocation[];

  /**
   * Determines if the tool should prompt for confirmation before execution.
   */
  shouldConfirmExecute(abortSignal: AbortSignal): Promise<ToolCallConfirmationDetails | false>;

  /**
   * Executes the tool with the validated parameters.
   */
  execute(signal: AbortSignal, updateOutput?: (output: string) => void): Promise<TResult>;
}

/**
 * Generic base class for tool invocations.
 * Provides common functionality while preserving type safety.
 */
export abstract class BaseToolInvocation<
  TParams extends object,
  TResult extends ToolResult,
> implements ToolInvocation<TParams, TResult> {
  constructor(
    readonly params: TParams,
    protected readonly messageBus?: MessageBus,
    readonly toolName?: string,
    readonly toolDisplayName?: string,
    readonly serverName?: string
  ) {}

  abstract getDescription(): string;
  abstract toolLocations(): ToolLocation[];
  abstract shouldConfirmExecute(
    abortSignal: AbortSignal
  ): Promise<ToolCallConfirmationDetails | false>;
  abstract execute(signal: AbortSignal, updateOutput?: (output: string) => void): Promise<TResult>;
}

// File: packages/core/src/tools/readFile.ts
/**
 * Specific parameter type for read file tool.
 */
interface ReadFileParams {
  file_path: string;
  line?: number;
  limit?: number;
}

/**
 * Specific result type for read file tool.
 */
interface ReadFileResult extends ToolResult {
  content: string;
  size: number;
}

/**
 * Concrete implementation of generic base class.
 * Specifies ReadFileParams and ReadFileResult as type parameters.
 */
class ReadFileInvocation extends BaseToolInvocation<ReadFileParams, ReadFileResult> {
  constructor(
    params: ReadFileParams,
    private config: Config
  ) {
    super(params, undefined, 'read_file');
  }

  getDescription(): string {
    return `Reading ${this.params.file_path}`;
  }

  toolLocations(): ToolLocation[] {
    return [{ path: this.params.file_path, type: 'read' }];
  }

  async shouldConfirmExecute(): Promise<ToolCallConfirmationDetails | false> {
    return false; // Reading is safe, no confirmation needed
  }

  async execute(signal: AbortSignal): Promise<ReadFileResult> {
    const content = await this.config.getFileSystemService().readTextFile(this.params.file_path);

    return {
      content,
      size: content.length,
      llmContent: content,
      returnDisplay: `Read ${this.params.file_path} (${content.length} bytes)`,
    };
  }
}

// File: packages/cli/src/zed-integration/schema.ts
/**
 * Generic Result type for success/error outcomes.
 */
export type Result<T> =
  | {
      result: T;
    }
  | {
      error: ErrorResponse;
    };

/**
 * Usage: Different types can be wrapped in Result
 */
type UserResult = Result<User>;
type ConfigResult = Result<Config>;
type DataResult = Result<string[]>;

/**
 * Generic handler for Result type.
 */
function handleResult<T>(result: Result<T>): T {
  if ('result' in result) {
    return result.result;
  }
  throw new Error(result.error.message);
}

// File: packages/cli/src/utils/deepMerge.ts
/**
 * Recursive mergeable type using generic array.
 */
export type Mergeable = string | number | boolean | null | undefined | object | Mergeable[]; // Recursive generic array

export type MergeableObject = Record<string, Mergeable>;

/**
 * Generic deep merge function preserving type.
 */
export function deepMerge<T extends MergeableObject>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };

  for (const source of sources) {
    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue) as T[Extract<keyof T, string>];
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}
```

**Example explained:**

- Lines 1-73: Generic interface and base class with two type parameters constrained by extends
- Lines 75-130: Concrete implementation specifying specific types for generic parameters
- Lines 132-155: Generic discriminated union Result<T> for success/error handling
- Lines 157-188: Generic function with recursive type and type preservation

### When to Use

**Use generic types when:**

- Creating reusable abstractions that work with multiple types
- Building container types (arrays, maps, results, etc.)
- Implementing algorithms that work on any type
- Creating tool or API wrappers with type-safe parameters
- Defining interfaces for polymorphic behavior
- Need to preserve type information through operations

**Avoid generic types when:**

- Only one type will ever be used (use specific type)
- Logic varies significantly by type (use discriminated union)
- Type parameter is never used (remove unused generic)
- `unknown` with type guards would be simpler

### Benefits

- **Type Safety**: Compiler checks types throughout generic code
- **Code Reuse**: Single implementation works for multiple types
- **IntelliSense**: Full IDE support with inferred types
- **Type Preservation**: Type information flows through operations
- **Refactoring**: Changes to types caught everywhere generic is used
- **Documentation**: Type parameters document flexibility

### Trade-offs

- **Complexity**: Generic code can be harder to understand
- **Error Messages**: Compiler errors can be verbose with generics
- **Learning Curve**: Developers must understand generic type system
- **Overuse**: Can lead to overly abstract code

### Common Mistakes

**Mistake 1: Not constraining generic types**

❌ **Bad example:**

```typescript
function getProperty<T>(obj: T, key: string): any {
  return obj[key]; // Error: Element implicitly has 'any' type
}
```

✅ **Correct approach:**

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // Type-safe property access
}
```

**Why this matters**: Unconstrained generics can't be used safely. Constraints enable type-safe operations on generic types.

**Mistake 2: Using `any` in generic code**

❌ **Bad example:**

```typescript
class Container<T> {
  private value: any; // Defeats purpose of generics

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value as T; // Unsafe cast
  }
}
```

✅ **Correct approach:**

```typescript
class Container<T> {
  private value: T; // Use generic type parameter

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value; // Type-safe access
  }
}
```

**Why this matters**: Using `any` in generic code loses all type safety benefits that generics provide.

**Mistake 3: Too many type parameters**

❌ **Bad example:**

```typescript
interface Complex<T, U, V, W, X, Y, Z> {
  // Too many type parameters - hard to use
}
```

✅ **Correct approach:**

```typescript
interface Simpler<TParams extends object, TResult> {
  // Two well-named parameters - clear purpose
}
```

**Why this matters**: Too many type parameters make code difficult to use and understand. Combine related parameters or split into smaller interfaces.

### Testing Strategy

**What to Test:**

- Generic functions work with different types correctly
- Type constraints are enforced (compile-time check)
- Type information is preserved through operations
- Edge cases work for all type parameters
- Generic classes maintain type safety

**Test Organization:**

- Test with multiple concrete types
- One describe block per generic function/class
- Test type preservation explicitly
- Test constraint violations (if testable)

**Mock Strategy:**

- Use real types for testing generics
- Create simple test types for generic parameters
- Mock dependencies, not generic types themselves

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { BaseToolInvocation } from './tools.js';

describe('Generic Tool Invocation', () => {
  // Test params type
  interface TestParams {
    value: string;
  }

  // Test result type
  interface TestResult extends ToolResult {
    processed: string;
  }

  // Concrete implementation for testing
  class TestInvocation extends BaseToolInvocation<TestParams, TestResult> {
    getDescription(): string {
      return `Processing ${this.params.value}`;
    }

    toolLocations(): ToolLocation[] {
      return [];
    }

    async shouldConfirmExecute(): Promise<false> {
      return false;
    }

    async execute(): Promise<TestResult> {
      return {
        processed: this.params.value.toUpperCase(),
        llmContent: this.params.value,
        returnDisplay: 'Done',
      };
    }
  }

  it('should preserve parameter types', () => {
    // Arrange
    const params: TestParams = { value: 'test' };
    const invocation = new TestInvocation(params);

    // Assert - TypeScript ensures this compiles
    expect(invocation.params.value).to.equal('test');
  });

  it('should return correct result type', async () => {
    // Arrange
    const params: TestParams = { value: 'test' };
    const invocation = new TestInvocation(params);

    // Act
    const result = await invocation.execute(new AbortController().signal);

    // Assert - TypeScript ensures TestResult structure
    expect(result.processed).to.equal('TEST');
    expect(result.llmContent).to.equal('test');
  });

  it('should work with different parameter types', () => {
    // Arrange - different parameter type
    interface NumberParams {
      count: number;
    }

    class NumberInvocation extends BaseToolInvocation<NumberParams, ToolResult> {
      getDescription(): string {
        return `Count: ${this.params.count}`;
      }

      toolLocations(): ToolLocation[] {
        return [];
      }

      async shouldConfirmExecute(): Promise<false> {
        return false;
      }

      async execute(): Promise<ToolResult> {
        return {
          llmContent: String(this.params.count),
          returnDisplay: 'Done',
        };
      }
    }

    const params: NumberParams = { count: 42 };
    const invocation = new NumberInvocation(params);

    // Assert - works with different type
    expect(invocation.params.count).to.equal(42);
  });
});

describe('Generic Result Type', () => {
  it('should handle success results', () => {
    // Arrange
    const result: Result<string> = { result: 'success' };

    // Act
    const value = handleResult(result);

    // Assert
    expect(value).to.equal('success');
  });

  it('should handle error results', () => {
    // Arrange
    const result: Result<string> = {
      error: { message: 'Failed', code: 500 },
    };

    // Act & Assert
    expect(() => handleResult(result)).to.throw('Failed');
  });

  it('should work with different result types', () => {
    // Arrange
    const numberResult: Result<number> = { result: 42 };
    const arrayResult: Result<string[]> = { result: ['a', 'b'] };

    // Act
    const num = handleResult(numberResult);
    const arr = handleResult(arrayResult);

    // Assert
    expect(num).to.equal(42);
    expect(arr).to.deep.equal(['a', 'b']);
  });
});
```

**Coverage Goals:**

- Test with at least 2-3 different concrete types
- Line coverage: 80%+ (focus on logic, not type checking)
- Branch coverage: 80%+
- Test type constraints are working (compile-time check)

### Related Patterns

- **[Explicit Return Types](#pattern-4-explicit-return-types)** - Generic return types must be explicit
- **[Type Guards](#pattern-2-type-guards)** - Use with generics for runtime narrowing
- **[No Any Types](#pattern-1-no-any-types)** - Never use any in generic code

---

## Pattern 6: Runtime Validation

### Intent

Validate external data at runtime using Zod schemas while inferring TypeScript types from the schemas for type safety throughout the codebase.

### Problem

TypeScript provides compile-time type safety, but external data (API responses, user input, file contents) arrives at runtime with no guarantees about its structure. Writing manual validation code is error-prone and leads to duplication between validation logic and type definitions. Type definitions can drift from validation logic, causing runtime bugs.

### Solution

Use Zod to define schemas that both validate data at runtime and infer TypeScript types at compile time. The schema becomes the single source of truth for both validation rules and type definitions, eliminating duplication and ensuring consistency.

### Structure

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().positive().optional(),
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;

// Validate at runtime
function loadUser(data: unknown): User {
  return UserSchema.parse(data); // Throws if invalid
}
```

### Implementation

**Step 1: Define basic schemas**

```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().positive().optional(),
});

type Config = z.infer<typeof ConfigSchema>;
```

**Step 2: Add validation with error handling**

```typescript
function loadConfig(input: unknown): Config {
  try {
    return ConfigSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Invalid config:\n${messages.join('\n')}`);
    }
    throw error;
  }
}
```

**Step 3: Use safe parsing for non-throwing validation**

```typescript
function loadConfigSafe(input: unknown): Config | null {
  const result = ConfigSchema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  console.error('Validation failed:', result.error);
  return null;
}
```

### Complete Example

```typescript
// File: packages/cli/src/zed-integration/schema.ts
import { z } from 'zod';

/**
 * Authentication method schema with validation rules.
 */
export const authMethodSchema = z.object({
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
});

export type AuthMethod = z.infer<typeof authMethodSchema>;

/**
 * File operation request schemas with constraints.
 */
export const writeTextFileRequestSchema = z.object({
  content: z.string(),
  path: z.string(),
  sessionId: z.string(),
});

export type WriteTextFileRequest = z.infer<typeof writeTextFileRequestSchema>;

export const readTextFileRequestSchema = z.object({
  limit: z.number().optional().nullable(),
  line: z.number().optional().nullable(),
  path: z.string(),
  sessionId: z.string(),
});

export type ReadTextFileRequest = z.infer<typeof readTextFileRequestSchema>;

/**
 * Permission option kinds as literal union.
 */
export const permissionOptionKindSchema = z.union([
  z.literal('allow_once'),
  z.literal('allow_always'),
  z.literal('reject_once'),
  z.literal('reject_always'),
]);

export type PermissionOptionKind = z.infer<typeof permissionOptionKindSchema>;

/**
 * Role schema with strict literal values.
 */
export const roleSchema = z.union([z.literal('assistant'), z.literal('user')]);

export type Role = z.infer<typeof roleSchema>;

// File: packages/core/src/policy/toml-loader.ts
/**
 * Policy decision enum for validation.
 */
enum PolicyDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  ASK = 'ask',
}

/**
 * Policy rule schema with complex validation.
 */
const PolicyRuleSchema = z.object({
  toolName: z.union([z.string(), z.array(z.string())]).optional(),
  mcpName: z.string().optional(),
  argsPattern: z.string().optional(),
  commandPrefix: z.union([z.string(), z.array(z.string())]).optional(),
  commandRegex: z.string().optional(),
  decision: z.nativeEnum(PolicyDecision),
  // Priority must be in range [0, 999] to prevent tier overflow
  priority: z
    .number({
      required_error: 'priority is required',
      invalid_type_error: 'priority must be a number',
    })
    .int({ message: 'priority must be an integer' })
    .min(0, { message: 'priority must be >= 0' })
    .max(999, {
      message:
        'priority must be <= 999 to prevent tier overflow. Priorities >= 1000 would jump to the next tier.',
    }),
  modes: z.array(z.string()).optional(),
});

type PolicyRuleToml = z.infer<typeof PolicyRuleSchema>;

/**
 * Safety checker schema with discriminated union.
 */
const SafetyCheckerRuleSchema = z.object({
  toolName: z.string(),
  modes: z.array(z.string()).optional(),
  checker: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('in-process'),
      name: z.nativeEnum(InProcessCheckerType),
      requiredContext: z.array(z.string()).optional(),
      config: z.record(z.unknown()).optional(),
    }),
    z.object({
      type: z.literal('external'),
      name: z.string(),
      requiredContext: z.array(z.string()).optional(),
      config: z.record(z.unknown()).optional(),
    }),
  ]),
});

type SafetyCheckerRule = z.infer<typeof SafetyCheckerRuleSchema>;

/**
 * Complete policy file schema.
 */
const PolicyFileSchema = z.object({
  rule: z.array(PolicyRuleSchema).optional(),
  safety_checker: z.array(SafetyCheckerRuleSchema).optional(),
});

/**
 * Load and validate policy file with error handling.
 */
export async function loadPolicyFile(
  filePath: string
): Promise<{ rules: PolicyRule[]; checkers: SafetyCheckerRule[] } | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed = TOML.parse(content);

    // Validate with Zod
    const validationResult = PolicyFileSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error('Schema validation failed:', formatSchemaError(validationResult.error));
      return null;
    }

    return {
      rules: validationResult.data.rule ?? [],
      checkers: validationResult.data.safety_checker ?? [],
    };
  } catch (error) {
    console.error('Failed to load policy file:', error);
    return null;
  }
}

/**
 * Format Zod validation errors for human readability.
 */
function formatSchemaError(error: z.ZodError): string {
  const issues = error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return `  - Field "${path}": ${issue.message}`;
    })
    .join('\n');
  return `Validation errors:\n${issues}`;
}

// File: packages/core/src/ide/types.ts
/**
 * IDE file schema with nested object validation.
 */
export const FileSchema = z.object({
  /**
   * The absolute path to the file.
   */
  path: z.string(),
  /**
   * The unix timestamp of when the file was last focused.
   */
  timestamp: z.number(),
  /**
   * Whether the file is the currently active file.
   */
  isActive: z.boolean().optional(),
  /**
   * The text that is currently selected in the active file.
   */
  selectedText: z.string().optional(),
  /**
   * The cursor position in the active file.
   */
  cursor: z
    .object({
      /**
       * The 1-based line number.
       */
      line: z.number(),
      /**
       * The 1-based character offset.
       */
      character: z.number(),
    })
    .optional(),
});

export type File = z.infer<typeof FileSchema>;

/**
 * Workspace context schema with array validation.
 */
export const WorkspaceContextSchema = z.object({
  openFiles: z.array(FileSchema),
  workspaceFolders: z.array(z.string()),
  activeEditor: z.string().optional(),
});

export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;

/**
 * Validate workspace context from external source.
 */
export function validateWorkspaceContext(data: unknown): WorkspaceContext {
  try {
    return WorkspaceContextSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid workspace context: ${formatSchemaError(error)}`);
    }
    throw error;
  }
}
```

**Example explained:**

- Lines 1-51: Basic schemas with type inference for simple validation
- Lines 53-130: Complex schemas with custom error messages and range constraints
- Lines 132-160: Discriminated union validation with Zod
- Lines 162-185: Error formatting and safe parsing patterns
- Lines 187-230: Nested object validation with documentation

### When to Use

**Use runtime validation when:**

- Reading data from external sources (APIs, files, user input)
- Deserializing JSON or parsing configuration files
- Handling untrusted data from network requests
- Loading environment variables with type safety
- Validating command-line arguments
- Processing data from third-party libraries

**Avoid runtime validation when:**

- Data is already validated (internal function calls)
- Type is guaranteed by TypeScript (internal types)
- Performance is critical and data is trusted
- Validation overhead outweighs benefits

### Benefits

- **Single Source of Truth**: Schema defines both validation and types
- **Runtime Safety**: Catch invalid data before it causes bugs
- **Type Inference**: TypeScript types automatically match validation
- **Clear Error Messages**: Zod provides detailed validation errors
- **Composable**: Schemas can be combined and reused
- **Self-Documenting**: Schema describes expected data structure

### Trade-offs

- **Runtime Cost**: Validation executes at runtime, adding overhead
- **Bundle Size**: Zod adds to bundle size
- **Learning Curve**: Developers must learn Zod API
- **Error Handling**: Must handle validation errors properly
- **Schema Complexity**: Complex schemas can become difficult to maintain

### Common Mistakes

**Mistake 1: Not handling validation errors**

❌ **Bad example:**

```typescript
function loadConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
  // Throws raw ZodError - poor error messages
}
```

✅ **Correct approach:**

```typescript
function loadConfig(data: unknown): Config {
  try {
    return ConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Invalid config:\n${messages.join('\n')}`);
    }
    throw error;
  }
}
```

**Why this matters**: Raw Zod errors are difficult to understand. Format errors for better debugging experience.

**Mistake 2: Validating internal data**

❌ **Bad example:**

```typescript
function processUser(user: User): void {
  // User is already typed, no need to validate
  const validated = UserSchema.parse(user); // Unnecessary overhead
  console.log(validated.name);
}
```

✅ **Correct approach:**

```typescript
function processUser(user: User): void {
  // User type is guaranteed by TypeScript
  console.log(user.name); // No validation needed
}
```

**Why this matters**: Validating already-typed data wastes performance. Only validate at system boundaries.

**Mistake 3: Not using safe parsing**

❌ **Bad example:**

```typescript
function loadConfigFromFile(filePath: string): Config | null {
  const content = readFileSync(filePath, 'utf-8');
  try {
    return ConfigSchema.parse(JSON.parse(content));
  } catch {
    return null; // Lost error information
  }
}
```

✅ **Correct approach:**

```typescript
function loadConfigFromFile(filePath: string): Config | null {
  const content = readFileSync(filePath, 'utf-8');
  const result = ConfigSchema.safeParse(JSON.parse(content));

  if (result.success) {
    return result.data;
  }

  console.error('Config validation failed:', formatSchemaError(result.error));
  return null;
}
```

**Why this matters**: `safeParse` provides structured error information without throwing, enabling better error handling.

### Testing Strategy

**What to Test:**

- Schema accepts valid data
- Schema rejects invalid data with correct errors
- Type inference matches runtime validation
- Edge cases (null, undefined, empty values)
- Schema composition works correctly
- Error messages are helpful

**Test Organization:**

- One describe block per schema
- Test valid cases (should pass)
- Test invalid cases (should fail)
- Test edge cases and boundaries
- Test error message format

**Mock Strategy:**

- No mocks needed for schema validation
- Test with real data structures
- Create fixtures for complex schemas
- Mock file reading, not validation

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { z } from 'zod';
import { ConfigSchema, PolicyRuleSchema, FileSchema } from './schemas.js';

describe('Runtime Validation Schemas', () => {
  describe('ConfigSchema', () => {
    it('should validate valid config', () => {
      // Arrange
      const validConfig = {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      };

      // Act
      const result = ConfigSchema.safeParse(validConfig);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.model).to.equal('gpt-4');
        expect(result.data.temperature).to.equal(0.7);
      }
    });

    it('should reject config with invalid temperature', () => {
      // Arrange
      const invalidConfig = {
        model: 'gpt-4',
        temperature: 1.5, // Out of range [0, 1]
      };

      // Act
      const result = ConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors).to.have.length.greaterThan(0);
        expect(errors[0].path).to.include('temperature');
      }
    });

    it('should accept config with optional maxTokens', () => {
      // Arrange
      const configWithoutMaxTokens = {
        model: 'gpt-4',
        temperature: 0.5,
      };

      // Act
      const result = ConfigSchema.safeParse(configWithoutMaxTokens);

      // Assert
      expect(result.success).to.be.true;
    });
  });

  describe('PolicyRuleSchema', () => {
    it('should validate rule with valid priority', () => {
      // Arrange
      const validRule = {
        toolName: 'bash',
        decision: 'allow',
        priority: 500,
      };

      // Act
      const result = PolicyRuleSchema.safeParse(validRule);

      // Assert
      expect(result.success).to.be.true;
    });

    it('should reject rule with priority out of range', () => {
      // Arrange
      const invalidRule = {
        toolName: 'bash',
        decision: 'allow',
        priority: 1000, // Exceeds max of 999
      };

      // Act
      const result = PolicyRuleSchema.safeParse(invalidRule);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.errors[0].message).to.include('999');
      }
    });

    it('should reject rule with missing priority', () => {
      // Arrange
      const invalidRule = {
        toolName: 'bash',
        decision: 'allow',
        // priority missing
      };

      // Act
      const result = PolicyRuleSchema.safeParse(invalidRule);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.errors[0].message).to.include('required');
      }
    });
  });

  describe('FileSchema', () => {
    it('should validate file with cursor', () => {
      // Arrange
      const validFile = {
        path: '/path/to/file.ts',
        timestamp: Date.now(),
        isActive: true,
        cursor: {
          line: 10,
          character: 5,
        },
      };

      // Act
      const result = FileSchema.safeParse(validFile);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.cursor?.line).to.equal(10);
      }
    });

    it('should validate file without optional fields', () => {
      // Arrange
      const minimalFile = {
        path: '/path/to/file.ts',
        timestamp: Date.now(),
      };

      // Act
      const result = FileSchema.safeParse(minimalFile);

      // Assert
      expect(result.success).to.be.true;
    });

    it('should reject file with invalid cursor structure', () => {
      // Arrange
      const invalidFile = {
        path: '/path/to/file.ts',
        timestamp: Date.now(),
        cursor: {
          line: 'invalid', // Should be number
          character: 5,
        },
      };

      // Act
      const result = FileSchema.safeParse(invalidFile);

      // Assert
      expect(result.success).to.be.false;
    });
  });
});
```

**Coverage Goals:**

- Test every schema with valid data
- Test every schema with invalid data
- Test optional fields both present and absent
- Test boundary conditions (min, max)
- Line coverage: 100% (schemas are declarative)

### Related Patterns

- **[No Any Types](#pattern-1-no-any-types)** - Use Zod to validate unknown types
- **[Type Guards](#pattern-2-type-guards)** - Zod provides runtime type checking
- **[Explicit Return Types](#pattern-4-explicit-return-types)** - Inferred types should match return types

---

## Quick Reference

### Pattern Summary Table

| Pattern               | Use When                                    | Avoid When                  | Key Benefit                                     |
| --------------------- | ------------------------------------------- | --------------------------- | ----------------------------------------------- |
| No Any Types          | Handling external/unknown data              | Internal typed code         | Compile-time safety with narrowing              |
| Type Guards           | Runtime type checking needed                | Type already narrow         | Reusable type narrowing functions               |
| Discriminated Unions  | Multiple variants with different properties | All variants same structure | Exhaustive handling verification                |
| Explicit Return Types | Always - all functions                      | Never                       | Early error detection and documentation         |
| Generic Types         | Reusable abstractions for multiple types    | Only one type used          | Type-safe code reuse                            |
| Runtime Validation    | External data sources                       | Internal function calls     | Single source of truth for types and validation |

### Code Snippets

**No Any Types - Minimal Example:**

```typescript
function handleValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new Error('Expected string');
}
```

**Type Guards - Minimal Example:**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
```

**Discriminated Unions - Minimal Example:**

```typescript
type Result = { status: 'success'; value: string } | { status: 'error'; error: Error };

function handleResult(result: Result): string {
  switch (result.status) {
    case 'success':
      return result.value;
    case 'error':
      return result.error.message;
    default:
      const _exhaustive: never = result;
      throw new Error('Unhandled case');
  }
}
```

**Explicit Return Types - Minimal Example:**

```typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}
```

**Generic Types - Minimal Example:**

```typescript
interface Container<T> {
  value: T;
  getValue(): T;
}

function identity<T>(value: T): T {
  return value;
}
```

**Runtime Validation - Minimal Example:**

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/prefer-as-const": "error"
  }
}
```

**Pre-commit Hooks:**

```json
{
  "scripts": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write", "tsc --noEmit"]
  }
}
```

**Build-Time Checks:**

```bash
# Fails build if type errors
npm run typecheck

# Fails build if linting errors
npm run lint

# Run both before committing
npm run preflight
```

---

## Related Patterns

- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Type guards essential for safe error handling
- **[Testing Patterns](./05-testing-patterns.md)** - Mock objects must match interface types
- **[Code Organization](./06-code-organization.md)** - Interface definitions enable type safety
- **[Module Boundaries](./07-module-boundaries.md)** - Public API types must be explicit

---

## References

**Source Code Examples:**

- [safeJsonStringify.ts](../../examplecode/gemini/packages/core/src/utils/safeJsonStringify.ts) - Using unknown with type narrowing
- [errors.ts](../../examplecode/gemini/packages/core/src/utils/errors.ts) - Type guard implementations
- [shell-utils.ts](../../examplecode/gemini/packages/core/src/utils/shell-utils.ts) - Complex type narrowing and explicit return types
- [schema.ts](../../examplecode/gemini/packages/cli/src/zed-integration/schema.ts) - Discriminated unions and Zod validation
- [tools.ts](../../examplecode/gemini/packages/core/src/tools/tools.ts) - Generic types with constraints
- [toml-loader.ts](../../examplecode/gemini/packages/core/src/policy/toml-loader.ts) - Runtime validation with error handling

**External Resources:**

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Official guide to type narrowing
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) - Type predicate functions
- [TypeScript Handbook - Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) - Generic types documentation
- [Zod Documentation](https://zod.dev/) - Runtime validation library
- [TypeScript Deep Dive - Discriminated Unions](https://basarat.gitbook.io/typescript/type-system/discriminated-unions) - Pattern explanation

---

## Changelog

- **2025-01-21**: Complete rewrite following standardized template with concrete examples from reference codebase
- **2025-01-21**: Added comprehensive testing strategies for all patterns
- **2025-01-21**: Expanded all patterns to include complete implementations, common mistakes, and when to use guidance
- **2025-01-21**: Added enforcement section with TypeScript and ESLint configurations
