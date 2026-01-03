# Naming Conventions - Coding Standard

> **Standard ID**: STD-001
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js Projects
> **Enforcement**: Automated + Manual Review
> **Related Documents**:
>
> - [Rule-Based Template](../../templates/99-standards/01-rule-based-template.md)
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md)
> - [Code Style Standard](./02-code-style.md) - Formatting rules

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory naming standards for TypeScript/Node.js codebases. These standards ensure consistency, maintainability, and quality across AI-generated and human-written code. Violations block code review approval.

### 1.2 Scope

**Applies to**:

- All TypeScript/JavaScript source files
- Variable, constant, function, class, interface, type, and enum names
- File and directory names
- API endpoints and event names

**Does NOT apply to**:

- Third-party library code
- Generated code (e.g., protobuf, OpenAPI)
- Legacy code under active migration (must be documented)

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism                                         |
| ---------- | ---------------------------------- | ------------------------------------------------- |
| **MUST**   | Mandatory; violations block merge  | ESLint `@typescript-eslint/naming-convention`, CI |
| **SHOULD** | Recommended; exceptions documented | Code review                                       |
| **MAY**    | Optional                           | Team preference                                   |

---

## 2. Guiding Principles

| Principle            | Description                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| Clarity over brevity | Names must convey full meaning; never sacrifice readability for shorter names       |
| Consistency          | Same patterns across entire codebase; no mixed conventions                          |
| No ambiguity         | Names must have single interpretation in context; avoid overloaded terms            |
| Domain language      | Use terminology from business domain; align with product/technical specifications   |
| Pronounceable        | Names should be readable aloud without confusion                                    |
| No redundant context | Avoid repeating information already provided by type, namespace, or enclosing scope |

---

## 3. Rules

### 3.1 Variables & Constants

#### Rule 3.1.1: Local Variable Casing

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | All local variables                           |

**Rule Statement**:
Local variables SHALL use `camelCase` so that they are visually distinct from classes and constants.

**Correct Examples**:

```typescript
// CORRECT: camelCase with descriptive names
const userEmailAddress = 'user@example.com';
const retryAttemptCount = 3;
const requestTimeoutMilliseconds = 5000;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Abbreviated names
const email = 'user@example.com'; // Too short, ambiguous
const usrEmail = 'user@example.com'; // Abbreviated
const cnt = 3; // Cryptic abbreviation
const timeoutMs = 5000; // Abbreviated unit
```

**Rationale**:
Full descriptive names eliminate ambiguity and reduce cognitive load when reading code. AI agents require explicit context to generate consistent code.

---

#### Rule 3.1.2: Boolean Variable Prefixes

| Attribute       | Value                 |
| --------------- | --------------------- |
| **Enforcement** | MUST                  |
| **Automation**  | ESLint custom rule    |
| **Applies to**  | All boolean variables |

**Rule Statement**:
Boolean variables SHALL use one of the mandatory prefixes (`is*`, `has*`, `can*`, `should*`) so that their boolean nature is immediately apparent.

**Prefix Vocabulary**:

| Prefix    | Purpose                 | Examples                                      |
| --------- | ----------------------- | --------------------------------------------- |
| `is*`     | State or condition      | `isActive`, `isValid`, `isLoading`            |
| `has*`    | Existence check         | `hasError`, `hasPermission`, `hasData`        |
| `can*`    | Capability check        | `canEdit`, `canRetry`, `canProceed`           |
| `should*` | Decision/recommendation | `shouldRetry`, `shouldValidate`, `shouldSkip` |

**Correct Examples**:

```typescript
// CORRECT: Boolean prefixes clearly indicate type
const isAuthenticationEnabled = true;
const hasValidCredentials = user.token !== null;
const canRetryRequest = attemptCount < MAX_RETRIES;
const shouldSkipValidation = isTestMode;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing boolean prefix
const authEnabled = true; // Missing 'is' prefix
const valid = true; // Ambiguous, missing prefix
const retry = attemptCount < 3; // Could be boolean or action
const skip = isTestMode; // Ambiguous
```

**Rationale**:
Boolean prefixes make conditional logic self-documenting and prevent type confusion.

---

#### Rule 3.1.3: Module-Level Constants

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | Module-level `const` declarations             |

**Rule Statement**:
Module-level constants SHALL use `UPPER_SNAKE_CASE` and SHALL include units in the name when applicable.

**Correct Examples**:

```typescript
// CORRECT: UPPER_SNAKE_CASE with units
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = 'https://api.example.com';
const CACHE_EXPIRATION_SECONDS = 3600;
const MIN_PASSWORD_LENGTH = 8;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong casing or missing units
const maxRetries = 3; // Should be UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000; // Missing unit (ms)
const apiBaseUrl = '...'; // Should be UPPER_SNAKE_CASE
```

**Rationale**:
UPPER_SNAKE_CASE visually distinguishes immutable module-level values from mutable variables. Including units prevents unit confusion bugs.

---

#### Rule 3.1.4: Allowed Abbreviations

| Attribute       | Value           |
| --------------- | --------------- |
| **Enforcement** | MUST            |
| **Automation**  | Manual review   |
| **Applies to**  | All identifiers |

**Rule Statement**:
Identifiers SHALL NOT use abbreviations EXCEPT for the universally accepted terms listed below.

**Allowed Abbreviations**:

| Abbreviation | Meaning                           |
| ------------ | --------------------------------- |
| `id`         | Identifier                        |
| `db`         | Database                          |
| `url`        | Uniform Resource Locator          |
| `http`       | Hypertext Transfer Protocol       |
| `api`        | Application Programming Interface |
| `json`       | JavaScript Object Notation        |
| `xml`        | Extensible Markup Language        |
| `html`       | Hypertext Markup Language         |
| `css`        | Cascading Style Sheets            |
| `jwt`        | JSON Web Token                    |
| `uuid`       | Universally Unique Identifier     |

**Correct Examples**:

```typescript
// CORRECT: Using allowed abbreviations
const userId = '12345';
const apiBaseUrl = 'https://...';
const jwtToken = 'eyJ...';
```

**Incorrect Examples**:

```typescript
// INCORRECT: Non-allowed abbreviations
const usr = getUser();             // Use 'user'
const cfg = loadConfig();          // Use 'config' or 'configuration'
const msg = 'Hello';               // Use 'message'
const btn = document.querySelector(); // Use 'button'
const req = fetch(...);            // Use 'request'
const res = await req;             // Use 'response'
```

**Rationale**:
Consistent abbreviation rules eliminate ambiguity about when abbreviations are acceptable.

---

#### Rule 3.1.5: Destructuring

| Attribute       | Value                                   |
| --------------- | --------------------------------------- |
| **Enforcement** | SHOULD                                  |
| **Automation**  | Manual review                           |
| **Applies to**  | Destructured parameters and assignments |

**Rule Statement**:
Destructured properties SHOULD maintain original property names. Renaming SHOULD only occur for scope disambiguation.

**Correct Examples**:

```typescript
// CORRECT: Maintain original names
function processUser({ userId, emailAddress }: UserInput) {
  // Use original names directly
  console.log(userId, emailAddress);
}

// CORRECT: Rename only when necessary for collision avoidance
function mergeConfigs(
  { timeout: primaryTimeout }: PrimaryConfig,
  { timeout: fallbackTimeout }: FallbackConfig
) {
  return primaryTimeout ?? fallbackTimeout;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Unnecessary renaming
function processUser({ userId: id, emailAddress: email }: UserInput) {
  // Renamed without collision reason
}

// INCORRECT: Cryptic renamed variables
function mergeConfigs({ timeout: t1 }: PrimaryConfig, { timeout: t2 }: FallbackConfig) {}
```

**Rationale**:
Maintaining original property names preserves traceability between data structures and their usage.

---

### 3.2 Functions & Methods

#### Rule 3.2.1: Function Naming Pattern

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | MUST                      |
| **Automation**  | Manual review             |
| **Applies to**  | All functions and methods |

**Rule Statement**:
Functions SHALL use `camelCase` and SHALL begin with an action verb from the approved vocabulary.

**Approved Verb Vocabulary**:

| Verb          | Purpose                            | Example                    |
| ------------- | ---------------------------------- | -------------------------- |
| `get*`        | Retrieve data without side effects | `getUserById()`            |
| `set*`        | Update state or assign value       | `setActiveStatus()`        |
| `create*`     | Factory pattern or new instance    | `createUserSession()`      |
| `load*`       | Retrieve from external source      | `loadConfiguration()`      |
| `save*`       | Persist to external storage        | `saveUserPreferences()`    |
| `register*`   | Add to registry                    | `registerEventHandler()`   |
| `unregister*` | Remove from registry               | `unregisterEventHandler()` |
| `add*`        | Add to collection                  | `addItemToCart()`          |
| `remove*`     | Remove from collection             | `removeItemFromCart()`     |
| `check*`      | Validate without throwing          | `checkPermissions()`       |
| `validate*`   | Validate with potential throw      | `validateInput()`          |
| `execute*`    | Run command or action              | `executeCommand()`         |
| `handle*`     | Process event or callback          | `handleUserInput()`        |
| `on*`         | Register event callback            | `onWorkflowComplete()`     |
| `parse*`      | Transform input to structure       | `parseConfigFile()`        |
| `build*`      | Construct complex object           | `buildQueryString()`       |
| `process*`    | Transform through pipeline         | `processPayment()`         |
| `initialize*` | One-time setup                     | `initializeApplication()`  |
| `ensure*`     | Guarantee condition                | `ensureDirectoryExists()`  |
| `enable*`     | Enable feature                     | `enableDarkMode()`         |
| `disable*`    | Disable feature                    | `disableDarkMode()`        |
| `wait*`       | Async wait operation               | `waitForConnection()`      |
| `cancel*`     | Cancel operation                   | `cancelRequest()`          |
| `list*`       | Enumerate collection items         | `listWorkflows()`          |
| `resolve*`    | Lookup or dereference              | `resolveCommand()`         |
| `clear*`      | Remove or reset state              | `clearCredentials()`       |
| `discover*`   | Find resources dynamically         | `discoverPlugins()`        |
| `merge*`      | Combine multiple inputs            | `mergeConfigurations()`    |

