# Documentation Standards

> **Standard ID**: STD-008 **Document Version**: 1.0 **Last Updated**:
> 2025-11-29 **Status**: Active **Scope**: TypeScript/Node.js Projects
> **Enforcement**: Automated + Manual Review **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - Identifier naming rules
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory documentation rules for TypeScript/Node.js
projects. These rules define when, what, and how to document code. The goal is
high-value documentation that aids understanding without cluttering the
codebase.

### 1.2 Scope

**Applies to**:

- JSDoc/TSDoc comments on functions, classes, interfaces, types
- Inline code comments
- File headers and module descriptions
- README files
- TODO/FIXME annotations

**Does NOT apply to**:

- External documentation sites (covered separately)
- API documentation generators (Typedoc config)
- Commit messages (see Git Workflow standard)

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism       |
| ---------- | ---------------------------------- | --------------- |
| **MUST**   | Mandatory; violations block merge  | ESLint, CI      |
| **SHOULD** | Recommended; exceptions documented | Code review     |
| **MAY**    | Optional                           | Team preference |

---

## 2. Guiding Principles

| Principle                   | Description                                                               |
| --------------------------- | ------------------------------------------------------------------------- |
| High-Value Only             | Only write comments that add information not obvious from the code itself |
| Types Are Documentation     | Let TypeScript types document structure; JSDoc documents semantics        |
| Self-Documenting Code First | Prefer clear naming over explanatory comments                             |
| Consistency                 | Same patterns across entire codebase                                      |

---

## 3. Rules

### 3.1 File Headers

#### Rule 3.1.1: Module Description (Optional)

| Attribute       | Value                                 |
| --------------- | ------------------------------------- |
| **Enforcement** | SHOULD                                |
| **Automation**  | Manual                                |
| **Applies to**  | Complex modules with multiple exports |

**Rule Statement**: Files with complex or non-obvious purpose SHOULD include a
`@fileoverview` tag at the top of the file so that developers understand the
module's role.

**Correct Examples**:

```typescript
// CORRECT: @fileoverview for complex module
/**
 * @fileoverview Defines the core configuration interfaces and types
 * for the agent architecture. These types are used throughout the
 * orchestration layer.
 */

import { z } from 'zod';
```

**Incorrect Examples**:

```typescript
// INCORRECT: @fileoverview buried after imports
import { z } from 'zod';

/**
 * @fileoverview This module handles user authentication.
 */
```

**Rationale**: Module descriptions help developers quickly understand a file's
purpose without reading all the code. They should be at the top of the file.

---

### 3.2 JSDoc for Functions

#### Rule 3.2.1: Public Functions Require JSDoc

| Attribute       | Value                        |
| --------------- | ---------------------------- |
| **Enforcement** | MUST                         |
| **Automation**  | ESLint `jsdoc/require-jsdoc` |
| **Applies to**  | All exported functions       |

**Rule Statement**: Every exported function SHALL have JSDoc with a description,
`@param` for each parameter, and `@returns` describing the return value so that
consumers understand the function's contract.

**Correct Examples**:

```typescript
// CORRECT: Full JSDoc for exported function
/**
 * Retries a function with exponential backoff and jitter.
 * @param fn The asynchronous function to retry.
 * @param options Optional retry configuration.
 * @returns A promise that resolves with the result of the function if successful.
 * @throws The last error encountered if all attempts fail.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // implementation
}
```

```typescript
// CORRECT: Simple function with minimal but complete JSDoc
/**
 * Safely replaces text with literal strings, avoiding template interpretation.
 * @param str The source string.
 * @param oldString The substring to find.
 * @param newString The replacement string.
 * @returns The string with replacements made.
 */
export function safeLiteralReplace(str: string, oldString: string, newString: string): string {
  // implementation
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Exported function without JSDoc
export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // implementation
}
```

```typescript
// INCORRECT: Missing @returns
/**
 * Retries a function with exponential backoff.
 * @param fn The function to retry.
 * @param options Retry options.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // implementation
}
```

