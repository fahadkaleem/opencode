# Naming Conventions

Reference: `design/09-coding-standards/standards-reference/01-naming-conventions.md`

<naming_rules>

## Variables & Constants

- **Local Variables**: Use `camelCase` with fully descriptive names. Short names hide intent and force readers to trace definitions.
  - ✓ `userSession`, `retryCount`, `configPath`
  - ✗ `s`, `cnt`, `cfg`, `data`, `temp`

- **Booleans**: Prefix with `is*`, `has*`, `can*`, `should*` so conditionals read like English.
  - ✓ `if (isValid)`, `if (hasPermission)`, `if (canRetry)`
  - ✗ `if (valid)`, `if (permission)`, `if (retry)`

- **Module Constants**: Use `UPPER_SNAKE_CASE` with units in the name to prevent unit confusion.
  - ✓ `MAX_RETRY_COUNT`, `TIMEOUT_MS`, `CACHE_SIZE_BYTES`
  - ✗ `maxRetry`, `TIMEOUT`, `SIZE`

- **Abbreviations**: Only use these universally understood abbreviations: `id`, `db`, `url`, `http`, `api`, `json`, `xml`, `html`, `css`, `jwt`, `uuid`. Spell out everything else because abbreviations are ambiguous across teams.

## Functions & Methods

- **Function Names**: Use `camelCase` starting with an approved verb. The verb communicates intent and makes code self-documenting.

  Approved verbs: `get*`, `set*`, `create*`, `load*`, `save*`, `register*`, `unregister*`, `add*`/`remove*`, `check*`, `validate*`, `execute*`, `handle*`, `on*`, `parse*`, `build*`, `process*`, `initialize*`, `ensure*`, `enable*`/`disable*`, `wait*`, `cancel*`, `list*`, `resolve*`, `clear*`, `discover*`, `merge*`
  - ✓ `getUserById()`, `validateInput()`, `createSession()`
  - ✗ `user()`, `input()`, `session()`

- **Boolean-Returning Methods**: Use `is*`, `has*`, `can*`, `should*` so call sites read naturally.
  - ✓ `if (user.hasAccess())`, `validator.isValid(input)`
  - ✗ `if (user.access())`, `validator.check(input)`

- **Type Guards**: Use `is*` prefix returning `value is Type`. This matches TypeScript's type narrowing pattern.
  - ✓ `function isUser(value: unknown): value is User`

- **Async Functions**: Let the `Promise<T>` return type indicate async. Adding `Async` suffix is redundant noise.
  - ✓ `async function loadConfig(): Promise<Config>`
  - ✗ `async function loadConfigAsync(): Promise<Config>`

- **Private Methods**: Use both `private` keyword and `_` prefix. The underscore provides visual distinction in call sites where `private` isn't visible.
  - ✓ `private _validateInternal()`

## Classes & Types

- **Class Names**: Use `PascalCase` nouns that complete "This is a \_\_\_" naturally. Classes represent things, not actions.
  - ✓ `ConfigLoader`, `UserSession`, `MessageBus`
  - ✗ `LoadConfig`, `HandleUser`, `SendMessage`

- **Role Suffixes**: Match suffix to responsibility for instant recognition of a class's purpose:
  - `*Service` (stateless business logic), `*Manager` (lifecycle/state), `*Registry` (lookup collections)
  - `*Client` (external APIs), `*Loader` (resource loading), `*Handler` (event/request handling)
  - `*Executor` (task execution), `*Factory` (object creation), `*Builder` (step-by-step construction)
  - `*Validator` (data validation), `*Resolver` (reference resolution), `*Scheduler` (timing)

- **Interfaces**: Use `PascalCase` without `I` prefix. The prefix is Hungarian notation that TypeScript doesn't need.
  - ✓ `interface UserRepository`
  - ✗ `interface IUserRepository`

- **Type Aliases**: Use `PascalCase`. Types are first-class citizens like classes.

- **Generics**: Use `T`, `K`, `V`, `E`, `R` for simple cases; `TInput`, `TOutput`, `TResult` for complex cases where meaning isn't obvious.

- **Data Structure Suffixes**: Use semantic suffixes that describe the data's role:
  - Configuration: `*Config`, `*Settings`, `*Options`
  - Function params: `*Params`, `*Input`, `*Request`
  - Return values: `*Result`, `*Output`, `*Response`
  - State: `*State`, `*Context`, `*Snapshot`
  - Metadata: `*Info`, `*Details`, `*Metadata`, `*Definition`
  - Records: `*Entry`, `*Record`, `*Payload`, `*Event`, `*Error`
  - ✗ Avoid vague: `*Data`, `*Object`, `*ConfigOptions`

## Schemas & Enums

- **Zod Schemas**: Use `camelCase` + `Schema` suffix. Inferred types use matching `PascalCase` without `Schema`. This distinguishes runtime validators from compile-time types.
  - ✓ `const userSchema = z.object({...})` → `type User = z.infer<typeof userSchema>`

- **Discriminated Unions**: Use `type` or `status` as discriminator. These are conventional and tools recognize them.
  - ✓ `type: 'success' | 'error'` or `status: 'pending' | 'complete'`