**Correct Examples**:

```typescript
// CORRECT: Verb + noun pattern
function getUserById(userId: string): Promise<User> {}
function validateEmailAddress(email: string): boolean {}
function processPaymentTransaction(payment: Payment): Promise<Result> {}
function ensureDirectoryExists(path: string): void {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing verb or wrong pattern
function user(id: string): User {} // Missing verb
function emailValidation(email: string) {} // Noun, not verb
function doProcess(data: any) {} // Vague verb 'do'
function makeItWork() {} // Non-descriptive
```

**Rationale**:
Verb-first naming makes function purpose immediately clear and enables IDE autocomplete by action.

---

#### Rule 3.2.2: Boolean Query Methods

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | MUST                      |
| **Automation**  | Manual review             |
| **Applies to**  | Methods returning boolean |

**Rule Statement**:
Methods that return boolean SHALL use the prefixes `is*`, `has*`, `can*`, or `should*`.

**Correct Examples**:

```typescript
// CORRECT: Boolean method prefixes
function isValidEmail(email: string): boolean {}
function hasPermission(user: User, action: Action): boolean {}
function canRetryCommand(attempt: number): boolean {}
function shouldCacheResult(size: number): boolean {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing boolean prefix
function validEmail(email: string): boolean {} // Use 'isValidEmail'
function checkAdmin(user: User): boolean {} // Use 'isAdmin'
function permissionGranted(): boolean {} // Use 'hasPermission'
```

**Rationale**:
Boolean prefixes on methods match the convention for boolean variables, creating consistency.

---

#### Rule 3.2.3: Async Function Naming

| Attribute       | Value              |
| --------------- | ------------------ |
| **Enforcement** | MUST NOT           |
| **Automation**  | ESLint custom rule |
| **Applies to**  | Async functions    |

**Rule Statement**:
Async functions SHALL NOT include "Async" suffix; async nature is implicit from `Promise` return type.

**Correct Examples**:

```typescript
// CORRECT: No Async suffix
async function loadUserProfile(userId: string): Promise<UserProfile> {}
async function saveDocument(doc: Document): Promise<void> {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Redundant Async suffix
async function loadUserProfileAsync(userId: string): Promise<UserProfile> {}
async function saveDocumentAsync(doc: Document): Promise<void> {}
```

**Rationale**:
The `Promise` return type and `async` keyword already indicate async behavior; suffix is redundant.

**Async Generators**:

Async generator functions follow the same naming convention (camelCase, verb-first, no special suffix):

```typescript
// CORRECT: Async generators use standard naming
async *streamEvents(): AsyncGenerator<ServerEvent> { }
async *acceptUserMessage(signal: AbortSignal): AsyncGenerator<StreamEvent> { }
async *processItemBatch(items: Item[]): AsyncGenerator<ProcessedItem> { }
```

**Event Handler Registration**:

Use `on*` prefix for methods that register callbacks (as opposed to `handle*` which processes events):

```typescript
// CORRECT: on* for registration, handle* for processing
onWorkflowComplete(callback: () => void): void { }      // Registers callback
onMessageReceived(handler: MessageHandler): void { }    // Registers handler

handleWorkflowComplete(): void { }                      // Processes the event
handleMessageReceived(message: Message): void { }       // Processes message
```

---

#### Rule 3.2.4: Type Guard Functions

| Attribute       | Value                |
| --------------- | -------------------- |
| **Enforcement** | MUST                 |
| **Automation**  | Manual review        |
| **Applies to**  | Type guard functions |

**Rule Statement**:
Type guard functions SHALL use `is*` prefix and SHALL return `value is Type`.

**Correct Examples**:

```typescript
// CORRECT: Type guard pattern
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function isRetryableError(error: Error): error is RetryableError {
  return 'retryAfter' in error;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong naming or return type
function checkApiError(error: unknown): boolean {} // Use 'is' prefix
function apiErrorGuard(error: unknown): error is ApiError {} // Use 'is' prefix
```

**Rationale**:
Consistent type guard naming makes type narrowing code predictable and discoverable.

---

#### Rule 3.2.5: Private Methods

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | Private class methods                         |

**Rule Statement**:
Private methods SHALL use underscore prefix AND the `private` keyword.

**Correct Examples**:

```typescript
// CORRECT: Underscore prefix with private keyword
class TaskManager {
  private _registerToolCall(id: string): void {}
  private _resolveToolCall(id: string): void {}
  private _resetCompletionPromise(): void {}
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing underscore or private keyword
class TaskManager {
  private registerToolCall(id: string): void {} // Missing underscore
  _registerToolCall(id: string): void {} // Missing private keyword
}
```

**Rationale**:
Double indication (underscore + keyword) makes private methods visually distinct and prevents accidental external access.

---

### 3.3 Classes

#### Rule 3.3.1: Class Naming Convention

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | All class declarations                        |

**Rule Statement**:
Classes SHALL use `PascalCase` and SHALL be noun or noun phrases. Classes SHALL NEVER use verb names.

**Correct Examples**:

```typescript
// CORRECT: PascalCase nouns
class UserAccount {}
class PaymentProcessor {}
class ConfigurationManager {}
class HttpClient {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Verb names or wrong casing
class ProcessPayment {} // Verb - should be PaymentProcessor
class HandleRequest {} // Verb - should be RequestHandler
class userAccount {} // Wrong casing
class user_account {} // Wrong casing
```

**Rationale**:
Classes represent things (nouns), not actions (verbs). PascalCase distinguishes classes from variables.

---

#### Rule 3.3.2: Role-Based Class Suffixes

| Attribute       | Value                           |
| --------------- | ------------------------------- |
| **Enforcement** | MUST                            |
| **Automation**  | Manual review                   |
| **Applies to**  | All classes with specific roles |

**Rule Statement**:
Classes SHALL use appropriate role-based suffixes that indicate their responsibility.

**Role Suffix Vocabulary**:

| Suffix       | Purpose                        | State     | Example                                      |
| ------------ | ------------------------------ | --------- | -------------------------------------------- |
| `*Service`   | Stateless business logic       | None      | `FileSystemService`, `AuthenticationService` |
| `*Manager`   | Resource lifecycle management  | May have  | `SessionManager`, `ConnectionManager`        |
| `*Registry`  | Store and retrieve items       | Has state | `ToolRegistry`, `AgentRegistry`              |
| `*Client`    | External service communication | None      | `HttpClient`, `McpClient`                    |
| `*Loader`    | Load resources from storage    | None      | `ConfigLoader`, `ExtensionLoader`            |
| `*Scheduler` | Schedule or queue operations   | Has state | `TaskScheduler`, `JobScheduler`              |
| `*Executor`  | Execute commands or tasks      | None      | `CommandExecutor`, `WorkflowExecutor`        |
| `*Factory`   | Create instances               | None      | `ConnectionFactory`, `SessionFactory`        |
| `*Handler`   | Handle events or requests      | None      | `ErrorHandler`, `RequestHandler`             |
| `*Validator` | Validate data                  | None      | `SchemaValidator`, `InputValidator`          |
| `*Builder`   | Construct complex objects      | Temporary | `QueryBuilder`, `RequestBuilder`             |
| `*Resolver`  | Resolve references or lookups  | None      | `PathResolver`, `DependencyResolver`         |

**Correct Examples**:

```typescript
// CORRECT: Role suffix matches responsibility
class UserAuthenticationService {} // Stateless auth logic
class ConnectionManager {} // Manages connection lifecycle
class PluginRegistry {} // Stores/retrieves plugins
class JiraClient {} // Communicates with Jira API
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong or missing suffix
class UserAuthenticationManager {} // Stateless logic, should be Service
class ConnectionService {} // Manages lifecycle, should be Manager
class Plugins {} // Missing role suffix
```

**Rationale**:
Role suffixes communicate class responsibility at a glance and enforce single-responsibility principle.

---

### 3.4 Interfaces & Types

#### Rule 3.4.1: Interface Naming

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | All interface declarations                    |

**Rule Statement**:
Interfaces SHALL use `PascalCase` and SHALL NOT use "I" prefix.

**Correct Examples**:

```typescript
// CORRECT: PascalCase without I prefix
interface User {}
interface PaymentGateway {}
interface ConfigurationOptions {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: I prefix
interface IUser {}
interface IPaymentGateway {}
interface IConfigurationOptions {}
```

**Rationale**:
TypeScript convention discourages Hungarian notation. The "I" prefix adds noise without value.

---

#### Rule 3.4.2: Type Alias Naming

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | Type aliases                                  |

**Rule Statement**:
Type aliases SHALL use `PascalCase`.

**Correct Examples**:

```typescript
// CORRECT: PascalCase type aliases
type Result<T> = Success<T> | Failure;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Coordinate = [number, number];
type UserId = string;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong casing
type httpMethod = 'GET' | 'POST';
type user_id = string;
```