```typescript
// INCORRECT: Repeating type information in JSDoc
/**
 * Retries a function.
 * @param {() => Promise<T>} fn The function to retry.
 * @param {Partial<RetryOptions>} options Retry options.
 * @returns {Promise<T>} The result.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  // implementation
}
```

**Rationale**: Public APIs are the contract with consumers. JSDoc ensures that
contract is clear. TypeScript provides types; JSDoc provides semantic meaning.

---

#### Rule 3.2.2: Private Functions - Minimal Documentation

| Attribute       | Value                                   |
| --------------- | --------------------------------------- |
| **Enforcement** | MAY                                     |
| **Automation**  | Manual                                  |
| **Applies to**  | Non-exported functions, private methods |

**Rule Statement**: Private functions MAY have minimal or no JSDoc when the
function name and signature are self-explanatory.

**Correct Examples**:

```typescript
// CORRECT: Private method with no JSDoc (self-explanatory)
private validateEmail(email: string): boolean {
  return email.includes('@');
}
```

```typescript
// CORRECT: Private method with brief comment for non-obvious logic
/** Notifies all registered listeners, ignoring individual listener errors. */
private notifyListeners(): void {
  for (const listener of [...this.listeners]) {
    try {
      listener();
    } catch (error) {
      // Don't let one listener break others
      this.logger.warn(`Listener error: ${error}`);
    }
  }
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Excessive documentation for simple private method
/**
 * Validates that an email address is valid.
 * @param email The email address to validate.
 * @returns True if the email contains an @ symbol, false otherwise.
 */
private validateEmail(email: string): boolean {
  return email.includes('@');
}
```

**Rationale**: Over-documenting obvious code creates maintenance burden and
visual noise. Trust descriptive naming.

---

#### Rule 3.2.3: Async Function Documentation

| Attribute       | Value                        |
| --------------- | ---------------------------- |
| **Enforcement** | MUST                         |
| **Automation**  | ESLint                       |
| **Applies to**  | All exported async functions |

**Rule Statement**: Async function `@returns` SHALL describe what the promise
resolves to, using the pattern "A promise that resolves to..." so that consumers
understand the async contract.

**Correct Examples**:

```typescript
// CORRECT: @returns describes promise resolution
/**
 * Reads content from a file within the workspace.
 * @param path The file path to read.
 * @returns A promise that resolves to the file content as a string.
 * @throws NotFoundError if the file does not exist.
 */
export async function readFile(path: string): Promise<string> {
  // implementation
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: @returns doesn't describe resolution
/**
 * Reads content from a file.
 * @param path The file path.
 * @returns Promise<string>
 */
export async function readFile(path: string): Promise<string> {
  // implementation
}
```

**Rationale**: Promise types alone don't explain what the promise represents
semantically.

---

#### Rule 3.2.4: Error Documentation with @throws

| Attribute       | Value                       |
| --------------- | --------------------------- |
| **Enforcement** | SHOULD                      |
| **Automation**  | Manual                      |
| **Applies to**  | Functions that throw errors |

**Rule Statement**: Functions that throw errors SHOULD document each error type
with `@throws` so that consumers can handle errors appropriately.

**Correct Examples**:

```typescript
// CORRECT: @throws documents error conditions
/**
 * Retrieves a user by their unique identifier.
 * @param userId The user's unique ID.
 * @returns A promise that resolves to the user object.
 * @throws NotFoundError if no user exists with the given ID.
 * @throws ValidationError if the userId format is invalid.
 */
export async function getUserById(userId: string): Promise<User> {
  // implementation
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No @throws for function that throws
/**
 * Retrieves a user by ID.
 * @param userId The user ID.
 * @returns The user.
 */
export async function getUserById(userId: string): Promise<User> {
  if (!isValidId(userId)) {
    throw new ValidationError('Invalid user ID');
  }
  const user = await this.repository.find(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}
```