- **Enums**: `PascalCase` name, `UPPER_SNAKE_CASE` members. Exception: Event enums use `PascalCase` members with `kebab-case` string values for cleaner event names.

  ```typescript
  enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
  }
  enum WorkflowEvent {
    PhaseStarted = 'phase-started',
  }
  ```

- **Literal Unions**: Use lowercase string values. These appear in JSON and lowercase is conventional.
  - ✓ `type Status = 'pending' | 'active' | 'complete'`

## Files & Directories

- **TypeScript Files**: `camelCase.ts` for modules; `PascalCase.tsx` for React components (matches component name).
  - ✓ `configLoader.ts`, `UserProfile.tsx`

- **Directories**: `kebab-case`, plural for collections. Lowercase with hyphens is cross-platform safe.
  - ✓ `services/`, `error-handlers/`, `api-clients/`

- **Test Files**: Co-locate with source using `.test.ts` suffix. Not `.spec.ts`.
  - ✓ `src/services/configLoader.test.ts` next to `src/services/configLoader.ts`

## Events & Errors

- **Event Names**: Past tense for state changes (`WorkflowCompleted`), nouns for content (`Message`), imperative for commands (`ExecutePhase`).

- **Telemetry Constants**: `SCREAMING_SNAKE_CASE` variable with `dot.snake_case` value for hierarchical namespacing.
  - ✓ `const WORKFLOW_STARTED = 'workflow.started'`

- **Error Classes**: `*Error` suffix; `Fatal*Error` for exit-code errors. Use a base `FatalError` class, not string codes like `ERR_XX_001`.
  - ✓ `class ValidationError`, `class FatalConfigError`

- **Error Type Guards**: Use `is*Error` / `isFatal*` pattern for type narrowing.

## APIs

- **REST Endpoints**: Plural nouns in `kebab-case`, no verbs. HTTP method implies action.
  - ✓ `GET /api/workflows`, `POST /api/workflow-runs`
  - ✗ `GET /api/getWorkflows`, `POST /api/createRun`

- **Query Params**: `camelCase` using standard names: `limit`, `offset`, `sort`, `order`, `filter`, `search`

- **GraphQL**: Types `PascalCase`; fields `camelCase`; queries are nouns (no `get*`); mutations use verb prefix; inputs use `*Input` suffix.

- **npm Packages**: `lowercase-kebab-case`; scoped: `@organization/package-name`

## Logging

Use appropriate levels so filtering works correctly:

- `DEBUG`: Troubleshooting details, verbose output
- `INFO`: Significant events (startup, shutdown, major operations)
- `WARN`: Recoverable unexpected conditions
- `ERROR`: Failures needing attention
- `FATAL`: Cannot continue, will exit

Prefer human-readable messages with structured context. Avoid `console.log` and implementation details in messages.

## Testing

- **Test Names**: `describe`/`it` blocks using `should <expected> when <condition>` pattern.
  - ✓ `it('should throw ValidationError when input is empty')`

- **Test Doubles**: `mock*` (mocks), `fake*` (working implementations), `stub*` (predefined responses), `create*` (test data factories).

</naming_rules>

## Preferences

- **Destructuring**: Preserve original property names; rename only for scope collisions.
- **Hook Returns**: Use `Use*Return` types matching hook names (e.g., `UseAuthReturn`).
- **Named Exports**: Prefer over default exports; exception: oclif commands require default.
- **Typed Event Emitters**: Use typed event maps with enum keys and payload tuple values.
- **Error Categorization**: Use enums for machine-readable error types in result types.
- **Retry Semantics**: Use `Retryable*Error` / `Terminal*Error` when retry behavior matters.

## Exceptions

When external constraints prevent following a rule:

- **Valid scenarios**: Third-party API field names, database column mapping, framework requirements, legacy migration
- **Documentation**: Add a block comment with justification and reference link
- **Boundary transformation**: Create local aliases or transform at integration boundaries; document library + version + rationale

## Verification Checklist

When reviewing code for naming compliance:

- [ ] Variables are `camelCase` and descriptive (no single letters except loop indices)
- [ ] Booleans have `is*`/`has*`/`can*`/`should*` prefix
- [ ] Constants are `UPPER_SNAKE_CASE` with units where applicable
- [ ] Functions start with approved verb and are `camelCase`
- [ ] Classes are `PascalCase` nouns with appropriate role suffix
- [ ] No `I` prefix on interfaces
- [ ] Zod schemas are `camelCase` + `Schema`, inferred types are `PascalCase`
- [ ] Files are `camelCase.ts` (modules) or `PascalCase.tsx` (React components)
- [ ] Directories are `kebab-case` and plural for collections
- [ ] Error classes end with `*Error`, fatal errors with `Fatal*Error`
- [ ] Test files use `.test.ts` suffix, co-located with source
- [ ] No unnecessary abbreviations (only allowed: id, db, url, http, api, json, xml, html, css, jwt, uuid)
- [ ] No `Async` suffix on async functions