---

#### Rule 3.4.3: Generic Type Parameters

| Attribute       | Value                   |
| --------------- | ----------------------- |
| **Enforcement** | MUST                    |
| **Automation**  | Manual review           |
| **Applies to**  | Generic type parameters |

**Rule Statement**:
Simple generics SHALL use single uppercase letters (`T`, `K`, `V`, `E`, `R`). Complex generics SHALL use descriptive names with `T` prefix.

**Correct Examples**:

```typescript
// CORRECT: Simple generics
function identity<T>(value: T): T {
  return value;
}
type Map<K, V> = { key: K; value: V };

// CORRECT: Complex generics with T prefix
function transform<TInput, TOutput>(
  input: TInput,
  transformer: (value: TInput) => TOutput
): TOutput {
  return transformer(input);
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Descriptive name without T prefix
function transform<Input, Output>(input: Input): Output {} // Use TInput, TOutput
```

---

#### Rule 3.4.4: Data Structure Suffixes

| Attribute       | Value                          |
| --------------- | ------------------------------ |
| **Enforcement** | MUST                           |
| **Automation**  | Manual review                  |
| **Applies to**  | Interface and type definitions |

**Rule Statement**:
Data structures SHALL use appropriate suffixes that indicate their purpose.

**Suffix Vocabulary**:

| Suffix             | Purpose                       | Example                                      |
| ------------------ | ----------------------------- | -------------------------------------------- |
| `*Config`          | System/internal configuration | `ModelConfig`, `ToolConfig`                  |
| `*Settings`        | User-configurable options     | `AccessibilitySettings`, `TelemetrySettings` |
| `*Options`         | Function/method parameters    | `RetryOptions`, `FilterOptions`              |
| `*Params`          | Tool/command parameters       | `EditToolParams`, `ShellToolParams`          |
| `*Info`            | Read-only descriptive data    | `SessionInfo`, `ToolCallInfo`                |
| `*Details`         | Detailed supplementary info   | `ToolConfirmationDetails`, `UsageDetails`    |
| `*Result`          | Operation outcomes            | `ToolResult`, `ValidationResult`             |
| `*State`           | Mutable application state     | `UIState`, `TaskState`                       |
| `*Context`         | Execution/runtime context     | `CommandContext`, `HookContext`              |
| `*Definition`      | Schema/type definitions       | `AgentDefinition`, `HookDefinition`          |
| `*Entry`           | Single collection item        | `LogEntry`, `RegistryEntry`                  |
| `*Record`          | Persistent data records       | `ConversationRecord`, `ToolCallRecord`       |
| `*Payload`         | Event data carrier            | `UserFeedbackPayload`, `ErrorPayload`        |
| `*Request`         | API/service requests          | `ToolConfirmationRequest`                    |
| `*Response`        | API/service responses         | `ToolConfirmationResponse`                   |
| `*Input`/`*Output` | Hook/transform I/O            | `BeforeToolInput`, `BeforeToolOutput`        |
| `*Event`           | Event types                   | `MessageEvent`, `ErrorEvent`                 |
| `*Error`           | Error structures              | `ValidationError`, `ApiError`                |
| `*Snapshot`        | Point-in-time state           | `ModelAvailabilitySnapshot`                  |
| `*Metadata`        | Entity metadata               | `TaskMetadata`, `SpanMetadata`               |

**Anti-pattern Suffixes (AVOID)**:

| Avoid            | Use Instead             |
| ---------------- | ----------------------- |
| `*Data`          | `*Info` or `*Record`    |
| `*Object`        | Specific role suffix    |
| `*ConfigOptions` | `*Config` OR `*Options` |

---

#### Rule 3.4.5: Zod Schema Naming

| Attribute       | Value                  |
| --------------- | ---------------------- |
| **Enforcement** | MUST                   |
| **Automation**  | Manual review          |
| **Applies to**  | Zod schema definitions |

**Rule Statement**:
Zod schema variables SHALL use `camelCase` with `Schema` suffix. Inferred types SHALL use `PascalCase` matching the schema name without suffix.

**Correct Examples**:

```typescript
// CORRECT: Schema variable and inferred type
const userSchema = z.object({ id: z.string(), email: z.string() });
type User = z.infer<typeof userSchema>;

const writeTextFileRequestSchema = z.object({ path: z.string(), content: z.string() });
type WriteTextFileRequest = z.infer<typeof writeTextFileRequestSchema>;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Missing Schema suffix or wrong type name
const user = z.object({ id: z.string() }); // Missing Schema suffix
const UserSchema = z.object({ id: z.string() }); // Should be camelCase
type UserSchemaType = z.infer<typeof userSchema>; // Redundant 'Schema' in type
```

---

#### Rule 3.4.6: Discriminated Unions

| Attribute       | Value                                 |
| --------------- | ------------------------------------- |
| **Enforcement** | MUST                                  |
| **Automation**  | Manual review                         |
| **Applies to**  | Union types with shared discriminator |

**Rule Statement**:
Discriminated union types SHALL use `type` or `status` property as the discriminator field.

**Correct Examples**:

```typescript
// CORRECT: Using 'status' as discriminator
type TaskState =
  | { status: 'pending'; createdAt: Date }
  | { status: 'running'; startedAt: Date; progress: number }
  | { status: 'completed'; completedAt: Date; result: unknown }
  | { status: 'failed'; failedAt: Date; error: Error };

// CORRECT: Using 'type' as discriminator
type ServerEvent =
  | { type: 'content'; value: string }
  | { type: 'error'; value: ErrorValue }
  | { type: 'finished'; timestamp: Date };
```

**Incorrect Examples**:

```typescript
// INCORRECT: Non-standard discriminator names
type TaskState =
  | { kind: 'pending'; createdAt: Date } // Use 'type' or 'status', not 'kind'
  | { state: 'running'; startedAt: Date }; // Inconsistent discriminator
```

**Rationale**:
Consistent discriminator naming (`type` or `status`) makes pattern matching predictable and enables IDE support.

---

#### Rule 3.4.7: Hook Return Types

| Attribute       | Value                                     |
| --------------- | ----------------------------------------- |
| **Enforcement** | SHOULD                                    |
| **Automation**  | Manual review                             |
| **Applies to**  | React custom hook return type definitions |

**Rule Statement**:
Custom hook return types SHOULD use the `Use*Return` pattern matching the hook name.

**Correct Examples**:

```typescript
// CORRECT: Use*Return pattern
interface UseSelectionListReturn<T> {
  items: T[];
  selectedIndex: number;
  select: (index: number) => void;
}

interface UseInputHistoryReturn {
  history: string[];
  addEntry: (entry: string) => void;
  clear: () => void;
}

// Usage
function useSelectionList<T>(items: T[]): UseSelectionListReturn<T> {}
function useInputHistory(): UseInputHistoryReturn {}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong naming patterns
interface SelectionListHookResult<T> {} // Should be UseSelectionListReturn
interface IUseSelectionList<T> {} // No I prefix, use Return suffix
type SelectionListReturn<T> = {}; // Missing 'Use' prefix
```

**Rationale**:
The `Use*Return` pattern creates a clear naming convention that links return types to their hooks.

---

### 3.5 Enums

#### Rule 3.5.1: Enum Naming Convention

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | ESLint `@typescript-eslint/naming-convention` |
| **Applies to**  | All enum declarations                         |

**Rule Statement**:
Enum names SHALL use `PascalCase`. Enum members SHALL use `UPPER_SNAKE_CASE`.

**Correct Examples**:

```typescript
// CORRECT: PascalCase enum, UPPER_SNAKE_CASE members
export enum HttpStatusCode {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export enum ToolErrorType {
  FILE_NOT_FOUND = 'file_not_found',
  PERMISSION_DENIED = 'permission_denied',
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong casing
enum httpStatusCode {} // Should be PascalCase
enum HttpStatusCode {
  Ok = 200, // Should be UPPER_SNAKE_CASE
  notFound = 404, // Should be UPPER_SNAKE_CASE
}
```

---

#### Rule 3.5.2: Enum String Values

| Attribute       | Value              |
| --------------- | ------------------ |
| **Enforcement** | SHOULD             |
| **Automation**  | Manual review      |
| **Applies to**  | String enum values |

**Rule Statement**:
String enum values SHOULD use `snake_case` or `UPPER_SNAKE_CASE` for consistency with common conventions.

**Correct Examples**:

```typescript
// CORRECT: snake_case values
export enum ToolErrorType {
  FILE_NOT_FOUND = 'file_not_found',
  PERMISSION_DENIED = 'permission_denied',
}

// CORRECT: UPPER_SNAKE_CASE values (alternative)
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  ERROR = 'ERROR',
}
```

---

#### Rule 3.5.3: Literal Union Types

| Attribute       | Value                      |
| --------------- | -------------------------- |
| **Enforcement** | MUST                       |
| **Automation**  | Manual review              |
| **Applies to**  | String literal union types |

**Rule Statement**:
Literal union types SHALL use `type` alias with lowercase string values for consistency.

**Correct Examples**:

```typescript
// CORRECT: Lowercase literal values
type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type Environment = 'development' | 'staging' | 'production';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

**Incorrect Examples**:

```typescript
// INCORRECT: Uppercase or mixed case
type HttpMethod = 'GET' | 'POST' | 'PUT'; // Should be lowercase
type Environment = 'Development' | 'Staging'; // Should be lowercase
```

**Rationale**:
Lowercase literal unions are consistent with common JavaScript/TypeScript conventions and easier to type.

---

### 3.6 Files & Directories

#### Rule 3.6.1: TypeScript File Naming

| Attribute       | Value                       |
| --------------- | --------------------------- |
| **Enforcement** | MUST                        |
| **Automation**  | CI lint script              |
| **Applies to**  | All TypeScript source files |

**Rule Statement**:
TypeScript source files SHALL use `camelCase.ts`. React component files SHALL use `PascalCase.tsx`.

**File Type Conventions**:

| File Type         | Convention     | Example               |
| ----------------- | -------------- | --------------------- |
| TypeScript source | camelCase.ts   | `userService.ts`      |
| React components  | PascalCase.tsx | `UserProfile.tsx`     |
| Test files        | \*.test.ts     | `userService.test.ts` |
| Type definitions  | \*.d.ts        | `global.d.ts`         |

**Correct Examples**:

```
src/
  services/
    userService.ts         # camelCase for regular TS
    authenticationService.ts
  components/
    UserProfile.tsx        # PascalCase for React
    NavigationBar.tsx
  types/
    user.d.ts             # Type definitions
```

**Incorrect Examples**:

```
src/
  services/
    UserService.ts         # Wrong: should be camelCase
    user-service.ts        # Wrong: should be camelCase
  components/
    userProfile.tsx        # Wrong: should be PascalCase
```

---

#### Rule 3.6.2: Directory Naming

| Attribute       | Value           |
| --------------- | --------------- |
| **Enforcement** | MUST            |
| **Automation**  | CI lint script  |
| **Applies to**  | All directories |

**Rule Statement**:
Directories SHALL use `kebab-case` and SHALL use plural nouns for collections.

**Correct Examples**:

```
src/
  user-services/          # kebab-case
  shared-components/      # kebab-case
  api-clients/           # kebab-case, plural
  utils/                 # plural
```

**Incorrect Examples**:

```
src/
  userServices/           # Wrong: should be kebab-case
  SharedComponents/       # Wrong: should be lowercase
  api_clients/           # Wrong: should be kebab-case
  util/                  # Wrong: should be plural
```

---

### 3.7 Events & Telemetry

#### Rule 3.7.1: Event Enum Naming

| Attribute       | Value                  |
| --------------- | ---------------------- |
| **Enforcement** | MUST                   |
| **Automation**  | Manual review          |
| **Applies to**  | Event enum definitions |

**Rule Statement**:
Event enum members SHALL use `PascalCase` with `kebab-case` string values. Domain-specific enums SHALL use short member names (domain is implied by enum name).

**Correct Examples**:

```typescript
// CORRECT: Domain-specific enums with short member names (preferred)
export enum AgentEvent {
  Created = 'agent-created',
  Started = 'agent-started',
  Completed = 'agent-completed',
  Terminated = 'agent-terminated',
}

export enum WorkflowEvent {
  Started = 'workflow-started',
  Completed = 'workflow-completed',
  Failed = 'workflow-failed',
  Paused = 'workflow-paused',
}

// Usage: AgentEvent.Created, WorkflowEvent.Started
// Domain is in the enum name, not repeated in member
```

```typescript
// CORRECT: General-purpose enums with full member names
export enum CoreEvent {
  UserFeedback = 'user-feedback',
  ModelChanged = 'model-changed',
  FallbackModeChanged = 'fallback-mode-changed',
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong casing patterns
export enum CoreEvent {
  USER_FEEDBACK = 'user-feedback', // Member should be PascalCase
  userFeedback = 'user_feedback', // Both wrong
}

// INCORRECT: Redundant domain prefix in member name
export enum AgentEvent {
  AgentCreated = 'agent-created', // Redundant: AgentEvent.AgentCreated
  AgentStarted = 'agent-started', // Use: AgentEvent.Created instead
}
```

**Rationale**:
Domain-specific enums avoid redundancy (`AgentEvent.Created` not `AgentEvent.AgentCreated`). The enum name provides the domain context; member names describe the action within that domain.

---

#### Rule 3.7.2: Telemetry Event Constants

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | MUST                      |
| **Automation**  | Manual review             |
| **Applies to**  | Telemetry event constants |

**Rule Statement**:
Telemetry event constants SHALL use `SCREAMING_SNAKE_CASE` variable names with `dot.snake_case` string values.

**Correct Examples**:

```typescript
// CORRECT: SCREAMING_SNAKE_CASE constant = dot.snake_case value
export const EVENT_TOOL_CALL = 'app.tool_call';
export const EVENT_API_REQUEST = 'app.api_request';
export const EVENT_AGENT_START = 'app.agent.start';
export const EVENT_AGENT_FINISH = 'app.agent.finish';
```

---

#### Rule 3.7.3: Event vs Command Naming

| Attribute       | Value                        |
| --------------- | ---------------------------- |
| **Enforcement** | MUST                         |
| **Automation**  | Manual review                |
| **Applies to**  | Event and command type names |

**Rule Statement**:
Event names SHALL follow these patterns based on event type:

- **State change events**: Past tense (something happened)
- **Content/data events**: Nouns describing what is carried
- **Command names**: Imperative (do something)

**Naming Pattern**:

| Type               | Pattern              | When to Use               | Example                                              |
| ------------------ | -------------------- | ------------------------- | ---------------------------------------------------- |
| State Change Event | `<Entity><PastVerb>` | Entity state changed      | `AgentCreated`, `WorkflowCompleted`, `SessionClosed` |
| Content/Data Event | `<ContentType>`      | Streaming data or content | `StreamChunk`, `ToolResult`, `ConsoleOutput`         |
| Command            | `<Verb><Entity>`     | Request to perform action | `CreateUser`, `StartWorkflow`, `CancelExecution`     |

**Correct Examples**:

```typescript
// CORRECT: State change events use past tense
export enum AgentEvent {
  Created = 'agent-created', // State changed: agent now exists
  Started = 'agent-started', // State changed: agent now running
  Completed = 'agent-completed', // State changed: agent now done
  Terminated = 'agent-terminated', // State changed: agent now terminated
}

// CORRECT: Content/data events use nouns
export enum StreamEvent {
  Chunk = 'stream-chunk', // Content: a chunk of streamed data
  Thinking = 'stream-thinking', // Content: thinking/reasoning output
}

export enum ToolEvent {
  Use = 'tool-use', // Content: tool invocation details
  Result = 'tool-result', // Content: tool execution result
}

// CORRECT: Commands use imperative
type CreateUserCommand = { type: 'CreateUser'; name: string };
type StartWorkflowCommand = { type: 'StartWorkflow'; workflowId: string };
```

**Incorrect Examples**:

```typescript
// INCORRECT: State change event without past tense
export enum AgentEvent {
  Create = 'agent-create', // Should be Created (past tense)
  Start = 'agent-start', // Should be Started (past tense)
}

// INCORRECT: Content event with unnecessary past tense
export enum StreamEvent {
  ChunkReceived = 'stream-chunk-received', // Overly verbose, use Chunk
  ThinkingEmitted = 'stream-thinking-emitted', // Use Thinking
}

// INCORRECT: Command with past tense
type UserCreatedCommand = {}; // Should be CreateUserCommand
```

**Decision Guide**:

```
Is this event about...
├─ A state transition? (entity changed from X to Y)
│   └─ Use past tense: Created, Started, Completed, Failed, Paused
├─ Content being produced or streamed?
│   └─ Use noun: Chunk, Output, Result, Feedback, Thinking
└─ A request to do something?
    └─ Use imperative (command): Create, Start, Cancel, Process
```

**Rationale**:
State change events describe facts that already happened (past tense). Content events describe what is being delivered (nouns). This distinction makes event semantics immediately clear from the name.

---

#### Rule 3.7.4: Typed Event Emitter Pattern

| Attribute       | Value                          |
| --------------- | ------------------------------ |
| **Enforcement** | SHOULD                         |
| **Automation**  | Manual review                  |
| **Applies to**  | Event emitter type definitions |

**Rule Statement**:
Typed event emitters SHOULD use an event map interface with event enum keys and payload tuple values.

**Correct Examples**:

```typescript
// CORRECT: Event map interface
interface CoreEvents {
  [CoreEvent.UserFeedback]: [UserFeedbackPayload];
  [CoreEvent.ModelChanged]: [ModelChangedPayload];
  [CoreEvent.ExternalEditorClosed]: never[]; // No payload
}

// CORRECT: Discriminated union for stream events
type ServerContentEvent = { type: 'content'; value: string };
type ServerErrorEvent = { type: 'error'; value: ErrorValue };
type ServerFinishedEvent = { type: 'finished'; timestamp: Date };
type ServerStreamEvent = ServerContentEvent | ServerErrorEvent | ServerFinishedEvent;
```

**Rationale**:
Typed event emitters provide compile-time safety for event payloads and enable IDE autocomplete.

---

### 3.8 Error Handling

#### Rule 3.8.1: Error Class Naming

| Attribute       | Value                |
| --------------- | -------------------- |
| **Enforcement** | MUST                 |
| **Automation**  | Manual review        |
| **Applies to**  | Custom error classes |

**Rule Statement**:
Error classes SHALL use `*Error` suffix. Fatal errors requiring exit codes SHALL use `Fatal*Error` prefix.

**Correct Examples**:

```typescript
// CORRECT: Standard error classes
class ValidationError extends Error {
  name = 'ValidationError';
}
class NotFoundError extends Error {
  name = 'NotFoundError';
}
class CanceledError extends Error {
  name = 'CanceledError';
}

// CORRECT: Fatal errors with exit codes
class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = 'FatalError';
  }
}