**Rationale**: Error documentation is part of the function contract. Consumers
need to know what can go wrong.

---

### 3.3 JSDoc for Types

#### Rule 3.3.1: Interface Documentation

| Attribute       | Value                   |
| --------------- | ----------------------- |
| **Enforcement** | MUST                    |
| **Automation**  | ESLint                  |
| **Applies to**  | All exported interfaces |

**Rule Statement**: Exported interfaces SHALL have JSDoc describing their
purpose, with optional documentation on individual properties when meaning is
not obvious from the property name.

**Correct Examples**:

```typescript
// CORRECT: Interface with description and property docs where needed
/**
 * Configuration for retry behavior with exponential backoff.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts. */
  maxRetries: number;
  /** Initial delay in milliseconds before first retry. */
  initialDelayMs: number;
  /** Maximum delay cap in milliseconds. */
  maxDelayMs: number;
  /** Jitter factor (0-1) to randomize delays. */
  jitterFactor?: number;
}
```

```typescript
// CORRECT: Self-explanatory properties without individual docs
/**
 * Represents a user account in the system.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  isActive: boolean;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No interface-level description
export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
}
```

```typescript
// INCORRECT: Redundant property documentation
/**
 * Represents a user.
 */
export interface User {
  /** The user's ID. */
  id: string;
  /** The user's email. */
  email: string;
  /** The user's display name. */
  displayName: string;
}
```

**Rationale**: Interface descriptions explain the concept. Property docs only
add value when the property name alone is insufficient.

---

#### Rule 3.3.2: Complex Type Aliases with @example

| Attribute       | Value                                                     |
| --------------- | --------------------------------------------------------- |
| **Enforcement** | SHOULD                                                    |
| **Automation**  | Manual                                                    |
| **Applies to**  | Complex type aliases, especially recursive or union types |

**Rule Statement**: Complex type aliases SHOULD include `@example` blocks
demonstrating usage so that developers understand the expected structure.

**Correct Examples**:

```typescript
// CORRECT: Complex type with @example
/**
 * Defines a virtual file system structure for testing.
 * Keys are file or directory names. Values can be:
 * - A string: The content of a file.
 * - An object: A subdirectory with its own structure.
 * - An array: A directory where strings are empty files.
 *
 * @example
 * const structure = {
 *   'config.json': '{ "port": 3000 }',
 *   'src': {
 *     'index.ts': 'export const main = () => {};',
 *     'utils.ts': '// Utilities',
 *   },
 *   'logs': ['error.log', 'access.log'],
 * };
 */
export type FileSystemStructure = {
  [name: string]: string | FileSystemStructure | Array<string | FileSystemStructure>;
};
```

**Incorrect Examples**:

```typescript
// INCORRECT: Complex type without examples
export type FileSystemStructure = {
  [name: string]: string | FileSystemStructure | Array<string | FileSystemStructure>;
};
```

**Rationale**: Complex types are hard to understand from the type signature
alone. Examples provide clarity.

---

#### Rule 3.3.3: Enum Documentation

| Attribute       | Value              |
| --------------- | ------------------ |
| **Enforcement** | MUST               |
| **Automation**  | ESLint             |
| **Applies to**  | All exported enums |

**Rule Statement**: Exported enums SHALL have JSDoc on the enum itself and on
individual members when the member name alone is not self-explanatory.

**Correct Examples**:

```typescript
// CORRECT: Enum with member documentation
/**
 * Events emitted during agent execution.
 */
export enum AgentEvent {
  /** Request for user confirmation before executing a tool. */
  ToolConfirmationRequest = 'tool-confirmation-request',
  /** Progress update on tool execution. */
  ToolProgressUpdate = 'tool-progress-update',
  /** Final text output from the agent. */
  TextOutput = 'text-output',
  /** Agent execution has completed. */
  Complete = 'complete',
}
```