class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}

class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
  }
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong naming patterns
class ValidationException extends Error {} // Use 'Error' suffix, not 'Exception'
class AuthFailed extends Error {} // Use 'AuthenticationError'
class ERR_AUTH_001 extends Error {} // Don't use error codes as class names
```

**Rationale**:
Class hierarchy is preferred over string error codes for type-safe error handling.

---

#### Rule 3.8.2: Error Class Hierarchy

| Attribute       | Value                   |
| --------------- | ----------------------- |
| **Enforcement** | MUST                    |
| **Automation**  | Manual review           |
| **Applies to**  | Error class inheritance |

**Rule Statement**:
Error classes SHALL use class hierarchy with a base `FatalError` class for exit-code errors. String error codes like `ERR_XX_001` SHALL NOT be used.

**Correct Examples**:

```typescript
// CORRECT: Base fatal error with exit code
class FatalError extends Error {
  constructor(
    message: string,
    readonly exitCode: number
  ) {
    super(message);
    this.name = 'FatalError';
  }
}

// CORRECT: Specific fatal errors with fixed exit codes
class FatalAuthenticationError extends FatalError {
  constructor(message: string) {
    super(message, 41);
  }
}
class FatalConfigError extends FatalError {
  constructor(message: string) {
    super(message, 52);
  }
}
class FatalToolExecutionError extends FatalError {
  constructor(message: string) {
    super(message, 54);
  }
}
class FatalCancellationError extends FatalError {
  constructor(message: string) {
    super(message, 130);
  } // SIGINT
}

// CORRECT: Simple categorized errors
class ValidationError extends Error {
  name = 'ValidationError';
}
class NotFoundError extends Error {
  name = 'NotFoundError';
}
class CanceledError extends Error {
  name = 'CanceledError';
}
class ForbiddenError extends Error {
  name = 'ForbiddenError';
}
class UnauthorizedError extends Error {
  name = 'UnauthorizedError';
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: String error codes
const ERR_VAL_001 = 'ERR_VAL_001';
const ERR_AUTH_002 = 'ERR_AUTH_002';
throw new Error(ERR_VAL_001); // Not type-safe
```

**Rationale**:
Class hierarchy enables `instanceof` checks and TypeScript type narrowing, unlike string codes.

---

#### Rule 3.8.3: Error Type Enums

| Attribute       | Value                                 |
| --------------- | ------------------------------------- |
| **Enforcement** | SHOULD                                |
| **Automation**  | Manual review                         |
| **Applies to**  | Machine-readable error categorization |

**Rule Statement**:
Error type enums SHOULD be used for machine-readable categorization in result types.

**Correct Examples**:

```typescript
// CORRECT: Error type enum for categorization
export enum ToolErrorType {
  // General
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  EXECUTION_FAILED = 'execution_failed',
  UNHANDLED_EXCEPTION = 'unhandled_exception',

  // File system
  FILE_NOT_FOUND = 'file_not_found',
  PERMISSION_DENIED = 'permission_denied',
  NO_SPACE_LEFT = 'no_space_left',