```typescript
// CORRECT: Self-explanatory enum members without individual docs
/**
 * HTTP methods supported by the API client.
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No enum-level description
export enum AgentEvent {
  ToolConfirmationRequest = 'tool-confirmation-request',
  Complete = 'complete',
}
```

**Rationale**: Enums often represent domain concepts. Documentation explains
what those concepts mean.

---

### 3.4 Inline Comments

#### Rule 3.4.1: Comment Style

| Attribute       | Value               |
| --------------- | ------------------- |
| **Enforcement** | MUST                |
| **Automation**  | ESLint              |
| **Applies to**  | All inline comments |

**Rule Statement**: Inline comments SHALL use single-line `//` style, not block
`/* */` style, so that commenting out code is unambiguous.

**Correct Examples**:

```typescript
// CORRECT: Single-line comment style
// Check for null byte to detect binary content
if (byte === 0) {
  return true;
}
```

```typescript
// CORRECT: Multi-line using multiple single-line comments
// The presence of a NULL byte (0x00) is one of the most reliable
// indicators of a binary file. Text files should not contain them.
if (byte === 0) {
  return true;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Block comment style for inline comments
/* Check for null byte to detect binary content */
if (byte === 0) {
  return true;
}
```

**Rationale**: Block comments `/* */` cannot be nested, making it difficult to
comment out code that contains them. Single-line comments are more flexible.

---

#### Rule 3.4.2: High-Value Comments Only

| Attribute       | Value               |
| --------------- | ------------------- |
| **Enforcement** | SHOULD              |
| **Automation**  | Code review         |
| **Applies to**  | All inline comments |

**Rule Statement**: Inline comments SHOULD only explain WHY, not WHAT. Comments
that restate the code are forbidden.

**Correct Examples**:

```typescript
// CORRECT: Explains WHY
// Iterate over a copy to allow listeners to unsubscribe during notification
for (const listener of [...this.listeners]) {
  listener();
}
```

```typescript
// CORRECT: Explains non-obvious behavior
// setTimeout with 0ms defers execution to next event loop tick,
// ensuring all synchronous handlers have completed
setTimeout(() => this.flush(), 0);
```

**Incorrect Examples**:

```typescript
// INCORRECT: Restates the code
// Loop through all listeners
for (const listener of this.listeners) {
  listener();
}
```

```typescript
// INCORRECT: Obvious from the code
// Check if user is null
if (user === null) {
  return;
}
```

```typescript
// INCORRECT: Describes WHAT instead of WHY
// Increment the counter
counter++;
```

**Rationale**: Comments that restate code add no value and become stale when
code changes. Self-documenting code with meaningful names should make the WHAT
obvious.

---

#### Rule 3.4.3: What NOT to Comment

| Attribute       | Value       |
| --------------- | ----------- |
| **Enforcement** | SHOULD      |
| **Automation**  | Code review |
| **Applies to**  | All code    |

**Rule Statement**: The following code patterns SHALL NOT have comments because
they are self-documenting:

| Pattern                            | Example                                             |
| ---------------------------------- | --------------------------------------------------- |
| Simple getters/setters             | `get name() { return this._name; }`                 |
| Obvious control flow               | `if (isValid) { process(); }`                       |
| Standard async/await               | `const result = await fetch(url);`                  |
| Import statements                  | `import { User } from './types.js';`                |
| Type declarations with clear names | `type UserId = string;`                             |
| Constructor property assignments   | `constructor(private readonly service: Service) {}` |

**Rationale**: Over-commenting creates noise and maintenance burden. Trust
descriptive naming.

---

### 3.5 TODO and FIXME Annotations

#### Rule 3.5.1: TODO Format

| Attribute       | Value             |
| --------------- | ----------------- |
| **Enforcement** | MUST              |
| **Automation**  | ESLint            |
| **Applies to**  | All TODO comments |

**Rule Statement**: TODO comments SHALL follow the format
`TODO(owner): description` or `TODO(#issue): description` so that responsibility
and tracking are clear.

**Correct Examples**:

```typescript
// CORRECT: TODO with owner
// TODO(jsmith): Implement retry logic for network failures

// CORRECT: TODO with issue reference
// TODO(#1234): Add support for custom validators

// CORRECT: TODO with both
// TODO(jsmith, #1234): Refactor to use new API
```

**Incorrect Examples**:

```typescript
// INCORRECT: TODO without owner or issue
// TODO: fix this later

// INCORRECT: TODO without clear description
// TODO(jsmith):
```

**Rationale**: TODOs without ownership become orphaned. Issue references enable
tracking.

---

#### Rule 3.5.2: Annotation Types

| Attribute       | Value               |
| --------------- | ------------------- |
| **Enforcement** | SHOULD              |
| **Automation**  | ESLint              |
| **Applies to**  | Special annotations |

**Rule Statement**: Use specific annotation prefixes for different purposes:

| Annotation | Purpose                 | Example                                |
| ---------- | ----------------------- | -------------------------------------- |
| `TODO`     | Planned work            | `// TODO(owner): Add caching`          |
| `FIXME`    | Known bug to fix        | `// FIXME(owner): Race condition here` |
| `HACK`     | Acknowledged workaround | `// HACK: Workaround for library bug`  |
| `NOTE`     | Important context       | `// NOTE: Order matters here`          |

**Correct Examples**:

```typescript
// CORRECT: FIXME for known bug
// FIXME(#2345): Race condition when multiple requests arrive simultaneously

// CORRECT: HACK with explanation
// HACK: Library doesn't export this type, so we reconstruct it
type InternalType = ReturnType<typeof library.internal>;

// CORRECT: NOTE for important context
// NOTE: This must run before database initialization
await loadEnvironmentVariables();
```

**Rationale**: Different annotations communicate different urgency and intent.

---

### 3.6 Class Documentation

#### Rule 3.6.1: Public Class Documentation

| Attribute       | Value                |
| --------------- | -------------------- |
| **Enforcement** | MUST                 |
| **Automation**  | ESLint               |
| **Applies to**  | All exported classes |

**Rule Statement**: Exported classes SHALL have JSDoc describing their
responsibility and key dependencies so that consumers understand the class's
role.

**Correct Examples**:

```typescript
// CORRECT: Class with responsibility and context
/**
 * Orchestrates the discovery and loading of all commands for the CLI.
 *
 * This service operates on a provider-based loader pattern. It is initialized
 * with an array of loader instances, each responsible for fetching commands
 * from a specific source (e.g., built-in code, local files).
 *
 * The service invokes loaders, aggregates results, and resolves name conflicts.
 */
export class CommandService {
  constructor(
    private readonly loaders: CommandLoader[],
    private readonly logger: Logger
  ) {}
}
```

```typescript
// CORRECT: Simpler class with brief description
/**
 * Validates user input against defined schemas.
 */
export class InputValidator {
  constructor(private readonly schemas: SchemaRegistry) {}
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No class description
export class CommandService {
  constructor(private readonly loaders: CommandLoader[]) {}
}
```

```typescript
// INCORRECT: Description just restates the name
/**
 * A service for commands.
 */
export class CommandService {
  // ...
}
```

**Rationale**: Class documentation explains the class's role in the system, not
just what it is called.

---

## 4. Lookup Tables

### 4.1 JSDoc Tag Reference

| Tag             | Required For                | Purpose                    |
| --------------- | --------------------------- | -------------------------- |
| `@fileoverview` | Complex modules             | Module description         |
| `@param`        | Exported functions          | Parameter description      |
| `@returns`      | Functions with return value | Return description         |
| `@throws`       | Functions that throw        | Error documentation        |
| `@example`      | Complex types               | Usage demonstration        |
| `@template`     | Generic types               | Type parameter description |

### 4.2 Annotation Reference

| Annotation | Format                      | When to Use       |
| ---------- | --------------------------- | ----------------- |
| `TODO`     | `TODO(owner): description`  | Planned work      |
| `FIXME`    | `FIXME(owner): description` | Known bugs        |
| `HACK`     | `HACK: description`         | Workarounds       |
| `NOTE`     | `NOTE: description`         | Important context |

### 4.3 Documentation Requirements by Element

| Element             | Description | @param | @returns | @throws | @example |
| ------------------- | ----------- | ------ | -------- | ------- | -------- |
| Exported function   | MUST        | MUST   | MUST     | SHOULD  | MAY      |
| Private function    | MAY         | MAY    | MAY      | MAY     | MAY      |
| Exported class      | MUST        | N/A    | N/A      | N/A     | MAY      |
| Exported interface  | MUST        | N/A    | N/A      | N/A     | MAY      |
| Exported type alias | MUST        | N/A    | N/A      | N/A     | SHOULD\* |
| Exported enum       | MUST        | N/A    | N/A      | N/A     | MAY      |

\*Complex types SHOULD have @example

---

## 5. Anti-Patterns

### 5.1 Forbidden Patterns

| Pattern                  | Why Forbidden               | Correct Alternative              |
| ------------------------ | --------------------------- | -------------------------------- |
| Repeating types in JSDoc | TypeScript provides types   | Omit type annotations in JSDoc   |
| Commenting obvious code  | Adds noise, becomes stale   | Trust descriptive naming         |
| Empty JSDoc blocks       | Worse than no documentation | Add meaningful content or remove |
| Commented-out code       | Use version control         | Delete and commit                |
| Changelog comments       | Use git history             | Remove, use git log              |

### 5.2 Common Violations

```typescript
// VIOLATION: Type information in JSDoc
/**
 * @param {string} name The user's name.
 * @returns {Promise<User>} The user object.
 */
export async function getUser(name: string): Promise<User> {}

// FIX: Let TypeScript handle types
/**
 * Retrieves a user by their display name.
 * @param name The user's display name.
 * @returns A promise that resolves to the user object.
 */
export async function getUser(name: string): Promise<User> {}
```

```typescript
// VIOLATION: Comment restates the code
// Get the user by id
const user = getUserById(id);

// FIX: Remove unnecessary comment
const user = getUserById(id);
```

```typescript
// VIOLATION: Orphaned TODO
// TODO: fix this

// FIX: Add owner and description
// TODO(jsmith): Handle edge case when input is empty array
```

---

## 6. Decision Flowcharts

### 6.1 Should I Add JSDoc?

```
Is it exported?
├─ Yes:
│   └─ MUST add JSDoc
├─ No:
│   ├─ Is the name self-explanatory?
│   │   ├─ Yes:
│   │   │   └─ MAY skip JSDoc
│   │   └─ No:
│   │       └─ SHOULD add brief JSDoc
```

### 6.2 Should I Add an Inline Comment?

```
Does the code explain WHAT it does?
├─ No:
│   └─ Refactor for clarity first
├─ Yes:
│   ├─ Is there non-obvious WHY?
│   │   ├─ Yes:
│   │   │   └─ Add comment explaining WHY
│   │   └─ No:
│   │       └─ No comment needed
```

### 6.3 Should I Document This Property?

```
Is the property name self-explanatory?
├─ Yes (e.g., email, createdAt):
│   └─ No documentation needed
├─ No (e.g., jitterFactor, ttl):
│   └─ Add brief inline JSDoc
```

---

## 7. Enforcement

### 7.1 ESLint Configuration

```javascript
// eslint.config.js
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    plugins: { jsdoc },
    rules: {
      // Require JSDoc for exported items
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: false,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
          },
          contexts: [
            'ExportNamedDeclaration > FunctionDeclaration',
            'ExportNamedDeclaration > ClassDeclaration',
            'ExportDefaultDeclaration > FunctionDeclaration',
          ],
        },
      ],

      // Require @param and @returns
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',

      // Forbid types in JSDoc (TypeScript handles this)
      'jsdoc/no-types': 'error',

      // Validate JSDoc syntax
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',

      // TODO format
      'no-warning-comments': [
        'warn',
        {
          terms: ['todo', 'fixme'],
          location: 'start',
        },
      ],
    },
  },
];
```