  // Tool-specific
  EDIT_NO_OCCURRENCE_FOUND = 'edit_no_occurrence_found',
  SHELL_EXECUTE_ERROR = 'shell_execute_error',
}
```

**Rationale**:
Enums provide type-safe error categorization for programmatic error handling.

---

#### Rule 3.8.4: Retryable vs Terminal Errors

| Attribute       | Value                       |
| --------------- | --------------------------- |
| **Enforcement** | SHOULD                      |
| **Automation**  | Manual review               |
| **Applies to**  | Errors with retry semantics |

**Rule Statement**:
Errors with retry semantics SHOULD use `Retryable*Error` or `Terminal*Error` prefix to indicate retry behavior.

**Correct Examples**:

```typescript
// CORRECT: Retryable error with delay hint
class RetryableQuotaError extends Error {
  constructor(
    message: string,
    readonly retryDelayMs: number,
    readonly cause?: Error
  ) {
    super(message);
    this.name = 'RetryableQuotaError';
  }
}

// CORRECT: Terminal error (no retry possible)
class TerminalQuotaError extends Error {
  constructor(
    message: string,
    readonly cause?: Error
  ) {
    super(message);
    this.name = 'TerminalQuotaError';
  }
}
```

**Rationale**:
Explicit naming communicates retry semantics without requiring code inspection.

---

#### Rule 3.8.5: Error Type Guards

| Attribute       | Value                         |
| --------------- | ----------------------------- |
| **Enforcement** | SHOULD                        |
| **Automation**  | Manual review                 |
| **Applies to**  | Error type checking functions |

**Rule Statement**:
Error type guard functions SHOULD use `is*Error` or `isFatal*` naming pattern.

**Correct Examples**:

```typescript
// CORRECT: Error type guards
function isFatalToolError(errorType?: string): boolean {
  const fatalErrors = new Set([ToolErrorType.NO_SPACE_LEFT]);
  return errorType ? fatalErrors.has(errorType as ToolErrorType) : false;
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'error' in error;
}

function isRetryableError(error: Error): error is RetryableQuotaError {
  return error.name === 'RetryableQuotaError';
}
```

**Rationale**:
Consistent type guard naming makes error handling code predictable.

---

#### Rule 3.8.6: ToolResult Error Structure

| Attribute       | Value                                         |
| --------------- | --------------------------------------------- |
| **Enforcement** | MUST                                          |
| **Automation**  | Manual review                                 |
| **Applies to**  | Tool result interfaces with error information |

**Rule Statement**:
Tool result interfaces SHALL include an optional `error` property with `message` and optional `type` fields.

**Correct Examples**:

```typescript
// CORRECT: ToolResult with error structure
interface ToolResult {
  llmContent: string;
  returnDisplay: string;
  error?: {
    message: string;
    type?: ToolErrorType;
  };
}
```

**Rationale**:
Standardized error structure enables consistent error handling across all tools.

---

### 3.9 API Naming

#### Rule 3.9.1: REST Endpoint Naming

| Attribute       | Value              |
| --------------- | ------------------ |
| **Enforcement** | MUST               |
| **Automation**  | Manual review      |
| **Applies to**  | REST API endpoints |

**Rule Statement**:
REST endpoints SHALL use plural nouns in `kebab-case`. Endpoints SHALL NOT contain verbs.

**Correct Examples**:

```typescript
// CORRECT: Plural nouns, kebab-case
GET  /users
POST /users
GET  /users/:id
GET  /user-preferences
POST /order-items
```

**Incorrect Examples**:

```typescript
// INCORRECT: Verbs or wrong casing
GET / getUsers; // Verb in URL
POST / createOrder; // Verb in URL
GET / userPreferences; // Wrong casing (should be kebab-case)
GET / user; // Singular (should be plural)
```

---

#### Rule 3.9.2: Query Parameter Naming

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | MUST                      |
| **Automation**  | Manual review             |
| **Applies to**  | REST API query parameters |

**Rule Statement**:
Query parameters SHALL use `camelCase`. Standard pagination and filtering parameters SHALL use consistent names.

**Standard Query Parameters**:

| Parameter | Purpose                 | Example           |
| --------- | ----------------------- | ----------------- |
| `limit`   | Maximum items to return | `?limit=20`       |
| `offset`  | Number of items to skip | `?offset=40`      |
| `sort`    | Sort field              | `?sort=createdAt` |
| `order`   | Sort direction          | `?order=desc`     |
| `filter`  | Filter criteria         | `?filter=active`  |
| `search`  | Search term             | `?search=john`    |

**Correct Examples**:

```typescript
// CORRECT: camelCase query parameters
GET /users?sortBy=createdAt&filterBy=active
GET /orders?limit=20&offset=0
GET /products?search=laptop&priceMin=100
```

**Incorrect Examples**:

```typescript
// INCORRECT: Wrong casing
GET /users?sort_by=created_at    // Should be camelCase
GET /users?SortBy=CreatedAt      // Should be camelCase
```

---

#### Rule 3.9.3: GraphQL Naming Conventions

| Attribute       | Value           |
| --------------- | --------------- |
| **Enforcement** | MUST            |
| **Automation**  | Manual review   |
| **Applies to**  | GraphQL schemas |

**Rule Statement**:
GraphQL schemas SHALL follow these naming conventions for consistency.

**GraphQL Naming Rules**:

| Element     | Convention                           | Example                     |
| ----------- | ------------------------------------ | --------------------------- |
| Types       | PascalCase                           | `User`, `OrderItem`         |
| Fields      | camelCase                            | `firstName`, `orderDate`    |
| Queries     | camelCase nouns (no get/list prefix) | `user`, `orders`            |
| Mutations   | camelCase with verb prefix           | `createUser`, `updateOrder` |
| Enum values | SCREAMING_SNAKE_CASE                 | `PENDING`, `IN_PROGRESS`    |
| Input types | PascalCase + Input suffix            | `CreateUserInput`           |

**Correct Examples**:

```graphql
# CORRECT: GraphQL naming
type User {
  id: ID!
  firstName: String!
  lastName: String!
  createdAt: DateTime!
}

type Query {
  user(id: ID!): User # No 'get' prefix
  users(limit: Int): [User!]! # No 'list' prefix
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

input CreateUserInput {
  firstName: String!
  lastName: String!
  email: String!
}
```

**Incorrect Examples**:

```graphql
# INCORRECT: Wrong naming patterns
type Query {
  getUser(id: ID!): User # Don't use 'get' prefix
  listUsers: [User!]! # Don't use 'list' prefix
}

enum OrderStatus {
  Pending # Should be SCREAMING_SNAKE_CASE
  inProgress # Should be SCREAMING_SNAKE_CASE
}
```

**Rationale**:
GraphQL conventions differ from REST; queries are nouns because the query type itself implies "get".

---

### 3.10 Packages & Modules

#### Rule 3.10.1: npm Package Naming

| Attribute       | Value                  |
| --------------- | ---------------------- |
| **Enforcement** | MUST                   |
| **Automation**  | npm publish validation |
| **Applies to**  | npm package names      |

**Rule Statement**:
npm packages SHALL use `lowercase-kebab-case`. Scoped packages SHALL use `@organization/package-name` format.

**Valid Patterns**:

| Pattern        | Example                   |
| -------------- | ------------------------- |
| Simple package | `flowmaster-cli`          |
| Scoped package | `@flowmaster/core`        |
| Plugin package | `@flowmaster/plugin-jira` |

**Correct Examples**:

```json
// CORRECT: Package naming
{
  "name": "flowmaster-cli",
  "name": "@flowmaster/core",
  "name": "@flowmaster/plugin-github"
}
```

**Incorrect Examples**:

```json
// INCORRECT: Invalid package names
{
  "name": "flowMasterCli", // No camelCase
  "name": "FlowMaster_CLI", // No PascalCase or underscores
  "name": "@FlowMaster/core" // Scope must be lowercase
}
```

---

#### Rule 3.10.2: Module Export Conventions

| Attribute       | Value          |
| --------------- | -------------- |
| **Enforcement** | SHOULD         |
| **Automation**  | ESLint         |
| **Applies to**  | Module exports |

**Rule Statement**:
Modules SHOULD prefer named exports over default exports. Exception: oclif commands use default exports.

**Correct Examples**:

```typescript
// CORRECT: Named exports (preferred)
export { WorkflowExecutor } from './workflowExecutor.js';
export { executeCommand } from './commands.js';
export type { WorkflowConfig } from './types.js';

// CORRECT: Barrel file (index.ts)
export { UserService } from './userService.js';
export { AuthService } from './authService.js';
export * from './types.js';

// CORRECT: oclif command (exception - default export required)
export default class RunCommand extends Command {
  // ...
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Default export for non-command modules
export default class UserService {} // Use named export

// INCORRECT: Renamed exports without reason
export { UserService as US } from './userService.js'; // Keep original name
```

**Rationale**:
Named exports enable tree-shaking, improve refactoring safety, and provide better IDE support.

---

### 3.11 Logging Standards

#### Rule 3.11.1: Log Levels

| Attribute       | Value                  |
| --------------- | ---------------------- |
| **Enforcement** | MUST                   |
| **Automation**  | Manual review          |
| **Applies to**  | All logging statements |

**Rule Statement**:
Log statements SHALL use appropriate log levels based on the severity and purpose.

**Log Level Definitions**:

| Level   | Use Case                                     | Example                                      |
| ------- | -------------------------------------------- | -------------------------------------------- |
| `DEBUG` | Development troubleshooting, verbose details | Variable values, function entry/exit         |
| `INFO`  | Significant application events               | Workflow started, task completed             |
| `WARN`  | Unexpected but recoverable situations        | Retry attempt, deprecated usage              |
| `ERROR` | Operation failures requiring attention       | API call failed, validation error            |
| `FATAL` | Application cannot continue                  | Missing required config, unrecoverable state |

**Correct Examples**:

```typescript
// CORRECT: Appropriate log levels
logger.debug('Processing item', { itemId, step: 3 });
logger.info('Workflow completed', { workflowId, duration: 4500 });
logger.warn('Retrying API call', { attempt: 2, maxAttempts: 3 });
logger.error('Failed to save document', { documentId, error: err.message });
logger.fatal('Configuration file not found', { path: configPath });
```

---

#### Rule 3.11.2: Log Message Format

| Attribute       | Value               |
| --------------- | ------------------- |
| **Enforcement** | SHOULD              |
| **Automation**  | Manual review       |
| **Applies to**  | Log message content |

**Rule Statement**:
Log messages SHOULD be human-readable, include relevant context, and use structured logging format.

**Message Guidelines**:

| Guideline                 | Good                         | Bad                           |
| ------------------------- | ---------------------------- | ----------------------------- |
| Human-readable            | "Workflow completed"         | "wf_done"                     |
| Include context           | `{ taskId: 'AL-123' }`       | Just the message              |
| No implementation details | "User authentication failed" | "JWT decode error at line 42" |
| Consistent structure      | JSON format                  | Mixed formats                 |

**Correct Examples**:

```typescript
// CORRECT: Structured logging with context
logger.info('Workflow completed', {
  taskId: 'AL-123',
  workflowName: 'plan-implement',
  durationMs: 45000,
  phaseCount: 3,
});

logger.error('API request failed', {
  endpoint: '/api/users',
  statusCode: 500,
  requestId: 'req-abc-123',
  retryable: true,
});
```

**Incorrect Examples**:

```typescript
// INCORRECT: Poor logging practices
logger.info('workflow done'); // No context
logger.error(`Error: ${err.stack}`); // Stack trace in message
console.log('DEBUG: user =', user); // Using console.log
logger.info('Processing ' + itemId + '...'); // String concatenation
```

**Rationale**:
Structured logging enables log aggregation, searching, and alerting in production systems.

---

### 3.12 Testing Conventions

#### Rule 3.12.1: Test File Naming

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | MUST                      |
| **Automation**  | Test runner configuration |
| **Applies to**  | Test files                |

**Rule Statement**:
Test files SHALL mirror source file names with `.test.ts` extension and SHALL be co-located with source files.

**Correct Examples**:

```
# CORRECT: Test file structure (co-located)
src/lib/workflow/executor.ts
src/lib/workflow/executor.test.ts

src/services/userService.ts
src/services/userService.test.ts

src/commands/run.ts
src/commands/run.test.ts
```

**Incorrect Examples**:

```
# INCORRECT: Wrong patterns
src/services/userService.ts
src/services/userService.spec.ts     # Wrong extension (use .test.ts)
test/services/userService.test.ts    # Parallel structure (use co-located)
test/userServiceTests.ts             # Wrong naming pattern
```

---

#### Rule 3.12.2: Test Function Naming

| Attribute       | Value             |
| --------------- | ----------------- |
| **Enforcement** | SHOULD            |
| **Automation**  | Manual review     |
| **Applies to**  | Test descriptions |

**Rule Statement**:
Test functions SHOULD use describe/it blocks with descriptive names following the pattern: "should [expected behavior] when [condition]".

**Correct Examples**:

```typescript
// CORRECT: Descriptive test structure
describe('WorkflowExecutor', () => {
  describe('execute', () => {
    it('should complete workflow when all phases succeed', async () => {
      // ...
    });

    it('should retry failed phase up to max retries', async () => {
      // ...
    });

    it('should throw FatalError when phase exceeds retry limit', async () => {
      // ...
    });
  });

  describe('cancel', () => {
    it('should stop execution when cancel is called', async () => {
      // ...
    });
  });
});
```

**Incorrect Examples**:

```typescript
// INCORRECT: Poor test naming
describe('WorkflowExecutor', () => {
  it('works', () => {}); // Too vague
  it('test execute function', () => {}); // Describes what, not behavior
  it('execute', () => {}); // No behavior description
});
```

---

#### Rule 3.12.3: Mock and Fixture Naming

| Attribute       | Value                     |
| --------------- | ------------------------- |
| **Enforcement** | SHOULD                    |
| **Automation**  | Manual review             |
| **Applies to**  | Test doubles and fixtures |

**Rule Statement**:
Test doubles SHOULD use consistent prefixes to indicate their type.

**Naming Prefixes**:

| Prefix    | Use For                              | Example                |
| --------- | ------------------------------------ | ---------------------- |
| `mock*`   | Full mock objects with spied methods | `mockClaudeClient`     |
| `fake*`   | Simplified working implementations   | `fakeFileSystem`       |
| `stub*`   | Objects with predefined responses    | `stubApiResponse`      |
| `create*` | Factory functions for test data      | `createMockWorkflow()` |

**Correct Examples**:

```typescript
// CORRECT: Mock naming conventions
const mockClaudeClient = {
  execute: jest.fn(),
  stream: jest.fn(),
};

const fakeFileSystem = new InMemoryFileSystem();

const stubApiResponse = {
  status: 200,
  data: { id: '123' },
};

function createMockWorkflow(overrides?: Partial<Workflow>): Workflow {
  return {
    name: 'test-workflow',
    phases: [],
    ...overrides,
  };
}

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    ...overrides,
  };
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Inconsistent mock naming
const client = { execute: jest.fn() }; // Missing 'mock' prefix
const testWorkflow = { name: 'test' }; // Use 'createMock*' factory
const dummyUser = { id: '1' }; // Use 'stub*' or 'createMock*'
```

**Rationale**:
Consistent test double naming makes test code self-documenting and clarifies the role of each test object.

---

## 4. Lookup Tables

### 4.1 Casing Summary

| Entity Type           | Convention               | Example                           |
| --------------------- | ------------------------ | --------------------------------- |
| Local variable        | camelCase                | `userName`                        |
| Boolean variable      | camelCase + prefix       | `isActive`, `hasPermission`       |
| Module constant       | UPPER_SNAKE_CASE         | `MAX_RETRIES`                     |
| Function              | camelCase                | `getUserById`                     |
| Class                 | PascalCase               | `UserService`                     |
| Interface             | PascalCase (no I prefix) | `User`                            |
| Type alias            | PascalCase               | `UserId`                          |
| Enum name             | PascalCase               | `HttpStatusCode`, `AgentEvent`    |
| Enum member (general) | UPPER_SNAKE_CASE         | `NOT_FOUND`, `INTERNAL_ERROR`     |
| Enum member (events)  | PascalCase               | `Created`, `Started`, `Completed` |
| Generic (simple)      | Single uppercase         | `T`, `K`, `V`                     |
| Generic (complex)     | T + PascalCase           | `TInput`, `TOutput`               |
| Private method        | \_camelCase              | `_registerToolCall`               |
| Type guard            | is\*                     | `isApiError`                      |
| Zod schema            | camelCaseSchema          | `userSchema`                      |
| Hook return type      | Use\*Return              | `UseSelectionListReturn`          |
| TS file               | camelCase.ts             | `userService.ts`                  |
| React file            | PascalCase.tsx           | `UserProfile.tsx`                 |
| Test file             | \*.test.ts               | `userService.test.ts`             |
| Directory             | kebab-case               | `user-services/`                  |
| npm package           | kebab-case               | `@flowmaster/core`                |
| API endpoint          | /kebab-case              | `/user-preferences`               |
| Query parameter       | camelCase                | `?sortBy=createdAt`               |
| Event value           | kebab-case               | `'user-created'`                  |
| Telemetry             | dot.snake_case           | `'app.user_created'`              |
| Mock object           | mock\*                   | `mockClaudeClient`                |
| Test factory          | createMock\*             | `createMockWorkflow()`            |

### 4.2 Boolean Prefixes

| Prefix    | Purpose         | Example                     |
| --------- | --------------- | --------------------------- |
| `is*`     | State/condition | `isActive`, `isValid`       |
| `has*`    | Existence       | `hasError`, `hasPermission` |
| `can*`    | Capability      | `canEdit`, `canRetry`       |
| `should*` | Decision        | `shouldRetry`, `shouldSkip` |

### 4.3 Function Verb Vocabulary

| Verb                | Purpose              | Example                     |
| ------------------- | -------------------- | --------------------------- |
| `get*`              | Retrieve             | `getUserById()`             |
| `set*`              | Update               | `setActiveStatus()`         |
| `create*`           | Instantiate          | `createSession()`           |
| `load*`             | From storage         | `loadConfiguration()`       |
| `save*`             | To storage           | `savePreferences()`         |
| `register*`         | Add to registry      | `registerHandler()`         |
| `add*`/`remove*`    | Collection ops       | `addItem()`, `removeItem()` |
| `check*`            | Validate (no throw)  | `checkPermissions()`        |
| `validate*`         | Validate (may throw) | `validateInput()`           |
| `handle*`           | Process event        | `handleRequest()`           |
| `on*`               | Register callback    | `onComplete()`              |
| `parse*`            | Transform            | `parseConfig()`             |
| `build*`            | Construct            | `buildQuery()`              |
| `process*`          | Pipeline             | `processPayment()`          |
| `initialize*`       | Setup                | `initializeApp()`           |
| `ensure*`           | Guarantee            | `ensureExists()`            |
| `is*`/`has*`/`can*` | Boolean query        | `isValid()`, `hasData()`    |
| `list*`             | Enumerate            | `listWorkflows()`           |
| `resolve*`          | Lookup/dereference   | `resolveCommand()`          |
| `clear*`            | Remove/reset         | `clearCredentials()`        |
| `discover*`         | Find dynamically     | `discoverPlugins()`         |
| `merge*`            | Combine inputs       | `mergeConfigs()`            |

### 4.4 Class Role Suffixes

| Suffix       | Responsibility             | Has State |
| ------------ | -------------------------- | --------- |
| `*Service`   | Stateless business logic   | No        |
| `*Manager`   | Resource lifecycle         | May       |
| `*Registry`  | Store/retrieve items       | Yes       |
| `*Client`    | External API communication | No        |
| `*Loader`    | Load resources             | No        |
| `*Scheduler` | Schedule operations        | Yes       |
| `*Executor`  | Execute commands           | No        |
| `*Factory`   | Create instances           | No        |
| `*Handler`   | Handle events              | No        |
| `*Validator` | Validate data              | No        |
| `*Builder`   | Construct objects          | Temp      |
| `*Resolver`  | Resolve references         | No        |

---

## 5. Anti-Patterns

### 5.1 Forbidden Patterns

| Pattern                             | Why Forbidden                   | Correct Alternative               | Severity |
| ----------------------------------- | ------------------------------- | --------------------------------- | -------- |
| Abbreviations (except allowed list) | Ambiguous, hard to search       | Use full words                    | High     |
| Boolean without prefix              | Type unclear                    | Add `is*`/`has*`/`can*`/`should*` | High     |
| Verb class names                    | Classes are things, not actions | Use noun + role suffix            | High     |
| `I` prefix on interfaces            | Hungarian notation deprecated   | Remove prefix                     | Medium   |
| `Async` suffix on functions         | Redundant with Promise return   | Remove suffix                     | Medium   |
| String error codes (`ERR_XXX`)      | Not type-safe                   | Use error class hierarchy         | High     |
| Verbs in REST URLs                  | Non-RESTful                     | Use noun resources                | Medium   |
| camelCase directories               | Inconsistent                    | Use kebab-case                    | Medium   |

### 5.2 Common Violations

```typescript
// VIOLATION: Abbreviated variable names
const cfg = loadConfig();
const usr = getUser();
const msg = formatMessage();

// FIX: Use full descriptive names
const configuration = loadConfig();
const user = getUser();
const formattedMessage = formatMessage();
```

```typescript
// VIOLATION: Boolean without prefix
const valid = email.includes('@');
const permission = user.role === 'admin';

// FIX: Add boolean prefix
const isValid = email.includes('@');
const hasPermission = user.role === 'admin';
```

```typescript
// VIOLATION: Verb class name
class ProcessPayment {}
class HandleRequest {}

// FIX: Use noun with role suffix
class PaymentProcessor {} // or PaymentService
class RequestHandler {}
```

```typescript
// VIOLATION: I prefix on interface
interface IUser {}
interface IPaymentGateway {}

// FIX: Remove I prefix
interface User {}
interface PaymentGateway {}
```

---

## 6. Decision Flowcharts

### 6.1 Choosing Variable Casing

```
What type of variable?
├─ Boolean value?
│   └─ Use camelCase with is*/has*/can*/should* prefix
├─ Module-level constant (immutable)?
│   └─ Use UPPER_SNAKE_CASE (include units if applicable)
├─ Local variable?
│   └─ Use camelCase with descriptive name
└─ Destructured property?
    ├─ Name collision in scope?
    │   └─ Rename with descriptive suffix
    └─ No collision?
        └─ Keep original property name
```

### 6.2 Choosing Function Name Verb

```
What does the function do?
├─ Returns data without side effects?
│   └─ get* (e.g., getUserById)
├─ Modifies state?
│   └─ set* (e.g., setActiveStatus)
├─ Creates new instance?
│   └─ create* (e.g., createSession)
├─ Loads from external source?
│   └─ load* (e.g., loadConfiguration)
├─ Persists to storage?
│   └─ save* (e.g., saveDocument)
├─ Returns boolean?
│   ├─ Checks state/condition?
│   │   └─ is* (e.g., isValid)
│   ├─ Checks existence?
│   │   └─ has* (e.g., hasPermission)
│   └─ Checks capability?
│       └─ can* (e.g., canRetry)
├─ Processes event/request?
│   └─ handle* (e.g., handleRequest)
├─ Transforms data?
│   └─ parse* or process* (e.g., parseConfig)
└─ Ensures condition?
    └─ ensure* (e.g., ensureDirectoryExists)
```

### 6.3 Choosing Class Role Suffix

```
What is the class responsibility?
├─ Stateless business logic?
│   └─ *Service (e.g., AuthenticationService)
├─ Manages resource lifecycle?
│   └─ *Manager (e.g., ConnectionManager)
├─ Stores and retrieves registered items?
│   └─ *Registry (e.g., PluginRegistry)
├─ Communicates with external API?
│   └─ *Client (e.g., HttpClient)
├─ Loads resources from storage?
│   └─ *Loader (e.g., ConfigLoader)
├─ Handles events or requests?
│   └─ *Handler (e.g., ErrorHandler)
├─ Validates data?
│   └─ *Validator (e.g., InputValidator)
├─ Creates complex objects?
│   └─ *Factory or *Builder
└─ None of the above?
    └─ Reconsider design or use plain noun
```

---

## 7. Enforcement

### 7.1 ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Rule 3.1.1, 3.1.3, 3.3.1, 3.4.1, 3.5.1: Casing rules
    '@typescript-eslint/naming-convention': [
      'error',
      // Local variables: camelCase
      {
        selector: 'variable',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      // Module constants: UPPER_CASE
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['UPPER_CASE', 'camelCase'],
      },
      // Functions: camelCase
      {
        selector: 'function',
        format: ['camelCase'],
      },
      // Classes: PascalCase
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      // Interfaces: PascalCase, no I prefix
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      // Type aliases: PascalCase
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      // Enum: PascalCase
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      // Enum members: UPPER_CASE
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      // Private methods: camelCase with underscore
      {
        selector: 'classMethod',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
    ],
  },
};
```

### 7.2 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 7.3 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit - Validates naming conventions

# Run ESLint naming convention rules
npx eslint --rule '@typescript-eslint/naming-convention: error' --max-warnings 0 .

# Check for I-prefixed interfaces
if grep -r "interface I[A-Z]" src/; then
  echo "ERROR: Found I-prefixed interface. Remove the I prefix."
  exit 1
fi

echo "Naming convention checks passed"
```

### 7.4 Code Review Checklist

- [ ] All variables use camelCase
- [ ] All booleans have is*/has*/can*/should* prefix
- [ ] Module constants use UPPER_SNAKE_CASE with units
- [ ] Functions start with approved verb
- [ ] Classes use PascalCase nouns with role suffix
- [ ] Interfaces have no I prefix
- [ ] No abbreviations except allowed list
- [ ] File names match convention (camelCase.ts, PascalCase.tsx)
- [ ] Directory names use kebab-case

---

## 8. Exceptions

### 8.1 Valid Exception Scenarios

| Scenario                    | Justification Required                    | Documentation                    |
| --------------------------- | ----------------------------------------- | -------------------------------- |
| Third-party API field names | External API uses different convention    | Comment with API reference link  |
| Database column mapping     | Database schema uses different convention | Comment with schema reference    |
| Framework requirements      | Framework mandates specific pattern       | Comment with framework docs link |
| Legacy code migration       | Gradual migration in progress             | Migration ticket reference       |

### 8.2 Exception Documentation Format

```typescript
/**
 * NAMING EXCEPTION: STD-001 Rule 3.4.1
 * Reason: Matches Jira REST API field names for direct deserialization.
 * Reference: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 * Do not rename to maintain API contract compatibility.
 */
export interface JiraIssueResponse {
  issue_key: string; // Exception: Jira API uses snake_case
  created_at: string; // Exception: Jira API uses snake_case
}
```

### 8.3 Exception Registry

| Exception ID | Rule  | Location                | Justification          | Status    |
| ------------ | ----- | ----------------------- | ---------------------- | --------- |
| EX-001       | 3.4.1 | `src/api/jira/types.ts` | Jira API compatibility | Permanent |

### 8.4 Third-Party Integration Pattern

When integrating with external libraries that use different naming conventions, create local type aliases to maintain internal consistency.

**Pattern**:

```typescript
// CORRECT: Create local aliases for external types
import { user_data } from 'external-library';

// Re-export with standard naming
export type UserData = user_data;

// Or transform at the boundary
function transformExternalUser(external: user_data): User {
  return {
    userId: external.user_id,
    emailAddress: external.email_addr,
    isActive: external.is_active,
  };
}
```

**When to Use**:

- External library uses snake_case or other non-standard conventions
- API response types need to match our internal conventions
- Legacy code being gradually migrated

**Documentation Requirement**:

```typescript
/**
 * THIRD-PARTY INTEGRATION: external-library v2.1.0
 * Original type uses snake_case per library convention.
 * Local alias maintains internal naming standards.
 */
export type UserData = user_data;
```

---

## 9. Quick Reference

### 9.1 Most Important Rules

1. **Variables**: `camelCase`, booleans need `is*/has*/can*/should*` prefix
2. **Constants**: `UPPER_SNAKE_CASE` with units (e.g., `TIMEOUT_MS`)
3. **Functions**: `camelCase`, start with verb from approved list
4. **Classes**: `PascalCase` noun + role suffix (`*Service`, `*Manager`, etc.)
5. **Interfaces**: `PascalCase`, NO `I` prefix
6. **Enums**: `PascalCase` name; members: `UPPER_SNAKE_CASE` (general) or `PascalCase` (events)
7. **Event Enums**: Domain-specific with short members (`AgentEvent.Created`, not `AgentEvent.AgentCreated`)
8. **Files**: `camelCase.ts` for TS, `PascalCase.tsx` for React
9. **Directories**: `kebab-case`, plural nouns

### 9.2 Cheat Sheet

```
Variable       → camelCase           userName
Boolean        → is/has/can/should   isActive, hasError
Constant       → UPPER_SNAKE_CASE    MAX_RETRY_COUNT
Function       → verb + camelCase    getUserById()
Class          → PascalCase + Role   UserService
Interface      → PascalCase          User (NOT IUser)
Type           → PascalCase          UserId
Enum           → PascalCase          HttpStatusCode
Enum Member    → UPPER_SNAKE_CASE    NOT_FOUND (general)
Event Enum     → PascalCase          AgentEvent.Created
Event Value    → kebab-case          'agent-created'
Private Method → _camelCase          _processInternal()
File (TS)      → camelCase.ts        userService.ts
File (React)   → PascalCase.tsx      UserProfile.tsx
Directory      → kebab-case          user-services/
```

---

## 10. Traceability

### 10.1 Rules Index

| Rule ID | Title                        | Enforcement | Automation    |
| ------- | ---------------------------- | ----------- | ------------- |
| 3.1.1   | Local Variable Casing        | MUST        | ESLint        |
| 3.1.2   | Boolean Variable Prefixes    | MUST        | ESLint custom |
| 3.1.3   | Module-Level Constants       | MUST        | ESLint        |
| 3.1.4   | Allowed Abbreviations        | MUST        | Manual        |
| 3.1.5   | Destructuring                | SHOULD      | Manual        |
| 3.2.1   | Function Naming Pattern      | MUST        | Manual        |
| 3.2.2   | Boolean Query Methods        | MUST        | Manual        |
| 3.2.3   | Async Function Naming        | MUST NOT    | ESLint custom |
| 3.2.4   | Type Guard Functions         | MUST        | Manual        |
| 3.2.5   | Private Methods              | MUST        | ESLint        |
| 3.3.1   | Class Naming Convention      | MUST        | ESLint        |
| 3.3.2   | Role-Based Class Suffixes    | MUST        | Manual        |
| 3.4.1   | Interface Naming             | MUST        | ESLint        |
| 3.4.2   | Type Alias Naming            | MUST        | ESLint        |
| 3.4.3   | Generic Type Parameters      | MUST        | Manual        |
| 3.4.4   | Data Structure Suffixes      | MUST        | Manual        |
| 3.4.5   | Zod Schema Naming            | MUST        | Manual        |
| 3.4.6   | Discriminated Unions         | MUST        | Manual        |
| 3.4.7   | Hook Return Types            | SHOULD      | Manual        |
| 3.5.1   | Enum Naming Convention       | MUST        | ESLint        |
| 3.5.2   | Enum String Values           | SHOULD      | Manual        |
| 3.5.3   | Literal Union Types          | MUST        | Manual        |
| 3.6.1   | TypeScript File Naming       | MUST        | CI            |
| 3.6.2   | Directory Naming             | MUST        | CI            |
| 3.7.1   | Event Enum Naming            | MUST        | Manual        |
| 3.7.2   | Telemetry Event Constants    | MUST        | Manual        |
| 3.7.3   | Event vs Command Naming      | MUST        | Manual        |
| 3.7.4   | Typed Event Emitter Pattern  | SHOULD      | Manual        |
| 3.8.1   | Error Class Naming           | MUST        | Manual        |
| 3.8.2   | Error Class Hierarchy        | MUST        | Manual        |
| 3.8.3   | Error Type Enums             | SHOULD      | Manual        |
| 3.8.4   | Retryable vs Terminal Errors | SHOULD      | Manual        |
| 3.8.5   | Error Type Guards            | SHOULD      | Manual        |
| 3.8.6   | ToolResult Error Structure   | MUST        | Manual        |
| 3.9.1   | REST Endpoint Naming         | MUST        | Manual        |
| 3.9.2   | Query Parameter Naming       | MUST        | Manual        |
| 3.9.3   | GraphQL Naming Conventions   | MUST        | Manual        |
| 3.10.1  | npm Package Naming           | MUST        | npm           |
| 3.10.2  | Module Export Conventions    | SHOULD      | ESLint        |
| 3.11.1  | Log Levels                   | MUST        | Manual        |
| 3.11.2  | Log Message Format           | SHOULD      | Manual        |
| 3.12.1  | Test File Naming             | MUST        | Test runner   |
| 3.12.2  | Test Function Naming         | SHOULD      | Manual        |
| 3.12.3  | Mock and Fixture Naming      | SHOULD      | Manual        |

### 10.2 Related Standards

| Standard               | Relationship                        |
| ---------------------- | ----------------------------------- |
| STD-003 Code Style     | Complements with formatting rules   |
| STD-004 Architecture   | Uses role suffix definitions        |
| STD-006 Testing        | Extends test naming patterns (3.12) |
| STD-007 Error Handling | Extends error naming patterns (3.8) |
| STD-012 CLI Design     | Extends command naming patterns     |
| STD-013 Logging        | Extends logging standards (3.11)    |

---

## 11. Open Questions

| Question ID | Question                                                  | Owner | Status                         |
| ----------- | --------------------------------------------------------- | ----- | ------------------------------ |
| NQ-001      | Should we allow `Err` as abbreviation for Error in types? | Team  | Pending                        |
| NQ-002      | Should React hook return types use `Use*Return` pattern?  | Team  | Resolved - Yes, see Rule 3.4.7 |

---

## Document History

| Version | Date       | Author            | Changes                                           |
| ------- | ---------- | ----------------- | ------------------------------------------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version from legacy naming-conventions.md |