### 7.2 Code Review Checklist

- [ ] All exported functions have JSDoc with @param and @returns
- [ ] All exported classes/interfaces have description
- [ ] No type annotations in JSDoc (TypeScript handles types)
- [ ] Comments explain WHY, not WHAT
- [ ] All TODOs have owner or issue reference
- [ ] No commented-out code
- [ ] Complex types have @example

---

## 8. Exceptions

### 8.1 Valid Exception Scenarios

| Scenario                       | Justification                        | Documentation Required        |
| ------------------------------ | ------------------------------------ | ----------------------------- |
| Generated code                 | Auto-generated, not human-maintained | Comment indicating generation |
| Test files                     | Test names are self-documenting      | None                          |
| Type declaration files (.d.ts) | Types from external sources          | Source reference              |

### 8.2 Exception Documentation Format

```typescript
/**
 * DOCUMENTATION EXCEPTION: STD-008 Rule 3.2.1
 * Reason: Auto-generated from OpenAPI specification.
 * Source: api-spec.yaml
 */
export interface GeneratedApiResponse {
  // ... generated types
}
```

---

## 9. Quick Reference

### 9.1 JSDoc Template for Functions

```typescript
/**
 * [Brief description of what the function does].
 * @param paramName [Description of parameter].
 * @returns [Description of what promise resolves to / return value].
 * @throws ErrorType [When this error is thrown].
 */
```

### 9.2 JSDoc Template for Classes

```typescript
/**
 * [What this class is responsible for].
 *
 * [Additional context about how it works or when to use it].
 */
```

### 9.3 JSDoc Template for Interfaces

```typescript
/**
 * [What this interface represents].
 */
export interface Name {
  /** [Only if property name is not self-explanatory]. */
  propertyName: Type;
}
```

### 9.4 Comment Decision Quick Reference

| Situation               | Action                  |
| ----------------------- | ----------------------- |
| Code is obvious         | No comment              |
| Behavior is non-obvious | Add WHY comment         |
| Algorithm is complex    | Add explanatory comment |
| Workaround for bug      | Add HACK comment        |
| Planned future work     | Add TODO(owner)         |
| Known bug to fix        | Add FIXME(owner)        |

---

## 10. Traceability

### 10.1 Rules Index

| Rule ID | Title                          | Enforcement | Automation |
| ------- | ------------------------------ | ----------- | ---------- |
| 3.1.1   | Module Description             | SHOULD      | Manual     |
| 3.2.1   | Public Functions Require JSDoc | MUST        | ESLint     |
| 3.2.2   | Private Functions - Minimal    | MAY         | Manual     |
| 3.2.3   | Async Function Documentation   | MUST        | ESLint     |
| 3.2.4   | Error Documentation            | SHOULD      | Manual     |
| 3.3.1   | Interface Documentation        | MUST        | ESLint     |
| 3.3.2   | Complex Types with @example    | SHOULD      | Manual     |
| 3.3.3   | Enum Documentation             | MUST        | ESLint     |
| 3.4.1   | Comment Style                  | MUST        | ESLint     |
| 3.4.2   | High-Value Comments Only       | SHOULD      | Review     |
| 3.4.3   | What NOT to Comment            | SHOULD      | Review     |
| 3.5.1   | TODO Format                    | MUST        | ESLint     |
| 3.5.2   | Annotation Types               | SHOULD      | ESLint     |
| 3.6.1   | Public Class Documentation     | MUST        | ESLint     |

### 10.2 Related Standards

| Standard                   | Relationship                     |
| -------------------------- | -------------------------------- |
| STD-001 Naming Conventions | Names should be self-documenting |
| STD-006 Error Handling     | Errors documented with @throws   |
| STD-007 Testing            | Test names are self-documenting  |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
